import { Injectable } from '@angular/core';
import { FarmCrudService } from '../farm-crud.service';
import { Account } from '../../models/inventory.model';

@Injectable({ providedIn: 'root' })
export class AccountService extends FarmCrudService<Account> {
  constructor() {
    super('accounts');
  }
}
