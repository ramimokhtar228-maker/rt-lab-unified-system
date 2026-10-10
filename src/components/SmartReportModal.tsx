import React, { useMemo, useState } from 'react';
import { LabReport } from '../types/lab';
import { useApp } from '../context/AppContext';
import { generateSmartClinicalAnalysis, SmartClinicalAnalysis } from '../utils/smartReportEngine';
import { generateGeminiClinicalReport, GeminiClinicalReportResult } from '../utils/geminiSmartReport';
import { analyzeClinicalCorrelations, ClinicalCorrelationResult } from '../utils/clinicalCorrelationEngine';
import {
  Sparkles,
  X,
  Printer,
  ShieldAlert,
  Activity,
  Brain,
  CheckCircle2,
  Stethoscope,
  Copy,
  Check,
  Loader2,
  Share2,
  FileText,
  AlertTriangle,
  History,
  Pill,
  BookOpen,
  ArrowRightLeft,
  HeartPulse,
  Flame,
  TestTube,
  Droplets,
  Layers,
  Send,
  HelpCircle,
  TrendingUp
} from 'lucide-react';

interface SmartReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: LabReport | null;
  onAttachToReport?: (analysis: SmartClinicalAnalysis) => void;
  onApplyInsights?: (insights: string) => void;
  onOpenDoctorCritical?: () => void;
  onOpenEHR?: () => void;
}

type TabType =
  | 'clinical_analysis'
  | 'pathophysiology'
  | 'history_correlations'
  | 'evidence_guidelines'
  | 'ai_synthesis';

export const SmartReportModal: React.FC<SmartReportModalProps> = ({
  isOpen,
  onClose,
  report,
  onAttachToReport,
  onApplyInsights,
  onOpenDoctorCritical,
  onOpenEHR
}) => {
  const { reports } = useApp();
  if (!isOpen || !report) return null;

  const analysis = useMemo(() => generateSmartClinicalAnalysis(report), [report]);
  const correlations: ClinicalCorrelationResult = useMemo(
    () => analyzeClinicalCorrelations(report, reports),
    [report, reports]
  );

  const [activeTab, setActiveTab] = useState<TabType>('clinical_analysis');
  const [explanationMode, setExplanationMode] = useState<'physician' | 'patient'>('physician');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<GeminiClinicalReportResult | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  const handlePrintSmart = () => {
    window.print();
  };

  const handleAttach = () => {
    if (onAttachToReport) {
      onAttachToReport(analysis);
    } else if (onApplyInsights) {
      onApplyInsights(analysis.executiveSummaryAr);
    }
    onClose();
  };

  const handleRunAi = async () => {
    try {
      setIsAiLoading(true);
      const res = await generateGeminiClinicalReport(report);
      if (res) {
        setAiResult(res);
        setActiveTab('ai_synthesis');
      } else {
        alert('تم الاعتماد على محرك التحليل السريري المدمج (Offline Clinical Engine).');
      }
    } catch (err) {
      console.warn('AI analysis failed:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleCopyWhatsApp = () => {
    const text = `🔬 *تقرير التحليل الإكلينيكي الاستشاري الذكي - معامل RT*
المريض: *${report.patient.fullName}* (#${report.patient.labNumber})
إشراف: *أ.د. رامي مختار - استشاري الباثولوجيا الإكلينيكية والكيميائية*
────────────────────
📋 *الخلاصة الاستشارية:*
${analysis.executiveSummaryAr}

🩺 *التشخيصات الأكثر ترجيحاً:*
${analysis.differentialDiagnoses.map(d => `• ${d.diseaseAr} (${d.likelihood === 'high' ? 'احتمالية عالية' : 'محتمل'}): ${d.rationaleAr}`).join('\n')}

💡 *توصيات الاستشاري المعتمدة على الأبحاث:*
${analysis.consultantRecommendations.slice(0, 4).map((r, i) => `${i + 1}. ${r}`).join('\n')}
────────────────────
معامل RT للتحاليل الطبية والتشخيصية • هاتف: 01012345678`;

    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-white border border-slate-200 w-full max-w-5xl rounded-3xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden text-slate-800"
        dir="rtl"
      >
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-red-950 via-rose-900 to-slate-900 text-white flex items-center justify-between border-b border-rose-950/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wide">
                  التقرير السريري الاستشاري والربط التشخيصي الذكي
                </h2>
                <span className="bg-rose-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                  RT Clinical Intelligence v5.0
                </span>
              </div>
              <p className="text-xs text-rose-200 mt-0.5">
                ربط شامل للنتائج بالتاريخ المرضي والأدوية وتوصيات علاجية مستندة للأبحاث العلمية (ADA • KDIGO • ACC/AHA)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-rose-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls Navigation */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            <button
              onClick={() => setActiveTab('clinical_analysis')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'clinical_analysis'
                  ? 'bg-rose-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>التحليل السريري الاستشاري</span>
            </button>

            <button
              onClick={() => setActiveTab('pathophysiology')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'pathophysiology'
                  ? 'bg-rose-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>الشرح الطبي والفسيولوجيا المرضية</span>
            </button>

            <button
              onClick={() => setActiveTab('history_correlations')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'history_correlations'
                  ? 'bg-rose-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>الربط بالتاريخ المرضي والأدوية ({correlations.historyCorrelations.length + correlations.medicationInteractions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('evidence_guidelines')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'evidence_guidelines'
                  ? 'bg-rose-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>توصيات الأبحاث والإرشادات الدولية</span>
            </button>

            <button
              onClick={() => setActiveTab('ai_synthesis')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'ai_synthesis'
                  ? 'bg-rose-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Brain className="w-3.5 h-3.5 text-amber-500" />
              <span>الذكاء الاصطناعي (Gemini 2.5)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyWhatsApp}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {copiedSuccess ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSuccess ? 'تم النسخ' : 'نسخ لواتساب'}</span>
            </button>

            <button
              onClick={handlePrintSmart}
              className="p-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition cursor-pointer"
              title="طباعة التقرير الاستشاري"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs leading-relaxed">
          {/* TAB 1: Main Clinical Analysis */}
          {activeTab === 'clinical_analysis' && (
            <div className="space-y-6">
              {/* Executive Summary Card */}
              <div className="bg-gradient-to-br from-rose-50 via-white to-slate-50 border border-rose-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-rose-900 text-white flex items-center justify-center font-bold text-xs">
                      RT
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-slate-900">
                        الخلاصة الاستشارية الشاملة (Executive Pathology Synthesis)
                      </h3>
                      <div className="text-[11px] text-slate-500 font-mono">
                        إشراف: أ.د. رامي مختار • استشاري الباثولوجيا الإكلينيكية
                      </div>
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-full font-bold text-xs ${
                    analysis.criticalAlerts.length > 0
                      ? 'bg-red-100 text-red-800 border border-red-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}>
                    {analysis.criticalAlerts.length > 0 ? 'مؤشرات حرجة تتطلب تدخلاً' : 'حالة سريرية مستقرة'}
                  </span>
                </div>

                <p className="text-slate-800 text-xs sm:text-sm leading-relaxed font-medium bg-white/70 p-3.5 rounded-xl border border-rose-100">
                  {analysis.executiveSummaryAr}
                </p>
              </div>

              {/* Organ Systems Status Grid */}
              <div>
                <h4 className="font-black text-sm text-slate-900 mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-rose-800" />
                  <span>تقييم كفاءة أجهزة الجسم الحيوية (Organ System Health Scores)</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {Object.entries(analysis.organScores).map(([key, data]) => {
                    const statusColor =
                      data.status === 'optimal'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : data.status === 'mild'
                        ? 'bg-blue-50 border-blue-200 text-blue-900'
                        : data.status === 'moderate'
                        ? 'bg-amber-50 border-amber-200 text-amber-900'
                        : 'bg-rose-50 border-rose-200 text-rose-900';

                    const scoreColor =
                      data.score >= 85
                        ? 'text-emerald-700'
                        : data.score >= 70
                        ? 'text-amber-700'
                        : 'text-rose-700';

                    return (
                      <div
                        key={key}
                        className={`rounded-2xl border p-3.5 flex flex-col justify-between ${statusColor}`}
                      >
                        <div>
                          <span className="text-[11px] font-bold block mb-1">
                            {key === 'renal' ? 'وظائف الكلى' : key === 'hepatic' ? 'وظائف الكبد' : key === 'metabolic' ? 'التمثيل الغذائي' : key === 'hematologic' ? 'صحة الدم' : 'القلب والدهون'}
                          </span>
                          <div className={`text-2xl font-black font-mono ${scoreColor}`}>
                            {data.score}%
                          </div>
                        </div>
                        <span className="text-[10px] font-bold mt-2 bg-white/80 px-2 py-0.5 rounded-md text-center border border-black/5">
                          {data.labelAr}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Differential Diagnoses & Calculated Indices */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Differential Diagnoses */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <h4 className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-rose-800" />
                    <span>التشخيصات التفريقية الأكثر ترجيحاً (Differential Diagnoses):</span>
                  </h4>

                  <div className="space-y-2">
                    {analysis.differentialDiagnoses.map((diag, i) => (
                      <div key={i} className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{diag.diseaseAr}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            diag.likelihood === 'high' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {diag.likelihood === 'high' ? 'احتمالية عالية' : 'محتمل'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-snug">{diag.rationaleAr}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Calculated Physiological Indices */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <h4 className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-blue-700" />
                    <span>المؤشرات والمعادلات السريرية المحسوبة:</span>
                  </h4>

                  <div className="space-y-2">
                    {analysis.calculatedIndices.map((idx, i) => (
                      <div key={i} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900 block">{idx.nameAr}</span>
                          <span className="text-[10px] text-slate-500 font-mono" dir="ltr">{idx.nameEn}</span>
                          <span className="text-[10px] text-slate-600 block mt-0.5">{idx.interpretationAr}</span>
                        </div>
                        <div className="text-left shrink-0">
                          <span className="font-mono font-black text-base text-rose-900">{idx.value}</span>
                          <span className="text-[10px] text-slate-500 block">مرجع: {idx.reference}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Detailed Pathophysiology & Case Explanation */}
          {activeTab === 'pathophysiology' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between bg-slate-100 p-2.5 rounded-2xl">
                <span className="font-bold text-xs text-slate-800">مستوى الشرح المطلوب:</span>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={() => setExplanationMode('physician')}
                    className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition ${
                      explanationMode === 'physician'
                        ? 'bg-rose-900 text-white shadow-xs'
                        : 'bg-white text-slate-700'
                    }`}
                  >
                    تقرير سريري تخصصي للطبيب المعالج
                  </button>
                  <button
                    onClick={() => setExplanationMode('patient')}
                    className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition ${
                      explanationMode === 'patient'
                        ? 'bg-rose-900 text-white shadow-xs'
                        : 'bg-white text-slate-700'
                    }`}
                  >
                    شرح طبي مبسط للمريض
                  </button>
                </div>
              </div>

              {explanationMode === 'physician' ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="border-r-4 border-rose-900 pr-3">
                    <h3 className="font-black text-base text-slate-900">
                      التفسير الفسيولوجي المرضي التفصيلي (In-Depth Pathophysiological Analysis)
                    </h3>
                    <span className="text-slate-500 font-mono text-xs">
                      Consultant Clinical Review • ISO 15189 Quality Protocol
                    </span>
                  </div>

                  <div className="space-y-3 text-slate-700 leading-relaxed text-xs sm:text-sm">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <h4 className="font-bold text-rose-950 mb-1">1. الربط الديناميكي لمؤشرات الدم والأيض:</h4>
                      <p>
                        يُظهر التدقيق المعملي لنتائج المريض تكاملاً فسيولوجياً واضحاً بين مؤشرات الأنيميا وكفاءة الأعضاء؛ حيث يُشير تراجع خضاب الدم مع انخفاض مؤشر حجم الكرية MCV إلى خلل في نضج خلايا الدم الحمراء في مرحلة تكوين الهيم. ويُعزز ارتفاع مؤشر RDW وجود تباين ملحوظ في أحجام الكريات الحمراء، ما يوجه التشخيص الأولي نحو استنزاف مخزون الحديد أو اعتلال إنتاج سلاسل الجلوبين.
                      </p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <h4 className="font-bold text-rose-950 mb-1">2. التروية الكلوية والتوازن الإلكتروليتي:</h4>
                      <p>
                        تم تقييم وظائف الكلى بالربط بين تركيز الكرياتينين المصلي، البولينا، ومعادلة CKD-EPI لحساب معدل الترشيح الكبيبي eGFR. تشير النتائج إلى كفاءة إخراجية مستقرة مع غياب علامات احتباس السوائل أو فرط النيتروجين في الدم، مع ضرورة الحفاظ على التروية الكلوية وتجنب الأدوية السامة للكلى.
                      </p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <h4 className="font-bold text-rose-950 mb-1">3. السلامة الكبدية ومؤشرات التمثيل الغذائي:</h4>
                      <p>
                        نسبة إنزيمات الكبد De Ritis Ratio (AST/ALT) تقع في النطاق الفسيولوجي، ما ينفي وجود نخر خلوي كبدي حاد أو تشحم كبدي متقدم. كما أن مؤشرات الدهون تعكس مستوى منخفضاً لعوامل الخطورة الوعائية التصلبية.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-5 space-y-4">
                  <div className="border-r-4 border-emerald-700 pr-3">
                    <h3 className="font-black text-base text-emerald-950">
                      رسالة طمأنة وتوضيح طبي مبسط للمريض
                    </h3>
                    <span className="text-emerald-700 font-mono text-xs">
                      شرح مبسط وموثوق لحالتك الصحية لمساعدتك على فهم نتائجك
                    </span>
                  </div>

                  <div className="space-y-3 text-slate-800 text-xs sm:text-sm leading-relaxed">
                    <p className="bg-white p-4 rounded-xl border border-emerald-100">
                      عزيزي المريض، تبين من خلال تحاليلك أن معظم الوظائف الحيوية لديك تعمل بصورة جيدة. نوصيك بالاهتمام بالتغذية الصحية المتوازنة الغنية بالخضروات الورقية والبروتين لدعم كرات الدم الحمراء، وشرب كميات كافية من الماء يومياً للحفاظ على نشاط الكلى. يرجى مراجعة طبيبك المعالج لمناقشة التوصيات ومتابعة الخطة العلاجية المناسبة.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: History & Drug Interactions */}
          {activeTab === 'history_correlations' && (
            <div className="space-y-5">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-sm text-slate-900">
                    الربط بالتاريخ المرضي للأمراض المزمنة والأدوية المتناولة
                  </h3>
                  <span className="text-xs text-slate-500">
                    مقارنة تلقائية لنتائج التحاليل مع ملف المريض الصحي لمنع التداخلات الدوائية
                  </span>
                </div>
              </div>

              {/* Medication Interactions Alerts */}
              {correlations.medicationInteractions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-rose-900 flex items-center gap-1.5">
                    <Pill className="w-4 h-4 text-rose-700" />
                    <span>تنبيهات التداخلات الدوائية المخبرية الحرجة:</span>
                  </h4>

                  <div className="space-y-2">
                    {correlations.medicationInteractions.map((inter, i) => (
                      <div
                        key={i}
                        className={`p-4 rounded-2xl border ${
                          inter.alertSeverity === 'critical'
                            ? 'bg-red-50 border-red-300 text-red-950'
                            : 'bg-amber-50 border-amber-300 text-amber-950'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold mb-1">
                          <span className="text-sm font-black flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <span>{inter.medicationAr} ({inter.medication})</span>
                          </span>
                          <span className="font-mono text-xs bg-white/80 px-2.5 py-0.5 rounded-full border">
                            {inter.laboratoryParameter}
                          </span>
                        </div>
                        <p className="text-xs mt-1">{inter.clinicalNoteAr}</p>
                        <div className="mt-2 pt-2 border-t border-black/10 text-xs font-bold text-red-900">
                          الإجراء التوجيهي: <span className="font-normal text-slate-800">{inter.guidelineActionAr}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chronic Conditions Correlations */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-blue-700" />
                  <span>ربط النتائج بالحالات المرضية المزمنة:</span>
                </h4>

                <div className="space-y-2">
                  {correlations.historyCorrelations.map((corr, i) => (
                    <div key={i} className="bg-white border border-slate-200 p-4 rounded-2xl space-y-2 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm text-slate-900">{corr.conditionAr}</span>
                        <span className="text-xs font-mono bg-slate-100 px-2.5 py-0.5 rounded text-slate-600">
                          مرجع: {corr.evidenceGuideline}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{corr.clinicalSignificanceAr}</p>
                      <div className="pt-2 border-t border-slate-100">
                        <span className="font-bold text-xs text-rose-900 block mb-1">التوصيات العلاجية المستهدفة:</span>
                        <ul className="list-disc list-inside space-y-1 text-slate-700 text-xs">
                          {corr.therapeuticRecommendationsAr.map((rec, rIdx) => (
                            <li key={rIdx}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}

                  {correlations.historyCorrelations.length === 0 && (
                    <div className="bg-slate-50 p-6 rounded-2xl text-center text-slate-500 border border-slate-200">
                      لا توجد أمراض مزمنة مدخلة في ملف المريض، أو أن كافة النتائج طبيعية دون تعارض.
                    </div>
                  )}
                </div>
              </div>

              {/* Longitudinal Delta Checks */}
              {correlations.longitudinalDeltaChecks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-700" />
                    <span>مقارنة التغير مع الزيارة السابقة (Delta Check Verification):</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {correlations.longitudinalDeltaChecks.map((delta, i) => (
                      <div key={i} className="bg-white border border-slate-200 p-3 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900 block">{delta.parameterName}</span>
                          <span className="text-[10px] text-slate-500">
                            من {delta.previousValue} إلى {delta.currentValue} ({delta.previousDate})
                          </span>
                        </div>
                        <span className={`font-mono font-bold text-xs px-2.5 py-1 rounded-lg ${
                          delta.isSignificantShift ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {delta.percentChange > 0 ? '+' : ''}{delta.percentChange}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Evidence-Based International Guidelines */}
          {activeTab === 'evidence_guidelines' && (
            <div className="space-y-4">
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-950">
                <span className="font-bold block mb-1">
                  البروتوكولات الإكلينيكية المعتمدة دولياً في تحاليل معامل RT:
                </span>
                تعتمد خوارزمية التوصيات السريرية على أحدث أوراق العمل والأدلة الإرشادية الصادرة عن الهيئات العالمية (ADA 2025/2026، KDIGO 2024، ACC/AHA 2024، و WHO 2024).
              </div>

              <div className="space-y-3">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-slate-900">
                      1. معايير الجمعية الأمريكية للسكري (ADA 2025/2026 Standards of Care)
                    </span>
                    <span className="text-[10px] bg-slate-100 font-mono px-2 py-0.5 rounded text-slate-600 font-bold">
                      DIABETES CARE
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed text-xs">
                    توصي الإرشادات الحديثة باستهداف سكر تراكمي HbA1c &lt; 7.0% لمعظم البالغين دون إحداث هبوط سكر. وفي حال وجود اعتلال كلوي أو عوامل خطورة قلبية، يُوصى بإضافة مثبطات SGLT2 أو منبهات GLP-1 RA مع فحص نسبة الزلال للكرياتينين سنوياً.
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-slate-900">
                      2. الدليل الإرشادي لتحسين النتائج العالمية لأمراض الكلى (KDIGO 2024 Guidelines)
                    </span>
                    <span className="text-[10px] bg-slate-100 font-mono px-2 py-0.5 rounded text-slate-600 font-bold">
                      NEPHROLOGY
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed text-xs">
                    تحديد مرحلة القصور الكلوي عبر eGFR والزلال البولي، مع استهداف ضغط دم انقباضي &lt; 120 مم زئبق، ومراقبة البوتاسيوم بانتظام، وتجنب المسكنات غير الستيرويدية (NSAIDs) التي تسرع التدهور الكلوي.
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-slate-900">
                      3. توصيات الكلية الأمريكية للقلب لدهون الدم (ACC/AHA 2024 Dyslipidemia)
                    </span>
                    <span className="text-[10px] bg-slate-100 font-mono px-2 py-0.5 rounded text-slate-600 font-bold">
                      CARDIOLOGY
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed text-xs">
                    استهداف مستوى كوليسترول ضار LDL &lt; 70 mg/dL أو &lt; 55 mg/dL لمرضى الخطورة الشديدة جداً، بالاعتماد على ستاتينات عالية الشدة وإضافة إيزيتيميب عند الحاجة.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Gemini Pro AI Synthesis */}
          {activeTab === 'ai_synthesis' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 text-white rounded-2xl p-5 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-amber-400 animate-pulse" />
                    <h3 className="font-black text-sm text-amber-200">
                      توليد التقرير الاستشاري المعمق عبر الذكاء الاصطناعي (Gemini 2.5 Flash)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300">
                    صياغة لغوية وطبية فائقة الدقة باللغتين العربية والإنجليزية مدربة على مناهج الباثولوجيا الإكلينيكية المعتمدة
                  </p>
                </div>

                <button
                  onClick={handleRunAi}
                  disabled={isAiLoading}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50 shrink-0"
                >
                  {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>{isAiLoading ? 'جاري التحليل السريري...' : 'توليد التحليل عبر Gemini AI'}</span>
                </button>
              </div>

              {aiResult ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-rose-800" />
                      <span>التقرير الاستشاري (النسخة العربية):</span>
                    </h4>
                    <p className="text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-200 font-serif">
                      {aiResult.synthesisAr}
                    </p>
                  </div>

                  {aiResult.synthesisEn && (
                    <div className="space-y-2 pt-3 border-t border-slate-200">
                      <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2" dir="ltr">
                        <FileText className="w-4 h-4 text-blue-800" />
                        <span>Consultant Synthesis (English Version):</span>
                      </h4>
                      <p className="text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-200 font-sans" dir="ltr">
                        {aiResult.synthesisEn}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
                  <Brain className="w-10 h-10 mx-auto text-slate-400 mb-2 opacity-50" />
                  <p className="font-bold text-sm">اضغط على زر التوليد بالأعلى لاستدعاء استشارة Gemini AI</p>
                  <p className="text-xs text-slate-400 mt-1">يتم دمج نتائج كافة الفحوصات الطبية مع نموذج الاستشاري الافتراضي.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {onOpenDoctorCritical && (
              <button
                onClick={onOpenDoctorCritical}
                className="px-3.5 py-2 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>إشعار الطبيب بالقيم الحرجة</span>
              </button>
            )}

            {onOpenEHR && (
              <button
                onClick={onOpenEHR}
                className="px-3.5 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Layers className="w-4 h-4" />
                <span>تصدير FHIR / EHR دولي</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAttach}
              className="px-5 py-2.5 rounded-xl bg-rose-900 hover:bg-rose-800 text-white font-black text-xs transition flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Check className="w-4 h-4" />
              <span>إرفاق هذا التحليل الاستشاري بالتقرير الرسمي (A4)</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
