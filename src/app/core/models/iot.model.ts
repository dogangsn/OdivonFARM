import { BaseDoc } from './base.model';

export type IotDeviceType = 'smart_scale' | 'rfid_gate' | 'barn_sensor' | 'smart_milking_parlour' | 'edge_gateway';
export type IotDeviceStatus = 'online' | 'offline' | 'warning' | 'calibrating';
export type IotConnectionProtocol = 'ble' | 'mqtt' | 'wifi_http' | 'lorawan' | 'rs485_modbus';

/** Süt Sağım Makinesi Canlı Telemetrisi */
export interface MilkingSessionTelemetry {
  deviceId: string;
  stallNumber: number; // Durak no (Örn: 1, 2, 3...)
  animalRfid?: string;
  animalTagNo?: string;
  animalName?: string;
  currentLiters: number;
  flowRateKgPerMin: number;
  durationSeconds: number;
  conductivityMilliSiemens: number; // Süt elektrik iletkenliği (Subklinik mastitis tespiti için: > 6.5 mS/cm riskli)
  isMastitisAlert: boolean;
  temperatureC: number;
  status: 'idle' | 'identifying' | 'milking' | 'finished' | 'cleaning';
  startedAt?: Date;
}

/** farms/{farmId}/iot-devices/{deviceId} */
export interface IotDevice extends Partial<BaseDoc> {
  id?: string;
  name: string;
  type: IotDeviceType;
  macAddress?: string;
  serialNumber?: string;
  locationPaddockId?: string;
  locationPaddockName?: string;
  protocol: IotConnectionProtocol;
  status: IotDeviceStatus;
  batteryLevel?: number; // 0-100%
  signalStrengthDbm?: number; // RSSI e.g. -65 dBm
  lastPingAt?: any;
  firmwareVersion?: string;
  ipAddress?: string;
  calibrationFactor?: number;
  tareOffsetKg?: number;
  stallCount?: number; // Sağımhanedeki durak sayısı
  metadata?: Record<string, any>;
}

/** farms/{farmId}/telemetry-logs/{logId} */
export interface BarnTelemetryLog extends Partial<BaseDoc> {
  id?: string;
  deviceId: string;
  paddockId?: string;
  paddockName?: string;
  timestamp: any;
  temperatureC: number;
  humidityPercent: number;
  ammoniaPpm?: number; // NH3
  co2Ppm?: number;
  lightLux?: number;
  /** Temperature-Humidity Index (THI) for heat stress */
  thiIndex: number;
  thiStressLevel: 'normal' | 'mild' | 'moderate' | 'severe' | 'emergency';
}

/** Otomatik terazi canlı tartım telemetrisi */
export interface ScaleWeightTelemetry {
  deviceId: string;
  scaleName: string;
  weightKg: number;
  isStable: boolean;
  unit: 'kg' | 'g';
  animalRfid?: string;
  animalTagNo?: string;
  timestamp: Date;
}

/** RFID koridor / kapı geçiş olayı */
export interface RfidGatePassageEvent {
  deviceId: string;
  gateName: string;
  paddockFromId?: string;
  paddockToId?: string;
  rfidTag: string;
  animalId?: string;
  animalTagNo?: string;
  direction: 'in' | 'out' | 'transit';
  timestamp: Date;
  rssi?: number;
}
