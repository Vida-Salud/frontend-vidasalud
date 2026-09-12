export const environment = {
    production: true,
    msal: {
        clientId: 'c32b07cd-d685-4826-8690-6bb8e91e5472',
        tenantId: '245aec22-d743-4c13-a6e6-dce0a19bc1cf',
        redirectUri: 'http://localhost:4200',
        postLogoutRedirectUri: 'http://localhost:4200'
    },
    apiScope: 'api://c32b07cd-d685-4826-8690-6bb8e91e5472/access_as_user',
    apiBaseUrl: 'http://localhost:8080'
};