import React, { useState } from 'react';
import { LabReport } from '../types/lab';
import {
  Smartphone,
  X,
  Heart,
  Droplets,
  Activity,
  FileText,
  Calendar,
  Pill,
  Share2,
  Download,
  CheckCircle2,
  Bell,
  User,
  ShieldCheck,
  ChevronLeft,
  QrCode
} from 'lucide-react';

interface PatientMobilePortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: LabReport | null;
}

export const PatientMobilePortalModal: React.FC<PatientMobilePortalModalProps> = ({
  isOpen,
  onClose,
  report
}) => {
  if (!isOpen || !report) return null;

  const [activeTab, setActiveTab] = useState<'home' | 'reports' | 'meds' | 'profile'>('home');
  const p = report.patient;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-[40px] shadow-2xl flex flex-col max-h-[94vh] overflow-hidden text-slate-100 p-3 sm:p-4 relative"
        dir="rtl"
      >
        {/* Smartphone Speaker / Notch Simulator */}
        <div className="w-32 h-4 bg-slate-950 rounded-full mx-auto mb-2 flex items-center justify-center">
          <div className="w-12 h-1 bg-slate-800 rounded-full"></div>
          <div className="w-2.5 h-2.5 bg-slate-900 rounded-full mr-2"></div>
        </div>

        {/* Top Status Header */}
        <div className="flex items-center justify-between px-3 py-1 text-[11px] font-mono text-slate-400">
          <span>09:41</span>
          <div className="flex items-center gap-1.5">
            <span>5G</span>
            <div className="w-5 h-2.5 border border-slate-400 rounded-sm p-0.5 flex items-center">
              <div className="w-full h-full bg-emerald-400 rounded-xs"></div>
            </div>
          </div>
        </div>

        {/* App Frame Content */}
        <div className="flex-1 bg-slate-950 rounded-[32px] overflow-hidden flex flex-col border border-slate-800 relative">
          {/* In-app Navigation Bar */}
          <div className="p-3 bg-gradient-to-r from-rose-950 via-slate-900 to-slate-900 border-b border-rose-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center font-black text-white text-xs">
                RT
              </div>
              <div>
                <span className="font-black text-xs text-white block leading-tight">تطبيق صحتي المعملي</span>
                <span className="text-[9px] text-rose-300 font-bold">RT Patient Portal Companion</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Main App Viewport */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {activeTab === 'home' && (
              <>
                {/* Patient Digital Identity Card */}
                <div className="bg-gradient-to-br from-rose-900 via-rose-950 to-slate-900 border border-rose-600/40 rounded-2xl p-4 text-white shadow-lg space-y-2 relative overflow-hidden">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] text-rose-300 font-bold block">البطاقة الرقمية للمريض</span>
                      <h3 className="font-black text-sm text-white">{p.fullName}</h3>
                      <span className="text-[10px] font-mono text-rose-200">#{p.labNumber}</span>
                    </div>
                    <div className="w-10 h-10 bg-white p-1 rounded-lg shadow-md">
                      <QrCode className="w-full h-full text-slate-950" />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-rose-800/60 flex items-center justify-between text-[10px] text-rose-200">
                    <span>العمر: {p.age} سنة</span>
                    <span>فصيلة الدم: {p.bloodGroup || 'O+'}</span>
                    <span>حالة الملف: نشط وموثق</span>
                  </div>
                </div>

                {/* Health Status Rings / Summary */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
                      <Activity className="w-3.5 h-3.5 text-emerald-400" />
                      <span>مؤشر الكفاءة الصحية الحيوية</span>
                    </span>
                    <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/50">
                      92 / 100
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <Droplets className="w-4 h-4 text-rose-500 mx-auto mb-1" />
                      <span className="text-[9px] text-slate-400 block">صحة الدم</span>
                      <span className="font-bold text-xs text-white">طبيعي</span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <Activity className="w-4 h-4 text-sky-500 mx-auto mb-1" />
                      <span className="text-[9px] text-slate-400 block">كفاءة الأيض</span>
                      <span className="font-bold text-xs text-white">مستقر</span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <Heart className="w-4 h-4 text-red-500 mx-auto mb-1" />
                      <span className="text-[9px] text-slate-400 block">القلب والأوعية</span>
                      <span className="font-bold text-xs text-white">جيد جداً</span>
                    </div>
                  </div>
                </div>

                {/* Latest Test Result Quick View */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">آخر تقرير معملي صادر:</span>
                    <span className="text-[10px] text-slate-400 font-mono">{report.createdAt.split('T')[0]}</span>
                  </div>

                  <div className="space-y-1.5">
                    {report.profiles.slice(0, 2).map((prof, i) => (
                      <div
                        key={i}
                        className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-white text-xs">{prof.titleAr}</div>
                          <div className="text-[10px] text-slate-400 font-mono" dir="ltr">{prof.titleEn}</div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                          معتمد
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setActiveTab('reports')}
                    className="w-full mt-2 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] transition text-center cursor-pointer"
                  >
                    عرض كافة النتائج والتحاليل
                  </button>
                </div>

                {/* Medications & Reminders */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5 text-amber-400" />
                      <span>تذكير الأدوية الموصوفة</span>
                    </span>
                    <span className="text-[10px] text-amber-400 font-bold">2 مواعيد اليوم</span>
                  </div>

                  <div className="space-y-1.5 text-[11px]">
                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-200">Metformin 1000mg</div>
                        <div className="text-[10px] text-slate-400">بعد الغداء</div>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">02:00 PM</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'reports' && (
              <div className="space-y-3">
                <h3 className="font-black text-sm text-white">التقارير المخبرية الشاملة</h3>
                {report.profiles.map((prof, idx) => (
                  <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-2">
                    <div className="font-bold text-rose-300 text-xs">{prof.titleAr}</div>
                    <div className="space-y-1">
                      {prof.parameters.map((param, pIdx) => (
                        <div key={pIdx} className="flex items-center justify-between bg-slate-950 p-2 rounded-lg text-[11px]">
                          <span className="text-slate-300">{param.name}</span>
                          <span className="font-mono font-bold text-white">
                            {param.result} {param.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom App Navigation Bar */}
          <div className="p-2 bg-slate-900 border-t border-slate-800 grid grid-cols-3 gap-1 text-center text-[10px]">
            <button
              onClick={() => setActiveTab('home')}
              className={`p-2 rounded-xl font-bold cursor-pointer transition ${
                activeTab === 'home' ? 'bg-rose-950 text-rose-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-4 h-4 mx-auto mb-0.5" />
              <span>الرئيسية</span>
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`p-2 rounded-xl font-bold cursor-pointer transition ${
                activeTab === 'reports' ? 'bg-rose-950 text-rose-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4 mx-auto mb-0.5" />
              <span>التقارير</span>
            </button>
            <button
              onClick={() => {
                const text = `تقرير التحاليل للمريض ${p.fullName} (#${p.labNumber})`;
                navigator.clipboard.writeText(text);
                alert('تم نسخ ملخص التقرير لمشاركته مع طبيبك.');
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-white font-bold cursor-pointer transition"
            >
              <Share2 className="w-4 h-4 mx-auto mb-0.5" />
              <span>مشاركة</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
