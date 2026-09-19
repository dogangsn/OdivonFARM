import { Injectable, inject, signal } from '@angular/core';
import { AlertService } from './alert.service';

export interface OfflineQueueItem {
  id: string;
  actionType: 'tartim' | 'tedavi' | 'dogum' | 'sayim' | 'diger';
  payload: any;
  createdAt: Date;
  summaryText: string;
}

@Injectable({
  providedIn: 'root',
})
export class OfflineSyncService {
  private alert = inject(AlertService);

  isOnline = signal<boolean>(typeof window !== 'undefined' ? window.navigator.onLine : true);
  pendingSyncQueue = signal<OfflineQueueItem[]>([]);

  constructor() {
    this.initNetworkListeners();
    this.loadQueueFromStorage();
  }

  private initNetworkListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.isOnline.set(true);
      this.syncPendingActions();
    });

    window.addEventListener('offline', () => {
      this.isOnline.set(false);
      this.alert.warning(
        'Çevrimdışı Mod',
        'İnternet bağlantısı kesildi. Çiftlik operasyonlarına kesintisiz devam edebilirsiniz. Veriler yerel hafızada kuyruğa alınacaktır.'
      );
    });
  }

  private loadQueueFromStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('odivon_offline_queue');
      if (stored) {
        this.pendingSyncQueue.set(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Offline kuyruk yüklenemedi:', e);
    }
  }

  private saveQueueToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('odivon_offline_queue', JSON.stringify(this.pendingSyncQueue()));
    } catch (e) {
      console.warn('Offline kuyruk kaydedilemedi:', e);
    }
  }

  /**
   * Çevrimdışıyken yapılan işlemi kuyruğa ekle
   */
  enqueueAction(action: Omit<OfflineQueueItem, 'id' | 'createdAt'>): void {
    const item: OfflineQueueItem = {
      ...action,
      id: 'offline-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date(),
    };

    this.pendingSyncQueue.update((q) => [...q, item]);
    this.saveQueueToStorage();
    this.alert.toastSuccess(`Kayıt yerel hafızaya alındı (Kuyruk: ${this.pendingSyncQueue().length} işlem).`);
  }

  /**
   * İnternet geri geldiğinde bekleyen işlemleri buluta aktar
   */
  async syncPendingActions(): Promise<void> {
    const queue = this.pendingSyncQueue();
    if (queue.length === 0) return;

    // Simüle senkronizasyon aktarımı
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const count = queue.length;
    this.pendingSyncQueue.set([]);
    this.saveQueueToStorage();

    this.alert.toastSuccess(
      `🌐 Ağ bağlantısı sağlandı! Çevrimdışıyken yapılan ${count} adet işlem başarıyla buluta senkronize edildi.`
    );
  }

  /**
   * Test / Demo Amaçlı Çevrimdışı Modunu Değiştir
   */
  toggleSimulatedOffline(): void {
    const next = !this.isOnline();
    this.isOnline.set(next);

    if (!next) {
      // Demo kuyruk oluştur
      this.enqueueAction({
        actionType: 'tartim',
        payload: { tagNo: 'TR-06-K-1042', weightKg: 47.5 },
        summaryText: 'Canlı Ağırlık Tartımı: TR-06-K-1042 (47.5 kg)',
      });
      this.alert.warning(
        'Sanal Çevrimdışı Mod Aktif',
        'Sistem şu an interneti olmayan bir mera/dağ senaryosunda simüle ediliyor. Yapılan tüm işlemler yerel kuyruğa yazılıyor.'
      );
    } else {
      this.syncPendingActions();
    }
  }
}
