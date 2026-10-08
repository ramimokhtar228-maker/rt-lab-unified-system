import React, { useState } from 'react';
import { LabStaffSignatures, StaffOptionItem } from '../types/lab';
import { useApp } from '../context/AppContext';
import { UserCheck, Plus, Check, ShieldCheck, Award, X, Trash2, DollarSign, Users, Briefcase } from 'lucide-react';

interface StaffSignaturesPickerProps {
  signatures: LabStaffSignatures;
  onChange: (updated: LabStaffSignatures) => void;
}

type StaffRoleKey = 'chemist' | 'verifier' | 'consultant' | 'financial' | 'hr';

export const StaffSignaturesPicker: React.FC<StaffSignaturesPickerProps> = ({
  signatures,
  onChange
}) => {
  const { staffSignatureOptions, addStaffSignatureOption, removeStaffSignatureOption } = useApp();

  // Modal / Inline Add state
  const [addingRole, setAddingRole] = useState<StaffRoleKey | null>(null);
  const [newName, setNewName] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newLicense, setNewLicense] = useState('');

  // Delete confirm or alert state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSelectStaff = (role: StaffRoleKey, item: StaffOptionItem) => {
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
    } else if (role === 'financial') {
      onChange({
        ...signatures,
        financialDirector: item.name,
        financialTitle: item.title,
        financialLicense: item.license || signatures.financialLicense,
        showFinancialSignature: true
      });
    } else if (role === 'hr') {
      onChange({
        ...signatures,
        hrDirector: item.name,
        hrTitle: item.title,
        hrLicense: item.license || signatures.hrLicense,
        showHrSignature: true
      });
    }
  };

  const handleSaveNewMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingRole || !newName.trim()) return;

    const role = addingRole;
    const name = newName.trim();
    const defaultTitle = 
      role === 'chemist' ? 'أخصائي كيمياء إكلينيكية' :
      role === 'verifier' ? 'إدارة ضبط وتأكيد الجودة' :
      role === 'consultant' ? 'استشاري الباثولوجيا الإكلينيكية' :
      role === 'financial' ? 'المدير المالي ورئيس الحسابات (CFO)' :
      'مدير الموارد البشرية (HR Manager)';

    const title = newTitle.trim() || defaultTitle;
    const license = newLicense.trim() || undefined;

    addStaffSignatureOption(role, { name, title, license });

    // Apply directly to current report
    if (role === 'chemist') {
      onChange({ ...signatures, labChemist: name, chemistTitle: title, chemistLicense: license });
    } else if (role === 'verifier') {
      onChange({ ...signatures, verifiedBy: name, verifierTitle: title, verifierLicense: license });
    } else if (role === 'consultant') {
      onChange({ ...signatures, pathologist: name, pathologistTitle: title, pathologistLicense: license });
    } else if (role === 'financial') {
      onChange({ ...signatures, financialDirector: name, financialTitle: title, financialLicense: license, showFinancialSignature: true });
    } else if (role === 'hr') {
      onChange({ ...signatures, hrDirector: name, hrTitle: title, hrLicense: license, showHrSignature: true });
    }

    setAddingRole(null);
    setNewName('');
    setNewTitle('');
    setNewLicense('');
  };

  const handleDeleteStaffItem = (role: StaffRoleKey, item: StaffOptionItem) => {
    if (confirm(`هل أنت متأكد من حذف اسم "${item.name}" من قائمة ${
      role === 'chemist' ? 'الكيميائيين' :
      role === 'verifier' ? 'المراجعين' :
      role === 'consultant' ? 'الاستشاريين' :
      role === 'financial' ? 'المديرين الماليين' : 'مديري الـ HR'
    }؟`)) {
      removeStaffSignatureOption(role, item.id);
      
      // If currently selected, clear or reset
      if (role === 'chemist' && signatures.labChemist === item.name) {
        onChange({ ...signatures, labChemist: '' });
      } else if (role === 'verifier' && signatures.verifiedBy === item.name) {
        onChange({ ...signatures, verifiedBy: '' });
      } else if (role === 'consultant' && signatures.pathologist === item.name) {
        onChange({ ...signatures, pathologist: '' });
      } else if (role === 'financial' && signatures.financialDirector === item.name) {
        onChange({ ...signatures, financialDirector: '' });
      } else if (role === 'hr' && signatures.hrDirector === item.name) {
        onChange({ ...signatures, hrDirector: '' });
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center border border-rose-200 shadow-xs">
            <UserCheck className="w-5 h-5 text-rose-700" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <span>طاقم الفحص والاعتماد والإمضاءات الرسمية بالتقرير</span>
              <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-bold">
                إمكانية الحذف والإضافة الفورية
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              يمكنك اختيار المسؤول من القائمة، أو حذف أي اسم لا ترغب به، أو إضافة اسم جديد بالكامل، بما في ذلك المدير المالي ومدير الموارد البشرية (HR)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-900 bg-rose-50/80 px-3 py-1.5 rounded-lg border border-rose-100">
          <ShieldCheck className="w-4 h-4 text-rose-700" />
          <span>تظهر الإمضاءات المعتمدة أسفل التقرير الطبي وفواتير الحسابات</span>
        </div>
      </div>

      {/* Grid of the 5 Signatures */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* 1. الكيميائي المسؤول (Lab Chemist) */}
        <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200 space-y-3 relative group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <span>1. كيميائي المعمل (Lab Chemist)</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setAddingRole('chemist');
                setNewName('');
                setNewTitle('أخصائي كيمياء إكلينيكية وهرمونات');
                setNewLicense('');
              }}
              className="text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md border border-blue-200 flex items-center gap-1 transition cursor-pointer"
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
            <div className="flex items-center gap-1.5">
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
              {signatures.labChemist && (
                <button
                  type="button"
                  onClick={() => {
                    const found = staffSignatureOptions.chemists.find(c => c.name === signatures.labChemist);
                    if (found) handleDeleteStaffItem('chemist', found);
                  }}
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition"
                  title="حذف هذا الاسم من القائمة"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* List of saved chemists with delete buttons */}
          {staffSignatureOptions.chemists.length > 0 && (
            <div className="bg-white rounded-lg p-2 border border-slate-200/80 space-y-1">
              <div className="text-[10px] font-bold text-slate-400">الأسماء المحفوظة بالقائمة (اضغط للحذف أو الاختيار):</div>
              <div className="max-h-24 overflow-y-auto space-y-1">
                {staffSignatureOptions.chemists.map(c => (
                  <div key={c.id} className="flex items-center justify-between text-xs px-2 py-1 rounded hover:bg-slate-50 border border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleSelectStaff('chemist', c)}
                      className="text-right truncate flex-1 font-medium text-slate-700 hover:text-blue-600"
                    >
                      {c.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteStaffItem('chemist', c)}
                      className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition"
                      title="حذف هذا الاسم نهائياً"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

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
        <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200 space-y-3 relative group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
              <span>2. مدقق ومراجع الجودة (Verify by)</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setAddingRole('verifier');
                setNewName('');
                setNewTitle('إدارة ضبط وتأكيد الجودة والتشغيل');
                setNewLicense('');
              }}
              className="text-[11px] font-bold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-md border border-amber-200 flex items-center gap-1 transition cursor-pointer"
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
            <div className="flex items-center gap-1.5">
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
              {signatures.verifiedBy && (
                <button
                  type="button"
                  onClick={() => {
                    const found = staffSignatureOptions.verifiers.find(v => v.name === signatures.verifiedBy);
                    if (found) handleDeleteStaffItem('verifier', found);
                  }}
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition"
                  title="حذف هذا الاسم من القائمة"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* List of saved verifiers with delete buttons */}
          {staffSignatureOptions.verifiers.length > 0 && (
            <div className="bg-white rounded-lg p-2 border border-slate-200/80 space-y-1">
              <div className="text-[10px] font-bold text-slate-400">الأسماء المحفوظة بالقائمة (اضغط للحذف أو الاختيار):</div>
              <div className="max-h-24 overflow-y-auto space-y-1">
                {staffSignatureOptions.verifiers.map(v => (
                  <div key={v.id} className="flex items-center justify-between text-xs px-2 py-1 rounded hover:bg-slate-50 border border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleSelectStaff('verifier', v)}
                      className="text-right truncate flex-1 font-medium text-slate-700 hover:text-amber-600"
                    >
                      {v.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteStaffItem('verifier', v)}
                      className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition"
                      title="حذف هذا الاسم نهائياً"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

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

        {/* 3. الاستشاري / الاستشارات (Consultant Pathologist) */}
        <div className="bg-rose-50/40 rounded-xl p-4 border border-rose-200 space-y-3 relative group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-rose-950 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-700"></span>
              <span>3. الاستشاري (Pathologist)</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setAddingRole('consultant');
                setNewName('');
                setNewTitle('استشاري الباثولوجيا الإكلينيكية والكيميائية');
                setNewLicense('');
              }}
              className="text-[11px] font-bold text-rose-800 hover:text-rose-950 bg-rose-100 hover:bg-rose-200 px-2.5 py-1 rounded-md border border-rose-300 flex items-center gap-1 transition cursor-pointer"
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
            <div className="flex items-center gap-1.5">
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
              {signatures.pathologist && (
                <button
                  type="button"
                  onClick={() => {
                    const found = staffSignatureOptions.consultants.find(p => p.name === signatures.pathologist);
                    if (found) handleDeleteStaffItem('consultant', found);
                  }}
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition"
                  title="حذف هذا الاسم من القائمة"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* List of saved consultants with delete buttons */}
          {staffSignatureOptions.consultants.length > 0 && (
            <div className="bg-white rounded-lg p-2 border border-rose-200/80 space-y-1">
              <div className="text-[10px] font-bold text-rose-900/60">الأسماء المحفوظة بالقائمة (اضغط للحذف أو الاختيار):</div>
              <div className="max-h-24 overflow-y-auto space-y-1">
                {staffSignatureOptions.consultants.map(p => (
                  <div key={p.id} className="flex items-center justify-between text-xs px-2 py-1 rounded hover:bg-rose-50/50 border border-rose-100">
                    <button
                      type="button"
                      onClick={() => handleSelectStaff('consultant', p)}
                      className="text-right truncate flex-1 font-bold text-rose-950 hover:text-rose-700"
                    >
                      {p.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteStaffItem('consultant', p)}
                      className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition"
                      title="حذف هذا الاسم نهائياً"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

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

        {/* 4. المدير المالي (Financial Director) */}
        <div className="bg-emerald-50/40 rounded-xl p-4 border border-emerald-200 space-y-3 relative group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
              <span>4. المدير المالي (Financial Director)</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setAddingRole('financial');
                setNewName('');
                setNewTitle('المدير المالي ورئيس الحسابات (CFO)');
                setNewLicense('');
              }}
              className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-md border border-emerald-300 flex items-center gap-1 transition cursor-pointer"
              title="إضافة مدير مالي جديد للقائمة"
            >
              <Plus className="w-3 h-3" />
              <span>إضافة مدير مالي</span>
            </button>
          </div>

          {/* Toggle visibility */}
          <label className="flex items-center gap-2 text-xs font-bold text-emerald-900 bg-white p-2 rounded-lg border border-emerald-200 cursor-pointer">
            <input
              type="checkbox"
              checked={signatures.showFinancialSignature ?? true}
              onChange={(e) => onChange({ ...signatures, showFinancialSignature: e.target.checked })}
              className="accent-emerald-700 w-4 h-4 rounded"
            />
            <span>إظهار اعتماد وإمضاء المدير المالي في التقرير</span>
          </label>

          {/* Quick Select Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-emerald-900 mb-1">
              اختر المدير المالي من القائمة:
            </label>
            <div className="flex items-center gap-1.5">
              <select
                value={signatures.financialDirector || ''}
                onChange={(e) => {
                  const opt = staffSignatureOptions.financialDirectors?.find(f => f.name === e.target.value);
                  if (opt) {
                    handleSelectStaff('financial', opt);
                  } else {
                    onChange({ ...signatures, financialDirector: e.target.value });
                  }
                }}
                className="w-full text-xs font-bold p-2 rounded-lg border border-emerald-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer"
              >
                <option value="">-- اختر المدير المالي --</option>
                {staffSignatureOptions.financialDirectors?.map((f) => (
                  <option key={f.id} value={f.name}>
                    {f.name} — ({f.title})
                  </option>
                ))}
              </select>
              {signatures.financialDirector && (
                <button
                  type="button"
                  onClick={() => {
                    const found = staffSignatureOptions.financialDirectors?.find(f => f.name === signatures.financialDirector);
                    if (found) handleDeleteStaffItem('financial', found);
                  }}
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition"
                  title="حذف هذا الاسم من القائمة"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* List of saved financial directors with delete buttons */}
          {staffSignatureOptions.financialDirectors && staffSignatureOptions.financialDirectors.length > 0 && (
            <div className="bg-white rounded-lg p-2 border border-emerald-200/80 space-y-1">
              <div className="text-[10px] font-bold text-emerald-800">الأسماء المحفوظة بالقائمة (اضغط للحذف أو الاختيار):</div>
              <div className="max-h-24 overflow-y-auto space-y-1">
                {staffSignatureOptions.financialDirectors.map(f => (
                  <div key={f.id} className="flex items-center justify-between text-xs px-2 py-1 rounded hover:bg-emerald-50/50 border border-emerald-100">
                    <button
                      type="button"
                      onClick={() => handleSelectStaff('financial', f)}
                      className="text-right truncate flex-1 font-bold text-emerald-950 hover:text-emerald-700"
                    >
                      {f.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteStaffItem('financial', f)}
                      className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition"
                      title="حذف هذا الاسم نهائياً"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Editable Name & Title fields */}
          <div className="space-y-2 pt-1 border-t border-emerald-200/60">
            <div>
              <span className="block text-[10px] font-bold text-emerald-900 mb-0.5">الاسم في التقرير:</span>
              <input
                type="text"
                value={signatures.financialDirector || ''}
                onChange={(e) => onChange({ ...signatures, financialDirector: e.target.value })}
                placeholder="اسم المدير المالي"
                className="w-full text-xs font-bold p-2 rounded-lg border border-emerald-300 bg-white text-emerald-950 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-emerald-900 mb-0.5">المسمى الوظيفي:</span>
              <input
                type="text"
                value={signatures.financialTitle || ''}
                onChange={(e) => onChange({ ...signatures, financialTitle: e.target.value })}
                placeholder="المدير المالي ورئيس الحسابات (CFO)"
                className="w-full text-xs p-2 rounded-lg border border-emerald-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* 5. مدير الموارد البشرية (HR Director) */}
        <div className="bg-purple-50/40 rounded-xl p-4 border border-purple-200 space-y-3 relative group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-purple-950 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-purple-700" />
              <span>5. مدير الـ HR (Human Resources)</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setAddingRole('hr');
                setNewName('');
                setNewTitle('مدير الموارد البشرية وشؤون العاملين (HR)');
                setNewLicense('');
              }}
              className="text-[11px] font-bold text-purple-800 hover:text-purple-950 bg-purple-100 hover:bg-purple-200 px-2.5 py-1 rounded-md border border-purple-300 flex items-center gap-1 transition cursor-pointer"
              title="إضافة مدير HR جديد للقائمة"
            >
              <Plus className="w-3 h-3" />
              <span>إضافة مدير HR</span>
            </button>
          </div>

          {/* Toggle visibility */}
          <label className="flex items-center gap-2 text-xs font-bold text-purple-900 bg-white p-2 rounded-lg border border-purple-200 cursor-pointer">
            <input
              type="checkbox"
              checked={signatures.showHrSignature ?? true}
              onChange={(e) => onChange({ ...signatures, showHrSignature: e.target.checked })}
              className="accent-purple-700 w-4 h-4 rounded"
            />
            <span>إظهار اعتماد وإمضاء مدير الـ HR في التقرير</span>
          </label>

          {/* Quick Select Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-purple-900 mb-1">
              اختر مدير الـ HR من القائمة:
            </label>
            <div className="flex items-center gap-1.5">
              <select
                value={signatures.hrDirector || ''}
                onChange={(e) => {
                  const opt = staffSignatureOptions.hrDirectors?.find(h => h.name === e.target.value);
                  if (opt) {
                    handleSelectStaff('hr', opt);
                  } else {
                    onChange({ ...signatures, hrDirector: e.target.value });
                  }
                }}
                className="w-full text-xs font-bold p-2 rounded-lg border border-purple-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 cursor-pointer"
              >
                <option value="">-- اختر مدير الـ HR --</option>
                {staffSignatureOptions.hrDirectors?.map((h) => (
                  <option key={h.id} value={h.name}>
                    {h.name} — ({h.title})
                  </option>
                ))}
              </select>
              {signatures.hrDirector && (
                <button
                  type="button"
                  onClick={() => {
                    const found = staffSignatureOptions.hrDirectors?.find(h => h.name === signatures.hrDirector);
                    if (found) handleDeleteStaffItem('hr', found);
                  }}
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition"
                  title="حذف هذا الاسم من القائمة"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* List of saved HR directors with delete buttons */}
          {staffSignatureOptions.hrDirectors && staffSignatureOptions.hrDirectors.length > 0 && (
            <div className="bg-white rounded-lg p-2 border border-purple-200/80 space-y-1">
              <div className="text-[10px] font-bold text-purple-800">الأسماء المحفوظة بالقائمة (اضغط للحذف أو الاختيار):</div>
              <div className="max-h-24 overflow-y-auto space-y-1">
                {staffSignatureOptions.hrDirectors.map(h => (
                  <div key={h.id} className="flex items-center justify-between text-xs px-2 py-1 rounded hover:bg-purple-50/50 border border-purple-100">
                    <button
                      type="button"
                      onClick={() => handleSelectStaff('hr', h)}
                      className="text-right truncate flex-1 font-bold text-purple-950 hover:text-purple-700"
                    >
                      {h.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteStaffItem('hr', h)}
                      className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition"
                      title="حذف هذا الاسم نهائياً"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Editable Name & Title fields */}
          <div className="space-y-2 pt-1 border-t border-purple-200/60">
            <div>
              <span className="block text-[10px] font-bold text-purple-900 mb-0.5">الاسم في التقرير:</span>
              <input
                type="text"
                value={signatures.hrDirector || ''}
                onChange={(e) => onChange({ ...signatures, hrDirector: e.target.value })}
                placeholder="اسم مدير الـ HR"
                className="w-full text-xs font-bold p-2 rounded-lg border border-purple-300 bg-white text-purple-950 focus:outline-none focus:ring-1 focus:ring-purple-600"
              />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-purple-900 mb-0.5">المسمى الوظيفي:</span>
              <input
                type="text"
                value={signatures.hrTitle || ''}
                onChange={(e) => onChange({ ...signatures, hrTitle: e.target.value })}
                placeholder="مدير الموارد البشرية وشؤون الموظفين"
                className="w-full text-xs p-2 rounded-lg border border-purple-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-600"
              />
            </div>
          </div>
        </div>

      </div>

      {/* Modal for Adding New Staff Member */}
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
                  {addingRole === 'financial' && 'إضافة مدير مالي جديد'}
                  {addingRole === 'hr' && 'إضافة مدير موارد بشرية (HR) جديد'}
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
                  placeholder="مثال: د/ محمد عبد الرحمن أو أ/ أحمد علي"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  المسمى الوظيفي والدرجة: <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثال: أخصائي كيمياء حيوية / المدير المالي"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رقم الترخيص أو كود الاعتماد (اختياري):
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
