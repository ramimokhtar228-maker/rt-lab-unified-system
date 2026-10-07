import React, { useState } from 'react';
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
  X
} from 'lucide-react';
import { RTLogo } from './RTLogo';
import { PWAInstallButton } from './PWAInstallButton';

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
    notifications,
    markNotificationRead,
    clearNotifications,
    syncUnifiedDataToGitHub,
    fetchAllDevicesData,
    isDeviceSyncing,
    lastDeviceSyncAt,
    githubConfig
  } = useApp();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayIncome = incomeRecords.filter(r => r.createdAt.startsWith(todayStr));
  const todayRevenue = todayIncome.reduce((sum, r) => sum + r.paidAmount, 0);
  const todaySamples = reports.filter(r => r.createdAt.startsWith(todayStr)).length;
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleCloudSync = async () => {
    setSyncStatusMsg(null);
    try {
      const res = await fetchAllDevicesData();
      if (res.success) {
        setSyncStatusMsg(`تم التسميع وجلب كافة البيانات بنجاح (${reports.length} تقرير و ${incomeRecords.length} فاتورة)`);
      } else {
        setSyncStatusMsg(res.message || "فشلت المزامنة");
      }
      setTimeout(() => setSyncStatusMsg(null), 5000);
    } catch {
      setSyncStatusMsg("فشلت المزامنة والتسميع");
      setTimeout(() => setSyncStatusMsg(null), 4000);
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
              className="cursor-pointer flex items-center gap-3 group"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-700 to-rose-950 flex items-center justify-center p-2 shadow-lg shadow-rose-900/40 border border-rose-600/50 group-hover:scale-105 transition-transform">
                <RTLogo className="w-full h-full text-white" />
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-2">
                  <span className="font-black text-lg text-white tracking-wide">معامل RT</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-900/80 text-rose-200 border border-rose-700/60 font-mono">
                    UNIFIED ERP & LIS
                  </span>
                </div>
                <div className="text-xs text-rose-300 font-bold">
                  معامل رامي مختار <span className="text-slate-400 font-normal">| أطباء كلية طب قصر العيني</span>
                </div>
              </div>
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
              <span>بيانات المعمل والفروع</span>
            </button>

            {/* Quick Action: Barcode Scanner */}
            <button
              onClick={() => setIsBarcodeScannerOpen(true)}
              title="مسح باركود العينة"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            >
              <Barcode className="w-4 h-4" />
            </button>

            {/* Multi-Device Live Sync Status Button */}
            <div className="relative">
              <button
                onClick={handleCloudSync}
                disabled={isDeviceSyncing}
                title="تسميع ومزامنة حية فورية بين الموبايل واللاب توب وجميع الأجهزة"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
              >
                {isDeviceSyncing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-400" />
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-xs shadow-emerald-500 animate-pulse" />
                )}
                <span>مزامنة الأجهزة</span>
              </button>
              {syncStatusMsg && (
                <div className="absolute left-0 top-full mt-2 w-64 bg-slate-800 text-emerald-400 border border-slate-700 text-[11px] p-2.5 rounded-xl shadow-2xl z-50">
                  {syncStatusMsg}
                </div>
              )}
            </div>

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
