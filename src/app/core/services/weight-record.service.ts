import { Injectable } from '@angular/core';
import { FarmCrudService, where } from './farm-crud.service';
import { WeightRecord } from '../models/production.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WeightRecordService extends FarmCrudService<WeightRecord> {
  constructor() {
    super('weightRecords');
  }

  forAnimal(animalId: string): Observable<WeightRecord[]> {
    return this.list(where('animalId', '==', animalId));
  }
}
