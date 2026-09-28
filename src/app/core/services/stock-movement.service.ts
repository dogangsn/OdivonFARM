import { Injectable } from '@angular/core';
import { FarmCrudService } from './farm-crud.service';
import { StockMovement } from '../models/inventory.model';

@Injectable({ providedIn: 'root' })
export class StockMovementService extends FarmCrudService<StockMovement> {
  constructor() {
    super('stockMovements');
  }
}
