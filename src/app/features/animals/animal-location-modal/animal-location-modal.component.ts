import { Component, EventEmitter, Input, Output, inject, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Animal, Herd, Paddock, AnimalMovement } from '../../../core/models';
import { AnimalService } from '../../../core/services/animal.service';
import { AnimalMovementService } from '../../../core/services/animal-movement.service';
import { AlertService } from '../../../core/services/alert.service';

@Component({
  selector: 'app-animal-location-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule],
  template: `
    @if (isOpen) {
      <div
        class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6"
        role="dialog"
        aria-modal="true"
      >
        <!-- Backdrop with blur -->
        <div
          (click)="close()"
          class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        ></div>

        <!-- Modal Container -->
        <div
          class="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 flex flex-col my-8"
          (click)="$event.stopPropagation()"
        >
          <!-- Header -->
          <div class="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-cyan-500/20">
                <mat-icon class="icon-size-5 text-white">place</mat-icon>
              </div>
              <div>
                <h2 class="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Konum & Padok Transferi
                </h2>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  {{ animal?.farmTagNo }} {{ animal?.name ? '(' + animal?.name + ')' : '' }}
                </p>
              </div>
            </div>

            <button
              type="button"
              (click)="close()"
              class="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <mat-icon class="icon-size-5">close</mat-icon>
            </button>
          </div>

          <!-- Body Form -->
          <div class="p-5 space-y-4">
            <!-- Current Location Banner -->
            <div class="p-3.5 rounded-2xl bg-cyan-50/60 dark:bg-cyan-950/30 border border-cyan-200/60 dark:border-cyan-800/60">
              <div class="text-[11px] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400 mb-1">
                Mevcut Konum
              </div>
              <div class="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                <mat-icon class="icon-size-4 text-cyan-600">home</mat-icon>
                <span>Sürü: <strong>{{ getCurrentHerdName() }}</strong></span>
                <span class="text-slate-300 dark:text-slate-600">|</span>
                <span>Padok: <strong>{{ getCurrentPaddockName() }}</strong></span>
              </div>
            </div>

            <!-- Target Sürü -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Yeni Sürü
              </label>
              <select
                [(ngModel)]="selectedHerdId"
                class="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 text-slate-800 dark:text-slate-100"
              >
                <option value="">Değiştirme / Sürü Seçilmedi</option>
                @for (h of herds; track h.id) {
                  <option [value]="h.id">{{ h.name }}</option>
                }
              </select>
            </div>

            <!-- Target Padok -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Yeni Padok *
              </label>
              <select
                [(ngModel)]="selectedPaddockId"
                class="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 text-slate-800 dark:text-slate-100 font-medium"
              >
                <option value="">Padok Seçiniz</option>
                @for (p of paddocks; track p.id) {
                  <option [value]="p.id">{{ p.name }} {{ p.capacity ? '(Kapasite: ' + p.capacity + ')' : '' }}</option>
                }
              </select>
            </div>

            <!-- Transfer Date -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Transfer Tarihi
              </label>
              <input
                type="date"
                [(ngModel)]="transferDate"
                class="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 text-slate-800 dark:text-slate-100"
              />
            </div>

            <!-- Transfer Note -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Transfer Açıklaması / Not
              </label>
              <textarea
                [(ngModel)]="transferNote"
                rows="2"
                placeholder="Örn: Damızlık padok değişimi, bakım sonrası aktarım..."
                class="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 text-slate-800 dark:text-slate-100 resize-none"
              ></textarea>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end gap-2.5">
            <button
              mat-button
              type="button"
              class="!text-xs !font-semibold !rounded-xl"
              (click)="close()"
            >
              İptal
            </button>
            <button
              mat-flat-button
              type="button"
              class="!bg-cyan-600 hover:!bg-cyan-700 !text-white !rounded-xl !px-4 !py-2 !font-medium shadow-md shadow-cyan-500/20"
              [disabled]="isSaving() || !selectedPaddockId"
              (click)="saveTransfer()"
            >
              @if (isSaving()) {
                <span>Aktarılıyor...</span>
              } @else {
                <span>Konumu Güncelle</span>
              }
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class AnimalLocationModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() animal: Animal | null = null;
  @Input() herds: Herd[] = [];
  @Input() paddocks: Paddock[] = [];

  @Output() closed = new EventEmitter<void>();
  @Output() locationUpdated = new EventEmitter<void>();

  private animalService = inject(AnimalService);
  private movementService = inject(AnimalMovementService);
  private alertService = inject(AlertService);

  selectedHerdId = '';
  selectedPaddockId = '';
  transferDate = new Date().toISOString().substring(0, 10);
  transferNote = '';
  isSaving = signal(false);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['animal'] && this.animal) {
      this.selectedHerdId = this.animal.herdId || '';
      this.selectedPaddockId = this.animal.paddockId || '';
      this.transferDate = new Date().toISOString().substring(0, 10);
      this.transferNote = '';
    }
  }

  getCurrentHerdName(): string {
    if (!this.animal?.herdId) return 'Belirtilmedi';
    return this.herds.find((h) => h.id === this.animal?.herdId)?.name || 'Belirtilmedi';
  }

  getCurrentPaddockName(): string {
    if (!this.animal?.paddockId) return 'Belirtilmedi';
    return this.paddocks.find((p) => p.id === this.animal?.paddockId)?.name || 'Belirtilmedi';
  }

  close() {
    this.closed.emit();
  }

  async saveTransfer() {
    if (!this.animal?.id) return;
    if (!this.selectedPaddockId) {
      this.alertService.error('Hata', 'Lütfen hedef padok seçiniz.');
      return;
    }

    const oldPaddockId = this.animal.paddockId;
    const oldHerdId = this.animal.herdId;

    this.isSaving.set(true);
    try {
      // 1. Hayvanın konumunu güncelle
      const updateData: Partial<Animal> = {
        paddockId: this.selectedPaddockId,
      };
      if (this.selectedHerdId) {
        updateData.herdId = this.selectedHerdId;
      }
      await this.animalService.update(this.animal.id, updateData);

      // 2. Hareket kaydı oluştur
      const movementPayload: Partial<AnimalMovement> = {
        animalId: this.animal.id,
        type: 'padok',
        fromId: oldPaddockId || undefined,
        toId: this.selectedPaddockId,
        date: this.transferDate,
        note: this.transferNote?.trim() || 'Padok transferi',
      };
      await this.movementService.create(movementPayload as any);

      this.alertService.toastSuccess('Hayvan konumu ve transfer kaydı başarıyla güncellendi.');
      this.locationUpdated.emit();
      this.close();
    } catch (err: any) {
      console.error('Transfer error:', err);
      this.alertService.error('Transfer Başarısız', err?.message || 'Konum güncellenirken bir hata oluştu.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
