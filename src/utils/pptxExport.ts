import pptxgen from 'pptxgenjs';
import { LabReport, LabInfo, TestParameter, TestProfile } from '../types/lab';
import { formatReferenceDisplay } from './cbcCalculator';
import { formatGenderEn } from './calculator';
import { DEFAULT_STAFF } from '../data/labCatalog';
import { DISEASE_ILLUSTRATIONS } from '../data/diseaseIllustrations';
import { resolveHandwrittenSignatureSrc } from '../assets/signatureImages';
import { isOgttProfile, extractOgttData, generateOgttSvgChart } from './ogttEngine';
import { isCBCProfile, extractCBCData, generateCbcRbcSvgChart, generateCbcPltSvgChart } from './cbcEngine';
import {
  BRAND,
  cleanInvestigationName,
  getPersistedGlobalStaffSignatures,
  isLipidProfile,
  isLiverProfile,
  isKidneyProfile,
  isDiabetesProfile,
  isThyroidProfile,
  latin,
  resolveActiveSignatureBlocks
} from './reportTemplate';
import { reportFileName } from './pdfExport';

const RED = '881337';
const RED_DARK = '4C0519';
const RED_SOFT = 'FFF1F2';
const NAVY = '0F172A';
const NAVY_HEADER = '0E2747';
const BLUE = '1E3A8A';
const SOFT = 'F8FAFC';
const INK = '0F172A';
const MUTED = '64748B';
const BORDER = 'CBD5E1';
const LINE = 'E2E8F0';
const HIGH_COL = 'B91C1C';
const LOW_COL = '1E40AF';
const CRITICAL_BG = '991B1B';
const FONT_EN = 'Segoe UI';
const FONT_MONO = 'Consolas';
const FONT_AR = 'Arial';

const PAGE_W = 8.27;
const PAGE_H = 11.69;
const MARGIN_X = 0.44;
const USABLE_W = PAGE_W - MARGIN_X * 2; // 7.39 in

const ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;

function hasArabic(text?: string | null): boolean {
  return Boolean(text && ARABIC_REGEX.test(text));
}

function fmtDate(d?: string): string {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  const date = dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${date} ${time}`;
}

function ageText(age: number, unit: string): string {
  const u = unit === 'years' ? 'Yrs' : unit === 'months' ? 'Mths' : 'Days';
  return `${age} ${u}`;
}

/** High-DPI inline SVG -> PNG Data URL converter for lossless crisp PowerPoint embedding */
async function svgMarkupToPngDataUrl(svgString: string, widthPx: number, heightPx: number): Promise<string | null> {
  if (typeof document === 'undefined') return null;
  return new Promise(resolve => {
    try {
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      const timeout = setTimeout(() => {
        URL.revokeObjectURL(url);
        resolve(null);
      }, 2500);
      img.onload = () => {
        clearTimeout(timeout);
        try {
          const scale = 2.5;
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(widthPx * scale);
          canvas.height = Math.round(heightPx * scale);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.scale(scale, scale);
            ctx.drawImage(img, 0, 0, widthPx, heightPx);
            const png = canvas.toDataURL('image/png');
            URL.revokeObjectURL(url);
            resolve(png);
            return;
          }
        } catch {
          // ignore
        }
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.onerror = () => {
        clearTimeout(timeout);
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.src = url;
    } catch {
      resolve(null);
    }
  });
}

/** Ensures signature or atlas image src resolves to a PNG/JPEG data URI supported by PptxGenJS */
async function ensureRasterDataUrl(src?: string | null): Promise<string | null> {
  if (!src) return null;
  if (src.startsWith('data:image/png') || src.startsWith('data:image/jpeg') || src.startsWith('data:image/jpg')) {
    return src;
  }
  if (src.startsWith('data:image/svg+xml')) {
    return new Promise(resolve => {
      const img = new Image();
      const timeout = setTimeout(() => resolve(null), 2000);
      img.onload = () => {
        clearTimeout(timeout);
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || 320;
          canvas.height = img.naturalHeight || 160;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/png'));
            return;
          }
        } catch {}
        resolve(null);
      };
      img.onerror = () => {
        clearTimeout(timeout);
        resolve(null);
      };
      img.src = src;
    });
  }
  if (typeof document === 'undefined') return null;
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timeout = setTimeout(() => resolve(null), 2500);
    img.onload = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 400;
        canvas.height = img.naturalHeight || 240;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/png'));
          return;
        }
      } catch {}
      resolve(null);
    };
    img.onerror = () => {
      clearTimeout(timeout);
      resolve(null);
    };
    img.src = src;
  });
}

function buildShieldLogoSvg(): string {
  return `<svg width="160" height="160" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="rtShieldGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#881337"/>
        <stop offset="60%" stop-color="#4c0519"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
      <linearGradient id="rtAccentGrad" x1="0" y1="0" x2="64" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#fb7185"/>
        <stop offset="100%" stop-color="#38bdf8"/>
      </linearGradient>
    </defs>
    <path d="M32 3 L55 11 V29 C55 43.5 44.5 56.5 32 61 C19.5 56.5 9 43.5 9 29 V11 L32 3 Z" fill="url(#rtShieldGrad)" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.35"/>
    <path d="M32 6 L51 13 V28 C51 40.5 42 52 32 56 C22 52 13 40.5 13 28 V13 L32 6 Z" stroke="url(#rtAccentGrad)" stroke-width="1.1" stroke-opacity="0.7"/>
    <text x="32" y="36" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900" font-size="21" fill="#ffffff">RT</text>
    <rect x="23" y="42" width="18" height="2.5" rx="1.25" fill="#38bdf8"/>
    <rect x="29" y="39.5" width="6" height="7.5" rx="1" fill="#fb7185"/>
    <circle cx="32" cy="14" r="2.5" fill="#38bdf8"/>
  </svg>`;
}

function buildVisualGaugeRuns(param: TestParameter, fontSize: number): any[] {
  const num = parseFloat(String(param.result ?? '').replace(/[^\d.-]/g, ''));
  if (isNaN(num) || param.minNormal === undefined || param.maxNormal === undefined) {
    return [{ text: '—', options: { fontSize, color: MUTED, fontFace: FONT_EN } }];
  }

  const min = param.minNormal;
  const max = param.maxNormal;
  let pct = 50;
  if (num < min) {
    const r = min * 0.5 || 1;
    pct = Math.max(5, 25 - ((min - num) / r) * 20);
  } else if (num > max) {
    const r = max * 0.5 || 1;
    pct = Math.min(95, 75 + ((num - max) / r) * 20);
  } else {
    const span = max - min || 1;
    pct = 25 + ((num - min) / span) * 50;
  }

  const slots = 10;
  const pinIdx = Math.min(slots - 1, Math.max(0, Math.round((pct / 100) * (slots - 1))));
  const pinColor = num < min ? 'D97706' : num > max ? 'DC2626' : '16A34A';

  const runs: any[] = [];
  for (let i = 0; i < slots; i++) {
    const segColor = i < 3 ? 'FDBA74' : i <= 6 ? '4ADE80' : 'F87171';
    if (i === pinIdx) {
      runs.push({ text: '●', options: { color: pinColor, bold: true, fontSize: fontSize + 1, fontFace: FONT_EN } });
    } else {
      runs.push({ text: '▬', options: { color: segColor, fontSize: Math.max(6, fontSize - 1), fontFace: FONT_EN } });
    }
  }
  runs.push({
    text: `\n${min}   -   ${max}`,
    options: { color: MUTED, fontSize: Math.max(5.5, fontSize - 1.5), fontFace: FONT_EN }
  });
  return runs;
}

function getProfileSummaryHighlights(profile: TestProfile): Array<{ label: string; value: string; status: string; color: string; bg: string }> {
  const numOf = (keys: string[]): number | null => {
    const p = profile.parameters.find(param => {
      const n = (param.name || '').toLowerCase();
      return keys.some(k => n.includes(k));
    });
    if (!p || !p.result) return null;
    const v = parseFloat(String(p.result).replace(/[^\d.-]/g, ''));
    return isNaN(v) ? null : v;
  };

  if (isLipidProfile(profile)) {
    const tc = numOf(['total cholesterol', 'cholesterol total']);
    const ldl = numOf(['ldl']);
    const hdl = numOf(['hdl']);
    const tg = numOf(['triglyceride']);
    const ratio = tc !== null && hdl ? +(tc / hdl).toFixed(2) : null;
    return [
      { label: 'TC/HDL Risk Ratio', value: ratio !== null ? `${ratio}` : '—', status: ratio !== null ? (ratio < 3.5 ? 'Optimal' : ratio <= 5 ? 'Moderate' : 'High') : 'Pending', color: ratio && ratio > 5 ? HIGH_COL : '15803D', bg: ratio && ratio > 5 ? 'FEE2E2' : 'DCFCE7' },
      { label: 'Total Cholesterol', value: tc !== null ? `${tc} mg/dL` : '—', status: tc !== null ? (tc < 200 ? 'Desirable' : 'Elevated') : '—', color: tc && tc >= 200 ? HIGH_COL : '15803D', bg: tc && tc >= 200 ? 'FEE2E2' : 'DCFCE7' },
      { label: 'LDL-C (Atherogenic)', value: ldl !== null ? `${ldl} mg/dL` : '—', status: ldl !== null ? (ldl < 100 ? 'Optimal' : 'Elevated') : '—', color: ldl && ldl >= 130 ? HIGH_COL : '15803D', bg: ldl && ldl >= 130 ? 'FEE2E2' : 'DCFCE7' },
      { label: 'HDL-C (Protective)', value: hdl !== null ? `${hdl} mg/dL` : '—', status: hdl !== null ? (hdl >= 40 ? 'Protective' : 'Low') : '—', color: hdl && hdl < 40 ? LOW_COL : '15803D', bg: hdl && hdl < 40 ? 'DBEAFE' : 'DCFCE7' },
      ...(tg !== null ? [{ label: 'Triglycerides', value: `${tg} mg/dL`, status: tg < 150 ? 'Normal' : 'High', color: tg >= 150 ? HIGH_COL : '15803D', bg: tg >= 150 ? 'FEE2E2' : 'DCFCE7' }] : [])
    ].slice(0, 4);
  }

  if (isLiverProfile(profile)) {
    const ast = numOf(['ast', 'sgot']);
    const alt = numOf(['alt', 'sgpt']);
    const bil = numOf(['total bilirubin']);
    const alb = numOf(['albumin']);
    const ratio = ast !== null && alt ? +(ast / alt).toFixed(2) : null;
    return [
      { label: 'De Ritis (AST/ALT)', value: ratio !== null ? `${ratio}` : '—', status: ratio !== null ? (ratio <= 1.2 ? 'Normal' : 'Elevated') : '—', color: BLUE, bg: 'EFF6FF' },
      { label: 'ALT (SGPT)', value: alt !== null ? `${alt} U/L` : '—', status: alt !== null ? (alt <= 41 ? 'Normal' : 'High') : '—', color: alt && alt > 41 ? HIGH_COL : '15803D', bg: alt && alt > 41 ? 'FEE2E2' : 'DCFCE7' },
      { label: 'Total Bilirubin', value: bil !== null ? `${bil} mg/dL` : '—', status: bil !== null ? (bil <= 1.2 ? 'Normal' : 'Elevated') : '—', color: bil && bil > 1.2 ? HIGH_COL : '15803D', bg: bil && bil > 1.2 ? 'FEE2E2' : 'DCFCE7' },
      { label: 'Serum Albumin', value: alb !== null ? `${alb} g/dL` : '—', status: alb !== null ? (alb >= 3.5 ? 'Adequate' : 'Low') : '—', color: alb && alb < 3.5 ? LOW_COL : '15803D', bg: alb && alb < 3.5 ? 'DBEAFE' : 'DCFCE7' }
    ];
  }

  if (isKidneyProfile(profile)) {
    const cr = numOf(['creatinine']);
    const bun = numOf(['urea', 'bun']);
    const ua = numOf(['uric acid']);
    const egfr = numOf(['egfr']);
    return [
      { label: 'Creatinine', value: cr !== null ? `${cr} mg/dL` : '—', status: cr !== null ? (cr <= 1.3 ? 'Normal' : 'High') : '—', color: cr && cr > 1.3 ? HIGH_COL : '15803D', bg: cr && cr > 1.3 ? 'FEE2E2' : 'DCFCE7' },
      { label: 'eGFR Function', value: egfr !== null ? `${egfr}` : '—', status: egfr !== null ? (egfr >= 90 ? 'G1 Normal' : egfr >= 60 ? 'G2 Mild' : 'Impaired') : 'Calc', color: egfr && egfr < 60 ? HIGH_COL : BLUE, bg: egfr && egfr < 60 ? 'FEE2E2' : 'EFF6FF' },
      { label: 'Urea / BUN', value: bun !== null ? `${bun} mg/dL` : '—', status: bun !== null ? (bun <= 45 ? 'Normal' : 'Elevated') : '—', color: bun && bun > 45 ? HIGH_COL : '15803D', bg: bun && bun > 45 ? 'FEE2E2' : 'DCFCE7' },
      { label: 'Uric Acid', value: ua !== null ? `${ua} mg/dL` : '—', status: ua !== null ? (ua <= 7.0 ? 'Normal' : 'High') : '—', color: ua && ua > 7.0 ? HIGH_COL : '15803D', bg: ua && ua > 7.0 ? 'FEE2E2' : 'DCFCE7' }
    ];
  }

  if (isDiabetesProfile(profile)) {
    const fbg = numOf(['fasting', 'fbs']);
    const hba1c = numOf(['hba1c', 'a1c']);
    const ppg = numOf(['post', '2h', 'ppbs']);
    return [
      { label: 'HbA1c (3-Mo Avg)', value: hba1c !== null ? `${hba1c}%` : '—', status: hba1c !== null ? (hba1c < 5.7 ? 'Normal' : hba1c < 6.5 ? 'Prediabetes' : 'Diabetic') : '—', color: hba1c && hba1c >= 6.5 ? HIGH_COL : hba1c && hba1c >= 5.7 ? 'B45309' : '15803D', bg: hba1c && hba1c >= 6.5 ? 'FEE2E2' : hba1c && hba1c >= 5.7 ? 'FEF3C7' : 'DCFCE7' },
      { label: 'Fasting Glucose', value: fbg !== null ? `${fbg} mg/dL` : '—', status: fbg !== null ? (fbg < 100 ? 'Normal' : fbg < 126 ? 'IFG' : 'Diabetic') : '—', color: fbg && fbg >= 126 ? HIGH_COL : fbg && fbg >= 100 ? 'B45309' : '15803D', bg: fbg && fbg >= 126 ? 'FEE2E2' : 'DCFCE7' },
      { label: '2h Post-Prandial', value: ppg !== null ? `${ppg} mg/dL` : '—', status: ppg !== null ? (ppg < 140 ? 'Normal' : ppg < 200 ? 'IGT' : 'Diabetic') : '—', color: ppg && ppg >= 200 ? HIGH_COL : '15803D', bg: ppg && ppg >= 200 ? 'FEE2E2' : 'DCFCE7' }
    ];
  }

  if (isThyroidProfile(profile)) {
    const tsh = numOf(['tsh']);
    const ft4 = numOf(['ft4', 'free t4']);
    const ft3 = numOf(['ft3', 'free t3']);
    return [
      { label: 'TSH (Pituitary Axis)', value: tsh !== null ? `${tsh}` : '—', status: tsh !== null ? (tsh < 0.4 ? 'Low' : tsh > 4.2 ? 'High' : 'Euthyroid') : '—', color: tsh && (tsh < 0.4 || tsh > 4.2) ? HIGH_COL : '15803D', bg: tsh && (tsh < 0.4 || tsh > 4.2) ? 'FEE2E2' : 'DCFCE7' },
      { label: 'Free T4', value: ft4 !== null ? `${ft4}` : '—', status: ft4 !== null ? 'Assayed' : '—', color: BLUE, bg: 'EFF6FF' },
      { label: 'Free T3', value: ft3 !== null ? `${ft3}` : '—', status: ft3 !== null ? 'Assayed' : '—', color: BLUE, bg: 'EFF6FF' }
    ];
  }

  return [];
}

/**
 * Exports a genuine A4-portrait PowerPoint presentation (.pptx) with 1 A4 page/slide per profile,
 * mirroring the PDF report layout: RT Logo SVG, full clinical header, patient demographics,
 * results table with full multi-value references & visual gauges, diagnostic curves/charts,
 * blood film, clinical notes/atlas/recommendations, RTL handwritten signatures & stamp, and footer.
 */
export async function exportReportToPPTX(
  report: LabReport,
  labInfo?: LabInfo,
  showVisualChart: boolean = true
): Promise<void> {
  const nowIso = new Date().toISOString();
  const persistedS = getPersistedGlobalStaffSignatures();
  const safeReport: LabReport = {
    ...report,
    patient: {
      ...report.patient,
      sampleDate: report.patient?.sampleDate || report.createdAt || nowIso,
      reportingDate: report.patient?.reportingDate || nowIso
    },
    staff: {
      ...DEFAULT_STAFF,
      ...persistedS,
      ...(labInfo as any)?.staffSignatures,
      ...report.staff
    }
  };

  const pptx = new pptxgen();
  pptx.defineLayout({ name: 'A4_PORTRAIT', width: PAGE_W, height: PAGE_H });
  pptx.layout = 'A4_PORTRAIT';

  const labName = latin(labInfo?.labNameEn, 'RT Diagnostic Laboratories');
  const supervision = latin(labInfo?.supervisionEn, 'Kasr Al Ainy Faculty of Medicine Consultants');
  const address = latin(labInfo?.mainAddress, 'Behteem Square, El-Ezaby Tower, 3rd Floor, Shubra El-Kheima');
  const phone = [labInfo?.phone, labInfo?.hotline].filter(Boolean).join('  |  ');

  pptx.author = labName;
  pptx.company = labName;
  pptx.title = `Lab Report - ${safeReport.patient.fullName}`;

  // Pre-rasterize RT Shield Logo PNG once
  const logoPng = await svgMarkupToPngDataUrl(buildShieldLogoSvg(), 160, 160);

  // Pre-rasterize active handwritten signature PNGs once
  const sigBlocks = resolveActiveSignatureBlocks(safeReport, labInfo);
  const sigPngMap = new Map<number, string>();
  await Promise.all(
    sigBlocks.map(async (b, i) => {
      const src = resolveHandwrittenSignatureSrc(b.name, b.signatureKey);
      if (src) {
        const png = await ensureRasterDataUrl(src);
        if (png) sigPngMap.set(i, png);
      }
    })
  );

  const p = safeReport.patient;
  const repStaff = safeReport.staff || {};
  const labStaff = (labInfo as any)?.staffSignatures || {};
  const doctor =
    p.referringDoctorTitle === 'Herself' || p.referringDoctorTitle === 'Himself'
      ? 'Self request'
      : latin(`${p.referringDoctorTitle || ''} ${p.referringDoctorName || ''}`, 'Self request');
  const diagnosis = latin(p.clinicalDiagnosis || p.clinicalHistory || '');
  const phlebVal =
    repStaff.phlebotomist !== undefined
      ? repStaff.phlebotomist
      : (p.phlebotomist || labStaff.phlebotomist || persistedS.phlebotomist || DEFAULT_STAFF.phlebotomist || '');
  const visitVal =
    repStaff.visitCoordinator !== undefined
      ? repStaff.visitCoordinator
      : (p.visitSpecialist || p.branchRepresentative || labStaff.visitCoordinator || persistedS.visitCoordinator || DEFAULT_STAFF.visitCoordinator || '');
  const showPhleb = repStaff.showPhlebotomist !== false && Boolean(String(phlebVal || '').trim());
  const showVisit = repStaff.showVisitCoordinator !== false && Boolean(String(visitVal || '').trim());

  const totalPages = safeReport.profiles.length || 1;
  const profilesToRender: TestProfile[] = safeReport.profiles.length
    ? safeReport.profiles
    : [{
        id: 'empty-profile',
        profileCode: 'LAB',
        titleEn: 'Laboratory Diagnostic Report',
        titleAr: 'التقرير المعملي',
        sampleType: 'Serum',
        category: 'General',
        parameters: []
      }];

  for (let idx = 0; idx < profilesToRender.length; idx++) {
    const profile = profilesToRender[idx];
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };

    // 1. Top Dual-Tone Clinical Bar (mirrors .rt-topbar)
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: PAGE_W * 0.45, h: 0.13, fill: { color: RED }, line: { color: RED, width: 0 } });
    slide.addShape(pptx.ShapeType.rect, { x: PAGE_W * 0.45, y: 0, w: PAGE_W * 0.55, h: 0.13, fill: { color: BLUE }, line: { color: BLUE, width: 0 } });

    // 2. Official Clinical Header (Logo + Lab Name + Contacts)
    if (logoPng) {
      slide.addImage({ data: logoPng, x: MARGIN_X, y: 0.21, w: 0.62, h: 0.62 });
    }
    const brandTextX = logoPng ? MARGIN_X + 0.72 : MARGIN_X;
    slide.addText(labName, {
      x: brandTextX, y: 0.20, w: 3.7, h: 0.28,
      fontSize: 13.5, bold: true, color: RED, fontFace: FONT_EN, margin: 0, valign: 'middle'
    });
    slide.addText(supervision.toUpperCase(), {
      x: brandTextX, y: 0.48, w: 3.7, h: 0.18,
      fontSize: 7.5, bold: true, color: BLUE, fontFace: FONT_EN, margin: 0
    });
    slide.addText('Clinical Pathology & Diagnostic Laboratory Services', {
      x: brandTextX, y: 0.65, w: 3.7, h: 0.16,
      fontSize: 7, color: MUTED, fontFace: FONT_EN, margin: 0
    });

    const contactLines: any[] = [
      { text: `${address}\n`, options: { fontSize: 7.3, color: MUTED } },
      ...(phone ? [
        { text: 'Emergency Tel: ', options: { fontSize: 7.3, bold: true, color: NAVY } },
        { text: `${phone}\n`, options: { fontSize: 7.3, color: MUTED } }
      ] : []),
      { text: 'Accreditation: ', options: { fontSize: 7.3, bold: true, color: NAVY } },
      { text: 'ISO 15189 Aligned', options: { fontSize: 7.3, color: MUTED } }
    ];
    slide.addText(contactLines, {
      x: PAGE_W - MARGIN_X - 2.95, y: 0.21, w: 2.95, h: 0.62,
      align: 'right', valign: 'middle', fontFace: FONT_EN, margin: 0, lineSpacingMultiple: 1.25
    });

    // Header Bottom Border
    slide.addShape(pptx.ShapeType.line, {
      x: MARGIN_X, y: 0.89, w: USABLE_W, h: 0,
      line: { color: NAVY, width: 1.5 }
    });

    // 3. Patient Demographics Box
    const hasRow3 = showPhleb || showVisit || Boolean(diagnosis);
    const patBoxY = 0.96;
    const patBoxH = hasRow3 ? 1.16 : 0.78;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: MARGIN_X, y: patBoxY, w: USABLE_W, h: patBoxH,
      fill: { color: SOFT }, line: { color: LINE, width: 0.75 }, rectRadius: 0.06
    });
    slide.addShape(pptx.ShapeType.rect, {
      x: MARGIN_X, y: patBoxY, w: 0.055, h: patBoxH,
      fill: { color: RED }, line: { color: RED, width: 0 }
    });

    const addPatField = (label: string, val: string, x: number, y: number, w: number, isName = false, isAr = false, isDiag = false) => {
      const ar = isAr || hasArabic(val);
      slide.addText(isAr ? label : label.toUpperCase(), {
        x, y, w, h: 0.14,
        fontSize: isAr ? 7.2 : 6.6,
        bold: true,
        color: isAr ? BLUE : MUTED,
        fontFace: isAr ? FONT_AR : FONT_EN,
        rtlMode: isAr,
        align: isAr ? 'right' : 'left',
        margin: 0
      });
      slide.addText(val || '—', {
        x, y: y + 0.13, w, h: 0.21,
        fontSize: isName ? 10 : 8.5,
        bold: isName || isDiag || ar,
        color: isDiag ? RED : isName ? NAVY : INK,
        fontFace: ar ? FONT_AR : FONT_EN,
        rtlMode: ar,
        align: ar && isAr ? 'right' : 'left',
        margin: 0
      });
    };

    const col1X = MARGIN_X + 0.14;
    const col3X = MARGIN_X + 3.85;
    const col4X = MARGIN_X + 5.65;
    addPatField('Patient Name', p.fullName || 'Patient', col1X, patBoxY + 0.06, 3.6, true);
    addPatField('Lab / Reg No.', p.labNumber || '—', col3X, patBoxY + 0.06, 1.7);
    addPatField('Age / Gender', `${ageText(p.age, p.ageUnit)} / ${formatGenderEn(p.gender)}`, col4X, patBoxY + 0.06, 1.65);

    addPatField('Collected', fmtDate(p.sampleDate || safeReport.createdAt), col1X, patBoxY + 0.42, 1.8);
    addPatField('Reported', fmtDate(p.reportingDate), col1X + 1.85, patBoxY + 0.42, 1.8);
    addPatField('Referred By', doctor, col3X, patBoxY + 0.42, 3.4);

    if (hasRow3) {
      let rx = col1X;
      if (showPhleb) {
        addPatField('القائم بالسحب', String(phlebVal), rx, patBoxY + 0.78, 1.75, false, true);
        rx += 1.85;
      }
      if (showVisit) {
        addPatField('مسؤول الزيارة', String(visitVal), rx, patBoxY + 0.78, 1.75, false, true);
        rx += 1.85;
      }
      if (diagnosis) {
        addPatField('Clinical Diagnosis / Indication', diagnosis, rx, patBoxY + 0.78, Math.max(2.0, MARGIN_X + USABLE_W - rx - 0.1), false, false, true);
      }
    }

    // 4. Profile Title + Specimen Bar
    let cursorY = patBoxY + patBoxH + 0.08;
    const titleBarH = 0.28;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: MARGIN_X, y: cursorY, w: USABLE_W, h: titleBarH,
      fill: { color: 'F1F5F9' }, line: { color: 'F1F5F9', width: 0 }, rectRadius: 0.04
    });
    slide.addShape(pptx.ShapeType.rect, {
      x: MARGIN_X, y: cursorY, w: 0.045, h: titleBarH,
      fill: { color: BLUE }, line: { color: BLUE, width: 0 }
    });
    slide.addText(latin(profile.titleEn, profile.titleAr || 'Laboratory Diagnostic Report'), {
      x: MARGIN_X + 0.12, y: cursorY, w: 4.9, h: titleBarH,
      fontSize: 9.8, bold: true, color: NAVY, fontFace: FONT_EN, valign: 'middle', margin: 0
    });
    slide.addText(`Specimen: ${latin(profile.sampleType, 'Serum / Whole Blood')}`, {
      x: MARGIN_X + 5.0, y: cursorY, w: USABLE_W - 5.1, h: titleBarH,
      fontSize: 8, bold: true, color: MUTED, fontFace: FONT_EN, align: 'right', valign: 'middle', margin: 0
    });
    cursorY += titleBarH + 0.07;

    // 5. Compute Remaining Space Budget so Table + Clinical Extras + Signatures + Footer stay inside 1 A4 Slide!
    const hasSignatures = sigBlocks.length > 0;
    const footerTopY = 11.12;
    const sigReserveH = hasSignatures ? (sigBlocks.some(b => b.isConsultant) ? 1.48 : 1.18) : 0;
    const sigTopY = footerTopY - sigReserveH - 0.06;
    const availableMiddleH = Math.max(3.0, sigTopY - cursorY);

    // Collect clinical bottom panels for this slide
    const allInterpretations: string[] = [];
    if (profile.interpretation?.trim()) allInterpretations.push(profile.interpretation.trim());
    if (Array.isArray(profile.interpretations)) {
      profile.interpretations.forEach(t => { if (t?.trim() && !allInterpretations.includes(t.trim())) allInterpretations.push(t.trim()); });
    }
    const allComments: string[] = [];
    if (profile.comment?.trim()) allComments.push(profile.comment.trim());
    if (Array.isArray(profile.comments)) {
      profile.comments.forEach(t => { if (t?.trim() && !allComments.includes(t.trim())) allComments.push(t.trim()); });
    }
    const general = idx === profilesToRender.length - 1 ? latin(safeReport.generalComment) : '';
    const bf = profile.bloodFilmFindings;
    const illustration = profile.attachedIllustration ||
      (profile.selectedIllustrationId ? DISEASE_ILLUSTRATIONS.find(d => d.id === profile.selectedIllustrationId) : undefined);
    const recommendedTests = (profile.recommendedTests || []).filter(t => Boolean(t && t.trim()));
    const isOgtt = isOgttProfile(profile);
    const isCbc = isCBCProfile(profile) && showVisualChart;
    const profileHighlights = !isCbc && !isOgtt && showVisualChart ? getProfileSummaryHighlights(profile) : [];

    // Estimate height requirements for table & extras
    const paramList = profile.parameters || [];
    const totalRefLines = paramList.reduce((acc, pm) => acc + Math.max(1, formatReferenceDisplay(pm).split('\n').length), 0);
    const extraBlocksCount =
      (isOgtt ? 1 : 0) +
      (isCbc ? 1 : 0) +
      (profileHighlights.length > 0 ? 1 : 0) +
      (bf ? 1 : 0) +
      allInterpretations.length +
      allComments.length +
      (illustration ? 1 : 0) +
      (recommendedTests.length > 0 ? 1 : 0) +
      (general ? 1 : 0);

    const heavyReport = totalRefLines > 16 || extraBlocksCount >= 3 || paramList.length > 14;
    const ultraDense = totalRefLines > 24 || paramList.length > 22;

    // Budget height for bottom extras vs table
    const estExtrasH =
      (isOgtt ? 1.85 : 0) +
      (isCbc ? 1.55 : 0) +
      (profileHighlights.length > 0 ? 0.65 : 0) +
      (bf ? 0.68 : 0) +
      allInterpretations.length * (ultraDense ? 0.45 : 0.56) +
      allComments.length * (ultraDense ? 0.42 : 0.52) +
      (illustration ? (ultraDense ? 0.72 : 0.88) : 0) +
      (recommendedTests.length > 0 ? 0.46 : 0) +
      (general ? 0.46 : 0);

    const maxTableH = Math.max(1.6, availableMiddleH - Math.min(estExtrasH, availableMiddleH * 0.52));
    const totalEffectiveRows = Math.max(1, totalRefLines) + 1; // +1 for header
    const baseRowH = ultraDense ? 0.175 : heavyReport ? 0.215 : 0.27;
    const rowH = Math.min(baseRowH, Math.max(0.145, (maxTableH - 0.10) / totalEffectiveRows));
    const tblFontSize = rowH < 0.17 ? 7.0 : rowH < 0.21 ? 7.8 : rowH < 0.25 ? 8.5 : 9.2;
    const refFontSize = Math.max(6.4, tblFontSize - 0.8);

    // 6. Results Table (Exact PDF Column Order: Investigation | Result | Unit | Flags | References | (Visual Gauge))
    const colW = showVisualChart
      ? [2.05, 1.05, 0.72, 0.82, 1.65, 1.10]
      : [2.30, 1.15, 0.85, 0.90, 2.19];

    const headTitles = showVisualChart
      ? ['INVESTIGATION', 'RESULT', 'UNIT', 'FLAGS', 'REFERENCES', 'VISUAL GAUGE']
      : ['INVESTIGATION', 'RESULT', 'UNIT', 'FLAGS', 'REFERENCES'];

    const headerRow = headTitles.map((t, cIdx) => ({
      text: t,
      options: {
        bold: true,
        color: 'FFFFFF',
        fill: { color: NAVY_HEADER },
        fontSize: Math.max(6.8, tblFontSize - 0.6),
        fontFace: FONT_EN,
        align: cIdx === 3 || cIdx === 5 ? 'center' : 'left',
        valign: 'middle'
      } as any
    }));

    const bodyRows = paramList.map((pm, rIdx) => {
      const f = pm.flag || '';
      const isCrit = f === 'PANIC_HIGH' || f === 'PANIC_LOW';
      const isHigh = f === 'HIGH' || f === 'ABNORMAL';
      const isLow = f === 'LOW';
      const resColor = isCrit ? 'FFFFFF' : isHigh ? HIGH_COL : isLow ? LOW_COL : INK;
      const rowBg = rIdx % 2 === 1 ? 'F8FAFC' : 'FFFFFF';
      const resFill = isCrit ? { color: CRITICAL_BG } : isHigh ? { color: 'FEF2F2' } : isLow ? { color: 'EFF6FF' } : { color: rowBg };
      const flagLabel =
        f === 'HIGH' ? 'HIGH' :
        f === 'LOW' ? 'LOW' :
        f === 'PANIC_HIGH' ? 'CRITICAL ▲' :
        f === 'PANIC_LOW' ? 'CRITICAL ▼' :
        f === 'ABNORMAL' ? 'ABNORMAL' :
        f === 'NORMAL' ? 'NORMAL' : '—';
      const flagBg =
        isCrit ? '991B1B' :
        f === 'HIGH' ? 'FEE2E2' :
        f === 'LOW' ? 'DBEAFE' :
        f === 'ABNORMAL' ? 'FEF3C7' :
        f === 'NORMAL' ? 'ECFDF5' : rowBg;
      const flagTxtColor =
        isCrit ? 'FFFFFF' :
        f === 'HIGH' ? '991B1B' :
        f === 'LOW' ? '1E40AF' :
        f === 'ABNORMAL' ? 'B45309' :
        f === 'NORMAL' ? '065F46' : MUTED;

      const cleanName = cleanInvestigationName(pm.name);
      const nameRuns: any[] = [{ text: cleanName, options: { bold: true, fontSize: tblFontSize, color: INK, fontFace: FONT_EN } }];
      if (pm.method && !ultraDense) {
        nameRuns.push({ text: `\nMethod: ${latin(pm.method)}`, options: { fontSize: Math.max(5.8, tblFontSize - 2), color: MUTED, fontFace: FONT_EN } });
      }

      const fullRef = latin(formatReferenceDisplay(pm), '—');

      const cells: any[] = [
        { text: nameRuns, options: { fill: { color: rowBg }, valign: 'middle' } },
        { text: String(pm.result || '—'), options: { fill: resFill, color: resColor, bold: true, fontSize: tblFontSize + 0.4, fontFace: FONT_MONO, valign: 'middle' } },
        { text: latin(pm.unit, '—'), options: { fill: { color: rowBg }, color: '475569', fontSize: Math.max(6.4, tblFontSize - 0.6), fontFace: FONT_MONO, valign: 'middle' } },
        { text: flagLabel, options: { fill: { color: flagBg }, color: flagTxtColor, bold: true, fontSize: Math.max(6.2, tblFontSize - 1.2), fontFace: FONT_EN, align: 'center', valign: 'middle' } },
        { text: fullRef, options: { fill: { color: rowBg }, color: '334155', bold: false, fontSize: refFontSize, fontFace: FONT_MONO, valign: 'middle' } }
      ];

      if (showVisualChart) {
        cells.push({
          text: buildVisualGaugeRuns(pm, Math.max(6.4, tblFontSize - 1)),
          options: { fill: { color: rowBg }, align: 'center', valign: 'middle' }
        });
      }
      return cells;
    });

    if (bodyRows.length > 0) {
      slide.addTable([headerRow, ...bodyRows] as any, {
        x: MARGIN_X,
        y: cursorY,
        w: USABLE_W,
        colW,
        rowH: Math.max(0.145, rowH),
        border: { type: 'solid', pt: 0.5, color: LINE },
        margin: [0.02, 0.05, 0.02, 0.05]
      });

      const estimatedTableUsedH = (totalEffectiveRows + 0.4) * rowH + 0.06;
      cursorY += Math.min(maxTableH, estimatedTableUsedH);
    }

    // Helper to clamp any extra block into remaining vertical budget before signatures
    const remainingH = () => Math.max(0, sigTopY - cursorY - 0.04);

    // 7A. CBC Visual Dashboard (Differential Stacked Bar + Dual Histograms)
    if (isCbc && remainingH() > 0.75) {
      const cbcData = extractCBCData(paramList);
      const neu = cbcData.neutrophils ?? 60;
      const lym = cbcData.lymphocytes ?? 30;
      const mono = cbcData.monocytes ?? 5;
      const eos = cbcData.eosinophils ?? 3;
      const baso = cbcData.basophils ?? 1;
      const diffTotal = (neu + lym + mono + eos + baso) || 100;

      const cbcPanelH = Math.min(remainingH() * 0.52, 1.48);
      slide.addShape(pptx.ShapeType.roundRect, {
        x: MARGIN_X, y: cursorY, w: USABLE_W, h: cbcPanelH,
        fill: { color: SOFT }, line: { color: BORDER, width: 0.6 }, rectRadius: 0.05
      });
      slide.addText('Complete Blood Count (CBC) Differential Spectrum & Histograms', {
        x: MARGIN_X + 0.1, y: cursorY + 0.03, w: USABLE_W - 0.2, h: 0.16,
        fontSize: 7.5, bold: true, color: NAVY_HEADER, fontFace: FONT_EN, margin: 0
      });

      const barW = USABLE_W - 0.24;
      const barX = MARGIN_X + 0.12;
      const barY = cursorY + 0.21;
      const segs = [
        { pct: neu / diffTotal, col: '2563EB', lbl: `Neu ${neu}%` },
        { pct: lym / diffTotal, col: '7C3AED', lbl: `Lym ${lym}%` },
        { pct: mono / diffTotal, col: 'D97706', lbl: `Mono` },
        { pct: eos / diffTotal, col: '059669', lbl: `Eos` },
        { pct: baso / diffTotal, col: 'E11D48', lbl: '' }
      ];
      let sx = barX;
      segs.forEach(sg => {
        const sw = Math.max(0.05, barW * sg.pct);
        slide.addShape(pptx.ShapeType.rect, {
          x: sx, y: barY, w: sw, h: 0.14, fill: { color: sg.col }, line: { color: 'FFFFFF', width: 0.4 }
        });
        if (sw > 0.55 && sg.lbl) {
          slide.addText(sg.lbl, {
            x: sx, y: barY, w: sw, h: 0.14,
            fontSize: 6.2, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', fontFace: FONT_EN, margin: 0
          });
        }
        sx += sw;
      });

      slide.addText(
        `Neu: ${neu}%  •  Lym: ${lym}%  •  Mono: ${mono}%  •  Eos: ${eos}%  •  Baso: ${baso}%`,
        { x: barX, y: barY + 0.16, w: barW, h: 0.14, fontSize: 6.4, color: '334155', fontFace: FONT_EN, margin: 0 }
      );

      if (cbcPanelH >= 1.15) {
        const rbcPng = await svgMarkupToPngDataUrl(generateCbcRbcSvgChart(cbcData, 320, 130), 320, 130);
        const pltPng = await svgMarkupToPngDataUrl(generateCbcPltSvgChart(cbcData, 320, 130), 320, 130);
        const imgH = Math.max(0.55, cbcPanelH - 0.58);
        const imgW = (barW - 0.12) / 2;
        if (rbcPng) slide.addImage({ data: rbcPng, x: barX, y: barY + 0.33, w: imgW, h: imgH });
        if (pltPng) slide.addImage({ data: pltPng, x: barX + imgW + 0.12, y: barY + 0.33, w: imgW, h: imgH });
      }
      cursorY += cbcPanelH + 0.06;
    }

    // 7B. OGTT SVG Curve + Diagnostic Evaluation Badge
    if (isOgtt && remainingH() > 0.9) {
      const ogttEval = extractOgttData(paramList);
      const ogttH = Math.min(remainingH() * 0.62, 1.85);
      const chartH = ogttH - 0.48;
      const ogttPng = await svgMarkupToPngDataUrl(generateOgttSvgChart(ogttEval, 680, 195), 680, 195);
      if (ogttPng) {
        slide.addImage({ data: ogttPng, x: MARGIN_X, y: cursorY, w: USABLE_W, h: chartH });
        cursorY += chartH + 0.04;
      }
      slide.addShape(pptx.ShapeType.roundRect, {
        x: MARGIN_X, y: cursorY, w: USABLE_W, h: 0.42,
        fill: { color: ogttEval.badgeBg.replace('#', '') || SOFT },
        line: { color: ogttEval.statusColor.replace('#', '') || BLUE, width: 0.8 },
        rectRadius: 0.05
      });
      slide.addText(
        [
          { text: `OGTT DIAGNOSTIC EVALUATION: ${ogttEval.statusEn}\n`, options: { bold: true, fontSize: 7.5, color: ogttEval.statusColor.replace('#', '') || BLUE } },
          { text: latin(ogttEval.clinicalSummaryEn), options: { fontSize: 6.8, color: INK } }
        ],
        { x: MARGIN_X + 0.1, y: cursorY + 0.03, w: 5.3, h: 0.36, fontFace: FONT_EN, margin: 0, valign: 'middle' }
      );
      slide.addText(
        `Fasting: ${ogttEval.fastingVal ?? '—'} mg/dL\n2-Hour: ${ogttEval.twoHourVal ?? '—'} mg/dL\nPeak: ${ogttEval.peakVal ?? '—'} mg/dL`,
        { x: MARGIN_X + 5.5, y: cursorY + 0.03, w: 1.8, h: 0.36, fontSize: 6.6, bold: true, color: '334155', fontFace: FONT_MONO, align: 'right', valign: 'middle', margin: 0 }
      );
      cursorY += 0.46;
    }

    // 7C. Compact Profile Diagnostic Summary Cards (Lipid / Liver / Kidney / Diabetes / Thyroid)
    if (profileHighlights.length > 0 && remainingH() > 0.6) {
      const cardsH = 0.50;
      const gap = 0.08;
      const cw = (USABLE_W - gap * (profileHighlights.length - 1)) / profileHighlights.length;
      profileHighlights.forEach((card, cIdx) => {
        const cx = MARGIN_X + cIdx * (cw + gap);
        slide.addShape(pptx.ShapeType.roundRect, {
          x: cx, y: cursorY, w: cw, h: cardsH,
          fill: { color: SOFT }, line: { color: LINE, width: 0.6 }, rectRadius: 0.04
        });
        slide.addText(card.label, {
          x: cx + 0.06, y: cursorY + 0.03, w: cw - 0.12, h: 0.13,
          fontSize: 6.3, bold: true, color: MUTED, fontFace: FONT_EN, margin: 0
        });
        slide.addText(card.value, {
          x: cx + 0.06, y: cursorY + 0.16, w: cw - 0.12, h: 0.16,
          fontSize: 8.5, bold: true, color: NAVY, fontFace: FONT_MONO, margin: 0
        });
        slide.addText(card.status, {
          x: cx + 0.06, y: cursorY + 0.33, w: cw - 0.12, h: 0.13,
          fontSize: 6.2, bold: true, color: card.color, fill: { color: card.bg }, fontFace: FONT_EN, align: 'center', margin: 0
        });
      });
      cursorY += cardsH + 0.06;
    }

    // 7D. Blood Film Findings
    if (bf && remainingH() > 0.52) {
      const filmItems = [
        bf.rbcMorphology ? `RBC Morphology: ${latin(bf.rbcMorphology)}` : '',
        bf.wbcMorphology ? `WBC Morphology: ${latin(bf.wbcMorphology)}` : '',
        bf.plateletMorphology ? `Platelets: ${latin(bf.plateletMorphology)}` : '',
        bf.reticulocytesPercent ? `Reticulocytes: ${latin(bf.reticulocytesPercent)}` : ''
      ].filter(Boolean);
      if (filmItems.length > 0) {
        const filmH = Math.min(0.60, remainingH() * 0.45);
        slide.addShape(pptx.ShapeType.roundRect, {
          x: MARGIN_X, y: cursorY, w: USABLE_W, h: filmH,
          fill: { color: 'FDFDFD' }, line: { color: LINE, width: 0.6 }, rectRadius: 0.05
        });
        const leftText = [filmItems[0], filmItems[2]].filter(Boolean).join('\n');
        const rightText = [filmItems[1], filmItems[3]].filter(Boolean).join('\n');
        slide.addText(leftText, {
          x: MARGIN_X + 0.1, y: cursorY + 0.04, w: USABLE_W / 2 - 0.14, h: filmH - 0.08,
          fontSize: 6.8, color: INK, fontFace: FONT_EN, valign: 'middle', margin: 0, fit: 'shrink'
        });
        if (rightText) {
          slide.addText(rightText, {
            x: MARGIN_X + USABLE_W / 2 + 0.04, y: cursorY + 0.04, w: USABLE_W / 2 - 0.14, h: filmH - 0.08,
            fontSize: 6.8, color: INK, fontFace: FONT_EN, valign: 'middle', margin: 0, fit: 'shrink'
          });
        }
        cursorY += filmH + 0.05;
      }
    }

    // 7E. Clinical Interpretations & Technical Comments
    const noteItems: Array<{ heading: string; body: string; isRed: boolean }> = [];
    allInterpretations.forEach((t, i) => {
      const clean = latin(t);
      if (clean) noteItems.push({ heading: `CLINICAL INTERPRETATION ${allInterpretations.length > 1 ? `#${i + 1}` : ''}`.trim(), body: clean, isRed: true });
    });
    allComments.forEach((t, i) => {
      const clean = latin(t);
      if (clean) noteItems.push({ heading: `TECHNICAL NOTE ${allComments.length > 1 ? `#${i + 1}` : ''}`.trim(), body: clean, isRed: false });
    });
    if (general) {
      noteItems.push({ heading: 'CLINICAL DIAGNOSTIC NOTE', body: general, isRed: false });
    }

    for (const item of noteItems) {
      if (remainingH() < 0.34) break;
      const linesEst = Math.max(1, Math.ceil(item.body.length / 105) + (item.body.match(/\n/g) || []).length);
      const boxH = Math.min(remainingH() * 0.65, Math.max(0.34, 0.20 + linesEst * 0.13));
      slide.addShape(pptx.ShapeType.roundRect, {
        x: MARGIN_X, y: cursorY, w: USABLE_W, h: boxH,
        fill: { color: item.isRed ? RED_SOFT : SOFT }, line: { color: item.isRed ? 'FECDD3' : LINE, width: 0.5 }, rectRadius: 0.04
      });
      slide.addShape(pptx.ShapeType.rect, {
        x: MARGIN_X, y: cursorY, w: 0.045, h: boxH,
        fill: { color: item.isRed ? RED : BLUE }, line: { color: item.isRed ? RED : BLUE, width: 0 }
      });
      slide.addText(
        [
          { text: `${item.heading}\n`, options: { bold: true, fontSize: 6.8, color: item.isRed ? RED : BLUE, charSpacing: 0.8 } },
          { text: item.body, options: { fontSize: 7.4, color: INK } }
        ],
        { x: MARGIN_X + 0.11, y: cursorY + 0.03, w: USABLE_W - 0.18, h: boxH - 0.06, fontFace: FONT_EN, valign: 'top', margin: 0, fit: 'shrink' }
      );
      cursorY += boxH + 0.05;
    }

    // 7F. Medical Atlas / Infographic Card
    if (illustration && remainingH() > 0.58) {
      const atlasH = Math.min(0.78, remainingH() * 0.65);
      slide.addShape(pptx.ShapeType.roundRect, {
        x: MARGIN_X, y: cursorY, w: USABLE_W, h: atlasH,
        fill: { color: RED_SOFT }, line: { color: 'FECDD3', width: 0.6 }, rectRadius: 0.05
      });
      slide.addShape(pptx.ShapeType.rect, {
        x: MARGIN_X, y: cursorY, w: 0.05, h: atlasH,
        fill: { color: RED }, line: { color: RED, width: 0 }
      });
      const atlasPng = await ensureRasterDataUrl(illustration.imageUrl);
      const textStartX = atlasPng ? MARGIN_X + 1.15 : MARGIN_X + 0.12;
      if (atlasPng) {
        slide.addImage({ data: atlasPng, x: MARGIN_X + 0.10, y: cursorY + 0.06, w: 0.96, h: atlasH - 0.12 });
      }
      const keyPts = illustration.keyDiagnosticPoints?.length
        ? `\n• ${illustration.keyDiagnosticPoints.slice(0, 2).join(' • ')}`
        : '';
      slide.addText(
        [
          { text: `${illustration.titleEn}\n`, options: { bold: true, fontSize: 7.6, color: RED } },
          { text: `${illustration.pathologySummaryEn}${keyPts}`, options: { fontSize: 6.7, color: INK } }
        ],
        {
          x: textStartX, y: cursorY + 0.05, w: MARGIN_X + USABLE_W - textStartX - 0.08, h: atlasH - 0.10,
          fontFace: FONT_EN, valign: 'middle', margin: 0, fit: 'shrink'
        }
      );
      cursorY += atlasH + 0.05;
    }

    // 7G. Recommended Follow-up Investigations
    if (recommendedTests.length > 0 && remainingH() > 0.34) {
      const recH = Math.min(0.42, remainingH());
      const cleanedRecs = recommendedTests.map(t => t.replace(/\s*\([\u0600-\u06FF\s-]+\)/g, '').trim() || latin(t)).filter(Boolean);
      if (cleanedRecs.length > 0) {
        slide.addShape(pptx.ShapeType.roundRect, {
          x: MARGIN_X, y: cursorY, w: USABLE_W, h: recH,
          fill: { color: SOFT }, line: { color: BLUE, width: 0.6, dashType: 'dash' }, rectRadius: 0.04
        });
        slide.addText(
          [
            { text: 'RECOMMENDED FOLLOW-UP INVESTIGATIONS:  ', options: { bold: true, fontSize: 6.7, color: BLUE } },
            { text: cleanedRecs.join('  •  '), options: { bold: true, fontSize: 7.2, color: NAVY } }
          ],
          { x: MARGIN_X + 0.10, y: cursorY + 0.03, w: USABLE_W - 0.20, h: recH - 0.06, fontFace: FONT_EN, valign: 'middle', margin: 0, fit: 'shrink' }
        );
        cursorY += recH + 0.05;
      }
    }

    // 8. Official Signatures Section (Arabic RTL + Handwritten PNGs + Electronic Stamp Box)
    if (hasSignatures) {
      const cols = sigBlocks.length <= 5 ? sigBlocks.length : Math.min(5, sigBlocks.length);
      const gap = 0.14;
      const cardW = (USABLE_W - gap * (cols - 1)) / cols;
      const blockStartY = footerTopY - sigReserveH;

      sigBlocks.slice(0, 5).forEach((b, bIdx) => {
        // RTL ordering matching HTML <div dir="rtl">: index 0 on the far right
        const rtlColIdx = cols - 1 - bIdx;
        const bx = MARGIN_X + rtlColIdx * (cardW + gap);
        const png = sigPngMap.get(bIdx);

        if (png) {
          const imgW = Math.min(cardW * 0.85, 1.35);
          slide.addImage({
            data: png,
            x: bx + (cardW - imgW) / 2,
            y: blockStartY + 0.02,
            w: imgW,
            h: 0.42,
            sizing: { type: 'contain', w: imgW, h: 0.42 }
          });
        }

        const lineY = blockStartY + 0.47;
        slide.addShape(pptx.ShapeType.line, {
          x: bx + cardW * 0.04, y: lineY, w: cardW * 0.92, h: 0,
          line: { color: NAVY, width: 1.0 }
        });

        slide.addText(b.role, {
          x: bx, y: lineY + 0.04, w: cardW, h: 0.16,
          fontSize: 7.4, bold: true, color: BLUE, fontFace: FONT_AR, align: 'center', rtlMode: true, margin: 0
        });
        if (b.name) {
          slide.addText(b.name, {
            x: bx, y: lineY + 0.19, w: cardW, h: 0.18,
            fontSize: 8.2, bold: true, color: NAVY, fontFace: FONT_AR, align: 'center', rtlMode: hasArabic(b.name), margin: 0
          });
        }
        if (b.title) {
          slide.addText(b.title, {
            x: bx, y: lineY + 0.36, w: cardW, h: 0.15,
            fontSize: 6.4, color: MUTED, fontFace: FONT_AR, align: 'center', rtlMode: hasArabic(b.title), margin: 0
          });
        }
        if (b.license) {
          slide.addText(`ترخيص: ${b.license}`, {
            x: bx, y: lineY + 0.50, w: cardW, h: 0.13,
            fontSize: 6.2, bold: true, color: BLUE, fontFace: FONT_AR, align: 'center', rtlMode: true, margin: 0
          });
        }
        if (b.isConsultant) {
          const stampY = lineY + (b.license ? 0.65 : 0.53);
          const stampW = Math.min(cardW * 0.94, 1.55);
          const stampX = bx + (cardW - stampW) / 2;
          slide.addShape(pptx.ShapeType.roundRect, {
            x: stampX, y: stampY, w: stampW, h: 0.28,
            fill: { color: RED_SOFT },
            line: { color: RED, width: 1.0, dashType: 'dash' },
            rectRadius: 0.04
          });
          slide.addText(
            [
              { text: 'معتمد وموثق إلكترونياً\n', options: { fontSize: 5.8, bold: true, color: RED_DARK } },
              { text: 'معامل RT للتحاليل الطبية', options: { fontSize: 6.2, bold: true, color: RED } }
            ],
            {
              x: stampX + 0.02, y: stampY + 0.01, w: stampW - 0.04, h: 0.26,
              fontFace: FONT_AR, align: 'center', valign: 'middle', rtlMode: true, margin: 0
            }
          );
        }
      });
    }

    // 9. Verification Disclaimer + A4 Footer
    slide.addShape(pptx.ShapeType.line, {
      x: MARGIN_X, y: footerTopY, w: USABLE_W, h: 0,
      line: { color: BORDER, width: 0.6, dashType: 'dash' }
    });
    slide.addText('• The analytical results relate solely to the specimen received and tested. Clinical correlation is recommended.', {
      x: MARGIN_X, y: footerTopY + 0.03, w: 5.6, h: 0.16,
      fontSize: 6.4, color: MUTED, fontFace: FONT_EN, margin: 0
    });
    slide.addText('RT LAB VERIFIED REPORT', {
      x: MARGIN_X + 5.65, y: footerTopY + 0.03, w: USABLE_W - 5.65, h: 0.16,
      fontSize: 6.6, bold: true, color: BLUE, fontFace: FONT_MONO, align: 'right', margin: 0
    });

    slide.addShape(pptx.ShapeType.line, {
      x: MARGIN_X, y: footerTopY + 0.21, w: USABLE_W, h: 0,
      line: { color: LINE, width: 0.6 }
    });
    slide.addText(
      `Lab ID: ${safeReport.reportNumber}  •  Sample Barcode: ${p.barcode || p.labNumber}  •  Page ${idx + 1} of ${totalPages}`,
      { x: MARGIN_X, y: footerTopY + 0.24, w: 5.1, h: 0.18, fontSize: 7.0, color: MUTED, fontFace: FONT_EN, margin: 0 }
    );
    slide.addText(
      idx === totalPages - 1 ? '— END OF LABORATORY REPORT —' : 'CONTINUED ON NEXT PAGE',
      { x: MARGIN_X + 5.1, y: footerTopY + 0.24, w: USABLE_W - 5.1, h: 0.18, fontSize: 7.0, bold: true, color: RED, fontFace: FONT_EN, align: 'right', margin: 0 }
    );
  }

  await pptx.writeFile({ fileName: reportFileName(safeReport, 'pptx') });
}
