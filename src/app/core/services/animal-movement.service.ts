import { Injectable } from '@angular/core';
import { FirestoreCrudService, where } from './firestore-crud.service';
import { AnimalMovement } from '../models/animal.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AnimalMovementService extends FirestoreCrudService<AnimalMovement> {
  constructor() {
    super('animalMovements');
  }

  forAnimal(animalId: string): Observable<AnimalMovement[]> {
    return this.list(where('animalId', '==', animalId));
  }
}
