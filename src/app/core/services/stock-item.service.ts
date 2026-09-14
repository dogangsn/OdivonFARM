import { Injectable } from '@angular/core';
import { FirestoreCrudService } from './firestore-crud.service';
import { StockItem } from '../models/inventory.model';

@Injectable({ providedIn: 'root' })
export class StockItemService extends FirestoreCrudService<StockItem> {
  constructor() {
    super('stockItems');
  }
}
