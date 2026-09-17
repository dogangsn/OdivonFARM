import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/auth/auth.service';

export interface CountryOption {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  defaultLang: string;
  phonePlaceholder: string;
}

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const COUNTRIES: CountryOption[] = [
  { code: 'TR', name: 'Türkiye', dialCode: '+90', flag: '🇹🇷', defaultLang: 'tr', phonePlaceholder: '5XX XXX XX XX' },
  { code: 'DE', name: 'Deutschland (Almanya)', dialCode: '+49', flag: '🇩🇪', defaultLang: 'de', phonePlaceholder: '151 23456789' },
  { code: 'NL', name: 'Nederland (Hollanda)', dialCode: '+31', flag: '🇳🇱', defaultLang: 'nl', phonePlaceholder: '6 12345678' },
  { code: 'RU', name: 'Россия (Rusya)', dialCode: '+7', flag: '🇷🇺', defaultLang: 'ru', phonePlaceholder: '900 123 45 67' },
  { code: 'GB', name: 'United Kingdom (İngiltere)', dialCode: '+44', flag: '🇬🇧', defaultLang: 'en', phonePlaceholder: '7911 123456' },
  { code: 'US', name: 'United States (ABD)', dialCode: '+1', flag: '🇺🇸', defaultLang: 'en', phonePlaceholder: '(555) 000-0000' },
  { code: 'AZ', name: 'Azərbaycan (Azerbaycan)', dialCode: '+994', flag: '🇦🇿', defaultLang: 'tr', phonePlaceholder: '50 XXX XX XX' },
  { code: 'FR', name: 'France (Fransa)', dialCode: '+33', flag: '🇫🇷', defaultLang: 'en', phonePlaceholder: '6 12 34 56 78' },
  { code: 'BE', name: 'België / Belgique (Belçika)', dialCode: '+32', flag: '🇧🇪', defaultLang: 'nl', phonePlaceholder: '470 12 34 56' },
  { code: 'AT', name: 'Österreich (Avusturya)', dialCode: '+43', flag: '🇦🇹', defaultLang: 'de', phonePlaceholder: '664 1234567' },
  { code: 'CH', name: 'Schweiz (İsviçre)', dialCode: '+41', flag: '🇨🇭', defaultLang: 'de', phonePlaceholder: '79 123 45 67' },
  { code: 'ES', name: 'España (İspanya)', dialCode: '+34', flag: '🇪🇸', defaultLang: 'en', phonePlaceholder: '612 34 56 78' },
  { code: 'IT', name: 'Italia (İtalya)', dialCode: '+39', flag: '🇮🇹', defaultLang: 'en', phonePlaceholder: '320 123 4567' },
  { code: 'KZ', name: 'Kazakhstan (Kazakistan)', dialCode: '+7', flag: '🇰🇿', defaultLang: 'ru', phonePlaceholder: '701 123 4567' },
  { code: 'UZ', name: 'Uzbekistan (Özbekistan)', dialCode: '+998', flag: '🇺🇿', defaultLang: 'ru', phonePlaceholder: '90 123 45 67' },
  { code: 'SA', name: 'Saudi Arabia (Suudi Arabistan)', dialCode: '+966', flag: '🇸🇦', defaultLang: 'en', phonePlaceholder: '50 123 4567' },
  { code: 'AE', name: 'United Arab Emirates (BAE)', dialCode: '+971', flag: '🇦🇪', defaultLang: 'en', phonePlaceholder: '50 123 4567' },
  { code: 'OTHER', name: 'Diğer / Other', dialCode: '+1', flag: '🌍', defaultLang: 'en', phonePlaceholder: 'Phone number' },
];

export const LANGUAGES: LanguageOption[] = [
  { code: 'tr', name: 'Türkçe', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', name: 'İngilizce', nativeName: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Almanca', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'nl', name: 'Felemenkçe', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'ru', name: 'Rusça', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'fr', name: 'Fransızca', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'İspanyolca', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'ar', name: 'Arapça', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'az', name: 'Azerbaycanca', nativeName: 'Azərbaycan', flag: '🇦🇿' },
];

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

  countries = COUNTRIES;
  languages = LANGUAGES;
  selectedCountry = signal<CountryOption>(COUNTRIES[0]);
  phone = signal('');
  language = signal<string>('tr');

  selectedLanguageOption = computed(() => {
    return this.languages.find((l) => l.code === this.language()) || this.languages[0];
  });

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

  onCountryChange(code: string) {
    const found = this.countries.find((c) => c.code === code) || this.countries[0];
    this.selectedCountry.set(found);
    if (found.defaultLang) {
      this.language.set(found.defaultLang);
    }
  }

  setLanguage(lang: string) {
    this.language.set(lang);
  }

  async submit() {
    if (this.loading()) return;
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
      const fullPhone = this.phone().trim()
        ? `${this.selectedCountry().dialCode} ${this.phone().trim()}`
        : '';

      await this.auth.register(emailVal, passVal, nameVal, farmName, {
        phone: fullPhone,
        countryCode: this.selectedCountry().code,
        country: this.selectedCountry().name,
        language: this.language(),
      });

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

