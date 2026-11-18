import { Component, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { ConteoPorServicio, Kpis, ReportService } from './report.service';

/** Los rangos que acepta ms-vidasalud-report (RangoReporte). */
const RANGOS = [
    { valor: 'last24h', etiqueta: 'Últimas 24 horas' },
    { valor: 'last7d', etiqueta: 'Últimos 7 días' },
    { valor: 'last30d', etiqueta: 'Últimos 30 días' }
];

@Component({
    selector: 'app-reports',
    standalone: true,
    imports: [DatePipe, DecimalPipe, FormsModule],
    template: `
    <div style="display: flex; flex-direction: column; gap: 20px;">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
        <div>
          <h2 style="font-size: 22px;">Reportería</h2>
          <p style="color: var(--color-text-muted); margin-top: 4px;">
            Atenciones por hora y por estado, tiempo de espera y prestaciones más demandadas (datos por streaming desde Kafka).
          </p>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <select [(ngModel)]="rango" (change)="cargar()"
                  style="padding: 8px 10px; border: 1px solid var(--color-border); border-radius: var(--radius-sm);">
            @for (r of rangos; track r.valor) {
              <option [value]="r.valor">{{ r.etiqueta }}</option>
            }
          </select>
          <button class="btn btn-secondary" (click)="cargar()" [disabled]="loading()">Actualizar</button>
        </div>
      </div>

      @if (error()) {
        <div class="card" style="border-color: var(--color-danger); color: var(--color-danger);">{{ error() }}</div>
      }

      @if (loading()) {
        <p style="color: var(--color-text-muted);">Cargando indicadores...</p>
      } @else if (kpis(); as k) {
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
          <div class="card">
            <p style="color: var(--color-text-muted); font-size: 13px;">Atenciones en el rango</p>
            <p style="font-size: 28px; font-weight: 600;">{{ k.totalAtenciones }}</p>
          </div>
          <div class="card">
            <p style="color: var(--color-text-muted); font-size: 13px;">Espera promedio</p>
            <p style="font-size: 28px; font-weight: 600;">{{ minutos(k.tiempoEsperaPromedioMinutos) }}</p>
            <p style="color: var(--color-text-muted); font-size: 12px;">De EN_ESPERA a EN_ATENCION</p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 12px;">
          <div class="card">
            <h3 style="font-size: 15px; margin-bottom: 10px;">Atenciones por estado</h3>
            @for (e of k.atencionesPorEstado; track e.estado) {
              <div style="display: flex; justify-content: space-between; padding: 4px 0;">
                <span class="badge">{{ e.estado }}</span><strong>{{ e.cantidad }}</strong>
              </div>
            } @empty {
              <p style="color: var(--color-text-muted); font-size: 14px;">Sin atenciones en el rango.</p>
            }
          </div>

          <div class="card">
            <h3 style="font-size: 15px; margin-bottom: 10px;">Prestaciones más demandadas</h3>
            @for (s of servicios(); track s.servicio) {
              <div style="display: flex; justify-content: space-between; padding: 4px 0;">
                <span>{{ s.servicio }}</span><strong>{{ s.cantidad }}</strong>
              </div>
            } @empty {
              <p style="color: var(--color-text-muted); font-size: 14px;">Sin datos en el rango.</p>
            }
          </div>
        </div>

        <div class="card">
          <h3 style="font-size: 15px; margin-bottom: 10px;">Atenciones por hora</h3>
          @for (h of k.atencionesPorHora; track h.hora) {
            <div style="display: flex; align-items: center; gap: 10px; padding: 3px 0; font-size: 13px;">
              <span style="width: 120px; color: var(--color-text-muted);">{{ h.hora | date: 'dd/MM HH:mm' }}</span>
              <div [style.width.%]="porcentaje(h.cantidad)"
                   style="height: 14px; background: var(--color-primary); border-radius: 3px; min-width: 2px;"></div>
              <strong>{{ h.cantidad | number }}</strong>
            </div>
          } @empty {
            <p style="color: var(--color-text-muted); font-size: 14px;">Sin atenciones en el rango.</p>
          }
        </div>
      }
    </div>
  `
})
export class Reports {
    private service = inject(ReportService);

    rangos = RANGOS;
    rango = 'last24h';

    kpis = signal<Kpis | null>(null);
    servicios = signal<ConteoPorServicio[]>([]);
    loading = signal(true);
    error = signal<string | null>(null);

    constructor() {
        this.cargar();
    }

    cargar(): void {
        this.loading.set(true);
        this.error.set(null);
        forkJoin({
            kpis: this.service.kpis(this.rango),
            top: this.service.serviciosMasDemandados(this.rango)
        }).subscribe({
            next: ({ kpis, top }) => {
                this.kpis.set(kpis);
                this.servicios.set(top.servicios);
                this.loading.set(false);
            },
            error: err => {
                this.error.set(mensajeError(err));
                this.loading.set(false);
            }
        });
    }

    minutos(valor: number | null): string {
        return valor == null ? '—' : `${valor} min`;
    }

    porcentaje(cantidad: number): number {
        const maximo = Math.max(1, ...(this.kpis()?.atencionesPorHora ?? []).map(h => h.cantidad));
        return Math.round((cantidad / maximo) * 70);
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
