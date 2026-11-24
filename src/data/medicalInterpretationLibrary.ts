import type { Gender, Patient, TestParameter, TestProfile } from '../types';

export type MedicalLibrarySource = 'common_diseases' | 'anemia_guide';

export interface MedicalLibraryEntry {
  id: string;
  source: MedicalLibrarySource;
  sectionNumber: string;
  sectionEn: string;
  sectionAr: string;
  conditionEn: string;
  conditionAr: string;
  profileCodes: string[];
  keywords: string[];
  typicalPattern: string;
  suggestedComment: string;
  interpretiveNote?: string;
  recommendedInvestigations: string[];
  isCriticalEscalation?: boolean;
  bloodFilmSuggestion?: string;
}

export interface PeripheralBloodFilmGuideItem {
  finding: string;
  interpretation: string;
}

export interface AnemiaSeverityEvaluation {
  hasAnemia: boolean;
  severity: 'None' | 'Mild' | 'Moderate' | 'Severe';
  severityAr: string;
  hbValue: number | null;
  mcvClass: 'Microcytic' | 'Normocytic' | 'Macrocytic' | 'Unknown';
  mentzerIndex: number | null;
  isLeftShift: boolean;
  bandCells: number | null;
}

export interface CbcSmartSuggestion {
  entry: MedicalLibraryEntry;
  confidence: 'High' | 'Moderate' | 'Possible';
  reasonsAr: string[];
  reasonsEn: string[];
}

export const PERIPHERAL_BLOOD_FILM_GUIDE: PeripheralBloodFilmGuideItem[] = [
  { finding: 'Microcytes', interpretation: 'Microcytic red cell population.' },
  { finding: 'Hypochromia', interpretation: 'Reduced hemoglobinization.' },
  { finding: 'Anisocytosis', interpretation: 'Variation in RBC size.' },
  { finding: 'Poikilocytosis', interpretation: 'Variation in RBC shape.' },
  { finding: 'Target cells', interpretation: 'May occur in thalassemia and liver disease.' },
  { finding: 'Spherocytes', interpretation: 'Consider hereditary or immune-mediated hemolysis.' },
  { finding: 'Schistocytes', interpretation: 'Suggest red cell fragmentation; quantify and assess urgently in the appropriate context.' },
  { finding: 'Tear drop cells', interpretation: 'Consider marrow infiltration or fibrosis, particularly with other film abnormalities.' },
  { finding: 'Macro-ovalocytes', interpretation: 'Suggestive of megaloblastic hematopoiesis.' },
  { finding: 'Hypersegmented neutrophils', interpretation: 'Consider vitamin B12 or folate deficiency.' },
  { finding: 'Basophilic stippling', interpretation: 'Consider lead toxicity or thalassemia, among other causes.' },
  { finding: 'Polychromasia', interpretation: 'May indicate increased reticulocyte activity.' },
  { finding: 'Nucleated RBCs', interpretation: 'May indicate marrow stress, severe hypoxia or marrow infiltration.' },
  { finding: 'Left shift / Bandemia', interpretation: 'Increased immature band neutrophils (> 5%); consider acute bacterial infection, inflammation, or marrow stress.' }
];

export const ANEMIA_WORKUP_MATRIX = [
  { investigation: 'CBC with differential', value: 'Initial classification and assessment of associated cytopenias.' },
  { investigation: 'Reticulocyte count', value: 'Assesses marrow response: production versus loss/destruction.' },
  { investigation: 'Reticulocyte production index', value: 'Corrects reticulocyte response for anemia severity and maturation.' },
  { investigation: 'Peripheral blood film', value: 'Morphological assessment and detection of abnormal cells.' },
  { investigation: 'Ferritin', value: 'Estimates iron stores; interpret with inflammation.' },
  { investigation: 'Serum iron + TIBC', value: 'Assesses circulating iron and binding capacity.' },
  { investigation: 'Transferrin saturation', value: 'Assesses iron availability.' },
  { investigation: 'Vitamin B12 / folate', value: 'Evaluates megaloblastic and nutritional causes.' },
  { investigation: 'LDH / indirect bilirubin / haptoglobin', value: 'Supports assessment for hemolysis.' },
  { investigation: 'Direct antiglobulin test', value: 'Evaluates immune-mediated red cell destruction.' },
  { investigation: 'Creatinine / eGFR', value: 'Assesses renal contribution.' },
  { investigation: 'CRP / ESR', value: 'Provides inflammatory context.' },
  { investigation: 'Hemoglobin HPLC / electrophoresis', value: 'Evaluates hemoglobin variants and thalassemia patterns.' }
];

export const MEDICAL_INTERPRETATION_LIBRARY: MedicalLibraryEntry[] = [
  // ============================================================================
  // ANEMIA INTERPRETATION GUIDE — MICROCYTIC, NORMOCYTIC, MACROCYTIC & OTHER
  // ============================================================================
  {
    id: 'anemia-ida-2-1',
    source: 'anemia_guide',
    sectionNumber: '2.1',
    sectionEn: 'Microcytic Anemia',
    sectionAr: 'أنيميا صغر حجم الخلايا (Microcytic)',
    conditionEn: 'Iron deficiency anemia (IDA)',
    conditionAr: 'أنيميا نقص الحديد (Iron Deficiency Anemia)',
    profileCodes: ['CBC', 'HB', 'HB_727', 'HCT', 'IRON', 'IRON_PROFILE', 'FERRITIN'],
    keywords: ['cbc', 'anemia', 'iron', 'ferritin', 'hb', 'mcv', 'microcytic', 'ida'],
    typicalPattern: 'Low MCV/MCH, often increased RDW, hypochromia, anisopoikilocytosis',
    suggestedComment:
      'CBC findings are suggestive of microcytic hypochromic anemia, with anisocytosis. The pattern is compatible with iron deficiency anemia.',
    interpretiveNote: 'Ferritin may be falsely normal or elevated during inflammation, infection, liver disease or malignancy.',
    recommendedInvestigations: [
      'Serum ferritin.',
      'Serum iron, TIBC and transferrin saturation.',
      'Assess potential sources of chronic blood loss, including gastrointestinal or menstrual blood loss, as clinically appropriate.',
      'Correlate with dietary history and clinical findings. Confirm iron deficiency with iron studies before treatment.'
    ],
    bloodFilmSuggestion: 'Microcytic hypochromic red blood cells with anisopoikilocytosis and occasional pencil/target cells.'
  },
  {
    id: 'anemia-beta-thal-2-2',
    source: 'anemia_guide',
    sectionNumber: '2.2',
    sectionEn: 'Microcytic Anemia',
    sectionAr: 'أنيميا صغر حجم الخلايا (Microcytic)',
    conditionEn: 'Beta-thalassemia trait',
    conditionAr: 'حامل أنيميا البحر المتوسط بيتا (Beta-Thalassemia Trait)',
    profileCodes: ['CBC', 'HB', 'HB_727', 'HCT', 'IRON', 'IRON_PROFILE'],
    keywords: ['cbc', 'thalassemia', 'beta', 'mentzer', 'microcytic', 'rbc', 'hb', 'hplc'],
    typicalPattern: 'Marked microcytosis, relatively preserved or increased RBC count, target cells may be present',
    suggestedComment:
      'CBC findings reveal microcytosis and hypochromia, with a relatively preserved or elevated RBC count. This pattern raises the possibility of thalassemia trait.',
    interpretiveNote: 'Iron deficiency can lower HbA2 and may complicate interpretation of beta-thalassemia screening.',
    recommendedInvestigations: [
      'Hemoglobin electrophoresis or HPLC.',
      'Quantify HbA2 and HbF.',
      'Serum ferritin to exclude coexisting iron deficiency.',
      'Genetic testing when indicated; correlate with clinical and family history.'
    ],
    bloodFilmSuggestion: 'Microcytosis, hypochromia, target cells and occasional basophilic stippling with relatively high RBC count.'
  },
  {
    id: 'anemia-alpha-thal-2-3',
    source: 'anemia_guide',
    sectionNumber: '2.3',
    sectionEn: 'Microcytic Anemia',
    sectionAr: 'أنيميا صغر حجم الخلايا (Microcytic)',
    conditionEn: 'Alpha-thalassemia trait',
    conditionAr: 'حامل أنيميا البحر المتوسط ألفا (Alpha-Thalassemia Trait)',
    profileCodes: ['CBC', 'HB', 'HB_727', 'HCT', 'IRON'],
    keywords: ['cbc', 'thalassemia', 'alpha', 'microcytic', 'rbc'],
    typicalPattern: 'Persistent microcytosis and hypochromia with relatively preserved RBC count and normal HbA2',
    suggestedComment:
      'Persistent microcytosis and hypochromia with a relatively preserved RBC count may suggest alpha-thalassemia trait, particularly when iron studies are normal and hemoglobin analysis is unremarkable.',
    recommendedInvestigations: [
      'Iron profile.',
      'Alpha-globin gene deletion analysis.',
      'Molecular genetic testing when clinically indicated.'
    ],
    bloodFilmSuggestion: 'Mild microcytosis and hypochromia with occasional target cells.'
  },
  {
    id: 'anemia-aci-micro-2-4',
    source: 'anemia_guide',
    sectionNumber: '2.4',
    sectionEn: 'Microcytic Anemia',
    sectionAr: 'أنيميا صغر حجم الخلايا (Microcytic)',
    conditionEn: 'Anemia of chronic inflammation (Microcytic/Mild)',
    conditionAr: 'أنيميا الأمراض المزمنة والالتهابات (صغيرة/طبيعية الحجم)',
    profileCodes: ['CBC', 'HB', 'HB_727', 'CRP_QUANT', 'SEROLOGY', 'IRON', 'IRON_PROFILE', 'FERRITIN'],
    keywords: ['cbc', 'inflammation', 'chronic', 'crp', 'esr', 'ferritin', 'iron'],
    typicalPattern: 'Usually normocytic; may become mildly microcytic; low serum iron with normal/elevated ferritin',
    suggestedComment:
      'CBC findings are compatible with mild microcytic or normocytic anemia. Anemia of chronic inflammation is a possible consideration in the appropriate clinical setting.',
    recommendedInvestigations: [
      'Serum ferritin, serum iron and transferrin saturation.',
      'CRP and/or ESR.',
      'Assess for chronic inflammatory, infectious or malignant conditions.',
      'Interpret iron studies alongside inflammatory markers.'
    ]
  },
  {
    id: 'anemia-sideroblastic-2-5',
    source: 'anemia_guide',
    sectionNumber: '2.5',
    sectionEn: 'Microcytic Anemia',
    sectionAr: 'أنيميا صغر حجم الخلايا (Microcytic)',
    conditionEn: 'Sideroblastic anemia',
    conditionAr: 'الأنيميا الحديدية الأرومة (Sideroblastic Anemia)',
    profileCodes: ['CBC', 'HB', 'IRON', 'IRON_PROFILE'],
    keywords: ['cbc', 'sideroblastic', 'dimorphic', 'microcytic', 'rdw'],
    typicalPattern: 'Microcytic or dimorphic red cell population; iron stores may be increased',
    suggestedComment:
      'Microcytic anemia or a dimorphic red cell population may raise suspicion of sideroblastic anemia, depending on clinical and biochemical findings.',
    recommendedInvestigations: [
      'Serum iron, ferritin and transferrin saturation.',
      'Peripheral blood film.',
      'Bone marrow examination with iron staining for ring sideroblasts when indicated.',
      'Evaluate medication, alcohol, nutritional and acquired clonal causes.'
    ],
    bloodFilmSuggestion: 'Dimorphic red cell population (microcytic hypochromic mixed with normocytic cells) and Pappenheimer bodies.'
  },
  {
    id: 'anemia-acd-normo-3-1',
    source: 'anemia_guide',
    sectionNumber: '3.1',
    sectionEn: 'Normocytic Anemia',
    sectionAr: 'أنيميا طبيعية الحجم (Normocytic)',
    conditionEn: 'Anemia of chronic disease / inflammation',
    conditionAr: 'أنيميا الأمراض المزمنة والالتهاب (Normocytic)',
    profileCodes: ['CBC', 'HB', 'HB_727', 'CRP_QUANT', 'IRON', 'FERRITIN'],
    keywords: ['cbc', 'normocytic', 'chronic', 'inflammation', 'crp', 'esr'],
    typicalPattern: 'Usually normocytic and normochromic; low serum iron; normal or raised ferritin',
    suggestedComment:
      'The CBC reveals normocytic normochromic anemia. The findings may be consistent with anemia of chronic inflammation in the appropriate clinical context.',
    recommendedInvestigations: [
      'Ferritin, serum iron and transferrin saturation.',
      'CRP and ESR.',
      'Renal and liver function assessment.',
      'Evaluate for underlying inflammatory, infectious or malignant disease; consider concomitant iron deficiency.'
    ]
  },
  {
    id: 'anemia-hemolytic-3-2',
    source: 'anemia_guide',
    sectionNumber: '3.2',
    sectionEn: 'Normocytic Anemia',
    sectionAr: 'أنيميا طبيعية الحجم (Normocytic)',
    conditionEn: 'Hemolytic anemia (Normocytic)',
    conditionAr: 'الأنيميا الانحلالية / تكسير كرات الدم (Hemolytic Anemia)',
    profileCodes: ['CBC', 'HB', 'HB_727', 'LFT'],
    keywords: ['cbc', 'hemolysis', 'hemolytic', 'reticulocyte', 'ldh', 'bilirubin', 'haptoglobin', 'coombs'],
    typicalPattern: 'Reticulocytosis, polychromasia; indirect bilirubin and LDH may increase; reduced haptoglobin',
    suggestedComment:
      'Anemia with possible compensatory reticulocytosis is present. Hemolytic anemia should be considered if supported by peripheral blood film and biochemical findings.',
    interpretiveNote: 'A normal reticulocyte response does not exclude hemolysis in marrow suppression or nutrient deficiency.',
    recommendedInvestigations: [
      'Absolute reticulocyte count and reticulocyte production index.',
      'LDH, indirect bilirubin and haptoglobin.',
      'Direct antiglobulin test (DAT / Direct Coombs test).',
      'Peripheral blood smear; urgent assessment if significant or rapidly progressive hemolysis is suspected.'
    ],
    bloodFilmSuggestion: 'Polychromasia, spherocytes or fragmented red cells (schistocytes), and nucleated RBCs as clinically indicated.'
  },
  {
    id: 'anemia-ckd-3-3',
    source: 'anemia_guide',
    sectionNumber: '3.3',
    sectionEn: 'Normocytic Anemia',
    sectionAr: 'أنيميا طبيعية الحجم (Normocytic)',
    conditionEn: 'Chronic kidney disease-associated anemia',
    conditionAr: 'أنيميا الفشل والقصور الكلوي المزمن (CKD Anemia)',
    profileCodes: ['CBC', 'KFT', 'RFT', 'CREAT', 'UREA', 'HB'],
    keywords: ['cbc', 'ckd', 'kidney', 'renal', 'creatinine', 'egfr', 'normocytic'],
    typicalPattern: 'Usually normocytic and hypoproliferative due to reduced erythropoietin production',
    suggestedComment:
      'Normocytic normochromic anemia may be associated with reduced erythropoietin production in chronic kidney disease.',
    recommendedInvestigations: [
      'Serum creatinine and eGFR.',
      'Ferritin and transferrin saturation.',
      'Reticulocyte count.',
      'Evaluate for additional causes; nephrology consultation according to renal function and anemia severity.'
    ]
  },
  {
    id: 'anemia-aplastic-3-4',
    source: 'anemia_guide',
    sectionNumber: '3.4',
    sectionEn: 'Normocytic Anemia',
    sectionAr: 'أنيميا طبيعية الحجم (Normocytic)',
    conditionEn: 'Aplastic anemia / suspected marrow failure',
    conditionAr: 'أنيميا فشل النخاع العظمي (Aplastic Anemia / Pancytopenia)',
    profileCodes: ['CBC', 'HB', 'HB_727'],
    keywords: ['cbc', 'aplastic', 'pancytopenia', 'marrow', 'thrombocytopenia', 'leukopenia'],
    typicalPattern: 'Anemia with leukopenia and thrombocytopenia (pancytopenia); low reticulocytes',
    suggestedComment:
      'Anemia associated with leukopenia and thrombocytopenia (pancytopenia) raises concern for bone marrow failure.',
    isCriticalEscalation: true,
    recommendedInvestigations: [
      'Repeat CBC with differential and peripheral blood film.',
      'Absolute reticulocyte count.',
      'Bone marrow aspiration and biopsy.',
      'Assess nutritional, infectious, autoimmune and drug-related causes; urgent hematology evaluation.'
    ],
    bloodFilmSuggestion: 'Marked pancytopenia with normocytic normochromic RBCs, neutropenia, thrombocytopenia and absent immature precursors.'
  },
  {
    id: 'anemia-acute-blood-loss-3-5',
    source: 'anemia_guide',
    sectionNumber: '3.5',
    sectionEn: 'Normocytic Anemia',
    sectionAr: 'أنيميا طبيعية الحجم (Normocytic)',
    conditionEn: 'Acute blood loss anemia',
    conditionAr: 'أنيميا النزيف الحاد وفقدان الدم (Acute Blood Loss)',
    profileCodes: ['CBC', 'HB', 'HCT', 'COAG'],
    keywords: ['cbc', 'bleeding', 'blood loss', 'acute', 'normocytic', 'hb'],
    typicalPattern: 'Initially normocytic and normochromic; reticulocytes increase subsequently',
    suggestedComment:
      'The CBC findings may be compatible with anemia secondary to blood loss. Initial red cell indices may remain normocytic and normochromic.',
    recommendedInvestigations: [
      'Assess for active bleeding.',
      'Serial CBC monitoring.',
      'Reticulocyte count during follow-up.',
      'Iron profile if chronic or recurrent blood loss is suspected; investigate the source.'
    ]
  },
  {
    id: 'anemia-mixed-deficiency-3-6',
    source: 'anemia_guide',
    sectionNumber: '3.6',
    sectionEn: 'Normocytic Anemia',
    sectionAr: 'أنيميا طبيعية الحجم (Normocytic)',
    conditionEn: 'Mixed nutritional deficiency',
    conditionAr: 'نقص غذائي مزدوج (الحديد + B12/الفوليك) مع MCV طبيعي',
    profileCodes: ['CBC', 'IRON', 'VITAMINS_MINERALS', 'VIT_B12', 'VITAMINS'],
    keywords: ['cbc', 'mixed', 'rdw', 'normocytic', 'iron', 'b12', 'folate'],
    typicalPattern: 'MCV may remain within reference interval despite elevated RDW and dimorphic red cell population',
    suggestedComment:
      'A normal MCV does not exclude nutritional deficiency. Combined iron and vitamin B12 or folate deficiency may produce a deceptively normal MCV.',
    recommendedInvestigations: [
      'Ferritin and iron profile.',
      'Vitamin B12 and folate.',
      'Peripheral blood film and reticulocyte count.',
      'Further investigation according to clinical findings.'
    ],
    bloodFilmSuggestion: 'Dimorphic red cell population with both microcytic hypochromic cells and macro-ovalocytes, increased RDW.'
  },
  {
    id: 'anemia-b12-4-1',
    source: 'anemia_guide',
    sectionNumber: '4.1',
    sectionEn: 'Macrocytic Anemia',
    sectionAr: 'أنيميا كبر حجم الخلايا (Macrocytic)',
    conditionEn: 'Vitamin B12 deficiency (Megaloblastic)',
    conditionAr: 'أنيميا نقص فيتامين B12',
    profileCodes: ['CBC', 'VITAMINS_MINERALS', 'VITAMINS', 'VIT_B12'],
    keywords: ['cbc', 'b12', 'macrocytic', 'megaloblastic', 'mcv', 'hypersegmented'],
    typicalPattern: 'Macrocytosis (MCV > 100 fL), macro-ovalocytes and hypersegmented neutrophils may be present',
    suggestedComment:
      'CBC findings reveal macrocytic anemia, potentially associated with megaloblastic changes. Vitamin B12 deficiency should be considered.',
    interpretiveNote: 'Neurological B12 deficiency can occur without anemia or macrocytosis; do not delay clinical assessment when neurological signs are present.',
    recommendedInvestigations: [
      'Serum vitamin B12.',
      'Methylmalonic acid (MMA) if B12 is borderline or discordant.',
      'Homocysteine when indicated.',
      'Peripheral blood smear; intrinsic factor antibodies if pernicious anemia is suspected.',
      'Assess neurological symptoms and dietary history; prompt clinical assessment if neurological manifestations are present.'
    ],
    bloodFilmSuggestion: 'Macro-ovalocytes, anisopoikilocytosis and hypersegmented neutrophils (>5 lobes).'
  },
  {
    id: 'anemia-folate-4-2',
    source: 'anemia_guide',
    sectionNumber: '4.2',
    sectionEn: 'Macrocytic Anemia',
    sectionAr: 'أنيميا كبر حجم الخلايا (Macrocytic)',
    conditionEn: 'Folate deficiency (Megaloblastic)',
    conditionAr: 'أنيميا نقص حمض الفوليك (Folate Deficiency)',
    profileCodes: ['CBC', 'VITAMINS_MINERALS', 'VITAMINS'],
    keywords: ['cbc', 'folate', 'folic', 'macrocytic', 'megaloblastic', 'mcv'],
    typicalPattern: 'Megaloblastic blood film; macro-ovalocytes and hypersegmented neutrophils; may resemble B12 deficiency',
    suggestedComment:
      'CBC findings are suggestive of macrocytic megaloblastic anemia, potentially related to folate deficiency.',
    interpretiveNote: 'Treating folate alone in unrecognized B12 deficiency may fail to address neurological risk.',
    recommendedInvestigations: [
      'Serum folate and vitamin B12.',
      'Dietary and medication history.',
      'Peripheral blood smear.',
      'Investigate malabsorption when indicated.',
      'Exclude vitamin B12 deficiency before folate-only treatment.'
    ],
    bloodFilmSuggestion: 'Macro-ovalocytes and hypersegmented neutrophils consistent with megaloblastic erythropoiesis.'
  },
  {
    id: 'anemia-alcohol-4-3',
    source: 'anemia_guide',
    sectionNumber: '4.3',
    sectionEn: 'Macrocytic Anemia',
    sectionAr: 'أنيميا كبر حجم الخلايا (Macrocytic)',
    conditionEn: 'Alcohol-related macrocytosis',
    conditionAr: 'تضخم كرات الدم الحمراء المرتبط بالكحول أو الكبد',
    profileCodes: ['CBC', 'LFT'],
    keywords: ['cbc', 'alcohol', 'macrocytosis', 'ggt', 'liver', 'mcv'],
    typicalPattern: 'Often round macrocytes; liver enzyme abnormalities (GGT) may coexist',
    suggestedComment:
      'Macrocytosis, with or without significant anemia, may be associated with alcohol exposure or related liver dysfunction.',
    recommendedInvestigations: [
      'Liver function tests and GGT.',
      'Vitamin B12 and folate.',
      'Clinical assessment of alcohol exposure.',
      'Repeat CBC after addressing the underlying cause.'
    ]
  },
  {
    id: 'anemia-liver-4-4',
    source: 'anemia_guide',
    sectionNumber: '4.4',
    sectionEn: 'Macrocytic Anemia',
    sectionAr: 'أنيميا كبر حجم الخلايا (Macrocytic)',
    conditionEn: 'Liver disease-associated anemia',
    conditionAr: 'أنيميا أمراض الكبد المزمنة (Liver Disease Anemia)',
    profileCodes: ['CBC', 'LFT', 'ALT', 'AST'],
    keywords: ['cbc', 'liver', 'hepatic', 'macrocytic', 'target', 'lft'],
    typicalPattern: 'Macrocytosis; target cells may occur alongside elevated liver enzymes or bilirubin',
    suggestedComment:
      'Macrocytic anemia with possible target cells may be associated with underlying hepatic dysfunction.',
    recommendedInvestigations: [
      'ALT, AST, ALP and GGT.',
      'Total and direct bilirubin.',
      'Albumin and coagulation profile as clinically indicated.',
      'Vitamin B12 and folate; clinical and imaging correlation when indicated.'
    ],
    bloodFilmSuggestion: 'Round macrocytes and target cells.'
  },
  {
    id: 'anemia-mds-4-5',
    source: 'anemia_guide',
    sectionNumber: '4.5',
    sectionEn: 'Macrocytic Anemia',
    sectionAr: 'أنيميا كبر حجم الخلايا (Macrocytic)',
    conditionEn: 'Myelodysplastic syndrome (MDS)',
    conditionAr: 'متلازمة خلل التنسج النخاعي (MDS)',
    profileCodes: ['CBC'],
    keywords: ['cbc', 'mds', 'myelodysplastic', 'macrocytic', 'cytopenia', 'dysplasia'],
    typicalPattern: 'Unexplained macrocytosis, dysplasia and possible additional cytopenias (neutropenia/thrombocytopenia)',
    suggestedComment:
      'Unexplained macrocytic anemia, particularly with other cytopenias or dysplastic blood film findings, raises the possibility of a myelodysplastic process.',
    isCriticalEscalation: true,
    recommendedInvestigations: [
      'Repeat CBC with differential and peripheral blood film.',
      'Reticulocyte count; vitamin B12, folate and iron studies.',
      'Hematology referral.',
      'Bone marrow examination, cytogenetic and molecular studies when indicated.',
      'Definitive diagnosis requires integrated hematopathological assessment.'
    ],
    bloodFilmSuggestion: 'Macrocytosis, hypogranular neutrophils or Pelger-Huet anomaly, tear drop cells or giant platelets.'
  },
  {
    id: 'anemia-sickle-5-1',
    source: 'anemia_guide',
    sectionNumber: '5.1',
    sectionEn: 'Hemoglobinopathies',
    sectionAr: 'اعتلالات الهيموجلوبين (Hemoglobinopathies)',
    conditionEn: 'Sickle cell disease',
    conditionAr: 'أنيميا الخلايا المنجلية (Sickle Cell Disease)',
    profileCodes: ['CBC', 'HB', 'HB_727'],
    keywords: ['cbc', 'sickle', 'hplc', 'electrophoresis', 'hemoglobinopathy'],
    typicalPattern: 'Normocytic/hemolytic anemia with sickled erythrocytes, target cells and nucleated RBCs on smear',
    suggestedComment:
      'Findings may suggest a hemoglobinopathy; confirm with HPLC or hemoglobin electrophoresis and correlate clinically.',
    recommendedInvestigations: [
      'Hemoglobin HPLC or electrophoresis.',
      'Reticulocyte count, LDH and indirect bilirubin.',
      'Peripheral blood smear and sickling test correlation.'
    ],
    bloodFilmSuggestion: 'Sickle-shaped erythrocytes (drepanocytes), target cells, Howell-Jolly bodies and polychromasia.'
  },
  {
    id: 'anemia-thal-major-5-1',
    source: 'anemia_guide',
    sectionNumber: '5.1',
    sectionEn: 'Hemoglobinopathies',
    sectionAr: 'اعتلالات الهيموجلوبين (Hemoglobinopathies)',
    conditionEn: 'Thalassemia major / Hemoglobinopathy (HbE / HbC)',
    conditionAr: 'الثلاسيميا الكبرى واعتلالات الهيموجلوبين (HbE / HbC)',
    profileCodes: ['CBC', 'HB', 'HB_727'],
    keywords: ['cbc', 'thalassemia', 'major', 'hbe', 'hbc', 'target'],
    typicalPattern: 'Marked microcytic hypochromic anemia, marked anisopoikilocytosis, target cells and nucleated RBCs',
    suggestedComment:
      'Marked microcytic hypochromic anemia; specialist assessment and hemoglobin analysis are required.',
    recommendedInvestigations: [
      'Hemoglobin HPLC / electrophoresis (HbF, HbA2, abnormal bands).',
      'Serum ferritin and iron overload monitoring.',
      'Specialist hematology assessment and genetic correlation.'
    ],
    bloodFilmSuggestion: 'Marked microcytosis, hypochromia, numerous target cells, basophilic stippling and nucleated RBCs.'
  },
  {
    id: 'anemia-g6pd-5-2',
    source: 'anemia_guide',
    sectionNumber: '5.2',
    sectionEn: 'Acquired & Inherited Anemias',
    sectionAr: 'حالات الأنيميا الوراثية والمكتسبة',
    conditionEn: 'G6PD deficiency (Favism)',
    conditionAr: 'أنيميا الفول / نقص إنزيم G6PD',
    profileCodes: ['CBC', 'HB'],
    keywords: ['cbc', 'g6pd', 'favism', 'hemolysis', 'bite'],
    typicalPattern: 'Acute episodic intravascular hemolysis after trigger exposure; bite/blister cells on film',
    suggestedComment:
      'Investigate episodic hemolysis; quantitative G6PD assay is advised. Testing during or soon after hemolysis may be falsely reassuring due to reticulocytosis.',
    recommendedInvestigations: [
      'Quantitative G6PD enzyme assay (repeat after acute hemolytic episode resolves if normal).',
      'Reticulocyte count, LDH, indirect bilirubin and haptoglobin.',
      'Peripheral blood smear for bite cells, blister cells and Heinz bodies.'
    ]
  },
  {
    id: 'anemia-hs-5-2',
    source: 'anemia_guide',
    sectionNumber: '5.2',
    sectionEn: 'Acquired & Inherited Anemias',
    sectionAr: 'حالات الأنيميا الوراثية والمكتسبة',
    conditionEn: 'Hereditary spherocytosis / Autoimmune hemolytic anemia (AIHA)',
    conditionAr: 'تكوّر الخلايا الوراثي / الأنيميا الانحلالية المناعية',
    profileCodes: ['CBC', 'HB'],
    keywords: ['cbc', 'spherocytosis', 'aiha', 'coombs', 'dat', 'mchc'],
    typicalPattern: 'Spherocytes on blood film, elevated MCHC, reticulocytosis, raised LDH/indirect bilirubin',
    suggestedComment:
      'Spherocytes and hemolytic markers suggest hereditary spherocytosis or immune-mediated hemolysis; DAT (Direct Coombs) and confirmatory testing are recommended.',
    recommendedInvestigations: [
      'Direct antiglobulin test (DAT / Direct Coombs), LDH, indirect bilirubin and haptoglobin.',
      'Peripheral blood film review for spherocytes.',
      'EMA binding test or osmotic fragility when hereditary spherocytosis is suspected.'
    ]
  },
  {
    id: 'anemia-tma-ma-5-2',
    source: 'anemia_guide',
    sectionNumber: '5.2',
    sectionEn: 'Acquired & Inherited Anemias',
    sectionAr: 'حالات الأنيميا الوراثية والمكتسبة',
    conditionEn: 'Microangiopathic hemolytic anemia (MAHA / Schistocytes)',
    conditionAr: 'تكسير الدم بالأوعية الدقيقة (MAHA / تفتت كرات الدم)',
    profileCodes: ['CBC', 'COAG'],
    keywords: ['cbc', 'schistocytes', 'maha', 'tma', 'dic', 'thrombocytopenia'],
    typicalPattern: 'Anemia + thrombocytopenia + schistocytes (fragmented red cells) on peripheral smear',
    suggestedComment:
      'Presence of fragmented red cells (schistocytes) with anemia/thrombocytopenia warrants urgent evaluation for thrombotic microangiopathy (TMA) or DIC.',
    isCriticalEscalation: true,
    recommendedInvestigations: [
      'Urgent peripheral blood smear quantification of schistocytes.',
      'PT/INR, aPTT, fibrinogen, D-dimer.',
      'LDH, haptoglobin, renal function (Creatinine/eGFR) and urgent hematology consultation.'
    ],
    bloodFilmSuggestion: 'Marked schistocytes (helmet cells / fragmented RBCs) with thrombocytopenia and polychromasia.'
  },

  // ============================================================================
  // COMMON DISEASES INTERPRETATION LIBRARY — SECTIONS 1 TO 12
  // ============================================================================
  // SECTION 1: HEMATOLOGY
  {
    id: 'cd-1-hem-ida',
    source: 'common_diseases',
    sectionNumber: '1.1',
    sectionEn: 'Hematology',
    sectionAr: 'أمراض الدم (Hematology)',
    conditionEn: 'Iron deficiency anemia (Common Library)',
    conditionAr: 'أنيميا نقص الحديد (التقييم الشامل)',
    profileCodes: ['CBC', 'IRON', 'IRON_PROFILE', 'FERRITIN', 'HB', 'HB_727'],
    keywords: ['cbc', 'iron', 'ferritin', 'tibc', 'ida', 'anemia'],
    typicalPattern: 'Low Hb, low MCV/MCH (may be normal early), increased RDW; low ferritin and transferrin saturation; TIBC often increased.',
    suggestedComment:
      'The red cell indices and iron profile, if confirmed, are compatible with iron deficiency. The underlying cause should be investigated rather than assuming dietary deficiency.',
    interpretiveNote: 'Ferritin may be falsely normal or elevated during inflammation, infection, liver disease or malignancy.',
    recommendedInvestigations: [
      'Ferritin with CRP if inflammation is possible; serum iron, TIBC and transferrin saturation as appropriate.',
      'Assess menstrual, gastrointestinal, urinary and dietary sources of iron loss according to age and clinical context.',
      'Consider coeliac screening or other malabsorption workup when indicated.',
      'Repeat CBC and iron indices after clinician-directed treatment to document response.'
    ]
  },
  {
    id: 'cd-1-hem-thal',
    source: 'common_diseases',
    sectionNumber: '1.2',
    sectionEn: 'Hematology',
    sectionAr: 'أمراض الدم (Hematology)',
    conditionEn: 'Thalassemia trait (Common Library)',
    conditionAr: 'حامل الثلاسيميا (Thalassemia Trait)',
    profileCodes: ['CBC', 'HB', 'HB_727', 'IRON'],
    keywords: ['cbc', 'thalassemia', 'microcytic', 'hplc', 'hbA2'],
    typicalPattern: 'Low MCV/MCH disproportionate to anemia; RBC count often preserved or increased; target cells may occur; iron stores usually not reduced.',
    suggestedComment:
      'Persistent microcytosis with a relatively preserved RBC count may suggest thalassemia trait. Iron deficiency should be excluded and hemoglobin analysis considered.',
    interpretiveNote: 'Iron deficiency can lower HbA2 and may complicate interpretation of beta-thalassemia screening.',
    recommendedInvestigations: [
      'Ferritin and iron profile.',
      'Hb HPLC/electrophoresis with HbA2 and HbF quantification.',
      'Alpha-globin molecular testing if alpha-thalassemia is suspected and routine hemoglobin analysis is unrevealing.',
      'Genetic counseling where reproductive risk is relevant.'
    ]
  },
  {
    id: 'cd-1-hem-b12',
    source: 'common_diseases',
    sectionNumber: '1.3',
    sectionEn: 'Hematology',
    sectionAr: 'أمراض الدم (Hematology)',
    conditionEn: 'Vitamin B12 deficiency (Hematology)',
    conditionAr: 'نقص فيتامين B12 (أمراض الدم)',
    profileCodes: ['CBC', 'VITAMINS_MINERALS', 'VITAMINS', 'VIT_B12'],
    keywords: ['cbc', 'b12', 'macrocytosis', 'hypersegmented'],
    typicalPattern: 'Macrocytosis, macro-ovalocytes, hypersegmented neutrophils; possible leukopenia/thrombocytopenia; B12 low or borderline.',
    suggestedComment:
      'Macrocytosis with compatible blood film findings may be associated with vitamin B12 deficiency. Clinical correlation, including neurological symptoms, is important.',
    interpretiveNote: 'Neurological B12 deficiency can occur without anemia or macrocytosis; do not delay clinical assessment when neurological signs are present.',
    recommendedInvestigations: [
      'Serum B12; methylmalonic acid when B12 is borderline or discordant.',
      'Folate, reticulocyte count and peripheral film.',
      'Intrinsic-factor antibody if pernicious anemia is suspected.',
      'Evaluate dietary intake, medication exposure and malabsorption.'
    ]
  },
  {
    id: 'cd-1-hem-hemolytic',
    source: 'common_diseases',
    sectionNumber: '1.4',
    sectionEn: 'Hematology',
    sectionAr: 'أمراض الدم (Hematology)',
    conditionEn: 'Hemolytic anemia',
    conditionAr: 'الأنيميا الانحلالية (Hemolytic Anemia)',
    profileCodes: ['CBC', 'LFT', 'HB'],
    keywords: ['cbc', 'hemolytic', 'reticulocyte', 'ldh', 'haptoglobin', 'dat'],
    typicalPattern: 'Reticulocytosis, polychromasia, increased LDH and indirect bilirubin, reduced haptoglobin; DAT may be positive or negative.',
    suggestedComment:
      'The combined findings may support increased red cell destruction. The mechanism should be established with hemolysis studies, blood film and immune testing.',
    interpretiveNote: 'A normal reticulocyte response does not exclude hemolysis in marrow suppression or nutrient deficiency.',
    recommendedInvestigations: [
      'Absolute reticulocyte count, LDH, indirect bilirubin and haptoglobin.',
      'DAT; peripheral blood film review.',
      'Urinalysis for hemoglobin when intravascular hemolysis is suspected.',
      'Targeted testing for G6PD deficiency, membrane disorders or hemoglobinopathy when indicated.'
    ]
  },
  {
    id: 'cd-1-hem-thrombocytopenia',
    source: 'common_diseases',
    sectionNumber: '1.5',
    sectionEn: 'Hematology',
    sectionAr: 'أمراض الدم (Hematology)',
    conditionEn: 'Thrombocytopenia',
    conditionAr: 'نقص الصفائح الدموية (Thrombocytopenia)',
    profileCodes: ['CBC', 'COAG'],
    keywords: ['cbc', 'platelet', 'thrombocytopenia', 'clumping', 'citrate'],
    typicalPattern: 'Reduced platelet count; assess smear for clumping, giant platelets or schistocytes.',
    suggestedComment:
      'Thrombocytopenia is present. Confirm the result and assess for platelet clumping, associated cytopenias and abnormal blood film findings.',
    interpretiveNote: 'Unexpected severe thrombocytopenia, bleeding, schistocytes or neurological/renal abnormalities require urgent clinical communication.',
    isCriticalEscalation: true,
    recommendedInvestigations: [
      'Repeat CBC and review peripheral smear; consider citrate sample if EDTA-related clumping is suspected.',
      'Review medications, infection, liver/splenic disease and bleeding symptoms.',
      'Coagulation profile, renal/liver tests and targeted immune/infectious testing as clinically indicated.'
    ],
    bloodFilmSuggestion: 'Confirmed true thrombocytopenia; evaluate for platelet satellitism/clumping, giant platelets or schistocytes.'
  },
  {
    id: 'cd-1-hem-leukocytosis',
    source: 'common_diseases',
    sectionNumber: '1.6',
    sectionEn: 'Hematology',
    sectionAr: 'أمراض الدم (Hematology)',
    conditionEn: 'Leukocytosis / neutrophilia (with possible Left Shift / Bandemia)',
    conditionAr: 'ارتفاع كرات الدم البيضاء والمتعادلات / انحراف لليسار (Left Shift)',
    profileCodes: ['CBC', 'CRP_QUANT', 'SEROLOGY'],
    keywords: ['cbc', 'wbc', 'leukocytosis', 'neutrophilia', 'band', 'left shift', 'infection'],
    typicalPattern: 'Increased WBC, often neutrophils; left shift (Band Cells > 5%) or toxic changes may occur.',
    suggestedComment:
      'Leukocytosis with neutrophilia may be reactive, including infection, inflammation, physiological stress or medication effect. Persistent or unexplained abnormalities warrant further assessment.',
    interpretiveNote: 'Do not infer bacterial infection solely from leukocytosis.',
    recommendedInvestigations: [
      'Repeat CBC with differential and peripheral smear.',
      'Correlate with symptoms, CRP/ESR and suspected infection site.',
      'Review corticosteroids, smoking, stress and recent surgery.',
      'Hematology review and molecular testing if persistent, unexplained or accompanied by basophilia/immature cells.'
    ],
    bloodFilmSuggestion: 'Neutrophilic leukocytosis with left shift (increased band forms), toxic granulations and Dohle bodies.'
  },
  {
    id: 'cd-1-hem-pancytopenia',
    source: 'common_diseases',
    sectionNumber: '1.7',
    sectionEn: 'Hematology',
    sectionAr: 'أمراض الدم (Hematology)',
    conditionEn: 'Pancytopenia',
    conditionAr: 'نقص خلايا الدم الثلاثية (Pancytopenia)',
    profileCodes: ['CBC'],
    keywords: ['cbc', 'pancytopenia', 'bicytopenia', 'marrow', 'blasts'],
    typicalPattern: 'Reduction in Hb, WBC and platelets; reticulocytes may be low.',
    suggestedComment:
      'Pancytopenia is identified. This may reflect reduced marrow production, marrow infiltration, nutritional deficiency, infection, immune causes or sequestration and requires prompt evaluation.',
    interpretiveNote: 'Blasts, severe neutropenia, bleeding, fever or rapidly falling counts require urgent escalation.',
    isCriticalEscalation: true,
    recommendedInvestigations: [
      'Repeat CBC, differential, reticulocyte count and expert blood film review.',
      'B12, folate, ferritin, liver/renal tests and targeted viral testing.',
      'Review medications, toxins, autoimmune history and spleen size.',
      'Urgent hematology assessment; marrow examination when indicated.'
    ]
  },

  // SECTION 2: DIABETES & ENDOCRINOLOGY
  {
    id: 'cd-2-endo-dm',
    source: 'common_diseases',
    sectionNumber: '2.1',
    sectionEn: 'Diabetes & Endocrinology',
    sectionAr: 'السكر والغدد الصماء',
    conditionEn: 'Diabetes mellitus / hyperglycemia',
    conditionAr: 'مرض السكري / ارتفاع سكر الدم (Diabetes Mellitus)',
    profileCodes: ['GLYCEMIC', 'HBA1C', 'GLU_F', 'HOMA', 'OGTT'],
    keywords: ['glucose', 'hba1c', 'diabetes', 'hyperglycemia', 'sugar', 'ogtt'],
    typicalPattern: 'Elevated fasting plasma glucose, random plasma glucose with symptoms, or HbA1c in the diagnostic range.',
    suggestedComment:
      'The glycemic result is in a range that may meet laboratory criteria for diabetes, subject to confirmation in the absence of unequivocal symptomatic hyperglycemia.',
    interpretiveNote:
      'HbA1c may be unreliable in hemolysis, recent blood loss/transfusion, pregnancy, some hemoglobin variants and advanced kidney disease.',
    recommendedInvestigations: [
      'Confirm using repeat HbA1c or plasma glucose according to current diagnostic criteria.',
      'Assess renal function, urine ACR, lipid profile and blood pressure.',
      'Consider ketones and urgent assessment if marked hyperglycemia with symptoms, dehydration or acidosis is suspected.',
      'Review factors affecting HbA1c, including hemoglobin variants, anemia, transfusion and altered RBC survival.'
    ]
  },
  {
    id: 'cd-2-endo-predm',
    source: 'common_diseases',
    sectionNumber: '2.2',
    sectionEn: 'Diabetes & Endocrinology',
    sectionAr: 'السكر والغدد الصماء',
    conditionEn: 'Prediabetes / increased diabetes risk',
    conditionAr: 'مرحلة ما قبل السكري / مقاومة الأنسولين (Prediabetes)',
    profileCodes: ['GLYCEMIC', 'HBA1C', 'GLU_F', 'HOMA', 'OGTT'],
    keywords: ['prediabetes', 'glucose', 'hba1c', 'homa', 'ifg', 'igt'],
    typicalPattern: 'Fasting glucose or HbA1c above normal but below diabetes diagnostic thresholds.',
    suggestedComment:
      'The result indicates increased risk of future diabetes and is compatible with an intermediate hyperglycemic state.',
    interpretiveNote: 'Use the applicable national/WHO/ADA criteria consistently; thresholds differ between some guidelines.',
    recommendedInvestigations: [
      'Repeat or confirm testing according to local guideline and patient risk.',
      'Assess BMI, blood pressure, lipid profile and family history.',
      'Recommend clinician-led lifestyle and cardiovascular risk assessment.',
      'Periodic glycemic monitoring.'
    ]
  },
  {
    id: 'cd-2-endo-hypothyroid',
    source: 'common_diseases',
    sectionNumber: '2.3',
    sectionEn: 'Diabetes & Endocrinology',
    sectionAr: 'السكر والغدد الصماء',
    conditionEn: 'Hypothyroidism',
    conditionAr: 'خمول الغدة الدرقية (Hypothyroidism - الأولي أو تحت الإكلينيكي)',
    profileCodes: ['THYROID', 'TFT', 'TSH', 'FREE_T4', 'FREE_T3'],
    keywords: ['tsh', 'ft4', 'thyroid', 'hypothyroidism'],
    typicalPattern: 'Raised TSH with low FT4 in overt primary hypothyroidism; raised TSH with normal FT4 in subclinical pattern.',
    suggestedComment:
      'The thyroid profile may indicate primary hypothyroidism. Interpretation should consider symptoms, medication and pregnancy status.',
    interpretiveNote: 'High-dose biotin can interfere with some immunoassays; follow assay-specific washout guidance.',
    recommendedInvestigations: [
      'Repeat TSH and FT4 when appropriate.',
      'Anti-TPO antibodies when autoimmune thyroiditis is suspected or results will affect management.',
      'Review biotin use, thyroid medication and acute illness.',
      'Clinical assessment; pregnancy-specific interpretation if relevant.'
    ]
  },
  {
    id: 'cd-2-endo-hyperthyroid',
    source: 'common_diseases',
    sectionNumber: '2.4',
    sectionEn: 'Diabetes & Endocrinology',
    sectionAr: 'السكر والغدد الصماء',
    conditionEn: 'Hyperthyroidism / thyrotoxicosis',
    conditionAr: 'فرط نشاط الغدة الدرقية (Hyperthyroidism / Thyrotoxicosis)',
    profileCodes: ['THYROID', 'TFT', 'TSH', 'FREE_T4', 'FREE_T3'],
    keywords: ['tsh', 'ft4', 'ft3', 'thyroid', 'hyperthyroidism', 'thyrotoxicosis', 'graves'],
    typicalPattern: 'Suppressed TSH with raised FT4 and/or FT3.',
    suggestedComment:
      'The thyroid profile is suggestive of thyrotoxicosis. Further evaluation is needed to establish the cause.',
    interpretiveNote: 'A suppressed TSH alone does not establish overt hyperthyroidism.',
    recommendedInvestigations: [
      'Repeat TSH, FT4 and FT3 as indicated.',
      'TSH-receptor antibodies when Graves disease is suspected.',
      'Review thyroid medication, iodine exposure and biotin use.',
      'Clinical assessment; ECG or imaging based on presentation.'
    ]
  },
  {
    id: 'cd-2-endo-pcos',
    source: 'common_diseases',
    sectionNumber: '2.5',
    sectionEn: 'Diabetes & Endocrinology',
    sectionAr: 'السكر والغدد الصماء',
    conditionEn: 'PCOS-associated endocrine pattern',
    conditionAr: 'نمط متلازمة تكيس المبايض (PCOS Endocrine Pattern)',
    profileCodes: ['FERTILITY', 'LH', 'FSH', 'PROLACTIN'],
    keywords: ['pcos', 'lh', 'fsh', 'testosterone', 'androgen', 'fertility'],
    typicalPattern: 'Possible elevated free androgen index/testosterone, altered LH/FSH ratio in some patients; metabolic risk may coexist.',
    suggestedComment:
      'The biochemical findings may be seen in hyperandrogenism; PCOS is a clinical diagnosis requiring exclusion of alternative causes.',
    interpretiveNote: 'LH/FSH ratio is not diagnostic of PCOS; ultrasound is not required in every adult case.',
    recommendedInvestigations: [
      'Assess total testosterone using a reliable assay; SHBG/free androgen index where appropriate.',
      'Exclude pregnancy, thyroid dysfunction, hyperprolactinemia and non-classic congenital adrenal hyperplasia when indicated.',
      'Assess glucose/HbA1c, lipids and blood pressure.',
      'Correlate with ovulatory history, clinical hyperandrogenism and ovarian assessment.'
    ]
  },
  {
    id: 'cd-2-endo-prolactin',
    source: 'common_diseases',
    sectionNumber: '2.6',
    sectionEn: 'Diabetes & Endocrinology',
    sectionAr: 'السكر والغدد الصماء',
    conditionEn: 'Hyperprolactinemia',
    conditionAr: 'ارتفاع هرمون البرولاكتين (Hyperprolactinemia)',
    profileCodes: ['FERTILITY', 'PROLACTIN'],
    keywords: ['prolactin', 'hyperprolactinemia', 'fertility', 'pituitary'],
    typicalPattern: 'Elevated prolactin; may be mild or marked.',
    suggestedComment:
      'Prolactin is elevated. Physiological, medication-related, thyroid, renal and pituitary causes should be considered.',
    interpretiveNote: 'Interpret against sex-, pregnancy- and assay-specific reference intervals.',
    recommendedInvestigations: [
      'Repeat a mildly elevated result under rested, low-stress conditions, following local collection guidance.',
      'Review pregnancy, lactation and prolactin-raising medications.',
      'Check TSH and renal function; consider macroprolactin testing.',
      'Endocrinology assessment and pituitary imaging when clinically indicated.'
    ]
  },

  // SECTION 3: LIVER DISEASES
  {
    id: 'cd-3-liv-hepatocellular',
    source: 'common_diseases',
    sectionNumber: '3.1',
    sectionEn: 'Liver Diseases',
    sectionAr: 'أمراض الكبد والقنوات المرارية',
    conditionEn: 'Hepatocellular injury pattern',
    conditionAr: 'إصابة خلايا الكبد وارتفاع الإنزيمات (Hepatocellular Injury)',
    profileCodes: ['LFT', 'ALT', 'AST'],
    keywords: ['alt', 'ast', 'lft', 'liver', 'hepatocellular', 'transaminase'],
    typicalPattern: 'ALT/AST disproportionately elevated compared with ALP.',
    suggestedComment:
      'The enzyme pattern indicates hepatocellular injury. Laboratory results do not determine etiology or establish liver function by themselves.',
    interpretiveNote: 'AST may also arise from muscle; consider CK if clinically relevant.',
    recommendedInvestigations: [
      'Review medications, supplements, alcohol and metabolic risk factors.',
      'Viral hepatitis testing according to exposure and local protocol.',
      'Assess bilirubin, albumin, INR and platelet count where appropriate.',
      'Ultrasound and further autoimmune/metabolic testing according to degree and persistence.'
    ]
  },
  {
    id: 'cd-3-liv-cholestatic',
    source: 'common_diseases',
    sectionNumber: '3.2',
    sectionEn: 'Liver Diseases',
    sectionAr: 'أمراض الكبد والقنوات المرارية',
    conditionEn: 'Cholestatic pattern',
    conditionAr: 'النمط الركودي / انسداد القنوات المرارية (Cholestatic Pattern)',
    profileCodes: ['LFT', 'ALT', 'AST'],
    keywords: ['alp', 'ggt', 'bilirubin', 'cholestatic', 'cholestasis', 'lft'],
    typicalPattern: 'ALP and GGT elevated, sometimes with conjugated bilirubin.',
    suggestedComment:
      'The biochemical pattern may indicate cholestasis. Hepatobiliary and non-hepatic causes of ALP elevation should be considered.',
    interpretiveNote: 'Isolated ALP elevation may be bone-derived, especially in growing children or bone disease.',
    recommendedInvestigations: [
      'Confirm hepatic source with GGT or ALP isoenzymes if needed.',
      'Bilirubin and liver synthetic function assessment.',
      'Hepatobiliary ultrasound; further imaging based on clinical assessment.',
      'Review medications and consider autoimmune cholestatic testing when persistent.'
    ]
  },
  {
    id: 'cd-3-liv-hbv',
    source: 'common_diseases',
    sectionNumber: '3.3',
    sectionEn: 'Liver Diseases',
    sectionAr: 'أمراض الكبد والقنوات المرارية',
    conditionEn: 'Hepatitis B infection assessment',
    conditionAr: 'تقييم دلالات التهاب الكبد الفيروسي B',
    profileCodes: ['VIRAL', 'SEROLOGY', 'LFT'],
    keywords: ['hbsag', 'hbv', 'hepatitis b', 'viral'],
    typicalPattern: 'HBsAg, anti-HBc, anti-HBs and HBV DNA patterns determine infection/immunity status.',
    suggestedComment:
      'Hepatitis B serology requires interpretation as a complete marker profile. A single marker should not be used alone to stage infection.',
    interpretiveNote: 'Distinguish current infection, resolved infection, vaccine immunity and isolated anti-HBc patterns.',
    recommendedInvestigations: [
      'Complete HBV serology: HBsAg, total anti-HBc and anti-HBs; IgM anti-HBc if acute infection is suspected.',
      'HBV DNA, HBeAg/anti-HBe and liver profile as clinically indicated.',
      'Assess fibrosis and refer for specialist review according to results.',
      'Use confirmatory testing for reactive screening assays per assay and national protocol.'
    ]
  },
  {
    id: 'cd-3-liv-hcv',
    source: 'common_diseases',
    sectionNumber: '3.4',
    sectionEn: 'Liver Diseases',
    sectionAr: 'أمراض الكبد والقنوات المرارية',
    conditionEn: 'Hepatitis C screening',
    conditionAr: 'فحص فيروس الكبد الوبائي C (HCV)',
    profileCodes: ['VIRAL', 'SEROLOGY', 'LFT'],
    keywords: ['hcv', 'hepatitis c', 'viral', 'rna'],
    typicalPattern: 'Reactive anti-HCV antibody indicates exposure; it does not prove current viremia.',
    suggestedComment:
      'A reactive anti-HCV antibody result indicates previous or current exposure. Active infection should be assessed with HCV RNA.',
    interpretiveNote: 'Anti-HCV can remain positive after spontaneous clearance or successful treatment.',
    recommendedInvestigations: [
      'HCV RNA testing to confirm current infection.',
      'Liver profile and fibrosis assessment if RNA positive.',
      'Review previous treatment and exposure history.',
      'Specialist referral for confirmed viremia.'
    ]
  },
  {
    id: 'cd-3-liv-masld',
    source: 'common_diseases',
    sectionNumber: '3.5',
    sectionEn: 'Liver Diseases',
    sectionAr: 'أمراض الكبد والقنوات المرارية',
    conditionEn: 'Metabolic dysfunction-associated steatotic liver disease (MASLD)',
    conditionAr: 'الكبد الدهني المرتبط بالتمثيل الغذائي (MASLD / Fatty Liver)',
    profileCodes: ['LFT', 'LIPID', 'GLYCEMIC', 'ALT', 'AST'],
    keywords: ['masld', 'nafld', 'fatty liver', 'alt', 'ast', 'fib-4'],
    typicalPattern: 'Mild ALT/AST abnormalities may occur; enzymes can be normal despite steatosis/fibrosis.',
    suggestedComment:
      'The findings may coexist with metabolic risk factors and could be compatible with steatotic liver disease; enzymes alone cannot diagnose or stage it.',
    interpretiveNote: 'Normal aminotransferases do not exclude significant fibrosis.',
    recommendedInvestigations: [
      'Assess BMI/waist, diabetes, lipids and blood pressure.',
      'Exclude alcohol and other causes of liver disease as appropriate.',
      'Ultrasound and non-invasive fibrosis risk assessment (e.g., FIB-4) according to guideline.',
      'Clinical follow-up for metabolic risk reduction.'
    ]
  },

  // SECTION 4: KIDNEY DISEASES
  {
    id: 'cd-4-kid-aki',
    source: 'common_diseases',
    sectionNumber: '4.1',
    sectionEn: 'Kidney Diseases',
    sectionAr: 'أمراض الكلى والمسالك',
    conditionEn: 'Acute kidney injury (AKI)',
    conditionAr: 'القصور الكلوي الحاد (Acute Kidney Injury)',
    profileCodes: ['KFT', 'RFT', 'CREAT', 'UREA', 'CALCIUM_ELEC', 'ELEC'],
    keywords: ['aki', 'creatinine', 'urea', 'kidney', 'potassium', 'renal'],
    typicalPattern: 'Rise in serum creatinine from baseline and/or reduced urine output by accepted criteria.',
    suggestedComment:
      'The creatinine change may indicate acute kidney injury when compared with baseline and clinical urine output. Prompt clinical correlation is required.',
    interpretiveNote: 'A single elevated creatinine without baseline cannot reliably distinguish AKI from CKD.',
    recommendedInvestigations: [
      'Compare with prior creatinine and assess urine output.',
      'Review hydration, blood pressure, medications and possible obstruction.',
      'Urinalysis, urine microscopy and renal imaging when indicated.',
      'Electrolytes, bicarbonate and urgent assessment for hyperkalemia, acidosis, pulmonary edema or uremic features.'
    ]
  },
  {
    id: 'cd-4-kid-ckd',
    source: 'common_diseases',
    sectionNumber: '4.2',
    sectionEn: 'Kidney Diseases',
    sectionAr: 'أمراض الكلى والمسالك',
    conditionEn: 'Chronic kidney disease (CKD)',
    conditionAr: 'القصور الكلوي المزمن (Chronic Kidney Disease)',
    profileCodes: ['KFT', 'RFT', 'CREAT', 'UREA', 'ACR', 'MICROALBUMIN'],
    keywords: ['ckd', 'egfr', 'creatinine', 'acr', 'kidney'],
    typicalPattern: 'eGFR below 60 mL/min/1.73 m2 and/or markers of kidney damage persisting for at least 3 months.',
    suggestedComment:
      'The eGFR result should be interpreted with urine albumin and prior results. CKD requires evidence of chronicity or persistent kidney damage.',
    interpretiveNote: 'Do not label CKD from one isolated low eGFR unless chronicity or other evidence is established.',
    recommendedInvestigations: [
      'Repeat eGFR and urine ACR to establish persistence and risk category.',
      'Urinalysis and microscopy; review blood pressure and diabetes.',
      'Medication review and renal ultrasound when indicated.',
      'Use age-appropriate eGFR equation and refer according to risk, progression and local guideline.'
    ]
  },
  {
    id: 'cd-4-kid-albuminuria',
    source: 'common_diseases',
    sectionNumber: '4.3',
    sectionEn: 'Kidney Diseases',
    sectionAr: 'أمراض الكلى والمسالك',
    conditionEn: 'Albuminuria / proteinuria',
    conditionAr: 'زلال البول / البروتين في البول (Albuminuria / ACR)',
    profileCodes: ['ACR', 'MICROALBUMIN', 'URINE', 'KFT', 'RFT'],
    keywords: ['acr', 'pcr', 'albumin', 'proteinuria', 'microalbumin', 'urine'],
    typicalPattern: 'Elevated urine ACR or PCR; dipstick protein may be affected by concentration and pH.',
    suggestedComment:
      'Protein detected in urine requires quantification and assessment for transient or persistent causes.',
    interpretiveNote: 'Dipstick protein is a screening test and does not replace quantitative ACR/PCR.',
    recommendedInvestigations: [
      'Repeat first-morning urine ACR/PCR when appropriate.',
      'Urinalysis and microscopy; assess infection, fever, exercise and menstruation.',
      'Check serum creatinine/eGFR and blood pressure.',
      'Further renal workup if persistent, substantial or accompanied by hematuria.'
    ]
  },
  {
    id: 'cd-4-kid-uti',
    source: 'common_diseases',
    sectionNumber: '4.4',
    sectionEn: 'Kidney Diseases',
    sectionAr: 'أمراض الكلى والمسالك',
    conditionEn: 'Urinary tract infection (UTI)',
    conditionAr: 'عدوى المسالك البولية (Urinary Tract Infection)',
    profileCodes: ['URINE', 'CULTURE', 'URINE_CULTURE'],
    keywords: ['uti', 'urine', 'pyuria', 'nitrite', 'culture', 'pus', 'bacteriuria'],
    typicalPattern: 'Pyuria, leukocyte esterase, nitrite and bacteriuria may support UTI; culture identifies organism and susceptibility.',
    suggestedComment:
      'Urinalysis findings may support urinary tract inflammation or infection. Diagnosis requires compatible symptoms and, where indicated, urine culture.',
    interpretiveNote: 'Bacteriuria or pyuria alone does not always require treatment; asymptomatic bacteriuria has specific exceptions.',
    recommendedInvestigations: [
      'Urine culture before antibiotics when indicated, especially in complicated infection, pregnancy, recurrence or treatment failure.',
      'Interpret microscopy and culture with collection quality and symptoms.',
      'Assess renal function and systemic features if upper UTI is suspected.',
      'Clinical review for fever, flank pain, pregnancy, male patient or sepsis features.'
    ]
  },

  // SECTION 5: CARDIOVASCULAR & METABOLIC RISK
  {
    id: 'cd-5-cv-dyslipidemia',
    source: 'common_diseases',
    sectionNumber: '5.1',
    sectionEn: 'Cardiovascular & Metabolic Risk',
    sectionAr: 'الدهون ومخاطر القلب والتمثيل الغذائي',
    conditionEn: 'Dyslipidemia',
    conditionAr: 'اضطراب دهون الدم (Dyslipidemia)',
    profileCodes: ['LIPID', 'CHOL', 'APO_A1', 'APO_B', 'CARDIAC'],
    keywords: ['lipid', 'cholesterol', 'ldl', 'hdl', 'triglycerides', 'dyslipidemia'],
    typicalPattern: 'Elevated LDL-C/non-HDL-C or triglycerides and/or low HDL-C.',
    suggestedComment:
      'The lipid profile shows an atherogenic lipid abnormality. Cardiovascular risk and treatment targets should be individualized.',
    interpretiveNote: "A laboratory reference interval is not the same as an individual's cardiovascular treatment target.",
    recommendedInvestigations: [
      'Assess overall ASCVD risk, diabetes, CKD, smoking and blood pressure.',
      'Consider repeat fasting lipid profile if triglycerides are markedly elevated or sample context is uncertain.',
      'Evaluate secondary causes: hypothyroidism, diabetes, kidney/liver disease and medications.',
      'Clinician-directed lifestyle and lipid-lowering management; follow-up lipid profile.'
    ]
  },
  {
    id: 'cd-5-cv-htg',
    source: 'common_diseases',
    sectionNumber: '5.2',
    sectionEn: 'Cardiovascular & Metabolic Risk',
    sectionAr: 'الدهون ومخاطر القلب والتمثيل الغذائي',
    conditionEn: 'Hypertriglyceridemia',
    conditionAr: 'ارتفاع الدهون الثلاثية (Hypertriglyceridemia)',
    profileCodes: ['LIPID', 'CHOL', 'CARDIAC'],
    keywords: ['triglycerides', 'lipid', 'pancreatitis', 'vldl'],
    typicalPattern: 'Elevated triglycerides; severe elevation increases pancreatitis risk.',
    suggestedComment:
      'Triglycerides are elevated. The degree of elevation and fasting status should guide clinical urgency and further assessment.',
    interpretiveNote: 'Do not calculate LDL-C using equations when triglycerides exceed the validated range.',
    recommendedInvestigations: [
      'Confirm fasting status and repeat if appropriate.',
      'Assess glycemic control, alcohol, hypothyroidism, renal disease and medications.',
      'Review LDL/non-HDL cholesterol and overall cardiovascular risk.',
      'Very high levels, especially around or above 500 mg/dL, warrant prompt clinician assessment; pancreatitis symptoms require urgent care.'
    ]
  },
  {
    id: 'cd-5-cv-hscrp',
    source: 'common_diseases',
    sectionNumber: '5.3',
    sectionEn: 'Cardiovascular & Metabolic Risk',
    sectionAr: 'الدهون ومخاطر القلب والتمثيل الغذائي',
    conditionEn: 'Elevated hs-CRP',
    conditionAr: 'ارتفاع مؤشر الالتهاب عالي الحساسية (hs-CRP)',
    profileCodes: ['CARDIAC', 'HS_CRP', 'CRP_QUANT', 'LIPID'],
    keywords: ['hs-crp', 'crp', 'cardiac', 'inflammation'],
    typicalPattern: 'Increased high-sensitivity CRP; nonspecific inflammatory marker.',
    suggestedComment:
      'The hs-CRP result is elevated and may reflect inflammation or infection. Cardiovascular risk interpretation should be deferred during acute illness.',
    interpretiveNote: 'hs-CRP is not a stand-alone cardiovascular screening or diagnostic test.',
    recommendedInvestigations: [
      'Repeat when clinically stable if used for cardiovascular risk assessment.',
      'Assess for acute infection, inflammatory disease and other causes.',
      'Integrate with established cardiovascular risk factors rather than using alone.'
    ]
  },

  // SECTION 6: INFLAMMATORY & AUTOIMMUNE DISEASES
  {
    id: 'cd-6-auto-ra',
    source: 'common_diseases',
    sectionNumber: '6.1',
    sectionEn: 'Inflammatory & Autoimmune Diseases',
    sectionAr: 'أمراض المناعة الذاتية والالتهابات',
    conditionEn: 'Rheumatoid arthritis (RA)',
    conditionAr: 'التهاب المفاصل الروماتويدي (Rheumatoid Arthritis)',
    profileCodes: ['AUTOIMMUNE', 'RF_QUANT', 'CRP_QUANT', 'SEROLOGY', 'ASOT'],
    keywords: ['rf', 'anti-ccp', 'ra', 'rheumatoid', 'esr', 'crp'],
    typicalPattern: 'RF and/or anti-CCP may be positive; ESR/CRP may be elevated; CBC may show inflammatory anemia.',
    suggestedComment:
      'Serological and inflammatory findings may support RA in a compatible clinical setting but are not diagnostic without clinical assessment.',
    interpretiveNote: 'Negative RF/anti-CCP does not exclude RA; positive RF can occur in other conditions and healthy individuals.',
    recommendedInvestigations: [
      'Anti-CCP and RF interpreted with joint symptoms and examination.',
      'ESR/CRP for inflammatory activity; CBC and liver/renal baseline before treatment.',
      'Rheumatology assessment and imaging when indicated.'
    ]
  },
  {
    id: 'cd-6-auto-sle',
    source: 'common_diseases',
    sectionNumber: '6.2',
    sectionEn: 'Inflammatory & Autoimmune Diseases',
    sectionAr: 'أمراض المناعة الذاتية والالتهابات',
    conditionEn: 'Systemic lupus erythematosus (SLE)',
    conditionAr: 'الذئبة الحمراء الجهازية (SLE)',
    profileCodes: ['AUTOIMMUNE', 'SEROLOGY'],
    keywords: ['ana', 'dsdna', 'sle', 'lupus', 'complement', 'c3', 'c4'],
    typicalPattern: 'ANA often positive; anti-dsDNA/Sm and complement may support; cytopenias, proteinuria or hematuria may occur.',
    suggestedComment:
      'The findings may warrant evaluation for systemic autoimmune disease when supported by clinical features. ANA alone is not diagnostic.',
    interpretiveNote: 'Low-titer ANA positivity is common and must be interpreted in context.',
    recommendedInvestigations: [
      'ANA by validated method with titer/pattern where available.',
      'If clinically indicated: anti-dsDNA, ENA profile, C3/C4.',
      'CBC, creatinine/eGFR, urinalysis and urine protein quantification.',
      'Clinical assessment for organ involvement; urgent review if renal, neurological, cardiopulmonary or hematologic complications are suspected.'
    ]
  },
  {
    id: 'cd-6-auto-vasculitis',
    source: 'common_diseases',
    sectionNumber: '6.3',
    sectionEn: 'Inflammatory & Autoimmune Diseases',
    sectionAr: 'أمراض المناعة الذاتية والالتهابات',
    conditionEn: 'Vasculitis / systemic inflammation',
    conditionAr: 'التهاب الأوعية الدموية والالتهاب الجهازي (Vasculitis)',
    profileCodes: ['AUTOIMMUNE', 'CRP_QUANT'],
    keywords: ['anca', 'vasculitis', 'esr', 'crp', 'pr3', 'mpo'],
    typicalPattern: 'ESR/CRP may be elevated; ANCA may be positive in selected vasculitides.',
    suggestedComment:
      'Inflammatory markers are nonspecific. Vasculitis requires integration of clinical presentation, organ assessment, serology and sometimes tissue diagnosis.',
    interpretiveNote: 'ANCA positivity alone does not establish vasculitis.',
    recommendedInvestigations: [
      'Targeted ANCA (PR3/MPO) only when clinical suspicion exists.',
      'Urinalysis, renal function, CBC and inflammatory markers.',
      'Further imaging or biopsy according to suspected organ involvement.',
      'Urgent specialist assessment for pulmonary hemorrhage, rapidly progressive renal dysfunction or ischemic features.'
    ]
  },
  {
    id: 'cd-6-auto-celiac',
    source: 'common_diseases',
    sectionNumber: '6.4',
    sectionEn: 'Inflammatory & Autoimmune Diseases',
    sectionAr: 'أمراض المناعة الذاتية والالتهابات',
    conditionEn: 'Celiac disease',
    conditionAr: 'حساسية القمح / الداء البطني (Celiac Disease)',
    profileCodes: ['AUTOIMMUNE', 'SEROLOGY', 'IRON'],
    keywords: ['celiac', 'ttg', 'iga', 'gluten', 'malabsorption'],
    typicalPattern: 'tTG-IgA may be elevated; total IgA is needed to identify IgA deficiency; iron deficiency may be a clue.',
    suggestedComment:
      'The serology may suggest celiac disease in a patient consuming gluten. Confirmation should follow the appropriate gastroenterology pathway.',
    interpretiveNote: 'Starting a gluten-free diet before testing may reduce test sensitivity.',
    recommendedInvestigations: [
      'tTG-IgA and total serum IgA.',
      'Use IgG-based tests if IgA deficient.',
      'Maintain gluten intake until diagnostic testing is complete unless specialist directs otherwise.',
      'Gastroenterology referral and biopsy when indicated by age and guideline.'
    ]
  },

  // SECTION 7: COMMON INFECTIOUS DISEASES
  {
    id: 'cd-7-inf-bacterial',
    source: 'common_diseases',
    sectionNumber: '7.1',
    sectionEn: 'Common Infectious Diseases',
    sectionAr: 'الأمراض المعدية والعدوى البكتيرية',
    conditionEn: 'Bacterial infection / systemic inflammation',
    conditionAr: 'العدوى البكتيرية والالتهاب الجهازي',
    profileCodes: ['CRP_QUANT', 'SEROLOGY', 'CBC', 'CULTURE', 'ASOT'],
    keywords: ['crp', 'procalcitonin', 'bacterial', 'infection', 'wbc', 'neutrophil'],
    typicalPattern: 'WBC/neutrophil changes, CRP and procalcitonin may rise; patterns are nonspecific.',
    suggestedComment:
      'The inflammatory profile may be compatible with infection but cannot identify the site or organism. Clinical assessment and microbiology are required.',
    interpretiveNote: 'Normal WBC or CRP does not exclude early or localized infection.',
    recommendedInvestigations: [
      'Culture the relevant specimen before antimicrobial therapy when feasible and clinically appropriate.',
      'Use CRP/procalcitonin trends only as adjuncts to clinical assessment.',
      'Assess lactate, renal function and blood cultures if sepsis is suspected.',
      'Do not use isolated leukocytosis or CRP to prescribe antibiotics.'
    ]
  },
  {
    id: 'cd-7-inf-uti',
    source: 'common_diseases',
    sectionNumber: '7.2',
    sectionEn: 'Common Infectious Diseases',
    sectionAr: 'الأمراض المعدية والعدوى البكتيرية',
    conditionEn: 'Urinary infection (Culture & Sensitivity)',
    conditionAr: 'مزرعة وعدوى المسالك البولية (Urinary Infection)',
    profileCodes: ['CULTURE', 'URINE_CULTURE', 'URINE'],
    keywords: ['culture', 'urine', 'uti', 'colony', 'susceptibility'],
    typicalPattern: 'Urine leukocytes, nitrite, bacteriuria; culture may show significant growth.',
    suggestedComment:
      'Urine findings may support UTI when symptoms are present. Culture and susceptibility testing are recommended in selected patients.',
    interpretiveNote:
      'Asymptomatic bacteriuria is generally not treated except in specific guideline-defined situations such as pregnancy or before selected urologic procedures.',
    recommendedInvestigations: [
      'Urine culture for pregnancy, complicated/recurrent infection, males, pyelonephritis or treatment failure.',
      'Ensure clean-catch collection and assess contamination.',
      'Clinical evaluation for systemic symptoms and renal involvement.'
    ]
  },
  {
    id: 'cd-7-inf-hepatitis',
    source: 'common_diseases',
    sectionNumber: '7.3',
    sectionEn: 'Common Infectious Diseases',
    sectionAr: 'الأمراض المعدية والعدوى البكتيرية',
    conditionEn: 'Hepatitis B / C screening',
    conditionAr: 'المسح الفيروسي للكبد B و C',
    profileCodes: ['VIRAL', 'SEROLOGY'],
    keywords: ['hbv', 'hcv', 'viral', 'screening'],
    typicalPattern: 'HBV serology and HCV antibody/RNA patterns.',
    suggestedComment:
      'Screening markers require reflex confirmatory testing and interpretation as a profile rather than in isolation.',
    interpretiveNote: 'Follow local reporting and public-health requirements.',
    recommendedInvestigations: [
      'Follow current national screening and confirmatory algorithms.',
      'HBV: complete serology and HBV DNA when indicated.',
      'HCV: reflex HCV RNA after reactive antibody.',
      'Counsel on prevention and specialist referral for confirmed active infection.'
    ]
  },
  {
    id: 'cd-7-inf-hpylori',
    source: 'common_diseases',
    sectionNumber: '7.4',
    sectionEn: 'Common Infectious Diseases',
    sectionAr: 'الأمراض المعدية والعدوى البكتيرية',
    conditionEn: 'H. pylori infection',
    conditionAr: 'عدوى جرثومة المعدة (H. pylori)',
    profileCodes: ['STOOL', 'HP_STOOL_AG', 'SEROLOGY'],
    keywords: ['pylori', 'h.pylori', 'stool', 'antigen', 'breath'],
    typicalPattern: 'Stool antigen or urea breath test may identify active infection; serology may reflect past exposure.',
    suggestedComment:
      'A positive validated stool antigen or urea breath test may indicate active H. pylori infection in the appropriate context.',
    interpretiveNote: 'Serology is not suitable for confirming eradication because antibodies may persist.',
    recommendedInvestigations: [
      'Use stool antigen or urea breath testing for active infection and test of cure.',
      'Follow assay-specific and guideline medication washout requirements, including PPIs and antibiotics/bismuth.',
      'Confirm eradication after treatment at the recommended interval.',
      'Refer for alarm symptoms or suspected complications.'
    ]
  },
  {
    id: 'cd-7-inf-malaria',
    source: 'common_diseases',
    sectionNumber: '7.5',
    sectionEn: 'Common Infectious Diseases',
    sectionAr: 'الأمراض المعدية والعدوى البكتيرية',
    conditionEn: 'Malaria',
    conditionAr: 'الملاريا (Malaria)',
    profileCodes: ['CBC', 'SEROLOGY'],
    keywords: ['malaria', 'parasite', 'film', 'thrombocytopenia'],
    typicalPattern: 'Parasites on thick/thin blood films or positive rapid antigen test; anemia/thrombocytopenia may coexist.',
    suggestedComment:
      'The findings require parasitological confirmation and urgent clinical correlation if malaria is suspected.',
    interpretiveNote: 'A negative single test may not exclude malaria in a high-suspicion case.',
    recommendedInvestigations: [
      'Thick and thin blood films with parasite identification and density.',
      'Repeat films if initial result is negative but suspicion remains, according to protocol.',
      'Rapid diagnostic test or PCR where appropriate.',
      'Urgent clinical assessment for suspected severe malaria.'
    ]
  },

  // SECTION 8: NUTRITIONAL & MINERAL DISORDERS
  {
    id: 'cd-8-nut-vitd',
    source: 'common_diseases',
    sectionNumber: '8.1',
    sectionEn: 'Nutritional & Mineral Disorders',
    sectionAr: 'اضطرابات التغذية والفيتامينات والمعادن',
    conditionEn: 'Vitamin D deficiency',
    conditionAr: 'نقص فيتامين د (Vitamin D Deficiency)',
    profileCodes: ['VITAMINS_MINERALS', 'VITAMINS', 'VIT_D', 'CALCIUM_ELEC'],
    keywords: ['vitamin d', '25-oh', 'vitd', 'calcium', 'pth'],
    typicalPattern: 'Low 25-OH vitamin D; calcium/phosphate/ALP/PTH may vary.',
    suggestedComment:
      "The 25-hydroxyvitamin D concentration is below the laboratory's reference or decision threshold. Interpret with bone/mineral status and clinical risk.",
    interpretiveNote: 'Threshold definitions differ among authorities; report the method and laboratory decision limits.',
    recommendedInvestigations: [
      'Use 25-OH vitamin D as the status test; 1,25-dihydroxyvitamin D is not a routine deficiency test.',
      'Consider calcium, phosphate, ALP, PTH and renal function when clinically indicated.',
      'Assess malabsorption, low intake, limited sun exposure and relevant medications.',
      'Treatment and repeat testing should follow clinician assessment and local guideline.'
    ]
  },
  {
    id: 'cd-8-nut-idwa',
    source: 'common_diseases',
    sectionNumber: '8.2',
    sectionEn: 'Nutritional & Mineral Disorders',
    sectionAr: 'اضطرابات التغذية والفيتامينات والمعادن',
    conditionEn: 'Iron deficiency without anemia',
    conditionAr: 'نقص مخزون الحديد بدون أنيميا (نقص الفيريتين)',
    profileCodes: ['IRON', 'IRON_PROFILE', 'FERRITIN'],
    keywords: ['ferritin', 'iron', 'transferrin', 'latent'],
    typicalPattern: 'Low ferritin or transferrin saturation with normal Hb.',
    suggestedComment:
      'Iron stores may be depleted despite hemoglobin remaining within range. The cause and clinical relevance should be assessed.',
    interpretiveNote: 'Ferritin can be elevated by inflammation and may mask depleted iron stores.',
    recommendedInvestigations: [
      'Ferritin and transferrin saturation; consider CRP.',
      'Investigate blood loss, diet and malabsorption based on patient context.',
      'Follow ferritin and CBC after clinician-directed intervention.'
    ]
  },
  {
    id: 'cd-8-nut-hypocalcemia',
    source: 'common_diseases',
    sectionNumber: '8.3',
    sectionEn: 'Nutritional & Mineral Disorders',
    sectionAr: 'اضطرابات التغذية والفيتامينات والمعادن',
    conditionEn: 'Hypocalcemia',
    conditionAr: 'نقص الكالسيوم في الدم (Hypocalcemia)',
    profileCodes: ['CALCIUM_ELEC', 'CALCIUM_TOTAL', 'ELEC', 'VITAMINS_MINERALS'],
    keywords: ['calcium', 'hypocalcemia', 'ionized', 'magnesium', 'pth'],
    typicalPattern: 'Low total calcium; assess albumin-corrected calcium or ionized calcium.',
    suggestedComment:
      'The total calcium is low. Confirmation with albumin-adjusted or ionized calcium is recommended before interpretation.',
    interpretiveNote: 'Correction formulas are estimates and may be inaccurate in critical illness, renal disease or major acid-base disturbance.',
    recommendedInvestigations: [
      'Repeat calcium with albumin or measure ionized calcium.',
      'Check magnesium, phosphate, PTH, 25-OH vitamin D and renal function as indicated.',
      'Urgent assessment for tetany, seizures, arrhythmia or significant symptomatic hypocalcemia.'
    ]
  },
  {
    id: 'cd-8-nut-hypercalcemia',
    source: 'common_diseases',
    sectionNumber: '8.4',
    sectionEn: 'Nutritional & Mineral Disorders',
    sectionAr: 'اضطرابات التغذية والفيتامينات والمعادن',
    conditionEn: 'Hypercalcemia',
    conditionAr: 'ارتفاع الكالسيوم في الدم (Hypercalcemia)',
    profileCodes: ['CALCIUM_ELEC', 'CALCIUM_TOTAL', 'ELEC'],
    keywords: ['calcium', 'hypercalcemia', 'pth', 'hyperparathyroidism'],
    typicalPattern: 'Raised total or ionized calcium.',
    suggestedComment:
      'Calcium is elevated and should be confirmed. The differential includes primary hyperparathyroidism, malignancy, medications and other causes.',
    interpretiveNote: 'Marked or symptomatic hypercalcemia requires urgent clinical assessment.',
    isCriticalEscalation: true,
    recommendedInvestigations: [
      'Repeat adjusted or ionized calcium.',
      'Measure intact PTH as the key initial discriminator.',
      'If PTH suppressed, consider PTHrP, vitamin D metabolites, myeloma testing and targeted investigations as indicated.',
      'Review supplements, thiazides, lithium and hydration status.'
    ]
  },
  {
    id: 'cd-8-nut-b12-folate',
    source: 'common_diseases',
    sectionNumber: '8.5',
    sectionEn: 'Nutritional & Mineral Disorders',
    sectionAr: 'اضطرابات التغذية والفيتامينات والمعادن',
    conditionEn: 'Vitamin B12 / folate deficiency (Nutritional)',
    conditionAr: 'نقص فيتامين B12 وحمض الفوليك (تقييم غذائي)',
    profileCodes: ['VITAMINS_MINERALS', 'VITAMINS', 'VIT_B12', 'ZINC'],
    keywords: ['b12', 'folate', 'vitamins', 'mma'],
    typicalPattern: 'Low B12 or folate; macrocytosis may be absent.',
    suggestedComment:
      'The vitamin result may indicate deficiency and should be interpreted with CBC, symptoms and possible assay limitations.',
    interpretiveNote: 'Treating folate alone in unrecognized B12 deficiency may fail to address neurological risk.',
    recommendedInvestigations: [
      'Confirm borderline B12 with MMA where appropriate.',
      'Check folate, CBC and reticulocytes.',
      'Assess diet, medications, malabsorption and pernicious anemia risk.',
      'Prompt clinical review for neurological symptoms.'
    ]
  },

  // SECTION 9: COAGULATION & THROMBOTIC DISORDERS
  {
    id: 'cd-9-coag-ptinr',
    source: 'common_diseases',
    sectionNumber: '9.1',
    sectionEn: 'Coagulation & Thrombotic Disorders',
    sectionAr: 'اضطرابات التجلط والسيولة',
    conditionEn: 'Vitamin K antagonist effect / prolonged PT-INR',
    conditionAr: 'إطالة زمن البروثرومبين (PT / INR)',
    profileCodes: ['COAG'],
    keywords: ['pt', 'inr', 'warfarin', 'coagulation', 'prolonged'],
    typicalPattern: 'Prolonged PT/INR; aPTT may also be affected at high anticoagulant effect.',
    suggestedComment:
      "The PT/INR is prolonged. Interpretation requires anticoagulant history, indication and the patient's prescribed therapeutic range.",
    interpretiveNote: 'Do not recommend dose changes from a laboratory comment alone.',
    recommendedInvestigations: [
      'Verify warfarin or other anticoagulant use and dose history.',
      'Review liver function, vitamin K intake, antibiotics and potential interactions.',
      'Repeat or confirm sample if pre-analytical error is suspected.',
      'Urgent clinical communication for bleeding or markedly abnormal INR per local policy.'
    ]
  },
  {
    id: 'cd-9-coag-aptt',
    source: 'common_diseases',
    sectionNumber: '9.2',
    sectionEn: 'Coagulation & Thrombotic Disorders',
    sectionAr: 'اضطرابات التجلط والسيولة',
    conditionEn: 'Prolonged aPTT',
    conditionAr: 'إطالة زمن التجلط الجزئي (Prolonged aPTT)',
    profileCodes: ['COAG'],
    keywords: ['aptt', 'ptt', 'heparin', 'lupus anticoagulant', 'coagulation'],
    typicalPattern: 'May occur with heparin, factor deficiency, lupus anticoagulant or inhibitors.',
    suggestedComment:
      'The aPTT is prolonged. Further testing depends on bleeding history, anticoagulant exposure and whether PT is also prolonged.',
    interpretiveNote: 'A prolonged aPTT does not always indicate bleeding risk; lupus anticoagulant can be associated with thrombosis.',
    recommendedInvestigations: [
      'Review heparin/DOAC exposure and sample collection from heparinized lines.',
      'Repeat test and perform mixing study when indicated.',
      'Factor assays and inhibitor testing based on mixing study and clinical history.',
      'Lupus anticoagulant workup if thrombosis or pregnancy morbidity history is relevant.'
    ]
  },
  {
    id: 'cd-9-coag-dic',
    source: 'common_diseases',
    sectionNumber: '9.3',
    sectionEn: 'Coagulation & Thrombotic Disorders',
    sectionAr: 'اضطرابات التجلط والسيولة',
    conditionEn: 'Disseminated intravascular coagulation (DIC) concern',
    conditionAr: 'اشتباه تجلط الدم المنتشر داخل الأوعية (DIC)',
    profileCodes: ['COAG', 'CBC'],
    keywords: ['dic', 'd-dimer', 'fibrinogen', 'platelet', 'pt', 'aptt'],
    typicalPattern: 'Platelet decline, prolonged PT/aPTT, raised D-dimer, reduced fibrinogen may occur.',
    suggestedComment:
      'The combined abnormalities may raise concern for consumptive coagulopathy in the appropriate clinical context. Immediate clinical assessment is required.',
    interpretiveNote: 'No single test establishes DIC; use a validated clinical-laboratory scoring system.',
    isCriticalEscalation: true,
    recommendedInvestigations: [
      'Urgent repeat CBC, PT/INR, aPTT, fibrinogen and D-dimer.',
      'Assess for sepsis, trauma, obstetric complications or malignancy.',
      'Trend results and communicate critical findings immediately.',
      'Specialist/critical care assessment.'
    ]
  },
  {
    id: 'cd-9-coag-vte',
    source: 'common_diseases',
    sectionNumber: '9.4',
    sectionEn: 'Coagulation & Thrombotic Disorders',
    sectionAr: 'اضطرابات التجلط والسيولة',
    conditionEn: 'Venous thromboembolism (VTE) evaluation (D-dimer)',
    conditionAr: 'تقييم الجلطات الوريدية وارتفاع D-dimer',
    profileCodes: ['COAG', 'CARDIAC'],
    keywords: ['d-dimer', 'vte', 'dvt', 'pe', 'thrombosis'],
    typicalPattern: 'D-dimer may be elevated but is nonspecific.',
    suggestedComment:
      'D-dimer is a sensitive but nonspecific marker of fibrin turnover. It should be interpreted only within a validated pre-test probability pathway.',
    interpretiveNote: 'D-dimer may rise with age, pregnancy, infection, inflammation, cancer and recent surgery.',
    recommendedInvestigations: [
      'Use a validated clinical probability score and age-adjusted threshold where appropriate.',
      'Positive D-dimer generally requires imaging according to pathway; it does not confirm VTE.',
      'Do not use D-dimer to exclude VTE in high pre-test probability without appropriate imaging.'
    ]
  },

  // SECTION 10: TUMOR MARKERS
  {
    id: 'cd-10-tm-psa',
    source: 'common_diseases',
    sectionNumber: '10.1',
    sectionEn: 'Tumor Markers',
    sectionAr: 'دلالات الأورام (Tumor Markers)',
    conditionEn: 'PSA elevation',
    conditionAr: 'ارتفاع دلالة البروستاتا (PSA)',
    profileCodes: ['TUMOR'],
    keywords: ['psa', 'prostate', 'tumor'],
    typicalPattern: 'May rise in prostate cancer, benign prostatic enlargement, prostatitis, urinary retention or after instrumentation.',
    suggestedComment:
      'PSA is elevated relative to the stated reference/decision threshold. This finding is not specific for prostate malignancy and requires clinical risk assessment.',
    interpretiveNote: 'Do not diagnose prostate cancer from PSA alone.',
    recommendedInvestigations: [
      'Interpret age, prostate volume, symptoms, infection and recent instrumentation.',
      'Repeat under standardized conditions when appropriate; consider free/total PSA or validated risk tools.',
      'Urology referral and MRI/biopsy pathway based on clinical risk.'
    ]
  },
  {
    id: 'cd-10-tm-afp',
    source: 'common_diseases',
    sectionNumber: '10.2',
    sectionEn: 'Tumor Markers',
    sectionAr: 'دلالات الأورام (Tumor Markers)',
    conditionEn: 'AFP elevation',
    conditionAr: 'ارتفاع دلالة الأورام الكبدية (AFP)',
    profileCodes: ['TUMOR', 'LFT'],
    keywords: ['afp', 'hepatocellular', 'liver', 'tumor'],
    typicalPattern: 'May rise in hepatocellular carcinoma, germ cell tumors, pregnancy and active liver disease.',
    suggestedComment:
      'AFP is elevated and requires interpretation with liver status, pregnancy status and clinical context.',
    interpretiveNote: 'AFP is neither sufficiently sensitive nor specific as a stand-alone cancer test.',
    recommendedInvestigations: [
      'Liver imaging and specialist assessment when HCC risk is present.',
      'Review chronic hepatitis/cirrhosis and liver inflammation.',
      'Use serial trends in an established surveillance or treatment pathway.'
    ]
  },
  {
    id: 'cd-10-tm-cea',
    source: 'common_diseases',
    sectionNumber: '10.3',
    sectionEn: 'Tumor Markers',
    sectionAr: 'دلالات الأورام (Tumor Markers)',
    conditionEn: 'CEA elevation',
    conditionAr: 'ارتفاع دلالة CEA',
    profileCodes: ['TUMOR'],
    keywords: ['cea', 'colorectal', 'tumor'],
    typicalPattern: 'May rise in colorectal and other cancers, smoking and benign inflammatory/hepatic conditions.',
    suggestedComment:
      'CEA is a nonspecific marker and should be interpreted primarily in the context of a known malignancy or a defined clinical pathway.',
    interpretiveNote: 'Not recommended as a general-population colorectal cancer screening test.',
    recommendedInvestigations: [
      'Correlate with cancer history, imaging and clinical status.',
      'Use serial measurements with the same assay where possible.',
      'Investigate other causes of elevation when clinically appropriate.'
    ]
  },
  {
    id: 'cd-10-tm-ca125',
    source: 'common_diseases',
    sectionNumber: '10.4',
    sectionEn: 'Tumor Markers',
    sectionAr: 'دلالات الأورام (Tumor Markers)',
    conditionEn: 'CA-125 elevation',
    conditionAr: 'ارتفاع دلالة المبيض (CA-125)',
    profileCodes: ['TUMOR'],
    keywords: ['ca-125', 'ca125', 'ovarian', 'tumor'],
    typicalPattern: 'May rise in ovarian cancer, endometriosis, menstruation, pregnancy, fibroids and peritoneal inflammation.',
    suggestedComment:
      'CA-125 is elevated but is nonspecific. Interpretation depends on menopausal status, symptoms, imaging and risk assessment.',
    interpretiveNote: 'Not a stand-alone screening test for ovarian cancer in asymptomatic average-risk individuals.',
    recommendedInvestigations: [
      'Pelvic ultrasound and gynecologic assessment when indicated.',
      'Consider benign gynecologic and inflammatory causes.',
      'Use serial trends only in an appropriate specialist pathway.'
    ]
  },
  {
    id: 'cd-10-tm-ca199',
    source: 'common_diseases',
    sectionNumber: '10.5',
    sectionEn: 'Tumor Markers',
    sectionAr: 'دلالات الأورام (Tumor Markers)',
    conditionEn: 'CA 19-9 elevation',
    conditionAr: 'ارتفاع دلالة البنكرياس والقنوات المرارية (CA 19-9)',
    profileCodes: ['TUMOR', 'LFT'],
    keywords: ['ca 19-9', 'ca19-9', 'pancreatic', 'biliary', 'tumor'],
    typicalPattern: 'May rise in pancreatic/biliary malignancy and benign cholestasis or pancreatitis.',
    suggestedComment:
      'CA 19-9 is elevated and should be correlated with clinical findings and hepatobiliary imaging.',
    interpretiveNote: 'Some individuals do not express CA 19-9; it is not suitable for population screening.',
    recommendedInvestigations: [
      'Assess bilirubin, ALP/GGT and evidence of biliary obstruction.',
      'Imaging and specialist assessment as clinically indicated.',
      'Consider repeat after resolution of benign obstruction/inflammation.'
    ]
  },
  {
    id: 'cd-10-tm-ca153',
    source: 'common_diseases',
    sectionNumber: '10.6',
    sectionEn: 'Tumor Markers',
    sectionAr: 'دلالات الأورام (Tumor Markers)',
    conditionEn: 'CA 15-3 / CA 27.29 elevation',
    conditionAr: 'ارتفاع دلالات متابعة الثدي (CA 15-3 / CA 27.29)',
    profileCodes: ['TUMOR'],
    keywords: ['ca 15-3', 'ca15-3', 'ca 27.29', 'breast', 'tumor'],
    typicalPattern: 'May be elevated in some breast cancers and benign conditions.',
    suggestedComment:
      "The marker should be interpreted in the context of known breast cancer and the treating team's monitoring strategy.",
    interpretiveNote: 'Not recommended for breast cancer screening or diagnosis in isolation.',
    recommendedInvestigations: [
      'Correlate with clinical assessment and imaging.',
      'Use serial values on the same assay where possible.',
      'Discuss unexpected trends with the treating oncology team.'
    ]
  },

  // SECTION 11: URINE & STOOL ANALYSIS
  {
    id: 'cd-11-us-hematuria',
    source: 'common_diseases',
    sectionNumber: '11.1',
    sectionEn: 'Urine & Stool Analysis',
    sectionAr: 'تحليل البول والبراز',
    conditionEn: 'Hematuria',
    conditionAr: 'وجود دم وكرات دم حمراء بالبول (Hematuria)',
    profileCodes: ['URINE'],
    keywords: ['hematuria', 'rbc', 'blood', 'urine'],
    typicalPattern: 'RBCs on urine microscopy; dipstick blood may also detect free hemoglobin or myoglobin.',
    suggestedComment:
      'Microscopic or visible blood is detected in urine. Confirm and evaluate according to age, risk factors, symptoms and persistence.',
    interpretiveNote: 'Dipstick blood without RBCs suggests hemoglobinuria or myoglobinuria and requires separate evaluation.',
    recommendedInvestigations: [
      'Repeat clean-catch urinalysis and microscopy; exclude menstruation/contamination.',
      'Urine culture if infection suspected.',
      'Assess proteinuria, casts, renal function and blood pressure.',
      'Persistent or visible hematuria requires appropriate urologic/nephrologic evaluation.'
    ]
  },
  {
    id: 'cd-11-us-proteinuria',
    source: 'common_diseases',
    sectionNumber: '11.2',
    sectionEn: 'Urine & Stool Analysis',
    sectionAr: 'تحليل البول والبراز',
    conditionEn: 'Urinary protein / albumin',
    conditionAr: 'زلال / بروتين في البول (Urinary Protein)',
    profileCodes: ['URINE', 'ACR', 'MICROALBUMIN'],
    keywords: ['protein', 'albumin', 'urine', 'acr', 'pcr'],
    typicalPattern: 'Positive dipstick or elevated ACR/PCR.',
    suggestedComment:
      'Protein is detected in urine and should be quantified and assessed for persistence.',
    interpretiveNote: 'Transient proteinuria can occur with fever, exercise and acute illness.',
    recommendedInvestigations: [
      'First-morning urine ACR/PCR and repeat testing.',
      'Urine microscopy, eGFR and blood pressure.',
      'Assess diabetes, hypertension, infection and transient causes.',
      'Refer if substantial, persistent or associated with hematuria/declining renal function.'
    ]
  },
  {
    id: 'cd-11-us-fob',
    source: 'common_diseases',
    sectionNumber: '11.3',
    sectionEn: 'Urine & Stool Analysis',
    sectionAr: 'تحليل البول والبراز',
    conditionEn: 'Fecal occult blood',
    conditionAr: 'الدم الخفي في البراز (Fecal Occult Blood)',
    profileCodes: ['STOOL'],
    keywords: ['occult blood', 'fob', 'fit', 'stool'],
    typicalPattern: 'Positive FIT/FOBT indicates human blood in stool (FIT) or peroxidase activity (guaiac).',
    suggestedComment:
      'The stool blood screening result is positive and requires follow-up through the established colorectal evaluation pathway.',
    interpretiveNote: 'A positive result does not diagnose cancer; a negative result does not exclude all GI pathology.',
    recommendedInvestigations: [
      'Colonoscopy or appropriate diagnostic evaluation according to screening protocol.',
      'Assess anemia/iron deficiency and gastrointestinal symptoms.',
      'Do not repeat stool testing to negate a positive screening result unless the guideline specifically directs.'
    ]
  },
  {
    id: 'cd-11-us-parasites',
    source: 'common_diseases',
    sectionNumber: '11.4',
    sectionEn: 'Urine & Stool Analysis',
    sectionAr: 'تحليل البول والبراز',
    conditionEn: 'Intestinal parasites',
    conditionAr: 'الطفيليات المعوية بالبراز (Intestinal Parasites)',
    profileCodes: ['STOOL'],
    keywords: ['parasite', 'ova', 'cysts', 'stool', 'giardia', 'entamoeba'],
    typicalPattern: 'Ova, cysts or parasites may be identified on stool microscopy; sensitivity varies.',
    suggestedComment:
      'Parasitic forms are reported in the submitted stool specimen. Clinical relevance depends on organism identification and symptoms.',
    interpretiveNote: "Avoid reporting nonspecific 'parasites present' without organism-level description where possible.",
    recommendedInvestigations: [
      'Report organism to the appropriate level of identification.',
      'Repeat specimens on separate days when suspicion remains and initial microscopy is negative.',
      'Use antigen/PCR testing for selected organisms when available.',
      'Treatment decisions should be organism-specific and clinician-directed.'
    ]
  },

  // SECTION 12: REPRODUCTIVE & FERTILITY HORMONE PATTERNS
  {
    id: 'cd-12-rep-hypogonadism',
    source: 'common_diseases',
    sectionNumber: '12.1',
    sectionEn: 'Reproductive & Fertility Hormone Patterns',
    sectionAr: 'هرمونات الخصوبة والإنجاب والسائل المنوي',
    conditionEn: 'Male hypogonadism assessment',
    conditionAr: 'تقييم قصور هرمونات الذكورة (Male Hypogonadism)',
    profileCodes: ['FERTILITY', 'SEMEN', 'LH', 'FSH'],
    keywords: ['testosterone', 'hypogonadism', 'lh', 'fsh', 'semen', 'male'],
    typicalPattern: 'Low morning total testosterone on repeat testing; LH/FSH distinguish primary from secondary patterns.',
    suggestedComment:
      'A low testosterone result may suggest androgen deficiency but requires confirmation and compatible symptoms.',
    interpretiveNote: 'Do not diagnose hypogonadism from a single low testosterone result.',
    recommendedInvestigations: [
      'Repeat early-morning total testosterone on a separate day when clinically stable.',
      'Consider SHBG/free testosterone if binding abnormalities are suspected.',
      'Measure LH, FSH and prolactin to classify primary versus secondary pattern.',
      'Clinical assessment for medications, obesity, sleep disorders and pituitary/testicular causes.'
    ]
  },
  {
    id: 'cd-12-rep-ovarian',
    source: 'common_diseases',
    sectionNumber: '12.2',
    sectionEn: 'Reproductive & Fertility Hormone Patterns',
    sectionAr: 'هرمونات الخصوبة والإنجاب والسائل المنوي',
    conditionEn: 'Female ovarian reserve / infertility assessment',
    conditionAr: 'تقييم مخزون المبيض والخصوبة لدى السيدات (AMH / FSH)',
    profileCodes: ['FERTILITY', 'FSH', 'LH', 'PROLACTIN'],
    keywords: ['amh', 'fsh', 'estradiol', 'ovarian', 'fertility'],
    typicalPattern: 'AMH, FSH, estradiol and antral follicle count provide complementary information.',
    suggestedComment:
      'The hormone results should be interpreted according to age, cycle timing, hormonal contraception and fertility treatment context.',
    interpretiveNote: "No single hormone test predicts an individual's ability to conceive.",
    recommendedInvestigations: [
      'Document cycle day and medication use.',
      'Interpret AMH as an ovarian reserve marker, not a direct test of natural fertility.',
      'Assess TSH, prolactin and other tests based on history.',
      'Refer to reproductive specialist for integrated evaluation.'
    ]
  },
  {
    id: 'cd-12-rep-pregnancy',
    source: 'common_diseases',
    sectionNumber: '12.3',
    sectionEn: 'Reproductive & Fertility Hormone Patterns',
    sectionAr: 'هرمونات الخصوبة والإنجاب والسائل المنوي',
    conditionEn: 'Pregnancy testing (hCG)',
    conditionAr: 'اختبار ومتابعة هرمون الحمل (hCG)',
    profileCodes: ['FERTILITY', 'URINE'],
    keywords: ['hcg', 'bhcg', 'pregnancy'],
    typicalPattern: 'Positive serum/urine hCG indicates hCG detection; serial levels may be used in early pregnancy assessment.',
    suggestedComment:
      'hCG is detected. A single concentration cannot establish pregnancy location or viability.',
    interpretiveNote: 'hCG trends must be interpreted with ultrasound and clinical findings; ectopic pregnancy cannot be excluded by a single value.',
    recommendedInvestigations: [
      'Repeat quantitative hCG at an interval determined by clinical pathway when indicated.',
      'Ultrasound and clinical assessment based on gestational age and symptoms.',
      'Urgent evaluation for pain, bleeding, syncope or hemodynamic instability.'
    ]
  }
];

function findParamVal(params: TestParameter[], matchTerms: string[], excludeTerms: string[] = []): number | null {
  for (const p of params) {
    const lower = (p.name || '').toLowerCase();
    if (excludeTerms.some(ex => lower.includes(ex))) continue;
    if (matchTerms.some(m => lower.includes(m))) {
      const val = parseFloat(String(p.result || '').replace(/[^\d.-]/g, ''));
      if (!isNaN(val)) return val;
    }
  }
  return null;
}

export function evaluateAnemiaSeverity(
  params: TestParameter[],
  gender?: Gender
): AnemiaSeverityEvaluation {
  const hb = findParamVal(params, ['haemoglobin', 'hemoglobin', 'hgb', 'hb'], ['hba1c', 'a1c']);
  const mcv = findParamVal(params, ['mcv', 'mean corpuscular volume']);
  const rbc = findParamVal(params, ['rbc', 'red blood cell']);
  const bandCells = findParamVal(params, ['band cells', 'band forms', 'band', 'stab', 'العصوية'], ['absolute']);

  const g = String(gender || 'male').toLowerCase();
  const isFemale = g === 'female';
  const anemiaCutoff = isFemale ? 12.0 : 13.0;

  let severity: 'None' | 'Mild' | 'Moderate' | 'Severe' = 'None';
  let severityAr = 'طبيعي (لا توجد أنيميا)';
  let hasAnemia = false;

  if (hb !== null && hb < anemiaCutoff) {
    hasAnemia = true;
    if (hb < 8.0) {
      severity = 'Severe';
      severityAr = 'أنيميا شديدة (Severe < 8.0 g/dL)';
    } else if (hb < 11.0) {
      severity = 'Moderate';
      severityAr = 'أنيميا متوسطة (Moderate 8.0–10.9 g/dL)';
    } else {
      severity = 'Mild';
      severityAr = isFemale ? 'أنيميا خفيفة (Mild 11.0–11.9 g/dL)' : 'أنيميا خفيفة (Mild 11.0–12.9 g/dL)';
    }
  }

  let mcvClass: 'Microcytic' | 'Normocytic' | 'Macrocytic' | 'Unknown' = 'Unknown';
  if (mcv !== null && mcv > 0) {
    if (mcv < 80) mcvClass = 'Microcytic';
    else if (mcv <= 100) mcvClass = 'Normocytic';
    else mcvClass = 'Macrocytic';
  }

  const mentzerIndex = mcv !== null && rbc !== null && rbc > 0 ? Number((mcv / rbc).toFixed(1)) : null;
  const isLeftShift = bandCells !== null && bandCells > 5;

  return {
    hasAnemia,
    severity,
    severityAr,
    hbValue: hb,
    mcvClass,
    mentzerIndex,
    isLeftShift,
    bandCells
  };
}

export function evaluateCbcSuggestions(
  params: TestParameter[],
  patient?: Partial<Patient>
): CbcSmartSuggestion[] {
  const hb = findParamVal(params, ['haemoglobin', 'hemoglobin', 'hgb', 'hb'], ['hba1c', 'a1c']);
  const mcv = findParamVal(params, ['mcv', 'mean corpuscular volume']);
  const mch = findParamVal(params, ['mch', 'mean corpuscular hemoglobin'], ['mchc', 'conc']);
  const rbc = findParamVal(params, ['rbc', 'red blood cell']);
  const rdw = findParamVal(params, ['rdw']);
  const wbc = findParamVal(params, ['total leucocytic', 'wbc', 'white blood', 'tlc']);
  const neut = findParamVal(params, ['neutrophil', 'segmented', 'neut'], ['absolute', 'anc', 'band', 'stab']);
  const band = findParamVal(params, ['band cells', 'band forms', 'band', 'stab', 'العصوية'], ['absolute']);
  const plt = findParamVal(params, ['platelet', 'plt'], ['mpv', 'pdw', 'pct', 'p-lcr']);

  const sev = evaluateAnemiaSeverity(params, patient?.gender);
  const suggestions: CbcSmartSuggestion[] = [];
  const byId = (id: string) => MEDICAL_INTERPRETATION_LIBRARY.find(e => e.id === id);

  // 1. Pancytopenia check
  if (sev.hasAnemia && wbc !== null && wbc < 4.0 && plt !== null && plt < 140) {
    const entry = byId('anemia-aplastic-3-4');
    if (entry) {
      suggestions.push({
        entry,
        confidence: 'High',
        reasonsAr: ['انخفاض متزامن في الهيموجلوبين والصفائح وكرات الدم البيضاء (Pancytopenia)'],
        reasonsEn: ['Concurrent reduction in Hb, WBC, and Platelets (pancytopenia pattern)']
      });
    }
  }

  // 2. Microcytic patterns (MCV < 80 or MCH < 26)
  if ((mcv !== null && mcv < 80) || (sev.hasAnemia && mch !== null && mch < 26)) {
    const mentzer = sev.mentzerIndex;
    if (mentzer !== null && mentzer < 13 && (rbc !== null && rbc >= 4.7)) {
      const thal = byId('anemia-beta-thal-2-2');
      if (thal) {
        suggestions.push({
          entry: thal,
          confidence: 'High',
          reasonsAr: [`MCV منخفض (${mcv} fL) مع مؤشر منتزر < 13 (${mentzer}) وكرات دم حمراء مرتفعة/محفوظة`],
          reasonsEn: [`Low MCV (${mcv} fL) with Mentzer Index ${mentzer} (< 13) and preserved/high RBC count`]
        });
      }
      const ida = byId('anemia-ida-2-1');
      if (ida) {
        suggestions.push({
          entry: ida,
          confidence: 'Possible',
          reasonsAr: ['تشخيص تفريقي رئيسي لأنيميا الخلايا الصغيرة ناقصة الصبغة'],
          reasonsEn: ['Primary differential for microcytic hypochromic picture']
        });
      }
    } else {
      const ida = byId('anemia-ida-2-1');
      if (ida) {
        const reasonsAr = [`انخفاض MCV (${mcv ?? '—'} fL)${rdw && rdw > 15 ? ` وارتفاع RDW (${rdw}%)` : ''}`];
        const reasonsEn = [`Microcytosis${rdw && rdw > 15 ? ` with elevated RDW (${rdw}%)` : ''}`];
        suggestions.push({
          entry: ida,
          confidence: rdw && rdw > 15 ? 'High' : 'Moderate',
          reasonsAr,
          reasonsEn
        });
      }
      const thal = byId('anemia-beta-thal-2-2');
      if (thal) {
        suggestions.push({
          entry: thal,
          confidence: 'Possible',
          reasonsAr: ['تشخيص تفريقي لأنيميا الخلايا الصغيرة'],
          reasonsEn: ['Differential consideration in persistent microcytosis']
        });
      }
    }
  }

  // 3. Macrocytic patterns (MCV > 100)
  if (mcv !== null && mcv > 100) {
    const b12 = byId('anemia-b12-4-1');
    if (b12) {
      suggestions.push({
        entry: b12,
        confidence: mcv > 105 ? 'High' : 'Moderate',
        reasonsAr: [`ارتفاع حجم الخلية MCV (${mcv} fL > 100 fL)`],
        reasonsEn: [`Macrocytosis detected (MCV ${mcv} fL > 100 fL)`]
      });
    }
    const folate = byId('anemia-folate-4-2');
    if (folate) {
      suggestions.push({
        entry: folate,
        confidence: 'Moderate',
        reasonsAr: ['تشخيص تفريقي مصاحب لتضخم حجم كرات الدم الحمراء'],
        reasonsEn: ['Megaloblastic differential alongside B12 deficiency']
      });
    }
    const mds = byId('anemia-mds-4-5');
    if (mds && ((plt !== null && plt < 150) || (wbc !== null && wbc < 4.5))) {
      suggestions.push({
        entry: mds,
        confidence: 'Moderate',
        reasonsAr: ['تضخم MCV مصحوب بنقص صفائح أو كرات بيضاء'],
        reasonsEn: ['Macrocytosis with concurrent cytopenia']
      });
    }
  }

  // 4. Normocytic anemia (Hb low & MCV 80-100)
  if (sev.hasAnemia && mcv !== null && mcv >= 80 && mcv <= 100) {
    const acd = byId('anemia-acd-normo-3-1');
    if (acd) {
      suggestions.push({
        entry: acd,
        confidence: 'Moderate',
        reasonsAr: [`${sev.severityAr} مع MCV طبيعي (${mcv} fL)`],
        reasonsEn: [`${sev.severity} normocytic anemia (MCV ${mcv} fL)`]
      });
    }
    const mixed = byId('anemia-mixed-deficiency-3-6');
    if (mixed && rdw !== null && rdw > 15) {
      suggestions.push({
        entry: mixed,
        confidence: 'High',
        reasonsAr: [`أنيميا بـ MCV طبيعي (${mcv} fL) لكن RDW مرتفع (${rdw}%) مما قد يخفي نقصاً مزدوجاً`],
        reasonsEn: [`Normocytic anemia with elevated RDW (${rdw}%) — possible mixed nutritional deficiency`]
      });
    }
    const hem = byId('anemia-hemolytic-3-2');
    if (hem) {
      suggestions.push({
        entry: hem,
        confidence: 'Possible',
        reasonsAr: ['أحد الأسباب المهمة للأنيميا طبيعية الحجم'],
        reasonsEn: ['Consider reticulocyte response and hemolysis panel']
      });
    }
  }

  // 5. Leukocytosis / Neutrophilia / Left Shift (Band Cells > 5%)
  if ((wbc !== null && wbc > 11) || (neut !== null && neut > 75) || (band !== null && band > 5)) {
    const leuk = byId('cd-1-hem-leukocytosis');
    if (leuk) {
      const rAr: string[] = [];
      const rEn: string[] = [];
      if (wbc !== null && wbc > 11) {
        rAr.push(`ارتفاع كرات الدم البيضاء (${wbc})`);
        rEn.push(`Leukocytosis (WBC ${wbc})`);
      }
      if (neut !== null && neut > 75) {
        rAr.push(`ارتفاع الخلايا المتعادلة (${neut}%)`);
        rEn.push(`Neutrophilia (${neut}%)`);
      }
      if (band !== null && band > 5) {
        rAr.push(`ارتفاع خلايا الباند غير الناضجة Band Cells (${band}% > 5% — انحراف لليسار Left Shift)`);
        rEn.push(`Left shift / Bandemia (Band Cells ${band}% > 5%)`);
      }
      suggestions.push({
        entry: leuk,
        confidence: 'High',
        reasonsAr: rAr,
        reasonsEn: rEn
      });
    }
  }

  // 6. Thrombocytopenia
  if (plt !== null && plt < 150) {
    const thromb = byId('cd-1-hem-thrombocytopenia');
    if (thromb) {
      suggestions.push({
        entry: thromb,
        confidence: plt < 100 ? 'High' : 'Moderate',
        reasonsAr: [`انخفاض عدد الصفائح الدموية (${plt} × 10³/cmm)`],
        reasonsEn: [`Reduced platelet count (${plt} × 10³/cmm)`]
      });
    }
  }

  // Deduplicate keeping highest confidence order
  const seen = new Set<string>();
  return suggestions.filter(s => {
    if (seen.has(s.entry.id)) return false;
    seen.add(s.entry.id);
    return true;
  });
}

export function getLibraryEntriesForProfile(
  profileCode: string,
  titleEn?: string,
  titleAr?: string
): { primary: MedicalLibraryEntry[]; others: MedicalLibraryEntry[] } {
  const codeUpper = (profileCode || '').toUpperCase().trim();
  const textNorm = `${codeUpper} ${titleEn || ''} ${titleAr || ''}`.toLowerCase();

  const matchesProfile = (entry: MedicalLibraryEntry): boolean => {
    if (entry.profileCodes.some(pc => pc === codeUpper || (codeUpper.length >= 2 && codeUpper.includes(pc)))) {
      return true;
    }
    if (entry.keywords.some(kw => textNorm.includes(kw))) {
      return true;
    }
    return false;
  };

  const primary: MedicalLibraryEntry[] = [];
  const others: MedicalLibraryEntry[] = [];

  for (const entry of MEDICAL_INTERPRETATION_LIBRARY) {
    if (matchesProfile(entry)) {
      primary.push(entry);
    } else {
      others.push(entry);
    }
  }

  return { primary, others };
}

export function formatLibraryApplication(
  entry: MedicalLibraryEntry,
  existingProfile?: Pick<TestProfile, 'interpretation' | 'comment' | 'recommendedTests'>,
  mode: 'replace' | 'append' = 'replace'
): {
  interpretation: string;
  comment: string;
  recommendedTests: string[];
} {
  const fullInterpretation = entry.interpretiveNote
    ? `${entry.suggestedComment}\nNote: ${entry.interpretiveNote}`
    : entry.suggestedComment;

  const patternComment = `Typical pattern (${entry.conditionEn}): ${entry.typicalPattern}`;

  if (mode === 'replace') {
    return {
      interpretation: fullInterpretation,
      comment: patternComment,
      recommendedTests: [...entry.recommendedInvestigations]
    };
  }

  const prevInterp = (existingProfile?.interpretation || '').trim();
  const prevComment = (existingProfile?.comment || '').trim();
  const prevRecs = existingProfile?.recommendedTests || [];

  const mergedRecs = Array.from(new Set([...prevRecs, ...entry.recommendedInvestigations]));

  return {
    interpretation: prevInterp && !prevInterp.includes(entry.suggestedComment)
      ? `${prevInterp}\n\n${fullInterpretation}`
      : fullInterpretation,
    comment: prevComment && !prevComment.includes(entry.typicalPattern)
      ? `${prevComment}\n${patternComment}`
      : patternComment,
    recommendedTests: mergedRecs
  };
}
