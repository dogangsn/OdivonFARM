import { BaseDoc } from './base.model';

/** farms/{farmId}/taskDefinitions/{id} — Görev Tanımlama (şablon) */
export interface TaskDefinition extends BaseDoc {
  name: string;
  defaultAssigneeRole?: string;
}

export type TaskStatus = 'bekliyor' | 'devam-ediyor' | 'tamamlandi' | 'iptal';

/** farms/{farmId}/tasks/{id} — Görevler Paneli */
export interface FarmTask extends BaseDoc {
  taskDefinitionId?: string;
  title: string;
  description?: string;
  assigneeUid?: string;
  dueDate?: any;
  status: TaskStatus;
  relatedAnimalId?: string;
}

export type CountType = 'genel' | 'padok' | 'suru';

/** farms/{farmId}/counts/{id} — Sayım Operasyonları (RFID cihaz destekli) */
export interface Count extends BaseDoc {
  type: CountType;
  scopeId?: string; // padok/sürü id, genel sayımda boş
  startedAt: any;
  finishedAt?: any;
  expectedCount: number;
  countedAnimalIds: string[];
  deviceName?: string; // Bluetooth RFID okuyucu adı
}

/** farms/{farmId}/activityLog/{id} — Çiftlikte Yapılanlar (aktivite akışı) */
export interface ActivityLogEntry extends BaseDoc {
  actorUid: string;
  action: string;
  entityType?: string;
  entityId?: string;
  message: string;
}

/** farms/{farmId}/references/{id} — Referanslar (veteriner, tedarikçi vb. dış kaynaklar) */
export interface ReferenceEntity extends BaseDoc {
  name: string;
  phone?: string;
  note?: string;
}

/** farms/{farmId}/photos/{id} — Foto Galeri */
export interface FarmPhoto extends BaseDoc {
  url: string;
  caption?: string;
  relatedAnimalId?: string;
}
