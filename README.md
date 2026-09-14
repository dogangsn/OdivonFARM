# OdivonFARM

Koyun/keçi çiftlik yönetim sistemi — **Angular 21 + Firebase**.
`ovinia.roswise.com` örnek sitesinin ekran görüntülerinden çıkarılan modül
yapısı referans alınarak oluşturulmuş **geniş iskelet**tir.

## Kurulum

```bash
npm install
```

### Firebase bağlantısı

1. https://console.firebase.google.com adresinde yeni bir proje açın.
2. Authentication > Sign-in method'dan **E-posta/Şifre**'yi etkinleştirin.
3. Firestore Database oluşturun (production mode).
4. Proje ayarlarından Web App ekleyip config bilgilerini alın.
5. `src/environments/environment.ts` ve `environment.development.ts` içindeki
   `firebase: {...}` alanını kendi projenizin bilgileriyle doldurun.
6. Firestore güvenlik kurallarını deploy edin:

   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add        # projenizi seçin
   firebase deploy --only firestore:rules,firestore:indexes
   ```

### Çalıştırma

```bash
npm start          # ng serve, http://localhost:4200
npm run build       # prod build -> dist/OdivonFARM
```

İlk açılışta `/auth/register` üzerinden kayıt olun; kayıt akışı sizin için
otomatik olarak bir `farms/{id}` dokümanı oluşturup sizi **admin** rolüyle
üye yapar (bkz. `AuthService.register`).

## Mimari

```
src/app/
  core/
    models/        Tüm Firestore doküman tipleri (Animal, Breed, Herd, Mating, ...)
    services/       Jenerik FirestoreCrudService<T> + her varlık için ince servis alt sınıfları
    auth/           AuthService (Firebase Auth + users/{uid} profili)
    guards/         authGuard, roleGuard
  shared/
    components/
      shell/               Sol menü + üst bar + router-outlet (uygulama kabuğu)
      simple-crud-list/     Tek alanlı (isim) tanımlamalar için ortak taban bileşen
      coming-soon/          Henüz UI'ı detaylandırılmamış modüller için yer tutucu
  features/
    dashboard/       Anasayfa özet kartları
    animals/          Hayvanlar — RFID/küpe arama, filtreler, kart görünümü (flagship modül)
    animal-movements/
    definitions/      Tanımlamalar: cariler, irklar, hayvan-tipleri, suruler, padoklar,
                       tedavi-turleri, hastaliklar, referanslar, etiketler,
                       olum-nedenleri, depolar, muhasebe-kalemleri
    breeding, weights, accounting, tasks, insured-animals, stock, ration,
    counting, reports, yields, activity-log, gallery, recycle-bin
    auth/             login, register
```

### Veri modeli — neden Firestore?

Realtime Database yerine **Firestore** seçildi çünkü:
- Hayvanlar ekranındaki çoklu filtreleme (Tip/Irk/Sürü/Padok/Etiket/Durum) doküman
  bazlı sorgulama ve composite index desteği gerektiriyor.
- Modüller arası referanslar (bir tedavi kaydı → hayvan, tedavi türü, protokol) ilişkisel
  bir yapıya yakın; Firestore'un koleksiyon/doküman modeli buna RTDB'nin düz JSON ağacından
  daha uygun.
- Güvenlik kuralları (rol bazlı erişim) Firestore'da daha esnek yazılabiliyor.

Tüm veri `farms/{farmId}/<koleksiyon>` altında tutulur — bir kullanıcı ileride birden
fazla çiftliğe (ör. danışman veteriner) üye olabilir; aktif çiftlik `FarmContextService`
üzerinden yönetilir.

### Soft delete / Geri Dönüşüm Merkezi

Kayıtlar fiilen silinmez; `deletedAt` alanı set edilir.
`FirestoreCrudService.list()` sadece `deletedAt == null` olanları getirir,
`listDeleted()` ise Geri Dönüşüm Merkezi ekranı için silinenleri getirir.
`restore(id)` ile geri alınabilir, `hardDelete(id)` ile kalıcı silinebilir.

### Yeni bir "basit tanımlama" eklemek

Sadece isim alanı olan yeni bir varlık eklemek (ör. "Yeni Kategori") için:

1. `core/models/` altında ilgili interface'i tanımlayın (`extends BaseDoc`).
2. `core/services/definitions/` altında `FirestoreCrudService<T>`'den türeyen
   birkaç satırlık bir servis yazın.
3. `features/definitions/` altında `SimpleCrudListBase<T>`'den türeyen ve
   ortak `simple-crud-list.component.html` şablonunu kullanan bir bileşen ekleyin
   (bkz. `features/definitions/breeds/breeds.component.ts` örneği).
4. `app.routes.ts` içinde `tanimlamalar` altına route ekleyin ve `shell.component.ts`
   içindeki `nav` dizisine menü öğesini ekleyin.

## Tamamlanan Modüller & Ekranlar

Tüm ana modüller Tailwind CSS, Angular Material Icons, Angular Signals ve Firestore CRUD mimarisiyle eksiksiz olarak tamamlanmıştır:

- **Hayvanlar (`/hayvanlar`)** — RFID/küpe arama, filtreler, kart ve tablo görünümü, hayvan ekleme/düzenleme drawer'ı.
- **Hayvan Hareketleri (`/hayvan-hareketleri`)** — Padok/sürü transferleri, çiftlik giriş/çıkış kayıtları.
- **Çiftleşmeler (`/ciftlesmeler`)** — Koç katımı, gözlem, gebelik ve doğum takip akışı.
- **Canlı Ağırlık (`/canli-agirlik`)** — Periyodik tartım kayıtları ve gelişim eğrisi.
- **Muhasebe & Finans (`/muhasebe`)** — Gelir/gider hareketleri, cariler, muhasebe kalemleri, anlık kasa dengesi ve filtreleme.
- **Tedavi & Aşı Takibi (`/tedaviler`)** — Sürü sağlık protokolleri, aşılar, medikal müdahaleler ve ilaç giderleri.
- **Görevler Paneli (`/gorevler`)** — Çiftlik günlük/haftalık görev atamaları ve durum takibi.
- **Sigortalı Hayvanlar (`/sigortali-hayvanlar`)** — TARSİM ve özel poliçe yönetimi, teminat, prim ve vade takibi.
- **Stok & Envanter (`/stok`)** — Ambar giriş/çıkış hareketleri, depo mevcudu ve kritik stok uyarıları.
- **Rasyon & Yem Formülasyonu (`/rasyon`)** — Sürü gruplarına özel yem karışım oranları ve reçete formülasyonu.
- **Sayım Operasyonları (`/sayim`)** — RFID el terminali/simülatörü destekli canlı sayım oturumları, eksik küpe tespiti.
- **Verim Takibi (`/verimler`)** — Süt sağım miktarları ve yapağı kırkım kayıtları, sürü/bireysel analizler.
- **Foto Galeri (`/galeri`)** — Çiftlik ve hayvan fotoğrafları, lightbox önizleme ve görsel arşivi.
- **Raporlar & Analitik (`/raporlar`)** — Sürü demografisi, döl verimi, finansal konsolidasyon ve yazdırma/PDF desteği.
- **Çiftlikte Yapılanlar (`/aktiviteler`)** — Tüm operasyonel işlem logları ve zaman tüneli.
- **Geri Dönüşüm Merkezi (`/geri-donusum`)** — Soft-delete ile silinen kayıtları geri alma veya kalıcı silme.
- **Tanımlamalar (`/tanimlamalar/*`)** — Cariler, ırklar, tipler, sürüler, padoklar, tedavi türleri, hastalıklar, referanslar, etiketler, ölüm nedenleri, depolar, muhasebe kalemleri.

## Notlar

- Angular Material + `provideAnimationsAsync()` kuruldu.
- `withComponentInputBinding()` aktif — route `data` alanları bileşen `input()`'larına
  otomatik bağlanıyor (`coming-soon` bileşeninde kullanılıyor).
- Formlar şimdilik basit `ngModel` + sinyal kombinasyonuyla yazıldı; büyüdükçe
  Reactive Forms'a geçmek isteyebilirsiniz.
