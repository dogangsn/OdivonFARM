import { Injectable } from '@angular/core';
import { FarmCrudService } from './farm-crud.service';
import { FarmPhoto } from '../models/operations.model';

@Injectable({ providedIn: 'root' })
export class FarmPhotoService extends FarmCrudService<FarmPhoto> {
  constructor() {
    super('photos');
  }
}
