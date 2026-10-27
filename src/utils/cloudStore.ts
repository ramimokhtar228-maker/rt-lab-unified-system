// ── أدوات المزامنة السحابية الشاملة: دمج دقيق لكل سجل + سجل حذف موحّد + طوابع زمنية للإعدادات
export type AnyRecord = Record<string, any>;

const DELETED_KEY = 'rt_lab_deleted_map_v1';
const STAMPS_KEY = 'rt_lab_settings_stamps_v1';

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: any) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // التخزين المحلي غير متاح
  }
}

/** سجل الحذف الموحّد: أي سجل محذوف على جهاز يُحذف على كل الأجهزة */
export function getDeletedMap(): Record<string, string[]> {
  const map = readJSON<Record<string, string[]>>(DELETED_KEY, {});
  const out: Record<string, string[]> = {};
  Object.keys(map || {}).forEach(key => {
    const ids = Array.isArray(map[key]) ? map[key].filter(id => typeof id === 'string') : [];
    if (ids.length) out[key] = Array.from(new Set(ids));
  });
  return out;
}

export function importDeletedMap(incoming?: Record<string, string[]>) {
  if (!incoming || typeof incoming !== 'object') return;
  const map = readJSON<Record<string, string[]>>(DELETED_KEY, {});
  let changed = false;
  Object.keys(incoming).forEach(key => {
    const ids = Array.isArray(incoming[key]) ? incoming[key].filter(id => typeof id === 'string') : [];
    if (!ids.length) return;
    const set = new Set(map[key] || []);
    ids.forEach(id => {
      if (!set.has(id)) {
        set.add(id);
        changed = true;
      }
    });
    map[key] = Array.from(set);
  });
  if (changed) writeJSON(DELETED_KEY, map);
}

export function markDeleted(collection: string, id?: string) {
  if (!collection || !id) return;
  const map = readJSON<Record<string, string[]>>(DELETED_KEY, {});
  const set = new Set(map[collection] || []);
  if (set.has(id)) return;
  set.add(id);
  map[collection] = Array.from(set);
  writeJSON(DELETED_KEY, map);
}

/** طابع زمني لكل سجل لمعرفة الأحدث عند التعارض بين الأجهزة */
export function recordStamp(record: AnyRecord): number {
  if (!record || typeof record !== 'object') return 0;
  const raw = record.updatedAt ?? record.updated_date ?? record.lastModified ?? record.modifiedAt ??
    record.timestamp ?? record.createdAt ?? record.created_date ?? record.date ?? '';
  if (typeof raw === 'number') return raw;
  const parsed = Date.parse(String(raw));
  return Number.isFinite(parsed) ? parsed : 0;
}

const isEmptyValue = (value: any) => value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);

function fillGaps(winner: AnyRecord, other: AnyRecord): AnyRecord {
  const out: AnyRecord = { ...winner };
  Object.keys(other || {}).forEach(key => {
    if (isEmptyValue(out[key]) && !isEmptyValue(other[key])) out[key] = other[key];
  });
  return out;
}

/** دمج مجموعة كاملة: الأحدث يفوز، الحقول الناقصة تُكمّل، والمحذوف لا يعود */
export function mergeCollection(collection: string, local: AnyRecord[] = [], cloud: AnyRecord[] = []): AnyRecord[] {
  const localList = Array.isArray(local) ? local.filter(Boolean) : [];
  const cloudList = Array.isArray(cloud) ? cloud.filter(Boolean) : [];
  const deleted = new Set(getDeletedMap()[collection] || []);
  const keyOf = (record: AnyRecord, index: number) =>
    record.id || record.code || record.barcode || record.invoiceNumber || record.reportNumber || `idx-${index}`;

  if (cloudList.length === 0) {
    const filteredLocal = localList.filter((record, index) => !deleted.has(record.id || keyOf(record, index)));
    return filteredLocal.length === localList.length ? local : filteredLocal;
  }

  const map = new Map<string, AnyRecord>();
  const order: string[] = [];
  localList.forEach((record, index) => {
    const key = keyOf(record, index);
    if (deleted.has(record.id || key)) return;
    map.set(key, record);
    order.push(key);
  });

  let changed = false;
  cloudList.forEach((record, index) => {
    const key = keyOf(record, index);
    if (deleted.has(record.id || key)) {
      if (map.has(key)) {
        map.delete(key);
        changed = true;
      }
      return;
    }
    const existing = map.get(key);
    if (!existing) {
      map.set(key, record);
      order.push(key);
      changed = true;
      return;
    }
    const merged = recordStamp(record) > recordStamp(existing) ? fillGaps(record, existing) : fillGaps(existing, record);
    if (JSON.stringify(merged) !== JSON.stringify(existing)) {
      map.set(key, merged);
      changed = true;
    }
  });

  if (!changed) {
    const filteredLocal = localList.filter((record, index) => !deleted.has(record.id || keyOf(record, index)));
    return filteredLocal.length === localList.length ? local : filteredLocal;
  }
  return order.filter(key => map.has(key)).map(key => map.get(key) as AnyRecord);
}

/** طوابع زمنية للإعدادات المفردة (بيانات المعمل، التوقيعات، نسب الأرباح…) */
export function getSettingsStamps(): Record<string, string> {
  return readJSON<Record<string, string>>(STAMPS_KEY, {});
}

export function stampSetting(key: string) {
  const stamps = getSettingsStamps();
  stamps[key] = new Date().toISOString();
  writeJSON(STAMPS_KEY, stamps);
}

export function importSettingsStamps(incoming?: Record<string, string>) {
  if (!incoming || typeof incoming !== 'object') return;
  const stamps = getSettingsStamps();
  let changed = false;
  Object.keys(incoming).forEach(key => {
    const incomingStamp = Date.parse(String(incoming[key] || '')) || 0;
    const currentStamp = Date.parse(String(stamps[key] || '')) || 0;
    if (incomingStamp > currentStamp) {
      stamps[key] = incoming[key];
      changed = true;
    }
  });
  if (changed) writeJSON(STAMPS_KEY, stamps);
}

/** دمج إعداد مفرد: النسخة الأحدث زمنياً هي التي تُعتمد */
export function mergeSettingsObject(key: string, local: any, cloud: any, cloudStamps: Record<string, string> = {}) {
  if (!cloud || typeof cloud !== 'object') return local;
  if (!local || typeof local !== 'object') return cloud;
  const localStamp = Date.parse(String(getSettingsStamps()[key] || '')) || 0;
  const cloudStamp = Date.parse(String(cloudStamps?.[key] || '')) || 0;
  if (cloudStamp > localStamp) {
    stampSetting(key);
    return cloud;
  }
  const merged = fillGaps(cloud, local);
  return JSON.stringify(merged) === JSON.stringify(local) ? local : merged;
}
