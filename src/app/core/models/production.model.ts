import { BaseDoc } from './base.model';

export type MatingStatus = 'koculdu' | 'gozlem' | 'gebe' | 'dogurdu' | 'bos-cikti';

/** farms/{farmId}/matings/{matingId} — Çiftleşmeler */
export interface Mating extends BaseDoc {
  femaleId: string;
  maleId?: string;
  matingDate: any;
  status: MatingStatus;
  expectedBirthDate?: any;
  actualBirthDate?: any;
  offspringIds?: string[];
  note?: string;
}

/** farms/{farmId}/weightRecords/{id} — Canlı Ağırlık Verileri */
export interface WeightRecord extends BaseDoc {
  animalId: string;
  date: any;
  weightKg: number;
  note?: string;
}

export type YieldType = 'sut' | 'yapagi' | 'diger';

export type YieldSession = 'sabah' | 'ogle' | 'aksam' | 'genel';

/** farms/{farmId}/yields/{id} — Verimler (süt üretimi vb.) */
export interface YieldRecord extends BaseDoc {
  animalId?: string;
  herdId?: string;
  type: YieldType;
  date: any;
  time?: string;
  session?: YieldSession;
  amount: number;
  unit: 'lt' | 'kg';
  note?: string;
}

/** farms/{farmId}/rations/{id} — Rasyon (yem formülasyonu) */
export interface Ration extends BaseDoc {
  name: string;
  targetGroup?: string; // ör. hangi sürü/tip için
  items: RationItem[];
}

export interface RationItem {
  stockItemId: string;
  amountKg: number;
}
