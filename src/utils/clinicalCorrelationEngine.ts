/**
 * Clinical Correlation & Evidence-Based Decision Support Engine
 * Correlates current laboratory findings with the patient's medical history,
 * chronic conditions, current medications, and longitudinal delta checks.
 * Integrates international clinical guidelines (ADA 2025/2026, KDIGO 2024,
 * ACC/AHA 2024, BSH/WHO 2024, EASL 2024).
 */

import { LabReport, Patient, TestParameter } from '../types/lab';

export interface MedicalHistoryCorrelation {
  condition: string;
  conditionAr: string;
  correlatedParameters: string[];
  clinicalSignificanceAr: string;
  clinicalSignificanceEn: string;
  riskLevel: 'critical' | 'high' | 'moderate' | 'stable';
  evidenceGuideline: string;
  therapeuticRecommendationsAr: string[];
  therapeuticRecommendationsEn: string[];
}

export interface MedicationLabInteraction {
  medication: string;
  medicationAr: string;
  laboratoryParameter: string;
  interactionType: 'toxicity_risk' | 'therapeutic_monitoring' | 'efficacy_check' | 'contraindication';
  alertSeverity: 'critical' | 'warning' | 'info';
  clinicalNoteAr: string;
  guidelineActionAr: string;
}

export interface DiseaseSpecificAlert {
  category: 'diabetes' | 'cardiac' | 'renal' | 'hepatic' | 'hematology' | 'thyroid' | 'pregnancy';
  titleAr: string;
  titleEn: string;
  severity: 'critical' | 'high' | 'moderate' | 'info';
  messageAr: string;
  rationaleAr: string;
  actionProtocolAr: string;
}

export interface LongitudinalDeltaCheck {
  parameterName: string;
  currentValue: number;
  previousValue: number;
  previousDate: string;
  absoluteChange: number;
  percentChange: number;
  direction: 'increased' | 'decreased' | 'unchanged';
  isSignificantShift: boolean; // Rapid dangerous clinical change
  clinicalInterpretationAr: string;
}

export interface ClinicalCorrelationResult {
  historyCorrelations: MedicalHistoryCorrelation[];
  medicationInteractions: MedicationLabInteraction[];
  diseaseSpecificAlerts: DiseaseSpecificAlert[];
  longitudinalDeltaChecks: LongitudinalDeltaCheck[];
  evidenceBasedGuidelinesSummaryAr: string[];
}

// Helper to safely extract numeric value from parameter
function getNumericValue(params: TestParameter[], aliases: string[]): number | null {
  for (const p of params) {
    const pName = (p.name || '').toLowerCase();
    for (const a of aliases) {
      if (pName.includes(a.toLowerCase())) {
        const num = parseFloat(String(p.result).replace(/[^0-9.-]/g, ''));
        if (!isNaN(num)) return num;
      }
    }
  }
  return null;
}

export function analyzeClinicalCorrelations(
  report: LabReport,
  historicalReports?: LabReport[]
): ClinicalCorrelationResult {
  const patient = report.patient;
  const allParams: TestParameter[] = [];
  report.profiles.forEach(prof => {
    if (Array.isArray(prof.parameters)) {
      allParams.push(...prof.parameters);
    }
  });

  const historyCorrelations: MedicalHistoryCorrelation[] = [];
  const medicationInteractions: MedicationLabInteraction[] = [];
  const diseaseSpecificAlerts: DiseaseSpecificAlert[] = [];
  const longitudinalDeltaChecks: LongitudinalDeltaCheck[] = [];
  const guidelinesSummary: string[] = [];

  // Extract key lab markers
  const fbs = getNumericValue(allParams, ['fasting blood sugar', 'fbs', 'سكر صائم', 'fasting glucose']);
  const hba1c = getNumericValue(allParams, ['hba1c', 'تراكمي', 'glycated hemoglobin']);
  const creat = getNumericValue(allParams, ['creatinine', 'كرياتينين']);
  const egfr = getNumericValue(allParams, ['egfr', 'gfr', 'معدل الترشيح']);
  const k = getNumericValue(allParams, ['potassium', 'بوتاسيوم', 'k+']);
  const na = getNumericValue(allParams, ['sodium', 'صوديوم', 'na+']);
  const alt = getNumericValue(allParams, ['alt', 'sgpt']);
  const ast = getNumericValue(allParams, ['ast', 'sgot']);
  const hb = getNumericValue(allParams, ['hemoglobin', 'hgb', 'هيموجلوبين']);
  const mcv = getNumericValue(allParams, ['mcv']);
  const rdw = getNumericValue(allParams, ['rdw']);
  const ldl = getNumericValue(allParams, ['ldl', 'ldl-c']);
  const tg = getNumericValue(allParams, ['triglycerides', 'دهون ثلاثية']);
  const inr = getNumericValue(allParams, ['inr']);
  const platelets = getNumericValue(allParams, ['platelet', 'plt', 'صفائح']);
  const cpk = getNumericValue(allParams, ['cpk', 'ck', 'creatine kinase']);
  const tsh = getNumericValue(allParams, ['tsh']);
  const microalbumin = getNumericValue(allParams, ['microalbumin', 'uacr', 'albumin/creatinine ratio', 'زلال']);

  const chronicConditions: string[] = ((patient.chronicConditions || []) as string[]).map((c: string) => c.toLowerCase());
  const medications: string[] = ((patient.currentMedications || []) as string[]).map((m: string) => m.toLowerCase());
  const clinicalHistoryText = (patient.clinicalHistory || '').toLowerCase();

  // 1. Diabetes Correlation (ADA 2025/2026 Standards of Care)
  const hasDiabetes =
    chronicConditions.some((c: string) => c.includes('diabet') || c.includes('سكر')) ||
    clinicalHistoryText.includes('diabet') ||
    clinicalHistoryText.includes('سكر') ||
    medications.some((m: string) => m.includes('metformin') || m.includes('insulin') || m.includes('glim') || m.includes('jardiance') || m.includes('ozempic'));

  if (hasDiabetes || (hba1c && hba1c >= 6.5) || (fbs && fbs >= 126)) {
    const isPoorlyControlled = (hba1c && hba1c > 8.0) || (fbs && fbs > 180);
    const recsAr: string[] = [
      'تعديل خطة العلاج الدوائي للوصول لمستهدف السكر التراكمي HbA1c < 7.0% وفق توصيات جمعية السكري الأمريكية (ADA 2025/2026).',
      'يوصى بإضافة مثبطات SGLT2 (مثل Dapagliflozin أو Empagliflozin) أو منبهات GLP-1 RA للحماية القلبية والكلوية المثبتة.',
      'مراقبة نسبة الزلال إلى الكرياتينين بالبول (UACR) ومعدل eGFR سنوياً للتقييم المبكر لاعتلال الكلية السكري.',
      'فحص قاع العين الدوري وفحص القدم السكري لتجنب المضاعفات الوعائية الدقيقة.'
    ];

    historyCorrelations.push({
      condition: 'Type 2 Diabetes Mellitus',
      conditionAr: 'داء السكري (النوع الثاني)',
      correlatedParameters: ['HbA1c', 'Fasting Blood Sugar', 'Serum Creatinine', 'Microalbuminuria'],
      clinicalSignificanceAr: isPoorlyControlled
        ? `ضعف واضح في التحكم السكري (HbA1c: ${hba1c || '-'}% / FBS: ${fbs || '-'} mg/dL) مع زيادة خطر المضاعفات الوعائية الدقيقة والكبيرة.`
        : `تحكم سكري مقبول نسبياً مع ضرورة المتابعة الوقائية المنتظمة لمؤشرات الكلى والدهون.`,
      clinicalSignificanceEn: isPoorlyControlled
        ? `Suboptimal glycemic control exceeding target HbA1c threshold, elevating microvascular risk.`
        : `Acceptable glycemic status under continued lifestyle and pharmacotherapy surveillance.`,
      riskLevel: isPoorlyControlled ? 'high' : 'moderate',
      evidenceGuideline: 'ADA Standards of Care in Diabetes 2025 / 2026',
      therapeuticRecommendationsAr: recsAr,
      therapeuticRecommendationsEn: [
        'Optimize antidiabetic regimen targeting HbA1c < 7.0% without inducing hypoglycemia.',
        'Consider SGLT2 inhibitors or GLP-1 receptor agonists with proven cardiorenal protection.',
        'Annual screening for diabetic kidney disease via eGFR and urine albumin-to-creatinine ratio.'
      ]
    });

    guidelinesSummary.push('ADA 2025/2026: استهداف تراكمي < 7% مع إعطاء الأولوية لأدوية SGLT2i و GLP-1 RA في مرضى السكري المصحوب بعوامل خطورة قلبية أو كلوية.');
  }

  // 2. Chronic Kidney Disease & Hypertension (KDIGO 2024 Guidelines)
  const hasKidneyHistory =
    chronicConditions.some(c => c.includes('kidney') || c.includes('renal') || c.includes('كلى') || c.includes('ckd')) ||
    clinicalHistoryText.includes('كلى') ||
    (creat && creat > 1.3);

  if (hasKidneyHistory || (creat && creat > 1.3) || (egfr && egfr < 60)) {
    const isSevereCKD = (egfr && egfr < 30) || (creat && creat > 2.5);
    historyCorrelations.push({
      condition: 'Chronic Kidney Disease (CKD)',
      conditionAr: 'قصور وظائف الكلى المزمن (CKD)',
      correlatedParameters: ['Serum Creatinine', 'eGFR', 'Potassium', 'Blood Urea', 'Uric Acid'],
      clinicalSignificanceAr: `انخفاض معدل كفاءة الترشيح الكبيبي (eGFR: ${egfr || 'محسوب'} ml/min/1.73m²)، ما يضع المريض في المرحلة ${egfr && egfr < 30 ? 'الرابعة / الخامسة (CKD G4/G5)' : 'الثالثة (CKD G3)'} وفق تصنيف KDIGO الدولي.`,
      clinicalSignificanceEn: `Renal clearance impairment categorized under KDIGO staging, necessitating strict electrolyte and nephrotoxic drug surveillance.`,
      riskLevel: isSevereCKD ? 'critical' : 'high',
      evidenceGuideline: 'KDIGO 2024 Clinical Practice Guideline for CKD Evaluation and Management',
      therapeuticRecommendationsAr: [
        'ضبط ضغط الدم المستهدف بحيث يكون الضغط الانقباضي < 120 مم زئبق وفق توصيات KDIGO 2024.',
        'تعديل جرعات كافة الأدوية التي تُفرز كلوياً لتجنب التسمم الدوائي وتراكم السموم.',
        'مراقبة مستوى البوتاسيوم في الدم بدقة عند استخدام مثبطات الرينين-أنجيوتنسين (ACEi / ARBs).',
        'تجنب مضادات الالتهاب غير الستيرويدية (NSAIDs) ومسكنات البروفين تماماً لمنع التدهور الحاد للوظائف الكلوية.'
      ],
      therapeuticRecommendationsEn: [
        'Target systolic BP < 120 mmHg using standardized automated office measurements.',
        'Renal dosage adjustment for all renally eliminated therapeutics.',
        'Strict avoidance of nephrotoxic agents including NSAIDs and aminoglycosides.'
      ]
    });

    guidelinesSummary.push('KDIGO 2024: ضرورة ضبط ضغط الدم الانقباضي < 120 مم زئبق مع مراقبة البوتاسيوم وتجنب مضادات الالتهاب غير الستيرويدية.');
  }

  // 3. Cardiovascular & Dyslipidemia (ACC/AHA 2024 Guidelines)
  const hasCardiacHistory =
    chronicConditions.some(c => c.includes('heart') || c.includes('cardiac') || c.includes('قلب') || c.includes('ضغط') || c.includes('htn') || c.includes('hypertension')) ||
    clinicalHistoryText.includes('قلب') ||
    clinicalHistoryText.includes('ضغط');

  if (hasCardiacHistory || (ldl && ldl > 130) || (tg && tg > 200)) {
    historyCorrelations.push({
      condition: 'Atherosclerotic Cardiovascular Disease & Dyslipidemia',
      conditionAr: 'أمراض القلب والشرايين واضطراب دهون الدم',
      correlatedParameters: ['LDL-Cholesterol', 'Triglycerides', 'Total Cholesterol', 'HDL-C'],
      clinicalSignificanceAr: `ارتفاع الكوليسترول الضار LDL (${ldl || '-'} mg/dL) يشكل عامل خطورة وعائي مباشر لتصلب الشرايين والأزمات التاجية.`,
      clinicalSignificanceEn: `Elevated atherogenic lipid fractions contributing to elevated 10-year ASCVD risk score.`,
      riskLevel: ldl && ldl > 160 ? 'high' : 'moderate',
      evidenceGuideline: 'ACC / AHA Multisociety Guideline on the Management of Blood Cholesterol 2024',
      therapeuticRecommendationsAr: [
        'العلاج بمخفضات الكوليسترول عالية الشدة (High-Intensity Statins مثل Atorvastatin 40-80 mg أو Rosuvastatin 20-40 mg) لخفض LDL بنسبة > 50%.',
        'استهداف مستوى LDL < 70 mg/dL في المرضى ذوي الخطورة العالية، و < 55 mg/dL لمرضى الذبحة وتصلب الشرايين المثبت.',
        'اتباع حمية البحر الأبيض المتوسط الغذائية لخفض الدهون الثلاثية ودعم صحة الأوعية الدموية.'
      ],
      therapeuticRecommendationsEn: [
        'Initiate or titrate to high-intensity statin therapy aiming for ≥50% LDL-C reduction.',
        'Consider addition of Ezetimibe if target LDL-C is unmet on maximally tolerated statin.'
      ]
    });

    guidelinesSummary.push('ACC/AHA 2024: مستهدف الكوليسترول الضار LDL < 55 mg/dL لمرضى الخطورة الشديدة، مع استخدام ستاتينات عالية الشدة.');
  }

  // 4. Medication - Laboratory Interactions Check
  // Check Metformin with renal impairment
  const isOnMetformin = medications.some(m => m.includes('metformin') || m.includes('glucophage') || m.includes('سيدوفاج'));
  if (isOnMetformin && creat && creat > 1.4) {
    medicationInteractions.push({
      medication: 'Metformin (Glucophage)',
      medicationAr: 'ميتفورمين (جلوكوفاج / سيدوفاج)',
      laboratoryParameter: 'Serum Creatinine / eGFR',
      interactionType: 'toxicity_risk',
      alertSeverity: 'critical',
      clinicalNoteAr: `المريض يتناول ميتفورمين مع ارتفاع الكرياتينين (${creat} mg/dL). يزيد ذلك من خطر تراكم الميتفورمين وحدوث الحماض اللبني الخطير (Metformin-Associated Lactic Acidosis - MALA).`,
      guidelineActionAr: 'يوصى بتخفيض جرعة الميتفورمين فوراً إلى 500-1000 مجم إذا كان eGFR بين 30-45، وإيقافه نهائياً إذا انخفض eGFR < 30 ml/min.'
    });
  }

  // Check ACE-inhibitors / ARBs with Hyperkalemia
  const isOnAceArb = medications.some(m => m.includes('pril') || m.includes('sartan') || m.includes('كونكور') || m.includes('كابوتين') || m.includes('ليزينوبريل'));
  if (isOnAceArb && k && k > 5.1) {
    medicationInteractions.push({
      medication: 'ACE Inhibitors / ARBs (e.g., Lisinopril, Losartan)',
      medicationAr: 'مثبطات الأنجيوتنسين (ACEi / ARBs)',
      laboratoryParameter: 'Serum Potassium (K+)',
      interactionType: 'toxicity_risk',
      alertSeverity: 'critical',
      clinicalNoteAr: `ارتفاع مستوى البوتاسيوم (${k} mmol/L) بالتزامن مع تناول مثبطات الأنجيوتنسين يهدد باضطراب نظم القلب القلبي الحاد.`,
      guidelineActionAr: 'يوصى بإعادة فحص البوتاسيوم بشكل عاجل، وإيقاف مكملات البوتاسيوم ومدرات البول الموفرة للبوتاسيوم، ومراجعة جرعة الدواء الخافض للضغط.'
    });
  }

  // Check Statins with Liver enzymes / Muscle markers
  const isOnStatin = medications.some(m => m.includes('statin') || m.includes('ليبيتور') || m.includes('اتور') || m.includes('كريستور'));
  if (isOnStatin && (alt && alt > 70 || cpk && cpk > 300)) {
    medicationInteractions.push({
      medication: 'Statins (Atorvastatin / Rosuvastatin)',
      medicationAr: 'مخفضات الكوليسترول (الستاتينات)',
      laboratoryParameter: 'ALT / AST / CPK',
      interactionType: 'toxicity_risk',
      alertSeverity: 'warning',
      clinicalNoteAr: `ارتفاع إنزيمات الكبد أو العضلات لدى مريض يتناول الستاتينات يُشير إلى احتمال اعتلال كبدي أو عضلي ناتج عن الدواء (Statin-induced myopathy / transaminitis).`,
      guidelineActionAr: 'يوصى بتقييم آلام العضلات، وإعادة قياس CPK وإنزيمات الكبد بعد أسبوعين، أو تخفيض الجرعة مؤقتاً.'
    });
  }

  // Check Warfarin with INR
  const isOnWarfarin = medications.some(m => m.includes('warfarin') || m.includes('ماريفان') || m.includes('مريفان') || m.includes('coumadin'));
  if (isOnWarfarin && inr) {
    const isHighBleed = inr > 3.5;
    const isSubtherapeutic = inr < 2.0;
    medicationInteractions.push({
      medication: 'Warfarin (Marevan)',
      medicationAr: 'مضاد التجلط وارفارين (ماريفان)',
      laboratoryParameter: 'PT / INR',
      interactionType: isHighBleed ? 'toxicity_risk' : isSubtherapeutic ? 'efficacy_check' : 'therapeutic_monitoring',
      alertSeverity: inr > 4.5 ? 'critical' : isHighBleed || isSubtherapeutic ? 'warning' : 'info',
      clinicalNoteAr: isHighBleed
        ? `ارتفاع مؤشر السيولة INR (${inr}) عن النطاق العلاجي الآمن (2.0 - 3.0)، مما يضاعف خطر النزيف العفوي الحاد.`
        : isSubtherapeutic
        ? `انخفاض INR (${inr}) عن النطاق العلاجي، مما يُعرض المريض لخطر تشكل الجلطات والانصمام الخثاري.`
        : `مؤشر السيولة INR (${inr}) ضمن النطاق العلاجي المثالي (2.0 - 3.0).`,
      guidelineActionAr: isHighBleed
        ? 'تخفيض جرعة الوارفارين فوراً، مع إعطاء فيتامين K1 بالفم إذا تجاوز الـ INR 4.5 بدون نزيف، ومراجعة الطبيب المعالج.'
        : isSubtherapeutic
        ? 'تعديل جرعة الوارفارين تدريجياً للوصول للنطاق العلاجي المطلوب.'
        : 'استمرار نفس الجرعة المعتادة مع إعادة الفحص الدوري بعد 2-4 أسابيع.'
    });
  }

  // 5. Disease-Specific Smart Pathological Alerts
  // Hematology Alert: Severe Microcytic Anemia
  if (hb && hb < 9.0 && mcv && mcv < 75) {
    const mentzer = mcv && getNumericValue(allParams, ['rbc']) ? mcv / (getNumericValue(allParams, ['rbc']) || 1) : null;
    diseaseSpecificAlerts.push({
      category: 'hematology',
      titleAr: 'تنبيه سريري: فقر دم صغير الكريات شديد (Microcytic Hypochromic Anemia)',
      titleEn: 'Severe Microcytic Hypochromic Anemia Alert',
      severity: hb < 7.5 ? 'critical' : 'high',
      messageAr: `انخفاض حاد في خضاب الدم (Hb: ${hb} g/dL) مع صغر حجم الكريات (MCV: ${mcv} fL).`,
      rationaleAr: mentzer && mentzer > 13
        ? `مؤشر منتزر (${mentzer.toFixed(1)}) يرجح بقوة أنيميا نقص الحديد الناتجة عن نزف مزمن أو سوء امتصاص.`
        : `ضرورة عمل فحص فصل كهربائي للهيموجلوبين (Hb Electrophoresis) لاستبعاد ثلاسيميا بيتا الصغرى.`,
      actionProtocolAr: 'يوصى بقياس الفيريتين ومخزون الحديد TIBC، والبحث عن مصادر النزيف الخفي في الجهاز الهضمي أو البولي.'
    });
  }

  // Critical Cardiac Alert: Troponin / Severe chest pain markers
  const trop = getNumericValue(allParams, ['troponin', 'تروبونين', 'trop']);
  if (trop && trop > 0.04) {
    diseaseSpecificAlerts.push({
      category: 'cardiac',
      titleAr: 'تنبيه خطورة حرجة: إيجابية مؤشر الاحتشاء القلبي (Troponin Positive)',
      titleEn: 'Critical Acute Myocardial Injury Alert',
      severity: 'critical',
      messageAr: `ارتفاع حرج في مستوى التروبونين (${trop}) يدل على تنخر أو إجهاد حاد في خلايا عضلة القلب.`,
      rationaleAr: 'احتمالية عالية لمتلازمة الشريان التاجي الحادة (Acute Coronary Syndrome / NSTEMI).',
      actionProtocolAr: 'إحالة عاجلة فورية لقسم طوارئ القلب لعمل رسم قلب عاجل (ECG) وتقييم القسطرة القلبية الطارئة.'
    });
  }

  // Renal Panic Alert: Hyperkalemia
  if (k && k > 6.0) {
    diseaseSpecificAlerts.push({
      category: 'renal',
      titleAr: 'تنبيه طوارئ حرج: فرط بوتاسيوم الدم المهدد للحياة (Severe Hyperkalemia)',
      titleEn: 'Life-Threatening Hyperkalemia Alert',
      severity: 'critical',
      messageAr: `مستوى البوتاسيوم (${k} mmol/L) في نطاق الخطر الأقصى لاضطراب كهربية القلب والتوقف البطيني.`,
      rationaleAr: 'تأثير مباشر على إمكانات عمل أغشية خلايا القلب مما يسبب تغيرات ECG وتوقف القلب.',
      actionProtocolAr: 'الاتصال الفوري بالطبيب المعالج، وإعطاء جلوكونات الكالسيوم الوريدية مع الإنسولين والجلوكوز كإسعاف فوري.'
    });
  }

  // 6. Longitudinal Delta Checks against previous reports
  if (Array.isArray(historicalReports) && historicalReports.length > 0) {
    // Sort previous reports by date desc
    const sorted = [...historicalReports]
      .filter(r => r.id !== report.id && r.patient.nationalId === patient.nationalId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (sorted.length > 0) {
      const prevReport = sorted[0];
      const prevParams: TestParameter[] = [];
      prevReport.profiles.forEach(p => prevParams.push(...p.parameters));

      // Key parameters to delta check
      const trackedParams = [
        { name: 'Hemoglobin', aliases: ['hemoglobin', 'hgb', 'هيموجلوبين'], thresholdPercent: 15 },
        { name: 'Serum Creatinine', aliases: ['creatinine', 'كرياتينين'], thresholdPercent: 25 },
        { name: 'Fasting Blood Sugar', aliases: ['fasting blood sugar', 'fbs', 'سكر صائم'], thresholdPercent: 30 },
        { name: 'HbA1c', aliases: ['hba1c', 'تراكمي'], thresholdPercent: 15 },
        { name: 'Platelets', aliases: ['platelet', 'plt', 'صفائح'], thresholdPercent: 35 },
        { name: 'ALT (SGPT)', aliases: ['alt', 'sgpt'], thresholdPercent: 50 }
      ];

      trackedParams.forEach(tracker => {
        const currentVal = getNumericValue(allParams, tracker.aliases);
        const prevVal = getNumericValue(prevParams, tracker.aliases);

        if (currentVal !== null && prevVal !== null && prevVal > 0) {
          const diff = currentVal - prevVal;
          const pct = ((diff / prevVal) * 100);
          const isSignificant = Math.abs(pct) >= tracker.thresholdPercent;

          longitudinalDeltaChecks.push({
            parameterName: tracker.name,
            currentValue: currentVal,
            previousValue: prevVal,
            previousDate: prevReport.createdAt.split('T')[0],
            absoluteChange: Number(diff.toFixed(2)),
            percentChange: Number(pct.toFixed(1)),
            direction: diff > 0.05 ? 'increased' : diff < -0.05 ? 'decreased' : 'unchanged',
            isSignificantShift: isSignificant,
            clinicalInterpretationAr: isSignificant
              ? `تغير سريري ملحوظ (${pct > 0 ? '+' : ''}${pct.toFixed(1)}%) مقارنة بزيارة ${prevReport.createdAt.split('T')[0]}، يستدعي تقييماً طبياً وتأكيداً معملياً (Delta Check Alert).`
              : `تغير طفيف في الحدود الفسيولوجية المقبولة مقارنة بآخر زيارة.`
          });
        }
      });
    }
  }

  return {
    historyCorrelations,
    medicationInteractions,
    diseaseSpecificAlerts,
    longitudinalDeltaChecks,
    evidenceBasedGuidelinesSummaryAr: guidelinesSummary
  };
}
