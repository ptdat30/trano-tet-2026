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
  actualLivingExpense: number | null; // User custom daily spent (food, personal, etc.). Defaults to foodCost (75k) if null
  otherIncome: number;
  otherIncomeLabel?: string;
  foodCost: number; // baseline 75000
  bikeCost: number; // 127000 or 77000
  rentCost: number;
  debtPayment: number;
  debtLabel?: string;
}

export interface DayCalculated extends DayData {
  effectiveLivingExpense: number;
  totalExpense: number;
  netIncome: number;
  runningBalance: number;
  kpiDiff: number | null;
  isKpiAchieved: boolean;
  dynamicKpiTarget: number;
}

export interface FinanceSettings {
  initialCash: number; // default 1,000,000
  targetCash: number; // default 15,000,000
  hourlyRate: number; // default 65,000
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
