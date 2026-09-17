import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { toSignal } from '@angular/core/rxjs-interop';

import { Account } from '../../../core/models';
import { AccountService } from '../../../core/services/definitions/account.service';
import { AlertService } from '../../../core/services/alert.service';

export interface AccountFormData {
  title: string;
  phone: string;
  address: string;
  description: string;
  colorTheme: string;
}

const DEFAULT_FORM: AccountFormData = {
  title: '',
  phone: '',
  address: '',
  description: '',
  colorTheme: 'indigo',
};

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './accounts.component.html',
  styleUrl: './accounts.component.scss',
})
export class AccountsComponent {
  private service = inject(AccountService);
  private alertService = inject(AlertService);

  readonly loading = signal(true);
  readonly accounts = toSignal(this.service.list(), { initialValue: [] as Account[] });

  constructor() {
    this.service.list().subscribe({
      next: () => this.loading.set(false),
      error: () => this.loading.set(false),
    });
  }

  // Filters & View state
  readonly searchTerm = signal('');
  readonly viewMode = signal<'grid' | 'table'>('grid');

  // Modal state
  readonly isModalOpen = signal(false);
  readonly isEditing = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = signal<AccountFormData>({ ...DEFAULT_FORM });

  // Color themes
  readonly colorThemes = [
    { id: 'indigo', label: 'İndigo', bgClass: 'from-indigo-500 to-indigo-600', textClass: 'text-indigo-600 dark:text-indigo-400', badgeClass: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-800/40' },
    { id: 'emerald', label: 'Zümrüt', bgClass: 'from-emerald-500 to-emerald-600', textClass: 'text-emerald-600 dark:text-emerald-400', badgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40' },
    { id: 'amber', label: 'Kehribar', bgClass: 'from-amber-500 to-amber-600', textClass: 'text-amber-600 dark:text-amber-400', badgeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40' },
    { id: 'rose', label: 'Gül Kurusu', bgClass: 'from-rose-500 to-rose-600', textClass: 'text-rose-600 dark:text-rose-400', badgeClass: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/40' },
    { id: 'purple', label: 'Mor', bgClass: 'from-purple-500 to-purple-600', textClass: 'text-purple-600 dark:text-purple-400', badgeClass: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200/60 dark:border-purple-800/40' },
    { id: 'sky', label: 'Gök Mavisi', bgClass: 'from-sky-500 to-sky-600', textClass: 'text-sky-600 dark:text-sky-400', badgeClass: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200/60 dark:border-sky-800/40' },
  ];

  readonly filteredAccounts = computed(() => {
    let list = this.accounts();
    const query = this.searchTerm().trim().toLowerCase();
    if (query) {
      list = list.filter((acc) => {
        const title = (acc.title || '').toLowerCase();
        const phone = (acc.phone || '').toLowerCase();
        const address = (acc.address || '').toLowerCase();
        const desc = (acc.description || '').toLowerCase();
        return (
          title.includes(query) ||
          phone.includes(query) ||
          address.includes(query) ||
          desc.includes(query)
        );
      });
    }
    return list;
  });

  readonly metrics = computed(() => {
    const list = this.accounts();
    const withPhone = list.filter((x) => !!x.phone?.trim()).length;
    const withAddress = list.filter((x) => !!x.address?.trim()).length;
    const withNotes = list.filter((x) => !!x.description?.trim()).length;

    return {
      total: list.length,
      withPhone,
      withAddress,
      withNotes,
    };
  });

  openCreateModal() {
    this.form.set({ ...DEFAULT_FORM });
    this.isEditing.set(false);
    this.editingId.set(null);
    this.errorMessage.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(acc: Account) {
    this.form.set({
      title: acc.title || '',
      phone: acc.phone || '',
      address: acc.address || '',
      description: acc.description || '',
      colorTheme: (acc as any).colorTheme || 'indigo',
    });
    this.isEditing.set(true);
    this.editingId.set(acc.id || null);
    this.errorMessage.set(null);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.errorMessage.set(null);
  }

  updateFormField<K extends keyof AccountFormData>(field: K, value: AccountFormData[K]) {
    this.form.update((prev) => ({ ...prev, [field]: value }));
  }

  async saveAccount() {
    if (this.isSaving()) return;
    const f = this.form();
    const title = f.title.trim();
    if (!title) {
      this.errorMessage.set('Lütfen cari ünvanını belirtiniz.');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    try {
      const payload: Partial<Account> & { colorTheme?: string } = {
        title,
        phone: f.phone.trim() || undefined,
        address: f.address.trim() || undefined,
        description: f.description.trim() || undefined,
        colorTheme: f.colorTheme,
      };

      if (this.isEditing() && this.editingId()) {
        await this.service.update(this.editingId()!, payload as any);
        this.alertService.toastSuccess(`"${title}" cari kartı güncellendi`);
      } else {
        await this.service.create(payload as any);
        this.alertService.toastSuccess(`"${title}" cari kartı eklendi`);
      }

      this.closeModal();
    } catch (err: any) {
      console.error('Cari kaydedilemedi:', err);
      this.errorMessage.set(err?.message || 'Kaydetme sırasında bir hata oluştu.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteAccount(acc: Account) {
    if (!acc.id) return;
    const confirmed = await this.alertService.confirmDelete(
      'Cari Kartı Sil',
      `"${acc.title}" carisini silmek istediğinize emin misiniz?`
    );
    if (!confirmed) return;

    try {
      await this.service.softDelete(acc.id);
      this.alertService.toastSuccess(`"${acc.title}" silindi`);
    } catch (err: any) {
      console.error('Silme hatası:', err);
      this.alertService.error('Silme Başarısız', err?.message || 'Silme işlemi gerçekleştirilemedi.');
    }
  }

  getThemeConfig(itemOrId?: Account | string) {
    const id = typeof itemOrId === 'string' ? itemOrId : (itemOrId as any)?.colorTheme;
    return this.colorThemes.find((t) => t.id === id) || this.colorThemes[0];
  }

  getInitials(title?: string): string {
    if (!title) return 'CR';
    const parts = title.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return title.slice(0, 2).toUpperCase();
  }
}
