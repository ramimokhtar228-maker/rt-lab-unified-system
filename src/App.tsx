import React, { useState, useEffect } from 'react';
import {
  INITIAL_PATIENTS,
  INITIAL_REPORTS,
  INITIAL_SETTINGS
} from './data/initialData';
import { LabReport, LabSettings, Patient, UserRole } from './types/laboratory';
import { TopNav } from './components/TopNav';
import { Dashboard } from './components/Dashboard';
import { ReportViewer } from './components/ReportViewer';
import { ResultEntryModal } from './components/ResultEntryModal';
import { HistoricalTrendModal } from './components/HistoricalTrendModal';
import { CriticalAlertBanner } from './components/CriticalAlertBanner';
import { CloudSyncModal } from './components/CloudSyncModal';
import { PatientDirectory } from './components/PatientDirectory';
import { LabSettingsView } from './components/LabSettingsView';

export default function App() {
  // Navigation view state
  const [currentView, setCurrentView] = useState<'DASHBOARD' | 'REPORTS' | 'PATIENTS' | 'ALERTS' | 'SETTINGS'>('DASHBOARD');

  // Dark mode state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('rtlab_theme') === 'dark' ||
        (!localStorage.getItem('rtlab_theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
      );
    }
    return false;
  });

  // Role state (RBAC)
  const [userRole, setUserRole] = useState<UserRole>('PATHOLOGIST');

  // Reactive Clinical Data loaded from localStorage or seeded
  const [reports, setReports] = useState<LabReport[]>(() => {
    try {
      const stored = localStorage.getItem('rtlab_reports_v2');
      if (stored) return JSON.parse(stored);
    } catch {
      // Fallback
    }
    return INITIAL_REPORTS;
  });

  const [patients, setPatients] = useState<Patient[]>(() => {
    try {
      const stored = localStorage.getItem('rtlab_patients_v2');
      if (stored) return JSON.parse(stored);
    } catch {
      // Fallback
    }
    return INITIAL_PATIENTS;
  });

  const [settings, setSettings] = useState<LabSettings>(() => {
    try {
      const stored = localStorage.getItem('rtlab_settings_v2');
      if (stored) return JSON.parse(stored);
    } catch {
      // Fallback
    }
    return INITIAL_SETTINGS;
  });

  // Selected report for viewing
  const [selectedReportId, setSelectedReportId] = useState<string | null>(reports[0]?.id || null);

  // Modals state
  const [isEntryModalOpen, setIsEntryModalOpen] = useState<boolean>(false);
  const [reportToEdit, setReportToEdit] = useState<LabReport | null>(null);
  const [entryDefaultPanel, setEntryDefaultPanel] = useState<string>('CBC');

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [historyTargetMrn, setHistoryTargetMrn] = useState<string>('');
  const [historyTargetTest, setHistoryTargetTest] = useState<string | undefined>(undefined);

  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [cloudSyncing, setCloudSyncing] = useState<boolean>(false);

  // Sync dark mode class on HTML element
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('rtlab_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('rtlab_theme', 'light');
    }
  }, [darkMode]);

  // Persist reports & patients to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('rtlab_reports_v2', JSON.stringify(reports));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }, [reports]);

  useEffect(() => {
    try {
      localStorage.setItem('rtlab_patients_v2', JSON.stringify(patients));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }, [patients]);

  useEffect(() => {
    try {
      localStorage.setItem('rtlab_settings_v2', JSON.stringify(settings));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }, [settings]);

  // Heartbeat simulated cloud sync
  useEffect(() => {
    const interval = setInterval(() => {
      setCloudSyncing(true);
      setTimeout(() => setCloudSyncing(false), 800);
    }, 45000);
    return () => clearInterval(interval);
  }, []);

  // Filter unnotified critical reports
  const unnotifiedCriticalReports = reports.filter(
    (r) => r.criticalAlertActive && !r.criticalCallLog
  );

  const activeReport = reports.find((r) => r.id === selectedReportId) || reports[0];

  // Actions
  const handleOpenNewReport = (panelCode: string = 'CBC') => {
    setReportToEdit(null);
    setEntryDefaultPanel(panelCode);
    setIsEntryModalOpen(true);
  };

  const handleEditReport = (rep: LabReport) => {
    setReportToEdit(rep);
    setEntryDefaultPanel(rep.panelCode);
    setIsEntryModalOpen(true);
  };

  const handleSaveReport = (newOrUpdatedReport: LabReport) => {
    setReports((prev) => {
      const idx = prev.findIndex((r) => r.id === newOrUpdatedReport.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newOrUpdatedReport;
        return copy;
      }
      return [newOrUpdatedReport, ...prev];
    });

    // Also update patient list if not present
    setPatients((prev) => {
      const exists = prev.some((p) => p.mrn === newOrUpdatedReport.patient.mrn);
      if (!exists) {
        return [newOrUpdatedReport.patient, ...prev];
      }
      return prev;
    });

    setSelectedReportId(newOrUpdatedReport.id);
    setCurrentView('REPORTS');
  };

  const handleApproveReport = (reportId: string) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status: 'APPROVED',
              verifiedBy: settings.directorName || 'د. رامي مختار',
              verifiedTitle: settings.directorTitle,
              updatedAt: new Date().toISOString(),
            }
          : r
      )
    );
  };

  const handleLogCriticalCall = (
    reportId: string,
    logData: { notifiedTo: string; department: string; readBackConfirmed: boolean; notes?: string }
  ) => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? {
              ...r,
              criticalCallLog: {
                notifiedAt: nowStr,
                notifiedTo: logData.notifiedTo,
                notifiedBy: userRole === 'PATHOLOGIST' ? 'د. استشاري المعمل' : 'أخصائي التحاليل',
                departmentOrClinic: logData.department,
                readBackConfirmed: logData.readBackConfirmed,
                notes: logData.notes,
              },
            }
          : r
      )
    );
  };

  const handleOpenHistoryTrend = (patientMrn: string, testCode?: string) => {
    setHistoryTargetMrn(patientMrn);
    setHistoryTargetTest(testCode);
    setIsHistoryModalOpen(true);
  };

  const historyPatientName =
    patients.find((p) => p.mrn === historyTargetMrn)?.fullName || 'المريض';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Navigation */}
      <TopNav
        currentView={currentView}
        onNavigate={setCurrentView}
        userRole={userRole}
        onChangeRole={setUserRole}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onNewReport={() => handleOpenNewReport('CBC')}
        criticalAlertsCount={unnotifiedCriticalReports.length}
        cloudSyncing={cloudSyncing}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
      />

      {/* Critical Panic Value Alert Banner (Technician Real-Time Notifications) */}
      <CriticalAlertBanner
        unnotifiedReports={unnotifiedCriticalReports}
        onLogCall={handleLogCriticalCall}
        onViewReport={(rep) => {
          setSelectedReportId(rep.id);
          setCurrentView('REPORTS');
        }}
        currentUserName={
          userRole === 'PATHOLOGIST' ? 'د. رامي مختار (Consultant)' : 'أخصائي التحاليل الطبية'
        }
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* VIEW 1: DASHBOARD */}
        {currentView === 'DASHBOARD' && (
          <Dashboard
            reports={reports}
            patients={patients}
            onSelectReport={(rep) => {
              setSelectedReportId(rep.id);
              setCurrentView('REPORTS');
            }}
            onNewReport={handleOpenNewReport}
            onOpenHistoryTrend={handleOpenHistoryTrend}
            onViewAllReports={() => setCurrentView('REPORTS')}
          />
        )}

        {/* VIEW 2: REPORTS & VIEWER (The primary requested clinical report) */}
        {currentView === 'REPORTS' && (
          <div className="space-y-6">
            {/* Quick selector of active report if multiple */}
            <div className="no-print bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">التقرير المعروض حالياً:</span>
                <select
                  value={selectedReportId || ''}
                  onChange={(e) => setSelectedReportId(e.target.value)}
                  className="bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-3 py-1.5 font-bold text-teal-800 dark:text-teal-300"
                >
                  {reports.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.reportNumber} — {r.patient.fullName} ({r.panelNameAr})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenNewReport('CBC')}
                  className="px-3 py-1.5 text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 rounded-xl"
                >
                  + إدراج فحص جديد
                </button>
              </div>
            </div>

            {activeReport ? (
              <ReportViewer
                report={activeReport}
                settings={settings}
                onEditReport={handleEditReport}
                onOpenHistoryTrend={handleOpenHistoryTrend}
                onApproveReport={handleApproveReport}
                onBackToList={() => setCurrentView('DASHBOARD')}
                userRole={userRole}
              />
            ) : (
              <div className="text-center py-16 text-slate-400 text-sm">
                لا توجد تقارير حالياً. اضغط على "+ فحص معملي جديد" للبدء.
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: PATIENT DIRECTORY & EMR */}
        {currentView === 'PATIENTS' && (
          <PatientDirectory
            patients={patients}
            reports={reports}
            onSelectReport={(rep) => {
              setSelectedReportId(rep.id);
              setCurrentView('REPORTS');
            }}
            onOpenHistoryTrend={handleOpenHistoryTrend}
            onNewReportForPatient={(p) => {
              setReportToEdit(null);
              setEntryDefaultPanel('CBC');
              setIsEntryModalOpen(true);
            }}
          />
        )}

        {/* VIEW 4: CRITICAL ALERTS LOG */}
        {currentView === 'ALERTS' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                سجل إبلاغ وتوثيق القيم الحرجة (Critical / Panic Values Audit Log)
              </h1>
              <p className="text-xs text-slate-500">
                توثيق معتمد وفق معايير الجودة الدولية ISO 15189 للمكالمات الهاتفية الطارئة
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase text-[11px]">
                    <th className="py-3 px-4">رقم التقرير والمريض</th>
                    <th className="py-3 px-4">الفحوصات الحرجة</th>
                    <th className="py-3 px-4">حالة الإبلاغ</th>
                    <th className="py-3 px-4">توقيت الإبلاغ والمستلم</th>
                    <th className="py-3 px-4 text-center">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {reports
                    .filter((r) => r.criticalAlertActive)
                    .map((rep) => {
                      const criticalResults = rep.results.filter(
                        (r) => r.flag === 'CRITICAL_LOW' || r.flag === 'CRITICAL_HIGH'
                      );

                      return (
                        <tr key={rep.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {rep.patient.fullName}
                            </span>
                            <span className="font-mono text-teal-700 dark:text-teal-400 text-[11px]">
                              {rep.reportNumber} · {rep.patient.mrn}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <div className="space-y-0.5">
                              {criticalResults.map((c, i) => (
                                <div key={i} className="font-mono text-rose-600 font-bold text-[11px]">
                                  {c.testNameEn}: {c.value} {c.unit} ({c.flag})
                                </div>
                              ))}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            {rep.criticalCallLog ? (
                              <span className="inline-block px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-lg">
                                تم التبليغ والتأكيد بالعكس
                              </span>
                            ) : (
                              <span className="inline-block px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 rounded-lg animate-pulse">
                                معلق — يتطلب الاتصال فوراً
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-[11px]">
                            {rep.criticalCallLog ? (
                              <div>
                                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                                  {rep.criticalCallLog.notifiedTo}
                                </span>
                                <span className="text-slate-400 font-mono">
                                  {rep.criticalCallLog.notifiedAt} بواسطة {rep.criticalCallLog.notifiedBy}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => {
                                setSelectedReportId(rep.id);
                                setCurrentView('REPORTS');
                              }}
                              className="px-3 py-1.5 text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 rounded-xl"
                            >
                              عرض التقرير
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 5: LAB SETTINGS */}
        {currentView === 'SETTINGS' && (
          <LabSettingsView settings={settings} onUpdateSettings={setSettings} />
        )}
      </main>

      {/* MODALS */}
      {/* 1. Fast Result Entry & Morphology Modal */}
      <ResultEntryModal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        onSaveReport={handleSaveReport}
        existingReport={reportToEdit}
        patients={patients}
        allReports={reports}
        defaultPanelCode={entryDefaultPanel}
        currentUserName={
          userRole === 'PATHOLOGIST' ? 'د. رامي مختار (Consultant)' : 'أخصائي التحاليل الطبية'
        }
      />

      {/* 2. Automated Patient Historical Trend Modal (Delta Track) */}
      <HistoricalTrendModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        patientMrn={historyTargetMrn}
        patientName={historyPatientName}
        reports={reports}
        initialTestCode={historyTargetTest || 'HGB'}
      />

      {/* 3. Cloud Synchronization & Backup Modal */}
      <CloudSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        reports={reports}
        patients={patients}
        settings={settings}
        onRestoreData={(data) => {
          if (data.reports) setReports(data.reports);
          if (data.patients) setPatients(data.patients);
          if (data.settings) setSettings(data.settings);
        }}
      />
    </div>
  );
}
