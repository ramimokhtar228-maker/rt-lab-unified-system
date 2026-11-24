import { LabReport, TestProfile, TestParameter, CatalogProfileTemplate, ComprehensivePackage, InvoiceTestItem, IndividualTest } from '../types/lab';
import { LAB_CATALOG, DEFAULT_STAFF, INITIAL_INDIVIDUAL_TESTS, INITIAL_LAB_INFO, INITIAL_PACKAGES } from '../data/labCatalog';
import { DISEASE_ILLUSTRATIONS, suggestHematologicalIllustration } from '../data/diseaseIllustrations';
import { calculateFlag, runAutomaticCalculations } from './calculator';
import { getDeletedMap, recordStamp } from './cloudStore';
import { safeSetLocalStorage, freeRedundantLocalStorage } from './idbBackup';

export const MIGRATION_VERSION_KEY = 'rt_lab_migration_v11_band_library_invoice_2026';

export const CUSTOM_NORMALS_STORAGE_KEY = 'rt_lab_custom_normals_v1';

function getDeletedSet(collection: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  const list = getDeletedMap()[collection] || [];
  return new Set(list.map(x => String(x).toUpperCase().trim()));
}

/**
 * Retrieves all user-customized normal ranges saved by the user
 */
export function getStoredCustomNormals(): Record<string, Partial<TestParameter>> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CUSTOM_NORMALS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function normalizeTestKey(nameOrCode?: string): string {
  if (!nameOrCode) return '';
  return nameOrCode
    .toLowerCase()
    .replace(/[\(\)\[\]\/\-_\s]/g, '')
    .trim();
}

/**
 * Merges any existing test catalog with the full default catalog (142 tests)
 * Preserves user modifications to prices/names and normal ranges, and respects deletions!
 */
export function mergeCatalogWithDefaults(
  savedCatalog?: InvoiceTestItem[],
  localCatalog?: InvoiceTestItem[]
): InvoiceTestItem[] {
  const customNormals = getStoredCustomNormals();
  const deletedTests = getDeletedSet('testCatalog');
  const isDeletedTest = (t?: Partial<InvoiceTestItem>) => {
    if (!t) return false;
    return (t.code && deletedTests.has(t.code.toUpperCase().trim())) ||
           (t.id && deletedTests.has(String(t.id).toUpperCase().trim()));
  };

  const hasSaved = Array.isArray(savedCatalog) && savedCatalog.length > 0;
  const hasLocal = Array.isArray(localCatalog) && localCatalog.length > 0;

  if (!hasSaved && !hasLocal) {
    return INITIAL_INDIVIDUAL_TESTS
      .filter(t => !isDeletedTest(t))
      .map(t => {
        const normKey = normalizeTestKey(t.code) || normalizeTestKey(t.nameEn);
        const custom = customNormals[normKey] || customNormals[normalizeTestKey(t.nameAr)];
        return custom ? { ...t, ...custom } : { ...t };
      });
  }

  const savedMap = new Map<string, InvoiceTestItem>();
  const addCandidate = (item: InvoiceTestItem) => {
    if (!item || !item.code || isDeletedTest(item)) return;
    const key = item.code.toUpperCase().trim();
    const existing = savedMap.get(key);
    if (!existing) {
      savedMap.set(key, item);
    } else {
      const winner = recordStamp(item) >= recordStamp(existing) ? item : existing;
      const loser = winner === item ? existing : item;
      savedMap.set(key, { ...loser, ...winner });
    }
  };

  if (hasSaved) savedCatalog!.forEach(addCandidate);
  if (hasLocal) localCatalog!.forEach(addCandidate);

  // Guarantee every non-deleted test from INITIAL_INDIVIDUAL_TESTS is present
  const merged: InvoiceTestItem[] = [];
  INITIAL_INDIVIDUAL_TESTS.forEach(defTest => {
    if (isDeletedTest(defTest)) return;
    const codeKey = defTest.code.toUpperCase().trim();
    const existing = savedMap.get(codeKey);
    const normKey = normalizeTestKey(defTest.code) || normalizeTestKey(defTest.nameEn);
    const custom = customNormals[normKey] || customNormals[normalizeTestKey(defTest.nameAr)];

    if (existing) {
      savedMap.delete(codeKey);
      merged.push({
        ...defTest,
        ...existing,
        nameAr: existing.nameAr || defTest.nameAr,
        nameEn: existing.nameEn || defTest.nameEn,
        sampleType: existing.sampleType || defTest.sampleType,
        textReference: custom?.textReference !== undefined ? custom.textReference : (existing.textReference !== undefined ? existing.textReference : defTest.textReference),
        minNormal: custom?.minNormal !== undefined ? custom.minNormal : (existing.minNormal !== undefined ? existing.minNormal : defTest.minNormal),
        maxNormal: custom?.maxNormal !== undefined ? custom.maxNormal : (existing.maxNormal !== undefined ? existing.maxNormal : defTest.maxNormal),
        panicLow: custom?.panicLow !== undefined ? custom.panicLow : (existing as any).panicLow,
        panicHigh: custom?.panicHigh !== undefined ? custom.panicHigh : (existing as any).panicHigh,
        turnaroundTime: existing.turnaroundTime || defTest.turnaroundTime,
        fastingInstructions: (existing as any).fastingInstructions || defTest.fastingInstructions,
        price: typeof existing.price === 'number' && existing.price >= 0 ? existing.price : defTest.price,
        cost: typeof existing.cost === 'number' && existing.cost >= 0 ? existing.cost : defTest.cost,
        category: existing.category || defTest.category,
        unit: custom?.unit || existing.unit || defTest.unit,
        method: custom?.method || existing.method || defTest.method
      } as InvoiceTestItem);
    } else {
      merged.push(custom ? { ...defTest, ...custom } : { ...defTest });
    }
  });

  // Append custom user-created tests
  savedMap.forEach(customTest => {
    const normKey = normalizeTestKey(customTest.code) || normalizeTestKey(customTest.nameEn);
    const custom = customNormals[normKey];
    merged.push(custom ? { ...customTest, ...custom } : customTest);
  });

  return merged;
}

/**
 * Merges any existing packages with the 15 comprehensive default packages,
 * preserving user edits (by updatedAt) and respecting deletion tombstones.
 */
export function mergePackagesWithDefaults(
  savedPackages?: ComprehensivePackage[],
  localPackages?: ComprehensivePackage[]
): ComprehensivePackage[] {
  const deletedPkgs = getDeletedSet('packages');
  const isDeletedPkg = (pkg?: Partial<ComprehensivePackage>) => {
    if (!pkg) return false;
    return (pkg.id && deletedPkgs.has(String(pkg.id).toUpperCase().trim())) ||
           (pkg.code && deletedPkgs.has(String(pkg.code).toUpperCase().trim()));
  };

  const allCandidates: ComprehensivePackage[] = [];

  if (Array.isArray(savedPackages)) {
    allCandidates.push(...savedPackages);
  }
  if (Array.isArray(localPackages)) {
    allCandidates.push(...localPackages);
  }
  // Fallback to legacy localStorage key only if neither savedPackages nor localPackages was supplied
  if (allCandidates.length === 0 && typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('rt_lab_packages_v3');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) allCandidates.push(...parsed);
      }
    } catch {}
  }

  if (allCandidates.length === 0) {
    return INITIAL_PACKAGES.filter(p => !isDeletedPkg(p));
  }

  const savedMap = new Map<string, ComprehensivePackage>();
  allCandidates.forEach(pkg => {
    if (!pkg || isDeletedPkg(pkg)) return;
    if (pkg.id || pkg.code || pkg.titleAr) {
      // Key by code when available so default packages match cleanly; keep custom id distinct if code changed
      const key = (pkg.code || pkg.id || pkg.titleAr).toUpperCase().trim();
      const existing = savedMap.get(key);
      if (!existing) {
        savedMap.set(key, pkg);
      } else {
        const winner = recordStamp(pkg) >= recordStamp(existing) ? pkg : existing;
        const loser = winner === pkg ? existing : pkg;
        savedMap.set(key, { ...loser, ...winner });
      }
    }
  });

  // Also index by id in case a default package's code was edited by the user
  const savedById = new Map<string, ComprehensivePackage>();
  savedMap.forEach(pkg => {
    if (pkg.id) savedById.set(pkg.id.toUpperCase().trim(), pkg);
  });

  const merged: ComprehensivePackage[] = [];
  INITIAL_PACKAGES.forEach(defPkg => {
    if (isDeletedPkg(defPkg)) return;
    const codeKey = (defPkg.code || '').toUpperCase().trim();
    const idKey = (defPkg.id || '').toUpperCase().trim();
    const existing = savedMap.get(codeKey) || (idKey ? savedById.get(idKey) : undefined);
    if (existing) {
      savedMap.delete(codeKey);
      if (existing.code) savedMap.delete(existing.code.toUpperCase().trim());
      merged.push({
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
        fastingRequired: existing.fastingRequired !== undefined ? existing.fastingRequired : defPkg.fastingRequired,
        sampleTypes: Array.isArray(existing.sampleTypes) ? existing.sampleTypes : defPkg.sampleTypes,
        isPopular: existing.isPopular !== undefined ? existing.isPopular : defPkg.isPopular,
        updatedAt: existing.updatedAt || defPkg.updatedAt
      } as ComprehensivePackage);
    } else {
      merged.push({ ...defPkg });
    }
  });

  // Append custom packages created by user (preserving order, custom ones first if newly added)
  const customList: ComprehensivePackage[] = [];
  savedMap.forEach(customPkg => {
    if (isDeletedPkg(customPkg)) return;
    const cId = (customPkg.id || '').toUpperCase().trim();
    const cCode = (customPkg.code || '').toUpperCase().trim();
    const alreadyInMerged = merged.some(m =>
      (cId && (m.id || '').toUpperCase().trim() === cId) ||
      (cCode && (m.code || '').toUpperCase().trim() === cCode)
    );
    if (!alreadyInMerged) {
      customList.push(customPkg);
    }
  });

  return [...customList, ...merged];
}

/**
 * Merges any existing diagnostic profiles with 24 default profiles,
 * strictly preserving all customized reference ranges, units, edits (by updatedAt), and deletions.
 */
export function mergeProfilesWithDefaults(
  savedProfiles?: CatalogProfileTemplate[],
  localProfiles?: CatalogProfileTemplate[]
): CatalogProfileTemplate[] {
  const customNormals = getStoredCustomNormals();
  const deletedProfiles = getDeletedSet('diagnosticProfiles');
  const isDeletedProf = (p?: Partial<CatalogProfileTemplate>) =>
    Boolean(p && p.code && deletedProfiles.has(p.code.toUpperCase().trim()));

  const applyCustomNormalsToParams = <T extends { name: string; unit?: string; minNormal?: number; maxNormal?: number; panicLow?: number; panicHigh?: number; textReference?: string; method?: string }>(
    params: T[],
    profileUpdatedAt?: string
  ): T[] => {
    const profTs = profileUpdatedAt ? new Date(profileUpdatedAt).getTime() || 0 : 0;
    return params.map(param => {
      const pCode = (param as any).code || '';
      const pKey = normalizeTestKey(pCode) || normalizeTestKey(param.name);
      const custom = customNormals[pKey] as (Partial<TestParameter> & { updatedAt?: string }) | undefined;
      if (custom) {
        const customTs = custom.updatedAt ? new Date(custom.updatedAt).getTime() || 0 : 0;
        // If the profile itself was edited AFTER customNormals was recorded, keep the profile's own parameter edits!
        if (profTs > 0 && customTs > 0 && profTs > customTs) {
          return param;
        }
        return {
          ...param,
          unit: custom.unit !== undefined ? custom.unit : param.unit,
          minNormal: custom.minNormal !== undefined ? custom.minNormal : param.minNormal,
          maxNormal: custom.maxNormal !== undefined ? custom.maxNormal : param.maxNormal,
          panicLow: custom.panicLow !== undefined ? custom.panicLow : param.panicLow,
          panicHigh: custom.panicHigh !== undefined ? custom.panicHigh : param.panicHigh,
          textReference: custom.textReference !== undefined ? custom.textReference : param.textReference,
          method: custom.method !== undefined ? custom.method : param.method
        };
      }
      return param;
    });
  };

  const hasSaved = Array.isArray(savedProfiles) && savedProfiles.length > 0;
  const hasLocal = Array.isArray(localProfiles) && localProfiles.length > 0;

  if (!hasSaved && !hasLocal) {
    return LAB_CATALOG
      .filter(prof => !isDeletedProf(prof))
      .map(prof => ({
        ...prof,
        parameters: applyCustomNormalsToParams(prof.parameters || [])
      }));
  }

  const savedMap = new Map<string, CatalogProfileTemplate>();
  const addCandidate = (p: CatalogProfileTemplate) => {
    if (!p || !p.code || isDeletedProf(p)) return;
    const key = p.code.toUpperCase().trim();
    const existing = savedMap.get(key);
    if (!existing) {
      savedMap.set(key, p);
    } else {
      const winner = recordStamp(p) >= recordStamp(existing) ? p : existing;
      const loser = winner === p ? existing : p;
      savedMap.set(key, {
        ...loser,
        ...winner,
        parameters: Array.isArray(winner.parameters) ? winner.parameters : (loser.parameters || [])
      });
    }
  };

  if (hasSaved) savedProfiles!.forEach(addCandidate);
  if (hasLocal) localProfiles!.forEach(addCandidate);

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
    const hasBandCells = names.some(n => n.includes('band'));
    return hasObsolete || !hasHaemoglobinEdta || !hasBandCells;
  };

  const merged: CatalogProfileTemplate[] = [];
  LAB_CATALOG.forEach(defProf => {
    if (isDeletedProf(defProf)) return;
    const key = defProf.code.toUpperCase().trim();
    const existing = savedMap.get(key);
    if (existing) {
      savedMap.delete(key);
      const upgradeLegacyCbc = key === 'CBC' && isLegacyCbcTemplate(existing.parameters);
      const rawParams = upgradeLegacyCbc
        ? defProf.parameters
        : (Array.isArray(existing.parameters) ? existing.parameters : defProf.parameters);

      merged.push({
        ...defProf,
        ...existing,
        titleAr: upgradeLegacyCbc ? defProf.titleAr : (existing.titleAr || defProf.titleAr),
        titleEn: upgradeLegacyCbc ? defProf.titleEn : (existing.titleEn || defProf.titleEn),
        category: existing.category || defProf.category,
        sampleType: existing.sampleType || defProf.sampleType,
        defaultInterpretation: upgradeLegacyCbc
          ? defProf.defaultInterpretation
          : (existing.defaultInterpretation !== undefined ? existing.defaultInterpretation : defProf.defaultInterpretation),
        parameters: applyCustomNormalsToParams(rawParams, upgradeLegacyCbc ? undefined : existing.updatedAt)
      });
    } else {
      merged.push({
        ...defProf,
        parameters: applyCustomNormalsToParams(defProf.parameters || [])
      });
    }
  });

  // Append user's custom created profiles
  const customList: CatalogProfileTemplate[] = [];
  savedMap.forEach(customProf => {
    if (!isDeletedProf(customProf)) {
      customList.push({
        ...customProf,
        parameters: applyCustomNormalsToParams(customProf.parameters || [], customProf.updatedAt)
      });
    }
  });

  return [...customList, ...merged];
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

  updatedReport.attachInvoiceToReport = report.attachInvoiceToReport ?? true;
  updatedReport.showInvoiceDetails = report.showInvoiceDetails ?? true;

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
    if (t.includes('band')) return findBy(['band cells', 'band forms', 'band', 'stab', 'العصوية'], ['absolute']);
    if (t.includes('neutrophils %')) return findBy(['neutrophils %', 'neutrophil %', 'total neutrophils', 'neutrophils'], ['absolute', 'anc', 'nlr', 'band', 'stab']);
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
    const hasBandCells = names.some(n => n.includes('band'));
    return hasObsolete || !hasHaemoglobinEdta || !hasBandCells;
  };

  updatedReport.profiles = (updatedReport.profiles || []).map(prof => {
    const isCBC = prof.profileCode === 'CBC' || 
                  (prof.titleEn || '').toLowerCase().includes('complete blood') || 
                  (prof.titleAr || '').includes('صورة دم') ||
                  (prof.titleAr || '').includes('صورة الدم');

    if (isCBC) {
      let params = [...(prof.parameters || [])];

      if (cbcCatalog && isLegacyReportCbc(params)) {
        const customNormals = getStoredCustomNormals();
        const mergedParams: TestParameter[] = cbcCatalog.parameters.map((catParam, idx) => {
          const match = findMatchingCbcParam(params, catParam.name);
          const catCode = (catParam as any).code || '';
          const pKey = normalizeTestKey(catCode) || normalizeTestKey(catParam.name);
          const custom = customNormals[pKey];

          const finalMin = custom?.minNormal !== undefined ? custom.minNormal : catParam.minNormal;
          const finalMax = custom?.maxNormal !== undefined ? custom.maxNormal : catParam.maxNormal;
          const finalTextRef = custom?.textReference !== undefined ? custom.textReference : catParam.textReference;
          const finalUnit = custom?.unit !== undefined ? custom.unit : catParam.unit;
          const hasCompletedDiff = params.some(ep =>
            (ep.name || '').toLowerCase().includes('neutrophil') &&
            ep.result !== undefined &&
            String(ep.result).trim() !== ''
          );
          const isBandTarget = (catParam.name || '').toLowerCase().includes('band');
          const resultVal = match?.result !== undefined && String(match.result).trim() !== ''
            ? match.result
            : (isBandTarget && hasCompletedDiff ? '0' : '');

          return {
            ...catParam,
            minNormal: finalMin,
            maxNormal: finalMax,
            textReference: finalTextRef,
            unit: finalUnit,
            id: match?.id || `p-mig-${idx}-${Date.now()}`,
            result: resultVal,
            flag: resultVal
              ? calculateFlag(resultVal, finalMin, finalMax, catParam.panicLow, catParam.panicHigh, {
                  textReference: finalTextRef,
                  name: catParam.name,
                  profileCode: 'CBC'
                })
              : ''
          };
        });
        params = mergedParams;
      }

      // Run automatic calculations on CBC
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

      // Suggest hematological illustration
      let attachedIll = prof.attachedIllustration;
      if (!attachedIll) {
        attachedIll = suggestHematologicalIllustration(normalizedParams);
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
        titleEn: cbcCatalog?.titleEn || 'Complete Blood Picture',
        titleAr: cbcCatalog?.titleAr || 'صورة الدم الكاملة (Complete Blood Picture)',
        category: 'Hematology',
        sampleType: 'EDTA Whole Blood',
        parameters: normalizedParams,
        attachedIllustration: attachedIll,
        bloodFilmFindings: bloodFilm
      };
    } else {
      // Non-CBC profile: ensure pathological infogram is attached
      let attachedIll = prof.attachedIllustration;
      if (!attachedIll) {
        attachedIll = getInfogramForProfile(prof.profileCode, prof.titleEn) || undefined;
      }

      const isUrine = (prof.profileCode || '').toUpperCase() === 'URINE' ||
                      (prof.titleEn || '').toLowerCase().includes('urine') ||
                      (prof.titleAr || '').includes('بول');

      // Run auto calculations if relevant (e.g. Lipid, LFT, KFT, HOMA-IR)
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
      safeSetLocalStorage('rt_lab_contacts', JSON.stringify(officialContacts));
    }
    if (!localStorage.getItem('rt_lab_unified_lab_info_v3') && !localStorage.getItem('rt_lab_info_v3') && !localStorage.getItem('rt_lab_info_v2')) {
      safeSetLocalStorage('rt_lab_unified_lab_info_v3', JSON.stringify(INITIAL_LAB_INFO));
    }
    if (!localStorage.getItem('rt_lab_unified_staff_signatures_v3')) {
      const legacyStaff = localStorage.getItem('rt_lab_staff_v3') || localStorage.getItem('rt_lab_staff_v2');
      if (legacyStaff) {
        try {
          safeSetLocalStorage('rt_lab_unified_staff_signatures_v3', JSON.stringify({ ...DEFAULT_STAFF, ...JSON.parse(legacyStaff) }));
        } catch {
          safeSetLocalStorage('rt_lab_unified_staff_signatures_v3', JSON.stringify(DEFAULT_STAFF));
        }
      } else {
        safeSetLocalStorage('rt_lab_unified_staff_signatures_v3', JSON.stringify(DEFAULT_STAFF));
      }
    }

    // 2. Upgrade and Merge Test Catalog in canonical localStorage only
    const savedTestCatalogRaw = localStorage.getItem('rt_lab_unified_test_catalog_v3') || localStorage.getItem('rt_lab_individual_tests_v2');
    const existingTestCatalog = savedTestCatalogRaw ? JSON.parse(savedTestCatalogRaw) : [];
    const mergedTestCatalog = mergeCatalogWithDefaults(existingTestCatalog);
    safeSetLocalStorage('rt_lab_unified_test_catalog_v3', JSON.stringify(mergedTestCatalog));

    const savedPackagesRaw = localStorage.getItem('rt_lab_unified_packages_v3') || localStorage.getItem('rt_lab_packages_v3');
    const existingPackages = savedPackagesRaw ? JSON.parse(savedPackagesRaw) : [];
    const mergedPackages = mergePackagesWithDefaults(existingPackages);
    safeSetLocalStorage('rt_lab_unified_packages_v3', JSON.stringify(mergedPackages));

    const savedProfilesRaw =
      localStorage.getItem('rt_lab_unified_diagnostic_profiles_v3') ||
      localStorage.getItem('rt_lab_custom_catalog_v3') ||
      localStorage.getItem('rt_lab_catalog_v2');
    const existingProfiles = savedProfilesRaw ? JSON.parse(savedProfilesRaw) : [];
    const mergedProfiles = mergeProfilesWithDefaults(existingProfiles);
    safeSetLocalStorage('rt_lab_unified_diagnostic_profiles_v3', JSON.stringify(mergedProfiles));

    // 3. Migrate & Upgrade ALL Saved Patient Reports into the single canonical key
    let reportCount = 0;
    const canonicalReportKey = 'rt_lab_unified_reports_v3';
    const legacyReportKeys = ['rt_lab_reports_v2', 'rt_lab_reports_v3', 'rt_lab_reports_v1'];
    const collectedReports = new Map<string, LabReport>();

    [canonicalReportKey, ...legacyReportKeys].forEach(key => {
      const savedStr = localStorage.getItem(key);
      if (savedStr) {
        try {
          const parsed: LabReport[] = JSON.parse(savedStr);
          if (Array.isArray(parsed)) {
            parsed.forEach(r => {
              if (!r || !r.id) return;
              const upgraded = upgradeSingleReport(r);
              if (!collectedReports.has(r.id)) {
                collectedReports.set(r.id, upgraded);
              }
            });
          }
        } catch (e) {
          console.error(`Error parsing reports in ${key}:`, e);
        }
      }
    });

    if (collectedReports.size > 0) {
      const finalReports = Array.from(collectedReports.values());
      safeSetLocalStorage(canonicalReportKey, JSON.stringify(finalReports));
      reportCount = finalReports.length;
    }

    // Purge duplicate legacy storage keys so 5MB localStorage quota never blocks new cases
    freeRedundantLocalStorage();

    safeSetLocalStorage(MIGRATION_VERSION_KEY, 'true');
    console.log(`[RT-LAB] Successfully upgraded ${reportCount} saved reports and freed redundant localStorage keys.`);
    return { upgradedReportsCount: reportCount, success: true };
  } catch (err) {
    console.error('[RT-LAB] Migration error:', err);
    return { upgradedReportsCount: 0, success: false };
  }
}
