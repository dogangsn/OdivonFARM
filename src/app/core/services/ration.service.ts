import { Injectable } from '@angular/core';
import { FarmCrudService } from './farm-crud.service';
import { Ration } from '../models/production.model';

@Injectable({ providedIn: 'root' })
export class RationService extends FarmCrudService<Ration> {
  constructor() {
    super('rations');
  }
}
