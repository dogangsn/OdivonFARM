import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SimpleCrudListBase } from '../../../shared/components/simple-crud-list/simple-crud-list.base';
import { DeathReason } from '../../../core/models';
import { DeathReasonService } from '../../../core/services/definitions/death-reason.service';

@Component({
  selector: 'app-death-reasons',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule, MatTooltipModule],
  templateUrl: '../../../shared/components/simple-crud-list/simple-crud-list.component.html',
  styleUrl: '../../../shared/components/simple-crud-list/simple-crud-list.component.scss',
})
export class DeathReasonsComponent extends SimpleCrudListBase<DeathReason> {
  service = inject(DeathReasonService);
  title = 'Ölüm Nedenleri';
  override subtitle = 'Zayiat, itlaf ve ölüm gerekçesi tanımlamaları';
  override icon = 'dangerous';
  override addLabel = 'Neden Ekle';

  constructor() {
    super();
    this.init();
  }
}
