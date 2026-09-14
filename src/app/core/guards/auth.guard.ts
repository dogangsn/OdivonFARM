import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs';
import { AuthService } from '../auth/auth.service';

/** Giriş yapılmamışsa /auth/login sayfasına yönlendirir */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.authState$.pipe(
    take(1),
    map((user) => (user ? true : router.createUrlTree(['/auth/login'])))
  );
};

/**
 * Rol bazlı erişim kontrolü. Kullanım (route data):
 *   { path: 'muhasebe', canActivate: [roleGuard], data: { roles: ['admin', 'muhasebe'] } }
 */
export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowedRoles = (route.data?.['roles'] as string[]) ?? [];

  return auth.appUser$.pipe(
    take(1),
    map((appUser) => {
      const activeFarmId = appUser?.activeFarmId;
      const membership = appUser?.memberships.find((m) => m.farmId === activeFarmId);
      const hasAccess = !allowedRoles.length || (membership && allowedRoles.includes(membership.role));
      return hasAccess ? true : router.createUrlTree(['/']);
    })
  );
};
