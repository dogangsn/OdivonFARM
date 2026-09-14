import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

/**
 * Kapsamı geniş olan ve özel iş mantığı gerektiren modüller (Muhasebe, Rasyon,
 * Sayım/RFID donanım entegrasyonu, Raporlar vb.) için iskelet aşamasında
 * yer tutucu ekran. Route + veri modeli hazır, UI bir sonraki iterasyonda eklenecek.
 */
@Component({
  selector: 'app-coming-soon',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatCardModule],
  template: `
    <div class="wrap">
      <mat-card>
        <mat-icon>construction</mat-icon>
        <h2>{{ title() }}</h2>
        <p>{{ description() }}</p>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .wrap {
        padding: 2rem;
        display: flex;
        justify-content: center;
      }
      mat-card {
        max-width: 520px;
        padding: 2rem;
        text-align: center;
      }
      mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        color: rgba(0, 0, 0, 0.4);
      }
      p {
        color: rgba(0, 0, 0, 0.6);
      }
    `,
  ],
})
export class ComingSoonComponent {
  title = input.required<string>();
  description = input<string>('Bu modülün veri modeli ve servis altyapısı hazır; ekran bir sonraki iterasyonda eklenecek.');
}
