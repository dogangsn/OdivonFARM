import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SimpleCrudListBase } from '../../../shared/components/simple-crud-list/simple-crud-list.base';
import { AnimalType } from '../../../core/models';
import { AnimalTypeService } from '../../../core/services/definitions/animal-type.service';

@Component({
  selector: 'app-animal-types',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule, MatTooltipModule],
  templateUrl: '../../../shared/components/simple-crud-list/simple-crud-list.component.html',
  styleUrl: '../../../shared/components/simple-crud-list/simple-crud-list.component.scss',
})
export class AnimalTypesComponent extends SimpleCrudListBase<AnimalType> {
  service = inject(AnimalTypeService);
  title = 'Hayvan Tipleri';
  override subtitle = 'Koyun, Keçi, Koç, Kuzu ve sürü hayvan kategorileri';
  override icon = 'tag';
  override addLabel = 'Tip Ekle';

  constructor() {
    super();
    this.init();
  }
}
