import { Component, computed, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { toSignal } from '@angular/core/rxjs-interop';
import { AnimalMovementService } from '../../core/services/animal-movement.service';
import { AnimalService } from '../../core/services/animal.service';
import { PaddockService } from '../../core/services/definitions/paddock.service';
import { HerdService } from '../../core/services/definitions/herd.service';
import { AnimalMovement, Animal, Paddock, Herd } from '../../core/models/animal.model';
import { AlertService } from '../../core/services/alert.service';

@Component({
  selector: 'app-animal-movements',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './animal-movements.component.html',
  styleUrls: ['./animal-movements.component.scss'],
})
export class AnimalMovementsComponent {
  private movementService = inject(AnimalMovementService);
  private animalService = inject(AnimalService);
  private paddockService = inject(PaddockService);
  private herdService = inject(HerdService);
  private alertService = inject(AlertService);

  readonly movements = toSignal(this.movementService.list(), { initialValue: [] as AnimalMovement[] });
  readonly animals = toSignal(this.animalService.list(), { initialValue: [] as Animal[] });
  readonly paddocks = toSignal(this.paddockService.list(), { initialValue: [] as Paddock[] });
  readonly herds = toSignal(this.herdService.list(), { initialValue: [] as Herd[] });

  // UI state
  readonly searchTerm = signal('');
  readonly typeFilter = signal<string | null>(null);
  readonly showDrawer = signal(false);
  readonly isEditing = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // Form Model
  readonly form = signal<{
    animalId: string;
    type: 'padok' | 'suru' | 'ciftlik-giris' | 'ciftlik-cikis';
    fromId?: string;
    toId?: string;
    date: string;
    note?: string;
    updateAnimalCurrentLocation: boolean;
  }>({
    animalId: '',
    type: 'padok',
    fromId: '',
    toId: '',
    date: new Date().toISOString().substring(0, 10),
    note: '',
    updateAnimalCurrentLocation: true,
  });

  // Maps
  readonly animalMap = computed(() => {
    const map = new Map<string, Animal>();
    for (const a of this.animals() || []) {
      if (a?.id) map.set(a.id, a);
    }
    return map;
  });

  readonly paddockMap = computed(() => {
    const map = new Map<string, string>();
    for (const p of this.paddocks() || []) {
      if (p?.id) map.set(p.id, p.name);
    }
    return map;
  });

  readonly herdMap = computed(() => {
    const map = new Map<string, string>();
    for (const h of this.herds() || []) {
      if (h?.id) map.set(h.id, h.name);
    }
    return map;
  });

  // Filtered List
  readonly filteredMovements = computed(() => {
    let list = this.movements() || [];
    const query = (this.searchTerm() || '').trim().toLowerCase();
    const typeF = this.typeFilter();

    if (typeF) {
      if (typeF === 'satis' || typeF === 'kesim' || typeF === 'olum') {
        list = list.filter((m) => m && m.type === 'ciftlik-cikis' && this.getMovementSubCategory(m) === typeF);
      } else {
        list = list.filter((m) => m && m.type === typeF);
      }
    }

    if (query) {
      list = list.filter((m) => {
        if (!m) return false;
        const animal = this.animalMap().get(m.animalId);
        const tag = animal?.farmTagNo?.toLowerCase() || '';
        const name = animal?.name?.toLowerCase() || '';
        const note = m.note?.toLowerCase() || '';

        return tag.includes(query) || name.includes(query) || note.includes(query);
      });
    }

    return [...(list || [])].filter(Boolean).sort((a, b) => {
      const timeA = this.getTime(a.date);
      const timeB = this.getTime(b.date);
      return timeB - timeA;
    });
  });

  // Stats
  readonly totalCount = computed(() => (this.movements() || []).length);

  readonly paddockMovementsCount = computed(() => {
    return (this.movements() || []).filter((m) => m && m.type === 'padok').length;
  });

  readonly herdMovementsCount = computed(() => {
    return (this.movements() || []).filter((m) => m && m.type === 'suru').length;
  });

  readonly saleMovementsCount = computed(() => {
    return (this.movements() || []).filter((m) => m && m.type === 'ciftlik-cikis' && this.getMovementSubCategory(m) === 'satis').length;
  });

  readonly slaughterMovementsCount = computed(() => {
    return (this.movements() || []).filter((m) => m && m.type === 'ciftlik-cikis' && this.getMovementSubCategory(m) === 'kesim').length;
  });

  readonly deathMovementsCount = computed(() => {
    return (this.movements() || []).filter((m) => m && m.type === 'ciftlik-cikis' && this.getMovementSubCategory(m) === 'olum').length;
  });

  readonly farmInOutCount = computed(() => {
    return (this.movements() || []).filter((m) => m && (m.type === 'ciftlik-giris' || m.type === 'ciftlik-cikis')).length;
  });

  // Helpers
  getMovementSubCategory(item: AnimalMovement): 'satis' | 'kesim' | 'olum' | 'diger' {
    if (!item) return 'diger';
    const note = (item.note || '').toLowerCase();
    if (note.includes('satış') || note.includes('satis') || item.toId === 'satis') return 'satis';
    if (note.includes('kesim') || item.toId === 'kesim') return 'kesim';
    if (note.includes('ölüm') || note.includes('olum') || item.toId === 'olum') return 'olum';
    return 'diger';
  }

  getMovementBadgeInfo(item: AnimalMovement): { label: string; bgClass: string; textClass: string; icon: string } {
    if (item.type === 'padok') {
      return {
        label: 'Padok Değişimi',
        bgClass: 'bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/50',
        textClass: 'text-indigo-700 dark:text-indigo-400',
        icon: 'holiday_village',
      };
    }
    if (item.type === 'suru') {
      return {
        label: 'Sürü Transferi',
        bgClass: 'bg-purple-50 dark:bg-purple-950/50 border border-purple-200/50',
        textClass: 'text-purple-700 dark:text-purple-400',
        icon: 'groups',
      };
    }
    if (item.type === 'ciftlik-giris') {
      return {
        label: 'Çiftlik Girişi',
        bgClass: 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/50',
        textClass: 'text-emerald-700 dark:text-emerald-400',
        icon: 'login',
      };
    }
    // ciftlik-cikis subcategories
    const sub = this.getMovementSubCategory(item);
    if (sub === 'satis') {
      return {
        label: 'Satış (Çıkış)',
        bgClass: 'bg-teal-50 dark:bg-teal-950/50 border border-teal-200/50',
        textClass: 'text-teal-700 dark:text-teal-400',
        icon: 'point_of_sale',
      };
    }
    if (sub === 'kesim') {
      return {
        label: 'Kesim (Çıkış)',
        bgClass: 'bg-amber-50 dark:bg-amber-950/50 border border-amber-200/50',
        textClass: 'text-amber-700 dark:text-amber-400',
        icon: 'content_cut',
      };
    }
    if (sub === 'olum') {
      return {
        label: 'Ölüm (Çıkış)',
        bgClass: 'bg-rose-50 dark:bg-rose-950/50 border border-rose-200/50',
        textClass: 'text-rose-700 dark:text-rose-400',
        icon: 'heart_broken',
      };
    }
    return {
      label: 'Çiftlik Çıkışı',
      bgClass: 'bg-rose-50 dark:bg-rose-950/50 border border-rose-200/50',
      textClass: 'text-rose-700 dark:text-rose-400',
      icon: 'logout',
    };
  }

  getFromDisplay(item: AnimalMovement): string {
    if (item.fromId) {
      if (item.type === 'padok') return this.paddockMap().get(item.fromId) || 'Padok';
      if (item.type === 'suru') return this.herdMap().get(item.fromId) || 'Sürü';
      const pName = this.paddockMap().get(item.fromId);
      if (pName) return pName;
    }
    const animal = this.getAnimal(item.animalId);
    if (animal?.paddockId && this.paddockMap().has(animal.paddockId)) {
      return this.paddockMap().get(animal.paddockId)!;
    }
    if (animal?.herdId && this.herdMap().has(animal.herdId)) {
      return this.herdMap().get(animal.herdId)!;
    }
    return item.type === 'ciftlik-giris' ? 'Dış Kaynak' : 'Çiftlik';
  }

  getToDisplay(item: AnimalMovement): string {
    if (item.type === 'padok') {
      return item.toId ? (this.paddockMap().get(item.toId) || 'Padok') : '—';
    }
    if (item.type === 'suru') {
      return item.toId ? (this.herdMap().get(item.toId) || 'Sürü') : '—';
    }
    if (item.type === 'ciftlik-giris') {
      const animal = this.getAnimal(item.animalId);
      return (animal?.paddockId && this.paddockMap().get(animal.paddockId)) || 'Sürü / Çiftlik';
    }
    // ciftlik-cikis
    const sub = this.getMovementSubCategory(item);
    if (sub === 'satis') {
      const note = item.note || '';
      const match = note.match(/Cari:\s*([^,]+)/i);
      if (match && match[1]) {
        return `Alıcı: ${match[1].trim()}`;
      }
      const animal = this.getAnimal(item.animalId);
      if (animal?.saleAccountTitle) {
        return `Alıcı: ${animal.saleAccountTitle}`;
      }
      return 'Alıcı Cari (Satıldı)';
    }
    if (sub === 'kesim') {
      return 'Mezbaha / Kesim';
    }
    if (sub === 'olum') {
      return 'Zayiat / Vefat';
    }
    return 'Çiftlik Dışı';
  }

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

  getAnimal(id: string): Animal | undefined {
    return this.animalMap().get(id);
  }

  getLocationName(type: string, id?: string): string {
    if (!id) return '—';
    if (type === 'padok') {
      return this.paddockMap().get(id) || 'Bilinmeyen Padok';
    }
    if (type === 'suru') {
      return this.herdMap().get(id) || 'Bilinmeyen Sürü';
    }
    return id;
  }

  // Form helpers
  onAnimalSelect(animalId: string) {
    this.updateFormField('animalId', animalId);
    const animal = this.getAnimal(animalId);
    if (animal) {
      if (this.form().type === 'padok' && animal.paddockId) {
        this.updateFormField('fromId', animal.paddockId);
      } else if (this.form().type === 'suru' && animal.herdId) {
        this.updateFormField('fromId', animal.herdId);
      }
    }
  }

  onTypeChange(type: 'padok' | 'suru' | 'ciftlik-giris' | 'ciftlik-cikis') {
    this.updateFormField('type', type);
    const animal = this.getAnimal(this.form().animalId);
    if (animal) {
      if (type === 'padok') {
        this.updateFormField('fromId', animal.paddockId || '');
        this.updateFormField('toId', '');
      } else if (type === 'suru') {
        this.updateFormField('fromId', animal.herdId || '');
        this.updateFormField('toId', '');
      } else {
        this.updateFormField('fromId', '');
        this.updateFormField('toId', '');
      }
    }
  }

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

  openAddDrawer() {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.errorMessage.set(null);
    this.isDirty.set(false);
    const firstAnimal = (this.animals() || [])[0];
    const initial = {
      animalId: firstAnimal?.id || '',
      type: 'padok' as const,
      fromId: firstAnimal?.paddockId || '',
      toId: '',
      date: new Date().toISOString().substring(0, 10),
      note: '',
      updateAnimalCurrentLocation: true,
    };
    this.form.set(initial);
    this.initialSnapshot = JSON.stringify(initial);
    this.showDrawer.set(true);
  }

  openEditDrawer(movement: AnimalMovement) {
    this.isEditing.set(true);
    this.editingId.set(movement.id || null);
    this.errorMessage.set(null);
    this.isDirty.set(false);
    const initial = {
      animalId: movement.animalId,
      type: movement.type,
      fromId: movement.fromId || '',
      toId: movement.toId || '',
      date: this.formatDate(movement.date),
      note: movement.note || '',
      updateAnimalCurrentLocation: false,
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
    return !this.isEditing() && (!!f.toId || !!f.note?.trim());
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
    this.errorMessage.set(null);
  }

  updateFormField<K extends keyof ReturnType<typeof this.form>>(field: K, value: any) {
    this.isDirty.set(true);
    this.form.update((prev) => ({ ...prev, [field]: value }));
  }

  async saveMovement() {
    const f = this.form();
    if (!f.animalId) {
      this.errorMessage.set('Lütfen bir hayvan seçiniz.');
      return;
    }
    if ((f.type === 'padok' || f.type === 'suru') && !f.toId) {
      this.errorMessage.set('Lütfen hedef padok / sürüyü seçiniz.');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    try {
      const payload: Partial<AnimalMovement> = {
        animalId: f.animalId,
        type: f.type,
        fromId: f.fromId || undefined,
        toId: f.toId || undefined,
        date: f.date,
        note: f.note || undefined,
      };

      if (this.isEditing() && this.editingId()) {
        await this.movementService.update(this.editingId()!, payload);
      } else {
        await this.movementService.create(payload as any);

        // Optionally update animal's current paddockId or herdId
        if (f.updateAnimalCurrentLocation && f.toId) {
          if (f.type === 'padok') {
            await this.animalService.update(f.animalId, { paddockId: f.toId });
          } else if (f.type === 'suru') {
            await this.animalService.update(f.animalId, { herdId: f.toId });
          }
        }
      }

      this.closeDrawer();
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Kayıt sırasında bir hata oluştu.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteMovement(id: string) {
    const confirmed = await this.alertService.confirmDelete(
      'Hareket Kaydını Sil',
      'Bu hareket kaydını silmek istediğinize emin misiniz?'
    );
    if (!confirmed) return;
    try {
      await this.movementService.softDelete(id);
      this.alertService.toastSuccess('Hareket kaydı başarıyla silindi');
    } catch (err: any) {
      this.alertService.error('Silme Başarısız', err.message);
    }
  }
}
