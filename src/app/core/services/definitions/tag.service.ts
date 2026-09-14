import { Injectable } from '@angular/core';
import { FirestoreCrudService } from '../firestore-crud.service';
import { Tag } from '../../models/animal.model';

@Injectable({ providedIn: 'root' })
export class TagService extends FirestoreCrudService<Tag> {
  constructor() {
    super('tags');
  }
}
