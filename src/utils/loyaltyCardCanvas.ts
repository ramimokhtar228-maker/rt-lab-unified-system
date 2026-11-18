import {
  BRANCH_MAIN_ADDRESS,
  LAB_NAME_AR,
  LAB_PHONE,
  LAB_PHONE_SECONDARY,
  LAB_WHATSAPP,
} from './whatsapp';
import { getTierPalette } from './loyaltyEngine';
import type { LoyaltyTier } from '../types';

export interface CardCustomFields {
  showHeader?: boolean;
  showTierBadge?: boolean;
  showChip?: boolean;
  showPoints?: boolean;
  showCashValue?: boolean;
  showCardCode?: boolean;
  showPatientName?: boolean;
  showPatientPhone?: boolean;
  showBloodGroup?: boolean;
  showDates?: boolean;
  showUsageNote?: boolean;
  showFooter?: boolean;
  showHotline?: boolean;
  showAddress?: boolean;
}

export type CardThemeOption = 'auto-tier' | 'royal-black' | 'sapphire' | 'emerald' | 'ruby';

export interface LoyaltyCardParams {
  cardNumber: string;
  patientName: string;
  patientPhone: string;
  tier: string;
  tierKey?: LoyaltyTier;
  discountPercentage: number;
  points: number;
  egpPer100Points?: number;
  pointsPerEGP?: number;
  bloodGroup?: string;
  issueDate?: string;
  emergencyContact?: string;
  labNameAr?: string;
  supervisionAr?: string;
  address?: string;
  hotline?: string;
  phone?: string;
  whatsapp?: string;
  fields?: CardCustomFields;
  theme?: CardThemeOption;
  skipDownload?: boolean;
}

function resolveTierKey(tierStr?: string, explicitKey?: LoyaltyTier): LoyaltyTier {
  if (explicitKey) return explicitKey;
  const lower = String(tierStr || '').toLowerCase();
  if (lower.includes('vip') || lower.includes('الماس') || lower.includes('diamond')) return 'VIP';
  if (lower.includes('plat') || lower.includes('بلاتين')) return 'Platinum';
  if (lower.includes('gold') || lower.includes('ذهب')) return 'Gold';
  return 'Silver';
}

export async function copyDataUrlToClipboard(dataUrl: string): Promise<boolean> {
  try {
    if (!navigator.clipboard || typeof ClipboardItem === 'undefined') return false;
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    await navigator.clipboard.write([new ClipboardItem({ [blob.type || 'image/png']: blob })]);
    return true;
  } catch {
    return false;
  }
}

export async function generateAndDownloadLoyaltyCard(params: LoyaltyCardParams): Promise<string> {
  try {
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      await document.fonts.ready;
    }
  } catch {}

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 680;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve('');
      return;
    }

    const fields: Required<CardCustomFields> = {
      showHeader: params.fields?.showHeader ?? true,
      showTierBadge: params.fields?.showTierBadge ?? true,
      showChip: params.fields?.showChip ?? true,
      showPoints: params.fields?.showPoints ?? true,
      showCashValue: params.fields?.showCashValue ?? true,
      showCardCode: params.fields?.showCardCode ?? true,
      showPatientName: params.fields?.showPatientName ?? true,
      showPatientPhone: params.fields?.showPatientPhone ?? true,
      showBloodGroup: params.fields?.showBloodGroup ?? false,
      showDates: params.fields?.showDates ?? true,
      showUsageNote: params.fields?.showUsageNote ?? true,
      showFooter: params.fields?.showFooter ?? true,
      showHotline: params.fields?.showHotline ?? true,
      showAddress: params.fields?.showAddress ?? true,
    };

    const resolvedTier = resolveTierKey(params.tier, params.tierKey);
    const palette = getTierPalette(resolvedTier);

    const blood = params.bloodGroup || 'O+';
    const issueDate = params.issueDate || new Date().toISOString().substring(0, 10);
    const labName = params.labNameAr || LAB_NAME_AR || 'معامل RT للتحاليل الطبية والتشخيصية';
    const supervision = params.supervisionAr || 'أطباء واستشاريو كلية طب قصر العيني';
    const hotlineVal = params.hotline || LAB_PHONE;
    const phoneVal = params.phone || LAB_PHONE_SECONDARY;
    const whatsappVal = params.whatsapp || LAB_WHATSAPP;
    const contactDisplay = [hotlineVal, phoneVal].filter(Boolean).join(' / ');
    const address = params.address || BRANCH_MAIN_ADDRESS;
    const theme = params.theme || 'auto-tier';

    const egpPer100 = Number(params.egpPer100Points) || 10;
    const ptsPerEgp = Number(params.pointsPerEGP) || 1;
    const pts = Math.max(0, Number(params.points) || 0);
    const exactCashValue = Math.round(((pts * egpPer100) / 100) * 100) / 100;
    const earnText =
      ptsPerEgp >= 1
        ? `كل 1 ج.م تحاليل = ${ptsPerEgp} نقطة`
        : `كل ${Math.round(1 / ptsPerEgp)} ج.م تحاليل = 1 نقطة`;

    // 1. Per-tier or custom background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 1080, 680);
    let colorStops = palette.canvasColors;
    let borderStops = palette.borderColors;
    let accentHex = palette.accentHex;
    let discountTextHex = palette.discountTextHex;
    let discountBgHex = palette.discountBgHex;

    if (theme === 'sapphire') {
      colorStops = ['#041024', '#0c2344', '#164e63', '#020617'];
      borderStops = ['#e0f2fe', '#38bdf8', '#0284c7', '#bae6fd'];
      accentHex = '#7dd3fc';
      discountTextHex = '#bae6fd';
      discountBgHex = 'rgba(56, 189, 248, 0.22)';
    } else if (theme === 'emerald') {
      colorStops = ['#021a12', '#064e3b', '#047857', '#01150e'];
      borderStops = ['#d1fae5', '#34d399', '#059669', '#a7f3d0'];
      accentHex = '#6ee7b7';
      discountTextHex = '#a7f3d0';
      discountBgHex = 'rgba(16, 185, 129, 0.24)';
    } else if (theme === 'ruby') {
      colorStops = ['#1f0410', '#4c0519', '#6b0f2b', '#17051c'];
      borderStops = ['#fecdd3', '#fb7185', '#fbbf24', '#fda4af'];
      accentHex = '#fda4af';
      discountTextHex = '#fecdd3';
      discountBgHex = 'rgba(244, 63, 94, 0.25)';
    } else if (theme === 'royal-black') {
      colorStops = ['#090d16', '#111827', '#1e293b', '#020617'];
      borderStops = ['#fef08a', '#fbbf24', '#d97706', '#fde68a'];
      accentHex = '#fde68a';
      discountTextHex = '#fef08a';
      discountBgHex = 'rgba(245, 158, 11, 0.24)';
    }

    bgGradient.addColorStop(0, colorStops[0]);
    bgGradient.addColorStop(0.35, colorStops[1]);
    bgGradient.addColorStop(0.7, colorStops[2]);
    bgGradient.addColorStop(1, colorStops[3]);

    const radius = 34;
    ctx.beginPath();
    ctx.roundRect(0, 0, 1080, 680, radius);
    ctx.fillStyle = bgGradient;
    ctx.fill();

    // Soft radial glow for visual depth
    const glow = ctx.createRadialGradient(860, 120, 20, 860, 120, 420);
    glow.addColorStop(0, 'rgba(255,255,255,0.09)');
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 1080, 680);

    // 2. Metallic Outer Border matched to tier
    ctx.lineWidth = 6;
    const borderGrad = ctx.createLinearGradient(0, 0, 1080, 680);
    borderGrad.addColorStop(0, borderStops[0]);
    borderGrad.addColorStop(0.35, borderStops[1]);
    borderGrad.addColorStop(0.7, borderStops[2]);
    borderGrad.addColorStop(1, borderStops[3]);
    ctx.strokeStyle = borderGrad;
    ctx.stroke();

    // 3. Subtle pattern watermark
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
    ctx.lineWidth = 1;
    for (let x = 40; x < 1080; x += 54) {
      ctx.beginPath();
      ctx.moveTo(x, 20);
      ctx.lineTo(x, 660);
      ctx.stroke();
    }
    for (let y = 40; y < 680; y += 54) {
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(1060, y);
      ctx.stroke();
    }
    ctx.restore();

    const fontAr = '"Cairo", "Tajawal", sans-serif';

    // 4. Header: RT Brand Logo & Lab Identity (Top Right)
    if (fields.showHeader) {
      ctx.fillStyle = borderStops[2];
      ctx.beginPath();
      ctx.roundRect(955, 36, 76, 76, 18);
      ctx.fill();

      ctx.strokeStyle = borderStops[0];
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = `900 36px ${fontAr}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('RT', 993, 75);

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'right';
      ctx.font = `900 26px ${fontAr}`;
      ctx.fillText(labName, 935, 56);

      ctx.font = `700 16px ${fontAr}`;
      ctx.fillStyle = accentHex;
      ctx.fillText(supervision, 935, 86);

      ctx.font = `600 13px sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
      ctx.fillText('RT Diagnostic Laboratories · Smart Loyalty Health Pass', 935, 110);
    }

    // 5. Tier Badge + Permanent Tier Discount (Top Left)
    if (fields.showTierBadge) {
      ctx.fillStyle = discountBgHex;
      ctx.beginPath();
      ctx.roundRect(42, 36, 295, 48, 24);
      ctx.fill();

      ctx.strokeStyle = borderStops[1];
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = `800 17px ${fontAr}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`★ ${params.tier || palette.titleAr} ★`, 189, 60);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
      ctx.beginPath();
      ctx.roundRect(42, 92, 295, 36, 12);
      ctx.fill();

      ctx.strokeStyle = borderStops[1];
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = discountTextHex;
      ctx.font = `800 15px ${fontAr}`;
      ctx.textAlign = 'center';
      ctx.fillText(`خصم دائم معتمد: %${params.discountPercentage || 0} على التحاليل`, 189, 111);
    }

    // 6. EMV Smart Chip & NFC
    if (fields.showChip) {
      const chipX = 50;
      const chipY = 152;
      const chipW = 84;
      const chipH = 62;
      const chipGrad = ctx.createLinearGradient(chipX, chipY, chipX + chipW, chipY + chipH);
      chipGrad.addColorStop(0, borderStops[0]);
      chipGrad.addColorStop(0.5, borderStops[1]);
      chipGrad.addColorStop(1, borderStops[2]);
      ctx.fillStyle = chipGrad;
      ctx.beginPath();
      ctx.roundRect(chipX, chipY, chipW, chipH, 12);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255,255,255,0.65)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.strokeStyle = 'rgba(15, 23, 42, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(chipX + 28, chipY);
      ctx.lineTo(chipX + 28, chipY + chipH);
      ctx.moveTo(chipX + 56, chipY);
      ctx.lineTo(chipX + 56, chipY + chipH);
      ctx.moveTo(chipX, chipY + 31);
      ctx.lineTo(chipX + chipW, chipY + 31);
      ctx.stroke();

      ctx.strokeStyle = accentHex;
      ctx.lineWidth = 2.8;
      for (let r = 1; r <= 3; r++) {
        ctx.beginPath();
        ctx.arc(158, 183, r * 10, -Math.PI / 3, Math.PI / 3, false);
        ctx.stroke();
      }
    }

    // 7. Points Balance & Cash Value Box (Right side row 2)
    if (fields.showPoints) {
      ctx.fillStyle = 'rgba(2, 6, 23, 0.72)';
      ctx.beginPath();
      ctx.roundRect(620, 142, 412, 86, 16);
      ctx.fill();

      ctx.strokeStyle = borderStops[1];
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
      ctx.font = `700 14px ${fontAr}`;
      ctx.fillText('رصيد نقاط الولاء التراكمي وقيمته:', 1012, 165);

      ctx.fillStyle = accentHex;
      ctx.font = `900 28px ${fontAr}`;
      ctx.fillText(`${pts.toLocaleString()} نقطة`, 1012, 199);

      if (fields.showCashValue) {
        ctx.textAlign = 'left';
        ctx.fillStyle = '#34d399';
        ctx.font = `800 20px ${fontAr}`;
        ctx.fillText(`= ${exactCashValue} ج.م`, 640, 198);
        ctx.fillStyle = 'rgba(209, 250, 229, 0.85)';
        ctx.font = `700 12px ${fontAr}`;
        ctx.fillText('رصيد نقدي للاستبدال', 640, 166);
      }
    }

    // 8. Embossed Card Number
    if (fields.showCardCode) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 34px monospace';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillText(params.cardNumber, 542, 267);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(params.cardNumber, 540, 265);
    }

    // Horizontal divider
    const divGrad = ctx.createLinearGradient(42, 298, 1038, 298);
    divGrad.addColorStop(0, 'rgba(255,255,255,0.08)');
    divGrad.addColorStop(0.5, borderStops[1]);
    divGrad.addColorStop(1, 'rgba(255,255,255,0.08)');
    ctx.strokeStyle = divGrad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(42, 298);
    ctx.lineTo(1038, 298);
    ctx.stroke();

    // 9. Patient Information Row
    if (fields.showPatientName) {
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
      ctx.font = `700 14px ${fontAr}`;
      ctx.fillText('اسم العضو / المريض:', 1032, 326);
      ctx.fillStyle = '#ffffff';
      ctx.font = `900 26px ${fontAr}`;
      ctx.fillText(params.patientName, 1032, 360);
    }

    if (fields.showPatientPhone) {
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
      ctx.font = `700 14px ${fontAr}`;
      ctx.fillText('رقم الهاتف المسجل (لتجميع النقاط تلقائياً):', 1032, 398);
      ctx.fillStyle = accentHex;
      ctx.font = 'bold 21px monospace';
      ctx.fillText(params.patientPhone, 1032, 426);
    }

    if (fields.showBloodGroup) {
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(225, 29, 72, 0.25)';
      ctx.beginPath();
      ctx.roundRect(45, 316, 175, 58, 14);
      ctx.fill();
      ctx.strokeStyle = 'rgba(251, 113, 133, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#fda4af';
      ctx.font = `700 13px ${fontAr}`;
      ctx.fillText('فصيلة الدم:', 60, 336);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 22px monospace';
      ctx.fillText(blood, 60, 358);
    }

    if (fields.showDates) {
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
      ctx.font = `700 13px ${fontAr}`;
      ctx.fillText(`تاريخ الإصدار: ${issueDate}`, 45, 400);
      ctx.fillStyle = '#34d399';
      ctx.font = `800 14px ${fontAr}`;
      ctx.fillText('صلاحية الكارت: دائم مدى الحياة ✓', 45, 426);
    }

    // 10. Clear Redemption & Cumulative Upgrade Rule Strip (Always legible)
    if (fields.showUsageNote) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.09)';
      ctx.beginPath();
      ctx.roundRect(40, 452, 1000, 62, 14);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fef08a';
      ctx.font = `800 16px ${fontAr}`;
      ctx.fillText(
        `نظام الاستبدال: كل 100 نقطة = ${egpPer100} ج.م خصم نقدي  •  ${earnText}`,
        540,
        472
      );
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = `700 13px ${fontAr}`;
      ctx.fillText(
        'الترقية التراكمية التلقائية: تُجمع النقاط مع كل حجز أو تحليل لترقية الفئة وزيادة نسبة الخصم تلقائياً',
        540,
        499
      );
    }

    // 11. Bottom Lab Contacts Bar
    if (fields.showFooter && (fields.showHotline || fields.showAddress)) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.56)';
      ctx.beginPath();
      ctx.roundRect(30, 532, 1020, 114, 18);
      ctx.fill();

      ctx.strokeStyle = borderStops[1];
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (fields.showHotline) {
        ctx.fillStyle = accentHex;
        ctx.font = `800 17px ${fontAr}`;
        ctx.fillText(
          `📞 الخط الساخن والهاتف: ${contactDisplay}   |   💬 واتساب خدمة العملاء: ${whatsappVal}`,
          540,
          568
        );
      }
      if (fields.showAddress) {
        ctx.fillStyle = '#e2e8f0';
        ctx.font = `700 15px ${fontAr}`;
        ctx.fillText(`📍 ${address}`, 540, 608);
      }
    }

    const dataUrl = canvas.toDataURL('image/png');
    if (!params.skipDownload) {
      try {
        const link = document.createElement('a');
        link.download = `RT-Loyalty-Card-${params.cardNumber}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          if (link.parentNode) link.parentNode.removeChild(link);
        }, 500);
      } catch (e) {
        console.warn('Card download notice:', e);
      }
    }

    resolve(dataUrl);
  });
}
