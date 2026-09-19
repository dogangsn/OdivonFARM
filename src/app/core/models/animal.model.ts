import { BaseDoc, Gender } from './base.model';

export type AnimalStatus = 'aktif' | 'pasif' | 'satildi' | 'kesildi' | 'oldu';

export type BreedingStatus = 'damizlik' | 'damizlik_adayi' | 'damizlik_disi' | 'besi' | 'belirtilmemis' | string;
export type AcquisitionMethod = 'dogum' | 'satin_alma' | 'hibe' | 'devir' | 'ithalat' | 'diger' | string;

/** farms/{farmId}/animals/{animalId} — Hayvanlar */
export interface Animal extends BaseDoc {
  /** Çiftlik küpe no (CS-2021-002 gibi) */
  farmTagNo: string;
  /** Ulusal küpe no (DKN) */
  nationalTagNo?: string;
  /** Ulusal küpe rengi (Sarı, Kırmızı, Mavi, Yeşil, Beyaz vb.) */
  nationalTagColor?: string;
  rfid?: string;
  name?: string;
  gender: Gender;
  birthDate?: any;
  breedId?: string;
  breed?: string;
  species?: string;
  animalTypeId?: string;
  herdId?: string;
  paddockId?: string;
  motherId?: string;
  fatherId?: string;
  tagIds?: string[];
  status: AnimalStatus;
  /** Damızlık Durumu (Damızlık, Damızlık Adayı, Damızlık Dışı vb.) */
  breedingStatus?: BreedingStatus;
  /** Damızlık Puanı (Örn: 85) */
  breedingScore?: number | null;
  /** Edinme Tarihi */
  acquisitionDate?: any;
  /** Edinme Yöntemi (Doğum, Satın Alma, Hibe, Devir, İthalat vb.) */
  acquisitionMethod?: AcquisitionMethod;
  photoUrl?: string;
  /** Özel Notlar / Açıklama */
  notes?: string;
  /** Açıklama (Alternatif alan) */
  description?: string;
  /** Ölüm Tarihi (Örn: 2025-09-05) */
  deathDate?: string | null;
  /** Ölüm Nedeni (Hastalık, Kaza, Zehirlenme, vb.) */
  deathReason?: string | null;
  /** Sigorta/TARSİM Exper Durumu */
  deathExpertStatus?: 'cagrilmadi' | 'cagrildi' | string | null;
  /** Ölüm Notları / Rapor Özeti */
  deathNotes?: string | null;
  /** Detaylı Ölüm Bilgisi */
  deathInfo?: AnimalDeathRecord | null;
  /** Kesim Tarihi (Örn: 2025-09-05) */
  slaughterDate?: string | null;
  /** Karkas Et Miktarı (kg) */
  slaughterMeatKg?: number | null;
  /** Baş Miktarı (adet) */
  slaughterHeadCount?: number | null;
  /** Ciğer Miktarı */
  slaughterLiverCount?: number | null;
  /** Deri Miktarı */
  slaughterSkinCount?: number | null;
  /** Sigorta/TARSİM Exper Durumu */
  slaughterExpertStatus?: 'cagrilmadi' | 'cagrildi' | string | null;
  /** Kesim Notları */
  slaughterNotes?: string | null;
  /** Detaylı Kesim Bilgisi */
  slaughterInfo?: AnimalSlaughterRecord | null;
  /** Satış Tarihi (Örn: 2025-09-05) */
  saleDate?: string | null;
  /** Satış Fiyatı (₺) */
  salePrice?: number | null;
  /** Satış Ağırlığı (kg) */
  saleWeightKg?: number | null;
  /** Alıcı Cari ID */
  saleAccountId?: string | null;
  /** Alıcı Cari Ünvanı */
  saleAccountTitle?: string | null;
  /** Detaylı Satış Bilgisi */
  saleInfo?: AnimalSaleRecord | null;
}

export interface AnimalSaleRecord {
  date: string;
  price: number;
  weightKg?: number | null;
  accountId?: string | null;
  accountTitle?: string | null;
  notes?: string;
  recordedAt?: any;
}

export interface AnimalDeathRecord {
  date: string;
  reason: string;
  expertStatus: 'cagrilmadi' | 'cagrildi' | string;
  notes?: string;
  recordedAt?: any;
}

export interface AnimalSlaughterRecord {
  date: string;
  expertStatus: 'cagrilmadi' | 'cagrildi' | string;
  meatKg?: number | null;
  headCount?: number | null;
  liverCount?: number | null;
  skinCount?: number | null;
  notes?: string;
  recordedAt?: any;
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
