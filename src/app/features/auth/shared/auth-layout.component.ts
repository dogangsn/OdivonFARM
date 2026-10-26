import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

/**
 * Login ve kayıt ekranlarının ortak iskeleti:
 * koyu aurora arka plan, solda ürün önizlemesi, sağda cam efektli form kartı.
 * Form içeriği <ng-content> ile kartın içine yerleşir.
 */
@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.scss',
})
export class AuthLayoutComponent {
  mode = input<'login' | 'register'>('login');

  /** Önizlemedeki küçük sütun grafiğinin yükseklikleri (%). */
  readonly bars = [38, 52, 45, 61, 57, 70, 66, 78, 74, 86, 82, 94];
}
