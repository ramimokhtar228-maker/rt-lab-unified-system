import React, { useRef } from 'react';
import { LabReport } from '../types/lab';
import { 
  Printer, 
  X, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  User, 
  MapPin, 
  Phone, 
  Stethoscope, 
  FlaskConical, 
  MessageCircle,
  QrCode,
  ShieldCheck,
  Building2,
  Home
} from 'lucide-react';
import { BRANCH_MAIN_ADDRESS, openWhatsApp } from '../utils/whatsapp';

interface PatientSheetModalProps {
  report: LabReport;
  onClose: () => void;
}

export const PatientSheetModal: React.FC<PatientSheetModalProps> = ({ report, onClose }) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const p = report.patient;
  const isHomeVisit = p.bookingType === 'home_visit';

  const handlePrint = () => {
    window.print();
  };

  const handleSendToChemistWhatsApp = () => {
    const chemistPhone = '01000624029'; // Default lab chemist / unit coordinator line
    let msg = `📋 *شيت عمل واستلام عينة مريض - معامل RT الطبية*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `👤 *المريض:* ${p.fullName}\n`;
    msg += `🔢 *كود العينة / باركود:* ${p.barcode || report.reportNumber}\n`;
    msg += `📁 *رقم الملف:* ${p.labNumber || report.reportNumber}\n`;
    msg += `📅 *التاريخ:* ${new Date(p.sampleDate || new Date()).toLocaleDateString('ar-EG')}\n`;
    msg += `⏰ *التوقيت:* ${p.appointmentTime || '09:00 ص'}\n`;
    msg += `🏥 *نوع الحجز:* ${isHomeVisit ? `زيارة منزلية (${p.homeAddress || ''})` : 'حضور بالفرع'}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🧪 *التحاليل المطلوبة للوحدات:*\n`;

    let itemIdx = 1;
    report.profiles.forEach(prof => {
      msg += `\n*• بروفايل: ${prof.titleAr} (${prof.titleEn})*\n`;
      prof.parameters.forEach(param => {
        msg += `   ${itemIdx++}. ${param.name} [العينة: ${prof.sampleType || 'Serum'}]\n`;
      });
    });

    msg += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `⚠️ *ملاحظات:* ${p.fastingHours ? `صيام ${p.fastingHours} ساعات` : 'عينة عادية'} | ${p.clinicalHistory || 'لا توجد ملاحظات سريرية'}\n`;
    msg += `👨‍🔬 *الكيميائي المستلم بالوحدة:* د. هبة الشناوي\n`;
    msg += `🩺 *المراجع المعتمد:* أ.د. رامي مختار (طب قصر العيني)\n`;

    openWhatsApp(chemistPhone, msg);
  };

  // Build flattened investigation items list for the work sheet
  const workItems: Array<{
    code: string;
    name: string;
    nameAr: string;
    sampleType: string;
    tubeColor: string;
    unit: string;
    reference: string;
    currentResult: string;
    method?: string;
  }> = [];

  report.profiles.forEach(prof => {
    prof.parameters.forEach(param => {
      let tube = 'سيروم غطاء أحمر / أصفر';
      const sampleLower = (prof.sampleType || '').toLowerCase();
      const paramLower = param.name.toLowerCase();

      if (sampleLower.includes('edta') || paramLower.includes('cbc') || paramLower.includes('blood count')) {
        tube = 'دم كامل EDTA غطاء بنفسجي';
      } else if (sampleLower.includes('citrate') || paramLower.includes('pt') || paramLower.includes('inr')) {
        tube = 'سترات صوديوم غطاء أزرق';
      } else if (sampleLower.includes('urine') || paramLower.includes('urine')) {
        tube = 'عينة بول معقمة';
      } else if (sampleLower.includes('stool')) {
        tube = 'عينة براز معقمة';
      }

      workItems.push({
        code: prof.profileCode || 'TEST',
        name: param.name,
        nameAr: prof.titleAr,
        sampleType: prof.sampleType || 'Serum',
        tubeColor: tube,
        unit: param.unit || '-',
        reference: param.textReference || (param.minNormal !== undefined ? `${param.minNormal} - ${param.maxNormal}` : '-'),
        currentResult: param.result || '',
        method: param.method || 'Automated Clinical Assay'
      });
    });
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-4 flex flex-col max-h-[95vh]">
        {/* Modal Toolbar (Hidden in Print) */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-rose-900 text-rose-200 border border-rose-800">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-black">
                شيت عمل المريض واستلام العينات المخبرية (PATIENT WORK SHEET)
              </h3>
              <p className="text-[11px] text-slate-300">
                جدول تحاليل الحالة المرسل للوحدات والكيميائي لتدوين النتائج والاعتماد
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSendToChemistWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
              title="إرسال شيت الفحوصات للكيميائي في الوحدات عبر الواتس اب"
            >
              <MessageCircle className="w-4 h-4" />
              <span>إرسال للكيميائي بالوحدات</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-900 hover:bg-rose-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة شيت العمل (A4)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Sheet Body */}
        <div 
          ref={sheetRef}
          className="p-6 md:p-8 overflow-y-auto flex-1 bg-white text-slate-900 space-y-5 print:p-0 print:overflow-visible text-xs"
        >
          {/* Header */}
          <div className="border-b-2 border-red-950 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-right space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-900"></span>
                <h1 className="text-xl font-black text-red-950 tracking-tight">
                  معامل RT للتحاليل الطبية والتشخيصية
                </h1>
              </div>
              <p className="text-xs font-bold text-slate-700">
                معامل د. رامي مختار · أطباء كلية طب قصر العيني - جامعة القاهرة
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                Clinical & Chemical Pathology Diagnostic Laboratories · استمارة التشغيل المعملي
              </p>
            </div>

            <div className="text-center sm:text-left space-y-1">
              <div className="inline-block px-3 py-1 rounded-lg bg-red-50 border border-red-200 text-red-950 font-black text-sm font-mono tracking-wider">
                {p.barcode || report.reportNumber}
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                LAB NO: {p.labNumber || report.reportNumber}
              </p>
              <p className="text-[10px] text-slate-400">
                تاريخ الطباعة: {new Date().toLocaleString('ar-EG')}
              </p>
            </div>
          </div>

          {/* Title Bar */}
          <div className="bg-slate-900 text-white py-2 px-4 rounded-xl flex items-center justify-between print:bg-slate-900 print:text-white">
            <span className="font-black text-sm">
              شيت عمل واستلام عينات المريض (PATIENT BENCH SHEET)
            </span>
            <span className="text-xs text-rose-200 font-bold">
              الوحدة المعملية: {report.profiles[0]?.category || 'Clinical Pathology'}
            </span>
          </div>

          {/* Patient Details Dossier */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="block text-[11px] text-slate-500 font-medium">اسم المريض</span>
                <span className="font-black text-slate-900 text-sm">{p.fullName}</span>
              </div>

              <div>
                <span className="block text-[11px] text-slate-500 font-medium">السن والنوع</span>
                <span className="font-bold text-slate-800">
                  {p.age} {p.ageUnit === 'months' ? 'شهر' : 'سنة'} / {p.gender === 'male' ? 'ذكر' : 'أنثى'}
                </span>
              </div>

              <div>
                <span className="block text-[11px] text-slate-500 font-medium">رقم التليفون للتواصل</span>
                <span className="font-bold text-slate-800 font-mono" dir="ltr">{p.phone}</span>
              </div>

              <div>
                <span className="block text-[11px] text-slate-500 font-medium">الطبيب المعالج</span>
                <span className="font-bold text-slate-800">
                  {p.referringDoctorTitle || ''} {p.referringDoctorName || 'أطباء كلية طب قصر العيني'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-slate-200">
              <div>
                <span className="block text-[11px] text-slate-500 font-medium">نوع الحجز والموقع</span>
                <span className={`inline-flex items-center gap-1 font-bold ${isHomeVisit ? 'text-amber-700' : 'text-slate-800'}`}>
                  {isHomeVisit ? <Home className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
                  <span>{isHomeVisit ? 'زيارة منزلية لسحب العينة' : 'حضور بالفرع الرئيسي'}</span>
                </span>
              </div>

              <div>
                <span className="block text-[11px] text-slate-500 font-medium">تاريخ وميعاد السحب</span>
                <span className="font-bold text-slate-800 font-mono">
                  {p.appointmentDate || p.sampleDate || new Date().toISOString().split('T')[0]} - {p.appointmentTime || '09:00 ص'}
                </span>
              </div>

              <div>
                <span className="block text-[11px] text-slate-500 font-medium">ساعات الصيام</span>
                <span className="font-bold text-slate-800">
                  {p.fastingHours ? `${p.fastingHours} ساعات صيام` : 'عادي (بدون صيام)'}
                </span>
              </div>

              <div>
                <span className="block text-[11px] text-slate-500 font-medium">الباركود المسلسل</span>
                <span className="font-mono font-bold text-rose-900">{p.barcode || report.reportNumber}</span>
              </div>
            </div>

            {/* Address in case of home visit */}
            {isHomeVisit && p.homeAddress && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-900">عنوان الزيارة المنزلية: </span>
                  <span className="text-amber-800">{p.homeAddress}</span>
                  {p.homeContactPhone && (
                    <span className="mr-2 font-mono text-amber-900">· تليفون بديل: {p.homeContactPhone}</span>
                  )}
                </div>
              </div>
            )}

            {p.clinicalHistory && (
              <div className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                <strong className="text-slate-800">ملاحظات سريرية للحالة: </strong>
                <span>{p.clinicalHistory}</span>
              </div>
            )}
          </div>

          {/* Laboratory Investigations Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                <FlaskConical className="w-4 h-4 text-rose-900" />
                <span>جدول التحاليل والفحوصات المحجوزة وخانات تدوين النتائج للوحدات المعملية:</span>
              </h4>
              <span className="text-[11px] text-slate-500 font-bold">
                إجمالي الفحوصات: {workItems.length} تحليل
              </span>
            </div>

            <div className="border-2 border-slate-800 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-right border-collapse">
                <thead className="bg-slate-900 text-white font-bold text-[11px]">
                  <tr>
                    <th className="p-2 text-center w-8 border-l border-slate-700">#</th>
                    <th className="p-2 w-28 border-l border-slate-700">كود التحليل</th>
                    <th className="p-2 border-l border-slate-700">الفحص المطلوب (Investigation)</th>
                    <th className="p-2 border-l border-slate-700">العينة / الأنبوبة</th>
                    <th className="p-2 w-36 bg-red-950 text-white text-center border-l border-slate-700">
                      نتيجة الكيميائي (Result)
                    </th>
                    <th className="p-2 w-20 border-l border-slate-700">الوحدة</th>
                    <th className="p-2 w-36 border-l border-slate-700">المعدل الطبيعي</th>
                    <th className="p-2 w-28 text-center">ملاحظات الجهاز</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {workItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="p-2.5 text-center font-bold text-slate-500 border-l border-slate-200">
                        {idx + 1}
                      </td>
                      <td className="p-2.5 font-mono font-bold text-slate-900 border-l border-slate-200">
                        {item.code}
                      </td>
                      <td className="p-2.5 border-l border-slate-200">
                        <div className="font-bold text-slate-900">{item.name}</div>
                        <div className="text-[10px] text-slate-500">{item.nameAr}</div>
                      </td>
                      <td className="p-2.5 border-l border-slate-200">
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {item.tubeColor}
                        </span>
                      </td>
                      {/* Blank / entered result box for bench chemist */}
                      <td className="p-2.5 bg-slate-50/80 border-l border-slate-300 text-center font-bold font-mono text-sm">
                        {item.currentResult ? (
                          <span className="text-rose-950">{item.currentResult}</span>
                        ) : (
                          <div className="h-6 w-full border-b border-dashed border-slate-400 bg-white"></div>
                        )}
                      </td>
                      <td className="p-2.5 font-mono text-slate-600 border-l border-slate-200" dir="ltr">
                        {item.unit}
                      </td>
                      <td className="p-2.5 font-mono text-[11px] text-slate-600 border-l border-slate-200" dir="ltr">
                        {item.reference}
                      </td>
                      <td className="p-2.5 text-center text-[10px] text-slate-400">
                        {item.method || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Chemist Notes / Worklog Area */}
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-1">
            <span className="font-bold text-slate-800 text-[11px] block">
              ملاحظات التشغيل والتحضير بالوحدات (Internal Laboratory Remarks):
            </span>
            <div className="h-10 border-b border-dashed border-slate-300"></div>
          </div>

          {/* Personnel Signatures & Approvals Banner */}
          <div className="border-t-2 border-red-950 pt-4 mt-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="block text-[11px] font-bold text-slate-600">
                  القائم بسحب واستلام العينة
                </span>
                <span className="block font-bold text-slate-900 text-xs">
                  {report.staff?.labChemist || "د. هبة الشناوي (فني السحب والفرز)"}
                </span>
                <div className="h-8 border-b border-dashed border-slate-300 mt-1"></div>
                <span className="text-[10px] text-slate-400 block">التوقيع / وقت الاستلام</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="block text-[11px] font-bold text-slate-600">
                  الكيميائي المنفذ بالوحدة
                </span>
                <span className="block font-bold text-slate-900 text-xs">
                  {report.staff?.verifiedBy || "د. مصطفى العوضي (كيميائي تحاليل)"}
                </span>
                <div className="h-8 border-b border-dashed border-slate-300 mt-1"></div>
                <span className="text-[10px] text-slate-400 block">التوقيع / وقت إنهاء الفحص</span>
              </div>

              <div className="p-3 bg-red-50/60 rounded-xl border border-red-200 space-y-2">
                <span className="block text-[11px] font-bold text-red-950">
                  الطبيب الاستشاري المراجع والمعتمد
                </span>
                <span className="block font-black text-red-950 text-xs">
                  {report.staff?.pathologist || "أ.د. رامي مختار - طب قصر العيني"}
                </span>
                <div className="h-8 border-b border-dashed border-red-300 mt-1 flex items-center justify-center">
                  <span className="text-[10px] text-red-700 font-bold font-serif">معتمد رسمياً ✓</span>
                </div>
                <span className="text-[10px] text-red-700 block">خاتم واعتماد المعمل</span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>الفرع الرئيسي: {BRANCH_MAIN_ADDRESS}</span>
            <span>الخط الساخن: 01000624029 - 01026361847</span>
            <span>RT LAB Work Sheet · ISO 15189 Quality Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
};
