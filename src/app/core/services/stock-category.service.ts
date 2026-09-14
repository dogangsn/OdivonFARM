import { Injectable } from '@angular/core';
import { FirestoreCrudService } from './firestore-crud.service';
import { StockCategory } from '../models/inventory.model';

@Injectable({ providedIn: 'root' })
export class StockCategoryService extends FirestoreCrudService<StockCategory> {
  constructor() {
    super('stockCategories');
  }
}
