import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import type { AppRole } from './auth.service';

export function roleGuard(...allowed: AppRole[]): CanActivateFn {
    return async () => {
        const auth = inject(AuthService);
        const router = inject(Router);

        // Los roles vienen del Access Token de la API, que se obtiene de forma asíncrona.
        await auth.ensureRoles();

        if (auth.hasRole(...allowed)) {
            return true;
        }
        return router.createUrlTree(['/forbidden']);
    };
}
