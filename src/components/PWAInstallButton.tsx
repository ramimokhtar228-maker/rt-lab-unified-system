import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, Laptop, Check, X, Share2, Sparkles, MonitorSmartphone } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'header' | 'compact' | 'banner' | 'card';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header', className = '' }) => {
  const { hasNativePrompt, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // If already running as an installed standalone PWA app
  if (isInstalled || installSuccess) {
    if (variant === 'compact') return null;
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-400 text-xs font-semibold shadow-xs">
        <Check className="w-3.5 h-3.5 text-emerald-300" />
        <span className="hidden sm:inline">تطبيق مثبت ويعمل بدون إنترنت</span>
        <span className="sm:hidden">مثبت ✓</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    if (hasNativePrompt) {
      const outcome = await install();
      if (outcome) {
        setInstallSuccess(true);
      }
    } else {
      setShowGuide(true);
    }
  };

  if (variant === 'banner') {
    return (
      <>
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-950/90 via-slate-900 to-indigo-950/90 border border-rose-500/30 p-4 shadow-xl backdrop-blur-md ${className}`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-400 flex items-center justify-center shadow-lg shadow-rose-600/30 text-white shrink-0">
                <MonitorSmartphone className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-extrabold text-white">تثبيت تطبيق RT Lab على جهازك</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    موبايل ولابتوب
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  يعمل مثل التطبيقات الأصلية بسرعة فائقة مع التسميع اللحظي الفوري بين جميع الأجهزة ودعم العمل بدون إنترنت.
                </p>
              </div>
            </div>

            <button
              onClick={handleInstallClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white text-xs font-black shadow-lg shadow-rose-600/30 transition-all cursor-pointer active:scale-95 shrink-0"
            >
              <Download className="w-4 h-4 animate-bounce" />
              <span>تثبيت التطبيق الآن</span>
            </button>
          </div>
        </div>

        {/* Modal Guide */}
        {showGuide && renderGuideModal(isIOS, () => setShowGuide(false))}
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        title="تثبيت منظومة RT LAB كتطبيق مستقل على الموبايل أو اللابتوب"
        className={`group relative inline-flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-black shadow-md hover:shadow-rose-500/30 hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-95 border border-rose-400/30 ${className}`}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
        </span>
        <Download className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
        <span className="hidden md:inline">تثبيت التطبيق (موبايل / لابتوب)</span>
        <span className="md:hidden">تثبيت التطبيق</span>
      </button>

      {/* Guide Modal */}
      {showGuide && renderGuideModal(isIOS, () => setShowGuide(false))}
    </>
  );
};

function renderGuideModal(isIOS: boolean, onClose: () => void) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl text-right text-white relative">
        <button
          onClick={onClose}
          className="absolute left-5 top-5 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-600 to-rose-700 flex items-center justify-center shadow-lg shadow-rose-900/50">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">تثبيت منظومة معمل RT</h3>
            <p className="text-xs text-slate-400 mt-0.5">خطوات تثبيت الصفحة كتطبيق رئيسي مستقل على هاتفك أو حاسوبك</p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-300">
          {/* Mobile Step */}
          <div className="bg-slate-800/90 p-4 rounded-2xl border border-slate-700/60 shadow-sm">
            <div className="flex items-center gap-2 font-black text-rose-300 mb-2.5">
              <Smartphone className="w-4 h-4 text-rose-400" />
              <span>على الهاتف المحمول (Android & iPhone):</span>
            </div>
            {isIOS ? (
              <ol className="list-decimal list-inside space-y-2 text-slate-300 leading-relaxed">
                <li>في متصفح Safari، اضغط على زر <strong>المشاركة (Share <Share2 className="w-3.5 h-3.5 inline text-blue-400" />)</strong> أسفل الشاشة.</li>
                <li>مرر للأسفل واختر <strong>"إضافة إلى الشاشة الرئيسية" (Add to Home Screen)</strong>.</li>
                <li>اضغط على <strong>"إضافة" (Add)</strong> في الزاوية العليا ليظهر التطبيق في شاشة الهاتف مباشرة.</li>
              </ol>
            ) : (
              <ol className="list-decimal list-inside space-y-2 text-slate-300 leading-relaxed">
                <li>في متصفح Chrome أو المتصفح الافتراضي، اضغط على قائمة الثلاث نقاط <strong>(⋮)</strong> بأعلى الشاشة.</li>
                <li>اختر <strong>"تثبيت التطبيق" (Install app)</strong> أو <strong>"إضافة إلى الشاشة الرئيسية"</strong>.</li>
                <li>سيتم تثبيت التطبيق فورياً ووضعه على الشاشة الرئيسية بدون الحاجة لفتح المتصفح في كل مرة.</li>
              </ol>
            )}
          </div>

          {/* Laptop & PC Step */}
          <div className="bg-slate-800/90 p-4 rounded-2xl border border-slate-700/60 shadow-sm">
            <div className="flex items-center gap-2 font-black text-sky-300 mb-2.5">
              <Laptop className="w-4 h-4 text-sky-400" />
              <span>على اللابتوب والكمبيوتر (Windows / Mac / Chromebook):</span>
            </div>
            <ol className="list-decimal list-inside space-y-2 text-slate-300 leading-relaxed">
              <li>في متصفح Google Chrome أو Microsoft Edge، ستجد أيقونة تثبيت صغيرة <strong>(⤓ أو Install)</strong> على أقصى يمين شريط العنوان URL.</li>
              <li>اضغط عليها ثم اختر <strong>"تثبيت" (Install)</strong>.</li>
              <li>سيتم فتح البرنامج في نافذة مستقلة أنيقة بدون شريط المتصفح وتظهر أيقونة المعمل على سطح المكتب وشريط المهام.</li>
            </ol>
          </div>

          {/* Sync & Offline Benefit */}
          <div className="bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/30 p-3.5 rounded-2xl flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <p className="text-[11px] text-emerald-200 leading-relaxed">
              <strong>التسميع اللحظي الفوري:</strong> بعد التثبيت، أي مريض أو تحليل يُسجل على الموبايل يسمع فوراً على اللابتوب والعكس تلقائياً دون الحاجة لتحديث الصفحة.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 py-3 text-xs font-extrabold text-white transition-all shadow-md active:scale-98"
        >
          فهمت، إغلاق
        </button>
      </div>
    </div>
  );
}
