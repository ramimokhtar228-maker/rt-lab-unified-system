import { ResultFlag, TestResultItem } from '../types/laboratory';

export interface DeltaCheckResult {
  deltaPercent: number;
  isSignificant: boolean;
  alertMessage?: string;
}

// Significant clinical delta thresholds (%)
const DELTA_THRESHOLDS: Record<string, number> = {
  HGB: 15,    // > 15% shift in hemoglobin is clinically critical
  WBC: 35,    // > 35% shift in white blood cells
  PLT: 35,    // > 35% shift in platelet count
  CREAT: 30,  // > 30% shift in creatinine indicates acute kidney injury
  K: 20,      // > 20% shift in potassium is urgent
  FBG: 40,    // > 40% shift in fasting glucose
  ALT: 50,
  AST: 50,
};

export function calculateDelta(
  testCode: string,
  currentValue: number,
  previousValue?: number
): DeltaCheckResult | null {
  if (previousValue === undefined || previousValue === null || previousValue === 0) {
    return null;
  }

  const diff = currentValue - previousValue;
  const deltaPercent = Number(((diff / previousValue) * 100).toFixed(1));
  const threshold = DELTA_THRESHOLDS[testCode] || 25; // default 25%

  const isSignificant = Math.abs(deltaPercent) >= threshold;

  let alertMessage: string | undefined;
  if (isSignificant) {
    const direction = deltaPercent > 0 ? 'ارتفاع حاد' : 'انخفاض حاد';
    alertMessage = `تنبيه التغير المقارن (Delta Check): ${direction} بنسبة ${Math.abs(deltaPercent)}% عن الزيارة السابقة`;
  }

  return {
    deltaPercent,
    isSignificant,
    alertMessage,
  };
}

export function evaluateFlag(
  numericVal: number,
  minRef?: number,
  maxRef?: number,
  panicLow?: number,
  panicHigh?: number
): ResultFlag {
  if (panicLow !== undefined && numericVal <= panicLow) {
    return 'CRITICAL_LOW';
  }
  if (panicHigh !== undefined && numericVal >= panicHigh) {
    return 'CRITICAL_HIGH';
  }
  if (minRef !== undefined && numericVal < minRef) {
    return 'LOW';
  }
  if (maxRef !== undefined && numericVal > maxRef) {
    return 'HIGH';
  }
  return 'NORMAL';
}
