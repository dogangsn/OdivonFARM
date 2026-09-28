import { Injectable } from '@angular/core';
import { FarmCrudService } from '../farm-crud.service';
import { ReferenceEntity } from '../../models/operations.model';

@Injectable({ providedIn: 'root' })
export class ReferenceService extends FarmCrudService<ReferenceEntity> {
  constructor() {
    super('references');
  }
}
