import { Component, input } from '@angular/core';

let nextId = 0;

/**
 * Çiftlik manzarası çizimi (tepeler, ahır, çit, koyunlar).
 * Üst öğede `dark` sınıfı varsa gece, yoksa gündüz olarak çizilir.
 */
@Component({
  selector: 'app-farm-scene',
  standalone: true,
  host: { class: 'block' },
  templateUrl: './farm-scene.component.html',
  styles: `
    .twinkle { animation: twinkle 3.2s ease-in-out infinite; }
    @keyframes twinkle { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
    .cloud-drift { animation: drift 40s ease-in-out infinite alternate; }
    @keyframes drift { to { transform: translateX(60px); } }
    .window-glow { filter: drop-shadow(0 0 6px rgba(252, 211, 77, 0.7)); }
    @media (prefers-reduced-motion: reduce) {
      .twinkle, .cloud-drift { animation: none; }
    }
  `,
})
export class FarmSceneComponent {
  /** Görünen alan; mobilde sadece alt kısım (tepeler) gösterilir. */
  viewBox = input('0 0 800 1000');

  /** Aynı sayfada iki çizim olduğunda degrade kimlikleri çakışmasın. */
  readonly uid = `farm-scene-${nextId++}`;

  /** Gece gökyüzündeki yıldızlar (x, y, r) */
  readonly stars = [
    [60, 80, 1.6], [140, 150, 1.2], [210, 60, 1.8], [300, 120, 1.1], [360, 40, 1.5],
    [430, 170, 1.3], [500, 90, 1.7], [560, 30, 1.2], [700, 140, 1.4], [760, 70, 1.9],
    [90, 260, 1.1], [250, 220, 1.4], [400, 280, 1.2], [520, 240, 1.0], [740, 260, 1.3],
    [180, 340, 1.0], [320, 360, 1.3], [470, 380, 1.1], [620, 330, 0.9], [40, 400, 1.2],
  ];

  /** Ön çayırdaki koyunlar (x, y, ölçek, yön) */
  readonly sheep = [
    { x: 470, y: 822, s: 1, flip: false },
    { x: 555, y: 806, s: 0.85, flip: true },
    { x: 650, y: 798, s: 0.8, flip: false },
    { x: 725, y: 826, s: 1.05, flip: true },
  ];
}
