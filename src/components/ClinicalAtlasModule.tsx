import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DISEASE_ILLUSTRATIONS } from '../data/diseaseIllustrations';
import { DiseaseIllustration } from '../types/lab';
import { ClinicalAtlasImage } from './ClinicalAtlasImage';
import {
  Microscope,
  Search,
  BookOpen,
  Droplets,
  Activity,
  HeartPulse,
  Flame,
  TestTube,
  ShieldCheck,
  Stethoscope,
  Layers,
  FileCheck2,
  Check,
  Eye,
  Sparkles,
  Download,
  Info
} from 'lucide-react';

type AtlasCategory =
  | 'all'
  | 'hematology'
  | 'microscopy'
  | 'endocrinology'
  | 'cardiac'
  | 'hepatic'
  | 'renal'
  | 'immunology'
  | 'infectious';

export const ClinicalAtlasModule: React.FC = () => {
  const { selectedReport, updateReport, setActiveTab } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<AtlasCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeItem, setActiveItem] = useState<DiseaseIllustration>(DISEASE_ILLUSTRATIONS[0]);
  const [attachFeedback, setAttachFeedback] = useState<string | null>(null);

  const categories = [
    { id: 'all', labelAr: 'كافة الأقسام', icon: Layers, count: DISEASE_ILLUSTRATIONS.length },
    {
      id: 'hematology',
      labelAr: 'أمراض الدم وفحص الشريحة (CBC)',
      icon: Droplets,
      color: 'text-rose-500',
      count: DISEASE_ILLUSTRATIONS.filter(i => i.category === 'hematology').length
    },
    {
      id: 'microscopy',
      labelAr: 'أطلس البول والبراز المجهري (Urine & Stool)',
      icon: Microscope,
      color: 'text-cyan-500',
      count: DISEASE_ILLUSTRATIONS.filter(i => i.category === 'microscopy' || i.category === 'parasitology').length
    },
    {
      id: 'endocrinology',
      labelAr: 'السكر والغدد الصماء (Endocrine)',
      icon: Activity,
      color: 'text-sky-500',
      count: DISEASE_ILLUSTRATIONS.filter(i => i.category === 'endocrinology').length
    },
    {
      id: 'cardiac',
      labelAr: 'القلب والسيولة والتجلط (Cardiac & Coag)',
      icon: HeartPulse,
      color: 'text-red-500',
      count: DISEASE_ILLUSTRATIONS.filter(i => i.category === 'cardiac' || i.category === 'coagulation').length
    },
    {
      id: 'hepatic',
      labelAr: 'الكبد والجهاز الهضمي (Hepatic)',
      icon: Flame,
      color: 'text-emerald-500',
      count: DISEASE_ILLUSTRATIONS.filter(i => i.category === 'hepatic').length
    },
    {
      id: 'renal',
      labelAr: 'الكلى والمسالك البولية (Renal)',
      icon: TestTube,
      color: 'text-indigo-500',
      count: DISEASE_ILLUSTRATIONS.filter(i => i.category === 'renal').length
    },
    {
      id: 'immunology',
      labelAr: 'المناعة والروماتيزم (Autoimmune)',
      icon: ShieldCheck,
      color: 'text-purple-500',
      count: DISEASE_ILLUSTRATIONS.filter(i => i.category === 'immunology').length
    },
    {
      id: 'infectious',
      labelAr: 'الأمراض الصدرية والمعدية (Infectious)',
      icon: Stethoscope,
      color: 'text-amber-500',
      count: DISEASE_ILLUSTRATIONS.filter(i => i.category === 'infectious').length
    }
  ];

  const filteredItems = DISEASE_ILLUSTRATIONS.filter(item => {
    let matchesCategory = true;
    if (selectedCategory === 'all') {
      matchesCategory = true;
    } else if (selectedCategory === 'microscopy') {
      matchesCategory = item.category === 'microscopy' || item.category === 'parasitology';
    } else if (selectedCategory === 'cardiac') {
      matchesCategory = item.category === 'cardiac' || item.category === 'coagulation';
    } else {
      matchesCategory = item.category === selectedCategory;
    }

    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesCategory;

    const matchesSearch =
      item.titleAr.toLowerCase().includes(q) ||
      item.titleEn.toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q) ||
      item.pathologySummaryAr.toLowerCase().includes(q) ||
      (item.keyDiagnosticPoints && item.keyDiagnosticPoints.some(p => p.toLowerCase().includes(q))) ||
      (item.associatedConditions && item.associatedConditions.some(c => c.toLowerCase().includes(q)));

    return matchesCategory && matchesSearch;
  });

  const handleAttachToCurrentReport = (illustration: DiseaseIllustration) => {
    if (!selectedReport) {
      alert('يرجى اختيار مريض أو فتح تقرير أولاً من قائمة العمل لإرفاق الرسم به.');
      return;
    }
    // Attach to first profile or match category
    const matchingProfile =
      selectedReport.profiles.find(p => p.category.toLowerCase().includes(illustration.category.toLowerCase())) ||
      selectedReport.profiles[0];

    if (!matchingProfile) {
      alert('لا توجد ملفات تحاليل في التقرير الحالي لإرفاق الرسم بها.');
      return;
    }

    const updatedProfiles = selectedReport.profiles.map(p =>
      p.id === matchingProfile.id ? { ...p, attachedIllustration: illustration } : p
    );

    updateReport(selectedReport.id, { profiles: updatedProfiles });
    setAttachFeedback(`تم بنجاح إرفاق الرسم بالتقرير الحالي (${selectedReport.patient.fullName} - ${matchingProfile.titleAr})`);
    setTimeout(() => setAttachFeedback(null), 4000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200" dir="rtl">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 border border-rose-900/40 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-600 to-rose-900 border-2 border-rose-400/30 flex items-center justify-center text-white shadow-lg shadow-rose-900/50">
            <Microscope className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-wide">
                أطلس الفحص المجهري والرسومات السريرية التوضيحية
              </h1>
              <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-rose-600/80 text-white border border-rose-400/40">
                RT Clinical Atlas HD
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              مرجع سريري ورقمي شامل لشرائح الدم المحيطي (Blood Film)، رواسب الفحص المجهري للبول والبراز، والإنفوجرامات الباثولوجية المعتمدة لتوثيق تقارير المرضى وفق أعلى معايير الجودة الدولية.
            </p>
          </div>
        </div>

        {selectedReport && (
          <div className="bg-slate-950/70 border border-rose-800/50 rounded-2xl p-3 text-xs flex items-center gap-3">
            <div>
              <span className="text-[10px] text-slate-400 block">التقرير المفتوح حالياً:</span>
              <span className="font-bold text-rose-300">{selectedReport.patient.fullName}</span>
              <span className="text-[10px] text-slate-400 block font-mono">#{selectedReport.patient.labNumber}</span>
            </div>
            <button
              onClick={() => setActiveTab('diagnostic_editor')}
              className="px-3 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>العودة لإدخال النتائج</span>
            </button>
          </div>
        )}
      </div>

      {attachFeedback && (
        <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{attachFeedback}</span>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        {/* Category Pill Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          {categories.map(cat => {
            const isActive = selectedCategory === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as AtlasCategory)}
                className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer select-none ${
                  isActive
                    ? 'bg-rose-900 text-white shadow-md shadow-rose-900/20'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-rose-200' : cat.color || 'text-slate-500'}`} />
                <span>{cat.labelAr}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-white/20' : 'bg-slate-200 text-slate-600'}`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="بحث في الأطلس باسم الشريحة، نوع الخلية، البلورات، أو التشخيص السريري..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-600 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Main Content Layout: Grid of items + Detailed Inspector Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Cards Grid (7 columns) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[85vh] overflow-y-auto pr-1">
          {filteredItems.map(item => {
            const isActive = activeItem.id === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setActiveItem(item)}
                className={`bg-white rounded-2xl border transition-all p-3 cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between group relative ${
                  isActive
                    ? 'border-rose-600 ring-2 ring-rose-500/30 bg-rose-50/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Visual Smear Card */}
                <div className="w-full h-36 rounded-xl overflow-hidden mb-2.5 bg-slate-950 border border-slate-800 relative">
                  <ClinicalAtlasImage
                    illustration={item}
                    className="w-full h-full"
                    allowZoom={false}
                    showReticle={true}
                    magnification="1000X"
                  />
                  <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-rose-300 text-[9px] font-mono px-1.5 py-0.5 rounded border border-rose-500/30">
                    {item.code}
                  </span>
                </div>

                {/* Details */}
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-rose-900 transition line-clamp-1">
                    {item.titleAr}
                  </h3>
                  <div className="text-[11px] text-slate-500 font-mono line-clamp-1" dir="ltr">
                    {item.titleEn}
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                    {item.pathologySummaryAr}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="bg-slate-100 px-2 py-0.5 rounded font-mono">
                    {item.category.toUpperCase()}
                  </span>
                  <span className="text-rose-700 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>عرض التفاصيل</span>
                    <span>←</span>
                  </span>
                </div>
              </div>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="col-span-2 bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
              <Microscope className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
              <p className="font-bold text-sm">لم يتم العثور على نتائج تطابق البحث</p>
              <p className="text-xs text-slate-400 mt-1">جرب البحث بكلمات أخرى أو اختر قسماً مختلفاً من الأعلى.</p>
            </div>
          )}
        </div>

        {/* Right Side: Detailed Clinical Inspector (5 columns) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-lg p-5 space-y-4 sticky top-24">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-900 border border-rose-200">
                {activeItem.code}
              </span>
              <h2 className="text-base font-black text-slate-900 mt-1.5 leading-snug">
                {activeItem.titleAr}
              </h2>
              <div className="text-xs text-slate-500 font-mono mt-0.5" dir="ltr">
                {activeItem.titleEn}
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 font-mono text-slate-700 font-bold shrink-0">
              {activeItem.category.toUpperCase()}
            </span>
          </div>

          {/* High-Resolution Interactive Viewer */}
          <div className="w-full">
            <ClinicalAtlasImage
              illustration={activeItem}
              className="w-full h-56 rounded-2xl border-2 border-rose-900/50"
              showReticle={true}
              magnification="1000X Oil Immersion"
              allowZoom={true}
            />
          </div>

          {/* Microscopic Description */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs leading-relaxed">
            <span className="font-bold text-rose-950 block mb-1">الوصف المجهري الإكلينيكي الدقيق:</span>
            <p className="text-slate-700">{activeItem.pathologySummaryAr}</p>
          </div>

          {/* Diagnostic Criteria */}
          {activeItem.keyDiagnosticPoints && activeItem.keyDiagnosticPoints.length > 0 && (
            <div className="space-y-1.5 text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>المعايير المخبرية والتشخيصية (Diagnostic Criteria):</span>
              </span>
              <ul className="space-y-1 text-slate-700">
                {activeItem.keyDiagnosticPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="w-4 h-4 rounded-full bg-rose-900 text-white flex items-center justify-center text-[10px] shrink-0 font-bold">
                      {idx + 1}
                    </span>
                    <span className="font-mono text-[11px] leading-tight">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Associated Conditions */}
          {activeItem.associatedConditions && (
            <div className="text-xs">
              <span className="font-bold text-slate-700 block mb-1">الحالات الإكلينيكية المصاحبة:</span>
              <div className="flex flex-wrap gap-1.5">
                {activeItem.associatedConditions.map((cond, i) => (
                  <span key={i} className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                    {cond}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => handleAttachToCurrentReport(activeItem)}
              className="flex-1 py-2.5 px-4 rounded-xl bg-rose-900 hover:bg-rose-800 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>إرفاق بالتقرير المفتوح حالياً</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
