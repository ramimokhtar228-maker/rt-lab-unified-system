import React, { useState, useMemo } from 'react';
import { DEFAULT_STAFF } from '../data/labCatalog';
import { LabReport, TestProfile } from '../types/lab';
import { formatReferenceDisplay } from '../utils/calculator';
import { ColouredRangeChart } from './ColouredRangeChart';
import { FlagBadge } from './FlagBadge';
import { exportReportToPPTX } from '../utils/pptxExport';
import { formatWhatsAppMessage, openWhatsApp } from '../utils/whatsapp';
import { downloadReportPDF, triggerPrintDialog } from '../utils/pdfExport';
import { openPrintReportWindow } from '../utils/printReportWindow';
import { buildReportPages, REPORT_CSS } from '../utils/reportTemplate';
import { useApp } from '../context/AppContext';
import { 
  Printer, 
  Share2, 
  FileSpreadsheet, 
  ArrowRight, 
  ShieldCheck, 
  QrCode, 
  Award,
  PhoneCall,
  MapPin,
  Download,
  Loader2,
  Receipt,
  Settings,
  Microscope,
  Sparkles
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
  const { labInfo } = useApp();
  const p = report.patient;
  const totalPages = report.profiles.length;
  const safeReport = useMemo<LabReport>(() => ({
    ...report,
    staff: {
      ...DEFAULT_STAFF,
      ...labInfo?.staffSignatures,
      ...report.staff
    }
  }), [report, labInfo]);
  const staff = safeReport.staff;
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      await downloadReportPDF(safeReport, labInfo);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      openPrintReportWindow(safeReport, labInfo);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrint = () => {
    try {
      openPrintReportWindow(safeReport, labInfo);
    } catch {
      window.print();
    }
  };

  const handleWhatsApp = () => {
    const msg = formatWhatsAppMessage(safeReport, labInfo);
    openWhatsApp(p.phone, msg);
  };

  const handlePPTX = async () => {
    await exportReportToPPTX(safeReport, labInfo);
  };

  const formatDoctorDisplay = () => {
    if (p.referringDoctorTitle === 'Herself' || p.referringDoctorTitle === 'Himself') {
      return 'Self-Request (طلب فحص ذاتي)';
    }
    return `${p.referringDoctorTitle} ${p.referringDoctorName}`.trim() || 'General Medical Request';
  };

  return (
    <div className="space-y-6">
      {/* Top Floating Control Bar (Hidden when printing) */}
      <div className="bg-slate-900 text-white rounded-xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3 no-print sticky top-28 z-40 border border-slate-700">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors border border-slate-700"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة لشاشة التعديل</span>
          </button>

          <span className="text-slate-600">|</span>
          <span className="text-xs text-rose-300 font-semibold">
            معاينة التقرير (A4): <strong className="text-white">{totalPages} صفحة</strong> (كل بروفايل في صفحة مستقلة)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* WhatsApp Direct Send */}
          <button
            onClick={handleWhatsApp}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
            title="إرسال تنبيه واتساب مباشر للمريض"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>تنبيه واتساب</span>
          </button>

          {/* PowerPoint (.pptx) Export */}
          <button
            onClick={handlePPTX}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
            title="تصدير عرض تقديمي بوربوينت"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>تصدير PowerPoint</span>
          </button>

          {/* Lab Info & Signatures Edit */}
          {onOpenLabInfoModal && (
            <button
              onClick={onOpenLabInfoModal}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 text-xs font-bold rounded-lg shadow-sm transition-all"
              title="تعديل بيانات المعمل والإمضاءات والهواتف والعنوان"
            >
              <Settings className="w-3.5 h-3.5 text-rose-400" />
              <span>بيانات المعمل والإمضاءات</span>
            </button>
          )}

          {/* Invoice Button */}
          {onOpenInvoice && (
            <button
              onClick={onOpenInvoice}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold rounded-lg shadow-sm transition-all"
              title="عرض وطباعة فاتورة الفحص وإيصال السداد المالي"
            >
              <Receipt className="w-3.5 h-3.5 text-amber-400" />
              <span>الفاتورة المالية</span>
            </button>
          )}

          {/* Paper Print */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg border border-slate-600 shadow-sm transition-all"
            title="طباعة على طابعة ورقية"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة ورقية</span>
          </button>

          {/* Direct PDF File Download */}
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-red-800 to-rose-700 hover:from-red-700 hover:to-rose-600 text-white text-xs font-black rounded-lg shadow-lg shadow-red-950/40 transition-all active:scale-98 disabled:opacity-50"
          >
            {isGeneratingPDF ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>جاري إنشاء وتنزيل الـ PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>تحميل ملف PDF (مباشر)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Pages Container:
          As requested by user: "كل بروفايل فى صفحه"
          Each profile is rendered as an independent A4 styled page with page-break-after-profile in CSS print!
      */}
      <div className="overflow-x-auto rounded-xl bg-slate-200 p-3 print:p-0">
        <style>{REPORT_CSS}</style>
        <div className="rt-root" dangerouslySetInnerHTML={{ __html: buildReportPages(safeReport, labInfo) }} />
      </div>
    </div>
  );
};
