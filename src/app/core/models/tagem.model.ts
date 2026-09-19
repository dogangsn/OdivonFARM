import { BaseDoc } from './base.model';

export type TagemStandardPeriod = 'dogum' | 'gun_30' | 'gun_90' | 'gun_120' | 'gun_180';

export interface TagemCorrectionFactors {
  /** Anne yaşı katsayısı: 2 yaş, 3-5 yaş (referans 1.0), 6+ yaş */
  damAgeFactor: number;
  /** Doğum tipi katsayısı: Tekiz (referans 1.0), İkiz, Üçüz+ */
  birthTypeFactor: number;
  /** Cinsiyet katsayısı: Erkek (referans 1.0), Dişi */
  sexFactor: number;
}

export interface TagemGrowthEvaluation {
  animalId: string;
  tagNo: string;
  birthDate: string;
  gender: string;
  birthWeightKg: number;
  actualWeightKg: number;
  actualWeighingDate: string;
  ageInDays: number;
  rawAdgGrams: number; // Ham Günlük Canlı Ağırlık Artışı (GCAA / ADG)
  standardPeriod: TagemStandardPeriod;
  targetDay: number; // 90, 120 vs.
  adjustedWeightKg: number; // Çevre faktörlerinden arındırılmış düzeltilmiş canlı ağırlık
  adjustedAdgGrams: number;
  damAgeAtBirthYears?: number;
  birthType: 'tekiz' | 'ikiz' | 'ucuz' | 'diger';
  scoreRank?: 'A_elit' | 'B_damizlik' | 'C_orta' | 'D_elendi';
}

export interface TagemBreedingIndexResult {
  animalId: string;
  tagNo: string;
  breed: string;
  gender: string;
  compositeIndexScore: number; // 0 - 100
  adjusted90DayWeightKg: number;
  damProlificacyScore: number; // Ananın ikizlik ve döl verim performansı
  damMilkScore?: number;
  classification: 'Damızlık Koç/Teke Adayı' | 'Damızlık Dişi Adayı' | 'Besi Materyali' | 'Islah Dışı';
  blupEstimatedBreedingValue?: number; // Damızlık Değeri Tahmini (+/- sapma)
}

export interface TagemExportRow {
  isletmeKodu: string;
  ilIlce: string;
  projeAdi: string; // Örn: "Halk Elinde Küçükbaş Islahı Ülkesel Projesi"
  koyunKeciTuru: string;
  irk: string;
  hayvanUlusalKupeNo: string;
  hayvanCiftlikKupeNo: string;
  cinsiyet: string;
  dogumTarihi: string;
  dogumTipi: string;
  anaUlusalKupeNo: string;
  babaUlusalKupeNo: string;
  dogumAgirligiKg: number | string;
  gun90TartimTarihi: string;
  gun90TartimAgirligiKg: number | string;
  gun90DuzeltilmisAgirlikKg: number | string;
  gunlukCanliAgirlikArtisiGram: number | string;
  damizlikPuan: number | string;
  damizlikSinifi: string;
  laktasyonSutVerimiLitre?: number | string;
  kayitTarihi: string;
}
