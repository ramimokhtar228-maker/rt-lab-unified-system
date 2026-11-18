import { tafqeetEGP } from '../utils/tafqeet';
import { formatGenderAr } from '../utils/calculator';
import React, { useRef, useState } from 'react';
import { LabReport } from '../types/lab';
import {
  Printer,
  Download,
  Share2,
  X,
  Receipt,
  CheckCircle2,
  User,
  Building2,
  Loader2,
  Percent,
  Award,
  Image as ImageIcon,
  FileText,
  Layers,
  Sparkles,
  Gift
} from 'lucide-react';
import {
  formatInvoiceWhatsAppMessage,
  openWhatsApp,
  LAB_PHONE,
  LAB_PHONE_SECONDARY,
  LAB_WHATSAPP,
  BRANCH_MAIN_ADDRESS,
  INSTAPAY_IPA,
  WALLET_VODAFONE,
  LAB_NAME_AR
} from '../utils/whatsapp';
import {
  calculateTestsOnlyPaidAmount,
  getTierPalette,
  normalizeInvoiceRef,
  normalizePhoneKey,
  pointsCashValue,
  pointsForAmount,
  redemptionSummaryText,
  resolveProfileTier,
  tierDiscountRate
} from '../utils/loyaltyEngine';
import {
  buildInvoicePrintDocumentHTML,
  exportInvoiceAsPDF,
  exportInvoiceAsPNG,
  InvoiceExportPayload
} from '../utils/invoiceExporter';
import { useApp } from '../context/AppContext';
import { ClientEditModal } from './ClientEditModal';
import { LabInfoEditModal } from './LabInfoEditModal';
import { LAB_CATALOG } from '../data/labCatalog';
import { generateBarcodeSVG } from '../utils/barcode';

interface PatientInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: LabReport;
  onUpdateReport?: (updatedReport: LabReport) => void;
}

const PAYMENT_METHOD_AR: Record<string, string> = {
  cash: 'نقدي',
  visa: 'فيزا / بطاقة',
  card: 'بطاقة بنكية',
  instapay: 'إنستاباي',
  vodafone_cash: 'فودافون كاش',
  wallet: 'محفظة إلكترونية',
  bank_transfer: 'تحويل بنكي',
  deferred: 'آجل'
};

export const PatientInvoiceModal: React.FC<PatientInvoiceModalProps> = ({
  isOpen,
  onClose,
  report,
  onUpdateReport
}) => {
  const [isExporting, setIsExporting] = useState<'pdf' | 'png' | 'both' | 'wa' | null>(null);
  const [isClientEditOpen, setIsClientEditOpen] = useState(false);
  const [isLabEditOpen, setIsLabEditOpen] = useState(false);
  const [printNotice, setPrintNotice] = useState<string | null>(null);
  const invoiceContainerRef = useRef<HTMLDivElement>(null);

  const {
    labInfo: contextLabInfo,
    updateLabInfo,
    staffSignatures,
    updateStaffSignatures,
    updateReport,
    incomeRecords,
    updateIncomeRecord,
    loyaltyProfiles,
    loyaltyConfig,
    redeemLoyaltyPoints
  } = useApp();

  if (!isOpen || !report) return null;

  const labInfo = {
    labNameAr: contextLabInfo?.labNameAr || LAB_NAME_AR,
    labNameEn: contextLabInfo?.labNameEn || 'RT Diagnostic Laboratories',
    sloganAr: contextLabInfo?.sloganAr || 'التشخيص الصحيح يبدأ معنا',
    sloganEn: contextLabInfo?.sloganEn || 'Accurate Diagnosis Starts With Us',
    supervisionAr: contextLabInfo?.supervisionAr || 'أطباء واستشاريو كلية طب قصر العيني',
    supervisionEn: contextLabInfo?.supervisionEn || 'Kasr Al Ainy Clinical Pathology Consultants',
    accreditation: contextLabInfo?.accreditation || 'ISO 15189 Certified',
    hotline: contextLabInfo?.hotline || LAB_PHONE,
    phone: contextLabInfo?.phone || LAB_PHONE_SECONDARY,
    whatsapp: contextLabInfo?.whatsapp || LAB_WHATSAPP,
    mainAddress: contextLabInfo?.mainAddress || BRANCH_MAIN_ADDRESS,
    instapay: contextLabInfo?.instapay || INSTAPAY_IPA,
    vodafoneCash: contextLabInfo?.vodafoneCash || WALLET_VODAFONE
  };

  const contactPhonesDisplay = [labInfo.hotline, labInfo.phone].filter(Boolean).join(' — ');
  const p = report.patient;

  // Find real linked financial invoice
  const linkedInvoice = incomeRecords.find(i =>
    (report.invoiceId && (i.id === report.invoiceId || i.invoiceNumber === report.invoiceId)) ||
    i.labNumber === p.labNumber ||
    (p.barcode && i.barcode === p.barcode)
  );

  const invoiceNumber = linkedInvoice?.invoiceNumber
    || p.clinicalHistory?.match(/فاتورة\s*(?:مالية)?\s*رقم\s*([\w\d-]+)/i)?.[1]
    || `INV-${p.labNumber?.replace(/^RT-/i, '') || '2026'}`;

  // Linked Patient Loyalty Profile (normalized phone / cardNumber / barcode)
  const normPhone = normalizePhoneKey(p.phone);
  const loyaltyProfile = loyaltyProfiles.find(prof =>
    (normPhone && normalizePhoneKey(prof.phone) === normPhone) ||
    (p.loyaltyCardNumber && (prof.cardNumber === p.loyaltyCardNumber || prof.barcode === p.loyaltyCardNumber)) ||
    (p.barcode && prof.barcode === p.barcode)
  );

  const currentTier = loyaltyProfile ? resolveProfileTier(loyaltyProfile, loyaltyConfig) : 'Silver';
  const tierPalette = getTierPalette(currentTier);
  const tierDiscountPct = loyaltyProfile ? tierDiscountRate(currentTier, loyaltyConfig) : 0;
  const loyaltyCashInfo = loyaltyProfile ? pointsCashValue(loyaltyProfile.totalPoints || 0, loyaltyConfig) : null;
  const loyaltyCardCode = loyaltyProfile
    ? (loyaltyProfile.cardNumber || loyaltyProfile.barcode)
    : undefined;

  // Calculate prices based on linked invoice or profiles
  const items = (linkedInvoice?.tests && linkedInvoice.tests.length > 0)
    ? linkedInvoice.tests.map((t, idx) => ({
        id: t.id || `item-${idx}`,
        titleAr: t.nameAr || t.nameEn || 'تحليل مخبري',
        titleEn: t.nameEn || t.code || 'Lab Test',
        code: t.code,
        category: t.category || 'تحاليل تشخيصية',
        sampleType: t.sampleType || 'Serum',
        parametersCount: 1,
        price: t.price || 150
      }))
    : report.profiles.map((prof, idx) => {
        const catMatch = LAB_CATALOG.find(c => c.code.toUpperCase() === (prof.profileCode || '').toUpperCase());
        let price = catMatch?.profilePrice || 200;
        if (!catMatch?.profilePrice) {
          if (prof.parameters.length > 5) price = 220;
          else price = Math.max(100, prof.parameters.length * 40);
        }

        return {
          id: prof.id || `item-${idx}`,
          titleAr: prof.titleAr || prof.titleEn,
          titleEn: prof.titleEn,
          code: prof.profileCode,
          category: prof.category || 'تحاليل تشخيصية',
          sampleType: prof.sampleType || 'Serum',
          parametersCount: prof.parameters.length,
          price: price
        };
      });

  const visitFee = (p as any).visitFee || linkedInvoice?.visitFee || 0;
  const testsSubtotal = linkedInvoice?.testsSubtotal
    || report.packageApplied?.packagePrice
    || (p as any).testsSubtotal
    || (p.totalCost ? Math.max(0, p.totalCost + (p.discountApplied || 0) - visitFee) : items.reduce((sum, item) => sum + item.price, 0));
  const subtotal = testsSubtotal + visitFee;

  const [activePercent, setActivePercent] = useState<number | null>(
    p.discountType === 'percentage' && p.discountApplied && testsSubtotal > 0
      ? Math.round((p.discountApplied / testsSubtotal) * 100)
      : null
  );
  const [customPercent, setCustomPercent] = useState<number>(activePercent || tierDiscountPct || 15);
  const [customFlatDiscount, setCustomFlatDiscount] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(p.discountApplied ?? linkedInvoice?.discount ?? 0);

  React.useEffect(() => {
    setDiscountAmount(p.discountApplied ?? linkedInvoice?.discount ?? 0);
  }, [p.discountApplied, linkedInvoice?.discount]);

  const discount = discountAmount;
  const netTotal = Math.max(0, subtotal - discount);

  const persistDiscountChanges = (disc: number, discountType: 'percentage' | 'daily_fixed' | 'none') => {
    const newNet = Math.max(0, subtotal - disc);
    const currentPaid = linkedInvoice?.paidAmount ?? (p as any).paidAmount ?? newNet;
    const adjustedPaid = Math.min(currentPaid, newNet);
    const newRemaining = Math.max(0, newNet - adjustedPaid);

    const updatedPatient = {
      ...p,
      discountType,
      discountApplied: disc,
      totalCost: newNet,
      paidAmount: adjustedPaid,
      remainingAmount: newRemaining,
      loyaltyCardIssued: loyaltyProfile ? true : p.loyaltyCardIssued,
      loyaltyCardNumber: loyaltyCardCode || p.loyaltyCardNumber
    };

    if (onUpdateReport) {
      onUpdateReport({ ...report, patient: updatedPatient });
    } else {
      updateReport(report.id, { patient: updatedPatient });
    }

    if (linkedInvoice) {
      updateIncomeRecord(linkedInvoice.id, {
        discount: disc,
        discountApplied: disc,
        netAmount: newNet,
        paidAmount: adjustedPaid,
        remainingAmount: newRemaining,
        paymentStatus: newRemaining === 0 ? 'paid' : adjustedPaid > 0 ? 'partial' : 'unpaid'
      });
    }
  };

  const handleApplyPercentage = (pct: number) => {
    setActivePercent(pct);
    setCustomPercent(pct);
    const disc = Math.round((testsSubtotal * pct) / 100);
    setDiscountAmount(disc);
    persistDiscountChanges(disc, 'percentage');
  };

  const handleCustomPercentChange = (pct: number) => {
    const safePct = Math.max(0, Math.min(100, pct));
    setActivePercent(safePct);
    setCustomPercent(safePct);
    const disc = Math.round((testsSubtotal * safePct) / 100);
    setDiscountAmount(disc);
    persistDiscountChanges(disc, 'percentage');
  };

  const handleFlatDiscountChange = (flat: number) => {
    setActivePercent(null);
    setCustomFlatDiscount(flat);
    const disc = Math.max(0, Math.min(testsSubtotal, flat));
    setDiscountAmount(disc);
    persistDiscountChanges(disc, 'daily_fixed');
  };

  const handleResetDiscount = () => {
    setActivePercent(null);
    setCustomFlatDiscount(0);
    setDiscountAmount(0);
    persistDiscountChanges(0, 'none');
  };

  const handleRedeemPointsOnInvoice = () => {
    if (!loyaltyProfile || loyaltyProfile.totalPoints < 100) return;
    const redeemPts = Math.floor(loyaltyProfile.totalPoints / 100) * 100;
    const cashVal = pointsCashValue(redeemPts, loyaltyConfig).exactEGP;
    const maxApplicable = Math.max(0, testsSubtotal - discount);
    const actualRedeemCash = Math.min(cashVal, maxApplicable);
    const actualPts = Math.min(redeemPts, Math.ceil((actualRedeemCash / Math.max(1, loyaltyConfig.egpPer100Points)) * 100));
    if (actualPts <= 0 || actualRedeemCash <= 0) {
      setPrintNotice('لا يمكن تطبيق خصم نقاط أكبر من صافي قيمة التحاليل المتبقي.');
      return;
    }
    const res = redeemLoyaltyPoints(loyaltyProfile.patientId, actualPts, invoiceNumber);
    if (res.success) {
      const nextDisc = Math.min(testsSubtotal, discount + res.cashValue);
      setDiscountAmount(nextDisc);
      setActivePercent(null);
      persistDiscountChanges(nextDisc, 'daily_fixed');
      setPrintNotice(`✅ تم استبدال ${actualPts} نقطة وخصم ${res.cashValue} ج.م فوراً من الفاتورة.`);
      setTimeout(() => setPrintNotice(null), 5500);
    }
  };

  const realPaid = (p as any).paidAmount !== undefined
    ? Math.min(netTotal, Number((p as any).paidAmount) || 0)
    : (linkedInvoice?.paidAmount !== undefined ? Math.min(netTotal, linkedInvoice.paidAmount) : netTotal);
  const paidAmount = realPaid;
  const remainingAmount = Math.max(0, netTotal - paidAmount);

  const sampleDateFormatted = p.sampleDate ? new Date(p.sampleDate).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  }) : 'اليوم';

  const reportingDateFormatted = p.reportingDate ? new Date(p.reportingDate).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'خلال 24 ساعة';

  const invNorm = normalizeInvoiceRef(invoiceNumber);
  const labNorm = normalizeInvoiceRef(p.labNumber);
  const confirmedTx = loyaltyProfile?.transactions?.find(
    t => t.type === 'earn' && t.points > 0 && (
      (t.invoiceNumber && (normalizeInvoiceRef(t.invoiceNumber) === invNorm || normalizeInvoiceRef(t.invoiceNumber) === labNorm)) ||
      (t.reportNumber && normalizeInvoiceRef(t.reportNumber) === labNorm)
    )
  );
  const paidTestsOnly = calculateTestsOnlyPaidAmount(
    { testsSubtotal, visitFee, discount, netAmount: netTotal, paidAmount },
    loyaltyConfig
  );
  const invoiceEarnedPoints = confirmedTx?.points ?? pointsForAmount(paidTestsOnly, loyaltyConfig);

  const paymentMethodCode = linkedInvoice?.paymentMethod || p.paymentMethod || 'cash';
  const paymentMethodLabel = PAYMENT_METHOD_AR[paymentMethodCode] || 'نقدي';
  const isHomeVisitFlag = p.bookingType === 'home_visit' || (p as any).isHomeVisit;
  const repName = isHomeVisitFlag
    ? (p.visitSpecialist || linkedInvoice?.visitSpecialist)
    : (p.branchRepresentative || linkedInvoice?.branchRepresentative);

  const buildExportPayload = (): InvoiceExportPayload => ({
    invoiceNumber,
    labNumber: p.labNumber,
    barcode: p.barcode,
    patientName: p.fullName,
    patientPhone: p.phone,
    ageText: `${p.age} ${p.ageUnit === 'years' ? 'سنة' : 'شهر'}`,
    genderText: formatGenderAr(p.gender),
    referringDoctor: p.referringDoctorName || 'طلب فحص ذاتي (Self-Request)',
    sampleDateFormatted,
    reportingDateFormatted,
    branchName: p.branchName || linkedInvoice?.branchName || linkedInvoice?.branch || 'الفرع الرئيسي - بهتيم',
    representativeLabel: isHomeVisitFlag ? 'مندوب الزيارة المنزلية' : 'مندوب استقبال الفرع',
    representativeName: repName,
    items,
    testsSubtotal,
    visitFee,
    discount,
    netTotal,
    paidAmount,
    remainingAmount,
    paymentMethodLabel,
    cashierName: linkedInvoice?.cashierName || 'الاستقبال والخزينة',
    labInfo,
    loyaltyProfile,
    loyaltyConfig,
    invoiceEarnedPoints,
    isEarnedConfirmed: Boolean(confirmedTx)
  });

  // 1. Direct Isolated Print Window
  const handlePrintInvoice = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setPrintNotice('يرجى السماح بالنوافذ المنبثقة في المتصفح لطباعة الفاتورة، أو استخدام زر تحميل PNG / PDF.');
      setTimeout(() => setPrintNotice(null), 5000);
      return;
    }
    printWindow.document.open();
    printWindow.document.write(buildInvoicePrintDocumentHTML(buildExportPayload()));
    printWindow.document.close();
  };

  // 2. High-res PNG Image Export
  const handleDownloadPNG = async () => {
    try {
      setIsExporting('png');
      await exportInvoiceAsPNG(buildExportPayload(), false);
      setPrintNotice('✅ تم تحميل صورة الفاتورة شاملة كارت الولاء بصيغة PNG عالية الدقة.');
      setTimeout(() => setPrintNotice(null), 4500);
    } catch (err) {
      console.error('PNG export error:', err);
      setPrintNotice('تعذر إنشاء صورة PNG — يمكنك استخدام زر الطباعة الفورية.');
    } finally {
      setIsExporting(null);
    }
  };

  // 3. Direct PDF File Download
  const handleDownloadPDF = async () => {
    try {
      setIsExporting('pdf');
      await exportInvoiceAsPDF(buildExportPayload());
      setPrintNotice('✅ تم تحميل ملف الفاتورة الرسمي (PDF) شاملاً كارت الولاء.');
      setTimeout(() => setPrintNotice(null), 4500);
    } catch (err) {
      console.error('Error generating PDF:', err);
      handlePrintInvoice();
    } finally {
      setIsExporting(null);
    }
  };

  // 4. Download Both PNG + PDF
  const handleDownloadBoth = async () => {
    try {
      setIsExporting('both');
      const payload = buildExportPayload();
      await exportInvoiceAsPNG(payload, false);
      await exportInvoiceAsPDF(payload);
      setPrintNotice('✅ تم تحميل النسختين معاً (صورة PNG + ملف PDF) شاملتين لكارت الولاء.');
      setTimeout(() => setPrintNotice(null), 5500);
    } catch (err) {
      console.error('Both export error:', err);
      setPrintNotice('تعذر تصدير النسختين — جرب التصدير الفردي أو الطباعة.');
    } finally {
      setIsExporting(null);
    }
  };

  // 5. WhatsApp with PNG Image + Full Invoice & Loyalty Card Summary
  const handleSendWhatsAppInvoice = async () => {
    try {
      setIsExporting('wa');
      const payload = buildExportPayload();
      const { copied } = await exportInvoiceAsPNG(payload, false);
      const text = formatInvoiceWhatsAppMessage({
        invoiceNumber,
        labNumber: p.labNumber,
        barcode: p.barcode,
        patientName: p.fullName,
        sampleDate: sampleDateFormatted,
        reportingDate: reportingDateFormatted,
        branchName: payload.branchName,
        items: items.map(it => ({ titleAr: it.titleAr, titleEn: it.titleEn, price: it.price })),
        testsSubtotal,
        visitFee,
        discount,
        netTotal,
        paidAmount,
        remainingAmount,
        paymentMethodLabel,
        loyaltyProfile,
        loyaltyConfig,
        invoiceEarnedPoints,
        labInfo: labInfo as any
      });
      openWhatsApp(p.phone, text);
      setPrintNotice(
        copied
          ? '✅ تم تحميل صورة الفاتورة مع الكارت ونسخها للحافظة (الصقها Ctrl+V في واتساب) وفتح رسالة التفاصيل للمريض.'
          : '✅ تم تحميل صورة الفاتورة مع الكارت وفتح رسالة الواتساب — أرفق الصورة المحمّلة في المحادثة.'
      );
      setTimeout(() => setPrintNotice(null), 6500);
    } catch (err) {
      console.error('WhatsApp invoice export error:', err);
    } finally {
      setIsExporting(null);
    }
  };

  const barcodeSvgInline = generateBarcodeSVG(p.barcode || p.labNumber, 175, 38, true);

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-5 overflow-y-auto font-sans no-print" dir="rtl">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
        {/* Top Dialog Bar */}
        <div className="bg-slate-900 border-b border-slate-800 p-3.5 sm:px-5 flex flex-wrap items-center justify-between gap-2 text-white sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <span>فاتورة المريض الذكية وكارت الولاء</span>
                <span className="text-[11px] font-mono bg-rose-950 text-rose-300 px-2 py-0.5 rounded border border-rose-800 font-normal">
                  {invoiceNumber}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                المريض: <strong className="text-slate-200">{p.fullName}</strong> | رقم المعمل: <strong className="text-rose-300 font-mono">{p.labNumber}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setIsClientEditOpen(true)}
              className="flex items-center gap-1 px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
              title="تعديل بيانات العميل / المريض بالفاتورة"
            >
              <User className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden md:inline">بيانات العميل</span>
            </button>

            <button
              onClick={() => setIsLabEditOpen(true)}
              className="flex items-center gap-1 px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
              title="تعديل بيانات المعمل والفاتورة والعنوان"
            >
              <Building2 className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden md:inline">بيانات المعمل</span>
            </button>

            <button
              onClick={handleSendWhatsAppInvoice}
              disabled={isExporting !== null}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-black transition-all shadow-sm cursor-pointer"
              title="تحميل صورة الفاتورة بالكارت وإرسال التفاصيل عبر واتساب"
            >
              {isExporting === 'wa' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>واتساب + صورة</span>
            </button>

            <button
              onClick={handleDownloadPNG}
              disabled={isExporting !== null}
              className="flex items-center gap-1 px-2.5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="تحميل الفاتورة وكارت الولاء كصورة PNG"
            >
              {isExporting === 'png' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
              <span>PNG</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isExporting !== null}
              className="flex items-center gap-1 px-2.5 py-2 bg-rose-800 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="تحميل الفاتورة كملف PDF"
            >
              {isExporting === 'pdf' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
              <span>PDF</span>
            </button>

            <button
              onClick={handleDownloadBoth}
              disabled={isExporting !== null}
              className="flex items-center gap-1 px-2.5 py-2 bg-indigo-700 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="تحميل الصيغتين معاً (PNG + PDF)"
            >
              {isExporting === 'both' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Layers className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">PNG+PDF</span>
            </button>

            <button
              onClick={handlePrintInvoice}
              className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-red-800 to-rose-700 hover:from-red-900 hover:to-rose-800 text-white rounded-lg text-xs font-black shadow-md transition-all cursor-pointer"
              title="طباعة الفاتورة A4"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">طباعة</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {printNotice && (
          <div className="bg-emerald-50 border-b border-emerald-300 px-6 py-2 text-xs font-bold text-emerald-900">
            {printNotice}
          </div>
        )}

        {/* Interactive Discount & Loyalty Action Bar */}
        <div className="bg-slate-800/95 border-b border-slate-700/80 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2.5 text-xs text-white">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold flex items-center gap-1 text-rose-300 ml-1">
              <Percent className="w-3.5 h-3.5 text-rose-400" />
              <span>خصم الفاتورة:</span>
            </span>
            {loyaltyProfile && tierDiscountPct > 0 && (
              <button
                type="button"
                onClick={() => handleApplyPercentage(tierDiscountPct)}
                className="px-2.5 py-1 rounded-md font-bold text-xs cursor-pointer bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs flex items-center gap-1"
                title="تطبيق نسبة الخصم التلقائية لفئة كارت المريض"
              >
                <Sparkles className="w-3 h-3" />
                <span>خصم الكارت (%{tierDiscountPct})</span>
              </button>
            )}
            {loyaltyProfile && loyaltyProfile.totalPoints >= 100 && (
              <button
                type="button"
                onClick={handleRedeemPointsOnInvoice}
                className="px-2.5 py-1 rounded-md font-bold text-xs cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs flex items-center gap-1"
                title="استبدال النقاط بخصم نقدي مباشر على هذه الفاتورة"
              >
                <Gift className="w-3 h-3" />
                <span>استبدال نقاط ({loyaltyCashInfo?.redeemableEGP || 0} ج.م)</span>
              </button>
            )}
            {[5, 10, 15, 20, 25, 30].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => handleApplyPercentage(pct)}
                className={`px-2 py-1 rounded-md font-mono font-bold text-xs cursor-pointer transition-all ${
                  activePercent === pct
                    ? 'bg-rose-600 text-white shadow-xs scale-105'
                    : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1">
              <span className="text-slate-300 text-[11px]">مخصص (%):</span>
              <input
                type="number"
                min="0"
                max="100"
                value={customPercent}
                onChange={(e) => handleCustomPercentChange(Number(e.target.value) || 0)}
                className="w-14 px-2 py-1 bg-slate-900 border border-slate-600 rounded text-center font-bold font-mono text-rose-300 text-xs"
              />
            </div>

            <div className="flex items-center gap-1">
              <span className="text-slate-300 text-[11px]">مباشر (ج.م):</span>
              <input
                type="number"
                min="0"
                max={testsSubtotal}
                value={customFlatDiscount || ''}
                onChange={(e) => handleFlatDiscountChange(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-16 px-2 py-1 bg-slate-900 border border-slate-600 rounded text-center font-bold font-mono text-emerald-400 text-xs"
              />
            </div>

            <button
              type="button"
              onClick={handleResetDiscount}
              className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded text-[11px] font-bold cursor-pointer transition-colors"
            >
              إلغاء الخصم
            </button>
          </div>
        </div>

        {/* Scrollable Executive Invoice Preview Container */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-slate-950 flex justify-center">
          <div
            ref={invoiceContainerRef}
            className="invoice-page-container bg-white text-slate-900 rounded-2xl p-6 sm:p-9 w-full max-w-3xl shadow-2xl flex flex-col justify-between border border-slate-200"
            style={{ backgroundColor: '#ffffff' }}
          >
            <div>
              {/* Executive Verified Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-red-900 pb-4 mb-3 gap-4">
                <div className="text-right flex-1">
                  <h1 className="text-lg sm:text-xl font-black text-rose-950">{labInfo.labNameAr}</h1>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">{labInfo.supervisionAr}</p>
                  <p className="text-[11px] text-slate-600 mt-1">
                    📞 الهاتف والخط الساخن: <strong className="font-mono text-slate-900">{contactPhonesDisplay}</strong> | 💬 واتساب: <strong className="font-mono text-emerald-800">{labInfo.whatsapp}</strong>
                  </p>
                  <p className="text-[10.5px] text-slate-500 mt-0.5">📍 {labInfo.mainAddress}</p>
                </div>

                <div className="text-center px-2 shrink-0">
                  <div className="inline-block bg-gradient-to-r from-red-900 to-rose-800 text-white px-4 py-1.5 rounded-xl font-black text-xs shadow-sm">
                    فاتورة فحص وإيصال سداد
                  </div>
                  <div className="text-[9.5px] text-slate-400 font-mono mt-1 font-bold">OFFICIAL INVOICE & RECEIPT</div>
                </div>

                <div className="text-left flex-1" dir="ltr">
                  <h1 className="text-base font-black text-rose-950">{labInfo.labNameEn}</h1>
                  <p className="text-[11px] font-bold text-slate-700">{labInfo.supervisionEn}</p>
                  <p className="text-[10px] text-slate-500">{labInfo.accreditation}</p>
                  <p className="text-xs font-mono font-black text-rose-900 mt-1">{invoiceNumber}</p>
                </div>
              </div>

              <div className="flex h-1 w-full mb-4 rounded-full overflow-hidden">
                <div className="w-3/4 bg-red-900"></div>
                <div className="w-1/4 bg-slate-900"></div>
              </div>

              {/* Patient details + Barcode */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                  <div>
                    <span className="text-slate-500">اسم المريض: </span>
                    <strong className="text-slate-900 text-sm font-black">{p.fullName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">رقم المعمل: </span>
                    <strong className="text-rose-950 font-mono text-sm">{p.labNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">السن / النوع: </span>
                    <strong>{p.age} {p.ageUnit === 'years' ? 'سنة' : 'شهر'} / {formatGenderAr(p.gender)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">الهاتف: </span>
                    <strong className="font-mono">{p.phone || '—'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">تاريخ السحب: </span>
                    <span className="font-mono">{sampleDateFormatted}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">موعد الاستلام: </span>
                    <span className="font-mono font-bold text-rose-900">{reportingDateFormatted}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">الطبيب المعالج: </span>
                    <strong>{p.referringDoctorName || 'طلب فحص ذاتي (Self-Request)'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">الفرع: </span>
                    <strong>{p.branchName || linkedInvoice?.branchName || 'الفرع الرئيسي - بهتيم'}</strong>
                  </div>
                  {repName && (
                    <div className="sm:col-span-2 pt-1 border-t border-slate-200/70">
                      <span className="text-slate-500">{isHomeVisitFlag ? 'مندوب الزيارة المنزلية: ' : 'مندوب استقبال الفرع: '}</span>
                      <strong className="text-slate-900">{repName}</strong>
                    </div>
                  )}
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-2 text-center shrink-0 mx-auto sm:mx-0">
                  <div dangerouslySetInnerHTML={{ __html: barcodeSvgInline }} />
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">{p.barcode}</div>
                </div>
              </div>

              {/* Tests table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
                <table className="w-full text-xs text-right">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-black border-b border-slate-200 text-[11px]">
                      <th className="py-2.5 px-3 text-center w-10">#</th>
                      <th className="py-2.5 px-3 text-right">اسم التحليل / باقة الفحص</th>
                      <th className="py-2.5 px-3 text-center">نوع العينة</th>
                      <th className="py-2.5 px-3 text-center">العناصر</th>
                      <th className="py-2.5 px-3 text-left">القيمة (EGP)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((it, idx) => (
                      <tr key={it.id} className="odd:bg-white even:bg-slate-50/60">
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{it.titleAr}</div>
                          <div className="text-[10px] text-slate-500 font-mono" dir="ltr">{it.titleEn}</div>
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-600">{it.sampleType}</td>
                        <td className="py-2.5 px-3 text-center text-slate-500 font-mono">{it.parametersCount} عنصر</td>
                        <td className="py-2.5 px-3 text-left font-mono font-bold text-rose-950" dir="ltr">
                          {it.price.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Integrated Patient Loyalty Card & Points Panel Inside Invoice */}
              {loyaltyProfile && (
                <div className={`rounded-2xl p-4 mb-4 text-white border-2 shadow-md ${tierPalette.gradientCss} ${tierPalette.borderClass}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-white/20">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-white/15 border border-white/30 flex items-center justify-center font-black text-xs">
                        <Award className="w-4 h-4 text-amber-300" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-white">
                          كارت الولاء الطبي الذكي — {tierPalette.titleAr}
                        </div>
                        <div className="text-[11px] font-mono text-amber-200 font-bold">
                          رقم الكارت: {loyaltyCardCode}
                        </div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[11px] font-black border ${tierPalette.badgeBgClass}`}>
                      خصم دائم معتمد: %{tierDiscountPct}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="bg-black/35 border border-white/15 rounded-xl px-3 py-2">
                      <div className="text-[10px] text-slate-200">رصيد النقاط التراكمي:</div>
                      <div className="font-black font-mono text-sm text-amber-300">
                        {(loyaltyProfile.totalPoints || 0).toLocaleString()} نقطة
                      </div>
                    </div>
                    <div className="bg-black/35 border border-white/15 rounded-xl px-3 py-2">
                      <div className="text-[10px] text-slate-200">القيمة النقدية للاستبدال:</div>
                      <div className="font-black font-mono text-sm text-emerald-300">
                        = {loyaltyCashInfo?.exactEGP || 0} ج.م
                      </div>
                    </div>
                    <div className="bg-black/35 border border-white/15 rounded-xl px-3 py-2">
                      <div className="text-[10px] text-slate-200">
                        {confirmedTx ? 'نقاط مكتسبة بهذه الفاتورة:' : 'نقاط متوقعة لهذه الفاتورة:'}
                      </div>
                      <div className="font-black font-mono text-sm text-amber-200">
                        +{invoiceEarnedPoints.toLocaleString()} نقطة
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 text-[10.5px] text-amber-100 bg-white/10 rounded-lg px-3 py-1.5 text-center font-bold">
                    {redemptionSummaryText(loyaltyConfig)} · تُضاف النقاط وتُرقى الفئة تلقائياً مع كل حجز جديد
                  </div>
                </div>
              )}

              {/* Totals, InstaPay/Vodafone Cash & Notes Section */}
              <div className="flex flex-col sm:flex-row items-stretch justify-between gap-4 mb-5">
                <div className="flex-1 flex flex-col justify-between gap-3">
                  <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-950 space-y-1">
                    <div className="font-bold flex items-center gap-1 text-rose-900">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>تنبيهات استلام النتائج والولاء:</span>
                    </div>
                    <ul className="text-[11px] list-disc list-inside space-y-0.5 text-rose-900/90 pr-1">
                      <li>يرجى إبراز هذا الإيصال أو رقم كارت الولاء في زياراتكم القادمة.</li>
                      <li>يتم إرسال النتائج المعتمدة بصيغة PDF فورياً عبر واتساب ({labInfo.whatsapp}).</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-[11px] text-blue-950">
                    <div className="font-black text-blue-900 mb-1">💳 قنوات الدفع والتحويل الإلكتروني المعتمدة:</div>
                    <div className="font-mono font-bold space-y-0.5">
                      <div>InstaPay: <span className="text-slate-900">{labInfo.instapay}</span></div>
                      <div>Vodafone Cash: <span className="text-slate-900">{labInfo.vodafoneCash}</span></div>
                    </div>
                  </div>
                </div>

                <div className="w-full sm:w-72 bg-slate-50 border border-slate-300 rounded-xl p-4 text-xs space-y-2">
                  <div className="flex justify-between text-slate-600">
                    <span>إجمالي التحاليل:</span>
                    <span className="font-mono font-bold text-slate-800">{testsSubtotal.toFixed(2)} ج.م</span>
                  </div>
                  {visitFee > 0 && (
                    <div className="flex justify-between text-indigo-700 font-semibold">
                      <span>رسوم الزيارة المنزلية:</span>
                      <span className="font-mono font-bold">+ {visitFee.toFixed(2)} ج.م</span>
                    </div>
                  )}
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>الخصم المطبق:</span>
                      <span className="font-mono font-bold">- {discount.toFixed(2)} ج.م</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-rose-950 text-sm pt-2 border-t border-slate-200">
                    <span>الصافي المطلوب:</span>
                    <span className="font-mono">{netTotal.toFixed(2)} ج.م</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>المسدد ({paymentMethodLabel}):</span>
                    <span className="font-mono font-bold text-emerald-700">{paidAmount.toFixed(2)} ج.م</span>
                  </div>
                  <div className="flex justify-between font-bold pt-2 border-t border-dashed border-slate-300">
                    <span className={remainingAmount > 0 ? 'text-rose-700' : 'text-emerald-700'}>
                      {remainingAmount > 0 ? 'المتبقي للخزينة:' : 'حالة الحساب:'}
                    </span>
                    <span className={`font-mono ${remainingAmount > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                      {remainingAmount > 0 ? `${remainingAmount.toFixed(2)} ج.م` : 'مسدد بالكامل ✓'}
                    </span>
                  </div>

                  {/* Tafqeet in Arabic Words */}
                  <div className="pt-2 text-[11px] font-bold text-rose-950 bg-amber-50/80 p-2 rounded-lg border border-amber-200">
                    <span className="text-slate-500 font-normal">المبلغ كتابةً: </span>
                    <span>{tafqeetEGP(netTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Official Signatures & Stamp */}
            <div className="border-t border-slate-200 pt-4 mt-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-[11px] font-bold text-slate-500">مسؤول الاستقبال والخزينة</div>
                  <div className="text-xs text-slate-900 py-1 font-bold">{linkedInvoice?.cashierName || 'الاستقبال والخزينة'}</div>
                  <div className="text-[10px] text-slate-400">{p.branchName || 'فرع بهتيم الرئيسي'}</div>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-slate-500 mb-1">ختم السداد المالي</div>
                  <div className="inline-block border-2 border-dashed border-rose-900 rounded-full w-12 h-12 leading-[44px] text-rose-900 font-black text-[10px] mx-auto">
                    {remainingAmount > 0 ? 'PARTIAL' : 'PAID ✓'}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-rose-950">الإشراف العلمي والإدارة</div>
                  <div className="text-[11px] font-bold text-slate-900 py-1">{labInfo.supervisionAr}</div>
                  <div className="text-[10px] text-slate-500">{labInfo.accreditation}</div>
                </div>
              </div>

              <div className="text-center text-[9.5px] text-slate-500 mt-4 pt-2 border-t border-slate-100">
                فاتورة إلكترونية معتمدة — {labInfo.labNameAr} · هاتف: {contactPhonesDisplay} · واتساب: {labInfo.whatsapp}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Client Modal */}
      {isClientEditOpen && (
        <ClientEditModal
          isOpen={isClientEditOpen}
          onClose={() => setIsClientEditOpen(false)}
          patient={p}
          onSave={(updatedPatient) => {
            if (onUpdateReport) {
              onUpdateReport({ ...report, patient: updatedPatient });
            } else {
              updateReport(report.id, { patient: updatedPatient });
            }
            const inv = incomeRecords.find(i => i.barcode === updatedPatient.barcode || i.labNumber === updatedPatient.labNumber || i.id === report.invoiceId);
            if (inv) {
              updateIncomeRecord(inv.id, {
                patientName: updatedPatient.fullName,
                patientPhone: updatedPatient.phone,
                patientAge: updatedPatient.age,
                patientGender: updatedPatient.gender,
                referringDoctor: updatedPatient.referringDoctorName
              });
            }
          }}
        />
      )}

      {/* Edit Lab Info Modal */}
      {isLabEditOpen && (
        <LabInfoEditModal
          isOpen={isLabEditOpen}
          onClose={() => setIsLabEditOpen(false)}
          labInfo={labInfo}
          onUpdateLabInfo={updateLabInfo}
          staffSignatures={staffSignatures}
          onUpdateStaffSignatures={updateStaffSignatures}
        />
      )}
    </div>
  );
};
