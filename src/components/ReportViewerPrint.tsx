import React, { useState } from 'react';
import { LabReport, TestProfile } from '../types/lab';
import { formatReferenceDisplay } from '../utils/calculator';
import { ColouredRangeChart } from './ColouredRangeChart';
import { FlagBadge } from './FlagBadge';
import { exportReportToPPTX } from '../utils/pptxExport';
import { formatWhatsAppMessage, openWhatsApp } from '../utils/whatsapp';
import { downloadReportPDF } from '../utils/pdfExport';
import { openPrintReportWindow } from '../utils/printReportWindow';
import { useApp } from '../context/AppContext';
import { generateSmartClinicalAnalysis } from '../utils/smartReportEngine';
import { 
  Printer, 
  Share2, 
  FileSpreadsheet, 
  ArrowRight, 
  ShieldCheck, 
  Settings, 
  Receipt, 
  Download, 
  Loader2, 
  Sparkles,
  Activity,
  Brain,
  Stethoscope,
  CheckCircle2,
  ShieldAlert,
  DollarSign,
  Users
} from 'lucide-react';

interface ReportViewerPrintProps {
  report: LabReport;
  onBackToEdit: () => void;
  onOpenInvoice?: () => void;
  onOpenLabInfoModal?: () => void;
  onOpenIllustrationsModal?: (profileId: string) => void;
  onOpenSmartReport?: () => void;
}

export const ReportViewerPrint: React.FC<ReportViewerPrintProps> = ({
  report,
  onBackToEdit,
  onOpenInvoice,
  onOpenLabInfoModal,
  onOpenIllustrationsModal,
  onOpenSmartReport
}) => {
  const { labInfo, updateReport } = useApp();
  const p = report.patient;
  const staff = report.staff || {
    labChemist: "د. هبة الشناوي",
    chemistTitle: "أخصائي الكيمياء الإكلينيكية",
    chemistLicense: "EGY-SCI-88402",
    verifiedBy: "د. مصطفى العوضي",
    verifierTitle: "إدارة ضبط الجودة والتشغيل",
    verifierLicense: "EGY-MGT-11024",
    pathologist: "أ.د. رامي مختار",
    pathologistTitle: "استشاري الباثولوجيا الإكلينيكية - قصر العيني",
    pathologistLicense: "EGY-MED-48201",
    financialDirector: "أ/ ماجد حسني الشرقاوي",
    financialTitle: "المدير المالي ورئيس الحسابات (CFO)",
    hrDirector: "أ/ أحمد فتحي الجمال",
    hrTitle: "مدير الموارد البشرية (HR Manager)",
    showFinancialSignature: true,
    showHrSignature: true
  };

  const isSmartReportActive = Boolean(report.smartReportEnabled);
  const smartAnalysis = React.useMemo(() => {
    return generateSmartClinicalAnalysis(report);
  }, [report]);

  const totalPages = report.profiles.length + (isSmartReportActive ? 1 : 0);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const toggleSmartReport = () => {
    if (!isSmartReportActive) {
      updateReport(report.id, {
        smartReportEnabled: true,
        smartReportClinicalData: smartAnalysis,
        smartReportInterpretation: smartAnalysis.executiveSummaryAr
      });
    } else {
      updateReport(report.id, {
        smartReportEnabled: false
      });
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      await downloadReportPDF(report);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      openPrintReportWindow(report, labInfo);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrint = () => {
    try {
      openPrintReportWindow(report, labInfo);
    } catch {
      window.print();
    }
  };

  const handleWhatsApp = () => {
    const msg = formatWhatsAppMessage(report, labInfo);
    openWhatsApp(p.phone, msg);
  };

  const handlePPTX = async () => {
    await exportReportToPPTX(report);
  };

  const formatDoctorDisplay = () => {
    if (p.referringDoctorTitle === 'Herself' || p.referringDoctorTitle === 'Himself') {
      return 'Self-Request (طلب فحص ذاتي)';
    }
    return `${p.referringDoctorTitle} ${p.referringDoctorName}`.trim() || 'General Medical Request';
  };

  // Determine active signatures to display
  const showFin = Boolean(staff.showFinancialSignature && staff.financialDirector);
  const showHr = Boolean(staff.showHrSignature && staff.hrDirector);

  // Render Official Signature Grid (supports Chemist, Verifier, Pathologist, Financial Director, HR Director)
  const renderSignaturesBlock = () => {
    return (
      <div className={`grid grid-cols-1 ${showFin || showHr ? 'sm:grid-cols-4 md:grid-cols-5' : 'sm:grid-cols-3'} gap-3 text-center mb-3`}>
        {/* 1. Lab CHEMIST */}
        <div className="space-y-0.5 bg-slate-50/50 p-2 rounded-lg border border-slate-100">
          <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wide">
            Lab CHEMIST
          </p>
          <div className="h-6 flex items-center justify-center">
            <span className="font-serif italic text-xs text-slate-500 font-bold tracking-wider">
              Approved / Chemist
            </span>
          </div>
          <p className="text-xs font-bold text-slate-900 truncate">
            {staff.labChemist || "د/ عمر فؤاد"}
          </p>
          <p className="text-[9.5px] text-slate-600 font-medium truncate">
            {staff.chemistTitle || 'أخصائي الكيمياء الإكلينيكية'}
          </p>
          {staff.chemistLicense && (
            <p className="text-[8.5px] text-slate-400 font-mono">
              {staff.chemistLicense}
            </p>
          )}
        </div>

        {/* 2. Verify by */}
        <div className="space-y-0.5 bg-slate-50/50 p-2 rounded-lg border border-slate-100">
          <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wide">
            Verify by
          </p>
          <div className="h-6 flex items-center justify-center">
            <span className="font-serif italic text-xs text-slate-500 font-bold tracking-wider">
              Quality Audit Verified
            </span>
          </div>
          <p className="text-xs font-bold text-slate-900 truncate">
            {staff.verifiedBy || "أ/ سارة الشربيني"}
          </p>
          <p className="text-[9.5px] text-slate-600 font-medium truncate">
            {staff.verifierTitle || 'إدارة ضبط الجودة والتشغيل'}
          </p>
          {staff.verifierLicense && (
            <p className="text-[8.5px] text-slate-400 font-mono">
              {staff.verifierLicense}
            </p>
          )}
        </div>

        {/* 3. Consultant Pathologist */}
        <div className="space-y-0.5 bg-rose-50/30 p-2 rounded-lg border border-rose-100">
          <p className="text-[10px] font-bold uppercase text-rose-950 tracking-wide">
            Consultant Pathologist
          </p>
          <div className="h-6 flex items-center justify-center">
            <div className="inline-block px-2 py-0.5 border border-dashed border-rose-800 rounded bg-rose-50/50">
              <span className="font-serif italic text-xs text-rose-900 font-black">
                Prof. Dr. Rami Mokhtar
              </span>
            </div>
          </div>
          <p className="text-xs font-bold text-rose-950 truncate">
            {staff.pathologist || "أ.د. رامي مختار"}
          </p>
          <p className="text-[9.5px] text-rose-900 font-medium truncate">
            {staff.pathologistTitle || 'استشاري الباثولوجيا الإكلينيكية - قصر العيني'}
          </p>
          {staff.pathologistLicense && (
            <p className="text-[8.5px] text-slate-400 font-mono">
              {staff.pathologistLicense}
            </p>
          )}
        </div>

        {/* 4. Financial Director (المدير المالي) */}
        {showFin && (
          <div className="space-y-0.5 bg-emerald-50/30 p-2 rounded-lg border border-emerald-100">
            <p className="text-[10px] font-bold uppercase text-emerald-950 tracking-wide flex items-center justify-center gap-1">
              <DollarSign className="w-2.5 h-2.5" />
              <span>Financial Director</span>
            </p>
            <div className="h-6 flex items-center justify-center">
              <span className="font-serif italic text-xs text-emerald-700 font-bold tracking-wider">
                Financial Audit
              </span>
            </div>
            <p className="text-xs font-bold text-emerald-950 truncate">
              {staff.financialDirector}
            </p>
            <p className="text-[9.5px] text-emerald-800 font-medium truncate">
              {staff.financialTitle || 'المدير المالي ورئيس الحسابات'}
            </p>
            {staff.financialLicense && (
              <p className="text-[8.5px] text-slate-400 font-mono">
                {staff.financialLicense}
              </p>
            )}
          </div>
        )}

        {/* 5. HR Director (مدير الـ HR) */}
        {showHr && (
          <div className="space-y-0.5 bg-purple-50/30 p-2 rounded-lg border border-purple-100">
            <p className="text-[10px] font-bold uppercase text-purple-950 tracking-wide flex items-center justify-center gap-1">
              <Users className="w-2.5 h-2.5" />
              <span>HR Director</span>
            </p>
            <div className="h-6 flex items-center justify-center">
              <span className="font-serif italic text-xs text-purple-700 font-bold tracking-wider">
                HR Certified
              </span>
            </div>
            <p className="text-xs font-bold text-purple-950 truncate">
              {staff.hrDirector}
            </p>
            <p className="text-[9.5px] text-purple-800 font-medium truncate">
              {staff.hrTitle || 'مدير الموارد البشرية'}
            </p>
            {staff.hrLicense && (
              <p className="text-[8.5px] text-slate-400 font-mono">
                {staff.hrLicense}
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  // Header component with STRICT Logo rule: Under logo is strictly "التشخيص الصحيح يبدأ معنا" without extra addition
  const renderHeader = () => (
    <div className="border-b-2 border-red-950 pb-4 mb-4">
      <div className="flex items-center justify-between gap-4">
        {/* Arabic credentials */}
        <div className="text-right flex-1 space-y-0.5">
          <h2 className="text-xl font-black text-rose-950 tracking-tight">
            معامل RT للتحاليل التشخيصية
          </h2>
          <h3 className="text-sm font-bold text-slate-800">
            معامل رامي مختار
          </h3>
          <p className="text-xs font-semibold text-rose-900">
            أطباء الباثولوجيا الإكلينيكية والكيميائية
          </p>
          <p className="text-xs text-slate-600 font-medium">
            كلية طب قصر العيني - جامعة القاهرة
          </p>
          <div className="text-[10px] text-slate-600 font-bold mt-1.5 pt-1 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-1">
            <span>📍 {labInfo?.mainAddress || 'ميدان بهتيم برج صيدلية العزبي الدور الثالث شبرا الخيمة'}</span>
            <span className="flex items-center gap-1.5">
              <span>📞 هاتف: <strong className="font-mono text-slate-900">{labInfo?.phone || '0244667788'}</strong></span>
              <span>| الخط الساخن: <strong className="font-mono text-rose-900">{labInfo?.hotline || labInfo?.whatsapp || '01012345678'}</strong></span>
            </span>
          </div>
        </div>

        {/* Central 3D Logo with STRICT rule:
            "تعديل لوجو المعمل فى البرنامج وكذلك فى التقارير وتحته التشخيص الصحيح يبدأ معنا بدون اى اضافه"
        */}
        <div className="flex flex-col items-center justify-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#800000] via-[#991b1b] to-[#0f172a] p-1 shadow-md flex items-center justify-center border border-red-300">
            <div className="w-full h-full rounded-xl bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden text-center">
              <div className="flex items-center justify-center leading-none">
                <span className="font-black text-2xl text-rose-500">R</span>
                <span className="text-rose-400 text-lg -mx-0.5">💧</span>
                <span className="font-black text-2xl text-slate-200">T</span>
              </div>
              <span className="text-[8px] font-extrabold tracking-widest text-slate-300 -mt-0.5">
                LABS
              </span>
            </div>
          </div>
          <span className="text-[10px] font-black text-rose-900 tracking-wide mt-1.5 whitespace-nowrap">
            التشخيص الصحيح يبدأ معنا
          </span>
        </div>

        {/* English credentials */}
        <div className="text-left flex-1 space-y-0.5" dir="ltr">
          <h2 className="text-xl font-black text-rose-950 tracking-tight">
            RT LAB LABORATORIES
          </h2>
          <h3 className="text-sm font-bold text-slate-800">
            Rami Mokhtar Laboratories
          </h3>
          <p className="text-xs font-semibold text-rose-900">
            Clinical & Chemical Pathologists
          </p>
          <p className="text-xs text-slate-600 font-medium">
            Kasr Al Ainy Faculty of Medicine
          </p>
        </div>
      </div>

      {/* Red & Navy dual accent line */}
      <div className="mt-3 flex h-1 w-full rounded-full overflow-hidden">
        <div className="w-3/4 bg-red-900"></div>
        <div className="w-1/4 bg-slate-900"></div>
      </div>
    </div>
  );

  // Patient Card
  const renderPatientCard = () => (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 mb-5 text-xs text-slate-800">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-2 gap-x-4">
        <div className="col-span-2">
          <span className="text-slate-500 font-medium ml-1">اسم المريض:</span>
          <strong className="text-slate-950 font-bold text-sm">{p.fullName}</strong>
        </div>

        <div className="text-left sm:text-right" dir="ltr">
          <span className="text-slate-500 font-medium mr-1">Lab No:</span>
          <strong className="text-rose-950 font-mono-numbers font-bold text-sm">{p.labNumber}</strong>
        </div>

        <div className="text-left" dir="ltr">
          <div className="font-mono text-[10px] tracking-widest bg-white border border-slate-300 px-2 py-0.5 rounded text-center inline-block">
            ||| | |||| | ||| {p.barcode}
          </div>
        </div>

        <div>
          <span className="text-slate-500 font-medium ml-1">السن / النوع:</span>
          <strong className="text-slate-900 font-semibold font-mono-numbers">
            {p.age} {p.ageUnit === 'years' ? 'سنة' : p.ageUnit === 'months' ? 'شهر' : 'يوم'}
          </strong>
          <span className="mx-1">/</span>
          <strong className="text-slate-900 font-semibold">
            {p.gender === 'male' ? 'ذكر (Male)' : 'أنثى (Female)'}
          </strong>
        </div>

        <div className="col-span-2">
          <span className="text-slate-500 font-medium ml-1">الطبيب المعالج:</span>
          <strong className="text-slate-900 font-semibold">{formatDoctorDisplay()}</strong>
        </div>

        <div dir="ltr" className="text-left sm:text-right">
          <span className="text-slate-500 font-medium mr-1">Tel / WA:</span>
          <span className="font-mono-numbers font-semibold text-slate-800">{p.phone}</span>
        </div>

        <div>
          <span className="text-slate-500 font-medium ml-1">تاريخ السحب:</span>
          <span className="font-mono-numbers text-slate-800">
            {new Date(p.sampleDate).toLocaleDateString('en-GB')}
          </span>
        </div>

        <div>
          <span className="text-slate-500 font-medium ml-1">تاريخ الإصدار:</span>
          <span className="font-mono-numbers text-slate-800">
            {new Date(p.reportingDate).toLocaleDateString('en-GB')}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Top Floating Control Bar (Hidden when printing) */}
      <div className="bg-slate-900 text-white rounded-xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3 no-print sticky top-28 z-40 border border-slate-700">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors border border-slate-700 cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة لشاشة التعديل</span>
          </button>

          <span className="text-slate-600">|</span>
          <span className="text-xs text-rose-300 font-semibold">
            معاينة التقرير (A4): <strong className="text-white">{totalPages} صفحة</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Smart Report Toggle Button */}
          <button
            onClick={toggleSmartReport}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer ${
              isSmartReportActive 
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40' 
                : 'bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700'
            }`}
            title="تضمين أو إخفاء التقرير الإكلينيكي الذكي في صفحات التقرير الطبي والـ PDF"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isSmartReportActive ? 'التقرير الذكي: مفعّل بالتقرير ✅' : 'إظهار التقرير الذكي بالتقرير 🤖'}</span>
          </button>

          {/* Open Smart Report Details Modal */}
          {onOpenSmartReport && (
            <button
              onClick={onOpenSmartReport}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
              title="تعديل وتخصيص تفاصيل التقرير الاستشاري الذكي"
            >
              <Brain className="w-3.5 h-3.5" />
              <span>مراجعة التقرير الذكي</span>
            </button>
          )}

          {/* WhatsApp Direct Send */}
          <button
            onClick={handleWhatsApp}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
            title="إرسال تنبيه واتساب مباشر للمريض"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>تنبيه واتساب</span>
          </button>

          {/* PowerPoint (.pptx) Export */}
          <button
            onClick={handlePPTX}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
            title="تصدير عرض تقديمي بوربوينت"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>PowerPoint</span>
          </button>

          {/* Lab Info & Signatures Edit */}
          {onOpenLabInfoModal && (
            <button
              onClick={onOpenLabInfoModal}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
              title="تعديل بيانات المعمل والإمضاءات والهواتف والعنوان"
            >
              <Settings className="w-3.5 h-3.5 text-rose-400" />
              <span>الإمضاءات</span>
            </button>
          )}

          {/* Invoice Button */}
          {onOpenInvoice && (
            <button
              onClick={onOpenInvoice}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
              title="عرض وطباعة فاتورة الفحص وإيصال السداد المالي"
            >
              <Receipt className="w-3.5 h-3.5 text-amber-400" />
              <span>الفاتورة</span>
            </button>
          )}

          {/* Paper Print */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg border border-slate-600 shadow-sm transition-all cursor-pointer"
            title="طباعة على طابعة ورقية"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة ورقية</span>
          </button>

          {/* Direct PDF File Download */}
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-red-800 to-rose-700 hover:from-red-700 hover:to-rose-600 text-white text-xs font-black rounded-lg shadow-lg shadow-red-950/40 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            {isGeneratingPDF ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>جاري التحميل...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>تحميل PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Pages Container:
          Each profile is rendered as an independent A4 styled page with page-break-after-profile in CSS print!
      */}
      <div className="space-y-8 print:space-y-0">
        {report.profiles.map((profile, pageIdx) => {
          const currentPageNum = pageIdx + 1;

          return (
            <div
              key={profile.id}
              style={{ backgroundColor: '#ffffff' }}
              className="report-page-container bg-white text-slate-900 border border-slate-300 shadow-md rounded-xl max-w-4xl mx-auto p-8 relative print:border-none print:shadow-none print:rounded-none print:p-0 page-break-after-profile min-h-[297mm] flex flex-col justify-between"
            >
              {/* Top Section */}
              <div>
                {renderHeader()}
                {renderPatientCard()}

                {/* Profile Header Title */}
                <div className="bg-slate-900 text-white px-4 py-2 rounded-t-lg flex items-center justify-between mb-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs bg-rose-900 text-rose-200 px-2 py-0.5 rounded font-bold">
                      {profile.profileCode || 'TEST'}
                    </span>
                    <h3 className="font-black text-sm text-white">
                      {profile.titleEn}
                    </h3>
                    <span className="text-slate-400 text-xs">·</span>
                    <h4 className="font-bold text-xs text-rose-200">
                      {profile.titleAr}
                    </h4>
                  </div>
                  <div className="flex items-center gap-3">
                    {onOpenIllustrationsModal && (
                      <button
                        type="button"
                        onClick={() => onOpenIllustrationsModal(profile.id)}
                        className="no-print text-[11px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 px-2.5 py-1 rounded-md font-bold flex items-center gap-1 transition cursor-pointer"
                        title="إرفاق أو تغيير رسم الأطلس الطبي لهذا التحليل"
                      >
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>{profile.attachedIllustration ? 'تغيير رسم الأطلس' : 'إرفاق رسم أطلس'}</span>
                      </button>
                    )}
                    <div className="text-[11px] text-slate-300 font-mono">
                      Sample: <strong className="text-white">{profile.sampleType || 'Serum / Whole Blood'}</strong>
                    </div>
                  </div>
                </div>

                {/* Parameters Table: Standard LTR Medical Order */}
                <div className="border border-slate-200 border-t-0 rounded-b-lg overflow-hidden mb-4" dir="ltr">
                  <table className="w-full text-left text-xs border-collapse" dir="ltr">
                    <thead className="bg-slate-100 text-slate-700 font-extrabold text-[11px] border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 text-left w-[34%]">Investigations (اسم الفحص)</th>
                        <th className="py-2.5 px-3 text-center w-[18%]">Results (النتيجة)</th>
                        <th className="py-2.5 px-2 text-center w-[16%]">Coloured Chart</th>
                        <th className="py-2.5 px-2 text-center w-[12%]">Flag (الحالة)</th>
                        <th className="py-2.5 px-3 text-left w-[20%]">Reference Range (المدى الطبيعي)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {profile.parameters.map((param, rIdx) => {
                        const isHigh = param.flag === 'HIGH' || param.flag === 'PANIC_HIGH';
                        const isLow = param.flag === 'LOW' || param.flag === 'PANIC_LOW';
                        const isAbnormal = isHigh || isLow || param.flag === 'ABNORMAL';

                        return (
                          <tr 
                            key={param.id} 
                            className={`transition-colors ${
                              isAbnormal ? 'bg-rose-50/50' : rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                            }`}
                          >
                            <td className="py-2.5 px-3 text-left">
                              <span className="font-bold text-slate-900 block">{param.name}</span>
                              {param.method && (
                                <span className="text-[9px] text-slate-400 font-mono block">Method: {param.method}</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center" dir="ltr">
                              <strong className={`font-mono text-sm ${
                                isHigh ? 'text-rose-700 font-black' : isLow ? 'text-amber-700 font-black' : 'text-slate-900'
                              }`}>
                                {param.result || '—'}
                              </strong>
                              {param.unit && (
                                <span className="text-[10px] text-slate-500 font-normal ml-1"> {param.unit}</span>
                              )}
                            </td>
                            <td className="py-2 px-1 text-center">
                              <ColouredRangeChart
                                result={param.result}
                                min={param.minNormal}
                                max={param.maxNormal}
                                flag={param.flag}
                              />
                            </td>
                            <td className="py-2 px-2 text-center">
                              <FlagBadge flag={param.flag} />
                            </td>
                            <td className="py-2.5 px-3 text-left font-mono text-[11px] text-slate-700" dir="ltr">
                              {formatReferenceDisplay(param)}
                              {param.notes && (
                                <span className="block text-[9px] text-slate-500 font-sans italic">{param.notes}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Blood Film Morphology section if present */}
                {profile.bloodFilmFindings && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4 text-xs">
                    <div className="font-bold text-rose-900 mb-1 border-b border-slate-200 pb-1">
                      🔬 فحص شريحة الدم المجهري (Peripheral Blood Film Morphology):
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      {profile.bloodFilmFindings.rbcMorphology && (
                        <div><strong>RBC Morphology:</strong> {profile.bloodFilmFindings.rbcMorphology}</div>
                      )}
                      {profile.bloodFilmFindings.wbcMorphology && (
                        <div><strong>WBC Morphology:</strong> {profile.bloodFilmFindings.wbcMorphology}</div>
                      )}
                      {profile.bloodFilmFindings.plateletMorphology && (
                        <div><strong>Platelets:</strong> {profile.bloodFilmFindings.plateletMorphology}</div>
                      )}
                      {profile.bloodFilmFindings.differentialSummary && (
                        <div><strong>Differential:</strong> {profile.bloodFilmFindings.differentialSummary}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Attached Disease Illustration / Atlas Diagram if any */}
                {profile.attachedIllustration ? (
                  <div className="bg-gradient-to-r from-rose-50/70 to-slate-50 border border-rose-200/90 rounded-xl p-3.5 mb-4 text-xs shadow-2xs">
                    <div className="flex flex-col sm:flex-row items-center gap-3.5">
                      {profile.attachedIllustration.imageUrl ? (
                        <div className="w-44 h-26 shrink-0 rounded-lg overflow-hidden border-2 border-rose-900/60 bg-slate-950 shadow-md relative flex items-center justify-center p-1">
                          <img
                            src={profile.attachedIllustration.imageUrl}
                            alt={profile.attachedIllustration.titleEn}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : null}
                      <div className="flex-1 space-y-1 text-right">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-rose-950 text-xs">
                            🔬 أطلس التشخيص الطبي: {profile.attachedIllustration.titleAr}
                          </span>
                          <span className="text-[10px] text-slate-500 font-serif italic" dir="ltr">
                            ({profile.attachedIllustration.titleEn})
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-700 leading-snug">
                          {profile.attachedIllustration.pathologySummaryAr || profile.attachedIllustration.descriptionAr}
                        </p>
                        {onOpenIllustrationsModal && (
                          <div className="no-print pt-1 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onOpenIllustrationsModal(profile.id)}
                              className="text-[10px] text-rose-800 hover:text-rose-950 font-bold underline cursor-pointer"
                            >
                              تغيير رسم الأطلس
                            </button>
                            <span className="text-slate-300">|</span>
                            <button
                              type="button"
                              onClick={() => {
                                const nextProfiles = report.profiles.map(pr => pr.id === profile.id ? { ...pr, attachedIllustration: undefined } : pr);
                                updateReport(report.id, { profiles: nextProfiles });
                              }}
                              className="text-[10px] text-red-600 hover:text-red-800 font-bold cursor-pointer"
                            >
                              إزالة الرسم
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* General Comment / Interpretation */}
                {profile.comment && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 mb-4 text-xs text-slate-800">
                    <strong className="text-rose-900 ml-1">ملاحظة وتعليق الفحص:</strong>
                    <span>{profile.comment}</span>
                  </div>
                )}
              </div>

              {/* Bottom Section: Official Signatures, Watermark, and Footer */}
              <div className="pt-4 border-t-2 border-slate-200 mt-auto avoid-break-inside">
                {renderSignaturesBlock()}

                {/* Footer Credentials & Page Number */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 font-semibold text-rose-950">
                      <ShieldCheck className="w-3.5 h-3.5 text-rose-800" />
                      RT LAB Diagnostic System
                    </span>
                    <span>·</span>
                    <span>كلية طب قصر العيني</span>
                    <span>·</span>
                    <span>هاتف: <strong className="font-mono text-slate-800">{labInfo?.phone || '0244667788'}</strong></span>
                  </div>

                  <div className="font-mono font-bold text-slate-600">
                    Report: {report.reportNumber} | Page {currentPageNum} of {totalPages}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* ========================================================
            DEDICATED OFFICIAL SMART REPORT PAGE (A4)
            Shown when user requests it or toggles it!
            ======================================================== */}
        {isSmartReportActive && (
          <div
            style={{ backgroundColor: '#ffffff' }}
            className="report-page-container bg-white text-slate-900 border border-slate-300 shadow-md rounded-xl max-w-4xl mx-auto p-8 relative print:border-none print:shadow-none print:rounded-none print:p-0 page-break-after-profile min-h-[297mm] flex flex-col justify-between"
          >
            {/* Top Section */}
            <div>
              {renderHeader()}
              {renderPatientCard()}

              {/* Smart Report Banner */}
              <div className="bg-gradient-to-r from-red-950 via-rose-900 to-slate-900 text-white px-4 py-2.5 rounded-lg flex items-center justify-between mb-4 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-amber-300">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-white flex items-center gap-2">
                      <span>التقرير الإكلينيكي الذكي والتحليل الاستشاري التلقائي</span>
                      <span className="text-[10px] bg-rose-600 px-2 py-0.5 rounded-full font-mono">
                        RT Clinical Intelligence
                      </span>
                    </h3>
                    <p className="text-[11px] text-rose-200">
                      تقييم شامل لسلامة الأعضاء الحيوية والمؤشرات السريرية المحسوبة والتوصيات الاستشارية
                    </p>
                  </div>
                </div>
                <div className="text-[11px] font-mono text-rose-200 bg-black/30 px-2.5 py-1 rounded">
                  AI Confirmed Analysis
                </div>
              </div>

              {/* Critical Alerts Banner (if any) */}
              {smartAnalysis.criticalAlerts.length > 0 && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-300 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-rose-900 text-xs">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>تنبيهات القيم الحرجة والاستدعاء السريري:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {smartAnalysis.criticalAlerts.map((alt, idx) => (
                      <div key={idx} className="bg-white p-2 rounded-lg border border-rose-200 text-xs">
                        <strong className="text-rose-950 block">{alt.titleAr}</strong>
                        <p className="text-rose-800 text-[11px]">{alt.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vital Organ Health Scores */}
              <div className="mb-4 bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-rose-600" />
                  <span>مؤشرات كفاءة وسلامة الأعضاء الحيوية (Vital Organ Health Scores):</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { label: 'وظائف الكلى', data: smartAnalysis.organScores.renal },
                    { label: 'وظائف الكبد', data: smartAnalysis.organScores.hepatic },
                    { label: 'الأيض والسكر', data: smartAnalysis.organScores.metabolic },
                    { label: 'مؤشرات الدم', data: smartAnalysis.organScores.hematologic },
                    { label: 'صحة القلب والدهون', data: smartAnalysis.organScores.cardiac },
                  ].map((org, i) => {
                    const isTested = org.data.status !== 'not_tested';
                    return (
                      <div key={i} className={`p-2.5 rounded-lg border text-center space-y-1 ${isTested ? 'bg-white border-slate-200' : 'bg-slate-100/70 border-slate-200 opacity-60'}`}>
                        <div className="text-[10.5px] font-bold text-slate-700">{org.label}</div>
                        <div className="text-lg font-black font-mono text-rose-900">
                          {isTested ? `${org.data.score}%` : '—'}
                        </div>
                        <div className="text-[9.5px] font-semibold text-slate-600">{org.data.labelAr}</div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          {isTested ? (
                            <div 
                              className={`h-full ${org.data.status === 'optimal' ? 'bg-emerald-500' : org.data.status === 'critical' ? 'bg-rose-600' : 'bg-amber-500'}`}
                              style={{ width: `${org.data.score}%` }}
                            />
                          ) : (
                            <div className="h-full bg-slate-300 w-0" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Calculated Clinical Indices */}
              {smartAnalysis.calculatedIndices.length > 0 && (
                <div className="mb-4 bg-white border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Brain className="w-4 h-4 text-indigo-600" />
                    <span>المعادلات والمؤشرات الإكلينيكية المحسوبة تلقائياً:</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {smartAnalysis.calculatedIndices.map((idx, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                        <div className="font-bold text-slate-900">{idx.nameAr}</div>
                        <div className="text-base font-mono font-black text-rose-900">{idx.value}</div>
                        <div className="text-[9.5px] text-slate-500">المرجع: {idx.reference}</div>
                        <p className="text-[10.5px] text-slate-700 font-medium pt-1 border-t border-slate-200/60 leading-tight">
                          {idx.interpretationAr}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Differential Diagnoses & Recommendations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {/* Differential Diagnoses */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-emerald-600" />
                    <span>التشخيص التفريقي المقترح:</span>
                  </h4>
                  {smartAnalysis.differentialDiagnoses.length > 0 ? (
                    <div className="space-y-1.5">
                      {smartAnalysis.differentialDiagnoses.map((diag, i) => (
                        <div key={i} className="bg-white p-2 rounded-lg border border-slate-200 text-xs">
                          <strong className="text-emerald-950 block">{diag.diseaseAr}</strong>
                          <p className="text-slate-600 text-[10.5px]">{diag.rationaleAr}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">لا توجد دلالات لمرض مزمن نوعي نشط؛ الفحوصات مستقرة.</p>
                  )}
                </div>

                {/* Consultant Recommendations */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-rose-600" />
                    <span>توصيات الاستشاري والخطوات التالية:</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {smartAnalysis.consultantRecommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-1.5 bg-white p-1.5 rounded-lg border border-slate-200">
                        <span className="w-3.5 h-3.5 rounded-full bg-rose-100 text-rose-900 font-bold flex items-center justify-center text-[9px] shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="leading-snug text-[11px]">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Executive Clinical Summary */}
              <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-3 mb-4 text-xs">
                <strong className="text-rose-950 font-bold block mb-1">
                  الخلاصة الطبية الاستشارية الشاملة:
                </strong>
                <p className="text-slate-800 leading-relaxed text-[11.5px]">
                  {smartAnalysis.executiveSummaryAr}
                </p>
              </div>
            </div>

            {/* Signatures & Footer on Smart Report Page */}
            <div className="pt-4 border-t-2 border-slate-200 mt-auto avoid-break-inside">
              {renderSignaturesBlock()}

              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-rose-950">
                    RT LAB AI Diagnostic Report • معتمد إكلينيكياً
                  </span>
                  <span>·</span>
                  <span>أ.د. رامي مختار - كلية طب قصر العيني</span>
                </div>
                <div className="font-mono font-bold text-slate-600">
                  Report: {report.reportNumber} | Page {totalPages} of {totalPages}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
