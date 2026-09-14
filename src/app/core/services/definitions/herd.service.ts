import { Injectable } from '@angular/core';
import { FirestoreCrudService } from '../firestore-crud.service';
import { Herd } from '../../models/animal.model';

@Injectable({ providedIn: 'root' })
export class HerdService extends FirestoreCrudService<Herd> {
  constructor() {
    super('herds');
  }
}
