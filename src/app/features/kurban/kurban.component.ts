import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { toSignal } from '@angular/core/rxjs-interop';
import Swal from 'sweetalert2';

import { KurbanService } from '../../core/services/kurban.service';
import { AnimalService } from '../../core/services/animal.service';
import { WeightRecordService } from '../../core/services/weight-record.service';
import { FarmContextService } from '../../core/services/farm-context.service';
import { AlertService } from '../../core/services/alert.service';
import { EmailService } from '../../core/services/email.service';
import { KurbanAnimal, KurbanHisse } from '../../core/models/kurban.model';
import { Animal } from '../../core/models/animal.model';

@Component({
  selector: 'app-kurban',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './kurban.component.html',
  styleUrls: ['./kurban.component.scss'],
})
export class KurbanComponent {
  kurbanService = inject(KurbanService);
  private animalService = inject(AnimalService);
  private weightService = inject(WeightRecordService);
  private farmContext = inject(FarmContextService);
  private alertService = inject(AlertService);
  private emailService = inject(EmailService);

  readonly kurbanList = toSignal(this.kurbanService.list(), { initialValue: [] as KurbanAnimal[] });
  readonly animals = toSignal(this.animalService.list(), { initialValue: [] as Animal[] });
  readonly weights = toSignal(this.weightService.list(), { initialValue: [] });

  farmName = this.farmContext.activeFarmName;

  // Filters
  searchTerm = signal('');
  categoryFilter = signal<'all' | 'buyukbas' | 'kucukbas'>('all');
  statusFilter = signal<string>('all');

  // Add/Edit Kurban Animal Drawer
  showKurbanDrawer = signal(false);
  isEditingKurban = signal(false);
  editingKurbanId = signal<string | null>(null);
  isSaving = signal(false);
  kurbanErrorMessage = signal<string | null>(null);

  // Kurban Form
  kurbanForm = signal<{
    animalId: string;
    tagNo: string;
    animalName: string;
    category: 'buyukbas' | 'kucukbas';
    liveWeightKg: number;
    carcassYieldPercent: number;
    totalPrice: number;
    slaughterOrder: number;
    slaughterDay: number;
    slaughterTime: string;
    notes: string;
  }>({
    animalId: '',
    tagNo: '',
    animalName: '',
    category: 'buyukbas',
    liveWeightKg: 500,
    carcassYieldPercent: 57,
    totalPrice: 140000,
    slaughterOrder: 1,
    slaughterDay: 1,
    slaughterTime: '09:00',
    notes: '',
  });

  // Share Assign/Edit Modal State
  isShareModalOpen = signal(false);
  selectedKurbanForShare = signal<KurbanAnimal | null>(null);
  selectedShareIndex = signal<number>(0);
  shareForm = signal<KurbanHisse>({
    id: '1',
    hissedarName: '',
    phone: '',
    email: '',
    sharePrice: 20000,
    depositPaid: 5000,
    remainingPayment: 15000,
    meatPreference: 'standart_7_pay',
    isPaid: false,
    notes: '',
  });

  // KPI Calculations
  readonly stats = computed(() => {
    const list = this.kurbanList() || [];
    let totalShares = 0;
    let filledShares = 0;
    let totalRevenue = 0;
    let totalCollected = 0;
    let slaughteredCount = 0;

    for (const k of list) {
      totalShares += k.shareCount || 0;
      totalRevenue += k.totalPrice || 0;
      if (k.status === 'kesildi') slaughteredCount++;

      for (const s of k.shares || []) {
        if (s.hissedarName?.trim()) {
          filledShares++;
          totalCollected += Number(s.depositPaid) || 0;
          if (s.isPaid) {
            totalCollected += Number(s.remainingPayment) || 0;
          }
        }
      }
    }

    const emptyShares = totalShares - filledShares;
    const remainingReceivable = totalRevenue - totalCollected;

    return {
      totalKurbans: list.length,
      totalShares,
      filledShares,
      emptyShares,
      totalRevenue,
      totalCollected,
      remainingReceivable,
      slaughteredCount,
    };
  });

  // Filtered List
  readonly filteredKurbans = computed(() => {
    let list = this.kurbanList() || [];
    const query = (this.searchTerm() || '').trim().toLowerCase();
    const cat = this.categoryFilter();
    const st = this.statusFilter();

    if (cat !== 'all') {
      list = list.filter((k) => k.category === cat);
    }

    if (st !== 'all') {
      list = list.filter((k) => k.status === st);
    }

    if (query) {
      list = list.filter((k) => {
        const tag = (k.tagNo || '').toLowerCase();
        const name = (k.animalName || '').toLowerCase();
        const sharesMatch = (k.shares || []).some(
          (s) =>
            (s.hissedarName || '').toLowerCase().includes(query) ||
            (s.phone || '').includes(query)
        );
        return tag.includes(query) || name.includes(query) || sharesMatch;
      });
    }

    // Sort by slaughter order
    return list.sort((a, b) => (a.slaughterOrder || 0) - (b.slaughterOrder || 0));
  });

  // Available animals to enroll into Kurban
  readonly candidateAnimals = computed(() => {
    const enrolledIds = new Set(this.kurbanList().map((k) => k.animalId));
    return this.animals().filter(
      (a) => a.status === 'aktif' && (!enrolledIds.has(a.id!) || a.id === this.kurbanForm().animalId)
    );
  });

  onCandidateAnimalChange(animalId: string) {
    const animal = this.animals().find((a) => a.id === animalId);
    if (!animal) return;

    const tag = animal.farmTagNo || animal.nationalTagNo || '';
    const name = animal.name || '';

    // Check if small or large ruminant
    const typeName = (animal.animalTypeId || '').toLowerCase();
    const isSmall = typeName.includes('koyun') || typeName.includes('koç') || typeName.includes('keçi');
    const category = isSmall ? 'kucukbas' : 'buyukbas';
    const defaultWeight = isSmall ? 65 : 520;
    const defaultYield = isSmall ? 50 : 57;
    const defaultPrice = isSmall ? 18000 : 140000;

    this.kurbanForm.update((prev) => ({
      ...prev,
      animalId,
      tagNo: tag,
      animalName: name,
      category,
      liveWeightKg: defaultWeight,
      carcassYieldPercent: defaultYield,
      totalPrice: defaultPrice,
    }));
  }

  openAddKurbanDrawer() {
    this.isEditingKurban.set(false);
    this.editingKurbanId.set(null);
    this.kurbanErrorMessage.set(null);

    const firstAnimal = this.candidateAnimals()[0];
    const defaultTag = firstAnimal?.farmTagNo || firstAnimal?.nationalTagNo || '';
    const nextOrder = (this.kurbanList().length || 0) + 1;

    this.kurbanForm.set({
      animalId: firstAnimal?.id || '',
      tagNo: defaultTag,
      animalName: firstAnimal?.name || '',
      category: 'buyukbas',
      liveWeightKg: 540,
      carcassYieldPercent: 57,
      totalPrice: 140000,
      slaughterOrder: nextOrder,
      slaughterDay: 1,
      slaughterTime: '09:00',
      notes: '',
    });

    this.showKurbanDrawer.set(true);
  }

  openEditKurbanDrawer(k: KurbanAnimal) {
    this.isEditingKurban.set(true);
    this.editingKurbanId.set(k.id || null);
    this.kurbanErrorMessage.set(null);

    this.kurbanForm.set({
      animalId: k.animalId,
      tagNo: k.tagNo,
      animalName: k.animalName || '',
      category: k.category,
      liveWeightKg: k.liveWeightKg,
      carcassYieldPercent: k.carcassYieldPercent,
      totalPrice: k.totalPrice,
      slaughterOrder: k.slaughterOrder,
      slaughterDay: k.slaughterDay,
      slaughterTime: k.slaughterTime,
      notes: k.notes || '',
    });

    this.showKurbanDrawer.set(true);
  }

  closeKurbanDrawer() {
    this.showKurbanDrawer.set(false);
  }

  async saveKurbanAnimal() {
    const f = this.kurbanForm();
    if (!f.tagNo?.trim()) {
      this.kurbanErrorMessage.set('Lütfen geçerli bir hayvan seçiniz.');
      return;
    }
    if (!f.totalPrice || f.totalPrice <= 0) {
      this.kurbanErrorMessage.set('Lütfen toplam satış bedelini giriniz.');
      return;
    }

    this.isSaving.set(true);
    this.kurbanErrorMessage.set(null);

    const shareCount = f.category === 'buyukbas' ? 7 : 1;
    const sharePrice = Math.round(f.totalPrice / shareCount);
    const estimatedMeatKg = Number(((f.liveWeightKg * f.carcassYieldPercent) / 100).toFixed(1));

    try {
      if (this.isEditingKurban() && this.editingKurbanId()) {
        const existing = this.kurbanList().find((k) => k.id === this.editingKurbanId());
        // Update shares pricing proportionally if adjusted
        const updatedShares = (existing?.shares || []).map((s) => ({
          ...s,
          sharePrice,
          remainingPayment: Math.max(0, sharePrice - (s.depositPaid || 0)),
        }));

        await this.kurbanService.update(this.editingKurbanId()!, {
          animalId: f.animalId,
          tagNo: f.tagNo,
          animalName: f.animalName,
          category: f.category,
          liveWeightKg: f.liveWeightKg,
          carcassYieldPercent: f.carcassYieldPercent,
          estimatedMeatKg,
          totalPrice: f.totalPrice,
          sharePrice,
          slaughterOrder: f.slaughterOrder,
          slaughterDay: f.slaughterDay,
          slaughterTime: f.slaughterTime,
          shares: updatedShares,
          notes: f.notes,
        });

        this.alertService.toastSuccess('Kurbanlık kaydı güncellendi');
      } else {
        // Initialize empty shares
        const initialShares: KurbanHisse[] = [];
        for (let i = 1; i <= shareCount; i++) {
          initialShares.push({
            id: String(i),
            hissedarName: '',
            phone: '',
            sharePrice,
            depositPaid: 0,
            remainingPayment: sharePrice,
            meatPreference: 'standart_7_pay',
            isPaid: false,
          });
        }

        await this.kurbanService.create({
          animalId: f.animalId,
          tagNo: f.tagNo,
          animalName: f.animalName,
          category: f.category,
          liveWeightKg: f.liveWeightKg,
          carcassYieldPercent: f.carcassYieldPercent,
          estimatedMeatKg,
          shareCount,
          totalPrice: f.totalPrice,
          sharePrice,
          slaughterOrder: f.slaughterOrder,
          slaughterDay: f.slaughterDay,
          slaughterTime: f.slaughterTime,
          status: 'satista',
          shares: initialShares,
          notes: f.notes,
        } as any);

        this.alertService.toastSuccess('Kurbanlık başarıyla satış havuzuna eklendi');
      }

      this.closeKurbanDrawer();
    } catch (err: any) {
      console.error('Kurban kaydetme hatası:', err);
      this.kurbanErrorMessage.set(err?.message || 'Kurbanlık kaydedilemedi.');
    } finally {
      this.isSaving.set(false);
    }
  }

  // Share Management Modal
  openShareModal(k: KurbanAnimal, shareIndex: number) {
    this.selectedKurbanForShare.set(k);
    this.selectedShareIndex.set(shareIndex);

    const share = k.shares[shareIndex] || {
      id: String(shareIndex + 1),
      hissedarName: '',
      phone: '',
      email: '',
      sharePrice: k.sharePrice,
      depositPaid: 0,
      remainingPayment: k.sharePrice,
      meatPreference: 'standart_7_pay',
      isPaid: false,
    };

    const paymentLink = share.paymentLink || (k.id ? this.kurbanService.getPaymentLink(k.id, share.id) : '');

    this.shareForm.set({
      ...share,
      email: share.email || '',
      paymentLink,
    });
    this.isShareModalOpen.set(true);
  }

  closeShareModal() {
    this.isShareModalOpen.set(false);
    this.selectedKurbanForShare.set(null);
  }

  onDepositChange() {
    const s = this.shareForm();
    const deposit = Number(s.depositPaid) || 0;
    const price = Number(s.sharePrice) || 0;
    const remaining = Math.max(0, price - deposit);
    this.shareForm.update((prev) => ({
      ...prev,
      remainingPayment: remaining,
      isPaid: remaining === 0,
    }));
  }

  async saveShare() {
    const k = this.selectedKurbanForShare();
    const idx = this.selectedShareIndex();
    if (!k?.id) return;

    const shareData = { ...this.shareForm() };
    shareData.email = shareData.email?.trim() || '';
    shareData.paymentLink = this.kurbanService.getPaymentLink(k.id, shareData.id);
    shareData.paymentStatus = shareData.isPaid ? 'odendi' : (shareData.depositPaid > 0 ? 'kismi_odendi' : 'bekliyor');

    const updatedShares = [...(k.shares || [])];
    updatedShares[idx] = shareData;

    // Check if all shares are now filled
    const allFilled = updatedShares.every((s) => !!s.hissedarName?.trim());
    const nextStatus = allFilled ? 'tum_hisseler_doldu' : 'satista';

    try {
      await this.kurbanService.update(k.id, {
        shares: updatedShares,
        status: k.status === 'kesildi' ? 'kesildi' : nextStatus,
      });

      this.alertService.toastSuccess(
        shareData.hissedarName ? `${shareData.hissedarName} hisseye kaydedildi` : 'Hisse kaydı güncellendi'
      );

      this.closeShareModal();
    } catch (err: any) {
      this.alertService.error('Hata', 'Hissedar kaydedilemedi.');
    }
  }

  async removeShareholder(k: KurbanAnimal, shareIndex: number, event?: Event) {
    if (event) event.stopPropagation();
    const confirmed = await this.alertService.confirmDelete(
      'Hissedarı Kaldır',
      'Bu hissedarın kaydını hisse havuzundan çıkarmak istiyor musunuz?'
    );
    if (!confirmed || !k.id) return;

    const updatedShares = [...k.shares];
    updatedShares[shareIndex] = {
      id: String(shareIndex + 1),
      hissedarName: '',
      phone: '',
      email: '',
      sharePrice: k.sharePrice,
      depositPaid: 0,
      remainingPayment: k.sharePrice,
      meatPreference: 'standart_7_pay',
      isPaid: false,
    };

    try {
      await this.kurbanService.update(k.id, {
        shares: updatedShares,
        status: 'satista',
      });
      this.alertService.toastSuccess('Hisse boşaltıldı');
    } catch (err) {
      this.alertService.error('Hata', 'Hissedar silinemedi.');
    }
  }

  // Send WhatsApp Appointment Card & Payment Link
  sendWhatsApp(kurban: KurbanAnimal, hisse: KurbanHisse, event?: Event) {
    if (event) event.stopPropagation();
    if (!hisse.hissedarName) {
      this.alertService.error('Hata', 'Lütfen önce hissedar bilgilerini giriniz.');
      return;
    }
    this.kurbanService.openWhatsAppAppointment(kurban, hisse, this.farmName());
  }

  // Send SMS with Online Payment Link
  sendSMS(kurban: KurbanAnimal, hisse: KurbanHisse, event?: Event) {
    if (event) event.stopPropagation();
    if (!hisse.hissedarName) {
      this.alertService.error('Hata', 'Lütfen önce hissedar bilgilerini giriniz.');
      return;
    }
    this.kurbanService.openSms(kurban, hisse, this.farmName());
  }

  // Send Email with Online Payment Link
  async sendEmail(kurban: KurbanAnimal, hisse: KurbanHisse, event?: Event) {
    if (event) event.stopPropagation();
    if (!hisse.hissedarName) {
      this.alertService.error('Hata', 'Lütfen önce hissedar bilgilerini giriniz.');
      return;
    }
    if (!hisse.email?.trim()) {
      this.alertService.error('E-Posta Eksik', 'Lütfen hissedar kartından geçerli bir e-posta adresi kaydediniz.');
      return;
    }

    const paymentLink = hisse.paymentLink || (kurban.id ? this.kurbanService.getPaymentLink(kurban.id, hisse.id) : '');

    try {
      await this.emailService.sendKurbanPaymentEmail({
        email: hisse.email.trim(),
        hissedarName: hisse.hissedarName,
        farmName: this.farmName(),
        kurbanTagNo: kurban.tagNo,
        animalName: kurban.animalName,
        category: kurban.category,
        slaughterOrder: kurban.slaughterOrder,
        slaughterDay: kurban.slaughterDay,
        slaughterTime: kurban.slaughterTime,
        sharePrice: hisse.sharePrice,
        depositPaid: hisse.depositPaid,
        remainingPayment: hisse.remainingPayment,
        paymentLink,
        meatPreference: hisse.meatPreference,
      });

      this.alertService.toastSuccess(
        `${hisse.hissedarName} hissedarına (${hisse.email}) ödeme linki başarıyla gönderildi.`
      );
    } catch (err) {
      this.alertService.error('Hata', 'E-posta gönderimi yapılamadı.');
    }
  }

  // Copy Online Payment Link to Clipboard
  copyPaymentLink(kurban: KurbanAnimal, hisse: KurbanHisse, event?: Event) {
    if (event) event.stopPropagation();
    const url = hisse.paymentLink || (kurban.id ? this.kurbanService.getPaymentLink(kurban.id, hisse.id) : '');
    if (!url) return;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        this.alertService.toastSuccess('Online ödeme linki panoya kopyalandı.');
      }).catch(() => {
        this.alertService.error('Hata', 'Bağlantı panoya kopyalanamadı.');
      });
    }
  }

  // Mark as Slaughtered
  async markAsSlaughtered(k: KurbanAnimal) {
    const isDark = document.documentElement.classList.contains('dark');
    const confirm = await Swal.fire({
      title: 'Kesim Tamamlama Onayı',
      html: `
        <div class="text-left text-xs space-y-2">
          <p><strong>Kurban No:</strong> ${k.tagNo} (Sıra: ${k.slaughterOrder})</p>
          <p><strong>Toplam Et:</strong> ~${k.estimatedMeatKg} kg</p>
          <p><strong>Ciro:</strong> ${k.totalPrice.toLocaleString('tr-TR')} ₺</p>
          <p class="text-emerald-600 dark:text-emerald-400 font-bold mt-2">Hayvan kaydı "kesildi" durumuna alınacak ve kurban satışı muhasebeye gelir olarak işlenecektir. Onaylıyor musunuz?</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Evet, Kesim Tamamlandı',
      cancelButtonText: 'Vazgeç',
      confirmButtonColor: '#10b981',
      background: isDark ? '#1e293b' : '#ffffff',
      color: isDark ? '#f8fafc' : '#0f172a',
    });

    if (!confirm.isConfirmed) return;

    try {
      await this.kurbanService.completeSlaughterAndRecord(k);
      this.alertService.toastSuccess(
        `Kurban (${k.tagNo}) kesildi olarak işaretlendi ve muhasebeye gelir işlendi!`
      );
    } catch (e: any) {
      this.alertService.error('Hata', e?.message || 'Kesim işlemi kaydedilemedi.');
    }
  }

  async deleteKurban(id?: string) {
    if (!id) return;
    const confirmed = await this.alertService.confirmDelete(
      'Kurbanlık Kaydını Sil',
      'Bu kurbanlık kaydını listeden çıkarmak istediğinize emin misiniz?'
    );
    if (!confirmed) return;
    try {
      await this.kurbanService.softDelete(id);
      this.alertService.toastSuccess('Kurbanlık kaydı silindi');
    } catch (e) {
      this.alertService.error('Hata', 'Kurbanlık silinemedi.');
    }
  }
}
