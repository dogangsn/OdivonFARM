import { Injectable } from '@angular/core';
import { FirestoreCrudService } from '../firestore-crud.service';
import { Breed } from '../../models/animal.model';

@Injectable({ providedIn: 'root' })
export class BreedService extends FirestoreCrudService<Breed> {
  constructor() {
    super('breeds');
  }
}
