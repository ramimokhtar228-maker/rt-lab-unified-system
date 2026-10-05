import { LabReport, TestProfile, TestParameter, CatalogProfileTemplate, ComprehensivePackage, InvoiceTestItem, IndividualTest } from '../types/lab';
import { LAB_CATALOG, DEFAULT_STAFF, INITIAL_INDIVIDUAL_TESTS, INITIAL_LAB_INFO, INITIAL_PACKAGES } from '../data/labCatalog';
import { DISEASE_ILLUSTRATIONS, suggestHematologicalIllustration } from '../data/diseaseIllustrations';
import { runAutomaticCalculations } from './calculator';

export const MIGRATION_VERSION_KEY = 'rt_lab_migration_v8_catalog_unified_142';

/**
 * Merges any existing test catalog with the full default catalog (142 tests)
 * Preserves user modifications to prices/names, but guarantees all 142 tests are present
 * with rich medical reference data, units, turnaround times, and sample types.
 */
export function mergeCatalogWithDefaults(savedCatalog?: InvoiceTestItem[]): InvoiceTestItem[] {
  if (!Array.isArray(savedCatalog) || savedCatalog.length === 0) {
    return [...INITIAL_INDIVIDUAL_TESTS];
  }

  const savedMap = new Map<string, InvoiceTestItem>();
  savedCatalog.forEach(item => {
    if (item && item.code) {
      savedMap.set(item.code.toUpperCase().trim(), item);
    }
  });

  // Guarantee every test from INITIAL_INDIVIDUAL_TESTS is present
  const merged: InvoiceTestItem[] = INITIAL_INDIVIDUAL_TESTS.map(defTest => {
    const codeKey = defTest.code.toUpperCase().trim();
    const existing = savedMap.get(codeKey);
    if (existing) {
      savedMap.delete(codeKey);
      return {
        ...defTest,
        ...existing,
        // Ensure clinical reference and metadata are preserved if existing lacked them
        nameAr: existing.nameAr || defTest.nameAr,
        nameEn: existing.nameEn || defTest.nameEn,
        sampleType: existing.sampleType || defTest.sampleType,
        textReference: existing.textReference || defTest.textReference,
        minNormal: existing.minNormal !== undefined ? existing.minNormal : defTest.minNormal,
        maxNormal: existing.maxNormal !== undefined ? existing.maxNormal : defTest.maxNormal,
        turnaroundTime: existing.turnaroundTime || defTest.turnaroundTime,
        fastingInstructions: existing.fastingInstructions || defTest.fastingInstructions,
        price: typeof existing.price === 'number' && existing.price > 0 ? existing.price : defTest.price,
        cost: typeof existing.cost === 'number' && existing.cost > 0 ? existing.cost : defTest.cost,
        category: existing.category || defTest.category,
        unit: existing.unit || defTest.unit,
        method: existing.method || defTest.method
      };
    }
    return { ...defTest };
  });

  // Append custom user-created tests
  savedMap.forEach(customTest => {
    merged.push(customTest);
  });

  return merged;
}

/**
 * Merges any existing packages with the 15 comprehensive default packages
 */
export function mergePackagesWithDefaults(savedPackages?: ComprehensivePackage[]): ComprehensivePackage[] {
  if (!Array.isArray(savedPackages) || savedPackages.length === 0) {
    return [...INITIAL_PACKAGES];
  }

  const savedMap = new Map<string, ComprehensivePackage>();
  savedPackages.forEach(pkg => {
    if (pkg) {
      const key = (pkg.code || pkg.id || '').toUpperCase().trim();
      if (key) savedMap.set(key, pkg);
    }
  });

  const merged: ComprehensivePackage[] = INITIAL_PACKAGES.map(defPkg => {
    const key = (defPkg.code || defPkg.id || '').toUpperCase().trim();
    const existing = savedMap.get(key);
    if (existing) {
      savedMap.delete(key);
      return {
        ...defPkg,
        ...existing,
        nameAr: (existing as any).nameAr || (existing as any).titleAr || defPkg.titleAr,
        titleAr: existing.titleAr || defPkg.titleAr,
        titleEn: existing.titleEn || defPkg.titleEn,
        packagePrice: typeof existing.packagePrice === 'number' && existing.packagePrice > 0 ? existing.packagePrice : defPkg.packagePrice,
        originalPrice: typeof existing.originalPrice === 'number' && existing.originalPrice > 0 ? existing.originalPrice : defPkg.originalPrice,
        includedProfiles: Array.isArray(existing.includedProfiles) && existing.includedProfiles.length > 0 
          ? existing.includedProfiles 
          : defPkg.includedProfiles,
        includedIndividualTestCodes: Array.isArray(existing.includedIndividualTestCodes) && existing.includedIndividualTestCodes.length > 0 
          ? existing.includedIndividualTestCodes 
          : defPkg.includedIndividualTestCodes
      };
    }
    return { ...defPkg };
  });

  // Append custom packages
  savedMap.forEach(customPkg => {
    merged.push(customPkg);
  });

  return merged;
}

/**
 * Merges any existing diagnostic profiles with 24 default profiles
 */
export function mergeProfilesWithDefaults(savedProfiles?: CatalogProfileTemplate[]): CatalogProfileTemplate[] {
  if (!Array.isArray(savedProfiles) || savedProfiles.length === 0) {
    return [...LAB_CATALOG];
  }

  const savedMap = new Map<string, CatalogProfileTemplate>();
  savedProfiles.forEach(p => {
    if (p && p.code) savedMap.set(p.code.toUpperCase().trim(), p);
  });

  const merged: CatalogProfileTemplate[] = LAB_CATALOG.map(defProf => {
    const key = defProf.code.toUpperCase().trim();
    const existing = savedMap.get(key);
    if (existing) {
      savedMap.delete(key);
      return {
        ...defProf,
        ...existing,
        titleAr: existing.titleAr || defProf.titleAr,
        titleEn: existing.titleEn || defProf.titleEn,
        category: existing.category || defProf.category,
        sampleType: existing.sampleType || defProf.sampleType,
        parameters: existing.parameters && existing.parameters.length >= defProf.parameters.length
          ? existing.parameters
          : defProf.parameters
      };
    }
    return { ...defProf };
  });

  savedMap.forEach(customProf => {
    merged.push(customProf);
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
    const reportKeys = ['rt_lab_reports_v2', 'rt_lab_reports_v3', 'rt_lab_reports_v1'];

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
