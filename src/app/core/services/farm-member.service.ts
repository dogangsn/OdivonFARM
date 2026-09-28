import { Injectable, inject } from '@angular/core';
import { FarmCrudService } from './farm-crud.service';
import { FarmMember, AppRole } from '../models/farm.model';
import { EmailService } from './email.service';
import { AuthService } from '../auth/auth.service';

/**
 * Çiftlik üyeleri Main API'de aynı çiftliğe (tenant) bağlı kullanıcılardır; üye kartı
 * `farmMembers/{uid}` rolü tutar. Ekleme, rol değişikliği ve çıkarma yalnızca yönetici
 * tarafından ve üye uç noktalarından (`/farm/members`) yapılır.
 */
@Injectable({ providedIn: 'root' })
export class FarmMemberService extends FarmCrudService<FarmMember> {
  private emailService = inject(EmailService);
  private authService = inject(AuthService);

  constructor() {
    super('members');
  }

  /**
   * Çiftliğe yeni bir kullanıcı/üye ekler: sunucu hesabı oluşturur, kullanıcı ilk girişte
   * "Şifremi Unuttum" ile şifresini belirler. Aynı e-postayla kayıtlı bir hesap varsa hata döner.
   */
  async addFarmMember(member: {
    email: string;
    displayName: string;
    role: AppRole;
    phone?: string;
    title?: string;
    notes?: string;
    invitedBy?: string;
  }): Promise<string> {
    const cleanEmail = member.email.trim().toLowerCase();
    const result = await this.api.post<{ id: string; resetLink: string }>('/farm/members', {
      email: cleanEmail,
      displayName: member.displayName.trim(),
      role: member.role,
      phone: member.phone?.trim() || undefined,
      title: member.title?.trim() || undefined,
      notes: member.notes?.trim() || undefined,
    });
    this.refresh();

    // Davet e-postasını arka planda asenkron olarak kuyruğa ekle
    const activeFarm = this.farmContext.activeFarm();
    const currentUser = this.authService.currentUser;
    const farmName = activeFarm?.name || this.farmContext.cachedFarmName() || 'Çiftlik';
    const invitedByName = currentUser?.displayName || currentUser?.email || 'Çiftlik Yöneticisi';

    this.emailService
      .sendInvitationEmail({
        email: cleanEmail,
        displayName: member.displayName.trim(),
        farmName,
        role: member.role,
        invitedByName,
      })
      .catch((err) => console.warn('[FarmMemberService] Davet e-postası kuyruğa eklenemedi:', err));

    return result.id;
  }

  /** Üyenin iletişim bilgilerini (ad, telefon, unvan, not) günceller. */
  override async update(memberId: string, data: Partial<FarmMember>): Promise<void> {
    await this.api.patch(`/farm/members/${encodeURIComponent(memberId)}`, {
      displayName: data.displayName,
      phone: data.phone,
      title: data.title,
      notes: data.notes,
    });
    this.refresh();
  }

  /**
   * Çiftlik üyesinin rolünü günceller. Son adminin rolünün düşürülmesini sunucu engeller.
   */
  async updateMemberRole(memberId: string, newRole: AppRole): Promise<void> {
    await this.api.patch(`/farm/members/${encodeURIComponent(memberId)}/role`, { role: newRole });
    this.refresh();
  }

  /**
   * Çiftlikten üye çıkarır (üye kartı geri dönüşüme taşınır, hesabı pasifleştirilir).
   * Son adminin çıkarılmasını sunucu engeller.
   */
  async removeMemberFromFarm(memberId: string): Promise<void> {
    await this.api.delete(`/farm/members/${encodeURIComponent(memberId)}`);
    this.refresh();
  }
}
