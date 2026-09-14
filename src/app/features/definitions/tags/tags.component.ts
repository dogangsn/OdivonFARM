import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SimpleCrudListBase } from '../../../shared/components/simple-crud-list/simple-crud-list.base';
import { Tag } from '../../../core/models';
import { TagService } from '../../../core/services/definitions/tag.service';

@Component({
  selector: 'app-tags',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule, MatTooltipModule],
  templateUrl: '../../../shared/components/simple-crud-list/simple-crud-list.component.html',
  styleUrl: '../../../shared/components/simple-crud-list/simple-crud-list.component.scss',
})
export class TagsComponent extends SimpleCrudListBase<Tag> {
  service = inject(TagService);
  title = 'Etiketler';
  override subtitle = 'Özel sınıflandırma, renk ve hayvan etiketleri';
  override icon = 'bookmark';
  override addLabel = 'Etiket Ekle';

  constructor() {
    super();
    this.init();
  }
}
