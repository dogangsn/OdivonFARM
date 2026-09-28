import { Injectable } from '@angular/core';
import { FarmCrudService } from '../farm-crud.service';
import { RoleDefinition } from '../../models/farm.model';

@Injectable({ providedIn: 'root' })
export class RoleService extends FarmCrudService<RoleDefinition> {
  constructor() {
    super('roles');
  }
}
