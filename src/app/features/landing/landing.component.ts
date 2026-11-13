import { Component, HostListener, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FarmSceneComponent } from '../auth/shared/farm-scene.component';

/** Giriş/kayıt ekranlarıyla aynı anahtar: tema seçimi bu sayfalar arasında ortak kalır. */
const THEME_KEY = 'odivon_auth_theme';

interface Showcase {
  key: string;
  tab: string;
  icon: string;
  title: string;
  text: string;
  points: string[];
  image: string;
}

interface Feature {
  icon: string;
  title: string;
  text: string;
}

/**
 * farm.odivon.com kök sayfası: giriş yapmamış ziyaretçiler için tanıtım.
 * Giriş yapmış kullanıcıyı `guestGuard` doğrudan uygulamaya (/anasayfa) gönderir.
 * Ekran görüntüleri demo verisiyle alınmıştır: public/images/landing/*.webp
 */
@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, MatIconModule, FarmSceneComponent],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent {
  readonly year = new Date().getFullYear();

  isDark = signal(this.readInitialTheme());
  scrolled = signal(false);
  mobileMenuOpen = signal(false);
  lightbox = signal<{ src: string; alt: string } | null>(null);
  openFaq = signal<number | null>(0);

  readonly navLinks = [
    { href: '#ozellikler', label: 'Özellikler' },
    { href: '#ekranlar', label: 'Ekranlar' },
    { href: '#nasil-calisir', label: 'Nasıl Çalışır' },
    { href: '#sss', label: 'SSS' },
  ];

  readonly showcases: Showcase[] = [
    {
      key: 'hayvanlar',
      tab: 'Hayvan Kartları',
      icon: 'heroicons_outline:identification',
      title: 'Her hayvanın dijital kimlik kartı',
      text: 'Çiftlik küpe no, ulusal küpe (DKN), RFID, ırk, sürü, padok ve soy bilgisi tek kartta. Telefon kamerasıyla küpeyi okutun, hayvanı saniyede bulun.',
      points: ['Kamera ile küpe okuma ve RFID desteği', 'Anne-baba ve pedigri takibi', 'Sürü, padok, ırk ve etikete göre filtre'],
      image: 'hayvanlar',
    },
    {
      key: 'ureme',
      tab: 'Üreme & Gebelik',
      icon: 'heroicons_outline:heart',
      title: 'Koç katımından doğuma kadar takip',
      text: 'Çiftleşme kayıtları, gebelik kontrolleri ve tahmini doğum tarihleri otomatik hesaplanır. Doğumu yaklaşan hayvanlar sabah brifinginde önünüze gelir.',
      points: ['Tahmini doğum tarihi hesaplama', 'Gözlem, gebe, boş çıktı durumları', 'Doğumda yavru kaydı tek adımda'],
      image: 'ciftlesmeler',
    },
    {
      key: 'agirlik',
      tab: 'Canlı Ağırlık & Besi',
      icon: 'heroicons_outline:scale',
      title: 'Kilo artışını ve besi kârlılığını görün',
      text: 'Periyodik tartımlarla günlük canlı ağırlık artışı (GCAA) hesaplanır. Finansal besi analizi, yediği yemi karşılamayan hayvanları ve kesim olgunluğuna gelenleri işaretler.',
      points: ['Günlük canlı ağırlık artışı (g/gün)', 'Başa-baş kesim ve zarar uyarısı', 'Sürü ortalaması ve büyüme eğrisi'],
      image: 'canli-agirlik',
    },
    {
      key: 'saglik',
      tab: 'Sağlık & Aşı',
      icon: 'heroicons_outline:shield-check',
      title: 'Tedavi ve aşı takvimi kaçmaz',
      text: 'Tedavi, aşı, ilaç ve dozları hayvan bazında kaydedin. Maliyet muhasebeye işlenir, veteriner ve personel aynı kaydı görür.',
      points: ['Hastalık, tedavi türü ve protokoller', 'Tedavi maliyetinin muhasebeye aktarımı', 'Yapay zekâ destekli veteriner ön değerlendirme'],
      image: 'tedaviler',
    },
    {
      key: 'verim',
      tab: 'Süt & Yapağı',
      icon: 'heroicons_outline:beaker',
      title: 'Sabah-akşam sağım verimi elinizin altında',
      text: 'Sağım verimini sürü veya hayvan bazında girin; günlük, haftalık ve toplam verim otomatik hesaplanır. Yapağı verimini de aynı ekrandan izleyin.',
      points: ['Sabah, öğle, akşam sağım kayıtları', 'Sürü ve hayvan bazlı verim', 'Günlük ortalama ve karşılaştırma'],
      image: 'verimler',
    },
    {
      key: 'rasyon',
      tab: 'Rasyon & Stok',
      icon: 'heroicons_outline:cube',
      title: 'Yem rasyonu ve stok kontrolü',
      text: 'Sürü gruplarına göre rasyon hazırlayın; kuru madde, enerji ve protein dengesi hesaplansın. Yem ve ilaç stoğu kritik seviyeye düşünce uyarı alın.',
      points: ['Hedef gruba göre rasyon hesaplama', 'Depo bazlı stok giriş/çıkış', 'Kritik stok uyarıları'],
      image: 'rasyon',
    },
    {
      key: 'muhasebe',
      tab: 'Muhasebe',
      icon: 'heroicons_outline:cash',
      title: 'Gelir, gider ve cari hesaplar',
      text: 'Süt satışından yem giderine kadar tüm hareketler kalem ve cari bazında. Net bakiyeyi ve kârlılığı anlık görün.',
      points: ['Gelir/gider kalemleri ve cariler', 'Hayvan satışlarının otomatik kaydı', 'Net bakiye ve dönem raporu'],
      image: 'muhasebe',
    },
    {
      key: 'raporlar',
      tab: 'Raporlar',
      icon: 'heroicons_outline:chart-pie',
      title: 'Çiftliğinizin röntgeni tek sayfada',
      text: 'Sürü demografisi, ırk dağılımı, döl verimi, gebelik başarısı, kasa durumu ve sağlık müdahaleleri. PDF olarak yazdırın, ortaklarınızla paylaşın.',
      points: ['Yaş grubu ve ırk dağılımı', 'Döl ve gebelik başarı oranı', 'Yazdırılabilir PDF rapor'],
      image: 'raporlar',
    },
    {
      key: 'kurban',
      tab: 'Kurbanlık',
      icon: 'heroicons_outline:calendar',
      title: 'Kurbanlık satış ve hisse yönetimi',
      text: 'Kurbanlıkları canlı ağırlık ve tahmini karkasla listeleyin, hisseleri ve kesim sırasını yönetin. Müşterilere ödeme bağlantısı ve WhatsApp bilgilendirmesi gönderin.',
      points: ['Hisse, kapora ve kesim randevusu', 'Tahmini karkas ve fiyat hesabı', 'Müşteriye ödeme bağlantısı'],
      image: 'kurbanlik',
    },
  ];

  activeKey = signal(this.showcases[0].key);
  active = computed(() => this.showcases.find((s) => s.key === this.activeKey()) ?? this.showcases[0]);

  readonly features: Feature[] = [
    { icon: 'heroicons_outline:sun', title: 'Sabah brifingi', text: 'Doğumlar, kontroller, aşılar ve görevler her sabah tek özette; WhatsApp ile tek tıkla paylaşın.' },
    { icon: 'heroicons_outline:qrcode', title: 'Küpe okuma & sayım', text: 'Kamera veya Bluetooth RFID okuyucuyla küpe okutun, padok ve sürü sayımını dakikalar içinde bitirin.' },
    { icon: 'heroicons_outline:status-offline', title: 'İnternetsiz çalışma', text: 'Merada çekmiyor mu? Kayıtlar cihazda tutulur, bağlantı gelince otomatik eşitlenir.' },
    { icon: 'heroicons_outline:microphone', title: 'Sesli asistan', text: 'Eliniz doluyken konuşarak kayıt girin; yapay zekâ asistanı sorularınızı yanıtlasın.' },
    { icon: 'heroicons_outline:user-group', title: 'Ekip ve roller', text: 'Yönetici, veteriner, muhasebe ve saha personeli: herkes yalnızca yetkili olduğu ekranları görür.' },
    { icon: 'heroicons_outline:clipboard-check', title: 'Görev paneli', text: 'Personele görev atayın, vadesini belirleyin, tamamlananları takip edin.' },
    { icon: 'heroicons_outline:library', title: 'TÜRKVET & teşvikler', text: 'TÜRKVET kayıtlarını ve hayvancılık destek başvurularınızı düzenli tutun.' },
    { icon: 'heroicons_outline:chip', title: 'IoT cihazlar', text: 'Tartı, sensör ve okuyucu cihazlarınızı bağlayın, verileri otomatik toplayın.' },
    { icon: 'heroicons_outline:switch-horizontal', title: 'Hayvan hareketleri', text: 'Padok ve sürü geçişleri, çiftliğe giriş-çıkışlar tarihçesiyle kayıt altında.' },
    { icon: 'heroicons_outline:photograph', title: 'Foto galeri', text: 'Hayvanların ve çiftliğin fotoğraflarını kayıtlarla birlikte saklayın.' },
    { icon: 'heroicons_outline:clock', title: 'Çiftlikte yapılanlar', text: 'Kim, ne zaman, ne yaptı? Tüm işlemler zaman çizelgesinde.' },
    { icon: 'heroicons_outline:refresh', title: 'Geri dönüşüm kutusu', text: 'Yanlışlıkla silinen kayıtlar kaybolmaz, tek tıkla geri alınır.' },
  ];

  readonly steps = [
    { icon: 'heroicons_outline:user-add', title: 'Ücretsiz hesap açın', text: 'E-posta ile bir dakikada kayıt olun. 14 gün boyunca tüm özellikler açık, kredi kartı gerekmez.' },
    { icon: 'heroicons_outline:collection', title: 'Sürünüzü ekleyin', text: 'Hayvanlarınızı tek tek ya da toplu girin. Irk, sürü ve padok tanımları hazır gelir.' },
    { icon: 'heroicons_outline:trending-up', title: 'Takip edin, kazanın', text: 'Doğum, tedavi, tartım ve verimi kaydedin; brifing ve raporlarla doğru kararı verin.' },
  ];

  readonly faqs = [
    { q: 'Deneme süresi ücretli mi, kart bilgisi istiyor musunuz?', a: 'Hayır. 14 günlük deneme tamamen ücretsizdir ve kredi kartı istenmez. Süre bitince dilediğiniz paketi seçerek devam edebilirsiniz; verileriniz silinmez.' },
    { q: 'Hangi cihazlarda kullanabilirim?', a: 'OdivonFARM tarayıcıda çalışır; telefon, tablet ve bilgisayardan kurulum gerektirmeden kullanabilirsiniz. Ekran her cihaza göre uyarlanır.' },
    { q: 'İnternet olmayan yerde kayıt girebilir miyim?', a: 'Evet. Bağlantı yokken girdiğiniz kayıtlar cihazınızda saklanır ve internet geldiğinde otomatik olarak buluta eşitlenir.' },
    { q: 'Verilerim güvende mi?', a: 'Tüm bağlantılar şifrelidir ve verileriniz bulutta yedeklenir. Her çiftliğin verisi yalnızca o çiftliğin yetkili kullanıcılarına açıktır.' },
    { q: 'Hangi hayvan türleri için uygun?', a: 'Öncelikli olarak koyun ve keçi işletmeleri için tasarlandı; ırk ve hayvan tipi tanımlarıyla farklı küçükbaş ve büyükbaş işletmelere de uyarlanabilir.' },
    { q: 'Personelim ve veterinerim de kullanabilir mi?', a: 'Evet. Paketinize göre birden fazla kullanıcı ekleyebilir, her birine yönetici, veteriner, muhasebe veya personel gibi roller verebilirsiniz.' },
  ];

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled.set(window.scrollY > 12);
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.lightbox.set(null);
    this.mobileMenuOpen.set(false);
  }

  img(name: string) {
    return `images/landing/${name}.webp`;
  }

  openImage(name: string, alt: string) {
    this.lightbox.set({ src: this.img(name), alt });
  }

  toggleFaq(i: number) {
    this.openFaq.update((v) => (v === i ? null : i));
  }

  toggleTheme() {
    this.isDark.update((v) => !v);
    try {
      localStorage.setItem(THEME_KEY, this.isDark() ? 'dark' : 'light');
    } catch {
      /* tarayıcı depolaması kapalı olabilir */
    }
  }

  private readInitialTheme(): boolean {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'dark' || saved === 'light') return saved === 'dark';
    } catch {
      /* yoksay */
    }
    return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  }
}
