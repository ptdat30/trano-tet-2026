import React, { useState } from 'react';
import type { FixedScheduleItem } from '../types/finance';
import { soundFx } from '../utils/sound';
import {
  CheckCircle2,
  Circle,
  CreditCard,
  Home,
  Plus,
  Trash2,
  Info,
  RotateCcw,
  Bike
} from 'lucide-react';
import { INITIAL_DEBT_CHECKLIST } from '../data/calendarData';

interface DebtListModalProps {
  isOpen: boolean;
  onClose: () => void;
  checklist: FixedScheduleItem[];
  remainingBikeTotal: number;
  remainingHighBikeDays: number;
  remainingLowBikeDays: number;
  onUpdateChecklist: (updated: FixedScheduleItem[]) => void;
}

export const DebtListModal: React.FC<DebtListModalProps> = ({
  isOpen,
  onClose,
  checklist,
  remainingBikeTotal,
  remainingHighBikeDays,
  remainingLowBikeDays,
  onUpdateChecklist
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDate, setNewDate] = useState('2026-12-15');
  const [newType, setNewType] = useState<'debt' | 'rent'>('debt');

  if (!isOpen) return null;

  const sorted = [...checklist].sort((a, b) => a.dateStr.localeCompare(b.dateStr));
  const unpaidItems = sorted.filter((it) => !it.isPaid);
  const paidItems = sorted.filter((it) => it.isPaid);

  const totalAll = sorted.reduce((sum, it) => sum + it.amount, 0);
  const totalUnpaidChecklist = unpaidItems.reduce((sum, it) => sum + it.amount, 0);
  const totalUnpaidWithBike = totalUnpaidChecklist + remainingBikeTotal;
  const totalPaid = paidItems.reduce((sum, it) => sum + it.amount, 0);
  const progressPct = totalAll > 0 ? Math.round((totalPaid / totalAll) * 100) : 100;

  const handleTogglePaid = (id: string) => {
    const updated = checklist.map((item) =>
      item.id === id ? { ...item, isPaid: !item.isPaid } : item
    );
    soundFx.playCoinSound();
    onUpdateChecklist(updated);
  };

  const handleDelete = (id: string) => {
    const updated = checklist.filter((item) => item.id !== id);
    onUpdateChecklist(updated);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(newAmount.replace(/\D/g, ''), 10) || 0;
    if (!newName.trim() || amt <= 0) return;

    const newItem: FixedScheduleItem = {
      id: `custom-${Date.now()}`,
      dateStr: newDate,
      type: newType,
      name: newName.trim(),
      amount: amt,
      isPaid: false
    };

    onUpdateChecklist([...checklist, newItem]);
    setNewName('');
    setNewAmount('');
    setIsAdding(false);
    soundFx.playCoinSound();
  };

  const handleResetDefault = () => {
    onUpdateChecklist(INITIAL_DEBT_CHECKLIST);
  };

  const formatDateShort = (dateStr: string): string => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}`;
  };

  // Group items by YYYY-MM
  const grouped = sorted.reduce<Record<string, FixedScheduleItem[]>>((acc, item) => {
    const monthKey = item.dateStr.slice(0, 7);
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(item);
    return acc;
  }, {});

  const monthLabels: Record<string, string> = {
    '2026-11': 'Tháng 11 / 2026',
    '2026-12': 'Tháng 12 / 2026',
    '2027-01': 'Tháng 01 / 2027',
    '2027-02': 'Tháng 02 / 2027 (Tất toán trước Tết)'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-2xl text-zinc-100 max-h-[90vh] flex flex-col my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/30">
              <CreditCard className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                Checklist Nợ & Tiền Nhà ({paidItems.length}/{sorted.length} đã trả)
              </h3>
              <p className="text-[11px] text-zinc-400">
                Tick ✓ khi đã thanh toán • Phần chưa trả tự cộng vào Mục tiêu 15tr để chia KPI
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

        {/* Summary Stats Bar */}
        <div className="mt-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-zinc-400 block">
                Tổng còn phải trả (Nợ + Nhà + Góp xe):
              </span>
              <span className="text-sm sm:text-base font-black text-rose-400">
                {totalUnpaidWithBike.toLocaleString('vi-VN')} đ
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-zinc-400 block">Đã tick trả ({paidItems.length}/{sorted.length}):</span>
              <span className="text-sm sm:text-base font-black text-emerald-400">
                {totalPaid.toLocaleString('vi-VN')} đ
              </span>
            </div>
          </div>

          {/* Remaining Bike Installment Auto Row */}
          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
              <Bike className="w-3.5 h-3.5 text-amber-400 shrink-0" strokeWidth={1.5} />
              <span>
                Góp xe còn lại ({remainingHighBikeDays}d×127k + {remainingLowBikeDays}d×77k):
              </span>
            </div>
            <span className="font-black text-amber-400">
              {remainingBikeTotal.toLocaleString('vi-VN')} đ
            </span>
          </div>

          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Clarification Banner */}
        <div className="mt-2.5 px-3 py-2 rounded-xl bg-sky-950/35 border border-sky-500/25 text-[11px] text-sky-200 flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" strokeWidth={1.5} />
          <span>
            Khi trả xong 1 khoản, hãy <b>tick ✓ Đã trả</b> ở đây và <b>cập nhật lại số dư 3 ví thật</b> — hệ thống không bao giờ tự trừ ví để tránh lệch số liệu.
          </span>
        </div>

        {/* Checklist Items Grouped by Month */}
        <div className="overflow-y-auto mt-3 space-y-4 pr-1 flex-1">
          {Object.entries(grouped).map(([monthKey, items]) => {
            const monthUnpaid = items
              .filter((i) => !i.isPaid)
              .reduce((s, i) => s + i.amount, 0);

            return (
              <div key={monthKey} className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    {monthLabels[monthKey] || monthKey}
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    Còn: <b className="text-rose-300">{monthUnpaid.toLocaleString('vi-VN')} đ</b>
                  </span>
                </div>

                {items.map((item) => {
                  const isRent = item.type === 'rent';
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border transition ${
                        item.isPaid
                          ? 'bg-emerald-950/20 border-emerald-500/25 opacity-70'
                          : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleTogglePaid(item.id)}
                        className="flex items-center gap-2.5 flex-1 text-left min-w-0"
                      >
                        {item.isPaid ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" strokeWidth={1.75} />
                        ) : (
                          <Circle className="w-5 h-5 text-zinc-500 hover:text-emerald-400 shrink-0" strokeWidth={1.5} />
                        )}

                        <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800 shrink-0">
                          {formatDateShort(item.dateStr)}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            {isRent && (
                              <Home className="w-3 h-3 text-purple-400 shrink-0" strokeWidth={1.5} />
                            )}
                            <span
                              className={`text-xs font-bold truncate ${
                                item.isPaid ? 'line-through text-zinc-400' : 'text-zinc-100'
                              }`}
                            >
                              {item.name}
                            </span>
                          </div>
                          {item.description && (
                            <span className="text-[10px] text-zinc-500 block truncate">
                              {item.description}
                            </span>
                          )}
                        </div>
                      </button>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-xs font-black ${
                            item.isPaid
                              ? 'text-emerald-400 line-through'
                              : isRent
                              ? 'text-purple-300'
                              : 'text-rose-400'
                          }`}
                        >
                          {item.amount.toLocaleString('vi-VN')} đ
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          title="Xóa khoản này"
                          className="p-1 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Add New Debt / Rent Form */}
          {isAdding ? (
            <form
              onSubmit={handleAddItem}
              className="p-3 rounded-xl bg-zinc-950 border border-emerald-500/40 space-y-2.5 text-xs"
            >
              <div className="font-bold text-emerald-400">Thêm khoản nợ / tiền nhà mới</div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Tên khoản (VD: Trả bạn...)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  placeholder="Số tiền (VD: 500000)"
                  value={newAmount ? (parseInt(newAmount.replace(/\D/g, ''), 10) || 0).toLocaleString('vi-VN') : ''}
                  onChange={(e) => setNewAmount(e.target.value.replace(/\D/g, ''))}
                  className="bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-rose-300 font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200"
                />
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as 'debt' | 'rent')}
                  className="bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200"
                >
                  <option value="debt">Khoản nợ</option>
                  <option value="rent">Tiền nhà</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold"
                >
                  Thêm vào Checklist
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                >
                  Hủy
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="w-full py-2 rounded-xl border border-dashed border-zinc-700 hover:border-emerald-500/50 text-xs font-semibold text-zinc-400 hover:text-emerald-300 flex items-center justify-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Thêm khoản nợ hoặc tiền nhà mới</span>
            </button>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs sm:text-sm font-bold transition"
          >
            Xong
          </button>
          <button
            type="button"
            onClick={handleResetDefault}
            title="Khôi phục danh sách 16 khoản nợ & tiền nhà chuẩn"
            className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 border border-zinc-700 transition"
          >
            <RotateCcw className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
};
