import React, { useState, useEffect } from 'react';
import type { DayCalculated, WalletBreakdown } from '../types/finance';
import { soundFx } from '../utils/sound';
import { Calculator, Check, Plus, Minus } from 'lucide-react';

interface DayModalProps {
  isOpen: boolean;
  onClose: () => void;
  day: DayCalculated | null;
  currentWallets: WalletBreakdown;
  hourlyRate?: number;
  onSave: (
    dayId: number,
    hours: number,
    netEarned: number,
    walletUpdate?: {
      bank: number;
      app: number;
      cash: number;
    }
  ) => void;
  onClear: (dayId: number) => void;
}

const PRESET_NET_AMOUNTS = [100000, 150000, 200000, 300000, 400000];

export const DayModal: React.FC<DayModalProps> = ({
  isOpen,
  onClose,
  day,
  currentWallets,
  hourlyRate = 65000,
  onSave,
  onClear
}) => {
  const [isNegative, setIsNegative] = useState<boolean>(false);
  const [amountAbs, setAmountAbs] = useState<string>('');
  const [hours, setHours] = useState<string>('');

  // Optional calculator: derive Thực thu directly from new 3-wallet balances
  const [showWalletCalc, setShowWalletCalc] = useState<boolean>(false);
  const [calcBank, setCalcBank] = useState<string>('');
  const [calcApp, setCalcApp] = useState<string>('');
  const [calcCash, setCalcCash] = useState<string>('');
  const [walletChanged, setWalletChanged] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && day) {
      if (day.actualEarnings !== null) {
        setIsNegative(day.actualEarnings < 0);
        setAmountAbs(String(Math.abs(day.actualEarnings)));
      } else {
        setIsNegative(false);
        setAmountAbs('');
      }
      setHours(day.hoursWorked !== null && day.hoursWorked > 0 ? String(day.hoursWorked) : '');
      setShowWalletCalc(false);
      setCalcBank(String(currentWallets.bank || 0));
      setCalcApp(String(currentWallets.app || 0));
      setCalcCash(String(currentWallets.cash || 0));
      setWalletChanged(false);
    }
  }, [isOpen, day, currentWallets]);

  if (!isOpen || !day) return null;

  const parsedAbs = parseInt(amountAbs.replace(/\D/g, ''), 10) || 0;
  const signedNet = isNegative ? -parsedAbs : parsedAbs;

  const prevWalletTotal =
    (currentWallets.bank || 0) +
    (currentWallets.app || 0) +
    (currentWallets.cash || 0);

  const parsedCalcBank = parseInt(calcBank.replace(/\D/g, ''), 10) || 0;
  const parsedCalcApp = parseInt(calcApp.replace(/\D/g, ''), 10) || 0;
  const parsedCalcCash = parseInt(calcCash.replace(/\D/g, ''), 10) || 0;
  const calcNewTotal = parsedCalcBank + parsedCalcApp + parsedCalcCash;
  const walletDiff = calcNewTotal - prevWalletTotal;

  const targetKpi = day.dynamicKpiTarget || day.kpiTarget;

  const handleApplyWalletDiff = () => {
    setIsNegative(walletDiff < 0);
    setAmountAbs(String(Math.abs(walletDiff)));
    setWalletChanged(true);
    setShowWalletCalc(false);
    soundFx.playCoinSound();
  };

  const handlePreset = (val: number) => {
    setIsNegative(false);
    setAmountAbs(String(val));
    if (hourlyRate > 0) {
      setHours(String(Math.round((val / hourlyRate) * 10) / 10));
    }
    soundFx.playCoinSound();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const h = parseFloat(hours) || 0;
    const shouldUpdateWallets =
      walletChanged ||
      (showWalletCalc &&
        (parsedCalcBank !== (currentWallets.bank || 0) ||
          parsedCalcApp !== (currentWallets.app || 0) ||
          parsedCalcCash !== (currentWallets.cash || 0)));

    onSave(
      day.id,
      h,
      signedNet,
      shouldUpdateWallets
        ? {
            bank: parsedCalcBank,
            app: parsedCalcApp,
            cash: parsedCalcCash
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
              Ngày {day.id}/75 • Cần thực thu:{' '}
              <span className="text-emerald-400 font-semibold">
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
        <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
          {/* Section 1: Net Change (Thực thu) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-zinc-200">
                Thực thu hôm nay (thay đổi số dư ví)
              </label>
              <button
                type="button"
                onClick={() => setShowWalletCalc(!showWalletCalc)}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition"
              >
                <Calculator className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Tính từ 3 ví</span>
              </button>
            </div>

            {/* Optional 3-Wallet Diff Calculator */}
            {showWalletCalc && (
              <div className="p-3 bg-zinc-950 border border-amber-500/40 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-300">
                    Nhập số dư 3 ví mới:
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    Hiện tại: {prevWalletTotal.toLocaleString('vi-VN')} đ
                  </span>
                </div>
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
                <div className="flex items-center justify-between pt-1.5 border-t border-zinc-800">
                  <div className="text-[11px]">
                    <span className="text-zinc-400">Thực thu: </span>
                    <b className={walletDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {walletDiff >= 0 ? '+' : ''}
                      {walletDiff.toLocaleString('vi-VN')} đ
                    </b>
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyWalletDiff}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" strokeWidth={2} />
                    <span>Áp dụng</span>
                  </button>
                </div>
              </div>
            )}

            {/* Sign toggle + Amount Input */}
            <div className="flex items-center gap-2">
              <div className="flex rounded-xl overflow-hidden border border-zinc-700 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsNegative(false)}
                  title="Tăng (+)"
                  className={`px-2.5 py-2.5 flex items-center justify-center transition ${
                    !isNegative
                      ? 'bg-emerald-500 text-zinc-950 font-bold'
                      : 'bg-zinc-950 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Plus className="w-4 h-4" strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsNegative(true)}
                  title="Giảm (-)"
                  className={`px-2.5 py-2.5 flex items-center justify-center transition ${
                    isNegative
                      ? 'bg-rose-500 text-white font-bold'
                      : 'bg-zinc-950 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Minus className="w-4 h-4" strokeWidth={2} />
                </button>
              </div>

              <div className="relative flex-1">
                <input
                  type="text"
                  autoFocus
                  value={amountAbs ? parsedAbs.toLocaleString('vi-VN') : ''}
                  onChange={(e) => setAmountAbs(e.target.value.replace(/\D/g, ''))}
                  placeholder="VD: 200.000"
                  className={`w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-base sm:text-lg font-black focus:outline-none ${
                    isNegative
                      ? 'text-rose-400 focus:border-rose-500'
                      : 'text-emerald-400 focus:border-emerald-500'
                  }`}
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-zinc-400">VNĐ</span>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="grid grid-cols-5 gap-1 pt-0.5">
              {PRESET_NET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handlePreset(amt)}
                  className={`py-1 text-[11px] font-semibold rounded-lg border transition ${
                    !isNegative && parsedAbs === amt
                      ? 'bg-emerald-500 text-zinc-950 border-emerald-400 font-bold'
                      : 'bg-zinc-800/80 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                  }`}
                >
                  +{amt / 1000}k
                </button>
              ))}
            </div>

            {walletChanged && (
              <p className="text-[11px] text-emerald-400">
                ✓ Sẽ tự động cập nhật tổng 3 ví thành <b>{calcNewTotal.toLocaleString('vi-VN')} đ</b> khi lưu.
              </p>
            )}
          </div>

          {/* Section 2: Optional Hours */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Số giờ làm / chạy xe (tùy chọn)
            </label>
            <input
              type="number"
              step="0.5"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="VD: 6"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs sm:text-sm transition shadow-lg shadow-emerald-950/40"
            >
              Lưu Thực Thu ({signedNet >= 0 ? '+' : ''}
              {signedNet.toLocaleString('vi-VN')} đ)
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
