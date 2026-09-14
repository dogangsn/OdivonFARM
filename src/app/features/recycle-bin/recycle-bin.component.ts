import { Component } from '@angular/core';

/**
 * Geri Dönüşüm Merkezi — iskelet aşaması. Sayfa ve routing hazır; core/models altındaki
 * ilgili model(ler) ve FirestoreCrudService alt sınıfı ile detaylandırılacak.
 */
@Component({
  selector: 'app-recycle-bin',
  standalone: true,
  template: `
    <div class="stub-page">
      <h2>Geri Dönüşüm Merkezi</h2>
      <p>Soft-delete edilmiş (deletedAt dolu) kayıtların listelendiği ve geri yüklenebildiği ekran. FirestoreCrudService.listDeleted()/restore() hazır.</p>
    </div>
  `,
  styles: [`
    .stub-page { padding: 1.5rem; color: rgba(0,0,0,0.7); }
    h2 { margin-bottom: 0.5rem; }
  `],
})
export class RecycleBinComponent {}
