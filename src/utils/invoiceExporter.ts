import type { LabInfo, LoyaltyConfig, PatientLoyaltyProfile } from '../types';
import { tafqeetEGP } from './tafqeet';
import { generateBarcodeSVG } from './barcode';
import {
  getTierPalette,
  pointsCashValue,
  redemptionSummaryText,
  resolveProfileTier,
  tierDiscountRate
} from './loyaltyEngine';
import { copyDataUrlToClipboard } from './loyaltyCardCanvas';
import {
  BRANCH_MAIN_ADDRESS,
  INSTAPAY_IPA,
  LAB_NAME_AR,
  LAB_PHONE,
  LAB_PHONE_SECONDARY,
  LAB_WHATSAPP,
  WALLET_VODAFONE
} from './whatsapp';

export interface InvoiceExportItem {
  titleAr: string;
  titleEn?: string;
  code?: string;
  category?: string;
  sampleType?: string;
  parametersCount?: number;
  price: number;
}

export interface InvoiceExportPayload {
  invoiceNumber: string;
  labNumber: string;
  barcode: string;
  patientName: string;
  patientPhone?: string;
  ageText?: string;
  genderText?: string;
  referringDoctor?: string;
  sampleDateFormatted: string;
  reportingDateFormatted?: string;
  branchName?: string;
  representativeLabel?: string;
  representativeName?: string;
  items: InvoiceExportItem[];
  testsSubtotal: number;
  visitFee?: number;
  discount: number;
  netTotal: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethodLabel?: string;
  cashierName?: string;
  labInfo?: Partial<LabInfo>;
  loyaltyProfile?: PatientLoyaltyProfile;
  loyaltyConfig?: LoyaltyConfig;
  invoiceEarnedPoints?: number;
  isEarnedConfirmed?: boolean;
  displayMode?: 'detailed' | 'grouped';
  groupedTitleAr?: string;
  groupedTitleEn?: string;
}

function escapeHtml(val: string | number | undefined): string {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildInvoiceMarkup(payload: InvoiceExportPayload): string {
  const lab = payload.labInfo || {};
  const labNameAr = lab.labNameAr || LAB_NAME_AR;
  const labNameEn = lab.labNameEn || 'RT Diagnostic Laboratories';
  const supervisionAr = lab.supervisionAr || 'أطباء واستشاريو كلية طب قصر العيني';
  const supervisionEn = lab.supervisionEn || 'Kasr Al Ainy Clinical Pathology Consultants';
  const accreditation = lab.accreditation || 'ISO 15189 Certified';
  const hotline = lab.hotline || LAB_PHONE;
  const phone = lab.phone || LAB_PHONE_SECONDARY;
  const whatsapp = lab.whatsapp || LAB_WHATSAPP;
  const address = lab.mainAddress || BRANCH_MAIN_ADDRESS;
  const instapay = lab.instapay || INSTAPAY_IPA;
  const vodafone = lab.vodafoneCash || WALLET_VODAFONE;

  const barcodeSvg = generateBarcodeSVG(payload.barcode || payload.labNumber, 210, 44, true);

  let loyaltyCardHtml = '';
  if (payload.loyaltyProfile && payload.loyaltyConfig) {
    const prof = payload.loyaltyProfile;
    const cfg = payload.loyaltyConfig;
    const tier = resolveProfileTier(prof, cfg);
    const pal = getTierPalette(tier);
    const discPct = tierDiscountRate(tier, cfg);
    const cash = pointsCashValue(prof.totalPoints || 0, cfg);
    const cardCode = prof.cardNumber || prof.barcode || payload.barcode;

    loyaltyCardHtml = `
      <div style="margin: 14px 0; border-radius: 12px; padding: 12px 16px; background: ${pal.printBgGradient}; color: #ffffff; border: 2px solid ${pal.printBorderHex}; box-shadow: 0 4px 12px rgba(15,23,42,0.14);">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 8px; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="display: inline-flex; width: 28px; height: 28px; border-radius: 8px; background: rgba(255,255,255,0.16); border: 1px solid ${pal.printBorderHex}; align-items: center; justify-content: center; font-weight: 900; font-size: 11px;">RT</span>
            <div>
              <div style="font-size: 12px; font-weight: 900; color: #ffffff;">كارت الولاء الطبي الذكي — ${escapeHtml(pal.titleAr)}</div>
              <div style="font-size: 10px; color: ${pal.accentHex}; font-family: monospace; font-weight: 700;">رقم الكارت: ${escapeHtml(cardCode)}</div>
            </div>
          </div>
          <div style="background: ${pal.discountBgHex}; border: 1px solid ${pal.printBorderHex}; border-radius: 20px; padding: 3px 10px; font-size: 11px; font-weight: 900; color: ${pal.discountTextHex};">
            خصم دائم معتمد: %${discPct}
          </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 11px;">
          <div style="background: rgba(0,0,0,0.35); border-radius: 8px; padding: 6px 10px; border: 1px solid rgba(255,255,255,0.14);">
            <div style="color: #cbd5e1; font-size: 9.5px;">رصيد النقاط الحالي:</div>
            <div style="font-weight: 900; font-size: 13px; color: ${pal.accentHex}; font-family: monospace;">${Number(prof.totalPoints || 0).toLocaleString()} نقطة</div>
          </div>
          <div style="background: rgba(0,0,0,0.35); border-radius: 8px; padding: 6px 10px; border: 1px solid rgba(255,255,255,0.14);">
            <div style="color: #cbd5e1; font-size: 9.5px;">القيمة النقدية للرصيد:</div>
            <div style="font-weight: 900; font-size: 13px; color: #34d399; font-family: monospace;">${cash.exactEGP} ج.م</div>
          </div>
          <div style="background: rgba(0,0,0,0.35); border-radius: 8px; padding: 6px 10px; border: 1px solid rgba(255,255,255,0.14);">
            <div style="color: #cbd5e1; font-size: 9.5px;">${payload.isEarnedConfirmed ? 'نقاط مكتسبة بهذه الفاتورة:' : 'نقاط متوقعة لهذه الفاتورة:'}</div>
            <div style="font-weight: 900; font-size: 13px; color: #fde68a; font-family: monospace;">+${Number(payload.invoiceEarnedPoints || 0).toLocaleString()} نقطة</div>
          </div>
        </div>
        <div style="margin-top: 7px; font-size: 9.5px; color: #fef08a; text-align: center; background: rgba(255,255,255,0.08); border-radius: 6px; padding: 3px 8px; font-weight: 700;">
          ${escapeHtml(redemptionSummaryText(cfg))} · الترقية التراكمية تلقائياً مع كل حجز بنفس الهاتف
        </div>
      </div>
    `;
  }

  const isGrouped = payload.displayMode === 'grouped';
  const groupedTitle = payload.groupedTitleAr?.trim() || `مجموعة الفحوصات والتحاليل الطبية (${payload.items.length})`;
  const groupedItemsSummary = payload.items
    .map((it) => escapeHtml(it.titleAr))
    .filter(Boolean)
    .join(' • ');

  const rowsHtml = isGrouped
    ? `
      <tr style="border-bottom: 1px solid #e2e8f0; background: #ffffff;">
        <td style="padding: 10px; text-align: center; color: #64748b; font-family: monospace; font-size: 11px; vertical-align: top;">1</td>
        <td style="padding: 10px; text-align: right;">
          <div style="font-weight: 900; color: #0f172a; font-size: 12.5px;">${escapeHtml(groupedTitle)}</div>
          ${payload.groupedTitleEn ? `<div style="font-size: 10px; color: #475569; margin-top: 2px;" dir="ltr">${escapeHtml(payload.groupedTitleEn)}</div>` : ''}
          ${groupedItemsSummary ? `<div style="font-size: 10px; color: #64748b; margin-top: 4px; line-height: 1.55;">تشمل: ${groupedItemsSummary}</div>` : ''}
        </td>
        <td style="padding: 10px; text-align: center; color: #475569; font-size: 11px;">فحوصات مجمعة</td>
        <td style="padding: 10px; text-align: center; color: #475569; font-family: monospace; font-size: 11px;">${payload.items.length} تحاليل</td>
        <td style="padding: 10px; text-align: left; font-family: monospace; font-weight: 900; color: #7f1d1d; font-size: 12.5px;" dir="ltr">${Number(payload.testsSubtotal || 0).toFixed(2)} EGP</td>
      </tr>`
    : payload.items
        .map(
          (it, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0; background: ${idx % 2 === 1 ? '#f8fafc' : '#ffffff'};">
        <td style="padding: 8px 10px; text-align: center; color: #64748b; font-family: monospace; font-size: 11px;">${idx + 1}</td>
        <td style="padding: 8px 10px; text-align: right;">
          <div style="font-weight: 800; color: #0f172a; font-size: 12px;">${escapeHtml(it.titleAr)}</div>
          ${it.titleEn ? `<div style="font-size: 10px; color: #64748b;" dir="ltr">${escapeHtml(it.titleEn)}</div>` : ''}
        </td>
        <td style="padding: 8px 10px; text-align: center; color: #475569; font-size: 11px;">${escapeHtml(it.sampleType || it.category || 'تحاليل طبية')}</td>
        <td style="padding: 8px 10px; text-align: center; color: #475569; font-family: monospace; font-size: 11px;">${it.parametersCount ? `${it.parametersCount} عنصر` : (it.code || 'LAB')}</td>
        <td style="padding: 8px 10px; text-align: left; font-family: monospace; font-weight: 800; color: #7f1d1d; font-size: 12px;" dir="ltr">${Number(it.price || 0).toFixed(2)} EGP</td>
      </tr>`
        )
        .join('');

  return `
  <div dir="rtl" style="font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif; color: #0f172a; background: #ffffff; width: 790px; padding: 28px 32px; box-sizing: border-box;">
    <!-- Executive Header -->
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #7f1d1d; padding-bottom: 12px; gap: 14px;">
      <div style="text-align: right; flex: 1;">
        <div style="font-size: 19px; font-weight: 900; color: #7f1d1d; line-height: 1.2;">${escapeHtml(labNameAr)}</div>
        <div style="font-size: 11.5px; font-weight: 700; color: #1e293b; margin-top: 3px;">${escapeHtml(supervisionAr)}</div>
        <div style="font-size: 10px; color: #475569; margin-top: 4px;">
          📞 الخط الساخن والهاتف: <strong style="color:#0f172a; font-family: monospace;">${escapeHtml(hotline)} — ${escapeHtml(phone)}</strong> | 💬 واتساب: <strong style="color:#065f46; font-family: monospace;">${escapeHtml(whatsapp)}</strong>
        </div>
        <div style="font-size: 9.5px; color: #64748b; margin-top: 2px;">📍 ${escapeHtml(address)}</div>
      </div>

      <div style="text-align: center; shrink: 0;">
        <div style="display: inline-block; background: linear-gradient(135deg, #7f1d1d, #991b1b); color: #ffffff; padding: 6px 16px; border-radius: 10px; font-weight: 900; font-size: 12.5px;">
          فاتورة فحص طبي وإيصال سداد
        </div>
        <div style="font-size: 9.5px; color: #64748b; margin-top: 4px; font-family: monospace; font-weight: 700;">OFFICIAL INVOICE & RECEIPT</div>
      </div>

      <div style="text-align: left; flex: 0.9;" dir="ltr">
        <div style="font-size: 15px; font-weight: 900; color: #7f1d1d;">${escapeHtml(labNameEn)}</div>
        <div style="font-size: 10px; font-weight: 700; color: #334155; margin-top: 2px;">${escapeHtml(supervisionEn)}</div>
        <div style="font-size: 9.5px; color: #64748b; margin-top: 2px;">${escapeHtml(accreditation)}</div>
        <div style="font-size: 12px; font-weight: 900; color: #7f1d1d; font-family: monospace; margin-top: 3px;">${escapeHtml(payload.invoiceNumber)}</div>
      </div>
    </div>

    <div style="display: flex; height: 3px; width: 100%; margin: 4px 0 14px 0;">
      <div style="width: 72%; background: #7f1d1d;"></div>
      <div style="width: 28%; background: #0f172a;"></div>
    </div>

    <!-- Patient Meta + Barcode -->
    <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px 14px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; gap: 14px;">
      <div style="flex: 1; display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px 14px; font-size: 11.5px;">
        <div><span style="color: #64748b;">اسم المريض: </span><strong style="color: #0f172a; font-size: 13px;">${escapeHtml(payload.patientName)}</strong></div>
        <div><span style="color: #64748b;">رقم المعمل: </span><strong style="color: #7f1d1d; font-family: monospace;">${escapeHtml(payload.labNumber)}</strong></div>
        <div><span style="color: #64748b;">الهاتف: </span><strong style="font-family: monospace;">${escapeHtml(payload.patientPhone || '—')}</strong></div>
        <div><span style="color: #64748b;">السن / النوع: </span><strong>${escapeHtml(payload.ageText || '—')} / ${escapeHtml(payload.genderText || '—')}</strong></div>
        <div><span style="color: #64748b;">تاريخ السحب: </span><span style="font-family: monospace;">${escapeHtml(payload.sampleDateFormatted)}</span></div>
        <div><span style="color: #64748b;">موعد الاستلام: </span><strong style="color: #7f1d1d; font-family: monospace;">${escapeHtml(payload.reportingDateFormatted || 'خلال 24 ساعة')}</strong></div>
        <div><span style="color: #64748b;">الطبيب المعالج: </span><strong>${escapeHtml(payload.referringDoctor || 'طلب فحص ذاتي')}</strong></div>
        <div><span style="color: #64748b;">الفرع: </span><strong>${escapeHtml(payload.branchName || 'الفرع الرئيسي - بهتيم')}</strong></div>
        ${payload.representativeName ? `<div style="grid-column: span 2;"><span style="color: #64748b;">${escapeHtml(payload.representativeLabel || 'المسؤول')}: </span><strong>${escapeHtml(payload.representativeName)}</strong></div>` : ''}
      </div>
      <div style="text-align: center; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 8px;">
        <div>${barcodeSvg}</div>
        <div style="font-size: 9px; color: #475569; font-family: monospace; margin-top: 2px;">${escapeHtml(payload.barcode)}</div>
      </div>
    </div>

    <!-- Tests Table -->
    <div style="border: 1px solid #cbd5e1; border-radius: 10px; overflow: hidden; margin-bottom: 14px;">
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f1f5f9; color: #1e293b; font-size: 11px; font-weight: 800; border-bottom: 1.5px solid #cbd5e1;">
            <th style="padding: 8px 10px; width: 6%; text-align: center;">#</th>
            <th style="padding: 8px 10px; width: 44%; text-align: right;">اسم التحليل / الباقة</th>
            <th style="padding: 8px 10px; width: 18%; text-align: center;">العينة / القسم</th>
            <th style="padding: 8px 10px; width: 16%; text-align: center;">الكود / العناصر</th>
            <th style="padding: 8px 10px; width: 16%; text-align: left;">القيمة (EGP)</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>

    <!-- Integrated Loyalty Card Panel -->
    ${loyaltyCardHtml}

    <!-- Totals & Notes Row -->
    <div style="display: flex; justify-content: space-between; align-items: stretch; gap: 16px; margin-top: 12px; margin-bottom: 14px;">
      <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between; gap: 10px;">
        <div style="background: #fff1f2; border: 1px dashed #f43f5e; border-radius: 10px; padding: 10px 14px; font-size: 10.5px; line-height: 1.65; color: #881337;">
          <strong>تنبيهات وتعليمات هامة:</strong>
          <ul style="margin: 4px 0 0 0; padding-right: 16px;">
            <li>يرجى إبراز الفاتورة أو رقم الكارت عند استلام التقرير أو الحجز القادم لجمع النقاط تلقائياً.</li>
            <li>يتم إرسال النتائج المعتمدة بصيغة PDF عبر الواتساب فور اعتمادها من الاستشاريين.</li>
          </ul>
        </div>
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 9px 14px; font-size: 10.5px; color: #1e3a8a;">
          <strong>💳 الدفع الإلكتروني والتحويل المعتمد:</strong>
          <div style="margin-top: 3px; font-family: monospace; font-weight: 700;">
            InstaPay: ${escapeHtml(instapay)} &nbsp;|&nbsp; Vodafone Cash: ${escapeHtml(vodafone)}
          </div>
        </div>
      </div>

      <div style="width: 285px; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 12px 14px; font-size: 11.5px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
          <span style="color: #64748b;">إجمالي التحاليل:</span>
          <span style="font-family: monospace; font-weight: 700;">${payload.testsSubtotal.toFixed(2)} ج.م</span>
        </div>
        ${payload.visitFee && payload.visitFee > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px; color: #4338ca; font-weight: 700;">
            <span>رسوم الزيارة المنزلية:</span>
            <span style="font-family: monospace;">+ ${payload.visitFee.toFixed(2)} ج.م</span>
          </div>` : ''}
        ${payload.discount > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px; color: #059669; font-weight: 700;">
            <span>الخصم المطبق:</span>
            <span style="font-family: monospace;">- ${payload.discount.toFixed(2)} ج.م</span>
          </div>` : ''}
        <div style="display: flex; justify-content: space-between; padding-top: 6px; border-top: 1.5px solid #cbd5e1; font-size: 13.5px; font-weight: 900; color: #7f1d1d; margin-bottom: 5px;">
          <span>الصافي المطلوب:</span>
          <span style="font-family: monospace;">${payload.netTotal.toFixed(2)} ج.م</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
          <span style="color: #64748b;">المدفوع${payload.paymentMethodLabel ? ` (${escapeHtml(payload.paymentMethodLabel)})` : ''}:</span>
          <span style="font-family: monospace; font-weight: 800; color: #059669;">${payload.paidAmount.toFixed(2)} ج.م</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding-top: 5px; border-top: 1px dashed #cbd5e1; font-weight: 800;">
          <span style="color: ${payload.remainingAmount > 0 ? '#b91c1c' : '#059669'};">${payload.remainingAmount > 0 ? 'المتبقي للخزينة:' : 'حالة الحساب:'}</span>
          <span style="font-family: monospace; color: ${payload.remainingAmount > 0 ? '#b91c1c' : '#059669'};">
            ${payload.remainingAmount > 0 ? `${payload.remainingAmount.toFixed(2)} ج.م` : 'مسدد بالكامل ✓'}
          </span>
        </div>
        <div style="margin-top: 8px; padding: 6px 8px; border-radius: 6px; background: #fffbeb; border: 1px solid #fde68a; font-size: 10.5px; font-weight: 800; color: #7f1d1d;">
          فقط: ${escapeHtml(tafqeetEGP(payload.netTotal))}
        </div>
      </div>
    </div>

    <!-- Signatures & Footer -->
    <div style="border-top: 1.5px solid #cbd5e1; padding-top: 10px;">
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; text-align: center; font-size: 11px;">
        <div>
          <div style="font-weight: 700; color: #64748b;">مسؤول الاستقبال والخزينة</div>
          <div style="font-weight: 800; color: #0f172a; padding: 4px 0;">${escapeHtml(payload.cashierName || 'الاستقبال والخزينة')}</div>
          <div style="font-size: 9.5px; color: #64748b;">${escapeHtml(payload.branchName || 'فرع بهتيم الرئيسي')}</div>
        </div>
        <div>
          <div style="display: inline-block; border: 2px dashed #7f1d1d; border-radius: 50%; width: 52px; height: 52px; line-height: 48px; color: #7f1d1d; font-size: 10px; font-weight: 900;">
            ${payload.remainingAmount > 0 ? 'PARTIAL' : 'PAID ✓'}
          </div>
        </div>
        <div>
          <div style="font-weight: 800; color: #7f1d1d;">الإشراف العلمي والإدارة</div>
          <div style="font-weight: 700; color: #0f172a; padding: 4px 0; font-size: 10.5px;">${escapeHtml(supervisionAr)}</div>
          <div style="font-size: 9.5px; color: #64748b;">${escapeHtml(accreditation)}</div>
        </div>
      </div>
      <div style="text-align: center; font-size: 9px; color: #64748b; margin-top: 8px; padding-top: 5px; border-top: 1px solid #e2e8f0;">
        فاتورة إلكترونية معتمدة — ${escapeHtml(labNameAr)} | هاتف: ${escapeHtml(hotline)} — ${escapeHtml(phone)} | واتساب: ${escapeHtml(whatsapp)}
      </div>
    </div>
  </div>`;
}

export function buildInvoicePrintDocumentHTML(payload: InvoiceExportPayload): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>فاتورة فحص طبي - ${escapeHtml(payload.patientName)} - ${escapeHtml(payload.invoiceNumber)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff !important;
      font-family: 'Cairo', sans-serif;
      color: #0f172a;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .no-print-toolbar {
      position: sticky;
      top: 0;
      background: #0f172a;
      color: #ffffff;
      padding: 10px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 100;
    }
    .page-wrap { display: flex; justify-content: center; padding: 12px; }
    @media print {
      .no-print-toolbar { display: none !important; }
      .page-wrap { padding: 0 !important; }
      @page { size: A4 portrait; margin: 6mm; }
    }
  </style>
</head>
<body>
  <div class="no-print-toolbar">
    <div style="font-weight: bold; font-size: 13px;">معامل RT — فاتورة المريض وكارت الولاء المتكامل (A4)</div>
    <div style="display: flex; gap: 8px;">
      <button onclick="window.print()" style="background:#800000; color:#fff; border:none; padding:7px 16px; border-radius:6px; font-weight:bold; cursor:pointer; font-family:'Cairo',sans-serif;">🖨️ طباعة الآن</button>
      <button onclick="window.close()" style="background:#334155; color:#fff; border:none; padding:7px 14px; border-radius:6px; cursor:pointer; font-family:'Cairo',sans-serif;">إغلاق ✕</button>
    </div>
  </div>
  <div class="page-wrap">${buildInvoiceMarkup(payload)}</div>
  <script>
    window.addEventListener('load', function() { setTimeout(function() { window.print(); }, 450); });
  </script>
</body>
</html>`;
}

async function renderInvoiceCanvas(payload: InvoiceExportPayload): Promise<HTMLCanvasElement> {
  const { default: html2canvas } = await import('html2canvas');
  try {
    if (document.fonts?.ready) await document.fonts.ready;
  } catch {}

  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-12000px;top:0;background:#ffffff;z-index:-1;';
  host.innerHTML = buildInvoiceMarkup(payload);
  document.body.appendChild(host);

  try {
    const target = host.firstElementChild as HTMLElement;
    const canvas = await html2canvas(target || host, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      onclone: (clonedDoc) => {
        clonedDoc.querySelectorAll('style').forEach((s) => {
          if (s.textContent && (s.textContent.includes('oklch') || s.textContent.includes('oklab'))) {
            s.remove();
          }
        });
        clonedDoc.querySelectorAll('link[rel="stylesheet"]').forEach((l) => {
          const href = l.getAttribute('href') || '';
          if (!href.includes('fonts.googleapis.com')) l.remove();
        });
        const root = clonedDoc.documentElement;
        root.style.color = '#0f172a';
        root.style.backgroundColor = '#ffffff';
        clonedDoc.body.style.color = '#0f172a';
        clonedDoc.body.style.backgroundColor = '#ffffff';
      }
    });
    return canvas;
  } finally {
    document.body.removeChild(host);
  }
}

export async function exportInvoiceAsPNG(
  payload: InvoiceExportPayload,
  skipDownload = false
): Promise<{ dataUrl: string; copied: boolean }> {
  const canvas = await renderInvoiceCanvas(payload);
  const dataUrl = canvas.toDataURL('image/png');
  const safeName = payload.patientName.trim().replace(/\s+/g, '_') || 'Patient';
  if (!skipDownload) {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `RT-Invoice-${safeName}-${payload.invoiceNumber}.png`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => a.remove(), 400);
  }
  const copied = await copyDataUrlToClipboard(dataUrl);
  return { dataUrl, copied };
}

export async function exportInvoiceAsPDF(payload: InvoiceExportPayload): Promise<void> {
  const canvas = await renderInvoiceCanvas(payload);
  const { default: jsPDF } = await import('jspdf');
  const imgData = canvas.toDataURL('image/jpeg', 0.96);
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const pdfWidth = 210;
  const pdfHeight = 297;
  const margin = 6;
  const maxW = pdfWidth - margin * 2;
  const maxH = pdfHeight - margin * 2;
  let drawW = maxW;
  let drawH = (canvas.height * drawW) / canvas.width;
  if (drawH > maxH) {
    drawH = maxH;
    drawW = (canvas.width * drawH) / canvas.height;
  }
  const xOffset = (pdfWidth - drawW) / 2;
  pdf.addImage(imgData, 'JPEG', xOffset, margin, drawW, drawH, undefined, 'FAST');
  const safeName = payload.patientName.trim().replace(/\s+/g, '_') || 'Patient';
  pdf.save(`RT-Invoice-${safeName}-${payload.invoiceNumber}.pdf`);
}
