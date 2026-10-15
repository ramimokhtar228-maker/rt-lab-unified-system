import pptxgen from 'pptxgenjs';
import { LabReport, LabInfo } from '../types/lab';
import { formatReferenceDisplay } from './cbcCalculator';
import { latin } from './reportTemplate';
import { reportFileName } from './pdfExport';

const RED = '7A0F1A';
const NAVY = '12284C';
const SOFT = 'EEF2F8';
const INK = '111827';
const MUTED = '6B7280';
const HIGH = 'B91C1C';
const LOW = '1D4ED8';
const FONT = 'Calibri';
const ROWS_PER_SLIDE = 9;

export async function exportReportToPPTX(report: LabReport, labInfo?: LabInfo): Promise<void> {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9'; // 10 x 5.625 in
  const labName = latin(labInfo?.labNameEn, 'RT Diagnostic Laboratories');
  pptx.author = labName;
  pptx.company = labName;
  pptx.title = `Lab Report - ${report.patient.fullName}`;

  const p = report.patient;
  const sex = p.gender === 'male' ? 'Male' : 'Female';
  const age = `${p.age} ${p.ageUnit === 'years' ? 'Y' : p.ageUnit === 'months' ? 'M' : 'D'}`;
  const collected = new Date(p.sampleDate).toLocaleDateString('en-GB');

  const chrome = (slide: pptxgen.Slide, n: number, total: number) => {
    slide.background = { color: 'FFFFFF' };
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 6.8, h: 0.12, fill: { color: RED }, line: { color: RED } });
    slide.addShape(pptx.ShapeType.rect, { x: 6.8, y: 0, w: 3.2, h: 0.12, fill: { color: NAVY }, line: { color: NAVY } });
    slide.addText(`${labName}  •  Report ${report.reportNumber}`, { x: 0.5, y: 5.25, w: 7, h: 0.25, fontSize: 9, color: MUTED, fontFace: FONT });
    slide.addText(`${n} / ${total}`, { x: 8.5, y: 5.25, w: 1, h: 0.25, fontSize: 9, color: MUTED, align: 'right', fontFace: FONT });
  };

  // Build slide plan
  type Chunk = { title: string; sample: string; rows: any[]; last: boolean; profile: typeof report.profiles[number] };
  const chunks: Chunk[] = [];
  report.profiles.forEach(profile => {
    for (let i = 0; i < Math.max(profile.parameters.length, 1); i += ROWS_PER_SLIDE) {
      const slice = profile.parameters.slice(i, i + ROWS_PER_SLIDE);
      chunks.push({
        title: latin(profile.titleEn, 'Laboratory Report'),
        sample: latin(profile.sampleType, '—'),
        rows: slice,
        last: i + ROWS_PER_SLIDE >= profile.parameters.length,
        profile,
      });
    }
  });
  const total = chunks.length + 1;

  // Cover
  const cover = pptx.addSlide();
  chrome(cover, 1, total);
  cover.addText('LABORATORY REPORT', { x: 0.6, y: 0.7, w: 8.8, h: 0.6, fontSize: 30, bold: true, color: RED, fontFace: FONT, charSpacing: 3 });
  cover.addText(labName, { x: 0.6, y: 1.3, w: 8.8, h: 0.4, fontSize: 16, color: NAVY, fontFace: FONT });
  cover.addShape(pptx.ShapeType.roundRect, { x: 0.6, y: 2.0, w: 8.8, h: 2.7, fill: { color: SOFT }, line: { color: SOFT }, rectRadius: 0.12 });
  cover.addShape(pptx.ShapeType.rect, { x: 0.6, y: 2.0, w: 0.07, h: 2.7, fill: { color: RED }, line: { color: RED } });
  const field = (label: string, value: string, x: number, y: number) => {
    cover.addText(label.toUpperCase(), { x, y, w: 4, h: 0.25, fontSize: 9, bold: true, color: MUTED, fontFace: FONT, charSpacing: 2 });
    cover.addText(value || '—', { x, y: y + 0.24, w: 4, h: 0.4, fontSize: 16, bold: true, color: INK, fontFace: FONT });
  };
  field('Patient', p.fullName, 1.0, 2.25);
  field('Lab No.', p.labNumber, 5.4, 2.25);
  field('Age / Sex', `${age} / ${sex}`, 1.0, 3.15);
  field('Collected', collected, 5.4, 3.15);
  field('Report No.', report.reportNumber, 1.0, 4.0);
  field('Tests', `${report.profiles.length} panel${report.profiles.length > 1 ? 's' : ''}`, 5.4, 4.0);

  // Result slides
  chunks.forEach((c, idx) => {
    const s = pptx.addSlide();
    chrome(s, idx + 2, total);
    s.addText(c.title.toUpperCase(), { x: 0.5, y: 0.3, w: 7.5, h: 0.4, fontSize: 18, bold: true, color: RED, fontFace: FONT });
    s.addText(`${p.fullName}  •  ${age} / ${sex}  •  Sample: ${c.sample}`, { x: 0.5, y: 0.7, w: 9, h: 0.25, fontSize: 10, color: MUTED, fontFace: FONT });

    const head = ['Test', 'Result', 'Unit', 'Flag', 'Reference'].map(t => ({
      text: t, options: { bold: true, color: 'FFFFFF', fill: { color: NAVY }, fontSize: 10, fontFace: FONT, align: t === 'Flag' ? 'center' : 'left' } as any,
    }));
    const body = c.rows.map((r: any, i: number) => {
      const f = r.flag as string;
      const color = f === 'HIGH' || f === 'PANIC_HIGH' || f === 'ABNORMAL' ? HIGH : f === 'LOW' || f === 'PANIC_LOW' ? LOW : INK;
      const flag = f === 'HIGH' ? 'H' : f === 'LOW' ? 'L' : f === 'PANIC_HIGH' ? 'H▲▲' : f === 'PANIC_LOW' ? 'L▼▼' : f === 'ABNORMAL' ? 'ABN' : '';
      const fill = { color: i % 2 ? 'F9FAFB' : 'FFFFFF' };
      const base = { fontFace: FONT, fontSize: 11, fill, color: INK, valign: 'middle' } as any;
      return [
        { text: latin(r.name, r.name), options: { ...base, bold: true } },
        { text: String(r.result || '—'), options: { ...base, bold: true, fontSize: 13, color } },
        { text: latin(r.unit), options: { ...base, color: MUTED } },
        { text: flag, options: { ...base, bold: true, color, align: 'center' } },
        { text: latin(formatReferenceDisplay(r), '—'), options: { ...base, fontSize: 10, color: '374151' } },
      ];
    });
    s.addTable([head, ...body] as any, {
      x: 0.5, y: 1.1, w: 9.0, colW: [3.0, 1.5, 1.1, 0.8, 2.6], rowH: 0.3,
      border: { type: 'solid', pt: 0.5, color: 'E5E7EB' }, margin: [0.04, 0.1, 0.04, 0.1],
    });

    if (c.last) {
      const note = [latin(c.profile.interpretation), latin(c.profile.comment)].filter(Boolean).join('\n');
      if (note) {
        s.addText([{ text: 'INTERPRETATION / COMMENT\n', options: { bold: true, fontSize: 9, color: RED, charSpacing: 2 } },
                   { text: note, options: { fontSize: 11, color: INK } }],
          { x: 0.5, y: 4.15, w: 9.0, h: 1.0, fontFace: FONT, fill: { color: 'FDF2F3' }, valign: 'top', margin: 8, fit: 'shrink' });
      }
    }
  });

  await pptx.writeFile({ fileName: reportFileName(report, 'pptx') });
}
