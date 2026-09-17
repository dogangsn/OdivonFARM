---
name: odivon-ui-design-system
description: >-
  Enterprise-grade UI/UX design system and frontend architectural patterns extracted from the Odivon SaaS platform.
  Use when designing, building, or refactoring modern web applications, SaaS dashboards, executive KPI cards,
  slide-over drawers, data tables, filter toolbars, and responsive enterprise layouts.
---

# Odivon UI/UX Design System & Enterprise Frontend Architecture

The **Odivon Design System** is an enterprise-grade, aesthetic, and functional UI framework designed for high-density, mission-critical SaaS applications (agricultural management, ERP, logistics, telemetry, health, and enterprise analytics).

It pairs **Angular (Standalone, Signals, Zoneless-ready)** with **Tailwind CSS**, curated **HSL accent palettes**, **glassmorphism**, **executive KPI cards**, **slide-over drawers**, and **frictionless CRUD patterns**.

---

## 1. Visual Philosophy & Core Foundations

- **Contrast & Depth:** Light mode features clean `#f8fafc` surfaces with crisp `#ffffff` cards and subtle borders (`border-slate-200/80`). Dark mode utilizes rich deep navy `#0b1120` with `#1e293b` surfaces and `#334155` borders. Avoid harsh pure black (`#000000`) or flat grey backgrounds.
- **Typography:** Primary font is **`Plus Jakarta Sans`** (or Inter/Outfit) with strict weight hierarchy:
  - KPI Numbers: `text-4xl` to `text-5xl font-black tracking-tight leading-none`
  - Section Headers: `text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight`
  - Table Headers & Badges: `text-[11px]` to `text-xs font-bold uppercase tracking-wider`
  - Secondary Text: `text-xs font-semibold text-slate-500 dark:text-slate-400`
- **Border Radius Hierarchy:**
  - Executive KPI Cards & Major Panels: `rounded-2xl` (16px) or `rounded-3xl` (24px)
  - Input fields, Filter bars, Buttons, Drawers: `rounded-xl` (12px)
  - Tooltips, Menu items, Small action buttons: `rounded-lg` (8px)
  - Status badges, Avatars, Live indicators: `rounded-full`
- **Curated Color Tokens (Semantic Palette):**
  - **Primary (Indigo/Violet):** `#6366f1` / `#4f46e5` (General actions, primary buttons, branding)
  - **Positive / Health (Emerald/Teal):** `bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200`
  - **Warning / Pending (Amber):** `bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200`
  - **Critical / Danger (Rose/Red):** `bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200`
  - **Info / Secondary (Sky/Blue):** `bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200`
  - **Special / Breeding / Roles (Purple/Pink):** `bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200`

---

## 2. Key UI Component Blueprints

### A. Executive KPI Cards (4-Column Grid)
Display primary metrics in an instant-read executive card layout:
```html
<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
  <div class="kpi-card p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
    <!-- Header: Label + Themed Icon Badge -->
    <div class="flex items-center justify-between">
      <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Canlı Varlık</span>
      <div class="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
        <mat-icon class="icon-size-5" [svgIcon]="'heroicons_solid:user-group'"></mat-icon>
      </div>
    </div>

    <!-- Big Number Metric -->
    <div class="mt-4">
      <div class="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
        {{ totalCount() }}
      </div>
      <div class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
        Kayıtlı ve Aktif Varlık
      </div>
    </div>

    <!-- Sub-Metrics Footer -->
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
</div>
```

### B. Slide-over Edit/Create Drawer (Non-blocking Workflow)
Always prefer a slide-over drawer over jarring page reloads or tiny cramped modals for creating and editing records:
```html
@if (isDrawerOpen()) {
  <!-- Backdrop -->
  <div
    class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 transition-opacity"
    (click)="closeDrawer()"
  ></div>

  <!-- Drawer Container -->
  <div
    class="fixed inset-y-0 right-0 max-w-lg w-full bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200"
  >
    <!-- Drawer Header -->
    <div class="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
      <div>
        <h3 class="text-lg font-bold text-slate-900 dark:text-white">
          {{ isEditing() ? 'Kaydı Düzenle' : 'Yeni Kayıt Oluştur' }}
        </h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Bilgileri eksiksiz doldurarak kaydedin.
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

    <!-- Scrollable Body -->
    <div class="flex-1 overflow-y-auto p-6 space-y-4 custom-scroll">
      <!-- Input fields with rounded-xl and dark mode styling -->
    </div>

    <!-- Sticky Drawer Footer -->
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

### C. Live Search, Filter Bar & Action Toolbar
Provide rich instant search and filter controls atop every list or table:
```html
<div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
  <div class="relative flex-1">
    <mat-icon class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 icon-size-4.5" [svgIcon]="'heroicons_solid:magnifying-glass'"></mat-icon>
    <input
      type="text"
      [value]="searchQuery()"
      (input)="onSearchInput($event)"
      placeholder="Ara (isim, kod, açıklama)..."
      class="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
    />
  </div>

  <div class="flex items-center gap-2">
    <button
      type="button"
      (click)="openDrawer()"
      class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
    >
      <mat-icon class="icon-size-4" [svgIcon]="'heroicons_solid:plus'"></mat-icon>
      <span>+ Yeni Ekle</span>
    </button>
  </div>
</div>
```

---

## 3. Angular Architecture & Reactivity Principles

1. **Signals Everywhere:**
   - Use `signal()`, `computed()`, and `toSignal()` rather than manual `subscribe()` / `unsubscribe()`.
   - Never use `ChangeDetectorRef.markForCheck()` when Signals handle reactivity natively.
2. **Generic List Base (`SimpleCrudListBase<T>`):**
   - Inherit simple CRUD components from a shared base class to provide search, sort, pagination, batch select, soft-delete, and duplicate cleaning automatically.
3. **Optimistic & Safe Actions:**
   - Always confirm irreversible deletions with a customized SweetAlert2 modal before executing.
   - For soft-deletable records, set `deletedAt = serverTimestamp()` so users can recover them from a Recycle Bin.
