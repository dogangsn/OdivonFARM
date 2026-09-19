import { BaseDoc } from './base.model';

/** farms/{farmId}/diseases/{diseaseId} — Hastalıklar */
export interface Disease extends BaseDoc {
  name: string;
  description?: string;
}

/** farms/{farmId}/treatmentTypes/{typeId} — Tedavi Türleri */
export interface TreatmentType extends BaseDoc {
  name: string;
}

/** farms/{farmId}/protocols/{protocolId} — Protokol Tanımlama (bir hastalık için uygulanacak tedavi adımları) */
export interface Protocol extends BaseDoc {
  name: string;
  diseaseId?: string;
  steps: ProtocolStep[];
}

export interface ProtocolStep {
  order: number;
  treatmentTypeId: string;
  dayOffset: number;
  note?: string;
}

/** farms/{farmId}/treatments/{treatmentId} — uygulanan tedavi kaydı */
export interface Treatment extends BaseDoc {
  animalId: string;
  treatmentTypeId: string;
  diseaseId?: string;
  protocolId?: string;
  date: any;
  dosage?: string;
  performedBy?: string;
  cost?: number;
  note?: string;
  isAccountingSynced?: boolean;
  accountingTransactionId?: string;
}

/** farms/{farmId}/deathReasons/{reasonId} — Ölüm Nedenleri */
export interface DeathReason extends BaseDoc {
  name: string;
}

/** farms/{farmId}/insuredAnimals/{id} — Sigortalı Hayvanlar */
export interface InsuredAnimal extends BaseDoc {
  animalId: string;
  policyNo: string;
  insurer: string;
  startDate: any;
  endDate: any;
  premium?: number;
  coverage?: number;
}
