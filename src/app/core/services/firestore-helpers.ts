import {
  DocumentReference,
  Query,
  DocumentData,
  onSnapshot,
} from 'firebase/firestore';
import { Observable } from 'rxjs';

/**
 * Firebase 12 uyumlu, rxfire _zoneWrap nesne prototipi uyuşmazlığını
 * önleyen güvenli docData yardımcısı.
 */
export function docData<T = DocumentData>(
  ref: DocumentReference,
  options?: { idField?: string }
): Observable<T | undefined> {
  return new Observable((subscriber) => {
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          subscriber.next(undefined);
          return;
        }
        const data = snap.data() as any;
        if (options?.idField) {
          data[options.idField] = snap.id;
        }
        subscriber.next(data as T);
      },
      (err) => {
        console.warn(`[Firestore docData Warning at ${ref.path}]:`, err?.message || err);
        // İzin veya bağlantı hatasında Angular sinyallerini kırmamak için undefined yay
        subscriber.next(undefined);
      }
    );
    return () => unsubscribe();
  });
}

/**
 * Firebase 12 uyumlu, rxfire _zoneWrap nesne prototipi uyuşmazlığını
 * önleyen güvenli collectionData yardımcısı.
 */
export function collectionData<T = DocumentData>(
  q: Query,
  options?: { idField?: string }
): Observable<T[]> {
  return new Observable((subscriber) => {
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => {
          const data = d.data() as any;
          if (options?.idField) {
            data[options.idField] = d.id;
          }
          return data as T;
        });
        subscriber.next(items);
      },
      (err) => {
        console.warn('[Firestore collectionData Warning]:', err?.message || err);
        // İzin hatasında boş dizi yayarak UI kilitlenmesini engelle
        subscriber.next([]);
      }
    );
    return () => unsubscribe();
  });
}
