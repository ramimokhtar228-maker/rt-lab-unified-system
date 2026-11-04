/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TestParameter, TestProfile } from '../types/lab';

export interface CbcExtractedData {
  // Erythrocyte / Red Cell Lineage
  rbc: number | null; // 10^12/L
  hb: number | null; // g/dL
  pcv: number | null; // % (Hematocrit)
  mcv: number | null; // fL
  mch: number | null; // pg
  mchc: number | null; // g/dL
  rdw: number | null; // % (RDW-CV)
  rdwSd: number | null; // fL

  // Platelet Lineage
  plt: number | null; // 10^9/L
  mpv: number | null; // fL
  pdw: number | null; // %
  pct: number | null; // %

  // Leukocyte / White Cell Lineage
  wbc: number | null; // 10^9/L
  neutrophils: number | null; // %
  lymphocytes: number | null; // %
  monocytes: number | null; // %
  eosinophils: number | null; // %
  basophils: number | null; // %

  // Absolute Counts
  anc: number | null; // 10^9/L
  alc: number | null; // 10^9/L
  amc: number | null; // 10^9/L
  aec: number | null; // 10^9/L
  abc: number | null; // 10^9/L
  nlr: number | null;

  // Differential Indices
  mentzerIndex: number | null;
  greenKingIndex: number | null;

  // Morphology & Classification (حجم وشكل الكرات)
  sizeClassification: 'Normocytic' | 'Microcytic' | 'Macrocytic' | 'Undetermined';
  sizeClassificationAr: string;
  sizeColor: string;

  anisocytosisGrade: 'Normal' | 'Mild (+)' | 'Moderate (++)' | 'Marked (+++)';
  anisocytosisAr: string;

  chromiaClassification: 'Normochromic' | 'Hypochromic (+)' | 'Hypochromic (++)' | 'Hypochromic (+++)' | 'Polychromasia' | 'Undetermined';
  chromiaAr: string;

  differentialDiagnosisAr: string;
  differentialDiagnosisEn: string;
  bessmanCategoryEn: string;
  bessmanCategoryAr: string;
}

/**
 * Check if the given profile represents a Complete Blood Count (CBC)
 */
export function isCBCProfile(profile?: { profileCode?: string; titleEn?: string; titleAr?: string } | null): boolean {
  if (!profile) return false;
  const code = (profile.profileCode || '').trim().toUpperCase();
  const en = (profile.titleEn || '').toLowerCase();
  const ar = profile.titleAr || '';
  return (
    code === 'CBC' ||
    en.includes('complete blood') ||
    en.includes('cbc') ||
    en.includes('hemogram') ||
    ar.includes('صورة دم') ||
    ar.includes('صورة الدم')
  );
}

/**
 * Extract quantitative parameters and calculate CBC cell size/shape indices
 */
export function extractCBCData(parameters: TestParameter[]): CbcExtractedData {
  const map = new Map<string, number>();

  for (const p of parameters) {
    const key = (p.name || '').toLowerCase().trim();
    const val = parseFloat(p.result);
    if (!isNaN(val)) {
      map.set(key, val);
    }
  }

  const findVal = (keywords: string[]): number | null => {
    for (const kw of keywords) {
      for (const [k, v] of map.entries()) {
        if (k.includes(kw.toLowerCase())) return v;
      }
    }
    return null;
  };

  const hb = findVal(['hemoglobin', 'hgb', 'hb', 'هيموجلوبين']);
  const rbc = findVal(['r.b.cs', 'rbc', 'erythrocyte', 'حمراء']);
  let pcv = findVal(['hematocrit', 'pcv', 'hct']);
  if (pcv === null && hb !== null) {
    pcv = Number((hb * 3).toFixed(1));
  }

  let mcv = findVal(['m.c.v', 'mcv', 'حجم الكرية']);
  if (mcv === null && pcv !== null && rbc !== null && rbc > 0) {
    mcv = Number(((pcv * 10) / rbc).toFixed(1));
  }

  let mch = findVal(['m.c.h', 'mch']);
  if (mch === null && hb !== null && rbc !== null && rbc > 0) {
    mch = Number(((hb * 10) / rbc).toFixed(1));
  }

  let mchc = findVal(['m.c.h.c', 'mchc']);
  if (mchc === null && hb !== null && pcv !== null && pcv > 0) {
    mchc = Number(((hb * 100) / pcv).toFixed(1));
  }

  const rdw = findVal(['rdw-cv', 'r.d.w-cv', 'rdw', 'r.d.w']);
  const rdwSd = findVal(['rdw-sd', 'r.d.w-sd']);

  const plt = findVal(['platelets count', 'platelet', 'plt', 'الصفائح']);
  const mpv = findVal(['m.p.v', 'mpv', 'mean platelet']);
  const pdw = findVal(['pdw', 'p.d.w']);
  const pct = findVal(['pct', 'p.c.t', 'plateletcrit']);

  const wbc = findVal(['total leucocytic', 'wbc', 'leukocyte', 'tlc', 'البيضاء']);
  const neutrophils = findVal(['total neutrophils', 'segmented', 'neutrophil', 'seg']);
  const lymphocytes = findVal(['lymphocytes', 'lymphocyte', 'lymph']);
  const monocytes = findVal(['monocytes', 'monocyte', 'mono']);
  const eosinophils = findVal(['eosinophils', 'eosinophil', 'eos']);
  const basophils = findVal(['basophils', 'basophil', 'baso']);

  const anc = findVal(['anc', 'absolute neutrophil']);
  const alc = findVal(['alc', 'absolute lymph']);
  const amc = findVal(['amc', 'absolute mono']);
  const aec = findVal(['aec', 'absolute eos']);
  const abc = findVal(['abc', 'absolute baso']);
  const nlr = findVal(['nlr', 'neutrophil/lymphocyte']);

  // Mentzer Index: MCV / RBC
  let mentzerIndex: number | null = null;
  if (mcv !== null && rbc !== null && rbc > 0) {
    mentzerIndex = Number((mcv / rbc).toFixed(1));
  }

  // Green & King Index: (MCV^2 * RDW) / (Hb * 100)
  let greenKingIndex: number | null = null;
  if (mcv !== null && rdw !== null && hb !== null && hb > 0) {
    greenKingIndex = Number(((Math.pow(mcv, 2) * rdw) / (hb * 100)).toFixed(1));
  }

  // Size Classification (حجم كرات الدم الحمراء)
  let sizeClassification: 'Normocytic' | 'Microcytic' | 'Macrocytic' | 'Undetermined' = 'Undetermined';
  let sizeClassificationAr = 'غير محدد';
  let sizeColor = '#64748b';

  if (mcv !== null) {
    if (mcv < 80) {
      sizeClassification = 'Microcytic';
      sizeClassificationAr = 'حجم صغير (Microcytic < 80 fL)';
      sizeColor = '#dc2626'; // rose
    } else if (mcv > 100) {
      sizeClassification = 'Macrocytic';
      sizeClassificationAr = 'حجم كبير (Macrocytic > 100 fL)';
      sizeColor = '#7c3aed'; // purple
    } else {
      sizeClassification = 'Normocytic';
      sizeClassificationAr = 'حجم طبيعي (Normocytic 80 - 100 fL)';
      sizeColor = '#059669'; // emerald
    }
  }

  // Anisocytosis Grade (تجانس الحجم وتباين القطر)
  let anisocytosisGrade: 'Normal' | 'Mild (+)' | 'Moderate (++)' | 'Marked (+++)' = 'Normal';
  let anisocytosisAr = 'خلايا متجانسة الحجم (Normal Uniformity)';
  if (rdw !== null) {
    if (rdw > 19.0) {
      anisocytosisGrade = 'Marked (+++)';
      anisocytosisAr = 'تباين شديد في أحجام الكرات (Marked Anisocytosis +++)';
    } else if (rdw > 16.5) {
      anisocytosisGrade = 'Moderate (++)';
      anisocytosisAr = 'تباين متوسط في أحجام الكرات (Moderate Anisocytosis ++)';
    } else if (rdw > 14.5) {
      anisocytosisGrade = 'Mild (+)';
      anisocytosisAr = 'تباين خفيف في أحجام الكرات (Mild Anisocytosis +)';
    } else {
      anisocytosisGrade = 'Normal';
      anisocytosisAr = 'خلايا متجانسة الحجم ومتماثلة القطر (Homogeneous RBC Population)';
    }
  }

  // Chromia (درجة الصباغ ومحتوى الهيموجلوبين)
  let chromiaClassification: 'Normochromic' | 'Hypochromic (+)' | 'Hypochromic (++)' | 'Hypochromic (+++)' | 'Polychromasia' | 'Undetermined' = 'Undetermined';
  let chromiaAr = 'غير محدد';
  if (mch !== null) {
    if (mch < 22) {
      chromiaClassification = 'Hypochromic (+++)';
      chromiaAr = 'شحوب صباغي شديد (Marked Hypochromia +++)';
    } else if (mch < 25) {
      chromiaClassification = 'Hypochromic (++)';
      chromiaAr = 'شحوب صباغي متوسط (Moderate Hypochromia ++)';
    } else if (mch < 27) {
      chromiaClassification = 'Hypochromic (+)';
      chromiaAr = 'شحوب صباغي خفيف (Mild Hypochromia +)';
    } else if (mch > 34) {
      chromiaClassification = 'Polychromasia';
      chromiaAr = 'زيادة صباغ / خلايا متعددة الصباغ (Polychromasia / Hyperchromia)';
    } else {
      chromiaClassification = 'Normochromic';
      chromiaAr = 'صباغ طبيعي مشبع بالهيموجلوبين (Normochromic)';
    }
  }

  // Bessman Classification of Anemias (تصنيف بيسمان وفق الحجم ومؤشر RDW)
  let bessmanCategoryEn = 'Normal RBC Indices';
  let bessmanCategoryAr = 'مؤشرات كرات الدم ضمن المعدل الطبيعي';
  let differentialDiagnosisAr = 'لا توجد دلالات أنيميا ظاهرة، صورة الدم متوازنة.';
  let differentialDiagnosisEn = 'Balanced red cell indices within physiological reference ranges.';

  if (sizeClassification === 'Microcytic') {
    if (anisocytosisGrade !== 'Normal') {
      bessmanCategoryEn = 'Microcytic Heterogeneous (High RDW)';
      bessmanCategoryAr = 'حجم صغير غير متجانس (Microcytic with High RDW)';
      if (mentzerIndex !== null && mentzerIndex > 13) {
        differentialDiagnosisAr = `مؤشر منتزر (${mentzerIndex} > 13) مع تباين الحجم (${rdw}%): يرجح بشدة أنيميا نقص الحديد (Iron Deficiency Anemia). يوصى بفحص الفيريتين والحديد.`;
        differentialDiagnosisEn = `Mentzer Index (${mentzerIndex} > 13) + High RDW strongly favors Iron Deficiency Anemia (IDA). Recommend Serum Ferritin.`;
      } else {
        differentialDiagnosisAr = `حجم كرات صغير مع تباين في الحجم (High RDW): يرجح نقص الحديد أو أنيميا مختلطة.`;
        differentialDiagnosisEn = `Microcytic anemia with anisocytosis: Iron deficiency or mixed etiology suspected.`;
      }
    } else {
      bessmanCategoryEn = 'Microcytic Homogeneous (Normal RDW)';
      bessmanCategoryAr = 'حجم صغير متجانس (Microcytic with Normal RDW)';
      if (mentzerIndex !== null && mentzerIndex < 13) {
        differentialDiagnosisAr = `مؤشر منتزر (${mentzerIndex} < 13) مع تجانس الحجم (${rdw || 13}%): يرجح بقوة سمة أنيميا البحر المتوسط (Beta Thalassemia Trait). يوصى بعمل الفصل الكهربائي للهيموجلوبين (Hb Electrophoresis).`;
        differentialDiagnosisEn = `Mentzer Index (${mentzerIndex} < 13) + Normal RDW strongly favors Beta Thalassemia Trait. Recommend Hb Electrophoresis.`;
      } else {
        differentialDiagnosisAr = `حجم كرات صغير مع تجانس الحجم: سمة ثلاسيميا أو أنيميا الأمراض المزمنة.`;
        differentialDiagnosisEn = `Microcytic homogeneous indices: Thalassemia trait or anemia of chronic disease.`;
      }
    }
  } else if (sizeClassification === 'Macrocytic') {
    if (anisocytosisGrade !== 'Normal') {
      bessmanCategoryEn = 'Macrocytic Heterogeneous (High RDW)';
      bessmanCategoryAr = 'حجم كبير غير متجانس (Macrocytic with High RDW)';
      differentialDiagnosisAr = `حجم كبير مع تباين ملحوظ (RDW > 14.5%): يرجح أنيميا نقص فيتامين B12 أو الفوليك (Megaloblastic Anemia) أو فقر دم انحلالي مع زيادة الشبكيات.`;
      differentialDiagnosisEn = `Macrocytosis with elevated RDW: Suggestive of Megaloblastic Anemia (Vit B12 / Folate deficiency) or reticulocytosis.`;
    } else {
      bessmanCategoryEn = 'Macrocytic Homogeneous (Normal RDW)';
      bessmanCategoryAr = 'حجم كبير متجانس (Macrocytic with Normal RDW)';
      differentialDiagnosisAr = `حجم كبير مع تجانس: قد يرتبط بوظائف الكبد، خمول الغدة الدرقية، أو تأثير أدوية ومواد كيميائية.`;
      differentialDiagnosisEn = `Macrocytic homogeneous indices: Liver disease, hypothyroidism, or chemotherapy effect.`;
    }
  } else if (sizeClassification === 'Normocytic') {
    if (anisocytosisGrade !== 'Normal') {
      bessmanCategoryEn = 'Normocytic Heterogeneous (High RDW)';
      bessmanCategoryAr = 'حجم طبيعي غير متجانس (Normocytic with High RDW)';
      differentialDiagnosisAr = `حجم طبيعي مع تباين (High RDW): مرحلة مبكرة لنقص الحديد أو فيتامين B12، أو وجود أنيميا مزدوجة (Dimorphic Anemia).`;
      differentialDiagnosisEn = `Normocytic with anisocytosis: Early nutritional deficiency or dimorphic anemia (e.g. combined iron + B12 deficiency).`;
    } else {
      bessmanCategoryEn = 'Normocytic Homogeneous (Normal RDW)';
      bessmanCategoryAr = 'حجم طبيعي متجانس (Normocytic Normochromic)';
      if (hb !== null && hb < 11.5) {
        differentialDiagnosisAr = `أنيميا طبيعية الحجم والصباغ (Normocytic Normochromic): تشاهد في فقدان الدم الحديث، أنيميا الأمراض المزمنة، أو القصور الكلوي.`;
        differentialDiagnosisEn = `Normocytic normochromic anemia: Recent hemorrhage, anemia of chronic disease, or renal impairment.`;
      } else {
        differentialDiagnosisAr = `مؤشرات كرات الدم الحمراء والصفائح متزنة تماماً ضمن المعدلات الطبيعية (Normal Hemogram).`;
        differentialDiagnosisEn = `Normal complete blood count with normal erythrocyte volume and indices.`;
      }
    }
  }

  return {
    rbc,
    hb,
    pcv,
    mcv,
    mch,
    mchc,
    rdw,
    rdwSd,
    plt,
    mpv,
    pdw,
    pct,
    wbc,
    neutrophils,
    lymphocytes,
    monocytes,
    eosinophils,
    basophils,
    anc,
    alc,
    amc,
    aec,
    abc,
    nlr,
    mentzerIndex,
    greenKingIndex,
    sizeClassification,
    sizeClassificationAr,
    sizeColor,
    anisocytosisGrade,
    anisocytosisAr,
    chromiaClassification,
    chromiaAr,
    differentialDiagnosisAr,
    differentialDiagnosisEn,
    bessmanCategoryEn,
    bessmanCategoryAr
  };
}

/**
 * Generate High-Definition Standalone SVG Chart for the RBC Histogram (منحنى حجم كرات الدم الحمراء)
 * Price-Jones distribution curve with patient peak vs healthy reference envelope.
 */
export function generateCbcRbcSvgChart(data: CbcExtractedData, width = 340, height = 180): string {
  const padLeft = 38;
  const padRight = 16;
  const padTop = 22;
  const padBottom = 26;
  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;

  const minFL = 25;
  const maxFL = 225;
  const spanFL = maxFL - minFL;

  const toX = (fl: number) => padLeft + ((fl - minFL) / spanFL) * plotWidth;
  const toY = (normY: number) => padTop + (1 - normY) * plotHeight;

  // Patient curve parameters
  const patientMCV = data.mcv ?? 90;
  // Standard deviation from RDW-CV: SD = (RDW% * MCV) / 100
  const patientRDW = data.rdw ?? 13.0;
  const patientSD = Math.max(7, Math.min(26, (patientRDW * patientMCV) / 100));

  // Reference Normal Curve (MCV 90, RDW 12.5% -> SD 11.25)
  const refMCV = 90;
  const refSD = 11.5;

  // Generate smooth Gaussian sample points from 30 to 220 fL
  const step = 2.5;
  const refPoints: { x: number; y: number }[] = [];
  const patPoints: { x: number; y: number }[] = [];

  for (let fl = minFL; fl <= maxFL; fl += step) {
    // Normal gaussian
    const refG = Math.exp(-0.5 * Math.pow((fl - refMCV) / refSD, 2));
    refPoints.push({ x: toX(fl), y: toY(refG * 0.85) });

    // Patient gaussian
    const patG = Math.exp(-0.5 * Math.pow((fl - patientMCV) / patientSD, 2));
    patPoints.push({ x: toX(fl), y: toY(patG * 0.92) });
  }

  // Build SVG path strings
  const patPathD = patPoints.reduce((acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`, '');
  const patAreaD = `${patPathD} L ${toX(maxFL).toFixed(1)},${toY(0).toFixed(1)} L ${toX(minFL).toFixed(1)},${toY(0).toFixed(1)} Z`;

  const refPathD = refPoints.reduce((acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`, '');

  // Vertical threshold lines
  const x80 = toX(80);
  const x100 = toX(100);
  const xPatMCV = toX(Math.max(minFL, Math.min(maxFL, patientMCV)));

  // Accent color based on patient size
  let curveStroke = '#e11d48'; // red
  let curveGradStart = '#fda4af';
  if (data.sizeClassification === 'Normocytic') {
    curveStroke = '#0d9488'; // teal
    curveGradStart = '#99f6e4';
  } else if (data.sizeClassification === 'Macrocytic') {
    curveStroke = '#7c3aed'; // purple
    curveGradStart = '#ddd6fe';
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: block; overflow: visible;">
      <defs>
        <linearGradient id="patGradRBC" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="${curveGradStart}" stop-opacity="0.55" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0.05" />
        </linearGradient>
      </defs>

      <!-- Background Box -->
      <rect x="${padLeft}" y="${padTop}" width="${plotWidth}" height="${plotHeight}" fill="#fcfdfe" rx="4" stroke="#e2e8f0" stroke-width="0.8" />

      <!-- Normocytic Reference Zone (80 to 100 fL) -->
      <rect x="${x80}" y="${padTop}" width="${x100 - x80}" height="${plotHeight}" fill="#f0fdf4" opacity="0.85" />
      <text x="${(x80 + x100) / 2}" y="${padTop + 12}" fill="#166534" font-size="8" font-weight="700" text-anchor="middle">NORMOCYTIC (80-100 fL)</text>

      <!-- Microcytic & Macrocytic Zone Watermarks -->
      <text x="${(padLeft + x80) / 2}" y="${padTop + 12}" fill="#94a3b8" font-size="7.5" font-weight="600" text-anchor="middle">&lt; 80 Micro</text>
      <text x="${(x100 + padLeft + plotWidth) / 2}" y="${padTop + 12}" fill="#94a3b8" font-size="7.5" font-weight="600" text-anchor="middle">&gt; 100 Macro</text>

      <!-- Horizontal gridlines -->
      <line x1="${padLeft}" y1="${toY(0.25)}" x2="${padLeft + plotWidth}" y2="${toY(0.25)}" stroke="#f1f5f9" stroke-width="0.8" stroke-dasharray="3,3" />
      <line x1="${padLeft}" y1="${toY(0.5)}" x2="${padLeft + plotWidth}" y2="${toY(0.5)}" stroke="#f1f5f9" stroke-width="0.8" stroke-dasharray="3,3" />
      <line x1="${padLeft}" y1="${toY(0.75)}" x2="${padLeft + plotWidth}" y2="${toY(0.75)}" stroke="#f1f5f9" stroke-width="0.8" stroke-dasharray="3,3" />

      <!-- Vertical Reference Demarcation Lines (80 & 100 fL) -->
      <line x1="${x80}" y1="${padTop}" x2="${x80}" y2="${padTop + plotHeight}" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="3,2" />
      <line x1="${x100}" y1="${padTop}" x2="${x100}" y2="${padTop + plotHeight}" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="3,2" />

      <!-- Reference Healthy Curve (Dashed Slate) -->
      <path d="${refPathD}" fill="none" stroke="#94a3b8" stroke-width="1.3" stroke-dasharray="3,2.5" />

      <!-- Patient Area & Curve -->
      <path d="${patAreaD}" fill="url(#patGradRBC)" />
      <path d="${patPathD}" fill="none" stroke="${curveStroke}" stroke-width="2.2" stroke-linecap="round" />

      <!-- Patient MCV Marker Line & Pin -->
      <line x1="${xPatMCV}" y1="${padTop + 15}" x2="${xPatMCV}" y2="${padTop + plotHeight}" stroke="${curveStroke}" stroke-width="1.5" stroke-dasharray="2,2" />
      <circle cx="${xPatMCV}" cy="${toY(0.92)}" r="3.5" fill="${curveStroke}" stroke="#ffffff" stroke-width="1.5" />

      <!-- Bottom X-axis Ticks -->
      <line x1="${padLeft}" y1="${padTop + plotHeight}" x2="${padLeft + plotWidth}" y2="${padTop + plotHeight}" stroke="#94a3b8" stroke-width="1" />
      <text x="${toX(50)}" y="${padTop + plotHeight + 11}" fill="#64748b" font-size="8" font-family="'JetBrains Mono', monospace" text-anchor="middle">50</text>
      <text x="${x80}" y="${padTop + plotHeight + 11}" fill="#166534" font-size="8.5" font-weight="700" font-family="'JetBrains Mono', monospace" text-anchor="middle">80</text>
      <text x="${x100}" y="${padTop + plotHeight + 11}" fill="#166534" font-size="8.5" font-weight="700" font-family="'JetBrains Mono', monospace" text-anchor="middle">100</text>
      <text x="${toX(150)}" y="${padTop + plotHeight + 11}" fill="#64748b" font-size="8" font-family="'JetBrains Mono', monospace" text-anchor="middle">150</text>
      <text x="${toX(200)}" y="${padTop + plotHeight + 11}" fill="#64748b" font-size="8" font-family="'JetBrains Mono', monospace" text-anchor="middle">200</text>
      <text x="${padLeft + plotWidth}" y="${padTop + plotHeight + 20}" fill="#475569" font-size="8" font-weight="700" text-anchor="end">Volume (fL)</text>

      <!-- Y-axis Label -->
      <text x="${padLeft - 6}" y="${padTop + 10}" fill="#475569" font-size="8" font-weight="600" text-anchor="end">Relative</text>
      <text x="${padLeft - 6}" y="${padTop + 19}" fill="#475569" font-size="8" font-weight="600" text-anchor="end">Count</text>

      <!-- Header Title & Badges -->
      <text x="${padLeft + 4}" y="${padTop - 8}" fill="#0f172a" font-size="9.5" font-weight="800">RBC SIZE HISTOGRAM (منحنى حجم كرات الدم الحمراء)</text>

      <!-- Legend -->
      <g transform="translate(${padLeft + plotWidth - 140}, ${padTop - 16})">
        <line x1="0" y1="6" x2="14" y2="6" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="2.5,2" />
        <text x="18" y="9" fill="#64748b" font-size="7.5">Normal Ref</text>
        <line x1="72" y1="6" x2="86" y2="6" stroke="${curveStroke}" stroke-width="2" />
        <text x="90" y="9" fill="${curveStroke}" font-size="7.5" font-weight="700">Patient</text>
      </g>

      <!-- Floating Patient MCV / RDW Callout Badge -->
      <g transform="translate(${padLeft + 6}, ${padTop + 24})">
        <rect x="0" y="0" width="112" height="28" fill="#ffffff" rx="4" stroke="${curveStroke}55" stroke-width="1" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.06))" />
        <text x="6" y="11" fill="#0f172a" font-size="8" font-weight="700">MCV: <tspan fill="${curveStroke}" font-weight="800">${patientMCV.toFixed(1)} fL</tspan></text>
        <text x="6" y="22" fill="#475569" font-size="7.5">RDW-CV: <tspan font-weight="700">${patientRDW.toFixed(1)}%</tspan> (${data.anisocytosisGrade})</text>
      </g>
    </svg>
  `.trim();
}

/**
 * Generate Standalone SVG Chart for the Platelet Histogram (منحنى التوزيع الحجمي للصفائح الدموية)
 * Evaluates platelet volume from 2 to 30 fL.
 */
export function generateCbcPltSvgChart(data: CbcExtractedData, width = 340, height = 180): string {
  const padLeft = 38;
  const padRight = 16;
  const padTop = 22;
  const padBottom = 26;
  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;

  const minFL = 2;
  const maxFL = 28;
  const spanFL = maxFL - minFL;

  const toX = (fl: number) => padLeft + ((fl - minFL) / spanFL) * plotWidth;
  const toY = (normY: number) => padTop + (1 - normY) * plotHeight;

  const patientMPV = data.mpv ?? 9.2;
  const patientPLT = data.plt ?? 250;
  const patientSD = 2.4;

  const refMPV = 9.0;
  const refSD = 2.2;

  const step = 0.5;
  const refPoints: { x: number; y: number }[] = [];
  const patPoints: { x: number; y: number }[] = [];

  for (let fl = minFL; fl <= maxFL; fl += step) {
    // Normal skewed distribution
    const refG = Math.exp(-0.5 * Math.pow((fl - refMPV) / refSD, 2));
    refPoints.push({ x: toX(fl), y: toY(refG * 0.85) });

    const patG = Math.exp(-0.5 * Math.pow((fl - patientMPV) / patientSD, 2));
    patPoints.push({ x: toX(fl), y: toY(patG * 0.90) });
  }

  const patPathD = patPoints.reduce((acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`, '');
  const patAreaD = `${patPathD} L ${toX(maxFL).toFixed(1)},${toY(0).toFixed(1)} L ${toX(minFL).toFixed(1)},${toY(0).toFixed(1)} Z`;
  const refPathD = refPoints.reduce((acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`, '');

  const xPatMPV = toX(Math.max(minFL, Math.min(maxFL, patientMPV)));

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: block; overflow: visible;">
      <defs>
        <linearGradient id="patGradPLT" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.55" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0.05" />
        </linearGradient>
      </defs>

      <!-- Background Box -->
      <rect x="${padLeft}" y="${padTop}" width="${plotWidth}" height="${plotHeight}" fill="#fcfdfe" rx="4" stroke="#e2e8f0" stroke-width="0.8" />

      <!-- Reference Normal MPV Zone (7.4 to 10.4 fL) -->
      <rect x="${toX(7.4)}" y="${padTop}" width="${toX(10.4) - toX(7.4)}" height="${plotHeight}" fill="#f0fdf4" opacity="0.8" />
      <text x="${(toX(7.4) + toX(10.4)) / 2}" y="${padTop + 12}" fill="#166534" font-size="7.5" font-weight="700" text-anchor="middle">NORMAL MPV (7.4-10.4)</text>

      <!-- Giant Platelets Warning Area (> 14 fL) -->
      <text x="${toX(20)}" y="${padTop + 12}" fill="#94a3b8" font-size="7" font-weight="600" text-anchor="middle">Giant PLT / Clumps</text>

      <!-- Reference Curve -->
      <path d="${refPathD}" fill="none" stroke="#94a3b8" stroke-width="1.3" stroke-dasharray="3,2.5" />

      <!-- Patient Area & Curve -->
      <path d="${patAreaD}" fill="url(#patGradPLT)" />
      <path d="${patPathD}" fill="none" stroke="#0284c7" stroke-width="2.2" stroke-linecap="round" />

      <!-- MPV Pin -->
      <line x1="${xPatMPV}" y1="${padTop + 15}" x2="${xPatMPV}" y2="${padTop + plotHeight}" stroke="#0284c7" stroke-width="1.5" stroke-dasharray="2,2" />
      <circle cx="${xPatMPV}" cy="${toY(0.90)}" r="3.5" fill="#0284c7" stroke="#ffffff" stroke-width="1.5" />

      <!-- Bottom X-axis Ticks -->
      <line x1="${padLeft}" y1="${padTop + plotHeight}" x2="${padLeft + plotWidth}" y2="${padTop + plotHeight}" stroke="#94a3b8" stroke-width="1" />
      <text x="${toX(5)}" y="${padTop + plotHeight + 11}" fill="#64748b" font-size="8" font-family="'JetBrains Mono', monospace" text-anchor="middle">5</text>
      <text x="${toX(10)}" y="${padTop + plotHeight + 11}" fill="#166534" font-size="8.5" font-weight="700" font-family="'JetBrains Mono', monospace" text-anchor="middle">10</text>
      <text x="${toX(15)}" y="${padTop + plotHeight + 11}" fill="#64748b" font-size="8" font-family="'JetBrains Mono', monospace" text-anchor="middle">15</text>
      <text x="${toX(20)}" y="${padTop + plotHeight + 11}" fill="#64748b" font-size="8" font-family="'JetBrains Mono', monospace" text-anchor="middle">20</text>
      <text x="${padLeft + plotWidth}" y="${padTop + plotHeight + 20}" fill="#475569" font-size="8" font-weight="700" text-anchor="end">Volume (fL)</text>

      <!-- Header Title & Badges -->
      <text x="${padLeft + 4}" y="${padTop - 8}" fill="#0f172a" font-size="9.5" font-weight="800">PLT HISTOGRAM (منحنى الصفائح الدموية)</text>

      <!-- Legend -->
      <g transform="translate(${padLeft + plotWidth - 140}, ${padTop - 16})">
        <line x1="0" y1="6" x2="14" y2="6" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="2.5,2" />
        <text x="18" y="9" fill="#64748b" font-size="7.5">Normal Ref</text>
        <line x1="72" y1="6" x2="86" y2="6" stroke="#0284c7" stroke-width="2" />
        <text x="90" y="9" fill="#0284c7" font-size="7.5" font-weight="700">Patient</text>
      </g>

      <!-- Callout Badge -->
      <g transform="translate(${padLeft + 6}, ${padTop + 24})">
        <rect x="0" y="0" width="115" height="28" fill="#ffffff" rx="4" stroke="#0284c744" stroke-width="1" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.06))" />
        <text x="6" y="11" fill="#0f172a" font-size="8" font-weight="700">PLT: <tspan fill="#0284c7" font-weight="800">${patientPLT.toFixed(0)} ×10⁹/L</tspan></text>
        <text x="6" y="22" fill="#475569" font-size="7.5">MPV: <tspan font-weight="700">${patientMPV.toFixed(1)} fL</tspan></text>
      </g>
    </svg>
  `.trim();
}

/**
 * Generate WBC 5-Part Differential Scatter / Proportional Distribution SVG
 */
export function generateCbcWbcSvgChart(data: CbcExtractedData, width = 680, height = 75): string {
  const padLeft = 40;
  const padRight = 30;
  const barWidth = width - padLeft - padRight;
  const barHeight = 22;
  const barY = 28;

  const neut = data.neutrophils ?? 60;
  const lymph = data.lymphocytes ?? 30;
  const mono = data.monocytes ?? 6;
  const eos = data.eosinophils ?? 3;
  const baso = data.basophils ?? 1;

  const total = neut + lymph + mono + eos + baso || 100;

  const pNeut = (neut / total) * barWidth;
  const pLymph = (lymph / total) * barWidth;
  const pMono = (mono / total) * barWidth;
  const pEos = (eos / total) * barWidth;
  const pBaso = (baso / total) * barWidth;

  const xNeut = padLeft;
  const xLymph = xNeut + pNeut;
  const xMono = xLymph + pLymph;
  const xEos = xMono + pMono;
  const xBaso = xEos + pEos;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: block;">
      <text x="${padLeft}" y="16" fill="#0f172a" font-size="9.5" font-weight="800">WBC 5-PART DIFFERENTIAL DISTRIBUTION (توزيع كرات الدم البيضاء التفريقي)</text>
      <text x="${padLeft + barWidth}" y="16" fill="#475569" font-size="8.5" font-weight="700" text-anchor="end">Total WBC: ${data.wbc ? `${data.wbc.toFixed(1)} ×10⁹/L` : '—'}</text>

      <!-- Stacked Differential Bar -->
      <g rx="6" overflow="hidden">
        <rect x="${xNeut}" y="${barY}" width="${pNeut}" height="${barHeight}" fill="#3b82f6" />
        <rect x="${xLymph}" y="${barY}" width="${pLymph}" height="${barHeight}" fill="#10b981" />
        <rect x="${xMono}" y="${barY}" width="${pMono}" height="${barHeight}" fill="#f59e0b" />
        <rect x="${xEos}" y="${barY}" width="${pEos}" height="${barHeight}" fill="#ec4899" />
        <rect x="${xBaso}" y="${barY}" width="${pBaso}" height="${barHeight}" fill="#8b5cf6" />
      </g>

      <!-- Bar Outline -->
      <rect x="${padLeft}" y="${barY}" width="${barWidth}" height="${barHeight}" fill="none" stroke="#cbd5e1" stroke-width="1" rx="4" />

      <!-- Labels & Percentages below -->
      <g transform="translate(0, ${barY + barHeight + 14})">
        <circle cx="${padLeft + 6}" cy="-4" r="3" fill="#3b82f6" />
        <text x="${padLeft + 13}" y="0" fill="#1e293b" font-size="8" font-weight="700">NEUT <tspan font-weight="800">${neut.toFixed(1)}%</tspan> <tspan fill="#64748b" font-size="7">(40-75%)</tspan></text>

        <circle cx="${padLeft + 150}" cy="-4" r="3" fill="#10b981" />
        <text x="${padLeft + 157}" y="0" fill="#1e293b" font-size="8" font-weight="700">LYMPH <tspan font-weight="800">${lymph.toFixed(1)}%</tspan> <tspan fill="#64748b" font-size="7">(20-45%)</tspan></text>

        <circle cx="${padLeft + 295}" cy="-4" r="3" fill="#f59e0b" />
        <text x="${padLeft + 302}" y="0" fill="#1e293b" font-size="8" font-weight="700">MONO <tspan font-weight="800">${mono.toFixed(1)}%</tspan> <tspan fill="#64748b" font-size="7">(2-10%)</tspan></text>

        <circle cx="${padLeft + 430}" cy="-4" r="3" fill="#ec4899" />
        <text x="${padLeft + 437}" y="0" fill="#1e293b" font-size="8" font-weight="700">EOS <tspan font-weight="800">${eos.toFixed(1)}%</tspan> <tspan fill="#64748b" font-size="7">(1-6%)</tspan></text>

        <circle cx="${padLeft + 545}" cy="-4" r="3" fill="#8b5cf6" />
        <text x="${padLeft + 552}" y="0" fill="#1e293b" font-size="8" font-weight="700">BASO <tspan font-weight="800">${baso.toFixed(1)}%</tspan> <tspan fill="#64748b" font-size="7">(0-2%)</tspan></text>
      </g>
    </svg>
  `.trim();
}

/**
 * Generate Complete Unified CBC Histogram Panel SVG
 * Includes RBC Histogram (حجم كرات الدم) + PLT Histogram + WBC Differential in a side-by-side or stacked grid.
 */
export function generateCbcUnifiedSvgCharts(data: CbcExtractedData, totalWidth = 680): string {
  const halfWidth = Math.floor((totalWidth - 14) / 2);
  const rbcSvg = generateCbcRbcSvgChart(data, halfWidth, 165);
  const pltSvg = generateCbcPltSvgChart(data, halfWidth, 165);
  const wbcSvg = generateCbcWbcSvgChart(data, totalWidth, 64);

  return `
    <div style="display: flex; flex-direction: column; gap: 4px; width: 100%;">
      <div style="display: flex; justify-content: space-between; gap: 10px; width: 100%;">
        <div style="flex: 1; min-width: 0;">${rbcSvg}</div>
        <div style="flex: 1; min-width: 0;">${pltSvg}</div>
      </div>
      <div style="width: 100%; margin-top: 2px;">
        ${wbcSvg}
      </div>
    </div>
  `.trim();
}

/**
 * Generate CBC Morphology and Shape Protocol HTML (حجم وشكل كرات الدم ومؤشرات الأنيميا)
 * Single source of truth for both Web preview and printed PDF reports.
 */
export function generateCbcMorphologyBlockHtml(data: CbcExtractedData): string {
  const mentzerBadge =
    data.mentzerIndex !== null
      ? `<span style="background: ${data.mentzerIndex < 13 ? '#0284c7' : '#e11d48'}; color: #fff; padding: 1px 6px; border-radius: 3px; font-weight: 800; font-family: monospace;">Mentzer: ${data.mentzerIndex} (${data.mentzerIndex < 13 ? '< 13 Thalassemia Trait' : '> 13 IDA'})</span>`
      : '';

  return `
    <div style="background: #f8fafc; border: 1.2px solid #cbd5e1; border-radius: 6px; padding: 2.5mm 3.5mm; margin-top: 2.5mm; margin-bottom: 2mm; page-break-inside: avoid;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 1.5mm; margin-bottom: 1.5mm;">
        <div style="font-size: 9.5px; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 6px;">
          <span>🔬 PERIPHERAL ERYTHROCYTE MORPHOLOGY & INDICES (حجم وشكل كرات الدم الحمراء والمؤشرات):</span>
          ${mentzerBadge}
        </div>
        <div style="font-size: 8.5px; font-weight: 700; color: #334155;">
          ${data.bessmanCategoryEn}
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 2.5mm; font-size: 8.5px; line-height: 1.4;">
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 4px; padding: 2mm;">
          <div style="font-weight: 800; color: #475569; font-size: 8px;">1. RBC SIZE (حجم الكرات):</div>
          <div style="font-weight: 800; color: ${data.sizeColor}; font-size: 9px; margin-top: 0.5mm;">
            ${data.sizeClassification} • ${data.sizeClassificationAr}
          </div>
          <div style="color: #64748b; font-size: 7.5px; margin-top: 0.5mm;">MCV: ${data.mcv ? `${data.mcv} fL (Ref: 80-100)` : '—'}</div>
        </div>

        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 4px; padding: 2mm;">
          <div style="font-weight: 800; color: #475569; font-size: 8px;">2. ANISOCYTOSIS / RDW (تجانس الحجم):</div>
          <div style="font-weight: 800; color: ${data.anisocytosisGrade === 'Normal' ? '#059669' : '#d97706'}; font-size: 9px; margin-top: 0.5mm;">
            ${data.anisocytosisGrade} • ${data.anisocytosisAr}
          </div>
          <div style="color: #64748b; font-size: 7.5px; margin-top: 0.5mm;">RDW-CV: ${data.rdw ? `${data.rdw}% (Ref: 11.5-14.5%)` : '—'}</div>
        </div>

        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 4px; padding: 2mm;">
          <div style="font-weight: 800; color: #475569; font-size: 8px;">3. CHROMIA (محتوى الهيموجلوبين):</div>
          <div style="font-weight: 800; color: #0284c7; font-size: 9px; margin-top: 0.5mm;">
            ${data.chromiaClassification} • ${data.chromiaAr}
          </div>
          <div style="color: #64748b; font-size: 7.5px; margin-top: 0.5mm;">MCH: ${data.mch ? `${data.mch} pg` : '—'} | MCHC: ${data.mchc ? `${data.mchc} g/dL` : '—'}</div>
        </div>
      </div>

      <!-- Clinical Diagnostic Correlation Summary -->
      <div style="background: #f1f5f9; border-radius: 4px; padding: 1.8mm 2.5mm; margin-top: 1.8mm; font-size: 8px; color: #1e293b; line-height: 1.45;">
        <span style="font-weight: 800; color: #0f172a;">💡 Clinical Diagnostic Guidance (التوجيه السريري للمنحنى): </span>
        <span>${data.differentialDiagnosisEn} • <b>${data.differentialDiagnosisAr}</b></span>
      </div>
    </div>
  `.trim();
}
