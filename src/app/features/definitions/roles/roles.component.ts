import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import { FarmMemberService } from '../../../core/services/farm-member.service';
import { FarmContextService } from '../../../core/services/farm-context.service';
import { ROLE_CATALOG, RoleCatalogItem, AppRole, FarmMember } from '../../../core/models/farm.model';

interface PermissionMatrixRow {
  module: string;
  action: string;
  admin: boolean;
  yonetici: boolean;
  veteriner: boolean;
  saha: boolean;
  muhasebe: boolean;
  okuyucu: boolean;
}

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.scss',
})
export class RolesComponent implements OnInit, OnDestroy {
  private memberService = inject(FarmMemberService);
  protected farmContext = inject(FarmContextService);
  private router = inject(Router);

  private sub: Subscription | null = null;
  members = signal<FarmMember[]>([]);
  loading = signal<boolean>(true);

  readonly roleCatalog = ROLE_CATALOG;
  readonly roleList: RoleCatalogItem[] = Object.values(ROLE_CATALOG);

  // Active role filter in matrix view
  selectedTab = signal<'cards' | 'matrix'>('cards');

  // Member count per role
  roleMemberCounts = computed(() => {
    const counts: Record<string, number> = {};
    for (const r of this.roleList) {
      counts[r.key] = 0;
    }
    for (const m of this.members()) {
      if (counts[m.role] !== undefined) {
        counts[m.role]++;
      }
    }
    return counts;
  });

  // Permissions Matrix
  readonly matrixRows: PermissionMatrixRow[] = [
    { module: 'Sistem & Çiftlik', action: 'Çiftlik Adı ve Bilgilerini Güncelleme', admin: true, yonetici: false, veteriner: false, saha: false, muhasebe: false, okuyucu: false },
    { module: 'Sistem & Çiftlik', action: 'Kullanıcı Ekleme / Çıkarma / Rol Değiştirme', admin: true, yonetici: false, veteriner: false, saha: false, muhasebe: false, okuyucu: false },
    { module: 'Sistem & Çiftlik', action: 'Geri Dönüşüm Kutusu & Kalıcı Veri Silme', admin: true, yonetici: false, veteriner: false, saha: false, muhasebe: false, okuyucu: false },
    
    { module: 'Hayvan Yönetimi', action: 'Hayvan Kaydı, Düzenleme ve Küpeleme', admin: true, yonetici: true, veteriner: true, saha: false, muhasebe: false, okuyucu: false },
    { module: 'Hayvan Yönetimi', action: 'Sürü ve Padok Değişim Hareketleri', admin: true, yonetici: true, veteriner: true, saha: true, muhasebe: false, okuyucu: false },
    { module: 'Hayvan Yönetimi', action: 'Canlı Ağırlık ve Tartım Kayıtları', admin: true, yonetici: true, veteriner: true, saha: true, muhasebe: false, okuyucu: false },
    
    { module: 'Sağlık & Medikal', action: 'Tedavi Başlatma, İlaç ve Protokol Girişi', admin: true, yonetici: true, veteriner: true, saha: false, muhasebe: false, okuyucu: false },
    { module: 'Sağlık & Medikal', action: 'Aşı Takvimi ve Hastalık Teşhisleri', admin: true, yonetici: false, veteriner: true, saha: false, muhasebe: false, okuyucu: false },
    
    { module: 'Üreme & Döl Verimi', action: 'Tohumlama, Muayene ve Doğum Kaydı', admin: true, yonetici: true, veteriner: true, saha: false, muhasebe: false, okuyucu: false },
    
    { module: 'Saha & Operasyon', action: 'Karekod / Barkod ile Sayım Operasyonu', admin: true, yonetici: true, veteriner: true, saha: true, muhasebe: false, okuyucu: false },
    { module: 'Saha & Operasyon', action: 'Günlük Görevleri Tamamlama', admin: true, yonetici: true, veteriner: true, saha: true, muhasebe: false, okuyucu: false },
    
    { module: 'Finans & Muhasebe', action: 'Cari Hesap Açılışı ve Bakiye Yönetimi', admin: true, yonetici: false, veteriner: false, saha: false, muhasebe: true, okuyucu: false },
    { module: 'Finans & Muhasebe', action: 'Gelir, Gider ve Kasa Hareketleri', admin: true, yonetici: false, veteriner: false, saha: false, muhasebe: true, okuyucu: false },
    
    { module: 'Envanter & Stok', action: 'Stok Giriş / Çıkış ve Transferleri', admin: true, yonetici: true, veteriner: true, saha: false, muhasebe: true, okuyucu: false },
    { module: 'Envanter & Stok', action: 'Rasyon ve Yem Tüketim Planları', admin: true, yonetici: true, veteriner: true, saha: false, muhasebe: false, okuyucu: false },
    
    { module: 'Tanımlamalar', action: 'Irk, Tip, Padok, Tedavi ve Aşı Türleri Ekleme', admin: true, yonetici: true, veteriner: false, saha: false, muhasebe: false, okuyucu: false },
    { module: 'Raporlar & Analiz', action: 'Tüm Rapor ve Çiftlik Verilerini İnceleme', admin: true, yonetici: true, veteriner: true, saha: true, muhasebe: true, okuyucu: true },
  ];

  ngOnInit() {
    this.sub = this.memberService.list().subscribe({
      next: (list) => {
        this.members.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
  }

  viewMembersWithRole(roleKey: AppRole) {
    this.router.navigate(['/tanimlamalar/kullanicilar']);
  }
}
