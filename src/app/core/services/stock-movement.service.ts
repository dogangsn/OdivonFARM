import { Injectable } from '@angular/core';
import { FirestoreCrudService } from './firestore-crud.service';
import { StockMovement } from '../models/inventory.model';

@Injectable({ providedIn: 'root' })
export class StockMovementService extends FirestoreCrudService<StockMovement> {
  constructor() {
    super('stockMovements');
  }
}
