import { Injectable } from '@angular/core';
import { FarmCrudService } from '../farm-crud.service';
import { AnimalType } from '../../models/animal.model';

@Injectable({ providedIn: 'root' })
export class AnimalTypeService extends FarmCrudService<AnimalType> {
  constructor() {
    super('animalTypes');
  }
}
