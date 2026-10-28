// محرك برنامج الولاء: حساب النقاط والمستويات والخصومات تلقائياً
import type { LoyaltyConfig, LoyaltyTier, PatientLoyaltyProfile } from '../types';

export const LOYALTY_TIER_ORDER: LoyaltyTier[] = ['Silver', 'Gold', 'Platinum', 'VIP'];

/** المستوى المستحق تلقائياً حسب رصيد النقاط */
export function computeLoyaltyTier(points: number, config: LoyaltyConfig): LoyaltyTier {
  if (points >= config.tiers.VIP.minPoints) return 'VIP';
  if (points >= config.tiers.Platinum.minPoints) return 'Platinum';
  if (points >= config.tiers.Gold.minPoints) return 'Gold';
  return 'Silver';
}

/** النقاط المكتسبة من مبلغ مدفوع */
export function pointsForAmount(amount: number, config: LoyaltyConfig): number {
  if (!amount || amount <= 0) return 0;
  return Math.floor(amount * (config.pointsPerEGP || 0));
}

/** نسبة الخصم الممنوحة للمستوى */
export function tierDiscountRate(tier: LoyaltyTier | undefined, config: LoyaltyConfig): number {
  return config.tiers[tier || 'Silver']?.discountRate || 0;
}

/** هل مُنحت نقاط هذه الفاتورة بالفعل؟ (منع التكرار) */
export function hasEarnedForInvoice(profile: PatientLoyaltyProfile, invoiceNumber: string): boolean {
  if (!invoiceNumber || !profile || !Array.isArray(profile.transactions)) return false;
  return profile.transactions.some(t => t.invoiceNumber === invoiceNumber && t.points > 0);
}

/** الترقية القادمة ونسبة التقدم داخل المستوى الحالي */
export function nextTierProgress(profile: PatientLoyaltyProfile, config: LoyaltyConfig) {
  const points = profile?.totalPoints || 0;
  const tier = computeLoyaltyTier(points, config);
  const idx = LOYALTY_TIER_ORDER.indexOf(tier);
  const nextTier = LOYALTY_TIER_ORDER[idx + 1];
  if (!nextTier) return { tier, nextTier: null as LoyaltyTier | null, pointsNeeded: 0, progressPct: 100 };
  const currentMin = config.tiers[tier].minPoints;
  const nextMin = config.tiers[nextTier].minPoints;
  const span = Math.max(1, nextMin - currentMin);
  return {
    tier,
    nextTier,
    pointsNeeded: Math.max(0, nextMin - points),
    progressPct: Math.max(0, Math.min(100, Math.round(((points - currentMin) / span) * 100))),
  };
}
