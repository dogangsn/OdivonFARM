import { Injectable, inject } from '@angular/core';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { FirestoreCrudService } from './firestore-crud.service';
import { FarmMember, AppRole, AppUser } from '../models/farm.model';
import { EmailService } from './email.service';
import { AuthService } from '../auth/auth.service';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FarmMemberService extends FirestoreCrudService<FarmMember> {
  private emailService = inject(EmailService);
  private authService = inject(AuthService);

  constructor() {
    super('members');
  }

  /**
   * Çiftliğe yeni bir kullanıcı/üye ekler.
   * Eğer sistemde bu e-posta ile kayıtlı bir kullanıcı varsa, onun da çiftlik üyeliklerine bu çiftliği ekler.
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
    const farmId = this.farmContext.requireActiveFarmId();
    const cleanEmail = member.email.trim().toLowerCase();

    // 1. Aynı e-postaya sahip aktif bir üye var mı kontrol et
    const currentMembers = await firstValueFrom(this.list());
    const existing = currentMembers.find(
      (m) => m.email.toLowerCase() === cleanEmail && !m.deletedAt
    );
    if (existing) {
      throw new Error(`"${cleanEmail}" e-posta adresine sahip bir kullanıcı bu çiftlikte zaten kayıtlı.`);
    }

    // 2. Sistemde (users koleksiyonunda) bu e-postaya sahip kullanıcı var mı ara
    let matchedUid: string | undefined;
    try {
      const usersCol = collection(this.db, 'users');
      const uq = query(usersCol, where('email', '==', cleanEmail));
      const uSnap = await getDocs(uq);
      if (!uSnap.empty) {
        const uDoc = uSnap.docs[0];
        matchedUid = uDoc.id;
        const uData = uDoc.data() as AppUser;
        const memberships = uData.memberships || [];
        const farmIdx = memberships.findIndex((m) => m.farmId === farmId);
        if (farmIdx >= 0) {
          memberships[farmIdx].role = member.role;
        } else {
          memberships.push({ farmId, role: member.role });
        }
        await updateDoc(doc(this.db, `users/${matchedUid}`), {
          memberships,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (uErr) {
      console.warn('[FarmMemberService] Kullanıcı profili ilişkilendirme uyarısı:', uErr);
    }

    // 3. farms/{farmId}/members dokümanını oluştur
    const newMember: Partial<FarmMember> = {
      uid: matchedUid || null as any,
      email: cleanEmail,
      displayName: member.displayName.trim(),
      phone: member.phone?.trim() || '',
      role: member.role,
      status: matchedUid ? 'active' : 'invited',
      title: member.title?.trim() || '',
      notes: member.notes?.trim() || '',
      invitedBy: member.invitedBy || this.farmContext.currentUid() || null as any,
    };

    const memberId = await this.create(newMember);

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

    return memberId;
  }

  /**
   * Çiftlik üyesinin rolünü günceller.
   * Son adminin rolünün düşürülmesini engeller.
   */
  async updateMemberRole(memberId: string, newRole: AppRole): Promise<void> {
    const farmId = this.farmContext.requireActiveFarmId();
    const currentMembers = await firstValueFrom(this.list());
    const target = currentMembers.find((m) => m.id === memberId);

    if (!target) {
      throw new Error('Üye bulunamadı.');
    }

    if (target.role === 'admin' && newRole !== 'admin') {
      const adminCount = currentMembers.filter(
        (m) => m.role === 'admin' && !m.deletedAt && m.id !== memberId
      ).length;
      if (adminCount === 0) {
        throw new Error('Çiftlikte en az bir Yönetici (Admin) bulunmalıdır. Son yöneticinin rolünü değiştiremezsiniz.');
      }
    }

    await this.update(memberId, { role: newRole });

    // Eğer bağlı bir uid varsa users/{uid} içindeki rolü de senkronize et
    if (target.uid) {
      try {
        const uRef = doc(this.db, `users/${target.uid}`);
        const usersCol = collection(this.db, 'users');
        const uSnap = await getDocs(query(usersCol, where('uid', '==', target.uid)));
        if (!uSnap.empty) {
          const uDoc = uSnap.docs[0];
          const uData = uDoc.data() as AppUser;
          const memberships = (uData.memberships || []).map((m) =>
            m.farmId === farmId ? { ...m, role: newRole } : m
          );
          await updateDoc(uDoc.ref, { memberships, updatedAt: serverTimestamp() });
        }
      } catch (syncErr) {
        console.warn('[FarmMemberService] users doc role sync warning:', syncErr);
      }
    }
  }

  /**
   * Çiftlikten üye çıkarır (soft-delete).
   * Son adminin çıkarılmasını engeller.
   */
  async removeMemberFromFarm(memberId: string): Promise<void> {
    const currentMembers = await firstValueFrom(this.list());
    const target = currentMembers.find((m) => m.id === memberId);

    if (!target) {
      throw new Error('Üye bulunamadı.');
    }

    if (target.role === 'admin') {
      const otherAdmins = currentMembers.filter(
        (m) => m.role === 'admin' && !m.deletedAt && m.id !== memberId
      );
      if (otherAdmins.length === 0) {
        throw new Error('Çiftlikte en az bir Yönetici (Admin) bulunmalıdır. Son yöneticiyi silemezsiniz.');
      }
    }

    await this.softDelete(memberId);
  }
}
