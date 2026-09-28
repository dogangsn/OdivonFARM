import { Injectable, inject } from '@angular/core';
import { ApiService } from '../http/api.service';

export interface LoginLogEntry {
  id?: string;
  uid: string;
  email: string;
  displayName: string;
  farmId?: string | null;
  farmName?: string | null;
  browser: string;
  os: string;
  device: string;
  userAgent: string;
  status: 'success' | 'failed';
  errorMsg?: string;
  loginAt: any;
  dateStr: string;
  platform?: string;
  timestamp?: any;
}

export interface ClientEnvironment {
  browser: string;
  os: string;
  device: string;
  userAgent: string;
}

@Injectable({ providedIn: 'root' })
export class AuditService {
  private api = inject(ApiService);

  /**
   * Tarayıcı, İşletim Sistemi ve Cihaz tipini userAgent ve ekran üzerinden çözer.
   */
  getClientEnvironment(): ClientEnvironment {
    if (typeof window === 'undefined' || !navigator) {
      return {
        browser: 'Web İstemcisi',
        os: 'Bilinmiyor',
        device: 'Masaüstü',
        userAgent: '',
      };
    }

    const ua = navigator.userAgent || '';
    let browser = 'Bilinmeyen Tarayıcı';
    let os = 'Bilinmeyen İşletim Sistemi';
    let device = 'Masaüstü';

    // 1. Tarayıcı Tespiti
    if (ua.includes('Edg/')) {
      browser = 'Microsoft Edge';
    } else if (ua.includes('Chrome/') && !ua.includes('Edg/')) {
      browser = 'Google Chrome';
    } else if (ua.includes('Firefox/')) {
      browser = 'Mozilla Firefox';
    } else if (ua.includes('Safari/') && !ua.includes('Chrome/')) {
      browser = 'Apple Safari';
    } else if (ua.includes('OPR/') || ua.includes('Opera/')) {
      browser = 'Opera';
    }

    // 2. İşletim Sistemi Tespiti
    if (ua.includes('Windows NT 10.0') || ua.includes('Windows NT 11.0') || ua.includes('Windows')) {
      os = 'Windows';
    } else if (ua.includes('Macintosh') || ua.includes('Mac OS X')) {
      os = 'macOS';
    } else if (ua.includes('Android')) {
      os = 'Android';
      device = 'Mobil';
    } else if (ua.includes('iPhone')) {
      os = 'iOS (iPhone)';
      device = 'Mobil';
    } else if (ua.includes('iPad')) {
      os = 'iPadOS (iPad)';
      device = 'Tablet';
    } else if (ua.includes('Linux')) {
      os = 'Linux';
    }

    // 3. Ekran Boyutuna Göre Cihaz Doğrulaması
    if (device === 'Masaüstü' && window.innerWidth <= 768) {
      device = 'Mobil';
    } else if (device === 'Masaüstü' && window.innerWidth <= 1024) {
      device = 'Tablet';
    }

    return {
      browser,
      os,
      device,
      userAgent: ua,
    };
  }

  /**
   * Oturumdaki kullanıcının başarılı girişini Main API'ye kaydeder: çiftliğin giriş günlüğü,
   * üyenin "son aktif" bilgisi ve aktivite akışında Güvenlik kaydı sunucuda oluşturulur.
   * Giriş akışını hiçbir zaman bozmaz.
   */
  async recordLoginLog(): Promise<void> {
    try {
      const env = this.getClientEnvironment();
      await this.api.post('/farm/login-logs', {
        browser: env.browser,
        os: env.os,
        device: env.device,
        userAgent: env.userAgent.slice(0, 500),
      });
    } catch (err) {
      console.warn('[AuditService] Giriş logu kaydedilemedi:', err);
    }
  }

  /**
   * Belirli bir kullanıcının geçmiş oturum kayıtlarını çeker (yönetici veya kullanıcının kendisi).
   */
  async getUserLoginLogs(uid: string, maxCount = 10): Promise<LoginLogEntry[]> {
    if (!uid) return [];
    try {
      return await this.api.get<LoginLogEntry[]>(`/farm/login-logs/${encodeURIComponent(uid)}`, {
        limit: Math.min(Math.max(maxCount, 1), 50),
      });
    } catch (err) {
      console.warn('[AuditService] getUserLoginLogs error:', err);
      return [];
    }
  }
}
