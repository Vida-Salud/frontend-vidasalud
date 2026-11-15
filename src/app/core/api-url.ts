import { InjectionToken } from '@angular/core';

/** URL base de la API con su versión, por ejemplo https://.../vidasalud/api/v1. */
export const API_URL = new InjectionToken<string>('API_URL');
