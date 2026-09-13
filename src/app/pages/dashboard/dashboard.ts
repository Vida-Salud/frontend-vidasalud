import { Component, inject } from '@angular/core';
import { AuthService } from '../../auth/auth.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    template: `
    <div style="display: flex; flex-direction: column; gap: 20px;">
      <div>
        <h2 style="font-size: 22px;">Dashboard</h2>
        <p style="color: var(--color-text-muted); margin-top: 4px;">
          Bienvenido, <strong style="color: var(--color-text);">{{ auth.displayName }}</strong>
        </p>
        <div style="margin-top: 10px; display: flex; gap: 6px; flex-wrap: wrap;">
          @for (role of auth.roles; track role) {
            <span class="badge">{{ role }}</span>
          } @empty {
            <span class="badge badge-muted">Sin rol asignado</span>
          }
        </div>
      </div>

      @if (auth.hasRole('Admin')) {
        <div class="card">
          <h3 style="font-size: 15px; margin-bottom: 6px;">Vista de administrador</h3>
          <p style="color: var(--color-text-muted); font-size: 14px;">KPIs globales de la red.</p>
        </div>
      }
      @if (auth.hasRole('Operador')) {
        <div class="card">
          <h3 style="font-size: 15px; margin-bottom: 6px;">Vista de recepción</h3>
          <p style="color: var(--color-text-muted); font-size: 14px;">Sala de espera y atenciones pendientes.</p>
        </div>
      }
      @if (auth.hasRole('Cliente')) {
        <div class="card">
          <h3 style="font-size: 15px; margin-bottom: 6px;">Vista de paciente</h3>
          <p style="color: var(--color-text-muted); font-size: 14px;">Tus próximas atenciones.</p>
        </div>
      }
    </div>
  `
})
export class Dashboard {
    auth = inject(AuthService);
}