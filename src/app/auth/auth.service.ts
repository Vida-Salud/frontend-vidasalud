import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import { AccountInfo, AuthenticationResult, EventMessage, EventType } from '@azure/msal-browser';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export type AppRole = 'Admin' | 'Operador' | 'Cliente' | 'Auditor';

/**
 * Los App Roles están definidos en la App Registration de la API, así que el
 * claim `roles` solo viene en el Access Token emitido para environment.apiScope
 * (no en el ID Token, cuya audiencia es el Client ID del frontend).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
    private msal = inject(MsalService);
    private broadcast = inject(MsalBroadcastService);

    private readonly _roles = signal<AppRole[]>([]);
    private pending: Promise<AppRole[]> | null = null;
    private loaded = false;

    constructor() {
        this.broadcast.msalSubject$
            .pipe(takeUntilDestroyed(inject(DestroyRef)))
            .subscribe(msg => this.onMsalEvent(msg));

        if (this.account) {
            void this.ensureRoles();
        }
    }

    get account(): AccountInfo | null {
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

    /** Roles leídos del Access Token más reciente de la API. */
    get roles(): AppRole[] {
        return this._roles();
    }

    hasRole(...allowed: AppRole[]): boolean {
        return this.roles.some(r => allowed.includes(r));
    }

    /**
     * Garantiza que los roles estén cargados desde el Access Token de la API.
     * Útil en guards, que pueden ejecutarse antes de que termine la primera
     * adquisición silenciosa del token.
     */
    ensureRoles(): Promise<AppRole[]> {
        if (this.loaded) {
            return Promise.resolve(this.roles);
        }
        return this.refreshRoles();
    }

    /** Pide (silenciosamente) el Access Token de la API y actualiza los roles. */
    refreshRoles(): Promise<AppRole[]> {
        if (this.pending) {
            return this.pending;
        }

        const account = this.account ?? this.msal.instance.getAllAccounts()[0];
        if (!account) {
            this.setRoles([]);
            return Promise.resolve([]);
        }

        // El resultado también se procesa en onMsalEvent (ACQUIRE_TOKEN_SUCCESS);
        // aquí se asigna igualmente para no depender del orden de los eventos.
        this.pending = firstValueFrom(
            this.msal.acquireTokenSilent({ scopes: [environment.apiScope], account })
        )
            .then(result => this.setRoles(extractRoles(result.accessToken)))
            .catch(err => {
                // Sin token silencioso (p.ej. interaction_required): sin roles.
                // MsalGuard se encarga de forzar el login interactivo.
                console.warn('No se pudo obtener el Access Token de la API', err);
                return this.setRoles([]);
            })
            .finally(() => (this.pending = null));

        return this.pending;
    }

    private onMsalEvent(msg: EventMessage): void {
        switch (msg.eventType) {
            case EventType.LOGIN_SUCCESS:
            case EventType.ACQUIRE_TOKEN_SUCCESS: {
                const result = msg.payload as AuthenticationResult | null;
                if (result?.accessToken && isApiToken(result)) {
                    this.setRoles(extractRoles(result.accessToken));
                }
                break;
            }
            case EventType.ACTIVE_ACCOUNT_CHANGED:
                this.loaded = false;
                if (this.account) {
                    void this.refreshRoles();
                } else {
                    this.setRoles([]);
                }
                break;
            case EventType.LOGOUT_SUCCESS:
                this.loaded = false;
                this._roles.set([]);
                break;
        }
    }

    private setRoles(roles: AppRole[]): AppRole[] {
        this.loaded = true;
        this._roles.set(roles);
        return roles;
    }
}

function isApiToken(result: AuthenticationResult): boolean {
    const wanted = environment.apiScope.toLowerCase();
    return result.scopes.some(s => s.toLowerCase() === wanted);
}

function extractRoles(accessToken: string): AppRole[] {
    const roles = decodeJwtPayload(accessToken)?.['roles'];
    return Array.isArray(roles) ? (roles as AppRole[]) : [];
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
    try {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
        const bytes = Uint8Array.from(atob(padded), c => c.charCodeAt(0));
        return JSON.parse(new TextDecoder().decode(bytes));
    } catch {
        return null;
    }
}
