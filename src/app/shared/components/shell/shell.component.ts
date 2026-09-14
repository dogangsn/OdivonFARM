import { Component, computed, inject, signal, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, of, catchError } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { FarmContextService } from '../../../core/services/farm-context.service';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { AlertService } from '../../../core/services/alert.service';
import Swal from 'sweetalert2';

export interface NavItem {
  label: string;
  icon: string;
  route?: string;
  badge?: string;
  badgeColor?: string;
  children?: NavItem[];
}

export interface NavGroup {
  title?: string;
  items: NavItem[];
}

/**
 * Fuse v17 esintili ultra-modern uygulama kabuğu (Layout).
 * Klasik koyu lacivert/slate dikey navigasyon barı, açık renkli üst bar,
 * kullanıcı kartı, çiftlik seçici ve akıcı sayfa geçişleri.
 */
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private alertService = inject(AlertService);
  farmContext = inject(FarmContextService);
  subService = inject(SubscriptionService);

  searchQuery = signal('');

  async renameCurrentFarm() {
    this.closeAllMenus();
    const currentName = this.farmContext.activeFarmName();
    const isDark = document.documentElement.classList.contains('dark');

    const { value: newName } = await Swal.fire({
      title: 'Çiftlik Adını Düzenle',
      input: 'text',
      inputValue: currentName,
      inputPlaceholder: 'Örn: Anadolu Çiftliği, Özkan Hayvancılık...',
      showCancelButton: true,
      confirmButtonText: 'Kaydet',
      cancelButtonText: 'Vazgeç',
      confirmButtonColor: '#4f46e5',
      background: isDark ? '#1e293b' : '#ffffff',
      color: isDark ? '#f8fafc' : '#0f172a',
      inputValidator: (val) => {
        if (!val || !val.trim()) {
          return 'Lütfen geçerli bir çiftlik adı giriniz.';
        }
        return null;
      },
    });

    if (newName && newName.trim() && newName.trim() !== currentName) {
      const success = await this.farmContext.updateFarmName(newName.trim());
      if (success) {
        this.alertService.toastSuccess(`Çiftlik adı "${newName.trim()}" olarak güncellendi!`);
      } else {
        this.alertService.error('Hata', 'Çiftlik adı güncellenemedi.');
      }
    }
  }

  switchFarm(farmId: string, farmName?: string) {
    this.farmContext.setActiveFarm(farmId, farmName);
    this.closeAllMenus();
    this.alertService.toastSuccess(`Aktif çiftlik seçildi: ${farmName || farmId}`);
  }

  onSearchInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  onSearch(event?: Event) {
    if (event) {
      event.preventDefault();
    }
    const q = this.searchQuery().trim();
    if (q) {
      this.router.navigate(['/hayvanlar'], { queryParams: { q } });
    } else {
      this.router.navigate(['/hayvanlar']);
    }
  }

  userMenuOpen = signal(false);
  notificationsOpen = signal(false);
  farmMenuOpen = signal(false);

  toggleUserMenu(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const next = !this.userMenuOpen();
    this.closeAllMenus();
    this.userMenuOpen.set(next);
    this.cdr.detectChanges();
  }

  toggleNotifications(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const next = !this.notificationsOpen();
    this.closeAllMenus();
    this.notificationsOpen.set(next);
    this.cdr.detectChanges();
  }

  toggleFarmMenu(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const next = !this.farmMenuOpen();
    this.closeAllMenus();
    this.farmMenuOpen.set(next);
    this.cdr.detectChanges();
  }

  closeAllMenus() {
    this.userMenuOpen.set(false);
    this.notificationsOpen.set(false);
    this.farmMenuOpen.set(false);
    this.cdr.detectChanges();
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.closeAllMenus();
      this.mobileMenuOpen.set(false);
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      const input = document.getElementById('global-search-input') as HTMLInputElement;
      input?.focus();
      input?.select();
    }
  }

  private getStoredCollapsedState(): boolean {
    try {
      return localStorage.getItem('odivon_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  }

  firebaseUser = toSignal(this.auth.authState$.pipe(catchError(() => of(null))), {
    initialValue: null,
  });
  appUser = toSignal(this.auth.appUser$.pipe(catchError(() => of(null))), {
    initialValue: null,
  });
  sidebarCollapsed = signal(this.getStoredCollapsedState());
  mobileMenuOpen = signal(false);
  definitionsExpanded = signal(false);
  currentUrl = signal(this.router.url);

  constructor() {
    (window as any).odivonShell = this;
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        if (this.currentUrl() !== e.urlAfterRedirects) {
          this.currentUrl.set(e.urlAfterRedirects);
          this.mobileMenuOpen.set(false);
          this.closeAllMenus();
        }
      });
  }

  userDisplayName = computed(() => {
    try {
      return (
        this.appUser()?.displayName ||
        this.firebaseUser()?.displayName ||
        this.firebaseUser()?.email?.split('@')[0] ||
        'admin'
      );
    } catch {
      return 'admin';
    }
  });

  userEmail = computed(() => {
    try {
      return (
        this.appUser()?.email ||
        this.firebaseUser()?.email ||
        'admin@odivonfarm.com'
      );
    } catch {
      return 'admin@odivonfarm.com';
    }
  });

  userRole = computed(() => {
    try {
      const memberships = this.appUser()?.memberships;
      const activeFarm = this.farmContext.activeFarmId();
      if (memberships && activeFarm) {
        const m = memberships.find((x) => x.farmId === activeFarm);
        if (m?.role === 'admin') return 'Yönetici (Admin)';
        if (m?.role === 'yonetici') return 'İşletme Müdürü';
        if (m?.role === 'veteriner') return 'Veteriner Hekim';
        if (m?.role === 'saha') return 'Saha Personeli';
        if (m?.role === 'muhasebe') return 'Muhasebe Sorumlusu';
        if (m?.role === 'okuyucu') return 'Gözlemci';
      }
    } catch {}
    return 'Yönetici (Admin)';
  });

  userInitials = computed(() => {
    try {
      const name = this.userDisplayName();
      const parts = name.trim().split(' ').filter(Boolean);
      if (parts.length >= 2 && parts[0] && parts[1]) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase() || 'AD';
    } catch {
      return 'AD';
    }
  });

  navGroups: NavGroup[] = [
    {
      title: 'GENEL YÖNETİM',
      items: [
        { label: 'Anasayfa', icon: 'heroicons_outline:home', route: '/anasayfa' },
        { label: 'Hayvanlar', icon: 'heroicons_outline:identification', route: '/hayvanlar', badge: 'Canlı', badgeColor: 'bg-emerald-500' },
        { label: 'Hayvan Hareketleri', icon: 'heroicons_outline:switch-horizontal', route: '/hayvan-hareketleri' },
        { label: 'Canlı Ağırlık', icon: 'heroicons_outline:scale', route: '/canli-agirlik' },
        { label: 'Çiftleşmeler', icon: 'heroicons_outline:heart', route: '/ciftlesmeler' },
      ],
    },
    {
      title: 'OPERASYON & SAĞLIK',
      items: [
        { label: 'Tedaviler & Aşı', icon: 'heroicons_outline:shield-check', route: '/tedaviler' },
        { label: 'Görevler Paneli', icon: 'heroicons_outline:clipboard-check', route: '/gorevler' },
        { label: 'Sayım Operasyonları', icon: 'heroicons_outline:qrcode', route: '/sayim' },
        { label: 'Verimler (Süt/Yapağı)', icon: 'heroicons_outline:beaker', route: '/verimler' },
        { label: 'Foto Galeri', icon: 'heroicons_outline:photograph', route: '/galeri' },
        { label: 'Çiftlikte Yapılanlar', icon: 'heroicons_outline:clock', route: '/aktiviteler' },
      ],
    },
    {
      title: 'ENVANTER & FİNANS',
      items: [
        { label: 'Stok Giriş / Çıkış', icon: 'heroicons_outline:cube', route: '/stok' },
        { label: 'Rasyon & Yem', icon: 'heroicons_outline:cake', route: '/rasyon' },
        { label: 'Muhasebe', icon: 'heroicons_outline:cash', route: '/muhasebe' },
        { label: 'Sigortalı Hayvanlar', icon: 'heroicons_outline:document-text', route: '/sigortali-hayvanlar' },
        { label: 'Raporlar', icon: 'heroicons_outline:chart-pie', route: '/raporlar' },
      ],
    },
    {
      title: 'SİSTEM & AYARLAR',
      items: [
        {
          label: 'Tanımlamalar',
          icon: 'heroicons_outline:adjustments',
          children: [
            { label: 'Kullanıcılar', icon: 'heroicons_outline:users', route: '/tanimlamalar/kullanicilar' },
            { label: 'Roller & Yetkiler', icon: 'heroicons_outline:shield-check', route: '/tanimlamalar/roller' },
            { label: 'Cariler', icon: 'heroicons_outline:user-group', route: '/tanimlamalar/cariler' },
            { label: 'Irklar', icon: 'heroicons_outline:sparkles', route: '/tanimlamalar/irklar' },
            { label: 'Hayvan Tipleri', icon: 'heroicons_outline:tag', route: '/tanimlamalar/hayvan-tipleri' },
            { label: 'Sürüler', icon: 'heroicons_outline:collection', route: '/tanimlamalar/suruler' },
            { label: 'Padoklar', icon: 'heroicons_outline:view-boards', route: '/tanimlamalar/padoklar' },
            { label: 'Tedavi Türleri', icon: 'heroicons_outline:shield-check', route: '/tanimlamalar/tedavi-turleri' },
            { label: 'Hastalıklar', icon: 'heroicons_outline:exclamation-circle', route: '/tanimlamalar/hastaliklar' },
            { label: 'Referanslar', icon: 'heroicons_outline:phone', route: '/tanimlamalar/referanslar' },
            { label: 'Etiketler', icon: 'heroicons_outline:bookmark', route: '/tanimlamalar/etiketler' },
            { label: 'Ölüm Nedenleri', icon: 'heroicons_outline:ban', route: '/tanimlamalar/olum-nedenleri' },
            { label: 'Depolar', icon: 'heroicons_outline:office-building', route: '/tanimlamalar/depolar' },
            { label: 'Muhasebe Kalemleri', icon: 'heroicons_outline:receipt-refund', route: '/tanimlamalar/muhasebe-kalemleri' },
          ],
        },
        { label: 'Paketler & Abonelik', icon: 'heroicons_outline:credit-card', route: '/abonelik', badge: 'Plan', badgeColor: 'bg-gradient-to-r from-indigo-500 to-purple-600' },
        { label: 'Geri Dönüşüm', icon: 'heroicons_outline:trash', route: '/geri-donusum' },
      ],
    },
  ];

  toggleSidebar() {
    if (window.innerWidth < 1024) {
      this.mobileMenuOpen.update((v) => !v);
    } else {
      this.sidebarCollapsed.update((v) => {
        const next = !v;
        try {
          localStorage.setItem('odivon_sidebar_collapsed', String(next));
        } catch {}
        return next;
      });
    }
    this.cdr.detectChanges();
  }

  closeMobileMenu() {
    this.mobileMenuOpen.set(false);
    this.cdr.detectChanges();
  }

  isDefinitionsActive = computed(() => {
    return this.currentUrl().startsWith('/tanimlamalar');
  });

  onDefinitionsToggle(event: Event) {
    const details = event.target as HTMLDetailsElement;
    this.definitionsExpanded.set(details.open);
  }

  toggleDefinitions(event?: MouseEvent) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (this.sidebarCollapsed()) {
      this.sidebarCollapsed.set(false);
    }
    this.definitionsExpanded.update((v) => !v);
    this.cdr.detectChanges();
  }

  async logout() {
    try {
      await this.auth.logout();
    } catch (e) {
      console.warn('Logout error:', e);
    }
    this.router.navigateByUrl('/auth/login');
  }
}
