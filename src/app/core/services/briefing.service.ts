import { Injectable, inject } from '@angular/core';
import { Animal, Mating, Treatment, FarmTask } from '../models';
import { StockItem } from '../models/inventory.model';
import { YieldRecord } from '../models/production.model';

export interface BriefingSectionOptions {
  includeBirths: boolean;
  includePregnancyChecks: boolean;
  includeTreatments: boolean;
  includeTasks: boolean;
  includeStock: boolean;
  includeYields: boolean;
  customNote?: string;
}

export interface UpcomingBirth {
  mating: Mating;
  motherTag: string;
  motherName?: string;
  paddockName?: string;
  expectedDateStr: string;
  daysRemaining: number;
}

export interface PregnancyCheck {
  mating: Mating;
  motherTag: string;
  motherName?: string;
  checkType: string;
  daysSinceMating: number;
}

export interface DailyBriefingSummary {
  farmName: string;
  dateFormatted: string;
  upcomingBirths: UpcomingBirth[];
  pregnancyChecks: PregnancyCheck[];
  todayTreatments: Treatment[];
  pendingTasks: FarmTask[];
  lowStockItems: StockItem[];
  recentMilkYield: number;
  messageText: string;
}

@Injectable({
  providedIn: 'root',
})
export class BriefingService {
  /**
   * Compiles dynamic farm data into structured daily morning briefing
   */
  generateSummary(
    farmName: string,
    animals: Animal[],
    matings: Mating[],
    treatments: Treatment[],
    tasks: FarmTask[],
    stockItems: StockItem[],
    yields: YieldRecord[],
    options: BriefingSectionOptions = {
      includeBirths: true,
      includePregnancyChecks: true,
      includeTreatments: true,
      includeTasks: true,
      includeStock: true,
      includeYields: true,
    }
  ): DailyBriefingSummary {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dateFormatted = today.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long',
    });

    // 1. Upcoming births (within next 7 days or overdue)
    const upcomingBirths: UpcomingBirth[] = [];
    if (options.includeBirths) {
      for (const m of matings) {
        if (m.status === 'gebe' || m.status === 'koculdu') {
          const expDate = this.parseDate(m.expectedBirthDate);
          if (expDate) {
            const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays >= -2 && diffDays <= 7) {
              const mother = animals.find((a) => a.id === m.femaleId || a.farmTagNo === m.femaleId);
              upcomingBirths.push({
                mating: m,
                motherTag: mother?.farmTagNo || mother?.nationalTagNo || m.femaleId || 'Bilinmiyor',
                motherName: mother?.name,
                expectedDateStr: expDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'numeric' }),
                daysRemaining: diffDays,
              });
            }
          }
        }
      }
      upcomingBirths.sort((a, b) => a.daysRemaining - b.daysRemaining);
    }

    // 2. Pregnancy & Heat Checks (21 days for heat return, 45-60 days for ultrasound)
    const pregnancyChecks: PregnancyCheck[] = [];
    if (options.includePregnancyChecks) {
      for (const m of matings) {
        if (m.status === 'koculdu' || m.status === 'gozlem') {
          const matingDate = this.parseDate(m.matingDate);
          if (matingDate) {
            const daysSince = Math.floor((today.getTime() - matingDate.getTime()) / (1000 * 60 * 60 * 24));
            let checkType = '';
            if (daysSince >= 18 && daysSince <= 24) {
              checkType = '21. Gün Kızgınlık Dönüş Kontrolü';
            } else if (daysSince >= 40 && daysSince <= 65) {
              checkType = 'Ultrasonla Gebelik Muayenesi';
            }

            if (checkType) {
              const mother = animals.find((a) => a.id === m.femaleId || a.farmTagNo === m.femaleId);
              pregnancyChecks.push({
                mating: m,
                motherTag: mother?.farmTagNo || mother?.nationalTagNo || m.femaleId || 'Bilinmiyor',
                motherName: mother?.name,
                checkType,
                daysSinceMating: daysSince,
              });
            }
          }
        }
      }
    }

    // 3. Today's Treatments & Protocols
    const todayTreatments: Treatment[] = [];
    if (options.includeTreatments) {
      for (const t of treatments) {
        const tDate = this.parseDate(t.date);
        if (tDate) {
          const diffDays = Math.floor((tDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays === 0) {
            todayTreatments.push(t);
          }
        }
      }
    }

    // 4. Pending Daily Tasks
    const pendingTasks: FarmTask[] = [];
    if (options.includeTasks) {
      for (const task of tasks) {
        if (task.status === 'bekliyor' || task.status === 'devam-ediyor') {
          pendingTasks.push(task);
        }
      }
    }

    // 5. Critical Low Stock Items
    const lowStockItems: StockItem[] = [];
    if (options.includeStock) {
      for (const item of stockItems) {
        const minLevel = item.minQuantity != null ? Number(item.minQuantity) : 10;
        const current = Number((item as any).currentStock ?? (item as any).quantity ?? 0);
        if (current <= minLevel) {
          lowStockItems.push(item);
        }
      }
    }

    // 6. Milk Production Yield
    let recentMilkYield = 0;
    if (options.includeYields) {
      const milkList = yields.filter((y) => y.type === 'sut');
      recentMilkYield = milkList.reduce((acc, y) => acc + (Number(y.amount) || 0), 0);
    }

    // Format WhatsApp / SMS message
    const messageText = this.buildMessageText({
      farmName,
      dateFormatted,
      upcomingBirths,
      pregnancyChecks,
      todayTreatments,
      pendingTasks,
      lowStockItems,
      recentMilkYield,
      customNote: options.customNote,
      options,
    });

    return {
      farmName,
      dateFormatted,
      upcomingBirths,
      pregnancyChecks,
      todayTreatments,
      pendingTasks,
      lowStockItems,
      recentMilkYield,
      messageText,
    };
  }

  private buildMessageText(params: {
    farmName: string;
    dateFormatted: string;
    upcomingBirths: UpcomingBirth[];
    pregnancyChecks: PregnancyCheck[];
    todayTreatments: Treatment[];
    pendingTasks: FarmTask[];
    lowStockItems: StockItem[];
    recentMilkYield: number;
    customNote?: string;
    options: BriefingSectionOptions;
  }): string {
    const lines: string[] = [];

    lines.push(`🌅 *${(params.farmName || 'ODIVON FARM').toUpperCase()} — SABAH BRİFİNGİ* 🌅`);
    lines.push(`📅 Tarih: ${params.dateFormatted}`);
    lines.push(`────────────────────────────`);

    if (params.customNote && params.customNote.trim()) {
      lines.push(`📌 *YÖNETİCİ NOTU:*`);
      lines.push(`${params.customNote.trim()}`);
      lines.push(``);
    }

    // 1. Upcoming Births
    if (params.options.includeBirths && params.upcomingBirths.length > 0) {
      lines.push(`🍼 *YAKLAŞAN DOĞUMLAR (${params.upcomingBirths.length} Baş):*`);
      for (const b of params.upcomingBirths) {
        const namePart = b.motherName ? ` (${b.motherName})` : '';
        const dayPart =
          b.daysRemaining === 0
            ? '🚨 BUGÜN BEKLENİYOR!'
            : b.daysRemaining < 0
            ? `⚠️ ${Math.abs(b.daysRemaining)} GÜN GECİKTİ!`
            : `${b.daysRemaining} gün sonra (${b.expectedDateStr})`;
        lines.push(`• Küpe: ${b.motherTag}${namePart} ➔ ${dayPart}`);
      }
      lines.push(``);
    }

    // 2. Pregnancy & Heat Checks
    if (params.options.includePregnancyChecks && params.pregnancyChecks.length > 0) {
      lines.push(`🔍 *TOHUMLAMA KONTROLLERİ (${params.pregnancyChecks.length} Baş):*`);
      for (const c of params.pregnancyChecks) {
        const namePart = c.motherName ? ` (${c.motherName})` : '';
        lines.push(`• Küpe: ${c.motherTag}${namePart} ➔ ${c.checkType} (${c.daysSinceMating}. gün)`);
      }
      lines.push(``);
    }

    // 3. Today's Treatments
    if (params.options.includeTreatments && params.todayTreatments.length > 0) {
      lines.push(`💉 *SAĞLIK VE AŞI PROTOKOLLERİ (${params.todayTreatments.length} Kayıt):*`);
      for (const t of params.todayTreatments.slice(0, 5)) {
        const desc = t.note || t.dosage || 'Planlı Tedavi Uygulaması';
        lines.push(`• ${desc}`);
      }
      if (params.todayTreatments.length > 5) {
        lines.push(`  ve ${params.todayTreatments.length - 5} işlem daha...`);
      }
      lines.push(``);
    }

    // 4. Daily Personnel Tasks
    if (params.options.includeTasks && params.pendingTasks.length > 0) {
      lines.push(`📋 *GÜNÜN GÖREVLERİ (${params.pendingTasks.length} Görev):*`);
      for (const task of params.pendingTasks.slice(0, 5)) {
        const desc = task.description ? ` (${task.description})` : '';
        lines.push(`• ${task.title}${desc}`);
      }
      if (params.pendingTasks.length > 5) {
        lines.push(`  ve ${params.pendingTasks.length - 5} görev daha...`);
      }
      lines.push(``);
    }

    // 5. Critical Low Stock Alerts
    if (params.options.includeStock && params.lowStockItems.length > 0) {
      lines.push(`⚠️ *KRİTİK STOK UYARILARI (${params.lowStockItems.length} Kalem):*`);
      for (const item of params.lowStockItems.slice(0, 4)) {
        const minQty = item.minQuantity || 10;
        const currentQty = (item as any).currentStock ?? (item as any).quantity ?? 0;
        lines.push(`• ${item.name}: Kalan ${currentQty} ${item.unit || 'adet'} (Kritik Eşik: ${minQty})`);
      }
      lines.push(``);
    }

    // 6. Milk Production
    if (params.options.includeYields && params.recentMilkYield > 0) {
      lines.push(`🥛 *ÜRETİM ÖZETİ:*`);
      lines.push(`• Toplam Süt Kaydı: ${params.recentMilkYield.toLocaleString('tr-TR')} Litre`);
      lines.push(``);
    }

    lines.push(`────────────────────────────`);
    lines.push(`⚡ _OdivonFARM ile otomatik oluşturuldu. Bereketli ve verimli bir gün dileriz!_`);

    return lines.join('\n');
  }

  /**
   * Helper to parse Firestore timestamp, string or Date
   */
  private parseDate(val: any): Date | null {
    if (!val) return null;
    if (typeof val?.toDate === 'function') return val.toDate();
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }

  /**
   * Triggers WhatsApp with the encoded message
   */
  openWhatsApp(message: string, phone: string = ''): void {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const baseUrl = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=`
      : `https://api.whatsapp.com/send?text=`;
    const url = baseUrl + encodeURIComponent(message);
    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
  }

  /**
   * Triggers SMS app
   */
  openSms(message: string): void {
    const url = `sms:?body=${encodeURIComponent(message)}`;
    if (typeof window !== 'undefined') {
      window.location.href = url;
    }
  }
}
