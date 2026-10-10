import React, { useState } from 'react';
import { LabReport, TestParameter } from '../types/lab';
import {
  FolderArchive,
  X,
  Search,
  Calendar,
  Clock,
  ArrowRightLeft,
  FileText,
  Printer,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Eye,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

interface PatientHistoricalPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  reports: LabReport[];
  initialPatientId?: string;
  onSelectReport?: (report: LabReport) => void;
}

export const PatientHistoricalPortalModal: React.FC<PatientHistoricalPortalModalProps> = ({
  isOpen,
  onClose,
  reports,
  initialPatientId,
  onSelectReport
}) => {
  if (!isOpen) return null;

  const [searchQuery, setSearchQuery] = useState(initialPatientId || '');
  const [selectedReportIdA, setSelectedReportIdA] = useState<string>('');
  const [selectedReportIdB, setSelectedReportIdB] = useState<string>('');
  const [viewMode, setViewMode] = useState<'timeline' | 'side_by_side'>('timeline');

  // Filter patient reports by national ID or name or phone or lab number
  const patientReports = reports.filter(r => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const p = r.patient;
    return (
      p.fullName.toLowerCase().includes(q) ||
      (p.nationalId && p.nationalId.includes(q)) ||
      p.phone.includes(q) ||
      p.labNumber.toLowerCase().includes(q)
    );
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const reportA = reports.find(r => r.id === selectedReportIdA) || patientReports[0] || null;
  const reportB = reports.find(r => r.id === selectedReportIdB) || patientReports[1] || null;

  // Extract map of parameters for comparative analysis
  const getParamsMap = (rep: LabReport | null): Map<string, TestParameter> => {
    const map = new Map<string, TestParameter>();
    if (!rep) return map;
    rep.profiles.forEach(prof => {
      (prof.parameters || []).forEach(p => {
        map.set((p.name || '').toLowerCase().trim(), p);
      });
    });
    return map;
  };

  const mapA = getParamsMap(reportA);
  const mapB = getParamsMap(reportB);

  // Combine parameter keys from both reports
  const allParamKeys = Array.from(new Set([...mapA.keys(), ...mapB.keys()]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-white border border-slate-200 w-full max-w-5xl rounded-3xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden text-slate-900"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white flex items-center justify-between border-b border-rose-900/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-600/30 border border-rose-500/40 flex items-center justify-center text-rose-300">
              <FolderArchive className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wide">
                  البوابة الإلكترونية الآمنة للسجلات الطبية التاريخية للمرضى
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white font-mono">
                  Longitudinal Health Records
                </span>
              </div>
              <p className="text-xs text-rose-200 mt-0.5">
                تصفح ومقارنة التحاليل المخبرية للمريض عبر كافة الزيارات السابقة بدقة عالية ورصد معدلات التغير (Delta Check)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Switcher Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="بحث بالرقم القومي، الهاتف، اسم المريض، أو رقم المعمل..."
              className="w-full bg-white border border-slate-300 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-900"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3.5 py-2 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'timeline'
                  ? 'bg-rose-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>الخط الزمني للزيارات ({patientReports.length})</span>
            </button>

            <button
              onClick={() => setViewMode('side_by_side')}
              className={`px-3.5 py-2 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'side_by_side'
                  ? 'bg-rose-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>مقارنة تحليلين جنباً إلى جنب</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs">
          {viewMode === 'timeline' && (
            <div className="space-y-4">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-rose-800" />
                <span>سجل الزيارات والتقارير المعملية السابقة</span>
              </h3>

              <div className="space-y-3">
                {patientReports.map((rep, idx) => (
                  <div
                    key={rep.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-rose-700 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center font-bold text-slate-800 shrink-0">
                        <span className="text-[10px] text-slate-500 font-mono">
                          {rep.createdAt.split('T')[0].split('-')[1]}
                        </span>
                        <span className="text-xs font-mono font-black">
                          {rep.createdAt.split('T')[0].split('-')[2]}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-black text-slate-900 text-sm">{rep.patient.fullName}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            #{rep.patient.labNumber}
                          </span>
                        </div>
                        <div className="text-slate-500 font-mono text-[11px]">
                          التاريخ: {rep.createdAt.split('T')[0]} • عدد التحاليل: {rep.profiles.length} بروفايل
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {rep.profiles.map((pr, pI) => (
                            <span key={pI} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px]">
                              {pr.titleAr}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          if (onSelectReport) onSelectReport(rep);
                          onClose();
                        }}
                        className="px-3.5 py-2 rounded-xl bg-rose-900 hover:bg-rose-800 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>فتح التقرير للطباعة</span>
                      </button>
                    </div>
                  </div>
                ))}

                {patientReports.length === 0 && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
                    <FolderArchive className="w-10 h-10 mx-auto text-slate-400 mb-2 opacity-50" />
                    <p className="font-bold text-sm">لم يتم العثور على سجلات تاريخية مطابقة</p>
                    <p className="text-xs text-slate-400 mt-1">تأكد من كتابة الرقم القومي أو الهاتف بشكل صحيح.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {viewMode === 'side_by_side' && (
            <div className="space-y-4">
              {/* Selectors for Report A and B */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-1">
                  <label className="font-bold text-slate-700 block">اختر الزيارة الأولى (المرجعية أو الأقدم):</label>
                  <select
                    value={reportB?.id || ''}
                    onChange={e => setSelectedReportIdB(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  >
                    {patientReports.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.createdAt.split('T')[0]} - #{r.reportNumber} ({r.profiles.map(p => p.profileCode).join(', ')})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-1">
                  <label className="font-bold text-slate-700 block">اختر الزيارة الثانية (الأحدث أو الحالية):</label>
                  <select
                    value={reportA?.id || ''}
                    onChange={e => setSelectedReportIdA(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  >
                    {patientReports.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.createdAt.split('T')[0]} - #{r.reportNumber} ({r.profiles.map(p => p.profileCode).join(', ')})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Side-by-side Comparative Table */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[11px] font-mono">
                      <th className="p-3">اسم التحليل (Biomarker)</th>
                      <th className="p-3 text-center">الزيارة السابقة ({reportB?.createdAt.split('T')[0] || '--'})</th>
                      <th className="p-3 text-center">الزيارة الحالية ({reportA?.createdAt.split('T')[0] || '--'})</th>
                      <th className="p-3 text-center">معدل التغير (Delta Shift)</th>
                      <th className="p-3">الحالة السريرية</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {allParamKeys.map(key => {
                      const paramOld = mapB.get(key);
                      const paramNew = mapA.get(key);

                      const valOldNum = paramOld ? parseFloat(String(paramOld.result).replace(/[^0-9.-]/g, '')) : null;
                      const valNewNum = paramNew ? parseFloat(String(paramNew.result).replace(/[^0-9.-]/g, '')) : null;

                      let deltaText = '--';
                      let deltaColor = 'text-slate-500';

                      if (valOldNum !== null && valNewNum !== null && !isNaN(valOldNum) && !isNaN(valNewNum)) {
                        const diff = valNewNum - valOldNum;
                        const pct = ((diff / (valOldNum || 1)) * 100).toFixed(1);
                        deltaText = `${diff > 0 ? '+' : ''}${diff.toFixed(2)} (${pct}%)`;
                        if (Math.abs(Number(pct)) > 20) {
                          deltaColor = 'text-rose-700 font-bold';
                        } else {
                          deltaColor = 'text-emerald-700 font-semibold';
                        }
                      }

                      return (
                        <tr key={key} className="hover:bg-slate-50 transition">
                          <td className="p-3 font-bold text-slate-800">
                            {paramNew?.name || paramOld?.name || key}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-slate-700">
                            {paramOld ? `${paramOld.result} ${paramOld.unit || ''}` : '--'}
                          </td>
                          <td className="p-3 text-center font-mono font-black text-rose-950">
                            {paramNew ? `${paramNew.result} ${paramNew.unit || ''}` : '--'}
                          </td>
                          <td className={`p-3 text-center font-mono text-[11px] ${deltaColor}`}>
                            {deltaText}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              paramNew?.flag === 'HIGH' || paramNew?.flag === 'LOW'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {paramNew?.flag || 'طبيعي'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            السجلات الطبية التاريخية محمية بموجب اللائحة التنفيذية لحماية البيانات الصحية.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
