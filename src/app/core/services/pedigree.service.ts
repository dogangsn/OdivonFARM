import { Injectable } from '@angular/core';
import { Animal } from '../models/animal.model';

export type InbreedingRiskLevel = 'critical' | 'high' | 'moderate' | 'low' | 'safe';

export interface CommonAncestorMatch {
  ancestor: Animal;
  maternalPath: string[]; // e.g. ["Anne", "Dede"]
  paternalPath: string[]; // e.g. ["Baba"]
  generationDistance: number;
  contributionPercentage: number;
}

export interface InbreedingAnalysisResult {
  femaleId: string;
  maleId: string;
  coefficient: number; // Wright's F: 0.0 to 1.0 (e.g. 0.25)
  percentage: number; // e.g. 25.0
  riskLevel: InbreedingRiskLevel;
  relationshipTitle: string;
  summary: string;
  commonAncestors: CommonAncestorMatch[];
  warnings: string[];
  recommendation: string;
}

export interface PedigreeNode {
  animal: Animal | null;
  tagNo: string;
  name?: string;
  gender?: string;
  breedName?: string;
  role: 'female' | 'male' | 'mother' | 'father' | 'm_grandmother' | 'm_grandfather' | 'p_grandmother' | 'p_grandfather' | string;
  isCommonAncestor?: boolean;
  children?: PedigreeNode[];
}

@Injectable({
  providedIn: 'root',
})
export class PedigreeService {
  /**
   * Hem doküman ID (Firestore UID) hem de çiftlik küpe numarası (farmTagNo / nationalTagNo)
   * üzerinden hayvanı esnek ve hatasız biçimde bulur.
   */
  resolveAnimal(idOrTag: string | number | undefined | null, animals: Animal[]): Animal | undefined {
    if (idOrTag === undefined || idOrTag === null) return undefined;
    const target = String(idOrTag).trim().toLowerCase();
    if (!target) return undefined;
    return animals.find((a) => {
      if (a.id && String(a.id).toLowerCase() === target) return true;
      if (a.farmTagNo && String(a.farmTagNo).toLowerCase() === target) return true;
      if (a.nationalTagNo && String(a.nationalTagNo).toLowerCase() === target) return true;
      return false;
    });
  }

  /**
   * İki hayvan referansının aynı fiziksel hayvana ait olup olmadığını kontrol eder.
   */
  isSameAnimal(a1: Animal | undefined | null, a2: Animal | undefined | null): boolean {
    if (!a1 || !a2) return false;
    if (a1.id && a2.id && String(a1.id).toLowerCase() === String(a2.id).toLowerCase()) return true;
    if (a1.farmTagNo && a2.farmTagNo && String(a1.farmTagNo).toLowerCase() === String(a2.farmTagNo).toLowerCase()) return true;
    return false;
  }

  /**
   * İki hayvan arasındaki akrabalık derecesini (Wright's Inbreeding Coefficient F)
   * ve ortak ata çakışmalarını derinlemesine analiz eder.
   */
  analyzeInbreeding(
    femaleId: string,
    maleId: string,
    animals: Animal[]
  ): InbreedingAnalysisResult | null {
    if (!femaleId || !maleId) return null;

    const female = this.resolveAnimal(femaleId, animals);
    const male = this.resolveAnimal(maleId, animals);

    if (!female || !male) return null;

    if (this.isSameAnimal(female, male)) {
      return {
        femaleId,
        maleId,
        coefficient: 1.0,
        percentage: 100,
        riskLevel: 'critical',
        relationshipTitle: 'Aynı Hayvan Seçildi',
        summary: 'Aynı hayvan hem anne hem baba olarak seçilemez.',
        commonAncestors: [],
        warnings: ['Geçersiz seçim: Dişi ve erkek farklı hayvanlar olmalıdır.'],
        recommendation: 'Lütfen farklı bir dişi ve erkek hayvan seçiniz.',
      };
    }

    const femaleFather = this.resolveAnimal(female.fatherId, animals);
    const femaleMother = this.resolveAnimal(female.motherId, animals);
    const maleFather = this.resolveAnimal(male.fatherId, animals);
    const maleMother = this.resolveAnimal(male.motherId, animals);

    // 1. Doğrudan Ebeveyn - Çocuk İlişkileri: Baba - Kız Çaprazlaması
    if (this.isSameAnimal(femaleFather, male)) {
      return {
        femaleId,
        maleId,
        coefficient: 0.25,
        percentage: 25.0,
        riskLevel: 'critical',
        relationshipTitle: 'Baba - Kız Çaprazlaması',
        summary: `${male.farmTagNo} küpeli erkek, ${female.farmTagNo} küpeli dişinin öz babasıdır!`,
        commonAncestors: [
          {
            ancestor: male,
            maternalPath: ['Baba'],
            paternalPath: ['Kendisi'],
            generationDistance: 1,
            contributionPercentage: 25.0,
          },
        ],
        warnings: [
          'Döl veriminde ağır genetik gerileme',
          'Yüksek oranda sakat/ölü doğum riski',
          'Bağışıklık yetersizliği ve yüksek yavru ölüm oranı',
        ],
        recommendation: 'Bu eşleşme KESİNLİKLE TAVSİYE EDİLMEZ! Sürüye taze kan damızlık katınız.',
      };
    }

    // 2. Doğrudan Ebeveyn - Çocuk İlişkileri: Anne - Oğul Çaprazlaması
    if (this.isSameAnimal(maleMother, female)) {
      return {
        femaleId,
        maleId,
        coefficient: 0.25,
        percentage: 25.0,
        riskLevel: 'critical',
        relationshipTitle: 'Anne - Oğul Çaprazlaması',
        summary: `${female.farmTagNo} küpeli dişi, ${male.farmTagNo} küpeli erkeğin öz annesidir!`,
        commonAncestors: [
          {
            ancestor: female,
            maternalPath: ['Kendisi'],
            paternalPath: ['Anne'],
            generationDistance: 1,
            contributionPercentage: 25.0,
          },
        ],
        warnings: [
          'Aşırı derecede yüksek genetik kusur aktarım riski',
          'Süt ve canlı ağırlık artışında belirgin inbreeding depresyonu',
        ],
        recommendation: 'Bu eşleşme KESİNLİKLE TAVSİYE EDİLMEZ! Farklı bir damızlık kullanınız.',
      };
    }

    // 3. Kardeşlik İlişkileri (Tam Öz Kardeş: Aynı Anne ve Aynı Baba)
    const shareMother = femaleMother && maleMother && this.isSameAnimal(femaleMother, maleMother);
    const shareFather = femaleFather && maleFather && this.isSameAnimal(femaleFather, maleFather);

    if (shareMother && shareFather) {
      const matches: CommonAncestorMatch[] = [];
      if (femaleMother) {
        matches.push({
          ancestor: femaleMother,
          maternalPath: ['Anne'],
          paternalPath: ['Anne'],
          generationDistance: 2,
          contributionPercentage: 12.5,
        });
      }
      if (femaleFather) {
        matches.push({
          ancestor: femaleFather,
          maternalPath: ['Baba'],
          paternalPath: ['Baba'],
          generationDistance: 2,
          contributionPercentage: 12.5,
        });
      }
      return {
        femaleId,
        maleId,
        coefficient: 0.25,
        percentage: 25.0,
        riskLevel: 'critical',
        relationshipTitle: 'Tam Öz Kardeş Çiftleşmesi',
        summary: `${female.farmTagNo} ve ${male.farmTagNo} aynı anne ve aynı babadan doğmuş öz kardeştir!`,
        commonAncestors: matches,
        warnings: [
          'Akraba çiftleşme katsayısı %25 ile kritik seviyededir',
          'Doğacak yavruda çekinik (resesif) öldürücü genlerin ortaya çıkma ihtimali çok yüksektir',
        ],
        recommendation: 'Bu çiftleşmeden doğacak döller damızlık vasfını kaybeder. Eşleşmeyi iptal ediniz.',
      };
    }

    // 4. Kardeşlik İlişkileri (Üvey Kardeş: Sadece Baba Ortak veya Sadece Anne Ortak)
    if (shareFather || shareMother) {
      const parentType = shareFather ? 'Baba (Erkek)' : 'Anne (Dişi)';
      const parent = shareFather ? femaleFather! : femaleMother!;
      const matches: CommonAncestorMatch[] = [
        {
          ancestor: parent,
          maternalPath: [parentType],
          paternalPath: [parentType],
          generationDistance: 2,
          contributionPercentage: 12.5,
        },
      ];
      return {
        femaleId,
        maleId,
        coefficient: 0.125,
        percentage: 12.5,
        riskLevel: 'high',
        relationshipTitle: `Üvey Kardeş (${parentType} Ortak)`,
        summary: `Her iki hayvanın da ${parentType.toLowerCase()}sı aynıdır (${parent.farmTagNo || 'Kayıtlı'}).`,
        commonAncestors: matches,
        warnings: [
          'Akrabalık katsayısı %12.5 (Yüksek Risk)',
          'Sürünün genetik çeşitliliği daralır ve sürü bağışıklığı zayıflar',
        ],
        recommendation: 'Özellikle damızlık yenileme yapılıyorsa bu eşleşme yerine akraba olmayan damızlık seçilmelidir.',
      };
    }

    // 5. 3 ve 4 Jenerasyonluk Soy Ağacı Taraması (Atalar Grafı)
    const femaleAncestors = this.getAncestorsWithPaths(female, animals, 3);
    const maleAncestors = this.getAncestorsWithPaths(male, animals, 3);

    const commonMatches: CommonAncestorMatch[] = [];
    let totalCoefficient = 0;

    for (const [ancKey, fData] of femaleAncestors.entries()) {
      if (maleAncestors.has(ancKey)) {
        const mData = maleAncestors.get(ancKey)!;
        const anc = fData.ancestor;

        // Wright's Path Coefficient: (1/2)^(n1 + n2 + 1)
        const n1 = fData.depth;
        const n2 = mData.depth;
        const pathFactor = Math.pow(0.5, n1 + n2 + 1);
        totalCoefficient += pathFactor;

        commonMatches.push({
          ancestor: anc,
          maternalPath: fData.path,
          paternalPath: mData.path,
          generationDistance: n1 + n2,
          contributionPercentage: Math.round(pathFactor * 1000) / 10,
        });
      }
    }

    if (commonMatches.length > 0) {
      const percentage = Math.round(totalCoefficient * 1000) / 10;
      let riskLevel: InbreedingRiskLevel = 'low';
      let title = 'Uzak Akraba Eşleşmesi';

      if (totalCoefficient >= 0.20) {
        riskLevel = 'critical';
        title = 'Kritik Düzeyde Akrabalık';
      } else if (totalCoefficient >= 0.10) {
        riskLevel = 'high';
        title = 'Yüksek Akrabalık (Dede/Torun veya Çoklu Ortak Ata)';
      } else if (totalCoefficient >= 0.05) {
        riskLevel = 'moderate';
        title = 'Orta Düzey Akrabalık (Kuzen Çaprazlaması)';
      } else {
        riskLevel = 'low';
        title = 'Düşük Akrabalık Riski (3. Kuşak Ortak Ata)';
      }

      return {
        femaleId,
        maleId,
        coefficient: totalCoefficient,
        percentage,
        riskLevel,
        relationshipTitle: title,
        summary: `Soy ağacında ${commonMatches.length} adet ortak ata tespit edildi. Akrabalık katsayısı: %${percentage}`,
        commonAncestors: commonMatches,
        warnings: [
          riskLevel === 'critical' || riskLevel === 'high'
            ? 'Genetik homozigotluk artar ve gizli kalıtsal hastalıklar açığa çıkabilir.'
            : 'Genetik çeşitlilik kısmen korunmakla birlikte damızlık seçiminde dikkat edilmelidir.',
        ],
        recommendation:
          riskLevel === 'critical' || riskLevel === 'high'
            ? 'Mümkünse başka bir damızlık tercih edilmelidir.'
            : 'Ticari besi üretiminde tolere edilebilir, damızlık üretiminde kontrollü kullanılmalıdır.',
      };
    }

    // 6. Ortak Ata Tespit Edilmedi -> Güvenli Eşleşme
    return {
      femaleId,
      maleId,
      coefficient: 0,
      percentage: 0,
      riskLevel: 'safe',
      relationshipTitle: 'Güvenli Eşleşme (Akrabalık Yok)',
      summary: 'İncelenen 3 kuşaklık soy kütüğünde ortak bir ata bulunamadı. Eşleşme genetik açıdan tamamen güvenlidir.',
      commonAncestors: [],
      warnings: [],
      recommendation: 'Heterozis (Melez Azmanlığı) etkisi ile verimli ve dirençli yavrular elde edilebilir.',
    };
  }

  /**
   * Bir hayvanın atalarını derinlik ve soy yoluyla birlikte haritalandırır.
   */
  private getAncestorsWithPaths(
    animal: Animal,
    animals: Animal[],
    maxDepth: number
  ): Map<string, { depth: number; path: string[]; ancestor: Animal }> {
    const ancestors = new Map<string, { depth: number; path: string[]; ancestor: Animal }>();

    const traverse = (current: Animal, depth: number, currentPath: string[]) => {
      if (depth > maxDepth) return;

      // Anne Kolu
      if (current.motherId) {
        const mother = this.resolveAnimal(current.motherId, animals);
        if (mother) {
          const key = String(mother.id || mother.farmTagNo).toLowerCase();
          const motherPath = [...currentPath, 'Anne'];
          if (!ancestors.has(key) || ancestors.get(key)!.depth > depth) {
            ancestors.set(key, { depth, path: motherPath, ancestor: mother });
          }
          traverse(mother, depth + 1, motherPath);
        }
      }

      // Baba Kolu
      if (current.fatherId) {
        const father = this.resolveAnimal(current.fatherId, animals);
        if (father) {
          const key = String(father.id || father.farmTagNo).toLowerCase();
          const fatherPath = [...currentPath, 'Baba'];
          if (!ancestors.has(key) || ancestors.get(key)!.depth > depth) {
            ancestors.set(key, { depth, path: fatherPath, ancestor: father });
          }
          traverse(father, depth + 1, fatherPath);
        }
      }
    };

    traverse(animal, 1, []);
    return ancestors;
  }

  /**
   * İki hayvanın karşılaştırmalı 3 kuşaklık soy ağacı ağacını görselleştirmek için hazırlar.
   */
  buildComparisonTree(femaleId: string, maleId: string, animals: Animal[]): {
    femaleTree: PedigreeNode;
    maleTree: PedigreeNode;
    commonAncestorIds: Set<string>;
  } | null {
    const female = this.resolveAnimal(femaleId, animals);
    const male = this.resolveAnimal(maleId, animals);
    if (!female || !male) return null;

    const femaleAncestors = this.getAncestorsWithPaths(female, animals, 3);
    const maleAncestors = this.getAncestorsWithPaths(male, animals, 3);

    const commonAncestorKeys = new Set<string>();
    for (const ancKey of femaleAncestors.keys()) {
      if (maleAncestors.has(ancKey)) {
        commonAncestorKeys.add(ancKey);
      }
    }

    // Doğrudan ebeveynlik çakışması kontrolü
    const femaleFather = this.resolveAnimal(female.fatherId, animals);
    const femaleMother = this.resolveAnimal(female.motherId, animals);
    const maleFather = this.resolveAnimal(male.fatherId, animals);
    const maleMother = this.resolveAnimal(male.motherId, animals);

    if (this.isSameAnimal(femaleFather, male) || this.isSameAnimal(maleMother, female)) {
      if (male.id) commonAncestorKeys.add(String(male.id).toLowerCase());
      if (male.farmTagNo) commonAncestorKeys.add(String(male.farmTagNo).toLowerCase());
      if (female.id) commonAncestorKeys.add(String(female.id).toLowerCase());
      if (female.farmTagNo) commonAncestorKeys.add(String(female.farmTagNo).toLowerCase());
    }

    const buildNode = (
      currentIdOrTag: string | number | undefined,
      role: string,
      depth: number
    ): PedigreeNode => {
      if (!currentIdOrTag) {
        return {
          animal: null,
          tagNo: 'Bilinmiyor',
          role,
        };
      }

      const a = this.resolveAnimal(currentIdOrTag, animals);
      if (!a) {
        return {
          animal: null,
          tagNo: String(currentIdOrTag),
          role,
        };
      }

      const key1 = String(a.id || '').toLowerCase();
      const key2 = String(a.farmTagNo || '').toLowerCase();
      const isCommon = commonAncestorKeys.has(key1) || commonAncestorKeys.has(key2);

      const node: PedigreeNode = {
        animal: a,
        tagNo: String(a.farmTagNo || currentIdOrTag),
        name: a.name,
        gender: a.gender,
        role,
        isCommonAncestor: isCommon,
      };

      if (depth < 3) {
        node.children = [
          buildNode(a.motherId, 'Anne', depth + 1),
          buildNode(a.fatherId, 'Baba', depth + 1),
        ];
      }

      return node;
    };

    return {
      femaleTree: buildNode(female.id || female.farmTagNo, 'Dişi (Ana)', 1),
      maleTree: buildNode(male.id || male.farmTagNo, 'Erkek (Koç/Boğa)', 1),
      commonAncestorIds: commonAncestorKeys,
    };
  }
}
