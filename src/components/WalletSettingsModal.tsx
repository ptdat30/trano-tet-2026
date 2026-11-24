import React, { useState, useEffect } from 'react';
import type { FinanceSettings } from '../types/finance';
import { Wallet, RotateCcw } from 'lucide-react';
import { DEFAULT_SETTINGS } from '../data/calendarData';

interface WalletSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: FinanceSettings;
  onSave: (newSettings: FinanceSettings) => void;
}

export const WalletSettingsModal: React.FC<WalletSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave
}) => {
  if (!isOpen) return null;

  const [initialCash, setInitialCash] = useState<string>(String(settings.initialCash));
  const [targetCash, setTargetCash] = useState<string>(String(settings.targetCash));
  const [hourlyRate, setHourlyRate] = useState<string>(String(settings.hourlyRate));

  useEffect(() => {
    setInitialCash(String(settings.initialCash));
    setTargetCash(String(settings.targetCash));
    setHourlyRate(String(settings.hourlyRate));
  }, [settings]);

  const parsedInitial = parseInt(initialCash.replace(/\D/g, ''), 10) || 0;
  const parsedTarget = parseInt(targetCash.replace(/\D/g, ''), 10) || 0;
  const parsedRate = parseInt(hourlyRate.replace(/\D/g, ''), 10) || 65000;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      initialCash: parsedInitial,
      targetCash: parsedTarget,
      hourlyRate: parsedRate
    });
    onClose();
  };

  const handleResetDefaults = () => {
    setInitialCash(String(DEFAULT_SETTINGS.initialCash));
    setTargetCash(String(DEFAULT_SETTINGS.targetCash));
    setHourlyRate(String(DEFAULT_SETTINGS.hourlyRate));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Wallet className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white">
              Cài Đặt Ví & Mục Tiêu
            </h3>
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
          {/* Field 1: Initial Cash */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Số dư ví ban đầu (ngày 24/11)
            </label>
            <div className="relative">
              <input
                type="text"
                value={initialCash ? parsedInitial.toLocaleString('vi-VN') : ''}
                onChange={(e) => setInitialCash(e.target.value.replace(/\D/g, ''))}
                placeholder="1.000.000"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
              />
              <span className="absolute right-3.5 top-2.5 text-xs text-zinc-400">VNĐ</span>
            </div>
            <p className="text-[10px] text-zinc-400 mt-1">
              Ví tiền mặt hoặc tài khoản ngân hàng lúc bắt đầu kế hoạch.
            </p>
          </div>

          {/* Field 2: Target Cash */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Mục tiêu số dư cuối chặng (06/02/2026)
            </label>
            <div className="relative">
              <input
                type="text"
                value={targetCash ? parsedTarget.toLocaleString('vi-VN') : ''}
                onChange={(e) => setTargetCash(e.target.value.replace(/\D/g, ''))}
                placeholder="15.000.000"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm font-bold text-amber-400 focus:outline-none focus:border-amber-500"
              />
              <span className="absolute right-3.5 top-2.5 text-xs text-zinc-400">VNĐ</span>
            </div>
            <p className="text-[10px] text-zinc-400 mt-1">
              Mặc định: 15 triệu (gồm 5tr biếu mẹ + 10tr phòng thân ăn Tết).
            </p>
          </div>

          {/* Field 3: Hourly Rate */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Thu nhập chạy xe ước tính / 1 giờ
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
            <p className="text-[10px] text-zinc-400 mt-1">
              Dùng để tính số giờ xe cần chạy mỗi ngày theo KPI.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs sm:text-sm transition"
            >
              Lưu Cài Đặt
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
