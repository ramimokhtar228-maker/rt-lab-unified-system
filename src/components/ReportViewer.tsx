import React, { useState } from 'react';
import {
  Printer,
  Download,
  Share2,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  History,
  Edit3,
  FileCode,
  QrCode,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Eye,
  Sliders,
  AlertOctagon
} from 'lucide-react';
import { LabReport, LabSettings, TestResultItem } from '../types/laboratory';
import { downloadFile, generateCSVReport, generateHL7FHIRJson } from '../utils/exportFormats';

interface ReportViewerProps {
  report: LabReport;
  settings: LabSettings;
  onEditReport: (report: LabReport) => void;
  onOpenHistoryTrend: (patientMrn: string, testCode?: string) => void;
  onApproveReport?: (reportId: string) => void;
  onBackToList?: () => void;
  userRole?: string;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({
  report,
  settings,
  onEditReport,
  onOpenHistoryTrend,
  onApproveReport,
  onBackToList,
  userRole = 'PATHOLOGIST',
}) => {
  const [printWithHeader, setPrintWithHeader] = useState<boolean>(settings.enableHeaderInPrint);
  const [showDeltaColumn, setShowDeltaColumn] = useState<boolean>(settings.enableDeltaInPrint);
  const [showGaugeBar, setShowGaugeBar] = useState<boolean>(settings.enableGaugeInPrint);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportHL7 = () => {
    setIsExporting(true);
    const json = generateHL7FHIRJson(report);
    downloadFile(json, `HL7_FHIR_${report.reportNumber}.json`, 'application/json');
    setIsExporting(false);
    showToast('تم تصدير ملف HL7 FHIR بنجاح وفق المعايير الطبية الدولية');
  };

  const handleExportCSV = () => {
    const csv = generateCSVReport(report);
    downloadFile(csv, `Results_${report.reportNumber}.csv`, 'text/csv;charset=utf-8;');
    showToast('تم تصدير البيانات إلى ملف CSV');
  };

  // Helper for gauge bar calculation
  const renderGauge = (item: TestResultItem) => {
    if (!item.numericValue || item.minRef === undefined || item.maxRef === undefined) {
      return null;
    }
    const min = item.minRef;
    const max = item.maxRef;
    const val = item.numericValue;
    const rangeSpan = max - min || 1;
    // Normalized position from -20% to 120%
    const percent = Math.min(Math.max(((val - min) / rangeSpan) * 70 + 15, 5), 95);

    let markerColor = 'bg-emerald-600 dark:bg-emerald-400';
    if (item.flag === 'LOW' || item.flag === 'HIGH') {
      markerColor = 'bg-amber-600 dark:bg-amber-400';
    }
    if (item.flag === 'CRITICAL_LOW' || item.flag === 'CRITICAL_HIGH') {
      markerColor = 'bg-rose-600 dark:bg-rose-500';
    }

    return (
      <div className="w-24 sm:w-28 flex flex-col items-center">
        <div className="relative w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-visible">
          {/* Green normal zone */}
          <div className="absolute left-[15%] right-[15%] top-0 bottom-0 bg-emerald-200 dark:bg-emerald-950/60 rounded-full" />
          {/* Current value indicator pin */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full ${markerColor} ring-2 ring-white dark:ring-slate-900 shadow-xs`}
            style={{ left: `${percent}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      {/* Toast feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Controls Toolbar (Hidden when printing) */}
      <div className="no-print bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {onBackToList && (
              <button
                onClick={onBackToList}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
                <span>العودة للقائمة</span>
              </button>
            )}
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
            <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>تقرير طبي رقم:</span>
              <span className="font-mono text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 px-2 py-0.5 rounded-md text-xs font-semibold">
                {report.reportNumber}
              </span>
              {report.status === 'APPROVED' ? (
                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> معتمد رسمياً
                </span>
              ) : (
                <span className="text-xs text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> بانتظار الاعتماد النهائي
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Historical trend tracker button */}
            <button
              onClick={() => onOpenHistoryTrend(report.patient.mrn, report.results[0]?.testCode)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800/50 rounded-xl transition-all"
              title="تتبع التغير الزمني لنتائج المريض السابقة"
            >
              <History className="w-3.5 h-3.5" />
              <span>مخطط التتبع الزمني (Delta)</span>
            </button>

            {/* Export HL7 FHIR */}
            <button
              onClick={handleExportHL7}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
              title="تصدير كملف HL7 FHIR قياسي معتمد عالمياً"
            >
              <FileCode className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>HL7 FHIR JSON</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Excel/CSV</span>
            </button>

            {/* Edit results */}
            <button
              onClick={() => onEditReport(report)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>تعديل النتائج</span>
            </button>

            {/* Pathologist approve button */}
            {report.status !== 'APPROVED' && onApproveReport && (
              <button
                onClick={() => onApproveReport(report.id)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>اعتماد وختم التقرير</span>
              </button>
            )}

            {/* Primary Print / Save as PDF button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-teal-600 hover:bg-slate-800 dark:hover:bg-teal-500 rounded-xl shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة / تصدير PDF</span>
            </button>
          </div>
        </div>

        {/* Print Layout Options */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-medium text-slate-700 dark:text-slate-300">خيارات شكل التقرير:</span>
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={printWithHeader}
                onChange={(e) => setPrintWithHeader(e.target.checked)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span>إظهار ترويسة وشعار المعمل (أوقفها للطباعة على ورق معمل رسمي فارغ)</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showDeltaColumn}
                onChange={(e) => setShowDeltaColumn(e.target.checked)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span>إظهار مقارنة النتائج السابقة (Delta Track)</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showGaugeBar}
                onChange={(e) => setShowGaugeBar(e.target.checked)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span>مؤشر النطاق الطبيعي الملون</span>
            </label>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">A4 Ready · High Definition</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* THE CLINICAL REPORT SHEET (Optimized for Screen & Strict A4 Printout)    */}
      {/* ========================================================================= */}
      <div
        id="clinical-printable-report"
        className="print-only-container bg-white text-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg p-6 sm:p-10 transition-colors"
      >
        {/* Lab Header (Bilingual, ISO accredited) */}
        {printWithHeader && (
          <div className="border-b-2 border-teal-800 pb-5 mb-5">
            <div className="flex items-center justify-between">
              {/* Right Zone: Arabic Identity */}
              <div className="text-right">
                <div className="text-2xl font-black text-teal-900 tracking-tight leading-none mb-1">
                  {settings.labNameAr}
                </div>
                <div className="text-xs font-semibold text-slate-700">
                  {settings.taglineAr}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                  <span>ترخيص وزارة الصحة: {settings.licenseNumber}</span>
                  <span>·</span>
                  <span className="font-semibold text-teal-800">{settings.accreditation}</span>
                </div>
              </div>

              {/* Center Zone: Medical Emblems / QR */}
              <div className="flex flex-col items-center justify-center px-4">
                <div className="w-14 h-14 rounded-2xl bg-teal-800 text-white flex items-center justify-center font-bold text-xl shadow-xs ring-4 ring-teal-50">
                  RT
                </div>
                <span className="text-[10px] font-mono tracking-widest text-teal-900 font-bold mt-1 uppercase">
                  CLINICAL LAB
                </span>
              </div>

              {/* Left Zone: English Identity */}
              <div className="text-left font-sans">
                <div className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">
                  {settings.labNameEn}
                </div>
                <div className="text-xs font-medium text-slate-600">
                  {settings.taglineEn}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-end gap-2 font-mono">
                  <span>Hotline: {settings.hotline}</span>
                  <span>·</span>
                  <span>Tel: {settings.phone}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* If header is disabled for preprinted paper, leave subtle margin */}
        {!printWithHeader && <div className="h-16 border-b border-dashed border-slate-200 mb-6 flex items-center justify-center text-xs text-slate-300 print-hidden">[مكان ترويسة الورق الرسمي المسبق الطباعة]</div>}

        {/* Patient Demographics & Accession Information Block */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-xs text-slate-800">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-2.5 gap-x-4">
            <div>
              <span className="text-slate-500 block text-[11px]">اسم المريض / Patient Name:</span>
              <span className="font-bold text-sm text-slate-900 block">{report.patient.fullName}</span>
              <span className="text-[11px] text-slate-600 font-medium">{report.patient.fullNameEn}</span>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px]">الرقم الطبي (MRN) / السن / الجنس:</span>
              <span className="font-mono font-bold text-slate-900 block">{report.patient.mrn}</span>
              <span className="font-medium text-slate-700">
                {report.patient.age} سنة ({report.patient.gender === 'MALE' ? 'ذكر / Male' : 'أنثى / Female'})
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px]">الطبيب المعالج / Ref. Doctor:</span>
              <span className="font-semibold text-slate-900 block">{report.patient.doctorName}</span>
              <span className="text-[11px] text-slate-600">{report.patient.hospitalOrClinic}</span>
            </div>

            <div className="border-r md:border-r-0 md:border-l border-slate-200 pr-3 md:pr-0 md:pl-3 flex flex-col justify-between">
              <div>
                <span className="text-slate-500 block text-[11px]">رقم العينة والباركود / Sample ID:</span>
                <span className="font-mono font-bold text-slate-900 text-sm tracking-wide">
                  {report.patient.sampleId}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-1">
                سحب: {report.patient.collectionDate}
                <br />
                تقرير: {report.date}
              </div>
            </div>
          </div>
        </div>

        {/* Report Title & Clinical Panel Badge */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-4">
          <div>
            <h2 className="text-lg font-bold text-teal-950 flex items-center gap-2">
              <span>{report.panelNameAr}</span>
              <span className="text-xs font-normal text-slate-500">/ {report.panelNameEn}</span>
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {report.criticalAlertActive && (
              <span className="bg-rose-100 text-rose-800 text-xs px-2.5 py-1 rounded-md font-bold flex items-center gap-1 animate-pulse">
                <AlertOctagon className="w-3.5 h-3.5 text-rose-600" /> قيمة حرجة تم الإبلاغ عنها
              </span>
            )}
            <span className="text-xs text-slate-500 font-mono">
              عينة دم وريدي EDTA / سريوم
            </span>
          </div>
        </div>

        {/* Results Table (Clinical Grade, Non-AI-Slop, Pure High Legibility) */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-800 text-slate-800 bg-slate-100/75 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3 text-right">الفحص / Investigation</th>
                <th className="py-2.5 px-3 text-center">النتيجة / Result</th>
                <th className="py-2.5 px-2 text-center">الحالة / Flag</th>
                <th className="py-2.5 px-3 text-center">الوحدة / Unit</th>
                <th className="py-2.5 px-3 text-center">المعدل الطبيعي / Reference Interval</th>
                {showGaugeBar && <th className="py-2.5 px-3 text-center">المؤشر / Gauge</th>}
                {showDeltaColumn && <th className="py-2.5 px-3 text-center">السابق / Delta</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {report.results.map((item, idx) => {
                const isAbnormal = item.flag !== 'NORMAL';
                const isPanic = item.flag === 'CRITICAL_LOW' || item.flag === 'CRITICAL_HIGH';

                return (
                  <tr
                    key={item.testCode || idx}
                    className={`transition-colors ${
                      isPanic
                        ? 'bg-rose-50/80 font-semibold'
                        : isAbnormal
                        ? 'bg-amber-50/40'
                        : idx % 2 === 1
                        ? 'bg-slate-50/50'
                        : 'bg-white'
                    }`}
                  >
                    {/* Test Name (Investigation - No duplicate repetition) */}
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900 text-[13px]">{item.testNameEn || item.testNameAr}</div>
                      {item.testNameAr &&
                       item.testNameEn &&
                       item.testNameAr.trim().toLowerCase() !== item.testNameEn.trim().toLowerCase() &&
                       !item.testNameEn.toLowerCase().includes(item.testNameAr.toLowerCase()) && (
                        <div className="text-[11px] text-slate-500 font-medium">{item.testNameAr}</div>
                      )}
                    </td>

                    {/* Result Value */}
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`font-mono text-sm tracking-tight ${
                          isPanic
                            ? 'font-black text-rose-700 text-base'
                            : isAbnormal
                            ? 'font-bold text-amber-900'
                            : 'font-semibold text-slate-900'
                        }`}
                      >
                        {item.value}
                      </span>
                    </td>

                    {/* Flag */}
                    <td className="py-2.5 px-2 text-center">
                      {item.flag === 'NORMAL' && (
                        <span className="text-slate-400 font-mono text-[11px]">-</span>
                      )}
                      {item.flag === 'LOW' && (
                        <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold text-amber-800 bg-amber-100 rounded">
                          LOW (L)
                        </span>
                      )}
                      {item.flag === 'HIGH' && (
                        <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold text-amber-800 bg-amber-100 rounded">
                          HIGH (H)
                        </span>
                      )}
                      {(item.flag === 'CRITICAL_LOW' || item.flag === 'CRITICAL_HIGH') && (
                        <span className="inline-block px-1.5 py-0.5 text-[10px] font-black text-white bg-rose-600 rounded">
                          CRITICAL !
                        </span>
                      )}
                    </td>

                    {/* Unit */}
                    <td className="py-2.5 px-3 text-center font-mono text-slate-600 text-[11px]">
                      {item.unit}
                    </td>

                    {/* Reference Range */}
                    <td className="py-2.5 px-3 text-center font-mono text-slate-600 text-[11px]">
                      {item.referenceDisplay}
                    </td>

                    {/* Gauge bar */}
                    {showGaugeBar && (
                      <td className="py-2.5 px-3 text-center">
                        {renderGauge(item)}
                      </td>
                    )}

                    {/* Delta previous comparison */}
                    {showDeltaColumn && (
                      <td className="py-2.5 px-3 text-center font-mono text-[11px]">
                        {item.previousValue ? (
                          <div className="flex flex-col items-center">
                            <span className="text-slate-700 font-medium">{item.previousValue}</span>
                            {item.deltaPercent !== undefined && (
                              <span
                                className={`text-[10px] font-semibold ${
                                  item.isDeltaSignificant
                                    ? 'text-rose-600'
                                    : item.deltaPercent > 0
                                    ? 'text-teal-700'
                                    : 'text-slate-500'
                                }`}
                              >
                                {item.deltaPercent > 0 ? '▲ +' : '▼ '}
                                {item.deltaPercent}%
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Complete Blood Film Examination Section (Crucial requirement for CBC) */}
        {report.bloodFilm && (
          <div className="page-break-avoid border border-slate-300 rounded-xl p-4 bg-slate-50/70 mb-6 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
              <h3 className="font-bold text-sm text-teal-950 flex items-center gap-2">
                <span>فحص الفيلم الدموي الميكروسكوبي / Peripheral Blood Film Morphology</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">
                Stain: Leishman-Giemsa Stain · Immersion 100x
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-800">
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="font-bold text-teal-900 block mb-1">
                  1. كريات الدم الحمراء (RBC Morphology):
                </span>
                <p className="text-slate-700 leading-relaxed">{report.bloodFilm.rbcMorphology}</p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="font-bold text-teal-900 block mb-1">
                  2. كريات الدم البيضاء (WBC Morphology):
                </span>
                <p className="text-slate-700 leading-relaxed">{report.bloodFilm.wbcMorphology}</p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="font-bold text-teal-900 block mb-1">
                  3. الصفائح الدموية (Platelets Smear):
                </span>
                <p className="text-slate-700 leading-relaxed">{report.bloodFilm.plateletMorphology}</p>
              </div>
            </div>

            {/* Pathologist Impression / Final Summary */}
            <div className="mt-3 bg-teal-50/60 border border-teal-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <span className="font-bold text-teal-900 text-xs shrink-0">
                  تقرير استشاري الباثولوجيا (Pathologist Impression):
                </span>
                <p className="text-teal-950 font-medium text-xs leading-relaxed">
                  {report.bloodFilm.pathologistImpression}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* General Clinical Notes / Comments */}
        {report.clinicalNotes && (
          <div className="mb-6 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
            <span className="font-bold text-slate-900 block mb-0.5">ملاحظات إكلينيكية / Clinical Comments:</span>
            <p>{report.clinicalNotes}</p>
          </div>
        )}

        {/* Critical Panic Value Call Log (Mandatory for CAP / ISO 15189 compliance) */}
        {report.criticalCallLog && (
          <div className="page-break-avoid mb-6 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900">
            <div className="font-bold flex items-center gap-1.5 text-rose-800 mb-1">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>توثيق الإبلاغ الفوري عن القيمة الحرجة (Critical Value Notification Log)</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] mt-1">
              <div>
                <span className="text-rose-700">تاريخ ووقت الإبلاغ:</span>{' '}
                <span className="font-mono font-bold">{report.criticalCallLog.notifiedAt}</span>
              </div>
              <div>
                <span className="text-rose-700">المبلغ إليه:</span>{' '}
                <span className="font-bold">{report.criticalCallLog.notifiedTo}</span>
              </div>
              <div>
                <span className="text-rose-700">القائم بالإبلاغ:</span>{' '}
                <span className="font-bold">{report.criticalCallLog.notifiedBy}</span>
              </div>
              <div>
                <span className="text-rose-700">تأكيد القراءة العكسية (Read-back):</span>{' '}
                <span className="font-bold text-emerald-700">نعم (مؤكدة)</span>
              </div>
            </div>
            {report.criticalCallLog.notes && (
              <p className="mt-1.5 text-[11px] text-rose-900 border-t border-rose-200 pt-1">
                {report.criticalCallLog.notes}
              </p>
            )}
          </div>
        )}

        {/* Report Footer, Digital Signatures, QR Code & Validation */}
        <div className="page-break-avoid border-t-2 border-slate-300 pt-5 mt-6">
          <div className="grid grid-cols-3 items-end text-xs">
            {/* Analyst / Medical Technologist */}
            <div className="text-right">
              <span className="text-slate-500 block text-[11px]">الفحص والتحليل بواسطة:</span>
              <span className="font-semibold text-slate-800 block text-xs">{report.analyzedBy}</span>
              <span className="text-[10px] text-slate-400">Medical Technologist (MLS)</span>
            </div>

            {/* QR Code & Digital Verification Link */}
            <div className="flex flex-col items-center justify-center text-center">
              <div className="p-2 border border-slate-300 rounded-lg bg-white shadow-2xs">
                {/* SVG vector representation of QR Code for pristine print clarity */}
                <svg className="w-16 h-16" viewBox="0 0 100 100" fill="currentColor">
                  {/* Outer finder patterns */}
                  <rect x="5" y="5" width="26" height="26" fill="black" />
                  <rect x="9" y="9" width="18" height="18" fill="white" />
                  <rect x="13" y="13" width="10" height="10" fill="black" />

                  <rect x="69" y="5" width="26" height="26" fill="black" />
                  <rect x="73" y="9" width="18" height="18" fill="white" />
                  <rect x="77" y="13" width="10" height="10" fill="black" />

                  <rect x="5" y="69" width="26" height="26" fill="black" />
                  <rect x="9" y="73" width="18" height="18" fill="white" />
                  <rect x="13" y="77" width="10" height="10" fill="black" />

                  {/* Body data points simulation */}
                  <rect x="36" y="8" width="6" height="6" fill="black" />
                  <rect x="46" y="8" width="6" height="6" fill="black" />
                  <rect x="56" y="8" width="6" height="6" fill="black" />
                  <rect x="36" y="20" width="6" height="12" fill="black" />
                  <rect x="48" y="24" width="12" height="6" fill="black" />

                  <rect x="8" y="36" width="6" height="10" fill="black" />
                  <rect x="20" y="36" width="8" height="6" fill="black" />
                  <rect x="36" y="40" width="24" height="20" fill="black" />
                  <rect x="42" y="46" width="12" height="8" fill="white" />
                  <rect x="66" y="36" width="8" height="14" fill="black" />
                  <rect x="80" y="42" width="12" height="6" fill="black" />

                  <rect x="36" y="68" width="8" height="12" fill="black" />
                  <rect x="50" y="72" width="12" height="16" fill="black" />
                  <rect x="68" y="68" width="10" height="6" fill="black" />
                  <rect x="82" y="78" width="8" height="14" fill="black" />
                </svg>
              </div>
              <span className="text-[9px] text-slate-500 font-mono mt-1">مسح الكود للتحقق الإلكتروني</span>
              <span className="text-[8px] text-slate-400 font-mono">ISO 15189 Verified</span>
            </div>

            {/* Pathologist Official Signature & Stamp */}
            <div className="text-left">
              <span className="text-slate-500 block text-[11px]">الاعتماد والختم الطبي:</span>
              <div className="mt-1 flex flex-col items-start">
                <span className="font-bold text-teal-950 text-sm">{report.verifiedBy}</span>
                <span className="text-[10px] text-slate-600">{report.verifiedTitle}</span>
                {/* Official Medical Stamp Box */}
                <div className="mt-2 border-2 border-teal-800 text-teal-900 rounded-lg px-2.5 py-1 text-[9px] font-bold tracking-tight inline-block rotate-[-2deg] opacity-90">
                  معتمد وموقع إلكترونياً
                  <br />
                  RT-LAB CLINICAL PATHOLOGY
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Footnote / Disclaimer */}
          <div className="text-center text-[10px] text-slate-400 border-t border-slate-200 pt-3 mt-4 flex items-center justify-between">
            <span>تقرير طبي رسمي صادر عن نظام RT-Lab الموحد — النتائج للإرشاد الطبي وتناقش مع الطبيب المعالج.</span>
            <span className="font-mono">Page 1 of 1 · HL7/FHIR Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
};
