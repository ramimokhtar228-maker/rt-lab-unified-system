import { LabReport, TestProfile, TestParameter, CatalogProfileTemplate, ComprehensivePackage, InvoiceTestItem, IndividualTest } from '../types/lab';
import { LAB_CATALOG, DEFAULT_STAFF, INITIAL_INDIVIDUAL_TESTS, INITIAL_LAB_INFO, INITIAL_PACKAGES } from '../data/labCatalog';
import { DISEASE_ILLUSTRATIONS, suggestHematologicalIllustration } from '../data/diseaseIllustrations';
import { calculateFlag, runAutomaticCalculations } from '../utils/calculator';

export const MIGRATION_VERSION_KEY = 'rt_lab_migration_v10_cbc_urine_vitmin_2026';

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
        textReference: existing.textReference !== undefined ? existing.textReference : defTest.textReference,
        minNormal: existing.minNormal !== undefined ? existing.minNormal : defTest.minNormal,
        maxNormal: existing.maxNormal !== undefined ? existing.maxNormal : defTest.maxNormal,
        turnaroundTime: existing.turnaroundTime || defTest.turnaroundTime,
        fastingInstructions: (existing as any).fastingInstructions || defTest.fastingInstructions,
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
 * Merges any existing packages with the 15 comprehensive default packages,
 * ensuring any custom-added user packages are NEVER lost during cloud sync or refresh.
 */
export function mergePackagesWithDefaults(
  savedPackages?: ComprehensivePackage[],
  localPackages?: ComprehensivePackage[]
): ComprehensivePackage[] {
  const allCandidates: ComprehensivePackage[] = [];
  
  if (Array.isArray(savedPackages)) {
    allCandidates.push(...savedPackages);
  }
  if (Array.isArray(localPackages)) {
    allCandidates.push(...localPackages);
  }
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('rt_lab_packages_v3');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) allCandidates.push(...parsed);
      }
    } catch {}
  }

  if (allCandidates.length === 0) {
    return [...INITIAL_PACKAGES];
  }

  const savedMap = new Map<string, ComprehensivePackage>();
  allCandidates.forEach(pkg => {
    if (pkg && (pkg.code || pkg.id || pkg.titleAr)) {
      const key = (pkg.code || pkg.id || pkg.titleAr).toUpperCase().trim();
      const existing = savedMap.get(key);
      if (!existing) {
        savedMap.set(key, pkg);
      } else {
        savedMap.set(key, { ...existing, ...pkg });
      }
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
        nameAr: (existing as any).nameAr || existing.titleAr || defPkg.titleAr,
        titleAr: existing.titleAr || defPkg.titleAr,
        titleEn: existing.titleEn || defPkg.titleEn,
        packagePrice: typeof existing.packagePrice === 'number' ? existing.packagePrice : defPkg.packagePrice,
        originalPrice: typeof existing.originalPrice === 'number' ? existing.originalPrice : defPkg.originalPrice,
        discountPercentage: typeof existing.discountPercentage === 'number' ? existing.discountPercentage : defPkg.discountPercentage,
        includedProfiles: Array.isArray(existing.includedProfiles)
          ? existing.includedProfiles
          : defPkg.includedProfiles,
        includedIndividualTestCodes: Array.isArray(existing.includedIndividualTestCodes)
          ? existing.includedIndividualTestCodes
          : defPkg.includedIndividualTestCodes,
        fastingRequired: existing.fastingRequired || defPkg.fastingRequired,
        sampleTypes: Array.isArray(existing.sampleTypes) && existing.sampleTypes.length > 0 ? existing.sampleTypes : defPkg.sampleTypes,
        isPopular: existing.isPopular !== undefined ? existing.isPopular : defPkg.isPopular
      };
    }
    return { ...defPkg };
  });

  // Append custom packages created by user
  savedMap.forEach(customPkg => {
    const cKey = (customPkg.code || customPkg.id || '').toUpperCase().trim();
    if (!merged.some(m => (m.code || m.id || '').toUpperCase().trim() === cKey)) {
      merged.push(customPkg);
    }
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

  const isLegacyCbcTemplate = (params?: any[]): boolean => {
    if (!Array.isArray(params) || params.length === 0) return true;
    const names = params.map(p => (p?.name || '').toLowerCase().trim());
    const hasObsolete = names.some(n =>
      n.includes('rdw-sd') || n.includes('r.d.w-sd') ||
      n === 'mpv' || n.includes('mean platelet') ||
      n === 'pct' || n.includes('plateletcrit') ||
      n.includes('pdw') || n.includes('p-lcr') ||
      n.includes('nlr') || n.includes('neutrophil/lymphocyte') ||
      n.includes('mentzer') || n.includes('green')
    );
    const hasHaemoglobinEdta = names.some(n => n.includes('haemoglobin (edta blood)'));
    return hasObsolete || !hasHaemoglobinEdta;
  };

  const merged: CatalogProfileTemplate[] = LAB_CATALOG.map(defProf => {
    const key = defProf.code.toUpperCase().trim();
    const existing = savedMap.get(key);
    if (existing) {
      savedMap.delete(key);
      const upgradeLegacyCbc = key === 'CBC' && isLegacyCbcTemplate(existing.parameters);
      return {
        ...defProf,
        ...existing,
        titleAr: upgradeLegacyCbc ? defProf.titleAr : (existing.titleAr || defProf.titleAr),
        titleEn: upgradeLegacyCbc ? defProf.titleEn : (existing.titleEn || defProf.titleEn),
        category: existing.category || defProf.category,
        sampleType: existing.sampleType || defProf.sampleType,
        defaultInterpretation: upgradeLegacyCbc
          ? defProf.defaultInterpretation
          : (existing.defaultInterpretation !== undefined ? existing.defaultInterpretation : defProf.defaultInterpretation),
        parameters: upgradeLegacyCbc
          ? defProf.parameters
          : (Array.isArray(existing.parameters) ? existing.parameters : defProf.parameters)
      };
    }
    return { ...defProf };
  });

  // Append user's custom created profiles
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

  // 1. Upgrade staff signatures preserving existing titles and licenses
  updatedReport.staff = {
    ...DEFAULT_STAFF,
    ...report.staff
  };

  // 2. Check and upgrade profiles
  const cbcCatalog = LAB_CATALOG.find(p => p.code === 'CBC');

  const findMatchingCbcParam = (existingParams: TestParameter[], targetName: string): TestParameter | undefined => {
    const t = targetName.toLowerCase().trim();
    const findBy = (includes: string[], excludes: string[] = []) =>
      existingParams.find(p => {
        const n = (p.name || '').toLowerCase().trim();
        if (excludes.some(ex => n.includes(ex))) return false;
        return includes.some(inc => n.includes(inc));
      });

    if (t.includes('haemoglobin')) return findBy(['haemoglobin', 'hemoglobin', 'hgb', 'hb'], ['a1c']);
    if (t.includes('haematocrit')) return findBy(['haematocrit', 'hematocrit', 'pcv', 'hct']);
    if (t.includes('rbcs count')) return findBy(['rbcs count', 'r.b.cs', 'rbc count', 'rbc'], ['nrbc']);
    if (t === 'mcv') return findBy(['mcv', 'm.c.v']);
    if (t === 'mch') return findBy(['mch', 'm.c.h'], ['mchc', 'm.c.h.c']);
    if (t === 'mchc') return findBy(['mchc', 'm.c.h.c']);
    if (t.includes('rdw-cv')) return findBy(['rdw-cv', 'r.d.w-cv', 'rdw'], ['rdw-sd', 'r.d.w-sd']);
    if (t.includes('platelet count')) return findBy(['platelet count', 'platelets count', 'platelet', 'plt'], ['mpv', 'pdw', 'pct', 'p-lcr']);
    if (t.includes('total leucocytic')) return findBy(['total leucocytic', 'tlc', 'wbc', 'leukocyte']);
    if (t.includes('neutrophils %')) return findBy(['neutrophils %', 'neutrophil %', 'total neutrophils', 'neutrophils'], ['absolute', 'anc', 'nlr']);
    if (t.includes('lymphocytes %')) return findBy(['lymphocytes %', 'lymphocyte %', 'lymphocytes'], ['absolute', 'alc', 'nlr']);
    if (t.includes('monocytes %')) return findBy(['monocytes %', 'monocyte %', 'monocytes'], ['absolute', 'amc']);
    if (t.includes('eosinophils %')) return findBy(['eosinophils %', 'eosinophil %', 'eosinophils'], ['absolute', 'aec']);
    if (t.includes('basophils %')) return findBy(['basophils %', 'basophil %', 'basophils'], ['absolute', 'abc']);
    if (t.includes('absolute neutrophils')) return findBy(['absolute neutrophil', 'anc']);
    if (t.includes('absolute lymphocytes')) return findBy(['absolute lymph', 'alc']);
    if (t.includes('absolute monocytes')) return findBy(['absolute mono', 'amc']);
    if (t.includes('absolute eosinophils')) return findBy(['absolute eos', 'aec']);
    if (t.includes('absolute basophils')) return findBy(['absolute baso', 'abc']);
    if (t.includes('other cells')) return findBy(['other cells']);
    return existingParams.find(p => (p.name || '').toLowerCase().trim() === t);
  };

  const isLegacyReportCbc = (params: TestParameter[]): boolean => {
    if (!cbcCatalog || params.length !== cbcCatalog.parameters.length) return true;
    const names = params.map(p => (p.name || '').toLowerCase().trim());
    const hasObsolete = names.some(n =>
      n.includes('rdw-sd') || n.includes('r.d.w-sd') ||
      n === 'mpv' || n.includes('mean platelet') ||
      n === 'pct' || n.includes('plateletcrit') ||
      n.includes('pdw') || n.includes('p-lcr') ||
      n.includes('nlr') || n.includes('neutrophil/lymphocyte')
    );
    const hasHaemoglobinEdta = names.some(n => n.includes('haemoglobin (edta blood)'));
    return hasObsolete || !hasHaemoglobinEdta;
  };

  updatedReport.profiles = (updatedReport.profiles || []).map(prof => {
    const isCBC = prof.profileCode === 'CBC' || 
                  (prof.titleEn || '').toLowerCase().includes('complete blood') || 
                  (prof.titleAr || '').includes('صورة دم') ||
                  (prof.titleAr || '').includes('صورة الدم');

    if (isCBC) {
      let params = [...(prof.parameters || [])];

      if (cbcCatalog && isLegacyReportCbc(params)) {
        const mergedParams: TestParameter[] = cbcCatalog.parameters.map((catParam, idx) => {
          const match = findMatchingCbcParam(params, catParam.name);
          const resultVal = match?.result || '';
          return {
            ...catParam,
            id: match?.id || `p-mig-${idx}-${Date.now()}`,
            result: resultVal,
            flag: resultVal
              ? calculateFlag(resultVal, catParam.minNormal, catParam.maxNormal, catParam.panicLow, catParam.panicHigh, {
                  textReference: catParam.textReference,
                  name: catParam.name,
                  profileCode: 'CBC'
                })
              : ''
          };
        });
        params = mergedParams;
      }

      const { updatedParams } = runAutomaticCalculations(params, {
        age: report.patient.age,
        gender: report.patient.gender,
        profileCode: 'CBC'
      });

      const normalizedParams = updatedParams.map(p => {
        if (p.result && String(p.result).trim() !== '') {
          return {
            ...p,
            flag: calculateFlag(p.result, p.minNormal, p.maxNormal, p.panicLow, p.panicHigh, {
              textReference: p.textReference,
              name: p.name,
              profileCode: 'CBC'
            })
          };
        }
        return p;
      });

      let attachedIll = prof.attachedIllustration;
      if (!attachedIll) {
        attachedIll = suggestHematologicalIllustration(normalizedParams);
      }

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
        titleEn: cbcCatalog?.titleEn || 'Complete Blood Picture',
        titleAr: cbcCatalog?.titleAr || 'صورة الدم الكاملة (Complete Blood Picture)',
        category: 'Hematology',
        sampleType: 'EDTA Whole Blood',
        parameters: normalizedParams,
        attachedIllustration: attachedIll,
        bloodFilmFindings: bloodFilm
      };
    } else {
      let attachedIll = prof.attachedIllustration;
      if (!attachedIll) {
        attachedIll = getInfogramForProfile(prof.profileCode, prof.titleEn) || undefined;
      }

      const isUrine = (prof.profileCode || '').toUpperCase() === 'URINE' ||
                      (prof.titleEn || '').toLowerCase().includes('urine') ||
                      (prof.titleAr || '').includes('بول');

      const { updatedParams } = runAutomaticCalculations(prof.parameters || [], {
        age: report.patient.age,
        gender: report.patient.gender,
        profileCode: isUrine ? 'URINE' : prof.profileCode
      });

      const finalParams = isUrine
        ? updatedParams.map(p => {
            if (p.result && String(p.result).trim() !== '') {
              return {
                ...p,
                flag: calculateFlag(p.result, p.minNormal, p.maxNormal, p.panicLow, p.panicHigh, {
                  textReference: p.textReference,
                  name: p.name,
                  profileCode: 'URINE'
                })
              };
            }
            return p;
          })
        : updatedParams;

      return {
        ...prof,
        parameters: finalParams,
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
    if (!localStorage.getItem('rt_lab_contacts')) {
      localStorage.setItem('rt_lab_contacts', JSON.stringify(officialContacts));
    }
    if (!localStorage.getItem('rt_lab_info_v3') && !localStorage.getItem('rt_lab_info_v2')) {
      localStorage.setItem('rt_lab_info_v3', JSON.stringify(INITIAL_LAB_INFO));
      localStorage.setItem('rt_lab_info_v2', JSON.stringify(INITIAL_LAB_INFO));
    }
    if (!localStorage.getItem('rt_lab_unified_staff_signatures_v3')) {
      const legacyStaff = localStorage.getItem('rt_lab_staff_v3') || localStorage.getItem('rt_lab_staff_v2');
      if (legacyStaff) {
        try {
          localStorage.setItem('rt_lab_unified_staff_signatures_v3', JSON.stringify({ ...DEFAULT_STAFF, ...JSON.parse(legacyStaff) }));
        } catch {
          localStorage.setItem('rt_lab_unified_staff_signatures_v3', JSON.stringify(DEFAULT_STAFF));
        }
      } else {
        localStorage.setItem('rt_lab_unified_staff_signatures_v3', JSON.stringify(DEFAULT_STAFF));
      }
    }

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
