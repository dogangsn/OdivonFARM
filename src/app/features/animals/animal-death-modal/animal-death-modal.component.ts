import { Component, EventEmitter, Input, Output, inject, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Animal, AnimalSaleRecord } from '../../../core/models';
import { AnimalService } from '../../../core/services/animal.service';
import { AnimalMovementService } from '../../../core/services/animal-movement.service';
import { AlertService } from '../../../core/services/alert.service';
import { DiseaseService } from '../../../core/services/definitions/disease.service';
import { AccountService } from '../../../core/services/definitions/account.service';
import { Account } from '../../../core/models/inventory.model';

@Component({
  selector: 'app-animal-death-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatTooltipModule],
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
          class="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 flex flex-col my-8"
          (click)="$event.stopPropagation()"
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <h2 class="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {{ activeTab() === 'olum' ? 'Ölüm İşlemleri' : activeTab() === 'kesim' ? 'Kesim İşlemleri' : 'Satış İşlemleri' }}
            </h2>
            <button
              type="button"
              (click)="close()"
              class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <mat-icon class="icon-size-5">close</mat-icon>
            </button>
          </div>

          <!-- TABS: Ölüm İşlemleri / Kesim İşlemleri / Satış İşlemleri -->
          <div class="px-6 pt-3 flex items-center gap-1 sm:gap-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 overflow-x-auto">
            <button
              type="button"
              (click)="selectTab('olum')"
              class="pb-3 px-3 sm:px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0"
              [ngClass]="activeTab() === 'olum' ? 'border-rose-600 text-rose-600 dark:text-rose-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'"
            >
              <mat-icon class="icon-size-4">heart_broken</mat-icon>
              <span>Ölüm İşlemleri</span>
            </button>
            <button
              type="button"
              (click)="selectTab('kesim')"
              class="pb-3 px-3 sm:px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0"
              [ngClass]="activeTab() === 'kesim' ? 'border-amber-600 text-amber-600 dark:text-amber-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'"
            >
              <mat-icon class="icon-size-4">content_cut</mat-icon>
              <span>Kesim İşlemleri</span>
            </button>
            <button
              type="button"
              (click)="selectTab('satis')"
              class="pb-3 px-3 sm:px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0"
              [ngClass]="activeTab() === 'satis' ? 'border-[#5bc0be] text-[#369a98] dark:text-[#5bc0be]' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'"
            >
              <mat-icon class="icon-size-4">point_of_sale</mat-icon>
              <span>Satış İşlemleri</span>
            </button>
          </div>

          <!-- Sub-header Tag Info Box (exact match to screenshot) -->
          <div class="px-6 pt-5">
            <div class="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 text-center">
              <p class="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 font-mono tracking-wide">
                ÇKN: <span class="text-slate-900 dark:text-white font-bold">{{ animal?.farmTagNo || '—' }}</span>
                <span class="text-slate-300 dark:text-slate-600 mx-2">|</span>
                UKN: <span class="text-slate-900 dark:text-white font-bold">{{ animal?.nationalTagNo || 'Bilinmiyor' }}</span>
                <span class="text-slate-300 dark:text-slate-600 mx-2">|</span>
                RFID: <span class="text-slate-900 dark:text-white font-bold">{{ animal?.rfid || 'Bilinmiyor' }}</span>
              </p>
            </div>
          </div>

          <!-- ============================================================== -->
          <!-- TAB 1: ÖLÜM İŞLEMLERİ                                           -->
          <!-- ============================================================== -->
          @if (activeTab() === 'olum') {
            <div class="px-6 py-5 space-y-4 text-sm">
              @if (errorMessage()) {
                <div class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <mat-icon class="icon-size-4 text-rose-600">error_outline</mat-icon>
                  <span>{{ errorMessage() }}</span>
                </div>
              }

              <!-- 1. Exper Durumu -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span class="text-sm font-medium text-slate-700 dark:text-slate-300 min-w-28">
                  Exper Durumu
                </span>
                <div class="flex items-center gap-4 flex-1 justify-start sm:justify-end">
                  <label class="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name="deathExpertStatus"
                      value="cagrilmadi"
                      [checked]="expertStatus === 'cagrilmadi'"
                      (change)="expertStatus = 'cagrilmadi'"
                      class="w-4 h-4 text-rose-600 focus:ring-rose-500"
                    />
                    <span>Exper Çağırılmadı</span>
                  </label>

                  <label class="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name="deathExpertStatus"
                      value="cagrildi"
                      [checked]="expertStatus === 'cagrildi'"
                      (change)="expertStatus = 'cagrildi'"
                      class="w-4 h-4 text-rose-600 focus:ring-rose-500"
                    />
                    <span>Exper Çağırıldı</span>
                  </label>

                  <mat-icon
                    class="icon-size-4 text-slate-400 hover:text-slate-600 cursor-help"
                    matTooltip="TARSİM veya sigorta hasar tespit eksper durumu"
                  >info</mat-icon>
                </div>
              </div>

              <!-- 2. Ölüm Nedeni -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300 min-w-28">
                  *Ölüm Nedeni
                </label>
                <div class="flex-1 sm:max-w-xs w-full">
                  <select
                    [(ngModel)]="deathReason"
                    class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-800 dark:text-slate-100"
                  >
                    <option value="">Lütfen ölüm nedeni seçiniz</option>
                    <optgroup label="Genel Ölüm Nedenleri">
                      <option value="Hastalık">Hastalık</option>
                      <option value="Kaza / Travma">Kaza / Travma</option>
                      <option value="Zehirlenme">Zehirlenme</option>
                      <option value="Zor Doğum">Zor Doğum (Doğum Komplikasyonu)</option>
                      <option value="Şişme / Timpani">Şişme / Timpani</option>
                      <option value="Solunum Yolu Enfeksiyonu">Solunum Yolu Enfeksiyonu (Zatürre)</option>
                      <option value="Sindirim Sistemi / Enterotoksemi">Sindirim Sistemi / Enterotoksemi</option>
                      <option value="Ani Ölüm / Kalp Durması">Ani Ölüm / Kalp Durması</option>
                      <option value="Yaşlılık">Yaşlılık</option>
                      <option value="Bilinmeyen">Bilinmeyen</option>
                      <option value="Diğer">Diğer</option>
                    </optgroup>
                    @if (diseases().length > 0) {
                      <optgroup label="Çiftlikte Kayıtlı Hastalıklar">
                        @for (d of diseases(); track d.id) {
                          <option [value]="'Hastalık: ' + d.name">{{ d.name }}</option>
                        }
                      </optgroup>
                    }
                  </select>
                </div>
              </div>

              <!-- 3. Tarih -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300 min-w-28">
                  *Tarih
                </label>
                <div class="flex-1 sm:max-w-xs w-full">
                  <input
                    type="date"
                    [(ngModel)]="deathDate"
                    class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-800 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <!-- 4. Açıklama -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300 min-w-28">
                  Açıklama
                </label>
                <div class="flex-1 sm:max-w-xs w-full">
                  <input
                    type="text"
                    [(ngModel)]="deathNotes"
                    placeholder="Ölüm detayı veya eksper notu..."
                    class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div class="text-xs text-slate-500 dark:text-slate-400 pt-1">
                *girilmesi zorunlu alanlar
              </div>

              <!-- Submit Button -->
              <div class="pt-2 space-y-2">
                <button
                  type="button"
                  [disabled]="isSaving()"
                  (click)="submitDeath()"
                  class="w-full py-3 px-4 rounded-xl font-semibold text-white bg-[#e04538] hover:bg-[#c93b30] active:bg-[#b53329] disabled:opacity-50 transition-all shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  @if (isSaving()) {
                    <mat-icon class="icon-size-4 animate-spin">sync</mat-icon>
                    <span>Kaydediliyor...</span>
                  } @else {
                    <span>{{ isAlreadyDead() ? 'Ölüm Bilgilerini Güncelle' : 'Hayvanı Öldür' }}</span>
                  }
                </button>

                @if (isAlreadyDead()) {
                  <button
                    type="button"
                    [disabled]="isSaving()"
                    (click)="revertDeath()"
                    class="w-full py-2 px-4 rounded-xl font-medium text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <mat-icon class="icon-size-4 text-emerald-600">restore</mat-icon>
                    <span>Ölüm Kaydını İptal Et (Tekrar Aktif Yap)</span>
                  </button>
                }
              </div>

              <!-- Footnotes matching user screenshot -->
              <div class="space-y-1.5 pt-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
                <div class="flex items-start gap-1.5">
                  <span class="text-slate-400">•</span>
                  <span>Ölümü kaydetmek için bir neden ve tarih seçmeniz gerekiyor.</span>
                </div>
                <div class="flex items-start gap-1.5">
                  <span class="text-slate-400">•</span>
                  <span>Ölüm kaydedildikten sonra hayvan durumu "Öldü" olarak işaretlenir ve aktif sürü listesinden çıkartılır.</span>
                </div>
              </div>
            </div>
          }

          <!-- ============================================================== -->
          <!-- TAB 2: KESİM İŞLEMLERİ                                          -->
          <!-- ============================================================== -->
          @if (activeTab() === 'kesim') {
            <div class="px-6 py-5 space-y-4 text-sm">
              @if (errorMessage()) {
                <div class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <mat-icon class="icon-size-4 text-rose-600">error_outline</mat-icon>
                  <span>{{ errorMessage() }}</span>
                </div>
              }

              <!-- 1. Exper Durumu -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span class="text-sm font-medium text-slate-700 dark:text-slate-300 min-w-28">
                  Exper Durumu
                </span>
                <div class="flex items-center gap-4 flex-1 justify-start sm:justify-end">
                  <label class="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name="slaughterExpertStatus"
                      value="cagrilmadi"
                      [checked]="slaughterExpertStatus === 'cagrilmadi'"
                      (change)="slaughterExpertStatus = 'cagrilmadi'"
                      class="w-4 h-4 text-rose-600 focus:ring-rose-500"
                    />
                    <span>Exper Çağırılmadı</span>
                  </label>

                  <label class="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name="slaughterExpertStatus"
                      value="cagrildi"
                      [checked]="slaughterExpertStatus === 'cagrildi'"
                      (change)="slaughterExpertStatus = 'cagrildi'"
                      class="w-4 h-4 text-rose-600 focus:ring-rose-500"
                    />
                    <span>Exper Çağırıldı</span>
                  </label>

                  <mat-icon
                    class="icon-size-4 text-slate-400 hover:text-slate-600 cursor-help"
                    matTooltip="TARSİM veya kesim onay eksper durumu"
                  >info</mat-icon>
                </div>
              </div>

              <!-- 2. Tarih -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300 min-w-28">
                  Tarih
                </label>
                <div class="flex-1 sm:max-w-xs w-full">
                  <input
                    type="date"
                    [(ngModel)]="slaughterDate"
                    class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-800 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <!-- 3. Et Miktarı -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300 min-w-28">
                  Et Miktarı
                </label>
                <div class="flex-1 sm:max-w-xs w-full flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    [(ngModel)]="meatKg"
                    placeholder="0"
                    class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-800 dark:text-slate-100"
                  />
                  <span class="text-xs text-slate-500 font-semibold shrink-0">kg</span>
                </div>
              </div>

              <!-- 4. Baş Miktarı -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300 min-w-28">
                  Baş Miktarı
                </label>
                <div class="flex-1 sm:max-w-xs w-full">
                  <select
                    [(ngModel)]="headCount"
                    class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-800 dark:text-slate-100"
                  >
                    <option [ngValue]="0">0</option>
                    <option [ngValue]="1">1</option>
                    <option [ngValue]="2">2</option>
                    <option [ngValue]="3">3</option>
                    <option [ngValue]="4">4</option>
                    <option [ngValue]="5">5</option>
                  </select>
                </div>
              </div>

              <!-- 5. Ciğer Miktarı -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300 min-w-28">
                  Ciğer Miktarı
                </label>
                <div class="flex-1 sm:max-w-xs w-full">
                  <select
                    [(ngModel)]="liverCount"
                    class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-800 dark:text-slate-100"
                  >
                    <option [ngValue]="0">0</option>
                    <option [ngValue]="1">1</option>
                    <option [ngValue]="2">2</option>
                    <option [ngValue]="3">3</option>
                    <option [ngValue]="4">4</option>
                    <option [ngValue]="5">5</option>
                  </select>
                </div>
              </div>

              <!-- 6. Deri Miktarı -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300 min-w-28">
                  Deri Miktarı
                </label>
                <div class="flex-1 sm:max-w-xs w-full">
                  <select
                    [(ngModel)]="skinCount"
                    class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-800 dark:text-slate-100"
                  >
                    <option [ngValue]="0">0</option>
                    <option [ngValue]="1">1</option>
                    <option [ngValue]="2">2</option>
                    <option [ngValue]="3">3</option>
                    <option [ngValue]="4">4</option>
                    <option [ngValue]="5">5</option>
                  </select>
                </div>
              </div>

              <!-- 7. Açıklama -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300 min-w-28">
                  Açıklama
                </label>
                <div class="flex-1 sm:max-w-xs w-full">
                  <input
                    type="text"
                    [(ngModel)]="slaughterNotes"
                    placeholder="Kesim detayı, mezbaha veya notlar..."
                    class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <!-- Submit Button (Hayvanı Kes) -->
              <div class="pt-2 space-y-2">
                <button
                  type="button"
                  [disabled]="isSaving()"
                  (click)="submitSlaughter()"
                  class="w-full py-3 px-4 rounded-xl font-semibold text-white bg-[#e04538] hover:bg-[#c93b30] active:bg-[#b53329] disabled:opacity-50 transition-all shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  @if (isSaving()) {
                    <mat-icon class="icon-size-4 animate-spin">sync</mat-icon>
                    <span>Kaydediliyor...</span>
                  } @else {
                    <span>{{ isAlreadySlaughtered() ? 'Kesim Bilgilerini Güncelle' : 'Hayvanı Kes' }}</span>
                  }
                </button>

                @if (isAlreadySlaughtered()) {
                  <button
                    type="button"
                    [disabled]="isSaving()"
                    (click)="revertSlaughter()"
                    class="w-full py-2 px-4 rounded-xl font-medium text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <mat-icon class="icon-size-4 text-emerald-600">restore</mat-icon>
                    <span>Kesim Kaydını İptal Et (Tekrar Aktif Yap)</span>
                  </button>
                }
              </div>

              <!-- Footnotes matching user screenshot -->
              <div class="space-y-1.5 pt-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
                <div class="flex items-start gap-1.5">
                  <span class="text-slate-400">•</span>
                  <span>Kesimi kaydetmek için açıklama hariç tüm alanları doldurmanız gerekiyor.</span>
                </div>
                <div class="flex items-start gap-1.5">
                  <span class="text-slate-400">•</span>
                  <span>Kesilen hayvan pasif olarak değiştirilecektir.</span>
                </div>
              </div>
            </div>
          }

          <!-- ============================================================== -->
          <!-- TAB 3: SATIŞ İŞLEMLERİ (Kullanıcı Ekran Görüntüsü Birebir)      -->
          <!-- ============================================================== -->
          @if (activeTab() === 'satis') {
            <div class="px-6 py-5 space-y-4 text-sm">
              @if (errorMessage()) {
                <div class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <mat-icon class="icon-size-4 text-rose-600">error_outline</mat-icon>
                  <span>{{ errorMessage() }}</span>
                </div>
              }

              <!-- 1. *Cari -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300 min-w-28">
                  *Cari
                </label>
                <div class="flex-1 sm:max-w-xs w-full">
                  <select
                    [(ngModel)]="saleAccountId"
                    class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5bc0be]/30 focus:border-[#5bc0be] text-slate-800 dark:text-slate-100"
                  >
                    <option value="">Lütfen cari seçiniz</option>
                    @for (acc of accounts(); track acc.id) {
                      <option [value]="acc.id">{{ acc.title }}</option>
                    }
                    <option value="diger">Diğer / Tanımsız Cari</option>
                  </select>
                  @if (saleAccountId === 'diger') {
                    <input
                      type="text"
                      [(ngModel)]="customAccountTitle"
                      placeholder="Alıcı / Müşteri Adı..."
                      class="mt-2 w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5bc0be]/30 focus:border-[#5bc0be] text-slate-800 dark:text-slate-100"
                    />
                  }
                </div>
              </div>

              <!-- 2. *Tarih -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300 min-w-28">
                  *Tarih
                </label>
                <div class="flex-1 sm:max-w-xs w-full">
                  <input
                    type="date"
                    [(ngModel)]="saleDate"
                    class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5bc0be]/30 focus:border-[#5bc0be] text-slate-800 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <!-- 3. *Fiyat -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300 min-w-28">
                  *Fiyat
                </label>
                <div class="flex-1 sm:max-w-xs w-full flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    [(ngModel)]="salePrice"
                    placeholder="0.00"
                    class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5bc0be]/30 focus:border-[#5bc0be] text-slate-800 dark:text-slate-100 font-mono"
                  />
                  <span class="text-xs text-slate-500 font-semibold shrink-0">₺</span>
                </div>
              </div>

              <!-- 4. Satış Ağırlığı -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300 min-w-28">
                  Satış Ağırlığı
                </label>
                <div class="flex-1 sm:max-w-xs w-full flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    [(ngModel)]="saleWeightKg"
                    placeholder="İsteğe bağlı"
                    class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5bc0be]/30 focus:border-[#5bc0be] text-slate-800 dark:text-slate-100 font-mono"
                  />
                  <span class="text-xs text-slate-500 font-semibold shrink-0">kg</span>
                </div>
              </div>

              <div class="text-xs text-slate-500 dark:text-slate-400 pt-1">
                *girilmesi zorunlu alanlar
              </div>

              <!-- Submit Button (Satışı kaydet - exact turquoise #5bc0be styling) -->
              <div class="pt-2 space-y-2">
                <button
                  type="button"
                  [disabled]="isSaving()"
                  (click)="submitSale()"
                  class="w-full py-3 px-4 rounded-xl font-semibold text-white bg-[#5bc0be] hover:bg-[#4ea8a6] active:bg-[#439694] disabled:opacity-50 transition-all shadow-md shadow-[#5bc0be]/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  @if (isSaving()) {
                    <mat-icon class="icon-size-4 animate-spin">sync</mat-icon>
                    <span>Kaydediliyor...</span>
                  } @else {
                    <span>{{ isAlreadySold() ? 'Satış Bilgilerini Güncelle' : 'Satışı kaydet' }}</span>
                  }
                </button>

                @if (isAlreadySold()) {
                  <button
                    type="button"
                    [disabled]="isSaving()"
                    (click)="revertSale()"
                    class="w-full py-2 px-4 rounded-xl font-medium text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <mat-icon class="icon-size-4 text-emerald-600">restore</mat-icon>
                    <span>Satış Kaydını İptal Et (Tekrar Aktif Yap)</span>
                  </button>
                }
              </div>

              <!-- Footnotes matching user screenshot -->
              <div class="space-y-1.5 pt-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
                <div class="flex items-start gap-1.5">
                  <span class="text-slate-400">•</span>
                  <span>Satışı kaydetmek için bir cari, tarih ve fiyat seçmeniz gerekiyor. Cariler Tanımlamalar bölümünden kaydedilebilir..</span>
                </div>
                <div class="flex items-start gap-1.5">
                  <span class="text-slate-400">•</span>
                  <span>Satılan hayvan pasif olarak değiştirilecektir.</span>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class AnimalDeathModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() animal: Animal | null = null;
  @Input() initialTab: 'olum' | 'kesim' | 'satis' = 'olum';

  @Output() closed = new EventEmitter<void>();
  @Output() deathRecorded = new EventEmitter<void>();

  private animalService = inject(AnimalService);
  private movementService = inject(AnimalMovementService);
  private diseaseService = inject(DiseaseService);
  private accountService = inject(AccountService);
  private alertService = inject(AlertService);

  activeTab = signal<'olum' | 'kesim' | 'satis'>('olum');
  errorMessage = signal<string | null>(null);
  isSaving = signal(false);

  // Ölüm Form Fields
  expertStatus: 'cagrilmadi' | 'cagrildi' = 'cagrilmadi';
  deathReason = '';
  deathDate = new Date().toISOString().substring(0, 10);
  deathNotes = '';

  // Kesim Form Fields
  slaughterExpertStatus: 'cagrilmadi' | 'cagrildi' = 'cagrilmadi';
  slaughterDate = new Date().toISOString().substring(0, 10);
  meatKg: number | null = 0;
  headCount: number = 0;
  liverCount: number = 0;
  skinCount: number = 0;
  slaughterNotes = '';

  // Satış Form Fields
  saleAccountId = '';
  customAccountTitle = '';
  saleDate = new Date().toISOString().substring(0, 10);
  salePrice: number | null = null;
  saleWeightKg: number | null = null;
  saleNotes = '';

  diseases = signal<{ id?: string; name: string }[]>([]);
  accounts = signal<Account[]>([]);

  constructor() {
    this.diseaseService.list().subscribe({
      next: (res) => this.diseases.set(res || []),
      error: () => {},
    });

    this.accountService.list().subscribe({
      next: (res) => this.accounts.set(res || []),
      error: () => {},
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['animal'] && this.animal) {
      // Determine default tab based on status or input
      if (this.animal.status === 'satildi') {
        this.activeTab.set('satis');
      } else if (this.animal.status === 'kesildi') {
        this.activeTab.set('kesim');
      } else if (this.animal.status === 'oldu') {
        this.activeTab.set('olum');
      } else if (this.initialTab) {
        this.activeTab.set(this.initialTab);
      }

      // Populate Ölüm fields
      this.expertStatus =
        (this.animal.deathExpertStatus as 'cagrilmadi' | 'cagrildi') ||
        this.animal.deathInfo?.expertStatus ||
        'cagrilmadi';
      this.deathReason = this.animal.deathReason || this.animal.deathInfo?.reason || '';
      this.deathDate =
        this.animal.deathDate ||
        this.animal.deathInfo?.date ||
        new Date().toISOString().substring(0, 10);
      this.deathNotes = this.animal.deathNotes || this.animal.deathInfo?.notes || '';

      // Populate Kesim fields
      this.slaughterExpertStatus =
        (this.animal.slaughterExpertStatus as 'cagrilmadi' | 'cagrildi') ||
        this.animal.slaughterInfo?.expertStatus ||
        'cagrilmadi';
      this.slaughterDate =
        this.animal.slaughterDate ||
        this.animal.slaughterInfo?.date ||
        new Date().toISOString().substring(0, 10);
      this.meatKg =
        this.animal.slaughterMeatKg ??
        this.animal.slaughterInfo?.meatKg ??
        0;
      this.headCount =
        this.animal.slaughterHeadCount ??
        this.animal.slaughterInfo?.headCount ??
        0;
      this.liverCount =
        this.animal.slaughterLiverCount ??
        this.animal.slaughterInfo?.liverCount ??
        0;
      this.skinCount =
        this.animal.slaughterSkinCount ??
        this.animal.slaughterInfo?.skinCount ??
        0;
      this.slaughterNotes =
        this.animal.slaughterNotes ||
        this.animal.slaughterInfo?.notes ||
        '';

      // Populate Satış fields
      this.saleAccountId = this.animal.saleAccountId || this.animal.saleInfo?.accountId || '';
      this.customAccountTitle = this.animal.saleAccountTitle || this.animal.saleInfo?.accountTitle || '';
      this.saleDate =
        this.animal.saleDate ||
        this.animal.saleInfo?.date ||
        new Date().toISOString().substring(0, 10);
      this.salePrice =
        this.animal.salePrice ??
        this.animal.saleInfo?.price ??
        null;
      this.saleWeightKg =
        this.animal.saleWeightKg ??
        this.animal.saleInfo?.weightKg ??
        null;
      this.saleNotes = this.animal.saleInfo?.notes || '';

      this.errorMessage.set(null);
    }
  }

  selectTab(tab: 'olum' | 'kesim' | 'satis') {
    this.activeTab.set(tab);
    this.errorMessage.set(null);
  }

  isAlreadyDead(): boolean {
    return this.animal?.status === 'oldu';
  }

  isAlreadySlaughtered(): boolean {
    return this.animal?.status === 'kesildi';
  }

  isAlreadySold(): boolean {
    return this.animal?.status === 'satildi';
  }

  close() {
    this.errorMessage.set(null);
    this.closed.emit();
  }

  // SUBMIT DEATH
  async submitDeath() {
    if (!this.animal?.id) return;

    if (!this.deathReason.trim()) {
      this.errorMessage.set('Lütfen bir ölüm nedeni seçiniz.');
      return;
    }
    if (!this.deathDate) {
      this.errorMessage.set('Lütfen ölüm tarihini belirtiniz.');
      return;
    }

    this.errorMessage.set(null);

    const isExisting = this.isAlreadyDead();
    const confirmed = await this.alertService.confirm(
      isExisting ? 'Ölüm Bilgilerini Güncelle' : 'Ölüm Kaydını Onayla',
      isExisting
        ? `${this.animal.farmTagNo} küpeli hayvanın ölüm bilgilerini güncellemek istediğinize emin misiniz?`
        : `${this.animal.farmTagNo} küpeli hayvanın ölüm kaydını yapmak istediğinize emin misiniz? Hayvan durumu "Öldü" olarak güncellenecektir.`,
      isExisting ? 'Güncelle' : 'Hayvanı Öldür',
      'Vazgeç'
    );

    if (!confirmed) return;

    this.isSaving.set(true);
    try {
      const deathPayload = {
        date: this.deathDate,
        reason: this.deathReason,
        expertStatus: this.expertStatus,
        notes: this.deathNotes?.trim() || '',
        recordedAt: new Date().toISOString(),
      };

      await this.animalService.update(this.animal.id, {
        status: 'oldu',
        deathDate: this.deathDate,
        deathReason: this.deathReason,
        deathExpertStatus: this.expertStatus,
        deathNotes: this.deathNotes?.trim() || '',
        deathInfo: deathPayload,
      });

      if (!isExisting) {
        try {
          await this.movementService.create({
            animalId: this.animal.id,
            type: 'ciftlik-cikis',
            fromId: this.animal.paddockId || undefined,
            toId: 'olum',
            date: this.deathDate,
            note: `Ölüm Kaydı: ${this.deathReason} (${
              this.expertStatus === 'cagrildi' ? 'Exper Çağırıldı' : 'Exper Çağırılmadı'
            })${this.deathNotes ? ' - ' + this.deathNotes.trim() : ''}`,
          } as any);
        } catch (mErr) {
          console.warn('Movement record creation warning:', mErr);
        }
      }

      this.alertService.toastSuccess(
        isExisting ? 'Ölüm bilgileri güncellendi.' : 'Ölüm kaydı başarıyla oluşturuldu.'
      );
      this.deathRecorded.emit();
      this.close();
    } catch (err: any) {
      console.error('Death record error:', err);
      this.errorMessage.set(err?.message || 'Ölüm kaydı kaydedilirken bir hata oluştu.');
      this.alertService.error('İşlem Başarısız', err?.message || 'Ölüm kaydı yapılamadı.');
    } finally {
      this.isSaving.set(false);
    }
  }

  // SUBMIT SLAUGHTER (Hayvanı Kes)
  async submitSlaughter() {
    if (!this.animal?.id) return;

    if (!this.slaughterDate) {
      this.errorMessage.set('Lütfen kesim tarihini belirtiniz.');
      return;
    }
    if (this.meatKg === null || this.meatKg === undefined || isNaN(Number(this.meatKg)) || Number(this.meatKg) < 0) {
      this.errorMessage.set('Lütfen geçerli bir et miktarı giriniz.');
      return;
    }

    this.errorMessage.set(null);

    const isExisting = this.isAlreadySlaughtered();
    const confirmed = await this.alertService.confirm(
      isExisting ? 'Kesim Bilgilerini Güncelle' : 'Kesim Kaydını Onayla',
      isExisting
        ? `${this.animal.farmTagNo} küpeli hayvanın kesim bilgilerini güncellemek istediğinize emin misiniz?`
        : `${this.animal.farmTagNo} küpeli hayvanın kesim kaydını yapmak istediğinize emin misiniz? Hayvan durumu "Kesildi" olarak güncellenecektir.`,
      isExisting ? 'Güncelle' : 'Hayvanı Kes',
      'Vazgeç'
    );

    if (!confirmed) return;

    this.isSaving.set(true);
    try {
      const slaughterPayload = {
        date: this.slaughterDate,
        expertStatus: this.slaughterExpertStatus,
        meatKg: Number(this.meatKg) || 0,
        headCount: Number(this.headCount) || 0,
        liverCount: Number(this.liverCount) || 0,
        skinCount: Number(this.skinCount) || 0,
        notes: this.slaughterNotes?.trim() || '',
        recordedAt: new Date().toISOString(),
      };

      await this.animalService.update(this.animal.id, {
        status: 'kesildi',
        slaughterDate: this.slaughterDate,
        slaughterMeatKg: Number(this.meatKg) || 0,
        slaughterHeadCount: Number(this.headCount) || 0,
        slaughterLiverCount: Number(this.liverCount) || 0,
        slaughterSkinCount: Number(this.skinCount) || 0,
        slaughterExpertStatus: this.slaughterExpertStatus,
        slaughterNotes: this.slaughterNotes?.trim() || '',
        slaughterInfo: slaughterPayload,
      });

      if (!isExisting) {
        try {
          await this.movementService.create({
            animalId: this.animal.id,
            type: 'ciftlik-cikis',
            fromId: this.animal.paddockId || undefined,
            toId: 'kesim',
            date: this.slaughterDate,
            note: `Kesim Kaydı: Et: ${this.meatKg} kg, Baş: ${this.headCount}, Ciğer: ${this.liverCount}, Deri: ${this.skinCount} (${
              this.slaughterExpertStatus === 'cagrildi' ? 'Exper Çağırıldı' : 'Exper Çağırılmadı'
            })${this.slaughterNotes ? ' - ' + this.slaughterNotes.trim() : ''}`,
          } as any);
        } catch (mErr) {
          console.warn('Movement record creation warning:', mErr);
        }
      }

      this.alertService.toastSuccess(
        isExisting ? 'Kesim bilgileri güncellendi.' : 'Kesim kaydı başarıyla oluşturuldu.'
      );
      this.deathRecorded.emit();
      this.close();
    } catch (err: any) {
      console.error('Slaughter record error:', err);
      this.errorMessage.set(err?.message || 'Kesim kaydı kaydedilirken bir hata oluştu.');
      this.alertService.error('İşlem Başarısız', err?.message || 'Kesim kaydı yapılamadı.');
    } finally {
      this.isSaving.set(false);
    }
  }

  // SUBMIT SALE (Satışı Kaydet)
  async submitSale() {
    if (!this.animal?.id) return;

    if (!this.saleAccountId) {
      this.errorMessage.set('Lütfen bir cari seçiniz.');
      return;
    }
    if (!this.saleDate) {
      this.errorMessage.set('Lütfen satış tarihini belirtiniz.');
      return;
    }
    if (this.salePrice === null || this.salePrice === undefined || isNaN(Number(this.salePrice)) || Number(this.salePrice) < 0) {
      this.errorMessage.set('Lütfen geçerli bir fiyat giriniz.');
      return;
    }

    this.errorMessage.set(null);

    const selectedAccount = this.accounts().find((a) => a.id === this.saleAccountId);
    const accountTitle = selectedAccount?.title || (this.saleAccountId === 'diger' ? (this.customAccountTitle.trim() || 'Genel Müşteri') : 'Belirtilmedi');

    const isExisting = this.isAlreadySold();
    const confirmed = await this.alertService.confirm(
      isExisting ? 'Satış Bilgilerini Güncelle' : 'Satış Kaydını Onayla',
      isExisting
        ? `${this.animal.farmTagNo} küpeli hayvanın satış bilgilerini güncellemek istediğinize emin misiniz?`
        : `${this.animal.farmTagNo} küpeli hayvanın satış kaydını yapmak istediğinize emin misiniz? Hayvan durumu "Satıldı" (pasif) olarak güncellenecektir.`,
      isExisting ? 'Güncelle' : 'Satışı Kaydet',
      'Vazgeç'
    );

    if (!confirmed) return;

    this.isSaving.set(true);
    try {
      const salePayload: AnimalSaleRecord = {
        date: this.saleDate,
        price: Number(this.salePrice) || 0,
        weightKg: this.saleWeightKg !== null && !isNaN(Number(this.saleWeightKg)) ? Number(this.saleWeightKg) : null,
        accountId: this.saleAccountId,
        accountTitle: accountTitle,
        notes: this.saleNotes?.trim() || '',
        recordedAt: new Date().toISOString(),
      };

      await this.animalService.update(this.animal.id, {
        status: 'satildi',
        saleDate: this.saleDate,
        salePrice: Number(this.salePrice) || 0,
        saleWeightKg: salePayload.weightKg,
        saleAccountId: this.saleAccountId,
        saleAccountTitle: accountTitle,
        saleInfo: salePayload,
      });

      if (!isExisting) {
        try {
          await this.movementService.create({
            animalId: this.animal.id,
            type: 'ciftlik-cikis',
            fromId: this.animal.paddockId || undefined,
            toId: 'satis',
            date: this.saleDate,
            note: `Satış Kaydı: Cari: ${accountTitle}, Fiyat: ${this.salePrice} ₺${salePayload.weightKg ? ', Ağırlık: ' + salePayload.weightKg + ' kg' : ''}`,
          } as any);
        } catch (mErr) {
          console.warn('Movement record creation warning:', mErr);
        }
      }

      this.alertService.toastSuccess(
        isExisting ? 'Satış bilgileri güncellendi.' : 'Satış kaydı başarıyla oluşturuldu.'
      );
      this.deathRecorded.emit();
      this.close();
    } catch (err: any) {
      console.error('Sale record error:', err);
      this.errorMessage.set(err?.message || 'Satış kaydı kaydedilirken bir hata oluştu.');
      this.alertService.error('İşlem Başarısız', err?.message || 'Satış kaydı yapılamadı.');
    } finally {
      this.isSaving.set(false);
    }
  }

  // REVERT DEATH
  async revertDeath() {
    if (!this.animal?.id) return;

    const confirmed = await this.alertService.confirm(
      'Ölüm Kaydını Geri Al',
      `${this.animal.farmTagNo} küpeli hayvanın ölüm kaydını iptal edip tekrar 'Aktif' duruma getirmek istediğinize emin misiniz?`,
      'Evet, Aktif Yap',
      'Vazgeç'
    );

    if (!confirmed) return;

    this.isSaving.set(true);
    try {
      await this.animalService.update(this.animal.id, {
        status: 'aktif',
        deathDate: null,
        deathReason: null,
        deathExpertStatus: null,
        deathNotes: null,
        deathInfo: null,
      });

      try {
        await this.movementService.create({
          animalId: this.animal.id,
          type: 'ciftlik-giris',
          toId: this.animal.paddockId || undefined,
          date: new Date().toISOString().substring(0, 10),
          note: 'Ölüm kaydı iptal edildi, hayvan tekrar aktif sürüye dahil edildi.',
        } as any);
      } catch (mErr) {
        console.warn('Movement revert log warning:', mErr);
      }

      this.alertService.toastSuccess('Ölüm kaydı geri alındı, hayvan tekrar aktif duruma getirildi.');
      this.deathRecorded.emit();
      this.close();
    } catch (err: any) {
      console.error('Revert death error:', err);
      this.alertService.error('Hata', err?.message || 'Ölüm kaydı geri alınırken bir hata oluştu.');
    } finally {
      this.isSaving.set(false);
    }
  }

  // REVERT SLAUGHTER
  async revertSlaughter() {
    if (!this.animal?.id) return;

    const confirmed = await this.alertService.confirm(
      'Kesim Kaydını Geri Al',
      `${this.animal.farmTagNo} küpeli hayvanın kesim kaydını iptal edip tekrar 'Aktif' duruma getirmek istediğinize emin misiniz?`,
      'Evet, Aktif Yap',
      'Vazgeç'
    );

    if (!confirmed) return;

    this.isSaving.set(true);
    try {
      await this.animalService.update(this.animal.id, {
        status: 'aktif',
        slaughterDate: null,
        slaughterMeatKg: null,
        slaughterHeadCount: null,
        slaughterLiverCount: null,
        slaughterSkinCount: null,
        slaughterExpertStatus: null,
        slaughterNotes: null,
        slaughterInfo: null,
      });

      try {
        await this.movementService.create({
          animalId: this.animal.id,
          type: 'ciftlik-giris',
          toId: this.animal.paddockId || undefined,
          date: new Date().toISOString().substring(0, 10),
          note: 'Kesim kaydı iptal edildi, hayvan tekrar aktif sürüye dahil edildi.',
        } as any);
      } catch (mErr) {
        console.warn('Movement revert log warning:', mErr);
      }

      this.alertService.toastSuccess('Kesim kaydı geri alındı, hayvan tekrar aktif duruma getirildi.');
      this.deathRecorded.emit();
      this.close();
    } catch (err: any) {
      console.error('Revert slaughter error:', err);
      this.alertService.error('Hata', err?.message || 'Kesim kaydı geri alınırken bir hata oluştu.');
    } finally {
      this.isSaving.set(false);
    }
  }

  // REVERT SALE
  async revertSale() {
    if (!this.animal?.id) return;

    const confirmed = await this.alertService.confirm(
      'Satış Kaydını Geri Al',
      `${this.animal.farmTagNo} küpeli hayvanın satış kaydını iptal edip tekrar 'Aktif' duruma getirmek istediğinize emin misiniz?`,
      'Evet, Aktif Yap',
      'Vazgeç'
    );

    if (!confirmed) return;

    this.isSaving.set(true);
    try {
      await this.animalService.update(this.animal.id, {
        status: 'aktif',
        saleDate: null,
        salePrice: null,
        saleWeightKg: null,
        saleAccountId: null,
        saleAccountTitle: null,
        saleInfo: null,
      });

      try {
        await this.movementService.create({
          animalId: this.animal.id,
          type: 'ciftlik-giris',
          toId: this.animal.paddockId || undefined,
          date: new Date().toISOString().substring(0, 10),
          note: 'Satış kaydı iptal edildi, hayvan tekrar aktif sürüye dahil edildi.',
        } as any);
      } catch (mErr) {
        console.warn('Movement revert log warning:', mErr);
      }

      this.alertService.toastSuccess('Satış kaydı geri alındı, hayvan tekrar aktif duruma getirildi.');
      this.deathRecorded.emit();
      this.close();
    } catch (err: any) {
      console.error('Revert sale error:', err);
      this.alertService.error('Hata', err?.message || 'Satış kaydı geri alınırken bir hata oluştu.');
    } finally {
      this.isSaving.set(false);
    }
  }
}

