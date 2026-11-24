import type {
  IncomeRecord,
  LabInfo,
  LabReport,
  LoyaltyConfig,
  PatientLoyaltyProfile
} from '../types';
import { DEFAULT_LOYALTY_CONFIG } from '../data/catalog';
import { LAB_CATALOG } from '../data/labCatalog';
import { formatGenderAr } from './calculator';
import type { InvoiceExportItem, InvoiceExportPayload } from './invoiceExporter';
import {
  calculateTestsOnlyPaidAmount,
  normalizeInvoiceRef,
  normalizePhoneKey,
  pointsForAmount
} from './loyaltyEngine';
import {
  BRANCH_MAIN_ADDRESS,
  INSTAPAY_IPA,
  LAB_NAME_AR,
  LAB_PHONE,
  LAB_PHONE_SECONDARY,
  LAB_WHATSAPP,
  WALLET_VODAFONE
} from './whatsapp';

export interface ReportRenderOptions {
  includeInvoice?: boolean;
  incomeRecords?: IncomeRecord[];
  loyaltyProfiles?: PatientLoyaltyProfile[];
  loyaltyConfig?: LoyaltyConfig;
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

function readStorageJson<T>(keys: string[]): T | undefined {
  if (typeof window === 'undefined' || !window.localStorage) return undefined;
  for (const key of keys) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        return JSON.parse(raw) as T;
      }
    } catch {
      // Ignore storage parse error and try next key
    }
  }
  return undefined;
}

function getEffectiveIncomeRecords(options?: ReportRenderOptions): IncomeRecord[] {
  if (Array.isArray(options?.incomeRecords)) return options.incomeRecords;
  const cached = readStorageJson<IncomeRecord[]>([
    'rt_lab_unified_income_v3',
    'rt_lab_income_records_v3',
    'rt_lab_income_v1'
  ]);
  return Array.isArray(cached) ? cached : [];
}

function getEffectiveLoyaltyProfiles(options?: ReportRenderOptions): PatientLoyaltyProfile[] {
  if (Array.isArray(options?.loyaltyProfiles)) return options.loyaltyProfiles;
  const cached = readStorageJson<PatientLoyaltyProfile[]>([
    'rt_lab_unified_loyalty_v3',
    'rt_lab_loyalty_profiles_v1'
  ]);
  return Array.isArray(cached) ? cached : [];
}

function getEffectiveLoyaltyConfig(options?: ReportRenderOptions): LoyaltyConfig {
  if (options?.loyaltyConfig) return options.loyaltyConfig;
  const cached = readStorageJson<LoyaltyConfig>([
    'rt_lab_unified_loyalty_config',
    'rt_lab_loyalty_settings'
  ]);
  if (cached && typeof cached === 'object') {
    return {
      ...DEFAULT_LOYALTY_CONFIG,
      ...cached,
      tiers: {
        ...DEFAULT_LOYALTY_CONFIG.tiers,
        ...(cached.tiers || {})
      }
    };
  }
  return DEFAULT_LOYALTY_CONFIG;
}

export function buildReportInvoicePayload(
  report: LabReport,
  lab?: LabInfo,
  options?: ReportRenderOptions
): InvoiceExportPayload {
  const cachedLab =
    lab || readStorageJson<Partial<LabInfo>>(['rt_lab_unified_lab_info_v3', 'rt_lab_info_v3']) || {};

  const labInfo: Partial<LabInfo> = {
    labNameAr: cachedLab.labNameAr || LAB_NAME_AR,
    labNameEn: cachedLab.labNameEn || 'RT Diagnostic Laboratories',
    sloganAr: cachedLab.sloganAr || 'التشخيص الصحيح يبدأ معنا',
    sloganEn: cachedLab.sloganEn || 'Accurate Diagnosis Starts With Us',
    supervisionAr: cachedLab.supervisionAr || 'أطباء واستشاريو كلية طب قصر العيني',
    supervisionEn: cachedLab.supervisionEn || 'Kasr Al Ainy Clinical Pathology Consultants',
    accreditation: cachedLab.accreditation || 'ISO 15189 Certified',
    hotline: cachedLab.hotline || LAB_PHONE,
    phone: cachedLab.phone || LAB_PHONE_SECONDARY,
    whatsapp: cachedLab.whatsapp || LAB_WHATSAPP,
    mainAddress: cachedLab.mainAddress || BRANCH_MAIN_ADDRESS,
    instapay: cachedLab.instapay || INSTAPAY_IPA,
    vodafoneCash: cachedLab.vodafoneCash || WALLET_VODAFONE
  };

  const p = report.patient;
  const pAny = p as any;
  const incomeRecords = getEffectiveIncomeRecords(options);
  const loyaltyProfiles = getEffectiveLoyaltyProfiles(options);
  const loyaltyConfig = getEffectiveLoyaltyConfig(options);

  const linkedInvoice = incomeRecords.find(
    (i) =>
      (report.invoiceId && (i.id === report.invoiceId || i.invoiceNumber === report.invoiceId)) ||
      (p.labNumber && i.labNumber === p.labNumber) ||
      (p.barcode && i.barcode === p.barcode)
  );

  const invoiceNumber =
    linkedInvoice?.invoiceNumber ||
    p.clinicalHistory?.match(/فاتورة\s*(?:مالية)?\s*رقم\s*([\w\d-]+)/i)?.[1] ||
    `INV-${p.labNumber?.replace(/^RT-/i, '') || report.reportNumber?.replace(/^RT-/i, '') || '2026'}`;

  const normPhone = normalizePhoneKey(p.phone);
  const loyaltyProfile = loyaltyProfiles.find(
    (prof) =>
      (normPhone && normalizePhoneKey(prof.phone) === normPhone) ||
      (p.loyaltyCardNumber &&
        (prof.cardNumber === p.loyaltyCardNumber || prof.barcode === p.loyaltyCardNumber)) ||
      (p.barcode && prof.barcode === p.barcode)
  );

  const hasCustomReportItems = Array.isArray(report.customInvoiceItems);
  const items: InvoiceExportItem[] =
    hasCustomReportItems
      ? report.customInvoiceItems!.map((t) => ({
          titleAr: t.nameAr || t.nameEn || 'تحليل مخبري',
          titleEn: t.nameEn || t.code || 'Lab Test',
          code: t.code,
          category: t.category || 'تحاليل تشخيصية',
          sampleType: t.sampleType || 'Serum',
          parametersCount: 1,
          price: Number(t.price) || 0
        }))
      : linkedInvoice?.tests && linkedInvoice.tests.length > 0
        ? linkedInvoice.tests.map((t) => ({
            titleAr: t.nameAr || t.nameEn || 'تحليل مخبري',
            titleEn: t.nameEn || t.code || 'Lab Test',
            code: t.code,
            category: t.category || 'تحاليل تشخيصية',
            sampleType: t.sampleType || 'Serum',
            parametersCount: 1,
            price: Number(t.price) || 0
          }))
        : report.profiles.map((prof) => {
            const catMatch = LAB_CATALOG.find(
              (c) => c.code.toUpperCase() === (prof.profileCode || '').toUpperCase()
            );
            let price = catMatch?.profilePrice || 200;
            if (!catMatch?.profilePrice) {
              if (prof.parameters.length > 5) price = 220;
              else price = Math.max(100, prof.parameters.length * 40);
            }
            return {
              titleAr: prof.titleAr || prof.titleEn,
              titleEn: prof.titleEn,
              code: prof.profileCode,
              category: prof.category || 'تحاليل تشخيصية',
              sampleType: prof.sampleType || 'Serum',
              parametersCount: prof.parameters.length,
              price
            };
          });

  const visitFee = Number(pAny.visitFee ?? linkedInvoice?.visitFee ?? 0) || 0;
  const testsSubtotal =
    Number(
      linkedInvoice?.testsSubtotal !== undefined
        ? linkedInvoice.testsSubtotal
        : pAny.testsSubtotal !== undefined
          ? pAny.testsSubtotal
          : report.packageApplied?.packagePrice !== undefined
            ? report.packageApplied.packagePrice
            : p.totalCost !== undefined
              ? Math.max(0, p.totalCost + (p.discountApplied || 0) - visitFee)
              : items.reduce((sum, item) => sum + item.price, 0)
    ) || 0;

  const subtotal = testsSubtotal + visitFee;
  const discount = Number(p.discountApplied ?? linkedInvoice?.discount ?? 0) || 0;
  const netTotal = Math.max(0, subtotal - discount);

  const paidAmount =
    pAny.paidAmount !== undefined
      ? Math.min(netTotal, Number(pAny.paidAmount) || 0)
      : linkedInvoice?.paidAmount !== undefined
        ? Math.min(netTotal, Number(linkedInvoice.paidAmount) || 0)
        : netTotal;
  const remainingAmount = Math.max(0, netTotal - paidAmount);

  const sampleDateFormatted = p.sampleDate
    ? new Date(p.sampleDate).toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      })
    : 'اليوم';

  const reportingDateFormatted = p.reportingDate
    ? new Date(p.reportingDate).toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'خلال 24 ساعة';

  const invNorm = normalizeInvoiceRef(invoiceNumber);
  const labNorm = normalizeInvoiceRef(p.labNumber);
  const confirmedTx = loyaltyProfile?.transactions?.find(
    (t) =>
      t.type === 'earn' &&
      t.points > 0 &&
      ((t.invoiceNumber &&
        (normalizeInvoiceRef(t.invoiceNumber) === invNorm ||
          normalizeInvoiceRef(t.invoiceNumber) === labNorm)) ||
        (t.reportNumber && normalizeInvoiceRef(t.reportNumber) === labNorm))
  );

  const paidTestsOnly = calculateTestsOnlyPaidAmount(
    { testsSubtotal, visitFee, discount, netAmount: netTotal, paidAmount },
    loyaltyConfig
  );
  const invoiceEarnedPoints = confirmedTx?.points ?? pointsForAmount(paidTestsOnly, loyaltyConfig);

  const paymentMethodCode = linkedInvoice?.paymentMethod || p.paymentMethod || 'cash';
  const paymentMethodLabel = PAYMENT_METHOD_AR[paymentMethodCode] || 'نقدي';
  const isHomeVisitFlag = p.bookingType === 'home_visit' || Boolean(pAny.isHomeVisit);
  const repName = isHomeVisitFlag
    ? p.visitSpecialist || linkedInvoice?.visitSpecialist
    : p.branchRepresentative || linkedInvoice?.branchRepresentative;

  const referringDoctorDisplay =
    p.referringDoctorTitle === 'Herself' || p.referringDoctorTitle === 'Himself'
      ? 'طلب فحص ذاتي (Self-Request)'
      : `${p.referringDoctorTitle || ''} ${p.referringDoctorName || ''}`.trim() ||
        'طلب فحص ذاتي (Self-Request)';

  const displayMode = report.invoiceDisplayMode || linkedInvoice?.invoiceDisplayMode || 'detailed';
  const groupedTitleAr = report.invoiceGroupedTitleAr || linkedInvoice?.invoiceGroupedTitleAr;
  const groupedTitleEn = report.invoiceGroupedTitleEn || linkedInvoice?.invoiceGroupedTitleEn;

  return {
    invoiceNumber,
    labNumber: p.labNumber || report.reportNumber,
    barcode: p.barcode || p.labNumber || report.reportNumber,
    patientName: p.fullName,
    patientPhone: p.phone,
    ageText: `${p.age} ${p.ageUnit === 'years' ? 'سنة' : 'شهر'}`,
    genderText: formatGenderAr(p.gender),
    referringDoctor: referringDoctorDisplay,
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
    isEarnedConfirmed: Boolean(confirmedTx),
    displayMode,
    groupedTitleAr,
    groupedTitleEn
  };
}
