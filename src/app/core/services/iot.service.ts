import { Injectable, inject, signal, computed } from '@angular/core';
import { Subject } from 'rxjs';
import {
  IotDevice,
  BarnTelemetryLog,
  ScaleWeightTelemetry,
  RfidGatePassageEvent,
  MilkingSessionTelemetry,
} from '../models/iot.model';
import { FarmContextService } from './farm-context.service';

@Injectable({
  providedIn: 'root',
})
export class IotService {
  private farmContext = inject(FarmContextService);

  // Active IoT Devices
  devices = signal<IotDevice[]>([
    {
      id: 'dev-milking-01',
      name: 'Sağımhane Otomasyon Ünitesi (4 Duraklı Süt Metresi & Mastitis Dedektörü)',
      type: 'smart_milking_parlour',
      status: 'online',
      protocol: 'mqtt',
      batteryLevel: 100,
      signalStrengthDbm: -52,
      firmwareVersion: 'v4.2.0-milking',
      ipAddress: '192.168.1.120',
      stallCount: 4,
      locationPaddockName: 'Merkezi Sağımhane',
    },
    {
      id: 'dev-scale-01',
      name: 'Padok-1 Akıllı Canlı Tartım Kantarı',
      type: 'smart_scale',
      status: 'online',
      protocol: 'ble',
      batteryLevel: 94,
      signalStrengthDbm: -62,
      firmwareVersion: 'v2.4.1-esp32',
      calibrationFactor: 1.002,
      tareOffsetKg: 0.0,
      locationPaddockName: 'Besi Padoğu A',
    },
    {
      id: 'dev-gate-01',
      name: 'Sağımhane Giriş RFID Tünel Anteni',
      type: 'rfid_gate',
      status: 'online',
      protocol: 'wifi_http',
      signalStrengthDbm: -55,
      firmwareVersion: 'v1.8.0-rfid',
      locationPaddockName: 'Sağımhane Koridoru',
    },
    {
      id: 'dev-sensor-01',
      name: 'Ana Barınak Mikroklima Sensörü (SHT31+NH3)',
      type: 'barn_sensor',
      status: 'online',
      protocol: 'mqtt',
      batteryLevel: 88,
      signalStrengthDbm: -70,
      firmwareVersion: 'v3.1.0',
      locationPaddockName: 'Ana Barınak',
    },
  ]);

  // Live Milking Parlour Stalls (Sağımhane Durakları)
  milkingStalls = signal<MilkingSessionTelemetry[]>([
    {
      deviceId: 'dev-milking-01',
      stallNumber: 1,
      animalTagNo: 'TR-06-K-1042',
      animalName: 'Kınalı (Merinos)',
      animalRfid: '982000361284910',
      currentLiters: 3.4,
      flowRateKgPerMin: 1.2,
      durationSeconds: 195,
      conductivityMilliSiemens: 5.4,
      isMastitisAlert: false,
      temperatureC: 38.6,
      status: 'milking',
      startedAt: new Date(Date.now() - 195000),
    },
    {
      deviceId: 'dev-milking-01',
      stallNumber: 2,
      animalTagNo: 'TR-06-K-1088',
      animalName: 'Beyaz İnci',
      animalRfid: '982000361284955',
      currentLiters: 4.8,
      flowRateKgPerMin: 0.1,
      durationSeconds: 280,
      conductivityMilliSiemens: 7.1,
      isMastitisAlert: true, // Yüksek iletkenlik = Mastitis riski!
      temperatureC: 39.2,
      status: 'finished',
      startedAt: new Date(Date.now() - 280000),
    },
    {
      deviceId: 'dev-milking-01',
      stallNumber: 3,
      animalTagNo: 'TR-06-K-1102',
      animalName: 'Gülşah',
      animalRfid: '982000361284990',
      currentLiters: 1.9,
      flowRateKgPerMin: 1.6,
      durationSeconds: 90,
      conductivityMilliSiemens: 5.1,
      isMastitisAlert: false,
      temperatureC: 38.4,
      status: 'milking',
      startedAt: new Date(Date.now() - 90000),
    },
    {
      deviceId: 'dev-milking-01',
      stallNumber: 4,
      currentLiters: 0.0,
      flowRateKgPerMin: 0.0,
      durationSeconds: 0,
      conductivityMilliSiemens: 0.0,
      isMastitisAlert: false,
      temperatureC: 0.0,
      status: 'idle',
    },
  ]);

  // Current Live Scale State
  activeScaleWeight = signal<ScaleWeightTelemetry>({
    deviceId: 'dev-scale-01',
    scaleName: 'Akıllı Canlı Tartım Kantarı',
    weightKg: 0.0,
    isStable: true,
    unit: 'kg',
    timestamp: new Date(),
  });

  // Current Barn Environment State
  currentBarnTelemetry = signal<BarnTelemetryLog>({
    id: 'latest-telemetry',
    deviceId: 'dev-sensor-01',
    paddockName: 'Ana Barınak',
    timestamp: new Date(),
    temperatureC: 22.4,
    humidityPercent: 58.0,
    ammoniaPpm: 8.5,
    co2Ppm: 620,
    lightLux: 340,
    thiIndex: 69.2,
    thiStressLevel: 'normal',
  });

  // Events Stream
  private weightStreamSubject = new Subject<ScaleWeightTelemetry>();
  weightStream$ = this.weightStreamSubject.asObservable();

  private rfidPassageSubject = new Subject<RfidGatePassageEvent>();
  rfidPassage$ = this.rfidPassageSubject.asObservable();

  // BLE Connection State
  isBleConnected = signal<boolean>(false);
  bleDeviceName = signal<string>('');
  private bluetoothDevice: any = null;

  constructor() {
    this.startPeriodicTelemetrySimulation();
  }

  /**
   * Web Bluetooth API Desteği Kontrolü
   */
  isWebBluetoothSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  /**
   * Tarayıcıdan doğrudan Bluetooth (BLE) Akıllı Teraziye Bağlanma
   */
  async connectBleScale(): Promise<boolean> {
    if (!this.isWebBluetoothSupported()) {
      console.warn('Web Bluetooth API bu tarayıcıda desteklenmiyor.');
      return false;
    }

    try {
      const nav: any = navigator;
      const device = await nav.bluetooth.requestDevice({
        filters: [
          { services: ['weight_scale'] },
          { namePrefix: 'Odivon' },
          { namePrefix: 'Scale' },
          { namePrefix: 'ESP32' },
        ],
        optionalServices: ['battery_service', 'device_information'],
      });

      if (!device) return false;

      this.bluetoothDevice = device;
      this.bleDeviceName.set(device.name || 'Akıllı Terazi');
      this.isBleConnected.set(true);

      device.addEventListener('gattserverdisconnected', () => {
        this.isBleConnected.set(false);
        this.bleDeviceName.set('');
      });

      const server = await device.gatt.connect();
      // Weight Scale Service (0x181D)
      try {
        const service = await server.getPrimaryService('weight_scale');
        const characteristic = await service.getCharacteristic('weight_measurement');
        await characteristic.startNotifications();
        characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
          this.parseBleWeightPacket(event.target.value);
        });
      } catch (svcErr) {
        console.log('Standart GATT servisi bulunamadı, özel protokol dinleniyor...');
      }

      return true;
    } catch (err: any) {
      console.error('BLE terazi bağlantı hatası:', err);
      return false;
    }
  }

  /**
   * BLE Terazi paketini çözer (Standart GATT Weight Measurement)
   */
  private parseBleWeightPacket(dataView: DataView): void {
    if (!dataView || dataView.byteLength < 3) return;
    const flags = dataView.getUint8(0);
    const isImperial = (flags & 0x01) !== 0;
    const rawWeight = dataView.getUint16(1, true);
    const weightKg = isImperial ? Number((rawWeight * 0.453592).toFixed(2)) : Number((rawWeight * 0.005).toFixed(2));

    this.activeScaleWeight.set({
      deviceId: this.bluetoothDevice?.id || 'ble-scale',
      scaleName: this.bleDeviceName() || 'BLE Akıllı Terazi',
      weightKg,
      isStable: true,
      unit: 'kg',
      timestamp: new Date(),
    });

    this.weightStreamSubject.next(this.activeScaleWeight());
  }

  /**
   * Manuel veya Demo Amaçlı Tartım Simülasyonu
   */
  simulateScaleReading(targetKg: number, animalTag?: string): void {
    this.activeScaleWeight.update((curr) => ({
      ...curr,
      weightKg: targetKg,
      isStable: true,
      animalTagNo: animalTag || curr.animalTagNo,
      timestamp: new Date(),
    }));
    this.weightStreamSubject.next(this.activeScaleWeight());
  }

  /**
   * Terazi Dara Alma (Tare)
   */
  tareScale(): void {
    this.activeScaleWeight.update((curr) => ({
      ...curr,
      weightKg: 0.0,
      isStable: true,
      timestamp: new Date(),
    }));
  }

  /**
   * Barınak Sıcaklık-Nem İndeksi (THI) Hesaplama
   * Formül: THI = (1.8 * T + 32) - (0.55 - 0.0055 * RH) * (1.8 * T - 26)
   */
  calculateThi(tempC: number, rhPercent: number): { thi: number; stressLevel: 'normal' | 'mild' | 'moderate' | 'severe' | 'emergency' } {
    const thi = Number(((1.8 * tempC + 32) - (0.55 - 0.0055 * rhPercent) * (1.8 * tempC - 26)).toFixed(1));
    let stressLevel: 'normal' | 'mild' | 'moderate' | 'severe' | 'emergency' = 'normal';

    if (thi >= 88) stressLevel = 'emergency';
    else if (thi >= 79) stressLevel = 'severe';
    else if (thi >= 74) stressLevel = 'moderate';
    else if (thi >= 68) stressLevel = 'mild';
    else stressLevel = 'normal';

    return { thi, stressLevel };
  }

  /**
   * Periyodik Arka Plan Mikroklima Telemetrisi Simülasyonu (Canlı Sensör Verisi)
   */
  private startPeriodicTelemetrySimulation(): void {
    if (typeof window === 'undefined') return;

    setInterval(() => {
      // Gerçekçi küçük dalgalanmalar
      const tempDelta = (Math.random() - 0.5) * 0.4;
      const humidityDelta = (Math.random() - 0.5) * 0.8;
      const ammoniaDelta = (Math.random() - 0.5) * 0.3;

      this.currentBarnTelemetry.update((prev) => {
        const newTemp = Number(Math.max(12, Math.min(36, prev.temperatureC + tempDelta)).toFixed(1));
        const newHum = Number(Math.max(30, Math.min(90, prev.humidityPercent + humidityDelta)).toFixed(1));
        const newNh3 = Number(Math.max(2, Math.min(30, (prev.ammoniaPpm || 8) + ammoniaDelta)).toFixed(1));
        const { thi, stressLevel } = this.calculateThi(newTemp, newHum);

        return {
          ...prev,
          temperatureC: newTemp,
          humidityPercent: newHum,
          ammoniaPpm: newNh3,
          thiIndex: thi,
          thiStressLevel: stressLevel,
          timestamp: new Date(),
        };
      });

      // Aktif sağım duraklarındaki süt akışını simüle et
      this.milkingStalls.update((stalls) =>
        stalls.map((stall) => {
          if (stall.status === 'milking') {
            const added = Number((Math.random() * 0.08 + 0.02).toFixed(2));
            const newTotal = Number((stall.currentLiters + added).toFixed(2));
            const newFlow = Number((Math.random() * 0.4 + 1.1).toFixed(1));
            const newDuration = stall.durationSeconds + 4;
            const conductivity = Number((5.2 + (Math.random() - 0.5) * 0.4).toFixed(1));

            return {
              ...stall,
              currentLiters: newTotal,
              flowRateKgPerMin: newTotal > 5.5 ? 0.2 : newFlow,
              durationSeconds: newDuration,
              conductivityMilliSiemens: conductivity,
              isMastitisAlert: conductivity > 6.5,
              status: newTotal > 6.0 ? 'finished' : 'milking',
            };
          }
          return stall;
        })
      );
    }, 4000);
  }

  /**
   * Sağım Başlat (Belirli bir durakta hayvan için)
   */
  startMilking(stallNumber: number, animalTagNo: string, animalName?: string, animalRfid?: string): void {
    this.milkingStalls.update((stalls) =>
      stalls.map((s) => {
        if (s.stallNumber === stallNumber) {
          return {
            ...s,
            animalTagNo,
            animalName: animalName || 'Kayıtlı Hayvan',
            animalRfid: animalRfid || '982000' + Math.floor(100000000 + Math.random() * 900000000),
            currentLiters: 0.1,
            flowRateKgPerMin: 1.4,
            durationSeconds: 1,
            conductivityMilliSiemens: 5.3,
            isMastitisAlert: false,
            temperatureC: 38.5,
            status: 'milking',
            startedAt: new Date(),
          };
        }
        return s;
      })
    );
  }

  /**
   * Sağımı Durdur / Tamamla
   */
  stopMilking(stallNumber: number): void {
    this.milkingStalls.update((stalls) =>
      stalls.map((s) => (s.stallNumber === stallNumber ? { ...s, status: 'finished', flowRateKgPerMin: 0.0 } : s))
    );
  }

  /**
   * Durağı Sıfırla (Yeni hayvana hazırla)
   */
  resetStall(stallNumber: number): void {
    this.milkingStalls.update((stalls) =>
      stalls.map((s) =>
        s.stallNumber === stallNumber
          ? {
              ...s,
              animalTagNo: undefined,
              animalName: undefined,
              animalRfid: undefined,
              currentLiters: 0.0,
              flowRateKgPerMin: 0.0,
              durationSeconds: 0,
              conductivityMilliSiemens: 0.0,
              isMastitisAlert: false,
              temperatureC: 0.0,
              status: 'idle',
            }
          : s
      )
    );
  }

  /**
   * Yeni IoT Cihazı Ekle / Eşleştir
   */
  addDevice(newDev: Partial<IotDevice>): void {
    const device: IotDevice = {
      id: 'dev-' + Date.now(),
      name: newDev.name || 'Yeni IoT Cihaz',
      type: newDev.type || 'smart_scale',
      protocol: newDev.protocol || 'mqtt',
      status: 'online',
      batteryLevel: newDev.batteryLevel || 100,
      signalStrengthDbm: -60,
      firmwareVersion: newDev.firmwareVersion || 'v1.0.0',
      ipAddress: newDev.ipAddress,
      locationPaddockName: newDev.locationPaddockName || 'Genel',
      stallCount: newDev.stallCount,
      calibrationFactor: 1.0,
    };
    this.devices.update((list) => [device, ...list]);
  }

  /**
   * Cihazı Sil / Bağlantıyı Kes
   */
  removeDevice(deviceId: string): void {
    this.devices.update((list) => list.filter((d) => d.id !== deviceId));
  }

  /**
   * RFID Geçiş Simülasyonu
   */
  simulateGatePassage(tagNo: string, rfid: string, paddock: string): void {
    const event: RfidGatePassageEvent = {
      deviceId: 'dev-gate-01',
      gateName: 'Sağımhane Giriş Kapısı',
      rfidTag: rfid,
      animalTagNo: tagNo,
      paddockToId: paddock,
      direction: 'in',
      timestamp: new Date(),
      rssi: -58,
    };
    this.rfidPassageSubject.next(event);
  }
}
