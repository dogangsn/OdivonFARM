import { Injectable } from '@angular/core';
import { FirestoreCrudService } from '../firestore-crud.service';
import { Paddock } from '../../models/animal.model';

@Injectable({ providedIn: 'root' })
export class PaddockService extends FirestoreCrudService<Paddock> {
  constructor() {
    super('paddocks');
  }
}
