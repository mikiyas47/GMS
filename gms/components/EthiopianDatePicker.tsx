'use client';

import React from 'react';
import { 
  ETHIOPIAN_MONTHS, 
  ethiopianToIso, 
  calculateEthiopianEndDate, 
  formatEthDate 
} from '@/lib/ethiopianCalendar';
import { Calendar, Clock, CheckCircle } from 'lucide-react';

interface EthiopianDatePickerProps {
  label?: string;
  year: number;
  month: number;
  day: number;
  onChange: (year: number, month: number, day: number, isoString: string) => void;
  durationMonths?: number;
  disabled?: boolean;
  showExpiryPreview?: boolean;
}

export const EthiopianDatePicker: React.FC<EthiopianDatePickerProps> = ({
  label = 'Start Date (Ethiopian Calendar)',
  year,
  month,
  day,
  onChange,
  durationMonths,
  disabled = false,
  showExpiryPreview = true
}) => {
  const currentMonthObj = ETHIOPIAN_MONTHS.find(m => m.number === month) || ETHIOPIAN_MONTHS[0];
  const maxDays = currentMonthObj.maxDays;

  const handleYearChange = (newYear: number) => {
    const validDay = Math.min(day, maxDays);
    const iso = ethiopianToIso(newYear, month, validDay);
    onChange(newYear, month, validDay, iso);
  };

  const handleMonthChange = (newMonth: number) => {
    const monthObj = ETHIOPIAN_MONTHS.find(m => m.number === newMonth) || ETHIOPIAN_MONTHS[0];
    const validDay = Math.min(day, monthObj.maxDays);
    const iso = ethiopianToIso(year, newMonth, validDay);
    onChange(year, newMonth, validDay, iso);
  };

  const handleDayChange = (newDay: number) => {
    const iso = ethiopianToIso(year, month, newDay);
    onChange(year, month, newDay, iso);
  };

  // Expiration calculation if duration is provided
  const expiry = durationMonths ? calculateEthiopianEndDate(year, month, day, durationMonths) : null;

  // Available Ethiopian years (from 2015 to 2030 E.C.)
  const years = Array.from({ length: 16 }, (_, i) => 2015 + i);

  return (
    <div className="space-y-2.5">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#E8452C]" />
            <span>{label}</span>
          </label>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Ethiopian Calendar (የኢትዮጵያ ዘመን አቆጣጠር)
          </span>
        </div>
      )}

      {/* 3-Column Ethiopian Date Selector */}
      <div className="grid grid-cols-3 gap-2">
        {/* Month Selector */}
        <div>
          <span className="text-[10px] text-gray-500 font-semibold block mb-0.5">Month (ወር)</span>
          <select
            value={month}
            disabled={disabled}
            onChange={(e) => handleMonthChange(Number(e.target.value))}
            className="w-full min-h-[42px] px-2.5 rounded-xl border border-gray-300 bg-white text-xs font-bold text-gray-800 focus:outline-none focus:border-[#E8452C]"
          >
            {ETHIOPIAN_MONTHS.map((m) => (
              <option key={m.number} value={m.number}>
                {m.number}. {m.nameEn} ({m.nameAm})
              </option>
            ))}
          </select>
        </div>

        {/* Day Selector */}
        <div>
          <span className="text-[10px] text-gray-500 font-semibold block mb-0.5">Day (ቀን)</span>
          <select
            value={day}
            disabled={disabled}
            onChange={(e) => handleDayChange(Number(e.target.value))}
            className="w-full min-h-[42px] px-2.5 rounded-xl border border-gray-300 bg-white text-xs font-bold text-gray-800 focus:outline-none focus:border-[#E8452C]"
          >
            {Array.from({ length: maxDays }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Year Selector */}
        <div>
          <span className="text-[10px] text-gray-500 font-semibold block mb-0.5">Year (ዓመት)</span>
          <select
            value={year}
            disabled={disabled}
            onChange={(e) => handleYearChange(Number(e.target.value))}
            className="w-full min-h-[42px] px-2.5 rounded-xl border border-gray-300 bg-white text-xs font-bold text-gray-800 focus:outline-none focus:border-[#E8452C]"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y} E.C. (ዓ.ም.)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Start Date & Expiration Date Live Visual Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        {/* Valid From Card */}
        <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
              Valid From (መጀመሪያ ቀን)
            </span>
            <div className="text-xs font-extrabold text-gray-900 mt-0.5">
              {currentMonthObj.nameEn} {day}, {year} E.C.
            </div>
            <span className="text-[10px] text-gray-500 font-medium">
              {currentMonthObj.nameAm} {day}, {year} ዓ.ም.
            </span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 shrink-0">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          </div>
        </div>

        {/* Expiration Date Card (If duration is present) */}
        {showExpiryPreview && expiry && (
          <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                Expiration Date (የሚያበቃበት ቀን)
              </span>
              <div className="text-xs font-extrabold text-amber-900 mt-0.5">
                {ETHIOPIAN_MONTHS.find(m => m.number === expiry.ethParts.month)?.nameEn} {expiry.ethParts.date}, {expiry.ethParts.year} E.C.
              </div>
              <span className="text-[10px] text-amber-700 font-medium">
                {ETHIOPIAN_MONTHS.find(m => m.number === expiry.ethParts.month)?.nameAm} {expiry.ethParts.date}, {expiry.ethParts.year} ዓ.ም. ({durationMonths} {durationMonths === 1 ? 'Month' : 'Months'})
              </span>
            </div>
            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
