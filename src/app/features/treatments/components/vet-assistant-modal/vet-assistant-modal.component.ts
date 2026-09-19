import { Component, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ClinicalScenario, TriageResult, VetTriageService } from '../../../../core/services/vet-triage.service';
import { Animal } from '../../../../core/models/animal.model';

@Component({
  selector: 'app-vet-assistant-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './vet-assistant-modal.component.html',
  styleUrl: './vet-assistant-modal.component.scss',
})
export class VetAssistantModalComponent {
  triageService = inject(VetTriageService);

  @Input() animals: Animal[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() startTreatment = new EventEmitter<{
    animalId?: string;
    scenario: ClinicalScenario;
    note: string;
  }>();

  // Filters & Selected State
  selectedAnimalId = signal<string>('');
  selectedSpecies = signal<'all' | 'cattle' | 'sheep_goat'>('all');
  selectedLifeStage = signal<string>('all');
  selectedSymptoms = signal<string[]>([]);

  // Filter symptoms by category
  symptomCategories = computed(() => {
    const list = this.triageService.availableSymptoms;
    const cats = new Set<string>();
    for (const s of list) cats.add(s.category);
    return Array.from(cats);
  });

  getSymptomsByCategory(cat: string) {
    return this.triageService.availableSymptoms.filter((s) => s.category === cat);
  }

  isSymptomSelected(id: string): boolean {
    return this.selectedSymptoms().includes(id);
  }

  toggleSymptom(id: string): void {
    const current = this.selectedSymptoms();
    if (current.includes(id)) {
      this.selectedSymptoms.set(current.filter((s) => s !== id));
    } else {
      this.selectedSymptoms.set([...current, id]);
    }
  }

  clearSymptoms(): void {
    this.selectedSymptoms.set([]);
  }

  // Triage Results
  triageResults = computed<TriageResult[]>(() => {
    const symptoms = this.selectedSymptoms();
    const species = this.selectedSpecies();
    const stage = this.selectedLifeStage() === 'all' ? undefined : this.selectedLifeStage();

    return this.triageService.evaluateTriage(symptoms, species, stage);
  });

  topResult = computed<TriageResult | null>(() => {
    const res = this.triageResults();
    return res.length > 0 ? res[0] : null;
  });

  onAnimalSelected(animalId: string): void {
    this.selectedAnimalId.set(animalId);
    const animal = this.animals.find((a) => a.id === animalId);
    if (animal) {
      const typeName = (animal.animalTypeId || '').toLowerCase();
      if (typeName.includes('koyun') || typeName.includes('kuzu') || typeName.includes('keçi')) {
        this.selectedSpecies.set('sheep_goat');
      } else {
        this.selectedSpecies.set('cattle');
      }
    }
  }

  onStartTreatmentClicked(scenario: ClinicalScenario): void {
    const note = `[AI Veteriner Triyajı]: ${scenario.name} teşhis edildi. Önerilen tedavi: ${scenario.recommendedMedicationGroup}`;
    this.startTreatment.emit({
      animalId: this.selectedAnimalId() || undefined,
      scenario,
      note,
    });
  }
}
