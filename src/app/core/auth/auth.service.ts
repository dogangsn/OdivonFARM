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
import {
  getFirestore,
  doc,
  setDoc,
  addDoc,
  collection,
  serverTimestamp,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { Observable, switchMap, of, catchError } from 'rxjs';
import { AppUser, Farm } from '../models/farm.model';
import { FarmContextService } from '../services/farm-context.service';
import { SeedService } from '../services/seed.service';
import { EmailService } from '../services/email.service';
import { AuditService } from '../services/audit.service';
import { docData } from '../services/firestore-helpers';

export interface RegisterDetails {
  phone?: string;
  countryCode?: string;
  country?: string;
  language?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private farmContext = inject(FarmContextService);
  private seedService = inject(SeedService);
  private emailService = inject(EmailService);
  private auditService = inject(AuditService);
  private get auth() {
    return getAuth();
  }
  private get db() {
    return getFirestore();
  }

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

  /** users/{uid} profili — rol ve çiftlik üyelikleri burada */
  readonly appUser$: Observable<AppUser | null> = this.authState$.pipe(
    switchMap((user) => {
      this.farmContext.setUser(user?.uid ?? null);
      if (!user) return of(null);
      // Ensure farm document exists (arka planda çalışır, UI'ı bloklamaz)
      this.ensureFarm(user).catch((err) => console.warn('ensureFarm skipped:', err?.message || err));
      const ref = doc(this.db, `users/${user.uid}`);
      return docData(ref).pipe(
        catchError((err) => {
          console.warn('[appUser$ docData catchError]:', err?.message || err);
          return of(undefined);
        }),
        switchMap((profile) => {
          const appUser = profile as AppUser | undefined;
          if (appUser?.activeFarmId) {
            this.farmContext.setActiveFarm(appUser.activeFarmId);
            if (appUser.memberships?.length) {
              this.farmContext.loadUserFarms(appUser.memberships.map((m) => m.farmId));
              const match = appUser.memberships.find((m) => m.farmId === appUser.activeFarmId);
              if (match?.role) {
                this.farmContext.setUserRole(match.role);
              }
            }
          }
          if (!appUser) {
            const fallback: AppUser = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || user.email?.split('@')[0] || 'admin',
              memberships: [{ farmId: this.farmContext.activeFarmId() || 'odivon-farm-default', role: 'admin' }],
              activeFarmId: this.farmContext.activeFarmId() || 'odivon-farm-default',
              createdAt: new Date(),
            };
            this.farmContext.setUserRole('admin');
            return of(fallback);
          }
          return of(appUser);
        }),
        catchError(() => of(null))
      );
    }),
    catchError((err) => {
      console.warn('[appUser$ stream warning]:', err?.message || err);
      return of(null);
    })
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
    try {
      await this.auditService.recordLoginLog({
        uid: cred.user.uid,
        email: cred.user.email || email,
        displayName: cred.user.displayName || undefined,
        farmId: this.farmContext.activeFarmId() || undefined,
        farmName: this.farmContext.activeFarmName() || undefined,
        status: 'success',
      });
    } catch (auditErr) {
      console.warn('[login] audit log notice:', auditErr);
    }

    return cred;
  }

  /** Şifre sıfırlama e-postası gönderir */
  resetPassword(email: string) {
    return sendPasswordResetEmail(this.auth, email);
  }

  /** Eksik kullanıcı veya çiftlik dokümanı varsa otomatik tamamlar ve admin üye kaydı oluşturur */
  async ensureFarm(user: User, customFarmName?: string) {
    try {
      const userRef = doc(this.db, `users/${user.uid}`);
      const userSnap = await getDoc(userRef);
      const defaultName = `${user.displayName || user.email?.split('@')[0] || 'Benim'} Çiftliği`;
      const farmName = customFarmName || defaultName;

      if (!userSnap.exists() || !(userSnap.data() as AppUser)?.activeFarmId) {
        const farm: Farm = { name: farmName, ownerUid: user.uid, createdAt: serverTimestamp() };
        const farmRef = await addDoc(collection(this.db, 'farms'), farm);
        const profile: AppUser = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || user.email?.split('@')[0] || 'admin',
          memberships: [{ farmId: farmRef.id, role: 'admin' }],
          activeFarmId: farmRef.id,
          createdAt: serverTimestamp(),
        };
        await setDoc(userRef, profile);

        // Çiftlik altında üye kaydı (Admin) oluştur
        try {
          const memberRef = doc(this.db, `farms/${farmRef.id}/members/${user.uid}`);
          await setDoc(memberRef, {
            uid: user.uid,
            email: user.email || '',
            displayName: profile.displayName,
            role: 'admin',
            status: 'active',
            title: 'Çiftlik Sahibi & Yönetici',
            addedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
            deletedAt: null,
          });
        } catch (mErr) {
          console.warn('[ensureFarm] member creation notice:', mErr);
        }

        this.farmContext.setActiveFarm(farmRef.id, farmName);
        this.farmContext.setUserRole('admin');
      } else {
        const data = userSnap.data() as AppUser;
        if (data.activeFarmId) {
          this.farmContext.setActiveFarm(data.activeFarmId);
          const currentRole = data.memberships?.find((m) => m.farmId === data.activeFarmId)?.role || 'admin';
          this.farmContext.setUserRole(currentRole);

          // Çiftlik üye dokümanı eksikse otomatik oluştur
          try {
            const memberRef = doc(this.db, `farms/${data.activeFarmId}/members/${user.uid}`);
            const memberSnap = await getDoc(memberRef);
            if (!memberSnap.exists()) {
              await setDoc(memberRef, {
                uid: user.uid,
                email: user.email || '',
                displayName: data.displayName || user.email?.split('@')[0] || 'Yönetici',
                role: currentRole,
                status: 'active',
                title: currentRole === 'admin' ? 'Çiftlik Sahibi & Yönetici' : 'Çiftlik Üyesi',
                addedAt: serverTimestamp(),
                createdAt: serverTimestamp(),
                deletedAt: null,
              });
            }
          } catch (mErr) {
            console.warn('[ensureFarm] check member existence notice:', mErr);
          }

          // Tanımları kontrol et, boş ise otomatik tohumla
          this.seedService.checkAndSeedIfEmpty(data.activeFarmId).catch(() => {});
        }
      }
    } catch (err: any) {
      console.warn('[ensureFarm permission/network notice]:', err?.message || err);
      // İzin yoksa varsayılan çiftlik id'sini ayarla
      if (!this.farmContext.activeFarmId()) {
        this.farmContext.setActiveFarm('odivon-farm-default');
      }
    }
  }

  /**
   * Kayıt akışı: kullanıcı oluşturur, kendisi için bir çiftlik (farm) açar,
   * o çiftlikte 'admin' rolüyle üyeliğini tanımlar,
   * farms/{farmId}/members altında ilk admin üye kaydını oluşturur,
   * varsayılan tanımları (Hayvan Tipleri, Irklar, Padoklar, Tedavi Türleri, Hastalıklar) yükler
   * ve Hostinger SMTP ile kurumsal Hoş Geldiniz e-postasını kuyruğa ekler.
   */
  async register(
    email: string,
    password: string,
    displayName: string,
    farmName: string,
    details?: RegisterDetails
  ) {
    const cred = await createUserWithEmailAndPassword(this.auth, email, password);

    const language = details?.language || 'tr';
    if (details?.language) {
      try {
        localStorage.setItem('odivon_language', details.language);
      } catch {}
    }

    const farm: Farm = {
      name: farmName,
      ownerUid: cred.user.uid,
      phone: details?.phone || '',
      countryCode: details?.countryCode || '',
      country: details?.country || '',
      language,
      createdAt: serverTimestamp(),
    };
    const farmRef = await addDoc(collection(this.db, 'farms'), farm);

    const userRef = doc(this.db, `users/${cred.user.uid}`);
    const profile: AppUser = {
      uid: cred.user.uid,
      email,
      displayName,
      phone: details?.phone || '',
      countryCode: details?.countryCode || '',
      country: details?.country || '',
      language,
      memberships: [{ farmId: farmRef.id, role: 'admin' }],
      activeFarmId: farmRef.id,
      createdAt: serverTimestamp(),
    };
    await setDoc(userRef, profile);

    // Çiftlik altında üye kaydı (Admin) oluştur — Kayıt olan kullanıcı her zaman Admin kabul edilir
    try {
      const memberRef = doc(this.db, `farms/${farmRef.id}/members/${cred.user.uid}`);
      await setDoc(memberRef, {
        uid: cred.user.uid,
        email,
        displayName,
        phone: details?.phone || '',
        role: 'admin',
        title:
          language === 'de'
            ? 'Betriebsinhaber & Betriebsleiter'
            : language === 'nl'
            ? 'Bedrijfseigenaar & Beheerder'
            : language === 'ru'
            ? 'Владелец и управляющий фермой'
            : language === 'en'
            ? 'Farm Owner & Manager'
            : 'Çiftlik Sahibi & Yönetici',
        addedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        deletedAt: null,
      });
    } catch (mErr) {
      console.warn('[Register] admin member doc creation notice:', mErr);
    }

    this.farmContext.setActiveFarm(farmRef.id, farmName);
    this.farmContext.setUserRole('admin');

    // 0. 14 Günlük Ücretsiz Deneme Abonelik Dokümanını Firestore'da anında başlat
    try {
      const periodEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      const subRef = doc(this.db, `farms/${farmRef.id}/subscription/current`);
      await setDoc(subRef, {
        farmId: farmRef.id,
        planId: 'trial',
        status: 'trialing',
        billingCycle: 'monthly',
        startDate: serverTimestamp(),
        currentPeriodEnd: Timestamp.fromDate(periodEnd),
        trialEndsAt: Timestamp.fromDate(periodEnd),
        animalLimit: 250,
        userLimit: 5,
        storageLimitMb: 1024,
        pricePaid: 0,
        paymentMethod: 'manual',
        createdAt: serverTimestamp(),
      });
    } catch (subErr) {
      console.warn('[Register] Subscription init notice:', subErr);
    }

    // 1. Yeni çiftlik için varsayılan tanımları (Hayvan Tipleri, Irklar, Padoklar, Tedavi Türleri, Hastalıklar) seçilen dilde tohumla
    try {
      await this.seedService.seedFarmDefaults(farmRef.id, language);
    } catch (seedErr) {
      console.warn('[Register] Varsayılan veriler tohumlanırken hata (kayıt süreci devam ediyor):', seedErr);
    }

    // 2. Yeni üyeye Hostinger SMTP üzerinden Hoş Geldiniz e-postasını kuyruğa ekle
    try {
      await this.emailService.sendWelcomeEmail({ email, displayName, farmName });
    } catch (mailErr) {
      console.warn('[Register] Hoş geldiniz e-postası kuyruğa eklenirken hata (kayıt süreci devam ediyor):', mailErr);
    }

    // 3. İlk kayıt/giriş oturum logunu kaydet
    try {
      await this.auditService.recordLoginLog({
        uid: cred.user.uid,
        email,
        displayName,
        farmId: farmRef.id,
        farmName,
        status: 'success',
      });
    } catch (auditErr) {
      console.warn('[Register] audit log notice:', auditErr);
    }

    return cred;
  }

  /**
   * 14 günlük deneme süresi dolmuş test kullanıcısı (demo-expired@odivonfarm.com)
   * Firebase Auth'ta varsa giriş yapar, yoksa oluşturur; Firestore'da süresi 5 gün önce dolmuş bir abonelik dokümanı hazırlar.
   */
  async ensureExpiredTestUser(password = '123456') {
    const email = 'demo-expired@odivonfarm.com';
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
        throw err;
      }
    }

    if (cred?.user) {
      const user = cred.user;
      await this.ensureFarm(user, 'Örnek Süresi Dolan Çiftlik');

      const userRef = doc(this.db, `users/${user.uid}`);
      const userSnap = await getDoc(userRef);
      const appUser = userSnap.data() as AppUser;
      const farmId = appUser?.activeFarmId || 'odivon-expired-test-farm';

      // Aboneliği expired ve 5 gün önce dolmuş olarak ayarla
      const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      const expiredSub = {
        farmId,
        planId: 'trial',
        status: 'expired',
        billingCycle: 'monthly',
        startDate: Timestamp.fromDate(new Date(Date.now() - 19 * 24 * 60 * 60 * 1000)),
        currentPeriodEnd: Timestamp.fromDate(pastDate),
        trialEndsAt: Timestamp.fromDate(pastDate),
        animalLimit: 250,
        userLimit: 5,
        storageLimitMb: 1024,
        pricePaid: 0,
        paymentMethod: 'manual',
        updatedAt: serverTimestamp(),
      };

      try {
        const subRef = doc(this.db, `farms/${farmId}/subscription/current`);
        await setDoc(subRef, expiredSub, { merge: true });
      } catch (subErr) {
        console.warn('[ensureExpiredTestUser] Subscription update error:', subErr);
      }

      // Giriş logunu kaydet
      try {
        await this.auditService.recordLoginLog({
          uid: user.uid,
          email: user.email || email,
          displayName: 'Demo Expired Test User',
          farmId,
          farmName: 'Örnek Süresi Dolan Çiftlik',
          status: 'success',
        });
      } catch (auditErr) {
        console.warn('[ensureExpiredTestUser] audit log notice:', auditErr);
      }
    }

    return cred;
  }

  logout() {
    return signOut(this.auth);
  }
}
