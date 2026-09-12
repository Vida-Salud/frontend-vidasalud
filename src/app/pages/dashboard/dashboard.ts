import { Component, inject } from '@angular/core';
import { AuthService } from '../../auth/auth.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    template: `
    <div style="padding: 20px;">
      <h2>Dashboard</h2>
      <p>Bienvenido, <strong>{{ auth.displayName }}</strong></p>
      <p>Roles: {{ auth.roles.join(', ') || '(ninguno)' }}</p>
      @if (auth.hasRole('Admin')) {
        <p>Vista de administrador: KPIs globales de la red.</p>
      }
      @if (auth.hasRole('Operador')) {
        <p>Vista de recepción: sala de espera y atenciones pendientes.</p>
      }
      @if (auth.hasRole('Cliente')) {
        <p>Vista de paciente: tus próximas atenciones.</p>
      }
    </div>
  `
})
export class Dashboard {
    auth = inject(AuthService);
}