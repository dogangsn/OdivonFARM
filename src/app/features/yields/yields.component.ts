import { Component, computed, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { toSignal } from '@angular/core/rxjs-interop';
import { YieldRecordService } from '../../core/services/yield-record.service';
import { AnimalService } from '../../core/services/animal.service';
import { HerdService } from '../../core/services/definitions/herd.service';
import { YieldRecord, YieldType, YieldSession } from '../../core/models/production.model';
import { Animal, Herd } from '../../core/models/animal.model';
import { AlertService } from '../../core/services/alert.service';

export interface BreedBenchmark {
  breedName: string;
  minDaily: number;
  maxDaily: number;
  avgDaily: number;
  minSession: number;
  maxSession: number;
  unit: string;
  tips: string;
}

@Component({
  selector: 'app-yields',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './yields.component.html',
  styleUrls: ['./yields.component.scss'],
})
export class YieldsComponent {
  private yieldService = inject(YieldRecordService);
  private animalService = inject(AnimalService);
  private herdService = inject(HerdService);
  private alertService = inject(AlertService);

  readonly yields = toSignal(this.yieldService.list(), { initialValue: [] as YieldRecord[] });
  readonly animals = toSignal(this.animalService.list(), { initialValue: [] as Animal[] });
  readonly herds = toSignal(this.herdService.list(), { initialValue: [] as Herd[] });

  // Filters
  readonly searchTerm = signal('');
  readonly typeFilter = signal<'all' | YieldType>('all');
  readonly targetFilter = signal<'all' | 'animal' | 'herd'>('all');

  // Drawer
  readonly showDrawer = signal(false);
  readonly isEditing = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // Form Model
  readonly form = signal<{
    type: YieldType;
    targetKind: 'animal' | 'herd';
    animalId?: string;
    herdId?: string;
    amount: number | null;
    unit: 'lt' | 'kg';
    date: string;
    time: string;
    session: YieldSession;
  }>({
    type: 'sut',
    targetKind: 'animal',
    animalId: '',
    herdId: '',
    amount: null,
    unit: 'lt',
    date: new Date().toISOString().substring(0, 10),
    time: new Date().toTimeString().substring(0, 5),
    session: 'sabah',
  });

  // Female animals (only female animals produce milk)
  readonly femaleAnimals = computed(() => {
    return (this.animals() || []).filter((a) => a.gender === 'disi');
  });

  // Selectable animals based on yield type
  readonly selectableAnimals = computed(() => {
    if (this.form().type === 'sut') {
      return this.femaleAnimals();
    }
    return this.animals() || [];
  });

  // Lookup maps
  readonly animalMap = computed(() => {
    const map = new Map<string, Animal>();
    for (const a of this.animals() || []) {
      if (a?.id) map.set(a.id, a);
    }
    return map;
  });

  readonly herdMap = computed(() => {
    const map = new Map<string, Herd>();
    for (const h of this.herds() || []) {
      if (h?.id) map.set(h.id, h);
    }
    return map;
  });

  // Benchmark for the currently selected animal in the form
  readonly currentFormBenchmark = computed(() => {
    const f = this.form();
    if (f.type !== 'sut' || f.targetKind !== 'animal' || !f.animalId) return null;
    const animal = this.getAnimal(f.animalId);
    return this.getBreedBenchmark(animal);
  });

  // Active benchmark comparison for the currently entered amount in the form
  readonly currentComparison = computed(() => {
    const f = this.form();
    if (f.type !== 'sut' || f.targetKind !== 'animal' || !f.animalId || !f.amount) return null;
    return this.getBenchmarkComparison(f.animalId, f.amount, f.session);
  });

  // Filtered List
  readonly filteredYields = computed(() => {
    let list = this.yields() || [];
    const query = (this.searchTerm() || '').trim().toLowerCase();
    const typeF = this.typeFilter();
    const targetF = this.targetFilter();

    if (typeF !== 'all') {
      list = list.filter((y) => y.type === typeF);
    }

    if (targetF === 'animal') {
      list = list.filter((y) => !!y.animalId);
    } else if (targetF === 'herd') {
      list = list.filter((y) => !!y.herdId);
    }

    if (query) {
      list = list.filter((y) => {
        const animal = y.animalId ? this.animalMap().get(y.animalId) : null;
        const herd = y.herdId ? this.herdMap().get(y.herdId) : null;
        const tag = animal?.farmTagNo?.toLowerCase() || '';
        const aName = animal?.name?.toLowerCase() || '';
        const hName = herd?.name?.toLowerCase() || '';

        return tag.includes(query) || aName.includes(query) || hName.includes(query);
      });
    }

    return [...(list || [])].sort((a, b) => {
      const timeA = this.getTime(a.date);
      const timeB = this.getTime(b.date);
      return timeB - timeA;
    });
  });

  // Stats
  readonly stats = computed(() => {
    const list = this.yields() || [];
    let totalMilk = 0;
    let totalWool = 0;
    let milkCount = 0;

    for (const y of list) {
      const amt = Number(y.amount) || 0;
      if (y.type === 'sut') {
        totalMilk += amt;
        milkCount++;
      } else if (y.type === 'yapagi') {
        totalWool += amt;
      }
    }

    const avgMilkPerRecord = milkCount > 0 ? (totalMilk / milkCount).toFixed(1) : '0';

    return {
      totalRecords: list.length,
      totalMilk,
      totalWool,
      avgMilkPerRecord,
    };
  });

  isDirty = signal(false);
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

  openAddDrawer(defaultType: YieldType = 'sut') {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.errorMessage.set(null);
    this.isDirty.set(false);

    const eligibleAnimals = defaultType === 'sut' ? this.femaleAnimals() : (this.animals() || []);
    const firstAnimal = eligibleAnimals[0]?.id || '';
    const firstHerd = (this.herds() || [])[0]?.id || '';

    const now = new Date();
    const currentHour = now.getHours();
    const defaultSession: YieldSession = currentHour < 11 ? 'sabah' : (currentHour < 16 ? 'ogle' : 'aksam');

    const initial = {
      type: defaultType,
      targetKind: 'animal' as const,
      animalId: firstAnimal,
      herdId: firstHerd,
      amount: null as number | null,
      unit: (defaultType === 'sut' ? 'lt' : 'kg') as 'kg' | 'lt',
      date: now.toISOString().substring(0, 10),
      time: now.toTimeString().substring(0, 5),
      session: defaultSession,
    };
    this.form.set(initial);
    this.initialSnapshot = JSON.stringify(initial);

    this.showDrawer.set(true);
  }

  openEditDrawer(y: YieldRecord) {
    if (!y?.id) return;
    this.isEditing.set(true);
    this.editingId.set(y.id);
    this.errorMessage.set(null);
    this.isDirty.set(false);

    const initial = {
      type: y.type,
      targetKind: y.herdId ? 'herd' as const : 'animal' as const,
      animalId: y.animalId || '',
      herdId: y.herdId || '',
      amount: y.amount || null,
      unit: y.unit,
      date: this.formatDateForInput(y.date),
      time: y.time || '07:00',
      session: y.session || 'sabah',
    };
    this.form.set(initial);
    this.initialSnapshot = JSON.stringify(initial);

    this.showDrawer.set(true);
  }

  hasUnsavedChanges(): boolean {
    if (!this.showDrawer()) return false;
    if (this.isDirty()) return true;
    if (this.initialSnapshot && JSON.stringify(this.form()) !== this.initialSnapshot) {
      return true;
    }
    const f = this.form();
    return !this.isEditing() && f.amount != null;
  }

  async requestCloseDrawer() {
    if (this.hasUnsavedChanges()) {
      const confirmed = await this.alertService.confirm(
        'Kaydetmeden Çıkış',
        'Girdiğiniz bilgiler henüz kaydedilmedi. Çıkmak istediğinizden emin misiniz?',
        'Evet, Çık',
        'Vazgeç'
      );
      if (!confirmed) return;
    }
    this.closeDrawer();
  }

  closeDrawer() {
    this.showDrawer.set(false);
    this.isDirty.set(false);
    this.isEditing.set(false);
    this.editingId.set(null);
    this.errorMessage.set(null);
  }

  onTypeChange(newType: YieldType) {
    let currentAnimalId = this.form().animalId;
    if (newType === 'sut') {
      const selected = this.getAnimal(currentAnimalId);
      if (!selected || selected.gender !== 'disi') {
        currentAnimalId = this.femaleAnimals()[0]?.id || '';
      }
    }

    this.form.update((cur) => ({
      ...cur,
      type: newType,
      unit: newType === 'sut' ? 'lt' : 'kg',
      animalId: currentAnimalId,
    }));
  }

  async saveYield() {
    const f = this.form();
    if (!f.amount || f.amount <= 0) {
      this.errorMessage.set('Lütfen geçerli bir verim miktarı girin.');
      return;
    }
    if (f.targetKind === 'animal' && !f.animalId) {
      this.errorMessage.set('Lütfen bir hayvan seçin.');
      return;
    }
    if (f.targetKind === 'animal' && f.type === 'sut') {
      const animal = this.getAnimal(f.animalId);
      if (animal && animal.gender !== 'disi') {
        this.errorMessage.set('Süt sağımı yalnızca dişi hayvanlar için kaydedilebilir.');
        return;
      }
    }
    if (f.targetKind === 'herd' && !f.herdId) {
      this.errorMessage.set('Lütfen bir sürü seçin.');
      return;
    }
    if (!f.date) {
      this.errorMessage.set('Lütfen kayıt tarihini girin.');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    try {
      const payload: Partial<YieldRecord> = {
        type: f.type,
        amount: Number(f.amount),
        unit: f.unit,
        date: new Date(f.date),
        time: f.time,
        session: f.session,
        animalId: f.targetKind === 'animal' ? f.animalId : undefined,
        herdId: f.targetKind === 'herd' ? f.herdId : undefined,
      };

      if (this.isEditing() && this.editingId()) {
        await this.yieldService.update(this.editingId()!, payload);
      } else {
        await this.yieldService.create(payload as any);
      }

      this.closeDrawer();
    } catch (err: any) {
      console.error('Verim kaydedilemedi:', err);
      this.errorMessage.set(err?.message || 'Kayıt sırasında bir hata oluştu.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteYield(id?: string) {
    if (!id) return;
    const confirmed = await this.alertService.confirmDelete(
      'Verim Kaydını Sil',
      'Bu verim kaydını silmek istediğinize emin misiniz?'
    );
    if (!confirmed) return;
    try {
      await this.yieldService.softDelete(id);
      this.alertService.toastSuccess('Verim kaydı başarıyla silindi');
    } catch (err) {
      console.error('Silme hatası:', err);
      this.alertService.error('Hata Oluştu', 'Kayıt silinirken bir hata oluştu.');
    }
  }

  // Breed Benchmarking
  getBreedBenchmark(animal?: Animal | null): BreedBenchmark | null {
    if (!animal) return null;
    const breed = (animal.breed || '').toLowerCase();
    const species = (animal.species || '').toLowerCase();

    // Sığır ırkları
    if (breed.includes('holstein') || breed.includes('siyah alaca') || breed.includes('frisian')) {
      return { breedName: 'Holstein (Siyah Alaca)', minDaily: 25, maxDaily: 35, avgDaily: 30, minSession: 12, maxSession: 18, unit: 'Lt', tips: 'Yüksek süt verimi ırkı. Çift sağımda seans başı 12-18 Lt beklenir.' };
    }
    if (breed.includes('simental') || breed.includes('simmental')) {
      return { breedName: 'Simental', minDaily: 18, maxDaily: 26, avgDaily: 22, minSession: 9, maxSession: 13, unit: 'Lt', tips: 'Kombine ırk. Yüksek yağ ve protein. Seans başı 9-13 Lt beklenir.' };
    }
    if (breed.includes('montofon') || breed.includes('brown swiss') || breed.includes('esmer')) {
      return { breedName: 'Montofon (Brown Swiss)', minDaily: 20, maxDaily: 28, avgDaily: 24, minSession: 10, maxSession: 14, unit: 'Lt', tips: 'Kombine süt/et ırkı. Seans başı 10-14 Lt beklenir.' };
    }
    if (breed.includes('jersey')) {
      return { breedName: 'Jersey', minDaily: 16, maxDaily: 24, avgDaily: 20, minSession: 8, maxSession: 12, unit: 'Lt', tips: 'Yüksek yağ oranlı süt ırkı. Seans başı 8-12 Lt beklenir.' };
    }
    if (breed.includes('manda') || species.includes('manda')) {
      return { breedName: 'Anadolu Mandası', minDaily: 6, maxDaily: 10, avgDaily: 8, minSession: 3, maxSession: 5, unit: 'Lt', tips: 'Yüksek yağlı manda sütü. Seans başı 3-5 Lt beklenir.' };
    }

    // Keçi ırkları
    if (breed.includes('saanen')) {
      return { breedName: 'Saanen Keçisi', minDaily: 2.5, maxDaily: 4.5, avgDaily: 3.5, minSession: 1.2, maxSession: 2.3, unit: 'Lt', tips: 'Yüksek verimli süt keçisi. Seans başı 1.2-2.3 Lt beklenir.' };
    }
    if (breed.includes('halep') || breed.includes('şam') || breed.includes('damascus')) {
      return { breedName: 'Halep (Şam) Keçisi', minDaily: 2.0, maxDaily: 3.8, avgDaily: 3.0, minSession: 1.0, maxSession: 1.9, unit: 'Lt', tips: 'Kombine keçi ırkı. Seans başı 1.0-1.9 Lt beklenir.' };
    }
    if (breed.includes('kıl keçi') || breed.includes('kil')) {
      return { breedName: 'Kıl Keçisi', minDaily: 0.8, maxDaily: 1.8, avgDaily: 1.2, minSession: 0.4, maxSession: 0.9, unit: 'Lt', tips: 'Yerli dayanıklı ırk. Seans başı 0.4-0.9 Lt beklenir.' };
    }

    // Koyun ırkları
    if (breed.includes('ivesi') || breed.includes('awassi')) {
      return { breedName: 'İvesi Koyunu', minDaily: 1.5, maxDaily: 2.8, avgDaily: 2.0, minSession: 0.7, maxSession: 1.4, unit: 'Lt', tips: 'En yüksek süt verimli koyun ırkı. Seans başı 0.7-1.4 Lt beklenir.' };
    }
    if (breed.includes('sakız') || breed.includes('chios')) {
      return { breedName: 'Sakız Koyunu', minDaily: 1.8, maxDaily: 3.2, avgDaily: 2.5, minSession: 0.9, maxSession: 1.6, unit: 'Lt', tips: 'Ege süt koyunu. Seans başı 0.9-1.6 Lt beklenir.' };
    }
    if (breed.includes('tahirova')) {
      return { breedName: 'Tahirova Koyunu', minDaily: 1.4, maxDaily: 2.6, avgDaily: 2.0, minSession: 0.7, maxSession: 1.3, unit: 'Lt', tips: 'Süt koyunu melezi. Seans başı 0.7-1.3 Lt beklenir.' };
    }

    // Genel Tür Fallback
    if (species.includes('sigir') || species.includes('büyükbaş') || species.includes('sığır')) {
      return { breedName: animal.breed || 'Kültür Sığırı', minDaily: 16, maxDaily: 26, avgDaily: 21, minSession: 8, maxSession: 13, unit: 'Lt', tips: 'Genel kültür ırkı sığır referansı. Seans başı 8-13 Lt beklenir.' };
    }
    if (species.includes('keci') || species.includes('keçi')) {
      return { breedName: animal.breed || 'Süt Keçisi', minDaily: 1.5, maxDaily: 3.5, avgDaily: 2.5, minSession: 0.8, maxSession: 1.8, unit: 'Lt', tips: 'Genel keçi süt referansı. Seans başı 0.8-1.8 Lt beklenir.' };
    }
    if (species.includes('koyun')) {
      return { breedName: animal.breed || 'Süt Koyunu', minDaily: 0.8, maxDaily: 2.2, avgDaily: 1.5, minSession: 0.4, maxSession: 1.1, unit: 'Lt', tips: 'Genel koyun süt referansı. Seans başı 0.4-1.1 Lt beklenir.' };
    }

    return null;
  }

  getBenchmarkComparison(animalId?: string, amount?: number | null, session: YieldSession = 'sabah') {
    if (!animalId || !amount || amount <= 0) return null;
    const animal = this.getAnimal(animalId);
    const benchmark = this.getBreedBenchmark(animal);
    if (!benchmark) return null;

    const isDaily = session === 'genel';
    const min = isDaily ? benchmark.minDaily : benchmark.minSession;
    const max = isDaily ? benchmark.maxDaily : benchmark.maxSession;
    const avg = isDaily ? benchmark.avgDaily : (benchmark.minSession + benchmark.maxSession) / 2;

    const diffPercent = Math.round(((amount - avg) / avg) * 100);

    if (amount < min) {
      return {
        status: 'low',
        diffPercent,
        benchmark,
        min,
        max,
        avg,
        text: `Beklenti Altında (%${Math.abs(diffPercent)} daha düşük)`,
        advice: 'Rasyon dengesini ve meme sağlığını gözlemlemeniz önerilir.',
      };
    } else if (amount > max) {
      return {
        status: 'high',
        diffPercent,
        benchmark,
        min,
        max,
        avg,
        text: `Yüksek Verim (+%${diffPercent} üzeri)`,
        advice: 'Irk standartlarının üzerinde tepe verim.',
      };
    } else {
      return {
        status: 'optimal',
        diffPercent,
        benchmark,
        min,
        max,
        avg,
        text: `İdeal Irk Bandında`,
        advice: 'Verim ırkın genetik referans aralığında seyrediyor.',
      };
    }
  }

  // Helpers
  getAnimal(id?: string): Animal | undefined {
    return id ? this.animalMap().get(id) : undefined;
  }

  getHerd(id?: string): Herd | undefined {
    return id ? this.herdMap().get(id) : undefined;
  }

  formatDate(val: any): string {
    if (!val) return '—';
    let d: Date;
    if (val.seconds) d = new Date(val.seconds * 1000);
    else if (val.toDate && typeof val.toDate === 'function') d = val.toDate();
    else if (val instanceof Date) d = val;
    else d = new Date(val);

    if (isNaN(d.getTime())) return '—';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  }

  getSessionLabel(session?: YieldSession): string {
    switch (session) {
      case 'sabah': return 'Sabah Sağımı';
      case 'ogle': return 'Öğle Sağımı';
      case 'aksam': return 'Akşam Sağımı';
      case 'genel': return 'Günlük Toplam';
      default: return 'Genel';
    }
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
