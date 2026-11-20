import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_URL } from '../../core/api-url';
import { AuditService } from './audit.service';

describe('AuditService', () => {
    it('envía solo los filtros con valor', () => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting(),
                        { provide: API_URL, useValue: 'http://api/api/v1' }]
        });
        const service = TestBed.inject(AuditService);
        const http = TestBed.inject(HttpTestingController);

        service.buscar({ usuario: ' olga ', type: '', atencionId: null, from: '2026-11-01' }).subscribe();

        http.expectOne('http://api/api/v1/audit?usuario=olga&from=2026-11-01').flush([]);
        http.verify();
    });
});
