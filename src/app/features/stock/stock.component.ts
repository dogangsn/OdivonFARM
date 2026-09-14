import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { toSignal } from '@angular/core/rxjs-interop';
import { StockMovementService } from '../../core/services/stock-movement.service';
import { StockItemService } from '../../core/services/stock-item.service';
import { StockCategoryService } from '../../core/services/stock-category.service';
import { WarehouseService } from '../../core/services/definitions/warehouse.service';
import { AccountService } from '../../core/services/definitions/account.service';
import { StockMovement, StockItem, StockCategory, Warehouse, Account, StockMovementType } from '../../core/models/inventory.model';
import { AlertService } from '../../core/services/alert.service';

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './stock.component.html',
  styleUrls: ['./stock.component.scss'],
})
export class StockComponent {
  private movementService = inject(StockMovementService);
  private itemService = inject(StockItemService);
  private categoryService = inject(StockCategoryService);
  private warehouseService = inject(WarehouseService);
  private accountService = inject(AccountService);
  private alertService = inject(AlertService);

  readonly movements = toSignal(this.movementService.list(), { initialValue: [] as StockMovement[] });
  readonly items = toSignal(this.itemService.list(), { initialValue: [] as StockItem[] });
  readonly categories = toSignal(this.categoryService.list(), { initialValue: [] as StockCategory[] });
  readonly warehouses = toSignal(this.warehouseService.list(), { initialValue: [] as Warehouse[] });
  readonly accounts = toSignal(this.accountService.list(), { initialValue: [] as Account[] });

  // Tab: 'movements' | 'inventory'
  readonly activeTab = signal<'movements' | 'inventory'>('movements');

  // Filters
  readonly searchTerm = signal('');
  readonly typeFilter = signal<'all' | 'giris' | 'cikis'>('all');
  readonly warehouseFilter = signal<string>('');

  // Drawer state
  readonly showDrawer = signal(false);
  readonly drawerMode = signal<'movement' | 'new-item'>('movement');
  readonly isEditingMovement = signal(false);
  readonly editingMovementId = signal<string | null>(null);
  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // Movement Form
  readonly movementForm = signal<{
    type: StockMovementType;
    warehouseId: string;
    stockItemId: string;
    quantity: number | null;
    accountId?: string;
    date: string;
    note?: string;
  }>({
    type: 'giris',
    warehouseId: '',
    stockItemId: '',
    quantity: null,
    accountId: '',
    date: new Date().toISOString().substring(0, 10),
    note: '',
  });

  // New Stock Item Form
  readonly newItemForm = signal<{
    name: string;
    categoryId: string;
    unit: string;
    minQuantity: number | null;
  }>({
    name: '',
    categoryId: '',
    unit: 'kg',
    minQuantity: 10,
  });

  // Lookup maps
  readonly itemMap = computed(() => {
    const map = new Map<string, StockItem>();
    for (const item of this.items() || []) {
      if (item?.id) map.set(item.id, item);
    }
    return map;
  });

  readonly categoryMap = computed(() => {
    const map = new Map<string, StockCategory>();
    for (const cat of this.categories() || []) {
      if (cat?.id) map.set(cat.id, cat);
    }
    return map;
  });

  readonly warehouseMap = computed(() => {
    const map = new Map<string, Warehouse>();
    for (const wh of this.warehouses() || []) {
      if (wh?.id) map.set(wh.id, wh);
    }
    return map;
  });

  readonly accountMap = computed(() => {
    const map = new Map<string, Account>();
    for (const acc of this.accounts() || []) {
      if (acc?.id) map.set(acc.id, acc);
    }
    return map;
  });

  // Filtered movements
  readonly filteredMovements = computed(() => {
    let list = this.movements() || [];
    const query = (this.searchTerm() || '').trim().toLowerCase();
    const typeF = this.typeFilter();
    const whF = this.warehouseFilter();

    if (typeF !== 'all') {
      list = list.filter((m) => m.type === typeF);
    }

    if (whF) {
      list = list.filter((m) => m.warehouseId === whF);
    }

    if (query) {
      list = list.filter((m) => {
        const item = this.itemMap().get(m.stockItemId);
        const wh = this.warehouseMap().get(m.warehouseId);
        const acc = m.accountId ? this.accountMap().get(m.accountId) : null;
        const itemName = item?.name?.toLowerCase() || '';
        const whName = wh?.name?.toLowerCase() || '';
        const accTitle = acc?.title?.toLowerCase() || '';
        const note = m.note?.toLowerCase() || '';

        return itemName.includes(query) || whName.includes(query) || accTitle.includes(query) || note.includes(query);
      });
    }

    return [...(list || [])].sort((a, b) => {
      const timeA = this.getTime(a.date);
      const timeB = this.getTime(b.date);
      return timeB - timeA;
    });
  });

  // Inventory balance summary per item
  readonly inventoryBalances = computed(() => {
    const moves = this.movements() || [];
    const itemMap = this.itemMap();
    const balances = new Map<string, { inQty: number; outQty: number; balance: number }>();

    for (const m of moves) {
      if (!m.stockItemId) continue;
      const cur = balances.get(m.stockItemId) || { inQty: 0, outQty: 0, balance: 0 };
      const qty = Number(m.quantity) || 0;
      if (m.type === 'giris') {
        cur.inQty += qty;
        cur.balance += qty;
      } else {
        cur.outQty += qty;
        cur.balance -= qty;
      }
      balances.set(m.stockItemId, cur);
    }

    return (this.items() || []).map((item) => {
      const b = balances.get(item.id || '') || { inQty: 0, outQty: 0, balance: 0 };
      const cat = this.categoryMap().get(item.categoryId);
      const isCritical = item.minQuantity != null && b.balance <= item.minQuantity;
      return {
        item,
        categoryName: cat?.name || 'Kategorisiz',
        categoryKind: cat?.kind || 'diger',
        inQty: b.inQty,
        outQty: b.outQty,
        balance: b.balance,
        isCritical,
      };
    }).sort((a, b) => (a.isCritical === b.isCritical ? 0 : a.isCritical ? -1 : 1));
  });

  // Stats
  readonly stats = computed(() => {
    const list = this.movements() || [];
    const inCount = list.filter((m) => m.type === 'giris').length;
    const outCount = list.filter((m) => m.type === 'cikis').length;
    const criticalCount = this.inventoryBalances().filter((i) => i.isCritical).length;

    return {
      totalMovements: list.length,
      inCount,
      outCount,
      totalItems: (this.items() || []).length,
      criticalCount,
    };
  });

  // Drawer handlers
  openAddMovementDrawer(defaultType: StockMovementType = 'giris') {
    this.drawerMode.set('movement');
    this.isEditingMovement.set(false);
    this.editingMovementId.set(null);
    this.errorMessage.set(null);

    const firstWh = (this.warehouses() || [])[0]?.id || '';
    const firstItem = (this.items() || [])[0]?.id || '';

    this.movementForm.set({
      type: defaultType,
      warehouseId: firstWh,
      stockItemId: firstItem,
      quantity: null,
      accountId: '',
      date: new Date().toISOString().substring(0, 10),
      note: '',
    });

    this.showDrawer.set(true);
  }

  openEditMovementDrawer(m: StockMovement) {
    if (!m?.id) return;
    this.drawerMode.set('movement');
    this.isEditingMovement.set(true);
    this.editingMovementId.set(m.id);
    this.errorMessage.set(null);

    this.movementForm.set({
      type: m.type,
      warehouseId: m.warehouseId || '',
      stockItemId: m.stockItemId || '',
      quantity: m.quantity || null,
      accountId: m.accountId || '',
      date: this.formatDateForInput(m.date),
      note: m.note || '',
    });

    this.showDrawer.set(true);
  }

  openNewItemDrawer() {
    this.drawerMode.set('new-item');
    this.errorMessage.set(null);

    const firstCat = (this.categories() || [])[0]?.id || '';

    this.newItemForm.set({
      name: '',
      categoryId: firstCat,
      unit: 'kg',
      minQuantity: 10,
    });

    this.showDrawer.set(true);
  }

  closeDrawer() {
    this.showDrawer.set(false);
    this.isEditingMovement.set(false);
    this.editingMovementId.set(null);
    this.errorMessage.set(null);
  }

  async saveMovement() {
    const f = this.movementForm();
    if (!f.warehouseId) {
      this.errorMessage.set('Lütfen bir depo seçin.');
      return;
    }
    if (!f.stockItemId) {
      this.errorMessage.set('Lütfen bir stok kalemi seçin.');
      return;
    }
    if (!f.quantity || f.quantity <= 0) {
      this.errorMessage.set('Lütfen geçerli bir miktar girin.');
      return;
    }
    if (!f.date) {
      this.errorMessage.set('Lütfen hareket tarihini belirtin.');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    try {
      const payload: Partial<StockMovement> = {
        warehouseId: f.warehouseId,
        stockItemId: f.stockItemId,
        type: f.type,
        quantity: Number(f.quantity),
        date: new Date(f.date),
        accountId: f.accountId || undefined,
        note: f.note?.trim() || undefined,
      };

      if (this.isEditingMovement() && this.editingMovementId()) {
        await this.movementService.update(this.editingMovementId()!, payload);
      } else {
        await this.movementService.create(payload as any);
      }

      this.closeDrawer();
    } catch (err: any) {
      console.error('Stok hareketi kaydedilemedi:', err);
      this.errorMessage.set(err?.message || 'Kayıt sırasında bir hata oluştu.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async saveNewItem() {
    const f = this.newItemForm();
    if (!f.name.trim()) {
      this.errorMessage.set('Lütfen ürün / kalem adı girin.');
      return;
    }
    if (!f.categoryId) {
      this.errorMessage.set('Lütfen bir stok kategorisi seçin.');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    try {
      const payload: Partial<StockItem> = {
        name: f.name.trim(),
        categoryId: f.categoryId,
        unit: f.unit.trim() || 'adet',
        minQuantity: f.minQuantity != null ? Number(f.minQuantity) : undefined,
      };

      const newId = await this.itemService.create(payload as any);

      // Auto select in movement form
      this.movementForm.update((prev) => ({
        ...prev,
        stockItemId: newId,
      }));

      // Switch back to movement drawer
      this.drawerMode.set('movement');
    } catch (err: any) {
      console.error('Kalem eklenemedi:', err);
      this.errorMessage.set(err?.message || 'Kalem eklenirken hata oluştu.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteMovement(id?: string) {
    if (!id) return;
    const confirmed = await this.alertService.confirmDelete(
      'Stok Hareketini Sil',
      'Bu stok hareketini silmek istediğinize emin misiniz?'
    );
    if (!confirmed) return;
    try {
      await this.movementService.softDelete(id);
      this.alertService.toastSuccess('Stok hareketi başarıyla silindi');
    } catch (err) {
      console.error('Silme hatası:', err);
      this.alertService.error('Hata Oluştu', 'Kayıt silinirken bir hata oluştu.');
    }
  }

  // Helpers
  getItem(id: string): StockItem | undefined {
    return this.itemMap().get(id);
  }

  getWarehouseName(id: string): string {
    return this.warehouseMap().get(id)?.name || 'Bilinmeyen Depo';
  }

  getAccountTitle(id?: string): string {
    if (!id) return '—';
    return this.accountMap().get(id)?.title || '—';
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
