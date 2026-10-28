import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, filter, from, map, of, switchMap, take } from 'rxjs';
import { AuthService, isEmailNotVerified } from '../auth/auth.service';

/**
 * Giriş yapılmamışsa /auth/login sayfasına yönlendirir.
 * E-postasını doğrulamamış hesabın oturumu kapatılır ve doğrulama ekranına gönderilir.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.authState$.pipe(
    take(1),
    switchMap((user) => {
      if (!user) return of(router.createUrlTree(['/auth/login']));
      return from(auth.ensureFarm(user)).pipe(
        map(() => true as const),
        catchError((err) => {
          if (!isEmailNotVerified(err)) return of(true as const); // sunucu hatası: eski davranış
          const email = user.email ?? '';
          return from(auth.logout()).pipe(
            map(() => router.createUrlTree(['/auth/verify-email'], { queryParams: { email } }))
          );
        })
      );
    })
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
    filter((appUser) => appUser !== null && appUser !== undefined),
    take(1),
    map((appUser) => {
      const activeFarmId = appUser?.activeFarmId;
      const membership = appUser?.memberships?.find((m) => m.farmId === activeFarmId);
      const role = membership?.role || 'admin';
      const hasAccess = !allowedRoles.length || allowedRoles.includes(role);
      return hasAccess ? true : router.createUrlTree(['/anasayfa']);
    })
  );
};
