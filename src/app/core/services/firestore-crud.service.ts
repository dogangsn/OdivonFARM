import { inject, Injectable } from '@angular/core';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  QueryConstraint,
  serverTimestamp,
  CollectionReference,
  DocumentData,
} from 'firebase/firestore';
export { query, where, orderBy, QueryConstraint } from 'firebase/firestore';
import { Observable, switchMap, of, catchError } from 'rxjs';
import { BaseDoc } from '../models/base.model';
import { FarmContextService } from './farm-context.service';
import { collectionData, docData } from './firestore-helpers';

/**
 * Tüm çiftlik modülleri için tekrar kullanılan jenerik Firestore repository.
 * Her koleksiyon `farms/{farmId}/{collectionPath}` altında tutulur.
 * Soft-delete: silme işleminde doküman fiilen silinmez, `deletedAt` set edilir.
 */
@Injectable()
export abstract class FirestoreCrudService<T extends BaseDoc> {
  protected farmContext = inject(FarmContextService);

  constructor(private collectionPath: string) {}

  protected get db() {
    return getFirestore();
  }

  private colRef(): CollectionReference<DocumentData> {
    const farmId = this.farmContext.requireActiveFarmId();
    return collection(this.db, `farms/${farmId}/${this.collectionPath}`);
  }

  /** Aktif (silinmemiş) kayıtları dinler */
  list(...constraints: QueryConstraint[]): Observable<T[]> {
    return this.farmContext.activeFarmId$.pipe(
      switchMap((farmId) => {
        if (!farmId) return of([] as T[]);
        const col = collection(this.db, `farms/${farmId}/${this.collectionPath}`);
        const q = query(col, where('deletedAt', '==', null), ...constraints);
        return (collectionData(q, { idField: 'id' }) as Observable<T[]>).pipe(
          catchError((err) => {
            console.warn(`[Firestore] '${this.collectionPath}' erişim izni yok veya Firestore kuralları kilitli:`, err.message);
            return of([] as T[]);
          })
        );
      })
    );
  }

  /** Geri Dönüşüm Merkezi: silinmiş kayıtlar */
  listDeleted(): Observable<T[]> {
    return this.farmContext.activeFarmId$.pipe(
      switchMap((farmId) => {
        if (!farmId) return of([] as T[]);
        const col = collection(this.db, `farms/${farmId}/${this.collectionPath}`);
        const q = query(col, where('deletedAt', '!=', null));
        return (collectionData(q, { idField: 'id' }) as Observable<T[]>).pipe(
          catchError((err) => {
            console.warn(`[Firestore] '${this.collectionPath}' silinmişler listesi izni yok:`, err.message);
            return of([] as T[]);
          })
        );
      })
    );
  }

  get(id: string): Observable<T> {
    return this.farmContext.activeFarmId$.pipe(
      switchMap((farmId) => {
        if (!farmId) return of(null as unknown as T);
        const ref = doc(this.db, `farms/${farmId}/${this.collectionPath}/${id}`);
        return (docData(ref, { idField: 'id' }) as Observable<T>).pipe(
          catchError((err) => {
            console.warn(`[Firestore] '${this.collectionPath}/${id}' doküman izni yok:`, err.message);
            return of(null as unknown as T);
          })
        );
      })
    );
  }

  async create(data: Partial<T>): Promise<string> {
    const farmId = this.farmContext.requireActiveFarmId();
    const payload = {
      ...data,
      farmId,
      deletedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: this.farmContext.currentUid(),
    };
    const ref = await addDoc(this.colRef(), payload);
    return ref.id;
  }

  async update(id: string, data: Partial<T>): Promise<void> {
    const farmId = this.farmContext.requireActiveFarmId();
    const ref = doc(this.db, `farms/${farmId}/${this.collectionPath}/${id}`);
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() } as DocumentData);
  }

  /** Soft delete — Geri Dönüşüm Merkezi'ne taşır */
  async softDelete(id: string): Promise<void> {
    const farmId = this.farmContext.requireActiveFarmId();
    const ref = doc(this.db, `farms/${farmId}/${this.collectionPath}/${id}`);
    await updateDoc(ref, {
      deletedAt: serverTimestamp(),
      deletedBy: this.farmContext.currentUid(),
    });
  }

  async restore(id: string): Promise<void> {
    await this.update(id, { deletedAt: null, deletedBy: null } as Partial<T>);
  }

  /** Kalıcı silme */
  async hardDelete(id: string): Promise<void> {
    const farmId = this.farmContext.requireActiveFarmId();
    const ref = doc(this.db, `farms/${farmId}/${this.collectionPath}/${id}`);
    await deleteDoc(ref);
  }
}
