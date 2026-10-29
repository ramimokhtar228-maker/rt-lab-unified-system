import { LabReport, IncomeRecord } from '../types';

const LAB_NUMBER_RE = /RT-(\d{4})-(\d+)/i;
const BARCODE_RE = /^RT-(\d+)$/i;
const BARCODE_BASE = 10030;

export interface LabIdentity {
  labNumber: string;
  barcode: string;
}

/** Highest lab-number counter already in use (lab numbers, report numbers and barcodes). */
export function getHighestLabCounter(reports: LabReport[] = []): { year: number; counter: number } {
  let counter = 0;
  let year = new Date().getFullYear();

  (reports || []).forEach(report => {
    [report?.reportNumber, report?.patient?.labNumber].forEach(value => {
      const match = LAB_NUMBER_RE.exec(String(value || '').trim());
      if (match) {
        const parsed = Number(match[2]);
        // Guard against timestamps (e.g. 9827351826) or out-of-order test jumps (0910, 8988).
        // Standard serial lab numbers follow sequence 001..068, allowing up to 500 or consecutive progression.
        const isSequential = (parsed <= 500) || (counter > 0 && parsed <= counter + 20);
        if (isSequential && parsed > counter) {
          counter = parsed;
          year = Number(match[1]);
        }
      }
    });

    const barcodeMatch = BARCODE_RE.exec(String(report?.patient?.barcode || '').trim());
    if (barcodeMatch) {
      const parsed = Number(barcodeMatch[1]) - BARCODE_BASE;
      const isSequential = (parsed <= 500) || (counter > 0 && parsed <= counter + 20);
      if (isSequential && parsed > counter) counter = parsed;
    }
  });

  return { year, counter };
}

/** Next free lab number + barcode, continuing the existing sequence instead of repeating it. */
export function getNextLabIdentity(reports: LabReport[] = []): LabIdentity {
  const { year, counter } = getHighestLabCounter(reports);
  return {
    labNumber: `RT-${year}-${String(counter + 1).padStart(3, '0')}`,
    barcode: `RT-${BARCODE_BASE + counter + 1}`
  };
}

/** Keeps the requested number when it is still free, otherwise moves to the next free one. */
export function resolveUniqueLabIdentity(
  reports: LabReport[] = [],
  desiredLabNumber?: string | null,
  desiredBarcode?: string | null
): LabIdentity {
  const taken = new Set<string>();
  (reports || []).forEach(report => {
    [report?.reportNumber, report?.patient?.labNumber, report?.patient?.barcode].forEach(value => {
      if (value) taken.add(String(value).trim().toUpperCase());
    });
  });

  const labNumber = String(desiredLabNumber || '').trim();
  const barcode = String(desiredBarcode || '').trim();

  if (labNumber && barcode && !taken.has(labNumber.toUpperCase()) && !taken.has(barcode.toUpperCase())) {
    return { labNumber, barcode };
  }

  return getNextLabIdentity(reports);
}

function normalizeName(value?: string | null): string {
  return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
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

function reportIdentityValues(report: LabReport): string[] {
  return [report?.id, report?.reportNumber, report?.patient?.labNumber, report?.patient?.barcode]
    .filter(Boolean)
    .map(value => String(value).trim().toUpperCase());
}

function reportDuplicateKey(report: LabReport): string {
  const barcode = String(report?.patient?.barcode || '').trim().toUpperCase();
  const number = String(report?.reportNumber || report?.patient?.labNumber || '').trim().toUpperCase();
  const identity = barcode || number || `id:${report?.id}`;
  return `${identity}|${normalizeName(report?.patient?.fullName)}`;
}

/** Union of two case lists so nothing that already exists in the cloud is dropped, and cases are merged deeply. */
export function unionReports(localReports?: LabReport[], cloudReports?: LabReport[]): LabReport[] {
  const localList = Array.isArray(localReports) ? localReports.filter(Boolean) : [];
  const cloudList = Array.isArray(cloudReports) ? cloudReports.filter(Boolean) : [];
  if (localList.length === 0) return cloudList;
  if (cloudList.length === 0) return localList;

  // We combine both lists with cloud first then local, and run dedupeReports
  // so any matching case merges test parameters, entered results, and patient info
  return dedupeReports([...cloudList, ...localList]);
}

/** Collapses cases that sync delivered twice (same barcode / lab number and patient name). */
export function dedupeReports(reports: LabReport[]): LabReport[] {
  if (!Array.isArray(reports) || reports.length < 2) return reports;

  const indexByKey = new Map<string, number>();
  const collapsed: LabReport[] = [];
  let changed = false;

  reports.forEach(report => {
    if (!report) return;
    const key = reportDuplicateKey(report);
    const existingIndex = indexByKey.get(key);

    if (existingIndex === undefined) {
      indexByKey.set(key, collapsed.length);
      collapsed.push(report);
      return;
    }

    changed = true;
    const kept = collapsed[existingIndex];
    const keptTime = reportTimestamp(kept);
    const repTime = reportTimestamp(report);
    // Base is the one with more entered results or newer timestamp
    const base = countEnteredResults(kept) >= countEnteredResults(report) ? kept : report;
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

    const isHome = twin.patient?.isHomeVisit ?? base.patient?.isHomeVisit;
    const bType = twin.patient?.bookingType || base.patient?.bookingType || (isHome ? 'home_visit' : 'branch');

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
      updatedAt: new Date(Math.max(keptTime, repTime, Date.now())).toISOString()
    };
  });

  return changed ? collapsed : reports;
}

function invoiceIdentityValues(invoice: IncomeRecord): string[] {
  return [invoice?.id, invoice?.invoiceNumber, invoice?.barcode, invoice?.labNumber]
    .filter(Boolean)
    .map(value => String(value).trim().toUpperCase());
}

function invoiceDuplicateKey(invoice: IncomeRecord): string {
  const barcode = String(invoice?.barcode || '').trim().toUpperCase();
  const number = String(invoice?.invoiceNumber || invoice?.labNumber || '').trim().toUpperCase();
  return `${barcode}|${number || `id:${invoice?.id}`}`;
}

/** Union of two invoice lists so nothing that already exists in the cloud is dropped, and values are merged. */
export function unionInvoices(localInvoices?: IncomeRecord[], cloudInvoices?: IncomeRecord[]): IncomeRecord[] {
  const localList = Array.isArray(localInvoices) ? localInvoices.filter(Boolean) : [];
  const cloudList = Array.isArray(cloudInvoices) ? cloudInvoices.filter(Boolean) : [];
  if (localList.length === 0) return cloudList;
  if (cloudList.length === 0) return localList;

  return dedupeInvoices([...cloudList, ...localList]);
}

/** Collapses invoices that sync delivered twice (same barcode + invoice / lab number). */
export function dedupeInvoices(invoices: IncomeRecord[]): IncomeRecord[] {
  if (!Array.isArray(invoices) || invoices.length < 2) return invoices;

  const indexByKey = new Map<string, number>();
  const collapsed: IncomeRecord[] = [];
  let changed = false;

  invoices.forEach(invoice => {
    if (!invoice) return;
    const key = invoiceDuplicateKey(invoice);
    const existingIndex = indexByKey.get(key);

    if (existingIndex === undefined) {
      indexByKey.set(key, collapsed.length);
      collapsed.push(invoice);
      return;
    }

    changed = true;
    const kept = collapsed[existingIndex];
    const keptTime = new Date(kept.updatedAt || kept.createdAt || 0).getTime();
    const twinTime = new Date(invoice.updatedAt || invoice.createdAt || 0).getTime();
    const base = keptTime >= twinTime ? kept : invoice;
    const twin = base === kept ? invoice : kept;
    const netAmount = base.netAmount ?? twin.netAmount ?? 0;
    const paidAmount = Math.max(base.paidAmount || 0, twin.paidAmount || 0);

    collapsed[existingIndex] = {
      ...base,
      tests: base.tests && base.tests.length > 0 ? base.tests : twin.tests,
      paidAmount,
      remainingAmount: Math.max(0, netAmount - paidAmount),
      paymentStatus: base.paymentStatus === 'paid' || twin.paymentStatus === 'paid' ? 'paid' : base.paymentStatus,
      updatedAt: new Date(Math.max(keptTime, twinTime, Date.now())).toISOString()
    };
  });

  return changed ? collapsed : invoices;
}
