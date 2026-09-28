import { Injectable } from '@angular/core';
import { FarmCrudService, where } from './farm-crud.service';
import { AnimalMovement } from '../models/animal.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AnimalMovementService extends FarmCrudService<AnimalMovement> {
  constructor() {
    super('animalMovements');
  }

  forAnimal(animalId: string): Observable<AnimalMovement[]> {
    return this.list(where('animalId', '==', animalId));
  }
}
