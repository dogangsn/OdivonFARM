import { Injectable } from '@angular/core';
import { FarmCrudService } from '../farm-crud.service';
import { DeathReason } from '../../models/health.model';

@Injectable({ providedIn: 'root' })
export class DeathReasonService extends FarmCrudService<DeathReason> {
  constructor() {
    super('deathReasons');
  }
}
