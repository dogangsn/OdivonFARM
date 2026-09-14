import { Injectable } from '@angular/core';
import { FirestoreCrudService } from '../firestore-crud.service';
import { ReferenceEntity } from '../../models/operations.model';

@Injectable({ providedIn: 'root' })
export class ReferenceService extends FirestoreCrudService<ReferenceEntity> {
  constructor() {
    super('references');
  }
}
