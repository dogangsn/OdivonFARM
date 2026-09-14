import { Injectable } from '@angular/core';
import { FirestoreCrudService } from './firestore-crud.service';
import { FarmTask } from '../models/operations.model';

@Injectable({ providedIn: 'root' })
export class TaskService extends FirestoreCrudService<FarmTask> {
  constructor() {
    super('tasks');
  }
}
