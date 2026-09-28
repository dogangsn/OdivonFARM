import { Injectable } from '@angular/core';
import { FarmCrudService } from './farm-crud.service';
import { Protocol } from '../models/health.model';

@Injectable({ providedIn: 'root' })
export class ProtocolService extends FarmCrudService<Protocol> {
  constructor() {
    super('protocols');
  }
}
