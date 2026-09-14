import { Injectable } from '@angular/core';
import { FirestoreCrudService } from '../firestore-crud.service';
import { AccountingItem } from '../../models/inventory.model';

@Injectable({ providedIn: 'root' })
export class AccountingItemService extends FirestoreCrudService<AccountingItem> {
  constructor() {
    super('accountingItems');
  }
}
