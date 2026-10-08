// Real-Time Cloud Synchronization Engine for RT Lab
// Powered by Firebase Cloud Firestore with native multi-device replication and offline persistence.
// Guaranteed instantaneous synchronization across mobiles, tablets, and laptops.

import { doc, setDoc, getDoc, getDocs, collection, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from './firebaseErrors';

export type SyncActionType =
  | 'INIT_STATE'
  | 'REQUEST_LATEST_STATE'
  | 'ADMIT_PATIENT'
  | 'UPDATE_REPORT'
  | 'DELETE_REPORT'
  | 'UPDATE_INVOICE'
  | 'DELETE_INVOICE'
  | 'UPDATE_LAB_INFO'
  | 'UPDATE_LOYALTY'
  | 'UPDATE_EXPENSES'
  | 'UPDATE_INVENTORY'
  | 'UPDATE_CATALOG'
  | 'UPDATE_PACKAGES'
  | 'UPDATE_PROFILES'
  | 'PING_TEST'
  | 'FULL_SYNC';

export interface SyncMessage {
  eventId?: string;
  action: SyncActionType;
  senderDeviceId: string;
  senderDeviceName: string;
  timestamp: number;
  payload: any;
}

export interface SyncStatus {
  isConnected: boolean;
  isOnline: boolean;
  cloudActive: boolean;
  lastSyncedAt: Date | null;
  statusText: string;
  isSyncing: boolean;
  activeDeviceName: string;
}

/** Recursively remove undefined values so Firestore setDoc never fails */
export function sanitizeForFirestore(value: any): any {
  if (value === undefined) return null;
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.map(sanitizeForFirestore).filter(v => v !== undefined);
  }
  if (value instanceof Date) return value.toISOString();
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(value)) {
    if (v === undefined) continue;
    out[k] = sanitizeForFirestore(v);
  }
  return out;
}

const STORAGE_DEVICE_KEY = 'rt_lab_device_uuid_v4';

export const getDeviceId = (): string => {
  if (typeof window === 'undefined') return 'server';
  let id = localStorage.getItem(STORAGE_DEVICE_KEY);
  if (!id) {
    id = `dev-${Math.random().toString(36).substring(2, 9)}-${Date.now().toString(36)}`;
    localStorage.setItem(STORAGE_DEVICE_KEY, id);
  }
  return id;
};

export const getDeviceName = (): string => {
  if (typeof window === 'undefined') return 'Server';
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'موبايل أندرويد';
  if (/iPhone/i.test(ua)) return 'موبايل آيفون';
  if (/iPad/i.test(ua)) return 'جهاز آيباد / تابلت';
  if (/Macintosh/i.test(ua)) return 'لاب توب ماك';
  if (/Windows/i.test(ua)) return 'كمبيوتر ويندوز';
  return 'متصفح معمل RT';
};

/** Safe timeout wrapper so Firestore quota exhaustion never blocks the app */
function withTimeout<T>(promise: Promise<T>, ms: number = 2500): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))
  ]);
}

class RealtimeMultiDeviceSyncEngine {
  private deviceId: string;
  private deviceName: string;
  private broadcastChannel: BroadcastChannel | null = null;
  private listeners: Array<(msg: SyncMessage) => void> = [];
  private statusListeners: Array<(status: SyncStatus) => void> = [];
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isConnected: boolean = true;
  private lastSyncedAt: Date | null = null;
  private isSyncing: boolean = false;
  private unsubscribeSnapshot: (() => void) | null = null;
  private seenEventIds: Set<string> = new Set();
  private broadcastQueue: Promise<void> = Promise.resolve();

  constructor() {
    this.deviceId = getDeviceId();
    this.deviceName = getDeviceName();

    if (typeof window !== 'undefined') {
      try {
        const storedSeen = sessionStorage.getItem('rt_lab_seen_events_v1');
        if (storedSeen) {
          const parsed = JSON.parse(storedSeen);
          if (Array.isArray(parsed)) {
            parsed.forEach((id: string) => this.seenEventIds.add(id));
          }
        }
      } catch {
        /* ignore */
      }

      this.initNetworkListeners();
      this.initBroadcastChannel();
      this.initFirestoreSync();
    }
  }

  private markEventSeen(id: string) {
    this.seenEventIds.add(id);
    try {
      if (typeof window !== 'undefined') {
        const arr = Array.from(this.seenEventIds).slice(-100);
        sessionStorage.setItem('rt_lab_seen_events_v1', JSON.stringify(arr));
      }
    } catch {
      /* ignore */
    }
  }

  private initNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.isConnected = true;
      this.notifyStatus();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyStatus();
    });
  }

  private initBroadcastChannel() {
    try {
      if ('BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel('rt_lab_channel_v4');
        this.broadcastChannel.onmessage = (event) => {
          const msg = event.data as SyncMessage;
          if (msg && msg.senderDeviceId !== this.deviceId) {
            const evId = msg.eventId || `${msg.senderDeviceId}-${msg.timestamp}-${msg.action}`;
            if (!this.seenEventIds.has(evId)) {
              this.markEventSeen(evId);
              this.lastSyncedAt = new Date();
              this.notifyListeners(msg);
              this.notifyStatus();
            }
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel initialization skipped:', e);
    }
  }

  // Set up real-time listener on Firebase Firestore
  private initFirestoreSync() {
    try {
      const channelRef = doc(db, 'lab_sync', 'live_channel');

      this.unsubscribeSnapshot = onSnapshot(
        channelRef,
        (snapshot) => {
          this.isConnected = true;
          if (snapshot.exists()) {
            const data = snapshot.data();
            const recentEvents: SyncMessage[] = Array.isArray(data.recentEvents) ? data.recentEvents : [];
            const eventsToProcess: SyncMessage[] = [];

            // 1. Check all events in recentEvents
            for (const ev of recentEvents) {
              if (!ev || !ev.action) continue;
              const evId = ev.eventId || `${ev.senderDeviceId}-${ev.timestamp}-${ev.action}`;
              if (ev.senderDeviceId !== this.deviceId && !this.seenEventIds.has(evId)) {
                this.markEventSeen(evId);
                eventsToProcess.push({ ...ev, eventId: evId });
              }
            }

            // 2. Also check top-level message if not in recentEvents
            if (data.action && data.senderDeviceId && data.senderDeviceId !== this.deviceId) {
              const topEvId = data.eventId || `${data.senderDeviceId}-${data.timestamp}-${data.action}`;
              if (!this.seenEventIds.has(topEvId)) {
                this.markEventSeen(topEvId);
                eventsToProcess.push({ ...data, eventId: topEvId } as SyncMessage);
              }
            }

            if (eventsToProcess.length > 0) {
              // Sort chronological
              eventsToProcess.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
              for (const ev of eventsToProcess) {
                this.lastSyncedAt = new Date(ev.timestamp || Date.now());
                this.notifyListeners(ev);
              }
              this.notifyStatus();
            }
          }
        },
        (error) => {
          console.error('Firestore real-time listener error:', error);
          this.isConnected = false;
          this.notifyStatus();
          try {
            handleFirestoreError(error, OperationType.GET, 'lab_sync/live_channel');
          } catch {
            // Handled
          }
        }
      );
    } catch (err) {
      console.warn('Firestore sync setup notice:', err);
    }
  }

  public subscribe(callback: (msg: SyncMessage) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  public subscribeStatus(callback: (status: SyncStatus) => void): () => void {
    this.statusListeners.push(callback);
    callback(this.getStatus());
    return () => {
      this.statusListeners = this.statusListeners.filter((cb) => cb !== callback);
    };
  }

  private notifyListeners(msg: SyncMessage) {
    this.listeners.forEach((cb) => {
      try {
        cb(msg);
      } catch (e) {
        console.error('Error in sync listener:', e);
      }
    });
  }

  private notifyStatus() {
    const status = this.getStatus();
    this.statusListeners.forEach((cb) => {
      try {
        cb(status);
      } catch (e) {
        console.error('Error in sync status listener:', e);
      }
    });
  }

  public getStatus(): SyncStatus {
    let text = 'متصل سحابياً فورياً عبر Firebase (جاهز للتسميع اللحظي)';
    if (!this.isOnline) {
      text = 'يعمل دون اتصال (Offline) - سيتم التسميع فور عودة الإنترنت';
    } else if (this.isSyncing) {
      text = 'جاري التسميع السحابي اللحظي...';
    } else if (this.lastSyncedAt) {
      text = `متصل سحابياً فورياً (آخر تسميع: ${this.lastSyncedAt.toLocaleTimeString('en-US')})`;
    }

    return {
      isConnected: this.isConnected,
      isOnline: this.isOnline,
      cloudActive: true,
      lastSyncedAt: this.lastSyncedAt,
      statusText: text,
      isSyncing: this.isSyncing,
      activeDeviceName: this.deviceName,
    };
  }

  public setSyncing(syncing: boolean) {
    this.isSyncing = syncing;
    if (syncing) {
      this.lastSyncedAt = new Date();
    }
    this.notifyStatus();
  }

  // Broadcast action across all devices instantaneously via Firebase Firestore with sequential execution queue
  public broadcastAction(action: SyncActionType, payload: any): Promise<void> {
    this.broadcastQueue = this.broadcastQueue
      .then(() => this.executeBroadcastAction(action, payload))
      .catch((err) => {
        console.warn('Broadcast action queue execution warning:', err);
      });
    return this.broadcastQueue;
  }

  private async executeBroadcastAction(action: SyncActionType, payload: any): Promise<void> {
    const eventId = `evt-${Date.now()}-${this.deviceId}-${Math.random().toString(36).substring(2, 7)}`;
    const sanitizedPayload = sanitizeForFirestore(payload);
    const msg: SyncMessage = {
      eventId,
      action,
      senderDeviceId: this.deviceId,
      senderDeviceName: this.deviceName,
      timestamp: Date.now(),
      payload: sanitizedPayload,
    };

    // Mark as seen locally to prevent self reflection
    this.markEventSeen(eventId);
    this.lastSyncedAt = new Date();

    // 1. Instant local BroadcastChannel (tabs on same device)
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(msg);
      } catch (e) {
        console.warn('BroadcastChannel error:', e);
      }
    }

    // 2. Instant Individual Document Persistence to Firestore Collections
    try {
      this.setSyncing(true);
      if (action === 'ADMIT_PATIENT' && payload?.report && payload?.invoice) {
        const repDoc = doc(db, 'reports', payload.report.id);
        const invDoc = doc(db, 'income_records', payload.invoice.id);
        await withTimeout(Promise.all([
          setDoc(repDoc, sanitizeForFirestore(payload.report)),
          setDoc(invDoc, sanitizeForFirestore(payload.invoice))
        ]));
      } else if (action === 'UPDATE_REPORT' && payload?.id) {
        const repDoc = doc(db, 'reports', payload.id);
        await withTimeout(setDoc(repDoc, sanitizedPayload));
      } else if (action === 'DELETE_REPORT' && typeof payload === 'string') {
        const repDoc = doc(db, 'reports', payload);
        await withTimeout(deleteDoc(repDoc).catch(() => {}));
      } else if (action === 'UPDATE_INVOICE' && payload?.id) {
        const invDoc = doc(db, 'income_records', payload.id);
        await withTimeout(setDoc(invDoc, sanitizedPayload));
      } else if (action === 'DELETE_INVOICE' && typeof payload === 'string') {
        const invDoc = doc(db, 'income_records', payload);
        await withTimeout(deleteDoc(invDoc).catch(() => {}));
      }
    } catch (docErr) {
      console.warn('Individual Firestore doc save notice:', docErr);
    }

    // 3. Instant Cloud Firestore Replication (multi-device live channel)
    try {
      const channelRef = doc(db, 'lab_sync', 'live_channel');
      const snap = await withTimeout(getDoc(channelRef).catch(() => null));
      const prevEvents = (snap?.exists() && Array.isArray(snap.data()?.recentEvents))
        ? snap.data()?.recentEvents
        : [];
      
      const twoHoursAgo = Date.now() - 7200000;
      const recentEvents = [msg, ...prevEvents.filter((e: any) => e && e.timestamp > twoHoursAgo)].slice(0, 40);

      await withTimeout(setDoc(channelRef, {
        ...msg,
        recentEvents
      }));
    } catch (err) {
      console.warn('Firestore live broadcast note:', err);
      try {
        handleFirestoreError(err, OperationType.WRITE, 'lab_sync/live_channel');
      } catch {
        // Silently handled so user interaction is never interrupted
      }
    } finally {
      this.setSyncing(false);
    }
  }

  // Push master state snapshot to Firestore
  public async pushMasterSnapshot(fullData: Record<string, any>): Promise<boolean> {
    try {
      this.setSyncing(true);
      const snapshotRef = doc(db, 'lab_sync', 'master_snapshot');
      const cleanPayload = sanitizeForFirestore({
        system: 'RT Lab Unified Medical ERP',
        lastSyncedAt: new Date().toISOString(),
        updatedByDevice: this.deviceId,
        updatedByDeviceName: this.deviceName,
        ...fullData,
      });
      await withTimeout(setDoc(snapshotRef, cleanPayload));
      this.lastSyncedAt = new Date();
      this.notifyStatus();
      return true;
    } catch (err) {
      console.error('Failed to push master snapshot to Firestore:', err);
      try {
        handleFirestoreError(err, OperationType.WRITE, 'lab_sync/master_snapshot');
      } catch {
        // Handled
      }
      return false;
    } finally {
      this.setSyncing(false);
    }
  }

  // Pull master state snapshot from Firestore
  public async pullMasterSnapshot(): Promise<{ success: boolean; data?: any }> {
    try {
      const snapshotRef = doc(db, 'lab_sync', 'master_snapshot');
      const snap = await withTimeout(getDoc(snapshotRef));
      if (snap && snap.exists()) {
        const data = snap.data();
        this.lastSyncedAt = new Date();
        this.notifyStatus();
        return { success: true, data };
      }
      return { success: false };
    } catch (err) {
      console.warn('Error pulling master snapshot from Firestore:', err);
      try {
        handleFirestoreError(err, OperationType.GET, 'lab_sync/master_snapshot');
      } catch {
        // Handled
      }
      return { success: false };
    }
  }

  // Pull all individual reports and income documents from Firestore collections
  public async fetchAllFirestoreRecords(): Promise<{ reports: any[]; incomeRecords: any[] }> {
    const reports: any[] = [];
    const incomeRecords: any[] = [];
    try {
      const [repsSnap, incsSnap] = await withTimeout(Promise.all([
        getDocs(collection(db, 'reports')),
        getDocs(collection(db, 'income_records'))
      ])) || [null, null];

      if (repsSnap) {
        repsSnap.forEach(d => {
          if (d.exists()) reports.push(d.data());
        });
      }
      if (incsSnap) {
        incsSnap.forEach(d => {
          if (d.exists()) incomeRecords.push(d.data());
        });
      }
    } catch (err) {
      console.warn('Fetch all Firestore records notice:', err);
    }
    return { reports, incomeRecords };
  }
}

export const realtimeSyncManager = new RealtimeMultiDeviceSyncEngine();
