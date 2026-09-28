import { Injectable } from '@angular/core';
import { FarmCrudService } from '../farm-crud.service';
import { Tag } from '../../models/animal.model';

@Injectable({ providedIn: 'root' })
export class TagService extends FarmCrudService<Tag> {
  constructor() {
    super('tags');
  }
}
