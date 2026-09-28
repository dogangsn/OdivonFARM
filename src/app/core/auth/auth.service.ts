import { inject, Injectable } from '@angular/core';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { Observable, switchMap, of, catchError, from, shareReplay } from 'rxjs';
import { AppRole, AppUser, Farm, FarmMember } from '../models/farm.model';
import { FarmSubscription } from '../models/subscription.model';
import { ApiService } from '../http/api.service';
import { ApiError } from '../http/api-error';
import { FarmContextService } from '../services/farm-context.service';
import { SeedService } from '../services/seed.service';
import { EmailService } from '../services/email.service';
import { AuditService } from '../services/audit.service';

export interface RegisterDetails {
  phone?: string;
  countryCode?: string;
  country?: string;
  language?: string;
}

/** `GET /farm/me` yanıtı */
export interface FarmSession {
  uid: string;
  email: string;
  displayName: string | null;
  tenantId: string;
  isOwner: boolean;
  role: AppRole | null;
  member: FarmMember | null;
  farm: Farm & { id: string };
  subscription: FarmSubscription | null;
}

interface OnboardingInput {
  farmName?: string;
  displayName?: string;
  details?: RegisterDetails;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private farmContext = inject(FarmContextService);
  private seedService = inject(SeedService);
  private emailService = inject(EmailService);
  private auditService = inject(AuditService);
  private get auth() {
    return getAuth();
  }

  /** Aynı kullanıcı için oturum yüklemesini (me/onboarding) tek sefere indirir. */
  private session: { uid: string; promise: Promise<FarmSession> } | null = null;
  /** Kayıt formundan gelen çiftlik bilgisi; ilk oturum yüklemesinde onboarding'e aktarılır. */
  private pendingOnboarding: OnboardingInput | null = null;

  get currentUser(): User | null {
    return this.auth.currentUser;
  }

  /** Firebase Auth kullanıcı durumu */
  readonly authState$: Observable<User | null> = new Observable<User | null>((subscriber) => {
    return onAuthStateChanged(
      this.auth,
      (user) => subscriber.next(user),
      (err) => {
        console.warn('[AuthStateChanged Warning]:', err?.message || err);
        subscriber.next(null);
      }
    );
  }).pipe(catchError(() => of(null)));

  /** Main API'deki çiftlik oturumu — rol ve çiftlik üyeliği buradan gelir */
  readonly appUser$: Observable<AppUser | null> = this.authState$.pipe(
    switchMap((user) => {
      if (!user) {
        this.session = null;
        this.farmContext.setUser(null);
        return of(null);
      }
      return from(this.ensureFarm(user)).pipe(
        switchMap((session) => of(session ? this.toAppUser(session) : this.fallbackUser(user))),
        catchError((err) => {
          console.warn('[appUser$ session warning]:', err?.message || err);
          return of(this.fallbackUser(user));
        })
      );
    }),
    catchError((err) => {
      console.warn('[appUser$ stream warning]:', err?.message || err);
      return of(null);
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  async login(email: string, password: string) {
    if (email.trim().toLowerCase() === 'demo-expired@odivonfarm.com') {
      return this.ensureExpiredTestUser(password);
    }

    const cred = await signInWithEmailAndPassword(this.auth, email, password);
    try {
      await this.ensureFarm(cred.user);
    } catch (e) {
      console.warn('ensureFarm skipped or failed:', e);
    }

    // Başarılı giriş logunu kaydet
    await this.auditService.recordLoginLog();

    return cred;
  }

  /** Şifre sıfırlama e-postası gönderir */
  resetPassword(email: string) {
    return sendPasswordResetEmail(this.auth, email);
  }

  /**
   * Oturumu Main API'den yükler. Kullanıcının henüz profili yoksa (ilk giriş/kayıt)
   * kendisi için bir çiftlik açar; çiftlik sahibi her zaman Admin kabul edilir.
   */
  ensureFarm(user: User, customFarmName?: string): Promise<FarmSession | null> {
    if (customFarmName && !this.pendingOnboarding) {
      this.pendingOnboarding = { farmName: customFarmName };
    }
    if (this.session?.uid !== user.uid) {
      const promise = this.loadSession(user);
      this.session = { uid: user.uid, promise };
      // Hata sonrası bir sonraki denemede yeniden yüklenebilsin
      promise.catch(() => {
        if (this.session?.promise === promise) this.session = null;
      });
    }
    return this.session!.promise;
  }

  private async loadSession(user: User): Promise<FarmSession> {
    let session: FarmSession;
    let created = false;
    try {
      session = await this.api.get<FarmSession>('/farm/me');
    } catch (err) {
      if (!(err instanceof ApiError) || err.apiCode !== 'USER_NOT_FOUND') throw err;
      const input = this.pendingOnboarding ?? {};
      const displayName = input.displayName || user.displayName || user.email?.split('@')[0] || 'admin';
      await this.api.post('/farm/onboarding', {
        farmName: input.farmName || `${displayName} Çiftliği`,
        displayName,
        phone: input.details?.phone || undefined,
        countryCode: input.details?.countryCode || undefined,
        country: input.details?.country || undefined,
        language: input.details?.language || undefined,
      });
      created = true;
      session = await this.api.get<FarmSession>('/farm/me');
    } finally {
      this.pendingOnboarding = null;
    }

    this.applySession(session);

    // Tanımları kontrol et, boş ise otomatik tohumla (yazma yetkisi olanlar için, arka planda)
    if (!created && session.role && session.role !== 'okuyucu') {
      this.seedService.checkAndSeedIfEmpty(session.tenantId).catch(() => {});
    }
    return session;
  }

  private applySession(session: FarmSession) {
    this.farmContext.applyFarm(session.farm);
    // Üye kartı olmayan veya çıkarılmış kullanıcılar salt okunur görünür; sunucu zaten erişimi reddeder.
    this.farmContext.setUserRole(session.role ?? 'okuyucu');
    this.farmContext.setUser(session.uid);
  }

  private toAppUser(session: FarmSession): AppUser {
    return {
      uid: session.uid,
      email: session.email,
      displayName: session.displayName || session.member?.displayName || session.email.split('@')[0],
      phone: session.member?.phone || session.farm.phone || '',
      country: session.farm.country || '',
      countryCode: session.farm.countryCode || '',
      language: session.farm.language || 'tr',
      lastLoginAt: session.member?.lastLoginAt,
      memberships: [{ farmId: session.tenantId, role: session.role ?? 'okuyucu' }],
      activeFarmId: session.tenantId,
      createdAt: session.member?.createdAt,
    };
  }

  /** Main API'ye ulaşılamazsa arayüzün kilitlenmemesi için geçici profil */
  private fallbackUser(user: User): AppUser {
    const farmId = this.farmContext.activeFarmId() || 'odivon-farm-default';
    return {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || user.email?.split('@')[0] || 'admin',
      memberships: [{ farmId, role: this.farmContext.userRole() }],
      activeFarmId: farmId,
      createdAt: new Date(),
    };
  }

  /**
   * Kayıt akışı: Firebase Auth kullanıcısını oluşturur, Main API'de kendisi için bir çiftlik
   * (14 günlük deneme, Admin üyelik) açar, varsayılan tanımları (Hayvan Tipleri, Irklar,
   * Padoklar, Tedavi Türleri, Hastalıklar) seçilen dilde yükler ve Hoş Geldiniz e-postasını kuyruğa ekler.
   */
  async register(
    email: string,
    password: string,
    displayName: string,
    farmName: string,
    details?: RegisterDetails
  ) {
    const language = details?.language || 'tr';
    if (details?.language) {
      try {
        localStorage.setItem('odivon_language', details.language);
      } catch {}
    }

    this.pendingOnboarding = { farmName, displayName, details: { ...details, language } };
    const cred = await createUserWithEmailAndPassword(this.auth, email, password);
    const session = await this.ensureFarm(cred.user);

    // 1. Yeni çiftlik için varsayılan tanımları seçilen dilde tohumla
    try {
      await this.seedService.seedFarmDefaults(session?.tenantId ?? '', language);
    } catch (seedErr) {
      console.warn('[Register] Varsayılan veriler tohumlanırken hata (kayıt süreci devam ediyor):', seedErr);
    }

    // 2. Hoş Geldiniz e-postasını kuyruğa ekle
    try {
      await this.emailService.sendWelcomeEmail({ email, displayName, farmName });
    } catch (mailErr) {
      console.warn('[Register] Hoş geldiniz e-postası kuyruğa eklenirken hata (kayıt süreci devam ediyor):', mailErr);
    }

    // 3. İlk kayıt/giriş oturum logunu kaydet
    await this.auditService.recordLoginLog();

    return cred;
  }

  /**
   * 14 günlük deneme süresi dolmuş test kullanıcısı (demo-expired@odivonfarm.com)
   * Firebase Auth'ta varsa giriş yapar, yoksa oluşturur; aboneliği 5 gün önce dolmuş olarak işaretler.
   */
  async ensureExpiredTestUser(password = '123456') {
    const email = 'demo-expired@odivonfarm.com';
    this.pendingOnboarding = { farmName: 'Örnek Süresi Dolan Çiftlik', displayName: 'Demo Expired Test User' };
    let cred;
    try {
      cred = await signInWithEmailAndPassword(this.auth, email, password);
    } catch (err: any) {
      if (
        err?.code === 'auth/user-not-found' ||
        err?.code === 'auth/invalid-credential' ||
        err?.code === 'auth/wrong-password'
      ) {
        try {
          cred = await createUserWithEmailAndPassword(this.auth, email, password);
        } catch (createErr) {
          cred = await signInWithEmailAndPassword(this.auth, email, password);
        }
      } else {
        this.pendingOnboarding = null;
        throw err;
      }
    }

    if (cred?.user) {
      await this.ensureFarm(cred.user, 'Örnek Süresi Dolan Çiftlik');
      try {
        await this.api.post('/farm/subscription/expire-demo');
      } catch (subErr) {
        console.warn('[ensureExpiredTestUser] Subscription update error:', subErr);
      }
      await this.auditService.recordLoginLog();
    }

    return cred;
  }

  logout() {
    this.session = null;
    this.farmContext.setUser(null);
    return signOut(this.auth);
  }
}
