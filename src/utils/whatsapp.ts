import { LabReport, LabInfo } from '../types/lab';
import type { LoyaltyConfig, LoyaltyTier, PatientLoyaltyProfile } from '../types';
import { computeLoyaltyTier, nextTierProgress, pointsCashValue, redemptionSummaryText, tierDiscountRate } from './loyaltyEngine';

export const BRANCH_MAIN_ADDRESS = 'ميدان بهتيم برج صيدليه العزبى الدور الثالث امام الأسانسير شبرا الخيمه';
export const LAB_NAME_AR = 'معامل RT للتحاليل الطبية والتشخيصية';
export const LAB_PHONE = '01100874444';
export const LAB_PHONE_SECONDARY = '01013242777';
export const LAB_PHONES_DISPLAY = '01100874444 — 01013242777';
export const LAB_WHATSAPP = '01100046841';
export const INSTAPAY_IPA = '01100874444 @instapay';
export const WALLET_VODAFONE = '01124485444';
export const GOOGLE_MAPS_BRANCH_URL = 'https://maps.google.com/?q=30.1287,31.2842';

/** Formats Egyptian local numbers to standard international format (201xxxxxxxxx) */
export function formatEgyptianPhoneForWhatsApp(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('002')) cleaned = cleaned.substring(3);
  if (cleaned.startsWith('+2')) cleaned = cleaned.substring(2);
  if (cleaned.startsWith('01') && cleaned.length === 11) {
    cleaned = '20' + cleaned.substring(1);
  } else if (!cleaned.startsWith('20') && cleaned.length === 10 && cleaned.startsWith('1')) {
    cleaned = '20' + cleaned;
  }
  return cleaned;
}

/** Opens WhatsApp Web or App with target phone and pre-filled message */
export function openWhatsApp(phone: string, message: string): void {
  const intlPhone = formatEgyptianPhoneForWhatsApp(phone);
  const encoded = encodeURIComponent(message);
  const url = `https://api.whatsapp.com/send?phone=${intlPhone}&text=${encoded}`;
  window.open(url, '_blank');
}

/** شروط واحتياطات التحاليل: تُبنى تلقائياً حسب نوع كل تحليل */
export function buildTestPrecautions(
  tests: { nameAr?: string; nameEn?: string; code?: string }[] = [],
  fastingHours = 0,
  isHomeVisit = false
): string[] {
  const haystack = tests.map(t => `${t.nameAr || ''} ${t.nameEn || ''} ${t.code || ''}`).join(' | ');
  const tips: string[] = [];
  const add = (...items: string[]) => items.forEach(item => { if (!tips.includes(item)) tips.push(item); });
  const rules: { pattern: RegExp; tips: string[] }[] = [
    { pattern: /سكر صائم|سكر عشوائي|جلوكوز|glucose|fbs|rbs|ogtt|gtt/i, tips: ['صيام ٨–١٢ ساعة لتحليل السكر (الماء مسموح فقط)'] },
    { pattern: /سكر تراكمي|hba1c|glycated/i, tips: ['السكر التراكمي لا يشترط الصيام — يمكن السحب في أي وقت'] },
    { pattern: /دهون|كوليسترول|triglycer|lipid|chol|ldl|hdl/i, tips: ['صيام ١٢–١٤ ساعة لتحاليل دهون الدم'] },
    { pattern: /وظائف كبد|liver|alt|ast|bilirubin|alp|ggt/i, tips: ['يفضل صيام ٤ ساعات قبل وظائف الكبد'] },
    { pattern: /وظائف كلى|kidney|creatinine|urea|uric/i, tips: ['شرب ماء كافٍ قبل السحب وإبلاغ الفريق بالأدوية المزمنة'] },
    { pattern: /صورة دم|دم كاملة|cbc|esr|crp|هيموجلوبين|hemoglobin/i, tips: ['صورة الدم لا تشترط الصيام'] },
    { pattern: /هرمون|hormone|tsh|t3|t4|prolactin|testosterone|estradiol|fsh|lh|cortisol|amh/i, tips: ['يفضل السحب صباحاً بين ٨ و١٠ صباحاً للتحاليل الهرمونية', 'إبلاغ الفريق بأي أدوية هرمونية تُؤخذ حالياً'] },
    { pattern: /فيتامين د|vitamin d|vit d|كالسيوم|calcium/i, tips: ['فيتامين د والكالسيوم لا يشترطان الصيام'] },
    { pattern: /حديد|ferritin|iron|transferrin/i, tips: ['يفضل السحب صباحاً وقبل تناول مكملات الحديد'] },
    { pattern: /سيولة|pt\b|inr|aptt|d.?dimer|fibrinogen/i, tips: ['إبلاغ الفريق إذا كنت تتناول أدوية سيولة مثل الأسبرين أو الماريفان'] },
    { pattern: /مزرعة|culture|حساسية|sensitivity/i, tips: ['يجب التجميع قبل بدء المضاد الحيوي إن أمكن'] },
    { pattern: /بول|urine|microalbumin/i, tips: ['عينة بول وسطى في حاوية معقمة — يفضل أول بول في الصباح'] },
    { pattern: /براز|stool|parasite/i, tips: ['عينة براز طازجة في حاوية نظيفة وجافة'] },
    { pattern: /حمل|pregnancy|hcg|beta/i, tips: ['تحليل الحمل يمكن إجراؤه في أي وقت من اليوم'] },
    { pattern: /psa|prostate/i, tips: ['يُفضل الامتناع عن المجهود البدني والجماع ٤٨ ساعة قبل تحليل PSA'] },
    { pattern: /سائل منوي|semen|sperm/i, tips: ['الامتناع ٣–٥ أيام قبل سحب عينة السائل المنوي'] }
  ];
  rules.forEach(rule => { if (rule.pattern.test(haystack)) add(...rule.tips); });
  if (fastingHours > 0) add(`الصيام ${fastingHours} ساعة قبل سحب العينة (الماء مسموح)`);
  add(
    isHomeVisit
      ? 'تجهيز بطاقة الهوية أو روشتة الطبيب (إن وجدت) قبل وصول مندوب السحب بـ ١٠ دقائق'
      : 'الحضور للفرع قبل الموعد بـ ١٠ دقائق لاستكمال بيانات السحب'
  );
  add('إبلاغ فريق السحب بالأدوية التي تتناولها أو الأمراض المزمنة أو الحمل');
  return tips.slice(0, 7);
}

function formatTestAbbreviation(t: { nameAr?: string; nameEn?: string; code?: string }): string {
  const code = (t.code || '').trim();
  const en = (t.nameEn || '').trim();
  const ar = (t.nameAr || '').trim();
  const genericCodes = new Set(['TEST', 'INDIVIDUAL', 'PROFILE', 'LAB', 'PKG', '']);
  if (code && !genericCodes.has(code.toUpperCase())) {
    return code.toUpperCase();
  }
  if (en && en.length <= 28) return en;
  if (ar && ar.length <= 28) return ar;
  return en || ar || 'LAB';
}

/** Professional, concise & comprehensive Medical Booking Confirmation Message */
export function formatBookingConfirmationWhatsAppMessage(params: {
  patientName: string;
  labNumber: string;
  barcode?: string;
  phone?: string;
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
  branchGoogleMapsUrl?: string;
  testsList?: string;
  testsDetails?: { nameAr: string; nameEn?: string; code?: string; price?: number }[];
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
  customLabInfo?: LabInfo;
}): string {
  const labTitle = params.customLabInfo?.labNameAr || LAB_NAME_AR;
  const branchAddr = params.branchAddress || params.customLabInfo?.mainAddress || BRANCH_MAIN_ADDRESS;
  const contactPhone = params.branchPhone || params.customLabInfo?.phone || params.customLabInfo?.hotline || LAB_PHONE;
  const mapsLink = params.branchGoogleMapsUrl || GOOGLE_MAPS_BRANCH_URL;

  // 1. Format Tests — Abbreviations / short names ONLY (NO per-test or package prices)
  let testsBlock = '';
  const uniqueAbbrevs = (list: { nameAr?: string; nameEn?: string; code?: string }[]) => {
    const seen = new Set<string>();
    const out: string[] = [];
    list.forEach(item => {
      const abbr = formatTestAbbreviation(item);
      if (abbr && !seen.has(abbr.toUpperCase())) {
        seen.add(abbr.toUpperCase());
        out.push(abbr);
      }
    });
    return out;
  };

  if (params.packageName) {
    testsBlock += `• *باقة:* ${params.packageName}\n`;
    if (params.extraTestsDetails && params.extraTestsDetails.length > 0) {
      const extras = uniqueAbbrevs(params.extraTestsDetails).join(' · ');
      testsBlock += `• *تحاليل إضافية:* ${extras}\n`;
    } else if (params.testsDetails && params.testsDetails.length > 0) {
      const included = uniqueAbbrevs(params.testsDetails).join(' · ');
      testsBlock += `• *الاختصارات:* ${included}\n`;
    }
  } else if (params.testsDetails && params.testsDetails.length > 0) {
    const abbrevs = uniqueAbbrevs(params.testsDetails);
    testsBlock += abbrevs.map(a => `• ${a}`).join('\n') + '\n';
  } else if (params.testsList) {
    const cleanedLines = params.testsList
      .split('\n')
      .map(l => l.replace(/\(?\d[\d.,]*\s*(?:ج\.?م|EGP)\)?/gi, '').trim())
      .filter(Boolean);
    testsBlock += cleanedLines.map(l => (l.startsWith('•') ? l : `• ${l}`)).join('\n') + '\n';
  } else {
    testsBlock += '• فحوصات مخبرية شاملة\n';
  }

  // 2. Tailored wording & representative based on Home Visit vs Branch Attendance
  const homeVisitSpecialist = (params.visitSpecialist || '').trim() || 'أخصائي السحب المنزلي المعتمد بالمعمل';
  const branchRep = (params.branchRepresentative || '').trim() || 'مسؤول الاستقبال وخدمة العملاء بالفرع';

  const introLine = params.isHomeVisit
    ? 'تم تأكيد حجز موعد *الزيارة المنزلية لسحب العينات الطبية* بنجاح ✅'
    : 'تم تأكيد حجز موعدكم *للحضور لفرع المعمل وإجراء التحاليل الطبية* بنجاح ✅';

  const detailsHeading = params.isHomeVisit
    ? '📋 *بيانات الزيارة المنزلية:*'
    : '📋 *بيانات الحضور للفرع:*';

  const locBlock = params.isHomeVisit
    ? [
        '• نوع الحجز: *زيارة منزلية خاصة لسحب العينات* 🏠',
        `• عنوان الزيارة: *${params.address || 'مسجل لدى طاقم الزيارات'}*${params.deliveryNotes ? ` (${params.deliveryNotes})` : ''}`,
        `• مندوب الزيارة المنزلية: *${homeVisitSpecialist}*`
      ].join('\n')
    : [
        '• نوع الحجز: *حضور لفرع المعمل* 🏥',
        `• الفرع: *${params.branchName || 'الفرع الرئيسي - بهتيم'}*`,
        `• العنوان: ${branchAddr}`,
        `• اللوكيشن: ${mapsLink}`,
        `• مندوب استقبال الفرع: *${branchRep}*`
      ].join('\n');

  const visitSpecificNote = params.isHomeVisit
    ? '• سيصل إليكم مندوب الزيارة المنزلية في الموعد المحدد بكامل أدوات السحب المعقمة والمغلقة لمرة واحدة.'
    : '• عند الوصول للفرع يرجى التوجه لمندوب الاستقبال وإبراز رقم الملف لسرعة إنهاء السحب دون انتظار.';

  // 3. Deterministic Pricing — ONLY Total Amount & Amount After Discount
  const visitFee = params.isHomeVisit ? Math.max(0, Number(params.visitFee) || 0) : 0;
  const discount = Math.max(0, Number(params.discountAmount) || 0);
  const netAfterDiscount = Math.max(0, Math.round(Number(params.netAmount) || 0));

  let totalBeforeDiscount = 0;
  if (params.grossTotal !== undefined && params.grossTotal > 0) {
    totalBeforeDiscount = Math.round(Number(params.grossTotal));
  } else if (params.packageName && params.packageOriginalPrice && params.packageOriginalPrice > (params.packagePrice || 0)) {
    const extraCost = (params.extraTestsDetails || []).reduce((s, t) => s + (Number(t.price) || 0), 0);
    totalBeforeDiscount = Math.round(Number(params.packageOriginalPrice) + extraCost + visitFee);
  } else if (params.testsSubtotal !== undefined) {
    totalBeforeDiscount = Math.round(Number(params.testsSubtotal) + visitFee);
  } else {
    const rawSub = Math.max(0, Number(params.subtotal) || 0);
    if (visitFee > 0 && Math.abs(rawSub - discount - netAfterDiscount) <= 1) {
      totalBeforeDiscount = Math.round(rawSub);
    } else if (rawSub > 0) {
      totalBeforeDiscount = Math.round(rawSub + visitFee);
    } else {
      totalBeforeDiscount = Math.round(netAfterDiscount + discount);
    }
  }
  if (totalBeforeDiscount < netAfterDiscount) {
    totalBeforeDiscount = Math.round(netAfterDiscount + discount);
  }

  // 4. الشروط والاحتياطات الخاصة بكل تحليل
  const precautions = buildTestPrecautions(
    [...(params.testsDetails || []), ...(params.extraTestsDetails || [])],
    params.fastingHours || 0,
    params.isHomeVisit
  );

  return `🔬 *${labTitle}*
*أ.د. رامي مختار — استشاريو الباثولوجيا الإكلينيكية (طب قصر العيني)*
━━━━━━━━━━━━━━━━━━━━
أهلاً بحضرتك أ/ *${params.patientName.trim()}* 🌸
${introLine}

${detailsHeading}
• رقم الملف: *#${params.labNumber}*${params.barcode ? ` | باركود: *${params.barcode}*` : ''}
• الموعد: *${params.date}* — الساعة *${params.time}*
${params.phone ? `• تليفون المريض: *${params.phone}*\n` : ''}${locBlock}

🧪 *التحاليل المطلوبة (الاختصارات):*
${testsBlock.trimEnd()}

💰 *البيان المالي:*
• المبلغ الكلي: *${totalBeforeDiscount} ج.م*
• المبلغ بعد الخصم: *${netAfterDiscount} ج.م*

⚠️ *الشروط والاحتياطات الخاصة بتحاليلك:*
${visitSpecificNote}
${precautions.map(tip => `• ${tip}`).join('\n')}
• *تنبيه المواعيد والحضور:* عدم الحضور فى الموعد المحدد دون تأجيل مسبق سيتم إلغاء الحجز بعد ٢٤ ساعه من تاريخه.

📞 *أرقام التواصل والاستفسار أو تعديل الموعد:* ${contactPhone || LAB_PHONES_DISPLAY} | واتساب: ${params.customLabInfo?.whatsapp || LAB_WHATSAPP}
نسأل الله لكم دوام الصحة والعافية 🌸`;
}

/** Professional Results Notification Message */
export function formatWhatsAppMessage(report: LabReport, customLabInfo?: LabInfo): string {
  const p = report.patient;
  const profilesList = report.profiles.map(pr => `  • ${pr.titleEn} (${pr.titleAr})`).join('\n');
  const dateFormatted = p.sampleDate ? new Date(p.sampleDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
  const referringDr = p.referringDoctorTitle === 'Herself' || p.referringDoctorTitle === 'Himself'
    ? 'طلب فحص ذاتي (Self-Request)'
    : `${p.referringDoctorTitle} ${p.referringDoctorName}`.trim();
  const phoneDisplay = [customLabInfo?.hotline || LAB_PHONE, customLabInfo?.phone || LAB_PHONE_SECONDARY].filter(Boolean).join(' / ');
  const waDisplay = customLabInfo?.whatsapp || LAB_WHATSAPP;
  const addressDisplay = customLabInfo?.mainAddress || BRANCH_MAIN_ADDRESS;
  const labTitle = customLabInfo?.labNameAr || LAB_NAME_AR;

  return `🔬 *${labTitle}*
*${customLabInfo?.supervisionAr || 'أطباء واستشاريو كلية طب قصر العيني'}*
━━━━━━━━━━━━━━━━━━━━━
السيد/ة الفاضل/ة: *${p.fullName}* 🌸
يسعدنا إبلاغكم بجاهزية نتائج تحاليلكم الطبية واعتمادها رسمياً ✅

📋 *بيانات التقرير الطبي:*
• *رقم الملف / الباركود:* #${p.labNumber}
• *تاريخ سحب العينة:* ${dateFormatted}
• *الطبيب المعالج:* ${referringDr}

🧪 *الفحوصات الطبية المنجزة:*
${profilesList}

🩺 *حالة التقرير:* معتمد ومدقق رسمياً
• إشراف: *${report.staff?.pathologist || "أ.د. رامي مختار"}*
• تدقيق الجودة: ${report.staff?.verifiedBy || "د. مصطفى العوضي"}

📎 *استلام التقرير:*
يمكنكم استلام النسخة الورقية المعتمدة والمختومة من فرع المعمل، أو طلب إرسال النسخة الرقمية الرسمية (PDF) المعتمدة مباشرة عبر هذه المحادثة.

مع تمنيات أسرة *${labTitle}* لكم بموفور الصحة والعافية والشفاء التام 🌸
📞 الخط الساخن والهاتف: ${phoneDisplay} | واتساب: ${waDisplay}
📍 العنوان: ${addressDisplay}`;
}

/** Professional Sample Received / Post-Draw Notification */
export function formatPostSampleWhatsAppMessage(params: {
  patientName: string;
  labNumber: string;
  notes?: string;
  expectedTime?: string;
  loyaltyCardCode?: string;
  discountPercentage?: number;
  customLabInfo?: LabInfo;
}): string {
  const labTitle = params.customLabInfo?.labNameAr || LAB_NAME_AR;
  const loyaltyPart = params.loyaltyCardCode ? `
💳 *تم تفعيل كارت الولاء RT الخاص بكم بنجاح:*
• *رقم الكارت:* ${params.loyaltyCardCode}
• *نسبة الخصم الدائمة:* ${params.discountPercentage || 15}%
يمكنكم إبراز الكارت في زياراتكم القادمة للحصول على الخصم الفوري والنقاط التراكمية.` : '';

  return `🔬 *${labTitle}*
*معامل أ.د. رامي مختار — استشاريو الباثولوجيا الإكلينيكية (طب قصر العيني)*
━━━━━━━━━━━━━━━━━━━━━
عزيزنا المريض/ة: *${params.patientName}* 🌸
✅ *تم سحب واستلام عيناتكم الطبية بنجاح وفي انتظار التحليل المعملي.*

📋 *بيانات الإيصال:*
• *رقم الملف:* #${params.labNumber}
• *تاريخ ووقت السحب:* ${new Date().toLocaleDateString('en-GB')} — ${new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
${params.notes ? `• *ملاحظات الفحص:* ${params.notes}\n` : ''}• *الموعد المتوقع لصدور النتيجة المعتمدة:* ${params.expectedTime || 'خلال ساعات قليلة اليوم بإذن الله'}

نعمل بأعلى معايير الدقة المعملية الدولية والأجهزة الآلية المتطورة. سيصلكم إشعار بالنتيجة فور اعتمادها.${loyaltyPart}

⭐ *خدمتكم شرف لنا وتمنياتنا لكم بالشفاء العاجل دائماً!* 🌹`;
}

const TIER_NAMES_AR: Record<LoyaltyTier, string> = {
  Silver: 'المستوى الفضي (Silver)',
  Gold: 'المستوى الذهبي (Gold)',
  Platinum: 'المستوى البلاتيني (Platinum)',
  VIP: 'نخبة الماس (Diamond VIP)'
};

/** رسالة شرح كارت الولاء ونظام النقاط والاستبدال والترقية التراكمية لإرسالها عبر الواتساب مع الكارت */
export function formatLoyaltyCardWhatsAppMessage(params: {
  profile: PatientLoyaltyProfile;
  config: LoyaltyConfig;
  labInfo?: LabInfo;
}): string {
  const { profile, config, labInfo } = params;
  const tier = computeLoyaltyTier(profile.totalPoints || 0, config);
  const discountPct = tierDiscountRate(tier, config);
  const cashInfo = pointsCashValue(profile.totalPoints || 0, config);
  const progress = nextTierProgress(profile, config);
  const labName = labInfo?.labNameAr || LAB_NAME_AR;
  const supervision = labInfo?.supervisionAr || 'أطباء واستشاريو كلية طب قصر العيني';
  const hotline = labInfo?.hotline || LAB_PHONE;
  const phone = labInfo?.phone || LAB_PHONE_SECONDARY;
  const whatsapp = labInfo?.whatsapp || LAB_WHATSAPP;
  const address = labInfo?.mainAddress || BRANCH_MAIN_ADDRESS;
  const ruleLine = redemptionSummaryText(config);

  const upgradeLine = progress.nextTier
    ? `• متبقي *${progress.pointsNeeded.toLocaleString()} نقطة* للترقية التلقائية إلى *${TIER_NAMES_AR[progress.nextTier]}* (خصم *%${tierDiscountRate(progress.nextTier, config)}* دائماً).`
    : '• تهانينا! وصلتم إلى أعلى فئة عضوية (*نخبة الماس VIP*) بأقصى خصم ومميزات.';

  return `💳 *${labName}*
_${supervision}_
━━━━━━━━━━━━━━━━━━━━━━
أهلاً بحضرتك أ/ *${profile.patientName}* 🌸
يسعدنا إرسال *كارت الولاء الطبي الذكي* الخاص بكم (مرفق صورة الكارت أعلاه 📎):

🪪 *بيانات الكارت:*
• *رقم الكارت:* \`${profile.cardNumber || profile.barcode}\`
• *فئة العضوية:* *${TIER_NAMES_AR[tier]}*
• *الخصم الفوري الدائم:* *%${discountPct}* على كافة التحاليل بالمعمل والزيارات المنزلية
• *رصيد النقاط التراكمي:* *${Number(profile.totalPoints || 0).toLocaleString()} نقطة*
• *قيمة النقاط بالجنيه المصري:* *${cashInfo.exactEGP} ج.م* (خصم نقدي جاهز للاستبدال: *${cashInfo.redeemableEGP} ج.م*)

📖 *شرح نظام النقاط والاستبدال والترقية التلقائية:*
• *${ruleLine}*
• تُضاف النقاط *تراكمياً وبشكل تلقائي* مع كل حجز أو تحليل جديد بنفس رقم الهاتف (على قيمة التحاليل المدفوعة فقط).
• يمكنك استبدال نقاطك بخصم نقدي فوري على أي فاتورة، أو جمعها لترقية فئة الكارت تلقائياً إلى خصم أعلى:
  - 🥈 الفضي: من ${config.tiers.Silver.minPoints} نقطة (خصم %${config.tiers.Silver.discountRate})
  - 🥇 الذهبي: من ${config.tiers.Gold.minPoints} نقطة (خصم %${config.tiers.Gold.discountRate})
  - 💎 البلاتيني: من ${config.tiers.Platinum.minPoints} نقطة (خصم %${config.tiers.Platinum.discountRate})
  - 👑 الماس VIP: من ${config.tiers.VIP.minPoints} نقطة (خصم %${config.tiers.VIP.discountRate})
${upgradeLine}

📞 *للحجز والاستفسار:*
• الخط الساخن: ${hotline} | هاتف: ${phone}
• واتساب خدمة العملاء: ${whatsapp}
📍 *العنوان:* ${address}
نتمنى لكم دوام الصحة والعافية! 🌹`;
}

/** رسالة فاتورة شاملة وتفاصيل كارت الولاء والرصيد للواتساب */
export function formatInvoiceWhatsAppMessage(params: {
  invoiceNumber: string;
  labNumber: string;
  barcode?: string;
  patientName: string;
  sampleDate: string;
  reportingDate?: string;
  branchName?: string;
  items: { titleAr: string; titleEn?: string; price: number }[];
  testsSubtotal: number;
  visitFee?: number;
  discount: number;
  netTotal: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethodLabel?: string;
  loyaltyProfile?: PatientLoyaltyProfile;
  loyaltyConfig?: LoyaltyConfig;
  invoiceEarnedPoints?: number;
  labInfo?: LabInfo;
}): string {
  const { labInfo, loyaltyProfile, loyaltyConfig } = params;
  const labName = labInfo?.labNameAr || LAB_NAME_AR;
  const supervision = labInfo?.supervisionAr || 'أطباء واستشاريو كلية طب قصر العيني';
  const hotline = labInfo?.hotline || LAB_PHONE;
  const phone = labInfo?.phone || LAB_PHONE_SECONDARY;
  const whatsapp = labInfo?.whatsapp || LAB_WHATSAPP;
  const address = labInfo?.mainAddress || BRANCH_MAIN_ADDRESS;
  const instapay = labInfo?.instapay || INSTAPAY_IPA;
  const vodafoneCash = labInfo?.vodafoneCash || WALLET_VODAFONE;

  let loyaltySection = '';
  if (loyaltyProfile && loyaltyConfig) {
    const tier = computeLoyaltyTier(loyaltyProfile.totalPoints || 0, loyaltyConfig);
    const pct = tierDiscountRate(tier, loyaltyConfig);
    const cash = pointsCashValue(loyaltyProfile.totalPoints || 0, loyaltyConfig);
    loyaltySection = `\n\n💳 *كارت الولاء ونقاطك المرفقة بالفاتورة:*
• رقم الكارت: *${loyaltyProfile.cardNumber || loyaltyProfile.barcode}* (${TIER_NAMES_AR[tier]})
• نسبة الخصم الدائمة: *%${pct}*${params.invoiceEarnedPoints ? `\n• نقاط مكتسبة من هذه الفاتورة: *+${params.invoiceEarnedPoints} نقطة*` : ''}
• رصيدك الحالي: *${Number(loyaltyProfile.totalPoints || 0).toLocaleString()} نقطة* (= *${cash.exactEGP} ج.م*)
• نظام الاستبدال: كل 100 نقطة = ${cash.egpPer100} ج.م خصم`;
  }

  return `🧾 *${labName}*
_${supervision}_
━━━━━━━━━━━━━━━━━━━━━━
📋 *فاتورة فحص طبي وإيصال سداد*
• رقم الفاتورة: *${params.invoiceNumber}*
• رقم المعمل: *${params.labNumber}*${params.barcode ? ` | باركود: *${params.barcode}*` : ''}
• اسم المريض: *${params.patientName}*
• تاريخ السحب: ${params.sampleDate}${params.reportingDate ? `\n• موعد الاستلام: ${params.reportingDate}` : ''}${params.branchName ? `\n• الفرع: ${params.branchName}` : ''}

🔬 *تفاصيل الفحوصات (${params.items.length}):*
${params.items.map((it, idx) => `${idx + 1}. ${it.titleAr}${it.titleEn ? ` (${it.titleEn})` : ''} — *${Number(it.price).toFixed(0)} ج.م*`).join('\n')}

💰 *البيان المالي:*
• إجمالي التحاليل: *${params.testsSubtotal.toFixed(0)} ج.م*${params.visitFee && params.visitFee > 0 ? `\n• رسوم الزيارة: *+${params.visitFee.toFixed(0)} ج.م*` : ''}${params.discount > 0 ? `\n• الخصم المطبق: *-${params.discount.toFixed(0)} ج.م*` : ''}
• *الصافي المطلوب:* *${params.netTotal.toFixed(0)} ج.م*
• *المدفوع:* *${params.paidAmount.toFixed(0)} ج.م*${params.paymentMethodLabel ? ` (${params.paymentMethodLabel})` : ''}
• *المتبقي:* *${params.remainingAmount > 0 ? `${params.remainingAmount.toFixed(0)} ج.م` : 'مسدد بالكامل ✓'}*${loyaltySection}

💳 *بيانات التحويل الإلكتروني (عند الحاجة):*
• إنستاباي: ${instapay}
• فودافون كاش: ${vodafoneCash}

📞 الخط الساخن: ${hotline} | الهاتف: ${phone} | واتساب: ${whatsapp}
📍 ${address}
_(مرفق نسخة الفاتورة المعتمدة بكامل تفاصيل الكارت)_ 🌸`;
}

