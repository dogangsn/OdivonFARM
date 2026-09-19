import { Component, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { VoiceAssistantService, ParsedFarmCommand } from '../../../core/services/voice-assistant.service';
import { AlertService } from '../../../core/services/alert.service';

@Component({
  selector: 'app-voice-assistant-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatTooltipModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div class="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <!-- Header -->
        <div class="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 via-purple-50/30 to-transparent dark:from-indigo-950/40 dark:via-purple-950/20">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <mat-icon class="icon-size-5" [svgIcon]="'heroicons_solid:microphone'"></mat-icon>
            </div>
            <div>
              <h2 class="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Odivon Çiftlik Asistanı (AI)</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  NLP Varlık Çıkarıcı
                </span>
              </h2>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                Mikrofona konuşarak veya mesaj atarak aşı, tartım ve sevk işlemlerini tek cümleyle işleyin.
              </p>
            </div>
          </div>

          <button
            type="button"
            (click)="close.emit()"
            class="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <mat-icon class="icon-size-4" [svgIcon]="'heroicons_outline:x'"></mat-icon>
          </button>
        </div>

        <!-- Navigation Tabs -->
        <div class="px-6 pt-3 border-b border-slate-100 dark:border-slate-800 flex gap-4 text-xs font-bold">
          <button
            type="button"
            (click)="activeTab.set('voice')"
            [class.border-indigo-600]="activeTab() === 'voice'"
            [class.text-indigo-600]="activeTab() === 'voice'"
            class="pb-3 border-b-2 border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <mat-icon class="icon-size-4" [svgIcon]="'heroicons_solid:microphone'"></mat-icon>
            <span>Sesli Komut & Yapay Zekâ</span>
          </button>
          <button
            type="button"
            (click)="activeTab.set('whatsapp')"
            [class.border-emerald-600]="activeTab() === 'whatsapp'"
            [class.text-emerald-600]="activeTab() === 'whatsapp'"
            class="pb-3 border-b-2 border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <mat-icon class="icon-size-4" [svgIcon]="'heroicons_solid:chat-alt-2'"></mat-icon>
            <span>WhatsApp Botu Simülatörü</span>
          </button>
        </div>

        <!-- Tab 1: Voice & NLP -->
        @if (activeTab() === 'voice') {
          <div class="p-6 overflow-y-auto space-y-5 flex-1">
            
            <!-- Microphone Center Animation -->
            <div class="text-center py-4">
              <button
                type="button"
                (click)="toggleListening()"
                class="w-20 h-20 rounded-full flex items-center justify-center transition-all cursor-pointer mx-auto shadow-lg relative"
                [ngClass]="assistant.isListening() ? 'bg-rose-600 text-white ring-8 ring-rose-500/20 animate-pulse' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'"
              >
                <mat-icon class="icon-size-8" [svgIcon]="assistant.isListening() ? 'heroicons_solid:microphone' : 'heroicons_outline:microphone'"></mat-icon>
              </button>
              
              <div class="mt-3 text-xs font-bold text-slate-800 dark:text-slate-200">
                {{ assistant.isListening() ? 'Dinleniyor... Lütfen konuşun' : 'Konuşmak için mikrofona tıklayın' }}
              </div>
              <p class="text-[11px] text-slate-400 mt-0.5">
                (Web Speech API ile doğrudan tarayıcınızdan Türkçe ses tanıma)
              </p>
            </div>

            <!-- Manual Text Input Alternative -->
            <div class="space-y-1.5">
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">Veya Komutu Yazarak Deneyin:</label>
              <div class="flex gap-2">
                <input
                  type="text"
                  [(ngModel)]="manualText"
                  (keyup.enter)="submitManualText()"
                  placeholder="Örn: 1042 küpeli koyuna bugün şap aşısı yapıldı 2 cc uygulandı"
                  class="flex-1 px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  (click)="submitManualText()"
                  class="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Ayrıştır
                </button>
              </div>
            </div>

            <!-- Quick Template Chips -->
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-[10px] text-slate-400 font-bold uppercase">Hızlı Örnekler:</span>
              <button
                type="button"
                (click)="applyTemplate('1042 nolu koyuna bugün şap aşısı yapıldı 2 cc uygulandı')"
                class="px-2.5 py-1 rounded-lg text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                💉 1042 nolu koyuna 2 cc şap aşısı
              </button>
              <button
                type="button"
                (click)="applyTemplate('1042 küpeli tokluyu tarttım 48.5 kg geldi')"
                class="px-2.5 py-1 rounded-lg text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                ⚖️ 1042 küpeli toklu 48.5 kg
              </button>
              <button
                type="button"
                (click)="applyTemplate('1042 nolu koyunu karantina padoğuna taşı')"
                class="px-2.5 py-1 rounded-lg text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                🚚 Karantinaya sevk et
              </button>
            </div>

            <!-- Active Parsed Command Card -->
            @if (assistant.activeCommand(); as cmd) {
              <div class="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-3 animate-in fade-in">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                    <mat-icon class="icon-size-4 text-indigo-600" [svgIcon]="'heroicons_solid:badge-check'"></mat-icon>
                    <span>Yapay Zekâ Komutu Ayrıştırdı (Güven: %{{ cmd.confidence }})</span>
                  </span>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                    {{ cmd.actionType }}
                  </span>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div class="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <div class="text-[10px] text-slate-400">Hayvan Küpe No</div>
                    <div class="font-black text-slate-900 dark:text-white font-mono mt-0.5">{{ cmd.tagNo }}</div>
                  </div>

                  @if (cmd.treatmentName) {
                    <div class="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                      <div class="text-[10px] text-slate-400">Uygulanan Tedavi</div>
                      <div class="font-black text-slate-900 dark:text-white mt-0.5 truncate">{{ cmd.treatmentName }}</div>
                    </div>
                    <div class="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                      <div class="text-[10px] text-slate-400">Dozaj</div>
                      <div class="font-black text-emerald-600 mt-0.5">{{ cmd.dose }}</div>
                    </div>
                  }

                  @if (cmd.weightKg) {
                    <div class="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                      <div class="text-[10px] text-slate-400">Tartılan Canlı Kilo</div>
                      <div class="font-black text-emerald-600 font-mono mt-0.5">{{ cmd.weightKg }} kg</div>
                    </div>
                  }

                  @if (cmd.targetPaddockName) {
                    <div class="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                      <div class="text-[10px] text-slate-400">Hedef Padok</div>
                      <div class="font-black text-indigo-600 mt-0.5">{{ cmd.targetPaddockName }}</div>
                    </div>
                  }

                  <div class="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <div class="text-[10px] text-slate-400">İşlem Tarihi</div>
                    <div class="font-bold text-slate-700 dark:text-slate-300 mt-0.5">Bugün (Anlık)</div>
                  </div>
                </div>

                <div class="text-xs text-slate-600 dark:text-slate-300 italic bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800">
                  "{{ cmd.aiReplyMessage }}"
                </div>

                <div class="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    (click)="confirmAndExecute(cmd)"
                    class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <mat-icon class="icon-size-4" [svgIcon]="'heroicons_solid:check'"></mat-icon>
                    <span>Kaydı Onayla ve Sisteme İşle</span>
                  </button>
                </div>
              </div>
            }
          </div>
        }

        <!-- Tab 2: WhatsApp Simulator -->
        @if (activeTab() === 'whatsapp') {
          <div class="p-6 overflow-y-auto space-y-4 flex-1 bg-slate-100 dark:bg-slate-950">
            <div class="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
              <span class="flex items-center gap-1.5 font-bold">
                <mat-icon class="icon-size-4 text-emerald-600" [svgIcon]="'heroicons_solid:chat-alt-2'"></mat-icon>
                <span>OdivonFARM Resmi WhatsApp Business Hattı Simülasyonu (+90 850 305 0000)</span>
              </span>
              <span class="px-2 py-0.5 rounded-full text-[10px] bg-emerald-200 text-emerald-900 font-extrabold">Çevrimiçi</span>
            </div>

            <!-- Chat Bubble Area -->
            <div class="space-y-3 text-xs">
              <!-- Outgoing message (Farmer) -->
              <div class="flex justify-end">
                <div class="bg-emerald-600 text-white p-3 rounded-2xl rounded-tr-xs max-w-[80%] shadow-xs space-y-1">
                  <p>1042 küpeli toklu bugün tartıldı 48.5 kg geldi. Ayrıca iç parazit iğnesi yapıldı.</p>
                  <div class="text-[10px] text-emerald-200 text-right">14:32 ✓✓</div>
                </div>
              </div>

              <!-- Incoming reply (AI Bot) -->
              <div class="flex justify-start">
                <div class="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-3.5 rounded-2xl rounded-tl-xs max-w-[85%] shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <div class="font-bold text-emerald-600 flex items-center gap-1">
                    <mat-icon class="icon-size-3.5" [svgIcon]="'heroicons_solid:badge-check'"></mat-icon>
                    <span>Odivon Çiftlik Asistanı</span>
                  </div>
                  <p class="leading-relaxed">
                    Merhaba Doğan Bey! Talebiniz başarıyla işlendi:
                    <br>• <strong>Canlı Tartım:</strong> TR-06-K-1042 toklusu <strong>48.5 kg</strong> olarak kaydedildi (Son 30 gün GCAA: +310g/gün).
                    <br>• <strong>Tedavi:</strong> İç Parazit İvermektin (2 cc) uygulandı.
                    <br>• <strong>Arınma Süresi Uyarısı:</strong> Süt tüketimi 3 gün, et kesimi 28 gün yasaklanmıştır.
                  </p>
                  <div class="text-[10px] text-slate-400 text-right">14:32</div>
                </div>
              </div>
            </div>

            <div class="pt-4 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 text-center">
              💡 Çiftçiler ve çobanlar sahada bilgisayar açmadan doğrudan WhatsApp ses kaydı veya mesajla çiftlik operasyonlarını yönetebilir.
            </div>
          </div>
        }

        <!-- Footer -->
        <div class="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-end">
          <button
            type="button"
            (click)="close.emit()"
            class="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>

      </div>
    </div>
  `,
})
export class VoiceAssistantModalComponent {
  assistant = inject(VoiceAssistantService);
  private alert = inject(AlertService);

  close = output<void>();

  activeTab = signal<'voice' | 'whatsapp'>('voice');
  manualText = '';

  toggleListening(): void {
    if (this.assistant.isListening()) {
      this.assistant.stopListening();
    } else {
      this.assistant.startListening();
    }
  }

  submitManualText(): void {
    if (!this.manualText.trim()) return;
    this.assistant.parseNaturalLanguage(this.manualText);
  }

  applyTemplate(text: string): void {
    this.manualText = text;
    this.assistant.parseNaturalLanguage(text);
  }

  async confirmAndExecute(cmd: ParsedFarmCommand): Promise<void> {
    const success = await this.assistant.executeCommand(cmd);
    if (success) {
      this.alert.toastSuccess(`Komut başarıyla veritabanına işlendi: ${cmd.actionType.toUpperCase()}`);
    } else {
      this.alert.warning('Hata', 'Komut işlenirken bir sorun oluştu.');
    }
  }
}
