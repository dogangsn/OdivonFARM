import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SimpleCrudListBase } from '../../../shared/components/simple-crud-list/simple-crud-list.base';
import { Disease } from '../../../core/models';
import { DiseaseService } from '../../../core/services/definitions/disease.service';

@Component({
  selector: 'app-diseases',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule, MatTooltipModule],
  templateUrl: '../../../shared/components/simple-crud-list/simple-crud-list.component.html',
  styleUrl: '../../../shared/components/simple-crud-list/simple-crud-list.component.scss',
})
export class DiseasesComponent extends SimpleCrudListBase<Disease> {
  service = inject(DiseaseService);
  title = 'Hastalıklar';
  override subtitle = 'Klinik hastalık, semptom ve teşhis tanımları';
  override icon = 'healing';
  override addLabel = 'Hastalık Ekle';

  constructor() {
    super();
    this.init();
  }
}
