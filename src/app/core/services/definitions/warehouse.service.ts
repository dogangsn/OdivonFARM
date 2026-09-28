import { Injectable } from '@angular/core';
import { FarmCrudService } from '../farm-crud.service';
import { Warehouse } from '../../models/inventory.model';

@Injectable({ providedIn: 'root' })
export class WarehouseService extends FarmCrudService<Warehouse> {
  constructor() {
    super('warehouses');
  }
}
