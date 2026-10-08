import { DiseaseIllustration } from '../types/lab';

export interface DiseaseIllustrationExtended extends DiseaseIllustration {
  specialtyAr?: string;
  specialtyEn?: string;
}

// Helper to generate SVG Data URI
function createSvgDataUri(innerSvg: string, title: string, subtitle: string, borderColor = '#e11d48', titleColor = '#fb7185'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" width="100%" height="100%">
    <rect width="320" height="180" rx="14" fill="#090d16"/>
    <circle cx="160" cy="90" r="76" fill="#0b1329" stroke="${borderColor}" stroke-width="2.5"/>
    <text x="160" y="24" text-anchor="middle" fill="${titleColor}" font-size="10.5" font-weight="900" font-family="'Cairo', sans-serif">${title}</text>
    ${innerSvg}
    <text x="160" y="170" text-anchor="middle" fill="#94a3b8" font-size="9" font-family="'Cairo', sans-serif">${subtitle}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const DISEASE_ILLUSTRATIONS: DiseaseIllustration[] = [
  // ==========================================
  // 1. أمراض الدم وصورة الدم (HEMATOLOGY)
  // ==========================================
  {
    id: "hem-normal",
    code: "HEM_NORMAL",
    category: "hematology",
    specialtyAr: "أمراض الدم والمناعة",
    imageUrl: createSvgDataUri(
      `<g fill="#e11d48">
        <circle cx="120" cy="75" r="16"/><circle cx="120" cy="75" r="5.5" fill="#fecdd3"/>
        <circle cx="165" cy="65" r="15"/><circle cx="165" cy="65" r="5" fill="#fecdd3"/>
        <circle cx="190" cy="95" r="16"/><circle cx="190" cy="95" r="5.5" fill="#fecdd3"/>
        <circle cx="145" cy="115" r="16"/><circle cx="145" cy="115" r="5.5" fill="#fecdd3"/>
        <circle cx="110" cy="108" r="15"/><circle cx="110" cy="108" r="5" fill="#fecdd3"/>
      </g>
      <circle cx="155" cy="90" r="17" fill="#fbcfe8" opacity="0.4"/>
      <ellipse cx="150" cy="86" rx="4" ry="5" fill="#6b21a8"/>
      <ellipse cx="160" cy="87" rx="4" ry="4" fill="#6b21a8"/>
      <ellipse cx="154" cy="96" rx="4.5" ry="3.5" fill="#6b21a8"/>
      <circle cx="135" cy="70" r="2.5" fill="#38bdf8"/>
      <circle cx="180" cy="110" r="2.5" fill="#38bdf8"/>`,
      "NORMAL BLOOD SMEAR (1000X)",
      "Normocytic Normochromic Erythrocytes & Normal Platelets",
      "#881337",
      "#f43f5e"
    ),
    titleAr: "شريحة دم محيطي طبيعية (Normal Blood Smear)",
    titleEn: "Normal Peripheral Blood Smear",
    pathologySummaryAr: "كرات دم حمراء طبيعية الحجم ومتساوية الصبغ (Normocytic Normochromic) مع مساحة شحوب مركزي طبيعية تعادل ثلث قطر الخلية، مع عدد وتوزيع طبيعي للعدلات والصفائح الدموية.",
    pathologySummaryEn: "Normocytic, normochromic erythrocytes with normal central pallor (~1/3 diameter). Adequate platelets and normal differential leucocytic morphology.",
    keyDiagnosticPoints: [
      "MCV: 80 - 98 fL | MCH: 27 - 33 pg | MCHC: 32 - 36 g/dL",
      "RBCs: uniform size and biconcave disc shape",
      "WBC differential within normal reference intervals",
      "Platelets: 150 - 450 x10^3/µL with normal granular appearance"
    ],
    associatedConditions: ["Physiological Baseline", "Healthy Reference", "Routine Wellness"],
    differentialDiagnosis: "No cytopenias or dysplastic features identified."
  },
  {
    id: "hem-iron-deficiency",
    code: "HEM_IDA",
    category: "hematology",
    specialtyAr: "أمراض الدم والمناعة",
    imageUrl: createSvgDataUri(
      `<g fill="#e11d48">
        <circle cx="115" cy="75" r="13"/><circle cx="115" cy="75" r="9" fill="#0b1329"/>
        <circle cx="170" cy="70" r="12"/><circle cx="170" cy="70" r="8.5" fill="#0b1329"/>
        <circle cx="135" cy="115" r="13"/><circle cx="135" cy="115" r="9" fill="#0b1329"/>
        <circle cx="195" cy="95" r="11"/><circle cx="195" cy="95" r="7.5" fill="#0b1329"/>
      </g>
      <ellipse cx="150" cy="88" rx="22" ry="6.5" transform="rotate(35 150 88)" fill="#e11d48"/>
      <ellipse cx="150" cy="88" rx="16" ry="4" transform="rotate(35 150 88)" fill="#0b1329"/>`,
      "IRON DEFICIENCY ANEMIA (IDA)",
      "Microcytic Hypochromic & Pencil Cells (Cigar Cells)",
      "#e11d48",
      "#fb7185"
    ),
    titleAr: "أنيميا نقص الحديد (Iron Deficiency Anemia)",
    titleEn: "Microcytic Hypochromic Anemia (Iron Deficiency)",
    pathologySummaryAr: "صورة كرات دم حمراء صغيرة الحجم وشديدة الشحوب (Microcytic Hypochromic) مع اتساع واضح للشحوب المركزي وخلايا قلمية مميزة (Pencil / Cigar cells) وتباين في الأحجام (Anisocytosis) وارتفاع مؤشر RDW ومؤشر منتزر > 13.",
    pathologySummaryEn: "Marked microcytosis and hypochromia with exaggerated central pallor, pencil/cigar-shaped elliptocytes, elevated RDW (>15%), and Mentzer Index > 13.",
    keyDiagnosticPoints: [
      "Low Hemoglobin, Low MCV (< 80 fL), Low MCH (< 27 pg)",
      "High RDW-CV (> 15%) reflecting marked anisocytosis",
      "Mentzer Index (MCV / RBC) > 13",
      "Pencil cells (cigar cells) and teardrop cells seen on blood film",
      "Low Serum Ferritin & Low Iron with elevated TIBC"
    ],
    associatedConditions: ["Chronic blood loss (GI / Menorrhagia)", "Poor dietary iron intake", "Malabsorption / Celiac disease"],
    differentialDiagnosis: "Beta Thalassemia Minor (distinguished by Mentzer < 13, normal RDW, and HbA2 > 3.5%)."
  },
  {
    id: "hem-thalassemia",
    code: "HEM_THAL",
    category: "hematology",
    specialtyAr: "أمراض الدم والمناعة",
    imageUrl: createSvgDataUri(
      `<circle cx="130" cy="80" r="16" fill="#e11d48"/><circle cx="130" cy="80" r="11" fill="#0b1329"/><circle cx="130" cy="80" r="5" fill="#e11d48"/>
      <circle cx="180" cy="85" r="15" fill="#e11d48"/><circle cx="180" cy="85" r="10" fill="#0b1329"/><circle cx="180" cy="85" r="4.5" fill="#e11d48"/>
      <circle cx="150" cy="115" r="14" fill="#e11d48"/><circle cx="150" cy="115" r="6" fill="#fecdd3"/>
      <circle cx="147" cy="113" r="1.2" fill="#1e3a8a"/><circle cx="152" cy="114" r="1.2" fill="#1e3a8a"/><circle cx="149" cy="117" r="1.2" fill="#1e3a8a"/>`,
      "BETA THALASSEMIA TRAIT",
      "Target Cells (Codocytes) & Basophilic Stippling",
      "#d97706",
      "#f59e0b"
    ),
    titleAr: "أنيميا البحر المتوسط (ثلاسيميا بيتا - Beta Thalassemia)",
    titleEn: "Beta Thalassemia Minor / Trait",
    pathologySummaryAr: "صغر واضح في حجم كرات الدم الحمراء (Microcytosis) مع وفرة عددية في كرات الدم الحمراء بالنسبة لنسبة الهيموجلوبين، وخلايا هدفية كلاسيكية (Target cells / Codocytes) مع تنقيط قاعدي مميز ومؤشر منتزر أقل من 13.",
    pathologySummaryEn: "Profound microcytosis out of proportion to mild anemia, frequent Target cells (codocytes), basophilic stippling, normal to slightly elevated RDW, and Mentzer Index < 13.",
    keyDiagnosticPoints: [
      "Mentzer Index (MCV / RBC) < 13 (Highly suggestive of Thalassemia Trait)",
      "Target cells (bullseye appearance) prominent on peripheral smear",
      "Coarse basophilic stippling of erythrocytes",
      "Normal or mildly elevated serum ferritin level",
      "Confirmed via Hemoglobin Electrophoresis (Elevated HbA2 > 3.5%)"
    ],
    associatedConditions: ["Beta Thalassemia Minor (Trait)", "Hemoglobin E disease", "Alpha Thalassemia trait"],
    differentialDiagnosis: "Iron Deficiency Anemia (Ferritin low, Mentzer > 13, RDW markedly elevated)."
  },
  {
    id: "hem-megaloblastic",
    code: "HEM_MEGALO",
    category: "hematology",
    specialtyAr: "أمراض الدم والمناعة",
    imageUrl: createSvgDataUri(
      `<ellipse cx="120" cy="80" rx="22" ry="16" transform="rotate(-15 120 80)" fill="#e11d48"/><ellipse cx="120" cy="80" rx="9" ry="7" transform="rotate(-15 120 80)" fill="#fecdd3"/>
      <circle cx="180" cy="95" r="22" fill="#fbcfe8" opacity="0.35"/>
      <circle cx="172" cy="85" r="4.5" fill="#581c87"/><circle cx="182" cy="84" r="4.5" fill="#581c87"/><circle cx="190" cy="90" r="4.5" fill="#581c87"/><circle cx="188" cy="100" r="4.5" fill="#581c87"/><circle cx="178" cy="105" r="4.5" fill="#581c87"/><circle cx="170" cy="96" r="4.5" fill="#581c87"/>`,
      "MEGALOBLASTIC ANEMIA (B12 / FOLATE)",
      "Macro-ovalocytes & Hypersegmented PMN (>= 6 Lobes)",
      "#8b5cf6",
      "#a78bfa"
    ),
    titleAr: "الأنيميا الخبيثة ونقص فيتامين ب12 والفوليك (Megaloblastic Anemia)",
    titleEn: "Megaloblastic Anemia (Vitamin B12 / Folate Deficiency)",
    pathologySummaryAr: "صورة كرات دم حمراء كروية بيضاوية ضخمة (Macro-ovalocytes) مع ارتفاع ملحوظ في الحجم الكروي الوسطي (MCV > 100 fL) مع خلايا متعادلة مفرطة التفصص (Hypersegmented Neutrophils تحوي 6 فصوص أو أكثر).",
    pathologySummaryEn: "Macro-ovalocytic erythrocytes with elevated MCV (> 100-115 fL), accompanied by pathognomonic hypersegmented neutrophils (>= 6 nuclear lobes) and pancytopenia.",
    keyDiagnosticPoints: [
      "High MCV (> 100 to 125 fL) with macro-ovalocytes",
      "Hypersegmented polymorphonuclear leukocytes (>= 6 lobes)",
      "Howell-Jolly bodies (nuclear remnants) and Cabot rings",
      "Low Vitamin B12 (< 200 pg/mL) or low Serum / RBC Folate",
      "Markedly elevated serum LDH and indirect bilirubin (ineffective erythropoiesis)"
    ],
    associatedConditions: ["Pernicious anemia", "Strict Vegan diets", "Metformin or PPI long-term therapy"],
    differentialDiagnosis: "Non-megaloblastic macrocytosis (Liver disease, alcoholism, hypothyroidism)."
  },
  {
    id: "hem-sickle",
    code: "HEM_SICKLE",
    category: "hematology",
    specialtyAr: "أمراض الدم والمناعة",
    imageUrl: createSvgDataUri(
      `<path d="M 120,55 Q 165,75 125,120 Q 145,82 120,55 Z" fill="#b91c1c"/>
      <path d="M 160,65 Q 205,95 165,135 Q 185,95 160,65 Z" fill="#b91c1c"/>
      <circle cx="185" cy="75" r="13" fill="#e11d48"/><circle cx="185" cy="75" r="8" fill="#0b1329"/><circle cx="185" cy="75" r="3.5" fill="#e11d48"/>
      <circle cx="115" cy="110" r="12" fill="#e11d48"/><circle cx="113" cy="107" r="2.5" fill="#1e1b4b"/>`,
      "SICKLE CELL DISEASE (HbSS)",
      "Drepanocytes (Sickle Cells) & Howell-Jolly Bodies",
      "#ef4444",
      "#f87171"
    ),
    titleAr: "أنيميا الخلايا المنجلية (Sickle Cell Anemia - HbSS)",
    titleEn: "Sickle Cell Disease (Drepanocytosis)",
    pathologySummaryAr: "خلايا منجلية مقوسة مميزة حادة الأطراف (Sickle cells / Drepanocytes) ناتجة عن بلمرة هيموجلوبين S عند نقص الأكسجين، مع خلايا هدفية وأجسام هاول-جولي المصاحبة لقصور الطحال.",
    pathologySummaryEn: "Crescent-shaped elongated sickle cells (drepanocytes) with pointed ends due to HbS polymerization, target cells, and Howell-Jolly bodies.",
    keyDiagnosticPoints: [
      "Classic sickle / crescentic RBCs on film with pointed tips",
      "Target cells and nucleated RBCs in peripheral blood",
      "Howell-Jolly bodies reflecting autosplenectomy",
      "Positive Sickling Test & Hemoglobin Electrophoresis (HbS > 80% in HbSS)",
      "Elevated reticulocyte count and indirect bilirubin"
    ],
    associatedConditions: ["Vaso-occlusive pain crisis", "Acute chest syndrome", "Hemolytic jaundice"],
    differentialDiagnosis: "Sickle-Thalassemia, Hemoglobin SC disease."
  },
  {
    id: "hem-leukemia-aml",
    code: "HEM_AML",
    category: "hematology",
    specialtyAr: "أمراض الدم والمناعة",
    imageUrl: createSvgDataUri(
      `<circle cx="150" cy="90" r="28" fill="#581c87" opacity="0.45"/>
      <ellipse cx="148" cy="88" rx="20" ry="18" fill="#3b0764"/>
      <circle cx="140" cy="82" r="4.5" fill="#c084fc"/>
      <circle cx="155" cy="85" r="5" fill="#c084fc"/>
      <line x1="135" y1="102" x2="162" y2="108" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"/>`,
      "ACUTE MYELOID LEUKEMIA (AML)",
      "Myeloblasts with Prominent Nucleoli & Auer Rods",
      "#7e22ce",
      "#c084fc"
    ),
    titleAr: "اللوكيميا النخاعية الحادة (Acute Myeloid Leukemia - AML)",
    titleEn: "Acute Myeloid Leukemia (AML)",
    pathologySummaryAr: "خلايا أرومية نخاعية سرطانية (Myeloblasts) ضخمة النواة مع كروماتين رخو ونويات واضحة وسيتوبلازم قليل يحوي عصي آور الحمراء التشخيصية (Auer Rods).",
    pathologySummaryEn: "Large myeloblasts with fine chromatin, prominent nucleoli, high N:C ratio, and diagnostic Auer rods in cytoplasm.",
    keyDiagnosticPoints: [
      "Presence of circulating Myeloblasts (>= 20% in marrow or peripheral blood)",
      "Pathognomonic Auer rods (crystalline fused lysosomes)",
      "Profound pancytopenia (severe anemia, neutropenia, thrombocytopenia)",
      "Positive myeloperoxidase (MPO) and flow cytometry (CD34, CD117, CD33)"
    ],
    associatedConditions: ["Bone marrow failure", "Bleeding diathesis", "Severe febrile neutropenia"],
    differentialDiagnosis: "ALL, Leukemoid reaction, Myelodysplastic syndromes."
  },

  // ==========================================
  // 2. الغدد الصماء والسكري (ENDOCRINOLOGY & DIABETES)
  // ==========================================
  {
    id: "endo-diabetes",
    code: "ENDO_DIABETES",
    category: "endocrinology",
    specialtyAr: "الغدد الصماء والسكري",
    imageUrl: createSvgDataUri(
      `<g fill="#0284c7">
        <rect x="95" y="60" width="130" height="60" rx="8" fill="#082f49" stroke="#38bdf8" stroke-width="2"/>
        <text x="160" y="85" text-anchor="middle" fill="#38bdf8" font-size="12" font-weight="bold">HbA1c &gt;= 6.5%</text>
        <text x="160" y="105" text-anchor="middle" fill="#f87171" font-size="10" font-weight="bold">FBS &gt;= 126 mg/dL</text>
      </g>
      <circle cx="105" cy="50" r="10" fill="#f43f5e"/><text x="105" y="54" text-anchor="middle" fill="#fff" font-size="9" font-weight="bold">Glu</text>
      <circle cx="215" cy="50" r="10" fill="#f43f5e"/><text x="215" y="54" text-anchor="middle" fill="#fff" font-size="9" font-weight="bold">Glu</text>`,
      "DIABETES MELLITUS TYPE 2",
      "Chronic Hyperglycemia, Glycated Hb & Insulin Resistance",
      "#0284c7",
      "#38bdf8"
    ),
    titleAr: "داء السكري واعتلال الأيض (Type 2 Diabetes Mellitus)",
    titleEn: "Type 2 Diabetes Mellitus & Glycemic Control",
    pathologySummaryAr: "ارتفاع مزمن في سكر الدم الصائم وبعد الأكل والتراكمي (HbA1c >= 6.5%) ناجم عن مقاومة الأنسجة للإنسولين ونقص نسبي في إفرازه، مع مخاطر تصلب الأوعية الدقيقة واعتلال الكلى وشبكية العين.",
    pathologySummaryEn: "Chronic hyperglycemia with elevated fasting plasma glucose (>= 126 mg/dL) and HbA1c (>= 6.5%) due to progressive beta-cell dysfunction and insulin resistance.",
    keyDiagnosticPoints: [
      "Fasting Blood Sugar (FBS) >= 126 mg/dL (7.0 mmol/L)",
      "2-Hour Postprandial Glucose (PPBS) >= 200 mg/dL",
      "Glycated Hemoglobin (HbA1c) >= 6.5%",
      "Elevated HOMA-IR indicating severe tissue insulin resistance",
      "Microalbuminuria screening recommended annually"
    ],
    associatedConditions: ["Metabolic syndrome", "Diabetic nephropathy", "Dyslipidemia & Coronary artery disease"],
    differentialDiagnosis: "Impaired Fasting Glucose (Prediabetes), Type 1 LADA, Steroid-induced hyperglycemia."
  },
  {
    id: "endo-hypothyroid",
    code: "ENDO_HYPOTHYROID",
    category: "endocrinology",
    specialtyAr: "الغدد الصماء والسكري",
    imageUrl: createSvgDataUri(
      `<path d="M 130,65 C 130,50 145,55 160,75 C 175,55 190,50 190,65 C 190,95 175,115 160,110 C 145,115 130,95 130,65 Z" fill="#4338ca" stroke="#818cf8" stroke-width="2"/>
      <rect x="110" y="125" width="100" height="20" rx="5" fill="#1e1b4b" stroke="#6366f1" stroke-width="1.5"/>
      <text x="160" y="139" text-anchor="middle" fill="#a5b4fc" font-size="10" font-weight="bold">TSH Elevated &gt; 10</text>`,
      "PRIMARY HYPOTHYROIDISM",
      "Thyroid Failure: Marked TSH Elevation & Low FT4",
      "#4338ca",
      "#818cf8"
    ),
    titleAr: "خمول وقصور الغدة الدرقية (Primary Hypothyroidism)",
    titleEn: "Primary Hypothyroidism (Hashimoto's)",
    pathologySummaryAr: "قصور الغدة الدرقية في إفراز هرمونات الثيروكسين (FT4 و FT3) مما يحفز الغدة النخامية على إفراز نسب عالية جداً من الهرمون المنشط (TSH > 4.5 - 10 µIU/mL).",
    pathologySummaryEn: "Decreased circulating free thyroxine (FT4) accompanied by compensatory elevation in serum thyroid-stimulating hormone (TSH).",
    keyDiagnosticPoints: [
      "Elevated TSH (> 4.5 µIU/mL, often > 10 in overt failure)",
      "Low Free T4 (FT4) and Low Free T3 (FT3)",
      "Positive Anti-TPO and Anti-Thyroglobulin antibodies in Hashimoto thyroiditis",
      "Secondary dyslipidemia (elevated LDL and Total Cholesterol)",
      "Mild normocytic or macrocytic anemia"
    ],
    associatedConditions: ["Hashimoto's autoimmune thyroiditis", "Dyslipidemia", "Fatigue, weight gain & cold intolerance"],
    differentialDiagnosis: "Subclinical hypothyroidism (normal FT4 with high TSH), Sick Euthyroid Syndrome."
  },
  {
    id: "endo-hyperthyroid",
    code: "ENDO_HYPERTHYROID",
    category: "endocrinology",
    specialtyAr: "الغدد الصماء والسكري",
    imageUrl: createSvgDataUri(
      `<path d="M 125,60 C 125,45 145,50 160,70 C 175,50 195,45 195,60 C 195,100 175,120 160,115 C 145,120 125,100 125,60 Z" fill="#b45309" stroke="#fbbf24" stroke-width="2.5"/>
      <circle cx="160" cy="85" r="18" fill="#fef3c7" opacity="0.3"/>
      <text x="160" y="89" text-anchor="middle" fill="#fbbf24" font-size="11" font-weight="bold">TSH &lt; 0.01</text>`,
      "HYPERTHYROIDISM / GRAVES' DISEASE",
      "Thyrotoxicosis: Suppressed TSH with High FT3 & FT4",
      "#b45309",
      "#fbbf24"
    ),
    titleAr: "فرط نشاط الغدة الدرقية وداء غريفز (Hyperthyroidism)",
    titleEn: "Hyperthyroidism & Thyrotoxicosis",
    pathologySummaryAr: "فرط إفراز هرمونات الدرقية (FT4 و FT3) المؤدي إلى تثبيط كامل للهرمون المنبه للدرقية (TSH < 0.01 µIU/mL) مع أعراض تسارع ضربات القلب ونقص الوزن وفرط التعرق.",
    pathologySummaryEn: "Autonomous overproduction of thyroid hormones causing undetectable TSH (< 0.01 µIU/mL) with elevated Free T4 and Free T3.",
    keyDiagnosticPoints: [
      "Suppressed TSH (< 0.05 µIU/mL)",
      "Elevated Free T4 (FT4) and Free T3 (FT3)",
      "Positive TRAb (TSH Receptor Antibodies) in Graves' disease",
      "Tachycardia, fine hand tremors, weight loss",
      "Mild hypercalcemia and elevated ALP may be noted"
    ],
    associatedConditions: ["Graves' Disease", "Toxic Multinodular Goiter", "Thyroid Storm"],
    differentialDiagnosis: "Subacute thyroiditis, Exogenous levothyroxine overdose."
  },
  {
    id: "endo-pcos",
    code: "ENDO_PCOS",
    category: "endocrinology",
    specialtyAr: "الغدد الصماء والسكري",
    imageUrl: createSvgDataUri(
      `<ellipse cx="160" cy="90" rx="45" ry="32" fill="#831843" stroke="#f472b6" stroke-width="2"/>
      <circle cx="130" cy="80" r="6" fill="#090d16" stroke="#f472b6" stroke-width="1.5"/>
      <circle cx="145" cy="72" r="5" fill="#090d16" stroke="#f472b6" stroke-width="1.5"/>
      <circle cx="165" cy="72" r="5.5" fill="#090d16" stroke="#f472b6" stroke-width="1.5"/>
      <circle cx="185" cy="80" r="6" fill="#090d16" stroke="#f472b6" stroke-width="1.5"/>
      <circle cx="178" cy="100" r="6" fill="#090d16" stroke="#f472b6" stroke-width="1.5"/>
      <circle cx="140" cy="100" r="5.5" fill="#090d16" stroke="#f472b6" stroke-width="1.5"/>
      <text x="160" y="93" text-anchor="middle" fill="#fbcfe8" font-size="9" font-weight="bold">LH:FSH &gt; 2:1</text>`,
      "POLYCYSTIC OVARY SYNDROME (PCOS)",
      "Follicular Arrest & Hyperandrogenemia (LH/FSH Elevation)",
      "#831843",
      "#f472b6"
    ),
    titleAr: "متلازمة تكيس المبايض (PCOS & Insulin Resistance)",
    titleEn: "Polycystic Ovary Syndrome (PCOS)",
    pathologySummaryAr: "اضطراب هرموني استقلابي يتميز بارتفاع نسبة هرمون LH مقارنة بـ FSH (> 2:1) مع ارتفاع هرمونات الذكورة (Total & Free Testosterone) ومقاومة الإنسولين وتعدد الحويصلات بالمبيض.",
    pathologySummaryEn: "Endocrine disturbance with elevated LH:FSH ratio (> 2:1), elevated androgens, insulin resistance, and characteristic ovarian follicular arrest.",
    keyDiagnosticPoints: [
      "Reversal of LH/FSH ratio on day 2-3 of cycle (LH:FSH > 2:1)",
      "Elevated Serum Testosterone (Total / Free) & DHEA-S",
      "High Anti-Müllerian Hormone (AMH > 4 - 6 ng/mL)",
      "High fasting insulin and elevated HOMA-IR index",
      "Associated with irregular menses and hirsutism"
    ],
    associatedConditions: ["Anovulatory infertility", "Insulin resistance", "Metabolic syndrome"],
    differentialDiagnosis: "Congenital Adrenal Hyperplasia (17-OHP), Hyperprolactinemia, Cushing's."
  },
  {
    id: "endo-vit-d",
    code: "ENDO_VIT_D",
    category: "endocrinology",
    specialtyAr: "الغدد الصماء والسكري",
    imageUrl: createSvgDataUri(
      `<circle cx="160" cy="85" r="38" fill="#ea580c" opacity="0.25"/>
      <circle cx="160" cy="85" r="28" fill="#c2410c"/>
      <text x="160" y="80" text-anchor="middle" fill="#ffedd5" font-size="11" font-weight="bold">25-OH Vit D</text>
      <text x="160" y="96" text-anchor="middle" fill="#fed7aa" font-size="10" font-weight="bold">&lt; 20 ng/mL</text>`,
      "VITAMIN D DEFICIENCY & OSTEOPOROSIS",
      "Hypovitaminosis D, Secondary Hyperparathyroidism & Calcium Deficit",
      "#c2410c",
      "#fb923c"
    ),
    titleAr: "نقص فيتامين د وهشاشة العظام (Vitamin D Deficiency)",
    titleEn: "Hypovitaminosis D & Bone Metabolism",
    pathologySummaryAr: "انخفاض مستوى 25-هيدروكسي فيتامين د أقل من 20 ng/mL المؤدي لخلل امتصاص الكالسيوم والفوسفور واعتلال التكلس العظمي وتنشيط إفراز هرمون الجاردرقية (PTH).",
    pathologySummaryEn: "Deficiency of 25-hydroxyvitamin D (< 20 ng/mL) resulting in impaired intestinal calcium absorption and secondary hyperparathyroidism.",
    keyDiagnosticPoints: [
      "Deficiency: 25(OH) Vitamin D < 20 ng/mL (< 50 nmol/L)",
      "Insufficiency: 20 - 29 ng/mL | Optimal: 30 - 100 ng/mL",
      "Compensatory elevation in Parathyroid Hormone (PTH)",
      "Normal or low serum Calcium and Phosphorus",
      "Elevated bone-specific Alkaline Phosphatase (ALP)"
    ],
    associatedConditions: ["Osteopenia / Osteoporosis", "Rickets / Osteomalacia", "Chronic musculoskeletal pain"],
    differentialDiagnosis: "Primary hyperparathyroidism, Malabsorption syndrome."
  },

  // ==========================================
  // 3. أمراض القلب والأوعية والدهون (CARDIOLOGY)
  // ==========================================
  {
    id: "card-infarction",
    code: "CARD_INFARCTION",
    category: "cardiac",
    specialtyAr: "القلب والأوعية الدموية",
    imageUrl: createSvgDataUri(
      `<path d="M 160,118 C 120,80 120,55 140,55 C 152,55 158,65 160,70 C 162,65 168,55 180,55 C 200,55 200,80 160,118 Z" fill="#991b1b" stroke="#f87171" stroke-width="2"/>
      <path d="M 130,88 Q 145,60 160,95 T 190,85" fill="none" stroke="#fef08a" stroke-width="2.5"/>
      <rect x="105" y="125" width="110" height="20" rx="5" fill="#450a0a" stroke="#ef4444" stroke-width="1.5"/>
      <text x="160" y="139" text-anchor="middle" fill="#fca5a5" font-size="9.5" font-weight="bold">Troponin I &gt;&gt; 0.04 ng/mL</text>`,
      "ACUTE MYOCARDIAL INFARCTION (AMI)",
      "Myocardial Necrosis: Rapid Release of High-Sensitivity Troponin",
      "#991b1b",
      "#f87171"
    ),
    titleAr: "جلطة واحتشاء عضلة القلب الحاد (Acute Myocardial Infarction)",
    titleEn: "Acute Coronary Syndrome & Troponin Elevation",
    pathologySummaryAr: "تموت حاد وتلف في الخلايا العضلية القلبية نتيجة انسداد الشريان التاجي، مما يحرر إنزيمات القلب الحساسة وخاصة تروبونين I وتروبونين T وCK-MB بمستويات بالغة الارتفاع.",
    pathologySummaryEn: "Myocardial cellular necrosis releasing cardiac biomarkers (High-Sensitivity Troponin I/T and CK-MB) into the bloodstream.",
    keyDiagnosticPoints: [
      "Marked elevation of Cardiac Troponin I / T above 99th percentile URL",
      "Dynamic rise and fall pattern of troponin over 3-6 hours",
      "Elevated CK-MB and Total CPK in acute phase",
      "Elevated AST and LDH in late myocardial necrosis",
      "Immediate hospital emergency transfer indicated"
    ],
    associatedConditions: ["ST-Elevation Myocardial Infarction (STEMI)", "Non-STEMI", "Coronary artery thrombosis"],
    differentialDiagnosis: "Acute myocarditis, Pulmonary embolism, Acute heart failure."
  },
  {
    id: "card-dyslipidemia",
    code: "CARD_DYSLIPIDEMIA",
    category: "cardiac",
    specialtyAr: "القلب والأوعية الدموية",
    imageUrl: createSvgDataUri(
      `<circle cx="160" cy="90" r="42" fill="#713f12" stroke="#eab308" stroke-width="2.5"/>
      <circle cx="160" cy="90" r="28" fill="#090d16"/>
      <text x="160" y="85" text-anchor="middle" fill="#fde047" font-size="10" font-weight="bold">LDL &gt; 160</text>
      <text x="160" y="100" text-anchor="middle" fill="#f87171" font-size="9" font-weight="bold">TG &gt; 200</text>`,
      "ATHEROSCLEROSIS & DYSLIPIDEMIA",
      "Elevated Atherogenic Lipoproteins (LDL, Chol, Triglycerides)",
      "#713f12",
      "#eab308"
    ),
    titleAr: "فرط دهون الدم وتصلب الشرايين (Dyslipidemia & Atherosclerosis)",
    titleEn: "Dyslipidemia & Coronary Risk Profile",
    pathologySummaryAr: "ارتفاع الكوليسترول الكلي والبروتينات الدهنية منخفضة الكثافة (LDL) والدهون الثلاثية (TG) مع انخفاض الكوليسترول الحميد (HDL)، مما يؤدي لترسب اللويحات العصيدية بجدران الشرايين.",
    pathologySummaryEn: "Elevated atherogenic lipoproteins (LDL-C, non-HDL-C, Triglycerides) and low HDL-C accelerating atherosclerotic plaque formation.",
    keyDiagnosticPoints: [
      "Total Cholesterol > 200 mg/dL (High risk > 240 mg/dL)",
      "LDL Cholesterol > 130 - 160 mg/dL",
      "Triglycerides > 150 - 200 mg/dL",
      "Low HDL Cholesterol (< 40 mg/dL in men, < 50 mg/dL in women)",
      "Atherogenic Ratio (Total Chol / HDL) > 4.5"
    ],
    associatedConditions: ["Coronary artery disease", "Hypertension", "Stroke & peripheral arterial disease"],
    differentialDiagnosis: "Familial hypercholesterolemia, Secondary dyslipidemia (Hypothyroidism, Nephrotic syndrome)."
  },
  {
    id: "card-dvt-pe",
    code: "CARD_DVT_PE",
    category: "cardiac",
    specialtyAr: "القلب والأوعية الدموية",
    imageUrl: createSvgDataUri(
      `<rect x="110" y="55" width="100" height="70" rx="8" fill="#1e1b4b" stroke="#6366f1" stroke-width="2"/>
      <text x="160" y="80" text-anchor="middle" fill="#a5b4fc" font-size="11" font-weight="bold">D-DIMER</text>
      <text x="160" y="102" text-anchor="middle" fill="#f43f5e" font-size="13" font-weight="900">&gt; 0.50 µg/mL</text>`,
      "DEEP VEIN THROMBOSIS & PULMONARY EMBOLISM",
      "Fibrin Degradation Product: Marked D-Dimer Elevation",
      "#312e81",
      "#818cf8"
    ),
    titleAr: "جلطة الأوردة العميقة والانصمام الرئوي (DVT & Pulmonary Embolism)",
    titleEn: "Venous Thromboembolism & D-Dimer",
    pathologySummaryAr: "تكون خثرات دموية وريدية مع تنشيط منظومة التجلط وتحلل الفيبرين، مما يؤدي لارتفاع مشتقات التحلل وخاصة مؤشر الدي دايمر (D-Dimer > 0.5 µg/mL FEU).",
    pathologySummaryEn: "Active venous thromboembolism triggering fibrin formation and plasmin-mediated degradation, resulting in elevated plasma D-Dimer.",
    keyDiagnosticPoints: [
      "Elevated Quantitative D-Dimer (> 0.5 µg/mL or 500 ng/mL FEU)",
      "High negative predictive value: normal D-Dimer safely excludes DVT/PE in low/moderate risk",
      "Elevated in active thrombosis, pulmonary embolism, disseminated coagulation",
      "Requires confirmatory venous Doppler ultrasound or CT pulmonary angiography",
      "Follow-up with prothrombin time (PT/INR) during anticoagulation"
    ],
    associatedConditions: ["Deep vein thrombosis (DVT)", "Pulmonary Embolism (PE)", "DIC"],
    differentialDiagnosis: "Sepsis, pregnancy, recent surgery, malignant tumors (cause false positives)."
  },

  // ==========================================
  // 4. الكبد والجهاز الهضمي (HEPATOLOGY & GI)
  // ==========================================
  {
    id: "hep-viral",
    code: "HEP_VIRAL_HEPATITIS",
    category: "hepatic",
    specialtyAr: "الكبد والجهاز الهضمي",
    imageUrl: createSvgDataUri(
      `<circle cx="160" cy="85" r="40" fill="#065f46" stroke="#34d399" stroke-width="2.5"/>
      <circle cx="160" cy="85" r="28" fill="#022c22"/>
      <text x="160" y="82" text-anchor="middle" fill="#a7f3d0" font-size="11" font-weight="bold">ALT &gt;&gt; 500</text>
      <text x="160" y="98" text-anchor="middle" fill="#6ee7b7" font-size="9" font-weight="bold">AST &gt;&gt; 400</text>`,
      "ACUTE VIRAL HEPATITIS (HBV / HCV)",
      "Massive Hepatocyte Cytolysis: Marked ALT & AST Elevation",
      "#065f46",
      "#34d399"
    ),
    titleAr: "التهاب الكبد الفيروسي الحاد والمزمن (Viral Hepatitis B & C)",
    titleEn: "Acute & Chronic Viral Hepatitis",
    pathologySummaryAr: "أذية والتهاب النسيج الكبدي بفعل الفيروسات الكبدية (B أو C) مما يتسبب في تحرر مكثف لإنزيمات الكبد السيتوبلازمية (ALT و AST بمئات أو آلاف الوحدات) مع اليرقان.",
    pathologySummaryEn: "Severe hepatocellular inflammation causing marked leakage of aminotransferases (ALT > AST) into circulation, accompanied by hyperbilirubinemia.",
    keyDiagnosticPoints: [
      "Dramatic elevation of ALT and AST (> 5-10 times upper normal limit in acute)",
      "ALT usually exceeds AST (De Ritis ratio < 1.0)",
      "Elevated Total and Direct Bilirubin (Hepatic Jaundice)",
      "Positive Serological markers: HBsAg, HBcAb IgM, Anti-HCV, and PCR Viral Load",
      "Prolonged Prothrombin Time (PT/INR) in severe hepatic insufficiency"
    ],
    associatedConditions: ["Hepatitis B Virus (HBV)", "Hepatitis C Virus (HCV)", "Autoimmune hepatitis"],
    differentialDiagnosis: "Toxic/drug-induced liver injury, Alcoholic hepatitis (AST > ALT), Ischemic hepatitis."
  },
  {
    id: "hep-cirrhosis",
    code: "HEP_CIRRHOSIS",
    category: "hepatic",
    specialtyAr: "الكبد والجهاز الهضمي",
    imageUrl: createSvgDataUri(
      `<path d="M 120,60 C 130,55 190,55 200,65 C 210,85 195,115 155,120 C 125,115 110,85 120,60 Z" fill="#78350f" stroke="#d97706" stroke-width="2"/>
      <circle cx="140" cy="80" r="5" fill="#fde68a"/><circle cx="160" cy="75" r="6" fill="#fde68a"/><circle cx="175" cy="90" r="5.5" fill="#fde68a"/>
      <text x="160" y="140" text-anchor="middle" fill="#fde68a" font-size="9.5" font-weight="bold">Albumin &lt; 2.5 | INR &gt; 1.5</text>`,
      "LIVER CIRRHOSIS & HEPATIC FAILURE",
      "Hepatosynthetic Failure: Hypoalbuminemia, Coagulopathy & Ascites",
      "#78350f",
      "#d97706"
    ),
    titleAr: "تليف وتشمع الكبد وقصور وظائف التصنيع (Liver Cirrhosis)",
    titleEn: "Liver Cirrhosis & Synthetic Failure",
    pathologySummaryAr: "فشل في وظائف الكبد التصنيعية ناتج عن استبدال النسيج الكبدي بالألياف والعقيدات المتجددة، مؤدياً لانخفاض حاد في الألبومين وتطاول زمن النزف والسيولة (INR مرتفع) واستسقاء البطن.",
    pathologySummaryEn: "Advanced parenchymal fibrosis causing synthetic failure (hypoalbuminemia, prolonged PT/INR) and portal hypertension.",
    keyDiagnosticPoints: [
      "Low Serum Albumin (< 3.0 g/dL, often < 2.5 g/dL)",
      "Prolonged Prothrombin Time (PT) and elevated INR (> 1.3 - 1.8)",
      "Inversion of Albumin/Globulin (A/G) ratio (< 1.0)",
      "AST / ALT ratio (De Ritis) > 1.5 - 2.0 (reversal in cirrhosis)",
      "Thrombocytopenia secondary to hypersplenism"
    ],
    associatedConditions: ["Portal hypertension", "Ascites", "Hepatic encephalopathy & esophageal varices"],
    differentialDiagnosis: "Nephrotic syndrome, Protein-losing enteropathy, Cardiac cirrhosis."
  },
  {
    id: "hep-pancreatitis",
    code: "HEP_PANCREATITIS",
    category: "hepatic",
    specialtyAr: "الكبد والجهاز الهضمي",
    imageUrl: createSvgDataUri(
      `<rect x="110" y="60" width="100" height="65" rx="10" fill="#4c0519" stroke="#f43f5e" stroke-width="2"/>
      <text x="160" y="85" text-anchor="middle" fill="#fda4af" font-size="11" font-weight="bold">SERUM LIPASE</text>
      <text x="160" y="105" text-anchor="middle" fill="#fff" font-size="13" font-weight="900">&gt; 3X NORMAL</text>`,
      "ACUTE PANCREATITIS",
      "Pancreatic Acinar Injury: Marked Lipase & Amylase Surge",
      "#881337",
      "#f43f5e"
    ),
    titleAr: "التهاب البنكرياس الحاد (Acute Pancreatitis)",
    titleEn: "Acute Pancreatitis (Lipase & Amylase)",
    pathologySummaryAr: "التهاب حاد في خلايا البنكرياس يؤدي إلى التنشيط المبكر للإنزيمات الهاضمة وتحررها في مجرى الدم، مما يرفع مستويات إنزيم الليباز (Lipase) والأميليز لأكثر من 3 أضعاف المعدل الطبيعي.",
    pathologySummaryEn: "Acute acinar cell injury releasing pancreatic digestive enzymes into serum, with Serum Lipase rising > 3x upper reference limit.",
    keyDiagnosticPoints: [
      "Serum Lipase elevated > 3 times upper limit (more sensitive and specific than amylase)",
      "Serum Amylase elevated rapidly in acute episode",
      "Elevated CRP and leukocytosis with left shift",
      "Hypocalcemia may develop in severe necrotizing cases",
      "Abdominal ultrasound or CT scan correlation required"
    ],
    associatedConditions: ["Biliary stones (gallstone pancreatitis)", "Alcoholic injury", "Hypertriglyceridemia"],
    differentialDiagnosis: "Perforated peptic ulcer, Acute cholecystitis, Intestinal obstruction."
  },
  {
    id: "hep-hpylori",
    code: "HEP_HPYLORI",
    category: "hepatic",
    specialtyAr: "الكبد والجهاز الهضمي",
    imageUrl: createSvgDataUri(
      `<path d="M 120,90 Q 140,65 160,90 T 200,90" fill="none" stroke="#22c55e" stroke-width="4" stroke-linecap="round"/>
      <line x1="200" y1="90" x2="215" y2="80" stroke="#86efac" stroke-width="2"/>
      <line x1="200" y1="90" x2="218" y2="92" stroke="#86efac" stroke-width="2"/>
      <line x1="200" y1="90" x2="214" y2="102" stroke="#86efac" stroke-width="2"/>
      <text x="160" y="135" text-anchor="middle" fill="#86efac" font-size="10" font-weight="bold">H. Pylori Stool Ag (+)</text>`,
      "HELICOBACTER PYLORI GASTRITIS",
      "Gastric Mucosal Colonization, Peptic Ulceration & Urea Hydrolysis",
      "#14532d",
      "#22c55e"
    ),
    titleAr: "جرثومة المعدة والتهاب المعدة المزمن (H. Pylori Gastritis)",
    titleEn: "Helicobacter Pylori Infection",
    pathologySummaryAr: "استيطان بكتيريا الحلزونية البوابية (H. pylori) للغشاء المخاطي المبطن للمعدة مفرزة إنزيم اليورييز، مؤدية لالتهاب مزمن بالمعدة وقرحة الإثني عشر والمعدة وسوء الهضم.",
    pathologySummaryEn: "Gastric mucosal colonization by helical H. pylori bacteria causing chronic active gastritis, peptic ulcers, and positive stool antigen.",
    keyDiagnosticPoints: [
      "Positive H. Pylori Stool Antigen (Gold standard for active infection and eradication confirmation)",
      "Positive Urea Breath Test (UBT)",
      "Serum H. Pylori IgG indicates past or present exposure",
      "Complete eradication confirmation recommended 4-6 weeks after therapy",
      "Associated with iron-deficiency anemia and dyspeptic symptoms"
    ],
    associatedConditions: ["Duodenal and Gastric Peptic Ulcers", "Chronic Atrophic Gastritis", "MALT Lymphoma"],
    differentialDiagnosis: "NSAID-induced gastritis, Non-ulcer functional dyspepsia."
  },

  // ==========================================
  // 5. الكلى والمسالك البولية (NEPHROLOGY & UROLOGY)
  // ==========================================
  {
    id: "ren-aki",
    code: "REN_AKI",
    category: "renal",
    specialtyAr: "الكلى والمسالك البولية",
    imageUrl: createSvgDataUri(
      `<path d="M 135,55 C 110,65 110,115 135,125 C 160,135 190,115 185,90 C 180,65 160,50 135,55 Z" fill="#1e1b4b" stroke="#818cf8" stroke-width="2.5"/>
      <circle cx="160" cy="90" r="16" fill="#f43f5e"/>
      <text x="160" y="93" text-anchor="middle" fill="#fff" font-size="9" font-weight="bold">Creat</text>
      <text x="160" y="145" text-anchor="middle" fill="#f87171" font-size="10" font-weight="bold">Creatinine &gt;&gt; 2.5 mg/dL</text>`,
      "ACUTE KIDNEY INJURY (AKI)",
      "Sudden Glomerular Retention: Acute Azotemia & Oliguria",
      "#312e81",
      "#818cf8"
    ),
    titleAr: "القصور الكلوي الحاد واحتباس البولينا (Acute Kidney Injury - AKI)",
    titleEn: "Acute Kidney Injury & Azotemia",
    pathologySummaryAr: "تدهور مفاجئ سريع في وظائف الكلى الإخراجية خلال ساعات إلى أيام، مؤدياً لاحتباس الفضلات النيتروجينية في الدم (ارتفاع حاد في الكرياتينين والبولينا وحمض البوليك) واختلال الأملاح.",
    pathologySummaryEn: "Abrupt decrease in kidney filtration function resulting in rapid retention of creatinine and urea nitrogen with electrolyte imbalance.",
    keyDiagnosticPoints: [
      "Acute rise in Serum Creatinine by >= 0.3 mg/dL within 48h, or >= 1.5x baseline",
      "Elevated Blood Urea Nitrogen (BUN) and Blood Urea",
      "BUN/Creatinine ratio > 20:1 suggests prerenal azotemia (dehydration/hypovolemia)",
      "Hyperkalemia (elevated potassium) requiring urgent cardiac monitoring",
      "Metabolic acidosis (low bicarbonate) and oliguria"
    ],
    associatedConditions: ["Dehydration / Sepsis", "Nephrotoxic drugs (NSAIDs, aminoglycosides, contrast)", "Acute tubular necrosis"],
    differentialDiagnosis: "Chronic Kidney Disease (distinguished by small kidney size and chronic history)."
  },
  {
    id: "ren-ckd",
    code: "REN_CKD",
    category: "renal",
    specialtyAr: "الكلى والمسالك البولية",
    imageUrl: createSvgDataUri(
      `<rect x="100" y="60" width="120" height="60" rx="8" fill="#1e293b" stroke="#64748b" stroke-width="2"/>
      <text x="160" y="82" text-anchor="middle" fill="#cbd5e1" font-size="10" font-weight="bold">eGFR STAGING</text>
      <text x="160" y="102" text-anchor="middle" fill="#f59e0b" font-size="12" font-weight="900">&lt; 60 mL/min/1.73m²</text>`,
      "CHRONIC KIDNEY DISEASE (CKD)",
      "Progressive Glomerular Decline & Proteinuria (CKD-EPI)",
      "#334155",
      "#94a3b8"
    ),
    titleAr: "مرض الكلى المزمن ومعدل الفلترة (Chronic Kidney Disease - CKD)",
    titleEn: "Chronic Kidney Disease & eGFR Decline",
    pathologySummaryAr: "تراجع تدريجي دائم في معدل الفلترة الكبيبية (eGFR < 60 mL/min) لأكثر من 3 أشهر، مصحوباً بظهور الزلال البولي (Albuminuria) وفقر الدم الناتج عن نقص الإريثروبويتين واعتلال العظام.",
    pathologySummaryEn: "Persistent kidney damage with estimated glomerular filtration rate (eGFR) < 60 mL/min/1.73m² for >= 3 months, often accompanied by albuminuria.",
    keyDiagnosticPoints: [
      "eGFR calculated via CKD-EPI formula (< 60 mL/min indicates Stage 3+ CKD)",
      "Elevated persistent serum creatinine and urea",
      "Urine Albumin-to-Creatinine Ratio (UACR) > 30 mg/g (Micro/Macroalbuminuria)",
      "Normocytic normochromic anemia (erythropoietin deficiency)",
      "Secondary hyperparathyroidism with high phosphorus and low calcium"
    ],
    associatedConditions: ["Diabetic nephropathy", "Hypertensive nephrosclerosis", "Chronic glomerulonephritis"],
    differentialDiagnosis: "Acute reversible kidney injury, benign postural proteinuria."
  },
  {
    id: "ren-uti",
    code: "REN_UTI",
    category: "renal",
    specialtyAr: "الكلى والمسالك البولية",
    imageUrl: createSvgDataUri(
      `<circle cx="160" cy="85" r="42" fill="#7f1d1d" stroke="#ef4444" stroke-width="2"/>
      <circle cx="140" cy="80" r="10" fill="#fee2e2"/><circle cx="140" cy="80" r="4" fill="#991b1b"/>
      <circle cx="175" cy="78" r="11" fill="#fee2e2"/><circle cx="175" cy="78" r="4.5" fill="#991b1b"/>
      <circle cx="155" cy="100" r="10" fill="#fee2e2"/><circle cx="155" cy="100" r="4" fill="#991b1b"/>
      <text x="160" y="145" text-anchor="middle" fill="#fca5a5" font-size="9.5" font-weight="bold">Pus Cells &gt; 50 / HPF &amp; Nitrite (+)</text>`,
      "URINARY TRACT INFECTION (UTI)",
      "Active Pyuria, Nitrite Positivity & Significant Bacteriuria",
      "#7f1d1d",
      "#ef4444"
    ),
    titleAr: "التهاب المسالك البولية وصديد البول (Urinary Tract Infection - UTI)",
    titleEn: "Urinary Tract Infection & Pyuria",
    pathologySummaryAr: "غزو بكتيري للجهاز البولي مصحوب بظهور كثيف لخلايا الصديد والكرات البيضاء المتعددة (Pus cells > 20-50 / HPF) ووجود النتريت وبكتيريا البول مع عسر التبول وألم أسفل البطن.",
    pathologySummaryEn: "Bacterial colonization of the urinary tract with marked pyuria (> 20-50 pus cells/HPF), positive leukocyte esterase, and positive nitrite.",
    keyDiagnosticPoints: [
      "Pyuria (Pus Cells / WBCs > 10 - 50+ per high power field)",
      "Positive Chemical Leukocyte Esterase & Nitrite on urine dipstick",
      "Abundant bacteria detected on microscopic sediment",
      "Urine Culture and Sensitivity recommended (significant bacteriuria >= 10^5 CFU/mL)",
      "Hematuria (microscopic red blood cells) frequently present"
    ],
    associatedConditions: ["Acute Cystitis", "Acute Pyelonephritis", "Prostatitis"],
    differentialDiagnosis: "Contaminated sample, Renal tuberculosis, Non-infectious interstitial cystitis."
  },
  {
    id: "ren-gout",
    code: "REN_GOUT_URIC",
    category: "renal",
    specialtyAr: "الكلى والمسالك البولية",
    imageUrl: createSvgDataUri(
      `<polygon points="120,85 160,60 200,85 160,110" fill="#eab308" stroke="#ca8a04" stroke-width="2"/>
      <polygon points="140,95 180,75 190,105 150,115" fill="#fef08a" stroke="#ca8a04" stroke-width="1.5"/>
      <text x="160" y="140" text-anchor="middle" fill="#fef08a" font-size="10" font-weight="bold">Serum Uric Acid &gt; 7.5 mg/dL</text>`,
      "HYPERURICEMIA & GOUT",
      "Monosodium Urate Crystals & Hyperuricemic Nephrolithiasis",
      "#854d0e",
      "#facc15"
    ),
    titleAr: "ارتفاع حمض اليوريك ومرض النقرس (Hyperuricemia & Gout)",
    titleEn: "Hyperuricemia & Gouty Arthritis",
    pathologySummaryAr: "زيادة إنتاج أو قصور إخراج حمض اليوريك مما يؤدي لترسب بلورات اليورات في المفاصل (نوبات النقرس الحادة) والمسالك البولية مسببة حصوات اليورات الكلوية.",
    pathologySummaryEn: "Supersaturation of body fluids with urate leading to monosodium urate crystal deposition in joints and renal interstitium.",
    keyDiagnosticPoints: [
      "Serum Uric Acid > 7.0 mg/dL in males, > 6.0 mg/dL in females",
      "Presence of rhomboid / needle-shaped uric acid crystals in urine sediment",
      "Severe acute inflammatory monoarthritis (Podagra of 1st MTP joint)",
      "Elevated inflammatory markers (CRP, ESR) during acute attacks",
      "Risk of radiolucent uric acid renal stones"
    ],
    associatedConditions: ["Acute gouty arthritis", "Uric acid nephrolithiasis", "Metabolic syndrome"],
    differentialDiagnosis: "Pseudogout (Calcium pyrophosphate), Septic arthritis, Cellulitis."
  },

  // ==========================================
  // 6. المناعة الذاتية والروماتيزم (IMMUNOLOGY)
  // ==========================================
  {
    id: "imm-lupus",
    code: "IMM_LUPUS_SLE",
    category: "immunology",
    specialtyAr: "المناعة والروماتيزم",
    imageUrl: createSvgDataUri(
      `<circle cx="160" cy="85" r="42" fill="#581c87" stroke="#c084fc" stroke-width="2.5"/>
      <text x="160" y="78" text-anchor="middle" fill="#e9d5ff" font-size="11" font-weight="bold">ANA Titer 1:640</text>
      <text x="160" y="98" text-anchor="middle" fill="#f472b6" font-size="10" font-weight="bold">Anti-dsDNA (+)</text>`,
      "SYSTEMIC LUPUS ERYTHEMATOSUS (SLE)",
      "Autoantibody Production: High-Titer ANA & Anti-dsDNA",
      "#581c87",
      "#c084fc"
    ),
    titleAr: "الذئبة الحمراء والمناعة الذاتية (Systemic Lupus Erythematosus - SLE)",
    titleEn: "Systemic Lupus Erythematosus (SLE)",
    pathologySummaryAr: "مرض مناعي ذاتي جهازي يتميز بإنتاج أجسام مضادة ضد النواة ومكونات الخلية (ANA و Anti-dsDNA) مما يؤدي لتشكل معقدات مناعية تترسب في الكلى والجلد والمفاصل والأوعية الدموية.",
    pathologySummaryEn: "Multisystem autoimmune disease driven by pathogenic antinuclear autoantibodies (ANA, anti-dsDNA, anti-Smith) and immune complex deposition.",
    keyDiagnosticPoints: [
      "Positive Antinuclear Antibodies (ANA) with high titer (>= 1:160, Homogeneous/Speckled)",
      "High Anti-dsDNA antibodies (strongly specific for SLE and correlates with nephritis)",
      "Positive Anti-Smith (Sm) antibodies (highly specific)",
      "Low complement levels (Consumption of C3 and C4 during active disease)",
      "Lupus nephritis screening via proteinuria and active urine sediment"
    ],
    associatedConditions: ["Lupus nephritis", "Malar rash & photosensitivity", "Autoimmune hemolytic anemia & leukopenia"],
    differentialDiagnosis: "Drug-induced lupus, Mixed connective tissue disease, Rheumatoid arthritis."
  },
  {
    id: "imm-rheumatoid",
    code: "IMM_RHEUMATOID",
    category: "immunology",
    specialtyAr: "المناعة والروماتيزم",
    imageUrl: createSvgDataUri(
      `<rect x="105" y="55" width="110" height="70" rx="8" fill="#312e81" stroke="#818cf8" stroke-width="2"/>
      <text x="160" y="80" text-anchor="middle" fill="#c7d2fe" font-size="10" font-weight="bold">Anti-CCP &gt;&gt; 100 U</text>
      <text x="160" y="102" text-anchor="middle" fill="#f43f5e" font-size="10" font-weight="bold">RF Latex (+)</text>`,
      "RHEUMATOID ARTHRITIS (RA)",
      "Synovial Autoimmunity: High Anti-CCP Antibodies & Rheumatoid Factor",
      "#312e81",
      "#818cf8"
    ),
    titleAr: "الروماتويد المفصلي (Rheumatoid Arthritis - RA)",
    titleEn: "Rheumatoid Arthritis & Autoantibodies",
    pathologySummaryAr: "التهاب مناعي مزمن يصيب الغشاء الزليلي المبطن للمفاصل، مصحوباً بظهور الأجسام المضادة للبيبتيد السيتروليني الحلقي (Anti-CCP) وعامل الروماتويد (RF) وارتفاع حاد في سرعة الترسيب وCRP.",
    pathologySummaryEn: "Chronic systemic autoimmune inflammatory arthritis associated with Anti-Citrullinated Protein Antibodies (Anti-CCP) and Rheumatoid Factor.",
    keyDiagnosticPoints: [
      "Anti-CCP Antibodies highly positive (Specificity > 95% for Rheumatoid Arthritis)",
      "Positive Rheumatoid Factor (RF IgM Latex / Turbidimetry)",
      "Markedly elevated acute phase reactants: ESR and C-Reactive Protein (CRP)",
      "Symmetrical polyarthritis affecting small joints of hands and feet with morning stiffness",
      "Normocytic anemia of chronic disease"
    ],
    associatedConditions: ["Symmetrical polyarthritis", "Rheumatoid nodules", "Secondary Sjogren syndrome"],
    differentialDiagnosis: "Osteoarthritis, Psoriatic arthritis, Systemic Lupus, Gout."
  },

  // ==========================================
  // 7. الأمراض الصدرية والمعدية (INFECTIOUS)
  // ==========================================
  {
    id: "inf-pneumonia",
    code: "INF_PNEUMONIA_CRP",
    category: "infectious",
    specialtyAr: "الأمراض الصدرية والمعدية",
    imageUrl: createSvgDataUri(
      `<rect x="105" y="55" width="110" height="70" rx="10" fill="#450a0a" stroke="#ef4444" stroke-width="2"/>
      <text x="160" y="80" text-anchor="middle" fill="#fecaca" font-size="10" font-weight="bold">CRP HIGH TITER</text>
      <text x="160" y="105" text-anchor="middle" fill="#fff" font-size="14" font-weight="900">&gt; 96 mg/L</text>`,
      "ACUTE BACTERIAL INFECTION & PNEUMONIA",
      "Systemic Inflammatory Surge: Extreme CRP & Procalcitonin Elevation",
      "#7f1d1d",
      "#ef4444"
    ),
    titleAr: "الالتهاب البكتيري الحاد والصدري (Acute Bacterial Infection & Pneumonia)",
    titleEn: "Severe Bacterial Infection & Acute Phase Biomarkers",
    pathologySummaryAr: "استجابة التهابية مناعية حادة تصاحب الالتهاب الرئوي أو العدوى البكتيرية الشديدة، تسبب ارتفاعاً هائلاً في البروتين التفاعلي سي (CRP > 48-100 mg/L) ومؤشر البروكالسيتونين مع وفرة العدلات.",
    pathologySummaryEn: "Severe acute-phase systemic reaction to bacterial infection causing exponential rise in serum CRP and Procalcitonin, with marked left shift.",
    keyDiagnosticPoints: [
      "Marked elevation of C-Reactive Protein (CRP > 48-100 mg/L)",
      "Leukocytosis (WBC > 12,000 - 20,000 /µL) with Neutrophilia and toxic granulation",
      "Elevated Procalcitonin (> 0.5 - 2.0 ng/mL strongly favors bacterial etiology)",
      "Markedly accelerated Erythrocyte Sedimentation Rate (ESR > 50-100 mm/hr)",
      "Blood cultures and sputum microbiological culture recommended"
    ],
    associatedConditions: ["Bacterial pneumonia", "Acute sepsis", "Deep tissue abscesses"],
    differentialDiagnosis: "Viral respiratory infection (typically lower CRP, normal procalcitonin)."
  },

  // ==========================================
  // 8. أطلس الفحص المجهري (MICROSCOPY ATLAS)
  // ==========================================
  {
    id: "atlas-oxalate",
    code: "ATLAS_URINE_OXALATE",
    category: "microscopy",
    specialtyAr: "أطلس الفحص المجهري",
    imageUrl: createSvgDataUri(
      `<rect x="125" y="60" width="70" height="70" fill="#0369a1" stroke="#38bdf8" stroke-width="2.5"/>
      <line x1="125" y1="60" x2="195" y2="130" stroke="#bae6fd" stroke-width="2"/>
      <line x1="195" y1="60" x2="125" y2="130" stroke="#bae6fd" stroke-width="2"/>`,
      "CALCIUM OXALATE ENVELOPE CRYSTALS",
      "Octahedral Envelope-shaped Crystals in Acidic / Neutral Urine",
      "#0284c7",
      "#38bdf8"
    ),
    titleAr: "أطلس البول: بلورات أكسالات الكالسيوم (Calcium Oxalate Envelope)",
    titleEn: "Urinary Calcium Oxalate Crystals",
    pathologySummaryAr: "بلورات ثمانية السطوح تشبه المظروف البريدي (Envelope shape) مميزة لأكسالات الكالسيوم ثنائية الهيدرات في البول الحمضي أو المتعادل، تظهر مع فرط الأكسالات أو قلة شرب الماء.",
    pathologySummaryEn: "Colorless, highly refractive octahedral envelope-shaped crystals of calcium oxalate dihydrate found in acidic to neutral urine.",
    keyDiagnosticPoints: [
      "Classic envelope or dumbbell shape under polarized and light microscopy",
      "Soluble in dilute hydrochloric acid, insoluble in acetic acid",
      "Commonly associated with dietary oxalate intake (spinach, chocolate, tea)",
      "Risk marker for calcium oxalate urolithiasis when present in heavy clumps",
      "Adequate hydration (> 2.5 L water/day) recommended"
    ],
    associatedConditions: ["Calcium oxalate renal stones", "Dehydration", "Hyperoxaluria"],
    differentialDiagnosis: "Triple phosphate crystals (found in alkaline urine)."
  },
  {
    id: "atlas-triple-phos",
    code: "ATLAS_URINE_TRIPLE",
    category: "microscopy",
    specialtyAr: "أطلس الفحص المجهري",
    imageUrl: createSvgDataUri(
      `<polygon points="120,65 200,65 190,125 130,125" fill="#047857" stroke="#34d399" stroke-width="2.5"/>
      <line x1="120" y1="65" x2="190" y2="125" stroke="#a7f3d0" stroke-width="2"/>`,
      "TRIPLE PHOSPHATE COFFIN-LID CRYSTALS",
      "Struvite Crystals in Alkaline Urine Associated with Urease Bacteria",
      "#047857",
      "#34d399"
    ),
    titleAr: "أطلس البول: بلورات ثلاثي الفوسفات (Triple Phosphate Crystals)",
    titleEn: "Triple Phosphate (Struvite) Crystals",
    pathologySummaryAr: "بلورات منشورية مستطيلة تشبه غطاء التابوت (Coffin-lid appearance) مميزة لفوسفات المغنيسيوم والأمونيوم، تتكون حصراً في البول القلوي (pH > 7.5) المصاحب للبكتيريا المحللة لليوريا.",
    pathologySummaryEn: "Three- to six-sided colorless prisms with oblique ends (coffin-lid shape) characteristic of magnesium ammonium phosphate in alkaline urine.",
    keyDiagnosticPoints: [
      "Classic 'coffin lid' rectangular prism morphology",
      "Form in alkaline urine (pH > 7.0 - 8.5)",
      "Pathognomonic marker for urease-producing bacteria (Proteus mirabilis, Klebsiella)",
      "High propensity for large branched Staghorn calculi",
      "Requires urine culture and appropriate antibiotic treatment"
    ],
    associatedConditions: ["Proteus UTI", "Staghorn renal calculi", "Alkaline urine crystalluria"],
    differentialDiagnosis: "Uric acid crystals (restricted to acidic urine)."
  },
  {
    id: "atlas-casts",
    code: "ATLAS_URINE_CASTS",
    category: "microscopy",
    specialtyAr: "أطلس الفحص المجهري",
    imageUrl: createSvgDataUri(
      `<rect x="110" y="70" width="100" height="40" rx="8" fill="#7c2d12" stroke="#ea580c" stroke-width="2.5"/>
      <circle cx="130" cy="90" r="4" fill="#fed7aa"/><circle cx="150" cy="85" r="5" fill="#fed7aa"/><circle cx="170" cy="92" r="4.5" fill="#fed7aa"/><circle cx="190" cy="88" r="4" fill="#fed7aa"/>`,
      "URINARY GRANULAR & CELLULAR CASTS",
      "Renal Tubular Casts Indicative of Active Intrinsic Nephropathy",
      "#7c2d12",
      "#ea580c"
    ),
    titleAr: "أطلس البول: الأسطوانات الكلوية الحبيبية (Urinary Granular Casts)",
    titleEn: "Urinary Granular & Cellular Casts",
    pathologySummaryAr: "أسطوانات كلوية أسطوانية الشكل ناتجة عن ترسب بروتين تام-هورسفول مترافقاً مع حبيبات متحللة من الخلايا الكلوية أو كرات الدم، تدل على إصابة نبيبية أو كبيبية كلوية نشطة.",
    pathologySummaryEn: "Cylindrical proteinaceous structures formed in distal renal tubules containing degenerated cellular granules, reflecting parenchymal renal disease.",
    keyDiagnosticPoints: [
      "Direct indicator of intrinsic renal disease originating in the nephrons",
      "Granular casts indicate acute tubular necrosis, glomerulonephritis, or pyelonephritis",
      "RBC casts indicate active glomerulonephritis (nephritic syndrome)",
      "WBC casts indicate acute pyelonephritis or interstitial nephritis",
      "Differentiation from harmless hyaline casts (which occur with dehydration/exercise)"
    ],
    associatedConditions: ["Acute Tubular Necrosis (ATN)", "Glomerulonephritis", "Pyelonephritis"],
    differentialDiagnosis: "Mucus threads, clothing fibers, hyaline exercise casts."
  },
  {
    id: "atlas-amoeba",
    code: "ATLAS_STOOL_AMOEBA",
    category: "parasitology",
    specialtyAr: "أطلس الفحص المجهري",
    imageUrl: createSvgDataUri(
      `<circle cx="160" cy="90" r="38" fill="#1e3a8a" stroke="#60a5fa" stroke-width="2.5"/>
      <circle cx="145" cy="80" r="5" fill="#bfdbfe"/>
      <circle cx="175" cy="80" r="5" fill="#bfdbfe"/>
      <circle cx="145" cy="100" r="5" fill="#bfdbfe"/>
      <circle cx="175" cy="100" r="5" fill="#bfdbfe"/>
      <circle cx="160" cy="90" r="3" fill="#172554"/>`,
      "ENTAMOEBA HISTOLYTICA CYST",
      "Spherical Quadranucleate Cyst with Central Karyosome (Direct Smear)",
      "#1e3a8a",
      "#60a5fa"
    ),
    titleAr: "أطلس البراز: طفيلي الأميبا الهستوليتية (Entamoeba histolytica Cyst)",
    titleEn: "Entamoeba Histolytica Cysts & Trophozoites",
    pathologySummaryAr: "أكياس كروية الشكل مميزة بقطر 10-15 ميكرون تحوي 4 أنوية متماثلة مع جسيم نووي مركزي دقيق، مسببة للزحار الأميبي وقرح القولون والإسهال المخاطي المدمم.",
    pathologySummaryEn: "Spherical quadranucleated cysts with central karyosomes characteristic of Entamoeba histolytica in wet stool mount.",
    keyDiagnosticPoints: [
      "Mature cyst has 4 nuclei with central pinpoint karyosome and smooth chromatoid bars",
      "Trophozoites show directional motility and ingested RBCs (Erythrophagocytosis)",
      "Causes amoebic dysentery, mucoid bloody stools, and abdominal cramping",
      "Risk of extraintestinal dissemination (Amoebic Liver Abscess)",
      "Specific anti-protozoal treatment (Metronidazole / Tinidazole) indicated"
    ],
    associatedConditions: ["Amoebic dysentery", "Intestinal colitis", "Amoebic liver abscess"],
    differentialDiagnosis: "Entamoeba coli (non-pathogenic cyst with 8 nuclei and eccentric karyosome)."
  },
  {
    id: "atlas-giardia",
    code: "ATLAS_STOOL_GIARDIA",
    category: "parasitology",
    specialtyAr: "أطلس الفحص المجهري",
    imageUrl: createSvgDataUri(
      `<path d="M 160,55 C 135,55 130,85 150,115 C 158,125 162,125 170,115 C 190,85 185,55 160,55 Z" fill="#047857" stroke="#34d399" stroke-width="2.5"/>
      <circle cx="152" cy="78" r="5" fill="#d1fae5"/><circle cx="152" cy="78" r="2.5" fill="#064e3b"/>
      <circle cx="168" cy="78" r="5" fill="#d1fae5"/><circle cx="168" cy="78" r="2.5" fill="#064e3b"/>
      <line x1="160" y1="65" x2="160" y2="120" stroke="#a7f3d0" stroke-width="1.5"/>`,
      "GIARDIA LAMBLIA TROPHOZOITE",
      "Pear-shaped Flagellate with Sucking Disc & Binucleate Appearance",
      "#047857",
      "#34d399"
    ),
    titleAr: "أطلس البراز: طفيلي الجيارديا اللامبلية (Giardia Lamblia)",
    titleEn: "Giardia Lamblia (Trophozoite & Cyst)",
    pathologySummaryAr: "طور خضري كمثري الشكل ذو مظهر وجه مبتسم يحوي نواتين متماثلتين وأربعة أزواج من الأسواط وقرص ماص بطني، مسبباً لسوء امتصاص الدهون والإسهال الدهني المزمن والانتفاخ.",
    pathologySummaryEn: "Pear-shaped binucleated flagellated trophozoite with ventral sucking disc causing malabsorption, steatorrhea, and chronic diarrhea.",
    keyDiagnosticPoints: [
      "Trophozoite shows characteristic 'falling leaf' tumbling motility on fresh saline mount",
      "Cysts are oval with 4 nuclei, central axostyle, and clear halo wall",
      "Colonizes duodenal and upper jejunal mucosa inhibiting lipid absorption",
      "Clinical presentation: greasy pale foul-smelling stools and flatulence",
      "Treated with Metronidazole / Nitazoxanide"
    ],
    associatedConditions: ["Giardiasis", "Fat malabsorption & steatorrhea", "Childhood growth faltering"],
    differentialDiagnosis: "Celiac disease, Irritable bowel syndrome, Lactose intolerance."
  }
];

// Ensure fallback properties exist
DISEASE_ILLUSTRATIONS.forEach(item => {
  if (!item.descriptionAr) item.descriptionAr = item.pathologySummaryAr;
  if (!item.descriptionEn) item.descriptionEn = item.pathologySummaryEn;
  if (!item.diagnosticCriteria) item.diagnosticCriteria = item.keyDiagnosticPoints;
});

export function getIllustrationByCode(code: string): DiseaseIllustration | undefined {
  return DISEASE_ILLUSTRATIONS.find(item => item.code.toUpperCase() === code.toUpperCase());
}

// Auto-suggest illustration based on parameters
export function suggestHematologicalIllustration(paramsInput: any): DiseaseIllustration {
  let params: {
    hb?: number;
    mcv?: number;
    mch?: number;
    mchc?: number;
    rdw?: number;
    wbc?: number;
    neutrophils?: number;
    bands?: number;
    lymphocytes?: number;
    platelets?: number;
    mentzerIndex?: number;
    fbs?: number;
    hba1c?: number;
    tsh?: number;
    creat?: number;
    alt?: number;
    crp?: number;
  } = {};

  if (Array.isArray(paramsInput)) {
    paramsInput.forEach((p: any) => {
      const name = (p.name || '').toLowerCase();
      const val = parseFloat(String(p.result).replace(/[^0-9.-]/g, ''));
      if (!isNaN(val)) {
        if (name.includes('hemo') || name.includes('hb') || name.includes('hgb')) params.hb = val;
        else if (name.includes('mcv')) params.mcv = val;
        else if (name.includes('mchc')) params.mchc = val;
        else if (name.includes('mch')) params.mch = val;
        else if (name.includes('rdw')) params.rdw = val;
        else if (name.includes('wbc') || name.includes('leucocyte')) params.wbc = val;
        else if (name.includes('platelet') || name.includes('plt')) params.platelets = val;
        else if (name.includes('mentzer')) params.mentzerIndex = val;
        else if (name.includes('hba1c') || name.includes('تراكمي')) params.hba1c = val;
        else if (name.includes('tsh')) params.tsh = val;
        else if (name.includes('creat') || name.includes('كرياتينين')) params.creat = val;
        else if (name.includes('alt') || name.includes('sgpt')) params.alt = val;
        else if (name.includes('crp')) params.crp = val;
      }
    });
  } else if (typeof paramsInput === 'object' && paramsInput !== null) {
    params = paramsInput;
  }

  // 1. Inflammatory & CRP
  if (params.crp && params.crp > 48) {
    const inf = getIllustrationByCode("INF_PNEUMONIA_CRP");
    if (inf) return inf;
  }

  // 2. Diabetic profile
  if (params.hba1c && params.hba1c >= 6.5) {
    const dia = getIllustrationByCode("ENDO_DIABETES");
    if (dia) return dia;
  }

  // 3. Thyroid profile
  if (params.tsh && params.tsh > 6.0) {
    const th = getIllustrationByCode("ENDO_HYPOTHYROID");
    if (th) return th;
  }

  // 4. Renal profile
  if (params.creat && params.creat > 2.0) {
    const ren = getIllustrationByCode("REN_AKI");
    if (ren) return ren;
  }

  // 5. Hepatic profile
  if (params.alt && params.alt > 100) {
    const hep = getIllustrationByCode("HEP_VIRAL_HEPATITIS");
    if (hep) return hep;
  }

  // 6. Microcytic anemia
  if ((params.mcv && params.mcv < 80) || (params.hb && params.hb < 11)) {
    if (params.mentzerIndex && params.mentzerIndex < 13) {
      const thal = getIllustrationByCode("HEM_THAL");
      if (thal) return thal;
    }
    const ida = getIllustrationByCode("HEM_IDA");
    if (ida) return ida;
  }

  // 7. Macrocytic anemia
  if (params.mcv && params.mcv > 100) {
    const meg = getIllustrationByCode("HEM_MEGALO");
    if (meg) return meg;
  }

  // Default normal
  return getIllustrationByCode("HEM_NORMAL") || DISEASE_ILLUSTRATIONS[0];
}
