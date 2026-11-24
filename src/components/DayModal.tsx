import React, { useState, useEffect } from 'react';
import type { DayCalculated } from '../types/finance';
import { soundFx } from '../utils/sound';

interface DayModalProps {
  isOpen: boolean;
  onClose: () => void;
  day: DayCalculated | null;
  onSave: (dayId: number, hours: number, earnings: number, livingExpense: number) => void;
  onClear: (dayId: number) => void;
}

const PRESET_EARNINGS = [250000, 300000, 390000, 420000, 500000];
const PRESET_EXPENSES = [50000, 75000, 100000, 120000, 150000];

export const DayModal: React.FC<DayModalProps> = ({
  isOpen,
  onClose,
  day,
  onSave,
  onClear
}) => {
  if (!isOpen || !day) return null;

  const [earnings, setEarnings] = useState<string>('');
  const [hours, setHours] = useState<string>('6.0');
  const [livingExpense, setLivingExpense] = useState<string>('75000');

  useEffect(() => {
    if (day) {
      setEarnings(day.actualEarnings !== null ? String(day.actualEarnings) : '');
      setHours(day.hoursWorked !== null ? String(day.hoursWorked) : '6.0');
      setLivingExpense(
        day.actualLivingExpense !== null
          ? String(day.actualLivingExpense)
          : String(day.foodCost)
      );
    }
  }, [day]);

  const parsedEarnings = parseInt(earnings.replace(/\D/g, ''), 10) || 0;
  const parsedLiving = parseInt(livingExpense.replace(/\D/g, ''), 10) || 0;
  const totalDayExpense = parsedLiving + day.bikeCost + day.rentCost + day.debtPayment;
  const dayNetSurplus = (parsedEarnings + day.otherIncome) - totalDayExpense;
  const targetKpi = day.dynamicKpiTarget || day.kpiTarget;

  const handlePresetEarnings = (val: number) => {
    setEarnings(String(val));
    soundFx.playCoinSound();
  };

  const handlePresetExpense = (val: number) => {
    setLivingExpense(String(val));
    soundFx.playCoinSound();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const h = parseFloat(hours) || 0;
    onSave(day.id, h, parsedEarnings, parsedLiving);
    onClose();
  };

  const handleClear = () => {
    onClear(day.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-2xl text-zinc-100 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">
              {day.weekdayFull}, Ngày {day.day}/{day.month}
            </h3>
            <p className="text-[11px] text-zinc-400">
              Ngày {day.id}/75 • KPI đề xuất hôm nay: <span className="text-amber-400 font-semibold">{targetKpi.toLocaleString('vi-VN')} đ</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 text-sm rounded-lg hover:bg-zinc-800"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleFormSubmit} className="mt-3.5 space-y-3.5">
          {/* Section 1: Earnings */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-zinc-200">
                1. Tiền chạy xe kiếm được (VNĐ)
              </label>
              <span className="text-[10px] text-zinc-400">
                Mục tiêu: {targetKpi / 1000}k
              </span>
            </div>
            <input
              type="text"
              autoFocus
              value={earnings ? parsedEarnings.toLocaleString('vi-VN') : ''}
              onChange={(e) => setEarnings(e.target.value.replace(/\D/g, ''))}
              placeholder="VD: 400.000"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-base sm:text-lg font-black text-emerald-400 focus:outline-none focus:border-emerald-500"
            />
            {/* Quick Earnings Presets */}
            <div className="grid grid-cols-5 gap-1 pt-0.5">
              {PRESET_EARNINGS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handlePresetEarnings(amt)}
                  className={`py-1 text-[11px] font-semibold rounded-lg border transition ${
                    parsedEarnings === amt
                      ? 'bg-emerald-500 text-zinc-950 border-emerald-400 font-bold'
                      : 'bg-zinc-800/80 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                  }`}
                >
                  {amt === 390000 ? '390k' : `${amt / 1000}k`}
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Hours */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Số giờ chạy xe thực tế
            </label>
            <input
              type="number"
              step="0.5"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500"
            />
          </div>

          {/* Section 3: Daily Living Expense (Custom Expense) */}
          <div className="space-y-1.5 pt-1 border-t border-zinc-800/60">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-zinc-200">
                2. Tiền đã dùng / chi tiêu hôm nay (VNĐ)
              </label>
              <span className="text-[10px] text-zinc-400">
                Ăn uống, xăng xe, cá nhân
              </span>
            </div>
            <input
              type="text"
              value={livingExpense ? parsedLiving.toLocaleString('vi-VN') : ''}
              onChange={(e) => setLivingExpense(e.target.value.replace(/\D/g, ''))}
              placeholder="Mặc định: 75.000"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm sm:text-base font-bold text-amber-400 focus:outline-none focus:border-amber-500"
            />
            {/* Quick Expense Presets */}
            <div className="grid grid-cols-5 gap-1 pt-0.5">
              {PRESET_EXPENSES.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handlePresetExpense(amt)}
                  className={`py-1 text-[11px] font-semibold rounded-lg border transition ${
                    parsedLiving === amt
                      ? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold'
                      : 'bg-zinc-800/80 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                  }`}
                >
                  {amt === 75000 ? '75k (chuẩn)' : `${amt / 1000}k`}
                </button>
              ))}
            </div>
          </div>

          {/* Day Financial Breakdown Box */}
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs space-y-1.5 text-zinc-300">
            <div className="flex justify-between text-zinc-400">
              <span>Tiền đã dùng sinh hoạt:</span>
              <span className="text-amber-400 font-semibold">-{parsedLiving.toLocaleString('vi-VN')} đ</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Góp xe máy ({day.bikeCost === 127000 ? '127k' : '77k'}):</span>
              <span className="text-zinc-200">-{day.bikeCost.toLocaleString('vi-VN')} đ</span>
            </div>
            {day.rentCost > 0 && (
              <div className="flex justify-between text-purple-300">
                <span>Tiền nhà:</span>
                <span>-{day.rentCost.toLocaleString('vi-VN')} đ</span>
              </div>
            )}
            {day.debtPayment > 0 && (
              <div className="flex justify-between text-rose-400 font-semibold">
                <span>Trả nợ ({day.debtLabel}):</span>
                <span>-{day.debtPayment.toLocaleString('vi-VN')} đ</span>
              </div>
            )}
            {day.otherIncome > 0 && (
              <div className="flex justify-between text-emerald-400 font-semibold">
                <span>Thu nhập thêm ({day.otherIncomeLabel}):</span>
                <span>+{day.otherIncome.toLocaleString('vi-VN')} đ</span>
              </div>
            )}

            <div className="pt-2 border-t border-zinc-800 flex justify-between items-center font-bold">
              <span>Dư / Thiếu ngày này:</span>
              <span
                className={`text-sm ${
                  dayNetSurplus >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {dayNetSurplus >= 0 ? '+' : ''}
                {dayNetSurplus.toLocaleString('vi-VN')} đ
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs sm:text-sm transition shadow-lg shadow-emerald-950/40"
            >
              Lưu Kết Quả
            </button>
            {day.actualEarnings !== null && (
              <button
                type="button"
                onClick={handleClear}
                className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 text-xs font-semibold border border-zinc-700 transition"
              >
                Xóa
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
