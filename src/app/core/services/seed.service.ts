import { Injectable } from '@angular/core';
import {
  getFirestore,
  collection,
  doc,
  writeBatch,
  serverTimestamp,
  getDocs,
  limit,
  query,
} from 'firebase/firestore';

export interface SeedAnimalType {
  name: string;
  description: string;
  colorTheme: string;
}

export interface SeedBreed {
  name: string;
  category: 'kucukbas' | 'buyukbas' | 'kanatli' | 'diger';
  purpose: 'et' | 'sut' | 'kombine' | 'damizlik' | 'yontem' | 'diger';
  origin: string;
  description: string;
  colorTheme: string;
}

export interface SeedPaddock {
  name: string;
  capacity: number;
  description: string;
  colorTheme: string;
}

export interface SeedTreatmentType {
  name: string;
  description: string;
  colorTheme: string;
}

export interface SeedDisease {
  name: string;
  description: string;
  colorTheme: string;
}

export const DEFAULT_ANIMAL_TYPES: SeedAnimalType[] = [
  { name: 'Koyun', description: 'Küçükbaş dişi anaç koyun', colorTheme: 'indigo' },
  { name: 'Koç', description: 'Küçükbaş damızlık erkek koç', colorTheme: 'purple' },
  { name: 'Kuzu', description: '0-6 aylık küçükbaş kuzu yavrusu', colorTheme: 'emerald' },
  { name: 'Keçi', description: 'Küçükbaş dişi anaç keçi', colorTheme: 'amber' },
  { name: 'Teke', description: 'Küçükbaş damızlık erkek teke', colorTheme: 'purple' },
  { name: 'Oğlak', description: '0-6 aylık keçi yavrusu', colorTheme: 'emerald' },
  { name: 'İnek', description: 'Büyükbaş sağmal veya damızlık dişi sığır', colorTheme: 'indigo' },
  { name: 'Boğa', description: 'Büyükbaş damızlık erkek boğa', colorTheme: 'rose' },
  { name: 'Düve', description: 'İlk buzağısını doğurmamış genç dişi sığır', colorTheme: 'sky' },
  { name: 'Dana / Buzağı', description: 'Büyükbaş yavru ve genç besi hayvanı', colorTheme: 'amber' },
  { name: 'Manda', description: 'Yüksek yağ oranlı süt ve et verimi sağlayan manda', colorTheme: 'indigo' },
];

export const DEFAULT_BREEDS: SeedBreed[] = [
  // Küçükbaş
  {
    name: 'Merinos (Anadolu Merinosu)',
    category: 'kucukbas',
    purpose: 'kombine',
    origin: 'Türkiye / Bursa Karacabey',
    description: 'Yüksek kaliteli ince yapağı ve üstün et verimi sunan dayanıklı kombine koyun ırkı.',
    colorTheme: 'indigo',
  },
  {
    name: 'Akkaraman (Kangal)',
    category: 'kucukbas',
    purpose: 'kombine',
    origin: 'İç Anadolu (Sivas, Konya)',
    description: 'Yağlı kuyruklu, kurak ve sert kış iklimine dayanıklı, hastalıklara dirençli yerli ırk.',
    colorTheme: 'amber',
  },
  {
    name: 'İvesi (Awassi)',
    category: 'kucukbas',
    purpose: 'sut',
    origin: 'Güneydoğu Anadolu (Şanlıurfa)',
    description: 'Türkiye ve Orta Doğunun en yüksek süt verimli, sıcak iklime mükemmel uyumlu koyun ırkı.',
    colorTheme: 'emerald',
  },
  {
    name: 'Sakız',
    category: 'kucukbas',
    purpose: 'sut',
    origin: 'Ege Bölgesi (İzmir / Çeşme)',
    description: 'Yüksek döl verimi (ikizlik ve üçüzlük) ile bol süt veren narin ve verimli kıyı ırkı.',
    colorTheme: 'rose',
  },
  {
    name: 'Kıvırcık',
    category: 'kucukbas',
    purpose: 'et',
    origin: 'Marmara ve Trakya',
    description: 'İnce kuyruklu, Türkiye et pazarında lezzet ve kalitesi en çok aranan koyun ırkı.',
    colorTheme: 'purple',
  },
  {
    name: 'Kıl Keçisi (Kara Keçi)',
    category: 'kucukbas',
    purpose: 'kombine',
    origin: 'Türkiye Geneli (Toroslar)',
    description: 'Mera, funda ve çalı arazilerde otlama yeteneği mükemmel, son derece dirençli keçi ırkı.',
    colorTheme: 'sky',
  },
  {
    name: 'Saanen Keçisi',
    category: 'kucukbas',
    purpose: 'sut',
    origin: 'İsviçre / Türkiye Adaptasyonu',
    description: 'Yıllık 800-1000 kg üzeri süt verimi ve yüksek ikizlik oranı ile lider sütçü keçi ırkı.',
    colorTheme: 'emerald',
  },
  {
    name: 'Halep Keçisi (Şam / Damascus)',
    category: 'kucukbas',
    purpose: 'kombine',
    origin: 'Güneydoğu Anadolu & Akdeniz',
    description: 'Uysal mizaçlı, yüksek süt ve döl verimine sahip, sıcak iklime dayanıklı keçi ırkı.',
    colorTheme: 'amber',
  },
  {
    name: 'Dorper',
    category: 'kucukbas',
    purpose: 'et',
    origin: 'Güney Afrika',
    description: 'Kırkım gerektirmeyen, hızlı canlı ağırlık artışı ve yüksek karkas randımanlı etçi koyun ırkı.',
    colorTheme: 'rose',
  },
  // Büyükbaş
  {
    name: 'Simental (Fleckvieh)',
    category: 'buyukbas',
    purpose: 'kombine',
    origin: 'Avusturya / Almanya',
    description: 'Türkiye çiftliklerinde en yaygın kombine sığır ırkı; dengeli süt ve yüksek karkas verimi.',
    colorTheme: 'amber',
  },
  {
    name: 'Holstein (Siyah Alaca)',
    category: 'buyukbas',
    purpose: 'sut',
    origin: 'Hollanda / ABD',
    description: 'Endüstriyel süt hayvancılığının temel direği, dünyanın en yüksek süt verimli sığır ırkı.',
    colorTheme: 'indigo',
  },
  {
    name: 'Montofon (İsviçre Esmeri)',
    category: 'buyukbas',
    purpose: 'kombine',
    origin: 'İsviçre / Doğu Anadolu',
    description: 'Zorlu iklim koşullarına dayanıklı, protein ve yağ oranı zengin süt ile güçlü besi performansı.',
    colorTheme: 'purple',
  },
  {
    name: 'Angus (Aberdeen Angus)',
    category: 'buyukbas',
    purpose: 'et',
    origin: 'İskoçya',
    description: 'Mermerleşmiş lezzetli et yapısı, kolay doğum özelliği ve yüksek yem değerlendirme oranı.',
    colorTheme: 'rose',
  },
  {
    name: 'Şarole (Charolais)',
    category: 'buyukbas',
    purpose: 'et',
    origin: 'Fransa',
    description: 'İri cüsseli, üstün kas gelişimi ve yüksek karkas randımanı sağlayan saf etçi ırk.',
    colorTheme: 'sky',
  },
  {
    name: 'Yerli Kara',
    category: 'buyukbas',
    purpose: 'kombine',
    origin: 'İç Anadolu',
    description: 'Kanaatkar, kış soğuklarına ve yetersiz besleme koşullarına mükemmel dirençli yerli gen kaynağı.',
    colorTheme: 'emerald',
  },
];

export const DEFAULT_PADDOCKS: SeedPaddock[] = [
  {
    name: 'Doğum ve Anne-Yavru Padoğu',
    capacity: 20,
    description: 'Doğum yapacak ve yeni doğuran anaçlar ile yavruları için korunaklı ve temiz özel padok.',
    colorTheme: 'rose',
  },
  {
    name: 'Karantina ve Yeni Giriş Padoğu',
    capacity: 15,
    description: 'Çiftliğe dışarıdan yeni katılan veya hastalık şüphesi taşıyan hayvanların 21 günlük gözlem alanı.',
    colorTheme: 'amber',
  },
  {
    name: 'Besi ve Gelişim Padoğu A',
    capacity: 50,
    description: 'Yoğun besi rasyonu uygulanan toklu ve danalar için açık/yarı açık padok.',
    colorTheme: 'indigo',
  },
  {
    name: 'Besi ve Gelişim Padoğu B',
    capacity: 50,
    description: 'İkinci dönem besi grubu hayvan barınma ve gelişim alanı.',
    colorTheme: 'indigo',
  },
  {
    name: 'Koç & Damızlık Erkek Padoğu',
    capacity: 10,
    description: 'Aşım dönemi öncesi kondisyon takibi yapılan damızlık koç ve tekelerin özel padoğu.',
    colorTheme: 'purple',
  },
  {
    name: 'Revir ve Tedavi Padoğu',
    capacity: 10,
    description: 'İlaç uygulaması, yara bakımı ve nekahet sürecindeki hayvanların gözlem altında tutulduğu sakin bölüm.',
    colorTheme: 'emerald',
  },
  {
    name: 'Sağım Bekleme Padoğu',
    capacity: 40,
    description: 'Sağım ünitesine geçiş öncesi hayvanların toplandığı ve sağım sonrası dinlendiği alan.',
    colorTheme: 'sky',
  },
];

export const DEFAULT_TREATMENT_TYPES: SeedTreatmentType[] = [
  {
    name: 'Koruyucu Aşı',
    description: 'Şap, veba, enterotoksemi, agalaksi ve bruselloz gibi bulaşıcı hastalıklara karşı periyodik aşılama.',
    colorTheme: 'emerald',
  },
  {
    name: 'İç & Dış Parazit Uygulaması',
    description: 'Şerit, kelebek, kene, uyuz ve mide-bağırsak kıl kurtlarına karşı enjeksiyon, dökme veya oral ilaçlama.',
    colorTheme: 'amber',
  },
  {
    name: 'Antibiyotik & Enfeksiyon Tedavisi',
    description: 'Solunum yolu, meme ve eklem enfeksiyonlarına yönelik veteriner hekim reçeteli antibakteriyel sağaltım.',
    colorTheme: 'rose',
  },
  {
    name: 'Vitamin, Mineral & Destek',
    description: 'Selenyum, E vitamini, AD3E, kalsiyum ve fosfor takviyesi; yavru güçlendirme uygulamaları.',
    colorTheme: 'indigo',
  },
  {
    name: 'Tırnak Bakımı ve Ayak Tedavisi',
    description: 'Tırnak kesimi, ayak banyosu ve tırnak çürüğü (piyeten) lokal pansuman uygulamaları.',
    colorTheme: 'sky',
  },
  {
    name: 'Doğum & Jinekolojik Müdahale',
    description: 'Güç doğum yardımı, sonun atılamaması (retensiyo), rahim yıkama ve prolapsus müdahaleleri.',
    colorTheme: 'purple',
  },
  {
    name: 'Cerrahi & Operatif Müdahale',
    description: 'Boynuz köreltme, apse drenajı, fıtık ve yara dikiş operasyonları.',
    colorTheme: 'rose',
  },
];

export const DEFAULT_DISEASES: SeedDisease[] = [
  {
    name: 'Enterotoksemi (Çelerme / Yumuşak Böbrek)',
    description: 'Clostridium bakterilerinin aşırı yem veya rasyon değişimiyle toksin salgılaması sonucu ani ölüme yol açan tehlikeli metabolik-enfeksiyöz hastalık.',
    colorTheme: 'rose',
  },
  {
    name: 'Şap Hastalığı (Aphtae Epizooticae)',
    description: 'Ağız, meme ve tırnak aralarında veziküllere, yüksek ateş ve topallığa neden olan son derece bulaşıcı viral salgın.',
    colorTheme: 'rose',
  },
  {
    name: 'Mastitis (Meme İltihabı)',
    description: 'Süt veriminde ani düşüş, sütte pıhtılaşma, memede şişlik, kızarıklık ve sertlik ile seyreden bakteriyel meme hastalığı.',
    colorTheme: 'amber',
  },
  {
    name: 'Piyeten (Bulaşıcı Ayak Çürüğü)',
    description: 'Nemli ve kirli zeminlerde Dichelobacter nodosus kaynaklı tırnak yumuşaması, kötü koku ve şiddetli topallık.',
    colorTheme: 'amber',
  },
  {
    name: 'Pnömoni (Solunum Yolu Enfeksiyonu)',
    description: 'Hava akımı ve nem sonucu öksürük, burun akıntısı, solunum güçlüğü ve yüksek ateşle ortaya çıkan akciğer enfeksiyonu.',
    colorTheme: 'purple',
  },
  {
    name: 'Bruselloz (Yavru Atma)',
    description: 'Brucella cinsi bakterilerin neden olduğu, gebeliğin son döneminde yavru atmaya yol açan ve insana bulaşabilen (zoonoz) tehlikeli enfeksiyon.',
    colorTheme: 'rose',
  },
  {
    name: 'Çiçek Hastalığı (Koyun-Keçi Çiçeği)',
    description: 'Yünsüz bölgelerde, dudak, göz çevresi ve meme derisinde papül ve kabuklanmalarla karakterize viral hastalık.',
    colorTheme: 'amber',
  },
  {
    name: 'Ketozis (Gebelik Toksemisi)',
    description: 'Gebeliğin son aylarında yetersiz enerji alımına bağlı kanda keton cisimciklerinin birikmesiyle sinirsel belirti ve iştahsızlık.',
    colorTheme: 'indigo',
  },
  {
    name: 'Agalaksi (Süt Kesen)',
    description: 'Mycoplasma kaynaklı süt kesilmesi, memede atrofi, gözde körlük/kızarıklık ve eklem şişlikleri.',
    colorTheme: 'sky',
  },
  {
    name: 'İç Parazit Enfestasyonu (Fascioliasis / Nematodlar)',
    description: 'Karaciğer kelebeği ve mide-bağırsak kıl kurtları sonucu zayıflama, anemi (kansızlık) ve çene altı ödemi.',
    colorTheme: 'emerald',
  },
];

@Injectable({ providedIn: 'root' })
export class SeedService {
  private get db() {
    return getFirestore();
  }

  /**
   * Çiftliğe ait Hayvan Tipleri, Irklar, Padoklar, Tedavi Türleri ve Hastalıkları Firestore'a toplu (batch) olarak yükler.
   */
  async seedFarmDefaults(farmId: string): Promise<{ success: boolean; totalSeeded: number }> {
    if (!farmId) throw new Error('Geçersiz farmId');

    try {
      const batch = writeBatch(this.db);
      let count = 0;

      // 1. Hayvan Tipleri
      for (const item of DEFAULT_ANIMAL_TYPES) {
        const ref = doc(collection(this.db, `farms/${farmId}/animalTypes`));
        batch.set(ref, {
          ...item,
          deletedAt: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        count++;
      }

      // 2. Irklar
      for (const item of DEFAULT_BREEDS) {
        const ref = doc(collection(this.db, `farms/${farmId}/breeds`));
        batch.set(ref, {
          ...item,
          deletedAt: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        count++;
      }

      // 3. Padoklar
      for (const item of DEFAULT_PADDOCKS) {
        const ref = doc(collection(this.db, `farms/${farmId}/paddocks`));
        batch.set(ref, {
          ...item,
          deletedAt: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        count++;
      }

      // 4. Tedavi Türleri
      for (const item of DEFAULT_TREATMENT_TYPES) {
        const ref = doc(collection(this.db, `farms/${farmId}/treatmentTypes`));
        batch.set(ref, {
          ...item,
          deletedAt: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        count++;
      }

      // 5. Hastalıklar
      for (const item of DEFAULT_DISEASES) {
        const ref = doc(collection(this.db, `farms/${farmId}/diseases`));
        batch.set(ref, {
          ...item,
          deletedAt: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        count++;
      }

      await batch.commit();
      console.log(`[SeedService] ${count} adet varsayılan tanım çiftliğe (${farmId}) başarıyla yüklendi.`);
      return { success: true, totalSeeded: count };
    } catch (err) {
      console.error('[SeedService] Varsayılan kayıtlar yüklenirken hata:', err);
      return { success: false, totalSeeded: 0 };
    }
  }

  /**
   * Çiftliğin tanımları boş ise otomatik olarak tohumlar.
   */
  async checkAndSeedIfEmpty(farmId: string): Promise<boolean> {
    if (!farmId) return false;
    try {
      const typesSnap = await getDocs(query(collection(this.db, `farms/${farmId}/animalTypes`), limit(1)));
      if (typesSnap.empty) {
        const res = await this.seedFarmDefaults(farmId);
        return res.success;
      }
      return false;
    } catch (err) {
      console.warn('[SeedService] checkAndSeedIfEmpty kontrol hatası:', err);
      return false;
    }
  }
}
