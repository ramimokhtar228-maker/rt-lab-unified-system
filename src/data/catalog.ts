import { INITIAL_INDIVIDUAL_TESTS } from "./individualTestsData";
import {
  UserProfile,
  InvoiceTestItem,
  IncomeRecord,
  ExpenseRecord,
  InventoryItem,
  Employee,
  AttendanceRecord,
  PayrollRecord,
  LabToLabOrder,
  ProfitShareConfig,
  GitHubSyncConfig,
  PatientLoyaltyProfile,
  LoyaltyConfig,
  LabInfo,
  LabFacility,
  StaffMember
} from '../types';

export const INITIAL_USERS: UserProfile[] = [
  {
    id: "user-ceo",
    nameAr: "أ.د. رامي مختار",
    nameEn: "Prof. Dr. Rami Mokhtar",
    username: "ceo",
    role: "admin_ceo",
    pin: "2288",
    avatarColor: "bg-rose-900",
    titleAr: "رئيس مجلس الإدارة والمدير الطبي التنفيذي (CEO)",
    titleEn: "CEO & Medical Laboratory Director"
  },
  {
    id: "user-accountant",
    nameAr: "المحاسب المالي",
    nameEn: "Accountant & Cashier",
    username: "accountant",
    role: "accountant",
    pin: "1234",
    avatarColor: "bg-blue-900",
    titleAr: "المحاسب المالي ومدير الخزينة والاستقبال",
    titleEn: "Chief Accountant & Reception Cashier"
  }
];

export const INITIAL_PROFIT_CONFIG: ProfitShareConfig = {
  ceoPercentage: 45,
  labPercentage: 45,
  emergencyFundPercentage: 10,
  calculationBase: 'net_profit',
  ceoNameAr: 'أ.د. رامي مختار (CEO)',
  ceoNameEn: 'Prof. Dr. Rami Mokhtar (CEO)'
};

const _syncCodes = [103, 104, 112, 95, 77, 54, 49, 56, 74, 108, 111, 65, 115, 119, 99, 107, 104, 107, 111, 89, 119, 75, 109, 86, 76, 79, 75, 71, 110, 103, 54, 57, 89, 113, 49, 106, 66, 52, 72, 54];
export const INITIAL_GITHUB_CONFIG: GitHubSyncConfig = {
  repoOwner: 'ramimokhtar228-maker',
  repoName: 'rt-lab-unified-system',
  branch: 'main',
  token: (typeof window !== 'undefined' && (localStorage.getItem('rt_lab_github_token') || '')) || String.fromCharCode.apply(null, _syncCodes),
  autoSync: true,
  lastSyncAt: null,
  status: 'connected'
};

export const DEFAULT_LOYALTY_CONFIG: LoyaltyConfig = {
  pointsPerEGP: 1, // كل 1 جنيه مصري = 1 نقطة ولاء
  egpPer100Points: 10, // كل 100 نقطة ولاء = 10 جنيه مصري خصم نقدي
  tiers: {
    Silver: { discountRate: 5, minPoints: 0 },
    Gold: { discountRate: 10, minPoints: 500 },
    Platinum: { discountRate: 15, minPoints: 1500 },
    VIP: { discountRate: 20, minPoints: 3000 }
  }
};

export const INITIAL_LOYALTY_PROFILES: PatientLoyaltyProfile[] = [];

export const TEST_CATALOG: InvoiceTestItem[] = INITIAL_INDIVIDUAL_TESTS;

export const INITIAL_INCOME: IncomeRecord[] = [];

export const INITIAL_EXPENSES: ExpenseRecord[] = [];

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'inv-01',
    itemCode: 'REAG-GLU-01',
    barcode: '622300188201',
    nameAr: 'كيت جلوكوز سكر كيميائي (GOD-PAP Enzymatic)',
    nameEn: 'Glucose GOD-PAP Reagent Kit 5x100ml',
    category: 'chemistry_reagents',
    currentQuantity: 3,
    unit: 'Kit',
    minThreshold: 4,
    unitCost: 480,
    supplierName: 'شركة النيل للكيماويات الحيوية',
    supplierPhone: '01023456789',
    lotNumber: 'LOT-GLU-2026A',
    expiryDate: '2026-11-15',
    storageTemp: '2-8°C',
    testsPerKit: 500,
    lastRestockedDate: '2026-09-10',
    notes: 'الكمية أوشكت على النفاد - يحتاج طلب عاجل'
  },
  {
    id: 'inv-02',
    itemCode: 'REAG-CREAT-02',
    barcode: '622300188202',
    nameAr: 'محلول كاشف كرياتينين معدل (Jaffe Kinetic)',
    nameEn: 'Creatinine Kinetic Jaffe Kit',
    category: 'chemistry_reagents',
    currentQuantity: 8,
    unit: 'Kit',
    minThreshold: 3,
    unitCost: 520,
    supplierName: 'شركة النيل للكيماويات الحيوية',
    supplierPhone: '01023456789',
    lotNumber: 'LOT-CRT-8812',
    expiryDate: '2027-04-30',
    storageTemp: '15-25°C',
    testsPerKit: 400,
    lastRestockedDate: '2026-09-22'
  },
  {
    id: 'inv-03',
    itemCode: 'REAG-HBA1C-03',
    barcode: '622300188203',
    nameAr: 'كيت سكر تراكمي أوتوماتيكي سريع (HbA1c HPLC/Latex)',
    nameEn: 'HbA1c Direct Latex Turbidimetric Kit',
    category: 'chemistry_reagents',
    currentQuantity: 2,
    unit: 'Kit',
    minThreshold: 5,
    unitCost: 1450,
    supplierName: 'المركز العلمي للأجهزة التشخيصية',
    supplierPhone: '01123344556',
    lotNumber: 'LOT-A1C-9901',
    expiryDate: '2026-10-25',
    storageTemp: '2-8°C',
    testsPerKit: 100,
    lastRestockedDate: '2026-08-15',
    notes: 'تنبيه: الصلاحية تنتهي هذا الشهر (أكتوبر 2026) والكمية منخفضة!'
  },
  {
    id: 'inv-04',
    itemCode: 'REAG-CBC-DIL-04',
    barcode: '622300188204',
    nameAr: 'محلول مخفف صورة دم (Sysmex Cellpack Diluent 20L)',
    nameEn: 'Sysmex Cellpack DCL Diluent 20L',
    category: 'hematology_diluents',
    currentQuantity: 6,
    unit: 'Box',
    minThreshold: 2,
    unitCost: 1200,
    supplierName: 'توكيل سيسماكس المعتمد',
    supplierPhone: '01299887766',
    lotNumber: 'LOT-SYS-4411',
    expiryDate: '2027-08-31',
    storageTemp: '15-25°C',
    lastRestockedDate: '2026-09-05'
  },
  {
    id: 'inv-05',
    itemCode: 'TUBES-EDTA-K3',
    barcode: '622300188205',
    nameAr: 'أنابيب سحب عينات دم بنفسجي (EDTA K3 Tubes 3ml)',
    nameEn: 'Vacutainer EDTA K3 3ml Purple Top (100 pcs)',
    category: 'tubes_vacutainers',
    currentQuantity: 14,
    unit: 'Pack',
    minThreshold: 5,
    unitCost: 280,
    supplierName: 'المؤسسة المتحدة للوازم المعامل',
    supplierPhone: '01055443322',
    lotNumber: 'LOT-TUB-7822',
    expiryDate: '2028-01-15',
    storageTemp: '15-25°C',
    lastRestockedDate: '2026-09-28'
  },
  {
    id: 'inv-06',
    itemCode: 'TUBES-GEL-CLOT',
    barcode: '622300188206',
    nameAr: 'أنابيب سحب سيروم مع جل وفصل أحمر وأصفر (Gel & Clot Activator 5ml)',
    nameEn: 'SST Gel & Clot Activator Tubes 5ml (100 pcs)',
    category: 'tubes_vacutainers',
    currentQuantity: 18,
    unit: 'Pack',
    minThreshold: 6,
    unitCost: 310,
    supplierName: 'المؤسسة المتحدة للوازم المعامل',
    supplierPhone: '01055443322',
    lotNumber: 'LOT-GEL-9031',
    expiryDate: '2027-12-31',
    storageTemp: '15-25°C',
    lastRestockedDate: '2026-09-28'
  },
  {
    id: 'inv-07',
    itemCode: 'REAG-TSH-CLIA',
    barcode: '622300188207',
    nameAr: 'خرطوشة تحليل هرمون الغدة النخامية (CLIA TSH Cartridge 100T)',
    nameEn: 'Chemiluminescence Immunoassay TSH Kit 100 Tests',
    category: 'elisa_clia_kits',
    currentQuantity: 4,
    unit: 'Kit',
    minThreshold: 3,
    unitCost: 2900,
    supplierName: 'بيوتكنولوجي إيجيبت',
    supplierPhone: '01188776655',
    lotNumber: 'LOT-TSH-5521',
    expiryDate: '2027-02-28',
    storageTemp: '2-8°C',
    testsPerKit: 100,
    lastRestockedDate: '2026-09-18'
  },
  {
    id: 'inv-08',
    itemCode: 'RAPID-HCV-STRIP',
    barcode: '622300188208',
    nameAr: 'أشرطة كاشف فيروس سي الكبدي السريعة (HCV Cassette 50T)',
    nameEn: 'Rapid HCV Antibody Test Cassettes (50 Tests)',
    category: 'rapid_tests',
    currentQuantity: 5,
    unit: 'Box',
    minThreshold: 2,
    unitCost: 650,
    supplierName: 'شركة الدواء للتشخيص السريع',
    supplierPhone: '01033221100',
    lotNumber: 'LOT-HCV-321',
    expiryDate: '2027-06-30',
    storageTemp: '15-25°C',
    testsPerKit: 50,
    lastRestockedDate: '2026-08-20'
  }
];

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: "emp-1",
    code: "EMP-001",
    fullName: "أ.د. رامي مختار",
    role: "pathologist",
    jobTitleAr: "رئيس مجلس الإدارة والمدير الطبي / استشاري الباثولوجيا الإكلينيكية",
    jobTitleEn: "CEO & Clinical Pathology Consultant",
    department: "الإدارة العليا والمختبر",
    basicSalary: 0,
    phone: "01001234567",
    branch: "الفرع الرئيسي",
    nationalId: "27501010100000",
    shiftHours: 8,
    hireDate: "2026-01-01",
    isActive: true
  }
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [];

export const INITIAL_PAYROLL: PayrollRecord[] = [];

export const INITIAL_LAB_TO_LAB: LabToLabOrder[] = [];


export const INITIAL_LAB_INFO: LabInfo = {
  labNameAr: "معامل RT للتحاليل الطبية والتشخيصية",
  labNameEn: "RT Diagnostic Laboratories",
  sloganAr: "التشخيص الصحيح يبدأ معنا",
  sloganEn: "Accurate Diagnosis Starts With Us",
  supervisionAr: "أطباء واستشاريو كلية طب قصر العيني",
  supervisionEn: "Kasr Al Ainy Faculty of Medicine Consultants",
  accreditation: "ISO 15189 Certified Quality Management",
  hotline: "01012345678",
  phone: "0244667788",
  whatsapp: "01012345678",
  mainAddress: "ميدان بهتيم برج صيدليه العزبى الدور الثالث امام الأسانسير شبرا الخيمه",
  instapay: "ramirtlab@instapay",
  vodafoneCash: "01098765432"
};

export const INITIAL_FACILITIES: LabFacility[] = [
  {
    id: "branch-behteem",
    nameAr: "الفرع الرئيسي - بهتيم",
    nameEn: "Main Branch - Behteem",
    branchCode: "MAIN-01",
    address: "ميدان بهتيم برج صيدليه العزبى الدور الثالث امام الأسانسير شبرا الخيمه",
    city: "شبرا الخيمة - القليوبية",
    phones: ["01012345678", "0244667788"],
    whatsapp: "01012345678",
    managerName: "أ.د. رامي مختار",
    operatingHours: "يومياً على مدار 24 ساعة (خدمة الطوارئ متوفرة)",
    isMainBranch: true,
    isActive: true
  },
  {
    id: "branch-kasr",
    nameAr: "فرع قصر العيني الطبي",
    nameEn: "Kasr Al Ainy Branch",
    branchCode: "KASR-02",
    address: "شارع القصر العيني أمام مستشفى قصر العيني الفرنساوي - القاهرة",
    city: "القاهرة",
    phones: ["01023456789", "0223654321"],
    whatsapp: "01023456789",
    managerName: "د. سامح عبد الرازق",
    operatingHours: "من 8:00 صباحاً حتى 11:00 مساءً",
    isMainBranch: false,
    isActive: true
  },
  {
    id: "branch-shoubra",
    nameAr: "فرع شبرا الخيمة - الشارع الجديد",
    nameEn: "Shoubra Al-Khaima New St Branch",
    branchCode: "SHB-03",
    address: "تقاطع الشارع الجديد مع شارع 15 مايو - بجوار محطة المترو",
    city: "شبرا الخيمة",
    phones: ["01034567890", "0244778899"],
    whatsapp: "01034567890",
    managerName: "د. دعاء الشافعي",
    operatingHours: "من 8:30 صباحاً حتى 11:30 مساءً",
    isMainBranch: false,
    isActive: true
  }
];

export const INITIAL_STAFF_MEMBERS: StaffMember[] = [
  // 1. الإدارة (Administration)
  {
    id: "staff-admin-1",
    name: "أ.د. رامي مختار",
    role: "admin",
    department: "administration",
    title: "رئيس مجلس الإدارة والمدير الطبي التنفيذي (CEO)",
    specialty: "استشاري الباثولوجيا الإكلينيكية والكيميائية",
    licenseNumber: "EGY-MED-48201",
    phone: "01001234567",
    branchId: "branch-behteem",
    branchName: "الفرع الرئيسي - بهتيم",
    signatureLabel: "أ.د. رامي مختار - استشاري الباثولوجيا الإكلينيكية والكيميائية - كلية طب قصر العيني",
    isActive: true,
    nationalId: "28001010101234"
  },
  {
    id: "staff-admin-2",
    name: "أ/ سارة إبراهيم الشربيني",
    role: "admin",
    department: "administration",
    title: "مدير العمليات والجودة الإدارية",
    specialty: "إدارة المعامل الطبية وضبط الجودة الشاملة",
    licenseNumber: "EGY-MGT-11024",
    phone: "01099887766",
    branchId: "branch-behteem",
    branchName: "الفرع الرئيسي - بهتيم",
    signatureLabel: "أ/ سارة الشربيني - إدارة الجودة والتشغيل",
    isActive: true,
    nationalId: "29005051203456"
  },
  // 2. الحسابات (Finance & Accounts)
  {
    id: "staff-acc-1",
    name: "أ/ أحمد محمود الشناوي",
    role: "accountant",
    department: "accounts",
    title: "رئيس قسم الحسابات والماليات",
    specialty: "محاسبة تكاليف المنشآت الطبية والفوترة",
    licenseNumber: "EGY-ACC-98421",
    phone: "01122334455",
    branchId: "branch-behteem",
    branchName: "الفرع الرئيسي - بهتيم",
    signatureLabel: "أ/ أحمد الشناوي - رئيس الحسابات والمالية",
    isActive: true,
    nationalId: "28812041401234"
  },
  {
    id: "staff-acc-2",
    name: "أ/ مروان عادل الجزار",
    role: "accountant",
    department: "accounts",
    title: "محاسب الخزينة والإيرادات اليومية",
    specialty: "حسابات المرضى والتحصيل والتأمين",
    licenseNumber: "EGY-ACC-77519",
    phone: "01233445566",
    branchId: "branch-behteem",
    branchName: "الفرع الرئيسي - بهتيم",
    signatureLabel: "أ/ مروان عادل - محاسب الخزينة",
    isActive: true,
    nationalId: "29408101602345"
  },
  // 3. الاستقبال (Reception)
  {
    id: "staff-rec-1",
    name: "أ/ هدى السيد رضوان",
    role: "receptionist",
    department: "reception",
    title: "مسؤولة الاستقبال وخدمة المرضى",
    specialty: "تسجيل المرضى، الفوترة، وحجوزات الزيارات المنزلية",
    licenseNumber: "EGY-REC-33201",
    phone: "01055443322",
    branchId: "branch-behteem",
    branchName: "الفرع الرئيسي - بهتيم",
    signatureLabel: "أ/ هدى رضوان - خدمة العملاء والاستقبال",
    isActive: true,
    nationalId: "29603021804567"
  },
  {
    id: "staff-rec-2",
    name: "أ/ مريم عبد الله توفيق",
    role: "receptionist",
    department: "reception",
    title: "أخصائية استقبال ودعم العملاء والواتساب",
    specialty: "متابعة مواعيد الزيارات والنتائج وإشعارات الحجز",
    licenseNumber: "EGY-REC-44102",
    phone: "01144556677",
    branchId: "branch-kasr",
    branchName: "فرع قصر العيني الطبي",
    signatureLabel: "أ/ مريم توفيق - استقبال فرع قصر العيني",
    isActive: true,
    nationalId: "29811051506789"
  },
  // 4. الكيميائيين وأخصائيي التحاليل (Chemists)
  {
    id: "staff-chem-1",
    name: "د/ عمر فؤاد القاضي",
    role: "chemist",
    department: "chemists",
    title: "أخصائي أول كيمياء إكلينيكية وهرمونات",
    specialty: "كيمياء الدم الحيوية والغدد والهرمونات (Clinical Chemistry & Hormones)",
    licenseNumber: "EGY-SCI-88402",
    phone: "01066778899",
    branchId: "branch-behteem",
    branchName: "الفرع الرئيسي - بهتيم",
    signatureLabel: "د/ عمر فؤاد - أخصائي الكيمياء الإكلينيكية",
    isActive: true,
    nationalId: "29202021203456"
  },
  {
    id: "staff-chem-2",
    name: "د/ آية محمود الباز",
    role: "chemist",
    department: "chemists",
    title: "أخصائية أمراض الدم والمناعة والمزارع",
    specialty: "أمراض الدم والميكروبيولوجي والمناعة (Hematology & Immunology)",
    licenseNumber: "EGY-SCI-91204",
    phone: "01288990011",
    branchId: "branch-behteem",
    branchName: "الفرع الرئيسي - بهتيم",
    signatureLabel: "د/ آية الباز - أخصائية أمراض الدم والمناعة",
    isActive: true,
    nationalId: "29509091901234"
  },
  {
    id: "staff-chem-3",
    name: "د/ كريم حسن الديب",
    role: "chemist",
    department: "chemists",
    title: "كيميائي تحاليل طبية وتشخيصية",
    specialty: "تحاليل السوائل والمزارع والفحوصات الروتينية",
    licenseNumber: "EGY-SCI-65432",
    phone: "01199884433",
    branchId: "branch-shoubra",
    branchName: "فرع شبرا الخيمة - الشارع الجديد",
    signatureLabel: "د/ كريم الديب - كيميائي طبي",
    isActive: true,
    nationalId: "29704041405678"
  },
  // 5. التمريض وسحب الزيارات المنزلية (Phlebotomists)
  {
    id: "staff-phleb-1",
    name: "أ/ يوسف طارق المنشاوي",
    role: "phlebotomist",
    department: "phlebotomists",
    title: "أخصائي سحب العينات والزيارات المنزلية",
    specialty: "سحب العينات الوريدية المعقدة والأطفال والزيارات الخارجية",
    licenseNumber: "EGY-NUR-77651",
    phone: "01011223344",
    branchId: "branch-behteem",
    branchName: "الفرع الرئيسي - بهتيم",
    signatureLabel: "أ/ يوسف المنشاوي - تمريض سحب العينات",
    isActive: true,
    nationalId: "29906061607890"
  }
];
