export const BRANCH_MAIN_ADDRESS = 'ميدان بهتيم برج صيدليه العزبى الدور الثالث امام الأسانسير شبرا الخيمه';
export const LAB_NAME_AR = 'معامل RT للتحاليل الطبية والتشخيصية';
export const LAB_PHONE = '01100874444';
export const LAB_PHONE_SECONDARY = '01100046841';
export const LAB_PHONES = ['01100874444', '01100046841'];
export const INSTAPAY_IPA = 'ramirtlab@instapay';
export const WALLET_VODAFONE = '01098765432';

export function formatEgyptianPhoneForWhatsApp(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('002')) cleaned = cleaned.substring(2);
  if (cleaned.startsWith('01')) cleaned = '2' + cleaned;
  if (!cleaned.startsWith('20') && cleaned.startsWith('1')) cleaned = '20' + cleaned;
  return cleaned;
}

export function openWhatsAppChat(phone: string, text: string): void {
  const intlPhone = formatEgyptianPhoneForWhatsApp(phone);
  const url = `https://wa.me/${intlPhone}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

export function generateBookingWhatsAppMessage(params: {
  patientName: string;
  bookingNumber: string;
  date: string;
  time: string;
  isHomeVisit: boolean;
  address?: string;
  deliveryNotes?: string;
  branchName?: string;
  branchAddress?: string;
  branchPhone?: string;
  labNameAr?: string;
  visitFee?: number;
  visitSpecialist?: string;
  branchRepresentative?: string;
  tests: { nameAr: string; nameEn?: string; code?: string; price?: number }[];
  subtotal: number;
  testsSubtotal?: number;
  discountAmount: number;
  discountLabel: string;
  netAmount: number;
  paymentMethod: string;
}): string {
  const testsList = params.tests
    .map(t => `• ${(t.code && t.code.toUpperCase() !== 'TEST' ? t.code.toUpperCase() : (t.nameEn || t.nameAr)).trim()}`)
    .join('\n');

  const visitFee = params.isHomeVisit ? Math.max(0, Number(params.visitFee) || 0) : 0;
  const totalBeforeDiscount = Math.round((params.testsSubtotal ?? params.subtotal ?? 0) + visitFee);
  const netAfterDiscount = Math.max(0, Math.round(params.netAmount));

  const intro = params.isHomeVisit
    ? 'تم تأكيد حجز موعد *الزيارة المنزلية لسحب العينات الطبية* بنجاح ✅'
    : 'تم تأكيد حجز موعدكم *للحضور لفرع المعمل وإجراء التحاليل الطبية* بنجاح ✅';

  const loc = params.isHomeVisit
    ? `🏠 *نوع الحجز:* زيارة منزلية خاصة\n📍 *العنوان:* ${params.address || 'مسجل لدى طاقم الزيارات'}${params.deliveryNotes ? ` (${params.deliveryNotes})` : ''}\n🩺 *مندوب الزيارة المنزلية:* *${params.visitSpecialist || 'أخصائي السحب المنزلي المعتمد بالمعمل'}*`
    : `🏥 *نوع الحجز:* حضور للفرع\n📍 *الفرع:* ${params.branchName || 'الفرع الرئيسي - بهتيم'}\n🏢 *العنوان:* ${params.branchAddress || BRANCH_MAIN_ADDRESS}\n👤 *مندوب استقبال الفرع:* *${params.branchRepresentative || 'مسؤول الاستقبال وخدمة العملاء بالفرع'}*`;

  const labTitle = params.labNameAr || LAB_NAME_AR;

  return `*مرحباً بك في ${labTitle}* 🔬✨
${intro}

📋 *بيانات الحجز:*
• *رقم الحجز:* #${params.bookingNumber}
• *اسم المريض:* ${params.patientName}
• *اليوم والتاريخ:* ${params.date}
• *الساعة المحددة:* ${params.time}
${loc}

🧪 *التحاليل المطلوبة (الاختصارات):*
${testsList}

💰 *البيان المالي:*
• *المبلغ الكلي:* *${totalBeforeDiscount} ج.م*
• *المبلغ بعد الخصم:* *${netAfterDiscount} ج.م*

⚠️ *تعليمات هامة:* يرجى الصيام في حال طلبت التحاليل ذلك (يسمح بشرب الماء فقط).
⚠️ *تنبيه الحضور:* عدم الحضور فى الموعد المحدد دون تأجيل مسبق سيتم إلغاء الحجز بعد ٢٤ ساعه من تاريخه.
📞 *أرقام التواصل أو تعديل الموعد:* ${params.branchPhone || '01100874444 / 01100046841'}

نسعد دائماً بخدمتكم وتمنياتنا لكم بالصحة والعافية! ❤️`;
}

export function generatePostSampleWhatsAppMessage(params: {
  patientName: string;
  bookingNumber: string;
  notes?: string;
  expectedTime?: string;
  loyaltyCardCode?: string;
  discountPercentage?: number;
  labNameAr?: string;
  branchPhone?: string;
}): string {
  const loyaltyPart = params.loyaltyCardCode ? `\n💳 *تم تفعيل كارت الولاء RT الخاص بكم بنجاح:*
• *رقم الكارت:* ${params.loyaltyCardCode}
• *نسبة الخصم الدائمة:* ${params.discountPercentage || 15}%
يمكنكم إبراز كارت الولاء في الزيارات القادمة للحصول على الخصم الفوري.` : '';

  const labTitle = params.labNameAr || LAB_NAME_AR;

  return `*${labTitle}* 🔬🩺
عزيزنا المريض: *${params.patientName}*
✅ *تم سحب واستلام عيناتكم الطبية بنجاح.*

• *رقم الإيصال:* #${params.bookingNumber}
• *تاريخ ووقت السحب:* ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
${params.notes ? `• *ملاحظات العينة:* ${params.notes}\n` : ''}• *الموعد المتوقع لصدور النتيجة المعتمدة:* ${params.expectedTime || 'خلال ساعات قليلة اليوم بإذن الله'}

سيصلكم إشعار ورابط النتيجة فور اعتمادها من استشاري التحاليل الطبية.${loyaltyPart}

⭐ *تقييمكم يهمنا:* يسعدنا تقييم تجربتكم اليوم لمساعدتنا على تقديم أفضل رعاية طبية دائماً.
مع أطيب تمنيات معامل RT لكم بالشفاء العاجل! 🌹`;
}
