# VidaSalud - Frontend

Aplicación web de la plataforma **VidaSalud**, desarrollada con Angular.

El frontend proporciona la interfaz de usuario para la administración de atenciones médicas, catálogo de prestaciones, boxes y cupos, además del acceso a módulos según los roles asignados a cada usuario.

La autenticación se realiza mediante **Microsoft Entra ID** utilizando MSAL.

## Tecnologías

- Angular 21
- TypeScript 5.9
- RxJS
- Angular Router
- Angular HttpClient
- Microsoft Authentication Library - MSAL
- Microsoft Entra ID / Azure AD
- Vitest
- Node.js
- npm
- Docker
- Nginx
- GitHub Actions

## Arquitectura

```text
Microsoft Entra ID
        │
        │ Login / Access Token
        ▼
┌──────────────────────┐
│   Angular Frontend   │
│                      │
│ MSAL                 │
│ Guards               │
│ Role Guards          │
│ Services             │
└──────────┬───────────┘
           │
           │ JWT
           ▼
┌──────────────────────┐
│  ms-vidasalud-bff    │
└──────────┬───────────┘
           │
     ┌─────┴─────┐
     ▼           ▼
  Catalog    Appointments
```

El frontend **no consume directamente los microservicios**.

Toda la comunicación backend se realiza a través de:

```text
ms-vidasalud-bff
```

## Funcionalidades

Actualmente la aplicación incluye:

- Autenticación mediante Microsoft Entra ID.
- Inicio y cierre de sesión.
- Obtención automática de Access Tokens.
- Lectura de App Roles desde el Access Token.
- Protección de rutas.
- Control de acceso según roles.
- Dashboard personalizado según usuario.
- Gestión de atenciones.
- Gestión del catálogo.
- Gestión de servicios médicos.
- Gestión de boxes.
- Gestión de cupos disponibles.
- Visualización de información del usuario.
- Vista de información del token.
- Página de acceso denegado.

Los módulos de **Reportería** y **Auditoría** cuentan actualmente con sus rutas y vistas base y se encuentran preparados para futuras funcionalidades.

## Roles

La aplicación contempla los siguientes roles:

```text
Admin
Operador
Cliente
Auditor
```

## Acceso por módulo

| Módulo | Admin | Operador | Cliente | Auditor |
|---|:---:|:---:|:---:|:---:|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Atenciones | ✅ | ✅ | ✅ | ❌ |
| Catálogo | ✅ | ✅ | ❌ | ❌ |
| Reportería | ✅ | ❌ | ❌ | ❌ |
| Auditoría | ✅ | ❌ | ❌ | ✅ |

Las restricciones del frontend mejoran la experiencia de usuario, pero la autorización definitiva también es aplicada en el BFF.

## Rutas

```text
/               Dashboard
/dashboard      Dashboard
/appointments   Atenciones
/catalog        Catálogo
/reports        Reportería
/audit          Auditoría
/token          Información del token
/forbidden      Acceso denegado
```

## Autenticación

La aplicación utiliza:

```text
@azure/msal-angular
@azure/msal-browser
```

El proceso general es:

```text
Usuario
   │
   ▼
Microsoft Entra ID
   │
   ▼
Access Token
   │
   ▼
Angular
   │
   ▼
MSAL Interceptor
   │
   ▼
BFF
```

El `MsalInterceptor` agrega automáticamente el Access Token a las solicitudes destinadas a la API protegida.

## Roles y Access Token

Los roles de VidaSalud se encuentran configurados como **App Roles** de la API en Microsoft Entra ID.

Por esta razón, los roles son obtenidos desde el claim:

```json
{
  "roles": [
    "Admin"
  ]
}
```

del **Access Token de la API**.

## Configuración de desarrollo

Archivo:

```text
src/environments/environment.development.ts
```

Configuración principal:

```typescript
apiBaseUrl: 'http://localhost:8090'
```

Por lo tanto, durante desarrollo el frontend se conecta al BFF mediante:

```text
http://localhost:8090
```

## Servidor de desarrollo

Instalar dependencias:

```bash
npm install
```

Ejecutar:

```bash
npm start
```

o:

```bash
ng serve
```

La aplicación estará disponible en:

```text
http://localhost:4200
```

## Compilar

```bash
npm run build
```

Los archivos generados son almacenados en:

```text
dist/frontend-vidasalud/
```

## Tests

Ejecutar:

```bash
npm test
```

El proyecto utiliza **Vitest** para las pruebas.

## Servicios Angular

### Atenciones

El frontend utiliza:

```text
AppointmentsService
```

que consume:

```text
/api/appointments
```

Funciones principales:

```text
listar()
crear()
cambiarEstado()
```

### Catálogo

El frontend utiliza:

```text
CatalogService
```

que consume:

```text
/api/catalog
```

Permite administrar:

```text
Servicios
Boxes
Cupos
```

## Guards

La aplicación posee distintos mecanismos de protección.

### MsalGuard

Comprueba que exista una sesión autenticada con Microsoft Entra ID.

### authGuard

Evita la navegación cuando no existe una sesión activa sin iniciar automáticamente un login interactivo.

### roleGuard

Valida los roles del usuario antes de permitir el acceso a determinadas rutas.

Ejemplo:

```typescript
roleGuard('Admin', 'Operador')
```

Si el usuario no posee un rol permitido es redirigido a:

```text
/forbidden
```

## Docker

La imagen utiliza un proceso multi-stage:

```text
Node.js
   │
   ▼
Angular Build
   │
   ▼
Nginx
```

Construir:

```bash
docker build \
  --build-arg API_BASE_URL=https://servidor-vidasalud \
  --build-arg REDIRECT_URI=https://servidor-vidasalud \
  --build-arg POST_LOGOUT_REDIRECT_URI=https://servidor-vidasalud \
  -t vidasalud/frontend .
```

Ejecutar:

```bash
docker run -p 80:80 -p 443:443 vidasalud/frontend
```

## HTTPS

La imagen Docker genera actualmente un certificado autofirmado para el ambiente de demostración.

Nginx escucha en:

```text
80  → redirección HTTPS
443 → aplicación Angular
```

Para un ambiente productivo se recomienda utilizar un certificado emitido por una autoridad certificadora o terminar TLS mediante un Load Balancer, Reverse Proxy o servicio administrado.

## Nginx

Además de servir la aplicación Angular, Nginx soporta el routing de la SPA.

Por ejemplo:

```text
/appointments
/catalog
/reports
/audit
```

son redirigidas correctamente hacia `index.html` para que Angular Router gestione la navegación.

Existe además configuración para reenviar solicitudes:

```text
/api/
```

hacia el BFF cuando los servicios se encuentran desplegados dentro de la misma red Docker.

## CI

El proyecto incluye un workflow de GitHub Actions:

```text
.github/workflows/ci.yml
```

El pipeline se ejecuta para:

```text
push → main
pull request → main
```

e incluye:

```text
npm ci
Angular build
Docker build
```

## Estructura principal

```text
src/
├── app/
│   ├── auth/
│   │   ├── auth.service.ts
│   │   ├── auth-guard.ts
│   │   └── role-guard.ts
│   ├── pages/
│   │   ├── appointments/
│   │   ├── audit/
│   │   ├── catalog/
│   │   ├── dashboard/
│   │   └── reports/
│   ├── profile/
│   ├── token-info/
│   ├── app.config.ts
│   └── app.routes.ts
├── environments/
├── index.html
├── main.ts
└── styles.css
```

## Ecosistema VidaSalud

```text
frontend-vidasalud
        │
        ▼
ms-vidasalud-bff
        │
        ├──────────────► ms-vidasalud-catalog
        │
        └──────────────► ms-vidasalud-appointments
                              │
                              ▼
                        Oracle Database
```

## Proyecto VidaSalud

VidaSalud utiliza una arquitectura desacoplada basada en frontend, BFF y microservicios de dominio, con autenticación y autorización centralizadas mediante Microsoft Entra ID.
