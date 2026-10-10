import { LabReport, LabInfo } from '../types/lab';
import { formatReferenceDisplay, getChartPointerPosition } from './cbcCalculator';
import { generateSmartClinicalAnalysis } from './smartReportEngine';

export function openPrintReportWindow(report: LabReport, labInfo?: LabInfo): void {
  const staff = report.staff || {
    labChemist: "د/ عمر فؤاد",
    chemistTitle: "أخصائي الكيمياء الإكلينيكية",
    chemistLicense: "EGY-SCI-88402",
    verifiedBy: "أ/ سارة الشربيني",
    verifierTitle: "إدارة ضبط الجودة والتشغيل",
    verifierLicense: "EGY-MGT-11024",
    pathologist: "أ.د. رامي مختار",
    pathologistTitle: "استشاري الباثولوجيا الإكلينيكية - قصر العيني",
    pathologistLicense: "EGY-MED-48201",
    financialDirector: "أ/ ماجد الشرقاوي",
    financialTitle: "المدير المالي ورئيس الحسابات (CFO)",
    hrDirector: "أ/ أحمد الجمال",
    hrTitle: "مدير الموارد البشرية (HR Manager)",
    showFinancialSignature: true,
    showHrSignature: true
  };
  const p = report.patient;
  const isSmartReportActive = Boolean(report.smartReportEnabled);
  const totalPages = report.profiles.length + (isSmartReportActive ? 1 : 0);

  const doctorDisplay = p.referringDoctorTitle === 'Herself' || p.referringDoctorTitle === 'Himself'
    ? 'طلب فحص ذاتي (Self-Request)'
    : `${p.referringDoctorTitle} ${p.referringDoctorName}`.trim() || 'General Medical Request';

  const sampleDateFormatted = new Date(p.sampleDate).toLocaleDateString('en-GB');
  const reportingDateFormatted = new Date(p.reportingDate).toLocaleDateString('en-GB');

  const labNameAr = labInfo?.labNameAr || "معامل RT للتحاليل الطبية والتشخيصية";
  const labNameEn = labInfo?.labNameEn || "RT Diagnostic Laboratories";
  const address = labInfo?.mainAddress || "ميدان بهتيم برج صيدلية العزبي الدور الثالث امام الأسانسير شبرا الخيمة";
  const phone = labInfo?.phone || "0244667788";
  const hotline = labInfo?.hotline || "01012345678";
  const supervisionAr = labInfo?.supervisionAr || "أطباء واستشاريو كلية طب قصر العيني - جامعة القاهرة";

  const showFin = Boolean(staff.showFinancialSignature && staff.financialDirector);
  const showHr = Boolean(staff.showHrSignature && staff.hrDirector);

  const renderSignaturesHtml = () => {
    return `
      <div style="display:grid; grid-template-columns: ${showFin || showHr ? 'repeat(5, 1fr)' : 'repeat(3, 1fr)'}; gap:8px; text-align:center; margin-bottom:6px;">
        <!-- Lab CHEMIST -->
        <div style="background:#f8fafc; padding:6px; border-radius:6px; border:1px solid #e2e8f0;">
          <div style="font-size:9px; font-weight:800; color:#64748b; text-transform:uppercase;">Lab CHEMIST</div>
          <div style="font-family:serif; font-style:italic; font-size:10.5px; color:#475569; padding:2px 0; font-weight:bold;">Approved / Chemist</div>
          <div style="font-size:9.5px; font-weight:700; color:#0f172a;">${staff.labChemist || "د/ عمر فؤاد"}</div>
          <div style="font-size:8px; color:#64748b;">${staff.chemistTitle || 'أخصائي الكيمياء الإكلينيكية'}</div>
          ${staff.chemistLicense ? `<div style="font-size:7.5px; color:#94a3b8; font-family:monospace;">${staff.chemistLicense}</div>` : ''}
        </div>

        <!-- Verify by -->
        <div style="background:#f8fafc; padding:6px; border-radius:6px; border:1px solid #e2e8f0;">
          <div style="font-size:9px; font-weight:800; color:#64748b; text-transform:uppercase;">Verify by</div>
          <div style="font-family:serif; font-style:italic; font-size:10.5px; color:#475569; padding:2px 0; font-weight:bold;">Quality Audit Verified</div>
          <div style="font-size:9.5px; font-weight:700; color:#0f172a;">${staff.verifiedBy || "أ/ سارة الشربيني"}</div>
          <div style="font-size:8px; color:#64748b;">${staff.verifierTitle || 'إدارة ضبط الجودة'}</div>
          ${staff.verifierLicense ? `<div style="font-size:7.5px; color:#94a3b8; font-family:monospace;">${staff.verifierLicense}</div>` : ''}
        </div>

        <!-- Consultant Pathologist -->
        <div style="background:#fff1f2; padding:6px; border-radius:6px; border:1px solid #fecdd3;">
          <div style="font-size:9px; font-weight:800; color:#800000; text-transform:uppercase;">Pathologist</div>
          <div style="padding:1px 0;">
            <span style="display:inline-block; border:1px dashed #800000; padding:1px 6px; border-radius:3px; background:#ffffff; font-family:serif; font-style:italic; font-size:10.5px; color:#800000; font-weight:900;">
              Prof. Dr. Rami Mokhtar
            </span>
          </div>
          <div style="font-size:9.5px; font-weight:800; color:#800000;">${staff.pathologist || "أ.د. رامي مختار"}</div>
          <div style="font-size:8px; color:#475569;">${staff.pathologistTitle || 'استشاري الباثولوجيا - قصر العيني'}</div>
          ${staff.pathologistLicense ? `<div style="font-size:7.5px; color:#94a3b8; font-family:monospace;">${staff.pathologistLicense}</div>` : ''}
        </div>

        ${showFin ? `
          <!-- Financial Director -->
          <div style="background:#ecfdf5; padding:6px; border-radius:6px; border:1px solid #a7f3d0;">
            <div style="font-size:9px; font-weight:800; color:#065f46; text-transform:uppercase;">Financial Director</div>
            <div style="font-family:serif; font-style:italic; font-size:10.5px; color:#047857; padding:2px 0; font-weight:bold;">Financial Audit</div>
            <div style="font-size:9.5px; font-weight:700; color:#064e3b;">${staff.financialDirector}</div>
            <div style="font-size:8px; color:#059669;">${staff.financialTitle || 'المدير المالي ورئيس الحسابات'}</div>
          </div>
        ` : ''}

        ${showHr ? `
          <!-- HR Director -->
          <div style="background:#faf5ff; padding:6px; border-radius:6px; border:1px solid #e9d5ff;">
            <div style="font-size:9px; font-weight:800; color:#581c87; text-transform:uppercase;">HR Director</div>
            <div style="font-family:serif; font-style:italic; font-size:10.5px; color:#6b21a8; padding:2px 0; font-weight:bold;">HR Certified</div>
            <div style="font-size:9.5px; font-weight:700; color:#3b0764;">${staff.hrDirector}</div>
            <div style="font-size:8px; color:#7c3aed;">${staff.hrTitle || 'مدير الموارد البشرية'}</div>
          </div>
        ` : ''}
      </div>
    `;
  };

  const renderHeaderHtml = () => {
    return `
      <!-- Top Official Header -->
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2.5px solid #800000; padding-bottom:10px; margin-bottom:10px;">
        <!-- Arabic Side -->
        <div style="text-align:right; flex:1;">
          <h1 style="margin:0; font-size:17px; font-weight:900; color:#800000;">${labNameAr}</h1>
          <h2 style="margin:1px 0 0 0; font-size:12px; font-weight:700; color:#0f172a;">معامل رامي مختار</h2>
          <p style="margin:1px 0 0 0; font-size:10.5px; font-weight:600; color:#800000;">${supervisionAr}</p>
          <p style="margin:2px 0 0 0; font-size:9px; color:#475569; font-weight:bold;">📍 ${address} | هاتف: ${phone} / ${hotline}</p>
        </div>

        <!-- Central 3D Brand Logo with STRICT rule: Underneath is strictly 'التشخيص الصحيح يبدأ معنا' without any addition -->
        <div style="text-align:center; padding:0 14px;">
          <div style="width:52px; height:52px; background:linear-gradient(135deg, #800000, #991b1b, #0f172a); border-radius:12px; padding:2px; display:inline-flex; align-items:center; justify-content:center; box-shadow:0 4px 6px rgba(0,0,0,0.15);">
            <div style="width:100%; height:100%; background:#020617; border-radius:10px; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#ffffff;">
              <div style="font-weight:900; font-size:18px; line-height:1; letter-spacing:-1px;">
                <span style="color:#f43f5e;">R</span><span style="color:#ffffff;">T</span>
              </div>
              <div style="font-size:6px; font-weight:900; letter-spacing:1px; color:#cbd5e1; text-transform:uppercase;">LAB</div>
            </div>
          </div>
          <div style="font-size:9.5px; font-weight:900; color:#800000; margin-top:3px; white-space:nowrap;">التشخيص الصحيح يبدأ معنا</div>
        </div>

        <!-- English Side -->
        <div style="text-align:left; flex:1;" dir="ltr">
          <h1 style="margin:0; font-size:16px; font-weight:900; color:#800000;">${labNameEn}</h1>
          <h2 style="margin:1px 0 0 0; font-size:11px; font-weight:700; color:#0f172a;">Rami Mokhtar Laboratories</h2>
          <p style="margin:1px 0 0 0; font-size:10px; font-weight:600; color:#800000;">Kasr Al Ainy Faculty of Medicine Consultants</p>
          <p style="margin:2px 0 0 0; font-size:9px; color:#475569; font-weight:bold;">Main Center: Behteem Square, El-Ezaby Tower, 3rd Fl.</p>
        </div>
      </div>

      <!-- Patient Demographics Info Box -->
      <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:6px; padding:8px 12px; margin-bottom:10px; font-size:11px;">
        <div style="display:grid; grid-template-columns: 2fr 1fr 1fr; gap:6px;">
          <div><strong style="color:#475569;">اسم المريض:</strong> <span style="font-weight:bold; font-size:12.5px; color:#0f172a;">${p.fullName}</span></div>
          <div dir="ltr" style="text-align:right;"><strong style="color:#475569;">Lab No:</strong> <span style="font-family:monospace; font-weight:bold; color:#800000;">${p.labNumber}</span></div>
          <div dir="ltr" style="text-align:left;"><span style="font-family:monospace; font-size:10px; background:#fff; border:1px solid #cbd5e1; padding:1px 6px; border-radius:3px;">|||| ${p.barcode}</span></div>
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1.5fr 1fr 1fr; gap:6px; margin-top:4px; padding-top:4px; border-top:1px dashed #e2e8f0; font-size:10.5px;">
          <div><strong style="color:#475569;">السن / النوع:</strong> ${p.age} سنة / ${p.gender === 'male' ? 'ذكر' : 'أنثى'}</div>
          <div><strong style="color:#475569;">الطبيب المعالج:</strong> ${doctorDisplay}</div>
          <div><strong style="color:#475569;">تاريخ السحب:</strong> <span style="font-family:monospace;">${sampleDateFormatted}</span></div>
          <div><strong style="color:#475569;">تاريخ النتيجة:</strong> <span style="font-family:monospace;">${reportingDateFormatted}</span></div>
        </div>
      </div>
    `;
  };

  let profilesHtml = '';

  report.profiles.forEach((profile, index) => {
    const pageNum = index + 1;
    let rowsHtml = '';

    profile.parameters.forEach((param, rIdx) => {
      const isHigh = param.flag === 'HIGH' || param.flag === 'PANIC_HIGH';
      const isLow = param.flag === 'LOW' || param.flag === 'PANIC_LOW';
      const isAbnormal = isHigh || isLow || param.flag === 'ABNORMAL';

      let rowBg = rIdx % 2 === 0 ? '#ffffff' : '#f8fafc';
      if (isAbnormal) rowBg = '#fff1f2';

      let flagBadgeHtml = '<span style="color:#059669; font-weight:bold; font-size:10px;">Normal</span>';
      if (param.flag === 'HIGH') {
        flagBadgeHtml = '<span style="background:#ffe4e6; color:#9f1239; padding:2px 6px; border-radius:4px; font-weight:800; font-size:10px; border:1px solid #fecdd3;">High [ H ]</span>';
      } else if (param.flag === 'LOW') {
        flagBadgeHtml = '<span style="background:#fef3c7; color:#92400e; padding:2px 6px; border-radius:4px; font-weight:800; font-size:10px; border:1px solid #fde68a;">Low [ L ]</span>';
      } else if (param.flag === 'PANIC_HIGH' || param.flag === 'PANIC_LOW') {
        flagBadgeHtml = '<span style="background:#b91c1c; color:#ffffff; padding:2px 6px; border-radius:4px; font-weight:bold; font-size:10px;">CRITICAL [!]</span>';
      } else if (param.flag === 'ABNORMAL') {
        flagBadgeHtml = '<span style="background:#fee2e2; color:#991b1b; padding:2px 6px; border-radius:4px; font-weight:bold; font-size:10px;">Abnormal</span>';
      }

      // Coloured Range Visual Indicator
      let chartHtml = '<span style="color:#cbd5e1;">—</span>';
      if (param.minNormal !== undefined && param.maxNormal !== undefined) {
        const { positionPercent, zone } = getChartPointerPosition(param.result, param.minNormal, param.maxNormal);
        let pointerColor = '#10b981';
        let pointerBorder = '#065f46';
        if (zone === 'low') {
          pointerColor = '#f59e0b';
          pointerBorder = '#92400e';
        } else if (zone === 'high') {
          pointerColor = '#e11d48';
          pointerBorder = '#881337';
        }

        chartHtml = `
          <div style="width:105px; margin:0 auto; text-align:center;">
            <div style="position:relative; height:6px; background:#e2e8f0; border-radius:4px; display:flex; overflow:hidden; border:1px solid #cbd5e1;">
              <div style="width:25%; background:#fde68a;"></div>
              <div style="width:50%; background:#86efac;"></div>
              <div style="width:25%; background:#fca5a5;"></div>
            </div>
            <div style="position:relative; height:8px; margin-top:-7px;">
              <div style="position:absolute; left:${positionPercent}%; transform:translateX(-50%); width:8px; height:8px; border-radius:50%; background:${pointerColor}; border:1.5px solid ${pointerBorder};"></div>
            </div>
          </div>
        `;
      }

      const resultColor = isHigh ? '#9f1239' : isLow ? '#92400e' : '#0f172a';
      const resultWeight = isAbnormal ? '800' : '700';

      rowsHtml += `
        <tr style="background:${rowBg}; border-bottom:1px solid #e2e8f0;">
          <td style="padding:5px 8px; font-weight:700; color:#0f172a; text-align:left;">
            ${param.name}
            ${param.method ? `<span style="display:block; font-size:8.5px; color:#64748b; font-family:monospace;">Method: ${param.method}</span>` : ''}
          </td>
          <td style="padding:5px 8px; text-align:center; font-family:'JetBrains Mono', monospace; font-size:12px; font-weight:${resultWeight}; color:${resultColor};">
            ${param.result || '—'} <span style="font-size:9.5px; color:#64748b; font-weight:normal;">${param.unit || ''}</span>
          </td>
          <td style="padding:4px 6px; text-align:center; vertical-align:middle;">
            ${chartHtml}
          </td>
          <td style="padding:5px 6px; text-align:center; vertical-align:middle;">
            ${flagBadgeHtml}
          </td>
          <td style="padding:5px 8px; text-align:left; font-family:'JetBrains Mono', monospace; font-size:10.5px; color:#334155;">
            ${formatReferenceDisplay(param)}
            ${param.notes ? `<span style="display:block; font-size:8.5px; color:#94a3b8; font-style:italic;">${param.notes}</span>` : ''}
          </td>
        </tr>
      `;
    });

    profilesHtml += `
      <div class="report-page" style="page-break-after: always; padding: 20px; max-width: 820px; margin: 0 auto; background: #ffffff; min-height: 1050px; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          ${renderHeaderHtml()}

          <!-- Profile Title Banner -->
          <div style="background:linear-gradient(90deg, #700b0b, #0f172a); color:#ffffff; padding:6px 12px; border-radius:5px; display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="width:8px; height:8px; border-radius:50%; background:#f43f5e; display:inline-block;"></span>
              <strong style="font-size:12px; text-transform:uppercase; letter-spacing:0.5px;">${profile.titleEn}</strong>
              <span style="color:#fecdd3; font-size:11px;">— ${profile.titleAr}</span>
            </div>
            <div style="font-size:9.5px; color:#fed7aa; font-family:monospace;">
              Sample: ${profile.sampleType} | Page ${pageNum} of ${totalPages}
            </div>
          </div>

          <!-- Table -->
          <div style="border:1px solid #cbd5e1; border-radius:6px; overflow:hidden; margin-bottom:8px;">
            <table style="width:100%; border-collapse:collapse; font-size:10.5px; text-align:left;" dir="ltr">
              <thead>
                <tr style="background:#f1f5f9; color:#1e293b; font-weight:800; font-size:10px; border-bottom:1.5px solid #cbd5e1; text-transform:uppercase;">
                  <th style="padding:6px 8px; width:34%;">Investigations</th>
                  <th style="padding:6px 8px; width:18%; text-align:center;">Results</th>
                  <th style="padding:6px 6px; width:16%; text-align:center;">Coloured Chart</th>
                  <th style="padding:6px 6px; width:14%; text-align:center;">Flags</th>
                  <th style="padding:6px 8px; width:18%;">References</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>

          <!-- Blood Film Morphology section if present -->
          ${profile.bloodFilmFindings ? `
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:6px 10px; margin-bottom:8px; font-size:10px;">
              <strong style="color:#800000; font-size:10.5px; display:block; margin-bottom:3px;">🔬 فحص شريحة الدم المجهري (Peripheral Blood Film Morphology):</strong>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:4px; color:#334155;">
                ${profile.bloodFilmFindings.rbcMorphology ? `<div><strong>RBC Morphology:</strong> ${profile.bloodFilmFindings.rbcMorphology}</div>` : ''}
                ${profile.bloodFilmFindings.wbcMorphology ? `<div><strong>WBC Morphology:</strong> ${profile.bloodFilmFindings.wbcMorphology}</div>` : ''}
                ${profile.bloodFilmFindings.plateletMorphology ? `<div><strong>Platelets:</strong> ${profile.bloodFilmFindings.plateletMorphology}</div>` : ''}
                ${profile.bloodFilmFindings.differentialSummary ? `<div><strong>Differential:</strong> ${profile.bloodFilmFindings.differentialSummary}</div>` : ''}
              </div>
            </div>
          ` : ''}

          <!-- Attached Disease Illustration / Atlas Diagram if present -->
          ${profile.attachedIllustration ? `
            <div style="background:linear-gradient(135deg, #fff1f2 0%, #f8fafc 100%); border:1px solid #fecdd3; border-radius:6px; padding:8px 10px; margin-bottom:8px; display:flex; gap:12px; align-items:center;" dir="rtl">
              ${profile.attachedIllustration.imageUrl ? `
                <div style="width:170px; height:96px; flex-shrink:0; border-radius:6px; overflow:hidden; border:1.5px solid #881337; background:#090d16; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 4px rgba(0,0,0,0.1);">
                  <img src="${profile.attachedIllustration.imageUrl}" alt="${profile.attachedIllustration.titleEn}" style="width:100%; height:100%; object-fit:contain; display:block;" />
                </div>
              ` : ''}
              <div style="flex:1; text-align:right;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3px;">
                  <strong style="color:#800000; font-size:11px;">🔬 أطلس التشخيص الطبي: ${profile.attachedIllustration.titleAr}</strong>
                  <span style="font-size:9.5px; color:#64748b; font-style:italic;" dir="ltr">(${profile.attachedIllustration.titleEn})</span>
                </div>
                <p style="margin:0; color:#334155; font-size:10px; line-height:1.4;">
                  ${profile.attachedIllustration.pathologySummaryAr || profile.attachedIllustration.descriptionAr || ''}
                </p>
              </div>
            </div>
          ` : ''}

          <!-- Comments -->
          ${(profile.interpretation || profile.comment) ? `
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:5px; padding:6px 10px; margin-bottom:8px; font-size:10.5px; line-height:1.4;">
              ${profile.interpretation ? `<div><strong style="color:#800000;">Interpretation:</strong> ${profile.interpretation}</div>` : ''}
              ${profile.comment ? `<div style="color:#475569; font-size:10px; margin-top:2px;"><strong>Comment:</strong> ${profile.comment}</div>` : ''}
            </div>
          ` : ''}
        </div>

        <!-- Official Signatures Footer -->
        <div style="margin-top:auto; padding-top:8px; border-top:1.5px solid #cbd5e1;">
          ${renderSignaturesHtml()}
          <div style="font-size:8px; color:#94a3b8; text-align:center; border-top:1px dashed #e2e8f0; padding-top:4px;">
            معامل RT للتحاليل الطبية والتشخيصية • النتيجة مطابقة للمعايير الدولية ISO 15189 • كود التحقق: ${p.barcode}
          </div>
        </div>
      </div>
    `;
  });

  // If Smart Report is enabled, render the dedicated Smart Clinical Report page!
  if (isSmartReportActive) {
    const smart = generateSmartClinicalAnalysis(report);
    const orgs = smart.organScores;

    profilesHtml += `
      <div class="report-page" style="page-break-after: always; padding: 20px; max-width: 820px; margin: 0 auto; background: #ffffff; min-height: 1050px; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          ${renderHeaderHtml()}

          <!-- Smart Report Title Banner -->
          <div style="background:linear-gradient(90deg, #800000, #0f172a); color:#ffffff; padding:8px 12px; border-radius:6px; display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <div>
              <strong style="font-size:13px; display:block;">التقرير الإكلينيكي الذكي والتحليل الاستشاري التلقائي (RT Smart Clinical Report)</strong>
              <span style="font-size:10px; color:#fecdd3;">تقييم فوري لمؤشرات الأعضاء الحيوية، والمعادلات السريرية المحسوبة، والتوصيات الاستشارية</span>
            </div>
            <div style="font-size:9.5px; font-family:monospace; background:rgba(0,0,0,0.3); padding:3px 8px; border-radius:4px;">
              Page ${totalPages} of ${totalPages}
            </div>
          </div>

          <!-- Organ Health Scores -->
          <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px; padding:10px; margin-bottom:10px;">
            <div style="font-weight:bold; font-size:11px; color:#0f172a; margin-bottom:6px;">مؤشرات كفاءة وسلامة الأعضاء الحيوية (Vital Organ Health Scores):</div>
            <div style="display:grid; grid-template-columns: repeat(5, 1fr); gap:6px; text-align:center;">
              <div style="background:#ffffff; border:1px solid #e2e8f0; padding:6px; border-radius:6px; ${orgs.renal.status === 'not_tested' ? 'opacity:0.6;' : ''}">
                <div style="font-size:10px; font-weight:bold; color:#475569;">وظائف الكلى</div>
                <div style="font-size:15px; font-weight:900; color:#800000; font-family:monospace;">${orgs.renal.status === 'not_tested' ? '—' : `${orgs.renal.score}%`}</div>
                <div style="font-size:9px; color:#64748b;">${orgs.renal.labelAr}</div>
              </div>
              <div style="background:#ffffff; border:1px solid #e2e8f0; padding:6px; border-radius:6px; ${orgs.hepatic.status === 'not_tested' ? 'opacity:0.6;' : ''}">
                <div style="font-size:10px; font-weight:bold; color:#475569;">وظائف الكبد</div>
                <div style="font-size:15px; font-weight:900; color:#800000; font-family:monospace;">${orgs.hepatic.status === 'not_tested' ? '—' : `${orgs.hepatic.score}%`}</div>
                <div style="font-size:9px; color:#64748b;">${orgs.hepatic.labelAr}</div>
              </div>
              <div style="background:#ffffff; border:1px solid #e2e8f0; padding:6px; border-radius:6px; ${orgs.metabolic.status === 'not_tested' ? 'opacity:0.6;' : ''}">
                <div style="font-size:10px; font-weight:bold; color:#475569;">الأيض والسكر</div>
                <div style="font-size:15px; font-weight:900; color:#800000; font-family:monospace;">${orgs.metabolic.status === 'not_tested' ? '—' : `${orgs.metabolic.score}%`}</div>
                <div style="font-size:9px; color:#64748b;">${orgs.metabolic.labelAr}</div>
              </div>
              <div style="background:#ffffff; border:1px solid #e2e8f0; padding:6px; border-radius:6px; ${orgs.hematologic.status === 'not_tested' ? 'opacity:0.6;' : ''}">
                <div style="font-size:10px; font-weight:bold; color:#475569;">مؤشرات الدم</div>
                <div style="font-size:15px; font-weight:900; color:#800000; font-family:monospace;">${orgs.hematologic.status === 'not_tested' ? '—' : `${orgs.hematologic.score}%`}</div>
                <div style="font-size:9px; color:#64748b;">${orgs.hematologic.labelAr}</div>
              </div>
              <div style="background:#ffffff; border:1px solid #e2e8f0; padding:6px; border-radius:6px; ${orgs.cardiac.status === 'not_tested' ? 'opacity:0.6;' : ''}">
                <div style="font-size:10px; font-weight:bold; color:#475569;">القلب والدهون</div>
                <div style="font-size:15px; font-weight:900; color:#800000; font-family:monospace;">${orgs.cardiac.status === 'not_tested' ? '—' : `${orgs.cardiac.score}%`}</div>
                <div style="font-size:9px; color:#64748b;">${orgs.cardiac.labelAr}</div>
              </div>
            </div>
          </div>

          <!-- Calculated Indices if any -->
          ${smart.calculatedIndices.length > 0 ? `
            <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:10px; margin-bottom:10px;">
              <div style="font-weight:bold; font-size:11px; color:#0f172a; margin-bottom:6px;">المعادلات والمؤشرات الإكلينيكية المحسوبة تلقائياً:</div>
              <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:8px;">
                ${smart.calculatedIndices.map(idx => `
                  <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:6px; border-radius:5px; font-size:10px;">
                    <strong style="color:#0f172a; display:block;">${idx.nameAr}</strong>
                    <div style="font-size:13px; font-weight:bold; color:#800000; font-family:monospace; margin:2px 0;">${idx.value}</div>
                    <div style="color:#64748b; font-size:8.5px;">المرجع: ${idx.reference}</div>
                    <p style="margin:3px 0 0 0; color:#334155; font-size:9.5px; line-height:1.3;">${idx.interpretationAr}</p>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Diagnostic Differential & Consultant Recommendations -->
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:10px;">
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:8px 10px; font-size:10.5px;">
              <strong style="color:#059669; display:block; margin-bottom:4px;">التشخيص التفريقي المقترح:</strong>
              ${smart.differentialDiagnoses.length > 0 ? smart.differentialDiagnoses.map(d => `
                <div style="margin-bottom:4px; padding-bottom:4px; border-bottom:1px dashed #e2e8f0;">
                  <span style="font-weight:bold; color:#064e3b;">• ${d.diseaseAr}</span>
                  <p style="margin:2px 0 0 0; color:#475569; font-size:9.5px;">${d.rationaleAr}</p>
                </div>
              `).join('') : '<p style="color:#64748b; font-size:10px;">كافة المؤشرات مستقرة؛ لا توجد شواهد لأمراض نوعية نشطة.</p>'}
            </div>

            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:8px 10px; font-size:10.5px;">
              <strong style="color:#800000; display:block; margin-bottom:4px;">توصيات الاستشاري والخطوات التالية:</strong>
              <ul style="margin:0; padding-right:16px; color:#334155; font-size:10px; line-height:1.4;">
                ${smart.consultantRecommendations.map(r => `<li>${r}</li>`).join('')}
              </ul>
            </div>
          </div>

          <!-- Executive Summary -->
          <div style="background:#fff1f2; border:1px solid #fecdd3; border-radius:6px; padding:8px 10px; font-size:11px; line-height:1.4;">
            <strong style="color:#800000;">الخلاصة الطبية الاستشارية:</strong>
            <p style="margin:3px 0 0 0; color:#1e293b;">${smart.executiveSummaryAr}</p>
          </div>
        </div>

        <!-- Official Signatures Footer on Smart Report Page -->
        <div style="margin-top:auto; padding-top:8px; border-top:1.5px solid #cbd5e1;">
          ${renderSignaturesHtml()}
          <div style="font-size:8px; color:#94a3b8; text-align:center; border-top:1px dashed #e2e8f0; padding-top:4px;">
            معتمد إكلينيكياً من استشاري الباثولوجيا الإكلينيكية والكيميائية • كلية طب قصر العيني
          </div>
        </div>
      </div>
    `;
  }

  const printWindow = window.open('', '_blank', 'width=950,height=1000');
  if (!printWindow) {
    try {
      window.print();
    } catch {
      alert('يرجى السماح بالنوافذ المنبثقة لمعاينة وطباعة التقرير.');
    }
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير تحليل طبي - ${p.fullName} - ${report.reportNumber}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; }
        body {
          margin: 0;
          padding: 0;
          background: #525659;
          font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
          color: #0f172a;
          font-size: 12.5px;
          line-height: 1.65;
          -webkit-font-smoothing: antialiased;
        }
        table { font-size: 12px; line-height: 1.55; }
        @media print {
          body { background: #ffffff; }
          .report-page {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 12mm 10mm !important;
            page-break-after: always;
            break-after: page;
          }
          .no-print { display: none !important; }
          @page { size: A4 portrait; margin: 0; }
        }
        .report-page {
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
          margin: 20px auto;
        }
        .print-btn {
          position: fixed;
          top: 15px;
          left: 15px;
          z-index: 9999;
          background: #800000;
          color: white;
          padding: 10px 20px;
          border-radius: 8px;
          border: none;
          font-family: 'Cairo', sans-serif;
          font-weight: bold;
          font-size: 14px;
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        }
        .print-btn:hover { background: #991b1b; }
      </style>
    </head>
    <body>
      <button class="print-btn no-print" onclick="window.print()">
        🖨️ طباعة التقرير (Print A4)
      </button>
      ${profilesHtml}
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 600);
        };
      </script>
    </body>
    </html>
  `);

  printWindow.document.close();
}
