import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatListModule } from '@angular/material/list';
import { SimpleCrudListBase } from '../../../shared/components/simple-crud-list/simple-crud-list.base';
import { AccountingItem } from '../../../core/models';
import { AccountingItemService } from '../../../core/services/definitions/accounting-item.service';

@Component({
  selector: 'app-accounting-items',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule, MatListModule],
  templateUrl: '../../../shared/components/simple-crud-list/simple-crud-list.component.html',
  styleUrl: '../../../shared/components/simple-crud-list/simple-crud-list.component.scss',
})
export class AccountingItemsComponent extends SimpleCrudListBase<AccountingItem> {
  service = inject(AccountingItemService);
  title = 'Muhasebe Kalemleri';
  override addLabel = 'Kalem Ekle';

  constructor() {
    super();
    this.init();
  }
}
