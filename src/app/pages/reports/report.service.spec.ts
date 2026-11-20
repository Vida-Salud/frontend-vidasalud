import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_URL } from '../../core/api-url';
import { ReportService } from './report.service';

describe('ReportService', () => {
    it('pide los KPIs y los servicios más demandados con su rango', () => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting(),
                        { provide: API_URL, useValue: 'http://api/api/v1' }]
        });
        const service = TestBed.inject(ReportService);
        const http = TestBed.inject(HttpTestingController);

        service.kpis('last24h').subscribe();
        service.serviciosMasDemandados('last7d', 3).subscribe();

        http.expectOne('http://api/api/v1/report/kpis?range=last24h').flush({});
        http.expectOne('http://api/api/v1/report/top-services?range=last7d&limit=3').flush({ servicios: [] });
        http.verify();
    });
});
