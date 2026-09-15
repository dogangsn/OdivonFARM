import {
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  signal,
  computed,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';

import {
  Animal,
  Breed,
  Herd,
  Paddock,
  AnimalType,
  Treatment,
  WeightRecord,
  AnimalMovement,
  Disease,
  TreatmentType,
} from '../../../core/models';

import { TreatmentService } from '../../../core/services/treatment.service';
import { WeightRecordService } from '../../../core/services/weight-record.service';
import { AnimalMovementService } from '../../../core/services/animal-movement.service';
import { DiseaseService } from '../../../core/services/definitions/disease.service';
import { TreatmentTypeService } from '../../../core/services/definitions/treatment-type.service';

@Component({
  selector: 'app-animal-detail-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './animal-detail-modal.component.html',
  styleUrl: './animal-detail-modal.component.scss',
})
export class AnimalDetailModalComponent implements OnChanges, OnDestroy {
  @Input() isOpen = false;
  @Input() animal: Animal | null = null;
  @Input() allAnimals: Animal[] = [];
  @Input() breeds: Breed[] = [];
  @Input() herds: Herd[] = [];
  @Input() paddocks: Paddock[] = [];
  @Input() animalTypes: AnimalType[] = [];

  @Output() closed = new EventEmitter<void>();
  @Output() editRequested = new EventEmitter<Animal>();
  @Output() locationChangeRequested = new EventEmitter<Animal>();
  @Output() deathRequested = new EventEmitter<Animal>();
  @Output() selectAnimal = new EventEmitter<Animal>();

  private treatmentService = inject(TreatmentService);
  private weightRecordService = inject(WeightRecordService);
  private movementService = inject(AnimalMovementService);
  private diseaseService = inject(DiseaseService);
  private treatmentTypeService = inject(TreatmentTypeService);
  private destroyRef = inject(DestroyRef);

  activeTab = signal<'overview' | 'pedigree' | 'health' | 'weights' | 'movements'>('overview');

  // Internal reactive signals
  currentAnimal = signal<Animal | null>(null);
  allAnimalsList = signal<Animal[]>([]);
  breedsList = signal<Breed[]>([]);
  herdsList = signal<Herd[]>([]);
  paddocksList = signal<Paddock[]>([]);
  animalTypesList = signal<AnimalType[]>([]);

  private recordSub = new Subscription();

  // Loaded relations
  treatments = signal<Treatment[]>([]);
  weightRecords = signal<WeightRecord[]>([]);
  movements = signal<AnimalMovement[]>([]);
  diseases = signal<Disease[]>([]);
  treatmentTypes = signal<TreatmentType[]>([]);

  isLoadingData = signal(false);

  constructor() {
    this.diseaseService
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => this.diseases.set(res || []));

    this.treatmentTypeService
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => this.treatmentTypes.set(res || []));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['animal'] || changes['isOpen']) {
      this.currentAnimal.set(this.animal);
      if (changes['isOpen'] && this.isOpen) {
        this.activeTab.set('overview');
      }
      if (this.isOpen && this.animal?.id) {
        this.loadAnimalRecords(this.animal.id);
      }
    }
    if (changes['allAnimals']) {
      this.allAnimalsList.set(this.allAnimals || []);
    }
    if (changes['breeds']) {
      this.breedsList.set(this.breeds || []);
    }
    if (changes['herds']) {
      this.herdsList.set(this.herds || []);
    }
    if (changes['paddocks']) {
      this.paddocksList.set(this.paddocks || []);
    }
    if (changes['animalTypes']) {
      this.animalTypesList.set(this.animalTypes || []);
    }
  }

  ngOnDestroy(): void {
    this.recordSub.unsubscribe();
  }

  private loadAnimalRecords(animalId: string) {
    this.recordSub.unsubscribe();
    this.recordSub = new Subscription();

    this.isLoadingData.set(true);
    this.treatments.set([]);
    this.weightRecords.set([]);
    this.movements.set([]);

    // Treatments
    const sub1 = this.treatmentService.forAnimal(animalId).subscribe({
      next: (items) => {
        const sorted = [...(items || [])].sort((a, b) => {
          const dateA = this.parseDate(a.date)?.getTime() || 0;
          const dateB = this.parseDate(b.date)?.getTime() || 0;
          return dateB - dateA;
        });
        this.treatments.set(sorted);
      },
      error: (err) => console.error('Error loading treatments:', err),
    });
    this.recordSub.add(sub1);

    // Weight records
    const sub2 = this.weightRecordService.forAnimal(animalId).subscribe({
      next: (items) => {
        const sorted = [...(items || [])].sort((a, b) => {
          const dateA = this.parseDate(a.date)?.getTime() || 0;
          const dateB = this.parseDate(b.date)?.getTime() || 0;
          return dateB - dateA;
        });
        this.weightRecords.set(sorted);
      },
      error: (err) => console.error('Error loading weight records:', err),
    });
    this.recordSub.add(sub2);

    // Movements
    const sub3 = this.movementService.forAnimal(animalId).subscribe({
      next: (items) => {
        const sorted = [...(items || [])].sort((a, b) => {
          const dateA = this.parseDate(a.date)?.getTime() || 0;
          const dateB = this.parseDate(b.date)?.getTime() || 0;
          return dateB - dateA;
        });
        this.movements.set(sorted);
        this.isLoadingData.set(false);
      },
      error: (err) => {
        console.error('Error loading movements:', err);
        this.isLoadingData.set(false);
      },
    });
    this.recordSub.add(sub3);
  }

  // Lookups
  getBreedName(id?: string): string {
    if (!id) return '—';
    const list = this.breedsList().length > 0 ? this.breedsList() : this.breeds;
    return list.find((b) => b.id === id)?.name || '—';
  }

  getHerdName(id?: string): string {
    if (!id) return '—';
    const list = this.herdsList().length > 0 ? this.herdsList() : this.herds;
    return list.find((h) => h.id === id)?.name || '—';
  }

  getPaddockName(id?: string): string {
    if (!id) return '—';
    const list = this.paddocksList().length > 0 ? this.paddocksList() : this.paddocks;
    return list.find((p) => p.id === id)?.name || '—';
  }

  getAnimalTypeName(id?: string): string {
    if (!id) return '—';
    const list = this.animalTypesList().length > 0 ? this.animalTypesList() : this.animalTypes;
    return list.find((t) => t.id === id)?.name || '—';
  }

  getDiseaseName(id?: string): string {
    if (!id) return 'Genel Kontrol / Rutin';
    return this.diseases().find((d) => d.id === id)?.name || 'Hastalık Belirtilmedi';
  }

  getTreatmentTypeName(id?: string): string {
    if (!id) return 'Tedavi';
    return this.treatmentTypes().find((t) => t.id === id)?.name || 'Müdahale';
  }

  getMovementSubCategory(item: AnimalMovement): 'satis' | 'kesim' | 'olum' | 'diger' {
    if (!item) return 'diger';
    const note = (item.note || '').toLowerCase();
    if (note.includes('satış') || note.includes('satis') || item.toId === 'satis') return 'satis';
    if (note.includes('kesim') || item.toId === 'kesim') return 'kesim';
    if (note.includes('ölüm') || note.includes('olum') || item.toId === 'olum') return 'olum';
    return 'diger';
  }

  getMovementInfo(m: AnimalMovement): {
    title: string;
    description: string;
    bgClass: string;
    textClass: string;
    iconBgClass: string;
    iconColorClass: string;
    icon: string;
    badgeLabel: string;
    badgeBgClass: string;
    badgeTextClass: string;
  } {
    if (m.type === 'padok') {
      const from = this.getPaddockName(m.fromId);
      const to = this.getPaddockName(m.toId);
      return {
        title: `${from} ➔ ${to}`,
        description: m.note || 'Padok değişimi yapıldı',
        bgClass: 'bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-750',
        textClass: 'text-slate-800 dark:text-slate-200',
        iconBgClass: 'bg-indigo-50 dark:bg-indigo-950/50',
        iconColorClass: 'text-indigo-600 dark:text-indigo-400',
        icon: 'holiday_village',
        badgeLabel: 'Padok Değişimi',
        badgeBgClass: 'bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/50',
        badgeTextClass: 'text-indigo-700 dark:text-indigo-400',
      };
    }
    if (m.type === 'suru') {
      const from = this.getHerdName(m.fromId);
      const to = this.getHerdName(m.toId);
      return {
        title: `${from} ➔ ${to}`,
        description: m.note || 'Sürü transferi yapıldı',
        bgClass: 'bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-750',
        textClass: 'text-slate-800 dark:text-slate-200',
        iconBgClass: 'bg-purple-50 dark:bg-purple-950/50',
        iconColorClass: 'text-purple-600 dark:text-purple-400',
        icon: 'groups',
        badgeLabel: 'Sürü Transferi',
        badgeBgClass: 'bg-purple-50 dark:bg-purple-950/50 border border-purple-200/50',
        badgeTextClass: 'text-purple-700 dark:text-purple-400',
      };
    }
    if (m.type === 'ciftlik-giris') {
      return {
        title: 'Çiftliğe Giriş / Aktif Sürüye Dahil Edildi',
        description: m.note || 'Sürüye katılım sağlandı',
        bgClass: 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/40',
        textClass: 'text-emerald-900 dark:text-emerald-200',
        iconBgClass: 'bg-emerald-50 dark:bg-emerald-950/50',
        iconColorClass: 'text-emerald-600 dark:text-emerald-400',
        icon: 'login',
        badgeLabel: 'Çiftlik Girişi',
        badgeBgClass: 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/50',
        badgeTextClass: 'text-emerald-700 dark:text-emerald-400',
      };
    }
    // ciftlik-cikis
    const sub = this.getMovementSubCategory(m);
    if (sub === 'satis') {
      return {
        title: 'Satış ile Çiftlikten Ayrıldı',
        description: m.note || 'Satış kaydı tamamlandı.',
        bgClass: 'bg-teal-50/40 dark:bg-teal-950/20 border-teal-200/60 dark:border-teal-800/40',
        textClass: 'text-[#1d6361] dark:text-teal-200',
        iconBgClass: 'bg-teal-50 dark:bg-teal-950/50',
        iconColorClass: 'text-[#369a98] dark:text-teal-400',
        icon: 'point_of_sale',
        badgeLabel: 'Satış (Çıkış)',
        badgeBgClass: 'bg-teal-50 dark:bg-teal-950/50 border border-teal-200/50',
        badgeTextClass: 'text-[#2a7a78] dark:text-teal-400',
      };
    }
    if (sub === 'kesim') {
      return {
        title: 'Kesim Sebebiyle Çiftlikten Ayrıldı',
        description: m.note || 'Kesim / Mezbaha sevkiyatı yapıldı.',
        bgClass: 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-800/40',
        textClass: 'text-amber-900 dark:text-amber-200',
        iconBgClass: 'bg-amber-50 dark:bg-amber-950/50',
        iconColorClass: 'text-amber-600 dark:text-amber-400',
        icon: 'content_cut',
        badgeLabel: 'Kesim (Çıkış)',
        badgeBgClass: 'bg-amber-50 dark:bg-amber-950/50 border border-amber-200/50',
        badgeTextClass: 'text-amber-700 dark:text-amber-400',
      };
    }
    if (sub === 'olum') {
      return {
        title: 'Ölüm / Zayiat Sebebiyle Kayıt Kapatıldı',
        description: m.note || 'Hayvan vefat kaydı işlendi.',
        bgClass: 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-800/40',
        textClass: 'text-rose-900 dark:text-rose-200',
        iconBgClass: 'bg-rose-50 dark:bg-rose-950/50',
        iconColorClass: 'text-rose-600 dark:text-rose-400',
        icon: 'heart_broken',
        badgeLabel: 'Ölüm (Çıkış)',
        badgeBgClass: 'bg-rose-50 dark:bg-rose-950/50 border border-rose-200/50',
        badgeTextClass: 'text-rose-700 dark:text-rose-400',
      };
    }
    return {
      title: 'Çiftlik Çıkışı Yapıldı',
      description: m.note || 'Çiftlikten ayrılış kaydı',
      bgClass: 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-800/40',
      textClass: 'text-rose-900 dark:text-rose-200',
      iconBgClass: 'bg-rose-50 dark:bg-rose-950/50',
      iconColorClass: 'text-rose-600 dark:text-rose-400',
      icon: 'logout',
      badgeLabel: 'Çiftlik Çıkışı',
      badgeBgClass: 'bg-rose-50 dark:bg-rose-950/50 border border-rose-200/50',
      badgeTextClass: 'text-rose-700 dark:text-rose-400',
    };
  }

  // Lookups & Helpers
  isValidTag(val?: string | null): boolean {
    if (!val) return false;
    const s = val.trim();
    return (
      s !== '' &&
      s !== '—' &&
      s !== '-' &&
      s !== 'Belirtilmemiş' &&
      s !== 'Kayıtlı Değil' &&
      s !== 'Bilinmiyor' &&
      s !== 'null' &&
      s !== 'undefined'
    );
  }

  findAnimal(idOrTag?: string): Animal | null {
    if (!this.isValidTag(idOrTag)) return null;
    const clean = idOrTag!.trim().toLowerCase();
    const curr = this.currentAnimal();
    const all = this.allAnimalsList().length > 0 ? this.allAnimalsList() : this.allAnimals;
    return (
      all.find(
        (x) =>
          // Never match the current animal itself as its parent or ancestor!
          x.id !== curr?.id &&
          (!curr?.farmTagNo || x.farmTagNo?.toLowerCase() !== curr.farmTagNo.toLowerCase()) &&
          (x.id === idOrTag ||
            x.farmTagNo?.toLowerCase() === clean ||
            (x.nationalTagNo && x.nationalTagNo.toLowerCase() === clean))
      ) || null
    );
  }

  // Computed Family Tree Elements
  readonly mother = computed(() => {
    return this.findAnimal(this.currentAnimal()?.motherId);
  });

  readonly father = computed(() => {
    return this.findAnimal(this.currentAnimal()?.fatherId);
  });

  readonly hasMother = computed(() => {
    return !!this.mother() || this.isValidTag(this.currentAnimal()?.motherId);
  });

  readonly hasFather = computed(() => {
    return !!this.father() || this.isValidTag(this.currentAnimal()?.fatherId);
  });

  /** Hayvanın kayıtlı anne veya baba bilgisi var mı? */
  readonly hasAncestors = computed(() => {
    return this.hasMother() || this.hasFather();
  });

  // Mother's lineage (Anne Tarafı)
  readonly motherMother = computed(() => {
    const m = this.mother();
    return this.findAnimal(m?.motherId);
  });

  readonly motherFather = computed(() => {
    const m = this.mother();
    return this.findAnimal(m?.fatherId);
  });

  readonly hasMotherMother = computed(() => {
    return !!this.motherMother() || this.isValidTag(this.mother()?.motherId);
  });

  readonly hasMotherFather = computed(() => {
    return !!this.motherFather() || this.isValidTag(this.mother()?.fatherId);
  });

  readonly hasAnyMotherGrandparent = computed(() => {
    return this.hasMotherMother() || this.hasMotherFather();
  });

  // Father's lineage (Baba Tarafı)
  readonly fatherMother = computed(() => {
    const f = this.father();
    return this.findAnimal(f?.motherId);
  });

  readonly fatherFather = computed(() => {
    const f = this.father();
    return this.findAnimal(f?.fatherId);
  });

  readonly hasFatherMother = computed(() => {
    return !!this.fatherMother() || this.isValidTag(this.father()?.motherId);
  });

  readonly hasFatherFather = computed(() => {
    return !!this.fatherFather() || this.isValidTag(this.father()?.fatherId);
  });

  readonly hasAnyFatherGrandparent = computed(() => {
    return this.hasFatherMother() || this.hasFatherFather();
  });

  readonly hasAnyGrandparent = computed(() => {
    return this.hasAnyMotherGrandparent() || this.hasAnyFatherGrandparent();
  });

  readonly offspring = computed(() => {
    const a = this.currentAnimal();
    if (!a) return [];
    const all = this.allAnimalsList().length > 0 ? this.allAnimalsList() : this.allAnimals;
    return all.filter((child) => {
      if (child.id === a.id) return false;
      const isMom =
        child.motherId &&
        (child.motherId === a.id ||
          (a.farmTagNo && child.motherId.toLowerCase() === a.farmTagNo.toLowerCase()) ||
          (a.nationalTagNo && child.motherId.toLowerCase() === a.nationalTagNo.toLowerCase()));
      const isDad =
        child.fatherId &&
        (child.fatherId === a.id ||
          (a.farmTagNo && child.fatherId.toLowerCase() === a.farmTagNo.toLowerCase()) ||
          (a.nationalTagNo && child.fatherId.toLowerCase() === a.nationalTagNo.toLowerCase()));
      return isMom || isDad;
    });
  });

  // Pedigree Certificate Modal State
  isPedigreeCertOpen = signal(false);

  openPedigreeCertificate() {
    this.isPedigreeCertOpen.set(true);
  }

  closePedigreeCertificate() {
    this.isPedigreeCertOpen.set(false);
  }

  printPedigreeCertificate() {
    window.print();
  }

  getCertificateNo(): string {
    const year = new Date().getFullYear();
    const tag = (this.currentAnimal()?.farmTagNo || this.animal?.farmTagNo || '000').replace(/[^a-zA-Z0-9]/g, '');
    return `SEC-${year}-${tag}`;
  }

  getTodayFormatted(): string {
    return new Date().toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  // Analytics Metrics
  readonly ageText = computed(() => {
    const a = this.currentAnimal();
    const d = this.parseDate(a?.birthDate);
    if (!d) return 'Bilinmiyor';

    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    if (diffMs < 0) return 'Yeni Doğan';

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 30) return `${diffDays} Günlük`;

    const diffMonths = Math.floor(diffDays / 30.44);
    if (diffMonths < 24) return `${diffMonths} Aylık`;

    const years = Math.floor(diffMonths / 12);
    const remMonths = diffMonths % 12;
    return remMonths > 0 ? `${years} Yaş ${remMonths} Ay` : `${years} Yaşında`;
  });

  readonly latestWeight = computed(() => {
    const list = this.weightRecords();
    if (!list || list.length === 0) return null;
    return list[0]; // sorted descending
  });

  readonly initialWeight = computed(() => {
    const list = this.weightRecords();
    if (!list || list.length === 0) return null;
    return list[list.length - 1];
  });

  readonly totalWeightGain = computed(() => {
    const latest = this.latestWeight();
    const initial = this.initialWeight();
    if (!latest || !initial || latest === initial) return 0;
    return Number((latest.weightKg - initial.weightKg).toFixed(1));
  });

  readonly lastTreatment = computed(() => {
    const list = this.treatments();
    if (!list || list.length === 0) return null;
    return list[0];
  });

  readonly totalTreatmentCost = computed(() => {
    return this.treatments().reduce((sum, t) => sum + (Number(t.cost) || 0), 0);
  });

  // Helpers
  parseDate(val: any): Date | null {
    if (!val) return null;
    if (val instanceof Date) return val;
    if (typeof val?.toDate === 'function') return val.toDate();
    if (typeof val === 'string' || typeof val === 'number') {
      const parsed = new Date(val);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  }

  formatDate(val: any): string {
    const d = this.parseDate(val);
    if (!d) return '—';
    return d.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  formatDateTime(val: any): string {
    const d = this.parseDate(val);
    if (!d) return '—';
    return d.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  calculateWeightDiff(index: number): number | null {
    const list = this.weightRecords();
    if (index >= list.length - 1) return null;
    const current = list[index].weightKg;
    const previous = list[index + 1].weightKg;
    return Number((current - previous).toFixed(1));
  }

  getBreedingStatusLabel(status?: string): string {
    switch (status) {
      case 'damizlik': return 'Damızlık';
      case 'damizlik_adayi': return 'Damızlık Adayı';
      case 'damizlik_disi': return 'Damızlık Dışı';
      case 'besi': return 'Besi / Kasaplık';
      case 'belirtilmemis': return 'Belirtilmemiş';
      default: return status || '—';
    }
  }

  getAcquisitionMethodLabel(method?: string): string {
    switch (method) {
      case 'dogum': return 'Çiftlik Doğumu';
      case 'satin_alma': return 'Satın Alma';
      case 'hibe': return 'Hibe / Destek';
      case 'devir': return 'Devir / Transfer';
      case 'ithalat': return 'İthalat';
      case 'diger': return 'Diğer';
      default: return method || '—';
    }
  }

  close() {
    this.closed.emit();
  }

  onEdit() {
    if (this.animal) {
      this.editRequested.emit(this.animal);
    }
  }

  onLocationChange() {
    if (this.animal) {
      this.locationChangeRequested.emit(this.animal);
    }
  }

  onDeathClick() {
    if (this.animal) {
      this.deathRequested.emit(this.animal);
    }
  }

  navigateToAnimal(target: Animal | null) {
    if (target) {
      this.selectAnimal.emit(target);
    }
  }
}
