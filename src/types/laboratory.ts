export type UserRole = 'PATHOLOGIST' | 'TECHNOLOGIST' | 'PHLEBOTOMIST' | 'AUDITOR';

export type ResultFlag = 'NORMAL' | 'LOW' | 'HIGH' | 'CRITICAL_LOW' | 'CRITICAL_HIGH';

export type ReportStatus = 'ORDERED' | 'COLLECTED' | 'ANALYZED' | 'REVIEWED' | 'APPROVED';

export interface Patient {
  id: string;
  mrn: string; // Medical Record Number
  nationalId: string;
  fullName: string;
  fullNameEn: string;
  gender: 'MALE' | 'FEMALE';
  age: number;
  ageUnit: 'YEARS' | 'MONTHS' | 'DAYS';
  phone: string;
  email?: string;
  doctorName: string;
  hospitalOrClinic: string;
  sampleId: string; // Barcode number
  collectionDate: string;
  receivedDate: string;
}

export interface CatalogTestItem {
  code: string;
  nameEn: string;
  nameAr: string;
  unit: string;
  minMale?: number;
  maxMale?: number;
  minFemale?: number;
  maxFemale?: number;
  textRef?: string;
  panicLow?: number;
  panicHigh?: number;
  precision: number;
  category: 'CBC' | 'BIOCHEMISTRY' | 'COAGULATION' | 'SEROLOGY' | 'HORMONES' | 'URINALYSIS';
}

export interface TestResultItem {
  testCode: string;
  testNameEn: string;
  testNameAr: string;
  value: string; // string to accommodate formatted numbers or qualitative results
  numericValue?: number;
  unit: string;
  flag: ResultFlag;
  minRef?: number;
  maxRef?: number;
  referenceDisplay: string;
  previousValue?: string;
  previousDate?: string;
  deltaPercent?: number;
  isDeltaSignificant?: boolean;
}

export interface BloodFilmExamination {
  rbcMorphology: string;
  wbcMorphology: string;
  plateletMorphology: string;
  pathologistImpression: string;
  parasiteNotes?: string;
  examinedBy: string;
  date: string;
}

export interface CriticalCallLog {
  notifiedAt: string;
  notifiedTo: string;
  notifiedBy: string;
  departmentOrClinic: string;
  readBackConfirmed: boolean;
  notes?: string;
}

export interface LabReport {
  id: string;
  reportNumber: string;
  patientId: string;
  patient: Patient;
  panelCode: string;
  panelNameEn: string;
  panelNameAr: string;
  status: ReportStatus;
  date: string;
  results: TestResultItem[];
  bloodFilm?: BloodFilmExamination;
  clinicalNotes?: string;
  verifiedBy: string;
  verifiedTitle: string;
  analyzedBy: string;
  qrCodeUrl: string;
  criticalAlertActive: boolean;
  criticalCallLog?: CriticalCallLog;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface LabSettings {
  labNameEn: string;
  labNameAr: string;
  taglineEn: string;
  taglineAr: string;
  licenseNumber: string;
  accreditation: string;
  phone: string;
  hotline: string;
  addressEn: string;
  addressAr: string;
  email: string;
  website: string;
  directorName: string;
  directorTitle: string;
  enableHeaderInPrint: boolean;
  enableSignatureInPrint: boolean;
  enableDeltaInPrint: boolean;
  enableGaugeInPrint: boolean;
}

export interface HistoricalRecord {
  date: string;
  reportNumber: string;
  value: number;
  unit: string;
  flag: ResultFlag;
}
