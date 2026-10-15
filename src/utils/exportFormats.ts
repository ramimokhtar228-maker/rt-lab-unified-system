import { LabReport, TestResultItem } from '../types/laboratory';

/**
 * Generates an HL7 FHIR R4 compliant DiagnosticReport resource with contained Observations.
 * International medical interoperability standard (ISO/HL7 21731).
 */
export function generateHL7FHIRJson(report: LabReport): string {
  const fhirDiagnosticReport = {
    resourceType: 'DiagnosticReport',
    id: `rtlab-${report.reportNumber}`,
    meta: {
      profile: ['http://hl7.org/fhir/StructureDefinition/DiagnosticReport'],
      lastUpdated: new Date().toISOString(),
    },
    identifier: [
      {
        system: 'https://rtlab.med/reports',
        value: report.reportNumber,
      },
      {
        system: 'https://rtlab.med/samples',
        value: report.patient.sampleId,
      },
    ],
    status: report.status === 'APPROVED' ? 'final' : 'preliminary',
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v2-0074',
            code: 'LAB',
            display: 'Laboratory',
          },
        ],
      },
    ],
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: report.panelCode === 'CBC' ? '58410-2' : '24323-8',
          display: report.panelNameEn,
        },
      ],
      text: `${report.panelNameEn} (${report.panelNameAr})`,
    },
    subject: {
      reference: `Patient/${report.patient.mrn}`,
      display: report.patient.fullNameEn || report.patient.fullName,
      identifier: {
        system: 'https://rtlab.med/patients/mrn',
        value: report.patient.mrn,
      },
    },
    effectiveDateTime: report.patient.collectionDate,
    issued: report.date,
    performer: [
      {
        display: report.verifiedBy,
      },
    ],
    resultsInterpreter: [
      {
        display: report.verifiedBy,
      },
    ],
    contained: report.results.map((item, index) => {
      let interpretationCode = 'N';
      let interpretationText = 'Normal';
      if (item.flag === 'LOW') {
        interpretationCode = 'L';
        interpretationText = 'Low';
      } else if (item.flag === 'HIGH') {
        interpretationCode = 'H';
        interpretationText = 'High';
      } else if (item.flag === 'CRITICAL_LOW' || item.flag === 'CRITICAL_HIGH') {
        interpretationCode = 'AA';
        interpretationText = 'Critical Panic Value';
      }

      return {
        resourceType: 'Observation',
        id: `obs-${index + 1}-${item.testCode}`,
        status: 'final',
        code: {
          coding: [
            {
              system: 'https://rtlab.med/test-codes',
              code: item.testCode,
              display: item.testNameEn,
            },
          ],
          text: item.testNameEn,
        },
        valueQuantity: {
          value: item.numericValue !== undefined ? item.numericValue : parseFloat(item.value) || undefined,
          unit: item.unit,
          system: 'http://unitsofmeasure.org',
        },
        interpretation: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
                code: interpretationCode,
                display: interpretationText,
              },
            ],
          },
        ],
        referenceRange: [
          {
            low: item.minRef !== undefined ? { value: item.minRef, unit: item.unit } : undefined,
            high: item.maxRef !== undefined ? { value: item.maxRef, unit: item.unit } : undefined,
            text: item.referenceDisplay,
          },
        ],
      };
    }),
    conclusion: report.bloodFilm?.pathologistImpression || report.clinicalNotes || undefined,
  };

  return JSON.stringify(fhirDiagnosticReport, null, 2);
}

/**
 * Exports test results to CSV / Excel spreadsheet format.
 */
export function generateCSVReport(report: LabReport): string {
  const headers = [
    'Test Code',
    'Test Name (EN)',
    'Test Name (AR)',
    'Result Value',
    'Unit',
    'Flag',
    'Reference Range',
    'Previous Value',
    'Delta %',
  ];

  const rows = report.results.map((r) => [
    `"${r.testCode}"`,
    `"${r.testNameEn.replace(/"/g, '""')}"`,
    `"${r.testNameAr.replace(/"/g, '""')}"`,
    `"${r.value}"`,
    `"${r.unit}"`,
    `"${r.flag}"`,
    `"${r.referenceDisplay}"`,
    `"${r.previousValue || '-'}"`,
    `"${r.deltaPercent !== undefined ? (r.deltaPercent > 0 ? '+' : '') + r.deltaPercent + '%' : '-'}"`,
  ]);

  const metaRows = [
    `"Laboratory","RT-Lab Unified Clinical Laboratories"`,
    `"Report Number","${report.reportNumber}"`,
    `"Sample ID / Barcode","${report.patient.sampleId}"`,
    `"Patient Name","${report.patient.fullName} (${report.patient.fullNameEn})"`,
    `"MRN","${report.patient.mrn}"`,
    `"Age / Gender","${report.patient.age} ${report.patient.ageUnit} / ${report.patient.gender}"`,
    `"Referring Doctor","${report.patient.doctorName}"`,
    `"Date","${report.date}"`,
    `"Panel","${report.panelNameEn}"`,
    '',
  ];

  return metaRows.join('\n') + '\n' + headers.join(',') + '\n' + rows.map((r) => r.join(',')).join('\n');
}

/**
 * Downloads a text/JSON/CSV file directly in the browser
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
