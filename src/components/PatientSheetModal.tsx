import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ClipboardList,
  Printer,
  Download,
  Save,
  X,
  Check,
  Loader2,
  UserCheck,
  Calendar,
  FlaskConical,
  FileText
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  PATIENT_SHEET_CSS,
  buildPatientSheetDocument,
  buildPatientSheetInnerHtml,
  formatSheetDateTime,
  printPatientSheetA4
} from '../utils/patientSheetTemplate';

const LAB_UNITS = [
  'العمل المعملي الشامل (كافة الوحدات)',
  'وحدة الكيمياء الإكلينيكية والهرمونات',
  'وحدة أمراض الدم والسيولة (Hematology & Coag)',
  'وحدة المناعة والفيروسات ودلالات الأورام',
  'وحدة الفحص المجهري والمزارع (Urine / Stool / Culture)'
];

export const PatientSheetModal: React.FC = () => {
  const {
    patientSheetReport,
    closePatientSheet,
    updateReport,
    labInfo,
    staffMembers,
    staffSignatures,
    currentUser
  } = useApp();

  const chemistsTeam = useMemo(
    () =>
      (staffMembers || []).filter(
        s => s.isActive && (s.role === 'chemist' || s.role === 'pathologist' || s.role === 'verifier')
      ),
    [staffMembers]
  );

  const [unitName, setUnitName] = useState(LAB_UNITS[0]);
  const [assignedChemist, setAssignedChemist] = useState('');
  const [handoverBy, setHandoverBy] = useState('');
  const [sampleDateText, setSampleDateText] = useState('');
  const [expectedDeliveryText, setExpectedDeliveryText] = useState('');
  const [handoverDateText, setHandoverDateText] = useState('');
  const [benchNotes, setBenchNotes] = useState('');
  const [viewMode, setViewMode] = useState<'detailed' | 'summary'>('detailed');
  const [includeExistingResults, setIncludeExistingResults] = useState(false);
  const [extraBlankRows, setExtraBlankRows] = useState<number>(2);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!patientSheetReport) return;
    const p = patientSheetReport.patient;
    const meta = patientSheetReport.patientSheetMeta || {};

    const defaultUnit =
      meta.unitName ||
      (patientSheetReport.profiles.length === 1 && patientSheetReport.profiles[0]?.category
        ? `وحدة ${patientSheetReport.profiles[0].category}`
        : LAB_UNITS[0]);

    const defaultChemist =
      meta.assignedChemist ??
      patientSheetReport.staff?.labChemist ??
      staffSignatures?.labChemist ??
      chemistsTeam[0]?.name ??
      '';

    const defaultHandover =
      meta.handoverBy ||
      p.visitSpecialist ||
      p.branchRepresentative ||
      currentUser?.nameAr ||
      currentUser?.nameEn ||
      '';

    const defaultSample = formatSheetDateTime(p.sampleDate || patientSheetReport.createdAt || new Date().toISOString());
    const defaultDelivery =
      meta.expectedDeliveryDate ||
      (p.reportingDate
        ? formatSheetDateTime(p.reportingDate)
        : formatSheetDateTime(new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()));
    const defaultHandoverDate = meta.handoverDate || formatSheetDateTime(new Date().toISOString());

    setUnitName(defaultUnit);
    setAssignedChemist(defaultChemist);
    setHandoverBy(defaultHandover);
    setSampleDateText(defaultSample);
    setExpectedDeliveryText(defaultDelivery);
    setHandoverDateText(defaultHandoverDate);
    setBenchNotes(meta.benchNotes || p.sampleNotes || '');
    setViewMode('detailed');
    setIncludeExistingResults(false);
    setExtraBlankRows(2);
    setStatusNotice(null);
  }, [patientSheetReport?.id]);

  const sheetOptions = useMemo(() => {
    if (!patientSheetReport) return null;
    return {
      report: patientSheetReport,
      labInfo,
      unitName,
      assignedChemist,
      handoverBy,
      sampleDateText,
      expectedDeliveryText,
      handoverDateText,
      benchNotes,
      viewMode,
      includeExistingResults,
      parameterNotes: patientSheetReport.patientSheetMeta?.parameterNotes,
      extraBlankRows
    };
  }, [
    patientSheetReport,
    labInfo,
    unitName,
    assignedChemist,
    handoverBy,
    sampleDateText,
    expectedDeliveryText,
    handoverDateText,
    benchNotes,
    viewMode,
    includeExistingResults,
    extraBlankRows
  ]);

  const innerHtml = useMemo(() => {
    if (!sheetOptions) return '';
    return buildPatientSheetInnerHtml(sheetOptions);
  }, [sheetOptions]);

  if (!patientSheetReport || !sheetOptions) return null;

  const persistSheetMeta = (silent = false) => {
    updateReport(patientSheetReport.id, {
      patientSheetMeta: {
        ...(patientSheetReport.patientSheetMeta || {}),
        unitName,
        assignedChemist,
        handoverBy,
        handoverDate: handoverDateText,
        expectedDeliveryDate: expectedDeliveryText,
        benchNotes
      },
      staff: {
        ...patientSheetReport.staff,
        labChemist: assignedChemist || patientSheetReport.staff?.labChemist || 'د/ عمر فؤاد القاضي'
      },
      updatedAt: new Date().toISOString()
    });
    if (!silent) {
      setStatusNotice('تم حفظ بيانات التسليم والكيميائي المختص على ملف الحالة بنجاح.');
      setTimeout(() => setStatusNotice(null), 3500);
    }
  };

  const handlePrintA4 = () => {
    persistSheetMeta(true);
    const fullDoc = buildPatientSheetDocument(sheetOptions);
    printPatientSheetA4(fullDoc);
    setStatusNotice('تم تجهيز نسخة الطباعة A4 للوحدة المخبرية.');
    setTimeout(() => setStatusNotice(null), 3000);
  };

  const handleDownloadPdf = async () => {
    if (!previewRef.current) return;
    persistSheetMeta(true);
    try {
      setIsExportingPdf(true);
      const { default: html2canvas } = await import('html2canvas');
      const { default: jsPDF } = await import('jspdf');

      const targetEl = previewRef.current.querySelector('.ps-sheet') as HTMLElement | null;
      if (!targetEl) return;

      const canvas = await html2canvas(targetEl, {
        scale: 2.2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pdfWidth = 210;
      const pdfHeight = 297;
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const imgData = canvas.toDataURL('image/jpeg', 0.96);

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      while (heightLeft > 2) {
        position = heightLeft - imgHeight;
        pdf.addPage('a4', 'portrait');
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }

      const safeName = (patientSheetReport.patient.fullName || 'Patient').trim().replace(/\s+/g, '_');
      pdf.save(`Patient_Sheet_${safeName}_${patientSheetReport.patient.labNumber}.pdf`);
      setStatusNotice('تم تحميل ملف Patient Sheet بصيغة PDF (A4) بنجاح.');
      setTimeout(() => setStatusNotice(null), 3500);
    } catch {
      handlePrintA4();
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[75] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:hidden"
      dir="rtl"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden">
        {/* Top Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-900/60 border border-rose-700/60 flex items-center justify-center text-rose-200">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-black text-white">
                  ورقة عمل الحالة بالوحدة المخبرية (Patient Sheet · A4)
                </h2>
                <span className="font-mono tabular-nums text-xs font-bold text-rose-200">
                  {patientSheetReport.patient.labNumber}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {patientSheetReport.patient.fullName} · {patientSheetReport.profiles.length} بروفايل · جاهزة للطباعة A4 وتسليمها للكيميائي المختص
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => persistSheetMeta(false)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Save className="w-3.5 h-3.5 text-emerald-400" />
              <span>حفظ بيانات التسليم</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-200 border border-slate-700 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              {isExportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>تحميل PDF (A4)</span>
            </button>

            <button
              type="button"
              onClick={handlePrintA4}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-800 hover:bg-rose-700 text-white text-xs font-black transition-colors cursor-pointer shadow-sm whitespace-nowrap shrink-0"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة Patient Sheet (A4)</span>
            </button>

            <button
              type="button"
              onClick={closePatientSheet}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {statusNotice && (
          <div className="px-5 py-2 bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusNotice}</span>
          </div>
        )}

        {/* Modal Body: Controls + Live A4 Preview */}
        <div className="flex-1 overflow-y-auto bg-slate-100 p-4 space-y-4">
          {/* Controls Panel */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5 text-rose-700" />
                  <span>الوحدة المختصة بالعمل:</span>
                </label>
                <div className="flex flex-col gap-1.5">
                  <select
                    value={LAB_UNITS.includes(unitName) ? unitName : '__custom__'}
                    onChange={(e) => {
                      if (e.target.value !== '__custom__') setUnitName(e.target.value);
                    }}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800"
                  >
                    {LAB_UNITS.map(u => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                    <option value="__custom__">كتابة اسم وحدة أخرى...</option>
                  </select>
                  <input
                    type="text"
                    value={unitName}
                    onChange={(e) => setUnitName(e.target.value)}
                    placeholder="اسم الوحدة المخبرية"
                    className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-rose-700" />
                  <span>الكيميائي المختص المستلم داخل الوحدة:</span>
                </label>
                <div className="flex flex-col gap-1.5">
                  <select
                    value={
                      assignedChemist === ''
                        ? '__blank__'
                        : chemistsTeam.some(c => c.name === assignedChemist)
                        ? assignedChemist
                        : '__custom__'
                    }
                    onChange={(e) => {
                      if (e.target.value === '__blank__') setAssignedChemist('');
                      else if (e.target.value !== '__custom__') setAssignedChemist(e.target.value);
                    }}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800"
                  >
                    <option value="__blank__">ترك الخانة فارغة للكتابة والتوقيع باليد</option>
                    {chemistsTeam.map(c => (
                      <option key={c.id} value={c.name}>
                        {c.name} — {c.title}
                      </option>
                    ))}
                    <option value="__custom__">اسم كيميائي آخر...</option>
                  </select>
                  <input
                    type="text"
                    value={assignedChemist}
                    onChange={(e) => setAssignedChemist(e.target.value)}
                    placeholder="اكتب اسم الكيميائي أو اتركه فارغاً للتوقيع اليدوي"
                    className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-600" />
                  <span>المُسلِّم للوحدة (الاستقبال / السحب):</span>
                </label>
                <input
                  type="text"
                  value={handoverBy}
                  onChange={(e) => setHandoverBy(e.target.value)}
                  placeholder="اسم القائم بتسليم العينة والشيت"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800"
                />
                <div className="mt-1.5 flex items-center gap-2">
                  <label className="text-[11px] font-bold text-slate-500 whitespace-nowrap">صفوف إضافية فارغة:</label>
                  <input
                    type="number"
                    min={0}
                    max={8}
                    value={extraBlankRows}
                    onChange={(e) => setExtraBlankRows(Math.max(0, Math.min(8, Number(e.target.value) || 0)))}
                    className="w-16 p-1 bg-white border border-slate-300 rounded text-center font-mono text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-600" />
                  <span>تاريخ ووقت سحب العينة:</span>
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={sampleDateText}
                  onChange={(e) => setSampleDateText(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-rose-700" />
                  <span>تاريخ وموعد الاستلام المتوقع:</span>
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={expectedDeliveryText}
                  onChange={(e) => setExpectedDeliveryText(e.target.value)}
                  className="w-full p-2 bg-rose-50/50 border border-rose-300 rounded-lg font-mono text-xs font-bold text-rose-950"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-600" />
                  <span>تاريخ التسليم للوحدة:</span>
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={handoverDateText}
                  onChange={(e) => setHandoverDateText(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs font-bold text-slate-800"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setViewMode('detailed')}
                    className={`px-3 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                      viewMode === 'detailed' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    تفصيلي بكل بارامترات التحاليل
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('summary')}
                    className={`px-3 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                      viewMode === 'summary' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ملخص بالبروفايلات والفحوصات
                  </button>
                </div>

                <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeExistingResults}
                    onChange={(e) => setIncludeExistingResults(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-700"
                  />
                  <span>إظهار النتائج المسجلة حالياً (أو إغلاقها لترك خانة النتيجة فارغة للكتابة اليدوية)</span>
                </label>
              </div>

              <div className="w-full lg:w-96">
                <input
                  type="text"
                  value={benchNotes}
                  onChange={(e) => setBenchNotes(e.target.value)}
                  placeholder="ملاحظات مسبقة للوحدة (تخفيف / عينة صائمة / استعجال...) أو تُترك فارغة"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Live A4 Sheet Preview */}
          <div className="overflow-x-auto pb-4">
            <style>{PATIENT_SHEET_CSS}</style>
            <div
              ref={previewRef}
              className="mx-auto shadow-xl border border-slate-300 bg-white"
              style={{ width: '210mm', minHeight: '297mm' }}
              dangerouslySetInnerHTML={{ __html: innerHtml }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
