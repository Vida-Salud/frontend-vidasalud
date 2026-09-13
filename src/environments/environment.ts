export const environment = {
    production: true, // (o false en environment.development.ts)
    msal: {
        clientId: '58caa3bc-7099-470f-bfa1-2e7afcc2976f',
        tenantId: '245aec22-d743-4c13-a6e6-dce0a19bc1cf',
        redirectUri: '__REDIRECT_URI__', // ARG REDIRECT_URI
        postLogoutRedirectUri: '__POST_LOGOUT_REDIRECT_URI__' // ARG POST_LOGOUT_REDIRECT_URI
    },
    apiScope: 'api://fd189494-2ea3-4c54-91ed-5b5ddd644163/access_as_user',
    apiBaseUrl: '__API_BASE_URL__' // Reemplazado en el build de Docker (ARG API_BASE_URL)
};