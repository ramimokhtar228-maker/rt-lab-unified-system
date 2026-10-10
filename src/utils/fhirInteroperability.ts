/**
 * International Electronic Health Records (EHR) Interoperability Engine
 * Supports HL7 FHIR R4 JSON Bundles (DiagnosticReport, Patient, Observations with LOINC)
 * and HL7 v2.5 ORU^R01 standard laboratory message protocols.
 */

import { LabReport, TestParameter } from '../types/lab';

// Common LOINC code mappings for standard clinical laboratory tests
export const LOINC_MAPPINGS: Record<string, { code: string; display: string }> = {
  'hemoglobin': { code: '718-7', display: 'Hemoglobin [Mass/volume] in Blood' },
  'rbc': { code: '789-8', display: 'Erythrocytes [#/volume] in Blood' },
  'wbc': { code: '6690-2', display: 'Leukocytes [#/volume] in Blood' },
  'platelets': { code: '777-3', display: 'Platelets [#/volume] in Blood' },
  'platelet': { code: '777-3', display: 'Platelets [#/volume] in Blood' },
  'mcv': { code: '787-2', display: 'MCV [Entitic volume] in Blood' },
  'mch': { code: '785-6', display: 'MCH [Entitic mass] in Blood' },
  'mchc': { code: '28540-3', display: 'MCHC [Mass/volume] in Blood' },
  'rdw': { code: '21000-5', display: 'Erythrocyte distribution width' },
  'fasting blood sugar': { code: '1558-6', display: 'Fasting glucose [Mass/volume] in Serum or Plasma' },
  'fbs': { code: '1558-6', display: 'Fasting glucose [Mass/volume] in Serum or Plasma' },
  'random blood sugar': { code: '2339-0', display: 'Glucose [Mass/volume] in Blood' },
  'hba1c': { code: '4548-4', display: 'Hemoglobin A1c/Hemoglobin.total in Blood' },
  'creatinine': { code: '2160-0', display: 'Creatinine [Mass/volume] in Serum or Plasma' },
  'blood urea': { code: '3094-0', display: 'Urea nitrogen [Mass/volume] in Serum or Plasma' },
  'uric acid': { code: '3084-1', display: 'Urate [Mass/volume] in Serum or Plasma' },
  'alt': { code: '1742-6', display: 'Alanine aminotransferase [Enzymatic activity/volume] in Serum or Plasma' },
  'ast': { code: '1920-8', display: 'Aspartate aminotransferase [Enzymatic activity/volume] in Serum or Plasma' },
  'bilirubin total': { code: '1975-2', display: 'Bilirubin.total [Mass/volume] in Serum or Plasma' },
  'total cholesterol': { code: '2093-3', display: 'Cholesterol [Mass/volume] in Serum or Plasma' },
  'triglycerides': { code: '2571-8', display: 'Triglyceride [Mass/volume] in Serum or Plasma' },
  'hdl': { code: '2085-9', display: 'Cholesterol in HDL [Mass/volume] in Serum or Plasma' },
  'ldl': { code: '13457-7', display: 'Cholesterol in LDL [Mass/volume] in Serum or Plasma' },
  'tsh': { code: '3016-3', display: 'Thyrotropin [Units/volume] in Serum or Plasma' },
  'potassium': { code: '2823-3', display: 'Potassium [Moles/volume] in Serum or Plasma' },
  'sodium': { code: '2951-2', display: 'Sodium [Moles/volume] in Serum or Plasma' }
};

export function getLoincForParameter(name: string): { code: string; display: string } {
  const lower = name.toLowerCase().trim();
  for (const [key, mapping] of Object.entries(LOINC_MAPPINGS)) {
    if (lower.includes(key)) {
      return mapping;
    }
  }
  return { code: 'UNK-LAB', display: name };
}

/**
 * Generates an official HL7 FHIR R4 JSON Bundle (DiagnosticReport document).
 */
export function generateFhirR4Bundle(report: LabReport, labName = 'RT Clinical Laboratories'): any {
  const p = report.patient;
  const bundleId = `rt-fhir-bundle-${report.id}`;
  const timestamp = new Date().toISOString();

  const patientResourceId = `Patient-${p.nationalId || p.labNumber || 'PAT001'}`;
  const reportResourceId = `DiagnosticReport-${report.id}`;

  const observationResources: any[] = [];
  const observationReferences: any[] = [];

  report.profiles.forEach(prof => {
    (prof.parameters || []).forEach(param => {
      const loinc = getLoincForParameter(param.name);
      const obsId = `Obs-${param.id}`;
      const numVal = parseFloat(String(param.result).replace(/[^0-9.-]/g, ''));

      const obsResource: any = {
        resourceType: 'Observation',
        id: obsId,
        status: 'final',
        category: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                code: 'laboratory',
                display: 'Laboratory'
              }
            ]
          }
        ],
        code: {
          coding: [
            {
              system: 'http://loinc.org',
              code: loinc.code,
              display: loinc.display
            }
          ],
          text: param.name
        },
        subject: {
          reference: `urn:uuid:${patientResourceId}`,
          display: p.fullName
        },
        effectiveDateTime: p.sampleDate || timestamp,
        interpretation: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
                code: param.flag === 'HIGH' ? 'H' : param.flag === 'LOW' ? 'L' : param.flag === 'PANIC' ? 'HH' : 'N',
                display: param.flag || 'Normal'
              }
            ]
          }
        ]
      };

      if (!isNaN(numVal)) {
        obsResource.valueQuantity = {
          value: numVal,
          unit: param.unit || '',
          system: 'http://unitsofmeasure.org'
        };
      } else {
        obsResource.valueString = String(param.result);
      }

      if (param.minNormal !== undefined || param.maxNormal !== undefined) {
        obsResource.referenceRange = [
          {
            low: param.minNormal !== undefined ? { value: param.minNormal, unit: param.unit } : undefined,
            high: param.maxNormal !== undefined ? { value: param.maxNormal, unit: param.unit } : undefined,
            text: param.textReference || `${param.minNormal || ''} - ${param.maxNormal || ''}`
          }
        ];
      }

      observationResources.push({
        fullUrl: `urn:uuid:${obsId}`,
        resource: obsResource
      });

      observationReferences.push({
        reference: `urn:uuid:${obsId}`,
        display: `${param.name}: ${param.result} ${param.unit || ''}`
      });
    });
  });

  const patientResource = {
    resourceType: 'Patient',
    id: patientResourceId,
    identifier: [
      {
        system: 'urn:oid:2.16.840.1.113883.4.1',
        value: p.nationalId || p.labNumber
      }
    ],
    active: true,
    name: [
      {
        use: 'official',
        text: p.fullName
      }
    ],
    telecom: [
      {
        system: 'phone',
        value: p.phone,
        use: 'mobile'
      }
    ],
    gender: p.gender === 'female' ? 'female' : 'male',
    birthDate: p.age ? `${new Date().getFullYear() - p.age}-01-01` : undefined
  };

  const diagnosticReportResource = {
    resourceType: 'DiagnosticReport',
    id: reportResourceId,
    identifier: [
      {
        system: 'https://rtlab.org/reports',
        value: report.reportNumber
      }
    ],
    status: report.status === 'completed' ? 'final' : 'partial',
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v2-0074',
            code: 'LAB',
            display: 'Laboratory'
          }
        ]
      }
    ],
    code: {
      text: 'Routine & Specialized Clinical Laboratory Panel'
    },
    subject: {
      reference: `urn:uuid:${patientResourceId}`,
      display: p.fullName
    },
    issued: timestamp,
    performer: [
      {
        display: labName
      }
    ],
    result: observationReferences,
    conclusion: report.generalComment || 'Laboratory diagnostic evaluation conducted according to ISO 15189 specifications.'
  };

  return {
    resourceType: 'Bundle',
    id: bundleId,
    type: 'document',
    timestamp: timestamp,
    entry: [
      {
        fullUrl: `urn:uuid:${patientResourceId}`,
        resource: patientResource
      },
      {
        fullUrl: `urn:uuid:${reportResourceId}`,
        resource: diagnosticReportResource
      },
      ...observationResources
    ]
  };
}

/**
 * Generates standard HL7 v2.5 ORU^R01 formatted lab message text.
 */
export function generateHl7v2Message(report: LabReport, labName = 'RTLAB'): string {
  const p = report.patient;
  const now = new Date();
  const timeStr = now.toISOString().replace(/[-:T.]/g, '').slice(0, 14);

  const msh = `MSH|^~\\&|${labName}|LABORATORY|HIS_CLIENT|HOSPITAL|${timeStr}||ORU^R01|MSG${Date.now()}|P|2.5`;
  const pid = `PID|1||${p.nationalId || p.labNumber}^^^MRN||${p.fullName.replace(/\s+/g, '^')}||${now.getFullYear() - (p.age || 30)}0101|${p.gender === 'female' ? 'F' : 'M'}|||^^^^||${p.phone}`;
  const obr = `OBR|1|${report.reportNumber}|${report.id}|LAB^Laboratory Panel|||${timeStr}|||||||||${p.referringDoctorName || 'CONSULTANT'}`;

  const obxLines: string[] = [];
  let obxIndex = 1;

  report.profiles.forEach(prof => {
    (prof.parameters || []).forEach(param => {
      const loinc = getLoincForParameter(param.name);
      const flag = param.flag === 'HIGH' ? 'H' : param.flag === 'LOW' ? 'L' : param.flag === 'PANIC' ? 'HH' : 'N';
      const ref = param.textReference || `${param.minNormal || ''}-${param.maxNormal || ''}`;
      obxLines.push(
        `OBX|${obxIndex}|NM|${loinc.code}^${param.name}^LN||${param.result}|${param.unit || ''}|${ref}|${flag}|||F|||${timeStr}`
      );
      obxIndex++;
    });
  });

  return [msh, pid, obr, ...obxLines].join('\r\n');
}
