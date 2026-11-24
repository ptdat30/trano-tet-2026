import type { DayData, DebtSummary, FinanceSettings, FixedScheduleItem } from '../types/finance';

export const INITIAL_CASH = 1000000;
export const TARGET_CASH = 15000000;
export const DAILY_KPI = 390000;

export const DEFAULT_SETTINGS: FinanceSettings = {
  initialCash: 1000000,
  wallets: {
    bank: 1000000,
    app: 0,
    cash: 0
  },
  targetCash: 15000000,
  hourlyRate: 65000,
  defaultFoodCost: 75000,
  highBikeCost: 127000,
  lowBikeCost: 77000
};

export const INITIAL_FIXED_SCHEDULES: FixedScheduleItem[] = [
  // Incomes
  { id: 'inc-1', dateStr: '2025-11-25', type: 'income', name: 'Mẹ cho + Ứng lương', amount: 4500000, description: '4tr mẹ cho + 500k ứng lương' },
  { id: 'inc-2', dateStr: '2025-12-10', type: 'income', name: 'Lương công ty', amount: 3000000, description: 'Tiền lương nhận ngày 10/12' },
  { id: 'inc-3', dateStr: '2025-12-25', type: 'income', name: 'Mẹ cho tiền ăn & nhà', amount: 4000000, description: 'Mẹ cho 4tr ngày 25 hàng tháng' },
  { id: 'inc-4', dateStr: '2026-01-25', type: 'income', name: 'Mẹ cho tiền ăn & nhà', amount: 4000000, description: 'Mẹ cho 4tr ngày 25 hàng tháng' },

  // Rents
  { id: 'rent-1', dateStr: '2025-11-25', type: 'rent', name: 'Tiền nhà tháng 11', amount: 1600000, description: 'Trích từ tiền mẹ cho' },
  { id: 'rent-2', dateStr: '2025-12-25', type: 'rent', name: 'Tiền nhà tháng 12', amount: 1600000, description: 'Trích từ tiền mẹ cho' },
  { id: 'rent-3', dateStr: '2026-01-25', type: 'rent', name: 'Tiền nhà tháng 1', amount: 1600000, description: 'Trích từ tiền mẹ cho' },

  // Debts
  { id: 'debt-1', dateStr: '2025-12-04', type: 'debt', name: 'Kredivo kỳ 1', amount: 560000, description: 'Kỳ tháng 12' },
  { id: 'debt-2', dateStr: '2025-12-07', type: 'debt', name: 'Vay nhanh MoMo', amount: 1158000, description: 'Kỳ tháng 12' },
  { id: 'debt-3', dateStr: '2025-12-10', type: 'debt', name: 'Home Credit', amount: 947000, description: 'Kỳ tháng 12' },
  { id: 'debt-4', dateStr: '2025-12-13', type: 'debt', name: 'Vay nhanh Zalo', amount: 575000, description: 'Kỳ tháng 12' },
  { id: 'debt-5', dateStr: '2025-12-22', type: 'debt', name: 'Vay nhanh Be kỳ 1', amount: 1140000, description: 'Bắt đầu kỳ 1 Be' },
  { id: 'debt-6', dateStr: '2026-01-04', type: 'debt', name: 'Kredivo kỳ 2', amount: 560000, description: 'Kỳ tháng 1' },
  { id: 'debt-7', dateStr: '2026-01-05', type: 'debt', name: 'Ví trả sau MoMo', amount: 968000, description: 'Kỳ tháng 1' },
  { id: 'debt-8', dateStr: '2026-01-07', type: 'debt', name: 'Vay nhanh MoMo', amount: 1158000, description: 'Kỳ tháng 1' },
  { id: 'debt-9', dateStr: '2026-01-10', type: 'debt', name: 'Home Credit', amount: 947000, description: 'Kỳ tháng 1' },
  { id: 'debt-10', dateStr: '2026-01-13', type: 'debt', name: 'Vay nhanh Zalo', amount: 575000, description: 'Kỳ tháng 1' },
  { id: 'debt-11', dateStr: '2026-01-22', type: 'debt', name: 'Vay nhanh Be kỳ 2', amount: 1140000, description: 'Kỳ 2 Be' },
  { id: 'debt-12', dateStr: '2026-02-01', type: 'debt', name: 'Tất toán Zalo', amount: 942000, description: 'Tất toán dứt điểm Zalo' },
  { id: 'debt-13', dateStr: '2026-02-04', type: 'debt', name: 'Tất toán Kredivo', amount: 561000, description: 'Tất toán dứt điểm Kredivo' },
  { id: 'debt-14', dateStr: '2026-02-05', type: 'debt', name: 'Tất toán MoMo', amount: 2008000, description: 'Tất toán dứt điểm ví trả sau MoMo' },
];

export const DEBT_LIST: DebtSummary[] = [
  { name: 'Kredivo', type: 'small', dueDay: 'Ngày 04', amount: '560.000 đ', plan: 'Trả 3 kỳ: 4/12, 4/1, 4/2 (Tất toán)' },
  { name: 'Vay nhanh Zalo', type: 'small', dueDay: 'Ngày 13', amount: '575.000 đ', plan: 'Trả 2 kỳ (13/12, 13/1) + Tất toán 942k ngày 01/02' },
  { name: 'Ví trả sau MoMo', type: 'small', dueDay: 'Ngày 05', amount: '520k - 968k', plan: 'Trả kỳ 5/1, 5/2 + Tất toán 2 kỳ cuối ngày 05/02' },
  { name: 'Vay nhanh Be (12 kỳ)', type: 'large', dueDay: 'Ngày 22', amount: '1.140.000 đ', plan: 'Kỳ 1 bắt đầu 22/12. Đóng kỳ 22/12 & 22/1. Gốc sau Tết' },
  { name: 'Vay nhanh MoMo', type: 'large', dueDay: 'Ngày 07', amount: '1.158.000 đ', plan: 'Đóng đủ 2 kỳ: 7/12 & 7/1. Gốc tất toán sau Tết' },
  { name: 'Home Credit', type: 'large', dueDay: 'Ngày 10', amount: '947.000 đ', plan: 'Đóng đủ 2 kỳ: 10/12 & 10/1. Gốc tất toán sau Tết' },
  { name: 'Trả góp xe máy', type: 'bike', dueDay: 'Hằng ngày', amount: '127k -> 77k', plan: '127k/ngày đến 11/12. Sau 11/12 còn 77k/ngày' },
];

export function buildInitialDays(): DayData[] {
  const days: DayData[] = [];
  const start = new Date(2025, 10, 24); // Nov 24, 2025
  const end = new Date(2026, 1, 6); // Feb 6, 2026

  const weekdayShort = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const weekdayFull = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

  let curr = new Date(start);
  let id = 1;

  while (curr <= end) {
    const y = curr.getFullYear();
    const m = curr.getMonth() + 1;
    const d = curr.getDate();
    const wIdx = curr.getDay();

    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    // Bike installment
    const isHighBike = (m === 11) || (m === 12 && d <= 11);
    const bikeCost = isHighBike ? 127000 : 77000;

    let otherIncome = 0;
    let otherIncomeLabel: string | undefined;
    let rentCost = 0;
    let debtPayment = 0;
    let debtLabel: string | undefined;

    // Monthly fixed incomes and rents
    if (m === 11 && d === 25) {
      otherIncome = 4500000;
      otherIncomeLabel = '+4.5tr (Mẹ+Ứng)';
      rentCost = 1600000;
    } else if (m === 12 && d === 10) {
      otherIncome = 3000000;
      otherIncomeLabel = '+3tr (Lương)';
    } else if (m === 12 && d === 25) {
      otherIncome = 4000000;
      otherIncomeLabel = '+4tr (Mẹ)';
      rentCost = 1600000;
    } else if (m === 1 && d === 25) {
      otherIncome = 4000000;
      otherIncomeLabel = '+4tr (Mẹ)';
      rentCost = 1600000;
    }

    // Debts
    if (m === 12 && d === 4) {
      debtPayment = 560000;
      debtLabel = 'Kredivo: 560k';
    } else if (m === 12 && d === 7) {
      debtPayment = 1158000;
      debtLabel = 'MoMo: 1.158k';
    } else if (m === 12 && d === 10) {
      debtPayment = 947000;
      debtLabel = 'Home: 947k';
    } else if (m === 12 && d === 13) {
      debtPayment = 575000;
      debtLabel = 'Zalo: 575k';
    } else if (m === 12 && d === 22) {
      debtPayment = 1140000;
      debtLabel = 'Be kỳ 1: 1.14tr';
    } else if (m === 1 && d === 4) {
      debtPayment = 560000;
      debtLabel = 'Kredivo: 560k';
    } else if (m === 1 && d === 5) {
      debtPayment = 968000;
      debtLabel = 'MoMo PL: 968k';
    } else if (m === 1 && d === 7) {
      debtPayment = 1158000;
      debtLabel = 'MoMo: 1.158k';
    } else if (m === 1 && d === 10) {
      debtPayment = 947000;
      debtLabel = 'Home: 947k';
    } else if (m === 1 && d === 13) {
      debtPayment = 575000;
      debtLabel = 'Zalo: 575k';
    } else if (m === 1 && d === 22) {
      debtPayment = 1140000;
      debtLabel = 'Be kỳ 2: 1.14tr';
    } else if (m === 2 && d === 1) {
      debtPayment = 942000;
      debtLabel = 'Tất toán Zalo: 942k';
    } else if (m === 2 && d === 4) {
      debtPayment = 561000;
      debtLabel = 'Tất toán Kredivo: 561k';
    } else if (m === 2 && d === 5) {
      debtPayment = 2008000;
      debtLabel = 'Tất toán MoMo: 2.008k';
    } else if (m === 2 && d === 6) {
      otherIncomeLabel = '🎯 ĐÍCH 15 TRIỆU';
    }

    days.push({
      id,
      year: y,
      month: m,
      day: d,
      dateStr,
      weekdayName: weekdayShort[wIdx],
      weekdayFull: weekdayFull[wIdx],
      kpiTarget: DAILY_KPI,
      actualEarnings: null,
      hoursWorked: null,
      actualLivingExpense: null,
      otherIncome,
      otherIncomeLabel,
      foodCost: 75000,
      bikeCost,
      rentCost,
      debtPayment,
      debtLabel,
    });

    curr.setDate(curr.getDate() + 1);
    id++;
  }

  return days;
}
