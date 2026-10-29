export interface DeletionTombstone {
  id: string;
  reportNumber?: string;
  barcode?: string;
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
  barcode?: string;
  patient?: { barcode?: string; fullName?: string };
}

const STORAGE_KEY = 'rt-deletion-registry';
const MAX_TOMBSTONES = 2000;

function emptyRegistry(): DeletionRegistry {
  return { reports: [], invoices: [] };
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ reports: trim(registry.reports), invoices: trim(registry.invoices) }));
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
    reportNumber: report.reportNumber,
    barcode: report.patient?.barcode,
    deletedAt: new Date().toISOString()
  });
  persist(registry);
}

export function registerInvoiceDeletion(record?: DeletableRecord | null): void {
  if (!record || !record.id) return;
  const registry = getDeletionTombstones();
  registry.invoices = upsert(registry.invoices, {
    id: record.id,
    reportNumber: record.invoiceNumber,
    barcode: record.barcode,
    deletedAt: new Date().toISOString()
  });
  persist(registry);
}

interface TombstoneIndex {
  ids: Set<string>;
  numbers: Set<string>;
  barcodes: Set<string>;
}

function buildIndex(tombstones: DeletionTombstone[]): TombstoneIndex {
  const ids = new Set<string>();
  const numbers = new Set<string>();
  const barcodes = new Set<string>();
  tombstones.forEach(tombstone => {
    if (tombstone.id) ids.add(tombstone.id);
    if (tombstone.reportNumber) numbers.add(tombstone.reportNumber);
    if (tombstone.barcode) barcodes.add(tombstone.barcode);
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
      if (PROTECTED_IDENTIFIERS.has(t.id) || (t.reportNumber && PROTECTED_IDENTIFIERS.has(t.reportNumber)) || (t.barcode && PROTECTED_IDENTIFIERS.has(t.barcode))) {
        return true;
      }
      return false;
    };
    registry.reports = registry.reports.filter(t => !isProtected(t));
    registry.invoices = registry.invoices.filter(t => !isProtected(t));
    persist(registry);
  } catch {}
}

function keepRecord(record: DeletableRecord, index: TombstoneIndex): boolean {
  if (!record) return false;
  const barcode = record.barcode || record.patient?.barcode;
  const number = record.reportNumber || record.invoiceNumber;
  const patientName = (record as any).patientName || (record as any).fullName || record.patient?.fullName || '';

  // Never drop protected patient cases (Dina, Hind, Manar, etc.)
  if (barcode && PROTECTED_IDENTIFIERS.has(barcode)) return true;
  if (number && PROTECTED_IDENTIFIERS.has(number)) return true;
  if (record.id && PROTECTED_IDENTIFIERS.has(record.id)) return true;
  if (patientName && PROTECTED_NAMES.some(n => patientName.includes(n))) return true;

  if (record.id && index.ids.has(record.id)) return false;
  if (number && index.numbers.has(number)) return false;
  if (barcode && index.barcodes.has(barcode)) return false;
  return true;
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
