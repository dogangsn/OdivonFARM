import { Injectable } from '@angular/core';
import { FirestoreCrudService, where } from './firestore-crud.service';
import { Animal } from '../models/animal.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AnimalService extends FirestoreCrudService<Animal> {
  constructor() {
    super('animals');
  }

  byHerd(herdId: string): Observable<Animal[]> {
    return this.list(where('herdId', '==', herdId));
  }

  byPaddock(paddockId: string): Observable<Animal[]> {
    return this.list(where('paddockId', '==', paddockId));
  }

  byRfid(rfid: string): Observable<Animal[]> {
    return this.list(where('rfid', '==', rfid));
  }
}
