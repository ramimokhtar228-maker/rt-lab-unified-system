import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { LabStaffSignatures } from '../types/lab';
import { HANDWRITTEN_SIGNATURE_OPTIONS, HandwrittenSignatureKey, resolveHandwrittenSignatureSrc } from '../assets/signatureImages';
import { UserCheck, CheckCircle2, Trash2 } from 'lucide-react';

interface StaffSettingsModalProps {
  currentStaff: LabStaffSignatures;
  onUpdateDefaultStaff: (staff: LabStaffSignatures) => void;
}

export const StaffSettingsModal: React.FC<StaffSettingsModalProps> = ({
  currentStaff,
  onUpdateDefaultStaff
}) => {
  const {
    staffSignatureOptions,
    addStaffSignatureOption,
    deleteStaffSignatureOption,
    updateStaffSignatures
  } = useApp();

  const [activeChemist, setActiveChemist] = useState<string>(currentStaff.labChemist || '');
  const [activeVerifier, setActiveVerifier] = useState<string>(currentStaff.verifiedBy || '');
  const [activePathologist, setActivePathologist] = useState<string>(currentStaff.pathologist || '');
  const [activePhlebotomist, setActivePhlebotomist] = useState<string>(currentStaff.phlebotomist || '');
  const [activeVisitCoord, setActiveVisitCoord] = useState<string>(currentStaff.visitCoordinator || '');

  const [newChemist, setNewChemist] = useState('');
  const [newVerifier, setNewVerifier] = useState('');
  const [newPathologist, setNewPathologist] = useState('');
  const [newPhlebotomist, setNewPhlebotomist] = useState('');
  const [newVisitCoord, setNewVisitCoord] = useState('');

  const [chemistSigKey, setChemistSigKey] = useState<HandwrittenSignatureKey>((currentStaff.chemistSignatureKey as HandwrittenSignatureKey) || 'auto');
  const [verifierSigKey, setVerifierSigKey] = useState<HandwrittenSignatureKey>((currentStaff.verifierSignatureKey as HandwrittenSignatureKey) || 'auto');
  const [pathologistSigKey, setPathologistSigKey] = useState<HandwrittenSignatureKey>((currentStaff.pathologistSignatureKey as HandwrittenSignatureKey) || 'auto');

  const [savedNotification, setSavedNotification] = useState(false);

  useEffect(() => {
    setActiveChemist(currentStaff.labChemist || '');
    setActiveVerifier(currentStaff.verifiedBy || '');
    setActivePathologist(currentStaff.pathologist || '');
    setActivePhlebotomist(currentStaff.phlebotomist || '');
    setActiveVisitCoord(currentStaff.visitCoordinator || '');
    setChemistSigKey((currentStaff.chemistSignatureKey as HandwrittenSignatureKey) || 'auto');
    setVerifierSigKey((currentStaff.verifierSignatureKey as HandwrittenSignatureKey) || 'auto');
    setPathologistSigKey((currentStaff.pathologistSignatureKey as HandwrittenSignatureKey) || 'auto');
  }, [currentStaff]);

  const handleAddChemist = () => {
    if (!newChemist.trim()) return;
    const name = newChemist.trim();
    addStaffSignatureOption('chemist', { name, title: 'كيميائي المعمل' });
    setActiveChemist(name);
    setNewChemist('');
  };

  const handleAddVerifier = () => {
    if (!newVerifier.trim()) return;
    const name = newVerifier.trim();
    addStaffSignatureOption('verifier', { name, title: 'طبيب الوحده' });
    setActiveVerifier(name);
    setNewVerifier('');
  };

  const handleAddPathologist = () => {
    if (!newPathologist.trim()) return;
    const name = newPathologist.trim();
    addStaffSignatureOption('consultant', { name, title: 'استشارى الباثولوجيا الإكلينيكية' });
    setActivePathologist(name);
    setNewPathologist('');
  };

  const handleAddPhlebotomist = () => {
    if (!newPhlebotomist.trim()) return;
    const name = newPhlebotomist.trim();
    addStaffSignatureOption('phlebotomist', { name, title: 'القائم بالسحب' });
    setActivePhlebotomist(name);
    setNewPhlebotomist('');
  };

  const handleAddVisitCoord = () => {
    if (!newVisitCoord.trim()) return;
    const name = newVisitCoord.trim();
    addStaffSignatureOption('visit_coordinator', { name, title: 'مسؤول الزيارة' });
    setActiveVisitCoord(name);
    setNewVisitCoord('');
  };

  const handleSaveDefaults = () => {
    const updated: LabStaffSignatures = {
      ...currentStaff,
      labChemist: activeChemist,
      verifiedBy: activeVerifier,
      pathologist: activePathologist,
      phlebotomist: activePhlebotomist,
      visitCoordinator: activeVisitCoord,
      showPhlebotomist: activePhlebotomist.trim() !== '',
      showVisitCoordinator: activeVisitCoord.trim() !== '',
      chemistSignatureKey: chemistSigKey,
      verifierSignatureKey: verifierSigKey,
      pathologistSignatureKey: pathologistSigKey
    };
    onUpdateDefaultStaff(updated);
    updateStaffSignatures(updated);
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
              إضافة وتعديل وحذف أسماء كيميائي المعمل، طبيب الوحده، استشارى الباثولوجيا الإكلينيكية، القائم بالسحب، ومسؤول الزيارة
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveDefaults}
          className="flex items-center gap-2 px-5 py-2 bg-rose-900 hover:bg-rose-800 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>حفظ التوقيعات الافتراضية</span>
        </button>
      </div>

      {savedNotification && (
        <div className="p-3 bg-emerald-50 text-emerald-900 rounded-lg text-xs font-bold border border-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>تم حفظ الإمضاءات الافتراضية بنجاح واعتمادها لكافة التقارير الجديدة!</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. كيميائي المعمل */}
        <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">1. كيميائي المعمل</h3>
              <p className="text-[11px] text-slate-500">الفحص والتشغيل المعملي</p>
            </div>
            {staffSignatureOptions.chemists.find(c => c.name === activeChemist) && (
              <button
                type="button"
                onClick={() => {
                  const found = staffSignatureOptions.chemists.find(c => c.name === activeChemist);
                  if (found) {
                    deleteStaffSignatureOption('chemist', found.id);
                    setActiveChemist('');
                  }
                }}
                className="text-rose-600 hover:text-rose-800 p-1"
                title="حذف من القائمة"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">الاسم المعتمد حالياً:</label>
            <select
              value={activeChemist}
              onChange={(e) => setActiveChemist(e.target.value)}
              className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900"
            >
              <option value="">-- بدون توقيع --</option>
              {staffSignatureOptions.chemists.map((c) => (
                <option key={c.id} value={c.name}>{c.name} — {c.title}</option>
              ))}
            </select>
            <select
              value={chemistSigKey}
              onChange={(e) => setChemistSigKey(e.target.value as HandwrittenSignatureKey)}
              className="w-full text-[11px] bg-white border border-slate-300 rounded-lg p-1.5 text-slate-700 font-bold"
            >
              {HANDWRITTEN_SIGNATURE_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
            {resolveHandwrittenSignatureSrc(activeChemist, chemistSigKey) && (
              <div className="bg-white border border-slate-200 rounded p-1.5 flex justify-center h-10">
                <img src={resolveHandwrittenSignatureSrc(activeChemist, chemistSigKey)!} alt={activeChemist} className="max-h-7 w-auto object-contain" />
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-200">
            <span className="text-[11px] font-bold text-slate-700">إضافة اسم جديد للقائمة:</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={newChemist}
                onChange={(e) => setNewChemist(e.target.value)}
                placeholder="د/ ..."
                className="flex-1 text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5"
              />
              <button
                type="button"
                onClick={handleAddChemist}
                className="px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-900"
              >
                إضافة
              </button>
            </div>
          </div>
        </div>

        {/* 2. طبيب الوحده */}
        <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">2. طبيب الوحده</h3>
              <p className="text-[11px] text-slate-500">المراجعة والتدقيق الإكلينيكي</p>
            </div>
            {staffSignatureOptions.verifiers.find(v => v.name === activeVerifier) && (
              <button
                type="button"
                onClick={() => {
                  const found = staffSignatureOptions.verifiers.find(v => v.name === activeVerifier);
                  if (found) {
                    deleteStaffSignatureOption('verifier', found.id);
                    setActiveVerifier('');
                  }
                }}
                className="text-rose-600 hover:text-rose-800 p-1"
                title="حذف من القائمة"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">الاسم المعتمد حالياً:</label>
            <select
              value={activeVerifier}
              onChange={(e) => setActiveVerifier(e.target.value)}
              className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900"
            >
              <option value="">-- بدون توقيع --</option>
              {staffSignatureOptions.verifiers.map((v) => (
                <option key={v.id} value={v.name}>{v.name} — {v.title}</option>
              ))}
            </select>
            <select
              value={verifierSigKey}
              onChange={(e) => setVerifierSigKey(e.target.value as HandwrittenSignatureKey)}
              className="w-full text-[11px] bg-white border border-slate-300 rounded-lg p-1.5 text-slate-700 font-bold"
            >
              {HANDWRITTEN_SIGNATURE_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
            {resolveHandwrittenSignatureSrc(activeVerifier, verifierSigKey) && (
              <div className="bg-white border border-slate-200 rounded p-1.5 flex justify-center h-10">
                <img src={resolveHandwrittenSignatureSrc(activeVerifier, verifierSigKey)!} alt={activeVerifier} className="max-h-7 w-auto object-contain" />
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-200">
            <span className="text-[11px] font-bold text-slate-700">إضافة اسم جديد للقائمة:</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={newVerifier}
                onChange={(e) => setNewVerifier(e.target.value)}
                placeholder="د/ ..."
                className="flex-1 text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5"
              />
              <button
                type="button"
                onClick={handleAddVerifier}
                className="px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-900"
              >
                إضافة
              </button>
            </div>
          </div>
        </div>

        {/* 3. استشارى الباثولوجيا الإكلينيكية */}
        <div className="space-y-3 p-4 rounded-xl bg-rose-50/50 border border-rose-200">
          <div className="border-b border-rose-200 pb-2 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-rose-950">3. استشارى الباثولوجيا الإكلينيكية</h3>
              <p className="text-[11px] text-rose-800">الاعتماد الطبي النهائي والتوقيع الرسمي</p>
            </div>
            {staffSignatureOptions.consultants.find(p => p.name === activePathologist) && (
              <button
                type="button"
                onClick={() => {
                  const found = staffSignatureOptions.consultants.find(p => p.name === activePathologist);
                  if (found) {
                    deleteStaffSignatureOption('consultant', found.id);
                    setActivePathologist('');
                  }
                }}
                className="text-rose-600 hover:text-rose-800 p-1"
                title="حذف من القائمة"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-rose-950">الاستشاري المعتمد حالياً:</label>
            <select
              value={activePathologist}
              onChange={(e) => setActivePathologist(e.target.value)}
              className="w-full text-xs font-bold bg-white border border-rose-300 rounded-lg p-2.5 text-rose-950"
            >
              <option value="">-- بدون توقيع --</option>
              {staffSignatureOptions.consultants.map((p) => (
                <option key={p.id} value={p.name}>{p.name} — {p.title}</option>
              ))}
            </select>
            <select
              value={pathologistSigKey}
              onChange={(e) => setPathologistSigKey(e.target.value as HandwrittenSignatureKey)}
              className="w-full text-[11px] bg-white border border-rose-300 rounded-lg p-1.5 text-rose-950 font-bold"
            >
              {HANDWRITTEN_SIGNATURE_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
            {resolveHandwrittenSignatureSrc(activePathologist, pathologistSigKey) && (
              <div className="bg-white border border-rose-200 rounded p-1.5 flex justify-center h-10">
                <img src={resolveHandwrittenSignatureSrc(activePathologist, pathologistSigKey)!} alt={activePathologist} className="max-h-7 w-auto object-contain" />
              </div>
            )}
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
                onClick={handleAddPathologist}
                className="px-3 py-1.5 bg-rose-900 text-white text-xs font-bold rounded-lg hover:bg-rose-800"
              >
                إضافة
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4 & 5: القائم بالسحب ومسؤول الزيارة */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3 p-4 rounded-xl bg-teal-50/40 border border-teal-200">
          <div className="border-b border-teal-200 pb-2 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-teal-950">4. القائم بالسحب</h3>
              <p className="text-[11px] text-teal-700">تفعيل القائم بالسحب وإضافته للتقارير</p>
            </div>
            {(staffSignatureOptions.phlebotomists || []).find(p => p.name === activePhlebotomist) && (
              <button
                type="button"
                onClick={() => {
                  const found = (staffSignatureOptions.phlebotomists || []).find(p => p.name === activePhlebotomist);
                  if (found) {
                    deleteStaffSignatureOption('phlebotomist', found.id);
                    setActivePhlebotomist('');
                  }
                }}
                className="text-rose-600 hover:text-rose-800 p-1"
                title="حذف من القائمة"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <select
            value={activePhlebotomist}
            onChange={(e) => setActivePhlebotomist(e.target.value)}
            className="w-full text-xs font-bold bg-white border border-teal-300 rounded-lg p-2.5 text-teal-950"
          >
            <option value="">-- غير مفعل --</option>
            {(staffSignatureOptions.phlebotomists || []).map((p) => (
              <option key={p.id} value={p.name}>{p.name} — {p.title}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <input
              type="text"
              value={newPhlebotomist}
              onChange={(e) => setNewPhlebotomist(e.target.value)}
              placeholder="إضافة اسم القائم بالسحب..."
              className="flex-1 text-xs bg-white border border-teal-300 rounded-lg px-2.5 py-1.5"
            />
            <button
              type="button"
              onClick={handleAddPhlebotomist}
              className="px-3 py-1.5 bg-teal-800 text-white text-xs font-bold rounded-lg hover:bg-teal-900"
            >
              إضافة
            </button>
          </div>
        </div>

        <div className="space-y-3 p-4 rounded-xl bg-amber-50/40 border border-amber-200">
          <div className="border-b border-amber-200 pb-2 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-amber-950">5. مسؤول الزيارة</h3>
              <p className="text-[11px] text-amber-700">تفعيل مسؤول الزيارة وإضافته للتقارير</p>
            </div>
            {(staffSignatureOptions.visitCoordinators || []).find(v => v.name === activeVisitCoord) && (
              <button
                type="button"
                onClick={() => {
                  const found = (staffSignatureOptions.visitCoordinators || []).find(v => v.name === activeVisitCoord);
                  if (found) {
                    deleteStaffSignatureOption('visit_coordinator', found.id);
                    setActiveVisitCoord('');
                  }
                }}
                className="text-rose-600 hover:text-rose-800 p-1"
                title="حذف من القائمة"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <select
            value={activeVisitCoord}
            onChange={(e) => setActiveVisitCoord(e.target.value)}
            className="w-full text-xs font-bold bg-white border border-amber-300 rounded-lg p-2.5 text-amber-950"
          >
            <option value="">-- غير مفعل --</option>
            {(staffSignatureOptions.visitCoordinators || []).map((v) => (
              <option key={v.id} value={v.name}>{v.name} — {v.title}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <input
              type="text"
              value={newVisitCoord}
              onChange={(e) => setNewVisitCoord(e.target.value)}
              placeholder="إضافة اسم مسؤول الزيارة..."
              className="flex-1 text-xs bg-white border border-amber-300 rounded-lg px-2.5 py-1.5"
            />
            <button
              type="button"
              onClick={handleAddVisitCoord}
              className="px-3 py-1.5 bg-amber-800 text-white text-xs font-bold rounded-lg hover:bg-amber-900"
            >
              إضافة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
