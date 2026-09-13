import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { roleGuard } from './auth/role-guard';
import { authGuard } from './auth/auth-guard';

import { Dashboard } from './pages/dashboard/dashboard';
import { Appointments } from './pages/appointments/appointments';
import { Catalog } from './pages/catalog/catalog';
import { Reports } from './pages/reports/reports';
import { Audit } from './pages/audit/audit';
import { Forbidden } from './forbidden/forbidden';
import { TokenInfo } from './token-info/token-info';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        component: Dashboard,
        canActivate: [authGuard]
    },
    {
        path: 'dashboard',
        component: Dashboard,
        canActivate: [MsalGuard]
    },
    {
        path: 'appointments',
        component: Appointments,
        canActivate: [MsalGuard, roleGuard('Admin', 'Operador', 'Cliente')]
    },
    {
        path: 'catalog',
        component: Catalog,
        canActivate: [MsalGuard, roleGuard('Admin', 'Operador')]
    },
    {
        path: 'reports',
        component: Reports,
        canActivate: [MsalGuard, roleGuard('Admin')]
    },
    {
        path: 'audit',
        component: Audit,
        canActivate: [MsalGuard, roleGuard('Admin', 'Auditor')]
    },
    { path: 'forbidden', component: Forbidden },
    {
        path: 'token',
        component: TokenInfo,
        canActivate: [MsalGuard]
    },
    { path: '**', redirectTo: '' }
];