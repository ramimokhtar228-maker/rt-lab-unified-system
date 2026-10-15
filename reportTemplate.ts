import { LabReport, LabInfo, TestParameter, TestProfile } from '../types';
import { formatReferenceDisplay } from './cbcCalculator';

/**
 * Single source of truth for the patient-facing report.
 * Used by: print window, PDF export, on-screen preview.
 * English only, LTR. Columns: Test | Result | Unit | Flag | Reference
 */

export const BRAND = {
  red: '#7a0f1a',
  redDark: '#5a0a13',
  redSoft: '#fdf2f3',
  navy: '#12284c',
  navySoft: '#eef2f8',
  ink: '#111827',
  muted: '#6b7280',
  line: '#e5e7eb',
  high: '#b91c1c',
  low: '#1d4ed8',
  critical: '#ffffff',
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

export function rtLogoSvg(size = 56): string {
  return `
<svg width="${size}" height="${size}" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="RT Labs">
  <defs>
    <linearGradient id="rtg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#9b1626"/><stop offset="1" stop-color="${BRAND.redDark}"/>
    </linearGradient>
  </defs>
  <rect x="2" y="2" width="60" height="60" rx="15" fill="url(#rtg)"/>
  <path d="M32 9 C32 9 20 23 20 31 a12 12 0 0 0 24 0 C44 23 32 9 32 9Z" fill="#ffffff" fill-opacity=".14"/>
  <text x="32" y="38" text-anchor="middle" font-family="Inter,Segoe UI,Arial,sans-serif" font-weight="800" font-size="22" fill="#ffffff" letter-spacing="-1">RT</text>
  <rect x="14" y="46" width="36" height="3.5" rx="1.75" fill="${BRAND.navy}"/>
  <rect x="14" y="46" width="14" height="3.5" rx="1.75" fill="#ffffff" fill-opacity=".9"/>
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
    case 'H': return `<span class="pill pill-h">H</span>`;
    case 'L': return `<span class="pill pill-l">L</span>`;
    case 'CH': return `<span class="pill pill-c">H ▲▲</span>`;
    case 'CL': return `<span class="pill pill-c">L ▼▼</span>`;
    case 'A': return `<span class="pill pill-h">ABN</span>`;
    default: return '';
  }
}

function ageText(age: number, unit: string): string {
  const u = unit === 'years' ? 'Y' : unit === 'months' ? 'M' : 'D';
  return `${age} ${u}`;
}

function fmtDate(d: string): string {
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '';
  const date = dt.toLocaleDateString('en-GB');
  const time = dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${date} ${time}`;
}

export const REPORT_CSS = `
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; }
  .rt-root, .rt-root * { font-family: 'Inter','Cairo','Segoe UI',Roboto,Helvetica,Arial,sans-serif; }
  .rt-patient .v.name { unicode-bidi: plaintext; text-align: left; }
  .rt-root { color: ${BRAND.ink}; font-size: 12px; line-height: 1.5; direction: ltr; text-align: left;
    -webkit-font-smoothing: antialiased; font-variant-numeric: tabular-nums lining-nums;
    -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .rt-page { width: 210mm; min-height: 297mm; background: #fff; margin: 0 auto; position: relative;
    display: flex; flex-direction: column; padding: 12mm 14mm 10mm; page-break-after: always; break-after: page; }
  .rt-page:last-child { page-break-after: auto; break-after: auto; }
  .rt-topbar { position: absolute; left: 0; right: 0; top: 0; height: 5mm;
    background: linear-gradient(90deg, ${BRAND.red} 0 68%, ${BRAND.navy} 68% 100%); }

  .rt-head { display: flex; align-items: center; justify-content: space-between; gap: 14px;
    padding: 4mm 0 4mm; border-bottom: 1px solid ${BRAND.line}; }
  .rt-brand { display: flex; align-items: center; gap: 12px; }
  .rt-brand h1 { margin: 0; font-size: 18px; font-weight: 800; color: ${BRAND.red}; letter-spacing: -.01em; line-height: 1.15; }
  .rt-brand .sub { font-size: 10.5px; color: ${BRAND.navy}; font-weight: 600; margin-top: 2px; }
  .rt-contact { text-align: right; font-size: 9.5px; color: ${BRAND.muted}; line-height: 1.55; }
  .rt-contact strong { color: ${BRAND.navy}; font-weight: 700; }

  .rt-patient { display: grid; grid-template-columns: repeat(4, 1fr); gap: 7px 16px; margin: 5mm 0 4mm;
    padding: 3.5mm 4mm; background: ${BRAND.navySoft}; border-radius: 8px; border-left: 3px solid ${BRAND.red}; }
  .rt-patient .f { min-width: 0; }
  .rt-patient .f.wide { grid-column: span 2; }
  .rt-patient label { display: block; font-size: 8.5px; letter-spacing: .08em; text-transform: uppercase; color: ${BRAND.muted}; font-weight: 600; }
  .rt-patient span.v { display: block; font-size: 12px; font-weight: 600; color: ${BRAND.ink}; overflow-wrap: anywhere; }
  .rt-patient span.v.name { font-size: 14px; font-weight: 700; color: ${BRAND.navy}; }

  .rt-title { display: flex; align-items: baseline; justify-content: space-between; margin: 1mm 0 2.5mm;
    padding-bottom: 2mm; border-bottom: 2px solid ${BRAND.red}; }
  .rt-title h2 { margin: 0; font-size: 15px; font-weight: 800; color: ${BRAND.red}; text-transform: uppercase; letter-spacing: .04em; }
  .rt-title .meta { font-size: 9.5px; color: ${BRAND.muted}; }

  table.rt-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .rt-table thead th { text-align: left; font-size: 9.5px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase;
    color: ${BRAND.navy}; padding: 6px 8px; border-bottom: 1.5px solid ${BRAND.navy}; }
  .rt-table th.c-test { width: 34%; } .rt-table th.c-result { width: 16%; }
  .rt-table th.c-unit { width: 12%; } .rt-table th.c-flag { width: 9%; text-align: center; }
  .rt-table th.c-ref { width: 29%; }
  .rt-table tbody td { padding: 6px 8px; border-bottom: 1px solid ${BRAND.line}; vertical-align: middle; font-size: 12px; }
  .rt-table tbody tr { page-break-inside: avoid; break-inside: avoid; }
  .rt-table tbody tr:nth-child(even) td { background: #fafafa; }
  .rt-table td.test { font-weight: 600; color: ${BRAND.ink}; }
  .rt-table td.test small { display: block; font-weight: 400; font-size: 9px; color: ${BRAND.muted}; }
  .rt-table td.result { font-size: 13.5px; font-weight: 700; }
  .rt-table td.result.h { color: ${BRAND.high}; } .rt-table td.result.l { color: ${BRAND.low}; }
  .rt-table td.result.c { color: ${BRAND.high}; text-decoration: underline; }
  .rt-table td.unit { color: ${BRAND.muted}; font-size: 11px; }
  .rt-table td.flag { text-align: center; }
  .rt-table td.ref { color: #374151; font-size: 11px; }
  .pill { display: inline-block; min-width: 22px; padding: 1px 6px; border-radius: 999px; font-size: 10px; font-weight: 800; text-align: center; }
  .pill-h { background: #fee2e2; color: ${BRAND.high}; }
  .pill-l { background: #dbeafe; color: ${BRAND.low}; }
  .pill-c { background: ${BRAND.high}; color: #fff; }

  .rt-note { margin-top: 4mm; padding: 3mm 4mm; border-radius: 8px; background: ${BRAND.redSoft}; border-left: 3px solid ${BRAND.red};
    page-break-inside: avoid; break-inside: avoid; }
  .rt-note h4 { margin: 0 0 1.5mm; font-size: 9.5px; letter-spacing: .08em; text-transform: uppercase; color: ${BRAND.red}; font-weight: 800; }
  .rt-note p { margin: 0; font-size: 11.5px; line-height: 1.6; color: ${BRAND.ink}; white-space: pre-wrap; }
  .rt-note.plain { background: ${BRAND.navySoft}; border-left-color: ${BRAND.navy}; }
  .rt-note.plain h4 { color: ${BRAND.navy}; }

  .rt-film { margin-top: 4mm; display: grid; grid-template-columns: 1fr 1fr; gap: 4px 14px; font-size: 11px; padding: 3mm 4mm;
    border: 1px solid ${BRAND.line}; border-radius: 8px; page-break-inside: avoid; }
  .rt-film b { color: ${BRAND.navy}; }

  .rt-spacer { flex: 1; }
  .rt-sign { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10mm; margin-top: 8mm; padding-top: 3mm; page-break-inside: avoid; }
  .rt-sign .s { text-align: center; }
  .rt-sign .line { height: 11mm; border-bottom: 1px solid ${BRAND.ink}; margin-bottom: 1.5mm; display: flex; align-items: flex-end; justify-content: center; }
  .rt-sign .line img { max-height: 10mm; max-width: 100%; }
  .rt-sign .role { font-size: 8.5px; letter-spacing: .1em; text-transform: uppercase; color: ${BRAND.muted}; font-weight: 700; }
  .rt-sign .nm { font-size: 11px; font-weight: 700; color: ${BRAND.navy}; }
  .rt-sign .tt { font-size: 9px; color: ${BRAND.muted}; }

  .rt-foot { display: flex; justify-content: space-between; align-items: center; margin-top: 4mm; padding-top: 2.5mm;
    border-top: 1px solid ${BRAND.line}; font-size: 8.5px; color: ${BRAND.muted}; }
  .rt-foot .end { color: ${BRAND.red}; font-weight: 700; letter-spacing: .06em; }
`;

function signatureBlock(report: LabReport): string {
  const s = report.staff || ({} as LabReport['staff']);
  const blocks = [
    { role: 'Lab Chemist', name: latin(s.labChemist), title: latin(s.chemistTitle) },
    { role: 'Verified By', name: latin(s.verifiedBy), title: latin(s.verifierTitle) },
    { role: 'Consultant Pathologist', name: latin(s.pathologist), title: latin(s.pathologistTitle) },
  ].filter(b => b.name);

  if (!blocks.length) return '';
  return `<div class="rt-sign">${blocks
    .map(
      b => `<div class="s"><div class="line"></div><div class="role">${esc(b.role)}</div>
        <div class="nm">${esc(b.name)}</div>${b.title ? `<div class="tt">${esc(b.title)}</div>` : ''}</div>`
    )
    .join('')}</div>`;
}

function rowHtml(p: TestParameter): string {
  const k = flagKind(p);
  const cls = k === 'H' ? 'h' : k === 'L' ? 'l' : k === 'CH' || k === 'CL' ? 'c' : k === 'A' ? 'h' : '';
  const ref = latin(formatReferenceDisplay(p), '—');
  return `<tr>
    <td class="test">${esc(latin(p.name, p.name))}${p.method ? `<small>${esc(latin(p.method))}</small>` : ''}</td>
    <td class="result ${cls}">${esc(p.result || '—')}</td>
    <td class="unit">${esc(latin(p.unit))}</td>
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
      : latin(`${p.referringDoctorTitle || ''} ${p.referringDoctorName || ''}`, '—');

  const interpretation = latin(profile.interpretation);
  const comment = latin(profile.comment);
  const general = idx === total - 1 ? latin(report.generalComment) : '';
  const bf = profile.bloodFilmFindings;

  const film = bf
    ? `<div class="rt-film">
        ${bf.rbcMorphology ? `<div><b>RBC:</b> ${esc(latin(bf.rbcMorphology))}</div>` : ''}
        ${bf.wbcMorphology ? `<div><b>WBC:</b> ${esc(latin(bf.wbcMorphology))}</div>` : ''}
        ${bf.plateletMorphology ? `<div><b>Platelets:</b> ${esc(latin(bf.plateletMorphology))}</div>` : ''}
        ${bf.reticulocytesPercent ? `<div><b>Reticulocytes:</b> ${esc(latin(bf.reticulocytesPercent))}</div>` : ''}
      </div>`
    : '';

  return `
  <section class="rt-page report-page-container">
    <div class="rt-topbar"></div>
    <header class="rt-head">
      <div class="rt-brand">
        ${rtLogoSvg(54)}
        <div><h1>${esc(labName)}</h1><div class="sub">${esc(supervision)}</div></div>
      </div>
      <div class="rt-contact">
        <div>${esc(address)}</div>
        ${phone ? `<div><strong>Tel</strong> ${esc(phone)}</div>` : ''}
      </div>
    </header>

    <div class="rt-patient">
      <div class="f wide"><label>Patient</label><span class="v name" dir="auto">${esc(p.fullName)}</span></div>
      <div class="f"><label>Lab No.</label><span class="v">${esc(p.labNumber)}</span></div>
      <div class="f"><label>Age / Sex</label><span class="v">${esc(ageText(p.age, p.ageUnit))} / ${p.gender === 'male' ? 'Male' : 'Female'}</span></div>
      <div class="f"><label>Collected</label><span class="v">${esc(fmtDate(p.sampleDate))}</span></div>
      <div class="f"><label>Reported</label><span class="v">${esc(fmtDate(p.reportingDate))}</span></div>
      <div class="f wide"><label>Referred by</label><span class="v">${esc(doctor)}</span></div>
    </div>

    <div class="rt-title">
      <h2>${esc(latin(profile.titleEn, 'Laboratory Report'))}</h2>
      <div class="meta">Sample: ${esc(latin(profile.sampleType, '—'))}</div>
    </div>

    <table class="rt-table">
      <thead><tr>
        <th class="c-test">Test</th><th class="c-result">Result</th><th class="c-unit">Unit</th>
        <th class="c-flag">Flag</th><th class="c-ref">Reference</th>
      </tr></thead>
      <tbody>${profile.parameters.map(rowHtml).join('')}</tbody>
    </table>

    ${film}
    ${interpretation ? `<div class="rt-note"><h4>Interpretation</h4><p>${esc(interpretation)}</p></div>` : ''}
    ${comment ? `<div class="rt-note plain"><h4>Comment</h4><p>${esc(comment)}</p></div>` : ''}
    ${general ? `<div class="rt-note plain"><h4>Note</h4><p>${esc(general)}</p></div>` : ''}

    <div class="rt-spacer"></div>
    ${signatureBlock(report)}
    <footer class="rt-foot">
      <span>Report ${esc(report.reportNumber)}  •  Page ${idx + 1} of ${total}</span>
      <span class="end">${idx === total - 1 ? '— END OF REPORT —' : 'CONTINUED'}</span>
    </footer>
  </section>`;
}

/** The report pages only (for embedding in the in-app preview). Wrap in <div class="rt-root">. */
export function buildReportPages(report: LabReport, lab?: LabInfo): string {
  const total = report.profiles.length;
  return report.profiles.map((pr, i) => pageHtml(report, pr, i, total, lab)).join('');
}

export const REPORT_FONT_LINK =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Cairo:wght@500;600;700&display=swap';

/** Full standalone HTML document (print window, PDF render, email attachment). */
export function buildReportDocument(report: LabReport, lab?: LabInfo, autoPrint = false): string {
  const title = `Lab Report - ${esc(report.patient.fullName)} - ${esc(report.reportNumber)}`;
  return `<!DOCTYPE html>
<html lang="en" dir="ltr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${REPORT_FONT_LINK}" rel="stylesheet">
<style>
  body { margin: 0; background: #e5e7eb; }
  .rt-page { box-shadow: 0 6px 24px rgba(0,0,0,.18); margin: 14px auto; }
  .bar { position: fixed; top: 12px; right: 12px; z-index: 9; display: flex; gap: 8px; }
  .bar button { background: ${BRAND.red}; color: #fff; border: 0; padding: 9px 16px; border-radius: 8px; font: 600 13px Inter, Arial, sans-serif; cursor: pointer; }
  @media print { body { background: #fff; } .bar { display: none; } .rt-page { box-shadow: none; margin: 0; } }
  ${REPORT_CSS}
</style></head>
<body><div class="bar"><button onclick="window.print()">Print / Save as PDF</button></div>
<div class="rt-root">${buildReportPages(report, lab)}</div>
${autoPrint ? '<script>window.onload=function(){setTimeout(function(){window.print()},700)}</script>' : ''}
</body></html>`;
}
