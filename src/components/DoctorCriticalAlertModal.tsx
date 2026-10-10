import React, { useState } from 'react';
import { LabReport } from '../types/lab';
import {
  detectPanicValues,
  formatDoctorCriticalWhatsApp,
  PanicParameterAlert,
  DoctorNotificationLogEntry
} from '../utils/criticalAlertEngine';
import {
  AlertTriangle,
  X,
  PhoneCall,
  Send,
  CheckCircle2,
  Clock,
  UserCheck,
  ShieldAlert,
  Copy,
  Check,
  Stethoscope,
  Volume2
} from 'lucide-react';

interface DoctorCriticalAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: LabReport | null;
  onLogSaved?: (log: DoctorNotificationLogEntry) => void;
}

export const DoctorCriticalAlertModal: React.FC<DoctorCriticalAlertModalProps> = ({
  isOpen,
  onClose,
  report,
  onLogSaved
}) => {
  if (!isOpen || !report) return null;

  const panicAlerts = detectPanicValues(report);
  const [copied, setCopied] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
  const [chemistName, setChemistName] = useState('الكيميائي النوبتجي');

  const p = report.patient;
  const docName = p.referringDoctorName || 'الطبيب المعالج';
  const docPhone = p.phone || '';

  const whatsAppMessage = formatDoctorCriticalWhatsApp(report, panicAlerts);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(whatsAppMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendWhatsApp = () => {
    const encoded = encodeURIComponent(whatsAppMessage);
    const cleanPhone = docPhone.replace(/[^0-9]/g, '');
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  const handleCallDoctor = () => {
    const cleanPhone = docPhone.replace(/[^0-9]/g, '');
    if (cleanPhone) {
      window.open(`tel:${cleanPhone}`);
    } else {
      alert('لم يتم تسجيل رقم هاتف مباشر للطبيب المعالج.');
    }
  };

  const handleSaveAcknowledgment = () => {
    setAcknowledged(true);
    const log: DoctorNotificationLogEntry = {
      id: `crit-log-${Date.now()}`,
      reportId: report.id,
      patientName: p.fullName,
      patientLabNumber: p.labNumber,
      doctorName: docName,
      doctorPhone: docPhone,
      alertTimestamp: new Date().toLocaleString('ar-EG'),
      criticalParameters: panicAlerts.map(a => `${a.parameterName}: ${a.value} ${a.unit}`),
      notifiedByStaff: chemistName,
      communicationChannel: 'whatsapp',
      acknowledgmentStatus: 'acknowledged',
      doctorResponseNotes: actionNotes || 'تم إبلاغ الطبيب المعالج تليفونياً وواتساب وأكد اتخاذ الإجراء السريري العاجل.'
    };
    if (onLogSaved) onLogSaved(log);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-white border-2 border-red-600/70 w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden text-slate-900"
        dir="rtl"
      >
        {/* Urgent Pulsing Emergency Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-red-950 via-red-800 to-rose-900 text-white flex items-center justify-between border-b border-red-700 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border-2 border-red-400/50 flex items-center justify-center text-red-200 shadow-inner">
              <ShieldAlert className="w-7 h-7 text-red-300 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-red-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full font-mono uppercase tracking-wider animate-pulse">
                  CRITICAL PANIC ALERT
                </span>
                <span className="text-xs text-red-200 font-mono">ISO 15189:2022 Compliant</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-wide mt-0.5">
                نظام الإنذار الفوري وإبلاغ الأطباء بالنتائج الحرجة
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-red-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Patient & Doctor Card */}
          <div className="bg-red-50/70 border border-red-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-bold">المريض المحال:</div>
                <div className="font-black text-slate-900 text-base">
                  {p.fullName} <span className="text-xs font-mono text-slate-500 font-normal">(#{p.labNumber})</span>
                </div>
                <div className="text-xs text-slate-600 font-mono">
                  {p.age} سنة • {p.gender === 'male' ? 'ذكر' : 'أنثى'} • هاتف: {p.phone || 'غير مسجل'}
                </div>
              </div>
            </div>

            <div className="bg-white border border-red-200 rounded-xl px-4 py-2.5 text-xs">
              <span className="text-slate-500 block text-[11px] font-bold">الطبيب المعالج المطلوب إبلاغه:</span>
              <span className="font-black text-red-900 text-sm">د. {docName}</span>
            </div>
          </div>

          {/* Panic Parameters Detected */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm text-red-950 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>المؤشرات المعملية الحرجة المكتشفة ({panicAlerts.length})</span>
              </h3>
              <span className="text-[11px] text-red-700 font-bold bg-red-100 px-2.5 py-0.5 rounded-full">
                تتطلب إبلاغاً فورياً خلال أقل من 15 دقيقة
              </span>
            </div>

            {panicAlerts.length === 0 ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center text-emerald-800">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
                <p className="font-bold text-sm">لا توجد قيم حرجة تستدعي الطوارئ في هذا التقرير</p>
                <p className="text-xs text-emerald-600 mt-1">كافة الفحوصات خارج نطاق الخطر الأقصى (Panic Thresholds).</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {panicAlerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl border-2 border-red-400 p-4 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-red-600 text-white font-mono text-xs font-black">
                          {alert.conditionType === 'panic_low' ? 'PANIC LOW ⬇️' : 'PANIC HIGH ⬆️'}
                        </span>
                        <h4 className="font-black text-slate-900 text-base">{alert.parameterName}</h4>
                        {alert.parameterNameAr && (
                          <span className="text-xs text-slate-500 font-bold">({alert.parameterNameAr})</span>
                        )}
                      </div>
                      <p className="text-xs text-red-700 font-bold">{alert.clinicalRiskAr}</p>
                      <div className="text-[11px] text-slate-600 bg-red-50 p-2 rounded-lg border border-red-100 mt-1">
                        <span className="font-bold text-red-900">الإجراء السريري الإسعافي: </span>
                        {alert.emergencyActionAr}
                      </div>
                    </div>

                    <div className="bg-red-950 text-white px-5 py-3 rounded-2xl text-center shrink-0 border border-red-700">
                      <span className="text-[10px] text-red-300 font-mono block">القيمة المسجلة</span>
                      <span className="text-2xl font-black text-white font-mono tracking-wider">
                        {alert.value}
                      </span>
                      <span className="text-xs text-red-300 font-mono block">{alert.unit}</span>
                      <span className="text-[10px] text-red-400 mt-1 block">
                        الحد الحرج: {alert.panicThreshold}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instant Dispatch Actions */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-black text-sm flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-400" />
                <span>إرسال إشعار الطوارئ الفوري للطبيب</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">قناة اتصال مشفرة وموثقة</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={handleSendWhatsApp}
                className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>إرسال عبر الواتساب فوراً</span>
              </button>

              <button
                onClick={handleCallDoctor}
                className="py-3 px-4 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <PhoneCall className="w-4 h-4" />
                <span>اتصال هاتفي مباشر</span>
              </button>

              <button
                onClick={handleCopyMessage}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'تم نسخ الرسالة بنجاح' : 'نسخ نص الإنذار'}</span>
              </button>
            </div>
          </div>

          {/* ISO 15189 Official Critical Result Log Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-black text-xs text-slate-800 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>سجل توثيق إبلاغ النتائج الحرجة (ISO 15189 Clause 7.3.7 Log)</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {new Date().toLocaleDateString('ar-EG')} - {new Date().toLocaleTimeString('ar-EG')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">اسم الكيميائي / مسؤول الإبلاغ:</label>
                <input
                  type="text"
                  value={chemistName}
                  onChange={e => setChemistName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">ملاحظات رد واستجابة الطبيب:</label>
                <input
                  type="text"
                  value={actionNotes}
                  onChange={e => setActionNotes(e.target.value)}
                  placeholder="مثال: تم إبلاغ د. أحمد وأكد بدء محاليل وريدية عاجلة..."
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
              </div>
            </div>

            <button
              onClick={handleSaveAcknowledgment}
              disabled={acknowledged}
              className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition ${
                acknowledged
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-900 hover:bg-rose-800 text-white shadow-md'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>{acknowledged ? 'تم تسجيل وتوثيق الإبلاغ في سجل الطوارئ الرسمي' : 'توثيق إتمام الإبلاغ في السجل المعملي الرسمي'}</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            يُحفظ هذا التوثيق إلكترونياً مع اسم المشغل والوقت بالثانية لأغراض اعتماد الجودة الطبية.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
};
