import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import { SubscriptionService } from '../../core/services/subscription.service';
import { AnimalService } from '../../core/services/animal.service';
import { FarmMemberService } from '../../core/services/farm-member.service';
import { FarmContextService } from '../../core/services/farm-context.service';
import { AlertService } from '../../core/services/alert.service';
import {
  PlanId,
  BillingCycle,
  PLAN_CATALOG,
  PlanDefinition,
} from '../../core/models/subscription.model';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './subscription.component.html',
  styleUrl: './subscription.component.scss',
})
export class SubscriptionComponent implements OnInit, OnDestroy {
  protected subService = inject(SubscriptionService);
  protected farmContext = inject(FarmContextService);
  private animalService = inject(AnimalService);
  private memberService = inject(FarmMemberService);
  private alertService = inject(AlertService);

  private subs: Subscription[] = [];

  // Billing Cycle Toggle (Monthly vs Yearly)
  billingCycle = signal<BillingCycle>('yearly');

  // Live Usage Counts
  animalCount = signal<number>(0);
  memberCount = signal<number>(0);

  // Upgrade Modal State
  isUpgradeModalOpen = signal<boolean>(false);
  selectedPlanForUpgrade = signal<PlanDefinition | null>(null);
  selectedPaymentMethod = signal<'credit_card' | 'bank_transfer'>('credit_card');
  isProcessing = signal<boolean>(false);

  // Fake Credit Card Form Model
  cardForm = {
    cardHolder: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  };

  // Plan Catalog (excluding trial for direct purchase)
  readonly plans: PlanDefinition[] = [
    PLAN_CATALOG.starter,
    PLAN_CATALOG.pro,
    PLAN_CATALOG.enterprise,
  ];

  // Quota Computeds
  animalUsagePercent = computed(() => {
    const limit = this.subService.animalLimit();
    if (!limit || limit >= 999999) return 0;
    return Math.min(100, Math.round((this.animalCount() / limit) * 100));
  });

  memberUsagePercent = computed(() => {
    const limit = this.subService.userLimit();
    if (!limit || limit >= 9999) return 0;
    return Math.min(100, Math.round((this.memberCount() / limit) * 100));
  });

  // FAQs Accordion
  faqs = [
    {
      q: '14 günlük deneme sürem bittiğinde ne olur?',
      a: 'Deneme süreniz sona erdiğinde çiftlik verileriniz, hayvan kayıtlarınız ve tedavileriniz asla silinmez. Ancak yeni veri ekleyebilmek için uygun bir abonelik paketine geçiş yapmanız gerekir.',
      open: true,
    },
    {
      q: 'Paketimi dilediğim zaman yükseltebilir veya düşürebilir miyim?',
      a: 'Evet, çiftliğiniz büyüdükçe istediğiniz an tek tıkla üst pakete geçiş yapabilirsiniz. Yıllık aboneliklerde kalan günleriniz hesaplanarak mahsup edilir.',
      open: false,
    },
    {
      q: 'Yıllık ödemede ne kadar tasarruf ederim?',
      a: 'Yıllık ödeme seçeneğinde 2 ay kullanım hediye edilmekte olup, aylık plana göre yaklaşık %17 - %20 net tasarruf sağlarsınız.',
      open: false,
    },
    {
      q: 'Faturam kurumsal şirketim adına kesilebilir mi?',
      a: 'Evet, fatura bilgileriniz çiftlik unvanınız ve vergi numaranız üzerinden e-Fatura veya e-Arşiv fatura olarak sistem tarafından otomatik kesilip e-posta adresinize iletilir.',
      open: false,
    },
  ];

  ngOnInit() {
    // 1. Hayvan sayısını dinle
    this.subs.push(
      this.animalService.list().subscribe({
        next: (animals) => this.animalCount.set(animals.length),
        error: () => {},
      })
    );

    // 2. Kullanıcı/Üye sayısını dinle
    this.subs.push(
      this.memberService.list().subscribe({
        next: (members) => this.memberCount.set(members.length),
        error: () => {},
      })
    );
  }

  ngOnDestroy() {
    this.subs.forEach((s) => s.unsubscribe());
  }

  toggleFaq(index: number) {
    this.faqs[index].open = !this.faqs[index].open;
  }

  isCurrentPlan(planId: PlanId): boolean {
    const currentId = this.subService.subscription()?.planId;
    return currentId === planId;
  }

  getPrice(plan: PlanDefinition): number {
    return this.billingCycle() === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
  }

  getEquivalentMonthlyPrice(plan: PlanDefinition): number {
    if (this.billingCycle() === 'yearly') {
      return Math.round(plan.yearlyPrice / 12);
    }
    return plan.monthlyPrice;
  }

  openUpgradeModal(plan: PlanDefinition) {
    this.selectedPlanForUpgrade.set(plan);
    this.cardForm = {
      cardHolder: this.farmContext.activeFarm()?.name || '',
      cardNumber: '**** **** **** 4242',
      expiry: '12/28',
      cvv: '***',
    };
    this.isUpgradeModalOpen.set(true);
  }

  closeUpgradeModal() {
    this.isUpgradeModalOpen.set(false);
    this.selectedPlanForUpgrade.set(null);
  }

  async confirmUpgrade() {
    const plan = this.selectedPlanForUpgrade();
    if (!plan) return;

    this.isProcessing.set(true);

    try {
      // Ödeme simülasyonu & Firestore plan güncelleme
      await this.subService.changePlan(
        plan.id,
        this.billingCycle(),
        this.selectedPaymentMethod()
      );

      this.alertService.toastSuccess(
        `Tebrikler! Çiftlik aboneliğiniz "${plan.name}" paketine başarıyla yükseltildi.`
      );
      this.closeUpgradeModal();
    } catch (err: any) {
      this.alertService.error(
        'Abonelik Güncellenemedi',
        err?.message || 'Abonelik işlemi sırasında bir hata oluştu.'
      );
    } finally {
      this.isProcessing.set(false);
    }
  }
}
