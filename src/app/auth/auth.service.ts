import { Injectable, inject } from '@angular/core';
import { MsalService } from '@azure/msal-angular';

export type AppRole = 'Admin' | 'Operador' | 'Cliente' | 'Auditor';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private msal = inject(MsalService);

    get account() {
        return this.msal.instance.getActiveAccount();
    }

    get isLoggedIn(): boolean {
        return !!this.account;
    }

    get displayName(): string {
        return this.account?.name ?? '';
    }

    get username(): string {
        return this.account?.username ?? '';
    }

    get roles(): AppRole[] {
        const claims = this.account?.idTokenClaims as Record<string, unknown> | undefined;
        const roles = claims?.['roles'];
        return Array.isArray(roles) ? (roles as AppRole[]) : [];
    }

    hasRole(...allowed: AppRole[]): boolean {
        return this.roles.some(r => allowed.includes(r));
    }
}