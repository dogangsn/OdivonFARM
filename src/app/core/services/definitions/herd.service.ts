import { Injectable } from '@angular/core';
import { FarmCrudService } from '../farm-crud.service';
import { Herd } from '../../models/animal.model';

@Injectable({ providedIn: 'root' })
export class HerdService extends FarmCrudService<Herd> {
  constructor() {
    super('herds');
  }
}
