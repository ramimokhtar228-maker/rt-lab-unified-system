import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Language,
  UserProfile,
  IncomeRecord,
  ExpenseRecord,
  InventoryItem,
  Employee,
  AttendanceRecord,
  PayrollRecord,
  LabToLabOrder,
  ProfitShareConfig,
  GitHubSyncConfig,
  AuditLog,
  AppNotification,
  DailyCloseout,
  InvoiceTestItem,
  LoyaltyConfig,
  PatientLoyaltyProfile,
  LoyaltyTier,
  LabInfo,
  LabFacility,
  StaffMember,
  LabReport,
  Patient,
  TestProfile,
  TestParameter,
  LabInstrument,
  InstrumentTransmission,
  UserRole,
  ComprehensivePackage,
  LabStaffSignatures,
  StaffOptionItem
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_PROFIT_CONFIG,
  INITIAL_GITHUB_CONFIG,
  DEFAULT_LOYALTY_CONFIG,
  INITIAL_INVENTORY,
  INITIAL_EMPLOYEES,
  INITIAL_ATTENDANCE,
  INITIAL_PAYROLL,
  INITIAL_LAB_TO_LAB,
  INITIAL_LAB_INFO,
  INITIAL_FACILITIES,
  INITIAL_STAFF_MEMBERS,
  TEST_CATALOG as DEFAULT_TEST_CATALOG
} from '../data/catalog';
import {
  INITIAL_REPORTS,
  INITIAL_INCOME_RECORDS,
  INITIAL_LOYALTY_DATA
} from '../data/initialData';
import { LAB_CATALOG, DEFAULT_STAFF, INITIAL_STAFF_SIGNATURE_OPTIONS } from '../data/labCatalog';
import { INITIAL_PACKAGES } from '../data/packagesData';
import { INITIAL_INDIVIDUAL_TESTS } from '../data/individualTestsData';
import { INITIAL_INSTRUMENTS, SAMPLE_INSTRUMENT_TRANSMISSIONS } from '../data/instrumentsData';
import { realtimeSyncManager } from '../utils/realtimeMultiDeviceSync';
import { pushFullStoreToGitHub, pullFullStoreFromGitHub, syncInvoiceToDiagnostic, fetchDiagnosticCases, convertIncomeRecordToDiagnosticReport } from '../utils/githubSync';
import {
  mergeCatalogWithDefaults,
  mergePackagesWithDefaults,
  mergeProfilesWithDefaults,
  runGlobalDataUpgrade,
  MIGRATION_VERSION_KEY
} from '../utils/upgradeSavedData';
import { CatalogProfileTemplate } from '../types/lab';

// Storage Keys
const STORAGE_PREFIX = 'rt_lab_unified_';
const REPORTS_KEY = `${STORAGE_PREFIX}reports_v3`;
const INCOME_KEY = `${STORAGE_PREFIX}income_v3`;
const EXPENSES_KEY = `${STORAGE_PREFIX}expenses_v3`;
const LOYALTY_KEY = `${STORAGE_PREFIX}loyalty_v3`;
const INVENTORY_KEY = `${STORAGE_PREFIX}inventory_v3`;
const EMPLOYEES_KEY = `${STORAGE_PREFIX}employees_v3`;
const LAB_TO_LAB_KEY = `${STORAGE_PREFIX}lab_to_lab_v3`;
const CLOSEOUTS_KEY = `${STORAGE_PREFIX}closeouts_v3`;
const AUDIT_KEY = `${STORAGE_PREFIX}audit_v3`;
const INSTRUMENTS_KEY = `${STORAGE_PREFIX}instruments_v3`;
const TRANSMISSIONS_KEY = `${STORAGE_PREFIX}transmissions_v3`;
const LAB_INFO_KEY = `${STORAGE_PREFIX}lab_info_v3`;
const CATALOG_KEY = `${STORAGE_PREFIX}test_catalog_v3`;
const PACKAGES_KEY = `${STORAGE_PREFIX}packages_v3`;
const DIAGNOSTIC_PROFILES_KEY = `${STORAGE_PREFIX}diagnostic_profiles_v3`;
const STAFF_SIGNATURES_KEY = `${STORAGE_PREFIX}staff_signatures_v3`;
const STAFF_OPTIONS_KEY = `${STORAGE_PREFIX}staff_options_v3`;

interface AppContextType {
  // Localization & Auth
  language: Language;
  setLanguage: (lang: Language) => void;
  currentUser: UserProfile;
  users: UserProfile[];
  loginModalOpen: boolean;
  setLoginModalOpen: (open: boolean) => void;
  loginUser: (username: string, pin: string) => boolean;
  logout: () => void;
  hasPermission: (module: string) => boolean;

  // Active Navigation Tab
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Reports & Laboratory Diagnostic Worklist
  reports: LabReport[];
  selectedReportId: string | null;
  setSelectedReportId: (id: string | null) => void;
  selectedReport: LabReport | null;
  addReport: (report: LabReport) => void;
  updateReport: (id: string, updates: Partial<LabReport>) => void;
  deleteReport: (id: string) => void;
  verifyReport: (id: string) => void;
  createReportFromAdmission: (patient: Patient, selectedTests: InvoiceTestItem[], packageApplied?: any) => LabReport;

  // Financial & Treasury (Income & Invoicing)
  incomeRecords: IncomeRecord[];
  addIncomeRecord: (record: Omit<IncomeRecord, 'id' | 'createdAt' | 'updatedAt'>) => IncomeRecord;
  updateIncomeRecord: (id: string, updates: Partial<IncomeRecord>) => void;
  deleteIncomeRecord: (id: string) => void;
  selectedInvoice: IncomeRecord | null;
  setSelectedInvoice: (invoice: IncomeRecord | null) => void;
  financialMetrics: {
    totalGrossIncome: number;
    totalPaidIncome: number;
    totalDeferredIncome: number;
    totalExpenses: number;
    netProfit: number;
    ceoShare: number;
    labShare: number;
    emergencyFund: number;
    emergencyShare: number;
  };
  scannedBarcode: string | null;
  setScannedBarcode: (b: string | null) => void;
  setScannerOpen: (open: boolean) => void;

  // Test Catalog
  testCatalog: InvoiceTestItem[];
  addCatalogTest: (test: InvoiceTestItem) => void;
  updateCatalogTest: (code: string, updates: Partial<InvoiceTestItem>) => void;
  updateIndividualTests: (tests: InvoiceTestItem[]) => void;
  deleteCatalogTest: (code: string) => void;
  resetCatalog: () => void;
  forceSyncCatalog: () => { testsCount: number; packagesCount: number; profilesCount: number };

  // Comprehensive Packages
  packages: ComprehensivePackage[];
  updatePackages: (pkgs: ComprehensivePackage[]) => void;
  addPackage: (pkg: ComprehensivePackage) => void;
  updateSinglePackage: (id: string, updates: Partial<ComprehensivePackage>) => void;
  deletePackage: (id: string) => void;
  resetPackages: () => void;
  applyPackageToReport: (reportId: string, pkg: ComprehensivePackage) => void;

  // Diagnostic Profile Templates
  diagnosticProfiles: CatalogProfileTemplate[];
  updateDiagnosticProfiles: (profiles: CatalogProfileTemplate[]) => void;
  resetDiagnosticProfiles: () => void;

  // Laboratory Instruments & Hardware Interfacing
  instruments: LabInstrument[];
  transmissions: InstrumentTransmission[];
  toggleInstrumentStatus: (id: string) => void;
  simulateInstrumentRun: (instrumentId: string, barcode: string, patientName?: string, labNumber?: string) => InstrumentTransmission;
  applyTransmissionToReport: (transmissionId: string, reportId: string) => boolean;

  // Loyalty Program & Cards
  loyaltyProfiles: PatientLoyaltyProfile[];
  loyaltyConfig: LoyaltyConfig;
  updateLoyaltyConfig: (config: LoyaltyConfig) => void;
  addLoyaltyProfile: (profile: PatientLoyaltyProfile) => void;
  getLoyaltyByPhone: (phone: string) => PatientLoyaltyProfile | undefined;
  calculateLoyaltyTier: (points: number) => LoyaltyTier;
  earnLoyaltyPoints: (patientPhone: string, amount: number, invoiceNumber: string, patientName: string, barcode: string) => void;
  redeemLoyaltyPoints: (patientPhone: string, points: number, invoiceNumber?: string, discountEGP?: number) => { success: boolean; cashValue: number };
  updateLoyaltyProfile: (id: string, updates: Partial<PatientLoyaltyProfile>) => void;
  deleteLoyaltyProfile: (id: string) => void;
  deleteLoyaltyTransaction: (profileId: string, txId: string) => void;
  retroactiveSyncAllInvoicesToLoyalty: () => { syncedCount: number; newProfilesCount: number };
  addLoyaltyPoints: (patientPhone: string, points: number, reason: string, invoiceNumber?: string, amountEGP?: number) => void;
  calculateCashForPoints: (points: number) => number;
  calculatePointsForAmount: (amount: number) => number;

  // Expenses & Profit Sharing & Daily Closeout
  expenses: ExpenseRecord[];
  addExpense: (expense: Omit<ExpenseRecord, 'id' | 'createdAt'>) => void;
  updateExpense: (id: string, updates: Partial<ExpenseRecord>) => void;
  deleteExpense: (id: string) => void;
  profitConfig: ProfitShareConfig;
  updateProfitConfig: (config: ProfitShareConfig) => void;
  dailyCloseouts: DailyCloseout[];
  closeoutDay: (actualCash: number, discrepancyNotes?: string) => DailyCloseout;

  // Inventory & Reagents
  inventory: InventoryItem[];
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'lastRestockedDate'>) => void;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  restockItem: (id: string, addedQty: number, newCost?: number) => void;
  consumeReagent: (id: string, qty: number) => void;
  deleteInventoryItem: (id: string) => void;

  // Lab to Lab (Outsourced)
  labToLabOrders: LabToLabOrder[];
  addLabToLabOrder: (order: Omit<LabToLabOrder, 'id'>) => void;
  updateLabToLabOrder: (id: string, updates: Partial<LabToLabOrder>) => void;
  deleteLabToLabOrder: (id: string) => void;

  // HR & Staff
  employees: Employee[];
  attendance: AttendanceRecord[];
  payroll: PayrollRecord[];
  addEmployee: (emp: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  recordAttendance: (employeeId: string, status: AttendanceRecord['status'], checkIn?: string, checkOut?: string, notes?: string) => void;
  generatePayrollForMonth: (monthYear: string) => void;
  updatePayrollRecord: (id: string, updates: Partial<PayrollRecord>) => void;
  clockInEmployee: (empId: string) => void;
  clockOutEmployee: (empId: string) => void;

  // Lab Facilities & Staff Signatures
  labInfo: LabInfo;
  updateLabInfo: (info: LabInfo) => void;
  facilities: LabFacility[];
  staffMembers: StaffMember[];
  staffSignatures: LabStaffSignatures;
  updateStaffSignatures: (signatures: LabStaffSignatures) => void;
  staffSignatureOptions: {
    chemists: StaffOptionItem[];
    verifiers: StaffOptionItem[];
    consultants: StaffOptionItem[];
  };
  addStaffSignatureOption: (role: 'chemist' | 'verifier' | 'consultant', item: { name: string; title: string; license?: string }) => void;
  updateStaffSignatureOption: (role: 'chemist' | 'verifier' | 'consultant', id: string, item: { name: string; title: string; license?: string }) => void;
  deleteStaffSignatureOption: (role: 'chemist' | 'verifier' | 'consultant', id: string) => void;

  // Security & Audit
  auditLogs: AuditLog[];
  logAction: (action: AuditLog['action'], module: AuditLog['module'], description: string) => void;

  // Notifications
  notifications: AppNotification[];
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  addNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;

  // GitHub Cloud Sync
  githubConfig: GitHubSyncConfig;
  updateGithubConfig: (config: Partial<GitHubSyncConfig>) => void;
  syncUnifiedDataToGitHub: () => Promise<{ success: boolean; message: string }>;
  syncAllDevicesNow: () => Promise<{ success: boolean; message: string; reportsCount?: number; invoicesCount?: number }>;

  // Backups
  exportBackup: (password?: string) => Promise<string>;
  importBackup: (backupJson: string, password?: string) => Promise<{ success: boolean; message: string }>;
  resetToDefaultData: () => void;
  clearPatientRecordsOnly: () => void;

  // Quick Action Modal Controls
  isPatientFormOpen: boolean;
  setIsPatientFormOpen: (open: boolean) => void;
  isBarcodeScannerOpen: boolean;
  setIsBarcodeScannerOpen: (open: boolean) => void;
  isLabInfoModalOpen: boolean;
  setIsLabInfoModalOpen: (open: boolean) => void;
}

export function mergeTwoReports(localRep: LabReport, remoteRep: LabReport): LabReport {
  const localTime = new Date(localRep.updatedAt || localRep.createdAt || 0).getTime();
  const remoteTime = new Date(remoteRep.updatedAt || remoteRep.createdAt || 0).getTime();

  // Count entered results
  const localResultCount = localRep.profiles?.reduce((acc, prof) => acc + (prof.parameters?.filter(p => p.result && p.result.trim() !== '').length || 0), 0) || 0;
  const remoteResultCount = remoteRep.profiles?.reduce((acc, prof) => acc + (prof.parameters?.filter(p => p.result && p.result.trim() !== '').length || 0), 0) || 0;

  // Decide profile parameters
  let chosenProfiles = remoteRep.profiles || localRep.profiles || [];
  if (localResultCount > 0 && remoteResultCount === 0) {
    chosenProfiles = localRep.profiles;
  } else if (remoteResultCount > 0 && localResultCount === 0) {
    chosenProfiles = remoteRep.profiles;
  } else if (localResultCount > 0 && remoteResultCount > 0) {
    chosenProfiles = (remoteRep.profiles || []).map(remoteProf => {
      const localProf = localRep.profiles?.find(lp => lp.profileCode === remoteProf.profileCode || lp.titleEn === remoteProf.titleEn || lp.titleAr === remoteProf.titleAr);
      if (!localProf) return remoteProf;
      const mergedParams = remoteProf.parameters.map(remParam => {
        const locParam = localProf.parameters?.find(lp => lp.name === remParam.name || lp.id === remParam.id);
        if (locParam && locParam.result && (!remParam.result || localTime > remoteTime)) {
          return { ...remParam, result: locParam.result, flag: locParam.flag || remParam.flag };
        }
        return remParam;
      });
      return { ...remoteProf, parameters: mergedParams };
    });
  } else if (localTime > remoteTime) {
    chosenProfiles = localRep.profiles || remoteRep.profiles;
  }

  // Merge patient data safely so home visit info and phone are NEVER wiped out
  const isHome = remoteRep.patient?.isHomeVisit ?? localRep.patient?.isHomeVisit ?? (remoteRep.patient?.bookingType === 'home_visit' || localRep.patient?.bookingType === 'home_visit');
  const bType = remoteRep.patient?.bookingType || localRep.patient?.bookingType || (isHome ? 'home_visit' : 'branch');
  const vFee = remoteRep.patient?.visitFee ?? localRep.patient?.visitFee ?? 0;
  const hAddr = remoteRep.patient?.homeAddress || localRep.patient?.homeAddress || (remoteRep.patient as any)?.visitAddress || (localRep.patient as any)?.visitAddress;

  const mergedPatient: Patient = {
    ...localRep.patient,
    ...remoteRep.patient,
    bookingType: bType,
    isHomeVisit: isHome,
    visitFee: vFee,
    homeAddress: hAddr,
    deliveryNotes: remoteRep.patient?.deliveryNotes || localRep.patient?.deliveryNotes,
    visitSpecialist: remoteRep.patient?.visitSpecialist || localRep.patient?.visitSpecialist,
    phone: remoteRep.patient?.phone || localRep.patient?.phone,
    totalCost: remoteRep.patient?.totalCost ?? localRep.patient?.totalCost,
    paidAmount: remoteRep.patient?.paidAmount ?? localRep.patient?.paidAmount,
    remainingAmount: remoteRep.patient?.remainingAmount ?? localRep.patient?.remainingAmount,
    discountApplied: remoteRep.patient?.discountApplied ?? localRep.patient?.discountApplied,
    paymentStatus: remoteRep.patient?.paymentStatus || localRep.patient?.paymentStatus
  };

  const status = (remoteRep.status === 'verified' || localRep.status === 'verified') ? 'verified' : (remoteRep.status || localRep.status || 'draft');

  return {
    ...localRep,
    ...remoteRep,
    status,
    patient: mergedPatient,
    profiles: chosenProfiles,
    staff: {
      ...(localRep.staff || {}),
      ...(remoteRep.staff || {})
    },
    updatedAt: new Date(Math.max(localTime, remoteTime, Date.now())).toISOString()
  };
}

export function mergeTwoInvoices(localInv: IncomeRecord, remoteInv: IncomeRecord): IncomeRecord {
  const localTime = new Date(localInv.updatedAt || localInv.createdAt || 0).getTime();
  const remoteTime = new Date(remoteInv.updatedAt || remoteInv.createdAt || 0).getTime();

  const isHome = remoteInv.isHomeVisit ?? localInv.isHomeVisit ?? (remoteInv.bookingType === 'home_visit' || localInv.bookingType === 'home_visit');
  const bType = remoteInv.bookingType || localInv.bookingType || (isHome ? 'home_visit' : 'branch');
  const vFee = remoteInv.visitFee ?? localInv.visitFee ?? 0;
  const vAddr = remoteInv.visitAddress || localInv.visitAddress;

  return {
    ...localInv,
    ...remoteInv,
    isHomeVisit: isHome,
    bookingType: bType,
    visitFee: vFee,
    visitAddress: vAddr,
    deliveryNotes: (remoteInv as any).deliveryNotes || (localInv as any).deliveryNotes,
    visitSpecialist: remoteInv.visitSpecialist || localInv.visitSpecialist,
    patientPhone: remoteInv.patientPhone || localInv.patientPhone,
    tests: (remoteInv.tests && remoteInv.tests.length > 0) ? remoteInv.tests : localInv.tests,
    testsSubtotal: remoteInv.testsSubtotal ?? localInv.testsSubtotal,
    discount: remoteInv.discount ?? localInv.discount,
    subtotal: remoteInv.subtotal ?? localInv.subtotal,
    netAmount: remoteInv.netAmount ?? localInv.netAmount,
    paidAmount: remoteInv.paidAmount ?? localInv.paidAmount,
    remainingAmount: remoteInv.remainingAmount ?? localInv.remainingAmount,
    paymentStatus: (remoteInv.paymentStatus === 'paid' || localInv.paymentStatus === 'paid') ? 'paid' : (remoteInv.paymentStatus || localInv.paymentStatus),
    updatedAt: new Date(Math.max(localTime, remoteTime, Date.now())).toISOString()
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Language & Current User
  const [language, setLanguage] = useState<Language>('ar');
  const [users] = useState<UserProfile[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<UserProfile>(INITIAL_USERS[0]);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // 2. Active Tab
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // 3. Quick Action Modals
  const [isPatientFormOpen, setIsPatientFormOpen] = useState(false);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [isLabInfoModalOpen, setIsLabInfoModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<IncomeRecord | null>(null);

  // 4. Reports (Unified Diagnostic Worklist)
  const [reports, setReports] = useState<LabReport[]>(() => {
    try {
      const saved = localStorage.getItem(REPORTS_KEY) || localStorage.getItem('rt_lab_reports_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return INITIAL_REPORTS;
    } catch {
      return INITIAL_REPORTS;
    }
  });

  const [selectedReportId, setSelectedReportId] = useState<string | null>(() => {
    return reports[0]?.id || null;
  });

  // 5. Income & Invoices (Financial Records)
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>(() => {
    try {
      const saved = localStorage.getItem(INCOME_KEY) || localStorage.getItem('rt_lab_income_records_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return INITIAL_INCOME_RECORDS;
    } catch {
      return INITIAL_INCOME_RECORDS;
    }
  });

  // 6. Test Catalog (Auto-merged to guarantee all 142 individual tests)
  const [testCatalog, setTestCatalog] = useState<InvoiceTestItem[]>(() => {
    try {
      const saved = localStorage.getItem(CATALOG_KEY) || localStorage.getItem('rt_lab_individual_tests_v2');
      const parsed = saved ? JSON.parse(saved) : null;
      return mergeCatalogWithDefaults(Array.isArray(parsed) && parsed.length > 0 ? parsed : undefined);
    } catch {
      return mergeCatalogWithDefaults();
    }
  });

  // 6b. Comprehensive Packages (Auto-merged to guarantee 15 packages)
  const [packages, setPackages] = useState<ComprehensivePackage[]>(() => {
    try {
      const saved = localStorage.getItem(PACKAGES_KEY);
      const parsed = saved ? JSON.parse(saved) : null;
      return mergePackagesWithDefaults(Array.isArray(parsed) && parsed.length > 0 ? parsed : undefined);
    } catch {
      return mergePackagesWithDefaults();
    }
  });

  // 6c. Diagnostic Profile Templates (Auto-merged to guarantee 24 comprehensive profiles)
  const [diagnosticProfiles, setDiagnosticProfiles] = useState<CatalogProfileTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(DIAGNOSTIC_PROFILES_KEY) || localStorage.getItem('rt_lab_custom_catalog_v3') || localStorage.getItem('rt_lab_catalog_v2');
      const parsed = saved ? JSON.parse(saved) : null;
      return mergeProfilesWithDefaults(Array.isArray(parsed) && parsed.length > 0 ? parsed : undefined);
    } catch {
      return mergeProfilesWithDefaults();
    }
  });

  // 7. Loyalty Profiles
  const [loyaltyProfiles, setLoyaltyProfiles] = useState<PatientLoyaltyProfile[]>(() => {
    try {
      const saved = localStorage.getItem(LOYALTY_KEY) || localStorage.getItem('rt_lab_loyalty_profiles_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return INITIAL_LOYALTY_DATA;
    } catch {
      return INITIAL_LOYALTY_DATA;
    }
  });

  const [loyaltyConfig] = useState<LoyaltyConfig>(DEFAULT_LOYALTY_CONFIG);

  // 8. Expenses & Profit Config & Closeouts
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => {
    try {
      const saved = localStorage.getItem(EXPENSES_KEY) || localStorage.getItem('rt_lab_expense_records_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [profitConfig, setProfitConfig] = useState<ProfitShareConfig>(INITIAL_PROFIT_CONFIG);
  const [dailyCloseouts, setDailyCloseouts] = useState<DailyCloseout[]>(() => {
    try {
      const saved = localStorage.getItem(CLOSEOUTS_KEY) || localStorage.getItem('rt_lab_daily_closeouts_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 9. Inventory & Reagents
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(INVENTORY_KEY) || localStorage.getItem('rt_lab_inventory_items_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return INITIAL_INVENTORY;
    } catch {
      return INITIAL_INVENTORY;
    }
  });

  // 10. Lab Instruments & Interfacing
  const [instruments, setInstruments] = useState<LabInstrument[]>(() => {
    try {
      const saved = localStorage.getItem(INSTRUMENTS_KEY);
      return saved ? JSON.parse(saved) : INITIAL_INSTRUMENTS;
    } catch {
      return INITIAL_INSTRUMENTS;
    }
  });

  const [transmissions, setTransmissions] = useState<InstrumentTransmission[]>(() => {
    try {
      const saved = localStorage.getItem(TRANSMISSIONS_KEY);
      return saved ? JSON.parse(saved) : SAMPLE_INSTRUMENT_TRANSMISSIONS;
    } catch {
      return SAMPLE_INSTRUMENT_TRANSMISSIONS;
    }
  });

  // 11. Lab to Lab
  const [labToLabOrders, setLabToLabOrders] = useState<LabToLabOrder[]>(() => {
    try {
      const saved = localStorage.getItem(LAB_TO_LAB_KEY) || localStorage.getItem('rt_lab_lab_to_lab_orders_v1');
      return saved ? JSON.parse(saved) : INITIAL_LAB_TO_LAB;
    } catch {
      return INITIAL_LAB_TO_LAB;
    }
  });

  // 12. HR Employees, Attendance, Payroll
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem(EMPLOYEES_KEY) || localStorage.getItem('rt_lab_employees_v1');
      return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
    } catch {
      return INITIAL_EMPLOYEES;
    }
  });
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE);
  const [payroll, setPayroll] = useState<PayrollRecord[]>(INITIAL_PAYROLL);

  // 13. Lab Info & Branches
  const [labInfo, setLabInfo] = useState<LabInfo>(() => {
    try {
      const saved = localStorage.getItem(LAB_INFO_KEY) || localStorage.getItem('rt_lab_custom_lab_info_v2');
      return saved ? JSON.parse(saved) : INITIAL_LAB_INFO;
    } catch {
      return INITIAL_LAB_INFO;
    }
  });
  const [facilities] = useState<LabFacility[]>(INITIAL_FACILITIES);
  const [staffMembers] = useState<StaffMember[]>(INITIAL_STAFF_MEMBERS);

  // 13b. Staff Signatures and Options
  const [staffSignatures, setStaffSignatures] = useState<LabStaffSignatures>(() => {
    try {
      const saved = localStorage.getItem(STAFF_SIGNATURES_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_STAFF;
    } catch {
      return DEFAULT_STAFF;
    }
  });

  const [staffSignatureOptions, setStaffSignatureOptions] = useState<{
    chemists: StaffOptionItem[];
    verifiers: StaffOptionItem[];
    consultants: StaffOptionItem[];
  }>(() => {
    try {
      const saved = localStorage.getItem(STAFF_OPTIONS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.chemists && parsed.verifiers && parsed.consultants) return parsed;
      }
      return INITIAL_STAFF_SIGNATURE_OPTIONS;
    } catch {
      return INITIAL_STAFF_SIGNATURE_OPTIONS;
    }
  });

  // 14. Audit Log
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const saved = localStorage.getItem(AUDIT_KEY) || localStorage.getItem('rt_lab_audit_logs_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 15. Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: "notif-welcome",
      title: "تم توحيد منظومة RT الطبية والمالية بنجاح",
      message: "تم دمج النظام المالي، تقارير التشخيص الطبي، والربط مع الأجهزة في منصة واحدة موحدة ومتزامنة كلياً.",
      type: "success",
      timestamp: "الآن",
      read: false
    }
  ]);

  // 16. GitHub Sync Config
  const [githubConfig, setGithubConfig] = useState<GitHubSyncConfig>(INITIAL_GITHUB_CONFIG);

  // Automatic Debounced Cloud Push: Pushes to GitHub cloud whenever reports or invoices change
  const cloudPushTimeoutRef = useRef<any>(null);

  const triggerAutoCloudPush = useCallback((customReports?: LabReport[], customInvoices?: IncomeRecord[]) => {
    if (!githubConfig.token || !githubConfig.autoSync) return;
    if (cloudPushTimeoutRef.current) {
      clearTimeout(cloudPushTimeoutRef.current);
    }
    const currentReps = customReports || reports;
    const currentInvs = customInvoices || incomeRecords;

    cloudPushTimeoutRef.current = setTimeout(async () => {
      try {
        const snapshot = {
          reports: currentReps,
          incomeRecords: currentInvs,
          expenses,
          loyaltyProfiles,
          inventory,
          dailyCloseouts,
          labInfo,
          staffSignatures,
          staffSignatureOptions,
          testCatalog,
          packages,
          diagnosticProfiles
        };
        await pushFullStoreToGitHub(githubConfig, snapshot);
      } catch (err) {
        console.warn('Auto cloud push error:', err);
      }
    }, 1200);
  }, [githubConfig, reports, incomeRecords, expenses, loyaltyProfiles, inventory, dailyCloseouts, labInfo, staffSignatures, staffSignatureOptions, testCatalog, packages, diagnosticProfiles]);

  // Persistence Effects
  useEffect(() => { try { localStorage.setItem(REPORTS_KEY, JSON.stringify(reports)); } catch (e) { console.error(e); } }, [reports]);
  useEffect(() => { try { localStorage.setItem(INCOME_KEY, JSON.stringify(incomeRecords)); } catch (e) { console.error(e); } }, [incomeRecords]);
  useEffect(() => { try { localStorage.setItem(LOYALTY_KEY, JSON.stringify(loyaltyProfiles)); } catch (e) { console.error(e); } }, [loyaltyProfiles]);
  useEffect(() => { try { localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses)); } catch (e) { console.error(e); } }, [expenses]);
  useEffect(() => { try { localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory)); } catch (e) { console.error(e); } }, [inventory]);
  useEffect(() => { try { localStorage.setItem(INSTRUMENTS_KEY, JSON.stringify(instruments)); } catch (e) { console.error(e); } }, [instruments]);
  useEffect(() => { try { localStorage.setItem(TRANSMISSIONS_KEY, JSON.stringify(transmissions)); } catch (e) { console.error(e); } }, [transmissions]);
  useEffect(() => { try { localStorage.setItem(AUDIT_KEY, JSON.stringify(auditLogs)); } catch (e) { console.error(e); } }, [auditLogs]);
  useEffect(() => { try { localStorage.setItem(LAB_INFO_KEY, JSON.stringify(labInfo)); } catch (e) { console.error(e); } }, [labInfo]);
  useEffect(() => { 
    try { 
      localStorage.setItem(CATALOG_KEY, JSON.stringify(testCatalog)); 
      localStorage.setItem('rt_lab_individual_tests_v2', JSON.stringify(testCatalog));
    } catch (e) { 
      console.error(e); 
    } 
  }, [testCatalog]);

  useEffect(() => { 
    try { 
      localStorage.setItem(PACKAGES_KEY, JSON.stringify(packages)); 
    } catch (e) { 
      console.error(e); 
    } 
  }, [packages]);

  useEffect(() => { 
    try { 
      localStorage.setItem(DIAGNOSTIC_PROFILES_KEY, JSON.stringify(diagnosticProfiles)); 
      localStorage.setItem('rt_lab_catalog_v2', JSON.stringify(diagnosticProfiles));
    } catch (e) { 
      console.error(e); 
    } 
  }, [diagnosticProfiles]);

  useEffect(() => {
    try { localStorage.setItem(STAFF_SIGNATURES_KEY, JSON.stringify(staffSignatures)); } catch (e) { console.error(e); }
  }, [staffSignatures]);

  useEffect(() => {
    try { localStorage.setItem(STAFF_OPTIONS_KEY, JSON.stringify(staffSignatureOptions)); } catch (e) { console.error(e); }
  }, [staffSignatureOptions]);

  // Automatic Migration Run on Mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && localStorage.getItem(MIGRATION_VERSION_KEY) !== 'true') {
        runGlobalDataUpgrade();
      }
    } catch (err) {
      console.warn('Migration run error:', err);
    }
  }, []);

  // Real-Time Multi-Device Cloud Synchronization (Firebase Firestore + GitHub Cloud Backup)
  useEffect(() => {
    // 1. Subscribe to real-time events from other devices via Firebase Firestore live channel
    const unsubscribe = realtimeSyncManager.subscribe((msg) => {
      if (!msg || !msg.action) return;

      if (msg.action === 'UPDATE_REPORT' && msg.payload) {
        setReports(prev => {
          const reportPayload = msg.payload as LabReport;
          const idx = prev.findIndex(r => r.id === reportPayload.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx], ...reportPayload };
            return next;
          }
          return [reportPayload, ...prev];
        });
      } else if (msg.action === 'DELETE_REPORT' && msg.payload) {
        setReports(prev => prev.filter(r => r.id !== msg.payload));
      } else if (msg.action === 'UPDATE_INVOICE' && msg.payload) {
        setIncomeRecords(prev => {
          const invPayload = msg.payload as IncomeRecord;
          const idx = prev.findIndex(i => i.id === invPayload.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx], ...invPayload };
            return next;
          }
          return [invPayload, ...prev];
        });
      } else if (msg.action === 'DELETE_INVOICE' && msg.payload) {
        setIncomeRecords(prev => prev.filter(i => i.id !== msg.payload));
      } else if (msg.action === 'UPDATE_LAB_INFO' && msg.payload) {
        setLabInfo(msg.payload);
      } else if (msg.action === 'UPDATE_LOYALTY' && msg.payload) {
        if (Array.isArray(msg.payload)) {
          setLoyaltyProfiles(msg.payload);
        } else if (msg.payload.patientId) {
          setLoyaltyProfiles(prev => {
            const idx = prev.findIndex(p => p.patientId === msg.payload.patientId || p.phone === msg.payload.phone);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = { ...next[idx], ...msg.payload };
              return next;
            }
            return [msg.payload, ...prev];
          });
        }
      } else if (msg.action === 'UPDATE_EXPENSES' && msg.payload) {
        if (Array.isArray(msg.payload)) {
          setExpenses(msg.payload);
        } else if (msg.payload.id) {
          setExpenses(prev => {
            const idx = prev.findIndex(e => e.id === msg.payload.id);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = { ...next[idx], ...msg.payload };
              return next;
            }
            return [msg.payload, ...prev];
          });
        }
      } else if (msg.action === 'UPDATE_INVENTORY' && msg.payload) {
        if (Array.isArray(msg.payload)) {
          setInventory(msg.payload);
        }
      } else if (msg.action === 'UPDATE_CATALOG' && Array.isArray(msg.payload)) {
        setTestCatalog(prev => mergeCatalogWithDefaults(msg.payload));
      } else if (msg.action === 'UPDATE_PACKAGES' && Array.isArray(msg.payload)) {
        setPackages(prev => mergePackagesWithDefaults(msg.payload));
      } else if (msg.action === 'UPDATE_PROFILES' && Array.isArray(msg.payload)) {
        setDiagnosticProfiles(prev => mergeProfilesWithDefaults(msg.payload));
      } else if (msg.action === 'PING_TEST') {
        addNotification({
          title: '⚡ تسميع لحظي متزامن فوري',
          message: `تم استلام إشارة اتصال وتسميع فوري بنجاح من جهاز: ${msg.senderDeviceName}`,
          type: 'success'
        });
      } else if (msg.action === 'FULL_SYNC' && msg.payload) {
        if (Array.isArray(msg.payload.reports)) {
          setReports(prev => {
            const map = new Map(prev.map(r => [r.id, r]));
            msg.payload.reports.forEach((r: LabReport) => map.set(r.id, r));
            return Array.from(map.values());
          });
        }
        if (Array.isArray(msg.payload.incomeRecords)) {
          setIncomeRecords(prev => {
            const map = new Map(prev.map(i => [i.id, i]));
            msg.payload.incomeRecords.forEach((i: IncomeRecord) => map.set(i.id, i));
            return Array.from(map.values());
          });
        }
        if (Array.isArray(msg.payload.expenses)) {
          setExpenses(msg.payload.expenses);
        }
        if (Array.isArray(msg.payload.loyaltyProfiles)) {
          setLoyaltyProfiles(msg.payload.loyaltyProfiles);
        }
        if (msg.payload.labInfo) {
          setLabInfo(msg.payload.labInfo);
        }
        if (Array.isArray(msg.payload.packages) && msg.payload.packages.length > 0) {
          setPackages(prev => mergePackagesWithDefaults(msg.payload.packages));
        }
        if (Array.isArray(msg.payload.diagnosticProfiles) && msg.payload.diagnosticProfiles.length > 0) {
          setDiagnosticProfiles(prev => mergeProfilesWithDefaults(msg.payload.diagnosticProfiles));
        }
      }
    });

    // 2. Initial cloud master pull on mount (from Firebase Firestore first, fallback to GitHub)
    realtimeSyncManager.pullMasterSnapshot().then(res => {
      if (res.success && res.data) {
        if (Array.isArray(res.data.reports) && res.data.reports.length > 0) {
          setReports(prev => {
            const map = new Map<string, LabReport>();
            prev.forEach(r => {
              if (r.id) map.set(r.id, r);
              if (r.reportNumber) map.set(r.reportNumber, r);
              if (r.patient?.barcode) map.set(r.patient.barcode, r);
            });
            res.data.reports.forEach((r: LabReport) => {
              const existing = map.get(r.id) || (r.reportNumber && map.get(r.reportNumber)) || (r.patient?.barcode && map.get(r.patient.barcode));
              if (existing) {
                const merged = mergeTwoReports(existing, r);
                map.set(existing.id, merged);
                if (merged.reportNumber) map.set(merged.reportNumber, merged);
                if (merged.patient?.barcode) map.set(merged.patient.barcode, merged);
              } else {
                map.set(r.id, r);
              }
            });
            return Array.from(new Set(map.values()));
          });
        }
        if (Array.isArray(res.data.incomeRecords) && res.data.incomeRecords.length > 0) {
          setIncomeRecords(prev => {
            const map = new Map<string, IncomeRecord>();
            prev.forEach(i => {
              if (i.id) map.set(i.id, i);
              if (i.invoiceNumber) map.set(i.invoiceNumber, i);
              if (i.barcode) map.set(i.barcode, i);
            });
            res.data.incomeRecords.forEach((i: IncomeRecord) => {
              const existing = map.get(i.id) || (i.invoiceNumber && map.get(i.invoiceNumber)) || (i.barcode && map.get(i.barcode));
              if (existing) {
                const merged = mergeTwoInvoices(existing, i);
                map.set(existing.id, merged);
                if (merged.invoiceNumber) map.set(merged.invoiceNumber, merged);
                if (merged.barcode) map.set(merged.barcode, merged);
              } else {
                map.set(i.id, i);
              }
            });
            return Array.from(new Set(map.values()));
          });
        }
        if (Array.isArray(res.data.expenses) && res.data.expenses.length > 0) {
          setExpenses(res.data.expenses);
        }
        if (Array.isArray(res.data.loyaltyProfiles) && res.data.loyaltyProfiles.length > 0) {
          setLoyaltyProfiles(res.data.loyaltyProfiles);
        }
        if (res.data.labInfo) {
          setLabInfo(res.data.labInfo);
        }
        if (Array.isArray(res.data.testCatalog) && res.data.testCatalog.length > 0) {
          setTestCatalog(prev => mergeCatalogWithDefaults(res.data.testCatalog));
        }
        if (Array.isArray(res.data.packages) && res.data.packages.length > 0) {
          setPackages(prev => mergePackagesWithDefaults(res.data.packages));
        }
        if (Array.isArray(res.data.diagnosticProfiles) && res.data.diagnosticProfiles.length > 0) {
          setDiagnosticProfiles(prev => mergeProfilesWithDefaults(res.data.diagnosticProfiles));
        }
      } else {
        // Fallback to GitHub repo store directly
        pullFullStoreFromGitHub(githubConfig).then(ghRes => {
          if (ghRes.success && ghRes.data) {
            if (Array.isArray(ghRes.data.reports) && ghRes.data.reports.length > 0) {
              setReports(prev => {
                const map = new Map<string, LabReport>();
                prev.forEach(r => {
                  if (r.id) map.set(r.id, r);
                  if (r.reportNumber) map.set(r.reportNumber, r);
                  if (r.patient?.barcode) map.set(r.patient.barcode, r);
                });
                ghRes.data.reports.forEach((r: LabReport) => {
                  const existing = map.get(r.id) || (r.reportNumber && map.get(r.reportNumber)) || (r.patient?.barcode && map.get(r.patient.barcode));
                  if (existing) {
                    const merged = mergeTwoReports(existing, r);
                    map.set(existing.id, merged);
                    if (merged.reportNumber) map.set(merged.reportNumber, merged);
                    if (merged.patient?.barcode) map.set(merged.patient.barcode, merged);
                  } else {
                    map.set(r.id, r);
                  }
                });
                return Array.from(new Set(map.values()));
              });
            }
            if (Array.isArray(ghRes.data.incomeRecords) && ghRes.data.incomeRecords.length > 0) {
              setIncomeRecords(prev => {
                const map = new Map<string, IncomeRecord>();
                prev.forEach(i => {
                  if (i.id) map.set(i.id, i);
                  if (i.invoiceNumber) map.set(i.invoiceNumber, i);
                  if (i.barcode) map.set(i.barcode, i);
                });
                ghRes.data.incomeRecords.forEach((i: IncomeRecord) => {
                  const existing = map.get(i.id) || (i.invoiceNumber && map.get(i.invoiceNumber)) || (i.barcode && map.get(i.barcode));
                  if (existing) {
                    const merged = mergeTwoInvoices(existing, i);
                    map.set(existing.id, merged);
                    if (merged.invoiceNumber) map.set(merged.invoiceNumber, merged);
                    if (merged.barcode) map.set(merged.barcode, merged);
                  } else {
                    map.set(i.id, i);
                  }
                });
                return Array.from(new Set(map.values()));
              });
            }
            if (Array.isArray(ghRes.data.expenses) && ghRes.data.expenses.length > 0) {
              setExpenses(ghRes.data.expenses);
            }
            if (Array.isArray(ghRes.data.loyaltyProfiles) && ghRes.data.loyaltyProfiles.length > 0) {
              setLoyaltyProfiles(ghRes.data.loyaltyProfiles);
            }
            if (Array.isArray(ghRes.data.inventory) && ghRes.data.inventory.length > 0) {
              setInventory(ghRes.data.inventory);
            }
            if (ghRes.data.labInfo) {
              setLabInfo(ghRes.data.labInfo);
            }
            if (Array.isArray(ghRes.data.testCatalog) && ghRes.data.testCatalog.length > 0) {
              setTestCatalog(prev => mergeCatalogWithDefaults(ghRes.data.testCatalog));
            }
            if (Array.isArray(ghRes.data.packages) && ghRes.data.packages.length > 0) {
              setPackages(prev => mergePackagesWithDefaults(ghRes.data.packages, prev));
            }
            if (Array.isArray(ghRes.data.diagnosticProfiles) && ghRes.data.diagnosticProfiles.length > 0) {
              setDiagnosticProfiles(prev => mergeProfilesWithDefaults(ghRes.data.diagnosticProfiles));
            }

            // Also check for pending incoming diagnostic cases from GitHub queue (sync cases 50 to 68+)
            fetchDiagnosticCases(githubConfig).then(casesRes => {
              if (casesRes.success && Array.isArray(casesRes.cases) && casesRes.cases.length > 0) {
                // 1. Sync reports
                setReports(curReports => {
                  const existingCodes = new Set(curReports.map(r => r.patient?.barcode || r.reportNumber));
                  let addedCount = 0;
                  const newOnes: LabReport[] = [];
                  casesRes.cases!.forEach(c => {
                    const code = c.barcode || c.labNumber;
                    if (code && !existingCodes.has(code)) {
                      existingCodes.add(code);
                      addedCount++;
                      const actualTests = (Array.isArray(c.tests) && c.tests.length > 0)
                        ? c.tests
                        : (c.testNames || ['تحاليل مخبرية']).map((tName, idx) => ({
                            id: `tst-${idx}-${c.id}`,
                            code: `TST-${idx}`,
                            nameAr: tName,
                            nameEn: tName,
                            category: 'Clinical',
                            price: 150,
                            cost: 30
                          }));
                      const net = c.totalCost || 200;
                      const paid = c.paidAmount !== undefined ? c.paidAmount : (c.paymentStatus === 'paid' ? net : 0);
                      const isHome = c.isHomeVisit ?? (c.bookingType === 'home_visit' || (c.visitFee && c.visitFee > 0));
                      const vFee = c.visitFee || 0;
                      const vAddr = c.visitAddress || c.homeAddress || '';
                      const bType = c.bookingType || (isHome ? 'home_visit' : 'branch');
                      const disc = c.discount || 0;
                      const testsSub = c.testsSubtotal || net;

                      const rep = convertIncomeRecordToDiagnosticReport({
                        id: c.id,
                        invoiceNumber: c.invoiceNumber || `INV-${c.labNumber.replace('RT-', '')}`,
                        labNumber: c.labNumber,
                        barcode: c.barcode,
                        patientName: c.fullName,
                        patientAge: c.age || 30,
                        patientGender: c.gender || 'male',
                        patientPhone: c.phone || '',
                        referringDoctor: c.referringDoctorName || 'كشف معمل',
                        tests: actualTests,
                        subtotal: net,
                        discount: disc,
                        netAmount: net,
                        paidAmount: paid,
                        remainingAmount: Math.max(0, net - paid),
                        paymentMethod: c.paymentMethod || 'cash',
                        paymentStatus: (c.paymentStatus as any) || (paid >= net ? 'paid' : 'pending'),
                        cashierName: 'مزامنة سحابية',
                        branch: 'الفرع الرئيسي - بهتيم',
                        syncStatus: 'synced',
                        createdAt: c.sampleDate || new Date().toISOString(),
                        updatedAt: c.sampleDate || new Date().toISOString(),
                        isHomeVisit: isHome,
                        bookingType: bType,
                        visitFee: vFee,
                        visitAddress: vAddr,
                        homeAddress: vAddr,
                        deliveryNotes: c.deliveryNotes || '',
                        visitSpecialist: c.visitSpecialist || '',
                        testsSubtotal: testsSub,
                        discountApplied: disc
                      }) as unknown as LabReport;
                      newOnes.push(rep);
                    }
                  });
                  return addedCount > 0 ? [...newOnes, ...curReports] : curReports;
                });

                // 2. Sync corresponding financial invoices
                setIncomeRecords(curInvoices => {
                  const existingCodes = new Set(curInvoices.map(i => i.invoiceNumber || i.labNumber));
                  let addedInvoices = 0;
                  const newInvoices: IncomeRecord[] = [];
                  casesRes.cases!.forEach(c => {
                    const invNumber = c.invoiceNumber || `INV-${c.labNumber.replace('RT-', '')}`;
                    if (!existingCodes.has(invNumber) && !existingCodes.has(c.labNumber)) {
                      existingCodes.add(invNumber);
                      existingCodes.add(c.labNumber);
                      addedInvoices++;
                      const net = c.totalCost || 200;
                      const paid = c.paidAmount !== undefined ? c.paidAmount : (c.paymentStatus === 'paid' ? net : 0);
                      const isHome = c.isHomeVisit ?? (c.bookingType === 'home_visit' || (c.visitFee && c.visitFee > 0));
                      const vFee = c.visitFee || 0;
                      const vAddr = c.visitAddress || c.homeAddress || '';
                      const bType = c.bookingType || (isHome ? 'home_visit' : 'branch');
                      const disc = c.discount || 0;
                      const testsSub = c.testsSubtotal || net;

                      const actualTests = (Array.isArray(c.tests) && c.tests.length > 0)
                        ? c.tests
                        : (c.testNames || ['تحاليل مخبرية']).map((tName, idx) => ({
                            id: `tst-${idx}-${c.id}`,
                            code: `TST-${idx}`,
                            nameAr: tName,
                            nameEn: tName,
                            category: 'Clinical',
                            price: 150,
                            cost: 30
                          }));
                      newInvoices.push({
                        id: `inv-${c.id || c.labNumber}-${Date.now()}`,
                        invoiceNumber: invNumber,
                        patientName: c.fullName,
                        patientPhone: c.phone || '',
                        patientAge: c.age || 30,
                        patientGender: c.gender || 'male',
                        barcode: c.barcode,
                        labNumber: c.labNumber,
                        referringDoctor: c.referringDoctorName || 'كشف معمل',
                        tests: actualTests,
                        subtotal: net,
                        testsSubtotal: testsSub,
                        discount: disc,
                        visitFee: vFee,
                        isHomeVisit: isHome,
                        bookingType: bType,
                        visitAddress: vAddr,
                        deliveryNotes: c.deliveryNotes || '',
                        visitSpecialist: c.visitSpecialist || '',
                        netAmount: net,
                        paidAmount: paid,
                        remainingAmount: Math.max(0, net - paid),
                        paymentMethod: (c.paymentMethod as any) || 'cash',
                        paymentStatus: (c.paymentStatus as any) || (paid >= net ? 'paid' : 'pending'),
                        cashierName: 'مزامنة سحابية',
                        branch: 'الفرع الرئيسي - بهتيم',
                        syncStatus: 'synced',
                        createdAt: c.sampleDate || new Date().toISOString(),
                        updatedAt: c.sampleDate || new Date().toISOString()
                      });
                    }
                  });
                  return addedInvoices > 0 ? [...newInvoices, ...curInvoices] : curInvoices;
                });
              }
            }).catch(() => {});

            addNotification({
              title: '⚡ المزامنة السحابية الموحدة مفعّلة',
              message: `تم جلب ومزامنة كافة السجلات بنجاح (${ghRes.data.reports?.length || 0} تقرير / ${ghRes.data.incomeRecords?.length || 0} فاتورة).`,
              type: 'success'
            });
          }
        }).catch(() => {});
      }
    }).catch(err => console.warn('Initial cloud pull:', err));

    return () => {
      unsubscribe();
    };
  }, [githubConfig]);

  // Periodic automatic background sync every 12 seconds to keep all devices updated bidirectionally
  useEffect(() => {
    if (!githubConfig.token || !githubConfig.autoSync) return;

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;

      pullFullStoreFromGitHub(githubConfig).then(ghRes => {
        if (ghRes.success && ghRes.data) {
          const data = ghRes.data;
          if (Array.isArray(data.reports) && data.reports.length > 0) {
            setReports(prev => {
              const currentMap = new Map<string, LabReport>();
              prev.forEach(r => {
                if (r.id) currentMap.set(r.id, r);
                if (r.reportNumber) currentMap.set(r.reportNumber, r);
                if (r.patient?.barcode) currentMap.set(r.patient.barcode, r);
              });

              let hasChanged = false;
              const nextReports = [...prev];

              data.reports.forEach((remoteRep: LabReport) => {
                const existing = currentMap.get(remoteRep.id) ||
                  (remoteRep.reportNumber && currentMap.get(remoteRep.reportNumber)) ||
                  (remoteRep.patient?.barcode && currentMap.get(remoteRep.patient.barcode));

                if (!existing) {
                  nextReports.unshift(remoteRep);
                  currentMap.set(remoteRep.id, remoteRep);
                  hasChanged = true;
                } else {
                  const merged = mergeTwoReports(existing, remoteRep);
                  // Check if merged is different from existing
                  const existingIdx = nextReports.findIndex(r => r.id === existing.id);
                  if (existingIdx !== -1 && JSON.stringify(merged) !== JSON.stringify(existing)) {
                    nextReports[existingIdx] = merged;
                    hasChanged = true;
                  }
                }
              });

              return hasChanged ? nextReports : prev;
            });
          }

          if (Array.isArray(data.incomeRecords) && data.incomeRecords.length > 0) {
            setIncomeRecords(prev => {
              const currentMap = new Map<string, IncomeRecord>();
              prev.forEach(i => {
                if (i.id) currentMap.set(i.id, i);
                if (i.invoiceNumber) currentMap.set(i.invoiceNumber, i);
                if (i.barcode) currentMap.set(i.barcode, i);
              });

              let hasChanged = false;
              const nextInvoices = [...prev];

              data.incomeRecords.forEach((remoteInv: IncomeRecord) => {
                const existing = currentMap.get(remoteInv.id) ||
                  (remoteInv.invoiceNumber && currentMap.get(remoteInv.invoiceNumber)) ||
                  (remoteInv.barcode && currentMap.get(remoteInv.barcode));

                if (!existing) {
                  nextInvoices.unshift(remoteInv);
                  currentMap.set(remoteInv.id, remoteInv);
                  hasChanged = true;
                } else {
                  const merged = mergeTwoInvoices(existing, remoteInv);
                  const existingIdx = nextInvoices.findIndex(i => i.id === existing.id);
                  if (existingIdx !== -1 && JSON.stringify(merged) !== JSON.stringify(existing)) {
                    nextInvoices[existingIdx] = merged;
                    hasChanged = true;
                  }
                }
              });

              return hasChanged ? nextInvoices : prev;
            });
          }

          if (Array.isArray(data.packages) && data.packages.length > 0) {
            setPackages(prev => mergePackagesWithDefaults(data.packages, prev));
          }
          if (Array.isArray(data.diagnosticProfiles) && data.diagnosticProfiles.length > 0) {
            setDiagnosticProfiles(prev => mergeProfilesWithDefaults(data.diagnosticProfiles));
          }
        }
      }).catch(() => {});
    }, 12000);

    return () => clearInterval(interval);
  }, [githubConfig]);


  // Re-pull latest cloud state when user returns to the tab (multi-device immediate catch-up)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        pullFullStoreFromGitHub(githubConfig).then(ghRes => {
          if (ghRes.success && ghRes.data) {
            if (Array.isArray(ghRes.data.reports) && ghRes.data.reports.length > 0) {
              setReports(prev => {
                const map = new Map<string, LabReport>();
                prev.forEach(r => {
                  if (r.id) map.set(r.id, r);
                  if (r.reportNumber) map.set(r.reportNumber, r);
                  if (r.patient?.barcode) map.set(r.patient.barcode, r);
                });
                ghRes.data.reports.forEach((r: LabReport) => {
                  const existing = map.get(r.id) || (r.reportNumber && map.get(r.reportNumber)) || (r.patient?.barcode && map.get(r.patient.barcode));
                  if (existing) {
                    map.set(existing.id, mergeTwoReports(existing, r));
                  } else {
                    map.set(r.id, r);
                  }
                });
                return Array.from(new Set(map.values()));
              });
            }
            if (Array.isArray(ghRes.data.incomeRecords) && ghRes.data.incomeRecords.length > 0) {
              setIncomeRecords(prev => {
                const map = new Map<string, IncomeRecord>();
                prev.forEach(i => {
                  if (i.id) map.set(i.id, i);
                  if (i.invoiceNumber) map.set(i.invoiceNumber, i);
                  if (i.barcode) map.set(i.barcode, i);
                });
                ghRes.data.incomeRecords.forEach((i: IncomeRecord) => {
                  const existing = map.get(i.id) || (i.invoiceNumber && map.get(i.invoiceNumber)) || (i.barcode && map.get(i.barcode));
                  if (existing) {
                    map.set(existing.id, mergeTwoInvoices(existing, i));
                  } else {
                    map.set(i.id, i);
                  }
                });
                return Array.from(new Set(map.values()));
              });
            }
          }
        }).catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [githubConfig]);

  // Debounced cloud save whenever critical lab data changes (Push to Firebase Firestore & GitHub)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (reports.length > 0 || incomeRecords.length > 0 || testCatalog.length > 0) {
        const payload = {
          reports,
          incomeRecords,
          expenses,
          loyaltyProfiles,
          inventory,
          labInfo,
          testCatalog,
          packages,
          diagnosticProfiles
        };

        // 1. Instant Firebase Cloud persistence
        realtimeSyncManager.pushMasterSnapshot(payload);

        // 2. Secondary GitHub backup
        if (githubConfig.autoSync && githubConfig.token) {
          pushFullStoreToGitHub(githubConfig, payload).catch(() => {});
        }
      }
    }, 15000);
    return () => clearTimeout(timer);
  }, [reports, incomeRecords, expenses, loyaltyProfiles, inventory, labInfo, testCatalog, packages, diagnosticProfiles, githubConfig]);

  // Audit Logging helper
  const logAction = useCallback((action: AuditLog['action'], module: AuditLog['module'], description: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toLocaleString('en-US'),
      userId: currentUser.id,
      userName: currentUser.nameAr,
      userRole: currentUser.role,
      action,
      module,
      description
    };
    setAuditLogs(prev => [newLog, ...prev.slice(0, 499)]);
  }, [currentUser]);

  // Notifications helper
  const addNotification = useCallback((notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Auth & Permissions
  const loginUser = useCallback((username: string, pin: string): boolean => {
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.pin === pin);
    if (user) {
      setCurrentUser(user);
      logAction('LOGIN', 'SECURITY', `تسجيل دخول ناجح للمستخدم ${user.nameAr} (${user.role})`);
      addNotification({
        title: `مرحباً ${user.nameAr}`,
        message: `تم تسجيل الدخول بنجاح بصلاحية: ${user.titleAr}`,
        type: 'info'
      });
      return true;
    }
    return false;
  }, [users, logAction, addNotification]);

  const logout = useCallback(() => {
    logAction('LOGIN', 'SECURITY', `تسجيل خروج للمستخدم ${currentUser.nameAr}`);
    setCurrentUser(INITIAL_USERS[0]);
  }, [currentUser, logAction]);

  const hasPermission = useCallback((module: string): boolean => {
    if (currentUser.role === 'admin_ceo') return true;
    if (currentUser.role === 'accountant') {
      return ['dashboard', 'admission', 'financial_income', 'expenses_profit', 'loyalty', 'reports_archive', 'audit_settings'].includes(module);
    }
    if (currentUser.role === 'chemist') {
      return ['dashboard', 'worklist', 'diagnostic_editor', 'reports_archive', 'instruments', 'catalog', 'loyalty'].includes(module);
    }
    if (currentUser.role === 'receptionist') {
      return ['dashboard', 'admission', 'financial_income', 'loyalty', 'reports_archive'].includes(module);
    }
    if (currentUser.role === 'lab_tech') {
      return ['dashboard', 'worklist', 'instruments', 'inventory'].includes(module);
    }
    if (currentUser.role === 'hr_officer') {
      return ['dashboard', 'hr', 'audit_settings'].includes(module);
    }
    return true;
  }, [currentUser]);

  // Selected Report
  const selectedReport = useMemo(() => {
    return reports.find(r => r.id === selectedReportId) || reports[0] || null;
  }, [reports, selectedReportId]);

  // Report CRUD
  const addReport = useCallback((report: LabReport) => {
    setReports(prev => {
      const next = [report, ...prev];
      triggerAutoCloudPush(next);
      return next;
    });
    setSelectedReportId(report.id);
    realtimeSyncManager.broadcastAction('UPDATE_REPORT', report);
    logAction('CREATE', 'DIAGNOSTIC', `إنشاء تقرير طبي جديد للمريض ${report.patient.fullName} برقم ${report.reportNumber}`);
  }, [logAction, triggerAutoCloudPush]);

  const updateReport = useCallback((id: string, updates: Partial<LabReport>) => {
    setReports(prev => {
      const updatedList = prev.map(r => r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r);
      const target = updatedList.find(r => r.id === id);
      if (target) {
        realtimeSyncManager.broadcastAction('UPDATE_REPORT', target);
      }
      triggerAutoCloudPush(updatedList);
      return updatedList;
    });
    logAction('UPDATE', 'DIAGNOSTIC', `تحديث التقرير الطبي رقم ${id}`);
  }, [logAction, triggerAutoCloudPush]);

  const deleteReport = useCallback((id: string) => {
    const reportToDelete = reports.find(r => r.id === id);
    setReports(prev => {
      const next = prev.filter(r => r.id !== id);
      triggerAutoCloudPush(next);
      return next;
    });
    realtimeSyncManager.broadcastAction('DELETE_REPORT', id);
    if (selectedReportId === id) {
      setSelectedReportId(null);
    }
    logAction('DELETE', 'DIAGNOSTIC', `حذف التقرير الطبي للمريض ${reportToDelete?.patient.fullName || id}`);
  }, [reports, selectedReportId, logAction, triggerAutoCloudPush]);

  const verifyReport = useCallback((id: string) => {
    setReports(prev => {
      const updatedList = prev.map(r => {
        if (r.id === id) {
          return {
            ...r,
            status: 'verified' as const,
            staff: {
              ...r.staff,
              verifiedBy: currentUser.nameAr,
              pathologist: r.staff.pathologist || "أ.د. رامي مختار - استشاري الباثولوجيا الإكلينيكية والكيميائية - كلية طب قصر العيني"
            },
            updatedAt: new Date().toISOString()
          };
        }
        return r;
      });
      const target = updatedList.find(r => r.id === id);
      if (target) {
        realtimeSyncManager.broadcastAction('UPDATE_REPORT', target);
      }
      triggerAutoCloudPush(updatedList);
      return updatedList;
    });
    logAction('UPDATE', 'DIAGNOSTIC', `اعتماد التقرير الطبي رسمياً بواسطة ${currentUser.nameAr}`);
    addNotification({
      title: "تم اعتماد التقرير الطبي",
      message: `تم اعتماد تقرير المريض برقم ${id} وأصبح جاهزاً للطباعة والإرسال.`,
      type: "success"
    });
  }, [currentUser, logAction, addNotification, triggerAutoCloudPush]);

  // Financial CRUD
  const addIncomeRecord = useCallback((record: Omit<IncomeRecord, 'id' | 'createdAt' | 'updatedAt'>): IncomeRecord => {
    const newRecord: IncomeRecord = {
      ...record,
      id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'synced'
    };
    setIncomeRecords(prev => {
      const next = [newRecord, ...prev];
      triggerAutoCloudPush(undefined, next);
      return next;
    });
    realtimeSyncManager.broadcastAction('UPDATE_INVOICE', newRecord);
    logAction('CREATE', 'INCOME', `إصدار فاتورة جديدة رقم ${newRecord.invoiceNumber} للمريض ${newRecord.patientName} بقيمة صافية ${newRecord.netAmount} ج.م`);
    return newRecord;
  }, [logAction, triggerAutoCloudPush]);

  const updateIncomeRecord = useCallback((id: string, updates: Partial<IncomeRecord>) => {
    setIncomeRecords(prev => {
      const updatedList = prev.map(inv => inv.id === id ? { ...inv, ...updates, updatedAt: new Date().toISOString() } : inv);
      const target = updatedList.find(i => i.id === id);
      if (target) {
        realtimeSyncManager.broadcastAction('UPDATE_INVOICE', target);
      }
      triggerAutoCloudPush(undefined, updatedList);
      return updatedList;
    });
    logAction('UPDATE', 'INCOME', `تعديل الفاتورة رقم ${id}`);
  }, [logAction, triggerAutoCloudPush]);

  const deleteIncomeRecord = useCallback((id: string) => {
    const inv = incomeRecords.find(i => i.id === id);
    setIncomeRecords(prev => {
      const next = prev.filter(i => i.id !== id);
      triggerAutoCloudPush(undefined, next);
      return next;
    });
    realtimeSyncManager.broadcastAction('DELETE_INVOICE', id);
    logAction('DELETE', 'INCOME', `حذف الفاتورة رقم ${inv?.invoiceNumber || id} للمريض ${inv?.patientName}`);
  }, [incomeRecords, logAction, triggerAutoCloudPush]);

  // Test Catalog CRUD with instant real-time broadcast
  const addCatalogTest = useCallback((test: InvoiceTestItem) => {
    setTestCatalog(prev => {
      const next = [test, ...prev];
      realtimeSyncManager.broadcastAction('UPDATE_CATALOG', next);
      return next;
    });
    logAction('CATALOG_UPDATE', 'CATALOG', `إضافة تحليل جديد للكتالوج: ${test.nameAr} (${test.code})`);
  }, [logAction]);

  const updateCatalogTest = useCallback((code: string, updates: Partial<InvoiceTestItem>) => {
    setTestCatalog(prev => {
      const next = prev.map(t => t.code === code ? { ...t, ...updates } : t);
      realtimeSyncManager.broadcastAction('UPDATE_CATALOG', next);
      return next;
    });

    // Propagate changes immediately to all active reports containing this test
    setReports(prevReports => {
      let anyReportModified = false;
      const nextReports = prevReports.map(rep => {
        let reportModified = false;
        const nextProfiles = rep.profiles.map(prof => {
          let profModified = false;
          const nextParams = prof.parameters.map(param => {
            const matchesCode = param.id?.toLowerCase().includes(code.toLowerCase()) ||
                                param.name?.toLowerCase().includes(code.toLowerCase()) ||
                                (updates.nameEn && param.name?.toLowerCase().includes(updates.nameEn.toLowerCase())) ||
                                (updates.nameAr && param.name?.includes(updates.nameAr));
            if (matchesCode) {
              profModified = true;
              reportModified = true;
              anyReportModified = true;
              return {
                ...param,
                unit: updates.unit !== undefined ? updates.unit : param.unit,
                minNormal: updates.minNormal !== undefined ? updates.minNormal : param.minNormal,
                maxNormal: updates.maxNormal !== undefined ? updates.maxNormal : param.maxNormal,
                textReference: updates.textReference !== undefined ? updates.textReference : param.textReference,
                method: updates.method !== undefined ? updates.method : param.method,
                name: updates.nameAr && updates.nameEn ? `${updates.nameAr} (${updates.nameEn})` : (updates.nameAr || updates.nameEn || param.name)
              };
            }
            return param;
          });
          return profModified ? { ...prof, parameters: nextParams } : prof;
        });

        return reportModified ? { ...rep, profiles: nextProfiles, updatedAt: new Date().toISOString() } : rep;
      });
      return anyReportModified ? nextReports : prevReports;
    });

    // Also propagate changes to diagnosticProfiles templates so new reports inherit the updated normals!
    setDiagnosticProfiles(prevProfiles => {
      let anyProfChanged = false;
      const nextProfiles = prevProfiles.map(prof => {
        let profChanged = false;
        const nextParams = prof.parameters.map(param => {
          const matchesCode = (param as any).id?.toLowerCase().includes(code.toLowerCase()) ||
                              param.name?.toLowerCase().includes(code.toLowerCase()) ||
                              (updates.nameEn && param.name?.toLowerCase().includes(updates.nameEn.toLowerCase())) ||
                              (updates.nameAr && param.name?.includes(updates.nameAr));
          if (matchesCode) {
            profChanged = true;
            anyProfChanged = true;
            return {
              ...param,
              unit: updates.unit !== undefined ? updates.unit : param.unit,
              minNormal: updates.minNormal !== undefined ? updates.minNormal : param.minNormal,
              maxNormal: updates.maxNormal !== undefined ? updates.maxNormal : param.maxNormal,
              textReference: updates.textReference !== undefined ? updates.textReference : param.textReference,
              method: updates.method !== undefined ? updates.method : param.method,
              name: updates.nameAr && updates.nameEn ? `${updates.nameAr} (${updates.nameEn})` : (updates.nameAr || updates.nameEn || param.name)
            };
          }
          return param;
        });
        return profChanged ? { ...prof, parameters: nextParams } : prof;
      });
      if (anyProfChanged) {
        try {
          localStorage.setItem(DIAGNOSTIC_PROFILES_KEY, JSON.stringify(nextProfiles));
          localStorage.setItem('rt_lab_catalog_v2', JSON.stringify(nextProfiles));
        } catch {}
      }
      return anyProfChanged ? nextProfiles : prevProfiles;
    });

    logAction('CATALOG_UPDATE', 'CATALOG', `تعديل سعر وبيانات التحليل وتحديثها فورياً في كافة التقارير: ${code}`);
  }, [logAction]);

  const updateIndividualTests = useCallback((tests: InvoiceTestItem[]) => {
    setTestCatalog(tests);
    try {
      localStorage.setItem(CATALOG_KEY, JSON.stringify(tests));
      localStorage.setItem('rt_lab_individual_tests_v2', JSON.stringify(tests));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
    realtimeSyncManager.broadcastAction('UPDATE_CATALOG', tests);
    logAction('CATALOG_UPDATE', 'CATALOG', `تحديث قائمة التحاليل (${tests.length} فحص)`);
  }, [logAction]);

  const deleteCatalogTest = useCallback((code: string) => {
    setTestCatalog(prev => {
      const next = prev.filter(t => t.code !== code);
      realtimeSyncManager.broadcastAction('UPDATE_CATALOG', next);
      return next;
    });
    logAction('CATALOG_UPDATE', 'CATALOG', `حذف التحليل ${code} من الكتالوج`);
  }, [logAction]);

  // Packages Management CRUD
  const updatePackages = useCallback((pkgs: ComprehensivePackage[]) => {
    setPackages(pkgs);
    try {
      localStorage.setItem(PACKAGES_KEY, JSON.stringify(pkgs));
    } catch {}
    realtimeSyncManager.broadcastAction('UPDATE_PACKAGES', pkgs);
    if (githubConfig.token && githubConfig.autoSync) {
      pushFullStoreToGitHub(githubConfig, {
        reports,
        incomeRecords,
        expenses,
        loyaltyProfiles,
        inventory,
        labInfo,
        testCatalog,
        packages: pkgs,
        diagnosticProfiles
      }).catch(err => console.warn('Package sync note:', err));
    }
    logAction('UPDATE', 'CATALOG', 'تحديث قائمة باقات الفحص الشامل المتاحة');
  }, [logAction, githubConfig, reports, incomeRecords, expenses, loyaltyProfiles, inventory, labInfo, testCatalog, diagnosticProfiles]);

  const addPackage = useCallback((pkg: ComprehensivePackage) => {
    setPackages(prev => {
      const next = [pkg, ...prev];
      try {
        localStorage.setItem(PACKAGES_KEY, JSON.stringify(next));
      } catch {}
      realtimeSyncManager.broadcastAction('UPDATE_PACKAGES', next);
      if (githubConfig.token && githubConfig.autoSync) {
        pushFullStoreToGitHub(githubConfig, {
          reports,
          incomeRecords,
          expenses,
          loyaltyProfiles,
          inventory,
          labInfo,
          testCatalog,
          packages: next,
          diagnosticProfiles
        }).catch(err => console.warn('Add package sync note:', err));
      }
      return next;
    });
    logAction('CREATE', 'CATALOG', `إضافة باقة فحص جديدة: ${pkg.titleAr} (${pkg.code})`);
  }, [logAction, githubConfig, reports, incomeRecords, expenses, loyaltyProfiles, inventory, labInfo, testCatalog, diagnosticProfiles]);

  const updateSinglePackage = useCallback((id: string, updates: Partial<ComprehensivePackage>) => {
    setPackages(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...updates } : p);
      try {
        localStorage.setItem(PACKAGES_KEY, JSON.stringify(next));
      } catch {}
      realtimeSyncManager.broadcastAction('UPDATE_PACKAGES', next);
      if (githubConfig.token && githubConfig.autoSync) {
        pushFullStoreToGitHub(githubConfig, {
          reports,
          incomeRecords,
          expenses,
          loyaltyProfiles,
          inventory,
          labInfo,
          testCatalog,
          packages: next,
          diagnosticProfiles
        }).catch(err => console.warn('Update package sync note:', err));
      }
      return next;
    });
    logAction('UPDATE', 'CATALOG', `تعديل بيانات الباقة: ${id}`);
  }, [logAction, githubConfig, reports, incomeRecords, expenses, loyaltyProfiles, inventory, labInfo, testCatalog, diagnosticProfiles]);

  const deletePackage = useCallback((id: string) => {
    setPackages(prev => {
      const next = prev.filter(p => p.id !== id);
      try {
        localStorage.setItem(PACKAGES_KEY, JSON.stringify(next));
      } catch {}
      realtimeSyncManager.broadcastAction('UPDATE_PACKAGES', next);
      if (githubConfig.token && githubConfig.autoSync) {
        pushFullStoreToGitHub(githubConfig, {
          reports,
          incomeRecords,
          expenses,
          loyaltyProfiles,
          inventory,
          labInfo,
          testCatalog,
          packages: next,
          diagnosticProfiles
        }).catch(err => console.warn('Delete package sync note:', err));
      }
      return next;
    });
    logAction('DELETE', 'CATALOG', `حذف الباقة: ${id}`);
  }, [logAction, githubConfig, reports, incomeRecords, expenses, loyaltyProfiles, inventory, labInfo, testCatalog, diagnosticProfiles]);

  const resetPackages = useCallback(() => {
    const fullPkgs = mergePackagesWithDefaults();
    setPackages(fullPkgs);
    try {
      localStorage.setItem(PACKAGES_KEY, JSON.stringify(fullPkgs));
    } catch {}
    realtimeSyncManager.broadcastAction('UPDATE_PACKAGES', fullPkgs);
    if (githubConfig.token && githubConfig.autoSync) {
      pushFullStoreToGitHub(githubConfig, {
        reports,
        incomeRecords,
        expenses,
        loyaltyProfiles,
        inventory,
        labInfo,
        testCatalog,
        packages: fullPkgs,
        diagnosticProfiles
      }).catch(() => {});
    }
    logAction('UPDATE', 'CATALOG', `استعادة الباقات الافتراضية الـ 15 المتكاملة (${fullPkgs.length} باقة)`);
  }, [logAction, githubConfig, reports, incomeRecords, expenses, loyaltyProfiles, inventory, labInfo, testCatalog, diagnosticProfiles]);

  const updateDiagnosticProfiles = useCallback((profiles: CatalogProfileTemplate[]) => {
    setDiagnosticProfiles(profiles);
    try {
      localStorage.setItem(DIAGNOSTIC_PROFILES_KEY, JSON.stringify(profiles));
      localStorage.setItem('rt_lab_catalog_v2', JSON.stringify(profiles));
    } catch {}
    realtimeSyncManager.broadcastAction('UPDATE_PROFILES', profiles);
    if (githubConfig.token && githubConfig.autoSync) {
      pushFullStoreToGitHub(githubConfig, {
        reports,
        incomeRecords,
        expenses,
        loyaltyProfiles,
        inventory,
        labInfo,
        testCatalog,
        packages,
        diagnosticProfiles: profiles
      }).catch(err => console.warn('Profile sync note:', err));
    }
    logAction('CATALOG_UPDATE', 'CATALOG', `تحديث بروفايلات التحاليل الشاملة (${profiles.length} بروفايل) ومزامنتها سحابياً`);
  }, [logAction, githubConfig, reports, incomeRecords, expenses, loyaltyProfiles, inventory, labInfo, testCatalog, packages]);

  const resetDiagnosticProfiles = useCallback(() => {
    setDiagnosticProfiles(LAB_CATALOG);
    try {
      localStorage.setItem(DIAGNOSTIC_PROFILES_KEY, JSON.stringify(LAB_CATALOG));
      localStorage.setItem('rt_lab_catalog_v2', JSON.stringify(LAB_CATALOG));
    } catch {}
    realtimeSyncManager.broadcastAction('UPDATE_PROFILES', LAB_CATALOG);
    if (githubConfig.token && githubConfig.autoSync) {
      pushFullStoreToGitHub(githubConfig, {
        reports,
        incomeRecords,
        expenses,
        loyaltyProfiles,
        inventory,
        labInfo,
        testCatalog,
        packages,
        diagnosticProfiles: LAB_CATALOG
      }).catch(() => {});
    }
    logAction('CATALOG_UPDATE', 'CATALOG', 'استعادة بروفايلات التحاليل الافتراضية (24 بروفايل طبي)');
  }, [logAction, githubConfig, reports, incomeRecords, expenses, loyaltyProfiles, inventory, labInfo, testCatalog, packages]);

  const forceSyncCatalog = useCallback(() => {
    const refreshedTests = mergeCatalogWithDefaults(testCatalog);
    const refreshedPackages = mergePackagesWithDefaults(packages);
    const refreshedProfiles = mergeProfilesWithDefaults(diagnosticProfiles);

    setTestCatalog(refreshedTests);
    setPackages(refreshedPackages);
    setDiagnosticProfiles(refreshedProfiles);

    try {
      localStorage.setItem(CATALOG_KEY, JSON.stringify(refreshedTests));
      localStorage.setItem('rt_lab_individual_tests_v2', JSON.stringify(refreshedTests));
      localStorage.setItem(PACKAGES_KEY, JSON.stringify(refreshedPackages));
      localStorage.setItem(DIAGNOSTIC_PROFILES_KEY, JSON.stringify(refreshedProfiles));
      localStorage.setItem('rt_lab_catalog_v2', JSON.stringify(refreshedProfiles));
    } catch (e) {
      console.error('Local storage save error:', e);
    }

    const syncPayload = {
      reports,
      incomeRecords,
      expenses,
      loyaltyProfiles,
      inventory,
      labInfo,
      testCatalog: refreshedTests,
      packages: refreshedPackages,
      diagnosticProfiles: refreshedProfiles
    };

    realtimeSyncManager.pushMasterSnapshot(syncPayload);
    realtimeSyncManager.broadcastAction('UPDATE_CATALOG', refreshedTests);
    realtimeSyncManager.broadcastAction('UPDATE_PACKAGES', refreshedPackages);
    realtimeSyncManager.broadcastAction('UPDATE_PROFILES', refreshedProfiles);

    if (githubConfig.token) {
      pushFullStoreToGitHub(githubConfig, syncPayload).catch(() => {});
    }

    logAction('CATALOG_UPDATE', 'CATALOG', `مزامنة وتوحيد شامل للكتالوج: ${refreshedTests.length} فحص منفرد + ${refreshedPackages.length} باقة + ${refreshedProfiles.length} بروفايل`);

    return {
      testsCount: refreshedTests.length,
      packagesCount: refreshedPackages.length,
      profilesCount: refreshedProfiles.length
    };
  }, [testCatalog, packages, diagnosticProfiles, reports, incomeRecords, expenses, loyaltyProfiles, inventory, labInfo, githubConfig, logAction]);

  // Apply Package Directly to Any Report (Lists all package tests in one unified profile - لا يفرد في صفحات منفصلة)
  const applyPackageToReport = useCallback((reportId: string, pkg: ComprehensivePackage) => {
    setReports(prev => prev.map(rep => {
      if (rep.id !== reportId) return rep;
      
      const packageParams: TestParameter[] = [];

      // 1. Gather all parameters from included profiles
      (pkg.includedProfiles || []).forEach(pCode => {
        const template = LAB_CATALOG.find(c => c.code.toUpperCase() === pCode.toUpperCase());
        if (template) {
          template.parameters.forEach((p, idx) => {
            if (!packageParams.some(ep => ep.name.toLowerCase() === p.name.toLowerCase())) {
              packageParams.push({
                ...p,
                id: `param-${pCode}-${idx}-${Date.now()}-${Math.random().toString(36).substr(2, 3)}`,
                result: '',
                flag: 'NORMAL',
                notes: p.notes || template.titleAr
              });
            }
          });
        }
      });

      // 2. Gather all included individual tests
      (pkg.includedIndividualTestCodes || []).forEach((tCode, idx) => {
        const indTest = INITIAL_INDIVIDUAL_TESTS.find(t => t.code.toUpperCase() === tCode.toUpperCase())
                     || testCatalog.find(t => t.code.toUpperCase() === tCode.toUpperCase());
        if (indTest && !packageParams.some(ep => ep.name.toLowerCase().includes(indTest.nameEn.toLowerCase()))) {
          packageParams.push({
            id: `p-pkg-${idx}-${Date.now()}-${Math.random().toString(36).substr(2, 3)}`,
            name: `${indTest.nameAr} (${indTest.nameEn})`,
            result: '',
            unit: indTest.unit || '',
            minNormal: indTest.minNormal,
            maxNormal: indTest.maxNormal,
            textReference: indTest.textReference || 'Normal',
            flag: 'NORMAL',
            method: indTest.method || 'Automated Clinical Assay',
            notes: 'فحوصات وفيتامينات إضافية للباقة'
          });
        }
      });

      const unifiedPackageProfile: TestProfile = {
        id: `prof-pkg-${Date.now()}`,
        profileCode: pkg.code,
        titleAr: pkg.titleAr,
        titleEn: pkg.titleEn,
        category: 'باقة فحوصات شاملة',
        sampleType: pkg.sampleTypes?.join(' + ') || 'Serum / EDTA / Urine',
        interpretation: 'جميع تحاليل وفحوصات الباقة الشاملة تم تقييمها ومطابقتها للمعدلات المرجعية المعتمدة دولياً.',
        parameters: packageParams
      };

      return {
        ...rep,
        packageApplied: {
          code: pkg.code,
          titleAr: pkg.titleAr,
          packagePrice: pkg.packagePrice,
          originalPrice: pkg.originalPrice
        } as any,
        profiles: [unifiedPackageProfile],
        status: rep.status === 'draft' ? 'in_progress' : rep.status,
        updatedAt: new Date().toISOString()
      };
    }));
    logAction('UPDATE', 'DIAGNOSTIC', `تطبيق باقة "${pkg.titleAr}" على التقرير وحفظها مسرودة بالكامل في بروفايل موحد`);
  }, [testCatalog, logAction]);

  // Unified Admission: Register patient -> Create Lab Report -> Create Income Invoice -> Update Loyalty
  const createReportFromAdmission = useCallback((patient: Patient, selectedTests: InvoiceTestItem[], packageApplied?: any): LabReport => {
    const today = new Date().toISOString().split('T')[0];
    const generatedProfiles: TestProfile[] = [];

    // 1. If a Package was applied: Collect ALL its tests into ONE unified comprehensive profile (لا يفرد في صفحات منفصلة)
    if (packageApplied) {
      const packageParams: TestParameter[] = [];

      // A) All included profiles parameters
      (packageApplied.includedProfiles || []).forEach((pCode: string) => {
        const template = LAB_CATALOG.find(c => c.code.toUpperCase() === pCode.toUpperCase());
        if (template) {
          template.parameters.forEach((p, idx) => {
            if (!packageParams.some(ep => ep.name.toLowerCase() === p.name.toLowerCase())) {
              packageParams.push({
                ...p,
                id: `param-${pCode}-${idx}-${Date.now()}-${Math.random().toString(36).substr(2, 3)}`,
                result: '',
                flag: 'NORMAL',
                notes: p.notes || template.titleAr
              });
            }
          });
        }
      });

      // B) All complementary individual tests
      (packageApplied.includedIndividualTestCodes || []).forEach((tCode: string, idx: number) => {
        const indTest = INITIAL_INDIVIDUAL_TESTS.find(t => t.code.toUpperCase() === tCode.toUpperCase())
                     || testCatalog.find(t => t.code.toUpperCase() === tCode.toUpperCase());
        if (indTest && !packageParams.some(ep => ep.name.toLowerCase().includes(indTest.nameEn.toLowerCase()))) {
          packageParams.push({
            id: `p-pkg-${idx}-${Date.now()}-${Math.random().toString(36).substr(2, 3)}`,
            name: `${indTest.nameAr} (${indTest.nameEn})`,
            result: '',
            unit: indTest.unit || '',
            minNormal: indTest.minNormal,
            maxNormal: indTest.maxNormal,
            textReference: indTest.textReference || 'Normal',
            flag: 'NORMAL',
            method: indTest.method || 'Automated Clinical Assay',
            notes: 'فحوصات وفيتامينات إضافية للباقة'
          });
        }
      });

      generatedProfiles.push({
        id: `prof-pkg-${Date.now()}`,
        profileCode: packageApplied.code,
        titleAr: packageApplied.titleAr,
        titleEn: packageApplied.titleEn,
        category: 'باقة فحوصات شاملة',
        sampleType: packageApplied.sampleTypes?.join(' + ') || 'Serum / EDTA / Urine',
        interpretation: 'جميع تحاليل وفحوصات الباقة الشاملة تم تقييمها وتدقيقها طبقاً للمعدلات المرجعية المعتمدة دولياً.',
        parameters: packageParams
      });
    }

    // 2. Any additional tests selected outside the package
    selectedTests.forEach(test => {
      const testCode = test.code.toUpperCase();
      // If a package was applied, skip tests already included in the package
      if (packageApplied) {
        const inPkgProfiles = (packageApplied.includedProfiles || []).map((c: string) => c.toUpperCase());
        const inPkgInd = (packageApplied.includedIndividualTestCodes || []).map((c: string) => c.toUpperCase());
        if (inPkgProfiles.includes(testCode) || inPkgInd.includes(testCode)) return;
      }
      if (generatedProfiles.some(gp => gp.profileCode.toUpperCase() === testCode)) return;

      const catalogTemplate = LAB_CATALOG.find(c => 
        c.code.toUpperCase() === testCode || 
        c.titleEn.toLowerCase().includes(test.code.toLowerCase())
      );

      if (catalogTemplate) {
        generatedProfiles.push({
          id: `prof-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          profileCode: catalogTemplate.code,
          titleEn: catalogTemplate.titleEn,
          titleAr: catalogTemplate.titleAr,
          category: catalogTemplate.category,
          sampleType: catalogTemplate.sampleType,
          interpretation: catalogTemplate.defaultInterpretation || '',
          parameters: catalogTemplate.parameters.map((p, idx) => ({
            ...p,
            id: `param-${idx}-${Date.now()}-${Math.random().toString(36).substr(2, 3)}`,
            result: '',
            flag: 'NORMAL'
          }))
        });
      } else {
        // Detailed individual test
        const richTest = INITIAL_INDIVIDUAL_TESTS.find(t => t.code.toUpperCase() === testCode) || test;
        generatedProfiles.push({
          id: `prof-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          profileCode: richTest.code,
          titleEn: richTest.nameEn,
          titleAr: richTest.nameAr,
          category: richTest.category || 'General Diagnostic',
          sampleType: richTest.sampleType || 'Serum',
          parameters: [
            {
              id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 3)}`,
              name: `${richTest.nameAr} (${richTest.nameEn})`,
              result: '',
              unit: richTest.unit || '',
              minNormal: richTest.minNormal,
              maxNormal: richTest.maxNormal,
              textReference: richTest.textReference || 'Normal',
              flag: 'NORMAL',
              method: richTest.method || 'Automated Clinical Assay'
            }
          ]
        });
      }
    });

    // Fallback if empty
    if (generatedProfiles.length === 0) {
      const defaultTpl = LAB_CATALOG[0]; // CBC
      generatedProfiles.push({
        id: `prof-def-${Date.now()}`,
        profileCode: defaultTpl.code,
        titleEn: defaultTpl.titleEn,
        titleAr: defaultTpl.titleAr,
        category: defaultTpl.category,
        sampleType: defaultTpl.sampleType,
        parameters: defaultTpl.parameters.map((p, idx) => ({
          ...p,
          id: `p-${idx}-${Date.now()}`,
          result: '',
          flag: 'NORMAL'
        }))
      });
    }

    const newReport: LabReport = {
      id: `rep-${Date.now()}`,
      reportNumber: patient.labNumber,
      patient: {
        ...patient,
        sampleDate: patient.sampleDate || today,
        reportingDate: patient.reportingDate || today,
        assignedPackageId: packageApplied ? packageApplied.id : patient.assignedPackageId
      },
      packageApplied: packageApplied ? {
        code: packageApplied.code,
        titleAr: packageApplied.titleAr,
        packagePrice: packageApplied.packagePrice,
        originalPrice: packageApplied.originalPrice
      } as any : undefined,
      profiles: generatedProfiles,
      staff: { ...staffSignatures },
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setReports(prev => [newReport, ...prev]);
    setSelectedReportId(newReport.id);

    // Matching financial invoice with 100% accurate price calculations
    const rawSubtotal = patient.testsSubtotal || patient.totalCost || 0;
    const fee = patient.visitFee || 0;
    const disc = patient.discountApplied || 0;
    const gross = rawSubtotal + fee;
    const net = (patient as any).netAmount !== undefined 
      ? (patient as any).netAmount 
      : Math.max(0, gross - disc);
    const paid = (patient as any).paidAmount !== undefined 
      ? (patient as any).paidAmount 
      : net;
    const remaining = (patient as any).remainingAmount !== undefined 
      ? (patient as any).remainingAmount 
      : Math.max(0, net - paid);
    const pStatus = (patient as any).paymentStatus 
      || (paid >= net ? 'paid' : (paid > 0 ? 'partial' : 'pending'));

    const newInvoice: IncomeRecord = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-${patient.labNumber.replace('RT-', '')}`,
      patientName: patient.fullName,
      patientPhone: patient.phone,
      patientAge: patient.age,
      patientGender: patient.gender,
      barcode: patient.barcode,
      labNumber: patient.labNumber,
      referringDoctor: patient.referringDoctorName || 'أطباء كلية طب قصر العيني',
      tests: selectedTests,
      subtotal: gross,
      testsSubtotal: rawSubtotal,
      discount: disc,
      visitFee: fee,
      isHomeVisit: patient.bookingType === 'home_visit',
      visitAddress: patient.homeAddress,
      netAmount: net,
      paidAmount: paid,
      remainingAmount: remaining,
      paymentMethod: (patient.paymentMethod as any) || 'cash',
      paymentStatus: pStatus,
      cashierName: currentUser.nameAr,
      branch: patient.branchAddress || 'الفرع الرئيسي - بهتيم',
      syncStatus: 'synced',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setIncomeRecords(prev => [newInvoice, ...prev]);
    newReport.invoiceId = newInvoice.id;

    realtimeSyncManager.broadcastAction('UPDATE_REPORT', newReport);
    realtimeSyncManager.broadcastAction('UPDATE_INVOICE', newInvoice);

    // 1. Instant Cloud & Multi-device Sync for newly admitted case
    const updatedReports = [newReport, ...reports];
    const updatedInvoices = [newInvoice, ...incomeRecords];
    const instantSyncPayload = {
      reports: updatedReports,
      incomeRecords: updatedInvoices,
      expenses,
      loyaltyProfiles,
      inventory,
      dailyCloseouts,
      labInfo,
      testCatalog,
      packages
    };
    realtimeSyncManager.pushMasterSnapshot(instantSyncPayload).catch(err => {
      console.warn('Instant Firestore push error:', err);
    });
    if (githubConfig.token && githubConfig.autoSync) {
      pushFullStoreToGitHub(githubConfig, instantSyncPayload).catch(err => {
        console.warn('Instant GitHub backup push error:', err);
      });
      syncInvoiceToDiagnostic(newInvoice, githubConfig).catch(() => {});
    }

    logAction('CREATE', 'DIAGNOSTIC', `تسجيل مريض جديد ${patient.fullName} وحجز تحاليل وربط التقرير بالفاتورة المالية ومزامنة البيانات سحابياً فوراً`);
    addNotification({
      title: "تم تسجيل المريض بنجاح",
      message: `تم حجز التحاليل للمريض ${patient.fullName} وإصدار فاتورة وإدراج العينة في قائمة عمل المعمل.`,
      type: "success"
    });

    return newReport;
  }, [currentUser, logAction, addNotification, reports, incomeRecords, expenses, loyaltyProfiles, inventory, dailyCloseouts, labInfo, testCatalog, packages, githubConfig]);

  // Loyalty Program Helpers
  const calculateLoyaltyTier = useCallback((points: number): LoyaltyTier => {
    if (points >= loyaltyConfig.tiers.VIP.minPoints) return 'VIP';
    if (points >= loyaltyConfig.tiers.Platinum.minPoints) return 'Platinum';
    if (points >= loyaltyConfig.tiers.Gold.minPoints) return 'Gold';
    return 'Silver';
  }, [loyaltyConfig]);

  const calculateCashForPoints = useCallback((points: number) => {
    return Math.floor(points / 100) * loyaltyConfig.egpPer100Points;
  }, [loyaltyConfig]);

  const calculatePointsForAmount = useCallback((amount: number) => {
    return Math.floor(amount * loyaltyConfig.pointsPerEGP);
  }, [loyaltyConfig]);

  const getLoyaltyByPhone = useCallback((phone: string): PatientLoyaltyProfile | undefined => {
    if (!phone) return undefined;
    const cleanPhone = phone.replace(/\s+/g, '');
    return loyaltyProfiles.find(p => p.phone.replace(/\s+/g, '') === cleanPhone);
  }, [loyaltyProfiles]);

  const earnLoyaltyPoints = useCallback((
    patientPhone: string,
    amount: number,
    invoiceNumber: string,
    patientName: string,
    barcode: string
  ) => {
    const pointsToEarn = Math.floor(amount * loyaltyConfig.pointsPerEGP);
    if (pointsToEarn <= 0) return;

    setLoyaltyProfiles(prev => {
      const cleanPhone = patientPhone.replace(/\s+/g, '');
      const existing = prev.find(p => p.phone.replace(/\s+/g, '') === cleanPhone);

      if (existing) {
        const newTotal = existing.totalPoints + pointsToEarn;
        const newSpent = existing.lifetimeSpent + amount;
        const newTier = calculateLoyaltyTier(newTotal);

        return prev.map(p => p.patientId === existing.patientId ? {
          ...p,
          totalPoints: newTotal,
          tier: newTier,
          lifetimeSpent: newSpent,
          transactions: [
            {
              id: `tx-${Date.now()}`,
              date: new Date().toISOString().split('T')[0],
              type: 'earn',
              points: pointsToEarn,
              description: `اكتساب نقاط عن فاتورة رقم ${invoiceNumber}`,
              invoiceNumber,
              amountEGP: amount
            },
            ...p.transactions
          ]
        } : p);
      } else {
        const newProfile: PatientLoyaltyProfile = {
          patientId: `pat-loyalty-${Date.now()}`,
          patientName,
          phone: patientPhone,
          barcode,
          cardNumber: `RT-${calculateLoyaltyTier(pointsToEarn).toUpperCase()}-${barcode.replace('RT-', '') || Math.floor(10000 + Math.random() * 90000)}`,
          bloodGroup: '',
          totalPoints: pointsToEarn,
          tier: calculateLoyaltyTier(pointsToEarn),
          lifetimeSpent: amount,
          issueDate: new Date().toISOString().split('T')[0],
          transactions: [
            {
              id: `tx-${Date.now()}`,
              date: new Date().toISOString().split('T')[0],
              type: 'earn',
              points: pointsToEarn,
              description: `اكتساب نقاط ترحيبية وفاتورة رقم ${invoiceNumber}`,
              invoiceNumber,
              amountEGP: amount
            }
          ]
        };
        return [newProfile, ...prev];
      }
    });

    logAction('LOYALTY', 'LOYALTY', `إضافة ${pointsToEarn} نقطة ولاء للمريض ${patientName} برقم هاتف ${patientPhone}`);
  }, [loyaltyConfig, calculateLoyaltyTier, logAction]);

  // Financial Metrics
  const financialMetrics = useMemo(() => {
    const totalGrossIncome = incomeRecords.reduce((acc, r) => acc + r.subtotal, 0);
    const totalPaidIncome = incomeRecords.reduce((acc, r) => acc + r.paidAmount, 0);
    const totalDeferredIncome = incomeRecords.reduce((acc, r) => acc + r.remainingAmount, 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
    const netProfit = totalPaidIncome - totalExpenses;
    const base = profitConfig.calculationBase === 'net_profit' ? Math.max(0, netProfit) : totalPaidIncome;
    const ceoShare = (base * profitConfig.ceoPercentage) / 100;
    const labShare = (base * profitConfig.labPercentage) / 100;
    const emergencyFund = (base * profitConfig.emergencyFundPercentage) / 100;

    return {
      totalGrossIncome,
      totalPaidIncome,
      totalDeferredIncome,
      totalExpenses,
      netProfit,
      ceoShare,
      labShare,
      emergencyFund,
      emergencyShare: emergencyFund
    };
  }, [incomeRecords, expenses, profitConfig]);

  const resetCatalog = useCallback(() => {
    const fullDefaults = mergeCatalogWithDefaults();
    setTestCatalog(fullDefaults);
    realtimeSyncManager.broadcastAction('UPDATE_CATALOG', fullDefaults);
    logAction('CATALOG_UPDATE', 'CATALOG', `إعادة ضبط كتالوج التحاليل للقيم الافتراضية (${fullDefaults.length} فحص)`);
  }, [logAction]);

  const updateLoyaltyConfig = useCallback((newConfig: LoyaltyConfig) => {
    logAction('LOYALTY', 'LOYALTY', 'تحديث إعدادات كروت الولاء وقيمة استبدال النقاط');
  }, [logAction]);

  const addLoyaltyProfile = useCallback((profile: PatientLoyaltyProfile) => {
    setLoyaltyProfiles(prev => [profile, ...prev]);
    logAction('CREATE', 'LOYALTY', `إصدار كارت ولاء جديد للمريض ${profile.patientName}`);
  }, [logAction]);

  const restockItem = useCallback((id: string, addedQty: number, newCost?: number) => {
    setInventory(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          currentQuantity: item.currentQuantity + addedQty,
          costPerUnit: newCost !== undefined ? newCost : item.costPerUnit,
          lastRestockedDate: new Date().toISOString().split('T')[0]
        };
      }
      return item;
    }));
    logAction('UPDATE', 'INVENTORY', `توريد واستلام كمية ${addedQty} لمادة رقم ${id}`);
  }, [logAction]);

  const consumeReagent = useCallback((id: string, qty: number) => {
    setInventory(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          currentQuantity: Math.max(0, item.currentQuantity - qty)
        };
      }
      return item;
    }));
    logAction('UPDATE', 'INVENTORY', `صرف واستهلاك ${qty} من مادة رقم ${id}`);
  }, [logAction]);

  const addLoyaltyPoints = useCallback((
    patientPhone: string,
    points: number,
    reason: string,
    invoiceNumber?: string,
    amountEGP?: number
  ) => {
    setLoyaltyProfiles(prev => {
      const cleanPhone = patientPhone.replace(/\s+/g, '');
      const existing = prev.find(p => p.phone.replace(/\s+/g, '') === cleanPhone || p.patientId === patientPhone);
      if (existing) {
        const newTotal = existing.totalPoints + points;
        return prev.map(p => {
          if (p.patientId === existing.patientId) {
            return {
              ...p,
              totalPoints: newTotal,
              tier: calculateLoyaltyTier(newTotal),
              transactions: [
                {
                  id: `tx-${Date.now()}`,
                  date: new Date().toISOString().split('T')[0],
                  type: 'bonus',
                  points,
                  description: reason,
                  invoiceNumber,
                  amountEGP
                },
                ...p.transactions
              ]
            };
          }
          return p;
        });
      }
      return prev;
    });
  }, [calculateLoyaltyTier]);

  const redeemLoyaltyPoints = useCallback((
    patientPhone: string,
    points: number,
    invoiceNumber?: string,
    discountEGP?: number
  ): { success: boolean; cashValue: number } => {
    const profile = getLoyaltyByPhone(patientPhone) || loyaltyProfiles.find(p => p.patientId === patientPhone);
    const cashValue = discountEGP || calculateCashForPoints(points);
    if (!profile || profile.totalPoints < points) {
      return { success: false, cashValue: 0 };
    }

    setLoyaltyProfiles(prev => prev.map(p => {
      if (p.patientId === profile.patientId) {
        const remaining = p.totalPoints - points;
        return {
          ...p,
          totalPoints: remaining,
          transactions: [
            {
              id: `tx-red-${Date.now()}`,
              date: new Date().toISOString().split('T')[0],
              type: 'redeem',
              points: -points,
              description: `استبدال ${points} نقطة بخصم ${cashValue} ج.م ${invoiceNumber ? `على فاتورة ${invoiceNumber}` : ''}`,
              invoiceNumber,
              amountEGP: cashValue
            },
            ...p.transactions
          ]
        };
      }
      return p;
    }));

    logAction('LOYALTY', 'LOYALTY', `استبدال ${points} نقطة للمريض ${profile.patientName} بخصم ${cashValue} ج.م`);
    return { success: true, cashValue };
  }, [getLoyaltyByPhone, loyaltyProfiles, calculateCashForPoints, logAction]);

  const updateLoyaltyProfile = useCallback((id: string, updates: Partial<PatientLoyaltyProfile>) => {
    setLoyaltyProfiles(prev => prev.map(p => p.patientId === id ? { ...p, ...updates } : p));
  }, []);

  const deleteLoyaltyProfile = useCallback((id: string) => {
    setLoyaltyProfiles(prev => prev.filter(p => p.patientId !== id));
  }, []);

  const deleteLoyaltyTransaction = useCallback((profileId: string, txId: string) => {
    setLoyaltyProfiles(prev => prev.map(p => {
      if (p.patientId === profileId) {
        const filteredTx = p.transactions.filter(t => t.id !== txId);
        const recomputedPoints = filteredTx.reduce((sum, t) => sum + t.points, 0);
        return { ...p, transactions: filteredTx, totalPoints: Math.max(0, recomputedPoints) };
      }
      return p;
    }));
  }, []);

  const retroactiveSyncAllInvoicesToLoyalty = useCallback(() => {
    let syncedCount = 0;
    let newProfilesCount = 0;

    incomeRecords.forEach(inv => {
      if (inv.patientPhone && inv.paidAmount > 0) {
        earnLoyaltyPoints(inv.patientPhone, inv.paidAmount, inv.invoiceNumber, inv.patientName, inv.barcode);
        syncedCount++;
      }
    });

    logAction('LOYALTY', 'LOYALTY', `مزامنة رجعية لنقاط الولاء لـ ${syncedCount} فاتورة سابقة`);
    return { syncedCount, newProfilesCount };
  }, [incomeRecords, earnLoyaltyPoints, logAction]);

  // Expenses CRUD
  const addExpense = useCallback((expense: Omit<ExpenseRecord, 'id' | 'createdAt'>) => {
    const newExp: ExpenseRecord = {
      ...expense,
      id: `exp-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setExpenses(prev => [newExp, ...prev]);
    logAction('CREATE', 'EXPENSES', `تسجيل مصروف جديد: ${expense.title} بقيمة ${expense.amount} ج.م`);
  }, [logAction]);

  const updateExpense = useCallback((id: string, updates: Partial<ExpenseRecord>) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    logAction('UPDATE', 'EXPENSES', `تعديل المصروف رقم ${id}`);
  }, [logAction]);

  const deleteExpense = useCallback((id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    logAction('DELETE', 'EXPENSES', `حذف بند المصروف رقم ${id}`);
  }, [logAction]);

  const updateProfitConfig = useCallback((config: ProfitShareConfig) => {
    setProfitConfig(config);
    logAction('UPDATE', 'SETTINGS', 'تحديث إعدادات توزيع الأرباح ونسب الشركاء');
  }, [logAction]);

  // Daily Closeout
  const closeoutDay = useCallback((actualCash: number, discrepancyNotes?: string): DailyCloseout => {
    const today = new Date().toISOString().split('T')[0];
    const todayIncome = incomeRecords.filter(r => r.createdAt.startsWith(today));
    const todayExpenses = expenses.filter(e => e.date === today);

    const cashIncome = todayIncome.filter(r => r.paymentMethod === 'cash').reduce((sum, r) => sum + r.paidAmount, 0);
    const visaIncome = todayIncome.filter(r => r.paymentMethod === 'visa').reduce((sum, r) => sum + r.paidAmount, 0);
    const transferIncome = todayIncome.filter(r => ['bank_transfer', 'instapay', 'vodafone_cash'].includes(r.paymentMethod)).reduce((sum, r) => sum + r.paidAmount, 0);
    const deferredIncome = todayIncome.filter(r => r.paymentStatus === 'unpaid').reduce((sum, r) => sum + r.remainingAmount, 0);
    const cashExpenses = todayExpenses.filter(e => e.paymentMethod === 'cash').reduce((sum, e) => sum + e.amount, 0);

    const expectedCash = cashIncome - cashExpenses;
    const diff = actualCash - expectedCash;

    const closeout: DailyCloseout = {
      id: `close-${today}`,
      date: today,
      totalIncomeCash: cashIncome,
      totalIncomeVisa: visaIncome,
      totalIncomeTransfer: transferIncome,
      totalIncomeDeferred: deferredIncome,
      totalExpenses: cashExpenses,
      expectedCashInDrawer: expectedCash,
      actualCashInDrawer: actualCash,
      discrepancy: diff,
      closedBy: currentUser.nameAr,
      notes: discrepancyNotes,
      timestamp: new Date().toISOString()
    };

    setDailyCloseouts(prev => [closeout, ...prev.filter(c => c.date !== today)]);
    logAction('CLOSEOUT', 'INCOME', `تقفيل الوردية اليومية: المتوقع ${expectedCash} ج.م، الفعلي ${actualCash} ج.م، الفرق ${diff} ج.م`);
    return closeout;
  }, [incomeRecords, expenses, currentUser, logAction]);

  // Inventory CRUD
  const addInventoryItem = useCallback((item: Omit<InventoryItem, 'id' | 'lastRestockedDate'>) => {
    const newItem: InventoryItem = {
      ...item,
      id: `inv-item-${Date.now()}`,
      lastRestockedDate: new Date().toISOString().split('T')[0]
    };
    setInventory(prev => [newItem, ...prev]);
    logAction('CREATE', 'INVENTORY', `إضافة مادة/محلول مخبري جديد: ${item.nameAr}`);
  }, [logAction]);

  const updateInventoryItem = useCallback((id: string, updates: Partial<InventoryItem>) => {
    setInventory(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    logAction('UPDATE', 'INVENTORY', `تحديث مخزون المادة رقم ${id}`);
  }, [logAction]);

  const deleteInventoryItem = useCallback((id: string) => {
    setInventory(prev => prev.filter(i => i.id !== id));
    logAction('DELETE', 'INVENTORY', `حذف مادة من المخزون رقم ${id}`);
  }, [logAction]);

  // Instruments & Interfacing
  const toggleInstrumentStatus = useCallback((id: string) => {
    setInstruments(prev => prev.map(inst => {
      if (inst.id === id) {
        const newStatus = inst.status === 'online' ? 'offline' : 'online';
        return { ...inst, status: newStatus };
      }
      return inst;
    }));
  }, []);

  const simulateInstrumentRun = useCallback((instrumentId: string, barcode: string, patientName?: string, labNumber?: string): InstrumentTransmission => {
    const inst = instruments.find(i => i.id === instrumentId) || instruments[0];
    const isHematology = inst.category === 'hematology';

    let generatedResults: Record<string, string | number> = {};
    if (isHematology) {
      generatedResults = {
        "Hemoglobin (Hb)": +(11.5 + Math.random() * 4).toFixed(1),
        "RBC Count": +(4.2 + Math.random() * 1.2).toFixed(2),
        "Hematocrit (Hct / PCV)": +(36 + Math.random() * 10).toFixed(1),
        "MCV": +(78 + Math.random() * 18).toFixed(1),
        "MCH": +(26 + Math.random() * 6).toFixed(1),
        "MCHC": +(32 + Math.random() * 3).toFixed(1),
        "RDW-CV": +(12.5 + Math.random() * 3).toFixed(1),
        "Total Leucocytic Count (TLC / WBC)": +(5.5 + Math.random() * 4.5).toFixed(1),
        "Platelet Count": Math.floor(180 + Math.random() * 220),
        "Neutrophils %": Math.floor(55 + Math.random() * 15),
        "Lymphocytes %": Math.floor(25 + Math.random() * 12),
        "Monocytes %": Math.floor(4 + Math.random() * 4),
        "Eosinophils %": Math.floor(1 + Math.random() * 3),
        "Basophils %": 1
      };
    } else {
      generatedResults = {
        "Fasting Blood Glucose": Math.floor(80 + Math.random() * 50),
        "Serum Creatinine": +(0.7 + Math.random() * 0.4).toFixed(2),
        "Blood Urea": Math.floor(20 + Math.random() * 20),
        "Serum Uric Acid": +(4.0 + Math.random() * 2.0).toFixed(1),
        "ALT (SGPT)": Math.floor(18 + Math.random() * 25),
        "AST (SGOT)": Math.floor(16 + Math.random() * 20),
        "Total Bilirubin": +(0.6 + Math.random() * 0.4).toFixed(2),
        "Direct Bilirubin": +(0.12 + Math.random() * 0.1).toFixed(2)
      };
    }

    const newTx: InstrumentTransmission = {
      id: `tx-${Date.now()}`,
      instrumentId: inst.id,
      instrumentName: inst.name,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      sampleBarcode: barcode,
      patientLabNumber: labNumber || `RT-2026-${Math.floor(100 + Math.random() * 900)}`,
      patientName: patientName || 'عينة واردة من الجهاز',
      testCode: isHematology ? 'CBC' : 'CHEMISTRY',
      results: generatedResults,
      rawMessage: `MSH|^~\\&|${inst.name}|${inst.manufacturer}|RT_LIS|MAIN|${new Date().toISOString()}||ORU^R01\rPID|||${barcode}\rOBR|1||${barcode}|${isHematology ? 'CBC' : 'CHEM'}`,
      status: 'received'
    };

    setTransmissions(prev => [newTx, ...prev]);
    setInstruments(prev => prev.map(i => i.id === inst.id ? { ...i, totalTestsRun: i.totalTestsRun + 1, lastSyncTime: 'الآن' } : i));

    logAction('DEVICE_COMM', 'DEVICE', `استلام نتائج فحص تلقائية من جهاز ${inst.name} للباركود ${barcode}`);
    addNotification({
      title: `نتائج جديدة من ${inst.name}`,
      message: `تم استقبال قراءات الباركود ${barcode} بنجاح ويمكن الآن إدراجها بالتقرير الطبي بضغطة زر.`,
      type: "info"
    });

    return newTx;
  }, [instruments, logAction, addNotification]);

  const applyTransmissionToReport = useCallback((transmissionId: string, reportId: string): boolean => {
    const tx = transmissions.find(t => t.id === transmissionId);
    const targetReport = reports.find(r => r.id === reportId);
    if (!tx || !targetReport) return false;

    setReports(prev => prev.map(rep => {
      if (rep.id === reportId) {
        const updatedProfiles = rep.profiles.map(prof => {
          const updatedParams = prof.parameters.map(param => {
            const matchingKey = Object.keys(tx.results).find(k =>
              k.toLowerCase() === param.name.toLowerCase() ||
              param.name.toLowerCase().includes(k.toLowerCase()) ||
              k.toLowerCase().includes(param.name.toLowerCase())
            );

            if (matchingKey && tx.results[matchingKey] !== undefined) {
              const val = tx.results[matchingKey];
              const numVal = typeof val === 'number' ? val : parseFloat(String(val));
              let flag: TestParameter['flag'] = 'NORMAL';

              if (!isNaN(numVal)) {
                if (param.panicLow !== undefined && numVal <= param.panicLow) flag = 'PANIC_LOW';
                else if (param.panicHigh !== undefined && numVal >= param.panicHigh) flag = 'PANIC_HIGH';
                else if (param.minNormal !== undefined && numVal < param.minNormal) flag = 'LOW';
                else if (param.maxNormal !== undefined && numVal > param.maxNormal) flag = 'HIGH';
              }

              return { ...param, result: String(val), flag };
            }
            return param;
          });

          return { ...prof, parameters: updatedParams };
        });

        return { ...rep, profiles: updatedProfiles, updatedAt: new Date().toISOString() };
      }
      return rep;
    }));

    setTransmissions(prev => prev.map(t => t.id === transmissionId ? { ...t, status: 'mapped' } : t));

    logAction('UPDATE', 'DIAGNOSTIC', `إدراج نتائج جهاز ${tx.instrumentName} في تقرير المريض ${targetReport.patient.fullName}`);
    addNotification({
      title: "تم ربط وإدراج نتائج الجهاز",
      message: `تم تحديث بارامترات التقرير الطبي للعينّة ${targetReport.reportNumber} تلقائياً.`,
      type: "success"
    });

    return true;
  }, [transmissions, reports, logAction, addNotification]);

  // Lab to Lab CRUD
  const addLabToLabOrder = useCallback((order: Omit<LabToLabOrder, 'id'>) => {
    const newOrder: LabToLabOrder = {
      ...order,
      id: `l2l-${Date.now()}`
    };
    setLabToLabOrders(prev => [newOrder, ...prev]);
    logAction('CREATE', 'LAB_TO_LAB', `إرسال عينة إلى معمل إحالة خارجي: ${order.externalLabName} للمريض ${order.patientName}`);
  }, [logAction]);

  const updateLabToLabOrder = useCallback((id: string, updates: Partial<LabToLabOrder>) => {
    setLabToLabOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
    logAction('UPDATE', 'LAB_TO_LAB', `تحديث طلب معمل الإحالة رقم ${id}`);
  }, [logAction]);

  const deleteLabToLabOrder = useCallback((id: string) => {
    setLabToLabOrders(prev => prev.filter(o => o.id !== id));
    logAction('DELETE', 'LAB_TO_LAB', `حذف طلب معمل الإحالة رقم ${id}`);
  }, [logAction]);

  // HR Employees CRUD
  const addEmployee = useCallback((emp: Omit<Employee, 'id'>) => {
    const newEmp: Employee = {
      ...emp,
      id: `emp-${Date.now()}`
    };
    setEmployees(prev => [newEmp, ...prev]);
    logAction('CREATE', 'HR', `إضافة موظف جديد: ${emp.fullName}`);
  }, [logAction]);

  const updateEmployee = useCallback((id: string, updates: Partial<Employee>) => {
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    logAction('UPDATE', 'HR', `تعديل بيانات الموظف رقم ${id}`);
  }, [logAction]);

  const deleteEmployee = useCallback((id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
    logAction('DELETE', 'HR', `حذف موظف رقم ${id}`);
  }, [logAction]);

  const recordAttendance = useCallback((employeeId: string, status: AttendanceRecord['status'], checkIn?: string, checkOut?: string, notes?: string) => {
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return;
    const today = new Date().toISOString().split('T')[0];
    const newAtt: AttendanceRecord = {
      id: `att-${Date.now()}`,
      employeeId,
      employeeName: emp.fullName,
      date: today,
      checkInTime: checkIn || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      checkOutTime: checkOut,
      status,
      hoursWorked: checkOut ? 8 : 0,
      overtimeHours: 0,
      notes
    };
    setAttendance(prev => [newAtt, ...prev.filter(a => !(a.employeeId === employeeId && a.date === today))]);
  }, [employees]);

  const generatePayrollForMonth = useCallback((monthYear: string) => {
    const newPayroll: PayrollRecord[] = employees.filter(e => e.isActive).map(emp => ({
      id: `pay-${emp.id}-${monthYear}`,
      monthYear,
      employeeId: emp.id,
      employeeName: emp.fullName,
      basicSalary: emp.basicSalary,
      bonusAmount: 0,
      deductionAmount: 0,
      advancePayment: 0,
      overtimePay: 0,
      netSalary: emp.basicSalary,
      paymentStatus: 'draft'
    }));
    setPayroll(newPayroll);
  }, [employees]);

  const updatePayrollRecord = useCallback((id: string, updates: Partial<PayrollRecord>) => {
    setPayroll(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const clockInEmployee = useCallback((empId: string) => {
    recordAttendance(empId, 'present');
  }, [recordAttendance]);

  const clockOutEmployee = useCallback((empId: string) => {
    const today = new Date().toISOString().split('T')[0];
    setAttendance(prev => prev.map(a => {
      if (a.employeeId === empId && a.date === today && !a.checkOutTime) {
        return {
          ...a,
          checkOutTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          hoursWorked: 8
        };
      }
      return a;
    }));
  }, []);

  // Lab Info Update
  const updateLabInfo = useCallback((info: LabInfo) => {
    setLabInfo(info);
    realtimeSyncManager.broadcastAction('UPDATE_LAB_INFO', info);
    logAction('UPDATE', 'SETTINGS', 'تحديث بيانات المعمل والاعتماد الطبي ووسائل التواصل');
  }, [logAction]);

  // Staff Signatures & Options
  const updateStaffSignatures = useCallback((signatures: LabStaffSignatures) => {
    setStaffSignatures(signatures);
    try {
      localStorage.setItem(STAFF_SIGNATURES_KEY, JSON.stringify(signatures));
      localStorage.setItem('rt_lab_staff_v3', JSON.stringify(signatures));
      localStorage.setItem('rt_lab_staff_v2', JSON.stringify(signatures));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
    realtimeSyncManager.broadcastAction('UPDATE_STAFF', signatures);
    if (githubConfig.token && githubConfig.autoSync) {
      pushFullStoreToGitHub(githubConfig, {
        reports,
        incomeRecords,
        expenses,
        loyaltyProfiles,
        inventory,
        labInfo,
        staffSignatures: signatures,
        staffSignatureOptions,
        testCatalog,
        packages,
        diagnosticProfiles
      }).catch(() => {});
    }
    logAction('UPDATE', 'SETTINGS', 'تحديث الإمضاءات الافتراضية لطاقم الفحص والاعتماد');
  }, [logAction, githubConfig, reports, incomeRecords, expenses, loyaltyProfiles, inventory, labInfo, staffSignatureOptions, testCatalog, packages, diagnosticProfiles]);

  const addStaffSignatureOption = useCallback((
    role: 'chemist' | 'verifier' | 'consultant',
    item: { name: string; title: string; license?: string }
  ) => {
    const newItem: StaffOptionItem = {
      id: `${role}-${Date.now()}`,
      name: item.name,
      title: item.title,
      role,
      license: item.license
    };

    setStaffSignatureOptions(prev => {
      const targetKey = role === 'chemist' ? 'chemists' : role === 'verifier' ? 'verifiers' : 'consultants';
      const updated = {
        ...prev,
        [targetKey]: [newItem, ...prev[targetKey].filter(x => x.name !== item.name)]
      };
      try {
        localStorage.setItem(STAFF_OPTIONS_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    logAction('CREATE', 'SETTINGS', `إضافة عضو جديد لطاقم الاعتماد: ${item.name} (${item.title})`);
  }, [logAction]);

  const updateStaffSignatureOption = useCallback((
    role: 'chemist' | 'verifier' | 'consultant',
    id: string,
    item: { name: string; title: string; license?: string }
  ) => {
    let oldName = '';
    setStaffSignatureOptions(prev => {
      const targetKey = role === 'chemist' ? 'chemists' : role === 'verifier' ? 'verifiers' : 'consultants';
      const existing = prev[targetKey].find(x => x.id === id);
      if (existing) oldName = existing.name;
      const updated = {
        ...prev,
        [targetKey]: prev[targetKey].map(x => (x.id === id ? { ...x, ...item } : x))
      };
      try {
        localStorage.setItem(STAFF_OPTIONS_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Automatically update default staffSignatures if this doctor was selected
    setStaffSignatures(prev => {
      let isChanged = false;
      const next = { ...prev };
      if (role === 'chemist' && (prev.labChemist === oldName || !prev.labChemist)) {
        next.labChemist = item.name;
        next.chemistTitle = item.title;
        if (item.license) next.chemistLicense = item.license;
        isChanged = true;
      } else if (role === 'verifier' && (prev.verifiedBy === oldName || !prev.verifiedBy)) {
        next.verifiedBy = item.name;
        next.verifierTitle = item.title;
        if (item.license) next.verifierLicense = item.license;
        isChanged = true;
      } else if (role === 'consultant' && (prev.pathologist === oldName || !prev.pathologist)) {
        next.pathologist = item.name;
        next.pathologistTitle = item.title;
        if (item.license) next.pathologistLicense = item.license;
        isChanged = true;
      }
      if (isChanged) {
        try {
          localStorage.setItem(STAFF_SIGNATURES_KEY, JSON.stringify(next));
          localStorage.setItem('rt_lab_staff_v3', JSON.stringify(next));
          localStorage.setItem('rt_lab_staff_v2', JSON.stringify(next));
        } catch {}
      }
      return isChanged ? next : prev;
    });

    // Update in any reports that reference the modified doctor
    setReports(prevReports => {
      let anyRepChanged = false;
      const nextReports = prevReports.map(rep => {
        if (!rep.staff) return rep;
        let repChanged = false;
        const newStaff = { ...rep.staff };
        if (role === 'chemist' && rep.staff.labChemist === oldName) {
          newStaff.labChemist = item.name;
          newStaff.chemistTitle = item.title;
          if (item.license) newStaff.chemistLicense = item.license;
          repChanged = true;
        } else if (role === 'verifier' && rep.staff.verifiedBy === oldName) {
          newStaff.verifiedBy = item.name;
          newStaff.verifierTitle = item.title;
          if (item.license) newStaff.verifierLicense = item.license;
          repChanged = true;
        } else if (role === 'consultant' && rep.staff.pathologist === oldName) {
          newStaff.pathologist = item.name;
          newStaff.pathologistTitle = item.title;
          if (item.license) newStaff.pathologistLicense = item.license;
          repChanged = true;
        }
        if (repChanged) anyRepChanged = true;
        return repChanged ? { ...rep, staff: newStaff } : rep;
      });
      return anyRepChanged ? nextReports : prevReports;
    });

    logAction('UPDATE', 'SETTINGS', `تحديث بيانات عضو طاقم الاعتماد وتحديث كافة السجلات: ${item.name}`);
  }, [logAction]);

  const deleteStaffSignatureOption = useCallback((
    role: 'chemist' | 'verifier' | 'consultant',
    id: string
  ) => {
    setStaffSignatureOptions(prev => {
      const targetKey = role === 'chemist' ? 'chemists' : role === 'verifier' ? 'verifiers' : 'consultants';
      return {
        ...prev,
        [targetKey]: prev[targetKey].filter(x => x.id !== id)
      };
    });
    logAction('DELETE', 'SETTINGS', `حذف عضو من قائمة طاقم الاعتماد: ${id}`);
  }, [logAction]);

  // Backups
  const exportBackup = useCallback(async (): Promise<string> => {
    const payload = {
      exportDate: new Date().toISOString(),
      reports,
      incomeRecords,
      loyaltyProfiles,
      inventory,
      expenses,
      dailyCloseouts,
      employees,
      labToLabOrders,
      testCatalog,
      packages,
      auditLogs: auditLogs.slice(0, 100)
    };
    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RT_Lab_Unified_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    logAction('BACKUP', 'SETTINGS', 'تصدير نسخة احتياطية موحدة شاملة لبيانات المعمل');
    return jsonStr;
  }, [reports, incomeRecords, loyaltyProfiles, inventory, expenses, dailyCloseouts, employees, labToLabOrders, testCatalog, packages, auditLogs, logAction]);

  const importBackup = useCallback(async (backupJson: string): Promise<{ success: boolean; message: string }> => {
    try {
      const data = JSON.parse(backupJson);
      if (data.reports) setReports(data.reports);
      if (data.incomeRecords) setIncomeRecords(data.incomeRecords);
      if (data.loyaltyProfiles) setLoyaltyProfiles(data.loyaltyProfiles);
      if (data.inventory) setInventory(data.inventory);
      if (data.expenses) setExpenses(data.expenses);
      if (data.employees) setEmployees(data.employees);
      if (data.labToLabOrders) setLabToLabOrders(data.labToLabOrders);
      if (data.testCatalog) setTestCatalog(data.testCatalog);
      if (data.packages) setPackages(data.packages);
      logAction('BACKUP', 'SETTINGS', 'استعادة قاعدة البيانات الموحدة من نسخة احتياطية');
      return { success: true, message: 'تم استعادة البيانات بنجاح!' };
    } catch {
      return { success: false, message: 'فشل استعادة البيانات من الملف.' };
    }
  }, [logAction]);

  const resetToDefaultData = useCallback(() => {
    setReports(INITIAL_REPORTS);
    setIncomeRecords(INITIAL_INCOME_RECORDS);
    setLoyaltyProfiles(INITIAL_LOYALTY_DATA);
    setInventory(INITIAL_INVENTORY);
    setExpenses([]);
    setDailyCloseouts([]);
    setLabToLabOrders(INITIAL_LAB_TO_LAB);
    setEmployees(INITIAL_EMPLOYEES);
    logAction('BACKUP', 'SETTINGS', 'إعادة ضبط المنظومة للبيانات الأولية الافتراضية');
  }, [logAction]);

  const clearPatientRecordsOnly = useCallback(() => {
    setReports([]);
    setIncomeRecords([]);
    setLoyaltyProfiles([]);
    setSelectedReportId(null);
    logAction('DELETE', 'SETTINGS', 'مسح سجلات المرضى والفواتير فقط مع الاحتفاظ بالكتالوج والمخزون');
  }, [logAction]);

  // GitHub Cloud Sync
  const updateGithubConfig = useCallback((config: Partial<GitHubSyncConfig>) => {
    setGithubConfig(prev => ({ ...prev, ...config }));
  }, []);

  const syncAllDevicesNow = useCallback(async (): Promise<{ success: boolean; message: string; reportsCount?: number; invoicesCount?: number }> => {
    try {
      // 1. Pull latest database from GitHub directly via raw API
      const ghRes = await pullFullStoreFromGitHub(githubConfig);
      let mergedReports = [...reports];
      let mergedInvoices = [...incomeRecords];
      let mergedPackages = [...packages];
      let mergedProfiles = [...diagnosticProfiles];
      let mergedCatalog = [...testCatalog];

      if (ghRes.success && ghRes.data) {
        const data = ghRes.data;
        if (Array.isArray(data.reports) && data.reports.length > 0) {
          const map = new Map<string, LabReport>();
          mergedReports.forEach(r => {
            if (r.id) map.set(r.id, r);
            if (r.reportNumber) map.set(r.reportNumber, r);
            if (r.patient?.barcode) map.set(r.patient.barcode, r);
          });
          data.reports.forEach((r: LabReport) => {
            const existing = map.get(r.id) || (r.reportNumber && map.get(r.reportNumber)) || (r.patient?.barcode && map.get(r.patient.barcode));
            if (!existing) {
              map.set(r.id, r);
            } else {
              const merged = mergeTwoReports(existing, r);
              map.set(existing.id, merged);
              if (merged.reportNumber) map.set(merged.reportNumber, merged);
              if (merged.patient?.barcode) map.set(merged.patient.barcode, merged);
            }
          });
          mergedReports = Array.from(new Set(map.values()));
          setReports(mergedReports);
        }

        if (Array.isArray(data.incomeRecords) && data.incomeRecords.length > 0) {
          const map = new Map<string, IncomeRecord>();
          mergedInvoices.forEach(i => {
            if (i.id) map.set(i.id, i);
            if (i.invoiceNumber) map.set(i.invoiceNumber, i);
            if (i.barcode) map.set(i.barcode, i);
          });
          data.incomeRecords.forEach((i: IncomeRecord) => {
            const existing = map.get(i.id) || (i.invoiceNumber && map.get(i.invoiceNumber)) || (i.barcode && map.get(i.barcode));
            if (!existing) {
              map.set(i.id, i);
            } else {
              const merged = mergeTwoInvoices(existing, i);
              map.set(existing.id, merged);
              if (merged.invoiceNumber) map.set(merged.invoiceNumber, merged);
              if (merged.barcode) map.set(merged.barcode, merged);
            }
          });
          mergedInvoices = Array.from(new Set(map.values()));
          setIncomeRecords(mergedInvoices);
        }

        if (Array.isArray(data.packages) && data.packages.length > 0) {
          mergedPackages = mergePackagesWithDefaults(data.packages, packages);
          setPackages(mergedPackages);
        }

        if (Array.isArray(data.diagnosticProfiles) && data.diagnosticProfiles.length > 0) {
          mergedProfiles = mergeProfilesWithDefaults(data.diagnosticProfiles);
          setDiagnosticProfiles(mergedProfiles);
        }

        if (Array.isArray(data.testCatalog) && data.testCatalog.length > 0) {
          mergedCatalog = mergeCatalogWithDefaults(data.testCatalog);
          setTestCatalog(mergedCatalog);
        }

        if (Array.isArray(data.expenses) && data.expenses.length > 0) {
          setExpenses(data.expenses);
        }
        if (Array.isArray(data.loyaltyProfiles) && data.loyaltyProfiles.length > 0) {
          setLoyaltyProfiles(data.loyaltyProfiles);
        }
        if (data.labInfo) {
          setLabInfo(data.labInfo);
        }
        if (data.staffSignatures) {
          setStaffSignatures(data.staffSignatures);
          try {
            localStorage.setItem(STAFF_SIGNATURES_KEY, JSON.stringify(data.staffSignatures));
          } catch {}
        }
        if (data.staffSignatureOptions) {
          setStaffSignatureOptions(data.staffSignatureOptions);
          try {
            localStorage.setItem(STAFF_OPTIONS_KEY, JSON.stringify(data.staffSignatureOptions));
          } catch {}
        }
      }

      // 2. Also fetch diagnostic cases queue from GitHub and sync both reports AND invoices
      const diagCasesRes = await fetchDiagnosticCases(githubConfig);
      if (diagCasesRes.success && Array.isArray(diagCasesRes.cases)) {
        const existingBarcodes = new Set(mergedReports.map(r => r.patient?.barcode).filter(Boolean));
        const existingNumbers = new Set(mergedReports.map(r => r.reportNumber).filter(Boolean));
        const existingInvNumbers = new Set(mergedInvoices.map(i => i.invoiceNumber || i.labNumber));

        diagCasesRes.cases.forEach((c: any) => {
          const invNum = c.invoiceNumber || `INV-${c.labNumber.replace('RT-', '')}`;
          const net = c.totalCost || 0;
          const paid = c.paidAmount !== undefined ? c.paidAmount : (c.paymentStatus === 'paid' ? net : 0);
          const isHome = c.isHomeVisit ?? (c.bookingType === 'home_visit' || (c.visitFee && c.visitFee > 0));
          const vFee = c.visitFee || 0;
          const vAddr = c.visitAddress || c.homeAddress || '';
          const bType = c.bookingType || (isHome ? 'home_visit' : 'branch');
          const disc = c.discount || 0;
          const testsSub = c.testsSubtotal || net;

          const actualTests = (Array.isArray(c.tests) && c.tests.length > 0)
            ? c.tests
            : (c.testNames || ['تحاليل مخبرية']).map((tName: string, idx: number) => ({
                id: `tst-${idx}-${c.id}`,
                code: `TST-${idx}`,
                nameAr: tName,
                nameEn: tName,
                category: 'Clinical',
                price: 150,
                cost: 30
              }));

          if ((c.barcode && !existingBarcodes.has(c.barcode)) || (c.labNumber && !existingNumbers.has(c.labNumber))) {
            const newRep = convertIncomeRecordToDiagnosticReport({
              id: c.id,
              invoiceNumber: invNum,
              labNumber: c.labNumber,
              barcode: c.barcode,
              patientName: c.fullName,
              patientAge: c.age || 30,
              patientGender: c.gender || 'male',
              patientPhone: c.phone || '',
              referringDoctor: c.referringDoctorName || 'كشف معمل',
              tests: actualTests,
              subtotal: net,
              discount: disc,
              netAmount: net,
              paidAmount: paid,
              remainingAmount: Math.max(0, net - paid),
              paymentMethod: c.paymentMethod || 'cash',
              paymentStatus: (c.paymentStatus as any) || (paid >= net ? 'paid' : 'pending'),
              cashierName: 'مزامنة سحابية',
              branch: 'الفرع الرئيسي - بهتيم',
              syncStatus: 'synced',
              createdAt: c.sampleDate || new Date().toISOString(),
              updatedAt: c.sampleDate || new Date().toISOString(),
              isHomeVisit: isHome,
              bookingType: bType,
              visitFee: vFee,
              visitAddress: vAddr,
              homeAddress: vAddr,
              deliveryNotes: c.deliveryNotes || '',
              visitSpecialist: c.visitSpecialist || '',
              testsSubtotal: testsSub,
              discountApplied: disc
            }) as unknown as LabReport;
            mergedReports = [newRep, ...mergedReports];
            if (c.barcode) existingBarcodes.add(c.barcode);
            if (c.labNumber) existingNumbers.add(c.labNumber);
          }

          if (!existingInvNumbers.has(invNum) && !existingInvNumbers.has(c.labNumber)) {
            const newInv: IncomeRecord = {
              id: `inv-${c.id || c.labNumber}-${Date.now()}`,
              invoiceNumber: invNum,
              patientName: c.fullName,
              patientPhone: c.phone || '',
              patientAge: c.age || 30,
              patientGender: c.gender || 'male',
              barcode: c.barcode,
              labNumber: c.labNumber,
              referringDoctor: c.referringDoctorName || 'كشف معمل',
              tests: actualTests,
              subtotal: net,
              testsSubtotal: testsSub,
              discount: disc,
              visitFee: vFee,
              isHomeVisit: isHome,
              bookingType: bType,
              visitAddress: vAddr,
              deliveryNotes: c.deliveryNotes || '',
              visitSpecialist: c.visitSpecialist || '',
              netAmount: net,
              paidAmount: paid,
              remainingAmount: Math.max(0, net - paid),
              paymentMethod: (c.paymentMethod as any) || 'cash',
              paymentStatus: (c.paymentStatus as any) || (paid >= net ? 'paid' : 'pending'),
              cashierName: 'مزامنة سحابية',
              branch: 'الفرع الرئيسي - بهتيم',
              syncStatus: 'synced',
              createdAt: c.sampleDate || new Date().toISOString(),
              updatedAt: c.sampleDate || new Date().toISOString()
            };
            mergedInvoices = [newInv, ...mergedInvoices];
            existingInvNumbers.add(invNum);
            existingInvNumbers.add(c.labNumber);
          }
        });
        setReports(mergedReports);
        setIncomeRecords(mergedInvoices);
      }

      // 3. Save to localStorage immediately
      try {
        localStorage.setItem(REPORTS_KEY, JSON.stringify(mergedReports));
        localStorage.setItem(INCOME_KEY, JSON.stringify(mergedInvoices));
        localStorage.setItem(PACKAGES_KEY, JSON.stringify(mergedPackages));
        localStorage.setItem(DIAGNOSTIC_PROFILES_KEY, JSON.stringify(mergedProfiles));
        localStorage.setItem(CATALOG_KEY, JSON.stringify(mergedCatalog));
        localStorage.setItem(STAFF_SIGNATURES_KEY, JSON.stringify(staffSignatures));
        localStorage.setItem(STAFF_OPTIONS_KEY, JSON.stringify(staffSignatureOptions));
      } catch (e) {
        console.warn('Storage save note:', e);
      }

      // 4. Push unified state back to GitHub and broadcast to all devices
      const unifiedStore = {
        reports: mergedReports,
        incomeRecords: mergedInvoices,
        expenses,
        loyaltyProfiles,
        inventory,
        labInfo,
        staffSignatures,
        staffSignatureOptions,
        testCatalog: mergedCatalog,
        packages: mergedPackages,
        diagnosticProfiles: mergedProfiles
      };

      if (githubConfig.token) {
        await pushFullStoreToGitHub(githubConfig, unifiedStore);
      }
      realtimeSyncManager.broadcastAction('FULL_SYNC', unifiedStore);

      setGithubConfig(prev => ({ ...prev, lastSyncAt: new Date().toLocaleString('en-US'), status: 'connected' }));

      addNotification({
        title: '✅ تمت المزامنة الشاملة بنجاح',
        message: `تم جلب ومزامنة ${mergedReports.length} تقرير وحالة و ${mergedInvoices.length} فاتورة و ${mergedPackages.length} باقة بين كافة الأجهزة بنجاح.`,
        type: 'success'
      });

      return {
        success: true,
        message: `تم بنجاح جلب ومزامنة ${mergedReports.length} حالة طبية و ${mergedInvoices.length} فاتورة مسجلة و ${mergedPackages.length} باقة بين كافة الأجهزة!`,
        reportsCount: mergedReports.length,
        invoicesCount: mergedInvoices.length
      };
    } catch (err: any) {
      console.error('syncAllDevicesNow error:', err);
      return {
        success: false,
        message: `خطأ أثناء المزامنة: ${err.message || 'تعذر الاتصال بالسحابة'}`
      };
    }
  }, [reports, incomeRecords, packages, diagnosticProfiles, testCatalog, expenses, loyaltyProfiles, inventory, labInfo, githubConfig, addNotification]);

  const syncUnifiedDataToGitHub = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    return await syncAllDevicesNow();
  }, [syncAllDevicesNow]);

  const value: AppContextType = {
    language,
    setLanguage,
    currentUser,
    users,
    loginModalOpen,
    setLoginModalOpen,
    loginUser,
    logout,
    hasPermission,

    activeTab,
    setActiveTab,

    reports,
    selectedReportId,
    setSelectedReportId,
    selectedReport,
    addReport,
    updateReport,
    deleteReport,
    verifyReport,
    createReportFromAdmission,

    incomeRecords,
    addIncomeRecord,
    updateIncomeRecord,
    deleteIncomeRecord,
    selectedInvoice,
    setSelectedInvoice,
    financialMetrics,
    scannedBarcode: null,
    setScannedBarcode: () => {},
    setScannerOpen: setIsBarcodeScannerOpen,

    testCatalog,
    addCatalogTest,
    updateCatalogTest,
    updateIndividualTests,
    deleteCatalogTest,
    resetCatalog,
    forceSyncCatalog,

    packages,
    updatePackages,
    addPackage,
    updateSinglePackage,
    deletePackage,
    resetPackages,
    applyPackageToReport,

    diagnosticProfiles,
    updateDiagnosticProfiles,
    resetDiagnosticProfiles,

    instruments,
    transmissions,
    toggleInstrumentStatus,
    simulateInstrumentRun,
    applyTransmissionToReport,

    loyaltyProfiles,
    loyaltyConfig,
    updateLoyaltyConfig,
    addLoyaltyProfile,
    getLoyaltyByPhone,
    calculateLoyaltyTier,
    earnLoyaltyPoints,
    redeemLoyaltyPoints,
    updateLoyaltyProfile,
    deleteLoyaltyProfile,
    deleteLoyaltyTransaction,
    retroactiveSyncAllInvoicesToLoyalty,
    addLoyaltyPoints,
    calculateCashForPoints,
    calculatePointsForAmount,

    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    profitConfig,
    updateProfitConfig,
    dailyCloseouts,
    closeoutDay,

    inventory,
    addInventoryItem,
    updateInventoryItem,
    restockItem,
    consumeReagent,
    deleteInventoryItem,

    labToLabOrders,
    addLabToLabOrder,
    updateLabToLabOrder,
    deleteLabToLabOrder,

    employees,
    attendance,
    payroll,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    recordAttendance,
    generatePayrollForMonth,
    updatePayrollRecord,
    clockInEmployee,
    clockOutEmployee,

    labInfo,
    updateLabInfo,
    facilities,
    staffMembers,
    staffSignatures,
    updateStaffSignatures,
    staffSignatureOptions,
    addStaffSignatureOption,
    updateStaffSignatureOption,
    deleteStaffSignatureOption,

    auditLogs,
    logAction,

    notifications,
    markNotificationRead,
    clearNotifications,
    addNotification,

    githubConfig,
    updateGithubConfig,
    syncUnifiedDataToGitHub,
    syncAllDevicesNow,

    exportBackup,
    importBackup,
    resetToDefaultData,
    clearPatientRecordsOnly,

    isPatientFormOpen,
    setIsPatientFormOpen,
    isBarcodeScannerOpen,
    setIsBarcodeScannerOpen,
    isLabInfoModalOpen,
    setIsLabInfoModalOpen
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
