import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageSquare,
  Send,
  Copy,
  Check,
  X,
  Phone,
  Clock,
  ShieldCheck,
  Edit3,
  FileText,
  AlertCircle,
  UserCheck,
  Building2,
  Home,
  RefreshCw
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
    visitSpecialist?: string;
    branchRepresentative?: string;
    branchName?: string;
    branchAddress?: string;
    branchPhone?: string;
    testsDetails?: { nameAr: string; nameEn?: string; code?: string; price?: number }[];
    testsList?: string;
    packageName?: string;
    packagePrice?: number;
    packageOriginalPrice?: number;
    extraTestsDetails?: { nameAr: string; nameEn?: string; code?: string; price?: number }[];
    subtotal: number;
    testsSubtotal?: number;
    grossTotal?: number;
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
  const { labInfo, staffMembers, facilities } = useApp();

  const homeVisitTeam = useMemo(
    () =>
      (staffMembers || []).filter(
        s => s.isActive && (s.role === 'phlebotomist' || s.role === 'chemist')
      ),
    [staffMembers]
  );

  const branchReceptionTeam = useMemo(
    () =>
      (staffMembers || []).filter(
        s => s.isActive && (s.role === 'receptionist' || s.role === 'admin' || s.role === 'accountant')
      ),
    [staffMembers]
  );

  const [phone, setPhone] = useState(bookingData.phone || '');
  const [fastingHours, setFastingHours] = useState<number>(bookingData.fastingHours || 0);
  const [visitSpecialist, setVisitSpecialist] = useState<string>(bookingData.visitSpecialist || '');
  const [branchRepresentative, setBranchRepresentative] = useState<string>(bookingData.branchRepresentative || '');
  const [selectedBranchName, setSelectedBranchName] = useState<string>(
    bookingData.branchName || facilities?.[0]?.nameAr || 'الفرع الرئيسي - بهتيم'
  );
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const buildPreviewMessage = (opts?: {
    fasting?: number;
    homeRep?: string;
    branchRep?: string;
    branchTitle?: string;
    targetPhone?: string;
  }) => {
    const activeBranch = (facilities || []).find(
      f => f.nameAr === (opts?.branchTitle ?? selectedBranchName)
    );
    return formatBookingConfirmationWhatsAppMessage({
      patientName: bookingData.patientName,
      labNumber: bookingData.labNumber,
      barcode: bookingData.barcode,
      phone: opts?.targetPhone ?? phone ?? bookingData.phone,
      date: bookingData.date,
      time: bookingData.time,
      isHomeVisit: bookingData.isHomeVisit,
      address: bookingData.address,
      deliveryNotes: bookingData.deliveryNotes,
      visitSpecialist: opts?.homeRep ?? visitSpecialist,
      branchRepresentative: opts?.branchRep ?? branchRepresentative,
      branchName: opts?.branchTitle ?? selectedBranchName,
      branchAddress:
        activeBranch?.address || bookingData.branchAddress || labInfo?.mainAddress || BRANCH_MAIN_ADDRESS,
      branchPhone:
        activeBranch?.phones?.join(' / ') || bookingData.branchPhone || labInfo?.phone || LAB_PHONE,
      testsDetails: bookingData.testsDetails,
      testsList: bookingData.testsList || '',
      packageName: bookingData.packageName,
      packagePrice: bookingData.packagePrice,
      packageOriginalPrice: bookingData.packageOriginalPrice,
      extraTestsDetails: bookingData.extraTestsDetails,
      subtotal: bookingData.subtotal,
      testsSubtotal: bookingData.testsSubtotal,
      grossTotal: bookingData.grossTotal,
      discountAmount: bookingData.discountAmount,
      discountLabel: bookingData.discountLabel,
      visitFee: bookingData.visitFee,
      netAmount: bookingData.netAmount,
      paidAmount: bookingData.paidAmount,
      remainingAmount: bookingData.remainingAmount,
      paymentMethod: bookingData.paymentMethod,
      fastingHours: opts?.fasting ?? fastingHours,
      customLabInfo: labInfo
    });
  };

  useEffect(() => {
    if (!isOpen) return;
    const defaultHomeRep =
      bookingData.visitSpecialist || homeVisitTeam[0]?.name || 'أ/ يوسف طارق المنشاوي';
    const defaultBranchRep =
      bookingData.branchRepresentative || branchReceptionTeam[0]?.name || 'أ/ هدى السيد رضوان';
    const defaultBranch =
      bookingData.branchName || facilities?.[0]?.nameAr || 'الفرع الرئيسي - بهتيم';

    setPhone(bookingData.phone || '');
    setFastingHours(bookingData.fastingHours || 0);
    setVisitSpecialist(defaultHomeRep);
    setBranchRepresentative(defaultBranchRep);
    setSelectedBranchName(defaultBranch);
    setIsEditingMessage(false);
    setCopied(false);
    setErrorMsg(null);

    setMessage(
      formatBookingConfirmationWhatsAppMessage({
        patientName: bookingData.patientName,
        labNumber: bookingData.labNumber,
        barcode: bookingData.barcode,
        phone: bookingData.phone,
        date: bookingData.date,
        time: bookingData.time,
        isHomeVisit: bookingData.isHomeVisit,
        address: bookingData.address,
        deliveryNotes: bookingData.deliveryNotes,
        visitSpecialist: defaultHomeRep,
        branchRepresentative: defaultBranchRep,
        branchName: defaultBranch,
        branchAddress: bookingData.branchAddress || labInfo?.mainAddress || BRANCH_MAIN_ADDRESS,
        branchPhone: bookingData.branchPhone || labInfo?.phone || LAB_PHONE,
        testsDetails: bookingData.testsDetails,
        testsList: bookingData.testsList || '',
        packageName: bookingData.packageName,
        packagePrice: bookingData.packagePrice,
        packageOriginalPrice: bookingData.packageOriginalPrice,
        extraTestsDetails: bookingData.extraTestsDetails,
        subtotal: bookingData.subtotal,
        testsSubtotal: bookingData.testsSubtotal,
        grossTotal: bookingData.grossTotal,
        discountAmount: bookingData.discountAmount,
        discountLabel: bookingData.discountLabel,
        visitFee: bookingData.visitFee,
        netAmount: bookingData.netAmount,
        paidAmount: bookingData.paidAmount,
        remainingAmount: bookingData.remainingAmount,
        paymentMethod: bookingData.paymentMethod,
        fastingHours: bookingData.fastingHours || 0,
        customLabInfo: labInfo
      })
    );
  }, [isOpen, bookingData, labInfo, homeVisitTeam, branchReceptionTeam, facilities]);

  const handleAppendSnippet = (snippet: string) => {
    setMessage(prev => {
      if (prev.includes(snippet)) return prev;
      return prev + `\n• ${snippet}`;
    });
  };

  const handleUpdateFasting = (hours: number) => {
    setFastingHours(hours);
    setMessage(buildPreviewMessage({ fasting: hours }));
  };

  const handleUpdateHomeRep = (val: string) => {
    setVisitSpecialist(val);
    setMessage(buildPreviewMessage({ homeRep: val }));
  };

  const handleUpdateBranchRep = (val: string) => {
    setBranchRepresentative(val);
    setMessage(buildPreviewMessage({ branchRep: val }));
  };

  const handleUpdateBranch = (val: string) => {
    setSelectedBranchName(val);
    setMessage(buildPreviewMessage({ branchTitle: val }));
  };

  const handleSend = () => {
    const targetPhone = phone.trim() || bookingData.phone;
    if (!targetPhone) {
      setErrorMsg('يرجى إدخال رقم هاتف / واتساب المريض قبل الإرسال.');
      return;
    }
    setErrorMsg(null);
    openWhatsApp(targetPhone, message);
    onClose();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
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
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-base text-white">
                  {bookingData.isHomeVisit
                    ? 'إرسال تأكيد حجز زيارة منزلية (واتساب)'
                    : 'إرسال تأكيد حجز حضور بالفرع (واتساب)'}
                </h3>
                <span className="bg-emerald-500/30 text-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-400/40 inline-flex items-center gap-1">
                  {bookingData.isHomeVisit ? <Home className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                  {bookingData.isHomeVisit ? 'زيارة منزلية' : 'حضور للفرع'}
                </span>
              </div>
              <p className="text-emerald-100 text-xs">
                اختصارات التحاليل فقط بدون أسعار فردية · المبلغ الكلي وبعد الخصم · باسم{' '}
                <strong className="text-white">{labInfo?.labNameAr || LAB_NAME_AR}</strong>
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
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Recipient Phone & Quick Controls */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>رقم هاتف / واتساب المريض المستلم:</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
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
                    className={`py-2 px-2 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
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
                    className={`py-2 px-2 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                      fastingHours === 8
                        ? 'bg-amber-700 text-white border-amber-700'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    صيام 8 س
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateFasting(12)}
                    className={`py-2 px-2 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                      fastingHours === 12
                        ? 'bg-rose-900 text-white border-rose-900'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    صيام 12 س
                  </button>
                </div>
              </div>
            </div>

            {/* Representative Selector: Home Visit Specialist OR Branch Attendance Representative */}
            <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {bookingData.isHomeVisit ? (
                <div className="sm:col-span-2 bg-rose-50/70 border border-rose-200 rounded-xl p-3 space-y-2">
                  <label className="block text-xs font-black text-rose-950 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-rose-700" />
                    <span>مندوب الزيارة المنزلية (أخصائي السحب):</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select
                      value={homeVisitTeam.some(s => s.name === visitSpecialist) ? visitSpecialist : '__custom__'}
                      onChange={(e) => {
                        if (e.target.value !== '__custom__') {
                          handleUpdateHomeRep(e.target.value);
                        }
                      }}
                      className="w-full text-xs font-bold bg-white border border-rose-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      {homeVisitTeam.map(m => (
                        <option key={m.id} value={m.name}>
                          {m.name} — {m.title}
                        </option>
                      ))}
                      <option value="__custom__">كتابة اسم مندوب آخر يدوياً...</option>
                    </select>
                    <input
                      type="text"
                      value={visitSpecialist}
                      onChange={(e) => handleUpdateHomeRep(e.target.value)}
                      placeholder="اسم مندوب الزيارة المنزلية"
                      className="w-full text-xs font-bold bg-white border border-rose-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-rose-700" />
                      <span>الفرع المحدد للحضور:</span>
                    </label>
                    <select
                      value={selectedBranchName}
                      onChange={(e) => handleUpdateBranch(e.target.value)}
                      className="w-full text-xs font-bold bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {(facilities || []).map(f => (
                        <option key={f.id} value={f.nameAr}>
                          {f.nameAr}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 space-y-1.5">
                    <label className="block text-xs font-black text-emerald-950 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                      <span>مندوب استقبال الفرع (مسؤول الحضور):</span>
                    </label>
                    <div className="flex flex-col gap-1.5">
                      <select
                        value={
                          branchReceptionTeam.some(s => s.name === branchRepresentative)
                            ? branchRepresentative
                            : '__custom__'
                        }
                        onChange={(e) => {
                          if (e.target.value !== '__custom__') {
                            handleUpdateBranchRep(e.target.value);
                          }
                        }}
                        className="w-full text-xs font-bold bg-white border border-emerald-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {branchReceptionTeam.map(m => (
                          <option key={m.id} value={m.name}>
                            {m.name} — {m.title}
                          </option>
                        ))}
                        <option value="__custom__">كتابة اسم مندوب آخر يدوياً...</option>
                      </select>
                      <input
                        type="text"
                        value={branchRepresentative}
                        onChange={(e) => handleUpdateBranchRep(e.target.value)}
                        placeholder="اسم مندوب استقبال الفرع"
                        className="w-full text-xs font-bold bg-white border border-emerald-200 rounded-lg p-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </>
              )}
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
                  className="text-[10px] font-bold bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  💧 شرب الماء مسموح
                </button>
                <button
                  type="button"
                  onClick={() => handleAppendSnippet('الدفع متاح عبر إنستاباي InstaPay على العنوان: 01100874444 @instapay | فودافون كاش: 01124485444')}
                  className="text-[10px] font-bold bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  ⚡ إنستاباي InstaPay
                </button>
                <button
                  type="button"
                  onClick={() => handleAppendSnippet('يرجى عدم تناول جرعة علاج الغدة أو السكر إلا بعد سحب العينة')}
                  className="text-[10px] font-bold bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-800 border border-slate-200 hover:border-rose-300 px-2.5 py-1 rounded-lg transition cursor-pointer"
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
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMessage(buildPreviewMessage())}
                  className="text-[11px] text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>إعادة التوليد</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingMessage(!isEditingMessage)}
                  className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{isEditingMessage ? 'معاينة القراءة' : 'تعديل النص يدوياً'}</span>
                </button>
              </div>
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
