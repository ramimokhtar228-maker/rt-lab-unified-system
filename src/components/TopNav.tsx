import React from 'react';
import {
  Activity,
  Plus,
  Moon,
  Sun,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Shield,
  Bell,
  RefreshCw
} from 'lucide-react';
import { UserRole } from '../types/laboratory';

interface TopNavProps {
  currentView: 'DASHBOARD' | 'REPORTS' | 'PATIENTS' | 'ALERTS' | 'SETTINGS';
  onNavigate: (view: 'DASHBOARD' | 'REPORTS' | 'PATIENTS' | 'ALERTS' | 'SETTINGS') => void;
  userRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onNewReport: () => void;
  criticalAlertsCount: number;
  cloudSyncing: boolean;
  onOpenSyncModal: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentView,
  onNavigate,
  userRole,
  onChangeRole,
  darkMode,
  onToggleDarkMode,
  onNewReport,
  criticalAlertsCount,
  cloudSyncing,
  onOpenSyncModal,
}) => {
  return (
    <header className="no-print bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-8 h-16">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-teal-700 text-white flex items-center justify-center font-black text-sm tracking-tighter">
            RT
          </div>
          <a
            href="#dashboard"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('DASHBOARD');
            }}
            className="text-base font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 flex items-center gap-2"
          >
            <span>RT-Lab Unified System</span>
            <span className="text-xs font-normal text-slate-400 hidden sm:inline">| المعامل الطبية</span>
          </a>
        </div>

        {/* Zone 2: 4-5 concise single-line text navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-600 dark:text-slate-300">
          <button
            onClick={() => onNavigate('DASHBOARD')}
            className={`whitespace-nowrap transition-colors py-1 ${
              currentView === 'DASHBOARD'
                ? 'text-teal-700 dark:text-teal-400 font-bold border-b-2 border-teal-600'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            لوحة المتابعة
          </button>

          <button
            onClick={() => onNavigate('REPORTS')}
            className={`whitespace-nowrap transition-colors py-1 ${
              currentView === 'REPORTS'
                ? 'text-teal-700 dark:text-teal-400 font-bold border-b-2 border-teal-600'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            التقارير والنتائج
          </button>

          <button
            onClick={() => onNavigate('PATIENTS')}
            className={`whitespace-nowrap transition-colors py-1 ${
              currentView === 'PATIENTS'
                ? 'text-teal-700 dark:text-teal-400 font-bold border-b-2 border-teal-600'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            سجل المرضى (MRN)
          </button>

          <button
            onClick={() => onNavigate('ALERTS')}
            className={`whitespace-nowrap transition-colors py-1 relative flex items-center gap-1.5 ${
              currentView === 'ALERTS'
                ? 'text-teal-700 dark:text-teal-400 font-bold border-b-2 border-teal-600'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>تنبيهات الطوارئ</span>
            {criticalAlertsCount > 0 && (
              <span className="bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full animate-pulse">
                {criticalAlertsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onNavigate('SETTINGS')}
            className={`whitespace-nowrap transition-colors py-1 ${
              currentView === 'SETTINGS'
                ? 'text-teal-700 dark:text-teal-400 font-bold border-b-2 border-teal-600'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            بيانات المعمل والترويسة
          </button>
        </nav>

        {/* Zone 3: Primary action + Utilities */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Cloud Sync Status Indicator */}
          <button
            onClick={onOpenSyncModal}
            className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="حالة المزامنة السحابية وقاعدة البيانات"
          >
            <Cloud className={`w-4 h-4 ${cloudSyncing ? 'text-teal-600 animate-spin' : 'text-emerald-500'}`} />
            <span className="hidden xl:inline text-[11px] font-mono">
              {cloudSyncing ? 'مزامنة...' : 'سحابي متصل'}
            </span>
          </button>

          {/* Role Switcher */}
          <div className="relative">
            <select
              value={userRole}
              onChange={(e) => onChangeRole(e.target.value as UserRole)}
              className="text-xs bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-2.5 py-1.5 font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500"
              title="تغيير صلاحية المستخدم (RBAC)"
            >
              <option value="PATHOLOGIST">استشاري (Pathologist)</option>
              <option value="TECHNOLOGIST">أخصائي تحاليل (Technologist)</option>
              <option value="PHLEBOTOMIST">استقبال وسحب عينات</option>
              <option value="AUDITOR">تدقيق وجودة (Auditor)</option>
            </select>
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={darkMode ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* 1 Primary Action */}
          <button
            onClick={onNewReport}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>فحص معملي جديد</span>
          </button>
        </div>
      </div>
    </header>
  );
};
