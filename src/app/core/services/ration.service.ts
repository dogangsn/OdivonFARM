import { Injectable } from '@angular/core';
import { FirestoreCrudService } from './firestore-crud.service';
import { Ration } from '../models/production.model';

@Injectable({ providedIn: 'root' })
export class RationService extends FirestoreCrudService<Ration> {
  constructor() {
    super('rations');
  }
}
