# CRUD List & Data Table Pattern (Odivon Design System)

The standard list page combines a header with action buttons, live search and filter chips, a structured responsive data table, and an empty state card.

```html
<div class="space-y-6">

  <!-- 1. Page Header -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h1 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
        Stok Yönetimi
      </h1>
      <p class="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
        Yem, ilaç ve sarf malzeme giriş çıkışlarını takip edin.
      </p>
    </div>
    <div class="flex items-center gap-3">
      <button 
        type="button" 
        (click)="openDrawer()"
        class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
      >
        <mat-icon class="icon-size-4.5" [svgIcon]="'heroicons_solid:plus'"></mat-icon>
        <span>+ Yeni Kayıt</span>
      </button>
    </div>
  </div>

  <!-- 2. Search & Filter Toolbar -->
  <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
    <div class="relative flex-1">
      <mat-icon class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 icon-size-4.5" [svgIcon]="'heroicons_solid:magnifying-glass'"></mat-icon>
      <input 
        type="text" 
        [value]="searchQuery()" 
        (input)="onSearch($event)"
        placeholder="Ara..."
        class="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
      />
    </div>
  </div>

  <!-- 3. Responsive Data Table -->
  <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
    <div class="overflow-x-auto custom-scroll">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <th class="py-3.5 px-6">Ad / Tanım</th>
            <th class="py-3.5 px-6">Kategori</th>
            <th class="py-3.5 px-6">Miktar</th>
            <th class="py-3.5 px-6">Durum</th>
            <th class="py-3.5 px-6 text-right">İşlemler</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs sm:text-sm">
          @for (item of filteredList(); track item.id) {
            <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
              <td class="py-4 px-6 font-bold text-slate-900 dark:text-white">
                {{ item.name }}
              </td>
              <td class="py-4 px-6 text-slate-600 dark:text-slate-300">
                {{ item.category }}
              </td>
              <td class="py-4 px-6 font-semibold text-slate-700 dark:text-slate-200">
                {{ item.quantity }} {{ item.unit }}
              </td>
              <td class="py-4 px-6">
                <span class="px-2.5 py-1 rounded-lg text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/40">
                  Aktif
                </span>
              </td>
              <td class="py-4 px-6 text-right">
                <div class="flex items-center justify-end gap-1">
                  <button 
                    type="button" 
                    (click)="openEditDrawer(item)"
                    class="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 flex items-center justify-center transition-colors"
                  >
                    <mat-icon class="icon-size-4" [svgIcon]="'heroicons_outline:pencil'"></mat-icon>
                  </button>
                  <button 
                    type="button" 
                    (click)="deleteItem(item)"
                    class="w-8 h-8 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors"
                  >
                    <mat-icon class="icon-size-4" [svgIcon]="'heroicons_outline:trash'"></mat-icon>
                  </button>
                </div>
              </td>
            </tr>
          } @empty {
            <!-- Empty State -->
            <tr>
              <td colspan="5" class="py-16 text-center">
                <div class="max-w-sm mx-auto flex flex-col items-center">
                  <div class="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-4">
                    <mat-icon class="icon-size-8" [svgIcon]="'heroicons_outline:folder-open'"></mat-icon>
                  </div>
                  <h4 class="text-base font-bold text-slate-900 dark:text-white">Henüz Kayıt Bulunamadı</h4>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5">
                    Yeni bir kayıt oluşturarak hemen başlayabilirsiniz.
                  </p>
                  <button 
                    type="button" 
                    (click)="openDrawer()"
                    class="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
                  >
                    + İlk Kaydı Ekle
                  </button>
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  </div>

</div>
```
