import { LabReport, LabInfo } from '../types';
import { buildReportDocument } from './reportTemplate';
import { DEFAULT_STAFF } from '../data/labCatalog';

/** Opens the unified English-only report in a print-ready window (A4). */
export function openPrintReportWindow(report: LabReport, labInfo?: LabInfo, showVisualChart: boolean = true): void {
  const nowIso = new Date().toISOString();
  const safeReport: LabReport = {
    ...report,
    patient: {
      ...report.patient,
      sampleDate: report.patient?.sampleDate || report.createdAt || nowIso,
      reportingDate: nowIso
    },
    staff: {
      ...DEFAULT_STAFF,
      ...(labInfo as any)?.staffSignatures,
      ...report.staff
    }
  };
  const html = buildReportDocument(safeReport, labInfo, true, showVisualChart);
  const w = window.open('', '_blank', 'width=950,height=1000');
  if (!w) {
    // If pop-ups are blocked, write to hidden iframe and trigger print
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    iframe.contentDocument?.open();
    iframe.contentDocument?.write(html);
    iframe.contentDocument?.close();
    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => iframe.remove(), 10000);
    }, 500);
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
