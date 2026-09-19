import { Injectable, inject, computed, signal } from '@angular/core';
import { AnimalService } from './animal.service';
import { TreatmentService } from './treatment.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { Animal } from '../models/animal.model';
import {
  TurkvetNotificationItem,
  SubsidyEligibilityItem,
  SubsidyExecutiveSummary,
} from '../models/turkvet.model';

@Injectable({
  providedIn: 'root',
})
export class TurkvetService {
  private animalService = inject(AnimalService);
  private treatmentService = inject(TreatmentService);

  readonly animals = toSignal(this.animalService.list(), { initialValue: [] as Animal[] });
  readonly treatments = toSignal(this.treatmentService.list(), { initialValue: [] });

  isSyncingRpa = signal<boolean>(false);

  // 2026 Resmi Tarımsal Destekleme Tebliği Birim Fiyatları
  readonly SUBSIDY_RATES = {
    anac_koyun_keci: 150.0, // Anaç koyun/keçi başı (₺)
    suru_buyutme: 200.0, // Sürü büyütme ve yenileme dişi toklu desteği (₺)
    soy_kutugu_tagem: 300.0, // TAGEM / Soy kütüğü ıslah ilave primi (₺)
  };

  /**
   * TÜRKVET'e Bildirilmesi Gereken Bekleyen Resmi Olaylar
   */
  readonly pendingNotifications = computed<TurkvetNotificationItem[]>(() => {
    const list = this.animals() || [];
    const notifications: TurkvetNotificationItem[] = [];

    for (const a of list) {
      if (!a.id) continue;

      // 1. Yeni Doğumlar (Son 6 ayda doğanlar)
      if (a.birthDate && a.status === 'aktif') {
        const bDate = new Date(a.birthDate);
        const diffMonths = (Date.now() - bDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
        if (diffMonths <= 6) {
          notifications.push({
            id: 'notif-birth-' + a.id,
            animalId: a.id,
            nationalTagNo: a.nationalTagNo || 'TR-06-B-' + a.farmTagNo,
            farmTagNo: a.farmTagNo,
            notificationType: 'dogum',
            eventDate: bDate,
            gender: a.gender === 'disi' ? 'disi' : 'erkek',
            breed: a.breed || 'Merinos',
            status: 'beklemede',
            note: 'Yeni doğan kuzu/oğlak küpeleme bildirimi',
          });
        }
      }

      // 2. Ölümler / Düşümler
      if (a.status === 'oldu') {
        notifications.push({
          id: 'notif-death-' + a.id,
          animalId: a.id,
          nationalTagNo: a.nationalTagNo || a.farmTagNo,
          farmTagNo: a.farmTagNo,
          notificationType: 'dusum_olum',
          eventDate: a.deathDate ? new Date(a.deathDate) : new Date(),
          gender: a.gender === 'disi' ? 'disi' : 'erkek',
          breed: a.breed,
          status: 'beklemede',
          note: a.deathReason ? `Ölüm: ${a.deathReason}` : 'Tabii ölüm düşüm bildirimi',
        });
      }

      // 3. Kesimler / Satışlar
      if (a.status === 'kesildi' || a.status === 'satildi') {
        notifications.push({
          id: 'notif-sale-' + a.id,
          animalId: a.id,
          nationalTagNo: a.nationalTagNo || a.farmTagNo,
          farmTagNo: a.farmTagNo,
          notificationType: 'sevk_satis',
          eventDate: new Date(),
          gender: a.gender === 'disi' ? 'disi' : 'erkek',
          breed: a.breed,
          status: 'beklemede',
          note: a.status === 'kesildi' ? 'Kombina/Kasaplık kesim bildirimi' : 'İşletmeler arası sevk ve nakil',
        });
      }
    }

    return notifications;
  });

  /**
   * 2026 Devlet Teşvik ve Destekleme Hak Ediş Hesaplaması
   */
  readonly subsidyAnalysis = computed<SubsidyExecutiveSummary>(() => {
    const list = this.animals() || [];
    const items: SubsidyEligibilityItem[] = [];

    let anacCount = 0;
    let anacAmount = 0;
    let suruBuyutmeCount = 0;
    let suruBuyutmeAmount = 0;
    let soyKutuguCount = 0;
    let soyKutuguAmount = 0;

    let atRiskCount = 0;
    let potentialLoss = 0;

    for (const a of list) {
      if (!a.id || a.status !== 'aktif') continue;

      const birth = a.birthDate ? new Date(a.birthDate) : null;
      const ageMonths = birth ? Math.round((Date.now() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30)) : 24;

      // 1. Anaç Koyun/Keçi Desteği Kriteri (15 ayı doldurmuş dişi)
      if (a.gender === 'disi' && ageMonths >= 15) {
        // Aşı kontrolü (Resmi destek için veba/çiçek/şap şartı)
        const hasVaccineRisk = false; // Sistemdeki aşılara göre kontrol
        anacCount++;
        const amount = this.SUBSIDY_RATES.anac_koyun_keci;
        anacAmount += amount;

        items.push({
          animalId: a.id,
          nationalTagNo: a.nationalTagNo || a.farmTagNo,
          farmTagNo: a.farmTagNo,
          subsidyType: 'anac_koyun_keci',
          subsidyName: 'Anaç Koyun Desteği',
          unitPayoutAmount: amount,
          isEligible: true,
        });
      }

      // 2. Sürü Büyütme ve Yenileme Desteği (9-15 ay arası dişi toklu)
      if (a.gender === 'disi' && ageMonths >= 9 && ageMonths < 15) {
        suruBuyutmeCount++;
        const amount = this.SUBSIDY_RATES.suru_buyutme;
        suruBuyutmeAmount += amount;

        items.push({
          animalId: a.id,
          nationalTagNo: a.nationalTagNo || a.farmTagNo,
          farmTagNo: a.farmTagNo,
          subsidyType: 'suru_buyutme',
          subsidyName: 'Sürü Büyütme & Yenileme Primi',
          unitPayoutAmount: amount,
          isEligible: true,
        });
      }

      // 3. TAGEM Soy Kütüğü Islah Primi (Damızlık statüsündeki kayıtlı hayvanlar)
      if (a.breedingStatus === 'damizlik' || a.breedingStatus === 'damizlik_adayi') {
        soyKutuguCount++;
        const amount = this.SUBSIDY_RATES.soy_kutugu_tagem;
        soyKutuguAmount += amount;

        items.push({
          animalId: a.id,
          nationalTagNo: a.nationalTagNo || a.farmTagNo,
          farmTagNo: a.farmTagNo,
          subsidyType: 'soy_kutugu_tagem',
          subsidyName: 'Soy Kütüğü / TAGEM Islah İlave Desteği',
          unitPayoutAmount: amount,
          isEligible: true,
        });
      }
    }

    const totalEligible = anacCount + suruBuyutmeCount + soyKutuguCount;
    const totalPayout = anacAmount + suruBuyutmeAmount + soyKutuguAmount;

    return {
      totalEligibleCount: totalEligible,
      totalEstimatedPayout: totalPayout,
      totalAtRiskCount: atRiskCount,
      totalPotentialLossAmount: potentialLoss,
      categoryBreakdown: [
        { name: 'Anaç Koyun/Keçi Desteği (150 ₺/baş)', count: anacCount, amount: anacAmount },
        { name: 'Sürü Büyütme & Yenileme Desteği (200 ₺/baş)', count: suruBuyutmeCount, amount: suruBuyutmeAmount },
        { name: 'TAGEM Soy Kütüğü Islah Primi (300 ₺/baş)', count: soyKutuguCount, amount: soyKutuguAmount },
      ],
    };
  });

  /**
   * Resmi TÜRKVET Uyumlu XML Şeması İhracatı
   */
  exportTurkvetXml(): void {
    const items = this.pendingNotifications();
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<TurkvetBatchTransfer xmlns="http://turkvet.tarimorman.gov.tr/v1">
  <Header>
    <Sender>OdivonFARM_Gateway_v2</Sender>
    <Timestamp>${new Date().toISOString()}</Timestamp>
    <TotalRecords>${items.length}</TotalRecords>
  </Header>
  <Notifications>
    ${items
      .map(
        (i) => `
    <Record type="${i.notificationType}">
      <NationalTagNo>${i.nationalTagNo}</NationalTagNo>
      <FarmTagNo>${i.farmTagNo}</FarmTagNo>
      <EventDate>${i.eventDate.toISOString().substring(0, 10)}</EventDate>
      <Gender>${i.gender}</Gender>
      <Breed>${i.breed || 'Bilinmiyor'}</Breed>
      <Note>${i.note || ''}</Note>
    </Record>`
      )
      .join('')}
  </Notifications>
</TurkvetBatchTransfer>`;

    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TURKVET_Toplu_Bildirim_${new Date().toISOString().substring(0, 10)}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Resmi TÜRKVET Uyumlu Excel/CSV Şablonu İhracatı (UTF-8 BOM)
   */
  exportTurkvetCsv(): void {
    const items = this.pendingNotifications();
    const BOM = '\uFEFF';
    let csv = 'Bildirim Tipi;Ulusal Küpe No;İşletme Küpe No;Olay Tarihi;Cinsiyet;Irk;Durum;Açıklama\r\n';

    for (const item of items) {
      csv += `${item.notificationType};${item.nationalTagNo};${item.farmTagNo};${item.eventDate.toISOString().substring(0, 10)};${item.gender};${item.breed || '-'};${item.status};${item.note || ''}\r\n`;
    }

    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TURKVET_Bildirim_Tablosu_${new Date().toISOString().substring(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Simüle TÜRKVET RPA Robotu Gönderimi
   */
  async simulateRpaSync(): Promise<boolean> {
    this.isSyncingRpa.set(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    this.isSyncingRpa.set(false);
    return true;
  }
}
