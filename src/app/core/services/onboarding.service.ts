import { Injectable, inject, signal, computed } from '@angular/core';
import { FarmContextService } from './farm-context.service';

export interface OnboardingStep {
  key: string;
  order: number;
  title: string;
  description: string;
  category: 'kurulum' | 'donanim' | 'egitim';
  route?: string;
  isCompleted: boolean;
  actionText: string;
  badgeText?: string;
}

export interface SystemTourItem {
  id: string;
  title: string;
  category: string;
  icon: string;
  summary: string;
  keyFeatures: string[];
  route: string;
}

@Injectable({
  providedIn: 'root',
})
export class OnboardingService {
  private farmContext = inject(FarmContextService);

  // Wizard Dialog State
  isWizardOpen = signal<boolean>(false);
  activeTab = signal<'steps' | 'tour'>('steps');

  // Step states
  private completedStepKeys = signal<string[]>(this.loadCompletedSteps());

  // Step Definitions
  readonly STEPS: OnboardingStep[] = [
    {
      key: 'farm_profile',
      order: 1,
      title: 'Çiftlik Profil ve İşletme Numarası',
      description: 'Çiftliğinizin Tarım Bakanlığı işletme tescil numarasını, konumunu ve kapasitesini doğrulayın.',
      category: 'kurulum',
      route: '/tanimlamalar',
      isCompleted: false,
      actionText: 'Profili Düzenle',
      badgeText: 'Temel Ayar',
    },
    {
      key: 'paddocks_herds',
      order: 2,
      title: 'Padok ve Sürü Yerleşimi',
      description: 'Sağmal, besi, karantina/revir ve doğum padokları ile anaç sürülerinizi tanımlayın.',
      category: 'kurulum',
      route: '/tanimlamalar/padoklar',
      isCompleted: false,
      actionText: 'Padok Ekle',
      badgeText: 'Operasyon',
    },
    {
      key: 'animals_import',
      order: 3,
      title: 'Hayvan Varlıklarının Sisteme Kaydı',
      description: 'Kulak küpe no, ırk, cinsiyet ve doğum tarihi bilgileriyle sürü mevcudunuzu kaydedin veya Excel ile aktarın.',
      category: 'kurulum',
      route: '/hayvanlar',
      isCompleted: false,
      actionText: 'Hayvan Ekle',
      badgeText: 'Varlıklar',
    },
    {
      key: 'devices_pairing',
      order: 4,
      title: 'RFID & IoT Tartı Cihaz Eşleştirme',
      description: 'Bluetooth akıllı kantarınızı veya RFID el terminali simülatörünü test ederek eşleştirin.',
      category: 'donanim',
      route: '/sayim',
      isCompleted: false,
      actionText: 'Cihazı Test Et',
      badgeText: 'Gömülü Sistem',
    },
    {
      key: 'first_operation',
      order: 5,
      title: 'İlk Canlı Tartım & Sağlık İşlemi',
      description: 'Bir hayvana ait ilk tartım ölçümünü veya koruyucu aşı protokolünü sisteme girin.',
      category: 'kurulum',
      route: '/canli-agirlik',
      isCompleted: false,
      actionText: 'Tartım Başlat',
      badgeText: 'Kayıt',
    },
    {
      key: 'training_modules',
      order: 6,
      title: 'OdivonFARM Modül Eğitimi ve Tur',
      description: 'Sistemde yer alan 21 akıllı yönetim modülünün işlevlerini ve çiftliğinize katacağı değeri öğrenin.',
      category: 'egitim',
      route: '/anasayfa',
      isCompleted: false,
      actionText: 'Modülleri Keşfet',
      badgeText: 'Sertifika',
    },
  ];

  // System Modules Tour Catalog
  readonly SYSTEM_TOUR: SystemTourItem[] = [
    {
      id: 'animals',
      title: 'Hayvan Yönetimi & Pedigri',
      category: 'Sürü Yönetimi',
      icon: 'heroicons_solid:user-group',
      summary: 'Tüm sürünün kulak küpeleri, ırk özellikleri, soy kütüğü (anne-baba) ve yaşam döngüsü.',
      keyFeatures: [
        'RFID ve DKN küpe ile anlık arama',
        '3 nesil interaktif pedigri soy ağacı',
        'Toplu padok ve durum transferi',
      ],
      route: '/hayvanlar',
    },
    {
      id: 'tagem',
      title: 'TAGEM & Genetik Islah',
      category: 'Ar-Ge ve Islah',
      icon: 'heroicons_solid:chart-bar',
      summary: 'Halk Elinde Islah Projelerine uyumlu 90. gün düzeltilmiş ağırlık ve damızlık koç/teke seçim indeksi.',
      keyFeatures: [
        'Çevre faktörleri düzeltme katsayıları',
        'Kombine Islah Değeri (BLUP) puanı',
        'TAGEM uyumlu XML ve Excel dışa aktarım',
      ],
      route: '/raporlar',
    },
    {
      id: 'iot',
      title: 'Gömülü Sistemler (IoT) & Telemetri',
      category: 'Donanım Entegrasyonu',
      icon: 'heroicons_solid:chip',
      summary: 'Web Bluetooth üzerinden akıllı kantar, RFID geçiş kapısı ve barınak mikroklima sensörleri.',
      keyFeatures: [
        'Web Bluetooth ile tarayıcıdan direkt tartı bağlantısı',
        'Amonyak (NH3) ve THI Isı Stres İndeksi uyarısı',
        'Otomatik kapı sayım ve geçiş logları',
      ],
      route: '/sayim',
    },
    {
      id: 'breeding',
      title: 'Üreme & Doğum Takibi',
      category: 'Biyolojik Döngü',
      icon: 'heroicons_solid:heart',
      summary: 'Koç katımı planlaması, ultrason gebelik muayeneleri ve tahmini doğum ajandası.',
      keyFeatures: [
        'Otomatik gebelik süresi ve doğum tarihi hesabı',
        'Canlı ve ölü doğum oranları analizi',
        'Doğum sonrası anne-yavru otomatik eşleme',
      ],
      route: '/ciftlesmeler',
    },
    {
      id: 'treatments',
      title: 'Sağlık & Veteriner Triage',
      category: 'Veterinerlik',
      icon: 'heroicons_solid:shield-check',
      summary: 'Aşı takvimi, sürü parazit mücadeleleri, kullanılan ilaçlar ve yasal arınma süreleri.',
      keyFeatures: [
        'Et ve süt kesim süresi (arınma) geri sayımı',
        'Toplu sürü aşılama protokolleri',
        'Hastalık ve ölüm vaka analizleri',
      ],
      route: '/tedaviler',
    },
    {
      id: 'rations',
      title: 'Rasyon & Yem Dengeleme',
      category: 'Besleme',
      icon: 'heroicons_solid:sparkles',
      summary: 'Sağmal, besi ve kuzu gruplarına göre kuru madde, protein ve enerji dengeli yem reçeteleri.',
      keyFeatures: [
        'NRC ve INRA besleme normları motoru',
        'Günlük hayvan başı yem maliyeti',
        'Ambar stoklarıyla entegre yem tüketim düşümü',
      ],
      route: '/rasyon',
    },
  ];

  // Computed Progress
  stepsWithStatus = computed(() => {
    const completed = this.completedStepKeys();
    return this.STEPS.map((s) => ({
      ...s,
      isCompleted: completed.includes(s.key),
    }));
  });

  completedCount = computed(() => {
    return this.completedStepKeys().length;
  });

  totalSteps = computed(() => {
    return this.STEPS.length;
  });

  progressPercent = computed(() => {
    if (this.totalSteps() === 0) return 0;
    return Math.round((this.completedCount() / this.totalSteps()) * 100);
  });

  isCompleted = computed(() => {
    return this.completedCount() >= this.totalSteps();
  });

  openWizard(tab: 'steps' | 'tour' = 'steps'): void {
    this.activeTab.set(tab);
    this.isWizardOpen.set(true);
  }

  closeWizard(): void {
    this.isWizardOpen.set(false);
  }

  toggleStepComplete(stepKey: string): void {
    const current = this.completedStepKeys();
    let updated: string[];
    if (current.includes(stepKey)) {
      updated = current.filter((k) => k !== stepKey);
    } else {
      updated = [...current, stepKey];
    }
    this.completedStepKeys.set(updated);
    this.saveCompletedSteps(updated);
  }

  markStepComplete(stepKey: string): void {
    const current = this.completedStepKeys();
    if (!current.includes(stepKey)) {
      const updated = [...current, stepKey];
      this.completedStepKeys.set(updated);
      this.saveCompletedSteps(updated);
    }
  }

  resetProgress(): void {
    this.completedStepKeys.set([]);
    this.saveCompletedSteps([]);
  }

  private loadCompletedSteps(): string[] {
    if (typeof localStorage === 'undefined') return ['farm_profile'];
    try {
      const stored = localStorage.getItem('odivon_onboarding_completed');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      // Fallback
    }
    return ['farm_profile'];
  }

  private saveCompletedSteps(steps: string[]): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem('odivon_onboarding_completed', JSON.stringify(steps));
    } catch (e) {
      // Ignore
    }
  }
}
