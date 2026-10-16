import React, { useState } from 'react';
import { LabStaffSignatures, StaffOptionItem } from '../types/lab';
import { useApp } from '../context/AppContext';
import { UserCheck, Plus, Check, ShieldCheck, Award, X, Trash2, Edit2, Eye, EyeOff } from 'lucide-react';

interface StaffSignaturesPickerProps {
  signatures: LabStaffSignatures;
  onChange: (updated: LabStaffSignatures) => void;
}

export const StaffSignaturesPicker: React.FC<StaffSignaturesPickerProps> = ({
  signatures,
  onChange
}) => {
  const {
    staffSignatureOptions,
    addStaffSignatureOption,
    updateStaffSignatureOption,
    deleteStaffSignatureOption
  } = useApp();

  // Modal states for Adding / Editing staff options
  const [addingRole, setAddingRole] = useState<'chemist' | 'verifier' | 'consultant' | null>(null);
  const [editingItem, setEditingItem] = useState<{ role: 'chemist' | 'verifier' | 'consultant'; item: StaffOptionItem } | null>(null);
  
  const [formName, setFormName] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formLicense, setFormLicense] = useState('');

  // Signature visibility flags
  const hideAll = (signatures as any).hideSignatures === true;
  const showChemist = (signatures as any).showChemist !== false;
  const showVerifier = (signatures as any).showVerifier !== false;
  const showPathologist = (signatures as any).showPathologist !== false;

  const handleToggleHideAll = () => {
    onChange({
      ...signatures,
      hideSignatures: !hideAll
    } as any);
  };

  const handleToggleRole = (role: 'chemist' | 'verifier' | 'consultant') => {
    if (role === 'chemist') {
      onChange({ ...signatures, showChemist: !showChemist } as any);
    } else if (role === 'verifier') {
      onChange({ ...signatures, showVerifier: !showVerifier } as any);
    } else if (role === 'consultant') {
      onChange({ ...signatures, showPathologist: !showPathologist } as any);
    }
  };

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

  const handleOpenAdd = (role: 'chemist' | 'verifier' | 'consultant') => {
    setAddingRole(role);
    setEditingItem(null);
    setFormName('');
    setFormTitle(
      role === 'chemist' ? 'Senior Clinical Chemist' :
      role === 'verifier' ? 'Operations & Quality Manager' :
      'Consultant Clinical Pathologist - Kasr Al Ainy'
    );
    setFormLicense('');
  };

  const handleOpenEdit = (role: 'chemist' | 'verifier' | 'consultant', item: StaffOptionItem) => {
    setEditingItem({ role, item });
    setAddingRole(null);
    setFormName(item.name);
    setFormTitle(item.title);
    setFormLicense(item.license || '');
  };

  const handleDeleteStaff = (role: 'chemist' | 'verifier' | 'consultant', item: StaffOptionItem) => {
    if (confirm(`هل أنت متأكد من حذف (${item.name}) من قائمة الاعتماد؟`)) {
      deleteStaffSignatureOption(role, item.id);
    }
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingItem) {
      updateStaffSignatureOption(editingItem.role, editingItem.item.id, {
        name: formName.trim(),
        title: formTitle.trim(),
        license: formLicense.trim() || undefined
      });
      // Update in active report if currently selected
      if (editingItem.role === 'chemist' && signatures.labChemist === editingItem.item.name) {
        onChange({ ...signatures, labChemist: formName.trim(), chemistTitle: formTitle.trim(), chemistLicense: formLicense.trim() || undefined });
      } else if (editingItem.role === 'verifier' && signatures.verifiedBy === editingItem.item.name) {
        onChange({ ...signatures, verifiedBy: formName.trim(), verifierTitle: formTitle.trim(), verifierLicense: formLicense.trim() || undefined });
      } else if (editingItem.role === 'consultant' && signatures.pathologist === editingItem.item.name) {
        onChange({ ...signatures, pathologist: formName.trim(), pathologistTitle: formTitle.trim(), pathologistLicense: formLicense.trim() || undefined });
      }
      setEditingItem(null);
    } else if (addingRole) {
      addStaffSignatureOption(addingRole, {
        name: formName.trim(),
        title: formTitle.trim(),
        license: formLicense.trim() || undefined
      });
      // Apply immediately
      if (addingRole === 'chemist') {
        onChange({ ...signatures, labChemist: formName.trim(), chemistTitle: formTitle.trim(), chemistLicense: formLicense.trim() || undefined });
      } else if (addingRole === 'verifier') {
        onChange({ ...signatures, verifiedBy: formName.trim(), verifierTitle: formTitle.trim(), verifierLicense: formLicense.trim() || undefined });
      } else if (addingRole === 'consultant') {
        onChange({ ...signatures, pathologist: formName.trim(), pathologistTitle: formTitle.trim(), pathologistLicense: formLicense.trim() || undefined });
      }
      setAddingRole(null);
    }

    setFormName('');
    setFormTitle('');
    setFormLicense('');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
      {/* Header & Master Visibility Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center border border-rose-200">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">
              طاقم الاعتماد والإمضاءات بالتقرير (اختياري وقابل للتعديل)
            </h3>
            <p className="text-[11px] text-slate-500">
              يمكنك اختيار الموقعين، تعديل بياناتهم، إضافة موقعين جدد، أو حذفهم، مع خيار إظهار أو إخفاء الإمضاءات
            </p>
          </div>
        </div>

        {/* Master Visibility Button */}
        <button
          type="button"
          onClick={handleToggleHideAll}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
            hideAll
              ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
              : 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
          }`}
        >
          {hideAll ? (
            <>
              <EyeOff className="w-3.5 h-3.5 text-amber-700" />
              <span>الإمضاءات مخفية حالياً بالتقرير (اضغط للإظهار)</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5 text-emerald-700" />
              <span>الإمضاءات مفعّلة وظاهرة بالتقرير (اضغط للإخفاء)</span>
            </>
          )}
        </button>
      </div>

      {/* Grid of the 3 Signatures */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* 1. Lab Chemist */}
        <div className={`rounded-xl p-3.5 border transition space-y-3 ${
          !showChemist || hideAll ? 'bg-slate-100/60 opacity-60 border-slate-200' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-black text-slate-800">
              <input
                type="checkbox"
                checked={showChemist && !hideAll}
                onChange={() => handleToggleRole('chemist')}
                disabled={hideAll}
                className="w-4 h-4 rounded text-rose-700 focus:ring-rose-500"
              />
              <span>1. كيميائي المعمل (Chemist)</span>
            </label>
            <button
              type="button"
              onClick={() => handleOpenAdd('chemist')}
              className="text-[11px] font-bold text-rose-800 hover:text-rose-950 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-md border border-rose-200 flex items-center gap-1 transition"
              title="إضافة كيميائي جديد للقائمة"
            >
              <Plus className="w-3 h-3" />
              <span>إضافة كيميائي</span>
            </button>
          </div>

          {/* Signatory Select */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              اختر الكيميائي من القائمة:
            </label>
            <div className="flex items-center gap-1.5">
              <select
                value={signatures.labChemist}
                onChange={(e) => {
                  const opt = staffSignatureOptions.chemists.find(c => c.name === e.target.value);
                  if (opt) handleSelectStaff('chemist', opt);
                  else onChange({ ...signatures, labChemist: e.target.value });
                }}
                disabled={hideAll || !showChemist}
                className="flex-1 text-xs font-medium p-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer disabled:bg-slate-100"
              >
                <option value="">-- اختر الكيميائي المسؤول --</option>
                {staffSignatureOptions.chemists.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name} — ({c.title})
                  </option>
                ))}
              </select>

              {/* Edit / Delete selected item */}
              {(() => {
                const currentOpt = staffSignatureOptions.chemists.find(c => c.name === signatures.labChemist);
                if (!currentOpt) return null;
                return (
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit('chemist', currentOpt)}
                      className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                      title="تعديل هذا الكيميائي"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteStaff('chemist', currentOpt)}
                      className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded"
                      title="حذف من القائمة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Editable Fields */}
          <div className="space-y-2 pt-1 border-t border-slate-200/60">
            <div>
              <span className="block text-[10px] font-bold text-slate-500 mb-0.5">الاسم في التقرير:</span>
              <input
                type="text"
                value={signatures.labChemist}
                disabled={hideAll || !showChemist}
                onChange={(e) => onChange({ ...signatures, labChemist: e.target.value })}
                placeholder="اسم الكيميائي"
                className="w-full text-xs font-bold p-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500 disabled:bg-slate-100"
              />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-500 mb-0.5">المسمى الوظيفي:</span>
              <input
                type="text"
                value={signatures.chemistTitle || ''}
                disabled={hideAll || !showChemist}
                onChange={(e) => onChange({ ...signatures, chemistTitle: e.target.value })}
                placeholder="Senior Clinical Chemist"
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-rose-500 disabled:bg-slate-100"
              />
            </div>
          </div>
        </div>

        {/* 2. Quality Verifier */}
        <div className={`rounded-xl p-3.5 border transition space-y-3 ${
          !showVerifier || hideAll ? 'bg-slate-100/60 opacity-60 border-slate-200' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-black text-slate-800">
              <input
                type="checkbox"
                checked={showVerifier && !hideAll}
                onChange={() => handleToggleRole('verifier')}
                disabled={hideAll}
                className="w-4 h-4 rounded text-rose-700 focus:ring-rose-500"
              />
              <span>2. مدقق ومراجع الجودة (Verifier)</span>
            </label>
            <button
              type="button"
              onClick={() => handleOpenAdd('verifier')}
              className="text-[11px] font-bold text-rose-800 hover:text-rose-950 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-md border border-rose-200 flex items-center gap-1 transition"
              title="إضافة مدقق جودة جديد للقائمة"
            >
              <Plus className="w-3 h-3" />
              <span>إضافة مدقق</span>
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              اختر المدقق من القائمة:
            </label>
            <div className="flex items-center gap-1.5">
              <select
                value={signatures.verifiedBy}
                onChange={(e) => {
                  const opt = staffSignatureOptions.verifiers.find(v => v.name === e.target.value);
                  if (opt) handleSelectStaff('verifier', opt);
                  else onChange({ ...signatures, verifiedBy: e.target.value });
                }}
                disabled={hideAll || !showVerifier}
                className="flex-1 text-xs font-medium p-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer disabled:bg-slate-100"
              >
                <option value="">-- اختر مسؤول المراجعة والتدقيق --</option>
                {staffSignatureOptions.verifiers.map((v) => (
                  <option key={v.id} value={v.name}>
                    {v.name} — ({v.title})
                  </option>
                ))}
              </select>

              {(() => {
                const currentOpt = staffSignatureOptions.verifiers.find(v => v.name === signatures.verifiedBy);
                if (!currentOpt) return null;
                return (
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit('verifier', currentOpt)}
                      className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                      title="تعديل هذا المدقق"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteStaff('verifier', currentOpt)}
                      className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded"
                      title="حذف من القائمة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="space-y-2 pt-1 border-t border-slate-200/60">
            <div>
              <span className="block text-[10px] font-bold text-slate-500 mb-0.5">الاسم في التقرير:</span>
              <input
                type="text"
                value={signatures.verifiedBy}
                disabled={hideAll || !showVerifier}
                onChange={(e) => onChange({ ...signatures, verifiedBy: e.target.value })}
                placeholder="اسم مراجع الجودة"
                className="w-full text-xs font-bold p-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500 disabled:bg-slate-100"
              />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-500 mb-0.5">المسمى الوظيفي:</span>
              <input
                type="text"
                value={signatures.verifierTitle || ''}
                disabled={hideAll || !showVerifier}
                onChange={(e) => onChange({ ...signatures, verifierTitle: e.target.value })}
                placeholder="Operations & Quality Manager"
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-rose-500 disabled:bg-slate-100"
              />
            </div>
          </div>
        </div>

        {/* 3. Consultant Clinical Pathologist */}
        <div className={`rounded-xl p-3.5 border transition space-y-3 ${
          !showPathologist || hideAll ? 'bg-slate-100/60 opacity-60 border-slate-200' : 'bg-rose-50/50 border-rose-200'
        }`}>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-black text-rose-950">
              <input
                type="checkbox"
                checked={showPathologist && !hideAll}
                onChange={() => handleToggleRole('consultant')}
                disabled={hideAll}
                className="w-4 h-4 rounded text-rose-700 focus:ring-rose-500"
              />
              <span>3. استشاري الباثولوجيا الإكلينيكية</span>
            </label>
            <button
              type="button"
              onClick={() => handleOpenAdd('consultant')}
              className="text-[11px] font-bold text-rose-900 hover:text-rose-950 bg-rose-100/80 hover:bg-rose-200 px-2 py-0.5 rounded-md border border-rose-300 flex items-center gap-1 transition"
              title="إضافة استشاري جديد للقائمة"
            >
              <Plus className="w-3 h-3" />
              <span>إضافة استشاري</span>
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-rose-900 mb-1">
              اختر الاستشاري من القائمة:
            </label>
            <div className="flex items-center gap-1.5">
              <select
                value={signatures.pathologist}
                onChange={(e) => {
                  const opt = staffSignatureOptions.consultants.find(p => p.name === e.target.value);
                  if (opt) handleSelectStaff('consultant', opt);
                  else onChange({ ...signatures, pathologist: e.target.value });
                }}
                disabled={hideAll || !showPathologist}
                className="flex-1 text-xs font-bold p-2 rounded-lg border border-rose-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-600 cursor-pointer disabled:bg-slate-100"
              >
                <option value="">-- اختر الاستشاري المعتمد --</option>
                {staffSignatureOptions.consultants.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name} — ({p.title})
                  </option>
                ))}
              </select>

              {(() => {
                const currentOpt = staffSignatureOptions.consultants.find(p => p.name === signatures.pathologist);
                if (!currentOpt) return null;
                return (
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit('consultant', currentOpt)}
                      className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                      title="تعديل هذا الاستشاري"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteStaff('consultant', currentOpt)}
                      className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded"
                      title="حذف من القائمة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="space-y-2 pt-1 border-t border-rose-200/60">
            <div>
              <span className="block text-[10px] font-bold text-rose-900 mb-0.5">الاسم في التقرير:</span>
              <input
                type="text"
                value={signatures.pathologist}
                disabled={hideAll || !showPathologist}
                onChange={(e) => onChange({ ...signatures, pathologist: e.target.value })}
                placeholder="Prof. Dr. Rami Mokhtar"
                className="w-full text-xs font-bold p-2 rounded-lg border border-rose-300 bg-white text-rose-950 focus:outline-none focus:ring-1 focus:ring-rose-600 disabled:bg-slate-100"
              />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-rose-900 mb-0.5">المسمى الوظيفي:</span>
              <input
                type="text"
                value={signatures.pathologistTitle || ''}
                disabled={hideAll || !showPathologist}
                onChange={(e) => onChange({ ...signatures, pathologistTitle: e.target.value })}
                placeholder="Consultant Clinical Pathologist - Kasr Al Ainy"
                className="w-full text-xs p-2 rounded-lg border border-rose-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-rose-600 disabled:bg-slate-100"
              />
            </div>
          </div>
        </div>

      </div>

      {/* Modal for Adding or Editing Signatory */}
      {(addingRole || editingItem) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-300 shadow-2xl max-w-md w-full p-5 space-y-4 text-right animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-rose-700" />
                <h4 className="font-extrabold text-sm text-slate-900">
                  {editingItem ? 'تعديل بيانات عضو الاعتماد' : 'إضافة عضو جديد لطاقم الاعتماد'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAddingRole(null);
                  setEditingItem(null);
                }}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الاسم بالكامل (أو الإنجليزي كما يظهر بالتقرير): <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثال: Prof. Dr. Rami Mokhtar"
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
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="مثال: Consultant Clinical Pathologist - Kasr Al Ainy"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رقم ترخيص مزاولة المهنة (اختياري):
                </label>
                <input
                  type="text"
                  value={formLicense}
                  onChange={(e) => setFormLicense(e.target.value)}
                  placeholder="مثال: EGY-MED-48201"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setAddingRole(null);
                    setEditingItem(null);
                  }}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-rose-900 hover:bg-rose-800 rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingItem ? 'حفظ التعديلات' : 'إضافة للقائمة والتقرير'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
