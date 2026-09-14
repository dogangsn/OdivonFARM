import { Injectable } from '@angular/core';
import { FirestoreCrudService } from '../firestore-crud.service';
import { RoleDefinition } from '../../models/farm.model';

@Injectable({ providedIn: 'root' })
export class RoleService extends FirestoreCrudService<RoleDefinition> {
  constructor() {
    super('roles');
  }
}
