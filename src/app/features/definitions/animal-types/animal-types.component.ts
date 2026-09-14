import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatListModule } from '@angular/material/list';
import { SimpleCrudListBase } from '../../../shared/components/simple-crud-list/simple-crud-list.base';
import { AnimalType } from '../../../core/models';
import { AnimalTypeService } from '../../../core/services/definitions/animal-type.service';

@Component({
  selector: 'app-animal-types',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule, MatListModule],
  templateUrl: '../../../shared/components/simple-crud-list/simple-crud-list.component.html',
  styleUrl: '../../../shared/components/simple-crud-list/simple-crud-list.component.scss',
})
export class AnimalTypesComponent extends SimpleCrudListBase<AnimalType> {
  service = inject(AnimalTypeService);
  title = 'Hayvan Tipleri';
  override addLabel = 'Tip Ekle';

  constructor() {
    super();
    this.init();
  }
}
