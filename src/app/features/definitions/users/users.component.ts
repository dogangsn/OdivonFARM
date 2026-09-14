import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import { FarmMemberService } from '../../../core/services/farm-member.service';
import { FarmContextService } from '../../../core/services/farm-context.service';
import { AlertService } from '../../../core/services/alert.service';
import { FarmMember, AppRole, ROLE_CATALOG, RoleCatalogItem } from '../../../core/models/farm.model';

import { Router } from '@angular/router';
import { SubscriptionService } from '../../../core/services/subscription.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent implements OnInit, OnDestroy {
  private memberService = inject(FarmMemberService);
  protected farmContext = inject(FarmContextService);
  protected subService = inject(SubscriptionService);
  private alertService = inject(AlertService);
  private router = inject(Router);

  private sub: Subscription | null = null;

  // Signals
  members = signal<FarmMember[]>([]);
  loading = signal<boolean>(true);
  searchTerm = signal<string>('');
  selectedRoleFilter = signal<string>('all');
  viewMode = signal<'grid' | 'table'>('grid');

  // Modal State
  isModalOpen = signal<boolean>(false);
  isRoleChangeModalOpen = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  editingMember = signal<FarmMember | null>(null);

  // Form Model
  formModel = {
    displayName: '',
    email: '',
    phone: '',
    title: '',
    role: 'saha' as AppRole,
    notes: '',
  };

  // Quick Role Change Form
  selectedMemberForRoleChange = signal<FarmMember | null>(null);
  newRoleSelection = signal<AppRole>('saha');

  // Role Catalog Reference
  readonly roleCatalog = ROLE_CATALOG;
  readonly roleList: RoleCatalogItem[] = Object.values(ROLE_CATALOG);

  // Computed metrics
  metrics = computed(() => {
    const list = this.members();
    return {
      total: list.length,
      admins: list.filter((m) => m.role === 'admin').length,
      vets: list.filter((m) => m.role === 'veteriner').length,
      fieldStaff: list.filter((m) => m.role === 'saha').length,
      managers: list.filter((m) => m.role === 'yonetici').length,
      accounting: list.filter((m) => m.role === 'muhasebe').length,
    };
  });

  // Filtered members
  filteredMembers = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    const roleFilter = this.selectedRoleFilter();

    return this.members().filter((m) => {
      // Role filter
      if (roleFilter !== 'all' && m.role !== roleFilter) {
        return false;
      }

      // Search query
      if (!query) return true;

      const name = (m.displayName || '').toLowerCase();
      const email = (m.email || '').toLowerCase();
      const title = (m.title || '').toLowerCase();
      const phone = (m.phone || '').toLowerCase();
      const roleName = (ROLE_CATALOG[m.role]?.label || '').toLowerCase();

      return (
        name.includes(query) ||
        email.includes(query) ||
        title.includes(query) ||
        phone.includes(query) ||
        roleName.includes(query)
      );
    });
  });

  ngOnInit() {
    this.sub = this.memberService.list().subscribe({
      next: (list) => {
        this.members.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('[UsersComponent] Error loading members:', err);
        this.loading.set(false);
      },
    });
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  getRoleInfo(role: AppRole): RoleCatalogItem {
    return this.roleCatalog[role] || this.roleCatalog.okuyucu;
  }

  getInitials(name?: string, email?: string): string {
    const target = name?.trim() || email?.split('@')[0] || 'KU';
    const parts = target.split(' ').filter(Boolean);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return target.slice(0, 2).toUpperCase();
  }

  getAvatarGradient(role: AppRole): string {
    switch (role) {
      case 'admin':
        return 'from-rose-500 to-red-600 shadow-rose-500/20';
      case 'yonetici':
        return 'from-indigo-500 to-purple-600 shadow-indigo-500/20';
      case 'veteriner':
        return 'from-emerald-500 to-teal-600 shadow-emerald-500/20';
      case 'saha':
        return 'from-amber-500 to-orange-600 shadow-amber-500/20';
      case 'muhasebe':
        return 'from-cyan-500 to-blue-600 shadow-cyan-500/20';
      default:
        return 'from-slate-500 to-gray-600 shadow-slate-500/20';
    }
  }

  // --- Modal Operations ---

  openCreateModal() {
    if (!this.subService.canAddMember(this.members().length)) {
      this.alertService.confirm(
        'Kullanıcı Kotanız Doldu',
        `Mevcut paketiniz en fazla ${this.subService.userLimit()} kullanıcıya izin vermektedir. Yeni personel eklemek için paketinizi yükseltebilirsiniz.`,
        'Paketi Yükselt',
        'Vazgeç'
      ).then((confirmed) => {
        if (confirmed) {
          this.router.navigate(['/abonelik']);
        }
      });
      return;
    }

    this.editingMember.set(null);
    this.formModel = {
      displayName: '',
      email: '',
      phone: '',
      title: '',
      role: 'saha',
      notes: '',
    };
    this.isModalOpen.set(true);
  }

  openEditModal(member: FarmMember) {
    this.editingMember.set(member);
    this.formModel = {
      displayName: member.displayName || '',
      email: member.email || '',
      phone: member.phone || '',
      title: member.title || '',
      role: member.role || 'saha',
      notes: member.notes || '',
    };
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.editingMember.set(null);
  }

  async saveMember() {
    if (!this.formModel.displayName.trim()) {
      this.alertService.error('Eksik Bilgi', 'Lütfen kullanıcının adını ve soyadını giriniz.');
      return;
    }

    if (!this.formModel.email.trim()) {
      this.alertService.error('Eksik Bilgi', 'Lütfen geçerli bir e-posta adresi giriniz.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.formModel.email.trim())) {
      this.alertService.error('Geçersiz E-posta', 'Lütfen standart formatta bir e-posta adresi giriniz.');
      return;
    }

    this.isSubmitting.set(true);
    const editing = this.editingMember();

    try {
      if (editing && editing.id) {
        // Rol değişikliği var mı kontrol et
        if (editing.role !== this.formModel.role) {
          await this.memberService.updateMemberRole(editing.id, this.formModel.role);
        }

        await this.memberService.update(editing.id, {
          displayName: this.formModel.displayName.trim(),
          phone: this.formModel.phone.trim(),
          title: this.formModel.title.trim(),
          notes: this.formModel.notes.trim(),
        });

        this.alertService.toastSuccess('Kullanıcı bilgileri başarıyla güncellendi.');
      } else {
        await this.memberService.addFarmMember({
          displayName: this.formModel.displayName.trim(),
          email: this.formModel.email.trim(),
          phone: this.formModel.phone.trim(),
          title: this.formModel.title.trim(),
          role: this.formModel.role,
          notes: this.formModel.notes.trim(),
        });

        this.alertService.toastSuccess(`"${this.formModel.displayName}" çiftliğe başarıyla eklendi.`);
      }

      this.closeModal();
    } catch (err: any) {
      console.error('[UsersComponent] save error:', err);
      this.alertService.error('İşlem Başarısız', err?.message || 'Kullanıcı kaydedilirken bir hata oluştu.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  // --- Quick Role Change ---

  openRoleChangeModal(member: FarmMember) {
    this.selectedMemberForRoleChange.set(member);
    this.newRoleSelection.set(member.role);
    this.isRoleChangeModalOpen.set(true);
  }

  closeRoleChangeModal() {
    this.isRoleChangeModalOpen.set(false);
    this.selectedMemberForRoleChange.set(null);
  }

  async saveRoleChange() {
    const member = this.selectedMemberForRoleChange();
    if (!member || !member.id) return;

    const newRole = this.newRoleSelection();
    if (newRole === member.role) {
      this.closeRoleChangeModal();
      return;
    }

    this.isSubmitting.set(true);
    try {
      await this.memberService.updateMemberRole(member.id, newRole);
      const roleInfo = this.getRoleInfo(newRole);
      this.alertService.toastSuccess(
        `${member.displayName} kullanıcısının rolü "${roleInfo.label}" olarak güncellendi.`
      );
      this.closeRoleChangeModal();
    } catch (err: any) {
      this.alertService.error('Rol Güncellenemedi', err?.message || 'Yetki değişikliği yapılamadı.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  // --- Delete Member ---

  async removeMember(member: FarmMember) {
    if (!member || !member.id) return;

    const confirmed = await this.alertService.confirm(
      'Kullanıcı Çiftlikten Çıkarılsın mı?',
      `"${member.displayName || member.email}" adlı kullanıcı bu çiftlikten çıkarılacak. Çiftlik verilerine erişimi kesilecektir. Devam etmek istiyor musunuz?`,
      'Evet, Çıkar',
      'İptal'
    );

    if (!confirmed) return;

    try {
      await this.memberService.removeMemberFromFarm(member.id);
      this.alertService.toastSuccess(`"${member.displayName}" çiftlikten çıkarıldı.`);
    } catch (err: any) {
      this.alertService.error('Hata', err?.message || 'Kullanıcı çıkarılırken bir hata oluştu.');
    }
  }
}
