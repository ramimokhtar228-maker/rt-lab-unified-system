/**
 * Wearable Medical Devices Integration & Continuous Biomarker Analytics
 * Integrates data from continuous glucose monitors (CGM: Dexcom, Abbott FreeStyle Libre)
 * and smart wearable health monitors (Apple Watch, Garmin, Samsung Galaxy Watch, Google Health Connect).
 */

import { LabReport, TestParameter } from '../types/lab';

export interface WearableDeviceTelemetry {
  deviceId: string;
  deviceModel: string;
  manufacturer: 'Apple' | 'Dexcom' | 'Abbott' | 'Garmin' | 'Samsung' | 'Fitbit';
  batteryPercent: number;
  lastSyncTimestamp: string;
  status: 'active_syncing' | 'connected' | 'offline';
}

export interface ContinuousGlucoseProfile {
  avgGlucoseMgDl: number;
  timeInRangePercent: number; // 70-180 mg/dL target > 70%
  timeBelowRangePercent: number; // < 70 mg/dL target < 4%
  timeAboveRangePercent: number; // > 180 mg/dL target < 25%
  glucoseManagementIndicatorGmi: number; // Calculated estimated HbA1c %
  coefficientOfVariationCvPercent: number; // Target < 36%
  sensorDaysRemaining: number;
  trendCurve24h: Array<{ hour: string; glucose: number }>;
}

export interface WearableVitalSigns {
  restingHeartRateBpm: number;
  avgSpO2Percent: number;
  minSpO2Percent: number; // Nocturnal desaturations
  ambulatoryBpSystolic: number;
  ambulatoryBpDiastolic: number;
  heartRateVariabilityMs: number; // HRV
  sleepHours: number;
  dailyStepCount: number;
}

export interface WearableLabCorrelationInsight {
  titleAr: string;
  titleEn: string;
  correlationStatus: 'concordant' | 'discordant' | 'warning';
  labMarker: string;
  wearableMetric: string;
  clinicalExplanationAr: string;
  clinicalExplanationEn: string;
  recommendationAr: string;
}

export interface WearableHealthDataset {
  telemetry: WearableDeviceTelemetry;
  cgm: ContinuousGlucoseProfile;
  vitals: WearableVitalSigns;
  correlationInsights: WearableLabCorrelationInsight[];
}

/**
 * Generates sample wearable telemetry correlated with the current patient's lab report.
 */
export function getPatientWearableDataset(report: LabReport): WearableHealthDataset {
  const allParams: TestParameter[] = [];
  report.profiles.forEach(p => allParams.push(...p.parameters));

  const hba1cParam = allParams.find(p => (p.name || '').toLowerCase().includes('hba1c') || (p.name || '').includes('تراكمي'));
  const hba1cVal = hba1cParam ? parseFloat(String(hba1cParam.result).replace(/[^0-9.-]/g, '')) : 6.8;

  const hbParam = allParams.find(p => (p.name || '').toLowerCase().includes('hemoglobin') || (p.name || '').includes('هيموجلوبين'));
  const hbVal = hbParam ? parseFloat(String(hbParam.result).replace(/[^0-9.-]/g, '')) : 13.5;

  // Approximate CGM estimated glucose based on lab HbA1c (Nathan formula: eAG = 28.7 * A1c - 46.7)
  const estimatedMeanGlucose = Math.round(28.7 * (hba1cVal || 6.5) - 46.7);
  const timeInRange = hba1cVal > 8.0 ? 52 : hba1cVal > 7.0 ? 68 : 84;

  const curve: Array<{ hour: string; glucose: number }> = [];
  const hours = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];
  hours.forEach((hr, i) => {
    const variance = Math.sin(i * 0.8) * 25 + (Math.random() * 10 - 5);
    curve.push({
      hour: hr,
      glucose: Math.max(75, Math.round(estimatedMeanGlucose + variance))
    });
  });

  const restingHr = hbVal < 10.0 ? 88 : 72; // Compensatory tachycardia in anemia
  const spo2 = 98;

  const insights: WearableLabCorrelationInsight[] = [];

  // Correlation 1: CGM Estimated HbA1c (GMI) vs Lab HPLC HbA1c
  const gmi = Number((0.0331 * estimatedMeanGlucose + 3.31).toFixed(1));
  const a1cDiff = Math.abs((hba1cVal || 6.5) - gmi);

  if (a1cDiff > 0.8) {
    insights.push({
      titleAr: 'تباين بين قراءة المستشعر المستمر (CGM) والسكر التراكمي المخبري',
      titleEn: 'Discordance between CGM Sensor GMI and Laboratory HbA1c',
      correlationStatus: 'discordant',
      labMarker: `HbA1c المعملي: ${hba1cVal}%`,
      wearableMetric: `مؤشر المستشعر GMI: ${gmi}%`,
      clinicalExplanationAr: `وجود فرق ملحوظ (> 0.8%) بين التراكمي المعملي ومتوسط المستشعر قد يشير إلى اعتلال في عمر كرات الدم الحمراء (RBC lifespan)، أو نقص حديد كامن يؤثر على ارتباط الجلوكوز بالهيموجلوبين.`,
      clinicalExplanationEn: `Discordance suggests altered red blood cell turnover or hemoglobinopathy affecting glycation rate.`,
      recommendationAr: 'مراجعة فيلم الدم وفحص الفيريتين لاستبعاد نقص الحديد المؤثر على التراكمي.'
    });
  } else {
    insights.push({
      titleAr: 'تطابق مثالي بين حساس السكر المستمر والتراكمي المعملي',
      titleEn: 'High Concordance: Sensor GMI Matches Laboratory HbA1c',
      correlationStatus: 'concordant',
      labMarker: `HbA1c المعملي: ${hba1cVal}%`,
      wearableMetric: `مؤشر المستشعر GMI: ${gmi}%`,
      clinicalExplanationAr: `توافق كامل يعكس دقة قراءات الحساس المستمر وصحة المؤشر المعملي المحسوب بجهاز HPLC.`,
      clinicalExplanationEn: `Validates glycemic monitoring fidelity across both ambulatory sensor and reference laboratory assay.`,
      recommendationAr: 'الاستمرار على بروتوكول المراقبة الحالي مع استهداف نسبة بقاء في النطاق TIR > 70%.'
    });
  }

  // Correlation 2: Resting Heart Rate vs Hemoglobin
  if (hbVal < 10.5) {
    insights.push({
      titleAr: 'تسارع نبض الراحة المسجل بالساعة الذكية متوافق مع فقر الدم',
      titleEn: 'Elevated Wearable Resting Heart Rate Correlated with Anemia',
      correlationStatus: 'warning',
      labMarker: `الهيموجلوبين: ${hbVal} g/dL`,
      wearableMetric: `نبض الراحة: ${restingHr} bpm`,
      clinicalExplanationAr: `سجلت الساعة الذكية ارتفاعاً في معدل نبض القلب وقت الراحة (${restingHr} نبضة/دقيقة) كاستجابة فسيولوجية تعويضية من القلب لنقص إمداد الأنسجة بالأكسجين الناتج عن الأنيميا.`,
      clinicalExplanationEn: `Compensatory sinus tachycardia secondary to reduced oxygen-carrying capacity of blood.`,
      recommendationAr: 'علاج فقر الدم لتقليل العبء القلبي ومراقبة انخفاض نبض الراحة تدريجياً.'
    });
  }

  return {
    telemetry: {
      deviceId: 'RT-WEAR-9481',
      deviceModel: 'Apple Watch Ultra 2 + Dexcom G7 CGM',
      manufacturer: 'Apple',
      batteryPercent: 88,
      lastSyncTimestamp: new Date().toLocaleTimeString('ar-EG'),
      status: 'active_syncing'
    },
    cgm: {
      avgGlucoseMgDl: estimatedMeanGlucose,
      timeInRangePercent: timeInRange,
      timeBelowRangePercent: 2,
      timeAboveRangePercent: 100 - timeInRange - 2,
      glucoseManagementIndicatorGmi: gmi,
      coefficientOfVariationCvPercent: 28,
      sensorDaysRemaining: 7,
      trendCurve24h: curve
    },
    vitals: {
      restingHeartRateBpm: restingHr,
      avgSpO2Percent: spo2,
      minSpO2Percent: 94,
      ambulatoryBpSystolic: 122,
      ambulatoryBpDiastolic: 78,
      heartRateVariabilityMs: 42,
      sleepHours: 7.2,
      dailyStepCount: 6840
    },
    correlationInsights: insights
  };
}
