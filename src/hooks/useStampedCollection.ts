import { useCallback, useState } from 'react';

/**
 * حالة مجموعة بيانات مع طابع زمني تلقائي لكل سجل يتغيّر محلياً.
 * يضمن أن أحدث تعديل من أي جهاز هو الذي يفوز عند المزامنة،
 * ولا يُعاد ختم السجلات القادمة من السحابة (حتى لا تدور المزامنة بلا نهاية).
 */
export function useStampedCollection<T extends Record<string, any>>(initial: T[] | (() => T[])) {
  const [items, setItems] = useState<T[]>(initial as T[]);

  const setItemsStamped = useCallback((action: any) => {
    setItems(prev => {
      const next = typeof action === 'function' ? action(prev) : action;
      if (!Array.isArray(next)) return next;
      if (!Array.isArray(prev) || prev.length === 0) return next;

      const prevById = new Map<string, T>();
      prev.forEach(record => {
        if (record && record.id) prevById.set(String(record.id), record);
      });

      let changed = false;
      const out = next.map((record: T) => {
        if (!record || !record.id) return record;
        const before = prevById.get(String(record.id));
        if (before && JSON.stringify(before) === JSON.stringify(record)) return record;

        const incomingStamp = (record as any).updatedAt;
        const prevStamp = before ? (before as any).updatedAt : undefined;
        if (incomingStamp && incomingStamp !== prevStamp) return record;

        changed = true;
        return { ...(record as any), updatedAt: new Date().toISOString() } as T;
      });

      return changed ? out : next;
    });
  }, []);

  return [items, setItemsStamped] as const;
}
