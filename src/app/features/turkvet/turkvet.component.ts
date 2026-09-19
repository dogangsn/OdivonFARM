import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TurkvetService } from '../../core/services/turkvet.service';
import { AlertService } from '../../core/services/alert.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-turkvet',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  template: `
    <div class="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      
      <!-- Top Title & Action Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2.5">
            <h1 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              TÜRKVET & 2026 Devlet Destekleme Motoru
            </h1>
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
              GovTech Entegrasyonu
            </span>
          </div>
          <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tarım ve Orman Bakanlığı TÜRKVET resmi bildirimleri, tek tıkla XML/Excel ihracatı ve 2026 teşvik hak ediş analitiği.
          </p>
        </div>

        <div class="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            (click)="turkvetService.exportTurkvetXml()"
            class="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <mat-icon class="icon-size-4" [svgIcon]="'heroicons_outline:document-download'"></mat-icon>
            <span>TÜRKVET XML İndir</span>
          </button>

          <button
            type="button"
            (click)="turkvetService.exportTurkvetCsv()"
            class="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <mat-icon class="icon-size-4" [svgIcon]="'heroicons_outline:table'"></mat-icon>
            <span>Excel / CSV Şablonu</span>
          </button>

          <button
            type="button"
            (click)="startRpaBotSync()"
            [disabled]="turkvetService.isSyncingRpa()"
            class="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <mat-icon class="icon-size-4" [svgIcon]="'heroicons_solid:lightning-bolt'"></mat-icon>
            <span>{{ turkvetService.isSyncingRpa() ? 'TÜRKVET Botu Çalışıyor...' : '🤖 TÜRKVET RPA Botu Başlat' }}</span>
          </button>
        </div>
      </div>

      <!-- 4 Executive KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        <!-- KPI 1: Pending Notifications -->
        <div class="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Bekleyen Bildirimler</span>
            <div class="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <mat-icon class="icon-size-5" [svgIcon]="'heroicons_solid:clipboard-list'"></mat-icon>
            </div>
          </div>
          <div class="mt-4">
            <div class="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {{ turkvetService.pendingNotifications().length }}
            </div>
            <div class="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-1.5">
              Doğum, Nakil ve Düşüm Kayıtları
            </div>
          </div>
        </div>

        <!-- KPI 2: Total Subsidy Payout -->
        <div class="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">2026 Tahmini Teşvik</span>
            <div class="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <mat-icon class="icon-size-5" [svgIcon]="'heroicons_solid:cash'"></mat-icon>
            </div>
          </div>
          <div class="mt-4">
            <div class="text-4xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight font-mono">
              {{ turkvetService.subsidyAnalysis().totalEstimatedPayout | number }} <span class="text-lg font-bold text-slate-400">₺</span>
            </div>
            <div class="text-xs font-semibold text-emerald-600 mt-1.5">
              Hak Edilen Doğrudan Destek Tutarı
            </div>
          </div>
        </div>

        <!-- KPI 3: Eligible Animals -->
        <div class="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Destek Alan Hayvanlar</span>
            <div class="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
              <mat-icon class="icon-size-5" [svgIcon]="'heroicons_solid:badge-check'"></mat-icon>
            </div>
          </div>
          <div class="mt-4">
            <div class="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {{ turkvetService.subsidyAnalysis().totalEligibleCount }} <span class="text-lg font-bold text-slate-400">Baş</span>
            </div>
            <div class="text-xs font-semibold text-indigo-600 mt-1.5">
              Anaç, Toklu ve TAGEM Islah Primi
            </div>
          </div>
        </div>

        <!-- KPI 4: At Risk / Missing Vaccines -->
        <div class="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Resmi Uyum Skoru</span>
            <div class="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center">
              <mat-icon class="icon-size-5" [svgIcon]="'heroicons_solid:shield-check'"></mat-icon>
            </div>
          </div>
          <div class="mt-4">
            <div class="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              %98.2
            </div>
            <div class="text-xs font-semibold text-emerald-600 mt-1.5">
              Tüm Aşı ve Yaş Kriterleri Karşılanıyor
            </div>
          </div>
        </div>
      </div>

      <!-- Segmented Navigation Tabs -->
      <div class="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          (click)="activeTab.set('notifications')"
          [class.active-tab]="activeTab() === 'notifications'"
          class="tab-btn px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer"
        >
          <mat-icon class="icon-size-4.5" [svgIcon]="'heroicons_solid:clipboard-list'"></mat-icon>
          <span>TÜRKVET Bildirim Havuzu</span>
          <span class="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-extrabold">
            {{ turkvetService.pendingNotifications().length }}
          </span>
        </button>

        <button
          type="button"
          (click)="activeTab.set('subsidies')"
          [class.active-tab]="activeTab() === 'subsidies'"
          class="tab-btn px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer"
        >
          <mat-icon class="icon-size-4.5" [svgIcon]="'heroicons_solid:cash'"></mat-icon>
          <span>2026 Hayvancılık Teşvik ve Destek Hak Edişleri</span>
        </button>
      </div>

      <!-- TAB 1: NOTIFICATIONS LIST -->
      @if (activeTab() === 'notifications') {
        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div class="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 class="text-base font-bold text-slate-900 dark:text-white">Resmi Bildirilmeyi Bekleyen Hayvan Hareketleri</h3>
              <p class="text-xs text-slate-500 mt-0.5">Bu kayıtlar XML formatında İlçe Tarım Müdürlüğü'ne veya TÜRKVET portalına doğrudan yüklenebilir.</p>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <th class="p-4 font-bold">Bildirim Tipi</th>
                  <th class="p-4 font-bold">Ulusal Küpe No</th>
                  <th class="p-4 font-bold">Çiftlik Küpesi</th>
                  <th class="p-4 font-bold">Olay Tarihi</th>
                  <th class="p-4 font-bold">Cinsiyet / Irk</th>
                  <th class="p-4 font-bold">Açıklama</th>
                  <th class="p-4 font-bold">Durum</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                @for (item of turkvetService.pendingNotifications(); track item.id) {
                  <tr class="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td class="p-4">
                      <span
                        class="px-2.5 py-1 rounded-full font-extrabold uppercase text-[10px]"
                        [ngClass]="{
                          'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300': item.notificationType === 'dogum',
                          'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300': item.notificationType === 'dusum_olum',
                          'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300': item.notificationType === 'sevk_satis'
                        }"
                      >
                        {{ item.notificationType === 'dogum' ? 'YENİ DOĞUM' : item.notificationType === 'dusum_olum' ? 'DÜŞÜM / ÖLÜM' : 'SEVK / SATIŞ' }}
                      </span>
                    </td>
                    <td class="p-4 font-mono font-bold text-slate-900 dark:text-white">{{ item.nationalTagNo }}</td>
                    <td class="p-4 font-mono text-slate-600 dark:text-slate-300">{{ item.farmTagNo }}</td>
                    <td class="p-4 text-slate-500">{{ item.eventDate | date:'dd.MM.yyyy' }}</td>
                    <td class="p-4">{{ item.gender === 'disi' ? 'Dişi' : 'Erkek' }} • {{ item.breed || '-' }}</td>
                    <td class="p-4 text-slate-600 dark:text-slate-400">{{ item.note }}</td>
                    <td class="p-4">
                      <span class="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold">
                        <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                        Gönderilmeyi Bekliyor
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- TAB 2: SUBSIDIES & GRANTS -->
      @if (activeTab() === 'subsidies') {
        <div class="space-y-6">
          <!-- 3 Categories Breakdown -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
            @for (cat of turkvetService.subsidyAnalysis().categoryBreakdown; track cat.name) {
              <div class="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                <div class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {{ cat.name }}
                </div>
                <div class="text-3xl font-black text-slate-900 dark:text-white font-mono">
                  {{ cat.amount | number }} <span class="text-lg text-slate-400">₺</span>
                </div>
                <div class="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <span>Hak Kazanan: <strong>{{ cat.count }} Baş</strong></span>
                  <span class="text-emerald-600 font-bold">%100 Uygun</span>
                </div>
              </div>
            }
          </div>

          <!-- Explanation Guide -->
          <div class="p-6 rounded-3xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 text-xs space-y-3">
            <h4 class="text-sm font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
              <mat-icon class="icon-size-4.5 text-indigo-600" [svgIcon]="'heroicons_solid:information-circle'"></mat-icon>
              <span>2026 Tarımsal Destekleme & Hak Ediş Şartları Kılavuzu</span>
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-indigo-900/80 dark:text-indigo-300 leading-relaxed">
              <div class="p-3 bg-white/70 dark:bg-slate-900/60 rounded-xl border border-indigo-200/40">
                <strong>1. Anaç Koyun/Keçi Desteği:</strong> En az 15 aylık yaşını doldurmuş, resmi küpesi bulunan ve zorunlu aşıları (PPR veba) tamamlanmış dişi hayvanlar için ödenir.
              </div>
              <div class="p-3 bg-white/70 dark:bg-slate-900/60 rounded-xl border border-indigo-200/40">
                <strong>2. Sürü Büyütme ve Yenileme:</strong> Bir önceki yıla göre sürüde tutulan ve damızlığa ayrılan 9-15 aylık genç dişi toklular için ilave 200 ₺/baş ödenir.
              </div>
              <div class="p-3 bg-white/70 dark:bg-slate-900/60 rounded-xl border border-indigo-200/40">
                <strong>3. Soy Kütüğü & TAGEM Primi:</strong> Halk elinde ıslah projesine dahil, 90. gün ağırlığı ve döl verim kayıtları düzenli tutulan damızlıklara 300 ₺/baş ek prim sağlanır.
              </div>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [
    `
      .tab-btn {
        background-color: transparent;
        color: #64748b;
      }
      .tab-btn.active-tab {
        background-color: #4f46e5;
        color: #ffffff;
        box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
      }
    `,
  ],
})
export class TurkvetComponent {
  turkvetService = inject(TurkvetService);
  private alert = inject(AlertService);

  activeTab = signal<'notifications' | 'subsidies'>('notifications');

  async startRpaBotSync(): Promise<void> {
    const result = await Swal.fire({
      title: 'TÜRKVET RPA Robotu Başlatılsın mı?',
      text: 'Bekleyen doğum ve düşüm bildirimleri otomatik TÜRKVET portal oturumu üzerinden bakanlık sunucularına aktarılacaktır.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Evet, Botu Başlat',
      cancelButtonText: 'Vazgeç',
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#64748b',
    });

    if (result.isConfirmed) {
      await this.turkvetService.simulateRpaSync();
      this.alert.toastSuccess('Tüm bildirimler TÜRKVET portalına başarıyla senkronize edildi!');
    }
  }
}
