import React, { useState, useMemo } from 'react';
import { LabReport } from '../types/lab';
import { getPatientWearableDataset, WearableHealthDataset } from '../utils/wearablesIntegration';
import {
  Watch,
  X,
  RefreshCw,
  Activity,
  Heart,
  Droplets,
  Battery,
  Wifi,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface WearablesSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: LabReport | null;
}

export const WearablesSyncModal: React.FC<WearablesSyncModalProps> = ({
  isOpen,
  onClose,
  report
}) => {
  if (!isOpen || !report) return null;

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncTimestamp, setSyncTimestamp] = useState(new Date().toLocaleTimeString('ar-EG'));

  const dataset = useMemo(() => getPatientWearableDataset(report), [report]);

  const handleRefreshSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncTimestamp(new Date().toLocaleTimeString('ar-EG'));
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-white border border-slate-200 w-full max-w-5xl rounded-3xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden text-slate-900"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white flex items-center justify-between border-b border-emerald-900/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <Watch className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wide">
                  تكامل الأجهزة الطبية القابلة للارتداء (Wearable Health IoT)
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white font-mono">
                  Apple Health • Dexcom CGM • Garmin
                </span>
              </div>
              <p className="text-xs text-emerald-200 mt-0.5">
                مزامنة القياسات الحيوية المستمرة ومطابقتها الفسيولوجية مع تحاليل الدم المخبرية
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

        {/* Action & Status Strip */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-100 px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>متصل بالجهاز: {dataset.telemetry.deviceModel}</span>
            </span>
            <span className="text-slate-500 font-mono flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> آخر مزامنة: {syncTimestamp}
            </span>
          </div>

          <button
            onClick={handleRefreshSync}
            disabled={isSyncing}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'جاري سحب القياسات...' : 'تحديث واستدعاء البيانات الآن'}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Vitals Telemetry Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <span className="text-xs text-slate-500 font-bold flex items-center justify-between">
                <span>نبض الراحة المستمر</span>
                <Heart className="w-4 h-4 text-rose-500" />
              </span>
              <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                {dataset.vitals.restingHeartRateBpm}{' '}
                <span className="text-xs text-slate-500 font-normal">bpm</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-bold block mt-1">
                طبيعي (مستقر)
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <span className="text-xs text-slate-500 font-bold flex items-center justify-between">
                <span>تشبع الأكسجين (SpO2)</span>
                <Droplets className="w-4 h-4 text-blue-500" />
              </span>
              <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                {dataset.vitals.avgSpO2Percent}{' '}
                <span className="text-xs text-slate-500 font-normal">%</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono block mt-1">
                أدنى قراءة ليلية: {dataset.vitals.minSpO2Percent}%
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <span className="text-xs text-slate-500 font-bold flex items-center justify-between">
                <span>الضغط الشرياني المتنقل</span>
                <Activity className="w-4 h-4 text-indigo-500" />
              </span>
              <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                {dataset.vitals.ambulatoryBpSystolic}/{dataset.vitals.ambulatoryBpDiastolic}{' '}
                <span className="text-xs text-slate-500 font-normal">mmHg</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-bold block mt-1">
                مثالي (Normotensive)
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <span className="text-xs text-slate-500 font-bold flex items-center justify-between">
                <span>مستشعر السكر المستمر (CGM)</span>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </span>
              <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                {dataset.cgm.avgGlucoseMgDl}{' '}
                <span className="text-xs text-slate-500 font-normal">mg/dL</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-bold block mt-1">
                الوقت في النطاق TIR: {dataset.cgm.timeInRangePercent}%
              </span>
            </div>
          </div>

          {/* Continuous Glucose Monitoring (CGM) 24h Sensor Profile */}
          <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-sm text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>منحنى السكر المستمر على مدار 24 ساعة (Continuous Glucose Monitoring Curve)</span>
                </h3>
                <span className="text-xs text-slate-400">
                  معدل التباين: CV {dataset.cgm.coefficientOfVariationCvPercent}% • التراكمي التقديري: GMI {dataset.cgm.glucoseManagementIndicatorGmi}%
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                  TIR: {dataset.cgm.timeInRangePercent}% (المستهدف &gt; 70%)
                </span>
              </div>
            </div>

            {/* 24h Curve SVG Visualization */}
            <div className="h-44 w-full bg-slate-950 rounded-2xl p-4 border border-slate-800 relative flex items-end justify-between">
              {/* Target Green Zone: 70 - 180 mg/dL */}
              <div className="absolute inset-x-0 top-1/4 bottom-1/4 bg-emerald-500/10 border-y border-emerald-500/30 pointer-events-none">
                <span className="absolute right-3 top-1 text-[9px] font-mono text-emerald-400 font-bold">
                  النطاق المستهدف (70 - 180 mg/dL)
                </span>
              </div>

              {dataset.cgm.trendCurve24h.map((pt, idx) => {
                const heightPct = Math.min(95, Math.max(15, ((pt.glucose - 60) / 180) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 z-10">
                    <span className="text-[10px] font-mono text-slate-300 font-bold">
                      {pt.glucose}
                    </span>
                    <div
                      className="w-5 rounded-t-md bg-gradient-to-t from-emerald-600 to-teal-400"
                      style={{ height: `${heightPct}%` }}
                    ></div>
                    <span className="text-[9px] font-mono text-slate-500">{pt.hour}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Physiological Cross-Correlation Insights */}
          <div className="space-y-3">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>نتائج المطابقة الفسيولوجية بين قراءات الأجهزة والتحاليل المخبرية</span>
            </h3>

            <div className="space-y-3">
              {dataset.correlationInsights.map((insight, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                    insight.correlationStatus === 'concordant'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : insight.correlationStatus === 'discordant'
                      ? 'bg-amber-50 border-amber-200 text-amber-950'
                      : 'bg-rose-50 border-rose-200 text-rose-950'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span className="text-sm font-black flex items-center gap-2">
                      {insight.correlationStatus === 'concordant' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                      )}
                      <span>{insight.titleAr}</span>
                    </span>
                    <span className="font-mono text-[11px] bg-white/80 px-2.5 py-0.5 rounded-full border border-slate-200">
                      {insight.labMarker} ↔ {insight.wearableMetric}
                    </span>
                  </div>

                  <p className="mt-1">{insight.clinicalExplanationAr}</p>

                  <div className="mt-2 pt-2 border-t border-black/10 flex items-center gap-2 font-bold">
                    <span>التوصية الطبية:</span>
                    <span className="font-normal">{insight.recommendationAr}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            تعتمد قراءات الحساسات على بروتوكولات Apple HealthKit و Google Health Connect المعتمدة.
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
