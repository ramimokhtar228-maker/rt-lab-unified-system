import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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
  ComprehensivePackage
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
import { LAB_CATALOG } from '../data/labCatalog';
import { INITIAL_PACKAGES } from '../data/packagesData';
import { INITIAL_INDIVIDUAL_TESTS } from '../data/individualTestsData';
import { INITIAL_INSTRUMENTS, SAMPLE_INSTRUMENT_TRANSMISSIONS } from '../data/instrumentsData';
import { realtimeSyncManager } from '../utils/realtimeMultiDeviceSync';
import { pushFullStoreToGitHub, pullFullStoreFromGitHub } from '../utils/githubSync';
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
      }
    });

    // 2. Initial cloud master pull on mount (from Firebase Firestore first, fallback to GitHub)
    realtimeSyncManager.pullMasterSnapshot().then(res => {
      if (res.success && res.data) {
        if (Array.isArray(res.data.reports) && res.data.reports.length > 0) {
          setReports(prev => {
            const map = new Map(prev.map(r => [r.id, r]));
            res.data.reports.forEach((r: LabReport) => map.set(r.id, r));
            return Array.from(map.values());
          });
        }
        if (Array.isArray(res.data.incomeRecords) && res.data.incomeRecords.length > 0) {
          setIncomeRecords(prev => {
            const map = new Map(prev.map(i => [i.id, i]));
            res.data.incomeRecords.forEach((i: IncomeRecord) => map.set(i.id, i));
            return Array.from(map.values());
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
      } else {
        // Fallback to GitHub repo store if Firestore snapshot is not initialized yet
        pullFullStoreFromGitHub(githubConfig).then(ghRes => {
          if (ghRes.success && ghRes.data) {
            if (Array.isArray(ghRes.data.reports) && ghRes.data.reports.length > 0) {
              setReports(prev => {
                const map = new Map(prev.map(r => [r.id, r]));
                ghRes.data.reports.forEach((r: LabReport) => map.set(r.id, r));
                return Array.from(map.values());
              });
            }
            if (Array.isArray(ghRes.data.incomeRecords) && ghRes.data.incomeRecords.length > 0) {
              setIncomeRecords(prev => {
                const map = new Map(prev.map(i => [i.id, i]));
                ghRes.data.incomeRecords.forEach((i: IncomeRecord) => map.set(i.id, i));
                return Array.from(map.values());
              });
            }
            if (Array.isArray(ghRes.data.testCatalog) && ghRes.data.testCatalog.length > 0) {
              setTestCatalog(prev => mergeCatalogWithDefaults(ghRes.data.testCatalog));
            }
            if (Array.isArray(ghRes.data.packages) && ghRes.data.packages.length > 0) {
              setPackages(prev => mergePackagesWithDefaults(ghRes.data.packages));
            }
          }
        }).catch(() => {});
      }
    }).catch(err => console.warn('Initial cloud pull:', err));

    return () => {
      unsubscribe();
    };
  }, [githubConfig]);


  // Re-pull latest cloud state when user returns to the tab (multi-device immediate catch-up)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        realtimeSyncManager.pullMasterSnapshot().then(res => {
          if (res.success && res.data) {
            const data = res.data;
            if (Array.isArray(data.reports) && data.reports.length > 0) {
              setReports(prev => {
                const map = new Map(prev.map((r: any) => [r.id, r]));
                data.reports.forEach((r: any) => map.set(r.id, r));
                return Array.from(map.values());
              });
            }
            if (Array.isArray(data.incomeRecords) && data.incomeRecords.length > 0) {
              setIncomeRecords(prev => {
                const map = new Map(prev.map((i: any) => [i.id, i]));
                data.incomeRecords.forEach((i: any) => map.set(i.id, i));
                return Array.from(map.values());
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
  }, []);

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
          packages
        };

        // 1. Instant Firebase Cloud persistence
        realtimeSyncManager.pushMasterSnapshot(payload);

        // 2. Secondary GitHub backup
        if (githubConfig.autoSync && githubConfig.token) {
          pushFullStoreToGitHub(githubConfig, payload).catch(() => {});
        }
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [reports, incomeRecords, expenses, loyaltyProfiles, inventory, labInfo, testCatalog, packages, githubConfig]);

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
    setReports(prev => [report, ...prev]);
    setSelectedReportId(report.id);
    realtimeSyncManager.broadcastAction('UPDATE_REPORT', report);
    logAction('CREATE', 'DIAGNOSTIC', `إنشاء تقرير طبي جديد للمريض ${report.patient.fullName} برقم ${report.reportNumber}`);
  }, [logAction]);

  const updateReport = useCallback((id: string, updates: Partial<LabReport>) => {
    setReports(prev => {
      const updatedList = prev.map(r => r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r);
      const target = updatedList.find(r => r.id === id);
      if (target) {
        realtimeSyncManager.broadcastAction('UPDATE_REPORT', target);
      }
      return updatedList;
    });
    logAction('UPDATE', 'DIAGNOSTIC', `تحديث التقرير الطبي رقم ${id}`);
  }, [logAction]);

  const deleteReport = useCallback((id: string) => {
    const reportToDelete = reports.find(r => r.id === id);
    setReports(prev => prev.filter(r => r.id !== id));
    realtimeSyncManager.broadcastAction('DELETE_REPORT', id);
    if (selectedReportId === id) {
      setSelectedReportId(null);
    }
    logAction('DELETE', 'DIAGNOSTIC', `حذف التقرير الطبي للمريض ${reportToDelete?.patient.fullName || id}`);
  }, [reports, selectedReportId, logAction]);

  const verifyReport = useCallback((id: string) => {
    setReports(prev => prev.map(r => {
      if (r.id === id) {
        return {
          ...r,
          status: 'verified',
          staff: {
            ...r.staff,
            verifiedBy: currentUser.nameAr,
            pathologist: r.staff.pathologist || "أ.د. رامي مختار - استشاري الباثولوجيا الإكلينيكية والكيميائية - كلية طب قصر العيني"
          },
          updatedAt: new Date().toISOString()
        };
      }
      return r;
    }));
    logAction('UPDATE', 'DIAGNOSTIC', `اعتماد التقرير الطبي رسمياً بواسطة ${currentUser.nameAr}`);
    addNotification({
      title: "تم اعتماد التقرير الطبي",
      message: `تم اعتماد تقرير المريض برقم ${id} وأصبح جاهزاً للطباعة والإرسال.`,
      type: "success"
    });
  }, [currentUser, logAction, addNotification]);

  // Financial CRUD
  const addIncomeRecord = useCallback((record: Omit<IncomeRecord, 'id' | 'createdAt' | 'updatedAt'>): IncomeRecord => {
    const newRecord: IncomeRecord = {
      ...record,
      id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'synced'
    };
    setIncomeRecords(prev => [newRecord, ...prev]);
    realtimeSyncManager.broadcastAction('UPDATE_INVOICE', newRecord);
    logAction('CREATE', 'INCOME', `إصدار فاتورة جديدة رقم ${newRecord.invoiceNumber} للمريض ${newRecord.patientName} بقيمة صافية ${newRecord.netAmount} ج.م`);
    return newRecord;
  }, [logAction]);

  const updateIncomeRecord = useCallback((id: string, updates: Partial<IncomeRecord>) => {
    setIncomeRecords(prev => {
      const updatedList = prev.map(inv => inv.id === id ? { ...inv, ...updates, updatedAt: new Date().toISOString() } : inv);
      const target = updatedList.find(i => i.id === id);
      if (target) {
        realtimeSyncManager.broadcastAction('UPDATE_INVOICE', target);
      }
      return updatedList;
    });
    logAction('UPDATE', 'INCOME', `تعديل الفاتورة رقم ${id}`);
  }, [logAction]);

  const deleteIncomeRecord = useCallback((id: string) => {
    const inv = incomeRecords.find(i => i.id === id);
    setIncomeRecords(prev => prev.filter(i => i.id !== id));
    realtimeSyncManager.broadcastAction('DELETE_INVOICE', id);
    logAction('DELETE', 'INCOME', `حذف الفاتورة رقم ${inv?.invoiceNumber || id} للمريض ${inv?.patientName}`);
  }, [incomeRecords, logAction]);

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
    logAction('CATALOG_UPDATE', 'CATALOG', `تعديل سعر/بيانات التحليل: ${code}`);
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
    realtimeSyncManager.broadcastAction('UPDATE_PACKAGES', pkgs);
    logAction('UPDATE', 'CATALOG', 'تحديث قائمة باقات الفحص الشامل المتاحة');
  }, [logAction]);

  const addPackage = useCallback((pkg: ComprehensivePackage) => {
    setPackages(prev => {
      const next = [pkg, ...prev];
      realtimeSyncManager.broadcastAction('UPDATE_PACKAGES', next);
      return next;
    });
    logAction('CREATE', 'CATALOG', `إضافة باقة فحص جديدة: ${pkg.titleAr} (${pkg.code})`);
  }, [logAction]);

  const updateSinglePackage = useCallback((id: string, updates: Partial<ComprehensivePackage>) => {
    setPackages(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...updates } : p);
      realtimeSyncManager.broadcastAction('UPDATE_PACKAGES', next);
      return next;
    });
    logAction('UPDATE', 'CATALOG', `تعديل بيانات الباقة: ${id}`);
  }, [logAction]);

  const deletePackage = useCallback((id: string) => {
    setPackages(prev => {
      const next = prev.filter(p => p.id !== id);
      realtimeSyncManager.broadcastAction('UPDATE_PACKAGES', next);
      return next;
    });
    logAction('DELETE', 'CATALOG', `حذف الباقة: ${id}`);
  }, [logAction]);

  const resetPackages = useCallback(() => {
    const fullPkgs = mergePackagesWithDefaults();
    setPackages(fullPkgs);
    realtimeSyncManager.broadcastAction('UPDATE_PACKAGES', fullPkgs);
    logAction('UPDATE', 'CATALOG', `استعادة الباقات الافتراضية الـ 15 المتكاملة (${fullPkgs.length} باقة)`);
  }, [logAction]);

  const updateDiagnosticProfiles = useCallback((profiles: CatalogProfileTemplate[]) => {
    setDiagnosticProfiles(profiles);
    logAction('CATALOG_UPDATE', 'CATALOG', `تحديث بروفايلات التحاليل الشاملة (${profiles.length} بروفايل)`);
  }, [logAction]);

  const resetDiagnosticProfiles = useCallback(() => {
    setDiagnosticProfiles(LAB_CATALOG);
    logAction('CATALOG_UPDATE', 'CATALOG', 'استعادة بروفايلات التحاليل الافتراضية (24 بروفايل طبي)');
  }, [logAction]);

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
      packages: refreshedPackages
    };

    realtimeSyncManager.pushMasterSnapshot(syncPayload);
    realtimeSyncManager.broadcastAction('UPDATE_CATALOG', refreshedTests);
    realtimeSyncManager.broadcastAction('UPDATE_PACKAGES', refreshedPackages);

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

  // Apply Package Directly to Any Report (Unpacks all profile tables & test results)
  const applyPackageToReport = useCallback((reportId: string, pkg: ComprehensivePackage) => {
    setReports(prev => prev.map(rep => {
      if (rep.id !== reportId) return rep;
      
      const newProfiles: TestProfile[] = [];

      // 1. Unpack all included profiles from LAB_CATALOG
      (pkg.includedProfiles || []).forEach(pCode => {
        const template = LAB_CATALOG.find(c => c.code.toUpperCase() === pCode.toUpperCase());
        if (template && !newProfiles.some(p => p.profileCode.toUpperCase() === template.code.toUpperCase())) {
          newProfiles.push({
            id: `prof-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            profileCode: template.code,
            titleEn: template.titleEn,
            titleAr: template.titleAr,
            category: template.category,
            sampleType: template.sampleType,
            interpretation: template.defaultInterpretation || '',
            parameters: template.parameters.map((p, idx) => ({
              ...p,
              id: `param-${idx}-${Date.now()}-${Math.random().toString(36).substr(2, 3)}`,
              result: '',
              flag: 'NORMAL'
            }))
          });
        }
      });

      // 2. Unpack all included individual tests
      const extraParams: TestParameter[] = [];
      (pkg.includedIndividualTestCodes || []).forEach((tCode, idx) => {
        const indTest = INITIAL_INDIVIDUAL_TESTS.find(t => t.code.toUpperCase() === tCode.toUpperCase())
                     || testCatalog.find(t => t.code.toUpperCase() === tCode.toUpperCase());
        if (indTest) {
          extraParams.push({
            id: `p-pkg-${idx}-${Date.now()}`,
            name: `${indTest.nameAr} (${indTest.nameEn})`,
            result: '',
            unit: indTest.unit || 'Score / Units',
            minNormal: indTest.minNormal,
            maxNormal: indTest.maxNormal,
            textReference: indTest.textReference || 'Normal',
            flag: 'NORMAL',
            method: indTest.method || 'Automated Clinical Assay'
          });
        }
      });

      if (extraParams.length > 0) {
        newProfiles.push({
          id: `prof-extra-${Date.now()}`,
          profileCode: 'PKG_EXTRA',
          titleAr: `فحوصات وفيتامينات باقة: ${pkg.titleAr}`,
          titleEn: `Package Tests (${pkg.titleEn})`,
          category: 'Package Tests',
          sampleType: pkg.sampleTypes?.[0] || 'Serum',
          interpretation: 'All complementary package tests evaluated according to certified reference ranges.',
          parameters: extraParams
        });
      }

      return {
        ...rep,
        packageApplied: {
          code: pkg.code,
          titleAr: pkg.titleAr,
          packagePrice: pkg.packagePrice,
          originalPrice: pkg.originalPrice
        } as any,
        profiles: newProfiles.length > 0 ? newProfiles : rep.profiles,
        status: rep.status === 'draft' ? 'in_progress' : rep.status,
        updatedAt: new Date().toISOString()
      };
    }));
    logAction('UPDATE', 'DIAGNOSTIC', `تطبيق باقة "${pkg.titleAr}" على التقرير وتفعيل جداول النتائج`);
  }, [testCatalog, logAction]);

  // Unified Admission: Register patient -> Create Lab Report -> Create Income Invoice -> Update Loyalty
  const createReportFromAdmission = useCallback((patient: Patient, selectedTests: InvoiceTestItem[], packageApplied?: any): LabReport => {
    const today = new Date().toISOString().split('T')[0];
    const generatedProfiles: TestProfile[] = [];

    // 1. If a Package was applied: ONE profile only (all tests listed together — no separate pages)
    if (packageApplied) {
      const packageParams: TestParameter[] = [];
      const seenCodes = new Set<string>();

      // A) Flatten included profiles into parameters (do NOT create separate profile pages)
      (packageApplied.includedProfiles || []).forEach((pCode: string) => {
        const template = LAB_CATALOG.find(c => c.code.toUpperCase() === pCode.toUpperCase());
        if (!template) return;
        template.parameters.forEach((p, idx) => {
          const key = `${template.code}:${p.name}`.toUpperCase();
          if (seenCodes.has(key)) return;
          seenCodes.add(key);
          packageParams.push({
            ...p,
            id: `param-pkg-${template.code}-${idx}-${Date.now()}-${Math.random().toString(36).substr(2, 3)}`,
            result: '',
            flag: 'NORMAL' as const,
            name: p.name?.includes(template.titleEn) ? p.name : `${p.name}`
          });
        });
      });

      // B) Flatten complementary individual tests into same parameter list
      (packageApplied.includedIndividualTestCodes || []).forEach((tCode: string, idx: number) => {
        const codeKey = tCode.toUpperCase();
        if (seenCodes.has(codeKey)) return;
        seenCodes.add(codeKey);
        const indTest = INITIAL_INDIVIDUAL_TESTS.find(t => t.code.toUpperCase() === codeKey)
                     || testCatalog.find(t => t.code.toUpperCase() === codeKey);
        if (indTest) {
          packageParams.push({
            id: `p-pkg-${idx}-${Date.now()}`,
            name: `${indTest.nameAr} (${indTest.nameEn})`,
            result: '',
            unit: indTest.unit || 'Score / Units',
            minNormal: indTest.minNormal,
            maxNormal: indTest.maxNormal,
            textReference: indTest.textReference || 'Normal',
            flag: 'NORMAL',
            method: indTest.method || 'Automated Clinical Assay'
          });
        }
      });

      if (packageParams.length > 0) {
        generatedProfiles.push({
          id: `prof-pkg-${Date.now()}`,
          profileCode: packageApplied.code || 'PACKAGE',
          titleAr: packageApplied.titleAr || 'باقة التحاليل',
          titleEn: packageApplied.titleEn || 'Test Package',
          category: packageApplied.category || 'Package',
          sampleType: (packageApplied.sampleTypes && packageApplied.sampleTypes[0]) || 'Serum',
          interpretation: `Package panel: ${packageApplied.titleEn || packageApplied.titleAr || ''} — all tests listed in one report page.`,
          parameters: packageParams
        });
      }
    }

    // 2. Extra selected tests (only when NOT already covered by package — keep single page when package used)
    selectedTests.forEach(test => {
      const testCode = test.code.toUpperCase();

      // If a package was applied: append extras into the same package profile (no new pages)
      if (packageApplied && generatedProfiles.length > 0) {
        const pkgProfile = generatedProfiles[0];
        const already = pkgProfile.parameters.some(p =>
          (p.name || '').toUpperCase().includes(testCode) ||
          (p.name || '').toUpperCase().includes((test.nameEn || '').toUpperCase())
        );
        if (already) return;
        const packageCodes = new Set([
          ...(packageApplied.includedProfiles || []).map((x: string) => x.toUpperCase()),
          ...(packageApplied.includedIndividualTestCodes || []).map((x: string) => x.toUpperCase())
        ]);
        if (packageCodes.has(testCode)) return;

        const richTest = INITIAL_INDIVIDUAL_TESTS.find(t => t.code.toUpperCase() === testCode)
                      || testCatalog.find(t => t.code.toUpperCase() === testCode)
                      || test;
        pkgProfile.parameters.push({
          id: `p-extra-${Date.now()}-${Math.random().toString(36).substr(2, 3)}`,
          name: `${(richTest as any).nameAr || test.nameAr} (${(richTest as any).nameEn || test.nameEn || test.code})`,
          result: '',
          unit: (richTest as any).unit || 'Score / Units',
          minNormal: (richTest as any).minNormal,
          maxNormal: (richTest as any).maxNormal,
          textReference: (richTest as any).textReference || 'Normal',
          flag: 'NORMAL',
          method: (richTest as any).method || 'Automated Clinical Assay'
        });
        return;
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
        const richTest = INITIAL_INDIVIDUAL_TESTS.find(t => t.code.toUpperCase() === testCode) || test;
        generatedProfiles.push({
          id: `prof-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          profileCode: (richTest as any).code || test.code,
          titleEn: (richTest as any).nameEn || test.nameEn || test.code,
          titleAr: (richTest as any).nameAr || test.nameAr || test.code,
          category: (richTest as any).category || 'General Diagnostic',
          sampleType: (richTest as any).sampleType || 'Serum',
          parameters: [
            {
              id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 3)}`,
              name: `${(richTest as any).nameAr || test.nameAr} (${(richTest as any).nameEn || test.nameEn || test.code})`,
              result: '',
              unit: (richTest as any).unit || 'Score / Units',
              minNormal: (richTest as any).minNormal,
              maxNormal: (richTest as any).maxNormal,
              textReference: (richTest as any).textReference || 'Normal',
              flag: 'NORMAL',
              method: (richTest as any).method || 'Automated Clinical Assay'
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
      staff: {
        labChemist: "د. هبة الشناوي - كيميائية تحاليل",
        verifiedBy: "د. مصطفى العوضي - استشاري التحاليل",
        pathologist: "أ.د. رامي مختار - استشاري الباثولوجيا الإكلينيكية والكيميائية - كلية طب قصر العيني"
      },
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setReports(prev => [newReport, ...prev]);
    setSelectedReportId(newReport.id);

    // Matching financial invoice
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
      subtotal: patient.totalCost || 0,
      testsSubtotal: patient.testsSubtotal || patient.totalCost || 0,
      discount: patient.discountApplied || 0,
      visitFee: patient.visitFee || 0,
      isHomeVisit: patient.bookingType === 'home_visit',
      visitAddress: patient.homeAddress,
      netAmount: Math.max(0, (patient.totalCost || 0) - (patient.discountApplied || 0) + (patient.visitFee || 0)),
      paidAmount: Math.max(0, (patient.totalCost || 0) - (patient.discountApplied || 0) + (patient.visitFee || 0)),
      remainingAmount: 0,
      paymentMethod: (patient.paymentMethod as any) || 'cash',
      paymentStatus: 'paid',
      cashierName: currentUser.nameAr,
      branch: patient.branchAddress || 'فرع القصر العيني - الرئيسي',
      syncStatus: 'synced',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setIncomeRecords(prev => [newInvoice, ...prev]);
    newReport.invoiceId = newInvoice.id;

    realtimeSyncManager.broadcastAction('UPDATE_REPORT', newReport);
    realtimeSyncManager.broadcastAction('UPDATE_INVOICE', newInvoice);

    logAction('CREATE', 'DIAGNOSTIC', `تسجيل مريض جديد ${patient.fullName} وحجز تحاليل وربط التقرير بالفاتورة المالية`);
    addNotification({
      title: "تم تسجيل المريض بنجاح",
      message: `تم حجز التحاليل للمريض ${patient.fullName} وإصدار فاتورة وإدراج العينة في قائمة عمل المعمل.`,
      type: "success"
    });

    return newReport;
  }, [currentUser, logAction, addNotification]);

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

  const syncUnifiedDataToGitHub = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    if (!githubConfig.token || !githubConfig.repoOwner || !githubConfig.repoName) {
      return { success: false, message: "بيانات مستودع GitHub غير مكتملة" };
    }

    try {
      const payload = {
        timestamp: new Date().toISOString(),
        reportsCount: reports.length,
        incomeCount: incomeRecords.length,
        loyaltyProfilesCount: loyaltyProfiles.length,
        reports,
        incomeRecords,
        loyaltyProfiles,
        inventory,
        dailyCloseouts,
        auditLogs: auditLogs.slice(0, 50)
      };

      // 1. Instant Push to Firebase Cloud Firestore Master Snapshot
      await realtimeSyncManager.pushMasterSnapshot({
        reports,
        incomeRecords,
        loyaltyProfiles,
        inventory,
        dailyCloseouts,
        labInfo,
        expenses
      });

      const path = 'rt_lab_unified_backup.json';
      const url = `https://api.github.com/repos/${githubConfig.repoOwner}/${githubConfig.repoName}/contents/${path}`;

      let sha: string | undefined;
      const getRes = await fetch(url, {
        headers: {
          'Authorization': `token ${githubConfig.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      if (getRes.ok) {
        const getData = await getRes.json();
        sha = getData.sha;
      }

      const contentBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload, null, 2))));

      const putRes = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${githubConfig.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Auto-sync unified data: ${reports.length} reports, ${incomeRecords.length} invoices [${new Date().toLocaleString('en-US')}]`,
          content: contentBase64,
          branch: githubConfig.branch || 'main',
          sha
        })
      });

      if (putRes.ok) {
        setGithubConfig(prev => ({ ...prev, lastSyncAt: new Date().toLocaleString('en-US'), status: 'connected' }));
        logAction('SYNC', 'SECURITY', 'مزامنة النسخة الاحتياطية الموحدة مع مستودع GitHub بنجاح');
        return { success: true, message: "تمت المزامنة وحفظ البيانات سحابياً بنجاح!" };
      } else {
        const errData = await putRes.json().catch(() => ({}));
        throw new Error(errData.message || 'فشلت المزامنة مع GitHub');
      }
    } catch (err: any) {
      setGithubConfig(prev => ({ ...prev, status: 'error', errorMessage: err.message }));
      return { success: false, message: err.message || 'خطأ أثناء المزامنة' };
    }
  }, [githubConfig, reports, incomeRecords, loyaltyProfiles, inventory, dailyCloseouts, auditLogs, logAction]);

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

    auditLogs,
    logAction,

    notifications,
    markNotificationRead,
    clearNotifications,
    addNotification,

    githubConfig,
    updateGithubConfig,
    syncUnifiedDataToGitHub,

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
