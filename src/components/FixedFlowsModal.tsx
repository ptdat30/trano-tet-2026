import React, { useState } from 'react';
import type { FixedScheduleItem } from '../types/finance';
import { Calendar, DollarSign, Plus, Trash2, Edit2, Check, X, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

interface FixedFlowsModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedules: FixedScheduleItem[];
  defaultFoodCost: number;
  highBikeCost: number;
  lowBikeCost: number;
  onSaveSchedules: (
    updatedSchedules: FixedScheduleItem[],
    foodCost: number,
    highBike: number,
    lowBike: number
  ) => void;
}

export const FixedFlowsModal: React.FC<FixedFlowsModalProps> = ({
  isOpen,
  onClose,
  schedules,
  defaultFoodCost,
  highBikeCost,
  lowBikeCost,
  onSaveSchedules,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'incomes' | 'debts' | 'daily'>('incomes');
  const [items, setItems] = useState<FixedScheduleItem[]>(() => [...schedules]);
  const [foodCostVal, setFoodCostVal] = useState<string>(String(defaultFoodCost));
  const [highBikeVal, setHighBikeVal] = useState<string>(String(highBikeCost));
  const [lowBikeVal, setLowBikeVal] = useState<string>(String(lowBikeCost));

  // Edit inline state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');

  // Add new state
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDate, setNewDate] = useState('2026-12-01');
  const [newType, setNewType] = useState<'income' | 'debt' | 'rent'>('income');

  const incomes = items.filter((it) => it.type === 'income');
  const debtsAndRent = items.filter((it) => it.type === 'debt' || it.type === 'rent');

  const startEdit = (item: FixedScheduleItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditAmount(String(item.amount));
    setEditDate(item.dateStr);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = (id: string) => {
    const amt = parseInt(editAmount.replace(/\D/g, ''), 10) || 0;
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? { ...it, name: editName.trim() || it.name, amount: amt, dateStr: editDate }
          : it
      )
    );
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleAddNew = () => {
    const amt = parseInt(newAmount.replace(/\D/g, ''), 10) || 0;
    if (!newName.trim() || amt <= 0) return;

    const newItem: FixedScheduleItem = {
      id: `custom-${Date.now()}`,
      dateStr: newDate,
      type: newType,
      name: newName.trim(),
      amount: amt
    };

    setItems((prev) => [...prev, newItem]);
    setIsAdding(false);
    setNewName('');
    setNewAmount('');
  };

  const handleSaveAll = () => {
    const food = parseInt(foodCostVal.replace(/\D/g, ''), 10) || 75000;
    const highB = parseInt(highBikeVal.replace(/\D/g, ''), 10) || 127000;
    const lowB = parseInt(lowBikeVal.replace(/\D/g, ''), 10) || 77000;

    onSaveSchedules(items, food, highB, lowB);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-2xl text-zinc-100 max-h-[90vh] flex flex-col my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" strokeWidth={1.5} />
              <span>Dự Tính Thu & Chi Cố Định (Tính KPI)</span>
            </h3>
            <p className="text-[11px] text-zinc-400">
              Chỉ dùng làm ghi chú & tính KPI mục tiêu mỗi ngày • Không tự động trừ vào số dư 3 ví
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 text-sm rounded-lg hover:bg-zinc-800"
          >
            ✕
          </button>
        </div>

        {/* Clarification Banner */}
        <div className="mt-2.5 px-3 py-2 rounded-xl bg-sky-950/40 border border-sky-500/30 text-[11px] text-sky-200 leading-relaxed">
          💡 <b>Lưu ý:</b> Toàn bộ các khoản ở đây đều là <b>dự tính (Note)</b> để hệ thống chia ra <b>KPI chạy xe hằng ngày</b> cho các ngày còn lại. Hệ thống <b>không bao giờ tự cộng hay tự trừ</b> vào số dư 3 ví thực tế của bạn.
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1.5 pt-3 pb-2 border-b border-zinc-800/80">
          <button
            onClick={() => setActiveTab('incomes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'incomes'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ArrowDownCircle className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.5} />
            <span>Thu Cố Định ({incomes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('debts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'debts'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ArrowUpCircle className="w-3.5 h-3.5 text-rose-400" strokeWidth={1.5} />
            <span>Trả Nợ & Tiền Nhà ({debtsAndRent.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('daily')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'daily'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.5} />
            <span>Chi Phí Hằng Ngày</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2 pr-1 min-h-[220px]">
          {/* TAB 1: INCOMES */}
          {activeTab === 'incomes' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1 text-xs text-zinc-400">
                <span>Danh sách các khoản thu dự kiến:</span>
                <button
                  onClick={() => {
                    setNewType('income');
                    setIsAdding(true);
                  }}
                  className="px-2 py-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-semibold flex items-center gap-1 border border-emerald-500/30"
                >
                  <Plus className="w-3 h-3" />
                  <span>Thêm khoản thu</span>
                </button>
              </div>

              {incomes.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs flex items-center justify-between gap-2"
                >
                  {editingId === item.id ? (
                    <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-200"
                      />
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-200"
                      />
                      <input
                        type="text"
                        value={editAmount ? parseInt(editAmount, 10).toLocaleString('vi-VN') : ''}
                        onChange={(e) => setEditAmount(e.target.value.replace(/\D/g, ''))}
                        className="w-28 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs font-bold text-emerald-400"
                      />
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => saveEdit(item.id)}
                          className="p-1.5 rounded-lg bg-emerald-500 text-zinc-950 font-bold hover:bg-emerald-400"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-zinc-400 text-[11px]">{item.dateStr}</span>
                          <span className="font-semibold text-white">{item.name}</span>
                        </div>
                        {item.description && (
                          <p className="text-[10px] text-zinc-400 mt-0.5">{item.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-emerald-400 text-sm">
                          +{item.amount.toLocaleString('vi-VN')} đ
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEdit(item)}
                            className="p-1 text-zinc-400 hover:text-zinc-200 rounded"
                            title="Sửa"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1 text-zinc-400 hover:text-rose-400 rounded"
                            title="Xóa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: DEBTS & RENT */}
          {activeTab === 'debts' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1 text-xs text-zinc-400">
                <span>Danh sách các kỳ trả nợ & tiền nhà:</span>
                <button
                  onClick={() => {
                    setNewType('debt');
                    setIsAdding(true);
                  }}
                  className="px-2 py-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] font-semibold flex items-center gap-1 border border-rose-500/30"
                >
                  <Plus className="w-3 h-3" />
                  <span>Thêm khoản nợ/chi</span>
                </button>
              </div>

              {debtsAndRent.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs flex items-center justify-between gap-2"
                >
                  {editingId === item.id ? (
                    <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-200"
                      />
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-200"
                      />
                      <input
                        type="text"
                        value={editAmount ? parseInt(editAmount, 10).toLocaleString('vi-VN') : ''}
                        onChange={(e) => setEditAmount(e.target.value.replace(/\D/g, ''))}
                        className="w-28 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs font-bold text-rose-400"
                      />
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => saveEdit(item.id)}
                          className="p-1.5 rounded-lg bg-rose-500 text-white font-bold hover:bg-rose-400"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-zinc-400 text-[11px]">{item.dateStr}</span>
                          <span className="font-semibold text-white">{item.name}</span>
                          {item.type === 'rent' && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                              Tiền nhà
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-[10px] text-zinc-400 mt-0.5">{item.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-rose-400 text-sm">
                          -{item.amount.toLocaleString('vi-VN')} đ
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEdit(item)}
                            className="p-1 text-zinc-400 hover:text-zinc-200 rounded"
                            title="Sửa"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1 text-zinc-400 hover:text-rose-400 rounded"
                            title="Xóa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: DAILY BASELINES */}
          {activeTab === 'daily' && (
            <div className="space-y-3 p-1">
              {/* Daily Food */}
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  1. Tiền ăn uống / sinh hoạt tối thiểu hằng ngày (mặc định)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={foodCostVal ? parseInt(foodCostVal, 10).toLocaleString('vi-VN') : ''}
                    onChange={(e) => setFoodCostVal(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm font-bold text-amber-300 focus:outline-none focus:border-amber-500"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-zinc-400">đ/ngày</span>
                </div>
                <p className="text-[10px] text-zinc-400 mt-1">
                  Mặc định: 75.000 đ/ngày. Nếu từng ngày bạn tiêu khác mức này, có thể nhập trực tiếp vào ngày đó trên lịch.
                </p>
              </div>

              {/* Bike Cost High */}
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  2. Tiền trả góp xe giai đoạn 1 (từ 24/11 đến 11/12)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={highBikeVal ? parseInt(highBikeVal, 10).toLocaleString('vi-VN') : ''}
                    onChange={(e) => setHighBikeVal(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm font-bold text-white focus:outline-none focus:border-zinc-500"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-zinc-400">đ/ngày</span>
                </div>
                <p className="text-[10px] text-zinc-400 mt-1">
                  Mặc định: 127.000 đ/ngày.
                </p>
              </div>

              {/* Bike Cost Low */}
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  3. Tiền trả góp xe giai đoạn 2 (từ 12/12 đến Tết)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={lowBikeVal ? parseInt(lowBikeVal, 10).toLocaleString('vi-VN') : ''}
                    onChange={(e) => setLowBikeVal(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm font-bold text-white focus:outline-none focus:border-zinc-500"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-zinc-400">đ/ngày</span>
                </div>
                <p className="text-[10px] text-zinc-400 mt-1">
                  Mặc định: 77.000 đ/ngày sau khi hết gói góp xe cũ.
                </p>
              </div>
            </div>
          )}

          {/* Add New Popup */}
          {isAdding && (
            <div className="p-3 rounded-xl bg-zinc-800 border border-zinc-700 space-y-2 mt-2">
              <span className="text-xs font-bold text-white block">Thêm khoản thu / chi mới:</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-0.5">Loại:</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-200"
                  >
                    <option value="income">Thu nhập (tiền vào)</option>
                    <option value="debt">Trả nợ (tiền ra)</option>
                    <option value="rent">Tiền nhà (tiền ra)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-0.5">Ngày áp dụng:</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-0.5">Tên khoản:</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="VD: Thưởng Tết, Nợ bạn..."
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-0.5">Số tiền (VNĐ):</label>
                  <input
                    type="text"
                    value={newAmount ? parseInt(newAmount, 10).toLocaleString('vi-VN') : ''}
                    onChange={(e) => setNewAmount(e.target.value.replace(/\D/g, ''))}
                    placeholder="1.000.000"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs font-bold text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => setIsAdding(false)}
                  className="px-2.5 py-1 text-xs text-zinc-400 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddNew}
                  className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs"
                >
                  Xác nhận thêm
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-zinc-800 flex items-center gap-2">
          <button
            onClick={handleSaveAll}
            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs sm:text-sm transition shadow-lg shadow-emerald-950/40"
          >
            Lưu Toàn Bộ Thay Đổi & Cân Đối KPI
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
