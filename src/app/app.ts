import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import { AuthenticationResult, EventMessage, EventType } from '@azure/msal-browser';
import { filter } from 'rxjs/internal/operators/filter';
import { AuthService } from './auth/auth.service';
import { environment } from '../environments/environment';

@Component({
    imports: [RouterOutlet, RouterLink, RouterLinkActive],
    selector: 'app-root',
    styleUrl: './app.css',
    templateUrl: './app.html',
})
export class App {
    protected readonly title = signal('frontend-vidasalud');
    private msalService = inject(MsalService);
    private msalBroadcastService = inject(MsalBroadcastService);
    auth = inject(AuthService);

    ngOnInit(): void {
        this.msalBroadcastService.msalSubject$
            .pipe(
                filter((msg: EventMessage) =>
                    msg.eventType === EventType.INITIALIZE_END ||
                    msg.eventType === EventType.LOGIN_SUCCESS
                ))
            .subscribe((result: EventMessage) => {
                if (result.eventType === EventType.LOGIN_SUCCESS) {
                    const payload = result.payload as AuthenticationResult;
                    this.msalService.instance.setActiveAccount(payload.account);
                }
                this.checkLoginStatus();
            });

        this.checkLoginStatus();
    }

    checkLoginStatus(): void {
        try {
            const activeAccount = this.msalService.instance.getActiveAccount();
            if (!activeAccount && this.msalService.instance.getAllAccounts().length > 0) {
                this.msalService.instance.setActiveAccount(this.msalService.instance.getAllAccounts()[0]);
            }
        } catch {
            // La consulta puede ocurrir antes de que termine la inicialización
        }
    }

    login(): void {
        this.msalService.loginRedirect({
            scopes: [environment.apiScope]
        });
    }

    logout(): void {
        this.msalService.logoutRedirect();
    }
}