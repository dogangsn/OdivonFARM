import { Directive, computed, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { FirestoreCrudService } from '../../../core/services/firestore-crud.service';
import { BaseDoc } from '../../../core/models/base.model';
import { AlertService } from '../../../core/services/alert.service';
import { SeedService } from '../../../core/services/seed.service';
import { FarmContextService } from '../../../core/services/farm-context.service';

export interface NamedEntity extends BaseDoc {
  name: string;
  description?: string;
  colorTheme?: string;
}

export interface ColorTheme {
  id: string;
  label: string;
  bgClass: string;
  textClass: string;
  badgeClass: string;
}

export const COLOR_THEMES: ColorTheme[] = [
  {
    id: 'indigo',
    label: 'İndigo',
    bgClass: 'from-indigo-500 to-indigo-600',
    textClass: 'text-indigo-600 dark:text-indigo-400',
    badgeClass: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-800/40',
  },
  {
    id: 'emerald',
    label: 'Zümrüt',
    bgClass: 'from-emerald-500 to-emerald-600',
    textClass: 'text-emerald-600 dark:text-emerald-400',
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40',
  },
  {
    id: 'amber',
    label: 'Kehribar',
    bgClass: 'from-amber-500 to-amber-600',
    textClass: 'text-amber-600 dark:text-amber-400',
    badgeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40',
  },
  {
    id: 'rose',
    label: 'Gül Kurusu',
    bgClass: 'from-rose-500 to-rose-600',
    textClass: 'text-rose-600 dark:text-rose-400',
    badgeClass: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/40',
  },
  {
    id: 'purple',
    label: 'Mor',
    bgClass: 'from-purple-500 to-purple-600',
    textClass: 'text-purple-600 dark:text-purple-400',
    badgeClass: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200/60 dark:border-purple-800/40',
  },
  {
    id: 'sky',
    label: 'Gök Mavisi',
    bgClass: 'from-sky-500 to-sky-600',
    textClass: 'text-sky-600 dark:text-sky-400',
    badgeClass: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200/60 dark:border-sky-800/40',
  },
];

/**
 * "Tanımlamalar" altındaki tüm basit ve orta ölçekli varlıklar için ortak modern Grid ve Modal davranışı:
 * Hayvan Tipleri, Sürüler, Padoklar, Etiketler, Ölüm Nedenleri,
 * Tedavi Türleri, Hastalıklar, Depolar, Muhasebe Kalemleri vb.
 */
@Directive()
export abstract class SimpleCrudListBase<T extends NamedEntity> {
  abstract service: FirestoreCrudService<T>;
  abstract title: string;
  subtitle = 'Çiftlik operasyonlarında kullanılan sistem tanımlamaları';
  icon = 'tune';
  addLabel = 'Ekle';

  protected alertService = inject(AlertService);
  protected seedService = inject(SeedService);
  protected farmContext = inject(FarmContextService);

  // Geriye dönük uyumluluk için Observable
  items$: Observable<T[]> = of([]);

  // Veri ve filtre sinyalleri
  rawItems = signal<T[]>([]);
  loading = signal(true);
  searchTerm = signal('');
  viewMode = signal<'grid' | 'table'>('grid');

  // Modal Durum Sinyalleri
  isModalOpen = signal(false);
  isEditing = signal(false);
  editingId = signal<string | null>(null);
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);

  formName = signal('');
  formDescription = signal('');
  formColorTheme = signal('indigo');

  readonly colorThemes = COLOR_THEMES;

  // Arama sonucuna göre filtrelenmiş kayıtlar
  filteredItems = computed(() => {
    const list = this.rawItems();
    const query = this.searchTerm().trim().toLowerCase();
    if (!query) return list;
    return list.filter((item) => {
      const name = (item.name || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      return name.includes(query) || desc.includes(query);
    });
  });

  // Metrikler
  metrics = computed(() => {
    const all = this.rawItems();
    return {
      total: all.length,
      withDescription: all.filter((i) => !!i.description).length,
    };
  });

  /** Alt sınıf constructor'ında service atandıktan hemen sonra çağrılmalı */
  protected init() {
    this.loading.set(true);
    this.items$ = this.service.list();
    this.items$.subscribe({
      next: (list) => {
        this.rawItems.set(list || []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Veri yükleme hatası:', err);
        this.loading.set(false);
      },
    });
  }

  openCreateModal() {
    this.formName.set('');
    this.formDescription.set('');
    this.formColorTheme.set('indigo');
    this.isEditing.set(false);
    this.editingId.set(null);
    this.errorMessage.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(item: T) {
    this.formName.set(item.name || '');
    this.formDescription.set(item.description || '');
    this.formColorTheme.set(item.colorTheme || 'indigo');
    this.isEditing.set(true);
    this.editingId.set(item.id || null);
    this.errorMessage.set(null);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.errorMessage.set(null);
  }

  async save() {
    if (this.isSaving()) return;
    const name = this.formName().trim();
    if (!name) {
      this.errorMessage.set(`Lütfen ${this.title.toLowerCase()} adını belirtiniz.`);
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    try {
      const payload: Partial<T> = {
        name,
        description: this.formDescription().trim() || undefined,
        colorTheme: this.formColorTheme(),
      } as Partial<T>;

      if (this.isEditing() && this.editingId()) {
        await this.service.update(this.editingId()!, payload);
        this.alertService.toastSuccess(`"${name}" başarıyla güncellendi`);
      } else {
        await this.service.create(payload);
        this.alertService.toastSuccess(`"${name}" başarıyla eklendi`);
      }

      this.closeModal();
    } catch (err: any) {
      console.error('Kaydetme hatası:', err);
      this.errorMessage.set(err?.message || 'Kaydetme sırasında bir hata oluştu.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async remove(id: string, itemName?: string) {
    if (this.isSaving()) return;
    const displayName = itemName || this.title.toLowerCase();
    const confirmed = await this.alertService.confirmDelete(
      `${this.title} Sil`,
      `"${displayName}" kaydını silmek istediğinize emin misiniz?`
    );
    if (!confirmed) return;
    try {
      await this.service.softDelete(id);
      this.alertService.toastSuccess('Kayıt başarıyla silindi');
    } catch (err: any) {
      this.alertService.error('Silme Başarısız', err?.message || 'Silme işlemi sırasında hata oluştu.');
    }
  }

  getThemeConfig(themeId?: string): ColorTheme {
    return this.colorThemes.find((t) => t.id === themeId) || this.colorThemes[0];
  }

  getItemDescription(item: T): string {
    return (item as any)?.description || (item as any)?.location || (item as any)?.note || '';
  }

  getItemTheme(item: T): string {
    return (item as any)?.colorTheme || (item as any)?.color || 'indigo';
  }

  async loadDefaultDefinitions() {
    const farmId = this.farmContext.activeFarmId();
    if (!farmId) return;

    const confirmed = await this.alertService.confirm(
      'Varsayılanları Yükle',
      'Türkiye hayvancılık standartlarına uygun hazır tanımlar (Hayvan Tipleri, Irklar, Padoklar, Tedavi Türleri, Hastalıklar, Sürüler, Depolar, Stok Kategorileri, Muhasebe Kalemleri, Ölüm Nedenleri) çiftliğinize yüklenecektir. Eksik olanlar eklenecek, mükerrer kayıtlar otomatik ayıklanacaktır. Onaylıyor musunuz?',
      'Evet, Yükle',
      'Vazgeç'
    );
    if (!confirmed) return;

    const res = await this.seedService.seedFarmDefaults(farmId);
    if (res.success) {
      this.alertService.toastSuccess(
        res.totalSeeded > 0
          ? `${res.totalSeeded} adet yeni tanım çiftliğe yüklendi!`
          : 'Tüm varsayılan tanımlar zaten çiftliğinizde mevcut.'
      );
    } else {
      this.alertService.error('Hata', 'Varsayılan tanımlar yüklenirken bir sorun oluştu.');
    }
  }

  async cleanupDuplicates() {
    const farmId = this.farmContext.activeFarmId();
    if (!farmId) return;

    const res = await this.seedService.cleanDuplicates(farmId);
    if (res.success) {
      if (res.totalRemoved > 0) {
        this.alertService.toastSuccess(`${res.totalRemoved} adet mükerrer kayıt temizlendi!`);
      } else {
        this.alertService.toastSuccess('Mükerrer kayıt bulunamadı, tüm tanımlar tekil.');
      }
    } else {
      this.alertService.error('Hata', 'Mükerrer kayıtlar temizlenirken bir sorun oluştu.');
    }
  }
}
