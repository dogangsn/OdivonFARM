import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = signal('');
  password = signal('');
  rememberMe = signal(true);
  showPassword = signal(false);
  error = signal<string | null>(null);
  loading = signal(false);

  togglePasswordVisibility() {
    this.showPassword.update((v) => !v);
  }

  fillDemoCredentials() {
    this.email.set('admin@odivonfarm.com');
    this.password.set('123456');
  }

  async submit() {
    const emailVal = this.email().trim();
    const passVal = this.password();

    if (!emailVal || !passVal) {
      this.error.set('Lütfen e-posta adresinizi ve şifrenizi girin.');
      return;
    }

    this.error.set(null);
    this.loading.set(true);

    try {
      await this.auth.login(emailVal, passVal);
      await this.router.navigateByUrl('/anasayfa');
    } catch (e: any) {
      console.error('Giriş hatası:', e);
      let msg = 'Giriş başarısız: e-posta veya şifre hatalı.';
      if (e?.code === 'auth/user-not-found') {
        msg = 'Bu e-posta adresine kayıtlı kullanıcı bulunamadı.';
      } else if (e?.code === 'auth/wrong-password') {
        msg = 'Girdiğiniz şifre hatalı. Lütfen tekrar deneyin.';
      } else if (e?.code === 'auth/invalid-email') {
        msg = 'Geçersiz e-posta formatı.';
      } else if (e?.code === 'auth/too-many-requests') {
        msg = 'Çok fazla başarısız deneme. Lütfen bir süre sonra tekrar deneyin.';
      }
      this.error.set(msg);
    } finally {
      this.loading.set(false);
    }
  }
}
