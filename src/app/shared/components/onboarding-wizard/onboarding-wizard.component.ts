import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { OnboardingService, OnboardingStep, SystemTourItem } from '../../../core/services/onboarding.service';

@Component({
  selector: 'app-onboarding-wizard',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    @if (onboardingService.isWizardOpen()) {
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 transition-opacity animate-in fade-in duration-200"
        (click)="close()"
      ></div>

      <!-- Modal Container -->
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        <div
          class="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col pointer-events-auto overflow-hidden animate-in zoom-in-95 duration-200"
        >
          <!-- Header -->
          <div class="p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-indigo-50/40 dark:from-slate-900 dark:to-indigo-950/20 flex items-center justify-between">
            <div class="flex items-center gap-3.5">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/25">
                <mat-icon class="icon-size-6" [svgIcon]="'heroicons_solid:academic-cap'"></mat-icon>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    OdivonFARM Eğitim & Kurulum Sihirbazı
                  </h2>
                  <span class="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold tracking-wide uppercase bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                    Sistem Rehberi
                  </span>
                </div>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Çiftliğinizi akıllı hayvancılık standartlarına taşıyacak adımları tamamlayın ve modülleri keşfedin.
                </p>
              </div>
            </div>

            <button
              type="button"
              (click)="close()"
              class="w-10 h-10 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
            >
              <mat-icon [svgIcon]="'heroicons_outline:x-mark'"></mat-icon>
            </button>
          </div>

          <!-- Progress Ribbon -->
          <div class="px-6 py-4 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200/70 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex-1 max-w-md">
              <div class="flex items-center justify-between text-xs font-bold mb-1.5">
                <span class="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <mat-icon class="icon-size-4 text-indigo-500" [svgIcon]="'heroicons_solid:check-badge'"></mat-icon>
                  Kurulum İlerlemesi ({{ onboardingService.completedCount() }}/{{ onboardingService.totalSteps() }})
                </span>
                <span class="text-indigo-600 dark:text-indigo-400 font-extrabold">
                  %{{ onboardingService.progressPercent() }}
                </span>
              </div>
              <div class="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  class="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 transition-all duration-500"
                  [style.width.%]="onboardingService.progressPercent()"
                ></div>
              </div>
            </div>

            <!-- Tab Switcher -->
            <div class="flex items-center gap-1 p-1 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                (click)="setTab('steps')"
                [class.bg-indigo-600]="onboardingService.activeTab() === 'steps'"
                [class.text-white]="onboardingService.activeTab() === 'steps'"
                [class.text-slate-600]="onboardingService.activeTab() !== 'steps'"
                [class.dark:text-slate-300]="onboardingService.activeTab() !== 'steps'"
                class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <mat-icon class="icon-size-4" [svgIcon]="'heroicons_solid:list-bullet'"></mat-icon>
                <span>Kurulum Adımları</span>
              </button>
              <button
                type="button"
                (click)="setTab('tour')"
                [class.bg-indigo-600]="onboardingService.activeTab() === 'tour'"
                [class.text-white]="onboardingService.activeTab() === 'tour'"
                [class.text-slate-600]="onboardingService.activeTab() !== 'tour'"
                [class.dark:text-slate-300]="onboardingService.activeTab() !== 'tour'"
                class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <mat-icon class="icon-size-4" [svgIcon]="'heroicons_solid:sparkles'"></mat-icon>
                <span>Modül Eğitimi</span>
              </button>
            </div>
          </div>

          <!-- Body Content -->
          <div class="flex-1 overflow-y-auto p-6 space-y-4 custom-scroll">
            <!-- TAB 1: STEPS -->
            @if (onboardingService.activeTab() === 'steps') {
              @if (onboardingService.isCompleted()) {
                <div class="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 flex items-center gap-4 animate-in fade-in">
                  <div class="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/30">
                    <mat-icon class="icon-size-6" [svgIcon]="'heroicons_solid:check'"></mat-icon>
                  </div>
                  <div>
                    <h4 class="text-sm font-black text-emerald-900 dark:text-emerald-200">
                      Tebrikler! Çiftlik Kurulumu Tamamlandı
                    </h4>
                    <p class="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                      Çiftliğiniz TAGEM uyumlu ıslah, IoT tartı entegrasyonu ve dijital sürü takibi için tamamen hazır.
                    </p>
                  </div>
                </div>
              }

              <div class="grid grid-cols-1 gap-3.5">
                @for (step of onboardingService.stepsWithStatus(); track step.key) {
                  <div
                    class="p-4 rounded-2xl border transition-all duration-200 flex items-start justify-between gap-4"
                    [ngClass]="
                      step.isCompleted
                        ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 opacity-90'
                        : 'bg-white dark:bg-slate-900 border-indigo-100 dark:border-indigo-950/60 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700'
                    "
                  >
                    <!-- Left: Checkbox & Texts -->
                    <div class="flex items-start gap-3.5 flex-1">
                      <button
                        type="button"
                        (click)="toggleStep(step.key)"
                        class="w-8 h-8 rounded-xl flex items-center justify-center transition-all mt-0.5 cursor-pointer shrink-0"
                        [ngClass]="
                          step.isCompleted
                            ? 'bg-emerald-500 text-white shadow-xs'
                            : 'border-2 border-slate-300 dark:border-slate-600 hover:border-indigo-500 text-transparent'
                        "
                      >
                        <mat-icon class="icon-size-5" [svgIcon]="'heroicons_solid:check'"></mat-icon>
                      </button>

                      <div class="space-y-1">
                        <div class="flex items-center gap-2 flex-wrap">
                          <span class="text-xs font-black" [ngClass]="step.isCompleted ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white'">
                            {{ step.order }}. {{ step.title }}
                          </span>
                          @if (step.badgeText) {
                            <span class="px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wide uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {{ step.badgeText }}
                            </span>
                          }
                        </div>
                        <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          {{ step.description }}
                        </p>
                      </div>
                    </div>

                    <!-- Right Action Button -->
                    <div class="shrink-0 flex items-center gap-2">
                      @if (step.route) {
                        <button
                          type="button"
                          (click)="goToRoute(step.route)"
                          class="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:border-indigo-300 dark:hover:border-indigo-700 text-indigo-600 dark:text-indigo-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>{{ step.actionText }}</span>
                          <mat-icon class="icon-size-3.5" [svgIcon]="'heroicons_solid:arrow-right'"></mat-icon>
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
            }

            <!-- TAB 2: SYSTEM TOUR -->
            @if (onboardingService.activeTab() === 'tour') {
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                @for (item of onboardingService.SYSTEM_TOUR; track item.id) {
                  <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                    <div>
                      <div class="flex items-center justify-between mb-3">
                        <span class="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                          {{ item.category }}
                        </span>
                        <div class="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                          <mat-icon class="icon-size-4" [svgIcon]="item.icon"></mat-icon>
                        </div>
                      </div>

                      <h4 class="text-sm font-bold text-slate-900 dark:text-white">
                        {{ item.title }}
                      </h4>
                      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-3">
                        {{ item.summary }}
                      </p>

                      <ul class="space-y-1.5 mb-4">
                        @for (feat of item.keyFeatures; track feat) {
                          <li class="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                            <mat-icon class="icon-size-3.5 text-emerald-500 shrink-0" [svgIcon]="'heroicons_solid:check'"></mat-icon>
                            <span>{{ feat }}</span>
                          </li>
                        }
                      </ul>
                    </div>

                    <button
                      type="button"
                      (click)="goToRoute(item.route)"
                      class="w-full py-2 rounded-xl bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Modüle Git</span>
                      <mat-icon class="icon-size-3.5" [svgIcon]="'heroicons_solid:arrow-top-right-on-square'"></mat-icon>
                    </button>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Footer -->
          <div class="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between">
            <div class="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <mat-icon class="icon-size-4 text-slate-400" [svgIcon]="'heroicons_solid:document-text'"></mat-icon>
              <span>Üniversite ve TAGEM Kapsam Şartnamesi mevcuttur.</span>
            </div>

            <div class="flex items-center gap-3">
              <button
                type="button"
                (click)="onboardingService.resetProgress()"
                class="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
              >
                Sıfırla
              </button>
              <button
                type="button"
                (click)="close()"
                class="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class OnboardingWizardComponent {
  onboardingService = inject(OnboardingService);
  private router = inject(Router);

  setTab(tab: 'steps' | 'tour'): void {
    this.onboardingService.activeTab.set(tab);
  }

  toggleStep(stepKey: string): void {
    this.onboardingService.toggleStepComplete(stepKey);
  }

  goToRoute(route: string): void {
    this.close();
    this.router.navigate([route]);
  }

  close(): void {
    this.onboardingService.closeWizard();
  }
}
