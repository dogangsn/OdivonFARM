import { Component, computed, inject, signal } from '@angular/core';
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

  readonly counts = toSignal(this.countService.list(), { initialValue: [] as Count[] });
  readonly animals = toSignal(this.animalService.list(), { initialValue: [] as Animal[] });
  readonly paddocks = toSignal(this.paddockService.list(), { initialValue: [] as Paddock[] });
  readonly herds = toSignal(this.herdService.list(), { initialValue: [] as Herd[] });

  // View Mode: 'list' | 'active-count'
  readonly viewMode = signal<'list' | 'active-count'>('list');

  // Filters
  readonly searchTerm = signal('');
  readonly typeFilter = signal<'all' | CountType>('all');

  // Active Count Session State
  readonly activeCountType = signal<CountType>('genel');
  readonly activeScopeId = signal<string>('');
  readonly activeDeviceName = signal<string>('Manuel / RFID Barkod');
  readonly activeStartedAt = signal<Date>(new Date());
  readonly activeCountedIds = signal<string[]>([]);
  readonly scanInput = signal<string>('');
  readonly scanFeedback = signal<{ text: string; success: boolean } | null>(null);
  readonly activeTab = signal<'missing' | 'counted'>('missing');
  readonly isSaving = signal(false);

  // Selected past count for detail modal
  readonly selectedCount = signal<Count | null>(null);

  // Maps
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

  // Filtered Count Sessions List
  readonly filteredCounts = computed(() => {
    let list = this.counts() || [];
    const query = (this.searchTerm() || '').trim().toLowerCase();
    const typeF = this.typeFilter();

    if (typeF !== 'all') {
      list = list.filter((c) => c.type === typeF);
    }

    if (query) {
      list = list.filter((c) => {
        const scope = this.getScopeName(c.type, c.scopeId).toLowerCase();
        const dev = c.deviceName?.toLowerCase() || '';
        return scope.includes(query) || dev.includes(query);
      });
    }

    return [...(list || [])].sort((a, b) => {
      const timeA = this.getTime(a.startedAt);
      const timeB = this.getTime(b.startedAt);
      return timeB - timeA;
    });
  });

  // Stats
  readonly stats = computed(() => {
    const list = this.counts() || [];
    const totalCountedAllTime = list.reduce((sum, c) => sum + (c.countedAnimalIds?.length || 0), 0);

    return {
      totalSessions: list.length,
      totalCountedAllTime,
      totalAnimalsInFarm: (this.animals() || []).filter((a) => a.status === 'aktif').length,
    };
  });

  // Session Control
  startNewCount(type: CountType = 'genel') {
    this.activeCountType.set(type);
    const firstPaddock = (this.paddocks() || [])[0]?.id || '';
    const firstHerd = (this.herds() || [])[0]?.id || '';

    if (type === 'padok') this.activeScopeId.set(firstPaddock);
    else if (type === 'suru') this.activeScopeId.set(firstHerd);
    else this.activeScopeId.set('');

    this.activeDeviceName.set('Manuel / RFID Barkod Okuyucu');
    this.activeStartedAt.set(new Date());
    this.activeCountedIds.set([]);
    this.scanInput.set('');
    this.scanFeedback.set(null);
    this.activeTab.set('missing');
    this.viewMode.set('active-count');
  }

  cancelActiveCount() {
    if (this.activeCountedIds().length > 0) {
      if (!confirm('Devam eden sayım iptal edilecek. Emin misiniz?')) {
        return;
      }
    }
    this.viewMode.set('list');
  }

  // Scanning / Tag Input
  handleScanSubmit() {
    const raw = (this.scanInput() || '').trim().toLowerCase();
    if (!raw) return;

    // Find animal matching raw against farmTagNo, nationalTagNo, rfid or name
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

    // Add to counted
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

  // Bluetooth Web API attempt
  async requestBluetoothDevice() {
    const nav = navigator as any;
    if (!nav.bluetooth) {
      alert('Tarayıcınız Web Bluetooth API desteklemiyor (Chrome masaüstü/Android önerilir). Manuel veya USB RFID okuyucu kullanabilirsiniz.');
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
      }
    } catch (err: any) {
      console.warn('Bluetooth bağlantısı iptal edildi veya başarısız oldu:', err);
    }
  }

  async finishAndSaveCount() {
    this.isSaving.set(true);
    try {
      const payload: Partial<Count> = {
        type: this.activeCountType(),
        scopeId: this.activeScopeId() || undefined,
        startedAt: this.activeStartedAt(),
        finishedAt: new Date(),
        expectedCount: this.expectedAnimals().length,
        countedAnimalIds: this.activeCountedIds(),
        deviceName: this.activeDeviceName(),
      };

      await this.countService.create(payload as any);
      this.viewMode.set('list');
    } catch (err: any) {
      console.error('Sayım kaydedilemedi:', err);
      alert('Sayım kaydedilirken bir hata oluştu.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteCount(id?: string) {
    if (!id) return;
    if (!confirm('Bu sayım oturumunu silmek istediğinize emin misiniz?')) {
      return;
    }
    try {
      await this.countService.softDelete(id);
    } catch (err) {
      console.error('Silme hatası:', err);
    }
  }

  // Helpers
  getScopeName(type: CountType, scopeId?: string): string {
    if (type === 'padok' && scopeId) {
      return `Padok: ${this.paddockMap().get(scopeId)?.name || 'Bilinmeyen Padok'}`;
    }
    if (type === 'suru' && scopeId) {
      return `Sürü: ${this.herdMap().get(scopeId)?.name || 'Bilinmeyen Sürü'}`;
    }
    return 'Çiftlik Geneli';
  }

  getAnimal(id: string): Animal | undefined {
    return this.animalMap().get(id);
  }

  private getTime(val: any): number {
    if (!val) return 0;
    if (val.seconds) return val.seconds * 1000;
    if (val.toDate && typeof val.toDate === 'function') return val.toDate().getTime();
    if (val instanceof Date) return val.getTime();
    return new Date(val).getTime() || 0;
  }
}
