import React, { useState } from 'react';
import {
  Activity,
  AlertOctagon,
  Clock,
  CheckCircle2,
  FileText,
  Search,
  Filter,
  TrendingUp,
  ShieldCheck,
  Plus,
  Sliders,
  ChevronRight,
  Printer,
  FileCode,
  Eye,
  AlertTriangle,
  QrCode,
  FlaskConical
} from 'lucide-react';
import { LabReport, Patient } from '../types/laboratory';

interface DashboardProps {
  reports: LabReport[];
  patients: Patient[];
  onSelectReport: (report: LabReport) => void;
  onNewReport: (panelCode?: string) => void;
  onOpenHistoryTrend: (patientMrn: string, testCode?: string) => void;
  onViewAllReports: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  reports,
  patients,
  onSelectReport,
  onNewReport,
  onOpenHistoryTrend,
  onViewAllReports,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'CRITICAL' | 'CBC' | 'PENDING'>('ALL');

  // Widget custom visibility state
  const [visibleWidgets, setVisibleWidgets] = useState({
    totalSamples: true,
    criticalAlerts: true,
    pendingApproval: true,
    averageTat: true,
  });
  const [showWidgetSettings, setShowWidgetSettings] = useState(false);

  // Computed metrics
  const totalReportsCount = reports.length;
  const criticalCount = reports.filter((r) => r.criticalAlertActive).length;
  const pendingCount = reports.filter((r) => r.status !== 'APPROVED').length;
  const approvedCount = reports.filter((r) => r.status === 'APPROVED').length;

  // Filtered reports
  const filteredReports = reports.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      r.reportNumber.toLowerCase().includes(q) ||
      r.patient.fullName.toLowerCase().includes(q) ||
      r.patient.fullNameEn.toLowerCase().includes(q) ||
      r.patient.mrn.toLowerCase().includes(q) ||
      r.patient.sampleId.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (selectedFilter === 'CRITICAL') return r.criticalAlertActive;
    if (selectedFilter === 'CBC') return r.panelCode === 'CBC';
    if (selectedFilter === 'PENDING') return r.status !== 'APPROVED';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Welcome & Fast Action Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Subtle geometric pattern overlay */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-teal-700/60 text-teal-200 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                منظومة المعامل الموحدة RT-Lab 2026
              </span>
              <span className="text-xs text-teal-300">· معتمدة وفق ISO 15189</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
              نظام إدارة وتقارير التحاليل الطبية الشامل
            </h1>
            <p className="text-teal-100 text-xs sm:text-sm leading-relaxed">
              إعادة هيكلة كاملة للتقارير الطبية، فحص صورة الدم CBC مع 20 عنصراً أساسياً وفحص الفيلم المورفولوجي،
              تتبع التغير الزمني المقارن (Delta Track)، وتصدير فوري بصيغ PDF و HL7 FHIR الطبية.
            </p>
          </div>

          {/* Quick Start Buttons */}
          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={() => onNewReport('CBC')}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-teal-900 hover:bg-teal-50 rounded-2xl font-bold text-xs shadow-md transition-all whitespace-nowrap"
            >
              <FlaskConical className="w-4 h-4 text-teal-700" />
              <span>فحص CBC 20 عنصر + فيلم دم</span>
            </button>

            <button
              onClick={() => onNewReport('BIOCHEMISTRY')}
              className="flex items-center gap-2 px-4 py-2.5 bg-teal-700/70 hover:bg-teal-700 text-white rounded-2xl font-semibold text-xs border border-teal-500/40 transition-all whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>فحص كيمياء دم / وظائف</span>
            </button>
          </div>
        </div>
      </div>

      {/* Customizable Dashboard Widgets */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-600" />
            <span>مؤشرات أداء المعمل اللحظية (Laboratory Dashboard Widgets)</span>
          </h2>
          <button
            onClick={() => setShowWidgetSettings(!showWidgetSettings)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>تخصيص الودجات</span>
          </button>
        </div>

        {/* Customization Drawer */}
        {showWidgetSettings && (
          <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-2xl text-xs flex flex-wrap gap-4 border border-slate-200 dark:border-slate-700">
            <span className="font-semibold text-slate-700 dark:text-slate-300">إظهار / إخفاء الودجات:</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={visibleWidgets.totalSamples}
                onChange={(e) => setVisibleWidgets({ ...visibleWidgets, totalSamples: e.target.checked })}
                className="rounded text-teal-600"
              />
              <span>إجمالي العينات والتقارير</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={visibleWidgets.criticalAlerts}
                onChange={(e) => setVisibleWidgets({ ...visibleWidgets, criticalAlerts: e.target.checked })}
                className="rounded text-rose-600"
              />
              <span>تنبيهات القيم الحرجة (Panic Values)</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={visibleWidgets.pendingApproval}
                onChange={(e) => setVisibleWidgets({ ...visibleWidgets, pendingApproval: e.target.checked })}
                className="rounded text-amber-600"
              />
              <span>بانتظار المراجعة والاعتماد</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={visibleWidgets.averageTat}
                onChange={(e) => setVisibleWidgets({ ...visibleWidgets, averageTat: e.target.checked })}
                className="rounded text-indigo-600"
              />
              <span>متوسط زمن إنجاز النتائج (TAT)</span>
            </label>
          </div>
        )}

        {/* Widgets Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Widget 1: Total Reports */}
          {visibleWidgets.totalSamples && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">إجمالي الفحوصات والتقارير</span>
                <FlaskConical className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white">
                {totalReportsCount}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                <span>معتمد: <strong className="text-emerald-600">{approvedCount}</strong></span>
                <span>قيد المعالجة: <strong className="text-amber-600">{pendingCount}</strong></span>
              </div>
            </div>
          )}

          {/* Widget 2: Critical Alerts */}
          {visibleWidgets.criticalAlerts && (
            <div className={`rounded-2xl p-4 shadow-xs border transition-colors ${
              criticalCount > 0
                ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}>
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">القيم الحرجة (Panic Alerts)</span>
                <AlertOctagon className={`w-4 h-4 ${criticalCount > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`} />
              </div>
              <div className="text-2xl font-mono font-black text-rose-600 dark:text-rose-400">
                {criticalCount}
              </div>
              <div className="text-[11px] text-rose-600 dark:text-rose-300 mt-1 font-medium">
                {criticalCount > 0 ? 'يتطلب إبلاغ فوري وتوثيق بالتقرير' : 'لا توجد قيم حرجة غير مبلّغة'}
              </div>
            </div>
          )}

          {/* Widget 3: Pending Approval */}
          {visibleWidgets.pendingApproval && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">بانتظار اعتماد الاستشاري</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white">
                {pendingCount}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                تتطلب مراجعة الطبيب وتطبيق التوقيع
              </div>
            </div>
          )}

          {/* Widget 4: Turnaround Time (TAT) */}
          {visibleWidgets.averageTat && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">متوسط زمن الإنجاز (TAT)</span>
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-2xl font-mono font-bold text-teal-600 dark:text-teal-400">
                38 دقيقة
              </div>
              <div className="text-[11px] text-emerald-600 font-medium mt-1">
                أسرع بنسبة 25% من المعيار الدولي
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rapid Search & Accession Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="البحث برقم الباركود (Sample ID)، اسم المريض، أو الرقم الطبي (MRN)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setSelectedFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                selectedFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              كافة الفحوصات ({reports.length})
            </button>
            <button
              onClick={() => setSelectedFilter('CBC')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                selectedFilter === 'CBC'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              CBC صورة الدم
            </button>
            <button
              onClick={() => setSelectedFilter('CRITICAL')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                selectedFilter === 'CRITICAL'
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              القيم الحرجة ({criticalCount})
            </button>
            <button
              onClick={() => setSelectedFilter('PENDING')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                selectedFilter === 'PENDING'
                  ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              قيد المراجعة ({pendingCount})
            </button>
          </div>
        </div>
      </div>

      {/* Reports Table List (Structured Clinical List) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="font-bold text-xs text-slate-900 dark:text-white">
            قائمة تقارير ونتائج التحاليل الطبية ({filteredReports.length})
          </span>
          <button
            onClick={onViewAllReports}
            className="text-xs text-teal-600 dark:text-teal-400 font-semibold hover:underline flex items-center gap-1"
          >
            <span>عرض السجل المكتمل</span>
            <ChevronRight className="w-3.5 h-3.5 rtl:rotate-0 ltr:rotate-180" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">رقم التقرير والباركود</th>
                <th className="py-3 px-4">اسم المريض والبيانات</th>
                <th className="py-3 px-4">نوع الفحص</th>
                <th className="py-3 px-4">تاريخ ووقت الفحص</th>
                <th className="py-3 px-4 text-center">الحالة الإكلينيكية</th>
                <th className="py-3 px-4 text-center">حالة الاعتماد</th>
                <th className="py-3 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredReports.map((report) => (
                <tr
                  key={report.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  {/* Report # & Barcode */}
                  <td className="py-3 px-4 font-mono">
                    <span className="font-bold text-teal-700 dark:text-teal-400 block text-xs">
                      {report.reportNumber}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ID: {report.patient.sampleId}
                    </span>
                  </td>

                  {/* Patient Info */}
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 dark:text-white block text-xs">
                      {report.patient.fullName}
                    </span>
                    <div className="text-[10px] text-slate-500 flex items-center gap-2">
                      <span className="font-mono">{report.patient.mrn}</span>
                      <span>·</span>
                      <span>{report.patient.age} سنة ({report.patient.gender === 'MALE' ? 'ذكر' : 'أنثى'})</span>
                    </div>
                  </td>

                  {/* Panel */}
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block text-xs">
                      {report.panelNameAr}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {report.panelCode} · {report.results.length} فحص
                    </span>
                  </td>

                  {/* Date */}
                  <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400 text-[11px]">
                    {report.date}
                  </td>

                  {/* Clinical Alert State */}
                  <td className="py-3 px-4 text-center">
                    {report.criticalAlertActive ? (
                      <span className="inline-block px-2 py-0.5 text-[10px] font-bold text-rose-700 bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 rounded-md animate-pulse">
                        قيمة حرجة (Panic)
                      </span>
                    ) : report.results.some((r) => r.flag !== 'NORMAL') ? (
                      <span className="inline-block px-2 py-0.5 text-[10px] font-semibold text-amber-700 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 rounded-md">
                        نتائج غير طبيعية
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-md">
                        طبيعي ضمن الحدود
                      </span>
                    )}
                  </td>

                  {/* Approval Status */}
                  <td className="py-3 px-4 text-center">
                    {report.status === 'APPROVED' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>معتمد ومختوم</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>قيد المراجعة</span>
                      </span>
                    )}
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* View Report */}
                      <button
                        onClick={() => onSelectReport(report)}
                        className="px-2.5 py-1 text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 rounded-lg transition-colors"
                        title="عرض التقرير الطبي والطباعة"
                      >
                        عرض التقرير
                      </button>

                      {/* Delta Historical Trend */}
                      <button
                        onClick={() => onOpenHistoryTrend(report.patient.mrn, report.results[0]?.testCode)}
                        className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="مخطط التتبع الزمني لنتائج المريض"
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
