import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UpdateBanner } from './shared/components/update-banner/update-banner';
import { VersionService } from './core/version/version.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, UpdateBanner],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('ciftlik-projesi');
  // Yeni sürüm yayınlandığında açık sekmeleri uyarır (/version.json).
  private readonly version = inject(VersionService);

  constructor() {
    this.version.start();
  }
}
