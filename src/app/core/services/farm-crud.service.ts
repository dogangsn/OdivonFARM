import { inject, Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  catchError,
  combineLatest,
  from,
  of,
  shareReplay,
  switchMap,
} from 'rxjs';
import { BaseDoc } from '../models/base.model';
import { ApiService } from '../http/api.service';
import { FarmContextService } from './farm-context.service';

/** Equality filter for `list()`; the Main API applies it on the server. */
export interface FieldFilter {
  field: string;
  value: string | number | boolean;
}

export function where(field: string, _op: '==', value: string | number | boolean): FieldFilter {
  return { field, value };
}

/** One refresh counter per collection, shared by every service that touches that collection. */
const refreshTriggers = new Map<string, BehaviorSubject<number>>();

function refreshTrigger(collection: string): BehaviorSubject<number> {
  let trigger = refreshTriggers.get(collection);
  if (!trigger) {
    trigger = new BehaviorSubject(0);
    refreshTriggers.set(collection, trigger);
  }
  return trigger;
}

/** Makes every open `list()`/`get()` of the collection fetch again (after a write). */
export function refreshCollection(collection: string): void {
  const trigger = refreshTrigger(collection);
  trigger.next(trigger.value + 1);
}

/**
 * Tüm çiftlik modülleri için tekrar kullanılan jenerik repository.
 * Veriler Odivon Main API üzerinden okunur/yazılır (`/farm/data/{collectionPath}`);
 * sunucu her isteği oturumdaki kullanıcının çiftliğine (tenant) göre sınırlar.
 * Soft-delete: silme işleminde kayıt fiilen silinmez, `deletedAt` set edilir.
 */
@Injectable()
export abstract class FarmCrudService<T extends BaseDoc> {
  protected farmContext = inject(FarmContextService);
  protected api = inject(ApiService);
  private readonly streams = new Map<string, Observable<unknown>>();

  constructor(protected readonly collectionPath: string) {}

  protected get basePath(): string {
    return `/farm/data/${this.collectionPath}`;
  }

  /** Aktif (silinmemiş) kayıtlar; bu koleksiyona yapılan her yazmadan sonra yenilenir. */
  list(...filters: FieldFilter[]): Observable<T[]> {
    const query = Object.fromEntries(filters.map((f) => [f.field, String(f.value)]));
    return this.stream(`list:${JSON.stringify(query)}`, () => this.api.get<T[]>(this.basePath, query), [] as T[]);
  }

  /** Geri Dönüşüm Merkezi: silinmiş kayıtlar */
  listDeleted(): Observable<T[]> {
    return this.stream('deleted', () => this.api.get<T[]>(this.basePath, { deleted: true }), [] as T[]);
  }

  get(id: string): Observable<T> {
    return this.stream(
      `get:${id}`,
      () => this.api.get<T>(`${this.basePath}/${encodeURIComponent(id)}`),
      null as unknown as T,
    );
  }

  async create(data: Partial<T>): Promise<string> {
    const created = await this.api.post<T>(this.basePath, data);
    this.refresh();
    return created.id as string;
  }

  /** Birden fazla kaydı tek seferde oluşturur (varsayılan tanımlar vb.). */
  async createMany(items: Partial<T>[]): Promise<T[]> {
    if (items.length === 0) return [];
    const created = await this.api.post<T[]>(`${this.basePath}/batch`, { items });
    this.refresh();
    return created;
  }

  async update(id: string, data: Partial<T>): Promise<void> {
    await this.api.patch(`${this.basePath}/${encodeURIComponent(id)}`, data);
    this.refresh();
  }

  /** Soft delete — Geri Dönüşüm Merkezi'ne taşır */
  async softDelete(id: string): Promise<void> {
    await this.api.delete(`${this.basePath}/${encodeURIComponent(id)}`);
    this.refresh();
  }

  async softDeleteMany(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.api.post(`${this.basePath}/batch-delete`, { ids });
    this.refresh();
  }

  async restore(id: string): Promise<void> {
    await this.api.post(`${this.basePath}/${encodeURIComponent(id)}/restore`);
    this.refresh();
  }

  /** Kalıcı silme */
  async hardDelete(id: string): Promise<void> {
    await this.api.delete(`${this.basePath}/${encodeURIComponent(id)}/permanent`);
    this.refresh();
  }

  protected refresh(): void {
    refreshCollection(this.collectionPath);
  }

  /**
   * Oturum (kullanıcı + çiftlik) veya koleksiyon değiştikçe yeniden çeker; aynı sorguyu
   * dinleyen bileşenler tek isteği paylaşır. Hata durumunda UI'ı kilitlememek için yedek değer yayar.
   */
  private stream<R>(key: string, fetch: () => Promise<R>, fallback: R): Observable<R> {
    let stream = this.streams.get(key) as Observable<R> | undefined;
    if (!stream) {
      stream = combineLatest([this.farmContext.session$, refreshTrigger(this.collectionPath)]).pipe(
        switchMap(([session]) => {
          if (!session.farmId || !session.uid) return of(fallback);
          return from(fetch()).pipe(
            catchError((err) => {
              console.warn(`[FarmAPI] '${this.collectionPath}' okunamadı:`, err?.message || err);
              return of(fallback);
            }),
          );
        }),
        shareReplay({ bufferSize: 1, refCount: true }),
      );
      this.streams.set(key, stream);
    }
    return stream;
  }
}
