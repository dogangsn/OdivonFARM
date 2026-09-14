import { Directive, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { FirestoreCrudService } from '../../../core/services/firestore-crud.service';
import { BaseDoc } from '../../../core/models/base.model';

export interface NamedEntity extends BaseDoc {
  name: string;
}

/**
 * "Tanımlamalar" altındaki tek alanlı (isim) basit varlıklar için ortak davranış:
 * Irklar, Hayvan Tipleri, Sürüler, Padoklar, Etiketler, Ölüm Nedenleri,
 * Tedavi Türleri, Hastalıklar, Depolar, Muhasebe Kalemleri vb.
 *
 * Kullanım: her varlık için küçük bir bileşen, bu sınıftan türetilir ve
 * `simple-crud-list.component.html` şablonunu paylaşır — bkz. breeds.component.ts örneği.
 */
@Directive()
export abstract class SimpleCrudListBase<T extends NamedEntity> {
  abstract service: FirestoreCrudService<T>;
  abstract title: string;
  addLabel = 'Ekle';

  newName = signal('');
  items$: Observable<T[]> = of([]);

  /** Alt sınıf constructor'ında service atandıktan hemen sonra çağrılmalı */
  protected init() {
    this.items$ = this.service.list();
  }

  async add() {
    const name = this.newName().trim();
    if (!name) return;
    await this.service.create({ name } as Partial<T>);
    this.newName.set('');
  }

  async remove(id: string) {
    await this.service.softDelete(id);
  }
}
