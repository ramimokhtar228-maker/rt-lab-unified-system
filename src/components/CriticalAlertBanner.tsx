import React, { useState } from 'react';
import { AlertOctagon, PhoneCall, Volume2, CheckCircle, X } from 'lucide-react';
import { LabReport } from '../types/laboratory';
import { playCriticalChime } from '../utils/criticalAlerts';

interface CriticalAlertBannerProps {
  unnotifiedReports: LabReport[];
  onLogCall: (reportId: string, logData: {
    notifiedTo: string;
    department: string;
    readBackConfirmed: boolean;
    notes?: string;
  }) => void;
  onViewReport: (report: LabReport) => void;
  currentUserName: string;
}

export const CriticalAlertBanner: React.FC<CriticalAlertBannerProps> = ({
  unnotifiedReports,
  onLogCall,
  onViewReport,
  currentUserName,
}) => {
  const [selectedReportForCall, setSelectedReportForCall] = useState<LabReport | null>(null);
  const [doctorName, setDoctorName] = useState<string>('');
  const [department, setDepartment] = useState<string>('قسم الباطنة / الطوارئ');
  const [readBackConfirmed, setReadBackConfirmed] = useState<boolean>(true);
  const [callNotes, setCallNotes] = useState<string>('تم إبلاغ الطبيب بالنتيجة الحرجة هاتفياً وقام بإعادة قراءة القيمة للتأكيد.');

  if (unnotifiedReports.length === 0) return null;

  const currentAlert = unnotifiedReports[0];

  const criticalResults = currentAlert.results.filter(
    (r) => r.flag === 'CRITICAL_LOW' || r.flag === 'CRITICAL_HIGH'
  );

  const handleOpenCallModal = (rep: LabReport) => {
    setSelectedReportForCall(rep);
    setDoctorName(rep.patient.doctorName);
  };

  const handleConfirmCallLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReportForCall) return;

    onLogCall(selectedReportForCall.id, {
      notifiedTo: doctorName || 'الطبيب المعالج',
      department: department || 'القسم المعالج',
      readBackConfirmed,
      notes: callNotes,
    });

    setSelectedReportForCall(null);
  };

  return (
    <>
      {/* High-visibility Critical Panic Value Notification Bar */}
      <div className="no-print bg-rose-600 text-white px-4 py-3 shadow-md animate-in slide-in-from-top-2 duration-200">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <AlertOctagon className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div className="text-xs">
              <div className="font-bold text-sm flex items-center gap-2">
                <span>تنبيه طبي عاجل: توجد ({unnotifiedReports.length}) نتيجة حرجة تستوجب الإبلاغ الفوري!</span>
                <button
                  onClick={() => playCriticalChime()}
                  className="p-1 hover:bg-white/20 rounded-md transition-colors"
                  title="تشغيل نغمة الإنذار الطبي"
                >
                  <Volume2 className="w-4 h-4 text-rose-200" />
                </button>
              </div>
              <p className="text-rose-100 font-medium">
                المريض: <strong className="text-white">{currentAlert.patient.fullName}</strong> ({currentAlert.patient.mrn}) — الفحوصات الحرجة:{' '}
                {criticalResults.map((c) => `${c.testNameEn}: ${c.value} ${c.unit}`).join(' · ')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onViewReport(currentAlert)}
              className="px-3 py-1.5 text-xs font-semibold bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
            >
              عرض التقرير
            </button>
            <button
              onClick={() => handleOpenCallModal(currentAlert)}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-white text-rose-700 hover:bg-rose-50 rounded-xl shadow-xs transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>توثيق الاتصال بالطبيب المعالج</span>
            </button>
          </div>
        </div>
      </div>

      {/* Immediate Phone Notification Log Modal */}
      {selectedReportForCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-rose-50 dark:bg-rose-950/40">
              <div className="flex items-center gap-2.5 text-rose-900 dark:text-rose-200">
                <PhoneCall className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-sm">
                  توثيق الإبلاغ الفوري عن القيمة الحرجة (Critical Value Notification)
                </h3>
              </div>
              <button
                onClick={() => setSelectedReportForCall(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmCallLog} className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 block">المريض:</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {selectedReportForCall.patient.fullName} ({selectedReportForCall.patient.mrn})
                </span>
                <div className="mt-1 text-rose-600 font-mono font-bold">
                  {selectedReportForCall.results
                    .filter((r) => r.flag === 'CRITICAL_LOW' || r.flag === 'CRITICAL_HIGH')
                    .map((r) => `${r.testNameEn}: ${r.value} ${r.unit}`)
                    .join(' | ')}
                </div>
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                  اسم الطبيب أو المستلم المبلّغ إليه:
                </label>
                <input
                  type="text"
                  required
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 font-bold"
                />
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                  القسم أو العيادة:
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-emerald-900 dark:text-emerald-300">
                  <input
                    type="checkbox"
                    checked={readBackConfirmed}
                    onChange={(e) => setReadBackConfirmed(e.target.checked)}
                    className="rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>تم التأكيد بقراءة القيمة عكسياً (Read-Back Confirmed)</span>
                </label>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">
                  شرط إلزامي لمعايير الجودة الدولية ISO 15189 / CAP للتأكد من وصول الرقم الصحيح بدون لبس.
                </p>
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                  ملاحظات المكالمة:
                </label>
                <textarea
                  rows={2}
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedReportForCall(null)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>تأكيد وتسجيل التبليغ رسمياً بالتقرير</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
