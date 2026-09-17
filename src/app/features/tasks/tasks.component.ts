import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { toSignal } from '@angular/core/rxjs-interop';
import { TaskService } from '../../core/services/task.service';
import { FarmTask, TaskStatus } from '../../core/models/operations.model';
import { AlertService } from '../../core/services/alert.service';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTooltipModule,
  ],
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.scss'],
})
export class TasksComponent {
  private taskService = inject(TaskService);
  private alertService = inject(AlertService);
  private fb = inject(FormBuilder);

  tasks$ = this.taskService.list();
  tasks = toSignal(this.tasks$, { initialValue: [] as FarmTask[] });

  searchQuery = signal('');
  selectedStatus = signal<string>('all');
  drawerOpen = signal(false);
  isSubmitting = signal(false);

  isEditing = signal(false);
  editingTaskId = signal<string | null>(null);

  taskForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    status: ['bekliyor' as TaskStatus, Validators.required],
    dueDate: [''],
  });

  filteredTasks = computed(() => {
    const list = this.tasks() || [];
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.selectedStatus();

    return list.filter((t) => {
      const matchQuery = !query || t.title.toLowerCase().includes(query) || (t.description && t.description.toLowerCase().includes(query));
      const matchStatus = status === 'all' || t.status === status;
      return matchQuery && matchStatus;
    });
  });

  stats = computed(() => {
    const list = this.tasks() || [];
    const total = list.length;
    const pending = list.filter((t) => t.status === 'bekliyor').length;
    const inProgress = list.filter((t) => t.status === 'devam-ediyor').length;
    const completed = list.filter((t) => t.status === 'tamamlandi').length;
    return { total, pending, inProgress, completed };
  });

  openDrawer() {
    this.isEditing.set(false);
    this.editingTaskId.set(null);
    this.taskForm.reset({
      title: '',
      description: '',
      status: 'bekliyor',
      dueDate: '',
    });
    this.drawerOpen.set(true);
  }

  openEditDrawer(task: FarmTask) {
    this.isEditing.set(true);
    this.editingTaskId.set(task.id || null);
    let dueStr = '';
    if (task.dueDate) {
      dueStr = typeof task.dueDate === 'string' ? task.dueDate.substring(0, 10) : '';
    }
    this.taskForm.reset({
      title: task.title,
      description: task.description || '',
      status: task.status,
      dueDate: dueStr,
    });
    this.drawerOpen.set(true);
  }

  closeDrawer() {
    this.drawerOpen.set(false);
  }

  async saveTask() {
    if (this.taskForm.invalid) return;

    this.isSubmitting.set(true);
    try {
      const val = this.taskForm.value;
      const payload: Partial<FarmTask> = {
        title: val.title!,
        description: val.description || '',
        status: (val.status as TaskStatus) || 'bekliyor',
        dueDate: val.dueDate || null,
      };

      if (this.isEditing() && this.editingTaskId()) {
        await this.taskService.update(this.editingTaskId()!, payload);
        this.alertService.toastSuccess('Görev başarıyla güncellendi');
      } else {
        await this.taskService.create(payload);
        this.alertService.toastSuccess('Yeni görev oluşturuldu');
      }
      this.closeDrawer();
    } catch (err: any) {
      console.error('Görev kaydedilemedi:', err);
      this.alertService.error('Hata', err?.message || 'Görev kaydedilemedi.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async toggleStatus(task: FarmTask) {
    const nextStatus: TaskStatus = task.status === 'tamamlandi' ? 'bekliyor' : 'tamamlandi';
    try {
      await this.taskService.update(task.id!, { status: nextStatus });
    } catch (err) {
      console.error('Durum güncellenemedi:', err);
    }
  }

  async deleteTask(task: FarmTask) {
    const confirmed = await this.alertService.confirmDelete(
      'Görevi Sil',
      `"${task.title}" görevini silmek istediğinize emin misiniz?`
    );
    if (!confirmed) return;
    try {
      await this.taskService.softDelete(task.id!);
      this.alertService.toastSuccess('Görev başarıyla silindi');
    } catch (err: any) {
      console.error('Görev silinemedi:', err);
      this.alertService.error('Silme Başarısız', err?.message || 'Görev silinemedi.');
    }
  }
}
