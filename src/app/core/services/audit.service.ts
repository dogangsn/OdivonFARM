import { Injectable, inject } from '@angular/core';
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  updateDoc,
  setDoc,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { FarmContextService } from './farm-context.service';

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
  private farmContext = inject(FarmContextService);

  private get db() {
    return getFirestore();
  }

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
   * Kullanıcının başarılı veya başarısız giriş hareketini tüm ilgili Firestore katmanlarına kaydeder.
   */
  async recordLoginLog(params: {
    uid: string;
    email?: string;
    displayName?: string;
    farmId?: string;
    farmName?: string;
    status?: 'success' | 'failed';
    errorMsg?: string;
  }): Promise<void> {
    if (!params.uid) return;

    try {
      const env = this.getClientEnvironment();
      const email = params.email || '';
      const displayName = params.displayName || email.split('@')[0] || 'Kullanıcı';
      const farmId = params.farmId || this.farmContext.activeFarmId() || '';
      const farmName = params.farmName || this.farmContext.activeFarmName() || '';
      const status = params.status || 'success';
      const now = new Date();
      const dateStr = now.toISOString();

      const logData: LoginLogEntry = {
        uid: params.uid,
        email,
        displayName,
        farmId: farmId || undefined,
        farmName: farmName || undefined,
        browser: env.browser,
        os: env.os,
        device: env.device,
        userAgent: env.userAgent,
        status,
        errorMsg: params.errorMsg,
        loginAt: serverTimestamp(),
        dateStr,
        platform: 'web',
        timestamp: dateStr,
      };

      // 1. users/{uid}/loginLogs altına bağımsız oturum günlüğü yaz
      const userLogsRef = collection(this.db, `users/${params.uid}/loginLogs`);
      await addDoc(userLogsRef, logData);

      if (status === 'success') {
        // 2. users/{uid} profilinde son giriş özetini güncelle
        try {
          const userRef = doc(this.db, `users/${params.uid}`);
          await updateDoc(userRef, {
            lastLoginAt: serverTimestamp(),
            lastLoginPlatform: `${env.browser} (${env.os})`,
            lastLoginDevice: env.device,
          });
        } catch {
          // Profil dokümanı updateDoc başarısız olursa setDoc merge ile dene
          const userRef = doc(this.db, `users/${params.uid}`);
          await setDoc(
            userRef,
            {
              lastLoginAt: serverTimestamp(),
              lastLoginPlatform: `${env.browser} (${env.os})`,
              lastLoginDevice: env.device,
            },
            { merge: true }
          );
        }

        // 3. Çiftlik üye dokümanını (farms/{farmId}/members/{uid}) güncelle
        if (farmId) {
          try {
            const memberRef = doc(this.db, `farms/${farmId}/members/${params.uid}`);
            await updateDoc(memberRef, {
              lastActiveAt: serverTimestamp(),
              lastLoginAt: serverTimestamp(),
            });
          } catch (mErr) {
            console.warn('[AuditService] Member lastActive update notice:', mErr);
          }

          // 4. Çiftlik aktivite akışına (farms/{farmId}/activityLog) Güvenlik kategorisiyle ekle
          try {
            const actRef = collection(this.db, `farms/${farmId}/activityLog`);
            await addDoc(actRef, {
              actorUid: params.uid,
              actorName: displayName,
              actorEmail: email,
              action: 'Sisteme Giriş Yapıldı',
              category: 'guvenlik',
              message: `${displayName} (${email}), ${env.browser} (${env.os}) üzerinden sisteme giriş yaptı.`,
              icon: 'heroicons_solid:login',
              color: 'emerald',
              details: {
                browser: env.browser,
                os: env.os,
                device: env.device,
                ipInfo: 'Web İstemci Doğrulaması',
                loginAt: dateStr,
              },
              date: dateStr,
              createdAt: serverTimestamp(),
            });
          } catch (actErr) {
            console.warn('[AuditService] ActivityLog insert notice:', actErr);
          }
        }
      }

      console.log(`[AuditService] Giriş logu (${params.uid}) başarıyla kaydedildi: ${env.browser} (${env.os})`);
    } catch (err) {
      console.error('[AuditService] Giriş logu kaydedilirken hata:', err);
    }
  }

  /**
   * Belirli bir kullanıcının geçmiş oturum kayıtlarını çeker.
   */
  async getUserLoginLogs(uid: string, maxCount = 10): Promise<LoginLogEntry[]> {
    if (!uid) return [];
    try {
      const q = query(
        collection(this.db, `users/${uid}/loginLogs`),
        orderBy('loginAt', 'desc'),
        limit(maxCount)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => {
        const data = d.data() as LoginLogEntry;
        return {
          id: d.id,
          ...data,
          timestamp: data.loginAt || data.dateStr,
          platform: data.platform || 'web',
        };
      });
    } catch (err) {
      console.warn('[AuditService] getUserLoginLogs error:', err);
      return [];
    }
  }
}
