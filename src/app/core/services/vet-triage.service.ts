import { Injectable } from '@angular/core';

export type TriageUrgency = 'critical' | 'high' | 'moderate' | 'low';

export interface ClinicalScenario {
  id: string;
  name: string;
  species: 'all' | 'cattle' | 'sheep_goat';
  lifeStage?: string[];
  urgency: TriageUrgency;
  primarySymptoms: string[];
  description: string;
  immediateFirstAid: string[];
  contraindications: string[]; // Kesinlikle yapılmaması gerekenler!
  recommendedMedicationGroup: string;
  followUpAdvice: string;
}

export interface TriageResult {
  scenario: ClinicalScenario;
  matchScore: number;
  matchedSymptoms: string[];
}

@Injectable({
  providedIn: 'root',
})
export class VetTriageService {
  readonly availableSymptoms: { id: string; label: string; icon: string; category: string }[] = [
    // Genel & Duruş
    { id: 'yatip_kalkamama', label: 'Yatıp Kalkamama (Yatar Durumda)', icon: 'heroicons_outline:user', category: 'Genel Durum' },
    { id: 'soguk_kulaklar', label: 'Kulak ve Boyunda Soğukluk', icon: 'heroicons_outline:sparkles', category: 'Genel Durum' },
    { id: 'yuksek_ates', label: 'Yüksek Ateş (39.5°C ve üzeri)', icon: 'heroicons_outline:fire', category: 'Genel Durum' },
    { id: 'istahsizlik', label: 'Yem Yememe / İştahsızlık', icon: 'heroicons_outline:ban', category: 'Genel Durum' },
    { id: 'kasintilar_titreme', label: 'Titreme / Kasılmalar', icon: 'heroicons_outline:refresh', category: 'Genel Durum' },

    // Sindirim & Karın
    { id: 'siskinlik_sol', label: 'Sol Karında Taş Gibi Şişlik (Timpani)', icon: 'heroicons_outline:globe', category: 'Sindirim' },
    { id: 'sulu_ishal', label: 'Şiddetli Sulu / Kanlı İshal', icon: 'heroicons_outline:exclamation', category: 'Sindirim' },
    { id: 'gevis_durmasi', label: 'Geveş Getirmenin Tamamen Durması', icon: 'heroicons_outline:clock', category: 'Sindirim' },
    { id: 'dis_gicirdatma', label: 'Diş Gıcırdatma (Karın Ağrısı)', icon: 'heroicons_outline:volume-up', category: 'Sindirim' },

    // Solunum & Ağız
    { id: 'hizli_nefes', label: 'Soluk Soluğa Nefes / Karından Soluma', icon: 'heroicons_outline:lightning-bolt', category: 'Solunum' },
    { id: 'kopuklu_salya', label: 'Ağızdan Köpüklü Salya Gelmesi', icon: 'heroicons_outline:cloud', category: 'Solunum' },
    { id: 'oksuruk', label: 'Şiddetli / Kuru Öksürük', icon: 'heroicons_outline:annotation', category: 'Solunum' },
    { id: 'aseton_kokusu', label: 'Nefeste Tatlı / Keskin Aseton Kokusu', icon: 'heroicons_outline:badge-check', category: 'Solunum' },

    // Meme & Üreme
    { id: 'meme_taslasma', label: 'Memede Sıcaklık, Şişlik ve Taşlaşma', icon: 'heroicons_outline:shield-exclamation', category: 'Meme & Doğum' },
    { id: 'sut_degisimi', label: 'Sütün Sulu, Pıhtılı veya Kanlı Gelmesi', icon: 'heroicons_outline:color-swatch', category: 'Meme & Doğum' },
    { id: 'uzayan_dogum', label: '2 Saati Aşan Doğum Sancısı / İlerleme Yok', icon: 'heroicons_outline:heart', category: 'Meme & Doğum' },

    // Ayak & Hareket
    { id: 'topallik', label: 'Belirgin Topallık / Ayak Basamama', icon: 'heroicons_outline:cursor-click', category: 'Hareket' },
    { id: 'bas_geriye', label: 'Başın Geriye Bükülmesi (Opistotonus)', icon: 'heroicons_outline:support', category: 'Hareket' },
  ];

  readonly clinicalKnowledgeBase: ClinicalScenario[] = [
    {
      id: 'hipokalsemi',
      name: 'Hipokalsemi / Doğum Felci (Süt Humması)',
      species: 'cattle',
      lifeStage: ['yeni_dogum', 'laktasyon'],
      urgency: 'critical',
      primarySymptoms: ['yatip_kalkamama', 'soguk_kulaklar', 'gevis_durmasi', 'istahsizlik'],
      description: 'Doğum sonrası kalsiyumun aniden süte geçmesi sonucu kanda kalsiyum seviyesinin kritik düzeye düşmesi. Acil müdahale edilmezse koma ve ölümle sonuçlanır.',
      immediateFirstAid: [
        'Hayvanı kesinlikle yan yatırmayın! İşkembedeki gazı atabilmesi için göğsü üzerine dik (sternal) pozisyonda oturtun.',
        'Vücut ısısını korumak için üzerine kalın örtü / battaniye örtün ve saman balyaları ile destekleyin.',
        'Veteriner çağrılana kadar Kalsiyum Boroglukonat preparatını vücut sıcaklığına (38°C) kadar ısıtın.',
      ],
      contraindications: [
        'ASLA yatan ve bilinci yarı kapalı hayvana zorla su veya ağızdan ilaç İÇİRMEYİN! Sıvı doğrudan akciğere kaçarak boğulmaya (aspirasyon pnömonisi) yol açar.',
        'Hayvanı traktör veya vinçle zorla ayağa kaldırmaya çalışmayın, kemik ve kas yırtılmalarına sebep olur.',
      ],
      recommendedMedicationGroup: 'Vücut sıcaklığında intravenöz (IV) yavaş Kalsiyum Boroglukonat + Deri altı destek + Magnezyum / Fosfor kompleksi.',
      followUpAdvice: 'Müdahale sonrası ilk 24 saat içinde tekrar yatabilir (nüks). Kalsiyum jel takviyesi yapın.',
    },
    {
      id: 'timpani',
      name: 'Akut Rumen Timpanisi (Gazlı veya Köpüklü Şişkinlik)',
      species: 'all',
      lifeStage: ['besi', 'laktasyon', 'gebe'],
      urgency: 'critical',
      primarySymptoms: ['siskinlik_sol', 'hizli_nefes', 'kopuklu_salya', 'dis_gicirdatma'],
      description: 'Sol açlık çukurluğunda gazın sıkışması sonucu diyaframa baskı yapıp hayvanı boğulma tehlikesiyle karşı karşıya bırakan en acil rumen tablosudur.',
      immediateFirstAid: [
        'Hayvanın ön ayaklarını yüksek bir zemine çıkartarak diyafram üzerindeki baskıyı azaltın.',
        'Ağzına enlemesine bir tahta takoz bağlayarak sürekli çiğneme refleksi ve geğirme gaz çıkışı sağlamaya çalışın.',
        'Veteriner gelene kadar hayvanı yavaş tempoda yürütmeye çalışın.',
      ],
      contraindications: [
        'Boğulma tehlikesi geçmeden hayvanı yatırmayın.',
        'Tecrübesiz kişilerce bilinçsizce sol karından kalın iğne veya bıçak sokulmamalıdır (peritonit ve ölüm riski). Sadece son çare olarak sol açlık çukurluğunun en tepe noktasına trokar uygulanabilir.',
      ],
      recommendedMedicationGroup: 'Mide sondası ile gaz tahliyesi + Poloxalene / Dimetikon veya Sıvı Parafin (köpük kırıcı).',
      followUpAdvice: 'Rasyondaki taze yonca veya aşırı ince öğütülmüş konsantre yem oranını gözden geçirin.',
    },
    {
      id: 'akut_mastitis',
      name: 'Akut / Toksik Mastitis (Meme İltihabı)',
      species: 'cattle',
      lifeStage: ['laktasyon'],
      urgency: 'high',
      primarySymptoms: ['meme_taslasma', 'sut_degisimi', 'yuksek_ates', 'istahsizlik'],
      description: 'Meme lobunun bakteri (E. coli, S. aureus vb.) istilasına uğraması. Toksinler kana karışarak (endotoksemi) hayvanın hayatını tehdit edebilir.',
      immediateFirstAid: [
        'İltihaplı meme lobunu saat başı masaj yaparak tamamen sağın ve iltihaplı sütü asla yere dökmeyin (diğer memelere bulaşır).',
        'Meme lobuna yangıyı azaltmak için soğuk su banyosu veya buz kompresi uygulayın.',
      ],
      contraindications: [
        'Meme içine kontrolsüz sıcak kompres uygulamayın (ödemi artırır).',
        'Hasta memeden sağılan sütü asla yavruya içirmeyin.',
      ],
      recommendedMedicationGroup: 'Geniş spektrumlu sistemik antibiyotik + Güçlü NSAID (Flunixin Meglumine) + İntramammar tüp + Sıvı tedavisi.',
      followUpAdvice: 'Sağım hijyenini ve sağım başlıklarının vakum basıncını kontrol edin.',
    },
    {
      id: 'asidoz',
      name: 'Akut Ruminal Asidoz (Tane Yem Çarpması / Hamurlama)',
      species: 'all',
      lifeStage: ['besi', 'laktasyon'],
      urgency: 'high',
      primarySymptoms: ['sulu_ishal', 'istahsizlik', 'gevis_durmasi', 'dis_gicirdatma'],
      description: 'Aşırı miktarda arpa, mısır veya unlu konsantre yemin aniden tüketilmesiyle rumende laktik asit patlaması ve mikrobiyal flora çöküşü.',
      immediateFirstAid: [
        'Önündeki tüm kesif/tane yemleri derhal kaldırın.',
        'Sadece kaliteli kuru ot veya saman verin.',
        'Suda eritilmiş 100-200g Sodyum Bikarbonat (yemek sodası) veya Magnezyum Oksiti mide sondası ile içirin.',
      ],
      contraindications: [
        'Hayvana şekerli su, melas veya unlu su kesinlikle vermeyin.',
      ],
      recommendedMedicationGroup: 'Rumen alkalileştiriciler (Sodyum Bikarbonat) + B1 Vitamini (Tiamin) + Karaciğer koruyucular.',
      followUpAdvice: 'Rasyon geçişlerini en az 10 güne yayarak kademeli yapın.',
    },
    {
      id: 'enterotoksemi',
      name: 'Enterotoksemi (Çelme Hastalığı / Yumuşak Böbrek)',
      species: 'sheep_goat',
      lifeStage: ['besi', 'yeni_dogum'],
      urgency: 'critical',
      primarySymptoms: ['kasintilar_titreme', 'bas_geriye', 'kopuklu_salya'],
      description: 'Clostridium perfringens toksinlerinin bağırsakta aşırı üremesi sonucu sinir sistemini vurması. Genellikle sürünün en gürbüz, en obur kuzularını aniden öldürür.',
      immediateFirstAid: [
        'Sürüdeki tüm kesif yem dağıtımını derhal yarı yarıya kesin.',
        'Kriz anındaki hayvana derhal antiseroterapik serum ve yüksek doz antibiyotik müdahalesi gerekir.',
      ],
      contraindications: [
        'Yem değişimlerini ani yapmayın.',
      ],
      recommendedMedicationGroup: 'Enterotoksemi Antiserumu + Yüksek doz Penisilin + Oral bağırsak antiseptikleri.',
      followUpAdvice: 'Tüm sürüye 6 ayda bir koruyucu karma aşı yaptırılması şarttır.',
    },
    {
      id: 'pnomoni',
      name: 'Enzootik Pnömoni (Zatürre / BRD)',
      species: 'all',
      urgency: 'high',
      primarySymptoms: ['hizli_nefes', 'oksuruk', 'yuksek_ates', 'istahsizlik'],
      description: 'Akciğer dokusunun bakteriyel/viral enfeksiyonu. Özellikle nakil, hava değişimi ve havasız nemli ahırlarda hızla yayılır.',
      immediateFirstAid: [
        'Hayvanı cereyansız, bol hava alan, kuru ve altlığı temiz izole bir bölmeye alın.',
        'Önüne temiz ılık su ve kaliteli ot koyun.',
      ],
      contraindications: [
        'Hayvanı nemli, amonyak kokulu basık ahırda tutmaya devam etmeyin.',
      ],
      recommendedMedicationGroup: 'Uzun etkili Florfenikol / Tulatromisin grubu antibiyotik + Flunixin Meglumine (ateş düşürücü).',
      followUpAdvice: 'Barınak havalandırmasını düzeltin ve aşı takvimini tamamlayın.',
    },
    {
      id: 'ketozis',
      name: 'Ketozis / Gebelik Toksikozu (İkiz Hastalığı)',
      species: 'all',
      lifeStage: ['gebe', 'laktasyon'],
      urgency: 'moderate',
      primarySymptoms: ['aseton_kokusu', 'istahsizlik', 'gevis_durmasi'],
      description: 'Negatif enerji dengesi nedeniyle vücut yağlarının kontrolsüz yakılması ve keton cisimciklerinin kana karışması.',
      immediateFirstAid: [
        'Günde 2 kez 250-300 ml Propilen Glikol içirin.',
        'İştahı açmak için melaslı kaliteli kuru ot verin.',
      ],
      contraindications: [
        'Doğum öncesi hayvanları aşırı yağlandırmaktan kaçının.',
      ],
      recommendedMedicationGroup: 'Propilen Glikol + İntravenöz Dekstroz (%30) + B Vitamini kompleksi.',
      followUpAdvice: 'Kuru dönem ve erken laktasyon rasyonunun enerji düzeyini artırın.',
    },
    {
      id: 'distosi',
      name: 'Doğum Güçlüğü (Distosi / Ters Doğum)',
      species: 'all',
      lifeStage: ['gebe'],
      urgency: 'critical',
      primarySymptoms: ['uzayan_dogum'],
      description: 'Yavrunun ters gelmesi, başın geride kalması veya kanal darlığı nedeniyle doğumun durması.',
      immediateFirstAid: [
        'Hijyenik kollarınızı dezenfekte edin, bol doğum kayganlaştırıcı jel kullanın.',
        'Yavrunun ayaklarının ön ayak mı arka ayak mı olduğunu tırnak tabanına bakarak tespit edin.',
      ],
      contraindications: [
        'Yavrunun pozisyonu düzeltilmeden asla traktörle veya aşırı güçle çekmeyin (rahim yırtılması ve yavru ölümü).',
      ],
      recommendedMedicationGroup: 'Uterin gevşetici spazmolitik + Oksitosin (sadece rahim ağzı tam açıksa!).',
      followUpAdvice: 'Düvelerde iri yavru veren damızlık tohum seçiminden kaçının.',
    },
  ];

  /**
   * Seçilen semptomlar ve hayvan profiline göre en uygun klinik triyaj eşleşmelerini bulur
   */
  evaluateTriage(
    selectedSymptomIds: string[],
    species: 'all' | 'cattle' | 'sheep_goat',
    lifeStage?: string
  ): TriageResult[] {
    if (selectedSymptomIds.length === 0) return [];

    const results: TriageResult[] = [];

    for (const scenario of this.clinicalKnowledgeBase) {
      // 1. Tür filtresi
      if (species !== 'all' && scenario.species !== 'all' && scenario.species !== species) {
        continue;
      }

      // 2. Yaşam evresi bonusu
      let stageBonus = 0;
      if (lifeStage && scenario.lifeStage && scenario.lifeStage.includes(lifeStage)) {
        stageBonus = 20;
      }

      // 3. Semptom eşleşmesi
      const matched = scenario.primarySymptoms.filter((s) => selectedSymptomIds.includes(s));
      if (matched.length === 0) continue;

      const baseScore = Math.round((matched.length / scenario.primarySymptoms.length) * 80);
      const totalScore = Math.min(100, baseScore + stageBonus);

      results.push({
        scenario,
        matchScore: totalScore,
        matchedSymptoms: matched,
      });
    }

    // Skora göre sırala
    return results.sort((a, b) => b.matchScore - a.matchScore);
  }
}
