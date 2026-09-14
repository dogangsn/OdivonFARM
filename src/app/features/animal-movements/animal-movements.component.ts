import { Component, computed, inject, signal } from '@angular/core';
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
      list = list.filter((m) => m && m.type === typeF);
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

  readonly farmInOutCount = computed(() => {
    return (this.movements() || []).filter((m) => m && (m.type === 'ciftlik-giris' || m.type === 'ciftlik-cikis')).length;
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

  openAddDrawer() {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.errorMessage.set(null);
    const firstAnimal = (this.animals() || [])[0];
    this.form.set({
      animalId: firstAnimal?.id || '',
      type: 'padok',
      fromId: firstAnimal?.paddockId || '',
      toId: '',
      date: new Date().toISOString().substring(0, 10),
      note: '',
      updateAnimalCurrentLocation: true,
    });
    this.showDrawer.set(true);
  }

  openEditDrawer(movement: AnimalMovement) {
    this.isEditing.set(true);
    this.editingId.set(movement.id || null);
    this.errorMessage.set(null);
    this.form.set({
      animalId: movement.animalId,
      type: movement.type,
      fromId: movement.fromId || '',
      toId: movement.toId || '',
      date: this.formatDate(movement.date),
      note: movement.note || '',
      updateAnimalCurrentLocation: false,
    });
    this.showDrawer.set(true);
  }

  closeDrawer() {
    this.showDrawer.set(false);
  }

  updateFormField<K extends keyof ReturnType<typeof this.form>>(field: K, value: any) {
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
    if (!confirm('Bu hareket kaydını silmek istediğinize emin misiniz?')) return;
    try {
      await this.movementService.softDelete(id);
    } catch (err: any) {
      alert('Silme işlemi başarısız: ' + err.message);
    }
  }
}
