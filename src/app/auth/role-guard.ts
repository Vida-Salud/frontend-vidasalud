import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import type { AppRole } from './auth.service';

export function roleGuard(...allowed: AppRole[]): CanActivateFn {
    return () => {
        const auth = inject(AuthService);
        const router = inject(Router);

        if (auth.hasRole(...allowed)) {
            return true;
        }
        return router.createUrlTree(['/forbidden']);
    };
}