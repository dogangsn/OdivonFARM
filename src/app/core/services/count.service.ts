import { Injectable } from '@angular/core';
import { FarmCrudService } from './farm-crud.service';
import { Count } from '../models/operations.model';

@Injectable({ providedIn: 'root' })
export class CountService extends FarmCrudService<Count> {
  constructor() {
    super('counts');
  }
}
