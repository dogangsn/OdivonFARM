import { BaseDoc, Gender } from './base.model';

export type AnimalStatus = 'aktif' | 'pasif' | 'satildi' | 'kesildi' | 'oldu';

/** farms/{farmId}/animals/{animalId} — Hayvanlar */
export interface Animal extends BaseDoc {
  /** Çiftlik küpe no (CS-2021-002 gibi) */
  farmTagNo: string;
  /** Ulusal küpe no (DKN) */
  nationalTagNo?: string;
  rfid?: string;
  name?: string;
  gender: Gender;
  birthDate?: any;
  breedId?: string;
  animalTypeId?: string;
  herdId?: string;
  paddockId?: string;
  motherId?: string;
  fatherId?: string;
  tagIds?: string[];
  status: AnimalStatus;
  photoUrl?: string;
  notes?: string;
}

/** farms/{farmId}/breeds/{breedId} — Irklar */
export interface Breed extends BaseDoc {
  name: string;
  description?: string;
  animalTypeId?: string;
  category?: 'kucukbas' | 'buyukbas' | 'kanatli' | 'diger' | string;
  origin?: string;
  purpose?: 'et' | 'sut' | 'kombine' | 'damizlik' | 'yontem' | 'diger' | string;
  colorTheme?: string;
}

/** farms/{farmId}/animalTypes/{typeId} — Hayvan Tipleri (Koyun, Keçi, Koç ...) */
export interface AnimalType extends BaseDoc {
  name: string;
}

/** farms/{farmId}/herds/{herdId} — Sürüler */
export interface Herd extends BaseDoc {
  name: string;
}

/** farms/{farmId}/paddocks/{paddockId} — Padoklar */
export interface Paddock extends BaseDoc {
  name: string;
  capacity?: number;
}

/** farms/{farmId}/tags/{tagId} — Etiketler */
export interface Tag extends BaseDoc {
  name: string;
  color?: string;
}

/** farms/{farmId}/animalMovements/{movementId} — Hayvan Hareketleri (padok/sürü geçiş geçmişi) */
export interface AnimalMovement extends BaseDoc {
  animalId: string;
  type: 'padok' | 'suru' | 'ciftlik-giris' | 'ciftlik-cikis';
  fromId?: string;
  toId?: string;
  date: any;
  note?: string;
}
