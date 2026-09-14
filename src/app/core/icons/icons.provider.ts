import { inject, provideEnvironmentInitializer } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

export function provideIcons() {
  return provideEnvironmentInitializer(() => {
    const iconRegistry = inject(MatIconRegistry);
    const sanitizer = inject(DomSanitizer);

    iconRegistry.addSvgIconSet(sanitizer.bypassSecurityTrustResourceUrl('assets/icons/material-twotone.svg'));
    iconRegistry.addSvgIconSetInNamespace('mat_outline', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/material-outline.svg'));
    iconRegistry.addSvgIconSetInNamespace('mat_solid', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/material-solid.svg'));
    iconRegistry.addSvgIconSetInNamespace('feather', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/feather.svg'));
    iconRegistry.addSvgIconSetInNamespace('heroicons_outline', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/heroicons-outline.svg'));
    iconRegistry.addSvgIconSetInNamespace('heroicons_solid', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/heroicons-solid.svg'));
  });
}
