import React, { useState, useEffect } from 'react';
import { LabInfo, LabStaffSignatures } from '../types';
import { DEFAULT_STAFF } from '../data/labCatalog';
import {
  HANDWRITTEN_SIGNATURE_OPTIONS,
  HandwrittenSignatureKey,
  resolveHandwrittenSignatureSrc
} from '../assets/signatureImages';
import { Building2, Phone, MapPin, UserCheck, X, Check, RefreshCw, Trash2 } from 'lucide-react';

interface LabInfoEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  labInfo: LabInfo;
  onUpdateLabInfo: (updated: LabInfo) => void;
  staffSignatures: LabStaffSignatures;
  onUpdateStaffSignatures: (updated: LabStaffSignatures) => void;
}

export const LabInfoEditModal: React.FC<LabInfoEditModalProps> = ({
  isOpen,
  onClose,
  labInfo,
  onUpdateLabInfo,
  staffSignatures,
  onUpdateStaffSignatures
}) => {
  const [formData, setFormData] = useState<LabInfo>({ ...labInfo });
  const [staffData, setStaffData] = useState<LabStaffSignatures>({ ...DEFAULT_STAFF, ...staffSignatures });
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({ ...labInfo });
      setStaffData({ ...DEFAULT_STAFF, ...staffSignatures });
    }
  }, [isOpen, labInfo, staffSignatures]);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateLabInfo(formData);
    onUpdateStaffSignatures(staffData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 700);
  };

  const handleResetToDefault = () => {
    setFormData({
      labNameAr: 'معامل RT للتحاليل الطبية والتشخيصية',
      labNameEn: 'RT Diagnostic Laboratories',
      sloganAr: 'التشخيص الصحيح يبدأ معنا · دقة، سرعة، وأمان تشخيصي',
      sloganEn: 'Accurate Diagnosis Starts With Us · Precision & Care',
      supervisionAr: 'أطباء واستشاريو كلية طب قصر العيني - جامعة القاهرة',
      supervisionEn: 'Kasr Al Ainy Faculty of Medicine Consultants - Cairo University',
      accreditation: 'ISO 15189 Certified Quality Management',
      hotline: '01100874444',
      phone: '01100874444 / 01100046841',
      whatsapp: '01100874444',
      mainAddress: 'ميدان بهتيم برج صيدليه العزبى الدور الثالث امام الأسانسير شبرا الخيمه',
      instapay: 'ramirtlab@instapay',
      vodafoneCash: '01098765432'
    });
    setStaffData({ ...DEFAULT_STAFF });
  };

  const renderStaffSignatureCard = (
    heading: string,
    accentClass: string,
    nameKey: keyof LabStaffSignatures,
    titleKey: keyof LabStaffSignatures,
    licenseKey: keyof LabStaffSignatures,
    sigKeyField: keyof LabStaffSignatures,
    showField: keyof LabStaffSignatures
  ) => {
    const nameVal = String(staffData[nameKey] ?? '');
    const titleVal = String(staffData[titleKey] ?? '');
    const licenseVal = String(staffData[licenseKey] ?? '');
    const sigKeyVal = (staffData[sigKeyField] as HandwrittenSignatureKey | undefined) || 'auto';
    const isVisible = staffData[showField] !== false;
    const sigPreview = resolveHandwrittenSignatureSrc(nameVal, sigKeyVal);

    return (
      <div className={`bg-slate-900/80 border p-3 rounded-xl space-y-2 ${accentClass} ${!isVisible ? 'opacity-55' : ''}`}>
        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-white cursor-pointer">
            <input
              type="checkbox"
              checked={isVisible}
              onChange={(e) => setStaffData({ ...staffData, [showField]: e.target.checked })}
              className="w-3.5 h-3.5 accent-rose-500 rounded cursor-pointer"
            />
            <span>{heading}</span>
          </label>
          <button
            type="button"
            onClick={() =>
              setStaffData({
                ...staffData,
                [nameKey]: '',
                [titleKey]: '',
                [licenseKey]: '',
                [sigKeyField]: 'none',
                [showField]: false
              })
            }
            className="text-[10px] text-rose-400 hover:text-rose-200 flex items-center gap-0.5 cursor-pointer"
            title="حذف / إخفاء من الإمضاءات الافتراضية"
          >
            <Trash2 className="w-3 h-3" />
            <span>حذف</span>
          </button>
        </div>

        <div>
          <label className="text-[10px] text-slate-400">الاسم:</label>
          <input
            type="text"
            value={nameVal}
            onChange={(e) =>
              setStaffData({
                ...staffData,
                [nameKey]: e.target.value,
                ...(e.target.value.trim() ? { [showField]: true } : {})
              })
            }
            placeholder="الاسم كما يظهر بالتقرير..."
            className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white font-bold"
          />
        </div>

        <div>
          <label className="text-[10px] text-slate-400">المسمى الوظيفي والدرجة:</label>
          <input
            type="text"
            value={titleVal}
            onChange={(e) => setStaffData({ ...staffData, [titleKey]: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white text-xs"
          />
        </div>

        <div>
          <label className="text-[10px] text-slate-400">رقم الترخيص / الكود:</label>
          <input
            type="text"
            value={licenseVal}
            onChange={(e) => setStaffData({ ...staffData, [licenseKey]: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-slate-300 font-mono text-xs"
          />
        </div>

        <div>
          <label className="text-[10px] text-slate-400">الإمضاء اليدوي المرفق:</label>
          <select
            value={sigKeyVal}
            onChange={(e) =>
              setStaffData({ ...staffData, [sigKeyField]: e.target.value as HandwrittenSignatureKey })
            }
            className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-slate-100 text-[11px] font-bold"
          >
            {HANDWRITTEN_SIGNATURE_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {sigPreview && (
          <div className="bg-white rounded-lg p-1.5 flex items-center justify-center h-10">
            <img src={sigPreview} alt={nameVal} className="max-h-8 w-auto object-contain" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-rose-950 via-slate-900 to-slate-900 border-b border-rose-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-600/20 text-rose-400 rounded-xl border border-rose-500/30">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">
                تعديل وتفعيل بيانات المعمل، الإمضاءات، والعناوين والهواتف
              </h2>
              <p className="text-xs text-slate-400">
                يتم تطبيق هذه البيانات فورياً على جميع التقارير (A4)، الفواتير المالية، كروت الولاء، ورسائل الواتساب
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-6 max-h-[72vh]">
          {/* 1. Basic Lab Branding */}
          <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <Building2 className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-bold text-white">بيانات هوية المعمل والشعار (Branding)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">اسم المعمل باللغة العربية:</label>
                <input
                  type="text"
                  value={formData.labNameAr}
                  onChange={e => setFormData({ ...formData, labNameAr: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-bold focus:border-rose-500"
                />
              </div>
              <div dir="ltr">
                <label className="block text-slate-300 font-semibold mb-1 text-left">Laboratory Name (English):</label>
                <input
                  type="text"
                  value={formData.labNameEn}
                  onChange={e => setFormData({ ...formData, labNameEn: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-bold focus:border-rose-500 text-left font-sans"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">الإشراف الطبي والعلمي (عربي):</label>
                <input
                  type="text"
                  value={formData.supervisionAr}
                  onChange={e => setFormData({ ...formData, supervisionAr: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-rose-500"
                />
              </div>
              <div dir="ltr">
                <label className="block text-slate-300 font-semibold mb-1 text-left">Medical Supervision (English):</label>
                <input
                  type="text"
                  value={formData.supervisionEn}
                  onChange={e => setFormData({ ...formData, supervisionEn: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-rose-500 text-left font-sans"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">شعار الجودة والاعتماد الدولي:</label>
                <input
                  type="text"
                  value={formData.accreditation}
                  onChange={e => setFormData({ ...formData, accreditation: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:border-rose-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">الشعار اللفظي (Slogan):</label>
                <input
                  type="text"
                  value={formData.sloganAr}
                  onChange={e => setFormData({ ...formData, sloganAr: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-rose-500"
                />
              </div>
            </div>
          </div>

          {/* 2. Address & Contact Numbers */}
          <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <Phone className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-bold text-white">العنوان الرئيسي وأرقام الاتصال والتواصل</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="md:col-span-3">
                <label className="block text-slate-300 font-semibold mb-1">العنوان الرئيسي المعتمد على جميع المطبوعات:</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-rose-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.mainAddress}
                    onChange={e => setFormData({ ...formData, mainAddress: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pr-9 pl-3 py-2.5 text-white font-medium focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">الخط الساخن / الهاتف الرئيسي:</label>
                <input
                  type="text"
                  value={formData.hotline}
                  onChange={e => setFormData({ ...formData, hotline: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:border-rose-500 text-center"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">هاتف الفرع الأرضي / الموبايل:</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:border-rose-500 text-center"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">رقم الواتساب لإرسال التقارير والحجوزات:</label>
                <input
                  type="text"
                  value={formData.whatsapp}
                  onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-emerald-400 font-mono focus:border-rose-500 text-center"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">حساب إنستاباي للدفع الإلكتروني (InstaPay):</label>
                <input
                  type="text"
                  value={formData.instapay}
                  onChange={e => setFormData({ ...formData, instapay: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-purple-300 font-mono focus:border-rose-500 text-center"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">رقم فودافون كاش (Vodafone Cash):</label>
                <input
                  type="text"
                  value={formData.vodafoneCash}
                  onChange={e => setFormData({ ...formData, vodafoneCash: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-rose-300 font-mono focus:border-rose-500 text-center"
                />
              </div>
            </div>
          </div>

          {/* 3. Official Lab Signatures in Arabic */}
          <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <UserCheck className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-bold text-white">صيغ الإمضاءات الرسمية المعتمدة بالعربية (تظهر أسفل كل تقرير وفاتورة)</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {renderStaffSignatureCard(
                '1. كيميائي المعمل',
                'border-slate-700/80',
                'labChemist',
                'chemistTitle',
                'chemistLicense',
                'chemistSignatureKey',
                'showChemist'
              )}
              {renderStaffSignatureCard(
                '2. طبيب الوحده',
                'border-blue-800/70',
                'verifiedBy',
                'verifierTitle',
                'verifierLicense',
                'verifierSignatureKey',
                'showVerifier'
              )}
              {renderStaffSignatureCard(
                '3. استشارى الباثولوجيا الإكلينيكية',
                'border-rose-900/70 bg-rose-950/20',
                'pathologist',
                'pathologistTitle',
                'pathologistLicense',
                'pathologistSignatureKey',
                'showPathologist'
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-800">
              {renderStaffSignatureCard(
                '4. القائم بالسحب',
                'border-teal-800/70',
                'phlebotomist',
                'phlebotomistTitle',
                'phlebotomistLicense',
                'phlebotomistSignatureKey',
                'showPhlebotomist'
              )}
              {renderStaffSignatureCard(
                '5. مسؤول الزيارة',
                'border-amber-800/70',
                'visitCoordinator',
                'visitCoordinatorTitle',
                'visitCoordinatorLicense',
                'visitCoordinatorSignatureKey',
                'showVisitCoordinator'
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handleResetToDefault}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>استعادة البيانات الافتراضية (بهتيم / قصر العيني)</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition"
            >
              إلغاء
            </button>
            <button
              onClick={handleSave}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg ${
                savedSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-rose-700 hover:bg-rose-600 text-white'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{savedSuccess ? 'تم الحفظ والتحديث بنجاح!' : 'حفظ وتحديث جميع الريبورتات والفواتير'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
