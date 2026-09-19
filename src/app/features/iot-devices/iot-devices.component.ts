import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IotService } from '../../core/services/iot.service';
import { IotDevice, IotDeviceType, IotConnectionProtocol, MilkingSessionTelemetry } from '../../core/models/iot.model';
import { AlertService } from '../../core/services/alert.service';

@Component({
  selector: 'app-iot-devices',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatTooltipModule],
  template: `
    <div class="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      <!-- Top Title & Action Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2.5">
            <h1 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              IoT & Gömülü Sistem Cihaz Yönetimi
            </h1>
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Çiftlik Yerel Ağı Canlı
            </span>
          </div>
          <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Süt sağım makineleri, Bluetooth akıllı kantar, RFID geçiş kapıları ve barınak mikroklima telemetrisi.
          </p>
        </div>

        <div class="flex items-center gap-2.5 flex-wrap">
          <!-- Web Bluetooth Connect Button -->
          <button
            type="button"
            (click)="connectBluetooth()"
            [disabled]="!iotService.isWebBluetoothSupported()"
            class="px-4 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/80 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            matTooltip="Google Chrome/Edge üzerinden doğrudan Bluetooth tartıya bağlanın"
          >
            <mat-icon class="icon-size-4" [svgIcon]="'heroicons_solid:signal'"></mat-icon>
            <span>{{ iotService.isBleConnected() ? 'BLE: ' + iotService.bleDeviceName() : 'Bluetooth Tartı Eşleştir' }}</span>
          </button>

          <!-- Add Device Button -->
          <button
            type="button"
            (click)="openAddDeviceDrawer()"
            class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all flex items-center gap-2 cursor-pointer"
          >
            <mat-icon class="icon-size-4" [svgIcon]="'heroicons_solid:plus'"></mat-icon>
            <span>Yeni Cihaz Tanımla</span>
          </button>
        </div>
      </div>

      <!-- 4 Executive KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        <!-- KPI 1: Active Devices -->
        <div class="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Bağlı Cihazlar</span>
            <div class="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <mat-icon class="icon-size-5" [svgIcon]="'heroicons_solid:cpu-chip'"></mat-icon>
            </div>
          </div>
          <div class="mt-4">
            <div class="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {{ iotService.devices().length }}
            </div>
            <div class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1">
              <mat-icon class="icon-size-3.5" [svgIcon]="'heroicons_solid:check-circle'"></mat-icon>
              <span>Tüm Cihazlar Çevrimiçi</span>
            </div>
          </div>
          <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex justify-between">
            <span>Edge Gateway: <strong>Aktif</strong></span>
            <span>MQTT 1883</span>
          </div>
        </div>

        <!-- KPI 2: Milking Parlour Flow -->
        <div class="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Canlı Sağım Akışı</span>
            <div class="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <mat-icon class="icon-size-5" [svgIcon]="'heroicons_solid:beaker'"></mat-icon>
            </div>
          </div>
          <div class="mt-4">
            <div class="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {{ activeMilkingLiters() }} <span class="text-lg font-bold text-slate-400">Lt</span>
            </div>
            <div class="text-xs font-semibold text-sky-600 dark:text-sky-400 mt-1.5">
              {{ activeStallsCount() }} Durakta Aktif Sağım
            </div>
          </div>
          <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex justify-between">
            <span>Süt Metresi: <strong>ICAR Uyumlu</strong></span>
            @if (hasMastitisAlert()) {
              <span class="text-rose-500 font-bold flex items-center gap-1">
                <mat-icon class="icon-size-3.5" [svgIcon]="'heroicons_solid:exclamation-triangle'"></mat-icon>
                Mastitis Riski!
              </span>
            } @else {
              <span class="text-emerald-500 font-bold">Sağlık: Normal</span>
            }
          </div>
        </div>

        <!-- KPI 3: Live Scale Weight -->
        <div class="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Akıllı Baskül (BLE)</span>
            <div class="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <mat-icon class="icon-size-5" [svgIcon]="'heroicons_solid:scale'"></mat-icon>
            </div>
          </div>
          <div class="mt-4">
            <div class="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {{ iotService.activeScaleWeight().weightKg }} <span class="text-lg font-bold text-slate-400">kg</span>
            </div>
            <div class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1">
              <span class="w-2 h-2 rounded-full" [ngClass]="iotService.activeScaleWeight().isStable ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'"></span>
              <span>{{ iotService.activeScaleWeight().isStable ? 'Dengelendi (Kilitli)' : 'Tartılıyor...' }}</span>
            </div>
          </div>
          <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex justify-between">
            <span>Dara: <strong>0.0 kg</strong></span>
            <span>Load Cell HX711</span>
          </div>
        </div>

        <!-- KPI 4: Barn Environment & THI -->
        <div class="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Barınak Mikroklima</span>
            <div class="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <mat-icon class="icon-size-5" [svgIcon]="'heroicons_solid:sun'"></mat-icon>
            </div>
          </div>
          <div class="mt-4">
            <div class="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {{ iotService.currentBarnTelemetry().temperatureC }}°C
            </div>
            <div class="text-xs font-semibold mt-1.5 flex items-center gap-1" [ngClass]="iotService.currentBarnTelemetry().thiIndex >= 74 ? 'text-rose-500' : 'text-emerald-600'">
              <span>THI İndeksi: {{ iotService.currentBarnTelemetry().thiIndex }} ({{ getThiLabel(iotService.currentBarnTelemetry().thiStressLevel) }})</span>
            </div>
          </div>
          <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex justify-between">
            <span>Nem: <strong>%{{ iotService.currentBarnTelemetry().humidityPercent }}</strong></span>
            <span>NH₃: <strong>{{ iotService.currentBarnTelemetry().ammoniaPpm }} ppm</strong></span>
          </div>
        </div>
      </div>

      <!-- Segmented Navigation Tabs -->
      <div class="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto custom-scroll">
        <button
          type="button"
          (click)="activeTab.set('milking')"
          [class.active-tab]="activeTab() === 'milking'"
          class="tab-btn px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <mat-icon class="icon-size-4.5" [svgIcon]="'heroicons_solid:beaker'"></mat-icon>
          <span>Süt Sağma Makinesi Otomasyonu</span>
          <span class="px-2 py-0.5 rounded-full text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-extrabold">
            4 Durak
          </span>
        </button>

        <button
          type="button"
          (click)="activeTab.set('scale')"
          [class.active-tab]="activeTab() === 'scale'"
          class="tab-btn px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <mat-icon class="icon-size-4.5" [svgIcon]="'heroicons_solid:scale'"></mat-icon>
          <span>Akıllı Tartım Kantarı (BLE)</span>
        </button>

        <button
          type="button"
          (click)="activeTab.set('sensors')"
          [class.active-tab]="activeTab() === 'sensors'"
          class="tab-btn px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <mat-icon class="icon-size-4.5" [svgIcon]="'heroicons_solid:sun'"></mat-icon>
          <span>Barınak Mikroklima & THI</span>
        </button>

        <button
          type="button"
          (click)="activeTab.set('devices')"
          [class.active-tab]="activeTab() === 'devices'"
          class="tab-btn px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <mat-icon class="icon-size-4.5" [svgIcon]="'heroicons_solid:cpu-chip'"></mat-icon>
          <span>Cihaz Listesi & Protokoller</span>
        </button>
      </div>

      <!-- TAB 1: SMART MILKING PARLOUR (SÜT SAĞMA MAKİNESİ) -->
      @if (activeTab() === 'milking') {
        <div class="space-y-6">
          <div class="p-5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 class="text-base font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                <mat-icon class="icon-size-5 text-indigo-600 dark:text-indigo-400" [svgIcon]="'heroicons_solid:beaker'"></mat-icon>
                <span>Sağımhane Entegrasyon Mimarisi (Elektronik Süt Metresi + RFID)</span>
              </h3>
              <p class="text-xs text-indigo-800/80 dark:text-indigo-300 mt-1 max-w-3xl leading-relaxed">
                Her sağım durağında hayvanın elektronik kulak küpesi RFID okuyucu tarafından algılanır, ICAR onaylı süt metresi akan süt miktarını (Lt) ve elektrik iletkenliğini (mS/cm) anlık olarak sisteme aktarır. Subklinik mastitis riski anında tespit edilir.
              </p>
            </div>
            <div class="flex items-center gap-2">
              <span class="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 shadow-2xs">
                Protokol: Modbus RS485 / MQTT
              </span>
            </div>
          </div>

          <!-- Milking Stalls Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            @for (stall of iotService.milkingStalls(); track stall.stallNumber) {
              <div
                class="p-6 rounded-2xl bg-white dark:bg-slate-900 border transition-all flex flex-col justify-between shadow-xs hover:shadow-md"
                [ngClass]="{
                  'border-emerald-300 dark:border-emerald-700/80 ring-2 ring-emerald-500/20': stall.status === 'milking',
                  'border-rose-300 dark:border-rose-700/80 ring-2 ring-rose-500/20': stall.isMastitisAlert,
                  'border-slate-200/80 dark:border-slate-800': stall.status === 'idle'
                }"
              >
                <!-- Stall Header -->
                <div>
                  <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-2">
                      <span class="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-black flex items-center justify-center">
                        #{{ stall.stallNumber }}
                      </span>
                      <span class="text-xs font-bold text-slate-700 dark:text-slate-300">Sağım Durağı</span>
                    </div>

                    <!-- Status Badge -->
                    <span
                      class="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide"
                      [ngClass]="{
                        'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300': stall.status === 'milking',
                        'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300': stall.status === 'finished',
                        'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400': stall.status === 'idle'
                      }"
                    >
                      {{ stall.status === 'milking' ? 'Sağılıyor' : stall.status === 'finished' ? 'Tamamlandı' : 'Boş / Hazır' }}
                    </span>
                  </div>

                  <!-- Animal Info in Stall -->
                  @if (stall.animalTagNo) {
                    <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 mb-4">
                      <div class="text-xs font-black text-slate-900 dark:text-white truncate">
                        {{ stall.animalTagNo }} ({{ stall.animalName }})
                      </div>
                      <div class="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                        RFID: {{ stall.animalRfid }}
                      </div>
                    </div>
                  } @else {
                    <div class="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center mb-4">
                      <p class="text-xs text-slate-400">Sağım durağı boş. Hayvan bekleniyor...</p>
                    </div>
                  }

                  <!-- Live Liters Display -->
                  <div class="text-center py-3 border-y border-slate-100 dark:border-slate-800/80 mb-4">
                    <div class="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                      {{ stall.currentLiters }} <span class="text-lg font-bold text-slate-400">Litre</span>
                    </div>
                    <div class="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-center gap-3">
                      <span>Akış: <strong>{{ stall.flowRateKgPerMin }} kg/dk</strong></span>
                      <span>Süre: <strong>{{ stall.durationSeconds }} sn</strong></span>
                    </div>
                  </div>

                  <!-- Conductivity & Mastitis Warning -->
                  <div class="space-y-2 mb-4">
                    <div class="flex items-center justify-between text-xs">
                      <span class="text-slate-500 dark:text-slate-400">Elektrik İletkenliği:</span>
                      <span class="font-mono font-bold" [ngClass]="stall.isMastitisAlert ? 'text-rose-600 font-black' : 'text-slate-800 dark:text-slate-200'">
                        {{ stall.conductivityMilliSiemens }} mS/cm
                      </span>
                    </div>
                    @if (stall.isMastitisAlert) {
                      <div class="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-[11px] font-bold flex items-center gap-1.5">
                        <mat-icon class="icon-size-4 text-rose-500" [svgIcon]="'heroicons_solid:exclamation-triangle'"></mat-icon>
                        <span>Mastitis Uyarısı! İletkenlik > 6.5 mS/cm</span>
                      </div>
                    }
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="pt-2 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                  @if (stall.status === 'idle') {
                    <button
                      type="button"
                      (click)="quickStartMilking(stall.stallNumber)"
                      class="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                    >
                      Sağım Başlat
                    </button>
                  } @else if (stall.status === 'milking') {
                    <button
                      type="button"
                      (click)="iotService.stopMilking(stall.stallNumber)"
                      class="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold transition-all cursor-pointer"
                    >
                      Durdur
                    </button>
                  } @else {
                    <button
                      type="button"
                      (click)="saveAndResetStall(stall.stallNumber, stall.currentLiters, stall.animalTagNo)"
                      class="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                    >
                      Verimlere Kaydet
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- TAB 2: SMART SCALE & BLE (AKILLI TARTIM BASKÜLÜ) -->
      @if (activeTab() === 'scale') {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Scale Live Display -->
          <div class="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-6">
                <div>
                  <h3 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <mat-icon class="icon-size-5 text-emerald-600" [svgIcon]="'heroicons_solid:scale'"></mat-icon>
                    <span>Akıllı Canlı Tartım Kantarı</span>
                  </h3>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Bluetooth Low Energy (BLE) veya RS232 kantar indikatörü ile anlık canlı hayvan tartımı.
                  </p>
                </div>
                <span class="px-3 py-1 rounded-full text-xs font-bold" [ngClass]="iotService.isBleConnected() ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'">
                  {{ iotService.isBleConnected() ? 'BLE Bağlı' : 'Bağlantı Hazır' }}
                </span>
              </div>

              <!-- Big Digital Scale Indicator -->
              <div class="p-8 rounded-2xl bg-slate-950 text-white text-center shadow-inner relative overflow-hidden my-6">
                <div class="text-[11px] uppercase tracking-widest text-slate-400 mb-2 font-mono">
                  CANLI AĞIRLIK İNDİKATÖRÜ (LOAD CELL HX711)
                </div>
                <div class="text-6xl sm:text-7xl font-mono font-black tracking-tight text-emerald-400 animate-in fade-in">
                  {{ iotService.activeScaleWeight().weightKg }}
                  <span class="text-2xl text-slate-500 font-sans font-bold">kg</span>
                </div>
                <div class="mt-4 flex items-center justify-center gap-4 text-xs font-mono">
                  <span class="flex items-center gap-1.5" [ngClass]="iotService.activeScaleWeight().isStable ? 'text-emerald-400' : 'text-amber-400'">
                    <span class="w-2.5 h-2.5 rounded-full" [ngClass]="iotService.activeScaleWeight().isStable ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'"></span>
                    {{ iotService.activeScaleWeight().isStable ? 'STABİLİZE / KİLİTLENDİ' : 'HAREKETLİ / TARTILIYOR...' }}
                  </span>
                  <span class="text-slate-500">|</span>
                  <span class="text-slate-400">DARA: 0.00 kg</span>
                </div>
              </div>
            </div>

            <!-- Control Bar -->
            <div class="flex items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 flex-wrap">
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  (click)="iotService.tareScale()"
                  class="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                >
                  Dara Al (Tare)
                </button>
                <button
                  type="button"
                  (click)="simulateQuickWeight(34.8)"
                  class="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                >
                  34.8 kg Test
                </button>
                <button
                  type="button"
                  (click)="simulateQuickWeight(46.2)"
                  class="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                >
                  46.2 kg Test
                </button>
              </div>

              <button
                type="button"
                (click)="saveScaleWeightToAnimal()"
                class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer flex items-center gap-1.5"
              >
                <mat-icon class="icon-size-4" [svgIcon]="'heroicons_solid:check'"></mat-icon>
                <span>Ölçümü Hayvana Kaydet</span>
              </button>
            </div>
          </div>

          <!-- Animal Tag Selector for Scale -->
          <div class="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <h4 class="text-sm font-bold text-slate-900 dark:text-white">Tartılan Hayvanı Seç</h4>
            <div>
              <label class="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Kulak Küpe No / RFID</label>
              <input
                type="text"
                [(ngModel)]="selectedTagForScale"
                placeholder="Örn: TR-06-K-1042 veya 982000..."
                class="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-400 space-y-2">
              <div class="font-bold text-slate-800 dark:text-slate-200">Otomatik RFID Eşleşme:</div>
              <p class="text-[11px] leading-relaxed">
                Kantardaki FDX-B/HDX RFID anteni hayvan platforma bastığı anda küpesini okuyup bu alana otomatik doldurur.
              </p>
            </div>
          </div>
        </div>
      }

      <!-- TAB 3: BARN SENSORS & THI (MİKROKLİMA) -->
      @if (activeTab() === 'sensors') {
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div class="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div class="text-xs font-bold uppercase text-slate-400 mb-1">Ortam Sıcaklığı</div>
            <div class="text-4xl font-black text-slate-900 dark:text-white">
              {{ iotService.currentBarnTelemetry().temperatureC }} °C
            </div>
            <p class="text-xs text-slate-500 mt-2">Sensör: SHT31 Yüksek Hassasiyetli Dijital Sensör</p>
          </div>

          <div class="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div class="text-xs font-bold uppercase text-slate-400 mb-1">Bağıl Nem</div>
            <div class="text-4xl font-black text-slate-900 dark:text-white">
              %{{ iotService.currentBarnTelemetry().humidityPercent }}
            </div>
            <p class="text-xs text-slate-500 mt-2">Optimum Aralık: %50 - %70</p>
          </div>

          <div class="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div class="text-xs font-bold uppercase text-slate-400 mb-1">Amonyak Gazı (NH₃)</div>
            <div class="text-4xl font-black text-slate-900 dark:text-white">
              {{ iotService.currentBarnTelemetry().ammoniaPpm }} ppm
            </div>
            <p class="text-xs text-slate-500 mt-2">Kritik Eşik: > 20 ppm (Havalandırma zorunlu)</p>
          </div>
        </div>
      }

      <!-- TAB 4: ALL DEVICES & PROTOCOLS -->
      @if (activeTab() === 'devices') {
        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div class="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 class="text-base font-bold text-slate-900 dark:text-white">Tanımlı IoT ve Donanım Listesi</h3>
            <span class="text-xs text-slate-500">Toplam {{ iotService.devices().length }} Cihaz</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <th class="p-4 font-bold">Cihaz Adı</th>
                  <th class="p-4 font-bold">Cihaz Tipi</th>
                  <th class="p-4 font-bold">Protokol</th>
                  <th class="p-4 font-bold">Konum / Padok</th>
                  <th class="p-4 font-bold">IP / MAC</th>
                  <th class="p-4 font-bold">Firmware</th>
                  <th class="p-4 font-bold">Durum</th>
                  <th class="p-4 font-bold text-right">İşlem</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                @for (device of iotService.devices(); track device.id) {
                  <tr class="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td class="p-4 font-bold text-slate-900 dark:text-white">
                      {{ device.name }}
                    </td>
                    <td class="p-4">
                      <span class="px-2 py-0.5 rounded-md font-extrabold uppercase text-[10px] bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        {{ getDeviceTypeLabel(device.type) }}
                      </span>
                    </td>
                    <td class="p-4 font-mono uppercase">{{ device.protocol }}</td>
                    <td class="p-4 text-slate-600 dark:text-slate-300">{{ device.locationPaddockName || 'Genel' }}</td>
                    <td class="p-4 font-mono text-slate-500">{{ device.ipAddress || device.macAddress || '-' }}</td>
                    <td class="p-4 font-mono text-slate-500">{{ device.firmwareVersion }}</td>
                    <td class="p-4">
                      <span class="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Çevrimiçi
                      </span>
                    </td>
                    <td class="p-4 text-right">
                      <button
                        type="button"
                        (click)="iotService.removeDevice(device.id!)"
                        class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                        matTooltip="Cihazı Kaldır"
                      >
                        <mat-icon class="icon-size-4" [svgIcon]="'heroicons_outline:trash'"></mat-icon>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- SLIDE-OVER DRAWER: ADD DEVICE -->
      @if (isAddDrawerOpen()) {
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 transition-opacity" (click)="closeAddDrawer()"></div>

        <!-- Drawer -->
        <div class="fixed inset-y-0 right-0 max-w-md w-full bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
          <div class="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 class="text-lg font-bold text-slate-900 dark:text-white">Yeni Cihaz / İstasyon Ekle</h3>
            <button type="button" (click)="closeAddDrawer()" class="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400">
              <mat-icon [svgIcon]="'heroicons_outline:x-mark'"></mat-icon>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-6 space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Cihaz Adı</label>
              <input type="text" [(ngModel)]="newDevice.name" placeholder="Örn: 8 Duraklı Sağımhane Ünitesi" class="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Cihaz Tipi</label>
              <select [(ngModel)]="newDevice.type" class="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                <option value="smart_milking_parlour">Süt Sağma Makinesi / Sağımhane Otomasyonu</option>
                <option value="smart_scale">Akıllı Canlı Tartım Kantarı (Load Cell / BLE)</option>
                <option value="rfid_gate">RFID Geçiş & Tünel Anteni</option>
                <option value="barn_sensor">Barınak Mikroklima Sensörü (Sıcaklık/Nem/NH3)</option>
                <option value="edge_gateway">Çiftlik Edge Gateway Sunucusu</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Haberleşme Protokolü</label>
              <select [(ngModel)]="newDevice.protocol" class="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                <option value="mqtt">MQTT Broker (1883)</option>
                <option value="ble">Bluetooth Low Energy (BLE)</option>
                <option value="wifi_http">Wi-Fi HTTP REST Webhook</option>
                <option value="rs485_modbus">RS485 Modbus Endüstriyel Hat</option>
                <option value="lorawan">LoRaWAN Uzun Mesafe</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">IP Adresi veya MAC</label>
              <input type="text" [(ngModel)]="newDevice.ipAddress" placeholder="192.168.1.150 veya 24:6F:28:..." class="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Konum / Barınak / Padok</label>
              <input type="text" [(ngModel)]="newDevice.locationPaddockName" placeholder="Örn: Sağımhane A Blok" class="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" />
            </div>
          </div>

          <div class="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button type="button" (click)="closeAddDrawer()" class="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">Vazgeç</button>
            <button type="button" (click)="saveNewDevice()" class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold">Cihazı Kaydet</button>
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
export class IotDevicesComponent {
  iotService = inject(IotService);
  private alert = inject(AlertService);

  activeTab = signal<'milking' | 'scale' | 'sensors' | 'devices'>('milking');
  selectedTagForScale = 'TR-06-K-1042';

  // Add Device Drawer
  isAddDrawerOpen = signal<boolean>(false);
  newDevice: Partial<IotDevice> = {
    name: '',
    type: 'smart_milking_parlour',
    protocol: 'mqtt',
    locationPaddockName: 'Merkezi Sağımhane',
    ipAddress: '',
  };

  activeMilkingLiters = computed(() => {
    const stalls = this.iotService.milkingStalls();
    return stalls.reduce((sum, s) => sum + s.currentLiters, 0).toFixed(1);
  });

  activeStallsCount = computed(() => {
    return this.iotService.milkingStalls().filter((s) => s.status === 'milking').length;
  });

  hasMastitisAlert = computed(() => {
    return this.iotService.milkingStalls().some((s) => s.isMastitisAlert);
  });

  async connectBluetooth(): Promise<void> {
    const success = await this.iotService.connectBleScale();
    if (success) {
      this.alert.toastSuccess('Bluetooth Akıllı Tartı başarıyla bağlandı!');
    } else {
      this.alert.warning('Bluetooth', 'Bağlantı kurulamadı veya cihaz seçilmedi.');
    }
  }

  quickStartMilking(stallNumber: number): void {
    const randomTag = 'TR-06-K-' + Math.floor(1000 + Math.random() * 9000);
    this.iotService.startMilking(stallNumber, randomTag, 'Sağmal Koyun');
    this.alert.toastSuccess(`Durak #${stallNumber} için sağım başlatıldı!`);
  }

  saveAndResetStall(stallNumber: number, liters: number, tagNo?: string): void {
    this.iotService.resetStall(stallNumber);
    this.alert.toastSuccess(`Durak #${stallNumber} verimi (${liters} Lt) başarıyla kaydedildi ve durak sıfırlandı.`);
  }

  simulateQuickWeight(kg: number): void {
    this.iotService.simulateScaleReading(kg, this.selectedTagForScale);
    this.alert.toastSuccess(`Teraziye ${kg} kg uygulandı (Stabilize).`);
  }

  saveScaleWeightToAnimal(): void {
    const weight = this.iotService.activeScaleWeight().weightKg;
    this.alert.toastSuccess(`${this.selectedTagForScale} küpeli hayvana ${weight} kg canlı ağırlık başarıyla kaydedildi!`);
  }

  getThiLabel(level: string): string {
    switch (level) {
      case 'emergency': return 'Acil Durum';
      case 'severe': return 'Şiddetli Stres';
      case 'moderate': return 'Orta Düzey Stres';
      case 'mild': return 'Hafif Stres';
      default: return 'Normal / Konfor';
    }
  }

  getDeviceTypeLabel(type: IotDeviceType): string {
    switch (type) {
      case 'smart_milking_parlour': return 'Süt Sağım Ünitesi';
      case 'smart_scale': return 'Akıllı Kantar';
      case 'rfid_gate': return 'RFID Kapı Anteni';
      case 'barn_sensor': return 'Mikroklima Sensörü';
      case 'edge_gateway': return 'Edge Gateway';
      default: return type;
    }
  }

  openAddDeviceDrawer(): void {
    this.newDevice = {
      name: '',
      type: 'smart_milking_parlour',
      protocol: 'mqtt',
      locationPaddockName: 'Merkezi Sağımhane',
      ipAddress: '192.168.1.',
    };
    this.isAddDrawerOpen.set(true);
  }

  closeAddDrawer(): void {
    this.isAddDrawerOpen.set(false);
  }

  saveNewDevice(): void {
    if (!this.newDevice.name) {
      this.alert.warning('Uyarı', 'Lütfen bir cihaz adı girin.');
      return;
    }
    this.iotService.addDevice(this.newDevice);
    this.closeAddDrawer();
    this.alert.toastSuccess('Yeni IoT cihazı başarıyla eşleştirildi!');
  }
}
