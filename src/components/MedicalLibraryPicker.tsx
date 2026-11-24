import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Sparkles,
  CheckCircle2,
  Plus,
  Search,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Stethoscope
} from 'lucide-react';
import type { Patient, TestProfile } from '../types';
import {
  MEDICAL_INTERPRETATION_LIBRARY,
  MedicalLibraryEntry,
  evaluateAnemiaSeverity,
  evaluateCbcSuggestions,
  formatLibraryApplication,
  getLibraryEntriesForProfile
} from '../data/medicalInterpretationLibrary';
import { isCBCProfile } from '../utils/cbcEngine';

interface MedicalLibraryPickerProps {
  profile: TestProfile;
  patient?: Partial<Patient>;
  onApply: (updates: Partial<TestProfile>) => void;
  variant?: 'light' | 'dark';
}

export const MedicalLibraryPicker: React.FC<MedicalLibraryPickerProps> = ({
  profile,
  patient,
  onApply,
  variant = 'light'
}) => {
  const isCbc = isCBCProfile(profile);
  const [isOpen, setIsOpen] = useState<boolean>(isCbc);
  const [showAllCatalog, setShowAllCatalog] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEntryId, setSelectedEntryId] = useState<string>('');
  const [appliedBanner, setAppliedBanner] = useState<string>('');

  const { primary, others } = useMemo(
    () => getLibraryEntriesForProfile(profile.profileCode, profile.titleEn, profile.titleAr),
    [profile.profileCode, profile.titleEn, profile.titleAr]
  );

  const cbcSuggestions = useMemo(
    () => (isCbc ? evaluateCbcSuggestions(profile.parameters || [], patient) : []),
    [isCbc, profile.parameters, patient]
  );

  const anemiaEval = useMemo(
    () => (isCbc ? evaluateAnemiaSeverity(profile.parameters || [], patient?.gender) : null),
    [isCbc, profile.parameters, patient?.gender]
  );

  const availableEntries = useMemo(() => {
    const baseList = showAllCatalog || primary.length === 0 ? MEDICAL_INTERPRETATION_LIBRARY : primary;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return baseList;
    return MEDICAL_INTERPRETATION_LIBRARY.filter(e =>
      e.conditionEn.toLowerCase().includes(q) ||
      e.conditionAr.toLowerCase().includes(q) ||
      e.sectionEn.toLowerCase().includes(q) ||
      e.sectionAr.toLowerCase().includes(q) ||
      e.suggestedComment.toLowerCase().includes(q) ||
      e.typicalPattern.toLowerCase().includes(q) ||
      e.recommendedInvestigations.some(r => r.toLowerCase().includes(q))
    );
  }, [showAllCatalog, primary, searchQuery]);

  const activeEntry: MedicalLibraryEntry | undefined = useMemo(() => {
    if (selectedEntryId) {
      return MEDICAL_INTERPRETATION_LIBRARY.find(e => e.id === selectedEntryId);
    }
    if (cbcSuggestions.length > 0) {
      return cbcSuggestions[0].entry;
    }
    return availableEntries[0] || primary[0] || MEDICAL_INTERPRETATION_LIBRARY[0];
  }, [selectedEntryId, cbcSuggestions, availableEntries, primary]);

  const handleApplyEntry = (entry: MedicalLibraryEntry, mode: 'replace' | 'append') => {
    const formatted = formatLibraryApplication(entry, profile, mode);
    const updates: Partial<TestProfile> = {
      interpretation: formatted.interpretation,
      interpretations: [formatted.interpretation],
      comment: formatted.comment,
      comments: [formatted.comment],
      recommendedTests: formatted.recommendedTests
    };

    if (entry.bloodFilmSuggestion && isCbc) {
      const existingFilm = profile.bloodFilmFindings || {
        rbcMorphology: '',
        wbcMorphology: '',
        plateletMorphology: ''
      };
      updates.bloodFilmFindings = {
        ...existingFilm,
        rbcMorphology: entry.id.includes('leukocytosis')
          ? existingFilm.rbcMorphology
          : entry.bloodFilmSuggestion,
        wbcMorphology: entry.id.includes('leukocytosis')
          ? entry.bloodFilmSuggestion
          : existingFilm.wbcMorphology
      };
    }

    onApply(updates);
    setSelectedEntryId(entry.id);
    setAppliedBanner(
      `✓ تم اعتماد التشخيص (${entry.conditionAr}) وإضافة ${entry.recommendedInvestigations.length} توصية متابعة`
    );
    setTimeout(() => setAppliedBanner(''), 4000);
  };

  const isDark = variant === 'dark';

  return (
    <div
      className={`rounded-xl border transition-all ${
        isDark
          ? 'bg-slate-900/90 border-indigo-700/60 text-slate-100'
          : 'bg-gradient-to-br from-indigo-50/80 via-white to-rose-50/50 border-indigo-200 text-slate-900'
      }`}
    >
      {/* Header */}
      <div
        className={`px-4 py-3 flex flex-wrap items-center justify-between gap-2 ${
          isOpen ? (isDark ? 'border-b border-slate-700/80' : 'border-b border-indigo-100') : ''
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-rose-700 text-white flex items-center justify-center shrink-0 shadow-xs">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-extrabold ${isDark ? 'text-white' : 'text-indigo-950'}`}>
                المكتبة الطبية المعتمدة للتشخيص والتوصيات (RT LAB Medical Library)
              </span>
              {primary.length > 0 && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-800'
                  }`}
                >
                  {primary.length} حالة مرتبطة بهذا البروفايل
                </span>
              )}
              {cbcSuggestions.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                  ⚡ {cbcSuggestions.length} تشخيص مقترح تلقائياً للنتائج
                </span>
              )}
            </div>
            <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              اختر التشخيص المناسب لإدراج التعليق الطبي المعتمد + التحاليل المقترحة للتشخيص تلقائياً في التقرير
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-colors ${
            isDark
              ? 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-200'
              : 'bg-white hover:bg-indigo-50 border-indigo-200 text-indigo-900'
          }`}
        >
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>{isOpen ? 'طي المكتبة' : 'فتح المكتبة الطبية والاختيار'}</span>
        </button>
      </div>

      {isOpen && (
        <div className="p-4 space-y-3.5">
          {/* Live CBC Anemia & Left Shift Assessment Bar */}
          {isCbc && anemiaEval && (
            <div
              className={`rounded-lg p-3 border flex flex-wrap items-center justify-between gap-2 text-xs ${
                isDark
                  ? 'bg-slate-800/80 border-slate-700'
                  : 'bg-slate-900 text-white border-slate-800'
              }`}
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1.5 font-extrabold text-amber-300">
                  <Stethoscope className="w-4 h-4" />
                  <span>التصنيف السريري الآلي لصورة الدم:</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-white/10 font-bold">
                  الشدة: {anemiaEval.severityAr}
                </span>
                {anemiaEval.mcvClass !== 'Unknown' && (
                  <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-200 font-bold">
                    الحجم: {anemiaEval.mcvClass}
                  </span>
                )}
                {anemiaEval.mentzerIndex !== null && (
                  <span
                    className={`px-2 py-0.5 rounded font-bold ${
                      anemiaEval.mentzerIndex < 13
                        ? 'bg-cyan-500/20 text-cyan-200'
                        : 'bg-rose-500/20 text-rose-200'
                    }`}
                  >
                    Mentzer: {anemiaEval.mentzerIndex}
                  </span>
                )}
                {anemiaEval.bandCells !== null && (
                  <span
                    className={`px-2 py-0.5 rounded font-bold ${
                      anemiaEval.isLeftShift
                        ? 'bg-red-500/30 text-red-200 border border-red-400/50'
                        : 'bg-emerald-500/20 text-emerald-200'
                    }`}
                  >
                    Band Cells: {anemiaEval.bandCells}% {anemiaEval.isLeftShift ? '⚠ Left Shift' : '✓ طبيعي'}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Automated CBC Suggestions Chips */}
          {isCbc && cbcSuggestions.length > 0 && (
            <div className="space-y-1.5">
              <div
                className={`text-[11px] font-extrabold flex items-center gap-1.5 ${
                  isDark ? 'text-amber-300' : 'text-amber-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>الاحتمالات التشخيصية المقترحة بناءً على نتائج المريض المدخلة (اضغط للاختيار):</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {cbcSuggestions.map(s => {
                  const isSel = activeEntry?.id === s.entry.id;
                  return (
                    <button
                      key={s.entry.id}
                      type="button"
                      onClick={() => setSelectedEntryId(s.entry.id)}
                      className={`text-right px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSel
                          ? 'bg-rose-700 text-white border-rose-600 shadow-xs'
                          : isDark
                            ? 'bg-slate-800 hover:bg-slate-700 text-amber-200 border-amber-500/40'
                            : 'bg-amber-50 hover:bg-amber-100 text-amber-950 border-amber-300'
                      }`}
                    >
                      <span>{s.confidence === 'High' ? '★' : '•'}</span>
                      <span>{s.entry.conditionAr}</span>
                      <span className="opacity-75 text-[10px]">({s.reasonsAr[0]})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dropdown & Search Bar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
            <div className="md:col-span-7">
              <label className={`block text-[11px] font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                اختيار الحالة الطبية من المكتبة (الأمراض الشائعة والأنيميا):
              </label>
              <select
                value={activeEntry?.id || ''}
                onChange={(e) => setSelectedEntryId(e.target.value)}
                className={`w-full text-xs font-bold rounded-lg p-2.5 border focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 border-slate-600 text-white'
                    : 'bg-white border-indigo-300 text-slate-900'
                }`}
              >
                {cbcSuggestions.length > 0 && (
                  <optgroup label="★ مقترح تلقائياً حسب نتائج CBC">
                    {cbcSuggestions.map(s => (
                      <option key={`sug-${s.entry.id}`} value={s.entry.id}>
                        ★ {s.entry.conditionAr} — {s.entry.conditionEn}
                      </option>
                    ))}
                  </optgroup>
                )}
                {primary.length > 0 && (
                  <optgroup label={`📋 الحالات المرتبطة بالبروفايل (${primary.length})`}>
                    {primary.map(e => (
                      <option key={`pri-${e.id}`} value={e.id}>
                        [{e.sectionNumber}] {e.conditionAr} — {e.conditionEn}
                      </option>
                    ))}
                  </optgroup>
                )}
                {(showAllCatalog || primary.length === 0) && others.length > 0 && (
                  <optgroup label={`📚 باقي أقسام المكتبة الطبية (${others.length})`}>
                    {others.map(e => (
                      <option key={`oth-${e.id}`} value={e.id}>
                        [{e.sectionNumber}] {e.conditionAr} — {e.conditionEn}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <div className="md:col-span-3">
              <label className={`block text-[11px] font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                بحث سريع داخل المكتبة:
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value.trim()) setShowAllCatalog(true);
                  }}
                  placeholder="مثال: Ferritin, Thalassemia, TSH..."
                  className={`w-full text-xs pr-8 pl-2.5 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isDark
                      ? 'bg-slate-800 border-slate-600 text-white placeholder:text-slate-500'
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <button
                type="button"
                onClick={() => setShowAllCatalog(prev => !prev)}
                className={`w-full py-2.5 px-2.5 rounded-lg text-[11px] font-bold border cursor-pointer transition-colors ${
                  showAllCatalog
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : isDark
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                {showAllCatalog ? 'إظهار المرتبط فقط' : `كل المكتبة (${MEDICAL_INTERPRETATION_LIBRARY.length})`}
              </button>
            </div>
          </div>

          {/* Search Matches Strip if user searched */}
          {searchQuery.trim() && (
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 rounded-lg border border-dashed border-indigo-400/50">
              {availableEntries.length > 0 ? (
                availableEntries.map(e => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => setSelectedEntryId(e.id)}
                    className={`text-[11px] px-2.5 py-1 rounded-md border font-bold cursor-pointer ${
                      activeEntry?.id === e.id
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : isDark
                          ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                          : 'bg-white text-slate-800 border-slate-300 hover:bg-indigo-50'
                    }`}
                  >
                    {e.conditionAr}
                  </button>
                ))
              ) : (
                <span className="text-[11px] text-slate-400">لا توجد نتائج مطابقة للبحث.</span>
              )}
            </div>
          )}

          {/* Selected Entry Preview & 1-Click Apply */}
          {activeEntry && (
            <div
              className={`rounded-xl p-3.5 border space-y-2.5 ${
                isDark ? 'bg-slate-950/70 border-slate-700' : 'bg-white border-indigo-200 shadow-xs'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-600 text-white">
                      {activeEntry.source === 'anemia_guide' ? 'دليل الأنيميا' : 'الأمراض الشائعة'} • {activeEntry.sectionNumber}
                    </span>
                    <h4 className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {activeEntry.conditionAr} — <span className="text-rose-600 dark:text-rose-400">{activeEntry.conditionEn}</span>
                    </h4>
                    {activeEntry.isCriticalEscalation && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-red-600 text-white">
                        <AlertTriangle className="w-3 h-3" /> يستدعي تواصل وتبليغ عاجل
                      </span>
                    )}
                  </div>
                  <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} dir="ltr">
                    <strong>Typical pattern:</strong> {activeEntry.typicalPattern}
                  </p>
                </div>
              </div>

              <div
                className={`p-2.5 rounded-lg border text-[11px] leading-relaxed ${
                  isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-rose-50/70 border-rose-200 text-slate-800'
                }`}
                dir="ltr"
              >
                <div className="font-extrabold text-rose-700 dark:text-rose-300 mb-0.5">
                  Suggested Laboratory Comment:
                </div>
                <div>{activeEntry.suggestedComment}</div>
                {activeEntry.interpretiveNote && (
                  <div className="mt-1 text-[10.5px] opacity-85 italic">
                    <strong>Interpretive note:</strong> {activeEntry.interpretiveNote}
                  </div>
                )}
              </div>

              <div className="space-y-1" dir="ltr">
                <div className={`text-[11px] font-extrabold ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>
                  Recommended Follow-Up Tests / Correlations ({activeEntry.recommendedInvestigations.length}):
                </div>
                <ul className={`list-disc list-inside text-[11px] space-y-0.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {activeEntry.recommendedInvestigations.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/20">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyEntry(activeEntry, 'replace')}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-rose-700 to-indigo-700 hover:from-rose-600 hover:to-indigo-600 text-white text-xs font-extrabold shadow-sm cursor-pointer transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>اعتماد الكومنت + التحاليل المقترحة في التقرير</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyEntry(activeEntry, 'append')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border cursor-pointer transition-all ${
                      isDark
                        ? 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-200'
                        : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ إضافة على التعليقات والتحاليل الحالية</span>
                  </button>
                </div>

                {appliedBanner && (
                  <span className="text-[11px] font-bold text-emerald-500">{appliedBanner}</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
