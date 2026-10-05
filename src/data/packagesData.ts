import { ComprehensivePackage } from "../types/lab";

export const INITIAL_PACKAGES: ComprehensivePackage[] = [
  {
    "id": "pkg-1",
    "code": "PKG-ANNUAL-WELLNESS",
    "titleAr": "باقة الفحص الدوري الشامل (Wellness Plus)",
    "titleEn": "Comprehensive Annual Wellness Package",
    "descriptionAr": "الفحص الأكثر طلباً للاطمئنان على الصحة العامة، وظائف الأعضاء الحيوية، مستويات السكر والدهون وصورة الدم الكاملة.",
    "targetAudience": "للرجال والنساء فوق 25 عاماً للتقييم الصحي السنوي الدوري",
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
    "fastingRequired": "صيام من 10 إلى 12 ساعة (يُسمح بشرب الماء فقط)",
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
    "titleAr": "باقة صحة الرجل والبروستاتا الشاملة",
    "titleEn": "Men Executive Health & Prostate Screening",
    "descriptionAr": "فحص مخصص للرجال يشمل صحة البروستاتا، هرمون الذكورة، وظائف الكلى والكبد، ومؤشرات القلب والنقرس.",
    "targetAudience": "للرجال فوق سن 35 عاماً أو من لديهم أعراض مسالك بولية أو إجهاد مزمن",
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
    "fastingRequired": "صيام 10-12 ساعة مع الامتناع عن ركوب الدراجات والجماع قبل الفحص بـ 48 ساعة",
    "sampleTypes": [
      "Serum",
      "EDTA Whole Blood"
    ],
    "isPopular": true
  },
  {
    "id": "pkg-3",
    "code": "PKG-WOMENS-HEALTH",
    "titleAr": "باقة صحة المرأة والهرمونات الحيوية",
    "titleEn": "Women Vital Health & Hormone Balance",
    "descriptionAr": "فحص متكامل لصحة المرأة يشمل مخزون الحديد، نشاط الغدة الدرقية، فيتامين د، الكالسيوم، وصورة الدم لتقييم الأنيميا.",
    "targetAudience": "للسيدات والفتيات للتحقق من التوازن الهرموني، تساقط الشعر والإرهاق",
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
    "fastingRequired": "صيام 8-10 ساعات (يفضل اليوم 2-3 من الدورة الشهرية في حال طلب هرمونات إضافية)",
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
    "titleAr": "باقة متابعة السكر والوقاية من المضاعفات",
    "titleEn": "Comprehensive Diabetes & Lipid Complication Care",
    "descriptionAr": "فحص دقيق لمتابعة انتظام السكر، التراكمي، كفاءة الكلى والزلال الدقيق بالبول، ومستوى الدهون والكوليسترول.",
    "targetAudience": "لمرضى السكري ومرحلة ما قبل السكري للمتابعة كل 3-6 أشهر",
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
    "fastingRequired": "صيام 8-10 ساعات صباحاً ثم أخذ عينة بعد الأكل بساعتين",
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
    "titleAr": "باقة الفحص الطبي الشامل لما قبل الزواج",
    "titleEn": "Pre-Marital Comprehensive Health Screening",
    "descriptionAr": "فحص التوافق والفيروسات الكبدية والإيدز وفصائل الدم والزهري وصورة الدم الكاملة للحفاظ على صحة الأسرة.",
    "targetAudience": "للمقبلين على الزواج والعروسين للاطمئنان والتوافق الصحي",
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
    "fastingRequired": "لا يشترط صيام طويل (يفضل ساعتان قبل السحب)",
    "sampleTypes": [
      "Serum",
      "EDTA Whole Blood"
    ],
    "isPopular": true
  },
  {
    "id": "pkg-6",
    "code": "PKG-LIVER-HEPATIC",
    "titleAr": "باقة وظائف الكبد والفيروسات الكبدية الكاملة",
    "titleEn": "Complete Hepatic Profile & Viral Screen",
    "descriptionAr": "فحص تفصيلي لإنزيمات الكبد والصفراء والبروتينات وزمن السيولة والتجلط والفيروسات الكبدية بي وسي ودلالات أورام الكبد.",
    "targetAudience": "لمرضى الكبد، الحالات المزمنة، أو الفحص الوقائي لمستخدمي الأدوية المزمنة",
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
    "fastingRequired": "صيام من 6 إلى 8 ساعات",
    "sampleTypes": [
      "Serum",
      "Citrate Plasma"
    ],
    "isPopular": false
  },
  {
    "id": "pkg-7",
    "code": "PKG-RENAL-GOUT",
    "titleAr": "باقة وظائف الكلى والأملاح والنقرس",
    "titleEn": "Renal Function, Gout & Electrolytes Panel",
    "descriptionAr": "تقييم شامل لكفاءة الكلى والترشيح الكلوي، أملاح الصوديوم والبوتاسيوم، الكالسيوم، الفوسفور، حمض البوليك وتحليل البول.",
    "targetAudience": "لمرضى ارتفاع ضغط الدم، حصوات الكلى، تورم القدمين، أو آلام المفاصل والنقرس",
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
    "fastingRequired": "صيام 8 ساعات صباحاً مع شرب ماء معتدل",
    "sampleTypes": [
      "Serum",
      "Fresh Urine"
    ],
    "isPopular": false
  },
  {
    "id": "pkg-8",
    "code": "PKG-CARDIO-LIPID",
    "titleAr": "باقة صحة القلب والدهون وتصلب الشرايين",
    "titleEn": "Cardiovascular Risk & Lipid Profile Panel",
    "descriptionAr": "فحص مخاطر تصلب الشرايين والجلطات يشمل كولسترول كامل، دهون ثلاثية، بروتين سي عالي الحساسية، هوموسيستين وإنزيمات القلب.",
    "targetAudience": "لمرضى الضغط والقلب، والمدخنين وأصحاب التاريخ العائلي لأمراض الشرايين",
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
    "fastingRequired": "صيام من 10 إلى 12 ساعة (يُسمح بشرب الماء فقط)",
    "sampleTypes": [
      "Serum",
      "Citrate Plasma"
    ],
    "isPopular": false
  },
  {
    "id": "pkg-9",
    "code": "PKG-VITAMINS-ENERGY",
    "titleAr": "باقة الفيتامينات والمعادن والطاقة الحيوية",
    "titleEn": "Vitamins, Minerals & Vital Energy Panel",
    "descriptionAr": "الفحص المتخصص في الإرهاق وضعف التركيز، فيتامين د، فيتامين ب12، حمض الفوليك، مخزون الحديد، الماغنيسيوم والزنك.",
    "targetAudience": "لمن يعانون من خمول، إجهاد مستمر، تنميل الأطراف، أو ضعف المناعة",
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
    "fastingRequired": "صيام من 8 إلى 10 ساعات",
    "sampleTypes": [
      "Serum",
      "EDTA Whole Blood"
    ],
    "isPopular": true
  },
  {
    "id": "pkg-10",
    "code": "PKG-SENIOR-GOLDEN",
    "titleAr": "باقة كبار السن التنفيذية الشاملة (Golden Age)",
    "titleEn": "Golden Age Senior Comprehensive Panel",
    "descriptionAr": "فحص مخصص فوق 55 عاماً، تغطية شاملة لوظائف الأعضاء الحيوية، الدم، السكر، الكبد، الكلى، دلالات الأورام والكالسيوم والبول والبراز.",
    "targetAudience": "للرجال والسيدات فوق 50 عاماً للتقييم الصحي السنوي المتكامل",
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
    "fastingRequired": "صيام 10-12 ساعة صباحاً",
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
    "titleAr": "باقة تشخيص تساقط الشعر والأنيميا والهرمونات",
    "titleEn": "Hair Loss, Anemia & Micronutrient Panel",
    "descriptionAr": "فحص أسباب تساقط الشعر وضعف الأظافر: مخزون الحديد، نشاط الغدة، الزنك، فيتامين د، فيتامين ب12 وهرمونات الذكورة.",
    "targetAudience": "للسيدات والرجال الذين يعانون من تساقط الشعر الحاد أو تقصف الأظافر",
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
    "fastingRequired": "صيام 8-10 ساعات صباحاً",
    "sampleTypes": [
      "Serum",
      "EDTA Whole Blood"
    ],
    "isPopular": true
  },
  {
    "id": "pkg-12",
    "code": "PKG-FITNESS-ATHLETES",
    "titleAr": "باقة الرياضيين واللياقة وبناء الأجسام",
    "titleEn": "Athletes & Fitness Performance Panel",
    "descriptionAr": "فحص رياضي متخصص لمتابعي الجيم والمكملات: هرمون الذكورة، إنزيمات العضلات CPK، وظائف الكبد والكلى، وأملاح الدم.",
    "targetAudience": "للرياضيين وممارسي كمال الأجسام ومستخدمي المكملات الغذائية",
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
    "fastingRequired": "صيام 10-12 ساعة مع راحة بدنية خفيفة قبل السحب",
    "sampleTypes": [
      "Serum",
      "EDTA Whole Blood"
    ],
    "isPopular": false
  },
  {
    "id": "pkg-13",
    "code": "PKG-PEDIATRIC-GROWTH",
    "titleAr": "باقة صحة ونمو الأطفال والديدان وفقر الدم",
    "titleEn": "Pediatric Health, Growth & Parasitology Checkup",
    "descriptionAr": "فحص مخصص للأطفال يشمل صورة الدم للأنيميا، الكالسيوم وفيتامين د للنمو العظمي، فحص البول والبراز للديدان، وسرعة ترسيب.",
    "targetAudience": "للأطفال من عمر سنتين حتى 14 عاماً لتقييم النمو والنشاط المدرسي",
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
    "fastingRequired": "صيام خفيف 4-6 ساعات (للأطفال)",
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
    "titleAr": "باقة الجهاز الهضمي والقولون وجرثومة المعدة",
    "titleEn": "Gastrointestinal, Celiac & H. Pylori Panel",
    "descriptionAr": "فحص آلام المعدة والقولون: جرثومة المعدة، كالبروتكتين البراز للالتهابات، الدم الخفي، إنزيمات البنكرياس وصورة الدم.",
    "targetAudience": "لمن يعانون من حموضة المعدة، عسر الهضم، القولون العصبي أو آلام البطن",
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
    "fastingRequired": "صيام 6-8 ساعات",
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
    "titleAr": "باقة الفحص الشامل الملكية VIP د. رامي مختار (32 فحص شامل)",
    "titleEn": "Prof. Dr. Rami Mokhtar Royal VIP Platinum Panel",
    "descriptionAr": "أشمل باقة معملية متقدمة في مصر تغطي كافة أعضاء الجسم: 32 فحصاً تشمل صورة الدم، الكبد، الكلى، السكر التراكمي، الدهون، الغدة، الفيتامينات، دلالات الأورام والأملاح.",
    "targetAudience": "الفحص الملكي السنوي لكبار الشخصيات والمديرين والباحثين عن أقصى رعاية وقائية",
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
    "fastingRequired": "صيام من 10 إلى 12 ساعة (يُسمح بشرب الماء فقط)",
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
