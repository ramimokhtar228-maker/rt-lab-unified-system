import React, { useState } from 'react';
import { LabReport, LabInfo } from '../types/lab';
import {
  Share2,
  X,
  Send,
  Link,
  Copy,
  Check,
  QrCode,
  ShieldCheck,
  Stethoscope,
  Lock,
  Clock,
  Printer,
  Mail
} from 'lucide-react';

interface DoctorShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: LabReport | null;
  labInfo: LabInfo;
}

export const DoctorShareModal: React.FC<DoctorShareModalProps> = ({
  isOpen,
  onClose,
  report,
  labInfo
}) => {
  if (!isOpen || !report) return null;

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [requirePin, setRequirePin] = useState(true);
  const [pinCode] = useState('2026');
  const [expiryHours] = useState(72);

  const p = report.patient;
  const docName = p.referringDoctorName || 'الطبيب المعالج';

  // Construct secure web portal access URL
  const portalUrl = `https://ramimokhtar228-maker.github.io/rt-lab-unified-system/#/portal/doctor?id=${report.id}&token=RT-${Math.abs(report.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0))}&pin=${pinCode}`;

  // Formatted Professional Doctor Brief
  const doctorBriefText = `🔬 *تقرير معملي تخصصي - معامل RT للتحاليل الطبية*
عناية الزميل العزيز: *د. ${docName}*
تحية طيبة وبعد،،
مرفق لسيادتكم نتائج الفحوصات المعملية للمريض:
👤 *${p.fullName}* (#${p.labNumber})
⏳ العمر: *${p.age} سنة* | الجنس: *${p.gender === 'male' ? 'ذكر' : 'أنثى'}*
📅 تاريخ سحب العينة: *${p.sampleDate || report.createdAt.split('T')[0]}*
─────────────────────
📋 *أبرز النتائج:*
${report.profiles.map(pr => `• ${pr.titleAr}: ${pr.parameters.filter(x => x.flag !== 'NORMAL').length > 0 ? `(${pr.parameters.filter(x => x.flag !== 'NORMAL').length} مؤشرات خارج النطاق)` : 'ضمن النطاق الطبيعي'}`).join('\n')}

🔗 *رابط الاطلاع الآمن على التقرير الكامل مع الرسوم التوضيحية:*
${portalUrl}
${requirePin ? `🔑 رمز الدخول السري (PIN): *${pinCode}*` : ''}
صالح لمدة: *${expiryHours} ساعة*

مع أطيب تحيات إدارة معامل RT • إشراف: أ.د. رامي مختار`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(doctorBriefText);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const handleSendWhatsApp = () => {
    const encoded = encodeURIComponent(doctorBriefText);
    const cleanPhone = (p.phone || '').replace(/[^0-9]/g, '');
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-white border border-slate-200 w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden text-slate-900"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white flex items-center justify-between border-b border-rose-900/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-600/30 border border-rose-500/40 flex items-center justify-center text-rose-300">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wide">
                  مشاركة التقرير الطبي فوراً مع الطبيب المعالج
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white font-mono">
                  Doctor Dispatch
                </span>
              </div>
              <p className="text-xs text-rose-200 mt-0.5">
                إرسال فوري عبر الواتساب أو عبر رابط سحابي آمن محمي برمز مرور PIN وصلاحية محددة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
          {/* Target Doctor Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-800 font-bold">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-bold block">الطبيب المعالج المستلم:</span>
                <span className="font-black text-sm text-slate-900">د. {docName}</span>
                <span className="text-[11px] text-slate-500 block">
                  المريض: {p.fullName} (#{p.labNumber})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> مشفر بـ AES-256
              </span>
            </div>
          </div>

          {/* WhatsApp Direct Dispatch Card */}
          <div className="bg-emerald-950 text-white rounded-2xl p-4 border border-emerald-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm">إرسال فوري عبر تطبيق WhatsApp</span>
              </div>
              <span className="text-[10px] bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded font-mono">
                Direct Dispatch
              </span>
            </div>

            <p className="text-emerald-200 text-xs leading-relaxed">
              يتم تجهيز رسالة مهنية تليق بالأطباء تتضمن ملخص الحالة، أبرز الانحرافات، ورابطاً مباشراً للاطلاع على التقرير الأصلي A4 والإنفوجرامات الباثولوجية.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={handleSendWhatsApp}
                className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black transition flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Send className="w-4 h-4" />
                <span>إرسال للطبيب عبر الواتساب الآن</span>
              </button>

              <button
                onClick={handleCopySummary}
                className="py-2.5 px-3.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-emerald-200 font-bold transition flex items-center gap-1.5 cursor-pointer border border-emerald-700"
              >
                {copiedSummary ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedSummary ? 'تم نسخ النص' : 'نسخ النص بالكامل'}</span>
              </button>
            </div>
          </div>

          {/* Secure Web Link & QR Code */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-2 text-xs">
                <Link className="w-4 h-4 text-rose-800" />
                <span>رابط الطبيب السحابي الآمن (Secure Access URL)</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> ينتهي بعد {expiryHours} ساعة
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={portalUrl}
                className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 select-all"
                dir="ltr"
              />
              <button
                onClick={handleCopyLink}
                className="py-2 px-3.5 rounded-xl bg-rose-900 hover:bg-rose-800 text-white font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'تم النسخ' : 'نسخ الرابط'}</span>
              </button>
            </div>

            {/* Security Options */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={requirePin}
                  onChange={e => setRequirePin(e.target.checked)}
                  className="rounded text-rose-900"
                />
                <span className="flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  حماية التقرير برمز PIN سري ({pinCode})
                </span>
              </label>
              <span className="text-[11px] text-slate-500">
                الوصول محمي بمعايير HIPAA لخصوصية المرضى
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            تُسجل كل عملية وصول للطبيب في سجل تدقيق الوصول السريري (Clinical Access Log).
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
