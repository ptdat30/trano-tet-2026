import React, { useState, useEffect } from 'react';
import type { FinanceSettings, DayCalculated } from '../types/finance';
import { Wallet, Smartphone, Banknote, RotateCcw, Building2, Calculator, CheckSquare, Square, Utensils, CheckCircle2, TrendingUp } from 'lucide-react';
import { DEFAULT_SETTINGS } from '../data/calendarData';

interface WalletSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: FinanceSettings;
  days: DayCalculated[];
  onSave: (
    newSettings: FinanceSettings,
    autoRecord?: {
      dayId: number;
      revenue: number;
      hours: number;
      livingExpense: number;
    }
  ) => void;
}

const PRESET_LIVING_AMOUNTS = [40000, 57000, 75000, 100000, 120000];

export const WalletSettingsModal: React.FC<WalletSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  days,
  onSave
}) => {
  if (!isOpen) return null;

  const [bank, setBank] = useState<string>(String(settings.wallets?.bank ?? 1000000));
  const [app, setApp] = useState<string>(String(settings.wallets?.app ?? 0));
  const [cash, setCash] = useState<string>(String(settings.wallets?.cash ?? 0));
  const [initialCash, setInitialCash] = useState<string>(String(settings.initialCash ?? 1000000));
  const [targetCash, setTargetCash] = useState<string>(String(settings.targetCash ?? 15000000));
  const [hourlyRate, setHourlyRate] = useState<string>(String(settings.hourlyRate ?? 65000));

  // Auto revenue recording state
  const firstUnenteredDay = days.find((d) => d.actualEarnings === null) || days[0];
  const [selectedDayId, setSelectedDayId] = useState<number>(firstUnenteredDay ? firstUnenteredDay.id : 1);
  const [shouldAutoRecord, setShouldAutoRecord] = useState<boolean>(true);
  const [customLivingExpense, setCustomLivingExpense] = useState<string>('75000');

  useEffect(() => {
    setBank(String(settings.wallets?.bank ?? 1000000));
    setApp(String(settings.wallets?.app ?? 0));
    setCash(String(settings.wallets?.cash ?? 0));
    setInitialCash(String(settings.initialCash ?? 1000000));
    setTargetCash(String(settings.targetCash ?? 15000000));
    setHourlyRate(String(settings.hourlyRate ?? 65000));

    const unentered = days.find((d) => d.actualEarnings === null);
    if (unentered) {
      setSelectedDayId(unentered.id);
    }
  }, [settings, days]);

  const targetDay = days.find((d) => d.id === selectedDayId) || days[0];

  // Update living expense when selected day changes
  useEffect(() => {
    if (targetDay) {
      setCustomLivingExpense(
        targetDay.actualLivingExpense !== null
          ? String(targetDay.actualLivingExpense)
          : String(targetDay.foodCost || 75000)
      );
    }
  }, [selectedDayId, targetDay]);

  const parsedBank = parseInt(bank.replace(/\D/g, ''), 10) || 0;
  const parsedApp = parseInt(app.replace(/\D/g, ''), 10) || 0;
  const parsedCash = parseInt(cash.replace(/\D/g, ''), 10) || 0;
  const totalCurrent = parsedBank + parsedApp + parsedCash;

  const parsedInitial = parseInt(initialCash.replace(/\D/g, ''), 10) || 1000000;
  const parsedTarget = parseInt(targetCash.replace(/\D/g, ''), 10) || 0;
  const parsedRate = parseInt(hourlyRate.replace(/\D/g, ''), 10) || 65000;
  const parsedLiving = parseInt(customLivingExpense.replace(/\D/g, ''), 10) || 0;

  // Real-world calculations: compare against balance before targetDay began
  const targetDayIndex = days.findIndex((d) => d.id === selectedDayId);
  const dayStartBalance = targetDayIndex > 0
    ? days[targetDayIndex - 1].runningBalance
    : (settings.initialCash ?? 1000000);

  const balanceDiff = totalCurrent - dayStartBalance; // Tiền tăng/giảm trong ví hôm nay so với đầu ngày
  const dayFixedOutflow = targetDay ? (targetDay.bikeCost + targetDay.rentCost + targetDay.debtPayment) : 127000;
  const totalDayExpenses = parsedLiving + dayFixedOutflow; // Tổng chi phí (góp xe + ăn uống + nợ)
  const dayOtherIncome = targetDay ? targetDay.otherIncome : 0;

  // 1. Tổng doanh thu cày được: Doanh thu = Chênh lệch ví + Tổng chi phí - Thu khác
  const rawAutoRevenue = balanceDiff + totalDayExpenses - dayOtherIncome;
  const autoRevenue = Math.max(0, Math.round(rawAutoRevenue / 1000) * 1000);
  const autoHours = Math.round((autoRevenue / parsedRate) * 10) / 10;

  // 2. Thực dư tích lũy hôm nay (Sau khi trừ chi phí): = Doanh thu - Chi phí
  const netSurplusToday = (autoRevenue + dayOtherIncome) - totalDayExpenses;
  const targetKpiForDay = targetDay ? (targetDay.dynamicKpiTarget || targetDay.kpiTarget) : 390000;
  const isKpiAchieved = autoRevenue >= targetKpiForDay;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(
      {
        ...settings,
        initialCash: parsedInitial,
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
            hours: autoHours,
            livingExpense: parsedLiving
          }
        : undefined
    );
    onClose();
  };

  const handleResetDefaults = () => {
    setBank(String(DEFAULT_SETTINGS.wallets.bank));
    setApp(String(DEFAULT_SETTINGS.wallets.app));
    setCash(String(DEFAULT_SETTINGS.wallets.cash));
    setInitialCash(String(DEFAULT_SETTINGS.initialCash ?? 1000000));
    setTargetCash(String(DEFAULT_SETTINGS.targetCash));
    setHourlyRate(String(DEFAULT_SETTINGS.hourlyRate));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-2xl text-zinc-100 max-h-[92vh] overflow-y-auto my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Wallet className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                Chốt Số Dư 3 Ví & Xuất Doanh Thu Ngày
              </h3>
              <p className="text-[11px] text-zinc-400">
                Tự động tính ra Tổng doanh thu cày được và Thực dư sau khi trừ chi phí
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
              1. Nhập Số Dư 3 Ví Lúc Này
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
                <span className="text-[10px] text-zinc-400">Đã tự trừ 127k xe lúc 9g sáng</span>
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
                <span className="text-[10px] text-zinc-400">Tiền mặt trong túi / bóp</span>
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
                  Tổng 3 ví hiện tại: <span className="text-emerald-400 font-black">{totalCurrent.toLocaleString('vi-VN')} đ</span>
                </span>
                <span className="text-[10px] text-zinc-400">
                  Số dư sáng đầu ngày ({targetDay ? `Ngày ${targetDay.day}/${targetDay.month}` : ''}): {dayStartBalance.toLocaleString('vi-VN')} đ
                </span>
              </div>
              <div className="text-right">
                <span
                  className={`text-xs sm:text-sm font-black ${
                    balanceDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {balanceDiff >= 0 ? `+${balanceDiff.toLocaleString('vi-VN')}` : balanceDiff.toLocaleString('vi-VN')} đ
                </span>
                <span className="text-[10px] text-zinc-400 block">thực tăng trong ví</span>
              </div>
            </div>
          </div>

          {/* Section 2: Auto Revenue Calculation */}
          <div className="space-y-3 pt-3 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>2. Tự Động Tính Doanh Thu Chạy Xe Hôm Nay</span>
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

            {/* Custom living expense input */}
            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.5} />
                  <span>Tiền ăn uống / sinh hoạt thực tế bạn đã tiêu hôm nay:</span>
                </label>
                <span className="text-[10px] text-zinc-400">
                  (Nhập số thực tiêu)
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={customLivingExpense ? parsedLiving.toLocaleString('vi-VN') : ''}
                  onChange={(e) => setCustomLivingExpense(e.target.value.replace(/\D/g, ''))}
                  placeholder="75.000"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-1.5 text-sm font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                />
                <span className="absolute right-3.5 top-2 text-xs text-zinc-400">VNĐ</span>
              </div>
              {/* Quick Presets */}
              <div className="grid grid-cols-5 gap-1 pt-0.5">
                {PRESET_LIVING_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCustomLivingExpense(String(amt))}
                    className={`py-1 text-[10px] font-semibold rounded-lg border transition ${
                      parsedLiving === amt
                        ? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold'
                        : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                    }`}
                  >
                    {amt === 75000 ? '75k (chuẩn)' : `${amt / 1000}k`}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear 3-Line Financial Calculation Breakdown */}
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-zinc-950 to-zinc-900 border border-zinc-700 space-y-2.5">
              {/* Row 1: Gross Driving Revenue */}
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <div>
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-amber-400" strokeWidth={1.5} />
                    <span>TỔNG DOANH THU ĐÃ CÀY ĐƯỢC:</span>
                  </span>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    (Tiền xe kiếm được trước khi bị trừ chi phí)
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg sm:text-xl font-black text-amber-400">
                    +{autoRevenue.toLocaleString('vi-VN')} đ
                  </div>
                  <span className="text-[10px] text-zinc-400">
                    ~{autoHours} giờ chạy xe
                  </span>
                </div>
              </div>

              {/* Row 2: Expenses Deducted */}
              <div className="text-xs text-zinc-400 space-y-1 bg-zinc-950/70 p-2.5 rounded-lg border border-zinc-800">
                <div className="flex justify-between font-semibold text-zinc-300">
                  <span>Các khoản chi phí trong ngày:</span>
                  <span className="text-rose-400 font-bold">-{totalDayExpenses.toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex justify-between text-[11px] pl-2 text-zinc-400">
                  <span>• Tiền góp xe (App tự động trừ lúc 9g sáng):</span>
                  <span className="text-zinc-200">-{targetDay.bikeCost.toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex justify-between text-[11px] pl-2 text-zinc-400">
                  <span>• Tiền ăn uống / sinh hoạt bạn tiêu:</span>
                  <span className="text-amber-400">-{parsedLiving.toLocaleString('vi-VN')} đ</span>
                </div>
                {targetDay.rentCost > 0 && (
                  <div className="flex justify-between text-[11px] pl-2 text-purple-300">
                    <span>• Tiền nhà:</span>
                    <span>-{targetDay.rentCost.toLocaleString('vi-VN')} đ</span>
                  </div>
                )}
                {targetDay.debtPayment > 0 && (
                  <div className="flex justify-between text-[11px] pl-2 text-rose-300">
                    <span>• Tiền trả nợ ({targetDay.debtLabel}):</span>
                    <span>-{targetDay.debtPayment.toLocaleString('vi-VN')} đ</span>
                  </div>
                )}
              </div>

              {/* Row 3: Net Surplus after expenses */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" strokeWidth={1.5} />
                    <span>THỰC DƯ TÍCH LŨY (SAU TRỪ CHI PHÍ):</span>
                  </span>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    (= Doanh thu {autoRevenue / 1000}k - Chi phí {totalDayExpenses / 1000}k)
                  </p>
                </div>
                <div className="text-right">
                  <div
                    className={`text-base sm:text-lg font-black ${
                      netSurplusToday >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {netSurplusToday >= 0 ? '+' : ''}
                    {netSurplusToday.toLocaleString('vi-VN')} đ
                  </div>
                  <span className="text-[10px] text-zinc-400">
                    {isKpiAchieved ? '🎉 Vượt KPI hôm nay!' : 'Đã gom vào ví'}
                  </span>
                </div>
              </div>

              {/* Checkbox: Auto Record */}
              <div className="pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShouldAutoRecord(!shouldAutoRecord)}
                  className="flex items-center gap-2 text-xs text-zinc-200 hover:text-white cursor-pointer select-none"
                >
                  {shouldAutoRecord ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-zinc-500 shrink-0" />
                  )}
                  <span>
                    Tự động ghi nhận doanh thu <b>+{autoRevenue.toLocaleString('vi-VN')} đ</b> & tiền tiêu <b>{parsedLiving.toLocaleString('vi-VN')} đ</b> vào Ngày {targetDay.day}/{targetDay.month}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Targets */}
          <div className="space-y-3 pt-3 border-t border-zinc-800">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
              3. Mục Tiêu & Cài Đặt KPI
            </span>

            {/* Starting Balance of Campaign */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Số vốn ban đầu sáng 24/11 (Bắt đầu chiến dịch)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={initialCash ? parsedInitial.toLocaleString('vi-VN') : ''}
                  onChange={(e) => setInitialCash(e.target.value.replace(/\D/g, ''))}
                  placeholder="1.000.000"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm font-bold text-white focus:outline-none focus:border-zinc-500"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-zinc-400">VNĐ</span>
              </div>
              <p className="text-[10px] text-zinc-400 mt-1">
                Mặc định: 1.000.000 đ (Số tiền bạn có sẵn trong người vào sáng ngày đầu tiên).
              </p>
            </div>

            {/* Target Cash */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Mục tiêu số dư gom trước Tết (06/02/2027)
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
