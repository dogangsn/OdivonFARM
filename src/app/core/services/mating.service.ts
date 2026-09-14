import { Injectable } from '@angular/core';
import { FirestoreCrudService } from './firestore-crud.service';
import { Mating } from '../models/production.model';

@Injectable({ providedIn: 'root' })
export class MatingService extends FirestoreCrudService<Mating> {
  constructor() {
    super('matings');
  }
}
