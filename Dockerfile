# syntax=docker/dockerfile:1

# ---------- Etapa 1: build de Angular ----------
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# URL base del API Manager (AWS API Gateway).
# Ej: --build-arg API_BASE_URL=https://xxxx.execute-api.us-east-1.amazonaws.com/prod
ARG API_BASE_URL=http://localhost:8080
# URIs de MSAL; deben coincidir EXACTAMENTE con las registradas en la App Registration (tipo SPA).
# Ej: --build-arg REDIRECT_URI=https://54.12.34.56
ARG REDIRECT_URI=http://localhost:4200
ARG POST_LOGOUT_REDIRECT_URI=http://localhost:4200

# Reemplaza los placeholders __NOMBRE__ de src/environments/environment.ts con los ARG
# (sin sed, para que caracteres como & | / en las URLs no requieran escape).
RUN <<'EOF'
node -e '
const fs = require("fs");
const file = "src/environments/environment.ts";
// nombre del ARG -> quitar "/" final (solo para la URL base de la API; los redirect URIs se usan tal cual)
const vars = { API_BASE_URL: true, REDIRECT_URI: false, POST_LOGOUT_REDIRECT_URI: false };
let src = fs.readFileSync(file, "utf8");
for (const [name, stripSlash] of Object.entries(vars)) {
  let value = (process.env[name] || "").trim();
  if (stripSlash) value = value.replace(/\/+$/, "");
  const placeholder = "__" + name + "__";
  if (!value) { console.error("ERROR: " + name + " está vacío"); process.exit(1); }
  if (!src.includes(placeholder)) { console.error("ERROR: placeholder " + placeholder + " no encontrado en " + file); process.exit(1); }
  src = src.split(placeholder).join(value);
  console.log(name + " = " + value);
}
fs.writeFileSync(file, src);
'
EOF

RUN npx ng build --configuration production

# ---------- Etapa 2: certificado autofirmado (solo demo) ----------
FROM alpine:3.20 AS cert

RUN apk add --no-cache openssl \
    && mkdir -p /ssl \
    && openssl req -x509 -nodes -newkey rsa:2048 -days 825 \
        -keyout /ssl/selfsigned.key \
        -out /ssl/selfsigned.crt \
        -subj "/C=CL/O=VidaSalud Demo/CN=vidasalud-frontend" \
        -addext "subjectAltName=DNS:vidasalud-frontend,DNS:localhost,IP:127.0.0.1"

# ---------- Etapa 3: Nginx sirviendo los estáticos por HTTPS ----------
FROM nginx:1.27-alpine

RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=cert /ssl /etc/nginx/ssl
RUN chmod 600 /etc/nginx/ssl/selfsigned.key

COPY --from=build /app/dist/frontend-vidasalud/browser /usr/share/nginx/html

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
