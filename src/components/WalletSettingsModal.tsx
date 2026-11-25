import React, { useState, useEffect } from 'react';
import type { FinanceSettings, DayCalculated } from '../types/finance';
import {
  Wallet,
  Smartphone,
  Banknote,
  RotateCcw,
  Building2,
  CheckSquare,
  Square,
  NotebookPen
} from 'lucide-react';
import { DEFAULT_SETTINGS } from '../data/calendarData';

interface WalletSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: FinanceSettings;
  days: DayCalculated[];
  onSave: (
    newSettings: FinanceSettings,
    recordNet?: {
      dayId: number;
      netEarned: number;
      hours: number;
    }
  ) => void;
}

export const WalletSettingsModal: React.FC<WalletSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  days,
  onSave
}) => {
  const [bank, setBank] = useState<string>(String(settings.wallets?.bank ?? 1000000));
  const [app, setApp] = useState<string>(String(settings.wallets?.app ?? 0));
  const [cash, setCash] = useState<string>(String(settings.wallets?.cash ?? 0));
  const [targetCash, setTargetCash] = useState<string>(String(settings.targetCash ?? 15000000));
  const [hourlyRate, setHourlyRate] = useState<string>(String(settings.hourlyRate ?? 65000));

  // Optional: record wallet change directly as today's Thực thu
  const firstUnenteredDay = days.find((d) => d.actualEarnings === null) || days[0];
  const [selectedDayId, setSelectedDayId] = useState<number>(firstUnenteredDay ? firstUnenteredDay.id : 1);
  const [shouldRecordNet, setShouldRecordNet] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    setBank(String(settings.wallets?.bank ?? 0));
    setApp(String(settings.wallets?.app ?? 0));
    setCash(String(settings.wallets?.cash ?? 0));
    setTargetCash(String(settings.targetCash ?? 15000000));
    setHourlyRate(String(settings.hourlyRate ?? 65000));
    setShouldRecordNet(false);

    const unentered = days.find((d) => d.actualEarnings === null);
    if (unentered) {
      setSelectedDayId(unentered.id);
    }
  }, [isOpen, settings, days]);

  if (!isOpen) return null;

  const targetDay = days.find((d) => d.id === selectedDayId) || days[0];

  const parsedBank = parseInt(bank.replace(/\D/g, ''), 10) || 0;
  const parsedApp = parseInt(app.replace(/\D/g, ''), 10) || 0;
  const parsedCash = parseInt(cash.replace(/\D/g, ''), 10) || 0;
  const totalCurrent = parsedBank + parsedApp + parsedCash;

  const previousTotal =
    (settings.wallets?.bank || 0) +
    (settings.wallets?.app || 0) +
    (settings.wallets?.cash || 0);
  const balanceDiff = totalCurrent - previousTotal;

  const parsedTarget = parseInt(targetCash.replace(/\D/g, ''), 10) || 0;
  const parsedRate = parseInt(hourlyRate.replace(/\D/g, ''), 10) || 65000;
  const estimatedHours =
    balanceDiff > 0 && parsedRate > 0
      ? Math.round((balanceDiff / parsedRate) * 10) / 10
      : 0;

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
      shouldRecordNet && targetDay
        ? {
            dayId: targetDay.id,
            netEarned: balanceDiff,
            hours: estimatedHours
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
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-2xl text-zinc-100 max-h-[92vh] overflow-y-auto my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Wallet className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                Cập Nhật 3 Ví & Mục Tiêu
              </h3>
              <p className="text-[11px] text-zinc-400">
                Tổng 3 ví là số tiền thật hiện có • Tự chia số tiền cần kiếm cho các ngày còn lại
              </p>
            </div>
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
        <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
          {/* Section 1: 3 Wallets */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              1. Số Dư 3 Ví Hiện Tại
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
                  <span>Ví App tài xế</span>
                </label>
                <span className="text-[10px] text-zinc-400">Be / Grab / Shopee</span>
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

            {/* Live Total & Net Change Box */}
            <div className="p-3 rounded-xl bg-zinc-950 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-zinc-300 block">
                  Tổng 3 ví:{' '}
                  <span className="text-emerald-400 font-black text-sm">
                    {totalCurrent.toLocaleString('vi-VN')} đ
                  </span>
                </span>
                <span className="text-[10px] text-zinc-400">
                  Trước đó: {previousTotal.toLocaleString('vi-VN')} đ
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
                <span className="text-[10px] text-zinc-400 block">thực thu (chênh lệch)</span>
              </div>
            </div>
          </div>

          {/* Section 2: Optional Record Diff as Thực Thu on Calendar */}
          <div className="space-y-2.5 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setShouldRecordNet(!shouldRecordNet)}
              className="flex items-center gap-2 text-xs font-semibold text-zinc-200 hover:text-white cursor-pointer select-none w-full text-left"
            >
              {shouldRecordNet ? (
                <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={1.5} />
              ) : (
                <Square className="w-4 h-4 text-zinc-500 shrink-0" strokeWidth={1.5} />
              )}
              <NotebookPen className="w-3.5 h-3.5 text-emerald-400 shrink-0" strokeWidth={1.5} />
              <span>
                Ghi nhận chênh lệch{' '}
                <b className={balanceDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {balanceDiff >= 0 ? '+' : ''}
                  {balanceDiff.toLocaleString('vi-VN')} đ
                </b>{' '}
                làm Thực thu ngày trên lịch
              </span>
            </button>

            {shouldRecordNet && (
              <div className="p-3 rounded-xl bg-zinc-950 border border-emerald-500/30 flex items-center justify-between gap-2">
                <span className="text-[11px] text-zinc-400">Áp dụng cho ngày:</span>
                <select
                  value={selectedDayId}
                  onChange={(e) => setSelectedDayId(parseInt(e.target.value, 10))}
                  className="bg-zinc-900 border border-zinc-700 text-xs text-emerald-300 font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
                >
                  {days.map((d) => (
                    <option key={d.id} value={d.id}>
                      Ngày {d.day}/{d.month} ({d.weekdayName}) {d.actualEarnings !== null ? '✓ Đã chốt' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Section 3: Targets */}
          <div className="space-y-3 pt-3 border-t border-zinc-800">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
              2. Mục Tiêu Tích Lũy
            </span>

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
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Đơn giá ước tính / 1 giờ (để quy đổi giờ chạy)
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
          <div className="flex items-center gap-2 pt-3 border-t border-zinc-800">
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs sm:text-sm transition shadow-lg shadow-emerald-950/40"
            >
              Lưu 3 Ví ({totalCurrent.toLocaleString('vi-VN')} đ)
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
