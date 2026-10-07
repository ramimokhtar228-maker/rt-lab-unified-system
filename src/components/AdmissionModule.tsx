import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
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
  Building2,
  Home,
  MapPin,
  ChevronDown,
  ChevronUp,
  FileText,
  Save,
  Eye,
  Copy,
  BookOpen,
  Filter,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { Patient, InvoiceTestItem, PaymentMethod, ComprehensivePackage } from '../types';
import { LAB_CATALOG } from '../data/labCatalog';
import { INITIAL_INDIVIDUAL_TESTS } from '../data/individualTestsData';
import { SmartTestSearch } from './SmartTestSearch';
import { formatBookingConfirmationWhatsAppMessage, openWhatsApp, BRANCH_MAIN_ADDRESS, LAB_PHONE, LAB_NAME_AR } from '../utils/whatsapp';

interface AdmissionModuleProps {
  onSuccess?: () => void;
  isModal?: boolean;
}

export const AdmissionModule: React.FC<AdmissionModuleProps> = ({ onSuccess, isModal = false }) => {
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

  const today = new Date().toISOString().split('T')[0];
  const nextLabNumber = `RT-2026-${String(reports.length + 1).padStart(3, '0')}`;
  const nextBarcode = `RT-${10030 + reports.length + 1}`;

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
  
  // Booking & Visit details
  const [bookingType, setBookingType] = useState<'branch' | 'home_visit'>('branch');
  const [homeAddress, setHomeAddress] = useState('');
  const [homeContactPhone, setHomeContactPhone] = useState('');
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

  // Catalog Directory View Mode (To browse all tests with exact matching prices)
  const [testsTabMode, setTestsTabMode] = useState<'search' | 'directory'>('search');
  const [directorySearch, setDirectorySearch] = useState('');
  const [directoryCategory, setDirectoryCategory] = useState<string>('All');

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [redeemPoints, setRedeemPoints] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [createdLabNum, setCreatedLabNum] = useState<string>('');
  
  // Modal Preview & Copy State
  const [previewWhatsAppModalOpen, setPreviewWhatsAppModalOpen] = useState(false);
  const [copiedFeedback, setCopiedFeedback] = useState(false);

  // Active tests catalog source (guaranteed exact matching with CatalogBrowser)
  const allCatalogTests: InvoiceTestItem[] = useMemo(() => {
    return (testCatalog && testCatalog.length > 0) ? testCatalog : INITIAL_INDIVIDUAL_TESTS;
  }, [testCatalog]);

  // Unique categories for the catalog directory
  const catalogCategories = useMemo(() => {
    const set = new Set<string>();
    allCatalogTests.forEach(t => {
      if (t.category) set.add(t.category);
    });
    return ['All', ...Array.from(set)];
  }, [allCatalogTests]);

  // Filtered catalog tests for the direct listing directory
  const filteredCatalogTests = useMemo(() => {
    const q = directorySearch.trim().toLowerCase();
    return allCatalogTests.filter(test => {
      const matchCat = directoryCategory === 'All' || test.category === directoryCategory;
      if (!matchCat) return false;
      if (!q) return true;
      return (
        test.code.toLowerCase().includes(q) ||
        test.nameAr.toLowerCase().includes(q) ||
        test.nameEn.toLowerCase().includes(q) ||
        (test.category && test.category.toLowerCase().includes(q))
      );
    });
  }, [allCatalogTests, directoryCategory, directorySearch]);

  // Category Arabic Labels helper
  const getCategoryLabelAr = (cat: string) => {
    switch (cat) {
      case 'All': return 'الكل (جميع الفحوصات)';
      case 'Hematology': return 'صورة الدم وأمراض الدم';
      case 'Diabetes': return 'السكر والتمثيل الغذائي';
      case 'Liver Function': return 'وظائف الكبد';
      case 'Kidney Function': return 'وظائف الكلى';
      case 'Lipid Profile': return 'الدهون والكوليسترول';
      case 'Thyroid': return 'الغدة الدرقية';
      case 'Endocrinology': return 'الغدد والهرمونات';
      case 'Fertility & Hormones': return 'الخصوبة وهرمونات الإنجاب';
      case 'Coagulation': return 'السيولة والتجلط';
      case 'Cardiac': return 'القلب وإنزيمات القلب';
      case 'Anemia & Vitamins': return 'الأنيميا والفيتامينات';
      case 'Minerals & Bone': return 'المعادن والكالسيوم';
      case 'Immunology': return 'المناعة والروماتيزم';
      case 'Infectious & Viral': return 'الفيروسات والأمراض المعدية';
      case 'Urinalysis & Parasitology': return 'البول والبراز والطفيليات';
      case 'Microbiology': return 'المزارع والحساسية';
      case 'Tumor Markers': return 'دلالات الأورام';
      case 'Pancreas': return 'البنكرياس والجهاز الهضمي';
      case 'Biochemistry': return 'الكيمياء الحيوية العامة';
      default: return cat;
    }
  };

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
    if (loyaltyProfile && !selectedPackage && discountPercent === 0) {
      const tierConfig = loyaltyConfig.tiers[loyaltyProfile.tier];
      if (tierConfig && tierConfig.discountRate > 0) {
        setDiscountPercent(tierConfig.discountRate);
      }
    }
  }, [loyaltyProfile, loyaltyConfig, discountPercent, selectedPackage]);

  // Financial Calculations
  const getTestDetails = (code: string) => {
    return allCatalogTests.find(t => t.code.toUpperCase() === code.toUpperCase())
        || INITIAL_INDIVIDUAL_TESTS.find(t => t.code.toUpperCase() === code.toUpperCase());
  };

  const { packageItems, extraItems } = useMemo(() => {
    if (!selectedPackage) {
      return { packageItems: [], extraItems: selectedTests };
    }
    const packageCodes = new Set([
      ...selectedPackage.includedProfiles.map(c => c.toUpperCase()),
      ...selectedPackage.includedIndividualTestCodes.map(c => c.toUpperCase())
    ]);
    const pkg = selectedTests.filter(t => packageCodes.has(t.code.toUpperCase()));
    const extra = selectedTests.filter(t => !packageCodes.has(t.code.toUpperCase()));
    return { packageItems: pkg, extraItems: extra };
  }, [selectedPackage, selectedTests]);

  const testsSubtotal = useMemo(() => {
    if (selectedPackage) {
      const packageCodes = new Set([
        ...selectedPackage.includedProfiles.map(c => c.toUpperCase()),
        ...selectedPackage.includedIndividualTestCodes.map(c => c.toUpperCase())
      ]);
      const extraTestsCost = selectedTests
        .filter(t => !packageCodes.has(t.code.toUpperCase()))
        .reduce((sum, t) => sum + (t.price || 0), 0);
      return selectedPackage.packagePrice + extraTestsCost;
    }
    return selectedTests.reduce((sum, t) => sum + (t.price || 0), 0);
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

  // Auto set paid amount to netTotal
  useEffect(() => {
    setPaidAmount(netTotal);
  }, [netTotal]);

  const remainingAmount = Math.max(0, netTotal - paidAmount);

  // Toggle Test Handler
  const handleToggleTest = (test: InvoiceTestItem) => {
    if (selectedTests.some(t => t.code.toUpperCase() === test.code.toUpperCase())) {
      setSelectedTests(prev => prev.filter(t => t.code.toUpperCase() !== test.code.toUpperCase()));
    } else {
      // Always guarantee official price from catalog
      const officialTest = allCatalogTests.find(t => t.code.toUpperCase() === test.code.toUpperCase()) || test;
      setSelectedTests(prev => [...prev, officialTest]);
    }
  };

  const handleToggleProfile = (profile: any) => {
    if (selectedTests.some(t => t.code.toUpperCase() === profile.code.toUpperCase())) {
      setSelectedTests(prev => prev.filter(t => t.code.toUpperCase() !== profile.code.toUpperCase()));
    } else {
      setSelectedTests(prev => [
        ...prev,
        {
          id: `prof-${profile.code}`,
          code: profile.code,
          nameAr: profile.titleAr,
          nameEn: profile.titleEn,
          category: profile.category,
          price: profile.profilePrice || 250,
          sampleType: profile.sampleType
        }
      ]);
    }
  };

  const handleRemoveTest = (code: string) => {
    setSelectedTests(prev => prev.filter(t => t.code.toUpperCase() !== code.toUpperCase()));
  };

  // Add / Switch Package
  const handleSelectPackage = (pkgId: string) => {
    if (selectedPackageId === pkgId) {
      setSelectedPackageId('');
      setSelectedTests([]);
      setDiscountPercent(0);
      return;
    }
    const pkg = packages.find(p => p.id === pkgId);
    if (!pkg) return;
    setSelectedPackageId(pkg.id);
    
    const pkgTests: InvoiceTestItem[] = [];
    pkg.includedProfiles.forEach(code => {
      const foundProfile = LAB_CATALOG.find(p => p.code.toUpperCase() === code.toUpperCase());
      if (foundProfile) {
        pkgTests.push({
          id: `prof-${foundProfile.code}`,
          code: foundProfile.code,
          nameAr: foundProfile.titleAr,
          nameEn: foundProfile.titleEn,
          category: foundProfile.category,
          price: foundProfile.profilePrice || 250,
          sampleType: foundProfile.sampleType
        });
      }
    });

    pkg.includedIndividualTestCodes.forEach(code => {
      const found = allCatalogTests.find(t => t.code.toUpperCase() === code.toUpperCase())
                 || INITIAL_INDIVIDUAL_TESTS.find(t => t.code.toUpperCase() === code.toUpperCase());
      if (found && !pkgTests.some(t => t.code.toUpperCase() === found.code.toUpperCase())) {
        pkgTests.push(found);
      }
    });

    setSelectedTests(pkgTests);
  };

  // Build Formatted WhatsApp Message strictly according to requirements:
  // 1. ترحيب بالمريض
  // 2. البيانات الشخصية وموعد الحجز (يوم وتاريخ وساعة الحجز) ورقم التواصل ونوع الحجز
  // 3. عنوان وتفاصيل الزيارة والتواصل في حالة الزيارة المنزلية / عنوان ومقر الفرع والتواصل في حالة الحضور
  // 4. التحاليل المطلوبة اختصارات فقط بدون سعر
  // 5. السعر الأصلي إجمالي
  // 6. نسبة الخصم أو كرت الولاء
  // 7. السعر بعد الخصم
  // 8. رسوم الزيارة
  // 9. إجمالي الصافي المطلوب سداده وطريقة السداد
  // 10. تعليمات وشروط ما قبل التحاليل
  // 11. ترحيب آخر وتمنيات بالشفاء العاجل
  const buildWhatsAppMessage = (bookingNumOverride?: string) => {
    const bookingCode = bookingNumOverride || (isSubmitted && createdLabNum ? createdLabNum : nextLabNumber);
    
    // Extract test abbreviations ONLY (no prices!)
    const abbreviations: string[] = [];
    if (selectedPackage) {
      if (selectedPackage.includedProfiles && selectedPackage.includedProfiles.length > 0) {
        selectedPackage.includedProfiles.forEach((p: string) => {
          if (!abbreviations.includes(p)) abbreviations.push(p);
        });
      }
      if (selectedPackage.includedIndividualTestCodes && selectedPackage.includedIndividualTestCodes.length > 0) {
        selectedPackage.includedIndividualTestCodes.forEach((t: string) => {
          if (!abbreviations.includes(t)) abbreviations.push(t);
        });
      }
      selectedTests.forEach(t => {
        const code = (t.code || t.nameEn || t.nameAr).trim();
        if (code && !abbreviations.includes(code)) {
          abbreviations.push(code);
        }
      });
      if (abbreviations.length === 0 && selectedPackage.code) {
        abbreviations.push(selectedPackage.code);
      }
    } else {
      selectedTests.forEach(t => {
        const code = (t.code || t.nameEn || t.nameAr).trim();
        if (code && !abbreviations.includes(code)) {
          abbreviations.push(code);
        }
      });
    }

    const testsListFormatted = abbreviations.length > 0 
      ? abbreviations.map((a, i) => `• ${a}`).join('\n')
      : '• لا توجد تحاليل مسجلة';

    let discountLabel = 'لا يوجد خصم';
    if (selectedPackage) {
      discountLabel = `باقة (${selectedPackage.titleAr}) - خصم باقة شامل`;
    } else if (loyaltyProfile && discountPercent > 0) {
      discountLabel = `كارت ولاء RT (${loyaltyProfile.cardNumber || loyaltyProfile.tier}) - خصم ${discountPercent}%`;
    } else if (discountPercent > 0) {
      discountLabel = `خصم معتمد ${discountPercent}%`;
    } else if (totalDiscount > 0) {
      discountLabel = `خصم مطبق بقيمة ${totalDiscount} ج.م`;
    }

    const contactForVisit = bookingType === 'home_visit' 
      ? (homeContactPhone.trim() || phone.trim())
      : phone.trim();

    return formatBookingConfirmationWhatsAppMessage({
      patientName: fullName.trim() || 'العميل الكريم',
      labNumber: bookingCode,
      phone: contactForVisit,
      date: appointmentDate || today,
      time: appointmentTime || '09:00 ص',
      isHomeVisit: bookingType === 'home_visit',
      address: homeAddress.trim(),
      deliveryNotes: deliveryNotes.trim(),
      branchAddress: labInfo?.mainAddress || BRANCH_MAIN_ADDRESS,
      testsList: testsListFormatted,
      subtotal: testsSubtotal,
      discountAmount: totalDiscount,
      discountLabel,
      visitFee: effectiveVisitFee,
      netAmount: netTotal,
      paymentMethod: paymentMethod === 'cash' ? 'نقداً (كاش)' : paymentMethod === 'visa' ? 'بطاقة ائتمانية (فيزا)' : paymentMethod === 'instapay' ? 'إنستاباي' : String(paymentMethod),
      fastingHours: Number(fastingHours) || 0
    });
  };

  // Submit Admission Handler
  const handleSaveOnly = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!fullName.trim()) {
      alert("يرجى إدخال اسم المريض بالكامل.");
      return null;
    }
    if (selectedTests.length === 0) {
      alert("يرجى اختيار تحليل واحد على الأقل للمريض.");
      return null;
    }

    if (bookingType === 'home_visit' && !homeAddress.trim()) {
      alert("يرجى إدخال عنوان الزيارة المنزلية بالتفصيل.");
      return null;
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
      referringDoctorName: referringDoctor.trim(),
      sampleDate: appointmentDate || today,
      reportingDate: appointmentDate || today,
      clinicalHistory: clinicalHistory.trim() || undefined,
      fastingHours: Number(fastingHours) || 0,
      bookingType,
      homeAddress: bookingType === 'home_visit' ? homeAddress.trim() : undefined,
      visitFee: effectiveVisitFee,
      appointmentDate,
      appointmentTime,
      deliveryNotes: bookingType === 'home_visit' ? deliveryNotes.trim() : undefined,
      testsSubtotal,
      totalCost: netTotal,
      discountApplied: totalDiscount,
      paymentMethod: (paymentMethod as any) || 'cash'
    };

    const createdReport = createReportFromAdmission(
      patientRecord,
      selectedTests,
      selectedPackage || undefined
    );

    if (phone.trim()) {
      if (redeemPoints && pointsRedeemValue > 0) {
        redeemLoyaltyPoints(phone.trim(), Math.floor(loyaltyProfile!.totalPoints / 100) * 100, createdReport.reportNumber, pointsRedeemValue);
      }
      earnLoyaltyPoints(phone.trim(), paidAmount, createdReport.reportNumber, fullName.trim(), nextBarcode);
    }

    setCreatedLabNum(createdReport.reportNumber);
    setIsSubmitted(true);
    if (onSuccess) {
      onSuccess();
    }
    return createdReport.reportNumber;
  };

  // Combined Save & Send WhatsApp
  const handleSaveAndSendWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    const createdNumber = handleSaveOnly();
    if (!createdNumber) return;

    const message = buildWhatsAppMessage(createdNumber);
    const targetPhone = phone.trim() || homeContactPhone.trim();
    if (targetPhone) {
      openWhatsApp(targetPhone, message);
    }
  };

  // Standalone Direct Send WhatsApp
  const handleSendWhatsAppDirect = () => {
    const targetPhone = phone.trim() || homeContactPhone.trim();
    if (!targetPhone) {
      alert("يرجى إدخال رقم هاتف المريض أولاً لإرسال رسالة الواتساب.");
      return;
    }
    const message = buildWhatsAppMessage();
    openWhatsApp(targetPhone, message);
  };

  // Copy WhatsApp Message to Clipboard
  const handleCopyWhatsAppMessage = () => {
    const message = buildWhatsAppMessage();
    navigator.clipboard.writeText(message).then(() => {
      setCopiedFeedback(true);
      setTimeout(() => setCopiedFeedback(false), 2500);
    }).catch(() => {
      alert("تم نسخ الرسالة بنجاح!");
    });
  };

  // Confirmation Success Screen
  if (isSubmitted) {
    const currentMsg = buildWhatsAppMessage(createdLabNum);
    return (
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6 max-w-3xl mx-auto my-6 animate-in zoom-in-95 text-right">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-slate-900">تم تسجيل المريض وحفظ الحجز بنجاح!</h2>
          <p className="text-slate-500 text-sm">
            تم إصدار الفاتورة وإدراج العينة في قائمة عمل المعمل برقم: <strong className="text-rose-900 font-mono text-base">{createdLabNum}</strong>
          </p>
        </div>

        {/* Summary Card */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2 font-medium">
          <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
            <span className="text-slate-500 font-bold">اسم المريض:</span>
            <strong className="text-slate-900 text-sm">{fullName}</strong>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">نوع الحجز والموعد:</span>
            <strong className="font-bold text-slate-800">
              {bookingType === 'home_visit' ? '🏠 زيارة منزلية خاصة' : '🏥 حضور بمقر الفرع'} — {appointmentDate} ({appointmentTime})
            </strong>
          </div>
          {bookingType === 'home_visit' && (
            <div className="flex justify-between items-center">
              <span className="text-slate-500">عنوان الزيارة المنزلية:</span>
              <strong className="text-slate-700 max-w-[65%] truncate">{homeAddress}</strong>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-slate-500">باركود العينة:</span>
            <strong className="font-mono text-rose-900">{nextBarcode}</strong>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">الصافي المطلوب:</span>
            <strong className="font-mono text-emerald-700">{netTotal} ج.م (المدفوع: {paidAmount} ج.م)</strong>
          </div>
        </div>

        {/* WhatsApp Message Preview Box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>نص رسالة واتساب التأكيد المجهزة للإرسال:</span>
            </label>
            <button
              type="button"
              onClick={handleCopyWhatsAppMessage}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedFeedback ? 'تم النسخ بنجاح! ✓' : 'نسخ نص الرسالة'}</span>
            </button>
          </div>

          <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto border border-slate-700 selection:bg-emerald-500 selection:text-white" dir="rtl">
            {currentMsg}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {phone && (
            <button
              onClick={() => openWhatsApp(phone, currentMsg)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-900/20 active:scale-[0.99] transition-all cursor-pointer"
            >
              <MessageCircle className="w-5 h-5 text-white" />
              <span>إرسال رسالة واتساب التأكيد للمريض الآن (WhatsApp)</span>
            </button>
          )}

          <button
            onClick={() => {
              setActiveTab('diagnostic_editor');
              if (isModal) setIsPatientFormOpen(false);
            }}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-900 hover:bg-rose-800 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
          >
            <FlaskConical className="w-4 h-4" />
            <span>الانتقال لإدخال النتائج الطبية</span>
          </button>

          <button
            onClick={() => {
              setIsSubmitted(false);
              setFullName('');
              setPhone('');
              setNationalId('');
              setHomeAddress('');
              setDeliveryNotes('');
              setClinicalHistory('');
              setSelectedTests([]);
              setSelectedPackageId('');
              if (isModal) setIsPatientFormOpen(false);
            }}
            className="px-4 py-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            تسجيل مريض آخر
          </button>
        </div>
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
                  <h1 className="text-2xl font-black tracking-tight">تسجيل مريض وحجز التحاليل الطبية والفوترة</h1>
                  <p className="text-slate-300 text-xs sm:text-sm font-medium">
                    تسجيل شامل مفعل لمواعيد الحضور بالفرع والزيارات المنزلية مع توليد رسائل واتساب التأكيد ومطابقة أسعار الكتالوج
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
      <form onSubmit={handleSaveAndSendWhatsApp} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Demographics & Test Selector (Col 7) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Patient Demographics */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="w-5 h-5 text-rose-700" />
              <h2 className="font-black text-slate-800 text-base">البيانات الشخصية والطبية للمريض</h2>
            </div>

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
                  رقم الهاتف / الواتساب: <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
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
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">العمر:</label>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الوحدة:</label>
                  <select
                    value={ageUnit}
                    onChange={(e) => setAgeUnit(e.target.value as any)}
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value="years">سنة (Years)</option>
                    <option value="months">شهر (Months)</option>
                    <option value="days">يوم (Days)</option>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">ساعات الصيام الفعلية:</label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">التاريخ المرضي / ملاحظات التشخيص:</label>
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

          {/* Card 2: Tests & Packages Selection with Catalog Price Matching Directory */}
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

            {/* View Mode Switcher: Instant Search VS Full Catalog Directory */}
            <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setTestsTabMode('search')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  testsTabMode === 'search'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Search className="w-4 h-4 text-rose-700" />
                <span>البحث الذكي السريع والباقات</span>
              </button>
              <button
                type="button"
                onClick={() => setTestsTabMode('directory')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  testsTabMode === 'directory'
                    ? 'bg-rose-900 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>سرد كافة تحاليل الكتالوج بأسعارها المعتمدة ({allCatalogTests.length})</span>
              </button>
            </div>

            {/* TAB 1: Smart Search & Packages */}
            {testsTabMode === 'search' && (
              <div className="space-y-4">
                {/* Quick Packages Shortcuts */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500">باقات الفحص الشاملة المعتمدة:</span>
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

                {/* Smart Test Search Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-rose-600" />
                      البحث الذكي المباشر عن التحاليل:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const res = forceSyncCatalog();
                        alert(`✅ تم تحديث ومزامنة الكتالوج بنجاح (${res.testsCount} فحص + ${res.packagesCount} باقة).`);
                      }}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1 transition-colors"
                    >
                      <Sparkles className="w-3 h-3 text-emerald-600 animate-pulse" />
                      <span>مزامنة الأسعار ({allCatalogTests.length})</span>
                    </button>
                  </div>

                  <SmartTestSearch
                    packages={packages}
                    profiles={diagnosticProfiles && diagnosticProfiles.length > 0 ? diagnosticProfiles : LAB_CATALOG}
                    individualTests={allCatalogTests as any}
                    selectedItemCodes={selectedTests.map(t => t.code)}
                    onToggleTest={handleToggleTest}
                    onSelectPackage={(pkg) => handleSelectPackage(pkg.id)}
                    onToggleProfile={handleToggleProfile}
                    compact={true}
                  />
                </div>
              </div>
            )}

            {/* TAB 2: Full Catalog Tests & Official Price Directory */}
            {testsTabMode === 'directory' && (
              <div className="space-y-3 p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={directorySearch}
                      onChange={(e) => setDirectorySearch(e.target.value)}
                      placeholder="ابحث باسم التحليل أو الرمز (CBC, FBS, ALT, TSH...)"
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                      الأسعار مطابقة 100% لدليل التحاليل
                    </span>
                  </div>
                </div>

                {/* Category Pills */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
                  {catalogCategories.map(cat => {
                    const isSelected = directoryCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setDirectoryCategory(cat)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-rose-900 text-white shadow-sm'
                            : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200/80'
                        }`}
                      >
                        {getCategoryLabelAr(cat)}
                      </button>
                    );
                  })}
                </div>

                {/* Tests Table / List with Exact Prices */}
                <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1 border border-slate-200 rounded-xl p-1 bg-white">
                  {filteredCatalogTests.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      لا توجد تحاليل تطابق معايير البحث.
                    </div>
                  ) : (
                    filteredCatalogTests.map(test => {
                      const isSelected = selectedTests.some(t => t.code.toUpperCase() === test.code.toUpperCase());
                      return (
                        <div
                          key={test.code}
                          onClick={() => handleToggleTest(test)}
                          className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-rose-50/80 border-rose-400 shadow-xs'
                              : 'bg-white hover:bg-slate-50 border-slate-200/80'
                          }`}
                        >
                          <div className="flex-1 min-w-0 pr-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-black text-rose-950 bg-rose-100/90 px-2 py-0.5 rounded text-[11px]">
                                {test.code}
                              </span>
                              <span className="font-bold text-slate-900">{test.nameAr}</span>
                              <span className="text-[10px] text-slate-500 font-mono">({test.nameEn})</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                                {getCategoryLabelAr(test.category || '')}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1">
                              <span>العينة: {test.sampleType || 'سيرم'}</span>
                              {test.fastingInstructions && (
                                <span className="text-amber-800 font-medium">⚠️ {test.fastingInstructions}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 mr-2">
                            <div className="text-left font-mono">
                              <span className="font-black text-rose-900 text-sm">{test.price}</span>
                              <span className="text-[10px] text-slate-500 mr-1">ج.م</span>
                            </div>

                            <button
                              type="button"
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-100 hover:bg-rose-900 hover:text-white text-slate-700 border border-slate-200'
                              }`}
                            >
                              {isSelected ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>محدد للحجز</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>إضافة</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

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
                  لم يتم اختيار أي تحاليل بعد. استخدم شريط البحث أو دليل التحاليل أعلاه لإضافة الفحوصات.
                </div>
              ) : selectedPackage ? (
                <div className="space-y-3">
                  {/* Group 1: Package Tests */}
                  <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-3 space-y-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-amber-200/60">
                      <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-amber-700" />
                        <span>فحوصات الباقة المعتمدة ({packageItems.length} فحص):</span>
                      </span>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        مشمولة بسعر الباقة ({selectedPackage.packagePrice} ج.م)
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {packageItems.map(test => (
                        <div
                          key={test.code}
                          className="p-2 rounded-xl bg-white border border-amber-100 text-xs flex items-center justify-between hover:border-amber-300 transition-colors"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px]">
                              {test.code}
                            </span>
                            <span className="font-bold text-slate-900">{test.nameAr}</span>
                            <span className="text-[10px] text-slate-500 font-mono">({test.nameEn})</span>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            ✓ مشمول
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Group 2: Additional Extra Tests */}
                  {extraItems.length > 0 && (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <FlaskConical className="w-3.5 h-3.5 text-rose-700" />
                          <span>تحاليل إضافية منفردة مطلوبة ({extraItems.length}):</span>
                        </span>
                        <span className="text-xs font-mono font-bold text-rose-900">
                          +{extraItems.reduce((sum, t) => sum + (t.price || 0), 0)} ج.م
                        </span>
                      </div>

                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {extraItems.map(test => (
                          <div
                            key={test.code}
                            className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs flex items-center justify-between"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px]">
                                {test.code}
                              </span>
                              <span className="font-bold text-slate-900">{test.nameAr}</span>
                              <span className="text-[10px] text-slate-500">({test.nameEn})</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900">{test.price} ج.م</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveTest(test.code)}
                                className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Pure individual tests list with accurate catalog price */
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {selectedTests.map(test => (
                    <div
                      key={test.code}
                      className="p-2.5 rounded-xl border border-slate-200 bg-white text-xs flex items-center justify-between hover:border-slate-300 transition-colors shadow-2xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black px-2 py-0.5 rounded bg-rose-50 text-rose-950 border border-rose-200 text-[11px]">
                          {test.code}
                        </span>
                        <span className="font-bold text-slate-900">{test.nameAr}</span>
                        <span className="text-[10px] text-slate-500 font-mono">({test.nameEn})</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-slate-900 text-sm">{test.price} ج.م</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTest(test.code)}
                          className="text-slate-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
                          title="حذف التحليل"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Appointment, Visit Details, Treasury & WhatsApp (Col 5) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5 sticky top-28">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Calendar className="w-5 h-5 text-rose-700" />
              <h2 className="font-black text-slate-800 text-base">تحديد موعد ومقر الفحص والزيارة</h2>
            </div>

            {/* Booking Type Selector: Branch vs Home Visit */}
            <div className="space-y-3 bg-slate-50/90 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-800" />
                  <span>نوع الحجز ومقر الفحص:</span>
                </label>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${bookingType === 'home_visit' ? 'bg-rose-100 text-rose-900 border border-rose-300' : 'bg-blue-100 text-blue-900 border border-blue-300'}`}>
                  {bookingType === 'home_visit' ? 'زيارة منزلية خاصة 🏠' : 'حضور بمقر الفرع 🏥'}
                </span>
              </div>

              {/* Toggle Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBookingType('branch')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    bookingType === 'branch'
                      ? 'bg-rose-900 text-white border-rose-900 shadow-md ring-2 ring-rose-300'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>حضور بمقر الفرع</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBookingType('home_visit')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    bookingType === 'home_visit'
                      ? 'bg-rose-900 text-white border-rose-900 shadow-md ring-2 ring-rose-300'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Home className="w-4 h-4" />
                  <span>زيارة منزلية (+ رسوم)</span>
                </button>
              </div>

              {/* Booking Date & Time: Always Active for Both Branch and Home Visit */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-xs">
                      يوم وتاريخ الحجز: <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="date"
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-mono font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                      required
                    />
                    <div className="flex gap-1 mt-1.5">
                      <button
                        type="button"
                        onClick={() => setAppointmentDate(today)}
                        className={`flex-1 py-0.5 text-[10px] font-bold rounded cursor-pointer ${appointmentDate === today ? 'bg-rose-900 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                      >
                        اليوم
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const tm = new Date();
                          tm.setDate(tm.getDate() + 1);
                          setAppointmentDate(tm.toISOString().split('T')[0]);
                        }}
                        className="flex-1 py-0.5 text-[10px] font-bold rounded bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer"
                      >
                        غداً
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const tm = new Date();
                          tm.setDate(tm.getDate() + 2);
                          setAppointmentDate(tm.toISOString().split('T')[0]);
                        }}
                        className="flex-1 py-0.5 text-[10px] font-bold rounded bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer"
                      >
                        بعد غد
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-xs">
                      ساعة وتوقيت الحجز: <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="time"
                      value={appointmentTime}
                      onChange={(e) => setAppointmentTime(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-mono font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                      required
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {['08:30', '10:00', '11:30', '17:00', '19:30', '21:00'].map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setAppointmentTime(t)}
                          className={`px-1.5 py-0.5 text-[9px] font-mono rounded cursor-pointer ${appointmentTime === t ? 'bg-rose-900 text-white font-bold' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Branch Address Card (If Branch Attendance) */}
              {bookingType === 'branch' && (
                <div className="p-3.5 bg-blue-50/90 border border-blue-200 rounded-xl space-y-1.5 text-xs">
                  <div className="font-black text-blue-950 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-700" />
                    <span>عنوان وبيانات فرع المعمل للحضور:</span>
                  </div>
                  <p className="text-slate-800 font-medium text-xs leading-relaxed bg-white/70 p-2 rounded-lg border border-blue-100">
                    📍 {labInfo?.mainAddress || BRANCH_MAIN_ADDRESS}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-blue-900 font-semibold pt-1">
                    <span>📞 تليفون الفرع: {LAB_PHONE}</span>
                    <span>🕒 مواعيد العمل: 8:00 ص - 11:00 م</span>
                  </div>
                </div>
              )}

              {/* Home Visit Address & Details Card (If Home Visit) */}
              {bookingType === 'home_visit' && (
                <div className="p-3.5 bg-rose-50/90 border border-rose-200 rounded-xl space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-900 block mb-1">
                      عنوان الزيارة المنزلية بالتفصيل <span className="text-rose-600">*</span>:
                    </label>
                    <input
                      type="text"
                      value={homeAddress}
                      onChange={(e) => setHomeAddress(e.target.value)}
                      placeholder="رقم العقار، اسم الشارع، المنطقة، الدور، رقم الشقة، علامة مميزة..."
                      className="w-full bg-white border border-rose-300 rounded-xl p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none font-medium"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-900 block mb-1">
                        تليفون التواصل للزيارة:
                      </label>
                      <input
                        type="tel"
                        value={homeContactPhone}
                        onChange={(e) => setHomeContactPhone(e.target.value)}
                        placeholder={phone || "010XXXXXXXX"}
                        className="w-full bg-white border border-rose-200 rounded-xl p-2 text-xs font-mono text-slate-900"
                        dir="ltr"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => setHomeContactPhone(phone)}
                        disabled={!phone}
                        className="w-full py-2 px-2 bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold text-[11px] rounded-xl border border-rose-300 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        استخدام هاتف المريض ({phone || 'غير مسجل'})
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-900 block mb-1">تفاصيل وملاحظات الزيارة ومسؤول السحب:</label>
                    <textarea
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                      placeholder="أقرب علامة مميزة، رقم الشقة، حالة المريض الصحية، أي تعليمات خاصة..."
                      rows={2}
                      className="w-full bg-white border border-rose-200 rounded-xl p-2 text-xs text-slate-900"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-rose-200">
                    <span className="text-slate-800 font-bold">رسوم الزيارة المنزلية:</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={homeVisitFee}
                        onChange={(e) => setHomeVisitFee(Number(e.target.value))}
                        className="w-20 font-mono font-black bg-white border border-rose-300 rounded-xl p-1.5 text-center text-xs text-rose-900"
                      />
                      <span className="text-slate-700 font-bold">ج.م</span>
                    </div>
                  </div>
                  <div className="flex gap-1 justify-end">
                    {[50, 70, 80, 100, 120].map(fee => (
                      <button
                        key={fee}
                        type="button"
                        onClick={() => setHomeVisitFee(fee)}
                        className={`px-2 py-0.5 text-[10px] font-mono rounded-lg cursor-pointer ${homeVisitFee === fee ? 'bg-rose-900 text-white font-bold' : 'bg-white border border-rose-200 text-slate-700'}`}
                      >
                        {fee} ج
                      </button>
                    ))}
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
                <span className="text-slate-500">السعر الأصلي الإجمالي (التحاليل):</span>
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
              <div className="flex justify-between text-slate-600">
                <span>السعر بعد الخصم:</span>
                <span className="font-mono font-bold">{Math.max(0, testsSubtotal - totalDiscount)} ج.م</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline text-sm">
                <span className="font-black text-slate-900">إجمالي الصافي المطلوب سداده:</span>
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
                    max={netTotal}
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

            {/* Save & WhatsApp Action Buttons with Clear Icons */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              {/* 1. Combined Primary Button: Save & Send WhatsApp Confirmation */}
              <button
                type="submit"
                className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs sm:text-sm shadow-xl shadow-emerald-950/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 cursor-pointer ring-2 ring-emerald-400/50"
              >
                <Save className="w-5 h-5 text-emerald-200 shrink-0" />
                <MessageCircle className="w-5 h-5 text-white shrink-0" />
                <span>حفظ الحجز والمريض وإرسال واتساب التأكيد فوراً</span>
              </button>

              {/* 2. Secondary Button: Save Only */}
              <button
                type="button"
                onClick={() => handleSaveOnly()}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-900 to-rose-950 hover:from-rose-800 hover:to-rose-900 text-white font-black text-xs shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-rose-300" />
                <span>حفظ الحجز وإصدار الفاتورة فقط (بدون واتساب)</span>
              </button>

              {/* 3. Direct WhatsApp Send & Preview Row */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSendWhatsAppDirect}
                  disabled={!phone.trim() || selectedTests.length === 0}
                  className="py-2.5 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 disabled:opacity-50 font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  title="إرسال رسالة واتساب التأكيد للرقم المسجل"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>إرسال واتساب الآن</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewWhatsAppModalOpen(true)}
                  className="py-2.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-600" />
                  <span>معاينة رسالة الواتساب</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* WhatsApp Message Preview Modal */}
      {previewWhatsAppModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-slate-900 text-base">معاينة رسالة واتساب التأكيد</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewWhatsAppModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold px-2 py-1 rounded-lg"
              >
                إغلاق ✕
              </button>
            </div>

            <div className="p-3 bg-slate-900 text-slate-100 rounded-2xl text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto border border-slate-700 selection:bg-emerald-500 selection:text-white" dir="rtl">
              {buildWhatsAppMessage()}
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={handleCopyWhatsAppMessage}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-300 cursor-pointer"
              >
                <Copy className="w-4 h-4 text-slate-600" />
                <span>{copiedFeedback ? 'تم النسخ بنجاح! ✓' : 'نسخ الرسالة للحافظة'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleSendWhatsAppDirect();
                  setPreviewWhatsAppModalOpen(false);
                }}
                disabled={!phone.trim()}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md disabled:opacity-50 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-white" />
                <span>إرسال عبر الواتساب الآن</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
