import { LabInfo, LabReport, TestParameter, TestProfile } from '../types';
import { formatGenderAr, formatReferenceDisplay } from './calculator';

export interface PatientSheetRenderOptions {
  report: LabReport;
  labInfo?: LabInfo;
  unitName: string;
  assignedChemist: string;
  handoverBy: string;
  sampleDateText: string;
  expectedDeliveryText: string;
  handoverDateText: string;
  benchNotes: string;
  viewMode: 'detailed' | 'summary';
  includeExistingResults: boolean;
  parameterNotes?: Record<string, string>;
  extraBlankRows?: number;
}

function esc(value?: string | number | null): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatSheetDateTime(isoOrStr?: string): string {
  if (!isoOrStr) return '—';
  const trimmed = isoOrStr.trim();
  if (!trimmed) return '—';
  const dt = new Date(trimmed);
  if (isNaN(dt.getTime())) return trimmed;
  const datePart = dt.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const hasTime = trimmed.includes('T') || /\d{1,2}:\d{2}/.test(trimmed);
  if (!hasTime) return datePart;
  const timePart = dt.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  return `${datePart} · ${timePart}`;
}

function formatParamReference(param: TestParameter): string {
  if (param.textReference && param.textReference.trim()) {
    return param.textReference.trim();
  }
  const ref = formatReferenceDisplay(param);
  return ref || '—';
}

function renderDetailedRows(
  profiles: TestProfile[],
  includeExistingResults: boolean,
  parameterNotes: Record<string, string>,
  extraBlankRows: number
): string {
  let rowIndex = 0;
  const chunks: string[] = [];

  profiles.forEach((profile, pIdx) => {
    const profileLabelAr = profile.titleAr || profile.titleEn || profile.profileCode;
    const profileLabelEn = profile.titleEn || profile.profileCode || '';
    const sampleType = profile.sampleType || 'Serum';
    const category = profile.category || 'Laboratory Unit';

    chunks.push(`
      <tr class="ps-group-row">
        <td colspan="6">
          <div class="ps-group-flex">
            <div>
              <span class="ps-group-num">${pIdx + 1}.</span>
              <strong>${esc(profileLabelAr)}</strong>
              ${profileLabelEn && profileLabelEn !== profileLabelAr ? `<span class="ps-group-en" dir="ltr">(${esc(profileLabelEn)})</span>` : ''}
            </div>
            <div class="ps-group-meta" dir="ltr">
              <span>Code: <b>${esc(profile.profileCode || 'TEST')}</b></span>
              <span>·</span>
              <span>Sample: <b>${esc(sampleType)}</b></span>
              <span>·</span>
              <span>Unit: ${esc(category)}</span>
            </div>
          </div>
        </td>
      </tr>
    `);

    const params = Array.isArray(profile.parameters) ? profile.parameters : [];
    if (params.length === 0) {
      rowIndex += 1;
      const noteKey = `${profile.id}__main`;
      const customNote = parameterNotes[noteKey] || '';
      chunks.push(`
        <tr class="ps-data-row">
          <td class="c-idx font-mono">${rowIndex}</td>
          <td class="c-test" dir="ltr">${esc(profileLabelEn || profileLabelAr)}</td>
          <td class="c-sample" dir="ltr">${esc(sampleType)}</td>
          <td class="c-ref" dir="ltr">—</td>
          <td class="c-res"></td>
          <td class="c-notes">${esc(customNote)}</td>
        </tr>
      `);
      return;
    }

    params.forEach((param) => {
      rowIndex += 1;
      const noteKey = `${profile.id}__${param.id}`;
      const customNote = parameterNotes[noteKey] ?? param.notes ?? '';
      const existingVal = includeExistingResults && param.result ? String(param.result).trim() : '';
      const refText = formatParamReference(param);
      const unitAndRef = [param.unit ? param.unit : '', refText !== '—' ? refText : '']
        .filter(Boolean)
        .join(' · ') || '—';

      chunks.push(`
        <tr class="ps-data-row">
          <td class="c-idx font-mono">${rowIndex}</td>
          <td class="c-test" dir="ltr">${esc(param.name)}</td>
          <td class="c-sample" dir="ltr">${esc(sampleType)}</td>
          <td class="c-ref" dir="ltr">${esc(unitAndRef)}</td>
          <td class="c-res font-mono" dir="ltr">${esc(existingVal)}</td>
          <td class="c-notes">${esc(customNote)}</td>
        </tr>
      `);
    });
  });

  for (let i = 0; i < extraBlankRows; i++) {
    rowIndex += 1;
    chunks.push(`
      <tr class="ps-data-row ps-blank-row">
        <td class="c-idx font-mono">${rowIndex}</td>
        <td class="c-test"></td>
        <td class="c-sample"></td>
        <td class="c-ref"></td>
        <td class="c-res"></td>
        <td class="c-notes"></td>
      </tr>
    `);
  }

  return chunks.join('');
}

function renderSummaryRows(
  profiles: TestProfile[],
  includeExistingResults: boolean,
  parameterNotes: Record<string, string>,
  extraBlankRows: number
): string {
  let rowIndex = 0;
  const chunks: string[] = [];

  profiles.forEach((profile) => {
    rowIndex += 1;
    const noteKey = `${profile.id}__summary`;
    const customNote = parameterNotes[noteKey] || '';
    const filledCount = (profile.parameters || []).filter(p => p.result && p.result.trim() !== '').length;
    const totalCount = (profile.parameters || []).length;
    const resultPreview =
      includeExistingResults && filledCount > 0
        ? (totalCount === 1
            ? (profile.parameters[0]?.result || '')
            : `${filledCount}/${totalCount} مسجّل`)
        : '';

    chunks.push(`
      <tr class="ps-data-row ps-summary-row">
        <td class="c-idx font-mono">${rowIndex}</td>
        <td class="c-test">
          <div style="font-weight: 800; color: #0f172a;">${esc(profile.titleAr || profile.titleEn)}</div>
          <div style="font-size: 9.5px; color: #475569;" dir="ltr">
            ${esc(profile.titleEn)} · Code: ${esc(profile.profileCode)} · (${totalCount} items)
          </div>
        </td>
        <td class="c-sample" dir="ltr">${esc(profile.sampleType || 'Serum')}</td>
        <td class="c-ref">${esc(profile.category || '—')}</td>
        <td class="c-res font-mono" dir="ltr">${esc(resultPreview)}</td>
        <td class="c-notes">${esc(customNote)}</td>
      </tr>
    `);
  });

  for (let i = 0; i < extraBlankRows; i++) {
    rowIndex += 1;
    chunks.push(`
      <tr class="ps-data-row ps-blank-row">
        <td class="c-idx font-mono">${rowIndex}</td>
        <td class="c-test"></td>
        <td class="c-sample"></td>
        <td class="c-ref"></td>
        <td class="c-res"></td>
        <td class="c-notes"></td>
      </tr>
    `);
  }

  return chunks.join('');
}

export function buildPatientSheetInnerHtml(opts: PatientSheetRenderOptions): string {
  const {
    report,
    labInfo,
    unitName,
    assignedChemist,
    handoverBy,
    sampleDateText,
    expectedDeliveryText,
    handoverDateText,
    benchNotes,
    viewMode,
    includeExistingResults,
    parameterNotes = {},
    extraBlankRows = 2
  } = opts;

  const p = report.patient;
  const labNameAr = labInfo?.labNameAr || 'معامل RT للتحاليل الطبية والتشخيصية';
  const labAddress = labInfo?.mainAddress || 'ميدان بهتيم — برج صيدلية العزبي — الدور الثالث — شبرا الخيمة';
  const labPhone = labInfo?.phone || labInfo?.hotline || '01100874444';
  const doctorDisplay =
    p.referringDoctorTitle === 'Herself' || p.referringDoctorTitle === 'Himself'
      ? 'طلب فحص ذاتي (Self-Request)'
      : `${p.referringDoctorTitle || ''} ${p.referringDoctorName || ''}`.trim() || 'غير محدد';

  const isHomeVisit = Boolean(p.bookingType === 'home_visit' || p.isHomeVisit || p.homeAddress);
  const ageUnitAr = p.ageUnit === 'years' ? 'سنة' : p.ageUnit === 'months' ? 'شهر' : 'يوم';
  const diagnosisText = p.clinicalDiagnosis || p.clinicalHistory || '—';
  const totalParamsCount = (report.profiles || []).reduce((sum, pr) => sum + (pr.parameters?.length || 1), 0);
  const sampleTypesList = Array.from(
    new Set((report.profiles || []).map(pr => pr.sampleType).filter(Boolean))
  ).join(' / ') || 'Serum / Whole Blood';

  const tableRowsHtml =
    viewMode === 'summary'
      ? renderSummaryRows(report.profiles || [], includeExistingResults, parameterNotes, extraBlankRows)
      : renderDetailedRows(report.profiles || [], includeExistingResults, parameterNotes, extraBlankRows);

  return `
    <div class="ps-sheet" dir="rtl">
      <!-- Top Accent Bar -->
      <div class="ps-accent-bar">
        <div class="ps-accent-crimson"></div>
        <div class="ps-accent-navy"></div>
      </div>

      <!-- Header -->
      <header class="ps-header">
        <div class="ps-brand-ar">
          <h1>${esc(labNameAr)}</h1>
          <div class="ps-sub">معامل أ.د. رامي مختار — استشاريو الباثولوجيا الإكلينيكية (طب قصر العيني)</div>
          <div class="ps-contact">${esc(labAddress)} · هاتف: <span dir="ltr">${esc(labPhone)}</span></div>
        </div>

        <div class="ps-doc-title">
          <div class="ps-doc-badge">PATIENT BENCH WORKSHEET</div>
          <h2>ورقة عمل الحالة بالوحدة المخبرية (Patient Sheet)</h2>
          <div class="ps-doc-unit">الوحدة المختصة: <strong>${esc(unitName || 'العمل المعملي الشامل')}</strong></div>
        </div>

        <div class="ps-ids-box" dir="ltr">
          <div class="ps-id-row"><span>LAB NO:</span> <strong>${esc(p.labNumber || report.reportNumber)}</strong></div>
          <div class="ps-id-row"><span>BARCODE:</span> <strong>${esc(p.barcode || p.labNumber)}</strong></div>
          <div class="ps-id-row"><span>TESTS:</span> <strong>${(report.profiles || []).length} Profiles · ${totalParamsCount} Params</strong></div>
        </div>
      </header>

      <!-- Patient & Specimen Timeline Metadata Grid -->
      <section class="ps-meta-grid">
        <div class="ps-meta-cell wide">
          <label>اسم المريض (Patient Name)</label>
          <div class="val lg">${esc(p.fullName)}</div>
        </div>
        <div class="ps-meta-cell">
          <label>السن / النوع (Age / Sex)</label>
          <div class="val">${esc(p.age)} ${ageUnitAr} · ${esc(formatGenderAr(p.gender))}</div>
        </div>
        <div class="ps-meta-cell">
          <label>تليفون المريض (Phone)</label>
          <div class="val font-mono" dir="ltr">${esc(p.phone || '—')}</div>
        </div>

        <div class="ps-meta-cell highlight-date">
          <label>تاريخ ووقت سحب العينة (Sample Date)</label>
          <div class="val font-mono" dir="ltr">${esc(sampleDateText || '—')}</div>
        </div>
        <div class="ps-meta-cell highlight-delivery">
          <label>تاريخ وموعد الاستلام المتوقع (Delivery Date)</label>
          <div class="val font-mono" dir="ltr">${esc(expectedDeliveryText || '—')}</div>
        </div>
        <div class="ps-meta-cell">
          <label>نوع العينة المطلوبة (Specimen)</label>
          <div class="val font-mono" dir="ltr">${esc(sampleTypesList)}</div>
        </div>
        <div class="ps-meta-cell">
          <label>الفرع / جهة السحب</label>
          <div class="val">${esc(p.branchName || 'الفرع الرئيسي')} (${isHomeVisit ? 'زيارة منزلية' : 'حضور للفرع'})</div>
        </div>

        <div class="ps-meta-cell wide">
          <label>الطبيب المعالج (Referring Physician)</label>
          <div class="val">${esc(doctorDisplay)}</div>
        </div>
        <div class="ps-meta-cell wide">
          <label>التشخيص والملاحظات السريرية (Clinical Indication)</label>
          <div class="val">${esc(diagnosisText)}</div>
        </div>
      </section>

      <!-- Bench Tests, Results & Notes Table -->
      <section class="ps-table-wrap">
        <table class="ps-table">
          <thead>
            <tr>
              <th class="c-idx">#</th>
              <th class="c-test">اسم التحليل / البرامتر (Investigation)</th>
              <th class="c-sample">العينة</th>
              <th class="c-ref">الوحدة والمعدل المرجعي</th>
              <th class="c-res">النتيجة (Result)</th>
              <th class="c-notes">الملاحظات (Notes)</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>
      </section>

      <!-- Sample Integrity & Bench Notes Box -->
      <section class="ps-bench-notes">
        <div class="ps-checks-row">
          <span class="ps-checks-title">حالة العينة وجودة السحب عند الاستلام:</span>
          <label class="ps-chk"><span class="ps-box"></span> سليمة (Acceptable)</label>
          <label class="ps-chk"><span class="ps-box"></span> Hemolyzed</label>
          <label class="ps-chk"><span class="ps-box"></span> Lipemic</label>
          <label class="ps-chk"><span class="ps-box"></span> Icteric</label>
          <label class="ps-chk"><span class="ps-box"></span> Clotted</label>
          <label class="ps-chk"><span class="ps-box"></span> QNS (غير كافية)</label>
          <label class="ps-chk"><span class="ps-box"></span> إعادة / تخفيف (Repeat / Dil.)</label>
        </div>
        <div class="ps-notes-lines">
          <div class="ps-notes-label">ملاحظات الكيميائي المختص / الوحدة أثناء التشغيل:</div>
          <div class="ps-notes-body">${benchNotes ? esc(benchNotes) : ''}</div>
          ${!benchNotes ? '<div class="ps-rule"></div><div class="ps-rule"></div>' : ''}
        </div>
      </section>

      <!-- Handover & Unit Signatures Block -->
      <section class="ps-signatures">
        <div class="ps-sig-box">
          <div class="ps-sig-title">١. تسليم العينة للوحدة (المُسلِّم)</div>
          <div class="ps-sig-field"><span>الاسم:</span> <strong>${esc(handoverBy || '........................................')}</strong></div>
          <div class="ps-sig-field"><span>إمضاء التسليم:</span> <span class="ps-line"></span></div>
          <div class="ps-sig-field"><span>تاريخ ووقت التسليم:</span> <strong class="font-mono" dir="ltr">${esc(handoverDateText || '____ / __ / 202_  __:__')}</strong></div>
        </div>

        <div class="ps-sig-box primary">
          <div class="ps-sig-title">٢. استلام الكيميائي المختص داخل الوحدة</div>
          <div class="ps-sig-field"><span>الكيميائي المختص:</span> <strong>${esc(assignedChemist || '........................................')}</strong></div>
          <div class="ps-sig-field"><span>إمضاء الاستلام والتشغيل:</span> <span class="ps-line"></span></div>
          <div class="ps-sig-field"><span>تاريخ ووقت الاستلام:</span> <span class="ps-line short"></span></div>
        </div>

        <div class="ps-sig-box">
          <div class="ps-sig-title">٣. مراجعة الجودة وإدخال النظام</div>
          <div class="ps-sig-field"><span>المدقق / المسؤول:</span> <strong>${esc(report.staff?.verifiedBy || 'د/ مصطفى العوضي')}</strong></div>
          <div class="ps-sig-field"><span>التوقيع:</span> <span class="ps-line"></span></div>
          <div class="ps-sig-field"><span>التاريخ والوقت:</span> <span class="ps-line short"></span></div>
        </div>
      </section>

      <footer class="ps-footer">
        <span>وثيقة تشغيل داخلية خاصة بوحدات معامل RT — تُحفظ أو تُرفق مع ملف الحالة لحين اعتماد التقرير النهائي.</span>
        <span class="font-mono" dir="ltr">RT-BENCH-SHEET · ${esc(report.reportNumber)} · A4</span>
      </footer>
    </div>
  `;
}

export const PATIENT_SHEET_CSS = `
  .ps-sheet {
    width: 100%;
    max-width: 210mm;
    margin: 0 auto;
    background: #ffffff;
    color: #0f172a;
    font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
    padding: 7mm 9mm;
    box-sizing: border-box;
  }
  .ps-sheet * { box-sizing: border-box; }
  .font-mono { font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace; font-variant-numeric: tabular-nums; }
  .ps-accent-bar { display: flex; height: 3.5px; width: 100%; margin-bottom: 6px; border-radius: 2px; overflow: hidden; }
  .ps-accent-crimson { width: 72%; background: #881337; }
  .ps-accent-navy { width: 28%; background: #0f172a; }

  .ps-header {
    display: flex;
    justify-content: space-between;
    align-items: stretch;
    gap: 10px;
    border-bottom: 2px solid #881337;
    padding-bottom: 7px;
    margin-bottom: 8px;
  }
  .ps-brand-ar { flex: 1.25; }
  .ps-brand-ar h1 { margin: 0; font-size: 15px; font-weight: 900; color: #881337; line-height: 1.25; }
  .ps-sub { font-size: 9.5px; font-weight: 700; color: #0f172a; margin-top: 2px; }
  .ps-contact { font-size: 8.5px; color: #475569; margin-top: 2px; }

  .ps-doc-title {
    flex: 1.15;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border-right: 1px solid #e2e8f0;
    border-left: 1px solid #e2e8f0;
    padding: 0 8px;
  }
  .ps-doc-badge {
    background: #0f172a;
    color: #ffffff;
    font-size: 8.5px;
    font-weight: 800;
    letter-spacing: 0.6px;
    padding: 2px 8px;
    border-radius: 3px;
    font-family: 'JetBrains Mono', monospace;
  }
  .ps-doc-title h2 { margin: 3px 0 2px; font-size: 11.5px; font-weight: 900; color: #0f172a; }
  .ps-doc-unit { font-size: 9.5px; color: #881337; }

  .ps-ids-box {
    flex: 0.9;
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 5px;
    padding: 5px 8px;
    font-size: 9px;
    font-family: 'JetBrains Mono', monospace;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 3px;
  }
  .ps-id-row { display: flex; justify-content: space-between; gap: 6px; }
  .ps-id-row span { color: #64748b; font-weight: 700; }
  .ps-id-row strong { color: #0f172a; font-weight: 800; }

  .ps-meta-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 4px 6px;
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 6px 8px;
    margin-bottom: 8px;
  }
  .ps-meta-cell {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    padding: 3.5px 6px;
  }
  .ps-meta-cell.wide { grid-column: span 2; }
  .ps-meta-cell.highlight-date { border-color: #cbd5e1; background: #ffffff; }
  .ps-meta-cell.highlight-delivery { border-color: #fda4af; background: #fff1f2; }
  .ps-meta-cell label { display: block; font-size: 8px; font-weight: 700; color: #64748b; margin-bottom: 1px; }
  .ps-meta-cell .val { font-size: 10px; font-weight: 800; color: #0f172a; line-height: 1.3; }
  .ps-meta-cell .val.lg { font-size: 11.5px; color: #881337; }

  .ps-table-wrap { margin-bottom: 8px; }
  .ps-table {
    width: 100%;
    border-collapse: collapse;
    border: 1.5px solid #334155;
    font-size: 10px;
  }
  .ps-table thead { display: table-header-group; }
  .ps-table th {
    background: #0f172a;
    color: #ffffff;
    padding: 5.5px 6px;
    font-size: 9.5px;
    font-weight: 800;
    border: 1px solid #334155;
    text-align: right;
  }
  .ps-table th.c-idx, .ps-table td.c-idx { width: 5%; text-align: center; }
  .ps-table th.c-test, .ps-table td.c-test { width: 27%; }
  .ps-table th.c-sample, .ps-table td.c-sample { width: 11%; text-align: center; }
  .ps-table th.c-ref, .ps-table td.c-ref { width: 20%; }
  .ps-table th.c-res, .ps-table td.c-res { width: 17%; text-align: center; }
  .ps-table th.c-notes, .ps-table td.c-notes { width: 20%; }

  .ps-group-row { page-break-inside: avoid; break-inside: avoid; }
  .ps-group-row td {
    background: #f1f5f9;
    border: 1px solid #94a3b8;
    padding: 4px 7px;
    color: #0f172a;
    font-size: 10px;
  }
  .ps-group-flex { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; }
  .ps-group-num { color: #881337; font-weight: 900; margin-left: 4px; }
  .ps-group-en { color: #475569; font-size: 9px; margin-right: 5px; font-weight: 700; }
  .ps-group-meta { font-size: 8.5px; color: #334155; display: flex; align-items: center; gap: 5px; font-family: 'JetBrains Mono', monospace; }

  .ps-data-row { page-break-inside: avoid; break-inside: avoid; }
  .ps-data-row td {
    border: 1px solid #94a3b8;
    padding: 5.5px 6px;
    height: 8.2mm;
    vertical-align: middle;
  }
  .ps-summary-row td { height: 10.5mm; }
  .ps-data-row td.c-test { font-weight: 700; color: #0f172a; text-align: left; }
  .ps-summary-row td.c-test { text-align: right; }
  .ps-data-row td.c-sample { font-size: 8.8px; color: #475569; font-weight: 600; }
  .ps-data-row td.c-ref { font-size: 8.5px; color: #475569; font-family: 'JetBrains Mono', monospace; text-align: left; }
  .ps-data-row td.c-res { background: #fffdfd; font-weight: 900; font-size: 11px; color: #881337; border-left: 1.5px solid #475569; border-right: 1.5px solid #475569; }
  .ps-data-row td.c-notes { font-size: 9px; color: #334155; }
  .ps-blank-row td { background: #fafafa; }

  .ps-bench-notes {
    border: 1px solid #94a3b8;
    border-radius: 6px;
    padding: 6px 8px;
    margin-bottom: 8px;
    background: #ffffff;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .ps-checks-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 12px;
    padding-bottom: 5px;
    border-bottom: 1px dashed #cbd5e1;
    font-size: 9px;
    color: #1e293b;
  }
  .ps-checks-title { font-weight: 800; color: #881337; }
  .ps-chk { display: inline-flex; align-items: center; gap: 4px; font-weight: 700; }
  .ps-box { display: inline-block; width: 10px; height: 10px; border: 1.2px solid #334155; border-radius: 2px; background: #fff; }
  .ps-notes-lines { padding-top: 5px; }
  .ps-notes-label { font-size: 9px; font-weight: 800; color: #334155; margin-bottom: 3px; }
  .ps-notes-body { font-size: 9.5px; color: #0f172a; line-height: 1.5; min-height: 12px; white-space: pre-wrap; }
  .ps-rule { height: 14px; border-bottom: 1px dashed #cbd5e1; margin-bottom: 2px; }

  .ps-signatures {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .ps-sig-box {
    border: 1px solid #94a3b8;
    border-radius: 6px;
    padding: 6px 8px;
    background: #f8fafc;
    font-size: 9px;
  }
  .ps-sig-box.primary {
    border: 1.5px solid #881337;
    background: #fff1f2;
  }
  .ps-sig-title {
    font-weight: 900;
    color: #0f172a;
    border-bottom: 1px solid #cbd5e1;
    padding-bottom: 3px;
    margin-bottom: 5px;
    font-size: 9.5px;
  }
  .ps-sig-box.primary .ps-sig-title { color: #881337; border-color: #fda4af; }
  .ps-sig-field {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 4px;
    margin-bottom: 5px;
    min-height: 15px;
  }
  .ps-sig-field span { color: #475569; font-weight: 700; white-space: nowrap; }
  .ps-sig-field strong { color: #0f172a; font-weight: 800; font-size: 9.2px; text-align: left; }
  .ps-line { flex: 1; border-bottom: 1px dotted #475569; height: 11px; min-width: 45px; }
  .ps-line.short { min-width: 60px; }

  .ps-footer {
    margin-top: 6px;
    padding-top: 4px;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 8px;
    color: #64748b;
  }

  @media print {
    @page { size: A4 portrait; margin: 7mm; }
    body { margin: 0 !important; padding: 0 !important; background: #ffffff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .ps-sheet { max-width: 100% !important; padding: 0 !important; margin: 0 !important; box-shadow: none !important; }
  }
`;

export function buildPatientSheetDocument(opts: PatientSheetRenderOptions): string {
  const inner = buildPatientSheetInnerHtml(opts);
  const title = `Patient Sheet - ${esc(opts.report.patient.fullName)} - ${esc(opts.report.patient.labNumber)}`;
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@500;600;700;800;900&family=JetBrains+Mono:wght@500;700;800&display=swap" rel="stylesheet" />
  <style>
    body { margin: 0; background: #ffffff; font-family: 'Cairo', sans-serif; }
    ${PATIENT_SHEET_CSS}
  </style>
</head>
<body>
  ${inner}
</body>
</html>`;
}

/** Prints A4 document via a clean offscreen iframe (no popup blocker or window.open dependency) */
export function printPatientSheetA4(htmlDoc: string): void {
  const existing = document.getElementById('rt-patient-sheet-print-frame');
  if (existing) existing.remove();

  const iframe = document.createElement('iframe');
  iframe.id = 'rt-patient-sheet-print-frame';
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) {
    iframe.remove();
    return;
  }

  doc.open();
  doc.write(htmlDoc);
  doc.close();

  let printed = false;
  const triggerPrint = () => {
    if (printed) return;
    printed = true;
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      setTimeout(() => {
        iframe.remove();
      }, 1500);
    }
  };

  iframe.onload = () => {
    setTimeout(triggerPrint, 250);
  };
  setTimeout(triggerPrint, 900);
}
