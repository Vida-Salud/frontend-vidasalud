import { ApplicationConfig, provideZonelessChangeDetection, provideAppInitializer, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { routes } from './app.routes';

import {
    IPublicClientApplication,
    PublicClientApplication,
    InteractionType,
    BrowserCacheLocation
} from '@azure/msal-browser';

import {
    MsalGuard,
    MsalInterceptor,
    MSAL_INSTANCE,
    MSAL_GUARD_CONFIG,
    MSAL_INTERCEPTOR_CONFIG,
    MsalGuardConfiguration,
    MsalInterceptorConfiguration,
    MsalService,
    MsalBroadcastService
} from '@azure/msal-angular';

export function MSALInstanceFactory(): IPublicClientApplication {
    return new PublicClientApplication({
        auth: {
            clientId: '76355338-78b7-4c7f-a65b-aaf724e3a844',
            authority: 'https://login.microsoftonline.com/d6722070-486a-44b6-8527-e63e9ec35fba',
            redirectUri: 'http://localhost:4200',
            postLogoutRedirectUri: 'http://localhost:4200'
        },
        cache: {
            cacheLocation: BrowserCacheLocation.LocalStorage
        }
    });
}

export function MSALGuardConfigFactory(): MsalGuardConfiguration {
    return {
        interactionType: InteractionType.Redirect,
        authRequest: {
            scopes: ['user.read']
        }
    };
}

export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
    const protectedResourceMap = new Map<string, Array<string>>();
    protectedResourceMap.set('https://graph.microsoft.com/v1.0/me', ['user.read']);

    return {
        interactionType: InteractionType.Redirect,
        protectedResourceMap
    };
}

export const appConfig: ApplicationConfig = {
    providers: [
        provideZonelessChangeDetection(),
        provideRouter(routes),
        provideHttpClient(
            withInterceptorsFromDi()
        ),
        {
            provide: MSAL_INSTANCE,
            useFactory: MSALInstanceFactory
        },
        provideAppInitializer(async () => {
            const msalInstance = inject(MSAL_INSTANCE) as IPublicClientApplication;
            await msalInstance.initialize();
            await msalInstance.handleRedirectPromise();
        }),
        {
            provide: MSAL_GUARD_CONFIG,
            useFactory: MSALGuardConfigFactory
        },
        {
            provide: MSAL_INTERCEPTOR_CONFIG,
            useFactory: MSALInterceptorConfigFactory
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: MsalInterceptor,
            multi: true
        },
        MsalService,
        MsalGuard,
        MsalBroadcastService
    ]
};