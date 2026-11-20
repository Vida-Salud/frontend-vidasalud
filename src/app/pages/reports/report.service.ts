import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../core/api-url';

export interface ConteoPorHora {
    hora: string;
    cantidad: number;
}

export interface ConteoPorEstado {
    estado: string;
    cantidad: number;
}

export interface ConteoPorServicio {
    servicio: string;
    cantidad: number;
}

/** Respuesta de GET /report/kpis (KpisResponse de ms-vidasalud-report). */
export interface Kpis {
    rango: string;
    desde: string;
    hasta: string;
    totalAtenciones: number;
    tiempoEsperaPromedioMinutos: number | null;
    atencionesPorHora: ConteoPorHora[];
    atencionesPorEstado: ConteoPorEstado[];
}

/** Respuesta de GET /report/top-services (TopServiciosResponse de ms-vidasalud-report). */
export interface TopServicios {
    rango: string;
    desde: string;
    hasta: string;
    servicios: ConteoPorServicio[];
}

/** Habla con el BFF (/api/v1/report). Los datos los arma ms-vidasalud-report a partir de Kafka. */
@Injectable({ providedIn: 'root' })
export class ReportService {
    private http = inject(HttpClient);
    private baseUrl = `${inject(API_URL)}/report`;

    kpis(range: string): Observable<Kpis> {
        return this.http.get<Kpis>(`${this.baseUrl}/kpis`, { params: new HttpParams().set('range', range) });
    }

    serviciosMasDemandados(range: string, limit = 5): Observable<TopServicios> {
        const params = new HttpParams().set('range', range).set('limit', limit);
        return this.http.get<TopServicios>(`${this.baseUrl}/top-services`, { params });
    }
}
