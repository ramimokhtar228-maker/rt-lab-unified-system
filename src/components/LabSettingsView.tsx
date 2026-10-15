import React, { useState } from 'react';
import { Sliders, Save, CheckCircle2, Building, ShieldCheck, Printer, Stamp } from 'lucide-react';
import { LabSettings } from '../types/laboratory';

interface LabSettingsViewProps {
  settings: LabSettings;
  onUpdateSettings: (newSettings: LabSettings) => void;
}

export const LabSettingsView: React.FC<LabSettingsViewProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [form, setForm] = useState<LabSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(form);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-teal-600" />
            <span>إعدادات المعمل وترويسة التقارير الطبية (Lab Configuration)</span>
          </h1>
          <p className="text-xs text-slate-500">
            تخصيص هوية المعمل، أرقام التراخيص، الاعتماد الدولي، وخيارات طباعة التقارير
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-xl border border-emerald-200">
            <CheckCircle2 className="w-4 h-4" />
            <span>تم حفظ التعديلات بنجاح</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Lab Branding & Legal Details */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
            <Building className="w-4 h-4 text-teal-600" />
            <span>هوية المعمل والترخيص الطبي (Official Identity)</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                اسم المعمل (عربي):
              </label>
              <input
                type="text"
                required
                value={form.labNameAr}
                onChange={(e) => setForm({ ...form, labNameAr: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                Laboratory Name (EN):
              </label>
              <input
                type="text"
                required
                value={form.labNameEn}
                onChange={(e) => setForm({ ...form, labNameEn: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-medium text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                ترخيص وزارة الصحة:
              </label>
              <input
                type="text"
                value={form.licenseNumber}
                onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                شهادة الاعتماد الدولية:
              </label>
              <input
                type="text"
                value={form.accreditation}
                onChange={(e) => setForm({ ...form, accreditation: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-teal-700 dark:text-teal-400"
              />
            </div>

            <div>
              <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                اسم المدير الفني / الاستشاري:
              </label>
              <input
                type="text"
                value={form.directorName}
                onChange={(e) => setForm({ ...form, directorName: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-bold"
              />
            </div>

            <div>
              <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                اللقب العلمي والدرجة:
              </label>
              <input
                type="text"
                value={form.directorTitle}
                onChange={(e) => setForm({ ...form, directorTitle: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2"
              />
            </div>

            <div>
              <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                الخط الساخن والهاتف:
              </label>
              <input
                type="text"
                value={form.hotline}
                onChange={(e) => setForm({ ...form, hotline: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                عنوان المقر الرئيسي:
              </label>
              <input
                type="text"
                value={form.addressAr}
                onChange={(e) => setForm({ ...form, addressAr: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2"
              />
            </div>
          </div>
        </div>

        {/* Report Printing & Display Policies */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
            <Printer className="w-4 h-4 text-teal-600" />
            <span>خيارات تنسيق وإخراج التقرير الطبي الافتراضية (Print Layout Defaults)</span>
          </h2>

          <div className="space-y-3 text-xs">
            <label className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
              <input
                type="checkbox"
                checked={form.enableHeaderInPrint}
                onChange={(e) => setForm({ ...form, enableHeaderInPrint: e.target.checked })}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
              />
              <div>
                <strong className="block text-slate-900 dark:text-white">
                  طباعة ترويسة وشعار المعمل تلقائياً
                </strong>
                <span className="text-slate-500">
                  قم بإلغاء التحديد إذا كنت تستخدم ورق مراسلات رسمي مسبق الطباعة في المعمل
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
              <input
                type="checkbox"
                checked={form.enableDeltaInPrint}
                onChange={(e) => setForm({ ...form, enableDeltaInPrint: e.target.checked })}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
              />
              <div>
                <strong className="block text-slate-900 dark:text-white">
                  إدراج عمود مقارنة النتائج السابقة والتغير الزمني (Delta Check Column)
                </strong>
                <span className="text-slate-500">
                  يعرض قيمة الفحص في الزيارة السابقة ونسبة الارتفاع/الانخفاض في التقرير المطبوع
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
              <input
                type="checkbox"
                checked={form.enableGaugeInPrint}
                onChange={(e) => setForm({ ...form, enableGaugeInPrint: e.target.checked })}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
              />
              <div>
                <strong className="block text-slate-900 dark:text-white">
                  تضمين مؤشر النطاق الطبيعي البياني الملون (Visual Gauge Bar)
                </strong>
                <span className="text-slate-500">
                  شريط أفقي مصغر يوضح موقع نتيجة المريض بالنسبة للحد الأدنى والأعلى الطبيعي
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>حفظ وتطبيق الإعدادات</span>
          </button>
        </div>
      </form>
    </div>
  );
};
