"use client";

import { useMemo } from "react";
import { Alert, Card, Chip, Skeleton } from "@heroui/react";
import { CalendarClock, Repeat, Users, type LucideIcon } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CohortLtvItem, PurchaseCountDistributionItem } from "../../types";
import { HISTORY_START, useLtvCohorts, useRepurchase } from "../hooks";
import { addDays, addMonths, exVat, formatKrwFull, kstToday } from "../lib/metrics";

export const LTV_WINDOWS = [7, 30, 90] as const;
export type LtvWindow = (typeof LTV_WINDOWS)[number];

export function isCohortMature(cohort: string, windowDays: number, today: string): boolean {
  const lastSignupDay = addDays(addMonths(`${cohort}-01`, 1), -1);
  return addDays(lastSignupDay, windowDays) <= today;
}

export interface CohortCell {
  value: number | null;
  mature: boolean;
}

export interface CohortRow {
  cohort: string;
  userCount: number;
  cells: Record<LtvWindow, CohortCell>;
}

export function buildCohortRows(items: CohortLtvItem[] | undefined, today: string, limit = 12): CohortRow[] {
  const sorted = [...(items ?? [])].sort((a, b) => a.cohort.localeCompare(b.cohort)).slice(-limit);
  return sorted.map((c) => {
    const raw: Record<LtvWindow, number> = { 7: c.ltv7Days, 30: c.ltv30Days, 90: c.ltv90Days };
    const cells = {} as Record<LtvWindow, CohortCell>;
    for (const w of LTV_WINDOWS) {
      const mature = isCohortMature(c.cohort, w, today);
      cells[w] = { value: mature ? raw[w] : null, mature };
    }
    return { cohort: c.cohort, userCount: c.userCount, cells };
  });
}

export function purchaseCountLabel(count: number): string {
  return count >= 6 ? "6회 이상" : `${count}회`;
}

function cohortLabel(cohort: string): string {
  return `${cohort.slice(2, 4)}.${cohort.slice(5, 7)}`;
}

const CHART = {
  primary: "var(--color-primary)",
  primarySoft: "var(--color-primary-disabled)",
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

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-canvas p-4">
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span className="text-primary" aria-hidden>
          <Icon size={16} />
        </span>
        {label}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-gray-900">{value}</p>
      <p className="mt-1 text-xs text-gray-400">{hint}</p>
    </div>
  );
}

function StatSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-3" aria-label="불러오는 중">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-xl" />
      ))}
    </div>
  );
}

function DistributionChart({ data }: { data: PurchaseCountDistributionItem[] }) {
  const rows = [...data]
    .sort((a, b) => a.purchaseCount - b.purchaseCount)
    .map((d) => ({ name: purchaseCountLabel(d.purchaseCount), users: d.userCount, pct: d.percentage, repeat: d.purchaseCount >= 2 }));
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: CHART.tick }} axisLine={{ stroke: CHART.grid }} tickLine={false} />
          <YAxis
            tick={{ fontSize: 11, fill: CHART.tick }}
            axisLine={false}
            tickLine={false}
            width={44}
            tickFormatter={(v: number) => v.toLocaleString("ko-KR")}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            cursor={{ fill: "var(--color-surface-soft)" }}
            formatter={(value, _name, item): [string, string] => [
              `${typeof value === "number" ? value.toLocaleString("ko-KR") : "—"}명 (${(item.payload as { pct: number }).pct.toFixed(1)}%)`,
              "결제자",
            ]}
          />
          <Bar dataKey="users" radius={[4, 4, 0, 0]} maxBarSize={48}>
            {rows.map((r) => (
              <Cell key={r.name} fill={r.repeat ? CHART.primary : CHART.primarySoft} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function heatStyle(value: number | null, max: number): React.CSSProperties | undefined {
  if (value === null || max <= 0 || value <= 0) return undefined;
  const alpha = 0.08 + 0.42 * Math.min(1, value / max);
  return { backgroundColor: `color-mix(in srgb, var(--color-primary) ${Math.round(alpha * 100)}%, transparent)` };
}

function CohortTable({ rows }: { rows: CohortRow[] }) {
  const max = Math.max(0, ...rows.flatMap((r) => LTV_WINDOWS.map((w) => r.cells[w].value ?? 0)));
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500">
            <th className="py-2 pr-3 font-medium">가입 월</th>
            <th className="py-2 px-3 text-right font-medium">
              가입자 수
              <span className="block text-[11px] font-normal text-gray-400">그 달에 가입한 사람</span>
            </th>
            {LTV_WINDOWS.map((w) => (
              <th key={w} className="py-2 px-3 text-right font-medium">
                가입 후 {w}일 매출
                <span className="block text-[11px] font-normal text-gray-400">결제자 1인당, 부가세 제외</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...rows].reverse().map((r) => (
            <tr key={r.cohort} className="border-t border-border text-gray-900">
              <td className="py-2.5 pr-3 whitespace-nowrap font-medium tabular-nums">{cohortLabel(r.cohort)}</td>
              <td className="py-2.5 px-3 text-right tabular-nums">{r.userCount.toLocaleString("ko-KR")}명</td>
              {LTV_WINDOWS.map((w) => {
                const cell = r.cells[w];
                return (
                  <td key={w} className="py-1.5 px-1.5 text-right">
                    {cell.mature ? (
                      <span
                        className="block rounded-lg px-2 py-1 tabular-nums"
                        style={heatStyle(cell.value, max)}
                      >
                        {formatKrwFull(exVat(cell.value ?? 0))}
                      </span>
                    ) : (
                      <span className="block rounded-lg border border-dashed border-border px-2 py-1 text-xs text-gray-400">
                        집계 중
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RetentionCohorts() {
  const today = kstToday();
  const repurchase = useRepurchase();
  const ltv = useLtvCohorts();

  const cohortRows = useMemo(
    () =>
      buildCohortRows(
        ltv.data?.cohortData?.filter((c) => c.cohort >= HISTORY_START.slice(0, 7)),
        today,
        Infinity,
      ),
    [ltv.data, today],
  );
  const r = repurchase.data;

  return (
    <div className="space-y-4">
      <Card>
        <Card.Content className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-gray-900">재구매</h3>
              <p className="mt-1 text-xs text-gray-500">
                지금까지 한 번이라도 결제한 전체 결제자 기준(기간 제한 없음). 다시 결제하는 사람이 많을수록 광고 없이도 매출이 쌓입니다.
              </p>
            </div>
            {r && (
              <Chip size="sm" variant="soft">
                <Chip.Label>전체 결제자 {r.totalPurchasers.toLocaleString("ko-KR")}명</Chip.Label>
              </Chip>
            )}
          </div>

          {repurchase.isError && <QueryError title="재구매 지표를 불러오지 못했습니다" error={repurchase.error} />}

          {repurchase.isLoading ? (
            <>
              <StatSkeleton />
              <Skeleton className="h-[220px] w-full rounded-xl" />
            </>
          ) : r ? (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <StatCard
                  icon={Repeat}
                  label="재구매율"
                  value={`${r.repeatPurchaseRate.toFixed(1)}%`}
                  hint={`2회 이상 결제한 사람 ${r.repeatPurchasers.toLocaleString("ko-KR")}명 ÷ 전체 결제자`}
                />
                <StatCard
                  icon={Users}
                  label="평균 결제 횟수"
                  value={`${r.avgPurchaseCount.toFixed(1)}회`}
                  hint="결제자 1명이 지금까지 결제한 평균 횟수"
                />
                <StatCard
                  icon={CalendarClock}
                  label="평균 재구매 간격"
                  value={r.avgDaysBetweenPurchases > 0 ? `${r.avgDaysBetweenPurchases.toFixed(1)}일` : "—"}
                  hint="한 사람의 결제와 다음 결제 사이 평균 일수"
                />
              </div>
              <div>
                <p className="mb-2 text-xs text-gray-500">
                  결제 횟수별 결제자 수 · 진한 막대가 재구매자(2회 이상)
                </p>
                {r.purchaseCountDistribution.length > 0 ? (
                  <DistributionChart data={r.purchaseCountDistribution} />
                ) : (
                  <p className="rounded-xl bg-surface-soft p-4 text-sm text-gray-500">결제 횟수 분포 데이터가 없습니다.</p>
                )}
              </div>
            </>
          ) : null}
        </Card.Content>
      </Card>

      <Card>
        <Card.Content className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-gray-900">가입 월별 코호트: 가입 후 7·30·90일 매출</h3>
              <p className="mt-1 text-xs text-gray-500">
                2025년 5월 이후 전체 가입 월. 각 칸은 그 달에 가입해 결제한 사람 1명이 가입 후 N일 안에 쓴 평균 금액입니다. 색이 진할수록
                금액이 큽니다. 아직 N일이 지나지 않은 달은 &lsquo;집계 중&rsquo;으로 둡니다(오늘 {today} 기준).
              </p>
            </div>
            <Chip size="sm" variant="soft" color="accent">
              <Chip.Label>부가세 제외</Chip.Label>
            </Chip>
          </div>

          {ltv.isError && <QueryError title="가입 코호트 매출을 불러오지 못했습니다" error={ltv.error} />}

          {ltv.isLoading ? (
            <div className="space-y-2" aria-label="불러오는 중">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full rounded-lg" />
              ))}
            </div>
          ) : ltv.isError ? null : cohortRows.length === 0 ? (
            <p className="rounded-xl bg-surface-soft p-4 text-sm text-gray-500">표시할 가입 코호트가 없습니다.</p>
          ) : (
            <CohortTable rows={cohortRows} />
          )}
        </Card.Content>
      </Card>
    </div>
  );
}
