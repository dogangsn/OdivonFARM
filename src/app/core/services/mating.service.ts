import { Injectable } from '@angular/core';
import { FarmCrudService } from './farm-crud.service';
import { Mating } from '../models/production.model';

@Injectable({ providedIn: 'root' })
export class MatingService extends FarmCrudService<Mating> {
  constructor() {
    super('matings');
  }
}
