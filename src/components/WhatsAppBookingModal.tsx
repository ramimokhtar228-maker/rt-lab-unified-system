import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Copy, 
  Check, 
  X, 
  Phone, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  Sparkles, 
  Edit3, 
  FileText,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { 
  formatBookingConfirmationWhatsAppMessage, 
  openWhatsApp, 
  BRANCH_MAIN_ADDRESS, 
  LAB_NAME_AR, 
  LAB_PHONE 
} from '../utils/whatsapp';
import { useApp } from '../context/AppContext';

export interface WhatsAppBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingData: {
    patientName: string;
    labNumber: string;
    barcode?: string;
    phone: string;
    date: string;
    time: string;
    isHomeVisit: boolean;
    address?: string;
    deliveryNotes?: string;
    branchName?: string;
    branchAddress?: string;
    branchPhone?: string;
    testsDetails?: { nameAr: string; nameEn?: string; code?: string; price?: number }[];
    testsList?: string;
    packageName?: string;
    packagePrice?: number;
    extraTestsDetails?: { nameAr: string; nameEn?: string; code?: string; price?: number }[];
    subtotal: number;
    discountAmount: number;
    discountLabel: string;
    visitFee?: number;
    netAmount: number;
    paidAmount?: number;
    remainingAmount?: number;
    paymentMethod: string;
    fastingHours?: number;
  };
}

export const WhatsAppBookingModal: React.FC<WhatsAppBookingModalProps> = ({
  isOpen,
  onClose,
  bookingData
}) => {
  const { labInfo } = useApp();
  const [phone, setPhone] = useState(bookingData.phone || '');
  const [fastingHours, setFastingHours] = useState<number>(bookingData.fastingHours || 0);
  const [customNotes, setCustomNotes] = useState<string>('');
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState('');

  // Generate initial message
  useEffect(() => {
    if (isOpen) {
      setPhone(bookingData.phone || '');
      setFastingHours(bookingData.fastingHours || 0);
      setCustomNotes('');
      setIsEditingMessage(false);
      setCopied(false);

      const generated = formatBookingConfirmationWhatsAppMessage({
        patientName: bookingData.patientName,
        labNumber: bookingData.labNumber,
        barcode: bookingData.barcode,
        phone: bookingData.phone,
        date: bookingData.date,
        time: bookingData.time,
        isHomeVisit: bookingData.isHomeVisit,
        address: bookingData.address,
        deliveryNotes: bookingData.deliveryNotes,
        branchName: bookingData.branchName || 'الفرع الرئيسي',
        branchAddress: bookingData.branchAddress || labInfo?.mainAddress || BRANCH_MAIN_ADDRESS,
        branchPhone: bookingData.branchPhone || labInfo?.phone || LAB_PHONE,
        testsDetails: bookingData.testsDetails,
        testsList: bookingData.testsList || '',
        packageName: bookingData.packageName,
        packagePrice: bookingData.packagePrice,
        extraTestsDetails: bookingData.extraTestsDetails,
        subtotal: bookingData.subtotal,
        discountAmount: bookingData.discountAmount,
        discountLabel: bookingData.discountLabel,
        visitFee: bookingData.visitFee,
        netAmount: bookingData.netAmount,
        paidAmount: bookingData.paidAmount,
        remainingAmount: bookingData.remainingAmount,
        paymentMethod: bookingData.paymentMethod,
        fastingHours: bookingData.fastingHours || 0,
        customLabInfo: labInfo
      });
      setMessage(generated);
    }
  }, [isOpen, bookingData, labInfo]);

  // Append quick snippet to message
  const handleAppendSnippet = (snippet: string) => {
    setMessage(prev => {
      if (prev.includes(snippet)) return prev;
      return prev + `\n• ${snippet}`;
    });
  };

  const handleUpdateFasting = (hours: number) => {
    setFastingHours(hours);
    const updated = formatBookingConfirmationWhatsAppMessage({
      patientName: bookingData.patientName,
      labNumber: bookingData.labNumber,
      barcode: bookingData.barcode,
      phone: phone || bookingData.phone,
      date: bookingData.date,
      time: bookingData.time,
      isHomeVisit: bookingData.isHomeVisit,
      address: bookingData.address,
      deliveryNotes: bookingData.deliveryNotes,
      branchName: bookingData.branchName || 'الفرع الرئيسي',
      branchAddress: bookingData.branchAddress || labInfo?.mainAddress || BRANCH_MAIN_ADDRESS,
      branchPhone: bookingData.branchPhone || labInfo?.phone || LAB_PHONE,
      testsDetails: bookingData.testsDetails,
      testsList: bookingData.testsList || '',
      packageName: bookingData.packageName,
      packagePrice: bookingData.packagePrice,
      extraTestsDetails: bookingData.extraTestsDetails,
      subtotal: bookingData.subtotal,
      discountAmount: bookingData.discountAmount,
      discountLabel: bookingData.discountLabel,
      visitFee: bookingData.visitFee,
      netAmount: bookingData.netAmount,
      paidAmount: bookingData.paidAmount,
      remainingAmount: bookingData.remainingAmount,
      paymentMethod: bookingData.paymentMethod,
      fastingHours: hours,
      customLabInfo: labInfo
    });
    setMessage(updated);
  };

  const handleSend = () => {
    const targetPhone = phone.trim() || bookingData.phone;
    if (!targetPhone) {
      alert('يرجى إدخال رقم هاتف المريض أولاً');
      return;
    }
    openWhatsApp(targetPhone, message);
    onClose();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200"
        dir="rtl"
      >
        {/* Modal Header styled like WhatsApp Business */}
        <div className="bg-[#075e54] text-white p-4 sm:p-5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 text-emerald-300">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">إرسال رسالة تأكيد الحجز للمريض (واتساب)</h3>
                <span className="bg-emerald-500/30 text-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/40">
                  Business Verified
                </span>
              </div>
              <p className="text-emerald-100 text-xs">
                رسالة طبية منسقة ومعتمدة باسم <strong className="text-white">{labInfo?.labNameAr || LAB_NAME_AR}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-emerald-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 bg-slate-50">
          {/* Recipient Phone & Quick Controls */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>رقم هاتف / واتساب المريض المستلم:</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010XXXXXXXX"
                  className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-left focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-800"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>تحديد ساعات الصيام في الرسالة:</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <button
                    type="button"
                    onClick={() => handleUpdateFasting(0)}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                      fastingHours === 0 
                        ? 'bg-emerald-700 text-white border-emerald-700' 
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    بدون صيام
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateFasting(8)}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                      fastingHours === 8 
                        ? 'bg-amber-700 text-white border-amber-700' 
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    صيام 8 ساعات
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateFasting(12)}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                      fastingHours === 12 
                        ? 'bg-rose-900 text-white border-rose-900' 
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    صيام 12 ساعة
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Snippets & Tags */}
            <div>
              <span className="block text-[11px] font-bold text-slate-500 mb-1.5">
                إضافة إرشادات وملاحظات سريعة بنقرة واحدة:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAppendSnippet('يُرجى شرب الماء النقي بكثرة لتسهيل عملية سحب العينة')}
                  className="text-[10px] font-bold bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 px-2.5 py-1 rounded-lg transition"
                >
                  💧 شرب الماء مسموح
                </button>
                <button
                  type="button"
                  onClick={() => handleAppendSnippet('يرجى إحضار بطاقة الرقم القومي أو الروشتة الطبية السابقة')}
                  className="text-[10px] font-bold bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 px-2.5 py-1 rounded-lg transition"
                >
                  🪪 إحضار البطاقة والروشتة
                </button>
                <button
                  type="button"
                  onClick={() => handleAppendSnippet('الدفع متاح عبر إنستاباي InstaPay على العنوان: ramirtlab@instapay')}
                  className="text-[10px] font-bold bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 px-2.5 py-1 rounded-lg transition"
                >
                  ⚡ إنستاباي InstaPay
                </button>
                <button
                  type="button"
                  onClick={() => handleAppendSnippet('يرجى عدم تناول جرعة علاج الغدة أو السكر إلا بعد سحب العينة')}
                  className="text-[10px] font-bold bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-800 border border-slate-200 hover:border-rose-300 px-2.5 py-1 rounded-lg transition"
                >
                  💊 تأجيل جرعة الدواء
                </button>
              </div>
            </div>
          </div>

          {/* WhatsApp Chat Preview Bubble */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-1">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-700" />
                <span>معاينة نص الرسالة كما ستصل لهاتف المريض:</span>
              </span>
              <button
                type="button"
                onClick={() => setIsEditingMessage(!isEditingMessage)}
                className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>{isEditingMessage ? 'معاينة القراءة' : 'تعديل النص يدوياً'}</span>
              </button>
            </div>

            {/* Chat Screen container */}
            <div className="rounded-2xl p-3 sm:p-4 bg-[#efeae2] border border-[#d1d7db] shadow-inner font-sans">
              {isEditingMessage ? (
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={14}
                  className="w-full text-xs font-mono bg-white border border-emerald-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 leading-relaxed shadow-sm"
                  dir="rtl"
                />
              ) : (
                <div className="bg-[#dcf8c6] text-slate-900 rounded-2xl rounded-tr-xs p-4 shadow-sm text-xs leading-relaxed max-w-[96%] mr-auto space-y-2 border border-[#c6e6b0] relative">
                  <div className="whitespace-pre-wrap font-sans text-right select-text selection:bg-emerald-300">
                    {message}
                  </div>
                  <div className="flex items-center justify-end gap-1 text-[10px] text-slate-500 font-mono pt-1 border-t border-emerald-200/40">
                    <span>{new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="text-emerald-700 font-bold">✓✓</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>سيتم فتح محادثة الواتساب مباشرة مع رقم المريض المعتمد</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">تم نسخ الرسالة!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>نسخ النص</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSend}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-black transition-all shadow-md shadow-emerald-700/20 flex items-center gap-2 cursor-pointer active:scale-98"
            >
              <Send className="w-4 h-4" />
              <span>إرسال عبر واتساب الآن</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
