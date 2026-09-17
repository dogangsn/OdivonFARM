import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
      },
    ],
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/components/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'anasayfa' },
      {
        path: 'anasayfa',
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'hayvanlar',
        loadComponent: () => import('./features/animals/animals.component').then((m) => m.AnimalsComponent),
      },
      {
        path: 'hayvan-hareketleri',
        loadComponent: () =>
          import('./features/animal-movements/animal-movements.component').then((m) => m.AnimalMovementsComponent),
      },
      {
        path: 'ciftlesmeler',
        loadComponent: () =>
          import('./features/breeding/breeding.component').then((m) => m.BreedingComponent),
      },
      {
        path: 'canli-agirlik',
        loadComponent: () => import('./features/weights/weights.component').then((m) => m.WeightsComponent),
      },
      {
        path: 'muhasebe',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'yonetici', 'muhasebe'] },
        loadComponent: () =>
          import('./features/accounting/accounting.component').then((m) => m.AccountingComponent),
      },
      {
        path: 'tedaviler',
        loadComponent: () =>
          import('./features/treatments/treatments.component').then((m) => m.TreatmentsComponent),
      },
      {
        path: 'gorevler',
        loadComponent: () => import('./features/tasks/tasks.component').then((m) => m.TasksComponent),
      },
      {
        path: 'sigortali-hayvanlar',
        loadComponent: () =>
          import('./features/insured-animals/insured-animals.component').then((m) => m.InsuredAnimalsComponent),
      },
      {
        path: 'stok',
        loadComponent: () =>
          import('./features/stock/stock.component').then((m) => m.StockComponent),
      },
      {
        path: 'rasyon',
        loadComponent: () =>
          import('./features/ration/ration.component').then((m) => m.RationComponent),
      },
      {
        path: 'sayim',
        loadComponent: () =>
          import('./features/counting/counting.component').then((m) => m.CountingComponent),
      },
      {
        path: 'raporlar',
        loadComponent: () =>
          import('./features/reports/reports.component').then((m) => m.ReportsComponent),
      },
      {
        path: 'verimler',
        loadComponent: () =>
          import('./features/yields/yields.component').then((m) => m.YieldsComponent),
      },
      {
        path: 'aktiviteler',
        loadComponent: () =>
          import('./features/activity-log/activity-log.component').then((m) => m.ActivityLogComponent),
      },
      {
        path: 'galeri',
        loadComponent: () =>
          import('./features/gallery/gallery.component').then((m) => m.GalleryComponent),
      },
      {
        path: 'geri-donusum',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'yonetici'] },
        loadComponent: () =>
          import('./features/recycle-bin/recycle-bin.component').then((m) => m.RecycleBinComponent),
      },
      {
        path: 'abonelik',
        loadComponent: () =>
          import('./features/subscription/subscription.component').then((m) => m.SubscriptionComponent),
      },
      {
        path: 'tanimlamalar',
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'cariler' },
          {
            path: 'cariler',
            loadComponent: () =>
              import('./features/definitions/accounts/accounts.component').then((m) => m.AccountsComponent),
          },
          {
            path: 'irklar',
            loadComponent: () =>
              import('./features/definitions/breeds/breeds.component').then((m) => m.BreedsComponent),
          },
          {
            path: 'hayvan-tipleri',
            loadComponent: () =>
              import('./features/definitions/animal-types/animal-types.component').then((m) => m.AnimalTypesComponent),
          },
          {
            path: 'suruler',
            loadComponent: () =>
              import('./features/definitions/herds/herds.component').then((m) => m.HerdsComponent),
          },
          {
            path: 'padoklar',
            loadComponent: () =>
              import('./features/definitions/paddocks/paddocks.component').then((m) => m.PaddocksComponent),
          },
          {
            path: 'tedavi-turleri',
            loadComponent: () =>
              import('./features/definitions/treatment-types/treatment-types.component').then(
                (m) => m.TreatmentTypesComponent
              ),
          },
          {
            path: 'hastaliklar',
            loadComponent: () =>
              import('./features/definitions/diseases/diseases.component').then((m) => m.DiseasesComponent),
          },
          {
            path: 'referanslar',
            loadComponent: () =>
              import('./features/definitions/references/references.component').then((m) => m.ReferencesComponent),
          },
          {
            path: 'etiketler',
            loadComponent: () =>
              import('./features/definitions/tags/tags.component').then((m) => m.TagsComponent),
          },
          {
            path: 'olum-nedenleri',
            loadComponent: () =>
              import('./features/definitions/death-reasons/death-reasons.component').then(
                (m) => m.DeathReasonsComponent
              ),
          },
          {
            path: 'depolar',
            loadComponent: () =>
              import('./features/definitions/warehouses/warehouses.component').then((m) => m.WarehousesComponent),
          },
          {
            path: 'stok-kategorileri',
            loadComponent: () =>
              import('./features/definitions/stock-categories/stock-categories.component').then(
                (m) => m.StockCategoriesComponent
              ),
          },
          {
            path: 'muhasebe-kalemleri',
            canActivate: [roleGuard],
            data: { roles: ['admin', 'yonetici', 'muhasebe'] },
            loadComponent: () =>
              import('./features/definitions/accounting-items/accounting-items.component').then(
                (m) => m.AccountingItemsComponent
              ),
          },
          {
            path: 'kullanicilar',
            canActivate: [roleGuard],
            data: { roles: ['admin'] },
            loadComponent: () =>
              import('./features/definitions/users/users.component').then((m) => m.UsersComponent),
          },
          {
            path: 'roller',
            canActivate: [roleGuard],
            data: { roles: ['admin', 'yonetici'] },
            loadComponent: () =>
              import('./features/definitions/roles/roles.component').then((m) => m.RolesComponent),
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
