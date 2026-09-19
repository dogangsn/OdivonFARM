import { Injectable, inject } from '@angular/core';
import { FirestoreCrudService } from './firestore-crud.service';
import { KurbanAnimal, KurbanHisse } from '../models/kurban.model';
import { AnimalService } from './animal.service';
import { AccountingTransactionService } from './accounting-transaction.service';

@Injectable({
  providedIn: 'root',
})
export class KurbanService extends FirestoreCrudService<KurbanAnimal> {
  private animalService = inject(AnimalService);
  private accountingService = inject(AccountingTransactionService);

  constructor() {
    super('kurbanAnimals');
  }

  /**
   * Generates WhatsApp appointment message text for a shareholder
   */
  generateAppointmentMessage(kurban: KurbanAnimal, hisse: KurbanHisse, farmName: string = 'Odivon FARM'): string {
    const meatPerShare = (kurban.estimatedMeatKg / (kurban.shareCount || 1)).toFixed(1);

    const lines: string[] = [
      `🕋 *${farmName.toUpperCase()} — KURBANLIK HİSSE VE KESİM RANDEVU KARTI* 🕋`,
      `────────────────────────────`,
      `Sayın *${hisse.hissedarName}*,`,
      `Kurbanlık hisseniz başarıyla kayıt altına alınmıştır. Kesim sıranız ve randevu detaylarınız aşağıdadır:`,
      ``,
      `📋 *Kurban Bilgileri:*`,
      `• Küpe No: *${kurban.tagNo}* ${kurban.animalName ? `(${kurban.animalName})` : ''}`,
      `• Kategori: ${kurban.category === 'buyukbas' ? 'Büyükbaş (7 Hisse)' : 'Küçükbaş (1 Hisse)'}`,
      `• Canlı Ağırlık: ${kurban.liveWeightKg} kg (Randıman: %${kurban.carcassYieldPercent})`,
      `• Tahmini Karkas Et: ~${kurban.estimatedMeatKg} kg`,
      `• *Hisse Başına Tahmini Et:* ~${meatPerShare} kg`,
      ``,
      `⏰ *Kesim ve Teslimat Randevusu:*`,
      `• Bayram Günü: *${kurban.slaughterDay}. GÜN*`,
      `• Kesim Sıra No: *SIRA NO: ${kurban.slaughterOrder}*`,
      `• Randevu Saati: *SAAT: ${kurban.slaughterTime}*`,
      `• Parçalama Tercihi: ${hisse.meatPreference || 'Standart 7 Eşit Pay'}`,
      ``,
      `💰 *Hisse Bedeli ve Ödeme:*`,
      `• Toplam Hisse Bedeli: ${hisse.sharePrice.toLocaleString('tr-TR')} ₺`,
      `• Alınan Kapora: ${hisse.depositPaid.toLocaleString('tr-TR')} ₺`,
      `• *Kalan Bakiye:* *${hisse.remainingPayment.toLocaleString('tr-TR')} ₺* (${hisse.isPaid ? 'ÖDENDİ' : 'Kesim Günü Ödenecek'})`,
      ``,
      `📍 *Kesim Yeri:* ${farmName} Modern Kesim ve Parçalama Alanı`,
      `────────────────────────────`,
      `_Kurbanınızın kabul olmasını diler, hayırlı ve bereketli bayramlar dileriz._`,
    ];

    return lines.join('\n');
  }

  /**
   * Opens WhatsApp with formatted appointment text
   */
  openWhatsAppAppointment(kurban: KurbanAnimal, hisse: KurbanHisse, farmName?: string): void {
    const text = this.generateAppointmentMessage(kurban, hisse, farmName);
    const cleanPhone = (hisse.phone || '').replace(/[^0-9]/g, '');
    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;

    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
  }

  /**
   * Completes slaughter: marks kurban and animal as slaughtered, records accounting entry
   */
  async completeSlaughterAndRecord(kurban: KurbanAnimal): Promise<void> {
    const todayStr = new Date().toISOString().substring(0, 10);

    // 1. Update Kurban Animal status
    if (kurban.id) {
      await this.update(kurban.id, {
        status: 'kesildi',
      });
    }

    // 2. Update actual Animal record in herd
    if (kurban.animalId) {
      await this.animalService.update(kurban.animalId, {
        status: 'kesildi',
        slaughterDate: todayStr,
        slaughterMeatKg: kurban.estimatedMeatKg,
        slaughterNotes: `Kurban Bayramı Kesimi. Sıra No: ${kurban.slaughterOrder}, ${kurban.shareCount} Hisse, Toplam Gelir: ${kurban.totalPrice} ₺`,
      });
    }

    // 3. Record income transaction in accounting
    try {
      await this.accountingService.create({
        accountingItemId: 'kurban-satis-geliri',
        amount: kurban.totalPrice,
        date: new Date(),
        description: `Kurbanlık Satış Geliri: ${kurban.tagNo} (${kurban.shareCount} Hisse)`,
      } as any);
    } catch (e) {
      console.warn('Accounting transaction skipped or error:', e);
    }
  }
}
