import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { toSignal } from '@angular/core/rxjs-interop';

import { Breed, Animal, AnimalType } from '../../../core/models/animal.model';
import { BreedService } from '../../../core/services/definitions/breed.service';
import { AnimalService } from '../../../core/services/animal.service';
import { AnimalTypeService } from '../../../core/services/definitions/animal-type.service';
import { AlertService } from '../../../core/services/alert.service';

export interface BreedFormData {
  name: string;
  category: 'kucukbas' | 'buyukbas' | 'kanatli' | 'diger';
  animalTypeId: string;
  purpose: 'et' | 'sut' | 'kombine' | 'damizlik' | 'yontem' | 'diger';
  origin: string;
  description: string;
  colorTheme: string;
}

const DEFAULT_FORM: BreedFormData = {
  name: '',
  category: 'kucukbas',
  animalTypeId: '',
  purpose: 'kombine',
  origin: '',
  description: '',
  colorTheme: 'indigo',
};

@Component({
  selector: 'app-breeds',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './breeds.component.html',
  styleUrls: ['./breeds.component.scss'],
})
export class BreedsComponent {
  private breedService = inject(BreedService);
  private animalService = inject(AnimalService);
  private animalTypeService = inject(AnimalTypeService);
  private alertService = inject(AlertService);

  // Data streams
  readonly breeds = toSignal(this.breedService.list(), { initialValue: [] as Breed[] });
  readonly animals = toSignal(this.animalService.list(), { initialValue: [] as Animal[] });
  readonly animalTypes = toSignal(this.animalTypeService.list(), { initialValue: [] as AnimalType[] });

  // Filters & State
  readonly searchTerm = signal('');
  readonly categoryFilter = signal<'all' | 'kucukbas' | 'buyukbas' | 'kanatli' | 'diger'>('all');
  readonly viewMode = signal<'grid' | 'table'>('grid');

  readonly categories: readonly ('kucukbas' | 'buyukbas' | 'kanatli' | 'diger')[] = [
    'kucukbas',
    'buyukbas',
    'kanatli',
    'diger',
  ];

  setCategory(category: BreedFormData['category']) {
    this.updateFormField('category', category);
  }

  // Modal State
  readonly isModalOpen = signal(false);
  readonly isEditing = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = signal<BreedFormData>({ ...DEFAULT_FORM });

  // Color Themes
  readonly colorThemes = [
    { id: 'indigo', label: 'İndigo', bgClass: 'from-indigo-500 to-indigo-600', textClass: 'text-indigo-600 dark:text-indigo-400', badgeClass: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-800/40' },
    { id: 'emerald', label: 'Zümrüt', bgClass: 'from-emerald-500 to-emerald-600', textClass: 'text-emerald-600 dark:text-emerald-400', badgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40' },
    { id: 'amber', label: 'Kehribar', bgClass: 'from-amber-500 to-amber-600', textClass: 'text-amber-600 dark:text-amber-400', badgeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40' },
    { id: 'rose', label: 'Gül Kurusu', bgClass: 'from-rose-500 to-rose-600', textClass: 'text-rose-600 dark:text-rose-400', badgeClass: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/40' },
    { id: 'purple', label: 'Mor', bgClass: 'from-purple-500 to-purple-600', textClass: 'text-purple-600 dark:text-purple-400', badgeClass: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200/60 dark:border-purple-800/40' },
    { id: 'sky', label: 'Gök Mavisi', bgClass: 'from-sky-500 to-sky-600', textClass: 'text-sky-600 dark:text-sky-400', badgeClass: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200/60 dark:border-sky-800/40' },
  ];

  // Map: Breed ID -> Animal Count
  readonly animalCountMap = computed(() => {
    const map = new Map<string, number>();
    for (const animal of this.animals()) {
      if (animal.breedId) {
        map.set(animal.breedId, (map.get(animal.breedId) || 0) + 1);
      }
    }
    return map;
  });

  // Map: AnimalType ID -> AnimalType Name
  readonly animalTypeMap = computed(() => {
    const map = new Map<string, string>();
    for (const t of this.animalTypes()) {
      if (t.id) map.set(t.id, t.name);
    }
    return map;
  });

  // Filtered Breeds
  readonly filteredBreeds = computed(() => {
    let list = this.breeds();
    const cat = this.categoryFilter();
    const query = this.searchTerm().trim().toLowerCase();

    if (cat !== 'all') {
      list = list.filter((b) => (b.category || 'kucukbas') === cat);
    }

    if (query) {
      list = list.filter((b) => {
        const name = (b.name || '').toLowerCase();
        const desc = (b.description || '').toLowerCase();
        const origin = (b.origin || '').toLowerCase();
        const purpose = (b.purpose || '').toLowerCase();
        return (
          name.includes(query) ||
          desc.includes(query) ||
          origin.includes(query) ||
          purpose.includes(query)
        );
      });
    }

    return list;
  });

  // Statistics & Metrics
  readonly metrics = computed(() => {
    const all = this.breeds();
    const animalCountMap = this.animalCountMap();
    let totalAssignedAnimals = 0;

    let kucukbas = 0;
    let buyukbas = 0;

    for (const b of all) {
      const cat = b.category || 'kucukbas';
      if (cat === 'kucukbas') kucukbas++;
      else if (cat === 'buyukbas') buyukbas++;

      if (b.id) {
        totalAssignedAnimals += animalCountMap.get(b.id) || 0;
      }
    }

    return {
      totalBreeds: all.length,
      totalAnimals: totalAssignedAnimals,
      kucukbasCount: kucukbas,
      buyukbasCount: buyukbas,
    };
  });

  // Modal Handlers
  openCreateModal() {
    this.form.set({ ...DEFAULT_FORM });
    this.isEditing.set(false);
    this.editingId.set(null);
    this.errorMessage.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(breed: Breed) {
    this.form.set({
      name: breed.name || '',
      category: (breed.category as any) || 'kucukbas',
      animalTypeId: breed.animalTypeId || '',
      purpose: (breed.purpose as any) || 'kombine',
      origin: breed.origin || '',
      description: breed.description || '',
      colorTheme: breed.colorTheme || 'indigo',
    });
    this.isEditing.set(true);
    this.editingId.set(breed.id || null);
    this.errorMessage.set(null);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.errorMessage.set(null);
  }

  updateFormField<K extends keyof BreedFormData>(field: K, value: BreedFormData[K]) {
    this.form.update((prev) => ({ ...prev, [field]: value }));
  }

  async saveBreed() {
    const f = this.form();
    const name = f.name.trim();

    if (!name) {
      this.errorMessage.set('Lütfen ırk adını belirtiniz.');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    try {
      const payload: Partial<Breed> = {
        name,
        category: f.category,
        animalTypeId: f.animalTypeId || undefined,
        purpose: f.purpose,
        origin: f.origin.trim() || undefined,
        description: f.description.trim() || undefined,
        colorTheme: f.colorTheme,
      };

      if (this.isEditing() && this.editingId()) {
        await this.breedService.update(this.editingId()!, payload);
        this.alertService.toastSuccess(`"${name}" ırkı başarıyla güncellendi`);
      } else {
        await this.breedService.create(payload as any);
        this.alertService.toastSuccess(`"${name}" ırkı başarıyla eklendi`);
      }

      this.closeModal();
    } catch (err: any) {
      console.error('Irk kaydedilemedi:', err);
      this.errorMessage.set(err?.message || 'Kaydetme sırasında bir hata oluştu.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteBreed(breed: Breed) {
    if (!breed.id) return;

    const count = this.animalCountMap().get(breed.id) || 0;
    const warningText =
      count > 0
        ? `Bu ırka kayıtlı ${count} adet hayvan bulunmaktadır. Silmek istediğinize emin misiniz?`
        : `"${breed.name}" ırkını silmek istediğinize emin misiniz?`;

    const confirmed = await this.alertService.confirmDelete('Irkı Sil', warningText);
    if (!confirmed) return;

    try {
      await this.breedService.softDelete(breed.id);
      this.alertService.toastSuccess(`"${breed.name}" ırkı silindi`);
    } catch (err: any) {
      console.error('Silme hatası:', err);
      this.alertService.error('Silme Başarısız', err?.message || 'Silme işlemi gerçekleştirilemedi.');
    }
  }

  // Helpers
  getAnimalCount(breedId?: string): number {
    return breedId ? this.animalCountMap().get(breedId) || 0 : 0;
  }

  getThemeConfig(themeId?: string) {
    return this.colorThemes.find((t) => t.id === themeId) || this.colorThemes[0];
  }

  getCategoryLabel(category?: string): string {
    switch (category) {
      case 'kucukbas':
        return 'Küçükbaş';
      case 'buyukbas':
        return 'Büyükbaş';
      case 'kanatli':
        return 'Kanatlı';
      case 'diger':
        return 'Diğer';
      default:
        return 'Küçükbaş';
    }
  }

  getPurposeLabel(purpose?: string): string {
    switch (purpose) {
      case 'et':
        return 'Etçi';
      case 'sut':
        return 'Sütçü';
      case 'kombine':
        return 'Kombine (Et & Süt)';
      case 'damizlik':
        return 'Damızlık';
      case 'yontem':
        return 'Yapağı / Yün';
      default:
        return 'Kombine';
    }
  }
}
