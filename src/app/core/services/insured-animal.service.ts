import { Injectable } from '@angular/core';
import { FirestoreCrudService } from './firestore-crud.service';
import { InsuredAnimal } from '../models/health.model';

@Injectable({ providedIn: 'root' })
export class InsuredAnimalService extends FirestoreCrudService<InsuredAnimal> {
  constructor() {
    super('insuredAnimals');
  }
}
