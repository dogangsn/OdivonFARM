import { Component, computed, inject, signal, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { FarmContextService } from '../../../core/services/farm-context.service';

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
  farmContext = inject(FarmContextService);

  searchQuery = signal('');

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
    console.log('>>> [SHELL] toggleUserMenu called! previous:', this.userMenuOpen());
    if (event) {
      event.stopPropagation();
    }
    const next = !this.userMenuOpen();
    this.closeAllMenus();
    this.userMenuOpen.set(next);
    console.log('>>> [SHELL] userMenuOpen is now:', this.userMenuOpen());
    this.cdr.detectChanges();
  }

  toggleNotifications(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    const next = !this.notificationsOpen();
    this.closeAllMenus();
    this.notificationsOpen.set(next);
    this.cdr.detectChanges();
  }

  toggleFarmMenu(event?: Event) {
    if (event) {
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

  firebaseUser = toSignal(this.auth.authState$, { initialValue: null });
  appUser = toSignal(this.auth.appUser$, { initialValue: null });
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
    return (
      this.appUser()?.displayName ||
      this.firebaseUser()?.displayName ||
      this.firebaseUser()?.email?.split('@')[0] ||
      'Yönetici'
    );
  });

  userEmail = computed(() => {
    return (
      this.appUser()?.email ||
      this.firebaseUser()?.email ||
      'admin@odivonfarm.com'
    );
  });

  userRole = computed(() => {
    const memberships = this.appUser()?.memberships;
    const activeFarm = this.farmContext.activeFarmId();
    if (memberships && activeFarm) {
      const m = memberships.find((x) => x.farmId === activeFarm);
      if (m?.role === 'admin' || m?.role === 'yonetici') return 'Çiftlik Yöneticisi';
      if (m?.role === 'veteriner') return 'Veteriner Hekim';
      if (m?.role === 'saha') return 'Saha Personeli';
      if (m?.role === 'muhasebe') return 'Muhasebe Sorumlusu';
      if (m?.role === 'okuyucu') return 'Gözlemci';
    }
    return 'Çiftlik Yöneticisi';
  });

  userInitials = computed(() => {
    const name = this.userDisplayName();
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase() || 'YÖ';
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
