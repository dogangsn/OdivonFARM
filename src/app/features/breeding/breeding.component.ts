import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatingService } from '../../core/services/mating.service';
import { AnimalService } from '../../core/services/animal.service';
import { Mating, MatingStatus } from '../../core/models/production.model';
import { Animal } from '../../core/models/animal.model';
import { AlertService } from '../../core/services/alert.service';

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
  private alertService = inject(AlertService);

  readonly matings = toSignal(this.matingService.list(), { initialValue: [] as Mating[] });
  readonly animals = toSignal(this.animalService.list(), { initialValue: [] as Animal[] });

  // UI State
  readonly searchTerm = signal('');
  readonly statusFilter = signal<MatingStatus | 'all'>('all');
  readonly showDrawer = signal(false);
  readonly isEditing = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);

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

  // Drawer Actions
  openAddDrawer() {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.errorMessage.set(null);
    const today = new Date().toISOString().substring(0, 10);
    this.form.set({
      femaleId: this.femaleAnimals().length > 0 ? this.femaleAnimals()[0].id! : '',
      maleId: this.maleAnimals().length > 0 ? this.maleAnimals()[0].id! : '',
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

  async quickStatusChange(mating: Mating, newStatus: MatingStatus) {
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

      if (this.isEditing() && this.editingId()) {
        await this.matingService.update(this.editingId()!, payload);
      } else {
        await this.matingService.create(payload as any);
      }

      this.closeDrawer();
      this.alertService.toastSuccess('Kayıt başarıyla kaydedildi');
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
