/**
 * Tüm Firestore doküman modellerinin türediği temel alanlar.
 * Soft-delete (Geri Dönüşüm Merkezi) `deletedAt` alanı ile yönetilir;
 * ayrı bir "silinenler" koleksiyonu yerine sorgu filtresiyle (deletedAt == null) çalışılır.
 */
export interface BaseDoc {
  id?: string;
  farmId: string;
  createdAt?: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
  createdBy?: string;
  deletedAt?: any | null;
  deletedBy?: string | null;
}

export type Gender = 'erkek' | 'disi';

export interface Address {
  city?: string;
  district?: string;
  full?: string;
}
