import { Injectable, signal, computed } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
  Unsubscribe,
  serverTimestamp,
} from 'firebase/firestore';
import { Farm, AppRole, ROLE_CATALOG } from '../models/farm.model';

/**
 * Kullanıcı birden fazla çiftliğe (farm) üye olabilir (ör. danışman veteriner).
 * O anda üzerinde çalışılan çiftliği ve oturum açan kullanıcıyı tutar;
 * tüm FirestoreCrudService alt sınıfları buradan farmId okur.
 */
@Injectable({ providedIn: 'root' })
export class FarmContextService {
  private get db() {
    return getFirestore();
  }

  private farmUnsub: Unsubscribe | null = null;

  private getStoredFarmId(): string | null {
    try {
      return localStorage.getItem('odivon_active_farm_id');
    } catch {
      return null;
    }
  }

  private getStoredFarmName(): string | null {
    try {
      return localStorage.getItem('odivon_active_farm_name');
    } catch {
      return null;
    }
  }

  readonly activeFarmId = signal<string | null>(this.getStoredFarmId());
  readonly activeFarmId$ = toObservable(this.activeFarmId);
  readonly uid = signal<string | null>(null);

  /** Aktif kullanıcının bu çiftlikteki rolü (varsayılan: admin) */
  readonly userRole = signal<AppRole>('admin');
  readonly isAdmin = computed(() => this.userRole() === 'admin');
  readonly userRoleInfo = computed(() => ROLE_CATALOG[this.userRole()] || ROLE_CATALOG.admin);

  readonly cachedFarmName = signal<string | null>(this.getStoredFarmName());
  readonly activeFarm = signal<Farm | null>(null);

  /** Aktif çiftliğin adı (dinamik, veritabanından veya önbellekten) */
  readonly activeFarmName = computed(() => {
    return this.activeFarm()?.name || this.cachedFarmName() || 'Çiftliğim';
  });

  /** Kullanıcının yetkili olduğu tüm çiftlikler */
  readonly userFarms = signal<Farm[]>([]);

  setUserRole(role: AppRole) {
    this.userRole.set(role);
  }

  constructor() {
    const initialId = this.getStoredFarmId();
    if (initialId) {
      this.subscribeToFarm(initialId);
    }
  }

  requireActiveFarmId(): string {
    const id = this.activeFarmId();
    if (!id) {
      throw new Error('Aktif çiftlik seçilmedi. Önce bir çiftlik seçin.');
    }
    return id;
  }

  currentUid(): string | null {
    return this.uid();
  }

  setActiveFarm(farmId: string, initialName?: string) {
    try {
      localStorage.setItem('odivon_active_farm_id', farmId);
      if (initialName) {
        localStorage.setItem('odivon_active_farm_name', initialName);
        this.cachedFarmName.set(initialName);
      }
    } catch {}

    this.activeFarmId.set(farmId);
    this.subscribeToFarm(farmId);
  }

  setUser(uid: string | null) {
    this.uid.set(uid);
  }

  /**
   * Belirtilen çiftlik kimliğine abone olur ve anlık güncellemeleri dinler.
   */
  subscribeToFarm(farmId: string) {
    if (this.farmUnsub) {
      this.farmUnsub();
      this.farmUnsub = null;
    }

    if (!farmId || farmId === 'odivon-farm-default') {
      return;
    }

    try {
      const farmRef = doc(this.db, `farms/${farmId}`);
      this.farmUnsub = onSnapshot(
        farmRef,
        (snap) => {
          if (snap.exists()) {
            const data = { id: snap.id, ...snap.data() } as Farm;
            this.activeFarm.set(data);
            if (data.name) {
              this.cachedFarmName.set(data.name);
              try {
                localStorage.setItem('odivon_active_farm_name', data.name);
              } catch {}
            }
          }
        },
        (err) => {
          console.warn('[FarmContext] farm snapshot warning:', err?.message || err);
        }
      );
    } catch (err) {
      console.warn('[FarmContext] subscribeToFarm error:', err);
    }
  }

  /**
   * Çiftliğin adını Firestore'da günceller ve sinyalleri yeniler.
   */
  async updateFarmName(newName: string): Promise<boolean> {
    const farmId = this.activeFarmId();
    const cleanName = newName.trim();
    if (!farmId || !cleanName) return false;

    try {
      const farmRef = doc(this.db, `farms/${farmId}`);
      await updateDoc(farmRef, {
        name: cleanName,
        updatedAt: serverTimestamp(),
      });
      this.cachedFarmName.set(cleanName);
      try {
        localStorage.setItem('odivon_active_farm_name', cleanName);
      } catch {}

      if (this.activeFarm()) {
        this.activeFarm.update((f) => (f ? { ...f, name: cleanName } : null));
      }
      return true;
    } catch (err) {
      console.error('[FarmContext] updateFarmName failed:', err);
      return false;
    }
  }

  /**
   * Kullanıcının birden fazla çiftliği varsa hepsini yükler.
   */
  async loadUserFarms(farmIds: string[]) {
    if (!farmIds || farmIds.length === 0) return;
    const farms: Farm[] = [];
    for (const id of farmIds) {
      if (id === 'odivon-farm-default') continue;
      try {
        const snap = await getDoc(doc(this.db, `farms/${id}`));
        if (snap.exists()) {
          farms.push({ id: snap.id, ...snap.data() } as Farm);
        }
      } catch {}
    }
    this.userFarms.set(farms);
  }
}
