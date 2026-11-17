import React, { useState } from 'react';
import {
  ExtraSignatureSlot,
  LabStaffSignatures,
  StaffOptionItem,
  StaffOptionRole
} from '../types/lab';
import { DEFAULT_STAFF } from '../data/labCatalog';
import { useApp } from '../context/AppContext';
import {
  HANDWRITTEN_SIGNATURE_OPTIONS,
  HandwrittenSignatureKey,
  resolveHandwrittenSignatureSrc
} from '../assets/signatureImages';
import {
  UserCheck,
  Plus,
  Check,
  ShieldCheck,
  Award,
  X,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  PenTool,
  Users
} from 'lucide-react';

interface StaffSignaturesPickerProps {
  signatures: LabStaffSignatures;
  onChange: (updated: LabStaffSignatures) => void;
}

const ROLE_META: Record<
  StaffOptionRole,
  { label: string; addLabel: string; defaultTitle: string; selectPlaceholder: string }
> = {
  chemist: {
    label: 'كيميائي المعمل',
    addLabel: 'إضافة كيميائي',
    defaultTitle: 'كيميائي تحاليل طبية',
    selectPlaceholder: '-- اختر كيميائي المعمل --'
  },
  verifier: {
    label: 'طبيب الوحده',
    addLabel: 'إضافة طبيب',
    defaultTitle: 'طبيب الوحدة والمراجعة الإكلينيكية',
    selectPlaceholder: '-- اختر طبيب الوحده --'
  },
  consultant: {
    label: 'استشارى الباثولوجيا الإكلينيكية',
    addLabel: 'إضافة استشاري',
    defaultTitle: 'استشارى الباثولوجيا الإكلينيكية — قصر العيني',
    selectPlaceholder: '-- اختر الاستشاري المعتمد --'
  },
  phlebotomist: {
    label: 'القائم بالسحب',
    addLabel: 'إضافة قائم بالسحب',
    defaultTitle: 'أخصائي سحب العينات',
    selectPlaceholder: '-- اختر القائم بالسحب --'
  },
  visit_coordinator: {
    label: 'مسؤول الزيارة',
    addLabel: 'إضافة مسؤول زيارة',
    defaultTitle: 'مسؤول تنسيق الزيارة وخدمة المرضى',
    selectPlaceholder: '-- اختر مسؤول الزيارة --'
  },
  custom: {
    label: 'عامل / توقيع مخصص',
    addLabel: 'إضافة عامل جديد',
    defaultTitle: 'عامل بالمعمل',
    selectPlaceholder: '-- اختر من العاملين الإضافيين --'
  }
};

export const StaffSignaturesPicker: React.FC<StaffSignaturesPickerProps> = ({
  signatures: rawSignatures,
  onChange
}) => {
  const signatures: LabStaffSignatures = {
    ...DEFAULT_STAFF,
    ...(rawSignatures || {})
  };

  const {
    staffSignatureOptions,
    addStaffSignatureOption,
    updateStaffSignatureOption,
    deleteStaffSignatureOption,
    updateStaffSignatures
  } = useApp();

  const [savedDefaultAlert, setSavedDefaultAlert] = useState(false);

  // Modal states for Adding / Editing staff options
  const [addingRole, setAddingRole] = useState<StaffOptionRole | null>(null);
  const [editingItem, setEditingItem] = useState<{ role: StaffOptionRole; item: StaffOptionItem } | null>(null);

  const [formRoleLabel, setFormRoleLabel] = useState('');
  const [formName, setFormName] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formLicense, setFormLicense] = useState('');
  const [formSignatureKey, setFormSignatureKey] = useState<HandwrittenSignatureKey>('auto');

  // Visibility flags
  const hideAll = signatures.hideSignatures === true;
  const showChemist = signatures.showChemist !== false;
  const showVerifier = signatures.showVerifier !== false;
  const showPathologist = signatures.showPathologist !== false;
  const showPhlebotomist = signatures.showPhlebotomist !== false;
  const showVisitCoordinator = signatures.showVisitCoordinator !== false;

  const extraSignatures: ExtraSignatureSlot[] = Array.isArray(signatures.extraSignatures)
    ? signatures.extraSignatures
    : [];

  const getRoleOptions = (role: StaffOptionRole): StaffOptionItem[] => {
    switch (role) {
      case 'chemist':
        return staffSignatureOptions.chemists || [];
      case 'verifier':
        return staffSignatureOptions.verifiers || [];
      case 'consultant':
        return staffSignatureOptions.consultants || [];
      case 'phlebotomist':
        return staffSignatureOptions.phlebotomists || [];
      case 'visit_coordinator':
        return staffSignatureOptions.visitCoordinators || [];
      case 'custom':
        return staffSignatureOptions.customWorkers || [];
    }
  };

  const handleToggleHideAll = () => {
    onChange({
      ...signatures,
      hideSignatures: !hideAll
    });
  };

  const handleToggleRole = (role: Exclude<StaffOptionRole, 'custom'>) => {
    if (role === 'chemist') {
      onChange({ ...signatures, showChemist: !showChemist });
    } else if (role === 'verifier') {
      onChange({ ...signatures, showVerifier: !showVerifier });
    } else if (role === 'consultant') {
      onChange({ ...signatures, showPathologist: !showPathologist });
    } else if (role === 'phlebotomist') {
      onChange({ ...signatures, showPhlebotomist: !showPhlebotomist });
    } else if (role === 'visit_coordinator') {
      onChange({ ...signatures, showVisitCoordinator: !showVisitCoordinator });
    }
  };

  const handleSelectStaff = (role: Exclude<StaffOptionRole, 'custom'>, item: StaffOptionItem) => {
    let updatedSigs: LabStaffSignatures = { ...signatures };
    if (role === 'chemist') {
      updatedSigs = {
        ...signatures,
        showChemist: true,
        labChemist: item.name,
        chemistTitle: item.title,
        chemistLicense: item.license || signatures.chemistLicense,
        chemistSignatureKey: item.signatureKey || 'auto'
      };
    } else if (role === 'verifier') {
      updatedSigs = {
        ...signatures,
        showVerifier: true,
        verifiedBy: item.name,
        verifierTitle: item.title,
        verifierLicense: item.license || signatures.verifierLicense,
        verifierSignatureKey: item.signatureKey || 'auto'
      };
    } else if (role === 'consultant') {
      updatedSigs = {
        ...signatures,
        showPathologist: true,
        pathologist: item.name,
        pathologistTitle: item.title,
        pathologistLicense: item.license || signatures.pathologistLicense,
        pathologistSignatureKey: item.signatureKey || 'auto'
      };
    } else if (role === 'phlebotomist') {
      updatedSigs = {
        ...signatures,
        showPhlebotomist: true,
        phlebotomist: item.name,
        phlebotomistTitle: item.title,
        phlebotomistLicense: item.license || signatures.phlebotomistLicense,
        phlebotomistSignatureKey: item.signatureKey || 'auto'
      };
    } else if (role === 'visit_coordinator') {
      updatedSigs = {
        ...signatures,
        showVisitCoordinator: true,
        visitCoordinator: item.name,
        visitCoordinatorTitle: item.title,
        visitCoordinatorLicense: item.license || signatures.visitCoordinatorLicense,
        visitCoordinatorSignatureKey: item.signatureKey || 'auto'
      };
    }
    onChange(updatedSigs);
    updateStaffSignatures(updatedSigs);
  };

  const handleOpenAdd = (role: StaffOptionRole) => {
    setAddingRole(role);
    setEditingItem(null);
    setFormName('');
    setFormTitle(ROLE_META[role].defaultTitle);
    setFormRoleLabel(role === 'custom' ? 'عامل بالمعمل' : ROLE_META[role].label);
    setFormLicense('');
    setFormSignatureKey('auto');
  };

  const handleOpenEdit = (role: StaffOptionRole, item: StaffOptionItem) => {
    setEditingItem({ role, item });
    setAddingRole(null);
    setFormName(item.name);
    setFormTitle(item.title);
    setFormRoleLabel(item.customRoleLabel || ROLE_META[role].label);
    setFormLicense(item.license || '');
    setFormSignatureKey((item.signatureKey as HandwrittenSignatureKey) || 'auto');
  };

  const handleDeleteStaff = (role: StaffOptionRole, item: StaffOptionItem) => {
    if (!confirm(`هل أنت متأكد من حذف (${item.name}) نهائياً من قائمة العاملين؟`)) return;
    deleteStaffSignatureOption(role, item.id);

    const remaining = getRoleOptions(role).filter(o => o.id !== item.id);
    const fallback = remaining[0];
    const updatedSigs: LabStaffSignatures = { ...signatures };

    if (role === 'chemist' && signatures.labChemist === item.name) {
      updatedSigs.labChemist = fallback?.name || '';
      updatedSigs.chemistTitle = fallback?.title || '';
      updatedSigs.chemistLicense = fallback?.license || '';
      updatedSigs.chemistSignatureKey = fallback?.signatureKey || 'auto';
      if (!fallback) updatedSigs.showChemist = false;
    } else if (role === 'verifier' && signatures.verifiedBy === item.name) {
      updatedSigs.verifiedBy = fallback?.name || '';
      updatedSigs.verifierTitle = fallback?.title || '';
      updatedSigs.verifierLicense = fallback?.license || '';
      updatedSigs.verifierSignatureKey = fallback?.signatureKey || 'auto';
      if (!fallback) updatedSigs.showVerifier = false;
    } else if (role === 'consultant' && signatures.pathologist === item.name) {
      updatedSigs.pathologist = fallback?.name || '';
      updatedSigs.pathologistTitle = fallback?.title || '';
      updatedSigs.pathologistLicense = fallback?.license || '';
      updatedSigs.pathologistSignatureKey = fallback?.signatureKey || 'auto';
      if (!fallback) updatedSigs.showPathologist = false;
    } else if (role === 'phlebotomist' && signatures.phlebotomist === item.name) {
      updatedSigs.phlebotomist = fallback?.name || '';
      updatedSigs.phlebotomistTitle = fallback?.title || '';
      updatedSigs.phlebotomistLicense = fallback?.license || '';
      updatedSigs.phlebotomistSignatureKey = fallback?.signatureKey || 'auto';
      if (!fallback) updatedSigs.showPhlebotomist = false;
    } else if (role === 'visit_coordinator' && signatures.visitCoordinator === item.name) {
      updatedSigs.visitCoordinator = fallback?.name || '';
      updatedSigs.visitCoordinatorTitle = fallback?.title || '';
      updatedSigs.visitCoordinatorLicense = fallback?.license || '';
      updatedSigs.visitCoordinatorSignatureKey = fallback?.signatureKey || 'auto';
      if (!fallback) updatedSigs.showVisitCoordinator = false;
    }

    onChange(updatedSigs);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const cleanName = formName.trim();
    const cleanTitle = formTitle.trim();
    const cleanLicense = formLicense.trim() || undefined;
    const cleanRoleLabel = formRoleLabel.trim() || undefined;

    if (editingItem) {
      updateStaffSignatureOption(editingItem.role, editingItem.item.id, {
        name: cleanName,
        title: cleanTitle,
        license: cleanLicense,
        signatureKey: formSignatureKey,
        ...(editingItem.role === 'custom' ? { customRoleLabel: cleanRoleLabel } : {})
      });
      const updatedSigs: LabStaffSignatures = { ...signatures };
      if (editingItem.role === 'chemist' && (signatures.labChemist === editingItem.item.name || !signatures.labChemist)) {
        updatedSigs.labChemist = cleanName;
        updatedSigs.chemistTitle = cleanTitle;
        updatedSigs.chemistLicense = cleanLicense;
        updatedSigs.chemistSignatureKey = formSignatureKey;
      } else if (editingItem.role === 'verifier' && (signatures.verifiedBy === editingItem.item.name || !signatures.verifiedBy)) {
        updatedSigs.verifiedBy = cleanName;
        updatedSigs.verifierTitle = cleanTitle;
        updatedSigs.verifierLicense = cleanLicense;
        updatedSigs.verifierSignatureKey = formSignatureKey;
      } else if (editingItem.role === 'consultant' && (signatures.pathologist === editingItem.item.name || !signatures.pathologist)) {
        updatedSigs.pathologist = cleanName;
        updatedSigs.pathologistTitle = cleanTitle;
        updatedSigs.pathologistLicense = cleanLicense;
        updatedSigs.pathologistSignatureKey = formSignatureKey;
      } else if (editingItem.role === 'phlebotomist' && (signatures.phlebotomist === editingItem.item.name || !signatures.phlebotomist)) {
        updatedSigs.phlebotomist = cleanName;
        updatedSigs.phlebotomistTitle = cleanTitle;
        updatedSigs.phlebotomistLicense = cleanLicense;
        updatedSigs.phlebotomistSignatureKey = formSignatureKey;
      } else if (editingItem.role === 'visit_coordinator' && (signatures.visitCoordinator === editingItem.item.name || !signatures.visitCoordinator)) {
        updatedSigs.visitCoordinator = cleanName;
        updatedSigs.visitCoordinatorTitle = cleanTitle;
        updatedSigs.visitCoordinatorLicense = cleanLicense;
        updatedSigs.visitCoordinatorSignatureKey = formSignatureKey;
      }
      onChange(updatedSigs);
      updateStaffSignatures(updatedSigs);
      setEditingItem(null);
    } else if (addingRole) {
      addStaffSignatureOption(addingRole, {
        name: cleanName,
        title: cleanTitle,
        license: cleanLicense,
        signatureKey: formSignatureKey,
        ...(addingRole === 'custom' ? { customRoleLabel: cleanRoleLabel } : {})
      });
      if (addingRole === 'custom') {
        const newSlot: ExtraSignatureSlot = {
          id: `extra-${Date.now()}`,
          roleTitle: cleanRoleLabel || 'عامل بالمعمل',
          name: cleanName,
          subtitle: cleanTitle,
          license: cleanLicense,
          signatureKey: formSignatureKey,
          isActive: true
        };
        const updatedSigs = {
          ...signatures,
          extraSignatures: [...extraSignatures, newSlot]
        };
        onChange(updatedSigs);
        updateStaffSignatures(updatedSigs);
      } else {
        const updatedSigs: LabStaffSignatures = { ...signatures };
        if (addingRole === 'chemist') {
          updatedSigs.showChemist = true;
          updatedSigs.labChemist = cleanName;
          updatedSigs.chemistTitle = cleanTitle;
          updatedSigs.chemistLicense = cleanLicense;
          updatedSigs.chemistSignatureKey = formSignatureKey;
        } else if (addingRole === 'verifier') {
          updatedSigs.showVerifier = true;
          updatedSigs.verifiedBy = cleanName;
          updatedSigs.verifierTitle = cleanTitle;
          updatedSigs.verifierLicense = cleanLicense;
          updatedSigs.verifierSignatureKey = formSignatureKey;
        } else if (addingRole === 'consultant') {
          updatedSigs.showPathologist = true;
          updatedSigs.pathologist = cleanName;
          updatedSigs.pathologistTitle = cleanTitle;
          updatedSigs.pathologistLicense = cleanLicense;
          updatedSigs.pathologistSignatureKey = formSignatureKey;
        } else if (addingRole === 'phlebotomist') {
          updatedSigs.showPhlebotomist = true;
          updatedSigs.phlebotomist = cleanName;
          updatedSigs.phlebotomistTitle = cleanTitle;
          updatedSigs.phlebotomistLicense = cleanLicense;
          updatedSigs.phlebotomistSignatureKey = formSignatureKey;
        } else if (addingRole === 'visit_coordinator') {
          updatedSigs.showVisitCoordinator = true;
          updatedSigs.visitCoordinator = cleanName;
          updatedSigs.visitCoordinatorTitle = cleanTitle;
          updatedSigs.visitCoordinatorLicense = cleanLicense;
          updatedSigs.visitCoordinatorSignatureKey = formSignatureKey;
        }
        onChange(updatedSigs);
        updateStaffSignatures(updatedSigs);
      }
      setAddingRole(null);
    }

    setFormName('');
    setFormTitle('');
    setFormRoleLabel('');
    setFormLicense('');
    setFormSignatureKey('auto');
  };

  // Extra custom workers directly on the report
  const handleAddBlankExtraSlot = () => {
    const newSlot: ExtraSignatureSlot = {
      id: `extra-${Date.now()}`,
      roleTitle: 'فني / عامل بالمعمل',
      name: '',
      subtitle: '',
      signatureKey: 'auto',
      isActive: true
    };
    onChange({
      ...signatures,
      extraSignatures: [...extraSignatures, newSlot]
    });
  };

  const handleUpdateExtraSlot = (id: string, patch: Partial<ExtraSignatureSlot>) => {
    onChange({
      ...signatures,
      extraSignatures: extraSignatures.map(slot => (slot.id === id ? { ...slot, ...patch } : slot))
    });
  };

  const handleDeleteExtraSlot = (id: string) => {
    onChange({
      ...signatures,
      extraSignatures: extraSignatures.filter(slot => slot.id !== id)
    });
  };

  // Helper to render one of the 5 standard role cards
  const renderRoleCard = (cfg: {
    index: number;
    role: Exclude<StaffOptionRole, 'custom'>;
    isShown: boolean;
    nameValue: string;
    titleValue: string;
    licenseValue: string;
    sigKeyValue: string;
    accent?: 'rose' | 'emerald' | 'blue' | 'slate';
    onNameChange: (val: string) => void;
    onTitleChange: (val: string) => void;
    onLicenseChange: (val: string) => void;
    onSigKeyChange: (val: HandwrittenSignatureKey) => void;
    onClearSlot: () => void;
  }) => {
    const options = getRoleOptions(cfg.role);
    const currentOpt = options.find(o => o.name === cfg.nameValue);
    const meta = ROLE_META[cfg.role];
    const resolvedPreview = resolveHandwrittenSignatureSrc(cfg.nameValue, cfg.sigKeyValue);

    const cardBorder =
      !cfg.isShown || hideAll
        ? 'bg-slate-100/60 opacity-60 border-slate-200'
        : cfg.accent === 'rose'
        ? 'bg-rose-50/50 border-rose-200'
        : cfg.accent === 'emerald'
        ? 'bg-emerald-50/40 border-emerald-200'
        : cfg.accent === 'blue'
        ? 'bg-blue-50/40 border-blue-200'
        : 'bg-slate-50 border-slate-200';

    return (
      <div className={`rounded-xl p-3.5 border transition space-y-2.5 ${cardBorder}`}>
        <div className="flex items-center justify-between gap-1.5">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-black text-slate-900">
            <input
              type="checkbox"
              checked={cfg.isShown && !hideAll}
              onChange={() => handleToggleRole(cfg.role)}
              disabled={hideAll}
              className="w-4 h-4 rounded text-rose-700 focus:ring-rose-500"
            />
            <span>
              {cfg.index}. {meta.label}
            </span>
          </label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleOpenAdd(cfg.role)}
              className="text-[11px] font-bold text-rose-800 hover:text-rose-950 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-md border border-rose-200 flex items-center gap-1 transition cursor-pointer"
              title={`إضافة ${meta.label} جديد للقائمة`}
            >
              <Plus className="w-3 h-3" />
              <span>إضافة</span>
            </button>
            {cfg.nameValue && (
              <button
                type="button"
                onClick={cfg.onClearSlot}
                className="p-1 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded transition cursor-pointer"
                title="إزالة هذا العامل من التقرير الحالي"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Select from saved list + Edit/Delete item */}
        <div>
          <label className="block text-[10px] font-bold text-slate-600 mb-1">
            اختر من القائمة المسجلة:
          </label>
          <div className="flex items-center gap-1">
            <select
              value={cfg.nameValue}
              onChange={(e) => {
                const opt = options.find(o => o.name === e.target.value);
                if (opt) handleSelectStaff(cfg.role, opt);
                else cfg.onNameChange(e.target.value);
              }}
              disabled={hideAll || !cfg.isShown}
              className="flex-1 min-w-0 text-xs font-medium p-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer disabled:bg-slate-100"
            >
              <option value="">{meta.selectPlaceholder}</option>
              {options.map((opt) => (
                <option key={opt.id} value={opt.name}>
                  {opt.name} {opt.title ? `— (${opt.title})` : ''}
                </option>
              ))}
            </select>

            {currentOpt && (
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(cfg.role, currentOpt)}
                  className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded cursor-pointer"
                  title="تعديل بيانات هذا العامل في القائمة"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteStaff(cfg.role, currentOpt)}
                  className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer"
                  title="حذف هذا العامل نهائياً من القائمة"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Inline Editable Fields */}
        <div className="space-y-1.5 pt-1 border-t border-slate-200/60">
          <div>
            <span className="block text-[10px] font-bold text-slate-500 mb-0.5">الاسم في التقرير:</span>
            <input
              type="text"
              value={cfg.nameValue}
              disabled={hideAll || !cfg.isShown}
              onChange={(e) => cfg.onNameChange(e.target.value)}
              placeholder={`اسم ${meta.label}`}
              className="w-full text-xs font-bold p-1.5 px-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500 disabled:bg-slate-100"
            />
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <span className="block text-[10px] font-bold text-slate-500 mb-0.5">الوصف / التخصص:</span>
              <input
                type="text"
                value={cfg.titleValue}
                disabled={hideAll || !cfg.isShown}
                onChange={(e) => cfg.onTitleChange(e.target.value)}
                placeholder={meta.defaultTitle}
                className="w-full text-[11px] p-1.5 px-2 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-rose-500 disabled:bg-slate-100"
              />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-500 mb-0.5">رقم الترخيص:</span>
              <input
                type="text"
                value={cfg.licenseValue}
                disabled={hideAll || !cfg.isShown}
                onChange={(e) => cfg.onLicenseChange(e.target.value)}
                placeholder="EGY-..."
                dir="ltr"
                className="w-full text-[11px] font-mono p-1.5 px-2 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-rose-500 disabled:bg-slate-100"
              />
            </div>
          </div>

          {/* Handwritten Signature Picker & Preview */}
          <div>
            <span className="block text-[10px] font-bold text-slate-500 mb-0.5 flex items-center gap-1">
              <PenTool className="w-3 h-3 text-rose-700" />
              <span>الإمضاء اليدوية بالتقرير:</span>
            </span>
            <select
              value={cfg.sigKeyValue || 'auto'}
              disabled={hideAll || !cfg.isShown}
              onChange={(e) => cfg.onSigKeyChange(e.target.value as HandwrittenSignatureKey)}
              className="w-full text-[11px] font-medium p-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500 disabled:bg-slate-100"
            >
              {HANDWRITTEN_SIGNATURE_OPTIONS.map(opt => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
            {resolvedPreview && (
              <div className="mt-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1 flex items-center justify-center h-9">
                <img
                  src={resolvedPreview}
                  alt={cfg.nameValue || 'Signature'}
                  className="max-h-7 w-auto object-contain"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5" dir="rtl">
      {/* Header & Master Visibility Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center border border-rose-200">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">
              طاقم الاعتماد والإمضاءات اليدوية بالتقرير (بالعربية بالكامل)
            </h3>
            <p className="text-[11px] text-slate-500">
              تعديل أو إضافة أو حذف أي عامل، وتفعيل القائم بالسحب ومسؤول الزيارة والإمضاءات اليدوية في التقرير
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenAdd('custom')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة عامل جديد</span>
          </button>

          <button
            type="button"
            onClick={() => {
              updateStaffSignatures(signatures);
              setSavedDefaultAlert(true);
              setTimeout(() => setSavedDefaultAlert(false), 4000);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-900 hover:bg-rose-800 text-white shadow-xs transition cursor-pointer"
            title="حفظ وتثبيت هذه الإمضاءات كبيانات افتراضية لكافة التقارير والمعمل"
          >
            <Check className="w-3.5 h-3.5" />
            <span>حفظ كإمضاءات افتراضية</span>
          </button>

          <button
            type="button"
            onClick={handleToggleHideAll}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
              hideAll
                ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                : 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
            }`}
          >
            {hideAll ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-amber-700" />
                <span>الإمضاءات مخفية (اضغط للإظهار)</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-emerald-700" />
                <span>الإمضاءات مفعّلة بالتقرير</span>
              </>
            )}
          </button>
        </div>
      </div>

      {savedDefaultAlert && (
        <div className="p-3 bg-emerald-50 text-emerald-900 rounded-xl text-xs font-bold border border-emerald-300 flex items-center gap-2 animate-in fade-in">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>✅ تم حفظ وتحديث التوقيعات والإمضاءات اليدوية الافتراضية بنجاح واعتمادها لكافة التقارير!</span>
        </div>
      )}

      {/* Primary 3 Core Roles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {renderRoleCard({
          index: 1,
          role: 'chemist',
          isShown: showChemist,
          nameValue: signatures.labChemist || '',
          titleValue: signatures.chemistTitle || '',
          licenseValue: signatures.chemistLicense || '',
          sigKeyValue: signatures.chemistSignatureKey || 'auto',
          accent: 'slate',
          onNameChange: (val) => onChange({ ...signatures, labChemist: val }),
          onTitleChange: (val) => onChange({ ...signatures, chemistTitle: val }),
          onLicenseChange: (val) => onChange({ ...signatures, chemistLicense: val }),
          onSigKeyChange: (val) => onChange({ ...signatures, chemistSignatureKey: val }),
          onClearSlot: () => onChange({ ...signatures, labChemist: '', showChemist: false })
        })}

        {renderRoleCard({
          index: 2,
          role: 'verifier',
          isShown: showVerifier,
          nameValue: signatures.verifiedBy || '',
          titleValue: signatures.verifierTitle || '',
          licenseValue: signatures.verifierLicense || '',
          sigKeyValue: signatures.verifierSignatureKey || 'auto',
          accent: 'blue',
          onNameChange: (val) => onChange({ ...signatures, verifiedBy: val }),
          onTitleChange: (val) => onChange({ ...signatures, verifierTitle: val }),
          onLicenseChange: (val) => onChange({ ...signatures, verifierLicense: val }),
          onSigKeyChange: (val) => onChange({ ...signatures, verifierSignatureKey: val }),
          onClearSlot: () => onChange({ ...signatures, verifiedBy: '', showVerifier: false })
        })}

        {renderRoleCard({
          index: 3,
          role: 'consultant',
          isShown: showPathologist,
          nameValue: signatures.pathologist || '',
          titleValue: signatures.pathologistTitle || '',
          licenseValue: signatures.pathologistLicense || '',
          sigKeyValue: signatures.pathologistSignatureKey || 'auto',
          accent: 'rose',
          onNameChange: (val) => onChange({ ...signatures, pathologist: val }),
          onTitleChange: (val) => onChange({ ...signatures, pathologistTitle: val }),
          onLicenseChange: (val) => onChange({ ...signatures, pathologistLicense: val }),
          onSigKeyChange: (val) => onChange({ ...signatures, pathologistSignatureKey: val }),
          onClearSlot: () => onChange({ ...signatures, pathologist: '', showPathologist: false })
        })}
      </div>

      {/* Phlebotomist & Visit Coordinator Cards (4 & 5) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderRoleCard({
          index: 4,
          role: 'phlebotomist',
          isShown: showPhlebotomist,
          nameValue: signatures.phlebotomist || '',
          titleValue: signatures.phlebotomistTitle || '',
          licenseValue: signatures.phlebotomistLicense || '',
          sigKeyValue: signatures.phlebotomistSignatureKey || 'auto',
          accent: 'emerald',
          onNameChange: (val) => onChange({ ...signatures, phlebotomist: val }),
          onTitleChange: (val) => onChange({ ...signatures, phlebotomistTitle: val }),
          onLicenseChange: (val) => onChange({ ...signatures, phlebotomistLicense: val }),
          onSigKeyChange: (val) => onChange({ ...signatures, phlebotomistSignatureKey: val }),
          onClearSlot: () => onChange({ ...signatures, phlebotomist: '', showPhlebotomist: false })
        })}

        {renderRoleCard({
          index: 5,
          role: 'visit_coordinator',
          isShown: showVisitCoordinator,
          nameValue: signatures.visitCoordinator || '',
          titleValue: signatures.visitCoordinatorTitle || '',
          licenseValue: signatures.visitCoordinatorLicense || '',
          sigKeyValue: signatures.visitCoordinatorSignatureKey || 'auto',
          accent: 'emerald',
          onNameChange: (val) => onChange({ ...signatures, visitCoordinator: val }),
          onTitleChange: (val) => onChange({ ...signatures, visitCoordinatorTitle: val }),
          onLicenseChange: (val) => onChange({ ...signatures, visitCoordinatorLicense: val }),
          onSigKeyChange: (val) => onChange({ ...signatures, visitCoordinatorSignatureKey: val }),
          onClearSlot: () => onChange({ ...signatures, visitCoordinator: '', showVisitCoordinator: false })
        })}
      </div>

      {/* Extra Custom Workers / Signatures on Report */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-rose-800" />
            <div>
              <h4 className="text-xs font-black text-slate-900">
                إضافة / تعديل / حذف أي عامل إضافي بالتقرير ({extraSignatures.length})
              </h4>
              <p className="text-[10px] text-slate-500">
                أضف أي عدد من العاملين أو أزلهم أو عدّل مسمياتهم الوظيفية وإمضاءاتهم مباشرة على هذا التقرير
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(staffSignatureOptions.customWorkers || []).length > 0 && (
              <select
                value=""
                onChange={(e) => {
                  const chosen = (staffSignatureOptions.customWorkers || []).find(w => w.id === e.target.value);
                  if (!chosen) return;
                  const slot: ExtraSignatureSlot = {
                    id: `extra-${Date.now()}`,
                    roleTitle: chosen.customRoleLabel || 'عامل بالمعمل',
                    name: chosen.name,
                    subtitle: chosen.title,
                    license: chosen.license,
                    signatureKey: chosen.signatureKey || 'auto',
                    isActive: true
                  };
                  onChange({
                    ...signatures,
                    extraSignatures: [...extraSignatures, slot]
                  });
                }}
                className="text-[11px] font-bold p-1.5 rounded-lg border border-slate-300 bg-white text-slate-800"
              >
                <option value="">+ إدراج عامل محفوظ من القائمة</option>
                {(staffSignatureOptions.customWorkers || []).map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.customRoleLabel || w.title})
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={handleAddBlankExtraSlot}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-900 hover:bg-rose-800 text-white transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة توقيع عامل للتقرير</span>
            </button>
          </div>
        </div>

        {/* Saved custom workers quick management chips */}
        {(staffSignatureOptions.customWorkers || []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {(staffSignatureOptions.customWorkers || []).map(w => (
              <div
                key={w.id}
                className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px]"
              >
                <span className="font-bold text-slate-800">{w.name}</span>
                <span className="text-slate-500">({w.customRoleLabel || w.title})</span>
                <button
                  type="button"
                  onClick={() => handleOpenEdit('custom', w)}
                  className="p-0.5 text-slate-500 hover:text-blue-700 cursor-pointer"
                  title="تعديل"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteStaff('custom', w)}
                  className="p-0.5 text-slate-500 hover:text-red-700 cursor-pointer"
                  title="حذف من القائمة"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {extraSignatures.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {extraSignatures.map((slot, idx) => {
              const slotPreview = resolveHandwrittenSignatureSrc(slot.name, slot.signatureKey);
              return (
                <div
                  key={slot.id}
                  className={`rounded-xl border p-3 space-y-2 transition ${
                    slot.isActive !== false && !hideAll
                      ? 'bg-white border-slate-300'
                      : 'bg-slate-100/70 border-slate-200 opacity-65'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <label className="flex items-center gap-1.5 text-xs font-black text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={slot.isActive !== false && !hideAll}
                        disabled={hideAll}
                        onChange={(e) => handleUpdateExtraSlot(slot.id, { isActive: e.target.checked })}
                        className="w-3.5 h-3.5 rounded text-rose-700"
                      />
                      <span>عامل إضافي #{idx + 1}</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleDeleteExtraSlot(slot.id)}
                      className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded cursor-pointer"
                      title="حذف هذا التوقيع من التقرير"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-500 mb-0.5">المسمى / الدور:</span>
                      <input
                        type="text"
                        value={slot.roleTitle}
                        onChange={(e) => handleUpdateExtraSlot(slot.id, { roleTitle: e.target.value })}
                        placeholder="مثال: فني سحب / أخصائي"
                        className="w-full text-[11px] font-bold p-1.5 rounded-lg border border-slate-300"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-500 mb-0.5">الاسم بالتقرير:</span>
                      <input
                        type="text"
                        value={slot.name}
                        onChange={(e) => handleUpdateExtraSlot(slot.id, { name: e.target.value })}
                        placeholder="اسم العامل"
                        className="w-full text-[11px] font-bold p-1.5 rounded-lg border border-slate-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-500 mb-0.5">الوصف الوظيفي:</span>
                      <input
                        type="text"
                        value={slot.subtitle || ''}
                        onChange={(e) => handleUpdateExtraSlot(slot.id, { subtitle: e.target.value })}
                        placeholder="اختياري"
                        className="w-full text-[11px] p-1.5 rounded-lg border border-slate-300"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-500 mb-0.5">الإمضاء اليدوية:</span>
                      <select
                        value={slot.signatureKey || 'auto'}
                        onChange={(e) =>
                          handleUpdateExtraSlot(slot.id, {
                            signatureKey: e.target.value as HandwrittenSignatureKey
                          })
                        }
                        className="w-full text-[11px] p-1.5 rounded-lg border border-slate-300 bg-white"
                      >
                        {HANDWRITTEN_SIGNATURE_OPTIONS.map(o => (
                          <option key={o.key} value={o.key}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {slotPreview && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 flex items-center justify-center h-8">
                      <img src={slotPreview} alt={slot.name} className="max-h-6 w-auto object-contain" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal for Adding or Editing Signatory */}
      {(addingRole || editingItem) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-300 shadow-2xl max-w-md w-full p-5 space-y-4 text-right animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-rose-700" />
                <h4 className="font-extrabold text-sm text-slate-900">
                  {editingItem ? 'تعديل بيانات العامل / الموقع' : 'إضافة عامل جديد لقائمة التوقيعات'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAddingRole(null);
                  setEditingItem(null);
                }}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-3.5">
              {(addingRole === 'custom' || editingItem?.role === 'custom') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    المسمى / الدور في التقرير: <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formRoleLabel}
                    onChange={(e) => setFormRoleLabel(e.target.value)}
                    placeholder="مثال: فني المعمل / القائم بالسحب / مسؤول الجودة"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الاسم بالكامل كما يظهر بالتقرير: <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثال: د/ رحاب علي أو أ.د/ رامي مختار"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  المسمى الوظيفي والدرجة العلمية:
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="مثال: أخصائي تحاليل طبية"
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
                  dir="ltr"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الإمضاء اليدوية المرفقة بالتقرير:
                </label>
                <select
                  value={formSignatureKey}
                  onChange={(e) => setFormSignatureKey(e.target.value as HandwrittenSignatureKey)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                >
                  {HANDWRITTEN_SIGNATURE_OPTIONS.map(opt => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {(() => {
                  const preview = resolveHandwrittenSignatureSrc(formName, formSignatureKey);
                  if (!preview) return null;
                  return (
                    <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center h-11">
                      <img src={preview} alt="معاينة التوقيع اليدوي" className="max-h-9 w-auto object-contain" />
                    </div>
                  );
                })()}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setAddingRole(null);
                    setEditingItem(null);
                  }}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
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
