"use client";

import { Alert, Button, Skeleton } from "@heroui/react";
import { RefreshCw } from "lucide-react";
import { useMemo } from "react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { RECENT_DAYS, useRecentChannelDays } from "../hooks";
import {
  FEE_CHANNEL_LABELS,
  FEE_RATES,
  formatKrwFull,
  formatPercent,
  growthRate,
  type ChannelDay,
  type FeeChannel,
} from "../lib/metrics";

const CHART_HEIGHT = 320;
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

const CHANNEL_KEYS: Record<FeeChannel, "apple" | "google" | "pg"> = {
  APPLE_IAP: "apple",
  GOOGLE_PLAY: "google",
  PG: "pg",
};

const CHANNEL_COLORS: Record<FeeChannel, string> = {
  APPLE_IAP: "var(--color-primary)",
  GOOGLE_PLAY: "var(--color-success)",
  PG: "var(--color-border-strong)",
};

const CHANNEL_ORDER: FeeChannel[] = ["APPLE_IAP", "GOOGLE_PLAY", "PG"];

const LINE_COLORS = {
  average: "var(--color-text)",
  lastWeek: "var(--color-warning)",
  grid: "var(--color-border-soft)",
  axis: "var(--color-text-light)",
} as const;

export interface DailyChannelDatum {
  key: string;
  label: string;
  apple: number;
  google: number;
  pg: number;
  net: number;
  gross: number;
  count: number;
  average: number | null;
  lastWeek: number | null;
  partial: boolean;
}

export interface DailyChannelSummary {
  last7: number | null;
  last14: number | null;
  dailyCount: number;
  dailyCountGrowth: number | null;
  perPayment: number | null;
  perPaymentGrowth: number | null;
}

function dayLabel(date: string): string {
  const weekday = WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()];
  return `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}(${weekday})`;
}

function sum(days: ChannelDay[], pick: (d: ChannelDay) => number): number {
  return days.reduce((s, d) => s + pick(d), 0);
}

// days: 오래된 날부터 오늘까지(마지막이 오늘). 최근 14일 + 그 전 14일 + 오늘이 들어 있어야 한다.
export function buildDailyChannelData(days: ChannelDay[], today: string): DailyChannelDatum[] {
  return days.slice(-(RECENT_DAYS + 1)).map((d) => {
    const i = days.indexOf(d);
    const partial = d.date === today;
    const window = days.slice(Math.max(0, i - 6), i + 1);
    const average = !partial && window.length === 7 ? sum(window, (w) => w.net) / 7 : null;
    const weekAgo = i >= 7 ? days[i - 7] : undefined;
    return {
      key: d.date,
      label: dayLabel(d.date),
      apple: d.netByChannel.APPLE_IAP,
      google: d.netByChannel.GOOGLE_PLAY,
      pg: d.netByChannel.PG,
      net: d.net,
      gross: d.gross,
      count: d.count,
      average,
      lastWeek: weekAgo ? weekAgo.net : null,
      partial,
    };
  });
}

export function buildDailyChannelSummary(days: ChannelDay[], today: string): DailyChannelSummary {
  const completed = days.filter((d) => d.date < today);
  const recent14 = completed.slice(-RECENT_DAYS);
  const previous14 = completed.slice(-RECENT_DAYS * 2, -RECENT_DAYS);
  const net = (list: ChannelDay[]) => sum(list, (d) => d.net);
  const count = (list: ChannelDay[]) => sum(list, (d) => d.count);
  const perPayment = (list: ChannelDay[]) => (count(list) > 0 ? net(list) / count(list) : null);
  const recentPer = perPayment(recent14);
  const previousPer = perPayment(previous14);
  return {
    last7: growthRate(net(completed.slice(-7)), net(completed.slice(-14, -7))),
    last14: growthRate(net(recent14), net(previous14)),
    dailyCount: recent14.length > 0 ? count(recent14) / recent14.length : 0,
    dailyCountGrowth: growthRate(count(recent14), count(previous14)),
    perPayment: recentPer,
    perPaymentGrowth: recentPer === null || previousPer === null ? null : growthRate(recentPer, previousPer),
  };
}

function toneClass(value: number | null): string {
  if (value === null) return "text-text-muted";
  if (value > 0) return "text-success";
  if (value < 0) return "text-error";
  return "text-text-body";
}

function Stat({
  label,
  value,
  delta,
  hint,
}: {
  label: string;
  value: string;
  delta?: number | null;
  hint: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-text-light">{label}</p>
      <p className="flex flex-wrap items-baseline gap-x-1.5 text-lg font-semibold tabular-nums text-text">
        <span className="whitespace-nowrap">{value}</span>
        {delta !== undefined && (
          <span className={`whitespace-nowrap text-sm font-medium ${toneClass(delta)}`}>{formatPercent(delta)}</span>
        )}
      </p>
      <p className="text-xs text-text-muted">{hint}</p>
    </div>
  );
}

function manwon(value: number): string {
  return `${Math.round(value / 10_000).toLocaleString("ko-KR")}만원`;
}

function timeLabel(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "—";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(ms);
}

function ChannelTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload?: DailyChannelDatum }> }) {
  const d = payload?.[0]?.payload;
  if (!active || !d) return null;
  const vsLastWeek = d.partial || d.lastWeek === null ? null : growthRate(d.net, d.lastWeek);
  return (
    <div className="rounded-xl border border-border bg-canvas px-3 py-2 text-xs shadow-card">
      <p className="font-medium text-text">
        {d.label}
        {d.partial ? " (진행 중)" : ""}
      </p>
      <dl className="mt-1 space-y-0.5">
        <div className="flex justify-between gap-4">
          <dt className="text-text-light">남는 돈(부가세·수수료 제외)</dt>
          <dd className="font-semibold tabular-nums text-text">{formatKrwFull(d.net)}</dd>
        </div>
        {CHANNEL_ORDER.map((ch) => (
          <div key={ch} className="flex justify-between gap-4 pl-2">
            <dt className="flex items-center gap-1.5 text-text-light">
              <span className="inline-block size-2 rounded-sm" style={{ background: CHANNEL_COLORS[ch] }} />
              {FEE_CHANNEL_LABELS[ch]}
            </dt>
            <dd className="tabular-nums text-text">{formatKrwFull(d[CHANNEL_KEYS[ch]])}</dd>
          </div>
        ))}
        <div className="flex justify-between gap-4">
          <dt className="text-text-light">고객 결제액(부가세 포함)</dt>
          <dd className="tabular-nums text-text">{formatKrwFull(d.gross)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-text-light">결제 건수</dt>
          <dd className="tabular-nums text-text">{d.count.toLocaleString("ko-KR")}건</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-text-light">7일 이동평균</dt>
          <dd className="tabular-nums text-text">{d.average === null ? "—" : formatKrwFull(d.average)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-text-light">지난주 같은 요일</dt>
          <dd className="tabular-nums text-text">
            {d.lastWeek === null ? "—" : formatKrwFull(d.lastWeek)}
            {vsLastWeek !== null && <span className={`ml-1 ${toneClass(vsLastWeek)}`}>({formatPercent(vsLastWeek)})</span>}
          </dd>
        </div>
      </dl>
      {d.partial && <p className="mt-1 text-text-muted">아직 끝나지 않은 날이라 비교·평균에서 뺐습니다.</p>}
    </div>
  );
}

export function DailyChannelTrend() {
  const query = useRecentChannelDays();
  const { today } = query;
  const data = useMemo(() => (query.data ? buildDailyChannelData(query.data, today) : []), [query.data, today]);
  const summary = useMemo(
    () => (query.data ? buildDailyChannelSummary(query.data, today) : null),
    [query.data, today],
  );

  if (query.isError) {
    return (
      <Alert status="danger">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>최근 14일 결제수단별 매출을 불러오지 못했습니다.</Alert.Title>
          <Alert.Description>
            {query.error instanceof Error ? query.error.message : "잠시 후 다시 시도해 주세요."}
          </Alert.Description>
          <Button size="sm" variant="secondary" className="mt-2 w-fit" onPress={query.refetch}>
            다시 시도
          </Button>
        </Alert.Content>
      </Alert>
    );
  }

  if (!query.data || !summary) {
    return (
      <div className="space-y-4" role="status" aria-label="최근 14일 불러오는 중">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[0, 1, 2, 3].map((k) => (
            <Skeleton key={k} className="h-14 rounded-md" />
          ))}
        </div>
        <Skeleton className="w-full rounded-2xl" style={{ height: CHART_HEIGHT }} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 rounded-2xl bg-surface-soft px-4 py-3 md:grid-cols-4">
        <Stat
          label="최근 7일 vs 그 전 7일"
          value={formatPercent(summary.last7)}
          hint="어제까지 · 남는 돈 기준"
        />
        <Stat
          label="최근 14일 vs 그 전 14일"
          value={formatPercent(summary.last14)}
          hint="어제까지 · 남는 돈 기준"
        />
        <Stat
          label="하루 평균 결제 건수"
          value={`${summary.dailyCount.toFixed(1)}건`}
          delta={summary.dailyCountGrowth}
          hint="최근 14일 · 그 전 14일 대비"
        />
        <Stat
          label="결제 1건당 남는 돈"
          value={summary.perPayment === null ? "—" : formatKrwFull(summary.perPayment)}
          delta={summary.perPaymentGrowth}
          hint="최근 14일 · 그 전 14일 대비"
        />
      </div>

      <div style={{ width: "100%", height: CHART_HEIGHT }}>
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={LINE_COLORS.grid} vertical={false} />
            <XAxis
              dataKey="label"
              interval="preserveStartEnd"
              minTickGap={6}
              tick={{ fontSize: 11, fill: LINE_COLORS.axis }}
              axisLine={{ stroke: LINE_COLORS.grid }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: LINE_COLORS.axis }}
              axisLine={false}
              tickLine={false}
              tickFormatter={manwon}
              width={64}
            />
            <Tooltip cursor={{ fill: "var(--color-surface-strong)" }} content={<ChannelTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              iconSize={10}
              wrapperStyle={{ fontSize: 12, color: "var(--color-text-light)" }}
            />
            {CHANNEL_ORDER.map((ch, idx) => (
              <Bar
                key={ch}
                dataKey={CHANNEL_KEYS[ch]}
                name={FEE_CHANNEL_LABELS[ch]}
                stackId="net"
                fill={CHANNEL_COLORS[ch]}
                radius={idx === CHANNEL_ORDER.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                maxBarSize={28}
                isAnimationActive={false}
              >
                {data.map((d) => (
                  <Cell key={d.key} fillOpacity={d.partial ? 0.35 : 1} />
                ))}
              </Bar>
            ))}
            <Line
              type="monotone"
              dataKey="average"
              name="7일 이동평균"
              stroke={LINE_COLORS.average}
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="lastWeek"
              name="지난주 같은 요일"
              stroke={LINE_COLORS.lastWeek}
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={{ r: 2, strokeWidth: 0, fill: LINE_COLORS.lastWeek }}
              connectNulls={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-text-muted">
        <p>
          막대 = 회사에 남는 돈: 고객 결제액에서 부가세(1/11)와 채널 수수료(애플 {pct(FEE_RATES.APPLE_IAP)}, 구글{" "}
          {pct(FEE_RATES.GOOGLE_PLAY)}, PG {pct(FEE_RATES.PG)}, 결제액 대비)를 뺀 추정치. 맨 오른쪽 연한 막대는 오늘(진행 중).
        </p>
        <span className="flex items-center gap-1.5 whitespace-nowrap">
          {timeLabel(query.updatedAt)} 기준
          <Button
            size="sm"
            variant="ghost"
            isIconOnly
            aria-label="지금 다시 불러오기"
            isDisabled={query.isFetching}
            onPress={query.refetch}
          >
            <RefreshCw size={14} aria-hidden className={query.isFetching ? "animate-spin" : ""} />
          </Button>
        </span>
      </div>
    </div>
  );
}

function pct(rate: number): string {
  return `${Number((rate * 100).toFixed(2))}%`;
}
