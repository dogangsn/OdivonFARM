export type TurkvetNotificationType = 'dogum' | 'sevk_satis' | 'dusum_olum';
export type TurkvetSyncStatus = 'beklemede' | 'gonderildi' | 'onaylandi' | 'hata';

export interface TurkvetNotificationItem {
  id: string;
  animalId: string;
  nationalTagNo: string;
  farmTagNo: string;
  notificationType: TurkvetNotificationType;
  eventDate: Date;
  motherTagNo?: string;
  gender: 'disi' | 'erkek';
  breed?: string;
  status: TurkvetSyncStatus;
  note?: string;
}

export type SubsidyType = 'anac_koyun_keci' | 'suru_buyutme' | 'soy_kutugu_tagem';

export interface SubsidyEligibilityItem {
  animalId: string;
  nationalTagNo: string;
  farmTagNo: string;
  subsidyType: SubsidyType;
  subsidyName: string;
  unitPayoutAmount: number; // ₺
  isEligible: boolean;
  riskReason?: string; // Örn: 'PPR veba aşısı yapılmamış'
  actionToFix?: string; // Örn: 'Tedaviler ekranından aşıyı işleyin'
}

export interface SubsidyExecutiveSummary {
  totalEligibleCount: number;
  totalEstimatedPayout: number; // Toplam hak edilen teşvik (₺)
  totalAtRiskCount: number;
  totalPotentialLossAmount: number; // Aşı/yaş eksiği yüzünden yanma riski taşıyan teşvik (₺)
  categoryBreakdown: {
    name: string;
    count: number;
    amount: number;
  }[];
}
