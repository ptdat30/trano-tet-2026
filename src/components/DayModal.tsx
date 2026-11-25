import React, { useState, useEffect } from 'react';
import type { DayCalculated, WalletBreakdown } from '../types/finance';
import { soundFx } from '../utils/sound';
import { ChevronDown, ChevronUp, Settings2, Wallet, Info } from 'lucide-react';

interface DayModalProps {
  isOpen: boolean;
  onClose: () => void;
  day: DayCalculated | null;
  currentWallets: WalletBreakdown;
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
    },
    walletUpdate?: {
      bank: number;
      app: number;
      cash: number;
    }
  ) => void;
  onClear: (dayId: number) => void;
}

const PRESET_EARNINGS = [250000, 300000, 390000, 420000, 500000];
const PRESET_EXPENSES = [0, 50000, 75000, 100000, 150000];

export const DayModal: React.FC<DayModalProps> = ({
  isOpen,
  onClose,
  day,
  currentWallets,
  hourlyRate = 65000,
  onSave,
  onClear
}) => {
  const [earnings, setEarnings] = useState<string>('');
  const [hours, setHours] = useState<string>('0');
  const [livingExpense, setLivingExpense] = useState<string>('0');

  // Planned fixed-flow notes (for KPI calculation only)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [bikeCost, setBikeCost] = useState<string>('0');
  const [rentCost, setRentCost] = useState<string>('0');
  const [debtPayment, setDebtPayment] = useState<string>('0');
  const [debtLabel, setDebtLabel] = useState<string>('');
  const [otherIncome, setOtherIncome] = useState<string>('0');
  const [otherIncomeLabel, setOtherIncomeLabel] = useState<string>('');

  // Optional direct 3-wallet update (no auto-deduction)
  const [showWalletUpdate, setShowWalletUpdate] = useState(false);
  const [editBank, setEditBank] = useState<string>('');
  const [editApp, setEditApp] = useState<string>('');
  const [editCash, setEditCash] = useState<string>('');

  useEffect(() => {
    if (isOpen && day) {
      setEarnings(day.actualEarnings !== null ? String(day.actualEarnings) : '');
      setHours(day.hoursWorked !== null ? String(day.hoursWorked) : '6.0');
      setLivingExpense(
        day.actualLivingExpense !== null ? String(day.actualLivingExpense) : '0'
      );
      setBikeCost(String(day.bikeCost));
      setRentCost(String(day.rentCost));
      setDebtPayment(String(day.debtPayment));
      setDebtLabel(day.debtLabel || '');
      setOtherIncome(String(day.otherIncome));
      setOtherIncomeLabel(day.otherIncomeLabel || '');
      setShowAdvanced(false);
      setShowWalletUpdate(false);
      setEditBank(String(currentWallets.bank || 0));
      setEditApp(String(currentWallets.app || 0));
      setEditCash(String(currentWallets.cash || 0));
    }
  }, [isOpen, day, currentWallets]);

  if (!isOpen || !day) return null;

  const parsedEarnings = parseInt(earnings.replace(/\D/g, ''), 10) || 0;
  const parsedLiving = parseInt(livingExpense.replace(/\D/g, ''), 10) || 0;
  const parsedBike = parseInt(bikeCost.replace(/\D/g, ''), 10) || 0;
  const parsedRent = parseInt(rentCost.replace(/\D/g, ''), 10) || 0;
  const parsedDebt = parseInt(debtPayment.replace(/\D/g, ''), 10) || 0;
  const parsedIncome = parseInt(otherIncome.replace(/\D/g, ''), 10) || 0;

  const parsedEditBank = parseInt(editBank.replace(/\D/g, ''), 10) || 0;
  const parsedEditApp = parseInt(editApp.replace(/\D/g, ''), 10) || 0;
  const parsedEditCash = parseInt(editCash.replace(/\D/g, ''), 10) || 0;
  const editWalletsTotal = parsedEditBank + parsedEditApp + parsedEditCash;

  const targetKpi = day.dynamicKpiTarget || day.kpiTarget;

  const handlePresetEarnings = (val: number) => {
    setEarnings(String(val));
    if (hourlyRate > 0) {
      setHours(String(Math.round((val / hourlyRate) * 10) / 10));
    }
    soundFx.playCoinSound();
  };

  const handlePresetExpense = (val: number) => {
    setLivingExpense(String(val));
    soundFx.playCoinSound();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const h = parseFloat(hours) || 0;

    // Only mark overrides if user actually changed any planned fixed-flow field for this day
    const hasOverrideChange =
      parsedBike !== day.bikeCost ||
      parsedRent !== day.rentCost ||
      parsedDebt !== day.debtPayment ||
      (debtLabel.trim() || '') !== (day.debtLabel || '') ||
      parsedIncome !== day.otherIncome ||
      (otherIncomeLabel.trim() || '') !== (day.otherIncomeLabel || '');

    const hasWalletChange =
      showWalletUpdate &&
      (parsedEditBank !== (currentWallets.bank || 0) ||
        parsedEditApp !== (currentWallets.app || 0) ||
        parsedEditCash !== (currentWallets.cash || 0));

    onSave(
      day.id,
      h,
      parsedEarnings,
      parsedLiving,
      hasOverrideChange
        ? {
            bikeCost: parsedBike,
            rentCost: parsedRent,
            debtPayment: parsedDebt,
            debtLabel: debtLabel.trim() || undefined,
            otherIncome: parsedIncome,
            otherIncomeLabel: otherIncomeLabel.trim() || undefined
          }
        : undefined,
      hasWalletChange
        ? {
            bank: parsedEditBank,
            app: parsedEditApp,
            cash: parsedEditCash
          }
        : undefined
    );
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
              Ngày {day.id}/75 • Mục tiêu KPI:{' '}
              <span className="text-amber-400 font-semibold">
                {targetKpi.toLocaleString('vi-VN')} đ
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 text-sm rounded-lg hover:bg-zinc-800"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleFormSubmit} className="mt-3.5 space-y-3.5">
          {/* Section 1: Driving Earnings Note */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-zinc-200">
                1. Ghi chú tiền chạy xe kiếm được (VNĐ)
              </label>
              <span className="text-[10px] text-zinc-400">Chỉ ghi chú ngày</span>
            </div>

            <input
              type="text"
              autoFocus
              value={earnings ? parsedEarnings.toLocaleString('vi-VN') : ''}
              onChange={(e) => setEarnings(e.target.value.replace(/\D/g, ''))}
              placeholder="VD: 400.000 (hoặc 0 nếu nghỉ)"
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
                  {amt / 1000}k
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

          {/* Section 3: Daily Living Expense Note (Optional) */}
          <div className="space-y-1.5 pt-1 border-t border-zinc-800/60">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-zinc-200">
                2. Ghi chú tiền đã tiêu hôm nay (tùy chọn)
              </label>
              <span className="text-[10px] text-zinc-400">Không tự trừ ví</span>
            </div>
            <input
              type="text"
              value={livingExpense ? parsedLiving.toLocaleString('vi-VN') : ''}
              onChange={(e) => setLivingExpense(e.target.value.replace(/\D/g, ''))}
              placeholder="0"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm sm:text-base font-bold text-amber-400 focus:outline-none focus:border-amber-500"
            />
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
                  {amt === 0 ? '0k' : `${amt / 1000}k`}
                </button>
              ))}
            </div>
          </div>

          {/* Planned Reference Note Box (Strictly Informational — Does Not Auto-Deduct Wallets) */}
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs space-y-1.5 text-zinc-300">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-sky-300 pb-1 border-b border-zinc-800/80">
              <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" strokeWidth={1.5} />
              <span>Khoản dự tính ngày này (chỉ note tính KPI — không tự trừ ví)</span>
            </div>
            <div className="flex justify-between text-zinc-400 text-[11px]">
              <span>• Dự tính góp xe:</span>
              <span className="text-zinc-200">{parsedBike.toLocaleString('vi-VN')} đ</span>
            </div>
            {parsedRent > 0 && (
              <div className="flex justify-between text-purple-300 text-[11px]">
                <span>• Dự tính tiền nhà:</span>
                <span>{parsedRent.toLocaleString('vi-VN')} đ</span>
              </div>
            )}
            {parsedDebt > 0 && (
              <div className="flex justify-between text-rose-400 text-[11px] font-semibold">
                <span>• Dự tính trả nợ ({debtLabel || day.debtLabel}):</span>
                <span>{parsedDebt.toLocaleString('vi-VN')} đ</span>
              </div>
            )}
            {parsedIncome > 0 && (
              <div className="flex justify-between text-emerald-400 text-[11px] font-semibold">
                <span>• Dự tính thu thêm ({otherIncomeLabel || day.otherIncomeLabel}):</span>
                <span>+{parsedIncome.toLocaleString('vi-VN')} đ</span>
              </div>
            )}
          </div>

          {/* Optional Direct 3-Wallet Update Accordion */}
          <div className="border border-zinc-800 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowWalletUpdate(!showWalletUpdate)}
              className="w-full px-3 py-2 bg-zinc-950/60 hover:bg-zinc-800/50 flex items-center justify-between text-xs text-zinc-300 transition"
            >
              <span className="flex items-center gap-1.5 font-medium">
                <Wallet className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.5} />
                <span>Cập nhật trực tiếp số dư 3 ví thực tế</span>
              </span>
              {showWalletUpdate ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showWalletUpdate && (
              <div className="p-3 bg-zinc-950 space-y-2 text-xs border-t border-zinc-800">
                <div className="grid grid-cols-3 gap-1.5">
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-0.5">Ngân hàng:</label>
                    <input
                      type="text"
                      value={editBank ? parsedEditBank.toLocaleString('vi-VN') : ''}
                      onChange={(e) => setEditBank(e.target.value.replace(/\D/g, ''))}
                      placeholder="0"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-sky-300 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-0.5">Ví App:</label>
                    <input
                      type="text"
                      value={editApp ? parsedEditApp.toLocaleString('vi-VN') : ''}
                      onChange={(e) => setEditApp(e.target.value.replace(/\D/g, ''))}
                      placeholder="0"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-amber-300 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-0.5">Tiền mặt:</label>
                    <input
                      type="text"
                      value={editCash ? parsedEditCash.toLocaleString('vi-VN') : ''}
                      onChange={(e) => setEditCash(e.target.value.replace(/\D/g, ''))}
                      placeholder="0"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-emerald-300 font-bold"
                    />
                  </div>
                </div>
                <div className="text-[11px] text-zinc-400 flex justify-between pt-1 border-t border-zinc-800/80">
                  <span>Tổng 3 ví sau khi lưu:</span>
                  <span className="text-emerald-400 font-bold">{editWalletsTotal.toLocaleString('vi-VN')} đ</span>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Expandable Overrides for this specific day's KPI projection */}
          <div className="border border-zinc-800 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full px-3 py-2 bg-zinc-950/60 hover:bg-zinc-800/50 flex items-center justify-between text-xs text-zinc-400 transition"
            >
              <span className="flex items-center gap-1.5 font-medium">
                <Settings2 className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.5} />
                <span>Sửa dự tính thu/chi riêng ngày này (tính KPI)</span>
              </span>
              {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showAdvanced && (
              <div className="p-3 bg-zinc-950 space-y-2.5 text-xs border-t border-zinc-800">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-zinc-400 mb-0.5 text-[11px]">Góp xe dự tính:</label>
                    <input
                      type="text"
                      value={bikeCost ? parsedBike.toLocaleString('vi-VN') : ''}
                      onChange={(e) => setBikeCost(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-0.5 text-[11px]">Tiền nhà dự tính:</label>
                    <input
                      type="text"
                      value={rentCost ? parsedRent.toLocaleString('vi-VN') : ''}
                      onChange={(e) => setRentCost(e.target.value.replace(/\D/g, ''))}
                      placeholder="0"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-purple-300"
                    />
                  </div>
                </div>

                {/* Debt Payment override */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-zinc-400 mb-0.5 text-[11px]">Note khoản nợ:</label>
                    <input
                      type="text"
                      value={debtLabel}
                      onChange={(e) => setDebtLabel(e.target.value)}
                      placeholder="VD: Kredivo..."
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-0.5 text-[11px]">Số tiền dự chi:</label>
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
                    <label className="block text-zinc-400 mb-0.5 text-[11px]">Note khoản thu thêm:</label>
                    <input
                      type="text"
                      value={otherIncomeLabel}
                      onChange={(e) => setOtherIncomeLabel(e.target.value)}
                      placeholder="VD: Mẹ cho, Thưởng..."
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-0.5 text-[11px]">Số tiền dự thu:</label>
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
              Lưu Ghi Chú
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
