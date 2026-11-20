import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuditService, EntradaAuditoria, FiltrosAuditoria } from './audit.service';

/** Valores de "type" de appointments.events (el estado alcanzado se ve en la columna de estado). */
const TIPOS = [
    'APPOINTMENT_CREATED',
    'APPOINTMENT_STATUS_CHANGED'
];

const ESTILO_CAMPO = 'padding: 8px 10px; border: 1px solid var(--color-border); border-radius: var(--radius-sm);';

@Component({
    selector: 'app-audit',
    standalone: true,
    imports: [DatePipe, FormsModule],
    template: `
    <div style="display: flex; flex-direction: column; gap: 20px;">
      <div>
        <h2 style="font-size: 22px;">Auditoría</h2>
        <p style="color: var(--color-text-muted); margin-top: 4px;">
          Quién solicitó, confirmó, atendió o cerró cada atención, cuándo y desde dónde. Solo lectura.
        </p>
      </div>

      <form class="card" (submit)="buscar(); $event.preventDefault()"
            style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; align-items: end;">
        <label style="display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: var(--color-text-muted);">
          Usuario (nombre u oid)
          <input name="usuario" [(ngModel)]="filtros.usuario" [style]="estiloCampo" />
        </label>
        <label style="display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: var(--color-text-muted);">
          Tipo de evento
          <select name="type" [(ngModel)]="filtros.type" [style]="estiloCampo">
            <option value="">Todos</option>
            @for (t of tipos; track t) {
              <option [value]="t">{{ t }}</option>
            }
          </select>
        </label>
        <label style="display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: var(--color-text-muted);">
          N° de atención
          <input name="atencionId" type="number" min="1" [(ngModel)]="filtros.atencionId" [style]="estiloCampo" />
        </label>
        <label style="display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: var(--color-text-muted);">
          Desde
          <input name="from" type="date" [(ngModel)]="filtros.from" [style]="estiloCampo" />
        </label>
        <label style="display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: var(--color-text-muted);">
          Hasta
          <input name="to" type="date" [(ngModel)]="filtros.to" [style]="estiloCampo" />
        </label>
        <div style="display: flex; gap: 8px;">
          <button type="submit" class="btn btn-primary" [disabled]="loading()">Buscar</button>
          <button type="button" class="btn btn-secondary" (click)="limpiar()">Limpiar</button>
        </div>
      </form>

      @if (error()) {
        <div class="card" style="border-color: var(--color-danger); color: var(--color-danger);">{{ error() }}</div>
      }

      @if (loading()) {
        <p style="color: var(--color-text-muted);">Cargando auditoría...</p>
      } @else if (entradas().length === 0) {
        <div class="card"><p style="color: var(--color-text-muted);">No hay eventos para los filtros indicados.</p></div>
      } @else {
        <div class="card" style="padding: 0; overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="text-align: left; border-bottom: 1px solid var(--color-border);">
                <th style="padding: 12px 16px;">Cuándo</th>
                <th style="padding: 12px 16px;">Atención</th>
                <th style="padding: 12px 16px;">Evento</th>
                <th style="padding: 12px 16px;">Cambio</th>
                <th style="padding: 12px 16px;">Quién</th>
                <th style="padding: 12px 16px;">Desde dónde</th>
              </tr>
            </thead>
            <tbody>
              @for (e of entradas(); track e.eventId) {
                <tr style="border-bottom: 1px solid var(--color-border);">
                  <td style="padding: 12px 16px;">{{ e.ocurridoEn | date: 'dd/MM/yyyy HH:mm:ss' }}</td>
                  <td style="padding: 12px 16px;">
                    <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 13px;"
                            (click)="verTimeline(e.atencionId)">#{{ e.atencionId }}</button>
                  </td>
                  <td style="padding: 12px 16px;"><span class="badge">{{ e.tipo }}</span></td>
                  <td style="padding: 12px 16px;">{{ e.estadoAnterior ?? '—' }} → {{ e.estado }}</td>
                  <td style="padding: 12px 16px;">
                    {{ e.actorNombre ?? 'Sistema' }}
                    @if (e.actorRol) {
                      <span style="color: var(--color-text-muted); font-size: 12px;">({{ e.actorRol }})</span>
                    }
                  </td>
                  <td style="padding: 12px 16px; color: var(--color-text-muted); font-size: 13px;">
                    {{ e.origenServicio ?? '—' }} · {{ e.origenIp ?? 'IP desconocida' }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `
})
export class Audit {
    private service = inject(AuditService);

    tipos = TIPOS;
    estiloCampo = ESTILO_CAMPO;
    filtros: FiltrosAuditoria = {};

    entradas = signal<EntradaAuditoria[]>([]);
    loading = signal(true);
    error = signal<string | null>(null);

    constructor() {
        this.buscar();
    }

    buscar(): void {
        this.cargar(this.service.buscar(this.filtros));
    }

    verTimeline(atencionId: number): void {
        this.filtros = { atencionId };
        this.cargar(this.service.timeline(atencionId));
    }

    limpiar(): void {
        this.filtros = {};
        this.buscar();
    }

    private cargar(peticion: ReturnType<AuditService['buscar']>): void {
        this.loading.set(true);
        this.error.set(null);
        peticion.subscribe({
            next: entradas => {
                this.entradas.set(entradas);
                this.loading.set(false);
            },
            error: err => {
                this.error.set(mensajeError(err));
                this.loading.set(false);
            }
        });
    }
}

function mensajeError(err: unknown): string {
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
