// محرك برنامج الولاء الذكي: حساب النقاط والمستويات وإصدار الكروت التلقائية طبقاً لقيمة التحاليل فقط بدون رسوم الزيارة
import type { LoyaltyConfig, LoyaltyTier, PatientLoyaltyProfile, LoyaltyTransaction } from '../types';

export const LOYALTY_TIER_ORDER: LoyaltyTier[] = ['Silver', 'Gold', 'Platinum', 'VIP'];

/** حساب المستوى المستحق تلقائياً حسب رصيد النقاط الإجمالي */
export function computeLoyaltyTier(points: number, config: LoyaltyConfig): LoyaltyTier {
  if (points >= (config?.tiers?.VIP?.minPoints ?? 3000)) return 'VIP';
  if (points >= (config?.tiers?.Platinum?.minPoints ?? 1500)) return 'Platinum';
  if (points >= (config?.tiers?.Gold?.minPoints ?? 500)) return 'Gold';
  return 'Silver';
}

/** 
 * حساب المبلغ المدفوع للتحاليل فقط واستبعاد رسوم الزيارة أو السحب المنزلي
 * تنفيذاً للمطلب: "حساب نقاط الولاء أوتوماتيك بناء على قيمة المبلغ المدفوع للتحاليل فقط ومن غير رسوم الزيارة"
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

  // في حال رغبة الإدارة في عدم الاستبعاد (الافتراضي هو الاستبعاد الإجباري لرسوم الزيارة)
  const shouldExclude = config?.excludeVisitFee !== false;
  if (!shouldExclude) return paid;

  const fee = Math.max(0, Number(invoice?.visitFee) || 0);
  if (fee <= 0) return paid;

  // صافي قيمة الفاتورة الكلي
  const net = Number(
    invoice.netAmount !== undefined 
      ? invoice.netAmount 
      : ((invoice.subtotal || 0) - (invoice.discount || 0))
  );

  // صافي قيمة التحاليل فقط بدون رسوم الزيارة
  const testsNet = Math.max(0, net - fee);

  // المبلغ المدفوع الذي يغطي التحاليل بعد استقطاع رسوم الزيارة (ولا يتجاوز صافي قيمة التحاليل)
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

/** التحقق هل مُنحت نقاط هذه الفاتورة بالفعل للمريض لمنع التكرار */
export function hasEarnedForInvoice(profile: PatientLoyaltyProfile, invoiceNumber: string): boolean {
  if (!invoiceNumber || !profile || !Array.isArray(profile.transactions)) return false;
  return profile.transactions.some(t => t.invoiceNumber === invoiceNumber && t.points > 0);
}

/** توليد رقم كارت ولاء ذكي فريد ومميز */
export function generateSmartCardNumber(tier: LoyaltyTier, idOrBarcode: string): string {
  const cleanCode = String(idOrBarcode || '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .replace(/^RT/i, '')
    .slice(-5) || Math.floor(10000 + Math.random() * 90000);
  return `RT-${tier.toUpperCase()}-${cleanCode}`;
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
    emergencyContact
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
      amountEGP: 0
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
      amountEGP: testsPaidAmount
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
    transactions
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
