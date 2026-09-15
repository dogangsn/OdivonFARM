import { inject, Injectable } from '@angular/core';
import { FirestoreCrudService } from './firestore-crud.service';
import { ActivityLogEntry } from '../models/operations.model';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class ActivityLogService extends FirestoreCrudService<ActivityLogEntry> {
  private authService = inject(AuthService);

  constructor() {
    super('activityLog');
  }

  /** Kolay aktivite kaydetme yardımcısı */
  async log(entry: {
    action: string;
    message: string;
    category?: ActivityLogEntry['category'];
    entityType?: string;
    entityId?: string;
    entityName?: string;
    details?: Record<string, any>;
    icon?: string;
    color?: string;
    date?: any;
  }): Promise<string> {
    const user = this.authService.currentUser;
    const actorUid = this.farmContext.currentUid() || user?.uid || 'system';
    const actorName = user?.displayName || user?.email?.split('@')[0] || 'Kullanıcı';
    const actorEmail = user?.email || undefined;

    return this.create({
      actorUid,
      actorName,
      actorEmail,
      action: entry.action,
      message: entry.message,
      category: entry.category || 'saha',
      entityType: entry.entityType,
      entityId: entry.entityId,
      entityName: entry.entityName,
      details: entry.details,
      icon: entry.icon,
      color: entry.color,
      date: entry.date || new Date().toISOString(),
    });
  }
}
