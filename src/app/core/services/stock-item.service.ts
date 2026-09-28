import { Injectable } from '@angular/core';
import { FarmCrudService } from './farm-crud.service';
import { StockItem } from '../models/inventory.model';

@Injectable({ providedIn: 'root' })
export class StockItemService extends FarmCrudService<StockItem> {
  constructor() {
    super('stockItems');
  }
}
