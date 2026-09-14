import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatListModule } from '@angular/material/list';
import { SimpleCrudListBase } from '../../../shared/components/simple-crud-list/simple-crud-list.base';
import { TreatmentType } from '../../../core/models';
import { TreatmentTypeService } from '../../../core/services/definitions/treatment-type.service';

@Component({
  selector: 'app-treatment-types',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule, MatListModule],
  templateUrl: '../../../shared/components/simple-crud-list/simple-crud-list.component.html',
  styleUrl: '../../../shared/components/simple-crud-list/simple-crud-list.component.scss',
})
export class TreatmentTypesComponent extends SimpleCrudListBase<TreatmentType> {
  service = inject(TreatmentTypeService);
  title = 'Tedavi Türleri';
  override addLabel = 'Tür Ekle';

  constructor() {
    super();
    this.init();
  }
}
