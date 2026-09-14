import { Injectable } from '@angular/core';
import { FirestoreCrudService, where } from './firestore-crud.service';
import { WeightRecord } from '../models/production.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WeightRecordService extends FirestoreCrudService<WeightRecord> {
  constructor() {
    super('weightRecords');
  }

  forAnimal(animalId: string): Observable<WeightRecord[]> {
    return this.list(where('animalId', '==', animalId));
  }
}
