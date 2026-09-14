import { Injectable } from '@angular/core';
import { FirestoreCrudService } from './firestore-crud.service';
import { Protocol } from '../models/health.model';

@Injectable({ providedIn: 'root' })
export class ProtocolService extends FirestoreCrudService<Protocol> {
  constructor() {
    super('protocols');
  }
}
