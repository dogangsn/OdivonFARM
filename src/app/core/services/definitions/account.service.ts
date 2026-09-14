import { Injectable } from '@angular/core';
import { FirestoreCrudService } from '../firestore-crud.service';
import { Account } from '../../models/inventory.model';

@Injectable({ providedIn: 'root' })
export class AccountService extends FirestoreCrudService<Account> {
  constructor() {
    super('accounts');
  }
}
