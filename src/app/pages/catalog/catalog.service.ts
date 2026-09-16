import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Servicio {
    id: number;
    nombre: string;
    descripcion: string | null;
    precio: number;
    activo: boolean;
    fechaCreacion: string;
}

export interface CrearServicioRequest {
    nombre: string;
    descripcion: string | null;
    precio: number;
}

export interface ActualizarServicioRequest {
    nombre: string;
    descripcion: string | null;
    precio: number;
}

export interface Box {
    id: number;
    nombre: string;
    servicioId: number;
    servicioNombre: string;
    capacidadDiaria: number;
    activo: boolean;
    fechaCreacion: string;
}

export interface CrearBoxRequest {
    nombre: string;
    servicioId: number;
    capacidadDiaria: number;
}

export interface CupoDisponible {
    id: number;
    boxId: number;
    boxNombre: string;
    fecha: string;
    cuposDisponibles: number;
}

/** Habla con el BFF (/api/catalog), no directo con ms-vidasalud-catalog. */
@Injectable({ providedIn: 'root' })
export class CatalogService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiBaseUrl}/api/catalog`;

    // === Servicios ===

    listarServicios(): Observable<Servicio[]> {
        return this.http.get<Servicio[]>(`${this.baseUrl}/services`);
    }

    crearServicio(request: CrearServicioRequest): Observable<Servicio> {
        return this.http.post<Servicio>(`${this.baseUrl}/services`, request);
    }

    actualizarServicio(id: number, request: ActualizarServicioRequest): Observable<Servicio> {
        return this.http.put<Servicio>(`${this.baseUrl}/services/${id}`, request);
    }

    // === Boxes ===

    listarBoxes(servicioId?: number): Observable<Box[]> {
        const url = servicioId != null
            ? `${this.baseUrl}/boxes?servicioId=${servicioId}`
            : `${this.baseUrl}/boxes`;
        return this.http.get<Box[]>(url);
    }

    crearBox(request: CrearBoxRequest): Observable<Box> {
        return this.http.post<Box>(`${this.baseUrl}/boxes`, request);
    }

    // === Cupos ===

    listarCupos(fecha?: string): Observable<CupoDisponible[]> {
        const url = fecha
            ? `${this.baseUrl}/cupos?fecha=${fecha}`
            : `${this.baseUrl}/cupos`;
        return this.http.get<CupoDisponible[]>(url);
    }

    actualizarCupo(id: number, cuposDisponibles: number): Observable<CupoDisponible> {
        return this.http.put<CupoDisponible>(`${this.baseUrl}/cupos/${id}`, { cuposDisponibles });
    }
}
