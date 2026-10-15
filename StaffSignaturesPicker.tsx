import React, { useState } from 'react';
import { LabStaffSignatures, StaffOptionItem } from '../types/lab';
import { useApp } from '../context/AppContext';
import { UserCheck, Plus, Check, ShieldCheck, Award, X, Sparkles } from 'lucide-react';

interface StaffSignaturesPickerProps {
  signatures: LabStaffSignatures;
  onChange: (updated: LabStaffSignatures) => void;
}

export const StaffSignaturesPicker: React.FC<StaffSignaturesPickerProps> = ({
  signatures,
  onChange
}) => {
  const { staffSignatureOptions, addStaffSignatureOption } = useApp();

  // Modal / Inline Add state
  const [addingRole, setAddingRole] = useState<'chemist' | 'verifier' | 'consultant' | null>(null);
  const [newName, setNewName] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newLicense, setNewLicense] = useState('');

  const handleSelectStaff = (role: 'chemist' | 'verifier' | 'consultant', item: StaffOptionItem) => {
    if (role === 'chemist') {
      onChange({
        ...signatures,
        labChemist: item.name,
        chemistTitle: item.title,
        chemistLicense: item.license || signatures.chemistLicense
      });
    } else if (role === 'verifier') {
      onChange({
        ...signatures,
        verifiedBy: item.name,
        verifierTitle: item.title,
        verifierLicense: item.license || signatures.verifierLicense
      });
    } else if (role === 'consultant') {
      onChange({
        ...signatures,
        pathologist: item.name,
        pathologistTitle: item.title,
        pathologistLicense: item.license || signatures.pathologistLicense
      });
    }
  };

  const handleSaveNewMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingRole || !newName.trim()) return;

    const role = addingRole;
    const name = newName.trim();
    const title = newTitle.trim() || (
      role === 'chemist' ? 'أخصائي كيمياء إكلينيكية' :
      role === 'verifier' ? 'إدارة ضبط وتأكيد الجودة' :
      'استشاري الباثولوجيا الإكلينيكية'
    );
    const license = newLicense.trim() || undefined;

    addStaffSignatureOption(role, { name, title, license });

    // Apply directly to current report
    if (role === 'chemist') {
      onChange({ ...signatures, labChemist: name, chemistTitle: title, chemistLicense: license });
    } else if (role === 'verifier') {
      onChange({ ...signatures, verifiedBy: name, verifierTitle: title, verifierLicense: license });
    } else if (role === 'consultant') {
      onChange({ ...signatures, pathologist: name, pathologistTitle: title, pathologistLicense: license });
    }

    setAddingRole(null);
    setNewName('');
    setNewTitle('');
    setNewLicense('');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center border border-rose-200">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">
              طاقم الفحص والاعتماد (الإمضاءات الثلاثة بالتقرير الطبي)
            </h3>
            <p className="text-[11px] text-slate-500">
              اختر المسؤول عن كل إمضاء من القائمة أو أضف عضواً جديداً باسمه ومسماه الوظيفي ليتم اعتماده فورياً
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-900 bg-rose-50/80 px-2.5 py-1 rounded-lg border border-rose-100">
          <ShieldCheck className="w-3.5 h-3.5 text-rose-700" />
          <span>تظهر الإمضاءات الثلاثة أسفل كل صفحة بالتقرير والـ PDF</span>
        </div>
      </div>

      {/* Grid of the 3 Signatures */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* 1. الكيميائي المسؤول (Lab Chemist) */}
        <div className="bg-slate-50/70 rounded-xl p-3.5 border border-slate-200/80 space-y-3 relative group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span>1. كيميائي المعمل (Lab Chemist)</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setAddingRole('chemist');
                setNewName('');
                setNewTitle('');
                setNewLicense('');
              }}
              className="text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-md border border-blue-200 flex items-center gap-1 transition"
              title="إضافة كيميائي جديد للقائمة"
            >
              <Plus className="w-3 h-3" />
              <span>إضافة كيميائي</span>
            </button>
          </div>

          {/* Quick Select Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              اختر الكيميائي من القائمة:
            </label>
            <select
              value={signatures.labChemist}
              onChange={(e) => {
                const opt = staffSignatureOptions.chemists.find(c => c.name === e.target.value);
                if (opt) {
                  handleSelectStaff('chemist', opt);
                } else {
                  onChange({ ...signatures, labChemist: e.target.value });
                }
              }}
              className="w-full text-xs font-medium p-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              <option value="">-- اختر الكيميائي المسؤول --</option>
              {staffSignatureOptions.chemists.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name} — ({c.title})
                </option>
              ))}
            </select>
          </div>

          {/* Editable Name & Title fields */}
          <div className="space-y-2 pt-1 border-t border-slate-200/60">
            <div>
              <span className="block text-[10px] font-bold text-slate-500 mb-0.5">الاسم في التقرير:</span>
              <input
                type="text"
                value={signatures.labChemist}
                onChange={(e) => onChange({ ...signatures, labChemist: e.target.value })}
                placeholder="اسم الكيميائي"
                className="w-full text-xs font-bold p-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-500 mb-0.5">المسمى الوظيفي:</span>
              <input
                type="text"
                value={signatures.chemistTitle || ''}
                onChange={(e) => onChange({ ...signatures, chemistTitle: e.target.value })}
                placeholder="أخصائي كيمياء إكلينيكية وهرمونات"
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 2. المدقق ومراجع الجودة (Verifier / Quality Audit) */}
        <div className="bg-slate-50/70 rounded-xl p-3.5 border border-slate-200/80 space-y-3 relative group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-600"></span>
              <span>2. مدقق ومراجع الجودة (Verify by)</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setAddingRole('verifier');
                setNewName('');
                setNewTitle('');
                setNewLicense('');
              }}
              className="text-[11px] font-bold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1 transition"
              title="إضافة مدقق جودة جديد للقائمة"
            >
              <Plus className="w-3 h-3" />
              <span>إضافة مدقق</span>
            </button>
          </div>

          {/* Quick Select Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              اختر المدقق من القائمة:
            </label>
            <select
              value={signatures.verifiedBy}
              onChange={(e) => {
                const opt = staffSignatureOptions.verifiers.find(v => v.name === e.target.value);
                if (opt) {
                  handleSelectStaff('verifier', opt);
                } else {
                  onChange({ ...signatures, verifiedBy: e.target.value });
                }
              }}
              className="w-full text-xs font-medium p-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
            >
              <option value="">-- اختر مسؤول المراجعة والتدقيق --</option>
              {staffSignatureOptions.verifiers.map((v) => (
                <option key={v.id} value={v.name}>
                  {v.name} — ({v.title})
                </option>
              ))}
            </select>
          </div>

          {/* Editable Name & Title fields */}
          <div className="space-y-2 pt-1 border-t border-slate-200/60">
            <div>
              <span className="block text-[10px] font-bold text-slate-500 mb-0.5">الاسم في التقرير:</span>
              <input
                type="text"
                value={signatures.verifiedBy}
                onChange={(e) => onChange({ ...signatures, verifiedBy: e.target.value })}
                placeholder="اسم مراجع الجودة"
                className="w-full text-xs font-bold p-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-500 mb-0.5">المسمى الوظيفي:</span>
              <input
                type="text"
                value={signatures.verifierTitle || ''}
                onChange={(e) => onChange({ ...signatures, verifierTitle: e.target.value })}
                placeholder="إدارة ضبط الجودة والتشغيل الإكلينيكي"
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* 3. الاستشاري / الاستشارات (Consultant Pathologist / Lab Director) */}
        <div className="bg-rose-50/40 rounded-xl p-3.5 border border-rose-200/80 space-y-3 relative group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-rose-950 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-700"></span>
              <span>3. الاستشارات (Consultant Pathologist)</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setAddingRole('consultant');
                setNewName('');
                setNewTitle('');
                setNewLicense('');
              }}
              className="text-[11px] font-bold text-rose-800 hover:text-rose-950 bg-rose-100 hover:bg-rose-200 px-2 py-0.5 rounded-md border border-rose-300 flex items-center gap-1 transition"
              title="إضافة استشاري جديد للقائمة"
            >
              <Plus className="w-3 h-3" />
              <span>إضافة استشاري</span>
            </button>
          </div>

          {/* Quick Select Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-rose-900 mb-1">
              اختر الاستشاري من القائمة:
            </label>
            <select
              value={signatures.pathologist}
              onChange={(e) => {
                const opt = staffSignatureOptions.consultants.find(p => p.name === e.target.value);
                if (opt) {
                  handleSelectStaff('consultant', opt);
                } else {
                  onChange({ ...signatures, pathologist: e.target.value });
                }
              }}
              className="w-full text-xs font-bold p-2 rounded-lg border border-rose-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 cursor-pointer"
            >
              <option value="">-- اختر الاستشاري المعتمد --</option>
              {staffSignatureOptions.consultants.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name} — ({p.title})
                </option>
              ))}
            </select>
          </div>

          {/* Editable Name & Title fields */}
          <div className="space-y-2 pt-1 border-t border-rose-200/60">
            <div>
              <span className="block text-[10px] font-bold text-rose-900 mb-0.5">الاسم في التقرير:</span>
              <input
                type="text"
                value={signatures.pathologist}
                onChange={(e) => onChange({ ...signatures, pathologist: e.target.value })}
                placeholder="أ.د. رامي مختار"
                className="w-full text-xs font-bold p-2 rounded-lg border border-rose-300 bg-white text-rose-950 focus:outline-none focus:ring-1 focus:ring-rose-600"
              />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-rose-900 mb-0.5">المسمى الوظيفي:</span>
              <input
                type="text"
                value={signatures.pathologistTitle || ''}
                onChange={(e) => onChange({ ...signatures, pathologistTitle: e.target.value })}
                placeholder="استشاري الباثولوجيا الإكلينيكية والكيميائية - قصر العيني"
                className="w-full text-xs p-2 rounded-lg border border-rose-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-rose-600"
              />
            </div>
          </div>
        </div>

      </div>

      {/* Inline Modal for Adding New Staff Member */}
      {addingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-300 shadow-2xl max-w-md w-full p-5 space-y-4 text-right animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-rose-700" />
                <h4 className="font-extrabold text-sm text-slate-900">
                  {addingRole === 'chemist' && 'إضافة كيميائي جديد لطاقم العمل'}
                  {addingRole === 'verifier' && 'إضافة مدقق ومراجع جودة جديد'}
                  {addingRole === 'consultant' && 'إضافة استشاري باثولوجيا جديد'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setAddingRole(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewMember} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الاسم بالكامل: <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="مثال: د/ محمد عبد الرحمن"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  المسمى الوظيفي والدرجة العلمية: <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثال: أخصائي كيمياء حيوية وهرمونات"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رقم ترخيص مزاولة المهنة (اختياري):
                </label>
                <input
                  type="text"
                  value={newLicense}
                  onChange={(e) => setNewLicense(e.target.value)}
                  placeholder="مثال: EGY-SCI-99321"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddingRole(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-rose-900 hover:bg-rose-800 rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>حفظ وإدراج بالتقرير</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
