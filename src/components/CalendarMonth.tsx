import React from 'react';
import { DayCell } from './DayCell';
import type { DayCalculated } from '../types/finance';

interface CalendarMonthProps {
  year: number;
  month: number;
  days: DayCalculated[];
  onDayClick: (day: DayCalculated) => void;
}

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export const CalendarMonth: React.FC<CalendarMonthProps> = ({
  year,
  month,
  days,
  onDayClick
}) => {
  const monthNames: Record<number, string> = {
    11: `Tháng 11 / ${year}`,
    12: `Tháng 12 / ${year}`,
    1: `Tháng 01 / ${year}`,
    2: `Tháng 02 / ${year} (Đón Tết)`,
  };

  // Find day of week for the first day in this month in our dataset
  const firstDay = days[0];
  // Calculate empty padding slots on the left (T2 = 0, T3 = 1, ... CN = 6)
  const weekdayToColIndex: Record<string, number> = {
    'T2': 0,
    'T3': 1,
    'T4': 2,
    'T5': 3,
    'T6': 4,
    'T7': 5,
    'CN': 6
  };

  const startCol = firstDay ? weekdayToColIndex[firstDay.weekdayName] : 0;
  const paddingSlots = Array.from({ length: startCol });

  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-3 sm:p-5">
      {/* Month Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
          {monthNames[month] || `Tháng ${month} / ${year}`}
        </h3>
        <span className="text-xs text-zinc-400">
          {days.length} ngày trong chặng
        </span>
      </div>

      {/* Weekday Columns Header */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2 text-center text-xs font-semibold text-zinc-400">
        {WEEKDAYS.map((w, idx) => (
          <div key={w} className={`py-1 ${idx >= 5 ? 'text-amber-400/80' : ''}`}>
            {w}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {/* Padding slots before start of our tracking in this month */}
        {paddingSlots.map((_, i) => (
          <div
            key={`pad-${i}`}
            className="h-24 sm:h-28 rounded-xl bg-zinc-950/20 border border-dashed border-zinc-800/40 opacity-30"
          />
        ))}

        {/* Day cells */}
        {days.map((day) => (
          <DayCell key={day.id} day={day} onClick={onDayClick} />
        ))}
      </div>
    </div>
  );
};
