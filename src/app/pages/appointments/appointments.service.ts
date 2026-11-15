import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../core/api-url';

export type EstadoAtencion =
    | 'SOLICITADA'
    | 'CONFIRMADA'
    | 'EN_ESPERA'
    | 'EN_ATENCION'
    | 'CERRADA'
    | 'CANCELADA';

export interface Atencion {
    id: number;
    paciente: string;
    servicio: string;
    box: string | null;
    fechaHora: string;
    estado: EstadoAtencion;
    fechaCreacion: string;
}

export interface CrearAtencionRequest {
    paciente: string;
    servicio: string;
    box: string | null;
    fechaHora: string;
}

/** Habla con el BFF (/api/v1/appointments), no directo con ms-vidasalud-appointments. */
@Injectable({ providedIn: 'root' })
export class AppointmentsService {
    private http = inject(HttpClient);
    private baseUrl = `${inject(API_URL)}/appointments`;

    listar(): Observable<Atencion[]> {
        return this.http.get<Atencion[]>(this.baseUrl);
    }

    crear(request: CrearAtencionRequest): Observable<Atencion> {
        return this.http.post<Atencion>(this.baseUrl, request);
    }

    cambiarEstado(id: number, status: EstadoAtencion): Observable<Atencion> {
        return this.http.put<Atencion>(`${this.baseUrl}/${id}/status`, { status });
    }
}
