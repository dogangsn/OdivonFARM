import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { toSignal } from '@angular/core/rxjs-interop';

import { AnimalService } from '../../core/services/animal.service';
import { TreatmentService } from '../../core/services/treatment.service';
import { MatingService } from '../../core/services/mating.service';
import { AnimalMovementService } from '../../core/services/animal-movement.service';
import { TaskService } from '../../core/services/task.service';
import { AccountingTransactionService } from '../../core/services/accounting-transaction.service';
import { AlertService } from '../../core/services/alert.service';
import { Animal, AnimalMovement } from '../../core/models/animal.model';
import { Treatment } from '../../core/models/health.model';
import { Mating } from '../../core/models/production.model';
import { FarmTask } from '../../core/models/operations.model';
import { AccountingTransaction } from '../../core/models/inventory.model';

export type RecycleSource = 'all' | 'animal' | 'treatment' | 'mating' | 'movement' | 'task' | 'accounting';

export interface DeletedItem {
  id: string;
  source: 'animal' | 'treatment' | 'mating' | 'movement' | 'task' | 'accounting';
  typeLabel: string;
  title: string;
  subtitle: string;
  badgeClass: string;
  icon: string;
  deletedAt: any;
  raw: any;
}

@Component({
  selector: 'app-recycle-bin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './recycle-bin.component.html',
  styleUrl: './recycle-bin.component.scss',
})
export class RecycleBinComponent {
  private animalService = inject(AnimalService);
  private treatmentService = inject(TreatmentService);
  private matingService = inject(MatingService);
  private movementService = inject(AnimalMovementService);
  private taskService = inject(TaskService);
  private accountingService = inject(AccountingTransactionService);
  private alertService = inject(AlertService);

  // Soft-deleted streams
  readonly deletedAnimals = toSignal(this.animalService.listDeleted(), { initialValue: [] as Animal[] });
  readonly deletedTreatments = toSignal(this.treatmentService.listDeleted(), { initialValue: [] as Treatment[] });
  readonly deletedMatings = toSignal(this.matingService.listDeleted(), { initialValue: [] as Mating[] });
  readonly deletedMovements = toSignal(this.movementService.listDeleted(), { initialValue: [] as AnimalMovement[] });
  readonly deletedTasks = toSignal(this.taskService.listDeleted(), { initialValue: [] as FarmTask[] });
  readonly deletedTransactions = toSignal(this.accountingService.listDeleted(), { initialValue: [] as AccountingTransaction[] });

  // Filters
  readonly searchTerm = signal('');
  readonly activeSource = signal<RecycleSource>('all');
  readonly isProcessing = signal(false);

  // Unified Deleted Items list
  readonly allDeletedItems = computed<DeletedItem[]>(() => {
    const items: DeletedItem[] = [];

    for (const a of this.deletedAnimals() || []) {
      items.push({
        id: a.id!,
        source: 'animal',
        typeLabel: 'Hayvan Kaydı',
        title: `${a.farmTagNo} ${a.name ? '(' + a.name + ')' : ''}`,
        subtitle: `Ulusal: ${a.nationalTagNo || '—'} | Cinsiyet: ${a.gender === 'disi' ? 'Dişi' : 'Erkek'} | Durum: ${a.status}`,
        badgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40',
        icon: 'heroicons_outline:identification',
        deletedAt: a.deletedAt,
        raw: a,
      });
    }

    for (const t of this.deletedTreatments() || []) {
      items.push({
        id: t.id!,
        source: 'treatment',
        typeLabel: 'Sağlık / Tedavi',
        title: `Tedavi Kaydı (Tarih: ${this.formatDate(t.date)})`,
        subtitle: `Doz: ${t.dosage || '—'} | Maliyet: ${t.cost != null ? t.cost + ' ₺' : '—'} | ${t.note || ''}`,
        badgeClass: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/40',
        icon: 'heroicons_outline:shield-check',
        deletedAt: t.deletedAt,
        raw: t,
      });
    }

    for (const m of this.deletedMatings() || []) {
      items.push({
        id: m.id!,
        source: 'mating',
        typeLabel: 'Çiftleşme / Üreme',
        title: `Eşleşme Kaydı (${this.formatDate(m.matingDate)})`,
        subtitle: `Durum: ${m.status} | Tahmini Doğum: ${this.formatDate(m.expectedBirthDate)}`,
        badgeClass: 'bg-pink-50 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800/40',
        icon: 'heroicons_outline:heart',
        deletedAt: m.deletedAt,
        raw: m,
      });
    }

    for (const mov of this.deletedMovements() || []) {
      items.push({
        id: mov.id!,
        source: 'movement',
        typeLabel: 'Hayvan Hareketi',
        title: `Transfer (${mov.type})`,
        subtitle: `Tarih: ${this.formatDate(mov.date)} | ${mov.note || ''}`,
        badgeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40',
        icon: 'heroicons_outline:switch-horizontal',
        deletedAt: mov.deletedAt,
        raw: mov,
      });
    }

    for (const task of this.deletedTasks() || []) {
      items.push({
        id: task.id!,
        source: 'task',
        typeLabel: 'Görev',
        title: task.title,
        subtitle: `Durum: ${task.status} | Termin: ${this.formatDate(task.dueDate)} | ${task.description || ''}`,
        badgeClass: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/40',
        icon: 'heroicons_outline:clipboard-check',
        deletedAt: task.deletedAt,
        raw: task,
      });
    }

    for (const tx of this.deletedTransactions() || []) {
      items.push({
        id: tx.id!,
        source: 'accounting',
        typeLabel: 'Muhasebe İşlemi',
        title: `İşlem Tutarı: ${tx.amount} ₺`,
        subtitle: `Tarih: ${this.formatDate(tx.date)} | ${tx.description || ''}`,
        badgeClass: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/40',
        icon: 'heroicons_outline:cash',
        deletedAt: tx.deletedAt,
        raw: tx,
      });
    }

    return items.sort((a, b) => this.getTime(b.deletedAt) - this.getTime(a.deletedAt));
  });

  // Filtered List
  readonly filteredItems = computed(() => {
    let list = this.allDeletedItems();
    const source = this.activeSource();
    const query = this.searchTerm().trim().toLowerCase();

    if (source !== 'all') {
      list = list.filter((i) => i.source === source);
    }

    if (query) {
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(query) ||
          i.subtitle.toLowerCase().includes(query) ||
          i.typeLabel.toLowerCase().includes(query)
      );
    }

    return list;
  });

  // Category counts
  readonly counts = computed(() => {
    return {
      all: this.allDeletedItems().length,
      animal: this.deletedAnimals().length,
      treatment: this.deletedTreatments().length,
      mating: this.deletedMatings().length,
      movement: this.deletedMovements().length,
      task: this.deletedTasks().length,
      accounting: this.deletedTransactions().length,
    };
  });

  formatDate(val: any): string {
    if (!val) return '—';
    if (typeof val === 'string') return val.substring(0, 10);
    if (val.seconds) {
      return new Date(val.seconds * 1000).toLocaleDateString('tr-TR');
    }
    if (val instanceof Date) return val.toLocaleDateString('tr-TR');
    return String(val);
  }

  formatDateTime(val: any): string {
    if (!val) return 'Bilinmiyor';
    if (val.seconds) {
      return new Date(val.seconds * 1000).toLocaleString('tr-TR', {
        dateStyle: 'short',
        timeStyle: 'short',
      });
    }
    if (val instanceof Date) {
      return val.toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' });
    }
    return String(val);
  }

  private getTime(val: any): number {
    if (!val) return 0;
    if (val.seconds) return val.seconds * 1000;
    if (val instanceof Date) return val.getTime();
    return new Date(val).getTime() || 0;
  }

  async restoreItem(item: DeletedItem) {
    const confirmed = await this.alertService.confirm(
      'Kaydı Geri Yükle',
      `"${item.title}" kaydını tekrar aktif duruma getirmek istediğinize emin misiniz?`,
      'Evet, Geri Yükle',
      'Vazgeç'
    );
    if (!confirmed) return;

    this.isProcessing.set(true);
    try {
      switch (item.source) {
        case 'animal':
          await this.animalService.restore(item.id);
          break;
        case 'treatment':
          await this.treatmentService.restore(item.id);
          break;
        case 'mating':
          await this.matingService.restore(item.id);
          break;
        case 'movement':
          await this.movementService.restore(item.id);
          break;
        case 'task':
          await this.taskService.restore(item.id);
          break;
        case 'accounting':
          await this.accountingService.restore(item.id);
          break;
      }
      this.alertService.toastSuccess(`"${item.title}" başarıyla geri yüklendi.`);
    } catch (err: any) {
      console.error('Geri yükleme hatası:', err);
      this.alertService.error('Hata', err?.message || 'Kayıt geri yüklenemedi.');
    } finally {
      this.isProcessing.set(false);
    }
  }

  async hardDeleteItem(item: DeletedItem) {
    const confirmed = await this.alertService.confirmDelete(
      'Kalıcı Olarak Sil',
      `"${item.title}" kaydı veritabanından kalıcı olarak silinecektir. Bu işlem GERİ ALINAMAZ! Devam etmek istiyor musunuz?`
    );
    if (!confirmed) return;

    this.isProcessing.set(true);
    try {
      switch (item.source) {
        case 'animal':
          await this.animalService.hardDelete(item.id);
          break;
        case 'treatment':
          await this.treatmentService.hardDelete(item.id);
          break;
        case 'mating':
          await this.matingService.hardDelete(item.id);
          break;
        case 'movement':
          await this.movementService.hardDelete(item.id);
          break;
        case 'task':
          await this.taskService.hardDelete(item.id);
          break;
        case 'accounting':
          await this.accountingService.hardDelete(item.id);
          break;
      }
      this.alertService.toastSuccess('Kayıt kalıcı olarak silindi.');
    } catch (err: any) {
      console.error('Kalıcı silme hatası:', err);
      this.alertService.error('Hata', err?.message || 'Kayıt kalıcı olarak silinemedi.');
    } finally {
      this.isProcessing.set(false);
    }
  }

  async emptyRecycleBin() {
    const items = this.filteredItems();
    if (!items.length) return;

    const confirmed = await this.alertService.confirmDelete(
      'Geri Dönüşüm Kutusunu Boşalt',
      `Filtrelenen ${items.length} adet silinmiş kayıt kalıcı olarak silinecektir. Bu işlem asla geri alınamaz! Onaylıyor musunuz?`
    );
    if (!confirmed) return;

    this.isProcessing.set(true);
    try {
      for (const item of items) {
        switch (item.source) {
          case 'animal':
            await this.animalService.hardDelete(item.id);
            break;
          case 'treatment':
            await this.treatmentService.hardDelete(item.id);
            break;
          case 'mating':
            await this.matingService.hardDelete(item.id);
            break;
          case 'movement':
            await this.movementService.hardDelete(item.id);
            break;
          case 'task':
            await this.taskService.hardDelete(item.id);
            break;
          case 'accounting':
            await this.accountingService.hardDelete(item.id);
            break;
        }
      }
      this.alertService.toastSuccess('Seçilen tüm silinmiş kayıtlar temizlendi.');
    } catch (err: any) {
      console.error('Toplu silme hatası:', err);
      this.alertService.error('Hata', err?.message || 'Kayıtlar temizlenirken bir hata oluştu.');
    } finally {
      this.isProcessing.set(false);
    }
  }
}
