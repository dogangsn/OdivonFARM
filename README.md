# OdivonFARM — Akıllı Çiftlik Yönetim Sistemi

[![Angular](https://img.shields.io/badge/Angular-21.2-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-12.19-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/Lisans-Proprietary-blue?style=for-the-badge)](#)

> **OdivonFARM**, küçükbaş (koyun, keçi) ve büyükbaş çiftlik işletmelerinin tüm operasyonel, veterinerlik, üreme, besleme, envanter ve finans süreçlerini tek bir çatı altında dijitalleştiren modern, bulut tabanlı bir **Çiftlik Yönetim Bilgi Sistemi**'dir.

🌐 **Canlı Uygulama:** [https://odivonfarm.web.app](https://odivonfarm.web.app)  
🚀 **Alternatif Bağlantı:** [https://odivonfarm.firebaseapp.com](https://odivonfarm.firebaseapp.com)

---

## 📑 İçindekiler
- [Genel Bakış](#-genel-bakış)
- [Teknoloji Yığını](#-teknoloji-yığını)
- [Temel Modüller ve Fonksiyonlar](#-temel-modüller-ve-fonksiyonlar)
- [Mimari ve Veri Modeli](#-mimari-ve-veri-modeli)
- [Kurulum ve Çalıştırma](#-kurulum-ve-çalıştırma)
- [Firebase ve Cloud Functions Dağıtımı](#-firebase-ve-cloud-functions-dağıtımı)
- [Proje Dizin Yapısı](#-proje-dizin-yapısı)
- [Güvenlik ve İzin Yönetimi](#-güvenlik-ve-izin-yönetimi)

---

## 🌟 Genel Bakış

OdivonFARM; hayvan doğumundan sağımına, aşı protokollerinden rasyon reçetelerine, finansal nakit akışından RFID el terminalleriyle canlı sürü sayımına kadar modern çiftliklerin tüm ihtiyaçlarını karşılamak üzere tasarlanmıştır.

### Başlıca Avantajlar:
- **Çoklu Çiftlik (Multi-Tenant) Desteği:** Her çiftliğin verisi `farms/{farmId}` hiyerarşisinde güvenli bir şekilde izoledir. Tek bir kullanıcı birden fazla çiftliğe farklı rollerle (Yönetici, Veteriner, Çoban vb.) erişebilir.
- **RFID & Dijital Küpe Entegrasyonu:** Elektronik küpe okuyucular ve el terminalleri ile uyumlu sayım ve hızlı arama sistemi.
- **Reaktif Durum Yönetimi:** Angular Signals ve RxJS ile minimum bellek ayak izi ve anlık veri senkronizasyonu.
- **Soft-Delete Güvencesi:** Silinen hiçbir veri kaybolmaz; Geri Dönüşüm Merkezi üzerinden anında kurtarılabilir veya yetkili tarafından kalıcı olarak temizlenebilir.
- **Otomatik SMTP Bildirimleri:** Cloud Functions ve Hostinger SMTP entegrasyonu ile Firestore tabanlı e-posta kuyruğu yönetimi.

---

## 🛠 Teknoloji Yığını

| Alan | Teknoloji / Kütüphane | Açıklama |
|---|---|---|
| **Frontend Framework** | **Angular 21** | Standalone bileşenler, Signals reaktif veri akışı, Modern Control Flow (`@if`, `@for`) |
| **Tasarım & UI** | **Tailwind CSS 3** | Responsive, modern kart ve veri tabloları |
| **UI Bileşenleri** | **Angular Material 21 & CDK** | Modal, drawer, tooltip ve animasyon destekleri |
| **Veritabanı** | **Cloud Firestore** | NoSQL belge tabanlı, gerçek zamanlı çiftlik veri tabanı |
| **Kimlik Doğrulama** | **Firebase Auth** | E-posta/şifre, rol ve yetki kontrolleri |
| **Backend & Kuyruk** | **Cloud Functions (Node.js 18/20)** | Firestore `mail` koleksiyonunu dinleyen SMTP e-posta servisi |
| **Bildirimler & Uyarılar** | **SweetAlert2** | Şık bildirim pencereleri ve onay diyalogları |
| **Veri Analitiği** | **Chroma.js & Lodash** | Renk haritaları, veri gruplama ve analitik hesaplamalar |

---

## 🧩 Temel Modüller ve Fonksiyonlar

### 1. 📊 Gösterge Paneli (Dashboard — `/anasayfa`)
- Canlı sürü büyüklüğü, aktif/pasif hayvan sayıları.
- Cinsiyet dağılımı (Koç/Teke, Koyun/Keçi, Kuzu/Oğlak).
- Kritik uyarılar: Yaklaşan doğumlar, süresi geçen aşılar ve acil görevler.
- Finansal özet: Aylık gelir, gider ve net nakit dengesi.

### 2. 🐑 Hayvan Yönetimi (`/hayvanlar`)
- **Gelişmiş Arama ve Filtreleme:** RFID küpe no, görsel küpe no, ad, ırk, cinsiyet, padok, sürü, doğum tarihi ve özel etiketler.
- **Detaylı Hayvan Kartı:** Soy ağacı (anne/baba küpe bilgisi), ağırlık geçmişi, sağlık müdahaleleri, doğum ve verim kayıtları.
- **Görünüm Seçenekleri:** Kart (Grid) veya detaylı Liste (Tablo) modları.
- **Hızlı İşlemler:** Hayvan ekleme/güncelleme çekmecesi (drawer), toplu durum güncelleme.

### 3. 🔄 Hayvan Hareketleri (`/hayvan-hareketleri`)
- Padoktan padağa ve sürüden sürüye dahili transfer kayıtları.
- Çiftliğe giriş (satın alma, hediye, doğum) ve çıkış (satış, kesim, ölüm) operasyonları.
- Tarihsel hareket dökümü ve transfer gerekçeleri.

### 4. 🧬 Üreme & Çiftleşme Yönetimi (`/ciftlesmeler`)
- Koç katımı planlaması ve serbest/kontrollü aşım kayıtları.
- Gebelik muayene sonuçları (ultrason/kan testi), tahmini doğum tarihi hesaplama.
- Doğum kayıtları: Yavru sayısı, canlı/ölü doğum oranları, anne-yavru eşleştirmesi.

### 5. ⚖️ Canlı Ağırlık Takibi (`/canli-agirlik`)
- Periyodik tartım oturumları ve terazi entegrasyonu.
- Günlük Canlı Ağırlık Artışı (GCAA / ADG) otomatik hesaplama.
- Sürü ve bireysel bazda gelişim grafikleri.

### 6. 🩺 Tedavi & Sağlık Protokolleri (`/tedaviler`)
- Aşı takvimleri, koruyucu hekimlik ve paraziter mücadele programları.
- Bireysel veya toplu sürü tedavileri, teşhis konulan hastalıklar.
- Kullanılan ilaçlar, dozajlar, arınma süreleri (süt/et kesim süresi) ve maliyet dökümü.

### 7. 🌾 Stok & Envanter (`/stok`)
- Yem, ilaç, aşı, tohum ve operasyonel sarf malzeme depoları.
- Giriş/çıkış fişleri, birim maliyet takibi ve ambarlar arası transfer.
- Kritik asgari stok seviyesi uyarıları.

### 8. 🥣 Rasyon & Yem Formülasyonu (`/rasyon`)
- Sürü gruplarına özel (sağmal, besi, gebe, kuzu) yem reçeteleri.
- Kuru madde, ham protein ve metabolik enerji gereksinimi dengeleme.
- Günlük ve dönemlik yem tüketim maliyet analizi.

### 9. 📡 RFID Sayım Operasyonları (`/sayim`)
- RFID el terminali / Bluetooth barkod okuyucu destekli canlı sayım oturumları.
- El terminali simülatörü ile masaüstü test imkanı.
- Sayım sonrası sistemdeki mevcudiyet ile okutulanların karşılaştırılması: **Eksik ve Fazla Küpe Anlık Tespiti**.

### 10. 🥛 Süt & Yapağı Verim Takibi (`/verimler`)
- Günlük/haftalık sağım süt miktarları (litre/kg).
- Sezonluk yapağı/kıl kırkım ağırlıkları ve kalite sınıfları.
- Laktasyon eğrisi ve hayvan bazlı verimlilik analitiği.

### 11. 💰 Muhasebe & Finans (`/muhasebe`)
- Gelir ve gider nakit/banka hareketleri.
- Cari hesap yönetimi (Tedarikçiler, Yem Fabrikaları, Müşteriler, Kasaplar).
- Kategori bazlı harcama dağılımı (Yem, İlaç, İşçilik, Bakım vb.).

### 12. 📋 Görev Yönetimi (`/gorevler`)
- Çiftlik personeline görev atama, öncelik derecelendirmesi ve termin tarihi belirleme.
- Durum panosu (Yapılacak, Devam Ediyor, Tamamlandı).

### 13. 🛡️ Sigortalı Hayvanlar (`/sigortali-hayvanlar`)
- TARSİM ve özel çiftlik hayvan hayat sigortası poliçe takibi.
- Teminat kapsamı, prim ödemeleri, poliçe başlangıç-bitiş vadeleri ve hasar bildirimleri.

### 14. 🖼️ Fotoğraf Galerisi (`/galeri`)
- Çiftlik geneli ve bireysel hayvan fotoğrafları.
- Lightbox modunda tam ekran önizleme ve görsel arşivleme.

### 15. 📈 Raporlama & Analitik (`/raporlar`)
- Sürü demografisi, yaş grupları, ölüm oranları ve döl verimi özetleri.
- Yazdırma ve PDF raporlama desteği.

### 16. 📜 Aktivite Logları (`/aktiviteler`)
- Çiftlik içerisinde yapılan tüm işlemlerin (ekleme, silme, güncelleme, transfer) denetim (audit) günlüğü.

### 17. ♻️ Geri Dönüşüm Merkezi (`/geri-donusum`)
- Yanlışlıkla silinen tüm kayıtlar (hayvanlar, tedaviler, işlemler) soft-delete koruması altındadır.
- Tek tıkla geri yükleme (`Restore`) veya kalıcı olarak silme (`Hard Delete`).

### 18. 💳 Abonelik & Lisans Yönetimi (`/abonelik`)
- Çiftlik abonelik paketleri: Deneme, Temel, Profesyonel ve Kurumsal.
- Hayvan ve kullanıcı kotaları, lisans yenileme süreçleri.

### 19. ⚙️ Tanımlamalar (`/tanimlamalar/*`)
Sistemin dinamik ve esnek çalışmasını sağlayan parametrik yapılandırmalar:
- **Cariler**, **Irklar**, **Hayvan Tipleri**, **Sürüler**, **Padoklar**, **Tedavi Türleri**, **Hastalıklar**, **Referanslar**, **Etiketler**, **Ölüm Nedenleri**, **Depolar**, **Muhasebe Kalemleri**, **Kullanıcılar** ve **Roller**.

---

## 🏛 Mimari ve Veri Modeli

### Multi-Tenant Firestore Yapısı
Veriler doğrudan çiftlik bağlamında izole edilir:

```
farms/
  └── {farmId}/
        ├── animals/              # Hayvan kimlik ve küpe bilgileri
        ├── animal-movements/     # Padok/sürü transferleri
        ├── matings/              # Çiftleşme ve tohumlama kayıtları
        ├── weight-records/       # Tartım kayıtları
        ├── treatments/           # Aşı ve tedavi kayıtları
        ├── stock-items/          # Depo envanteri
        ├── stock-movements/      # Stok giriş/çıkış hareketleri
        ├── rations/              # Yem reçeteleri
        ├── counts/               # Sayım seansları
        ├── yield-records/        # Süt ve yapağı verimleri
        ├── accounting-tx/        # Gelir ve gider işlemleri
        ├── tasks/                # Görev listesi
        ├── insured-animals/      # Sigorta poliçeleri
        ├── activity-logs/        # Denetim günlükleri
        └── definitions/          # Çiftliğe özel parametrik tanımlar
```

### Soft-Delete Mimarisi
Tüm Firestore belgeleri `BaseDoc` arayüzünü uygular:
- Kayıt silindiğinde `deletedAt` alanı o anki sunucu zaman damgasıyla doldurulur.
- `FirestoreCrudService.list()` sorguları varsayılan olarak yalnızca `deletedAt == null` olan aktif kayıtları çeker.
- `listDeleted()` fonksiyonu silinen kayıtları Geri Dönüşüm Merkezi ekranında listeler.

---

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler
- **Node.js:** v18.x veya v20.x (LTS)
- **npm:** 10.x+
- **Angular CLI:** `npm install -g @angular/cli`
- **Firebase CLI:** `npm install -g firebase-tools`

### 1. Depoyu Klonlayın ve Bağımlılıkları Yükleyin
```bash
git clone https://github.com/dogangsn/OdivonFARM.git
cd OdivonFARM
npm install
```

### 2. Ortam Değişkenleri (`environment.ts`)
`src/environments/environment.ts` dosyasında Firebase yapılandırma bilgilerinizi kontrol edin:
```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "...",
    appId: "..."
  }
};
```

### 3. Yerel Geliştirme Sunucusunu Başlatın
```bash
npm start
# veya
ng serve --host 0.0.0.0 --port 4200
```
Tarayıcınızda `http://localhost:4200` adresine gidin.

### 4. İlk Yönetici Hesabı ve Örnek Veri (Seed Data)
1. `/auth/register` sayfasına gidin ve yeni bir hesap oluşturun.
2. Kayıt işlemi otomatik olarak adınıza yeni bir çiftlik oluşturur ve sizi **Yönetici (Admin)** olarak yetkilendirir.
3. İsteğe bağlı olarak `SeedService` üzerinden demo veriler (sürüler, padoklar, örnek hayvanlar, rasyonlar) oluşturulabilir.

---

## ☁️ Firebase ve Cloud Functions Dağıtımı

### Canlıya Dağıtım (Hosting & Firestore)
Angular uygulamasını derleyip Firebase Hosting ve Firestore kurallarını yayınlamak için:

```bash
# 1. Üretim paketi derleme
npm run build

# 2. Hosting ve Firestore kurallarını canlıya alma
firebase deploy --only hosting,firestore
```

### Cloud Functions (E-posta SMTP Servisi) Dağıtımı
`functions/` dizini altındaki Node.js servisi, `mail` koleksiyonuna düşen kayıtları Hostinger SMTP üzerinden alıcılara iletir:

```bash
cd functions
npm install
cd ..

# Cloud Functions dağıtımı (Blaze planı gerektirir)
firebase deploy --only functions
```

---

## 📂 Proje Dizin Yapısı

```
OdivonFARM/
├── functions/                    # Firebase Cloud Functions (SMTP E-posta tetikleyicisi)
│   ├── index.js                  # Firestore mail dinleyicisi & nodemailer
│   └── package.json
├── public/                       # Statik varlıklar ve görseller
├── src/
│   ├── app/
│   │   ├── core/                 # Çekirdek modüller
│   │   │   ├── auth/             # AuthService & oturum yönetimi
│   │   │   ├── guards/           # authGuard & roleGuard
│   │   │   ├── models/           # TypeScript arayüzleri ve veri modelleri
│   │   │   └── services/         # FirestoreCrudService & varlık servisleri
│   │   ├── features/             # Sayfa bileşenleri (Feature Modules)
│   │   │   ├── accounting/       # Muhasebe & Finans
│   │   │   ├── activity-log/     # İşlem Geçmişi
│   │   │   ├── animal-movements/ # Padok/Sürü Transferleri
│   │   │   ├── animals/          # Hayvan Yönetimi (Ana Ekran)
│   │   │   ├── auth/             # Giriş & Kayıt Ekranları
│   │   │   ├── breeding/         # Çiftleşme & Doğum
│   │   │   ├── counting/         # RFID Sayım Ekranı
│   │   │   ├── dashboard/        # Ana Gösterge Paneli
│   │   │   ├── definitions/      # 19 Parametrik Tanımlama Ekranı
│   │   │   ├── gallery/          # Foto Galeri
│   │   │   ├── insured-animals/  # Sigortalı Hayvanlar
│   │   │   ├── ration/           # Rasyon & Yem Reçeteleri
│   │   │   ├── recycle-bin/      # Geri Dönüşüm Merkezi
│   │   │   ├── reports/          # Raporlar & Analitik
│   │   │   ├── stock/            # Depo & Stok
│   │   │   ├── subscription/     # Abonelik Yönetimi
│   │   │   ├── tasks/            # Görev Takibi
│   │   │   ├── treatments/       # Aşı & Tedavi
│   │   │   ├── weights/          # Canlı Ağırlık / Tartım
│   │   │   └── yields/           # Süt & Yapağı Verimleri
│   │   ├── shared/               # Paylaşılan bileşenler (Shell, Sidebar, Topbar, Simple CRUD)
│   │   ├── app.config.ts         # Angular providers & Firebase başlatma
│   │   └── app.routes.ts         # Lazy-loaded yönlendirme tablosu
│   ├── environments/             # Ortam değişkenleri (Dev/Prod)
│   ├── index.html
│   ├── main.ts
│   └── styles.scss               # Global stiller & Tailwind direktifleri
├── firebase.json                 # Firebase Hosting, Firestore ve Functions ayarları
├── firestore.indexes.json        # Composite Firestore indeksleri
├── firestore.rules               # Firestore güvenlik kuralları
├── tailwind.config.js            # Tailwind renk ve tema konfigürasyonu
└── package.json                  # Proje bağımlılıkları ve scriptleri
```

---

## 🔒 Güvenlik ve İzin Yönetimi

- **Firestore Güvenlik Kuralları (`firestore.rules`):**
  - Kullanıcılar yalnızca üyesi oldukları çiftliğin (`farms/{farmId}`) verilerini okuyabilir ve yazabilir.
  - Rol bazlı yetkilendirme (Admin, Veteriner, Çoban, Muhasebeci) ile kritik işlemler sınırlandırılmıştır.
  - Soft-delete kuralları gereği yetkisiz kalıcı silme işlemleri engellenmiştir.
- **İstemci Güvenliği:**
  - `authGuard` ve `roleGuard` ile yetkisiz sayfa erişimleri engellenir ve kullanıcı `/auth/login` sayfasına yönlendirilir.

---

## 📄 Lisans

Bu proje **Odivon** adına özel (Proprietary) olarak geliştirilmiştir. Tüm hakları saklıdır. İzin alınmaksızın çoğaltılamaz ve dağıtılamaz.
