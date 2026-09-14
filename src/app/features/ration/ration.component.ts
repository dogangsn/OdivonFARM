import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { toSignal } from '@angular/core/rxjs-interop';
import { RationService } from '../../core/services/ration.service';
import { StockItemService } from '../../core/services/stock-item.service';
import { Ration, RationItem } from '../../core/models/production.model';
import { StockItem } from '../../core/models/inventory.model';
import { AlertService } from '../../core/services/alert.service';

@Component({
  selector: 'app-ration',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './ration.component.html',
  styleUrls: ['./ration.component.scss'],
})
export class RationComponent {
  private rationService = inject(RationService);
  private stockItemService = inject(StockItemService);
  private alertService = inject(AlertService);

  readonly rations = toSignal(this.rationService.list(), { initialValue: [] as Ration[] });
  readonly stockItems = toSignal(this.stockItemService.list(), { initialValue: [] as StockItem[] });

  // Filters
  readonly searchTerm = signal('');

  // Drawer
  readonly showDrawer = signal(false);
  readonly isEditing = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // Form Model
  readonly form = signal<{
    name: string;
    targetGroup: string;
    items: { stockItemId: string; amountKg: number }[];
  }>({
    name: '',
    targetGroup: 'Gebe Koyunlar',
    items: [],
  });

  // Stock Item Map
  readonly itemMap = computed(() => {
    const map = new Map<string, StockItem>();
    for (const item of this.stockItems() || []) {
      if (item?.id) map.set(item.id, item);
    }
    return map;
  });

  // Filtered Rations
  readonly filteredRations = computed(() => {
    let list = this.rations() || [];
    const query = (this.searchTerm() || '').trim().toLowerCase();

    if (query) {
      list = list.filter((r) => {
        const name = r.name?.toLowerCase() || '';
        const group = r.targetGroup?.toLowerCase() || '';
        return name.includes(query) || group.includes(query);
      });
    }

    return list;
  });

  // Stats
  readonly stats = computed(() => {
    const list = this.rations() || [];
    const groups = new Set<string>();
    let totalIngredients = 0;

    for (const r of list) {
      if (r.targetGroup) groups.add(r.targetGroup);
      totalIngredients += r.items?.length || 0;
    }

    return {
      totalRations: list.length,
      distinctGroups: groups.size,
      totalIngredients,
    };
  });

  // Form calculated total Kg
  readonly formTotalKg = computed(() => {
    return this.form().items.reduce((sum, item) => sum + (Number(item.amountKg) || 0), 0);
  });

  openAddDrawer() {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.errorMessage.set(null);

    const firstItem = (this.stockItems() || [])[0]?.id || '';

    this.form.set({
      name: '',
      targetGroup: 'Gebe Koyunlar',
      items: firstItem ? [{ stockItemId: firstItem, amountKg: 1 }] : [],
    });

    this.showDrawer.set(true);
  }

  openEditDrawer(r: Ration) {
    if (!r?.id) return;
    this.isEditing.set(true);
    this.editingId.set(r.id);
    this.errorMessage.set(null);

    this.form.set({
      name: r.name || '',
      targetGroup: r.targetGroup || 'Gebe Koyunlar',
      items: (r.items || []).map((i) => ({
        stockItemId: i.stockItemId,
        amountKg: i.amountKg,
      })),
    });

    this.showDrawer.set(true);
  }

  closeDrawer() {
    this.showDrawer.set(false);
    this.isEditing.set(false);
    this.editingId.set(null);
    this.errorMessage.set(null);
  }

  addItemRow() {
    const firstItem = (this.stockItems() || [])[0]?.id || '';
    this.form.update((prev) => ({
      ...prev,
      items: [...prev.items, { stockItemId: firstItem, amountKg: 1 }],
    }));
  }

  removeItemRow(index: number) {
    this.form.update((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }

  async saveRation() {
    const f = this.form();
    if (!f.name.trim()) {
      this.errorMessage.set('Lütfen rasyon adını girin.');
      return;
    }
    if (f.items.length === 0) {
      this.errorMessage.set('Lütfen en az 1 adet yem hammaddesi ekleyin.');
      return;
    }
    for (const item of f.items) {
      if (!item.stockItemId) {
        this.errorMessage.set('Lütfen tüm satırlarda yem kalemi seçin.');
        return;
      }
      if (!item.amountKg || item.amountKg <= 0) {
        this.errorMessage.set('Lütfen geçerli miktar (kg) girin.');
        return;
      }
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    try {
      const payload: Partial<Ration> = {
        name: f.name.trim(),
        targetGroup: f.targetGroup?.trim() || undefined,
        items: f.items.map((i) => ({
          stockItemId: i.stockItemId,
          amountKg: Number(i.amountKg),
        })),
      };

      if (this.isEditing() && this.editingId()) {
        await this.rationService.update(this.editingId()!, payload);
      } else {
        await this.rationService.create(payload as any);
      }

      this.closeDrawer();
    } catch (err: any) {
      console.error('Rasyon kaydedilemedi:', err);
      this.errorMessage.set(err?.message || 'Kayıt sırasında bir hata oluştu.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteRation(id?: string) {
    if (!id) return;
    const confirmed = await this.alertService.confirmDelete(
      'Rasyon Reçetesini Sil',
      'Bu rasyon reçetesini silmek istediğinize emin misiniz?'
    );
    if (!confirmed) return;
    try {
      await this.rationService.softDelete(id);
      this.alertService.toastSuccess('Rasyon reçetesi başarıyla silindi');
    } catch (err) {
      console.error('Silme hatası:', err);
      this.alertService.error('Hata Oluştu', 'Rasyon silinirken bir hata oluştu.');
    }
  }

  // Helpers
  getItemName(id: string): string {
    return this.itemMap().get(id)?.name || 'Bilinmeyen Yem';
  }

  calculateTotalKg(items?: RationItem[]): number {
    if (!items || items.length === 0) return 0;
    return items.reduce((sum, item) => sum + (Number(item.amountKg) || 0), 0);
  }

  getItemPercentage(itemKg: number, totalKg: number): number {
    if (!totalKg || totalKg <= 0) return 0;
    return Math.round((itemKg / totalKg) * 100);
  }
}
