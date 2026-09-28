import { HttpInterceptorFn } from '@angular/common/http';
import { getAuth } from 'firebase/auth';
import { from, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Attaches the signed-in user's Firebase ID token to requests aimed at Odivon Main API only. */
export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiBaseUrl)) {
    return next(req);
  }

  // Uygulama açılışında Firebase oturumu geri yüklenene kadar bekle, sonra token ekle.
  const auth = getAuth();
  const token = auth.authStateReady().then(() => auth.currentUser?.getIdToken() ?? null);
  return from(token).pipe(
    switchMap((token) => {
      const authedReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
      return next(authedReq);
    }),
  );
};
