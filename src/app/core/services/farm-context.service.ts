import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';

/**
 * Kullanıcı birden fazla çiftliğe (farm) üye olabilir (ör. danışman veteriner).
 * O anda üzerinde çalışılan çiftliği ve oturum açan kullanıcıyı tutar;
 * tüm FirestoreCrudService alt sınıfları buradan farmId okur.
 */
@Injectable({ providedIn: 'root' })
export class FarmContextService {
  private getStoredFarmId(): string | null {
    try {
      return localStorage.getItem('odivon_active_farm_id');
    } catch {
      return null;
    }
  }

  readonly activeFarmId = signal<string | null>(this.getStoredFarmId());
  readonly activeFarmId$ = toObservable(this.activeFarmId);
  readonly uid = signal<string | null>(null);

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

  setActiveFarm(farmId: string) {
    try {
      localStorage.setItem('odivon_active_farm_id', farmId);
    } catch {}
    this.activeFarmId.set(farmId);
  }

  setUser(uid: string | null) {
    this.uid.set(uid);
  }
}
