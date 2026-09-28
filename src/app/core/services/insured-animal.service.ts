import { Injectable } from '@angular/core';
import { FarmCrudService } from './farm-crud.service';
import { InsuredAnimal } from '../models/health.model';

@Injectable({ providedIn: 'root' })
export class InsuredAnimalService extends FarmCrudService<InsuredAnimal> {
  constructor() {
    super('insuredAnimals');
  }
}
