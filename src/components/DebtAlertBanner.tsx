import React, { useState } from 'react';
import type { DebtKpiAnalysis } from '../utils/debtKpi';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Flame,
  Zap,
  CheckCircle2
} from 'lucide-react';

interface DebtAlertBannerProps {
  analysis: DebtKpiAnalysis;
  onOpenChecklist: () => void;
}

export const DebtAlertBanner: React.FC<DebtAlertBannerProps> = ({
  analysis,
  onOpenChecklist
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    minDebtDailyKpi,
    minDebtHoursPerDay,
    bottleneck,
    firstShortfall,
    milestones,
    severity,
    clusterCountNearBottleneck
  } = analysis;

  const containerStyle =
    severity === 'danger'
      ? 'bg-rose-950/45 border-rose-500/50 shadow-rose-950/30'
      : severity === 'warning'
      ? 'bg-amber-950/35 border-amber-500/40 shadow-amber-950/20'
      : severity === 'watch'
      ? 'bg-sky-950/35 border-sky-500/35 shadow-sky-950/20'
      : 'bg-emerald-950/30 border-emerald-500/35 shadow-emerald-950/20';

  const badgeStyle =
    severity === 'danger'
      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
      : severity === 'warning'
      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
      : severity === 'watch'
      ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

  const kpiColor =
    severity === 'danger'
      ? 'text-rose-400'
      : severity === 'warning'
      ? 'text-amber-400'
      : severity === 'watch'
      ? 'text-sky-300'
      : 'text-emerald-400';

  return (
    <div
      className={`rounded-2xl border backdrop-blur-md shadow-lg transition overflow-hidden ${containerStyle}`}
    >
      {/* Main Alert Summary Row */}
      <div className="p-3 sm:p-4 flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {severity === 'safe' ? (
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" strokeWidth={1.75} />
            ) : severity === 'danger' ? (
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400 animate-pulse shrink-0" strokeWidth={1.75} />
            ) : severity === 'warning' ? (
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" strokeWidth={1.75} />
            ) : (
              <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400 shrink-0" strokeWidth={1.75} />
            )}

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-xs sm:text-sm font-bold text-white">
                KPI Tối Thiểu Trả Nợ:
              </span>
              <span className={`text-sm sm:text-base font-black tracking-tight ${kpiColor}`}>
                {minDebtDailyKpi === 0
                  ? '0 đ/ngày (An toàn ✓)'
                  : `${minDebtDailyKpi.toLocaleString('vi-VN')} đ/ngày`}
              </span>
              {minDebtDailyKpi > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold ${badgeStyle}`}>
                  ~{minDebtHoursPerDay}h/ngày
                </span>
              )}
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {milestones.length > 0 && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="px-2.5 py-1 rounded-lg bg-zinc-900/70 hover:bg-zinc-800 border border-white/10 text-[11px] font-semibold text-zinc-200 flex items-center gap-1 transition"
              >
                <span>Lộ trình {milestones.length} mốc</span>
                {isExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5" strokeWidth={1.75} />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.75} />
                )}
              </button>
            )}
            <button
              type="button"
              onClick={onOpenChecklist}
              className="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 text-[11px] font-semibold text-purple-200 transition"
            >
              Tick nợ ✓
            </button>
          </div>
        </div>

        {/* Actionable Early-Warning Message */}
        <div className="text-xs text-zinc-200 leading-relaxed space-y-1">
          {severity === 'safe' ? (
            <p className="text-emerald-200/90">
              Số dư 3 ví hiện tại đã <b>đủ phủ toàn bộ các khoản nợ, tiền nhà và góp xe sắp tới</b>. Bạn chỉ cần tập trung cày gom đủ mục tiêu 15 triệu ăn Tết!
            </p>
          ) : bottleneck ? (
            <>
              <p>
                {severity === 'danger' ? '🚨 ' : '⚠️ '}
                Điểm nghẽn căng nhất vào ngày <b className="text-white">{bottleneck.labelDate}</b> (còn{' '}
                <b className={kpiColor}>{bottleneck.daysAvailable} ngày</b>): tổng nợ dồn + góp xe cần{' '}
                <b className="text-white">{bottleneck.totalNeededByDate.toLocaleString('vi-VN')} đ</b> → hiện đang thiếu{' '}
                <b className={kpiColor}>{bottleneck.shortfall.toLocaleString('vi-VN')} đ</b>. Phải kiếm tối thiểu{' '}
                <b className={kpiColor}>{minDebtDailyKpi.toLocaleString('vi-VN')} đ/ngày</b> để không hụt tiền đóng nợ!
              </p>

              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {clusterCountNearBottleneck >= 2 && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/30 font-semibold">
                    <Zap className="w-3 h-3" strokeWidth={1.75} />
                    Cụm {clusterCountNearBottleneck} khoản dồn liên tiếp trước {bottleneck.labelDate}
                  </span>
                )}
                {firstShortfall && firstShortfall.dateStr !== bottleneck.dateStr && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-zinc-900/80 text-amber-300 border border-amber-500/30 font-medium">
                    Mốc bắt đầu thiếu tiền: <b>{firstShortfall.labelDate}</b> (còn {firstShortfall.daysAvailable} ngày, thiếu{' '}
                    {Math.round(firstShortfall.shortfall / 1000).toLocaleString('vi-VN')}k)
                  </span>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Expandable Debt Cashflow Timeline */}
      {isExpanded && milestones.length > 0 && (
        <div className="border-t border-white/10 bg-zinc-950/75 p-3 sm:p-4 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 pb-1">
            <span className="font-semibold text-zinc-300">
              Mô phỏng dòng tiền qua từng mốc nợ (Cộng dồn Nợ + Tiền nhà + Góp xe)
            </span>
            <span className="hidden sm:inline">So với số dư 3 ví hiện tại</span>
          </div>

          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {milestones.map((m) => {
              const isSafeMilestone = m.shortfall === 0;
              return (
                <div
                  key={m.dateStr}
                  className={`p-2.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 ${
                    m.isBottleneck
                      ? 'bg-rose-950/40 border-rose-500/50'
                      : isSafeMilestone
                      ? 'bg-zinc-900/60 border-zinc-800'
                      : 'bg-amber-950/20 border-amber-500/30'
                  }`}
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-white">
                        {m.labelDate}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        (còn {m.daysAvailable} ngày)
                      </span>
                      {m.isBottleneck && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-rose-500/25 text-rose-200 border border-rose-500/40 font-bold">
                          <Flame className="w-3 h-3 text-rose-400" strokeWidth={1.75} />
                          Căng nhất
                        </span>
                      )}
                      {m.isClustered && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
                          Liên tiếp
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-zinc-300 truncate">
                      {m.itemsOnDate.map((it) => `${it.name} (${Math.round(it.amount / 1000)}k)`).join(' + ')}
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      Cộng dồn đến {m.labelDate}: Nợ/Nhà {(m.cumDebtAmount / 1000000).toFixed(2)}tr + Góp xe{' '}
                      {(m.cumBikeAmount / 1000000).toFixed(2)}tr ={' '}
                      <b className="text-zinc-300">{m.totalNeededByDate.toLocaleString('vi-VN')} đ</b>
                    </div>
                  </div>

                  <div className="sm:text-right shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-zinc-800/80">
                    {isSafeMilestone ? (
                      <div className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                        <span>Đủ tiền (dư +{Math.round(m.surplus / 1000).toLocaleString('vi-VN')}k)</span>
                      </div>
                    ) : (
                      <div>
                        <div className="text-[11px] font-bold text-rose-400">
                          Thiếu {m.shortfall.toLocaleString('vi-VN')} đ
                        </div>
                        <div className="text-[10px] text-amber-300 font-semibold">
                          Tối thiểu: {m.minDailyKpi.toLocaleString('vi-VN')} đ/ngày
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
