import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthHighlight, AuthShowcaseComponent } from '../shared/auth-showcase.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    AuthShowcaseComponent,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  isProduction = environment.production;

  readonly highlights: AuthHighlight[] = [
    { icon: 'heroicons_outline:chip', title: 'RFID ile canlı sayım', text: 'Küpe okuyucuyla sürünüzü saniyeler içinde sayın.' },
    { icon: 'heroicons_outline:heart', title: 'Sağlık ve döl takibi', text: 'Aşı, tedavi, gebelik ve doğum kayıtları tek yerde.' },
    { icon: 'heroicons_outline:chart-bar', title: 'Rasyon ve maliyet analizi', text: 'Yem, gelir ve giderlerinizi net raporlarla görün.' },
  ];

  email = signal('');
  password = signal('');
  rememberMe = signal(true);
  showPassword = signal(false);
  error = signal<string | null>(null);
  loading = signal(false);

  // Şifremi Unuttum Modal Durumu
  showResetModal = signal(false);
  resetEmail = signal('');
  resetLoading = signal(false);
  resetSuccess = signal<string | null>(null);
  resetError = signal<string | null>(null);

  togglePasswordVisibility() {
    this.showPassword.update((v) => !v);
  }

  openResetModal() {
    if (this.loading()) return;
    this.resetEmail.set(this.email().trim());
    this.resetSuccess.set(null);
    this.resetError.set(null);
    this.showResetModal.set(true);
  }

  closeResetModal() {
    this.showResetModal.set(false);
  }

  async submitReset() {
    if (this.resetLoading()) return;
    const targetEmail = this.resetEmail().trim();
    if (!targetEmail) {
      this.resetError.set('Lütfen e-posta adresinizi giriniz.');
      return;
    }

    this.resetLoading.set(true);
    this.resetError.set(null);
    this.resetSuccess.set(null);

    try {
      await this.auth.resetPassword(targetEmail);
      this.resetSuccess.set(
        `Şifre sıfırlama bağlantısı "${targetEmail}" adresine gönderildi. Lütfen gelen kutunuzu ve spam klasörünüzü kontrol edin.`
      );
    } catch (e: any) {
      console.error('Şifre sıfırlama hatası:', e);
      let msg = 'Şifre sıfırlama e-postası gönderilemedi.';
      if (e?.code === 'auth/user-not-found') {
        msg = 'Bu e-posta adresine kayıtlı kullanıcı bulunamadı.';
      } else if (e?.code === 'auth/invalid-email') {
        msg = 'Geçersiz e-posta formatı.';
      }
      this.resetError.set(msg);
    } finally {
      this.resetLoading.set(false);
    }
  }

  async submit() {
    if (this.loading()) return;
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
      if (e?.code === 'auth/user-not-found' || e?.code === 'auth/invalid-credential') {
        msg = 'Giriş bilgileri hatalı veya kullanıcı bulunamadı.';
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
