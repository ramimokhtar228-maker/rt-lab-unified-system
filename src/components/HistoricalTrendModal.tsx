import React, { useState, useMemo } from 'react';
import { X, TrendingUp, Calendar, AlertCircle, ArrowUpRight, ArrowDownRight, Minus, Check } from 'lucide-react';
import { LabReport, ResultFlag } from '../types/laboratory';

interface HistoricalTrendModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientMrn: string;
  patientName: string;
  reports: LabReport[];
  initialTestCode?: string;
}

export const HistoricalTrendModal: React.FC<HistoricalTrendModalProps> = ({
  isOpen,
  onClose,
  patientMrn,
  patientName,
  reports,
  initialTestCode = 'HGB',
}) => {
  const [selectedTestCode, setSelectedTestCode] = useState<string>(initialTestCode);

  // Filter all reports for this patient
  const patientReports = useMemo(() => {
    return reports
      .filter((r) => r.patient.mrn === patientMrn)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [reports, patientMrn]);

  // Extract available test codes from the patient's reports
  const availableTests = useMemo(() => {
    const map = new Map<string, { code: string; nameEn: string; nameAr: string; unit: string }>();
    patientReports.forEach((rep) => {
      rep.results.forEach((res) => {
        if (!map.has(res.testCode)) {
          map.set(res.testCode, {
            code: res.testCode,
            nameEn: res.testNameEn,
            nameAr: res.testNameAr,
            unit: res.unit,
          });
        }
      });
    });
    return Array.from(map.values());
  }, [patientReports]);

  // Extract data series for the selected test
  const trendPoints = useMemo(() => {
    return patientReports
      .map((rep) => {
        const item = rep.results.find((r) => r.testCode === selectedTestCode);
        if (!item || item.numericValue === undefined) return null;
        return {
          date: rep.date,
          reportNumber: rep.reportNumber,
          value: item.numericValue,
          formattedValue: item.value,
          unit: item.unit,
          flag: item.flag,
          minRef: item.minRef,
          maxRef: item.maxRef,
          deltaPercent: item.deltaPercent,
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);
  }, [patientReports, selectedTestCode]);

  if (!isOpen) return null;

  const currentTest = availableTests.find((t) => t.code === selectedTestCode) || availableTests[0];

  // SVG Chart Calculation
  const minVal = Math.min(...trendPoints.map((p) => p.value), (trendPoints[0]?.minRef ?? 0) * 0.85);
  const maxVal = Math.max(...trendPoints.map((p) => p.value), (trendPoints[0]?.maxRef ?? 10) * 1.15);
  const valRange = maxVal - minVal || 1;

  const chartWidth = 560;
  const chartHeight = 220;
  const paddingX = 50;
  const paddingY = 30;

  const getX = (index: number) => {
    if (trendPoints.length <= 1) return chartWidth / 2;
    return paddingX + (index / (trendPoints.length - 1)) * (chartWidth - paddingX * 2);
  };

  const getY = (val: number) => {
    return chartHeight - paddingY - ((val - minVal) / valRange) * (chartHeight - paddingY * 2);
  };

  const minRef = trendPoints[0]?.minRef;
  const maxRef = trendPoints[0]?.maxRef;

  const polylinePoints = trendPoints
    .map((p, idx) => `${getX(idx)},${getY(p.value)}`)
    .join(' ');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>تتبع التغير التاريخي للنتائج (Automated Patient Historical Trend)</span>
              </h2>
              <p className="text-xs text-slate-500">
                المريض: <strong className="text-slate-800 dark:text-slate-200">{patientName}</strong> · الرقم الطبي:{' '}
                <span className="font-mono">{patientMrn}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Test Selector Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              اختر الفحص المعملي للمتابعة:
            </label>
            <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              {availableTests.map((t) => (
                <button
                  key={t.code}
                  onClick={() => setSelectedTestCode(t.code)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                    selectedTestCode === t.code
                      ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {t.code} · {t.nameAr}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Trend Chart */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs text-slate-500 block">الفحص المحدد:</span>
                <span className="text-base font-bold text-slate-900 dark:text-white">
                  {currentTest?.nameEn} ({currentTest?.nameAr})
                </span>
                <span className="text-xs text-slate-500 mr-2 font-mono">[{currentTest?.unit}]</span>
              </div>

              {minRef !== undefined && maxRef !== undefined && (
                <div className="text-left text-xs text-slate-500 font-mono">
                  <span>المعدل الطبيعي: </span>
                  <strong className="text-emerald-700 dark:text-emerald-400">
                    {minRef} - {maxRef} {currentTest?.unit}
                  </strong>
                </div>
              )}
            </div>

            {/* SVG Visual Canvas */}
            {trendPoints.length > 0 ? (
              <div className="w-full overflow-x-auto flex justify-center py-2">
                <svg
                  width={chartWidth}
                  height={chartHeight}
                  className="overflow-visible select-none text-slate-400"
                >
                  {/* Normal Reference Range Shaded Band */}
                  {minRef !== undefined && maxRef !== undefined && (
                    <rect
                      x={paddingX}
                      y={getY(maxRef)}
                      width={chartWidth - paddingX * 2}
                      height={Math.max(getY(minRef) - getY(maxRef), 2)}
                      fill="rgba(16, 185, 129, 0.12)"
                      rx="4"
                    />
                  )}

                  {/* Reference line labels */}
                  {maxRef !== undefined && (
                    <text
                      x={paddingX - 6}
                      y={getY(maxRef) + 4}
                      textAnchor="end"
                      className="text-[10px] fill-emerald-600 font-mono"
                    >
                      Max: {maxRef}
                    </text>
                  )}
                  {minRef !== undefined && (
                    <text
                      x={paddingX - 6}
                      y={getY(minRef) + 4}
                      textAnchor="end"
                      className="text-[10px] fill-emerald-600 font-mono"
                    >
                      Min: {minRef}
                    </text>
                  )}

                  {/* Connecting Line */}
                  {trendPoints.length > 1 && (
                    <polyline
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={polylinePoints}
                    />
                  )}

                  {/* Data Points */}
                  {trendPoints.map((p, idx) => {
                    const cx = getX(idx);
                    const cy = getY(p.value);
                    const isAbnormal = p.flag !== 'NORMAL';

                    return (
                      <g key={idx}>
                        {/* Point Circle */}
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isAbnormal ? 6 : 5}
                          fill={isAbnormal ? '#e11d48' : '#6366f1'}
                          stroke="#ffffff"
                          strokeWidth="2"
                          className="transition-transform hover:scale-125"
                        />
                        {/* Value label */}
                        <text
                          x={cx}
                          y={cy - 12}
                          textAnchor="middle"
                          className={`text-xs font-mono font-bold ${
                            isAbnormal ? 'fill-rose-600' : 'fill-slate-900 dark:fill-white'
                          }`}
                        >
                          {p.formattedValue}
                        </text>
                        {/* Date label at bottom */}
                        <text
                          x={cx}
                          y={chartHeight - 6}
                          textAnchor="middle"
                          className="text-[10px] fill-slate-500 font-mono"
                        >
                          {p.date.split(' ')[0]}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-slate-400">
                لا توجد نتائج سابقة مسجلة لهذا الفحص بعد
              </div>
            )}
          </div>

          {/* Delta Historical Audit Table */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              جدول التغير الزمني والمقارنة (Delta Check Log):
            </h3>
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold">
                    <th className="py-2.5 px-3">التاريخ والوقت</th>
                    <th className="py-2.5 px-3">رقم التقرير</th>
                    <th className="py-2.5 px-3 text-center">النتيجة</th>
                    <th className="py-2.5 px-3 text-center">الحالة</th>
                    <th className="py-2.5 px-3 text-center">التغير عن السابق (Delta %)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {trendPoints.map((p, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300">{p.date}</td>
                      <td className="py-2.5 px-3 font-mono font-medium text-teal-700 dark:text-teal-400">
                        {p.reportNumber}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900 dark:text-white">
                        {p.formattedValue} {p.unit}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {p.flag === 'NORMAL' ? (
                          <span className="text-emerald-700 dark:text-emerald-400 font-medium">طبيعي</span>
                        ) : (
                          <span className="text-rose-600 font-bold">غير طبيعي ({p.flag})</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">
                        {p.deltaPercent !== undefined ? (
                          <span
                            className={`font-semibold ${
                              p.deltaPercent > 0 ? 'text-teal-600' : 'text-slate-500'
                            }`}
                          >
                            {p.deltaPercent > 0 ? '▲ +' : '▼ '}
                            {p.deltaPercent}%
                          </span>
                        ) : (
                          <span className="text-slate-300">الزيارة الأولى</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
};
