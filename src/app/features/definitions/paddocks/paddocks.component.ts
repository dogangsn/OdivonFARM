import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatListModule } from '@angular/material/list';
import { SimpleCrudListBase } from '../../../shared/components/simple-crud-list/simple-crud-list.base';
import { Paddock } from '../../../core/models';
import { PaddockService } from '../../../core/services/definitions/paddock.service';

@Component({
  selector: 'app-paddocks',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule, MatListModule],
  templateUrl: '../../../shared/components/simple-crud-list/simple-crud-list.component.html',
  styleUrl: '../../../shared/components/simple-crud-list/simple-crud-list.component.scss',
})
export class PaddocksComponent extends SimpleCrudListBase<Paddock> {
  service = inject(PaddockService);
  title = 'Padoklar';
  override addLabel = 'Padok Ekle';

  constructor() {
    super();
    this.init();
  }
}
