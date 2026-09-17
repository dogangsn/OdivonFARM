import { BaseDoc } from './base.model';

/** farms/{farmId}/accounts/{accountId} — Cariler */
export interface Account extends BaseDoc {
  title: string;
  description?: string;
  address?: string;
  phone?: string;
}

/** farms/{farmId}/warehouses/{id} — Depolar */
export interface Warehouse extends BaseDoc {
  name: string;
  location?: string;
}

export type StockCategoryKind = 'yem' | 'sarf' | 'ilac' | 'diger';

/** farms/{farmId}/stockCategories/{id} — Stok Kategorileri */
export interface StockCategory extends BaseDoc {
  name: string;
  kind?: StockCategoryKind;
  description?: string;
  colorTheme?: string;
}

/** farms/{farmId}/stockCategories/{categoryId}/items/{itemId} — Stok Kalemleri */
export interface StockItem extends BaseDoc {
  categoryId: string;
  name: string;
  unit: string; // kg, lt, adet ...
  minQuantity?: number;
}

export type StockMovementType = 'giris' | 'cikis';

/** farms/{farmId}/stockMovements/{id} — Stok Giriş/Çıkış */
export interface StockMovement extends BaseDoc {
  warehouseId: string;
  stockItemId: string;
  type: StockMovementType;
  quantity: number;
  date: any;
  accountId?: string; // ilgili cari (alım/satım ise)
  note?: string;
}

/** farms/{farmId}/accountingItems/{id} — Muhasebe Kalemleri (gelir/gider kategorisi) */
export interface AccountingItem extends BaseDoc {
  name: string;
  type: 'gelir' | 'gider';
}

/** farms/{farmId}/accountingTransactions/{id} — Muhasebe hareketleri */
export interface AccountingTransaction extends BaseDoc {
  accountingItemId: string;
  accountId?: string;
  amount: number;
  date: any;
  description?: string;
}
