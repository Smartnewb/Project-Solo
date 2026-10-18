"use client";

import { Alert, Button, Card, Skeleton, ToggleButton, ToggleButtonGroup } from "@heroui/react";
import { useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useDailyRevenue, useGrowthRange } from "../hooks";
import {
  addDays,
  bucketMonthly,
  bucketWeekly,
  compoundWeeklyGrowth,
  daysInMonth,
  exVat,
  formatKrw,
  formatKrwFull,
  formatPercent,
  growthRate,
  movingAverage,
  type BucketPoint,
  type DailyPoint,
} from "../lib/metrics";

type Granularity = "daily" | "weekly" | "monthly";

const GRANULARITY_LABELS: Record<Granularity, string> = {
  daily: "일별",
  weekly: "주별",
  monthly: "월별",
};

const DAILY_WINDOW_DAYS = 90;
const CHART_HEIGHT = 320;

const CHART_COLORS = {
  bar: "var(--color-primary)",
  barPartial: "var(--color-primary-disabled)",
  line: "var(--color-text)",
  grid: "var(--color-border-soft)",
  axis: "var(--color-text-light)",
  zero: "var(--color-border-strong)",
} as const;

interface TrendDatum {
  key: string;
  label: string;
  revenue: number;
  line: number | null;
  partial: boolean;
  incomplete: boolean;
  days: number;
  count: number;
}

function dayLabel(date: string): string {
  return `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;
}

function dailyData(days: DailyPoint[], today: string): TrendDatum[] {
  const from = addDays(today, -(DAILY_WINDOW_DAYS - 1));
  const average = movingAverage(days, 7);
  return days.flatMap((d, i) =>
    d.date < from
      ? []
      : [
          {
            key: d.date,
            label: dayLabel(d.date),
            revenue: exVat(d.gross),
            line: average[i] === null ? null : exVat(average[i] as number),
            partial: d.date === today,
            incomplete: d.date === today,
            days: 1,
            count: d.count,
          },
        ],
  );
}

function bucketData(buckets: BucketPoint[], fullDays: (b: BucketPoint) => number): TrendDatum[] {
  let previousComplete: BucketPoint | null = null;
  return buckets.map((b) => {
    const short = !b.partial && b.days < fullDays(b);
    const comparable = !b.partial && !short;
    const line =
      comparable && previousComplete !== null ? growthRate(b.gross, previousComplete.gross) : null;
    if (comparable) previousComplete = b;
    return {
      key: b.key,
      label: b.partial ? `${b.label} (진행 중)` : short ? `${b.label} (${b.days}일분)` : b.label,
      revenue: exVat(b.gross),
      line: line === null ? null : line * 100,
      partial: b.partial,
      incomplete: !comparable,
      days: b.days,
      count: b.count,
    };
  });
}

function sumRange(days: DailyPoint[], from: string, to: string): number {
  return days.reduce((s, d) => (d.date >= from && d.date <= to ? s + d.gross : s), 0);
}

function fourWeekComparison(days: DailyPoint[], today: string): number | null {
  const recent = sumRange(days, addDays(today, -28), addDays(today, -1));
  const previous = sumRange(days, addDays(today, -56), addDays(today, -29));
  return growthRate(recent, previous);
}

function manwon(value: number): string {
  return `${Math.round(value / 10_000).toLocaleString("ko-KR")}만원`;
}

function percentTick(value: number): string {
  return `${value > 0 ? "+" : ""}${Math.round(value)}%`;
}

function toneClass(value: number | null): string {
  if (value === null) return "text-text-muted";
  if (value > 0) return "text-success";
  if (value < 0) return "text-error";
  return "text-text-body";
}

function SummaryStat({ label, value, hint }: { label: string; value: number | null; hint: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-text-light">{label}</p>
      <p className={`text-lg font-semibold tabular-nums ${toneClass(value)}`}>{formatPercent(value)}</p>
      <p className="text-xs text-text-muted">{hint}</p>
    </div>
  );
}

interface TooltipPayloadItem {
  payload?: TrendDatum;
}

function TrendTooltip({
  active,
  payload,
  granularity,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  granularity: Granularity;
}) {
  const datum = payload?.[0]?.payload;
  if (!active || !datum) return null;
  const lineLabel = granularity === "daily" ? "7일 이동평균" : granularity === "weekly" ? "전주 대비" : "전월 대비";
  const lineValue =
    datum.line === null
      ? "—"
      : granularity === "daily"
        ? formatKrwFull(datum.line)
        : formatPercent(datum.line / 100);
  return (
    <div className="rounded-xl border border-border bg-canvas px-3 py-2 text-xs shadow-card">
      <p className="font-medium text-text">
        {datum.label}
        {granularity === "daily" && datum.partial ? " (진행 중)" : ""}
      </p>
      <dl className="mt-1 space-y-0.5">
        <div className="flex justify-between gap-4">
          <dt className="text-text-light">매출(부가세 제외)</dt>
          <dd className="font-semibold tabular-nums text-text">{formatKrwFull(datum.revenue)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-text-light">{lineLabel}</dt>
          <dd className="tabular-nums text-text">{lineValue}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-text-light">결제 건수</dt>
          <dd className="tabular-nums text-text">{datum.count.toLocaleString("ko-KR")}건</dd>
        </div>
        {granularity !== "daily" && (
          <div className="flex justify-between gap-4">
            <dt className="text-text-light">포함 일수</dt>
            <dd className="tabular-nums text-text">{datum.days}일</dd>
          </div>
        )}
      </dl>
      {datum.partial ? (
        <p className="mt-1 text-text-muted">아직 끝나지 않아 성장률 계산에서 뺐습니다.</p>
      ) : datum.incomplete ? (
        <p className="mt-1 text-text-muted">조회 범위가 기간 중간에서 시작해 성장률 계산에서 뺐습니다.</p>
      ) : null}
    </div>
  );
}

function GrowthTrendSkeleton() {
  return (
    <Card role="status" aria-label="성장 추이 불러오는 중">
      <Card.Header className="flex-row items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40 rounded-md" />
          <Skeleton className="h-3 w-56 rounded-md" />
        </div>
        <Skeleton className="h-9 w-44 rounded-2xl" />
      </Card.Header>
      <Card.Content className="gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-14 rounded-md" />
          <Skeleton className="h-14 rounded-md" />
        </div>
        <Skeleton className="w-full rounded-2xl" style={{ height: CHART_HEIGHT }} />
      </Card.Content>
    </Card>
  );
}

export function GrowthTrend() {
  const { today } = useGrowthRange();
  const query = useDailyRevenue();
  const [granularity, setGranularity] = useState<Granularity>("weekly");

  const days = query.data;
  const weeks = useMemo(() => (days ? bucketWeekly(days, today) : []), [days, today]);
  const months = useMemo(() => (days ? bucketMonthly(days, today) : []), [days, today]);
  const data = useMemo<TrendDatum[]>(() => {
    if (!days) return [];
    if (granularity === "daily") return dailyData(days, today);
    if (granularity === "weekly") return bucketData(weeks, () => 7);
    return bucketData(months, (b) => daysInMonth(b.key));
  }, [days, granularity, months, today, weeks]);
  const weeklyCompound = useMemo(() => compoundWeeklyGrowth(weeks, 12), [weeks]);
  const fourWeek = useMemo(() => (days ? fourWeekComparison(days, today) : null), [days, today]);

  if (query.isPending) return <GrowthTrendSkeleton />;

  if (query.isError || !days) {
    return (
      <Alert status="danger">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>성장 추이를 불러오지 못했습니다.</Alert.Title>
          <Alert.Description>{query.error?.message ?? "잠시 후 다시 시도해 주세요."}</Alert.Description>
          <Button size="sm" variant="secondary" className="mt-2 w-fit" onPress={() => void query.refetch()}>
            다시 시도
          </Button>
        </Alert.Content>
      </Alert>
    );
  }

  const isDaily = granularity === "daily";
  const lineName = isDaily ? "7일 이동평균" : granularity === "weekly" ? "전주 대비 성장률" : "전월 대비 성장률";
  const description = isDaily
    ? `최근 ${DAILY_WINDOW_DAYS}일 · 막대는 하루 매출, 선은 7일 이동평균`
    : granularity === "weekly"
      ? "월요일 시작 주 · 막대는 주간 매출, 선은 전주 대비 성장률"
      : "최근 13개월 · 막대는 월 매출, 선은 전월 대비 성장률";

  return (
    <Card>
      <Card.Header className="flex-row flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Card.Title className="mb-0 text-base font-semibold text-text">매출 추이(부가세 제외)</Card.Title>
          <Card.Description className="mb-0">{description}</Card.Description>
        </div>
        <ToggleButtonGroup
          aria-label="기간 단위"
          size="sm"
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={[granularity]}
          onSelectionChange={(keys) => {
            const next = Array.from(keys)[0];
            if (next) setGranularity(next as Granularity);
          }}
        >
          {(Object.keys(GRANULARITY_LABELS) as Granularity[]).map((g) => (
            <ToggleButton key={g} id={g}>
              {GRANULARITY_LABELS[g]}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Card.Header>

      <Card.Content className="gap-4">
        <div className="grid grid-cols-2 gap-4 rounded-2xl bg-surface-soft px-4 py-3">
          <SummaryStat
            label="최근 12주 평균 주간 성장률"
            value={weeklyCompound}
            hint="완료된 주만 · 복리 기준"
          />
          <SummaryStat
            label="최근 4주 vs 그 전 4주"
            value={fourWeek}
            hint="어제까지 28일 · 그 전 28일 대비"
          />
        </div>

        <div style={{ width: "100%", height: CHART_HEIGHT }}>
          <ResponsiveContainer>
            <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
              <XAxis
                dataKey="label"
                interval="preserveStartEnd"
                tick={{ fontSize: 11, fill: CHART_COLORS.axis }}
                axisLine={{ stroke: CHART_COLORS.grid }}
                tickLine={false}
                minTickGap={16}
              />
              <YAxis
                yAxisId="revenue"
                tick={{ fontSize: 11, fill: CHART_COLORS.axis }}
                axisLine={false}
                tickLine={false}
                tickFormatter={manwon}
                width={64}
              />
              <YAxis
                yAxisId="line"
                orientation="right"
                hide={isDaily}
                tick={{ fontSize: 11, fill: CHART_COLORS.axis }}
                axisLine={false}
                tickLine={false}
                tickFormatter={percentTick}
                width={48}
              />
              <Tooltip
                cursor={{ fill: "var(--color-surface-strong)" }}
                content={<TrendTooltip granularity={granularity} />}
              />
              <Legend
                verticalAlign="top"
                align="right"
                height={28}
                iconSize={10}
                wrapperStyle={{ fontSize: 12, color: "var(--color-text-light)" }}
              />
              {!isDaily && (
                <ReferenceLine yAxisId="line" y={0} stroke={CHART_COLORS.zero} strokeDasharray="4 4" />
              )}
              <Bar
                yAxisId="revenue"
                dataKey="revenue"
                name="매출(부가세 제외)"
                fill={CHART_COLORS.bar}
                radius={[4, 4, 0, 0]}
                maxBarSize={isDaily ? 10 : 36}
                isAnimationActive={false}
              >
                {data.map((d) => (
                  <Cell key={d.key} fill={d.incomplete ? CHART_COLORS.barPartial : CHART_COLORS.bar} />
                ))}
              </Bar>
              <Line
                yAxisId={isDaily ? "revenue" : "line"}
                type="monotone"
                dataKey="line"
                name={lineName}
                stroke={CHART_COLORS.line}
                strokeWidth={2}
                dot={isDaily ? false : { r: 3, strokeWidth: 0, fill: CHART_COLORS.line }}
                activeDot={{ r: 4 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <p className="text-xs text-text-muted">
          연한 막대는 아직 끝나지 않았거나 일부 날짜만 포함된 기간입니다. 성장률은 완료된 기간끼리만 비교합니다.
          {!isDaily && data.length > 0 && ` 마지막 완료 구간 매출 ${formatKrw(
            [...data].reverse().find((d) => !d.incomplete)?.revenue ?? 0,
          )}.`}
        </p>
      </Card.Content>
    </Card>
  );
}
