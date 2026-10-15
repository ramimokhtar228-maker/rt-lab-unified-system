import { LabReport, LabInfo } from '../types';
import { buildReportDocument } from './reportTemplate';

/** Opens the unified English-only report in a print-ready window (A4). */
export function openPrintReportWindow(report: LabReport, labInfo?: LabInfo): void {
  const html = buildReportDocument(report, labInfo, true);
  const w = window.open('', '_blank', 'width=950,height=1000');
  if (!w) {
    alert('Please allow pop-ups to preview and print the report.');
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
