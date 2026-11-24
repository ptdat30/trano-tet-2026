import React, { useState, useEffect, useMemo } from 'react';
import { CalendarMonth } from './components/CalendarMonth';
import { DayModal } from './components/DayModal';
import { DebtListModal } from './components/DebtListModal';
import { WalletSettingsModal } from './components/WalletSettingsModal';
import {
  buildInitialDays,
  DEFAULT_SETTINGS,
  DAILY_KPI
} from './data/calendarData';
import type { DayData, DayCalculated, FinanceSettings } from './types/finance';
import { soundFx } from './utils/sound';
import { fireKpiCelebration } from './utils/confetti';
import {
  Wallet,
  Calendar as CalendarIcon,
  TrendingUp,
  Volume2,
  VolumeX,
  CreditCard,
  Target,
  Sliders,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const DAYS_STORAGE_KEY = 'tra_no_tet_calendar_v2';
const SETTINGS_STORAGE_KEY = 'tra_no_tet_settings_v2';

export const App: React.FC = () => {
  // Settings state (Initial cash, Target cash, Hourly rate)
  const [settings, setSettings] = useState<FinanceSettings>(() => {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  // Days data state
  const [days, setDays] = useState<DayData[]>(() => {
    const saved = localStorage.getItem(DAYS_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return buildInitialDays();
      }
    }
    return buildInitialDays();
  });

  const [selectedMonth, setSelectedMonth] = useState<'all' | '11' | '12' | '1' | '2'>('all');
  const [selectedDay, setSelectedDay] = useState<DayCalculated | null>(null);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'warn' } | null>(null);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem(DAYS_STORAGE_KEY, JSON.stringify(days));
  }, [days]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Auto-hide toast
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // DYNAMIC RECALIBRATION ENGINE
  const { calculatedDays, dynamicDailyKpi, dynamicHoursPerDay, stats } = useMemo(() => {
    const unenteredDays = days.filter((d) => d.actualEarnings === null);
    const enteredDays = days.filter((d) => d.actualEarnings !== null);

    // Compute wallet balance after all entered days
    let runningBalanceEntered = settings.initialCash;
    enteredDays.forEach((d) => {
      const living = d.actualLivingExpense !== null ? d.actualLivingExpense : d.foodCost;
      const totalExp = living + d.bikeCost + d.rentCost + d.debtPayment;
      const net = ((d.actualEarnings || 0) + d.otherIncome) - totalExp;
      runningBalanceEntered += net;
    });

    const currentWalletBalance = runningBalanceEntered;

    // Remaining future commitments for unentered days
    const futureIncomes = unenteredDays.reduce((sum, d) => sum + d.otherIncome, 0);
    const futureExpenses = unenteredDays.reduce((sum, d) => {
      const plannedLiving = d.actualLivingExpense !== null ? d.actualLivingExpense : d.foodCost;
      return sum + (plannedLiving + d.bikeCost + d.rentCost + d.debtPayment);
    }, 0);

    // Total earnings needed from driving across remaining days
    const netNeededFromDriving = (settings.targetCash - currentWalletBalance) + futureExpenses - futureIncomes;

    let dynamicKpi = DAILY_KPI;
    if (unenteredDays.length > 0) {
      const rawKpi = netNeededFromDriving / unenteredDays.length;
      dynamicKpi = Math.max(0, Math.ceil(rawKpi / 1000) * 1000);
    } else {
      dynamicKpi = 0;
    }

    const dynamicHours = Math.round((dynamicKpi / settings.hourlyRate) * 10) / 10;

    // Build calculated day objects
    let rollingBal = settings.initialCash;
    const calculated = days.map((d) => {
      const effectiveLiving = d.actualLivingExpense !== null ? d.actualLivingExpense : d.foodCost;
      const totalExpense = effectiveLiving + d.bikeCost + d.rentCost + d.debtPayment;
      const isEntered = d.actualEarnings !== null;
      const earned = isEntered ? d.actualEarnings! : 0;
      const netIncome = (earned + d.otherIncome) - totalExpense;

      if (isEntered) {
        rollingBal += netIncome;
      }

      const targetKpiForDay = isEntered ? d.kpiTarget : dynamicKpi;
      const kpiDiff = isEntered ? d.actualEarnings! - targetKpiForDay : null;
      const isKpiAchieved = isEntered && d.actualEarnings! >= targetKpiForDay;

      return {
        ...d,
        effectiveLivingExpense: effectiveLiving,
        totalExpense,
        netIncome,
        runningBalance: rollingBal,
        kpiDiff,
        isKpiAchieved,
        dynamicKpiTarget: dynamicKpi
      };
    });

    // High-level statistics
    const totalEarned = enteredDays.reduce((sum, d) => sum + (d.actualEarnings || 0), 0);
    const totalLivingSpent = enteredDays.reduce((sum, d) => {
      return sum + (d.actualLivingExpense !== null ? d.actualLivingExpense : d.foodCost);
    }, 0);
    const daysAchieved = enteredDays.filter((d) => (d.actualEarnings || 0) >= d.kpiTarget).length;
    const remainingToTarget = Math.max(0, settings.targetCash - currentWalletBalance);

    return {
      calculatedDays: calculated,
      dynamicDailyKpi: dynamicKpi,
      dynamicHoursPerDay: dynamicHours,
      stats: {
        currentBalance: currentWalletBalance,
        totalEarned,
        totalLivingSpent,
        completedDays: enteredDays.length,
        unenteredDaysCount: unenteredDays.length,
        daysAchieved,
        remainingToTarget
      }
    };
  }, [days, settings]);

  // Group days by month
  const monthsData = useMemo(() => {
    const m11 = calculatedDays.filter((d) => d.month === 11);
    const m12 = calculatedDays.filter((d) => d.month === 12);
    const m1 = calculatedDays.filter((d) => d.month === 1);
    const m2 = calculatedDays.filter((d) => d.month === 2);

    return [
      { id: '11', year: 2025, month: 11, days: m11 },
      { id: '12', year: 2025, month: 12, days: m12 },
      { id: '1', year: 2026, month: 1, days: m1 },
      { id: '2', year: 2026, month: 2, days: m2 },
    ];
  }, [calculatedDays]);

  const displayedMonths = useMemo(() => {
    if (selectedMonth === 'all') return monthsData;
    return monthsData.filter((m) => m.id === selectedMonth);
  }, [monthsData, selectedMonth]);

  // Handlers
  const handleDayClick = (day: DayCalculated) => {
    setSelectedDay(day);
    setIsDayModalOpen(true);
  };

  const handleSaveDay = (dayId: number, hours: number, earnings: number, livingExpense: number) => {
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId
          ? {
              ...d,
              hoursWorked: hours,
              actualEarnings: earnings,
              actualLivingExpense: livingExpense
            }
          : d
      )
    );

    const isAchieved = earnings >= dynamicDailyKpi;
    if (isAchieved) {
      fireKpiCelebration();
      if (isSoundOn) {
        soundFx.playVictoryFanfare();
      }
      const surplus = earnings - dynamicDailyKpi;
      setToastMessage({
        type: 'success',
        text: `Đạt KPI! Kiếm +${earnings.toLocaleString('vi-VN')} đ (dư ${surplus >= 0 ? `+${surplus.toLocaleString('vi-VN')} đ` : '0đ'}). KPI các ngày sau đã được giảm tải!`
      });
    } else {
      if (isSoundOn && earnings > 0) {
        soundFx.playCoinSound();
      }
      setToastMessage({
        type: 'info',
        text: `Đã lưu: Kiếm +${earnings.toLocaleString('vi-VN')} đ, chi tiêu ${livingExpense.toLocaleString('vi-VN')} đ. KPI các ngày sau đã tự động cân đối lại.`
      });
    }
  };

  const handleClearDay = (dayId: number) => {
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId
          ? {
              ...d,
              hoursWorked: null,
              actualEarnings: null,
              actualLivingExpense: null
            }
          : d
      )
    );
    setToastMessage({
      type: 'info',
      text: 'Đã xóa dữ liệu ngày này. KPI đã được hoàn trả về kế hoạch.'
    });
  };

  const handleSaveSettings = (newSettings: FinanceSettings) => {
    setSettings(newSettings);
    setToastMessage({
      type: 'success',
      text: 'Đã cập nhật số dư ví & mục tiêu! Toàn bộ KPI các ngày còn lại đã được tính lại chính xác.'
    });
  };

  // KPI comparison against baseline 390k
  const kpiDiffFromBaseline = dynamicDailyKpi - DAILY_KPI;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans antialiased selection:bg-emerald-500/30">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-200 max-w-sm">
          <div
            className={`px-4 py-3 rounded-xl shadow-2xl border text-xs sm:text-sm font-medium flex items-center gap-2.5 backdrop-blur-md ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50 shadow-emerald-950/50'
                : 'bg-zinc-900/90 text-zinc-200 border-zinc-700 shadow-black/50'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={1.5} />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" strokeWidth={1.5} />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CalendarIcon className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Lịch Trả Nợ & Tích Lũy Tết 2026
              </h1>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                Tự động cân đối KPI theo số dư ví và chi tiêu thực tế từng ngày
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 border border-zinc-700 flex items-center gap-1.5 transition"
              title="Đổi số dư ví ban đầu hoặc đổi mục tiêu tích lũy"
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.5} />
              <span className="hidden sm:inline">Cài đặt ví</span>
            </button>

            <button
              onClick={() => setIsDebtModalOpen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 border border-zinc-700 flex items-center gap-1.5 transition"
            >
              <CreditCard className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.5} />
              <span>Xem nợ</span>
            </button>

            <button
              onClick={() => setIsSoundOn(!isSoundOn)}
              title={isSoundOn ? 'Tắt âm thanh' : 'Bật âm thanh'}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 border border-zinc-700 transition"
            >
              {isSoundOn ? (
                <Volume2 className="w-4 h-4 text-emerald-400" strokeWidth={1.5} />
              ) : (
                <VolumeX className="w-4 h-4 text-zinc-400" strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-4 py-5 space-y-5">
        {/* Dynamic Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Card 1: Số dư ví hiện tại */}
          <div
            onClick={() => setIsSettingsModalOpen(true)}
            className="group cursor-pointer p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition"
          >
            <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
              <span>Số dư ví hiện tại</span>
              <Wallet className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition" strokeWidth={1.5} />
            </div>
            <div className="text-base sm:text-lg font-black text-white">
              {stats.currentBalance.toLocaleString('vi-VN')} đ
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5 flex justify-between">
              <span>Khởi điểm: {settings.initialCash.toLocaleString('vi-VN')} đ</span>
              <span className="text-emerald-400 font-semibold group-hover:underline">Đổi ✎</span>
            </div>
          </div>

          {/* Card 2: Đã cày & Đã tiêu */}
          <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
              <span>Thu & Chi ({stats.completedDays} ngày)</span>
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.5} />
            </div>
            <div className="text-base sm:text-lg font-black text-amber-400">
              +{stats.totalEarned.toLocaleString('vi-VN')} đ
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">
              Đã tiêu sinh hoạt: -{stats.totalLivingSpent.toLocaleString('vi-VN')} đ
            </div>
          </div>

          {/* Card 3: Mục tiêu */}
          <div
            onClick={() => setIsSettingsModalOpen(true)}
            className="group cursor-pointer p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition"
          >
            <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
              <span>Mục tiêu ({settings.targetCash / 1000000}tr)</span>
              <Target className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition" strokeWidth={1.5} />
            </div>
            <div className="text-base sm:text-lg font-black text-white">
              {stats.currentBalance >= settings.targetCash ? (
                <span className="text-emerald-400">Đã đạt mục tiêu! 🎉</span>
              ) : (
                <span>Thiếu {stats.remainingToTarget.toLocaleString('vi-VN')} đ</span>
              )}
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5 flex justify-between">
              <span>{Math.min(100, Math.round((stats.currentBalance / settings.targetCash) * 100))}% mục tiêu</span>
              <span className="text-rose-400 font-semibold group-hover:underline">Đổi ✎</span>
            </div>
          </div>

          {/* Card 4: KPI TỰ ĐỘNG ĐIỀU CHỈNH */}
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-zinc-900/90 to-zinc-900/40 border border-emerald-500/30">
            <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
              <span className="font-semibold text-emerald-400">KPI Tự Động Cân Đối</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                {stats.unenteredDaysCount} ngày còn
              </span>
            </div>
            <div className="text-base sm:text-lg font-black text-emerald-400">
              {dynamicDailyKpi.toLocaleString('vi-VN')} đ
              <span className="text-xs font-normal text-zinc-300">/ngày</span>
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5 flex items-center justify-between">
              <span>~{dynamicHoursPerDay}h chạy xe/ngày</span>
              {kpiDiffFromBaseline !== 0 && (
                <span className={kpiDiffFromBaseline > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                  {kpiDiffFromBaseline > 0 ? `+${Math.round(kpiDiffFromBaseline / 1000)}k` : `${Math.round(kpiDiffFromBaseline / 1000)}k`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Balance Advice Pill */}
        <div className="px-4 py-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-zinc-300">
              {kpiDiffFromBaseline <= 0 ? (
                <>Bạn đang <b>đi đúng hoặc vượt tiến độ</b>! Chỉ cần duy trì <b className="text-emerald-400">{dynamicDailyKpi.toLocaleString('vi-VN')} đ/ngày</b> ({dynamicHoursPerDay} giờ) là về đích {settings.targetCash / 1000000} triệu.</>
              ) : (
                <>Số tiền tiêu hoặc nghỉ các hôm trước khiến KPI tăng nhẹ lên <b className="text-amber-400">{dynamicDailyKpi.toLocaleString('vi-VN')} đ/ngày</b> ({dynamicHoursPerDay} giờ) để đảm bảo gom đủ {settings.targetCash / 1000000} triệu trước Tết.</>
              )}
            </span>
          </div>
          <span className="text-[11px] text-zinc-400 whitespace-nowrap">
            Đã hoàn thành {stats.daysAchieved}/{stats.completedDays} ngày đạt KPI
          </span>
        </div>

        {/* Month Filter Selector */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'Tất cả (75 ngày)' },
              { id: '11', label: 'Tháng 11' },
              { id: '12', label: 'Tháng 12' },
              { id: '1', label: 'Tháng 01' },
              { id: '2', label: 'Tháng 02' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedMonth(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  selectedMonth === tab.id
                    ? 'bg-zinc-100 text-zinc-900 shadow-sm'
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-[11px] text-zinc-400 hidden md:inline">
            Bấm vào từng ô để nhập tiền cày & tiền đã dùng trong ngày
          </span>
        </div>

        {/* Calendar Grids */}
        <div className="space-y-6">
          {displayedMonths.map((m) => (
            <CalendarMonth
              key={m.id}
              year={m.year}
              month={m.month}
              days={m.days}
              onDayClick={handleDayClick}
            />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 py-4 text-center text-xs text-zinc-400">
        Kế hoạch trả nợ & đón Tết 2026 • Dữ liệu lưu an toàn trên trình duyệt của bạn
      </footer>

      {/* Modals */}
      <DayModal
        isOpen={isDayModalOpen}
        day={selectedDay}
        onClose={() => setIsDayModalOpen(false)}
        onSave={handleSaveDay}
        onClear={handleClearDay}
      />

      <DebtListModal
        isOpen={isDebtModalOpen}
        onClose={() => setIsDebtModalOpen(false)}
      />

      <WalletSettingsModal
        isOpen={isSettingsModalOpen}
        settings={settings}
        onClose={() => setIsSettingsModalOpen(false)}
        onSave={handleSaveSettings}
      />
    </div>
  );
};

export default App;
