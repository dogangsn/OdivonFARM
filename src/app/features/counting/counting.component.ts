import { Component, computed, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { toSignal } from '@angular/core/rxjs-interop';
import { CountService } from '../../core/services/count.service';
import { AnimalService } from '../../core/services/animal.service';
import { PaddockService } from '../../core/services/definitions/paddock.service';
import { HerdService } from '../../core/services/definitions/herd.service';
import { Count, CountType } from '../../core/models/operations.model';
import { Animal, Paddock, Herd } from '../../core/models/animal.model';
import { AlertService } from '../../core/services/alert.service';

export interface CountRowViewModel {
  id: string;
  type: CountType;
  typeBadgeClass: string;
  typeLabel: string;
  scopeName: string;
  formattedDate: string;
  formattedTime: string;
  formattedDateTime: string;
  durationText: string;
  expectedCount: number;
  countedCount: number;
  diffCount: number;
  diffStatus: 'tam' | 'eksik' | 'fazla';
  diffText: string;
  diffBadgeClass: string;
  deviceName: string;
  notes?: string;
  rawCount: Count;
}

export interface CountDetailItem {
  animal: Animal;
  isCounted: boolean;
}

@Component({
  selector: 'app-counting',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './counting.component.html',
  styleUrls: ['./counting.component.scss'],
})
export class CountingComponent {
  private countService = inject(CountService);
  private animalService = inject(AnimalService);
  private paddockService = inject(PaddockService);
  private herdService = inject(HerdService);
  private alertService = inject(AlertService);

  readonly counts = toSignal(this.countService.list(), { initialValue: [] as Count[] });
  readonly animals = toSignal(this.animalService.list(), { initialValue: [] as Animal[] });
  readonly paddocks = toSignal(this.paddockService.list(), { initialValue: [] as Paddock[] });
  readonly herds = toSignal(this.herdService.list(), { initialValue: [] as Herd[] });

  // View Mode: 'list' | 'active-count'
  readonly viewMode = signal<'list' | 'active-count'>('list');

  // Filters
  readonly searchTerm = signal('');
  readonly typeFilter = signal<'all' | CountType>('all');

  // Start Count Configuration Modal
  readonly isStartModalOpen = signal(false);
  readonly startConfig = signal({
    type: 'genel' as CountType,
    scopeId: '',
    date: new Date().toISOString().substring(0, 10),
    time: new Date().toTimeString().substring(0, 5),
    deviceName: 'Manuel / RFID Barkod Okuyucu',
    note: '',
  });
  readonly resumeExistingCountId = signal<string | null>(null);

  // Active Count Session State
  readonly activeCountType = signal<CountType>('genel');
  readonly activeScopeId = signal<string>('');
  readonly activeDeviceName = signal<string>('Manuel / RFID Barkod Okuyucu');
  readonly activeStartedAt = signal<Date>(new Date());
  readonly activeCountedIds = signal<string[]>([]);
  readonly scanInput = signal<string>('');
  readonly scanFeedback = signal<{ text: string; success: boolean } | null>(null);
  readonly activeTab = signal<'missing' | 'counted'>('missing');
  readonly sessionNote = signal<string>('');
  readonly isSaving = signal(false);

  // Selected past count for detail modal
  readonly selectedCount = signal<Count | null>(null);
  readonly detailSearchTerm = signal('');
  readonly detailTab = signal<'all' | 'counted' | 'missing'>('all');
  readonly detailPage = signal(1);
  readonly detailPageSize = signal(24);
  readonly showAllInDetail = signal(false);

  // Precomputed Maps
  readonly animalMap = computed(() => {
    const map = new Map<string, Animal>();
    for (const a of this.animals() || []) {
      if (a?.id) map.set(a.id, a);
    }
    return map;
  });

  readonly paddockMap = computed(() => {
    const map = new Map<string, Paddock>();
    for (const p of this.paddocks() || []) {
      if (p?.id) map.set(p.id, p);
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

  // Paddocks with active animal count
  readonly paddocksWithCount = computed(() => {
    const animals = (this.animals() || []).filter((a) => a.status === 'aktif' || !a.status);
    return (this.paddocks() || []).map((p) => {
      const count = animals.filter((a) => a.paddockId === p.id).length;
      return { ...p, animalCount: count };
    });
  });

  // Herds with active animal count
  readonly herdsWithCount = computed(() => {
    const animals = (this.animals() || []).filter((a) => a.status === 'aktif' || !a.status);
    return (this.herds() || []).map((h) => {
      const count = animals.filter((a) => a.herdId === h.id).length;
      return { ...h, animalCount: count };
    });
  });

  // Check if a count already exists for the selected date and scope in start modal
  readonly existingCountForSelectedScope = computed(() => {
    const cfg = this.startConfig();
    const targetDate = cfg.date;
    return (this.counts() || []).find((c) => {
      if (c.type !== cfg.type) return false;
      if (cfg.type !== 'genel' && c.scopeId !== cfg.scopeId) return false;
      const cDate = this.formatDate(c.startedAt || c.date || c.createdAt);
      return cDate === targetDate;
    });
  });

  // Expected animals in current active count session
  readonly expectedAnimals = computed(() => {
    const all = (this.animals() || []).filter((a) => a.status === 'aktif' || !a.status);
    const type = this.activeCountType();
    const scopeId = this.activeScopeId();

    if (type === 'padok' && scopeId) {
      return all.filter((a) => a.paddockId === scopeId);
    }
    if (type === 'suru' && scopeId) {
      return all.filter((a) => a.herdId === scopeId);
    }
    return all;
  });

  // Active Count Computed
  readonly countedAnimals = computed(() => {
    const ids = new Set(this.activeCountedIds());
    return this.expectedAnimals().filter((a) => a.id && ids.has(a.id));
  });

  readonly missingAnimals = computed(() => {
    const ids = new Set(this.activeCountedIds());
    return this.expectedAnimals().filter((a) => a.id && !ids.has(a.id));
  });

  // Highly optimized Precomputed Count Rows for List Screen (0ms lag)
  readonly countRows = computed<CountRowViewModel[]>(() => {
    let list = this.counts() || [];
    const query = (this.searchTerm() || '').trim().toLowerCase();
    const typeF = this.typeFilter();

    if (typeF !== 'all') {
      list = list.filter((c) => c.type === typeF);
    }

    const pMap = this.paddockMap();
    const hMap = this.herdMap();

    const mapped: CountRowViewModel[] = [];

    for (const c of list) {
      const type = c.type;
      let scopeName = 'Çiftlik Geneli';
      if (type === 'padok' && c.scopeId) {
        scopeName = `Padok: ${pMap.get(c.scopeId)?.name || 'Bilinmeyen Padok'}`;
      } else if (type === 'suru' && c.scopeId) {
        scopeName = `Sürü: ${hMap.get(c.scopeId)?.name || 'Bilinmeyen Sürü'}`;
      }

      if (query) {
        const dev = (c.deviceName || '').toLowerCase();
        const scope = scopeName.toLowerCase();
        if (!scope.includes(query) && !dev.includes(query)) {
          continue;
        }
      }

      const rawDate = c.startedAt || c.date || c.createdAt || c.finishedAt;
      const formattedDate = this.formatDate(rawDate);
      const formattedTime = this.formatTimeOnly(rawDate);
      const formattedDateTime = this.formatDateTime(rawDate);
      const durationText = this.getDurationText(c.startedAt || rawDate, c.finishedAt);

      const exp = c.expectedCount || 0;
      const counted = c.countedAnimalIds?.length || 0;
      const diff = counted - exp;

      let diffStatus: 'tam' | 'eksik' | 'fazla' = 'tam';
      let diffText = 'TAM (0)';
      let diffBadgeClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300';

      if (counted < exp) {
        diffStatus = 'eksik';
        diffText = `${exp - counted} EKSİK`;
        diffBadgeClass = 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300';
      } else if (counted > exp) {
        diffStatus = 'fazla';
        diffText = `+${counted - exp} FAZLA`;
        diffBadgeClass = 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300';
      }

      let typeBadgeClass = 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
      let typeLabel = 'Genel';
      if (type === 'padok') {
        typeBadgeClass = 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300';
        typeLabel = 'Padok';
      } else if (type === 'suru') {
        typeBadgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300';
        typeLabel = 'Sürü';
      }

      mapped.push({
        id: c.id || '',
        type,
        typeLabel,
        typeBadgeClass,
        scopeName,
        formattedDate,
        formattedTime,
        formattedDateTime,
        durationText,
        expectedCount: exp,
        countedCount: counted,
        diffCount: diff,
        diffStatus,
        diffText,
        diffBadgeClass,
        deviceName: c.deviceName || 'Manuel / RFID',
        notes: c.notes,
        rawCount: c,
      });
    }

    return mapped.sort((a, b) => {
      const timeA = this.getTime(a.rawCount.startedAt || a.rawCount.date || a.rawCount.createdAt);
      const timeB = this.getTime(b.rawCount.startedAt || b.rawCount.date || b.rawCount.createdAt);
      return timeB - timeA;
    });
  });

  // Overall Stats
  readonly stats = computed(() => {
    const list = this.counts() || [];
    const totalCountedAllTime = list.reduce((sum, c) => sum + (c.countedAnimalIds?.length || 0), 0);

    return {
      totalSessions: list.length,
      totalCountedAllTime,
      totalAnimalsInFarm: (this.animals() || []).filter((a) => a.status === 'aktif' || !a.status).length,
    };
  });

  // Selected count session full details (optimized for 150+ animals)
  readonly selectedCountDetails = computed(() => {
    const sc = this.selectedCount();
    if (!sc) return null;

    const countedSet = new Set(sc.countedAnimalIds || []);
    const aMap = this.animalMap();

    const allExpected = (this.animals() || []).filter((a) => {
      if (a.status !== 'aktif' && a.status) return false;
      if (sc.type === 'padok' && sc.scopeId) return a.paddockId === sc.scopeId;
      if (sc.type === 'suru' && sc.scopeId) return a.herdId === sc.scopeId;
      return true;
    });

    const countedAnimals: Animal[] = [];
    const missingAnimals: Animal[] = [];

    for (const id of sc.countedAnimalIds || []) {
      const a = aMap.get(id);
      if (a) countedAnimals.push(a);
      else countedAnimals.push({ id, farmTagNo: id, status: 'aktif' } as Animal);
    }

    for (const a of allExpected) {
      if (a.id && !countedSet.has(a.id)) {
        missingAnimals.push(a);
      }
    }

    const query = this.detailSearchTerm().trim().toLowerCase();
    const tab = this.detailTab();

    let displayList: CountDetailItem[] = [];
    if (tab === 'all') {
      displayList = [
        ...countedAnimals.map((a) => ({ animal: a, isCounted: true })),
        ...missingAnimals.map((a) => ({ animal: a, isCounted: false })),
      ];
    } else if (tab === 'counted') {
      displayList = countedAnimals.map((a) => ({ animal: a, isCounted: true }));
    } else {
      displayList = missingAnimals.map((a) => ({ animal: a, isCounted: false }));
    }

    if (query) {
      displayList = displayList.filter(({ animal }) => {
        const tag = (animal.farmTagNo || '').toLowerCase();
        const nTag = (animal.nationalTagNo || '').toLowerCase();
        const name = (animal.name || '').toLowerCase();
        return tag.includes(query) || nTag.includes(query) || name.includes(query);
      });
    }

    const expected = sc.expectedCount || (countedAnimals.length + missingAnimals.length);
    const counted = countedAnimals.length;
    const successRate = expected > 0 ? Math.min(100, Math.round((counted / expected) * 100)) : 100;

    // Pagination calculations
    const page = this.detailPage();
    const pageSize = this.detailPageSize();
    const showAll = this.showAllInDetail();

    const totalPages = Math.max(1, Math.ceil(displayList.length / pageSize));
    const paginatedList = showAll ? displayList : displayList.slice((page - 1) * pageSize, page * pageSize);

    return {
      count: sc,
      expectedCount: expected,
      countedCount: counted,
      missingCount: missingAnimals.length,
      successRate,
      countedAnimals,
      missingAnimals,
      displayList,
      paginatedList,
      totalPages,
      currentPage: page,
      totalItems: displayList.length,
    };
  });

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (this.selectedCount()) {
      this.closeCountDetail();
      return;
    }
    if (this.isStartModalOpen()) {
      this.closeStartModal();
      return;
    }
    if (this.viewMode() === 'active-count') {
      this.cancelActiveCount();
      return;
    }
  }

  getTodayLocalDateString(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getCurrentLocalTimeString(): string {
    const d = new Date();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${mins}`;
  }

  // Start Count Modal Handlers
  openStartModal(type: CountType = 'genel') {
    const today = this.getTodayLocalDateString();
    const nowTime = this.getCurrentLocalTimeString();
    const firstPaddock = (this.paddocks() || [])[0]?.id || '';
    const firstHerd = (this.herds() || [])[0]?.id || '';
    const targetScopeId = type === 'padok' ? firstPaddock : (type === 'suru' ? firstHerd : '');

    this.startConfig.set({
      type,
      scopeId: targetScopeId,
      date: today,
      time: nowTime,
      deviceName: 'Manuel / RFID Barkod Okuyucu',
      note: '',
    });
    this.resumeExistingCountId.set(null);
    this.isStartModalOpen.set(true);
  }

  startNewCount(type: CountType = 'genel') {
    this.openStartModal(type);
  }

  closeStartModal() {
    this.isStartModalOpen.set(false);
  }

  setStartType(type: CountType) {
    const firstPaddock = (this.paddocks() || [])[0]?.id || '';
    const firstHerd = (this.herds() || [])[0]?.id || '';
    const targetScopeId = type === 'padok' ? firstPaddock : (type === 'suru' ? firstHerd : '');
    this.startConfig.update((c) => ({ ...c, type, scopeId: targetScopeId }));
  }

  setStartScope(scopeId: string) {
    this.startConfig.update((c) => ({ ...c, scopeId }));
  }

  updateStartConfig(field: string, value: any) {
    this.startConfig.update((c) => ({ ...c, [field]: value }));
  }

  startConfiguredCount(resumeExisting = false) {
    const cfg = this.startConfig();
    const existing = this.existingCountForSelectedScope();

    let sessionDate = new Date();
    if (cfg.date && cfg.time) {
      sessionDate = new Date(`${cfg.date}T${cfg.time}:00`);
    }

    this.activeCountType.set(cfg.type);
    this.activeScopeId.set(cfg.type === 'genel' ? '' : cfg.scopeId);
    this.activeDeviceName.set(cfg.deviceName || 'Manuel / RFID Barkod Okuyucu');
    this.activeStartedAt.set(sessionDate);
    this.sessionNote.set(cfg.note || '');

    if (resumeExisting && existing) {
      this.resumeExistingCountId.set(existing.id || null);
      this.activeCountedIds.set([...(existing.countedAnimalIds || [])]);
      this.alertService.toastInfo(`Mevcut sayım yüklendi (${existing.countedAnimalIds?.length || 0} baş sayıldı)`);
    } else {
      this.resumeExistingCountId.set(null);
      this.activeCountedIds.set([]);
    }

    this.scanInput.set('');
    this.scanFeedback.set(null);
    this.activeTab.set('missing');
    this.isStartModalOpen.set(false);
    this.viewMode.set('active-count');
  }

  async cancelActiveCount() {
    if (this.activeCountedIds().length > 0) {
      const confirmed = await this.alertService.confirm(
        'Sayımı İptal Et',
        'Devam eden sayım oturumundan çıkmak istediğinize emin misiniz? (Kaydedilmeyen veriler silinecektir)',
        'Evet, Çık',
        'Vazgeç'
      );
      if (!confirmed) {
        return;
      }
    }
    this.viewMode.set('list');
  }

  // Scanning / Tag Input
  handleScanSubmit() {
    const raw = (this.scanInput() || '').trim().toLowerCase();
    if (!raw) return;

    const animal = this.expectedAnimals().find(
      (a) =>
        (a.farmTagNo && a.farmTagNo.toLowerCase() === raw) ||
        (a.nationalTagNo && a.nationalTagNo.toLowerCase() === raw) ||
        (a.rfid && a.rfid.toLowerCase() === raw) ||
        (a.name && a.name.toLowerCase() === raw)
    );

    if (!animal || !animal.id) {
      this.scanFeedback.set({
        text: `"${raw}" bulunamadı veya bu sayım kapsamında değil!`,
        success: false,
      });
      this.scanInput.set('');
      return;
    }

    if (this.activeCountedIds().includes(animal.id)) {
      this.scanFeedback.set({
        text: `${animal.farmTagNo || animal.name} zaten sayıldı.`,
        success: false,
      });
      this.scanInput.set('');
      return;
    }

    this.activeCountedIds.update((prev) => [animal.id!, ...prev]);
    this.scanFeedback.set({
      text: `${animal.farmTagNo || animal.name} başarıyla sayıldı (+1)`,
      success: true,
    });
    this.scanInput.set('');
  }

  quickCountAnimal(a: Animal) {
    if (!a?.id) return;
    if (this.activeCountedIds().includes(a.id)) return;
    this.activeCountedIds.update((prev) => [a.id!, ...prev]);
    this.scanFeedback.set({
      text: `${a.farmTagNo || a.name} sayıldı (+1)`,
      success: true,
    });
  }

  uncountAnimal(id: string) {
    this.activeCountedIds.update((prev) => prev.filter((i) => i !== id));
  }

  async requestBluetoothDevice() {
    const nav = navigator as any;
    if (!nav.bluetooth) {
      await this.alertService.info(
        'Bluetooth Desteği Bulunamadı',
        'Tarayıcınız Web Bluetooth API desteklemiyor (Chrome masaüstü/Android önerilir). Manuel veya USB RFID okuyucu kullanabilirsiniz.'
      );
      return;
    }

    try {
      const device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
      });
      if (device?.name) {
        this.activeDeviceName.set(`BT: ${device.name}`);
        this.scanFeedback.set({
          text: `"${device.name}" Bluetooth cihazı bağlandı.`,
          success: true,
        });
        this.alertService.toastSuccess(`"${device.name}" bağlandı`);
      }
    } catch (err: any) {
      console.warn('Bluetooth bağlantısı iptal edildi veya başarısız oldu:', err);
    }
  }

  async finishAndSaveCount() {
    this.isSaving.set(true);
    try {
      const now = new Date();
      const payload: Partial<Count> = {
        type: this.activeCountType(),
        scopeId: this.activeScopeId() || undefined,
        startedAt: this.activeStartedAt(),
        finishedAt: now,
        date: this.activeStartedAt(),
        expectedCount: this.expectedAnimals().length,
        countedAnimalIds: this.activeCountedIds(),
        deviceName: this.activeDeviceName(),
        notes: this.sessionNote() || undefined,
        status: 'tamamlandi',
      };

      const existingId = this.resumeExistingCountId();
      if (existingId) {
        await this.countService.update(existingId, payload);
        this.alertService.toastSuccess('Sayım oturumu başarıyla güncellendi');
      } else {
        await this.countService.create(payload as any);
        this.alertService.toastSuccess('Sayım oturumu başarıyla kaydedildi');
      }
      this.viewMode.set('list');
    } catch (err: any) {
      console.error('Sayım kaydedilemedi:', err);
      this.alertService.error('Hata Oluştu', 'Sayım kaydedilirken bir hata oluştu.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteCount(id?: string) {
    if (!id) return;
    const confirmed = await this.alertService.confirmDelete(
      'Sayım Oturumunu Sil',
      'Bu sayım oturumunu silmek istediğinize emin misiniz?'
    );
    if (!confirmed) return;
    try {
      await this.countService.softDelete(id);
      this.alertService.toastSuccess('Sayım oturumu başarıyla silindi');
    } catch (err: any) {
      console.error('Silme hatası:', err);
      this.alertService.error('Silme Başarısız', err?.message || 'Sayım silinirken hata oluştu.');
    }
  }

  // Format Helpers
  getScopeName(type: CountType, scopeId?: string): string {
    if (type === 'padok' && scopeId) {
      return `Padok: ${this.paddockMap().get(scopeId)?.name || 'Bilinmeyen Padok'}`;
    }
    if (type === 'suru' && scopeId) {
      return `Sürü: ${this.herdMap().get(scopeId)?.name || 'Bilinmeyen Sürü'}`;
    }
    return 'Çiftlik Geneli';
  }

  getTime(val: any): number {
    if (!val) return 0;
    if (val.seconds) return val.seconds * 1000;
    if (val.toDate && typeof val.toDate === 'function') return val.toDate().getTime();
    if (val instanceof Date) return val.getTime();
    return new Date(val).getTime() || 0;
  }

  formatDate(val: any): string {
    if (!val) return '';
    let d: Date;
    if (val instanceof Date) d = val;
    else if (val.toDate && typeof val.toDate === 'function') d = val.toDate();
    else if (val.seconds) d = new Date(val.seconds * 1000);
    else d = new Date(val);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().substring(0, 10);
  }

  formatTimeOnly(val: any): string {
    if (!val) return '';
    let d: Date;
    if (val instanceof Date) d = val;
    else if (val.toDate && typeof val.toDate === 'function') d = val.toDate();
    else if (val.seconds) d = new Date(val.seconds * 1000);
    else d = new Date(val);
    if (isNaN(d.getTime())) return '';
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${mins}`;
  }

  formatDateTime(val: any): string {
    if (!val) return '—';
    let d: Date;
    if (val instanceof Date) {
      d = val;
    } else if (val.toDate && typeof val.toDate === 'function') {
      d = val.toDate();
    } else if (val.seconds) {
      d = new Date(val.seconds * 1000);
    } else {
      d = new Date(val);
    }
    if (isNaN(d.getTime())) return '—';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${mins}`;
  }

  getDurationText(startVal: any, finishVal: any): string {
    if (!startVal) return '';
    const tStart = this.getTime(startVal);
    const tFinish = finishVal ? this.getTime(finishVal) : 0;
    if (!tStart) return '';
    if (!tFinish) return 'Devam ediyor';

    const diffMs = Math.max(0, tFinish - tStart);
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 1) return '< 1 dk';
    if (diffMins >= 60) {
      const h = Math.floor(diffMins / 60);
      const m = diffMins % 60;
      return `${h} sa ${m} dk`;
    }
    return `${diffMins} dk`;
  }

  copyMissingTags() {
    const details = this.selectedCountDetails();
    if (!details || details.missingAnimals.length === 0) {
      this.alertService.toastSuccess('Eksik hayvan bulunmuyor.');
      return;
    }
    const tags = details.missingAnimals.map((a) => a.farmTagNo || a.name || a.id).join(', ');
    navigator.clipboard.writeText(tags);
    this.alertService.toastSuccess(`${details.missingAnimals.length} eksik hayvan küpesi panoya kopyalandı!`);
  }

  downloadMissingCsv() {
    const details = this.selectedCountDetails();
    if (!details || details.missingAnimals.length === 0) {
      this.alertService.toastSuccess('Eksik hayvan bulunmuyor.');
      return;
    }

    const rows = [
      ['Ciftlik Kupe No', 'Ulusal Kupe No', 'Isim', 'Tur', 'Irk', 'Padok', 'Suru'],
      ...details.missingAnimals.map((a) => [
        a.farmTagNo || '',
        a.nationalTagNo || '',
        a.name || '',
        a.species || '',
        a.breed || '',
        this.paddockMap().get(a.paddockId || '')?.name || '',
        this.herdMap().get(a.herdId || '')?.name || '',
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.map(val => `"${val}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `eksik_hayvanlar_${this.formatDate(new Date())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.alertService.toastSuccess('Eksik hayvanlar listesi CSV olarak indirildi');
  }

  openCountDetail(c: Count) {
    this.selectedCount.set(c);
    this.detailSearchTerm.set('');
    this.detailTab.set('all');
    this.detailPage.set(1);
    this.showAllInDetail.set(false);
  }

  closeCountDetail() {
    this.selectedCount.set(null);
  }

  setDetailPage(p: number) {
    this.detailPage.set(p);
  }

  onDetailSearchChange(val: string) {
    this.detailSearchTerm.set(val);
    this.detailPage.set(1);
  }

  setDetailTab(tab: 'all' | 'counted' | 'missing') {
    this.detailTab.set(tab);
    this.detailPage.set(1);
  }

  toggleShowAllInDetail() {
    this.showAllInDetail.update((v) => !v);
  }
}
