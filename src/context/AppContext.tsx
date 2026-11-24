import { useStampedCollection } from '../hooks/useStampedCollection';
import { cloudVersionChanged } from '../utils/cloudPulse';
import { startRealtimeChannel } from '../utils/realtimeChannel';
import { markDeleted, unmarkDeleted, clearDeletedCollection, importDeletedMap, importSettingsStamps, getDeletedMap, getSettingsStamps, stampSetting, mergeCollection, mergeSettingsObject, recordStamp } from '../utils/cloudStore';
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  LOYALTY_TIER_ORDER,
  hasEarnedForInvoice,
  pointsForAmount,
  calculateTestsOnlyPaidAmount,
  createAutoLoyaltyProfile,
  generateSmartCardNumber,
  computeLoyaltyTier,
  resolveProfileTier,
  normalizePhoneKey,
  normalizeInvoiceRef,
  syncCardNumberTier
} from '../utils/loyaltyEngine';
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
  LoyaltyTransaction,
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
  StaffOptionItem,
  StaffOptionRole
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
import { LAB_CATALOG, DEFAULT_STAFF, INITIAL_STAFF_SIGNATURE_OPTIONS, StaffSignatureOptionsMap } from '../data/labCatalog';
import { INITIAL_PACKAGES } from '../data/packagesData';
import { INITIAL_INDIVIDUAL_TESTS } from '../data/individualTestsData';
import { INITIAL_INSTRUMENTS, SAMPLE_INSTRUMENT_TRANSMISSIONS } from '../data/instrumentsData';
import { realtimeSyncManager } from '../utils/realtimeMultiDeviceSync';
import { pushFullStoreToGitHub, pullFullStoreFromGitHub, syncInvoiceToDiagnostic, fetchDiagnosticCases, convertIncomeRecordToDiagnosticReport } from '../utils/githubSync';
import {
  resolveUniqueLabIdentity,
  dedupeReports,
  dedupeInvoices,
  unionReports,
  unionInvoices,
  mergeReportCollections,
  mergeInvoiceCollections,
  findOrphanPairs,
  namesCompatibleForIdentity
} from '../utils/labNumbering';
import { notifyReportApproved } from '../utils/whatsappNotify';
import { playSyncChime } from '../utils/criticalAlerts';
import {
  registerReportDeletion,
  registerInvoiceDeletion,
  importDeletionTombstones,
  filterDeletedReports,
  filterDeletedInvoices,
  purgeProtectedTombstones,
  isReportDeletedByTombstone,
  isInvoiceDeletedByTombstone
} from '../utils/deletionRegistry';
import {
  safeSetLocalStorage,
  freeRedundantLocalStorage,
  saveIdbSnapshot,
  loadIdbSnapshot,
  isPendingCloudPush,
  setPendingCloudPush
} from '../utils/idbBackup';
import {
  mergeCatalogWithDefaults,
  mergePackagesWithDefaults,
  mergeProfilesWithDefaults,
  upgradeSingleReport,
  runGlobalDataUpgrade,
  MIGRATION_VERSION_KEY
} from '../utils/upgradeSavedData';
import { calculateFlag } from '../utils/calculator';
import { CatalogProfileTemplate } from '../types/lab';

// Storage Keys
const STORAGE_PREFIX = 'rt_lab_unified_';
const REPORTS_KEY = `${STORAGE_PREFIX}reports_v3`;
const INCOME_KEY = `${STORAGE_PREFIX}income_v3`;
const EXPENSES_KEY = `${STORAGE_PREFIX}expenses_v3`;
const LOYALTY_KEY = `${STORAGE_PREFIX}loyalty_v3`;
const INVENTORY_KEY = `${STORAGE_PREFIX}inventory_v3`;
const EMPLOYEES_KEY = `${STORAGE_PREFIX}employees_v3`;
const ATTENDANCE_KEY = `${STORAGE_PREFIX}attendance_v3`;
const PAYROLL_KEY = `${STORAGE_PREFIX}payroll_v3`;
const CUSTOM_NORMALS_KEY = `${STORAGE_PREFIX}custom_normals_v1`;
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
const STAFF_MEMBERS_KEY = `${STORAGE_PREFIX}staff_members_v3`;

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
  canEditCatalog: boolean;

  // Active Navigation Tab & Catalog Sub-View
  activeTab: string;
  setActiveTab: (tab: string) => void;
  catalogViewMode: 'individual' | 'profiles' | 'packages';
  setCatalogViewMode: (mode: 'individual' | 'profiles' | 'packages') => void;

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
  saveParameterNormalPermanently: (param: {
    name: string;
    code?: string;
    unit?: string;
    minNormal?: number;
    maxNormal?: number;
    textReference?: string;
    panicLow?: number;
    panicHigh?: number;
    method?: string;
  }) => void;

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
  recalculateAllLoyaltyPoints: (customConfig?: LoyaltyConfig) => {
    updatedProfilesCount: number;
    newCardsCreatedCount: number;
    totalPointsCalculated: number;
    totalInvoicesProcessed: number;
  };
  addLoyaltyProfile: (profile: PatientLoyaltyProfile) => void;
  getLoyaltyByPhone: (phone: string) => PatientLoyaltyProfile | undefined;
  calculateLoyaltyTier: (points: number) => LoyaltyTier;
  earnLoyaltyPoints: (
    patientPhone: string,
    amount: number,
    invoiceNumber: string,
    patientName: string,
    barcode: string,
    options?: {
      isBooking?: boolean;
      visitFee?: number;
      testsSubtotal?: number;
      netAmount?: number;
      customNote?: string;
    }
  ) => void;
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
  updateStaffMembers: (members: StaffMember[]) => void;
  addStaffMember: (member: StaffMember) => void;
  updateStaffMember: (id: string, updates: Partial<StaffMember>) => void;
  deleteStaffMember: (id: string) => void;
  staffSignatures: LabStaffSignatures;
  updateStaffSignatures: (signatures: LabStaffSignatures) => void;
  staffSignatureOptions: StaffSignatureOptionsMap;
  addStaffSignatureOption: (role: StaffOptionRole, item: { name: string; title: string; license?: string; signatureKey?: string; customRoleLabel?: string }) => void;
  updateStaffSignatureOption: (role: StaffOptionRole, id: string, item: { name: string; title: string; license?: string; signatureKey?: string; customRoleLabel?: string }) => void;
  deleteStaffSignatureOption: (role: StaffOptionRole, id: string) => void;

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
  healAndRestoreCases: () => Promise<{ success: boolean; message: string; count: number }>;

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
  isCloudSyncOpen: boolean;
  setIsCloudSyncOpen: (open: boolean) => void;
  patientSheetReport: LabReport | null;
  openPatientSheet: (report: LabReport) => void;
  closePatientSheet: () => void;
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
    isHomeVisit: Boolean(isHome),
    visitFee: vFee,
    homeAddress: hAddr,
    deliveryNotes: remoteRep.patient?.deliveryNotes || localRep.patient?.deliveryNotes,
    visitSpecialist: remoteRep.patient?.visitSpecialist || localRep.patient?.visitSpecialist,
    branchRepresentative: remoteRep.patient?.branchRepresentative || localRep.patient?.branchRepresentative,
    branchId: remoteRep.patient?.branchId || localRep.patient?.branchId,
    branchName: remoteRep.patient?.branchName || localRep.patient?.branchName,
    phone: remoteRep.patient?.phone || localRep.patient?.phone,
    totalCost: remoteRep.patient?.totalCost ?? localRep.patient?.totalCost,
    paidAmount: remoteRep.patient?.paidAmount ?? localRep.patient?.paidAmount,
    remainingAmount: remoteRep.patient?.remainingAmount ?? localRep.patient?.remainingAmount,
    discountApplied: remoteRep.patient?.discountApplied ?? localRep.patient?.discountApplied,
    paymentStatus: remoteRep.patient?.paymentStatus || localRep.patient?.paymentStatus
  };

  const status = (remoteRep.status === 'verified' || localRep.status === 'verified') ? 'verified' : (remoteRep.status || localRep.status || 'draft');
  const maxTime = Math.max(localTime || 0, remoteTime || 0);

  const newerStaff = localTime > remoteTime ? (localRep.staff || {}) : (remoteRep.staff || {});
  const olderStaff = localTime > remoteTime ? (remoteRep.staff || {}) : (localRep.staff || {});

  return {
    ...localRep,
    ...remoteRep,
    status,
    patient: mergedPatient,
    profiles: chosenProfiles,
    staff: {
      ...olderStaff,
      ...newerStaff
    },
    patientSheetMeta: {
      ...(localRep.patientSheetMeta || {}),
      ...(remoteRep.patientSheetMeta || {})
    },
    updatedAt: maxTime > 0 ? new Date(maxTime).toISOString() : (remoteRep.updatedAt || localRep.updatedAt || remoteRep.createdAt || localRep.createdAt || '')
  };
}

export function mergeTwoInvoices(localInv: IncomeRecord, remoteInv: IncomeRecord): IncomeRecord {
  const localTime = new Date(localInv.updatedAt || localInv.createdAt || 0).getTime();
  const remoteTime = new Date(remoteInv.updatedAt || remoteInv.createdAt || 0).getTime();

  const isHome = remoteInv.isHomeVisit ?? localInv.isHomeVisit ?? (remoteInv.bookingType === 'home_visit' || localInv.bookingType === 'home_visit');
  const bType = remoteInv.bookingType || localInv.bookingType || (isHome ? 'home_visit' : 'branch');
  const vFee = remoteInv.visitFee ?? localInv.visitFee ?? 0;
  const vAddr = remoteInv.visitAddress || localInv.visitAddress;
  const maxTime = Math.max(localTime || 0, remoteTime || 0);

  return {
    ...localInv,
    ...remoteInv,
    isHomeVisit: Boolean(isHome),
    bookingType: bType,
    visitFee: vFee,
    visitAddress: vAddr,
    deliveryNotes: (remoteInv as any).deliveryNotes || (localInv as any).deliveryNotes,
    visitSpecialist: remoteInv.visitSpecialist || localInv.visitSpecialist,
    branchRepresentative: remoteInv.branchRepresentative || localInv.branchRepresentative,
    branchId: remoteInv.branchId || localInv.branchId,
    branch: remoteInv.branch || localInv.branch,
    patientPhone: remoteInv.patientPhone || localInv.patientPhone,
    tests: (remoteInv.tests && remoteInv.tests.length > 0) ? remoteInv.tests : localInv.tests,
    testsSubtotal: remoteInv.testsSubtotal ?? localInv.testsSubtotal,
    discount: remoteInv.discount ?? localInv.discount,
    subtotal: remoteInv.subtotal ?? localInv.subtotal,
    netAmount: remoteInv.netAmount ?? localInv.netAmount,
    paidAmount: remoteInv.paidAmount ?? localInv.paidAmount,
    remainingAmount: remoteInv.remainingAmount ?? localInv.remainingAmount,
    paymentStatus: (remoteInv.paymentStatus === 'paid' || localInv.paymentStatus === 'paid') ? 'paid' : (remoteInv.paymentStatus || localInv.paymentStatus),
    updatedAt: maxTime > 0 ? new Date(maxTime).toISOString() : (remoteInv.updatedAt || localInv.updatedAt || remoteInv.createdAt || localInv.createdAt || '')
  };
}

function buildInvoiceFromOrphanReport(rep: LabReport): IncomeRecord {
  const nowIso = rep.createdAt || new Date().toISOString();
  const pat = rep.patient || ({} as Patient);
  const labNum = rep.reportNumber || pat.labNumber || '';
  const invId = rep.invoiceId || (rep.id.startsWith('rep-') ? rep.id.replace(/^rep-/, '') : `inv-${rep.id}`);
  const invNum = (pat as any).invoiceNumber || (labNum ? `INV-${String(labNum).replace(/^RT-/i, '')}` : `INV-${Date.now().toString().slice(-6)}`);
  const visitFee = Number(pat.visitFee || 0);
  const discount = Number(pat.discountApplied || 0);
  const repAny = rep as any;
  const rawNet = Number(pat.totalCost ?? repAny.totalCost ?? 0);
  const testsSubtotal = Number(pat.testsSubtotal ?? Math.max(0, rawNet - visitFee + discount));
  const subtotal = testsSubtotal + visitFee;
  const netAmount = rawNet > 0 ? rawNet : Math.max(0, subtotal - discount);
  const paidAmount = Number(pat.paidAmount ?? (pat.paymentStatus === 'paid' || repAny.paymentStatus === 'paid' ? netAmount : 0));
  const remainingAmount = Number(pat.remainingAmount ?? Math.max(0, netAmount - paidAmount));
  const paymentStatus: IncomeRecord['paymentStatus'] =
    (pat.paymentStatus as any) ||
    (repAny.paymentStatus as any) ||
    (paidAmount >= netAmount && netAmount > 0 ? 'paid' : (paidAmount > 0 ? 'partial' : 'pending'));

  const derivedTests: InvoiceTestItem[] = (rep.profiles || []).map((prof, idx) => ({
    id: `tst-rec-${idx}-${rep.id}`,
    code: prof.profileCode || `TST-${idx + 1}`,
    nameAr: prof.titleAr || prof.titleEn || 'تحاليل مخبرية',
    nameEn: prof.titleEn || prof.titleAr || 'Lab Test',
    category: prof.category || 'Clinical',
    price: idx === 0 ? testsSubtotal : 0,
    cost: 0
  }));

  return {
    id: invId,
    invoiceNumber: invNum,
    patientName: pat.fullName || 'مريض مسجل',
    patientPhone: pat.phone || '',
    patientAge: pat.age || 30,
    patientGender: pat.gender || 'female',
    barcode: pat.barcode || '',
    labNumber: labNum,
    referringDoctor: pat.referringDoctorName || 'كشف معمل',
    tests: derivedTests.length > 0 ? derivedTests : [{
      id: `tst-rec-${rep.id}`,
      code: 'GENERAL',
      nameAr: 'تحاليل مخبرية',
      nameEn: 'Lab Tests',
      category: 'Clinical',
      price: netAmount,
      cost: 0
    }],
    subtotal,
    testsSubtotal,
    discount,
    visitFee,
    isHomeVisit: Boolean(pat.isHomeVisit || pat.bookingType === 'home_visit'),
    bookingType: pat.bookingType || (pat.isHomeVisit ? 'home_visit' : 'branch'),
    visitAddress: pat.homeAddress || '',
    visitSpecialist: pat.visitSpecialist || '',
    branchRepresentative: pat.branchRepresentative || '',
    branchId: pat.branchId || 'branch-behteem',
    netAmount,
    paidAmount,
    remainingAmount,
    paymentMethod: (pat.paymentMethod as any) || 'cash',
    paymentStatus,
    cashierName: 'استرجاع تلقائي',
    branch: pat.branchName || 'الفرع الرئيسي - بهتيم',
    syncStatus: 'synced',
    createdAt: nowIso,
    updatedAt: rep.updatedAt || nowIso
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Language & Current User
  const [language, setLanguage] = useState<Language>('ar');
  const [users] = useState<UserProfile[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<UserProfile>(INITIAL_USERS[0]);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // 2. Active Tab & Catalog Sub-View (Synced with URL Hash & Query Params for direct links)
  const resolveInitialRoute = (): { tab: string; view: 'individual' | 'profiles' | 'packages' } => {
    if (typeof window === 'undefined') return { tab: 'dashboard', view: 'individual' };
    try {
      const hash = (window.location.hash || '').replace(/^#\/?/, '').toLowerCase();
      const params = new URLSearchParams(window.location.search || '');
      const paramTab = (params.get('tab') || '').toLowerCase();
      const paramView = (params.get('view') || '').toLowerCase();

      if (hash === 'packages' || hash === 'catalog/packages' || paramTab === 'packages' || paramView === 'packages') {
        return { tab: 'catalog', view: 'packages' };
      }
      if (hash === 'profiles' || hash === 'catalog/profiles' || paramTab === 'profiles' || paramView === 'profiles') {
        return { tab: 'catalog', view: 'profiles' };
      }
      if (hash === 'catalog' || hash === 'catalog/individual' || paramTab === 'catalog') {
        return { tab: 'catalog', view: 'individual' };
      }
      const validTabs = ['dashboard', 'admission', 'worklist', 'diagnostic_editor', 'reports_archive', 'financial_income', 'expenses_profit', 'management_reports', 'loyalty', 'lab_to_lab', 'inventory', 'hr', 'catalog', 'audit_settings'];
      if (hash && validTabs.includes(hash)) {
        return { tab: hash, view: 'individual' };
      }
      if (paramTab && validTabs.includes(paramTab)) {
        return { tab: paramTab, view: 'individual' };
      }
    } catch {}
    return { tab: 'dashboard', view: 'individual' };
  };

  const initialRoute = resolveInitialRoute();
  const [activeTab, setActiveTabState] = useState<string>(initialRoute.tab);
  const [catalogViewMode, setCatalogViewModeState] = useState<'individual' | 'profiles' | 'packages'>(initialRoute.view);

  const setActiveTab = useCallback((tab: string) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      try {
        const nextHash = tab === 'catalog' ? `#catalog/${catalogViewMode}` : `#${tab}`;
        if (window.location.hash !== nextHash) {
          window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${nextHash}`);
        }
      } catch {}
    }
  }, [catalogViewMode]);

  const setCatalogViewMode = useCallback((mode: 'individual' | 'profiles' | 'packages') => {
    setCatalogViewModeState(mode);
    if (typeof window !== 'undefined') {
      try {
        const nextHash = `#catalog/${mode}`;
        if (window.location.hash !== nextHash) {
          window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${nextHash}`);
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleHashChange = () => {
      const next = resolveInitialRoute();
      setActiveTabState(next.tab);
      if (next.tab === 'catalog') {
        setCatalogViewModeState(next.view);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // 3. Quick Action Modals
  const [isPatientFormOpen, setIsPatientFormOpen] = useState(false);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [isLabInfoModalOpen, setIsLabInfoModalOpen] = useState(false);
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<IncomeRecord | null>(null);
  const [patientSheetState, setPatientSheetState] = useState<LabReport | null>(null);

  // 4. Reports (Unified Diagnostic Worklist)
  const [reports, setReports] = useStampedCollection<LabReport>(() => {
    try {
      const saved = localStorage.getItem(REPORTS_KEY) || localStorage.getItem('rt_lab_reports_v2');
      const needsUpgrade = localStorage.getItem(MIGRATION_VERSION_KEY) !== 'true';
      let loaded: LabReport[];
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          loaded = unionReports(parsed, INITIAL_REPORTS);
        } else {
          loaded = INITIAL_REPORTS;
        }
      } else {
        loaded = INITIAL_REPORTS;
      }
      return needsUpgrade ? loaded.map(upgradeSingleReport) : loaded;
    } catch {
      return INITIAL_REPORTS.map(upgradeSingleReport);
    }
  });

  const [selectedReportId, setSelectedReportId] = useState<string | null>(() => {
    return reports[0]?.id || null;
  });

  // 5. Income & Invoices (Financial Records)
  const [incomeRecords, setIncomeRecords] = useStampedCollection<IncomeRecord>(() => {
    try {
      const saved = localStorage.getItem(INCOME_KEY) || localStorage.getItem('rt_lab_income_records_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return unionInvoices(parsed, INITIAL_INCOME_RECORDS);
        }
      }
      return INITIAL_INCOME_RECORDS;
    } catch {
      return INITIAL_INCOME_RECORDS;
    }
  });

  // 6. Test Catalog (Auto-merged to guarantee all 142 individual tests)
  const [testCatalog, setTestCatalog] = useStampedCollection<InvoiceTestItem>(() => {
    try {
      const saved = localStorage.getItem(CATALOG_KEY) || localStorage.getItem('rt_lab_individual_tests_v2');
      const parsed = saved ? JSON.parse(saved) : null;
      return mergeCatalogWithDefaults(Array.isArray(parsed) && parsed.length > 0 ? parsed : undefined);
    } catch {
      return mergeCatalogWithDefaults();
    }
  });

  // 6b. Comprehensive Packages (Auto-merged to guarantee 15 packages)
  const [packages, setPackages] = useStampedCollection<ComprehensivePackage>(() => {
    try {
      const saved = localStorage.getItem(PACKAGES_KEY);
      const parsed = saved ? JSON.parse(saved) : null;
      return mergePackagesWithDefaults(Array.isArray(parsed) && parsed.length > 0 ? parsed : undefined);
    } catch {
      return mergePackagesWithDefaults();
    }
  });

  // 6c. Diagnostic Profile Templates (Auto-merged to guarantee 24 comprehensive profiles)
  const [diagnosticProfiles, setDiagnosticProfiles] = useStampedCollection<CatalogProfileTemplate>(() => {
    try {
      const saved = localStorage.getItem(DIAGNOSTIC_PROFILES_KEY) || localStorage.getItem('rt_lab_custom_catalog_v3') || localStorage.getItem('rt_lab_catalog_v2');
      const parsed = saved ? JSON.parse(saved) : null;
      return mergeProfilesWithDefaults(Array.isArray(parsed) && parsed.length > 0 ? parsed : undefined);
    } catch {
      return mergeProfilesWithDefaults();
    }
  });

  // 7. Loyalty Profiles
  const [loyaltyProfiles, setLoyaltyProfiles] = useStampedCollection<PatientLoyaltyProfile>(() => {
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

  const [loyaltyConfig, setLoyaltyConfig] = useState<LoyaltyConfig>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}loyalty_config`) || localStorage.getItem('rt_lab_loyalty_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            ...DEFAULT_LOYALTY_CONFIG,
            ...parsed,
            tiers: {
              ...DEFAULT_LOYALTY_CONFIG.tiers,
              ...(parsed.tiers || {})
            }
          };
        }
      }
    } catch (e) {
      console.warn('Error loading loyalty config:', e);
    }
    return DEFAULT_LOYALTY_CONFIG;
  });

  // 8. Expenses & Profit Config & Closeouts
  const [expenses, setExpenses] = useStampedCollection<ExpenseRecord>(() => {
    try {
      const saved = localStorage.getItem(EXPENSES_KEY) || localStorage.getItem('rt_lab_expense_records_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [profitConfig, setProfitConfig] = useState<ProfitShareConfig>(INITIAL_PROFIT_CONFIG);
  const [dailyCloseouts, setDailyCloseouts] = useStampedCollection<DailyCloseout>(() => {
    try {
      const saved = localStorage.getItem(CLOSEOUTS_KEY) || localStorage.getItem('rt_lab_daily_closeouts_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 9. Inventory & Reagents
  const [inventory, setInventory] = useStampedCollection<InventoryItem>(() => {
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
  const [instruments, setInstruments] = useStampedCollection<LabInstrument>(() => {
    try {
      const saved = localStorage.getItem(INSTRUMENTS_KEY);
      return saved ? JSON.parse(saved) : INITIAL_INSTRUMENTS;
    } catch {
      return INITIAL_INSTRUMENTS;
    }
  });

  const [transmissions, setTransmissions] = useStampedCollection<InstrumentTransmission>(() => {
    try {
      const saved = localStorage.getItem(TRANSMISSIONS_KEY);
      return saved ? JSON.parse(saved) : SAMPLE_INSTRUMENT_TRANSMISSIONS;
    } catch {
      return SAMPLE_INSTRUMENT_TRANSMISSIONS;
    }
  });

  // 11. Lab to Lab
  const [labToLabOrders, setLabToLabOrders] = useStampedCollection<LabToLabOrder>(() => {
    try {
      const saved = localStorage.getItem(LAB_TO_LAB_KEY) || localStorage.getItem('rt_lab_lab_to_lab_orders_v1');
      return saved ? JSON.parse(saved) : INITIAL_LAB_TO_LAB;
    } catch {
      return INITIAL_LAB_TO_LAB;
    }
  });

  // 12. HR Employees, Attendance, Payroll
  const [employees, setEmployees] = useStampedCollection<Employee>(() => {
    try {
      const saved = localStorage.getItem(EMPLOYEES_KEY) || localStorage.getItem('rt_lab_employees_v1');
      return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
    } catch {
      return INITIAL_EMPLOYEES;
    }
  });
  const [attendance, setAttendance] = useStampedCollection<AttendanceRecord>(() => {
    try {
      const saved = localStorage.getItem(ATTENDANCE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE;
    } catch {
      return INITIAL_ATTENDANCE;
    }
  });
  const [payroll, setPayroll] = useStampedCollection<PayrollRecord>(() => {
    try {
      const saved = localStorage.getItem(PAYROLL_KEY);
      return saved ? JSON.parse(saved) : INITIAL_PAYROLL;
    } catch {
      return INITIAL_PAYROLL;
    }
  });

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
  const [staffMembers, setStaffMembers] = useStampedCollection<StaffMember>(() => {
    try {
      const saved = localStorage.getItem(STAFF_MEMBERS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return INITIAL_STAFF_MEMBERS;
    } catch {
      return INITIAL_STAFF_MEMBERS;
    }
  });

  // 13b. Staff Signatures and Options
  const [staffSignatures, setStaffSignatures] = useState<LabStaffSignatures>(() => {
    try {
      const saved =
        localStorage.getItem(STAFF_SIGNATURES_KEY) ||
        localStorage.getItem('rt_lab_staff_v3') ||
        localStorage.getItem('rt_lab_staff_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_STAFF, ...parsed };
      }
      return DEFAULT_STAFF;
    } catch {
      return DEFAULT_STAFF;
    }
  });

  const [staffSignatureOptions, setStaffSignatureOptions] = useState<StaffSignatureOptionsMap>(() => {
    try {
      const saved = localStorage.getItem(STAFF_OPTIONS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.chemists && parsed.verifiers && parsed.consultants) {
          return {
            chemists: parsed.chemists,
            verifiers: parsed.verifiers,
            consultants: parsed.consultants,
            phlebotomists: Array.isArray(parsed.phlebotomists) ? parsed.phlebotomists : (INITIAL_STAFF_SIGNATURE_OPTIONS.phlebotomists || []),
            visitCoordinators: Array.isArray(parsed.visitCoordinators) ? parsed.visitCoordinators : (INITIAL_STAFF_SIGNATURE_OPTIONS.visitCoordinators || []),
            customWorkers: Array.isArray(parsed.customWorkers) ? parsed.customWorkers : []
          };
        }
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

  // Always keep a mutable ref to the latest collections so async/timeout pushes never overwrite with stale React closures
  const latestStateRef = useRef({
    reports,
    incomeRecords,
    expenses,
    profitConfig,
    loyaltyProfiles,
    loyaltyConfig,
    inventory,
    instruments,
    transmissions,
    labToLabOrders,
    employees,
    attendance,
    payroll,
    dailyCloseouts,
    labInfo,
    staffMembers,
    staffSignatures,
    staffSignatureOptions,
    testCatalog,
    packages,
    diagnosticProfiles,
    auditLogs
  });

  latestStateRef.current = {
    reports,
    incomeRecords,
    expenses,
    profitConfig,
    loyaltyProfiles,
    loyaltyConfig,
    inventory,
    instruments,
    transmissions,
    labToLabOrders,
    employees,
    attendance,
    payroll,
    dailyCloseouts,
    labInfo,
    staffMembers,
    staffSignatures,
    staffSignatureOptions,
    testCatalog,
    packages,
    diagnosticProfiles,
    auditLogs
  };

  const buildFullSyncSnapshot = useCallback((overrides?: Partial<typeof latestStateRef.current>) => {
    const s = { ...latestStateRef.current, ...(overrides || {}) };
    return {
      reports: s.reports,
      incomeRecords: s.incomeRecords,
      expenses: s.expenses,
      profitConfig: s.profitConfig,
      loyaltyProfiles: s.loyaltyProfiles,
      loyaltyConfig: s.loyaltyConfig,
      inventory: s.inventory,
      instruments: s.instruments,
      transmissions: s.transmissions,
      labToLabOrders: s.labToLabOrders,
      employees: s.employees,
      attendance: s.attendance,
      payroll: s.payroll,
      dailyCloseouts: s.dailyCloseouts,
      labInfo: s.labInfo,
      staffMembers: s.staffMembers,
      staffSignatures: s.staffSignatures,
      staffSignatureOptions: s.staffSignatureOptions,
      testCatalog: s.testCatalog,
      packages: s.packages,
      diagnosticProfiles: s.diagnosticProfiles,
      auditLogs: (s.auditLogs || []).slice(0, 500),
      deletedMap: getDeletedMap(),
      settingsStamps: getSettingsStamps()
    };
  }, []);

  // Automatic Debounced Cloud Push: Pushes to GitHub cloud whenever reports or invoices change
  const cloudPushTimeoutRef = useRef<any>(null);

  const triggerAutoCloudPush = useCallback((customReports?: LabReport[], customInvoices?: IncomeRecord[]) => {
    if (!githubConfig.token || !githubConfig.autoSync) return;
    if (cloudPushTimeoutRef.current) {
      clearTimeout(cloudPushTimeoutRef.current);
    }

    setPendingCloudPush(true);
    cloudPushTimeoutRef.current = setTimeout(async () => {
      try {
        const snapshot = buildFullSyncSnapshot({
          ...(customReports ? { reports: customReports } : {}),
          ...(customInvoices ? { incomeRecords: customInvoices } : {})
        });
        const res = await pushFullStoreToGitHub(githubConfig, snapshot);
        if (res.success) {
          setPendingCloudPush(false);
        } else {
          setPendingCloudPush(true);
        }
      } catch (err) {
        console.warn('Auto cloud push error:', err);
        setPendingCloudPush(true);
      }
    }, 1200);
  }, [githubConfig, buildFullSyncSnapshot]);

  // ── تطبيق النسخة السحابية على كل حقول البرنامج بدمج دقيق ──
  const applyCloudCollections = useCallback((data: Record<string, any>) => {
    if (!data || typeof data !== 'object') return;
    importDeletedMap(data.deletedMap);
    importSettingsStamps(data.settingsStamps);
    const applyList = (key: string, setter: any) => {
      const cloud = (data as any)[key];
      if (!Array.isArray(cloud)) return;
      setter((prev: any[]) => {
        const merged = mergeCollection(key, Array.isArray(prev) ? prev : [], cloud);
        return merged === prev ? prev : merged;
      });
    };
    applyList('reports', setReports);
    applyList('incomeRecords', setIncomeRecords);
    applyList('expenses', setExpenses);
    applyList('inventory', setInventory);
    applyList('instruments', setInstruments);
    applyList('transmissions', setTransmissions);
    applyList('labToLabOrders', setLabToLabOrders);
    applyList('employees', setEmployees);
    applyList('attendance', setAttendance);
    applyList('payroll', setPayroll);
    applyList('dailyCloseouts', setDailyCloseouts);
    applyList('loyaltyProfiles', setLoyaltyProfiles);
    applyList('testCatalog', setTestCatalog);
    applyList('packages', setPackages);
    applyList('diagnosticProfiles', setDiagnosticProfiles);
    applyList('staffMembers', setStaffMembers);
    applyList('auditLogs', setAuditLogs);
    setProfitConfig((prev: any) => mergeSettingsObject('profitConfig', prev, data.profitConfig, data.settingsStamps));
    setLoyaltyConfig((prev: any) => mergeSettingsObject('loyaltyConfig', prev, data.loyaltyConfig, data.settingsStamps));
    setLabInfo((prev: any) => mergeSettingsObject('labInfo', prev, data.labInfo, data.settingsStamps));
    setStaffSignatures((prev: any) => mergeSettingsObject('staffSignatures', prev, data.staffSignatures, data.settingsStamps));
    setStaffSignatureOptions((prev: any) => mergeSettingsObject('staffSignatureOptions', prev, data.staffSignatureOptions, data.settingsStamps));
  }, []);

  // ── رفع تلقائي عند تغيّر أي مجموعة بيانات (لا التقارير والفواتير فقط) ──
  const lastCollectionSignatureRef = useRef('');
  useEffect(() => {
    if (!githubConfig.token || !githubConfig.autoSync) return;
    const signature = JSON.stringify([
      expenses, profitConfig, inventory, instruments, transmissions, labToLabOrders,
      employees, attendance, payroll, dailyCloseouts, loyaltyProfiles, loyaltyConfig,
      testCatalog, packages, diagnosticProfiles, labInfo, staffMembers, staffSignatures, staffSignatureOptions
    ]);
    if (signature === lastCollectionSignatureRef.current) return;
    const isFirstRun = lastCollectionSignatureRef.current === '';
    lastCollectionSignatureRef.current = signature;
    if (isFirstRun) return;
    triggerAutoCloudPush();
  }, [githubConfig, expenses, profitConfig, inventory, instruments, transmissions, labToLabOrders, employees, attendance, payroll, dailyCloseouts, loyaltyProfiles, loyaltyConfig, testCatalog, packages, diagnosticProfiles, labInfo, staffMembers, staffSignatures, staffSignatureOptions, triggerAutoCloudPush]);

  // ── طبع وقت آخر تعديل للإعدادات المفردة لمعرفة الأحدث بين الأجهزة ──
  const settingsSnapshotRef = useRef<Record<string, string>>({});
  useEffect(() => {
    const current: Record<string, string> = {
      labInfo: JSON.stringify(labInfo),
      staffSignatures: JSON.stringify(staffSignatures),
      staffSignatureOptions: JSON.stringify(staffSignatureOptions),
      profitConfig: JSON.stringify(profitConfig),
      loyaltyConfig: JSON.stringify(loyaltyConfig)
    };
    const previous = settingsSnapshotRef.current;
    const isFirstRun = Object.keys(previous).length === 0;
    Object.keys(current).forEach(key => {
      if (!isFirstRun && previous[key] !== undefined && previous[key] !== current[key]) stampSetting(key);
    });
    settingsSnapshotRef.current = current;
  }, [labInfo, staffSignatures, staffSignatureOptions, profitConfig, loyaltyConfig]);

  // Collapse any case or invoice that multi-device sync delivered twice (same barcode /
  // lab number and patient) instead of letting duplicates pile up.
  useEffect(() => {
    setReports(prev => dedupeReports(prev));
  }, [reports]);

  useEffect(() => {
    setIncomeRecords(prev => dedupeInvoices(prev));
  }, [incomeRecords]);

  // Persistence Effects (Canonical quota-safe localStorage + IndexedDB mirror)
  const syncIdbSnapshot = useCallback(() => {
    const s = latestStateRef.current;
    void saveIdbSnapshot({
      reports: s.reports,
      incomeRecords: s.incomeRecords,
      packages: s.packages,
      diagnosticProfiles: s.diagnosticProfiles,
      testCatalog: s.testCatalog,
      staffSignatures: s.staffSignatures,
      staffSignatureOptions: s.staffSignatureOptions,
      staffMembers: s.staffMembers,
      updatedAt: new Date().toISOString()
    });
  }, []);

  useEffect(() => {
    safeSetLocalStorage(REPORTS_KEY, JSON.stringify(reports));
    syncIdbSnapshot();
  }, [reports, syncIdbSnapshot]);

  useEffect(() => {
    safeSetLocalStorage(INCOME_KEY, JSON.stringify(incomeRecords));
    syncIdbSnapshot();
  }, [incomeRecords, syncIdbSnapshot]);

  useEffect(() => { safeSetLocalStorage(LOYALTY_KEY, JSON.stringify(loyaltyProfiles)); }, [loyaltyProfiles]);
  useEffect(() => {
    safeSetLocalStorage(`${STORAGE_PREFIX}loyalty_config`, JSON.stringify(loyaltyConfig));
    safeSetLocalStorage('rt_lab_loyalty_settings', JSON.stringify(loyaltyConfig));
  }, [loyaltyConfig]);
  useEffect(() => { safeSetLocalStorage(EXPENSES_KEY, JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { safeSetLocalStorage(INVENTORY_KEY, JSON.stringify(inventory)); }, [inventory]);
  useEffect(() => { safeSetLocalStorage(INSTRUMENTS_KEY, JSON.stringify(instruments)); }, [instruments]);
  useEffect(() => { safeSetLocalStorage(TRANSMISSIONS_KEY, JSON.stringify(transmissions)); }, [transmissions]);
  useEffect(() => { safeSetLocalStorage(AUDIT_KEY, JSON.stringify(auditLogs)); }, [auditLogs]);
  useEffect(() => { safeSetLocalStorage(LAB_INFO_KEY, JSON.stringify(labInfo)); }, [labInfo]);
  useEffect(() => { safeSetLocalStorage(CATALOG_KEY, JSON.stringify(testCatalog)); syncIdbSnapshot(); }, [testCatalog, syncIdbSnapshot]);
  useEffect(() => { safeSetLocalStorage(PACKAGES_KEY, JSON.stringify(packages)); syncIdbSnapshot(); }, [packages, syncIdbSnapshot]);
  useEffect(() => { safeSetLocalStorage(DIAGNOSTIC_PROFILES_KEY, JSON.stringify(diagnosticProfiles)); syncIdbSnapshot(); }, [diagnosticProfiles, syncIdbSnapshot]);
  useEffect(() => { safeSetLocalStorage(STAFF_MEMBERS_KEY, JSON.stringify(staffMembers)); syncIdbSnapshot(); }, [staffMembers, syncIdbSnapshot]);
  useEffect(() => { safeSetLocalStorage(STAFF_SIGNATURES_KEY, JSON.stringify(staffSignatures)); syncIdbSnapshot(); }, [staffSignatures, syncIdbSnapshot]);
  useEffect(() => { safeSetLocalStorage(STAFF_OPTIONS_KEY, JSON.stringify(staffSignatureOptions)); syncIdbSnapshot(); }, [staffSignatureOptions, syncIdbSnapshot]);
  useEffect(() => { safeSetLocalStorage(EMPLOYEES_KEY, JSON.stringify(employees)); }, [employees]);
  useEffect(() => { safeSetLocalStorage(ATTENDANCE_KEY, JSON.stringify(attendance)); }, [attendance]);
  useEffect(() => { safeSetLocalStorage(PAYROLL_KEY, JSON.stringify(payroll)); }, [payroll]);
  useEffect(() => { safeSetLocalStorage(LAB_TO_LAB_KEY, JSON.stringify(labToLabOrders)); }, [labToLabOrders]);
  useEffect(() => { safeSetLocalStorage(CLOSEOUTS_KEY, JSON.stringify(dailyCloseouts)); }, [dailyCloseouts]);

  // Automatic Migration Run + IndexedDB & Local Pending Queue Recovery on Mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        if (localStorage.getItem(MIGRATION_VERSION_KEY) !== 'true') {
          runGlobalDataUpgrade();
          setReports(prev => prev.map(upgradeSingleReport));
          setDiagnosticProfiles(prev => mergeProfilesWithDefaults(prev));
        } else {
          freeRedundantLocalStorage();
        }
      }
    } catch (err) {
      console.warn('Migration run error:', err);
    }

    // Recover any unsynced cases / catalog edits / staff persisted in IndexedDB or local cases queue
    (async () => {
      try {
        const idbData = await loadIdbSnapshot();
        let recoveredCount = 0;

        if (idbData) {
          if (Array.isArray(idbData.reports) && idbData.reports.length > 0) {
            const upgradedIdbReports = idbData.reports.map(upgradeSingleReport);
            setReports(prev => {
              const { merged, newlyAdded, changed } = mergeReportCollections(prev, filterDeletedReports(upgradedIdbReports), mergeTwoReports);
              if (newlyAdded.length > 0) recoveredCount += newlyAdded.length;
              return changed ? filterDeletedReports(merged) : prev;
            });
          }
          if (Array.isArray(idbData.incomeRecords) && idbData.incomeRecords.length > 0) {
            setIncomeRecords(prev => {
              const { merged, changed } = mergeInvoiceCollections(prev, filterDeletedInvoices(idbData.incomeRecords), mergeTwoInvoices);
              return changed ? filterDeletedInvoices(merged) : prev;
            });
          }
          if (Array.isArray(idbData.packages) && idbData.packages.length > 0) {
            setPackages(prev => mergeCollection('packages', prev, idbData.packages!));
          }
          if (Array.isArray(idbData.diagnosticProfiles) && idbData.diagnosticProfiles.length > 0) {
            setDiagnosticProfiles(prev => mergeProfilesWithDefaults(idbData.diagnosticProfiles, prev));
          }
          if (Array.isArray(idbData.testCatalog) && idbData.testCatalog.length > 0) {
            setTestCatalog(prev => mergeCollection('testCatalog', prev, idbData.testCatalog!));
          }
          if (Array.isArray(idbData.staffMembers) && idbData.staffMembers.length > 0) {
            setStaffMembers(prev => mergeCollection('staffMembers', prev, idbData.staffMembers!));
          }
          if (idbData.staffSignatures && typeof idbData.staffSignatures === 'object') {
            setStaffSignatures(prev => mergeSettingsObject(
              'staffSignatures',
              prev,
              idbData.staffSignatures,
              idbData.updatedAt ? { staffSignatures: idbData.updatedAt } : {}
            ));
          }
          if (idbData.staffSignatureOptions && typeof idbData.staffSignatureOptions === 'object') {
            setStaffSignatureOptions(prev => mergeSettingsObject(
              'staffSignatureOptions',
              prev,
              idbData.staffSignatureOptions,
              idbData.updatedAt ? { staffSignatureOptions: idbData.updatedAt } : {}
            ));
          }
        }

        const localQueueStr = localStorage.getItem('rt_lab_cases_sync_v1');
        if (localQueueStr) {
          const queue = JSON.parse(localQueueStr);
          if (Array.isArray(queue) && queue.length > 0) {
            const queueReports: LabReport[] = [];
            const queueInvoices: IncomeRecord[] = [];
            queue.forEach((c: any) => {
              if (!c || (!c.fullName && !c.patientName)) return;
              const invObj: IncomeRecord = {
                id: String(c.id || `inv-q-${Date.now()}`).replace(/^diag-/, ''),
                invoiceNumber: c.invoiceNumber || `INV-${String(c.labNumber || '').replace('RT-', '')}`,
                patientName: c.fullName || c.patientName,
                patientPhone: c.phone || '',
                patientAge: c.age || 30,
                patientGender: (c.gender as any) || 'female',
                barcode: c.barcode || '',
                labNumber: c.labNumber || '',
                referringDoctor: c.referringDoctorName || 'كشف معمل',
                tests: Array.isArray(c.tests) && c.tests.length > 0 ? c.tests : (c.testNames || ['تحاليل مخبرية']).map((tn: string, idx: number) => ({
                  id: `tst-q-${idx}`,
                  code: `TST-${idx}`,
                  nameAr: tn,
                  nameEn: tn,
                  category: 'Clinical',
                  price: c.totalCost || 0,
                  cost: 0
                })),
                subtotal: c.totalCost || 0,
                testsSubtotal: c.testsSubtotal || c.totalCost || 0,
                discount: c.discount || 0,
                visitFee: c.visitFee || 0,
                isHomeVisit: Boolean(c.isHomeVisit),
                bookingType: c.bookingType || (c.isHomeVisit ? 'home_visit' : 'branch'),
                visitAddress: c.visitAddress || '',
                netAmount: c.totalCost || 0,
                paidAmount: c.paidAmount ?? (c.totalCost || 0),
                remainingAmount: Math.max(0, (c.totalCost || 0) - (c.paidAmount ?? (c.totalCost || 0))),
                paymentMethod: (c.paymentMethod as any) || 'cash',
                paymentStatus: (c.paymentStatus as any) || 'paid',
                cashierName: 'استرجاع محلي',
                branch: 'الفرع الرئيسي - بهتيم',
                syncStatus: 'pending',
                createdAt: c.sampleDate || new Date().toISOString(),
                updatedAt: c.sampleDate || new Date().toISOString()
              };
              if (!isInvoiceDeletedByTombstone(invObj)) queueInvoices.push(invObj);
              const repObj = convertIncomeRecordToDiagnosticReport(invObj) as unknown as LabReport;
              if (!isReportDeletedByTombstone(repObj)) queueReports.push(repObj);
            });

            if (queueReports.length > 0) {
              setReports(prev => {
                const { merged, newlyAdded, changed } = mergeReportCollections(prev, queueReports, mergeTwoReports);
                if (newlyAdded.length > 0) recoveredCount += newlyAdded.length;
                return changed ? filterDeletedReports(merged) : prev;
              });
            }
            if (queueInvoices.length > 0) {
              setIncomeRecords(prev => {
                const { merged, changed } = mergeInvoiceCollections(prev, queueInvoices, mergeTwoInvoices);
                return changed ? filterDeletedInvoices(merged) : prev;
              });
            }
          }
        }

        if (recoveredCount > 0) {
          setPendingCloudPush(true);
        }
      } catch (err) {
        console.warn('Mount IDB/queue recovery note:', err);
      }
    })();
  }, []);

  // Notifications helper (declared before sync effects that depend on it)
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

  // Register Master Snapshot Provider for instant multi-device bootstrapping
  useEffect(() => {
    realtimeSyncManager.setMasterSnapshotProvider(() => ({
      reports,
      incomeRecords,
      expenses,
      loyaltyProfiles,
      loyaltyConfig,
      labInfo,
      packages,
      diagnosticProfiles,
      testCatalog,
      inventory,
      staffSignatures,
      staffSignatureOptions,
      facilities,
      staffMembers,
    }));
  }, [reports, incomeRecords, expenses, loyaltyProfiles, loyaltyConfig, labInfo, packages, diagnosticProfiles, testCatalog, inventory, staffSignatures, staffSignatureOptions, facilities, staffMembers]);

  // Real-Time Multi-Device Cloud Synchronization (Supabase Realtime WebSockets + GitHub Cloud Backup)
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
      } else if (msg.action === 'UPDATE_STAFF' && msg.payload) {
        stampSetting('staffSignatures');
        setStaffSignatures(msg.payload);
        safeSetLocalStorage(STAFF_SIGNATURES_KEY, JSON.stringify(msg.payload));
        latestStateRef.current.staffSignatures = msg.payload;
      } else if (msg.action === 'UPDATE_STAFF_OPTIONS' && msg.payload) {
        stampSetting('staffSignatureOptions');
        setStaffSignatureOptions(prev => mergeSettingsObject('staffSignatureOptions', prev, msg.payload));
      } else if (msg.action === 'UPDATE_LOYALTY_CONFIG' && msg.payload) {
        stampSetting('loyaltyConfig');
        setLoyaltyConfig(msg.payload);
      } else if (msg.action === 'UPDATE_LOYALTY' && msg.payload) {
        if (Array.isArray(msg.payload)) {
          setLoyaltyProfiles(prev => mergeCollection('loyaltyProfiles', prev, msg.payload) as PatientLoyaltyProfile[]);
        } else if (msg.payload.patientId) {
          setLoyaltyProfiles(prev => {
            const pPhone = normalizePhoneKey(msg.payload.phone);
            const idx = prev.findIndex(p => p.patientId === msg.payload.patientId || (pPhone && normalizePhoneKey(p.phone) === pPhone));
            if (idx >= 0) {
              const incomingStamp = recordStamp(msg.payload);
              const localStamp = recordStamp(prev[idx]);
              if (localStamp > 0 && incomingStamp > 0 && incomingStamp < localStamp) {
                return prev;
              }
              const next = [...prev];
              next[idx] = { ...next[idx], ...msg.payload };
              return next;
            }
            return [msg.payload, ...prev];
          });
        } else if (msg.payload.tiers && msg.payload.pointsPerEGP !== undefined) {
          setLoyaltyConfig(msg.payload);
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
        setTestCatalog(prev => mergeCatalogWithDefaults(msg.payload, prev));
      } else if (msg.action === 'UPDATE_PACKAGES' && Array.isArray(msg.payload)) {
        setPackages(prev => mergePackagesWithDefaults(msg.payload, prev));
      } else if (msg.action === 'UPDATE_PROFILES' && Array.isArray(msg.payload)) {
        setDiagnosticProfiles(prev => mergeProfilesWithDefaults(msg.payload, prev));
      } else if (msg.action === 'ADMIT_PATIENT' && msg.payload) {
        if (msg.payload.report) {
          const rep = msg.payload.report as LabReport;
          setReports(prev => {
            const { merged, changed } = mergeReportCollections(prev, [rep], mergeTwoReports);
            return changed ? filterDeletedReports(merged) : prev;
          });
        }
        if (msg.payload.invoice) {
          const inv = msg.payload.invoice as IncomeRecord;
          setIncomeRecords(prev => {
            const { merged, changed } = mergeInvoiceCollections(prev, [inv], mergeTwoInvoices);
            return changed ? filterDeletedInvoices(merged) : prev;
          });
        }
        addNotification({
          title: '⚡ تسجيل حالة جديدة من فرع آخر',
          message: `تم تسجيل مريض من ${msg.senderDeviceName || 'فرع آخر'}: ${msg.payload.report?.patient?.fullName || msg.payload.name || ''}`,
          type: 'info'
        });
      } else if (msg.action === 'UPDATE_TEST_RESULT' && msg.payload) {
        const { reportId, parameterCode, value, flag, status } = msg.payload;
        setReports(prev => prev.map(r => {
          if (r.id !== reportId) return r;
          const updatedProfiles = r.profiles.map(p => {
            const updatedParams = p.parameters.map(param => {
              const pAny = param as any;
              if (param.id === parameterCode || pAny.code === parameterCode || param.name === parameterCode) {
                return {
                  ...param,
                  result: value !== undefined ? String(value) : param.result,
                  flag: flag || param.flag
                };
              }
              return param;
            });
            return { ...p, parameters: updatedParams };
          });
          return {
            ...r,
            profiles: updatedProfiles,
            status: status || r.status,
            updatedAt: new Date().toISOString()
          };
        }));
      } else if (msg.action === 'PING_TEST') {
        addNotification({
          title: '⚡ نبضة فحص التسميع اللحظي',
          message: `تم استلام إشارة اختبار فورية من: ${msg.senderDeviceName} (${msg.senderBranchName || 'الفرع'})`,
          type: 'success'
        });
      } else if ((msg.action === 'FULL_SYNC' || msg.action === 'INIT_STATE') && msg.payload) {
        if (Array.isArray(msg.payload.reports)) {
          const upgradedPayloadReports = msg.payload.reports.map(upgradeSingleReport);
          setReports(prev => {
            const { merged, changed } = mergeReportCollections(prev, upgradedPayloadReports, mergeTwoReports);
            return changed ? filterDeletedReports(merged) : prev;
          });
        }
        if (Array.isArray(msg.payload.incomeRecords)) {
          setIncomeRecords(prev => {
            const { merged, changed } = mergeInvoiceCollections(prev, msg.payload.incomeRecords, mergeTwoInvoices);
            return changed ? filterDeletedInvoices(merged) : prev;
          });
        }
        if (Array.isArray(msg.payload.expenses)) {
          setExpenses(msg.payload.expenses);
        }
        if (Array.isArray(msg.payload.loyaltyProfiles)) {
          setLoyaltyProfiles(prev => mergeCollection('loyaltyProfiles', prev, msg.payload.loyaltyProfiles) as PatientLoyaltyProfile[]);
        }
        if (msg.payload.loyaltyConfig) {
          setLoyaltyConfig(prev => mergeSettingsObject('loyaltyConfig', prev, msg.payload.loyaltyConfig, msg.payload.settingsStamps));
        }
        if (msg.payload.labInfo) {
          setLabInfo(msg.payload.labInfo);
        }
        if (msg.payload.staffSignatures) {
          setStaffSignatures(prev => mergeSettingsObject('staffSignatures', prev, msg.payload.staffSignatures, msg.payload.settingsStamps));
        }
        if (msg.payload.staffSignatureOptions) {
          setStaffSignatureOptions(prev => mergeSettingsObject('staffSignatureOptions', prev, msg.payload.staffSignatureOptions, msg.payload.settingsStamps));
        }
        if (Array.isArray(msg.payload.packages) && msg.payload.packages.length > 0) {
          setPackages(prev => mergePackagesWithDefaults(msg.payload.packages, prev));
        }
        if (Array.isArray(msg.payload.diagnosticProfiles) && msg.payload.diagnosticProfiles.length > 0) {
          setDiagnosticProfiles(prev => mergeProfilesWithDefaults(msg.payload.diagnosticProfiles, prev));
        }
      }
    });

    // 2. Initial cloud master pull on mount (from Firebase Firestore first, fallback to GitHub)
    realtimeSyncManager.pullMasterSnapshot().then(res => {
      if (res.success && res.data) {
        if (Array.isArray(res.data.reports) && res.data.reports.length > 0) {
          const upgradedRemote = res.data.reports.map(upgradeSingleReport);
          setReports(prev => {
            const { merged, changed } = mergeReportCollections(prev, upgradedRemote, mergeTwoReports);
            return changed ? filterDeletedReports(merged) : prev;
          });
        }
        if (Array.isArray(res.data.incomeRecords) && res.data.incomeRecords.length > 0) {
          setIncomeRecords(prev => {
            const { merged, changed } = mergeInvoiceCollections(prev, res.data.incomeRecords, mergeTwoInvoices);
            return changed ? filterDeletedInvoices(merged) : prev;
          });
        }
        if (Array.isArray(res.data.expenses) && res.data.expenses.length > 0) {
          setExpenses(res.data.expenses);
        }
        if (Array.isArray(res.data.loyaltyProfiles) && res.data.loyaltyProfiles.length > 0) {
          setLoyaltyProfiles(prev => mergeCollection('loyaltyProfiles', prev, res.data.loyaltyProfiles) as PatientLoyaltyProfile[]);
        }
        if (res.data.loyaltyConfig) {
          setLoyaltyConfig(prev => mergeSettingsObject('loyaltyConfig', prev, res.data.loyaltyConfig, res.data.settingsStamps));
        }
        if (res.data.labInfo) {
          setLabInfo(res.data.labInfo);
        }
        if (res.data.staffSignatures) {
          setStaffSignatures(prev => mergeSettingsObject('staffSignatures', prev, res.data.staffSignatures, res.data.settingsStamps));
        }
        if (res.data.staffSignatureOptions) {
          setStaffSignatureOptions(prev => mergeSettingsObject('staffSignatureOptions', prev, res.data.staffSignatureOptions, res.data.settingsStamps));
        }
        if (Array.isArray(res.data.testCatalog) && res.data.testCatalog.length > 0) {
          setTestCatalog(prev => mergeCatalogWithDefaults(res.data.testCatalog, prev));
        }
        if (Array.isArray(res.data.packages) && res.data.packages.length > 0) {
          setPackages(prev => mergePackagesWithDefaults(res.data.packages, prev));
        }
        if (Array.isArray(res.data.diagnosticProfiles) && res.data.diagnosticProfiles.length > 0) {
          setDiagnosticProfiles(prev => mergeProfilesWithDefaults(res.data.diagnosticProfiles, prev));
        }
      } else {
        // Fallback to GitHub repo store directly
        pullFullStoreFromGitHub(githubConfig, { force: true }).then(ghRes => {
          if (ghRes.success && ghRes.data) {
            importDeletionTombstones(ghRes.data.deletedReports, ghRes.data.deletedInvoices);
            if (Array.isArray(ghRes.data.reports) && ghRes.data.reports.length > 0) {
              const upgradedGhReports = ghRes.data.reports.map(upgradeSingleReport);
              setReports(prev => {
                const { merged, changed } = mergeReportCollections(prev, upgradedGhReports, mergeTwoReports);
                return changed ? filterDeletedReports(merged) : filterDeletedReports(prev);
              });
            }
            if (Array.isArray(ghRes.data.incomeRecords) && ghRes.data.incomeRecords.length > 0) {
              setIncomeRecords(prev => {
                const { merged, changed } = mergeInvoiceCollections(prev, ghRes.data.incomeRecords, mergeTwoInvoices);
                return changed ? filterDeletedInvoices(merged) : filterDeletedInvoices(prev);
              });
            }
            if (Array.isArray(ghRes.data.expenses) && ghRes.data.expenses.length > 0) {
              setExpenses(prev => mergeCollection('expenses', prev, ghRes.data.expenses) as ExpenseRecord[]);
            }
            if (Array.isArray(ghRes.data.loyaltyProfiles) && ghRes.data.loyaltyProfiles.length > 0) {
              setLoyaltyProfiles(prev => mergeCollection('loyaltyProfiles', prev, ghRes.data.loyaltyProfiles) as PatientLoyaltyProfile[]);
            }
            if (ghRes.data.loyaltyConfig) {
              setLoyaltyConfig(prev => mergeSettingsObject('loyaltyConfig', prev, ghRes.data.loyaltyConfig, ghRes.data.settingsStamps));
            }
            if (Array.isArray(ghRes.data.inventory) && ghRes.data.inventory.length > 0) {
              setInventory(prev => mergeCollection('inventory', prev, ghRes.data.inventory) as InventoryItem[]);
            }
            if (ghRes.data.labInfo) {
              setLabInfo(ghRes.data.labInfo);
            }
            if (ghRes.data.staffSignatures) {
              setStaffSignatures(prev => mergeSettingsObject('staffSignatures', prev, ghRes.data.staffSignatures, ghRes.data.settingsStamps));
            }
            if (ghRes.data.staffSignatureOptions) {
              setStaffSignatureOptions(prev => mergeSettingsObject('staffSignatureOptions', prev, ghRes.data.staffSignatureOptions, ghRes.data.settingsStamps));
            }
            if (Array.isArray(ghRes.data.testCatalog) && ghRes.data.testCatalog.length > 0) {
              setTestCatalog(prev => mergeCatalogWithDefaults(ghRes.data.testCatalog, prev));
            }
            if (Array.isArray(ghRes.data.packages) && ghRes.data.packages.length > 0) {
              setPackages(prev => mergePackagesWithDefaults(ghRes.data.packages, prev));
            }
            if (Array.isArray(ghRes.data.diagnosticProfiles) && ghRes.data.diagnosticProfiles.length > 0) {
              setDiagnosticProfiles(prev => mergeProfilesWithDefaults(ghRes.data.diagnosticProfiles, prev));
            }

            // Also check for pending incoming diagnostic cases from GitHub queue (identity & name safe)
            fetchDiagnosticCases(githubConfig).then(casesRes => {
              if (casesRes.success && Array.isArray(casesRes.cases) && casesRes.cases.length > 0) {
                const candidateReports: LabReport[] = [];
                const candidateInvoices: IncomeRecord[] = [];

                casesRes.cases!.forEach(c => {
                  const safeCaseLab = c.labNumber || (c as any).reportNumber || (c.barcode ? `RT-${String(c.barcode).replace('RT-', '')}` : `RT-${Date.now()}`);
                  const invNumber = c.invoiceNumber || `INV-${String(safeCaseLab).replace('RT-', '')}`;
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

                  const invObj: IncomeRecord = {
                    id: c.id?.startsWith('inv-') ? c.id : `inv-${c.id || safeCaseLab}`,
                    invoiceNumber: invNumber,
                    patientName: c.fullName,
                    patientPhone: c.phone || '',
                    patientAge: c.age || 30,
                    patientGender: (c.gender as any) || 'male',
                    barcode: c.barcode,
                    labNumber: safeCaseLab,
                    referringDoctor: c.referringDoctorName || 'كشف معمل',
                    tests: actualTests,
                    subtotal: net,
                    testsSubtotal: testsSub,
                    discount: disc,
                    visitFee: vFee,
                    isHomeVisit: Boolean(isHome),
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

                  const repObj = convertIncomeRecordToDiagnosticReport({
                    ...invObj,
                    id: c.id || `rep-${safeCaseLab}`,
                    homeAddress: vAddr,
                    discountApplied: disc
                  }) as unknown as LabReport;

                  if (!isReportDeletedByTombstone(repObj)) candidateReports.push(repObj);
                  if (!isInvoiceDeletedByTombstone(invObj)) candidateInvoices.push(invObj);
                });

                if (candidateReports.length > 0) {
                  setReports(cur => {
                    const { merged, changed } = mergeReportCollections(cur, candidateReports, mergeTwoReports);
                    return changed ? filterDeletedReports(merged) : cur;
                  });
                }
                if (candidateInvoices.length > 0) {
                  setIncomeRecords(cur => {
                    const { merged, changed } = mergeInvoiceCollections(cur, candidateInvoices, mergeTwoInvoices);
                    return changed ? filterDeletedInvoices(merged) : cur;
                  });
                }
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

  // مزامنة خلفية شبه لحظية كل 3 ثوانٍ (نبضة شرطية خفيفة ثم تنزيل عند وجود تحديث فقط)
  const pullNowRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!githubConfig.token || !githubConfig.autoSync) return;

    const doCloudPull = () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;
      // Never let a background cloud pull clobber local edits while a local push is still queued
      if (isPendingCloudPush()) return;

      cloudVersionChanged(githubConfig)
        .then(changed => (changed ? pullFullStoreFromGitHub(githubConfig, { force: true }) : null))
        .then(ghRes => {
        if (!ghRes) return;
        if (ghRes.success && ghRes.data) {
          const data = ghRes.data;
          importDeletionTombstones(data.deletedReports, data.deletedInvoices);
          applyCloudCollections(data);
          if (Array.isArray(data.reports) && data.reports.length > 0) {
            const upgradedCloudReports = data.reports.map(upgradeSingleReport);
            setReports(prev => {
              const { merged, newlyAdded, changed } = mergeReportCollections(prev, upgradedCloudReports, mergeTwoReports);

              if (newlyAdded.length > 0) {
                playSyncChime();
                const latest = newlyAdded[0];
                addNotification({
                  title: '⚡ حجز حالة جديدة وصل من السحابة',
                  message: `وصلت حالة ${latest.patient?.fullName || ''} (${latest.reportNumber || ''}) بنجاح — جاهزة لإدخال النتائج الطبية.`,
                  type: 'success'
                });
              }

              const filtered = filterDeletedReports(changed ? merged : prev);
              return (changed || filtered.length !== prev.length) ? filtered : prev;
            });
          }

          if (Array.isArray(data.incomeRecords) && data.incomeRecords.length > 0) {
            setIncomeRecords(prev => {
              const { merged, changed } = mergeInvoiceCollections(prev, data.incomeRecords, mergeTwoInvoices);
              const filtered = filterDeletedInvoices(changed ? merged : prev);
              return (changed || filtered.length !== prev.length) ? filtered : prev;
            });
          }
        }
      }).catch(() => {});
    };

    pullNowRef.current = doCloudPull;
    const interval = setInterval(doCloudPull, 3000);
    startRealtimeChannel(() => {
      if (pullNowRef.current) pullNowRef.current();
    });

    return () => clearInterval(interval);
  }, [githubConfig, applyCloudCollections, addNotification]);


  // Re-pull latest cloud state when user returns to the tab or mobile wakes up (multi-device immediate catch-up)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && githubConfig.token && githubConfig.autoSync && !isPendingCloudPush()) {
        pullFullStoreFromGitHub(githubConfig, { force: true }).then(ghRes => {
          if (ghRes.success && ghRes.data) {
            importDeletionTombstones(ghRes.data.deletedReports, ghRes.data.deletedInvoices);
            applyCloudCollections(ghRes.data);

            if (Array.isArray(ghRes.data.reports) && ghRes.data.reports.length > 0) {
              const upgradedVisibleReports = ghRes.data.reports.map(upgradeSingleReport);
              setReports(prev => {
                const { merged, changed } = mergeReportCollections(prev, upgradedVisibleReports, mergeTwoReports);
                return changed ? filterDeletedReports(merged) : filterDeletedReports(prev);
              });
            }
            if (Array.isArray(ghRes.data.incomeRecords) && ghRes.data.incomeRecords.length > 0) {
              setIncomeRecords(prev => {
                const { merged, changed } = mergeInvoiceCollections(prev, ghRes.data.incomeRecords, mergeTwoInvoices);
                return changed ? filterDeletedInvoices(merged) : filterDeletedInvoices(prev);
              });
            }
          }
        }).catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    window.addEventListener('online', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
      window.removeEventListener('online', onVisible);
    };
  }, [githubConfig, applyCloudCollections]);

  // Pending-push auto-retry flush (retries immediately when back online or every 12s if any offline/failed push is queued)
  useEffect(() => {
    if (!githubConfig.token || !githubConfig.autoSync) return;

    const flushPendingIfNeeded = async () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;
      if (!isPendingCloudPush()) return;
      const snapshot = buildFullSyncSnapshot();
      const res = await pushFullStoreToGitHub(githubConfig, snapshot);
      if (res.success) {
        setPendingCloudPush(false);
      }
    };

    void flushPendingIfNeeded();
    window.addEventListener('online', flushPendingIfNeeded);
    const retryTimer = setInterval(flushPendingIfNeeded, 12000);
    return () => {
      window.removeEventListener('online', flushPendingIfNeeded);
      clearInterval(retryTimer);
    };
  }, [githubConfig, buildFullSyncSnapshot]);

  // Debounced cloud save whenever critical lab data changes (Push to Firebase Firestore & GitHub)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (reports.length > 0 || incomeRecords.length > 0 || testCatalog.length > 0) {
        const payload = buildFullSyncSnapshot();

        // 1. Instant Firebase Cloud persistence
        realtimeSyncManager.pushMasterSnapshot(payload);

        // 2. Secondary GitHub backup with failure tracking
        if (githubConfig.autoSync && githubConfig.token) {
          pushFullStoreToGitHub(githubConfig, payload)
            .then(res => setPendingCloudPush(!res.success))
            .catch(() => setPendingCloudPush(true));
        }
      }
    }, 15000);
    return () => clearTimeout(timer);
  }, [reports, incomeRecords, expenses, loyaltyProfiles, loyaltyConfig, inventory, labInfo, testCatalog, packages, diagnosticProfiles, githubConfig, buildFullSyncSnapshot]);

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
      return ['dashboard', 'admission', 'financial_income', 'expenses_profit', 'management_reports', 'loyalty', 'reports_archive', 'catalog', 'audit_settings'].includes(module);
    }
    if (currentUser.role === 'chemist') {
      return ['dashboard', 'worklist', 'diagnostic_editor', 'reports_archive', 'instruments', 'catalog', 'loyalty'].includes(module);
    }
    if (currentUser.role === 'receptionist') {
      return ['dashboard', 'admission', 'financial_income', 'loyalty', 'reports_archive', 'catalog'].includes(module);
    }
    if (currentUser.role === 'lab_tech') {
      return ['dashboard', 'worklist', 'instruments', 'inventory', 'catalog'].includes(module);
    }
    if (currentUser.role === 'hr_officer') {
      return ['dashboard', 'hr', 'catalog', 'audit_settings'].includes(module);
    }
    return true;
  }, [currentUser]);

  const canEditCatalog = useMemo(() => {
    return ['admin_ceo', 'chemist', 'accountant'].includes(currentUser.role);
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
      const previousReport = prev.find(r => r.id === id);
      const updatedList = prev.map(r => r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r);
      const target = updatedList.find(r => r.id === id);
      if (target) {
        realtimeSyncManager.broadcastAction('UPDATE_REPORT', target);
        // إشعار واتساب فوري عند اعتماد التقرير لأول مرة
        if (target.status === 'verified' && previousReport?.status !== 'verified') {
          void notifyReportApproved(target);
        }
      }
      triggerAutoCloudPush(updatedList);
      return updatedList;
    });
    logAction('UPDATE', 'DIAGNOSTIC', `تحديث التقرير الطبي رقم ${id}`);
  }, [logAction, triggerAutoCloudPush]);

  const deleteReport = useCallback((id: string) => {
    const reportToDelete = reports.find(r => r.id === id);
    // تسجيل الحذف حتى ينتقل لجميع الأجهزة ولا تعود الحالة من النسخة السحابية
    registerReportDeletion(reportToDelete);
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
    const approvedReport = reports.find(r => r.id === id);
    if (approvedReport) {
      void notifyReportApproved({ ...approvedReport, status: 'verified', updatedAt: new Date().toISOString() });
    }
    addNotification({
      title: "تم اعتماد التقرير الطبي",
      message: `تم اعتماد تقرير المريض برقم ${id} وأصبح جاهزاً للطباعة والإرسال.`,
      type: "success"
    });
  }, [currentUser, logAction, addNotification, triggerAutoCloudPush, reports]);

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
    registerInvoiceDeletion(inv);
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
    unmarkDeleted('testCatalog', test.code);
    unmarkDeleted('testCatalog', test.id);
    const stamped = { ...test, updatedAt: new Date().toISOString() };
    setTestCatalog(prev => {
      const next = [stamped, ...prev];
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
    const nowProfIso = new Date().toISOString();
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
        return profChanged ? { ...prof, parameters: nextParams, updatedAt: nowProfIso } : prof;
      });
      if (anyProfChanged) {
        safeSetLocalStorage(DIAGNOSTIC_PROFILES_KEY, JSON.stringify(nextProfiles));
        realtimeSyncManager.broadcastAction('UPDATE_PROFILES', nextProfiles);
      }
      return anyProfChanged ? nextProfiles : prevProfiles;
    });

    logAction('CATALOG_UPDATE', 'CATALOG', `تعديل سعر وبيانات التحليل وتحديثها فورياً في كافة التقارير: ${code}`);
  }, [logAction]);

  const updateIndividualTests = useCallback((tests: InvoiceTestItem[]) => {
    const nowIso = new Date().toISOString();
    const nextCodes = new Set(tests.map(t => (t.code || '').toUpperCase().trim()).filter(Boolean));
    setTestCatalog(prev => {
      prev.forEach(oldTest => {
        const c = (oldTest.code || '').toUpperCase().trim();
        if (c && !nextCodes.has(c)) {
          markDeleted('testCatalog', oldTest.code);
          if (oldTest.id) markDeleted('testCatalog', oldTest.id);
        }
      });
      tests.forEach(t => {
        if (t.code) unmarkDeleted('testCatalog', t.code);
        if (t.id) unmarkDeleted('testCatalog', t.id);
      });
      const prevMap = new Map(prev.map(t => [(t.code || t.id || '').toUpperCase(), t]));
      const stamped = tests.map(t => {
        const old = prevMap.get((t.code || t.id || '').toUpperCase());
        if (!old || JSON.stringify(old) !== JSON.stringify(t)) {
          return { ...t, updatedAt: nowIso };
        }
        return t;
      });
      safeSetLocalStorage(CATALOG_KEY, JSON.stringify(stamped));
      realtimeSyncManager.broadcastAction('UPDATE_CATALOG', stamped);
      return stamped;
    });
    logAction('CATALOG_UPDATE', 'CATALOG', `تحديث قائمة التحاليل (${tests.length} فحص)`);
  }, [logAction]);

  const deleteCatalogTest = useCallback((code: string) => {
    markDeleted('testCatalog', code);
    setTestCatalog(prev => {
      const target = prev.find(t => t.code === code);
      if (target?.id) markDeleted('testCatalog', target.id);
      const next = prev.filter(t => t.code !== code);
      realtimeSyncManager.broadcastAction('UPDATE_CATALOG', next);
      return next;
    });
    logAction('CATALOG_UPDATE', 'CATALOG', `حذف التحليل ${code} من الكتالوج`);
  }, [logAction]);

  // Packages Management CRUD — Always uses full sync snapshot & stamps updatedAt
  const updatePackages = useCallback((pkgs: ComprehensivePackage[]) => {
    const nowIso = new Date().toISOString();
    const nextIds = new Set(pkgs.map(p => p.id).filter(Boolean));
    const nextCodes = new Set(pkgs.map(p => (p.code || '').toUpperCase().trim()).filter(Boolean));

    setPackages(prev => {
      prev.forEach(oldPkg => {
        const oldCode = (oldPkg.code || '').toUpperCase().trim();
        const sameId = oldPkg.id && nextIds.has(oldPkg.id);
        const sameCode = oldCode && nextCodes.has(oldCode);
        if (!sameId && !sameCode) {
          if (oldPkg.id) markDeleted('packages', oldPkg.id);
          if (oldPkg.code) markDeleted('packages', oldPkg.code);
        } else if (sameId && oldCode && !nextCodes.has(oldCode)) {
          // Package code was renamed — tombstone old default code so it never duplicates on reload
          markDeleted('packages', oldPkg.code);
        }
      });
      const prevById = new Map(prev.map(p => [p.id, p]));
      const stampedList = pkgs.map(p => {
        unmarkDeleted('packages', p.id);
        if (p.code) unmarkDeleted('packages', p.code);
        const old = prevById.get(p.id);
        if (!old || JSON.stringify(old) !== JSON.stringify(p)) {
          return { ...p, updatedAt: nowIso } as ComprehensivePackage;
        }
        return p;
      });
      safeSetLocalStorage(PACKAGES_KEY, JSON.stringify(stampedList));
      latestStateRef.current.packages = stampedList;
      realtimeSyncManager.broadcastAction('UPDATE_PACKAGES', stampedList);
      if (githubConfig.token && githubConfig.autoSync) {
        setPendingCloudPush(true);
        pushFullStoreToGitHub(githubConfig, buildFullSyncSnapshot({ packages: stampedList }))
          .then(res => { if (res.success) setPendingCloudPush(false); })
          .catch(err => console.warn('Package sync note:', err));
      }
      return stampedList;
    });
    logAction('UPDATE', 'CATALOG', 'تحديث قائمة باقات الفحص الشامل المتاحة');
  }, [logAction, githubConfig, buildFullSyncSnapshot]);

  const addPackage = useCallback((pkg: ComprehensivePackage) => {
    unmarkDeleted('packages', pkg.id);
    if (pkg.code) unmarkDeleted('packages', pkg.code);
    const stampedPkg = { ...pkg, updatedAt: new Date().toISOString() } as ComprehensivePackage;
    setPackages(prev => {
      const next = [stampedPkg, ...prev];
      safeSetLocalStorage(PACKAGES_KEY, JSON.stringify(next));
      latestStateRef.current.packages = next;
      realtimeSyncManager.broadcastAction('UPDATE_PACKAGES', next);
      if (githubConfig.token && githubConfig.autoSync) {
        setPendingCloudPush(true);
        pushFullStoreToGitHub(githubConfig, buildFullSyncSnapshot({ packages: next }))
          .then(res => { if (res.success) setPendingCloudPush(false); })
          .catch(err => console.warn('Add package sync note:', err));
      }
      return next;
    });
    logAction('CREATE', 'CATALOG', `إضافة باقة فحص جديدة: ${pkg.titleAr} (${pkg.code})`);
  }, [logAction, githubConfig, buildFullSyncSnapshot]);

  const updateSinglePackage = useCallback((id: string, updates: Partial<ComprehensivePackage>) => {
    const nowIso = new Date().toISOString();
    setPackages(prev => {
      const targetOld = prev.find(p => p.id === id);
      if (targetOld?.code && updates.code && targetOld.code.toUpperCase().trim() !== updates.code.toUpperCase().trim()) {
        markDeleted('packages', targetOld.code);
      }
      const next = prev.map(p => p.id === id ? { ...p, ...updates, updatedAt: nowIso } : p);
      safeSetLocalStorage(PACKAGES_KEY, JSON.stringify(next));
      latestStateRef.current.packages = next;
      realtimeSyncManager.broadcastAction('UPDATE_PACKAGES', next);
      if (githubConfig.token && githubConfig.autoSync) {
        setPendingCloudPush(true);
        pushFullStoreToGitHub(githubConfig, buildFullSyncSnapshot({ packages: next }))
          .then(res => { if (res.success) setPendingCloudPush(false); })
          .catch(err => console.warn('Update package sync note:', err));
      }
      return next;
    });
    logAction('UPDATE', 'CATALOG', `تعديل بيانات الباقة: ${id}`);
  }, [logAction, githubConfig, buildFullSyncSnapshot]);

  const deletePackage = useCallback((id: string) => {
    markDeleted('packages', id);
    setPackages(prev => {
      const target = prev.find(p => p.id === id);
      if (target?.code) markDeleted('packages', target.code);
      const next = prev.filter(p => p.id !== id);
      safeSetLocalStorage(PACKAGES_KEY, JSON.stringify(next));
      latestStateRef.current.packages = next;
      realtimeSyncManager.broadcastAction('UPDATE_PACKAGES', next);
      if (githubConfig.token && githubConfig.autoSync) {
        setPendingCloudPush(true);
        pushFullStoreToGitHub(githubConfig, buildFullSyncSnapshot({ packages: next }))
          .then(res => { if (res.success) setPendingCloudPush(false); })
          .catch(err => console.warn('Delete package sync note:', err));
      }
      return next;
    });
    logAction('DELETE', 'CATALOG', `حذف الباقة: ${id}`);
  }, [logAction, githubConfig, buildFullSyncSnapshot]);

  const resetPackages = useCallback(() => {
    clearDeletedCollection('packages');
    const nowIso = new Date().toISOString();
    const fullPkgs = mergePackagesWithDefaults().map(p => ({ ...p, updatedAt: nowIso }));
    setPackages(fullPkgs);
    safeSetLocalStorage(PACKAGES_KEY, JSON.stringify(fullPkgs));
    latestStateRef.current.packages = fullPkgs;
    realtimeSyncManager.broadcastAction('UPDATE_PACKAGES', fullPkgs);
    if (githubConfig.token && githubConfig.autoSync) {
      setPendingCloudPush(true);
      pushFullStoreToGitHub(githubConfig, buildFullSyncSnapshot({ packages: fullPkgs }))
        .then(res => { if (res.success) setPendingCloudPush(false); })
        .catch(() => {});
    }
    logAction('UPDATE', 'CATALOG', `استعادة الباقات الافتراضية الـ 15 المتكاملة (${fullPkgs.length} باقة)`);
  }, [logAction, githubConfig, buildFullSyncSnapshot]);

  const updateDiagnosticProfiles = useCallback((profiles: CatalogProfileTemplate[]) => {
    const nowIso = new Date().toISOString();
    const nextCodes = new Set(profiles.map(p => (p.code || '').toUpperCase().trim()).filter(Boolean));

    setDiagnosticProfiles(prev => {
      prev.forEach(oldProf => {
        const oldCode = (oldProf.code || '').toUpperCase().trim();
        if (oldCode && !nextCodes.has(oldCode)) {
          markDeleted('diagnosticProfiles', oldProf.code);
        }
      });
      const prevMap = new Map(prev.map(p => [(p.code || '').toUpperCase().trim(), p]));
      const stampedProfiles = profiles.map(p => {
        if (p.code) unmarkDeleted('diagnosticProfiles', p.code);
        const old = prevMap.get((p.code || '').toUpperCase().trim());
        if (!old || JSON.stringify(old) !== JSON.stringify(p)) {
          return { ...p, updatedAt: nowIso } as CatalogProfileTemplate;
        }
        return p;
      });
      safeSetLocalStorage(DIAGNOSTIC_PROFILES_KEY, JSON.stringify(stampedProfiles));
      latestStateRef.current.diagnosticProfiles = stampedProfiles;
      realtimeSyncManager.broadcastAction('UPDATE_PROFILES', stampedProfiles);
      if (githubConfig.token && githubConfig.autoSync) {
        setPendingCloudPush(true);
        pushFullStoreToGitHub(githubConfig, buildFullSyncSnapshot({ diagnosticProfiles: stampedProfiles }))
          .then(res => { if (res.success) setPendingCloudPush(false); })
          .catch(err => console.warn('Profile sync note:', err));
      }
      return stampedProfiles;
    });
    logAction('CATALOG_UPDATE', 'CATALOG', `تحديث بروفايلات التحاليل الشاملة (${profiles.length} بروفايل) ومزامنتها سحابياً`);
  }, [logAction, githubConfig, buildFullSyncSnapshot]);

  const resetDiagnosticProfiles = useCallback(() => {
    clearDeletedCollection('diagnosticProfiles');
    const nowIso = new Date().toISOString();
    const resetList = LAB_CATALOG.map(p => ({ ...p, updatedAt: nowIso }));
    setDiagnosticProfiles(resetList);
    safeSetLocalStorage(DIAGNOSTIC_PROFILES_KEY, JSON.stringify(resetList));
    latestStateRef.current.diagnosticProfiles = resetList;
    realtimeSyncManager.broadcastAction('UPDATE_PROFILES', resetList);
    if (githubConfig.token && githubConfig.autoSync) {
      setPendingCloudPush(true);
      pushFullStoreToGitHub(githubConfig, buildFullSyncSnapshot({ diagnosticProfiles: resetList }))
        .then(res => { if (res.success) setPendingCloudPush(false); })
        .catch(() => {});
    }
    logAction('CATALOG_UPDATE', 'CATALOG', 'استعادة بروفايلات التحاليل الافتراضية (24 بروفايل طبي)');
  }, [logAction, githubConfig, buildFullSyncSnapshot]);

  const saveParameterNormalPermanently = useCallback((param: {
    name: string;
    code?: string;
    unit?: string;
    minNormal?: number;
    maxNormal?: number;
    textReference?: string;
    panicLow?: number;
    panicHigh?: number;
    method?: string;
  }) => {
    try {
      const nowIso = new Date().toISOString();
      // 1. Save to custom normals registry with updatedAt stamp
      const normKey = (param.code || param.name).toLowerCase().replace(/[\(\)\[\]\/\-_\s]/g, '').trim();
      const raw = localStorage.getItem(CUSTOM_NORMALS_KEY);
      const registry: Record<string, any> = raw ? JSON.parse(raw) : {};
      registry[normKey] = {
        name: param.name,
        code: param.code,
        unit: param.unit,
        minNormal: param.minNormal,
        maxNormal: param.maxNormal,
        textReference: param.textReference,
        panicLow: param.panicLow,
        panicHigh: param.panicHigh,
        method: param.method,
        updatedAt: nowIso
      };
      safeSetLocalStorage(CUSTOM_NORMALS_KEY, JSON.stringify(registry));

      // 2. Propagate to diagnosticProfiles in state, storage, and cloud sync (stamped with updatedAt)
      setDiagnosticProfiles(prevProfiles => {
        const next = prevProfiles.map(prof => {
          const hasParam = prof.parameters.some(p => 
            p.name.toLowerCase().trim() === param.name.toLowerCase().trim() ||
            (param.code && ((p as any).code || '').toLowerCase() === param.code.toLowerCase())
          );
          if (!hasParam) return prof;
          const newParams = prof.parameters.map(p => {
            const matches = p.name.toLowerCase().trim() === param.name.toLowerCase().trim() ||
                            (param.code && ((p as any).code || '').toLowerCase() === param.code.toLowerCase());
            if (matches) {
              return {
                ...p,
                unit: param.unit !== undefined ? param.unit : p.unit,
                minNormal: param.minNormal !== undefined ? param.minNormal : p.minNormal,
                maxNormal: param.maxNormal !== undefined ? param.maxNormal : p.maxNormal,
                panicLow: param.panicLow !== undefined ? param.panicLow : p.panicLow,
                panicHigh: param.panicHigh !== undefined ? param.panicHigh : p.panicHigh,
                textReference: param.textReference !== undefined ? param.textReference : p.textReference,
                method: param.method !== undefined ? param.method : p.method
              };
            }
            return p;
          });
          return { ...prof, parameters: newParams, updatedAt: nowIso };
        });
        safeSetLocalStorage(DIAGNOSTIC_PROFILES_KEY, JSON.stringify(next));
        latestStateRef.current.diagnosticProfiles = next;
        realtimeSyncManager.broadcastAction('UPDATE_PROFILES', next);
        return next;
      });

      // 3. Propagate to testCatalog in state and storage
      setTestCatalog(prevTests => {
        const next = prevTests.map(t => {
          const matches = (t.code && param.code && t.code.toUpperCase() === param.code.toUpperCase()) ||
                          t.nameEn.toLowerCase().trim() === param.name.toLowerCase().trim() ||
                          t.nameAr.includes(param.name);
          if (matches) {
            return {
              ...t,
              unit: param.unit !== undefined ? param.unit : t.unit,
              minNormal: param.minNormal !== undefined ? param.minNormal : t.minNormal,
              maxNormal: param.maxNormal !== undefined ? param.maxNormal : t.maxNormal,
              textReference: param.textReference !== undefined ? param.textReference : t.textReference,
              method: param.method !== undefined ? param.method : t.method,
              updatedAt: nowIso
            };
          }
          return t;
        });
        safeSetLocalStorage(CATALOG_KEY, JSON.stringify(next));
        latestStateRef.current.testCatalog = next;
        realtimeSyncManager.broadcastAction('UPDATE_CATALOG', next);
        return next;
      });

      logAction('CATALOG_UPDATE', 'CATALOG', `حفظ المعدل الطبيعي بشكل دائم للتحليل: ${param.name}`);
    } catch (e) {
      console.error('Failed to save permanent normal:', e);
    }
  }, [logAction, setDiagnosticProfiles, setTestCatalog]);

  const forceSyncCatalog = useCallback(() => {
    const refreshedTests = mergeCatalogWithDefaults(testCatalog);
    const refreshedPackages = mergePackagesWithDefaults(packages);
    const refreshedProfiles = mergeProfilesWithDefaults(diagnosticProfiles);

    setTestCatalog(refreshedTests);
    setPackages(refreshedPackages);
    setDiagnosticProfiles(refreshedProfiles);

    safeSetLocalStorage(CATALOG_KEY, JSON.stringify(refreshedTests));
    safeSetLocalStorage(PACKAGES_KEY, JSON.stringify(refreshedPackages));
    safeSetLocalStorage(DIAGNOSTIC_PROFILES_KEY, JSON.stringify(refreshedProfiles));
    latestStateRef.current.testCatalog = refreshedTests;
    latestStateRef.current.packages = refreshedPackages;
    latestStateRef.current.diagnosticProfiles = refreshedProfiles;

    const syncPayload = buildFullSyncSnapshot({
      testCatalog: refreshedTests,
      packages: refreshedPackages,
      diagnosticProfiles: refreshedProfiles
    });

    realtimeSyncManager.pushMasterSnapshot(syncPayload);
    realtimeSyncManager.broadcastAction('UPDATE_CATALOG', refreshedTests);
    realtimeSyncManager.broadcastAction('UPDATE_PACKAGES', refreshedPackages);
    realtimeSyncManager.broadcastAction('UPDATE_PROFILES', refreshedProfiles);

    if (githubConfig.token) {
      setPendingCloudPush(true);
      pushFullStoreToGitHub(githubConfig, syncPayload)
        .then(res => { if (res.success) setPendingCloudPush(false); })
        .catch(() => {});
    }

    logAction('CATALOG_UPDATE', 'CATALOG', `مزامنة وتوحيد شامل للكتالوج: ${refreshedTests.length} فحص منفرد + ${refreshedPackages.length} باقة + ${refreshedProfiles.length} بروفايل`);

    return {
      testsCount: refreshedTests.length,
      packagesCount: refreshedPackages.length,
      profilesCount: refreshedProfiles.length
    };
  }, [testCatalog, packages, diagnosticProfiles, buildFullSyncSnapshot, githubConfig, logAction]);

  // Apply Package Directly to Any Report: Each profile is generated as an independent profile on its own page (الباقات الشاملة تنزل كل بروفايل في صفحة مستقلة)
  const applyPackageToReport = useCallback((reportId: string, pkg: ComprehensivePackage) => {
    setReports(prev => prev.map(rep => {
      if (rep.id !== reportId) return rep;
      
      const independentProfiles: TestProfile[] = [];

      // 1. Create an independent profile for each included profile in the package
      (pkg.includedProfiles || []).forEach((pCode, pIdx) => {
        const template = (diagnosticProfiles || []).find(c => c.code && c.code.toUpperCase() === pCode.toUpperCase())
                      || LAB_CATALOG.find(c => c.code && c.code.toUpperCase() === pCode.toUpperCase());
        if (template && Array.isArray(template.parameters)) {
          independentProfiles.push({
            id: `prof-${pCode}-${Date.now()}-${pIdx}-${Math.random().toString(36).substring(2, 5)}`,
            profileCode: template.code,
            titleAr: template.titleAr,
            titleEn: template.titleEn,
            category: template.category || 'فحوصات الباقة الشاملة',
            sampleType: template.sampleType || 'Serum',
            interpretation: template.defaultInterpretation || '',
            parameters: template.parameters.map((p, idx) => ({
              ...p,
              id: `param-${pCode}-${idx}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
              result: '',
              flag: 'NORMAL',
              notes: p.notes || template.titleAr
            }))
          });
        }
      });

      // 2. Gather included individual tests into an independent complementary profile
      const indParams: TestParameter[] = [];
      (pkg.includedIndividualTestCodes || []).forEach((tCode, idx) => {
        const indTest = INITIAL_INDIVIDUAL_TESTS.find(t => t.code.toUpperCase() === tCode.toUpperCase())
                     || testCatalog.find(t => t.code.toUpperCase() === tCode.toUpperCase());
        if (indTest) {
          indParams.push({
            id: `p-pkg-${idx}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            name: `${indTest.nameAr} (${indTest.nameEn})`,
            result: '',
            unit: indTest.unit || '',
            minNormal: indTest.minNormal,
            maxNormal: indTest.maxNormal,
            textReference: indTest.textReference || 'Normal',
            flag: 'NORMAL',
            method: indTest.method || 'Automated Clinical Assay',
            notes: 'فحوصات وفيتامينات إضافية للباقة الشاملة'
          });
        }
      });

      if (indParams.length > 0) {
        independentProfiles.push({
          id: `prof-extra-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          profileCode: `${pkg.code}-EXTRA`,
          titleAr: `فحوصات وفيتامينات إضافية (${pkg.titleAr})`,
          titleEn: `Special Investigations (${pkg.titleEn})`,
          category: 'باقة فحوصات شاملة',
          sampleType: 'Serum / Whole Blood',
          interpretation: 'جميع الفحوصات التخصصية الإضافية للباقة تم فحصها طبقاً للمعايير الدولية المعتمدة.',
          parameters: indParams
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
        profiles: independentProfiles.length > 0 ? independentProfiles : rep.profiles,
        status: rep.status === 'draft' ? 'in_progress' : rep.status,
        updatedAt: new Date().toISOString()
      };
    }));
    logAction('UPDATE', 'DIAGNOSTIC', `تطبيق باقة "${pkg.titleAr}" على التقرير وتوزيع كافة البروفايلات في صفحات مستقلة (${pkg.includedProfiles.length} بروفايل مستقل)`);
  }, [diagnosticProfiles, testCatalog, logAction]);

  // Unified Admission: Register patient -> Create Lab Report -> Create Income Invoice -> Update Loyalty
  const createReportFromAdmission = useCallback((patient: Patient, selectedTests: InvoiceTestItem[], packageApplied?: any): LabReport => {
    // Guarantee unique lab identity across BOTH reports and incomeRecords
    const currentReps = latestStateRef.current.reports;
    const currentInvs = latestStateRef.current.incomeRecords;
    const caseIdentity = resolveUniqueLabIdentity(currentReps, patient.labNumber, patient.barcode, currentInvs);
    const resolvedLabNumber = caseIdentity.labNumber || `RT-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const resolvedBarcode = caseIdentity.barcode || `RT-${Math.floor(10000 + Math.random() * 90000)}`;

    patient = {
      ...patient,
      labNumber: resolvedLabNumber,
      barcode: resolvedBarcode,
      fullName: (patient.fullName || '').trim() || 'مريض مسجل'
    };

    const generatedProfiles: TestProfile[] = [];

    // 1. If a Package was applied: Create each profile in an independent page/profile (الباقات الشاملة تنزل كل بروفايل في صفحة مستقلة)
    if (packageApplied) {
      // A) All included profiles as independent profiles
      (packageApplied.includedProfiles || []).forEach((pCode: string, pIdx: number) => {
        if (!pCode) return;
        const template = (diagnosticProfiles || []).find(c => c.code && c.code.toUpperCase() === pCode.toUpperCase())
                      || LAB_CATALOG.find(c => c.code && c.code.toUpperCase() === pCode.toUpperCase());
        if (template && Array.isArray(template.parameters)) {
          generatedProfiles.push({
            id: `prof-${pCode}-${Date.now()}-${pIdx}-${Math.random().toString(36).substring(2, 5)}`,
            profileCode: template.code,
            titleAr: template.titleAr,
            titleEn: template.titleEn,
            category: template.category || 'فحوصات الباقة الشاملة',
            sampleType: template.sampleType || 'Serum',
            interpretation: template.defaultInterpretation || '',
            parameters: template.parameters.map((p, idx) => ({
              ...p,
              id: `param-${pCode}-${idx}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
              result: '',
              flag: 'NORMAL',
              notes: p.notes || template.titleAr
            }))
          });
        }
      });

      // B) All complementary individual tests as a separate profile
      const extraParams: TestParameter[] = [];
      (packageApplied.includedIndividualTestCodes || []).forEach((tCode: string, idx: number) => {
        if (!tCode) return;
        const indTest = INITIAL_INDIVIDUAL_TESTS.find(t => t.code && t.code.toUpperCase() === tCode.toUpperCase())
                     || testCatalog.find(t => t.code && t.code.toUpperCase() === tCode.toUpperCase());
        if (indTest) {
          const testNameAr = indTest.nameAr || indTest.nameEn || tCode;
          const testNameEn = indTest.nameEn || indTest.nameAr || tCode;
          extraParams.push({
            id: `p-pkg-${idx}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            name: `${testNameAr} (${testNameEn})`,
            result: '',
            unit: indTest.unit || '',
            minNormal: indTest.minNormal,
            maxNormal: indTest.maxNormal,
            textReference: indTest.textReference || 'Normal',
            flag: 'NORMAL',
            method: indTest.method || 'Automated Clinical Assay',
            notes: 'فحوصات وفيتامينات إضافية للباقة الشاملة'
          });
        }
      });

      if (extraParams.length > 0) {
        generatedProfiles.push({
          id: `prof-extra-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          profileCode: `${packageApplied.code || 'PKG'}-EXTRA`,
          titleAr: `فحوصات وفيتامينات إضافية (${packageApplied.titleAr || 'الباقة الشاملة'})`,
          titleEn: `Special Investigations (${packageApplied.titleEn || 'Comprehensive Package'})`,
          category: 'باقة فحوصات شاملة',
          sampleType: 'Serum / Whole Blood',
          interpretation: 'جميع الفحوصات التخصصية الإضافية للباقة تم فحصها طبقاً للمعايير الدولية المعتمدة.',
          parameters: extraParams
        });
      }
    }

    // 2. Any additional tests selected outside the package
    (selectedTests || []).forEach(test => {
      if (!test) return;
      const testCode = String(test.code || '').trim().toUpperCase();
      if (!testCode) return;

      // If a package was applied, skip tests already included in the package
      if (packageApplied) {
        const inPkgProfiles = (packageApplied.includedProfiles || []).map((c: string) => String(c || '').toUpperCase());
        const inPkgInd = (packageApplied.includedIndividualTestCodes || []).map((c: string) => String(c || '').toUpperCase());
        if (inPkgProfiles.includes(testCode) || inPkgInd.includes(testCode)) return;
      }
      if (generatedProfiles.some(gp => gp.profileCode && gp.profileCode.toUpperCase() === testCode)) return;

      const isExplicitProfile = test.itemKind === 'profile' || String(test.id || '').startsWith('prof-');
      const exactCatalogTemplate = (diagnosticProfiles || []).find(
        c => c.code && c.code.toUpperCase() === testCode
      ) || LAB_CATALOG.find(
        c => c.code && c.code.toUpperCase() === testCode
      );
      const catalogTemplate = isExplicitProfile
        ? exactCatalogTemplate
        : (test.itemKind === 'individual' ? undefined : exactCatalogTemplate);

      if (catalogTemplate && Array.isArray(catalogTemplate.parameters)) {
        generatedProfiles.push({
          id: `prof-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          profileCode: catalogTemplate.code || testCode,
          titleEn: catalogTemplate.titleEn || test.nameEn || testCode,
          titleAr: catalogTemplate.titleAr || test.nameAr || testCode,
          category: catalogTemplate.category || 'General Diagnostic',
          sampleType: catalogTemplate.sampleType || 'Serum',
          interpretation: catalogTemplate.defaultInterpretation || '',
          parameters: catalogTemplate.parameters.map((p, idx) => ({
            ...p,
            id: `param-${idx}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            result: '',
            flag: 'NORMAL'
          }))
        });
      } else {
        // Detailed individual test
        const richTest = INITIAL_INDIVIDUAL_TESTS.find(t => t.code && t.code.toUpperCase() === testCode) || test;
        const nameAr = richTest.nameAr || richTest.nameEn || testCode;
        const nameEn = richTest.nameEn || richTest.nameAr || testCode;
        const displayName = (nameAr.trim().toLowerCase() === nameEn.trim().toLowerCase()) 
          ? nameAr 
          : `${nameAr} (${nameEn})`;

        generatedProfiles.push({
          id: `prof-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          profileCode: richTest.code || testCode,
          titleEn: nameEn,
          titleAr: nameAr,
          category: richTest.category || 'General Diagnostic',
          sampleType: richTest.sampleType || 'Serum',
          parameters: [
            {
              id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
              name: displayName,
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
        parameters: (defaultTpl.parameters || []).map((p, idx) => ({
          ...p,
          id: `p-${idx}-${Date.now()}`,
          result: '',
          flag: 'NORMAL'
        }))
      });
    }

    let safeSampleDate = patient.sampleDate;
    try {
      if (!safeSampleDate || isNaN(new Date(safeSampleDate).getTime())) {
        safeSampleDate = new Date().toISOString();
      }
    } catch {
      safeSampleDate = new Date().toISOString();
    }

    const newReport: LabReport = {
      id: `rep-${Date.now()}`,
      reportNumber: patient.labNumber,
      patient: {
        ...patient,
        sampleDate: safeSampleDate,
        reportingDate: patient.reportingDate || new Date().toISOString(),
        assignedPackageId: packageApplied ? packageApplied.id : patient.assignedPackageId,
        loyaltyCardIssued: true,
        loyaltyCardNumber: patient.loyaltyCardNumber || (() => {
          const pKey = normalizePhoneKey(patient.phone);
          const matchedProf = pKey
            ? latestStateRef.current.loyaltyProfiles.find(lp => normalizePhoneKey(lp.phone) === pKey)
            : undefined;
          return matchedProf?.cardNumber || generateSmartCardNumber(matchedProf?.tier || 'Silver', patient.barcode || patient.labNumber);
        })()
      },
      packageApplied: packageApplied ? {
        code: packageApplied.code,
        titleAr: packageApplied.titleAr,
        packagePrice: packageApplied.packagePrice,
        originalPrice: packageApplied.originalPrice
      } as any : undefined,
      profiles: generatedProfiles,
      staff: {
        ...(staffSignatures || DEFAULT_STAFF),
        ...(patient.phlebotomist ? { phlebotomist: patient.phlebotomist, showPhlebotomist: true } : {}),
        ...(patient.visitSpecialist ? { visitCoordinator: patient.visitSpecialist, showVisitCoordinator: true } : {}),
        ...(patient.branchRepresentative && !patient.visitSpecialist ? { visitCoordinator: patient.branchRepresentative, showVisitCoordinator: true } : {})
      },
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setReports(prev => [newReport, ...(prev || [])]);
    setSelectedReportId(newReport.id);

    // Matching financial invoice with accurate price calculations
    const rawSubtotal = Number(patient.testsSubtotal || patient.totalCost || 0);
    const fee = Number(patient.visitFee || 0);
    const disc = Number(patient.discountApplied || 0);
    const gross = rawSubtotal + fee;
    const net = (patient as any).netAmount !== undefined 
      ? Number((patient as any).netAmount) 
      : Math.max(0, gross - disc);
    const paid = (patient as any).paidAmount !== undefined 
      ? Number((patient as any).paidAmount) 
      : net;
    const remaining = (patient as any).remainingAmount !== undefined 
      ? Number((patient as any).remainingAmount) 
      : Math.max(0, net - paid);
    const pStatus = (patient as any).paymentStatus 
      || (paid >= net ? 'paid' : (paid > 0 ? 'partial' : 'pending'));

    const newInvoice: IncomeRecord = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-${String(patient.labNumber || '').replace('RT-', '') || Date.now().toString().slice(-6)}`,
      patientName: patient.fullName,
      patientPhone: patient.phone || '',
      patientAge: patient.age || 30,
      patientGender: patient.gender || 'male',
      barcode: patient.barcode || '',
      labNumber: patient.labNumber || '',
      referringDoctor: patient.referringDoctorName || 'أطباء كلية طب قصر العيني',
      tests: selectedTests || [],
      subtotal: gross,
      testsSubtotal: rawSubtotal,
      discount: disc,
      visitFee: fee,
      isHomeVisit: patient.bookingType === 'home_visit',
      bookingType: patient.bookingType || 'branch',
      visitAddress: patient.homeAddress || '',
      visitSpecialist: patient.visitSpecialist || '',
      branchRepresentative: patient.branchRepresentative || '',
      branchId: patient.branchId || 'branch-behteem',
      netAmount: net,
      paidAmount: paid,
      remainingAmount: remaining,
      paymentMethod: (patient.paymentMethod as any) || 'cash',
      paymentStatus: pStatus,
      cashierName: currentUser?.nameAr || 'المسؤول',
      branch: patient.branchName || patient.branchAddress || 'الفرع الرئيسي - بهتيم',
      syncStatus: 'synced',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    newReport.invoiceId = newInvoice.id;

    // Synchronously update latestStateRef, localStorage (quota-safe), IndexedDB, and mark pending cloud push
    const updatedReports = [newReport, ...latestStateRef.current.reports];
    const updatedInvoices = [newInvoice, ...latestStateRef.current.incomeRecords];
    latestStateRef.current.reports = updatedReports;
    latestStateRef.current.incomeRecords = updatedInvoices;

    safeSetLocalStorage(REPORTS_KEY, JSON.stringify(updatedReports));
    safeSetLocalStorage(INCOME_KEY, JSON.stringify(updatedInvoices));
    void saveIdbSnapshot({
      reports: updatedReports,
      incomeRecords: updatedInvoices,
      updatedAt: new Date().toISOString()
    });
    setPendingCloudPush(true);

    setReports(prev => [newReport, ...(prev || [])]);
    setIncomeRecords(prev => [newInvoice, ...(prev || [])]);
    setSelectedReportId(newReport.id);

    try {
      realtimeSyncManager.broadcastAction('ADMIT_PATIENT', {
        report: newReport,
        invoice: newInvoice,
        name: patient.fullName,
        labNumber: newReport.reportNumber
      });
      realtimeSyncManager.broadcastAction('UPDATE_REPORT', newReport);
      realtimeSyncManager.broadcastAction('UPDATE_INVOICE', newInvoice);
    } catch (bcErr) {
      console.warn('Realtime broadcast warning:', bcErr);
    }

    try {
      // Instant complete Cloud & Multi-device Sync (includes auditLogs, deletedMap, settingsStamps, etc.)
      const instantSyncPayload = buildFullSyncSnapshot({
        reports: updatedReports,
        incomeRecords: updatedInvoices
      });
      realtimeSyncManager.pushMasterSnapshot(instantSyncPayload).catch(err => {
        console.warn('Instant Firestore push error:', err);
      });

      // Mirror lightweight queue item locally first and push to GitHub checking actual { success } result
      if (githubConfig?.token && githubConfig?.autoSync) {
        pushFullStoreToGitHub(githubConfig, instantSyncPayload)
          .then(res => {
            if (res.success) {
              setPendingCloudPush(false);
            } else {
              setPendingCloudPush(true);
              void syncInvoiceToDiagnostic(newInvoice, githubConfig);
            }
          })
          .catch(() => {
            setPendingCloudPush(true);
            void syncInvoiceToDiagnostic(newInvoice, githubConfig);
          });
      }
    } catch (syncErr) {
      console.warn('Sync error during admission:', syncErr);
      setPendingCloudPush(true);
    }

    try {
      logAction('CREATE', 'DIAGNOSTIC', `تسجيل مريض جديد ${patient.fullName} وحجز تحاليل وربط التقرير بالفاتورة المالية ومزامنة البيانات سحابياً فوراً`);
    } catch (logErr) {
      console.warn('Audit log warning:', logErr);
    }

    try {
      addNotification({
        title: "تم تسجيل المريض بنجاح",
        message: `تم حجز التحاليل للمريض ${patient.fullName} وإصدار فاتورة وإدراج العينة في قائمة عمل المعمل.`,
        type: "success"
      });
    } catch (notifErr) {
      console.warn('Notification warning:', notifErr);
    }

    return newReport;
  }, [currentUser, logAction, addNotification, buildFullSyncSnapshot, testCatalog, packages, diagnosticProfiles, staffSignatures, githubConfig]);


  // Loyalty Program Helpers
  // Loyalty Program Helpers
  const calculateLoyaltyTier = useCallback((points: number): LoyaltyTier => {
    return computeLoyaltyTier(points, loyaltyConfig);
  }, [loyaltyConfig]);

  const calculateCashForPoints = useCallback((points: number) => {
    return Math.floor(points / 100) * (loyaltyConfig.egpPer100Points || 10);
  }, [loyaltyConfig]);

  const calculatePointsForAmount = useCallback((amount: number) => {
    return pointsForAmount(amount, loyaltyConfig);
  }, [loyaltyConfig]);

  const getLoyaltyByPhone = useCallback((phone: string): PatientLoyaltyProfile | undefined => {
    const cleanPhone = normalizePhoneKey(phone);
    if (!cleanPhone) return undefined;
    return loyaltyProfiles.find(p => normalizePhoneKey(p.phone) === cleanPhone);
  }, [loyaltyProfiles]);

  const earnLoyaltyPoints = useCallback((
    patientPhone: string,
    amount: number,
    invoiceNumber: string,
    patientName: string,
    barcode: string,
    options?: {
      isBooking?: boolean;
      visitFee?: number;
      testsSubtotal?: number;
      netAmount?: number;
      customNote?: string;
    }
  ) => {
    const cleanPhone = normalizePhoneKey(patientPhone);
    if (!cleanPhone) return;

    // Strict tests-only paid amount calculation excluding visit fees
    let testsPaid = Math.max(0, amount);
    if (options && options.visitFee !== undefined && loyaltyConfig.excludeVisitFee !== false) {
      testsPaid = calculateTestsOnlyPaidAmount({
        paidAmount: amount,
        visitFee: options.visitFee,
        testsSubtotal: options.testsSubtotal,
        netAmount: options.netAmount
      }, loyaltyConfig);
    }

    const pointsToEarn = pointsForAmount(testsPaid, loyaltyConfig);
    const normalizedInv = normalizeInvoiceRef(invoiceNumber);

    setLoyaltyProfiles(prev => {
      const existing = prev.find(p => normalizePhoneKey(p.phone) === cleanPhone);
      let updatedList: PatientLoyaltyProfile[];

      if (existing) {
        if ((invoiceNumber || normalizedInv) && hasEarnedForInvoice(existing, invoiceNumber)) return prev;
        const newTotal = existing.totalPoints + pointsToEarn;
        const newSpent = (existing.lifetimeSpent || 0) + testsPaid;
        const ptsTier = computeLoyaltyTier(newTotal, loyaltyConfig);
        const keepManualTier = Boolean(
          existing.manualTierOverride &&
          existing.tier &&
          LOYALTY_TIER_ORDER.indexOf(ptsTier) <= LOYALTY_TIER_ORDER.indexOf(existing.tier)
        );
        const newTier = keepManualTier ? existing.tier : ptsTier;
        const upgradedCardNumber = keepManualTier
          ? (existing.cardNumber || existing.barcode)
          : syncCardNumberTier(existing.cardNumber, newTier, existing.barcode || barcode);
        const updatedProfile: PatientLoyaltyProfile = {
          ...existing,
          patientName: (existing.patientName && existing.patientName !== 'عميل مسجل') ? existing.patientName : (patientName || existing.patientName),
          totalPoints: newTotal,
          tier: newTier,
          manualTierOverride: keepManualTier,
          cardNumber: upgradedCardNumber,
          lifetimeSpent: newSpent,
          updatedAt: new Date().toISOString(),
          transactions: [
            {
              id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              date: new Date().toISOString().split('T')[0],
              type: 'earn',
              points: pointsToEarn,
              description: `اكتساب نقاط حجز تحاليل (فاتورة: ${invoiceNumber}) - مبلغ التحاليل: ${testsPaid} ج.م ${options?.visitFee ? `(مستبعد رسوم الزيارة ${options.visitFee} ج.م)` : ''}`,
              invoiceNumber,
              amountEGP: testsPaid
            },
            ...(existing.transactions || [])
          ]
        } as PatientLoyaltyProfile;

        updatedList = prev.map(p => p.patientId === existing.patientId ? updatedProfile : p);
        try { realtimeSyncManager.broadcastAction('UPDATE_LOYALTY', updatedProfile); } catch {}
      } else {
        // Automatically create a smart card and profile for this patient!
        const autoProfile = createAutoLoyaltyProfile({
          patientName: patientName || 'عميل مسجل',
          phone: patientPhone.trim(),
          barcode,
          testsPaidAmount: testsPaid,
          invoiceNumber,
          config: loyaltyConfig
        });
        updatedList = [autoProfile, ...prev];
        try { realtimeSyncManager.broadcastAction('UPDATE_LOYALTY', autoProfile); } catch {}
      }

      latestStateRef.current.loyaltyProfiles = updatedList;
      safeSetLocalStorage(LOYALTY_KEY, JSON.stringify(updatedList));
      return updatedList;
    });

    triggerAutoCloudPush();
    logAction('LOYALTY', 'LOYALTY', `إضافة ${pointsToEarn} نقطة ولاء للعميل ${patientName} (${patientPhone}) عن تحاليل مدفوعة بقيمة ${testsPaid} ج.م`);
  }, [loyaltyConfig, logAction, triggerAutoCloudPush]);

  // النقاط التلقائية: تُمنح لكل فاتورة جديدة مرة واحدة فقط أياً كان مسار إنشاء الفاتورة ومحسوبة على التحاليل فقط
  const loyaltyAutoEarnSinceRef = useRef<number>(0);
  const loyaltyAutoEarnSeenRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!loyaltyAutoEarnSinceRef.current) {
      let savedSince = 0;
      try { savedSince = Number(localStorage.getItem(`${STORAGE_PREFIX}loyalty_auto_since`) || 0); } catch (e) { savedSince = 0; }
      const since = savedSince || Date.now();
      loyaltyAutoEarnSinceRef.current = since;
      if (!savedSince) {
        try { localStorage.setItem(`${STORAGE_PREFIX}loyalty_auto_since`, String(since)); } catch (e) { /* ignore */ }
      }
    }
    const sinceStamp = loyaltyAutoEarnSinceRef.current;
    incomeRecords.forEach(inv => {
      const invNo = inv.invoiceNumber;
      const normRef = normalizeInvoiceRef(invNo || inv.labNumber);
      if (!invNo || !normRef || loyaltyAutoEarnSeenRef.current.has(normRef)) return;
      const created = new Date(inv.createdAt || inv.updatedAt || '').getTime();
      if (!created || isNaN(created) || created < sinceStamp) {
        loyaltyAutoEarnSeenRef.current.add(normRef);
        return;
      }
      const testsOnlyPaid = calculateTestsOnlyPaidAmount(inv, loyaltyConfig);
      const cleanInvPhone = normalizePhoneKey(inv.patientPhone);
      if (!cleanInvPhone || pointsForAmount(testsOnlyPaid, loyaltyConfig) <= 0) return;
      const profile = loyaltyProfiles.find(p => normalizePhoneKey(p.phone) === cleanInvPhone);
      if (profile && hasEarnedForInvoice(profile, invNo)) {
        loyaltyAutoEarnSeenRef.current.add(normRef);
        return;
      }
      const alreadyCredited = profile?.transactions?.some(t =>
        (t.invoiceNumber && normalizeInvoiceRef(t.invoiceNumber) === normRef) ||
        (t.points > 0 && t.type === 'earn' && Math.abs(new Date(t.date).getTime() - created) < 2 * 60 * 1000 && t.amountEGP === testsOnlyPaid)
      );
      loyaltyAutoEarnSeenRef.current.add(normRef);
      if (alreadyCredited) return;
      earnLoyaltyPoints(inv.patientPhone, testsOnlyPaid, invNo, inv.patientName, inv.barcode, {
        visitFee: inv.visitFee,
        testsSubtotal: inv.testsSubtotal,
        netAmount: inv.netAmount
      });
    });
  }, [incomeRecords, loyaltyProfiles, loyaltyConfig, earnLoyaltyPoints]);

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
    clearDeletedCollection('testCatalog');
    const fullDefaults = mergeCatalogWithDefaults();
    setTestCatalog(fullDefaults);
    realtimeSyncManager.broadcastAction('UPDATE_CATALOG', fullDefaults);
    logAction('CATALOG_UPDATE', 'CATALOG', `إعادة ضبط كتالوج التحاليل للقيم الافتراضية (${fullDefaults.length} فحص)`);
  }, [logAction]);

  const updateLoyaltyConfig = useCallback((newConfig: LoyaltyConfig) => {
    stampSetting('loyaltyConfig');
    latestStateRef.current.loyaltyConfig = newConfig;
    setLoyaltyConfig(newConfig);
    try {
      localStorage.setItem(`${STORAGE_PREFIX}loyalty_config`, JSON.stringify(newConfig));
      localStorage.setItem('rt_lab_loyalty_settings', JSON.stringify(newConfig));
    } catch (e) {
      console.warn('Failed to save loyaltyConfig to localStorage:', e);
    }

    // Re-evaluate all existing loyalty cards immediately so tier & prefix stay synced with policy
    setLoyaltyProfiles(prev => {
      const updated = prev.map(p => {
        if (p.manualTierOverride && p.tier) return p;
        const nextTier = computeLoyaltyTier(p.totalPoints || 0, newConfig);
        const nextCardNumber = syncCardNumberTier(p.cardNumber, nextTier, p.barcode);
        if (nextTier === p.tier && nextCardNumber === p.cardNumber) return p;
        return {
          ...p,
          tier: nextTier,
          cardNumber: nextCardNumber,
          updatedAt: new Date().toISOString()
        };
      });
      latestStateRef.current.loyaltyProfiles = updated;
      safeSetLocalStorage(LOYALTY_KEY, JSON.stringify(updated));
      return updated;
    });

    try {
      realtimeSyncManager.broadcastAction('UPDATE_LOYALTY_CONFIG', newConfig);
    } catch {}
    triggerAutoCloudPush();
    logAction('LOYALTY', 'LOYALTY', `تحديث إعدادات كروت الولاء وقواعد احتساب النقاط وتطبيقها على كافة الكروت المسجلة`);
  }, [logAction, triggerAutoCloudPush]);

  const recalculateAllLoyaltyPoints = useCallback((customConfig?: LoyaltyConfig) => {
    const activeConfig = customConfig || loyaltyConfig;
    let totalInvoicesProcessed = 0;
    let newCardsCreatedCount = 0;
    let updatedProfilesCount = 0;
    let totalPointsCalculated = 0;

    setLoyaltyProfiles(prevProfiles => {
      const phoneMap = new Map<string, {
        phone: string;
        name: string;
        barcode: string;
        invoices: IncomeRecord[];
        seenInvRefs: Set<string>;
      }>();

      incomeRecords.forEach(inv => {
        if (!inv.patientPhone || !inv.patientPhone.trim()) return;
        const cleanPhone = normalizePhoneKey(inv.patientPhone);
        if (!cleanPhone) return;

        if (!phoneMap.has(cleanPhone)) {
          phoneMap.set(cleanPhone, {
            phone: inv.patientPhone.trim(),
            name: inv.patientName || 'عميل مسجل',
            barcode: inv.barcode || '',
            invoices: [],
            seenInvRefs: new Set()
          });
        }
        const entry = phoneMap.get(cleanPhone)!;
        const invRef = normalizeInvoiceRef(inv.invoiceNumber || inv.labNumber || inv.id);
        if (invRef && entry.seenInvRefs.has(invRef)) return;
        if (invRef) entry.seenInvRefs.add(invRef);
        entry.invoices.push(inv);
      });

      const updatedProfilesList: PatientLoyaltyProfile[] = [...prevProfiles];
      const handledProfileIds = new Set<string>();

      phoneMap.forEach((entry, cleanPhone) => {
        const existing = updatedProfilesList.find(p => normalizePhoneKey(p.phone) === cleanPhone);
        let profileTotalTestsPaid = 0;
        let profileTotalPoints = 0;
        const newTransactions: LoyaltyTransaction[] = [];

        // Retain ALL non-earn transactions (redeem, adjust, bonus) without dropping invoice-linked redemptions
        const retainedTxRaw = (existing?.transactions || []).filter(t => t.type !== 'earn');
        const seenTxIds = new Set<string>();
        const retainedTx: LoyaltyTransaction[] = [];
        retainedTxRaw.forEach(t => {
          if (!seenTxIds.has(t.id)) {
            seenTxIds.add(t.id);
            retainedTx.push(t);
          }
        });
        const retainedPoints = retainedTx.reduce((sum, t) => sum + (Number(t.points) || 0), 0);

        entry.invoices.forEach(inv => {
          totalInvoicesProcessed++;
          const testsPaid = calculateTestsOnlyPaidAmount(inv, activeConfig);
          const points = pointsForAmount(testsPaid, activeConfig);
          profileTotalTestsPaid += testsPaid;
          profileTotalPoints += points;

          if (points > 0 || testsPaid > 0) {
            newTransactions.push({
              id: `tx-rec-${normalizeInvoiceRef(inv.invoiceNumber || inv.labNumber) || inv.id || Date.now()}`,
              date: (inv.createdAt || new Date().toISOString()).split('T')[0],
              type: 'earn',
              points,
              description: `اكتساب نقاط حجز تحاليل (فاتورة: ${inv.invoiceNumber}) - مبلغ تحاليل: ${testsPaid} ج.م (مستبعد منها رسوم الزيارة)`,
              invoiceNumber: inv.invoiceNumber,
              amountEGP: testsPaid
            });
          }
        });

        const hasExistingWelcomeBonus = retainedTx.some(t => t.type === 'bonus');
        const welcomeBonus = (!existing && !hasExistingWelcomeBonus) ? (Number(activeConfig.welcomeBonusPoints) || 0) : 0;
        if (welcomeBonus > 0) {
          newTransactions.unshift({
            id: `tx-wel-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            date: new Date().toISOString().split('T')[0],
            type: 'bonus',
            points: welcomeBonus,
            description: `هدية ترحيبية فورية عند إصدار الكارت الذكي للعميل`,
            amountEGP: 0
          });
        }

        const calculatedFinalPoints = Math.max(0, profileTotalPoints + retainedPoints + welcomeBonus);
        totalPointsCalculated += calculatedFinalPoints;
        const autoTier = computeLoyaltyTier(calculatedFinalPoints, activeConfig);
        const keepManual = Boolean(existing?.manualTierOverride && existing?.tier);
        const calculatedTier = keepManual ? existing!.tier : autoTier;

        if (existing) {
          updatedProfilesCount++;
          handledProfileIds.add(existing.patientId);
          const idx = updatedProfilesList.findIndex(p => p.patientId === existing.patientId);
          if (idx !== -1) {
            updatedProfilesList[idx] = {
              ...existing,
              patientName: (existing.patientName && existing.patientName !== 'عميل مسجل') ? existing.patientName : entry.name,
              totalPoints: calculatedFinalPoints,
              tier: calculatedTier,
              manualTierOverride: keepManual,
              cardNumber: keepManual
                ? (existing.cardNumber || existing.barcode)
                : syncCardNumberTier(existing.cardNumber, calculatedTier, existing.barcode || entry.barcode),
              lifetimeSpent: Math.max(profileTotalTestsPaid, existing.lifetimeSpent || 0),
              updatedAt: new Date().toISOString(),
              transactions: [...newTransactions, ...retainedTx]
            } as PatientLoyaltyProfile;
          }
        } else {
          newCardsCreatedCount++;
          const safeBarcode = entry.barcode || `RT-${Math.floor(10000 + Math.random() * 90000)}`;
          const cardNumber = generateSmartCardNumber(calculatedTier, safeBarcode);
          const newProf: PatientLoyaltyProfile = {
            patientId: `pat-loyalty-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            patientName: entry.name,
            phone: entry.phone,
            barcode: safeBarcode,
            cardNumber,
            bloodGroup: '',
            totalPoints: calculatedFinalPoints,
            tier: calculatedTier,
            lifetimeSpent: profileTotalTestsPaid,
            issueDate: new Date().toISOString().split('T')[0],
            transactions: [...newTransactions, ...retainedTx]
          };
          handledProfileIds.add(newProf.patientId);
          updatedProfilesList.unshift(newProf);
        }
      });

      // Also apply updated tier thresholds/card prefix to any profiles without matching incomeRecords
      const finalizedList = updatedProfilesList.map(prof => {
        if (handledProfileIds.has(prof.patientId)) return prof;
        const nextTier = resolveProfileTier(prof, activeConfig);
        const nextCardNumber = prof.manualTierOverride
          ? (prof.cardNumber || prof.barcode)
          : syncCardNumberTier(prof.cardNumber, nextTier, prof.barcode);
        updatedProfilesCount++;
        totalPointsCalculated += (prof.totalPoints || 0);
        return {
          ...prof,
          tier: nextTier,
          cardNumber: nextCardNumber,
          updatedAt: new Date().toISOString()
        } as PatientLoyaltyProfile;
      });

      latestStateRef.current.loyaltyProfiles = finalizedList;
      safeSetLocalStorage(LOYALTY_KEY, JSON.stringify(finalizedList));
      safeSetLocalStorage('rt_lab_loyalty_profiles_v2', JSON.stringify(finalizedList));
      try { realtimeSyncManager.broadcastAction('UPDATE_LOYALTY', finalizedList); } catch {}

      return finalizedList;
    });

    triggerAutoCloudPush();
    logAction('LOYALTY', 'LOYALTY', `إعادة احتساب وتحديث نقاط كروت الولاء لـ ${totalInvoicesProcessed} حجز وفاتورة، وتحديث ${updatedProfilesCount} بروفايل وإصدار ${newCardsCreatedCount} كارت جديد`);
    return {
      updatedProfilesCount,
      newCardsCreatedCount,
      totalPointsCalculated,
      totalInvoicesProcessed
    };
  }, [incomeRecords, loyaltyConfig, logAction, triggerAutoCloudPush]);

  const addLoyaltyProfile = useCallback((profile: PatientLoyaltyProfile) => {
    setLoyaltyProfiles(prev => {
      const updated = [profile, ...prev];
      latestStateRef.current.loyaltyProfiles = updated;
      safeSetLocalStorage(LOYALTY_KEY, JSON.stringify(updated));
      return updated;
    });
    try { realtimeSyncManager.broadcastAction('UPDATE_LOYALTY', profile); } catch {}
    triggerAutoCloudPush();
    logAction('CREATE', 'LOYALTY', `إصدار كارت ولاء جديد للمريض ${profile.patientName}`);
  }, [logAction, triggerAutoCloudPush]);

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
      const cleanPhone = normalizePhoneKey(patientPhone);
      const existing = prev.find(p => (cleanPhone && normalizePhoneKey(p.phone) === cleanPhone) || p.patientId === patientPhone);
      if (existing) {
        const newTotal = existing.totalPoints + points;
        const ptsTier = computeLoyaltyTier(newTotal, loyaltyConfig);
        const keepManualTier = Boolean(
          existing.manualTierOverride &&
          existing.tier &&
          LOYALTY_TIER_ORDER.indexOf(ptsTier) <= LOYALTY_TIER_ORDER.indexOf(existing.tier)
        );
        const nextTier = keepManualTier ? existing.tier : ptsTier;
        const updatedProfile: PatientLoyaltyProfile = {
          ...existing,
          totalPoints: newTotal,
          tier: nextTier,
          manualTierOverride: keepManualTier,
          cardNumber: keepManualTier
            ? (existing.cardNumber || existing.barcode)
            : syncCardNumberTier(existing.cardNumber, nextTier, existing.barcode),
          lifetimeSpent: amountEGP ? (existing.lifetimeSpent || 0) + amountEGP : existing.lifetimeSpent,
          updatedAt: new Date().toISOString(),
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
            ...(existing.transactions || [])
          ]
        } as PatientLoyaltyProfile;
        const updated = prev.map(p => p.patientId === existing.patientId ? updatedProfile : p);
        latestStateRef.current.loyaltyProfiles = updated;
        safeSetLocalStorage(LOYALTY_KEY, JSON.stringify(updated));
        try { realtimeSyncManager.broadcastAction('UPDATE_LOYALTY', updatedProfile); } catch {}
        return updated;
      }
      return prev;
    });
    triggerAutoCloudPush();
  }, [loyaltyConfig, triggerAutoCloudPush]);

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

    setLoyaltyProfiles(prev => {
      const updated = prev.map(p => {
        if (p.patientId === profile.patientId) {
          const remaining = Math.max(0, p.totalPoints - points);
          const nextTier = p.manualTierOverride && p.tier ? p.tier : computeLoyaltyTier(remaining, loyaltyConfig);
          const updatedProfile: PatientLoyaltyProfile = {
            ...p,
            totalPoints: remaining,
            tier: nextTier,
            cardNumber: p.manualTierOverride ? (p.cardNumber || p.barcode) : syncCardNumberTier(p.cardNumber, nextTier, p.barcode),
            updatedAt: new Date().toISOString(),
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
              ...(p.transactions || [])
            ]
          } as PatientLoyaltyProfile;
          try { realtimeSyncManager.broadcastAction('UPDATE_LOYALTY', updatedProfile); } catch {}
          return updatedProfile;
        }
        return p;
      });
      latestStateRef.current.loyaltyProfiles = updated;
      safeSetLocalStorage(LOYALTY_KEY, JSON.stringify(updated));
      return updated;
    });

    triggerAutoCloudPush();
    logAction('LOYALTY', 'LOYALTY', `استبدال ${points} نقطة للمريض ${profile.patientName} بخصم ${cashValue} ج.م`);
    return { success: true, cashValue };
  }, [getLoyaltyByPhone, loyaltyProfiles, calculateCashForPoints, loyaltyConfig, logAction, triggerAutoCloudPush]);

  const updateLoyaltyProfile = useCallback((id: string, updates: Partial<PatientLoyaltyProfile>) => {
    const stampedAt = new Date().toISOString();
    let changedProfile: PatientLoyaltyProfile | null = null;
    setLoyaltyProfiles(prev => {
      const updated = prev.map(p => {
        if (p.patientId !== id) return p;
        changedProfile = { ...p, ...updates, updatedAt: stampedAt };
        return changedProfile;
      });
      latestStateRef.current.loyaltyProfiles = updated;
      safeSetLocalStorage(LOYALTY_KEY, JSON.stringify(updated));
      safeSetLocalStorage('rt_lab_loyalty_profiles_v2', JSON.stringify(updated));
      if (changedProfile) {
        try { realtimeSyncManager.broadcastAction('UPDATE_LOYALTY', changedProfile); } catch {}
      }
      return updated;
    });
    triggerAutoCloudPush();
  }, [triggerAutoCloudPush]);

  const deleteLoyaltyProfile = useCallback((id: string) => {
    markDeleted('loyaltyProfiles', id);
    setLoyaltyProfiles(prev => {
      const updated = prev.filter(p => p.patientId !== id);
      latestStateRef.current.loyaltyProfiles = updated;
      safeSetLocalStorage(LOYALTY_KEY, JSON.stringify(updated));
      return updated;
    });
    triggerAutoCloudPush();
  }, [triggerAutoCloudPush]);

  const deleteLoyaltyTransaction = useCallback((profileId: string, txId: string) => {
    setLoyaltyProfiles(prev => {
      const updated = prev.map(p => {
        if (p.patientId === profileId) {
          const filteredTx = p.transactions.filter(t => t.id !== txId);
          const recomputedPoints = Math.max(0, filteredTx.reduce((sum, t) => sum + t.points, 0));
          const nextTier = p.manualTierOverride && p.tier ? p.tier : computeLoyaltyTier(recomputedPoints, loyaltyConfig);
          const updatedProfile: PatientLoyaltyProfile = {
            ...p,
            transactions: filteredTx,
            totalPoints: recomputedPoints,
            tier: nextTier,
            cardNumber: p.manualTierOverride ? (p.cardNumber || p.barcode) : syncCardNumberTier(p.cardNumber, nextTier, p.barcode),
            updatedAt: new Date().toISOString()
          };
          try { realtimeSyncManager.broadcastAction('UPDATE_LOYALTY', updatedProfile); } catch {}
          return updatedProfile;
        }
        return p;
      });
      latestStateRef.current.loyaltyProfiles = updated;
      safeSetLocalStorage(LOYALTY_KEY, JSON.stringify(updated));
      return updated;
    });
    triggerAutoCloudPush();
  }, [loyaltyConfig, triggerAutoCloudPush]);

  const retroactiveSyncAllInvoicesToLoyalty = useCallback(() => {
    const res = recalculateAllLoyaltyPoints();
    return { syncedCount: res.totalInvoicesProcessed, newProfilesCount: res.newCardsCreatedCount };
  }, [recalculateAllLoyaltyPoints]);

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
    markDeleted('expenses', id);
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
    markDeleted('inventory', id);
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
              const resultStr = String(val);
              const flag = calculateFlag(
                resultStr,
                param.minNormal,
                param.maxNormal,
                param.panicLow,
                param.panicHigh,
                {
                  textReference: param.textReference,
                  name: param.name,
                  profileCode: prof.profileCode
                }
              );

              return { ...param, result: resultStr, flag };
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
    markDeleted('labToLabOrders', id);
    setLabToLabOrders(prev => prev.filter(o => o.id !== id));
    logAction('DELETE', 'LAB_TO_LAB', `حذف طلب معمل الإحالة رقم ${id}`);
  }, [logAction]);

  // HR Employees CRUD
  const addEmployee = useCallback((emp: Omit<Employee, 'id'>) => {
    const newEmp: Employee = {
      ...emp,
      id: `emp-${Date.now()}`
    };
    setEmployees(prev => {
      const next = [newEmp, ...prev];
      safeSetLocalStorage(EMPLOYEES_KEY, JSON.stringify(next));
      return next;
    });
    logAction('CREATE', 'HR', `إضافة موظف جديد: ${emp.fullName}`);
  }, [logAction, setEmployees]);

  const updateEmployee = useCallback((id: string, updates: Partial<Employee>) => {
    setEmployees(prev => {
      const next = prev.map(e => e.id === id ? { ...e, ...updates } : e);
      safeSetLocalStorage(EMPLOYEES_KEY, JSON.stringify(next));
      return next;
    });
    logAction('UPDATE', 'HR', `تعديل بيانات الموظف رقم ${id}`);
  }, [logAction, setEmployees]);

  const deleteEmployee = useCallback((id: string) => {
    markDeleted('employees', id);
    setEmployees(prev => {
      const next = prev.filter(e => e.id !== id);
      safeSetLocalStorage(EMPLOYEES_KEY, JSON.stringify(next));
      return next;
    });
    logAction('DELETE', 'HR', `حذف موظف رقم ${id}`);
  }, [logAction, setEmployees]);

  const timeToMinutes = (time?: string): number | null => {
  if (!time) return null;
  const parts = time.trim().match(/^(\d{1,2}):(\d{2})\s*([AP]M)?$/i);
  if (!parts) return null;
  let h = parseInt(parts[1], 10);
  const m = parseInt(parts[2], 10);
  const ap = parts[3] ? parts[3].toUpperCase() : null;
  if (ap === 'PM' && h < 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return h * 60 + m;
};

const calculateWorkedHours = (checkIn?: string, checkOut?: string): number => {
  const a = timeToMinutes(checkIn);
  const b = timeToMinutes(checkOut);
  if (a === null || b === null) return 0;
  const diff = (b - a + 1440) % 1440;
  return Math.round((diff / 60) * 100) / 100;
};

const calculateOvertimeHours = (shiftHours: number, worked: number): number => {
  const extra = worked - (shiftHours || 8);
  return extra > 0 ? Math.round(extra * 100) / 100 : 0;
};

const recordAttendance = useCallback((employeeId: string, status: AttendanceRecord['status'], checkIn?: string, checkOut?: string, notes?: string) => {
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return;
    const today = new Date().toISOString().split('T')[0];
    const inTime = checkIn || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const worked = calculateWorkedHours(inTime, checkOut);
    const newAtt: AttendanceRecord = {
      id: `att-${Date.now()}`,
      employeeId,
      employeeName: emp.fullName,
      date: today,
      checkInTime: inTime,
      checkOutTime: checkOut,
      status,
      hoursWorked: worked,
      overtimeHours: calculateOvertimeHours(emp.shiftHours, worked),
      notes
    };
    setAttendance(prev => [newAtt, ...prev.filter(a => !(a.employeeId === employeeId && a.date === today))]);
  }, [employees]);

  const generatePayrollForMonth = useCallback((monthYear: string) => {
    const year = parseInt(monthYear.split('-')[0], 10);
    const month = parseInt(monthYear.split('-')[1], 10);
    const daysInMonth = new Date(year, month, 0).getDate() || 30;
    const monthAttendance = attendance.filter(a => a.date && a.date.startsWith(monthYear));

    const newPayroll: PayrollRecord[] = employees.filter(e => e.isActive).map(emp => {
      const id = `pay-${emp.id}-${monthYear}`;
      const prev = payroll.find(p => p.id === id);
      const shift = emp.shiftHours || 8;
      const dailyRate = emp.basicSalary / daysInMonth;
      const hourlyRate = dailyRate / shift;
      const records = monthAttendance.filter(a => a.employeeId === emp.id);
      const absentDays = records.filter(a => a.status === 'absent').length;
      const lateDays = records.filter(a => a.status === 'late').length;
      let shortageHours = 0;
      let overtimeHours = 0;
      records.forEach(a => {
        const worked = a.hoursWorked || 0;
        if (a.status === 'present' || a.status === 'late') {
          if (worked > 0 && worked < shift) shortageHours += shift - worked;
          overtimeHours += a.overtimeHours || 0;
        }
      });
      const computedDeduction = Math.round(absentDays * dailyRate + shortageHours * hourlyRate + lateDays * hourlyRate);
      const manualDeduction = prev ? Math.max(0, (prev.deductionAmount || 0) - (prev.computedDeduction || 0)) : 0;
      const deductionAmount = Math.round(manualDeduction + computedDeduction);
      const bonusAmount = prev?.bonusAmount || 0;
      const advancePayment = prev?.advancePayment || 0;
      const overtimePay = Math.round(overtimeHours * hourlyRate * 1.5);
      const total = emp.basicSalary + bonusAmount + overtimePay - deductionAmount - advancePayment;
      return {
        id,
        monthYear,
        employeeId: emp.id,
        employeeName: emp.fullName,
        basicSalary: emp.basicSalary,
        bonusAmount,
        deductionAmount,
        advancePayment,
        overtimePay,
        computedDeduction,
        attendanceSummary: `${absentDays} غياب · ${lateDays} تأخير · ${Math.round(overtimeHours * 100) / 100} ساعة إضافي`,
        netSalary: Math.round(total * 100) / 100,
        paymentStatus: prev?.paymentStatus || 'draft',
        paymentDate: prev?.paymentDate,
        notes: prev?.notes
      };
    });
    setPayroll(newPayroll);
  }, [employees, attendance, payroll]);

  const updatePayrollRecord = useCallback((id: string, updates: Partial<PayrollRecord>) => {
    setPayroll(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const clockInEmployee = useCallback((empId: string) => {
    recordAttendance(empId, 'present');
  }, [recordAttendance]);

  const clockOutEmployee = useCallback((empId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const emp = employees.find(e => e.id === empId);
    const outTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    setAttendance(prev => prev.map(a => {
      if (a.employeeId === empId && a.date === today && !a.checkOutTime) {
        const worked = calculateWorkedHours(a.checkInTime, outTime);
        return {
          ...a,
          checkOutTime: outTime,
          hoursWorked: worked,
          overtimeHours: calculateOvertimeHours(emp?.shiftHours || 8, worked)
        };
      }
      return a;
    }));
  }, [employees]);

  // Staff Members (Global Directory CRUD)
  const updateStaffMembers = useCallback((members: StaffMember[]) => {
    const nowIso = new Date().toISOString();
    const nextIds = new Set(members.map(m => m.id).filter(Boolean));
    setStaffMembers(prev => {
      prev.forEach(old => {
        if (old.id && !nextIds.has(old.id)) {
          markDeleted('staffMembers', old.id);
        }
      });
      const stamped = members.map(m => {
        if (m.id) unmarkDeleted('staffMembers', m.id);
        return { ...m, updatedAt: m.updatedAt || nowIso };
      });
      safeSetLocalStorage(STAFF_MEMBERS_KEY, JSON.stringify(stamped));
      latestStateRef.current.staffMembers = stamped;
      if (githubConfig.token && githubConfig.autoSync) {
        setPendingCloudPush(true);
        pushFullStoreToGitHub(githubConfig, buildFullSyncSnapshot({ staffMembers: stamped }))
          .then(res => { if (res.success) setPendingCloudPush(false); })
          .catch(() => {});
      }
      return stamped;
    });
    logAction('UPDATE', 'SETTINGS', `تحديث دليل العاملين والطاقم الطبي (${members.length} فرد)`);
  }, [logAction, githubConfig, buildFullSyncSnapshot]);

  const addStaffMember = useCallback((member: StaffMember) => {
    const nowIso = new Date().toISOString();
    if (member.id) unmarkDeleted('staffMembers', member.id);
    const stamped = { ...member, updatedAt: nowIso };
    setStaffMembers(prev => {
      const next = [stamped, ...prev];
      safeSetLocalStorage(STAFF_MEMBERS_KEY, JSON.stringify(next));
      latestStateRef.current.staffMembers = next;
      if (githubConfig.token && githubConfig.autoSync) {
        setPendingCloudPush(true);
        pushFullStoreToGitHub(githubConfig, buildFullSyncSnapshot({ staffMembers: next }))
          .then(res => { if (res.success) setPendingCloudPush(false); })
          .catch(() => {});
      }
      return next;
    });
    logAction('CREATE', 'SETTINGS', `إضافة عامل جديد: ${member.name} (${member.title})`);
  }, [logAction, githubConfig, buildFullSyncSnapshot]);

  const updateStaffMember = useCallback((id: string, updates: Partial<StaffMember>) => {
    const nowIso = new Date().toISOString();
    setStaffMembers(prev => {
      const next = prev.map(m => m.id === id ? { ...m, ...updates, updatedAt: nowIso } : m);
      safeSetLocalStorage(STAFF_MEMBERS_KEY, JSON.stringify(next));
      latestStateRef.current.staffMembers = next;
      if (githubConfig.token && githubConfig.autoSync) {
        setPendingCloudPush(true);
        pushFullStoreToGitHub(githubConfig, buildFullSyncSnapshot({ staffMembers: next }))
          .then(res => { if (res.success) setPendingCloudPush(false); })
          .catch(() => {});
      }
      return next;
    });
    logAction('UPDATE', 'SETTINGS', `تعديل بيانات العامل: ${id}`);
  }, [logAction, githubConfig, buildFullSyncSnapshot]);

  const deleteStaffMember = useCallback((id: string) => {
    markDeleted('staffMembers', id);
    setStaffMembers(prev => {
      const next = prev.filter(m => m.id !== id);
      safeSetLocalStorage(STAFF_MEMBERS_KEY, JSON.stringify(next));
      latestStateRef.current.staffMembers = next;
      if (githubConfig.token && githubConfig.autoSync) {
        setPendingCloudPush(true);
        pushFullStoreToGitHub(githubConfig, buildFullSyncSnapshot({ staffMembers: next }))
          .then(res => { if (res.success) setPendingCloudPush(false); })
          .catch(() => {});
      }
      return next;
    });
    logAction('DELETE', 'SETTINGS', `حذف عامل من الدليل: ${id}`);
  }, [logAction, githubConfig, buildFullSyncSnapshot]);

  // Lab Info update
  const updateLabInfo = useCallback((info: LabInfo) => {
    setLabInfo(info);
    safeSetLocalStorage(LAB_INFO_KEY, JSON.stringify(info));
    stampSetting('labInfo');
    latestStateRef.current.labInfo = info;
    realtimeSyncManager.broadcastAction('UPDATE_LAB_INFO', info);
    if (githubConfig.token && githubConfig.autoSync) {
      setPendingCloudPush(true);
      pushFullStoreToGitHub(githubConfig, buildFullSyncSnapshot({ labInfo: info }))
        .then(res => { if (res.success) setPendingCloudPush(false); })
        .catch(() => {});
    }
    logAction('UPDATE', 'SETTINGS', 'تحديث بيانات وهوية المعمل وأرقام التواصل');
  }, [logAction, githubConfig, buildFullSyncSnapshot]);

  // Staff Signatures & Options
  const updateStaffSignatures = useCallback((signatures: LabStaffSignatures) => {
    setStaffSignatures(signatures);
    safeSetLocalStorage(STAFF_SIGNATURES_KEY, JSON.stringify(signatures));
    stampSetting('staffSignatures');
    latestStateRef.current.staffSignatures = signatures;
    realtimeSyncManager.broadcastAction('UPDATE_STAFF', signatures);
    if (githubConfig.token && githubConfig.autoSync) {
      setPendingCloudPush(true);
      pushFullStoreToGitHub(githubConfig, buildFullSyncSnapshot({ staffSignatures: signatures }))
        .then(res => { if (res.success) setPendingCloudPush(false); })
        .catch(() => {});
    }
    logAction('UPDATE', 'SETTINGS', 'تحديث الإمضاءات الافتراضية لطاقم الفحص والاعتماد');
  }, [logAction, githubConfig, buildFullSyncSnapshot]);

  const roleToOptionsKey = (role: StaffOptionRole): keyof StaffSignatureOptionsMap => {
    if (role === 'chemist') return 'chemists';
    if (role === 'verifier') return 'verifiers';
    if (role === 'consultant') return 'consultants';
    if (role === 'phlebotomist') return 'phlebotomists';
    if (role === 'visit_coordinator') return 'visitCoordinators';
    return 'customWorkers';
  };

  const addStaffSignatureOption = useCallback((
    role: StaffOptionRole,
    item: { name: string; title: string; license?: string; signatureKey?: string; customRoleLabel?: string }
  ) => {
    const newItem: StaffOptionItem = {
      id: `${role}-${Date.now()}`,
      name: item.name,
      title: item.title,
      role,
      license: item.license,
      signatureKey: item.signatureKey,
      customRoleLabel: item.customRoleLabel
    };

    setStaffSignatureOptions(prev => {
      const targetKey = roleToOptionsKey(role);
      const existingList = Array.isArray(prev[targetKey]) ? prev[targetKey]! : [];
      const updated: StaffSignatureOptionsMap = {
        ...prev,
        [targetKey]: [newItem, ...existingList.filter(x => x.name !== item.name)]
      };
      safeSetLocalStorage(STAFF_OPTIONS_KEY, JSON.stringify(updated));
      stampSetting('staffSignatureOptions');
      latestStateRef.current.staffSignatureOptions = updated;
      realtimeSyncManager.broadcastAction('UPDATE_STAFF_OPTIONS', updated);
      if (githubConfig.token && githubConfig.autoSync) {
        setPendingCloudPush(true);
        pushFullStoreToGitHub(githubConfig, buildFullSyncSnapshot({ staffSignatureOptions: updated }))
          .then(res => { if (res.success) setPendingCloudPush(false); })
          .catch(() => {});
      }
      return updated;
    });

    logAction('CREATE', 'SETTINGS', `إضافة عضو جديد لطاقم الاعتماد: ${item.name} (${item.title})`);
  }, [logAction, githubConfig, buildFullSyncSnapshot]);

  const updateStaffSignatureOption = useCallback((
    role: StaffOptionRole,
    id: string,
    item: { name: string; title: string; license?: string; signatureKey?: string; customRoleLabel?: string }
  ) => {
    let oldName = '';
    setStaffSignatureOptions(prev => {
      const targetKey = roleToOptionsKey(role);
      const existingList = Array.isArray(prev[targetKey]) ? prev[targetKey]! : [];
      const existing = existingList.find(x => x.id === id);
      if (existing) oldName = existing.name;
      const updated: StaffSignatureOptionsMap = {
        ...prev,
        [targetKey]: existingList.map(x => (x.id === id ? { ...x, ...item } : x))
      };
      safeSetLocalStorage(STAFF_OPTIONS_KEY, JSON.stringify(updated));
      stampSetting('staffSignatureOptions');
      latestStateRef.current.staffSignatureOptions = updated;
      realtimeSyncManager.broadcastAction('UPDATE_STAFF_OPTIONS', updated);
      if (githubConfig.token && githubConfig.autoSync) {
        setPendingCloudPush(true);
        pushFullStoreToGitHub(githubConfig, buildFullSyncSnapshot({ staffSignatureOptions: updated }))
          .then(res => { if (res.success) setPendingCloudPush(false); })
          .catch(() => {});
      }
      return updated;
    });

    // Automatically update default staffSignatures if this worker was selected
    setStaffSignatures(prev => {
      let isChanged = false;
      const next = { ...prev };
      if (role === 'chemist' && (prev.labChemist === oldName || !prev.labChemist)) {
        next.labChemist = item.name;
        next.chemistTitle = item.title;
        if (item.license !== undefined) next.chemistLicense = item.license;
        if (item.signatureKey !== undefined) next.chemistSignatureKey = item.signatureKey;
        isChanged = true;
      } else if (role === 'verifier' && (prev.verifiedBy === oldName || !prev.verifiedBy)) {
        next.verifiedBy = item.name;
        next.verifierTitle = item.title;
        if (item.license !== undefined) next.verifierLicense = item.license;
        if (item.signatureKey !== undefined) next.verifierSignatureKey = item.signatureKey;
        isChanged = true;
      } else if (role === 'consultant' && (prev.pathologist === oldName || !prev.pathologist)) {
        next.pathologist = item.name;
        next.pathologistTitle = item.title;
        if (item.license !== undefined) next.pathologistLicense = item.license;
        if (item.signatureKey !== undefined) next.pathologistSignatureKey = item.signatureKey;
        isChanged = true;
      } else if (role === 'phlebotomist' && (prev.phlebotomist === oldName || !prev.phlebotomist)) {
        next.phlebotomist = item.name;
        next.phlebotomistTitle = item.title;
        if (item.license !== undefined) next.phlebotomistLicense = item.license;
        if (item.signatureKey !== undefined) next.phlebotomistSignatureKey = item.signatureKey;
        isChanged = true;
      } else if (role === 'visit_coordinator' && (prev.visitCoordinator === oldName || !prev.visitCoordinator)) {
        next.visitCoordinator = item.name;
        next.visitCoordinatorTitle = item.title;
        if (item.license !== undefined) next.visitCoordinatorLicense = item.license;
        if (item.signatureKey !== undefined) next.visitCoordinatorSignatureKey = item.signatureKey;
        isChanged = true;
      }
      if (isChanged) {
        safeSetLocalStorage(STAFF_SIGNATURES_KEY, JSON.stringify(next));
        stampSetting('staffSignatures');
      }
      return isChanged ? next : prev;
    });

    // Update in any reports that reference the modified worker
    setReports(prevReports => {
      let anyRepChanged = false;
      const nextReports = prevReports.map(rep => {
        if (!rep.staff) return rep;
        let repChanged = false;
        const newStaff = { ...rep.staff };
        if (role === 'chemist' && oldName && rep.staff.labChemist === oldName) {
          newStaff.labChemist = item.name;
          newStaff.chemistTitle = item.title;
          if (item.license !== undefined) newStaff.chemistLicense = item.license;
          if (item.signatureKey !== undefined) newStaff.chemistSignatureKey = item.signatureKey;
          repChanged = true;
        } else if (role === 'verifier' && oldName && rep.staff.verifiedBy === oldName) {
          newStaff.verifiedBy = item.name;
          newStaff.verifierTitle = item.title;
          if (item.license !== undefined) newStaff.verifierLicense = item.license;
          if (item.signatureKey !== undefined) newStaff.verifierSignatureKey = item.signatureKey;
          repChanged = true;
        } else if (role === 'consultant' && oldName && rep.staff.pathologist === oldName) {
          newStaff.pathologist = item.name;
          newStaff.pathologistTitle = item.title;
          if (item.license !== undefined) newStaff.pathologistLicense = item.license;
          if (item.signatureKey !== undefined) newStaff.pathologistSignatureKey = item.signatureKey;
          repChanged = true;
        } else if (role === 'phlebotomist' && oldName && rep.staff.phlebotomist === oldName) {
          newStaff.phlebotomist = item.name;
          newStaff.phlebotomistTitle = item.title;
          if (item.license !== undefined) newStaff.phlebotomistLicense = item.license;
          if (item.signatureKey !== undefined) newStaff.phlebotomistSignatureKey = item.signatureKey;
          repChanged = true;
        } else if (role === 'visit_coordinator' && oldName && rep.staff.visitCoordinator === oldName) {
          newStaff.visitCoordinator = item.name;
          newStaff.visitCoordinatorTitle = item.title;
          if (item.license !== undefined) newStaff.visitCoordinatorLicense = item.license;
          if (item.signatureKey !== undefined) newStaff.visitCoordinatorSignatureKey = item.signatureKey;
          repChanged = true;
        }
        if (repChanged) anyRepChanged = true;
        return repChanged ? { ...rep, staff: newStaff } : rep;
      });
      return anyRepChanged ? nextReports : prevReports;
    });

    logAction('UPDATE', 'SETTINGS', `تحديث بيانات عضو طاقم الاعتماد وتحديث كافة السجلات: ${item.name}`);
  }, [logAction, githubConfig, buildFullSyncSnapshot]);

  const deleteStaffSignatureOption = useCallback((
    role: StaffOptionRole,
    id: string
  ) => {
    setStaffSignatureOptions(prev => {
      const targetKey = roleToOptionsKey(role);
      const existingList = Array.isArray(prev[targetKey]) ? prev[targetKey]! : [];
      const updated: StaffSignatureOptionsMap = {
        ...prev,
        [targetKey]: existingList.filter(x => x.id !== id)
      };
      safeSetLocalStorage(STAFF_OPTIONS_KEY, JSON.stringify(updated));
      stampSetting('staffSignatureOptions');
      latestStateRef.current.staffSignatureOptions = updated;
      realtimeSyncManager.broadcastAction('UPDATE_STAFF_OPTIONS', updated);
      if (githubConfig.token && githubConfig.autoSync) {
        setPendingCloudPush(true);
        pushFullStoreToGitHub(githubConfig, buildFullSyncSnapshot({ staffSignatureOptions: updated }))
          .then(res => { if (res.success) setPendingCloudPush(false); })
          .catch(() => {});
      }
      return updated;
    });
    logAction('DELETE', 'SETTINGS', `حذف عضو من قائمة طاقم الاعتماد: ${id}`);
  }, [logAction, githubConfig, buildFullSyncSnapshot]);

  // Backups
  const exportBackup = useCallback(async (): Promise<string> => {
    const payload = {
      exportDate: new Date().toISOString(),
      reports,
      incomeRecords,
      loyaltyProfiles,
      loyaltyConfig,
      inventory,
      expenses,
      dailyCloseouts,
      employees,
      labToLabOrders,
      testCatalog,
      packages,
      diagnosticProfiles,
      staffMembers,
      staffSignatures,
      staffSignatureOptions,
      labInfo,
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
  }, [reports, incomeRecords, loyaltyProfiles, loyaltyConfig, inventory, expenses, dailyCloseouts, employees, labToLabOrders, testCatalog, packages, diagnosticProfiles, staffMembers, staffSignatures, staffSignatureOptions, labInfo, auditLogs, logAction]);

  const importBackup = useCallback(async (backupJson: string): Promise<{ success: boolean; message: string }> => {
    try {
      const data = JSON.parse(backupJson);
      if (data.reports) setReports(data.reports);
      if (data.incomeRecords) setIncomeRecords(data.incomeRecords);
      if (data.loyaltyProfiles) setLoyaltyProfiles(data.loyaltyProfiles);
      if (data.loyaltyConfig) setLoyaltyConfig(data.loyaltyConfig);
      if (data.inventory) setInventory(data.inventory);
      if (data.expenses) setExpenses(data.expenses);
      if (data.employees) setEmployees(data.employees);
      if (data.labToLabOrders) setLabToLabOrders(data.labToLabOrders);
      if (data.testCatalog) setTestCatalog(data.testCatalog);
      if (data.packages) setPackages(data.packages);
      if (data.diagnosticProfiles) setDiagnosticProfiles(data.diagnosticProfiles);
      if (data.staffMembers) setStaffMembers(data.staffMembers);
      if (data.staffSignatures) {
        stampSetting('staffSignatures');
        setStaffSignatures({ ...DEFAULT_STAFF, ...data.staffSignatures });
      }
      if (data.staffSignatureOptions) {
        stampSetting('staffSignatureOptions');
        setStaffSignatureOptions(data.staffSignatureOptions);
      }
      if (data.labInfo) {
        stampSetting('labInfo');
        setLabInfo(data.labInfo);
      }
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
    if (typeof window !== 'undefined' && typeof config.token === 'string') {
      try {
        if (config.token.trim()) {
          localStorage.setItem('rt_lab_github_token', config.token.trim());
        } else {
          localStorage.removeItem('rt_lab_github_token');
        }
      } catch {}
    }
    setGithubConfig(prev => ({ ...prev, ...config }));
  }, []);

  const syncAllDevicesNow = useCallback(async (): Promise<{ success: boolean; message: string; reportsCount?: number; invoicesCount?: number }> => {
    try {
      // 1. Pull latest database from GitHub directly + IndexedDB snapshot
      const ghRes = await pullFullStoreFromGitHub(githubConfig, { force: true });
      const idbSnap = await loadIdbSnapshot().catch(() => null);

      let mergedReports = [...latestStateRef.current.reports];
      let mergedInvoices = [...latestStateRef.current.incomeRecords];
      let mergedPackages = [...latestStateRef.current.packages];
      let mergedProfiles = [...latestStateRef.current.diagnosticProfiles];
      let mergedCatalog = [...latestStateRef.current.testCatalog];

      if (idbSnap) {
        if (Array.isArray(idbSnap.reports) && idbSnap.reports.length > 0) {
          mergedReports = mergeReportCollections(mergedReports, idbSnap.reports, mergeTwoReports).merged;
        }
        if (Array.isArray(idbSnap.incomeRecords) && idbSnap.incomeRecords.length > 0) {
          mergedInvoices = mergeInvoiceCollections(mergedInvoices, idbSnap.incomeRecords, mergeTwoInvoices).merged;
        }
      }

      if (ghRes.success && ghRes.data) {
        const data = ghRes.data;
        importDeletionTombstones(data.deletedReports, data.deletedInvoices);
        applyCloudCollections(data);

        if (Array.isArray(data.reports) && data.reports.length > 0) {
          mergedReports = filterDeletedReports(mergeReportCollections(mergedReports, data.reports, mergeTwoReports).merged);
          setReports(mergedReports);
        }

        if (Array.isArray(data.incomeRecords) && data.incomeRecords.length > 0) {
          mergedInvoices = filterDeletedInvoices(mergeInvoiceCollections(mergedInvoices, data.incomeRecords, mergeTwoInvoices).merged);
          setIncomeRecords(mergedInvoices);
        }

        if (Array.isArray(data.packages) && data.packages.length > 0) {
          mergedPackages = mergePackagesWithDefaults(data.packages, mergedPackages);
          setPackages(mergedPackages);
        }

        if (Array.isArray(data.diagnosticProfiles) && data.diagnosticProfiles.length > 0) {
          mergedProfiles = mergeProfilesWithDefaults(data.diagnosticProfiles, mergedProfiles);
          setDiagnosticProfiles(mergedProfiles);
        }

        if (Array.isArray(data.testCatalog) && data.testCatalog.length > 0) {
          mergedCatalog = mergeCatalogWithDefaults(data.testCatalog, mergedCatalog);
          setTestCatalog(mergedCatalog);
        }

        if (Array.isArray(data.expenses) && data.expenses.length > 0) {
          setExpenses(data.expenses);
        }
        if (Array.isArray(data.loyaltyProfiles) && data.loyaltyProfiles.length > 0) {
          setLoyaltyProfiles(prev => mergeCollection('loyaltyProfiles', prev, data.loyaltyProfiles) as PatientLoyaltyProfile[]);
        }
        if (data.loyaltyConfig) {
          setLoyaltyConfig(prev => mergeSettingsObject('loyaltyConfig', prev, data.loyaltyConfig, data.settingsStamps));
        }
        if (data.labInfo) {
          setLabInfo(data.labInfo);
        }
        if (data.staffSignatures) {
          setStaffSignatures(prev => {
            const next = mergeSettingsObject('staffSignatures', prev, data.staffSignatures, data.settingsStamps);
            safeSetLocalStorage(STAFF_SIGNATURES_KEY, JSON.stringify(next));
            return next;
          });
        }
        if (data.staffSignatureOptions) {
          setStaffSignatureOptions(prev => {
            const mergeRoleOptions = (local: StaffOptionItem[] = [], remote: StaffOptionItem[] = []) => {
              const map = new Map<string, StaffOptionItem>();
              local.forEach(item => map.set(item.name.toLowerCase().trim(), item));
              remote.forEach(item => {
                const k = item.name.toLowerCase().trim();
                if (!map.has(k)) map.set(k, item);
              });
              return Array.from(map.values());
            };
            const merged: StaffSignatureOptionsMap = {
              chemists: mergeRoleOptions(prev.chemists, data.staffSignatureOptions.chemists),
              verifiers: mergeRoleOptions(prev.verifiers, data.staffSignatureOptions.verifiers),
              consultants: mergeRoleOptions(prev.consultants, data.staffSignatureOptions.consultants),
              phlebotomists: mergeRoleOptions(prev.phlebotomists || [], data.staffSignatureOptions.phlebotomists || []),
              visitCoordinators: mergeRoleOptions(prev.visitCoordinators || [], data.staffSignatureOptions.visitCoordinators || []),
              customWorkers: mergeRoleOptions(prev.customWorkers || [], data.staffSignatureOptions.customWorkers || [])
            };
            safeSetLocalStorage(STAFF_OPTIONS_KEY, JSON.stringify(merged));
            return merged;
          });
        }
        if (Array.isArray(data.staffMembers) && data.staffMembers.length > 0) {
          setStaffMembers(prev => mergeCollection('staffMembers', prev, data.staffMembers));
        }
        if (Array.isArray(data.employees) && data.employees.length > 0) {
          setEmployees(prev => {
            const map = new Map<string, Employee>();
            prev.forEach(e => map.set(e.id || e.fullName, e));
            data.employees.forEach((e: Employee) => {
              const k = e.id || e.fullName;
              if (!map.has(k)) map.set(k, e);
            });
            const merged = Array.from(map.values());
            safeSetLocalStorage(EMPLOYEES_KEY, JSON.stringify(merged));
            return merged;
          });
        }
      }

      // 2. Also fetch diagnostic cases queue from GitHub (identity + name compatible)
      const diagCasesRes = await fetchDiagnosticCases(githubConfig);
      if (diagCasesRes.success && Array.isArray(diagCasesRes.cases)) {
        const candidateReports: LabReport[] = [];
        const candidateInvoices: IncomeRecord[] = [];

        diagCasesRes.cases.forEach((c: any) => {
          const safeCaseLab = c.labNumber || c.reportNumber || (c.barcode ? `RT-${String(c.barcode).replace('RT-', '')}` : `RT-${Date.now()}`);
          const invNum = c.invoiceNumber || `INV-${String(safeCaseLab).replace('RT-', '')}`;
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

          const alreadyRegisteredRep = mergedReports.some(r =>
            (c.id && r.id === c.id) ||
            (((c.barcode && r.patient?.barcode === c.barcode) || (safeCaseLab && (r.reportNumber === safeCaseLab || r.patient?.labNumber === safeCaseLab))) &&
              namesCompatibleForIdentity(r.patient?.fullName, c.fullName))
          );

          const invObj: IncomeRecord = {
            id: String(c.id || `inv-${safeCaseLab}`).startsWith('inv-') ? String(c.id) : `inv-${c.id || safeCaseLab}`,
            invoiceNumber: invNum,
            patientName: c.fullName,
            patientPhone: c.phone || '',
            patientAge: c.age || 30,
            patientGender: (c.gender as any) || 'male',
            barcode: c.barcode,
            labNumber: c.labNumber || safeCaseLab,
            referringDoctor: c.referringDoctorName || 'كشف معمل',
            tests: actualTests,
            subtotal: net,
            testsSubtotal: testsSub,
            discount: disc,
            visitFee: vFee,
            isHomeVisit: Boolean(isHome),
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

          if (!alreadyRegisteredRep) {
            const newRep = convertIncomeRecordToDiagnosticReport({
              ...invObj,
              id: c.id || `rep-${safeCaseLab}`,
              homeAddress: vAddr,
              discountApplied: disc
            }) as unknown as LabReport;
            if (!isReportDeletedByTombstone(newRep)) candidateReports.push(newRep);
          }

          const alreadyRegisteredInv = mergedInvoices.some(i =>
            (invObj.id && i.id === invObj.id) ||
            (((i.invoiceNumber && i.invoiceNumber === invNum) || (i.labNumber && i.labNumber === safeCaseLab) || (i.barcode && c.barcode && i.barcode === c.barcode)) &&
              namesCompatibleForIdentity(i.patientName, c.fullName))
          );
          if (!alreadyRegisteredInv && !isInvoiceDeletedByTombstone(invObj)) {
            candidateInvoices.push(invObj);
          }
        });

        if (candidateReports.length > 0) {
          mergedReports = filterDeletedReports(mergeReportCollections(mergedReports, candidateReports, mergeTwoReports).merged);
          setReports(mergedReports);
        }
        if (candidateInvoices.length > 0) {
          mergedInvoices = filterDeletedInvoices(mergeInvoiceCollections(mergedInvoices, candidateInvoices, mergeTwoInvoices).merged);
          setIncomeRecords(mergedInvoices);
        }
      }

      // 3. Reconcile any remaining non-deleted orphan invoices <-> reports
      const orphans = findOrphanPairs(mergedReports, mergedInvoices, isReportDeletedByTombstone, isInvoiceDeletedByTombstone);
      if (orphans.missingFromReports.length > 0) {
        const restoredReports = orphans.missingFromReports.map(inv => convertIncomeRecordToDiagnosticReport(inv) as unknown as LabReport);
        mergedReports = filterDeletedReports(mergeReportCollections(mergedReports, restoredReports, mergeTwoReports).merged);
        setReports(mergedReports);
      }
      if (orphans.missingFromInvoices.length > 0) {
        const restoredInvoices = orphans.missingFromInvoices.map(rep => buildInvoiceFromOrphanReport(rep));
        mergedInvoices = filterDeletedInvoices(mergeInvoiceCollections(mergedInvoices, restoredInvoices, mergeTwoInvoices).merged);
        setIncomeRecords(mergedInvoices);
      }

      // 4. Save to quota-safe localStorage + IndexedDB immediately
      safeSetLocalStorage(REPORTS_KEY, JSON.stringify(mergedReports));
      safeSetLocalStorage(INCOME_KEY, JSON.stringify(mergedInvoices));
      safeSetLocalStorage(PACKAGES_KEY, JSON.stringify(mergedPackages));
      safeSetLocalStorage(DIAGNOSTIC_PROFILES_KEY, JSON.stringify(mergedProfiles));
      safeSetLocalStorage(CATALOG_KEY, JSON.stringify(mergedCatalog));
      void saveIdbSnapshot({ reports: mergedReports, incomeRecords: mergedInvoices, updatedAt: new Date().toISOString() });

      // 5. Push full unified state back to GitHub and broadcast to all devices
      const unifiedStore = buildFullSyncSnapshot({
        reports: mergedReports,
        incomeRecords: mergedInvoices,
        packages: mergedPackages,
        diagnosticProfiles: mergedProfiles,
        testCatalog: mergedCatalog
      });

      if (githubConfig.token) {
        const pushRes = await pushFullStoreToGitHub(githubConfig, unifiedStore);
        setPendingCloudPush(!pushRes.success);
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
  }, [githubConfig, applyCloudCollections, buildFullSyncSnapshot, addNotification]);

  const healAndRestoreCases = useCallback(async (): Promise<{ success: boolean; message: string; count: number }> => {
    try {
      // 1. Purge any stale tombstones for required cases & reset sha cache so fresh cloud snapshot is pulled
      purgeProtectedTombstones();
      try {
        localStorage.removeItem('rt_head_commit_sha');
        localStorage.removeItem('rt_cloud_store_sha');
      } catch {}

      // 2. Recover from IndexedDB snapshot & local queue + seed targets
      const idbSnap = await loadIdbSnapshot().catch(() => null);
      const requiredNames = ['دينا', 'هند', 'منار'];
      const targetReps = INITIAL_REPORTS.filter(r => {
        const name = r.patient?.fullName || '';
        return requiredNames.some(rn => name.includes(rn));
      });
      const targetInvs = INITIAL_INCOME_RECORDS.filter(i => {
        return requiredNames.some(rn => (i.patientName || '').includes(rn));
      });

      let workingReps = mergeReportCollections(
        latestStateRef.current.reports,
        [...targetReps, ...(idbSnap?.reports || [])],
        mergeTwoReports
      ).merged;
      let workingInvs = mergeInvoiceCollections(
        latestStateRef.current.incomeRecords,
        [...targetInvs, ...(idbSnap?.incomeRecords || [])],
        mergeTwoInvoices
      ).merged;

      workingReps = filterDeletedReports(workingReps);
      workingInvs = filterDeletedInvoices(workingInvs);

      // 3. Reconcile any orphan invoices <-> reports before pushing
      const orphans = findOrphanPairs(workingReps, workingInvs, isReportDeletedByTombstone, isInvoiceDeletedByTombstone);
      let recoveredOrphansCount = 0;
      if (orphans.missingFromReports.length > 0) {
        recoveredOrphansCount += orphans.missingFromReports.length;
        const restoredReports = orphans.missingFromReports.map(inv => convertIncomeRecordToDiagnosticReport(inv) as unknown as LabReport);
        workingReps = filterDeletedReports(mergeReportCollections(workingReps, restoredReports, mergeTwoReports).merged);
      }
      if (orphans.missingFromInvoices.length > 0) {
        recoveredOrphansCount += orphans.missingFromInvoices.length;
        const restoredInvoices = orphans.missingFromInvoices.map(rep => buildInvoiceFromOrphanReport(rep));
        workingInvs = filterDeletedInvoices(mergeInvoiceCollections(workingInvs, restoredInvoices, mergeTwoInvoices).merged);
      }

      setReports(workingReps);
      setIncomeRecords(workingInvs);
      safeSetLocalStorage(REPORTS_KEY, JSON.stringify(workingReps));
      safeSetLocalStorage(INCOME_KEY, JSON.stringify(workingInvs));
      setPendingCloudPush(true);

      // 4. Trigger full cloud pull & push sync
      const syncRes = await syncAllDevicesNow();

      addNotification({
        title: '✅ تم فحص واستعادة وتثبيت كافة الحالات بنجاح',
        message: `تم فحص التكامل السحابي واسترجاع ${recoveredOrphansCount > 0 ? `${recoveredOrphansCount} سجل متضرر و` : ''}تثبيت جميع الحالات بنجاح.`,
        type: 'success'
      });

      return {
        success: true,
        message: syncRes.message || 'تم بنجاح تثبيت واسترجاع جميع الحالات المسجلة وفحص التطابق السحابي!',
        count: workingReps.length
      };
    } catch (err: any) {
      return {
        success: false,
        message: `تعذر استرجاع الحالات: ${err.message || 'خطأ غير متوقع'}`,
        count: 0
      };
    }
  }, [syncAllDevicesNow, addNotification]);

  const syncUnifiedDataToGitHub = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    return await syncAllDevicesNow();
  }, [syncAllDevicesNow]);

  // Automatic Data Healing & Orphan Pair Reconciliation Effect
  const healedOrphanIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    try {
      purgeProtectedTombstones();
      const requiredNames = ['دينا', 'هند', 'منار'];
      const missingReps = INITIAL_REPORTS.filter(r => {
        const name = r.patient?.fullName || '';
        return requiredNames.some(rn => name.includes(rn));
      }).filter(seedRep => {
        return !reports.some(r =>
          r.id === seedRep.id ||
          r.reportNumber === seedRep.reportNumber ||
          r.patient?.barcode === seedRep.patient?.barcode ||
          (r.patient?.fullName && r.patient.fullName.includes(seedRep.patient?.fullName || ''))
        );
      });

      if (missingReps.length > 0) {
        setReports(prev => unionReports(prev, missingReps));
      }

      const missingInvs = INITIAL_INCOME_RECORDS.filter(i => {
        return requiredNames.some(rn => (i.patientName || '').includes(rn));
      }).filter(seedInv => {
        return !incomeRecords.some(i =>
          i.id === seedInv.id ||
          i.invoiceNumber === seedInv.invoiceNumber ||
          i.barcode === seedInv.barcode ||
          (i.patientName && i.patientName.includes(seedInv.patientName))
        );
      });

      if (missingInvs.length > 0) {
        setIncomeRecords(prev => unionInvoices(prev, missingInvs));
      }

      // Reconcile any non-deleted orphan invoices <-> reports caused by prior number collisions or interrupted saves
      const orphans = findOrphanPairs(reports, incomeRecords, isReportDeletedByTombstone, isInvoiceDeletedByTombstone);
      const newMissingReps = orphans.missingFromReports.filter(inv => !healedOrphanIdsRef.current.has(`rep-from-${inv.id}`));
      const newMissingInvs = orphans.missingFromInvoices.filter(rep => !healedOrphanIdsRef.current.has(`inv-from-${rep.id}`));

      if (newMissingReps.length > 0) {
        newMissingReps.forEach(inv => healedOrphanIdsRef.current.add(`rep-from-${inv.id}`));
        const restoredReps = newMissingReps.map(inv => convertIncomeRecordToDiagnosticReport(inv) as unknown as LabReport);
        setReports(prev => filterDeletedReports(mergeReportCollections(prev, restoredReps, mergeTwoReports).merged));
      }

      if (newMissingInvs.length > 0) {
        newMissingInvs.forEach(rep => healedOrphanIdsRef.current.add(`inv-from-${rep.id}`));
        const restoredInvs = newMissingInvs.map(rep => buildInvoiceFromOrphanReport(rep));
        setIncomeRecords(prev => filterDeletedInvoices(mergeInvoiceCollections(prev, restoredInvs, mergeTwoInvoices).merged));
      }
    } catch (e) {
      console.warn('Auto healing error:', e);
    }
  }, [reports, incomeRecords]);

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
    canEditCatalog,

    activeTab,
    setActiveTab,
    catalogViewMode,
    setCatalogViewMode,

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
    saveParameterNormalPermanently,

    instruments,
    transmissions,
    toggleInstrumentStatus,
    simulateInstrumentRun,
    applyTransmissionToReport,

    loyaltyProfiles,
    loyaltyConfig,
    updateLoyaltyConfig,
    recalculateAllLoyaltyPoints,
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
    updateStaffMembers,
    addStaffMember,
    updateStaffMember,
    deleteStaffMember,
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
    healAndRestoreCases,

    exportBackup,
    importBackup,
    resetToDefaultData,
    clearPatientRecordsOnly,

    isPatientFormOpen,
    setIsPatientFormOpen,
    isBarcodeScannerOpen,
    setIsBarcodeScannerOpen,
    isLabInfoModalOpen,
    setIsLabInfoModalOpen,
    isCloudSyncOpen,
    setIsCloudSyncOpen,
    patientSheetReport: patientSheetState ? (reports.find(r => r.id === patientSheetState.id) || patientSheetState) : null,
    openPatientSheet: (rep: LabReport) => setPatientSheetState(rep),
    closePatientSheet: () => setPatientSheetState(null)
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
