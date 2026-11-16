import { LabReport, IncomeRecord } from '../types';
import { safeSetLocalStorage } from './idbBackup';

export interface DeletionTombstone {
  id: string;
  reportNumber?: string;
  barcode?: string;
  patientName?: string;
  deletedAt: string;
}

export interface DeletionRegistry {
  reports: DeletionTombstone[];
  invoices: DeletionTombstone[];
}

interface DeletableRecord {
  id?: string;
  reportNumber?: string;
  invoiceNumber?: string;
  labNumber?: string;
  barcode?: string;
  patientName?: string;
  fullName?: string;
  patient?: { barcode?: string; fullName?: string; labNumber?: string };
}

const STORAGE_KEY = 'rt-deletion-registry';
const MAX_TOMBSTONES = 2000;

function emptyRegistry(): DeletionRegistry {
  return { reports: [], invoices: [] };
}

function normalizeName(name?: string | null): string {
  return String(name || '')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function namesCompatible(a?: string | null, b?: string | null): boolean {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb || na === 'مريض' || nb === 'مريض') return true;
  return na === nb || na.includes(nb) || nb.includes(na);
}

export function getDeletionTombstones(): DeletionRegistry {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyRegistry();
    const parsed = JSON.parse(raw) || {};
    return {
      reports: Array.isArray(parsed.reports) ? parsed.reports : [],
      invoices: Array.isArray(parsed.invoices) ? parsed.invoices : []
    };
  } catch {
    return emptyRegistry();
  }
}

function persist(registry: DeletionRegistry): void {
  try {
    const trim = (list: DeletionTombstone[]) =>
      [...list].sort((a, b) => (a.deletedAt || '').localeCompare(b.deletedAt || '')).slice(-MAX_TOMBSTONES);
    safeSetLocalStorage(
      STORAGE_KEY,
      JSON.stringify({ reports: trim(registry.reports), invoices: trim(registry.invoices) })
    );
  } catch {
    // التخزين المحلي غير متاح
  }
}

function upsert(list: DeletionTombstone[], tombstone: DeletionTombstone): DeletionTombstone[] {
  return [...list.filter(t => t.id !== tombstone.id), tombstone];
}

export function importDeletionTombstones(remoteReports?: unknown, remoteInvoices?: unknown): void {
  const registry = getDeletionTombstones();
  let changed = false;

  const merge = (current: DeletionTombstone[], incoming: unknown): DeletionTombstone[] => {
    if (!Array.isArray(incoming)) return current;
    let next = current;
    incoming.forEach(item => {
      const tombstone = item as DeletionTombstone;
      if (!tombstone || !tombstone.id || !tombstone.deletedAt) return;
      const existing = next.find(t => t.id === tombstone.id);
      if (!existing) {
        next = [...next, tombstone];
        changed = true;
      } else if (tombstone.deletedAt > existing.deletedAt) {
        next = upsert(next, tombstone);
        changed = true;
      }
    });
    return next;
  };

  registry.reports = merge(registry.reports, remoteReports);
  registry.invoices = merge(registry.invoices, remoteInvoices);
  if (changed) persist(registry);
}

export function registerReportDeletion(report?: DeletableRecord | null): void {
  if (!report || !report.id) return;
  const registry = getDeletionTombstones();
  registry.reports = upsert(registry.reports, {
    id: report.id,
    reportNumber: report.reportNumber || report.patient?.labNumber,
    barcode: report.patient?.barcode || report.barcode,
    patientName: report.patient?.fullName || report.fullName || report.patientName,
    deletedAt: new Date().toISOString()
  });
  persist(registry);
}

export function registerInvoiceDeletion(record?: DeletableRecord | null): void {
  if (!record || !record.id) return;
  const registry = getDeletionTombstones();
  registry.invoices = upsert(registry.invoices, {
    id: record.id,
    reportNumber: record.invoiceNumber || record.labNumber,
    barcode: record.barcode,
    patientName: record.patientName || record.fullName,
    deletedAt: new Date().toISOString()
  });
  persist(registry);
}

interface TombstoneIndex {
  ids: Map<string, DeletionTombstone>;
  numbers: Map<string, DeletionTombstone[]>;
  barcodes: Map<string, DeletionTombstone[]>;
}

function buildIndex(tombstones: DeletionTombstone[]): TombstoneIndex {
  const ids = new Map<string, DeletionTombstone>();
  const numbers = new Map<string, DeletionTombstone[]>();
  const barcodes = new Map<string, DeletionTombstone[]>();
  tombstones.forEach(tombstone => {
    if (tombstone.id) ids.set(tombstone.id, tombstone);
    if (tombstone.reportNumber) {
      const list = numbers.get(tombstone.reportNumber) || [];
      list.push(tombstone);
      numbers.set(tombstone.reportNumber, list);
    }
    if (tombstone.barcode) {
      const list = barcodes.get(tombstone.barcode) || [];
      list.push(tombstone);
      barcodes.set(tombstone.barcode, list);
    }
  });
  return { ids, numbers, barcodes };
}

// Protected barcodes and names that should never be suppressed by stale tombstones
const PROTECTED_IDENTIFIERS = new Set([
  'RT-10096', 'RT-10097', 'RT-10098',
  'RT-2026-066', 'RT-2026-067', 'RT-2026-068',
  'INV-2026-066', 'INV-2026-067', 'INV-2026-068',
  'rep-RT-2026-066', 'rep-RT-2026-067', 'rep-RT-2026-068',
  'rep-inv-1792872659277', 'rep-inv-1792872977386', 'rep-inv-1792873120495'
]);

const PROTECTED_NAMES = ['دينا', 'هند', 'منار'];

export function purgeProtectedTombstones(): void {
  try {
    const registry = getDeletionTombstones();
    const isProtected = (t: DeletionTombstone) => {
      if (
        PROTECTED_IDENTIFIERS.has(t.id) ||
        (t.reportNumber && PROTECTED_IDENTIFIERS.has(t.reportNumber)) ||
        (t.barcode && PROTECTED_IDENTIFIERS.has(t.barcode))
      ) {
        return true;
      }
      return false;
    };
    const nextReports = registry.reports.filter(t => !isProtected(t));
    const nextInvoices = registry.invoices.filter(t => !isProtected(t));
    if (nextReports.length !== registry.reports.length || nextInvoices.length !== registry.invoices.length) {
      registry.reports = nextReports;
      registry.invoices = nextInvoices;
      persist(registry);
    }
  } catch {}
}

function matchesAnyTombstoneNameSafe(candidates: DeletionTombstone[] | undefined, patientName: string): boolean {
  if (!candidates || candidates.length === 0) return false;
  return candidates.some(t => !t.patientName || !patientName || namesCompatible(t.patientName, patientName));
}

function keepRecord(record: DeletableRecord, index: TombstoneIndex): boolean {
  if (!record) return false;
  const barcode = record.barcode || record.patient?.barcode;
  const number = record.reportNumber || record.invoiceNumber || record.labNumber;
  const patientName = record.patientName || record.fullName || record.patient?.fullName || '';

  if (barcode && PROTECTED_IDENTIFIERS.has(barcode)) return true;
  if (number && PROTECTED_IDENTIFIERS.has(number)) return true;
  if (record.id && PROTECTED_IDENTIFIERS.has(record.id)) return true;
  if (patientName && PROTECTED_NAMES.some(n => patientName.includes(n))) return true;

  if (record.id && index.ids.has(record.id)) return false;
  if (number && matchesAnyTombstoneNameSafe(index.numbers.get(number), patientName)) return false;
  if (barcode && matchesAnyTombstoneNameSafe(index.barcodes.get(barcode), patientName)) return false;
  return true;
}

export function isReportDeletedByTombstone(report: Partial<LabReport> | DeletableRecord): boolean {
  const index = buildIndex(getDeletionTombstones().reports);
  return !keepRecord(report as DeletableRecord, index);
}

export function isInvoiceDeletedByTombstone(invoice: Partial<IncomeRecord> | DeletableRecord): boolean {
  const index = buildIndex(getDeletionTombstones().invoices);
  return !keepRecord(invoice as DeletableRecord, index);
}

export function filterDeletedReports<T extends DeletableRecord>(list: T[]): T[] {
  if (!Array.isArray(list) || list.length === 0) return list;
  purgeProtectedTombstones();
  const tombstones = getDeletionTombstones().reports;
  if (tombstones.length === 0) return list;
  const index = buildIndex(tombstones);
  return list.filter(record => keepRecord(record, index));
}

export function filterDeletedInvoices<T extends DeletableRecord>(list: T[]): T[] {
  if (!Array.isArray(list) || list.length === 0) return list;
  purgeProtectedTombstones();
  const tombstones = getDeletionTombstones().invoices;
  if (tombstones.length === 0) return list;
  const index = buildIndex(tombstones);
  return list.filter(record => keepRecord(record, index));
}
