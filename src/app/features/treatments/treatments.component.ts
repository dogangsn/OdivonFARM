import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { toSignal } from '@angular/core/rxjs-interop';
import { TreatmentService } from '../../core/services/treatment.service';
import { AnimalService } from '../../core/services/animal.service';
import { TreatmentTypeService } from '../../core/services/definitions/treatment-type.service';
import { DiseaseService } from '../../core/services/definitions/disease.service';
import { Treatment, TreatmentType, Disease } from '../../core/models/health.model';
import { Animal } from '../../core/models/animal.model';

@Component({
  selector: 'app-treatments',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './treatments.component.html',
  styleUrls: ['./treatments.component.scss'],
})
export class TreatmentsComponent {
  private treatmentService = inject(TreatmentService);
  private animalService = inject(AnimalService);
  private treatmentTypeService = inject(TreatmentTypeService);
  private diseaseService = inject(DiseaseService);

  // Raw data streams
  readonly treatments = toSignal(this.treatmentService.list(), { initialValue: [] as Treatment[] });
  readonly animals = toSignal(this.animalService.list(), { initialValue: [] as Animal[] });
  readonly treatmentTypes = toSignal(this.treatmentTypeService.list(), { initialValue: [] as TreatmentType[] });
  readonly diseases = toSignal(this.diseaseService.list(), { initialValue: [] as Disease[] });

  // UI State
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
    treatmentTypeId: string;
    diseaseId?: string;
    date: string;
    dosage?: string;
    performedBy?: string;
    cost?: number;
    note?: string;
  }>({
    animalId: '',
    treatmentTypeId: '',
    diseaseId: '',
    date: new Date().toISOString().substring(0, 10),
    dosage: '',
    performedBy: '',
    cost: undefined,
    note: '',
  });

  // Map helpers
  readonly animalMap = computed(() => {
    const map = new Map<string, Animal>();
    for (const a of this.animals()) {
      if (a.id) map.set(a.id, a);
    }
    return map;
  });

  readonly treatmentTypeMap = computed(() => {
    const map = new Map<string, string>();
    for (const t of this.treatmentTypes()) {
      if (t.id) map.set(t.id, t.name);
    }
    return map;
  });

  readonly diseaseMap = computed(() => {
    const map = new Map<string, string>();
    for (const d of this.diseases()) {
      if (d.id) map.set(d.id, d.name);
    }
    return map;
  });

  // Filtered List
  readonly filteredTreatments = computed(() => {
    let list = this.treatments() || [];
    const query = (this.searchTerm() || '').trim().toLowerCase();
    const typeF = this.typeFilter();

    if (typeF) {
      list = list.filter((t) => t && t.treatmentTypeId === typeF);
    }

    if (query) {
      list = list.filter((t) => {
        if (!t) return false;
        const animal = this.animalMap().get(t.animalId);
        const typeName = this.treatmentTypeMap().get(t.treatmentTypeId) || '';
        const diseaseName = t.diseaseId ? this.diseaseMap().get(t.diseaseId) || '' : '';
        const performed = t.performedBy || '';
        const note = t.note || '';

        return (
          (animal?.farmTagNo && animal.farmTagNo.toLowerCase().includes(query)) ||
          (animal?.name && animal.name.toLowerCase().includes(query)) ||
          typeName.toLowerCase().includes(query) ||
          diseaseName.toLowerCase().includes(query) ||
          performed.toLowerCase().includes(query) ||
          note.toLowerCase().includes(query)
        );
      });
    }

    // Sort descending by date
    return [...(list || [])].sort((a, b) => {
      const dateA = a && a.date ? (typeof a.date === 'string' ? new Date(a.date).getTime() : a.date.seconds ? a.date.seconds * 1000 : 0) : 0;
      const dateB = b && b.date ? (typeof b.date === 'string' ? new Date(b.date).getTime() : b.date.seconds ? b.date.seconds * 1000 : 0) : 0;
      return dateB - dateA;
    });
  });

  // Statistics
  readonly totalTreatments = computed(() => (this.treatments() || []).length);

  readonly totalCost = computed(() => {
    return (this.treatments() || []).reduce((sum, t) => sum + (Number(t?.cost) || 0), 0);
  });

  readonly vaccineCount = computed(() => {
    return (this.treatments() || []).filter((t) => {
      if (!t) return false;
      const name = (this.treatmentTypeMap().get(t.treatmentTypeId) || '').toLowerCase();
      return name.includes('aşı') || name.includes('asi') || name.includes('vaccin');
    }).length;
  });

  readonly antibioticCount = computed(() => {
    return (this.treatments() || []).filter((t) => {
      if (!t) return false;
      const name = (this.treatmentTypeMap().get(t.treatmentTypeId) || '').toLowerCase();
      return name.includes('antibiyotik') || name.includes('tedavi');
    }).length;
  });

  // Helpers
  getAnimalTag(animalId: string): string {
    const animal = this.animalMap().get(animalId);
    return animal ? animal.farmTagNo : animalId;
  }

  getAnimalName(animalId: string): string | undefined {
    return this.animalMap().get(animalId)?.name;
  }

  getTreatmentTypeName(typeId: string): string {
    return this.treatmentTypeMap().get(typeId) || 'Belirtilmemiş';
  }

  getDiseaseName(diseaseId?: string): string {
    if (!diseaseId) return '—';
    return this.diseaseMap().get(diseaseId) || '—';
  }

  formatDate(d: any): string {
    if (!d) return '—';
    if (typeof d === 'string') return d.substring(0, 10);
    if (d.seconds) {
      return new Date(d.seconds * 1000).toISOString().substring(0, 10);
    }
    if (d instanceof Date) {
      return d.toISOString().substring(0, 10);
    }
    return String(d);
  }

  // Actions
  openAddDrawer() {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.errorMessage.set(null);
    this.form.set({
      animalId: this.animals().length > 0 ? this.animals()[0].id! : '',
      treatmentTypeId: this.treatmentTypes().length > 0 ? this.treatmentTypes()[0].id! : '',
      diseaseId: '',
      date: new Date().toISOString().substring(0, 10),
      dosage: '',
      performedBy: '',
      cost: undefined,
      note: '',
    });
    this.showDrawer.set(true);
  }

  openEditDrawer(treatment: Treatment) {
    this.isEditing.set(true);
    this.editingId.set(treatment.id || null);
    this.errorMessage.set(null);
    this.form.set({
      animalId: treatment.animalId,
      treatmentTypeId: treatment.treatmentTypeId,
      diseaseId: treatment.diseaseId || '',
      date: this.formatDate(treatment.date),
      dosage: treatment.dosage || '',
      performedBy: treatment.performedBy || '',
      cost: treatment.cost,
      note: treatment.note || '',
    });
    this.showDrawer.set(true);
  }

  closeDrawer() {
    this.showDrawer.set(false);
  }

  updateFormField<K extends keyof ReturnType<typeof this.form>>(field: K, value: any) {
    this.form.update((prev) => ({ ...prev, [field]: value }));
  }

  async saveTreatment() {
    const f = this.form();
    if (!f.animalId) {
      this.errorMessage.set('Lütfen bir hayvan seçiniz.');
      return;
    }
    if (!f.treatmentTypeId) {
      this.errorMessage.set('Lütfen bir tedavi / aşı türü seçiniz.');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    try {
      const payload: Partial<Treatment> = {
        animalId: f.animalId,
        treatmentTypeId: f.treatmentTypeId,
        diseaseId: f.diseaseId || undefined,
        date: f.date,
        dosage: f.dosage || undefined,
        performedBy: f.performedBy || undefined,
        cost: f.cost ? Number(f.cost) : undefined,
        note: f.note || undefined,
      };

      if (this.isEditing() && this.editingId()) {
        await this.treatmentService.update(this.editingId()!, payload);
      } else {
        await this.treatmentService.create(payload as any);
      }

      this.closeDrawer();
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Kayıt sırasında bir hata oluştu.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteTreatment(id: string) {
    if (!confirm('Bu tedavi/aşı kaydını silmek istediğinize emin misiniz?')) return;
    try {
      await this.treatmentService.softDelete(id);
    } catch (err: any) {
      alert('Silme işlemi başarısız oldu: ' + err.message);
    }
  }
}
