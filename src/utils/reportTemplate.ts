import { LabReport, LabInfo, TestParameter, TestProfile } from '../types';
import { formatReferenceDisplay } from './cbcCalculator';
import { DISEASE_ILLUSTRATIONS } from '../data/diseaseIllustrations';

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
  const cleaned = trimmed
    .replace(ARABIC, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s\-–—•|/,:]+|[\s\-–—•|/,:]+$/g, '')
    .trim();
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

  /* EXACT TABLE ORDER: Test / result / unit / flags / references */
  table.rt-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    margin-top: 1mm;
  }
  .rt-table thead th {
    text-align: left;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: #ffffff;
    background: ${BRAND.navy};
    padding: 7px 10px;
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

  .rt-table tbody td {
    padding: 6px 10px;
    border-bottom: 1px solid ${BRAND.line};
    vertical-align: middle;
    font-size: 11.5px;
  }
  .rt-table tbody tr {
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .rt-table tbody tr:nth-child(even) td {
    background: #fafafa;
  }
  .rt-table td.test {
    font-weight: 700;
    color: ${BRAND.ink};
  }
  .rt-table td.test small {
    display: block;
    font-weight: 400;
    font-size: 9px;
    color: ${BRAND.muted};
    margin-top: 1px;
  }
  .rt-table td.result {
    font-family: 'JetBrains Mono', 'Inter', monospace;
    font-size: 12.5px;
    font-weight: 800;
    color: ${BRAND.ink};
  }
  .rt-table td.result.h {
    color: ${BRAND.high};
  }
  .rt-table td.result.l {
    color: ${BRAND.low};
  }
  .rt-table td.result.c {
    color: ${BRAND.critical};
    font-weight: 900;
  }
  .rt-table td.unit {
    color: ${BRAND.muted};
    font-size: 11px;
    font-family: 'JetBrains Mono', monospace;
  }
  .rt-table td.flag {
    text-align: center;
  }
  .rt-table td.ref {
    color: #334155;
    font-size: 11px;
    font-family: 'JetBrains Mono', 'Inter', monospace;
  }

  /* Flags styling: clean, anti-slop text indicators */
  .flag-tag {
    font-size: 9.5px;
    font-weight: 800;
    letter-spacing: 0.05em;
    padding: 1.5px 6px;
    border-radius: 4px;
    display: inline-block;
  }
  .flag-high {
    background: #fee2e2;
    color: ${BRAND.high};
  }
  .flag-low {
    background: #dbeafe;
    color: ${BRAND.low};
  }
  .flag-panic {
    background: #991b1b;
    color: #ffffff;
  }
  .flag-abnormal {
    background: #fef3c7;
    color: #b45309;
  }
  .flag-normal {
    color: #059669;
    font-weight: 700;
  }
  .flag-none {
    color: #94a3b8;
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
    gap: 8mm;
    margin-top: 6mm;
    padding-top: 3mm;
    page-break-inside: avoid;
  }
  .rt-sign .s {
    text-align: center;
  }
  .rt-sign .line {
    height: 9mm;
    border-bottom: 1.5px solid ${BRAND.navy};
    margin-bottom: 2mm;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }
  .rt-sign .role {
    font-size: 8.5px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: ${BRAND.muted};
    font-weight: 700;
  }
  .rt-sign .nm {
    font-size: 11px;
    font-weight: 800;
    color: ${BRAND.navy};
    margin-top: 1px;
  }
  .rt-sign .tt {
    font-size: 8.5px;
    color: ${BRAND.muted};
  }
  .rt-sign .lic {
    font-size: 8px;
    font-family: 'JetBrains Mono', monospace;
    color: ${BRAND.navyBlue};
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

function signatureBlock(report: LabReport): string {
  const s = report.staff || ({} as LabReport['staff']);
  
  // If report explicitly hides signatures, omit
  if ((s as any)?.hideSignatures === true || (report as any)?.hideSignatures === true) {
    return '';
  }

  const blocks: { role: string; name: string; title: string; license?: string }[] = [];

  if (s.labChemist && (s as any).showChemist !== false) {
    blocks.push({
      role: 'Laboratory Chemist',
      name: latin(s.labChemist),
      title: latin(s.chemistTitle),
      license: s.chemistLicense
    });
  }

  if (s.verifiedBy && (s as any).showVerifier !== false) {
    blocks.push({
      role: 'Quality Verified By',
      name: latin(s.verifiedBy),
      title: latin(s.verifierTitle),
      license: s.verifierLicense
    });
  }

  if (s.pathologist && (s as any).showPathologist !== false) {
    blocks.push({
      role: 'Consultant Clinical Pathologist',
      name: latin(s.pathologist),
      title: latin(s.pathologistTitle),
      license: s.pathologistLicense
    });
  }

  if (!blocks.length) return '';

  return `<div class="rt-sign" style="grid-template-columns: repeat(${blocks.length}, 1fr);">
    ${blocks
      .map(
        b => `<div class="s">
          <div class="line"></div>
          <div class="role">${esc(b.role)}</div>
          <div class="nm">${esc(b.name)}</div>
          ${b.title ? `<div class="tt">${esc(b.title)}</div>` : ''}
          ${b.license ? `<div class="lic">Lic: ${esc(b.license)}</div>` : ''}
        </div>`
      )
      .join('')}
  </div>`;
}

function rowHtml(p: TestParameter): string {
  const k = flagKind(p);
  const cls = k === 'H' ? 'h' : k === 'L' ? 'l' : k === 'CH' || k === 'CL' ? 'c' : k === 'A' ? 'h' : '';
  const ref = latin(formatReferenceDisplay(p), '—');
  return `<tr>
    <td class="test">
      ${esc(latin(p.name, p.name))}
      ${p.method ? `<small>Method: ${esc(latin(p.method))}</small>` : ''}
    </td>
    <td class="result ${cls}">${esc(p.result || '—')}</td>
    <td class="unit">${esc(latin(p.unit, '—'))}</td>
    <td class="flag">${flagCell(k)}</td>
    <td class="ref">${esc(ref)}</td>
  </tr>`;
}

function pageHtml(report: LabReport, profile: TestProfile, idx: number, total: number, lab: LabInfo | undefined): string {
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
          ${recommendedTests.map(t => `<span class="rt-rec-badge">${esc(latin(t))}</span>`).join('')}
        </div>
        <div class="rt-rec-disclaimer">Suggested according to analytical profiles. Please correlate clinically with treating physician.</div>
      </div>`
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
      <div class="f wide"><label>Patient Name</label><span class="v name" dir="auto">${esc(latin(p.fullName, p.fullName))}</span></div>
      <div class="f"><label>Lab / Reg No.</label><span class="v font-mono">${esc(p.labNumber)}</span></div>
      <div class="f"><label>Age / Gender</label><span class="v">${esc(ageText(p.age, p.ageUnit))} / ${p.gender === 'male' ? 'Male' : 'Female'}</span></div>
      <div class="f"><label>Collected</label><span class="v">${esc(fmtDate(p.sampleDate))}</span></div>
      <div class="f"><label>Reported</label><span class="v">${esc(fmtDate(p.reportingDate))}</span></div>
      <div class="f wide"><label>Referred By</label><span class="v">${esc(doctor)}</span></div>
      ${diagnosis ? `<div class="f wide" style="grid-column: span 2;"><label>Clinical Diagnosis / Indication</label><span class="v" style="color: ${BRAND.red}; font-weight: 700;">${esc(diagnosis)}</span></div>` : ''}
    </div>

    <div class="rt-title">
      <h2>${esc(latin(profile.titleEn, profile.titleAr || 'Laboratory Diagnostic Report'))}</h2>
      <div class="meta">Specimen: ${esc(latin(profile.sampleType, 'Serum / Whole Blood'))}</div>
    </div>

    <!-- STRICT COLUMN ORDER: Test | Result | Unit | Flags | References -->
    <table class="rt-table">
      <thead>
        <tr>
          <th class="c-test">Test</th>
          <th class="c-result">Result</th>
          <th class="c-unit">Unit</th>
          <th class="c-flag">Flags</th>
          <th class="c-ref">References</th>
        </tr>
      </thead>
      <tbody>
        ${profile.parameters.map(rowHtml).join('')}
      </tbody>
    </table>

    ${film}

    ${interpretationsHtml}
    ${commentsHtml}
    ${atlasHtml}
    ${recommendationsHtml}

    ${general ? `<div class="rt-note plain"><h4>Diagnostic Note</h4><p>${esc(general)}</p></div>` : ''}

    <div class="rt-spacer"></div>

    ${signatureBlock(report)}

    <footer class="rt-foot">
      <span>Report ID: ${esc(report.reportNumber)}  •  Page ${idx + 1} of ${total}</span>
      <span class="end">${idx === total - 1 ? '— END OF LABORATORY REPORT —' : 'CONTINUED ON NEXT PAGE'}</span>
    </footer>
  </section>`;
}

/** The report pages only (for embedding in the in-app preview). Wrap in <div class="rt-root">. */
export function buildReportPages(report: LabReport, lab?: LabInfo): string {
  const total = report.profiles.length;
  return report.profiles.map((pr, i) => pageHtml(report, pr, i, total, lab)).join('');
}

export const REPORT_FONT_LINK =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700;800&display=swap';

/** Full standalone HTML document (print window, PDF render, email attachment). */
export function buildReportDocument(report: LabReport, lab?: LabInfo, autoPrint = false): string {
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
  body { margin: 0; background: #e2e8f0; }
  .rt-page { box-shadow: 0 4px 20px rgba(0,0,0,.15); margin: 16px auto; }
  .bar { position: fixed; top: 12px; right: 12px; z-index: 99; display: flex; gap: 8px; }
  .bar button {
    background: ${BRAND.red};
    color: #ffffff;
    border: 0;
    padding: 10px 18px;
    border-radius: 8px;
    font: 700 13px 'Inter', sans-serif;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(136,19,55,0.3);
  }
  @media print {
    body { background: #ffffff !important; }
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
  ${buildReportPages(report, lab)}
</div>
${autoPrint ? '<script>window.onload=function(){setTimeout(function(){window.print()},600)}</script>' : ''}
</body>
</html>`;
}
