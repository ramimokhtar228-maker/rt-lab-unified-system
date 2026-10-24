import { LabReport, LabInfo } from '../types/lab';

export const BRANCH_MAIN_ADDRESS = 'ميدان بهتيم — برج صيدلية العزبي — الدور الثالث (أمام الأسانسير) — شبرا الخيمة';
export const LAB_NAME_AR = 'معامل RT للتحاليل الطبية والتشخيصية';
export const LAB_PHONE = '01100874444';
export const LAB_WHATSAPP = '01100874444';
export const INSTAPAY_IPA = 'ramirtlab@instapay';
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

  // 1. Format Tests (Clear, concise, professional)
  let testsBlock = '';
  if (params.packageName) {
    const pkgPrice = params.packagePrice !== undefined ? params.packagePrice : params.netAmount;
    testsBlock += `• *باقة:* ${params.packageName} (${pkgPrice} ج.م)\n`;

    if (params.extraTestsDetails && params.extraTestsDetails.length > 0) {
      const extras = params.extraTestsDetails.map(t => (t.code || t.nameEn || t.nameAr).trim()).join('، ');
      testsBlock += `• *تحاليل إضافية:* ${extras}\n`;
    }
  } else if (params.testsDetails && params.testsDetails.length > 0) {
    const items = params.testsDetails.map(t => {
      const codeOrEn = (t.code || t.nameEn || t.nameAr).trim();
      const p = t.price ? ` (${t.price} ج.م)` : '';
      return `• ${codeOrEn}${p}`;
    }).join('\n');
    testsBlock += items + '\n';
  } else if (params.testsList) {
    const lines = params.testsList.split('\n').map(l => l.trim()).filter(Boolean);
    testsBlock += lines.map(l => l.startsWith('•') ? l : `• ${l}`).join('\n') + '\n';
  } else {
    testsBlock += '• فحوصات مخبرية شاملة\n';
  }

  // 2. Location
  const locBlock = params.isHomeVisit
    ? `• نوع الحجز: *زيارة منزلية خاصة لسحب العينات* 🏠\n• عنوان الزيارة: *${params.address || 'مسجل لدى طاقم الزيارات'}*${params.deliveryNotes ? ` (${params.deliveryNotes})` : ''}`
    : `• المقر: *${params.branchName || 'الفرع الرئيسي'}* 🏥\n• العنوان: ${branchAddr}\n• اللوكيشن: ${mapsLink}`;

  // 3. Financial calculations with 100% precision
  const visitFee = params.visitFee || 0;
  const discount = Math.max(0, params.discountAmount || 0);
  const net = params.netAmount;
  const rawSubtotal = Math.max(net, params.subtotal || (net + discount - visitFee));
  const paid = params.paidAmount !== undefined ? params.paidAmount : net;
  const remaining = params.remainingAmount !== undefined ? params.remainingAmount : Math.max(0, net - paid);
  const remainingText = remaining > 0 ? `*متبقي ${remaining} ج.م*` : 'مسدد بالكامل ✅';

  // 4. Fasting
  const fastingText = params.fastingHours && params.fastingHours > 0
    ? `صيام *${params.fastingHours} ساعات* قبل سحب العينة (يُسمح بشرب الماء فقط)`
    : `يُرجى الصيام في حال طلبت التحاليل ذلك (شرب الماء مسموح دائماً)`;

  return `🔬 *${labTitle}*
*أ.د. رامي مختار — استشاريو الباثولوجيا الإكلينيكية (طب قصر العيني)*
━━━━━━━━━━━━━━━━━━━━
أهلاً بحضرتك أ/ *${params.patientName.trim()}* 🌸
تم تأكيد حجز موعد تحاليلكم الطبية بنجاح ✅

📋 *بيانات الموعد:*
• رقم الملف: *#${params.labNumber}*${params.barcode ? ` | باركود: *${params.barcode}*` : ''}
• الموعد: *${params.date}* — الساعة *${params.time}*
${locBlock}

🧪 *الفحوصات المطلوبة:*
${testsBlock.trimEnd()}

💰 *البيان المالي:*
• إجمالي الفحوصات: *${rawSubtotal} ج.م*
${discount > 0 ? `• الخصم المطبق (${params.discountLabel}): *- ${discount} ج.م*\n` : ''}${visitFee > 0 ? `• رسوم الزيارة المنزلية: *+ ${visitFee} ج.م*\n` : ''}• *الصافي المطلوب:* *${net} ج.م*
• المبلغ المسدد: *${paid} ج.م*
• حالة السداد: ${remainingText}
• طريقة الدفع: ${params.paymentMethod}

⚠️ *تعليمات هامة:*
• ${fastingText}.

📞 *للتواصل أو الاستفسار:* ${contactPhone}
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
  const phoneDisplay = customLabInfo?.hotline || customLabInfo?.phone || customLabInfo?.whatsapp || LAB_PHONE;
  const addressDisplay = customLabInfo?.mainAddress || BRANCH_MAIN_ADDRESS;
  const labTitle = customLabInfo?.labNameAr || LAB_NAME_AR;

  return `🔬 *${labTitle}*
*معامل أ.د. رامي مختار — استشاريو الباثولوجيا الإكلينيكية (طب قصر العيني)*
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
📞 هاتف المعمل: ${phoneDisplay}
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
