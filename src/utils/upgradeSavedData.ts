import { LabReport, TestProfile, TestParameter, CatalogProfileTemplate, ComprehensivePackage, InvoiceTestItem, IndividualTest } from '../types/lab';
import { LAB_CATALOG, DEFAULT_STAFF, INITIAL_INDIVIDUAL_TESTS, INITIAL_LAB_INFO, INITIAL_PACKAGES } from '../data/labCatalog';
import { DISEASE_ILLUSTRATIONS, suggestHematologicalIllustration } from '../data/diseaseIllustrations';
import { runAutomaticCalculations } from './calculator';
import { cleanAtlasImageUrl } from './atlasImageUtils';

export const MIGRATION_VERSION_KEY = 'rt_lab_migration_v9_booking_sync_fix_2026';

export const DELETED_PROFILES_KEY = 'rt_lab_deleted_profile_codes_v1';
export const DELETED_TESTS_KEY = 'rt_lab_deleted_test_codes_v1';
export const DELETED_REPORTS_KEY = 'rt_lab_deleted_report_ids_v1';
export const DELETED_INCOMES_KEY = 'rt_lab_deleted_income_ids_v1';
export const DELETED_PACKAGES_KEY = 'rt_lab_deleted_package_ids_v1';
export const DELETED_LOYALTY_KEY = 'rt_lab_deleted_loyalty_ids_v1';
export const DELETED_EXPENSES_KEY = 'rt_lab_deleted_expense_ids_v1';
export const DELETED_INVENTORY_KEY = 'rt_lab_deleted_inventory_ids_v1';

export function getDeletedProfileCodes(): Set<string> {
  const set = new Set<string>();
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(DELETED_PROFILES_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) arr.forEach((c: string) => set.add(c.toUpperCase().trim()));
      }
    } catch {}
  }
  return set;
}

export function getDeletedTestCodes(): Set<string> {
  const set = new Set<string>();
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(DELETED_TESTS_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) arr.forEach((c: string) => set.add(c.toUpperCase().trim()));
      }
    } catch {}
  }
  return set;
}

export function getDeletedReportIds(): Set<string> {
  const set = new Set<string>();
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(DELETED_REPORTS_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) arr.forEach((c: string) => set.add(c.trim()));
      }
    } catch {}
  }
  return set;
}

export function getDeletedIncomeIds(): Set<string> {
  const set = new Set<string>();
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(DELETED_INCOMES_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) arr.forEach((c: string) => set.add(c.trim()));
      }
    } catch {}
  }
  return set;
}

export function getDeletedPackageIds(): Set<string> {
  const set = new Set<string>();
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(DELETED_PACKAGES_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) arr.forEach((c: string) => set.add(c.toUpperCase().trim()));
      }
    } catch {}
  }
  return set;
}

export function getDeletedLoyaltyIds(): Set<string> {
  const set = new Set<string>();
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(DELETED_LOYALTY_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) arr.forEach((c: string) => set.add(c.trim()));
      }
    } catch {}
  }
  return set;
}

export function getDeletedExpenseIds(): Set<string> {
  const set = new Set<string>();
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(DELETED_EXPENSES_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) arr.forEach((c: string) => set.add(c.trim()));
      }
    } catch {}
  }
  return set;
}

export function getDeletedInventoryIds(): Set<string> {
  const set = new Set<string>();
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(DELETED_INVENTORY_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) arr.forEach((c: string) => set.add(c.trim()));
      }
    } catch {}
  }
  return set;
}

export function recordDeletedProfileCode(code: string): void {
  if (typeof window !== 'undefined' && code) {
    try {
      const set = getDeletedProfileCodes();
      set.add(code.toUpperCase().trim());
      localStorage.setItem(DELETED_PROFILES_KEY, JSON.stringify(Array.from(set)));
    } catch {}
  }
}

export function recordDeletedTestCode(code: string): void {
  if (typeof window !== 'undefined' && code) {
    try {
      const set = getDeletedTestCodes();
      set.add(code.toUpperCase().trim());
      localStorage.setItem(DELETED_TESTS_KEY, JSON.stringify(Array.from(set)));
    } catch {}
  }
}

export function recordDeletedReportId(id: string): void {
  if (typeof window !== 'undefined' && id) {
    try {
      const set = getDeletedReportIds();
      set.add(id.trim());
      localStorage.setItem(DELETED_REPORTS_KEY, JSON.stringify(Array.from(set)));
    } catch {}
  }
}

export function recordDeletedIncomeId(id: string): void {
  if (typeof window !== 'undefined' && id) {
    try {
      const set = getDeletedIncomeIds();
      set.add(id.trim());
      localStorage.setItem(DELETED_INCOMES_KEY, JSON.stringify(Array.from(set)));
    } catch {}
  }
}

export function recordDeletedPackageId(id: string): void {
  if (typeof window !== 'undefined' && id) {
    try {
      const set = getDeletedPackageIds();
      set.add(id.toUpperCase().trim());
      localStorage.setItem(DELETED_PACKAGES_KEY, JSON.stringify(Array.from(set)));
    } catch {}
  }
}

export function recordDeletedLoyaltyId(id: string): void {
  if (typeof window !== 'undefined' && id) {
    try {
      const set = getDeletedLoyaltyIds();
      set.add(id.trim());
      localStorage.setItem(DELETED_LOYALTY_KEY, JSON.stringify(Array.from(set)));
    } catch {}
  }
}

export function recordDeletedExpenseId(id: string): void {
  if (typeof window !== 'undefined' && id) {
    try {
      const set = getDeletedExpenseIds();
      set.add(id.trim());
      localStorage.setItem(DELETED_EXPENSES_KEY, JSON.stringify(Array.from(set)));
    } catch {}
  }
}

export function recordDeletedInventoryId(id: string): void {
  if (typeof window !== 'undefined' && id) {
    try {
      const set = getDeletedInventoryIds();
      set.add(id.trim());
      localStorage.setItem(DELETED_INVENTORY_KEY, JSON.stringify(Array.from(set)));
    } catch {}
  }
}

/**
 * Merges any existing test catalog with the full default catalog (142 tests)
 * Preserves user modifications to prices/names, but guarantees all 142 tests are present
 * with rich medical reference data, units, turnaround times, and sample types.
 * Respects deleted tests so they never resurrect.
 */
export function mergeCatalogWithDefaults(savedCatalog?: InvoiceTestItem[]): InvoiceTestItem[] {
  const deletedCodes = getDeletedTestCodes();

  if (!Array.isArray(savedCatalog) || savedCatalog.length === 0) {
    return INITIAL_INDIVIDUAL_TESTS.filter(t => !deletedCodes.has(t.code.toUpperCase().trim()));
  }

  const savedMap = new Map<string, InvoiceTestItem>();
  savedCatalog.forEach(item => {
    if (item && item.code) {
      savedMap.set(item.code.toUpperCase().trim(), item);
    }
  });

  const merged: InvoiceTestItem[] = [];

  // Guarantee every non-deleted test from INITIAL_INDIVIDUAL_TESTS is present
  INITIAL_INDIVIDUAL_TESTS.forEach(defTest => {
    const codeKey = defTest.code.toUpperCase().trim();
    if (deletedCodes.has(codeKey)) return;

    const existing = savedMap.get(codeKey);
    if (existing) {
      savedMap.delete(codeKey);
      merged.push({
        ...defTest,
        ...existing,
        nameAr: existing.nameAr || defTest.nameAr,
        nameEn: existing.nameEn || defTest.nameEn,
        sampleType: existing.sampleType || defTest.sampleType,
        textReference: existing.textReference || defTest.textReference,
        minNormal: existing.minNormal !== undefined ? existing.minNormal : defTest.minNormal,
        maxNormal: existing.maxNormal !== undefined ? existing.maxNormal : defTest.maxNormal,
        turnaroundTime: existing.turnaroundTime || defTest.turnaroundTime,
        fastingInstructions: (existing as any).fastingInstructions || defTest.fastingInstructions,
        price: typeof existing.price === 'number' && existing.price > 0 ? existing.price : defTest.price,
        cost: typeof existing.cost === 'number' && existing.cost > 0 ? existing.cost : defTest.cost,
        category: existing.category || defTest.category,
        unit: existing.unit || defTest.unit,
        method: existing.method || defTest.method
      });
    }
  });

  // Append custom user-created tests (excluding deleted ones)
  savedMap.forEach(customTest => {
    if (!deletedCodes.has(customTest.code.toUpperCase().trim())) {
      merged.push(customTest);
    }
  });

  return merged;
}

/**
 * Merges any existing packages with the 15 comprehensive default packages
 * Respects deleted packages so they never resurrect.
 */
export function mergePackagesWithDefaults(savedPackages?: ComprehensivePackage[]): ComprehensivePackage[] {
  const deletedPackageIds = getDeletedPackageIds();

  if (!Array.isArray(savedPackages) || savedPackages.length === 0) {
    return INITIAL_PACKAGES.filter(p => {
      const key = (p.code || p.id || '').toUpperCase().trim();
      const idKey = (p.id || '').toUpperCase().trim();
      return !deletedPackageIds.has(key) && !deletedPackageIds.has(idKey);
    });
  }

  const savedMap = new Map<string, ComprehensivePackage>();
  savedPackages.forEach(pkg => {
    if (pkg) {
      const key = (pkg.code || pkg.id || '').toUpperCase().trim();
      const idKey = (pkg.id || '').toUpperCase().trim();
      if (key && !deletedPackageIds.has(key) && !deletedPackageIds.has(idKey)) {
        savedMap.set(key, pkg);
      }
    }
  });

  const merged: ComprehensivePackage[] = [];

  INITIAL_PACKAGES.forEach(defPkg => {
    const key = (defPkg.code || defPkg.id || '').toUpperCase().trim();
    const idKey = (defPkg.id || '').toUpperCase().trim();
    if (deletedPackageIds.has(key) || deletedPackageIds.has(idKey)) return;

    const existing = savedMap.get(key) || savedMap.get(idKey);
    if (existing) {
      savedMap.delete(key);
      savedMap.delete(idKey);
      merged.push({
        ...defPkg,
        ...existing,
        titleAr: existing.titleAr || (existing as any).nameAr || defPkg.titleAr,
        titleEn: existing.titleEn || defPkg.titleEn,
        packagePrice: typeof existing.packagePrice === 'number' && existing.packagePrice > 0 ? existing.packagePrice : defPkg.packagePrice,
        originalPrice: typeof existing.originalPrice === 'number' && existing.originalPrice > 0 ? existing.originalPrice : defPkg.originalPrice,
        discountPercentage: typeof existing.discountPercentage === 'number' ? existing.discountPercentage : defPkg.discountPercentage,
        includedProfiles: Array.isArray(existing.includedProfiles) && existing.includedProfiles.length > 0 
          ? existing.includedProfiles 
          : defPkg.includedProfiles,
        includedIndividualTestCodes: Array.isArray(existing.includedIndividualTestCodes) && existing.includedIndividualTestCodes.length > 0 
          ? existing.includedIndividualTestCodes 
          : defPkg.includedIndividualTestCodes
      });
    }
  });

  // Append custom packages (excluding deleted)
  savedMap.forEach(customPkg => {
    const key = (customPkg.code || customPkg.id || '').toUpperCase().trim();
    const idKey = (customPkg.id || '').toUpperCase().trim();
    if (!deletedPackageIds.has(key) && !deletedPackageIds.has(idKey)) {
      merged.push(customPkg);
    }
  });

  return merged;
}

/**
 * Merges any existing diagnostic profiles with 24 default profiles
 * Respects deleted profiles and user parameter deletions/edits.
 */
export function mergeProfilesWithDefaults(savedProfiles?: CatalogProfileTemplate[]): CatalogProfileTemplate[] {
  const deletedCodes = getDeletedProfileCodes();

  if (!Array.isArray(savedProfiles) || savedProfiles.length === 0) {
    return LAB_CATALOG.filter(p => !deletedCodes.has(p.code.toUpperCase().trim()));
  }

  const savedMap = new Map<string, CatalogProfileTemplate>();
  savedProfiles.forEach(p => {
    if (p && p.code) savedMap.set(p.code.toUpperCase().trim(), p);
  });

  const merged: CatalogProfileTemplate[] = [];

  LAB_CATALOG.forEach(defProf => {
    const key = defProf.code.toUpperCase().trim();
    if (deletedCodes.has(key)) return; // DO NOT resurrect deleted profile

    const existing = savedMap.get(key);
    if (existing) {
      savedMap.delete(key);
      merged.push({
        ...defProf,
        ...existing,
        titleAr: existing.titleAr || defProf.titleAr,
        titleEn: existing.titleEn || defProf.titleEn,
        category: existing.category || defProf.category,
        sampleType: existing.sampleType || defProf.sampleType,
        profilePrice: existing.profilePrice !== undefined ? existing.profilePrice : defProf.profilePrice,
        defaultInterpretation: existing.defaultInterpretation !== undefined ? existing.defaultInterpretation : defProf.defaultInterpretation,
        // CRITICAL: Respect user parameters exactly as saved (no length comparison forcing defaults back)
        parameters: Array.isArray(existing.parameters) ? existing.parameters : defProf.parameters
      });
    }
  });

  // Append custom user-created profiles (excluding deleted ones)
  savedMap.forEach(customProf => {
    if (!deletedCodes.has(customProf.code.toUpperCase().trim())) {
      merged.push(customProf);
    }
  });

  return merged;
}

/**
 * Maps a profile code or title to a pathological infogram
 */
export function getInfogramForProfile(profileCode: string, titleEn: string): any {
  const code = (profileCode || '').toUpperCase();
  const title = (titleEn || '').toUpperCase();

  if (code.includes('LFT') || title.includes('LIVER') || title.includes('HEPATIC')) {
    return DISEASE_ILLUSTRATIONS.find(d => d.code === 'INFOGRAM_LFT');
  }
  if (code.includes('KFT') || title.includes('KIDNEY') || title.includes('RENAL')) {
    return DISEASE_ILLUSTRATIONS.find(d => d.code === 'INFOGRAM_KFT');
  }
  if (code.includes('LIPID') || title.includes('LIPID') || title.includes('CHOLESTEROL')) {
    return DISEASE_ILLUSTRATIONS.find(d => d.code === 'INFOGRAM_LIPID');
  }
  if (code.includes('GLYCEMIC') || code.includes('DIAB') || title.includes('GLUCOSE') || title.includes('HBA1C')) {
    return DISEASE_ILLUSTRATIONS.find(d => d.code === 'INFOGRAM_GLYCEMIC');
  }
  if (code.includes('THYROID') || title.includes('THYROID') || title.includes('TSH')) {
    return DISEASE_ILLUSTRATIONS.find(d => d.code === 'INFOGRAM_THYROID');
  }
  if (code.includes('URINE') || title.includes('URINE') || title.includes('URINALYSIS')) {
    return DISEASE_ILLUSTRATIONS.find(d => d.code === 'INFOGRAM_URINE');
  }
  if (code.includes('STOOL') || title.includes('STOOL')) {
    return DISEASE_ILLUSTRATIONS.find(d => d.code === 'INFOGRAM_STOOL');
  }
  if (code.includes('COAG') || title.includes('COAGULATION') || title.includes('PT') || title.includes('INR')) {
    return DISEASE_ILLUSTRATIONS.find(d => d.code === 'INFOGRAM_COAGULATION');
  }
  if (code.includes('CARDIAC') || title.includes('TROPONIN')) {
    return DISEASE_ILLUSTRATIONS.find(d => d.code === 'INFOGRAM_CARDIAC');
  }
  return null;
}

/**
 * Upgrades a single LabReport:
 * - Updates staff signatures to official credentials
 * - Upgrades CBC to 37 parameters, calculates missing indices, attaches disease photo
 * - Attaches pathological infograms for LFT, KFT, Lipid, Glycemic, Thyroid, Urine
 */
export function upgradeSingleReport(report: LabReport): LabReport {
  const updatedReport: LabReport = { ...report };

  // 1. Upgrade staff signatures
  updatedReport.staff = {
    labChemist: DEFAULT_STAFF.labChemist,
    verifiedBy: DEFAULT_STAFF.verifiedBy,
    pathologist: DEFAULT_STAFF.pathologist
  };

  // 2. Check and upgrade profiles
  const cbcCatalog = LAB_CATALOG.find(p => p.code === 'CBC');

  updatedReport.profiles = updatedReport.profiles.map(prof => {
    const isCBC = prof.profileCode === 'CBC' || 
                  prof.titleEn.toLowerCase().includes('complete blood') || 
                  prof.titleAr.includes('صورة دم');

    if (isCBC) {
      // Merge CBC parameters with complete CBC catalog if needed
      let params = [...prof.parameters];

      if (cbcCatalog && params.length < 25) {
        // Old CBC lacking full parameters -> Merge
        const existingMap = new Map<string, TestParameter>();
        params.forEach(p => existingMap.set(p.name.toLowerCase().trim(), p));

        const mergedParams: TestParameter[] = cbcCatalog.parameters.map((catParam, idx) => {
          const match = Array.from(existingMap.entries()).find(([k]) => 
            k.includes(catParam.name.toLowerCase().trim()) || catParam.name.toLowerCase().includes(k)
          );
          if (match && match[1].result) {
            return {
              ...catParam,
              id: `p-mig-${idx}-${Date.now()}`,
              result: match[1].result,
              flag: match[1].flag || ''
            };
          }
          return {
            ...catParam,
            id: `p-mig-${idx}-${Date.now()}`,
            result: '',
            flag: ''
          };
        });
        params = mergedParams;
      }

      // Run automatic calculations on CBC
      const { updatedParams } = runAutomaticCalculations(params, {
        age: report.patient.age,
        gender: report.patient.gender
      });

      // Suggest hematological illustration
      let attachedIll = prof.attachedIllustration;
      if (!attachedIll) {
        attachedIll = suggestHematologicalIllustration(updatedParams);
      }
      if (attachedIll && attachedIll.imageUrl) {
        attachedIll = { ...attachedIll, imageUrl: cleanAtlasImageUrl(attachedIll.imageUrl) };
      }

      // Blood film findings
      const bloodFilm = prof.bloodFilmFindings || {
        rbcMorphology: 'Normocytic normochromic RBCs. No significant anisopoikilocytosis.',
        wbcMorphology: 'Normal mature leukocyte series. No toxic granulation or atypical forms.',
        plateletMorphology: 'Adequate in number and well-distributed on peripheral smear.',
        reticulocytesPercent: '1.0 %',
        differentialSummary: 'Differential leukocyte count within physiological reference intervals.'
      };

      return {
        ...prof,
        profileCode: 'CBC',
        titleEn: 'Complete Blood Count (CBC) with Full Automated Differential & Indices',
        titleAr: 'صورة الدم الكاملة مع الفيلم التفريقي والمؤشرات الحسابية',
        category: 'Hematology',
        sampleType: 'EDTA Whole Blood',
        parameters: updatedParams,
        attachedIllustration: attachedIll,
        bloodFilmFindings: bloodFilm
      };
    } else {
      // Non-CBC profile: ensure pathological infogram is attached
      let attachedIll = prof.attachedIllustration;
      if (!attachedIll) {
        attachedIll = getInfogramForProfile(prof.profileCode, prof.titleEn) || undefined;
      }
      if (attachedIll && attachedIll.imageUrl) {
        attachedIll = { ...attachedIll, imageUrl: cleanAtlasImageUrl(attachedIll.imageUrl) };
      }

      // Run auto calculations if relevant (e.g. Lipid, LFT, KFT, HOMA-IR)
      const { updatedParams } = runAutomaticCalculations(prof.parameters, {
        age: report.patient.age,
        gender: report.patient.gender
      });

      return {
        ...prof,
        parameters: updatedParams,
        attachedIllustration: attachedIll
      };
    }
  });

  return updatedReport;
}

/**
 * Scans localStorage and retroactively upgrades ALL saved reports,
 * lab contacts, signatures, and catalog across both programs!
 */
export function runGlobalDataUpgrade(): { upgradedReportsCount: number; success: boolean } {
  if (typeof window === 'undefined') return { upgradedReportsCount: 0, success: false };

  try {
    // 1. Upgrade Lab Contacts & Info
    const officialContacts = {
      hotline: INITIAL_LAB_INFO.hotline,
      emergencyPhone: INITIAL_LAB_INFO.phone,
      phone: INITIAL_LAB_INFO.phone,
      branchesSummary: 'الفرع الرئيسي - بهتيم شبرا الخيمة',
      mainAddress: INITIAL_LAB_INFO.mainAddress,
      cairoAddress: INITIAL_LAB_INFO.mainAddress,
      gizaAddress: 'شارع القصر العيني أمام مستشفى قصر العيني الفرنساوي - القاهرة',
      alexAddress: ''
    };
    localStorage.setItem('rt_lab_contacts', JSON.stringify(officialContacts));
    localStorage.setItem('rt_lab_info_v2', JSON.stringify(INITIAL_LAB_INFO));
    localStorage.setItem('rt_lab_info_v1', JSON.stringify(INITIAL_LAB_INFO));
    localStorage.setItem('rt_lab_info_v3', JSON.stringify(INITIAL_LAB_INFO));
    localStorage.setItem('rt_lab_staff_v2', JSON.stringify(DEFAULT_STAFF));
    localStorage.setItem('rt_lab_staff_v3', JSON.stringify(DEFAULT_STAFF));

    // 2. Upgrade and Merge Test Catalog in localStorage
    const savedTestCatalogRaw = localStorage.getItem('rt_lab_unified_test_catalog_v3');
    const existingTestCatalog = savedTestCatalogRaw ? JSON.parse(savedTestCatalogRaw) : [];
    const mergedTestCatalog = mergeCatalogWithDefaults(existingTestCatalog);
    localStorage.setItem('rt_lab_unified_test_catalog_v3', JSON.stringify(mergedTestCatalog));

    const savedPackagesRaw = localStorage.getItem('rt_lab_unified_packages_v3');
    const existingPackages = savedPackagesRaw ? JSON.parse(savedPackagesRaw) : [];
    const mergedPackages = mergePackagesWithDefaults(existingPackages);
    localStorage.setItem('rt_lab_unified_packages_v3', JSON.stringify(mergedPackages));

    const savedProfilesRaw = localStorage.getItem('rt_lab_unified_diagnostic_profiles_v3');
    const existingProfiles = savedProfilesRaw ? JSON.parse(savedProfilesRaw) : [];
    const mergedProfiles = mergeProfilesWithDefaults(existingProfiles);
    localStorage.setItem('rt_lab_unified_diagnostic_profiles_v3', JSON.stringify(mergedProfiles));

    // Compatibility keys for legacy modules
    localStorage.setItem('rt_lab_catalog_v2', JSON.stringify(mergedProfiles));
    localStorage.setItem('rt_lab_custom_catalog_v3', JSON.stringify(mergedProfiles));
    localStorage.setItem('rt_lab_individual_tests_v2', JSON.stringify(mergedTestCatalog));

    // 3. Scan and Upgrade ALL Saved Patient Reports
    let reportCount = 0;
    const reportKeys = ['rt_lab_unified_reports_v3', 'rt_lab_reports_v2', 'rt_lab_reports_v3', 'rt_lab_reports_v1'];

    reportKeys.forEach(key => {
      const savedStr = localStorage.getItem(key);
      if (savedStr) {
        try {
          const reports: LabReport[] = JSON.parse(savedStr);
          if (Array.isArray(reports) && reports.length > 0) {
            const upgraded = reports.map(r => upgradeSingleReport(r));
            localStorage.setItem(key, JSON.stringify(upgraded));
            reportCount = Math.max(reportCount, upgraded.length);
          }
        } catch (e) {
          console.error(`Error parsing reports in ${key}:`, e);
        }
      }
    });

    localStorage.setItem(MIGRATION_VERSION_KEY, 'true');
    console.log(`[RT-LAB] Successfully upgraded ${reportCount} saved reports with full CBC and disease illustrations!`);
    return { upgradedReportsCount: reportCount, success: true };
  } catch (err) {
    console.error('[RT-LAB] Migration error:', err);
    return { upgradedReportsCount: 0, success: false };
  }
}
