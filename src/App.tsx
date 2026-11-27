import React, { useState, useEffect, useMemo } from 'react';
import { CalendarMonth } from './components/CalendarMonth';
import { DayModal } from './components/DayModal';
import { DebtListModal } from './components/DebtListModal';
import { WalletSettingsModal } from './components/WalletSettingsModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { CosmicBackground } from './components/CosmicBackground';
import { DebtAlertBanner } from './components/DebtAlertBanner';
import { calculateDebtKpiAnalysis } from './utils/debtKpi';
import {
  getSupabaseConfig,
  fetchCloudPlan,
  pushCloudPlan,
  subscribeToCloudPlan,
  getDeviceId
} from './lib/supabase';
import {
  buildInitialDays,
  DEFAULT_SETTINGS,
  INITIAL_DEBT_CHECKLIST
} from './data/calendarData';
import type { DayData, DayCalculated, FinanceSettings, FixedScheduleItem } from './types/finance';
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
  CheckCircle2,
  AlertCircle,
  Building2,
  Smartphone,
  Banknote,
  Cloud,
  CloudCheck,
  RefreshCw
} from 'lucide-react';

const DAYS_STORAGE_KEY = 'tra_no_tet_calendar_v2';
const SETTINGS_STORAGE_KEY = 'tra_no_tet_settings_v2';
const SCHEDULES_STORAGE_KEY = 'tra_no_tet_schedules_v2';
const LOCAL_UPDATED_AT_KEY = 'tra_no_local_updated_at_v2';

// Normalize debt & rent checklist (keeps only debts & upcoming rents, migrates years, preserves isPaid)
export function normalizeDebtChecklist(items?: FixedScheduleItem[] | null): FixedScheduleItem[] {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return INITIAL_DEBT_CHECKLIST;
  }

  const filtered = items
    .filter((s) => (s.type === 'debt' || s.type === 'rent') && s.id !== 'rent-1')
    .map((s) => {
      let dateStr = s.dateStr;
      if (dateStr.startsWith('2025-11-')) {
        dateStr = dateStr.replace('2025-11-', '2026-11-');
      } else if (dateStr.startsWith('2025-12-')) {
        dateStr = dateStr.replace('2025-12-', '2026-12-');
      } else if (dateStr.startsWith('2026-01-')) {
        dateStr = dateStr.replace('2026-01-', '2027-01-');
      } else if (dateStr.startsWith('2026-02-')) {
        dateStr = dateStr.replace('2026-02-', '2027-02-');
      }
      // Shift monthly rent due dates from 25th to 10th (10/12 and 10/01)
      if (s.id === 'rent-2' && dateStr === '2026-12-25') {
        dateStr = '2026-12-10';
      } else if (s.id === 'rent-3' && dateStr === '2027-01-25') {
        dateStr = '2027-01-10';
      }
      return {
        ...s,
        dateStr,
        isPaid: Boolean(s.isPaid)
      };
    });

  return filtered.length > 0 ? filtered : INITIAL_DEBT_CHECKLIST;
}

// Migration helper to ensure exact real-world 2026-2027 calendar and correct day-of-week
export function migrateDaysToCorrectYear(daysList: DayData[]): DayData[] {
  const weekdayShort = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const weekdayFull = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

  return daysList.map((d) => {
    let newYear = d.year;
    if (d.month === 11 || d.month === 12) {
      newYear = 2026;
    } else if (d.month === 1 || d.month === 2) {
      newYear = 2027;
    }

    const dObj = new Date(newYear, d.month - 1, d.day);
    const wIdx = dObj.getDay();
    const dateStr = `${newYear}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;

    return {
      ...d,
      year: newYear,
      dateStr,
      weekdayName: weekdayShort[wIdx],
      weekdayFull: weekdayFull[wIdx]
    };
  });
}

export const App: React.FC = () => {
  // Settings state (3 Wallets, Target cash, Hourly rate)
  const [settings, setSettings] = useState<FinanceSettings>(() => {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          wallets: parsed.wallets || {
            bank: parsed.initialCash ?? DEFAULT_SETTINGS.wallets.bank,
            app: 0,
            cash: 0
          }
        };
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  // Debt & Rent Checklist (14 upcoming debts + 2 upcoming rents, with isPaid toggle)
  const [schedules, setSchedules] = useState<FixedScheduleItem[]>(() => {
    const saved = localStorage.getItem(SCHEDULES_STORAGE_KEY);
    if (saved) {
      try {
        return normalizeDebtChecklist(JSON.parse(saved));
      } catch {
        return INITIAL_DEBT_CHECKLIST;
      }
    }
    return INITIAL_DEBT_CHECKLIST;
  });

  // Days data state (only tracks daily net change / thực thu)
  const [days, setDays] = useState<DayData[]>(() => {
    const savedDays = localStorage.getItem(DAYS_STORAGE_KEY);
    let initialDaysList = buildInitialDays();
    if (savedDays) {
      try {
        initialDaysList = JSON.parse(savedDays);
      } catch {
        initialDaysList = buildInitialDays();
      }
    }
    return migrateDaysToCorrectYear(initialDaysList);
  });

  const [selectedMonth, setSelectedMonth] = useState<'all' | '11' | '12' | '1' | '2'>('all');
  const [selectedDay, setSelectedDay] = useState<DayCalculated | null>(null);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'unconfigured' | 'error'>(() => {
    return getSupabaseConfig() ? 'syncing' : 'unconfigured';
  });
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'warn' } | null>(null);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem(DAYS_STORAGE_KEY, JSON.stringify(days));
  }, [days]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(SCHEDULES_STORAGE_KEY, JSON.stringify(schedules));
  }, [schedules]);

  // Auto-hide toast
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Helper to sync local changes to Supabase asynchronously
  const broadcastToCloud = (
    updatedDays: DayData[],
    updatedSettings: FinanceSettings,
    updatedSchedules: FixedScheduleItem[]
  ) => {
    const nowIso = new Date().toISOString();
    localStorage.setItem(LOCAL_UPDATED_AT_KEY, nowIso);

    if (!getSupabaseConfig()) return;
    setSyncStatus('syncing');
    pushCloudPlan({
      days: updatedDays,
      settings: updatedSettings,
      schedules: updatedSchedules,
      updatedAt: nowIso,
      deviceId: getDeviceId()
    }).then((success) => {
      if (success) {
        setSyncStatus('synced');
        setLastSyncedAt(new Date());
      } else {
        setSyncStatus('error');
      }
    });
  };

  // Supabase Realtime synchronization setup
  useEffect(() => {
    const config = getSupabaseConfig();
    if (!config) {
      setSyncStatus('unconfigured');
      return;
    }

    let isMounted = true;
    setSyncStatus('syncing');

    fetchCloudPlan()
      .then((cloudData) => {
        if (!isMounted) return;
        if (cloudData && cloudData.days && cloudData.settings) {
          const localUpdatedStr = localStorage.getItem(LOCAL_UPDATED_AT_KEY);
          const localTime = localUpdatedStr ? new Date(localUpdatedStr).getTime() : 0;
          const cloudTime = cloudData.updatedAt ? new Date(cloudData.updatedAt).getTime() : 0;

          if (localTime > cloudTime + 1000) {
            pushCloudPlan({
              days,
              settings,
              schedules,
              updatedAt: new Date(localTime).toISOString(),
              deviceId: getDeviceId()
            }).then((ok) => {
              if (!isMounted) return;
              setSyncStatus(ok ? 'synced' : 'error');
              if (ok) setLastSyncedAt(new Date());
            });
            return;
          }

          const migratedDays = migrateDaysToCorrectYear(cloudData.days);
          const normalizedChecklist = normalizeDebtChecklist(cloudData.schedules);
          setDays(migratedDays);
          setSettings(cloudData.settings);
          setSchedules(normalizedChecklist);
          setSyncStatus('synced');
          setLastSyncedAt(new Date());

          localStorage.setItem(DAYS_STORAGE_KEY, JSON.stringify(migratedDays));
          localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(cloudData.settings));
          localStorage.setItem(SCHEDULES_STORAGE_KEY, JSON.stringify(normalizedChecklist));
          if (cloudData.updatedAt) {
            localStorage.setItem(LOCAL_UPDATED_AT_KEY, cloudData.updatedAt);
          }
        } else {
          pushCloudPlan({
            days,
            settings,
            schedules,
            updatedAt: new Date().toISOString(),
            deviceId: getDeviceId()
          }).then((ok) => {
            if (!isMounted) return;
            setSyncStatus(ok ? 'synced' : 'error');
            if (ok) setLastSyncedAt(new Date());
          });
        }
      })
      .catch((err) => {
        console.error('Initial cloud fetch error:', err);
        if (isMounted) setSyncStatus('error');
      });

    const unsubscribe = subscribeToCloudPlan((newPayload) => {
      if (!isMounted) return;
      if (newPayload.days && newPayload.settings) {
        const migratedDays = migrateDaysToCorrectYear(newPayload.days);
        const normalizedChecklist = normalizeDebtChecklist(newPayload.schedules);
        setDays(migratedDays);
        setSettings(newPayload.settings);
        setSchedules(normalizedChecklist);
        setSyncStatus('synced');
        setLastSyncedAt(new Date());

        localStorage.setItem(DAYS_STORAGE_KEY, JSON.stringify(migratedDays));
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newPayload.settings));
        localStorage.setItem(SCHEDULES_STORAGE_KEY, JSON.stringify(normalizedChecklist));
        if (newPayload.updatedAt) {
          localStorage.setItem(LOCAL_UPDATED_AT_KEY, newPayload.updatedAt);
        }

        soundFx.playCoinSound();
        setToastMessage({
          type: 'info',
          text: 'Vừa đồng bộ dữ liệu mới nhất từ thiết bị khác ☁️'
        });
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Total liquid cash across all 3 wallets (SINGLE SOURCE OF TRUTH)
  const totalLiquidWallets = useMemo(() => {
    const w = settings.wallets || DEFAULT_SETTINGS.wallets;
    return (w.bank || 0) + (w.app || 0) + (w.cash || 0);
  }, [settings.wallets]);

  // PURE NET-INCOME (THỰC THU) + UNPAID DEBT/RENT CHECKLIST KPI ENGINE
  // - 3 Wallets = Exact real money currently held (NEVER auto-deducted).
  // - Unpaid debts & rents from Checklist are added to targetCash (15tr) to compute total needed.
  // - Daily KPI = ceil((targetCash + unpaidObligations - currentWalletBalance) / remainingDays).
  const { calculatedDays, dynamicDailyKpi, baselineDailyKpi, dynamicHoursPerDay, debtAnalysis, stats } = useMemo(() => {
    const unenteredDays = days.filter((d) => d.actualEarnings === null);
    const enteredDays = days.filter((d) => d.actualEarnings !== null);

    // 1. Exact current balance from 3 wallets
    const currentWalletBalance = totalLiquidWallets;

    // 2. Unpaid debts & upcoming rents from Checklist + remaining daily bike installments
    const unpaidItems = schedules.filter((item) => !item.isPaid);
    const unpaidChecklistTotal = unpaidItems.reduce((sum, item) => sum + item.amount, 0);
    const totalAllChecklist = schedules.reduce((sum, item) => sum + item.amount, 0);

    // Remaining bike installments across unentered days (127k/day until 11/12, 77k/day from 12/12)
    const highBikeRate = settings.highBikeCost ?? 127000;
    const lowBikeRate = settings.lowBikeCost ?? 77000;
    let remainingHighBikeDays = 0;
    let remainingLowBikeDays = 0;
    const remainingBikeTotal = unenteredDays.reduce((sum, d) => {
      const isHighBike = d.month === 11 || (d.month === 12 && d.day <= 11);
      if (isHighBike) {
        remainingHighBikeDays += 1;
        return sum + highBikeRate;
      }
      remainingLowBikeDays += 1;
      return sum + lowBikeRate;
    }, 0);

    const totalAllBike = days.reduce((sum, d) => {
      const isHighBike = d.month === 11 || (d.month === 12 && d.day <= 11);
      return sum + (isHighBike ? highBikeRate : lowBikeRate);
    }, 0);

    const unpaidObligationsTotal = unpaidChecklistTotal + remainingBikeTotal;
    const totalAllObligations = totalAllChecklist + totalAllBike;

    // 3. Total target = 15tr Tết savings + all unpaid debts & rents + remaining bike installments
    const totalGoalWithDebts = settings.targetCash + unpaidObligationsTotal;
    const remainingToTarget = Math.max(0, totalGoalWithDebts - currentWalletBalance);

    // 4. Daily net income (Thực thu) needed across remaining unentered days
    let dynamicKpi = 0;
    if (unenteredDays.length > 0 && remainingToTarget > 0) {
      const rawKpi = remainingToTarget / unenteredDays.length;
      dynamicKpi = Math.ceil(rawKpi / 1000) * 1000;
    }

    // Baseline daily net target for progress comparison
    const startCash = settings.initialCash ?? 1000000;
    const baselineKpi =
      days.length > 0
        ? Math.ceil(Math.max(0, settings.targetCash + totalAllObligations - startCash) / days.length / 1000) * 1000
        : 0;

    const dynamicHours =
      settings.hourlyRate > 0 ? Math.round((dynamicKpi / settings.hourlyRate) * 10) / 10 : 0;

    // 5. Build calculated day objects with matching checklist reminder items
    const calculated: DayCalculated[] = days.map((d) => {
      const isEntered = d.actualEarnings !== null;
      const netEarned = isEntered ? d.actualEarnings! : 0;
      const targetForDay = isEntered ? (d.kpiTarget || baselineKpi) : dynamicKpi;
      const kpiDiff = isEntered ? netEarned - targetForDay : null;
      const isKpiAchieved = isEntered && netEarned >= targetForDay;
      const dayChecklist = schedules.filter((item) => item.dateStr === d.dateStr);

      return {
        ...d,
        effectiveLivingExpense: 0,
        totalExpense: 0,
        netIncome: netEarned,
        runningBalance: currentWalletBalance,
        kpiDiff,
        isKpiAchieved,
        dynamicKpiTarget: dynamicKpi,
        checklistItems: dayChecklist
      };
    });

    // 6. Minimum Debt KPI & Bottleneck Liquidity Early-Warning Analysis
    const debtAnalysisResult = calculateDebtKpiAnalysis(
      days,
      schedules,
      currentWalletBalance,
      highBikeRate,
      lowBikeRate,
      settings.hourlyRate
    );

    // 7. High-level statistics
    const totalNetEarned = enteredDays.reduce((sum, d) => sum + (d.actualEarnings || 0), 0);
    const averageDailyNet =
      enteredDays.length > 0 ? Math.round(totalNetEarned / enteredDays.length) : 0;
    const daysAchieved = calculated.filter((d) => d.isKpiAchieved).length;

    return {
      calculatedDays: calculated,
      dynamicDailyKpi: dynamicKpi,
      baselineDailyKpi: baselineKpi,
      dynamicHoursPerDay: dynamicHours,
      debtAnalysis: debtAnalysisResult,
      stats: {
        currentBalance: currentWalletBalance,
        totalNetEarned,
        averageDailyNet,
        completedDays: enteredDays.length,
        unenteredDaysCount: unenteredDays.length,
        daysAchieved,
        remainingToTarget,
        unpaidObligationsTotal,
        unpaidChecklistTotal,
        remainingBikeTotal,
        remainingHighBikeDays,
        remainingLowBikeDays,
        unpaidCount: unpaidItems.length,
        totalGoalWithDebts
      }
    };
  }, [days, settings, schedules, totalLiquidWallets]);

  // Group days by month
  const monthsData = useMemo(() => {
    const m11 = calculatedDays.filter((d) => d.month === 11);
    const m12 = calculatedDays.filter((d) => d.month === 12);
    const m1 = calculatedDays.filter((d) => d.month === 1);
    const m2 = calculatedDays.filter((d) => d.month === 2);

    return [
      { id: '11', year: 2026, month: 11, days: m11 },
      { id: '12', year: 2026, month: 12, days: m12 },
      { id: '1', year: 2027, month: 1, days: m1 },
      { id: '2', year: 2027, month: 2, days: m2 }
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

  const handleSaveDay = (
    dayId: number,
    hours: number,
    netEarned: number,
    walletUpdate?: {
      bank: number;
      app: number;
      cash: number;
    }
  ) => {
    const updatedDays = days.map((d) =>
      d.id === dayId
        ? {
            ...d,
            hoursWorked: hours,
            actualEarnings: netEarned,
            kpiTarget: dynamicDailyKpi
          }
        : d
    );
    setDays(updatedDays);

    let updatedSettings = settings;
    if (walletUpdate) {
      updatedSettings = {
        ...settings,
        wallets: walletUpdate
      };
      setSettings(updatedSettings);
    }

    const nowIso = new Date().toISOString();
    localStorage.setItem(DAYS_STORAGE_KEY, JSON.stringify(updatedDays));
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updatedSettings));
    localStorage.setItem(LOCAL_UPDATED_AT_KEY, nowIso);

    broadcastToCloud(updatedDays, updatedSettings, schedules);

    const isAchieved = netEarned >= dynamicDailyKpi;
    if (isAchieved && netEarned > 0) {
      fireKpiCelebration();
      if (isSoundOn) {
        soundFx.playVictoryFanfare();
      }
      setToastMessage({
        type: 'success',
        text: `Đạt mục tiêu! Thực thu +${netEarned.toLocaleString('vi-VN')} đ. Mục tiêu các ngày sau đã được cập nhật!`
      });
    } else {
      if (isSoundOn && netEarned > 0) {
        soundFx.playCoinSound();
      }
      setToastMessage({
        type: 'info',
        text: `Đã lưu thực thu ${netEarned >= 0 ? '+' : ''}${netEarned.toLocaleString('vi-VN')} đ. Mục tiêu các ngày sau đã cân đối lại!`
      });
    }
  };

  const handleClearDay = (dayId: number) => {
    const updatedDays = days.map((d) =>
      d.id === dayId
        ? {
            ...d,
            hoursWorked: null,
            actualEarnings: null,
            actualLivingExpense: null
          }
        : d
    );
    setDays(updatedDays);
    const nowIso = new Date().toISOString();
    localStorage.setItem(DAYS_STORAGE_KEY, JSON.stringify(updatedDays));
    localStorage.setItem(LOCAL_UPDATED_AT_KEY, nowIso);

    broadcastToCloud(updatedDays, settings, schedules);
    setToastMessage({
      type: 'info',
      text: 'Đã xóa thực thu ngày này. Mục tiêu các ngày còn lại đã được tính lại.'
    });
  };

  const handleSaveSettings = (
    newSettings: FinanceSettings,
    recordNet?: {
      dayId: number;
      netEarned: number;
      hours: number;
    }
  ) => {
    let updatedDays = days;
    if (recordNet) {
      updatedDays = days.map((d) =>
        d.id === recordNet.dayId
          ? {
              ...d,
              actualEarnings: recordNet.netEarned,
              hoursWorked: recordNet.hours,
              kpiTarget: dynamicDailyKpi
            }
          : d
      );
    }

    const nowIso = new Date().toISOString();
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    localStorage.setItem(DAYS_STORAGE_KEY, JSON.stringify(updatedDays));
    localStorage.setItem(LOCAL_UPDATED_AT_KEY, nowIso);

    setSettings(newSettings);
    setDays(updatedDays);

    if (recordNet) {
      if (recordNet.netEarned >= dynamicDailyKpi && recordNet.netEarned > 0) {
        fireKpiCelebration();
        if (isSoundOn) soundFx.playVictoryFanfare();
      } else if (isSoundOn && recordNet.netEarned > 0) {
        soundFx.playCoinSound();
      }

      const targetD = days.find((d) => d.id === recordNet.dayId);
      const dayText = targetD ? `Ngày ${targetD.day}/${targetD.month}` : `Ngày ${recordNet.dayId}`;
      setToastMessage({
        type: 'success',
        text: `Đã cập nhật 3 ví & ghi nhận thực thu ${recordNet.netEarned >= 0 ? '+' : ''}${recordNet.netEarned.toLocaleString('vi-VN')} đ vào ${dayText}!`
      });
    } else {
      setToastMessage({
        type: 'success',
        text: 'Đã cập nhật số dư 3 ví & tính lại số tiền cần kiếm cho các ngày còn lại!'
      });
    }

    broadcastToCloud(updatedDays, newSettings, schedules);
  };

  const handleUpdateChecklist = (updatedChecklist: FixedScheduleItem[]) => {
    const nowIso = new Date().toISOString();
    localStorage.setItem(SCHEDULES_STORAGE_KEY, JSON.stringify(updatedChecklist));
    localStorage.setItem(LOCAL_UPDATED_AT_KEY, nowIso);
    setSchedules(updatedChecklist);
    broadcastToCloud(days, settings, updatedChecklist);
  };

  const kpiDiffFromBaseline = dynamicDailyKpi - baselineDailyKpi;

  return (
    <div className="relative min-h-screen text-zinc-100 flex flex-col font-sans antialiased selection:bg-emerald-500/30">
      <CosmicBackground />

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
      <header className="border-b border-zinc-800/80 bg-zinc-950/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-sm shadow-emerald-950">
              <CalendarIcon className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <div className="truncate">
              <h1 className="text-xs sm:text-base font-bold text-white tracking-tight truncate">
                Lịch Trả Nợ Tết 2026
              </h1>
              <p className="text-[10px] sm:text-[11px] text-zinc-400 hidden sm:block">
                Quản lý 3 ví & thực thu hằng ngày • Tự chia mục tiêu kiếm tiền cho các hôm sau
              </p>
            </div>
          </div>

          {/* Unified Action Buttons Group - All equal size on mobile (h-8 w-8) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* 1. Button: Cloud Sync */}
            <button
              onClick={() => setIsCloudModalOpen(true)}
              className={`h-8 w-8 sm:w-auto sm:px-2.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                syncStatus === 'synced'
                  ? 'bg-sky-950/50 border-sky-500/40 text-sky-300 hover:bg-sky-900/50 shadow-sm shadow-sky-950'
                  : syncStatus === 'syncing'
                  ? 'bg-amber-950/50 border-amber-500/40 text-amber-300 hover:bg-amber-900/50'
                  : syncStatus === 'error'
                  ? 'bg-rose-950/50 border-rose-500/40 text-rose-300 hover:bg-rose-900/50'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
              }`}
              title="Đồng bộ dữ liệu Realtime qua Supabase Cloud"
            >
              {syncStatus === 'synced' ? (
                <>
                  <CloudCheck className="w-4 h-4 text-sky-400 shrink-0" strokeWidth={1.5} />
                  <span className="hidden sm:inline">Cloud</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse hidden sm:inline-block" />
                </>
              ) : syncStatus === 'syncing' ? (
                <>
                  <RefreshCw className="w-4 h-4 text-amber-400 animate-spin shrink-0" strokeWidth={1.5} />
                  <span className="hidden sm:inline">Đang sync...</span>
                </>
              ) : (
                <>
                  <Cloud className="w-4 h-4 text-zinc-400 shrink-0" strokeWidth={1.5} />
                  <span className="hidden sm:inline">Cloud</span>
                </>
              )}
            </button>

            {/* 2. Button: Wallets Manager */}
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="h-8 w-8 sm:w-auto sm:px-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-xs font-semibold text-zinc-200 border border-zinc-800 flex items-center justify-center gap-1.5 transition"
              title="Cập nhật 3 Ví (Ngân hàng, Ví App, Tiền mặt)"
            >
              <Wallet className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={1.5} />
              <span className="hidden sm:inline">3 Ví</span>
            </button>

            {/* 3. Button: Debt & Rent Checklist Modal */}
            <button
              onClick={() => setIsDebtModalOpen(true)}
              className="relative h-8 w-8 sm:w-auto sm:px-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-xs font-semibold text-zinc-200 border border-zinc-800 flex items-center justify-center gap-1.5 transition"
              title="Checklist Nợ & Tiền Nhà (Tick Đã trả)"
            >
              <CreditCard className="w-4 h-4 text-purple-400 shrink-0" strokeWidth={1.5} />
              <span className="hidden sm:inline">Nợ ({stats.unpaidCount})</span>
              {stats.unpaidCount > 0 && (
                <span className="sm:hidden absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center leading-none">
                  {stats.unpaidCount}
                </span>
              )}
            </button>

            {/* 4. Button: Sound toggle */}
            <button
              onClick={() => setIsSoundOn(!isSoundOn)}
              title={isSoundOn ? 'Tắt âm thanh' : 'Bật âm thanh'}
              className="h-8 w-8 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 flex items-center justify-center transition shrink-0"
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
          {/* Card 1: Multi-Wallet Breakdown */}
          <div
            onClick={() => setIsSettingsModalOpen(true)}
            className="group cursor-pointer p-3 sm:p-3.5 rounded-2xl bg-zinc-900/60 backdrop-blur-md border border-white/10 hover:border-emerald-500/40 shadow-lg shadow-black/40 transition"
          >
            <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
              <span>Tổng tiền có (3 ví)</span>
              <Wallet className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition" strokeWidth={1.5} />
            </div>
            <div className="text-base sm:text-lg font-black text-white">
              {stats.currentBalance.toLocaleString('vi-VN')} đ
            </div>
            <div className="text-[10px] text-zinc-400 mt-1 space-y-0.5">
              <div className="flex justify-between">
                <span className="flex items-center gap-1">
                  <Building2 className="w-2.5 h-2.5 text-sky-400" />
                  <span>NH:</span>
                </span>
                <span className="text-sky-300 font-semibold">{((settings.wallets?.bank || 0) / 1000).toLocaleString('vi-VN')}k</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center gap-1">
                  <Smartphone className="w-2.5 h-2.5 text-amber-400" />
                  <span>App:</span>
                </span>
                <span className="text-amber-300 font-semibold">{((settings.wallets?.app || 0) / 1000).toLocaleString('vi-VN')}k</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center gap-1">
                  <Banknote className="w-2.5 h-2.5 text-emerald-400" />
                  <span>Mặt:</span>
                </span>
                <span className="text-emerald-300 font-semibold">{((settings.wallets?.cash || 0) / 1000).toLocaleString('vi-VN')}k</span>
              </div>
            </div>
          </div>

          {/* Card 2: Tổng thực thu đã ghi nhận */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-zinc-900/60 backdrop-blur-md border border-white/10 shadow-lg shadow-black/40">
            <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
              <span>Thực thu ({stats.completedDays} ngày)</span>
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.5} />
            </div>
            <div
              className={`text-base sm:text-lg font-black ${
                stats.totalNetEarned >= 0 ? 'text-amber-400' : 'text-rose-400'
              }`}
            >
              {stats.totalNetEarned >= 0 ? '+' : ''}
              {stats.totalNetEarned.toLocaleString('vi-VN')} đ
            </div>
            <div className="text-[10px] text-zinc-400 mt-1">
              Trung bình: {stats.averageDailyNet >= 0 ? '+' : ''}
              {stats.averageDailyNet.toLocaleString('vi-VN')} đ/ngày
            </div>
          </div>

          {/* Card 3: Mục tiêu (15tr + Nợ & Tiền nhà chưa trả) */}
          <div
            onClick={() => setIsDebtModalOpen(true)}
            className="group cursor-pointer p-3 sm:p-3.5 rounded-2xl bg-zinc-900/60 backdrop-blur-md border border-white/10 hover:border-rose-500/40 shadow-lg shadow-black/40 transition"
          >
            <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
              <span>Mục tiêu ({settings.targetCash / 1000000}tr + Nợ)</span>
              <Target className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition" strokeWidth={1.5} />
            </div>
            <div className="text-base sm:text-lg font-black text-white">
              {stats.remainingToTarget === 0 ? (
                <span className="text-emerald-400">Đã đủ hết! 🎉</span>
              ) : (
                <span>Thiếu {stats.remainingToTarget.toLocaleString('vi-VN')} đ</span>
              )}
            </div>
            <div className="text-[10px] text-zinc-400 mt-1 flex justify-between items-center gap-1">
              <span className="truncate">
                Nợ+Xe: {(stats.unpaidObligationsTotal / 1000000).toFixed(2)}tr
              </span>
              <span className="text-purple-400 font-semibold group-hover:underline shrink-0">
                Tick ✓
              </span>
            </div>
          </div>

          {/* Card 4: Cần thực thu / ngày */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-br from-zinc-900/90 to-zinc-900/50 backdrop-blur-md border border-emerald-500/30 shadow-lg shadow-emerald-950/20">
            <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
              <span className="font-semibold text-emerald-400">Cần thực thu</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-mono border border-emerald-500/30">
                {stats.unenteredDaysCount} ngày còn
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-base sm:text-xl font-black text-emerald-400 tracking-tight">
                {dynamicDailyKpi.toLocaleString('vi-VN')} đ
              </span>
              <span className="text-[11px] text-zinc-400 font-normal">/ngày</span>
            </div>
            <div className="text-[10px] text-zinc-400 mt-1 flex items-center justify-between gap-1">
              <span>~{dynamicHoursPerDay}h/ngày</span>
              {debtAnalysis.minDebtDailyKpi > 0 ? (
                <span
                  className={`font-semibold truncate ${
                    debtAnalysis.severity === 'danger' ? 'text-rose-400' : 'text-amber-400'
                  }`}
                  title="KPI tối thiểu chỉ để kịp trả nợ đúng hạn"
                >
                  Nợ min: {Math.round(debtAnalysis.minDebtDailyKpi / 1000)}k
                </span>
              ) : (
                <span className="font-semibold text-emerald-400">✓ Đủ trả nợ</span>
              )}
            </div>
          </div>
        </div>

        {/* Early-Warning Minimum Debt KPI & Cashflow Bottleneck Radar */}
        <DebtAlertBanner
          analysis={debtAnalysis}
          onOpenChecklist={() => setIsDebtModalOpen(true)}
        />

        {/* Dynamic Balance Advice Pill */}
        <div className="px-4 py-2.5 rounded-xl bg-zinc-900/50 backdrop-blur-md border border-white/10 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-zinc-300">
              {stats.remainingToTarget === 0 ? (
                <>Chúc mừng! Số dư 3 ví đã vượt mục tiêu <b className="text-emerald-400">{settings.targetCash / 1000000} triệu</b> trước Tết! 🎉</>
              ) : kpiDiffFromBaseline <= 0 ? (
                <>Bạn đang <b>đi đúng hoặc vượt tiến độ</b>! Chỉ cần thực thu <b className="text-emerald-400">{dynamicDailyKpi.toLocaleString('vi-VN')} đ/ngày</b> cho {stats.unenteredDaysCount} ngày còn lại là chạm mốc {settings.targetCash / 1000000} triệu.</>
              ) : (
                <>Cần thực thu <b className="text-amber-400">{dynamicDailyKpi.toLocaleString('vi-VN')} đ/ngày</b> trong {stats.unenteredDaysCount} ngày còn lại để gom đủ {settings.targetCash / 1000000} triệu trước Tết.</>
              )}
            </span>
          </div>
          <span className="text-[11px] text-zinc-400 whitespace-nowrap shrink-0">
            Đạt mục tiêu {stats.daysAchieved}/{stats.completedDays} ngày
          </span>
        </div>

        {/* Month Filter Selector */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'Tất cả (75 ngày)' },
              { id: '11', label: 'Tháng 11' },
              { id: '12', label: 'Tháng 12' },
              { id: '1', label: 'Tháng 01' },
              { id: '2', label: 'Tháng 02' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedMonth(tab.id as 'all' | '11' | '12' | '1' | '2')}
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
            Bấm vào từng ô để nhập thực thu hằng ngày
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
        Kế hoạch tích lũy Tết • Theo dõi 3 ví & thực thu hằng ngày
      </footer>

      {/* Modals */}
      <DayModal
        isOpen={isDayModalOpen}
        day={selectedDay}
        currentWallets={settings.wallets || DEFAULT_SETTINGS.wallets}
        hourlyRate={settings.hourlyRate}
        onClose={() => setIsDayModalOpen(false)}
        onSave={handleSaveDay}
        onClear={handleClearDay}
      />

      <DebtListModal
        isOpen={isDebtModalOpen}
        onClose={() => setIsDebtModalOpen(false)}
        checklist={schedules}
        remainingBikeTotal={stats.remainingBikeTotal}
        remainingHighBikeDays={stats.remainingHighBikeDays}
        remainingLowBikeDays={stats.remainingLowBikeDays}
        onUpdateChecklist={handleUpdateChecklist}
      />

      <WalletSettingsModal
        isOpen={isSettingsModalOpen}
        settings={settings}
        days={calculatedDays}
        onClose={() => setIsSettingsModalOpen(false)}
        onSave={handleSaveSettings}
      />

      <CloudSyncModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
        days={days}
        settings={settings}
        schedules={schedules}
        onApplyCloudData={(newDays, newSettings, newSchedules) => {
          const cleanDays = migrateDaysToCorrectYear(newDays);
          const cleanChecklist = normalizeDebtChecklist(newSchedules);
          setDays(cleanDays);
          setSettings(newSettings);
          setSchedules(cleanChecklist);
          setSyncStatus('synced');
          setLastSyncedAt(new Date());
          broadcastToCloud(cleanDays, newSettings, cleanChecklist);
        }}
        syncStatus={syncStatus}
        lastSyncedAt={lastSyncedAt}
      />
    </div>
  );
};

export default App;
