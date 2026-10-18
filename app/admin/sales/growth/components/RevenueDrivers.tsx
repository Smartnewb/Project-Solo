"use client";

import { useMemo } from "react";
import { Alert, Card, Chip, Skeleton } from "@heroui/react";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RevenueMetricsTrendPoint } from "../../types";
import { useDailyRevenue, useMonthlyRevenueMetrics, useMonthlySignups } from "../hooks";
import {
  bucketMonthly,
  exVat,
  formatKrw,
  formatKrwFull,
  formatPercent,
  growthRate,
  kstToday,
  type BucketPoint,
} from "../lib/metrics";

export interface DriverRow {
  month: string;
  label: string;
  gross: number;
  momGrowth: number | null;
  arppu: number | null;
  aov: number | null;
  payers: number | null;
  partial: boolean;
}

export function buildDriverRows(
  buckets: BucketPoint[],
  metrics: RevenueMetricsTrendPoint[] | undefined,
  limit = 12,
): DriverRow[] {
  const byMonth = new Map((metrics ?? []).map((m) => [m.label, m]));
  const rows = buckets.map((b, i) => {
    const month = b.key.slice(0, 7);
    const m = byMonth.get(month);
    const arppu = m && m.arppu > 0 ? m.arppu : null;
    const aov = m && m.aov > 0 ? m.aov : null;
    const prev = i > 0 ? buckets[i - 1] : null;
    return {
      month,
      label: b.label,
      gross: b.gross,
      momGrowth: prev && !b.partial ? growthRate(b.gross, prev.gross) : null,
      arppu,
      aov,
      payers: arppu !== null && b.gross > 0 ? Math.round(b.gross / arppu) : null,
      partial: b.partial,
    };
  });
  return rows.slice(-limit);
}

export type DriverKind = "payers" | "arppu" | "both" | "offset" | "flat" | "unknown";

export interface DriverDecomposition {
  revenueGrowth: number | null;
  payersGrowth: number | null;
  arppuGrowth: number | null;
  payersShare: number | null;
  arppuShare: number | null;
  driver: DriverKind;
}

const FLAT_THRESHOLD = 0.005;
const MINOR_FACTOR_RATIO = 0.25;

export function decomposeRevenueChange(prev: DriverRow, curr: DriverRow): DriverDecomposition {
  const revenueGrowth = growthRate(curr.gross, prev.gross);
  const empty = { revenueGrowth, payersGrowth: null, arppuGrowth: null, payersShare: null, arppuShare: null };
  if (revenueGrowth === null || curr.gross <= 0 || prev.arppu === null || curr.arppu === null) {
    return { ...empty, driver: "unknown" };
  }
  const prevPayers = prev.gross / prev.arppu;
  const currPayers = curr.gross / curr.arppu;
  const payersGrowth = growthRate(currPayers, prevPayers);
  const arppuGrowth = growthRate(curr.arppu, prev.arppu);
  if (Math.abs(revenueGrowth) < FLAT_THRESHOLD) {
    return { revenueGrowth, payersGrowth, arppuGrowth, payersShare: null, arppuShare: null, driver: "flat" };
  }
  const logRevenueChange = Math.log(curr.gross / prev.gross);
  const logPayersChange = Math.log(currPayers / prevPayers);
  const logArppuChange = Math.log(curr.arppu / prev.arppu);
  const larger = Math.max(Math.abs(logPayersChange), Math.abs(logArppuChange));
  const smaller = Math.min(Math.abs(logPayersChange), Math.abs(logArppuChange));
  let driver: DriverKind;
  if (larger === 0 || smaller / larger < MINOR_FACTOR_RATIO) {
    driver = Math.abs(logPayersChange) >= Math.abs(logArppuChange) ? "payers" : "arppu";
  } else if (Math.sign(logPayersChange) === Math.sign(logArppuChange)) {
    driver = "both";
  } else {
    driver = "offset";
  }
  return {
    revenueGrowth,
    payersGrowth,
    arppuGrowth,
    payersShare: logPayersChange / logRevenueChange,
    arppuShare: logArppuChange / logRevenueChange,
    driver,
  };
}

export function formatSignedPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  return formatPercent(Math.abs(value) < 0.0005 ? 0 : value);
}

export function describeDriver(d: DriverDecomposition, currName: string, prevName: string): string {
  if (d.revenueGrowth === null) {
    return `${prevName} 매출이 없어 ${currName} 매출 변화를 나눠 볼 수 없습니다.`;
  }
  const rev = formatSignedPercent(d.revenueGrowth);
  if (d.driver === "unknown") {
    return `${currName} 매출은 ${prevName}보다 ${rev} 변했습니다. 1인당 결제액 지표가 없어 원인을 나눠 볼 수 없습니다.`;
  }
  const pg = d.payersGrowth ?? 0;
  const ag = d.arppuGrowth ?? 0;
  const p = formatSignedPercent(pg);
  const a = formatSignedPercent(ag);
  const magnitude = `${(Math.abs(d.revenueGrowth) * 100).toFixed(1)}%`;
  const moved = `${currName} 매출은 ${prevName}보다 ${magnitude} ${d.revenueGrowth > 0 ? "늘었습니다" : "줄었습니다"}.`;
  switch (d.driver) {
    case "flat":
      return `${currName} 매출은 ${prevName}과 거의 같습니다(${rev}). 결제자 수 ${p}, 1인당 결제액 ${a}로 큰 변화가 없습니다.`;
    case "payers":
      return `${moved} 결제자 수가 ${p}, 1인당 결제액이 ${a} 변해, 결제자 수 ${pg > 0 ? "증가" : "감소"}가 주된 원인입니다.`;
    case "arppu":
      return `${moved} 결제자 수가 ${p}, 1인당 결제액이 ${a} 변해, 1인당 결제액 ${ag > 0 ? "증가" : "감소"}가 주된 원인입니다.`;
    case "both":
      return `${moved} 결제자 수(${p})와 1인당 결제액(${a})이 같은 방향으로 함께 움직였습니다.`;
    case "offset": {
      const dominant = Math.abs(d.payersShare ?? 0) >= Math.abs(d.arppuShare ?? 0) ? "결제자 수" : "1인당 결제액";
      return `${moved} 결제자 수는 ${p}, 1인당 결제액은 ${a}로 서로 반대로 움직였고, ${dominant} 변화가 더 커서 매출 방향을 정했습니다.`;
    }
  }
}

function monthName(month: string): string {
  return `${Number(month.slice(5, 7))}월`;
}

const CHART = {
  primary: "var(--color-primary)",
  neutral: "var(--color-border-strong)",
  grid: "var(--color-border-soft)",
  tick: "var(--color-text-light)",
} as const;

const TOOLTIP_STYLE = {
  backgroundColor: "var(--color-canvas)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  boxShadow: "var(--box-shadow)",
  fontSize: 12,
} as const;

function QueryError({ title, error }: { title: string; error: unknown }) {
  return (
    <Alert status="danger">
      <Alert.Content>
        <Alert.Title>{title}</Alert.Title>
        <Alert.Description>
          {error instanceof Error && error.message ? error.message : "잠시 후 다시 시도해 주세요."}
        </Alert.Description>
      </Alert.Content>
    </Alert>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2" aria-label="불러오는 중">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-full rounded-lg" />
      ))}
    </div>
  );
}

function Delta({ value }: { value: number | null }) {
  if (value === null) return <span className="text-gray-400">—</span>;
  const label = formatSignedPercent(value);
  const tone = label.startsWith("+") ? "text-success" : label.startsWith("-") ? "text-error" : "text-gray-500";
  return <span className={`${tone} tabular-nums`}>{label}</span>;
}

function VerdictCard({ prev, curr, d }: { prev: DriverRow; curr: DriverRow; d: DriverDecomposition }) {
  const growth = d.revenueGrowth ?? 0;
  const Icon = d.driver === "flat" || growth === 0 ? Minus : growth > 0 ? TrendingUp : TrendingDown;
  const tone =
    d.driver === "flat" || growth === 0 ? "text-gray-500" : growth > 0 ? "text-success" : "text-error";
  return (
    <div className="rounded-xl border border-border bg-surface-soft p-4">
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 shrink-0 ${tone}`} aria-hidden>
          <Icon size={20} />
        </span>
        <div className="min-w-0 space-y-2">
          <p className="text-sm font-medium text-gray-900">
            {describeDriver(d, monthName(curr.month), monthName(prev.month))}
          </p>
          <dl className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500">
            <div className="flex items-baseline gap-1.5">
              <dt>매출</dt>
              <dd className="font-medium">
                <Delta value={d.revenueGrowth} />
              </dd>
            </div>
            <div className="flex items-baseline gap-1.5">
              <dt>결제자 수</dt>
              <dd className="font-medium">
                <Delta value={d.payersGrowth} />
              </dd>
            </div>
            <div className="flex items-baseline gap-1.5">
              <dt>1인당 결제액</dt>
              <dd className="font-medium">
                <Delta value={d.arppuGrowth} />
              </dd>
            </div>
          </dl>
          <p className="text-xs text-gray-400">
            기준: {monthName(curr.month)}(마지막으로 끝난 달) vs {monthName(prev.month)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function RevenueDrivers() {
  const today = kstToday();
  const daily = useDailyRevenue();
  const metrics = useMonthlyRevenueMetrics();
  const signups = useMonthlySignups();

  const rows = useMemo(
    () => buildDriverRows(daily.data ? bucketMonthly(daily.data, today) : [], metrics.data?.data, 12),
    [daily.data, metrics.data, today],
  );

  const verdict = useMemo(() => {
    const complete = rows.filter((r) => !r.partial);
    if (complete.length < 2) return null;
    const curr = complete[complete.length - 1];
    const prev = complete[complete.length - 2];
    return { prev, curr, d: decomposeRevenueChange(prev, curr) };
  }, [rows]);

  const chartData = useMemo(() => {
    const byMonth = new Map((signups.data ?? []).map((s) => [s.month, s.count]));
    return rows.map((r) => ({
      name: r.partial ? `${r.label}(진행 중)` : r.label,
      signups: byMonth.get(r.month) ?? null,
      payers: r.payers,
    }));
  }, [rows, signups.data]);

  const metricsMissing = metrics.isError || (!metrics.isLoading && !metrics.data);
  const tableLoading = daily.isLoading || metrics.isLoading;
  const chartLoading = daily.isLoading || metrics.isLoading || signups.isLoading;

  return (
    <div className="space-y-4">
      <Card>
        <Card.Content className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-gray-900">월별 분해: 매출 = 결제자 수 × 1인당 결제액</h3>
              <p className="mt-1 text-xs text-gray-500">
                최근 12개월, KST 결제일 기준. 결제자 수(추정)는 월 매출 ÷ 1인당 결제액(ARPPU)으로 역산한 값이라
                실제 결제자 수와 조금 다를 수 있습니다.
              </p>
            </div>
            <Chip size="sm" variant="soft" color="accent">
              <Chip.Label>부가세 제외</Chip.Label>
            </Chip>
          </div>

          {daily.isError && <QueryError title="월 매출을 불러오지 못했습니다" error={daily.error} />}
          {metrics.isError && (
            <QueryError
              title="수익 지표(ARPPU·AOV)를 불러오지 못해 결제자 수·1인당 결제액은 비워 둡니다"
              error={metrics.error}
            />
          )}

          {tableLoading ? (
            <TableSkeleton />
          ) : daily.isError ? null : rows.length === 0 ? (
            <p className="rounded-xl bg-surface-soft p-4 text-sm text-gray-500">표시할 월 매출이 없습니다.</p>
          ) : (
            <>
              {verdict && !metricsMissing && <VerdictCard {...verdict} />}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500">
                      <th className="py-2 pr-3 font-medium">월</th>
                      <th className="py-2 px-3 text-right font-medium">
                        매출
                        <span className="block text-[11px] font-normal text-gray-400">부가세 제외</span>
                      </th>
                      <th className="py-2 px-3 text-right font-medium">
                        전월 대비
                        <span className="block text-[11px] font-normal text-gray-400">매출 증감</span>
                      </th>
                      <th className="py-2 px-3 text-right font-medium">
                        결제자 수(추정)
                        <span className="block text-[11px] font-normal text-gray-400">매출 ÷ ARPPU</span>
                      </th>
                      <th className="py-2 px-3 text-right font-medium">
                        1인당 결제액
                        <span className="block text-[11px] font-normal text-gray-400">ARPPU, 결제자 1명이 쓴 돈</span>
                      </th>
                      <th className="py-2 pl-3 text-right font-medium">
                        건당 결제액
                        <span className="block text-[11px] font-normal text-gray-400">AOV, 결제 1건 평균</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...rows].reverse().map((r) => {
                        const isVerdictMonth = verdict?.curr.month === r.month;
                        return (
                          <tr
                            key={r.month}
                            className={`border-t border-border ${r.partial ? "text-gray-400" : "text-gray-900"} ${
                              isVerdictMonth ? "bg-primary/5" : ""
                            }`}
                          >
                            <td className="py-2.5 pr-3 whitespace-nowrap font-medium tabular-nums">
                              {r.label}
                              {r.partial && <span className="ml-1 text-xs font-normal">(진행 중)</span>}
                              {isVerdictMonth && (
                                <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                                  분석 기준
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right tabular-nums" title={formatKrwFull(exVat(r.gross))}>
                              {formatKrw(exVat(r.gross))}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <Delta value={r.momGrowth} />
                            </td>
                            <td className="py-2.5 px-3 text-right tabular-nums">
                              {r.payers === null ? <span className="text-gray-400">—</span> : `${r.payers.toLocaleString("ko-KR")}명`}
                            </td>
                            <td className="py-2.5 px-3 text-right tabular-nums">
                              {r.arppu === null ? <span className="text-gray-400">—</span> : formatKrwFull(exVat(r.arppu))}
                            </td>
                            <td className="py-2.5 pl-3 text-right tabular-nums">
                              {r.aov === null ? <span className="text-gray-400">—</span> : formatKrwFull(exVat(r.aov))}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-400">
                1인당·건당 결제액은 결제 생성 시각(서버 기준 월)으로 묶여 월 매출(결제일 기준)과 소폭 어긋날 수 있습니다.
              </p>
            </>
          )}
        </Card.Content>
      </Card>

      <Card>
        <Card.Content className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">신규 가입자와 결제자 수</h3>
            <p className="mt-1 text-xs text-gray-500">
              가입자(막대)가 늘어도 결제자(선)가 따라오지 않으면 결제 전환이 약해진 것입니다. 결제자 수는 위 표와 같은 추정치입니다.
            </p>
          </div>

          {signups.isError && <QueryError title="월 신규 가입자를 불러오지 못해 막대는 비워 둡니다" error={signups.error} />}

          {chartLoading ? (
            <Skeleton className="h-[260px] w-full rounded-xl" aria-label="불러오는 중" />
          ) : chartData.length === 0 ? (
            <p className="rounded-xl bg-surface-soft p-4 text-sm text-gray-500">표시할 데이터가 없습니다.</p>
          ) : (
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: CHART.tick }}
                    axisLine={{ stroke: CHART.grid }}
                    tickLine={false}
                    interval="preserveStartEnd"
                    minTickGap={12}
                  />
                  <YAxis
                    yAxisId="signups"
                    tick={{ fontSize: 11, fill: CHART.tick }}
                    axisLine={false}
                    tickLine={false}
                    width={44}
                    tickFormatter={(v: number) => v.toLocaleString("ko-KR")}
                  />
                  <YAxis
                    yAxisId="payers"
                    orientation="right"
                    tick={{ fontSize: 11, fill: CHART.tick }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                    tickFormatter={(v: number) => v.toLocaleString("ko-KR")}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(value, name): [string, string] => [
                      typeof value === "number" ? `${value.toLocaleString("ko-KR")}명` : "—",
                      String(name),
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar
                    yAxisId="signups"
                    dataKey="signups"
                    name="신규 가입자"
                    fill={CHART.neutral}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                  <Line
                    yAxisId="payers"
                    type="monotone"
                    dataKey="payers"
                    name="결제자 수(추정)"
                    stroke={CHART.primary}
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: CHART.primary, strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}
