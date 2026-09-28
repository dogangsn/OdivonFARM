import { Injectable } from '@angular/core';
import { FarmCrudService } from '../farm-crud.service';
import { Disease } from '../../models/health.model';

@Injectable({ providedIn: 'root' })
export class DiseaseService extends FarmCrudService<Disease> {
  constructor() {
    super('diseases');
  }
}
