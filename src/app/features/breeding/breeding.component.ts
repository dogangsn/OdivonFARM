import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatingService } from '../../core/services/mating.service';
import { AnimalService } from '../../core/services/animal.service';
import { BreedService } from '../../core/services/definitions/breed.service';
import { HerdService } from '../../core/services/definitions/herd.service';
import { PaddockService } from '../../core/services/definitions/paddock.service';
import { AnimalTypeService } from '../../core/services/definitions/animal-type.service';
import { SubscriptionService } from '../../core/services/subscription.service';
import { WeightRecordService } from '../../core/services/weight-record.service';
import { Mating, MatingStatus } from '../../core/models/production.model';
import { Animal, AnimalStatus, Breed, Herd, Paddock, AnimalType } from '../../core/models';
import { PedigreeService, InbreedingAnalysisResult, PedigreeNode } from '../../core/services/pedigree.service';
import { AlertService } from '../../core/services/alert.service';
import Swal from 'sweetalert2';

interface EnrichedMating extends Mating {
  progressPercent?: number;
  daysRemaining?: number;
}

@Component({
  selector: 'app-breeding',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './breeding.component.html',
  styleUrls: ['./breeding.component.scss'],
})
export class BreedingComponent {
  private matingService = inject(MatingService);
  private animalService = inject(AnimalService);
  private pedigreeService = inject(PedigreeService);
  private alertService = inject(AlertService);
  private breedService = inject(BreedService);
  private herdService = inject(HerdService);
  private paddockService = inject(PaddockService);
  private animalTypeService = inject(AnimalTypeService);
  private subService = inject(SubscriptionService);
  private weightService = inject(WeightRecordService);
  private router = inject(Router);

  readonly matings = toSignal(this.matingService.list(), { initialValue: [] as Mating[] });
  readonly animals = toSignal(this.animalService.list(), { initialValue: [] as Animal[] });
  readonly breeds = toSignal(this.breedService.list(), { initialValue: [] as Breed[] });
  readonly herds = toSignal(this.herdService.list(), { initialValue: [] as Herd[] });
  readonly paddocks = toSignal(this.paddockService.list(), { initialValue: [] as Paddock[] });
  readonly animalTypes = toSignal(this.animalTypeService.list(), { initialValue: [] as AnimalType[] });

  // UI State
  readonly searchTerm = signal('');
  readonly statusFilter = signal<MatingStatus | 'all'>('all');
  readonly showDrawer = signal(false);
  readonly isEditing = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // Inbreeding & Pedigree Analysis State
  readonly showPedigreeModal = signal(false);

  readonly inbreedingAnalysis = computed<InbreedingAnalysisResult | null>(() => {
    const fId = this.form().femaleId;
    const mId = this.form().maleId;
    const animals = this.animals() || [];
    console.log('[Breeding] inbreedingAnalysis computed:', { fId, mId, animalsCount: animals.length });
    if (!fId || !mId) return null;
    try {
      const res = this.pedigreeService.analyzeInbreeding(fId, mId, animals);
      console.log('[Breeding] inbreedingAnalysis result:', res);
      return res;
    } catch (err) {
      console.error('[Breeding] Error in analyzeInbreeding:', err);
      return null;
    }
  });

  readonly pedigreeComparison = computed(() => {
    const fId = this.form().femaleId;
    const mId = this.form().maleId;
    if (!fId || !mId) return null;
    return this.pedigreeService.buildComparisonTree(fId, mId, this.animals() || []);
  });

  openPedigreeModal() {
    this.showPedigreeModal.set(true);
  }

  closePedigreeModal() {
    this.showPedigreeModal.set(false);
  }

  // Birth Modal & Pedigree State
  readonly showBirthModal = signal(false);
  readonly isSavingBirth = signal(false);
  readonly birthErrorMessage = signal<string | null>(null);
  readonly selectedMatingForBirth = signal<Partial<Mating> | null>(null);

  readonly birthAnimalForm = signal<{
    farmTagNo: string;
    nationalTagNo: string;
    rfid: string;
    name: string;
    gender: 'disi' | 'erkek';
    status: AnimalStatus;
    birthDate: string;
    birthWeightKg: number | null;
    animalTypeId: string;
    breedId: string;
    herdId: string;
    paddockId: string;
    motherId: string;
    fatherId: string;
    notes: string;
  }>({
    farmTagNo: '',
    nationalTagNo: '',
    rfid: '',
    name: '',
    gender: 'disi',
    status: 'aktif',
    birthDate: new Date().toISOString().substring(0, 10),
    birthWeightKg: null,
    animalTypeId: '',
    breedId: '',
    herdId: '',
    paddockId: '',
    motherId: '',
    fatherId: '',
    notes: '',
  });

  // Form Model
  readonly form = signal<{
    femaleId: string;
    maleId?: string;
    matingDate: string;
    status: MatingStatus;
    expectedBirthDate?: string;
    actualBirthDate?: string;
    note?: string;
  }>({
    femaleId: '',
    maleId: '',
    matingDate: new Date().toISOString().substring(0, 10),
    status: 'koculdu',
    expectedBirthDate: this.calculateExpectedBirthDate(new Date().toISOString().substring(0, 10), 150),
    actualBirthDate: '',
    note: '',
  });

  // Filter animals by gender
  readonly femaleAnimals = computed(() => {
    return this.animals().filter((a) => a.gender === 'disi' && a.status === 'aktif');
  });

  readonly maleAnimals = computed(() => {
    return this.animals().filter((a) => a.gender === 'erkek' && a.status === 'aktif');
  });

  readonly animalMap = computed(() => {
    const map = new Map<string, Animal>();
    for (const a of this.animals()) {
      if (a.id) map.set(a.id, a);
    }
    return map;
  });

  // Enriched Matings with Gestation Progress
  readonly enrichedMatings = computed(() => {
    const now = new Date().getTime();
    const list = this.matings() || [];
    return list.filter(Boolean).map((m): EnrichedMating => {
      const matingTime = this.getTime(m.matingDate);
      const expectedTime = m.expectedBirthDate ? this.getTime(m.expectedBirthDate) : matingTime + 150 * 24 * 60 * 60 * 1000;

      let progressPercent: number | undefined;
      let daysRemaining: number | undefined;

      if (matingTime && expectedTime > matingTime) {
        const totalDuration = expectedTime - matingTime;
        const elapsed = now - matingTime;
        progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));
        daysRemaining = Math.round((expectedTime - now) / (1000 * 60 * 60 * 24));
      }

      return {
        ...m,
        progressPercent,
        daysRemaining,
      };
    }).sort((a, b) => this.getTime(b.matingDate) - this.getTime(a.matingDate));
  });

  // Filtered List
  readonly filteredMatings = computed(() => {
    let list = this.enrichedMatings() || [];
    const query = (this.searchTerm() || '').trim().toLowerCase();
    const st = this.statusFilter();

    if (st !== 'all') {
      list = list.filter((m) => m && m.status === st);
    }

    if (query) {
      list = list.filter((m) => {
        if (!m) return false;
        const female = this.animalMap().get(m.femaleId);
        const male = m.maleId ? this.animalMap().get(m.maleId) : null;
        const fTag = female?.farmTagNo?.toLowerCase() || '';
        const fName = female?.name?.toLowerCase() || '';
        const mTag = male?.farmTagNo?.toLowerCase() || '';
        const mName = male?.name?.toLowerCase() || '';
        const note = m.note?.toLowerCase() || '';

        return (
          fTag.includes(query) ||
          fName.includes(query) ||
          mTag.includes(query) ||
          mName.includes(query) ||
          note.includes(query)
        );
      });
    }

    return list;
  });

  // Stats
  readonly totalCount = computed(() => (this.matings() || []).length);

  readonly pregnantCount = computed(() => {
    return (this.matings() || []).filter((m) => m && m.status === 'gebe').length;
  });

  readonly observationCount = computed(() => {
    return (this.matings() || []).filter((m) => m && (m.status === 'gozlem' || m.status === 'koculdu')).length;
  });

  readonly upcomingBirthsCount = computed(() => {
    return (this.enrichedMatings() || []).filter((m) => {
      return m && m.status === 'gebe' && m.daysRemaining !== undefined && m.daysRemaining >= 0 && m.daysRemaining <= 15;
    }).length;
  });

  // Helpers
  getTime(d: any): number {
    if (!d) return 0;
    if (typeof d === 'string') return new Date(d).getTime();
    if (d.seconds) return d.seconds * 1000;
    if (d instanceof Date) return d.getTime();
    return 0;
  }

  formatDate(d: any): string {
    if (!d) return '—';
    if (typeof d === 'string') return d.substring(0, 10);
    if (d.seconds) return new Date(d.seconds * 1000).toISOString().substring(0, 10);
    if (d instanceof Date) return d.toISOString().substring(0, 10);
    return String(d);
  }

  getAnimal(id?: string): Animal | undefined {
    if (!id) return undefined;
    return this.animalMap().get(id);
  }

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

  getOffspringTags(mating: Mating): string[] {
    if (!mating.offspringIds || mating.offspringIds.length === 0) return [];
    return mating.offspringIds
      .map((id) => this.getAnimal(id)?.farmTagNo)
      .filter((tag): tag is string => !!tag);
  }

  calculateExpectedBirthDate(dateStr: string, gestationDays = 150): string {
    try {
      const d = new Date(dateStr);
      d.setDate(d.getDate() + gestationDays);
      return d.toISOString().substring(0, 10);
    } catch {
      return '';
    }
  }

  onMatingDateChange(newDate: string) {
    this.updateFormField('matingDate', newDate);
    // Auto calculate expected birth date (+150 days for small ruminants)
    const expected = this.calculateExpectedBirthDate(newDate, 150);
    this.updateFormField('expectedBirthDate', expected);
  }

  onFemaleChange(val: string) {
    this.form.update((prev) => ({ ...prev, femaleId: val }));
  }

  onMaleChange(val: string) {
    this.form.update((prev) => ({ ...prev, maleId: val }));
  }

  // Drawer Actions
  openAddDrawer() {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.errorMessage.set(null);
    const today = new Date().toISOString().substring(0, 10);
    const females = this.femaleAnimals();
    const males = this.maleAnimals();
    this.form.set({
      femaleId: females.length > 0 ? (females[0].id || females[0].farmTagNo) : '',
      maleId: males.length > 0 ? (males[0].id || males[0].farmTagNo) : '',
      matingDate: today,
      status: 'koculdu',
      expectedBirthDate: this.calculateExpectedBirthDate(today, 150),
      actualBirthDate: '',
      note: '',
    });
    this.showDrawer.set(true);
  }

  openEditDrawer(mating: Mating) {
    this.isEditing.set(true);
    this.editingId.set(mating.id || null);
    this.errorMessage.set(null);
    this.form.set({
      femaleId: mating.femaleId,
      maleId: mating.maleId || '',
      matingDate: this.formatDate(mating.matingDate),
      status: mating.status,
      expectedBirthDate: this.formatDate(mating.expectedBirthDate),
      actualBirthDate: mating.actualBirthDate ? this.formatDate(mating.actualBirthDate) : '',
      note: mating.note || '',
    });
    this.showDrawer.set(true);
  }

  closeDrawer() {
    this.showDrawer.set(false);
  }

  updateFormField<K extends keyof ReturnType<typeof this.form>>(field: K, value: any) {
    this.form.update((prev) => ({ ...prev, [field]: value }));
  }

  // Birth Modal & Pedigree Auto-Mapping
  openBirthModal(mating: Partial<Mating> & { femaleId: string }) {
    if (!this.subService.canAddAnimal(this.animals().length)) {
      this.alertService.confirm(
        'Hayvan Kapasite Kotanız Doldu',
        `Mevcut paketiniz en fazla ${this.subService.animalLimit()} baş hayvana izin vermektedir. Yeni doğan yavruyu sisteme eklemek için paketinizi yükseltebilirsiniz.`,
        'Paketi Yükselt',
        'Vazgeç'
      ).then((confirmed) => {
        if (confirmed) {
          this.router.navigate(['/abonelik']);
        }
      });
      return;
    }

    const mother = this.getAnimal(mating.femaleId);
    const father = mating.maleId ? this.getAnimal(mating.maleId) : null;
    const bDate = mating.actualBirthDate ? this.formatDate(mating.actualBirthDate) : new Date().toISOString().substring(0, 10);

    const motherTag = mother?.farmTagNo || mating.femaleId;
    const fatherTag = father?.farmTagNo || (mating.maleId ? mating.maleId : '');

    this.selectedMatingForBirth.set(mating);
    this.birthErrorMessage.set(null);

    // Auto-map pedigree & lineage from mother and father
    this.birthAnimalForm.set({
      farmTagNo: '',
      nationalTagNo: '',
      rfid: '',
      name: '',
      gender: 'disi',
      status: 'aktif',
      birthDate: bDate,
      birthWeightKg: null,
      animalTypeId: mother?.animalTypeId || '',
      breedId: mother?.breedId || '',
      herdId: mother?.herdId || '',
      paddockId: mother?.paddockId || '',
      motherId: motherTag,
      fatherId: fatherTag,
      notes: `Doğum Kaydı — Anne: ${motherTag}${mother?.name ? ' (' + mother.name + ')' : ''}${fatherTag ? `, Baba: ${fatherTag}` + (father?.name ? ' (' + father.name + ')' : '') : ''}`,
    });

    this.showBirthModal.set(true);
  }

  closeBirthModal() {
    this.showBirthModal.set(false);
    this.birthErrorMessage.set(null);
  }

  updateBirthFormField<K extends keyof ReturnType<typeof this.birthAnimalForm>>(field: K, value: any) {
    this.birthAnimalForm.update((prev) => ({ ...prev, [field]: value }));
  }

  async saveBirthAnimal(addAnother: boolean = false) {
    const f = this.birthAnimalForm();
    if (!f.farmTagNo?.trim()) {
      this.birthErrorMessage.set('Lütfen yavru için bir Çiftlik Küpe Numarası giriniz.');
      return;
    }

    this.isSavingBirth.set(true);
    this.birthErrorMessage.set(null);

    try {
      // 1. Create the new offspring Animal
      const newAnimalId = await this.animalService.create({
        farmTagNo: f.farmTagNo.trim(),
        nationalTagNo: f.nationalTagNo?.trim() || undefined,
        rfid: f.rfid?.trim() || undefined,
        name: f.name?.trim() || undefined,
        gender: f.gender,
        status: 'aktif',
        birthDate: f.birthDate || undefined,
        breedId: f.breedId || undefined,
        animalTypeId: f.animalTypeId || undefined,
        herdId: f.herdId || undefined,
        paddockId: f.paddockId || undefined,
        motherId: f.motherId?.trim() || undefined,
        fatherId: f.fatherId?.trim() || undefined,
        notes: f.notes?.trim() || undefined,
      });

      // 2. If birth weight provided, save weight record
      if (f.birthWeightKg && f.birthWeightKg > 0) {
        try {
          await this.weightService.create({
            animalId: newAnimalId,
            date: f.birthDate,
            weightKg: Number(f.birthWeightKg),
            note: 'Doğum Ağırlığı',
          });
        } catch (e) {
          console.warn('Could not save birth weight record:', e);
        }
      }

      // 3. Update the mating record: status -> 'dogurdu', actualBirthDate -> f.birthDate, append offspringId
      const currentMating = this.selectedMatingForBirth();
      if (currentMating && currentMating.id) {
        const existingOffspring = currentMating.offspringIds || [];
        await this.matingService.update(currentMating.id, {
          status: 'dogurdu',
          actualBirthDate: f.birthDate,
          offspringIds: [...existingOffspring, newAnimalId],
        });
      }

      if (addAnother) {
        this.alertService.toastSuccess(`${f.farmTagNo} küpeli yavru kaydedildi. Diğer yavruyu girebilirsiniz.`);
        this.birthAnimalForm.update((prev) => ({
          ...prev,
          farmTagNo: '',
          nationalTagNo: '',
          rfid: '',
          name: '',
          birthWeightKg: null,
        }));
      } else {
        this.closeBirthModal();
        this.alertService.toastSuccess('Yavru hayvan ve doğum kaydı başarıyla tamamlandı.');
      }
    } catch (err: any) {
      this.birthErrorMessage.set(err.message || 'Yavru hayvan kaydedilirken bir hata oluştu.');
    } finally {
      this.isSavingBirth.set(false);
    }
  }

  async quickStatusChange(mating: Mating, newStatus: MatingStatus) {
    if (newStatus === 'dogurdu') {
      this.openBirthModal(mating);
      return;
    }
    try {
      await this.matingService.update(mating.id!, { status: newStatus });
      this.alertService.toastSuccess('Durum başarıyla güncellendi');
    } catch (err: any) {
      this.alertService.error('Güncelleme Başarısız', err.message);
    }
  }

  async saveMating() {
    const f = this.form();
    if (!f.femaleId) {
      this.errorMessage.set('Lütfen dişi hayvanı seçiniz.');
      return;
    }
    if (!f.matingDate) {
      this.errorMessage.set('Lütfen çiftleşme tarihini giriniz.');
      return;
    }

    // Akraba Çiftleşmesi (Inbreeding) Güvenlik Doğrulaması
    const analysis = this.inbreedingAnalysis();
    if (analysis && (analysis.riskLevel === 'critical' || analysis.riskLevel === 'high')) {
      const isDark = document.documentElement.classList.contains('dark');
      const isCrit = analysis.riskLevel === 'critical';
      const result = await Swal.fire({
        title: isCrit ? '🚨 Kritik Akraba Çiftleşmesi Uyarısı!' : '⚠️ Yüksek Akrabalık Riski Uyarısı!',
        html: `
          <div class="text-left text-sm space-y-3 font-sans">
            <div class="p-3.5 rounded-2xl ${isCrit ? 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200' : 'bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200'}">
              <div class="font-extrabold text-sm flex items-center justify-between">
                <span>${analysis.relationshipTitle}</span>
                <span class="px-2 py-0.5 rounded-full text-xs font-mono font-black ${isCrit ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'}">%${analysis.percentage} Risk</span>
              </div>
              <p class="text-xs mt-1.5 leading-relaxed opacity-95">${analysis.summary}</p>
            </div>
            <div class="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl text-xs space-y-1.5 border border-slate-200/70 dark:border-slate-700">
              <div class="font-bold text-slate-700 dark:text-slate-200">Kalıtsal Riskler ve Tehlikeler:</div>
              <ul class="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-300">
                ${analysis.warnings.map((w: string) => `<li>${w}</li>`).join('')}
              </ul>
            </div>
            <p class="text-xs text-rose-600 dark:text-rose-400 font-semibold italic text-center">
              Tavsiye: ${analysis.recommendation}
            </p>
          </div>
        `,
        icon: isCrit ? 'error' : 'warning',
        showCancelButton: true,
        confirmButtonText: 'Riski Kabul Ediyorum ve Kaydet',
        cancelButtonText: 'Vazgeç (Damızlığı Değiştir)',
        confirmButtonColor: isCrit ? '#e11d48' : '#d97706',
        cancelButtonColor: '#4f46e5',
        background: isDark ? '#1e293b' : '#ffffff',
        color: isDark ? '#f8fafc' : '#0f172a',
      });

      if (!result.isConfirmed) {
        return;
      }
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    try {
      const payload: Partial<Mating> = {
        femaleId: f.femaleId,
        maleId: f.maleId || undefined,
        matingDate: f.matingDate,
        status: f.status,
        expectedBirthDate: f.expectedBirthDate || undefined,
        actualBirthDate: f.actualBirthDate || undefined,
        note: f.note || undefined,
      };

      let matingId = this.editingId();
      if (this.isEditing() && matingId) {
        await this.matingService.update(matingId, payload);
      } else {
        matingId = await this.matingService.create(payload as any);
      }

      this.closeDrawer();
      this.alertService.toastSuccess('Kayıt başarıyla kaydedildi');

      // If status is 'dogurdu', automatically open the Birth Modal with pedigree pre-populated!
      if (payload.status === 'dogurdu') {
        const savedMating: Partial<Mating> & { femaleId: string } = {
          id: matingId || undefined,
          femaleId: payload.femaleId!,
          maleId: payload.maleId,
          matingDate: payload.matingDate,
          status: 'dogurdu',
          actualBirthDate: payload.actualBirthDate || new Date().toISOString().substring(0, 10),
          offspringIds: (this.isEditing() && this.editingId()) ? (this.matings().find(m => m.id === this.editingId())?.offspringIds || []) : [],
        };
        this.openBirthModal(savedMating);
      }
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Kayıt sırasında bir hata oluştu.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteMating(id: string) {
    const confirmed = await this.alertService.confirmDelete(
      'Çiftleşme / Gebelik Kaydını Sil',
      'Bu çiftleşme veya gebelik kaydını silmek istediğinize emin misiniz?'
    );
    if (!confirmed) return;
    try {
      await this.matingService.softDelete(id);
      this.alertService.toastSuccess('Kayıt başarıyla silindi');
    } catch (err: any) {
      this.alertService.error('Silme Başarısız', err.message);
    }
  }
}
