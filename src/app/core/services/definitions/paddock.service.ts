import { Injectable } from '@angular/core';
import { FarmCrudService } from '../farm-crud.service';
import { Paddock } from '../../models/animal.model';

@Injectable({ providedIn: 'root' })
export class PaddockService extends FarmCrudService<Paddock> {
  constructor() {
    super('paddocks');
  }
}
