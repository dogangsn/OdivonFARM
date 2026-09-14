import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { toSignal } from '@angular/core/rxjs-interop';
import { InsuredAnimalService } from '../../core/services/insured-animal.service';
import { AnimalService } from '../../core/services/animal.service';
import { InsuredAnimal } from '../../core/models/health.model';
import { Animal } from '../../core/models/animal.model';

export type PolicyStatus = 'aktif' | 'yaklasiyor' | 'dolmus';

@Component({
  selector: 'app-insured-animals',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './insured-animals.component.html',
  styleUrls: ['./insured-animals.component.scss'],
})
export class InsuredAnimalsComponent {
  private insuredService = inject(InsuredAnimalService);
  private animalService = inject(AnimalService);

  readonly policies = toSignal(this.insuredService.list(), { initialValue: [] as InsuredAnimal[] });
  readonly animals = toSignal(this.animalService.list(), { initialValue: [] as Animal[] });

  // Filters
  readonly searchTerm = signal('');
  readonly statusFilter = signal<'all' | PolicyStatus>('all');
  readonly insurerFilter = signal<string>('');

  // Drawer
  readonly showDrawer = signal(false);
  readonly isEditing = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // Form Model
  readonly form = signal<{
    animalId: string;
    policyNo: string;
    insurer: string;
    startDate: string;
    endDate: string;
    premium: number | null;
    coverage: number | null;
  }>({
    animalId: '',
    policyNo: '',
    insurer: 'TARSİM',
    startDate: new Date().toISOString().substring(0, 10),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
    premium: null,
    coverage: null,
  });

  // Animal Map
  readonly animalMap = computed(() => {
    const map = new Map<string, Animal>();
    for (const a of this.animals() || []) {
      if (a?.id) map.set(a.id, a);
    }
    return map;
  });

  // Distinct Insurers
  readonly insurersList = computed(() => {
    const set = new Set<string>();
    for (const p of this.policies() || []) {
      if (p.insurer?.trim()) set.add(p.insurer.trim());
    }
    return Array.from(set).sort();
  });

  // Filtered Policies
  readonly filteredPolicies = computed(() => {
    let list = this.policies() || [];
    const query = (this.searchTerm() || '').trim().toLowerCase();
    const statusF = this.statusFilter();
    const insurerF = this.insurerFilter();

    if (insurerF) {
      list = list.filter((p) => p.insurer === insurerF);
    }

    if (statusF !== 'all') {
      list = list.filter((p) => this.getPolicyStatus(p) === statusF);
    }

    if (query) {
      list = list.filter((p) => {
        const animal = this.animalMap().get(p.animalId);
        const tag = animal?.farmTagNo?.toLowerCase() || '';
        const name = animal?.name?.toLowerCase() || '';
        const policyNo = p.policyNo?.toLowerCase() || '';
        const insurer = p.insurer?.toLowerCase() || '';

        return tag.includes(query) || name.includes(query) || policyNo.includes(query) || insurer.includes(query);
      });
    }

    return [...(list || [])].sort((a, b) => {
      const timeA = this.getTime(a.endDate);
      const timeB = this.getTime(b.endDate);
      return timeB - timeA;
    });
  });

  // Stats
  readonly stats = computed(() => {
    const list = this.policies() || [];
    let activeCount = 0;
    let expiringCount = 0;
    let expiredCount = 0;
    let totalCoverage = 0;
    let totalPremium = 0;

    for (const p of list) {
      const status = this.getPolicyStatus(p);
      if (status === 'aktif') activeCount++;
      else if (status === 'yaklasiyor') {
        activeCount++;
        expiringCount++;
      } else {
        expiredCount++;
      }

      totalCoverage += Number(p.coverage) || 0;
      totalPremium += Number(p.premium) || 0;
    }

    return {
      total: list.length,
      activeCount,
      expiringCount,
      expiredCount,
      totalCoverage,
      totalPremium,
    };
  });

  openAddDrawer() {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.errorMessage.set(null);

    const firstAnimal = (this.animals() || [])[0]?.id || '';

    this.form.set({
      animalId: firstAnimal,
      policyNo: '',
      insurer: 'TARSİM',
      startDate: new Date().toISOString().substring(0, 10),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
      premium: null,
      coverage: null,
    });

    this.showDrawer.set(true);
  }

  openEditDrawer(p: InsuredAnimal) {
    if (!p?.id) return;
    this.isEditing.set(true);
    this.editingId.set(p.id);
    this.errorMessage.set(null);

    this.form.set({
      animalId: p.animalId || '',
      policyNo: p.policyNo || '',
      insurer: p.insurer || 'TARSİM',
      startDate: this.formatDateForInput(p.startDate),
      endDate: this.formatDateForInput(p.endDate),
      premium: p.premium || null,
      coverage: p.coverage || null,
    });

    this.showDrawer.set(true);
  }

  closeDrawer() {
    this.showDrawer.set(false);
    this.isEditing.set(false);
    this.editingId.set(null);
    this.errorMessage.set(null);
  }

  async savePolicy() {
    const f = this.form();
    if (!f.animalId) {
      this.errorMessage.set('Lütfen bir hayvan seçin.');
      return;
    }
    if (!f.policyNo.trim()) {
      this.errorMessage.set('Lütfen poliçe numarasını girin.');
      return;
    }
    if (!f.insurer.trim()) {
      this.errorMessage.set('Lütfen sigorta şirketini belirtin.');
      return;
    }
    if (!f.startDate || !f.endDate) {
      this.errorMessage.set('Lütfen başlangıç ve bitiş tarihlerini girin.');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    try {
      const payload: Partial<InsuredAnimal> = {
        animalId: f.animalId,
        policyNo: f.policyNo.trim(),
        insurer: f.insurer.trim(),
        startDate: new Date(f.startDate),
        endDate: new Date(f.endDate),
        premium: f.premium != null ? Number(f.premium) : undefined,
        coverage: f.coverage != null ? Number(f.coverage) : undefined,
      };

      if (this.isEditing() && this.editingId()) {
        await this.insuredService.update(this.editingId()!, payload);
      } else {
        await this.insuredService.create(payload as any);
      }

      this.closeDrawer();
    } catch (err: any) {
      console.error('Poliçe kaydedilemedi:', err);
      this.errorMessage.set(err?.message || 'Poliçe kaydedilirken bir hata oluştu.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async deletePolicy(id?: string) {
    if (!id) return;
    if (!confirm('Bu sigorta poliçesini silmek istediğinize emin misiniz?')) {
      return;
    }
    try {
      await this.insuredService.softDelete(id);
    } catch (err) {
      console.error('Silme hatası:', err);
      alert('Poliçe silinirken bir hata oluştu.');
    }
  }

  // Helpers
  getAnimal(id: string): Animal | undefined {
    return this.animalMap().get(id);
  }

  getPolicyStatus(p: InsuredAnimal): PolicyStatus {
    const end = this.getTime(p.endDate);
    if (!end) return 'aktif';
    const now = Date.now();
    const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'dolmus';
    if (diffDays <= 30) return 'yaklasiyor';
    return 'aktif';
  }

  getDaysRemaining(p: InsuredAnimal): number {
    const end = this.getTime(p.endDate);
    if (!end) return 0;
    const now = Date.now();
    return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
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
