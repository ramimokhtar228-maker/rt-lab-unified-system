import { LabReport, TestParameter } from '../types/lab';

export interface SmartClinicalAnalysis {
  reportId: string;
  patientName: string;
  age: number;
  gender: 'male' | 'female';
  executiveSummaryAr: string;
  executiveSummaryEn: string;
  criticalAlerts: Array<{
    titleAr: string;
    titleEn: string;
    severity: 'critical' | 'high' | 'moderate';
    detail: string;
  }>;
  organScores: {
    renal: { score: number; labelAr: string; status: 'optimal' | 'mild' | 'moderate' | 'critical' | 'not_tested'; tested?: boolean; summaryAr: string };
    hepatic: { score: number; labelAr: string; status: 'optimal' | 'mild' | 'moderate' | 'critical' | 'not_tested'; tested?: boolean; summaryAr: string };
    metabolic: { score: number; labelAr: string; status: 'optimal' | 'mild' | 'moderate' | 'critical' | 'not_tested'; tested?: boolean; summaryAr: string };
    hematologic: { score: number; labelAr: string; status: 'optimal' | 'mild' | 'moderate' | 'critical' | 'not_tested'; tested?: boolean; summaryAr: string };
    cardiac: { score: number; labelAr: string; status: 'optimal' | 'mild' | 'moderate' | 'critical' | 'not_tested'; tested?: boolean; summaryAr: string };
  };
  calculatedIndices: Array<{
    nameAr: string;
    nameEn: string;
    value: string | number;
    reference: string;
    interpretationAr: string;
  }>;
  differentialDiagnoses: Array<{
    diseaseAr: string;
    diseaseEn: string;
    likelihood: 'high' | 'moderate' | 'possible';
    rationaleAr: string;
  }>;
  consultantRecommendations: string[];
  abnormalParametersCount: number;
  totalParametersCount: number;
  flaggedList: Array<{ name: string; result: string; unit?: string; flag: string }>;
}

// Helper to find parameter by aliases
function findParam(params: TestParameter[], aliases: string[]): TestParameter | undefined {
  for (const p of params) {
    const pName = (p.name || '').toLowerCase();
    for (const a of aliases) {
      if (pName.includes(a.toLowerCase())) return p;
    }
  }
  return undefined;
}

// Helper to get numeric value
function getParamVal(params: TestParameter[], aliases: string[]): number | null {
  const p = findParam(params, aliases);
  if (!p) return null;
  const num = parseFloat(String(p.result).replace(/[^0-9.-]/g, ''));
  return isNaN(num) ? null : num;
}

export function generateSmartClinicalAnalysis(report: LabReport): SmartClinicalAnalysis {
  const p = report.patient;
  const allParams: TestParameter[] = [];
  report.profiles.forEach(pr => {
    if (Array.isArray(pr.parameters)) {
      allParams.push(...pr.parameters);
    }
  });

  const age = p.age || 35;
  const isFemale = p.gender === 'female';

  // Extract key lab markers with comprehensive aliases
  const hb = getParamVal(allParams, ['hemoglobin', 'hgb', 'هيموجلوبين', 'hb', 'hgb ']);
  const rbc = getParamVal(allParams, ['rbc', 'red blood', 'كريات الدم الحمراء', 'red blood cell count']);
  const mcv = getParamVal(allParams, ['mcv', 'mean corpuscular volume']);
  const mch = getParamVal(allParams, ['mch', 'mean corpuscular hemoglobin']);
  const mchc = getParamVal(allParams, ['mchc']);
  const rdw = getParamVal(allParams, ['rdw', 'rdw-cv', 'red cell distribution width']);
  const wbc = getParamVal(allParams, ['wbc', 'white blood', 'كرات الدم البيضاء', 'tlc', 'total leucocyte']);
  const neutrophils = getParamVal(allParams, ['neutrophil', 'neut', 'عدلات', 'seg']);
  const lymphocytes = getParamVal(allParams, ['lymphocyte', 'lymph', 'خلايا ليمفاوية']);
  const platelets = getParamVal(allParams, ['platelet', 'plt', 'صفائح', 'platelet count']);

  // Glycemic
  const fbs = getParamVal(allParams, ['fasting blood sugar', 'fbs', 'سكر صائم', 'fasting glucose', 'glucose fasting']);
  const ppbs = getParamVal(allParams, ['post prandial', 'ppbs', 'سكر بعد الاكل', '2h pp', 'post-prandial']);
  const rbs = getParamVal(allParams, ['random blood sugar', 'rbs', 'سكر عشوائي']);
  const hba1c = getParamVal(allParams, ['hba1c', 'تراكمي', 'glycated hemoglobin', 'a1c']);
  const insulin = getParamVal(allParams, ['insulin', 'fasting insulin', 'إنسولين']);

  // Renal & Electrolytes
  const creat = getParamVal(allParams, ['creatinine', 'كرياتينين', 'serum creatinine']);
  const urea = getParamVal(allParams, ['blood urea', 'بولينا', 'urea']);
  const bun = getParamVal(allParams, ['bun', 'blood urea nitrogen']);
  const uricAcid = getParamVal(allParams, ['uric acid', 'يوريك اسيد', 'حمض البوليك', 'urate']);
  const potassium = getParamVal(allParams, ['potassium', 'بوتاسيوم', 'k+']);
  const sodium = getParamVal(allParams, ['sodium', 'صوديوم', 'na+']);
  const calcium = getParamVal(allParams, ['calcium', 'كالسيوم', 'ca++']);
  const albumin = getParamVal(allParams, ['albumin', 'ألبومين']);

  // Hepatic
  const alt = getParamVal(allParams, ['alt', 'sgpt', 'أنزيم الكبد alt', 'alanine']);
  const ast = getParamVal(allParams, ['ast', 'sgot', 'aspartate']);
  const alp = getParamVal(allParams, ['alkaline phosphatase', 'alp', 'فوسفاتيز قلوي']);
  const ggt = getParamVal(allParams, ['ggt', 'gamma gt']);
  const bili = getParamVal(allParams, ['total bilirubin', 'صفراء كلية', 'bilirubin total']);
  const directBili = getParamVal(allParams, ['direct bilirubin', 'صفراء مباشرة']);

  // Lipid & Cardiac
  const chol = getParamVal(allParams, ['cholesterol', 'كولسترول', 'total cholesterol']);
  const tg = getParamVal(allParams, ['triglyceride', 'دهون ثلاثية', 'triglycerides']);
  const hdl = getParamVal(allParams, ['hdl', 'hdl cholesterol']);
  const ldl = getParamVal(allParams, ['ldl', 'ldl cholesterol']);
  const troponin = getParamVal(allParams, ['troponin', 'تروبونين']);
  const ckmb = getParamVal(allParams, ['ck-mb', 'ckmb']);
  const dDimer = getParamVal(allParams, ['d-dimer', 'd dimer', 'دي دايمر']);

  // Thyroid & Inflammatory
  const tsh = getParamVal(allParams, ['tsh', 'هرمون الغدة الدرقية']);
  const ft4 = getParamVal(allParams, ['ft4', 'free t4']);
  const ft3 = getParamVal(allParams, ['ft3', 'free t3']);
  const crp = getParamVal(allParams, ['crp', 'c-reactive', 'بروتين سي التفاعلي']);
  const esr = getParamVal(allParams, ['esr', 'سرعة الترسيب', 'erythrocyte sedimentation']);
  const ferritin = getParamVal(allParams, ['ferritin', 'فيريتين', 'مخزون الحديد']);
  const vitD = getParamVal(allParams, ['vitamin d', 'فيتامين د', '25-oh']);
  const vitB12 = getParamVal(allParams, ['vitamin b12', 'فيتامين ب12', 'b12']);

  const criticalAlerts: SmartClinicalAnalysis['criticalAlerts'] = [];
  const calculatedIndices: SmartClinicalAnalysis['calculatedIndices'] = [];
  const differentialDiagnoses: SmartClinicalAnalysis['differentialDiagnoses'] = [];
  const consultantRecommendations: string[] = [];
  const flaggedList: Array<{ name: string; result: string; unit?: string; flag: string }> = [];

  // Track all flagged parameters
  allParams.forEach(param => {
    if (param.flag && param.flag !== 'NORMAL') {
      flaggedList.push({
        name: param.name,
        result: param.result,
        unit: param.unit,
        flag: param.flag
      });
    }

    // Auto alert for PANIC flags
    if (param.flag === 'PANIC_HIGH' || param.flag === 'PANIC_LOW') {
      criticalAlerts.push({
        titleAr: `قيمة حرجة تستدعي التدخل الفوري: ${param.name}`,
        titleEn: `Critical Panic Finding: ${param.name}`,
        severity: 'critical',
        detail: `النتيجة المسجلة (${param.result} ${param.unit || ''}) تقع في النطاق الخطر الحرج (${param.flag}). يرجى إبلاغ الطبيب المعالج فوراً لاتخاذ الإجراء الطبي اللازم.`
      });
    }
  });

  // Determine which vital systems were actually evaluated in this report
  const hasParamNamed = (terms: string[]) => {
    return allParams.some(p => {
      const name = (p.name || '').toLowerCase();
      return terms.some(t => name.includes(t.toLowerCase()));
    });
  };

  const renalTested = creat !== null || urea !== null || bun !== null || uricAcid !== null || hasParamNamed(['urine', 'كلى', 'بول', 'microalbumin', 'egfr']);
  const hepaticTested = alt !== null || ast !== null || alp !== null || ggt !== null || bili !== null || directBili !== null || albumin !== null || hasParamNamed(['liver', 'كبد', 'lft']);
  const metabolicTested = fbs !== null || ppbs !== null || rbs !== null || hba1c !== null || insulin !== null || tsh !== null || hasParamNamed(['glucose', 'سكر', 'تراكمي', 'diabetes']);
  const hematologicTested = hb !== null || rbc !== null || wbc !== null || platelets !== null || esr !== null || crp !== null || hasParamNamed(['cbc', 'blood', 'دم', 'hemoglobin']);
  const cardiacTested = chol !== null || tg !== null || hdl !== null || ldl !== null || troponin !== null || ckmb !== null || dDimer !== null || hasParamNamed(['lipid', 'دهون', 'cardiac', 'قلب']);

  // Base Organ Scores (start at 100 for tested organs)
  let renalScore = 100;
  let hepaticScore = 100;
  let metabolicScore = 100;
  let hematologicScore = 100;
  let cardiacScore = 100;

  // ----------------------------------------------------
  // 1. HEMATOLOGY EVALUATION
  // ----------------------------------------------------
  if (hb !== null) {
    const isAnemic = isFemale ? hb < 12.0 : hb < 13.0;
    if (hb < 7.5) {
      criticalAlerts.push({
        titleAr: 'أنيميا حادة شديدة الخطورة (Severe Anemia - Critical)',
        titleEn: 'Severe Anemia (Hb < 7.5 g/dL)',
        severity: 'critical',
        detail: `مستوى الهيموجلوبين منخفض جداً (${hb} g/dL). يستدعي تقييماً سريرياً عاجلاً وفحص مصدر النزيف أو استشارة نقل دم.`
      });
      hematologicScore -= 50;
    } else if (isAnemic) {
      hematologicScore -= 25;
      if (mcv !== null) {
        if (mcv < 80) {
          differentialDiagnoses.push({
            diseaseAr: 'أنيميا صغر حجم كرات الدم الحمراء ونقص الصبغ (Microcytic Hypochromic Anemia)',
            diseaseEn: 'Microcytic Hypochromic Anemia',
            likelihood: 'high',
            rationaleAr: `انخفاض الهيموجلوبين (${hb} g/dL) مع انخفاض متوسط حجم الكريات MCV (${mcv} fL).`
          });
        } else if (mcv > 100) {
          differentialDiagnoses.push({
            diseaseAr: 'أنيميا تضخم كرات الدم الحمراء (Macrocytic Anemia)',
            diseaseEn: 'Macrocytic Anemia',
            likelihood: 'high',
            rationaleAr: `انخفاض الهيموجلوبين (${hb} g/dL) مع كبر حجم الكريات MCV (${mcv} fL)، يُرجح نقص فيتامين ب12 أو حمض الفوليك.`
          });
          consultantRecommendations.push('يوصى بفحص مستويات فيتامين ب12 (Vitamin B12) وحمض الفوليك (Folic Acid) بالدم.');
        } else {
          differentialDiagnoses.push({
            diseaseAr: 'أنيميا سوية الحجم والصبغ (Normocytic Normochromic Anemia)',
            diseaseEn: 'Normocytic Normochromic Anemia',
            likelihood: 'moderate',
            rationaleAr: `هيموجلوبين منخفض (${hb} g/dL) مع حجم كريات طبيعي (${mcv} fL)؛ قد ترتبط بمرض مزمن أو قصور كلوي أو نزيف حديث.`
          });
        }
      }
    }

    // Mentzer, Green & King, Srivastava Indices
    if (mcv !== null && rbc !== null && rbc > 0) {
      const mentzer = Number((mcv / rbc).toFixed(1));
      let mentzerInterp = '';
      if (mentzer < 13) {
        mentzerInterp = 'مؤشر منتزر < 13: يُشير بقوة إلى سمة ثلاسيميا البحر المتوسط (Beta Thalassemia Trait / Minor).';
        differentialDiagnoses.push({
          diseaseAr: 'سمة ثلاسيميا بيتا (Beta Thalassemia Minor / Trait)',
          diseaseEn: 'Beta Thalassemia Minor',
          likelihood: 'high',
          rationaleAr: `صغر واضح في حجم الكريات (MCV=${mcv}) مع ارتفاع نسبي في عدد كرات الدم (RBC=${rbc}) ومؤشر منتزر = ${mentzer} (< 13).`
        });
        consultantRecommendations.push('يوصى بإجراء فصل كهربائي للهيموجلوبين (Hb Electrophoresis) لتأكيد سمة الثلاسيميا وقياس HbA2.');
      } else {
        mentzerInterp = 'مؤشر منتزر > 13: يُرجح وجود أنيميا نقص الحديد (Iron Deficiency Anemia).';
        differentialDiagnoses.push({
          diseaseAr: 'أنيميا نقص الحديد (Iron Deficiency Anemia)',
          diseaseEn: 'Iron Deficiency Anemia',
          likelihood: 'high',
          rationaleAr: `صغر حجم الكريات ونقص الصبغ مع مؤشر منتزر = ${mentzer} (> 13).`
        });
        consultantRecommendations.push('يوصى بفحص مخزون الحديد في الدم (Serum Ferritin & Iron / TIBC) وبدء كورس علاجي تعويضي مناسب.');
      }
      calculatedIndices.push({
        nameAr: 'مؤشر منتزر للأنيميا (Mentzer Index)',
        nameEn: 'Mentzer Index (MCV / RBC)',
        value: mentzer,
        reference: '< 13 Thalassemia | > 13 Iron Def',
        interpretationAr: mentzerInterp
      });

      // Green & King Index
      if (rdw !== null) {
        const gk = Number(((mcv * mcv * rdw) / (hb * 100)).toFixed(1));
        calculatedIndices.push({
          nameAr: 'مؤشر جرين وكينج (Green & King Index)',
          nameEn: 'Green & King Index ((MCV² × RDW) / (Hb × 100))',
          value: gk,
          reference: '< 65 Thalassemia | > 72 Iron Def',
          interpretationAr: gk < 65 ? 'أقل من 65: يُدعم تشخيص سمة الثلاسيميا.' : 'أكبر من 72: يُدعم تشخيص أنيميا نقص الحديد.'
        });
      }
    }
  }

  // Platelet count evaluation
  if (platelets !== null) {
    if (platelets < 50) {
      criticalAlerts.push({
        titleAr: 'نقص حرج في الصفائح الدموية (Critical Thrombocytopenia)',
        titleEn: 'Severe Thrombocytopenia (PLT < 50,000)',
        severity: 'critical',
        detail: `عدد الصفائح الدموية (${platelets} ألف/ميكرولتر) منخفض جداً؛ خطر حدوث نزيف عفوي.`
      });
      hematologicScore -= 45;
      consultantRecommendations.push('إعادة فحص شريحة دم محيطية طازجة في أنبوبة سيترات الصوديوم لاستبعاد التراكم الكاذب (Pseudothrombocytopenia).');
    } else if (platelets < 150) {
      hematologicScore -= 20;
    } else if (platelets > 500) {
      hematologicScore -= 15;
      differentialDiagnoses.push({
        diseaseAr: 'ارتفاع الصفائح الدموية التفاعلي (Reactive Thrombocytosis)',
        diseaseEn: 'Reactive Thrombocytosis',
        likelihood: 'moderate',
        rationaleAr: `ارتفاع الصفائح الدموية إلى ${platelets} ألف؛ يرتبط عادة بالالتهابات الحادة أو نقص الحديد.`
      });
    }
  }

  // Leucocyte & NLR
  if (wbc !== null) {
    if (wbc > 13.0) {
      hematologicScore -= 15;
      if (wbc > 25.0) {
        criticalAlerts.push({
          titleAr: 'ارتفاع حاد في كرات الدم البيضاء (Leukemoid Reaction / Leucocytosis)',
          titleEn: 'Marked Leucocytosis (WBC > 25,000)',
          severity: 'high',
          detail: `ارتفاع ملحوظ في كرات الدم البيضاء (${wbc} ألف)؛ يستدعي فحص تفصيلي للشريحة المجهرية لاستبعاد العدوى الحادة أو الأمراض النقوية.`
        });
      }
    } else if (wbc < 3.5) {
      hematologicScore -= 20;
    }

    if (neutrophils !== null && lymphocytes !== null && lymphocytes > 0) {
      const nlr = Number((neutrophils / lymphocytes).toFixed(2));
      let nlrInterp = nlr < 3.0 ? 'طبيعي ومستقر فسيولوجياً.' : nlr > 5.0 ? 'ارتفاع ملحوظ؛ مؤشر على عدوى بكتيرية حادة أو نشاط التهابي جهازي شديد.' : 'ارتفاع طفيف في مؤشر الإجهاد الالتهابي.';
      calculatedIndices.push({
        nameAr: 'نسبة العدلات إلى الليمفاويات (NLR Ratio)',
        nameEn: 'Neutrophil to Lymphocyte Ratio',
        value: nlr,
        reference: '1.0 - 3.0 Optimal',
        interpretationAr: nlrInterp
      });
      if (nlr > 5.0) {
        differentialDiagnoses.push({
          diseaseAr: 'نشاط التهابي / إنتاني حاد (Acute Inflammatory / Bacterial Response)',
          diseaseEn: 'Systemic Inflammatory Response',
          likelihood: 'high',
          rationaleAr: `ارتفاع نسبة العدلات إلى الليمفاويات (NLR = ${nlr}) مع ارتفاع كرات الدم البيضاء.`
        });
      }
    }
  }

  // ----------------------------------------------------
  // 2. RENAL & URINARY EVALUATION
  // ----------------------------------------------------
  if (creat !== null) {
    if (creat > 1.3) {
      renalScore -= Math.min(50, Math.round((creat - 1.2) * 35));
      if (creat >= 2.5) {
        criticalAlerts.push({
          titleAr: 'قصور كلوي حاد / متقدم (Severe Renal Impairment)',
          titleEn: 'Marked Serum Creatinine Elevation',
          severity: 'critical',
          detail: `مستوى الكرياتينين (${creat} mg/dL) يشير إلى انخفاض ملحوظ في معدل الفلترة الكبيبية.`
        });
      }
    }

    // Estimated GFR (CKD-EPI)
    let egfr = Math.round(141 * Math.pow(Math.min(creat / (isFemale ? 0.7 : 0.9), 1), isFemale ? -0.329 : -0.411) * Math.pow(Math.max(creat / (isFemale ? 0.7 : 0.9), 1), -1.209) * Math.pow(0.993, age) * (isFemale ? 1.018 : 1.0));
    egfr = Math.max(8, Math.min(130, egfr));
    let stage = 'المرحلة G1 (كفاءة كلوية مثالية)';
    if (egfr < 15) stage = 'المرحلة G5 (قصور كلوي نهائي - Kidney Failure)';
    else if (egfr < 30) stage = 'المرحلة G4 (قصور كلوي شديد)';
    else if (egfr < 60) stage = 'المرحلة G3 (قصور كلوي متوسط)';
    else if (egfr < 90) stage = 'المرحلة G2 (انخفاض وظيفي كلوي طفيف)';

    calculatedIndices.push({
      nameAr: 'معدل الترشيح الكبيبي التقريبي (Estimated GFR)',
      nameEn: 'eGFR (CKD-EPI Formula)',
      value: `${egfr} mL/min/1.73m²`,
      reference: '> 90 mL/min',
      interpretationAr: `تصنيف وظائف الكلى: ${stage}`
    });

    if (egfr < 60) {
      differentialDiagnoses.push({
        diseaseAr: 'قصور وظائف الكلى (Chronic Renal Insufficiency / CKD)',
        diseaseEn: 'Chronic Kidney Disease',
        likelihood: 'high',
        rationaleAr: `انخفاض معدل الترشيح الكبيبي إلى ${egfr} mL/min مع ارتفاع الكرياتينين إلى ${creat} mg/dL.`
      });
      consultantRecommendations.push('استشارة طبيب أمراض الكلى، ومراجعة جرعات الأدوية المزمنة وتجنب المسكنات غير الستيرويدية (NSAIDs) لحماية الكلى.');
    }

    // BUN / Creatinine Ratio
    const bloodUrea = bun || (urea ? urea * 0.467 : null);
    if (bloodUrea !== null && creat > 0) {
      const bunCreatRatio = Number((bloodUrea / creat).toFixed(1));
      let ratioInterp = '';
      if (bunCreatRatio > 20) {
        ratioInterp = 'النسبة > 20: تدل على أسباب ما قبل الكلى (Prerenal Azotemia) كالجفاف الشديد، نقص التروية، أو النزيف الهضمي.';
      } else if (bunCreatRatio < 10) {
        ratioInterp = 'النسبة < 10: تدل على أذية نسيجية كلوية داخلية (Intrinsic Renal Disease).';
      } else {
        ratioInterp = 'النسبة طبيعية (10 - 20).';
      }
      calculatedIndices.push({
        nameAr: 'نسبة بولينا الدم إلى الكرياتينين (BUN / Creatinine Ratio)',
        nameEn: 'BUN / Creatinine Ratio',
        value: bunCreatRatio,
        reference: '10.0 - 20.0',
        interpretationAr: ratioInterp
      });
    }
  }

  // Uric Acid
  if (uricAcid !== null) {
    const isUricHigh = isFemale ? uricAcid > 6.0 : uricAcid > 7.2;
    if (isUricHigh) {
      renalScore -= 10;
      differentialDiagnoses.push({
        diseaseAr: 'فرط حمض اليوريك بالدم وقابلية النقرس (Hyperuricemia / Gout Risk)',
        diseaseEn: 'Hyperuricemia',
        likelihood: 'high',
        rationaleAr: `ارتفاع مستوى حمض اليوريك (${uricAcid} mg/dL)؛ قد يؤدي لتشكل حصوات كلوية أو نوبات التهاب مفاصل نقرسية.`
      });
      consultantRecommendations.push('تقليل الأطعمة الغنية بالبيورينات (اللحوم الحمراء والبقوليات)، والإكثار من شرب الماء لتجنب تكون حصوات اليورات الكلوية.');
    }
  }

  // Potassium & Electrolytes
  if (potassium !== null) {
    if (potassium > 5.5) {
      criticalAlerts.push({
        titleAr: 'فرط بوتاسيوم الدم (Hyperkalemia - Cardiac Risk)',
        titleEn: 'Severe Hyperkalemia (K+ > 5.5 mEq/L)',
        severity: 'critical',
        detail: `مستوى البوتاسيوم مرتفع (${potassium} mEq/L)؛ يستدعي تخطيط قلب فوري (ECG) ومراجعة الطوارئ لتجنب اضطراب نبضات القلب.`
      });
      renalScore -= 30;
      cardiacScore -= 25;
    } else if (potassium < 3.5) {
      criticalAlerts.push({
        titleAr: 'نقص بوتاسيوم الدم (Hypokalemia)',
        titleEn: 'Hypokalemia (K+ < 3.5 mEq/L)',
        severity: 'high',
        detail: `مستوى البوتاسيوم منخفض (${potassium} mEq/L)؛ يسبب ضعفاً عضلياً واضطراب كهرباء القلب.`
      });
      renalScore -= 15;
    }
  }

  // ----------------------------------------------------
  // 3. HEPATIC & BILIARY EVALUATION
  // ----------------------------------------------------
  if (alt !== null || ast !== null) {
    const maxEnz = Math.max(alt || 0, ast || 0);
    if (maxEnz > 55) {
      hepaticScore -= Math.min(50, Math.round(maxEnz / 3.5));
      if (maxEnz > 250) {
        criticalAlerts.push({
          titleAr: 'التهاب ونخر كبدي حاد (Acute Hepatocellular Injury)',
          titleEn: 'Severe Transaminase Elevation (ALT/AST > 250 U/L)',
          severity: 'high',
          detail: `ارتفاع حاد في إنزيمات الكبد (ALT=${alt || '-'}, AST=${ast || '-'})، يستدعي فحص الفيروسات الكبدية والموجات الصوتية للبطن فوراً.`
        });
      }
    }

    if (alt !== null && ast !== null && alt > 0) {
      const deRitis = Number((ast / alt).toFixed(2));
      let deRitisInterp = '';
      if (deRitis < 1.0) {
        deRitisInterp = 'نسبة دي ريتيس < 1.0: شائعة في الكبد الدهني (NAFLD/NASH) أو التهاب الكبد الفيروسي المزمن.';
        differentialDiagnoses.push({
          diseaseAr: 'ارتشاح دهني كبدي (Hepatic Steatosis / Fatty Liver)',
          diseaseEn: 'Non-Alcoholic Fatty Liver Disease (NAFLD)',
          likelihood: 'moderate',
          rationaleAr: `ارتفاع إنزيم ALT أكثر من AST مع نسبة دي ريتيس = ${deRitis} (< 1.0).`
        });
      } else if (deRitis > 2.0) {
        deRitisInterp = 'نسبة دي ريتيس > 2.0: تدل على أذية كبدية ميتوكوندرية عميقة أو تليف كبدي متقدم أو استهلاك دوائي.';
      } else {
        deRitisInterp = 'نسبة دي ريتيس متوازنة ضمن النطاق المقبول.';
      }
      calculatedIndices.push({
        nameAr: 'نسبة دي ريتيس لإنزيمات الكبد (De Ritis Ratio)',
        nameEn: 'AST / ALT Ratio',
        value: deRitis,
        reference: '0.8 - 1.2 Optimal',
        interpretationAr: deRitisInterp
      });

      // APRI Score if platelets available
      if (platelets !== null && platelets > 0) {
        const apri = Number((((ast / 40) / platelets) * 100).toFixed(2));
        calculatedIndices.push({
          nameAr: 'مؤشر تليف الكبد التقريبي (APRI Score)',
          nameEn: 'AST to Platelet Ratio Index',
          value: apri,
          reference: '< 0.5 Low Risk | > 1.5 Significant Fibrosis',
          interpretationAr: apri > 1.5 ? 'ارتفاع المؤشر (> 1.5): ينبه لاحتمالية تليف كبدي يستدعي فحص فيبروسكان (FibroScan).' : 'المؤشر منخفض (< 0.5): احتمال حدوث تليف كبدي مستبعد.'
        });
      }
    }
  }

  if (bili !== null && bili > 1.2) {
    hepaticScore -= 15;
    if (bili > 3.0) {
      criticalAlerts.push({
        titleAr: 'يرقان سريري ملحوظ (Hyperbilirubinemia / Jaundice)',
        titleEn: 'Elevated Serum Bilirubin (> 3.0 mg/dL)',
        severity: 'high',
        detail: `ارتفاع نسبة الصفراء الكلية (${bili} mg/dL)؛ يستدعي فحص القنوات المرارية وتحليل الصفراء المباشرة وغير المباشرة.`
      });
    }
  }

  // ----------------------------------------------------
  // 4. METABOLIC, GLYCEMIC & ENDOCRINE EVALUATION
  // ----------------------------------------------------
  if (fbs !== null || ppbs !== null || rbs !== null || hba1c !== null) {
    const isDiabetic = (fbs && fbs >= 126) || (ppbs && ppbs >= 200) || (rbs && rbs >= 200) || (hba1c && hba1c >= 6.5);
    const isPrediabetic = (fbs && fbs >= 100 && fbs < 126) || (hba1c && hba1c >= 5.7 && hba1c < 6.5);

    if (isDiabetic) {
      metabolicScore -= 35;
      differentialDiagnoses.push({
        diseaseAr: 'داء السكري من النوع الثاني (Type 2 Diabetes Mellitus)',
        diseaseEn: 'Type 2 Diabetes Mellitus',
        likelihood: 'high',
        rationaleAr: `تأكيد تشخيص السكري بناءً على قراءات الجلوكوز (صائم=${fbs || '-'} | بعد الأكل=${ppbs || '-'} | التراكمي=${hba1c || '-'}%).`
      });
      consultantRecommendations.push('المتابعة الفورية مع استشاري الغدد الصماء والسكري لضبط العلاج الدوائي ونظام غذائي محسوب السعرات.');

      if ((fbs && fbs > 350) || (ppbs && ppbs > 400) || (rbs && rbs > 400)) {
        criticalAlerts.push({
          titleAr: 'ارتفاع حرج وشديد في سكر الدم (Critical Hyperglycemia)',
          titleEn: 'Severe Hyperglycemia (> 350 mg/dL)',
          severity: 'critical',
          detail: `مستوى السكر مرتفع للغاية؛ خطر حدوث الحماض الكيتوني السكري (DKA) أو متلازمة فرط الأسمولية.`
        });
      }
    } else if (isPrediabetic) {
      metabolicScore -= 15;
      differentialDiagnoses.push({
        diseaseAr: 'مرحلة ما قبل السكري ومقاومة الإنسولين (Prediabetes / Insulin Resistance)',
        diseaseEn: 'Impaired Fasting Glucose / Prediabetes',
        likelihood: 'high',
        rationaleAr: `سكر الصائم بين 100 - 125 mg/dL أو السكر التراكمي بين 5.7 - 6.4%.`
      });
      consultantRecommendations.push('يوصى باتباع حمية منخفضة المؤشر الجلايسيمي، ممارسة الرياضة 150 دقيقة أسبوعياً، وإجراء فحص مقاومة الإنسولين HOMA-IR.');
    }

    // Estimated Average Glucose (eAG) from HbA1c
    if (hba1c !== null && hba1c > 0) {
      const eag = Math.round((28.7 * hba1c) - 46.7);
      calculatedIndices.push({
        nameAr: 'متوسط السكر المقدر لثلاثة أشهر (Estimated Avg Glucose - eAG)',
        nameEn: 'eAG (ADAG Equation)',
        value: `${eag} mg/dL`,
        reference: '< 117 mg/dL Non-diabetic',
        interpretationAr: `يعادل متوسط السكر التراكمي ${hba1c}% متوسط قراءات يومية تقريبية تبلغ ${eag} mg/dL على مدار الـ 90 يوماً الماضية.`
      });
    }
  }

  // Thyroid
  if (tsh !== null) {
    if (tsh > 4.5) {
      metabolicScore -= 15;
      differentialDiagnoses.push({
        diseaseAr: 'خمول الغدة الدرقية (Hypothyroidism)',
        diseaseEn: 'Primary / Subclinical Hypothyroidism',
        likelihood: 'high',
        rationaleAr: `ارتفاع هرمون الغدة الدرقية المحفز TSH (${tsh} µIU/mL).`
      });
      consultantRecommendations.push('استشارة طبيب الغدد الصماء وإجراء فحص الأجسام المضادة للغدة الدرقية (Anti-TPO & Anti-TG) لتقييم مرض هاشيموتو.');
    } else if (tsh < 0.3) {
      metabolicScore -= 15;
      differentialDiagnoses.push({
        diseaseAr: 'فرط نشاط الغدة الدرقية (Hyperthyroidism / Thyrotoxicosis)',
        diseaseEn: 'Hyperthyroidism',
        likelihood: 'high',
        rationaleAr: `انخفاض شديد في هرمون TSH (${tsh} µIU/mL)؛ يستدعي فحص FT3 و FT4 وموجات صوتية للغدة.`
      });
    }
  }

  // Vitamin D
  if (vitD !== null && vitD < 20) {
    metabolicScore -= 10;
    differentialDiagnoses.push({
      diseaseAr: 'نقص فيتامين د (Vitamin D Deficiency)',
      diseaseEn: 'Hypovitaminosis D',
      likelihood: 'high',
      rationaleAr: `مستوى فيتامين د (${vitD} ng/mL) أقل من الحد الأدنى المقبول (30 ng/mL).`
    });
    consultantRecommendations.push('أخذ جرعة علاجية معوضة لفيتامين د (50,000 وحدة أسبوعياً لمدة 8 أسابيع) مع فحص الكالسيوم ومتابعة التعرض لأشعة الشمس.');
  }

  // ----------------------------------------------------
  // 5. CARDIOVASCULAR & LIPID EVALUATION
  // ----------------------------------------------------
  if (chol !== null && hdl !== null && hdl > 0) {
    const athero = Number((chol / hdl).toFixed(2));
    let atheroInterp = athero < 4.5 ? 'المؤشر في النطاق الوقائي المثالي.' : athero < 5.5 ? 'مخاطر قلبية ووعائية معتدلة.' : 'مخاطر مرتفعة لتصلب الشرايين التاجية وضيق الأوعية.';
    calculatedIndices.push({
      nameAr: 'مؤشر مخاطر تصلب الشرايين (Atherogenic Risk Index)',
      nameEn: 'Total Cholesterol / HDL Ratio',
      value: athero,
      reference: '< 4.5 Optimal',
      interpretationAr: atheroInterp
    });
    if (athero >= 5.0) {
      cardiacScore -= 20;
      consultantRecommendations.push('يوصى باتباع نظام غذائي خافض للدهون المشبعة واستشارة طبيب القلب لتقييم الحاجة لعلاجات الستاتين (Statins).');
    }
  }

  if (tg !== null && hdl !== null && hdl > 0) {
    const tgHdl = Number((tg / hdl).toFixed(2));
    let tgHdlInterp = tgHdl < 2.0 ? 'نسبة مثالية تدل على كفاءة استقلاب الدهون.' : tgHdl > 3.0 ? 'ارتفاع النسبة يُشير لمقاومة الإنسولين وكثافة جسيمات الكولسترول الضار (Small Dense LDL).' : 'نسبة مقبولة.';
    calculatedIndices.push({
      nameAr: 'نسبة الدهون الثلاثية إلى النافعة (TG / HDL Ratio)',
      nameEn: 'Triglycerides / HDL Ratio',
      value: tgHdl,
      reference: '< 2.0 Ideal | > 3.0 High Risk',
      interpretationAr: tgHdlInterp
    });
    if (tgHdl > 3.0) {
      cardiacScore -= 15;
    }
  }

  if (troponin !== null && troponin > 0.04) {
    criticalAlerts.push({
      titleAr: 'إنذار قلبي طارئ: ارتفاع إنزيم التروبونين (Acute Coronary Syndrome)',
      titleEn: 'Elevated Cardiac Troponin',
      severity: 'critical',
      detail: `ارتفاع التروبونين (${troponin}) يشير إلى احتمالية أذية واحتشاء في عضلة القلب؛ يتطلب تخطيط قلب فوري (ECG) وطوارئ القلب.`
    });
    cardiacScore -= 50;
  }

  if (dDimer !== null && dDimer > 0.5) {
    criticalAlerts.push({
      titleAr: 'ارتفاع مؤشر التجلط والدي-دايمر (Elevated D-Dimer)',
      titleEn: 'Elevated D-Dimer (> 0.5 µg/mL)',
      severity: 'high',
      detail: `ارتفاع الدي-دايمر (${dDimer}) ينبه لاحتمالية حدوث تجلط وريدي عميق (DVT) أو انصمام رئوي؛ يستدعي تقييماً سريرياً عاجلاً.`
    });
    cardiacScore -= 20;
  }

  // ----------------------------------------------------
  // GENERAL DEDUCTIONS FOR UNMAPPED ABNORMAL PARAMETERS
  // ----------------------------------------------------
  allParams.forEach(p => {
    if (p.flag === 'HIGH' || p.flag === 'LOW') {
      const pLower = p.name.toLowerCase();
      if (pLower.includes('crp') || pLower.includes('esr')) {
        differentialDiagnoses.push({
          diseaseAr: `نشاط التهابي مرتفع (${p.name})`,
          diseaseEn: 'Elevated Inflammatory Biomarker',
          likelihood: 'high',
          rationaleAr: `القيمة المسجلة: ${p.result} ${p.unit || ''} تعكس استجابة التهابية جهازية تستدعي فحص سبب العدوى أو الالتهاب الروماتيزمي.`
        });
      }
    }
  });

  // Clamp organ scores to 15 - 100
  renalScore = Math.max(20, Math.min(100, renalScore));
  hepaticScore = Math.max(20, Math.min(100, hepaticScore));
  metabolicScore = Math.max(20, Math.min(100, metabolicScore));
  hematologicScore = Math.max(20, Math.min(100, hematologicScore));
  cardiacScore = Math.max(20, Math.min(100, cardiacScore));

  const getStatus = (score: number, tested: boolean): 'optimal' | 'mild' | 'moderate' | 'critical' | 'not_tested' => {
    if (!tested) return 'not_tested';
    if (score >= 90) return 'optimal';
    if (score >= 75) return 'mild';
    if (score >= 55) return 'moderate';
    return 'critical';
  };

  const getLabel = (score: number, tested: boolean): string => {
    if (!tested) return 'لم تطلب بالفحص';
    if (score >= 90) return 'كفاءة ممتازة ومستقرة';
    if (score >= 75) return 'تأثر وظيفي طفيف';
    if (score >= 55) return 'انخفاض وظيفي متوسط';
    return 'قصور حاد يستدعي الرعاية';
  };

  const getSummary = (score: number, organName: string, tested: boolean): string => {
    if (!tested) return `لم يتضمن هذا الطلب فحوصات مخبرية مخصصة لتقييم ${organName}.`;
    if (score >= 90) return `كافة مؤشرات ${organName} تقع ضمن المعدلات الفسيولوجية الطبيعية المتوازنة.`;
    if (score >= 75) return `توجد انحرافات مخبرية طفيفة في فحوصات ${organName} يوصى بمتابعتها دورياً.`;
    if (score >= 55) return `تأثر وظيفي متوسط يستوجب استشارة طبية تخصصية ومتابعة دقيقة لمؤشرات ${organName}.`;
    return `مؤشرات حرجة وقصور شديد في ${organName} يستدعي تدخلاً علاجياً سريرياً عاجلاً.`;
  };

  // Default recommendations if none generated
  if (consultantRecommendations.length === 0) {
    if (flaggedList.length === 0) {
      consultantRecommendations.push('كافة الفحوصات الطبية المنجزة تقع في الحدود الفسيولوجية المرجعية المعتمدة دولياً.');
      consultantRecommendations.push('يوصى بإجراء الفحص الطبي الدوري الشامل كل 6 - 12 شهراً للمحافظة على الصحة الوقائية.');
      consultantRecommendations.push('الحفاظ على التغذية المتوازنة وشرب كميات وافرة من الماء وممارسة النشاط البدني المعتدل.');
    } else {
      consultantRecommendations.push('عرض هذا التقرير المخبري الشامل على الطبيب المعالج لمطابقته مع التاريخ المرضي والفحص السريري.');
      consultantRecommendations.push('إعادة الفحوصات غير الطبيعية بعد 4 - 6 أسابيع للتأكد من استقرار المؤشرات والاستجابة للعلاج.');
    }
  }

  // Executive Summaries
  let execAr = '';
  let execEn = '';

  if (criticalAlerts.length > 0) {
    execAr = `تم رصد (${criticalAlerts.length}) تنبيهات حرجة تستدعي الرعاية الطبية الفورية: ${criticalAlerts.map(c => c.titleAr).join('، ')}. `;
    execAr += `كما أظهر التقرير (${flaggedList.length}) فحصاً مخبرياً خارج النطاق المرجعي. يُلزم المريض بمراجعة الاستشاري فوراً واتباع التوصيات السريرية الواردة بالتقرير.`;
    execEn = `Identified ${criticalAlerts.length} critical finding(s) requiring prompt clinical action: ${criticalAlerts.map(c => c.titleEn).join(', ')}. Comprehensive review by treating physician is urgently advised.`;
  } else if (flaggedList.length > 0) {
    const topFlags = flaggedList.slice(0, 4).map(f => `${f.name} (${f.result} ${f.unit || ''})`).join('، ');
    execAr = `أظهر التقييم المخبري الشامل للمريض (${p.fullName}) وجود (${flaggedList.length}) فحوصات خارج المعدل الطبيعي، أبرزها: ${topFlags}. تم ربط هذه المؤشرات وحساب المعدلات السريرية بدقة وتضمين التشخيصات التفريقية والتوصيات الواجب اتباعها أدناه.`;
    execEn = `Laboratory profile reveals ${flaggedList.length} parameter(s) outside standard reference intervals (${flaggedList.slice(0, 3).map(f => f.name).join(', ')}). Organ health status and evidence-based clinical recommendations are provided below.`;
  } else {
    execAr = `الفحوصات الطبية المنجزة للمريض (${p.fullName}) تقع جميعها ضمن المعدلات الفسيولوجية المرجعية الطبيعية والآمنة، مع استقرار تام في كفاءة الأجهزة الحيوية التي جرى فحصها وعدم وجود أي مؤشرات التهابية أو أيضية حادة.`;
    execEn = `All evaluated laboratory parameters for ${p.fullName} are strictly within physiological reference intervals with optimal organ efficiency scores across all tested systems.`;
  }

  return {
    reportId: report.id,
    patientName: p.fullName,
    age,
    gender: p.gender,
    executiveSummaryAr: execAr,
    executiveSummaryEn: execEn,
    criticalAlerts,
    organScores: {
      renal: { score: renalTested ? renalScore : 0, labelAr: getLabel(renalScore, renalTested), status: getStatus(renalScore, renalTested), tested: renalTested, summaryAr: getSummary(renalScore, 'وظائف الكلى والمسالك', renalTested) },
      hepatic: { score: hepaticTested ? hepaticScore : 0, labelAr: getLabel(hepaticScore, hepaticTested), status: getStatus(hepaticScore, hepaticTested), tested: hepaticTested, summaryAr: getSummary(hepaticScore, 'وظائف الكبد والمرارة', hepaticTested) },
      metabolic: { score: metabolicTested ? metabolicScore : 0, labelAr: getLabel(metabolicScore, metabolicTested), status: getStatus(metabolicScore, metabolicTested), tested: metabolicTested, summaryAr: getSummary(metabolicScore, 'التمثيل الغذائي والسكر', metabolicTested) },
      hematologic: { score: hematologicTested ? hematologicScore : 0, labelAr: getLabel(hematologicScore, hematologicTested), status: getStatus(hematologicScore, hematologicTested), tested: hematologicTested, summaryAr: getSummary(hematologicScore, 'صحة الدم والصفائح', hematologicTested) },
      cardiac: { score: cardiacTested ? cardiacScore : 0, labelAr: getLabel(cardiacScore, cardiacTested), status: getStatus(cardiacScore, cardiacTested), tested: cardiacTested, summaryAr: getSummary(cardiacScore, 'صحة القلب والشرايين والدهون', cardiacTested) }
    },
    calculatedIndices,
    differentialDiagnoses,
    consultantRecommendations,
    abnormalParametersCount: flaggedList.length,
    totalParametersCount: allParams.length,
    flaggedList
  };
}
