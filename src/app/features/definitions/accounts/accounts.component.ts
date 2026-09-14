import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { toSignal } from '@angular/core/rxjs-interop';
import { AccountService } from '../../../core/services/definitions/account.service';
import { Account } from '../../../core/models';

/** Tanımlamalar > Cariler — ekran görüntüsündeki "Cari Ekle" modalına karşılık gelir */
@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule,
    MatDialogModule,
  ],
  templateUrl: './accounts.component.html',
  styleUrl: './accounts.component.scss',
})
export class AccountsComponent {
  private service = inject(AccountService);

  accounts = toSignal(this.service.list(), { initialValue: [] as Account[] });
  showForm = signal(false);

  form = signal<Partial<Account>>({ title: '', description: '', address: '', phone: '' });

  openForm() {
    this.form.set({ title: '', description: '', address: '', phone: '' });
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
  }

  updateField(field: keyof Account, value: string) {
    this.form.update((f) => ({ ...f, [field]: value }));
  }

  async save() {
    const value = this.form();
    if (!value.title?.trim()) return;
    await this.service.create(value);
    this.closeForm();
  }

  async remove(id: string) {
    await this.service.softDelete(id);
  }
}
