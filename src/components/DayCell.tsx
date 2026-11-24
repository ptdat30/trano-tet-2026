import React from 'react';
import type { DayCalculated } from '../types/finance';

interface DayCellProps {
  day: DayCalculated;
  onClick: (day: DayCalculated) => void;
}

export const DayCell: React.FC<DayCellProps> = ({ day, onClick }) => {
  const isEntered = day.actualEarnings !== null;
  const isTargetAchieved = day.isKpiAchieved;
  const isWeekend = day.weekdayName === 'T7' || day.weekdayName === 'CN';

  return (
    <button
      onClick={() => onClick(day)}
      className={`group relative flex flex-col justify-between p-1.5 sm:p-2.5 min-h-[5.75rem] sm:min-h-[6.5rem] rounded-xl border text-left transition-all ${
        isEntered
          ? isTargetAchieved
            ? 'bg-emerald-950/40 border-emerald-500/50 hover:border-emerald-400'
            : 'bg-amber-950/30 border-amber-500/40 hover:border-amber-400'
          : 'bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-800/60'
      }`}
    >
      {/* Header of cell: Day number and fixed expense */}
      <div className="flex items-center justify-between w-full">
        <span
          className={`text-xs sm:text-sm font-bold ${
            isWeekend ? 'text-amber-400' : 'text-zinc-200'
          }`}
        >
          {day.day}
        </span>

        {/* Small Fixed Outflow tag */}
        <span className="text-[9px] sm:text-[10px] text-zinc-400">
          -{Math.round(day.totalExpense / 1000)}k
        </span>
      </div>

      {/* Middle/Events Tags */}
      <div className="my-auto w-full space-y-1">
        {day.otherIncomeLabel && (
          <div className="text-[9px] sm:text-[10px] leading-tight px-1 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-semibold truncate border border-emerald-500/30">
            {day.otherIncomeLabel}
          </div>
        )}
        {day.debtLabel && (
          <div className="text-[9px] sm:text-[10px] leading-tight px-1 py-0.5 rounded bg-rose-500/15 text-rose-300 font-semibold truncate border border-rose-500/30">
            {day.debtLabel}
          </div>
        )}
      </div>

      {/* Footer: User Input Result or Prompt */}
      <div className="w-full pt-1 border-t border-zinc-800/70 flex items-center justify-between text-[10px] sm:text-xs">
        {isEntered ? (
          <>
            <span
              className={`font-black tracking-tight ${
                isTargetAchieved ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              +{(day.actualEarnings || 0) / 1000}k
            </span>
            <span className="text-[9px] sm:text-[10px] text-zinc-400">{day.hoursWorked || 0}h</span>
          </>
        ) : (
          <span className="text-[9px] sm:text-[10px] text-zinc-400 group-hover:text-amber-300 font-medium">
            KPI {Math.round(day.dynamicKpiTarget / 1000)}k
          </span>
        )}
      </div>
    </button>
  );
};
