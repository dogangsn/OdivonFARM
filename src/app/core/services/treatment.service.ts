import { Injectable } from '@angular/core';
import { FirestoreCrudService, where } from './firestore-crud.service';
import { Treatment } from '../models/health.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TreatmentService extends FirestoreCrudService<Treatment> {
  constructor() {
    super('treatments');
  }

  forAnimal(animalId: string): Observable<Treatment[]> {
    return this.list(where('animalId', '==', animalId));
  }
}
