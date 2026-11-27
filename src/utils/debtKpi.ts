import type { DayData, FixedScheduleItem } from '../types/finance';

export interface DebtMilestone {
  dateStr: string;
  labelDate: string; // "DD/MM"
  itemsOnDate: FixedScheduleItem[];
  cumDebtAmount: number;
  cumBikeAmount: number;
  totalNeededByDate: number;
  daysAvailable: number;
  shortfall: number;
  surplus: number;
  minDailyKpi: number;
  isBottleneck: boolean;
  isClustered: boolean;
}

export interface DebtKpiAnalysis {
  minDebtDailyKpi: number;
  minDebtHoursPerDay: number;
  bottleneck: DebtMilestone | null;
  firstShortfall: DebtMilestone | null;
  milestones: DebtMilestone[];
  severity: 'safe' | 'watch' | 'warning' | 'danger';
  clusterCountNearBottleneck: number;
}

function formatDateDDMM(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}`;
}

function diffDaysBetween(dateStrA: string, dateStrB: string): number {
  const a = new Date(`${dateStrA}T00:00:00`).getTime();
  const b = new Date(`${dateStrB}T00:00:00`).getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

/**
 * Bottleneck Liquidity Engine:
 * Scans EVERY upcoming unpaid debt/rent due date chronologically and computes
 * the cumulative cash required (unpaid debts + rents + daily bike installments up to that date)
 * versus the user's current real 3-wallet balance.
 *
 * The maximum required daily earning across all upcoming milestones is the
 * "KPI Tối Thiểu Trả Nợ" — guaranteeing early warning for clustered consecutive debts!
 */
export function calculateDebtKpiAnalysis(
  days: DayData[],
  schedules: FixedScheduleItem[],
  currentWalletBalance: number,
  highBikeRate: number,
  lowBikeRate: number,
  hourlyRate: number
): DebtKpiAnalysis {
  const unpaidItems = schedules
    .filter((item) => !item.isPaid && (item.type === 'debt' || item.type === 'rent'))
    .sort((a, b) => a.dateStr.localeCompare(b.dateStr));

  const unenteredDays = days
    .filter((d) => d.actualEarnings === null)
    .sort((a, b) => a.dateStr.localeCompare(b.dateStr));

  if (unpaidItems.length === 0) {
    return {
      minDebtDailyKpi: 0,
      minDebtHoursPerDay: 0,
      bottleneck: null,
      firstShortfall: null,
      milestones: [],
      severity: 'safe',
      clusterCountNearBottleneck: 0
    };
  }

  // Group unpaid items by unique due dates
  const groupedByDate = new Map<string, FixedScheduleItem[]>();
  unpaidItems.forEach((item) => {
    const existing = groupedByDate.get(item.dateStr) || [];
    existing.push(item);
    groupedByDate.set(item.dateStr, existing);
  });

  const uniqueDates = Array.from(groupedByDate.keys()).sort((a, b) => a.localeCompare(b));

  let cumDebtAmount = 0;
  let maxMinDailyKpi = 0;
  let bottleneckIndex = -1;

  const milestones: DebtMilestone[] = uniqueDates.map((dateStr, idx) => {
    const itemsOnDate = groupedByDate.get(dateStr) || [];
    const dateDebtSum = itemsOnDate.reduce((sum, it) => sum + it.amount, 0);
    cumDebtAmount += dateDebtSum;

    // Count remaining unentered days on or before this due date & their bike installments
    const availableDaysUntilDate = unenteredDays.filter((d) => d.dateStr <= dateStr);
    const daysAvailable = availableDaysUntilDate.length;
    const cumBikeAmount = availableDaysUntilDate.reduce((sum, d) => {
      const isHighBike = d.month === 11 || (d.month === 12 && d.day <= 11);
      return sum + (isHighBike ? highBikeRate : lowBikeRate);
    }, 0);

    const totalNeededByDate = cumDebtAmount + cumBikeAmount;
    const shortfall = Math.max(0, totalNeededByDate - currentWalletBalance);
    const surplus = Math.max(0, currentWalletBalance - totalNeededByDate);

    let minDailyKpi = 0;
    if (shortfall > 0) {
      const effectiveDivisor = Math.max(1, daysAvailable);
      minDailyKpi = Math.ceil(shortfall / effectiveDivisor / 1000) * 1000;
    }

    if (minDailyKpi > maxMinDailyKpi) {
      maxMinDailyKpi = minDailyKpi;
      bottleneckIndex = idx;
    }

    const isClustered = idx > 0 && diffDaysBetween(uniqueDates[idx - 1], dateStr) <= 5;

    return {
      dateStr,
      labelDate: formatDateDDMM(dateStr),
      itemsOnDate,
      cumDebtAmount,
      cumBikeAmount,
      totalNeededByDate,
      daysAvailable,
      shortfall,
      surplus,
      minDailyKpi,
      isBottleneck: false,
      isClustered
    };
  });

  if (bottleneckIndex >= 0 && maxMinDailyKpi > 0) {
    milestones[bottleneckIndex].isBottleneck = true;
  }

  const bottleneck = bottleneckIndex >= 0 && maxMinDailyKpi > 0 ? milestones[bottleneckIndex] : null;
  const firstShortfall = milestones.find((m) => m.shortfall > 0) || null;

  // Count how many unpaid items fall within 10 days leading up to the bottleneck date
  let clusterCountNearBottleneck = 0;
  if (bottleneck) {
    clusterCountNearBottleneck = unpaidItems.filter((it) => {
      const diff = diffDaysBetween(it.dateStr, bottleneck.dateStr);
      return diff >= 0 && diff <= 10;
    }).length;
  }

  let severity: DebtKpiAnalysis['severity'] = 'safe';
  if (maxMinDailyKpi > 0) {
    if (
      (firstShortfall && firstShortfall.daysAvailable <= 4) ||
      maxMinDailyKpi >= 350000
    ) {
      severity = 'danger';
    } else if (
      maxMinDailyKpi >= 200000 ||
      (firstShortfall && firstShortfall.daysAvailable <= 10)
    ) {
      severity = 'warning';
    } else {
      severity = 'watch';
    }
  }

  const minDebtHoursPerDay =
    hourlyRate > 0 ? Math.round((maxMinDailyKpi / hourlyRate) * 10) / 10 : 0;

  return {
    minDebtDailyKpi: maxMinDailyKpi,
    minDebtHoursPerDay,
    bottleneck,
    firstShortfall,
    milestones,
    severity,
    clusterCountNearBottleneck
  };
}
