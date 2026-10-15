import React, { useState } from 'react';
import { User, Search, Plus, Calendar, FileText, TrendingUp, ChevronLeft, Phone, Mail, Building } from 'lucide-react';
import { Patient, LabReport } from '../types/laboratory';

interface PatientDirectoryProps {
  patients: Patient[];
  reports: LabReport[];
  onSelectReport: (report: LabReport) => void;
  onOpenHistoryTrend: (patientMrn: string, testCode?: string) => void;
  onNewReportForPatient: (patient: Patient) => void;
}

export const PatientDirectory: React.FC<PatientDirectoryProps> = ({
  patients,
  reports,
  onSelectReport,
  onOpenHistoryTrend,
  onNewReportForPatient,
}) => {
  const [search, setSearch] = useState('');
  const [selectedPatientMrn, setSelectedPatientMrn] = useState<string | null>(
    patients[0]?.mrn || null
  );

  const filteredPatients = patients.filter((p) => {
    const q = search.toLowerCase().trim();
    return (
      !q ||
      p.fullName.toLowerCase().includes(q) ||
      p.fullNameEn.toLowerCase().includes(q) ||
      p.mrn.toLowerCase().includes(q) ||
      p.nationalId.includes(q) ||
      p.phone.includes(q)
    );
  });

  const activePatient = patients.find((p) => p.mrn === selectedPatientMrn) || filteredPatients[0];
  const patientReports = reports.filter((r) => r.patient.mrn === activePatient?.mrn);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5 text-teal-600" />
            <span>سجل المرضى الموحد والملفات الطبية (Electronic Medical Records)</span>
          </h1>
          <p className="text-xs text-slate-500">
            متابعة التاريخ المرضي، الزيارات السابقة، وتتبع مؤشرات الفحوصات عبر الزمن
          </p>
        </div>
      </div>

      {/* Main Split Layout: Patient List on Right, Detail & History on Left */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Right Column: Patients List */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-xs space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="البحث بالاسم، الرقم الطبي MRN، الهاتف..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-9 pl-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredPatients.map((p) => {
              const isSelected = p.mrn === activePatient?.mrn;
              const repCount = reports.filter((r) => r.patient.mrn === p.mrn).length;

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPatientMrn(p.mrn)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 shadow-xs'
                      : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-xs text-slate-900 dark:text-white">
                        {p.fullName}
                      </h3>
                      <p className="text-[11px] text-slate-500">{p.fullNameEn}</p>
                    </div>
                    <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md font-bold">
                      {p.mrn}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{p.age} سنة · {p.gender === 'MALE' ? 'ذكر' : 'أنثى'}</span>
                    <span className="text-teal-700 dark:text-teal-400 font-semibold font-mono">
                      {repCount} تقارير سابقة
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Left Column: Patient Profile & Visits History */}
        {activePatient ? (
          <div className="lg:col-span-2 space-y-6">
            {/* Patient Header Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5 mb-5">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {activePatient.fullName}
                    </h2>
                    <span className="bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg">
                      MRN: {activePatient.mrn}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{activePatient.fullNameEn}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenHistoryTrend(activePatient.mrn)}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800/40 rounded-xl transition-colors"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>مخطط التتبع الزمني (Delta)</span>
                  </button>

                  <button
                    onClick={() => onNewReportForPatient(activePatient)}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>طلب فحص جديد للمريض</span>
                  </button>
                </div>
              </div>

              {/* Patient Demographics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">الرقم القومي / الهوية:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {activePatient.nationalId}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">السن والجنس:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {activePatient.age} سنة ({activePatient.gender === 'MALE' ? 'ذكر' : 'أنثى'})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">الهاتف:</span>
                  <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                    {activePatient.phone}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">الطبيب المعالج:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {activePatient.doctorName}
                  </span>
                </div>
              </div>
            </div>

            {/* Reports & Visits History Timeline */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4 flex items-center justify-between">
                <span>سجل الزيارات والتقارير الطبية السابقة ({patientReports.length})</span>
                <span className="text-xs text-slate-400 font-normal">مرتبة من الأحدث إلى الأقدم</span>
              </h3>

              {patientReports.length > 0 ? (
                <div className="space-y-3">
                  {patientReports.map((report) => (
                    <div
                      key={report.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-teal-500/50 bg-slate-50/50 dark:bg-slate-800/20 transition-all flex flex-wrap items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {report.panelNameAr}
                          </span>
                          <span className="font-mono text-[11px] text-teal-700 dark:text-teal-400 font-semibold">
                            ({report.reportNumber})
                          </span>
                          {report.status === 'APPROVED' ? (
                            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
                              معتمد
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-600 font-medium bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded">
                              قيد المراجعة
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-1">
                          تاريخ الفحص: {report.date} · العينة: {report.patient.sampleId} · بواسطة: {report.analyzedBy}
                        </div>
                        {report.bloodFilm?.pathologistImpression && (
                          <p className="text-[11px] text-teal-900 dark:text-teal-300 mt-1 line-clamp-1">
                            رأي الباثولوجي: {report.bloodFilm.pathologistImpression}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onOpenHistoryTrend(activePatient.mrn, report.results[0]?.testCode)}
                          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                          title="تتبع التغير الزمني"
                        >
                          <TrendingUp className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onSelectReport(report)}
                          className="px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-teal-600 hover:bg-slate-800 rounded-xl transition-colors"
                        >
                          عرض وطباعة التقرير
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-slate-400">
                  لا توجد تقارير مسجلة لهذا المريض بعد
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 text-center py-12 text-sm text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            اختر مريضاً من القائمة لعرض سجله الطبي
          </div>
        )}
      </div>
    </div>
  );
};
