import { Injectable } from '@angular/core';
import {
  Animal,
  WeightRecord,
  Mating,
  YieldRecord,
  Farm,
  TagemStandardPeriod,
  TagemCorrectionFactors,
  TagemGrowthEvaluation,
  TagemBreedingIndexResult,
  TagemExportRow,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class TagemService {
  /**
   * TAGEM & ICAR Standart Düzeltme Katsayıları (Küçükbaş için)
   * Referans baz: 3-5 yaşındaki anadan doğan tekiz erkek kuzu = 1.00
   */
  private readonly DEFAULT_FACTORS: Record<string, TagemCorrectionFactors> = {
    standard: {
      damAgeFactor: 1.0,
      birthTypeFactor: 1.0,
      sexFactor: 1.0,
    },
  };

  /**
   * Yaş ve çevre faktörlerine göre düzeltme çarpanlarını döndürür
   */
  getCorrectionFactors(
    damAgeYears: number = 3,
    birthType: 'tekiz' | 'ikiz' | 'ucuz' | string = 'tekiz',
    gender: 'erkek' | 'disi' | string = 'erkek'
  ): TagemCorrectionFactors {
    // 1. Ana yaşı düzeltme katsayısı (Genç veya çok yaşlı anaların yavruları desteklenir)
    let damAgeFactor = 1.0;
    if (damAgeYears <= 2) {
      damAgeFactor = 1.08; // 2 yaş ana kuzuları %8 dezavantajlı kabul edilir, düzeltilir
    } else if (damAgeYears >= 6) {
      damAgeFactor = 1.05; // 6 yaş üstü ana kuzuları %5 düzeltilir
    } else {
      damAgeFactor = 1.0; // 3-5 yaş ideal referans
    }

    // 2. Doğum tipi düzeltme katsayısı (İkizler tekize normalize edilir)
    let birthTypeFactor = 1.0;
    const bt = String(birthType).toLowerCase();
    if (bt.includes('ikiz')) {
      birthTypeFactor = 1.12; // İkiz kuzu/oğlak %12 düzeltme faktörü
    } else if (bt.includes('ucuz') || bt.includes('üçüz')) {
      birthTypeFactor = 1.18; // Üçüz kuzu/oğlak %18 düzeltme faktörü
    }

    // 3. Cinsiyet düzeltme katsayısı (Dişiler erkeğe normalize edilir)
    let sexFactor = 1.0;
    if (String(gender).toLowerCase() === 'disi' || String(gender).toLowerCase() === 'dişi') {
      sexFactor = 1.1; // Dişi kuzuların ağırlığı erkek eşdeğerine yükseltilir
    }

    return { damAgeFactor, birthTypeFactor, sexFactor };
  }

  /**
   * TAGEM Standart Sütten Kesim (90. Gün) veya 120./180. gün düzeltilmiş ağırlık hesaplaması
   * Formül:
   * Düzeltilmiş Ağırlık = Doğum Ağırlığı + ((Ölçülen Ağırlık - Doğum Ağırlığı) / Yaş Gün) * Hedef Gün * Katsayılar
   */
  calculateAdjustedWeight(
    birthWeightKg: number,
    actualWeightKg: number,
    ageInDays: number,
    targetDay: number = 90,
    damAgeYears: number = 3,
    birthType: string = 'tekiz',
    gender: string = 'erkek'
  ): { adjustedWeightKg: number; rawAdgGrams: number; adjustedAdgGrams: number } {
    if (ageInDays <= 0 || actualWeightKg <= birthWeightKg) {
      return {
        adjustedWeightKg: actualWeightKg || birthWeightKg,
        rawAdgGrams: 0,
        adjustedAdgGrams: 0,
      };
    }

    const weightGain = actualWeightKg - birthWeightKg;
    const rawAdgGrams = Math.round((weightGain / ageInDays) * 1000);

    const factors = this.getCorrectionFactors(damAgeYears, birthType, gender);
    const combinedFactor = factors.damAgeFactor * factors.birthTypeFactor * factors.sexFactor;

    // Hedef güne lineer enterpolasyon ve çevre faktörü düzeltmesi
    const standardGain = (weightGain / ageInDays) * targetDay;
    const adjustedWeightKg = Number((birthWeightKg + standardGain * combinedFactor).toFixed(2));
    const adjustedAdgGrams = Math.round((adjustedWeightKg - birthWeightKg) / targetDay * 1000);

    return { adjustedWeightKg, rawAdgGrams, adjustedAdgGrams };
  }

  /**
   * Bireysel hayvanın TAGEM ıslah ve büyüme değerlendirmesi
   */
  evaluateAnimalGrowth(
    animal: Animal,
    weights: WeightRecord[],
    targetPeriod: TagemStandardPeriod = 'gun_90'
  ): TagemGrowthEvaluation | null {
    if (!animal.birthDate) return null;

    const bDate = new Date(animal.birthDate);
    if (isNaN(bDate.getTime())) return null;

    const targetDay = targetPeriod === 'gun_30' ? 30 : targetPeriod === 'gun_120' ? 120 : targetPeriod === 'gun_180' ? 180 : 90;

    // Doğum ağırlığı
    const birthRecord = weights.find(
      (w) => w.animalId === animal.id && ((w.note && w.note.toLowerCase().includes('dogum')) || w.weightKg <= 6)
    );
    const birthWeightKg = birthRecord ? birthRecord.weightKg : (animal.gender === 'erkek' ? 4.2 : 3.8);

    // Hedef güne en yakın tartım kaydını bul (Örn: 90 gün için 60-120 gün aralığı)
    const animalWeights = weights
      .filter((w) => w.animalId === animal.id && w.weightKg > birthWeightKg)
      .map((w) => {
        const wDate = new Date(w.date || (w as any).recordedAt);
        const diffDays = Math.round((wDate.getTime() - bDate.getTime()) / (1000 * 60 * 60 * 24));
        return { ...w, diffDays, wDate };
      })
      .filter((w) => w.diffDays > 10)
      .sort((a, b) => Math.abs(a.diffDays - targetDay) - Math.abs(b.diffDays - targetDay));

    if (animalWeights.length === 0) return null;

    const closestWeighing = animalWeights[0];
    const ageDays = closestWeighing.diffDays;
    const actualWeightKg = closestWeighing.weightKg;

    const { adjustedWeightKg, rawAdgGrams, adjustedAdgGrams } = this.calculateAdjustedWeight(
      birthWeightKg,
      actualWeightKg,
      ageDays,
      targetDay,
      3, // Varsayılan 3 yaş ana
      'tekiz',
      animal.gender
    );

    let scoreRank: 'A_elit' | 'B_damizlik' | 'C_orta' | 'D_elendi' = 'C_orta';
    if (adjustedWeightKg >= 38) scoreRank = 'A_elit';
    else if (adjustedWeightKg >= 32) scoreRank = 'B_damizlik';
    else if (adjustedWeightKg >= 26) scoreRank = 'C_orta';
    else scoreRank = 'D_elendi';

    return {
      animalId: animal.id || '',
      tagNo: animal.farmTagNo || animal.nationalTagNo || 'Tanımsız',
      birthDate: animal.birthDate,
      gender: animal.gender,
      birthWeightKg,
      actualWeightKg,
      actualWeighingDate: closestWeighing.date || '',
      ageInDays: ageDays,
      rawAdgGrams,
      standardPeriod: targetPeriod,
      targetDay,
      adjustedWeightKg,
      adjustedAdgGrams,
      birthType: 'tekiz',
      scoreRank,
    };
  }

  /**
   * Kombine Damızlık Seçim İndeksi (Kombine Islah Puanı / Selection Index):
   * Küçükbaş ıslahında:
   * Puan = (0.45 * Düzeltilmiş 90. Gün Ağırlığı Puanı) + (0.30 * GCAA Puanı) + (0.15 * Anaç Döl Verimi) + (0.10 * Morfolojik Puan)
   */
  calculateBreedingIndex(
    animal: Animal,
    growth: TagemGrowthEvaluation | null,
    motherOffspringCount: number = 1
  ): TagemBreedingIndexResult {
    const adjWeight = growth ? growth.adjustedWeightKg : 28;
    const adg = growth ? growth.adjustedAdgGrams : 250;

    // 1. Ağırlık Puanı (Max 45) -> 35 kg ve üzeri tam puan
    const weightScore = Math.min(45, Math.max(0, (adjWeight / 36) * 45));

    // 2. Günlük Canlı Ağırlık Artışı Puanı (Max 30) -> 350 gr/gün tam puan
    const adgScore = Math.min(30, Math.max(0, (adg / 350) * 30));

    // 3. Döl verimi / İkizlik puanı (Max 15)
    const prolifScore = motherOffspringCount >= 2 ? 15 : 10;

    // 4. Damızlık Puanı / Soy Kütüğü (Max 10)
    const basePedigreeScore = animal.motherId && animal.fatherId ? 10 : 6;

    const totalScore = Math.min(100, Math.round(weightScore + adgScore + prolifScore + basePedigreeScore));

    let classification: 'Damızlık Koç/Teke Adayı' | 'Damızlık Dişi Adayı' | 'Besi Materyali' | 'Islah Dışı' = 'Besi Materyali';
    if (animal.gender === 'erkek') {
      classification = totalScore >= 75 ? 'Damızlık Koç/Teke Adayı' : 'Besi Materyali';
    } else {
      classification = totalScore >= 65 ? 'Damızlık Dişi Adayı' : 'Islah Dışı';
    }

    return {
      animalId: animal.id || '',
      tagNo: animal.farmTagNo || animal.nationalTagNo || 'Tanımsız',
      breed: animal.breed || 'Yerli Islah',
      gender: animal.gender,
      compositeIndexScore: totalScore,
      adjusted90DayWeightKg: adjWeight,
      damProlificacyScore: prolifScore,
      classification,
      blupEstimatedBreedingValue: Number(((totalScore - 60) * 0.25).toFixed(2)),
    };
  }

  /**
   * Çiftlik verilerini TAGEM ve Tarım Bakanlığı Projelerine Uygun Dışa Aktarım Formatına Dönüştürür
   */
  prepareExportDataset(
    farm: Farm | null,
    animals: Animal[],
    weights: WeightRecord[],
    yields: YieldRecord[] = []
  ): TagemExportRow[] {
    const isletmeKodu = (farm as any)?.registrationNumber || (farm as any)?.code || 'TR-ISLETME-DEMO';
    const ilIlce = farm?.address || `${(farm as any)?.city || 'Ankara'} / ${(farm as any)?.district || 'Merkez'}`;
    const projeAdi = 'Halk Elinde Küçükbaş Islahı Ülkesel Projesi (TAGEM)';

    const rows: TagemExportRow[] = [];

    for (const animal of animals) {
      const growth = this.evaluateAnimalGrowth(animal, weights, 'gun_90');
      const breeding = this.calculateBreedingIndex(animal, growth);

      // Hayvanın toplam veya son süt verimi
      const animalYields = yields.filter((y) => y.animalId === animal.id && y.type === 'sut');
      const totalMilk = animalYields.reduce((sum, y) => sum + (y.amount || 0), 0);

      rows.push({
        isletmeKodu,
        ilIlce,
        projeAdi,
        koyunKeciTuru: animal.species || 'Koyun',
        irk: animal.breed || 'Merinos Melezi',
        hayvanUlusalKupeNo: animal.nationalTagNo || '',
        hayvanCiftlikKupeNo: animal.farmTagNo || '',
        cinsiyet: animal.gender === 'erkek' ? 'Erkek' : 'Dişi',
        dogumTarihi: animal.birthDate || '',
        dogumTipi: 'Tekiz',
        anaUlusalKupeNo: animal.motherId || 'Bilinmiyor',
        babaUlusalKupeNo: animal.fatherId || 'Bilinmiyor',
        dogumAgirligiKg: growth ? growth.birthWeightKg : 4.0,
        gun90TartimTarihi: growth ? growth.actualWeighingDate : '',
        gun90TartimAgirligiKg: growth ? growth.actualWeightKg : '',
        gun90DuzeltilmisAgirlikKg: growth ? growth.adjustedWeightKg : '',
        gunlukCanliAgirlikArtisiGram: growth ? growth.adjustedAdgGrams : '',
        damizlikPuan: breeding.compositeIndexScore,
        damizlikSinifi: breeding.classification,
        laktasyonSutVerimiLitre: totalMilk > 0 ? Number(totalMilk.toFixed(1)) : '-',
        kayitTarihi: new Date().toISOString().split('T')[0],
      });
    }

    return rows;
  }

  /**
   * TAGEM Uyumlu UTF-8 BOM CSV / Excel Çıktısı Üretir
   */
  generateTagemCsv(rows: TagemExportRow[]): string {
    const headers = [
      'İşletme Kodu',
      'İl / İlçe',
      'Islah Projesi Adı',
      'Tür',
      'Irk',
      'Ulusal Küpe No',
      'Çiftlik Küpe No',
      'Cinsiyet',
      'Doğum Tarihi',
      'Doğum Tipi',
      'Ana Küpe No',
      'Baba Küpe No',
      'Doğum Ağırlığı (kg)',
      '90. Gün Tartım Tarihi',
      '90. Gün Tartım Ağırlığı (kg)',
      '90. Gün Düzeltilmiş Ağırlık (kg)',
      'GCAA (gr/gün)',
      'TAGEM Damızlık Puanı',
      'Damızlık Sınıfı',
      'Laktasyon Süt Verimi (Lt)',
      'Kayıt Tarihi',
    ];

    const csvLines = [headers.join(';')];

    for (const row of rows) {
      const line = [
        `"${row.isletmeKodu}"`,
        `"${row.ilIlce}"`,
        `"${row.projeAdi}"`,
        `"${row.koyunKeciTuru}"`,
        `"${row.irk}"`,
        `"${row.hayvanUlusalKupeNo}"`,
        `"${row.hayvanCiftlikKupeNo}"`,
        `"${row.cinsiyet}"`,
        `"${row.dogumTarihi}"`,
        `"${row.dogumTipi}"`,
        `"${row.anaUlusalKupeNo}"`,
        `"${row.babaUlusalKupeNo}"`,
        row.dogumAgirligiKg,
        `"${row.gun90TartimTarihi}"`,
        row.gun90TartimAgirligiKg,
        row.gun90DuzeltilmisAgirlikKg,
        row.gunlukCanliAgirlikArtisiGram,
        row.damizlikPuan,
        `"${row.damizlikSinifi}"`,
        row.laktasyonSutVerimiLitre,
        `"${row.kayitTarihi}"`,
      ];
      csvLines.push(line.join(';'));
    }

    // Excel Türkçe karakter uyumu için UTF-8 BOM
    return '\uFEFF' + csvLines.join('\r\n');
  }

  /**
   * TAGEM Uyumlu Resmi XML Veri Şeması Üretir
   */
  generateTagemXml(rows: TagemExportRow[]): string {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<TagemIslahVeriSeti xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" versiyon="1.0">\n`;
    xml += `  <OlusturulmaZamani>${new Date().toISOString()}</OlusturulmaZamani>\n`;
    xml += `  <KayitSayisi>${rows.length}</KayitSayisi>\n`;
    xml += `  <Hayvanlar>\n`;

    for (const r of rows) {
      xml += `    <Hayvan>\n`;
      xml += `      <IsletmeKodu>${this.escapeXml(r.isletmeKodu)}</IsletmeKodu>\n`;
      xml += `      <UlusalKupeNo>${this.escapeXml(r.hayvanUlusalKupeNo)}</UlusalKupeNo>\n`;
      xml += `      <CiftlikKupeNo>${this.escapeXml(r.hayvanCiftlikKupeNo)}</CiftlikKupeNo>\n`;
      xml += `      <Tur>${this.escapeXml(r.koyunKeciTuru)}</Tur>\n`;
      xml += `      <Irk>${this.escapeXml(r.irk)}</Irk>\n`;
      xml += `      <Cinsiyet>${this.escapeXml(r.cinsiyet)}</Cinsiyet>\n`;
      xml += `      <DogumTarihi>${this.escapeXml(r.dogumTarihi)}</DogumTarihi>\n`;
      xml += `      <AnaKupeNo>${this.escapeXml(r.anaUlusalKupeNo)}</AnaKupeNo>\n`;
      xml += `      <BabaKupeNo>${this.escapeXml(r.babaUlusalKupeNo)}</BabaKupeNo>\n`;
      xml += `      <DogumAgirligiKg>${r.dogumAgirligiKg}</DogumAgirligiKg>\n`;
      xml += `      <Gun90DuzeltilmisAgirlikKg>${r.gun90DuzeltilmisAgirlikKg}</Gun90DuzeltilmisAgirlikKg>\n`;
      xml += `      <GcaaGram>${r.gunlukCanliAgirlikArtisiGram}</GcaaGram>\n`;
      xml += `      <DamizlikPuani>${r.damizlikPuan}</DamizlikPuani>\n`;
      xml += `      <DamizlikSinifi>${this.escapeXml(r.damizlikSinifi)}</DamizlikSinifi>\n`;
      xml += `    </Hayvan>\n`;
    }

    xml += `  </Hayvanlar>\n`;
    xml += `</TagemIslahVeriSeti>`;

    return xml;
  }

  private escapeXml(str: string): string {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
