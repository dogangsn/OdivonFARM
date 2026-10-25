import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export interface AuthHighlight {
  icon: string;
  title: string;
  text: string;
}

/**
 * Login ve kayıt ekranlarının sol tarafındaki marka / tanıtım paneli.
 * Sadece geniş ekranlarda (lg+) görünür.
 */
@Component({
  selector: 'app-auth-showcase',
  standalone: true,
  imports: [MatIconModule],
  host: { class: 'hidden lg:flex lg:w-[46%] xl:w-1/2 shrink-0' },
  template: `
    <div class="relative flex flex-col justify-between w-full min-h-screen p-12 xl:p-16 overflow-hidden text-white bg-gradient-to-br from-[#0b1120] via-[#1e1b4b] to-[#312e81]">
      <!-- Arka plan dokusu -->
      <div class="absolute inset-0 auth-grid opacity-[0.07] pointer-events-none"></div>
      <div class="absolute -top-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-indigo-500/25 blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-40 -left-24 w-[26rem] h-[26rem] rounded-full bg-emerald-500/15 blur-3xl pointer-events-none"></div>

      <!-- Logo -->
      <div class="relative flex items-center gap-3">
        <img src="images/logo.png" alt="OdivonFARM" class="w-11 h-11 rounded-xl object-cover ring-1 ring-white/15 shadow-lg shadow-black/30" />
        <div class="flex flex-col leading-tight">
          <span class="text-xl font-black tracking-tight">Odivon<span class="text-indigo-300">FARM</span></span>
          <span class="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-200/70">Çiftlik Yönetim Sistemi</span>
        </div>
      </div>

      <!-- Başlık ve öne çıkanlar -->
      <div class="relative max-w-lg">
        <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 ring-1 ring-white/15 text-xs font-semibold text-indigo-100">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          {{ badge() }}
        </span>
        <h1 class="mt-5 text-4xl xl:text-[2.75rem] font-black tracking-tight leading-[1.1]">
          {{ title() }}
        </h1>
        <p class="mt-4 text-sm xl:text-base text-indigo-100/75 leading-relaxed">
          {{ subtitle() }}
        </p>

        <ul class="mt-10 space-y-5">
          @for (h of highlights(); track h.title) {
            <li class="flex items-start gap-4">
              <div class="w-11 h-11 shrink-0 rounded-xl bg-white/10 ring-1 ring-white/15 flex items-center justify-center">
                <mat-icon class="icon-size-5 text-indigo-200" [svgIcon]="h.icon"></mat-icon>
              </div>
              <div>
                <div class="text-sm font-bold">{{ h.title }}</div>
                <div class="text-sm text-indigo-100/65 leading-relaxed">{{ h.text }}</div>
              </div>
            </li>
          }
        </ul>
      </div>

      <!-- Alt bilgi -->
      <div class="relative flex items-center gap-2 text-xs text-indigo-100/60">
        <mat-icon class="icon-size-4 text-emerald-400" [svgIcon]="'heroicons_solid:shield-check'"></mat-icon>
        <span>Verileriniz şifreli bağlantı ile güvenle saklanır.</span>
      </div>
    </div>
  `,
  styles: `
    .auth-grid {
      background-image:
        linear-gradient(to right, #fff 1px, transparent 1px),
        linear-gradient(to bottom, #fff 1px, transparent 1px);
      background-size: 48px 48px;
      mask-image: radial-gradient(ellipse at 30% 40%, #000 30%, transparent 75%);
    }
  `,
})
export class AuthShowcaseComponent {
  badge = input('Koyun & keçi işletmeleri için');
  title = input('');
  subtitle = input('');
  highlights = input<AuthHighlight[]>([]);
}
