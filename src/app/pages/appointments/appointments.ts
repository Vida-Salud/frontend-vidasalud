import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../auth/auth.service';
import { AppointmentsService, Atencion, EstadoAtencion } from './appointments.service';

/** Refleja TRANSICIONES_VALIDAS de AtencionService (backend) para ofrecer solo botones válidos. */
const TRANSICIONES: Record<EstadoAtencion, EstadoAtencion[]> = {
    SOLICITADA: ['CONFIRMADA', 'CANCELADA'],
    CONFIRMADA: ['EN_ESPERA', 'CANCELADA'],
    EN_ESPERA: ['EN_ATENCION', 'CANCELADA'],
    EN_ATENCION: ['CERRADA'],
    CERRADA: [],
    CANCELADA: []
};

const ESTADO_LABEL: Record<EstadoAtencion, string> = {
    SOLICITADA: 'Solicitada',
    CONFIRMADA: 'Confirmada',
    EN_ESPERA: 'En espera',
    EN_ATENCION: 'En atención',
    CERRADA: 'Cerrada',
    CANCELADA: 'Cancelada'
};

const ACCION_LABEL: Record<EstadoAtencion, string> = {
    SOLICITADA: 'Solicitar',
    CONFIRMADA: 'Confirmar',
    EN_ESPERA: 'Poner en espera',
    EN_ATENCION: 'Iniciar atención',
    CERRADA: 'Cerrar',
    CANCELADA: 'Cancelar'
};

@Component({
    selector: 'app-appointments',
    standalone: true,
    imports: [DatePipe, FormsModule],
    template: `
    <div style="display: flex; flex-direction: column; gap: 20px;">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
        <div>
          <h2 style="font-size: 22px;">Atenciones</h2>
          <p style="color: var(--color-text-muted); margin-top: 4px;">
            Solicitar, confirmar y hacer seguimiento de las atenciones.
          </p>
        </div>
        @if (puedeCrear) {
          <button class="btn btn-primary" (click)="mostrarFormulario.set(!mostrarFormulario())">
            {{ mostrarFormulario() ? 'Cancelar' : 'Nueva atención' }}
          </button>
        }
      </div>

      @if (mostrarFormulario()) {
        <form class="card" style="display: flex; flex-direction: column; gap: 12px;" (submit)="crear(); $event.preventDefault()">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px;">
            <label style="display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: var(--color-text-muted);">
              Paciente
              <input name="paciente" [(ngModel)]="paciente" required
                     style="padding: 8px 10px; border: 1px solid var(--color-border); border-radius: var(--radius-sm);" />
            </label>
            <label style="display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: var(--color-text-muted);">
              Servicio
              <input name="servicio" [(ngModel)]="servicio" required
                     style="padding: 8px 10px; border: 1px solid var(--color-border); border-radius: var(--radius-sm);" />
            </label>
            <label style="display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: var(--color-text-muted);">
              Box (opcional)
              <input name="box" [(ngModel)]="box"
                     style="padding: 8px 10px; border: 1px solid var(--color-border); border-radius: var(--radius-sm);" />
            </label>
            <label style="display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: var(--color-text-muted);">
              Fecha y hora
              <input name="fechaHora" type="datetime-local" [(ngModel)]="fechaHora" required
                     style="padding: 8px 10px; border: 1px solid var(--color-border); border-radius: var(--radius-sm);" />
            </label>
          </div>

          @if (formError()) {
            <p style="color: var(--color-danger); font-size: 13px;">{{ formError() }}</p>
          }

          <div>
            <button type="submit" class="btn btn-primary" [disabled]="guardando()">
              {{ guardando() ? 'Guardando...' : 'Agendar' }}
            </button>
          </div>
        </form>
      }

      @if (error()) {
        <div class="card" style="border-color: var(--color-danger); color: var(--color-danger);">
          {{ error() }}
        </div>
      }

      @if (loading()) {
        <p style="color: var(--color-text-muted);">Cargando atenciones...</p>
      } @else if (atenciones().length === 0) {
        <div class="card">
          <p style="color: var(--color-text-muted);">No hay atenciones registradas.</p>
        </div>
      } @else {
        <div class="card" style="padding: 0; overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="text-align: left; border-bottom: 1px solid var(--color-border);">
                <th style="padding: 12px 16px;">Paciente</th>
                <th style="padding: 12px 16px;">Servicio</th>
                <th style="padding: 12px 16px;">Box</th>
                <th style="padding: 12px 16px;">Fecha y hora</th>
                <th style="padding: 12px 16px;">Estado</th>
                @if (puedeCambiarEstado) {
                  <th style="padding: 12px 16px;">Acciones</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (atencion of atenciones(); track atencion.id) {
                <tr style="border-bottom: 1px solid var(--color-border);">
                  <td style="padding: 12px 16px;">{{ atencion.paciente }}</td>
                  <td style="padding: 12px 16px;">{{ atencion.servicio }}</td>
                  <td style="padding: 12px 16px;">{{ atencion.box || '—' }}</td>
                  <td style="padding: 12px 16px;">{{ atencion.fechaHora | date: 'dd/MM/yyyy HH:mm' }}</td>
                  <td style="padding: 12px 16px;">
                    <span class="badge" [class.badge-muted]="esEstadoFinal(atencion.estado)">
                      {{ estadoLabel[atencion.estado] }}
                    </span>
                  </td>
                  @if (puedeCambiarEstado) {
                    <td style="padding: 12px 16px;">
                      <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                        @for (siguiente of transicionesDe(atencion.estado); track siguiente) {
                          <button class="btn btn-secondary" style="padding: 6px 10px; font-size: 13px;"
                                  [disabled]="cambiandoEstado() === atencion.id"
                                  (click)="cambiarEstado(atencion, siguiente)">
                            {{ accionLabel[siguiente] }}
                          </button>
                        }
                        @if (transicionesDe(atencion.estado).length === 0) {
                          <span style="color: var(--color-text-muted); font-size: 13px;">—</span>
                        }
                      </div>
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `
})
export class Appointments {
    auth = inject(AuthService);
    private service = inject(AppointmentsService);

    atenciones = signal<Atencion[]>([]);
    loading = signal(true);
    error = signal<string | null>(null);

    mostrarFormulario = signal(false);
    guardando = signal(false);
    formError = signal<string | null>(null);
    cambiandoEstado = signal<number | null>(null);

    paciente = '';
    servicio = '';
    box = '';
    fechaHora = '';

    estadoLabel = ESTADO_LABEL;
    accionLabel = ACCION_LABEL;

    constructor() {
        this.cargar();
    }

    get puedeCrear(): boolean {
        return this.auth.hasRole('Admin', 'Operador', 'Cliente');
    }

    get puedeCambiarEstado(): boolean {
        return this.auth.hasRole('Admin', 'Operador');
    }

    esEstadoFinal(estado: EstadoAtencion): boolean {
        return TRANSICIONES[estado].length === 0;
    }

    transicionesDe(estado: EstadoAtencion): EstadoAtencion[] {
        return TRANSICIONES[estado];
    }

    cargar(): void {
        this.loading.set(true);
        this.error.set(null);
        this.service.listar().subscribe({
            next: atenciones => {
                this.atenciones.set(atenciones);
                this.loading.set(false);
            },
            error: err => {
                this.error.set(this.mensajeError(err));
                this.loading.set(false);
            }
        });
    }

    crear(): void {
        if (!this.paciente.trim() || !this.servicio.trim() || !this.fechaHora) {
            this.formError.set('Completa paciente, servicio y fecha/hora.');
            return;
        }

        this.guardando.set(true);
        this.formError.set(null);
        this.service.crear({
            paciente: this.paciente.trim(),
            servicio: this.servicio.trim(),
            box: this.box.trim() || null,
            fechaHora: this.fechaHora
        }).subscribe({
            next: () => {
                this.guardando.set(false);
                this.mostrarFormulario.set(false);
                this.paciente = '';
                this.servicio = '';
                this.box = '';
                this.fechaHora = '';
                this.cargar();
            },
            error: err => {
                this.guardando.set(false);
                this.formError.set(this.mensajeError(err));
            }
        });
    }

    cambiarEstado(atencion: Atencion, nuevoEstado: EstadoAtencion): void {
        this.cambiandoEstado.set(atencion.id);
        this.error.set(null);
        this.service.cambiarEstado(atencion.id, nuevoEstado).subscribe({
            next: () => {
                this.cambiandoEstado.set(null);
                this.cargar();
            },
            error: err => {
                this.cambiandoEstado.set(null);
                this.error.set(this.mensajeError(err));
            }
        });
    }

    private mensajeError(err: unknown): string {
        if (err instanceof HttpErrorResponse) {
            if (err.status === 0) {
                return 'No se pudo conectar con el servidor.';
            }
            const detail = err.error?.detail;
            if (typeof detail === 'string') {
                return detail;
            }
        }
        return 'Ocurrió un error inesperado.';
    }
}
