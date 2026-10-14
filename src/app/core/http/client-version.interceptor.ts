import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BUILD_INFO } from '../version/build-info';
import { VersionService } from '../version/version.service';

/**
 * Tells Main API which client build is calling, so it can ask outdated tabs to update;
 * a 426 (Upgrade Required) answer opens the mandatory update dialog.
 */
export const clientVersionInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiBaseUrl)) return next(req);
  const version = inject(VersionService);
  return next(req.clone({ setHeaders: { 'X-Client-Version': `${BUILD_INFO.version}+${BUILD_INFO.commit}` } })).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 426) version.forceUpdate();
      return throwError(() => error);
    }),
  );
};
