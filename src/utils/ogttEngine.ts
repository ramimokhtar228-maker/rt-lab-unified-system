/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TestParameter, TestProfile, CatalogProfileTemplate } from '../types/lab';

export interface OgttTimePoint {
  index: number;
  minutes: number;
  timeLabelAr: string;
  timeLabelEn: string;
  samplingStageAr: string;
  normalMin: number;
  normalMax: number;
  expectedLimitText: string;
  targetMax: number;
}

export const OGTT_SCHEDULE: OgttTimePoint[] = [
  {
    index: 0,
    minutes: 0,
    timeLabelAr: 'صائم (0 دقيقة)',
    timeLabelEn: '0 Min (Fasting 8h)',
    samplingStageAr: 'عينة الصائم الأساسية بعد 8 ساعات صيام تام',
    normalMin: 70,
    normalMax: 99,
    expectedLimitText: '< 100 mg/dL',
    targetMax: 100
  },
  {
    index: 1,
    minutes: 30,
    timeLabelAr: 'بعد 30 دقيقة',
    timeLabelEn: '30 Minutes',
    samplingStageAr: 'بعد 30 دقيقة من تناول 75 جم جلوكوز',
    normalMin: 110,
    normalMax: 170,
    expectedLimitText: '< 180 mg/dL',
    targetMax: 180
  },
  {
    index: 2,
    minutes: 60,
    timeLabelAr: 'بعد 60 دقيقة (ساعة)',
    timeLabelEn: '60 Min (1 Hour)',
    samplingStageAr: 'ذروة الامتصاص بعد ساعة كاملة من الجلوكوز',
    normalMin: 120,
    normalMax: 180,
    expectedLimitText: '< 180 mg/dL',
    targetMax: 180
  },
  {
    index: 3,
    minutes: 90,
    timeLabelAr: 'بعد 90 دقيقة (ساعة ونصف)',
    timeLabelEn: '90 Min (1.5 Hours)',
    samplingStageAr: 'بداية الإفراز الإنسوليني والاستهلاك الخلوي',
    normalMin: 100,
    normalMax: 160,
    expectedLimitText: '< 160 mg/dL',
    targetMax: 160
  },
  {
    index: 4,
    minutes: 120,
    timeLabelAr: 'بعد 120 دقيقة (ساعتان)',
    timeLabelEn: '120 Min (2 Hours)',
    samplingStageAr: 'النقطة التشخيصية الفاصلة الأساسية (Diagnostic Cut-off)',
    normalMin: 70,
    normalMax: 139,
    expectedLimitText: '< 140 mg/dL',
    targetMax: 140
  },
  {
    index: 5,
    minutes: 150,
    timeLabelAr: 'بعد 150 دقيقة (ساعتان ونصف)',
    timeLabelEn: '150 Min (2.5 Hours)',
    samplingStageAr: 'مرحلة استقرار وتصفية الجلوكوز',
    normalMin: 70,
    normalMax: 130,
    expectedLimitText: '< 140 mg/dL',
    targetMax: 140
  },
  {
    index: 6,
    minutes: 180,
    timeLabelAr: 'بعد 180 دقيقة (3 ساعات)',
    timeLabelEn: '180 Min (3 Hours)',
    samplingStageAr: 'العودة للمعدل الطبيعي المتزن (Baseline Recovery)',
    normalMin: 70,
    normalMax: 115,
    expectedLimitText: '< 120 mg/dL',
    targetMax: 120
  }
];

export interface ExtractedOgttPoint {
  point: OgttTimePoint;
  value: number | null;
  rawResult: string;
  parameter?: TestParameter;
}

export interface OgttEvaluation {
  points: ExtractedOgttPoint[];
  fastingVal: number | null;
  twoHourVal: number | null;
  peakVal: number | null;
  status: 'normal' | 'impaired' | 'diabetic' | 'incomplete';
  statusAr: string;
  statusEn: string;
  statusColor: string;
  badgeBg: string;
  clinicalSummaryAr: string;
  clinicalSummaryEn: string;
}

export function isOgttProfile(profile?: { profileCode?: string; titleEn?: string; titleAr?: string } | null): boolean {
  if (!profile) return false;
  const code = (profile.profileCode || '').toUpperCase();
  const en = (profile.titleEn || '').toLowerCase();
  const ar = (profile.titleAr || '').toLowerCase();

  return (
    code === 'OGTT' ||
    code === 'OGTT_75' ||
    code === 'OGTT_3H' ||
    en.includes('glucose tolerance') ||
    en.includes('ogtt') ||
    ar.includes('تحمل الجلوكوز') ||
    ar.includes('منحنى السكر')
  );
}

export function extractOgttData(parameters: TestParameter[] = []): OgttEvaluation {
  const points: ExtractedOgttPoint[] = OGTT_SCHEDULE.map(point => {
    // Look for matching parameter
    let matchedParam = parameters.find(p => {
      const name = (p.name || '').toLowerCase();
      if (point.minutes === 0) {
        return name.includes('fasting') || name.includes('0 min') || name.includes('صائم');
      }
      if (point.minutes === 30) {
        return name.includes('30 min') || name.includes('30 دقيقة') || (name.includes('30') && !name.includes('150') && !name.includes('180'));
      }
      if (point.minutes === 60) {
        return name.includes('60 min') || name.includes('1 hour') || name.includes('ساعة') || name.includes('60');
      }
      if (point.minutes === 90) {
        return name.includes('90 min') || name.includes('1.5 hour') || name.includes('90');
      }
      if (point.minutes === 120) {
        return name.includes('120 min') || name.includes('2 hour') || name.includes('ساعتين') || name.includes('120');
      }
      if (point.minutes === 150) {
        return name.includes('150 min') || name.includes('2.5 hour') || name.includes('150');
      }
      if (point.minutes === 180) {
        return name.includes('180 min') || name.includes('3 hour') || name.includes('3 ساعات') || name.includes('180');
      }
      return false;
    });

    // Fallback by parameter index among glucose tests if not found by name
    if (!matchedParam && parameters[point.index]) {
      const pCandidate = parameters[point.index];
      if ((pCandidate.name || '').toLowerCase().includes('glucose') || (pCandidate.name || '').toLowerCase().includes('سكر')) {
        matchedParam = pCandidate;
      }
    }

    const raw = matchedParam ? (matchedParam.result || '').trim() : '';
    const numeric = parseFloat(raw);
    const valid = !isNaN(numeric) && numeric > 0 ? numeric : null;

    return {
      point,
      value: valid,
      rawResult: raw,
      parameter: matchedParam
    };
  });

  const fastingVal = points[0].value;
  const twoHourVal = points[4].value;
  const recordedValues = points.map(p => p.value).filter((v): v is number => v !== null);
  const peakVal = recordedValues.length > 0 ? Math.max(...recordedValues) : null;

  let status: 'normal' | 'impaired' | 'diabetic' | 'incomplete' = 'incomplete';
  let statusAr = 'قيد استكمال القياسات (Incomplete)';
  let statusEn = 'Incomplete Serial Draw';
  let statusColor = '#64748b';
  let badgeBg = '#f1f5f9';
  let clinicalSummaryAr = 'يرجى استكمال إدخال قراءات السكر لكافة نقاط المنحنى الـ 7 لتقييم استجابة البنكرياس.';
  let clinicalSummaryEn = 'Please complete all timed glucose readings to generate full diagnostic interpretation.';

  if (twoHourVal !== null || fastingVal !== null) {
    if ((twoHourVal !== null && twoHourVal >= 200) || (fastingVal !== null && fastingVal >= 126)) {
      status = 'diabetic';
      statusAr = 'منحنى داء السكري (Diabetes Mellitus Pattern)';
      statusEn = 'Provisional Diabetes Mellitus Curve (ADA Criteria)';
      statusColor = '#dc2626';
      badgeBg = '#fef2f2';
      clinicalSummaryAr = `قيمة السكر بعد ساعتين (${twoHourVal ?? '—'} مغ/دل) أو الصائم (${fastingVal ?? '—'} مغ/دل) تجاوزت الحد التشخيصي لداء السكري (≥ 200 بعد ساعتين أو ≥ 126 صائم). يوصى بمراجعة الطبيب المعالج والفحص التراكمي HbA1c.`;
      clinicalSummaryEn = `Glucose value at 2 hours (≥ 200 mg/dL) or fasting (≥ 126 mg/dL) meets criteria for provisional Diabetes Mellitus. Clinical correlation and HbA1c testing recommended.`;
    } else if ((twoHourVal !== null && twoHourVal >= 140) || (fastingVal !== null && fastingVal >= 100)) {
      status = 'impaired';
      statusAr = 'مرحلة ما قبل السكري / اضطراب تحمل الجلوكوز (Impaired Glucose Tolerance)';
      statusEn = 'Impaired Glucose Tolerance (IGT / Pre-Diabetes)';
      statusColor = '#d97706';
      badgeBg = '#fffbeb';
      clinicalSummaryAr = `قيمة السكر بعد ساعتين (${twoHourVal ?? '—'} مغ/دل) تقع في نطاق اضطراب تحمل الجلوكوز (140 - 199 مغ/دل) أو صائم (100 - 125 مغ/دل). تشير لمرحلة ما قبل السكري (Pre-Diabetes)، يوصى بنظام غذائي ومتابعة دورية.`;
      clinicalSummaryEn = `2-Hour post-load glucose falls in the impaired range (140 - 199 mg/dL) indicating Impaired Glucose Tolerance (Pre-Diabetes). Lifestyle intervention and follow-up recommended.`;
    } else if (twoHourVal !== null && twoHourVal < 140 && (fastingVal === null || fastingVal < 100)) {
      status = 'normal';
      statusAr = 'منحنى طبيعي لتحمل الجلوكوز (Normal Glucose Tolerance)';
      statusEn = 'Normal Glucose Tolerance (Physiological Curve)';
      statusColor = '#059669';
      badgeBg = '#ecfdf5';
      clinicalSummaryAr = `استجابة طبيعية متزنة للأنسولين: السكر الصائم طبيعي (< 100 مغ/دل) والقيمة بعد ساعتين طبيعية (< 140 مغ/دل) مع عودة تدريجية للمعدل الأساسي بعد 3 ساعات.`;
      clinicalSummaryEn = `Normal glycemic curve. Fasting is < 100 mg/dL and 2-Hour post-load glucose is < 140 mg/dL with physiological recovery toward baseline at 3 hours.`;
    }
  }

  return {
    points,
    fastingVal,
    twoHourVal,
    peakVal,
    status,
    statusAr,
    statusEn,
    statusColor,
    badgeBg,
    clinicalSummaryAr,
    clinicalSummaryEn
  };
}

/**
 * Generate High-Definition Standalone SVG Chart for the OGTT Curve
 */
export function generateOgttSvgChart(evaluation: OgttEvaluation, width = 640, height = 210): string {
  const padLeft = 55;
  const padRight = 35;
  const padTop = 28;
  const padBottom = 34;
  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;

  const validValues = evaluation.points.map(p => p.value).filter((v): v is number => v !== null);
  const maxRecorded = validValues.length > 0 ? Math.max(...validValues) : 180;
  const yMax = Math.max(240, Math.ceil((maxRecorded + 25) / 50) * 50);

  const getX = (idx: number) => padLeft + idx * (plotWidth / 6);
  const getY = (val: number) => padTop + (1 - Math.min(val, yMax) / yMax) * plotHeight;

  // Grid lines: 50, 100, 140, 180, 200, 250 (if applicable)
  const gridLevels = [50, 100, 140, 180, 200];
  if (yMax >= 250) gridLevels.push(250);

  const gridHtml = gridLevels
    .map(level => {
      const y = getY(level);
      const isCritical = level === 140 || level === 200;
      const strokeColor = level === 200 ? '#fca5a5' : level === 140 ? '#fde68a' : '#e2e8f0';
      const dash = isCritical ? 'stroke-dasharray="4,3"' : '';
      return `
        <line x1="${padLeft}" y1="${y}" x2="${width - padRight}" y2="${y}" stroke="${strokeColor}" stroke-width="${isCritical ? 1.4 : 0.8}" ${dash} />
        <text x="${padLeft - 8}" y="${y + 3.5}" text-anchor="end" font-size="9" font-family="'JetBrains Mono', monospace" fill="${isCritical ? '#991b1b' : '#64748b'}" font-weight="${isCritical ? '700' : '500'}">${level}</text>
      `;
    })
    .join('');

  // Target green shaded area for Normal range (< 140 mg/dL up to 2h, < 120 at 3h)
  const normalY2h = getY(140);
  const normalY0 = getY(100);

  // Build plotted points and path
  const plottedCoords: { x: number; y: number; val: number; label: string; pt: OgttTimePoint }[] = [];
  evaluation.points.forEach((pt, idx) => {
    if (pt.value !== null) {
      plottedCoords.push({
        x: getX(idx),
        y: getY(pt.value),
        val: pt.value,
        label: `${pt.value}`,
        pt: pt.point
      });
    }
  });

  let curvePathD = '';
  let areaPathD = '';
  if (plottedCoords.length > 1) {
    curvePathD = `M ${plottedCoords[0].x} ${plottedCoords[0].y}`;
    for (let i = 1; i < plottedCoords.length; i++) {
      const prev = plottedCoords[i - 1];
      const curr = plottedCoords[i];
      const cx1 = prev.x + (curr.x - prev.x) / 2;
      const cy1 = prev.y;
      const cx2 = prev.x + (curr.x - prev.x) / 2;
      const cy2 = curr.y;
      curvePathD += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${curr.x} ${curr.y}`;
    }

    const first = plottedCoords[0];
    const last = plottedCoords[plottedCoords.length - 1];
    areaPathD = `${curvePathD} L ${last.x} ${padTop + plotHeight} L ${first.x} ${padTop + plotHeight} Z`;
  } else if (plottedCoords.length === 1) {
    curvePathD = `M ${plottedCoords[0].x - 10} ${plottedCoords[0].y} L ${plottedCoords[0].x + 10} ${plottedCoords[0].y}`;
  }

  // Reference Normal Corridor (Standard visual reference line)
  const refNormals = [85, 140, 155, 130, 110, 95, 85];
  let refPathD = `M ${getX(0)} ${getY(refNormals[0])}`;
  for (let i = 1; i < 7; i++) {
    const prevX = getX(i - 1);
    const prevY = getY(refNormals[i - 1]);
    const currX = getX(i);
    const currY = getY(refNormals[i]);
    const cx1 = prevX + (currX - prevX) / 2;
    const cx2 = prevX + (currX - prevX) / 2;
    refPathD += ` C ${cx1} ${prevY}, ${cx2} ${currY}, ${currX} ${currY}`;
  }

  // X Axis ticks and labels
  const xLabelsHtml = OGTT_SCHEDULE.map(pt => {
    const x = getX(pt.index);
    const isBenchmark = pt.minutes === 0 || pt.minutes === 120 || pt.minutes === 180;
    return `
      <line x1="${x}" y1="${padTop + plotHeight}" x2="${x}" y2="${padTop + plotHeight + 4}" stroke="#94a3b8" stroke-width="1.2" />
      <text x="${x}" y="${padTop + plotHeight + 15}" text-anchor="middle" font-size="9" font-family="'Cairo', sans-serif" font-weight="${isBenchmark ? '800' : '600'}" fill="${isBenchmark ? '#0f172a' : '#64748b'}">
        ${pt.timeLabelEn}
      </text>
      <text x="${x}" y="${padTop + plotHeight + 25}" text-anchor="middle" font-size="7.5" font-family="'Cairo', sans-serif" font-weight="500" fill="#94a3b8">
        ${pt.timeLabelAr}
      </text>
    `;
  }).join('');

  // Markers and badges for plotted points
  const pointsHtml = plottedCoords
    .map(p => {
      const isHigh = p.val >= 200 || (p.pt.minutes === 120 && p.val >= 140) || (p.pt.minutes === 0 && p.val >= 100);
      const isCritical = p.val >= 200;
      const markerColor = isCritical ? '#dc2626' : isHigh ? '#d97706' : '#be123c';
      return `
        <g>
          <circle cx="${p.x}" cy="${p.y}" r="6.5" fill="#ffffff" stroke="${markerColor}" stroke-width="2.8" filter="drop-shadow(0 1px 3px rgba(0,0,0,0.15))" />
          <circle cx="${p.x}" cy="${p.y}" r="2.5" fill="${markerColor}" />
          <!-- Result label box -->
          <rect x="${p.x - 21}" y="${p.y - 23}" width="42" height="17" rx="4" fill="${markerColor}" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))" />
          <text x="${p.x}" y="${p.y - 11}" text-anchor="middle" font-size="9.5" font-family="'JetBrains Mono', monospace" font-weight="800" fill="#ffffff">${p.val}</text>
        </g>
      `;
    })
    .join('');

  return `
  <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: auto; display: block; overflow: visible; font-family: 'Cairo', sans-serif;" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="ogttAreaGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#be123c" stop-opacity="0.28" />
        <stop offset="70%" stop-color="#be123c" stop-opacity="0.05" />
        <stop offset="100%" stop-color="#be123c" stop-opacity="0.0" />
      </linearGradient>
      <linearGradient id="ogttLineGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#881337" />
        <stop offset="50%" stop-color="#be123c" />
        <stop offset="100%" stop-color="#1e3a8a" />
      </linearGradient>
    </defs>

    <!-- Background card -->
    <rect x="0" y="0" width="${width}" height="${height}" rx="10" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1" />

    <!-- Title and Legend -->
    <text x="${padLeft}" y="17" font-size="10.5" font-weight="900" fill="#0f172a" letter-spacing="-0.01em">
      ORAL GLUCOSE TOLERANCE CURVE (75g GLUCOSE · 3 HOURS SERIAL PROFILE)
    </text>
    <text x="${width - padRight}" y="17" text-anchor="end" font-size="9" font-family="'JetBrains Mono', monospace" font-weight="700" fill="#be123c">
      Y-AXIS: PLASMA GLUCOSE (mg/dL)
    </text>

    <!-- Normal Reference Guide Line (Dashed Slate) -->
    <path d="${refPathD}" fill="none" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="3,3" opacity="0.6" />
    <text x="${width - padRight - 2}" y="${getY(refNormals[6]) - 6}" text-anchor="end" font-size="7.5" fill="#64748b" font-weight="600">Standard Normal Reference Corridor</text>

    <!-- Grid lines -->
    ${gridHtml}

    <!-- Axis baseline -->
    <line x1="${padLeft}" y1="${padTop + plotHeight}" x2="${width - padRight}" y2="${padTop + plotHeight}" stroke="#64748b" stroke-width="1.5" />

    <!-- Shaded area under actual patient curve -->
    ${areaPathD ? `<path d="${areaPathD}" fill="url(#ogttAreaGrad)" />` : ''}

    <!-- Actual curve line -->
    ${curvePathD ? `<path d="${curvePathD}" fill="none" stroke="url(#ogttLineGrad)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" filter="drop-shadow(0 2px 5px rgba(190,18,60,0.3))" />` : ''}

    <!-- Plotted nodes -->
    ${pointsHtml}

    <!-- X Axis Labels -->
    ${xLabelsHtml}
  </svg>`;
}

/**
 * Standard Simplified Protocol & Procedure Explanation Block (GLUCOSE 75 gm)
 */
export function generateOgttProtocolHtml(): string {
  return `
  <div class="rt-ogtt-protocol" style="margin-top: 3.5mm; margin-bottom: 3mm; background: #fdf2f4; border: 1.5px solid #fecdd3; border-radius: 6px; padding: 3mm 4mm; page-break-inside: avoid; break-inside: avoid;">
    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #fda4af; padding-bottom: 1.5mm; margin-bottom: 2mm;">
      <div style="font-weight: 900; font-size: 11px; color: #881337; letter-spacing: -0.01em;">
        📋 بروتوكول وإجراءات منحنى السكر المعتمدة دولياً · PROTOCOL & SAMPLING PROCEDURE (GLUCOSE 75 gm)
      </div>
      <span style="font-size: 8.5px; font-weight: 800; background: #881337; color: #ffffff; padding: 1.5px 6px; border-radius: 4px; text-transform: uppercase;">
        ADA / WHO Guidelines (Standard 3-Hour OGTT)
      </span>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3.5mm; font-size: 8.5px; line-height: 1.55; color: #334155;">
      <div>
        <div style="font-weight: 800; color: #0f172a; margin-bottom: 1mm;">
          🧪 شروط أخذ العينات والتحضير (Patient Preparation):
        </div>
        <ul style="margin: 0; padding-right: 3.5mm; list-style-type: disc;">
          <li><b>الصيام المسبق:</b> صيام تام لمدة <b>8 إلى 12 ساعة</b> قبل العينة الأولى (شرب الماء النقي مسموح فقط).</li>
          <li><b>الجرعة المقررة:</b> إذابة <b>75 جم جلوكوز لا مائي نقي (Anhydrous Glucose 75g)</b> في 250 - 300 مل ماء بارد، وتناولها بالكامل خلال <b>5 دقائق فقط</b> بعد سحب عينة الصائم (Time = 0).</li>
          <li><b>شروط الراحة:</b> استرخاء وراحة تامة بالمعمل طوال فترة الفحص (3 ساعات متتالية)، مع الامتناع التام عن التدخين، الأكل، الشاي والقهوة، أو بذل أي مجهود عضلي.</li>
        </ul>
      </div>

      <div>
        <div style="font-weight: 800; color: #0f172a; margin-bottom: 1mm;">
          ⏱️ مواعيد السحب والتقييم التشخيصي (Diagnostic Timings):
        </div>
        <ul style="margin: 0; padding-right: 3.5mm; list-style-type: disc;">
          <li><b>مواعيد السحب الوريدي:</b> عينة صائم (0 دقيقة)، ثم قياس كل <b>30 دقيقة متتالية</b> (30د، 60د، 90د، 120د، 150د، 180د).</li>
          <li><b>طبيعي (Normal):</b> صائم &lt; 100 مغ/دل | بعد ساعتين &lt; 140 مغ/دل.</li>
          <li><b>مرحلة ما قبل السكري (Pre-Diabetes / IGT):</b> صائم 100 - 125 | بعد ساعتين 140 - 199 مغ/دل.</li>
          <li><b>داء السكري (Diabetes Mellitus):</b> صائم ≥ 126 | أو بعد ساعتين ≥ 200 مغ/دل.</li>
        </ul>
      </div>
    </div>
  </div>`;
}

/**
 * Standard Catalog Template for the 3-Hour Serial OGTT Profile
 */
export const OGTT_CATALOG_TEMPLATE: CatalogProfileTemplate = {
  code: "OGTT",
  titleEn: "Oral Glucose Tolerance Test (OGTT 75g - 3 Hours Serial Curve)",
  titleAr: "منحنى السكر بالدم بعد 75 جم جلوكوز (صائم 8 ساعات وكل 30 دقيقة حتى 3 ساعات)",
  category: "Diabetes & Endocrinology",
  sampleType: "Fluoride Oxalate Plasma (Venous)",
  defaultInterpretation: "Standard 3-Hour Oral Glucose Tolerance Test (OGTT) using 75g anhydrous oral glucose load following an 8-hour overnight fasting period. Interpreted strictly in accordance with American Diabetes Association (ADA) and WHO guidelines.",
  parameters: [
    {
      name: "Fasting Blood Glucose (0 Min - After 8h Fasting)",
      unit: "mg/dL",
      minNormal: 70,
      maxNormal: 99,
      panicLow: 50,
      panicHigh: 250,
      method: "Hexokinase / GOD-PAP",
      textReference: "Normal: 70 - 99 | Impaired Fasting (IFG): 100 - 125 | Diabetic: >= 126 mg/dL",
      notes: "عينة الصائم الأساسية بعد 8 ساعات صيام تام (0 دقيقة)"
    },
    {
      name: "Blood Glucose (30 Minutes Post 75g Glucose)",
      unit: "mg/dL",
      minNormal: 110,
      maxNormal: 170,
      method: "Hexokinase / GOD-PAP",
      textReference: "Absorption Phase: Expected Peak < 180 mg/dL",
      notes: "مستوى الجلوكوز بعد 30 دقيقة من تناول محلول 75 جم جلوكوز"
    },
    {
      name: "Blood Glucose (60 Minutes / 1 Hour Post Glucose)",
      unit: "mg/dL",
      minNormal: 120,
      maxNormal: 180,
      panicHigh: 200,
      method: "Hexokinase / GOD-PAP",
      textReference: "Expected Peak: < 180 mg/dL",
      notes: "مستوى الجلوكوز بعد 60 دقيقة (ساعة كاملة)"
    },
    {
      name: "Blood Glucose (90 Minutes / 1.5 Hours Post Glucose)",
      unit: "mg/dL",
      minNormal: 100,
      maxNormal: 160,
      method: "Hexokinase / GOD-PAP",
      textReference: "Early Clearance Phase: Expected < 160 mg/dL",
      notes: "مستوى الجلوكوز بعد 90 دقيقة (ساعة ونصف)"
    },
    {
      name: "Blood Glucose (120 Minutes / 2 Hours Post Glucose)",
      unit: "mg/dL",
      minNormal: 70,
      maxNormal: 139,
      panicHigh: 200,
      method: "Hexokinase / GOD-PAP",
      textReference: "Normal: < 140 | Impaired (IGT): 140 - 199 | Diabetic: >= 200 mg/dL",
      notes: "نقطة التشخيص الفاصلة الرئيسية (2-Hour Diagnostic Cut-off)"
    },
    {
      name: "Blood Glucose (150 Minutes / 2.5 Hours Post Glucose)",
      unit: "mg/dL",
      minNormal: 70,
      maxNormal: 130,
      method: "Hexokinase / GOD-PAP",
      textReference: "Clearance Phase: Expected < 140 mg/dL",
      notes: "مستوى الجلوكوز بعد 150 دقيقة (ساعتان ونصف)"
    },
    {
      name: "Blood Glucose (180 Minutes / 3 Hours Post Glucose)",
      unit: "mg/dL",
      minNormal: 70,
      maxNormal: 115,
      method: "Hexokinase / GOD-PAP",
      textReference: "Baseline Recovery: 70 - 115 mg/dL (Normal < 120 mg/dL)",
      notes: "مستوى الجلوكوز بعد 180 دقيقة (3 ساعات - العودة للمعدل الطبيعي)"
    },
    {
      name: "Urine Glucose (Serial Glycosuria Screening)",
      unit: "",
      minNormal: 0,
      maxNormal: 0,
      textReference: "Negative (Renal threshold ~ 180 mg/dL)",
      result: "Negative",
      method: "Enzymatic Dipstick",
      notes: "فحص السكر بالبول مع المنحنى"
    }
  ]
};
