import { Injectable } from '@angular/core';
import { FarmCrudService } from '../farm-crud.service';
import { TreatmentType } from '../../models/health.model';

@Injectable({ providedIn: 'root' })
export class TreatmentTypeService extends FarmCrudService<TreatmentType> {
  constructor() {
    super('treatmentTypes');
  }
}
