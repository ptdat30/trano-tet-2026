import React, { useState, useEffect } from 'react';
import type { DayCalculated } from '../types/finance';
import { soundFx } from '../utils/sound';
import { ChevronDown, ChevronUp, Settings2, Calculator, Check } from 'lucide-react';

interface DayModalProps {
  isOpen: boolean;
  onClose: () => void;
  day: DayCalculated | null;
  currentWalletBalance?: number;
  hourlyRate?: number;
  onSave: (
    dayId: number,
    hours: number,
    earnings: number,
    livingExpense: number,
    overrides?: {
      bikeCost: number;
      rentCost: number;
      debtPayment: number;
      debtLabel?: string;
      otherIncome: number;
      otherIncomeLabel?: string;
    }
  ) => void;
  onClear: (dayId: number) => void;
}

const PRESET_EARNINGS = [250000, 300000, 390000, 420000, 500000];
const PRESET_EXPENSES = [50000, 75000, 100000, 120000, 150000];

export const DayModal: React.FC<DayModalProps> = ({
  isOpen,
  onClose,
  day,
  currentWalletBalance = 1000000,
  hourlyRate = 65000,
  onSave,
  onClear
}) => {
  if (!isOpen || !day) return null;

  const [earnings, setEarnings] = useState<string>('');
  const [hours, setHours] = useState<string>('6.0');
  const [livingExpense, setLivingExpense] = useState<string>('75000');

  // Advanced overrides for this specific day
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [bikeCost, setBikeCost] = useState<string>(String(day.bikeCost));
  const [rentCost, setRentCost] = useState<string>(String(day.rentCost));
  const [debtPayment, setDebtPayment] = useState<string>(String(day.debtPayment));
  const [debtLabel, setDebtLabel] = useState<string>(day.debtLabel || '');
  const [otherIncome, setOtherIncome] = useState<string>(String(day.otherIncome));
  const [otherIncomeLabel, setOtherIncomeLabel] = useState<string>(day.otherIncomeLabel || '');

  // Quick Wallet Calculation
  const [showWalletCalc, setShowWalletCalc] = useState(false);
  const [calcBank, setCalcBank] = useState<string>('');
  const [calcApp, setCalcApp] = useState<string>('');
  const [calcCash, setCalcCash] = useState<string>('');

  useEffect(() => {
    if (day) {
      setEarnings(day.actualEarnings !== null ? String(day.actualEarnings) : '');
      setHours(day.hoursWorked !== null ? String(day.hoursWorked) : '6.0');
      setLivingExpense(
        day.actualLivingExpense !== null
          ? String(day.actualLivingExpense)
          : String(day.foodCost)
      );
      setBikeCost(String(day.bikeCost));
      setRentCost(String(day.rentCost));
      setDebtPayment(String(day.debtPayment));
      setDebtLabel(day.debtLabel || '');
      setOtherIncome(String(day.otherIncome));
      setOtherIncomeLabel(day.otherIncomeLabel || '');
      setShowAdvanced(false);
      setShowWalletCalc(false);
      setCalcBank('');
      setCalcApp('');
      setCalcCash('');
    }
  }, [day]);

  const parsedEarnings = parseInt(earnings.replace(/\D/g, ''), 10) || 0;
  const parsedLiving = parseInt(livingExpense.replace(/\D/g, ''), 10) || 0;
  const parsedBike = parseInt(bikeCost.replace(/\D/g, ''), 10) || 0;
  const parsedRent = parseInt(rentCost.replace(/\D/g, ''), 10) || 0;
  const parsedDebt = parseInt(debtPayment.replace(/\D/g, ''), 10) || 0;
  const parsedIncome = parseInt(otherIncome.replace(/\D/g, ''), 10) || 0;

  const totalDayExpense = parsedLiving + parsedBike + parsedRent + parsedDebt;
  const dayNetSurplus = (parsedEarnings + parsedIncome) - totalDayExpense;
  const targetKpi = day.dynamicKpiTarget || day.kpiTarget;

  // Auto wallet revenue calculation
  const parsedCalcBank = parseInt(calcBank.replace(/\D/g, ''), 10) || 0;
  const parsedCalcApp = parseInt(calcApp.replace(/\D/g, ''), 10) || 0;
  const parsedCalcCash = parseInt(calcCash.replace(/\D/g, ''), 10) || 0;
  const calcTotalNew = parsedCalcBank + parsedCalcApp + parsedCalcCash;
  const calcDiff = calcTotalNew - currentWalletBalance;
  const derivedRevenue = Math.max(0, calcDiff + totalDayExpense - parsedIncome);
  const derivedHours = Math.round((derivedRevenue / hourlyRate) * 10) / 10;

  const handleApplyWalletRevenue = () => {
    setEarnings(String(derivedRevenue));
    setHours(String(derivedHours));
    setShowWalletCalc(false);
    soundFx.playCoinSound();
  };

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
    onSave(day.id, h, parsedEarnings, parsedLiving, {
      bikeCost: parsedBike,
      rentCost: parsedRent,
      debtPayment: parsedDebt,
      debtLabel: debtLabel.trim() || undefined,
      otherIncome: parsedIncome,
      otherIncomeLabel: otherIncomeLabel.trim() || undefined
    });
    onClose();
  };

  const handleClear = () => {
    onClear(day.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-2xl text-zinc-100 max-h-[90vh] overflow-y-auto my-auto">
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
                1. Tiền chạy xe kiếm được hôm nay (VNĐ)
              </label>
              <button
                type="button"
                onClick={() => setShowWalletCalc(!showWalletCalc)}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition"
              >
                <Calculator className="w-3 h-3" />
                <span>Chốt ví tính nhanh</span>
              </button>
            </div>

            {/* Quick Wallet Calculation Accordion */}
            {showWalletCalc && (
              <div className="p-3 bg-zinc-950 border border-amber-500/40 rounded-xl space-y-2 animate-in fade-in duration-150">
                <span className="text-[11px] font-bold text-amber-300 block">
                  Nhập số dư 3 ví lúc chốt ca hôm nay:
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <div>
                    <label className="text-[9px] text-zinc-400 block mb-0.5">Ngân hàng:</label>
                    <input
                      type="text"
                      placeholder="0"
                      value={calcBank ? parsedCalcBank.toLocaleString('vi-VN') : ''}
                      onChange={(e) => setCalcBank(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-sky-300 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-zinc-400 block mb-0.5">Ví App:</label>
                    <input
                      type="text"
                      placeholder="0"
                      value={calcApp ? parsedCalcApp.toLocaleString('vi-VN') : ''}
                      onChange={(e) => setCalcApp(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-amber-300 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-zinc-400 block mb-0.5">Tiền mặt:</label>
                    <input
                      type="text"
                      placeholder="0"
                      value={calcCash ? parsedCalcCash.toLocaleString('vi-VN') : ''}
                      onChange={(e) => setCalcCash(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-emerald-300 font-bold"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
                  <div className="text-[10px] text-zinc-300">
                    Suy ra doanh thu: <b className="text-amber-400">+{derivedRevenue.toLocaleString('vi-VN')} đ</b> (~{derivedHours}h)
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyWalletRevenue}
                    className="px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1 shadow"
                  >
                    <Check className="w-3 h-3" />
                    <span>Áp dụng</span>
                  </button>
                </div>
              </div>
            )}

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
              <span>Góp xe máy:</span>
              <span className="text-zinc-200">-{parsedBike.toLocaleString('vi-VN')} đ</span>
            </div>
            {parsedRent > 0 && (
              <div className="flex justify-between text-purple-300">
                <span>Tiền nhà:</span>
                <span>-{parsedRent.toLocaleString('vi-VN')} đ</span>
              </div>
            )}
            {parsedDebt > 0 && (
              <div className="flex justify-between text-rose-400 font-semibold">
                <span>Trả nợ ({debtLabel || day.debtLabel}):</span>
                <span>-{parsedDebt.toLocaleString('vi-VN')} đ</span>
              </div>
            )}
            {parsedIncome > 0 && (
              <div className="flex justify-between text-emerald-400 font-semibold">
                <span>Thu nhập thêm ({otherIncomeLabel || day.otherIncomeLabel}):</span>
                <span>+{parsedIncome.toLocaleString('vi-VN')} đ</span>
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

          {/* Section 4: Expandable Overrides for this specific day */}
          <div className="border border-zinc-800 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full px-3 py-2 bg-zinc-950/60 hover:bg-zinc-800/50 flex items-center justify-between text-xs text-zinc-400 transition"
            >
              <span className="flex items-center gap-1.5 font-medium">
                <Settings2 className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.5} />
                <span>Tùy chỉnh thu & chi cố định riêng ngày này</span>
              </span>
              {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showAdvanced && (
              <div className="p-3 bg-zinc-950 space-y-2.5 text-xs border-t border-zinc-800">
                {/* Bike Cost override */}
                <div>
                  <label className="block text-zinc-400 mb-0.5 text-[11px]">Tiền góp xe ngày này:</label>
                  <input
                    type="text"
                    value={bikeCost ? parsedBike.toLocaleString('vi-VN') : ''}
                    onChange={(e) => setBikeCost(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200"
                  />
                </div>

                {/* Debt Payment override */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-zinc-400 mb-0.5 text-[11px]">Tên khoản nợ (nếu có):</label>
                    <input
                      type="text"
                      value={debtLabel}
                      onChange={(e) => setDebtLabel(e.target.value)}
                      placeholder="VD: Kredivo..."
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-0.5 text-[11px]">Số tiền trả nợ:</label>
                    <input
                      type="text"
                      value={debtPayment ? parsedDebt.toLocaleString('vi-VN') : ''}
                      onChange={(e) => setDebtPayment(e.target.value.replace(/\D/g, ''))}
                      placeholder="0"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-rose-400 font-bold"
                    />
                  </div>
                </div>

                {/* Other income override */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-zinc-400 mb-0.5 text-[11px]">Khoản thu thêm (nếu có):</label>
                    <input
                      type="text"
                      value={otherIncomeLabel}
                      onChange={(e) => setOtherIncomeLabel(e.target.value)}
                      placeholder="VD: Mẹ cho, Thưởng..."
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-0.5 text-[11px]">Số tiền thu:</label>
                    <input
                      type="text"
                      value={otherIncome ? parsedIncome.toLocaleString('vi-VN') : ''}
                      onChange={(e) => setOtherIncome(e.target.value.replace(/\D/g, ''))}
                      placeholder="0"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-emerald-400 font-bold"
                    />
                  </div>
                </div>
              </div>
            )}
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
