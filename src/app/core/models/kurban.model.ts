import { BaseDoc } from './base.model';

export interface KurbanHisse {
  id: string; // 1 to 7
  hissedarName: string;
  phone: string;
  email?: string;
  sharePrice: number; // Hisse Bedeli (₺)
  depositPaid: number; // Alınan Kapora (₺)
  remainingPayment: number; // Kalan Bakiye (₺)
  meatPreference?: 'kemikli' | 'kemiksiz' | 'standart_7_pay' | string;
  isPaid: boolean;
  paymentLink?: string;
  paymentStatus?: 'bekliyor' | 'kismi_odendi' | 'odendi';
  paidAt?: any;
  notes?: string;
}

export interface KurbanAnimal extends BaseDoc {
  animalId: string; // reference to Animal doc
  tagNo: string; // Ear tag
  animalName?: string;
  category: 'buyukbas' | 'kucukbas';
  liveWeightKg: number; // Canlı Ağırlık (kg)
  carcassYieldPercent: number; // Randıman % (örn: Büyükbaş %57, Küçükbaş %50)
  estimatedMeatKg: number; // Tahmini Karkas Et (kg) = liveWeight * yield%
  shareCount: number; // Büyükbaş: 7, Küçükbaş: 1
  totalPrice: number; // Toplam Satış Bedeli (₺)
  sharePrice: number; // Hisse Başı Bedel (₺) = totalPrice / shareCount
  slaughterOrder: number; // Kesim Sıra No (örn: 14)
  slaughterDay: number; // Kurban Bayramı Günü (1, 2, 3)
  slaughterTime: string; // Randevu Saati (örn: "09:30")
  status: 'satista' | 'tum_hisseler_doldu' | 'kesildi' | 'teslim_edildi';
  shares: KurbanHisse[];
  notes?: string;
}
