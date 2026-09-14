import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { toSignal } from '@angular/core/rxjs-interop';
import { WeightRecordService } from '../../core/services/weight-record.service';
import { AnimalService } from '../../core/services/animal.service';
import { WeightRecord } from '../../core/models/production.model';
import { Animal } from '../../core/models/animal.model';

interface EnrichedWeightRecord extends WeightRecord {
  previousWeightKg?: number;
  weightDiffKg?: number;
  daysDiff?: number;
  dailyGainGrams?: number; // ADG in grams/day
}

@Component({
  selector: 'app-weights',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './weights.component.html',
  styleUrls: ['./weights.component.scss'],
})
export class WeightsComponent {
  private weightService = inject(WeightRecordService);
  private animalService = inject(AnimalService);

  readonly weightRecords = toSignal(this.weightService.list(), { initialValue: [] as WeightRecord[] });
  readonly animals = toSignal(this.animalService.list(), { initialValue: [] as Animal[] });

  // UI state
  readonly searchTerm = signal('');
  readonly selectedAnimalFilter = signal<string | null>(null);
  readonly showDrawer = signal(false);
  readonly isEditing = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // Form Model
  readonly form = signal<{
    animalId: string;
    date: string;
    weightKg: number | null;
    note?: string;
  }>({
    animalId: '',
    date: new Date().toISOString().substring(0, 10),
    weightKg: null,
    note: '',
  });

  // Animal Map
  readonly animalMap = computed(() => {
    const map = new Map<string, Animal>();
    for (const a of this.animals()) {
      if (a.id) map.set(a.id, a);
    }
    return map;
  });

  // Calculate Enriched Records with Difference & ADG
  readonly enrichedRecords = computed(() => {
    const records = this.weightRecords() || [];
    const animalMap = this.animalMap();

    // Group records by animal
    const byAnimal = new Map<string, WeightRecord[]>();
    for (const r of records) {
      if (!r) continue;
      const list = byAnimal.get(r.animalId) || [];
      list.push(r);
      byAnimal.set(r.animalId, list);
    }

    const enrichedList: EnrichedWeightRecord[] = [];

    // For each animal, sort by date ascending to calculate diffs
    for (const [animalId, list] of byAnimal.entries()) {
      const sorted = [...list].sort((a, b) => {
        const timeA = this.getTime(a.date);
        const timeB = this.getTime(b.date);
        return timeA - timeB;
      });

      for (let i = 0; i < sorted.length; i++) {
        const current = sorted[i];
        const prev = i > 0 ? sorted[i - 1] : null;

        let weightDiffKg: number | undefined;
        let daysDiff: number | undefined;
        let dailyGainGrams: number | undefined;

        if (prev) {
          weightDiffKg = Math.round((current.weightKg - prev.weightKg) * 10) / 10;
          const diffMs = this.getTime(current.date) - this.getTime(prev.date);
          daysDiff = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
          if (daysDiff > 0) {
            dailyGainGrams = Math.round(((current.weightKg - prev.weightKg) * 1000) / daysDiff);
          }
        }

        enrichedList.push({
          ...current,
          previousWeightKg: prev ? prev.weightKg : undefined,
          weightDiffKg,
          daysDiff,
          dailyGainGrams,
        });
      }
    }

    // Sort descending by date for display
    return enrichedList.sort((a, b) => this.getTime(b.date) - this.getTime(a.date));
  });

  // Filtered Records
  readonly filteredRecords = computed(() => {
    let list = this.enrichedRecords();
    const query = this.searchTerm().trim().toLowerCase();
    const animalF = this.selectedAnimalFilter();

    if (animalF) {
      list = list.filter((r) => r.animalId === animalF);
    }

    if (query) {
      list = list.filter((r) => {
        const animal = this.animalMap().get(r.animalId);
        const tag = animal?.farmTagNo.toLowerCase() || '';
        const name = animal?.name?.toLowerCase() || '';
        const note = r.note?.toLowerCase() || '';
        return tag.includes(query) || name.includes(query) || note.includes(query);
      });
    }

    return list;
  });

  // Stats
  readonly totalRecords = computed(() => (this.weightRecords() || []).length);

  readonly averageWeight = computed(() => {
    const list = this.weightRecords() || [];
    if (list.length === 0) return 0;
    const total = list.reduce((sum, r) => sum + (Number(r?.weightKg) || 0), 0);
    return Math.round((total / list.length) * 10) / 10;
  });

  readonly weighedAnimalsCount = computed(() => {
    const unique = new Set((this.weightRecords() || []).map((r) => r?.animalId).filter(Boolean));
    return unique.size;
  });

  readonly highestWeight = computed(() => {
    const list = this.weightRecords() || [];
    if (list.length === 0) return 0;
    return Math.max(...list.map((r) => Number(r?.weightKg) || 0));
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

  // Drawer / Form Actions
  openAddDrawer() {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.errorMessage.set(null);
    this.form.set({
      animalId: this.animals().length > 0 ? this.animals()[0].id! : '',
      date: new Date().toISOString().substring(0, 10),
      weightKg: null,
      note: '',
    });
    this.showDrawer.set(true);
  }

  openEditDrawer(record: WeightRecord) {
    this.isEditing.set(true);
    this.editingId.set(record.id || null);
    this.errorMessage.set(null);
    this.form.set({
      animalId: record.animalId,
      date: this.formatDate(record.date),
      weightKg: record.weightKg,
      note: record.note || '',
    });
    this.showDrawer.set(true);
  }

  closeDrawer() {
    this.showDrawer.set(false);
  }

  updateFormField<K extends keyof ReturnType<typeof this.form>>(field: K, value: any) {
    this.form.update((prev) => ({ ...prev, [field]: value }));
  }

  async saveWeight() {
    const f = this.form();
    if (!f.animalId) {
      this.errorMessage.set('Lütfen bir hayvan seçiniz.');
      return;
    }
    if (!f.weightKg || Number(f.weightKg) <= 0) {
      this.errorMessage.set('Lütfen geçerli bir ağırlık (kg) değeri giriniz.');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    try {
      const payload: Partial<WeightRecord> = {
        animalId: f.animalId,
        date: f.date,
        weightKg: Number(f.weightKg),
        note: f.note || undefined,
      };

      if (this.isEditing() && this.editingId()) {
        await this.weightService.update(this.editingId()!, payload);
      } else {
        await this.weightService.create(payload as any);
      }

      this.closeDrawer();
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Kayıt sırasında bir hata oluştu.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteRecord(id: string) {
    if (!confirm('Bu tartım kaydını silmek istediğinize emin misiniz?')) return;
    try {
      await this.weightService.softDelete(id);
    } catch (err: any) {
      alert('Silme işlemi başarısız: ' + err.message);
    }
  }
}
