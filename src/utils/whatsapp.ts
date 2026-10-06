import { LabReport, LabInfo } from '../types/lab';

export function formatWhatsAppMessage(report: LabReport, customLabInfo?: LabInfo): string {
  const p = report.patient;
  const profilesList = report.profiles.map(pr => `• ${pr.titleEn} (${pr.titleAr})`).join('\n');
  const dateFormatted = p.sampleDate ? new Date(p.sampleDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');

  const referringDr = p.referringDoctorTitle === 'Herself' || p.referringDoctorTitle === 'Himself'
    ? 'طلب فحص ذاتي (Self-Request)'
    : `${p.referringDoctorTitle} ${p.referringDoctorName}`.trim();

  const phoneDisplay = customLabInfo?.hotline || customLabInfo?.phone || customLabInfo?.whatsapp || LAB_PHONE;
  const addressDisplay = customLabInfo?.mainAddress || BRANCH_MAIN_ADDRESS;

  return `🔬 *${customLabInfo?.labNameAr || 'معامل RT للتحاليل التشخيصية'}*
*معامل أ.د. رامي مختار*
*أطباء الباثولوجيا الإكلينيكية والكيميائية - كلية طب قصر العيني*
────────────────────
سعادة المريض/ة: *${p.fullName}*
رقم الملف / الباركود: *${p.labNumber}*
تاريخ سحب العينة: ${dateFormatted}
الطبيب المعالج: ${referringDr}

📋 *الفحوصات الطبية المنجزة:*
${profilesList}

حالة التقرير: *معتمد ومدقق رسمياً* ✅
إشراف: *${report.staff?.pathologist || "أ.د. رامي مختار"}*
مراجعة: ${report.staff?.verifiedBy || "د. مصطفى العوضي"}

📎 يسعدنا إبلاغكم بجاهزية نتائج تحاليلكم الطبية.
يمكنكم استلام النسخة الورقية المعتمدة من فرع المعمل، أو طلب إرسال النسخة الرقمية (PDF) مباشرة عبر هذه المحادثة.

مع تمنيات أسرة *معامل RT* لكم بموفور الصحة والعافية. 🌸
📞 هاتف المعمل: ${phoneDisplay}
📍 العنوان: ${addressDisplay}`;
}

export function openWhatsApp(phone: string, message: string): void {
  // Clean phone number: remove spaces, dashes, parentheses
  let cleaned = phone.replace(/[^0-9]/g, '');

  // If local Egyptian number starting with 01, prepend 20
  if (cleaned.startsWith('01') && cleaned.length === 11) {
    cleaned = '20' + cleaned.substring(1);
  } else if (!cleaned.startsWith('20') && cleaned.length === 10 && cleaned.startsWith('1')) {
    cleaned = '20' + cleaned;
  }

  const encoded = encodeURIComponent(message);
  const url = `https://wa.me/${cleaned}?text=${encoded}`;
  window.open(url, '_blank');
}

export const BRANCH_MAIN_ADDRESS = 'ميدان بهتيم برج صيدليه العزبى الدور الثالث امام الأسانسير شبرا الخيمه';
export const LAB_NAME_AR = 'معامل RT للتحاليل الطبية والتشخيصية';
export const LAB_PHONE = '01100874444';
export const INSTAPAY_IPA = 'ramirtlab@instapay';

export function formatBookingConfirmationWhatsAppMessage(params: {
  patientName: string;
  labNumber: string;
  phone?: string;
  date: string;
  time: string;
  isHomeVisit: boolean;
  address?: string;
  deliveryNotes?: string;
  branchAddress?: string;
  testsList: string;
  subtotal: number;
  discountAmount: number;
  discountLabel: string;
  visitFee?: number;
  netAmount: number;
  paymentMethod: string;
  fastingHours?: number;
}): string {
  const branchAddr = params.branchAddress || BRANCH_MAIN_ADDRESS;
  const loc = params.isHomeVisit
    ? `🏠 *نوع الحجز:* زيارة منزلية
📍 *عنوان الزيارة:* ${params.address || '—'}
${params.deliveryNotes ? `📝 *تفاصيل الزيارة:* ${params.deliveryNotes}\n` : ''}📞 *تليفون التواصل:* ${params.phone || '—'}`
    : `🏥 *نوع الحجز:* حضور بالمعمل
🏢 *عنوان الفرع:* ${branchAddr}
📞 *تليفون التواصل:* ${params.phone || LAB_PHONE}`;

  const visitFeeLine = (params.visitFee && params.visitFee > 0)
    ? `• *رسوم الزيارة المنزلية:* ${params.visitFee} ج.م\n`
    : '';

  const fastingNote = (params.fastingHours && params.fastingHours > 0)
    ? `• الصيام لمدة *${params.fastingHours} ساعة* قبل سحب العينة (الماء مسموح).`
    : `• يُرجى الصيام إذا كانت التحاليل تتطلب ذلك (الماء مسموح).`;

  return `🌟 *مرحباً بك في ${LAB_NAME_AR}*
*معامل رامي مختار — أطباء كلية طب قصر العيني*

تم تأكيد حجز موعد التحاليل بنجاح ✅

────────────────────
👤 *البيانات الشخصية*
• *الاسم:* ${params.patientName}
• *رقم الحجز / الملف:* #${params.labNumber}
• *الهاتف:* ${params.phone || '—'}
• *اليوم والتاريخ:* ${params.date}
• *الساعة:* ${params.time}

${loc}

────────────────────
🧪 *التحاليل المطلوبة* (اختصارات)
${params.testsList}

────────────────────
💰 *الحساب*
• *السعر الأصلي (إجمالي):* ${params.subtotal} ج.م
• *نسبة / قيمة الخصم أو كرت الولاء:* ${params.discountLabel}${params.discountAmount ? ` (−${params.discountAmount} ج.م)` : ''}
${visitFeeLine}• *السعر بعد الخصم + الرسوم:* *${params.netAmount} ج.م*
• *طريقة الدفع:* ${params.paymentMethod}

────────────────────
⚠️ *تعليمات وشروط ما قبل التحاليل*
${fastingNote}
• إحضار البطاقة الشخصية عند الحضور أو الزيارة.
• في الزيارة المنزلية: التواجد في العنوان في الموعد المحدد.
• أي تعديل على الموعد يُرجى إبلاغ المعمل مسبقاً.

────────────────────
شكراً لثقتكم 🌸
معامل RT تتمنى لكم دوام الصحة والعافية.
📞 ${LAB_PHONE}`;
}

export function formatPostSampleWhatsAppMessage(params: {
  patientName: string;
  labNumber: string;
  notes?: string;
  expectedTime?: string;
  loyaltyCardCode?: string;
  discountPercentage?: number;
}): string {
  const loyaltyPart = params.loyaltyCardCode ? `
💳 *تم تفعيل كارت الولاء RT الخاص بكم بنجاح:*
• *رقم الكارت:* ${params.loyaltyCardCode}
• *نسبة الخصم الدائمة:* ${params.discountPercentage || 15}%
يمكنكم إبراز الكارت في زياراتكم القادمة للحصول على الخصم الفوري.` : '';

  return `*معامل RT للتحاليل الطبية والتشخيصية* 🔬🩺
عزيزنا المريض: *${params.patientName}*

✅ *تم سحب واستلام عيناتكم الطبية بنجاح.*
• *رقم الملف:* #${params.labNumber}
• *تاريخ ووقت السحب:* ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
${params.notes ? `• *ملاحظات العينة:* ${params.notes}\n` : ''}• *الموعد المتوقع لصدور النتيجة المعتمدة:* ${params.expectedTime || 'خلال ساعات قليلة اليوم بإذن الله'}

نعمل بأعلى معايير الدقة المعملية الدولية لضمان أصح النتائج. سيصلكم إشعار بالنتيجة فور اعتمادها.
${loyaltyPart}

⭐ *تقييمكم يهمنا:* يسعدنا تقييم تجربتكم اليوم لمساعدتنا على تقديم أفضل رعاية طبية دائماً.
مع أطيب تمنيات معامل RT لكم بالشفاء التام! 🌹`;
}
