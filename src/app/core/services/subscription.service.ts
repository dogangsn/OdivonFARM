import { Injectable, inject, signal, computed } from '@angular/core';
import { FarmContextService } from './farm-context.service';
import { ApiService } from '../http/api.service';
import {
  FarmSubscription,
  PlanId,
  BillingCycle,
  PLAN_CATALOG,
  PlanDefinition,
} from '../models/subscription.model';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private farmContext = inject(FarmContextService);
  private api = inject(ApiService);
  private loadSeq = 0;

  // Signals
  readonly subscription = signal<FarmSubscription | null>(null);
  readonly loading = signal<boolean>(true);

  // Active Plan Definition from Catalog
  readonly activePlan = computed<PlanDefinition>(() => {
    const sub = this.subscription();
    const planId = sub?.planId || 'trial';
    return PLAN_CATALOG[planId] || PLAN_CATALOG.trial;
  });

  readonly isTrial = computed<boolean>(() => {
    return this.subscription()?.status === 'trialing' || this.subscription()?.planId === 'trial';
  });

  readonly remainingDays = computed<number>(() => {
    const sub = this.subscription();
    if (!sub) return 14;

    const endDate = sub.trialEndsAt || sub.currentPeriodEnd;
    if (!endDate) return 14;

    const endMs = typeof endDate?.toMillis === 'function' ? endDate.toMillis() : new Date(endDate).getTime();
    const nowMs = Date.now();
    const diffDays = Math.ceil((endMs - nowMs) / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  });

  readonly isExpired = computed<boolean>(() => {
    const sub = this.subscription();
    if (!sub) return false;
    if (sub.status === 'expired') return true;
    return this.remainingDays() <= 0 && this.isTrial();
  });

  readonly animalLimit = computed<number>(() => {
    return this.subscription()?.animalLimit || this.activePlan().animalLimit || 250;
  });

  readonly userLimit = computed<number>(() => {
    return this.subscription()?.userLimit || this.activePlan().userLimit || 5;
  });

  constructor() {
    // Oturum (kullanıcı + çiftlik) değiştikçe aboneliği Main API'den yeniden yükle
    this.farmContext.session$.subscribe(({ farmId, uid }) => {
      if (farmId && uid) {
        this.load();
      } else {
        this.subscription.set(null);
        this.loading.set(Boolean(farmId));
      }
    });
  }

  /**
   * Çiftliğin abonelik bilgisini yükler. Yeni çiftlikler sunucuda 14 günlük
   * ücretsiz deneme ile açılır; sunucuya ulaşılamazsa geçici deneme görünümü kullanılır.
   */
  async load(): Promise<void> {
    const seq = ++this.loadSeq;
    this.loading.set(true);
    try {
      const sub = await this.api.get<FarmSubscription | null>('/farm/subscription');
      if (seq !== this.loadSeq) return;
      if (sub) {
        this.subscription.set(sub);
      } else {
        this.setFallbackSubscription(this.farmContext.activeFarmId() || 'odivon-farm-default');
      }
    } catch (err) {
      if (seq !== this.loadSeq) return;
      console.warn('[SubscriptionService] abonelik okunamadı:', (err as Error)?.message || err);
      this.setFallbackSubscription(this.farmContext.activeFarmId() || 'odivon-farm-default');
    } finally {
      if (seq === this.loadSeq) this.loading.set(false);
    }
  }

  private setFallbackSubscription(farmId: string) {
    this.subscription.set({
      farmId,
      planId: 'trial',
      status: 'trialing',
      billingCycle: 'monthly',
      startDate: new Date(),
      currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      animalLimit: 250,
      userLimit: 5,
      storageLimitMb: 1024,
    });
  }

  /**
   * Paketi yükseltir veya değiştirir (yalnızca yönetici). Limitler ve ücret sunucudaki
   * paket kataloğundan belirlenir.
   */
  async changePlan(
    planId: PlanId,
    billingCycle: BillingCycle = 'monthly',
    paymentMethod: 'credit_card' | 'bank_transfer' = 'credit_card'
  ): Promise<void> {
    if (!PLAN_CATALOG[planId]) throw new Error('Geçersiz paket seçildi.');
    const sub = await this.api.put<FarmSubscription>('/farm/subscription/plan', {
      planId,
      billingCycle,
      paymentMethod,
    });
    this.subscription.set(sub);
  }

  /**
   * Kota kontrolü: Hayvan ekleme limitini aştı mı?
   */
  canAddAnimal(currentAnimalCount: number): boolean {
    const limit = this.animalLimit();
    return currentAnimalCount < limit;
  }

  /**
   * Kota kontrolü: Kullanıcı ekleme limitini aştı mı?
   */
  canAddMember(currentMemberCount: number): boolean {
    const limit = this.userLimit();
    return currentMemberCount < limit;
  }
}
