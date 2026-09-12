import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
    selector: 'app-forbidden',
    standalone: true,
    imports: [RouterLink],
    template: `
    <div style="padding: 20px;">
      <h2>Acceso denegado</h2>
      <p>Tu cuenta no tiene permisos para acceder a esta sección.</p>
      <p>Roles asignados: <strong>{{ auth.roles.join(', ') || '(ninguno)' }}</strong></p>
      <a routerLink="/dashboard">Volver al inicio</a>
    </div>
  `
})
export class Forbidden {
    auth = inject(AuthService);
}