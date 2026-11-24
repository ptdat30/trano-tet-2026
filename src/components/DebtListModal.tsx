import React from 'react';
import { DEBT_LIST } from '../data/calendarData';

interface DebtListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DebtListModal: React.FC<DebtListModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const smallDebts = DEBT_LIST.filter((d) => d.type === 'small');
  const largeDebts = DEBT_LIST.filter((d) => d.type === 'large');
  const bike = DEBT_LIST.find((d) => d.type === 'bike');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl text-zinc-100 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <h3 className="text-base font-bold text-white">Danh Mục Các Khoản Nợ & Lộ Trình</h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 text-sm rounded-lg hover:bg-zinc-800"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto mt-4 space-y-4 pr-1">
          {/* Small Debts */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                1. Nợ Nhỏ — Xóa Sổ Trước Tết (Tổng: ~6.75 triệu)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Mục tiêu dứt điểm
              </span>
            </div>
            <div className="space-y-2">
              {smallDebts.map((item) => (
                <div key={item.name} className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
                  <div className="flex justify-between font-bold text-zinc-200">
                    <span>{item.name}</span>
                    <span className="text-emerald-400">{item.amount}</span>
                  </div>
                  <div className="text-zinc-400 mt-1">{item.plan}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Large Debts */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
                2. Nợ Lớn — Đóng Kỳ Đúng Hạn (Gốc dứt sau Tết)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30">
                Giữ sạch CIC
              </span>
            </div>
            <div className="space-y-2">
              {largeDebts.map((item) => (
                <div key={item.name} className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
                  <div className="flex justify-between font-bold text-zinc-200">
                    <span>{item.name}</span>
                    <span className="text-sky-300">{item.amount}</span>
                  </div>
                  <div className="text-zinc-400 mt-1">{item.plan}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Bike */}
          {bike && (
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs flex justify-between items-center">
              <div>
                <span className="font-bold text-amber-300">{bike.name}</span>
                <p className="text-zinc-400 mt-0.5">{bike.plan}</p>
              </div>
              <span className="font-bold text-zinc-200">{bike.amount}</span>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 transition"
        >
          Đóng
        </button>
      </div>
    </div>
  );
};
