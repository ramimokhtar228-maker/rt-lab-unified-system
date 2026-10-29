import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getNextLabIdentity } from '../utils/labNumbering';
import {
  UserPlus,
  Search,
  Plus,
  Trash2,
  Check,
  CreditCard,
  Gift,
  Printer,
  Barcode,
  Sparkles,
  Phone,
  User,
  Calendar,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Package,
  Layers,
  FlaskConical,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';
import { Patient, InvoiceTestItem, PaymentMethod, ComprehensivePackage } from '../types';
import { LAB_CATALOG } from '../data/labCatalog';
import { INITIAL_INDIVIDUAL_TESTS } from '../data/individualTestsData';
import { SmartTestSearch } from './SmartTestSearch';
import { formatBookingConfirmationWhatsAppMessage, openWhatsApp } from '../utils/whatsapp';
import { WhatsAppBookingModal } from './WhatsAppBookingModal';

interface AdmissionModuleProps {
  onSuccess?: () => void;
  isModal?: boolean;
  onOpenInvoice?: (report: LabReport) => void;
}

export const AdmissionModule: React.FC<AdmissionModuleProps> = ({ onSuccess, isModal = false, onOpenInvoice }) => {
  const {
    labInfo,
    createReportFromAdmission,
    earnLoyaltyPoints,
    redeemLoyaltyPoints,
    getLoyaltyByPhone,
    loyaltyConfig,
    calculateLoyaltyTier,
    currentUser,
    reports,
    setActiveTab,
    setSelectedReportId,
    setIsPatientFormOpen,
    packages,
    testCatalog,
    diagnosticProfiles,
    forceSyncCatalog
  } = useApp();

  // Use local date (Egypt / regional timezone) instead of UTC toISOString to avoid day shift
  const today = useMemo(() => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  }, []);
  // Continue the lab-number sequence from the highest case already registered (on any device),
  // so two devices can never issue the same number and overwrite each other's cases on sync.
  const { labNumber: suggestedLabNumber, barcode: suggestedBarcode } = useMemo(
    () => getNextLabIdentity(reports),
    [reports]
  );

  const [customLabNumber, setCustomLabNumber] = useState('');
  const [customBarcode, setCustomBarcode] = useState('');
  const [isEditingIdentity, setIsEditingIdentity] = useState(false);
  const [createdReportObj, setCreatedReportObj] = useState<LabReport | null>(null);

  const nextLabNumber = customLabNumber.trim() || suggestedLabNumber;
  const nextBarcode = customBarcode.trim() || suggestedBarcode;

  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState<number>(30);
  const [ageUnit, setAgeUnit] = useState<Patient['ageUnit']>('years');
  const [gender, setGender] = useState<Patient['gender']>('male');
  const [nationalId, setNationalId] = useState('');
  const [referringDoctor, setReferringDoctor] = useState('أطباء كلية طب قصر العيني');
  const [clinicalHistory, setClinicalHistory] = useState('');
  const [fastingHours, setFastingHours] = useState<number>(0);
  const [bookingType, setBookingType] = useState<'branch' | 'home_visit'>('branch');
  const [homeAddress, setHomeAddress] = useState('');
  const [homeVisitFee, setHomeVisitFee] = useState<number>(80);
  const [appointmentDate, setAppointmentDate] = useState<string>(today);
  const [appointmentTime, setAppointmentTime] = useState<string>('09:00');
  const [deliveryNotes, setDeliveryNotes] = useState<string>('');

  // Selected Tests & Packages
  const [selectedTests, setSelectedTests] = useState<InvoiceTestItem[]>([
    INITIAL_INDIVIDUAL_TESTS.find(t => t.code === 'CBC') || {
      id: 't-cbc',
      code: 'CBC',
      nameAr: 'صورة الدم الكاملة (CBC 5-Diff)',
      nameEn: 'Complete Blood Count',
      price: 180,
      category: 'Hematology',
      cost: 30,
      sampleType: 'EDTA Whole Blood',
      unit: 'Multi-parameter',
      textReference: 'Hb: Male 13.0-17.5 g/dL, Female 12.0-15.5 | WBC: 4.0-11.0 10^3/uL'
    }
  ]);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [redeemPoints, setRedeemPoints] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [createdLabNum, setCreatedLabNum] = useState<string>('');
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

  // Loyalty check by phone
  const loyaltyProfile = useMemo(() => {
    return getLoyaltyByPhone(phone);
  }, [phone, getLoyaltyByPhone]);

  // Selected Package Object
  const selectedPackage = useMemo(() => {
    if (!selectedPackageId) return null;
    return packages.find(p => p.id === selectedPackageId) || null;
  }, [selectedPackageId, packages]);

  // Auto apply loyalty discount if profile found (and no package)
  useEffect(() => {
    if (loyaltyProfile && discountPercent === 0 && !selectedPackage) {
      const tierConfig = loyaltyConfig?.tiers?.[loyaltyProfile.tier];
      const tierDiscount = tierConfig?.discountRate || 0;
      if (tierDiscount > 0) {
        setDiscountPercent(tierDiscount);
      }
    }
  }, [loyaltyProfile, loyaltyConfig, discountPercent, selectedPackage]);

  // Financial Calculations
  const getTestDetails = (code?: string) => {
    if (!code) return undefined;
    const upper = code.toUpperCase();
    return testCatalog.find(t => t.code && t.code.toUpperCase() === upper)
        || INITIAL_INDIVIDUAL_TESTS.find(t => t.code && t.code.toUpperCase() === upper);
  };

  const { packageItems, extraItems } = useMemo(() => {
    if (!selectedPackage) {
      return { packageItems: [], extraItems: selectedTests || [] };
    }
    const packageCodes = new Set([
      ...(selectedPackage.includedProfiles || []).map(c => String(c || '').toUpperCase()),
      ...(selectedPackage.includedIndividualTestCodes || []).map(c => String(c || '').toUpperCase())
    ]);
    const pkg = (selectedTests || []).filter(t => t?.code && packageCodes.has(String(t.code).toUpperCase()));
    const extra = (selectedTests || []).filter(t => t?.code && !packageCodes.has(String(t.code).toUpperCase()));
    return { packageItems: pkg, extraItems: extra };
  }, [selectedPackage, selectedTests]);

  const testsSubtotal = useMemo(() => {
    if (selectedPackage) {
      const packageCodes = new Set([
        ...(selectedPackage.includedProfiles || []).map(c => String(c || '').toUpperCase()),
        ...(selectedPackage.includedIndividualTestCodes || []).map(c => String(c || '').toUpperCase())
      ]);

      const extraTestsCost = (selectedTests || [])
        .filter(t => t?.code && !packageCodes.has(String(t.code).toUpperCase()))
        .reduce((sum, t) => sum + (Number(t?.price) || 0), 0);

      return (Number(selectedPackage.packagePrice) || 0) + extraTestsCost;
    }

    return (selectedTests || []).reduce((sum, t) => sum + (Number(t?.price) || 0), 0);
  }, [selectedPackage, selectedTests]);

  const effectiveVisitFee = bookingType === 'home_visit' ? homeVisitFee : 0;
  const grossSubtotal = testsSubtotal + effectiveVisitFee;
  const percentageDiscountAmount = selectedPackage ? 0 : Math.round((testsSubtotal * discountPercent) / 100);

  // Points redemption value
  const pointsRedeemValue = useMemo(() => {
    if (!redeemPoints || !loyaltyProfile || loyaltyProfile.totalPoints < 100) return 0;
    const maxRedeemable100s = Math.floor(loyaltyProfile.totalPoints / 100);
    return maxRedeemable100s * loyaltyConfig.egpPer100Points;
  }, [redeemPoints, loyaltyProfile, loyaltyConfig]);

  const totalDiscount = percentageDiscountAmount + pointsRedeemValue;
  const netTotal = Math.max(0, grossSubtotal - totalDiscount);

  // Auto set paid amount to netTotal unless deferred payment is chosen
  useEffect(() => {
    if (paymentMethod === 'deferred') {
      setPaidAmount(0);
    } else {
      setPaidAmount(netTotal);
    }
  }, [netTotal, paymentMethod]);

  const remainingAmount = Math.max(0, netTotal - paidAmount);

  // Professional WhatsApp Booking Data Memo (Computed after all financial & package variables)
  const bookingModalData = useMemo(() => {
    const discountLabel = selectedPackage
      ? `باقة: ${selectedPackage.titleAr}`
      : (discountPercent > 0
          ? `${discountPercent}%${loyaltyProfile ? ' (خصم كارت الولاء)' : ''}`
          : (totalDiscount > 0 ? 'خصم مطبق' : 'لا يوجد'));

    const safeTests = (selectedTests || []).filter(Boolean);
    const safeExtras = (extraItems || []).filter(Boolean);

    return {
      patientName: fullName.trim() || 'العميل الكريم',
      labNumber: createdLabNum || nextLabNumber,
      barcode: nextBarcode,
      phone: phone.trim(),
      date: appointmentDate || today,
      time: appointmentTime || '09:00',
      isHomeVisit: bookingType === 'home_visit',
      address: homeAddress,
      deliveryNotes,
      branchName: 'الفرع الرئيسي - بهتيم',
      branchAddress: labInfo?.mainAddress,
      branchPhone: labInfo?.phone,
      testsDetails: safeTests.map(t => ({
        nameAr: t.nameAr || t.nameEn || t.code || 'تحليل معملي',
        nameEn: t.nameEn || t.nameAr || t.code || 'Lab Test',
        code: t.code || 'TEST',
        price: Number(t.price) || 0
      })),
      packageName: selectedPackage?.titleAr,
      packagePrice: selectedPackage?.packagePrice,
      extraTestsDetails: selectedPackage ? safeExtras.map(t => ({
        nameAr: t.nameAr || t.nameEn || t.code || 'تحليل إضافي',
        nameEn: t.nameEn || t.nameAr || t.code || 'Extra Test',
        code: t.code || 'TEST',
        price: Number(t.price) || 0
      })) : undefined,
      subtotal: testsSubtotal,
      discountAmount: totalDiscount,
      discountLabel,
      visitFee: effectiveVisitFee,
      netAmount: netTotal,
      paidAmount,
      remainingAmount,
      paymentMethod: paymentMethod === 'cash' ? 'نقداً بالخزينة' : paymentMethod === 'visa' ? 'بطاقة ائتمانية / فيزا' : paymentMethod === 'instapay' ? 'إنستا باي InstaPay' : paymentMethod === 'deferred' ? 'آجل / غير مسدد' : String(paymentMethod),
      fastingHours: Number(fastingHours) || 0
    };
  }, [
    fullName, createdLabNum, nextLabNumber, nextBarcode, phone, appointmentDate, today,
    appointmentTime, bookingType, homeAddress, deliveryNotes, labInfo, selectedTests,
    selectedPackage, testsSubtotal, totalDiscount, discountPercent, loyaltyProfile,
    effectiveVisitFee, netTotal, paidAmount, remainingAmount, paymentMethod, fastingHours
  ]);

  // Add/Remove Tests
  const handleAddTest = (test: InvoiceTestItem) => {
    if (!test || !test.code) return;
    const testCode = String(test.code).toUpperCase();
    if (!selectedTests.some(t => t?.code && String(t.code).toUpperCase() === testCode)) {
      setSelectedTests(prev => [...prev, test]);
    }
  };

  const handleToggleTest = (test: InvoiceTestItem) => {
    if (!test || !test.code) return;
    const testCode = String(test.code).toUpperCase();
    if (selectedTests.some(t => t?.code && String(t.code).toUpperCase() === testCode)) {
      setSelectedTests(prev => prev.filter(t => t?.code && String(t.code).toUpperCase() !== testCode));
    } else {
      setSelectedTests(prev => [...prev, test]);
    }
  };

  const handleToggleProfile = (profile: any) => {
    if (!profile || !profile.code) return;
    const profCode = String(profile.code).toUpperCase();
    if (selectedTests.some(t => t?.code && String(t.code).toUpperCase() === profCode)) {
      setSelectedTests(prev => prev.filter(t => t?.code && String(t.code).toUpperCase() !== profCode));
    } else {
      setSelectedTests(prev => [
        ...prev,
        {
          id: `prof-${profile.code}`,
          code: profile.code,
          nameAr: profile.titleAr || profile.titleEn || profile.code,
          nameEn: profile.titleEn || profile.titleAr || profile.code,
          category: profile.category || 'General Diagnostic',
          price: Number(profile.profilePrice) || 250,
          sampleType: profile.sampleType || 'Serum'
        }
      ]);
    }
  };

  const handleRemoveTest = (code: string) => {
    if (!code) return;
    const target = String(code).toUpperCase();
    setSelectedTests(prev => prev.filter(t => t?.code && String(t.code).toUpperCase() !== target));
  };

  // Add / Switch Package
  const handleSelectPackage = (pkgId: string) => {
    if (selectedPackageId === pkgId) {
      // Deselect
      setSelectedPackageId('');
      setSelectedTests([]);
      setDiscountPercent(0);
      return;
    }

    const pkg = (packages || []).find(p => p?.id === pkgId);
    if (!pkg) return;

    setSelectedPackageId(pkg.id);

    // Map all package profiles & individual tests safely
    const pkgTests: InvoiceTestItem[] = [];

    (pkg.includedProfiles || []).forEach(code => {
      if (!code) return;
      const targetCode = String(code).toUpperCase();
      const foundProfile = (diagnosticProfiles || []).find(p => p?.code && String(p.code).toUpperCase() === targetCode)
                        || LAB_CATALOG.find(p => p?.code && String(p.code).toUpperCase() === targetCode);
      if (foundProfile) {
        pkgTests.push({
          id: `prof-${foundProfile.code}`,
          code: foundProfile.code,
          nameAr: foundProfile.titleAr || foundProfile.titleEn || foundProfile.code,
          nameEn: foundProfile.titleEn || foundProfile.titleAr || foundProfile.code,
          category: foundProfile.category || 'General Diagnostic',
          price: Number(foundProfile.profilePrice) || 250,
          sampleType: foundProfile.sampleType || 'Serum'
        });
      }
    });

    (pkg.includedIndividualTestCodes || []).forEach(code => {
      if (!code) return;
      const targetCode = String(code).toUpperCase();
      const found = INITIAL_INDIVIDUAL_TESTS.find(t => t?.code && String(t.code).toUpperCase() === targetCode)
                 || (testCatalog || []).find(t => t?.code && String(t.code).toUpperCase() === targetCode);
      if (found && !pkgTests.some(t => t?.code && String(t.code).toUpperCase() === targetCode)) {
        pkgTests.push(found);
      }
    });

    setSelectedTests(pkgTests);
  };

  // Submit Admission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim()) {
      setFormError("يرجى إدخال اسم المريض بالكامل قبل إتمام الحفظ.");
      return;
    }
    if (!selectedTests || selectedTests.length === 0) {
      setFormError("يرجى اختيار تحليل واحد على الأقل أو باقة للمريض.");
      return;
    }
    if (bookingType === 'home_visit' && !homeAddress.trim()) {
      setFormError("يرجى إدخال عنوان الزيارة المنزلية بالكامل.");
      return;
    }

    try {
      // Safe appointment date calculation
      let safeSampleDate = new Date().toISOString();
      try {
        if (appointmentDate) {
          const timePart = (appointmentTime && appointmentTime.match(/^\d{1,2}:\d{2}$/)) ? appointmentTime : '09:00';
          const dt = new Date(`${appointmentDate}T${timePart}:00`);
          if (!isNaN(dt.getTime())) {
            safeSampleDate = dt.toISOString();
          }
        }
      } catch {
        safeSampleDate = new Date().toISOString();
      }

      const patientRecord: Patient = {
        id: `pat-${Date.now()}`,
        labNumber: nextLabNumber,
        barcode: nextBarcode,
        fullName: fullName.trim(),
        phone: phone.trim(),
        age: Number(age) || 30,
        ageUnit,
        gender,
        nationalId: nationalId.trim() || undefined,
        referringDoctorTitle: "Dr.",
        referringDoctorName: referringDoctor.trim() || 'أطباء كلية طب قصر العيني',
        sampleDate: safeSampleDate,
        reportingDate: new Date().toISOString(),
        clinicalHistory: clinicalHistory.trim() || undefined,
        fastingHours: Number(fastingHours) || 0,
        bookingType,
        homeAddress: bookingType === 'home_visit' ? homeAddress.trim() : undefined,
        visitFee: effectiveVisitFee,
        appointmentDate: appointmentDate || today,
        appointmentTime: appointmentTime || '09:00',
        deliveryNotes: bookingType === 'home_visit' ? deliveryNotes.trim() : undefined,
        testsSubtotal,
        totalCost: netTotal,
        discountApplied: totalDiscount,
        paidAmount,
        remainingAmount,
        paymentStatus: paidAmount >= netTotal ? 'paid' : (paidAmount > 0 ? 'partial' : 'pending'),
        paymentMethod: (paymentMethod as any) || 'cash'
      };

      // Create Report & Invoice via AppContext
      const createdReport = createReportFromAdmission(
        patientRecord,
        selectedTests,
        selectedPackage || undefined
      );

      // Apply loyalty points redemption or earning safely
      if (phone.trim() && createdReport) {
        try {
          if (redeemPoints && pointsRedeemValue > 0 && loyaltyProfile && (loyaltyProfile.totalPoints || 0) >= 100) {
            const pointsToRedeem = Math.floor(loyaltyProfile.totalPoints / 100) * 100;
            if (pointsToRedeem > 0) {
              redeemLoyaltyPoints(phone.trim(), pointsToRedeem, createdReport.reportNumber, pointsRedeemValue);
            }
          }
          earnLoyaltyPoints(phone.trim(), paidAmount, createdReport.reportNumber, fullName.trim(), nextBarcode);
        } catch (lErr) {
          console.warn("Loyalty sync non-fatal warning:", lErr);
        }
      }

      setCreatedReportObj(createdReport);
      setCreatedLabNum(createdReport ? createdReport.reportNumber : nextLabNumber);
      setIsSubmitted(true);
      // NOTE: Do NOT immediately close the modal via onSuccess() so the user can see the confirmation and send WhatsApp/print
    } catch (err: any) {
      console.error("Admission submission error:", err);
      setFormError(`حدث خطأ أثناء حفظ وتسجيل المريض: ${err?.message || 'يرجى مراجعة البيانات'}`);
    }
  };

  const handleSendWhatsApp = () => {
    const discountLabel = selectedPackage
      ? `باقة: ${selectedPackage.titleAr}`
      : (discountPercent > 0
          ? `${discountPercent}%${loyaltyProfile ? ' (كرت ولاء)' : ''}`
          : (totalDiscount > 0 ? 'خصم مطبق' : 'لا يوجد'));
    const text = formatBookingConfirmationWhatsAppMessage({
      patientName: fullName,
      labNumber: createdLabNum || nextLabNumber,
      barcode: nextBarcode,
      phone: phone.trim(),
      date: appointmentDate || today,
      time: appointmentTime || '09:00',
      isHomeVisit: bookingType === 'home_visit',
      address: homeAddress,
      deliveryNotes,
      branchAddress: labInfo?.mainAddress,
      testsDetails: (selectedTests || []).map(t => ({ nameAr: t?.nameAr || '', nameEn: t?.nameEn || '', code: t?.code || '', price: Number(t?.price) || 0 })),
      packageName: selectedPackage?.titleAr,
      packagePrice: selectedPackage?.packagePrice,
      extraTestsDetails: selectedPackage ? (extraItems || []).map(t => ({ nameAr: t?.nameAr || '', nameEn: t?.nameEn || '', code: t?.code || '', price: Number(t?.price) || 0 })) : undefined,
      subtotal: grossSubtotal,
      discountAmount: totalDiscount,
      discountLabel,
      visitFee: effectiveVisitFee,
      netAmount: netTotal,
      paidAmount,
      remainingAmount,
      paymentMethod: paymentMethod === 'cash' ? 'نقدي' : paymentMethod === 'visa' ? 'فيزا' : paymentMethod === 'instapay' ? 'إنستا باي' : String(paymentMethod),
      fastingHours: Number(fastingHours) || 0,
      customLabInfo: labInfo
    });
    openWhatsApp(phone, text);
  };

  if (isSubmitted) {
    return (
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl text-center space-y-6 max-w-2xl mx-auto my-4 animate-in zoom-in-95">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
            <Check className="w-3.5 h-3.5" />
            <span>تم التسجيل والفوترة وتأكيد الحجز</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900">تم تسجيل المريض وحجز التحاليل بنجاح!</h2>
          <p className="text-slate-500 text-xs sm:text-sm">
            تم إصدار الفاتورة وإدراج العينة في قائمة عمل المعمل برقم كود: <strong className="text-rose-900 font-mono text-base">{createdLabNum}</strong>
          </p>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-right space-y-2.5 font-medium">
          <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
            <span className="text-slate-500">اسم المريض:</span>
            <strong className="text-slate-900 text-sm">{fullName}</strong>
          </div>
          <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
            <span className="text-slate-500">رقم التحليل بالمختبر (Lab No):</span>
            <strong className="font-mono text-rose-900 font-black text-sm">{createdLabNum}</strong>
          </div>
          <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
            <span className="text-slate-500">باركود العينة:</span>
            <strong className="font-mono text-slate-800 font-bold">{nextBarcode}</strong>
          </div>
          <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
            <span className="text-slate-500">التحاليل المحجوزة:</span>
            <strong className="text-slate-800">{selectedTests.length} فحص {selectedPackage ? `(باقة: ${selectedPackage.titleAr})` : ''}</strong>
          </div>
          <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
            <span className="text-slate-500">الحساب المالي:</span>
            <strong className="font-mono text-emerald-700">المطلوب: {netTotal} ج.م | المدفوع: {paidAmount} ج.م | المتبقي: {remainingAmount} ج.م</strong>
          </div>
          {phone.trim() && (
            <div className="flex justify-between items-center">
              <span className="text-slate-500">نقاط الولاء المكتسبة:</span>
              <strong className="font-mono text-amber-700">+{Math.floor(paidAmount * loyaltyConfig.pointsPerEGP)} نقطة (رقم الهاتف: {phone})</strong>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* WhatsApp Button */}
          <button
            type="button"
            onClick={() => setIsWhatsAppModalOpen(true)}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs shadow-md shadow-emerald-950/20 transition-all cursor-pointer active:scale-98"
          >
            <MessageCircle className="w-4 h-4 text-emerald-200" />
            <span>إرسال رسالة الحجز عبر واتساب</span>
          </button>

          {/* Go to Diagnostic Editor */}
          <button
            type="button"
            onClick={() => {
              if (createdReportObj) {
                setSelectedReportId(createdReportObj.id);
              }
              setActiveTab('diagnostic_editor');
              if (isModal && onSuccess) onSuccess();
            }}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-rose-900 hover:bg-rose-800 text-white font-black text-xs shadow-md transition-colors cursor-pointer"
          >
            <FlaskConical className="w-4 h-4" />
            <span>الانتقال لإدخال نتائج التحاليل</span>
          </button>

          {/* Print Invoice */}
          <button
            type="button"
            onClick={() => {
              if (createdReportObj && onOpenInvoice) {
                if (isModal && onSuccess) onSuccess();
                onOpenInvoice(createdReportObj);
              }
            }}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            <span>طباعة الفاتورة والإيصال</span>
          </button>

          {/* Register Another Patient */}
          <button
            type="button"
            onClick={() => {
              setIsSubmitted(false);
              setFullName('');
              setPhone('');
              setNationalId('');
              setClinicalHistory('');
              setSelectedPackageId('');
              setSelectedTests([
                INITIAL_INDIVIDUAL_TESTS.find(t => t.code === 'CBC') || {
                  id: 't-cbc',
                  code: 'CBC',
                  nameAr: 'صورة الدم الكاملة (CBC 5-Diff)',
                  nameEn: 'Complete Blood Count',
                  price: 180,
                  category: 'Hematology',
                  cost: 30,
                  sampleType: 'EDTA Whole Blood',
                  unit: 'Multi-parameter',
                  textReference: 'Normal'
                }
              ]);
              setCustomLabNumber('');
              setCustomBarcode('');
              setCreatedReportObj(null);
            }}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-300 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل حالة جديدة أخرى</span>
          </button>
        </div>

        {isModal && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                if (onSuccess) onSuccess();
              }}
              className="px-4 py-2 text-xs text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
            >
              إغلاق النافذة
            </button>
          </div>
        )}

        <WhatsAppBookingModal isOpen={isWhatsAppModalOpen} onClose={() => setIsWhatsAppModalOpen(false)} bookingData={bookingModalData} />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isModal ? 'p-1' : ''}`}>
      {/* Header */}
      {!isModal && (
        <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-rose-900/40">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-600/30 rounded-xl border border-rose-500/40 text-rose-300">
                  <UserPlus className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight">تسجيل مريض جديد وحجز التحاليل والفوترة</h1>
                  <p className="text-slate-300 text-xs sm:text-sm font-medium">
                    تسجيل شامل يربط ملف المريض مباشرة بالخزينة المالية، وقائمة عمل المعمل، ونظام كروت ونقاط الولاء
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700 text-left font-mono">
              <span className="text-[10px] text-slate-400 block">رقم المعمل المقترح:</span>
              <span className="font-bold text-rose-300 text-sm">{nextLabNumber}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {formError && (
          <div className="lg:col-span-12 p-4 bg-rose-50 border-2 border-rose-300 text-rose-900 rounded-2xl text-xs font-bold flex items-start gap-2.5 shadow-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-black text-rose-950 block text-sm">تنبيه في استكمال البيانات:</span>
              <span>{formError}</span>
            </div>
            <button
              type="button"
              onClick={() => setFormError(null)}
              className="text-rose-500 hover:text-rose-800 text-xs font-bold px-2 py-0.5 rounded cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Left Column: Demographics & Test Selector (Col 7) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Patient Demographics */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="w-5 h-5 text-rose-700" />
              <h2 className="font-black text-slate-800 text-base">البيانات الشخصية والطبية للمريض</h2>
            </div>

            {/* Lab Number & Barcode Identity Row */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 font-bold">رقم المعمل:</span>
                  <span className="font-mono font-black text-rose-900 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-xs">
                    {nextLabNumber}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 font-bold">باركود العينة:</span>
                  <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 text-xs">
                    {nextBarcode}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditingIdentity(!isEditingIdentity)}
                className="text-[11px] font-bold text-rose-700 hover:text-rose-900 underline cursor-pointer"
              >
                {isEditingIdentity ? 'إلغاء التعديل اليدوي' : 'تعديل رقم المعمل أو الباركود يدوياً'}
              </button>
            </div>

            {isEditingIdentity && (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs animate-in fade-in">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم المعمل اليدوي:</label>
                  <input
                    type="text"
                    value={customLabNumber}
                    onChange={(e) => setCustomLabNumber(e.target.value)}
                    placeholder={suggestedLabNumber}
                    className="w-full bg-white border border-amber-300 rounded-lg p-2 font-mono text-xs"
                  />
                  <span className="text-[10px] text-slate-500">اتركه فارغاً للاعتماد على التسلسل التلقائي</span>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">باركود العينة اليدوي:</label>
                  <input
                    type="text"
                    value={customBarcode}
                    onChange={(e) => setCustomBarcode(e.target.value)}
                    placeholder={suggestedBarcode}
                    className="w-full bg-white border border-amber-300 rounded-lg p-2 font-mono text-xs"
                  />
                  <span className="text-[10px] text-slate-500">اتركه فارغاً للاعتماد على باركود المعمل التلقائي</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الاسم الرباعي للمريض: <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال: محمد السيد إبراهيم الشناوي"
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رقم الهاتف / الواتساب:
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="010XXXXXXXX"
                    className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none text-left"
                    dir="ltr"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                </div>
                {loyaltyProfile && (
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>مشترك في نادي الولاء: كارت {loyaltyProfile.tier} ({loyaltyProfile.totalPoints} نقطة)</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الرقم القومي (اختياري):
                </label>
                <input
                  type="text"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  placeholder="14 رقماً"
                  maxLength={14}
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none text-left"
                  dir="ltr"
                />
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">السن:</label>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-xs font-bold text-slate-700 mb-1">الوحدة:</label>
                  <select
                    value={ageUnit}
                    onChange={(e) => setAgeUnit(e.target.value as any)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value="years">سنة</option>
                    <option value="months">شهر</option>
                    <option value="days">يوم</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الجنس:</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                >
                  <option value="male">ذكر (Male)</option>
                  <option value="female">أنثى (Female)</option>
                  <option value="child">أطفال (Child)</option>
                  <option value="newborn">حديثي الولادة (Newborn)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الطبيب المعالج / المحول:</label>
                <input
                  type="text"
                  value={referringDoctor}
                  onChange={(e) => setReferringDoctor(e.target.value)}
                  placeholder="مثال: أ.د. رامي مختار أو عيادات خارجية"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ساعات الصيام:</label>
                <input
                  type="number"
                  min={0}
                  max={24}
                  value={fastingHours}
                  onChange={(e) => setFastingHours(Number(e.target.value))}
                  placeholder="0 إذا غير صائم"
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">التاريخ المرضي / ملاحظات الطبيب:</label>
                <input
                  type="text"
                  value={clinicalHistory}
                  onChange={(e) => setClinicalHistory(e.target.value)}
                  placeholder="مثال: مريض سكر وضغط، يعاني من إجهاد وشحوب..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Tests & Packages Selection */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-rose-700" />
                <h2 className="font-black text-slate-800 text-base">التحاليل والباقات المطلوبة للحجز</h2>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-rose-50 text-rose-900 border border-rose-200">
                  {selectedTests.length} فحص مختار
                </span>
                {selectedTests.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPackageId('');
                      setSelectedTests([]);
                    }}
                    className="text-[11px] font-bold text-red-600 hover:text-red-800 p-1 cursor-pointer"
                  >
                    تفريغ الكل
                  </button>
                )}
              </div>
            </div>

            {/* Quick Packages Shortcuts */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">اختيار باقة فحص شاملة سريعة:</span>
                <span className="text-[10px] text-slate-400">({packages.length} باقة متاحة)</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {packages.slice(0, 6).map(pkg => {
                  const isActive = selectedPackageId === pkg.id;
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => handleSelectPackage(pkg.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-gradient-to-r from-rose-900 to-rose-800 text-white shadow-md ring-2 ring-rose-400'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80'
                      }`}
                    >
                      <Package className={`w-3.5 h-3.5 ${isActive ? 'text-amber-300' : 'text-slate-500'}`} />
                      <span>{pkg.titleAr}</span>
                      <span className="font-mono text-[10px] opacity-90">({pkg.packagePrice} ج.م)</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Selected Package Alert Card */}
            {selectedPackage && (
              <div className="bg-gradient-to-br from-amber-50 via-rose-50 to-amber-50/50 p-4 rounded-2xl border-2 border-amber-300/80 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-amber-500 text-white font-black text-[10px]">
                        باقة الحجز المعتمدة
                      </span>
                      <span className="font-mono font-bold text-xs text-slate-600 bg-white/80 px-2 py-0.5 rounded border border-amber-200">
                        {selectedPackage.code}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                        خصم {selectedPackage.discountPercentage}%
                      </span>
                    </div>

                    <h3 className="font-black text-slate-900 text-sm sm:text-base">
                      {selectedPackage.titleAr}
                    </h3>
                    <p className="text-xs text-slate-600">
                      {selectedPackage.descriptionAr}
                    </p>
                  </div>

                  <div className="text-left flex-shrink-0">
                    <div className="font-mono font-black text-lg text-emerald-700">
                      {selectedPackage.packagePrice} <span className="text-xs font-sans">ج.م</span>
                    </div>
                    <div className="text-[11px] line-through text-slate-400 font-mono">
                      {selectedPackage.originalPrice} ج.م
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectPackage(selectedPackage.id)}
                      className="text-[11px] font-bold text-red-600 hover:text-red-800 mt-1 cursor-pointer block text-left"
                    >
                      إلغاء الباقة ✕
                    </button>
                  </div>
                </div>

                {/* Package details: Fasting & Samples */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-amber-200/60 text-xs">
                  <div className="flex items-center gap-1.5 text-amber-900 font-medium bg-amber-100/60 p-2 rounded-xl">
                    <Clock className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                    <span><strong>التحضير:</strong> {selectedPackage.fastingRequired || 'حسب الفحوصات'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-800 font-medium bg-white/70 p-2 rounded-xl border border-amber-200/50">
                    <FlaskConical className="w-3.5 h-3.5 text-rose-700 flex-shrink-0" />
                    <span><strong>العينات:</strong> {(selectedPackage.sampleTypes || []).join(' + ') || 'عينة دم / مصل'}</span>
                  </div>
                </div>

                {/* Profiles & Tests Included in Package */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-700 block">
                    الفحوصات المشمولة التي سيتم تفريغها بجداول التقرير الطبي:
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                    {(selectedPackage.includedProfiles || []).map(pCode => (
                      <span key={pCode} className="px-2 py-0.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 text-[11px] font-bold">
                        ✓ بروفايل {pCode}
                      </span>
                    ))}
                    {(selectedPackage.includedIndividualTestCodes || []).map(tCode => (
                      <span key={tCode} className="px-2 py-0.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-[11px] font-bold">
                        ✓ {tCode}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Smart Test Search & Explorer */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-rose-600" />
                  البحث الذكي المباشر عن التحاليل والباقات:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const res = forceSyncCatalog();
                      alert(`✅ تم تحديث ومزامنة الكتالوج (${res.testsCount} فحص طبي + ${res.packagesCount} باقة).`);
                    }}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1 transition-colors"
                    title="مزامنة فورية للكتالوج"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-600 animate-pulse" />
                    <span>مزامنة الكتالوج ({testCatalog.length})</span>
                  </button>
                  <span className="text-[11px] text-slate-400">ابحث بالعربي أو الإنجليزي أو كود التحليل</span>
                </div>
              </div>

              <SmartTestSearch
                packages={packages}
                profiles={diagnosticProfiles && diagnosticProfiles.length > 0 ? diagnosticProfiles : LAB_CATALOG}
                individualTests={testCatalog && testCatalog.length > 0 ? (testCatalog as any) : INITIAL_INDIVIDUAL_TESTS}
                selectedItemCodes={(selectedTests || []).map(t => t?.code || '').filter(Boolean)}
                onToggleTest={handleToggleTest}
                onSelectPackage={(pkg) => handleSelectPackage(pkg.id)}
                onToggleProfile={handleToggleProfile}
                compact={true}
              />
            </div>

            {/* Selected Tests List */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800">
                  قائمة الفحوصات المختارة للحجز ({selectedTests.length} فحص):
                </span>
                <span className="text-xs font-mono font-black text-rose-900">
                  الإجمالي: {testsSubtotal} ج.م
                </span>
              </div>

              {selectedTests.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  لم يتم اختيار أي تحاليل بعد. استخدم شريط البحث الذكي أعلاه أو اختر باقة شاملة.
                </div>
              ) : selectedPackage ? (
                <div className="space-y-3">
                  {/* Group 1: Tests included in the approved package */}
                  <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-3 space-y-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-amber-200/60">
                      <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-amber-700" />
                        <span>فحوصات الباقة المعتمدة ({packageItems.length} فحص):</span>
                      </span>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        مشمولة ضمن سعر الباقة ({selectedPackage.packagePrice} ج.م)
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {packageItems.map(test => {
                        const details = getTestDetails(test.code);
                        const normalDisplay = details?.textReference 
                          || (details?.minNormal !== undefined && details?.maxNormal !== undefined 
                              ? `${details.minNormal} - ${details.maxNormal} ${details.unit || ''}`.trim()
                              : 'معتمد طبياً');
                        const unitDisplay = details?.unit || test.unit || 'Score / Units';
                        const sampleDisplay = details?.sampleType || test.sampleType || 'Serum';

                        return (
                          <div
                            key={test.code}
                            className="p-2 rounded-xl bg-white border border-amber-100 text-xs flex items-center justify-between hover:border-amber-300 transition-colors"
                          >
                            <div className="flex-1 min-w-0 pr-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px]">
                                  {test.code}
                                </span>
                                <span className="font-bold text-slate-900">{test.nameAr}</span>
                                <span className="text-[10px] text-slate-500">({test.nameEn})</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                  {test.category}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-[10px] text-slate-600 mt-1 flex-wrap">
                                <span className="text-rose-900 font-semibold">
                                  النورمال: <strong className="font-mono text-slate-900">{normalDisplay}</strong>
                                </span>
                                <span>•</span>
                                <span className="text-indigo-900 font-semibold">
                                  الوحدة: <strong className="font-mono text-slate-900">{unitDisplay}</strong>
                                </span>
                                <span>•</span>
                                <span className="text-slate-500">
                                  العينة: {sampleDisplay}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md shrink-0">
                              ✓ مشمول
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Group 2: Additional individual tests on top of package if any */}
                  {extraItems.length > 0 && (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <FlaskConical className="w-3.5 h-3.5 text-rose-700" />
                          <span>تحاليل إضافية منفردة مطلوبة ({extraItems.length}):</span>
                        </span>
                        <span className="text-xs font-mono font-bold text-rose-900">
                          +{extraItems.reduce((sum, t) => sum + t.price, 0)} ج.م
                        </span>
                      </div>

                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {extraItems.map(test => {
                          const details = getTestDetails(test.code);
                          const normalDisplay = details?.textReference 
                            || (details?.minNormal !== undefined && details?.maxNormal !== undefined 
                                ? `${details.minNormal} - ${details.maxNormal} ${details.unit || ''}`.trim()
                                : 'معتمد طبياً');
                          const unitDisplay = details?.unit || test.unit || 'Score / Units';
                          const sampleDisplay = details?.sampleType || test.sampleType || 'Serum';

                          return (
                            <div
                              key={test.code}
                              className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs flex items-center justify-between hover:border-slate-300 transition-colors"
                            >
                              <div className="flex-1 min-w-0 pr-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px]">
                                    {test.code}
                                  </span>
                                  <span className="font-bold text-slate-900">{test.nameAr}</span>
                                  <span className="text-[10px] text-slate-500">({test.nameEn})</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                    {test.category}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-[10px] text-slate-600 mt-1 flex-wrap">
                                  <span className="text-rose-900 font-semibold">
                                    النورمال: <strong className="font-mono text-slate-900">{normalDisplay}</strong>
                                  </span>
                                  <span>•</span>
                                  <span className="text-indigo-900 font-semibold">
                                    الوحدة: <strong className="font-mono text-slate-900">{unitDisplay}</strong>
                                  </span>
                                  <span>•</span>
                                  <span className="text-slate-500">
                                    العينة: {sampleDisplay}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0 mr-2">
                                <span className="font-mono font-bold text-slate-900">{test.price} ج.م</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTest(test.code)}
                                  className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                                  title="حذف هذا التحليل"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Pure individual tests list */
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {selectedTests.map(test => {
                    const details = getTestDetails(test.code);
                    const normalDisplay = details?.textReference 
                      || (details?.minNormal !== undefined && details?.maxNormal !== undefined 
                          ? `${details.minNormal} - ${details.maxNormal} ${details.unit || ''}`.trim()
                          : 'معتمد طبياً');
                    const unitDisplay = details?.unit || test.unit || 'Score / Units';
                    const sampleDisplay = details?.sampleType || test.sampleType || 'Serum';

                    return (
                      <div
                        key={test.code}
                        className="p-2.5 rounded-xl border border-slate-200 bg-white text-xs flex items-center justify-between hover:border-slate-300 transition-colors shadow-2xs"
                      >
                        <div className="flex-1 min-w-0 pr-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-900 border border-rose-200 text-[10px]">
                              {test.code}
                            </span>
                            <span className="font-bold text-slate-900">{test.nameAr}</span>
                            <span className="text-[10px] text-slate-500">({test.nameEn})</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                              {test.category}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-slate-600 mt-1 flex-wrap">
                            <span className="text-rose-900 font-semibold">
                              المعدل الطبيعي: <strong className="font-mono text-slate-900">{normalDisplay}</strong>
                            </span>
                            <span>•</span>
                            <span className="text-indigo-900 font-semibold">
                              الوحدة: <strong className="font-mono text-slate-900">{unitDisplay}</strong>
                            </span>
                            <span>•</span>
                            <span className="text-slate-500">
                              العينة: {sampleDisplay}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 mr-2">
                          <span className="font-mono font-bold text-slate-900">{test.price} ج.م</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTest(test.code)}
                            className="text-slate-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
                            title="حذف هذا التحليل"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Financial Billing & Loyalty Cards (Col 5) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5 sticky top-28">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <CreditCard className="w-5 h-5 text-emerald-700" />
              <h2 className="font-black text-slate-800 text-base">الفوترة والخزينة ونقاط الولاء</h2>
            </div>

            {/* Booking Type: Branch or Home Visit */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">نوع الحجز والمقر:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBookingType('branch')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    bookingType === 'branch'
                      ? 'bg-rose-900 text-white border-rose-900 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  فحص بالمعمل
                </button>
                <button
                  type="button"
                  onClick={() => setBookingType('home_visit')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    bookingType === 'home_visit'
                      ? 'bg-rose-900 text-white border-rose-900 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  زيارة منزلية (+ رسوم)
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-xs">يوم الحجز:</label>
                  <input type="date" value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-xs">ساعة الحجز:</label>
                  <input type="time" value={appointmentTime} onChange={(e) => setAppointmentTime(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono" />
                </div>
              </div>

              {bookingType === 'home_visit' && (
                <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-2 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">عنوان الزيارة المنزلية:</label>
                    <input type="text" value={homeAddress} onChange={(e) => setHomeAddress(e.target.value)}
                      placeholder="رقم العقار، الشارع، المنطقة، الدور، الشقة"
                      className="w-full bg-white border border-rose-200 rounded-lg p-2 text-xs" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">تفاصيل الزيارة / ملاحظات الوصول:</label>
                    <textarea value={deliveryNotes} onChange={(e) => setDeliveryNotes(e.target.value)}
                      placeholder="علامة مميزة، دور، رقم شقة، مواعيد التواجد..." rows={2}
                      className="w-full bg-white border border-rose-200 rounded-lg p-2 text-xs" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">رسوم الزيارة المنزلية:</span>
                    <input type="number" value={homeVisitFee} onChange={(e) => setHomeVisitFee(Number(e.target.value))}
                      className="w-20 font-mono font-bold bg-white border border-rose-200 rounded-lg p-1 text-center" />
                  </div>
                </div>
              )}
            </div>

            {/* Loyalty Card Discount Section */}
            <div className="p-4 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-amber-950 flex items-center gap-1.5">
                  <Gift className="w-4 h-4 text-amber-700" />
                  <span>كارت ونقاط الولاء (RT Club)</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-mono">
                  {loyaltyProfile ? `كارت ${loyaltyProfile.tier}` : 'عضو جديد'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">نسبة الخصم المطبقة:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    className="w-16 font-mono font-bold bg-white border border-slate-200 rounded-lg p-1 text-center text-xs"
                  />
                  <span className="font-bold text-slate-700">%</span>
                </div>
              </div>

              {loyaltyProfile && loyaltyProfile.totalPoints >= 100 && (
                <div className="flex items-center justify-between text-xs pt-1 border-t border-amber-200">
                  <div className="space-y-0.5">
                    <span className="text-slate-700 font-bold block">استبدال رصيد النقاط:</span>
                    <span className="text-[10px] text-slate-500 block">
                      لديه {loyaltyProfile.totalPoints} نقطة = خصم نقدي {Math.floor(loyaltyProfile.totalPoints / 100) * loyaltyConfig.egpPer100Points} ج.م
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={redeemPoints}
                    onChange={(e) => setRedeemPoints(e.target.checked)}
                    className="w-4 h-4 text-rose-600 rounded cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Financial Summary */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">إجمالي التحاليل:</span>
                <span className="font-mono font-bold text-slate-800">{testsSubtotal} ج.م</span>
              </div>

              {effectiveVisitFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">رسوم الزيارة المنزلية:</span>
                  <span className="font-mono font-bold text-slate-800">+{effectiveVisitFee} ج.م</span>
                </div>
              )}

              {totalDiscount > 0 && (
                <div className="flex justify-between text-rose-700">
                  <span>إجمالي الخصم الممنوح:</span>
                  <span className="font-mono font-bold">-{totalDiscount} ج.م</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline text-sm">
                <span className="font-black text-slate-900">الصافي المطلوب سداده:</span>
                <span className="font-mono font-black text-emerald-800 text-lg">{netTotal} ج.م</span>
              </div>
            </div>

            {/* Payment Method & Paid Amount */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">طريقة السداد:</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                >
                  <option value="cash">نقداً (Cash بالخزينة)</option>
                  <option value="visa">بطاقة ائتمان / فيزا (Visa POS)</option>
                  <option value="instapay">إنستاباي (InstaPay)</option>
                  <option value="vodafone_cash">فودافون كاش / محافظ إلكترونية</option>
                  <option value="bank_transfer">تحويل بنكي</option>
                  <option value="deferred">آجل / مؤجل (Unpaid)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ المدفوع:</label>
                  <input
                    type="number"
                    min={0}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المتبقي كمديونية:</label>
                  <input
                    type="text"
                    disabled
                    value={`${remainingAmount} ج.م`}
                    className="w-full text-xs font-mono font-bold bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-slate-600"
                  />
                </div>
              </div>
            </div>

            {/* WhatsApp Booking Message Preview & Dispatch Button */}
            <button
              type="button"
              onClick={() => setIsWhatsAppModalOpen(true)}
              className="w-full py-3 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300 font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-emerald-700" />
              <span>معاينة وإرسال رسالة الحجز عبر واتساب للمريض</span>
            </button>

            {formError && (
              <div className="p-3.5 bg-rose-50 border-2 border-rose-300 text-rose-900 rounded-xl text-xs font-bold flex items-start gap-2 shadow-xs animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-900 to-rose-950 hover:from-rose-800 hover:to-rose-900 text-white font-black text-sm shadow-xl shadow-rose-950/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5 text-rose-300" />
              <span>إتمام التسجيل وإصدار الفاتورة وإرسال العينة للمعمل</span>
            </button>
          </div>
        </div>
      </form>
      {/* Professional WhatsApp Booking Modal */}
      <WhatsAppBookingModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        bookingData={bookingModalData}
      />
    </div>
  );
};
