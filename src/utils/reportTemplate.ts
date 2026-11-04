import { LabReport, LabInfo, TestParameter, TestProfile } from '../types';
import { formatReferenceDisplay } from './cbcCalculator';
import { formatGenderEn } from './calculator';
import { DEFAULT_STAFF } from '../data/labCatalog';
import { DISEASE_ILLUSTRATIONS } from '../data/diseaseIllustrations';
import { isOgttProfile, extractOgttData, generateOgttSvgChart, generateOgttProtocolHtml } from './ogttEngine';
import { isCBCProfile, extractCBCData, generateCbcRbcSvgChart, generateCbcPltSvgChart } from './cbcEngine';

/**
 * Single source of truth for the patient-facing report.
 * Used by: print window, PDF export, on-screen preview.
 * English only, LTR.
 * Table Columns strictly: Test | Result | Unit | Flags | References
 */

export const BRAND = {
  red: '#881337', // Dark Crimson / Burgundy
  redDark: '#4c0519',
  redSoft: '#fff1f2',
  navy: '#0f172a', // Deep Slate / Navy
  navyBlue: '#1e3a8a', // Royal Navy Blue
  navySoft: '#f8fafc',
  ink: '#0f172a',
  muted: '#64748b',
  line: '#e2e8f0',
  high: '#b91c1c',
  low: '#1d4ed8',
  critical: '#991b1b',
};

const ARABIC = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g;


/** Comprehensive mapping of Arabic staff names to official Latin/English format */
const KNOWN_STAFF_MAP: Record<string, string> = {
  'د/ عمر فؤاد القاضي': 'Dr. Omar Fouad El-Kady',
  'عمر فؤاد القاضي': 'Dr. Omar Fouad El-Kady',
  'أ/ سارة إبراهيم الشربيني': 'Sara Ibrahim El-Sherbiny',
  'سارة إبراهيم الشربيني': 'Sara Ibrahim El-Sherbiny',
  'أ.د. رامي مختار': 'Prof. Dr. Rami Mokhtar',
  'د. رامي مختار': 'Prof. Dr. Rami Mokhtar',
  'د/ رامي مختار': 'Prof. Dr. Rami Mokhtar',
  'رامي مختار': 'Prof. Dr. Rami Mokhtar',
  'د/ آية محمود الباز': 'Dr. Aya Mahmoud El-Baz',
  'آية محمود الباز': 'Dr. Aya Mahmoud El-Baz',
  'د/ كريم حسن الديب': 'Dr. Karim Hassan El-Deeb',
  'كريم حسن الديب': 'Dr. Karim Hassan El-Deeb',
  'د/ هبة الشناوي': 'Dr. Heba El-Shennawy',
  'هبة الشناوي': 'Dr. Heba El-Shennawy',
  'د. هبة الشناوي': 'Dr. Heba El-Shennawy',
  'د/ دعاء الشافعي': 'Dr. Doaa El-Shafei',
  'دعاء الشافعي': 'Dr. Doaa El-Shafei',
  'د/ مصطفى العوضي': 'Dr. Mostafa El-Awady',
  'مصطفى العوضي': 'Dr. Mostafa El-Awady',
  'د. مصطفى العوضي': 'Dr. Mostafa El-Awady',
  'د/ سامح عبد الرازق': 'Dr. Sameh Abdel Razek',
  'سامح عبد الرازق': 'Dr. Sameh Abdel Razek',
  'مني احمد': 'Chemist Mona Ahmed',
  'منى احمد': 'Chemist Mona Ahmed',
  'رحاب على': 'Dr. Rehab Ali',
  'رحاب علي': 'Dr. Rehab Ali',
  'ماجد حسني الشرقاوي': 'Maged Hosny El-Sharkawy',
  'أ/ ماجد حسني الشرقاوي': 'Maged Hosny El-Sharkawy',
  'أحمد فتحي الجمال': 'Ahmed Fathy El-Gammal',
  'أ/ أحمد فتحي الجمال': 'Ahmed Fathy El-Gammal'
};

const COMMON_AR_NAMES: Record<string, string> = {
  'محمد': 'Mohamed', 'أحمد': 'Ahmed', 'محمود': 'Mahmoud', 'علي': 'Ali', 'على': 'Ali',
  'إبراهيم': 'Ibrahim', 'خالد': 'Khaled', 'طارق': 'Tarek', 'مصطفى': 'Mostafa',
  'حسن': 'Hassan', 'حسين': 'Hussein', 'عمر': 'Omar', 'عمرو': 'Amr', 'يوسف': 'Youssef',
  'سارة': 'Sara', 'هبة': 'Heba', 'منى': 'Mona', 'مني': 'Mona', 'رحاب': 'Rehab',
  'آية': 'Aya', 'دعاء': 'Doaa', 'فاطمة': 'Fatma', 'مريم': 'Mariam', 'نور': 'Nour',
  'سامح': 'Sameh', 'ماجد': 'Maged', 'كريم': 'Karim', 'رامي': 'Rami', 'مختار': 'Mokhtar',
  'الشناوي': 'El-Shennawy', 'العوضي': 'El-Awady', 'القاضي': 'El-Kady', 'الشربيني': 'El-Sherbiny',
  'الباز': 'El-Baz', 'الديب': 'El-Deeb', 'الشافعي': 'El-Shafei', 'الشرقاوي': 'El-Sharkawy',
  'الجمال': 'El-Gammal'
};

/** Intelligently resolves or transliterates staff name into clean printable Latin/Arabic */
export function formatStaffName(raw?: string | null, fallback = ''): string {
  if (!raw) return fallback;
  const str = String(raw).trim();
  if (!str) return fallback;

  if (KNOWN_STAFF_MAP[str]) return KNOWN_STAFF_MAP[str];

  // Specific key doctors & staff check
  if (str.includes('رامي') && str.includes('مختار')) return 'Prof. Dr. Rami Mokhtar';
  if (str.includes('هبة') && str.includes('الشناوي')) return 'Dr. Heba El-Shennawy';
  if (str.includes('مصطفى') && str.includes('العوضي')) return 'Dr. Mostafa El-Awady';
  if (str.includes('عمر') && (str.includes('القاضي') || str.includes('فؤاد'))) return 'Dr. Omar Fouad El-Kady';
  if (str.includes('سارة') && str.includes('الشربيني')) return 'Sara Ibrahim El-Sherbiny';
  if (str.includes('رحاب') && (str.includes('على') || str.includes('علي'))) return 'Dr. Rehab Ali';
  if ((str.includes('منى') || str.includes('مني')) && str.includes('احمد')) return 'Chemist Mona Ahmed';
  if (str.includes('آية') && str.includes('الباز')) return 'Dr. Aya Mahmoud El-Baz';
  if (str.includes('كريم') && str.includes('الديب')) return 'Dr. Karim Hassan El-Deeb';
  if (str.includes('دعاء') && str.includes('الشافعي')) return 'Dr. Doaa El-Shafei';
  if (str.includes('سامح') && str.includes('عبد الرازق')) return 'Dr. Sameh Abdel Razek';
  if (str.includes('ماجد') && str.includes('الشرقاوي')) return 'Maged Hosny El-Sharkawy';
  if (str.includes('أحمد') && str.includes('الجمال')) return 'Ahmed Fathy El-Gammal';

  // Check if string contains existing clean Latin text
  const latinPart = str
    .replace(/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g, '')
    .replace(/^[\s\-–—•|/,:]+|[\s\-–—•|/,:]+$/g, '')
    .trim();
  if (latinPart.length >= 3 && /[a-zA-Z]/.test(latinPart)) {
    return latinPart;
  }

  // Transliterate Arabic doctor names
  let prefix = '';
  let cleanName = str;
  if (/^أ\.د\./.test(cleanName)) { prefix = 'Prof. Dr. '; cleanName = cleanName.replace(/^أ\.د\.\s*/, ''); }
  else if (/^(د\.|د\/)/.test(cleanName)) { prefix = 'Dr. '; cleanName = cleanName.replace(/^(د\.|د\/)\s*/, ''); }
  else if (/^(كيميائي|كيميائية)/.test(cleanName)) { prefix = 'Chemist '; cleanName = cleanName.replace(/^(كيميائي|كيميائية)\s*/, ''); }
  else if (/^(أ\.|أ\/)/.test(cleanName)) { prefix = ''; cleanName = cleanName.replace(/^(أ\.|أ\/)\s*/, ''); }

  if (cleanName.includes('-')) {
    cleanName = cleanName.split('-')[0].trim();
  }

  const words = cleanName.split(/\s+/);
  const translatedWords = words.map(w => COMMON_AR_NAMES[w] || w);
  const joined = translatedWords.join(' ');
  
  if (joined && /[a-zA-Z]/.test(joined)) {
    return (prefix + joined).trim();
  }

  return str || fallback;
}

/** Resolves official job titles into standard clinical English */
export function formatStaffTitle(raw?: string | null, defaultTitle = ''): string {
  if (!raw) return defaultTitle;
  const str = String(raw).trim();
  if (!str) return defaultTitle;

  if (KNOWN[str]) return KNOWN[str];

  if (str.includes('باثولوج') || str.includes('قصر العيني') || str.includes('patholog')) {
    return 'Consultant Clinical Pathologist - Kasr Al Ainy';
  }
  if (str.includes('جودة') || str.includes('تنفيذي') || str.includes('quality') || str.includes('audit')) {
    return 'Quality Assurance & Operations Manager';
  }
  if (str.includes('كيمياء') || str.includes('كيميائ') || str.includes('chemist')) {
    return 'Senior Clinical Chemist';
  }
  if (str.includes('مالي') || str.includes('حسابات') || str.includes('CFO')) {
    return 'Chief Financial Officer (CFO)';
  }
  if (str.includes('موارد بشرية') || str.includes('HR')) {
    return 'Human Resources Director';
  }

  const latinPart = str
    .replace(/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g, '')
    .replace(/^[\s\-–—•|/,:]+|[\s\-–—•|/,:]+$/g, '')
    .trim();
  if (latinPart.length >= 3 && /[a-zA-Z]/.test(latinPart)) {
    return latinPart;
  }

  return str || defaultTitle;
}

/** Generates realistic signature line flourish */
function renderRealisticSignature(name: string, isConsultant?: boolean): string {
  const strokeColor = isConsultant ? '#881337' : '#0f172a';
  return '<svg class="sig-svg" viewBox="0 0 160 40" style="width: 110px; height: 30px; stroke: ' + strokeColor + '; fill: none; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round;"><path d="M 14 26 C 24 12, 36 10, 46 22 C 54 32, 68 18, 80 16 C 94 14, 108 26, 124 18 C 136 12, 146 16, 152 22" /><path d="M 18 35 C 45 33, 85 35, 136 30" stroke-width="1.2" opacity="0.75" /></svg>';
}

/** Known Arabic staff names/titles already saved in older data -> English. */
const KNOWN: Record<string, string> = {
  "د/ عمر فؤاد القاضي": "Dr. Omar Fouad El-Kady",
  "أ/ سارة إبراهيم الشربيني": "Sara Ibrahim El-Sherbiny",
  "أ.د. رامي مختار": "Prof. Dr. Rami Mokhtar",
  "د/ آية محمود الباز": "Dr. Aya Mahmoud El-Baz",
  "د/ كريم حسن الديب": "Dr. Karim Hassan El-Deeb",
  "د/ هبة الشناوي": "Dr. Heba El-Shennawy",
  "د/ دعاء الشافعي": "Dr. Doaa El-Shafei",
  "د/ مصطفى العوضي": "Dr. Mostafa El-Awady",
  "د/ سامح عبد الرازق": "Dr. Sameh Abdel Razek",
  "أخصائي أول كيمياء إكلينيكية وهرمونات": "Senior Clinical Chemist - Hormones",
  "مدير العمليات وضبط الجودة الإدارية": "Operations & Quality Manager",
  "استشاري الباثولوجيا الإكلينيكية والكيميائية - كلية طب قصر العيني": "Consultant Clinical Pathologist - Kasr Al Ainy",
  "استشاري الباثولوجيا الإكلينيكية - قصر العيني": "Consultant Clinical Pathologist - Kasr Al Ainy",
  "أخصائية أمراض الدم والمناعة والمزارع": "Specialist - Hematology, Immunology & Cultures",
  "كيميائي تحاليل طبية وتشخيصية": "Medical Laboratory Chemist",
  "كيميائية تحاليل وفحوصات فورية": "Laboratory Chemist - STAT Testing",
  "مدير العمليات والجودة الإدارية": "Operations & Quality Manager",
  "مراجع ومراقب جودة التحاليل الإكلينيكية": "Clinical Quality Reviewer",
  "استشاري مراجعة التحاليل وضبط المعايرة": "Consultant - Result Review & Calibration",
  "استشاري أمراض الدم والباثولوجيا الإكلينيكية": "Consultant Hematologist & Clinical Pathologist",
};

/** Remove Arabic characters so nothing Arabic reaches the patient report. */
export function latin(input?: string | null, fallback = ''): string {
  if (!input) return fallback;
  const trimmed = String(input).trim();
  if (KNOWN[trimmed]) return KNOWN[trimmed];
  if (KNOWN_STAFF_MAP[trimmed]) return KNOWN_STAFF_MAP[trimmed];
  const cleaned = trimmed
    .replace(ARABIC, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s\-–—•|/,:]+|[\s\-–—•|/,:]+$/g, '')
    .trim();
  // NEVER return lone dots or empty string if original input was valid text
  if (!cleaned || /^[\s.\-–—•|/,:]+$/.test(cleaned)) {
    return formatStaffName(trimmed, trimmed) || fallback;
  }
  return cleaned || fallback;
}

const esc = (s: unknown): string =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Official RT Diagnostic Laboratories vector logo
 * High resolution, clinical shield with microscope and RT monogram
 */
export function rtLogoSvg(size = 56): string {
  return `
<svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="RT Diagnostic Laboratories">
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
  <!-- Main Shield -->
  <path d="M32 3 L55 11 V29 C55 43.5 44.5 56.5 32 61 C19.5 56.5 9 43.5 9 29 V11 L32 3 Z" fill="url(#rtShieldGrad)" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.3"/>
  <!-- Inner Border Accent -->
  <path d="M32 6 L51 13 V28 C51 40.5 42 52 32 56 C22 52 13 40.5 13 28 V13 L32 6 Z" stroke="url(#rtAccentGrad)" stroke-width="1" stroke-opacity="0.6"/>
  <!-- Stylized RT Monogram -->
  <text x="32" y="36" text-anchor="middle" font-family="'Inter', -apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="21" fill="#ffffff" letter-spacing="-0.5">RT</text>
  <!-- Medical Cross / Microscope Base accent -->
  <rect x="23" y="42" width="18" height="2.5" rx="1.25" fill="#38bdf8"/>
  <rect x="29" y="39.5" width="6" height="7.5" rx="1" fill="#fb7185"/>
  <circle cx="32" cy="14" r="2.5" fill="#38bdf8"/>
</svg>`;
}

type FlagKind = 'N' | 'H' | 'L' | 'CH' | 'CL' | 'A' | '';

function flagKind(p: TestParameter): FlagKind {
  switch (p.flag) {
    case 'HIGH': return 'H';
    case 'LOW': return 'L';
    case 'PANIC_HIGH': return 'CH';
    case 'PANIC_LOW': return 'CL';
    case 'ABNORMAL': return 'A';
    case 'NORMAL': return 'N';
    default: return '';
  }
}

function flagCell(k: FlagKind): string {
  switch (k) {
    case 'H': return `<span class="flag-tag flag-high">HIGH</span>`;
    case 'L': return `<span class="flag-tag flag-low">LOW</span>`;
    case 'CH': return `<span class="flag-tag flag-panic">CRITICAL ▲</span>`;
    case 'CL': return `<span class="flag-tag flag-panic">CRITICAL ▼</span>`;
    case 'A': return `<span class="flag-tag flag-abnormal">ABNORMAL</span>`;
    case 'N': return `<span class="flag-tag flag-normal">NORMAL</span>`;
    default: return `<span class="flag-none">—</span>`;
  }
}

function ageText(age: number, unit: string): string {
  const u = unit === 'years' ? 'Yrs' : unit === 'months' ? 'Mths' : 'Days';
  return `${age} ${u}`;
}

function fmtDate(d?: string): string {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  const date = dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${date} ${time}`;
}

export const REPORT_CSS = `
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; }
  .rt-root, .rt-root * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  .rt-root {
    color: ${BRAND.ink};
    font-size: 11.5px;
    line-height: 1.5;
    direction: ltr;
    text-align: left;
    -webkit-font-smoothing: antialiased;
    font-variant-numeric: tabular-nums lining-nums;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .rt-page {
    width: 210mm;
    min-height: 297mm;
    background: #ffffff;
    margin: 0 auto;
    position: relative;
    display: flex;
    flex-direction: column;
    padding: 10mm 14mm 10mm;
    page-break-after: always;
    break-after: page;
  }
  .rt-page:last-child {
    page-break-after: auto;
    break-after: auto;
  }
  
  /* Top decorative dual-tone clinical bar */
  .rt-topbar {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    height: 4.5mm;
    background: linear-gradient(90deg, ${BRAND.red} 0%, #be123c 45%, ${BRAND.navyBlue} 45%, ${BRAND.navy} 100%);
  }

  /* Header Section */
  .rt-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 3mm 0 3.5mm;
    border-bottom: 2px solid ${BRAND.navy};
  }
  .rt-brand {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .rt-brand h1 {
    margin: 0;
    font-size: 19px;
    font-weight: 900;
    color: ${BRAND.red};
    letter-spacing: -0.02em;
    line-height: 1.15;
  }
  .rt-brand .sub {
    font-size: 10px;
    color: ${BRAND.navyBlue};
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    margin-top: 2px;
  }
  .rt-brand .accred {
    font-size: 9px;
    color: ${BRAND.muted};
    font-weight: 500;
  }
  .rt-contact {
    text-align: right;
    font-size: 9.5px;
    color: ${BRAND.muted};
    line-height: 1.5;
  }
  .rt-contact strong {
    color: ${BRAND.navy};
    font-weight: 700;
  }

  /* Patient Details Grid */
  .rt-patient {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px 14px;
    margin: 4.5mm 0 4mm;
    padding: 3mm 4mm;
    background: ${BRAND.navySoft};
    border-radius: 6px;
    border: 1px solid ${BRAND.line};
    border-left: 4px solid ${BRAND.red};
  }
  .rt-patient .f { min-width: 0; }
  .rt-patient .f.wide { grid-column: span 2; }
  .rt-patient label {
    display: block;
    font-size: 8.5px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: ${BRAND.muted};
    font-weight: 700;
    margin-bottom: 1px;
  }
  .rt-patient span.v {
    display: block;
    font-size: 11.5px;
    font-weight: 600;
    color: ${BRAND.ink};
    overflow-wrap: anywhere;
  }
  .rt-patient span.v.name {
    font-size: 13.5px;
    font-weight: 800;
    color: ${BRAND.navy};
  }

  /* Profile Title Bar */
  .rt-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 1.5mm 0 3mm;
    padding: 1.5mm 3mm;
    background: #f1f5f9;
    border-left: 3px solid ${BRAND.navyBlue};
    border-radius: 4px;
  }
  .rt-title h2 {
    margin: 0;
    font-size: 13px;
    font-weight: 800;
    color: ${BRAND.navy};
    letter-spacing: 0.03em;
  }
  .rt-title .meta {
    font-size: 10px;
    font-weight: 600;
    color: ${BRAND.muted};
  }

  /* EXACT TABLE ORDER: Test / result / unit / flags / references / (visual gauge) */
  table.rt-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    margin-top: 1.5mm;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    overflow: hidden;
  }
  .rt-table thead th {
    text-align: left;
    font-size: 10.5px;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #ffffff;
    background: linear-gradient(135deg, #0e2747 0%, #1a3c63 100%);
    padding: 8px 10px;
    border-bottom: 2.5px solid #2563eb;
  }
  .rt-table thead th:first-child {
    border-top-left-radius: 4px;
  }
  .rt-table thead th:last-child {
    border-top-right-radius: 4px;
  }
  .rt-table th.c-test { width: 32%; }
  .rt-table th.c-result { width: 18%; }
  .rt-table th.c-unit { width: 14%; }
  .rt-table th.c-flag { width: 12%; text-align: center; }
  .rt-table th.c-ref { width: 24%; }
  .rt-table th.c-chart { display: none; }

  /* When visual chart / gauge column is active */
  .rt-table.has-chart th.c-test { width: 29%; }
  .rt-table.has-chart th.c-result { width: 16%; }
  .rt-table.has-chart th.c-unit { width: 11%; }
  .rt-table.has-chart th.c-flag { width: 12%; text-align: center; }
  .rt-table.has-chart th.c-ref { width: 17%; }
  .rt-table.has-chart th.c-chart { width: 15%; text-align: center; display: table-cell; }

  .rt-table tbody td {
    padding: 6.5px 10px;
    border-bottom: 1px solid #e2e8f0;
    vertical-align: middle;
    font-size: 11.5px;
  }
  .rt-table tbody tr {
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .rt-table tbody tr:nth-child(even) td {
    background: #f8fafc;
  }
  .rt-table tbody tr:hover td {
    background: #f1f5f9;
  }
  .rt-table td.test {
    font-weight: 700;
    color: #0f172a;
    font-size: 12px;
  }
  .rt-table td.test small {
    display: block;
    font-weight: 500;
    font-size: 9px;
    color: #64748b;
    margin-top: 1px;
  }
  .rt-table td.result {
    font-family: 'JetBrains Mono', 'Inter', monospace;
    font-size: 12.5px;
    font-weight: 800;
    color: #0f172a;
  }
  .rt-table td.result.h {
    color: #b91c1c;
    background: #fef2f2;
    border-radius: 4px;
    padding: 2px 6px;
    display: inline-block;
  }
  .rt-table td.result.l {
    color: #1e40af;
    background: #eff6ff;
    border-radius: 4px;
    padding: 2px 6px;
    display: inline-block;
  }
  .rt-table td.result.c {
    color: #ffffff;
    background: #991b1b;
    border-radius: 4px;
    padding: 2px 6px;
    display: inline-block;
    font-weight: 900;
  }
  .rt-table td.unit {
    color: #475569;
    font-size: 11px;
    font-family: 'JetBrains Mono', monospace;
    font-weight: 600;
  }
  .rt-table td.flag {
    text-align: center;
  }
  .rt-table td.ref {
    color: #334155;
    font-size: 11px;
    font-weight: 600;
    font-family: 'JetBrains Mono', 'Inter', monospace;
  }
  .rt-table td.gauge-col {
    text-align: center;
  }

  /* Flags styling: clean, high contrast badges */
  .flag-tag {
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.05em;
    padding: 2px 7px;
    border-radius: 4px;
    display: inline-block;
    text-align: center;
  }
  .flag-high {
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fca5a5;
  }
  .flag-low {
    background: #dbeafe;
    color: #1e40af;
    border: 1px solid #bfdbfe;
  }
  .flag-panic {
    background: #991b1b;
    color: #ffffff;
    font-weight: 900;
    box-shadow: 0 1px 3px rgba(153, 27, 27, 0.4);
  }
  .flag-abnormal {
    background: #fef3c7;
    color: #b45309;
    border: 1px solid #fde68a;
  }
  .flag-normal {
    color: #065f46;
    background: #ecfdf5;
    border: 1px solid #a7f3d0;
    font-weight: 700;
  }
  .flag-none {
    color: #94a3b8;
  }

  /* Inline mini-gauge range bar */
  .rt-gauge-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 85px;
    margin: 0 auto;
  }
  .rt-gauge-track {
    position: relative;
    width: 100%;
    height: 7px;
    border-radius: 4px;
    background: #e2e8f0;
    display: flex;
    overflow: hidden;
    border: 1px solid #cbd5e1;
  }
  .rt-gauge-seg.low { width: 25%; height: 100%; background: #fed7aa; }
  .rt-gauge-seg.norm { width: 50%; height: 100%; background: #86efac; }
  .rt-gauge-seg.high { width: 25%; height: 100%; background: #fca5a5; }
  .rt-gauge-pin {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 9px;
    height: 9px;
    border-radius: 50%;
    border: 1.5px solid #ffffff;
    box-shadow: 0 1px 3px rgba(0,0,0,0.5);
  }
  .rt-gauge-labels {
    display: flex;
    justify-content: space-between;
    width: 100%;
    font-size: 7px;
    color: #64748b;
    font-weight: 700;
    margin-top: 1px;
    font-family: 'Inter', sans-serif;
  }

  /* CBC Diagnostic Visual Panel */
  .cbc-visual-panel {
    margin-top: 3.5mm;
    padding: 3mm 4mm;
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .cbc-visual-panel h3 {
    margin: 0 0 2mm;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.04em;
    color: #0e2747;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1.5px solid #cbd5e1;
    padding-bottom: 1.5mm;
  }
  .cbc-diff-bar {
    display: flex;
    height: 14px;
    border-radius: 5px;
    overflow: hidden;
    box-shadow: inset 0 1px 2px rgba(0,0,0,0.15);
    border: 1px solid #94a3b8;
    margin: 2mm 0 1.5mm;
  }
  .cbc-diff-seg {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 8px;
    font-weight: 800;
    color: #ffffff;
    overflow: hidden;
    white-space: nowrap;
  }
  .cbc-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 8.5px;
    font-weight: 700;
    color: #334155;
    margin-top: 1.5mm;
  }
  .cbc-legend-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .cbc-legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 2px;
  }
  .cbc-indices-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px 10px;
    margin-top: 2.5mm;
    padding-top: 2mm;
    border-top: 1px dashed #cbd5e1;
  }
  .cbc-index-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    padding: 4px 6px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .cbc-index-label {
    font-size: 8px;
    font-weight: 700;
    color: #475569;
  }
  .cbc-index-val {
    font-size: 11px;
    font-weight: 900;
    font-family: 'JetBrains Mono', monospace;
    color: #0f172a;
    margin: 1px 0;
  }
  .flag-none {
    color: #94a3b8;
  }

  /* Diagnostic Visual Panels (Applicable across all profiles) */
  .rt-diag-panel {
    margin-top: 3mm;
    margin-bottom: 2mm;
    padding: 2.5mm 3.5mm;
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .rt-diag-panel h3 {
    margin: 0 0 1.5mm;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 0.03em;
    color: #0e2747;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1.5px solid #cbd5e1;
    padding-bottom: 1mm;
  }
  .rt-diag-grid-4 {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 5px 8px;
    margin-top: 1.5mm;
  }
  .rt-diag-grid-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 5px 8px;
    margin-top: 1.5mm;
  }
  .rt-diag-grid-2 {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 6px 10px;
    margin-top: 1.5mm;
  }
  .rt-diag-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    padding: 3.5px 6px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .rt-diag-card-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 8px;
    font-weight: 700;
    color: #475569;
  }
  .rt-diag-val {
    font-size: 11px;
    font-weight: 900;
    font-family: 'JetBrains Mono', monospace;
    color: #0f172a;
    margin: 1px 0;
  }
  .rt-diag-sub {
    font-size: 7.5px;
    color: #64748b;
    font-weight: 500;
  }
  .rt-diag-badge {
    font-size: 7.5px;
    font-weight: 800;
    padding: 1px 4px;
    border-radius: 3px;
  }
  .rt-diag-badge.opt { background: #dcfce7; color: #15803d; }
  .rt-diag-badge.warn { background: #fef3c7; color: #b45309; }
  .rt-diag-badge.alert { background: #fee2e2; color: #b91c1c; }
  .rt-diag-badge.panic { background: #991b1b; color: #ffffff; }
  .rt-diag-badge.info { background: #eff6ff; color: #1e40af; }
  .rt-multi-bar-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 2.5px 0;
    border-bottom: 1px dashed #e2e8f0;
    font-size: 8.5px;
  }
  .rt-multi-bar-row:last-child {
    border-bottom: none;
  }
  .rt-multi-bar-label {
    width: 32%;
    font-weight: 700;
    color: #1e293b;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .rt-multi-bar-track-wrap {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .rt-multi-bar-val {
    width: 22%;
    text-align: right;
    font-family: 'JetBrains Mono', monospace;
    font-weight: 800;
    color: #0f172a;
  }

  /* Uncluttered Notes & Clinical Interpretation */
  .rt-note {
    margin-top: 4mm;
    padding: 3mm 4mm;
    border-radius: 6px;
    background: ${BRAND.redSoft};
    border-left: 3px solid ${BRAND.red};
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .rt-note h4 {
    margin: 0 0 1.5mm;
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: ${BRAND.red};
    font-weight: 800;
  }
  .rt-note p {
    margin: 0;
    font-size: 11px;
    line-height: 1.55;
    color: ${BRAND.ink};
    white-space: pre-wrap;
  }
  .rt-note.plain {
    background: ${BRAND.navySoft};
    border-left-color: ${BRAND.navyBlue};
  }
  .rt-note.plain h4 {
    color: ${BRAND.navyBlue};
  }

  .rt-film {
    margin-top: 3.5mm;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px 14px;
    font-size: 11px;
    padding: 2.5mm 3.5mm;
    border: 1px solid ${BRAND.line};
    border-radius: 6px;
    background: #fdfdfd;
    page-break-inside: avoid;
  }
  .rt-film b {
    color: ${BRAND.navy};
  }

  .rt-spacer {
    flex: 1;
    min-height: 5mm;
  }

  /* Signatures Section: clean, customizable, 1 to 3 columns */
  .rt-sign {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6mm;
    margin-top: 4mm;
    padding-top: 2mm;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .rt-sign .s {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .rt-sign .sig-handwritten {
    height: 9mm;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    margin-bottom: 1mm;
  }
  .rt-sign .line {
    width: 90%;
    height: 1px;
    border-bottom: 1.5px solid ${BRAND.navy};
    margin: 0 auto 2mm;
  }
  .rt-sign .role {
    font-size: 8.5px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: ${BRAND.muted};
    font-weight: 700;
  }
  .rt-sign .nm {
    font-size: 11.5px;
    font-weight: 800;
    color: ${BRAND.navy};
    margin-top: 1px;
  }
  .rt-sign .tt {
    font-size: 8.5px;
    color: ${BRAND.muted};
    margin-top: 0.5px;
    line-height: 1.3;
  }
  .rt-sign .lic {
    font-size: 8px;
    font-family: 'JetBrains Mono', monospace;
    color: ${BRAND.navyBlue};
    margin-top: 1px;
    font-weight: 600;
  }
  .rt-sign .stamp-box {
    margin-top: 2mm;
    border: 1.5px dashed ${BRAND.red};
    border-radius: 4px;
    padding: 1.5px 6px;
    background: ${BRAND.redSoft};
    font-size: 7.5px;
    line-height: 1.2;
    color: ${BRAND.redDark};
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    display: flex;
    flex-direction: column;
    align-items: center;
    transform: rotate(-1deg);
  }

  /* Footer */
  .rt-foot {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 4mm;
    padding-top: 2.5mm;
    border-top: 1px solid ${BRAND.line};
    font-size: 9px;
    color: ${BRAND.muted};
  }
  .rt-foot .end {
    color: ${BRAND.red};
    font-weight: 800;
    letter-spacing: 0.06em;
  }

  /* Recommended Follow-up Investigations */
  .rt-rec {
    margin-top: 3.5mm;
    padding: 3mm 4mm;
    border-radius: 6px;
    background: #f8fafc;
    border: 1px dashed ${BRAND.navyBlue};
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .rt-rec h4 {
    margin: 0 0 2mm;
    font-size: 9.5px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: ${BRAND.navyBlue};
    font-weight: 800;
  }
  .rt-rec-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }
  .rt-rec-badge {
    font-size: 9.5px;
    font-weight: 700;
    color: ${BRAND.navy};
    background: #ffffff;
    border: 1px solid #cbd5e1;
    padding: 2.5px 8px;
    border-radius: 4px;
    letter-spacing: 0.02em;
  }
  .rt-rec-disclaimer {
    margin-top: 2mm;
    font-size: 8px;
    color: ${BRAND.muted};
    font-style: italic;
  }

  /* Medical Atlas & Diagnostic Infographic Card */
  .rt-atlas {
    margin-top: 3.5mm;
    padding: 3mm 4mm;
    border-radius: 6px;
    background: ${BRAND.redSoft};
    border: 1px solid #fecdd3;
    border-left: 3.5px solid ${BRAND.red};
    display: flex;
    gap: 12px;
    align-items: center;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .rt-atlas-img {
    width: 140px;
    height: 80px;
    flex-shrink: 0;
    border-radius: 4px;
    overflow: hidden;
    background: #0f172a;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #e2e8f0;
  }
  .rt-atlas-img img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .rt-atlas-content {
    flex: 1;
    min-width: 0;
  }
  .rt-atlas-title {
    font-size: 11px;
    font-weight: 800;
    color: ${BRAND.red};
    margin-bottom: 2px;
  }
  .rt-atlas-desc {
    font-size: 9.5px;
    line-height: 1.45;
    color: ${BRAND.ink};
  }
  .rt-atlas-points {
    margin-top: 3px;
    font-size: 8.5px;
    color: #475569;
    font-weight: 600;
  }
`;

function signatureBlock(report: LabReport, lab?: LabInfo): string {
  const s = report.staff || (lab as any)?.staffSignatures || DEFAULT_STAFF;
  
  // If report explicitly hides signatures, omit
  if ((s as any)?.hideSignatures === true || (report as any)?.hideSignatures === true) {
    return '';
  }

  const defaultChemist = (lab as any)?.staffSignatures?.labChemist || DEFAULT_STAFF.labChemist;
  const defaultChemistTitle = (lab as any)?.staffSignatures?.chemistTitle || DEFAULT_STAFF.chemistTitle;
  const defaultChemistLicense = (lab as any)?.staffSignatures?.chemistLicense || DEFAULT_STAFF.chemistLicense;

  const defaultVerifier = (lab as any)?.staffSignatures?.verifiedBy || DEFAULT_STAFF.verifiedBy;
  const defaultVerifierTitle = (lab as any)?.staffSignatures?.verifierTitle || DEFAULT_STAFF.verifierTitle;
  const defaultVerifierLicense = (lab as any)?.staffSignatures?.verifierLicense || DEFAULT_STAFF.verifierLicense;

  const defaultPathologist = (lab as any)?.staffSignatures?.pathologist || DEFAULT_STAFF.pathologist;
  const defaultPathologistTitle = (lab as any)?.staffSignatures?.pathologistTitle || DEFAULT_STAFF.pathologistTitle;
  const defaultPathologistLicense = (lab as any)?.staffSignatures?.pathologistLicense || DEFAULT_STAFF.pathologistLicense;

  const blocks: { role: string; name: string; title: string; license?: string; isConsultant?: boolean }[] = [];

  const rawChemist = s.labChemist || defaultChemist;
  if (rawChemist && (s as any).showChemist !== false) {
    blocks.push({
      role: 'Laboratory Chemist',
      name: formatStaffName(rawChemist, 'Dr. Omar Fouad El-Kady'),
      title: formatStaffTitle(s.chemistTitle || defaultChemistTitle, 'Senior Clinical Chemist'),
      license: s.chemistLicense || defaultChemistLicense
    });
  }

  const rawVerifier = s.verifiedBy || defaultVerifier;
  if (rawVerifier && (s as any).showVerifier !== false) {
    blocks.push({
      role: 'Quality Verified By',
      name: formatStaffName(rawVerifier, 'Sara Ibrahim El-Sherbiny'),
      title: formatStaffTitle(s.verifierTitle || defaultVerifierTitle, 'Operations & Quality Manager'),
      license: s.verifierLicense || defaultVerifierLicense
    });
  }

  const rawPathologist = s.pathologist || defaultPathologist;
  if (rawPathologist && (s as any).showPathologist !== false) {
    blocks.push({
      role: 'Consultant Clinical Pathologist',
      name: formatStaffName(rawPathologist, 'Prof. Dr. Rami Mokhtar'),
      title: formatStaffTitle(s.pathologistTitle || defaultPathologistTitle, 'Consultant Clinical Pathologist - Kasr Al Ainy'),
      license: s.pathologistLicense || defaultPathologistLicense,
      isConsultant: true
    });
  }

  // Financial signature if enabled
  if ((s as any).financialDirector && (s as any).showFinancialSignature === true) {
    blocks.push({
      role: 'Chief Financial Officer',
      name: formatStaffName((s as any).financialDirector, 'Maged Hosny El-Sharkawy'),
      title: formatStaffTitle((s as any).financialTitle, 'Chief Financial Officer (CFO)'),
      license: (s as any).financialLicense
    });
  }

  // HR signature if enabled
  if ((s as any).hrDirector && (s as any).showHrSignature === true) {
    blocks.push({
      role: 'HR Director',
      name: formatStaffName((s as any).hrDirector, 'Ahmed Fathy El-Gammal'),
      title: formatStaffTitle((s as any).hrTitle, 'Human Resources Director'),
      license: (s as any).hrLicense
    });
  }

  if (!blocks.length) return '';

  return `<div class="rt-sign" style="grid-template-columns: repeat(${blocks.length}, 1fr);">
    ${blocks
      .map(
        b => `<div class="s">
          <div class="sig-handwritten">
            ${renderRealisticSignature(b.name, b.isConsultant)}
          </div>
          <div class="line"></div>
          <div class="role">${esc(b.role)}</div>
          <div class="nm">${esc(b.name)}</div>
          ${b.title ? `<div class="tt">${esc(b.title)}</div>` : ''}
          ${b.license ? `<div class="lic">Lic: ${esc(b.license)}</div>` : ''}
          ${b.isConsultant ? `
            <div class="stamp-box">
              <span>ELECTRONICALLY VERIFIED</span>
              <strong>RT-LAB CLINICAL PATHOLOGY</strong>
            </div>
          ` : ''}
        </div>`
      )
      .join('')}
  </div>`;
}

function cleanInvestigationName(raw?: string | null): string {
  if (!raw) return '—';
  let str = latin(raw, raw).trim();
  // Strip duplicate consecutive identical tokens or words (e.g. "Hemoglobin (Hemoglobin)" or "WBC - WBC" or "Glucose Glucose")
  const parensMatch = str.match(/^(.+?)\s*\(\s*\1\s*\)$/i);
  if (parensMatch) {
    return parensMatch[1].trim();
  }
  const parts = str.split(/\s*[-–—/:]\s+/);
  if (parts.length === 2 && parts[0].trim().toLowerCase() === parts[1].trim().toLowerCase()) {
    return parts[0].trim();
  }
  const words = str.split(/\s+/);
  if (words.length === 2 && words[0].toLowerCase() === words[1].toLowerCase()) {
    return words[0];
  }
  return str;
}

function calcPos(val: number | null, min: number, max: number): number {
  if (val === null || isNaN(val)) return 50;
  if (val < min) {
    const range = min * 0.5 || 1;
    return Math.max(5, 25 - ((min - val) / range) * 20);
  } else if (val > max) {
    const range = (max * 0.5) || 1;
    return Math.min(95, 75 + ((val - max) / range) * 20);
  } else {
    const span = max - min || 1;
    return 25 + ((val - min) / span) * 50;
  }
}

function calcColor(val: number | null, min: number, max: number): string {
  if (val === null || isNaN(val)) return '#94a3b8';
  if (val < min) return '#d97706'; // amber
  if (val > max) return '#dc2626'; // rose red
  return '#10b981'; // emerald
}

function renderRowGaugeHtml(p: TestParameter): string {
  const val = parseFloat(p.result || '');
  if (isNaN(val) || p.minNormal === undefined || p.maxNormal === undefined) {
    if (p.flag === 'NORMAL') {
      return `<span style="font-size: 8.5px; font-weight: 700; color: #059669; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 1.5px 6px; border-radius: 3px;">Normal</span>`;
    }
    if (p.flag === 'HIGH' || p.flag === 'ABNORMAL') {
      return `<span style="font-size: 8.5px; font-weight: 700; color: #dc2626; background: #fee2e2; border: 1px solid #fca5a5; padding: 1.5px 6px; border-radius: 3px;">Reactive</span>`;
    }
    return `<span style="color: #cbd5e1; text-align: center; display: block; font-size: 9px;">—</span>`;
  }
  const min = p.minNormal;
  const max = p.maxNormal;
  const pos = calcPos(val, min, max);
  const color = calcColor(val, min, max);

  return `<div class="rt-gauge-wrap">
    <div class="rt-gauge-track">
      <div class="rt-gauge-seg low" title="Low (< ${min})"></div>
      <div class="rt-gauge-seg norm" title="Normal (${min} - ${max})"></div>
      <div class="rt-gauge-seg high" title="High (> ${max})"></div>
      <div class="rt-gauge-pin" style="left: ${pos}%; background: ${color};" title="Value: ${val} (Ref: ${min} - ${max})"></div>
    </div>
    <div class="rt-gauge-labels">
      <span>L</span>
      <span style="color: #059669; font-weight: 800;">NOR</span>
      <span>H</span>
    </div>
  </div>`;
}

function getParam(params: TestParameter[], names: string[]): TestParameter | undefined {
  return params.find(p => {
    const pName = (p.name || '').toLowerCase();
    const pCode = ((p as any).code || '').toLowerCase();
    return names.some(n => pName.includes(n.toLowerCase()) || pCode === n.toLowerCase());
  });
}

function getNum(params: TestParameter[], names: string[]): number | null {
  const p = getParam(params, names);
  if (!p || !p.result) return null;
  const n = parseFloat(String(p.result).replace(/[^0-9.-]/g, ''));
  return isNaN(n) ? null : n;
}

export function isCbcProfile(profile: TestProfile): boolean {
  const code = (profile.profileCode || (profile as any).code || '').toUpperCase();
  const tEn = (profile.titleEn || '').toLowerCase();
  const tAr = (profile.titleAr || '');
  return code === 'CBC' || tEn.includes('complete blood') || tEn.includes('cbc') || tAr.includes('صورة دم');
}

export function isLipidProfile(profile: TestProfile): boolean {
  const code = (profile.profileCode || (profile as any).code || '').toUpperCase();
  const tEn = (profile.titleEn || '').toLowerCase();
  const tAr = (profile.titleAr || '');
  return code === 'LIPID' || tEn.includes('lipid') || tEn.includes('cholesterol') || tAr.includes('دهون') || tAr.includes('كوليسترول');
}

export function isLiverProfile(profile: TestProfile): boolean {
  const code = (profile.profileCode || (profile as any).code || '').toUpperCase();
  const tEn = (profile.titleEn || '').toLowerCase();
  const tAr = (profile.titleAr || '');
  return code === 'LFT' || tEn.includes('liver') || tEn.includes('hepatic') || tAr.includes('كبد') || tAr.includes('وظائف كبد');
}

export function isKidneyProfile(profile: TestProfile): boolean {
  const code = (profile.profileCode || (profile as any).code || '').toUpperCase();
  const tEn = (profile.titleEn || '').toLowerCase();
  const tAr = (profile.titleAr || '');
  return code === 'KFT' || code === 'RFT' || tEn.includes('kidney') || tEn.includes('renal') || tAr.includes('كلى') || tAr.includes('وظائف كلى');
}

export function isDiabetesProfile(profile: TestProfile): boolean {
  const code = (profile.profileCode || (profile as any).code || '').toUpperCase();
  const tEn = (profile.titleEn || '').toLowerCase();
  const tAr = (profile.titleAr || '');
  return code === 'GLYCEMIC' || code === 'DIABETES' || tEn.includes('diabetes') || tEn.includes('glycemic') || tEn.includes('glucose') || tEn.includes('hba1c') || tAr.includes('سكر');
}

export function isThyroidProfile(profile: TestProfile): boolean {
  const code = (profile.profileCode || (profile as any).code || '').toUpperCase();
  const tEn = (profile.titleEn || '').toLowerCase();
  const tAr = (profile.titleAr || '');
  return code === 'THYROID' || tEn.includes('thyroid') || tAr.includes('غدة') || tAr.includes('درقية');
}

export function isElectrolytesProfile(profile: TestProfile): boolean {
  const code = (profile.profileCode || (profile as any).code || '').toUpperCase();
  const tEn = (profile.titleEn || '').toLowerCase();
  const tAr = (profile.titleAr || '');
  return code === 'ELECTROLYTES' || tEn.includes('electrolyte') || tEn.includes('minerals') || tAr.includes('أملاح') || tAr.includes('شوارد');
}

export function isCoagulationProfile(profile: TestProfile): boolean {
  const code = (profile.profileCode || (profile as any).code || '').toUpperCase();
  const tEn = (profile.titleEn || '').toLowerCase();
  const tAr = (profile.titleAr || '');
  return code === 'COAG' || code === 'PT' || tEn.includes('coagulation') || tEn.includes('prothrombin') || tAr.includes('سيولة') || tAr.includes('تجلط');
}

export function isCardiacProfile(profile: TestProfile): boolean {
  const code = (profile.profileCode || (profile as any).code || '').toUpperCase();
  const tEn = (profile.titleEn || '').toLowerCase();
  const tAr = (profile.titleAr || '');
  return code === 'CARDIAC' || tEn.includes('cardiac') || tEn.includes('troponin') || tAr.includes('قلب');
}

export function isIronProfile(profile: TestProfile): boolean {
  const code = (profile.profileCode || (profile as any).code || '').toUpperCase();
  const tEn = (profile.titleEn || '').toLowerCase();
  const tAr = (profile.titleAr || '');
  return code === 'IRON' || code === 'ANEMIA' || tEn.includes('iron') || tEn.includes('ferritin') || tAr.includes('حديد') || tAr.includes('أنيميا');
}

export function isVitaminProfile(profile: TestProfile): boolean {
  const code = (profile.profileCode || (profile as any).code || '').toUpperCase();
  const tEn = (profile.titleEn || '').toLowerCase();
  const tAr = (profile.titleAr || '');
  return code === 'VITAMINS' || tEn.includes('vitamin') || tAr.includes('فيتامين');
}

export function renderCbcVisualsHtml(params: TestParameter[]): string {
  const cbcData = extractCBCData(params);
  const rbcSvg = generateCbcRbcSvgChart(cbcData, 320, 145);
  const pltSvg = generateCbcPltSvgChart(cbcData, 320, 145);

  const hb = cbcData.hb;
  const hct = cbcData.pcv;
  const mcv = cbcData.mcv;
  const plt = cbcData.plt;
  const wbc = cbcData.wbc;

  const neu = cbcData.neutrophils ?? 60;
  const lym = cbcData.lymphocytes ?? 30;
  const mono = cbcData.monocytes ?? 5;
  const eos = cbcData.eosinophils ?? 3;
  const baso = cbcData.basophils ?? 1;

  const diffTotal = (neu + lym + mono + eos + baso) || 100;
  const pNeu = ((neu / diffTotal) * 100).toFixed(1);
  const pLym = ((lym / diffTotal) * 100).toFixed(1);
  const pMono = ((mono / diffTotal) * 100).toFixed(1);
  const pEos = ((eos / diffTotal) * 100).toFixed(1);
  const pBaso = ((baso / diffTotal) * 100).toFixed(1);

  return `
  <div class="rt-diag-panel">
    <h3>
      <span>📊 Complete Blood Count (CBC) Diagnostic Graphics & Differential Spectrum</span>
      <span style="font-size: 8.5px; color: #2563eb; font-weight: 700;">Hematology Consensus</span>
    </h3>

    <!-- 5-Part Differential Histogram Bar -->
    <div style="font-size: 8.5px; font-weight: 800; color: #334155; margin-bottom: 1.5px; display: flex; justify-content: space-between;">
      <span>Automated Leukocyte Differential Spectrum ${wbc ? `(Total WBC: ${wbc} x10³/µL)` : ''}</span>
      <span>${cbcData.sizeClassification ? `RBC Morphology: <strong style="color: ${cbcData.sizeColor};">${cbcData.sizeClassification}</strong>` : ''}</span>
    </div>
    <div class="cbc-diff-bar">
      <div class="cbc-diff-seg" style="width: ${pNeu}%; background: #2563eb;" title="Neutrophils: ${neu}%">${neu >= 8 ? `Neu ${pNeu}%` : ''}</div>
      <div class="cbc-diff-seg" style="width: ${pLym}%; background: #7c3aed;" title="Lymphocytes: ${lym}%">${lym >= 8 ? `Lym ${pLym}%` : ''}</div>
      <div class="cbc-diff-seg" style="width: ${pMono}%; background: #d97706;" title="Monocytes: ${mono}%">${mono >= 4 ? `Mon` : ''}</div>
      <div class="cbc-diff-seg" style="width: ${pEos}%; background: #059669;" title="Eosinophils: ${eos}%">${eos >= 3 ? `Eos` : ''}</div>
      <div class="cbc-diff-seg" style="width: ${pBaso}%; background: #e11d48;" title="Basophils: ${baso}%"></div>
    </div>
    <div class="cbc-legend">
      <div class="cbc-legend-item"><span class="cbc-legend-dot" style="background:#2563eb;"></span> Neu: <strong>${neu}%</strong> (40-75%)</div>
      <div class="cbc-legend-item"><span class="cbc-legend-dot" style="background:#7c3aed;"></span> Lym: <strong>${lym}%</strong> (20-45%)</div>
      <div class="cbc-legend-item"><span class="cbc-legend-dot" style="background:#d97706;"></span> Mono: <strong>${mono}%</strong> (2-8%)</div>
      <div class="cbc-legend-item"><span class="cbc-legend-dot" style="background:#059669;"></span> Eos: <strong>${eos}%</strong> (1-5%)</div>
      <div class="cbc-legend-item"><span class="cbc-legend-dot" style="background:#e11d48;"></span> Baso: <strong>${baso}%</strong> (0-1%)</div>
    </div>

    <!-- Dual Histograms: RBC Price-Jones Curve & PLT Volume Curve -->
    <div style="display: flex; gap: 8px; justify-content: space-between; margin-top: 2mm;">
      <div style="flex: 1; border: 1px solid #e2e8f0; border-radius: 4px; padding: 2px; background: #ffffff;">
        ${rbcSvg}
      </div>
      <div style="flex: 1; border: 1px solid #e2e8f0; border-radius: 4px; padding: 2px; background: #ffffff;">
        ${pltSvg}
      </div>
    </div>

    <!-- Key Erythrocyte & Platelet Cards -->
    <div class="rt-diag-grid-4" style="margin-top: 2mm;">
      <div class="rt-diag-card">
        <div class="rt-diag-card-head"><span>Hemoglobin (Hb)</span><span class="rt-diag-sub">12-17.5 g/dL</span></div>
        <div class="rt-diag-val">${hb !== null ? `${hb} g/dL` : '—'}</div>
        <div class="rt-gauge-track"><div class="rt-gauge-seg low"></div><div class="rt-gauge-seg norm"></div><div class="rt-gauge-seg high"></div><div class="rt-gauge-pin" style="left:${calcPos(hb, 12, 17.5)}%; background:${calcColor(hb, 12, 17.5)};"></div></div>
      </div>
      <div class="rt-diag-card">
        <div class="rt-diag-card-head"><span>Hematocrit (HCT)</span><span class="rt-diag-sub">36-52 %</span></div>
        <div class="rt-diag-val">${hct !== null ? `${hct} %` : '—'}</div>
        <div class="rt-gauge-track"><div class="rt-gauge-seg low"></div><div class="rt-gauge-seg norm"></div><div class="rt-gauge-seg high"></div><div class="rt-gauge-pin" style="left:${calcPos(hct, 36, 52)}%; background:${calcColor(hct, 36, 52)};"></div></div>
      </div>
      <div class="rt-diag-card">
        <div class="rt-diag-card-head"><span>MCV (Size Index)</span><span class="rt-diag-sub">80-100 fL</span></div>
        <div class="rt-diag-val">${mcv !== null ? `${mcv} fL` : '—'}</div>
        <div class="rt-gauge-track"><div class="rt-gauge-seg low"></div><div class="rt-gauge-seg norm"></div><div class="rt-gauge-seg high"></div><div class="rt-gauge-pin" style="left:${calcPos(mcv, 80, 100)}%; background:${calcColor(mcv, 80, 100)};"></div></div>
      </div>
      <div class="rt-diag-card">
        <div class="rt-diag-card-head"><span>Platelets (PLT)</span><span class="rt-diag-sub">150-450k</span></div>
        <div class="rt-diag-val">${plt !== null ? `${plt} x10³/µL` : '—'}</div>
        <div class="rt-gauge-track"><div class="rt-gauge-seg low"></div><div class="rt-gauge-seg norm"></div><div class="rt-gauge-seg high"></div><div class="rt-gauge-pin" style="left:${calcPos(plt, 150, 450)}%; background:${calcColor(plt, 150, 450)};"></div></div>
      </div>
    </div>
  </div>`;
}

export function renderLipidVisualsHtml(params: TestParameter[]): string {
  const chol = getNum(params, ['cholesterol', 'total chol']);
  const trig = getNum(params, ['triglyceride', 'tg']);
  const hdl = getNum(params, ['hdl', 'high density']);
  const ldl = getNum(params, ['ldl', 'low density']);
  const ratio = (chol && hdl) ? +(chol / hdl).toFixed(2) : null;

  const isHighRisk = (chol && chol >= 240) || (ldl && ldl >= 160) || (trig && trig >= 200) || (ratio && ratio >= 5.0);
  const isBorderline = !isHighRisk && ((chol && chol >= 200) || (ldl && ldl >= 130) || (trig && trig >= 150) || (ratio && ratio >= 4.0));
  const statusText = isHighRisk ? 'Atherogenic Risk: High' : isBorderline ? 'Atherogenic Risk: Borderline' : 'Atherogenic Risk: Desirable';

  return `
  <div class="rt-diag-panel">
    <h3>
      <span>📊 Lipid Profile & Atherogenic Cardiovascular Risk Evaluation</span>
      <span class="rt-diag-badge ${isHighRisk ? 'alert' : isBorderline ? 'warn' : 'opt'}">${statusText}</span>
    </h3>
    <div class="rt-diag-grid-4">
      <div class="rt-diag-card">
        <div class="rt-diag-card-head"><span>Total Cholesterol</span><span class="rt-diag-sub">< 200 mg/dL</span></div>
        <div class="rt-diag-val" style="color:${(chol && chol >= 200)?'#b91c1c':'#0f172a'};">${chol !== null ? `${chol} mg/dL` : '—'}</div>
        <div class="rt-gauge-track"><div class="rt-gauge-seg norm" style="width:65%;"></div><div class="rt-gauge-seg high" style="width:35%;"></div><div class="rt-gauge-pin" style="left:${calcPos(chol, 120, 260)}%; background:${(chol&&chol>=200)?'#b91c1c':'#15803d'};"></div></div>
      </div>
      <div class="rt-diag-card">
        <div class="rt-diag-card-head"><span>Triglycerides</span><span class="rt-diag-sub">< 150 mg/dL</span></div>
        <div class="rt-diag-val" style="color:${(trig && trig >= 150)?'#b91c1c':'#0f172a'};">${trig !== null ? `${trig} mg/dL` : '—'}</div>
        <div class="rt-gauge-track"><div class="rt-gauge-seg norm" style="width:60%;"></div><div class="rt-gauge-seg high" style="width:40%;"></div><div class="rt-gauge-pin" style="left:${calcPos(trig, 50, 250)}%; background:${(trig&&trig>=150)?'#b91c1c':'#15803d'};"></div></div>
      </div>
      <div class="rt-diag-card">
        <div class="rt-diag-card-head"><span>HDL-C (Protective)</span><span class="rt-diag-sub">> 40 mg/dL</span></div>
        <div class="rt-diag-val" style="color:${(hdl && hdl < 40)?'#b91c1c':'#15803d'};">${hdl !== null ? `${hdl} mg/dL` : '—'}</div>
        <div class="rt-gauge-track"><div class="rt-gauge-seg low" style="width:40%;"></div><div class="rt-gauge-seg norm" style="width:60%;"></div><div class="rt-gauge-pin" style="left:${calcPos(hdl, 25, 75)}%; background:${(hdl&&hdl<40)?'#b91c1c':'#15803d'};"></div></div>
      </div>
      <div class="rt-diag-card">
        <div class="rt-diag-card-head"><span>LDL-C (Atherogenic)</span><span class="rt-diag-sub">< 100 mg/dL</span></div>
        <div class="rt-diag-val" style="color:${(ldl && ldl >= 100)?'#b91c1c':'#0f172a'};">${ldl !== null ? `${ldl} mg/dL` : '—'}</div>
        <div class="rt-gauge-track"><div class="rt-gauge-seg norm" style="width:55%;"></div><div class="rt-gauge-seg high" style="width:45%;"></div><div class="rt-gauge-pin" style="left:${calcPos(ldl, 60, 190)}%; background:${(ldl&&ldl>=100)?'#b91c1c':'#15803d'};"></div></div>
      </div>
    </div>
    ${ratio !== null ? `
      <div style="margin-top: 1.5mm; padding-top: 1.5mm; border-top: 1px dashed #cbd5e1; display:flex; justify-content:space-between; align-items:center; font-size:8.5px;">
        <span>Cardiovascular Risk Ratio (Chol / HDL): <strong style="font-family:'JetBrains Mono'; font-size:10px; color:${ratio>=4.5?'#b91c1c':'#15803d'};">${ratio}</strong> (Desirable < 4.5)</span>
        <span style="color:#64748b;">NCEP ATP III / ACC Guidelines</span>
      </div>
    ` : ''}
  </div>`;
}

export function renderLiverVisualsHtml(params: TestParameter[]): string {
  const alt = getNum(params, ['alt', 'sgpt']);
  const ast = getNum(params, ['ast', 'sgot']);
  const tb = getNum(params, ['total bilirubin', 't. bili']);
  const alb = getNum(params, ['albumin']);
  const deRitis = (alt && ast) ? +(ast / alt).toFixed(2) : null;

  return `
  <div class="rt-diag-panel">
    <h3>
      <span>📊 Hepatic Biomarkers & Hepatocellular Integrity Evaluation (LFTs)</span>
      <span class="rt-diag-badge info">De Ritis Ratio (AST/ALT): <strong>${deRitis ?? '—'}</strong></span>
    </h3>
    <div class="rt-diag-grid-4">
      <div class="rt-diag-card">
        <div class="rt-diag-card-head"><span>ALT / SGPT</span><span class="rt-diag-sub">Up to 45 U/L</span></div>
        <div class="rt-diag-val" style="color:${(alt && alt > 45)?'#b91c1c':'#0f172a'};">${alt !== null ? `${alt} U/L` : '—'}</div>
        <div class="rt-gauge-track"><div class="rt-gauge-seg norm" style="width:65%;"></div><div class="rt-gauge-seg high" style="width:35%;"></div><div class="rt-gauge-pin" style="left:${calcPos(alt, 10, 80)}%; background:${(alt&&alt>45)?'#b91c1c':'#15803d'};"></div></div>
      </div>
      <div class="rt-diag-card">
        <div class="rt-diag-card-head"><span>AST / SGOT</span><span class="rt-diag-sub">Up to 40 U/L</span></div>
        <div class="rt-diag-val" style="color:${(ast && ast > 40)?'#b91c1c':'#0f172a'};">${ast !== null ? `${ast} U/L` : '—'}</div>
        <div class="rt-gauge-track"><div class="rt-gauge-seg norm" style="width:65%;"></div><div class="rt-gauge-seg high" style="width:35%;"></div><div class="rt-gauge-pin" style="left:${calcPos(ast, 10, 80)}%; background:${(ast&&ast>40)?'#b91c1c':'#15803d'};"></div></div>
      </div>
      <div class="rt-diag-card">
        <div class="rt-diag-card-head"><span>Total Bilirubin</span><span class="rt-diag-sub">0.2 - 1.2 mg/dL</span></div>
        <div class="rt-diag-val" style="color:${(tb && tb > 1.2)?'#b91c1c':'#0f172a'};">${tb !== null ? `${tb} mg/dL` : '—'}</div>
        <div class="rt-gauge-track"><div class="rt-gauge-seg norm" style="width:65%;"></div><div class="rt-gauge-seg high" style="width:35%;"></div><div class="rt-gauge-pin" style="left:${calcPos(tb, 0.2, 2.0)}%; background:${(tb&&tb>1.2)?'#b91c1c':'#15803d'};"></div></div>
      </div>
      <div class="rt-diag-card">
        <div class="rt-diag-card-head"><span>Serum Albumin</span><span class="rt-diag-sub">3.5 - 5.0 g/dL</span></div>
        <div class="rt-diag-val" style="color:${(alb && alb < 3.5)?'#b91c1c':'#0f172a'};">${alb !== null ? `${alb} g/dL` : '—'}</div>
        <div class="rt-gauge-track"><div class="rt-gauge-seg low" style="width:30%;"></div><div class="rt-gauge-seg norm" style="width:70%;"></div><div class="rt-gauge-pin" style="left:${calcPos(alb, 2.5, 5.5)}%; background:${(alb&&alb<3.5)?'#b91c1c':'#15803d'};"></div></div>
      </div>
    </div>
  </div>`;
}

export function renderKidneyVisualsHtml(params: TestParameter[], patient?: { age?: number; gender?: string }): string {
  const cr = getNum(params, ['creatinine', 'serum creatinine']);
  const urea = getNum(params, ['urea', 'blood urea']);
  const bun = getNum(params, ['bun']);
  const ua = getNum(params, ['uric acid']);

  let egfr: number | null = null;
  if (cr && patient?.age) {
    const age = patient.age;
    const isFemale = (patient.gender || '').toLowerCase().includes('f') || (patient.gender || '').includes('أنثى');
    const factor = isFemale ? 0.85 : 1.0;
    egfr = Math.round((((140 - age) * 72) / (72 * cr)) * factor);
  }

  const ckdStage = egfr === null ? '' :
    egfr >= 90 ? 'G1 (Normal / High)' :
    egfr >= 60 ? 'G2 (Mild Decrease)' :
    egfr >= 30 ? 'G3 (Moderate Decrease)' :
    egfr >= 15 ? 'G4 (Severe Decrease)' : 'G5 (Kidney Failure)';

  return `
  <div class="rt-diag-panel">
    <h3>
      <span>📊 Renal Function Biomarkers & Glomerular Clearance (KFT)</span>
      <span class="rt-diag-badge ${egfr !== null && egfr < 60 ? 'alert' : 'opt'}">${egfr !== null ? `Estimated eGFR: ${egfr} mL/min/1.73m² (${ckdStage})` : 'Renal Profile'}</span>
    </h3>
    <div class="rt-diag-grid-3">
      <div class="rt-diag-card">
        <div class="rt-diag-card-head"><span>Serum Creatinine</span><span class="rt-diag-sub">0.6 - 1.2 mg/dL</span></div>
        <div class="rt-diag-val" style="color:${(cr && cr > 1.2)?'#b91c1c':'#0f172a'};">${cr !== null ? `${cr} mg/dL` : '—'}</div>
        <div class="rt-gauge-track"><div class="rt-gauge-seg norm" style="width:65%;"></div><div class="rt-gauge-seg high" style="width:35%;"></div><div class="rt-gauge-pin" style="left:${calcPos(cr, 0.4, 2.0)}%; background:${(cr&&cr>1.2)?'#b91c1c':'#15803d'};"></div></div>
      </div>
      <div class="rt-diag-card">
        <div class="rt-diag-card-head"><span>Blood Urea / BUN</span><span class="rt-diag-sub">15 - 45 mg/dL</span></div>
        <div class="rt-diag-val" style="color:${(urea && urea > 45)?'#b91c1c':'#0f172a'};">${urea !== null ? `${urea} mg/dL` : (bun !== null ? `${bun} mg/dL (BUN)` : '—')}</div>
        <div class="rt-gauge-track"><div class="rt-gauge-seg norm" style="width:65%;"></div><div class="rt-gauge-seg high" style="width:35%;"></div><div class="rt-gauge-pin" style="left:${calcPos(urea || (bun ? bun * 2.14 : null), 15, 65)}%; background:${((urea&&urea>45)||(bun&&bun>25))?'#b91c1c':'#15803d'};"></div></div>
      </div>
      <div class="rt-diag-card">
        <div class="rt-diag-card-head"><span>Uric Acid</span><span class="rt-diag-sub">3.5 - 7.2 mg/dL</span></div>
        <div class="rt-diag-val" style="color:${(ua && ua > 7.2)?'#b91c1c':'#0f172a'};">${ua !== null ? `${ua} mg/dL` : '—'}</div>
        <div class="rt-gauge-track"><div class="rt-gauge-seg norm" style="width:65%;"></div><div class="rt-gauge-seg high" style="width:35%;"></div><div class="rt-gauge-pin" style="left:${calcPos(ua, 2.5, 9.5)}%; background:${(ua&&ua>7.2)?'#b91c1c':'#15803d'};"></div></div>
      </div>
    </div>
  </div>`;
}

export function renderDiabetesVisualsHtml(params: TestParameter[]): string {
  const fbs = getNum(params, ['fasting blood sugar', 'fasting glucose', 'fbs']);
  const pps = getNum(params, ['2 hours post', 'post prandial', 'ppbs', 'rbs', 'random blood']);
  const a1c = getNum(params, ['hba1c', 'glycated hemoglobin', 'a1c']);
  const eag = a1c ? Math.round(28.7 * a1c - 46.7) : null;

  const a1cStatus = !a1c ? '' :
    a1c < 5.7 ? 'Normal Glycemia' :
    a1c <= 6.4 ? 'Pre-diabetes (Impaired Glucose)' :
    a1c <= 7.0 ? 'Diabetes: Well Controlled' :
    a1c <= 8.0 ? 'Diabetes: Fair Control' : 'Diabetes: Uncontrolled';

  return `
  <div class="rt-diag-panel">
    <h3>
      <span>📊 Glycemic Target Spectrum & Diabetes Control Index</span>
      <span class="rt-diag-badge ${a1c && a1c >= 6.5 ? 'alert' : (a1c && a1c >= 5.7 ? 'warn' : 'opt')}">${a1c ? a1cStatus : 'Diabetes Profile'}</span>
    </h3>
    <div class="rt-diag-grid-3">
      <div class="rt-diag-card">
        <div class="rt-diag-card-head"><span>Fasting Plasma Glucose</span><span class="rt-diag-sub">70 - 100 mg/dL</span></div>
        <div class="rt-diag-val" style="color:${(fbs && fbs >= 100)?'#b91c1c':'#0f172a'};">${fbs !== null ? `${fbs} mg/dL` : '—'}</div>
        <div class="rt-gauge-track"><div class="rt-gauge-seg norm" style="width:55%;"></div><div class="rt-gauge-seg high" style="width:45%;"></div><div class="rt-gauge-pin" style="left:${calcPos(fbs, 60, 160)}%; background:${(fbs&&fbs>=100)?'#b91c1c':'#15803d'};"></div></div>
      </div>
      <div class="rt-diag-card">
        <div class="rt-diag-card-head"><span>Post-Prandial / Random</span><span class="rt-diag-sub">< 140 mg/dL</span></div>
        <div class="rt-diag-val" style="color:${(pps && pps >= 140)?'#b91c1c':'#0f172a'};">${pps !== null ? `${pps} mg/dL` : '—'}</div>
        <div class="rt-gauge-track"><div class="rt-gauge-seg norm" style="width:60%;"></div><div class="rt-gauge-seg high" style="width:40%;"></div><div class="rt-gauge-pin" style="left:${calcPos(pps, 70, 220)}%; background:${(pps&&pps>=140)?'#b91c1c':'#15803d'};"></div></div>
      </div>
      <div class="rt-diag-card">
        <div class="rt-diag-card-head"><span>HbA1c (Glycated Hb)</span><span class="rt-diag-sub">Normal < 5.7 %</span></div>
        <div class="rt-diag-val" style="color:${(a1c && a1c >= 5.7)?'#b91c1c':'#0f172a'};">${a1c !== null ? `${a1c} %` : '—'}</div>
        <div class="rt-gauge-track"><div class="rt-gauge-seg norm" style="width:45%;"></div><div class="rt-gauge-seg high" style="width:55%;"></div><div class="rt-gauge-pin" style="left:${calcPos(a1c, 4.0, 11.0)}%; background:${(a1c&&a1c>=5.7)?'#b91c1c':'#15803d'};"></div></div>
      </div>
    </div>
    ${eag !== null ? `
      <div style="margin-top: 1.5mm; padding-top: 1.5mm; border-top: 1px dashed #cbd5e1; display:flex; justify-content:space-between; align-items:center; font-size:8.5px;">
        <span>Estimated Average Glucose (eAG): <strong style="font-family:'JetBrains Mono'; font-size:10px; color:${eag>154?'#b91c1c':'#15803d'};">${eag} mg/dL</strong></span>
        <span style="color:#64748b;">American Diabetes Association (ADA) Consensus</span>
      </div>
    ` : ''}
  </div>`;
}

export function renderThyroidVisualsHtml(params: TestParameter[]): string {
  const tsh = getNum(params, ['tsh', 'thyroid stimulating']);
  const ft4 = getNum(params, ['free t4', 'ft4']);
  const ft3 = getNum(params, ['free t3', 'ft3']);

  const status = (!tsh) ? 'Thyroid Hormonal Axis' :
    (tsh > 4.5 && ft4 && ft4 < 0.8) ? 'Primary Hypothyroidism' :
    (tsh > 4.5) ? 'Subclinical Hypothyroidism' :
    (tsh < 0.4 && ft4 && ft4 > 1.8) ? 'Primary Hyperthyroidism' :
    (tsh < 0.4) ? 'Subclinical Hyperthyroidism' : 'Euthyroid State (Normal Function)';

  return `
  <div class="rt-diag-panel">
    <h3>
      <span>📊 Thyroid Hormonal Axis & Pituitary Feedback (TSH, FT3, FT4)</span>
      <span class="rt-diag-badge ${tsh && (tsh > 4.5 || tsh < 0.4) ? 'warn' : 'opt'}">${status}</span>
    </h3>
    <div class="rt-diag-grid-3">
      <div class="rt-diag-card">
        <div class="rt-diag-card-head"><span>TSH (Thyrotropin)</span><span class="rt-diag-sub">0.4 - 4.5 µIU/mL</span></div>
        <div class="rt-diag-val">${tsh !== null ? `${tsh} µIU/mL` : '—'}</div>
        <div class="rt-gauge-track"><div class="rt-gauge-seg low"></div><div class="rt-gauge-seg norm"></div><div class="rt-gauge-seg high"></div><div class="rt-gauge-pin" style="left:${calcPos(tsh, 0.4, 4.5)}%; background:${calcColor(tsh, 0.4, 4.5)};"></div></div>
      </div>
      <div class="rt-diag-card">
        <div class="rt-diag-card-head"><span>Free T4</span><span class="rt-diag-sub">0.8 - 1.8 ng/dL</span></div>
        <div class="rt-diag-val">${ft4 !== null ? `${ft4} ng/dL` : '—'}</div>
        <div class="rt-gauge-track"><div class="rt-gauge-seg low"></div><div class="rt-gauge-seg norm"></div><div class="rt-gauge-seg high"></div><div class="rt-gauge-pin" style="left:${calcPos(ft4, 0.8, 1.8)}%; background:${calcColor(ft4, 0.8, 1.8)};"></div></div>
      </div>
      <div class="rt-diag-card">
        <div class="rt-diag-card-head"><span>Free T3</span><span class="rt-diag-sub">2.0 - 4.4 pg/mL</span></div>
        <div class="rt-diag-val">${ft3 !== null ? `${ft3} pg/mL` : '—'}</div>
        <div class="rt-gauge-track"><div class="rt-gauge-seg low"></div><div class="rt-gauge-seg norm"></div><div class="rt-gauge-seg high"></div><div class="rt-gauge-pin" style="left:${calcPos(ft3, 2.0, 4.4)}%; background:${calcColor(ft3, 2.0, 4.4)};"></div></div>
      </div>
    </div>
  </div>`;
}

export function renderElectrolytesVisualsHtml(params: TestParameter[]): string {
  const na = getNum(params, ['sodium', 'na']);
  const k = getNum(params, ['potassium', 'k']);
  const cl = getNum(params, ['chloride', 'cl']);
  const ca = getNum(params, ['calcium', 'ca']);

  return `
  <div class="rt-diag-panel">
    <h3>
      <span>📊 Serum Electrolytes & Mineral Homeostasis Scale</span>
      <span class="rt-diag-badge ${k && (k < 3.5 || k > 5.1) ? 'alert' : 'opt'}">Ion Balance</span>
    </h3>
    <div class="rt-diag-grid-4">
      <div class="rt-diag-card">
        <div class="rt-diag-card-head"><span>Sodium (Na+)</span><span class="rt-diag-sub">135 - 145 mmol/L</span></div>
        <div class="rt-diag-val">${na !== null ? `${na} mmol/L` : '—'}</div>
        <div class="rt-gauge-track"><div class="rt-gauge-seg low"></div><div class="rt-gauge-seg norm"></div><div class="rt-gauge-seg high"></div><div class="rt-gauge-pin" style="left:${calcPos(na, 135, 145)}%; background:${calcColor(na, 135, 145)};"></div></div>
      </div>
      <div class="rt-diag-card">
        <div class="rt-diag-card-head"><span>Potassium (K+)</span><span class="rt-diag-sub">3.5 - 5.1 mmol/L</span></div>
        <div class="rt-diag-val">${k !== null ? `${k} mmol/L` : '—'}</div>
        <div class="rt-gauge-track"><div class="rt-gauge-seg low"></div><div class="rt-gauge-seg norm"></div><div class="rt-gauge-seg high"></div><div class="rt-gauge-pin" style="left:${calcPos(k, 3.5, 5.1)}%; background:${calcColor(k, 3.5, 5.1)};"></div></div>
      </div>
      <div class="rt-diag-card">
        <div class="rt-diag-card-head"><span>Chloride (Cl-)</span><span class="rt-diag-sub">98 - 107 mmol/L</span></div>
        <div class="rt-diag-val">${cl !== null ? `${cl} mmol/L` : '—'}</div>
        <div class="rt-gauge-track"><div class="rt-gauge-seg low"></div><div class="rt-gauge-seg norm"></div><div class="rt-gauge-seg high"></div><div class="rt-gauge-pin" style="left:${calcPos(cl, 98, 107)}%; background:${calcColor(cl, 98, 107)};"></div></div>
      </div>
      <div class="rt-diag-card">
        <div class="rt-diag-card-head"><span>Total Calcium (Ca++)</span><span class="rt-diag-sub">8.5 - 10.5 mg/dL</span></div>
        <div class="rt-diag-val">${ca !== null ? `${ca} mg/dL` : '—'}</div>
        <div class="rt-gauge-track"><div class="rt-gauge-seg low"></div><div class="rt-gauge-seg norm"></div><div class="rt-gauge-seg high"></div><div class="rt-gauge-pin" style="left:${calcPos(ca, 8.5, 10.5)}%; background:${calcColor(ca, 8.5, 10.5)};"></div></div>
      </div>
    </div>
  </div>`;
}

export function renderCoagulationVisualsHtml(params: TestParameter[]): string {
  const pt = getNum(params, ['prothrombin time', 'pt']);
  const inr = getNum(params, ['inr']);
  const ptt = getNum(params, ['ptt', 'aptt']);

  const inrStatus = inr === null ? '' :
    inr < 0.8 ? 'Hypercoagulable Risk' :
    inr <= 1.2 ? 'Normal (Non-Anticoagulated)' :
    inr <= 3.0 ? 'Therapeutic Window (Warfarin Target)' :
    inr <= 3.5 ? 'Mechanical Valve Target' : 'High Bleeding Risk (Action Advised)';

  return `
  <div class="rt-diag-panel">
    <h3>
      <span>📊 Coagulation Cascade & Anticoagulant Monitoring (PT / INR)</span>
      <span class="rt-diag-badge ${inr && inr > 3.5 ? 'alert' : 'opt'}">${inr ? inrStatus : 'Coagulation Profile'}</span>
    </h3>
    <div class="rt-diag-grid-3">
      <div class="rt-diag-card">
        <div class="rt-diag-card-head"><span>INR (Ratio)</span><span class="rt-diag-sub">0.8 - 1.2 (Norm)</span></div>
        <div class="rt-diag-val">${inr !== null ? inr : '—'}</div>
        <div class="rt-gauge-track"><div class="rt-gauge-seg norm" style="width:40%;"></div><div class="rt-gauge-seg low" style="width:35%; background:#a7f3d0;" title="Warfarin 2-3"></div><div class="rt-gauge-seg high" style="width:25%;"></div><div class="rt-gauge-pin" style="left:${calcPos(inr, 0.8, 3.5)}%; background:${(inr&&inr>3.5)?'#b91c1c':'#15803d'};"></div></div>
      </div>
      <div class="rt-diag-card">
        <div class="rt-diag-card-head"><span>PT (Prothrombin Time)</span><span class="rt-diag-sub">11.0 - 14.5 sec</span></div>
        <div class="rt-diag-val">${pt !== null ? `${pt} sec` : '—'}</div>
        <div class="rt-gauge-track"><div class="rt-gauge-seg low"></div><div class="rt-gauge-seg norm"></div><div class="rt-gauge-seg high"></div><div class="rt-gauge-pin" style="left:${calcPos(pt, 11.0, 14.5)}%; background:${calcColor(pt, 11.0, 14.5)};"></div></div>
      </div>
      <div class="rt-diag-card">
        <div class="rt-diag-card-head"><span>aPTT / PTT</span><span class="rt-diag-sub">25.0 - 38.0 sec</span></div>
        <div class="rt-diag-val">${ptt !== null ? `${ptt} sec` : '—'}</div>
        <div class="rt-gauge-track"><div class="rt-gauge-seg low"></div><div class="rt-gauge-seg norm"></div><div class="rt-gauge-seg high"></div><div class="rt-gauge-pin" style="left:${calcPos(ptt, 25.0, 38.0)}%; background:${calcColor(ptt, 25.0, 38.0)};"></div></div>
      </div>
    </div>
  </div>`;
}

export function renderCardiacVisualsHtml(params: TestParameter[]): string {
  const trop = getNum(params, ['troponin', 'trop']);
  const ckmb = getNum(params, ['ck-mb', 'ckmb']);
  const ck = getNum(params, ['total ck', 'cpk']);

  return `
  <div class="rt-diag-panel">
    <h3>
      <span>📊 Cardiac Biomarkers & Myocardial Necrosis Surveillance</span>
      <span class="rt-diag-badge ${trop && trop > 0.04 ? 'panic' : 'opt'}">${trop && trop > 0.04 ? 'Critical: Myocardial Injury Detected' : 'Cardiac Baseline'}</span>
    </h3>
    <div class="rt-diag-grid-3">
      <div class="rt-diag-card">
        <div class="rt-diag-card-head"><span>Troponin I / T</span><span class="rt-diag-sub">< 0.04 ng/mL</span></div>
        <div class="rt-diag-val" style="color:${(trop && trop > 0.04)?'#b91c1c':'#0f172a'};">${trop !== null ? `${trop} ng/mL` : '—'}</div>
        <div class="rt-gauge-track"><div class="rt-gauge-seg norm" style="width:70%;"></div><div class="rt-gauge-seg high" style="width:30%;"></div><div class="rt-gauge-pin" style="left:${calcPos(trop, 0, 0.1)}%; background:${(trop&&trop>0.04)?'#b91c1c':'#15803d'};"></div></div>
      </div>
      <div class="rt-diag-card">
        <div class="rt-diag-card-head"><span>CK-MB</span><span class="rt-diag-sub">< 25 U/L</span></div>
        <div class="rt-diag-val" style="color:${(ckmb && ckmb > 25)?'#b91c1c':'#0f172a'};">${ckmb !== null ? `${ckmb} U/L` : '—'}</div>
        <div class="rt-gauge-track"><div class="rt-gauge-seg norm" style="width:70%;"></div><div class="rt-gauge-seg high" style="width:30%;"></div><div class="rt-gauge-pin" style="left:${calcPos(ckmb, 0, 50)}%; background:${(ckmb&&ckmb>25)?'#b91c1c':'#15803d'};"></div></div>
      </div>
      <div class="rt-diag-card">
        <div class="rt-diag-card-head"><span>Total CK</span><span class="rt-diag-sub">24 - 195 U/L</span></div>
        <div class="rt-diag-val">${ck !== null ? `${ck} U/L` : '—'}</div>
        <div class="rt-gauge-track"><div class="rt-gauge-seg norm" style="width:70%;"></div><div class="rt-gauge-seg high" style="width:30%;"></div><div class="rt-gauge-pin" style="left:${calcPos(ck, 24, 195)}%; background:${calcColor(ck, 24, 195)};"></div></div>
      </div>
    </div>
  </div>`;
}

export function renderIronVisualsHtml(params: TestParameter[]): string {
  const fe = getNum(params, ['serum iron', 'iron']);
  const ferr = getNum(params, ['ferritin']);
  const tibc = getNum(params, ['tibc', 'total iron']);
  const sat = (fe && tibc) ? Math.round((fe / tibc) * 100) : null;

  return `
  <div class="rt-diag-panel">
    <h3>
      <span>📊 Iron Metabolism & Storage Capacity Scale</span>
      <span class="rt-diag-badge ${sat && sat < 15 ? 'alert' : 'opt'}">${sat !== null ? `Transferrin Saturation: ${sat}%` : 'Iron Studies'}</span>
    </h3>
    <div class="rt-diag-grid-4">
      <div class="rt-diag-card">
        <div class="rt-diag-card-head"><span>Serum Iron</span><span class="rt-diag-sub">60 - 170 µg/dL</span></div>
        <div class="rt-diag-val">${fe !== null ? `${fe} µg/dL` : '—'}</div>
        <div class="rt-gauge-track"><div class="rt-gauge-seg low"></div><div class="rt-gauge-seg norm"></div><div class="rt-gauge-seg high"></div><div class="rt-gauge-pin" style="left:${calcPos(fe, 60, 170)}%; background:${calcColor(fe, 60, 170)};"></div></div>
      </div>
      <div class="rt-diag-card">
        <div class="rt-diag-card-head"><span>Serum Ferritin</span><span class="rt-diag-sub">20 - 250 ng/mL</span></div>
        <div class="rt-diag-val">${ferr !== null ? `${ferr} ng/mL` : '—'}</div>
        <div class="rt-gauge-track"><div class="rt-gauge-seg low"></div><div class="rt-gauge-seg norm"></div><div class="rt-gauge-seg high"></div><div class="rt-gauge-pin" style="left:${calcPos(ferr, 20, 250)}%; background:${calcColor(ferr, 20, 250)};"></div></div>
      </div>
      <div class="rt-diag-card">
        <div class="rt-diag-card-head"><span>T.I.B.C</span><span class="rt-diag-sub">240 - 450 µg/dL</span></div>
        <div class="rt-diag-val">${tibc !== null ? `${tibc} µg/dL` : '—'}</div>
        <div class="rt-gauge-track"><div class="rt-gauge-seg low"></div><div class="rt-gauge-seg norm"></div><div class="rt-gauge-seg high"></div><div class="rt-gauge-pin" style="left:${calcPos(tibc, 240, 450)}%; background:${calcColor(tibc, 240, 450)};"></div></div>
      </div>
      <div class="rt-diag-card">
        <div class="rt-diag-card-head"><span>Iron Saturation</span><span class="rt-diag-sub">20 - 50 %</span></div>
        <div class="rt-diag-val">${sat !== null ? `${sat} %` : '—'}</div>
        <div class="rt-gauge-track"><div class="rt-gauge-seg low"></div><div class="rt-gauge-seg norm"></div><div class="rt-gauge-seg high"></div><div class="rt-gauge-pin" style="left:${calcPos(sat, 20, 50)}%; background:${calcColor(sat, 20, 50)};"></div></div>
      </div>
    </div>
  </div>`;
}

export function renderVitaminsVisualsHtml(params: TestParameter[]): string {
  const vitD = getNum(params, ['vitamin d', '25-oh', 'vit d']);
  const vitB12 = getNum(params, ['vitamin b12', 'vit b12', 'b12']);

  const dStatus = vitD === null ? '' :
    vitD < 10 ? 'Severe Deficiency' :
    vitD < 20 ? 'Deficiency' :
    vitD < 30 ? 'Insufficiency' : 'Optimal Sufficiency (30-100 ng/mL)';

  return `
  <div class="rt-diag-panel">
    <h3>
      <span>📊 Vitamin Bioavailability & Nutritional Sufficiency Scale</span>
      <span class="rt-diag-badge ${vitD && vitD < 20 ? 'alert' : 'opt'}">${vitD ? dStatus : 'Vitamins Profile'}</span>
    </h3>
    <div class="rt-diag-grid-2">
      <div class="rt-diag-card">
        <div class="rt-diag-card-head"><span>Vitamin D (25-OH D3)</span><span class="rt-diag-sub">30 - 100 ng/mL (Optimal)</span></div>
        <div class="rt-diag-val" style="color:${(vitD && vitD < 30)?'#b45309':'#15803d'};">${vitD !== null ? `${vitD} ng/mL` : '—'}</div>
        <div class="rt-gauge-track"><div class="rt-gauge-seg low" style="width:30%;"></div><div class="rt-gauge-seg high" style="width:20%; background:#fef3c7;"></div><div class="rt-gauge-seg norm" style="width:50%;"></div><div class="rt-gauge-pin" style="left:${calcPos(vitD, 10, 80)}%; background:${(vitD&&vitD<20)?'#b91c1c':((vitD&&vitD<30)?'#b45309':'#15803d')};"></div></div>
      </div>
      <div class="rt-diag-card">
        <div class="rt-diag-card-head"><span>Vitamin B12</span><span class="rt-diag-sub">200 - 900 pg/mL</span></div>
        <div class="rt-diag-val">${vitB12 !== null ? `${vitB12} pg/mL` : '—'}</div>
        <div class="rt-gauge-track"><div class="rt-gauge-seg low"></div><div class="rt-gauge-seg norm"></div><div class="rt-gauge-seg high"></div><div class="rt-gauge-pin" style="left:${calcPos(vitB12, 200, 900)}%; background:${calcColor(vitB12, 200, 900)};"></div></div>
      </div>
    </div>
  </div>`;
}

export function renderGenericProfileDistributionChart(profile: TestProfile): string {
  const numericParams = profile.parameters.filter(p => {
    if (!p.result) return false;
    const n = parseFloat(String(p.result).replace(/[^0-9.-]/g, ''));
    return !isNaN(n) && (p.minNormal !== undefined || p.maxNormal !== undefined);
  });

  if (numericParams.length === 0) return '';

  return `
  <div class="rt-diag-panel">
    <h3>
      <span>📊 Analytical Result Distribution & Normal Corridor Gauge (${esc(latin(profile.titleEn, profile.titleAr))})</span>
      <span style="font-size: 8.5px; color: #2563eb; font-weight: 700;">Quantitative Reference Scale</span>
    </h3>
    <div style="display: flex; flex-direction: column; gap: 3px; margin-top: 1.5mm;">
      ${numericParams.slice(0, 10).map(p => {
        const n = parseFloat(String(p.result).replace(/[^0-9.-]/g, ''));
        const min = p.minNormal ?? (n * 0.5);
        const max = p.maxNormal ?? (n * 1.5);
        const pos = calcPos(n, min, max);
        const col = calcColor(n, min, max);
        const k = flagKind(p);
        const badgeCls = k === 'H' || k === 'CH' ? 'alert' : k === 'L' || k === 'CL' ? 'low' : 'opt';
        return `
          <div class="rt-multi-bar-row">
            <div class="rt-multi-bar-label" title="${esc(p.name)}">${esc(cleanInvestigationName(p.name))}</div>
            <div class="rt-multi-bar-track-wrap">
              <span style="font-size: 7.5px; color: #64748b; width: 14px; text-align: right;">L</span>
              <div class="rt-gauge-track" style="flex: 1; height: 7px;">
                <div class="rt-gauge-seg low"></div>
                <div class="rt-gauge-seg norm"></div>
                <div class="rt-gauge-seg high"></div>
                <div class="rt-gauge-pin" style="left: ${pos}%; background: ${col};"></div>
              </div>
              <span style="font-size: 7.5px; color: #64748b; width: 14px;">H</span>
            </div>
            <div class="rt-multi-bar-val">
              <span style="color: ${col}; font-weight: 900;">${esc(p.result)}</span>
              <span style="font-size: 7.5px; color: #64748b; font-weight: 600;">${esc(latin(p.unit, ''))}</span>
              <span class="rt-diag-badge ${badgeCls}" style="margin-left: 3px;">${k || 'NOR'}</span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  </div>`;
}

export function renderProfileDiagnosticChartHtml(profile: TestProfile, patient: any): string {
  if (isCbcProfile(profile)) {
    return renderCbcVisualsHtml(profile.parameters);
  }
  if (isLipidProfile(profile)) {
    return renderLipidVisualsHtml(profile.parameters);
  }
  if (isLiverProfile(profile)) {
    return renderLiverVisualsHtml(profile.parameters);
  }
  if (isKidneyProfile(profile)) {
    return renderKidneyVisualsHtml(profile.parameters, patient);
  }
  if (isDiabetesProfile(profile)) {
    return renderDiabetesVisualsHtml(profile.parameters);
  }
  if (isThyroidProfile(profile)) {
    return renderThyroidVisualsHtml(profile.parameters);
  }
  if (isElectrolytesProfile(profile)) {
    return renderElectrolytesVisualsHtml(profile.parameters);
  }
  if (isCoagulationProfile(profile)) {
    return renderCoagulationVisualsHtml(profile.parameters);
  }
  if (isCardiacProfile(profile)) {
    return renderCardiacVisualsHtml(profile.parameters);
  }
  if (isIronProfile(profile)) {
    return renderIronVisualsHtml(profile.parameters);
  }
  if (isVitaminProfile(profile)) {
    return renderVitaminsVisualsHtml(profile.parameters);
  }
  return renderGenericProfileDistributionChart(profile);
}

function rowHtml(p: TestParameter, showVisualChart: boolean = true): string {
  const k = flagKind(p);
  const cls = k === 'H' ? 'h' : k === 'L' ? 'l' : k === 'CH' || k === 'CL' ? 'c' : k === 'A' ? 'h' : '';
  const ref = latin(formatReferenceDisplay(p), '—');
  const cleanName = cleanInvestigationName(p.name);
  return `<tr>
    <td class="test">
      ${esc(cleanName)}
      ${p.method ? `<small>Method: ${esc(latin(p.method))}</small>` : ''}
    </td>
    <td class="result ${cls}">${esc(p.result || '—')}</td>
    <td class="unit">${esc(latin(p.unit, '—'))}</td>
    <td class="flag">${flagCell(k)}</td>
    <td class="ref">${esc(ref)}</td>
    ${showVisualChart ? `<td class="gauge-col">${renderRowGaugeHtml(p)}</td>` : ''}
  </tr>`;
}

function pageHtml(report: LabReport, profile: TestProfile, idx: number, total: number, lab: LabInfo | undefined, showVisualChart: boolean = true): string {
  const p = report.patient;
  const labName = latin(lab?.labNameEn, 'RT Diagnostic Laboratories');
  const supervision = latin(lab?.supervisionEn, 'Kasr Al Ainy Faculty of Medicine Consultants');
  const address = latin(lab?.mainAddress, 'Behteem Square, El-Ezaby Tower, 3rd Floor, Shubra El-Kheima');
  const phone = [lab?.phone, lab?.hotline].filter(Boolean).join('  |  ');
  const doctor =
    p.referringDoctorTitle === 'Herself' || p.referringDoctorTitle === 'Himself'
      ? 'Self request'
      : latin(`${p.referringDoctorTitle || ''} ${p.referringDoctorName || ''}`, 'Self request');

  const diagnosis = latin(p.clinicalDiagnosis || p.clinicalHistory || '');

  // Gather multiple clinical interpretations
  const allInterpretations: string[] = [];
  if (profile.interpretation && profile.interpretation.trim()) {
    allInterpretations.push(profile.interpretation.trim());
  }
  if (profile.interpretations && Array.isArray(profile.interpretations)) {
    profile.interpretations.forEach(t => {
      if (t && t.trim() && !allInterpretations.includes(t.trim())) {
        allInterpretations.push(t.trim());
      }
    });
  }

  // Gather multiple technical comments
  const allComments: string[] = [];
  if (profile.comment && profile.comment.trim()) {
    allComments.push(profile.comment.trim());
  }
  if (profile.comments && Array.isArray(profile.comments)) {
    profile.comments.forEach(t => {
      if (t && t.trim() && !allComments.includes(t.trim())) {
        allComments.push(t.trim());
      }
    });
  }

  const general = idx === total - 1 ? latin(report.generalComment) : '';
  const bf = profile.bloodFilmFindings;

  // Attached medical atlas / infographic
  const illustration = profile.attachedIllustration || 
    (profile.selectedIllustrationId ? DISEASE_ILLUSTRATIONS.find(d => d.id === profile.selectedIllustrationId) : undefined);

  // Recommended follow-up tests
  const recommendedTests = (profile.recommendedTests || []).filter(t => Boolean(t && t.trim()));

  const film = bf
    ? `<div class="rt-film">
        ${bf.rbcMorphology ? `<div><b>RBC Morphology:</b> ${esc(latin(bf.rbcMorphology))}</div>` : ''}
        ${bf.wbcMorphology ? `<div><b>WBC Morphology:</b> ${esc(latin(bf.wbcMorphology))}</div>` : ''}
        ${bf.plateletMorphology ? `<div><b>Platelets:</b> ${esc(latin(bf.plateletMorphology))}</div>` : ''}
        ${bf.reticulocytesPercent ? `<div><b>Reticulocytes:</b> ${esc(latin(bf.reticulocytesPercent))}</div>` : ''}
      </div>`
    : '';

  // Render interpretations HTML
  const interpretationsHtml = allInterpretations
    .map((interp, i) => `
      <div class="rt-note">
        <h4>Clinical Interpretation ${allInterpretations.length > 1 ? `#${i + 1}` : ''}</h4>
        <p>${esc(latin(interp))}</p>
      </div>
    `)
    .join('');

  // Render comments HTML
  const commentsHtml = allComments
    .map((comm, i) => `
      <div class="rt-note plain">
        <h4>Technical Note ${allComments.length > 1 ? `#${i + 1}` : ''}</h4>
        <p>${esc(latin(comm))}</p>
      </div>
    `)
    .join('');

  // Render infographic HTML if attached
  const atlasHtml = illustration
    ? `<div class="rt-atlas">
        <div class="rt-atlas-img">
          <img src="${illustration.imageUrl || ''}" alt="${esc(illustration.titleEn)}" />
        </div>
        <div class="rt-atlas-content">
          <div class="rt-atlas-title">${esc(illustration.titleEn)}</div>
          <div class="rt-atlas-desc">${esc(illustration.pathologySummaryEn)}</div>
          ${illustration.keyDiagnosticPoints && illustration.keyDiagnosticPoints.length > 0 
            ? `<div class="rt-atlas-points">• ${esc(illustration.keyDiagnosticPoints.slice(0, 2).join(' • '))}</div>` 
            : ''}
        </div>
      </div>`
    : '';

  // Render recommended tests HTML
  const recommendationsHtml = recommendedTests.length > 0
    ? `<div class="rt-rec">
        <h4>Recommended Follow-up Investigations</h4>
        <div class="rt-rec-tags">
          ${recommendedTests.map(t => { const clean = t.replace(/\s*\([\u0600-\u06FF\s-]+\)/g, '').trim(); return `<span class="rt-rec-badge">${esc(clean || t)}</span>`; }).join('')}
        </div>
        <div class="rt-rec-disclaimer">Suggested according to analytical profiles. Please correlate clinically with treating physician.</div>
      </div>`
    : '';

  // OGTT Dynamic Curve and Protocol (GLUCOSE 75g, 8h fasting, 3-hour curve)
  const isOgtt = isOgttProfile(profile);
  let ogttBlockHtml = '';
  if (isOgtt) {
    const ogttEval = extractOgttData(profile.parameters);
    const svgChart = generateOgttSvgChart(ogttEval, 680, 215);
    const protocolHtml = generateOgttProtocolHtml();
    ogttBlockHtml = `
      <div class="rt-ogtt-wrapper avoid-break-inside" style="margin-top: 3mm; margin-bottom: 2mm; page-break-inside: avoid; break-inside: avoid;">
        ${protocolHtml}
        
        <div style="margin-top: 2.5mm; margin-bottom: 2.5mm;">
          ${svgChart}
        </div>

        <div style="background: ${ogttEval.badgeBg}; border: 1.5px solid ${ogttEval.statusColor}33; border-radius: 6px; padding: 2.5mm 3.5mm; display: flex; align-items: center; justify-content: space-between; gap: 4mm;">
          <div>
            <div style="font-weight: 800; font-size: 10px; color: ${ogttEval.statusColor}; display: flex; align-items: center; gap: 6px;">
              <span>📈 DIAGNOSTIC EVALUATION (التقييم التشخيصي للمنحنى):</span>
              <span style="background: ${ogttEval.statusColor}; color: #ffffff; padding: 1.5px 6.5px; border-radius: 3px; font-size: 9px; font-weight: 800;">
                ${esc(ogttEval.statusEn)}
              </span>
            </div>
            <div style="font-size: 8.5px; color: #1e293b; margin-top: 1mm; line-height: 1.45;">
              ${esc(ogttEval.clinicalSummaryEn)} • <b>${esc(ogttEval.clinicalSummaryAr)}</b>
            </div>
          </div>
          <div style="text-align: right; font-family: 'JetBrains Mono', monospace; font-size: 8.5px; flex-shrink: 0; color: #334155;">
            <div>Fasting: <b>${ogttEval.fastingVal !== null ? `${ogttEval.fastingVal} mg/dL` : '—'}</b></div>
            <div>2-Hour: <b>${ogttEval.twoHourVal !== null ? `${ogttEval.twoHourVal} mg/dL` : '—'}</b></div>
            <div>Peak: <b>${ogttEval.peakVal !== null ? `${ogttEval.peakVal} mg/dL` : '—'}</b></div>
          </div>
        </div>
      </div>
    `;
  }

  // Diagnostic Visual Dashboard (CBC, Lipid, Liver, Kidney, Diabetes, Thyroid, Electrolytes, Coagulation, Cardiac, Iron, Vitamins, or Generic Distribution Chart)
  const profileDashboardHtml = showVisualChart
    ? renderProfileDiagnosticChartHtml(profile, p)
    : '';

  return `
  <section class="rt-page report-page-container">
    <div class="rt-topbar"></div>
    <header class="rt-head">
      <div class="rt-brand">
        ${rtLogoSvg(56)}
        <div>
          <h1>${esc(labName)}</h1>
          <div class="sub">${esc(supervision)}</div>
          <div class="accred">Clinical Pathology & Diagnostic Laboratory Services</div>
        </div>
      </div>
      <div class="rt-contact">
        <div>${esc(address)}</div>
        ${phone ? `<div><strong>Emergency Tel:</strong> ${esc(phone)}</div>` : ''}
        <div><strong>Accreditation:</strong> ISO 15189 Aligned</div>
      </div>
    </header>

    <div class="rt-patient">
      <div class="f wide"><label>Patient Name</label><span class="v name" dir="auto">${esc(p.fullName || 'Patient')}</span></div>
      <div class="f"><label>Lab / Reg No.</label><span class="v font-mono">${esc(p.labNumber)}</span></div>
      <div class="f"><label>Age / Gender</label><span class="v">${esc(ageText(p.age, p.ageUnit))} / ${esc(formatGenderEn(p.gender))}</span></div>
      <div class="f"><label>Collected</label><span class="v">${esc(fmtDate(p.sampleDate || report.createdAt || new Date().toISOString()))}</span></div>
      <div class="f"><label>Reported</label><span class="v">${esc(fmtDate(p.reportingDate || new Date().toISOString()))}</span></div>
      <div class="f wide"><label>Referred By</label><span class="v">${esc(doctor)}</span></div>
      ${diagnosis ? `<div class="f wide" style="grid-column: span 2;"><label>Clinical Diagnosis / Indication</label><span class="v" style="color: ${BRAND.red}; font-weight: 700;">${esc(diagnosis)}</span></div>` : ''}
    </div>

    <div class="rt-title">
      <h2>${esc(latin(profile.titleEn, profile.titleAr || 'Laboratory Diagnostic Report'))}</h2>
      <div class="meta">Specimen: ${esc(latin(profile.sampleType, 'Serum / Whole Blood'))}</div>
    </div>

    <!-- STRICT COLUMN ORDER: Investigation | Result | Unit | Flags | References | (Visual Gauge) -->
    <table class="rt-table ${showVisualChart ? 'has-chart' : ''}">
      <thead>
        <tr>
          <th class="c-test">Investigation</th>
          <th class="c-result">Result</th>
          <th class="c-unit">Unit</th>
          <th class="c-flag">Flags</th>
          <th class="c-ref">References</th>
          ${showVisualChart ? '<th class="c-chart">Visual Gauge</th>' : ''}
        </tr>
      </thead>
      <tbody>
        ${profile.parameters.map(param => rowHtml(param, showVisualChart)).join('')}
      </tbody>
    </table>

    ${profileDashboardHtml}
    ${film}
    ${ogttBlockHtml}

    ${interpretationsHtml}
    ${commentsHtml}

    ${atlasHtml}
    ${recommendationsHtml}

    ${general ? `<div class="rt-note plain"><h4>Clinical Diagnostic Note</h4><p>${esc(general)}</p></div>` : ''}

    <div class="rt-spacer"></div>

    ${signatureBlock(report, lab)}

    <div style="margin-top: 3mm; padding-top: 2mm; border-top: 1px dashed #cbd5e1; font-size: 8.5px; color: #64748b; display: flex; justify-content: space-between; align-items: center;">
      <span>• The analytical results relate solely to the specimen received and tested. Clinical correlation is recommended.</span>
      <span style="font-family: 'JetBrains Mono', monospace; font-weight: 700; color: #1e3a8a;">RT LAB VERIFIED REPORT</span>
    </div>

    <footer class="rt-foot">
      <span>Lab ID: ${esc(report.reportNumber)} • Sample Barcode: ${esc(p.barcode || p.labNumber)} • Page ${idx + 1} of ${total}</span>
      <span class="end">${idx === total - 1 ? '— END OF LABORATORY REPORT —' : 'CONTINUED ON NEXT PAGE'}</span>
    </footer>
  </section>`;
}

/** The report pages only (for embedding in the in-app preview). Wrap in <div class="rt-root">. */
export function buildReportPages(report: LabReport, lab?: LabInfo, showVisualChart: boolean = true): string {
  const total = report.profiles.length;
  return report.profiles.map((pr, i) => pageHtml(report, pr, i, total, lab, showVisualChart)).join('');
}

export const REPORT_FONT_LINK =
  'https://fonts.googleapis.com/css2?family=Cairo:wght@500;600;700;800;900&family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700;800&display=swap';

/** Full standalone HTML document (print window, PDF render, email attachment). */
export function buildReportDocument(report: LabReport, lab?: LabInfo, autoPrint = false, showVisualChart: boolean = true): string {
  const patientSafe = latin(report.patient.fullName, 'Patient');
  const title = `Lab Report - ${esc(patientSafe)} - ${esc(report.reportNumber)}`;
  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${REPORT_FONT_LINK}" rel="stylesheet">
<style>
  body { margin: 0; background: #e2e8f0; font-family: 'Cairo', 'Inter', sans-serif; }
  .rt-page { box-shadow: 0 4px 20px rgba(0,0,0,.15); margin: 16px auto; }
  .bar { position: fixed; top: 12px; right: 12px; z-index: 99; display: flex; gap: 8px; }
  .bar button {
    background: ${BRAND.red};
    color: #ffffff;
    border: 0;
    padding: 10px 18px;
    border-radius: 8px;
    font: 700 13px 'Cairo', 'Inter', sans-serif;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(136,19,55,0.3);
  }
  @media print {
    body { background: #ffffff !important; font-family: 'Cairo', 'Inter', sans-serif !important; }
    .bar { display: none !important; }
    .rt-page { box-shadow: none !important; margin: 0 !important; width: 100% !important; min-height: auto !important; }
  }
  ${REPORT_CSS}
</style>
</head>
<body>
<div class="bar">
  <button onclick="window.print()">Print / Save as PDF</button>
</div>
<div class="rt-root">
  ${buildReportPages(report, lab, showVisualChart)}
</div>
${autoPrint ? '<script>window.onload=function(){setTimeout(function(){window.print()},600)}</script>' : ''}
</body>
</html>`;
}
