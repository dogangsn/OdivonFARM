import { Injectable } from '@angular/core';
import { FarmCrudService } from '../farm-crud.service';
import { Breed } from '../../models/animal.model';

@Injectable({ providedIn: 'root' })
export class BreedService extends FarmCrudService<Breed> {
  constructor() {
    super('breeds');
  }
}
