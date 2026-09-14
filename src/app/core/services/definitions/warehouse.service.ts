import { Injectable } from '@angular/core';
import { FirestoreCrudService } from '../firestore-crud.service';
import { Warehouse } from '../../models/inventory.model';

@Injectable({ providedIn: 'root' })
export class WarehouseService extends FirestoreCrudService<Warehouse> {
  constructor() {
    super('warehouses');
  }
}
