export { INITIAL_PACKAGES } from "./packagesData";
export { INITIAL_INDIVIDUAL_TESTS } from "./individualTestsData";
export { INITIAL_LAB_INFO, INITIAL_FACILITIES, INITIAL_STAFF_MEMBERS } from "./staffAndFacilitiesData";
export { INITIAL_LOYALTY_PROFILES, TIER_BENEFITS } from "./loyaltyData";

import { CatalogProfileTemplate, LabStaffSignatures } from '../types/lab';

export const DEFAULT_STAFF: LabStaffSignatures = {
  labChemist: "",
  verifiedBy: "",
  pathologist: "أ.د. رامي مختار - استشاري الباثولوجيا الإكلينيكية والكيميائية - كلية طب قصر العيني"
};

export type SignatureOption = { name: string; title: string };

export const STAFF_OPTIONS: {
  chemists: SignatureOption[];
  verifiers: SignatureOption[];
  pathologists: SignatureOption[];
} = {
  chemists: [
    { name: "د. هبة الشناوي", title: "Clinical Chemistry Specialist" },
    { name: "د. مصطفى العوضي", title: "Lab Chemist" }
  ],
  verifiers: [
    { name: "د. مصطفى العوضي", title: "Quality Control & Clinical Review" },
    { name: "د. هبة الشناوي", title: "Senior Verifier" }
  ],
  pathologists: [
    { name: "أ.د. رامي مختار", title: "Consultant Clinical Pathology - Kasr Al Ainy" }
  ]
};

const SIGNATURE_ROSTER_KEY = 'rt_lab_signature_roster_v1';

export function loadSignatureRoster(): typeof STAFF_OPTIONS {
  try {
    const raw = localStorage.getItem(SIGNATURE_ROSTER_KEY);
    if (!raw) return { ...STAFF_OPTIONS, chemists: [...STAFF_OPTIONS.chemists], verifiers: [...STAFF_OPTIONS.verifiers], pathologists: [...STAFF_OPTIONS.pathologists] };
    const parsed = JSON.parse(raw);
    return {
      chemists: [...STAFF_OPTIONS.chemists, ...(parsed.chemists || [])],
      verifiers: [...STAFF_OPTIONS.verifiers, ...(parsed.verifiers || [])],
      pathologists: [...STAFF_OPTIONS.pathologists, ...(parsed.pathologists || [])]
    };
  } catch {
    return STAFF_OPTIONS;
  }
}

export function addSignatureToRoster(role: 'chemists' | 'verifiers' | 'pathologists', option: SignatureOption) {
  try {
    const raw = localStorage.getItem(SIGNATURE_ROSTER_KEY);
    const parsed = raw ? JSON.parse(raw) : { chemists: [], verifiers: [], pathologists: [] };
    if (!parsed[role]) parsed[role] = [];
    const exists = parsed[role].some((o: SignatureOption) => o.name === option.name && o.title === option.title);
    if (!exists) {
      parsed[role].push(option);
      localStorage.setItem(SIGNATURE_ROSTER_KEY, JSON.stringify(parsed));
    }
  } catch (e) {
    console.warn(e);
  }
}

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
  ]
};

export const LAB_CATALOG: CatalogProfileTemplate[] = [
  {
    "code": "CBC",
    "titleEn": "Complete Blood Count (CBC) with Full Automated Differential & Indices",
    "titleAr": "صورة الدم الكاملة مع الفيلم التفريقي والمؤشرات الحسابية",
    "category": "Hematology",
    "sampleType": "EDTA Whole Blood",
    "defaultInterpretation": "Microscopic evaluation and complete differential indices assessed according to international hematology criteria.",
    "parameters": [
      {
        "name": "Hemoglobin (Hb)",
        "unit": "g/dL",
        "minNormal": 12,
        "maxNormal": 16.5,
        "panicLow": 7,
        "panicHigh": 20,
        "method": "Automated SLS-Hb",
        "textReference": "M: 13.0 - 17.5 | F: 12.0 - 15.5 g/dL"
      },
      {
        "name": "R.B.Cs Count",
        "unit": "x10^6/µL",
        "minNormal": 4,
        "maxNormal": 5.8,
        "method": "Electrical Impedance",
        "textReference": "M: 4.5 - 5.9 | F: 4.0 - 5.2"
      },
      {
        "name": "Hematocrit (PCV)",
        "unit": "%",
        "minNormal": 36,
        "maxNormal": 48,
        "notes": "Auto-calculated: Hb × 3",
        "textReference": "M: 40 - 52% | F: 36 - 48%"
      },
      {
        "name": "M.C.V",
        "unit": "fL",
        "minNormal": 80,
        "maxNormal": 98,
        "notes": "Auto-calculated: (PCV × 10) / RBC",
        "textReference": "80.0 - 98.0 fL"
      },
      {
        "name": "M.C.H",
        "unit": "pg",
        "minNormal": 27,
        "maxNormal": 33,
        "notes": "Auto-calculated: (Hb × 10) / RBC",
        "textReference": "27.0 - 33.0 pg"
      },
      {
        "name": "M.C.H.C",
        "unit": "g/dL",
        "minNormal": 32,
        "maxNormal": 36,
        "notes": "Auto-calculated: (Hb × 100) / PCV",
        "textReference": "32.0 - 36.0 g/dL"
      },
      {
        "name": "R.D.W-CV",
        "unit": "%",
        "minNormal": 11.5,
        "maxNormal": 14.5,
        "textReference": "11.5 - 14.5 %"
      },
      {
        "name": "R.D.W-SD",
        "unit": "fL",
        "minNormal": 39,
        "maxNormal": 46,
        "textReference": "39.0 - 46.0 fL"
      },
      {
        "name": "Mentzer Index (MCV/RBC)",
        "unit": "Ratio",
        "notes": "<13 Thalassemia Trait | >13 Iron Deficiency",
        "textReference": "> 13 Iron Def. | < 13 Thalassemia"
      },
      {
        "name": "Green & King Index",
        "unit": "Index",
        "notes": "(MCV² × RDW) / (Hb × 100)",
        "textReference": "< 72 Thalassemia | > 72 Iron Def."
      },
      {
        "name": "Platelets Count",
        "unit": "x10^3/µL",
        "minNormal": 150,
        "maxNormal": 450,
        "panicLow": 50,
        "panicHigh": 1000,
        "textReference": "150 - 450 x10^3/µL"
      },
      {
        "name": "MPV (Mean Platelet Volume)",
        "unit": "fL",
        "minNormal": 7.5,
        "maxNormal": 11.5,
        "textReference": "7.5 - 11.5 fL"
      },
      {
        "name": "PDW (Platelet Dist. Width)",
        "unit": "%",
        "minNormal": 9,
        "maxNormal": 17,
        "textReference": "9.0 - 17.0 %"
      },
      {
        "name": "PCT (Plateletcrit)",
        "unit": "%",
        "minNormal": 0.17,
        "maxNormal": 0.35,
        "notes": "Auto-calculated: (PLT × MPV) / 10,000",
        "textReference": "0.17 - 0.35 %"
      },
      {
        "name": "Total Leucocytic Count (TLC)",
        "unit": "x10^3/µL",
        "minNormal": 4,
        "maxNormal": 11,
        "panicLow": 2,
        "panicHigh": 30,
        "textReference": "4.0 - 11.0 x10^3/µL"
      },
      {
        "name": "Segmented Neutrophils %",
        "unit": "%",
        "minNormal": 40,
        "maxNormal": 65,
        "textReference": "40 - 65 %"
      },
      {
        "name": "Band Forms (Stab) %",
        "unit": "%",
        "minNormal": 0,
        "maxNormal": 5,
        "textReference": "0 - 5 % (Left Shift if > 6%)"
      },
      {
        "name": "Total Neutrophils %",
        "unit": "%",
        "minNormal": 40,
        "maxNormal": 70,
        "notes": "Auto-calculated: Segmented% + Band%",
        "textReference": "40 - 70 %"
      },
      {
        "name": "Lymphocytes %",
        "unit": "%",
        "minNormal": 20,
        "maxNormal": 45,
        "textReference": "20 - 45 %"
      },
      {
        "name": "Monocytes %",
        "unit": "%",
        "minNormal": 2,
        "maxNormal": 8,
        "textReference": "2 - 8 %"
      },
      {
        "name": "Eosinophils %",
        "unit": "%",
        "minNormal": 1,
        "maxNormal": 6,
        "textReference": "1 - 6 %"
      },
      {
        "name": "Basophils %",
        "unit": "%",
        "minNormal": 0,
        "maxNormal": 1,
        "textReference": "0 - 1 %"
      },
      {
        "name": "Metamyelocytes %",
        "unit": "%",
        "minNormal": 0,
        "maxNormal": 0,
        "textReference": "0 % (Absent in normal blood)"
      },
      {
        "name": "Myelocytes %",
        "unit": "%",
        "minNormal": 0,
        "maxNormal": 0,
        "textReference": "0 % (Absent in normal blood)"
      },
      {
        "name": "Blast Cells %",
        "unit": "%",
        "minNormal": 0,
        "maxNormal": 0,
        "textReference": "0 % (Absent in normal blood)"
      },
      {
        "name": "Absolute Neutrophils (ANC)",
        "unit": "x10^3/µL",
        "minNormal": 1.5,
        "maxNormal": 7.5,
        "notes": "Auto-calculated: (WBC × Neut%) / 100",
        "textReference": "1.5 - 7.5 x10^3/µL"
      },
      {
        "name": "Absolute Lymphocytes (ALC)",
        "unit": "x10^3/µL",
        "minNormal": 1,
        "maxNormal": 4,
        "notes": "Auto-calculated: (WBC × Lymph%) / 100",
        "textReference": "1.0 - 4.0 x10^3/µL"
      },
      {
        "name": "Absolute Monocytes (AMC)",
        "unit": "x10^3/µL",
        "minNormal": 0.2,
        "maxNormal": 0.8,
        "notes": "Auto-calculated: (WBC × Mono%) / 100",
        "textReference": "0.2 - 0.8 x10^3/µL"
      },
      {
        "name": "Absolute Eosinophils (AEC)",
        "unit": "x10^3/µL",
        "minNormal": 0.04,
        "maxNormal": 0.44,
        "notes": "Auto-calculated: (WBC × Eos%) / 100",
        "textReference": "0.04 - 0.44 x10^3/µL"
      },
      {
        "name": "Absolute Basophils (ABC)",
        "unit": "x10^3/µL",
        "minNormal": 0.01,
        "maxNormal": 0.1,
        "notes": "Auto-calculated: (WBC × Baso%) / 100",
        "textReference": "0.01 - 0.1 x10^3/µL"
      },
      {
        "name": "NLR (Neutrophil/Lymphocyte)",
        "unit": "Ratio",
        "minNormal": 0.8,
        "maxNormal": 2.5,
        "notes": "Auto-calculated: Neut% / Lymph%",
        "textReference": "0.8 - 2.5 (Inflammatory Index)"
      },
      {
        "name": "PLR (Platelet/Lymphocyte)",
        "unit": "Ratio",
        "minNormal": 100,
        "maxNormal": 150,
        "notes": "Auto-calculated: PLT / ALC",
        "textReference": "100 - 150"
      },
      {
        "name": "Reticulocyte Count %",
        "unit": "%",
        "minNormal": 0.5,
        "maxNormal": 2.5,
        "textReference": "0.5 - 2.5 %"
      },
      {
        "name": "RPI (Reticulocyte Production Index)",
        "unit": "Index",
        "minNormal": 1,
        "maxNormal": 3,
        "textReference": "> 2.0 indicates adequate marrow response"
      },
      {
        "name": "RBC Morphology",
        "unit": "/HPF",
        "textReference": "Normocytic normochromic, no anisopoikilocytosis",
        "method": "Leishman Stain Microscopy"
      },
      {
        "name": "WBC Morphology",
        "unit": "pH Units",
        "textReference": "Mature differential, no toxic granules, vacuoles, or blasts",
        "method": "Leishman Stain Microscopy"
      },
      {
        "name": "Platelet Morphology",
        "unit": "pH Units",
        "textReference": "Adequate on smear, normal aggregation, no giant forms",
        "method": "Leishman Stain Microscopy"
      }
    ]
  },
  {
    "code": "URINE",
    "titleEn": "Complete Urine Analysis",
    "titleAr": "تحليل البول الكامل (فحص فيزيائي، كيميائي، ومجهري)",
    "category": "Clinical Microscopy",
    "sampleType": "Clean Catch Midstream Urine",
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
    "titleAr": "تحليل البراز الكامل (طفيليات، ديدان، وفحص مجهري)",
    "category": "Clinical Parasitology",
    "sampleType": "Fresh Stool Specimen",
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
    "titleAr": "تحليل السائل المنوي الشامل (معايير منظمة الصحة العالمية)",
    "category": "Andrology",
    "sampleType": "Complete Semen Ejaculate",
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
    "titleAr": "مزرعة ميكروبية واختبار حساسية المضادات الحيوية",
    "category": "Microbiology",
    "sampleType": "Clinical Specimen (Urine/Blood/Wound/Swab)",
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
    "titleAr": "مقاومة الإنسولين ووظائف خلايا بيتا (HOMA-IR & QUICKI)",
    "category": "Endocrinology",
    "sampleType": "Serum & Fluoride Plasma (10-12h Fasting)",
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
    "titleAr": "تقييم السكر التراكمي والجلوكوز ومتوسط السكر التقديري",
    "category": "Clinical Chemistry",
    "sampleType": "Fluoride Plasma & EDTA Blood",
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
  {
    "code": "ACR",
    "titleEn": "Urine Albumin / Creatinine Ratio (ACR)",
    "titleAr": "معدل الزلال إلى الكرياتينين في البول (الكشف المبكر لاعتلال الكلى)",
    "category": "Clinical Chemistry",
    "sampleType": "First Morning Urine Spot Specimen",
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
    "titleAr": "أملاح الدم والكالسيوم المصحح بالألبومين",
    "category": "Clinical Chemistry",
    "sampleType": "Serum",
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
    "titleAr": "دهون الدم الشاملة مع المؤشرات الحسابية",
    "category": "Clinical Chemistry",
    "sampleType": "Serum (12h Fasting)",
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
    "titleAr": "وظائف كبد متكاملة ومؤشرات الصفراء والبروتين",
    "category": "Clinical Chemistry",
    "sampleType": "Serum",
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
    "titleAr": "وظائف الكلى واليوريا ومعدل الفلترة eGFR",
    "category": "Clinical Chemistry",
    "sampleType": "Serum",
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
    "titleAr": "دلالات وإنزيمات القلب الحادة (تروبونين، CK-MB، والجلطات)",
    "category": "Cardiac & Emergency",
    "sampleType": "Serum or Heparin Plasma",
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
    "titleAr": "وظائف الغدة الدرقية الكاملة والأجسام المضادة",
    "category": "Endocrinology",
    "sampleType": "Serum",
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
    "titleAr": "سيولة وتجلط الدم (زمن البروثرومبين و INR و D-Dimer)",
    "category": "Hematology & Hemostasis",
    "sampleType": "Sodium Citrate Plasma (9:1 ratio)",
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
    "titleAr": "مخزون الحديد وحديد المصل والأنيميا",
    "category": "Clinical Chemistry",
    "sampleType": "Serum (Morning Fasting)",
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
    "titleAr": "هرمونات الخصوبة والتكاثر والحمل",
    "category": "Endocrinology",
    "sampleType": "Serum",
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
    "titleAr": "تحاليل الروماتيزم والمناعة الذاتية والالتهاب",
    "category": "Immunology",
    "sampleType": "Serum & Citrate Blood",
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
    "titleAr": "فيروسات الكبد والمناعة الفيروسية",
    "category": "Virology & Serology",
    "sampleType": "Serum",
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
  }
];
