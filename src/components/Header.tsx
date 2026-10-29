import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  User,
  Shield,
  Bell,
  Cloud,
  Check,
  RefreshCw,
  PlusCircle,
  Barcode,
  Building2,
  Calendar,
  Layers,
  ChevronDown,
  X,
  Zap,
  Activity,
  Smartphone,
  Laptop,
  Sun,
  SunMedium
} from 'lucide-react';
import { RTLogo } from './RTLogo';
import { PWAInstallButton } from './PWAInstallButton';
import { useScreenWakeLock } from '../hooks/useScreenWakeLock';
import {
  realtimeSyncManager,
  SyncStatus,
  DevicePresence,
  getDeviceName
} from '../utils/realtimeMultiDeviceSync';

export const Header: React.FC = () => {
  const {
    currentUser,
    setLoginModalOpen,
    reports,
    incomeRecords,
    activeTab,
    setActiveTab,
    setIsPatientFormOpen,
    setIsBarcodeScannerOpen,
    setIsLabInfoModalOpen,
    setIsCloudSyncOpen,
    notifications,
    markNotificationRead,
    clearNotifications,
    syncAllDevicesNow,
    githubConfig
  } = useApp();

  const { isWakeLockActive, toggleWakeLock } = useScreenWakeLock();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(realtimeSyncManager.getStatus());
  const [activeDevices, setActiveDevices] = useState<DevicePresence[]>(realtimeSyncManager.getActiveDevices());

  useEffect(() => {
    const unsubStatus = realtimeSyncManager.subscribeStatus((st) => setSyncStatus(st));
    const unsubPresence = realtimeSyncManager.subscribePresence((devs) => setActiveDevices(devs));
    return () => {
      unsubStatus();
      unsubPresence();
    };
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayIncome = incomeRecords.filter(r => r.createdAt.startsWith(todayStr));
  const todayRevenue = todayIncome.reduce((sum, r) => sum + r.paidAmount, 0);
  const todaySamples = reports.filter(r => r.createdAt.startsWith(todayStr)).length;
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleQuickSync = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSyncing(true);
    setSyncStatusMsg(null);
    try {
      const res = await syncAllDevicesNow();
      setSyncStatusMsg(res.message);
      setTimeout(() => setSyncStatusMsg(null), 5000);
    } catch {
      setSyncStatusMsg("فشلت المزامنة السحابية — يرجى التحقق من اتصال الإنترنت.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <header className="bg-slate-900 border-b border-rose-950/60 text-white shadow-xl sticky top-0 z-30 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <div
              onClick={() => setActiveTab('dashboard')}
              className="cursor-pointer flex items-center gap-2 group hover:opacity-95 transition-opacity"
            >
              <RTLogo size="md" variant="full" showSlogan={false} />
            </div>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Today's Quick Metrics */}
            <div className="hidden lg:flex items-center gap-3 bg-slate-800/80 border border-slate-700/70 rounded-xl px-3 py-1.5 text-xs font-medium">
              <div className="text-center px-1">
                <span className="text-[10px] text-slate-400 block">إيراد اليوم</span>
                <span className="font-mono font-bold text-emerald-400">{todayRevenue.toLocaleString('en-US')} ج.م</span>
              </div>
              <div className="h-6 w-px bg-slate-700" />
              <div className="text-center px-1">
                <span className="text-[10px] text-slate-400 block">عينات اليوم</span>
                <span className="font-mono font-bold text-rose-300">{todaySamples}</span>
              </div>
            </div>

            {/* PWA Install Button */}
            <PWAInstallButton variant="header" />

            {/* Quick Action: New Patient Admission */}
            <button
              onClick={() => setIsPatientFormOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-900/30 transition-all cursor-pointer active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>تسجيل مريض وحجز</span>
            </button>

            {/* Quick Action: Lab Info & Branches Edit */}
            <button
              onClick={() => setIsLabInfoModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-900/80 hover:bg-blue-800 text-blue-200 border border-blue-700/60 font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
              title="تعديل بيانات المعمل، الفروع، التوقيعات، الهواتف، والاعتماد"
            >
              <Building2 className="w-4 h-4 text-blue-300" />
              <span className="hidden sm:inline">بيانات المعمل والفروع</span>
            </button>

            {/* Quick Action: Barcode Scanner */}
            <button
              onClick={() => setIsBarcodeScannerOpen(true)}
              title="مسح باركود العينة"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            >
              <Barcode className="w-4 h-4" />
            </button>

            {/* Multi-Device Live Sync Status Button (Opens Realtime Center) */}
            <div className="relative">
              <button
                onClick={() => setIsCloudSyncOpen(true)}
                title="فتح مركز التزامن السحابي والربط اللحظي بين الفروع والأجهزة"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-emerald-500/40 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-xs group"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                </span>
                <span className="flex items-center gap-1">
                  <span>تسميع سحابي</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-950 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                    {activeDevices.length} {activeDevices.length === 1 ? 'جهاز' : 'أجهزة'}
                  </span>
                </span>
                <span
                  onClick={handleQuickSync}
                  className="p-1 -ml-1 text-slate-400 hover:text-white rounded hover:bg-slate-600 transition-colors"
                  title="مزامنة فورية سريعة"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-rose-400' : ''}`} />
                </span>
              </button>
              {syncStatusMsg && (
                <div className="absolute left-0 top-full mt-2 w-64 bg-slate-800 text-emerald-400 border border-slate-700 text-[11px] p-2.5 rounded-xl shadow-2xl z-50">
                  {syncStatusMsg}
                </div>
              )}
            </div>

            {/* Screen Wake Lock Button (منع انطفاء أو قفل الشاشة تلقائياً) */}
            <button
              onClick={toggleWakeLock}
              type="button"
              title={isWakeLockActive ? "الشاشة نشطة ومضيئة دائماً — لن تنطفئ أو تقفل تلقائياً أثناء العمل" : "اضغط لإبقاء الشاشة مضيئة ومنع قفلها التلقائي"}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer active:scale-95 shadow-sm ${
                isWakeLockActive
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30 ring-1 ring-amber-400/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Sun className={`w-3.5 h-3.5 ${isWakeLockActive ? 'text-amber-400 animate-spin-slow' : 'text-slate-400'}`} />
              <span className="hidden md:inline">{isWakeLockActive ? 'الشاشة نشطة دائماً 🔆' : 'إبقاء الشاشة مضيئة'}</span>
            </button>

            {/* Refresh and Update All Items and Bookings Button (تحديث شامل لكافة التحاليل والحجوزات) */}
            <button
              onClick={handleQuickSync}
              disabled={isSyncing}
              type="button"
              title="تحديث شامل فوري: جلب كافة الفحوصات، باقات التحاليل، وقائمة الحجوزات السحابية"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-60 border border-emerald-500/30"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-white' : 'text-emerald-200'}`} />
              <span className="hidden sm:inline">{isSyncing ? 'جاري التحديث...' : 'تحديث شامل لكافة العناصر'}</span>
              <span className="bg-emerald-950/70 text-emerald-300 px-1.5 py-0.5 rounded text-[11px] font-mono font-bold border border-emerald-400/30" title="عدد الحالات والتقارير المحجوزة">
                {reports.length} حالة
              </span>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(prev => !prev)}
                className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notificationsOpen && (
                <div className="absolute left-0 top-full mt-2 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
                    <span className="font-bold text-xs text-white">الإشعارات والتنبيهات ({notifications.length})</span>
                    <button
                      onClick={clearNotifications}
                      className="text-[10px] text-slate-400 hover:text-rose-400"
                    >
                      مسح الكل
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-800">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">لا توجد إشعارات جديدة</div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationRead(n.id)}
                          className={`p-3 text-right hover:bg-slate-800/60 cursor-pointer ${n.read ? 'opacity-60' : 'bg-rose-950/20'}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs text-white">{n.title}</span>
                            <span className="text-[10px] text-slate-400">{n.timestamp}</span>
                          </div>
                          <p className="text-[11px] text-slate-300">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Current User Pill / Switch Role */}
            <button
              onClick={() => setLoginModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer text-right"
            >
              <div className={`w-7 h-7 rounded-lg ${currentUser.avatarColor} text-white flex items-center justify-center font-bold text-xs`}>
                {currentUser.nameAr.charAt(0)}
              </div>
              <div className="leading-tight hidden sm:block">
                <span className="font-bold text-xs text-white block">{currentUser.nameAr}</span>
                <span className="text-[10px] text-rose-300 block">{currentUser.titleAr.split(' - ')[0]}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
