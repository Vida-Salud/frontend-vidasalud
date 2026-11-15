import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_URL } from '../../core/api-url';
import { AppointmentsService } from './appointments.service';

describe('AppointmentsService', () => {
    it('llama a la API v1 que recibe por inyección', () => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting(),
                        { provide: API_URL, useValue: 'http://api/api/v1' }]
        });
        const service = TestBed.inject(AppointmentsService);
        const http = TestBed.inject(HttpTestingController);

        service.listar().subscribe();

        http.expectOne('http://api/api/v1/appointments').flush([]);
        http.verify();
    });
});
