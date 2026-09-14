import { Injectable } from '@angular/core';
import { FirestoreCrudService } from './firestore-crud.service';
import { FarmPhoto } from '../models/operations.model';

@Injectable({ providedIn: 'root' })
export class FarmPhotoService extends FirestoreCrudService<FarmPhoto> {
  constructor() {
    super('photos');
  }
}
