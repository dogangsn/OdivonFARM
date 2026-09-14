import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { toSignal } from '@angular/core/rxjs-interop';
import { AccountingTransactionService } from '../../core/services/accounting-transaction.service';
import { AccountingItemService } from '../../core/services/definitions/accounting-item.service';
import { AccountService } from '../../core/services/definitions/account.service';
import { AccountingTransaction, AccountingItem, Account } from '../../core/models/inventory.model';

@Component({
  selector: 'app-accounting',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './accounting.component.html',
  styleUrls: ['./accounting.component.scss'],
})
export class AccountingComponent {
  private transactionService = inject(AccountingTransactionService);
  private itemService = inject(AccountingItemService);
  private accountService = inject(AccountService);

  readonly transactions = toSignal(this.transactionService.list(), { initialValue: [] as AccountingTransaction[] });
  readonly items = toSignal(this.itemService.list(), { initialValue: [] as AccountingItem[] });
  readonly accounts = toSignal(this.accountService.list(), { initialValue: [] as Account[] });

  // UI state
  readonly searchTerm = signal('');
  readonly typeFilter = signal<'all' | 'gelir' | 'gider'>('all');
  readonly itemFilter = signal<string>('');
  readonly accountFilter = signal<string>('');

  readonly showDrawer = signal(false);
  readonly isEditing = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // Form Model
  readonly form = signal<{
    type: 'gelir' | 'gider';
    accountingItemId: string;
    accountId?: string;
    amount: number | null;
    date: string;
    description?: string;
  }>({
    type: 'gider',
    accountingItemId: '',
    accountId: '',
    amount: null,
    date: new Date().toISOString().substring(0, 10),
    description: '',
  });

  // Lookup maps
  readonly itemMap = computed(() => {
    const map = new Map<string, AccountingItem>();
    for (const item of this.items() || []) {
      if (item?.id) map.set(item.id, item);
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

  // Filtered items based on form type (gelir vs gider)
  readonly formItems = computed(() => {
    const currentType = this.form().type;
    return (this.items() || []).filter((i) => i.type === currentType);
  });

  // Filtered transactions list
  readonly filteredTransactions = computed(() => {
    let list = this.transactions() || [];
    const query = (this.searchTerm() || '').trim().toLowerCase();
    const typeF = this.typeFilter();
    const itemF = this.itemFilter();
    const accountF = this.accountFilter();

    if (typeF !== 'all') {
      list = list.filter((t) => {
        const item = this.itemMap().get(t.accountingItemId);
        return item ? item.type === typeF : true;
      });
    }

    if (itemF) {
      list = list.filter((t) => t.accountingItemId === itemF);
    }

    if (accountF) {
      list = list.filter((t) => t.accountId === accountF);
    }

    if (query) {
      list = list.filter((t) => {
        const item = this.itemMap().get(t.accountingItemId);
        const account = t.accountId ? this.accountMap().get(t.accountId) : null;
        const itemName = item?.name?.toLowerCase() || '';
        const accTitle = account?.title?.toLowerCase() || '';
        const desc = t.description?.toLowerCase() || '';
        const amountStr = String(t.amount || '');

        return itemName.includes(query) || accTitle.includes(query) || desc.includes(query) || amountStr.includes(query);
      });
    }

    return [...(list || [])].sort((a, b) => {
      const timeA = this.getTime(a.date);
      const timeB = this.getTime(b.date);
      return timeB - timeA;
    });
  });

  // KPIs
  readonly stats = computed(() => {
    const list = this.transactions() || [];
    let totalIncome = 0;
    let totalExpense = 0;

    for (const t of list) {
      const item = this.itemMap().get(t.accountingItemId);
      const isIncome = item ? item.type === 'gelir' : false;
      const amt = Number(t.amount) || 0;
      if (isIncome) {
        totalIncome += amt;
      } else {
        totalExpense += amt;
      }
    }

    const netBalance = totalIncome - totalExpense;
    return {
      totalCount: list.length,
      totalIncome,
      totalExpense,
      netBalance,
    };
  });

  openAddDrawer(defaultType: 'gelir' | 'gider' = 'gider') {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.errorMessage.set(null);

    // Pick first matching item if available
    const matched = (this.items() || []).find((i) => i.type === defaultType);

    this.form.set({
      type: defaultType,
      accountingItemId: matched?.id || '',
      accountId: '',
      amount: null,
      date: new Date().toISOString().substring(0, 10),
      description: '',
    });

    this.showDrawer.set(true);
  }

  openEditDrawer(t: AccountingTransaction) {
    if (!t?.id) return;
    this.isEditing.set(true);
    this.editingId.set(t.id);
    this.errorMessage.set(null);

    const item = this.itemMap().get(t.accountingItemId);
    const itemType = item?.type || 'gider';

    this.form.set({
      type: itemType,
      accountingItemId: t.accountingItemId || '',
      accountId: t.accountId || '',
      amount: t.amount || null,
      date: this.formatDateForInput(t.date),
      description: t.description || '',
    });

    this.showDrawer.set(true);
  }

  closeDrawer() {
    this.showDrawer.set(false);
    this.isEditing.set(false);
    this.editingId.set(null);
    this.errorMessage.set(null);
  }

  onTypeChange(newType: 'gelir' | 'gider') {
    const cur = this.form();
    const matched = (this.items() || []).find((i) => i.type === newType);
    this.form.set({
      ...cur,
      type: newType,
      accountingItemId: matched?.id || '',
    });
  }

  async saveTransaction() {
    const f = this.form();
    if (!f.amount || f.amount <= 0) {
      this.errorMessage.set('Lütfen geçerli bir tutar girin.');
      return;
    }
    if (!f.accountingItemId) {
      this.errorMessage.set('Lütfen bir muhasebe kalemi seçin.');
      return;
    }
    if (!f.date) {
      this.errorMessage.set('Lütfen işlem tarihini belirtin.');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    try {
      const payload: Partial<AccountingTransaction> = {
        accountingItemId: f.accountingItemId,
        accountId: f.accountId || undefined,
        amount: Number(f.amount),
        date: new Date(f.date),
        description: f.description?.trim() || undefined,
      };

      if (this.isEditing() && this.editingId()) {
        await this.transactionService.update(this.editingId()!, payload);
      } else {
        await this.transactionService.create(payload as any);
      }

      this.closeDrawer();
    } catch (err: any) {
      console.error('İşlem kaydedilemedi:', err);
      this.errorMessage.set(err?.message || 'Kayıt sırasında bir hata oluştu.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteTransaction(id?: string) {
    if (!id) return;
    if (!confirm('Bu muhasebe kaydını silmek istediğinize emin misiniz?')) {
      return;
    }
    try {
      await this.transactionService.softDelete(id);
    } catch (err) {
      console.error('Silme hatası:', err);
      alert('Kayıt silinirken bir hata oluştu.');
    }
  }

  // Helpers
  isIncome(t: AccountingTransaction): boolean {
    const item = this.itemMap().get(t.accountingItemId);
    return item?.type === 'gelir';
  }

  getItemName(id: string): string {
    return this.itemMap().get(id)?.name || 'Belirtilmemiş';
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
