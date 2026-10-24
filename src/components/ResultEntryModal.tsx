import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  FlaskConical,
  Zap,
  Sparkles,
  Layers,
  History,
  AlertOctagon
} from 'lucide-react';
import {
  CatalogTestItem,
  LabReport,
  Patient,
  ResultFlag,
  TestResultItem,
  BloodFilmExamination
} from '../types/laboratory';
import { BLOOD_FILM_PRESETS, PANEL_DEFINITIONS } from '../data/testCatalog';
import { calculateDelta, evaluateFlag } from '../utils/deltaCheck';
import { playCriticalChime } from '../utils/criticalAlerts';

interface ResultEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveReport: (report: LabReport) => void;
  existingReport?: LabReport | null;
  patients: Patient[];
  allReports: LabReport[];
  defaultPanelCode?: string;
  currentUserName: string;
}

export const ResultEntryModal: React.FC<ResultEntryModalProps> = ({
  isOpen,
  onClose,
  onSaveReport,
  existingReport,
  patients,
  allReports,
  defaultPanelCode = 'CBC',
  currentUserName,
}) => {
  const [selectedPanelCode, setSelectedPanelCode] = useState<string>(
    existingReport ? existingReport.panelCode : defaultPanelCode
  );

  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    existingReport ? existingReport.patientId : patients[0]?.id || ''
  );

  // Patient manual fields if adding new
  const [patientName, setPatientName] = useState<string>('');
  const [patientNameEn, setPatientNameEn] = useState<string>('');
  const [mrn, setMrn] = useState<string>('');
  const [age, setAge] = useState<number>(35);
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'CHILD' | 'NEWBORN'>('MALE');
  const [doctorName, setDoctorName] = useState<string>('د. الطبيب المعالج');
  const [sampleId, setSampleId] = useState<string>('');

  // Values map { [testCode]: string }
  const [values, setValues] = useState<Record<string, string>>({});

  // Blood Film Morphology (for CBC)
  const [rbcMorphology, setRbcMorphology] = useState<string>(
    BLOOD_FILM_PRESETS.rbc[0]
  );
  const [wbcMorphology, setWbcMorphology] = useState<string>(
    BLOOD_FILM_PRESETS.wbc[0]
  );
  const [plateletMorphology, setPlateletMorphology] = useState<string>(
    BLOOD_FILM_PRESETS.platelets[0]
  );
  const [pathologistImpression, setPathologistImpression] = useState<string>(
    BLOOD_FILM_PRESETS.impressions[0]
  );

  const [clinicalNotes, setClinicalNotes] = useState<string>('');
  const [hasPanicAlert, setHasPanicAlert] = useState<boolean>(false);

  // Sync state when editing an existing report or opening fresh
  useEffect(() => {
    if (existingReport) {
      setSelectedPanelCode(existingReport.panelCode);
      setSelectedPatientId(existingReport.patientId);
      setPatientName(existingReport.patient.fullName);
      setPatientNameEn(existingReport.patient.fullNameEn);
      setMrn(existingReport.patient.mrn);
      setAge(existingReport.patient.age);
      setGender((existingReport.patient.gender?.toUpperCase() as any) || 'MALE');
      setDoctorName(existingReport.patient.doctorName);
      setSampleId(existingReport.patient.sampleId);

      const valMap: Record<string, string> = {};
      existingReport.results.forEach((r) => {
        valMap[r.testCode] = r.value;
      });
      setValues(valMap);

      if (existingReport.bloodFilm) {
        setRbcMorphology(existingReport.bloodFilm.rbcMorphology);
        setWbcMorphology(existingReport.bloodFilm.wbcMorphology);
        setPlateletMorphology(existingReport.bloodFilm.plateletMorphology);
        setPathologistImpression(existingReport.bloodFilm.pathologistImpression);
      }
      setClinicalNotes(existingReport.clinicalNotes || '');
    } else {
      // Pick first patient or generate random sample ID
      const p = patients.find((pat) => pat.id === selectedPatientId) || patients[0];
      if (p) {
        setPatientName(p.fullName);
        setPatientNameEn(p.fullNameEn);
        setMrn(p.mrn);
        setAge(p.age);
        setGender((p.gender?.toUpperCase() as any) || 'MALE');
        setDoctorName(p.doctorName);
        setSampleId(`SMP-${Math.floor(100000 + Math.random() * 900000)}`);
      }
      setValues({});
      setClinicalNotes('');
    }
  }, [existingReport, isOpen, selectedPatientId, patients]);

  if (!isOpen) return null;

  const currentPanel =
    PANEL_DEFINITIONS.find((p) => p.code === selectedPanelCode) || PANEL_DEFINITIONS[0];

  // Retrieve previous report for this patient & panel to compute delta
  const previousReport = allReports.find(
    (r) =>
      r.patient.mrn === mrn &&
      r.panelCode === selectedPanelCode &&
      (!existingReport || r.id !== existingReport.id)
  );

  // Helper to handle input changes
  const handleValueChange = (testCode: string, val: string) => {
    const updated = { ...values, [testCode]: val };

    // Auto calculate Hematocrit and Red Cell Indices if CBC parameters are changed
    if (selectedPanelCode === 'CBC') {
      const rbcVal = parseFloat(testCode === 'RBC' ? val : updated['RBC'] || '');
      const hgbVal = parseFloat(testCode === 'HGB' ? val : updated['HGB'] || '');
      const hctVal = parseFloat(testCode === 'HCT' ? val : updated['HCT'] || '');

      // Rule of three estimate if HCT is empty and HGB entered: HCT ~ HGB * 3
      if (testCode === 'HGB' && hgbVal && !updated['HCT']) {
        const estHct = (hgbVal * 3).toFixed(1);
        updated['HCT'] = estHct;
      }

      // Calculate MCV = (HCT * 10) / RBC
      const currentHct = parseFloat(updated['HCT'] || '');
      if (rbcVal && currentHct && (!updated['MCV'] || testCode === 'RBC' || testCode === 'HCT')) {
        updated['MCV'] = ((currentHct * 10) / rbcVal).toFixed(1);
      }
      // Calculate MCH = (HGB * 10) / RBC
      if (rbcVal && hgbVal && (!updated['MCH'] || testCode === 'RBC' || testCode === 'HGB')) {
        updated['MCH'] = ((hgbVal * 10) / rbcVal).toFixed(1);
      }
      // Calculate MCHC = (HGB * 100) / HCT
      if (hgbVal && currentHct && (!updated['MCHC'] || testCode === 'HGB' || testCode === 'HCT')) {
        updated['MCHC'] = ((hgbVal * 100) / currentHct).toFixed(1);
      }

      // Calculate Absolute Neutrophil Count (ANC) = (WBC * Neut%) / 100
      const wbcVal = parseFloat(testCode === 'WBC' ? val : updated['WBC'] || '');
      const neutPct = parseFloat(testCode === 'NEUT_PCT' ? val : updated['NEUT_PCT'] || '');
      if (wbcVal && neutPct) {
        updated['ANC'] = ((wbcVal * neutPct) / 100).toFixed(2);
      }
      // Calculate Absolute Lymphocyte Count (ALC) = (WBC * Lymph%) / 100
      const lymphPct = parseFloat(testCode === 'LYMPH_PCT' ? val : updated['LYMPH_PCT'] || '');
      if (wbcVal && lymphPct) {
        updated['ALC'] = ((wbcVal * lymphPct) / 100).toFixed(2);
      }
    }

    setValues(updated);

    // Check for critical panic alert
    const currentItem = currentPanel.items.find((i) => i.code === testCode);
    if (currentItem) {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        if (
          (currentItem.panicLow !== undefined && num <= currentItem.panicLow) ||
          (currentItem.panicHigh !== undefined && num >= currentItem.panicHigh)
        ) {
          setHasPanicAlert(true);
          playCriticalChime();
        }
      }
    }
  };

  // Quick fill preset values for realistic demonstration
  const handleQuickFillNormal = () => {
    const filled: Record<string, string> = {};
    currentPanel.items.forEach((item) => {
      const min = gender === 'MALE' ? item.minMale ?? 0 : item.minFemale ?? item.minMale ?? 0;
      const max = gender === 'MALE' ? item.maxMale ?? 10 : item.maxFemale ?? item.maxMale ?? 10;
      const mid = min + (max - min) * 0.45;
      filled[item.code] = mid.toFixed(item.precision);
    });
    setValues(filled);
  };

  const handleSave = () => {
    // Construct patient object
    const currentPatient: Patient = {
      id: selectedPatientId || `pat-${Date.now()}`,
      mrn: mrn || `RTL-${Math.floor(1000 + Math.random() * 9000)}`,
      nationalId: '29000000000000',
      fullName: patientName || 'مريض جديد',
      fullNameEn: patientNameEn || 'New Patient',
      gender,
      age: Number(age) || 30,
      ageUnit: 'YEARS',
      phone: '01000000000',
      doctorName: doctorName || 'د. طبيب معالج',
      hospitalOrClinic: 'عيادة خارجية',
      sampleId: sampleId || `SMP-${Math.floor(100000 + Math.random() * 900000)}`,
      collectionDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
      receivedDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    let reportHasPanic = false;

    // Build results array
    const testResults: TestResultItem[] = currentPanel.items.map((item) => {
      const enteredStr = values[item.code] || '';
      const numVal = parseFloat(enteredStr);
      const minRef = gender === 'MALE' ? item.minMale : item.minFemale ?? item.minMale;
      const maxRef = gender === 'MALE' ? item.maxMale : item.maxFemale ?? item.maxMale;

      const flag: ResultFlag = !isNaN(numVal)
        ? evaluateFlag(numVal, minRef, maxRef, item.panicLow, item.panicHigh)
        : 'NORMAL';

      if (flag === 'CRITICAL_LOW' || flag === 'CRITICAL_HIGH') {
        reportHasPanic = true;
      }

      // Check previous value for delta
      const prevItem = previousReport?.results.find((r) => r.testCode === item.code);
      const prevNum = prevItem?.numericValue;
      const delta = !isNaN(numVal) && prevNum !== undefined ? calculateDelta(item.code, numVal, prevNum) : null;

      const refDisplay =
        minRef !== undefined && maxRef !== undefined
          ? `${minRef.toFixed(item.precision)} - ${maxRef.toFixed(item.precision)}`
          : item.textRef || '-';

      return {
        testCode: item.code,
        testNameEn: item.nameEn,
        testNameAr: item.nameAr,
        value: enteredStr || '-',
        numericValue: !isNaN(numVal) ? numVal : undefined,
        unit: item.unit,
        flag,
        minRef,
        maxRef,
        referenceDisplay: refDisplay,
        previousValue: prevItem?.value,
        previousDate: previousReport?.date,
        deltaPercent: delta?.deltaPercent,
        isDeltaSignificant: delta?.isSignificant,
      };
    });

    const reportNumber =
      existingReport?.reportNumber ||
      `RPT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const savedReport: LabReport = {
      id: existingReport?.id || `rep-${Date.now()}`,
      reportNumber,
      patientId: currentPatient.id,
      patient: currentPatient,
      panelCode: currentPanel.code,
      panelNameEn: currentPanel.nameEn,
      panelNameAr: currentPanel.nameAr,
      status: existingReport?.status || 'ANALYZED',
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      results: testResults,
      version: (existingReport?.version || 0) + 1,
      createdAt: existingReport?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      criticalAlertActive: reportHasPanic,
      verifiedBy: 'د. رامي مختار',
      verifiedTitle: 'استشاري الباثولوجيا الإكلينيكية وأمراض الدم',
      analyzedBy: currentUserName || 'أخصائي التحاليل الطبية',
      qrCodeUrl: `https://rtlab-unified.med/verify/${reportNumber}`,
      clinicalNotes: clinicalNotes || undefined,
      bloodFilm:
        selectedPanelCode === 'CBC'
          ? {
              rbcMorphology,
              wbcMorphology,
              plateletMorphology,
              pathologistImpression,
              examinedBy: 'د. رامي مختار (Consultant Pathologist)',
              date: new Date().toISOString().replace('T', ' ').slice(0, 16),
            }
          : undefined,
    };

    onSaveReport(savedReport);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {existingReport ? 'تعديل نتائج الفحص المعملي' : 'إدراج نتائج تحاليل جديدة (Fast Bench Entry)'}
              </h2>
              <p className="text-xs text-slate-500">
                إدخال سريع ودقيق مع تقييم النطاقات الطبيعية ومقارنة الزيارة السابقة (Delta Check)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Critical Value Warning Banner */}
          {hasPanicAlert && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-3 text-rose-800 dark:text-rose-300">
                <AlertOctagon className="w-6 h-6 text-rose-600 shrink-0" />
                <div className="text-xs">
                  <strong className="block text-sm font-bold">تنبيه قيمة حرجة (Critical Panic Value Detected)!</strong>
                  <span>أحد الفحوصات تجاوز حد الأمان الطبي الحيوي. يتطلب إبلاغ الطبيب المعالج وتسجيل التبليغ.</span>
                </div>
              </div>
            </div>
          )}

          {/* Patient Selection & Demographics Strip */}
          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <User className="w-4 h-4 text-teal-600" />
                <span>بيانات المريض والعينة:</span>
              </span>

              {/* Patient fast picker */}
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-800 dark:text-slate-200"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.mrn})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-slate-500 block mb-1">اسم المريض (عربي):</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 font-bold"
                />
              </div>

              <div>
                <label className="text-slate-500 block mb-1">Patient Name (EN):</label>
                <input
                  type="text"
                  value={patientNameEn}
                  onChange={(e) => setPatientNameEn(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 font-medium"
                />
              </div>

              <div>
                <label className="text-slate-500 block mb-1">الرقم الطبي (MRN):</label>
                <input
                  type="text"
                  value={mrn}
                  onChange={(e) => setMrn(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-500 block mb-1">العمر:</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2 py-1.5 text-center font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">الجنس:</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-1 py-1.5 text-center font-bold"
                  >
                    <option value="MALE">ذكر</option>
                    <option value="FEMALE">أنثى</option>
                    <option value="CHILD">أطفال</option>
                    <option value="NEWBORN">حديثي الولادة</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Panel Selector & Quick actions */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">اختر الملف التحليلي:</span>
              <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {PANEL_DEFINITIONS.map((p) => (
                  <button
                    key={p.code}
                    type="button"
                    onClick={() => setSelectedPanelCode(p.code)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                      selectedPanelCode === p.code
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {p.nameAr}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleQuickFillNormal}
              className="flex items-center gap-1.5 text-xs font-medium text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/50 border border-teal-200 dark:border-teal-800 px-3 py-1.5 rounded-xl transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>ملء سريع بنتائج نموذجية</span>
            </button>
          </div>

          {/* Results Input Matrix (2-column layout for fast bench typing) */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
              <span>عناصر الفحص ({currentPanel.items.length} عنصر):</span>
              <span className="text-[11px] text-slate-500 font-normal">
                اضغط Tab أو Enter للانتقال السريع للعنصر التالي
              </span>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto">
              {currentPanel.items.map((item, idx) => {
                const val = values[item.code] || '';
                const num = parseFloat(val);
                const min = gender === 'MALE' ? item.minMale : item.minFemale ?? item.minMale;
                const max = gender === 'MALE' ? item.maxMale : item.maxFemale ?? item.maxMale;
                const flag = !isNaN(num)
                  ? evaluateFlag(num, min, max, item.panicLow, item.panicHigh)
                  : 'NORMAL';

                const isPanic = flag === 'CRITICAL_LOW' || flag === 'CRITICAL_HIGH';
                const isAbnormal = flag !== 'NORMAL';

                // Previous value check
                const prevItem = previousReport?.results.find((r) => r.testCode === item.code);
                const delta = !isNaN(num) && prevItem?.numericValue ? calculateDelta(item.code, num, prevItem.numericValue) : null;

                return (
                  <div
                    key={item.code}
                    className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      isPanic
                        ? 'border-rose-400 bg-rose-50/70 dark:bg-rose-950/30'
                        : isAbnormal
                        ? 'border-amber-300 bg-amber-50/50 dark:bg-amber-950/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                    }`}
                  >
                    {/* Test Label & Normal Range */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {item.nameEn}
                        </span>
                        {isPanic && (
                          <span className="text-[9px] bg-rose-600 text-white font-bold px-1 rounded uppercase">
                            Panic!
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5 font-mono">
                        <span>{item.nameAr}</span>
                        <span>·</span>
                        <span>الطبيعي: {min ?? '-'} - {max ?? '-'} {item.unit}</span>
                      </div>
                      {/* Delta alert inline if significant */}
                      {delta && delta.isSignificant && (
                        <div className="text-[10px] text-rose-600 font-semibold mt-0.5">
                          تغير حاد: {delta.deltaPercent > 0 ? '+' : ''}{delta.deltaPercent}% (السابق: {prevItem?.value})
                        </div>
                      )}
                    </div>

                    {/* Numerical Input Box */}
                    <div className="w-28 shrink-0 flex items-center gap-1.5">
                      <input
                        type="text"
                        value={val}
                        placeholder={min ? `${min}` : '0.0'}
                        onChange={(e) => handleValueChange(item.code, e.target.value)}
                        className={`w-full text-center py-1.5 px-2 rounded-lg font-mono font-bold text-xs border transition-colors ${
                          isPanic
                            ? 'bg-rose-100 dark:bg-rose-900 text-rose-900 dark:text-rose-100 border-rose-400 font-black'
                            : isAbnormal
                            ? 'bg-amber-50 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 border-amber-300'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700'
                        }`}
                      />
                      <span className="text-[10px] font-mono text-slate-400 w-10 text-left shrink-0 truncate">
                        {item.unit}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Blood Film Examination (Specifically rendered for CBC as requested!) */}
          {selectedPanelCode === 'CBC' && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/60 dark:bg-slate-800/30 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>فحص الفيلم الدموي الميكروسكوبي (Peripheral Blood Film Morphology):</span>
                </span>
                <span className="text-[11px] text-slate-500 font-mono">CBC Morphology Protocols</span>
              </div>

              {/* RBC Morphology */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  1. وصف كريات الدم الحمراء (RBC Morphology):
                </label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {BLOOD_FILM_PRESETS.rbc.map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setRbcMorphology(preset)}
                      className="text-[10px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-md transition-colors"
                    >
                      نموذج {i + 1}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  value={rbcMorphology}
                  onChange={(e) => setRbcMorphology(e.target.value)}
                  className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* WBC Morphology */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  2. وصف كريات الدم البيضاء (WBC Morphology):
                </label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {BLOOD_FILM_PRESETS.wbc.map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setWbcMorphology(preset)}
                      className="text-[10px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-md transition-colors"
                    >
                      نموذج {i + 1}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  value={wbcMorphology}
                  onChange={(e) => setWbcMorphology(e.target.value)}
                  className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Platelets Morphology */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  3. وصف وتأكيد الصفائح الدموية (Platelets Smear):
                </label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {BLOOD_FILM_PRESETS.platelets.map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPlateletMorphology(preset)}
                      className="text-[10px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-md transition-colors"
                    >
                      نموذج {i + 1}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  value={plateletMorphology}
                  onChange={(e) => setPlateletMorphology(e.target.value)}
                  className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Pathologist Impression / Summary */}
              <div>
                <label className="text-xs font-semibold text-teal-800 dark:text-teal-300 block mb-1">
                  خلاصة ورأي استشاري الباثولوجيا (Pathologist Summary / Impression):
                </label>
                <textarea
                  rows={2}
                  value={pathologistImpression}
                  onChange={(e) => setPathologistImpression(e.target.value)}
                  className="w-full text-xs bg-white dark:bg-slate-800 border border-teal-300 dark:border-teal-700 rounded-xl p-2.5 text-teal-950 dark:text-teal-200 font-medium"
                />
              </div>
            </div>
          )}

          {/* Clinical Comments */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              ملاحظات إكلينيكية إضافية (Clinical Notes):
            </label>
            <input
              type="text"
              placeholder="مثال: تمت إعادة الفحص مرتين للتأكيد / متابعة دورية بعد العلاج"
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {hasPanicAlert ? (
              <span className="text-rose-600 font-bold flex items-center gap-1">
                <AlertOctagon className="w-4 h-4" /> سيتم حفظ التقرير مع تنبيه القيمة الحرجة
              </span>
            ) : (
              <span>جاهز للحفظ والترحيل للمراجعة الطبية</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 rounded-xl"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>حفظ وتوليد التقرير الطبي</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
