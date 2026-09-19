import { Component, computed, inject, signal, HostListener } from '@angular/core';
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
import { AnimalMovementService } from '../../core/services/animal-movement.service';
import { BreedService } from '../../core/services/definitions/breed.service';
import { HerdService } from '../../core/services/definitions/herd.service';
import { PaddockService } from '../../core/services/definitions/paddock.service';
import { AnimalTypeService } from '../../core/services/definitions/animal-type.service';
import { Animal, AnimalStatus, Breed, Herd, Paddock, AnimalType } from '../../core/models';
import { AlertService } from '../../core/services/alert.service';

import { ActivatedRoute, Router } from '@angular/router';
import { SubscriptionService } from '../../core/services/subscription.service';
import { TagScannerService } from '../../core/services/tag-scanner.service';

import { AnimalDetailModalComponent } from './animal-detail-modal/animal-detail-modal.component';
import { AnimalLocationModalComponent } from './animal-location-modal/animal-location-modal.component';
import { AnimalDeathModalComponent } from './animal-death-modal/animal-death-modal.component';

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
    AnimalDeathModalComponent,
  ],
  templateUrl: './animals.component.html',
  styleUrl: './animals.component.scss',
})
export class AnimalsComponent {
  private animalService = inject(AnimalService);
  private movementService = inject(AnimalMovementService);
  private alertService = inject(AlertService);
  private breedService = inject(BreedService);
  private herdService = inject(HerdService);
  private paddockService = inject(PaddockService);
  private animalTypeService = inject(AnimalTypeService);
  private subService = inject(SubscriptionService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  tagScanner = inject(TagScannerService);

  // Live signals
  loading = signal(true);
  animals = toSignal(this.animalService.list(), { initialValue: [] as Animal[] });
  breeds = toSignal(this.breedService.list(), { initialValue: [] as Breed[] });
  herds = toSignal(this.herdService.list(), { initialValue: [] as Herd[] });
  paddocks = toSignal(this.paddockService.list(), { initialValue: [] as Paddock[] });
  animalTypes = toSignal(this.animalTypeService.list(), { initialValue: [] as AnimalType[] });

  constructor() {
    this.animalService.list().subscribe({
      next: (list) => {
        this.loading.set(false);
        this.checkQueryParamTag(list);
      },
      error: () => this.loading.set(false),
    });

    this.route.queryParams.subscribe((params) => {
      const tag = params['tag'];
      if (tag) {
        this.searchTerm.set(tag);
        this.checkQueryParamTag(this.animals());
      }
    });
  }

  private checkQueryParamTag(list: Animal[]) {
    const currentSearch = this.searchTerm();
    if (!currentSearch || list.length === 0) return;
    const match = list.find(
      (a) =>
        String(a.farmTagNo || '') === currentSearch ||
        String(a.nationalTagNo || '') === currentSearch ||
        a.id === currentSearch
    );
    if (match) {
      this.openDetailModal(match);
    }
  }

  openTagScanner() {
    this.tagScanner.openScanner((animal) => {
      this.searchTerm.set(animal.farmTagNo || animal.nationalTagNo || '');
      this.openDetailModal(animal);
    });
  }

  // Filter signals - initialized with '' so dropdowns select 'Tüm ...' instead of appearing blank
  searchTerm = signal('');
  genderFilter = signal<string>('');
  statusFilter = signal<string>('');
  animalTypeFilter = signal<string>('');
  herdFilter = signal<string>('');
  paddockFilter = signal<string>('');
  breedFilter = signal<string>('');
  viewMode = signal<'grid' | 'table'>('grid');

  /**
   * Belirtilen hayvan tipine uygun ırkları filtreler.
   * animalTypeId boş veya eşleşme yoksa güvenli şekilde filtreleme yapar.
   */
  filterBreedsByType(allBreeds: Breed[], animalTypeId: string): Breed[] {
    if (!animalTypeId) return allBreeds;

    const selectedType = this.animalTypes().find((t) => t.id === animalTypeId);
    if (!selectedType) return allBreeds;

    const typeName = (selectedType.name || '').trim().toLowerCase();

    const isSheep = typeName.includes('koyun') || typeName.includes('koç') || typeName.includes('kuzu');
    const isGoat = typeName.includes('keçi') || typeName.includes('teke') || typeName.includes('oğlak');
    const isCattle = typeName.includes('inek') || typeName.includes('boğa') || typeName.includes('düve') ||
                     typeName.includes('dana') || typeName.includes('buzağı') || typeName.includes('sığır');
    const isBuffalo = typeName.includes('manda');
    const isPoultry = typeName.includes('tavuk') || typeName.includes('hindi') || typeName.includes('kaz') || typeName.includes('ördek');

    const result = allBreeds.filter((breed) => {
      // 1. Doğrudan animalTypeId bağlantısı
      if (breed.animalTypeId && breed.animalTypeId === animalTypeId) {
        return true;
      }

      const breedName = (breed.name || '').toLowerCase();
      const breedDesc = (breed.description || '').toLowerCase();
      const category = (breed.category || '').toLowerCase();

      // Koyun kontrolü
      if (isSheep) {
        const hasGoatWord = breedName.includes('keçi') || breedDesc.includes('keçi') || breedDesc.includes('teke');
        if (hasGoatWord) return false;
        return category === 'kucukbas' || category === '' || breedName.includes('koyun') || breedDesc.includes('koyun');
      }

      // Keçi kontrolü
      if (isGoat) {
        return breedName.includes('keçi') || breedDesc.includes('keçi') || breedDesc.includes('teke');
      }

      // Büyükbaş / Sığır kontrolü
      if (isCattle) {
        const isManda = breedName.includes('manda') || breedDesc.includes('manda');
        if (isManda) return false;
        return category === 'buyukbas' || category === '' || breedName.includes('sığır') || breedDesc.includes('sığır');
      }

      // Manda kontrolü
      if (isBuffalo) {
        return breedName.includes('manda') || breedDesc.includes('manda');
      }

      // Kanatlı kontrolü
      if (isPoultry) {
        return category === 'kanatli' || breedName.includes('tavuk') || breedDesc.includes('tavuk');
      }

      // Genel kategori eşleşmesi (kucukbas / buyukbas)
      if (category) {
        if (category === 'kucukbas' && (isSheep || isGoat)) return true;
        if (category === 'buyukbas' && (isCattle || isBuffalo)) return true;
      }

      return false;
    });

    // Eğer filtre sonucunda hiçbir ırk bulunamazsa, kullanıcının seçimsiz kalmaması için tüm ırkları geri döndür
    return result.length > 0 ? result : allBreeds;
  }

  // Form (Drawer) için hayvan tipine göre dinamik filtrelenen ırklar
  filteredFormBreeds = computed(() => {
    return this.filterBreedsByType(this.breeds(), this.form().animalTypeId || '');
  });

  // Liste ekranı üst filtre çubuğu için hayvan tipine göre dinamik filtrelenen ırklar
  filteredFilterBreeds = computed(() => {
    return this.filterBreedsByType(this.breeds(), this.animalTypeFilter() || '');
  });

  // Hayvan tipi formda değiştiğinde ırkı filtreler, geçersiz kalan ırkı sıfırlar
  onAnimalTypeChange(typeId: string) {
    this.updateFormField('animalTypeId', typeId);
    const available = this.filterBreedsByType(this.breeds(), typeId);
    const currentBreedId = this.form().breedId;
    if (currentBreedId && !available.some((b) => b.id === currentBreedId)) {
      this.updateFormField('breedId', '');
    }
  }

  // Hayvan tipi üst filtrede değiştiğinde ırk filtresini günceller
  onAnimalTypeFilterChange(typeId: string) {
    this.animalTypeFilter.set(typeId);
    if (this.breedFilter()) {
      const allowedBreeds = this.filterBreedsByType(this.breeds(), typeId);
      if (!allowedBreeds.some((b) => b.id === this.breedFilter())) {
        this.breedFilter.set('');
      }
    }
  }

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
    const tFilter = this.animalTypeFilter();
    const hFilter = this.herdFilter();
    const pFilter = this.paddockFilter();
    const bFilter = this.breedFilter();

    return this.animals().filter((a) => {
      if (gFilter && a.gender !== gFilter) return false;
      if (sFilter && a.status !== sFilter) return false;
      if (tFilter && a.animalTypeId !== tFilter) return false;
      if (hFilter && a.herdId !== hFilter) return false;
      if (pFilter && a.paddockId !== pFilter) return false;
      if (bFilter && a.breedId !== bFilter) return false;

      if (!term) return true;
      return (
        a.farmTagNo?.toLowerCase().includes(term) ||
        a.nationalTagNo?.toLowerCase().includes(term) ||
        a.nationalTagColor?.toLowerCase().includes(term) ||
        a.rfid?.toLowerCase().includes(term) ||
        a.name?.toLowerCase().includes(term) ||
        a.notes?.toLowerCase().includes(term) ||
        a.description?.toLowerCase().includes(term)
      );
    });
  });

  // Drawer / Form State
  showDrawer = signal(false);
  isEditing = signal(false);
  isSaving = signal(false);
  isDirty = signal(false);
  errorMessage = signal<string | null>(null);

  form = signal<Partial<Animal>>({
    farmTagNo: '',
    nationalTagNo: '',
    nationalTagColor: 'Sarı',
    rfid: '',
    name: '',
    gender: 'disi',
    birthDate: new Date().toISOString().substring(0, 10),
    status: 'aktif',
    breedingStatus: 'damizlik',
    breedingScore: null,
    acquisitionDate: new Date().toISOString().substring(0, 10),
    acquisitionMethod: 'dogum',
    breedId: '',
    animalTypeId: '',
    herdId: '',
    paddockId: '',
    motherId: '',
    fatherId: '',
    notes: '',
  });

  private initialSnapshot = '';

  markDirty() {
    this.isDirty.set(true);
  }

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (this.showDrawer()) {
      this.requestCloseDrawer();
    }
  }

  formatDateForInput(val: any): string {
    if (!val) return '';
    if (typeof val === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
      if (val.length >= 10 && val[4] === '-' && val[7] === '-') {
        return val.substring(0, 10);
      }
    }
    const d = typeof val?.toDate === 'function' ? val.toDate() : new Date(val);
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

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
    this.isDirty.set(false);
    const today = new Date().toISOString().substring(0, 10);
    const initialData: Partial<Animal> = {
      farmTagNo: '',
      nationalTagNo: '',
      nationalTagColor: 'Sarı',
      rfid: '',
      name: '',
      gender: 'disi',
      birthDate: today,
      status: 'aktif',
      breedingStatus: 'damizlik',
      breedingScore: null,
      acquisitionDate: today,
      acquisitionMethod: 'dogum',
      breedId: '',
      animalTypeId: '',
      herdId: '',
      paddockId: '',
      motherId: '',
      fatherId: '',
      notes: '',
    };
    this.form.set(initialData);
    this.initialSnapshot = JSON.stringify(initialData);
    this.showDrawer.set(true);
  }

  openEditForm(animal: Animal) {
    this.isEditing.set(true);
    this.errorMessage.set(null);
    this.isDirty.set(false);
    const editData: Partial<Animal> = {
      ...animal,
      nationalTagColor: animal.nationalTagColor || '',
      breedingStatus: animal.breedingStatus || 'damizlik',
      breedingScore: animal.breedingScore != null ? animal.breedingScore : null,
      acquisitionMethod: animal.acquisitionMethod || 'dogum',
      birthDate: this.formatDateForInput(animal.birthDate),
      acquisitionDate: this.formatDateForInput(animal.acquisitionDate),
      notes: animal.notes || animal.description || '',
    };
    this.form.set(editData);
    this.initialSnapshot = JSON.stringify(editData);
    this.showDrawer.set(true);
  }

  hasUnsavedChanges(): boolean {
    if (!this.showDrawer()) return false;
    if (this.isDirty()) return true;

    const current = JSON.stringify(this.form());
    if (this.initialSnapshot && current !== this.initialSnapshot) {
      return true;
    }

    const f = this.form();
    if (!this.isEditing()) {
      return !!(
        f.farmTagNo?.trim() ||
        f.nationalTagNo?.trim() ||
        f.rfid?.trim() ||
        f.name?.trim() ||
        f.notes?.trim() ||
        f.motherId?.trim() ||
        f.fatherId?.trim() ||
        f.breedId ||
        f.animalTypeId ||
        f.herdId ||
        f.paddockId ||
        f.breedingScore != null ||
        (f.nationalTagColor && f.nationalTagColor !== 'Sarı') ||
        (f.gender && f.gender !== 'disi') ||
        (f.acquisitionMethod && f.acquisitionMethod !== 'dogum') ||
        (f.breedingStatus && f.breedingStatus !== 'damizlik')
      );
    }

    return false;
  }

  async requestCloseDrawer() {
    if (this.hasUnsavedChanges()) {
      const confirmed = await this.alertService.confirm(
        'Kaydetmeden Çıkış',
        'Girdiğiniz bilgiler henüz kaydedilmedi. Çıkmak istediğinizden emin misiniz?',
        'Evet, Çık',
        'Vazgeç'
      );
      if (!confirmed) {
        return;
      }
    }
    this.closeDrawer();
  }

  closeDrawer() {
    this.showDrawer.set(false);
    this.isDirty.set(false);
    this.errorMessage.set(null);
  }

  updateFormField<K extends keyof Animal>(field: K, value: any) {
    this.isDirty.set(true);
    this.form.update((current) => ({ ...current, [field]: value }));
  }

  async saveAnimal() {
    if (this.isSaving()) return;
    const data = { ...this.form() };
    if (!data.farmTagNo?.trim()) {
      this.errorMessage.set('Lütfen çiftlik küpe numarasını giriniz.');
      return;
    }

    if (data.breedingScore !== undefined && data.breedingScore !== null && (data.breedingScore as any) !== '') {
      data.breedingScore = Number(data.breedingScore);
    } else {
      data.breedingScore = null;
    }

    if (data.notes) {
      data.description = data.notes;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    try {
      if (this.isEditing() && data.id) {
        await this.animalService.update(data.id, data);
        this.alertService.toastSuccess('Hayvan bilgileri güncellendi');
        if (this.selectedAnimalForDetail()?.id === data.id) {
          this.selectedAnimalForDetail.set({ ...this.selectedAnimalForDetail()!, ...data } as Animal);
        }
      } else {
        await this.animalService.create(data);
        this.alertService.toastSuccess('Yeni hayvan başarıyla eklendi');
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
    this.selectedAnimalForDetail.set({ ...animal });
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

  // Death / Slaughter / Sale Modal State
  selectedAnimalForDeath = signal<Animal | null>(null);
  initialDeathModalTab = signal<'olum' | 'kesim' | 'satis'>('olum');
  isDeathModalOpen = signal(false);

  openDeathModal(animal: Animal, tab: 'olum' | 'kesim' | 'satis' = 'olum') {
    this.selectedAnimalForDeath.set({ ...animal });
    const computedTab =
      animal.status === 'satildi'
        ? 'satis'
        : animal.status === 'kesildi'
        ? 'kesim'
        : animal.status === 'oldu'
        ? 'olum'
        : tab;
    this.initialDeathModalTab.set(computedTab);
    this.isDeathModalOpen.set(true);
  }

  closeDeathModal() {
    this.isDeathModalOpen.set(false);
    this.selectedAnimalForDeath.set(null);
  }

  onDeathRecorded() {
    const cur = this.selectedAnimalForDetail();
    if (cur?.id) {
      const refreshed = this.animals().find((a) => a.id === cur.id);
      if (refreshed) {
        this.selectedAnimalForDetail.set(refreshed);
      }
    }
  }

  async revertDeathStatus(animal: Animal) {
    if (!animal.id) return;
    const isSale = animal.status === 'satildi';
    const isSlaughter = animal.status === 'kesildi';
    const title = isSale ? 'Satış Kaydını Geri Al' : isSlaughter ? 'Kesim Kaydını Geri Al' : 'Ölüm Kaydını Geri Al';
    const msg = `${animal.farmTagNo} küpeli hayvanın ${isSale ? 'satış' : isSlaughter ? 'kesim' : 'ölüm'} kaydını iptal edip tekrar 'Aktif' duruma getirmek istediğinize emin misiniz?`;

    const confirmed = await this.alertService.confirm(
      title,
      msg,
      'Evet, Aktif Yap',
      'Vazgeç'
    );
    if (!confirmed) return;

    try {
      await this.animalService.update(animal.id, {
        status: 'aktif',
        deathDate: null,
        deathReason: null,
        deathExpertStatus: null,
        deathNotes: null,
        deathInfo: null,
        slaughterDate: null,
        slaughterMeatKg: null,
        slaughterHeadCount: null,
        slaughterLiverCount: null,
        slaughterSkinCount: null,
        slaughterExpertStatus: null,
        slaughterNotes: null,
        slaughterInfo: null,
        saleDate: null,
        salePrice: null,
        saleWeightKg: null,
        saleAccountId: null,
        saleAccountTitle: null,
        saleInfo: null,
      });

      try {
        await this.movementService.create({
          animalId: animal.id,
          type: 'ciftlik-giris',
          toId: animal.paddockId || undefined,
          date: new Date().toISOString().substring(0, 10),
          note: `${isSale ? 'Satış' : isSlaughter ? 'Kesim' : 'Ölüm'} kaydı iptal edildi, hayvan tekrar aktif sürüye dahil edildi.`,
        } as any);
      } catch (mErr) {
        console.warn('Movement revert log warning:', mErr);
      }

      this.alertService.toastSuccess(`${isSale ? 'Satış' : isSlaughter ? 'Kesim' : 'Ölüm'} kaydı iptal edildi, hayvan tekrar aktif duruma getirildi.`);
      if (this.selectedAnimalForDetail()?.id === animal.id) {
        this.selectedAnimalForDetail.update((curr) =>
          curr ? ({
            ...curr,
            status: 'aktif',
            deathDate: null,
            deathReason: null,
            deathExpertStatus: null,
            deathNotes: null,
            deathInfo: null,
            slaughterDate: null,
            slaughterMeatKg: null,
            slaughterHeadCount: null,
            slaughterLiverCount: null,
            slaughterSkinCount: null,
            slaughterExpertStatus: null,
            slaughterNotes: null,
            slaughterInfo: null,
            saleDate: null,
            salePrice: null,
            saleWeightKg: null,
            saleAccountId: null,
            saleAccountTitle: null,
            saleInfo: null,
          } as Animal) : null
        );
      }
    } catch (err: any) {
      console.error('Revert status error:', err);
      this.alertService.error('İşlem Başarısız', err?.message || 'Durum güncellenirken bir hata oluştu.');
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
