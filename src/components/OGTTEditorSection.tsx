/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { TestProfile, TestParameter } from '../types/lab';
import {
  extractOgttData,
  generateOgttSvgChart,
  OGTT_SCHEDULE
} from '../utils/ogttEngine';
import {
  Activity,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FlaskConical,
  RotateCcw
} from 'lucide-react';

interface OGTTEditorSectionProps {
  profile: TestProfile;
  onUpdateProfile: (updated: Partial<TestProfile>) => void;
  onUpdateParameters: (updatedParams: TestParameter[]) => void;
}

export const OGTTEditorSection: React.FC<OGTTEditorSectionProps> = ({
  profile,
  onUpdateProfile,
  onUpdateParameters
}) => {
  const ogttEval = useMemo(() => {
    return extractOgttData(profile.parameters);
  }, [profile.parameters]);

  const chartSvg = useMemo(() => {
    return generateOgttSvgChart(ogttEval, 680, 210);
  }, [ogttEval]);

  // Handler to apply preset curves
  const handleApplyPreset = (type: 'normal' | 'impaired' | 'diabetic') => {
    const presets = {
      normal: [85, 140, 155, 130, 110, 95, 85],
      impaired: [108, 165, 185, 175, 160, 135, 115],
      diabetic: [138, 195, 235, 250, 220, 190, 165]
    };

    const targetValues = presets[type];

    const updated = profile.parameters.map(p => {
      const name = (p.name || '').toLowerCase();
      let matchedIdx = -1;
      if (name.includes('fasting') || name.includes('0 min') || name.includes('صائم')) matchedIdx = 0;
      else if (name.includes('30 min') || name.includes('30 دقيقة') || (name.includes('30') && !name.includes('150') && !name.includes('180'))) matchedIdx = 1;
      else if (name.includes('60 min') || name.includes('1 hour') || name.includes('ساعة') || name.includes('60')) matchedIdx = 2;
      else if (name.includes('90 min') || name.includes('1.5 hour') || name.includes('90')) matchedIdx = 3;
      else if (name.includes('120 min') || name.includes('2 hour') || name.includes('ساعتين') || name.includes('120')) matchedIdx = 4;
      else if (name.includes('150 min') || name.includes('2.5 hour') || name.includes('150')) matchedIdx = 5;
      else if (name.includes('180 min') || name.includes('3 hour') || name.includes('3 ساعات') || name.includes('180')) matchedIdx = 6;

      if (matchedIdx !== -1 && targetValues[matchedIdx] !== undefined) {
        const val = targetValues[matchedIdx];
        let flag: 'NORMAL' | 'HIGH' | 'LOW' | 'PANIC_HIGH' = 'NORMAL';
        if (matchedIdx === 0 && val >= 126) flag = 'PANIC_HIGH';
        else if (matchedIdx === 0 && val >= 100) flag = 'HIGH';
        else if (matchedIdx === 4 && val >= 200) flag = 'PANIC_HIGH';
        else if (matchedIdx === 4 && val >= 140) flag = 'HIGH';
        else if (val >= 200) flag = 'PANIC_HIGH';
        else if (val >= 180) flag = 'HIGH';

        return {
          ...p,
          result: String(val),
          flag
        };
      }
      return p;
    });

    onUpdateParameters(updated);
  };

  // Handler to apply clinical interpretation based on live ADA evaluation
  const handleApplyInterpretation = () => {
    const text = `${ogttEval.clinicalSummaryEn}\n• ${ogttEval.clinicalSummaryAr}\n• التقييم المعتمد: ${ogttEval.statusAr} طبقاً لمعايير الجمعية الأمريكية لداء السكري (ADA Guidelines).`;
    onUpdateProfile({ interpretation: text });
  };

  return (
    <div className="space-y-4 my-4 bg-white rounded-2xl border border-rose-200 shadow-sm p-4 sm:p-5">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-rose-700 to-amber-700 text-white shadow-xs">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <span>منحنى السكر بالدم بعد 75 جم جلوكوز (OGTT - 3 Hours Serial Profile)</span>
              <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full border border-rose-200">
                بروتوكول ADA / WHO
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              يشمل قياس الصائم بعد 8 ساعات، ثم قياس كل 30 دقيقة متتالية حتى 3 ساعات مع توليد الرسم البياني آلياً
            </p>
          </div>
        </div>

        {/* Action presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={handleApplyInterpretation}
            className="flex items-center gap-1 px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            title="إدراج التقييم الإكلينيكي والتشخيصي للمنحنى تلقائياً في خانة التفسير"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-200" />
            <span>تطبيق التفسير التشخيصي</span>
          </button>

          <button
            type="button"
            onClick={() => handleApplyPreset('normal')}
            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition cursor-pointer"
            title="ملء منحنى نموذج طبيعي (Normal)"
          >
            ✓ نموذج طبيعي
          </button>

          <button
            type="button"
            onClick={() => handleApplyPreset('impaired')}
            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition cursor-pointer"
            title="ملء منحنى ما قبل السكري (IGT)"
          >
            ⚠️ ما قبل السكري
          </button>

          <button
            type="button"
            onClick={() => handleApplyPreset('diabetic')}
            className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 rounded-xl text-xs font-bold transition cursor-pointer"
            title="ملء منحنى داء السكري (Diabetic)"
          >
            🔴 داء السكري
          </button>
        </div>
      </div>

      {/* Simplified Protocol & Sampling Box (GLUCOSE 75 gm - 8h Fasting) */}
      <div className="bg-gradient-to-r from-rose-50/70 via-slate-50 to-amber-50/50 rounded-xl p-3.5 border border-rose-200/80 text-xs text-slate-700 space-y-2">
        <div className="flex items-center gap-2 font-black text-rose-950 text-xs border-b border-rose-200/60 pb-1.5">
          <FlaskConical className="w-4 h-4 text-rose-700" />
          <span>شرح مبسط لبروتوكول سحب العينات وتناول الجلوكوز (GLUCOSE 75 gm):</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] leading-relaxed">
          <div className="space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-rose-700" />
              <span>1. شروط التحضير وعينة الصائم (0 دقيقة):</span>
            </div>
            <p className="text-slate-600 pr-5">
              صيام تام لمدة <strong>8 ساعات متواصلة</strong> قبل إجراء التحليل (شرب الماء مسموح فقط). يتم سحب عينة الدم الوريدي لتحديد خط الأساس للسكر الصائم (Fasting Blood Sugar).
            </p>

            <div className="font-bold text-slate-900 flex items-center gap-1.5 pt-1">
              <Info className="w-3.5 h-3.5 text-amber-700" />
              <span>2. جرعة الجلوكوز المقررة (Oral Glucose 75g):</span>
            </div>
            <p className="text-slate-600 pr-5">
              إذابة <strong>75 جرام جلوكوز لا مائي نقي (GLUCOSE 75 gm)</strong> في 250 إلى 300 مل من الماء البارد، وتناوله بالكامل خلال <strong>5 دقائق فقط</strong> من بدء التوقيت.
            </p>
          </div>

          <div className="space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-700" />
              <span>3. الراحة ومواعيد السحب التسلسلية (كل 30 دقيقة):</span>
            </div>
            <p className="text-slate-600 pr-5">
              راحة واسترخاء تام داخل المعمل لمدة 3 ساعات كاملة دون تدخين أو مجهود. سحب عينات الدم بدقة عند: <strong>30 دقيقة، 60 دقيقة (ساعة)، 90 دقيقة (ساعة ونصف)، 120 دقيقة (ساعتان)، 150 دقيقة (ساعتان ونصف)، و180 دقيقة (3 ساعات)</strong>.
            </p>

            <div className="font-bold text-slate-900 flex items-center gap-1.5 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>4. النقطة التشخيصية الأساسية (2-Hour Benchmark):</span>
            </div>
            <p className="text-slate-600 pr-5">
              طبيعي: &lt; 140 مغ/دل | مرحلة ما قبل السكري (IGT): 140 - 199 مغ/دل | داء السكري: ≥ 200 مغ/دل.
            </p>
          </div>
        </div>
      </div>

      {/* Real-time Dynamic SVG Curve */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
          <span className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-rose-700" />
            <span>الرسم البياني لمنحنى تحمل الجلوكوز (يولد تلقائياً بناءً على النتائج):</span>
          </span>
          <span className="font-mono text-[11px] text-slate-500">
            {ogttEval.points.filter(p => p.value !== null).length} من 7 قراءات مدخلة
          </span>
        </div>

        <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-inner p-2">
          <div dangerouslySetInnerHTML={{ __html: chartSvg }} />
        </div>
      </div>

      {/* Live Diagnostic Evaluation Banner */}
      <div
        className="rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border"
        style={{
          backgroundColor: ogttEval.badgeBg,
          borderColor: `${ogttEval.statusColor}40`
        }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">التقييم التشخيصي الآلي المعتمد (ADA):</span>
            <span
              className="text-xs font-black text-white px-2.5 py-0.5 rounded-full shadow-2xs"
              style={{ backgroundColor: ogttEval.statusColor }}
            >
              {ogttEval.statusAr}
            </span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            {ogttEval.clinicalSummaryAr}
          </p>
          <div className="text-[11px] font-mono text-slate-500">
            {ogttEval.clinicalSummaryEn}
          </div>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-r sm:pr-4 border-slate-200/60 pt-2 sm:pt-0 shrink-0 font-mono text-xs">
          <div>الصائم: <strong className="text-slate-900">{ogttEval.fastingVal !== null ? `${ogttEval.fastingVal} mg/dL` : '—'}</strong></div>
          <div>بعد ساعتين: <strong className="text-slate-900">{ogttEval.twoHourVal !== null ? `${ogttEval.twoHourVal} mg/dL` : '—'}</strong></div>
          <div>أعلى ذروة: <strong className="text-rose-700">{ogttEval.peakVal !== null ? `${ogttEval.peakVal} mg/dL` : '—'}</strong></div>
        </div>
      </div>
    </div>
  );
};
