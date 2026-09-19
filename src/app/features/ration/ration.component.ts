import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { toSignal } from '@angular/core/rxjs-interop';
import Swal from 'sweetalert2';

import { RationService } from '../../core/services/ration.service';
import { StockItemService } from '../../core/services/stock-item.service';
import { StockMovementService } from '../../core/services/stock-movement.service';
import { PaddockService } from '../../core/services/definitions/paddock.service';
import { WarehouseService } from '../../core/services/definitions/warehouse.service';
import { AnimalService } from '../../core/services/animal.service';
import { AlertService } from '../../core/services/alert.service';
import {
  CalculatedRationMetrics,
  RationCalculatorService,
} from '../../core/services/ration-calculator.service';
import { Ration, RationItem } from '../../core/models/production.model';
import { StockItem, Warehouse } from '../../core/models/inventory.model';
import { Animal, Paddock } from '../../core/models';

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
  private stockMovementService = inject(StockMovementService);
  private paddockService = inject(PaddockService);
  private warehouseService = inject(WarehouseService);
  private animalService = inject(AnimalService);
  private alertService = inject(AlertService);
  calculatorService = inject(RationCalculatorService);

  readonly rations = toSignal(this.rationService.list(), { initialValue: [] as Ration[] });
  readonly stockItems = toSignal(this.stockItemService.list(), { initialValue: [] as StockItem[] });
  readonly paddocks = toSignal(this.paddockService.list(), { initialValue: [] as Paddock[] });
  readonly warehouses = toSignal(this.warehouseService.list(), { initialValue: [] as Warehouse[] });
  readonly animals = toSignal(this.animalService.list(), { initialValue: [] as Animal[] });

  // Predefined NRC target groups
  readonly targetGroups = Object.keys(this.calculatorService.targetRequirements);

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
    items: { stockItemId: string; amountKg: number; unitPrice?: number }[];
  }>({
    name: '',
    targetGroup: 'Gebe Koyunlar (Son 6 Hafta)',
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

  // Live scientific analysis of current form mix
  readonly formCalculatedMetrics = computed<CalculatedRationMetrics>(() => {
    const f = this.form();
    const items = f.items.map((i) => ({
      itemName: this.getItemName(i.stockItemId),
      amountKg: Number(i.amountKg) || 0,
      unitPrice: i.unitPrice,
    }));

    return this.calculatorService.calculateRation(items, f.targetGroup);
  });

  // Feed Distribution & Stock Deduction Modal State
  isDeductModalOpen = signal(false);
  selectedRationForDeduct = signal<Ration | null>(null);
  selectedPaddockId = signal<string>('');
  selectedWarehouseId = signal<string>('');
  isDeducting = signal(false);

  // Active animals in selected paddock
  paddockAnimals = computed(() => {
    const padId = this.selectedPaddockId();
    if (!padId) return [];
    return this.animals().filter((a) => a.paddockId === padId && a.status === 'aktif');
  });

  // Total kg to deduct per ingredient for the paddock
  deductCalculations = computed(() => {
    const ration = this.selectedRationForDeduct();
    const animalCount = this.paddockAnimals().length;
    if (!ration || !ration.items || animalCount === 0) {
      return { totalKg: 0, items: [], totalEstimatedCost: 0 };
    }

    const items = ration.items.map((i) => {
      const perAnimal = Number(i.amountKg) || 0;
      const totalAmount = Number((perAnimal * animalCount).toFixed(1));
      const profile = this.calculatorService.resolveNutrientProfile(this.getItemName(i.stockItemId));
      const cost = Number((totalAmount * profile.defaultPricePerKg).toFixed(1));

      return {
        stockItemId: i.stockItemId,
        itemName: this.getItemName(i.stockItemId),
        unit: this.itemMap().get(i.stockItemId)?.unit || 'kg',
        perAnimalKg: perAnimal,
        totalAmount,
        estimatedCost: cost,
      };
    });

    const totalKg = items.reduce((sum, it) => sum + it.totalAmount, 0);
    const totalEstimatedCost = items.reduce((sum, it) => sum + it.estimatedCost, 0);

    return {
      totalKg: Number(totalKg.toFixed(1)),
      items,
      totalEstimatedCost: Number(totalEstimatedCost.toFixed(2)),
    };
  });

  openAddDrawer() {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.errorMessage.set(null);

    const firstItem = (this.stockItems() || [])[0]?.id || '';

    this.form.set({
      name: '',
      targetGroup: 'Gebe Koyunlar (Son 6 Hafta)',
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
      targetGroup: r.targetGroup || 'Gebe Koyunlar (Son 6 Hafta)',
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
        this.alertService.toastSuccess('Rasyon formülasyonu başarıyla güncellendi');
      } else {
        await this.rationService.create(payload as any);
        this.alertService.toastSuccess('Yeni rasyon reçetesi oluşturuldu');
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

  // Calculate metrics for any ration in the grid
  getRationMetrics(r: Ration): CalculatedRationMetrics {
    const items = (r.items || []).map((i) => ({
      itemName: this.getItemName(i.stockItemId),
      amountKg: Number(i.amountKg) || 0,
    }));
    return this.calculatorService.calculateRation(items, r.targetGroup || '');
  }

  // Open feed distribution & stock deduction modal
  openDeductModal(r: Ration) {
    this.selectedRationForDeduct.set(r);
    const defaultPaddock = (this.paddocks() || [])[0]?.id || '';
    const defaultWarehouse = (this.warehouses() || [])[0]?.id || '';
    this.selectedPaddockId.set(defaultPaddock);
    this.selectedWarehouseId.set(defaultWarehouse);
    this.isDeductModalOpen.set(true);
  }

  closeDeductModal() {
    this.isDeductModalOpen.set(false);
    this.selectedRationForDeduct.set(null);
  }

  // Executes actual stock deduction into Firestore
  async executeStockDeduction() {
    const ration = this.selectedRationForDeduct();
    const calculations = this.deductCalculations();
    const pad = this.paddocks().find((p) => p.id === this.selectedPaddockId());
    const warehouseId = this.selectedWarehouseId();

    if (!ration || calculations.items.length === 0) return;
    if (this.paddockAnimals().length === 0) {
      this.alertService.error('İşlem Başarısız', 'Seçilen padokta aktif hayvan bulunamadı.');
      return;
    }

    const isDark = document.documentElement.classList.contains('dark');
    const confirm = await Swal.fire({
      title: 'Yem Çıkışı ve Stok Düşümü',
      html: `
        <div class="text-left text-xs space-y-2">
          <p><strong>Rasyon:</strong> ${ration.name}</p>
          <p><strong>Padok:</strong> ${pad?.name || 'Seçili Padok'} (${this.paddockAnimals().length} Baş)</p>
          <p><strong>Toplam Çıkış:</strong> ${calculations.totalKg} kg yem</p>
          <p><strong>Tahmini Maliyet:</strong> ${calculations.totalEstimatedCost.toLocaleString('tr-TR')} ₺</p>
          <p class="text-emerald-600 dark:text-emerald-400 font-bold mt-2">Depo stoklarından otomatik çıkış hareketi oluşturulacaktır. Onaylıyor musunuz?</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Evet, Stoktan Düş',
      cancelButtonText: 'Vazgeç',
      confirmButtonColor: '#10b981',
      background: isDark ? '#1e293b' : '#ffffff',
      color: isDark ? '#f8fafc' : '#0f172a',
    });

    if (!confirm.isConfirmed) return;

    this.isDeducting.set(true);

    try {
      const now = new Date();
      for (const item of calculations.items) {
        await this.stockMovementService.create({
          warehouseId: warehouseId || 'ana-depo',
          stockItemId: item.stockItemId,
          type: 'cikis',
          quantity: item.totalAmount,
          date: now,
          note: `${ration.name} — ${pad?.name || 'Padok'} Dağıtımı (${this.paddockAnimals().length} Baş)`,
        } as any);
      }

      this.alertService.toastSuccess(
        `${calculations.totalKg} kg yem başarıyla stoktan düşüldü ve dağıtım kaydedildi!`
      );
      this.closeDeductModal();
    } catch (err: any) {
      console.error('Stok düşümü hatası:', err);
      this.alertService.error('Hata Oluştu', err?.message || 'Stok düşümü yapılamadı.');
    } finally {
      this.isDeducting.set(false);
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
