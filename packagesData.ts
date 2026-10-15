import { ComprehensivePackage } from "../types/lab";

export const INITIAL_PACKAGES: ComprehensivePackage[] = [
  {
    "id": "pkg-1",
    "code": "PKG-ANNUAL-WELLNESS",
    "titleAr": "Comprehensive Annual Wellness Package",
    "titleEn": "Comprehensive Annual Wellness Package",
    "descriptionAr": "The most requested general health check: vital organ function, glucose, lipids and a complete blood count.",
    "targetAudience": "Adults over 25 for an annual health check",
    "includedProfiles": [
      "CBC",
      "GLYCEMIC",
      "LIPID",
      "LFT",
      "KFT",
      "URINE"
    ],
    "includedIndividualTestCodes": [
      "VIT_D",
      "TSH",
      "URIC"
    ],
    "originalPrice": 1650,
    "packagePrice": 950,
    "discountPercentage": 42,
    "fastingRequired": "Fasting 10-12 hours (water only)",
    "sampleTypes": [
      "Serum",
      "EDTA Whole Blood",
      "Clean Urine"
    ],
    "isPopular": true
  },
  {
    "id": "pkg-2",
    "code": "PKG-MENS-HEALTH",
    "titleAr": "Men Executive Health & Prostate Screening",
    "titleEn": "Men Executive Health & Prostate Screening",
    "descriptionAr": "Men's health panel covering prostate health, testosterone, kidney and liver function, cardiac risk and gout markers.",
    "targetAudience": "Men over 35, or with urinary symptoms or chronic fatigue",
    "includedProfiles": [
      "CBC",
      "LIPID",
      "LFT",
      "KFT"
    ],
    "includedIndividualTestCodes": [
      "PSA_TOTAL",
      "PSA_FREE",
      "TESTOSTERONE_TOT",
      "URIC",
      "GLU_F"
    ],
    "originalPrice": 1980,
    "packagePrice": 1150,
    "discountPercentage": 42,
    "fastingRequired": "Fasting 10-12 hours; avoid cycling and ejaculation 48 hours before",
    "sampleTypes": [
      "Serum",
      "EDTA Whole Blood"
    ],
    "isPopular": true
  },
  {
    "id": "pkg-3",
    "code": "PKG-WOMENS-HEALTH",
    "titleAr": "Women Vital Health & Hormone Balance",
    "titleEn": "Women Vital Health & Hormone Balance",
    "descriptionAr": "Complete women's health panel: iron stores, thyroid activity, vitamin D, calcium and a blood count to assess anemia.",
    "targetAudience": "Women checking hormonal balance, hair loss or fatigue",
    "includedProfiles": [
      "CBC",
      "THYROID",
      "URINE"
    ],
    "includedIndividualTestCodes": [
      "FERRITIN",
      "VIT_D",
      "CALCIUM_TOTAL",
      "GLU_F",
      "CREAT"
    ],
    "originalPrice": 1850,
    "packagePrice": 1050,
    "discountPercentage": 43,
    "fastingRequired": "Fasting 8-10 hours (cycle day 2-3 if extra hormones are requested)",
    "sampleTypes": [
      "Serum",
      "EDTA Whole Blood",
      "Clean Urine"
    ],
    "isPopular": true
  },
  {
    "id": "pkg-4",
    "code": "PKG-DIABETIC-CARE",
    "titleAr": "Comprehensive Diabetes & Lipid Complication Care",
    "titleEn": "Comprehensive Diabetes & Lipid Complication Care",
    "descriptionAr": "Close diabetes monitoring: glycemic control, HbA1c, kidney function, urine microalbumin and lipid profile.",
    "targetAudience": "Diabetic and pre-diabetic patients, every 3-6 months",
    "includedProfiles": [
      "GLYCEMIC",
      "LIPID",
      "KFT",
      "ACR"
    ],
    "includedIndividualTestCodes": [
      "HBA1C",
      "GLU_F",
      "GLU_PP",
      "CREAT",
      "UREA",
      "URIC",
      "MICROALBUMIN"
    ],
    "originalPrice": 1200,
    "packagePrice": 720,
    "discountPercentage": 40,
    "fastingRequired": "Fasting 8-10 hours; then a sample 2 hours after eating",
    "sampleTypes": [
      "Serum",
      "Fluoride Plasma",
      "EDTA Whole Blood",
      "Morning Urine"
    ],
    "isPopular": true
  },
  {
    "id": "pkg-5",
    "code": "PKG-PREMARITAL",
    "titleAr": "Pre-Marital Comprehensive Health Screening",
    "titleEn": "Pre-Marital Comprehensive Health Screening",
    "descriptionAr": "Pre-marital screening: hepatitis viruses, HIV, blood groups, syphilis and a complete blood count.",
    "targetAudience": "Couples planning marriage",
    "includedProfiles": [
      "CBC",
      "VIRAL"
    ],
    "includedIndividualTestCodes": [
      "BLOOD_GROUP",
      "HBS_AG",
      "HCV_AB",
      "HIV_COMBO",
      "RUBELLA_IGG_IGM",
      "GLU_R",
      "VDRL_RPR"
    ],
    "originalPrice": 1450,
    "packagePrice": 850,
    "discountPercentage": 41,
    "fastingRequired": "No long fasting (2 hours preferred)",
    "sampleTypes": [
      "Serum",
      "EDTA Whole Blood"
    ],
    "isPopular": true
  },
  {
    "id": "pkg-6",
    "code": "PKG-LIVER-HEPATIC",
    "titleAr": "Complete Hepatic Profile & Viral Screen",
    "titleEn": "Complete Hepatic Profile & Viral Screen",
    "descriptionAr": "Detailed liver panel: enzymes, bilirubin, proteins, coagulation, hepatitis B and C and liver tumor markers.",
    "targetAudience": "Liver patients and long-term medication users",
    "includedProfiles": [
      "LFT",
      "VIRAL",
      "COAG"
    ],
    "includedIndividualTestCodes": [
      "ALT",
      "AST",
      "BIL_T",
      "BIL_D",
      "ALBUMIN",
      "ALP",
      "GGT",
      "PT",
      "HBS_AG",
      "HCV_AB",
      "AFP"
    ],
    "originalPrice": 1290,
    "packagePrice": 750,
    "discountPercentage": 42,
    "fastingRequired": "Fasting 6-8 hours",
    "sampleTypes": [
      "Serum",
      "Citrate Plasma"
    ],
    "isPopular": false
  },
  {
    "id": "pkg-7",
    "code": "PKG-RENAL-GOUT",
    "titleAr": "Renal Function, Gout & Electrolytes Panel",
    "titleEn": "Renal Function, Gout & Electrolytes Panel",
    "descriptionAr": "Full kidney assessment: filtration, sodium, potassium, calcium, phosphorus, uric acid and urinalysis.",
    "targetAudience": "Hypertension, kidney stones, leg swelling, joint pain or gout",
    "includedProfiles": [
      "KFT",
      "URINE",
      "CALCIUM_ELEC"
    ],
    "includedIndividualTestCodes": [
      "CREAT",
      "UREA",
      "BUN",
      "URIC",
      "SODIUM",
      "POTASSIUM",
      "CHLORIDE",
      "CALCIUM_TOTAL",
      "PHOSPHORUS"
    ],
    "originalPrice": 990,
    "packagePrice": 590,
    "discountPercentage": 40,
    "fastingRequired": "Fasting 8 hours, morning; moderate water allowed",
    "sampleTypes": [
      "Serum",
      "Fresh Urine"
    ],
    "isPopular": false
  },
  {
    "id": "pkg-8",
    "code": "PKG-CARDIO-LIPID",
    "titleAr": "Cardiovascular Risk & Lipid Profile Panel",
    "titleEn": "Cardiovascular Risk & Lipid Profile Panel",
    "descriptionAr": "Cardiovascular risk panel: full lipid profile, hs-CRP, homocysteine and cardiac enzymes.",
    "targetAudience": "Heart patients, smokers and those with a family history of arterial disease",
    "includedProfiles": [
      "LIPID",
      "CARDIAC",
      "COAG"
    ],
    "includedIndividualTestCodes": [
      "CHOL",
      "TRIG",
      "HDL",
      "LDL",
      "HS_CRP",
      "GLU_F",
      "HOMOCYSTEINE",
      "TROPONIN_I_HS",
      "CK_MB"
    ],
    "originalPrice": 1550,
    "packagePrice": 890,
    "discountPercentage": 43,
    "fastingRequired": "Fasting 10-12 hours (water only)",
    "sampleTypes": [
      "Serum",
      "Citrate Plasma"
    ],
    "isPopular": false
  },
  {
    "id": "pkg-9",
    "code": "PKG-VITAMINS-ENERGY",
    "titleAr": "Vitamins, Minerals & Vital Energy Panel",
    "titleEn": "Vitamins, Minerals & Vital Energy Panel",
    "descriptionAr": "Fatigue work-up: vitamin D, vitamin B12, folate, iron stores, magnesium and zinc.",
    "targetAudience": "Persistent fatigue, numbness or low immunity",
    "includedProfiles": [
      "CBC",
      "IRON"
    ],
    "includedIndividualTestCodes": [
      "VIT_D",
      "VIT_B12",
      "FOLIC_ACID",
      "FERRITIN",
      "IRON",
      "TIBC",
      "MAGNESIUM",
      "CALCIUM_TOTAL",
      "ZINC"
    ],
    "originalPrice": 1980,
    "packagePrice": 1190,
    "discountPercentage": 40,
    "fastingRequired": "Fasting 8-10 hours",
    "sampleTypes": [
      "Serum",
      "EDTA Whole Blood"
    ],
    "isPopular": true
  },
  {
    "id": "pkg-10",
    "code": "PKG-SENIOR-GOLDEN",
    "titleAr": "Golden Age Senior Comprehensive Panel",
    "titleEn": "Golden Age Senior Comprehensive Panel",
    "descriptionAr": "Senior panel (55+): blood count, glucose, liver, kidney, tumor markers, calcium, urine and stool.",
    "targetAudience": "Adults over 50 for a full annual assessment",
    "includedProfiles": [
      "CBC",
      "GLYCEMIC",
      "LIPID",
      "LFT",
      "KFT",
      "URINE",
      "STOOL"
    ],
    "includedIndividualTestCodes": [
      "VIT_D",
      "TSH",
      "PSA_TOTAL",
      "URIC",
      "OCCULT_BLOOD",
      "CALCIUM_TOTAL",
      "CREAT",
      "BUN"
    ],
    "originalPrice": 2400,
    "packagePrice": 1390,
    "discountPercentage": 42,
    "fastingRequired": "Fasting 10-12 hours, morning sample",
    "sampleTypes": [
      "Serum",
      "EDTA Whole Blood",
      "Fresh Urine",
      "Stool Specimen"
    ],
    "isPopular": true
  },
  {
    "id": "pkg-11",
    "code": "PKG-HAIR-LOSS",
    "titleAr": "Hair Loss, Anemia & Micronutrient Panel",
    "titleEn": "Hair Loss, Anemia & Micronutrient Panel",
    "descriptionAr": "Hair loss and brittle nails work-up: iron stores, thyroid, zinc, vitamin D, vitamin B12 and androgens.",
    "targetAudience": "Severe hair loss or brittle nails",
    "includedProfiles": [
      "CBC",
      "THYROID",
      "IRON"
    ],
    "includedIndividualTestCodes": [
      "FERRITIN",
      "IRON",
      "TIBC",
      "VIT_D",
      "VIT_B12",
      "ZINC",
      "TSH",
      "FREE_T4",
      "TESTOSTERONE_TOT"
    ],
    "originalPrice": 1850,
    "packagePrice": 1090,
    "discountPercentage": 41,
    "fastingRequired": "Fasting 8-10 hours, morning sample",
    "sampleTypes": [
      "Serum",
      "EDTA Whole Blood"
    ],
    "isPopular": true
  },
  {
    "id": "pkg-12",
    "code": "PKG-FITNESS-ATHLETES",
    "titleAr": "Athletes & Fitness Performance Panel",
    "titleEn": "Athletes & Fitness Performance Panel",
    "descriptionAr": "Athlete panel: testosterone, muscle enzyme CPK, liver and kidney function and electrolytes.",
    "targetAudience": "Athletes, bodybuilders and supplement users",
    "includedProfiles": [
      "CBC",
      "LFT",
      "KFT",
      "LIPID",
      "CALCIUM_ELEC"
    ],
    "includedIndividualTestCodes": [
      "TESTOSTERONE_TOT",
      "CPK_TOTAL",
      "CREAT",
      "UREA",
      "URIC",
      "GLU_F",
      "VIT_D",
      "SODIUM",
      "POTASSIUM"
    ],
    "originalPrice": 1720,
    "packagePrice": 990,
    "discountPercentage": 42,
    "fastingRequired": "Fasting 10-12 hours; light rest before collection",
    "sampleTypes": [
      "Serum",
      "EDTA Whole Blood"
    ],
    "isPopular": false
  },
  {
    "id": "pkg-13",
    "code": "PKG-PEDIATRIC-GROWTH",
    "titleAr": "Pediatric Health, Growth & Parasitology Checkup",
    "titleEn": "Pediatric Health, Growth & Parasitology Checkup",
    "descriptionAr": "Pediatric check-up: blood count for anemia, calcium and vitamin D for bone growth, urine and stool for parasites, ESR.",
    "targetAudience": "Children 2-14 years for growth and development",
    "includedProfiles": [
      "CBC",
      "URINE",
      "STOOL"
    ],
    "includedIndividualTestCodes": [
      "FERRITIN",
      "IRON",
      "CALCIUM_TOTAL",
      "VIT_D",
      "ASOT",
      "CRP_QUANT"
    ],
    "originalPrice": 1050,
    "packagePrice": 620,
    "discountPercentage": 41,
    "fastingRequired": "Light fasting 4-6 hours (children)",
    "sampleTypes": [
      "Serum",
      "EDTA Whole Blood",
      "Fresh Urine",
      "Stool Specimen"
    ],
    "isPopular": false
  },
  {
    "id": "pkg-14",
    "code": "PKG-GI-STOMACH",
    "titleAr": "Gastrointestinal, Celiac & H. Pylori Panel",
    "titleEn": "Gastrointestinal, Celiac & H. Pylori Panel",
    "descriptionAr": "Stomach and bowel work-up: H. pylori, fecal calprotectin, occult blood, pancreatic enzymes and blood count.",
    "targetAudience": "Acid reflux, indigestion, IBS or abdominal pain",
    "includedProfiles": [
      "STOOL",
      "CBC"
    ],
    "includedIndividualTestCodes": [
      "HP_STOOL_AG",
      "CALPROTECTIN",
      "OCCULT_BLOOD",
      "ALT",
      "AST",
      "AMYLASE",
      "LIPASE"
    ],
    "originalPrice": 1380,
    "packagePrice": 790,
    "discountPercentage": 43,
    "fastingRequired": "Fasting 6-8 hours",
    "sampleTypes": [
      "Serum",
      "EDTA Whole Blood",
      "Fresh Stool Specimen"
    ],
    "isPopular": false
  },
  {
    "id": "pkg-15",
    "code": "PKG-ROYAL-VIP",
    "titleAr": "Prof. Dr. Rami Mokhtar Royal VIP Platinum Panel",
    "titleEn": "Prof. Dr. Rami Mokhtar Royal VIP Platinum Panel",
    "descriptionAr": "Our most comprehensive panel: 32 tests covering blood count, liver, kidney, HbA1c, lipids, thyroid, vitamins, tumor markers and electrolytes.",
    "targetAudience": "Premium executive annual check-up",
    "includedProfiles": [
      "CBC",
      "GLYCEMIC",
      "LIPID",
      "LFT",
      "KFT",
      "THYROID",
      "URINE",
      "STOOL",
      "COAG",
      "IRON"
    ],
    "includedIndividualTestCodes": [
      "VIT_D",
      "VIT_B12",
      "FERRITIN",
      "TSH",
      "FREE_T4",
      "PSA_TOTAL",
      "CEA",
      "HS_CRP",
      "URIC",
      "CALCIUM_TOTAL",
      "MAGNESIUM",
      "SODIUM",
      "POTASSIUM",
      "HBA1C"
    ],
    "originalPrice": 3950,
    "packagePrice": 2200,
    "discountPercentage": 44,
    "fastingRequired": "Fasting 10-12 hours (water only)",
    "sampleTypes": [
      "Serum",
      "EDTA Whole Blood",
      "Citrate Plasma",
      "Fluoride Plasma",
      "Fresh Urine",
      "Stool"
    ],
    "isPopular": true
  }
];
