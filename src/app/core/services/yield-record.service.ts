import { Injectable } from '@angular/core';
import { FirestoreCrudService } from './firestore-crud.service';
import { YieldRecord } from '../models/production.model';

@Injectable({ providedIn: 'root' })
export class YieldRecordService extends FirestoreCrudService<YieldRecord> {
  constructor() {
    super('yields');
  }
}
