import { Injectable } from '@angular/core';
import { FirestoreCrudService } from './firestore-crud.service';
import { Count } from '../models/operations.model';

@Injectable({ providedIn: 'root' })
export class CountService extends FirestoreCrudService<Count> {
  constructor() {
    super('counts');
  }
}
