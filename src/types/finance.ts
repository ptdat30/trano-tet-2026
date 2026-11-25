export interface WalletBreakdown {
  bank: number; // Ví tài khoản ngân hàng
  app: number;  // Ví app tài xế (Be, Grab, v.v.)
  cash: number; // Ví tiền mặt
}

export interface DayData {
  id: number; // 1 to 75
  year: number;
  month: number; // 11, 12, 1, 2
  day: number;
  dateStr: string; // "YYYY-MM-DD"
  weekdayName: string; // "T2", "T3", etc.
  weekdayFull: string; // "Thứ Hai", etc.
  kpiTarget: number; // baseline 390000
  actualEarnings: number | null;
  hoursWorked: number | null;
  actualLivingExpense: number | null; // User custom daily spent (food, personal, etc.). Defaults to foodCost if null
  otherIncome: number;
  otherIncomeLabel?: string;
  foodCost: number; // baseline 75000
  bikeCost: number; // 127000 or 77000
  rentCost: number;
  debtPayment: number;
  debtLabel?: string;
  isManualOverride?: boolean;
}

export interface DayCalculated extends DayData {
  effectiveLivingExpense: number;
  totalExpense: number;
  netIncome: number;
  runningBalance: number;
  kpiDiff: number | null;
  isKpiAchieved: boolean;
  dynamicKpiTarget: number;
  checklistItems?: FixedScheduleItem[];
}

export interface FinanceSettings {
  initialCash?: number; // Starting balance morning of Day 1 (default 1,000,000)
  wallets: WalletBreakdown;
  targetCash: number; // default 15,000,000
  hourlyRate: number; // default 65,000
  defaultFoodCost: number; // default 75,000
  highBikeCost: number; // default 127,000
  lowBikeCost: number; // default 77,000
}

export interface MonthBlock {
  year: number;
  month: number;
  label: string; // "Tháng 11/2025"
  days: (DayCalculated | null)[];
}

export interface DebtSummary {
  name: string;
  type: 'small' | 'large' | 'bike';
  dueDay: string;
  amount: number | string;
  plan: string;
}

export interface FixedScheduleItem {
  id: string;
  dateStr: string; // "YYYY-MM-DD"
  type: 'income' | 'debt' | 'rent';
  name: string;
  amount: number;
  description?: string;
  isPaid?: boolean;
}
