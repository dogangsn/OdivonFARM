import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SimpleCrudListBase } from '../../../shared/components/simple-crud-list/simple-crud-list.base';
import { StockCategory } from '../../../core/models/inventory.model';
import { StockCategoryService } from '../../../core/services/stock-category.service';

@Component({
  selector: 'app-stock-categories',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatTooltipModule,
  ],
  templateUrl: '../../../shared/components/simple-crud-list/simple-crud-list.component.html',
  styleUrl: '../../../shared/components/simple-crud-list/simple-crud-list.component.scss',
})
export class StockCategoriesComponent extends SimpleCrudListBase<StockCategory> {
  service = inject(StockCategoryService);
  title = 'Stok Kategorileri';
  override subtitle = 'Yem, ilaç, aşı, sarf ve envanter ürün grupları';
  override icon = 'category';
  override addLabel = 'Kategori Ekle';

  constructor() {
    super();
    this.init();
  }
}
