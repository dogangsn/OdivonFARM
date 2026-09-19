import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { KurbanService } from '../../../core/services/kurban.service';
import { KurbanAnimal, KurbanHisse } from '../../../core/models/kurban.model';
import { FarmContextService } from '../../../core/services/farm-context.service';

@Component({
  selector: 'app-kurban-odeme',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, MatButtonModule],
  templateUrl: './kurban-odeme.component.html',
  styleUrls: ['./kurban-odeme.component.scss'],
})
export class KurbanOdemeComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private kurbanService = inject(KurbanService);
  private farmContext = inject(FarmContextService);

  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);

  readonly kurban = signal<KurbanAnimal | null>(null);
  readonly hisse = signal<KurbanHisse | null>(null);
  readonly farmName = signal<string>('Odivon FARM');

  // Checkout Form
  paymentMethod = signal<'card' | 'transfer'>('card');
  cardNumber = signal('');
  cardHolder = signal('');
  expiryDate = signal('');
  cvv = signal('');
  isProcessing = signal(false);
  paymentSuccess = signal(false);
  receiptCode = signal('');

  ngOnInit() {
    this.route.queryParams.subscribe(async (params) => {
      const kurbanId = params['kurbanId'];
      const hisseId = params['hisseId'];

      if (!kurbanId || !hisseId) {
        this.error.set('Geçersiz veya eksik ödeme bağlantısı. Lütfen size iletilen linki kontrol ediniz.');
        this.isLoading.set(false);
        return;
      }

      try {
        const k = await this.kurbanService.getById(kurbanId);
        if (!k) {
          this.error.set('Kurbanlık kaydı bulunamadı.');
          this.isLoading.set(false);
          return;
        }

        const h = (k.shares || []).find((s: KurbanHisse) => s.id === hisseId);
        if (!h) {
          this.error.set('Hisse kaydı bulunamadı.');
          this.isLoading.set(false);
          return;
        }

        this.kurban.set(k);
        this.hisse.set(h);
        if (h.isPaid || h.remainingPayment <= 0) {
          this.paymentSuccess.set(true);
          this.receiptCode.set('ODV-' + Math.random().toString(36).substring(2, 9).toUpperCase());
        }
      } catch (err: any) {
        this.error.set('Ödeme detayları yüklenirken bir hata oluştu.');
      } finally {
        this.isLoading.set(false);
      }
    });
  }

  formatCardNumber(event: any) {
    let val = event.target.value.replace(/\D/g, '');
    val = val.substring(0, 16);
    const parts = val.match(/.{1,4}/g) || [];
    this.cardNumber.set(parts.join(' '));
  }

  formatExpiry(event: any) {
    let val = event.target.value.replace(/\D/g, '');
    if (val.length > 2) {
      val = val.substring(0, 2) + '/' + val.substring(2, 4);
    }
    this.expiryDate.set(val.substring(0, 5));
  }

  async processCardPayment() {
    const k = this.kurban();
    const h = this.hisse();
    if (!k?.id || !h) return;

    if (!this.cardHolder() || !this.cardNumber() || !this.expiryDate() || !this.cvv()) {
      alert('Lütfen tüm kart bilgilerini eksiksiz doldurunuz.');
      return;
    }

    this.isProcessing.set(true);

    try {
      // Simulate secure bank 3D gateway processing
      await new Promise((resolve) => setTimeout(resolve, 1500));

      await this.kurbanService.markShareAsPaid(k.id, h.id, h.remainingPayment);

      this.receiptCode.set('ODV-' + Math.random().toString(36).substring(2, 9).toUpperCase());
      this.paymentSuccess.set(true);

      // Refresh data
      const updatedK = await this.kurbanService.getById(k.id);
      if (updatedK) {
        this.kurban.set(updatedK);
        const updatedH = updatedK.shares.find((s: KurbanHisse) => s.id === h.id);
        if (updatedH) this.hisse.set(updatedH);
      }
    } catch (err: any) {
      alert('Ödeme işlemi tamamlanırken hata oluştu: ' + (err?.message || 'Bilinmeyen hata'));
    } finally {
      this.isProcessing.set(false);
    }
  }

  printReceipt() {
    window.print();
  }
}
