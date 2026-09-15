import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { AnimalService } from '../../core/services/animal.service';
import { BreedService } from '../../core/services/definitions/breed.service';
import { HerdService } from '../../core/services/definitions/herd.service';
import { PaddockService } from '../../core/services/definitions/paddock.service';
import { AnimalTypeService } from '../../core/services/definitions/animal-type.service';
import { Animal, AnimalStatus, Breed, Herd, Paddock, AnimalType } from '../../core/models';
import { AlertService } from '../../core/services/alert.service';

import { Router } from '@angular/router';
import { SubscriptionService } from '../../core/services/subscription.service';

import { AnimalDetailModalComponent } from './animal-detail-modal/animal-detail-modal.component';
import { AnimalLocationModalComponent } from './animal-location-modal/animal-location-modal.component';

@Component({
  selector: 'app-animals',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatMenuModule,
    MatTooltipModule,
    MatRippleModule,
    AnimalDetailModalComponent,
    AnimalLocationModalComponent,
  ],
  templateUrl: './animals.component.html',
  styleUrl: './animals.component.scss',
})
export class AnimalsComponent {
  private animalService = inject(AnimalService);
  private alertService = inject(AlertService);
  private breedService = inject(BreedService);
  private herdService = inject(HerdService);
  private paddockService = inject(PaddockService);
  private animalTypeService = inject(AnimalTypeService);
  private subService = inject(SubscriptionService);
  private router = inject(Router);

  // Live signals
  animals = toSignal(this.animalService.list(), { initialValue: [] as Animal[] });
  breeds = toSignal(this.breedService.list(), { initialValue: [] as Breed[] });
  herds = toSignal(this.herdService.list(), { initialValue: [] as Herd[] });
  paddocks = toSignal(this.paddockService.list(), { initialValue: [] as Paddock[] });
  animalTypes = toSignal(this.animalTypeService.list(), { initialValue: [] as AnimalType[] });

  // Filter signals
  searchTerm = signal('');
  genderFilter = signal<string | null>(null);
  statusFilter = signal<AnimalStatus | null>(null);
  herdFilter = signal<string | null>(null);
  paddockFilter = signal<string | null>(null);
  breedFilter = signal<string | null>(null);
  viewMode = signal<'grid' | 'table'>('grid');

  // Computed summary metrics
  totalCount = computed(() => this.animals().length);
  activeCount = computed(() => this.animals().filter((a) => a.status === 'aktif').length);
  femaleCount = computed(() => this.animals().filter((a) => a.gender === 'disi').length);
  maleCount = computed(() => this.animals().filter((a) => a.gender === 'erkek').length);

  // Filtered animal list
  filteredAnimals = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const gFilter = this.genderFilter();
    const sFilter = this.statusFilter();
    const hFilter = this.herdFilter();
    const pFilter = this.paddockFilter();
    const bFilter = this.breedFilter();

    return this.animals().filter((a) => {
      if (gFilter && a.gender !== gFilter) return false;
      if (sFilter && a.status !== sFilter) return false;
      if (hFilter && a.herdId !== hFilter) return false;
      if (pFilter && a.paddockId !== pFilter) return false;
      if (bFilter && a.breedId !== bFilter) return false;

      if (!term) return true;
      return (
        a.farmTagNo?.toLowerCase().includes(term) ||
        a.nationalTagNo?.toLowerCase().includes(term) ||
        a.rfid?.toLowerCase().includes(term) ||
        a.name?.toLowerCase().includes(term) ||
        a.notes?.toLowerCase().includes(term)
      );
    });
  });

  // Drawer / Form State
  showDrawer = signal(false);
  isEditing = signal(false);
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);

  form = signal<Partial<Animal>>({
    farmTagNo: '',
    nationalTagNo: '',
    rfid: '',
    name: '',
    gender: 'disi',
    status: 'aktif',
    breedId: '',
    animalTypeId: '',
    herdId: '',
    paddockId: '',
    motherId: '',
    fatherId: '',
    birthDate: '',
    notes: '',
  });

  openAddForm() {
    if (!this.subService.canAddAnimal(this.animals().length)) {
      this.alertService.confirm(
        'Hayvan Kapasite Kotanız Doldu',
        `Mevcut paketiniz en fazla ${this.subService.animalLimit()} baş hayvana izin vermektedir. Çiftliğinize yeni hayvan eklemek için paketinizi yükseltebilirsiniz.`,
        'Paketi Yükselt',
        'Vazgeç'
      ).then((confirmed) => {
        if (confirmed) {
          this.router.navigate(['/abonelik']);
        }
      });
      return;
    }

    this.isEditing.set(false);
    this.errorMessage.set(null);
    this.form.set({
      farmTagNo: '',
      nationalTagNo: '',
      rfid: '',
      name: '',
      gender: 'disi',
      status: 'aktif',
      breedId: '',
      animalTypeId: '',
      herdId: '',
      paddockId: '',
      motherId: '',
      fatherId: '',
      birthDate: '',
      notes: '',
    });
    this.showDrawer.set(true);
  }

  openEditForm(animal: Animal) {
    this.isEditing.set(true);
    this.errorMessage.set(null);
    this.form.set({ ...animal });
    this.showDrawer.set(true);
  }

  closeDrawer() {
    this.showDrawer.set(false);
    this.errorMessage.set(null);
  }

  updateFormField<K extends keyof Animal>(field: K, value: any) {
    this.form.update((current) => ({ ...current, [field]: value }));
  }

  async saveAnimal() {
    const data = this.form();
    if (!data.farmTagNo?.trim()) {
      this.errorMessage.set('Lütfen çiftlik küpe numarasını giriniz.');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    try {
      if (this.isEditing() && data.id) {
        await this.animalService.update(data.id, data);
      } else {
        await this.animalService.create(data);
      }
      this.closeDrawer();
    } catch (err: any) {
      console.error('Save animal error:', err);
      this.errorMessage.set(err?.message || 'Hayvan kaydedilirken bir hata oluştu.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteAnimal(id: string) {
    const confirmed = await this.alertService.confirmDelete(
      'Hayvan Kaydını Sil',
      'Bu hayvan kaydını silmek istediğinize emin misiniz? (Geri Dönüşüm Merkezi\'nden kurtarılabilir)'
    );
    if (!confirmed) return;
    try {
      await this.animalService.softDelete(id);
      this.alertService.toastSuccess('Hayvan kaydı silindi');
    } catch (err: any) {
      this.alertService.error('Silme Başarısız', err?.message || 'Hayvan silinirken bir hata oluştu.');
    }
  }

  // Detail Modal State
  selectedAnimalForDetail = signal<Animal | null>(null);
  isDetailModalOpen = signal(false);

  // Location Modal State
  selectedAnimalForLocation = signal<Animal | null>(null);
  isLocationModalOpen = signal(false);

  openDetailModal(animal: Animal) {
    this.selectedAnimalForDetail.set(animal);
    this.isDetailModalOpen.set(true);
  }

  closeDetailModal() {
    this.isDetailModalOpen.set(false);
    this.selectedAnimalForDetail.set(null);
  }

  openLocationModal(animal: Animal) {
    this.selectedAnimalForLocation.set(animal);
    this.isLocationModalOpen.set(true);
  }

  closeLocationModal() {
    this.isLocationModalOpen.set(false);
    this.selectedAnimalForLocation.set(null);
  }

  onLocationUpdated() {
    // If detail modal is open for this animal, refresh the selected reference from live animals signal
    const cur = this.selectedAnimalForDetail();
    if (cur?.id) {
      const refreshed = this.animals().find((a) => a.id === cur.id);
      if (refreshed) {
        this.selectedAnimalForDetail.set(refreshed);
      }
    }
  }

  onSelectRelativeAnimal(relative: Animal) {
    this.selectedAnimalForDetail.set(relative);
  }

  async archiveAnimal(animal: Animal) {
    if (!animal.id) return;
    const isCurrentlyActive = animal.status === 'aktif';
    const actionLabel = isCurrentlyActive ? 'Arşivle (Pasife Al)' : 'Arşivden Çıkar (Aktif Yap)';
    const newStatus: AnimalStatus = isCurrentlyActive ? 'pasif' : 'aktif';

    const confirmed = await this.alertService.confirm(
      isCurrentlyActive ? 'Hayvanı Arşive Al' : 'Arşivden Çıkar',
      `${animal.farmTagNo} küpeli hayvanı ${isCurrentlyActive ? 'pasif duruma (arşive)' : 'tekrar aktif duruma'} getirmek istediğinize emin misiniz?`,
      actionLabel,
      'Vazgeç'
    );

    if (!confirmed) return;

    try {
      await this.animalService.update(animal.id, { status: newStatus });
      this.alertService.toastSuccess(
        isCurrentlyActive
          ? 'Hayvan arşive alındı (Pasif duruma geçti).'
          : 'Hayvan tekrar aktif duruma getirildi.'
      );
      if (this.selectedAnimalForDetail()?.id === animal.id) {
        this.selectedAnimalForDetail.update((curr) => curr ? ({ ...curr, status: newStatus }) : null);
      }
    } catch (err: any) {
      console.error('Archive animal error:', err);
      this.alertService.error('İşlem Başarısız', err?.message || 'Durum güncellenirken bir hata oluştu.');
    }
  }

  // Lookup helpers
  getBreedName(id?: string): string {
    if (!id) return '—';
    return this.breeds().find((b) => b.id === id)?.name || '—';
  }

  getHerdName(id?: string): string {
    if (!id) return '—';
    return this.herds().find((h) => h.id === id)?.name || '—';
  }

  getPaddockName(id?: string): string {
    if (!id) return '—';
    return this.paddocks().find((p) => p.id === id)?.name || '—';
  }

  getAnimalTypeName(id?: string): string {
    if (!id) return '—';
    return this.animalTypes().find((t) => t.id === id)?.name || '—';
  }
}
