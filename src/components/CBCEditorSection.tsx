/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { TestProfile, TestParameter } from '../types/lab';
import {
  extractCBCData,
  generateCbcRbcSvgChart,
  generateCbcPltSvgChart,
  generateCbcWbcSvgChart
} from '../utils/cbcEngine';
import {
  Microscope,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sliders,
  FileCheck2,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface CBCEditorSectionProps {
  profile: TestProfile;
  onUpdateProfile: (updated: Partial<TestProfile>) => void;
  onUpdateParameters: (updatedParams: TestParameter[]) => void;
}

export const CBCEditorSection: React.FC<CBCEditorSectionProps> = ({
  profile,
  onUpdateProfile,
  onUpdateParameters
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [selectedShapeTags, setSelectedShapeTags] = useState<string[]>([]);

  // Extract quantitative and qualitative morphology indices
  const cbcData = useMemo(() => {
    return extractCBCData(profile.parameters);
  }, [profile.parameters]);

  // Live SVG chart renderings
  const rbcSvg = useMemo(() => {
    return generateCbcRbcSvgChart(cbcData, 380, 190);
  }, [cbcData]);

  const pltSvg = useMemo(() => {
    return generateCbcPltSvgChart(cbcData, 380, 190);
  }, [cbcData]);

  const wbcSvg = useMemo(() => {
    return generateCbcWbcSvgChart(cbcData, 780, 75);
  }, [cbcData]);

  // Helper to update specific parameter by alias keyword
  const updateSingleParam = (keywords: string[], newValue: number | string, decimals?: number) => {
    const updated = profile.parameters.map(p => {
      const name = (p.name || '').toLowerCase().trim();
      const match = keywords.some(kw => name.includes(kw.toLowerCase()));
      if (match) {
        const valStr = typeof newValue === 'number' && decimals !== undefined ? newValue.toFixed(decimals) : String(newValue);
        return { ...p, result: valStr };
      }
      return p;
    });
    onUpdateParameters(updated);
  };

  // Preset clinical patterns
  const handleApplyPreset = (type: 'normal' | 'ida' | 'thal' | 'macro' | 'sickle' | 'infection') => {
    const presets: Record<
      string,
      {
        values: Record<string, string>;
        film: { rbc: string; wbc: string; plt: string; retic?: string };
        interp: string;
      }
    > = {
      normal: {
        values: {
          hemoglobin: '14.2',
          rbc: '4.95',
          hematocrit: '42.5',
          mcv: '86.0',
          mch: '28.7',
          mchc: '33.4',
          rdw: '12.8',
          platelets: '265',
          mpv: '8.8',
          wbc: '6.8',
          neutrophils: '60',
          lymphocytes: '32',
          monocytes: '5',
          eosinophils: '2',
          basophils: '1'
        },
        film: {
          rbc: 'Normocytic normochromic red cells with normal distribution and uniform morphology. No anisopoikilocytosis.',
          wbc: 'Normal total and differential leucocytic count. Mature granulocytes with normal morphology.',
          plt: 'Adequate in number and morphology, well-distributed singly and in small clusters.',
          retic: '0.8 - 1.5 %'
        },
        interp: 'Normal Complete Blood Count (CBC) and physiological hemogram parameters.'
      },
      ida: {
        values: {
          hemoglobin: '8.4',
          rbc: '3.65',
          hematocrit: '26.8',
          mcv: '68.5',
          mch: '21.5',
          mchc: '30.2',
          rdw: '17.8',
          platelets: '440',
          mpv: '8.4',
          wbc: '7.5',
          neutrophils: '64',
          lymphocytes: '28',
          monocytes: '5',
          eosinophils: '2',
          basophils: '1'
        },
        film: {
          rbc: 'Microcytic hypochromic RBCs with marked anisocytosis (RDW 17.8%) and poikilocytosis (occasional pencil/cigar cells and ovalocytes). Mentzer Index > 13.',
          wbc: 'Normal count and morphology.',
          plt: 'Mild reactive thrombocytosis, normal morphology.',
          retic: '0.5 - 1.2 %'
        },
        interp: 'Microcytic hypochromic anemia with high RDW (Mentzer index > 13). Picture highly consistent with Iron Deficiency Anemia (IDA). Recommend Serum Ferritin and Iron studies.'
      },
      thal: {
        values: {
          hemoglobin: '10.8',
          rbc: '5.85',
          hematocrit: '36.5',
          mcv: '62.4',
          mch: '18.5',
          mchc: '31.0',
          rdw: '13.4',
          platelets: '290',
          mpv: '8.6',
          wbc: '6.5',
          neutrophils: '58',
          lymphocytes: '34',
          monocytes: '5',
          eosinophils: '2',
          basophils: '1'
        },
        film: {
          rbc: 'Microcytic hypochromic RBCs with high RBC count relative to Hb. Normal RDW (13.4%) with Target cells and basophilic stippling. Mentzer Index < 13.',
          wbc: 'Normal white blood cell series.',
          plt: 'Adequate number and normal morphology.',
          retic: '1.5 - 2.5 %'
        },
        interp: 'Microcytic hypochromic picture with preserved RBC count and Mentzer index < 13. Highly suggestive of Beta Thalassemia Trait. Recommend Hemoglobin Electrophoresis (HPLC).'
      },
      macro: {
        values: {
          hemoglobin: '8.2',
          rbc: '2.30',
          hematocrit: '25.5',
          mcv: '112.0',
          mch: '35.6',
          mchc: '32.1',
          rdw: '18.5',
          platelets: '135',
          mpv: '10.2',
          wbc: '3.8',
          neutrophils: '52',
          lymphocytes: '40',
          monocytes: '6',
          eosinophils: '2',
          basophils: '0'
        },
        film: {
          rbc: 'Macrocytic red cells (macro-ovalocytes) with marked anisopoikilocytosis and teardrop cells.',
          wbc: 'Mild leukopenia with hypersegmented neutrophils (5-6 lobes).',
          plt: 'Mild thrombocytopenia with some giant platelets.',
          retic: '0.3 - 0.8 %'
        },
        interp: 'Macrocytic anemia with high RDW and hypersegmented neutrophils, strongly suggestive of Megaloblastic Anemia (Vitamin B12 or Folate deficiency).'
      },
      sickle: {
        values: {
          hemoglobin: '7.8',
          rbc: '2.80',
          hematocrit: '23.8',
          mcv: '85.0',
          mch: '27.8',
          mchc: '32.8',
          rdw: '19.2',
          platelets: '420',
          mpv: '9.0',
          wbc: '12.4',
          neutrophils: '68',
          lymphocytes: '24',
          monocytes: '5',
          eosinophils: '2',
          basophils: '1'
        },
        film: {
          rbc: 'Marked anisopoikilocytosis with Sickle cells (drepanocytes), target cells, polychromasia, and nucleated RBCs (NRBCs).',
          wbc: 'Leukocytosis with neutrophilic shift.',
          plt: 'Thrombocytosis with adequate morphology.',
          retic: '4.0 - 8.0 %'
        },
        interp: 'Hemolytic anemia with presence of sickle cells and target cells. Consistent with Sickle Cell Disease / Crisis. Recommend Hb Electrophoresis.'
      },
      infection: {
        values: {
          hemoglobin: '13.5',
          rbc: '4.60',
          hematocrit: '40.0',
          mcv: '87.0',
          mch: '29.3',
          mchc: '33.7',
          rdw: '13.2',
          platelets: '360',
          mpv: '8.9',
          wbc: '17.8',
          neutrophils: '82',
          lymphocytes: '12',
          monocytes: '4',
          eosinophils: '1',
          basophils: '1'
        },
        film: {
          rbc: 'Normocytic normochromic red cells with regular morphology.',
          wbc: 'Marked neutrophilic leukocytosis with shift to left (Band forms present) and toxic granulations.',
          plt: 'Adequate with reactive appearance.',
          retic: '1.0 - 1.8 %'
        },
        interp: 'Leukocytosis with absolute neutrophilia and shift to left, suggestive of acute bacterial infection or systemic inflammatory process.'
      }
    };

    const target = presets[type];
    if (!target) return;

    // Map and update parameters
    const updatedParams = profile.parameters.map(p => {
      const name = (p.name || '').toLowerCase().trim();
      for (const [kw, val] of Object.entries(target.values)) {
        if (name.includes(kw)) {
          return { ...p, result: val };
        }
      }
      return p;
    });

    onUpdateParameters(updatedParams);

    // Update blood film & interpretation
    const existingFilm = profile.bloodFilmFindings || { rbcMorphology: '', wbcMorphology: '', plateletMorphology: '' };
    onUpdateProfile({
      bloodFilmFindings: {
        ...existingFilm,
        rbcMorphology: target.film.rbc,
        wbcMorphology: target.film.wbc,
        plateletMorphology: target.film.plt,
        reticulocytesPercent: target.film.retic || existingFilm.reticulocytesPercent
      },
      interpretation: target.interp
    });
  };

  // Toggle quick shape tag into RBC morphology text
  const handleToggleShapeTag = (tagEn: string, tagAr: string) => {
    const cur = profile.bloodFilmFindings || { rbcMorphology: '', wbcMorphology: '', plateletMorphology: '' };
    const currentRbc = cur.rbcMorphology || '';
    let newRbc = currentRbc;

    if (currentRbc.includes(tagEn)) {
      // Remove
      newRbc = currentRbc.replace(new RegExp(`,?\\s*${tagEn}`, 'g'), '').trim();
    } else {
      // Add
      newRbc = currentRbc ? `${currentRbc}, ${tagEn}` : tagEn;
    }

    onUpdateProfile({
      bloodFilmFindings: {
        ...cur,
        rbcMorphology: newRbc
      }
    });
  };

  const SHAPE_TAGS = [
    { en: 'Target Cells', ar: 'خلايا هدفية' },
    { en: 'Spherocytes', ar: 'خلايا كروية' },
    { en: 'Ovalocytes', ar: 'خلايا بيضاوية' },
    { en: 'Teardrop Cells', ar: 'خلايا دمعية' },
    { en: 'Sickle Cells', ar: 'خلايا منجلية' },
    { en: 'Schistocytes', ar: 'خلايا مجزأة' },
    { en: 'Stomatocytes', ar: 'خلايا فموية' },
    { en: 'Basophilic Stippling', ar: 'تنقيط قعدي' },
    { en: 'Polychromasia', ar: 'تعدد ألوان' },
    { en: 'Howell-Jolly Bodies', ar: 'أجسام هاول جولي' }
  ];

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white rounded-2xl border border-slate-800 shadow-xl overflow-hidden mb-5">
      {/* Top Header Bar */}
      <div className="px-5 py-3.5 bg-gradient-to-r from-red-950 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-red-600 flex items-center justify-center text-white shadow-md shadow-rose-950/40">
            <Microscope className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-white tracking-wide">
                منظومة الرسوم البيانية التفاعلية لـ CBC وفحص حجم وشكل الكرات
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                CBC Histograms & Morphology
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              رسم بياني مباشر لمنحنى حجم كرات الدم الحمراء (MCV/RDW) والصفائح وخلايا الدم البيضاء ومؤشرات التفريق السريري
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>إخفاء المنحنيات</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>عرض المنحنيات ومصفوفة الأشكال</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-5 space-y-5">
          {/* Diagnostic Evaluation & Mentzer / Bessman Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* 1. Size Card */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3">
              <div className="text-[11px] text-slate-400 font-bold mb-1">1. حجم كرات الدم (RBC Size)</div>
              <div className="text-sm font-black" style={{ color: cbcData.sizeColor }}>
                {cbcData.sizeClassification} • {cbcData.sizeClassificationAr}
              </div>
              <div className="text-xs text-slate-300 font-mono mt-1">
                MCV: <strong className="text-white">{cbcData.mcv ? `${cbcData.mcv} fL` : '—'}</strong>
                <span className="text-[10px] text-slate-400 ml-1">(Ref: 80-100)</span>
              </div>
            </div>

            {/* 2. Anisocytosis Card */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3">
              <div className="text-[11px] text-slate-400 font-bold mb-1">2. تجانس الحجم (Anisocytosis / RDW)</div>
              <div className={`text-sm font-black ${cbcData.anisocytosisGrade === 'Normal' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {cbcData.anisocytosisGrade}
              </div>
              <div className="text-xs text-slate-300 font-mono mt-1">
                RDW-CV: <strong className="text-white">{cbcData.rdw ? `${cbcData.rdw}%` : '—'}</strong>
                <span className="text-[10px] text-slate-400 ml-1">(Ref: 11.5-14.5)</span>
              </div>
            </div>

            {/* 3. Chromia Card */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3">
              <div className="text-[11px] text-slate-400 font-bold mb-1">3. محتوى الهيموجلوبين (Chromia)</div>
              <div className="text-sm font-black text-sky-400">
                {cbcData.chromiaClassification}
              </div>
              <div className="text-xs text-slate-300 font-mono mt-1">
                MCH: <strong className="text-white">{cbcData.mch ? `${cbcData.mch} pg` : '—'}</strong> | MCHC: <strong className="text-white">{cbcData.mchc ? `${cbcData.mchc} g/dL` : '—'}</strong>
              </div>
            </div>

            {/* 4. Mentzer & Differential Index */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3">
              <div className="text-[11px] text-slate-400 font-bold mb-1">4. مؤشر منتزر (Mentzer Index)</div>
              <div className="text-sm font-black font-mono text-rose-400">
                {cbcData.mentzerIndex !== null ? cbcData.mentzerIndex : '—'}
              </div>
              <div className="text-[11px] text-slate-300 mt-1">
                {cbcData.mentzerIndex !== null ? (
                  cbcData.mentzerIndex < 13 ? (
                    <span className="text-sky-300 font-bold">&lt; 13 يرجح سمة ثلاسيميا</span>
                  ) : (
                    <span className="text-rose-300 font-bold">&gt; 13 يرجح نقص الحديد</span>
                  )
                ) : (
                  <span className="text-slate-500">يتطلب وجود MCV و RBC</span>
                )}
              </div>
            </div>
          </div>

          {/* Clinical Diagnostic Guidance Banner */}
          <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-3.5 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-extrabold text-amber-300">
                التشخيص التوجيهي للمنحنى (Bessman Classification): <span className="text-white">{cbcData.bessmanCategoryEn}</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                {cbcData.differentialDiagnosisAr}
              </p>
            </div>
          </div>

          {/* Dual Histograms: RBC & PLT SVG Charts */}
          <div className="bg-white rounded-xl p-4 shadow-inner text-slate-900 overflow-x-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div dangerouslySetInnerHTML={{ __html: rbcSvg }} className="flex justify-center" />
              <div dangerouslySetInnerHTML={{ __html: pltSvg }} className="flex justify-center" />
            </div>

            {/* WBC Differential Bar below */}
            <div className="mt-3 pt-3 border-t border-slate-200">
              <div dangerouslySetInnerHTML={{ __html: wbcSvg }} className="flex justify-center" />
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-rose-400" />
                <span>تطبيق أنماط تشخيصية سريعة بضغطة زر واحدة (CBC Clinical Presets):</span>
              </div>
              <span className="text-[11px] text-slate-400">يقوم بضبط الأرقام وفحص الفيلم والتفسير تلقائياً</span>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleApplyPreset('normal')}
                className="px-3 py-1.5 bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60 rounded-lg font-bold transition-all"
              >
                ✓ صورة دم طبيعية تماماً (Normal)
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('ida')}
                className="px-3 py-1.5 bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 rounded-lg font-bold transition-all"
              >
                ⚡ أنيميا نقص الحديد (Microcytic + High RDW)
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('thal')}
                className="px-3 py-1.5 bg-sky-950/50 hover:bg-sky-900/60 text-sky-300 border border-sky-800/60 rounded-lg font-bold transition-all"
              >
                🔬 سمة ثلاسيميا بيتا (Thalassemia Trait - Mentzer &lt; 13)
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('macro')}
                className="px-3 py-1.5 bg-purple-950/50 hover:bg-purple-900/60 text-purple-300 border border-purple-800/60 rounded-lg font-bold transition-all"
              >
                💊 أنيميا الخلايا الضخمة / B12 (Megaloblastic Macrocytic)
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('sickle')}
                className="px-3 py-1.5 bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 border border-amber-800/60 rounded-lg font-bold transition-all"
              >
                🩸 أنيميا الخلايا المنجلية (Sickle Cell Anemia)
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('infection')}
                className="px-3 py-1.5 bg-blue-950/50 hover:bg-blue-900/60 text-blue-300 border border-blue-800/60 rounded-lg font-bold transition-all"
              >
                ⚠️ التهاب حاد وزيادة بيضاء (Leukocytosis / Neutrophilia)
              </button>
            </div>
          </div>

          {/* Quick Shape Clickers (مصفوفة أشكال كرات الدم الحمراء Poikilocytosis) */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-teal-400" />
                <span>إضافة أشكال كرات الدم لشريحة الفحص بنقرة واحدة (Poikilocytosis Tags):</span>
              </span>
              <span className="text-[11px] text-teal-400">تُضاف مباشرةً إلى RBC Morphology</span>
            </div>

            <div className="flex flex-wrap gap-1.5 text-xs">
              {SHAPE_TAGS.map(tag => {
                const isSelected = (profile.bloodFilmFindings?.rbcMorphology || '').includes(tag.en);
                return (
                  <button
                    key={tag.en}
                    type="button"
                    onClick={() => handleToggleShapeTag(tag.en, tag.ar)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1 border ${
                      isSelected
                        ? 'bg-rose-900/70 border-rose-600 text-rose-100 shadow-xs'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <span>{isSelected ? '✓' : '+'}</span>
                    <span>{tag.en}</span>
                    <span className="text-[10px] text-slate-400">({tag.ar})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
