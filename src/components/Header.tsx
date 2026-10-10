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
  X,
  Globe,
  Activity,
  Watch,
  Smartphone,
  Headphones,
  ShieldCheck,
  AlertTriangle,
  FolderArchive,
  Languages
} from 'lucide-react';
import { RTLogo } from './RTLogo';
import { PWAInstallButton } from './PWAInstallButton';
import { detectPanicValues } from '../utils/criticalAlertEngine';

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
    githubConfig,
    setIsDoctorCriticalAlertModalOpen,
    setIsEhrModalOpen,
    setIsBiomarkersModalOpen,
    setIsWearablesModalOpen,
    setIsMobilePortalModalOpen,
    setIsHistoricalPortalModalOpen,
    setIsSupportModalOpen,
    setIsSecurityModalOpen,
    toggleLanguage,
    language
  } = useApp();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  const hasAnyPanicValues = React.useMemo(() => {
    return reports.some(r => detectPanicValues(r).length > 0);
  }, [reports]);

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
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#800000] via-[#991b1b] to-[#0f172a] flex items-center justify-center p-1 shadow-lg shadow-rose-900/40 border border-rose-600/50 group-hover:scale-105 transition-transform">
                <div className="w-full h-full rounded-lg bg-slate-950 flex flex-col items-center justify-center">
                  <span className="font-black text-xs text-rose-500">RT</span>
                  <span className="text-[6px] font-bold text-slate-300">LAB</span>
                </div>
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-2">
                  <span className="font-black text-lg text-white tracking-wide">معمل RT للتحاليل الطبية</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-900/80 text-rose-200 border border-rose-700/60 font-mono">
                    RT LAB
                  </span>
                </div>
                <div className="text-xs text-rose-300 font-bold flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                  <span>التشخيص الصحيح يبدأ معنا</span>
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

            {/* Critical Panic Alerts Doctor Button */}
            <button
              onClick={() => setIsDoctorCriticalAlertModalOpen(true)}
              title="نظام تنبيهات الطوارئ الفوري للأطباء (Panic Values Alert)"
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95 ${
                hasAnyPanicValues
                  ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse ring-2 ring-red-400'
                  : 'bg-slate-800 hover:bg-slate-700 text-red-300 border border-red-900/50'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="hidden sm:inline">إنذار الأطباء الحرِج</span>
              {hasAnyPanicValues && (
                <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
              )}
            </button>

            {/* Quick Action: New Patient Admission */}
            <button
              onClick={() => setIsPatientFormOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-900/30 transition-all cursor-pointer active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>تسجيل مريض</span>
            </button>

            {/* Biomarkers Trend Dashboard */}
            <button
              onClick={() => setIsBiomarkersModalOpen(true)}
              title="لوحة تحكم الرسوم البيانية المتطورة للبيانات الحيوية"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 transition-colors cursor-pointer"
            >
              <Activity className="w-4 h-4" />
            </button>

            {/* Wearable Medical Devices IoT */}
            <button
              onClick={() => setIsWearablesModalOpen(true)}
              title="مزامنة الأجهزة الطبية القابلة للارتداء (Apple Health & Dexcom CGM)"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 transition-colors cursor-pointer"
            >
              <Watch className="w-4 h-4" />
            </button>

            {/* Patient Mobile Portal Companion */}
            <button
              onClick={() => setIsMobilePortalModalOpen(true)}
              title="تطبيق الجوال لمراقبة الصحة للمرضى"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 transition-colors cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
            </button>

            {/* Historical Patient Records */}
            <button
              onClick={() => setIsHistoricalPortalModalOpen(true)}
              title="البوابة الإلكترونية الآمنة للسجلات التاريخية"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition-colors cursor-pointer"
            >
              <FolderArchive className="w-4 h-4" />
            </button>

            {/* International EHR / HL7 FHIR */}
            <button
              onClick={() => setIsEhrModalOpen(true)}
              title="التكامل مع السجلات الصحية الإلكترونية الدولية (HL7 FHIR R4)"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 transition-colors cursor-pointer"
            >
              <Globe className="w-4 h-4" />
            </button>

            {/* Security & End-to-End Encryption */}
            <button
              onClick={() => setIsSecurityModalOpen(true)}
              title="التشفير الكامل وأمن معلومات المرضى (AES-256-GCM / HIPAA)"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
            </button>

            {/* 24/7 Clinical & Technical Support */}
            <button
              onClick={() => setIsSupportModalOpen(true)}
              title="الدعم الفني والاستشاري 24/7"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 transition-colors cursor-pointer"
            >
              <Headphones className="w-4 h-4" />
            </button>

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              title="تبديل لغة الواجهة (العربية / English)"
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <Languages className="w-3.5 h-3.5 text-slate-400" />
              <span>{language === 'ar' ? 'EN' : 'عربي'}</span>
            </button>

            {/* Quick Action: Lab Info & Branches Edit */}
            <button
              onClick={() => setIsLabInfoModalOpen(true)}
              className="hidden xl:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-900/80 hover:bg-blue-800 text-blue-200 border border-blue-700/60 font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
              title="تعديل بيانات المعمل، الفروع، التوقيعات، الهواتف، والاعتماد"
            >
              <Building2 className="w-4 h-4 text-blue-300" />
              <span>بيانات المعمل</span>
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
                title="تسميع فوري لحظي وجلب كل البيانات المسجلة على كافة الأجهزة (موبايل، تابلت، ولاب توب)"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 hover:border-emerald-500/50 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-sm"
              >
                {isDeviceSyncing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-400" />
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse" />
                )}
                <span>⚡ التسميع اللحظي للأجهزة</span>
              </button>
              {syncStatusMsg && (
                <div className="absolute left-0 top-full mt-2 w-72 bg-slate-900 text-emerald-400 border border-emerald-500/50 text-[11px] font-bold p-3 rounded-xl shadow-2xl z-50 animate-in fade-in">
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
