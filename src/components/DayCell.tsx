import React from 'react';
import type { DayCalculated } from '../types/finance';

interface DayCellProps {
  day: DayCalculated;
  onClick: (day: DayCalculated) => void;
}

export const DayCell: React.FC<DayCellProps> = ({ day, onClick }) => {
  const isEntered = day.actualEarnings !== null;
  const netVal = day.actualEarnings ?? 0;
  const isTargetAchieved = day.isKpiAchieved;
  const isNegative = isEntered && netVal < 0;
  const isWeekend = day.weekdayName === 'T7' || day.weekdayName === 'CN';

  const formatShortK = (val: number): string => {
    const absK = Math.round(Math.abs(val) / 1000);
    if (val > 0) return `+${absK.toLocaleString('vi-VN')}k`;
    if (val < 0) return `-${absK.toLocaleString('vi-VN')}k`;
    return '0k';
  };

  return (
    <button
      onClick={() => onClick(day)}
      className={`group relative flex flex-col justify-between p-2 sm:p-2.5 min-h-[5.25rem] sm:min-h-[6rem] rounded-xl border text-left transition-all ${
        isEntered
          ? isNegative
            ? 'bg-rose-950/35 border-rose-500/45 hover:border-rose-400'
            : isTargetAchieved
            ? 'bg-emerald-950/40 border-emerald-500/50 hover:border-emerald-400'
            : 'bg-amber-950/30 border-amber-500/40 hover:border-amber-400'
          : 'bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-800/60'
      }`}
    >
      {/* Header: Day number */}
      <div className="flex items-center justify-between w-full">
        <span
          className={`text-xs sm:text-sm font-bold ${
            isWeekend ? 'text-amber-400' : 'text-zinc-200'
          }`}
        >
          {day.day}
        </span>
        {isEntered && (
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isNegative
                ? 'bg-rose-400'
                : isTargetAchieved
                ? 'bg-emerald-400'
                : 'bg-amber-400'
            }`}
          />
        )}
      </div>

      {/* Footer: Net Change (Thực thu) or Remaining Daily Target */}
      <div className="w-full pt-1.5 border-t border-zinc-800/70 flex items-center justify-between text-[10px] sm:text-xs">
        {isEntered ? (
          <>
            <span
              className={`font-black tracking-tight ${
                isNegative
                  ? 'text-rose-400'
                  : isTargetAchieved
                  ? 'text-emerald-400'
                  : 'text-amber-400'
              }`}
            >
              {formatShortK(netVal)}
            </span>
            {day.hoursWorked !== null && day.hoursWorked > 0 && (
              <span className="text-[9px] sm:text-[10px] text-zinc-400">{day.hoursWorked}h</span>
            )}
          </>
        ) : (
          <span className="text-[9px] sm:text-[10px] text-zinc-400 group-hover:text-emerald-300 font-medium">
            Cần {Math.round(day.dynamicKpiTarget / 1000).toLocaleString('vi-VN')}k
          </span>
        )}
      </div>
    </button>
  );
};
