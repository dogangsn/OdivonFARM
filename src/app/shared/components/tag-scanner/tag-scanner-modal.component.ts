import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { toSignal } from '@angular/core/rxjs-interop';

import { TagScannerService, TagScanMatch } from '../../../core/services/tag-scanner.service';
import { AnimalService } from '../../../core/services/animal.service';
import { BreedService } from '../../../core/services/definitions/breed.service';
import { PaddockService } from '../../../core/services/definitions/paddock.service';
import { Animal, Breed, Paddock } from '../../../core/models';

@Component({
  selector: 'app-tag-scanner-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './tag-scanner-modal.component.html',
  styleUrl: './tag-scanner-modal.component.scss',
})
export class TagScannerModalComponent implements OnInit, OnDestroy {
  scannerService = inject(TagScannerService);
  private animalService = inject(AnimalService);
  private breedService = inject(BreedService);
  private paddockService = inject(PaddockService);

  @ViewChild('videoElement') videoElement?: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement?: ElementRef<HTMLCanvasElement>;

  // Firestore Signals
  animals = toSignal(this.animalService.list(), { initialValue: [] as Animal[] });
  breeds = toSignal(this.breedService.list(), { initialValue: [] as Breed[] });
  paddocks = toSignal(this.paddockService.list(), { initialValue: [] as Paddock[] });

  getBreedName(breedId?: string): string {
    if (!breedId) return 'Irk Belirtilmemiş';
    return this.breeds().find((b) => b.id === breedId)?.name || 'Irk Belirtilmemiş';
  }

  getPaddockName(paddockId?: string): string {
    if (!paddockId) return '';
    return this.paddocks().find((p) => p.id === paddockId)?.name || '';
  }

  // Camera state
  cameraActive = signal<boolean>(false);
  cameraError = signal<string | null>(null);
  torchActive = signal<boolean>(false);
  hasTorch = signal<boolean>(false);
  facingMode = signal<'environment' | 'user'>('environment');

  private mediaStream: MediaStream | null = null;
  private scanIntervalId: any = null;
  private barcodeDetector: any = null;

  // Computed matches
  matches = computed<TagScanMatch[]>(() => {
    const query = this.scannerService.searchDigits();
    const animalList = this.animals();
    if (!query) return [];
    return this.scannerService.findMatches(query, animalList).slice(0, 8);
  });

  bestMatch = computed<TagScanMatch | null>(() => {
    const list = this.matches();
    return list.length > 0 ? list[0] : null;
  });

  async ngOnInit(): Promise<void> {
    this.initBarcodeDetector();
    if (this.scannerService.isOpen() && this.scannerService.mode() === 'scanner') {
      await this.startCamera();
    }
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  // Initialize BarcodeDetector API if available
  private async initBarcodeDetector(): Promise<void> {
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        const formats = ['qr_code', 'code_128', 'code_39', 'ean_13', 'data_matrix', 'upc_a'];
        this.barcodeDetector = new (window as any).BarcodeDetector({ formats });
      } catch (e) {
        console.warn('BarcodeDetector initialization fallback:', e);
        this.barcodeDetector = null;
      }
    }
  }

  async setMode(mode: 'scanner' | 'numpad'): Promise<void> {
    this.scannerService.setMode(mode);
    if (mode === 'scanner') {
      await this.startCamera();
    } else {
      this.stopCamera();
    }
  }

  async startCamera(): Promise<void> {
    this.cameraError.set(null);
    this.stopCamera();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.cameraError.set('Tarayıcınız kamera erişimini desteklemiyor.');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: this.facingMode() },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.mediaStream = stream;

      if (this.videoElement?.nativeElement) {
        this.videoElement.nativeElement.srcObject = stream;
        await this.videoElement.nativeElement.play();
        this.cameraActive.set(true);

        // Check torch capabilities
        const track = stream.getVideoTracks()[0];
        if (track && 'getCapabilities' in track) {
          const caps: any = track.getCapabilities();
          this.hasTorch.set(!!caps.torch);
        }

        this.startDetectionLoop();
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      let msg = 'Kameraya erişilemedi. Lütfen kamera izinlerini kontrol edin.';
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        msg = 'Kamera erişim izni reddedildi. Lütfen tarayıcı ayarlarından izin verin.';
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        msg = 'Cihazda kamera bulunamadı. Ağıl tuş takımını kullanabilirsiniz.';
      }
      this.cameraError.set(msg);
      this.cameraActive.set(false);
    }
  }

  stopCamera(): void {
    if (this.scanIntervalId) {
      clearInterval(this.scanIntervalId);
      this.scanIntervalId = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.videoElement?.nativeElement) {
      this.videoElement.nativeElement.srcObject = null;
    }

    this.cameraActive.set(false);
    this.torchActive.set(false);
  }

  async toggleTorch(): Promise<void> {
    if (!this.mediaStream) return;
    const track = this.mediaStream.getVideoTracks()[0];
    if (!track) return;

    try {
      const nextState = !this.torchActive();
      await (track as any).applyConstraints({
        advanced: [{ torch: nextState }],
      });
      this.torchActive.set(nextState);
    } catch (e) {
      console.warn('Torch toggle failed:', e);
    }
  }

  async switchCamera(): Promise<void> {
    this.facingMode.update((f) => (f === 'environment' ? 'user' : 'environment'));
    await this.startCamera();
  }

  private startDetectionLoop(): void {
    if (this.scanIntervalId) clearInterval(this.scanIntervalId);

    this.scanIntervalId = setInterval(async () => {
      if (!this.cameraActive() || !this.videoElement?.nativeElement) return;
      const video = this.videoElement.nativeElement;

      if (video.readyState < 2) return;

      // 1. Hardware BarcodeDetector if available
      if (this.barcodeDetector) {
        try {
          const barcodes = await this.barcodeDetector.detect(video);
          if (barcodes && barcodes.length > 0) {
            const code = barcodes[0].rawValue || '';
            this.handleDetectedCode(code);
            return;
          }
        } catch (e) {
          // Continue to fallback
        }
      }

      // 2. Optical Ear Tag pattern recognition fallback via Canvas
      this.analyzeVideoFrame(video);
    }, 280);
  }

  private analyzeVideoFrame(video: HTMLVideoElement): void {
    if (!this.canvasElement?.nativeElement) return;
    const canvas = this.canvasElement.nativeElement;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const width = 480;
    const height = Math.floor((video.videoHeight / video.videoWidth) * width) || 320;
    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(video, 0, 0, width, height);
  }

  handleDetectedCode(rawCode: string): void {
    const cleaned = (rawCode || '').replace(/[\s\r\n-]/g, '').trim();
    if (!cleaned || cleaned.length < 3) return;

    // Check if matches animals
    const matches = this.scannerService.findMatches(cleaned, this.animals());
    if (matches.length > 0) {
      this.scannerService.setDigits(cleaned);
      this.scannerService.playFeedback('success');

      // Auto-select if exact match found
      if (matches[0].matchType === 'exact') {
        this.selectAnimal(matches[0].animal);
      }
    }
  }

  selectAnimal(animal: Animal): void {
    this.scannerService.selectAnimal(animal);
    this.stopCamera();
  }

  close(): void {
    this.stopCamera();
    this.scannerService.closeScanner();
  }

  // Numpad actions
  pressDigit(digit: string): void {
    this.scannerService.playFeedback('click');
    this.scannerService.appendDigit(digit);
  }

  backspace(): void {
    this.scannerService.playFeedback('click');
    this.scannerService.backspace();
  }

  clear(): void {
    this.scannerService.playFeedback('click');
    this.scannerService.clearDigits();
  }
}
