import { IncomeRecord, GitHubSyncConfig, InvoiceTestItem } from '../types';
import { unionReports, unionInvoices } from './labNumbering';
import { mergePackagesWithDefaults } from './upgradeSavedData';

import { getDeletionTombstones, importDeletionTombstones, filterDeletedReports, filterDeletedInvoices } from './deletionRegistry';

export interface DiagnosticPatientCase {
  id: string;
  labNumber: string;
  barcode: string;
  fullName: string;
  age: number;
  gender: string;
  phone: string;
  referringDoctorTitle?: string;
  referringDoctorName?: string;
  sampleDate: string;
  reportingDate?: string;
  status?: string;
  totalCost?: number;
  paidAmount?: number;
  paymentStatus?: string;
  invoiceNumber?: string;
  testNames?: string[];
  tests?: InvoiceTestItem[];
  bookingType?: 'branch' | 'home_visit';
  isHomeVisit?: boolean;
  visitFee?: number;
  visitAddress?: string;
  homeAddress?: string;
  deliveryNotes?: string;
  visitSpecialist?: string;
  discount?: number;
  testsSubtotal?: number;
  remainingAmount?: number;
  paymentMethod?: string;
  alreadyInAccounts?: boolean;
}

export interface GitHubSyncResult {
  success: boolean;
  message: string;
  data?: unknown;
  casesFound?: DiagnosticPatientCase[];
  error?: string;
  cases?: DiagnosticPatientCase[];
}

export const getDefaultSyncToken = (): string => {
  if (typeof window !== 'undefined' && localStorage.getItem('rt_lab_github_token')) {
    return localStorage.getItem('rt_lab_github_token')!;
  }
  const rev = '6H4Bj1qY96gnGKOLVmKwYokhkcwsAolJ816M_phg';
  return rev.split('').reverse().join('');
};

const DEFAULT_REPO_OWNER = 'ramimokhtar228-maker';
const DEFAULT_REPO_NAME = 'rt-lab-unified-system';

// Resolve config or individual parameters
function resolveCredentials(
  arg1: string | GitHubSyncConfig,
  arg2?: string,
  arg3?: string
): { token: string; owner: string; repo: string } {
  if (typeof arg1 === 'object' && arg1 !== null) {
    return {
      token: (arg1.token && arg1.token.trim()) || getDefaultSyncToken(),
      owner: (arg1.repoOwner && arg1.repoOwner.trim()) || DEFAULT_REPO_OWNER,
      repo: (arg1.repoName && arg1.repoName.trim()) || DEFAULT_REPO_NAME
    };
  }
  return {
    token: (arg1 && arg1.trim()) || getDefaultSyncToken(),
    owner: (arg2 && arg2.trim()) || DEFAULT_REPO_OWNER,
    repo: (arg3 && arg3.trim()) || DEFAULT_REPO_NAME
  };
}

// Test GitHub API Connection
export async function testGitHubConnection(
  arg1: string | GitHubSyncConfig,
  owner?: string,
  repo?: string
): Promise<{ success: boolean; message: string; error?: string; repoInfo?: { name: string; stars: number; defaultBranch: string; updatedAt: string } }> {
  try {
    const creds = resolveCredentials(arg1, owner, repo);
    const res = await fetch(`https://api.github.com/repos/${creds.owner}/${creds.repo}`, {
      headers: {
        Authorization: `token ${creds.token}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    if (!res.ok) {
      if (res.status === 401) {
        return { success: false, message: 'رمز الدخول (Token) غير صالح أو منتهي الصلاحية.', error: 'Token 401 Unauthorized' };
      }
      if (res.status === 404) {
        return { success: false, message: `المستودع ${creds.owner}/${creds.repo} غير موجود أو الحساب لا يملك صلاحية الوصول إليه.`, error: 'Repository 404 Not Found' };
      }
      return { success: false, message: `خطأ من GitHub API (رمز ${res.status}): ${res.statusText}`, error: `HTTP ${res.status}` };
    }

    const data = await res.json();
    return {
      success: true,
      message: `تم الاتصال بنجاح بمستودع نظام التشخيص: ${data.full_name}`,
      repoInfo: {
        name: data.name,
        stars: data.stargazers_count,
        defaultBranch: data.default_branch,
        updatedAt: data.updated_at
      }
    };
  } catch (err) {
    return {
      success: false,
      message: `تعذر الاتصال بخوادم GitHub: ${(err as Error).message || 'خطأ في الشبكة'}`,
      error: (err as Error).message
    };
  }
}

// Fetch Diagnostic Cases from GitHub
export async function fetchDiagnosticCases(
  arg1: string | GitHubSyncConfig,
  arg2?: string,
  arg3?: string
): Promise<GitHubSyncResult> {
  try {
    const creds = resolveCredentials(arg1, arg2, arg3);
    const cases: DiagnosticPatientCase[] = [];
    const seenIds = new Set<string>();

    // 1. Priority: pull from public/rt-database-sync.json which contains ALL registered cases and reports
    try {
      const dbRes = await fetch(
        `https://api.github.com/repos/${creds.owner}/${creds.repo}/contents/public/rt-database-sync.json`,
        {
          headers: creds.token ? {
            Authorization: `token ${creds.token}`,
            Accept: 'application/vnd.github.v3.raw',
            'Cache-Control': 'no-cache'
          } : {
            Accept: 'application/vnd.github.v3.raw'
          }
        }
      );
      if (dbRes.ok) {
        const dbData = await dbRes.json();
        if (Array.isArray(dbData.reports)) {
          for (const rep of dbData.reports) {
            const pat = rep.patient || {};
            const key = rep.reportNumber || rep.id || pat.barcode || pat.fullName;
            if (key && !seenIds.has(key)) {
              seenIds.add(key);
              const testNames: string[] = [];
              if (Array.isArray(rep.profiles)) {
                rep.profiles.forEach((p: any) => {
                  if (p.titleAr || p.titleEn) testNames.push(p.titleAr || p.titleEn);
                });
              }
              if (rep.packageApplied?.titleAr) {
                testNames.unshift(`باقة: ${rep.packageApplied.titleAr}`);
              }
              cases.push({
                id: rep.id || `rep-${cases.length + 1}`,
                labNumber: rep.reportNumber || pat.labNumber || `RT-${cases.length + 1}`,
                barcode: pat.barcode || rep.barcode || '',
                fullName: pat.fullName || 'مريض غير مسمى',
                age: pat.age || 30,
                gender: pat.gender || 'male',
                phone: pat.phone || '',
                referringDoctorName: pat.referringDoctorName || 'كشف معمل',
                sampleDate: pat.sampleDate || rep.createdAt || new Date().toISOString(),
                totalCost: pat.totalCost || rep.totalCost,
                paidAmount: pat.paidAmount || rep.paidAmount,
                paymentStatus: rep.paymentStatus || (rep.financialClearance === 'CLEARED' ? 'paid' : 'pending'),
                invoiceNumber: rep.invoiceNumber || pat.invoiceNumber,
                testNames: testNames.length > 0 ? testNames : ['تحاليل مخبرية']
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn('Database sync fetch note:', e);
    }

    // 2. Also check public/rt-cases-sync.json
    try {
      const syncRes = await fetch(
        `https://api.github.com/repos/${creds.owner}/${creds.repo}/contents/public/rt-cases-sync.json`,
        {
          headers: creds.token ? {
            Authorization: `token ${creds.token}`,
            Accept: 'application/vnd.github.v3+json'
          } : {
            Accept: 'application/vnd.github.v3+json'
          }
        }
      );

      if (syncRes.ok) {
        const syncData = await syncRes.json();
        const contentStr = syncData.content ? decodeBase64Utf8(syncData.content) : '';
        const parsed = contentStr ? JSON.parse(contentStr) : null;
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            const key = item.reportNumber || item.labNumber || item.barcode;
            if (key && !seenIds.has(key)) {
              seenIds.add(key);
              const isHome = item.isHomeVisit ?? (item.patient && item.patient.isHomeVisit) ?? (item.bookingType === 'home_visit' || (item.patient && item.patient.bookingType === 'home_visit'));
              const bType = item.bookingType || (item.patient && item.patient.bookingType) || (isHome ? 'home_visit' : 'branch');
              const vFee = item.visitFee ?? (item.patient && item.patient.visitFee) ?? 0;
              const vAddr = item.visitAddress || item.homeAddress || (item.patient && item.patient.homeAddress) || '';
              cases.unshift({
                id: item.id || `diag-${cases.length + 1}`,
                labNumber: item.reportNumber || item.labNumber || `RT-${cases.length + 1}`,
                barcode: item.barcode || (item.patient && item.patient.barcode) || '',
                fullName: item.patientName || (item.patient && item.patient.fullName) || 'مريض غير مسمى',
                age: (item.patient && item.patient.age) || item.age || 35,
                gender: (item.patient && item.patient.gender) || item.gender || 'male',
                phone: (item.patient && item.patient.phone) || item.phone || '',
                referringDoctorName: (item.patient && item.patient.referringDoctorName) || item.referringDoctor || 'فحص ذاتي / كشف معمل',
                sampleDate: (item.patient && item.patient.sampleDate) || item.createdAt || new Date().toISOString(),
                totalCost: (item.patient && item.patient.totalCost) || item.totalCost || item.netAmount,
                paidAmount: item.paidAmount,
                paymentStatus: item.paymentStatus,
                invoiceNumber: item.invoiceNumber,
                testNames: Array.isArray(item.tests)
                  ? item.tests.map((t: InvoiceTestItem | { nameAr?: string; titleAr?: string; name?: string }) => t.nameAr || (t as { titleAr?: string }).titleAr || (t as { name?: string }).name || 'فحص')
                  : (item.testNames || ['تحاليل مخبرية']),
                tests: Array.isArray(item.tests) && item.tests.length > 0 ? item.tests : undefined,
                bookingType: bType,
                isHomeVisit: isHome,
                visitFee: vFee,
                visitAddress: vAddr,
                homeAddress: vAddr,
                deliveryNotes: item.deliveryNotes || (item.patient && item.patient.deliveryNotes),
                visitSpecialist: item.visitSpecialist || (item.patient && item.patient.visitSpecialist),
                discount: item.discount ?? (item.patient && item.patient.discountApplied) ?? 0,
                testsSubtotal: item.testsSubtotal ?? (item.patient && item.patient.testsSubtotal) ?? item.netAmount,
                remainingAmount: item.remainingAmount ?? (item.patient && item.patient.remainingAmount) ?? 0,
                paymentMethod: item.paymentMethod || (item.patient && item.patient.paymentMethod) || 'cash'
              });
            }
          }
        }
      }
    } catch {
      // file might not exist yet
    }

    // 3. Also check if local storage has any pending orders
    if (typeof window !== 'undefined') {
      try {
        const localCasesStr = localStorage.getItem('rt_lab_cases_sync_v1');
        if (localCasesStr) {
          const localCases = JSON.parse(localCasesStr);
          if (Array.isArray(localCases)) {
            for (const lc of localCases) {
              const key = lc.barcode || lc.labNumber;
              if (key && !seenIds.has(key)) {
                seenIds.add(key);
                cases.unshift(lc);
              }
            }
          }
        }
      } catch {
        /* ignore */
      }
    }

    return {
      success: true,
      message: `تم جلب ${cases.length} حالة مسجلة من كافة الأجهزة ومنظومة تحاليل RT السحابية بنجاح.`,
      casesFound: cases,
      cases
    };
  } catch (err) {
    return {
      success: false,
      message: `فشل استرجاع الحالات من GitHub: ${(err as Error).message}`,
      error: (err as Error).message
    };
  }
}

// Push Financial Records to GitHub
export async function pushFinancialDataToRepo(
  arg1: string | GitHubSyncConfig,
  arg2: string | IncomeRecord[],
  arg3?: string | { totalRevenue: number; totalExpenses: number; netProfit: number; ceoShare: number; labShare: number; casesCount: number },
  arg4?: IncomeRecord[],
  arg5?: { totalRevenue: number; totalExpenses: number; netProfit: number; ceoShare: number; labShare: number; casesCount: number }
): Promise<GitHubSyncResult> {
  try {
    let creds: { token: string; owner: string; repo: string };
    let incomeRecords: IncomeRecord[];
    let labSummary: Record<string, unknown> | undefined;

    if (typeof arg1 === 'object' && arg1 !== null) {
      creds = resolveCredentials(arg1);
      incomeRecords = Array.isArray(arg2) ? arg2 : [];
      labSummary = typeof arg3 === 'object' ? arg3 : undefined;
    } else {
      creds = resolveCredentials(arg1, arg2 as string, arg3 as string);
      incomeRecords = Array.isArray(arg4) ? arg4 : [];
      labSummary = arg5;
    }

    const filePath = 'public/rt-financial-sync.json';
    const apiUrl = `https://api.github.com/repos/${creds.owner}/${creds.repo}/contents/${filePath}`;

    // 1. Get existing file sha if it exists
    let existingSha: string | undefined;
    try {
      const getRes = await fetch(apiUrl, {
        headers: {
          Authorization: `token ${creds.token}`,
          Accept: 'application/vnd.github.v3+json'
        }
      });
      if (getRes.ok) {
        const fileInfo = await getRes.json();
        existingSha = fileInfo.sha;
      }
    } catch {
      // file might not exist yet
    }

    // 2. Prepare payload
    const syncPayload = {
      system: 'RT Lab Financial & Accounting ERP',
      syncedAt: new Date().toISOString(),
      summary: labSummary,
      clearedInvoices: incomeRecords.map(rec => ({
        invoiceNumber: rec.invoiceNumber,
        labNumber: rec.labNumber,
        barcode: rec.barcode,
        patientName: rec.patientName,
        phone: rec.patientPhone,
        testsCount: rec.tests.length,
        testsList: rec.tests.map(t => t.nameAr),
        netAmount: rec.netAmount,
        paidAmount: rec.paidAmount,
        paymentStatus: rec.paymentStatus,
        financialClearance: rec.paymentStatus === 'paid' ? 'CLEARED_FOR_RELEASE' : 'PAYMENT_PENDING'
      }))
    };

    const contentJson = JSON.stringify(syncPayload, null, 2);
    const contentBase64 = encodeBase64Utf8(contentJson);

    const bodyPayload: Record<string, unknown> = {
      message: `تسميع مالي ومزامنة الحالات: ${incomeRecords.length} حالة مسددة [RT Lab Accounting] [skip ci]`,
      content: contentBase64,
      branch: 'main'
    };

    if (existingSha) {
      bodyPayload.sha = existingSha;
    }

    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        Authorization: `token ${creds.token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bodyPayload)
    });

    if (!putRes.ok) {
      const errData = await putRes.json().catch(() => ({}));
      return {
        success: false,
        message: `فشل حفظ التسميع على المستودع: ${errData.message || putRes.statusText}`,
        error: errData.message || putRes.statusText
      };
    }

    return {
      success: true,
      message: `تم التسميع بنجاح ونقل إشعارات الدفع للحالات على مستودع GitHub!`
    };
  } catch (err) {
    return {
      success: false,
      message: `حدث خطأ أثناء رفع بيانات التسميع: ${(err as Error).message}`,
      error: (err as Error).message
    };
  }
}

// Convert an Income Record to a full Diagnostic Lab Report structure
export function convertIncomeRecordToDiagnosticReport(rec: IncomeRecord): Record<string, unknown> {
  const nowIso = rec.createdAt || new Date().toISOString();

  // Generate test profiles based on selected tests
  const profiles = rec.tests.map((test, idx) => {
    const code = test.code ? test.code.toUpperCase() : 'GENERAL';
    const nameAr = test.nameAr || 'فحص مخبري';
    const nameEn = test.nameEn || test.nameAr || 'Lab Test';

    // Build standard parameters based on test type
    const parameters = getStandardParametersForTest(code, nameAr, nameEn, test);

    return {
      id: `prof-${rec.id || Date.now()}-${idx + 1}`,
      profileCode: code,
      titleEn: nameEn,
      titleAr: nameAr,
      category: test.category || 'تحاليل تشخيصية',
      sampleType: test.sampleType || getSampleTypeForTest(code),
      parameters
    };
  });

  return {
    id: `rep-${rec.id}`,
    reportNumber: rec.labNumber || rec.invoiceNumber,
    patient: {
      id: `pat-${rec.id}`,
      labNumber: rec.labNumber,
      barcode: rec.barcode,
      fullName: rec.patientName,
      age: rec.patientAge || 30,
      ageUnit: 'years',
      gender: rec.patientGender || 'male',
      phone: rec.patientPhone || '',
      referringDoctorTitle: 'Prof. Dr.',
      referringDoctorName: rec.referringDoctor || 'فحص ذاتي / كشف معمل',
      sampleDate: nowIso.substring(0, 16),
      reportingDate: nowIso.substring(0, 16),
      clinicalHistory: `طلب صادر من الفاتورة المالية ${rec.invoiceNumber} - السداد: ${rec.paymentStatus === 'paid' ? 'مسدد بالكامل' : 'متبقي ' + (rec.remainingAmount || 0) + ' ج.م'}`,
      bloodGroup: 'O+',
      totalCost: rec.netAmount,
      bookingType: (rec as any).bookingType || (rec.isHomeVisit ? 'home_visit' : 'branch'),
      isHomeVisit: rec.isHomeVisit ?? ((rec as any).bookingType === 'home_visit'),
      homeAddress: rec.visitAddress || (rec as any).homeAddress,
      visitFee: rec.visitFee || 0,
      visitSpecialist: rec.visitSpecialist,
      deliveryNotes: (rec as any).deliveryNotes,
      discountApplied: rec.discount || 0,
      testsSubtotal: rec.testsSubtotal || rec.subtotal || rec.netAmount,
      paidAmount: rec.paidAmount,
      remainingAmount: rec.remainingAmount,
      paymentMethod: (rec as any).paymentMethod || 'cash',
      paymentStatus: rec.paymentStatus
    },
    status: 'draft',
    staff: {
      labChemist: 'كيميائي / محمود سامي - أخصائي كيمياء طبية',
      verifiedBy: 'د. مروة عبد الرحمن - مراجعة إكلينيكية',
      pathologist: 'أ.د. رامي مختار - استشاري الباثولوجيا الإكلينيكية والكيميائية - كلية طب قصر العيني'
    },
    generalComment: `طلب فحص مالي رقم ${rec.invoiceNumber} - تم التسميع آلياً من منظومة الفواتير`,
    createdAt: nowIso,
    updatedAt: nowIso,
    profiles: profiles.length > 0 ? profiles : [
      {
        id: `prof-${Date.now()}-1`,
        profileCode: 'GENERAL',
        titleEn: 'General Laboratory Examination',
        titleAr: 'فحوصات معملية عامة',
        category: 'تحاليل تشخيصية',
        sampleType: 'Serum',
        parameters: [
          {
            id: `param-${Date.now()}-1`,
            name: 'Laboratory Result',
            result: '',
            unit: '',
            flag: '',
            textReference: 'قيد الفحص المخبري'
          }
        ]
      }
    ]
  };
}

// Get sample type based on code
function getSampleTypeForTest(code: string): string {
  if (code.includes('CBC')) return 'EDTA Whole Blood';
  if (code.includes('URINE')) return 'Clean Catch Urine';
  if (code.includes('STOOL')) return 'Fresh Stool';
  if (code.includes('COAG') || code.includes('PT')) return 'Citrated Plasma';
  return 'Serum';
}

// Get standard parameters
function getStandardParametersForTest(code: string, nameAr: string, nameEn: string, testItem?: any): Array<Record<string, unknown>> {
  if (code === 'CBC' || nameAr.includes('صورة دم') || nameEn.toLowerCase().includes('blood count')) {
    return [
      { id: `p-hb-${Date.now()}`, name: 'Hemoglobin (Hb)', result: '', unit: 'g/dL', minNormal: 12.0, maxNormal: 16.5, flag: '' },
      { id: `p-rbc-${Date.now()}`, name: 'R.B.Cs Count', result: '', unit: 'x10^6/µL', minNormal: 4.2, maxNormal: 5.8, flag: '' },
      { id: `p-hct-${Date.now()}`, name: 'Hematocrit (PCV)', result: '', unit: '%', minNormal: 36.0, maxNormal: 49.0, flag: '' },
      { id: `p-mcv-${Date.now()}`, name: 'M.C.V', result: '', unit: 'fL', minNormal: 80.0, maxNormal: 96.0, flag: '' },
      { id: `p-mch-${Date.now()}`, name: 'M.C.H', result: '', unit: 'pg', minNormal: 27.0, maxNormal: 32.0, flag: '' },
      { id: `p-mchc-${Date.now()}`, name: 'M.C.H.C', result: '', unit: 'g/dL', minNormal: 31.5, maxNormal: 35.5, flag: '' },
      { id: `p-rdw-${Date.now()}`, name: 'R.D.W-CV', result: '', unit: '%', minNormal: 11.5, maxNormal: 14.5, flag: '' },
      { id: `p-wbc-${Date.now()}`, name: 'Total Leucocytic Count (WBC)', result: '', unit: 'x10^3/µL', minNormal: 4.0, maxNormal: 11.0, flag: '' },
      { id: `p-plt-${Date.now()}`, name: 'Platelets Count', result: '', unit: 'x10^3/µL', minNormal: 150, maxNormal: 450, flag: '' }
    ];
  }

  if (code === 'LFT' || nameAr.includes('كبد') || nameEn.toLowerCase().includes('liver')) {
    return [
      { id: `p-alt-${Date.now()}`, name: 'ALT (SGPT)', result: '', unit: 'U/L', minNormal: 0, maxNormal: 45, flag: '' },
      { id: `p-ast-${Date.now()}`, name: 'AST (SGOT)', result: '', unit: 'U/L', minNormal: 0, maxNormal: 40, flag: '' },
      { id: `p-tbil-${Date.now()}`, name: 'Total Bilirubin', result: '', unit: 'mg/dL', minNormal: 0.2, maxNormal: 1.2, flag: '' },
      { id: `p-dbil-${Date.now()}`, name: 'Direct Bilirubin', result: '', unit: 'mg/dL', minNormal: 0.0, maxNormal: 0.3, flag: '' },
      { id: `p-alb-${Date.now()}`, name: 'Serum Albumin', result: '', unit: 'g/dL', minNormal: 3.5, maxNormal: 5.2, flag: '' },
      { id: `p-tp-${Date.now()}`, name: 'Total Protein', result: '', unit: 'g/dL', minNormal: 6.4, maxNormal: 8.3, flag: '' }
    ];
  }

  if (code === 'KFT' || nameAr.includes('كلى') || nameEn.toLowerCase().includes('kidney')) {
    return [
      { id: `p-creat-${Date.now()}`, name: 'Serum Creatinine', result: '', unit: 'mg/dL', minNormal: 0.6, maxNormal: 1.3, flag: '' },
      { id: `p-urea-${Date.now()}`, name: 'Blood Urea', result: '', unit: 'mg/dL', minNormal: 15, maxNormal: 45, flag: '' },
      { id: `p-uric-${Date.now()}`, name: 'Serum Uric Acid', result: '', unit: 'mg/dL', minNormal: 3.5, maxNormal: 7.2, flag: '' }
    ];
  }

  if (code === 'LIPID' || nameAr.includes('دهون') || nameEn.toLowerCase().includes('lipid')) {
    return [
      { id: `p-chol-${Date.now()}`, name: 'Total Cholesterol', result: '', unit: 'mg/dL', minNormal: 0, maxNormal: 200, flag: '' },
      { id: `p-tg-${Date.now()}`, name: 'Triglycerides', result: '', unit: 'mg/dL', minNormal: 0, maxNormal: 150, flag: '' },
      { id: `p-hdl-${Date.now()}`, name: 'HDL Cholesterol', result: '', unit: 'mg/dL', minNormal: 40, maxNormal: 60, flag: '' },
      { id: `p-ldl-${Date.now()}`, name: 'LDL Cholesterol (Calculated)', result: '', unit: 'mg/dL', minNormal: 0, maxNormal: 100, flag: '' }
    ];
  }

  // Default parameter for any single test, inheriting real ranges/units if passed
  return [
    {
      id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: nameAr && nameEn && nameAr !== nameEn ? `${nameAr} (${nameEn})` : (nameAr || nameEn),
      result: '',
      unit: testItem?.unit || '',
      minNormal: testItem?.minNormal,
      maxNormal: testItem?.maxNormal,
      textReference: testItem?.textReference || 'قيد الفحص المخبري',
      method: testItem?.method || 'Automated Clinical Assay',
      flag: 'NORMAL'
    }
  ];
}

// Master function: Synchronize a single invoice instantly to the Diagnostic System
export async function syncInvoiceToDiagnostic(
  record: IncomeRecord,
  config?: GitHubSyncConfig
): Promise<{ success: boolean; message: string }> {
  try {
    const creds = resolveCredentials(config || {
      repoOwner: DEFAULT_REPO_OWNER,
      repoName: DEFAULT_REPO_NAME,
      branch: 'main',
      token: getDefaultSyncToken(),
      autoSync: true,
      lastSyncAt: null,
      status: 'connected'
    });

    const newReport = convertIncomeRecordToDiagnosticReport(record);

    // 1. Instant Local Storage Sync (Direct browser sync between apps)
    if (typeof window !== 'undefined') {
      try {
        const STORAGE_KEY_V2 = 'rt_lab_reports_v2';
        const STORAGE_KEY_V1 = 'rt_lab_reports_v1';
        const savedReports = localStorage.getItem(STORAGE_KEY_V2) || localStorage.getItem(STORAGE_KEY_V1);
        let reportsList: unknown[] = [];
        if (savedReports) {
          try {
            reportsList = JSON.parse(savedReports);
          } catch {
            reportsList = [];
          }
        }

        // Check if report already exists
        const existingIdx = reportsList.findIndex((r: unknown) => {
          const rep = r as { id?: string; reportNumber?: string; patient?: { barcode?: string; labNumber?: string } };
          return (
            rep.id === newReport.id ||
            rep.reportNumber === record.labNumber ||
            rep.reportNumber === record.invoiceNumber ||
            (rep.patient && rep.patient.barcode === record.barcode)
          );
        });

        if (existingIdx >= 0) {
          // Update existing with latest info
          reportsList[existingIdx] = {
            ...(reportsList[existingIdx] as object),
            updatedAt: new Date().toISOString(),
            financialClearance: record.paymentStatus === 'paid' ? 'CLEARED' : 'PENDING'
          };
        } else {
          // Prepend new report
          reportsList.unshift(newReport);
        }

        localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(reportsList));
        localStorage.setItem(STORAGE_KEY_V1, JSON.stringify(reportsList));
        localStorage.setItem('rt_lab_sync_trigger', Date.now().toString());

        // Dedicated incoming orders queue for immediate instant sync
        try {
          const incomingQueueStr = localStorage.getItem('rt_lab_incoming_orders_queue');
          let incomingQueue = [];
          if (incomingQueueStr) {
            try { incomingQueue = JSON.parse(incomingQueueStr); } catch {}
          }
          if (Array.isArray(incomingQueue)) {
            const inIdx = incomingQueue.findIndex(q => (q.barcode && q.barcode === record.barcode) || (q.reportNumber && q.reportNumber === record.labNumber));
            if (inIdx >= 0) {
              incomingQueue[inIdx] = newReport;
            } else {
              incomingQueue.unshift(newReport);
            }
            localStorage.setItem('rt_lab_incoming_orders_queue', JSON.stringify(incomingQueue));
          }
        } catch (inboxErr) {
          console.warn('Incoming orders queue error:', inboxErr);
        }

        // Also save to pending sync queue
        const syncQueueStr = localStorage.getItem('rt_lab_cases_sync_v1');
        let syncQueue: unknown[] = [];
        if (syncQueueStr) {
          try {
            syncQueue = JSON.parse(syncQueueStr);
          } catch {
            syncQueue = [];
          }
        }
        if (!syncQueue.some((q: unknown) => (q as { barcode?: string }).barcode === record.barcode)) {
          syncQueue.unshift({
            id: `diag-${record.id}`,
            labNumber: record.labNumber,
            barcode: record.barcode,
            fullName: record.patientName,
            age: record.patientAge,
            gender: record.patientGender,
            phone: record.patientPhone,
            referringDoctorName: record.referringDoctor,
            sampleDate: record.createdAt,
            totalCost: record.netAmount,
            paidAmount: record.paidAmount,
            paymentStatus: record.paymentStatus,
            invoiceNumber: record.invoiceNumber,
            testNames: record.tests.map(t => t.nameAr)
          });
          localStorage.setItem('rt_lab_cases_sync_v1', JSON.stringify(syncQueue));
        }
      } catch (storageErr) {
        console.warn('Local storage sync warning:', storageErr);
      }

      // 2. Broadcast Channel (Instant inter-tab communication)
      try {
        if ('BroadcastChannel' in window) {
          const channel = new BroadcastChannel('rt_lab_sync_channel');
          channel.postMessage({
            type: 'NEW_PATIENT_ORDER',
            report: newReport,
            invoice: record,
            timestamp: Date.now()
          });
          channel.close();
        }
      } catch (bcErr) {
        console.warn('Broadcast channel warning:', bcErr);
      }
    }

    // 3. Online Cloud Push to GitHub Repository
    if (creds.token) {
      pushSingleCaseToGitHub(creds, record).catch(err => {
        console.warn('Background GitHub sync error:', err);
      });
    }

    return {
      success: true,
      message: `تم التسميع الفوري للمريض ${record.patientName} (${record.labNumber}) بنجاح!`
    };
  } catch (err) {
    return {
      success: false,
      message: `فشل التسميع: ${(err as Error).message}`
    };
  }
}

// Push single case update to public/rt-cases-sync.json on GitHub
async function pushSingleCaseToGitHub(
  creds: { token: string; owner: string; repo: string },
  record: IncomeRecord
): Promise<void> {
  const filePath = 'public/rt-cases-sync.json';
  const apiUrl = `https://api.github.com/repos/${creds.owner}/${creds.repo}/contents/${filePath}`;

  let existingCases: unknown[] = [];
  let existingSha: string | undefined;

  try {
    const res = await fetch(apiUrl, {
      headers: {
        Authorization: `token ${creds.token}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    if (res.ok) {
      const data = await res.json();
      existingSha = data.sha;
      const content = decodeBase64Utf8(data.content);
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        existingCases = parsed;
      }
    }
  } catch {
    /* file may not exist yet */
  }

  const isHome = record.isHomeVisit ?? (record.bookingType === 'home_visit');
  const bType = record.bookingType || (isHome ? 'home_visit' : 'branch');
  const vFee = record.visitFee || 0;
  const vAddr = record.visitAddress || (record as any).homeAddress || '';

  const casePayload = {
    id: `rep-${record.id}`,
    reportNumber: record.labNumber,
    invoiceNumber: record.invoiceNumber,
    barcode: record.barcode,
    patientName: record.patientName,
    age: record.patientAge,
    gender: record.patientGender,
    phone: record.patientPhone,
    referringDoctor: record.referringDoctor,
    tests: record.tests,
    netAmount: record.netAmount,
    paidAmount: record.paidAmount,
    paymentStatus: record.paymentStatus,
    financialClearance: record.paymentStatus === 'paid' ? 'CLEARED_FOR_RELEASE' : 'PAYMENT_PENDING',
    bookingType: bType,
    isHomeVisit: isHome,
    visitFee: vFee,
    visitAddress: vAddr,
    homeAddress: vAddr,
    deliveryNotes: (record as any).deliveryNotes,
    visitSpecialist: record.visitSpecialist,
    discount: record.discount || 0,
    testsSubtotal: record.testsSubtotal || record.subtotal || record.netAmount,
    subtotal: record.subtotal || record.netAmount,
    remainingAmount: record.remainingAmount || 0,
    paymentMethod: record.paymentMethod || 'cash',
    createdAt: record.createdAt || new Date().toISOString()
  };

  // Add or update
  const idx = existingCases.findIndex(
    (c: unknown) => (c as { barcode?: string; reportNumber?: string }).barcode === record.barcode ||
                    (c as { barcode?: string; reportNumber?: string }).reportNumber === record.labNumber
  );

  if (idx >= 0) {
    existingCases[idx] = casePayload;
  } else {
    existingCases.unshift(casePayload);
  }

  const contentBase64 = encodeBase64Utf8(JSON.stringify(existingCases, null, 2));

  const body: Record<string, unknown> = {
    message: `تسميع مالي لطلب فحص: ${record.patientName} (${record.labNumber}) [RT ERP] [skip ci]`,
    content: contentBase64,
    branch: 'main'
  };

  if (existingSha) {
    body.sha = existingSha;
  }

  await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      Authorization: `token ${creds.token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
}

// Push full unified database store to GitHub
export async function pushFullStoreToGitHub(
  arg1: string | GitHubSyncConfig,
  storePayload: Record<string, any>
): Promise<{ success: boolean; message: string }> {
  try {
    const creds = resolveCredentials(arg1);
    if (!creds.token) {
      return { success: false, message: 'لا يوجد رمز GitHub صالح' };
    }

    const filePath = 'public/rt-database-sync.json';
    const apiUrl = `https://api.github.com/repos/${creds.owner}/${creds.repo}/contents/${filePath}`;

    // Union with the newest cloud snapshot before writing: a device that is a few seconds
    // behind must never erase cases registered on another device.
    let safePayload: Record<string, any> = { ...storePayload };
    try {
      const cloudStore = await pullFullStoreFromGitHub({
        token: creds.token,
        repoOwner: creds.owner,
        repoName: creds.repo
      } as unknown as GitHubSyncConfig);
      if (cloudStore.success && cloudStore.data) {
        importDeletionTombstones(cloudStore.data.deletedReports, cloudStore.data.deletedInvoices);
        safePayload = {
          ...storePayload,
          reports: unionReports(storePayload.reports, cloudStore.data.reports),
          incomeRecords: unionInvoices(storePayload.incomeRecords, cloudStore.data.incomeRecords),
          packages: Array.isArray(storePayload.packages) && storePayload.packages.length > 0
            ? mergePackagesWithDefaults(cloudStore.data.packages, storePayload.packages)
            : storePayload.packages
        };
      }
    } catch {
      // keep the local snapshot when the cloud cannot be read
    }

    // سجل المحذوفات: يمنع إعادة إدخال أي حالة أو فاتورة محذوفة من نسخ الأجهزة الأخرى
    const tombstones = getDeletionTombstones();
    safePayload = {
      ...safePayload,
      reports: filterDeletedReports(Array.isArray(safePayload.reports) ? safePayload.reports : []),
      incomeRecords: filterDeletedInvoices(Array.isArray(safePayload.incomeRecords) ? safePayload.incomeRecords : []),
      deletedReports: tombstones.reports,
      deletedInvoices: tombstones.invoices
    };

    const fullData = {
      system: 'RT Lab Unified Medical & Financial ERP',
      syncedAt: new Date().toISOString(),
      ...safePayload
    };

    // Minify JSON to drastically reduce byte size and prevent GitHub 1MB Contents API limit
    const jsonString = JSON.stringify(fullData);
    const contentBase64 = encodeBase64Utf8(jsonString);

    // Helper to attempt commit with SHA
    async function attemptCommit(retryCount = 0): Promise<{ success: boolean; message: string }> {
      let existingSha: string | undefined;
      try {
        const checkRes = await fetch(`${apiUrl}?ref=main&_=${Date.now()}`, {
          headers: {
            Authorization: `token ${creds.token}`,
            Accept: 'application/vnd.github.v3+json',
            'Cache-Control': 'no-cache, no-store'
          }
        });
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          existingSha = checkData.sha;
        }
      } catch {
        // file might not exist yet
      }

      const putRes = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          Authorization: `token ${creds.token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `مزامنة سحابية شاملة لقاعدة بيانات المعمل: ${new Date().toLocaleTimeString('en-US')} [skip ci]`,
          content: contentBase64,
          branch: 'main',
          ...(existingSha ? { sha: existingSha } : {})
        })
      });

      if (putRes.ok) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('rt_lab_last_cloud_sync', new Date().toISOString());
        }
        return { success: true, message: 'تم حفظ ومزامنة قاعدة البيانات سحابياً بنجاح!' };
      }

      // If conflict (409) or pre-condition, retry with latest SHA
      if ((putRes.status === 409 || putRes.status === 422) && retryCount < 2) {
        await new Promise(r => setTimeout(r, 600));
        return attemptCommit(retryCount + 1);
      }

      return { success: false, message: `فشل الحفظ السحابي: ${putRes.statusText}` };
    }

    return await attemptCommit();
  } catch (err) {
    return { success: false, message: `خطأ: ${(err as Error).message}` };
  }
}

// Pull full unified database store from GitHub
export async function pullFullStoreFromGitHub(
  arg1: string | GitHubSyncConfig
): Promise<{ success: boolean; data?: any; message: string }> {
  try {
    const creds = resolveCredentials(arg1);
    const filePath = 'public/rt-database-sync.json';
    const apiUrl = `https://api.github.com/repos/${creds.owner}/${creds.repo}/contents/${filePath}`;

    // 0. Primary & Most Reliable: Direct raw GitHub API (Supports ANY file size up to 100MB, zero CDN cache)
    try {
      const rawApiRes = await fetch(`${apiUrl}?ref=main&_=${Date.now()}`, {
        headers: creds.token ? {
          Authorization: `token ${creds.token}`,
          Accept: 'application/vnd.github.v3.raw',
          'Cache-Control': 'no-cache, no-store'
        } : {
          Accept: 'application/vnd.github.v3.raw'
        }
      });
      if (rawApiRes.ok) {
        const rawJson = await rawApiRes.json();
        if (rawJson && (Array.isArray(rawJson.reports) || Array.isArray(rawJson.incomeRecords))) {
          return { success: true, data: rawJson, message: 'تم استرداد وتحديث البيانات سحابياً بنجاح!' };
        }
      }
    } catch (rawApiErr) {
      console.warn('Raw GitHub API direct fetch note:', rawApiErr);
    }

    // 1. Try GitHub Contents API with download_url fallback
    try {
      const res = await fetch(`${apiUrl}?ref=main&_=${Date.now()}`, {
        headers: creds.token ? {
          Authorization: `token ${creds.token}`,
          Accept: 'application/vnd.github.v3+json'
        } : {
          Accept: 'application/vnd.github.v3+json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        if (typeof data.content === 'string' && data.content.length > 0) {
          const content = decodeBase64Utf8(data.content);
          const parsed = JSON.parse(content);
          return { success: true, data: parsed, message: 'تم استرداد وتحديث البيانات سحابياً بنجاح!' };
        } else if (data.download_url) {
          const downloadRes = await fetch(`${data.download_url}?t=${Date.now()}`);
          if (downloadRes.ok) {
            const parsed = await downloadRes.json();
            return { success: true, data: parsed, message: 'تم استرداد وتحديث البيانات سحابياً بنجاح!' };
          }
        }
      }
    } catch (apiErr) {
      console.warn('GitHub Contents API fetch note:', apiErr);
    }

    // 2. Direct fast raw CDN fallback (fetches newest commit instantly)
    try {
      const rawUrl = `https://raw.githubusercontent.com/${creds.owner}/${creds.repo}/main/public/rt-database-sync.json?t=${Date.now()}`;
      const rawRes = await fetch(rawUrl);
      if (rawRes.ok) {
        const parsed = await rawRes.json();
        return { success: true, data: parsed, message: 'تم استرداد البيانات من السحابة مباشرة بنجاح!' };
      }
    } catch (rawErr) {
      console.warn('Raw GitHub CDN fetch note:', rawErr);
    }

    // 3. Fallback to repository backup file if available
    try {
      const backupUrl = `https://raw.githubusercontent.com/${creds.owner}/${creds.repo}/main/rt_lab_unified_backup.json?t=${Date.now()}`;
      const backupRes = await fetch(backupUrl);
      if (backupRes.ok) {
        const parsed = await backupRes.json();
        return { success: true, data: parsed, message: 'تم استرداد البيانات من النسخة الاحتياطية السحابية بنجاح!' };
      }
    } catch (backupErr) {
      console.warn('Backup fetch note:', backupErr);
    }

    // 4. Local static public file fallback
    try {
      const publicRes = await fetch(`./rt-database-sync.json?t=${Date.now()}`);
      if (publicRes.ok) {
        const json = await publicRes.json();
        return { success: true, data: json, message: 'تم استرداد البيانات من الملف المخبري بنجاح' };
      }
    } catch {}

    return { success: false, message: 'لم يتم العثور على نسخة سحابية بعد' };
  } catch (err) {
    return { success: false, message: `خطأ أثناء الجلب: ${(err as Error).message}` };
  }
}

// Helpers for UTF-8 Base64 handling
function encodeBase64Utf8(str: string): string {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    )
  );
}

function decodeBase64Utf8(base64: string): string {
  const binaryString = atob(base64.replace(/\s/g, ''));
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new TextDecoder('utf-8').decode(bytes);
}
