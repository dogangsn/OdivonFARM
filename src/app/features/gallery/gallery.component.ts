import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { toSignal } from '@angular/core/rxjs-interop';
import { FarmPhotoService } from '../../core/services/farm-photo.service';
import { AnimalService } from '../../core/services/animal.service';
import { FarmPhoto } from '../../core/models/operations.model';
import { Animal } from '../../core/models/animal.model';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss'],
})
export class GalleryComponent {
  private photoService = inject(FarmPhotoService);
  private animalService = inject(AnimalService);

  readonly photos = toSignal(this.photoService.list(), { initialValue: [] as FarmPhoto[] });
  readonly animals = toSignal(this.animalService.list(), { initialValue: [] as Animal[] });

  // Filters
  readonly searchTerm = signal('');
  readonly scopeFilter = signal<'all' | 'animal' | 'farm'>('all');

  // Lightbox
  readonly previewPhoto = signal<FarmPhoto | null>(null);

  // Drawer
  readonly showDrawer = signal(false);
  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // Form Model
  readonly form = signal<{
    url: string;
    caption: string;
    relatedAnimalId?: string;
  }>({
    url: '',
    caption: '',
    relatedAnimalId: '',
  });

  // Preset sample farm/sheep photos for quick demonstration
  readonly sampleImages = [
    { label: 'Otlaktaki Koyun Sürüsü', url: 'https://images.unsplash.com/photo-1484557052118-f32bd25b45b5?auto=format&fit=crop&w=800&q=80' },
    { label: 'Kuzu ve Anne', url: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=800&q=80' },
    { label: 'Damızlık Koç', url: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=800&q=80' },
    { label: 'Modern Ağıl / Padok', url: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=800&q=80' },
  ];

  // Animal Map
  readonly animalMap = computed(() => {
    const map = new Map<string, Animal>();
    for (const a of this.animals() || []) {
      if (a?.id) map.set(a.id, a);
    }
    return map;
  });

  // Filtered Photos
  readonly filteredPhotos = computed(() => {
    let list = this.photos() || [];
    const query = (this.searchTerm() || '').trim().toLowerCase();
    const scope = this.scopeFilter();

    if (scope === 'animal') {
      list = list.filter((p) => !!p.relatedAnimalId);
    } else if (scope === 'farm') {
      list = list.filter((p) => !p.relatedAnimalId);
    }

    if (query) {
      list = list.filter((p) => {
        const caption = p.caption?.toLowerCase() || '';
        const animal = p.relatedAnimalId ? this.animalMap().get(p.relatedAnimalId) : null;
        const tag = animal?.farmTagNo?.toLowerCase() || '';
        const name = animal?.name?.toLowerCase() || '';

        return caption.includes(query) || tag.includes(query) || name.includes(query);
      });
    }

    return [...(list || [])].sort((a, b) => {
      const timeA = this.getTime(a.createdAt);
      const timeB = this.getTime(b.createdAt);
      return timeB - timeA;
    });
  });

  // Stats
  readonly stats = computed(() => {
    const list = this.photos() || [];
    const animalLinked = list.filter((p) => !!p.relatedAnimalId).length;
    const farmGeneral = list.length - animalLinked;

    return {
      total: list.length,
      animalLinked,
      farmGeneral,
    };
  });

  openAddDrawer() {
    this.errorMessage.set(null);
    this.form.set({
      url: this.sampleImages[0].url,
      caption: '',
      relatedAnimalId: '',
    });
    this.showDrawer.set(true);
  }

  closeDrawer() {
    this.showDrawer.set(false);
    this.errorMessage.set(null);
  }

  selectSampleImage(url: string, label: string) {
    this.form.update((prev) => ({
      ...prev,
      url,
      caption: prev.caption || label,
    }));
  }

  async savePhoto() {
    const f = this.form();
    if (!f.url.trim()) {
      this.errorMessage.set('Lütfen bir fotoğraf URL adresi girin.');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    try {
      const payload: Partial<FarmPhoto> = {
        url: f.url.trim(),
        caption: f.caption.trim() || undefined,
        relatedAnimalId: f.relatedAnimalId || undefined,
      };

      await this.photoService.create(payload as any);
      this.closeDrawer();
    } catch (err: any) {
      console.error('Fotoğraf kaydedilemedi:', err);
      this.errorMessage.set(err?.message || 'Fotoğraf kaydedilirken hata oluştu.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async deletePhoto(id?: string) {
    if (!id) return;
    if (!confirm('Bu fotoğrafı silmek istediğinize emin misiniz?')) {
      return;
    }
    try {
      await this.photoService.softDelete(id);
      if (this.previewPhoto()?.id === id) {
        this.previewPhoto.set(null);
      }
    } catch (err) {
      console.error('Silme hatası:', err);
      alert('Fotoğraf silinirken hata oluştu.');
    }
  }

  // Helpers
  getAnimal(id?: string): Animal | undefined {
    return id ? this.animalMap().get(id) : undefined;
  }

  private getTime(val: any): number {
    if (!val) return 0;
    if (val.seconds) return val.seconds * 1000;
    if (val.toDate && typeof val.toDate === 'function') return val.toDate().getTime();
    if (val instanceof Date) return val.getTime();
    return new Date(val).getTime() || 0;
  }
}
