import { LabReport, LabInfo } from '../types';
import { buildReportDocument } from './reportTemplate';
import { DEFAULT_STAFF } from '../data/labCatalog';

/** Opens the unified English-only report in a print-ready window (A4). */
export function openPrintReportWindow(report: LabReport, labInfo?: LabInfo): void {
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
  const html = buildReportDocument(safeReport, labInfo, true);
  const w = window.open('', '_blank', 'width=950,height=1000');
  if (!w) {
    alert('Please allow pop-ups to preview and print the report.');
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
