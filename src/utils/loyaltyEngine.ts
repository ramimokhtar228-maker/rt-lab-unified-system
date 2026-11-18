// محرك برنامج الولاء الذكي: حساب النقاط والمستويات وإصدار الكروت التلقائية طبقاً لقيمة التحاليل فقط بدون رسوم الزيارة
import type { LoyaltyConfig, LoyaltyTier, PatientLoyaltyProfile, LoyaltyTransaction } from '../types';

export const LOYALTY_TIER_ORDER: LoyaltyTier[] = ['Silver', 'Gold', 'Platinum', 'VIP'];

export interface TierPalette {
  tier: LoyaltyTier;
  titleAr: string;
  shortLabel: string;
  gradientCss: string;
  borderClass: string;
  badgeBgClass: string;
  badgeTextClass: string;
  canvasColors: [string, string, string, string];
  borderColors: [string, string, string, string];
  accentHex: string;
  textPrimaryHex: string;
  discountTextHex: string;
  discountBgHex: string;
  printBgGradient: string;
  printBorderHex: string;
}

export const TIER_PALETTES: Record<LoyaltyTier, TierPalette> = {
  Silver: {
    tier: 'Silver',
    titleAr: 'المستوى الفضي (Silver)',
    shortLabel: 'SILVER',
    gradientCss: 'bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900',
    borderClass: 'border-slate-300',
    badgeBgClass: 'bg-slate-100 text-slate-800 border-slate-300',
    badgeTextClass: 'text-slate-200',
    canvasColors: ['#1e293b', '#334155', '#475569', '#0f172a'],
    borderColors: ['#f8fafc', '#cbd5e1', '#94a3b8', '#e2e8f0'],
    accentHex: '#e2e8f0',
    textPrimaryHex: '#ffffff',
    discountTextHex: '#f1f5f9',
    discountBgHex: 'rgba(148, 163, 184, 0.22)',
    printBgGradient: 'linear-gradient(135deg, #1e293b 0%, #334155 55%, #0f172a 100%)',
    printBorderHex: '#cbd5e1',
  },
  Gold: {
    tier: 'Gold',
    titleAr: 'المستوى الذهبي (Gold)',
    shortLabel: 'GOLD',
    gradientCss: 'bg-gradient-to-br from-amber-950 via-yellow-900 to-stone-950',
    borderClass: 'border-amber-400',
    badgeBgClass: 'bg-amber-100 text-amber-950 border-amber-400',
    badgeTextClass: 'text-amber-300',
    canvasColors: ['#1c1104', '#451a03', '#78350f', '#140c02'],
    borderColors: ['#fef08a', '#fbbf24', '#d97706', '#fde68a'],
    accentHex: '#fde68a',
    textPrimaryHex: '#ffffff',
    discountTextHex: '#fef08a',
    discountBgHex: 'rgba(245, 158, 11, 0.24)',
    printBgGradient: 'linear-gradient(135deg, #271503 0%, #78350f 55%, #1c1003 100%)',
    printBorderHex: '#fbbf24',
  },
  Platinum: {
    tier: 'Platinum',
    titleAr: 'المستوى البلاتيني (Platinum)',
    shortLabel: 'PLATINUM',
    gradientCss: 'bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-950',
    borderClass: 'border-sky-400',
    badgeBgClass: 'bg-sky-100 text-sky-950 border-sky-400',
    badgeTextClass: 'text-sky-300',
    canvasColors: ['#041024', '#0c2344', '#164e63', '#020617'],
    borderColors: ['#e0f2fe', '#38bdf8', '#0284c7', '#bae6fd'],
    accentHex: '#7dd3fc',
    textPrimaryHex: '#ffffff',
    discountTextHex: '#bae6fd',
    discountBgHex: 'rgba(56, 189, 248, 0.22)',
    printBgGradient: 'linear-gradient(135deg, #06142e 0%, #0e3a5f 55%, #082f49 100%)',
    printBorderHex: '#38bdf8',
  },
  VIP: {
    tier: 'VIP',
    titleAr: 'نخبة الماس (Diamond VIP)',
    shortLabel: 'VIP ELITE',
    gradientCss: 'bg-gradient-to-br from-rose-950 via-red-950 to-purple-950',
    borderClass: 'border-rose-400',
    badgeBgClass: 'bg-gradient-to-r from-rose-700 to-red-800 text-white border-rose-400',
    badgeTextClass: 'text-rose-200',
    canvasColors: ['#1f0410', '#4c0519', '#6b0f2b', '#17051c'],
    borderColors: ['#fecdd3', '#fb7185', '#fbbf24', '#fda4af'],
    accentHex: '#fda4af',
    textPrimaryHex: '#ffffff',
    discountTextHex: '#fecdd3',
    discountBgHex: 'rgba(244, 63, 94, 0.26)',
    printBgGradient: 'linear-gradient(135deg, #2b0412 0%, #6b0f2b 55%, #1c051e 100%)',
    printBorderHex: '#fb7185',
  },
};

export function getTierPalette(tier?: LoyaltyTier | string): TierPalette {
  const key = (tier as LoyaltyTier) in TIER_PALETTES ? (tier as LoyaltyTier) : 'Silver';
  return TIER_PALETTES[key];
}

/** توحيد رقم الهاتف للمقارنة بدون مسافات أو فواصل أو كود دولة أو أرقام عربية */
export function normalizePhoneKey(phone?: string): string {
  if (!phone) return '';
  const converted = String(phone).replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
  let digits = converted.replace(/[^0-9]/g, '');
  if (digits.startsWith('0020')) digits = digits.slice(4);
  else if (digits.startsWith('20') && digits.length === 12) digits = digits.slice(2);
  if (digits.length === 10 && digits.startsWith('1')) digits = '0' + digits;
  return digits;
}

/** توحيد مرجع الفاتورة/التقرير (INV-2026-082 === RT-2026-082) لمنع تكرار النقاط لنفس الحجز */
export function normalizeInvoiceRef(ref?: string): string {
  if (!ref) return '';
  return String(ref)
    .trim()
    .toUpperCase()
    .replace(/^(INV|RT|REC|REP)[-_]?/i, '');
}

/** حساب المستوى المستحق تلقائياً حسب رصيد النقاط الإجمالي */
export function computeLoyaltyTier(points: number, config: LoyaltyConfig): LoyaltyTier {
  if (points >= (config?.tiers?.VIP?.minPoints ?? 3000)) return 'VIP';
  if (points >= (config?.tiers?.Platinum?.minPoints ?? 1500)) return 'Platinum';
  if (points >= (config?.tiers?.Gold?.minPoints ?? 500)) return 'Gold';
  return 'Silver';
}

/** القيمة النقدية للرصيد الحالي (قيمة دقيقة والقيمة القابلة للاستبدال بوحدات 100 نقطة) */
export function pointsCashValue(points: number, config: LoyaltyConfig): {
  exactEGP: number;
  redeemableEGP: number;
  egpPer100: number;
  egpPerPoint: number;
} {
  const pts = Math.max(0, Number(points) || 0);
  const egpPer100 = Math.max(0, Number(config?.egpPer100Points) || 10);
  const egpPerPoint = egpPer100 / 100;
  const exactEGP = Math.round(pts * egpPerPoint * 100) / 100;
  const redeemableEGP = Math.floor(pts / 100) * egpPer100;
  return { exactEGP, redeemableEGP, egpPer100, egpPerPoint };
}

/** ملخص نصي واضح لقواعد احتساب واستبدال النقاط يظهر على الكارت والفاتورة والواتساب */
export function redemptionSummaryText(config: LoyaltyConfig): string {
  const ptsPerEgp = Number(config?.pointsPerEGP) || 1;
  const egpPer100 = Number(config?.egpPer100Points) || 10;
  const earnLabel =
    ptsPerEgp >= 1
      ? `كل 1 ج.م تحاليل = ${ptsPerEgp} نقطة`
      : `كل ${Math.round(1 / ptsPerEgp)} ج.م تحاليل = 1 نقطة`;
  return `نظام الاستبدال: كل 100 نقطة = ${egpPer100} ج.م خصم (النقطة = ${(egpPer100 / 100).toFixed(2)} ج.م) · ${earnLabel}`;
}

/**
 * حساب المبلغ المدفوع للتحاليل فقط واستبعاد رسوم الزيارة أو السحب المنزلي
 */
export function calculateTestsOnlyPaidAmount(
  invoice: {
    subtotal?: number;
    testsSubtotal?: number;
    visitFee?: number;
    discount?: number;
    netAmount?: number;
    paidAmount?: number;
  },
  config?: LoyaltyConfig
): number {
  const paid = Math.max(0, Number(invoice?.paidAmount) || 0);
  if (paid <= 0) return 0;

  const shouldExclude = config?.excludeVisitFee !== false;
  if (!shouldExclude) return paid;

  const fee = Math.max(0, Number(invoice?.visitFee) || 0);
  if (fee <= 0) return paid;

  const net = Number(
    invoice.netAmount !== undefined
      ? invoice.netAmount
      : (invoice.subtotal || 0) - (invoice.discount || 0)
  );

  const testsNet = Math.max(0, net - fee);
  const paidForTests = Math.max(0, Math.min(testsNet, paid - fee));
  return paidForTests;
}

/** النقاط المكتسبة من مبلغ مدفوع للتحاليل */
export function pointsForAmount(amount: number, config: LoyaltyConfig): number {
  if (!amount || amount <= 0) return 0;
  if (config?.minBookingAmountForPoints && amount < config.minBookingAmountForPoints) return 0;
  const rate = Number(config?.pointsPerEGP) || 0;
  return Math.floor(amount * rate);
}

/** نسبة الخصم الممنوحة للمستوى الحالي */
export function tierDiscountRate(tier: LoyaltyTier | undefined, config: LoyaltyConfig): number {
  return config?.tiers?.[tier || 'Silver']?.discountRate || 0;
}

/** التحقق هل مُنحت نقاط هذه الفاتورة بالفعل للمريض لمنع التكرار (INV- أو RT-) */
export function hasEarnedForInvoice(profile: PatientLoyaltyProfile, invoiceNumber: string): boolean {
  if (!invoiceNumber || !profile || !Array.isArray(profile.transactions)) return false;
  const targetNorm = normalizeInvoiceRef(invoiceNumber);
  return profile.transactions.some((t) => {
    if (!(t.points > 0)) return false;
    if (t.invoiceNumber === invoiceNumber) return true;
    if (targetNorm && t.invoiceNumber && normalizeInvoiceRef(t.invoiceNumber) === targetNorm) return true;
    if (targetNorm && t.description && normalizeInvoiceRef(t.description).includes(targetNorm)) return true;
    return false;
  });
}

/** توليد رقم كارت ولاء ذكي فريد ومميز */
export function generateSmartCardNumber(tier: LoyaltyTier, idOrBarcode: string): string {
  const cleanCode =
    String(idOrBarcode || '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .replace(/^RT/i, '')
      .slice(-5) || String(Math.floor(10000 + Math.random() * 90000));
  return `RT-${tier.toUpperCase()}-${cleanCode}`;
}

/** تحديث بادئة رقم الكارت تلقائياً عند الترقية من مستوى إلى مستوى أعلى */
export function syncCardNumberTier(cardNumber: string | undefined, newTier: LoyaltyTier, fallbackBarcode?: string): string {
  const raw = String(cardNumber || '').trim();
  const tierTag = newTier.toUpperCase();
  if (!raw) return generateSmartCardNumber(newTier, fallbackBarcode || '');
  if (/^RT-(SILVER|GOLD|PLATINUM|VIP)-/i.test(raw)) {
    return raw.replace(/^RT-(SILVER|GOLD|PLATINUM|VIP)-/i, `RT-${tierTag}-`);
  }
  return raw;
}

/** إنشاء بروفايل وكارت ولاء تلقائي جديد لمريض حجز على السيستم */
export function createAutoLoyaltyProfile(params: {
  patientName: string;
  phone: string;
  barcode: string;
  testsPaidAmount: number;
  invoiceNumber: string;
  config: LoyaltyConfig;
  chronicConditions?: string[];
  bloodGroup?: string;
  emergencyContact?: string;
}): PatientLoyaltyProfile {
  const {
    patientName,
    phone,
    barcode,
    testsPaidAmount,
    invoiceNumber,
    config,
    chronicConditions,
    bloodGroup,
    emergencyContact,
  } = params;

  const earnedPoints = pointsForAmount(testsPaidAmount, config);
  const welcomeBonus = Number(config?.welcomeBonusPoints) || 0;
  const initialTotalPoints = earnedPoints + welcomeBonus;
  const tier = computeLoyaltyTier(initialTotalPoints, config);
  const safeBarcode = String(barcode || '').trim() || `RT-${Math.floor(10000 + Math.random() * 90000)}`;
  const cardNumber = generateSmartCardNumber(tier, safeBarcode);
  const today = new Date().toISOString().split('T')[0];

  const transactions: LoyaltyTransaction[] = [];

  if (welcomeBonus > 0) {
    transactions.push({
      id: `tx-wel-${Date.now()}`,
      date: today,
      type: 'bonus',
      points: welcomeBonus,
      description: `هدية ترحيبية فورية عند إصدار الكارت الذكي للعميل`,
      amountEGP: 0,
    });
  }

  if (earnedPoints > 0) {
    transactions.push({
      id: `tx-inv-${Date.now()}`,
      date: today,
      type: 'earn',
      points: earnedPoints,
      description: `اكتساب نقاط حجز تحاليل (فاتورة: ${invoiceNumber}) - مبلغ تحاليل: ${testsPaidAmount} ج.م (مستبعد منها رسوم الزيارة)`,
      invoiceNumber,
      amountEGP: testsPaidAmount,
    });
  }

  return {
    patientId: `pat-loyalty-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    patientName: (patientName || '').trim() || 'عميل مسجل',
    phone: phone.trim(),
    barcode: safeBarcode,
    cardNumber,
    bloodGroup: bloodGroup || '',
    totalPoints: initialTotalPoints,
    tier,
    lifetimeSpent: testsPaidAmount,
    emergencyContact: emergencyContact || '',
    chronicConditions: chronicConditions || [],
    issueDate: today,
    transactions,
  };
}

/** الترقية القادمة ونسبة التقدم داخل المستوى الحالي */
export function nextTierProgress(profile: PatientLoyaltyProfile, config: LoyaltyConfig) {
  const points = profile?.totalPoints || 0;
  const tier = computeLoyaltyTier(points, config);
  const idx = LOYALTY_TIER_ORDER.indexOf(tier);
  const nextTier = LOYALTY_TIER_ORDER[idx + 1];
  if (!nextTier) return { tier, nextTier: null as LoyaltyTier | null, pointsNeeded: 0, progressPct: 100 };
  const currentMin = config?.tiers?.[tier]?.minPoints ?? 0;
  const nextMin = config?.tiers?.[nextTier]?.minPoints ?? 1000;
  const span = Math.max(1, nextMin - currentMin);
  return {
    tier,
    nextTier,
    pointsNeeded: Math.max(0, nextMin - points),
    progressPct: Math.max(0, Math.min(100, Math.round(((points - currentMin) / span) * 100))),
  };
}
