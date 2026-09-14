import { Component } from '@angular/core';

/**
 * Çiftlikte Yapılanlar — iskelet aşaması. Sayfa ve routing hazır; core/models altındaki
 * ilgili model(ler) ve FirestoreCrudService alt sınıfı ile detaylandırılacak.
 */
@Component({
  selector: 'app-activity-log',
  standalone: true,
  template: `
    <div class="stub-page">
      <h2>Çiftlikte Yapılanlar</h2>
      <p>Tüm modüllerdeki create/update/delete işlemlerinden beslenen aktivite akışı. ActivityLogEntry modeli hazır; Cloud Functions ile otomatik loglama önerilir.</p>
    </div>
  `,
  styles: [`
    .stub-page { padding: 1.5rem; color: rgba(0,0,0,0.7); }
    h2 { margin-bottom: 0.5rem; }
  `],
})
export class ActivityLogComponent {}
