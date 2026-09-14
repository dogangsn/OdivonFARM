import { Injectable } from '@angular/core';
import { FirestoreCrudService } from '../firestore-crud.service';
import { TreatmentType } from '../../models/health.model';

@Injectable({ providedIn: 'root' })
export class TreatmentTypeService extends FirestoreCrudService<TreatmentType> {
  constructor() {
    super('treatmentTypes');
  }
}
