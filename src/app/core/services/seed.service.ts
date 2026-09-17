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

export interface SeedHerd {
  name: string;
}

export interface SeedWarehouse {
  name: string;
  location?: string;
}

export interface SeedStockCategory {
  name: string;
  kind?: 'yem' | 'sarf' | 'ilac' | 'diger';
  description?: string;
  colorTheme?: string;
}

export interface SeedAccountingItem {
  name: string;
  type: 'gelir' | 'gider';
}

export interface SeedDeathReason {
  name: string;
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

export const DEFAULT_HERDS: SeedHerd[] = [
  { name: 'Ana Damızlık Sürüsü' },
];

export const DEFAULT_WAREHOUSES: SeedWarehouse[] = [
  { name: 'Ana Yem Ambarı', location: 'Merkez Tesis' },
  { name: 'Ecza & İlaç Deposu', location: 'Klinik / Revir Bölümü' },
];

export const DEFAULT_STOCK_CATEGORIES: SeedStockCategory[] = [
  { name: 'Kaba Yem', kind: 'yem', description: 'Yonca, saman, silaj ve kuru otlar', colorTheme: 'amber' },
  { name: 'Kesif Yem', kind: 'yem', description: 'Fabrika pelet yemleri, arpa, mısır ve kepek', colorTheme: 'indigo' },
  { name: 'Aşı & İlaç', kind: 'ilac', description: 'Koruyucu aşılar, antibiyotikler ve vitaminler', colorTheme: 'rose' },
  { name: 'Sarf Malzeme', kind: 'sarf', description: 'Enjektör, küpe, dezenfektan ve bakım ürünleri', colorTheme: 'sky' },
];

export const DEFAULT_ACCOUNTING_ITEMS: SeedAccountingItem[] = [
  { name: 'Hayvan Satışı', type: 'gelir' },
  { name: 'Süt Satışı', type: 'gelir' },
  { name: 'Yem Gideri', type: 'gider' },
  { name: 'Veterinerlik & İlaç', type: 'gider' },
  { name: 'Genel Çiftlik Masrafları', type: 'gider' },
];

export const DEFAULT_DEATH_REASONS: SeedDeathReason[] = [
  { name: 'Zatürre (Pnömoni)' },
  { name: 'Enterotoksemi (Çelerme)' },
  { name: 'Doğum Komplikasyonu' },
  { name: 'Kaza / Yaralanma' },
  { name: 'Yaşlılık' },
];

export const DEFAULT_ANIMAL_TYPES_EN: SeedAnimalType[] = [
  { name: 'Sheep', description: 'Adult female sheep (ewe)', colorTheme: 'indigo' },
  { name: 'Ram', description: 'Adult breeding male ram', colorTheme: 'purple' },
  { name: 'Lamb', description: '0-6 months young lamb', colorTheme: 'emerald' },
  { name: 'Goat', description: 'Adult female goat (doe/nanny)', colorTheme: 'amber' },
  { name: 'Buck', description: 'Adult breeding male goat (billy)', colorTheme: 'purple' },
  { name: 'Kid', description: '0-6 months young goat', colorTheme: 'emerald' },
  { name: 'Cow', description: 'Adult female dairy or breeding cattle', colorTheme: 'indigo' },
  { name: 'Bull', description: 'Adult breeding male bull', colorTheme: 'rose' },
  { name: 'Heifer', description: 'Young female cattle before first calving', colorTheme: 'sky' },
  { name: 'Calf / Steer', description: 'Young calf or fattening cattle', colorTheme: 'amber' },
  { name: 'Water Buffalo', description: 'High butterfat milk and beef producing water buffalo', colorTheme: 'indigo' },
];

export const DEFAULT_BREEDS_EN: SeedBreed[] = [
  {
    name: 'Merino',
    category: 'kucukbas',
    purpose: 'kombine',
    origin: 'Australia / Spain',
    description: 'World-renowned for premium ultra-fine wool and high-yield meat production.',
    colorTheme: 'indigo',
  },
  {
    name: 'Awassi',
    category: 'kucukbas',
    purpose: 'sut',
    origin: 'Middle East',
    description: 'Fat-tailed dairy sheep breed with exceptional milk yield and heat tolerance.',
    colorTheme: 'emerald',
  },
  {
    name: 'Dorper',
    category: 'kucukbas',
    purpose: 'et',
    origin: 'South Africa',
    description: 'Fast-growing, non-shearing meat sheep breed with high carcass yield.',
    colorTheme: 'rose',
  },
  {
    name: 'Saanen Goat',
    category: 'kucukbas',
    purpose: 'sut',
    origin: 'Switzerland',
    description: 'Top-producing commercial dairy goat breed with high prolificacy and docile nature.',
    colorTheme: 'emerald',
  },
  {
    name: 'Boer Goat',
    category: 'kucukbas',
    purpose: 'et',
    origin: 'South Africa',
    description: 'Premier meat goat breed known for fast growth, muscular build, and hardiness.',
    colorTheme: 'rose',
  },
  {
    name: 'Damascus Goat (Shami)',
    category: 'kucukbas',
    purpose: 'kombine',
    origin: 'Near East',
    description: 'Dual-purpose high milk and prolific reproduction goat adapted to arid regions.',
    colorTheme: 'amber',
  },
  {
    name: 'Holstein Friesian',
    category: 'buyukbas',
    purpose: 'sut',
    origin: 'Netherlands / USA',
    description: 'The highest-producing dairy cattle breed in the world, ideal for commercial milk operations.',
    colorTheme: 'indigo',
  },
  {
    name: 'Simmental (Fleckvieh)',
    category: 'buyukbas',
    purpose: 'kombine',
    origin: 'Switzerland / Germany / Austria',
    description: 'World-leading dual-purpose breed excelling in milk production and beef carcass quality.',
    colorTheme: 'amber',
  },
  {
    name: 'Aberdeen Angus',
    category: 'buyukbas',
    purpose: 'et',
    origin: 'Scotland',
    description: 'Exceptional marbled beef, easy calving, superior feed efficiency, and polled genetics.',
    colorTheme: 'rose',
  },
  {
    name: 'Charolais',
    category: 'buyukbas',
    purpose: 'et',
    origin: 'France',
    description: 'Large-framed heavy beef cattle known for exceptional muscle development and high growth rates.',
    colorTheme: 'sky',
  },
  {
    name: 'Brown Swiss (Braunvieh)',
    category: 'buyukbas',
    purpose: 'kombine',
    origin: 'Switzerland',
    description: 'Robust dairy and beef cattle with high milk protein and fat, optimal for cheese production.',
    colorTheme: 'purple',
  },
  {
    name: 'Hereford',
    category: 'buyukbas',
    purpose: 'et',
    origin: 'United Kingdom',
    description: 'Docile, hardy beef cattle thriving on pasture with excellent foraging ability.',
    colorTheme: 'emerald',
  },
];

export const DEFAULT_PADDOCKS_EN: SeedPaddock[] = [
  {
    name: 'Maternity & Nursery Paddock',
    capacity: 20,
    description: 'Safe, warm, and hygienic area dedicated to expectant dams and newborn offspring.',
    colorTheme: 'rose',
  },
  {
    name: 'Quarantine & Intake Paddock',
    capacity: 15,
    description: '21-day observation isolation facility for incoming animals and bio-security screening.',
    colorTheme: 'amber',
  },
  {
    name: 'Fattening & Growth Paddock A',
    capacity: 50,
    description: 'Intensive nutrition and high-growth feedlot paddock for growing stock.',
    colorTheme: 'indigo',
  },
  {
    name: 'Fattening & Growth Paddock B',
    capacity: 50,
    description: 'Secondary stage feeding and conditioning pen.',
    colorTheme: 'indigo',
  },
  {
    name: 'Breeding Male Paddock',
    capacity: 10,
    description: 'Dedicated pen for breeding rams, bucks, and bulls to maintain top condition.',
    colorTheme: 'purple',
  },
  {
    name: 'Infirmary & Treatment Paddock',
    capacity: 10,
    description: 'Quiet convalescence ward for clinical monitoring, medication, and wound recovery.',
    colorTheme: 'emerald',
  },
  {
    name: 'Milking Holding Paddock',
    capacity: 40,
    description: 'Pre-milking staging pen and post-milking recovery holding yard.',
    colorTheme: 'sky',
  },
];

export const DEFAULT_TREATMENT_TYPES_EN: SeedTreatmentType[] = [
  {
    name: 'Preventive Vaccination',
    description: 'Scheduled immunization against clostridial diseases, foot-and-mouth, and respiratory pathogens.',
    colorTheme: 'emerald',
  },
  {
    name: 'Internal & External Parasite Control',
    description: 'Deworming, pour-on treatments, dipping, and parasitic pest control.',
    colorTheme: 'amber',
  },
  {
    name: 'Antibiotics & Infection Therapy',
    description: 'Veterinary prescribed antimicrobial courses for respiratory, udder, or systemic infections.',
    colorTheme: 'rose',
  },
  {
    name: 'Vitamins & Mineral Supplements',
    description: 'Injectable or oral selenium, vitamins AD3E, calcium borogluconate, and trace minerals.',
    colorTheme: 'indigo',
  },
  {
    name: 'Hoof Care & Footbath Treatment',
    description: 'Hoof trimming, copper sulfate footbaths, and topical wound dressing.',
    colorTheme: 'sky',
  },
  {
    name: 'Obstetric & Reproductive Care',
    description: 'Dystocia assistance, uterine flush, postpartum monitoring, and prolapse interventions.',
    colorTheme: 'purple',
  },
  {
    name: 'Surgical & Minor Procedures',
    description: 'Disbudding, abscess drainage, hernia repair, and wound suturing.',
    colorTheme: 'rose',
  },
];

export const DEFAULT_DISEASES_EN: SeedDisease[] = [
  {
    name: 'Enterotoxemia (Pulpy Kidney)',
    description: 'Acute clostridial toxemia caused by sudden dietary change or rich carbohydrate intake.',
    colorTheme: 'rose',
  },
  {
    name: 'Foot and Mouth Disease (FMD)',
    description: 'Highly contagious viral infection causing oral and foot vesicles, high fever, and lameness.',
    colorTheme: 'rose',
  },
  {
    name: 'Mastitis (Udder Inflammation)',
    description: 'Bacterial infection of mammary tissue leading to clotted milk, swelling, and production drop.',
    colorTheme: 'amber',
  },
  {
    name: 'Foot Rot (Contagious Ovine Digital Dermatitis)',
    description: 'Severe bacterial hoof infection in wet conditions causing foul odor and painful lameness.',
    colorTheme: 'amber',
  },
  {
    name: 'Pneumonia / Bovine Respiratory Disease (BRD)',
    description: 'Respiratory infection causing coughing, nasal discharge, dyspnea, and fever.',
    colorTheme: 'purple',
  },
  {
    name: 'Brucellosis',
    description: 'Zoonotic bacterial infection causing late-term abortions and reproductive failure.',
    colorTheme: 'rose',
  },
  {
    name: 'Contagious Ecthyma (Orf / Sore Mouth)',
    description: 'Parapoxvirus infection producing scabs and pustules around lips, nostrils, and teats.',
    colorTheme: 'amber',
  },
  {
    name: 'Pregnancy Toxemia (Ketosis)',
    description: 'Metabolic energy deficit in late gestation characterized by hypoglycemia and ketone buildup.',
    colorTheme: 'indigo',
  },
  {
    name: 'Contagious Agalactia',
    description: 'Mycoplasma disease causing sudden cessation of milk, mastitis, arthritis, and keratitis.',
    colorTheme: 'sky',
  },
  {
    name: 'Liver Fluke & Nematode Infection',
    description: 'Fascioliasis and gastrointestinal helminthiasis causing wasting, anemia, and bottle jaw.',
    colorTheme: 'emerald',
  },
];

export const DEFAULT_HERDS_EN: SeedHerd[] = [
  { name: 'Main Breeding Herd' },
];

export const DEFAULT_WAREHOUSES_EN: SeedWarehouse[] = [
  { name: 'Main Feed Storage', location: 'Central Facility' },
  { name: 'Veterinary Pharmacy & Clinic', location: 'Infirmary Section' },
];

export const DEFAULT_STOCK_CATEGORIES_EN: SeedStockCategory[] = [
  { name: 'Roughage / Forage', kind: 'yem', description: 'Alfalfa, hay, silage, and straw', colorTheme: 'amber' },
  { name: 'Concentrate Feed', kind: 'yem', description: 'Pellet feed, barley, corn, and grain mix', colorTheme: 'indigo' },
  { name: 'Vaccines & Medication', kind: 'ilac', description: 'Vaccines, antibiotics, vitamins, and clinical drugs', colorTheme: 'rose' },
  { name: 'Farm Supplies & Consumables', kind: 'sarf', description: 'Syringes, ear tags, disinfectants, and hygiene items', colorTheme: 'sky' },
];

export const DEFAULT_ACCOUNTING_ITEMS_EN: SeedAccountingItem[] = [
  { name: 'Livestock Sales', type: 'gelir' },
  { name: 'Milk & Dairy Sales', type: 'gelir' },
  { name: 'Feed & Ration Expense', type: 'gider' },
  { name: 'Veterinary & Medicine Expense', type: 'gider' },
  { name: 'General Farm Utilities', type: 'gider' },
];

export const DEFAULT_DEATH_REASONS_EN: SeedDeathReason[] = [
  { name: 'Pneumonia / Respiratory Failure' },
  { name: 'Enterotoxemia' },
  { name: 'Dystocia / Birth Complications' },
  { name: 'Trauma / Accident' },
  { name: 'Senility / Natural Causes' },
];

/* ==========================================================================
   GERMAN (DE) DEFAULT SEED DATA
   ========================================================================== */
export const DEFAULT_ANIMAL_TYPES_DE: SeedAnimalType[] = [
  { name: 'Schaf (Mutterschaf)', description: 'Weibliches ausgewachsenes Schaf', colorTheme: 'indigo' },
  { name: 'Widder', description: 'Männlicher Zuchtwidder', colorTheme: 'purple' },
  { name: 'Lamm', description: '0-6 Monate altes Lamm', colorTheme: 'emerald' },
  { name: 'Ziege (Mutterziege)', description: 'Weibliche erwachsene Ziege', colorTheme: 'amber' },
  { name: 'Ziegenbock', description: 'Männlicher Zuchtbock', colorTheme: 'purple' },
  { name: 'Zicklein (Kitz)', description: '0-6 Monate altes Ziegenkitz', colorTheme: 'emerald' },
  { name: 'Kuh', description: 'Ausgewachsene Milch- oder Mutterkuh', colorTheme: 'indigo' },
  { name: 'Bulle (Zuchtbulle)', description: 'Ausgewachsener Deck- und Zuchtbulle', colorTheme: 'rose' },
  { name: 'Färse', description: 'Weibliches Jungrind vor der ersten Kalbung', colorTheme: 'sky' },
  { name: 'Kalb / Jungrind', description: 'Jungrind oder Mastkalb', colorTheme: 'amber' },
  { name: 'Wasserbüffel', description: 'Wasserbüffel für hochwertige Milch- und Fleischproduktion', colorTheme: 'indigo' },
];

export const DEFAULT_BREEDS_DE: SeedBreed[] = [
  { name: 'Simmental (Fleckvieh)', category: 'buyukbas', purpose: 'kombine', origin: 'Deutschland / Österreich', description: 'Führende Zweinutzungsrasse mit erstklassiger Milch- und Fleischleistung.', colorTheme: 'amber' },
  { name: 'Holstein-Schwarzbunt', category: 'buyukbas', purpose: 'sut', origin: 'Deutschland / Niederlande', description: 'Höchste Milchleistung weltweit, ideal für professionelle Milcherzeugung.', colorTheme: 'indigo' },
  { name: 'Braunvieh', category: 'buyukbas', purpose: 'kombine', origin: 'Deutschland / Schweiz', description: 'Sehr langlebig und robust, eiweißreiche Milch für die Käserei.', colorTheme: 'purple' },
  { name: 'Angus', category: 'buyukbas', purpose: 'et', origin: 'Schottland / Deutschland', description: 'Hervorragende Fleischmarmorierung, leichtkalbig und anspruchslos.', colorTheme: 'rose' },
  { name: 'Merinolandschaf', category: 'kucukbas', purpose: 'kombine', origin: 'Deutschland', description: 'Wirtschaftlichste deutsche Schafrasse mit feiner Wolle und bestem Fleischansatz.', colorTheme: 'indigo' },
  { name: 'Ostfriesisches Milchschaf', category: 'kucukbas', purpose: 'sut', origin: 'Deutschland (Ostfriesland)', description: 'Höchste Milchleistung unter den Schafrassen, sehr fruchtbar.', colorTheme: 'emerald' },
  { name: 'Weiße Deutsche Edelziege (Saanen)', category: 'kucukbas', purpose: 'sut', origin: 'Deutschland / Schweiz', description: 'Führende Milchziegenrasse mit enormer Leistungsbereitschaft.', colorTheme: 'emerald' },
  { name: 'Burenziege', category: 'kucukbas', purpose: 'et', origin: 'Südafrika / Europa', description: 'Reine Fleischziegenrasse mit starker Bemuskelung und hoher Vitalität.', colorTheme: 'rose' },
];

export const DEFAULT_PADDOCKS_DE: SeedPaddock[] = [
  { name: 'Abkalbe- & Muttertierbucht', capacity: 20, description: 'Geschützter und hygienischer Bereich für hochtragende Tiere und Neugeborene.', colorTheme: 'rose' },
  { name: 'Quarantäne- & Ankunftsbucht', capacity: 15, description: 'Isolationsbereich zur 21-tägigen Gesundheitsüberwachung von Neuzugängen.', colorTheme: 'amber' },
  { name: 'Mast- & Aufzuchtbucht A', capacity: 50, description: 'Laufstallbereich für die intensive Bullen- und Lammermast.', colorTheme: 'indigo' },
  { name: 'Zuchtbock- & Bullenbucht', capacity: 10, description: 'Separierter Bereich für Zuchttiere vor der Decksaison.', colorTheme: 'purple' },
  { name: 'Krankenbucht & Behandlung', capacity: 10, description: 'Ruhiger Beobachtungs- und Erholungsbereich für medizinische Betreuung.', colorTheme: 'emerald' },
  { name: 'Melkwarteraum', capacity: 40, description: 'Wartehof vor dem Melkstand und Sammelbereich nach dem Melken.', colorTheme: 'sky' },
];

export const DEFAULT_TREATMENT_TYPES_DE: SeedTreatmentType[] = [
  { name: 'Schutzimpfung', description: 'Regelmäßige Immunisierung gegen Clostridien, MKS, BVD und Atemwegserreger.', colorTheme: 'emerald' },
  { name: 'Parasitenbekämpfung (Innen & Außen)', description: 'Entwurmung, Pour-On-Behandlung und Ektoparasitenprophylaxe.', colorTheme: 'amber' },
  { name: 'Antibiotika & Infektionsbehandlung', description: 'Tierärztlich verordnete antibakterielle Therapie bei Infektionen.', colorTheme: 'rose' },
  { name: 'Vitamine, Mineralstoffe & Boli', description: 'Gezielte Supplementierung von Selen, Vitamin AD3E und Calcium.', colorTheme: 'indigo' },
  { name: 'Klauenpflege & Fußbad', description: 'Regelmäßiger Klauenschnitt und desinfizierende Klauenbäder.', colorTheme: 'sky' },
  { name: 'Geburtshilfe & Gynäkologie', description: 'Unterstützung bei Schwergeburten und Nachgeburtsbehandlung.', colorTheme: 'purple' },
];

export const DEFAULT_DISEASES_DE: SeedDisease[] = [
  { name: 'Enterotoxämie (Breinierenkrankheit)', description: 'Clostridien-Toxikose infolge plötzlicher Futterumstellung mit akuter Todesfolge.', colorTheme: 'rose' },
  { name: 'Maul- und Klauenseuche (MKS)', description: 'Hochentzündliche virale Seuche mit Bläschenbildung an Zunge, Klauen und Euter.', colorTheme: 'rose' },
  { name: 'Mastitis (Euterentzündung)', description: 'Bakterielle Infektion des Eutergewebes mit Flockenbildung und Milchabfall.', colorTheme: 'amber' },
  { name: 'Moderhinke (Panaritium)', description: 'Bakterielle Klauenfäule bei feuchten Haltungsbedingungen mit starker Lahmheit.', colorTheme: 'amber' },
  { name: 'Pneumonie (Enzootische Bronchopneumonie)', description: 'Infektion der Atemwege mit Husten, Nasenausfluss und Fieber.', colorTheme: 'purple' },
  { name: 'Ketose (Trächtigkeitstoxikose)', description: 'Energiemangelstoffwechsel mit Ketonkörperbildung im Blut.', colorTheme: 'indigo' },
];

export const DEFAULT_HERDS_DE: SeedHerd[] = [{ name: 'Hauptzuchtherde' }];
export const DEFAULT_WAREHOUSES_DE: SeedWarehouse[] = [
  { name: 'Hauptfuttermittellager', location: 'Zentrallager' },
  { name: 'Tierarznei- & Medikamentendepot', location: 'Praxisstation' },
];
export const DEFAULT_STOCK_CATEGORIES_DE: SeedStockCategory[] = [
  { name: 'Raufutter', kind: 'yem', description: 'Heu, Luzerne, Silage und Stroh', colorTheme: 'amber' },
  { name: 'Kraftfutter', kind: 'yem', description: 'Pellets, Getreide, Mais und Schrot', colorTheme: 'indigo' },
  { name: 'Tierarzneimittel', kind: 'ilac', description: 'Impfstoffe, Antibiotika und Vitamine', colorTheme: 'rose' },
  { name: 'Betriebs- & Verbrauchsmaterial', kind: 'sarf', description: 'Ohrmarken, Spritzen, Desinfektionsmittel', colorTheme: 'sky' },
];
export const DEFAULT_ACCOUNTING_ITEMS_DE: SeedAccountingItem[] = [
  { name: 'Viehverkauf', type: 'gelir' },
  { name: 'Milchgeld / Milchverkauf', type: 'gelir' },
  { name: 'Futtermittelkosten', type: 'gider' },
  { name: 'Tierarzt & Besamung', type: 'gider' },
  { name: 'Betriebskosten & Instandhaltung', type: 'gider' },
];
export const DEFAULT_DEATH_REASONS_DE: SeedDeathReason[] = [
  { name: 'Lungenentzündung (Pneumonie)' },
  { name: 'Enterotoxämie' },
  { name: 'Geburtskomplikation' },
  { name: 'Unfall / Verletzung' },
  { name: 'Altersschwäche' },
];

/* ==========================================================================
   DUTCH (NL) DEFAULT SEED DATA
   ========================================================================== */
export const DEFAULT_ANIMAL_TYPES_NL: SeedAnimalType[] = [
  { name: 'Ooi (Schaap)', description: 'Volwassen vrouwelijk schaap', colorTheme: 'indigo' },
  { name: 'Ram', description: 'Mannelijke fokram', colorTheme: 'purple' },
  { name: 'Lam', description: '0-6 maanden oud lam', colorTheme: 'emerald' },
  { name: 'Geit (Moedergeit)', description: 'Volwassen vrouwelijke geit', colorTheme: 'amber' },
  { name: 'Bok (Dekbok)', description: 'Mannelijke dekbok', colorTheme: 'purple' },
  { name: 'Geitenlam', description: '0-6 maanden oud geitenlammetje', colorTheme: 'emerald' },
  { name: 'Koe', description: 'Volwassen melk- of zoogkoe', colorTheme: 'indigo' },
  { name: 'Stier (Dekstier)', description: 'Volwassen dekstier', colorTheme: 'rose' },
  { name: 'Vaars', description: 'Jong rund voor de eerste afkalving', colorTheme: 'sky' },
  { name: 'Kalf / Jongvee', description: 'Kalf of vleesrund in opfok', colorTheme: 'amber' },
  { name: 'Waterbuffel', description: 'Waterbuffel voor mozzarella en vleesproductie', colorTheme: 'indigo' },
];

export const DEFAULT_BREEDS_NL: SeedBreed[] = [
  { name: 'Holstein-Friesian', category: 'buyukbas', purpose: 'sut', origin: 'Nederland', description: 's Werelds meest productieve melkveerastype, oorspronkelijk uit Friesland.', colorTheme: 'indigo' },
  { name: 'Texelaar', category: 'kucukbas', purpose: 'et', origin: 'Nederland (Texel)', description: 'Beroemd Nederlands vleesschaap met uitstekende bespiering en wol.', colorTheme: 'rose' },
  { name: 'Belgisch Witblauw', category: 'buyukbas', purpose: 'et', origin: 'België / Nederland', description: 'Uitzonderlijke dikbil-vleesontwikkeling met hoog slachtrendement.', colorTheme: 'sky' },
  { name: 'Witte Nederlandse Melkgeit', category: 'kucukbas', purpose: 'sut', origin: 'Nederland', description: 'Toonaangevend melkgeitenras met hoge melkgift en rustig karakter.', colorTheme: 'emerald' },
  { name: 'Zwartbles', category: 'kucukbas', purpose: 'kombine', origin: 'Nederland', description: 'Vriendelijk melk- en vleesschaap, bekend om goede moedereigenschappen.', colorTheme: 'amber' },
];

export const DEFAULT_PADDOCKS_NL: SeedPaddock[] = [
  { name: 'Afkalf- & Kraamboeg', capacity: 20, description: 'Schone en beschermde ruimte voor drachtige dieren en pasgeborenen.', colorTheme: 'rose' },
  { name: 'Quarantaine- & Instroombox', capacity: 15, description: '21-daagse observatiestal voor nieuwe dieren en bioveiligheid.', colorTheme: 'amber' },
  { name: 'Afmestgroep A', capacity: 50, description: 'Intensieve voer- en afmestruimte voor vleesvee en lammeren.', colorTheme: 'indigo' },
  { name: 'Dekrammen- & Stierenverblijf', capacity: 10, description: 'Speciaal verblijf voor dekdieren in topconditie.', colorTheme: 'purple' },
  { name: 'Ziekenboeg & Behandelbox', capacity: 10, description: 'Rustige afdeling voor zieke dieren en medische verzorging.', colorTheme: 'emerald' },
  { name: 'Melkwachtruimte', capacity: 40, description: 'Verzamelruimte voorafgaand aan en na afloop van het melken.', colorTheme: 'sky' },
];

export const DEFAULT_TREATMENT_TYPES_NL: SeedTreatmentType[] = [
  { name: 'Preventieve vaccinatie', description: 'Routinematige inenting tegen clostridia, blauwtong en ademhalingsinfecties.', colorTheme: 'emerald' },
  { name: 'Parasietenbestrijding', description: 'Ontworming, pour-on behandelingen en schurftbestrijding.', colorTheme: 'amber' },
  { name: 'Antibiotica & Infectiebehandeling', description: 'Dierenarts-voorgeschreven antibacteriële behandeling bij ontstekingen.', colorTheme: 'rose' },
  { name: 'Vitaminen, Mineralen & Bolussen', description: 'Toediening van selenium, calcium en vitaminen AD3E.', colorTheme: 'indigo' },
  { name: 'Klauwverzorging & Voetbad', description: 'Klauwbekappen en ontsmettende voetbaden tegen rotkreupel en mortellaro.', colorTheme: 'sky' },
  { name: 'Verloskunde & Nazorg', description: 'Hulp bij zware geboortes en baarmoederspoeling.', colorTheme: 'purple' },
];

export const DEFAULT_DISEASES_NL: SeedDisease[] = [
  { name: 'Enterotoxemie (Het Bloed)', description: 'Acute clostridiumintoxicatie door plotselinge voerwisseling met plotselinge sterfte.', colorTheme: 'rose' },
  { name: 'Mond-en-klauwzeer (MKZ)', description: 'Zeer besmettelijke virusziekte met blaren op bek, klauwen en uiers.', colorTheme: 'rose' },
  { name: 'Mastitis (Uierontsteking)', description: 'Bacteriële infectie van uierweefsel met vlokkerige melk en productiedaling.', colorTheme: 'amber' },
  { name: 'Rotkreupel', description: 'Bacteriële klauwontsteking met kreupelheid en onaangename geur.', colorTheme: 'amber' },
  { name: 'Longontsteking (Pneumonie)', description: 'Luchtweginfectie met hoesten, neusuitvloeiing en koorts.', colorTheme: 'purple' },
  { name: 'Drachtigheidstoxemie (Slepende Melkziekte)', description: 'Energiestoornis in het late stadium van de dracht door ketonenophoping.', colorTheme: 'indigo' },
];

export const DEFAULT_HERDS_NL: SeedHerd[] = [{ name: 'Hoofdfokkudde' }];
export const DEFAULT_WAREHOUSES_NL: SeedWarehouse[] = [
  { name: 'Hoofdruwvoeropslag', location: 'Centraal Terrein' },
  { name: 'Veterinaire Apotheek & Depot', location: 'Kliniek Afdeling' },
];
export const DEFAULT_STOCK_CATEGORIES_NL: SeedStockCategory[] = [
  { name: 'Ruwvoer', kind: 'yem', description: 'Kuilgras, hooi, luzerne en stro', colorTheme: 'amber' },
  { name: 'Krachtvoer', kind: 'yem', description: 'Pellets, brok, granen en mais', colorTheme: 'indigo' },
  { name: 'Diergeneesmiddelen & Vaccins', kind: 'ilac', description: 'Vaccins, antibiotica en injectables', colorTheme: 'rose' },
  { name: 'Verbruiksartikelen & Hygiëne', kind: 'sarf', description: 'Oormerken, spuiten en ontsmettingsmiddelen', colorTheme: 'sky' },
];
export const DEFAULT_ACCOUNTING_ITEMS_NL: SeedAccountingItem[] = [
  { name: 'Vee- & Dierenverkoop', type: 'gelir' },
  { name: 'Melkopbrengst', type: 'gelir' },
  { name: 'Voerkosten', type: 'gider' },
  { name: 'Veearts & Medicatie', type: 'gider' },
  { name: 'Algemene Exploitatiekosten', type: 'gider' },
];
export const DEFAULT_DEATH_REASONS_NL: SeedDeathReason[] = [
  { name: 'Longontsteking' },
  { name: 'Enterotoxemie' },
  { name: 'Geboortecomplicatie' },
  { name: 'Ongeval / Letsel' },
  { name: 'Ouderdom' },
];

/* ==========================================================================
   RUSSIAN (RU) DEFAULT SEED DATA
   ========================================================================== */
export const DEFAULT_ANIMAL_TYPES_RU: SeedAnimalType[] = [
  { name: 'Овцематка', description: 'Взрослая овца репродуктивного возраста', colorTheme: 'indigo' },
  { name: 'Баран-производитель', description: 'Племенной самец баран', colorTheme: 'purple' },
  { name: 'Ягнёнок', description: 'Молодняк овец в возрасте 0-6 месяцев', colorTheme: 'emerald' },
  { name: 'Козоматка', description: 'Взрослая дойная или племенная коза', colorTheme: 'amber' },
  { name: 'Козёл-производитель', description: 'Племенной самец козёл', colorTheme: 'purple' },
  { name: 'Козлёнок', description: 'Молодняк коз в возрасте 0-6 месяцев', colorTheme: 'emerald' },
  { name: 'Корова', description: 'Дойная или фуражная взрослая корова', colorTheme: 'indigo' },
  { name: 'Бык-производитель', description: 'Племенной производитель крупного рогатого скота', colorTheme: 'rose' },
  { name: 'Нетель', description: 'Оплодотворённая тёлка до первого отёла', colorTheme: 'sky' },
  { name: 'Телёнок / Молодняк', description: 'Молодняк КРС на доращивании и откорме', colorTheme: 'amber' },
  { name: 'Буйвол', description: 'Высокопродуктивный буйвол для молока и мяса', colorTheme: 'indigo' },
];

export const DEFAULT_BREEDS_RU: SeedBreed[] = [
  { name: 'Голштинская (Черно-пёстрая)', category: 'buyukbas', purpose: 'sut', origin: 'Нидерланды / США / Россия', description: 'Мировой лидер по надоям молока, основа промышленного молочного скотоводства.', colorTheme: 'indigo' },
  { name: 'Симментальская', category: 'buyukbas', purpose: 'kombine', origin: 'Швейцария / Россия', description: 'Универсальная мясо-молочная порода с отличным качеством мяса и выносливостью.', colorTheme: 'amber' },
  { name: 'Абердин-ангусская', category: 'buyukbas', purpose: 'et', origin: 'Шотландия', description: 'Эталон мраморной говядины, лёгкие отёлы и высокая конверсия корма.', colorTheme: 'rose' },
  { name: 'Меринос', category: 'kucukbas', purpose: 'kombine', origin: 'Россия / Австралия', description: 'Тонкорунная овца высшего класса с отличными мясными кондициями.', colorTheme: 'indigo' },
  { name: 'Эдильбаевская порода', category: 'kucukbas', purpose: 'et', origin: 'Казахстан / Россия', description: 'Крупная курдючная овца, неприхотливая к суровым климатическим условиям.', colorTheme: 'amber' },
  { name: 'Зааненская коза', category: 'kucukbas', purpose: 'sut', origin: 'Швейцария', description: 'Высокоудойная молочная коза с высокими показателями плодовитости.', colorTheme: 'emerald' },
];

export const DEFAULT_PADDOCKS_RU: SeedPaddock[] = [
  { name: 'Родильное отделение и ясли', capacity: 20, description: 'Тёплый защищённый бокс для глубокостельных животных и новорождённых.', colorTheme: 'rose' },
  { name: 'Карантинный изолятор', capacity: 15, description: 'Зона 21-дневного карантинирования вновь прибывшего поголовья.', colorTheme: 'amber' },
  { name: 'Откормочный загон А', capacity: 50, description: 'Загон для интенсивного откорма бычков и ягнят.', colorTheme: 'indigo' },
  { name: 'Загон для производителей', capacity: 10, description: 'Специальный загон для племенных баранов и быков.', colorTheme: 'purple' },
  { name: 'Ветеринарный изолятор', capacity: 10, description: 'Бокс для лечения, клинического осмотра и выздоравливающих животных.', colorTheme: 'emerald' },
  { name: 'Накопитель доильного зала', capacity: 40, description: 'Площадка для ожидания перед доением и осмотра после дойки.', colorTheme: 'sky' },
];

export const DEFAULT_TREATMENT_TYPES_RU: SeedTreatmentType[] = [
  { name: 'Профилактическая вакцинация', description: 'Плановая иммунизация против клостридиозов, ящура, бруцеллёза и пневмоний.', colorTheme: 'emerald' },
  { name: 'Дегельминтизация и обработка от паразитов', description: 'Обработка от эндо- и эктопаразитов, купание и инъекционные препараты.', colorTheme: 'amber' },
  { name: 'Антибиотикотерапия', description: 'Курсовое лечение респираторных, суставных и маститных инфекций по назначению ветврача.', colorTheme: 'rose' },
  { name: 'Витаминные и минеральные комплексы', description: 'Введение селена, витаминов АД3Е, кальция и микроэлементов.', colorTheme: 'indigo' },
  { name: 'Расчистка копыт и обработка копытец', description: 'Профилактическая обрезка копыт и дезинфицирующие копытные ванны.', colorTheme: 'sky' },
  { name: 'Родовспоможение и акушерство', description: 'Помощь при патологических родах, лечение задержания последа и эндометритов.', colorTheme: 'purple' },
];

export const DEFAULT_DISEASES_RU: SeedDisease[] = [
  { name: 'Энтеротоксемия (Размягчённая почка)', description: 'Острая клостридиальная токсикоинфекция при резкой смене рациона, ведущая к внезапной гибели.', colorTheme: 'rose' },
  { name: 'Ящур', description: 'Особо опасное вирусное заболевание с образованием афт на слизистых, вымени и венчике копыт.', colorTheme: 'rose' },
  { name: 'Мастит (Воспаление вымени)', description: 'Бактериальное поражение долей вымени со сгустками в молоке и падением удоя.', colorTheme: 'amber' },
  { name: 'Копытная гниль', description: 'Инфекционное поражение копытного рога с гнилостным запахом и хромотой.', colorTheme: 'amber' },
  { name: 'Бронхопневмония', description: 'Поражение дыхательных путей с кашлем, лихорадкой и одышкой.', colorTheme: 'purple' },
  { name: 'Токсемия беременности (Кетоз)', description: 'Нарушение энергетического обмена на поздних сроках беременности.', colorTheme: 'indigo' },
];

export const DEFAULT_HERDS_RU: SeedHerd[] = [{ name: 'Основное племенное стадо' }];
export const DEFAULT_WAREHOUSES_RU: SeedWarehouse[] = [
  { name: 'Главный зернофуражный склад', location: 'Центральный сектор' },
  { name: 'Ветеринарная аптека и ветпункт', location: 'Санпропускник' },
];
export const DEFAULT_STOCK_CATEGORIES_RU: SeedStockCategory[] = [
  { name: 'Грубые корма', kind: 'yem', description: 'Сено, солома, сенаж и силос', colorTheme: 'amber' },
  { name: 'Концентрированные корма', kind: 'yem', description: 'Комбикорм, ячмень, кукуруза, жмых', colorTheme: 'indigo' },
  { name: 'Ветеринарные препараты и вакцины', kind: 'ilac', description: 'Вакцины, антибиотики, сыворотки и витамины', colorTheme: 'rose' },
  { name: 'Расходные материалы и инвентарь', kind: 'sarf', description: 'Ушные бирки, шприцы, дезинфектанты', colorTheme: 'sky' },
];
export const DEFAULT_ACCOUNTING_ITEMS_RU: SeedAccountingItem[] = [
  { name: 'Реализация скота (живой вес)', type: 'gelir' },
  { name: 'Реализация молока', type: 'gelir' },
  { name: 'Затраты на корма', type: 'gider' },
  { name: 'Ветеринарные услуги и препараты', type: 'gider' },
  { name: 'Общехозяйственные расходы', type: 'gider' },
];
export const DEFAULT_DEATH_REASONS_RU: SeedDeathReason[] = [
  { name: 'Бронхопневмония' },
  { name: 'Энтеротоксемия' },
  { name: 'Родовые осложнения' },
  { name: 'Травма / Несчастный случай' },
  { name: 'Естественная старость' },
];

@Injectable({ providedIn: 'root' })
export class SeedService {
  private get db() {
    return getFirestore();
  }

  /**
   * Çiftliğe ait Hayvan Tipleri, Irklar, Padoklar, Tedavi Türleri ve Hastalıkları Firestore'a toplu (batch) olarak yükler.
  /**
   * Çiftlik tanımlarındaki (Hayvan Tipleri, Irklar, Padoklar, Tedavi Türleri, Hastalıklar) mükerrer kayıtları temizler.
   * Aynı isimdeki kayıtlardan en eskisini tutar, diğer kopyaları soft-delete (deletedAt) yapar.
   */
  async cleanDuplicates(farmId: string): Promise<{ success: boolean; totalRemoved: number }> {
    if (!farmId) return { success: false, totalRemoved: 0 };

    try {
      const collections = [
        'animalTypes',
        'breeds',
        'paddocks',
        'treatmentTypes',
        'diseases',
        'herds',
        'warehouses',
        'stockCategories',
        'accountingItems',
        'deathReasons',
      ];
      let totalRemoved = 0;

      for (const col of collections) {
        const snap = await getDocs(query(collection(this.db, `farms/${farmId}/${col}`)));
        const grouped = new Map<string, { id: string; createdAt: any; data: any }[]>();

        for (const d of snap.docs) {
          const data = d.data();
          if (data['deletedAt']) continue;
          const name = (data['name'] || '').trim().toLowerCase();
          if (!name) continue;

          if (!grouped.has(name)) {
            grouped.set(name, []);
          }
          grouped.get(name)!.push({ id: d.id, createdAt: data['createdAt'], data });
        }

        const batch = writeBatch(this.db);
        let batchCount = 0;

        for (const [, items] of grouped.entries()) {
          if (items.length > 1) {
            // İlk kaydı tut, sonrakileri sil
            const [, ...duplicates] = items;
            for (const dup of duplicates) {
              const ref = doc(this.db, `farms/${farmId}/${col}/${dup.id}`);
              batch.update(ref, {
                deletedAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
              batchCount++;
              totalRemoved++;
            }
          }
        }

        if (batchCount > 0) {
          await batch.commit();
        }
      }

      if (totalRemoved > 0) {
        console.log(`[SeedService] ${totalRemoved} adet mükerrer tanım kaydı çiftlikten (${farmId}) temizlendi.`);
      }
      return { success: true, totalRemoved };
    } catch (err) {
      console.error('[SeedService] Mükerrer kayıtlar temizlenirken hata:', err);
      return { success: false, totalRemoved: 0 };
    }
  }

  /**
   * Çiftliğe ait Hayvan Tipleri, Irklar, Padoklar, Tedavi Türleri ve Hastalıkları Firestore'a yükler.
   * İdempotenttir: Halihazırda var olan tanımları tekrar eklemez, mükerrerlik oluşturmaz.
   */
  async seedFarmDefaults(farmId: string, language: string = 'tr'): Promise<{ success: boolean; totalSeeded: number }> {
    if (!farmId) throw new Error('Geçersiz farmId');

    const lang = (language || 'tr').toLowerCase();

    let animalTypes = DEFAULT_ANIMAL_TYPES;
    let breeds = DEFAULT_BREEDS;
    let paddocks = DEFAULT_PADDOCKS;
    let treatmentTypes = DEFAULT_TREATMENT_TYPES;
    let diseases = DEFAULT_DISEASES;
    let herds = DEFAULT_HERDS;
    let warehouses = DEFAULT_WAREHOUSES;
    let stockCategories = DEFAULT_STOCK_CATEGORIES;
    let accountingItems = DEFAULT_ACCOUNTING_ITEMS;
    let deathReasons = DEFAULT_DEATH_REASONS;

    if (lang === 'en') {
      animalTypes = DEFAULT_ANIMAL_TYPES_EN;
      breeds = DEFAULT_BREEDS_EN;
      paddocks = DEFAULT_PADDOCKS_EN;
      treatmentTypes = DEFAULT_TREATMENT_TYPES_EN;
      diseases = DEFAULT_DISEASES_EN;
      herds = DEFAULT_HERDS_EN;
      warehouses = DEFAULT_WAREHOUSES_EN;
      stockCategories = DEFAULT_STOCK_CATEGORIES_EN;
      accountingItems = DEFAULT_ACCOUNTING_ITEMS_EN;
      deathReasons = DEFAULT_DEATH_REASONS_EN;
    } else if (lang === 'de') {
      animalTypes = DEFAULT_ANIMAL_TYPES_DE;
      breeds = DEFAULT_BREEDS_DE;
      paddocks = DEFAULT_PADDOCKS_DE;
      treatmentTypes = DEFAULT_TREATMENT_TYPES_DE;
      diseases = DEFAULT_DISEASES_DE;
      herds = DEFAULT_HERDS_DE;
      warehouses = DEFAULT_WAREHOUSES_DE;
      stockCategories = DEFAULT_STOCK_CATEGORIES_DE;
      accountingItems = DEFAULT_ACCOUNTING_ITEMS_DE;
      deathReasons = DEFAULT_DEATH_REASONS_DE;
    } else if (lang === 'nl') {
      animalTypes = DEFAULT_ANIMAL_TYPES_NL;
      breeds = DEFAULT_BREEDS_NL;
      paddocks = DEFAULT_PADDOCKS_NL;
      treatmentTypes = DEFAULT_TREATMENT_TYPES_NL;
      diseases = DEFAULT_DISEASES_NL;
      herds = DEFAULT_HERDS_NL;
      warehouses = DEFAULT_WAREHOUSES_NL;
      stockCategories = DEFAULT_STOCK_CATEGORIES_NL;
      accountingItems = DEFAULT_ACCOUNTING_ITEMS_NL;
      deathReasons = DEFAULT_DEATH_REASONS_NL;
    } else if (lang === 'ru') {
      animalTypes = DEFAULT_ANIMAL_TYPES_RU;
      breeds = DEFAULT_BREEDS_RU;
      paddocks = DEFAULT_PADDOCKS_RU;
      treatmentTypes = DEFAULT_TREATMENT_TYPES_RU;
      diseases = DEFAULT_DISEASES_RU;
      herds = DEFAULT_HERDS_RU;
      warehouses = DEFAULT_WAREHOUSES_RU;
      stockCategories = DEFAULT_STOCK_CATEGORIES_RU;
      accountingItems = DEFAULT_ACCOUNTING_ITEMS_RU;
      deathReasons = DEFAULT_DEATH_REASONS_RU;
    }

    try {
      // Önce mevcut mükerrer kayıtları temizle
      await this.cleanDuplicates(farmId);

      const batch = writeBatch(this.db);
      let count = 0;

      // 1. Hayvan Tipleri
      const existingTypesSnap = await getDocs(query(collection(this.db, `farms/${farmId}/animalTypes`)));
      const existingTypes = new Map<string, string>(); // name.toLowerCase() -> id
      for (const d of existingTypesSnap.docs) {
        const data = d.data();
        if (!data['deletedAt'] && data['name']) {
          existingTypes.set(data['name'].trim().toLowerCase(), d.id);
        }
      }

      for (const item of animalTypes) {
        const key = item.name.trim().toLowerCase();
        if (!existingTypes.has(key)) {
          const ref = doc(collection(this.db, `farms/${farmId}/animalTypes`));
          batch.set(ref, {
            ...item,
            deletedAt: null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          existingTypes.set(key, ref.id);
          count++;
        }
      }

      // 2. Irklar
      const existingBreedsSnap = await getDocs(query(collection(this.db, `farms/${farmId}/breeds`)));
      const existingBreeds = new Set<string>();
      for (const d of existingBreedsSnap.docs) {
        const data = d.data();
        if (!data['deletedAt'] && data['name']) {
          existingBreeds.add(data['name'].trim().toLowerCase());
        }
      }

      // Tip ID eşleştirmeleri: Koyun / Sheep / Schaf / Ooi / Овцематка
      const koyunTypeId = existingTypes.get('koyun') || existingTypes.get('sheep') || existingTypes.get('schaf (mutterschaf)') || existingTypes.get('ooi (schaap)') || existingTypes.get('овцематка');
      const keciTypeId = existingTypes.get('keçi') || existingTypes.get('goat') || existingTypes.get('ziege (mutterziege)') || existingTypes.get('geit (moedergeit)') || existingTypes.get('козоматка');
      const inekTypeId = existingTypes.get('inek') || existingTypes.get('cow') || existingTypes.get('kuh') || existingTypes.get('koe') || existingTypes.get('корова');

      for (const item of breeds) {
        const key = item.name.trim().toLowerCase();
        if (!existingBreeds.has(key)) {
          const ref = doc(collection(this.db, `farms/${farmId}/breeds`));
          let animalTypeId: string | undefined = undefined;
          if (item.category === 'kucukbas') {
            const lowerName = item.name.toLowerCase();
            if (lowerName.includes('keçi') || lowerName.includes('goat') || lowerName.includes('ziege') || lowerName.includes('geit') || lowerName.includes('коза')) {
              animalTypeId = keciTypeId;
            } else {
              animalTypeId = koyunTypeId;
            }
          } else if (item.category === 'buyukbas') {
            animalTypeId = inekTypeId;
          }

          batch.set(ref, {
            ...item,
            ...(animalTypeId ? { animalTypeId } : {}),
            deletedAt: null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          existingBreeds.add(key);
          count++;
        }
      }

      // 3. Padoklar
      const existingPaddocksSnap = await getDocs(query(collection(this.db, `farms/${farmId}/paddocks`)));
      const existingPaddocks = new Set<string>();
      for (const d of existingPaddocksSnap.docs) {
        const data = d.data();
        if (!data['deletedAt'] && data['name']) {
          existingPaddocks.add(data['name'].trim().toLowerCase());
        }
      }

      for (const item of paddocks) {
        const key = item.name.trim().toLowerCase();
        if (!existingPaddocks.has(key)) {
          const ref = doc(collection(this.db, `farms/${farmId}/paddocks`));
          batch.set(ref, {
            ...item,
            deletedAt: null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          existingPaddocks.add(key);
          count++;
        }
      }

      // 4. Tedavi Türleri
      const existingTreatmentsSnap = await getDocs(query(collection(this.db, `farms/${farmId}/treatmentTypes`)));
      const existingTreatments = new Set<string>();
      for (const d of existingTreatmentsSnap.docs) {
        const data = d.data();
        if (!data['deletedAt'] && data['name']) {
          existingTreatments.add(data['name'].trim().toLowerCase());
        }
      }

      for (const item of treatmentTypes) {
        const key = item.name.trim().toLowerCase();
        if (!existingTreatments.has(key)) {
          const ref = doc(collection(this.db, `farms/${farmId}/treatmentTypes`));
          batch.set(ref, {
            ...item,
            deletedAt: null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          existingTreatments.add(key);
          count++;
        }
      }

      // 5. Hastalıklar
      const existingDiseasesSnap = await getDocs(query(collection(this.db, `farms/${farmId}/diseases`)));
      const existingDiseases = new Set<string>();
      for (const d of existingDiseasesSnap.docs) {
        const data = d.data();
        if (!data['deletedAt'] && data['name']) {
          existingDiseases.add(data['name'].trim().toLowerCase());
        }
      }

      for (const item of diseases) {
        const key = item.name.trim().toLowerCase();
        if (!existingDiseases.has(key)) {
          const ref = doc(collection(this.db, `farms/${farmId}/diseases`));
          batch.set(ref, {
            ...item,
            deletedAt: null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          existingDiseases.add(key);
          count++;
        }
      }

      // 6. Sürüler
      const existingHerdsSnap = await getDocs(query(collection(this.db, `farms/${farmId}/herds`)));
      const existingHerds = new Set<string>();
      for (const d of existingHerdsSnap.docs) {
        const data = d.data();
        if (!data['deletedAt'] && data['name']) {
          existingHerds.add(data['name'].trim().toLowerCase());
        }
      }

      for (const item of herds) {
        const key = item.name.trim().toLowerCase();
        if (!existingHerds.has(key)) {
          const ref = doc(collection(this.db, `farms/${farmId}/herds`));
          batch.set(ref, {
            ...item,
            deletedAt: null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          existingHerds.add(key);
          count++;
        }
      }

      // 7. Depolar
      const existingWarehousesSnap = await getDocs(query(collection(this.db, `farms/${farmId}/warehouses`)));
      const existingWarehouses = new Set<string>();
      for (const d of existingWarehousesSnap.docs) {
        const data = d.data();
        if (!data['deletedAt'] && data['name']) {
          existingWarehouses.add(data['name'].trim().toLowerCase());
        }
      }

      for (const item of warehouses) {
        const key = item.name.trim().toLowerCase();
        if (!existingWarehouses.has(key)) {
          const ref = doc(collection(this.db, `farms/${farmId}/warehouses`));
          batch.set(ref, {
            ...item,
            deletedAt: null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          existingWarehouses.add(key);
          count++;
        }
      }

      // 8. Stok Kategorileri
      const existingCategoriesSnap = await getDocs(query(collection(this.db, `farms/${farmId}/stockCategories`)));
      const existingCategories = new Set<string>();
      for (const d of existingCategoriesSnap.docs) {
        const data = d.data();
        if (!data['deletedAt'] && data['name']) {
          existingCategories.add(data['name'].trim().toLowerCase());
        }
      }

      for (const item of stockCategories) {
        const key = item.name.trim().toLowerCase();
        if (!existingCategories.has(key)) {
          const ref = doc(collection(this.db, `farms/${farmId}/stockCategories`));
          batch.set(ref, {
            ...item,
            deletedAt: null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          existingCategories.add(key);
          count++;
        }
      }

      // 9. Muhasebe Kalemleri
      const existingAcctSnap = await getDocs(query(collection(this.db, `farms/${farmId}/accountingItems`)));
      const existingAcct = new Set<string>();
      for (const d of existingAcctSnap.docs) {
        const data = d.data();
        if (!data['deletedAt'] && data['name']) {
          existingAcct.add(data['name'].trim().toLowerCase());
        }
      }

      for (const item of accountingItems) {
        const key = item.name.trim().toLowerCase();
        if (!existingAcct.has(key)) {
          const ref = doc(collection(this.db, `farms/${farmId}/accountingItems`));
          batch.set(ref, {
            ...item,
            deletedAt: null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          existingAcct.add(key);
          count++;
        }
      }

      // 10. Ölüm Nedenleri
      const existingDeathSnap = await getDocs(query(collection(this.db, `farms/${farmId}/deathReasons`)));
      const existingDeath = new Set<string>();
      for (const d of existingDeathSnap.docs) {
        const data = d.data();
        if (!data['deletedAt'] && data['name']) {
          existingDeath.add(data['name'].trim().toLowerCase());
        }
      }

      for (const item of deathReasons) {
        const key = item.name.trim().toLowerCase();
        if (!existingDeath.has(key)) {
          const ref = doc(collection(this.db, `farms/${farmId}/deathReasons`));
          batch.set(ref, {
            ...item,
            deletedAt: null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          existingDeath.add(key);
          count++;
        }
      }

      if (count > 0) {
        await batch.commit();
      }
      console.log(`[SeedService] ${count} adet yeni varsayılan tanım çiftliğe (${farmId}) (${lang}) başarıyla yüklendi.`);
      return { success: true, totalSeeded: count };
    } catch (err) {
      console.error('[SeedService] Varsayılan kayıtlar yüklenirken hata:', err);
      return { success: false, totalSeeded: 0 };
    }
  }

  /**
   * Çiftliğin tanımları boş ise otomatik olarak tohumlar, mükerrer varsa temizler.
   */
  async checkAndSeedIfEmpty(farmId: string, language: string = 'tr'): Promise<boolean> {
    if (!farmId) return false;
    try {
      // Her ihtimale karşı mükerrerleri temizle
      await this.cleanDuplicates(farmId);

      const typesSnap = await getDocs(query(collection(this.db, `farms/${farmId}/animalTypes`), limit(1)));
      if (typesSnap.empty) {
        const res = await this.seedFarmDefaults(farmId, language);
        return res.success;
      }
      return false;
    } catch (err) {
      console.warn('[SeedService] checkAndSeedIfEmpty kontrol hatası:', err);
      return false;
    }
  }
}
