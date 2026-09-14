import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { toSignal } from '@angular/core/rxjs-interop';
import { AnimalService } from '../../core/services/animal.service';
import { AccountingTransactionService } from '../../core/services/accounting-transaction.service';
import { AccountingItemService } from '../../core/services/definitions/accounting-item.service';
import { YieldRecordService } from '../../core/services/yield-record.service';
import { MatingService } from '../../core/services/mating.service';
import { TreatmentService } from '../../core/services/treatment.service';
import { BreedService } from '../../core/services/definitions/breed.service';
import { HerdService } from '../../core/services/definitions/herd.service';
import { Animal, Breed, Herd } from '../../core/models/animal.model';
import { AccountingTransaction, AccountingItem } from '../../core/models/inventory.model';
import { YieldRecord, Mating } from '../../core/models/production.model';
import { Treatment } from '../../core/models/health.model';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
})
export class ReportsComponent {
  private animalService = inject(AnimalService);
  private accountingService = inject(AccountingTransactionService);
  private accountingItemService = inject(AccountingItemService);
  private yieldService = inject(YieldRecordService);
  private matingService = inject(MatingService);
  private treatmentService = inject(TreatmentService);
  private breedService = inject(BreedService);
  private herdService = inject(HerdService);

  readonly animals = toSignal(this.animalService.list(), { initialValue: [] as Animal[] });
  readonly transactions = toSignal(this.accountingService.list(), { initialValue: [] as AccountingTransaction[] });
  readonly accountingItems = toSignal(this.accountingItemService.list(), { initialValue: [] as AccountingItem[] });
  readonly yields = toSignal(this.yieldService.list(), { initialValue: [] as YieldRecord[] });
  readonly matings = toSignal(this.matingService.list(), { initialValue: [] as Mating[] });
  readonly treatments = toSignal(this.treatmentService.list(), { initialValue: [] as Treatment[] });
  readonly breeds = toSignal(this.breedService.list(), { initialValue: [] as Breed[] });
  readonly herds = toSignal(this.herdService.list(), { initialValue: [] as Herd[] });

  // Active Report Tab: 'overview' | 'demographics' | 'breeding' | 'financial'
  readonly activeTab = signal<'overview' | 'demographics' | 'breeding' | 'financial'>('overview');

  // Lookup Maps
  readonly breedMap = computed(() => {
    const map = new Map<string, string>();
    for (const b of this.breeds() || []) {
      if (b?.id) map.set(b.id, b.name);
    }
    return map;
  });

  readonly herdMap = computed(() => {
    const map = new Map<string, string>();
    for (const h of this.herds() || []) {
      if (h?.id) map.set(h.id, h.name);
    }
    return map;
  });

  readonly itemMap = computed(() => {
    const map = new Map<string, AccountingItem>();
    for (const i of this.accountingItems() || []) {
      if (i?.id) map.set(i.id, i);
    }
    return map;
  });

  // Demographics Analysis
  readonly demographics = computed(() => {
    const list = (this.animals() || []).filter((a) => a.status === 'aktif' || !a.status);
    const total = list.length;
    let femaleCount = 0;
    let maleCount = 0;

    let lambCount = 0; // < 6 ay
    let yearlingCount = 0; // 6-12 ay
    let adultCount = 0; // > 12 ay
    let unknownAgeCount = 0;

    const breedCounts = new Map<string, number>();
    const herdCounts = new Map<string, number>();

    const now = Date.now();

    for (const a of list) {
      if (a.gender === 'disi') femaleCount++;
      else maleCount++;

      // Age calculation
      const birth = this.getTime(a.birthDate);
      if (birth > 0) {
        const ageMonths = (now - birth) / (1000 * 60 * 60 * 24 * 30.4);
        if (ageMonths < 6) lambCount++;
        else if (ageMonths <= 12) yearlingCount++;
        else adultCount++;
      } else {
        unknownAgeCount++;
      }

      // Breed
      const bName = a.breedId ? this.breedMap().get(a.breedId) || 'Tanımsız Irk' : 'Tanımsız Irk';
      breedCounts.set(bName, (breedCounts.get(bName) || 0) + 1);

      // Herd
      const hName = a.herdId ? this.herdMap().get(a.herdId) || 'Sürü Dışı' : 'Sürü Dışı';
      herdCounts.set(hName, (herdCounts.get(hName) || 0) + 1);
    }

    const breedList = Array.from(breedCounts.entries())
      .map(([name, count]) => ({ name, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 }))
      .sort((a, b) => b.count - a.count);

    const herdList = Array.from(herdCounts.entries())
      .map(([name, count]) => ({ name, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 }))
      .sort((a, b) => b.count - a.count);

    return {
      total,
      femaleCount,
      maleCount,
      femalePct: total > 0 ? Math.round((femaleCount / total) * 100) : 0,
      malePct: total > 0 ? Math.round((maleCount / total) * 100) : 0,
      lambCount,
      yearlingCount,
      adultCount,
      unknownAgeCount,
      breedList,
      herdList,
    };
  });

  // Financial Analysis
  readonly financials = computed(() => {
    const list = this.transactions() || [];
    let totalIncome = 0;
    let totalExpense = 0;

    const expenseByItem = new Map<string, number>();

    for (const t of list) {
      const item = this.itemMap().get(t.accountingItemId);
      const isIncome = item ? item.type === 'gelir' : false;
      const amt = Number(t.amount) || 0;

      if (isIncome) {
        totalIncome += amt;
      } else {
        totalExpense += amt;
        const iName = item?.name || 'Genel Gider';
        expenseByItem.set(iName, (expenseByItem.get(iName) || 0) + amt);
      }
    }

    const topExpenses = Array.from(expenseByItem.entries())
      .map(([name, amount]) => ({
        name,
        amount,
        pct: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      topExpenses,
    };
  });

  // Breeding Analysis
  readonly breedingStats = computed(() => {
    const list = this.matings() || [];
    const total = list.length;
    const pregnant = list.filter((m) => m.status === 'gebe').length;
    const birthed = list.filter((m) => m.status === 'dogurdu').length;
    const observation = list.filter((m) => m.status === 'gozlem' || m.status === 'koculdu').length;
    const barren = list.filter((m) => m.status === 'bos-cikti').length;

    const pregnancyRate = total > 0 ? Math.round(((pregnant + birthed) / total) * 100) : 0;

    return {
      total,
      pregnant,
      birthed,
      observation,
      barren,
      pregnancyRate,
    };
  });

  // Production Yields Summary
  readonly productionSummary = computed(() => {
    const list = this.yields() || [];
    let totalMilk = 0;
    let totalWool = 0;

    for (const y of list) {
      const amt = Number(y.amount) || 0;
      if (y.type === 'sut') totalMilk += amt;
      else if (y.type === 'yapagi') totalWool += amt;
    }

    return {
      totalMilk,
      totalWool,
      recordCount: list.length,
    };
  });

  // Health / Treatment Summary
  readonly healthSummary = computed(() => {
    const list = this.treatments() || [];
    let totalCost = 0;

    for (const t of list) {
      totalCost += Number(t.cost) || 0;
    }

    return {
      totalTreatments: list.length,
      totalCost,
    };
  });

  printReport() {
    window.print();
  }

  private getTime(val: any): number {
    if (!val) return 0;
    if (val.seconds) return val.seconds * 1000;
    if (val.toDate && typeof val.toDate === 'function') return val.toDate().getTime();
    if (val instanceof Date) return val.getTime();
    return new Date(val).getTime() || 0;
  }
}
