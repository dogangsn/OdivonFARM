import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { initializeApp, getApps, getApp } from 'firebase/app';

import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { provideIcons } from './core/icons/icons.provider';

// Initialize native Firebase 12 singleton once
if (!getApps().length) {
  initializeApp(environment.firebase);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideAnimationsAsync(),
    provideIcons(),
  ],
};
