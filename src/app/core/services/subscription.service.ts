import { Injectable, inject, signal, computed } from '@angular/core';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { FarmContextService } from './farm-context.service';
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
  private get db() {
    return getFirestore();
  }

  private unsub: Unsubscribe | null = null;

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

    const endMs = endDate instanceof Timestamp ? endDate.toMillis() : new Date(endDate).getTime();
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
    // FarmContext activeFarmId değiştikçe abonelik dinleyicisini yeniden kur
    this.farmContext.activeFarmId$.subscribe((farmId) => {
      if (farmId) {
        this.subscribeToSubscription(farmId);
      } else {
        this.subscription.set(null);
        this.loading.set(false);
      }
    });
  }

  /**
   * Çiftliğin abonelik dokümanını dinler, yoksa 14 günlük deneme başlatır.
   */
  private subscribeToSubscription(farmId: string) {
    if (this.unsub) {
      this.unsub();
      this.unsub = null;
    }

    if (!farmId || farmId === 'odivon-farm-default') {
      this.setFallbackSubscription('odivon-farm-default');
      return;
    }

    try {
      const subRef = doc(this.db, `farms/${farmId}/subscription/current`);
      this.unsub = onSnapshot(
        subRef,
        async (snap) => {
          if (snap.exists()) {
            this.subscription.set(snap.data() as FarmSubscription);
            this.loading.set(false);
          } else {
            // İlk kez açılan çiftlik için 14 Günlük Ücretsiz Deneme oluştur
            await this.initializeTrialSubscription(farmId);
          }
        },
        (err) => {
          console.warn('[SubscriptionService] snapshot error/offline notice:', err?.message || err);
          this.setFallbackSubscription(farmId);
          this.loading.set(false);
        }
      );
    } catch (err) {
      console.warn('[SubscriptionService] init error:', err);
      this.setFallbackSubscription(farmId);
      this.loading.set(false);
    }
  }

  /**
   * Yeni çiftlik için 14 günlük tam yetkili deneme dokümanı başlatır.
   */
  async initializeTrialSubscription(farmId: string): Promise<void> {
    const trialPlan = PLAN_CATALOG.trial;
    const now = new Date();
    const periodEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const trialSub: FarmSubscription = {
      farmId,
      planId: 'trial',
      status: 'trialing',
      billingCycle: 'monthly',
      startDate: serverTimestamp(),
      currentPeriodEnd: Timestamp.fromDate(periodEnd),
      trialEndsAt: Timestamp.fromDate(periodEnd),
      animalLimit: trialPlan.animalLimit,
      userLimit: trialPlan.userLimit,
      storageLimitMb: trialPlan.storageLimitMb,
      pricePaid: 0,
      paymentMethod: 'manual',
    };

    try {
      const subRef = doc(this.db, `farms/${farmId}/subscription/current`);
      await setDoc(subRef, trialSub);
    } catch (e) {
      console.warn('[SubscriptionService] trial init notice:', e);
      this.subscription.set(trialSub);
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
   * Paketi yükseltir veya değiştirir.
   */
  async changePlan(
    planId: PlanId,
    billingCycle: BillingCycle = 'monthly',
    paymentMethod: 'credit_card' | 'bank_transfer' = 'credit_card'
  ): Promise<void> {
    const farmId = this.farmContext.requireActiveFarmId();
    const targetPlan = PLAN_CATALOG[planId];
    if (!targetPlan) throw new Error('Geçersiz paket seçildi.');

    const now = new Date();
    const daysToAdd = billingCycle === 'yearly' ? 365 : 30;
    const nextPeriodEnd = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);
    const price = billingCycle === 'yearly' ? targetPlan.yearlyPrice : targetPlan.monthlyPrice;

    const updatedSub: Partial<FarmSubscription> = {
      planId,
      status: 'active',
      billingCycle,
      currentPeriodEnd: Timestamp.fromDate(nextPeriodEnd),
      animalLimit: targetPlan.animalLimit,
      userLimit: targetPlan.userLimit,
      storageLimitMb: targetPlan.storageLimitMb,
      pricePaid: price,
      paymentMethod,
      updatedAt: serverTimestamp(),
    };

    const subRef = doc(this.db, `farms/${farmId}/subscription/current`);
    await setDoc(subRef, updatedSub, { merge: true });
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
