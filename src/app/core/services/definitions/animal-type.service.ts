import { Injectable } from '@angular/core';
import { FirestoreCrudService } from '../firestore-crud.service';
import { AnimalType } from '../../models/animal.model';

@Injectable({ providedIn: 'root' })
export class AnimalTypeService extends FirestoreCrudService<AnimalType> {
  constructor() {
    super('animalTypes');
  }
}
