import { Injectable, inject, computed } from '@angular/core';
import { WeightRecordService } from './weight-record.service';
import { AnimalService } from './animal.service';
import { PaddockService } from './definitions/paddock.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { Animal } from '../models/animal.model';
import { WeightRecord } from '../models/production.model';

export type FinishingStatus = 'gelisme' | 'yaklasiyor' | 'optimum_kesim' | 'gecikmis_zarar';

export interface FinishingAnalysis {
  animalId: string;
  tagNo: string;
  name?: string;
  breed?: string;
  paddockName?: string;
  currentWeightKg: number;
  initialWeightKg: number;
  targetMatureWeightKg: number;
  totalDaysOnFeed: number;
  dailyGainGrams: number; // GCAA (gram/gün)
  dailyFeedCost: number; // Günlük rasyon/yem masrafı (₺)
  livePricePerKg: number; // Canlı baskül satış fiyatı (₺/kg)
  marginalDailyRevenue: number; // Günlük kilo artışının parasal getirisi (₺)
  marginalDailyProfit: number; // Günlük Net Marjinal Kâr (₺) = Gelir - Yem Maliyeti
  isOptimalSlaughterReady: boolean;
  recommendedSlaughterDays: number; // Kaç gün içinde kesilmeli (negatif ise gecikmiş)
  dailyLossIfDelayed: number; // Gecikilen her gün için çiftliğe yazılan zarar (₺)
  status: FinishingStatus;
  recommendationText: string;
}

export interface HerdFinishingSummary {
  totalAnalyzed: number;
  optimalReadyCount: number;
  overdueLossCount: number;
  dailyTotalLossOverdue: number; // Kesimi gecikmiş hayvanlardan her gün kaybedilen toplam para (₺)
  averageDailyGainGrams: number;
  readyAnimals: FinishingAnalysis[];
  overdueAnimals: FinishingAnalysis[];
}

@Injectable({
  providedIn: 'root',
})
export class FinishingAnalyticsService {
  private weightService = inject(WeightRecordService);
  private animalService = inject(AnimalService);
  private paddockService = inject(PaddockService);

  readonly animals = toSignal(this.animalService.list(), { initialValue: [] as Animal[] });
  readonly weightRecords = toSignal(this.weightService.list(), { initialValue: [] as WeightRecord[] });
  readonly paddocks = toSignal(this.paddockService.list(), { initialValue: [] });

  // Piyasa Referans Parametreleri (Dinamik ayarlanabilir)
  defaultLivePricePerKg = 260.0; // Canlı baskül toklu/kuzu kg fiyatı (₺)
  defaultDailyFeedCostSheep = 24.5; // Günlük rasyon maliyeti (₺)
  defaultTargetMatureWeightSheep = 52.0; // İdeal kesim ağırlığı (kg)

  /**
   * Çiftlikteki tüm besi hayvanları için marjinal verim ve optimum kesim analizi
   */
  readonly herdFinishingAnalysis = computed<HerdFinishingSummary>(() => {
    const animalsList = this.animals() || [];
    const weightsList = this.weightRecords() || [];
    const paddockMap = new Map<string, string>();

    for (const p of this.paddocks() || []) {
      if ((p as any).id) paddockMap.set((p as any).id, (p as any).name);
    }

    // Hayvanların ağırlık kayıtlarını grupla
    const weightMap = new Map<string, WeightRecord[]>();
    for (const w of weightsList) {
      if (!w?.animalId) continue;
      const arr = weightMap.get(w.animalId) || [];
      arr.push(w);
      weightMap.set(w.animalId, arr);
    }

    const analyses: FinishingAnalysis[] = [];

    // Besi veya genç hayvanları analiz et
    for (const animal of animalsList) {
      if (!animal.id || animal.status !== 'aktif') continue;

      const records = weightMap.get(animal.id) || [];
      if (records.length === 0) continue;

      // Tarihe göre sırala
      const sorted = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const first = sorted[0];
      const latest = sorted[sorted.length - 1];

      const currentKg = Number(latest.weightKg) || 0;
      const initialKg = Number(first.weightKg) || 0;

      const firstDate = new Date(first.date).getTime();
      const latestDate = new Date(latest.date).getTime();
      const diffDays = Math.max(1, Math.round((latestDate - firstDate) / (1000 * 60 * 60 * 24)));

      // Günlük Canlı Ağırlık Artışı (GCAA)
      let adgGrams = 0;
      if (sorted.length > 1 && diffDays > 0) {
        adgGrams = Math.round(((currentKg - initialKg) / diffDays) * 1000);
      } else {
        // Tek tartım varsa tahmini 280g/gün
        adgGrams = 280;
      }

      // Kilo arttıkça canlı ağırlık artış hızı fizyolojik olarak yavaşlar (Brody Azalan Verimler Kanunu)
      // 50 kg üzerine çıkan toklularda GCAA hızla 100-140 grama düşer, yem yağa dönüşür.
      let adjustedAdgGrams = adgGrams;
      if (currentKg > 50) {
        adjustedAdgGrams = Math.min(adgGrams, Math.max(80, Math.round(adgGrams * 0.45)));
      } else if (currentKg > 45) {
        adjustedAdgGrams = Math.min(adgGrams, Math.max(160, Math.round(adgGrams * 0.75)));
      }

      const dailyGainKg = adjustedAdgGrams / 1000;
      const livePrice = this.defaultLivePricePerKg;
      const feedCost = this.defaultDailyFeedCostSheep;

      const marginalRevenue = Number((dailyGainKg * livePrice).toFixed(2));
      const marginalProfit = Number((marginalRevenue - feedCost).toFixed(2));

      // Optimum Kesim Eşiği Kararı:
      // Eğer Günlük Marjinal Gelir < Günlük Yem Maliyeti ise hayvan ZARAR bölgesindedir!
      let status: FinishingStatus = 'gelisme';
      let recommendedDays = 0;
      let dailyLoss = 0;
      let recommendation = '';

      if (currentKg >= 52 || marginalProfit < 0) {
        status = 'gecikmis_zarar';
        recommendedDays = -Math.round((currentKg - 50) * 3); // Gecikilen gün sayısı
        dailyLoss = Math.abs(marginalProfit);
        recommendation = `⚠️ ACİL KESİM: Kilo alımı yavaşladı (${adjustedAdgGrams}g/gün). Hayvan yediği yemin bedelini karşılamıyor! Her gün hayvan başı ${dailyLoss} ₺ zarar yazıyor. Hemen kesime sevk edin.`;
      } else if (currentKg >= 48 || (currentKg >= 45 && marginalProfit < 8)) {
        status = 'optimum_kesim';
        recommendedDays = 3;
        dailyLoss = 0;
        recommendation = `🎯 OPTİMUM KESİM: Hedef randımana ulaşıldı (${currentKg} kg). Önümüzdeki 3-5 gün içinde kesilmesi kârı maksimize eder.`;
      } else if (currentKg >= 42) {
        status = 'yaklasiyor';
        recommendedDays = Math.round((48 - currentKg) / Math.max(0.15, dailyGainKg));
        recommendation = `Besi bitişine yaklaşıyor. Tahmini ${recommendedDays} gün sonra kesim olgunluğuna ulaşacak.`;
      } else {
        status = 'gelisme';
        recommendedDays = Math.round((48 - currentKg) / Math.max(0.15, dailyGainKg));
        recommendation = `Gelişme evresinde. Yem değerlendirme oranı yüksek (%${Math.round((adjustedAdgGrams / 1400) * 100)}). Besiye devam edin.`;
      }

      analyses.push({
        animalId: animal.id!,
        tagNo: animal.nationalTagNo || animal.farmTagNo || 'Küpesiz',
        name: animal.name,
        breed: animal.breed,
        paddockName: animal.paddockId ? paddockMap.get(animal.paddockId) || 'Genel' : 'Genel',
        currentWeightKg: currentKg,
        initialWeightKg: initialKg,
        targetMatureWeightKg: this.defaultTargetMatureWeightSheep,
        totalDaysOnFeed: diffDays,
        dailyGainGrams: adjustedAdgGrams,
        dailyFeedCost: feedCost,
        livePricePerKg: livePrice,
        marginalDailyRevenue: marginalRevenue,
        marginalDailyProfit: marginalProfit,
        isOptimalSlaughterReady: status === 'optimum_kesim' || status === 'gecikmis_zarar',
        recommendedSlaughterDays: recommendedDays,
        dailyLossIfDelayed: dailyLoss,
        status,
        recommendationText: recommendation,
      });
    }

    const readyAnimals = analyses.filter((a) => a.status === 'optimum_kesim');
    const overdueAnimals = analyses.filter((a) => a.status === 'gecikmis_zarar');
    const totalDailyLoss = Number(overdueAnimals.reduce((sum, a) => sum + a.dailyLossIfDelayed, 0).toFixed(2));
    const avgAdg =
      analyses.length > 0
        ? Math.round(analyses.reduce((sum, a) => sum + a.dailyGainGrams, 0) / analyses.length)
        : 0;

    return {
      totalAnalyzed: analyses.length,
      optimalReadyCount: readyAnimals.length,
      overdueLossCount: overdueAnimals.length,
      dailyTotalLossOverdue: totalDailyLoss,
      averageDailyGainGrams: avgAdg,
      readyAnimals,
      overdueAnimals,
    };
  });
}
