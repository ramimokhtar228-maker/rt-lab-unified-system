import { LabReport, IncomeRecord } from '../types';

const IDB_NAME = 'rt_lab_idb_backup_v1';
const IDB_VERSION = 1;
const STORE_SNAPSHOTS = 'snapshots';
const SNAPSHOT_KEY = 'latest';

export const PENDING_CLOUD_PUSH_KEY = 'rt_pending_cloud_push';

const REDUNDANT_LEGACY_KEYS = [
  'rt_lab_reports_v1',
  'rt_lab_reports_v2',
  'rt_lab_reports_v3',
  'rt_lab_catalog_v2',
  'rt_lab_custom_catalog_v3',
  'rt_lab_individual_tests_v2',
  'rt_lab_income_records_v1',
  'rt_lab_employees_v1',
  'rt_lab_staff_v2',
  'rt_lab_staff_v3',
  'rt_lab_info_v2',
  'rt_lab_incoming_orders_queue'
];

export interface IdbSnapshotData {
  reports: LabReport[];
  incomeRecords: IncomeRecord[];
  updatedAt: string;
}

/**
 * Evicts duplicate legacy localStorage keys so primary `rt_lab_unified_*` data
 * never suffers from silent QuotaExceededError drops.
 */
export function freeRedundantLocalStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    REDUNDANT_LEGACY_KEYS.forEach(k => {
      try {
        localStorage.removeItem(k);
      } catch {}
    });
  } catch {}
}

/**
 * Safely writes to localStorage; if QuotaExceededError occurs, automatically
 * purges redundant legacy copies and retries once.
 */
export function safeSetLocalStorage(key: string, jsonOrString: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(key, jsonOrString);
    return true;
  } catch (err) {
    freeRedundantLocalStorage();
    try {
      localStorage.setItem(key, jsonOrString);
      return true;
    } catch (retryErr) {
      console.warn(`localStorage write failed even after cleanup (${key}):`, retryErr || err);
      return false;
    }
  }
}

export function isPendingCloudPush(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(PENDING_CLOUD_PUSH_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setPendingCloudPush(pending: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (pending) {
      localStorage.setItem(PENDING_CLOUD_PUSH_KEY, 'true');
    } else {
      localStorage.removeItem(PENDING_CLOUD_PUSH_KEY);
    }
  } catch {}
}

function openIdb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  return new Promise(resolve => {
    try {
      const req = window.indexedDB.open(IDB_NAME, IDB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_SNAPSHOTS)) {
          db.createObjectStore(STORE_SNAPSHOTS);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function saveIdbSnapshot(data: IdbSnapshotData): Promise<void> {
  const db = await openIdb();
  if (!db) return;
  return new Promise(resolve => {
    try {
      const tx = db.transaction(STORE_SNAPSHOTS, 'readwrite');
      const store = tx.objectStore(STORE_SNAPSHOTS);
      store.put(data, SNAPSHOT_KEY);
      tx.oncomplete = () => {
        try { db.close(); } catch {}
        resolve();
      };
      tx.onerror = () => {
        try { db.close(); } catch {}
        resolve();
      };
    } catch {
      try { db.close(); } catch {}
      resolve();
    }
  });
}

export async function loadIdbSnapshot(): Promise<IdbSnapshotData | null> {
  const db = await openIdb();
  if (!db) return null;
  return new Promise(resolve => {
    try {
      const tx = db.transaction(STORE_SNAPSHOTS, 'readonly');
      const store = tx.objectStore(STORE_SNAPSHOTS);
      const req = store.get(SNAPSHOT_KEY);
      req.onsuccess = () => {
        const val = req.result as IdbSnapshotData | undefined;
        try { db.close(); } catch {}
        if (val && (Array.isArray(val.reports) || Array.isArray(val.incomeRecords))) {
          resolve(val);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => {
        try { db.close(); } catch {}
        resolve(null);
      };
    } catch {
      try { db.close(); } catch {}
      resolve(null);
    }
  });
}
