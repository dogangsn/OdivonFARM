import { Injectable, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { Animal } from '../models/animal.model';
import { AnimalService } from './animal.service';

export interface TagScanMatch {
  animal: Animal;
  matchType: 'exact' | 'endsWith' | 'contains' | 'name';
  score: number;
}

@Injectable({
  providedIn: 'root',
})
export class TagScannerService {
  private animalService = inject(AnimalService);

  // Modal display states
  isOpen = signal<boolean>(false);
  mode = signal<'scanner' | 'numpad'>('scanner');
  searchDigits = signal<string>('');

  // Selected animal event
  private animalSelectedSubject = new Subject<Animal>();
  animalSelected$ = this.animalSelectedSubject.asObservable();

  private activeCallback: ((animal: Animal) => void) | null = null;

  /**
   * Opens the scanner modal.
   * @param callback Optional callback when an animal is picked
   * @param initialMode Initial view mode: 'scanner' (camera) or 'numpad' (barn keypad)
   */
  openScanner(callback?: (animal: Animal) => void, initialMode: 'scanner' | 'numpad' = 'scanner'): void {
    this.activeCallback = callback || null;
    this.mode.set(initialMode);
    this.searchDigits.set('');
    this.isOpen.set(true);
  }

  /**
   * Closes the scanner modal.
   */
  closeScanner(): void {
    this.isOpen.set(false);
    this.searchDigits.set('');
    this.activeCallback = null;
  }

  /**
   * Switches view between camera scanner and barn numpad
   */
  setMode(mode: 'scanner' | 'numpad'): void {
    this.mode.set(mode);
  }

  /**
   * Sets search digits from numpad or OCR
   */
  setDigits(digits: string): void {
    this.searchDigits.set(digits);
  }

  /**
   * Appends a digit in barn numpad mode
   */
  appendDigit(digit: string): void {
    if (this.searchDigits().length < 15) {
      this.searchDigits.set(this.searchDigits() + digit);
    }
  }

  /**
   * Removes last digit (backspace)
   */
  backspace(): void {
    const current = this.searchDigits();
    if (current.length > 0) {
      this.searchDigits.set(current.slice(0, -1));
    }
  }

  /**
   * Clears all entered digits
   */
  clearDigits(): void {
    this.searchDigits.set('');
  }

  /**
   * Completes selection of an animal
   */
  selectAnimal(animal: Animal): void {
    this.playFeedback('success');
    this.animalSelectedSubject.next(animal);
    if (this.activeCallback) {
      this.activeCallback(animal);
    }
    this.closeScanner();
  }

  /**
   * Matches query string against herd animals.
   * Supports:
   * 1. Exact match with farmTagNo or nationalTagNo
   * 2. EndsWith match (barn workers reading the last 3-4 digits of ear tag)
   * 3. Contains match
   * 4. Name match
   */
  findMatches(query: string, animals: Animal[]): TagScanMatch[] {
    const cleaned = (query || '').trim().toLowerCase();
    if (!cleaned) return [];

    const matches: TagScanMatch[] = [];

    for (const animal of animals) {
      const farmTag = String(animal.farmTagNo || '').toLowerCase();
      const nationalTag = String(animal.nationalTagNo || '').toLowerCase();
      const name = String(animal.name || '').toLowerCase();
      const rfid = String(animal.rfid || '').toLowerCase();

      // 1. Exact match (highest score 100)
      if (farmTag === cleaned || nationalTag === cleaned || rfid === cleaned) {
        matches.push({ animal, matchType: 'exact', score: 100 });
        continue;
      }

      // 2. EndsWith match (score 80) - especially useful for 3-4 digit keypad entry
      if (cleaned.length >= 2 && (farmTag.endsWith(cleaned) || nationalTag.endsWith(cleaned))) {
        matches.push({ animal, matchType: 'endsWith', score: 80 });
        continue;
      }

      // 3. Contains match (score 60)
      if (farmTag.includes(cleaned) || nationalTag.includes(cleaned) || (rfid && rfid.includes(cleaned))) {
        matches.push({ animal, matchType: 'contains', score: 60 });
        continue;
      }

      // 4. Animal Name match (score 50)
      if (name && name.includes(cleaned)) {
        matches.push({ animal, matchType: 'name', score: 50 });
      }
    }

    // Sort by score descending
    return matches.sort((a, b) => b.score - a.score);
  }

  /**
   * Synthesizes audio feedback using Web Audio API and haptic vibration
   */
  playFeedback(type: 'success' | 'warning' | 'click' = 'success'): void {
    // 1. Haptic vibration
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        if (type === 'success') {
          navigator.vibrate([70, 40, 90]);
        } else if (type === 'warning') {
          navigator.vibrate([150, 60, 150]);
        } else {
          navigator.vibrate(25);
        }
      } catch (e) {
        // Ignore vibration errors on unsupported devices
      }
    }

    // 2. Web Audio API synthesized tone
    if (typeof window !== 'undefined') {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;

        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;

        if (type === 'success') {
          // Double chirp: 880Hz (A5) -> 1320Hz (E6)
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, now);
          osc.frequency.exponentialRampToValueAtTime(1320, now + 0.12);
          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
          osc.start(now);
          osc.stop(now + 0.22);
        } else if (type === 'warning') {
          // Low buzz: 220Hz
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(220, now);
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
          osc.start(now);
          osc.stop(now + 0.25);
        } else {
          // Quick subtle click
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1200, now);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
          osc.start(now);
          osc.stop(now + 0.05);
        }
      } catch (e) {
        // AudioContext autoplay restrictions or disabled sound
      }
    }
  }
}
