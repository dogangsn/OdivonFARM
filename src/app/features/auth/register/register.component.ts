import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  name = signal('');
  farmName = signal('');
  email = signal('');
  password = signal('');
  showPassword = signal(false);
  termsAccepted = signal(true);
  error = signal<string | null>(null);
  loading = signal(false);

  togglePasswordVisibility() {
    this.showPassword.update((v) => !v);
  }

  async submit() {
    const nameVal = this.name().trim();
    const emailVal = this.email().trim();
    const passVal = this.password();

    if (!nameVal || !emailVal || !passVal) {
      this.error.set('Lütfen adınızı, e-posta adresinizi ve şifrenizi girin.');
      return;
    }

    if (!this.termsAccepted()) {
      this.error.set('Lütfen kullanım koşullarını kabul edin.');
      return;
    }

    this.error.set(null);
    this.loading.set(true);

    try {
      const farmName = this.farmName().trim() || `${nameVal} Çiftliği`;
      await this.auth.register(emailVal, passVal, nameVal, farmName);
      await this.router.navigateByUrl('/anasayfa');
    } catch (e: any) {
      console.error('Kayıt hatası:', e);
      let msg = 'Kayıt başarısız: ' + (e?.message ?? 'bilinmeyen hata');
      if (e?.code === 'auth/email-already-in-use') {
        msg = 'Bu e-posta adresi zaten kullanımda.';
      } else if (e?.code === 'auth/weak-password') {
        msg = 'Şifre çok zayıf. En az 6 karakter olmalıdır.';
      } else if (e?.code === 'auth/invalid-email') {
        msg = 'Geçersiz e-posta formatı.';
      }
      this.error.set(msg);
    } finally {
      this.loading.set(false);
    }
  }
}
