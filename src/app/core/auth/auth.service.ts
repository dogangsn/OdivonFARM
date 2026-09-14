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
import { Observable, switchMap, of } from 'rxjs';
import { AppUser, Farm } from '../models/farm.model';
import { FarmContextService } from '../services/farm-context.service';
import { docData } from '../services/firestore-helpers';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private farmContext = inject(FarmContextService);
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
  readonly authState$: Observable<User | null> = new Observable((subscriber) => {
    return onAuthStateChanged(
      this.auth,
      (user) => subscriber.next(user),
      (err) => subscriber.error(err)
    );
  });

  /** users/{uid} profili — rol ve çiftlik üyelikleri burada */
  readonly appUser$: Observable<AppUser | null> = this.authState$.pipe(
    switchMap((user) => {
      this.farmContext.setUser(user?.uid ?? null);
      if (!user) return of(null);
      // Ensure farm document exists
      this.ensureFarm(user).catch((err) => console.warn('ensureFarm warning:', err));
      const ref = doc(this.db, `users/${user.uid}`);
      return docData(ref).pipe(
        switchMap((profile) => {
          const appUser = profile as AppUser | undefined;
          if (appUser?.activeFarmId) {
            this.farmContext.setActiveFarm(appUser.activeFarmId);
          }
          if (!appUser) {
            const fallback: AppUser = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || user.email?.split('@')[0] || 'Yönetici',
              memberships: [{ farmId: this.farmContext.activeFarmId() || 'default', role: 'admin' }],
              activeFarmId: this.farmContext.activeFarmId() || undefined,
              createdAt: new Date(),
            };
            return of(fallback);
          }
          return of(appUser);
        })
      );
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

  /** Eksik kullanıcı veya çiftlik dokümanı varsa otomatik tamamlar */
  async ensureFarm(user: User, farmName = 'Odivon Çiftliği') {
    const userRef = doc(this.db, `users/${user.uid}`);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists() || !(userSnap.data() as AppUser)?.activeFarmId) {
      const farm: Farm = { name: farmName, ownerUid: user.uid, createdAt: serverTimestamp() };
      const farmRef = await addDoc(collection(this.db, 'farms'), farm);
      const profile: AppUser = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'Yönetici',
        memberships: [{ farmId: farmRef.id, role: 'admin' }],
        activeFarmId: farmRef.id,
        createdAt: serverTimestamp(),
      };
      await setDoc(userRef, profile);
      this.farmContext.setActiveFarm(farmRef.id);
    } else {
      const data = userSnap.data() as AppUser;
      if (data.activeFarmId) {
        this.farmContext.setActiveFarm(data.activeFarmId);
      }
    }
  }

  /**
   * Kayıt akışı: kullanıcı oluşturur, kendisi için bir çiftlik (farm) açar ve
   * o çiftlikte 'admin' rolüyle üyeliğini tanımlar.
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
    this.farmContext.setActiveFarm(farmRef.id);
    return cred;
  }

  logout() {
    return signOut(this.auth);
  }
}
