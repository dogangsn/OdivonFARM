import { Component, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FarmSceneComponent } from './farm-scene.component';

const THEME_KEY = 'odivon_auth_theme';

/**
 * Login ve kayıt ekranlarının ortak iskeleti.
 * Solda çiftlik manzarası (açık temada gündüz, koyu temada gece),
 * sağda form alanı. Form içeriği <ng-content> ile yerleşir.
 * Açık/koyu tema seçimi sadece bu ekranlara uygulanır ve hatırlanır.
 */
@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterLink, MatIconModule, FarmSceneComponent],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.scss',
})
export class AuthLayoutComponent {
  mode = input<'login' | 'register'>('login');

  isDark = signal(this.readInitialTheme());

  toggleTheme() {
    this.isDark.update((v) => !v);
    try {
      localStorage.setItem(THEME_KEY, this.isDark() ? 'dark' : 'light');
    } catch {
      /* tarayıcı depolaması kapalı olabilir */
    }
  }

  private readInitialTheme(): boolean {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'dark' || saved === 'light') return saved === 'dark';
    } catch {
      /* yoksay */
    }
    return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  }
}
