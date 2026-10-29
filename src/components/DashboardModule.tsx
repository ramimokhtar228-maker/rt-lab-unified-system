import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatGenderAr } from '../utils/calculator';
import {
  TrendingUp,
  DollarSign,
  Receipt,
  Users,
  FlaskConical,
  AlertTriangle,
  ArrowUpRight,
  PlusCircle,
  Printer,
  Calendar,
  CreditCard,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  Filter,
  FileText,
  Activity,
  ArrowRight,
  Package,
  AlertCircle,
  Building2,
  RefreshCw,
  Edit,
  Trash2,
  Tag,
  MessageCircle,
  Check,
  Smartphone,
  Laptop
} from 'lucide-react';
import { RTLogo } from './RTLogo';
import { realtimeSyncManager, SyncStatus } from '../utils/realtimeMultiDeviceSync';
import { formatWhatsAppMessage, openWhatsApp } from '../utils/whatsapp';
import { openPrintReportWindow } from '../utils/printReportWindow';
import { PWAInstallButton } from './PWAInstallButton';

export const DashboardModule: React.FC = () => {
  const {
    incomeRecords,
    expenses,
    reports,
    inventory,
    loyaltyProfiles,
    labInfo,
    setActiveTab,
    setSelectedReportId,
    setIsPatientFormOpen,
    setIsLabInfoModalOpen,
    deleteReport,
    deleteIncomeRecord,
    syncAllDevicesNow,
    currentUser,
    profitConfig
  } = useApp();

  const [timeRange, setTimeRange] = useState<'today' | 'month' | 'all'>('today');
  const [casesFilter, setCasesFilter] = useState<'all' | 'today' | 'pending' | 'verified'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(realtimeSyncManager.getStatus());
  const [manualSyncing, setManualSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  useEffect(() => {
    const unsub = realtimeSyncManager.subscribeStatus((st) => {
      setSyncStatus(st);
    });
    return unsub;
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7);

  // Filtered Income & Expenses
  const filteredIncome = useMemo(() => {
    return incomeRecords.filter(r => {
      if (timeRange === 'today') return r.createdAt.startsWith(todayStr);
      if (timeRange === 'month') return r.createdAt.startsWith(currentMonthStr);
      return true;
    });
  }, [incomeRecords, timeRange, todayStr, currentMonthStr]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (timeRange === 'today') return e.date === todayStr;
      if (timeRange === 'month') return e.date.startsWith(currentMonthStr);
      return true;
    });
  }, [expenses, timeRange, todayStr, currentMonthStr]);

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      if (timeRange === 'today') return r.createdAt.startsWith(todayStr);
      if (timeRange === 'month') return r.createdAt.startsWith(currentMonthStr);
      return true;
    });
  }, [reports, timeRange, todayStr, currentMonthStr]);

  // Financial Metrics
  const totalGrossIncome = filteredIncome.reduce((sum, r) => sum + r.netAmount, 0);
  const totalPaidCash = filteredIncome.filter(r => r.paymentMethod === 'cash').reduce((sum, r) => sum + r.paidAmount, 0);
  const totalPaidVisa = filteredIncome.filter(r => r.paymentMethod === 'visa').reduce((sum, r) => sum + r.paidAmount, 0);
  const totalPaidElectronic = filteredIncome.filter(r => ['bank_transfer', 'instapay', 'vodafone_cash'].includes(r.paymentMethod)).reduce((sum, r) => sum + r.paidAmount, 0);
  const totalRemainingDebt = filteredIncome.reduce((sum, r) => sum + r.remainingAmount, 0);
  const totalExpensesAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netOperatingProfit = totalGrossIncome - totalExpensesAmount;

  // Diagnostic Metrics
  const totalTestsConducted = filteredReports.reduce((sum, r) => sum + r.profiles.reduce((pSum, p) => pSum + p.parameters.length, 0), 0);
  const verifiedReportsCount = filteredReports.filter(r => r.status === 'verified' || r.status === 'released').length;
  const pendingReportsCount = filteredReports.filter(r => r.status === 'draft' || r.status === 'in_progress').length;

  // Critical / Panic Alerts
  const panicAlerts = useMemo(() => {
    const list: { reportId: string; patientName: string; labNumber: string; paramName: string; result: string; unit: string; flag: string }[] = [];
    reports.forEach(rep => {
      rep.profiles.forEach(prof => {
        prof.parameters.forEach(p => {
          if (p.flag === 'PANIC_HIGH' || p.flag === 'PANIC_LOW') {
            list.push({
              reportId: rep.id,
              patientName: rep.patient.fullName,
              labNumber: rep.reportNumber,
              paramName: p.name,
              result: p.result,
              unit: p.unit || '',
              flag: p.flag
            });
          }
        });
      });
    });
    return list;
  }, [reports]);

  // Filtered Patients for quick interactive table
  const displayedPatients = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return reports.filter(rep => {
      const name = (rep.patient?.fullName || '').toLowerCase();
      const num = (rep.reportNumber || rep.patient?.labNumber || '').toLowerCase();
      const phone = (rep.patient?.phone || '');
      const barcode = (rep.patient?.barcode || '').toLowerCase();

      const matchSearch =
        !term ||
        name.includes(term) ||
        num.includes(term) ||
        phone.includes(term) ||
        barcode.includes(term);

      if (!matchSearch) return false;

      if (casesFilter === 'today') {
        return (rep.createdAt || '').startsWith(todayStr);
      }
      if (casesFilter === 'pending') {
        return rep.status === 'draft' || rep.status === 'in_progress';
      }
      if (casesFilter === 'verified') {
        return rep.status === 'verified' || rep.status === 'released';
      }
      return true;
    });
  }, [reports, searchTerm, casesFilter, todayStr]);

  const handleManualSyncNow = async () => {
    setManualSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await syncAllDevicesNow();
      setSyncFeedback(res.message);
      setTimeout(() => setSyncFeedback(null), 5000);
    } catch {
      setSyncFeedback('فشلت المزامنة السحابية — يرجى التحقق من اتصال الإنترنت.');
    } finally {
      setManualSyncing(false);
    }
  };

  const handleSendTestPing = async () => {
    try {
      await realtimeSyncManager.broadcastAction('PING_TEST', {
        time: new Date().toLocaleTimeString('en-US'),
      });
      setSyncFeedback(`تم إرسال إشارة التسميع اللحظي بنجاح من (${syncStatus.activeDeviceName})! ستظهر فوراً على اللابتوب والموبايل.`);
      setTimeout(() => setSyncFeedback(null), 6000);
    } catch {
      setSyncFeedback('تعذر إرسال الإشارة');
    }
  };

  const handleForceClearCacheAndReload = async () => {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.update()));
      }
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  const handleDeleteCase = (reportId: string, invoiceId?: string) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا المريض والتقرير نهائياً؟')) {
      deleteReport(reportId);
      if (invoiceId) {
        deleteIncomeRecord(invoiceId);
      }
    }
  };

  return (
    <div className="space-y-7 pb-8">
      {/* Page backdrop */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-slate-50" aria-hidden />

      <PWAInstallButton variant="banner" />

      {/* Hero: brand, lab identity, primary actions */}
      <section className="relative overflow-hidden rounded-3xl text-white shadow-xl bg-gradient-to-br from-[#7a0f1a] via-[#5a0a13] to-[#12284c]">
        <div className="absolute -right-24 -top-24 w-72 h-72 rounded-full bg-white/5" aria-hidden />
        <div className="absolute -left-16 -bottom-28 w-80 h-80 rounded-full bg-[#12284c]/40" aria-hidden />
        <div className="relative p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-4">
            <RTLogo size="lg" showSlogan={false} />
            <div dir="ltr" className="text-left">
              <div className="text-[11px] tracking-[0.2em] uppercase text-rose-200/80 font-semibold">Laboratory Information System</div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">{labInfo.labNameEn || 'RT Diagnostic Laboratories'}</h2>
              <div className="text-sm text-rose-100/90 mt-0.5">{labInfo.supervisionEn || labInfo.accreditation}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => setIsPatientFormOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-[#7a0f1a] font-black text-sm shadow-lg hover:scale-[1.03] transition-transform cursor-pointer"
            >
              <PlusCircle className="w-5 h-5" />
              <span>تسجيل مريض جديد</span>
            </button>
            <button
              onClick={() => setActiveTab('diagnostic_editor')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/25 text-white font-bold text-sm transition-colors cursor-pointer"
            >
              <FileText className="w-5 h-5" />
              <span>إدخال النتائج</span>
            </button>
            <button
              onClick={() => setIsLabInfoModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/25 text-white font-bold text-sm transition-colors cursor-pointer"
              title="بيانات المعمل والفروع والتوقيعات"
            >
              <Building2 className="w-5 h-5" />
              <span>بيانات المعمل</span>
            </button>
          </div>
        </div>

        {/* Slim status strip */}
        <div className="relative border-t border-white/15 bg-black/15 px-6 sm:px-8 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="flex items-center gap-2 text-emerald-200 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            مزامنة الأجهزة نشطة
            <span className="font-mono text-[10px] text-white/70">{syncStatus.statusText}</span>
          </span>
          <span className="flex flex-wrap items-center gap-2">
            <button onClick={handleManualSyncNow} disabled={manualSyncing || syncStatus.isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 font-bold cursor-pointer disabled:opacity-60">
              <RefreshCw className={`w-3.5 h-3.5 ${(manualSyncing || syncStatus.isSyncing) ? 'animate-spin' : ''}`} />
              <span>{manualSyncing ? 'جاري المزامنة...' : 'مزامنة الآن'}</span>
            </button>
            <button onClick={handleSendTestPing} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 font-bold cursor-pointer">اختبار الاتصال</button>
            <button onClick={handleForceClearCacheAndReload} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 font-bold cursor-pointer">تحديث النسخة</button>
          </span>
        </div>
        {syncFeedback && (
          <div className="relative px-6 sm:px-8 py-2 bg-emerald-950/60 text-emerald-100 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
        )}
      </section>

      {/* 3. Time Filter & High-Impact Summary Cards */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">لوحة التحكم المركزية</h1>
          <p className="text-sm text-slate-500 mt-0.5">متابعة لحظية للإيرادات والعينات والتشخيص — تصميم موحّد وواضح للعمل اليومي</p>
        </div>

        {/* Time Filter Pills */}
        <div className="inline-flex bg-slate-200/80 p-1 rounded-xl self-start">
          <button
            onClick={() => setTimeRange('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              timeRange === 'today' ? 'bg-white text-rose-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            اليوم
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              timeRange === 'month' ? 'bg-white text-rose-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            هذا الشهر
          </button>
          <button
            onClick={() => setTimeRange('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              timeRange === 'all' ? 'bg-white text-rose-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الكل
          </button>
        </div>
      </div>

      {/* 4 Financial & Diagnostic KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Gross & Paid Income */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 border border-slate-200/90 shadow-sm shadow-slate-200/50 space-y-2 hover:border-emerald-300 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">إجمالي الإيراد الصافي</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {totalGrossIncome.toLocaleString('en-US')}
            </span>
            <span className="text-xs font-bold text-slate-500">ج.م</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            <span>نقدي: <strong className="text-slate-800 font-mono">{totalPaidCash.toLocaleString('en-US')}</strong></span>
            <span>فيزا/إلكتروني: <strong className="text-slate-800 font-mono">{(totalPaidVisa + totalPaidElectronic).toLocaleString('en-US')}</strong></span>
          </div>
        </div>

        {/* Card 2: Net Profit & Expenses */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 border border-slate-200/90 shadow-sm shadow-slate-200/50 space-y-2 hover:border-blue-300 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">صافي الأرباح (P&L)</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black font-mono ${netOperatingProfit >= 0 ? 'text-blue-900' : 'text-red-700'}`}>
              {netOperatingProfit.toLocaleString('en-US')}
            </span>
            <span className="text-xs font-bold text-slate-500">ج.م</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            <span>مصروفات: <strong className="text-red-700 font-mono">{totalExpensesAmount} ج.م</strong></span>
            <span>نسبة الربح: <strong className="text-emerald-700 font-mono">{totalGrossIncome > 0 ? Math.round((netOperatingProfit / totalGrossIncome) * 100) : 0}%</strong></span>
          </div>
        </div>

        {/* Card 3: Patients & Samples */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 border border-slate-200/90 shadow-sm shadow-slate-200/50 space-y-2 hover:border-rose-300 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">العينات المسجلة</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
              <FlaskConical className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {filteredReports.length}
            </span>
            <span className="text-xs font-bold text-slate-500">عينة ({totalTestsConducted} فحص)</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            <span>معتمدة: <strong className="text-emerald-700 font-mono">{verifiedReportsCount}</strong></span>
            <span>قيد العمل: <strong className="text-amber-700 font-mono">{pendingReportsCount}</strong></span>
          </div>
        </div>

        {/* Card 4: Loyalty Profiles */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2 hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">كروت ونقاط الولاء</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {loyaltyProfiles.length}
            </span>
            <span className="text-xs font-bold text-slate-500">عميل مسجل</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            <span>إجمالي النقاط: <strong className="text-purple-700 font-mono">{loyaltyProfiles.reduce((s, p) => s + p.totalPoints, 0)}</strong></span>
            <button
              onClick={() => setActiveTab('loyalty')}
              className="text-purple-700 font-bold hover:underline"
            >
              عرض الكروت
            </button>
          </div>
        </div>
      </div>

      {/* 4. Quick Action Workstation Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          onClick={() => setIsPatientFormOpen(true)}
          className="p-4 rounded-2xl bg-gradient-to-br from-[#7a0f1a] to-[#12284c] text-white text-right space-y-1 shadow-md hover:scale-[1.02] transition-transform cursor-pointer"
        >
          <div className="p-2 rounded-xl bg-white/10 w-fit mb-2">
            <PlusCircle className="w-5 h-5 text-rose-200" />
          </div>
          <div className="font-black text-xs">تسجيل مريض جديد</div>
          <div className="text-[11px] text-rose-200">حجز تحاليل وباركود</div>
        </button>

        <button
          onClick={() => setActiveTab('diagnostic_editor')}
          className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-900 text-right space-y-1 shadow-xs hover:border-rose-400 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="p-2 rounded-xl bg-blue-50 text-blue-700 w-fit mb-2">
            <FileText className="w-5 h-5" />
          </div>
          <div className="font-black text-xs">إدخال النتائج والتشخيص</div>
          <div className="text-[11px] text-slate-500">محرر التقارير الطبية</div>
        </button>

        <button
          onClick={() => setActiveTab('worklist')}
          className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-900 text-right space-y-1 shadow-xs hover:border-rose-400 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="p-2 rounded-xl bg-rose-50 text-rose-700 w-fit mb-2">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div className="font-black text-xs">قائمة عمل المعمل</div>
          <div className="text-[11px] text-slate-500">العينات قيد التشغيل</div>
        </button>

        <button
          onClick={() => setActiveTab('financial_income')}
          className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-900 text-right space-y-1 shadow-xs hover:border-rose-400 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 w-fit mb-2">
            <Wallet className="w-5 h-5" />
          </div>
          <div className="font-black text-xs">الخزينة والفوترة</div>
          <div className="text-[11px] text-slate-500">الفواتير وسندات القبض</div>
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-900 text-right space-y-1 shadow-xs hover:border-rose-400 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="p-2 rounded-xl bg-amber-50 text-amber-700 w-fit mb-2">
            <Tag className="w-5 h-5" />
          </div>
          <div className="font-black text-xs">دليل وباقات التحاليل</div>
          <div className="text-[11px] text-slate-500">الأسعار والباقات القابلة للتعديل</div>
        </button>

        <button
          onClick={() => setIsLabInfoModalOpen(true)}
          className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-900 text-right space-y-1 shadow-xs hover:border-rose-400 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="p-2 rounded-xl bg-purple-50 text-purple-700 w-fit mb-2">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="font-black text-xs">بيانات المعمل والفروع</div>
          <div className="text-[11px] text-slate-500">تعديل التوقيعات والهيدر</div>
        </button>
      </div>

      {/* 5. Critical Panic Values Alert Box */}
      {panicAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-red-900 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-red-600 animate-bounce" />
            <span>تنبيه فوري: نتائج حرجة (Critical / Panic Values) تتطلب إخطار الطبيب أو المريض</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {panicAlerts.map((a, idx) => (
              <div key={idx} className="bg-white p-3 rounded-xl border border-red-100 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">{a.patientName} ({a.labNumber})</span>
                  <span className="text-slate-500">{a.paramName}: <strong className="text-red-700 font-mono">{a.result} {a.unit}</strong></span>
                </div>
                <button
                  onClick={() => {
                    setSelectedReportId(a.reportId);
                    setActiveTab('diagnostic_editor');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-red-700 hover:bg-red-800 text-white font-bold text-[11px] cursor-pointer"
                >
                  فتح
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Today's Active Cases & Fast Interactive Actions Table */}
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-slate-200/90 shadow-sm shadow-slate-200/40 p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-black text-slate-900 text-base flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-rose-700" />
              <span>سجل الحالات والحجوزات وقائمة العمل</span>
              <span className="bg-rose-100 text-rose-800 text-[11px] px-2 py-0.5 rounded-full font-mono font-bold">
                {displayedPatients.length} حالة
              </span>
            </h2>
            <p className="text-xs text-slate-500">إمكانية التعديل، إدخال النتائج، طباعة الفاتورة، وحذف الحالات فورياً</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setCasesFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  casesFilter === 'all' ? 'bg-white text-rose-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                الكل ({reports.length})
              </button>
              <button
                type="button"
                onClick={() => setCasesFilter('today')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  casesFilter === 'today' ? 'bg-white text-rose-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                اليوم ({reports.filter(r => (r.createdAt || '').startsWith(todayStr)).length})
              </button>
              <button
                type="button"
                onClick={() => setCasesFilter('pending')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  casesFilter === 'pending' ? 'bg-white text-rose-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                قيد الفحص ({pendingReportsCount})
              </button>
              <button
                type="button"
                onClick={() => setCasesFilter('verified')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  casesFilter === 'verified' ? 'bg-white text-rose-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                معتمد ({verifiedReportsCount})
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث بالاسم أو رقم المعمل أو الهاتف..."
                className="w-full pr-9 pl-4 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:border-rose-700 outline-none"
              />
            </div>
          </div>
        </div>

        {displayedPatients.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs space-y-2">
            <FlaskConical className="w-8 h-8 mx-auto text-slate-300" />
            <div>لا توجد عينات مسجلة تطابق البحث</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="py-3 px-3">رقم المعمل والباركود</th>
                  <th className="py-3 px-3">اسم المريض</th>
                  <th className="py-3 px-3">السن / النوع</th>
                  <th className="py-3 px-3">التحاليل المطلوبة</th>
                  <th className="py-3 px-3">الحالة التشخيصية</th>
                  <th className="py-3 px-3 text-center">إجراءات سريعة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedPatients.map(rep => {
                  const testsCount = rep.profiles.reduce((sum, p) => sum + p.parameters.length, 0);
                  const isVerified = rep.status === 'verified' || rep.status === 'released';

                  return (
                    <tr key={rep.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-slate-900 block">{rep.reportNumber}</span>
                        <span className="text-[10px] font-mono text-slate-400">{rep.patient.barcode}</span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 block">{rep.patient.fullName}</span>
                        <span className="text-[11px] text-slate-400">{rep.patient.phone}</span>
                      </td>

                      <td className="py-3 px-3 text-slate-600">
                        {rep.patient.age} سنة · {formatGenderAr(rep.patient.gender)}
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px]">
                          {rep.profiles.map(p => p.titleAr || p.titleEn).join(' · ')}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">({testsCount} فحص)</span>
                      </td>

                      <td className="py-3 px-3">
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>معتمد للطباعة</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-700 font-bold text-[11px] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <Clock className="w-3.5 h-3.5" />
                            <span>قيد الفحص</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Direct Print / Preview Report */}
                          <button
                            onClick={() => {
                              openPrintReportWindow(rep, labInfo);
                            }}
                            title="معاينة وطباعة التقرير (A4 / PDF)"
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-800 hover:bg-rose-100 transition-colors cursor-pointer"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Enter Result */}
                          <button
                            onClick={() => {
                              setSelectedReportId(rep.id);
                              setActiveTab('diagnostic_editor');
                            }}
                            title="إدخال النتائج والتشخيص"
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* WhatsApp */}
                          <button
                            onClick={() => {
                              const msg = formatWhatsAppMessage(rep, labInfo);
                              openWhatsApp(rep.patient.phone, msg);
                            }}
                            title="إرسال تنبيه عبر الواتساب"
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteCase(rep.id, rep.invoiceId)}
                            title="حذف الحالة نهائياً"
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
