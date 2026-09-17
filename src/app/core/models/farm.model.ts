import { BaseDoc } from './base.model';

export type AppRole = 'admin' | 'yonetici' | 'veteriner' | 'saha' | 'muhasebe' | 'okuyucu';

/** users/{uid} — kimlik doğrulama sonrası kullanıcı profili */
export interface AppUser {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  phone?: string;
  countryCode?: string;
  country?: string;
  language?: string;
  lastLoginAt?: any;
  lastLoginPlatform?: string;
  lastLoginDevice?: string;
  /** Kullanıcının erişebildiği çiftlikler ve o çiftlikteki rolü */
  memberships: FarmMembership[];
  activeFarmId?: string;
  createdAt?: any;
}

export interface FarmMembership {
  farmId: string;
  role: AppRole;
}

/** farms/{farmId} */
export interface Farm {
  id?: string;
  name: string;
  ownerUid: string;
  address?: string;
  phone?: string;
  countryCode?: string;
  country?: string;
  language?: string;
  createdAt?: any;
  updatedAt?: any;
}

/** farms/{farmId}/members/{memberId} — çiftliğe bağlı kullanıcı/personel */
export interface FarmMember extends BaseDoc {
  uid?: string;
  email: string;
  displayName: string;
  phone?: string;
  role: AppRole;
  status: 'active' | 'invited' | 'passive';
  title?: string; // örn: "Çiftlik Sahibi", "Baş Veteriner", "Saha Şefi"
  notes?: string;
  invitedBy?: string;
  lastActiveAt?: any;
  lastLoginAt?: any;
}

/** farms/{farmId}/roles/{roleId} — özel rol tanımı (Tanımlamalar > Roller) */
export interface RoleDefinition extends BaseDoc {
  name: string;
  code?: string;
  description?: string;
  permissions: string[];
  isSystem?: boolean;
}

export interface RoleCatalogItem {
  key: AppRole;
  label: string;
  shortDescription: string;
  longDescription: string;
  icon: string;
  badgeClass: string;
  borderClass: string;
  bgClass: string;
  textClass: string;
  permissions: {
    category: string;
    items: string[];
  }[];
}

export const ROLE_CATALOG: Record<AppRole, RoleCatalogItem> = {
  admin: {
    key: 'admin',
    label: 'Yönetici (Admin)',
    shortDescription: 'Çiftlik sahibi / Tam yetkili kurucu kullanıcı',
    longDescription: 'Sistem üzerinde en üst düzey yetkiye sahiptir. Çiftlik ayarlarını, kullanıcıları, rolleri, silme işlemlerini ve tüm finansal/operasyonel kayıtları yönetebilir.',
    icon: 'heroicons_outline:shield-check',
    badgeClass: 'bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/30',
    borderClass: 'border-rose-500/40',
    bgClass: 'bg-rose-500/5 dark:bg-rose-950/20',
    textClass: 'text-rose-600 dark:text-rose-400',
    permissions: [
      { category: 'Sistem & Çiftlik', items: ['Çiftlik Ayarlarını Değiştirme', 'Kullanıcı Ekleme / Çıkarma / Rol Değiştirme', 'Geri Dönüşüm Kutusu & Kalıcı Silme'] },
      { category: 'Hayvan Yönetimi', items: ['Hayvan Kayıt/Düzenleme/Silme', 'Sürü ve Padok Değişimi', 'Çiftleşme ve Doğum Takibi'] },
      { category: 'Sağlık & Tedavi', items: ['Tedavi Kayıt/Onay/Sonlandırma', 'Aşı Takvimi Yönetimi', 'Protokol Tanımlama'] },
      { category: 'Finans & Envanter', items: ['Cari Hesap Yönetimi', 'Stok Giriş/Çıkış & Sayım', 'Mali Raporlar & Kâr/Zarar'] },
    ],
  },
  yonetici: {
    key: 'yonetici',
    label: 'İşletme Müdürü',
    shortDescription: 'Operasyon, sürü, personel ve stok yöneticisi',
    longDescription: 'Çiftliğin genel operasyonlarını yürütür. Hayvanları, sürüleri, padokları, görevleri ve stok hareketlerini yönetir.',
    icon: 'heroicons_outline:briefcase',
    badgeClass: 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border-indigo-500/30',
    borderClass: 'border-indigo-500/40',
    bgClass: 'bg-indigo-500/5 dark:bg-indigo-950/20',
    textClass: 'text-indigo-600 dark:text-indigo-400',
    permissions: [
      { category: 'Operasyon', items: ['Hayvan Kayıt ve Hareketleri', 'Sürü & Padok Yönetimi', 'Görev Atama & Takibi'] },
      { category: 'Envanter', items: ['Stok Giriş/Çıkış', 'Rasyon ve Yem Planı', 'Sayım Operasyonları'] },
      { category: 'Raporlar', items: ['Verim Raporları', 'Aktivite Günlüğü İnceleme'] },
    ],
  },
  veteriner: {
    key: 'veteriner',
    label: 'Veteriner Hekim',
    shortDescription: 'Hayvan sağlığı, tedavi, aşı ve protokol uzmanı',
    longDescription: 'Hayvanların medikal takiplerini, tedavi planlamalarını, aşı takvimini ve doğum/çiftleşme süreçlerini yönetir.',
    icon: 'heroicons_outline:heart',
    badgeClass: 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/30',
    borderClass: 'border-emerald-500/40',
    bgClass: 'bg-emerald-500/5 dark:bg-emerald-950/20',
    textClass: 'text-emerald-600 dark:text-emerald-400',
    permissions: [
      { category: 'Sağlık & Medikal', items: ['Tedavi Başlatma & Güncelleme', 'Aşı Takvimi ve Uygulamaları', 'Hastalık Teşhis Kaydı'] },
      { category: 'Üreme & Islah', items: ['Tohumlama & Çiftleşme Kaydı', 'Gebelik Muayenesi', 'Doğum Kayıtları'] },
      { category: 'Hayvan İnceleme', items: ['Tüm Hayvan Kartlarını İnceleme', 'Sağlık Geçmişi Görüntüleme'] },
    ],
  },
  saha: {
    key: 'saha',
    label: 'Saha & Bakım Personeli',
    shortDescription: 'Günlük görevler, sayım, tartım ve padok takibi',
    longDescription: 'Çiftlik içi günlük operasyonları gerçekleştirir. Padok hareketleri, canlı ağırlık tartımları, rutin sayımlar ve verilen görevleri tamamlar.',
    icon: 'heroicons_outline:user',
    badgeClass: 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/30',
    borderClass: 'border-amber-500/40',
    bgClass: 'bg-amber-500/5 dark:bg-amber-950/20',
    textClass: 'text-amber-600 dark:text-amber-400',
    permissions: [
      { category: 'Saha Operasyonları', items: ['Günlük Görevleri Tamamlama', 'Padok Değişim Kayıtları', 'Canlı Ağırlık Tartım Girişi'] },
      { category: 'Sayım & Kontrol', items: ['Karekod/Barkod ile Hızlı Sayım', 'Sürü İnceleme'] },
    ],
  },
  muhasebe: {
    key: 'muhasebe',
    label: 'Muhasebe Sorumlusu',
    shortDescription: 'Cari hesaplar, faturalar, gelir/gider ve maliyetler',
    longDescription: 'Çiftliğin tüm finansal kayıtlarını, alım-satım işlemlerini, cari hesap bakiyelerini ve stok maliyetlerini yönetir.',
    icon: 'heroicons_outline:currency-dollar',
    badgeClass: 'bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 border-cyan-500/30',
    borderClass: 'border-cyan-500/40',
    bgClass: 'bg-cyan-500/5 dark:bg-cyan-950/20',
    textClass: 'text-cyan-600 dark:text-cyan-400',
    permissions: [
      { category: 'Finans', items: ['Cari Hesap Ekleme/Düzenleme', 'Gelir & Gider İşlemleri', 'Tahsilat ve Ödeme Kayıtları'] },
      { category: 'Stok Maliyeti', items: ['Stok Alış Faturaları', 'Birim Maliyet Hesaplamaları'] },
      { category: 'Mali Raporlama', items: ['Bilanço ve Nakit Akış', 'Dönemsel Finans Raporları'] },
    ],
  },
  okuyucu: {
    key: 'okuyucu',
    label: 'Gözlemci / Stajyer',
    shortDescription: 'Salt okunur inceleme yetkisi',
    longDescription: 'Çiftlik verilerini görüntüleyebilir ancak herhangi bir ekleme, düzenleme veya silme işlemi yapamaz.',
    icon: 'heroicons_outline:eye',
    badgeClass: 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/30',
    borderClass: 'border-slate-500/40',
    bgClass: 'bg-slate-500/5 dark:bg-slate-950/20',
    textClass: 'text-slate-600 dark:text-slate-400',
    permissions: [
      { category: 'Salt Okunur', items: ['Hayvan Listesi Görüntüleme', 'Raporları İnceleme', 'Aktivite İzleme'] },
    ],
  },
};
