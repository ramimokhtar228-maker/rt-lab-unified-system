import React, { useState, useMemo } from 'react';
import { ComprehensivePackage, CatalogProfileTemplate, IndividualTest, InvoiceTestItem } from '../types/lab';
import { 
  Search, 
  Sparkles, 
  Package, 
  Layers, 
  FlaskConical, 
  Check, 
  Plus, 
  X, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  Tag,
  SlidersHorizontal,
  Flame,
  Filter
} from 'lucide-react';

export type SearchItemType = 'all' | 'packages' | 'profiles' | 'individual';

export interface UnifiedSearchItem {
  id: string;
  kind: 'package' | 'profile' | 'individual';
  code: string;
  nameAr: string;
  nameEn: string;
  category: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  sampleType: string;
  turnaroundTime?: string;
  fastingInstructions?: string;
  unit?: string;
  textReference?: string;
  minNormal?: number;
  maxNormal?: number;
  includedProfilesCount?: number;
  includedIndividualCount?: number;
  includedProfileNames?: string[];
  includedIndividualNames?: string[];
  isPopular?: boolean;
  rawPackage?: ComprehensivePackage;
  rawProfile?: CatalogProfileTemplate;
  rawTest?: IndividualTest;
}

interface SmartTestSearchProps {
  packages: ComprehensivePackage[];
  profiles: CatalogProfileTemplate[];
  individualTests: IndividualTest[];
  selectedItemCodes: string[];
  onToggleTest: (test: InvoiceTestItem) => void;
  onSelectPackage?: (pkg: ComprehensivePackage) => void;
  onToggleProfile?: (profile: CatalogProfileTemplate) => void;
  placeholder?: string;
  compact?: boolean;
}

// Arabic normalization helper for smart search
const normalizeArabic = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, ''); // Remove tashkeel/diacritics
};

export const SmartTestSearch: React.FC<SmartTestSearchProps> = ({
  packages,
  profiles,
  individualTests,
  selectedItemCodes,
  onToggleTest,
  onSelectPackage,
  onToggleProfile,
  placeholder = "ابحث بالاسم العربي، الإنجليزي، الكود أو الأعراض (مثال: CBC, سكر, كبد, نقرس, فيتامين د)...",
  compact = false
}) => {
  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState<SearchItemType>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedPackageId, setExpandedPackageId] = useState<string | null>(null);
  const [expandedProfileCode, setExpandedProfileCode] = useState<string | null>(null);

  // Convert all items into unified searchable items
  const allItems: UnifiedSearchItem[] = useMemo(() => {
    const list: UnifiedSearchItem[] = [];

    // 1. Packages
    packages.forEach(pkg => {
      // Find names of included profiles & tests for deep search
      const profNames = pkg.includedProfiles.map(pCode => {
        const found = profiles.find(p => p.code.toLowerCase() === pCode.toLowerCase());
        return found ? `${found.titleAr} (${found.code})` : pCode;
      });
      const indNames = pkg.includedIndividualTestCodes.map(tCode => {
        const found = individualTests.find(t => t.code.toLowerCase() === tCode.toLowerCase());
        return found ? `${found.nameAr} (${found.code})` : tCode;
      });

      list.push({
        id: pkg.id,
        kind: 'package',
        code: pkg.code,
        nameAr: pkg.titleAr,
        nameEn: pkg.titleEn,
        category: 'باقات الفحص الشامل',
        price: pkg.packagePrice,
        originalPrice: pkg.originalPrice,
        discountPercentage: pkg.discountPercentage,
        sampleType: pkg.sampleTypes.join(', '),
        turnaroundTime: 'خلال 4-24 ساعة',
        fastingInstructions: pkg.fastingRequired,
        includedProfilesCount: pkg.includedProfiles.length,
        includedIndividualCount: pkg.includedIndividualTestCodes.length,
        includedProfileNames: profNames,
        includedIndividualNames: indNames,
        isPopular: pkg.isPopular,
        rawPackage: pkg
      });
    });

    // 2. Complete Profiles
    profiles.forEach(prof => {
      const paramNames = prof.parameters.map(p => p.name).join(', ');
      list.push({
        id: `prof-${prof.code}`,
        kind: 'profile',
        code: prof.code,
        nameAr: prof.titleAr,
        nameEn: prof.titleEn,
        category: prof.category,
        price: prof.profilePrice || 250,
        sampleType: prof.sampleType,
        turnaroundTime: 'خلال ساعتين إلى يوم',
        fastingInstructions: prof.code === 'GLYCEMIC' || prof.code === 'LIPID' ? 'صيام 10-12 ساعة' : 'لا يشترط صيام',
        includedProfilesCount: 1,
        includedIndividualCount: prof.parameters.length,
        includedIndividualNames: prof.parameters.map(p => `${p.name} (${p.unit})`),
        textReference: `يشمل ${prof.parameters.length} تحليلاً ومعاملاً مخبرياً متكاملاً (${paramNames.slice(0, 80)}...)`,
        rawProfile: prof
      });
    });

    // 3. Individual Tests
    individualTests.forEach(test => {
      list.push({
        id: test.id || `test-${test.code}`,
        kind: 'individual',
        code: test.code,
        nameAr: test.nameAr,
        nameEn: test.nameEn,
        category: test.category,
        price: test.price,
        sampleType: test.sampleType,
        turnaroundTime: test.turnaroundTime || 'خلال ساعتين',
        fastingInstructions: test.fastingInstructions || 'لا يشترط صيام',
        unit: test.unit,
        textReference: test.textReference,
        minNormal: test.minNormal,
        maxNormal: test.maxNormal,
        rawTest: test
      });
    });

    return list;
  }, [packages, profiles, individualTests]);

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    allItems.forEach(item => {
      if (item.category) cats.add(item.category);
    });
    return Array.from(cats);
  }, [allItems]);

  // Filtering based on Query, Type and Category
  const filteredItems = useMemo(() => {
    let result = allItems;

    // Filter by type
    if (activeType === 'packages') {
      result = result.filter(i => i.kind === 'package');
    } else if (activeType === 'profiles') {
      result = result.filter(i => i.kind === 'profile');
    } else if (activeType === 'individual') {
      result = result.filter(i => i.kind === 'individual');
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter(i => i.category === selectedCategory);
    }

    // Filter by query (smart fuzzy match)
    if (query.trim()) {
      const qNorm = normalizeArabic(query.trim());
      const qWords = qNorm.split(/\s+/).filter(Boolean);

      result = result.filter(item => {
        const arNorm = normalizeArabic(item.nameAr || '');
        const enNorm = (item.nameEn || '').toLowerCase();
        const codeNorm = (item.code || '').toLowerCase();
        const catNorm = normalizeArabic(item.category || '');
        const deepProfiles = (item.includedProfileNames || []).map(normalizeArabic).join(' ');
        const deepTests = (item.includedIndividualNames || []).map(normalizeArabic).join(' ');

        // Check if all words in query match somewhere
        return qWords.every(word => 
          arNorm.includes(word) ||
          enNorm.includes(word) ||
          codeNorm.includes(word) ||
          catNorm.includes(word) ||
          deepProfiles.includes(word) ||
          deepTests.includes(word)
        );
      });
    }

    return result;
  }, [allItems, activeType, selectedCategory, query]);

  // Handle click on item
  const handleItemClick = (item: UnifiedSearchItem) => {
    if (item.kind === 'package' && item.rawPackage && onSelectPackage) {
      onSelectPackage(item.rawPackage);
    } else if (item.kind === 'profile' && item.rawProfile && onToggleProfile) {
      onToggleProfile(item.rawProfile);
    } else if (item.kind === 'individual' && item.rawTest) {
      onToggleTest({
        id: item.rawTest.id,
        code: item.rawTest.code,
        nameAr: item.rawTest.nameAr,
        nameEn: item.rawTest.nameEn,
        category: item.rawTest.category,
        price: item.rawTest.price,
        cost: item.rawTest.cost,
        sampleType: item.rawTest.sampleType,
        turnaroundTime: item.rawTest.turnaroundTime,
        unit: item.rawTest.unit,
        minNormal: item.rawTest.minNormal,
        maxNormal: item.rawTest.maxNormal,
        textReference: item.rawTest.textReference,
        method: item.rawTest.method
      });
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Search Input Box */}
      <div className="relative">
        <Search className="w-5 h-5 text-rose-800 absolute right-3.5 top-3 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full text-xs sm:text-sm font-medium pr-11 pl-10 py-3 bg-white border-2 border-rose-200/80 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all placeholder:text-slate-400"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute left-3.5 top-3 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Tabs & Category Selector */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Type Tabs */}
        <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveType('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeType === 'all'
                ? 'bg-rose-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الكل ({allItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveType('packages')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeType === 'packages'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>باقات شاملة ({packages.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveType('profiles')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeType === 'profiles'
                ? 'bg-indigo-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>بروفايلات ({profiles.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveType('individual')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeType === 'individual'
                ? 'bg-rose-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>تحاليل منفردة ({individualTests.length})</span>
          </button>
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="all">جميع الأقسام والتصنيفات</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Search Results List */}
      <div className={`overflow-y-auto rounded-2xl border border-slate-200 divide-y divide-slate-100 bg-white shadow-inner ${compact ? 'max-h-72' : 'max-h-96'}`}>
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <FlaskConical className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-500">لم يتم العثور على أي تحاليل أو باقات تطابق بحثك</p>
            <p className="text-[11px] text-slate-400">جرب كتابة جزء من الاسم أو الكود أو اختر قسماً آخر.</p>
          </div>
        ) : (
          filteredItems.map(item => {
            const isSelected = selectedItemCodes.some(c => c.toLowerCase() === item.code.toLowerCase());
            const isExpanded = expandedPackageId === item.id || expandedProfileCode === item.code;

            return (
              <div
                key={item.id}
                className={`p-3 transition-colors ${
                  isSelected ? 'bg-rose-50/70 border-r-4 border-r-rose-700' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left: Info */}
                  <div 
                    onClick={() => handleItemClick(item)}
                    className="flex-1 cursor-pointer space-y-1"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Kind Badge */}
                      {item.kind === 'package' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                          <Package className="w-3 h-3 text-amber-700" />
                          باقة فحص شاملة
                        </span>
                      ) : item.kind === 'profile' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-indigo-100 text-indigo-900 border border-indigo-300">
                          <Layers className="w-3 h-3 text-indigo-700" />
                          بروفايل معملي كامل
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-rose-100 text-rose-900 border border-rose-300">
                          <FlaskConical className="w-3 h-3 text-rose-700" />
                          تحليل منفرد
                        </span>
                      )}

                      {/* Code Tag */}
                      <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {item.code}
                      </span>

                      {/* Popular Badge */}
                      {item.isPopular && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-red-600 text-white">
                          <Flame className="w-2.5 h-2.5" />
                          الأكثر طلباً
                        </span>
                      )}

                      {/* Discount Badge */}
                      {item.discountPercentage && item.discountPercentage > 0 && (
                        <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                          وفر {item.discountPercentage}%
                        </span>
                      )}
                    </div>

                    {/* Titles */}
                    <div className="flex items-baseline gap-2">
                      <h4 className="text-xs sm:text-sm font-black text-slate-800">
                        {item.nameAr}
                      </h4>
                      <span className="text-[11px] font-medium text-slate-400 dir-ltr">
                        {item.nameEn}
                      </span>
                    </div>

                    {/* Medical Specs Preview */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 pt-0.5">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3 text-slate-400" />
                        <span className="text-slate-600">{item.category}</span>
                      </span>

                      <span className="text-slate-300">•</span>
                      <span>العينة: <strong className="text-slate-700 font-bold">{item.sampleType}</strong></span>

                      {item.unit && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span>الوحدة: <strong className="font-mono text-indigo-700 font-bold">{item.unit}</strong></span>
                        </>
                      )}

                      {item.textReference && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="truncate max-w-xs text-emerald-700 font-mono">
                            المعدل: {item.textReference}
                          </span>
                        </>
                      )}

                      {item.fastingInstructions && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-amber-800 font-medium">⚠️ {item.fastingInstructions}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right: Price & Selection Button */}
                  <div className="flex items-center gap-2.5 flex-shrink-0 pt-1">
                    <div className="text-left font-mono">
                      <div className="font-black text-sm text-slate-900">
                        {item.price} <span className="text-[10px] font-sans">ج.م</span>
                      </div>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <div className="text-[10px] line-through text-slate-400">
                          {item.originalPrice} ج.م
                        </div>
                      )}
                    </div>

                    {/* Select Toggle Button */}
                    <button
                      type="button"
                      onClick={() => handleItemClick(item)}
                      className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-rose-900 text-white shadow-sm ring-2 ring-rose-400'
                          : 'bg-slate-100 hover:bg-rose-100 hover:text-rose-900 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>مختار</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>إضافة</span>
                        </>
                      )}
                    </button>

                    {/* Expand Details Button for Packages / Profiles */}
                    {(item.kind === 'package' || item.kind === 'profile') && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item.kind === 'package') {
                            setExpandedPackageId(expandedPackageId === item.id ? null : item.id);
                          } else {
                            setExpandedProfileCode(expandedProfileCode === item.code ? null : item.code);
                          }
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="عرض الفحوصات المتضمنة"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-200/80 bg-slate-50/80 p-3 rounded-xl space-y-2 text-xs">
                    {item.kind === 'package' && (
                      <>
                        <div className="font-bold text-slate-700">الفحوصات المتضمنة في هذه الباقة:</div>
                        {item.includedProfileNames && item.includedProfileNames.length > 0 && (
                          <div>
                            <span className="text-[11px] font-bold text-indigo-800">بروفايلات كاملة: </span>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {item.includedProfileNames.map((p, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-md text-[11px] font-semibold">
                                  ✓ {p}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {item.includedIndividualNames && item.includedIndividualNames.length > 0 && (
                          <div className="mt-2">
                            <span className="text-[11px] font-bold text-rose-800">فحوصات وفيتامينات منفردة: </span>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {item.includedIndividualNames.map((t, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-900 rounded-md text-[11px] font-semibold">
                                  ✓ {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {item.kind === 'profile' && item.includedIndividualNames && (
                      <div>
                        <div className="font-bold text-slate-700 mb-1.5">معاملات هذا البروفايل ({item.includedIndividualNames.length} تحليل):</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-36 overflow-y-auto">
                          {item.includedIndividualNames.map((param, idx) => (
                            <span key={idx} className="text-[11px] text-slate-600 bg-white p-1 rounded border border-slate-200">
                              • {param}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
