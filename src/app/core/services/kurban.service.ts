import { Injectable, inject } from '@angular/core';
import { doc, getDoc } from 'firebase/firestore';
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
   * Fetches a kurban document by ID (supports direct Firestore getDoc for public checkout)
   */
  async getById(id: string, farmId?: string): Promise<KurbanAnimal | null> {
    try {
      const targetFarmId = farmId || this.farmContext.activeFarmId() || localStorage.getItem('activeFarmId') || '';
      if (targetFarmId) {
        const dRef = doc(this.db, `farms/${targetFarmId}/kurbanAnimals/${id}`);
        const snap = await getDoc(dRef);
        if (snap.exists()) {
          return { id: snap.id, ...snap.data() } as KurbanAnimal;
        }
      }
      return null;
    } catch (e) {
      console.error('getById error in KurbanService:', e);
      return null;
    }
  }

  /**
   * Generates online payment URL for a shareholder
   */
  getPaymentLink(kurbanId: string, hisseId: string): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://odivonfarm.web.app';
    return `${origin}/kurban-odeme?kurbanId=${kurbanId}&hisseId=${hisseId}`;
  }

  /**
   * Generates WhatsApp appointment message text for a shareholder
   */
  generateAppointmentMessage(kurban: KurbanAnimal, hisse: KurbanHisse, farmName: string = 'Odivon FARM'): string {
    const meatPerShare = (kurban.estimatedMeatKg / (kurban.shareCount || 1)).toFixed(1);
    const paymentUrl = hisse.paymentLink || (kurban.id ? this.getPaymentLink(kurban.id, hisse.id) : '');

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
      ...(paymentUrl && !hisse.isPaid ? [
        `💳 *Online Güvenli Ödeme Linki:*`,
        `${paymentUrl}`,
        ``,
      ] : []),
      `📍 *Kesim Yeri:* ${farmName} Modern Kesim ve Parçalama Alanı`,
      `────────────────────────────`,
      `_Kurbanınızın kabul olmasını diler, hayırlı ve bereketli bayramlar dileriz._`,
    ];

    return lines.join('\n');
  }

  /**
   * Generates short SMS notification text with online payment link
   */
  generateSmsMessage(kurban: KurbanAnimal, hisse: KurbanHisse, farmName: string = 'Odivon FARM'): string {
    const paymentUrl = hisse.paymentLink || (kurban.id ? this.getPaymentLink(kurban.id, hisse.id) : '');
    if (hisse.isPaid || hisse.remainingPayment <= 0) {
      return `Sn. ${hisse.hissedarName}, ${farmName} kurbanlik (${kurban.tagNo}) hisse bedeliniz odenmistir. Kesim siraniz: ${kurban.slaughterOrder}, Saat: ${kurban.slaughterTime}. Hayirli bayramlar.`;
    }
    return `Sn. ${hisse.hissedarName}, ${farmName} ${kurban.tagNo} kurbanlik hissenizin kalan ${hisse.remainingPayment.toLocaleString('tr-TR')} TL bakiyesini online guvenle odemek icin: ${paymentUrl} Hayirli bayramlar.`;
  }

  /**
   * Opens default SMS app with prefilled text
   */
  openSms(kurban: KurbanAnimal, hisse: KurbanHisse, farmName?: string): void {
    const text = this.generateSmsMessage(kurban, hisse, farmName);
    const cleanPhone = (hisse.phone || '').replace(/[^0-9]/g, '');
    const uri = `sms:${cleanPhone}?body=${encodeURIComponent(text)}`;
    if (typeof window !== 'undefined') {
      window.location.href = uri;
    }
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
   * Mark a share as paid (used by online checkout or manual action)
   */
  async markShareAsPaid(kurbanId: string, hisseId: string, amountPaid?: number): Promise<void> {
    const kurban = await this.getById(kurbanId);
    if (!kurban) throw new Error('Kurban kaydı bulunamadı.');

    const updatedShares = (kurban.shares || []).map((s) => {
      if (s.id === hisseId) {
        const paid = amountPaid != null ? amountPaid : s.remainingPayment;
        const newRemaining = Math.max(0, s.remainingPayment - paid);
        return {
          ...s,
          remainingPayment: newRemaining,
          isPaid: newRemaining === 0,
          paymentStatus: newRemaining === 0 ? 'odendi' : 'kismi_odendi',
          paidAt: new Date(),
        } as KurbanHisse;
      }
      return s;
    });

    await this.update(kurbanId, {
      shares: updatedShares,
    });
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
