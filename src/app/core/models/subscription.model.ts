import { BaseDoc } from './base.model';

export type PlanId = 'trial' | 'starter' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired';
export type BillingCycle = 'monthly' | 'yearly';

export interface PlanFeature {
  name: string;
  included: boolean;
  tooltip?: string;
}

export interface PlanDefinition {
  id: PlanId;
  name: string;
  badge?: string;
  tagline: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number; // 2 ay ücretsiz (10 aylık fiyat)
  animalLimit: number; // ör: 50, 250, 999999
  userLimit: number;   // ör: 2, 5, 999
  storageLimitMb: number;
  highlighted?: boolean;
  colorScheme: {
    badge: string;
    border: string;
    bg: string;
    button: string;
    text: string;
  };
  features: PlanFeature[];
}

export interface FarmSubscription extends BaseDoc {
  planId: PlanId;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  startDate: any;
  currentPeriodEnd: any;
  trialEndsAt?: any;
  animalLimit: number;
  userLimit: number;
  storageLimitMb: number;
  pricePaid?: number;
  paymentMethod?: 'credit_card' | 'bank_transfer' | 'manual';
  updatedAt?: any;
}

export const PLAN_CATALOG: Record<PlanId, PlanDefinition> = {
  trial: {
    id: 'trial',
    name: '14 Günlük Deneme',
    badge: 'Kredi Kartsız',
    tagline: 'Tüm Profesyonel özellikleri 14 gün boyunca ücretsiz deneyin',
    description: 'Çiftliğinizi dijitalleştirmeye hemen başlayın. Taahhüt veya kart gerekmez.',
    monthlyPrice: 0,
    yearlyPrice: 0,
    animalLimit: 250,
    userLimit: 5,
    storageLimitMb: 1024,
    colorScheme: {
      badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      border: 'border-emerald-500/40',
      bg: 'bg-emerald-500/5',
      button: 'bg-emerald-600 hover:bg-emerald-500 text-white',
      text: 'text-emerald-600 dark:text-emerald-400',
    },
    features: [
      { name: '250 Baş Hayvan Kapasitesi', included: true },
      { name: '5 Kullanıcı / Personel', included: true },
      { name: 'Hayvan Takibi & Pedigri', included: true },
      { name: 'Tedavi, Aşı & Sağlık Takvimi', included: true },
      { name: 'Sayım & Canlı Ağırlık', included: true },
      { name: 'Stok & Rasyon Yönetimi', included: true },
      { name: 'Cari & Muhasebe Modülü', included: true },
      { name: 'Gelişmiş Raporlama', included: true },
    ],
  },
  starter: {
    id: 'starter',
    name: 'Başlangıç (Starter)',
    badge: 'Aile & Hobi',
    tagline: 'Küçük ölçekli ve aile tipi çiftlikler için ideal çözüm',
    description: 'Temel hayvan sağlığı, küpe ve günlük hareketleri dijitalleştirin.',
    monthlyPrice: 299,
    yearlyPrice: 2990, // %17 tasarruf
    animalLimit: 50,
    userLimit: 2,
    storageLimitMb: 500,
    colorScheme: {
      badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20',
      border: 'border-slate-200 dark:border-slate-700',
      bg: 'bg-slate-50 dark:bg-slate-800/40',
      button: 'bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white',
      text: 'text-slate-800 dark:text-white',
    },
    features: [
      { name: '50 Baş Hayvan Kapasitesi', included: true },
      { name: '2 Kullanıcı (1 Yönetici + 1 Personel)', included: true },
      { name: 'Hayvan Takibi & Küpeleme', included: true },
      { name: 'Tedavi & Aşı Takvimi', included: true },
      { name: 'Canlı Ağırlık & Tartım', included: true },
      { name: 'Karekod ile Hızlı Sayım', included: true },
      { name: 'Stok & Envanter Yönetimi', included: false, tooltip: 'Profesyonel pakette mevcuttur' },
      { name: 'Cari Hesaplar & Finans', included: false, tooltip: 'Profesyonel pakette mevcuttur' },
      { name: 'Rasyon & Yem Takibi', included: false, tooltip: 'Profesyonel pakette mevcuttur' },
    ],
  },
  pro: {
    id: 'pro',
    name: 'Profesyonel (Pro)',
    badge: 'En Çok Tercih Edilen',
    tagline: 'Orta ölçekli, büyüyen çiftlikler ve tam entegre operasyonlar',
    description: 'Envanter, muhasebe, rasyon ve ekip yönetimini tek çatı altında toplayın.',
    monthlyPrice: 699,
    yearlyPrice: 6990, // %17 tasarruf
    animalLimit: 250,
    userLimit: 5,
    storageLimitMb: 5120, // 5 GB
    highlighted: true,
    colorScheme: {
      badge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      border: 'border-indigo-500 ring-2 ring-indigo-500/20',
      bg: 'bg-indigo-50/50 dark:bg-indigo-950/30',
      button: 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white shadow-lg shadow-indigo-500/25',
      text: 'text-indigo-600 dark:text-indigo-400',
    },
    features: [
      { name: '250 Baş Hayvan Kapasitesi', included: true },
      { name: '5 Kullanıcı (Tüm Roller Dahil)', included: true },
      { name: 'Hayvan Takibi & Pedigri Soykütüğü', included: true },
      { name: 'Tedavi, Aşı & Sağlık Protokolleri', included: true },
      { name: 'Stok Giriş/Çıkış & Depo Yönetimi', included: true },
      { name: 'Rasyon & Yem Tüketim Planlaması', included: true },
      { name: 'Cari Hesaplar & Finans Takibi', included: true },
      { name: 'Gelişmiş Verim & Kâr/Zarar Raporları', included: true },
      { name: 'Foto Galeri (5 GB Bulut Depolama)', included: true },
      { name: 'Öncelikli Destek Hattı', included: true },
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Kurumsal (Enterprise)',
    badge: 'Büyük Tesisler',
    tagline: 'Endüstriyel hayvancılık tesisleri ve entegre tarım işletmeleri',
    description: 'Sınırsız kapasite, çoklu çiftlik desteği, özel roller ve 7/24 VIP destek.',
    monthlyPrice: 1499,
    yearlyPrice: 14990,
    animalLimit: 999999, // Sınırsız
    userLimit: 9999,      // Sınırsız
    storageLimitMb: 25600,// 25 GB+
    colorScheme: {
      badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      border: 'border-purple-500/40',
      bg: 'bg-purple-500/5 dark:bg-purple-950/20',
      button: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white',
      text: 'text-purple-600 dark:text-purple-400',
    },
    features: [
      { name: 'Sınırsız Hayvan Kapasitesi', included: true },
      { name: 'Sınırsız Kullanıcı & Personel', included: true },
      { name: 'Çoklu Çiftlik / Şube Desteği', included: true },
      { name: 'Tüm Operasyonel & Finansal Modüller', included: true },
      { name: 'Özel Rol & Yetki Tanımlama', included: true },
      { name: 'Karekod & RFID Donanım Entegrasyonu', included: true },
      { name: '25 GB+ Foto Galeri & Doküman Alanı', included: true },
      { name: 'Toplu Veri İçe/Dışa Aktarma (Excel/API)', included: true },
      { name: '7/24 Özel Müşteri Temsilcisi & VIP Destek', included: true },
    ],
  },
};
