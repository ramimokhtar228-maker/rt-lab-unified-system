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
  patient?: { barcode?: string };
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

function keepRecord(record: DeletableRecord, index: TombstoneIndex): boolean {
  if (!record) return false;
  const barcode = record.barcode || record.patient?.barcode;
  const number = record.reportNumber || record.invoiceNumber;
  if (record.id && index.ids.has(record.id)) return false;
  if (number && index.numbers.has(number)) return false;
  if (barcode && index.barcodes.has(barcode)) return false;
  return true;
}

export function filterDeletedReports<T extends DeletableRecord>(list: T[]): T[] {
  if (!Array.isArray(list) || list.length === 0) return list;
  const tombstones = getDeletionTombstones().reports;
  if (tombstones.length === 0) return list;
  const index = buildIndex(tombstones);
  return list.filter(record => keepRecord(record, index));
}

export function filterDeletedInvoices<T extends DeletableRecord>(list: T[]): T[] {
  if (!Array.isArray(list) || list.length === 0) return list;
  const tombstones = getDeletionTombstones().invoices;
  if (tombstones.length === 0) return list;
  const index = buildIndex(tombstones);
  return list.filter(record => keepRecord(record, index));
}
