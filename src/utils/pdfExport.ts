import { LabReport, LabInfo } from '../types/lab';
import { openPrintReportWindow } from './printReportWindow';
import { buildReportPages, REPORT_CSS, REPORT_FONT_LINK } from './reportTemplate';

export function reportFileName(report: LabReport, ext: string): string {
  const safe = report.patient.fullName.trim().replace(/\s+/g, '_').replace(/[^A-Za-z0-9_]/g, '') || 'Patient';
  return `RT_Report_${safe}_${report.patient.labNumber}.${ext}`;
}

/** Renders the report off-screen from the shared template and returns a PDF Blob. */
export async function buildReportPDFBlob(report: LabReport, labInfo?: LabInfo): Promise<Blob> {
  const { default: html2canvas } = await import('html2canvas');
  const { default: jsPDF } = await import('jspdf');

  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-10000px;top:0;width:210mm;background:#fff;z-index:-1;';
  host.innerHTML = `<link href="${REPORT_FONT_LINK}" rel="stylesheet"><style>${REPORT_CSS}</style><div class="rt-root">${buildReportPages(report, labInfo)}</div>`;
  document.body.appendChild(host);

  try {
    if ((document as any).fonts?.ready) await (document as any).fonts.ready;
    const pages = Array.from(host.querySelectorAll<HTMLElement>('.rt-page'));
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
    for (let i = 0; i < pages.length; i++) {
      const canvas = await html2canvas(pages[i], { scale: 2.2, useCORS: true, backgroundColor: '#ffffff', logging: false });
      if (i > 0) pdf.addPage('a4', 'portrait');
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.96), 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
    }
    return pdf.output('blob');
  } finally {
    document.body.removeChild(host);
  }
}

export async function downloadReportPDF(report: LabReport, labInfo?: LabInfo): Promise<void> {
  try {
    const blob = await buildReportPDFBlob(report, labInfo);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = reportFileName(report, 'pdf');
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  } catch (err) {
    console.warn('PDF canvas export failed, falling back to print window:', err);
    openPrintReportWindow(report, labInfo);
  }
}

export function triggerPrintDialog(report?: LabReport, labInfo?: LabInfo): void {
  if (report) return openPrintReportWindow(report, labInfo);
  try { window.print(); } catch { /* noop */ }
}
