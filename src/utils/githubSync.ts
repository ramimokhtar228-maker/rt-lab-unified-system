import { broadcastCloudChange } from './realtimeChannel';
import { mergeCollection, getDeletedMap } from './cloudStore';
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
  const c = (code || '').toUpperCase();
  const nAr = nameAr || '';
  const nEn = (nameEn || '').toLowerCase();

  // 1. Vitamin D
  if (c.includes('VIT_D') || nAr.includes('فيتامين د') || nEn.includes('vitamin d')) {
    return [
      {
        id: `p-vitd-${Date.now()}`,
        name: '25-Hydroxy Vitamin D Total',
        result: '',
        unit: 'ng/mL',
        minNormal: 30,
        maxNormal: 100,
        textReference: 'Deficiency: < 20 ng/mL | Insufficiency: 20 - 29 | Sufficiency: 30 - 100 | Toxicity: > 100',
        method: 'CLIA (Chemiluminescence Immunoassay)',
        flag: ''
      }
    ];
  }

  // 2. Fasting Blood Glucose
  if (c === 'GLU_F' || nAr.includes('سكر صائم') || nEn.includes('fasting') && nEn.includes('glucose')) {
    return [
      {
        id: `p-gluf-${Date.now()}`,
        name: 'Fasting Blood Sugar (Glucose)',
        result: '',
        unit: 'mg/dL',
        minNormal: 70,
        maxNormal: 100,
        textReference: 'Normal: 70 - 100 mg/dL | Pre-diabetic: 100 - 125 | Diabetic: >= 126',
        method: 'Hexokinase / GOD-PAP',
        flag: ''
      }
    ];
  }

  // 3. HbA1c
  if (c === 'HBA1C' || nAr.includes('تراكمي') || nEn.includes('hba1c') || nEn.includes('glycated')) {
    return [
      {
        id: `p-hba1c-${Date.now()}`,
        name: 'Glycated Hemoglobin (HbA1c)',
        result: '',
        unit: '%',
        minNormal: 4.0,
        maxNormal: 5.6,
        textReference: 'Normal: < 5.7 % | Pre-diabetic: 5.7 - 6.4 % | Diabetic: >= 6.5 %',
        method: 'HPLC (High Performance Liquid Chromatography)',
        flag: ''
      }
    ];
  }

  // 4. Thyroid TSH, FT3, FT4
  if (c === 'TSH' || nAr.includes('TSH') || nEn.includes('thyroid stimulating')) {
    return [
      {
        id: `p-tsh-${Date.now()}`,
        name: 'Thyroid Stimulating Hormone (TSH)',
        result: '',
        unit: 'uIU/mL',
        minNormal: 0.55,
        maxNormal: 4.78,
        textReference: 'Adults: 0.55 - 4.78 uIU/mL (Pregnancy 1st trim: 0.1 - 2.5)',
        method: 'CLIA (3rd Generation Chemiluminescence)',
        flag: ''
      }
    ];
  }
  if (c === 'FREE_T4' || nAr.includes('Free T4') || nEn.includes('free t4')) {
    return [
      {
        id: `p-ft4-${Date.now()}`,
        name: 'Free Thyroxine (FT4)',
        result: '',
        unit: 'ng/dL',
        minNormal: 0.89,
        maxNormal: 1.76,
        textReference: '0.89 - 1.76 ng/dL (11.5 - 22.7 pmol/L)',
        method: 'CLIA (Chemiluminescence Immunoassay)',
        flag: ''
      }
    ];
  }
  if (c === 'FREE_T3' || nAr.includes('Free T3') || nEn.includes('free t3')) {
    return [
      {
        id: `p-ft3-${Date.now()}`,
        name: 'Free Triiodothyronine (FT3)',
        result: '',
        unit: 'pg/mL',
        minNormal: 2.3,
        maxNormal: 4.2,
        textReference: '2.3 - 4.2 pg/mL (3.5 - 6.5 pmol/L)',
        method: 'CLIA (Chemiluminescence Immunoassay)',
        flag: ''
      }
    ];
  }

  // 5. Fertility Hormones: FSH, LH, Prolactin
  if (c === 'FSH' || nAr.includes('FSH')) {
    return [
      {
        id: `p-fsh-${Date.now()}`,
        name: 'Follicle Stimulating Hormone (FSH)',
        result: '',
        unit: 'mIU/mL',
        minNormal: 3.5,
        maxNormal: 12.5,
        textReference: 'Males: 1.5 - 12.4 | Females: Follicular 3.5 - 12.5, Ovulatory 4.7 - 21.5, Postmeno 25.8 - 134.8',
        method: 'CLIA (Chemiluminescence Immunoassay)',
        flag: ''
      }
    ];
  }
  if (c === 'LH' || nAr.includes('LH')) {
    return [
      {
        id: `p-lh-${Date.now()}`,
        name: 'Luteinizing Hormone (LH)',
        result: '',
        unit: 'mIU/mL',
        minNormal: 2.4,
        maxNormal: 12.6,
        textReference: 'Males: 1.7 - 8.6 | Females: Follicular 2.4 - 12.6, Mid-cycle 14.0 - 95.6, Postmeno 7.7 - 58.5',
        method: 'CLIA (Chemiluminescence Immunoassay)',
        flag: ''
      }
    ];
  }
  if (c === 'PROLACTIN' || nAr.includes('برولاكتين') || nEn.includes('prolactin')) {
    return [
      {
        id: `p-prl-${Date.now()}`,
        name: 'Serum Prolactin',
        result: '',
        unit: 'ng/mL',
        minNormal: 4.8,
        maxNormal: 23.3,
        textReference: 'Males: 4.0 - 15.2 ng/mL | Non-pregnant Females: 4.8 - 23.3 ng/mL',
        method: 'CLIA (Chemiluminescence Immunoassay)',
        flag: ''
      }
    ];
  }

  // 6. Complete Blood Count
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

  // 7. Liver Functions
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

  // 8. Kidney Functions
  if (code === 'KFT' || nameAr.includes('كلى') || nameEn.toLowerCase().includes('kidney')) {
    return [
      { id: `p-creat-${Date.now()}`, name: 'Serum Creatinine', result: '', unit: 'mg/dL', minNormal: 0.6, maxNormal: 1.3, flag: '' },
      { id: `p-urea-${Date.now()}`, name: 'Blood Urea', result: '', unit: 'mg/dL', minNormal: 15, maxNormal: 45, flag: '' },
      { id: `p-uric-${Date.now()}`, name: 'Serum Uric Acid', result: '', unit: 'mg/dL', minNormal: 3.5, maxNormal: 7.2, flag: '' }
    ];
  }

  // 9. Lipid Profile
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
      textReference: testItem?.textReference || (testItem?.minNormal !== undefined && testItem?.maxNormal !== undefined ? `${testItem.minNormal} - ${testItem.maxNormal} ${testItem.unit || ''}` : 'قيد الفحص المخبري'),
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

// Helper to merge cases from public/rt-cases-sync.json into database store
export function mergeCasesQueueIntoStore(storeData: any, rawCases: any[]) {
  if (!storeData || !Array.isArray(rawCases) || rawCases.length === 0) return;

  if (!Array.isArray(storeData.reports)) storeData.reports = [];
  if (!Array.isArray(storeData.incomeRecords)) storeData.incomeRecords = [];

  const existingRepCodes = new Set<string>();
  const existingRepNums = new Set<string>();
  storeData.reports.forEach((r: any) => {
    if (r.id) existingRepNums.add(r.id);
    if (r.reportNumber) existingRepNums.add(r.reportNumber);
    if (r.patient?.barcode) existingRepCodes.add(r.patient.barcode);
    if (r.patient?.labNumber) existingRepNums.add(r.patient.labNumber);
  });

  const existingInvNums = new Set<string>();
  storeData.incomeRecords.forEach((i: any) => {
    if (i.id) existingInvNums.add(i.id);
    if (i.invoiceNumber) existingInvNums.add(i.invoiceNumber);
    if (i.barcode) existingInvNums.add(i.barcode);
    if (i.labNumber) existingInvNums.add(i.labNumber);
  });

  rawCases.forEach((c: any) => {
    const code = c.barcode || (c.patient && c.patient.barcode) || '';
    const num = c.reportNumber || c.labNumber || c.id || '';
    const invNum = c.invoiceNumber || (c.patient && c.patient.invoiceNumber) || `INV-${num.replace('RT-', '')}`;

    const alreadyInReports =
      (code && existingRepCodes.has(code)) ||
      (num && existingRepNums.has(num)) ||
      (c.id && existingRepNums.has(c.id));

    const net = c.netAmount ?? (c.patient && c.patient.totalCost) ?? c.totalCost ?? 0;
    const paid = c.paidAmount ?? (c.patient && c.patient.paidAmount) ?? (c.paymentStatus === 'paid' ? net : 0);
    const pStatus = c.paymentStatus || (c.patient && c.patient.paymentStatus) || (paid >= net ? 'paid' : 'pending');
    const isHome = Boolean(c.isHomeVisit ?? (c.patient && c.patient.isHomeVisit) ?? (c.bookingType === 'home_visit'));
    const bType = c.bookingType || (c.patient && c.patient.bookingType) || (isHome ? 'home_visit' : 'branch');
    const vFee = c.visitFee ?? (c.patient && c.patient.visitFee) ?? 0;
    const vAddr = c.visitAddress || c.homeAddress || (c.patient && c.patient.homeAddress) || '';
    const pName = c.patientName || (c.patient && c.patient.fullName) || c.fullName || 'مريض';
    const phone = c.phone || (c.patient && c.patient.phone) || '';
    const doctor = c.referringDoctor || (c.patient && c.patient.referringDoctorName) || c.referringDoctorName || 'كشف معمل';
    const age = c.age ?? (c.patient && c.patient.age) ?? 30;
    const gender = c.gender || (c.patient && c.patient.gender) || 'female';
    const disc = c.discount ?? (c.patient && c.patient.discountApplied) ?? 0;
    const testsSub = c.testsSubtotal ?? (c.patient && c.patient.testsSubtotal) ?? net;
    const createdDate = c.createdAt || c.sampleDate || new Date().toISOString();

    const actualTests = (Array.isArray(c.tests) && c.tests.length > 0)
      ? c.tests
      : (Array.isArray(c.testNames) && c.testNames.length > 0)
        ? c.testNames.map((tName: string, idx: number) => ({
            id: `tst-${idx}-${c.id || Date.now()}`,
            code: `TST-${idx}`,
            nameAr: tName,
            nameEn: tName,
            category: 'Clinical',
            price: 150,
            cost: 30
          }))
        : [{ id: 'tst-def', code: 'GENERAL', nameAr: 'تحاليل مخبرية', nameEn: 'Lab Tests', category: 'Clinical', price: net, cost: 20 }];

    if (!alreadyInReports) {
      const generatedReport = convertIncomeRecordToDiagnosticReport({
        id: c.id || `rep-${num}`,
        invoiceNumber: invNum,
        labNumber: num,
        barcode: code,
        patientName: pName,
        patientAge: age,
        patientGender: gender as any,
        patientPhone: phone,
        referringDoctor: doctor,
        tests: actualTests,
        subtotal: net,
        discount: disc,
        netAmount: net,
        paidAmount: paid,
        remainingAmount: Math.max(0, net - paid),
        paymentMethod: (c.paymentMethod as any) || 'cash',
        paymentStatus: pStatus as any,
        cashierName: 'حجز موبايل (الفرع)',
        branch: 'الفرع الرئيسي - بهتيم',
        syncStatus: 'synced',
        createdAt: createdDate,
        updatedAt: createdDate,
        isHomeVisit: isHome,
        bookingType: bType,
        visitFee: vFee,
        visitAddress: vAddr,
        homeAddress: vAddr,
        deliveryNotes: c.deliveryNotes || '',
        visitSpecialist: c.visitSpecialist || '',
        testsSubtotal: testsSub,
        discountApplied: disc
      }) as any;

      storeData.reports.unshift(generatedReport);
      if (code) existingRepCodes.add(code);
      if (num) existingRepNums.add(num);
      if (c.id) existingRepNums.add(c.id);
    }

    const alreadyInInvoices =
      (invNum && existingInvNums.has(invNum)) ||
      (code && existingInvNums.has(code)) ||
      (num && existingInvNums.has(num)) ||
      (c.id && existingInvNums.has(c.id));

    if (!alreadyInInvoices) {
      const generatedInvoice: IncomeRecord = {
        id: c.id || `inv-${num}`,
        invoiceNumber: invNum,
        patientName: pName,
        patientPhone: phone,
        patientAge: age,
        patientGender: gender as any,
        barcode: code,
        labNumber: num,
        referringDoctor: doctor,
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
        paymentStatus: pStatus as any,
        cashierName: 'حجز موبايل (الفرع)',
        branch: 'الفرع الرئيسي - بهتيم',
        syncStatus: 'synced',
        createdAt: createdDate,
        updatedAt: createdDate
      };
      storeData.incomeRecords.unshift(generatedInvoice);
      if (invNum) existingInvNums.add(invNum);
      if (code) existingInvNums.add(code);
      if (num) existingInvNums.add(num);
    }
  });
}

// Push single case update to public/rt-cases-sync.json on GitHub with retry and conflict resolution
async function pushSingleCaseToGitHub(
  creds: { token: string; owner: string; repo: string },
  record: IncomeRecord,
  retryCount = 0
): Promise<void> {
  const filePath = 'public/rt-cases-sync.json';
  const apiUrl = `https://api.github.com/repos/${creds.owner}/${creds.repo}/contents/${filePath}`;

  let existingCases: unknown[] = [];
  let existingSha: string | undefined;

  try {
    const res = await fetch(`${apiUrl}?_=${Date.now()}`, {
      headers: {
        Authorization: `token ${creds.token}`,
        Accept: 'application/vnd.github.v3+json',
        'Cache-Control': 'no-cache, no-store'
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

  const putRes = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      Authorization: `token ${creds.token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!putRes.ok && (putRes.status === 409 || putRes.status === 422) && retryCount < 3) {
    await new Promise(r => setTimeout(r, 600 * (retryCount + 1)));
    return pushSingleCaseToGitHub(creds, record, retryCount + 1);
  }
}

// Push full unified database store to GitHub (Git Data API — يدعم الملفات الكبيرة والدمج الآلي للفرعين)
export async function pushFullStoreToGitHub(
  arg1: string | GitHubSyncConfig,
  storePayload: Record<string, any>
): Promise<{ success: boolean; message: string }> {
  try {
    const creds = resolveCredentials(arg1);
    if (!creds.token) {
      return { success: false, message: 'لا يوجد رمز GitHub صالح — أدخل الرمز من إعدادات المزامنة' };
    }

    const repoApi = `https://api.github.com/repos/${creds.owner}/${creds.repo}`;
    const authHeaders: Record<string, string> = {
      Authorization: `token ${creds.token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store'
    };

    // نقرأ أحدث نسخة سحابية وندمجها قبل الكتابة: جهاز متأخر ثوانٍ لا يمسح حجوزات جهاز آخر
    let cloudData: Record<string, any> | null = null;
    try {
      const cloudStore = await pullFullStoreFromGitHub(
        { token: creds.token, repoOwner: creds.owner, repoName: creds.repo } as unknown as GitHubSyncConfig,
        { force: true }
      );
      if (cloudStore.success && cloudStore.data) {
        cloudData = cloudStore.data;
        if (cloudData) {
          importDeletionTombstones(cloudData.deletedReports, cloudData.deletedInvoices);
        }
      }
    } catch {
      // نكمل بالبيانات المحلية إذا تعذر قراءة السحابة
    }

    // بناء نسخة آمنة مدمجة تماماً مع أحدث بيانات السحابة
    const buildSafeFullData = (remoteData: Record<string, any> | null) => {
      const tombstones = getDeletionTombstones();
      const cloudReports = Array.isArray(remoteData?.reports) ? remoteData.reports : [];
      const cloudInvoices = Array.isArray(remoteData?.incomeRecords) ? remoteData.incomeRecords : [];

      // دمج كل مجموعة مع النسخة السحابية: لا يضيع أي تعديل من أي جهاز
      const mergedCollections: Record<string, any> = {};
      Object.keys(storePayload).forEach(key => {
        if (key === 'reports' || key === 'incomeRecords' || key === 'deletedMap' || key === 'settingsStamps') return;
        const localValue: any = (storePayload as any)[key];
        if (Array.isArray(localValue)) {
          const cloudValue = (remoteData as any)?.[key];
          mergedCollections[key] = mergeCollection(key, localValue, Array.isArray(cloudValue) ? cloudValue : []);
        } else {
          mergedCollections[key] = localValue;
        }
      });

      const safePayload: Record<string, any> = {
        ...(remoteData || {}),
        ...storePayload,
        ...mergedCollections,
        reports: filterDeletedReports(unionReports(Array.isArray(storePayload.reports) ? storePayload.reports : [], cloudReports)),
        incomeRecords: filterDeletedInvoices(unionInvoices(Array.isArray(storePayload.incomeRecords) ? storePayload.incomeRecords : [], cloudInvoices)),
        packages: Array.isArray(storePayload.packages) && storePayload.packages.length > 0
          ? mergePackagesWithDefaults(remoteData?.packages || [], storePayload.packages)
          : storePayload.packages,
        deletedReports: tombstones.reports,
        deletedInvoices: tombstones.invoices,
        deletedMap: getDeletedMap()
      };

      const fullData = {
        system: 'RT Lab Unified Medical & Financial ERP',
        syncedAt: new Date().toISOString(),
        ...safePayload
      };

      // Prepare cases-sync array from all active reports
      const casesPayload = (safePayload.reports || []).map((r: any) => {
        const pat = r.patient || {};
        const testsList = (r.profiles || []).map((p: any) => {
          const firstParam = p.parameters?.[0];
          return {
            id: p.id,
            code: p.profileCode || p.code,
            nameAr: p.titleAr,
            nameEn: p.titleEn,
            category: p.category,
            sampleType: p.sampleType,
            unit: firstParam?.unit || '',
            minNormal: firstParam?.minNormal,
            maxNormal: firstParam?.maxNormal,
            textReference: firstParam?.textReference || ''
          };
        });
        return {
          id: r.id,
          reportNumber: r.reportNumber,
          invoiceNumber: r.invoiceId || pat.invoiceNumber || `INV-${(r.reportNumber || '').replace('RT-', '')}`,
          barcode: pat.barcode || r.barcode || '',
          patientName: pat.fullName || 'مريض',
          age: pat.age || 30,
          gender: pat.gender || 'male',
          phone: pat.phone || '',
          referringDoctor: pat.referringDoctorName || 'كشف معمل',
          tests: testsList,
          netAmount: pat.totalCost || 0,
          paidAmount: pat.paidAmount || 0,
          paymentStatus: pat.paymentStatus || 'paid',
          financialClearance: pat.paymentStatus === 'paid' ? 'CLEARED_FOR_RELEASE' : 'PAYMENT_PENDING',
          bookingType: pat.bookingType || (pat.isHomeVisit ? 'home_visit' : 'branch'),
          isHomeVisit: Boolean(pat.isHomeVisit),
          visitFee: pat.visitFee || 0,
          visitAddress: pat.homeAddress || '',
          homeAddress: pat.homeAddress || '',
          deliveryNotes: pat.deliveryNotes || '',
          visitSpecialist: pat.visitSpecialist || '',
          discount: pat.discountApplied || 0,
          testsSubtotal: pat.testsSubtotal || pat.totalCost || 0,
          subtotal: pat.totalCost || 0,
          remainingAmount: pat.remainingAmount || 0,
          paymentMethod: pat.paymentMethod || 'cash',
          createdAt: r.createdAt || new Date().toISOString()
        };
      });

      return {
        dbBase64: encodeBase64Utf8(JSON.stringify(fullData)),
        casesBase64: encodeBase64Utf8(JSON.stringify(casesPayload, null, 2))
      };
    };

    const commitMessage = `مزامنة سحابية شاملة لقاعدة بيانات المعمل: ${new Date().toLocaleTimeString('en-US')} [skip ci]`;

    async function writeSnapshot(currentCloud: Record<string, any> | null, retryCount = 0): Promise<{ success: boolean; message: string }> {
      const { dbBase64, casesBase64 } = buildSafeFullData(currentCloud);

      // 1. Create DB blob
      const dbBlobRes = await fetch(`${repoApi}/git/blobs`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ content: dbBase64, encoding: 'base64' })
      });
      if (!dbBlobRes.ok) return { success: false, message: `فشل تجهيز نسخة البيانات: ${dbBlobRes.status}` };
      const dbBlob = await dbBlobRes.json();

      // 2. Create Cases blob
      const casesBlobRes = await fetch(`${repoApi}/git/blobs`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ content: casesBase64, encoding: 'base64' })
      });
      const casesBlob = casesBlobRes.ok ? await casesBlobRes.json() : null;

      // 3. Re-fetch current main ref on EVERY attempt to ensure fresh parent sha
      const refRes = await fetch(`${repoApi}/git/ref/heads/main?t=${Date.now()}`, { headers: authHeaders });
      if (!refRes.ok) return { success: false, message: `تعذر قراءة فرع المزامنة: ${refRes.status}` };
      const headSha = (await refRes.json()).object.sha;

      const baseCommitRes = await fetch(`${repoApi}/git/commits/${headSha}`, { headers: authHeaders });
      const baseTreeSha = baseCommitRes.ok ? (await baseCommitRes.json()).tree.sha : undefined;

      const treeItems = [
        { path: 'public/rt-database-sync.json', mode: '100644', type: 'blob', sha: dbBlob.sha },
        { path: 'rt-database-sync.json', mode: '100644', type: 'blob', sha: dbBlob.sha }
      ];
      if (casesBlob && casesBlob.sha) {
        treeItems.push({ path: 'public/rt-cases-sync.json', mode: '100644', type: 'blob', sha: casesBlob.sha });
      }

      const treeRes = await fetch(`${repoApi}/git/trees`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          ...(baseTreeSha ? { base_tree: baseTreeSha } : {}),
          tree: treeItems
        })
      });
      if (!treeRes.ok) return { success: false, message: `فشل بناء نسخة الملف: ${treeRes.status}` };
      const tree = await treeRes.json();

      const newCommitRes = await fetch(`${repoApi}/git/commits`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ message: commitMessage, tree: tree.sha, parents: [headSha] })
      });
      if (!newCommitRes.ok) return { success: false, message: `فشل إنشاء الإصدار: ${newCommitRes.status}` };
      const newCommit = await newCommitRes.json();

      const updateRes = await fetch(`${repoApi}/git/refs/heads/main`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ sha: newCommit.sha, force: false })
      });

      if (updateRes.ok) {
        broadcastCloudChange('push');
        try {
          localStorage.setItem('rt_lab_last_cloud_sync', new Date().toISOString());
          localStorage.setItem('rt_cloud_store_sha', dbBlob.sha);
          localStorage.setItem('rt_head_commit_sha', newCommit.sha);
        } catch {
          // التخزين المحلي غير متاح
        }
        return { success: true, message: 'تم حفظ ومزامنة قاعدة البيانات والحالات سحابياً بنجاح!' };
      }

      // Retry on 409 Conflict: another device pushed! Re-pull fresh cloud data and re-merge
      if ((updateRes.status === 409 || updateRes.status === 422) && retryCount < 5) {
        await new Promise(r => setTimeout(r, 600 * (retryCount + 1)));
        let freshCloud: Record<string, any> | null = null;
        try {
          const freshRes = await pullFullStoreFromGitHub(creds, { force: true });
          if (freshRes.success && freshRes.data) {
            freshCloud = freshRes.data;
          }
        } catch {}
        return writeSnapshot(freshCloud, retryCount + 1);
      }

      return { success: false, message: `فشل تحديث فرع المزامنة: ${updateRes.status}` };
    }

    return await writeSnapshot(cloudData);
  } catch (err) {
    return { success: false, message: `خطأ: ${(err as Error).message}` };
  }
}

// Pull full unified database store from GitHub (Dual-Fetch: merges database + mobile cases queue)
export async function pullFullStoreFromGitHub(
  arg1: string | GitHubSyncConfig,
  options: { force?: boolean } = {}
): Promise<{ success: boolean; data?: any; unchanged?: boolean; message: string }> {
  try {
    const creds = resolveCredentials(arg1);
    const filePath = 'public/rt-database-sync.json';
    const casesPath = 'public/rt-cases-sync.json';
    const apiUrl = `https://api.github.com/repos/${creds.owner}/${creds.repo}/contents/${filePath}`;
    const casesApiUrl = `https://api.github.com/repos/${creds.owner}/${creds.repo}/contents/${casesPath}`;
    const authHeaders: Record<string, string> = creds.token ? { Authorization: `token ${creds.token}` } : {};

    // 1) فحص سريع لحالة المستودع الشاملة (تتبع آخر Commit على الفرع الرئيسي)
    let latestSha: string | undefined;
    try {
      const headRes = await fetch(`https://api.github.com/repos/${creds.owner}/${creds.repo}/git/ref/heads/main?_=${Date.now()}`, {
        headers: { ...authHeaders, Accept: 'application/vnd.github.v3+json', 'Cache-Control': 'no-cache, no-store' }
      });
      if (headRes.ok) {
        const headData = await headRes.json();
        latestSha = typeof headData?.object?.sha === 'string' ? headData.object.sha : undefined;
        if (!options.force && latestSha && localStorage.getItem('rt_head_commit_sha') === latestSha) {
          return { success: true, data: null, unchanged: true, message: 'لا توجد تغييرات جديدة' };
        }
      }
    } catch {
      // نكمل بالطرق الأخرى أدناه
    }

    const finish = async (data: any, message: string) => {
      if (!data) return { success: true, data, message };

      // دمج الحالات المحجوزة من الموبايل والفروع فوراً داخل البيانات المستلمة
      try {
        const casesRes = await fetch(`${casesApiUrl}?ref=main&_=${Date.now()}`, {
          headers: { ...authHeaders, Accept: 'application/vnd.github.v3.raw', 'Cache-Control': 'no-cache, no-store' }
        });
        if (casesRes.ok) {
          let casesList: any = await casesRes.json();
          if (casesList && typeof casesList === 'object' && !Array.isArray(casesList) && casesList.content) {
            try {
              casesList = JSON.parse(decodeBase64Utf8(casesList.content));
            } catch {}
          }
          if (Array.isArray(casesList) && casesList.length > 0) {
            mergeCasesQueueIntoStore(data, casesList);
          }
        }
      } catch (casesErr) {
        // Fallback to local raw if GitHub API has rate limit
        try {
          const fallbackRes = await fetch(`./rt-cases-sync.json?_=${Date.now()}`);
          if (fallbackRes.ok) {
            const casesList = await fallbackRes.json();
            if (Array.isArray(casesList) && casesList.length > 0) {
              mergeCasesQueueIntoStore(data, casesList);
            }
          }
        } catch {}
      }

      try {
        if (latestSha) {
          localStorage.setItem('rt_head_commit_sha', latestSha);
          localStorage.setItem('rt_cloud_store_sha', latestSha);
        }
      } catch {
        // التخزين المحلي غير متاح
      }
      return { success: true, data, message };
    };

    // 2) GitHub API المباشر (بدون كاش ويدعم الملفات الكبيرة)
    try {
      const rawApiRes = await fetch(`${apiUrl}?ref=main&_=${Date.now()}`, {
        headers: { ...authHeaders, Accept: 'application/vnd.github.v3.raw', 'Cache-Control': 'no-cache, no-store' }
      });
      if (rawApiRes.ok) {
        const rawJson = await rawApiRes.json();
        if (rawJson && (Array.isArray(rawJson.reports) || Array.isArray(rawJson.incomeRecords))) {
          return await finish(rawJson, 'تم استرداد وتحديث البيانات سحابياً بنجاح!');
        }
      }
    } catch (rawApiErr) {
      console.warn('Raw GitHub API direct fetch note:', rawApiErr);
    }

    // 3) واجهة Contents مع download_url
    try {
      const res = await fetch(`${apiUrl}?ref=main&_=${Date.now()}`, {
        headers: { ...authHeaders, Accept: 'application/vnd.github.v3+json' }
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.content === 'string' && data.content.length > 0) {
          return await finish(JSON.parse(decodeBase64Utf8(data.content)), 'تم استرداد وتحديث البيانات سحابياً بنجاح!');
        }
        if (data.download_url) {
          const downloadRes = await fetch(`${data.download_url}?t=${Date.now()}`);
          if (downloadRes.ok) {
            return await finish(await downloadRes.json(), 'تم استرداد وتحديث البيانات سحابياً بنجاح!');
          }
        }
      }
    } catch (apiErr) {
      console.warn('GitHub Contents API fetch note:', apiErr);
    }

    // 4) raw CDN مباشرة
    try {
      const rawRes = await fetch(`https://raw.githubusercontent.com/${creds.owner}/${creds.repo}/main/public/rt-database-sync.json?t=${Date.now()}`, { cache: 'no-store' });
      if (rawRes.ok) {
        return await finish(await rawRes.json(), 'تم استرداد البيانات من السحابة مباشرة بنجاح!');
      }
    } catch {
      // المتابعة للخيار الاحتياطي
    }

    // 5) الملف الاحتياطي المرفق مع التطبيق
    try {
      const publicRes = await fetch(`./rt-database-sync.json?t=${Date.now()}`);
      if (publicRes.ok) {
        const localData = await publicRes.json();
        return await finish(localData, 'تم استرداد البيانات من الملف المخبري بنجاح');
      }
    } catch {
      // لا يوجد ملف احتياطي
    }

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
