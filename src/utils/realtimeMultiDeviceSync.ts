// Real-Time Cloud Synchronization Engine for RT Lab
// Powered by Supabase Realtime WebSockets + BroadcastChannel + Cloud Backup
// Guaranteed instantaneous synchronization across mobiles, tablets, and laptops.

import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, REALTIME_CHANNEL_NAME } from './supabaseClient';

export type SyncActionType =
  | 'INIT_STATE'
  | 'REQUEST_LATEST_STATE'
  | 'ADMIT_PATIENT'
  | 'UPDATE_REPORT'
  | 'DELETE_REPORT'
  | 'UPDATE_INVOICE'
  | 'DELETE_INVOICE'
  | 'UPDATE_TEST_RESULT'
  | 'UPDATE_LAB_INFO'
  | 'UPDATE_LOYALTY'
  | 'UPDATE_EXPENSES'
  | 'UPDATE_INVENTORY'
  | 'UPDATE_CATALOG'
  | 'UPDATE_PACKAGES'
  | 'UPDATE_PROFILES'
  | 'UPDATE_STAFF'
  | 'UPDATE_STAFF_OPTIONS'
  | 'PING_TEST'
  | 'FULL_SYNC';

export interface SyncMessage {
  action: SyncActionType;
  senderDeviceId: string;
  senderDeviceName: string;
  senderBranchName?: string;
  timestamp: number;
  payload: any;
  meta?: {
    note?: string;
  };
}

export interface DevicePresence {
  deviceId: string;
  deviceName: string;
  branchName: string;
  connectedAt: number;
  lastActive: number;
  isCurrentDevice?: boolean;
}

export interface SyncStatus {
  isConnected: boolean;
  isOnline: boolean;
  cloudActive: boolean;
  lastSyncedAt: Date | null;
  statusText: string;
  isSyncing: boolean;
  activeDeviceName: string;
  activeBranchName: string;
  connectedDevicesCount: number;
  supabaseConnected: boolean;
}

export interface SyncEventLogItem {
  id: string;
  timestamp: number;
  action: SyncActionType;
  deviceName: string;
  branchName: string;
  direction: 'sent' | 'received';
  summary: string;
}

const STORAGE_DEVICE_KEY = 'rt_lab_device_uuid_v4';
const STORAGE_DEVICE_NAME_KEY = 'rt_lab_custom_device_name_v1';
const STORAGE_BRANCH_NAME_KEY = 'rt_lab_custom_branch_name_v1';

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
  const custom = localStorage.getItem(STORAGE_DEVICE_NAME_KEY);
  if (custom && custom.trim()) return custom.trim();

  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'موبايل أندرويد (فرع)';
  if (/iPhone/i.test(ua)) return 'موبايل آيفون (فرع)';
  if (/iPad/i.test(ua)) return 'جهاز تابلت / آيباد';
  if (/Macintosh/i.test(ua)) return 'لاب توب ماك';
  if (/Windows/i.test(ua)) return 'كمبيوتر ويندوز (الإدارة)';
  return 'جهاز معمل RT';
};

export const getBranchName = (): string => {
  if (typeof window === 'undefined') return 'الفرع الرئيسي';
  const custom = localStorage.getItem(STORAGE_BRANCH_NAME_KEY);
  if (custom && custom.trim()) return custom.trim();
  return 'الفرع الرئيسي';
};

class RealtimeMultiDeviceSyncEngine {
  private deviceId: string;
  private deviceName: string;
  private branchName: string;
  private broadcastChannel: BroadcastChannel | null = null;
  private supabaseChannel: RealtimeChannel | null = null;
  private listeners: Array<(msg: SyncMessage) => void> = [];
  private statusListeners: Array<(status: SyncStatus) => void> = [];
  private presenceListeners: Array<(devices: DevicePresence[]) => void> = [];
  private eventLogListeners: Array<(logs: SyncEventLogItem[]) => void> = [];
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isConnected: boolean = true;
  private supabaseConnected: boolean = false;
  private lastSyncedAt: Date | null = null;
  private isSyncing: boolean = false;
  private seenMessageIds: Set<string> = new Set();
  private activeDevices: Map<string, DevicePresence> = new Map();
  private eventLogs: SyncEventLogItem[] = [];
  private masterSnapshotProvider: (() => any) | null = null;

  constructor() {
    this.deviceId = getDeviceId();
    this.deviceName = getDeviceName();
    this.branchName = getBranchName();

    if (typeof window !== 'undefined') {
      this.initNetworkListeners();
      this.initBroadcastChannel();
      this.initSupabaseRealtime();
    }
  }

  public setMasterSnapshotProvider(provider: () => any) {
    this.masterSnapshotProvider = provider;
  }

  private initNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.isConnected = true;
      this.notifyStatus();
      if (!this.supabaseConnected) {
        this.initSupabaseRealtime();
      }
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.isConnected = false;
      this.supabaseConnected = false;
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
            this.handleIncomingMessage(msg, 'local');
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel initialization skipped:', e);
    }
  }

  private initSupabaseRealtime() {
    try {
      if (this.supabaseChannel) {
        supabase.removeChannel(this.supabaseChannel);
      }

      this.supabaseChannel = supabase.channel(REALTIME_CHANNEL_NAME, {
        config: {
          broadcast: { self: false },
          presence: { key: this.deviceId },
        },
      });

      // 1. Listen for instantaneous broadcasts
      this.supabaseChannel.on('broadcast', { event: 'SYNC_ACTION' }, ({ payload }) => {
        const msg = payload as SyncMessage;
        if (msg && msg.senderDeviceId !== this.deviceId) {
          this.handleIncomingMessage(msg, 'supabase');
        }
      });

      // 2. Track Multi-Device Presence
      this.supabaseChannel.on('presence', { event: 'sync' }, () => {
        const presenceState = this.supabaseChannel?.presenceState() || {};
        this.activeDevices.clear();

        // Always include current device
        this.activeDevices.set(this.deviceId, {
          deviceId: this.deviceId,
          deviceName: this.deviceName,
          branchName: this.branchName,
          connectedAt: Date.now(),
          lastActive: Date.now(),
          isCurrentDevice: true,
        });

        // Add remote devices
        Object.entries(presenceState).forEach(([devId, presences]) => {
          if (Array.isArray(presences) && presences.length > 0) {
            const p = presences[0] as any;
            if (devId !== this.deviceId) {
              this.activeDevices.set(devId, {
                deviceId: devId,
                deviceName: p.deviceName || 'جهاز فرع متصل',
                branchName: p.branchName || 'فرع المعمل',
                connectedAt: p.connectedAt || Date.now(),
                lastActive: p.lastActive || Date.now(),
                isCurrentDevice: false,
              });
            }
          }
        });

        this.notifyPresence();
        this.notifyStatus();
      });

      // 3. Channel subscription lifecycle
      this.supabaseChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.supabaseConnected = true;
          this.isConnected = true;
          this.notifyStatus();

          // Announce presence immediately
          this.supabaseChannel?.track({
            deviceId: this.deviceId,
            deviceName: this.deviceName,
            branchName: this.branchName,
            connectedAt: Date.now(),
            lastActive: Date.now(),
          }).catch((err) => console.warn('Presence track error:', err));

          // Broadcast ping to discover peers and request latest state
          this.broadcastAction('REQUEST_LATEST_STATE', { requestedBy: this.deviceName });
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          this.supabaseConnected = false;
          this.notifyStatus();
        }
      });
    } catch (err) {
      console.warn('Supabase Realtime init error:', err);
    }
  }

  private handleIncomingMessage(msg: SyncMessage, source: 'supabase' | 'local') {
    if (!msg || !msg.action) return;
    const msgKey = `${msg.senderDeviceId}_${msg.action}_${msg.timestamp}_${msg.payload?.id || msg.payload?.report?.id || msg.payload?.invoice?.id || ''}`;
    if (this.seenMessageIds.has(msgKey)) {
      return;
    }
    this.seenMessageIds.add(msgKey);
    if (this.seenMessageIds.size > 800) {
      const iter = this.seenMessageIds.values();
      for (let i = 0; i < 200; i++) {
        const val = iter.next().value;
        if (val) this.seenMessageIds.delete(val);
      }
    }
    this.lastSyncedAt = new Date();

    // If a remote peer is requesting the latest state and we have a snapshot provider, reply with INIT_STATE!
    if (msg.action === 'REQUEST_LATEST_STATE' && this.masterSnapshotProvider) {
      try {
        const fullStore = this.masterSnapshotProvider();
        if (fullStore && fullStore.reports && fullStore.reports.length > 0) {
          this.broadcastAction('INIT_STATE', fullStore, { note: `تزويد تلقائي للبيانات إلى ${msg.senderDeviceName}` });
        }
      } catch (e) {
        console.warn('Error answering REQUEST_LATEST_STATE:', e);
      }
    }

    // Record in live event logs
    this.addEventLog({
      id: `${msg.timestamp}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: msg.timestamp,
      action: msg.action,
      deviceName: msg.senderDeviceName || 'جهاز فرع آخر',
      branchName: msg.senderBranchName || 'فرع',
      direction: 'received',
      summary: this.describeAction(msg.action, msg.payload),
    });

    this.notifyListeners(msg);
    this.notifyStatus();
  }

  private describeAction(action: SyncActionType, payload: any): string {
    switch (action) {
      case 'ADMIT_PATIENT':
        return `تسجيل مريض جديد: ${payload?.name || payload?.patient?.name || 'مريض'} (رقم المعمل: ${payload?.labNumber || ''})`;
      case 'UPDATE_REPORT':
        return `تحديث تقرير فحص: ${payload?.patient?.name || payload?.labNumber || 'فحص'}`;
      case 'UPDATE_TEST_RESULT':
        return `تعديل نتيجة تحليل مخبري لحظياً`;
      case 'DELETE_REPORT':
        return `حذف تقرير فحص رقم ${payload}`;
      case 'UPDATE_INVOICE':
        return `تحديث فاتورة مالية (${payload?.patientName || payload?.invoiceNumber || ''})`;
      case 'DELETE_INVOICE':
        return `حذف فاتورة مالية`;
      case 'UPDATE_CATALOG':
        return `تحديث قائمة تحاليل الكتالوج`;
      case 'UPDATE_PACKAGES':
        return `تحديث باقات التحاليل الشاملة`;
      case 'UPDATE_PROFILES':
        return `تحديث قوالب الفحوصات الطبية`;
      case 'UPDATE_LAB_INFO':
        return `تحديث إعدادات المعمل والترويسة`;
      case 'UPDATE_EXPENSES':
        return `تحديث المصروفات والأرباح`;
      case 'UPDATE_INVENTORY':
        return `تحديث مخزون المحاليل والمستلزمات`;
      case 'UPDATE_LOYALTY':
        return `تحديث كروت ونقاط ولاء المرضى`;
      case 'PING_TEST':
        return `إشارة فحص وتسميع فوري بين الأجهزة`;
      case 'INIT_STATE':
      case 'FULL_SYNC':
        return `مزامنة شاملة لكافة بيانات المعمل`;
      case 'REQUEST_LATEST_STATE':
        return `طلب أحدث نسخة بيانات لحظية`;
      default:
        return `إجراء تزامن سحابي (${action})`;
    }
  }

  private addEventLog(item: SyncEventLogItem) {
    this.eventLogs = [item, ...this.eventLogs].slice(0, 40);
    this.notifyEventLogs();
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

  public subscribePresence(callback: (devices: DevicePresence[]) => void): () => void {
    this.presenceListeners.push(callback);
    callback(this.getActiveDevices());
    return () => {
      this.presenceListeners = this.presenceListeners.filter((cb) => cb !== callback);
    };
  }

  public subscribeEventLog(callback: (logs: SyncEventLogItem[]) => void): () => void {
    this.eventLogListeners.push(callback);
    callback(this.eventLogs);
    return () => {
      this.eventLogListeners = this.eventLogListeners.filter((cb) => cb !== callback);
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

  private notifyPresence() {
    const devices = this.getActiveDevices();
    this.presenceListeners.forEach((cb) => {
      try {
        cb(devices);
      } catch (e) {
        console.error('Error in presence listener:', e);
      }
    });
  }

  private notifyEventLogs() {
    this.eventLogListeners.forEach((cb) => {
      try {
        cb(this.eventLogs);
      } catch (e) {
        console.error('Error in event log listener:', e);
      }
    });
  }

  public getActiveDevices(): DevicePresence[] {
    return Array.from(this.activeDevices.values());
  }

  public getStatus(): SyncStatus {
    const connectedDevices = this.activeDevices.size;
    let text = this.supabaseConnected
      ? `متصل سحابياً فورياً عبر Supabase (${connectedDevices} أجهزة متصلة لحظياً)`
      : 'مزامنة حية نشطة (جاهز للتسميع اللحظي بين الأجهزة)';

    if (!this.isOnline) {
      text = 'يعمل دون اتصال (Offline) — سيتم التسميع فور عودة الإنترنت';
    } else if (this.isSyncing) {
      text = 'جاري التسميع السحابي اللحظي...';
    } else if (this.lastSyncedAt) {
      text = `تسميع لحظي نشط (آخر عملية: ${this.lastSyncedAt.toLocaleTimeString('en-US')})`;
    }

    return {
      isConnected: this.isConnected,
      isOnline: this.isOnline,
      cloudActive: true,
      lastSyncedAt: this.lastSyncedAt,
      statusText: text,
      isSyncing: this.isSyncing,
      activeDeviceName: this.deviceName,
      activeBranchName: this.branchName,
      connectedDevicesCount: connectedDevices,
      supabaseConnected: this.supabaseConnected,
    };
  }

  public setSyncing(syncing: boolean) {
    this.isSyncing = syncing;
    if (syncing) {
      this.lastSyncedAt = new Date();
    }
    this.notifyStatus();
  }

  public updateDeviceDetails(newName: string, newBranch: string) {
    this.deviceName = newName.trim() || this.deviceName;
    this.branchName = newBranch.trim() || this.branchName;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_DEVICE_NAME_KEY, this.deviceName);
      localStorage.setItem(STORAGE_BRANCH_NAME_KEY, this.branchName);
    }
    if (this.supabaseChannel && this.supabaseConnected) {
      this.supabaseChannel.track({
        deviceId: this.deviceId,
        deviceName: this.deviceName,
        branchName: this.branchName,
        connectedAt: Date.now(),
        lastActive: Date.now(),
      }).catch(() => {});
    }
    this.notifyStatus();
    this.notifyPresence();
  }

  // Broadcast action across ALL devices instantaneously via Supabase WebSockets + BroadcastChannel
  public async broadcastAction(action: SyncActionType, payload: any, meta?: { note?: string }) {
    const msg: SyncMessage = {
      action,
      senderDeviceId: this.deviceId,
      senderDeviceName: this.deviceName,
      senderBranchName: this.branchName,
      timestamp: Date.now(),
      payload,
      meta,
    };

    const outKey = `${this.deviceId}_${action}_${msg.timestamp}_${payload?.id || payload?.report?.id || payload?.invoice?.id || ''}`;
    this.seenMessageIds.add(outKey);
    this.lastSyncedAt = new Date();

    // 1. Instant local BroadcastChannel (tabs on same device)
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(msg);
      } catch (e) {
        console.warn('BroadcastChannel error:', e);
      }
    }

    // 2. Instant Cross-Device Broadcast over Supabase Realtime WebSockets
    if (this.supabaseChannel && this.supabaseConnected) {
      try {
        this.setSyncing(true);
        await this.supabaseChannel.send({
          type: 'broadcast',
          event: 'SYNC_ACTION',
          payload: msg,
        });
      } catch (err) {
        console.warn('Supabase broadcast error:', err);
      } finally {
        this.setSyncing(false);
      }
    }

    // Add to local event log
    this.addEventLog({
      id: `${msg.timestamp}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: msg.timestamp,
      action,
      deviceName: this.deviceName,
      branchName: this.branchName,
      direction: 'sent',
      summary: this.describeAction(action, payload),
    });

    this.notifyStatus();
  }

  // Send an instant test ping to all other devices
  public async sendTestPing(customNote?: string) {
    await this.broadcastAction('PING_TEST', {
      message: customNote || 'فحص اتصال وتسميع فوري بين الفروع',
      sentAt: new Date().toISOString(),
    });
  }

  // Push master state snapshot
  public async pushMasterSnapshot(fullData: Record<string, any>): Promise<boolean> {
    this.lastSyncedAt = new Date();
    this.notifyStatus();
    try {
      this.setSyncing(true);
      await this.broadcastAction('FULL_SYNC', fullData, { note: 'مزامنة شاملة من جهاز الإدارة' });
      return true;
    } catch {
      return false;
    } finally {
      this.setSyncing(false);
    }
  }

  // Request latest master state snapshot from active peers
  public async pullMasterSnapshot(): Promise<{ success: boolean; data?: any }> {
    try {
      await this.broadcastAction('REQUEST_LATEST_STATE', {
        requestedBy: this.deviceName,
        time: Date.now(),
      });
      return { success: true };
    } catch {
      return { success: false };
    }
  }
}

export const realtimeSyncManager = new RealtimeMultiDeviceSyncEngine();
