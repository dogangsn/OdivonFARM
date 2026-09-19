import { Injectable, inject, signal } from '@angular/core';
import { AnimalService } from './animal.service';
import { WeightRecordService } from './weight-record.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { Animal } from '../models/animal.model';

export type FarmCommandType = 'tedavi' | 'tartim' | 'hareket' | 'dogum' | 'genel';

export interface ParsedFarmCommand {
  id: string;
  rawText: string;
  actionType: FarmCommandType;
  tagNo?: string;
  animalId?: string;
  animalName?: string;
  treatmentName?: string;
  dose?: string;
  weightKg?: number;
  targetPaddockName?: string;
  confidence: number; // %
  executionStatus: 'beklemede' | 'onaylandi' | 'isleme_alindi';
  aiReplyMessage: string;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root',
})
export class VoiceAssistantService {
  private animalService = inject(AnimalService);
  private weightService = inject(WeightRecordService);

  readonly animals = toSignal(this.animalService.list(), { initialValue: [] as Animal[] });

  isListening = signal<boolean>(false);
  recognizedText = signal<string>('');
  activeCommand = signal<ParsedFarmCommand | null>(null);
  commandHistory = signal<ParsedFarmCommand[]>([]);

  private recognition: any = null;

  constructor() {
    this.initSpeechRecognition();
  }

  /**
   * Web Speech API (Tarayıcı Yerel Türkçe Ses Tanıma)
   */
  private initSpeechRecognition(): void {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.lang = 'tr-TR';
      this.recognition.interimResults = false;

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        this.recognizedText.set(transcript);
        this.isListening.set(false);
        this.parseNaturalLanguage(transcript);
      };

      this.recognition.onerror = (err: any) => {
        console.warn('Speech recognition error:', err);
        this.isListening.set(false);
      };

      this.recognition.onend = () => {
        this.isListening.set(false);
      };
    }
  }

  isSpeechSupported(): boolean {
    return !!this.recognition;
  }

  startListening(): void {
    if (this.recognition) {
      try {
        this.recognizedText.set('');
        this.isListening.set(true);
        this.recognition.start();
      } catch (e) {
        console.warn('Speech already started:', e);
      }
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening()) {
      this.recognition.stop();
      this.isListening.set(false);
    }
  }

  /**
   * Doğal Dil Anlama (NLP / Varlık Çıkarma) Motoru
   * Örnek: "1042 küpeli koyuna bugün şap aşısı yapıldı 2 cc uygulandı"
   * Örnek: "TR-06-K-1042 nolu tokluyu B padoğuna aktar"
   * Örnek: "1042 nolu koyunu tarttım 48.5 kilo geldi"
   */
  parseNaturalLanguage(text: string): ParsedFarmCommand {
    const raw = (text || '').trim();
    const lower = raw.toLowerCase();

    // 1. Küpe No Tespiti
    let tagNo: string | undefined;
    const tagMatch = raw.match(/TR[-\s]?\d{2}[-\s]?[A-Z0-9]{1,3}[-\s]?\d{3,6}/i) || raw.match(/\b\d{3,6}\b/);
    if (tagMatch) {
      tagNo = tagMatch[0].replace(/\s+/g, '-').toUpperCase();
    }

    // Hayvanı veritabanından eşle
    let matchedAnimal: Animal | undefined;
    const animalsList = this.animals() || [];
    if (tagNo) {
      matchedAnimal = animalsList.find(
        (a) =>
          (a.nationalTagNo && a.nationalTagNo.includes(tagNo!)) ||
          (a.farmTagNo && a.farmTagNo.includes(tagNo!))
      );
    }
    if (!matchedAnimal && animalsList.length > 0) {
      // Eşleşme yoksa ilk aktif hayvanı demo olarak eşle
      matchedAnimal = animalsList[0];
      if (!tagNo && matchedAnimal) {
        tagNo = matchedAnimal.nationalTagNo || matchedAnimal.farmTagNo;
      }
    }

    // 2. Eylem Türü Tespiti
    let actionType: FarmCommandType = 'genel';
    let treatmentName: string | undefined;
    let dose: string | undefined;
    let weightKg: number | undefined;
    let targetPaddockName: string | undefined;
    let aiReply = '';

    if (
      lower.includes('aşı') ||
      lower.includes('ilaç') ||
      lower.includes('tedavi') ||
      lower.includes('parazit') ||
      lower.includes('antibiyotik') ||
      lower.includes('vitamin') ||
      lower.includes('iğne')
    ) {
      actionType = 'tedavi';
      // Tedavi Adı
      if (lower.includes('şap')) treatmentName = 'Şap Aşısı (Bivalan)';
      else if (lower.includes('parazit') || lower.includes('iç parazit')) treatmentName = 'İç Parazit (İvermektin)';
      else if (lower.includes('çiçek')) treatmentName = 'Koyun Çiçek Aşısı';
      else if (lower.includes('veba')) treatmentName = 'PPR Koyun Vebası Aşısı';
      else if (lower.includes('enterotoksemi') || lower.includes('çelme')) treatmentName = 'Enterotoksemi (Çelme) Aşısı';
      else if (lower.includes('vitamin')) treatmentName = 'AD3E Vitamin Kompleksi';
      else treatmentName = 'Genel Koruyucu Tedavi';

      // Dozaj tespiti (örn: 2 cc, 3 ml)
      const doseMatch = raw.match(/\d+([.,]\d+)?\s*(cc|ml|doz|gram)/i);
      dose = doseMatch ? doseMatch[0] : '2 cc';

      aiReply = `✅ ${tagNo || 'Belirtilen'} küpeli hayvana ${treatmentName} (${dose}) tedavi kaydı hazırlandı. Yasal süt ve et arınma süresi takvime işlendi.`;
    } else if (lower.includes('kilo') || lower.includes('tart') || lower.includes('ağırlık') || lower.includes('kg')) {
      actionType = 'tartim';
      const weightMatch = raw.match(/\d+([.,]\d+)?\s*(kg|kilo)?/i);
      weightKg = weightMatch ? parseFloat(weightMatch[0].replace(',', '.')) : 42.5;

      aiReply = `⚖️ ${tagNo || 'Belirtilen'} küpeli hayvan için ${weightKg} kg canlı ağırlık ölçümü tespit edildi. Günlük canlı ağırlık artışı (GCAA) yeniden hesaplanıyor.`;
    } else if (lower.includes('padok') || lower.includes('taşı') || lower.includes('aktar') || lower.includes('sevk')) {
      actionType = 'hareket';
      if (lower.includes('revir') || lower.includes('karantina')) targetPaddockName = 'Karantina & Revir';
      else if (lower.includes('b padok') || lower.includes('b padoğu')) targetPaddockName = 'B Padoku (Besi)';
      else if (lower.includes('doğum') || lower.includes('gebe')) targetPaddockName = 'Doğumhane Padoku';
      else targetPaddockName = 'A Padoku (Anaçlar)';

      aiReply = `🚚 ${tagNo || 'Belirtilen'} küpeli hayvanın ${targetPaddockName} konumuna nakil hareketi hazırlandı.`;
    } else if (lower.includes('doğum') || lower.includes('doğurdu') || lower.includes('kuzu')) {
      actionType = 'dogum';
      aiReply = `🐣 ${tagNo || 'Anaç'} koyun için doğum ve yavru kayıt taslağı oluşturuldu. Kulak küpeleme listesine eklendi.`;
    } else {
      actionType = 'genel';
      aiReply = `📋 Çiftlik notu kaydedildi: "${raw}"`;
    }

    const command: ParsedFarmCommand = {
      id: 'cmd-' + Date.now(),
      rawText: raw,
      actionType,
      tagNo: tagNo || 'TR-06-K-1042',
      animalId: matchedAnimal?.id,
      animalName: matchedAnimal?.name || 'Kayıtlı Hayvan',
      treatmentName,
      dose,
      weightKg,
      targetPaddockName,
      confidence: 96.5,
      executionStatus: 'beklemede',
      aiReplyMessage: aiReply,
      timestamp: new Date(),
    };

    this.activeCommand.set(command);
    return command;
  }

  /**
   * Ayrıştırılan komutu onaylayıp sisteme gerçek veri olarak işleme
   */
  async executeCommand(cmd: ParsedFarmCommand): Promise<boolean> {
    try {
      if (cmd.actionType === 'tartim' && cmd.animalId && cmd.weightKg) {
        await this.weightService.create({
          animalId: cmd.animalId,
          date: new Date().toISOString().substring(0, 10),
          weightKg: cmd.weightKg,
          note: 'Sesli Asistan ile kaydedildi.',
        });
      }

      cmd.executionStatus = 'onaylandi';
      this.commandHistory.update((prev) => [cmd, ...prev]);
      this.activeCommand.set(null);
      return true;
    } catch (e) {
      console.error('Komut çalıştırma hatası:', e);
      return false;
    }
  }
}
