import React, { useState } from 'react';
import { STAFF_OPTIONS, DEFAULT_STAFF } from '../data/labCatalog';
import { LabStaffSignatures } from '../types/lab';
import { UserCheck, Plus, Trash2, CheckCircle2, ShieldCheck, DollarSign, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface StaffSettingsModalProps {
  currentStaff: LabStaffSignatures;
  onUpdateDefaultStaff: (staff: LabStaffSignatures) => void;
}

export const StaffSettingsModal: React.FC<StaffSettingsModalProps> = ({
  currentStaff,
  onUpdateDefaultStaff
}) => {
  const { staffSignatureOptions, addStaffSignatureOption, removeStaffSignatureOption } = useApp();

  const [activeChemist, setActiveChemist] = useState<string>(currentStaff.labChemist || '');
  const [activeVerifier, setActiveVerifier] = useState<string>(currentStaff.verifiedBy || '');
  const [activePathologist, setActivePathologist] = useState<string>(currentStaff.pathologist || '');
  const [activeFinancial, setActiveFinancial] = useState<string>(currentStaff.financialDirector || '');
  const [activeHr, setActiveHr] = useState<string>(currentStaff.hrDirector || '');

  const [newChemist, setNewChemist] = useState('');
  const [newVerifier, setNewVerifier] = useState('');
  const [newPathologist, setNewPathologist] = useState('');
  const [newFinancial, setNewFinancial] = useState('');
  const [newHr, setNewHr] = useState('');

  const [savedNotification, setSavedNotification] = useState(false);

  const handleAddMember = (role: 'chemist' | 'verifier' | 'consultant' | 'financial' | 'hr', name: string, title: string) => {
    if (!name.trim()) return;
    addStaffSignatureOption(role, { name: name.trim(), title });
    if (role === 'chemist') { setActiveChemist(name.trim()); setNewChemist(''); }
    if (role === 'verifier') { setActiveVerifier(name.trim()); setNewVerifier(''); }
    if (role === 'consultant') { setActivePathologist(name.trim()); setNewPathologist(''); }
    if (role === 'financial') { setActiveFinancial(name.trim()); setNewFinancial(''); }
    if (role === 'hr') { setActiveHr(name.trim()); setNewHr(''); }
  };

  const handleDeleteMember = (role: 'chemist' | 'verifier' | 'consultant' | 'financial' | 'hr', id: string, name: string) => {
    if (confirm(`هل أنت متأكد من حذف اسم "${name}" نهائياً من القائمة؟`)) {
      removeStaffSignatureOption(role, id);
      if (role === 'chemist' && activeChemist === name) setActiveChemist('');
      if (role === 'verifier' && activeVerifier === name) setActiveVerifier('');
      if (role === 'consultant' && activePathologist === name) setActivePathologist('');
      if (role === 'financial' && activeFinancial === name) setActiveFinancial('');
      if (role === 'hr' && activeHr === name) setActiveHr('');
    }
  };

  const handleSaveDefaults = () => {
    onUpdateDefaultStaff({
      ...currentStaff,
      labChemist: activeChemist,
      verifiedBy: activeVerifier,
      pathologist: activePathologist,
      financialDirector: activeFinancial,
      hrDirector: activeHr,
      showFinancialSignature: true,
      showHrSignature: true
    });
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 3000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-900 to-rose-700 text-white flex items-center justify-center shadow-md">
            <UserCheck className="w-5 h-5 text-rose-300" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              إدارة قوائم الإمضاءات والاعتماد المعملي
            </h2>
            <p className="text-xs text-slate-500">
              إمكانية حذف أي اسم وإضافة اسم آخر، مع اعتماد توقيعات المدير المالي ومدير الموارد البشرية (HR)
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveDefaults}
          className="flex items-center gap-2 px-5 py-2.5 bg-rose-900 hover:bg-rose-800 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>حفظ التوقيعات الافتراضية للتقارير</span>
        </button>
      </div>

      {savedNotification && (
        <div className="p-3 bg-emerald-50 text-emerald-900 rounded-lg text-xs font-bold border border-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>تم حفظ الإمضاءات الافتراضية بنجاح واعتمادها لكافة التقارير الجديدة!</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 1. Lab CHEMIST */}
        <div className="space-y-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="border-b border-slate-200 pb-2">
            <h3 className="text-sm font-bold text-slate-900">1. كيميائي المعمل (Lab Chemist)</h3>
            <p className="text-[11px] text-slate-500">أخصائي التحاليل والفحص</p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">الاسم الافتراضي حالياً:</label>
            <select
              value={activeChemist}
              onChange={(e) => setActiveChemist(e.target.value)}
              className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900"
            >
              <option value="">-- اختر كيميائي --</option>
              {staffSignatureOptions.chemists.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* List with Delete */}
          <div className="space-y-1 bg-white p-2 rounded-lg border border-slate-200 max-h-28 overflow-y-auto">
            <span className="text-[10px] font-bold text-slate-400 block mb-1">الأسماء المحفوظة (حذف أي اسم):</span>
            {staffSignatureOptions.chemists.map(c => (
              <div key={c.id} className="flex items-center justify-between text-xs py-1 px-1.5 rounded hover:bg-slate-50">
                <span className="truncate text-slate-700">{c.name}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteMember('chemist', c.id, c.name)}
                  className="text-rose-500 hover:text-rose-700 p-0.5"
                  title="حذف الاسم"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-200">
            <span className="text-[11px] font-bold text-slate-700">إضافة اسم جديد للقائمة:</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={newChemist}
                onChange={(e) => setNewChemist(e.target.value)}
                placeholder="كيميائي / ..."
                className="flex-1 text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5"
              />
              <button
                type="button"
                onClick={() => handleAddMember('chemist', newChemist, 'أخصائي كيمياء إكلينيكية')}
                className="px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-900"
              >
                إضافة
              </button>
            </div>
          </div>
        </div>

        {/* 2. Verify by */}
        <div className="space-y-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="border-b border-slate-200 pb-2">
            <h3 className="text-sm font-bold text-slate-900">2. مراجع الجودة (Verify by)</h3>
            <p className="text-[11px] text-slate-500">التدقيق والمراجعة الإكلينيكية</p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">الاسم الافتراضي حالياً:</label>
            <select
              value={activeVerifier}
              onChange={(e) => setActiveVerifier(e.target.value)}
              className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900"
            >
              <option value="">-- اختر مراجع الجودة --</option>
              {staffSignatureOptions.verifiers.map((v) => (
                <option key={v.id} value={v.name}>{v.name}</option>
              ))}
            </select>
          </div>

          {/* List with Delete */}
          <div className="space-y-1 bg-white p-2 rounded-lg border border-slate-200 max-h-28 overflow-y-auto">
            <span className="text-[10px] font-bold text-slate-400 block mb-1">الأسماء المحفوظة (حذف أي اسم):</span>
            {staffSignatureOptions.verifiers.map(v => (
              <div key={v.id} className="flex items-center justify-between text-xs py-1 px-1.5 rounded hover:bg-slate-50">
                <span className="truncate text-slate-700">{v.name}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteMember('verifier', v.id, v.name)}
                  className="text-rose-500 hover:text-rose-700 p-0.5"
                  title="حذف الاسم"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-200">
            <span className="text-[11px] font-bold text-slate-700">إضافة اسم جديد للقائمة:</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={newVerifier}
                onChange={(e) => setNewVerifier(e.target.value)}
                placeholder="د. / مراجع..."
                className="flex-1 text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5"
              />
              <button
                type="button"
                onClick={() => handleAddMember('verifier', newVerifier, 'إدارة ضبط الجودة والتشغيل')}
                className="px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-900"
              >
                إضافة
              </button>
            </div>
          </div>
        </div>

        {/* 3. Pathologist */}
        <div className="space-y-4 p-4 rounded-xl bg-rose-50/50 border border-rose-200">
          <div className="border-b border-rose-200 pb-2">
            <h3 className="text-sm font-bold text-rose-950">3. الاستشاري (Pathologist)</h3>
            <p className="text-[11px] text-rose-800">أطباء واستشاريو الباثولوجيا الإكلينيكية</p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-rose-950">الاستشاري المعتمد حالياً:</label>
            <select
              value={activePathologist}
              onChange={(e) => setActivePathologist(e.target.value)}
              className="w-full text-xs font-bold bg-white border border-rose-300 rounded-lg p-2.5 text-rose-950"
            >
              <option value="">-- اختر الاستشاري --</option>
              {staffSignatureOptions.consultants.map((p) => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* List with Delete */}
          <div className="space-y-1 bg-white p-2 rounded-lg border border-rose-200 max-h-28 overflow-y-auto">
            <span className="text-[10px] font-bold text-rose-900/60 block mb-1">الأسماء المحفوظة (حذف أي اسم):</span>
            {staffSignatureOptions.consultants.map(p => (
              <div key={p.id} className="flex items-center justify-between text-xs py-1 px-1.5 rounded hover:bg-rose-50/50">
                <span className="truncate text-rose-950 font-bold">{p.name}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteMember('consultant', p.id, p.name)}
                  className="text-rose-500 hover:text-rose-700 p-0.5"
                  title="حذف الاسم"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-2 border-t border-rose-200">
            <span className="text-[11px] font-bold text-rose-950">إضافة اسم استشاري جديد:</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={newPathologist}
                onChange={(e) => setNewPathologist(e.target.value)}
                placeholder="أ.د / ..."
                className="flex-1 text-xs bg-white border border-rose-300 rounded-lg px-2.5 py-1.5"
              />
              <button
                type="button"
                onClick={() => handleAddMember('consultant', newPathologist, 'استشاري الباثولوجيا الإكلينيكية')}
                className="px-3 py-1.5 bg-rose-900 text-white text-xs font-bold rounded-lg hover:bg-rose-800"
              >
                إضافة
              </button>
            </div>
          </div>
        </div>

        {/* 4. المدير المالي (Financial Director) */}
        <div className="space-y-4 p-4 rounded-xl bg-emerald-50/50 border border-emerald-200">
          <div className="border-b border-emerald-200 pb-2">
            <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-700" />
              <span>4. المدير المالي (Financial Director)</span>
            </h3>
            <p className="text-[11px] text-emerald-800">إدارة الحسابات والفوترة والاعتماد المالي</p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-emerald-950">المدير المالي المعتمد:</label>
            <select
              value={activeFinancial}
              onChange={(e) => setActiveFinancial(e.target.value)}
              className="w-full text-xs font-bold bg-white border border-emerald-300 rounded-lg p-2.5 text-emerald-950"
            >
              <option value="">-- اختر المدير المالي --</option>
              {staffSignatureOptions.financialDirectors?.map((f) => (
                <option key={f.id} value={f.name}>{f.name}</option>
              ))}
            </select>
          </div>

          {/* List with Delete */}
          <div className="space-y-1 bg-white p-2 rounded-lg border border-emerald-200 max-h-28 overflow-y-auto">
            <span className="text-[10px] font-bold text-emerald-800 block mb-1">الأسماء المحفوظة (حذف أي اسم):</span>
            {staffSignatureOptions.financialDirectors?.map(f => (
              <div key={f.id} className="flex items-center justify-between text-xs py-1 px-1.5 rounded hover:bg-emerald-50/50">
                <span className="truncate text-emerald-950 font-bold">{f.name}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteMember('financial', f.id, f.name)}
                  className="text-rose-500 hover:text-rose-700 p-0.5"
                  title="حذف الاسم"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-2 border-t border-emerald-200">
            <span className="text-[11px] font-bold text-emerald-950">إضافة مدير مالي جديد:</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={newFinancial}
                onChange={(e) => setNewFinancial(e.target.value)}
                placeholder="أ/ ..."
                className="flex-1 text-xs bg-white border border-emerald-300 rounded-lg px-2.5 py-1.5"
              />
              <button
                type="button"
                onClick={() => handleAddMember('financial', newFinancial, 'المدير المالي ورئيس الحسابات (CFO)')}
                className="px-3 py-1.5 bg-emerald-900 text-white text-xs font-bold rounded-lg hover:bg-emerald-800"
              >
                إضافة
              </button>
            </div>
          </div>
        </div>

        {/* 5. مدير الموارد البشرية (HR Director) */}
        <div className="space-y-4 p-4 rounded-xl bg-purple-50/50 border border-purple-200">
          <div className="border-b border-purple-200 pb-2">
            <h3 className="text-sm font-bold text-purple-950 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-purple-700" />
              <span>5. مدير الـ HR (Human Resources)</span>
            </h3>
            <p className="text-[11px] text-purple-800">إدارة الكوادر البشرية وشؤون العاملين</p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-purple-950">مدير الـ HR المعتمد:</label>
            <select
              value={activeHr}
              onChange={(e) => setActiveHr(e.target.value)}
              className="w-full text-xs font-bold bg-white border border-purple-300 rounded-lg p-2.5 text-purple-950"
            >
              <option value="">-- اختر مدير الـ HR --</option>
              {staffSignatureOptions.hrDirectors?.map((h) => (
                <option key={h.id} value={h.name}>{h.name}</option>
              ))}
            </select>
          </div>

          {/* List with Delete */}
          <div className="space-y-1 bg-white p-2 rounded-lg border border-purple-200 max-h-28 overflow-y-auto">
            <span className="text-[10px] font-bold text-purple-800 block mb-1">الأسماء المحفوظة (حذف أي اسم):</span>
            {staffSignatureOptions.hrDirectors?.map(h => (
              <div key={h.id} className="flex items-center justify-between text-xs py-1 px-1.5 rounded hover:bg-purple-50/50">
                <span className="truncate text-purple-950 font-bold">{h.name}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteMember('hr', h.id, h.name)}
                  className="text-rose-500 hover:text-rose-700 p-0.5"
                  title="حذف الاسم"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-2 border-t border-purple-200">
            <span className="text-[11px] font-bold text-purple-950">إضافة مدير HR جديد:</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={newHr}
                onChange={(e) => setNewHr(e.target.value)}
                placeholder="أ/ ..."
                className="flex-1 text-xs bg-white border border-purple-300 rounded-lg px-2.5 py-1.5"
              />
              <button
                type="button"
                onClick={() => handleAddMember('hr', newHr, 'مدير الموارد البشرية (HR Manager)')}
                className="px-3 py-1.5 bg-purple-900 text-white text-xs font-bold rounded-lg hover:bg-purple-800"
              >
                إضافة
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
