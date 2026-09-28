import { Injectable } from '@angular/core';
import { FarmCrudService } from './farm-crud.service';
import { YieldRecord } from '../models/production.model';

@Injectable({ providedIn: 'root' })
export class YieldRecordService extends FarmCrudService<YieldRecord> {
  constructor() {
    super('yields');
  }
}
