import { Injectable } from '@angular/core';
import { FirestoreCrudService } from './firestore-crud.service';
import { AccountingTransaction } from '../models/inventory.model';

@Injectable({ providedIn: 'root' })
export class AccountingTransactionService extends FirestoreCrudService<AccountingTransaction> {
  constructor() {
    super('accountingTransactions');
  }
}
