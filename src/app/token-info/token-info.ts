import { Component, OnInit, inject, signal } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { environment } from '../../environments/environment';

@Component({
    selector: 'app-token-info',
    standalone: true,
    template: `
    <div style="padding: 20px;">
      <h2>Información del token</h2>
      @if (claims(); as c) {
        <table border="1" cellpadding="6">
          <tr><th>Usuario</th><td>{{ c.name }}</td></tr>
          <tr><th>UPN</th><td>{{ c.preferred_username }}</td></tr>
          <tr><th>Audience (aud)</th><td>{{ c.aud }}</td></tr>
          <tr><th>Issuer (iss)</th><td>{{ c.iss }}</td></tr>
          <tr><th>Scopes (scp)</th><td>{{ c.scp }}</td></tr>
          <tr><th>Roles</th><td>{{ c.roles?.join(', ') || '(sin roles)' }}</td></tr>
          <tr><th>Expira</th><td>{{ expira(c.exp) }}</td></tr>
        </table>
      } @else if (error()) {
        <p style="color: red;">{{ error() }}</p>
      } @else {
        <p>Obteniendo token...</p>
      }
    </div>
  `
})
export class TokenInfo implements OnInit {
    private msal = inject(MsalService);
    claims = signal<any | null>(null);
    error = signal<string | null>(null);

    ngOnInit(): void {
        this.msal.acquireTokenSilent({
            scopes: [environment.apiScope],
            account: this.msal.instance.getActiveAccount()!
        }).subscribe({
            next: (res) => {
                const payload = JSON.parse(atob(res.accessToken.split('.')[1]));
                this.claims.set(payload);
                console.log('Access token completo:', res.accessToken);
                console.log('Claims:', payload);
            },
            error: (err) => this.error.set(err?.message ?? 'Error al obtener el token')
        });
    }

    expira(exp: number): string {
        return new Date(exp * 1000).toLocaleString('es-CL');
    }
}