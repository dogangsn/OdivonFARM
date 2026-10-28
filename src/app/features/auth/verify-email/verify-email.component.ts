import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/auth/auth.service';
import { ApiError } from '../../../core/http/api-error';
import { AuthLayoutComponent } from '../shared/auth-layout.component';

type State = 'pending' | 'verifying' | 'verified' | 'invalid';

const RESEND_COOLDOWN_SECONDS = 60;

/**
 * İki iş görür:
 * - `?token=`: e-postadaki doğrulama bağlantısı; jetonu Main API'de onaylatır.
 * - `?email=`: kayıt veya doğrulanmamış girişten sonra "e-postanızı kontrol edin" ekranı;
 *   bağlantıyı yeniden gönderme imkânı verir.
 */
@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [FormsModule, RouterLink, MatIconModule, AuthLayoutComponent],
  templateUrl: './verify-email.component.html',
  styleUrl: '../shared/auth-form.scss',
})
export class VerifyEmailComponent implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);

  state = signal<State>('pending');
  /** Kayıttan hemen sonra mı geldik (başlık metni için) */
  justRegistered = signal(false);
  email = signal('');
  verifiedEmail = signal('');
  error = signal<string | null>(null);

  resendLoading = signal(false);
  resendSuccess = signal<string | null>(null);
  resendError = signal<string | null>(null);
  cooldown = signal(0);
  private cooldownTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    const params = this.route.snapshot.queryParamMap;
    const token = params.get('token');
    this.email.set(params.get('email') ?? '');
    this.justRegistered.set(params.get('new') === '1');
    if (token) {
      void this.verify(token);
    } else if (this.justRegistered()) {
      // Kayıtta bağlantı zaten gönderildi; hemen tekrar göndermeyi bir süre engelle
      this.startCooldown();
    }
  }

  ngOnDestroy() {
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
  }

  private async verify(token: string) {
    this.state.set('verifying');
    try {
      const res = await this.auth.verifyEmail(token);
      this.verifiedEmail.set(res?.email ?? '');
      this.state.set('verified');
    } catch (err) {
      this.state.set('invalid');
      const apiCode = err instanceof ApiError ? err.apiCode : undefined;
      this.error.set(
        apiCode === 'VERIFICATION_TOKEN_EXPIRED'
          ? 'Doğrulama bağlantısının süresi dolmuş. Aşağıdan yeni bir bağlantı isteyebilirsiniz.'
          : apiCode === 'VERIFICATION_TOKEN_INVALID'
            ? 'Bu doğrulama bağlantısı geçersiz ya da daha önce kullanılmış. Hesabınız zaten doğrulandıysa giriş yapabilirsiniz.'
            : err instanceof Error
              ? err.message
              : 'Doğrulama tamamlanamadı. Lütfen biraz sonra tekrar deneyin.'
      );
    }
  }

  async resend() {
    if (this.resendLoading() || this.cooldown() > 0) return;
    const target = this.email().trim();
    if (!target) {
      this.resendError.set('Lütfen e-posta adresinizi girin.');
      return;
    }
    this.resendLoading.set(true);
    this.resendError.set(null);
    this.resendSuccess.set(null);
    try {
      await this.auth.resendVerification(target);
      this.resendSuccess.set(
        `Yeni doğrulama bağlantısı "${target}" adresine gönderildi. Gelen kutunuzu ve spam klasörünüzü kontrol edin.`
      );
      this.startCooldown();
    } catch (err) {
      this.resendError.set(
        err instanceof Error ? err.message : 'Doğrulama e-postası gönderilemedi. Lütfen daha sonra tekrar deneyin.'
      );
    } finally {
      this.resendLoading.set(false);
    }
  }

  private startCooldown() {
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
    this.cooldown.set(RESEND_COOLDOWN_SECONDS);
    this.cooldownTimer = setInterval(() => {
      const next = this.cooldown() - 1;
      this.cooldown.set(Math.max(next, 0));
      if (next <= 0 && this.cooldownTimer) {
        clearInterval(this.cooldownTimer);
        this.cooldownTimer = null;
      }
    }, 1000);
  }
}
