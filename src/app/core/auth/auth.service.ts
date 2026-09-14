import { inject, Injectable } from '@angular/core';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
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
} from 'firebase/firestore';
import { Observable, switchMap, of, catchError } from 'rxjs';
import { AppUser, Farm } from '../models/farm.model';
import { FarmContextService } from '../services/farm-context.service';
import { SeedService } from '../services/seed.service';
import { EmailService } from '../services/email.service';
import { docData } from '../services/firestore-helpers';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private farmContext = inject(FarmContextService);
  private seedService = inject(SeedService);
  private emailService = inject(EmailService);
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
    const cred = await signInWithEmailAndPassword(this.auth, email, password);
    try {
      await this.ensureFarm(cred.user);
    } catch (e) {
      console.warn('ensureFarm skipped or failed:', e);
    }
    return cred;
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
  async register(email: string, password: string, displayName: string, farmName: string) {
    const cred = await createUserWithEmailAndPassword(this.auth, email, password);

    const farm: Farm = { name: farmName, ownerUid: cred.user.uid, createdAt: serverTimestamp() };
    const farmRef = await addDoc(collection(this.db, 'farms'), farm);

    const userRef = doc(this.db, `users/${cred.user.uid}`);
    const profile: AppUser = {
      uid: cred.user.uid,
      email,
      displayName,
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
        role: 'admin',
        status: 'active',
        title: 'Çiftlik Sahibi & Yönetici',
        addedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        deletedAt: null,
      });
    } catch (mErr) {
      console.warn('[Register] admin member doc creation notice:', mErr);
    }

    this.farmContext.setActiveFarm(farmRef.id, farmName);
    this.farmContext.setUserRole('admin');

    // 1. Yeni çiftlik için varsayılan tanımları (Hayvan Tipleri, Irklar, Padoklar, Tedavi Türleri, Hastalıklar) tohumla
    try {
      await this.seedService.seedFarmDefaults(farmRef.id);
    } catch (seedErr) {
      console.warn('[Register] Varsayılan veriler tohumlanırken hata (kayıt süreci devam ediyor):', seedErr);
    }

    // 2. Yeni üyeye Hostinger SMTP üzerinden Hoş Geldiniz e-postasını kuyruğa ekle
    try {
      await this.emailService.sendWelcomeEmail({ email, displayName, farmName });
    } catch (mailErr) {
      console.warn('[Register] Hoş geldiniz e-postası kuyruğa eklenirken hata (kayıt süreci devam ediyor):', mailErr);
    }

    return cred;
  }

  logout() {
    return signOut(this.auth);
  }
}
