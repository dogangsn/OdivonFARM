import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

import {
  BriefingSectionOptions,
  BriefingService,
  DailyBriefingSummary,
} from '../../../../core/services/briefing.service';
import { AlertService } from '../../../../core/services/alert.service';

@Component({
  selector: 'app-briefing-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './briefing-modal.component.html',
  styleUrl: './briefing-modal.component.scss',
})
export class BriefingModalComponent {
  private briefingService = inject(BriefingService);
  private alertService = inject(AlertService);

  @Input({ required: true }) summary!: DailyBriefingSummary;
  @Input({ required: true }) options!: BriefingSectionOptions;
  @Output() close = new EventEmitter<void>();
  @Output() optionsChange = new EventEmitter<BriefingSectionOptions>();

  recipientPhone = signal<string>('');
  customNote = signal<string>('');

  onOptionToggle(): void {
    this.options.customNote = this.customNote();
    this.optionsChange.emit({ ...this.options });
  }

  onCustomNoteChange(): void {
    this.options.customNote = this.customNote();
    this.optionsChange.emit({ ...this.options });
  }

  async copyMessage(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.summary.messageText);
      this.alertService.toastSuccess('Sabah Brifingi panoya kopyalandı! WhatsApp veya SMS ile yapıştırabilirsiniz.');
    } catch (e) {
      this.alertService.error('Hata', 'Panoya kopyalanamadı.');
    }
  }

  sendWhatsApp(): void {
    this.briefingService.openWhatsApp(this.summary.messageText, this.recipientPhone());
  }

  sendSms(): void {
    this.briefingService.openSms(this.summary.messageText);
  }
}
