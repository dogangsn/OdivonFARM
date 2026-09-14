import { Injectable } from '@angular/core';
import { FirestoreCrudService } from '../firestore-crud.service';
import { DeathReason } from '../../models/health.model';

@Injectable({ providedIn: 'root' })
export class DeathReasonService extends FirestoreCrudService<DeathReason> {
  constructor() {
    super('deathReasons');
  }
}
