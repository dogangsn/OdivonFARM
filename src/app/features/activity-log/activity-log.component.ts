import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { toSignal } from '@angular/core/rxjs-interop';

import { ActivityLogService } from '../../core/services/activity-log.service';
import { AnimalService } from '../../core/services/animal.service';
import { MatingService } from '../../core/services/mating.service';
import { TreatmentService } from '../../core/services/treatment.service';
import { WeightRecordService } from '../../core/services/weight-record.service';
import { CountService } from '../../core/services/count.service';
import { AnimalMovementService } from '../../core/services/animal-movement.service';
import { StockMovementService } from '../../core/services/stock-movement.service';
import { PaddockService } from '../../core/services/definitions/paddock.service';
import { HerdService } from '../../core/services/definitions/herd.service';
import { BreedService } from '../../core/services/definitions/breed.service';
import { TreatmentTypeService } from '../../core/services/definitions/treatment-type.service';
import { DiseaseService } from '../../core/services/definitions/disease.service';
import { AlertService } from '../../core/services/alert.service';
import { AuthService } from '../../core/auth/auth.service';
import { ActivityLogEntry } from '../../core/models/operations.model';

export interface UnifiedActivity {
  id: string;
  source: 'log' | 'animal' | 'mating' | 'treatment' | 'weight' | 'count' | 'movement' | 'stock';
  category: 'hayvan' | 'saglik' | 'ureme' | 'tartim' | 'hareket' | 'sayim' | 'stok' | 'saha' | 'diger';
  categoryLabel: string;
  action: string;
  title: string;
  description: string;
  timestamp: number;
  dateStr: string;
  timeStr: string;
  relativeTime: string;
  actorName: string;
  actorEmail?: string;
  entityName?: string;
  entityId?: string;
  icon: string;
  iconBgClass: string;
  iconColorClass: string;
  badgeClass: string;
  details?: Record<string, any>;
}

export interface ActivityDateGroup {
  groupLabel: string;
  activities: UnifiedActivity[];
}

@Component({
  selector: 'app-activity-log',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './activity-log.component.html',
  styleUrls: ['./activity-log.component.scss'],
})
export class ActivityLogComponent {
  private activityLogService = inject(ActivityLogService);
  private animalService = inject(AnimalService);
  private matingService = inject(MatingService);
  private treatmentService = inject(TreatmentService);
  private weightService = inject(WeightRecordService);
  private countService = inject(CountService);
  private movementService = inject(AnimalMovementService);
  private stockService = inject(StockMovementService);
  private paddockService = inject(PaddockService);
  private herdService = inject(HerdService);
  private breedService = inject(BreedService);
  private treatmentTypeService = inject(TreatmentTypeService);
  private diseaseService = inject(DiseaseService);
  private alertService = inject(AlertService);
  private authService = inject(AuthService);

  // Live collections
  readonly logs = toSignal(this.activityLogService.list(), { initialValue: [] as ActivityLogEntry[] });
  readonly animals = toSignal(this.animalService.list(), { initialValue: [] });
  readonly matings = toSignal(this.matingService.list(), { initialValue: [] });
  readonly treatments = toSignal(this.treatmentService.list(), { initialValue: [] });
  readonly weights = toSignal(this.weightService.list(), { initialValue: [] });
  readonly counts = toSignal(this.countService.list(), { initialValue: [] });
  readonly movements = toSignal(this.movementService.list(), { initialValue: [] });
  readonly stockMovements = toSignal(this.stockService.list(), { initialValue: [] });
  readonly paddocks = toSignal(this.paddockService.list(), { initialValue: [] });
  readonly herds = toSignal(this.herdService.list(), { initialValue: [] });
  readonly breeds = toSignal(this.breedService.list(), { initialValue: [] });
  readonly treatmentTypes = toSignal(this.treatmentTypeService.list(), { initialValue: [] });
  readonly diseases = toSignal(this.diseaseService.list(), { initialValue: [] });

  // UI state
  readonly searchTerm = signal('');
  readonly selectedCategory = signal<string>('all');
  readonly dateRangeFilter = signal<'all' | 'today' | '3days' | '7days' | 'month'>('all');
  readonly viewMode = signal<'timeline' | 'table'>('timeline');

  // Add Manual Note Modal
  readonly showAddModal = signal(false);
  readonly isSavingLog = signal(false);
  readonly addForm = signal<{
    title: string;
    category: 'saha' | 'hayvan' | 'saglik' | 'ureme' | 'tartim' | 'hareket' | 'sayim' | 'stok' | 'diger';
    description: string;
    date: string;
    time: string;
    relatedAnimalId?: string;
    relatedPaddockId?: string;
  }>({
    title: '',
    category: 'saha',
    description: '',
    date: new Date().toISOString().substring(0, 10),
    time: new Date().toTimeString().substring(0, 5),
    relatedAnimalId: '',
    relatedPaddockId: '',
  });

  // Lookup maps
  readonly animalMap = computed(() => {
    const map = new Map<string, any>();
    for (const a of this.animals() || []) {
      if (a.id) map.set(a.id, a);
    }
    return map;
  });

  readonly paddockMap = computed(() => {
    const map = new Map<string, any>();
    for (const p of this.paddocks() || []) {
      if (p.id) map.set(p.id, p);
    }
    return map;
  });

  readonly herdMap = computed(() => {
    const map = new Map<string, any>();
    for (const h of this.herds() || []) {
      if (h.id) map.set(h.id, h);
    }
    return map;
  });

  readonly breedMap = computed(() => {
    const map = new Map<string, any>();
    for (const b of this.breeds() || []) {
      if (b.id) map.set(b.id, b);
    }
    return map;
  });

  readonly treatmentTypeMap = computed(() => {
    const map = new Map<string, any>();
    for (const t of this.treatmentTypes() || []) {
      if (t.id) map.set(t.id, t);
    }
    return map;
  });

  readonly diseaseMap = computed(() => {
    const map = new Map<string, any>();
    for (const d of this.diseases() || []) {
      if (d.id) map.set(d.id, d);
    }
    return map;
  });

  // Unified activity stream synthesis
  readonly allActivities = computed(() => {
    const list: UnifiedActivity[] = [];

    // 1. Manual & System Activity Logs
    for (const l of this.logs() || []) {
      if (!l) continue;
      const ts = this.resolveTimestamp(l.createdAt || l.date);
      const cat = (l.category as any) || 'saha';
      list.push({
        id: l.id || `log-${Math.random()}`,
        source: 'log',
        category: cat,
        categoryLabel: this.getCategoryLabel(cat),
        action: l.action || 'Saha İşlemi',
        title: l.entityName ? `${l.action}: ${l.entityName}` : (l.message ? l.message.substring(0, 45) : 'Çiftlik Aktivitesi'),
        description: l.message,
        timestamp: ts,
        dateStr: this.formatDate(ts),
        timeStr: this.formatTime(ts),
        relativeTime: this.getRelativeTime(ts),
        actorName: l.actorName || 'Sistem',
        actorEmail: l.actorEmail,
        entityName: l.entityName,
        entityId: l.entityId,
        icon: l.icon || this.getCategoryIcon(cat),
        iconBgClass: l.color ? `bg-${l.color}-50 dark:bg-${l.color}-950/50` : 'bg-slate-100 dark:bg-slate-800',
        iconColorClass: l.color ? `text-${l.color}-600 dark:text-${l.color}-400` : 'text-slate-600 dark:text-slate-300',
        badgeClass: this.getCategoryBadgeClass(cat),
        details: l.details,
      });
    }

    // 2. Animals added
    for (const a of this.animals() || []) {
      if (!a) continue;
      const ts = this.resolveTimestamp(a.createdAt || a.birthDate);
      const breed = a.breedId ? this.breedMap().get(a.breedId)?.name : null;
      list.push({
        id: `animal-${a.id}`,
        source: 'animal',
        category: 'hayvan',
        categoryLabel: 'Hayvan Kaydı',
        action: 'Hayvan Girişi',
        title: `Hayvan Kaydı: ${a.farmTagNo}`,
        description: `${a.farmTagNo} küpeli ${a.gender === 'disi' ? 'dişi' : 'erkek'} hayvan sürüye dahil edildi.${breed ? ' Irk: ' + breed + '.' : ''}${a.name ? ' İsim: ' + a.name : ''}`,
        timestamp: ts,
        dateStr: this.formatDate(ts),
        timeStr: this.formatTime(ts),
        relativeTime: this.getRelativeTime(ts),
        actorName: a.createdBy ? 'Kullanıcı' : 'Yönetici',
        entityName: a.farmTagNo,
        entityId: a.id,
        icon: 'heroicons_solid:badge-check',
        iconBgClass: 'bg-indigo-50 dark:bg-indigo-950/50',
        iconColorClass: 'text-indigo-600 dark:text-indigo-400',
        badgeClass: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200/50',
        details: { küpe: a.farmTagNo, cinsiyet: a.gender, ırk: breed },
      });
    }

    // 3. Mating & Births
    for (const m of this.matings() || []) {
      if (!m) continue;
      const mother = this.animalMap().get(m.femaleId);
      const father = m.maleId ? this.animalMap().get(m.maleId) : null;
      const motherTag = mother?.farmTagNo || m.femaleId || 'Dişi';
      const fatherTag = father?.farmTagNo || (m.maleId ? m.maleId : 'Suni Tohumlama');

      if (m.status === 'dogurdu') {
        const ts = this.resolveTimestamp(m.actualBirthDate || m.updatedAt || m.createdAt);
        list.push({
          id: `birth-${m.id}`,
          source: 'mating',
          category: 'ureme',
          categoryLabel: 'Doğum & Yavru',
          action: 'Doğum Tamamlandı',
          title: `Doğum Gerçekleşti: ${motherTag}`,
          description: `Anne: ${motherTag}, Baba: ${fatherTag} eşleşmesinden doğum gerçekleşti ve yavru kaydı oluşturuldu.`,
          timestamp: ts,
          dateStr: this.formatDate(ts),
          timeStr: this.formatTime(ts),
          relativeTime: this.getRelativeTime(ts),
          actorName: 'Doğum Sorumlusu',
          entityName: motherTag,
          entityId: m.femaleId,
          icon: 'heroicons_solid:sparkles',
          iconBgClass: 'bg-purple-50 dark:bg-purple-950/50',
          iconColorClass: 'text-purple-600 dark:text-purple-400',
          badgeClass: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200/50',
          details: { anne: motherTag, baba: fatherTag, yavrular: m.offspringIds?.length || 1 },
        });
      } else if (m.status === 'gebe') {
        const ts = this.resolveTimestamp(m.updatedAt || m.createdAt || m.matingDate);
        list.push({
          id: `pregnant-${m.id}`,
          source: 'mating',
          category: 'ureme',
          categoryLabel: 'Gebelik Takibi',
          action: 'Gebelik Onayı',
          title: `Gebelik Teşhisi: ${motherTag}`,
          description: `${motherTag} küpeli dişi hayvanın gebeliği onaylandı. Beklenen doğum: ${m.expectedBirthDate ? this.formatDate(this.resolveTimestamp(m.expectedBirthDate)) : '—'}.`,
          timestamp: ts,
          dateStr: this.formatDate(ts),
          timeStr: this.formatTime(ts),
          relativeTime: this.getRelativeTime(ts),
          actorName: 'Veteriner / Sağlık',
          entityName: motherTag,
          entityId: m.femaleId,
          icon: 'heroicons_solid:heart',
          iconBgClass: 'bg-rose-50 dark:bg-rose-950/50',
          iconColorClass: 'text-rose-600 dark:text-rose-400',
          badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200/50',
          details: { anne: motherTag, baba: fatherTag },
        });
      } else {
        const ts = this.resolveTimestamp(m.matingDate || m.createdAt);
        list.push({
          id: `mating-${m.id}`,
          source: 'mating',
          category: 'ureme',
          categoryLabel: 'Çiftleşme / Katım',
          action: 'Koç Katımı',
          title: `Çiftleşme Kaydı: ${motherTag} × ${fatherTag}`,
          description: `Dişi: ${motherTag} ile Erkek: ${fatherTag} eşleşmesi sisteme işlendi. Durum: ${m.status}.`,
          timestamp: ts,
          dateStr: this.formatDate(ts),
          timeStr: this.formatTime(ts),
          relativeTime: this.getRelativeTime(ts),
          actorName: 'Sürü Yöneticisi',
          entityName: motherTag,
          entityId: m.femaleId,
          icon: 'heroicons_solid:heart',
          iconBgClass: 'bg-sky-50 dark:bg-sky-950/50',
          iconColorClass: 'text-sky-600 dark:text-sky-400',
          badgeClass: 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border-sky-200/50',
          details: { anne: motherTag, baba: fatherTag },
        });
      }
    }

    // 4. Treatments & Vaccines
    for (const t of this.treatments() || []) {
      if (!t) continue;
      const animal = t.animalId ? this.animalMap().get(t.animalId) : null;
      const aTag = animal?.farmTagNo || t.animalId || 'Sürü / Toplu';
      const ts = this.resolveTimestamp(t.date || t.createdAt);
      const treatmentType = t.treatmentTypeId ? this.treatmentTypeMap().get(t.treatmentTypeId)?.name : 'Tedavi';
      const disease = t.diseaseId ? this.diseaseMap().get(t.diseaseId)?.name : null;

      list.push({
        id: `treatment-${t.id}`,
        source: 'treatment',
        category: 'saglik',
        categoryLabel: 'Sağlık & Aşı',
        action: treatmentType || 'Sağlık Uygulaması',
        title: `Sağlık İşlemi: ${treatmentType} (${aTag})`,
        description: `Hayvan: ${aTag}. Tedavi: ${treatmentType}.${disease ? ' Teşhis: ' + disease + '.' : ''}${t.dosage ? ' Doz: ' + t.dosage + '.' : ''}${t.performedBy ? ' Uygulayan: ' + t.performedBy + '.' : ''}${t.note ? ' Not: ' + t.note : ''}`,
        timestamp: ts,
        dateStr: this.formatDate(ts),
        timeStr: this.formatTime(ts),
        relativeTime: this.getRelativeTime(ts),
        actorName: t.performedBy || 'Veteriner',
        entityName: aTag,
        entityId: t.animalId,
        icon: 'heroicons_solid:shield-check',
        iconBgClass: 'bg-amber-50 dark:bg-amber-950/50',
        iconColorClass: 'text-amber-600 dark:text-amber-400',
        badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200/50',
        details: { hayvan: aTag, tedavi: treatmentType, teshis: disease, doz: t.dosage, uygulayan: t.performedBy },
      });
    }

    // 5. Weight records
    for (const w of this.weights() || []) {
      if (!w) continue;
      const animal = w.animalId ? this.animalMap().get(w.animalId) : null;
      const aTag = animal?.farmTagNo || w.animalId || 'Hayvan';
      const ts = this.resolveTimestamp(w.date || w.createdAt);
      list.push({
        id: `weight-${w.id}`,
        source: 'weight',
        category: 'tartim',
        categoryLabel: 'Canlı Ağırlık',
        action: 'Tartım Kaydı',
        title: `Kilo Tartımı: ${aTag} — ${w.weightKg} kg`,
        description: `${aTag} küpeli hayvanın tartımı ${w.weightKg} kg olarak kaydedildi.${w.note ? ' Not: ' + w.note : ''}`,
        timestamp: ts,
        dateStr: this.formatDate(ts),
        timeStr: this.formatTime(ts),
        relativeTime: this.getRelativeTime(ts),
        actorName: 'Tartım Görevlisi',
        entityName: aTag,
        entityId: w.animalId,
        icon: 'heroicons_solid:scale',
        iconBgClass: 'bg-teal-50 dark:bg-teal-950/50',
        iconColorClass: 'text-teal-600 dark:text-teal-400',
        badgeClass: 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 border-teal-200/50',
        details: { hayvan: aTag, kilo: `${w.weightKg} kg` },
      });
    }

    // 6. Counting sessions
    for (const c of this.counts() || []) {
      if (!c) continue;
      const paddock = c.scopeId ? this.paddockMap().get(c.scopeId) : null;
      const herd = c.scopeId ? this.herdMap().get(c.scopeId) : null;
      const targetName = paddock?.name || herd?.name || (c.type === 'genel' ? 'Tüm Çiftlik Sayımı' : 'Sürü/Padok Sayımı');
      const ts = this.resolveTimestamp(c.startedAt || c.createdAt);
      list.push({
        id: `count-${c.id}`,
        source: 'count',
        category: 'sayim',
        categoryLabel: 'Sayım & RFID',
        action: 'Sayım Operasyonu',
        title: `Sayım Yapıldı: ${targetName}`,
        description: `${targetName} lokasyonunda ${c.countedAnimalIds?.length || 0} baş hayvan okundu. (Beklenen: ${c.expectedCount || 0}).`,
        timestamp: ts,
        dateStr: this.formatDate(ts),
        timeStr: this.formatTime(ts),
        relativeTime: this.getRelativeTime(ts),
        actorName: 'Sayım Operatörü',
        entityName: targetName,
        icon: 'heroicons_solid:clipboard-check',
        iconBgClass: 'bg-emerald-50 dark:bg-emerald-950/50',
        iconColorClass: 'text-emerald-600 dark:text-emerald-400',
        badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200/50',
        details: { okunan: c.countedAnimalIds?.length || 0, beklenen: c.expectedCount || 0, cihaz: c.deviceName },
      });
    }

    // 7. Animal movements (transfer)
    for (const mv of this.movements() || []) {
      if (!mv) continue;
      const animal = mv.animalId ? this.animalMap().get(mv.animalId) : null;
      const aTag = animal?.farmTagNo || mv.animalId || 'Hayvan';
      const targetName = mv.toId ? (this.paddockMap().get(mv.toId)?.name || this.herdMap().get(mv.toId)?.name || 'Yeni Lokasyon') : 'Padok';
      const ts = this.resolveTimestamp(mv.date || mv.createdAt);
      list.push({
        id: `movement-${mv.id}`,
        source: 'movement',
        category: 'hareket',
        categoryLabel: 'Padok Transferi',
        action: 'Yer Değişimi',
        title: `Padok / Konum Değişimi: ${aTag}`,
        description: `${aTag} küpeli hayvan '${targetName}' konumuna transfer edildi.${mv.note ? ' Not: ' + mv.note : ''}`,
        timestamp: ts,
        dateStr: this.formatDate(ts),
        timeStr: this.formatTime(ts),
        relativeTime: this.getRelativeTime(ts),
        actorName: 'Saha Çalışanı',
        entityName: aTag,
        entityId: mv.animalId,
        icon: 'heroicons_solid:switch-horizontal',
        iconBgClass: 'bg-blue-50 dark:bg-blue-950/50',
        iconColorClass: 'text-blue-600 dark:text-blue-400',
        badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200/50',
        details: { hayvan: aTag, hedef: targetName },
      });
    }

    // 8. Stock movements
    for (const sm of this.stockMovements() || []) {
      if (!sm) continue;
      const ts = this.resolveTimestamp(sm.date || sm.createdAt);
      list.push({
        id: `stock-${sm.id}`,
        source: 'stock',
        category: 'stok',
        categoryLabel: 'Yem & Stok',
        action: sm.type === 'giris' ? 'Stok Girişi' : 'Stok Çıkışı',
        title: `Yem/Stok ${sm.type === 'giris' ? 'Girişi' : 'Çıkışı'}`,
        description: `${sm.quantity || 0} birim ${sm.type === 'giris' ? 'depoya alındı' : 'çiftlikte tüketildi'}.${sm.note ? ' Not: ' + sm.note : ''}`,
        timestamp: ts,
        dateStr: this.formatDate(ts),
        timeStr: this.formatTime(ts),
        relativeTime: this.getRelativeTime(ts),
        actorName: 'Depo Sorumlusu',
        icon: 'heroicons_solid:cube',
        iconBgClass: 'bg-violet-50 dark:bg-violet-950/50',
        iconColorClass: 'text-violet-600 dark:text-violet-400',
        badgeClass: 'bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300 border-violet-200/50',
        details: { miktar: sm.quantity, tip: sm.type },
      });
    }

    // Sort all activities by timestamp descending (newest first)
    return list.sort((a, b) => b.timestamp - a.timestamp);
  });

  // Filtered activities
  readonly filteredActivities = computed(() => {
    let list = this.allActivities();
    const q = this.searchTerm().trim().toLowerCase();
    const cat = this.selectedCategory();
    const range = this.dateRangeFilter();

    // 1. Category filter
    if (cat !== 'all') {
      list = list.filter((item) => item.category === cat);
    }

    // 2. Date Range filter
    if (range !== 'all') {
      const now = new Date().getTime();
      const oneDay = 24 * 60 * 60 * 1000;
      if (range === 'today') {
        const startOfToday = new Date().setHours(0, 0, 0, 0);
        list = list.filter((item) => item.timestamp >= startOfToday);
      } else if (range === '3days') {
        list = list.filter((item) => now - item.timestamp <= 3 * oneDay);
      } else if (range === '7days') {
        list = list.filter((item) => now - item.timestamp <= 7 * oneDay);
      } else if (range === 'month') {
        list = list.filter((item) => now - item.timestamp <= 30 * oneDay);
      }
    }

    // 3. Search query
    if (q) {
      list = list.filter((item) => {
        return (
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.actorName.toLowerCase().includes(q) ||
          (item.entityName && item.entityName.toLowerCase().includes(q)) ||
          item.action.toLowerCase().includes(q)
        );
      });
    }

    return list;
  });

  // Timeline groups (Bugün, Dün, Bu Hafta, Daha Önce)
  readonly groupedTimelineActivities = computed(() => {
    const list = this.filteredActivities();
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
    const startOfWeek = startOfToday - 7 * 24 * 60 * 60 * 1000;

    const todayItems: UnifiedActivity[] = [];
    const yesterdayItems: UnifiedActivity[] = [];
    const thisWeekItems: UnifiedActivity[] = [];
    const olderItems: UnifiedActivity[] = [];

    for (const item of list) {
      if (item.timestamp >= startOfToday) {
        todayItems.push(item);
      } else if (item.timestamp >= startOfYesterday) {
        yesterdayItems.push(item);
      } else if (item.timestamp >= startOfWeek) {
        thisWeekItems.push(item);
      } else {
        olderItems.push(item);
      }
    }

    const groups: ActivityDateGroup[] = [];
    if (todayItems.length > 0) {
      groups.push({ groupLabel: 'Bugün Gerçekleşenler', activities: todayItems });
    }
    if (yesterdayItems.length > 0) {
      groups.push({ groupLabel: 'Dün Yapılan İşlemler', activities: yesterdayItems });
    }
    if (thisWeekItems.length > 0) {
      groups.push({ groupLabel: 'Bu Hafta (Son 7 Gün)', activities: thisWeekItems });
    }
    if (olderItems.length > 0) {
      groups.push({ groupLabel: 'Daha Önceki Faaliyetler', activities: olderItems });
    }

    return groups;
  });

  // KPI Metrics
  readonly totalCount = computed(() => this.allActivities().length);

  readonly todayCount = computed(() => {
    const startOfToday = new Date().setHours(0, 0, 0, 0);
    return this.allActivities().filter((a) => a.timestamp >= startOfToday).length;
  });

  readonly healthCount = computed(() => {
    return this.allActivities().filter((a) => a.category === 'saglik').length;
  });

  readonly birthCount = computed(() => {
    return this.allActivities().filter((a) => a.category === 'ureme').length;
  });

  readonly movementCount = computed(() => {
    return this.allActivities().filter((a) => a.category === 'hareket' || a.category === 'sayim').length;
  });

  // Modal Actions
  openAddModal() {
    const now = new Date();
    this.addForm.set({
      title: '',
      category: 'saha',
      description: '',
      date: now.toISOString().substring(0, 10),
      time: now.toTimeString().substring(0, 5),
      relatedAnimalId: '',
      relatedPaddockId: '',
    });
    this.showAddModal.set(true);
  }

  closeAddModal() {
    this.showAddModal.set(false);
  }

  updateAddFormField<K extends keyof ReturnType<typeof this.addForm>>(field: K, value: any) {
    this.addForm.update((prev) => ({ ...prev, [field]: value }));
  }

  async saveManualActivity() {
    const f = this.addForm();
    if (!f.title.trim()) {
      this.alertService.error('Eksik Bilgi', 'Lütfen aktivite başlığını giriniz.');
      return;
    }

    this.isSavingLog.set(true);
    try {
      const animal = f.relatedAnimalId ? this.animalMap().get(f.relatedAnimalId) : null;
      const paddock = f.relatedPaddockId ? this.paddockMap().get(f.relatedPaddockId) : null;

      let msg = f.description.trim() || f.title.trim();
      if (animal) msg += ` (İlgili Hayvan: ${animal.farmTagNo})`;
      if (paddock) msg += ` (Lokasyon: ${paddock.name})`;

      await this.activityLogService.log({
        action: f.title.trim(),
        message: msg,
        category: f.category,
        entityType: animal ? 'animal' : (paddock ? 'paddock' : 'general'),
        entityId: f.relatedAnimalId || f.relatedPaddockId || undefined,
        entityName: animal?.farmTagNo || paddock?.name || undefined,
        date: `${f.date}T${f.time}:00`,
        details: {
          tarih: f.date,
          saat: f.time,
          kategori: f.category,
          hayvan: animal?.farmTagNo,
          padok: paddock?.name,
        },
      });

      this.closeAddModal();
      this.alertService.toastSuccess('Saha faaliyeti başarıyla kaydedildi');
    } catch (err: any) {
      this.alertService.error('Kayıt Başarısız', err.message);
    } finally {
      this.isSavingLog.set(false);
    }
  }

  // Export CSV
  exportToCsv() {
    const items = this.filteredActivities();
    if (items.length === 0) {
      this.alertService.toastInfo('Dışa aktarılacak aktivite bulunamadı.');
      return;
    }

    const headers = ['Tarih', 'Saat', 'Kategori', 'İşlem', 'Açıklama', 'İlgili Varlık', 'İşlemi Yapan'];
    const rows = items.map((i) => [
      `"${i.dateStr}"`,
      `"${i.timeStr}"`,
      `"${i.categoryLabel}"`,
      `"${i.action.replace(/"/g, '""')}"`,
      `"${i.description.replace(/"/g, '""')}"`,
      `"${(i.entityName || '').replace(/"/g, '""')}"`,
      `"${i.actorName.replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `odivonfarm_aktiviteler_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.alertService.toastSuccess('Aktivite listesi CSV olarak indirildi');
  }

  // Helper formatting methods
  resolveTimestamp(d: any): number {
    if (!d) return new Date().getTime();
    if (typeof d === 'number') return d;
    if (d.seconds) return d.seconds * 1000;
    if (typeof d === 'string') {
      const parsed = new Date(d).getTime();
      return isNaN(parsed) ? new Date().getTime() : parsed;
    }
    if (d instanceof Date) return d.getTime();
    return new Date().getTime();
  }

  formatDate(ts: number): string {
    const d = new Date(ts);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  }

  formatTime(ts: number): string {
    const d = new Date(ts);
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${mins}`;
  }

  getRelativeTime(ts: number): string {
    const now = new Date().getTime();
    const diffSec = Math.floor((now - ts) / 1000);

    if (diffSec < 60) return 'Az önce';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} dk önce`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} saat önce`;
    if (diffSec < 172800) return 'Dün';
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} gün önce`;
    return this.formatDate(ts);
  }

  getCategoryLabel(cat: string): string {
    switch (cat) {
      case 'hayvan': return 'Hayvan Kaydı';
      case 'ureme': return 'Doğum & Çiftleşme';
      case 'saglik': return 'Sağlık & Aşı';
      case 'tartim': return 'Canlı Ağırlık';
      case 'hareket': return 'Padok Transferi';
      case 'sayim': return 'Sayım Operasyonu';
      case 'stok': return 'Yem & Stok';
      case 'saha': return 'Saha & Rutin';
      default: return 'Genel İşlem';
    }
  }

  getCategoryIcon(cat: string): string {
    switch (cat) {
      case 'hayvan': return 'heroicons_solid:badge-check';
      case 'ureme': return 'heroicons_solid:sparkles';
      case 'saglik': return 'heroicons_solid:shield-check';
      case 'tartim': return 'heroicons_solid:scale';
      case 'hareket': return 'heroicons_solid:switch-horizontal';
      case 'sayim': return 'heroicons_solid:clipboard-check';
      case 'stok': return 'heroicons_solid:cube';
      case 'saha': return 'heroicons_solid:clock';
      default: return 'heroicons_solid:tag';
    }
  }

  getCategoryBadgeClass(cat: string): string {
    switch (cat) {
      case 'hayvan': return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200/50';
      case 'ureme': return 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200/50';
      case 'saglik': return 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200/50';
      case 'tartim': return 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 border-teal-200/50';
      case 'hareket': return 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200/50';
      case 'sayim': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200/50';
      case 'stok': return 'bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300 border-violet-200/50';
      case 'saha': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200/50';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  }
}
