"use client";

import { useMemo } from "react";
import { Alert, Card, Chip, Skeleton } from "@heroui/react";
import { CalendarClock, Gem, Hourglass, MousePointerClick, type LucideIcon } from "lucide-react";
import type {
  CohortConversionItem,
  ConversionByFeatureItem,
  DaysDistributionItem,
  GemBalanceDistributionItem,
  LastFeatureItem,
} from "../../types";
import { BEHAVIOR_WINDOW_DAYS, useFeatureFunnel, useFirstPurchase, useGemTrigger } from "../hooks";
import { diffDays, kstToday } from "../lib/metrics";
import { featureLabel } from "./RevenueConcentration";

const nameOf = (r: { featureType: string; featureName?: string }) =>
  r.featureName && r.featureName !== r.featureType ? r.featureName : featureLabel(r.featureType);

export const DAYS_BUCKET_LABELS: Record<number, string> = {
  1: "당일~1일",
  3: "2~3일",
  7: "4~7일",
  14: "8~14일",
  30: "15~30일",
  60: "31~60일",
  90: "61~90일",
  91: "90일 초과",
};

export function daysBucketLabel(days: number): string {
  return DAYS_BUCKET_LABELS[days] ?? `${days}일`;
}

export const LOW_BALANCE_RANGES = ["0-5", "6-10"] as const;

export function lowBalanceShare(distribution: GemBalanceDistributionItem[] | undefined): number | null {
  if (!distribution || distribution.length === 0) return null;
  const low = distribution
    .filter((d) => (LOW_BALANCE_RANGES as readonly string[]).includes(d.balanceRange))
    .reduce((s, d) => s + d.percentage, 0);
  return Math.round(low * 100) / 100;
}

// 가입 후 N일 안에 첫 결제한 사람의 누적 비율(%). 버킷은 (이전 상한, days] 구간이다.
export function cumulativeWithinDays(distribution: DaysDistributionItem[] | undefined, days: number): number | null {
  if (!distribution || distribution.length === 0) return null;
  const within = distribution.filter((d) => d.days <= days).reduce((s, d) => s + d.percentage, 0);
  return Math.round(within * 100) / 100;
}

export function sortByConversionRate(rows: ConversionByFeatureItem[] | undefined): ConversionByFeatureItem[] {
  return [...(rows ?? [])].sort((a, b) => b.conversionRate - a.conversionRate || b.usageCount - a.usageCount);
}

export const COHORT_GRACE_DAYS = 14;

export function cohortWeekStart(cohortWeek: string, today: string): string | null {
  const m = /^(\d{2})\/(\d{2})/.exec(cohortWeek);
  if (!m) return null;
  const year = Number(today.slice(0, 4));
  const sameYear = `${year}-${m[1]}-${m[2]}`;
  return sameYear > today ? `${year - 1}-${m[1]}-${m[2]}` : sameYear;
}

export function isCohortAccumulating(cohortWeek: string, today: string, graceDays = COHORT_GRACE_DAYS): boolean {
  const start = cohortWeekStart(cohortWeek, today);
  return start !== null && diffDays(start, today) < graceDays;
}

export function formatHours(hours: number): string {
  if (!Number.isFinite(hours) || hours < 0) return "—";
  if (hours < 1) return `${Math.round(hours * 60)}분`;
  if (hours < 48) return `${hours.toFixed(1)}시간`;
  return `${(hours / 24).toFixed(1)}일`;
}

function pct(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

function count(value: number): string {
  return value.toLocaleString("ko-KR");
}

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

function RowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-label="불러오는 중">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-full rounded-lg" />
      ))}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl bg-surface-soft p-4 text-sm text-gray-500">{children}</p>;
}

function SectionTitle({
  icon: Icon,
  title,
  description,
  aside,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary" aria-hidden>
          <Icon size={15} />
        </span>
        <div>
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <p className="mt-1 text-xs text-gray-500">{description}</p>
        </div>
      </div>
      {aside}
    </div>
  );
}

function ShareBars({
  rows,
  ariaLabel,
  valueLabel,
}: {
  rows: Array<{ key: string; name: string; share: number; count: number; extra?: string; emphasis?: boolean }>;
  ariaLabel: string;
  valueLabel: (count: number) => string;
}) {
  const max = Math.max(0, ...rows.map((r) => r.share));
  return (
    <ol className="space-y-2" aria-label={ariaLabel}>
      {rows.map((r) => (
        <li key={r.key} className="space-y-1">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-baseline gap-2">
              <span className={`truncate font-medium ${r.emphasis ? "text-primary" : "text-gray-900"}`}>{r.name}</span>
              <span className="shrink-0 text-xs text-gray-400">{valueLabel(r.count)}</span>
            </span>
            <span className="shrink-0 tabular-nums text-gray-900">
              {pct(r.share)}
              {r.extra && <span className="ml-1.5 text-xs text-gray-400">{r.extra}</span>}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-strong" aria-hidden>
            <div
              className={`h-full rounded-full ${r.emphasis ? "bg-primary" : "bg-primary/60"}`}
              style={{ width: `${max > 0 ? (r.share / max) * 100 : 0}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}

function Num({ children }: { children: React.ReactNode }) {
  return <span className="whitespace-nowrap tabular-nums">{children}</span>;
}

function Takeaway({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-medium text-gray-900">{children}</p>
  );
}

function LastFeatureList({ rows }: { rows: LastFeatureItem[] }) {
  const sorted = [...rows].sort((a, b) => b.purchaseCount - a.purchaseCount);
  return (
    <ShareBars
      ariaLabel="결제 직전 마지막 기능"
      rows={sorted.map((r, i) => ({
        key: r.featureType,
        name: nameOf(r),
        share: r.percentage,
        count: r.purchaseCount,
        extra: `평균 ${formatHours(r.avgTimeToPurchase)} 뒤 결제`,
        emphasis: i === 0,
      }))}
      valueLabel={(c) => `${count(c)}건`}
    />
  );
}

function ConversionTable({ rows }: { rows: ConversionByFeatureItem[] }) {
  const best = rows[0];
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500">
            <th className="py-2 pr-3 font-medium">기능</th>
            <th className="py-2 px-3 text-right font-medium">
              사용 건수
              <span className="block text-[11px] font-normal text-gray-400">구슬을 쓴 횟수</span>
            </th>
            <th className="py-2 px-3 text-right font-medium">
              24시간 안 결제
              <span className="block text-[11px] font-normal text-gray-400">그 뒤 하루 안에 충전</span>
            </th>
            <th className="py-2 pl-3 text-right font-medium">결제율</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const isBest = best && r.featureType === best.featureType && r.conversionRate > 0;
            return (
              <tr key={r.featureType} className={`border-t border-border text-gray-900 ${isBest ? "bg-primary/5" : ""}`}>
                <td className="py-2.5 pr-3 whitespace-nowrap font-medium">
                  {nameOf(r)}
                  {isBest && (
                    <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                      가장 높음
                    </span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums">{count(r.usageCount)}건</td>
                <td className="py-2.5 px-3 text-right tabular-nums">{count(r.purchaseWithin24h)}건</td>
                <td className={`py-2.5 pl-3 text-right tabular-nums ${isBest ? "font-semibold text-primary" : ""}`}>
                  {pct(r.conversionRate)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function GemBalanceBars({ distribution }: { distribution: GemBalanceDistributionItem[] }) {
  const max = Math.max(0, ...distribution.map((d) => d.percentage));
  return (
    <ol className="grid grid-cols-3 gap-2 sm:grid-cols-6" aria-label="결제 시점 구슬 잔액 분포">
      {distribution.map((d) => {
        const low = (LOW_BALANCE_RANGES as readonly string[]).includes(d.balanceRange);
        return (
          <li key={d.balanceRange} className="flex flex-col items-center gap-1">
            <span className="text-sm font-semibold tabular-nums text-gray-900">{pct(d.percentage)}</span>
            <div className="flex h-24 w-full items-end rounded-lg bg-surface-soft px-2 py-1" aria-hidden>
              <div
                className={`w-full rounded-md ${low ? "bg-primary" : "bg-primary/35"}`}
                style={{ height: `${max > 0 ? Math.max(4, (d.percentage / max) * 100) : 4}%` }}
              />
            </div>
            <span className="text-xs text-gray-500">{d.balanceRange}개</span>
            <span className="text-[11px] tabular-nums text-gray-400">{count(d.purchaseCount)}건</span>
          </li>
        );
      })}
    </ol>
  );
}

function DaysBars({ distribution }: { distribution: DaysDistributionItem[] }) {
  const sorted = [...distribution].sort((a, b) => a.days - b.days);
  const max = Math.max(0, ...sorted.map((d) => d.percentage));
  return (
    <ol className="grid grid-cols-4 gap-2 sm:grid-cols-8" aria-label="가입 후 첫 결제까지 걸린 일수 분포">
      {sorted.map((d) => {
        const quick = d.days <= 7;
        return (
          <li key={d.days} className="flex flex-col items-center gap-1">
            <span className="text-sm font-semibold tabular-nums text-gray-900">{pct(d.percentage)}</span>
            <div className="flex h-24 w-full items-end rounded-lg bg-surface-soft px-1.5 py-1" aria-hidden>
              <div
                className={`w-full rounded-md ${quick ? "bg-primary" : "bg-primary/35"}`}
                style={{ height: `${max > 0 ? Math.max(4, (d.percentage / max) * 100) : 4}%` }}
              />
            </div>
            <span className="text-center text-xs text-gray-500">{daysBucketLabel(d.days)}</span>
            <span className="text-[11px] tabular-nums text-gray-400">{count(d.userCount)}명</span>
          </li>
        );
      })}
    </ol>
  );
}

function CohortTable({ rows, today }: { rows: CohortConversionItem[]; today: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[440px] text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500">
            <th className="py-2 pr-3 font-medium">가입 주</th>
            <th className="py-2 px-3 text-right font-medium">가입자</th>
            <th className="py-2 px-3 text-right font-medium">결제자</th>
            <th className="py-2 pl-3 text-right font-medium">전환율</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const accumulating = isCohortAccumulating(r.cohortWeek, today);
            return (
              <tr key={r.cohortWeek} className={`border-t border-border ${accumulating ? "text-gray-400" : "text-gray-900"}`}>
                <td className="py-2.5 pr-3 whitespace-nowrap font-medium tabular-nums">
                  {r.cohortWeek}
                  {accumulating && <span className="ml-1 text-xs font-normal">(집계 중)</span>}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums">{count(r.totalUsers)}명</td>
                <td className="py-2.5 px-3 text-right tabular-nums">{count(r.convertedUsers)}명</td>
                <td className="py-2.5 pl-3 text-right tabular-nums">{pct(r.conversionRate)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function PurchaseTriggers() {
  const today = kstToday();
  const funnel = useFeatureFunnel();
  const gem = useGemTrigger();
  const first = useFirstPurchase();

  const conversionRows = useMemo(() => sortByConversionRate(funnel.data?.conversionByFeature), [funnel.data]);
  const lowShare = useMemo(() => lowBalanceShare(gem.data?.distribution), [gem.data]);
  const within7 = useMemo(() => cumulativeWithinDays(first.data?.daysDistribution, 7), [first.data]);
  const best = conversionRows[0];

  return (
    <div className="space-y-4">
      <Card>
        <Card.Content className="space-y-5">
          <SectionTitle
            icon={MousePointerClick}
            title={`결제 직전에 쓴 기능 (최근 ${BEHAVIOR_WINDOW_DAYS}일)`}
            description="결제하기 직전에 마지막으로 구슬을 쓴 기능과, 그 기능을 쓴 뒤 결제까지 평균 얼마나 걸렸는지입니다."
            aside={
              funnel.data && (
                <Chip size="sm" variant="soft">
                  <Chip.Label>기능 사용 뒤 결제 {count(funnel.data.totalPurchases)}건</Chip.Label>
                </Chip>
              )
            }
          />

          {funnel.isError && <QueryError title="기능→결제 흐름을 불러오지 못했습니다" error={funnel.error} />}

          {funnel.isLoading ? (
            <RowsSkeleton />
          ) : funnel.isError ? null : !funnel.data || funnel.data.lastFeatureBeforePurchase.length === 0 ? (
            <Empty>이 기간에 기능 사용 뒤 이어진 결제가 없습니다.</Empty>
          ) : (
            <>
              <LastFeatureList rows={funnel.data.lastFeatureBeforePurchase} />
              <p className="text-xs text-gray-400">
                비율은 기능 사용 뒤 이어진 결제 {count(funnel.data.totalPurchases)}건 중 비중입니다. 시간은 마지막 사용부터 결제까지 평균입니다.
              </p>
            </>
          )}

          <div className="space-y-3 border-t border-border pt-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-900">기능별 24시간 안 결제율</h4>
              <p className="mt-1 text-xs text-gray-500">
                결제율이 높은 기능이 충전 안내(페이월)를 붙였을 때 효과가 가장 큰 자리입니다.
              </p>
            </div>
            {funnel.isLoading ? (
              <RowsSkeleton rows={4} />
            ) : funnel.isError ? null : conversionRows.length === 0 ? (
              <Empty>이 기간에 구슬을 쓴 기능이 없습니다.</Empty>
            ) : (
              <>
                {best && best.conversionRate > 0 && (
                  <Takeaway>
                    {nameOf(best)} 뒤 하루 안에 충전하는 비율이 <Num>{pct(best.conversionRate)}로</Num> 가장 높습니다. 충전 안내는
                    여기에 붙이는 게 가장 효과적입니다.
                  </Takeaway>
                )}
                <ConversionTable rows={conversionRows} />
              </>
            )}
          </div>
        </Card.Content>
      </Card>

      <Card>
        <Card.Content className="space-y-4">
          <SectionTitle
            icon={Gem}
            title={`결제 때 남아 있던 구슬 (최근 ${BEHAVIOR_WINDOW_DAYS}일)`}
            description="충전 직전 구슬 잔액입니다. 진한 막대가 10개 이하일 때 충전한 결제입니다."
            aside={
              gem.data && gem.data.totalPurchases > 0 && (
                <Chip size="sm" variant="soft">
                  <Chip.Label>결제 {count(gem.data.totalPurchases)}건</Chip.Label>
                </Chip>
              )
            }
          />

          {gem.isError && <QueryError title="결제 시점 구슬 잔액을 불러오지 못했습니다" error={gem.error} />}

          {gem.isLoading ? (
            <Skeleton className="h-[160px] w-full rounded-xl" aria-label="불러오는 중" />
          ) : gem.isError ? null : !gem.data || gem.data.totalPurchases === 0 ? (
            <Empty>이 기간에 결제가 없습니다.</Empty>
          ) : (
            <>
              {lowShare !== null && (
                <Takeaway>
                  <Num>{pct(lowShare)}가</Num> 구슬 10개 이하일 때 충전합니다. 결제자 절반 기준(중앙값) 잔액은{" "}
                  <Num>{count(gem.data.medianBalance)}개입니다.</Num>
                </Takeaway>
              )}
              <GemBalanceBars distribution={gem.data.distribution} />
              <dl className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500">
                <div className="flex items-baseline gap-1.5">
                  <dt>중앙값</dt>
                  <dd className="font-medium tabular-nums text-gray-900">{count(gem.data.medianBalance)}개</dd>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <dt>평균</dt>
                  <dd className="font-medium tabular-nums text-gray-900">{gem.data.averageBalance.toFixed(1)}개</dd>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <dt>가장 흔한 잔액</dt>
                  <dd className="font-medium tabular-nums text-gray-900">{count(gem.data.modeBalance)}개</dd>
                </div>
              </dl>
              <p className="text-xs text-gray-400">잔액이 많은데 충전한 결제는 할인·묶음 상품에 반응한 결제일 가능성이 큽니다.</p>
            </>
          )}
        </Card.Content>
      </Card>

      <Card>
        <Card.Content className="space-y-5">
          <SectionTitle
            icon={Hourglass}
            title="가입 후 첫 결제까지 (전체 기간)"
            description="한 번이라도 결제한 사람이 가입 뒤 며칠 만에 처음 결제했는지입니다. 진한 막대가 7일 안 결제입니다."
            aside={
              first.data && first.data.totalFirstPurchaseUsers > 0 && (
                <Chip size="sm" variant="soft">
                  <Chip.Label>첫 결제자 {count(first.data.totalFirstPurchaseUsers)}명</Chip.Label>
                </Chip>
              )
            }
          />

          {first.isError && <QueryError title="첫 결제 데이터를 불러오지 못했습니다" error={first.error} />}

          {first.isLoading ? (
            <Skeleton className="h-[160px] w-full rounded-xl" aria-label="불러오는 중" />
          ) : first.isError ? null : !first.data || first.data.totalFirstPurchaseUsers === 0 ? (
            <Empty>아직 결제한 사람이 없습니다.</Empty>
          ) : (
            <>
              {within7 !== null && (
                <Takeaway>
                  첫 결제자의 <Num>{pct(within7)}가</Num> 가입 7일 안에 결제합니다. 첫 주에 결제로 이어지지 않으면 그
                  뒤에는 드뭅니다.
                </Takeaway>
              )}
              <DaysBars distribution={first.data.daysDistribution} />
              <dl className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500">
                <div className="flex items-baseline gap-1.5">
                  <dt>중앙값</dt>
                  <dd className="font-medium tabular-nums text-gray-900">{count(first.data.medianDays)}일</dd>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <dt>평균</dt>
                  <dd className="font-medium tabular-nums text-gray-900">{first.data.averageDays.toFixed(1)}일</dd>
                </div>
              </dl>
              <p className="text-xs text-gray-400">평균은 몇 달 뒤 처음 결제한 소수 때문에 중앙값보다 크게 나옵니다. 보통 사람은 중앙값 쪽입니다.</p>
            </>
          )}

          <div className="space-y-3 border-t border-border pt-4">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-primary" aria-hidden>
                <CalendarClock size={15} />
              </span>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">가입 주별 결제 전환율 (최근 12주)</h4>
                <p className="mt-1 text-xs text-gray-500">
                  그 주에 가입한 사람 중 지금까지 한 번이라도 결제한 비율입니다. 가입 {COHORT_GRACE_DAYS}일이 안 지난 주는 아직 결제할 시간이 덜 지나 낮게 보입니다(집계 중).
                </p>
              </div>
            </div>
            {first.isLoading ? (
              <RowsSkeleton rows={6} />
            ) : first.isError ? null : !first.data || first.data.cohortConversion.length === 0 ? (
              <Empty>최근 12주 가입자가 없습니다.</Empty>
            ) : (
              <CohortTable rows={first.data.cohortConversion} today={today} />
            )}
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
