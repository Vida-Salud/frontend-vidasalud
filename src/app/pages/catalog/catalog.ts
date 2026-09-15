import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../auth/auth.service';
import { Box, CatalogService, CupoDisponible, Servicio } from './catalog.service';

type Tab = 'servicios' | 'boxes' | 'cupos';

@Component({
    selector: 'app-catalog',
    standalone: true,
    imports: [DatePipe, CurrencyPipe, FormsModule],
    template: `
    <div style="display: flex; flex-direction: column; gap: 20px;">
      <div>
        <h2 style="font-size: 22px;">Catálogo de prestaciones</h2>
        <p style="color: var(--color-text-muted); margin-top: 4px;">
          Servicios, boxes y cupos disponibles.
        </p>
      </div>

      <div style="display: flex; gap: 8px; border-bottom: 1px solid var(--color-border); padding-bottom: 8px;">
        <button class="btn" [class.btn-primary]="tab() === 'servicios'" [class.btn-secondary]="tab() !== 'servicios'"
                (click)="tab.set('servicios')">Servicios</button>
        <button class="btn" [class.btn-primary]="tab() === 'boxes'" [class.btn-secondary]="tab() !== 'boxes'"
                (click)="tab.set('boxes')">Boxes</button>
        <button class="btn" [class.btn-primary]="tab() === 'cupos'" [class.btn-secondary]="tab() !== 'cupos'"
                (click)="tab.set('cupos')">Cupos</button>
      </div>

      @if (tab() === 'servicios') {
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div style="display: flex; justify-content: flex-end;">
            <button class="btn btn-primary" (click)="mostrarFormServicio() ? cerrarFormServicio() : abrirFormNuevoServicio()">
              {{ mostrarFormServicio() ? 'Cancelar' : 'Nuevo servicio' }}
            </button>
          </div>

          @if (mostrarFormServicio()) {
            <form class="card" style="display: flex; flex-direction: column; gap: 12px;" (submit)="guardarServicio(); $event.preventDefault()">
              <h3 style="font-size: 15px;">{{ servicioEnEdicion() ? 'Editar servicio' : 'Nuevo servicio' }}</h3>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px;">
                <label style="display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: var(--color-text-muted);">
                  Nombre
                  <input name="nombreServicio" [(ngModel)]="nombreServicio" required
                         style="padding: 8px 10px; border: 1px solid var(--color-border); border-radius: var(--radius-sm);" />
                </label>
                <label style="display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: var(--color-text-muted);">
                  Descripción (opcional)
                  <input name="descripcionServicio" [(ngModel)]="descripcionServicio"
                         style="padding: 8px 10px; border: 1px solid var(--color-border); border-radius: var(--radius-sm);" />
                </label>
                <label style="display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: var(--color-text-muted);">
                  Precio
                  <input name="precioServicio" type="number" min="1" step="1" [(ngModel)]="precioServicio" required
                         style="padding: 8px 10px; border: 1px solid var(--color-border); border-radius: var(--radius-sm);" />
                </label>
              </div>

              @if (formErrorServicio()) {
                <p style="color: var(--color-danger); font-size: 13px;">{{ formErrorServicio() }}</p>
              }

              <div>
                <button type="submit" class="btn btn-primary" [disabled]="guardandoServicio()">
                  {{ guardandoServicio() ? 'Guardando...' : (servicioEnEdicion() ? 'Guardar cambios' : 'Crear servicio') }}
                </button>
              </div>
            </form>
          }

          @if (errorServicios()) {
            <div class="card" style="border-color: var(--color-danger); color: var(--color-danger);">
              {{ errorServicios() }}
            </div>
          }

          @if (loadingServicios()) {
            <p style="color: var(--color-text-muted);">Cargando servicios...</p>
          } @else if (servicios().length === 0) {
            <div class="card">
              <p style="color: var(--color-text-muted);">No hay servicios registrados.</p>
            </div>
          } @else {
            <div class="card" style="padding: 0; overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <thead>
                  <tr style="text-align: left; border-bottom: 1px solid var(--color-border);">
                    <th style="padding: 12px 16px;">Nombre</th>
                    <th style="padding: 12px 16px;">Descripción</th>
                    <th style="padding: 12px 16px;">Precio</th>
                    <th style="padding: 12px 16px;">Estado</th>
                    <th style="padding: 12px 16px;">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @for (servicio of servicios(); track servicio.id) {
                    <tr style="border-bottom: 1px solid var(--color-border);">
                      <td style="padding: 12px 16px;">{{ servicio.nombre }}</td>
                      <td style="padding: 12px 16px;">{{ servicio.descripcion || '—' }}</td>
                      <td style="padding: 12px 16px;">{{ servicio.precio | currency: 'CLP' }}</td>
                      <td style="padding: 12px 16px;">
                        <span class="badge" [class.badge-muted]="!servicio.activo">
                          {{ servicio.activo ? 'Activo' : 'Inactivo' }}
                        </span>
                      </td>
                      <td style="padding: 12px 16px;">
                        <button class="btn btn-secondary" style="padding: 6px 10px; font-size: 13px;"
                                (click)="abrirFormEditarServicio(servicio)">
                          Editar
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }

      @if (tab() === 'boxes') {
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div style="display: flex; justify-content: flex-end;">
            <button class="btn btn-primary" (click)="mostrarFormBox.set(!mostrarFormBox())">
              {{ mostrarFormBox() ? 'Cancelar' : 'Nuevo box' }}
            </button>
          </div>

          @if (mostrarFormBox()) {
            <form class="card" style="display: flex; flex-direction: column; gap: 12px;" (submit)="crearBox(); $event.preventDefault()">
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px;">
                <label style="display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: var(--color-text-muted);">
                  Nombre
                  <input name="nombreBox" [(ngModel)]="nombreBox" required
                         style="padding: 8px 10px; border: 1px solid var(--color-border); border-radius: var(--radius-sm);" />
                </label>
                <label style="display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: var(--color-text-muted);">
                  Servicio
                  <select name="servicioIdBox" [(ngModel)]="servicioIdBox" required
                          style="padding: 8px 10px; border: 1px solid var(--color-border); border-radius: var(--radius-sm);">
                    <option [ngValue]="null" disabled>Selecciona un servicio</option>
                    @for (servicio of servicios(); track servicio.id) {
                      <option [ngValue]="servicio.id">{{ servicio.nombre }}</option>
                    }
                  </select>
                </label>
                <label style="display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: var(--color-text-muted);">
                  Capacidad diaria
                  <input name="capacidadBox" type="number" min="1" step="1" [(ngModel)]="capacidadBox" required
                         style="padding: 8px 10px; border: 1px solid var(--color-border); border-radius: var(--radius-sm);" />
                </label>
              </div>

              @if (formErrorBox()) {
                <p style="color: var(--color-danger); font-size: 13px;">{{ formErrorBox() }}</p>
              }

              <div>
                <button type="submit" class="btn btn-primary" [disabled]="guardandoBox()">
                  {{ guardandoBox() ? 'Guardando...' : 'Crear box' }}
                </button>
              </div>
            </form>
          }

          @if (errorBoxes()) {
            <div class="card" style="border-color: var(--color-danger); color: var(--color-danger);">
              {{ errorBoxes() }}
            </div>
          }

          @if (loadingBoxes()) {
            <p style="color: var(--color-text-muted);">Cargando boxes...</p>
          } @else if (boxes().length === 0) {
            <div class="card">
              <p style="color: var(--color-text-muted);">No hay boxes registrados.</p>
            </div>
          } @else {
            <div class="card" style="padding: 0; overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <thead>
                  <tr style="text-align: left; border-bottom: 1px solid var(--color-border);">
                    <th style="padding: 12px 16px;">Nombre</th>
                    <th style="padding: 12px 16px;">Servicio</th>
                    <th style="padding: 12px 16px;">Capacidad diaria</th>
                    <th style="padding: 12px 16px;">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  @for (box of boxes(); track box.id) {
                    <tr style="border-bottom: 1px solid var(--color-border);">
                      <td style="padding: 12px 16px;">{{ box.nombre }}</td>
                      <td style="padding: 12px 16px;">{{ box.servicioNombre }}</td>
                      <td style="padding: 12px 16px;">{{ box.capacidadDiaria }}</td>
                      <td style="padding: 12px 16px;">
                        <span class="badge" [class.badge-muted]="!box.activo">
                          {{ box.activo ? 'Activo' : 'Inactivo' }}
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }

      @if (tab() === 'cupos') {
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <form style="display: flex; align-items: flex-end; gap: 12px;" (submit)="cargarCupos(); $event.preventDefault()">
            <label style="display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: var(--color-text-muted);">
              Fecha
              <input name="fechaFiltro" type="date" [(ngModel)]="fechaFiltro"
                     style="padding: 8px 10px; border: 1px solid var(--color-border); border-radius: var(--radius-sm);" />
            </label>
            <button type="submit" class="btn btn-secondary">Filtrar</button>
          </form>

          @if (errorCupos()) {
            <div class="card" style="border-color: var(--color-danger); color: var(--color-danger);">
              {{ errorCupos() }}
            </div>
          }

          @if (loadingCupos()) {
            <p style="color: var(--color-text-muted);">Cargando cupos...</p>
          } @else if (cupos().length === 0) {
            <div class="card">
              <p style="color: var(--color-text-muted);">No hay cupos para la fecha seleccionada.</p>
            </div>
          } @else {
            <div class="card" style="padding: 0; overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <thead>
                  <tr style="text-align: left; border-bottom: 1px solid var(--color-border);">
                    <th style="padding: 12px 16px;">Box</th>
                    <th style="padding: 12px 16px;">Fecha</th>
                    <th style="padding: 12px 16px;">Cupos disponibles</th>
                    <th style="padding: 12px 16px;">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @for (cupo of cupos(); track cupo.id) {
                    <tr style="border-bottom: 1px solid var(--color-border);">
                      <td style="padding: 12px 16px;">{{ cupo.boxNombre }}</td>
                      <td style="padding: 12px 16px;">{{ cupo.fecha | date: 'dd/MM/yyyy' }}</td>
                      <td style="padding: 12px 16px;">
                        <input type="number" min="0" step="1" [ngModel]="valorEditado(cupo)"
                               (ngModelChange)="actualizarValorEditado(cupo, $event)"
                               style="width: 90px; padding: 6px 8px; border: 1px solid var(--color-border); border-radius: var(--radius-sm);" />
                      </td>
                      <td style="padding: 12px 16px;">
                        <button class="btn btn-secondary" style="padding: 6px 10px; font-size: 13px;"
                                [disabled]="editandoCupoId() === cupo.id"
                                (click)="guardarCupo(cupo)">
                          {{ editandoCupoId() === cupo.id ? 'Guardando...' : 'Guardar' }}
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class Catalog {
    auth = inject(AuthService);
    private service = inject(CatalogService);

    tab = signal<Tab>('servicios');

    servicios = signal<Servicio[]>([]);
    loadingServicios = signal(true);
    errorServicios = signal<string | null>(null);
    mostrarFormServicio = signal(false);
    guardandoServicio = signal(false);
    formErrorServicio = signal<string | null>(null);
    servicioEnEdicion = signal<Servicio | null>(null);
    nombreServicio = '';
    descripcionServicio = '';
    precioServicio: number | null = null;

    boxes = signal<Box[]>([]);
    loadingBoxes = signal(true);
    errorBoxes = signal<string | null>(null);
    mostrarFormBox = signal(false);
    guardandoBox = signal(false);
    formErrorBox = signal<string | null>(null);
    nombreBox = '';
    servicioIdBox: number | null = null;
    capacidadBox: number | null = null;

    cupos = signal<CupoDisponible[]>([]);
    loadingCupos = signal(true);
    errorCupos = signal<string | null>(null);
    fechaFiltro = '';
    editandoCupoId = signal<number | null>(null);
    private cuposEditados: Record<number, number> = {};

    constructor() {
        this.cargarServicios();
        this.cargarBoxes();
        this.cargarCupos();
    }

    // Servicios

    cargarServicios(): void {
        this.loadingServicios.set(true);
        this.errorServicios.set(null);
        this.service.listarServicios().subscribe({
            next: servicios => {
                this.servicios.set(servicios);
                this.loadingServicios.set(false);
            },
            error: err => {
                this.errorServicios.set(this.mensajeError(err));
                this.loadingServicios.set(false);
            }
        });
    }

    abrirFormNuevoServicio(): void {
        this.servicioEnEdicion.set(null);
        this.nombreServicio = '';
        this.descripcionServicio = '';
        this.precioServicio = null;
        this.formErrorServicio.set(null);
        this.mostrarFormServicio.set(true);
    }

    abrirFormEditarServicio(servicio: Servicio): void {
        this.servicioEnEdicion.set(servicio);
        this.nombreServicio = servicio.nombre;
        this.descripcionServicio = servicio.descripcion ?? '';
        this.precioServicio = servicio.precio;
        this.formErrorServicio.set(null);
        this.mostrarFormServicio.set(true);
    }

    cerrarFormServicio(): void {
        this.mostrarFormServicio.set(false);
        this.servicioEnEdicion.set(null);
    }

    guardarServicio(): void {
        if (!this.nombreServicio.trim() || this.precioServicio == null || this.precioServicio <= 0) {
            this.formErrorServicio.set('Completa nombre y precio (mayor a 0).');
            return;
        }

        this.guardandoServicio.set(true);
        this.formErrorServicio.set(null);
        const request = {
            nombre: this.nombreServicio.trim(),
            descripcion: this.descripcionServicio.trim() || null,
            precio: this.precioServicio
        };
        const enEdicion = this.servicioEnEdicion();
        const peticion = enEdicion
            ? this.service.actualizarServicio(enEdicion.id, request)
            : this.service.crearServicio(request);

        peticion.subscribe({
            next: () => {
                this.guardandoServicio.set(false);
                this.cerrarFormServicio();
                this.cargarServicios();
            },
            error: err => {
                this.guardandoServicio.set(false);
                this.formErrorServicio.set(this.mensajeError(err));
            }
        });
    }

    // Boxes

    cargarBoxes(): void {
        this.loadingBoxes.set(true);
        this.errorBoxes.set(null);
        this.service.listarBoxes().subscribe({
            next: boxes => {
                this.boxes.set(boxes);
                this.loadingBoxes.set(false);
            },
            error: err => {
                this.errorBoxes.set(this.mensajeError(err));
                this.loadingBoxes.set(false);
            }
        });
    }

    crearBox(): void {
        if (!this.nombreBox.trim() || this.servicioIdBox == null || this.capacidadBox == null || this.capacidadBox <= 0) {
            this.formErrorBox.set('Completa nombre, servicio y capacidad diaria (mayor a 0).');
            return;
        }

        this.guardandoBox.set(true);
        this.formErrorBox.set(null);
        this.service.crearBox({
            nombre: this.nombreBox.trim(),
            servicioId: this.servicioIdBox,
            capacidadDiaria: this.capacidadBox
        }).subscribe({
            next: () => {
                this.guardandoBox.set(false);
                this.mostrarFormBox.set(false);
                this.nombreBox = '';
                this.servicioIdBox = null;
                this.capacidadBox = null;
                this.cargarBoxes();
            },
            error: err => {
                this.guardandoBox.set(false);
                this.formErrorBox.set(this.mensajeError(err));
            }
        });
    }

    // Cupos

    cargarCupos(): void {
        this.loadingCupos.set(true);
        this.errorCupos.set(null);
        this.service.listarCupos(this.fechaFiltro || undefined).subscribe({
            next: cupos => {
                this.cupos.set(cupos);
                this.loadingCupos.set(false);
            },
            error: err => {
                this.errorCupos.set(this.mensajeError(err));
                this.loadingCupos.set(false);
            }
        });
    }

    valorEditado(cupo: CupoDisponible): number {
        return this.cuposEditados[cupo.id] ?? cupo.cuposDisponibles;
    }

    actualizarValorEditado(cupo: CupoDisponible, valor: number): void {
        this.cuposEditados[cupo.id] = valor;
    }

    guardarCupo(cupo: CupoDisponible): void {
        const nuevoValor = this.cuposEditados[cupo.id];
        if (nuevoValor == null || nuevoValor < 0) {
            return;
        }

        this.editandoCupoId.set(cupo.id);
        this.errorCupos.set(null);
        this.service.actualizarCupo(cupo.id, nuevoValor).subscribe({
            next: () => {
                this.editandoCupoId.set(null);
                delete this.cuposEditados[cupo.id];
                this.cargarCupos();
            },
            error: err => {
                this.editandoCupoId.set(null);
                this.errorCupos.set(this.mensajeError(err));
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
