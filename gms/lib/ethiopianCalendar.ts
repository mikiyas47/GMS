import { EthDateTime } from 'ethiopian-calendar-date-converter';

export interface EthiopianMonth {
  number: number;
  nameEn: string;
  nameAm: string;
  translit: string;
  maxDays: number;
}

export const ETHIOPIAN_MONTHS: EthiopianMonth[] = [
  { number: 1, nameEn: 'Meskerem', nameAm: 'መስከረም', translit: 'Mäskäräm', maxDays: 30 },
  { number: 2, nameEn: 'Tikimt', nameAm: 'ጥቅምት', translit: 'T’əqəmt', maxDays: 30 },
  { number: 3, nameEn: 'Hidar', nameAm: 'ኅዳር', translit: 'Hədar', maxDays: 30 },
  { number: 4, nameEn: 'Tahsas', nameAm: 'ታኅሣሥ', translit: 'Taḫśaś', maxDays: 30 },
  { number: 5, nameEn: 'Tir', nameAm: 'ጥር', translit: 'T’ər', maxDays: 30 },
  { number: 6, nameEn: 'Yekatit', nameAm: 'የካቲት', translit: 'Yäkatit', maxDays: 30 },
  { number: 7, nameEn: 'Megabit', nameAm: 'መጋቢት', translit: 'Mägabit', maxDays: 30 },
  { number: 8, nameEn: 'Miazia', nameAm: 'ሚያዝያ', translit: 'Miyazya', maxDays: 30 },
  { number: 9, nameEn: 'Ginbot', nameAm: 'ግንቦት', translit: 'Gənbot', maxDays: 30 },
  { number: 10, nameEn: 'Sene', nameAm: 'ሰኔ', translit: 'Säne', maxDays: 30 },
  { number: 11, nameEn: 'Hamle', nameAm: 'ሐምሌ', translit: 'Hamle', maxDays: 30 },
  { number: 12, nameEn: 'Nehase', nameAm: 'ነሐሴ', translit: 'Nähase', maxDays: 30 },
  { number: 13, nameEn: 'Pagume', nameAm: 'ጳጉሜን', translit: 'P’agume', maxDays: 6 },
];

export interface EthDateParts {
  year: number;
  month: number;
  date: number;
  hour?: number;
  minute?: number;
  second?: number;
}

/**
 * Converts a Gregorian Date or ISO string to Ethiopian date parts
 */
export function toEthiopian(dateInput: Date | string | number | null | undefined): EthDateParts | null {
  if (!dateInput) return null;
  const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return null;
  try {
    const eth = EthDateTime.fromEuropeanDate(d);
    return {
      year: eth.year,
      month: eth.month,
      date: eth.date,
      hour: eth.hour,
      minute: eth.minute,
      second: eth.second
    };
  } catch {
    return null;
  }
}

/**
 * Converts Ethiopian date parts back to Gregorian Date
 */
export function toGregorian(year: number, month: number, date: number, hour: number = 0, minute: number = 0): Date {
  const eth = new EthDateTime(year, month, date, hour, minute);
  return eth.toEuropeanDate();
}

/**
 * Returns Gregorian ISO YYYY-MM-DD from Ethiopian components
 */
export function ethiopianToIso(year: number, month: number, date: number): string {
  const g = toGregorian(year, month, date);
  return g.toISOString().split('T')[0];
}

/**
 * Gets current Ethiopian date components
 */
export function getTodayEthiopian(): EthDateParts {
  const now = EthDateTime.now();
  return {
    year: now.year,
    month: now.month,
    date: now.date,
    hour: now.hour,
    minute: now.minute,
    second: now.second
  };
}

/**
 * Calculates expiration date given Ethiopian start date and duration in months.
 */
export function calculateEthiopianEndDate(
  ethYear: number,
  ethMonth: number,
  ethDate: number,
  durationMonths: number
): { ethParts: EthDateParts; isoString: string; formatted: string } {
  let targetMonth = ethMonth + durationMonths;
  let targetYear = ethYear;
  while (targetMonth > 12) {
    targetMonth -= 12;
    targetYear += 1;
  }
  const maxDay = targetMonth === 13 ? 5 : 30;
  const targetDay = Math.min(ethDate, maxDay);

  const ethParts: EthDateParts = {
    year: targetYear,
    month: targetMonth,
    date: targetDay
  };

  const isoString = ethiopianToIso(targetYear, targetMonth, targetDay);
  const formatted = formatEthDate(isoString);

  return { ethParts, isoString, formatted };
}

/**
 * Formats a Gregorian date or ISO string into an Ethiopian Date string.
 */
export function formatEthDate(
  dateInput: Date | string | null | undefined,
  style: 'default' | 'withAmharic' | 'amharic' | 'numeric' = 'default'
): string {
  if (!dateInput) return '—';
  const eth = toEthiopian(dateInput);
  if (!eth) return String(dateInput);

  const monthObj = ETHIOPIAN_MONTHS.find(m => m.number === eth.month);
  const monthEn = monthObj?.nameEn || `Month ${eth.month}`;
  const monthAm = monthObj?.nameAm || '';

  switch (style) {
    case 'withAmharic':
      return `${monthEn} ${eth.date}, ${eth.year} E.C. (${monthAm} ${eth.date})`;
    case 'amharic':
      return `${monthAm} ${eth.date}, ${eth.year} ዓ.ም.`;
    case 'numeric':
      return `${String(eth.date).padStart(2, '0')}/${String(eth.month).padStart(2, '0')}/${eth.year} E.C.`;
    case 'default':
    default:
      return `${monthEn} ${eth.date}, ${eth.year} E.C.`;
  }
}

/**
 * Formats a date with time in Ethiopian calendar.
 */
export function formatEthDateTime(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return '—';
  const eth = toEthiopian(dateInput);
  if (!eth) return String(dateInput);

  const monthObj = ETHIOPIAN_MONTHS.find(m => m.number === eth.month);
  const monthEn = monthObj?.nameEn || `Month ${eth.month}`;
  
  const d = typeof dateInput === 'string' ? new Date(dateInput) : (dateInput instanceof Date ? dateInput : new Date());
  let timeStr = '';
  if (!isNaN(d.getTime())) {
    timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return `${monthEn} ${eth.date}, ${eth.year}${timeStr ? `, ${timeStr}` : ''} E.C.`;
}

/**
 * Formats a date range / validity period in Ethiopian Calendar.
 */
export function formatEthPeriod(startDateInput?: string | Date | null, endDateInput?: string | Date | null): string {
  if (!startDateInput && !endDateInput) return '—';
  if (!startDateInput) return `Expires ${formatEthDate(endDateInput)}`;
  if (!endDateInput) return `From ${formatEthDate(startDateInput)}`;
  
  const startEth = toEthiopian(startDateInput);
  const endEth = toEthiopian(endDateInput);
  
  if (!startEth || !endEth) {
    return `${startDateInput} to ${endDateInput}`;
  }

  const startMonth = ETHIOPIAN_MONTHS.find(m => m.number === startEth.month)?.nameEn || `M${startEth.month}`;
  const endMonth = ETHIOPIAN_MONTHS.find(m => m.number === endEth.month)?.nameEn || `M${endEth.month}`;

  if (startEth.year === endEth.year) {
    return `${startMonth} ${startEth.date} – ${endMonth} ${endEth.date}, ${startEth.year} E.C.`;
  }
  return `${startMonth} ${startEth.date}, ${startEth.year} – ${endMonth} ${endEth.date}, ${endEth.year} E.C.`;
}
