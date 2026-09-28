import { Injectable } from '@angular/core';
import { FarmCrudService } from './farm-crud.service';
import { FarmTask } from '../models/operations.model';

@Injectable({ providedIn: 'root' })
export class TaskService extends FarmCrudService<FarmTask> {
  constructor() {
    super('tasks');
  }
}
