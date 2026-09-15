import {
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  signal,
  computed,
  OnChanges,
  SimpleChanges,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
export class AnimalDetailModalComponent implements OnChanges {
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
  @Output() selectAnimal = new EventEmitter<Animal>();

  private treatmentService = inject(TreatmentService);
  private weightRecordService = inject(WeightRecordService);
  private movementService = inject(AnimalMovementService);
  private diseaseService = inject(DiseaseService);
  private treatmentTypeService = inject(TreatmentTypeService);
  private destroyRef = inject(DestroyRef);

  activeTab = signal<'overview' | 'pedigree' | 'health' | 'weights' | 'movements'>('overview');

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
    if (changes['animal'] && this.animal?.id) {
      this.loadAnimalRecords(this.animal.id);
    }
  }

  private loadAnimalRecords(animalId: string) {
    this.isLoadingData.set(true);

    // Treatments
    this.treatmentService
      .forAnimal(animalId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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

    // Weight records
    this.weightRecordService
      .forAnimal(animalId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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

    // Movements
    this.movementService
      .forAnimal(animalId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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
  }

  // Lookups
  getBreedName(id?: string): string {
    if (!id) return '—';
    return this.breeds.find((b) => b.id === id)?.name || '—';
  }

  getHerdName(id?: string): string {
    if (!id) return '—';
    return this.herds.find((h) => h.id === id)?.name || '—';
  }

  getPaddockName(id?: string): string {
    if (!id) return '—';
    return this.paddocks.find((p) => p.id === id)?.name || '—';
  }

  getAnimalTypeName(id?: string): string {
    if (!id) return '—';
    return this.animalTypes.find((t) => t.id === id)?.name || '—';
  }

  getDiseaseName(id?: string): string {
    if (!id) return 'Genel Kontrol / Rutin';
    return this.diseases().find((d) => d.id === id)?.name || 'Hastalık Belirtilmedi';
  }

  getTreatmentTypeName(id?: string): string {
    if (!id) return 'Tedavi';
    return this.treatmentTypes().find((t) => t.id === id)?.name || 'Müdahale';
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
    return (
      this.allAnimals.find(
        (x) =>
          x.id === idOrTag ||
          x.farmTagNo?.toLowerCase() === clean ||
          (x.nationalTagNo && x.nationalTagNo.toLowerCase() === clean)
      ) || null
    );
  }

  // Computed Family Tree Elements
  readonly mother = computed(() => {
    return this.findAnimal(this.animal?.motherId);
  });

  readonly father = computed(() => {
    return this.findAnimal(this.animal?.fatherId);
  });

  readonly hasMother = computed(() => {
    return !!this.mother() || this.isValidTag(this.animal?.motherId);
  });

  readonly hasFather = computed(() => {
    return !!this.father() || this.isValidTag(this.animal?.fatherId);
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
    const a = this.animal;
    if (!a) return [];
    return this.allAnimals.filter((child) => {
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
    const tag = (this.animal?.farmTagNo || '000').replace(/[^a-zA-Z0-9]/g, '');
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
    const d = this.parseDate(this.animal?.birthDate);
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

  navigateToAnimal(target: Animal | null) {
    if (target) {
      this.selectAnimal.emit(target);
    }
  }
}
