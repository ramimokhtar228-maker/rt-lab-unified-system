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
/** Keeps already entered results when two copies of the same report are merged. */
function mergeReportProfiles(winner: AnyRecord, other: AnyRecord): any[] {
  const winnerProfiles = Array.isArray(winner?.profiles) ? winner.profiles : [];
  const otherProfiles = Array.isArray(other?.profiles) ? other.profiles : [];
  if (winnerProfiles.length === 0) return otherProfiles;
  if (otherProfiles.length === 0) return winnerProfiles;
  const used = new Set<number>();
  const hasValue = (value: any) => value !== undefined && value !== null && String(value).trim() !== "";
  const mergedProfiles = winnerProfiles.map((prof: any) => {
    const twinIdx = otherProfiles.findIndex((p: any, i: number) => !used.has(i) && (
      (p?.id && prof?.id && p.id === prof.id) ||
      (p?.profileCode && prof?.profileCode && p.profileCode === prof.profileCode) ||
      (p?.titleEn && prof?.titleEn && p.titleEn === prof.titleEn) ||
      (p?.titleAr && prof?.titleAr && p.titleAr === prof.titleAr)
    ));
    if (twinIdx < 0) return prof;
    used.add(twinIdx);
    const twin = otherProfiles[twinIdx];
    const twinParams = Array.isArray(twin?.parameters) ? twin.parameters : [];
    const parameters = (Array.isArray(prof?.parameters) ? prof.parameters : []).map((param: any) => {
      if (hasValue(param?.result)) return param;
      const twinParam = twinParams.find((p: any) =>
        (p?.id && param?.id && p.id === param.id) || (p?.name && param?.name && p.name === param.name));
      if (twinParam && hasValue(twinParam.result)) {
        return { ...param, result: twinParam.result, flag: twinParam.flag || param?.flag };
      }
      return param;
    });
    return { ...prof, parameters };
  });
  const extras = otherProfiles.filter((_: any, i: number) => !used.has(i));
  return [...mergedProfiles, ...extras];
}

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
    // عند تساوي الطوابع (سجل قديم بلا طابع زمني) تفوز النسخة السحابية لأنها المصدر الموحّد
    const cloudStamp = recordStamp(record);
    const localStamp = recordStamp(existing);
    const winner = cloudStamp >= localStamp ? record : existing;
    const loser = winner === record ? existing : record;
    const baseMerged = fillGaps(winner, loser);
    const merged = collection === 'reports'
      ? { ...baseMerged, profiles: mergeReportProfiles(baseMerged, loser) }
      : baseMerged;
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
