import { Injectable, inject, signal, computed } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Farm, AppRole, ROLE_CATALOG } from '../models/farm.model';
import { ApiService } from '../http/api.service';

/**
 * Odivon Main API'de her kullanıcı tek bir çiftliğe (tenant) bağlıdır; çiftlik kimliği
 * sunucuda oturumdaki kullanıcıdan çözülür. Bu servis o çiftliği, kullanıcının rolünü ve
 * oturum durumunu tutar; tüm FarmCrudService alt sınıfları buradan beslenir.
 */
@Injectable({ providedIn: 'root' })
export class FarmContextService {
  private api = inject(ApiService);

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

  /** Veri akışlarının yeniden çekilmesi için oturum anahtarı (kullanıcı + çiftlik). */
  readonly session$ = toObservable(computed(() => ({ farmId: this.activeFarmId(), uid: this.uid() })));

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

  /** Kullanıcının yetkili olduğu tüm çiftlikler (Main API'de her kullanıcının tek çiftliği vardır) */
  readonly userFarms = signal<Farm[]>([]);

  setUserRole(role: AppRole) {
    this.userRole.set(role);
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
  }

  /** `/farm/me` yanıtındaki çiftlik bilgisini uygular. */
  applyFarm(farm: Farm & { id: string }) {
    this.activeFarm.set(farm);
    this.userFarms.set([farm]);
    this.setActiveFarm(farm.id, farm.name);
  }

  setUser(uid: string | null) {
    this.uid.set(uid);
  }

  /**
   * Çiftliğin adını Main API'de günceller ve sinyalleri yeniler (yalnızca yönetici).
   */
  async updateFarmName(newName: string): Promise<boolean> {
    const cleanName = newName.trim();
    if (!this.activeFarmId() || !cleanName) return false;

    try {
      const farm = await this.api.patch<Farm & { id: string }>('/farm/settings', { name: cleanName });
      this.applyFarm(farm);
      return true;
    } catch (err) {
      console.error('[FarmContext] updateFarmName failed:', err);
      return false;
    }
  }
}
