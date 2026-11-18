import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../core/api-url';

export interface EntradaAuditoria {
    eventId: string;
    tipo: string;
    ocurridoEn: string;
    atencionId: number;
    estadoAnterior: string | null;
    estado: string;
    actorId: string | null;
    actorNombre: string | null;
    actorRol: string | null;
    origenServicio: string | null;
    origenIp: string | null;
    traceId: string | null;
}

export interface FiltrosAuditoria {
    usuario?: string;
    type?: string;
    atencionId?: number | null;
    from?: string;
    to?: string;
}

/** Habla con el BFF (/api/v1/audit). El timeline lo arma ms-vidasalud-audit desde Kafka (audit.timeline). */
@Injectable({ providedIn: 'root' })
export class AuditService {
    private http = inject(HttpClient);
    private baseUrl = `${inject(API_URL)}/audit`;

    buscar(filtros: FiltrosAuditoria): Observable<EntradaAuditoria[]> {
        let params = new HttpParams();
        for (const [clave, valor] of Object.entries(filtros)) {
            if (valor !== undefined && valor !== null && `${valor}`.trim() !== '') {
                params = params.set(clave, `${valor}`.trim());
            }
        }
        return this.http.get<EntradaAuditoria[]>(this.baseUrl, { params });
    }

    timeline(atencionId: number): Observable<EntradaAuditoria[]> {
        return this.http.get<EntradaAuditoria[]>(`${this.baseUrl}/appointments/${atencionId}`);
    }
}
