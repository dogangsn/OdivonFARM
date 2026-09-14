import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { toSignal } from '@angular/core/rxjs-interop';
import { YieldRecordService } from '../../core/services/yield-record.service';
import { AnimalService } from '../../core/services/animal.service';
import { HerdService } from '../../core/services/definitions/herd.service';
import { YieldRecord, YieldType } from '../../core/models/production.model';
import { Animal, Herd } from '../../core/models/animal.model';
import { AlertService } from '../../core/services/alert.service';

@Component({
  selector: 'app-yields',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './yields.component.html',
  styleUrls: ['./yields.component.scss'],
})
export class YieldsComponent {
  private yieldService = inject(YieldRecordService);
  private animalService = inject(AnimalService);
  private herdService = inject(HerdService);
  private alertService = inject(AlertService);

  readonly yields = toSignal(this.yieldService.list(), { initialValue: [] as YieldRecord[] });
  readonly animals = toSignal(this.animalService.list(), { initialValue: [] as Animal[] });
  readonly herds = toSignal(this.herdService.list(), { initialValue: [] as Herd[] });

  // Filters
  readonly searchTerm = signal('');
  readonly typeFilter = signal<'all' | YieldType>('all');
  readonly targetFilter = signal<'all' | 'animal' | 'herd'>('all');

  // Drawer
  readonly showDrawer = signal(false);
  readonly isEditing = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // Form Model
  readonly form = signal<{
    type: YieldType;
    targetKind: 'animal' | 'herd';
    animalId?: string;
    herdId?: string;
    amount: number | null;
    unit: 'lt' | 'kg';
    date: string;
  }>({
    type: 'sut',
    targetKind: 'animal',
    animalId: '',
    herdId: '',
    amount: null,
    unit: 'lt',
    date: new Date().toISOString().substring(0, 10),
  });

  // Lookup maps
  readonly animalMap = computed(() => {
    const map = new Map<string, Animal>();
    for (const a of this.animals() || []) {
      if (a?.id) map.set(a.id, a);
    }
    return map;
  });

  readonly herdMap = computed(() => {
    const map = new Map<string, Herd>();
    for (const h of this.herds() || []) {
      if (h?.id) map.set(h.id, h);
    }
    return map;
  });

  // Filtered List
  readonly filteredYields = computed(() => {
    let list = this.yields() || [];
    const query = (this.searchTerm() || '').trim().toLowerCase();
    const typeF = this.typeFilter();
    const targetF = this.targetFilter();

    if (typeF !== 'all') {
      list = list.filter((y) => y.type === typeF);
    }

    if (targetF === 'animal') {
      list = list.filter((y) => !!y.animalId);
    } else if (targetF === 'herd') {
      list = list.filter((y) => !!y.herdId);
    }

    if (query) {
      list = list.filter((y) => {
        const animal = y.animalId ? this.animalMap().get(y.animalId) : null;
        const herd = y.herdId ? this.herdMap().get(y.herdId) : null;
        const tag = animal?.farmTagNo?.toLowerCase() || '';
        const aName = animal?.name?.toLowerCase() || '';
        const hName = herd?.name?.toLowerCase() || '';

        return tag.includes(query) || aName.includes(query) || hName.includes(query);
      });
    }

    return [...(list || [])].sort((a, b) => {
      const timeA = this.getTime(a.date);
      const timeB = this.getTime(b.date);
      return timeB - timeA;
    });
  });

  // Stats
  readonly stats = computed(() => {
    const list = this.yields() || [];
    let totalMilk = 0;
    let totalWool = 0;
    let milkCount = 0;

    for (const y of list) {
      const amt = Number(y.amount) || 0;
      if (y.type === 'sut') {
        totalMilk += amt;
        milkCount++;
      } else if (y.type === 'yapagi') {
        totalWool += amt;
      }
    }

    const avgMilkPerRecord = milkCount > 0 ? (totalMilk / milkCount).toFixed(1) : '0';

    return {
      totalRecords: list.length,
      totalMilk,
      totalWool,
      avgMilkPerRecord,
    };
  });

  openAddDrawer(defaultType: YieldType = 'sut') {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.errorMessage.set(null);

    const firstAnimal = (this.animals() || [])[0]?.id || '';
    const firstHerd = (this.herds() || [])[0]?.id || '';

    this.form.set({
      type: defaultType,
      targetKind: 'animal',
      animalId: firstAnimal,
      herdId: firstHerd,
      amount: null,
      unit: defaultType === 'sut' ? 'lt' : 'kg',
      date: new Date().toISOString().substring(0, 10),
    });

    this.showDrawer.set(true);
  }

  openEditDrawer(y: YieldRecord) {
    if (!y?.id) return;
    this.isEditing.set(true);
    this.editingId.set(y.id);
    this.errorMessage.set(null);

    this.form.set({
      type: y.type,
      targetKind: y.herdId ? 'herd' : 'animal',
      animalId: y.animalId || '',
      herdId: y.herdId || '',
      amount: y.amount || null,
      unit: y.unit,
      date: this.formatDateForInput(y.date),
    });

    this.showDrawer.set(true);
  }

  closeDrawer() {
    this.showDrawer.set(false);
    this.isEditing.set(false);
    this.editingId.set(null);
    this.errorMessage.set(null);
  }

  onTypeChange(newType: YieldType) {
    this.form.update((cur) => ({
      ...cur,
      type: newType,
      unit: newType === 'sut' ? 'lt' : 'kg',
    }));
  }

  async saveYield() {
    const f = this.form();
    if (!f.amount || f.amount <= 0) {
      this.errorMessage.set('Lütfen geçerli bir verim miktarı girin.');
      return;
    }
    if (f.targetKind === 'animal' && !f.animalId) {
      this.errorMessage.set('Lütfen bir hayvan seçin.');
      return;
    }
    if (f.targetKind === 'herd' && !f.herdId) {
      this.errorMessage.set('Lütfen bir sürü seçin.');
      return;
    }
    if (!f.date) {
      this.errorMessage.set('Lütfen kayıt tarihini girin.');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    try {
      const payload: Partial<YieldRecord> = {
        type: f.type,
        amount: Number(f.amount),
        unit: f.unit,
        date: new Date(f.date),
        animalId: f.targetKind === 'animal' ? f.animalId : undefined,
        herdId: f.targetKind === 'herd' ? f.herdId : undefined,
      };

      if (this.isEditing() && this.editingId()) {
        await this.yieldService.update(this.editingId()!, payload);
      } else {
        await this.yieldService.create(payload as any);
      }

      this.closeDrawer();
    } catch (err: any) {
      console.error('Verim kaydedilemedi:', err);
      this.errorMessage.set(err?.message || 'Kayıt sırasında bir hata oluştu.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteYield(id?: string) {
    if (!id) return;
    const confirmed = await this.alertService.confirmDelete(
      'Verim Kaydını Sil',
      'Bu verim kaydını silmek istediğinize emin misiniz?'
    );
    if (!confirmed) return;
    try {
      await this.yieldService.softDelete(id);
      this.alertService.toastSuccess('Verim kaydı başarıyla silindi');
    } catch (err) {
      console.error('Silme hatası:', err);
      this.alertService.error('Hata Oluştu', 'Kayıt silinirken bir hata oluştu.');
    }
  }

  // Helpers
  getAnimal(id?: string): Animal | undefined {
    return id ? this.animalMap().get(id) : undefined;
  }

  getHerd(id?: string): Herd | undefined {
    return id ? this.herdMap().get(id) : undefined;
  }

  private getTime(val: any): number {
    if (!val) return 0;
    if (val.seconds) return val.seconds * 1000;
    if (val.toDate && typeof val.toDate === 'function') return val.toDate().getTime();
    if (val instanceof Date) return val.getTime();
    return new Date(val).getTime() || 0;
  }

  private formatDateForInput(val: any): string {
    if (!val) return new Date().toISOString().substring(0, 10);
    let d: Date;
    if (val.seconds) d = new Date(val.seconds * 1000);
    else if (val.toDate && typeof val.toDate === 'function') d = val.toDate();
    else if (val instanceof Date) d = val;
    else d = new Date(val);

    if (isNaN(d.getTime())) return new Date().toISOString().substring(0, 10);
    return d.toISOString().substring(0, 10);
  }
}
