# Executive KPI Cards Pattern (Odivon Design System)

Executive KPI cards offer instant high-level situational awareness across dashboards.

### Responsive 4-Column Card Grid

```html
<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
  
  <!-- KPI 1: Primary Counter (Emerald Accent) -->
  <div class="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
    <div class="flex items-center justify-between">
      <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Toplam Varlık</span>
      <div class="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
        <mat-icon [svgIcon]="'heroicons_solid:user-group'"></mat-icon>
      </div>
    </div>
    <div class="mt-4">
      <div class="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
        {{ totalCount() }}
      </div>
      <div class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
        Canlı ve Aktif Varlık
      </div>
    </div>
    <div class="flex items-center justify-between mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 text-xs">
      <span class="text-slate-500 dark:text-slate-400">
        <strong class="text-slate-900 dark:text-white font-bold">{{ activeCount() }}</strong> Aktif
      </span>
      <span class="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        Canlı Veri
      </span>
    </div>
  </div>

  <!-- KPI 2: Secondary Metric with Percentage (Rose Accent) -->
  <div class="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
    <div class="flex items-center justify-between">
      <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Üreme & Gebelik</span>
      <div class="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
        <mat-icon [svgIcon]="'heroicons_solid:heart'"></mat-icon>
      </div>
    </div>
    <div class="mt-4">
      <div class="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
        {{ pregnantCount() }}
      </div>
      <div class="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-1">
        Gebe Hayvan
      </div>
    </div>
    <div class="flex items-center justify-between mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 text-xs">
      <span class="text-slate-500 dark:text-slate-400">
        <strong class="text-slate-900 dark:text-white font-bold">{{ observationCount() }}</strong> Gözlemde
      </span>
      <span class="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold">
        <span>%{{ pregnancyRate() }}</span> Oran
      </span>
    </div>
  </div>

  <!-- KPI 3: Yield / Financial (Sky Accent) -->
  <div class="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
    <div class="flex items-center justify-between">
      <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Günlük Verim</span>
      <div class="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
        <mat-icon [svgIcon]="'heroicons_solid:beaker'"></mat-icon>
      </div>
    </div>
    <div class="mt-4">
      <div class="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
        {{ todayYield() }}
        <span class="text-xl font-bold text-slate-400">Lt</span>
      </div>
      <div class="text-xs font-semibold text-sky-600 dark:text-sky-400 mt-1">
        Bugünkü Sağım Verimi
      </div>
    </div>
    <div class="flex items-center justify-between mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 text-xs">
      <span class="text-slate-500 dark:text-slate-400">
        <strong class="text-slate-900 dark:text-white font-bold">{{ totalYield() }} Lt</strong> Toplam
      </span>
      <span class="text-slate-400 font-semibold">{{ recordCount() }} Kayıt</span>
    </div>
  </div>

  <!-- KPI 4: Pending Operations / Tasks (Amber Accent) -->
  <div class="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
    <div class="flex items-center justify-between">
      <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Bekleyen Görevler</span>
      <div class="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
        <mat-icon [svgIcon]="'heroicons_solid:clock'"></mat-icon>
      </div>
    </div>
    <div class="mt-4">
      <div class="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
        {{ pendingCount() }}
      </div>
      <div class="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-1">
        Müdahale Bekleyen İşlem
      </div>
    </div>
    <div class="flex items-center justify-between mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 text-xs">
      <span class="text-slate-500 dark:text-slate-400">
        <strong class="text-slate-900 dark:text-white font-bold">{{ highPriorityCount() }}</strong> Acil
      </span>
      <span class="text-amber-600 dark:text-amber-400 font-bold">Bugün</span>
    </div>
  </div>

</div>
```
