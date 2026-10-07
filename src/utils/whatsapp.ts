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
  const priceAfterDiscount = Math.max(0, params.subtotal - (params.discountAmount || 0));

  const locationSection = params.isHomeVisit
    ? `🏠 *بيانات وعنوان الزيارة المنزلية:*
• *العنوان:* ${params.address || '—'}
${params.deliveryNotes ? `• *تفاصيل وملاحظات الزيارة:* ${params.deliveryNotes}\n` : ''}• *تليفون التواصل للزيارة:* ${params.phone || '—'}`
    : `🏥 *بيانات الحضور بالمعمل:*
• *عنوان الفرع:* ${branchAddr}
• *تليفون المعمل للتواصل:* ${LAB_PHONE}`;

  const visitFeeLine = (params.isHomeVisit && params.visitFee && params.visitFee > 0)
    ? `• *رسوم الزيارة المنزلية:* ${params.visitFee} ج.م\n`
    : '';

  const discountDetails = params.discountAmount > 0
    ? `${params.discountLabel} (خصم: ${params.discountAmount} ج.م)`
    : (params.discountLabel || 'لا يوجد خصم');

  const fastingText = (params.fastingHours && params.fastingHours > 0)
    ? `• الصيام لمدة *${params.fastingHours} ساعة* قبل سحب العينة (شرب الماء مسموح به ومفضل).`
    : `• الصيام من 10 إلى 12 ساعة في حالة تحاليل السكر الصائم، الدهون الثلاثية، الكوليسترول، ووظائف الكبد والكلى (الماء مسموح به).`;

  return `🌟 *مرحباً بك في ${LAB_NAME_AR}*
*معامل أ.د. رامي مختار — أطباء كلية طب قصر العيني*
────────────────────
أهلاً وسهلاً بحضرتك يا *${params.patientName}* 🌸
نسعد بخدمتكم دائماً، تم تأكيد وتسجيل حجز موعد التحاليل بنجاح ✅

👤 *البيانات الشخصية وتفاصيل الحجز:*
• *الاسم:* ${params.patientName}
• *رقم الملف / الحجز:* #${params.labNumber}
• *هاتف التواصل:* ${params.phone || '—'}
• *يوم وتاريخ الحجز:* ${params.date}
• *ساعة الحجز / الموعد:* ${params.time}
• *نوع الحجز:* ${params.isHomeVisit ? 'زيارة منزلية (Home Visit 🏠)' : 'حضور بالمعمل (Branch Visit 🏥)'}

${locationSection}

────────────────────
🧪 *التحاليل المطلوبة (اختصارات فقط بدون سعر):*
${params.testsList}

────────────────────
💰 *تفاصيل الحساب والفاتورة:*
• *السعر الأصلي إجمالي:* ${params.subtotal} ج.م
• *نسبة الخصم أو كرت الولاء:* ${discountDetails}
• *السعر بعد الخصم:* ${priceAfterDiscount} ج.م
${visitFeeLine}• *إجمالي الصافي المطلوب سداده:* *${params.netAmount} ج.م*
• *طريقة السداد:* ${params.paymentMethod}

────────────────────
⚠️ *تعليمات وشروط ما قبل التحاليل:*
${fastingText}
• يُفضل إحضار العينة الصباحية الأولى في عبوة معقمة مخصصة (لتحاليل البول والبراز).
• تجنب المجهود البدني العنيف والتدخين قبل إجراء الفحوصات مباشرة.
• إبلاغ المعمل بأي أدوية تؤخذ بانتظام (مثل أدوية الضغط، السيولة، أو الغدة).
${params.isHomeVisit ? '• التواجد في العنوان في الموعد المحدد مع تجهيز إضاءة مناسبة لمكان السحب.\n' : '• إحضار بطاقة الرقم القومي أو إثبات الشخصية عند الحضور للفرع.\n'}• في حال الرغبة في تعديل الموعد يُرجى إبلاغ المعمل مسبقاً.

────────────────────
🌸 *نشكركم لاختياركم معامل RT، ونتشرف دائماً برعايتكم وتقديم أدق النتائج التشخيصية المعتمدة.*
*معامل RT — معامل أ.د. رامي مختار*
*نتمنى لحضرتكم دوام الصحة والعافية والشفاء التام* ✨
📞 الخط الساخن وهاتف المعمل: ${LAB_PHONE}`;
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
