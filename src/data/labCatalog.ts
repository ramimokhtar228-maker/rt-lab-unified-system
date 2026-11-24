export { INITIAL_PACKAGES } from "./packagesData";
export { INITIAL_INDIVIDUAL_TESTS } from "./individualTestsData";
export { INITIAL_LAB_INFO, INITIAL_FACILITIES, INITIAL_STAFF_MEMBERS } from "./staffAndFacilitiesData";
export { INITIAL_LOYALTY_PROFILES, TIER_BENEFITS } from "./loyaltyData";

import { CatalogProfileTemplate, LabStaffSignatures, StaffOptionItem } from '../types/lab';
import { OGTT_CATALOG_TEMPLATE } from '../utils/ogttEngine';

export const DEFAULT_STAFF: LabStaffSignatures = {
  labChemist: "د/ رحاب علي",
  verifiedBy: "د/ عمر فؤاد القاضي",
  pathologist: "أ.د/ رامي مختار",
  chemistTitle: "أخصائي تحاليل طبية",
  verifierTitle: "طبيب الوحدة",
  pathologistTitle: "استشارى الباثولوجيا الإكلينيكية — قصر العيني",
  chemistLicense: "EGY-SCI-88402",
  verifierLicense: "EGY-MED-11024",
  pathologistLicense: "EGY-MED-48201",
  chemistSignatureKey: "rehab",
  verifierSignatureKey: "auto",
  pathologistSignatureKey: "rami",
  showChemist: true,
  showVerifier: true,
  showPathologist: true,
  phlebotomist: "أ/ يوسف طارق المنشاوي",
  phlebotomistTitle: "أخصائي سحب العينات",
  phlebotomistLicense: "EGY-NUR-77651",
  phlebotomistSignatureKey: "auto",
  showPhlebotomist: true,
  visitCoordinator: "أ/ هدى السيد رضوان",
  visitCoordinatorTitle: "مسؤول تنسيق الزيارة",
  visitCoordinatorLicense: "EGY-VST-33201",
  visitCoordinatorSignatureKey: "auto",
  showVisitCoordinator: true,
  extraSignatures: [],
  hideSignatures: false
};

export interface StaffSignatureOptionsMap {
  chemists: StaffOptionItem[];
  verifiers: StaffOptionItem[];
  consultants: StaffOptionItem[];
  phlebotomists?: StaffOptionItem[];
  visitCoordinators?: StaffOptionItem[];
  customWorkers?: StaffOptionItem[];
}

export const INITIAL_STAFF_SIGNATURE_OPTIONS: StaffSignatureOptionsMap = {
  chemists: [
    { id: 'c-0', name: 'د/ رحاب علي', title: 'أخصائي تحاليل طبية', role: 'chemist', license: 'EGY-SCI-88402', signatureKey: 'rehab' },
    { id: 'c-1', name: 'د/ عمر فؤاد القاضي', title: 'أخصائي أول كيمياء إكلينيكية وهرمونات', role: 'chemist', license: 'EGY-SCI-88405', signatureKey: 'auto' },
    { id: 'c-2', name: 'د/ آية محمود الباز', title: 'أخصائية أمراض الدم والمناعة والمزارع', role: 'chemist', license: 'EGY-SCI-91204', signatureKey: 'auto' },
    { id: 'c-3', name: 'د/ كريم حسن الديب', title: 'كيميائي تحاليل طبية وتشخيصية', role: 'chemist', license: 'EGY-SCI-65432', signatureKey: 'auto' },
    { id: 'c-4', name: 'د/ هبة الشناوي', title: 'كيميائي المعمل — الفحوصات الطارئة', role: 'chemist', license: 'EGY-SCI-77210', signatureKey: 'auto' }
  ],
  verifiers: [
    { id: 'v-1', name: 'د/ عمر فؤاد القاضي', title: 'طبيب الوحدة والمراجعة الإكلينيكية', role: 'verifier', license: 'EGY-MED-11024', signatureKey: 'auto' },
    { id: 'v-2', name: 'د/ دعاء الشافعي', title: 'طبيب الوحدة — مراجعة الجودة', role: 'verifier', license: 'EGY-MED-55412', signatureKey: 'auto' },
    { id: 'v-3', name: 'د/ مصطفى العوضي', title: 'طبيب الوحدة — اعتماد النتائج', role: 'verifier', license: 'EGY-MED-33109', signatureKey: 'auto' }
  ],
  consultants: [
    { id: 'p-1', name: 'أ.د/ رامي مختار', title: 'استشارى الباثولوجيا الإكلينيكية — كلية طب قصر العيني', role: 'consultant', license: 'EGY-MED-48201', signatureKey: 'rami' },
    { id: 'p-2', name: 'د/ سامح عبد الرازق', title: 'استشارى أمراض الدم والباثولوجيا الإكلينيكية', role: 'consultant', license: 'EGY-MED-39108', signatureKey: 'auto' }
  ],
  phlebotomists: [
    { id: 'ph-1', name: 'أ/ يوسف طارق المنشاوي', title: 'أخصائي سحب العينات والزيارات المنزلية', role: 'phlebotomist', license: 'EGY-NUR-77651', signatureKey: 'auto' },
    { id: 'ph-2', name: 'أ/ محمد السيد عبد الله', title: 'فني سحب عينات — الفرع الرئيسي', role: 'phlebotomist', license: 'EGY-NUR-55210', signatureKey: 'auto' }
  ],
  visitCoordinators: [
    { id: 'vc-1', name: 'أ/ هدى السيد رضوان', title: 'مسؤول الزيارة وخدمة المرضى', role: 'visit_coordinator', license: 'EGY-VST-33201', signatureKey: 'auto' },
    { id: 'vc-2', name: 'أ/ مريم عبد الله توفيق', title: 'مسؤول تنسيق الزيارات المنزلية', role: 'visit_coordinator', license: 'EGY-VST-44102', signatureKey: 'auto' }
  ],
  customWorkers: []
};

export const STAFF_OPTIONS = {
  chemists: INITIAL_STAFF_SIGNATURE_OPTIONS.chemists.map(c => `${c.name} - ${c.title}`),
  verifiers: INITIAL_STAFF_SIGNATURE_OPTIONS.verifiers.map(v => `${v.name} - ${v.title}`),
  consultants: INITIAL_STAFF_SIGNATURE_OPTIONS.consultants.map(p => `${p.name} - ${p.title}`),
  pathologists: INITIAL_STAFF_SIGNATURE_OPTIONS.consultants.map(p => `${p.name} - ${p.title}`),
  phlebotomists: (INITIAL_STAFF_SIGNATURE_OPTIONS.phlebotomists || []).map(p => `${p.name} - ${p.title}`),
  visitCoordinators: (INITIAL_STAFF_SIGNATURE_OPTIONS.visitCoordinators || []).map(p => `${p.name} - ${p.title}`)
};

export const COMMON_INTERPRETATIONS: { [key: string]: string[] } = {
  CBC: [
    'Blood indices are within acceptable physiological limits.',
    'Mild microcytic hypochromic anemia, iron deficiency picture is suggested. Serum Ferritin is recommended.',
    'Normocytic normochromic anemia. Chronic disease or blood loss evaluation suggested.',
    'Relative leucocytosis with neutrophilia, suggestive of acute bacterial infection or inflammatory process.',
    'Thrombocytopenia, platelet count should be confirmed on fresh peripheral blood smear in citrate.'
  ],
  URINE: [
    'Normal routine urine analysis findings. No active urinary sediment or significant proteinuria.',
    'Active urinary sediment with marked pyuria and bacteriuria, suggestive of Urinary Tract Infection (UTI). Urine culture & sensitivity recommended.',
    'Microscopic hematuria with dysmorphic red cells, nephrological assessment is advised.',
    'Crystalluria noted (Calcium oxalate crystals). Adequate oral fluid intake is advised.'
  ],
  STOOL: [
    'Normal stool examination. No intestinal protozoa, ova, or occult blood detected.',
    'Entamoeba histolytica cysts / trophozoites detected. Specific anti-protozoal therapy recommended.',
    'Giardia lamblia vegetative forms / cysts seen. Clinical correlation with malabsorption or diarrheal symptoms.',
    'Presence of inflammatory pus cells and microscopic red cells, suggestive of bacillary dysentery or colitis.'
  ],
  SEMEN: [
    'Normozoospermia: Sperm count, progressive motility, and normal forms meet WHO criteria.',
    'Oligoasthenoteratozoospermia (OAT): Subnormal concentration, progressive motility, and normal morphology.',
    'Asthenozoospermia: Reduced progressive motility (< 32% PR). Repeat analysis after 3 weeks advised.',
    'Azoospermia: No spermatozoa identified in neat and centrifuged pellet. Centrifugation protocol confirmed.'
  ],
  CULTURE: [
    'Significant bacterial growth (> 100,000 CFU/mL). Sensitive antimicrobial options indicated in susceptibility chart.',
    'No significant bacterial growth obtained after 48 hours of aerobic incubation at 37°C.',
    'Low colony count (< 10,000 CFU/mL), likely urethral/skin colonization or early infection.'
  ],
  HOMA: [
    'HOMA-IR within normal insulin sensitivity range (< 1.9).',
    'Elevated HOMA-IR (> 2.9) consistent with marked Insulin Resistance and metabolic syndrome predisposition.'
  ],
  ACR: [
    'Normal Albumin-to-Creatinine Ratio (< 30 mg/g).',
    'Microalbuminuria confirmed (30 - 300 mg/g creatinine), early diabetic nephropathy or endothelial dysfunction.',
    'Macroalbuminuria / Clinical proteinuria (> 300 mg/g creatinine).'
  ],
  LIPID: [
    'Desirable lipid profile with normal atherogenic index.',
    'Hypercholesterolemia with elevated LDL-C. Cardiovascular risk evaluation and dietary modification recommended.',
    'Mixed dyslipidemia (Elevated Total Cholesterol and Triglycerides with low HDL-C).'
  ],
  LFT: [
    'Liver enzymes and synthetic hepatic markers are within normal reference ranges.',
    'Mild transaminitis (ALT & AST elevation), correlation with viral hepatitis serology and abdominal ultrasound is advised.',
    'Isolated elevation of Direct Bilirubin with normal liver enzymes. Biliary evaluation suggested.'
  ],
  KFT: [
    'Renal biomarkers indicate adequate glomerular filtration and nitrogenous clearance.',
    'Mild elevation of Serum Creatinine and Blood Urea. Follow-up after adequate hydration and eGFR calculation.',
    'Hyperuricemia, dietary modification and hydration recommended.'
  ],
  GLYCEMIC: [
    'Glycemic indices demonstrate adequate glycemic control.',
    'Impaired fasting glucose (IFG), pre-diabetes pattern. Lifestyle modification and 3-month HbA1c follow-up advised.',
    'Glycemic results consistent with diabetes mellitus criteria.'
  ],
  THYROID: [
    'Euthyroid state: TSH, Free T3, and Free T4 are within euthyroid reference ranges.',
    'Elevated TSH with normal Free T4, findings compatible with Subclinical Hypothyroidism.',
    'Suppressed TSH with elevated Free T4/Free T3, suggestive of Primary Hyperthyroidism.'
  ],
  VITAMINS_MINERALS: [
    'Vitamins and essential serum minerals are within optimal physiological reference ranges.',
    '25-Hydroxy Vitamin D insufficiency/deficiency noted. Vitamin D3 supplementation and follow-up after 3 months recommended.',
    'Combined Vitamin B12 and Iron/Ferritin depletion noted. Nutritional supplementation and hematological follow-up advised.',
    'Mild hypomagnesemia / zinc deficiency observed; dietary supplementation and clinical correlation recommended.'
  ]
};

export const LAB_CATALOG: CatalogProfileTemplate[] = [
  {
    "code": "CBC",
    "titleEn": "Complete Blood Picture",
    "titleAr": "صورة الدم الكاملة (Complete Blood Picture)",
    "category": "Hematology",
    "sampleType": "EDTA Whole Blood",
    "profilePrice": 180,
    "defaultInterpretation": "Complete blood picture parameters evaluated according to international hematology consensus guidelines (ICSH / CLSI).",
    "parameters": [
      {
        "name": "Haemoglobin (EDTA Blood)",
        "unit": "g/dL",
        "minNormal": 12.5,
        "maxNormal": 16.5,
        "panicLow": 7.0,
        "panicHigh": 20.0,
        "method": "Automated SLS-Hb",
        "textReference": "12.5 - 16.5"
      },
      {
        "name": "Haematocrit (PCV)",
        "unit": "%",
        "minNormal": 37,
        "maxNormal": 49,
        "panicLow": 20.0,
        "panicHigh": 60.0,
        "notes": "Auto-calculated: Hb × 3",
        "textReference": "37 - 49"
      },
      {
        "name": "RBCs Count (EDTA Blood)",
        "unit": "Millions / cmm",
        "minNormal": 4.5,
        "maxNormal": 5.3,
        "panicLow": 2.0,
        "panicHigh": 7.0,
        "method": "Electrical Impedance",
        "textReference": "4.5 - 5.3"
      },
      {
        "name": "MCV",
        "unit": "fl",
        "minNormal": 78,
        "maxNormal": 98,
        "notes": "Auto-calculated: (PCV × 10) / RBC",
        "textReference": "78 - 98"
      },
      {
        "name": "MCH",
        "unit": "pg",
        "minNormal": 26,
        "maxNormal": 33,
        "notes": "Auto-calculated: (Hb × 10) / RBC",
        "textReference": "26 - 33"
      },
      {
        "name": "MCHC",
        "unit": "g/dL",
        "minNormal": 31,
        "maxNormal": 37,
        "notes": "Auto-calculated: (Hb × 100) / PCV",
        "textReference": "31 - 37"
      },
      {
        "name": "RDW-CV",
        "unit": "%",
        "minNormal": 11.5,
        "maxNormal": 15,
        "textReference": "11.5 - 15"
      },
      {
        "name": "Platelet Count",
        "unit": "Thousands / cmm",
        "minNormal": 150,
        "maxNormal": 450,
        "panicLow": 20.0,
        "panicHigh": 1000.0,
        "method": "Electrical Impedance",
        "textReference": "150 - 450"
      },
      {
        "name": "Total Leucocytic Count (EDTA Blood)",
        "unit": "Thousands / cmm",
        "minNormal": 4.5,
        "maxNormal": 11,
        "panicLow": 2.0,
        "panicHigh": 30.0,
        "method": "Flow Cytometry / Impedance",
        "textReference": "4.5 - 11"
      },
      {
        "name": "Neutrophils %",
        "unit": "%",
        "minNormal": 40,
        "maxNormal": 75,
        "textReference": "40 - 75"
      },
      {
        "name": "Band Cells %",
        "unit": "%",
        "minNormal": 0,
        "maxNormal": 5,
        "panicHigh": 15,
        "notes": "Immature Neutrophils (Shift to Left indicator if > 5%)",
        "textReference": "0 - 5"
      },
      {
        "name": "Lymphocytes %",
        "unit": "%",
        "minNormal": 20,
        "maxNormal": 45,
        "textReference": "20 - 45"
      },
      {
        "name": "Monocytes %",
        "unit": "%",
        "minNormal": 2,
        "maxNormal": 10,
        "textReference": "2 - 10"
      },
      {
        "name": "Eosinophils %",
        "unit": "%",
        "minNormal": 1,
        "maxNormal": 6,
        "textReference": "1 - 6"
      },
      {
        "name": "Basophils %",
        "unit": "%",
        "minNormal": 0,
        "maxNormal": 2,
        "textReference": "0 - 2"
      },
      {
        "name": "Absolute Neutrophils",
        "unit": "x10^9/L",
        "minNormal": 1.8,
        "maxNormal": 8,
        "panicLow": 0.5,
        "notes": "Auto-calculated: (WBC × Neut%) / 100",
        "textReference": "1.8 - 8"
      },
      {
        "name": "Absolute Lymphocytes",
        "unit": "x10^9/L",
        "minNormal": 1.2,
        "maxNormal": 5.2,
        "notes": "Auto-calculated: (WBC × Lymph%) / 100",
        "textReference": "1.2 - 5.2"
      },
      {
        "name": "Absolute Monocytes",
        "unit": "x10^9/L",
        "minNormal": 0.2,
        "maxNormal": 1,
        "notes": "Auto-calculated: (WBC × Mono%) / 100",
        "textReference": "0.2 - 1"
      },
      {
        "name": "Absolute Eosinophils",
        "unit": "x10^9/L",
        "minNormal": 0.1,
        "maxNormal": 0.45,
        "notes": "Auto-calculated: (WBC × Eos%) / 100",
        "textReference": "0.1 - 0.45"
      },
      {
        "name": "Absolute Basophils",
        "unit": "x10^9/L",
        "minNormal": 0,
        "maxNormal": 0.1,
        "notes": "Auto-calculated: (WBC × Baso%) / 100",
        "textReference": "0 - 0.1"
      },
      {
        "name": "Other Cells",
        "unit": "",
        "textReference": "Nil"
      }
    ]
  },
  {
    "code": "URINE",
    "titleEn": "Complete Urine Analysis",
    "titleAr": "Complete Urine Analysis",
    "category": "Clinical Microscopy",
    "sampleType": "Clean Catch Midstream Urine",
    "profilePrice": 100,
    "defaultInterpretation": "Routine urinalysis shows clear appearance with no significant cellular or crystalline elements.",
    "parameters": [
      {
        "name": "Color",
        "unit": "Physical / Visual",
        "textReference": "Amber Yellow",
        "method": "Visual Inspection"
      },
      {
        "name": "Aspect / Transparency",
        "unit": "Physical / Visual",
        "textReference": "Clear",
        "method": "Visual Inspection"
      },
      {
        "name": "Specific Gravity (Sp. Gr.)",
        "unit": "Sp.Gr. (Ratio)",
        "minNormal": 1.01,
        "maxNormal": 1.025,
        "textReference": "1.010 - 1.025",
        "method": "Refractometry"
      },
      {
        "name": "Reaction (pH)",
        "unit": "pH Units",
        "minNormal": 5,
        "maxNormal": 7.5,
        "textReference": "5.0 - 7.5",
        "method": "Dipstick"
      },
      {
        "name": "Odour",
        "unit": "Physical / Visual",
        "textReference": "Normal Aromatic"
      },
      {
        "name": "Protein (Albumin)",
        "unit": "Dipstick / Qualitative",
        "textReference": "Nil (Negative)",
        "method": "Protein Error of Indicator"
      },
      {
        "name": "Glucose (Sugar)",
        "unit": "Dipstick / Qualitative",
        "textReference": "Nil (Negative)",
        "method": "Glucose Oxidase"
      },
      {
        "name": "Ketone Bodies (Acetone)",
        "unit": "Dipstick / Qualitative",
        "textReference": "Nil (Negative)",
        "method": "Sodium Nitroprusside"
      },
      {
        "name": "Bilirubin",
        "unit": "Score / Units",
        "textReference": "Nil (Negative)"
      },
      {
        "name": "Urobilinogen",
        "unit": "mg/dL",
        "textReference": "Normal (0.2 - 1.0 mg/dL)"
      },
      {
        "name": "Nitrite",
        "unit": "Dipstick / Qualitative",
        "textReference": "Negative"
      },
      {
        "name": "Leukocyte Esterase",
        "unit": "Dipstick / Qualitative",
        "textReference": "Negative"
      },
      {
        "name": "Blood / Hemoglobin",
        "unit": "Physical / Visual",
        "textReference": "Nil (Negative)"
      },
      {
        "name": "Pus Cells (WBCs)",
        "unit": "/ HPF",
        "minNormal": 0,
        "maxNormal": 5,
        "textReference": "0 - 5 / HPF",
        "notes": "Significant pyuria if > 10 / HPF"
      },
      {
        "name": "Red Blood Cells (RBCs)",
        "unit": "/ HPF",
        "minNormal": 0,
        "maxNormal": 3,
        "textReference": "0 - 3 / HPF"
      },
      {
        "name": "Epithelial Cells",
        "unit": "/HPF",
        "textReference": "Few / Nil"
      },
      {
        "name": "Crystals",
        "unit": "/HPF",
        "textReference": "Nil seen"
      },
      {
        "name": "Casts",
        "unit": "/LPF",
        "textReference": "Nil seen"
      },
      {
        "name": "Amorphous Deposits",
        "unit": "pH Units",
        "textReference": "Nil seen"
      },
      {
        "name": "Bacteria",
        "unit": "/HPF",
        "textReference": "Nil seen"
      },
      {
        "name": "Yeast Cells (Candida)",
        "unit": "/HPF",
        "textReference": "Nil seen"
      },
      {
        "name": "Trichomonas vaginalis",
        "unit": "/HPF",
        "textReference": "Nil seen"
      },
      {
        "name": "Mucus Threads",
        "unit": "Physical / Visual",
        "textReference": "Nil seen"
      }
    ]
  },
  {
    "code": "STOOL",
    "titleEn": "Complete Stool Examination",
    "titleAr": "Complete Stool Examination",
    "category": "Clinical Parasitology",
    "sampleType": "Fresh Stool Specimen",
    "profilePrice": 100,
    "defaultInterpretation": "No pathogenic protozoa, helminthic ova, or inflammatory elements identified.",
    "parameters": [
      {
        "name": "Color",
        "unit": "Physical / Visual",
        "textReference": "Brown",
        "method": "Macroscopic Inspection"
      },
      {
        "name": "Consistency",
        "unit": "Physical / Visual",
        "textReference": "Formed / Semi-formed"
      },
      {
        "name": "Odour",
        "unit": "Physical / Visual",
        "textReference": "Faecal / Normal"
      },
      {
        "name": "Mucus",
        "unit": "Physical / Visual",
        "textReference": "Nil"
      },
      {
        "name": "Blood",
        "unit": "Physical / Visual",
        "textReference": "Nil"
      },
      {
        "name": "Occult Blood (FOBT)",
        "unit": "Physical / Visual",
        "textReference": "Negative",
        "method": "Immunochromatographic / Guaiac"
      },
      {
        "name": "pH",
        "unit": "pH Units",
        "minNormal": 6.5,
        "maxNormal": 7.5,
        "textReference": "6.5 - 7.5"
      },
      {
        "name": "Reducing Substances",
        "unit": "Dipstick / Qualitative",
        "textReference": "Nil"
      },
      {
        "name": "Pus Cells (WBCs)",
        "unit": "/ HPF",
        "minNormal": 0,
        "maxNormal": 4,
        "textReference": "0 - 4 / HPF"
      },
      {
        "name": "R.B.Cs",
        "unit": "/ HPF",
        "minNormal": 0,
        "maxNormal": 2,
        "textReference": "0 - 2 / HPF"
      },
      {
        "name": "Protozoa & Cysts",
        "unit": "Microscopic Wet Mount",
        "textReference": "No protozoa or cysts seen"
      },
      {
        "name": "Helminthes & Ova",
        "unit": "Microscopic Wet Mount",
        "textReference": "No parasitic ova detected"
      },
      {
        "name": "Undigested Food / Muscle Fibres",
        "unit": "/HPF",
        "textReference": "Nil to Few"
      },
      {
        "name": "Fat Globules",
        "unit": "/HPF",
        "textReference": "Nil to Few"
      },
      {
        "name": "Starch Granules",
        "unit": "/HPF",
        "textReference": "Nil to Few"
      },
      {
        "name": "Vegetable Cells",
        "unit": "/HPF",
        "textReference": "Few"
      },
      {
        "name": "Yeast Cells",
        "unit": "/HPF",
        "textReference": "Nil seen"
      }
    ]
  },
  {
    "code": "SEMEN",
    "titleEn": "Semen Analysis (WHO Criteria)",
    "titleAr": "Semen Analysis (WHO Criteria)",
    "category": "Andrology",
    "sampleType": "Complete Semen Ejaculate",
    "profilePrice": 220,
    "defaultInterpretation": "Sperm parameters conform to WHO 5th/6th Reference Limits (Normozoospermia).",
    "parameters": [
      {
        "name": "Abstinence Period",
        "unit": "Days",
        "minNormal": 2,
        "maxNormal": 7,
        "textReference": "2 - 7 Days"
      },
      {
        "name": "Collection Method",
        "unit": "Clinical Protocol",
        "textReference": "Masturbation (In-Lab)"
      },
      {
        "name": "Volume",
        "unit": "mL",
        "minNormal": 1.5,
        "maxNormal": 5,
        "textReference": "≥ 1.5 mL"
      },
      {
        "name": "Liquefaction Time",
        "unit": "Minutes",
        "minNormal": 15,
        "maxNormal": 60,
        "textReference": "< 60 Minutes (Normal ~ 20 min)"
      },
      {
        "name": "Viscosity",
        "unit": "Physical / Visual",
        "textReference": "Normal"
      },
      {
        "name": "Appearance / Color",
        "unit": "Physical / Visual",
        "textReference": "Greyish-white / Opalescent"
      },
      {
        "name": "pH",
        "unit": "pH Units",
        "minNormal": 7.2,
        "maxNormal": 8,
        "textReference": "≥ 7.2"
      },
      {
        "name": "Sperm Concentration",
        "unit": "x10^6/mL",
        "minNormal": 15,
        "maxNormal": 200,
        "textReference": "≥ 15.0 x 10^6 / mL"
      },
      {
        "name": "Total Sperm Count",
        "unit": "x10^6/ejaculate",
        "minNormal": 39,
        "maxNormal": 600,
        "textReference": "≥ 39.0 x 10^6 / ejaculate",
        "notes": "Auto-calculated: Conc × Volume"
      },
      {
        "name": "Total Motility (PR + NP)",
        "unit": "%",
        "minNormal": 40,
        "maxNormal": 100,
        "textReference": "≥ 40%"
      },
      {
        "name": "Progressive Motility (PR)",
        "unit": "%",
        "minNormal": 32,
        "maxNormal": 100,
        "textReference": "≥ 32% (Grade A + B)"
      },
      {
        "name": "Non-Progressive Motility (NP)",
        "unit": "%",
        "textReference": "Grade C"
      },
      {
        "name": "Immotile Sperm (IM)",
        "unit": "%",
        "textReference": "Grade D"
      },
      {
        "name": "Normal Forms (Morphology)",
        "unit": "%",
        "minNormal": 4,
        "maxNormal": 100,
        "textReference": "≥ 4.0% (WHO Strict Criteria)"
      },
      {
        "name": "Abnormal Forms",
        "unit": "%",
        "textReference": "< 96%"
      },
      {
        "name": "Head Defects",
        "unit": "%",
        "textReference": "Reported %"
      },
      {
        "name": "Midpiece & Tail Defects",
        "unit": "%",
        "textReference": "Reported %"
      },
      {
        "name": "Viability / Vitality",
        "unit": "%",
        "minNormal": 58,
        "maxNormal": 100,
        "textReference": "≥ 58% live"
      },
      {
        "name": "Round Cells / Leucocytes",
        "unit": "x10^6/mL",
        "minNormal": 0,
        "maxNormal": 1,
        "textReference": "< 1.0 x 10^6 / mL"
      },
      {
        "name": "Sperm Agglutination",
        "unit": "Score / Units",
        "textReference": "Nil"
      }
    ]
  },
  {
    "code": "CULTURE",
    "titleEn": "Culture & Antimicrobial Susceptibility (C&S)",
    "titleAr": "Culture & Antimicrobial Susceptibility (C&S)",
    "category": "Microbiology",
    "sampleType": "Clinical Specimen (Urine/Blood/Wound/Swab)",
    "profilePrice": 250,
    "defaultInterpretation": "Significant bacterial pathogen isolated. Antimicrobial susceptibility profile detailed below.",
    "parameters": [
      {
        "name": "Specimen Type",
        "unit": "Clinical Protocol",
        "textReference": "Urine / Swab / Blood"
      },
      {
        "name": "Gram Stain Examination",
        "unit": "Clinical Protocol",
        "textReference": "Direct Smear"
      },
      {
        "name": "Colony Count",
        "unit": "CFU/mL",
        "textReference": "> 100,000 CFU/mL (Significant)"
      },
      {
        "name": "Isolated Pathogen",
        "unit": "Clinical Protocol",
        "textReference": "Escherichia coli (E. coli)"
      },
      {
        "name": "Amoxicillin / Clavulanate (Augmentin)",
        "unit": "Susceptibility (MIC / Disc)",
        "textReference": "Sensitive / Resistant"
      },
      {
        "name": "Piperacillin / Tazobactam (Tazocin)",
        "unit": "Susceptibility (MIC / Disc)",
        "textReference": "Sensitive / Resistant"
      },
      {
        "name": "Cefuroxime (Zinnat)",
        "unit": "Susceptibility (MIC / Disc)",
        "textReference": "Sensitive / Resistant"
      },
      {
        "name": "Ceftriaxone (Rocephin)",
        "unit": "pH Units",
        "textReference": "Sensitive / Resistant"
      },
      {
        "name": "Ceftazidime (Fortum)",
        "unit": "Susceptibility (MIC / Disc)",
        "textReference": "Sensitive / Resistant"
      },
      {
        "name": "Cefepime (Maxipime)",
        "unit": "Susceptibility (MIC / Disc)",
        "textReference": "Sensitive / Resistant"
      },
      {
        "name": "Meropenem (Meronem)",
        "unit": "Susceptibility (MIC / Disc)",
        "textReference": "Sensitive / Resistant"
      },
      {
        "name": "Imipenem (Tienam)",
        "unit": "Susceptibility (MIC / Disc)",
        "textReference": "Sensitive / Resistant"
      },
      {
        "name": "Amikacin (Amikin)",
        "unit": "Susceptibility (MIC / Disc)",
        "textReference": "Sensitive / Resistant"
      },
      {
        "name": "Gentamicin (Garamycin)",
        "unit": "Susceptibility (MIC / Disc)",
        "textReference": "Sensitive / Resistant"
      },
      {
        "name": "Ciprofloxacin (Cipro)",
        "unit": "Susceptibility (MIC / Disc)",
        "textReference": "Sensitive / Resistant"
      },
      {
        "name": "Levofloxacin (Tavanic)",
        "unit": "Susceptibility (MIC / Disc)",
        "textReference": "Sensitive / Resistant"
      },
      {
        "name": "Nitrofurantoin (Macrodantin)",
        "unit": "Susceptibility (MIC / Disc)",
        "textReference": "Sensitive / Resistant"
      },
      {
        "name": "Fosfomycin (Monuril)",
        "unit": "Susceptibility (MIC / Disc)",
        "textReference": "Sensitive / Resistant"
      },
      {
        "name": "Trimethoprim / Sulfamethoxazole",
        "unit": "Susceptibility (MIC / Disc)",
        "textReference": "Sensitive / Resistant"
      },
      {
        "name": "Vancomycin (for Gram +ve)",
        "unit": "Susceptibility (MIC / Disc)",
        "textReference": "Sensitive / Resistant"
      },
      {
        "name": "Colistin (Colimycin)",
        "unit": "Susceptibility (MIC / Disc)",
        "textReference": "Sensitive / Resistant"
      }
    ]
  },
  {
    "code": "HOMA",
    "titleEn": "Insulin Resistance & Beta-Cell Function (HOMA)",
    "titleAr": "Insulin Resistance & Beta-Cell Function (HOMA)",
    "category": "Endocrinology",
    "sampleType": "Serum & Fluoride Plasma (10-12h Fasting)",
    "profilePrice": 330,
    "defaultInterpretation": "HOMA-IR calculated based on fasting glucose and insulin levels.",
    "parameters": [
      {
        "name": "Fasting Blood Glucose",
        "unit": "mg/dL",
        "minNormal": 70,
        "maxNormal": 99,
        "panicLow": 50,
        "panicHigh": 400,
        "method": "Hexokinase / GOD-PAP",
        "textReference": ""
      },
      {
        "name": "Fasting Serum Insulin",
        "unit": "µIU/mL",
        "minNormal": 2.6,
        "maxNormal": 24.9,
        "method": "Chemiluminescence (CLIA)",
        "textReference": ""
      },
      {
        "name": "HOMA-IR Index",
        "unit": "Index",
        "minNormal": 0.5,
        "maxNormal": 1.9,
        "textReference": "< 1.9 Normal, 1.9 - 2.9 Borderline, > 2.9 High Resistance",
        "notes": "Auto-calculated: (Glucose × Insulin) / 405"
      },
      {
        "name": "HOMA-B (Beta Cell Function)",
        "unit": "%",
        "minNormal": 70,
        "maxNormal": 150,
        "textReference": "70 - 150 % (~100%)",
        "notes": "Auto-calculated: (20 × Insulin) / (Glucose - 63)"
      },
      {
        "name": "QUICKI Index",
        "unit": "Index",
        "minNormal": 0.382,
        "maxNormal": 0.5,
        "textReference": "> 0.382 Normal Sensitivity",
        "notes": "Auto-calculated: 1 / [log(G) + log(I)]"
      },
      {
        "name": "C-Peptide Fasting",
        "unit": "ng/mL",
        "minNormal": 1.1,
        "maxNormal": 4.4,
        "textReference": ""
      }
    ]
  },
  {
    "code": "GLYCEMIC",
    "titleEn": "Diabetes & Glycemic Assessment (HbA1c & eAG)",
    "titleAr": "Diabetes & Glycemic Assessment (HbA1c & eAG)",
    "category": "Clinical Chemistry",
    "sampleType": "Fluoride Plasma & EDTA Blood",
    "profilePrice": 220,
    "defaultInterpretation": "Glycemic parameters evaluated according to ADA guidelines.",
    "parameters": [
      {
        "name": "Fasting Blood Glucose",
        "unit": "mg/dL",
        "minNormal": 70,
        "maxNormal": 99,
        "panicLow": 50,
        "panicHigh": 400,
        "method": "Hexokinase",
        "textReference": ""
      },
      {
        "name": "2 Hours Post-Prandial Glucose",
        "unit": "mg/dL",
        "minNormal": 70,
        "maxNormal": 140,
        "panicHigh": 450,
        "method": "Hexokinase",
        "textReference": ""
      },
      {
        "name": "Random Blood Glucose",
        "unit": "mg/dL",
        "minNormal": 70,
        "maxNormal": 140,
        "textReference": ""
      },
      {
        "name": "HbA1c (Glycated Hemoglobin)",
        "unit": "%",
        "minNormal": 4,
        "maxNormal": 5.6,
        "textReference": "< 5.7% Normal, 5.7 - 6.4% Pre-Diabetes, ≥ 6.5% Diabetes",
        "method": "HPLC / Turbidimetric"
      },
      {
        "name": "Estimated Average Glucose (eAG)",
        "unit": "mg/dL",
        "minNormal": 68,
        "maxNormal": 114,
        "textReference": "80 - 120 mg/dL",
        "notes": "Auto-calculated: (28.7 × HbA1c) - 46.7"
      }
    ]
  },
  OGTT_CATALOG_TEMPLATE,
  {
    "code": "ACR",
    "titleEn": "Urine Albumin / Creatinine Ratio (ACR)",
    "titleAr": "Urine Albumin / Creatinine Ratio (ACR)",
    "category": "Clinical Chemistry",
    "sampleType": "First Morning Urine Spot Specimen",
    "profilePrice": 180,
    "defaultInterpretation": "ACR provides sensitive early detection of diabetic and hypertensive microalbuminuria.",
    "parameters": [
      {
        "name": "Urine Microalbumin",
        "unit": "mg/L",
        "minNormal": 0,
        "maxNormal": 20,
        "method": "Immunoturbidimetry",
        "textReference": ""
      },
      {
        "name": "Urine Creatinine",
        "unit": "mg/dL",
        "minNormal": 20,
        "maxNormal": 300,
        "method": "Enzymatic / Jaffe",
        "textReference": ""
      },
      {
        "name": "Albumin/Creatinine Ratio (ACR)",
        "unit": "mg/g",
        "minNormal": 0,
        "maxNormal": 30,
        "textReference": "< 30 Normal, 30 - 300 Microalbuminuria, > 300 Macroalbuminuria",
        "notes": "Auto-calculated: (Microalbumin / Urine Creatinine) × 100"
      },
      {
        "name": "Total Urine Protein",
        "unit": "mg/dL",
        "minNormal": 0,
        "maxNormal": 15,
        "textReference": ""
      },
      {
        "name": "Protein/Creatinine Ratio (UPCR)",
        "unit": "mg/mg",
        "minNormal": 0,
        "maxNormal": 0.2,
        "textReference": "< 0.2 mg/mg"
      }
    ]
  },
  {
    "code": "CALCIUM_ELEC",
    "titleEn": "Electrolytes & Corrected Calcium (CA-I)",
    "titleAr": "الأملاح والمعادن والكالسيوم المتأين والكلي",
    "category": "Clinical Chemistry",
    "sampleType": "Serum",
    "profilePrice": 280,
    "defaultInterpretation": "Electrolyte balance and serum calcium status evaluated.",
    "parameters": [
      {
        "name": "Total Serum Calcium",
        "unit": "mg/dL",
        "minNormal": 8.5,
        "maxNormal": 10.5,
        "panicLow": 6.5,
        "panicHigh": 13,
        "method": "Arsenazo III",
        "textReference": ""
      },
      {
        "name": "Serum Albumin",
        "unit": "g/dL",
        "minNormal": 3.5,
        "maxNormal": 5.2,
        "textReference": ""
      },
      {
        "name": "Corrected Calcium (CA-I)",
        "unit": "mg/dL",
        "minNormal": 8.5,
        "maxNormal": 10.5,
        "textReference": "8.5 - 10.5 mg/dL",
        "notes": "Auto-calculated: Total Ca + 0.8 × (4.0 - Albumin)"
      },
      {
        "name": "Ionized Calcium",
        "unit": "mmol/L",
        "minNormal": 1.15,
        "maxNormal": 1.33,
        "textReference": ""
      },
      {
        "name": "Serum Inorganic Phosphorus",
        "unit": "mg/dL",
        "minNormal": 2.5,
        "maxNormal": 4.5,
        "textReference": ""
      },
      {
        "name": "Serum Magnesium",
        "unit": "mg/dL",
        "minNormal": 1.7,
        "maxNormal": 2.6,
        "textReference": ""
      },
      {
        "name": "Serum Sodium (Na+)",
        "unit": "mmol/L",
        "minNormal": 135,
        "maxNormal": 145,
        "panicLow": 120,
        "panicHigh": 160,
        "method": "ISE Direct",
        "textReference": ""
      },
      {
        "name": "Serum Potassium (K+)",
        "unit": "mmol/L",
        "minNormal": 3.5,
        "maxNormal": 5.1,
        "panicLow": 2.8,
        "panicHigh": 6.5,
        "method": "ISE Direct",
        "textReference": ""
      },
      {
        "name": "Serum Chloride (Cl-)",
        "unit": "mmol/L",
        "minNormal": 98,
        "maxNormal": 107,
        "textReference": ""
      }
    ]
  },
  {
    "code": "LIPID",
    "titleEn": "Lipid Profile",
    "titleAr": "Lipid Profile",
    "category": "Clinical Chemistry",
    "sampleType": "Serum (12h Fasting)",
    "profilePrice": 220,
    "defaultInterpretation": "Lipid ratios demonstrate favorable cardiovascular risk stratification.",
    "parameters": [
      {
        "name": "Total Serum Cholesterol",
        "unit": "mg/dL",
        "minNormal": 120,
        "maxNormal": 200,
        "method": "CHOD-PAP",
        "textReference": ""
      },
      {
        "name": "Serum Triglycerides",
        "unit": "mg/dL",
        "minNormal": 40,
        "maxNormal": 150,
        "panicHigh": 500,
        "method": "GPO-PAP",
        "textReference": ""
      },
      {
        "name": "HDL - Cholesterol (Good)",
        "unit": "mg/dL",
        "minNormal": 40,
        "maxNormal": 65,
        "method": "Direct Accelerator",
        "textReference": ""
      },
      {
        "name": "LDL - Cholesterol (Calculated)",
        "unit": "mg/dL",
        "minNormal": 0,
        "maxNormal": 100,
        "notes": "Friedewald Formula: Total Chol - HDL - (TG / 5)",
        "textReference": ""
      },
      {
        "name": "VLDL - Cholesterol",
        "unit": "mg/dL",
        "minNormal": 5,
        "maxNormal": 30,
        "notes": "Auto-calculated: Triglycerides / 5",
        "textReference": ""
      },
      {
        "name": "Non-HDL Cholesterol",
        "unit": "mg/dL",
        "minNormal": 0,
        "maxNormal": 130,
        "notes": "Auto-calculated: Total Chol - HDL",
        "textReference": ""
      },
      {
        "name": "Total Chol / HDL Ratio",
        "unit": "Ratio",
        "minNormal": 0,
        "maxNormal": 4.5,
        "textReference": "< 4.5 Desirable",
        "notes": "Auto-calculated: Total Chol / HDL"
      },
      {
        "name": "LDL / HDL Ratio",
        "unit": "Ratio",
        "minNormal": 0,
        "maxNormal": 3,
        "textReference": "< 3.0 Desirable"
      }
    ]
  },
  {
    "code": "LFT",
    "titleEn": "Liver Function Tests (LFT)",
    "titleAr": "وظائف الكبد الشاملة (LFT)",
    "category": "Clinical Chemistry",
    "sampleType": "Serum",
    "profilePrice": 250,
    "defaultInterpretation": "Enzyme activities and synthetic hepatic markers are within normal limits.",
    "parameters": [
      {
        "name": "ALT (SGPT)",
        "unit": "U/L",
        "minNormal": 0,
        "maxNormal": 45,
        "method": "IFCC UV with P5P",
        "textReference": ""
      },
      {
        "name": "AST (SGOT)",
        "unit": "U/L",
        "minNormal": 0,
        "maxNormal": 40,
        "method": "IFCC UV with P5P",
        "textReference": ""
      },
      {
        "name": "Alkaline Phosphatase (ALP)",
        "unit": "U/L",
        "minNormal": 40,
        "maxNormal": 130,
        "textReference": ""
      },
      {
        "name": "Total Bilirubin",
        "unit": "mg/dL",
        "minNormal": 0.2,
        "maxNormal": 1.2,
        "panicHigh": 5,
        "method": "Jendrassik-Grof",
        "textReference": ""
      },
      {
        "name": "Direct Bilirubin",
        "unit": "mg/dL",
        "minNormal": 0,
        "maxNormal": 0.3,
        "textReference": ""
      },
      {
        "name": "Indirect Bilirubin",
        "unit": "mg/dL",
        "minNormal": 0.1,
        "maxNormal": 0.9,
        "notes": "Auto-calculated: Total - Direct",
        "textReference": ""
      },
      {
        "name": "Total Serum Proteins",
        "unit": "g/dL",
        "minNormal": 6.4,
        "maxNormal": 8.3,
        "method": "Biuret",
        "textReference": ""
      },
      {
        "name": "Serum Albumin",
        "unit": "g/dL",
        "minNormal": 3.5,
        "maxNormal": 5.2,
        "method": "Bromocresol Green (BCG)",
        "textReference": ""
      },
      {
        "name": "Serum Globulin",
        "unit": "g/dL",
        "minNormal": 2.3,
        "maxNormal": 3.5,
        "notes": "Auto-calculated: Total Protein - Albumin",
        "textReference": ""
      },
      {
        "name": "A/G Ratio",
        "unit": "Ratio",
        "minNormal": 1.2,
        "maxNormal": 2.2,
        "notes": "Auto-calculated: Albumin / Globulin",
        "textReference": ""
      },
      {
        "name": "G.G.T",
        "unit": "U/L",
        "minNormal": 9,
        "maxNormal": 48,
        "textReference": ""
      },
      {
        "name": "AST/ALT Ratio (De Ritis)",
        "unit": "Ratio",
        "minNormal": 0.6,
        "maxNormal": 1.1,
        "notes": "Auto-calculated: AST / ALT",
        "textReference": ""
      }
    ]
  },
  {
    "code": "KFT",
    "titleEn": "Kidney Function Profile",
    "titleAr": "وظائف الكلى الشاملة (KFT)",
    "category": "Clinical Chemistry",
    "sampleType": "Serum",
    "profilePrice": 200,
    "defaultInterpretation": "Renal biomarkers indicate adequate glomerular filtration and nitrogenous clearance.",
    "parameters": [
      {
        "name": "Serum Creatinine",
        "unit": "mg/dL",
        "minNormal": 0.6,
        "maxNormal": 1.2,
        "panicHigh": 4,
        "method": "Enzymatic / Jaffe Kinetic",
        "textReference": ""
      },
      {
        "name": "Blood Urea",
        "unit": "mg/dL",
        "minNormal": 15,
        "maxNormal": 45,
        "panicHigh": 120,
        "method": "Urease-GLDH",
        "textReference": ""
      },
      {
        "name": "Blood Urea Nitrogen (BUN)",
        "unit": "mg/dL",
        "minNormal": 7,
        "maxNormal": 20,
        "textReference": ""
      },
      {
        "name": "BUN / Creatinine Ratio",
        "unit": "Ratio",
        "minNormal": 10,
        "maxNormal": 20,
        "notes": "Auto-calculated: BUN / Creatinine",
        "textReference": ""
      },
      {
        "name": "Serum Uric Acid",
        "unit": "mg/dL",
        "minNormal": 3.5,
        "maxNormal": 7.2,
        "method": "Uricase-PAP",
        "textReference": ""
      },
      {
        "name": "eGFR (CKD-EPI)",
        "unit": "mL/min/1.73m²",
        "minNormal": 90,
        "maxNormal": 120,
        "notes": "Auto-calculated: CKD-EPI Formula",
        "textReference": ""
      }
    ]
  },
  {
    "code": "CARDIAC",
    "titleEn": "Cardiac Biomarkers Panel",
    "titleAr": "Cardiac Biomarkers Panel",
    "category": "Cardiac & Emergency",
    "sampleType": "Serum or Heparin Plasma",
    "profilePrice": 550,
    "defaultInterpretation": "High-sensitivity myocardial necrosis markers within baseline reference thresholds.",
    "parameters": [
      {
        "name": "Troponin I High Sensitivity (hs-cTnI)",
        "unit": "ng/L",
        "minNormal": 0,
        "maxNormal": 14,
        "panicHigh": 50,
        "textReference": "< 14.0 ng/L",
        "method": "CLIA High Sensitivity"
      },
      {
        "name": "Troponin T (hs-cTnT)",
        "unit": "ng/L",
        "minNormal": 0,
        "maxNormal": 14,
        "panicHigh": 50,
        "textReference": "< 14.0 ng/L"
      },
      {
        "name": "CK-MB (Mass)",
        "unit": "ng/mL",
        "minNormal": 0,
        "maxNormal": 5,
        "panicHigh": 25,
        "textReference": ""
      },
      {
        "name": "Total CPK (Creatine Kinase)",
        "unit": "U/L",
        "minNormal": 24,
        "maxNormal": 195,
        "textReference": ""
      },
      {
        "name": "Myoglobin",
        "unit": "ng/mL",
        "minNormal": 0,
        "maxNormal": 70,
        "textReference": ""
      },
      {
        "name": "NT-proBNP",
        "unit": "pg/mL",
        "minNormal": 0,
        "maxNormal": 125,
        "textReference": "< 125 pg/mL (< 75 yrs)"
      },
      {
        "name": "Lactate Dehydrogenase (LDH)",
        "unit": "U/L",
        "minNormal": 125,
        "maxNormal": 220,
        "textReference": ""
      },
      {
        "name": "hs-CRP (Cardiac Risk)",
        "unit": "mg/L",
        "minNormal": 0,
        "maxNormal": 1,
        "textReference": "< 1.0 Low Risk, 1-3 Average, > 3 High"
      }
    ]
  },
  {
    "code": "THYROID",
    "titleEn": "Thyroid Function Full Panel",
    "titleAr": "وظائف الغدة الدرقية الكاملة (TSH, FT3, FT4)",
    "category": "Endocrinology",
    "sampleType": "Serum",
    "profilePrice": 300,
    "defaultInterpretation": "Euthyroid state: TSH, Free T3, and Free T4 are within euthyroid reference ranges.",
    "parameters": [
      {
        "name": "TSH (Thyroid Stimulating Hormone)",
        "unit": "µIU/mL",
        "minNormal": 0.27,
        "maxNormal": 4.2,
        "panicLow": 0.05,
        "panicHigh": 20,
        "method": "Chemiluminescence (CLIA 3rd Gen)",
        "textReference": ""
      },
      {
        "name": "Free T3 (FT3)",
        "unit": "pg/mL",
        "minNormal": 2,
        "maxNormal": 4.4,
        "method": "CLIA",
        "textReference": ""
      },
      {
        "name": "Free T4 (FT4)",
        "unit": "ng/dL",
        "minNormal": 0.93,
        "maxNormal": 1.7,
        "method": "CLIA",
        "textReference": ""
      },
      {
        "name": "Total Triiodothyronine (TT3)",
        "unit": "ng/mL",
        "minNormal": 0.8,
        "maxNormal": 2,
        "textReference": ""
      },
      {
        "name": "Total Thyroxine (TT4)",
        "unit": "µg/dL",
        "minNormal": 5.1,
        "maxNormal": 14.1,
        "textReference": ""
      },
      {
        "name": "Anti-TPO (Thyroid Peroxidase Ab)",
        "unit": "IU/mL",
        "minNormal": 0,
        "maxNormal": 34,
        "textReference": "< 34.0 IU/mL"
      },
      {
        "name": "Anti-Thyroglobulin (Anti-TG)",
        "unit": "IU/mL",
        "minNormal": 0,
        "maxNormal": 115,
        "textReference": "< 115.0 IU/mL"
      }
    ]
  },
  {
    "code": "COAG",
    "titleEn": "Coagulation & Hemostasis Profile",
    "titleAr": "Coagulation & Hemostasis Profile",
    "category": "Hematology & Hemostasis",
    "sampleType": "Sodium Citrate Plasma (9:1 ratio)",
    "profilePrice": 180,
    "defaultInterpretation": "Hemostatic integrity confirmed; extrinsic and intrinsic pathways within normal reference limits.",
    "parameters": [
      {
        "name": "Prothrombin Time (PT)",
        "unit": "Seconds",
        "minNormal": 11,
        "maxNormal": 13.5,
        "method": "Optical Coagulometer",
        "textReference": ""
      },
      {
        "name": "Prothrombin Activity / Conc.",
        "unit": "%",
        "minNormal": 70,
        "maxNormal": 120,
        "textReference": ""
      },
      {
        "name": "INR (International Normalized Ratio)",
        "unit": "Ratio",
        "minNormal": 0.85,
        "maxNormal": 1.15,
        "textReference": "0.85 - 1.15 (Warfarin Target: 2.0 - 3.0)",
        "panicHigh": 4.5
      },
      {
        "name": "PTT / APTT",
        "unit": "Seconds",
        "minNormal": 26,
        "maxNormal": 36,
        "panicHigh": 70,
        "textReference": ""
      },
      {
        "name": "Fibrinogen",
        "unit": "mg/dL",
        "minNormal": 200,
        "maxNormal": 400,
        "textReference": ""
      },
      {
        "name": "D-Dimer (Quantitative)",
        "unit": "ng/mL FEU",
        "minNormal": 0,
        "maxNormal": 500,
        "textReference": "< 500 ng/mL FEU",
        "method": "Immunoturbidimetry"
      }
    ]
  },
  {
    "code": "IRON",
    "titleEn": "Iron Kinetics & Storage Profile",
    "titleAr": "Iron Kinetics & Storage Profile",
    "category": "Clinical Chemistry",
    "sampleType": "Serum (Morning Fasting)",
    "profilePrice": 420,
    "defaultInterpretation": "Iron indices and ferritin stores indicate adequate physiological iron reserves.",
    "parameters": [
      {
        "name": "Serum Iron",
        "unit": "µg/dL",
        "minNormal": 60,
        "maxNormal": 170,
        "method": "Ferene / Colorimetric",
        "textReference": ""
      },
      {
        "name": "Total Iron Binding Capacity (TIBC)",
        "unit": "µg/dL",
        "minNormal": 250,
        "maxNormal": 450,
        "textReference": ""
      },
      {
        "name": "Unsaturated Iron Binding (UIBC)",
        "unit": "µg/dL",
        "minNormal": 150,
        "maxNormal": 300,
        "notes": "Auto-calculated: TIBC - Serum Iron",
        "textReference": ""
      },
      {
        "name": "Transferrin Saturation (TSAT)",
        "unit": "%",
        "minNormal": 20,
        "maxNormal": 50,
        "textReference": "20 - 50 %",
        "notes": "Auto-calculated: (Iron / TIBC) × 100%"
      },
      {
        "name": "Serum Ferritin",
        "unit": "ng/mL",
        "minNormal": 30,
        "maxNormal": 400,
        "panicLow": 10,
        "method": "CLIA / Immunoturbidimetry",
        "textReference": ""
      }
    ]
  },
  {
    "code": "FERTILITY",
    "titleEn": "Fertility & Reproductive Hormones",
    "titleAr": "هرمونات الخصوبة والغدد التناسلية",
    "category": "Endocrinology",
    "sampleType": "Serum",
    "profilePrice": 650,
    "defaultInterpretation": "Pituitary-gonadal endocrine markers documented for clinical correlation.",
    "parameters": [
      {
        "name": "FSH (Follicle Stimulating Hormone)",
        "unit": "mIU/mL",
        "minNormal": 1.5,
        "maxNormal": 12.4,
        "method": "CLIA",
        "textReference": ""
      },
      {
        "name": "LH (Luteinizing Hormone)",
        "unit": "mIU/mL",
        "minNormal": 1.7,
        "maxNormal": 12.6,
        "method": "CLIA",
        "textReference": ""
      },
      {
        "name": "Prolactin",
        "unit": "ng/mL",
        "minNormal": 4.8,
        "maxNormal": 23.3,
        "method": "CLIA",
        "textReference": ""
      },
      {
        "name": "Estradiol (E2)",
        "unit": "pg/mL",
        "minNormal": 20,
        "maxNormal": 350,
        "textReference": ""
      },
      {
        "name": "Progesterone",
        "unit": "ng/mL",
        "minNormal": 0.2,
        "maxNormal": 25,
        "textReference": ""
      },
      {
        "name": "Total Testosterone",
        "unit": "ng/dL",
        "minNormal": 280,
        "maxNormal": 800,
        "method": "CLIA",
        "textReference": ""
      },
      {
        "name": "Free Testosterone",
        "unit": "pg/mL",
        "minNormal": 4.5,
        "maxNormal": 32,
        "textReference": ""
      },
      {
        "name": "Anti-Mullerian Hormone (AMH)",
        "unit": "ng/mL",
        "minNormal": 1,
        "maxNormal": 3.5,
        "textReference": "1.0 - 3.5 ng/mL (Normal Ovarian Reserve)"
      },
      {
        "name": "Beta-hCG (Total Quantitative)",
        "unit": "mIU/mL",
        "minNormal": 0,
        "maxNormal": 5,
        "textReference": "< 5.0 Non-Pregnant"
      }
    ]
  },
  {
    "code": "TUMOR",
    "titleEn": "Tumor Markers Panel",
    "titleAr": "دلالات الأورام الشاملة",
    "category": "Oncology & Immunodiagnostics",
    "sampleType": "Serum",
    "profilePrice": 950,
    "defaultInterpretation": "Tumor biomarker concentrations within baseline non-malignant limits.",
    "parameters": [
      {
        "name": "PSA Total (Prostate)",
        "unit": "ng/mL",
        "minNormal": 0,
        "maxNormal": 4,
        "panicHigh": 10,
        "textReference": "< 4.0 ng/mL",
        "method": "CLIA"
      },
      {
        "name": "PSA Free",
        "unit": "ng/mL",
        "minNormal": 0,
        "maxNormal": 0.93,
        "textReference": ""
      },
      {
        "name": "Free / Total PSA Ratio",
        "unit": "%",
        "minNormal": 25,
        "maxNormal": 100,
        "textReference": "> 25% Low Malignancy Probability"
      },
      {
        "name": "C.E.A (Carcinoembryonic Antigen)",
        "unit": "ng/mL",
        "minNormal": 0,
        "maxNormal": 3,
        "textReference": "< 3.0 Non-smoker (< 5.0 Smoker)"
      },
      {
        "name": "Alpha-Fetoprotein (AFP)",
        "unit": "IU/mL",
        "minNormal": 0,
        "maxNormal": 5.8,
        "textReference": "< 5.8 IU/mL"
      },
      {
        "name": "CA 19-9 (GI / Pancreas)",
        "unit": "U/mL",
        "minNormal": 0,
        "maxNormal": 37,
        "textReference": "< 37.0 U/mL"
      },
      {
        "name": "CA 125 (Ovarian)",
        "unit": "U/mL",
        "minNormal": 0,
        "maxNormal": 35,
        "textReference": "< 35.0 U/mL"
      },
      {
        "name": "CA 15-3 (Breast)",
        "unit": "U/mL",
        "minNormal": 0,
        "maxNormal": 30,
        "textReference": "< 30.0 U/mL"
      }
    ]
  },
  {
    "code": "AUTOIMMUNE",
    "titleEn": "Rheumatology & Autoimmune Markers",
    "titleAr": "Rheumatology & Autoimmune Markers",
    "category": "Immunology",
    "sampleType": "Serum & Citrate Blood",
    "profilePrice": 850,
    "defaultInterpretation": "Inflammatory and rheumatological serological markers assessed.",
    "parameters": [
      {
        "name": "ESR (1st Hour)",
        "unit": "mm/1st hr",
        "minNormal": 0,
        "maxNormal": 15,
        "method": "Westergren Method",
        "textReference": ""
      },
      {
        "name": "ESR (2nd Hour)",
        "unit": "mm/2nd hr",
        "minNormal": 0,
        "maxNormal": 30,
        "textReference": ""
      },
      {
        "name": "CRP (C-Reactive Protein Quantitative)",
        "unit": "mg/L",
        "minNormal": 0,
        "maxNormal": 6,
        "textReference": "< 6.0 mg/L",
        "method": "Immunoturbidimetry"
      },
      {
        "name": "Rheumatoid Factor (RF Quantitative)",
        "unit": "IU/mL",
        "minNormal": 0,
        "maxNormal": 14,
        "textReference": "< 14.0 IU/mL"
      },
      {
        "name": "Anti-CCP (Anti-Cyclic Citrullinated)",
        "unit": "U/mL",
        "minNormal": 0,
        "maxNormal": 17,
        "textReference": "< 17.0 U/mL"
      },
      {
        "name": "ANA (Antinuclear Antibodies Titer)",
        "unit": "Titre",
        "textReference": "Negative (< 1:80)",
        "method": "Indirect Immunofluorescence (IIF)"
      },
      {
        "name": "Anti-dsDNA (Quantitative)",
        "unit": "IU/mL",
        "minNormal": 0,
        "maxNormal": 25,
        "textReference": "< 25.0 IU/mL"
      },
      {
        "name": "ASOT (Anti-Streptolysin O Titer)",
        "unit": "IU/mL",
        "minNormal": 0,
        "maxNormal": 200,
        "textReference": "< 200 IU/mL"
      }
    ]
  },
  {
    "code": "VIRAL",
    "titleEn": "Viral Hepatitis & Infectious Serology",
    "titleAr": "الفيروسات الكبدية والمعدية (HBsAg, HCV, HIV)",
    "category": "Virology & Serology",
    "sampleType": "Serum",
    "profilePrice": 480,
    "defaultInterpretation": "Specific antibody / antigen screening test results.",
    "parameters": [
      {
        "name": "HBsAg (Hepatitis B Surface Antigen)",
        "unit": "Index (S/CO)",
        "textReference": "Non-Reactive (Negative)",
        "method": "CLIA / ECLIA"
      },
      {
        "name": "HCV Ab (Hepatitis C Virus Antibody)",
        "unit": "Index (S/CO)",
        "textReference": "Non-Reactive (Negative)",
        "method": "CLIA / ECLIA"
      },
      {
        "name": "HIV 1/2 Ab & p24 Ag (4th Gen Duo)",
        "unit": "Index (S/CO)",
        "textReference": "Non-Reactive (Negative)",
        "method": "CLIA 4th Generation"
      },
      {
        "name": "HAV IgM (Hepatitis A)",
        "unit": "Index (S/CO)",
        "textReference": "Negative"
      }
    ]
  },
  {
    "code": "VITAMINS_MINERALS",
    "titleEn": "Vitamins & Minerals Profile",
    "titleAr": "بروفايل الفيتامينات والمعادن الشامل (Vitamins & Minerals)",
    "category": "Vitamins & Minerals",
    "sampleType": "Serum (Morning Fasting)",
    "profilePrice": 850,
    "defaultInterpretation": "Comprehensive evaluation of essential fat- and water-soluble vitamins alongside key serum minerals and trace elements.",
    "parameters": [
      {
        "name": "25-Hydroxy Vitamin D Total (25-OH Vit D)",
        "unit": "ng/mL",
        "minNormal": 30,
        "maxNormal": 100,
        "method": "CLIA",
        "textReference": "Deficiency: < 20 | Insufficiency: 20 - 29 | Sufficiency: 30 - 100 ng/mL"
      },
      {
        "name": "Vitamin B12 (Cyanocobalamin)",
        "unit": "pg/mL",
        "minNormal": 211,
        "maxNormal": 911,
        "method": "CLIA",
        "textReference": "Normal: 211 - 911 pg/mL | Borderline: 150 - 210 | Deficient: < 150"
      },
      {
        "name": "Serum Folic Acid (Vitamin B9 / Folate)",
        "unit": "ng/mL",
        "minNormal": 3.89,
        "maxNormal": 26.8,
        "method": "CLIA",
        "textReference": "Normal: 3.89 - 26.8 ng/mL | Deficient: < 3.89"
      },
      {
        "name": "Vitamin C (Ascorbic Acid)",
        "unit": "mg/dL",
        "minNormal": 0.4,
        "maxNormal": 2.0,
        "method": "HPLC / Colorimetric",
        "textReference": "0.4 - 2.0 mg/dL"
      },
      {
        "name": "Total Serum Calcium (Ca)",
        "unit": "mg/dL",
        "minNormal": 8.5,
        "maxNormal": 10.5,
        "panicLow": 6.5,
        "panicHigh": 13.0,
        "method": "Arsenazo III",
        "textReference": "8.5 - 10.5 mg/dL"
      },
      {
        "name": "Ionized Calcium (Ca++)",
        "unit": "mmol/L",
        "minNormal": 1.15,
        "maxNormal": 1.33,
        "method": "Direct ISE",
        "textReference": "1.15 - 1.33 mmol/L"
      },
      {
        "name": "Serum Inorganic Phosphorus (P)",
        "unit": "mg/dL",
        "minNormal": 2.5,
        "maxNormal": 4.5,
        "method": "Phosphomolybdate UV",
        "textReference": "2.5 - 4.5 mg/dL"
      },
      {
        "name": "Serum Magnesium (Mg)",
        "unit": "mg/dL",
        "minNormal": 1.7,
        "maxNormal": 2.6,
        "method": "Colorimetric",
        "textReference": "1.7 - 2.6 mg/dL"
      },
      {
        "name": "Serum Zinc (Zn)",
        "unit": "ug/dL",
        "minNormal": 70,
        "maxNormal": 120,
        "method": "Colorimetric / AAS",
        "textReference": "70 - 120 ug/dL"
      },
      {
        "name": "Serum Copper (Cu)",
        "unit": "ug/dL",
        "minNormal": 70,
        "maxNormal": 140,
        "method": "Colorimetric / AAS",
        "textReference": "70 - 140 ug/dL"
      },
      {
        "name": "Serum Iron (Fe)",
        "unit": "ug/dL",
        "minNormal": 60,
        "maxNormal": 170,
        "method": "Ferrozine Colorimetric",
        "textReference": "M: 65 - 175 | F: 50 - 170 ug/dL"
      },
      {
        "name": "Serum Ferritin",
        "unit": "ng/mL",
        "minNormal": 30,
        "maxNormal": 300,
        "method": "CLIA",
        "textReference": "M: 30 - 400 | F: 15 - 150 ng/mL"
      },
      {
        "name": "Serum Sodium (Na+)",
        "unit": "mmol/L",
        "minNormal": 135,
        "maxNormal": 145,
        "panicLow": 120,
        "panicHigh": 160,
        "method": "Direct ISE",
        "textReference": "135 - 145 mmol/L"
      },
      {
        "name": "Serum Potassium (K+)",
        "unit": "mmol/L",
        "minNormal": 3.5,
        "maxNormal": 5.1,
        "panicLow": 2.8,
        "panicHigh": 6.5,
        "method": "Direct ISE",
        "textReference": "3.5 - 5.1 mmol/L"
      }
    ]
  }
];
