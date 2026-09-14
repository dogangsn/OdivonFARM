import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatListModule } from '@angular/material/list';
import { SimpleCrudListBase } from '../../../shared/components/simple-crud-list/simple-crud-list.base';
import { ReferenceEntity } from '../../../core/models';
import { ReferenceService } from '../../../core/services/definitions/reference.service';

@Component({
  selector: 'app-references',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule, MatListModule],
  templateUrl: '../../../shared/components/simple-crud-list/simple-crud-list.component.html',
  styleUrl: '../../../shared/components/simple-crud-list/simple-crud-list.component.scss',
})
export class ReferencesComponent extends SimpleCrudListBase<ReferenceEntity> {
  service = inject(ReferenceService);
  title = 'Referanslar';
  override addLabel = 'Referans Ekle';

  constructor() {
    super();
    this.init();
  }
}
