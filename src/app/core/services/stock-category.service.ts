import { Injectable } from '@angular/core';
import { FarmCrudService } from './farm-crud.service';
import { StockCategory } from '../models/inventory.model';

@Injectable({ providedIn: 'root' })
export class StockCategoryService extends FarmCrudService<StockCategory> {
  constructor() {
    super('stockCategories');
  }
}
