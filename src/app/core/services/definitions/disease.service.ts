import { Injectable } from '@angular/core';
import { FirestoreCrudService } from '../firestore-crud.service';
import { Disease } from '../../models/health.model';

@Injectable({ providedIn: 'root' })
export class DiseaseService extends FirestoreCrudService<Disease> {
  constructor() {
    super('diseases');
  }
}
