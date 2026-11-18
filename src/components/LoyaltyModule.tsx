import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PatientLoyaltyProfile, LoyaltyTier, LoyaltyConfig } from '../types';
import { DEFAULT_LOYALTY_CONFIG } from '../data/catalog';
import {
  LOYALTY_TIER_ORDER,
  getTierPalette,
  pointsCashValue,
  redemptionSummaryText,
  nextTierProgress,
  computeLoyaltyTier,
  resolveProfileTier,
  tierDiscountRate,
  syncCardNumberTier,
  generateSmartCardNumber
} from '../utils/loyaltyEngine';
import {
  generateAndDownloadLoyaltyCard,
  CardCustomFields,
  CardThemeOption,
  copyDataUrlToClipboard
} from '../utils/loyaltyCardCanvas';
import {
  formatLoyaltyCardWhatsAppMessage,
  openWhatsApp,
  LAB_PHONE,
  LAB_PHONE_SECONDARY,
  LAB_WHATSAPP,
  BRANCH_MAIN_ADDRESS
} from '../utils/whatsapp';
import {
  Award,
  Plus,
  Search,
  Gift,
  TrendingUp,
  Printer,
  Sparkles,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Sliders,
  Calculator,
  DollarSign,
  RefreshCw,
  Edit3,
  Trash2,
  Download,
  Copy,
  Check,
  Zap,
  User,
  X,
  ShieldCheck,
  MessageCircle,
  CheckCircle2
} from 'lucide-react';

const TIER_BENEFITS: Record<LoyaltyTier, { titleAr: string; badgeBg: string; description: string }> = {
  Silver: {
    titleAr: 'المستوى الفضي (Silver)',
    badgeBg: 'bg-slate-100 text-slate-800 border-slate-300',
    description: 'أولوية استلام النتائج عبر الواتساب وتجميع تلقائي مع كل زيارة'
  },
  Gold: {
    titleAr: 'المستوى الذهبي (Gold)',
    badgeBg: 'bg-amber-100 text-amber-950 border-amber-400',
    description: 'سحب منزلي مجاني مرتين سنوياً + تقرير التطور البياني'
  },
  Platinum: {
    titleAr: 'المستوى البلاتيني (Platinum)',
    badgeBg: 'bg-sky-100 text-sky-950 border-sky-400',
    description: 'سحب منزلي مجاني غير محدود + استشارة طبية مع استشاري المعمل'
  },
  VIP: {
    titleAr: 'نخبة الماس VIP (Diamond Elite)',
    badgeBg: 'bg-gradient-to-r from-rose-700 to-red-800 text-white border-rose-400',
    description: 'خصم لك ولأفراد عائلتك من الدرجة الأولى + باقة فحص سنوي مجانية'
  }
};

export const LoyaltyModule: React.FC = () => {
  const {
    loyaltyProfiles,
    loyaltyConfig,
    updateLoyaltyConfig,
    recalculateAllLoyaltyPoints,
    addLoyaltyProfile,
    updateLoyaltyProfile,
    deleteLoyaltyProfile,
    deleteLoyaltyTransaction,
    addLoyaltyPoints,
    redeemLoyaltyPoints,
    calculateCashForPoints,
    calculatePointsForAmount,
    labInfo
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState<string>(loyaltyProfiles[0]?.patientId || '');
  const [copiedCode, setCopiedCode] = useState(false);
  const [noticeBanner, setNoticeBanner] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isSendingWA, setIsSendingWA] = useState(false);

  const showNotice = (type: 'success' | 'error' | 'info', message: string) => {
    setNoticeBanner({ type, message });
    setTimeout(() => {
      setNoticeBanner(prev => (prev?.message === message ? null : prev));
    }, 6500);
  };

  // Card Fields Customization State (Face 1 single-sided luxury customization)
  const [cardFields, setCardFields] = useState<CardCustomFields & { theme: CardThemeOption }>(() => {
    try {
      const saved = localStorage.getItem('rt_lab_card_fields_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        const migrated = localStorage.getItem('rt_lab_card_fields_v2_migrated') === '1';
        const resolved = {
          showHeader: parsed.showHeader ?? true,
          showTierBadge: parsed.showTierBadge ?? true,
          showChip: parsed.showChip ?? true,
          showPoints: parsed.showPoints ?? true,
          showCashValue: parsed.showCashValue ?? true,
          showCardCode: parsed.showCardCode ?? true,
          showPatientName: parsed.showPatientName ?? true,
          showPatientPhone: parsed.showPatientPhone ?? true,
          showBloodGroup: migrated ? (parsed.showBloodGroup ?? true) : true,
          showDates: parsed.showDates ?? true,
          showUsageNote: parsed.showUsageNote ?? true,
          showFooter: parsed.showFooter ?? true,
          showHotline: parsed.showHotline ?? true,
          showAddress: parsed.showAddress ?? true,
          theme: (migrated ? (parsed.theme || 'auto-tier') : 'auto-tier') as CardThemeOption
        };
        if (!migrated) {
          localStorage.setItem('rt_lab_card_fields_v2_migrated', '1');
          localStorage.setItem('rt_lab_card_fields_config', JSON.stringify(resolved));
        }
        return resolved;
      }
      localStorage.setItem('rt_lab_card_fields_v2_migrated', '1');
    } catch {}
    return {
      showHeader: true,
      showTierBadge: true,
      showChip: true,
      showPoints: true,
      showCashValue: true,
      showCardCode: true,
      showPatientName: true,
      showPatientPhone: true,
      showBloodGroup: true,
      showDates: true,
      showUsageNote: true,
      showFooter: true,
      showHotline: true,
      showAddress: true,
      theme: 'auto-tier'
    };
  });
  const [isFieldCustomizerOpen, setIsFieldCustomizerOpen] = useState(false);

  const updateCardField = (key: keyof CardCustomFields, val: boolean) => {
    setCardFields(prev => {
      const updated = { ...prev, [key]: val };
      try { localStorage.setItem('rt_lab_card_fields_config', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const setCardTheme = (theme: CardThemeOption) => {
    setCardFields(prev => {
      const updated = { ...prev, theme };
      try { localStorage.setItem('rt_lab_card_fields_config', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const resetAllCardFields = () => {
    const defaults: CardCustomFields & { theme: CardThemeOption } = {
      showHeader: true,
      showTierBadge: true,
      showChip: true,
      showPoints: true,
      showCashValue: true,
      showCardCode: true,
      showPatientName: true,
      showPatientPhone: true,
      showBloodGroup: true,
      showDates: true,
      showUsageNote: true,
      showFooter: true,
      showHotline: true,
      showAddress: true,
      theme: 'auto-tier'
    };
    setCardFields(defaults);
    try { localStorage.setItem('rt_lab_card_fields_config', JSON.stringify(defaults)); } catch {}
  };


  // Config modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempConfig, setTempConfig] = useState<LoyaltyConfig>(loyaltyConfig);
  const [recalcSummary, setRecalcSummary] = useState<{
    updatedProfilesCount: number;
    newCardsCreatedCount: number;
    totalPointsCalculated: number;
    totalInvoicesProcessed: number;
  } | null>(null);

  useEffect(() => {
    setTempConfig(loyaltyConfig);
  }, [loyaltyConfig]);

  // Add points modal
  const [isAddPointsOpen, setIsAddPointsOpen] = useState(false);
  const [addMode, setAddMode] = useState<'by_cash' | 'direct'>('by_cash');
  const [cashAmount, setCashAmount] = useState<number>(300);
  const [directPoints, setDirectPoints] = useState<number>(50);
  const [pointsReason, setPointsReason] = useState('إضافة نقاط تحاليل طبية بالفرع');

  // Redeem modal
  const [isRedeemOpen, setIsRedeemOpen] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(100);

  // New Profile modal
  const [isNewProfileOpen, setIsNewProfileOpen] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newBloodGroup, setNewBloodGroup] = useState('O+');
  const [newEmergency, setNewEmergency] = useState('');
  const [newCondition, setNewCondition] = useState('');

  // Edit Profile modal (Full field editing & deleting)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    patientName: '',
    phone: '',
    cardNumber: '',
    tier: 'Gold' as LoyaltyTier,
    totalPoints: 0,
    lifetimeSpent: 0,
    bloodGroup: 'O+',
    emergencyContact: '',
    chronicConditions: '',
    issueDate: ''
  });

  const activeProfile = loyaltyProfiles.find(p => p.patientId === selectedProfileId) || loyaltyProfiles[0];

  const resolvedLabName = labInfo?.labNameAr || 'معامل RT للتحاليل الطبية والتشخيصية';
  const resolvedSupervision = labInfo?.supervisionAr || 'أطباء واستشاريو كلية طب قصر العيني';
  const resolvedHotline = labInfo?.hotline || LAB_PHONE;
  const resolvedPhone = labInfo?.phone || LAB_PHONE_SECONDARY;
  const resolvedWhatsapp = labInfo?.whatsapp || LAB_WHATSAPP;
  const resolvedAddress = labInfo?.mainAddress || BRANCH_MAIN_ADDRESS;
  const resolvedPhonesDisplay = [resolvedHotline, resolvedPhone].filter(Boolean).join(' / ');

  const currentTier: LoyaltyTier = activeProfile
    ? resolveProfileTier(activeProfile, loyaltyConfig)
    : 'Silver';
  const tierPalette = getTierPalette(currentTier);
  const tierInfo = TIER_BENEFITS[currentTier] || TIER_BENEFITS.Silver;
  const currentDiscount = tierDiscountRate(currentTier, loyaltyConfig);
  const cashInfo = pointsCashValue(activeProfile?.totalPoints || 0, loyaltyConfig);
  const tierProgress = activeProfile ? nextTierProgress(activeProfile, loyaltyConfig) : null;
  const earnRuleShort =
    loyaltyConfig.pointsPerEGP >= 1
      ? `كل 1 ج.م تحاليل = ${loyaltyConfig.pointsPerEGP} نقطة`
      : `كل ${Math.round(1 / (loyaltyConfig.pointsPerEGP || 0.1))} ج.م تحاليل = 1 نقطة`;

  const cardThemeClass =
    cardFields.theme === 'auto-tier'
      ? `${tierPalette.gradientCss} ${tierPalette.borderClass}`
      : cardFields.theme === 'sapphire'
      ? 'bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-950 border-cyan-400'
      : cardFields.theme === 'emerald'
      ? 'bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950 border-emerald-400'
      : cardFields.theme === 'ruby'
      ? 'bg-gradient-to-br from-rose-950 via-red-950 to-purple-950 border-rose-400'
      : 'bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 border-amber-400';

  const filteredProfiles = loyaltyProfiles.filter(p =>
    p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone.includes(searchTerm) ||
    (p.cardNumber && p.cardNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
    p.barcode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Open Edit Modal
  const handleOpenEditModal = () => {
    if (!activeProfile) return;
    setEditForm({
      patientName: activeProfile.patientName,
      phone: activeProfile.phone,
      cardNumber: activeProfile.cardNumber || activeProfile.barcode,
      tier: currentTier,
      totalPoints: activeProfile.totalPoints,
      lifetimeSpent: activeProfile.lifetimeSpent,
      bloodGroup: activeProfile.bloodGroup || 'O+',
      emergencyContact: activeProfile.emergencyContact || '',
      chronicConditions: activeProfile.chronicConditions?.join(', ') || '',
      issueDate: activeProfile.issueDate || new Date().toISOString().substring(0, 10)
    });
    setIsEditModalOpen(true);
  };

  // Save Edit Profile
  const handleSaveEditProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProfile) return;

    const finalCode = editForm.cardNumber.trim() || generateSmartCardNumber(editForm.tier, activeProfile.barcode);
    const parsedPoints = Math.max(0, Number(editForm.totalPoints) || 0);
    const autoTierForPoints = computeLoyaltyTier(parsedPoints, loyaltyConfig);
    const isManualTier = editForm.tier !== autoTierForPoints;

    updateLoyaltyProfile(activeProfile.patientId, {
      patientName: editForm.patientName.trim(),
      phone: editForm.phone.trim(),
      cardNumber: finalCode,
      barcode: finalCode,
      tier: editForm.tier,
      manualTierOverride: isManualTier,
      totalPoints: parsedPoints,
      lifetimeSpent: Math.max(0, Number(editForm.lifetimeSpent) || 0),
      bloodGroup: editForm.bloodGroup,
      emergencyContact: editForm.emergencyContact.trim(),
      chronicConditions: editForm.chronicConditions.trim()
        ? editForm.chronicConditions.split(/[,،]+/).map(s => s.trim()).filter(Boolean)
        : [],
      issueDate: editForm.issueDate || activeProfile.issueDate
    });

    setSelectedProfileId(activeProfile.patientId);
    setIsEditModalOpen(false);
    showNotice('success', `تم حفظ وتحديث بيانات كارت المريض (${editForm.patientName.trim()}) بنجاح.`);
  };

  // Generate Fresh Code matching selected tier
  const handleRegenerateCardCode = () => {
    const freshCode = generateSmartCardNumber(editForm.tier || 'Silver', `${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`);
    setEditForm(prev => ({ ...prev, cardNumber: freshCode }));
  };

  // Delete Card Profile
  const handleDeleteCard = () => {
    if (!activeProfile) return;
    if (confirm(`هل أنت متأكد من حذف كارت الولاء وملف المريض (${activeProfile.patientName}) نهائياً من المنظومة المالية؟`)) {
      deleteLoyaltyProfile(activeProfile.patientId);
      const remaining = loyaltyProfiles.filter(p => p.patientId !== activeProfile.patientId);
      setSelectedProfileId(remaining[0]?.patientId || '');
    }
  };

  // Delete Specific Transaction
  const handleDeleteTransaction = (txId: string) => {
    if (!activeProfile) return;
    const tx = activeProfile.transactions.find(t => t.id === txId);
    if (!tx) return;

    if (confirm(`هل تريد حذف حركة النقاط "${tx.description}" (${tx.points > 0 ? '+' : ''}${tx.points} نقطة)؟ سيتم تحديث الرصيد تلقائياً.`)) {
      deleteLoyaltyTransaction(activeProfile.patientId, txId);
    }
  };

  // RETROACTIVE SYNC ALL INVOICES
  const handleRetroactiveSync = () => {
    const res = recalculateAllLoyaltyPoints();
    setRecalcSummary(res);
  };

  // Single-Sided Isolated Card Print (Dynamic per-tier colors, verified contacts, redemption rules)
  const handlePrintCard = () => {
    if (!activeProfile) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showNotice('error', 'يرجى السماح بالنوافذ المنبثقة في المتصفح لطباعة الكارت.');
      return;
    }

    const cardCode = activeProfile.cardNumber || activeProfile.barcode || generateSmartCardNumber(currentTier, activeProfile.barcode);

    const html = `<!DOCTYPE html><html lang="ar" dir="rtl"><head>
  <meta charset="UTF-8">
  <title>كارت المريض الطبي الذكي - ${activeProfile.patientName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@600;700;800;900&family=JetBrains+Mono:wght@600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff !important;
      font-family: 'Cairo', sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .no-print {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #0f172a;
      color: white;
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 100;
    }
    .card-wrap {
      width: 96mm;
      height: 60mm;
      border-radius: 4mm;
      overflow: hidden;
      margin: 16px auto;
      page-break-inside: avoid;
      box-shadow: 0 6px 20px rgba(0,0,0,0.2);
      border: 1.8px solid ${tierPalette.printBorderHex};
      position: relative;
    }
    @media print {
      body { min-height: auto !important; background: #ffffff !important; }
      .no-print { display: none !important; }
      .card-wrap { box-shadow: none !important; margin: 20mm auto !important; }
      @page { size: A4 portrait; margin: 0; }
    }
  </style></head><body>
  <div class="no-print">
    <div style="font-weight:bold; font-size:13px;">طباعة كارت الولاء الطبي الذكي (${tierInfo.titleAr} — خصم تلقائي %${currentDiscount})</div>
    <div style="display:flex; gap:10px;">
      <button onclick="window.print()" style="background:#b45309; color:white; border:none; padding:8px 18px; border-radius:6px; font-weight:bold; cursor:pointer;">🖨️ طباعة الآن</button>
      <button onclick="window.close()" style="background:#334155; color:white; border:none; padding:8px 14px; border-radius:6px; cursor:pointer;">إغلاق ✕</button>
    </div>
  </div>

  <div style="padding-top: 60px; text-align: center;">
    <div class="card-wrap" style="background: ${tierPalette.printBgGradient}; color: white; padding: 3.8mm 5mm; display: flex; flex-direction: column; justify-content: space-between; text-align: right;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 6px;">
        <div>
          <div style="font-weight: 900; font-size: 12px; color: #ffffff;">${resolvedLabName}</div>
          <div style="font-size: 7.5px; color: ${tierPalette.accentHex}; font-weight: bold;">${resolvedSupervision}</div>
        </div>
        <div style="background: ${tierPalette.discountBgHex}; border: 1px solid ${tierPalette.printBorderHex}; border-radius: 20px; padding: 2px 7px; font-size: 7.5px; font-weight: 800; color: #ffffff; white-space: nowrap;">
          ★ ${tierInfo.titleAr} ★
        </div>
      </div>

      <!-- Center info -->
      <div style="margin: 1mm 0; display: flex; justify-content: space-between; align-items: center; gap: 6px;">
        <div style="background: linear-gradient(135deg, #fde68a, ${tierPalette.printBorderHex}); width: 28px; height: 21px; border-radius: 4px; border: 1px solid #ffffff88;"></div>
        <div style="text-align: center; flex: 1;">
          <div style="font-family: monospace; font-size: 12.5px; font-weight: 900; letter-spacing: 1.5px; color: #ffffff;">${cardCode}</div>
          <div style="font-size: 7.5px; color: ${tierPalette.discountTextHex}; font-weight: 800; margin-top: 1px;">خصم تلقائي معتمد: %${currentDiscount} على كافة التحاليل</div>
        </div>
        <div style="text-align: left; background: rgba(0,0,0,0.48); padding: 2.5px 6px; border-radius: 6px; border: 1px solid ${tierPalette.printBorderHex}80;">
          <div style="font-size: 6.5px; color: #cbd5e1;">رصيد النقاط / القيمة:</div>
          <div style="font-size: 10px; font-weight: 900; color: ${tierPalette.accentHex};">${(activeProfile.totalPoints || 0).toLocaleString()} نقطة</div>
          <div style="font-size: 7.5px; font-weight: 800; color: #34d399;">= ${cashInfo.exactEGP} ج.م</div>
        </div>
      </div>

      <!-- Redemption & Cumulative Rule -->
      <div style="background: rgba(255,255,255,0.09); border: 1px solid rgba(255,255,255,0.18); border-radius: 4px; padding: 1.5px 5px; font-size: 6.8px; color: #fef08a; font-weight: 700; text-align: center;">
        كل 100 نقطة = ${cashInfo.egpPer100} ج.م خصم · ${earnRuleShort} · الترقية التراكمية تلقائياً مع كل حجز
      </div>

      <!-- Patient Demographics & Verified Contacts -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid rgba(255,255,255,0.22); padding-top: 1.8mm; gap: 6px;">
        <div>
          <div style="font-size: 6.8px; color: #cbd5e1;">اسم المريض:</div>
          <div style="font-weight: 900; font-size: 10px; color: #ffffff;">${activeProfile.patientName}</div>
          <div style="font-family: monospace; font-size: 8px; color: ${tierPalette.accentHex};">${activeProfile.phone}</div>
        </div>
        <div style="text-align: left;">
          <div style="font-size: 6.8px; color: #cbd5e1;">الهاتف: <strong style="color:#fff; font-family:monospace;">${resolvedPhonesDisplay}</strong></div>
          <div style="font-size: 6.8px; color: #34d399; font-weight:700;">واتساب: <span style="font-family:monospace;">${resolvedWhatsapp}</span></div>
          <div style="font-size: 6px; color: #e2e8f0; max-width: 48mm; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">📍 ${resolvedAddress}</div>
        </div>
      </div>
    </div>
  </div>
</body></html>`;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const buildCardCanvasParams = (skipDownload = false) => {
    if (!activeProfile) return null;
    const cardCode = activeProfile.cardNumber || activeProfile.barcode || generateSmartCardNumber(currentTier, activeProfile.barcode);
    return {
      cardNumber: cardCode,
      patientName: activeProfile.patientName,
      patientPhone: activeProfile.phone,
      tier: tierInfo.titleAr,
      tierKey: currentTier,
      discountPercentage: currentDiscount,
      points: activeProfile.totalPoints,
      egpPer100Points: loyaltyConfig.egpPer100Points,
      pointsPerEGP: loyaltyConfig.pointsPerEGP,
      bloodGroup: activeProfile.bloodGroup || 'O+',
      issueDate: activeProfile.issueDate,
      emergencyContact: activeProfile.emergencyContact,
      chronicConditions: activeProfile.chronicConditions,
      labNameAr: resolvedLabName,
      supervisionAr: resolvedSupervision,
      hotline: resolvedHotline,
      phone: resolvedPhone,
      whatsapp: resolvedWhatsapp,
      address: resolvedAddress,
      fields: cardFields,
      theme: cardFields.theme,
      skipDownload
    };
  };

  // Download Single-Sided Card PNG
  const handleDownloadSingleSidedPNG = async () => {
    const params = buildCardCanvasParams(false);
    if (!params) return;
    await generateAndDownloadLoyaltyCard(params);
    showNotice('success', `تم تحميل صورة الكارت (${params.cardNumber}.png) بدقة عالية وبألوان ${tierInfo.titleAr}.`);
  };

  // Download Card PNG + Copy Image + Open WhatsApp with Full Explanation
  const handleDownloadAndSendWhatsAppCard = async () => {
    if (!activeProfile) return;
    setIsSendingWA(true);
    try {
      const params = buildCardCanvasParams(false);
      if (params) {
        const dataUrl = await generateAndDownloadLoyaltyCard(params);
        const copied = dataUrl ? await copyDataUrlToClipboard(dataUrl) : false;
        showNotice(
          'success',
          copied
            ? 'تم تحميل صورة الكارت ونسخها للحافظة (يمكنك لصقها Ctrl+V في واتساب فوراً) وجارٍ فتح رسالة الشرح للمريض.'
            : 'تم تحميل صورة الكارت بنجاح وجارٍ فتح رسالة الواتساب المشروحة — يرجى إرفاق الصورة المحمّلة في المحادثة.'
        );
      }
      const message = formatLoyaltyCardWhatsAppMessage({
        profile: activeProfile,
        config: loyaltyConfig,
        labInfo
      });
      openWhatsApp(activeProfile.phone, message);
    } finally {
      setIsSendingWA(false);
    }
  };

  const handleSendWhatsAppMessageOnly = () => {
    if (!activeProfile) return;
    const message = formatLoyaltyCardWhatsAppMessage({
      profile: activeProfile,
      config: loyaltyConfig,
      labInfo
    });
    openWhatsApp(activeProfile.phone, message);
    showNotice('info', `تم فتح محادثة واتساب لشرح الكارت والنقاط للمريض (${activeProfile.patientName}).`);
  };

  const handleCopyCardCode = () => {
    if (!activeProfile) return;
    const code = activeProfile.cardNumber || activeProfile.barcode;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Add points
  const handleAddPointsSubmit = () => {
    if (!activeProfile) return;
    const pts = addMode === 'by_cash' ? calculatePointsForAmount(cashAmount) : directPoints;
    if (pts <= 0) return;

    addLoyaltyPoints(
      activeProfile.patientId,
      pts,
      addMode === 'by_cash' ? `نقاط سداد فاتورة بمبلغ ${cashAmount} ج.م` : pointsReason,
      undefined,
      addMode === 'by_cash' ? cashAmount : undefined
    );

    setIsAddPointsOpen(false);
    showNotice('success', `تمت إضافة ${pts} نقطة إلى رصيد (${activeProfile.patientName}) وتحديث الفئة تلقائياً.`);
  };

  // Redeem points
  const handleRedeemSubmit = () => {
    if (!activeProfile || pointsToRedeem <= 0) return;
    const res = redeemLoyaltyPoints(activeProfile.patientId, pointsToRedeem);
    if (res.success) {
      showNotice('success', `تم استبدال ${pointsToRedeem} نقطة بنجاح بخصم نقدي قدره ${res.cashValue} ج.م.`);
      setIsRedeemOpen(false);
    } else {
      showNotice('error', 'النقاط المطلوبة أكبر من الرصيد المتاح للمريض.');
    }
  };

  // Create new profile
  const handleCreateNewProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim()) return;

    const welcomePts = Number(loyaltyConfig.welcomeBonusPoints ?? 50);
    const initialTier = computeLoyaltyTier(welcomePts, loyaltyConfig);
    const cardCode = generateSmartCardNumber(initialTier, `${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`);
    const newProfile: PatientLoyaltyProfile = {
      patientId: `pat-${Date.now()}`,
      patientName: newPatientName.trim(),
      phone: newPhone.trim() || resolvedPhone,
      cardNumber: cardCode,
      barcode: cardCode,
      bloodGroup: newBloodGroup,
      totalPoints: welcomePts,
      tier: initialTier,
      lifetimeSpent: 0,
      emergencyContact: newEmergency.trim() || undefined,
      chronicConditions: newCondition.trim() ? [newCondition.trim()] : [],
      issueDate: new Date().toISOString().substring(0, 10),
      transactions: welcomePts > 0 ? [
        {
          id: `tx-welcome-${Date.now()}`,
          date: new Date().toISOString().substring(0, 10),
          type: 'bonus',
          points: welcomePts,
          description: 'هدية ترحيبية فورية بمناسبة فتح حساب كارت المريض الذكي'
        }
      ] : []
    };

    addLoyaltyProfile(newProfile);
    setSelectedProfileId(newProfile.patientId);
    setIsNewProfileOpen(false);
    setNewPatientName('');
    setNewPhone('');
    setNewEmergency('');
    setNewCondition('');
    showNotice('success', `تم إصدار كارت الولاء الذكي (${cardCode}) للمريض ${newProfile.patientName}.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
            <Award className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <span>نظام كروت ولاء المرضى والنقاط الذكية (وجه واحد فاخر)</span>
              <span className="text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                Single-Sided Luxury VIP
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              إصدار وتعديل كروت الخصم الدائم، احتساب النقاط التراكمية، ومزامنة الحالات المسجلة بالأرشيف بأثر رجعي
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Retroactive Sync Button */}
          <button
            onClick={handleRetroactiveSync}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            title="تفعيل وتحديث كروت ونقاط الولاء لجميع فواتير وحالات المرضى المسجلة بأثر رجعي"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>مزامنة كروت الولاء لجميع الفواتير ⚡</span>
          </button>

          {/* New Card Modal */}
          <button
            onClick={() => setIsNewProfileOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إصدار كارت ولاء جديد</span>
          </button>

          {/* Settings */}
          <button
            onClick={() => {
              setTempConfig(loyaltyConfig);
              setIsSettingsOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-200"
          >
            <Sliders className="w-4 h-4 text-slate-500" />
            <span>سياسة النقاط والاستبدال</span>
          </button>
        </div>
      </div>

      {/* Inline Status Banner */}
      {noticeBanner && (
        <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs font-bold shadow-sm ${
          noticeBanner.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-900' :
          noticeBanner.type === 'error' ? 'bg-rose-50 border-rose-300 text-rose-900' :
          'bg-sky-50 border-sky-300 text-sky-900'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{noticeBanner.message}</span>
          </div>
          <button onClick={() => setNoticeBanner(null)} className="opacity-60 hover:opacity-100 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Dynamic Points Calculation, Tier Colors Overview & Redemption Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-md border border-amber-500/30 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>قاعدة الاحتساب والاستبدال الحالية</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Check className="w-3.5 h-3.5" />
                <span>ترقية تراكمية تلقائية مع كل حجز بنفس الهاتف</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{loyaltyConfig.excludeVisitFee !== false ? 'رسوم الزيارة مستبعدة تلقائياً' : 'الاحتساب على كامل المسدد'}</span>
              </span>
            </div>

            <div className="text-sm sm:text-base font-black text-amber-200 flex flex-wrap items-center gap-2">
              <span>{redemptionSummaryText(loyaltyConfig)}</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
              يصدر الكارت بلون ونسبة خصم الفئة تلقائياً بناءً على إجمالي النقاط والمبالغ المدفوعة. أي تعديل في السياسة ينعكس فوراً على جميع الكروت المسجلة والفواتير.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setTempConfig(loyaltyConfig);
                setIsSettingsOpen(true);
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 active:scale-95"
            >
              <Sliders className="w-4 h-4 text-slate-950" />
              <span>تعديل السياسة والنسب</span>
            </button>
            <button
              onClick={handleRetroactiveSync}
              className="px-4 py-2.5 bg-indigo-600/80 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl border border-indigo-400/30 transition-all cursor-pointer flex items-center gap-2 active:scale-95"
            >
              <RefreshCw className="w-4 h-4 text-amber-300" />
              <span>تحديث كافة الحجوزات ⚡</span>
            </button>
          </div>
        </div>

        {/* 4 Distinct Tier Colors & Thresholds Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-white/10">
          {LOYALTY_TIER_ORDER.map(tKey => {
            const pal = getTierPalette(tKey);
            const tCfg = loyaltyConfig.tiers[tKey];
            const count = loyaltyProfiles.filter(p => resolveProfileTier(p, loyaltyConfig) === tKey).length;
            return (
              <div
                key={tKey}
                className={`${pal.gradientCss} border ${pal.borderClass} rounded-xl px-3 py-2 flex items-center justify-between text-xs shadow-xs`}
              >
                <div>
                  <div className="font-black text-white">{pal.titleAr}</div>
                  <div className="text-[10px] text-white/80 font-mono">
                    من {tCfg.minPoints.toLocaleString()} نقطة · {count} عضو
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-lg bg-black/40 border border-white/20 text-amber-200 font-black font-mono">
                  %{tCfg.discountRate}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Directory + Single-Sided Card Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Directory */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-xs text-slate-800 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-500" />
              <span>أعضاء برنامج الولاء ({filteredProfiles.length}):</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-500">RT Lab VIP Club</span>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="بحث بالاسم، الهاتف، أو كود الكارت..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pr-9 pl-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            />
          </div>

          {/* Profiles list */}
          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
            {filteredProfiles.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                لا يوجد كروت مطابقة لبيانات البحث
              </div>
            ) : (
              filteredProfiles.map(p => {
                const dynTier = resolveProfileTier(p, loyaltyConfig);
                const pal = getTierPalette(dynTier);
                const disc = tierDiscountRate(dynTier, loyaltyConfig);
                const egpVal = pointsCashValue(p.totalPoints || 0, loyaltyConfig).exactEGP;
                const isSelected = p.patientId === activeProfile?.patientId;
                const cardNum = p.cardNumber || p.barcode;
                return (
                  <div
                    key={p.patientId}
                    onClick={() => setSelectedProfileId(p.patientId)}
                    className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50/90 border-amber-500 shadow-sm ring-1 ring-amber-400/50'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${pal.badgeBgClass}`}>
                        ★ {dynTier} · %{disc}
                      </span>
                      <div className="font-bold text-xs text-slate-900 truncate">{p.patientName}</div>
                    </div>

                    <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500 font-mono">
                      <span className="text-amber-800 font-bold font-sans">
                        {(p.totalPoints || 0).toLocaleString()} نقطة <span className="text-emerald-700 font-mono">({egpVal} ج.م)</span>
                      </span>
                      <span>{p.phone}</span>
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono mt-1 text-left">
                      {cardNum}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Single-Sided Card Display & Complete Management */}
        <div className="lg:col-span-8 space-y-6">
          {activeProfile ? (
            <>
                            {/* Field Customizer & Switcher Toolbar */}
              <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg text-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-400" />
                    <span className="font-black text-white text-xs sm:text-sm">تخصيص وتبديل حقول الكارت (وجه واحد فاخر):</span>
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">تحكم كامل بإظهار/حذف كل حقل</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={resetAllCardFields}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                      title="استعادة جميع الحقول الافتراضية"
                    >
                      استعادة الكل ✓
                    </button>
                    <button
                      onClick={() => setIsFieldCustomizerOpen(!isFieldCustomizerOpen)}
                      className="px-2.5 py-1 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      {isFieldCustomizerOpen ? 'إخفاء لوحة التحكم ▲' : 'إظهار خيارات التبديل ▼'}
                    </button>
                  </div>
                </div>

                {/* Color Theme Selector */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-slate-400 font-bold text-[11px]">مظهر ولون الكارت:</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => setCardTheme('auto-tier')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${cardFields.theme === 'auto-tier' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
                    >
                      🎨 تلقائي حسب الفئة (موصى به)
                    </button>
                    <button
                      onClick={() => setCardTheme('royal-black')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${cardFields.theme === 'royal-black' ? 'bg-amber-500/20 text-amber-300 border-amber-400' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
                    >
                      👑 أسود ملكي وذهبي
                    </button>
                    <button
                      onClick={() => setCardTheme('sapphire')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${cardFields.theme === 'sapphire' ? 'bg-blue-500/20 text-cyan-300 border-cyan-400' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
                    >
                      💎 أزرق بلاتيني
                    </button>
                    <button
                      onClick={() => setCardTheme('emerald')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${cardFields.theme === 'emerald' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
                    >
                      🌿 زمردي
                    </button>
                    <button
                      onClick={() => setCardTheme('ruby')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${cardFields.theme === 'ruby' ? 'bg-rose-500/20 text-rose-300 border-rose-400' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
                    >
                      🍷 عنابي الماس
                    </button>
                  </div>
                </div>

                {/* Field Toggle Badges */}
                {isFieldCustomizerOpen && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-2 border-t border-slate-800">
                    {[
                      { key: 'showHeader', label: 'اسم وشعار المعمل' },
                      { key: 'showTierBadge', label: 'شارة الفئة والخصم' },
                      { key: 'showChip', label: 'الشريحة الذكية والـNFC' },
                      { key: 'showPoints', label: 'رصيد النقاط التراكمي' },
                      { key: 'showCashValue', label: 'قيمة النقاط بالجنيه' },
                      { key: 'showCardCode', label: 'كود الكارت والنسخ' },
                      { key: 'showPatientName', label: 'اسم المريض / العضو' },
                      { key: 'showPatientPhone', label: 'رقم هاتف المريض' },
                      { key: 'showBloodGroup', label: 'فصيلة الدم' },
                      { key: 'showDates', label: 'تاريخ الإصدار والصلاحية' },
                      { key: 'showUsageNote', label: 'شرح نظام الاستبدال' },
                      { key: 'showHotline', label: 'أرقام المعمل والواتساب' },
                      { key: 'showAddress', label: 'عنوان المقر الرئيسي' },
                    ].map(f => {
                      const isVisible = cardFields[f.key as keyof CardCustomFields] ?? true;
                      return (
                        <div
                          key={f.key}
                          className={`p-2 rounded-xl border flex items-center justify-between gap-1 transition-all ${isVisible ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-rose-950/20 border-rose-900/40 text-slate-400 opacity-60'}`}
                        >
                          <span className="truncate text-[11px] font-bold">{f.label}</span>
                          <button
                            onClick={() => updateCardField(f.key as keyof CardCustomFields, !isVisible)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-black cursor-pointer transition-colors ${isVisible ? 'bg-rose-600/30 text-rose-300 hover:bg-rose-600/60' : 'bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/60'}`}
                            title={isVisible ? 'حذف / إخفاء هذا الحقل من الكارت' : 'استرجاع وإظهار هذا الحقل'}
                          >
                            {isVisible ? 'حذف ✕' : '+ إظهار'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* THE LUXURY SINGLE-SIDED CARD PREVIEW (Eye-friendly, Distinct Per-Tier Color, Redemption Rule Visible) */}
              <div className="bg-slate-950 p-5 sm:p-8 rounded-3xl shadow-xl border border-slate-800 relative overflow-hidden flex flex-col items-center">
                <div className="w-full flex items-center justify-between text-xs text-amber-200/90 pb-3 mb-3 border-b border-slate-800/80 font-bold">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>معاينة كارت الولاء الطبي الذكي ({tierInfo.titleAr} — خصم تلقائي %{currentDiscount})</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">CR80 • Smart Pass</span>
                </div>

                {/* THE SINGLE-SIDED CARD */}
                <div className={`w-full max-w-[600px] rounded-3xl p-5 sm:p-7 shadow-2xl border-2 relative overflow-hidden text-white flex flex-col justify-between gap-3.5 select-none transition-all ${cardThemeClass}`}>
                  {/* Subtle lighting watermarks */}
                  <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                  <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>

                  {/* Row 1: Header & Tier Badge */}
                  {(cardFields.showHeader || cardFields.showTierBadge) && (
                  <div className="relative z-10 flex items-start justify-between gap-3">
                    {cardFields.showHeader ? (
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white/15 text-white font-black flex items-center justify-center text-sm shadow-sm border border-white/40 shrink-0">
                        RT
                      </div>
                      <div className="min-w-0">
                        <div className="font-black text-sm sm:text-base tracking-tight text-white leading-snug">
                          {resolvedLabName}
                        </div>
                        <div className="text-[11px] text-amber-200 font-bold mt-0.5 truncate">
                          {resolvedSupervision}
                        </div>
                      </div>
                    </div>
                    ) : <div></div>}

                    {cardFields.showTierBadge ? (
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <div className={`px-3 py-1 border rounded-full text-xs font-extrabold flex items-center gap-1 shadow-xs ${tierPalette.badgeBgClass}`}>
                        <Sparkles className="w-3 h-3" />
                        <span>★ {tierInfo.titleAr} ★</span>
                      </div>
                      <div className="text-[11px] font-black text-amber-200 bg-black/45 px-2.5 py-0.5 rounded-md border border-white/20">
                        خصم تلقائي معتمد: %{currentDiscount}
                      </div>
                    </div>
                    ) : <div></div>}
                  </div>
                  )}

                  {/* Row 2: Chip + Points & EGP Cash Value Box */}
                  {(cardFields.showChip || cardFields.showPoints) && (
                  <div className="relative z-10 flex items-center justify-between gap-3">
                    {cardFields.showChip ? (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-9 rounded-lg bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 border border-amber-200/90 p-1 flex flex-col justify-between shadow-sm">
                        <div className="h-px bg-amber-900/40 w-full"></div>
                        <div className="h-px bg-amber-900/40 w-full"></div>
                      </div>
                      <div className="text-white/75 text-xs font-bold" title="Contactless NFC">
                        )))
                      </div>
                    </div>
                    ) : <div></div>}
                    {cardFields.showPoints && (
                    <div className="bg-black/45 border border-white/25 px-4 py-2 rounded-2xl shadow-inner flex items-center gap-4">
                      <div>
                        <div className="text-[10px] text-slate-200 font-semibold">رصيد النقاط التراكمي:</div>
                        <div className="text-lg font-black text-amber-300 font-mono leading-tight">
                          {activeProfile.totalPoints.toLocaleString()} <span className="text-xs font-sans">نقطة</span>
                        </div>
                      </div>
                      {cardFields.showCashValue && (
                      <div className="border-r border-white/20 pr-3 text-left">
                        <div className="text-[10px] text-emerald-200 font-semibold">تعادل خصم نقدي:</div>
                        <div className="text-base font-black text-emerald-300 font-mono leading-tight">
                          = {cashInfo.exactEGP} <span className="text-xs font-sans">ج.م</span>
                        </div>
                      </div>
                      )}
                    </div>
                    )}
                  </div>
                  )}

                  {/* Row 3: Embossed Card Number */}
                  {cardFields.showCardCode && (
                  <div className="relative z-10 text-center">
                    <div className="font-mono text-lg sm:text-2xl font-black tracking-widest text-white drop-shadow-md flex items-center justify-center gap-3">
                      <span>{activeProfile.cardNumber || activeProfile.barcode}</span>
                      <button
                        onClick={handleCopyCardCode}
                        className="text-white/70 hover:text-amber-300 transition-colors p-1 cursor-pointer"
                        title="نسخ رقم الكارت"
                      >
                        {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  )}

                  {/* Row 4: Clear Redemption & Auto-Upgrade Strip */}
                  {cardFields.showUsageNote && (
                  <div className="relative z-10 bg-white/10 border border-white/20 rounded-xl px-3.5 py-2 text-center space-y-0.5">
                    <div className="text-xs font-black text-amber-200">
                      {redemptionSummaryText(loyaltyConfig)}
                    </div>
                    <div className="text-[10.5px] text-white/90 font-semibold">
                      الترقية التراكمية التلقائية: تُجمع النقاط مع كل حجز بنفس الهاتف وتترقى الفئة ويزداد الخصم تلقائياً
                    </div>
                  </div>
                  )}

                  {/* Row 5: Patient Info & Verified Lab Contacts Grid */}
                  {(cardFields.showPatientName || cardFields.showPatientPhone || cardFields.showBloodGroup || cardFields.showHotline) && (
                  <div className="relative z-10 border-t border-white/20 pt-2.5 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      {cardFields.showPatientName && (
                      <>
                        <div className="text-[10px] text-slate-200/80 font-medium">اسم العضو / المريض:</div>
                        <div className="font-black text-white text-sm truncate">
                          {activeProfile.patientName}
                        </div>
                      </>
                      )}
                      {cardFields.showPatientPhone && (
                      <div className="text-[11px] font-mono text-amber-200 mt-0.5">
                        {activeProfile.phone}
                      </div>
                      )}
                    </div>
                    <div className="sm:text-center flex sm:flex-col items-center justify-between sm:justify-center">
                      {cardFields.showBloodGroup && (
                      <div>
                        <div className="text-[10px] text-slate-200/80 font-medium">فصيلة الدم:</div>
                        <div className="font-black text-rose-300 font-mono text-sm">
                          {activeProfile.bloodGroup || 'O+'}
                        </div>
                      </div>
                      )}
                      {cardFields.showDates && (
                      <div className="text-[10.5px] text-emerald-300 font-bold">
                        صلاحية دائمة ✓ · إصدار {activeProfile.issueDate}
                      </div>
                      )}
                    </div>
                    <div className="sm:text-left">
                      {cardFields.showHotline && (
                      <>
                        <div className="text-[10px] text-slate-200/80 font-medium">الخط الساخن والهاتف:</div>
                        <div className="font-bold font-mono text-white text-[11px]" dir="ltr">
                          {resolvedPhonesDisplay}
                        </div>
                        <div className="font-bold font-mono text-emerald-300 text-[10.5px]">
                          واتساب: {resolvedWhatsapp}
                        </div>
                      </>
                      )}
                    </div>
                  </div>
                  )}

                  {/* Row 5.5: Emergency Contact & Medical Notes when set */}
                  {(activeProfile.emergencyContact || (activeProfile.chronicConditions && activeProfile.chronicConditions.length > 0)) && (
                  <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 bg-black/35 border border-white/15 rounded-xl px-3 py-1.5 text-[10.5px]">
                    {activeProfile.emergencyContact && (
                      <span className="text-amber-200 font-bold">
                        🚑 هاتف الطوارئ: <span className="font-mono text-white">{activeProfile.emergencyContact}</span>
                      </span>
                    )}
                    {activeProfile.chronicConditions && activeProfile.chronicConditions.length > 0 && (
                      <span className="text-rose-200 font-bold truncate">
                        🩺 ملاحظات صحية: <span className="text-white">{activeProfile.chronicConditions.join('، ')}</span>
                      </span>
                    )}
                  </div>
                  )}

                  {/* Row 6: Footer Address Bar */}
                  {cardFields.showFooter && cardFields.showAddress && (
                  <div className="relative z-10 border-t border-white/15 pt-1.5 flex items-center justify-between gap-2 text-[10px] text-slate-100/90 font-medium">
                    <div className="truncate">📍 {resolvedAddress}</div>
                    <div className="text-amber-200 font-bold shrink-0">RT LAB PASS</div>
                  </div>
                  )}
                </div>

                {/* Single-Sided Card Actions Toolbar */}
                <div className="w-full max-w-[600px] flex flex-wrap items-center justify-between gap-2 mt-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleDownloadAndSendWhatsAppCard}
                      disabled={isSendingWA}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-xs font-black transition-all shadow-md cursor-pointer"
                      title="تحميل صورة الكارت مع نسخها وإرسال رسالة شرح النقاط والاستبدال عبر الواتساب"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>تحميل الكارت وإرسال واتساب</span>
                    </button>

                    <button
                      onClick={handleSendWhatsAppMessageOnly}
                      className="flex items-center gap-1.5 px-3 py-2 bg-teal-900/90 hover:bg-teal-800 text-emerald-200 rounded-xl text-xs font-bold transition-all border border-emerald-700/60 cursor-pointer"
                      title="فتح محادثة الواتساب بشرح الكارت فقط"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>رسالة الشرح</span>
                    </button>

                    <button
                      onClick={handleDownloadSingleSidedPNG}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                      title="تحميل صورة الكارت عالي الدقة PNG"
                    >
                      <Download className="w-4 h-4" />
                      <span>صورة PNG</span>
                    </button>

                    <button
                      onClick={handlePrintCard}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer"
                      title="طباعة الكارت تلقائياً بألوان الفئة ونسبة الخصم"
                    >
                      <Printer className="w-4 h-4" />
                      <span>طباعة الكارت (CR80)</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleOpenEditModal}
                      className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                      title="تعديل وتبديل كافة حقول الكارت"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>تعديل</span>
                    </button>

                    <button
                      onClick={handleDeleteCard}
                      className="flex items-center gap-1.5 px-3 py-2 bg-rose-900/80 hover:bg-rose-900 text-rose-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-rose-800 cursor-pointer"
                      title="حذف الكارت نهائياً"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* POINTS POLICY, CUMULATIVE PROGRESS & TRANSACTIONS MANAGEMENT */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-500" />
                      <span>إدارة نقاط المريض: {activeProfile.patientName}</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      المستوى الحالي: <strong className="text-amber-800 font-bold">{tierInfo.titleAr}</strong> (خصم دائم معتمد {currentDiscount}%)
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setAddMode('by_cash');
                        setIsAddPointsOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إضافة نقاط</span>
                    </button>

                    <button
                      onClick={() => setIsRedeemOpen(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-800 hover:bg-rose-900 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                    >
                      <Gift className="w-4 h-4" />
                      <span>استبدال نقاط بخصم نقدي</span>
                    </button>
                  </div>
                </div>

                {/* Registered Card Identity & Medical Details Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50/90 border border-slate-200 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-500">رقم الكارت المعتمد</div>
                    <div className="font-mono font-black text-slate-900 mt-0.5">{activeProfile.cardNumber || activeProfile.barcode}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">رقم الهاتف المسجل</div>
                    <div className="font-mono font-bold text-slate-800 mt-0.5">{activeProfile.phone}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">فصيلة الدم / الطوارئ</div>
                    <div className="font-bold text-slate-800 mt-0.5">
                      <span className="text-rose-700 font-mono">{activeProfile.bloodGroup || 'O+'}</span>
                      {activeProfile.emergencyContact ? <span className="font-mono text-slate-600"> · {activeProfile.emergencyContact}</span> : ''}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">تاريخ الإصدار / الملاحظات</div>
                    <div className="font-bold text-slate-800 mt-0.5 truncate" title={activeProfile.chronicConditions?.join('، ') || activeProfile.issueDate}>
                      <span className="font-mono">{activeProfile.issueDate}</span>
                      {activeProfile.chronicConditions && activeProfile.chronicConditions.length > 0 ? ` · ${activeProfile.chronicConditions.join('، ')}` : ''}
                    </div>
                  </div>
                </div>

                {/* Stats Highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-xs text-slate-500 font-medium">الرصيد النشط للنقاط وقيمته:</div>
                    <div className="text-2xl font-black text-amber-800 font-mono mt-1">
                      {activeProfile.totalPoints.toLocaleString()} <span className="text-xs font-sans">نقطة</span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1">
                      تعادل: <strong className="text-emerald-700 font-bold">{cashInfo.exactEGP} ج.م</strong> (استبدال فوري: {cashInfo.redeemableEGP} ج.م)
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-xs text-slate-500 font-medium">إجمالي الإنفاق المعملي التراكمي:</div>
                    <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                      {activeProfile.lifetimeSpent.toLocaleString()} <span className="text-sm font-sans">ج.م</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      حجوزات تحاليل محتسبة: <strong>{activeProfile.transactions.filter(t => t.type === 'earn').length}</strong> زيارة
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-xs text-slate-500 font-medium">فئة الخصم المعتمدة تلقائياً:</div>
                    <div className="text-2xl font-black text-rose-800 font-mono mt-1">
                      %{currentDiscount}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      يطبق تلقائياً في الحجز والفاتورة والطباعة
                    </div>
                  </div>
                </div>

                {/* Cumulative Tier Upgrade Progress Bar */}
                {tierProgress && (
                  <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-indigo-950">
                        <TrendingUp className="w-4 h-4 text-indigo-600" />
                        <span>مؤشر الترقية التراكمية التلقائية عند تكرار الحجز:</span>
                      </div>
                      <span className="font-bold text-indigo-800">
                        {tierProgress.nextTier
                          ? `متبقي ${tierProgress.pointsNeeded.toLocaleString()} نقطة للوصول إلى ${TIER_BENEFITS[tierProgress.nextTier].titleAr} (خصم %${tierDiscountRate(tierProgress.nextTier, loyaltyConfig)})`
                          : 'تهانينا! وصل العميل إلى أعلى مستوى (Diamond VIP) بأقصى نسبة خصم.'}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-indigo-100 rounded-full overflow-hidden border border-indigo-200">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-600 to-emerald-500 transition-all duration-500"
                        style={{ width: `${tierProgress.progressPct}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Transaction History with Delete per Transaction */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span>سجل حركات واكتساب واستبدال النقاط ({activeProfile.transactions.length}):</span>
                    </h4>
                    <span className="text-[11px] text-slate-400">يمكن حذف أي حركة وإعادة ضبط الرصيد</span>
                  </div>

                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                    {activeProfile.transactions.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs">
                        لا توجد حركات نقاط مسجلة لهذا المريض حتى الآن
                      </div>
                    ) : (
                      activeProfile.transactions.map((tx) => (
                        <div key={tx.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                              tx.points > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {tx.points > 0 ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{tx.description}</div>
                              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                {tx.date} {tx.invoiceNumber ? `• فاتورة #${tx.invoiceNumber}` : ''}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className={`font-black font-mono text-sm ${
                              tx.points > 0 ? 'text-emerald-700' : 'text-rose-700'
                            }`}>
                              {tx.points > 0 ? `+${tx.points}` : tx.points} نقطة
                            </div>

                            {/* Delete Transaction button */}
                            <button
                              onClick={() => handleDeleteTransaction(tx.id)}
                              className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                              title="حذف هذه الحركة وتحديث الرصيد"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
              <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <div className="font-bold text-slate-700">لم يتم اختيار أي كارت مريض</div>
              <div className="text-xs text-slate-400 mt-1">اختر مريضاً من القائمة الجانبية أو اضغط على "مزامنة كروت الولاء لجميع الفواتير"</div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: EDIT ALL CARD FIELDS */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full my-auto overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-400" />
                <h3 className="font-black text-sm">تعديل وتبديل كافة حقول كارت الولاء</h3>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditProfile} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم المريض / العضو:</label>
                  <input
                    type="text"
                    value={editForm.patientName}
                    onChange={e => setEditForm(prev => ({ ...prev, patientName: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم الهاتف:</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 font-mono"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">رقم / كود الكارت (Card Number):</label>
                    <button
                      type="button"
                      onClick={handleRegenerateCardCode}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>توليد كود كارت جديد تلقائياً</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={editForm.cardNumber}
                    onChange={e => setEditForm(prev => ({ ...prev, cardNumber: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold text-slate-900 bg-slate-50"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">فئة العضوية (Tier):</label>
                  <select
                    value={editForm.tier}
                    onChange={e => {
                      const newTier = e.target.value as LoyaltyTier;
                      setEditForm(prev => ({
                        ...prev,
                        tier: newTier,
                        cardNumber: syncCardNumberTier(prev.cardNumber, newTier, activeProfile?.barcode)
                      }));
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-bold"
                  >
                    <option value="Silver">Silver VIP (خصم %{loyaltyConfig.tiers.Silver.discountRate})</option>
                    <option value="Gold">Gold VIP (خصم %{loyaltyConfig.tiers.Gold.discountRate})</option>
                    <option value="Platinum">Platinum VIP (خصم %{loyaltyConfig.tiers.Platinum.discountRate})</option>
                    <option value="VIP">Diamond Elite (خصم %{loyaltyConfig.tiers.VIP.discountRate})</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">فصيلة الدم (Blood Group):</label>
                  <select
                    value={editForm.bloodGroup}
                    onChange={e => setEditForm(prev => ({ ...prev, bloodGroup: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-bold"
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">رصيد النقاط الإجمالي:</label>
                  <input
                    type="number"
                    value={editForm.totalPoints}
                    onChange={e => {
                      const newPts = Math.max(0, Number(e.target.value) || 0);
                      setEditForm(prev => {
                        const wasAutoTier = prev.tier === computeLoyaltyTier(prev.totalPoints, loyaltyConfig);
                        const nextTier = wasAutoTier ? computeLoyaltyTier(newPts, loyaltyConfig) : prev.tier;
                        return {
                          ...prev,
                          totalPoints: newPts,
                          tier: nextTier,
                          cardNumber: wasAutoTier
                            ? syncCardNumberTier(prev.cardNumber, nextTier, activeProfile?.barcode)
                            : prev.cardNumber
                        };
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold text-amber-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">إجمالي الإنفاق (ج.م):</label>
                  <input
                    type="number"
                    value={editForm.lifetimeSpent}
                    onChange={e => setEditForm(prev => ({ ...prev, lifetimeSpent: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم هاتف الطوارئ (اختياري):</label>
                  <input
                    type="text"
                    value={editForm.emergencyContact}
                    onChange={e => setEditForm(prev => ({ ...prev, emergencyContact: e.target.value }))}
                    placeholder="يمكن تركه فارغاً للحذف"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">تاريخ الإصدار:</label>
                  <input
                    type="date"
                    value={editForm.issueDate}
                    onChange={e => setEditForm(prev => ({ ...prev, issueDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">حالات صحية خاصة أو ملاحظات:</label>
                  <input
                    type="text"
                    value={editForm.chronicConditions}
                    onChange={e => setEditForm(prev => ({ ...prev, chronicConditions: e.target.value }))}
                    placeholder="مثال: حساسية بنسلين، سكري نمط 2 (افصل بفاصلة)"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditForm(prev => ({ ...prev, emergencyContact: '', chronicConditions: '' }))}
                  className="text-rose-700 hover:text-rose-900 font-bold"
                >
                  تفريغ الحقول الاختيارية
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm"
                  >
                    حفظ وتحديث بيانات الكارت
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD POINTS */}
      {isAddPointsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-slate-900">إضافة نقاط لحساب المريض</h3>
              <button onClick={() => setIsAddPointsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setAddMode('by_cash')}
                className={`flex-1 py-1.5 rounded-md font-bold transition-all ${
                  addMode === 'by_cash' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                احتساب بمبلغ الفاتورة (ج.م)
              </button>
              <button
                type="button"
                onClick={() => setAddMode('direct')}
                className={`flex-1 py-1.5 rounded-md font-bold transition-all ${
                  addMode === 'direct' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                إدخال عدد النقاط مباشرة
              </button>
            </div>

            {addMode === 'by_cash' ? (
              <div>
                <label className="block text-slate-600 font-semibold mb-1">المبلغ المسدد (ج.م):</label>
                <input
                  type="number"
                  value={cashAmount}
                  onChange={e => setCashAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                />
                <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                  النقاط المحتسبة: {calculatePointsForAmount(cashAmount)} نقطة
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-slate-600 font-semibold mb-1">عدد النقاط المضافة:</label>
                <input
                  type="number"
                  value={directPoints}
                  onChange={e => setDirectPoints(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-slate-600 font-semibold mb-1">بيان / سبب الإضافة:</label>
              <input
                type="text"
                value={pointsReason}
                onChange={e => setPointsReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setIsAddPointsOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddPointsSubmit}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold"
              >
                تأكيد إضافة النقاط
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: REDEEM POINTS */}
      {isRedeemOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-slate-900">استبدال النقاط بخصم نقدي</h3>
              <button onClick={() => setIsRedeemOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
              <div className="text-slate-600 font-medium">رصيد المريض المتاح:</div>
              <div className="text-xl font-black text-amber-800 font-mono mt-0.5">
                {activeProfile?.totalPoints || 0} نقطة
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                الحد الأقصى للخصم المتاح: <strong>{calculateCashForPoints(activeProfile?.totalPoints || 0)} ج.م</strong>
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">النقاط المراد استبدالها:</label>
              <input
                type="number"
                max={activeProfile?.totalPoints || 0}
                value={pointsToRedeem}
                onChange={e => setPointsToRedeem(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
              />
              <div className="text-[11px] text-emerald-700 font-bold mt-1">
                قيمة الخصم النقدي الممنوح: {calculateCashForPoints(pointsToRedeem)} ج.م
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setIsRedeemOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
              >
                إلغاء
              </button>
              <button
                onClick={handleRedeemSubmit}
                disabled={pointsToRedeem <= 0 || pointsToRedeem > (activeProfile?.totalPoints || 0)}
                className="px-4 py-2 bg-rose-800 hover:bg-rose-900 disabled:opacity-50 text-white rounded-lg font-bold"
              >
                تأكيد الاستبدال وتطبيق الخصم
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: NEW PROFILE */}
      {isNewProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-slate-900">إصدار كارت ولاء طبي جديد</h3>
              <button onClick={() => setIsNewProfileOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewProfile} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">اسم المريض:</label>
                <input
                  type="text"
                  value={newPatientName}
                  onChange={e => setNewPatientName(e.target.value)}
                  placeholder="الاسم ثلاثي أو رباعي"
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">رقم الهاتف:</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  placeholder="011xxxxxxxx"
                  className="w-full px-3 py-2 border rounded-lg font-mono text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">فصيلة الدم:</label>
                <select
                  value={newBloodGroup}
                  onChange={e => setNewBloodGroup(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs bg-white"
                >
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">رقم هاتف الطوارئ (اختياري):</label>
                <input
                  type="text"
                  value={newEmergency}
                  onChange={e => setNewEmergency(e.target.value)}
                  placeholder="هاتف قريب أو مرافق"
                  className="w-full px-3 py-2 border rounded-lg font-mono text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsNewProfileOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold"
                >
                  إصدار الكارت الذكي (هدية {loyaltyConfig.welcomeBonusPoints ?? 50} نقطة)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: SETTINGS & POINTS CALCULATION RULE */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 space-y-5 text-xs animate-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
                  <Sliders className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">إعدادات الإدارة: قواعد احتساب النقاط وكروت الولاء</h3>
                  <p className="text-[11px] text-slate-500">تعديل معادلة النقاط للتحاليل فقط، واستبعاد رسوم الزيارة، وإعادة الحساب للأثر الرجعي</p>
                </div>
              </div>
              <button 
                onClick={() => setIsSettingsOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {/* 1. Points per paid amount rule */}
              <div className="bg-gradient-to-br from-amber-50/60 to-orange-50/60 p-4 rounded-2xl border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs text-amber-950 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-amber-600" />
                    <span>طريقة احتساب النقاط بالنسبة للقيمة المدفوعة (للتحاليل فقط):</span>
                  </span>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-full">
                    معدل مرن للإدارة
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs">
                    <label className="block text-slate-700 font-bold mb-1">
                      النقاط المكتسبة لكل 1 ج.م مدفوع:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={tempConfig.pointsPerEGP}
                        onChange={e => {
                          const val = Math.max(0, Number(e.target.value));
                          setTempConfig(prev => ({ 
                            ...prev, 
                            pointsPerEGP: val,
                            egpUnitForPoints: val > 0 ? Number((1 / val).toFixed(2)) : 0
                          }));
                        }}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                      <span className="font-bold text-slate-600 shrink-0">نقطة / ج.م</span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">مثال: 1 = كل جنيه نقطة | 0.5 = كل جنيهين نقطة</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs">
                    <label className="block text-slate-700 font-bold mb-1">
                      أو: كم جنيه مدفوع يكافئ نقطة واحدة:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={tempConfig.pointsPerEGP > 0 ? Number((1 / tempConfig.pointsPerEGP).toFixed(2)) : 0}
                        onChange={e => {
                          const egpVal = Math.max(0.01, Number(e.target.value));
                          const pointsVal = egpVal > 0 ? Number((1 / egpVal).toFixed(4)) : 0;
                          setTempConfig(prev => ({ 
                            ...prev, 
                            pointsPerEGP: pointsVal,
                            egpUnitForPoints: egpVal
                          }));
                        }}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                      <span className="font-bold text-slate-600 shrink-0">ج.م / نقطة</span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">مثال: 10 = كل 10 جنيه نقطة | 1 = كل جنيه نقطة</span>
                  </div>
                </div>

                {/* Live Simulation Card */}
                <div className="bg-white/90 p-3 rounded-xl border border-amber-200/90 text-[11px] text-amber-950 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-900">
                    <Calculator className="w-3.5 h-3.5 text-amber-600" />
                    <span>معاينة فورية لتطبيق القاعدة:</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    إذا حجز مريض تحاليل بقيمة <strong className="text-slate-900">500 ج.م</strong> + رسوم زيارة منزلية <strong className="text-rose-700">100 ج.م</strong> وسدد الفاتورة بالكامل (600 ج.م):
                  </p>
                  <p className="font-bold text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                    ✓ سيكتسب المريض: <span className="font-mono text-sm font-black text-emerald-900">+{Math.floor(500 * (tempConfig.pointsPerEGP || 0))} نقطة ولاء</span> (محسوبة على الـ 500 ج.م للتحاليل فقط، ورسوم الزيارة 100 ج.م مستبعدة بالكامل).
                  </p>
                </div>
              </div>

              {/* 2. Automation and Exclusion Rules */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-black text-xs text-slate-900">الضوابط الذكية والاستبعاد التلقائي:</h4>
                
                <div className="space-y-2.5">
                  <label className="flex items-start gap-2.5 p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50/80 transition-colors">
                    <input
                      type="checkbox"
                      checked={tempConfig.excludeVisitFee !== false}
                      onChange={e => setTempConfig(prev => ({ ...prev, excludeVisitFee: e.target.checked }))}
                      className="w-4 h-4 text-emerald-600 rounded mt-0.5 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">
                        استبعاد رسوم الزيارة والسحب المنزلي من احتساب النقاط (قيمة التحاليل فقط) [موصى به]
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        يضمن عدم احتساب أي نقاط ولاء على تكلفة انتقال التمريض أو رسوم الزيارة، واقتصار النقاط على مبالغ التحاليل المدفوعة فقط.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50/80 transition-colors">
                    <input
                      type="checkbox"
                      checked={tempConfig.autoCreateCardOnBooking !== false}
                      onChange={e => setTempConfig(prev => ({ ...prev, autoCreateCardOnBooking: e.target.checked }))}
                      className="w-4 h-4 text-emerald-600 rounded mt-0.5 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">
                        تفعيل إصدار كارت ولاء ذكي تلقائياً لكل حجز جديد على السيستم
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        أي حجز جديد لمريض غير مسجل في برنامج الولاء يتم فوراً إنشاء كارت ذكي له وتوثيق نقاطه في أرشيف كروت المرضى.
                      </span>
                    </div>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      نقاط ترحيبية هدية عند إصدار الكارت التلقائي لأول مرة:
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={tempConfig.welcomeBonusPoints ?? 50}
                      onChange={e => setTempConfig(prev => ({ ...prev, welcomeBonusPoints: Number(e.target.value) }))}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold"
                    />
                    <span className="text-[10px] text-slate-500">الافتراضي: 50 نقطة ترحيبية</span>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      قيمة الخصم النقدي لكل 100 نقطة (ج.م):
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={tempConfig.egpPer100Points}
                      onChange={e => setTempConfig(prev => ({ ...prev, egpPer100Points: Number(e.target.value) }))}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold"
                    />
                    <span className="text-[10px] text-slate-500">الافتراضي: 10 ج.م / 100 نقطة</span>
                  </div>
                </div>
              </div>

              {/* 3. Tiers, Thresholds & Discounts */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-slate-800">فئات العضوية والترقية التراكمية ونسب الخصم (%):</h4>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                    كل 100 نقطة = {tempConfig.egpPer100Points} ج.م
                  </span>
                </div>
                <div className="space-y-2">
                  {LOYALTY_TIER_ORDER.map(tKey => {
                    const pal = getTierPalette(tKey);
                    const tierCfg = tempConfig.tiers[tKey];
                    return (
                      <div
                        key={tKey}
                        className={`flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl border ${pal.badgeBgClass}`}
                      >
                        <div className="font-black text-xs">{pal.titleAr}</div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold opacity-80">يبدأ من:</span>
                            <input
                              type="number"
                              min="0"
                              value={tierCfg.minPoints}
                              onChange={e => setTempConfig(prev => ({
                                ...prev,
                                tiers: {
                                  ...prev.tiers,
                                  [tKey]: { ...prev.tiers[tKey], minPoints: Math.max(0, Number(e.target.value)) }
                                }
                              }))}
                              className="w-20 px-2 py-1 border border-slate-300 bg-white text-slate-900 rounded text-center font-mono font-bold"
                            />
                            <span className="text-[10px] font-bold">نقطة</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold opacity-80">الخصم:</span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={tierCfg.discountRate}
                              onChange={e => setTempConfig(prev => ({
                                ...prev,
                                tiers: {
                                  ...prev.tiers,
                                  [tKey]: { ...prev.tiers[tKey], discountRate: Math.max(0, Math.min(100, Number(e.target.value))) }
                                }
                              }))}
                              className="w-16 px-2 py-1 border border-slate-300 bg-white text-slate-900 rounded text-center font-mono font-bold"
                            />
                            <span className="font-bold">%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => setTempConfig(DEFAULT_LOYALTY_CONFIG)}
                className="text-slate-500 hover:text-slate-800 text-xs font-semibold underline underline-offset-2 cursor-pointer"
              >
                استعادة القيم الافتراضية
              </button>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateLoyaltyConfig(tempConfig);
                    setIsSettingsOpen(false);
                    showNotice('success', 'تم تثبيت سياسة النقاط والخصومات وتفعيل التحديث على كافة الكروت المسجلة فوراً.');
                  }}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold cursor-pointer transition-all active:scale-95 shadow-sm"
                >
                  تثبيت وتفعيل على كل الكروت ✓
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateLoyaltyConfig(tempConfig);
                    const res = recalculateAllLoyaltyPoints(tempConfig);
                    setIsSettingsOpen(false);
                    setRecalcSummary(res);
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl font-black cursor-pointer transition-all active:scale-95 shadow-md flex items-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4 text-amber-200" />
                  <span>حفظ وإعادة احتساب كافة الحجوزات ⚡</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: RECALCULATION & SYNC SUMMARY */}
      {recalcSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 text-center space-y-5 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <Check className="w-9 h-9 stroke-[3]" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-black text-slate-900">
                تم بنجاح تحديث وإعادة احتساب نقاط الولاء!
              </h3>
              <p className="text-xs text-slate-500">
                تم تطبيق القاعدة الجديدة واحتساب النقاط بناءً على المبلغ المدفوع للتحاليل فقط مع استبعاد رسوم الزيارة تلقائياً.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-right">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block mb-1">الحجوزات والفواتير المفحوصة:</span>
                <strong className="text-base font-black font-mono text-slate-900">{recalcSummary.totalInvoicesProcessed} حجز</strong>
              </div>
              <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200">
                <span className="text-[11px] text-emerald-700 block mb-1">كروت جديدة أُصدرت تلقائياً:</span>
                <strong className="text-base font-black font-mono text-emerald-900">+{recalcSummary.newCardsCreatedCount} كارت</strong>
              </div>
              <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200">
                <span className="text-[11px] text-amber-700 block mb-1">بروفايلات المرضى المحدثة:</span>
                <strong className="text-base font-black font-mono text-amber-900">{recalcSummary.updatedProfilesCount} مريض</strong>
              </div>
              <div className="bg-indigo-50 p-3.5 rounded-2xl border border-indigo-200">
                <span className="text-[11px] text-indigo-700 block mb-1">إجمالي النقاط المحتسبة:</span>
                <strong className="text-base font-black font-mono text-indigo-900">{recalcSummary.totalPointsCalculated.toLocaleString()} نقطة</strong>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setRecalcSummary(null)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-md"
              >
                إغلاق وتأكيد البيانات المحدثة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
