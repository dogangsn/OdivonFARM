# Slide-over Drawer Component Pattern (Odivon Design System)

The slide-over drawer replaces bulky full-page navigations for creating and editing records.

### TypeScript Controller with Angular Signals

```typescript
import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-drawer-example',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './drawer-example.component.html',
})
export class DrawerExampleComponent {
  readonly isDrawerOpen = signal<boolean>(false);
  readonly isEditing = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly editingId = signal<string | null>(null);

  form = {
    name: '',
    category: '',
    notes: '',
  };

  openCreateDrawer() {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.form = { name: '', category: '', notes: '' };
    this.isDrawerOpen.set(true);
  }

  openEditDrawer(item: any) {
    this.isEditing.set(true);
    this.editingId.set(item.id);
    this.form = { ...item };
    this.isDrawerOpen.set(true);
  }

  closeDrawer() {
    this.isDrawerOpen.set(false);
  }

  async saveRecord() {
    this.isSaving.set(true);
    try {
      // Execute save/update
      this.closeDrawer();
    } finally {
      this.isSaving.set(false);
    }
  }
}
```

### HTML Template with Sticky Header & Footer

```html
@if (isDrawerOpen()) {
  <!-- Backdrop Blur -->
  <div 
    class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 transition-opacity" 
    (click)="closeDrawer()"
  ></div>

  <!-- Slide-in Drawer Container -->
  <div 
    class="fixed inset-y-0 right-0 max-w-lg w-full bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col border-l border-slate-200 dark:border-slate-800"
  >
    <!-- Header -->
    <div class="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
      <div>
        <h3 class="text-lg font-bold text-slate-900 dark:text-white">
          {{ isEditing() ? 'Kaydı Düzenle' : 'Yeni Kayıt Ekle' }}
        </h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Bilgileri güncelleyin veya yeni alanları tanımlayın.
        </p>
      </div>
      <button 
        type="button" 
        (click)="closeDrawer()" 
        class="w-9 h-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition-colors"
      >
        <mat-icon [svgIcon]="'heroicons_outline:x-mark'"></mat-icon>
      </button>
    </div>

    <!-- Scrollable Body with custom-scroll -->
    <div class="flex-1 overflow-y-auto p-6 space-y-4 custom-scroll">
      <div>
        <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
          Kayıt Adı <span class="text-rose-500">*</span>
        </label>
        <input 
          type="text" 
          [(ngModel)]="form.name" 
          placeholder="Örn: Holstein Düve"
          class="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
        />
      </div>
    </div>

    <!-- Sticky Footer -->
    <div class="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end gap-3">
      <button 
        type="button" 
        (click)="closeDrawer()" 
        class="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
      >
        Vazgeç
      </button>
      <button 
        type="button" 
        (click)="saveRecord()" 
        [disabled]="isSaving()" 
        class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
      >
        <span>Kaydet</span>
      </button>
    </div>
  </div>
}
```
