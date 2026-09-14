import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRippleModule } from '@angular/material/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { AnimalService } from '../../core/services/animal.service';
import { TaskService } from '../../core/services/task.service';
import { TreatmentService } from '../../core/services/treatment.service';
import { MatingService } from '../../core/services/mating.service';
import { YieldRecordService } from '../../core/services/yield-record.service';
import { ActivityLogService } from '../../core/services/activity-log.service';
import { PaddockService } from '../../core/services/definitions/paddock.service';
import { HerdService } from '../../core/services/definitions/herd.service';
import { AuthService } from '../../core/auth/auth.service';
import { FarmContextService } from '../../core/services/farm-context.service';
import { Animal, FarmTask, Treatment, Mating, YieldRecord } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatRippleModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private router = inject(Router);
  private authService = inject(AuthService);
  private farmContext = inject(FarmContextService);

  private animalService = inject(AnimalService);
  private taskService = inject(TaskService);
  private treatmentService = inject(TreatmentService);
  private matingService = inject(MatingService);
  private yieldService = inject(YieldRecordService);
  private activityLogService = inject(ActivityLogService);
  private paddockService = inject(PaddockService);
  private herdService = inject(HerdService);

  // User & Farm
  appUser = toSignal(this.authService.appUser$);
  activeFarmId = this.farmContext.activeFarmId;
  farmName = this.farmContext.activeFarmName;

  userInitials = computed(() => {
    const name = this.appUser()?.displayName || this.appUser()?.email || 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  });

  // Live Signals
  animals = toSignal(this.animalService.list(), { initialValue: [] as Animal[] });
  tasks = toSignal(this.taskService.list(), { initialValue: [] as FarmTask[] });
  treatments = toSignal(this.treatmentService.list(), { initialValue: [] as Treatment[] });
  matings = toSignal(this.matingService.list(), { initialValue: [] as Mating[] });
  yields = toSignal(this.yieldService.list(), { initialValue: [] as YieldRecord[] });
  paddocks = toSignal(this.paddockService.list(), { initialValue: [] });
  herds = toSignal(this.herdService.list(), { initialValue: [] });
  activities = toSignal(this.activityLogService.list(), { initialValue: [] });

  // Animal Metrics
  totalAnimals = computed(() => this.animals().length);
  activeCount = computed(() => this.animals().filter((a) => a.status === 'aktif').length);
  passiveCount = computed(() => this.animals().filter((a) => a.status !== 'aktif').length);
  femaleCount = computed(() => this.animals().filter((a) => a.gender === 'disi').length);
  maleCount = computed(() => this.animals().filter((a) => a.gender === 'erkek').length);
  femaleRatio = computed(() => {
    const total = this.totalAnimals();
    return total > 0 ? Math.round((this.femaleCount() / total) * 100) : 0;
  });

  // Mating / Breeding Metrics
  pregnantCount = computed(() => this.matings().filter((m) => m.status === 'gebe').length);
  observationCount = computed(() => this.matings().filter((m) => m.status === 'gozlem').length);
  matedCount = computed(() => this.matings().filter((m) => m.status === 'koculdu').length);
  birthCount = computed(() => this.matings().filter((m) => m.status === 'dogurdu').length);
  pregnancyRate = computed(() => {
    const females = this.femaleCount();
    if (females === 0) return 0;
    return Math.min(100, Math.round((this.pregnantCount() / females) * 100));
  });

  // Yields (Milk)
  milkRecords = computed(() => this.yields().filter((y) => y.type === 'sut'));
  todayMilkYield = computed(() => {
    // Sum all milk yields for demonstration / records
    return this.milkRecords().reduce((acc, y) => acc + (Number(y.amount) || 0), 0);
  });

  // Tasks & Health
  pendingTasks = computed(() => this.tasks().filter((t) => t.status === 'bekliyor' || t.status === 'devam-ediyor'));
  pendingTreatments = computed(() => this.treatments().slice(0, 5));

  // Paddock occupancy
  paddockStats = computed(() => {
    const allPaddocks = this.paddocks();
    const allAnimals = this.animals();
    return allPaddocks.map((pad) => {
      const count = allAnimals.filter((a) => a.paddockId === pad.id).length;
      const cap = pad.capacity || 50;
      const percent = Math.min(100, Math.round((count / cap) * 100));
      return {
        id: pad.id,
        name: pad.name,
        count,
        capacity: cap,
        percent,
      };
    });
  });

  navigateTo(path: string) {
    this.router.navigate([path]);
  }
}
