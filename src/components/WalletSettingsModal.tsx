import React, { useState, useEffect } from 'react';
import type { FinanceSettings, DayCalculated } from '../types/finance';
import { Wallet, Smartphone, Banknote, RotateCcw, Building2, Calculator, CheckSquare, Square } from 'lucide-react';
import { DEFAULT_SETTINGS } from '../data/calendarData';

interface WalletSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: FinanceSettings;
  days: DayCalculated[];
  currentWalletBalance: number;
  onSave: (
    newSettings: FinanceSettings,
    autoRecord?: {
      dayId: number;
      revenue: number;
      hours: number;
    }
  ) => void;
}

export const WalletSettingsModal: React.FC<WalletSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  days,
  currentWalletBalance,
  onSave
}) => {
  if (!isOpen) return null;

  const [bank, setBank] = useState<string>(String(settings.wallets?.bank ?? 1000000));
  const [app, setApp] = useState<string>(String(settings.wallets?.app ?? 0));
  const [cash, setCash] = useState<string>(String(settings.wallets?.cash ?? 0));
  const [targetCash, setTargetCash] = useState<string>(String(settings.targetCash ?? 15000000));
  const [hourlyRate, setHourlyRate] = useState<string>(String(settings.hourlyRate ?? 65000));

  // Auto revenue recording state
  // Default selected day: first unentered day, or day 1
  const firstUnenteredDay = days.find((d) => d.actualEarnings === null) || days[0];
  const [selectedDayId, setSelectedDayId] = useState<number>(firstUnenteredDay ? firstUnenteredDay.id : 1);
  const [shouldAutoRecord, setShouldAutoRecord] = useState<boolean>(true);

  useEffect(() => {
    setBank(String(settings.wallets?.bank ?? 1000000));
    setApp(String(settings.wallets?.app ?? 0));
    setCash(String(settings.wallets?.cash ?? 0));
    setTargetCash(String(settings.targetCash ?? 15000000));
    setHourlyRate(String(settings.hourlyRate ?? 65000));

    const unentered = days.find((d) => d.actualEarnings === null);
    if (unentered) {
      setSelectedDayId(unentered.id);
    }
  }, [settings, days]);

  const parsedBank = parseInt(bank.replace(/\D/g, ''), 10) || 0;
  const parsedApp = parseInt(app.replace(/\D/g, ''), 10) || 0;
  const parsedCash = parseInt(cash.replace(/\D/g, ''), 10) || 0;
  const totalCurrent = parsedBank + parsedApp + parsedCash;

  const parsedTarget = parseInt(targetCash.replace(/\D/g, ''), 10) || 0;
  const parsedRate = parseInt(hourlyRate.replace(/\D/g, ''), 10) || 65000;

  // Auto-calculated daily revenue
  const balanceDiff = totalCurrent - currentWalletBalance;
  const targetDay = days.find((d) => d.id === selectedDayId) || days[0];

  const dayLiving = targetDay ? (targetDay.actualLivingExpense !== null ? targetDay.actualLivingExpense : targetDay.foodCost) : 75000;
  const dayFixedOutflow = targetDay ? (targetDay.bikeCost + targetDay.rentCost + targetDay.debtPayment) : 127000;
  const totalDayExpenses = dayLiving + dayFixedOutflow;
  const dayOtherIncome = targetDay ? targetDay.otherIncome : 0;

  // Revenue = (Wallet_new - Wallet_prev) + Total_Day_Expense - Day_Other_Income
  const rawAutoRevenue = balanceDiff + totalDayExpenses - dayOtherIncome;
  const autoRevenue = Math.max(0, rawAutoRevenue);
  const autoHours = Math.round((autoRevenue / parsedRate) * 10) / 10;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(
      {
        ...settings,
        wallets: {
          bank: parsedBank,
          app: parsedApp,
          cash: parsedCash
        },
        targetCash: parsedTarget,
        hourlyRate: parsedRate
      },
      shouldAutoRecord && targetDay
        ? {
            dayId: targetDay.id,
            revenue: autoRevenue,
            hours: autoHours
          }
        : undefined
    );
    onClose();
  };

  const handleResetDefaults = () => {
    setBank(String(DEFAULT_SETTINGS.wallets.bank));
    setApp(String(DEFAULT_SETTINGS.wallets.app));
    setCash(String(DEFAULT_SETTINGS.wallets.cash));
    setTargetCash(String(DEFAULT_SETTINGS.targetCash));
    setHourlyRate(String(DEFAULT_SETTINGS.hourlyRate));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl text-zinc-100 max-h-[92vh] overflow-y-auto my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Wallet className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                Cập Nhật Số Dư Ví & Tự Động Tính Doanh Thu
              </h3>
              <p className="text-[11px] text-zinc-400">
                Nhập số dư hiện tại để hệ thống tự động suy ra tiền chạy xe hôm nay
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 text-sm rounded-lg hover:bg-zinc-800"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
          {/* Section 1: 3 Wallets */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              1. Nhập Số Dư 3 Ví Hiện Tại Lúc Này
            </span>

            {/* Wallet 1: Bank Account */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-sky-400" strokeWidth={1.5} />
                  <span>Ví tài khoản ngân hàng</span>
                </label>
                <span className="text-[10px] text-zinc-400">ATM / Mobile Banking</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={bank ? parsedBank.toLocaleString('vi-VN') : ''}
                  onChange={(e) => setBank(e.target.value.replace(/\D/g, ''))}
                  placeholder="0"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm font-bold text-sky-300 focus:outline-none focus:border-sky-500"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-zinc-400">VNĐ</span>
              </div>
            </div>

            {/* Wallet 2: Driver App */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.5} />
                  <span>Ví App tài xế (Be / Grab / Shopee)</span>
                </label>
                <span className="text-[10px] text-zinc-400">Tiền còn trong ví tài xế</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={app ? parsedApp.toLocaleString('vi-VN') : ''}
                  onChange={(e) => setApp(e.target.value.replace(/\D/g, ''))}
                  placeholder="0"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm font-bold text-amber-300 focus:outline-none focus:border-amber-500"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-zinc-400">VNĐ</span>
              </div>
            </div>

            {/* Wallet 3: Cash */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Banknote className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.5} />
                  <span>Ví tiền mặt</span>
                </label>
                <span className="text-[10px] text-zinc-400">Tiền mặt trong túi / ví</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={cash ? parsedCash.toLocaleString('vi-VN') : ''}
                  onChange={(e) => setCash(e.target.value.replace(/\D/g, ''))}
                  placeholder="0"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm font-bold text-emerald-300 focus:outline-none focus:border-emerald-500"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-zinc-400">VNĐ</span>
              </div>
            </div>

            {/* Live Total & Comparison Box */}
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-zinc-300 block">
                  Tổng 3 ví mới: <span className="text-emerald-400 font-black">{totalCurrent.toLocaleString('vi-VN')} đ</span>
                </span>
                <span className="text-[10px] text-zinc-400">
                  Số dư trước khi cập nhật: {currentWalletBalance.toLocaleString('vi-VN')} đ
                </span>
              </div>
              <div className="text-right">
                <span
                  className={`text-xs font-bold ${
                    balanceDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {balanceDiff >= 0 ? `+${balanceDiff.toLocaleString('vi-VN')}` : balanceDiff.toLocaleString('vi-VN')} đ
                </span>
                <span className="text-[10px] text-zinc-400 block">chênh lệch</span>
              </div>
            </div>
          </div>

          {/* Section 2: Auto Revenue Calculation */}
          <div className="space-y-3 pt-3 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>2. Tự Động Suy Ra Doanh Thu Ngày</span>
              </span>

              {/* Day Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-zinc-400">Áp dụng cho:</span>
                <select
                  value={selectedDayId}
                  onChange={(e) => setSelectedDayId(parseInt(e.target.value, 10))}
                  className="bg-zinc-950 border border-zinc-700 text-xs text-amber-300 font-semibold rounded-lg px-2 py-1 focus:outline-none focus:border-amber-500"
                >
                  {days.map((d) => (
                    <option key={d.id} value={d.id}>
                      Ngày {d.day}/{d.month} ({d.weekdayName}) {d.actualEarnings !== null ? '✓ Đã có' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* The Revenue Result Box */}
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-950/20 to-zinc-950 border border-amber-500/40 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs text-zinc-300 font-medium block">
                    Doanh thu chạy xe tự động suy ra cho Ngày {targetDay.day}/{targetDay.month}:
                  </span>
                  <div className="text-lg sm:text-xl font-black text-amber-400 mt-0.5">
                    +{autoRevenue.toLocaleString('vi-VN')} đ
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-zinc-300 font-bold block">
                    ~{autoHours} giờ xe
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    KPI: {((targetDay.dynamicKpiTarget || targetDay.kpiTarget) / 1000)}k
                  </span>
                </div>
              </div>

              {/* Formula detail explanation */}
              <div className="text-[10px] text-zinc-400 bg-zinc-900/80 p-2 rounded-lg border border-zinc-800 space-y-0.5 font-mono">
                <div>
                  Công thức: Doanh thu = Chênh lệch ví ({balanceDiff >= 0 ? '+' : ''}{balanceDiff.toLocaleString('vi-VN')}đ)
                  + Chi phí ({totalDayExpenses.toLocaleString('vi-VN')}đ)
                  {dayOtherIncome > 0 ? ` - Thu khác (${dayOtherIncome.toLocaleString('vi-VN')}đ)` : ''}
                </div>
                <div className="text-zinc-400">
                  (Chi phí hôm nay: Ăn {dayLiving / 1000}k + Góp xe {targetDay.bikeCost / 1000}k
                  {targetDay.rentCost > 0 ? ` + Nhà ${targetDay.rentCost / 1000}k` : ''}
                  {targetDay.debtPayment > 0 ? ` + Nợ ${targetDay.debtPayment / 1000}k` : ''})
                </div>
              </div>

              {/* Checkbox: Auto Record */}
              <button
                type="button"
                onClick={() => setShouldAutoRecord(!shouldAutoRecord)}
                className="flex items-center gap-2 pt-1 text-xs text-zinc-200 hover:text-white cursor-pointer select-none"
              >
                {shouldAutoRecord ? (
                  <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-zinc-500 shrink-0" />
                )}
                <span>
                  Tự động điền <b>{autoRevenue.toLocaleString('vi-VN')} đ</b> vào Ngày {targetDay.day}/{targetDay.month} trên lịch & cập nhật KPI
                </span>
              </button>
            </div>
          </div>

          {/* Section 3: Targets */}
          <div className="space-y-3 pt-3 border-t border-zinc-800">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
              3. Mục Tiêu & Cài Đặt KPI
            </span>

            {/* Target Cash */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Mục tiêu số dư gom trước Tết (06/02/2026)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={targetCash ? parsedTarget.toLocaleString('vi-VN') : ''}
                  onChange={(e) => setTargetCash(e.target.value.replace(/\D/g, ''))}
                  placeholder="15.000.000"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm font-bold text-white focus:outline-none focus:border-zinc-500"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-zinc-400">VNĐ</span>
              </div>
              <p className="text-[10px] text-zinc-400 mt-1">
                Mặc định: 15 triệu (5tr cho mẹ + 10tr phòng thân ăn Tết).
              </p>
            </div>

            {/* Hourly Rate */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Đơn giá chạy xe ước tính / 1 giờ
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={hourlyRate ? parsedRate.toLocaleString('vi-VN') : ''}
                  onChange={(e) => setHourlyRate(e.target.value.replace(/\D/g, ''))}
                  placeholder="65.000"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm font-bold text-white focus:outline-none focus:border-zinc-500"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-zinc-400">đ/giờ</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs sm:text-sm transition shadow-lg shadow-emerald-950/40"
            >
              Lưu Nguồn Tiền & Ghi Nhận Doanh Thu
            </button>
            <button
              type="button"
              onClick={handleResetDefaults}
              title="Khôi phục mặc định"
              className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 border border-zinc-700 transition"
            >
              <RotateCcw className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
