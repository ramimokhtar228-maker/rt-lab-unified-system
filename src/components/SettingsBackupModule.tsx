import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Lock,
  Download,
  Upload,
  Shield,
  KeyRound,
  RefreshCw,
  AlertTriangle,
  Building,
  CheckCircle2,
  HardDrive,
  Smartphone,
  Laptop,
  Sparkles,
  Cloud,
  Radio,
  Share2,
  FileSpreadsheet
} from 'lucide-react';
import { PWAInstallModal } from './PWAInstallModal';
import { realtimeSyncManager } from '../utils/realtimeMultiDeviceSync';

export const SettingsBackupModule: React.FC = () => {
  const {
    exportBackup,
    importBackup,
    resetToDefaultData,
    clearPatientRecordsOnly,
    currentUser,
    language,
    reports,
    incomeRecords,
    fetchAllDevicesData,
    syncUnifiedDataToGitHub,
    isDeviceSyncing,
    lastDeviceSyncAt
  } = useApp();

  // Multi-Device Sync State
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Export State
  const [exportPassword, setExportPassword] = useState('');
  const [useEncryption, setUseEncryption] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [pwaModalOpen, setPwaModalOpen] = useState(false);

  // Import State
  const [importPassword, setImportPassword] = useState('');
  const [importFileContent, setImportFileContent] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleFetchDevices = async () => {
    setSyncFeedback('جاري الاتصال بالسحابة وجلب كافة بيانات الأجهزة...');
    try {
      const res = await fetchAllDevicesData();
      setSyncFeedback(res.message);
      setTimeout(() => setSyncFeedback(null), 6000);
    } catch (err: any) {
      setSyncFeedback(`خطأ: ${err.message || 'فشل جلب البيانات'}`);
    }
  };

  const handlePushDevices = async () => {
    setSyncFeedback('جاري رفع وتسميع البيانات لجميع الأجهزة سحابياً...');
    try {
      const res = await syncUnifiedDataToGitHub();
      setSyncFeedback(res.message);
      setTimeout(() => setSyncFeedback(null), 6000);
    } catch (err: any) {
      setSyncFeedback(`خطأ: ${err.message || 'فشل الرفع السحابي'}`);
    }
  };

  const handlePingDevices = () => {
    realtimeSyncManager.broadcastAction('PING_TEST', { time: Date.now() });
    setSyncFeedback('⚡ تم إرسال إشارة اختبار التسميع اللحظي لجميع الأجهزة النشطة بنجاح');
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const pwd = useEncryption ? exportPassword.trim() : undefined;
      if (useEncryption && !pwd) {
        alert(language === 'ar' ? 'يرجى إدخال كلمة مرور لحماية ملف النسخة الاحتياطية' : 'Please provide a password for encryption');
        setIsExporting(false);
        return;
      }

      const backupStr = await exportBackup(pwd);
      const blob = new Blob([backupStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `RT_Lab_Backup_${useEncryption ? 'SECURE_' : ''}${dateStr}.${useEncryption ? 'rtlab' : 'json'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const content = evt.target?.result as string;
      setImportFileContent(content);
      setImportStatus(null);
    };
    reader.readAsText(file);
  };

  const handleRestore = async () => {
    if (!importFileContent) {
      alert('يرجى اختيار ملف النسخة الاحتياطية أولاً');
      return;
    }

    setIsImporting(true);
    try {
      const res = await importBackup(importFileContent, importPassword.trim() || undefined);
      setImportStatus(res);
      if (res.success) {
        setImportFileContent(null);
        setImportPassword('');
      }
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-rose-800" />
          <span>{language === 'ar' ? 'النسخ الاحتياطي السحابي وحماية البيانات بكلمات مرور' : 'Cloud Backup & Password-Protected Encryption'}</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {language === 'ar'
            ? 'تصدير واستعادة كامل قاعدة بيانات معامل RT (المرضى، الفواتير، المصروفات، الكواشف، والمرتبات) مشفرة بخوارزمية AES-GCM 256-bit.'
            : 'Export and restore complete lab databases protected with military-grade AES-GCM encryption.'}
        </p>
      </div>

      {/* Real-time Multi-Device Sync Card */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white p-6 rounded-2xl border border-rose-900/50 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-600/30 rounded-xl border border-rose-500/40 text-rose-300">
              <Cloud className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-black flex items-center gap-2">
                <span>خاصية التسميع والمزامنة اللحظية بين الأجهزة</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono">
                  LIVE CLOUD SYNC
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                تسميع فوري لحظي لكافة حالات المرضى والفواتير بين الموبايل، التابلت، ولاب توب المعمل عبر Firebase و GitHub
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-left text-xs bg-black/40 px-3 py-1.5 rounded-xl border border-white/10 font-mono">
              <span className="text-slate-400 block text-[10px]">الجهاز الحالي:</span>
              <strong className="text-rose-200">{realtimeSyncManager.getStatus().activeDeviceName}</strong>
            </div>
          </div>
        </div>

        {/* Sync Controls & Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={handleFetchDevices}
            disabled={isDeviceSyncing}
            className="p-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            {isDeviceSyncing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4 text-emerald-200" />
            )}
            <span>جلب وتوحيد بيانات الأجهزة سحابياً</span>
          </button>

          <button
            type="button"
            onClick={handlePushDevices}
            disabled={isDeviceSyncing}
            className="p-3 bg-rose-800 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Upload className="w-4 h-4 text-rose-300" />
            <span>رفع وتسميع البيانات لجميع الأجهزة</span>
          </button>

          <button
            type="button"
            onClick={handlePingDevices}
            className="p-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Radio className="w-4 h-4 text-amber-400" />
            <span>اختبار إشارة التسميع اللحظي (Ping)</span>
          </button>
        </div>

        {syncFeedback && (
          <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold text-center animate-in fade-in">
            {syncFeedback}
          </div>
        )}

        {/* Sync Statistics */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-300 pt-2 border-t border-white/10">
          <div className="flex items-center gap-4">
            <span>التقارير الطبية المتزامنة: <strong className="text-white font-mono">{reports.length}</strong></span>
            <span>الفواتير المسجلة: <strong className="text-emerald-400 font-mono">{incomeRecords.length}</strong></span>
          </div>
          <div>
            {lastDeviceSyncAt ? (
              <span>آخر جلب وتسميع: <strong className="text-rose-200 font-mono">{lastDeviceSyncAt.toLocaleTimeString('en-US')}</strong></span>
            ) : (
              <span className="text-slate-400">التسميع اللحظي نشط تلقائياً</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* EXPORT CARD */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm border-b pb-3">
            <Download className="w-5 h-5 text-rose-800" />
            <span>تصدير نسخة احتياطية آمنة (Export Backup)</span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            يتم تجميع كافة السجلات المالية والطبية في ملف واحد، مع إمكانية تشفيره بكلمة مرور خاصة بحيث لا يمكن لأي شخص فتحه أو قراءته دون كلمة السر.
          </p>

          <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useEncryption}
                onChange={e => setUseEncryption(e.target.checked)}
                className="rounded text-rose-700 focus:ring-rose-500"
              />
              <span className="font-bold text-slate-800">حماية النسخة الاحتياطية بكلمة مرور مشفرة (AES-256)</span>
            </label>

            {useEncryption && (
              <div>
                <label className="block text-slate-700 font-bold mb-1">كلمة مرور التشفير *:</label>
                <div className="relative">
                  <input
                    type="password"
                    value={exportPassword}
                    onChange={e => setExportPassword(e.target.value)}
                    placeholder="أدخل كلمة مرور قوية لحماية الملف..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-rose-800 bg-white"
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  احرص على تذكر هذه الكلمة لأنك ستحتاجها عند استعادة البيانات.
                </span>
              </div>
            )}
          </div>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full py-2.5 px-4 bg-rose-900 hover:bg-rose-950 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'جارِ تشفير وتصدير النسخة...' : 'تصدير وتحميل النسخة الاحتياطية الآن'}</span>
          </button>
        </div>

        {/* RESTORE CARD */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm border-b pb-3">
            <Upload className="w-5 h-5 text-slate-700" />
            <span>استعادة البيانات من نسخة احتياطية (Restore Backup)</span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            استرجع سجلات الحسابات والتحاليل من ملف تم تصديره مسبقاً (.rtlab أو .json). في حال كان الملف مشفراً، سيطلب النظام كلمة المرور.
          </p>

          <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">اختر ملف النسخة الاحتياطية:</label>
              <input
                type="file"
                accept=".rtlab,.json"
                onChange={handleFileChange}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">كلمة مرور فك التشفير (إن وجدت):</label>
              <input
                type="password"
                value={importPassword}
                onChange={e => setImportPassword(e.target.value)}
                placeholder="أدخل كلمة المرور إذا كان الملف مشفراً..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-rose-800 bg-white"
              />
            </div>
          </div>

          <button
            onClick={handleRestore}
            disabled={isImporting || !importFileContent}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isImporting ? 'animate-spin' : ''}`} />
            <span>{isImporting ? 'جارِ فك التشفير والاستعادة...' : 'استعادة قاعدة البيانات الآن'}</span>
          </button>

          {importStatus && (
            <div className={`p-3 rounded-lg text-xs font-bold text-center ${
              importStatus.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              {importStatus.message}
            </div>
          )}
        </div>

      </div>

      {/* PWA App Installation Card */}
      <div className="bg-gradient-to-br from-rose-950 via-slate-950 to-slate-900 text-white p-6 rounded-2xl shadow-lg border border-rose-900 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="font-extrabold text-base text-white">
                تنزيل وتثبيت المنظومة كتطبيق أصلي (PWA) على اللاب توب والموبايل
              </h3>
            </div>
            <p className="text-xs text-rose-200/90 leading-relaxed max-w-2xl">
              يمكنك تشغيل البرنامج كتطبيق مستقل على سطح المكتب في نظام Windows / Mac، أو كتطبيق على هواتف Android و iPhone. يتميز بالعمل بدون إعلانات أو أشرطة متصفح، وسرعة فائقة في فتح الفواتير وتوليد الباركود.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setPwaModalOpen(true)}
            className="px-5 py-3 bg-rose-500 hover:bg-rose-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 shrink-0 hover:shadow-rose-500/20"
          >
            <Download className="w-4 h-4" />
            <span>تنزيل وتثبيت التطبيق الآن</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-rose-900/60 text-xs">
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10 flex items-center gap-2.5">
            <Laptop className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="font-bold text-white">اللاب توب والكمبيوتر</div>
              <div className="text-[11px] text-rose-200">Chrome, Edge, Brave</div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10 flex items-center gap-2.5">
            <Smartphone className="w-5 h-5 text-emerald-300 shrink-0" />
            <div>
              <div className="font-bold text-white">موبايل أندرويد (Android)</div>
              <div className="text-[11px] text-emerald-200">إضافة للشاشة الرئيسية</div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10 flex items-center gap-2.5">
            <Smartphone className="w-5 h-5 text-blue-300 shrink-0" />
            <div>
              <div className="font-bold text-white">آيفون وآيباد (iOS)</div>
              <div className="text-[11px] text-blue-200">عبر متصفح Safari</div>
            </div>
          </div>
        </div>
      </div>

      <PWAInstallModal
        isOpen={pwaModalOpen}
        onClose={() => setPwaModalOpen(false)}
      />

      {/* Lab Facilities & Reset Settings */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b pb-2">
          <Building className="w-4 h-4 text-rose-800" />
          <span>بيانات معامل RT المعتمدة:</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded border">
            <span className="text-slate-500 block">اسم المنشأة الطبية:</span>
            <span className="font-bold text-slate-900">معامل RT للتشخيص والتحاليل الطبية</span>
          </div>

          <div className="p-3 bg-slate-50 rounded border">
            <span className="text-slate-500 block">المدير الطبي ورئيس مجلس الإدارة:</span>
            <span className="font-bold text-rose-950">أ.د. رامي مختار</span>
          </div>

          <div className="p-3 bg-slate-50 rounded border">
            <span className="text-slate-500 block">رقم الترخيص الطبي:</span>
            <span className="font-mono font-bold text-slate-900">EGY-MED-48201</span>
          </div>
        </div>

        {/* Clean Patient Records Only (Production Readiness) */}
        {currentUser.role === 'admin_ceo' && (
          <div className="pt-4 border-t flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-amber-800">تصفير سجلات المرضى والفواتير (تجهيز للتشغيل الفعلي)</div>
              <div className="text-[11px] text-slate-500">حذف جميع فواتير وحالات المرضى والبدء بسجل نظيف على بياض مع الحفاظ التام على كتالوج التحاليل، الأسعار، الفروع، وبيانات الإدارة.</div>
            </div>
            <button
              onClick={() => {
                if (confirm('هل أنت متأكد من تصفير وحذف جميع سجلات وفواتير المرضى الحالية للبدء بسجل عمل فعلي؟ سيتم الاحتفاظ بالكتالوج والأسعار والفروع والإدارة بالكامل.')) {
                  clearPatientRecordsOnly();
                  alert('تم تصفير سجلات المرضى بنجاح! المنظومة جاهزة للعمل الفعلي الآن.');
                }
              }}
              className="px-3.5 py-1.5 bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300 text-xs font-bold rounded-lg transition-colors"
            >
              تصفير سجل المرضى
            </button>
          </div>
        )}

                {/* Danger Zone: Reset Default Data */}
        {currentUser.role === 'admin_ceo' && (
          <div className="pt-4 border-t flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-rose-700">إعادة ضبط البيانات الافتراضية</div>
              <div className="text-[11px] text-slate-500">استعادة البيانات النموذجية لمعامل RT وحذف أي بيانات تجريبية.</div>
            </div>
            <button
              onClick={() => {
                if (confirm('هل أنت متأكد من إعادة ضبط المنظومة للبيانات الأولية؟ سيتم مسح أي تعديلات غير محفوظة.')) {
                  resetToDefaultData();
                  alert('تمت استعادة البيانات الافتراضية بنجاح.');
                }
              }}
              className="px-3.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold rounded-lg transition-colors"
            >
              إعادة الضبط
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
