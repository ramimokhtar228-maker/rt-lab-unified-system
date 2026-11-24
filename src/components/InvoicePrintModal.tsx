import { tafqeetEGP } from '../utils/tafqeet';
import { RTLogo } from './RTLogo';
import React, { useEffect, useState } from 'react';
import { IncomeRecord, InvoiceTestItem, Patient } from '../types';
import { generateBarcodeSVG } from '../utils/barcode';
import {
  X,
  Printer,
  User,
  Building2,
  Share2,
  Image as ImageIcon,
  FileText,
  Layers,
  Loader2,
  Award,
  CheckCircle2,
  Edit3,
  Trash2,
  Plus,
  ListChecks,
  PackageCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ClientEditModal } from './ClientEditModal';
import { LabInfoEditModal } from './LabInfoEditModal';
import {
  BRANCH_MAIN_ADDRESS,
  INSTAPAY_IPA,
  LAB_NAME_AR,
  LAB_PHONE,
  LAB_PHONE_SECONDARY,
  LAB_WHATSAPP,
  WALLET_VODAFONE,
  formatInvoiceWhatsAppMessage,
  openWhatsApp
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

interface InvoicePrintModalProps {
  invoice: IncomeRecord | null;
  onClose: () => void;
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

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({ invoice: propInvoice, onClose }) => {
  const {
    language,
    labInfo: contextLabInfo,
    updateLabInfo,
    staffSignatures,
    updateStaffSignatures,
    facilities,
    incomeRecords,
    updateIncomeRecord,
    reports,
    updateReport,
    loyaltyProfiles,
    loyaltyConfig
  } = useApp();
  const invoice = propInvoice ? (incomeRecords.find(i => i.id === propInvoice.id) || propInvoice) : null;
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isLabModalOpen, setIsLabModalOpen] = useState(false);
  const [printLayout, setPrintLayout] = useState<'standard' | 'thermal' | 'tube_sticker'>('standard');
  const [isExporting, setIsExporting] = useState<'wa' | 'png' | 'pdf' | 'both' | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [isEditingItems, setIsEditingItems] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState<string>('');
  const [displayMode, setDisplayMode] = useState<'detailed' | 'grouped'>(invoice?.invoiceDisplayMode || 'detailed');
  const [groupedTitleAr, setGroupedTitleAr] = useState<string>(invoice?.invoiceGroupedTitleAr || '');

  useEffect(() => {
    if (!invoice) return;
    setDisplayMode(invoice.invoiceDisplayMode || 'detailed');
    setGroupedTitleAr(invoice.invoiceGroupedTitleAr || '');
  }, [invoice?.id, invoice?.invoiceDisplayMode, invoice?.invoiceGroupedTitleAr]);

  if (!invoice) return null;

  const branchObj = facilities.find(f => f.nameAr === invoice.branch || f.id === invoice.branchId) || facilities[0];

  const resolvedLabInfo = {
    labNameAr: contextLabInfo?.labNameAr || LAB_NAME_AR,
    labNameEn: contextLabInfo?.labNameEn || 'RT Diagnostic Laboratories',
    sloganAr: contextLabInfo?.sloganAr || 'التشخيص الصحيح يبدأ معنا',
    sloganEn: contextLabInfo?.sloganEn || 'Accurate Diagnosis Starts With Us',
    supervisionAr: contextLabInfo?.supervisionAr || 'أطباء واستشاريو كلية طب قصر العيني',
    supervisionEn: contextLabInfo?.supervisionEn || 'Kasr Al Ainy Clinical Pathology Consultants',
    accreditation: contextLabInfo?.accreditation || 'ISO 15189 Certified',
    hotline: contextLabInfo?.hotline || branchObj?.phones?.[0] || LAB_PHONE,
    phone: contextLabInfo?.phone || branchObj?.phones?.[1] || LAB_PHONE_SECONDARY,
    whatsapp: contextLabInfo?.whatsapp || branchObj?.whatsapp || LAB_WHATSAPP,
    mainAddress: contextLabInfo?.mainAddress || branchObj?.address || BRANCH_MAIN_ADDRESS,
    instapay: contextLabInfo?.instapay || INSTAPAY_IPA,
    vodafoneCash: contextLabInfo?.vodafoneCash || WALLET_VODAFONE
  };

  const phonesDisplay = [resolvedLabInfo.hotline, resolvedLabInfo.phone].filter(Boolean).join(' — ');

  // Linked Patient Loyalty Profile lookup
  const normPhone = normalizePhoneKey(invoice.patientPhone);
  const loyaltyProfile = loyaltyProfiles.find(
    (prof) =>
      (normPhone && normalizePhoneKey(prof.phone) === normPhone) ||
      (invoice.barcode && prof.barcode === invoice.barcode)
  );

  const currentTier = loyaltyProfile ? resolveProfileTier(loyaltyProfile, loyaltyConfig) : 'Silver';
  const tierPalette = getTierPalette(currentTier);
  const tierDiscountPct = loyaltyProfile ? tierDiscountRate(currentTier, loyaltyConfig) : 0;
  const loyaltyCashInfo = loyaltyProfile ? pointsCashValue(loyaltyProfile.totalPoints || 0, loyaltyConfig) : null;
  const loyaltyCardCode = loyaltyProfile
    ? (loyaltyProfile.cardNumber || loyaltyProfile.barcode)
    : undefined;

  const invNorm = normalizeInvoiceRef(invoice.invoiceNumber);
  const labNorm = normalizeInvoiceRef(invoice.labNumber);
  const confirmedTx = loyaltyProfile?.transactions?.find(
    (t) =>
      t.type === 'earn' &&
      t.points > 0 &&
      ((t.invoiceNumber && (normalizeInvoiceRef(t.invoiceNumber) === invNorm || normalizeInvoiceRef(t.invoiceNumber) === labNorm)) ||
        (t.reportNumber && normalizeInvoiceRef(t.reportNumber) === labNorm))
  );

  const visitFee = Number(invoice.visitFee) || 0;
  const testsSubtotal = invoice.testsSubtotal !== undefined
    ? (Number(invoice.testsSubtotal) || 0)
    : Math.max(0, (Number(invoice.subtotal) || 0) - visitFee);
  const paidTestsOnly = calculateTestsOnlyPaidAmount(invoice, loyaltyConfig);
  const invoiceEarnedPoints = confirmedTx?.points ?? invoice.loyaltyPointsEarned ?? pointsForAmount(paidTestsOnly, loyaltyConfig);
  const paymentMethodLabel = PAYMENT_METHOD_AR[invoice.paymentMethod] || 'نقدي';

  const dateObj = new Date(invoice.createdAt);
  const sampleDateFormatted = Number.isNaN(dateObj.getTime())
    ? new Date().toLocaleDateString('en-GB')
    : `${dateObj.toLocaleDateString('en-GB')} - ${dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;

  const matchingReport = reports.find(
    (r) =>
      (r.invoiceId && (r.invoiceId === invoice.id || r.invoiceId === invoice.invoiceNumber)) ||
      (invoice.labNumber && (r.reportNumber === invoice.labNumber || r.patient?.labNumber === invoice.labNumber)) ||
      (invoice.barcode && r.patient?.barcode === invoice.barcode)
  );
  const repName = invoice.isHomeVisit || invoice.bookingType === 'home_visit'
    ? invoice.visitSpecialist
    : invoice.branchRepresentative;

  const persistInvoiceEdits = (params: {
    nextItems?: InvoiceTestItem[];
    nextTestsSubtotal?: number;
    nextVisitFee?: number;
    nextDiscount?: number;
    nextPaidAmount?: number;
    nextDisplayMode?: 'detailed' | 'grouped';
    nextGroupedTitleAr?: string;
  }) => {
    const nextTests = params.nextItems ?? (invoice.tests || []);
    const nextTestsSub = params.nextTestsSubtotal !== undefined ? Math.max(0, params.nextTestsSubtotal) : testsSubtotal;
    const nextFee = params.nextVisitFee !== undefined ? Math.max(0, params.nextVisitFee) : visitFee;
    const nextDisc = params.nextDiscount !== undefined ? Math.max(0, params.nextDiscount) : (Number(invoice.discount) || 0);
    const nextSub = nextTestsSub + nextFee;
    const nextNet = Math.max(0, nextSub - nextDisc);
    const basePaid = params.nextPaidAmount !== undefined ? params.nextPaidAmount : (Number(invoice.paidAmount) || 0);
    const adjustedPaid = Math.max(0, Math.min(basePaid, nextNet));
    const nextRem = Math.max(0, nextNet - adjustedPaid);
    const nextMode = params.nextDisplayMode ?? displayMode;
    const nextGTitle = params.nextGroupedTitleAr !== undefined ? params.nextGroupedTitleAr : groupedTitleAr;

    updateIncomeRecord(invoice.id, {
      tests: nextTests,
      testsSubtotal: nextTestsSub,
      subtotal: nextSub,
      visitFee: nextFee,
      discount: nextDisc,
      discountApplied: nextDisc,
      netAmount: nextNet,
      paidAmount: adjustedPaid,
      remainingAmount: nextRem,
      paymentStatus: nextRem === 0 ? 'paid' : adjustedPaid > 0 ? 'partial' : 'unpaid',
      invoiceDisplayMode: nextMode,
      invoiceGroupedTitleAr: nextGTitle
    });

    if (matchingReport) {
      updateReport(matchingReport.id, {
        customInvoiceItems: nextTests,
        invoiceDisplayMode: nextMode,
        invoiceGroupedTitleAr: nextGTitle,
        patient: {
          ...matchingReport.patient,
          testsSubtotal: nextTestsSub,
          visitFee: nextFee,
          discountApplied: nextDisc,
          totalCost: nextNet,
          paidAmount: adjustedPaid,
          remainingAmount: nextRem
        } as any
      });
    }
  };

  const handleToggleDisplayMode = (nextMode: 'detailed' | 'grouped') => {
    setDisplayMode(nextMode);
    persistInvoiceEdits({ nextDisplayMode: nextMode });
  };

  const handleUpdateItemField = (index: number, patch: Partial<InvoiceTestItem>) => {
    const nextItems = (invoice.tests || []).map((t, i) => (i === index ? { ...t, ...patch } : t));
    const summed = nextItems.reduce((sum, t) => sum + (Number(t.price) || 0), 0);
    persistInvoiceEdits({
      nextItems,
      nextTestsSubtotal: displayMode === 'detailed' ? summed : testsSubtotal
    });
  };

  const handleDeleteItem = (index: number) => {
    const nextItems = (invoice.tests || []).filter((_, i) => i !== index);
    const summed = nextItems.reduce((sum, t) => sum + (Number(t.price) || 0), 0);
    persistInvoiceEdits({
      nextItems,
      nextTestsSubtotal: displayMode === 'detailed' ? summed : testsSubtotal
    });
  };

  const handleAddCustomItem = () => {
    const label = newItemName.trim();
    if (!label) return;
    const priceNum = Math.max(0, Number(newItemPrice) || 0);
    const added: InvoiceTestItem = {
      id: `custom-${Date.now()}`,
      code: 'CUSTOM',
      nameAr: label,
      nameEn: label,
      category: 'فحص مضاف',
      sampleType: 'Serum',
      price: priceNum
    };
    const nextItems = [...(invoice.tests || []), added];
    const summed = nextItems.reduce((sum, t) => sum + (Number(t.price) || 0), 0);
    setNewItemName('');
    setNewItemPrice('');
    persistInvoiceEdits({
      nextItems,
      nextTestsSubtotal: displayMode === 'detailed' ? summed : testsSubtotal + priceNum
    });
  };

  const buildExportPayload = (): InvoiceExportPayload => ({
    invoiceNumber: invoice.invoiceNumber,
    labNumber: invoice.labNumber,
    barcode: invoice.barcode,
    patientName: invoice.patientName,
    patientPhone: invoice.patientPhone,
    ageText: `${invoice.patientAge || 30} سنة`,
    genderText: invoice.patientGender === 'female' ? 'أنثى' : 'ذكر',
    referringDoctor: invoice.referringDoctor || 'طلب فحص ذاتي (Self-Request)',
    sampleDateFormatted,
    reportingDateFormatted: matchingReport?.patient?.reportingDate
      ? new Date(matchingReport.patient.reportingDate).toLocaleDateString('en-GB')
      : 'خلال 24 ساعة',
    branchName: branchObj?.nameAr || invoice.branch || 'الفرع الرئيسي - بهتيم',
    representativeLabel: invoice.isHomeVisit || invoice.bookingType === 'home_visit' ? 'مندوب الزيارة المنزلية' : 'مندوب استقبال الفرع',
    representativeName: repName,
    items: (invoice.tests || []).map((t) => ({
      titleAr: t.nameAr || t.nameEn,
      titleEn: t.nameEn,
      code: t.code,
      category: t.category,
      sampleType: t.sampleType || 'Serum',
      price: Number(t.price) || 0
    })),
    testsSubtotal,
    visitFee,
    discount: Number(invoice.discount) || 0,
    netTotal: Number(invoice.netAmount) || 0,
    paidAmount: Number(invoice.paidAmount) || 0,
    remainingAmount: Number(invoice.remainingAmount) || 0,
    paymentMethodLabel,
    cashierName: invoice.cashierName || 'الاستقبال والخزينة',
    labInfo: resolvedLabInfo,
    loyaltyProfile,
    loyaltyConfig,
    invoiceEarnedPoints,
    isEarnedConfirmed: Boolean(confirmedTx),
    displayMode,
    groupedTitleAr
  });

  const handlePrint = () => {
    if (printLayout === 'standard') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(buildInvoicePrintDocumentHTML(buildExportPayload()));
        printWindow.document.close();
        return;
      }
    }
    window.print();
  };

  const handleDownloadPNG = async () => {
    try {
      setIsExporting('png');
      await exportInvoiceAsPNG(buildExportPayload(), false);
      setExportNotice('✅ تم تحميل صورة الفاتورة شاملة كارت الولاء بصيغة PNG عالية الدقة.');
      setTimeout(() => setExportNotice(null), 4500);
    } catch (err) {
      console.error('PNG export error:', err);
      setExportNotice('تعذر إنشاء صورة PNG — يمكنك استخدام زر الطباعة الفورية.');
    } finally {
      setIsExporting(null);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setIsExporting('pdf');
      await exportInvoiceAsPDF(buildExportPayload());
      setExportNotice('✅ تم تحميل ملف الفاتورة الرسمي (PDF) شاملاً كارت الولاء.');
      setTimeout(() => setExportNotice(null), 4500);
    } catch (err) {
      console.error('PDF export error:', err);
      window.print();
    } finally {
      setIsExporting(null);
    }
  };

  const handleDownloadBoth = async () => {
    try {
      setIsExporting('both');
      const payload = buildExportPayload();
      await exportInvoiceAsPNG(payload, false);
      await exportInvoiceAsPDF(payload);
      setExportNotice('✅ تم تحميل النسختين معاً (صورة PNG + ملف PDF) شاملتين لكارت الولاء.');
      setTimeout(() => setExportNotice(null), 5500);
    } catch (err) {
      console.error('Both export error:', err);
      setExportNotice('تعذر تصدير النسختين — جرب التصدير الفردي أو الطباعة.');
    } finally {
      setIsExporting(null);
    }
  };

  const handleSendWhatsAppInvoice = async () => {
    try {
      setIsExporting('wa');
      const payload = buildExportPayload();
      const { copied } = await exportInvoiceAsPNG(payload, false);
      const text = formatInvoiceWhatsAppMessage({
        invoiceNumber: invoice.invoiceNumber,
        labNumber: invoice.labNumber,
        barcode: invoice.barcode,
        patientName: invoice.patientName,
        sampleDate: sampleDateFormatted,
        reportingDate: payload.reportingDateFormatted,
        branchName: payload.branchName,
        items: (invoice.tests || []).map((t) => ({ titleAr: t.nameAr || t.nameEn, titleEn: t.nameEn, price: Number(t.price) || 0 })),
        testsSubtotal,
        visitFee,
        discount: Number(invoice.discount) || 0,
        netTotal: Number(invoice.netAmount) || 0,
        paidAmount: Number(invoice.paidAmount) || 0,
        remainingAmount: Number(invoice.remainingAmount) || 0,
        paymentMethodLabel,
        loyaltyProfile,
        loyaltyConfig,
        invoiceEarnedPoints,
        labInfo: resolvedLabInfo,
        displayMode,
        groupedTitleAr
      });
      openWhatsApp(invoice.patientPhone || '', text);
      setExportNotice(
        copied
          ? '✅ تم تحميل صورة الفاتورة بالكارت ونسخها للحافظة (الصقها Ctrl+V في واتساب) وفتح رسالة المريض.'
          : '✅ تم تحميل صورة الفاتورة بالكارت وفتح رسالة الواتساب — أرفق الصورة المحمّلة في المحادثة.'
      );
      setTimeout(() => setExportNotice(null), 6500);
    } catch (err) {
      console.error('WhatsApp invoice export error:', err);
    } finally {
      setIsExporting(null);
    }
  };

  // Build patient object for ClientEditModal
  const currentPatient: Patient = {
    id: invoice.id,
    fullName: invoice.patientName,
    phone: invoice.patientPhone || '',
    age: invoice.patientAge || 30,
    ageUnit: 'years',
    gender: (invoice.patientGender as any) || 'male',
    labNumber: invoice.labNumber,
    barcode: invoice.barcode,
    sampleDate: (invoice as any).date || (invoice.createdAt ? invoice.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
    reportingDate: (invoice as any).date || (invoice.createdAt ? invoice.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
    referringDoctorTitle: 'Dr.',
    referringDoctorName: invoice.referringDoctor,
    totalCost: invoice.netAmount,
    discountApplied: invoice.discount
  };

  const barcodeSvgHtml = generateBarcodeSVG(invoice.barcode, 230, 48, true);
  const stickerSvgHtml = generateBarcodeSVG(invoice.barcode, 180, 40, true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto print:static print:bg-white print:p-0 print:m-0 print:overflow-visible print:block print:w-full print:h-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full my-auto overflow-hidden print:border-none print:shadow-none print:rounded-none print:m-0 print:p-0 print:w-full print:max-w-none print:bg-white">

        {/* Modal Controls Bar (Hidden during print) */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm">
              {language === 'ar' ? 'فاتورة المريض الذكية وكارت الولاء' : 'Patient Invoice & Loyalty Card'}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Edit Client Data */}
            <button
              type="button"
              onClick={() => setIsClientModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="تعديل بيانات العميل / المريض"
            >
              <User className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden md:inline">بيانات العميل</span>
            </button>

            {/* Edit Lab Info */}
            <button
              type="button"
              onClick={() => setIsLabModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="تعديل بيانات المعمل والفاتورة والعنوان"
            >
              <Building2 className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden md:inline">بيانات المعمل</span>
            </button>

            {/* Layout switch */}
            <div className="flex bg-slate-800 p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setPrintLayout('standard')}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                  printLayout === 'standard' ? 'bg-rose-900 text-white font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                {language === 'ar' ? 'A4' : 'Standard'}
              </button>
              <button
                type="button"
                onClick={() => setPrintLayout('thermal')}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                  printLayout === 'thermal' ? 'bg-rose-900 text-white font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                {language === 'ar' ? 'حراري' : 'Thermal'}
              </button>
              <button
                type="button"
                onClick={() => setPrintLayout('tube_sticker')}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                  printLayout === 'tube_sticker' ? 'bg-rose-900 text-white font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                {language === 'ar' ? 'استيكر' : 'Tube'}
              </button>
            </div>

            <button
              type="button"
              onClick={handleSendWhatsAppInvoice}
              disabled={isExporting !== null}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black rounded-lg transition-colors shadow-sm cursor-pointer"
              title="تحميل صورة الفاتورة مع الكارت وإرسال التفاصيل للمريض عبر واتساب"
            >
              {isExporting === 'wa' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>واتساب + صورة</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPNG}
              disabled={isExporting !== null}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
              title="تحميل الفاتورة كصورة PNG"
            >
              {isExporting === 'png' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
              <span>PNG</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isExporting !== null}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-800 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
              title="تحميل الفاتورة كملف PDF"
            >
              {isExporting === 'pdf' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
              <span>PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadBoth}
              disabled={isExporting !== null}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-700 hover:bg-indigo-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
              title="تحميل الصيغتين معاً (PNG + PDF)"
            >
              {isExporting === 'both' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Layers className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">PNG+PDF</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1 px-3 py-1.5 bg-rose-700 hover:bg-rose-900 text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'طباعة' : 'Print'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Display Mode (Detailed vs Grouped) & Price/Row Edit Toolbar (Hidden during print) */}
        <div className="bg-slate-800 border-b border-slate-700 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-white print:hidden">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-slate-300 ml-1">عرض التحاليل بالفاتورة:</span>
            <button
              type="button"
              onClick={() => handleToggleDisplayMode('detailed')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer border ${
                displayMode === 'detailed'
                  ? 'bg-rose-700 text-white border-rose-500 shadow-xs'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <ListChecks className="w-3.5 h-3.5" />
              <span>سرد مفصل (كل تحليل بسعره)</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleDisplayMode('grouped')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer border ${
                displayMode === 'grouped'
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-xs'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <PackageCheck className="w-3.5 h-3.5" />
              <span>مجمعة بسعر إجمالي</span>
            </button>
          </div>

          {printLayout !== 'tube_sticker' && (
            <button
              type="button"
              onClick={() => setIsEditingItems(prev => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer border ${
                isEditingItems
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                  : 'bg-slate-900 text-amber-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditingItems ? 'إنهاء تعديل البنود والأسعار ✓' : 'تعديل الأسعار أو حذف خانات'}</span>
            </button>
          )}
        </div>

        {exportNotice && (
          <div className="bg-emerald-50 border-b border-emerald-300 px-6 py-2 text-xs font-bold text-emerald-900 print:hidden">
            {exportNotice}
          </div>
        )}

        {/* Printable Area */}
        <div className="p-4 sm:p-7 max-h-[82vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0 bg-slate-50/70 print:bg-white">

          {/* LAYOUT 1: EXECUTIVE STANDARD INVOICE */}
          {printLayout === 'standard' && (
            <div className="printable-content bg-white text-slate-900 border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-sm print:border-none print:shadow-none print:p-0">
              {/* Header Letterhead */}
              <div className="border-b-2 border-rose-900 pb-4 mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <h1 className="text-xl font-black text-rose-950 tracking-tight">
                    {resolvedLabInfo.labNameAr}
                  </h1>
                  <div className="text-xs font-bold text-slate-800">
                    {resolvedLabInfo.supervisionAr}
                  </div>
                  <div className="text-[11px] text-slate-700 font-semibold">
                    📞 الخط الساخن والهاتف: <strong className="font-mono text-slate-900">{phonesDisplay}</strong> | 💬 واتساب: <strong className="font-mono text-emerald-800">{resolvedLabInfo.whatsapp}</strong>
                  </div>
                  <div className="text-[10.5px] text-slate-600 font-semibold">
                    📍 {branchObj?.nameAr || invoice.branch} — {resolvedLabInfo.mainAddress}
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <RTLogo size="sm" showSlogan={false} theme="light" />
                  <div className="text-[10px] text-slate-500 font-mono mt-1 font-bold">{resolvedLabInfo.accreditation}</div>
                  <div className="text-[11px] text-rose-900 font-black font-mono mt-0.5">{invoice.invoiceNumber}</div>
                </div>
              </div>

              <div className="flex h-1 w-full mb-4 rounded-full overflow-hidden">
                <div className="w-3/4 bg-rose-900"></div>
                <div className="w-1/4 bg-slate-900"></div>
              </div>

              {/* Invoice Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl text-xs mb-4 border border-slate-200">
                <div>
                  <span className="text-slate-500 block">رقم الفاتورة:</span>
                  <span className="font-bold font-mono text-slate-900">{invoice.invoiceNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">كود المعمل (Lab No):</span>
                  <span className="font-bold font-mono text-rose-900">{invoice.labNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">التاريخ والوقت:</span>
                  <span className="font-semibold text-slate-800 font-mono">{sampleDateFormatted}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">الفرع / الخزينة:</span>
                  <span className="font-semibold text-slate-800">{branchObj?.nameAr || invoice.branch}</span>
                </div>
              </div>

              {/* Patient Details + Barcode */}
              <div className="bg-slate-50 p-3.5 rounded-xl text-xs mb-4 border border-slate-200 flex flex-wrap justify-between items-center gap-3">
                <div className="space-y-1">
                  <div>
                    <span className="text-slate-500">اسم المريض: </span>
                    <span className="font-black text-slate-900 text-sm">{invoice.patientName}</span>
                  </div>
                  <div className="text-slate-700">
                    <span>السن: {invoice.patientAge} سنة</span>
                    <span className="mx-2">·</span>
                    <span>النوع: {invoice.patientGender === 'male' ? 'ذكر' : 'أنثى'}</span>
                    <span className="mx-2">·</span>
                    <span>الهاتف: <strong className="font-mono">{invoice.patientPhone || '—'}</strong></span>
                  </div>
                  <div className="text-slate-600">
                    <span>الطبيب المعالج: {invoice.referringDoctor || 'فحص ذاتي / معملي'}</span>
                    {repName && (
                      <>
                        <span className="mx-2">·</span>
                        <span>{invoice.isHomeVisit ? 'مندوب السحب: ' : 'الاستقبال: '}<strong>{repName}</strong></span>
                      </>
                    )}
                  </div>
                </div>

                {/* Barcode representation */}
                <div className="text-center bg-white border border-slate-200 rounded-lg p-2">
                  <div dangerouslySetInnerHTML={{ __html: barcodeSvgHtml }} />
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">{invoice.barcode}</div>
                </div>
              </div>

              {/* Tests Table (Detailed vs Grouped + Optional Inline Editor) */}
              <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-black border-b border-slate-200">
                      <th className="py-2.5 px-3 text-right">#</th>
                      <th className="py-2.5 px-3 text-right">كود التحليل</th>
                      <th className="py-2.5 px-3 text-right">اسم الفحص الطبي المطلوب</th>
                      <th className="py-2.5 px-3 text-right">القسم التشخيصي</th>
                      <th className="py-2.5 px-3 text-left">
                        <div className="inline-flex items-center gap-1">
                          <span>السعر (ج.م)</span>
                          {!isEditingItems && (
                            <button
                              type="button"
                              onClick={() => setIsEditingItems(true)}
                              className="p-0.5 text-rose-700 hover:text-rose-900 rounded cursor-pointer print:hidden"
                              title="اضغط لتعديل الأسعار أو حذف خانات"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </th>
                      {isEditingItems && <th className="py-2.5 px-2 text-center w-12 print:hidden">حذف</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayMode === 'grouped' && !isEditingItems ? (
                      <tr className="bg-white">
                        <td className="py-3 px-3 text-slate-500 font-mono align-top">1</td>
                        <td className="py-3 px-3 font-mono font-semibold text-rose-900 align-top">GROUPED</td>
                        <td className="py-3 px-3">
                          <div className="font-black text-slate-900 text-[13px]">
                            {groupedTitleAr.trim() || `مجموعة الفحوصات والتحاليل الطبية (${(invoice.tests || []).length})`}
                          </div>
                          {(invoice.tests || []).length > 0 && (
                            <div className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                              تشمل: {(invoice.tests || []).map(t => t.nameAr || t.nameEn).join(' • ')}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-600 align-top">فحوصات مجمعة</td>
                        <td
                          onClick={() => setIsEditingItems(true)}
                          className="py-3 px-3 text-left font-mono font-black text-rose-950 text-[13px] align-top cursor-pointer hover:bg-amber-50/70 transition-colors"
                          title="اضغط لتعديل السعر الإجمالي أو تفاصيل البنود"
                        >
                          {testsSubtotal.toFixed(2)}
                        </td>
                      </tr>
                    ) : (
                      (invoice.tests || []).map((test, index) => (
                        <tr key={test.id || index} className="odd:bg-white even:bg-slate-50/50">
                          <td className="py-2.5 px-3 text-slate-500 font-mono">{index + 1}</td>
                          <td className="py-2.5 px-3 font-mono font-semibold text-rose-900">{test.code}</td>
                          <td className="py-2.5 px-3">
                            {isEditingItems ? (
                              <input
                                type="text"
                                value={test.nameAr || test.nameEn}
                                onChange={(e) => handleUpdateItemField(index, { nameAr: e.target.value })}
                                className="w-full px-2 py-1 text-xs font-bold border border-slate-300 rounded bg-white text-slate-900"
                              />
                            ) : (
                              <>
                                <div className="font-bold text-slate-900">{test.nameAr}</div>
                                {test.nameEn && <div className="text-[10px] text-slate-500 font-mono" dir="ltr">{test.nameEn}</div>}
                              </>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">{test.category}</td>
                          <td
                            onClick={!isEditingItems ? () => setIsEditingItems(true) : undefined}
                            className={`py-2.5 px-3 text-left font-mono font-bold text-rose-950 ${!isEditingItems ? 'cursor-pointer hover:bg-amber-50/70 transition-colors' : ''}`}
                            title={!isEditingItems ? 'اضغط لتعديل السعر' : undefined}
                          >
                            {isEditingItems ? (
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={Number(test.price) === 0 ? '' : test.price}
                                placeholder="0"
                                onFocus={(e) => e.currentTarget.select()}
                                onChange={(e) => handleUpdateItemField(index, { price: Math.max(0, Number(e.target.value) || 0) })}
                                className="w-24 px-2 py-1 text-left font-mono font-bold border border-rose-300 rounded bg-rose-50/50 text-rose-950"
                              />
                            ) : (
                              (Number(test.price) || 0).toFixed(2)
                            )}
                          </td>
                          {isEditingItems && (
                            <td className="py-2.5 px-2 text-center print:hidden">
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(index)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-md cursor-pointer transition-colors"
                                title="حذف هذا البند من الفاتورة"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {isEditingItems && (
                  <div className="bg-amber-50/70 border-t border-amber-200 p-3 space-y-2.5 print:hidden">
                    {displayMode === 'grouped' && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center bg-white p-2.5 rounded-lg border border-indigo-200">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-indigo-900 mb-0.5">
                            عنوان البند المجمع بالفاتورة:
                          </label>
                          <input
                            type="text"
                            value={groupedTitleAr}
                            onChange={(e) => {
                              setGroupedTitleAr(e.target.value);
                              persistInvoiceEdits({ nextGroupedTitleAr: e.target.value });
                            }}
                            placeholder={`مجموعة الفحوصات والتحاليل الطبية (${(invoice.tests || []).length})`}
                            className="w-full px-2.5 py-1.5 text-xs font-bold border border-indigo-300 rounded bg-white text-slate-900"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="block text-[10px] font-bold text-indigo-900">
                              السعر الإجمالي المجمع (ج.م):
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                const summed = (invoice.tests || []).reduce((s, t) => s + (Number(t.price) || 0), 0);
                                persistInvoiceEdits({ nextTestsSubtotal: summed });
                              }}
                              className="text-[10px] font-bold text-indigo-700 hover:underline cursor-pointer"
                            >
                              حساب من البنود
                            </button>
                          </div>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={testsSubtotal === 0 ? '' : testsSubtotal}
                            placeholder="0"
                            onFocus={(e) => e.currentTarget.select()}
                            onChange={(e) => persistInvoiceEdits({ nextTestsSubtotal: Math.max(0, Number(e.target.value) || 0) })}
                            className="w-full px-2.5 py-1.5 text-xs font-mono font-black border border-indigo-300 rounded bg-indigo-50/50 text-rose-950"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="إضافة بند أو تحليل جديد بالفاتورة..."
                        className="flex-1 min-w-[180px] px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                      <input
                        type="number"
                        min="0"
                        value={newItemPrice}
                        onChange={(e) => setNewItemPrice(e.target.value)}
                        placeholder="السعر (ج.م)"
                        className="w-28 px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded-lg bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomItem}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إضافة للفاتورة</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Integrated Patient Loyalty Card & Points Panel */}
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
                    {redemptionSummaryText(loyaltyConfig)} · الترقية التراكمية تلقائياً مع كل حجز بنفس الهاتف
                  </div>
                </div>
              )}

              {/* Financial Summary + Payment Channels */}
              <div className="flex flex-col sm:flex-row justify-between items-stretch gap-4 mb-5">
                <div className="flex-1 flex flex-col justify-between gap-3">
                  <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3 text-xs text-rose-950 space-y-1">
                    <div className="font-bold flex items-center gap-1 text-rose-900">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>تنبيهات استلام النتائج والولاء:</span>
                    </div>
                    <ul className="text-[11px] list-disc list-inside space-y-0.5 text-rose-900/90 pr-1">
                      <li>يُرجى الاحتفاظ بهذا الإيصال أو رقم الكارت عند استلام النتائج أو الحجز القادم.</li>
                      <li>يتم إرسال التقارير المعتمدة PDF عبر واتساب ({resolvedLabInfo.whatsapp}).</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-[11px] text-blue-950">
                    <div className="font-black text-blue-900 mb-1">💳 قنوات الدفع والتحويل الإلكتروني المعتمدة:</div>
                    <div className="font-mono font-bold space-y-0.5">
                      <div>InstaPay: <span className="text-slate-900">{resolvedLabInfo.instapay}</span></div>
                      <div>Vodafone Cash: <span className="text-slate-900">{resolvedLabInfo.vodafoneCash}</span></div>
                    </div>
                  </div>
                </div>

                <div className="w-full sm:w-72 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between items-center text-slate-600 gap-2">
                    <span>إجمالي التحاليل:</span>
                    {isEditingItems ? (
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={testsSubtotal === 0 ? '' : testsSubtotal}
                        placeholder="0"
                        onFocus={(e) => e.currentTarget.select()}
                        onChange={(e) => persistInvoiceEdits({ nextTestsSubtotal: Math.max(0, Number(e.target.value) || 0) })}
                        className="w-24 px-2 py-0.5 text-left font-mono font-semibold border border-slate-300 rounded bg-white text-slate-900"
                      />
                    ) : (
                      <span className="font-mono font-semibold">{testsSubtotal.toFixed(2)} ج.م</span>
                    )}
                  </div>
                  {(invoice.discount > 0 || isEditingItems) && (
                    <div className="flex justify-between items-center text-emerald-700 font-semibold gap-2">
                      <span>الخصم (على التحاليل):</span>
                      {isEditingItems ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={invoice.discount === 0 ? '' : invoice.discount}
                            placeholder="0"
                            onFocus={(e) => e.currentTarget.select()}
                            onChange={(e) => persistInvoiceEdits({ nextDiscount: Math.max(0, Number(e.target.value) || 0) })}
                            className="w-20 px-2 py-0.5 text-left font-mono font-bold border border-emerald-300 rounded bg-white text-emerald-900"
                          />
                          {invoice.discount > 0 && (
                            <button
                              type="button"
                              onClick={() => persistInvoiceEdits({ nextDiscount: 0 })}
                              className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer print:hidden"
                              title="حذف الخصم"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="font-mono">-{invoice.discount.toFixed(2)} ج.م</span>
                      )}
                    </div>
                  )}
                  {(visitFee > 0 || isEditingItems) && (
                    <div className="pt-1 border-t border-dashed border-slate-200 space-y-0.5">
                      <div className="flex justify-between items-center text-indigo-800 font-bold gap-2">
                        <span>رسوم الزيارة المنزلية:</span>
                        {isEditingItems ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={visitFee === 0 ? '' : visitFee}
                              placeholder="0"
                              onFocus={(e) => e.currentTarget.select()}
                              onChange={(e) => persistInvoiceEdits({ nextVisitFee: Math.max(0, Number(e.target.value) || 0) })}
                              className="w-20 px-2 py-0.5 text-left font-mono font-bold border border-indigo-300 rounded bg-white text-indigo-900"
                            />
                            {visitFee > 0 && (
                              <button
                                type="button"
                                onClick={() => persistInvoiceEdits({ nextVisitFee: 0 })}
                                className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer print:hidden"
                                title="حذف رسوم الزيارة"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="font-mono">+{visitFee.toFixed(2)} ج.م</span>
                        )}
                      </div>
                      {visitFee > 0 && (
                        <div className="text-[10px] text-slate-500 flex justify-between">
                          <span>(ثابتة غير خاضعة للخصم)</span>
                          {invoice.visitSpecialist && <span className="truncate max-w-[140px] font-semibold">{invoice.visitSpecialist}</span>}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-slate-900 pt-1.5 border-t border-slate-300">
                    <span>الصافي المطلوب:</span>
                    <span className="font-mono text-rose-950 font-black">{invoice.netAmount.toFixed(2)} ج.م</span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-700 font-bold gap-2">
                    <span>المدفوع ({paymentMethodLabel}):</span>
                    {isEditingItems ? (
                      <input
                        type="number"
                        min="0"
                        step="any"
                        max={invoice.netAmount}
                        value={invoice.paidAmount === 0 ? '' : invoice.paidAmount}
                        placeholder="0"
                        onFocus={(e) => e.currentTarget.select()}
                        onChange={(e) => persistInvoiceEdits({ nextPaidAmount: Math.max(0, Number(e.target.value) || 0) })}
                        className="w-24 px-2 py-0.5 text-left font-mono font-bold border border-emerald-300 rounded bg-white text-emerald-800"
                      />
                    ) : (
                      <span className="font-mono">{invoice.paidAmount.toFixed(2)} ج.م</span>
                    )}
                  </div>
                  <div className="flex justify-between text-slate-900 font-bold pt-1 border-t border-slate-200">
                    <span>{invoice.remainingAmount > 0 ? 'المتبقي:' : 'حالة الحساب:'}</span>
                    <span className={`font-mono ${invoice.remainingAmount > 0 ? 'text-rose-600 font-bold' : 'text-emerald-700'}`}>
                      {invoice.remainingAmount > 0 ? `${invoice.remainingAmount.toFixed(2)} ج.م` : 'مسدد بالكامل ✓'}
                    </span>
                  </div>
                  <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2 text-[10.5px] font-black text-rose-950">
                    فقط: {tafqeetEGP(invoice.netAmount)}
                  </div>
                </div>
              </div>

              {/* Signatures & Official Stamp Grid */}
              <div className="grid grid-cols-3 gap-4 items-center my-4 pt-3 border-t border-slate-200 text-xs">
                <div className="text-center p-2.5 border border-slate-200 rounded-xl bg-slate-50/60">
                  <div className="text-slate-500 font-bold text-[11px] mb-1">المحاسب / مسؤول الخزينة</div>
                  <div className="font-bold text-slate-800 text-xs">{invoice.cashierName || 'قسم الاستقبال والخزينة'}</div>
                  <div className="text-[10px] font-mono text-slate-400 mt-2 border-t border-dashed border-slate-300 pt-1">توقيع الموظف المعتمد</div>
                </div>

                <div className="flex justify-center">
                  <div className="w-24 h-24 rounded-full border-2 border-dashed border-rose-900/60 p-1 flex items-center justify-center relative rotate-[-5deg] select-none opacity-90">
                    <div className="w-full h-full rounded-full border border-rose-900 flex flex-col items-center justify-center text-center p-1 text-rose-900 bg-rose-50/40">
                      <div className="text-[8px] font-black uppercase tracking-wider">RT Laboratories</div>
                      <div className="text-[9.5px] font-extrabold my-0.5">{invoice.remainingAmount > 0 ? 'PARTIAL' : 'PAID ✓'}</div>
                      <div className="text-[7px] font-bold">ISO 15189</div>
                      <div className="text-[7px] text-slate-600 mt-0.5">شبرا الخيمة • بهتيم</div>
                    </div>
                  </div>
                </div>

                <div className="text-center p-2.5 border border-slate-200 rounded-xl bg-slate-50/60">
                  <div className="text-slate-500 font-bold text-[11px] mb-1">الإشراف العلمي والإدارة</div>
                  <div className="font-bold text-slate-800 text-[11px]">{resolvedLabInfo.supervisionAr}</div>
                  <div className="text-[10px] font-mono text-slate-500 mt-2 border-t border-dashed border-slate-300 pt-1">{resolvedLabInfo.accreditation}</div>
                </div>
              </div>

              {/* Footer info */}
              <div className="border-t border-slate-200 pt-2.5 text-[10.5px] text-slate-500 flex flex-wrap justify-between items-center gap-2">
                <div>
                  فاتورة إلكترونية معتمدة — {resolvedLabInfo.labNameAr} | هاتف: {phonesDisplay} | واتساب: {resolvedLabInfo.whatsapp}
                </div>
                <div className="font-mono text-[10px]">RT-LAB-FIN-VERIFIED</div>
              </div>
            </div>
          )}

          {/* LAYOUT 2: THERMAL RECEIPT (80mm) */}
          {printLayout === 'thermal' && (
            <div className="printable-content max-w-[330px] mx-auto bg-white p-4 font-mono text-xs border border-dashed border-slate-300 rounded print:border-none print:p-0">
              <div className="text-center pb-2 border-b border-dashed border-slate-400">
                <div className="font-black text-sm">{resolvedLabInfo.labNameAr}</div>
                <div className="text-[10px]">{resolvedLabInfo.supervisionAr}</div>
                <div className="text-[10px] font-semibold mt-0.5">{branchObj?.nameAr || invoice.branch}</div>
                <div className="text-[9.5px]">{resolvedLabInfo.mainAddress}</div>
                <div className="text-[10px] font-bold mt-0.5">هاتف: {phonesDisplay} | واتساب: {resolvedLabInfo.whatsapp}</div>
              </div>

              <div className="py-2 text-[11px] border-b border-dashed border-slate-400 space-y-0.5">
                <div>فاتورة: <span className="font-bold">{invoice.invoiceNumber}</span></div>
                <div>كود العينة: <span className="font-bold">{invoice.labNumber}</span></div>
                <div>التاريخ: <span>{sampleDateFormatted}</span></div>
                <div>المريض: <span className="font-bold">{invoice.patientName}</span></div>
                <div>الهاتف: <span>{invoice.patientPhone || '—'}</span> | {invoice.patientAge} سنة</div>
              </div>

              <div className="py-2 border-b border-dashed border-slate-400">
                <div className="font-bold mb-1">التحاليل المطلوبة:</div>
                {displayMode === 'grouped' ? (
                  <div className="space-y-0.5 text-[11px]">
                    <div className="flex justify-between font-bold">
                      <span>{groupedTitleAr.trim() || `مجموعة الفحوصات (${(invoice.tests || []).length})`}</span>
                      <span>{testsSubtotal} ج</span>
                    </div>
                    {(invoice.tests || []).length > 0 && (
                      <div className="text-[10px] text-slate-700 leading-snug">
                        ({(invoice.tests || []).map(t => t.nameAr || t.nameEn).join(' + ')})
                      </div>
                    )}
                  </div>
                ) : (
                  (invoice.tests || []).map((t, idx) => (
                    <div key={idx} className="flex justify-between py-0.5 text-[11px]">
                      <span className="truncate max-w-[200px]">{t.nameAr}</span>
                      <span>{t.price} ج</span>
                    </div>
                  ))
                )}
              </div>

              <div className="py-2 text-[11px] space-y-1 border-b border-dashed border-slate-400">
                <div className="flex justify-between">
                  <span>إجمالي التحاليل:</span>
                  <span>{testsSubtotal} ج.م</span>
                </div>
                {invoice.discount > 0 && (
                  <div className="flex justify-between text-rose-700 font-bold">
                    <span>الخصم (تحاليل):</span>
                    <span>-{invoice.discount} ج.م</span>
                  </div>
                )}
                {visitFee > 0 && (
                  <div className="flex justify-between text-indigo-900 font-bold">
                    <span>رسوم الزيارة (ثابتة):</span>
                    <span>+{visitFee} ج.م</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-xs pt-1 border-t border-dashed border-slate-300">
                  <span>الصافي المطلوب:</span>
                  <span>{invoice.netAmount} ج.م</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>المدفوع ({paymentMethodLabel}):</span>
                  <span>{invoice.paidAmount} ج.م</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>المتبقي:</span>
                  <span>{invoice.remainingAmount > 0 ? `${invoice.remainingAmount} ج.م` : 'مسدد ✓'}</span>
                </div>
                <div className="pt-1 border-t border-dashed border-slate-300 text-[10px] font-bold">
                  فقط {tafqeetEGP(invoice.netAmount)}
                </div>
              </div>

              {/* Compact Loyalty Card Box on Thermal Receipt */}
              {loyaltyProfile && (
                <div className="py-2 border-b border-dashed border-slate-400 text-[10.5px] space-y-0.5 bg-slate-50 px-2 my-1 rounded">
                  <div className="font-black text-center">★ كارت الولاء الطبي الذكي ★</div>
                  <div>رقم الكارت: <span className="font-bold">{loyaltyCardCode}</span></div>
                  <div>الفئة: <span className="font-bold">{tierPalette.shortLabel} (خصم %{tierDiscountPct})</span></div>
                  <div>الرصيد: <span className="font-bold">{(loyaltyProfile.totalPoints || 0).toLocaleString()} نقطة (= {loyaltyCashInfo?.exactEGP || 0} ج.م)</span></div>
                  {invoiceEarnedPoints > 0 && (
                    <div>نقاط الفاتورة: <span className="font-bold">+{invoiceEarnedPoints} نقطة</span></div>
                  )}
                  <div className="text-[9.5px] text-slate-600 pt-0.5">كل 100 نقطة = {loyaltyConfig.egpPer100Points} ج.م خصم</div>
                </div>
              )}

              <div className="py-1.5 border-b border-dashed border-slate-400 text-[9.5px] text-center">
                <div>InstaPay: {resolvedLabInfo.instapay}</div>
                <div>Vodafone Cash: {resolvedLabInfo.vodafoneCash}</div>
              </div>

              <div className="pt-3 text-center">
                <div dangerouslySetInnerHTML={{ __html: barcodeSvgHtml }} />
                <div className="text-[10px] mt-1.5 font-bold">شكراً لثقتكم بمعامل RT</div>
              </div>
            </div>
          )}

          {/* LAYOUT 3: TUBE BARCODE STICKER (38x25mm / 50x25mm standard sample stickers) */}
          {printLayout === 'tube_sticker' && (
            <div className="printable-content max-w-[340px] mx-auto bg-white p-3 border border-slate-300 rounded print:border-none print:p-0">
              <div className="border border-slate-900 p-2 rounded text-slate-900 space-y-1">
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span>RT LAB</span>
                  <span>{invoice.labNumber}</span>
                </div>
                <div className="text-xs font-bold truncate">
                  {invoice.patientName}
                </div>
                <div className="text-[10px] text-slate-600 flex justify-between">
                  <span>{invoice.patientAge}Y / {invoice.patientGender.toUpperCase()}</span>
                  <span>{new Date(invoice.createdAt).toLocaleDateString('en-GB')}</span>
                </div>
                <div className="text-center py-1">
                  <div dangerouslySetInnerHTML={{ __html: stickerSvgHtml }} />
                </div>
                <div className="text-[9px] text-slate-700 truncate font-semibold">
                  {invoice.tests.map(t => t.code).join(', ')}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Edit Client Modal */}
      {isClientModalOpen && (
        <ClientEditModal
          isOpen={isClientModalOpen}
          onClose={() => setIsClientModalOpen(false)}
          patient={currentPatient}
          onSave={(updatedPatient) => {
            updateIncomeRecord(invoice.id, {
              patientName: updatedPatient.fullName,
              patientPhone: updatedPatient.phone,
              patientAge: updatedPatient.age,
              patientGender: updatedPatient.gender,
              referringDoctor: updatedPatient.referringDoctorName
            });
            const matchingRep = reports.find(r => r.patient.barcode === invoice.barcode || r.reportNumber === invoice.labNumber || r.invoiceId === invoice.id);
            if (matchingRep) {
              updateReport(matchingRep.id, {
                patient: {
                  ...matchingRep.patient,
                  ...updatedPatient
                }
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
          labInfo={resolvedLabInfo}
          onUpdateLabInfo={updateLabInfo}
          staffSignatures={staffSignatures}
          onUpdateStaffSignatures={updateStaffSignatures}
        />
      )}
    </div>
  );
};
