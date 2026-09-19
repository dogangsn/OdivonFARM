import { Injectable } from '@angular/core';

export interface FeedNutrientProfile {
  name: string;
  category: 'kaba' | 'kesif' | 'mineral_katki';
  dryMatterPercent: number; // KM % (Kuru Madde)
  crudeProteinPercent: number; // HP % (Ham Protein)
  netEnergyLactationMcal: number; // NEL (Mcal/kg KM)
  metabolizableEnergyMcal: number; // ME (Mcal/kg KM)
  crudeFiberPercent: number; // HS % (Ham Selüloz)
  calciumPercent: number; // Ca %
  phosphorusPercent: number; // P %
  defaultPricePerKg: number; // ₺ / kg
}

export interface TargetNutrientRequirement {
  groupName: string;
  minProteinPercent: number;
  maxProteinPercent: number;
  targetNELMcal: number; // Mcal/kg KM
  minFiberPercent: number; // Asidoz önleme için min selüloz
  targetRoughagePercent: number; // Hedef Kaba Yem Oranı (%)
  targetConcentratePercent: number; // Hedef Kesif Yem Oranı (%)
  recommendedDailyKg: number; // Günlük Hayvan Başı Tüketim (kg)
  description: string;
}

export interface CalculatedRationMetrics {
  totalAsFedKg: number; // Tüketilen Toplam Yaş Yem (kg)
  totalDryMatterKg: number; // Toplam Kuru Madde (kg)
  averageDryMatterPercent: number; // KM %
  crudeProteinPercent: number; // Rasyonun Ham Protein %'si
  averageNELMcal: number; // Ortalama NEL (Mcal/kg KM)
  averageMEMcal: number; // Ortalama ME (Mcal/kg KM)
  crudeFiberPercent: number; // Ham Selüloz %
  roughageRatioPercent: number; // Kaba Yem Oranı %
  concentrateRatioPercent: number; // Kesif Yem Oranı %
  costPerKg: number; // 1 kg rasyon maliyeti (₺)
  costPerAnimalDay: number; // 1 hayvanın günlük yem faturası (₺)
  // Değerlendirme Uyarıları
  proteinStatus: 'dusuk' | 'ideal' | 'yuksek';
  energyStatus: 'dusuk' | 'ideal' | 'yuksek';
  fiberStatus: 'asidoz_riski' | 'ideal' | 'yuksek_doluluk';
  warnings: string[];
}

@Injectable({
  providedIn: 'root',
})
export class RationCalculatorService {
  /**
   * Türkiye ve Dünya NRC standartlarına uygun popüler yem hammaddeleri referans kütüphanesi
   */
  readonly feedDatabase: Record<string, FeedNutrientProfile> = {
    // Kaba Yemler
    yonca: {
      name: 'Yonca Kuru Otu',
      category: 'kaba',
      dryMatterPercent: 88,
      crudeProteinPercent: 17.5,
      netEnergyLactationMcal: 1.35,
      metabolizableEnergyMcal: 2.15,
      crudeFiberPercent: 28,
      calciumPercent: 1.4,
      phosphorusPercent: 0.25,
      defaultPricePerKg: 7.5,
    },
    misir_silaji: {
      name: 'Mısır Silajı (%30 KM)',
      category: 'kaba',
      dryMatterPercent: 32,
      crudeProteinPercent: 8.0,
      netEnergyLactationMcal: 1.55,
      metabolizableEnergyMcal: 2.38,
      crudeFiberPercent: 21,
      calciumPercent: 0.28,
      phosphorusPercent: 0.22,
      defaultPricePerKg: 3.2,
    },
    bugday_samani: {
      name: 'Buğday Samanı',
      category: 'kaba',
      dryMatterPercent: 90,
      crudeProteinPercent: 3.8,
      netEnergyLactationMcal: 0.85,
      metabolizableEnergyMcal: 1.45,
      crudeFiberPercent: 41,
      calciumPercent: 0.18,
      phosphorusPercent: 0.08,
      defaultPricePerKg: 2.8,
    },
    cayir_otu: {
      name: 'Çayır Kuru Otu',
      category: 'kaba',
      dryMatterPercent: 88,
      crudeProteinPercent: 10.5,
      netEnergyLactationMcal: 1.15,
      metabolizableEnergyMcal: 1.9,
      crudeFiberPercent: 31,
      calciumPercent: 0.45,
      phosphorusPercent: 0.22,
      defaultPricePerKg: 4.8,
    },
    ryegrass: {
      name: 'İtalyan Çimi (Ryegrass)',
      category: 'kaba',
      dryMatterPercent: 86,
      crudeProteinPercent: 14.0,
      netEnergyLactationMcal: 1.4,
      metabolizableEnergyMcal: 2.2,
      crudeFiberPercent: 24,
      calciumPercent: 0.65,
      phosphorusPercent: 0.32,
      defaultPricePerKg: 6.5,
    },

    // Kesif Yemler (Tahıllar & Sanayi Yan Ürünleri)
    arpa_ezme: {
      name: 'Arpa Ezme / Kırma',
      category: 'kesif',
      dryMatterPercent: 88,
      crudeProteinPercent: 11.8,
      netEnergyLactationMcal: 1.9,
      metabolizableEnergyMcal: 2.85,
      crudeFiberPercent: 5.5,
      calciumPercent: 0.06,
      phosphorusPercent: 0.38,
      defaultPricePerKg: 9.2,
    },
    misir_flake: {
      name: 'Mısır Flake / Dane Mısır',
      category: 'kesif',
      dryMatterPercent: 87,
      crudeProteinPercent: 8.8,
      netEnergyLactationMcal: 2.05,
      metabolizableEnergyMcal: 3.05,
      crudeFiberPercent: 2.8,
      calciumPercent: 0.03,
      phosphorusPercent: 0.28,
      defaultPricePerKg: 9.8,
    },
    bugday_kepegi: {
      name: 'Buğday Kepeği',
      category: 'kesif',
      dryMatterPercent: 89,
      crudeProteinPercent: 15.5,
      netEnergyLactationMcal: 1.5,
      metabolizableEnergyMcal: 2.35,
      crudeFiberPercent: 10.5,
      calciumPercent: 0.14,
      phosphorusPercent: 1.15,
      defaultPricePerKg: 7.2,
    },
    soya_kuspasi: {
      name: 'Soya Küspesi (%46 HP)',
      category: 'kesif',
      dryMatterPercent: 89,
      crudeProteinPercent: 46.5,
      netEnergyLactationMcal: 2.0,
      metabolizableEnergyMcal: 2.95,
      crudeFiberPercent: 6.0,
      calciumPercent: 0.35,
      phosphorusPercent: 0.65,
      defaultPricePerKg: 18.5,
    },
    aycicegi_kuspasi: {
      name: 'Ayçiçeği Tohumu Küspesi (%32 HP)',
      category: 'kesif',
      dryMatterPercent: 90,
      crudeProteinPercent: 32.0,
      netEnergyLactationMcal: 1.3,
      metabolizableEnergyMcal: 2.1,
      crudeFiberPercent: 19.5,
      calciumPercent: 0.42,
      phosphorusPercent: 0.95,
      defaultPricePerKg: 11.5,
    },
    sut_yemi_18: {
      name: 'Fabrika Süt Yemi (%18 HP)',
      category: 'kesif',
      dryMatterPercent: 88,
      crudeProteinPercent: 18.0,
      netEnergyLactationMcal: 1.7,
      metabolizableEnergyMcal: 2.65,
      crudeFiberPercent: 8.5,
      calciumPercent: 0.9,
      phosphorusPercent: 0.55,
      defaultPricePerKg: 13.5,
    },
    sut_yemi_21: {
      name: 'Fabrika Süt Yemi (%21 HP)',
      category: 'kesif',
      dryMatterPercent: 88,
      crudeProteinPercent: 21.0,
      netEnergyLactationMcal: 1.75,
      metabolizableEnergyMcal: 2.72,
      crudeFiberPercent: 7.8,
      calciumPercent: 1.1,
      phosphorusPercent: 0.6,
      defaultPricePerKg: 14.8,
    },
    besi_yemi: {
      name: 'Fabrika Besi Geliştirme Yemi (%14 HP)',
      category: 'kesif',
      dryMatterPercent: 88,
      crudeProteinPercent: 14.0,
      netEnergyLactationMcal: 1.68,
      metabolizableEnergyMcal: 2.65,
      crudeFiberPercent: 9.0,
      calciumPercent: 0.8,
      phosphorusPercent: 0.45,
      defaultPricePerKg: 12.8,
    },
    kuzu_baslangic: {
      name: 'Kuzu Başlangıç Yemi (%18 HP)',
      category: 'kesif',
      dryMatterPercent: 88,
      crudeProteinPercent: 18.0,
      netEnergyLactationMcal: 1.75,
      metabolizableEnergyMcal: 2.75,
      crudeFiberPercent: 7.0,
      calciumPercent: 1.2,
      phosphorusPercent: 0.6,
      defaultPricePerKg: 15.2,
    },

    // Mineral & Premiks
    mermer_tozu: {
      name: 'Mermer Tozu (Kalsiyum Karbonat)',
      category: 'mineral_katki',
      dryMatterPercent: 99,
      crudeProteinPercent: 0,
      netEnergyLactationMcal: 0,
      metabolizableEnergyMcal: 0,
      crudeFiberPercent: 0,
      calciumPercent: 38.0,
      phosphorusPercent: 0.02,
      defaultPricePerKg: 2.5,
    },
    tuz: {
      name: 'Yem Tuzu',
      category: 'mineral_katki',
      dryMatterPercent: 99,
      crudeProteinPercent: 0,
      netEnergyLactationMcal: 0,
      metabolizableEnergyMcal: 0,
      crudeFiberPercent: 0,
      calciumPercent: 0,
      phosphorusPercent: 0,
      defaultPricePerKg: 3.5,
    },
    sodyum_bikarbonat: {
      name: 'Yem Sodası (Bikarbonat)',
      category: 'mineral_katki',
      dryMatterPercent: 99,
      crudeProteinPercent: 0,
      netEnergyLactationMcal: 0,
      metabolizableEnergyMcal: 0,
      crudeFiberPercent: 0,
      calciumPercent: 0,
      phosphorusPercent: 0,
      defaultPricePerKg: 12.0,
    },
  };

  /**
   * Hedef Gruplar ve İdeal Besin İhtiyaçları Standartları (NRC/INRA)
   */
  readonly targetRequirements: Record<string, TargetNutrientRequirement> = {
    'Yüksek Verimli Süt İneği (25-35 Lt)': {
      groupName: 'Yüksek Verimli Süt İneği (25-35 Lt)',
      minProteinPercent: 16.5,
      maxProteinPercent: 18.5,
      targetNELMcal: 1.68,
      minFiberPercent: 17.0,
      targetRoughagePercent: 45,
      targetConcentratePercent: 55,
      recommendedDailyKg: 24.0,
      description: 'Zirve laktasyondaki yüksek süt verimli inekler için yüksek enerji ve dengeli protein rasyonu.',
    },
    'Orta Verimli Süt İneği (15-25 Lt)': {
      groupName: 'Orta Verimli Süt İneği (15-25 Lt)',
      minProteinPercent: 14.5,
      maxProteinPercent: 16.0,
      targetNELMcal: 1.55,
      minFiberPercent: 19.0,
      targetRoughagePercent: 55,
      targetConcentratePercent: 45,
      recommendedDailyKg: 20.0,
      description: 'Standart süt verimli inekler için asidoz riski düşük, ekonomik kaba yem ağırlıklı rasyon.',
    },
    'Besi Başlangıç / Geliştirme (250-400 kg)': {
      groupName: 'Besi Başlangıç / Geliştirme (250-400 kg)',
      minProteinPercent: 14.0,
      maxProteinPercent: 16.0,
      targetNELMcal: 1.62,
      minFiberPercent: 15.0,
      targetRoughagePercent: 40,
      targetConcentratePercent: 60,
      recommendedDailyKg: 10.0,
      description: 'İskelet ve kas gelişimini hızlandıran yüksek proteinli besi dönemi rasyonu.',
    },
    'Besi Bitiş / Randıman (400-600 kg)': {
      groupName: 'Besi Bitiş / Randıman (400-600 kg)',
      minProteinPercent: 12.0,
      maxProteinPercent: 13.5,
      targetNELMcal: 1.75,
      minFiberPercent: 13.0,
      targetRoughagePercent: 25,
      targetConcentratePercent: 75,
      recommendedDailyKg: 12.5,
      description: 'Maksimum günlük canlı ağırlık artışı (GCAA 1.4-1.8 kg) ve karkas yağlanması hedefleyen yüksek enerjili rasyon.',
    },
    'Gebe Koyunlar (Son 6 Hafta)': {
      groupName: 'Gebe Koyunlar (Son 6 Hafta)',
      minProteinPercent: 14.5,
      maxProteinPercent: 16.5,
      targetNELMcal: 1.55,
      minFiberPercent: 18.0,
      targetRoughagePercent: 60,
      targetConcentratePercent: 40,
      recommendedDailyKg: 2.2,
      description: 'İkiz/üçüz gebelik toksikozunu (ketozis) önlemek ve iri/sağlıklı kuzu doğumu için yoğunlaştırılmış rasyon.',
    },
    'Laktasyondaki Koyun & Keçi': {
      groupName: 'Laktasyondaki Koyun & Keçi',
      minProteinPercent: 15.0,
      maxProteinPercent: 17.0,
      targetNELMcal: 1.6,
      minFiberPercent: 17.0,
      targetRoughagePercent: 50,
      targetConcentratePercent: 50,
      recommendedDailyKg: 2.8,
      description: 'Yüksek süt salgısı ve yavru emzirme döneminde kondisyon kaybını önleyen rasyon.',
    },
    'Kuzu Besi (Hızlı Büyütme)': {
      groupName: 'Kuzu Besi (Hızlı Büyütme)',
      minProteinPercent: 16.0,
      maxProteinPercent: 18.0,
      targetNELMcal: 1.7,
      minFiberPercent: 12.0,
      targetRoughagePercent: 25,
      targetConcentratePercent: 75,
      recommendedDailyKg: 1.4,
      description: 'Sütten kesim sonrası 45-50 kg kesim ağırlığına en kısa sürede ulaştıran kuzu besi rasyonu.',
    },
  };

  /**
   * Verilen yem adı veya ID'si üzerinden en yakın besin profilini tahmin eder
   */
  resolveNutrientProfile(itemName: string): FeedNutrientProfile {
    const clean = (itemName || '').toLowerCase().trim();

    if (clean.includes('yonca')) return this.feedDatabase['yonca'];
    if (clean.includes('silaj') || clean.includes('mısır silajı')) return this.feedDatabase['misir_silaji'];
    if (clean.includes('saman')) return this.feedDatabase['bugday_samani'];
    if (clean.includes('çayır') || clean.includes('kuru ot')) return this.feedDatabase['cayir_otu'];
    if (clean.includes('rye') || clean.includes('çim')) return this.feedDatabase['ryegrass'];

    if (clean.includes('arpa')) return this.feedDatabase['arpa_ezme'];
    if (clean.includes('mısır') || clean.includes('flake')) return this.feedDatabase['misir_flake'];
    if (clean.includes('kepek')) return this.feedDatabase['bugday_kepegi'];
    if (clean.includes('soya')) return this.feedDatabase['soya_kuspasi'];
    if (clean.includes('ayçiçek') || clean.includes('atkü')) return this.feedDatabase['aycicegi_kuspasi'];
    if (clean.includes('21')) return this.feedDatabase['sut_yemi_21'];
    if (clean.includes('süt yemi') || clean.includes('sutyemi')) return this.feedDatabase['sut_yemi_18'];
    if (clean.includes('kuzu')) return this.feedDatabase['kuzu_baslangic'];
    if (clean.includes('besi')) return this.feedDatabase['besi_yemi'];

    if (clean.includes('mermer') || clean.includes('kalsiyum')) return this.feedDatabase['mermer_tozu'];
    if (clean.includes('tuz')) return this.feedDatabase['tuz'];
    if (clean.includes('soda') || clean.includes('bikarbonat')) return this.feedDatabase['sodyum_bikarbonat'];

    // Varsayılan standart fabrika karma yemi
    return {
      name: itemName || 'Karma Yem',
      category: 'kesif',
      dryMatterPercent: 88,
      crudeProteinPercent: 15.0,
      netEnergyLactationMcal: 1.6,
      metabolizableEnergyMcal: 2.5,
      crudeFiberPercent: 10.0,
      calciumPercent: 0.8,
      phosphorusPercent: 0.45,
      defaultPricePerKg: 11.0,
    };
  }

  /**
   * Rasyon reçetesindeki tüm kalemleri birleştirip Kuru Madde bazında bilimsel besin dengesi ve maliyet hesaplar
   */
  calculateRation(
    items: { itemName: string; amountKg: number; unitPrice?: number }[],
    targetGroupKey: string
  ): CalculatedRationMetrics {
    const target = this.targetRequirements[targetGroupKey] || this.targetRequirements['Yüksek Verimli Süt İneği (25-35 Lt)'];

    let totalAsFedKg = 0;
    let totalDryMatterKg = 0;
    let totalProteinKg = 0;
    let totalNELMcal = 0;
    let totalMEMcal = 0;
    let totalFiberKg = 0;
    let totalRoughageKg = 0;
    let totalConcentrateKg = 0;
    let totalCost = 0;

    for (const item of items) {
      const kg = Number(item.amountKg) || 0;
      if (kg <= 0) continue;

      const profile = this.resolveNutrientProfile(item.itemName);
      const pricePerKg = item.unitPrice != null && item.unitPrice > 0 ? item.unitPrice : profile.defaultPricePerKg;

      totalAsFedKg += kg;
      totalCost += kg * pricePerKg;

      // Kuru Madde (KM) dönüşümü
      const dmKg = kg * (profile.dryMatterPercent / 100);
      totalDryMatterKg += dmKg;

      totalProteinKg += dmKg * (profile.crudeProteinPercent / 100);
      totalNELMcal += dmKg * profile.netEnergyLactationMcal;
      totalMEMcal += dmKg * profile.metabolizableEnergyMcal;
      totalFiberKg += dmKg * (profile.crudeFiberPercent / 100);

      if (profile.category === 'kaba') {
        totalRoughageKg += kg;
      } else {
        totalConcentrateKg += kg;
      }
    }

    if (totalAsFedKg === 0 || totalDryMatterKg === 0) {
      return {
        totalAsFedKg: 0,
        totalDryMatterKg: 0,
        averageDryMatterPercent: 0,
        crudeProteinPercent: 0,
        averageNELMcal: 0,
        averageMEMcal: 0,
        crudeFiberPercent: 0,
        roughageRatioPercent: 0,
        concentrateRatioPercent: 0,
        costPerKg: 0,
        costPerAnimalDay: 0,
        proteinStatus: 'dusuk',
        energyStatus: 'dusuk',
        fiberStatus: 'ideal',
        warnings: ['Rasyona henüz yem hammaddesi eklenmedi.'],
      };
    }

    const averageDryMatterPercent = Math.round((totalDryMatterKg / totalAsFedKg) * 100);
    const crudeProteinPercent = Number(((totalProteinKg / totalDryMatterKg) * 100).toFixed(1));
    const averageNELMcal = Number((totalNELMcal / totalDryMatterKg).toFixed(2));
    const averageMEMcal = Number((totalMEMcal / totalDryMatterKg).toFixed(2));
    const crudeFiberPercent = Number(((totalFiberKg / totalDryMatterKg) * 100).toFixed(1));

    const roughageRatioPercent = Math.round((totalRoughageKg / totalAsFedKg) * 100);
    const concentrateRatioPercent = 100 - roughageRatioPercent;

    const costPerKg = Number((totalCost / totalAsFedKg).toFixed(2));
    const costPerAnimalDay = Number(totalCost.toFixed(2));

    // Analiz & Uyarılar
    const warnings: string[] = [];

    // Protein analizi
    let proteinStatus: 'dusuk' | 'ideal' | 'yuksek' = 'ideal';
    if (crudeProteinPercent < target.minProteinPercent) {
      proteinStatus = 'dusuk';
      warnings.push(`Ham Protein (%${crudeProteinPercent}) hedef altındadır (Hedef: %${target.minProteinPercent}-%${target.maxProteinPercent}). Soya küspesi veya yonca miktarını artırın.`);
    } else if (crudeProteinPercent > target.maxProteinPercent + 1.5) {
      proteinStatus = 'yuksek';
      warnings.push(`Ham Protein (%${crudeProteinPercent}) gereğinden fazladır. Fazla protein idrarla atılır ve yem maliyetini artırır.`);
    }

    // Enerji analizi
    let energyStatus: 'dusuk' | 'ideal' | 'yuksek' = 'ideal';
    if (averageNELMcal < target.targetNELMcal - 0.1) {
      energyStatus = 'dusuk';
      warnings.push(`Rasyon enerjisi (${averageNELMcal} Mcal NEL) düşüktür. Mısır veya arpa ezmesi takviyesi verimi artıracaktır.`);
    } else if (averageNELMcal > target.targetNELMcal + 0.18) {
      energyStatus = 'yuksek';
      warnings.push(`Rasyon enerjisi çok yoğundur (${averageNELMcal} Mcal). Asidoz ve tırnak rahatsızlıklarına dikkat edilmelidir.`);
    }

    // Selüloz / Asidoz Riski
    let fiberStatus: 'asidoz_riski' | 'ideal' | 'yuksek_doluluk' = 'ideal';
    if (crudeFiberPercent < target.minFiberPercent) {
      fiberStatus = 'asidoz_riski';
      warnings.push(`⚠️ DİKKAT: Ham Selüloz (%${crudeFiberPercent}) kritik eşiğin (%${target.minFiberPercent}) altındadır! Ruminasyon yetersizliği ve subakut ruminal asidoz (SARA) riski çok yüksektir. Saman/kaba yem oranını acilen artırın.`);
    } else if (crudeFiberPercent > 28) {
      fiberStatus = 'yuksek_doluluk';
      warnings.push(`Selüloz oranı (%${crudeFiberPercent}) yüksektir. Hayvanın işkembesi çabuk doyar, gerekli besin maddelerini tüketemeyebilir.`);
    }

    return {
      totalAsFedKg: Number(totalAsFedKg.toFixed(2)),
      totalDryMatterKg: Number(totalDryMatterKg.toFixed(2)),
      averageDryMatterPercent,
      crudeProteinPercent,
      averageNELMcal,
      averageMEMcal,
      crudeFiberPercent,
      roughageRatioPercent,
      concentrateRatioPercent,
      costPerKg,
      costPerAnimalDay,
      proteinStatus,
      energyStatus,
      fiberStatus,
      warnings,
    };
  }
}
