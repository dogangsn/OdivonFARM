import { Injectable } from '@angular/core';
import { FirestoreCrudService } from './firestore-crud.service';
import { ActivityLogEntry } from '../models/operations.model';

@Injectable({ providedIn: 'root' })
export class ActivityLogService extends FirestoreCrudService<ActivityLogEntry> {
  constructor() {
    super('activityLog');
  }
}
