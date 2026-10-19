import React, { useState } from 'react';
import { Patient } from '../types/lab';
import { User, Phone, Calendar, Clock, Stethoscope, Hash, Barcode, X, Check, Save } from 'lucide-react';

interface ClientEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  onSave: (updatedPatient: Patient) => void;
  title?: string;
}

export const ClientEditModal: React.FC<ClientEditModalProps> = ({
  isOpen,
  onClose,
  patient,
  onSave,
  title = 'تعديل بيانات العميل / المريض'
}) => {
  const [formData, setFormData] = useState<Patient>({ ...patient });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-rose-950 via-slate-900 to-slate-900 border-b border-rose-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-600/20 text-rose-400 rounded-xl border border-rose-500/30">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{title}</h2>
              <p className="text-xs text-slate-400">
                تحديث بيانات العميل فورياً في الفاتورة والتقرير الطبي المعتمد
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 max-h-[75vh]">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                اسم العميل / المريض بالكامل:
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="مثال: أحمد محمود إبراهيم"
                  className="w-full text-xs font-bold bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                رقم هاتف العميل (واتساب):
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="01012345678"
                  className="w-full text-xs font-mono bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Age & Unit */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  السن:
                </label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={formData.age || ''}
                  onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) || 0 })}
                  className="w-full text-xs font-mono bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div className="w-24">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  الوحدة:
                </label>
                <select
                  value={formData.ageUnit || 'years'}
                  onChange={(e) => setFormData({ ...formData, ageUnit: e.target.value as any })}
                  className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="years">سنة</option>
                  <option value="months">شهر</option>
                  <option value="days">يوم</option>
                </select>
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                النوع:
              </label>
              <select
                value={formData.gender || 'male'}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="male">ذكر (Male)</option>
                <option value="female">أنثى (Female)</option>
              </select>
            </div>

            {/* National ID */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                الرقم القومي (اختياري):
              </label>
              <input
                type="text"
                value={formData.nationalId || ''}
                onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                placeholder="14 رقم"
                className="w-full text-xs font-mono bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Lab Number */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                رقم المعمل (Lab Number):
              </label>
              <input
                type="text"
                value={formData.labNumber || ''}
                onChange={(e) => setFormData({ ...formData, labNumber: e.target.value })}
                className="w-full text-xs font-mono font-bold bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Tube Barcode */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                باركود الأنبوبة (Barcode):
              </label>
              <input
                type="text"
                value={formData.barcode || ''}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full text-xs font-mono bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-amber-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Sample Date */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                تاريخ وتوقيت سحب العينة:
              </label>
              <input
                type="date"
                value={formData.sampleDate || ''}
                onChange={(e) => setFormData({ ...formData, sampleDate: e.target.value })}
                className="w-full text-xs font-mono bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Delivery / Reporting Date */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                موعد استلام النتيجة المعتمدة:
              </label>
              <input
                type="date"
                value={formData.reportingDate || ''}
                onChange={(e) => setFormData({ ...formData, reportingDate: e.target.value })}
                className="w-full text-xs font-mono bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Referring Doctor */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                الطبيب المعالج / جهة الإحالة:
              </label>
              <input
                type="text"
                value={formData.referringDoctorName || ''}
                onChange={(e) => setFormData({ ...formData, referringDoctorName: e.target.value })}
                placeholder="مثال: د. طارق المنشاوي أو طلب فحص ذاتي (Self-Request)"
                className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Clinical Notes / History */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                التشخيص الإكلينيكي / ملاحظات العميل:
              </label>
              <textarea
                rows={2}
                value={formData.clinicalHistory || ''}
                onChange={(e) => setFormData({ ...formData, clinicalHistory: e.target.value })}
                placeholder="ملاحظات العميل، الأعراض أو الشكوى..."
                className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black bg-rose-700 hover:bg-rose-600 text-white shadow-lg shadow-rose-950/40 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>حفظ وتحديث بيانات العميل</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
