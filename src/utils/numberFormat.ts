/**
 * Utilities for formatting numbers and currencies strictly with English digits (0-9)
 * and tabular grouping, avoiding Eastern Arabic numerals (٠-٩) in financial and medical records.
 */

export function toEnglishDigits(str: string | number | null | undefined): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/[٠۰]/g, '0')
    .replace(/[١۱]/g, '1')
    .replace(/[٢۲]/g, '2')
    .replace(/[٣۳]/g, '3')
    .replace(/[٤۴]/g, '4')
    .replace(/[٥۵]/g, '5')
    .replace(/[٦۶]/g, '6')
    .replace(/[٧۷]/g, '7')
    .replace(/[٨۸]/g, '8')
    .replace(/[٩۹]/g, '9');
}

export function formatEnglishNumber(val: number | string | null | undefined, decimals = 0): string {
  if (val === null || val === undefined || val === '') return '0';
  const cleanStr = toEnglishDigits(String(val)).replace(/[^0-9.-]+/g, '');
  const num = parseFloat(cleanStr);
  if (isNaN(num)) return '0';

  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: true
  });
}

export function formatCurrency(val: number | string | null | undefined, decimals = 0): string {
  return `${formatEnglishNumber(val, decimals)} ج.م`;
}
