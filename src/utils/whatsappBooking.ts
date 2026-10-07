export const BRANCH_MAIN_ADDRESS = 'ميدان بهتيم برج صيدلية العزبي الدور الثالث أمام الأسانسير شبرا الخيمة';
export const LAB_NAME_AR = 'معامل RT للتحاليل الطبية والتشخيصية';
export const LAB_CONSULTANTS_TITLE = 'معامل أ.د. رامي مختار — أطباء كلية طب قصر العيني';
export const LAB_PHONE = '01100874444';
export const INSTAPAY_IPA = 'ramirtlab@instapay';
export const WALLET_VODAFONE = '01098765432';

export function formatEgyptianPhoneForWhatsApp(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('002')) cleaned = cleaned.substring(2);
  if (cleaned.startsWith('01') && cleaned.length === 11) cleaned = '20' + cleaned.substring(1);
  if (!cleaned.startsWith('20') && cleaned.length === 10 && cleaned.startsWith('1')) cleaned = '20' + cleaned;
  return cleaned;
}

export function openWhatsAppChat(phone: string, text: string): void {
  const intlPhone = formatEgyptianPhoneForWhatsApp(phone);
  const url = `https://wa.me/${intlPhone}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

export interface BookingWhatsAppParams {
  patientName: string;
  bookingNumber: string;
  date: string;
  time: string;
  phone?: string;
  isHomeVisit: boolean;
  address?: string;
  deliveryNotes?: string;
  branchName?: string;
  branchAddress?: string;
  branchPhone?: string;
  labNameAr?: string;
  visitFee?: number;
  visitSpecialist?: string;
  tests: { code?: string; nameAr?: string; nameEn?: string; price?: number }[] | string;
  subtotal: number;
  testsSubtotal?: number;
  discountAmount: number;
  discountLabel: string;
  netAmount: number;
  paymentMethod: string;
  fastingHours?: number;
  customInstructions?: string;
}

export function generateBookingWhatsAppMessage(params: BookingWhatsAppParams): string {
  const labTitle = params.labNameAr || LAB_NAME_AR;
  const branchAddr = params.branchAddress || BRANCH_MAIN_ADDRESS;
  const branchContact = params.branchPhone || LAB_PHONE;

  // Extract test abbreviations ONLY (no prices)
  let testsAbbreviationsText = '';
  if (typeof params.tests === 'string') {
    testsAbbreviationsText = params.tests;
  } else if (Array.isArray(params.tests)) {
    const list = params.tests.map((t, idx) => {
      const codeOrAbbr = (t.code || t.nameEn || t.nameAr || '').trim();
      return `  ${idx + 1}. ${codeOrAbbr}`;
    });
    testsAbbreviationsText = list.length > 0 ? list.join('\n') : '  • لم يتم تحديد تحاليل';
  } else {
    testsAbbreviationsText = '  • —';
  }

  // Address and location details
  const locationSection = params.isHomeVisit
    ? `🏠 *بيانات وتفاصيل الزيارة المنزلية والعنوان:*
• *العنوان بالتفصيل:* ${params.address || 'العنوان مسجل ومؤكد لدى المعمل'}
${params.deliveryNotes ? `• *تفاصيل وملاحظات الزيارة:* ${params.deliveryNotes}\n` : ''}• *تليفون التواصل للزيارة:* ${params.phone || '—'}${params.visitSpecialist ? `\n• *مسؤول السحب الميداني:* ${params.visitSpecialist}` : ''}`
    : `🏥 *بيانات وعنوان فرع المعمل للحضور:*
• *المقر والفرع:* ${params.branchName || 'فرع بهتيم الرئيسي'}
• *عنوان الفرع:* ${branchAddr}
• *تليفون الفرع للتواصل:* ${branchContact}
• *مواعيد استقبال المراجعين:* يومياً من 8:00 صباحاً حتى 11:00 مساءً`;

  // Financial details
  const originalTotal = params.testsSubtotal || params.subtotal || 0;
  const discountVal = params.discountAmount || 0;
  const priceAfterDiscount = Math.max(0, originalTotal - discountVal);
  const visitFeeVal = params.isHomeVisit ? (params.visitFee && params.visitFee > 0 ? params.visitFee : 0) : 0;
  const visitFeeText = params.isHomeVisit ? `${visitFeeVal} ج.م` : '0 ج.م (حضور بمقر الفرع)';
  
  const discountLabelText = discountVal > 0
    ? `${params.discountLabel || 'خصم معتمد'} (خصم: ${discountVal} ج.م)`
    : (params.discountLabel || 'بدون خصم');

  // Pre-test instructions
  const fastingText = (params.fastingHours && params.fastingHours > 0)
    ? `• الصيام لمدة *${params.fastingHours} ساعة* قبل سحب العينة (يُسمح ويُنصح بشرب الماء النقي فقط).`
    : `• الصيام من 10 إلى 12 ساعة في حالة تحاليل السكر الصائم أو ملف الدهون الشامل، 8 ساعات لوظائف الكبد والكلى (يُسمح بشرب الماء النقي فقط).`;

  const visitSpecificCondition = params.isHomeVisit
    ? `• يُرجى التواجد بالعنوان المحدد في الموعد المختار وتوفير إضاءة ومكان ملائم لسحب العينة.\n• سيقوم أخصائي السحب بالتواصل هاتفياً قبل الوصول بحوالي 15 دقيقة.`
    : `• يُرجى الحضور لمقر الفرع في الموعد المختار لتفادي فترات الانتظار.`;

  return `🌟 *مرحباً بك في ${labTitle}* 🔬✨
*${LAB_CONSULTANTS_TITLE}*
────────────────────────
أهلاً وسهلاً بحضرتك يا أستاذ/ة *${params.patientName}* 🌸
يسعدنا ويشرفنا دائماً تقديم أعلى معايير الرعاية والدقة التشخيصية لحضرتكم، تم تأكيد وتسجيل موعد حجزكم الطبي بنجاح ✅

👤 *البيانات الشخصية وتفاصيل الحجز:*
• *اسم المريض:* ${params.patientName}
• *رقم الملف / الحجز:* #${params.bookingNumber}
• *يوم وتاريخ الحجز:* ${params.date}
• *ساعة وتوقيت الحجز:* ${params.time}
• *تليفون التواصل:* ${params.phone || '—'}
• *نوع الحجز:* ${params.isHomeVisit ? 'زيارة منزلية خاصة (Home Visit 🏠)' : 'حضور بمقر الفرع (Branch Visit 🏥)'}

${locationSection}

────────────────────────
🧪 *التحاليل المطلوبة (اختصارات فقط بدون سعر):*
${testsAbbreviationsText}

────────────────────────
💰 *تفاصيل الحساب المالي والفوترة:*
• *السعر الأصلي إجمالي:* ${originalTotal} ج.م
• *نسبة الخصم أو كرت الولاء:* ${discountLabelText}
• *السعر بعد الخصم:* ${priceAfterDiscount} ج.م
• *رسوم الزيارة:* ${visitFeeText}
• *إجمالي الصافي المطلوب سداده:* *${params.netAmount} ج.م*
• *طريقة السداد:* ${params.paymentMethod}

────────────────────────
⚠️ *تعليمات وشروط ما قبل التحاليل:*
${fastingText}
• تجنب التدخين والجهد البدني العنيف قبل إجراء الفحوصات وسحب العينات مباشرة.
• إحضار أول عينة صباحية في وعاء معقم مخصص لتحاليل البول أو البراز.
• إبلاغ المعمل بأي أدوية تؤخذ بانتظام (مثل أدوية السيولة، الغدة، أو الضغط).
${visitSpecificCondition}
• في حال الرغبة في تعديل الموعد يُرجى إبلاغ المعمل مسبقاً للتنسيق.

────────────────────────
🌸 *أهلاً ومرحباً بكم دائماً في معامل RT، ونتشرف برعايتكم وتقديم أدق النتائج التشخيصية المعتمدة.*
*معامل RT — معامل أ.د. رامي مختار (أطباء كلية طب قصر العيني)*
*نسأل الله العلي القدير لحضرتكم دوام الصحة والعافية والشفاء التام* ✨
📞 هاتف وواتساب المعمل: ${branchContact}
📍 مقر الفرع: ${branchAddr}`;
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
