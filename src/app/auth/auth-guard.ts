import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * A diferencia de MsalGuard, no dispara login interactivo. Si no hay sesión
 * activa simplemente cancela la navegación (el usuario ve la pantalla de
 * bienvenida en app.html con el botón "Iniciar Sesión").
 */
export const authGuard: CanActivateFn = () => {
    return inject(AuthService).isLoggedIn;
};
