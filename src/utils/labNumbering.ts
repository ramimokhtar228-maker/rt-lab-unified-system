import { LabReport, IncomeRecord } from '../types';

const LAB_NUMBER_RE = /RT-(\d{4})-(\d+)/i;
const BARCODE_RE = /^RT-(\d+)$/i;
const BARCODE_BASE = 10030;

export interface LabIdentity {
  labNumber: string;
  barcode: string;
}

export function normalizePatientName(value?: string | null): string {
  return String(value || '')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function namesCompatibleForIdentity(a?: string | null, b?: string | null): boolean {
  const na = normalizePatientName(a);
  const nb = normalizePatientName(b);
  if (!na || !nb || na === 'مريض' || nb === 'مريض' || na === 'مريض مسجل' || nb === 'مريض مسجل' || na === 'مريض غير مسمي' || nb === 'مريض غير مسمي') {
    return true;
  }
  return na === nb || na.includes(nb) || nb.includes(na);
}

/** Highest lab-number counter already in use across both reports and invoices. */
export function getHighestLabCounter(
  reports: LabReport[] = [],
  incomeRecords: IncomeRecord[] = []
): { year: number; counter: number } {
  let counter = 0;
  let year = new Date().getFullYear();

  const inspectValue = (value?: string | null) => {
    const match = LAB_NUMBER_RE.exec(String(value || '').trim());
    if (match) {
      const parsed = Number(match[2]);
      const isSequential = parsed <= 5000 || (counter > 0 && parsed <= counter + 20);
      if (isSequential && parsed > counter) {
        counter = parsed;
        year = Number(match[1]);
      }
    }
  };

  const inspectBarcode = (value?: string | null) => {
    const barcodeMatch = BARCODE_RE.exec(String(value || '').trim());
    if (barcodeMatch) {
      const parsed = Number(barcodeMatch[1]) - BARCODE_BASE;
      const isSequential = (parsed > 0 && parsed <= 5000) || (counter > 0 && parsed <= counter + 20);
      if (isSequential && parsed > counter) counter = parsed;
    }
  };

  (reports || []).forEach(report => {
    inspectValue(report?.reportNumber);
    inspectValue(report?.patient?.labNumber);
    inspectBarcode(report?.patient?.barcode);
  });

  (incomeRecords || []).forEach(inv => {
    inspectValue(inv?.labNumber);
    inspectValue(inv?.invoiceNumber?.replace(/^INV-/i, 'RT-'));
    inspectBarcode(inv?.barcode);
  });

  return { year, counter };
}

/** Next free lab number + barcode, continuing the existing sequence instead of repeating it. */
export function getNextLabIdentity(
  reports: LabReport[] = [],
  incomeRecords: IncomeRecord[] = []
): LabIdentity {
  const { year, counter } = getHighestLabCounter(reports, incomeRecords);
  return {
    labNumber: `RT-${year}-${String(counter + 1).padStart(3, '0')}`,
    barcode: `RT-${BARCODE_BASE + counter + 1}`
  };
}

/** Keeps the requested number when it is still free across reports & invoices, otherwise moves to the next free one. */
export function resolveUniqueLabIdentity(
  reports: LabReport[] = [],
  desiredLabNumber?: string | null,
  desiredBarcode?: string | null,
  incomeRecords: IncomeRecord[] = []
): LabIdentity {
  const taken = new Set<string>();
  (reports || []).forEach(report => {
    [report?.reportNumber, report?.patient?.labNumber, report?.patient?.barcode].forEach(value => {
      if (value) taken.add(String(value).trim().toUpperCase());
    });
  });
  (incomeRecords || []).forEach(inv => {
    [inv?.labNumber, inv?.barcode, inv?.invoiceNumber?.replace(/^INV-/i, 'RT-')].forEach(value => {
      if (value) taken.add(String(value).trim().toUpperCase());
    });
  });

  const labNumber = String(desiredLabNumber || '').trim();
  const barcode = String(desiredBarcode || '').trim();

  if (labNumber && barcode && !taken.has(labNumber.toUpperCase()) && !taken.has(barcode.toUpperCase())) {
    return { labNumber, barcode };
  }

  return getNextLabIdentity(reports, incomeRecords);
}

function countEnteredResults(report?: LabReport | null): number {
  if (!report || !Array.isArray(report.profiles)) return 0;
  return report.profiles.reduce((total, profile) => {
    const entered = (profile?.parameters || []).filter(p => p?.result && String(p.result).trim() !== '');
    return total + entered.length;
  }, 0);
}

function reportTimestamp(report?: LabReport | null): number {
  return new Date(report?.updatedAt || report?.createdAt || 0).getTime() || 0;
}

function reportDuplicateKey(report: LabReport): string {
  const barcode = String(report?.patient?.barcode || '').trim().toUpperCase();
  const number = String(report?.reportNumber || report?.patient?.labNumber || '').trim().toUpperCase();
  const identity = barcode || number || `id:${report?.id}`;
  return `${identity}|${normalizePatientName(report?.patient?.fullName)}`;
}

/** Identity-safe lookup: matches by exact ID, OR same number/barcode ONLY if patient names are compatible. */
export function findMatchingReportIndex(list: LabReport[], target: LabReport): number {
  if (!target) return -1;
  const targetId = String(target.id || '').trim();
  if (targetId) {
    const byId = list.findIndex(r => String(r?.id || '').trim() === targetId);
    if (byId >= 0) return byId;
  }

  const targetNum = String(target.reportNumber || target.patient?.labNumber || '').trim().toUpperCase();
  const targetBc = String(target.patient?.barcode || '').trim().toUpperCase();
  const targetName = target.patient?.fullName;

  return list.findIndex(r => {
    if (!r) return false;
    const rNum = String(r.reportNumber || r.patient?.labNumber || '').trim().toUpperCase();
    const rBc = String(r.patient?.barcode || '').trim().toUpperCase();
    const sameNum = Boolean(targetNum && rNum && targetNum === rNum);
    const sameBc = Boolean(targetBc && rBc && targetBc === rBc);
    if (!sameNum && !sameBc) return false;
    return namesCompatibleForIdentity(r.patient?.fullName, targetName);
  });
}

/** Identity-safe invoice lookup: matches by exact ID, OR same invoiceNumber/labNumber/barcode ONLY if patient names are compatible. */
export function findMatchingInvoiceIndex(list: IncomeRecord[], target: IncomeRecord): number {
  if (!target) return -1;
  const targetId = String(target.id || '').trim();
  if (targetId) {
    const byId = list.findIndex(i => String(i?.id || '').trim() === targetId);
    if (byId >= 0) return byId;
  }

  const targetInv = String(target.invoiceNumber || '').trim().toUpperCase();
  const targetLab = String(target.labNumber || '').trim().toUpperCase();
  const targetBc = String(target.barcode || '').trim().toUpperCase();
  const targetName = target.patientName;

  return list.findIndex(i => {
    if (!i) return false;
    const iInv = String(i.invoiceNumber || '').trim().toUpperCase();
    const iLab = String(i.labNumber || '').trim().toUpperCase();
    const iBc = String(i.barcode || '').trim().toUpperCase();
    const sameInv = Boolean(targetInv && iInv && targetInv === iInv);
    const sameLab = Boolean(targetLab && iLab && targetLab === iLab);
    const sameBc = Boolean(targetBc && iBc && targetBc === iBc);
    if (!sameInv && !sameLab && !sameBc) return false;
    return namesCompatibleForIdentity(i.patientName, targetName);
  });
}

/** Union of two case lists preserving distinct patients even on collided numbers. */
export function unionReports(localReports?: LabReport[], cloudReports?: LabReport[]): LabReport[] {
  const localList = Array.isArray(localReports) ? localReports.filter(Boolean) : [];
  const cloudList = Array.isArray(cloudReports) ? cloudReports.filter(Boolean) : [];
  if (localList.length === 0) return cloudList;
  if (cloudList.length === 0) return localList;

  return dedupeReports([...cloudList, ...localList]);
}

/** Identity-safe merge of two report lists using a custom record merger function without Date.now() churn. */
export function mergeReportCollections(
  localReports: LabReport[],
  remoteReports: LabReport[],
  mergeFn: (localRep: LabReport, remoteRep: LabReport) => LabReport
): { merged: LabReport[]; newlyAdded: LabReport[]; changed: boolean } {
  const next = [...(Array.isArray(localReports) ? localReports.filter(Boolean) : [])];
  const newlyAdded: LabReport[] = [];
  let changed = false;

  (remoteReports || []).forEach(remoteRep => {
    if (!remoteRep) return;
    const idx = findMatchingReportIndex(next, remoteRep);
    if (idx === -1) {
      next.unshift(remoteRep);
      newlyAdded.push(remoteRep);
      changed = true;
    } else {
      const existing = next[idx];
      const combined = mergeFn(existing, remoteRep);
      if (JSON.stringify(combined) !== JSON.stringify(existing)) {
        next[idx] = combined;
        changed = true;
      }
    }
  });

  const deduped = dedupeReports(next);
  if (deduped !== next) changed = true;
  return { merged: deduped, newlyAdded, changed };
}

/** Collapses cases that sync delivered twice (same barcode / lab number AND compatible patient name). */
export function dedupeReports(reports: LabReport[]): LabReport[] {
  if (!Array.isArray(reports) || reports.length < 2) return reports;

  const indexByKey = new Map<string, number>();
  const indexById = new Map<string, number>();
  const collapsed: LabReport[] = [];
  let changed = false;

  reports.forEach(report => {
    if (!report) return;
    const key = reportDuplicateKey(report);
    const idKey = report.id ? String(report.id).trim() : '';
    const existingIndex =
      (idKey ? indexById.get(idKey) : undefined) ??
      indexByKey.get(key);

    if (existingIndex === undefined) {
      const idx = collapsed.length;
      if (idKey) indexById.set(idKey, idx);
      indexByKey.set(key, idx);
      collapsed.push(report);
      return;
    }

    const kept = collapsed[existingIndex];
    if (!namesCompatibleForIdentity(kept.patient?.fullName, report.patient?.fullName)) {
      const idx = collapsed.length;
      if (idKey) indexById.set(idKey, idx);
      collapsed.push(report);
      return;
    }

    changed = true;
    const keptTime = reportTimestamp(kept);
    const repTime = reportTimestamp(report);
    const keptCount = countEnteredResults(kept);
    const repCount = countEnteredResults(report);
    const base = keptCount > repCount || (keptCount === repCount && keptTime >= repTime) ? kept : report;
    const twin = base === kept ? report : kept;

    const profiles = (base.profiles || []).map(profile => {
      const twinProfile = (twin.profiles || []).find(p =>
        p.profileCode === profile.profileCode || p.titleEn === profile.titleEn || p.titleAr === profile.titleAr
      );
      if (!twinProfile) return profile;
      return {
        ...profile,
        parameters: (profile.parameters || []).map(parameter => {
          if (parameter.result && String(parameter.result).trim() !== '') return parameter;
          const twinParameter = (twinProfile.parameters || []).find(p => p.id === parameter.id || p.name === parameter.name);
          return twinParameter && twinParameter.result
            ? { ...parameter, result: twinParameter.result, flag: twinParameter.flag || parameter.flag }
            : parameter;
        })
      };
    });

    const isHome = base.patient?.isHomeVisit ?? twin.patient?.isHomeVisit;
    const bType = base.patient?.bookingType || twin.patient?.bookingType || (isHome ? 'home_visit' : 'branch');
    const maxTime = Math.max(keptTime, repTime);

    collapsed[existingIndex] = {
      ...twin,
      ...base,
      status: (base.status === 'verified' || twin.status === 'verified') ? 'verified' : (base.status || twin.status || 'draft'),
      patient: {
        ...(twin.patient || {}),
        ...(base.patient || {}),
        phone: base.patient?.phone || twin.patient?.phone || '',
        homeAddress: base.patient?.homeAddress || twin.patient?.homeAddress || '',
        bookingType: bType,
        isHomeVisit: Boolean(isHome),
        paidAmount: Math.max(base.patient?.paidAmount || 0, twin.patient?.paidAmount || 0)
      },
      profiles,
      updatedAt: maxTime > 0 ? new Date(maxTime).toISOString() : (base.updatedAt || base.createdAt || twin.updatedAt || '')
    };
  });

  return changed ? collapsed : reports;
}

function invoiceDuplicateKey(invoice: IncomeRecord): string {
  const barcode = String(invoice?.barcode || '').trim().toUpperCase();
  const number = String(invoice?.invoiceNumber || invoice?.labNumber || '').trim().toUpperCase();
  const identity = barcode || number || `id:${invoice?.id}`;
  return `${identity}|${normalizePatientName(invoice?.patientName)}`;
}

/** Union of two invoice lists preserving distinct patients even on collided numbers. */
export function unionInvoices(localInvoices?: IncomeRecord[], cloudInvoices?: IncomeRecord[]): IncomeRecord[] {
  const localList = Array.isArray(localInvoices) ? localInvoices.filter(Boolean) : [];
  const cloudList = Array.isArray(cloudInvoices) ? cloudInvoices.filter(Boolean) : [];
  if (localList.length === 0) return cloudList;
  if (cloudList.length === 0) return localList;

  return dedupeInvoices([...cloudList, ...localList]);
}

/** Identity-safe merge of two invoice lists using a custom record merger without Date.now() churn. */
export function mergeInvoiceCollections(
  localInvoices: IncomeRecord[],
  remoteInvoices: IncomeRecord[],
  mergeFn: (localInv: IncomeRecord, remoteInv: IncomeRecord) => IncomeRecord
): { merged: IncomeRecord[]; changed: boolean } {
  const next = [...(Array.isArray(localInvoices) ? localInvoices.filter(Boolean) : [])];
  let changed = false;

  (remoteInvoices || []).forEach(remoteInv => {
    if (!remoteInv) return;
    const idx = findMatchingInvoiceIndex(next, remoteInv);
    if (idx === -1) {
      next.unshift(remoteInv);
      changed = true;
    } else {
      const existing = next[idx];
      const combined = mergeFn(existing, remoteInv);
      if (JSON.stringify(combined) !== JSON.stringify(existing)) {
        next[idx] = combined;
        changed = true;
      }
    }
  });

  const deduped = dedupeInvoices(next);
  if (deduped !== next) changed = true;
  return { merged: deduped, changed };
}

/** Collapses invoices that sync delivered twice (same identity AND compatible patient name). */
export function dedupeInvoices(invoices: IncomeRecord[]): IncomeRecord[] {
  if (!Array.isArray(invoices) || invoices.length < 2) return invoices;

  const indexByKey = new Map<string, number>();
  const indexById = new Map<string, number>();
  const collapsed: IncomeRecord[] = [];
  let changed = false;

  invoices.forEach(invoice => {
    if (!invoice) return;
    const key = invoiceDuplicateKey(invoice);
    const idKey = invoice.id ? String(invoice.id).trim() : '';
    const existingIndex =
      (idKey ? indexById.get(idKey) : undefined) ??
      indexByKey.get(key);

    if (existingIndex === undefined) {
      const idx = collapsed.length;
      if (idKey) indexById.set(idKey, idx);
      indexByKey.set(key, idx);
      collapsed.push(invoice);
      return;
    }

    const kept = collapsed[existingIndex];
    if (!namesCompatibleForIdentity(kept.patientName, invoice.patientName)) {
      const idx = collapsed.length;
      if (idKey) indexById.set(idKey, idx);
      collapsed.push(invoice);
      return;
    }

    changed = true;
    const keptTime = new Date(kept.updatedAt || kept.createdAt || 0).getTime() || 0;
    const twinTime = new Date(invoice.updatedAt || invoice.createdAt || 0).getTime() || 0;
    const base = keptTime >= twinTime ? kept : invoice;
    const twin = base === kept ? invoice : kept;
    const netAmount = base.netAmount ?? twin.netAmount ?? 0;
    const paidAmount = Math.max(base.paidAmount || 0, twin.paidAmount || 0);
    const maxTime = Math.max(keptTime, twinTime);

    collapsed[existingIndex] = {
      ...twin,
      ...base,
      tests: base.tests && base.tests.length > 0 ? base.tests : twin.tests,
      paidAmount,
      remainingAmount: Math.max(0, netAmount - paidAmount),
      paymentStatus: base.paymentStatus === 'paid' || twin.paymentStatus === 'paid' ? 'paid' : base.paymentStatus,
      updatedAt: maxTime > 0 ? new Date(maxTime).toISOString() : (base.updatedAt || base.createdAt || twin.updatedAt || '')
    };
  });

  return changed ? collapsed : invoices;
}

/**
 * Finds non-deleted orphan invoices without matching reports and non-deleted orphan reports
 * without matching invoices, creating the missing twin cleanly without overwriting colliding numbers.
 */
export function findOrphanPairs(
  reports: LabReport[],
  incomeRecords: IncomeRecord[],
  isDeletedReportFn: (rep: Partial<LabReport>) => boolean,
  isDeletedInvoiceFn: (inv: Partial<IncomeRecord>) => boolean
): { missingFromReports: IncomeRecord[]; missingFromInvoices: LabReport[] } {
  const safeReports = (reports || []).filter(Boolean);
  const safeInvoices = (incomeRecords || []).filter(Boolean);

  const missingFromReports: IncomeRecord[] = [];
  const missingFromInvoices: LabReport[] = [];

  // 1. Orphan Invoices (exist in incomeRecords, missing from reports, NOT deleted)
  safeInvoices.forEach(inv => {
    const pName = normalizePatientName(inv.patientName);
    if (!pName || pName === 'مريض') return;
    if (isDeletedInvoiceFn(inv)) return;

    const candidateRepId = `rep-${inv.id}`;
    if (isDeletedReportFn({ id: candidateRepId, reportNumber: inv.labNumber, patient: { fullName: inv.patientName, barcode: inv.barcode } as any })) {
      return;
    }

    const hasReport = safeReports.some(r => {
      if (r.id === candidateRepId || r.id === inv.id || r.invoiceId === inv.id) {
        return namesCompatibleForIdentity(r.patient?.fullName, inv.patientName);
      }
      const sameLab = Boolean(inv.labNumber && (r.reportNumber === inv.labNumber || r.patient?.labNumber === inv.labNumber));
      const sameBc = Boolean(inv.barcode && r.patient?.barcode === inv.barcode);
      return (sameLab || sameBc) && namesCompatibleForIdentity(r.patient?.fullName, inv.patientName);
    });

    if (!hasReport) {
      missingFromReports.push(inv);
    }
  });

  // 2. Orphan Reports (exist in reports, missing from incomeRecords, NOT deleted)
  safeReports.forEach(rep => {
    const pName = normalizePatientName(rep.patient?.fullName);
    if (!pName || pName === 'مريض') return;
    if (isDeletedReportFn(rep)) return;

    const repLab = rep.reportNumber || rep.patient?.labNumber || '';
    const repBc = rep.patient?.barcode || '';
    const candidateInvId = rep.invoiceId || (rep.id.startsWith('rep-') ? rep.id.replace(/^rep-/, '') : `inv-${rep.id}`);
    if (isDeletedInvoiceFn({ id: candidateInvId, invoiceNumber: repLab, labNumber: repLab, barcode: repBc, patientName: rep.patient?.fullName })) {
      return;
    }

    const hasInvoice = safeInvoices.some(inv => {
      if (rep.invoiceId && inv.id === rep.invoiceId) {
        return namesCompatibleForIdentity(inv.patientName, rep.patient?.fullName);
      }
      if (rep.id === `rep-${inv.id}` || rep.id === inv.id) {
        return namesCompatibleForIdentity(inv.patientName, rep.patient?.fullName);
      }
      const sameLab = Boolean(repLab && inv.labNumber === repLab);
      const sameBc = Boolean(repBc && inv.barcode === repBc);
      return (sameLab || sameBc) && namesCompatibleForIdentity(inv.patientName, rep.patient?.fullName);
    });

    if (!hasInvoice) {
      missingFromInvoices.push(rep);
    }
  });

  return { missingFromReports, missingFromInvoices };
}
