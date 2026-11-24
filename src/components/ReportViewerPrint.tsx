import React, { useState, useMemo, useRef, useEffect } from 'react';
import { DEFAULT_STAFF } from '../data/labCatalog';
import { LabReport, TestProfile } from '../types/lab';
import { formatReferenceDisplay } from '../utils/calculator';
import { ColouredRangeChart } from './ColouredRangeChart';
import { FlagBadge } from './FlagBadge';
import { exportReportToPPTX } from '../utils/pptxExport';
import { formatWhatsAppMessage, openWhatsApp } from '../utils/whatsapp';
import { downloadReportPDF, triggerPrintDialog } from '../utils/pdfExport';
import { openPrintReportWindow } from '../utils/printReportWindow';
import { buildReportPages, REPORT_CSS, fitReportPagesToSingleA4 } from '../utils/reportTemplate';
import { useApp } from '../context/AppContext';
import { ClientEditModal } from './ClientEditModal';
import { LabInfoEditModal } from './LabInfoEditModal';
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
  Sparkles,
  User,
  BarChart2,
  ClipboardList
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
  const { 
    labInfo, 
    updateLabInfo, 
    staffSignatures, 
    updateStaffSignatures, 
    updateReport,
    incomeRecords,
    updateIncomeRecord,
    loyaltyProfiles,
    loyaltyConfig,
    openPatientSheet
  } = useApp();
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isLabModalOpen, setIsLabModalOpen] = useState(false);
  const [showVisualChart, setShowVisualChart] = useState<boolean>(true);
  const [includeInvoice, setIncludeInvoice] = useState<boolean>(report.attachInvoiceToReport !== false);

  useEffect(() => {
    setIncludeInvoice(report.attachInvoiceToReport !== false);
  }, [report.id, report.attachInvoiceToReport]);

  const p = report.patient;
  const totalPages = report.profiles.length + (includeInvoice ? 1 : 0);
  const renderOptions = useMemo(() => ({
    includeInvoice,
    incomeRecords,
    loyaltyProfiles,
    loyaltyConfig
  }), [includeInvoice, incomeRecords, loyaltyProfiles, loyaltyConfig]);

  const safeReport = useMemo<LabReport>(() => {
    const nowIso = new Date().toISOString();
    return {
      ...report,
      attachInvoiceToReport: includeInvoice,
      patient: {
        ...report.patient,
        sampleDate: report.patient?.sampleDate || report.createdAt || nowIso,
        reportingDate: report.patient?.reportingDate || nowIso
      },
      staff: {
        ...DEFAULT_STAFF,
        ...staffSignatures,
        ...report.staff
      }
    };
  }, [report, staffSignatures, includeInvoice]);
  const staff = safeReport.staff;
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const runFit = () => {
      if (previewRef.current) {
        fitReportPagesToSingleA4(previewRef.current);
      }
    };
    const raf = requestAnimationFrame(runFit);
    const fontsReady = (document as any).fonts?.ready;
    if (fontsReady && typeof fontsReady.then === 'function') {
      fontsReady.then(() => requestAnimationFrame(runFit)).catch(() => {});
    }
    return () => cancelAnimationFrame(raf);
  }, [safeReport, labInfo, showVisualChart, includeInvoice, incomeRecords, loyaltyProfiles, loyaltyConfig]);

  const handleDownloadPDF = async () => {
    const nowIso = new Date().toISOString();
    try {
      updateReport(report.id, {
        patient: {
          ...report.patient,
          reportingDate: nowIso,
          sampleDate: report.patient?.sampleDate || report.createdAt || nowIso
        },
        updatedAt: nowIso
      });
    } catch {}
    try {
      setIsGeneratingPDF(true);
      await downloadReportPDF(safeReport, labInfo, showVisualChart, renderOptions);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      openPrintReportWindow(safeReport, labInfo, showVisualChart, renderOptions);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrint = () => {
    const nowIso = new Date().toISOString();
    try {
      updateReport(report.id, {
        patient: {
          ...report.patient,
          reportingDate: nowIso,
          sampleDate: report.patient?.sampleDate || report.createdAt || nowIso
        },
        updatedAt: nowIso
      });
    } catch {}
    try {
      openPrintReportWindow(safeReport, labInfo, showVisualChart, renderOptions);
    } catch {
      window.print();
    }
  };

  const handleWhatsApp = () => {
    const msg = formatWhatsAppMessage(safeReport, labInfo);
    openWhatsApp(p.phone, msg);
  };

  const handlePPTX = async () => {
    await exportReportToPPTX(safeReport, labInfo, showVisualChart);
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
            معاينة التقرير (A4): <strong className="text-white">{totalPages} صفحة</strong> {includeInvoice ? '(كل بروفايل في صفحة + الفاتورة بآخر صفحة)' : '(كل بروفايل في صفحة مستقلة)'}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
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

          {/* Visual Chart / CBC Dashboard Toggle */}
          <button
            type="button"
            onClick={() => setShowVisualChart(prev => !prev)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border transition-all ${
              showVisualChart
                ? 'bg-blue-600/30 text-blue-200 border-blue-500/60 shadow-sm'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="تفعيل أو إلغاء الرسم البياني ومؤشرات النتائج ومخطط الـ CBC"
          >
            <BarChart2 className={`w-3.5 h-3.5 ${showVisualChart ? 'text-blue-400' : 'text-slate-400'}`} />
            <span>{showVisualChart ? 'الرسم البياني: مفعل ✓' : 'الرسم البياني: معطل'}</span>
          </button>

          {/* Last-Page Official Invoice Toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !includeInvoice;
              setIncludeInvoice(next);
              try {
                updateReport(report.id, { attachInvoiceToReport: next });
              } catch {}
            }}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border transition-all ${
              includeInvoice
                ? 'bg-emerald-600/30 text-emerald-200 border-emerald-500/60 shadow-sm'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="تفعيل أو إخفاء فاتورة المريض الرسمية في الصفحة الأخيرة من التقرير"
          >
            <Receipt className={`w-3.5 h-3.5 ${includeInvoice ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span>{includeInvoice ? 'صفحة الفاتورة: مفعلة ✓' : 'صفحة الفاتورة: مخفية'}</span>
          </button>

          {/* Edit Client / Patient Data */}
          <button
            onClick={() => setIsClientModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 text-xs font-bold rounded-lg shadow-sm transition-all"
            title="تعديل وإضافة بيانات العميل / المريض في التقرير والفاتورة"
          >
            <User className="w-3.5 h-3.5 text-sky-400" />
            <span>بيانات العميل</span>
          </button>

          {/* Lab Info & Signatures Edit */}
          <button
            onClick={() => {
              if (onOpenLabInfoModal) onOpenLabInfoModal();
              else setIsLabModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 text-xs font-bold rounded-lg shadow-sm transition-all"
            title="تعديل بيانات المعمل والإمضاءات والهواتف والعنوان"
          >
            <Settings className="w-3.5 h-3.5 text-rose-400" />
            <span>بيانات المعمل والإمضاءات</span>
          </button>

          {/* Lab Bench Patient Sheet */}
          <button
            type="button"
            onClick={() => openPatientSheet(safeReport)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-rose-200 border border-slate-700 text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap shrink-0"
            title="طباعة ورقة عمل الحالة للكيميائي المختص داخل الوحدة (Patient Sheet A4)"
          >
            <ClipboardList className="w-3.5 h-3.5 text-rose-300" />
            <span>Patient Sheet</span>
          </button>

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
        <div
          ref={previewRef}
          className="rt-root"
          dangerouslySetInnerHTML={{ __html: buildReportPages(safeReport, labInfo, showVisualChart, renderOptions) }}
        />
      </div>

      {/* Edit Client Modal */}
      {isClientModalOpen && (
        <ClientEditModal
          isOpen={isClientModalOpen}
          onClose={() => setIsClientModalOpen(false)}
          patient={safeReport.patient}
          onSave={(updatedPatient) => {
            const nextStaff = {
              ...safeReport.staff,
              ...(updatedPatient.phlebotomist !== undefined ? { phlebotomist: updatedPatient.phlebotomist, showPhlebotomist: Boolean(updatedPatient.phlebotomist.trim()) } : {}),
              ...(updatedPatient.visitSpecialist !== undefined ? { visitCoordinator: updatedPatient.visitSpecialist, showVisitCoordinator: Boolean(updatedPatient.visitSpecialist.trim()) } : {})
            };
            updateReport(safeReport.id, { patient: updatedPatient, staff: nextStaff });
            const inv = incomeRecords.find(i => i.barcode === updatedPatient.barcode || i.labNumber === updatedPatient.labNumber || i.id === safeReport.invoiceId);
            if (inv) {
              updateIncomeRecord(inv.id, {
                patientName: updatedPatient.fullName,
                patientPhone: updatedPatient.phone,
                patientAge: updatedPatient.age,
                patientGender: updatedPatient.gender,
                referringDoctor: updatedPatient.referringDoctorName,
                visitSpecialist: updatedPatient.visitSpecialist
              });
            }
          }}
        />
      )}

      {/* Edit Lab Info Modal */}
      {isLabModalOpen && (
        <LabInfoEditModal
          isOpen={isLabModalOpen}
          onClose={() => setIsLabModalOpen(false)}
          labInfo={labInfo}
          onUpdateLabInfo={updateLabInfo}
          staffSignatures={staffSignatures}
          onUpdateStaffSignatures={updateStaffSignatures}
        />
      )}
    </div>
  );
};
