"use client";

import { useMemo, useState } from "react";
import { Alert, Card, Chip, Label, ListBox, Select, Skeleton } from "@heroui/react";
import { ArrowRight, TrendingDown, TrendingUp } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useMethodBreakdown } from "../hooks";
import {
  addMonths,
  estimateFees,
  exVat,
  FEE_CHANNEL_LABELS,
  FEE_RATES,
  formatKrw,
  formatKrwFull,
  formatPercent,
  kstToday,
  monthStart,
  type FeeChannel,
  type FeeEstimate,
} from "../lib/metrics";

export const MONTH_OPTIONS = 6;
export const TOP_PRODUCTS = 5;

export const FEE_NOTE =
  "채널별 수수료율(애플 13.6%, 구글 15%, PG 1.87%)을 곱한 추정치입니다. 부분 환불·정산 지연 건은 실제와 수천 원 차이가 날 수 있습니다.";

export interface MonthOption {
  key: string;
  label: string;
  current: boolean;
}

export function monthLabel(month: string): string {
  return `${month.slice(0, 4)}년 ${Number(month.slice(5, 7))}월`;
}

export function buildMonthOptions(today: string, count = MONTH_OPTIONS): MonthOption[] {
  const current = monthStart(today);
  return Array.from({ length: count }, (_, i) => {
    const key = addMonths(current, -i);
    return { key, label: i === 0 ? `${monthLabel(key)} (진행 중)` : monthLabel(key), current: i === 0 };
  });
}

export function effectiveFeeRate(estimate: FeeEstimate): number | null {
  return estimate.gross > 0 ? estimate.fee / estimate.gross : null;
}

export interface ProductRow {
  productName: string;
  netOfVat: number;
  count: number;
  share: number;
}

export function topProducts(
  byProduct: Array<{ productName: string | null; amount: number; count: number }> | undefined,
  limit = TOP_PRODUCTS,
): ProductRow[] {
  const rows = byProduct ?? [];
  const total = rows.reduce((s, p) => s + p.amount, 0);
  return [...rows]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit)
    .map((p) => ({
      productName: p.productName?.trim() || "상품명 없음",
      netOfVat: exVat(p.amount),
      count: p.count,
      share: total > 0 ? p.amount / total : 0,
    }));
}

const CHANNEL_COLORS: Record<FeeChannel, string> = {
  APPLE_IAP: "var(--color-primary)",
  GOOGLE_PLAY: "var(--color-success)",
  PG: "var(--color-border-strong)",
};

const CHANNEL_DOT: Record<FeeChannel, string> = {
  APPLE_IAP: "bg-primary",
  GOOGLE_PLAY: "bg-success",
  PG: "bg-[var(--color-border-strong)]",
};

const TOOLTIP_STYLE = {
  backgroundColor: "var(--color-canvas)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  boxShadow: "var(--box-shadow)",
  fontSize: 12,
} as const;

function pct(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

function rateLabel(rate: number): string {
  return `${Number((rate * 100).toFixed(2))}%`;
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

function SectionSkeleton() {
  return (
    <div className="space-y-4" aria-label="불러오는 중">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-[180px] w-full rounded-xl" />
      </div>
    </div>
  );
}

function MoneyFlow({ estimate }: { estimate: FeeEstimate }) {
  const vat = estimate.gross - estimate.netOfVat;
  const steps: Array<{ label: string; value: number; hint: string; estimated?: boolean; emphasis?: boolean }> = [
    { label: "고객 결제액", value: estimate.gross, hint: "부가세 포함" },
    { label: "부가세", value: vat, hint: "결제액의 1/11" },
    { label: "매출", value: estimate.netOfVat, hint: "부가세 제외" },
    { label: "예상 수수료", value: estimate.fee, hint: "애플·구글·PG", estimated: true },
    { label: "예상 정산액", value: estimate.settlement, hint: "결제액 − 수수료", estimated: true, emphasis: true },
  ];
  return (
    <ol className="grid grid-cols-2 gap-3 md:grid-cols-5" aria-label="돈 흐름">
      {steps.map((s, i) => (
        <li key={s.label} className={`relative min-w-0 ${s.emphasis ? "col-span-2 md:col-span-1" : ""}`}>
          <div
            className={`h-full rounded-xl border p-3 ${
              s.emphasis ? "border-primary/30 bg-primary/5" : "border-border bg-surface-soft"
            }`}
          >
            <p className="flex items-center gap-1 text-xs text-gray-500">
              {s.label}
              {s.estimated && (
                <span className="rounded-full bg-warning/10 px-1.5 py-px text-[10px] font-medium text-warning">추정</span>
              )}
            </p>
            <p
              className={`mt-1 text-lg font-semibold tabular-nums ${s.emphasis ? "text-primary" : "text-gray-900"}`}
              title={formatKrwFull(s.value)}
            >
              {formatKrw(s.value)}
            </p>
            <p className="text-[11px] text-gray-400">{s.hint}</p>
          </div>
          {i < steps.length - 1 && (
            <span className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-gray-300 md:block" aria-hidden>
              <ArrowRight size={12} />
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

function ChannelDonut({ estimate }: { estimate: FeeEstimate }) {
  const data = estimate.byChannel.map((c) => ({
    name: FEE_CHANNEL_LABELS[c.channel],
    channel: c.channel,
    value: c.gross,
    share: estimate.gross > 0 ? c.gross / estimate.gross : 0,
  }));
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="h-[180px] w-full" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={2} stroke="none">
              {data.map((d) => (
                <Cell key={d.channel} fill={CHANNEL_COLORS[d.channel]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value, name): [string, string] => [
                typeof value === "number" ? formatKrwFull(value) : "—",
                String(name),
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-gray-600">
        {data.map((d) => (
          <li key={d.channel} className="flex items-center gap-1.5">
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${CHANNEL_DOT[d.channel]}`} aria-hidden />
            {d.name} {pct(d.share)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RateCompare({
  current,
  previous,
  currentMonth,
  previousMonth,
}: {
  current: number | null;
  previous: number | null;
  currentMonth: string;
  previousMonth: string;
}) {
  const delta = current !== null && previous !== null ? current - previous : null;
  const Icon = delta !== null && delta > 0 ? TrendingUp : TrendingDown;
  const tone = delta === null || Math.abs(delta) < 0.0005 ? "text-gray-500" : delta > 0 ? "text-error" : "text-success";
  const message =
    delta === null
      ? "비교할 달의 결제가 없어 수수료율 변화를 계산할 수 없습니다."
      : Math.abs(delta) < 0.0005
        ? "채널 비중이 거의 그대로라 평균 수수료율도 같습니다."
        : delta > 0
          ? `수수료율이 높은 채널(구글·애플) 쪽으로 결제가 몰려, 결제액 100만원당 수수료가 약 ${formatKrwFull(delta * 1_000_000)} 더 나갑니다.`
          : `수수료율이 낮은 채널(PG) 쪽으로 결제가 옮겨가, 결제액 100만원당 수수료가 약 ${formatKrwFull(-delta * 1_000_000)} 덜 나갑니다.`;
  return (
    <div className="rounded-xl border border-border bg-surface-soft p-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div>
          <p className="text-xs text-gray-500">{monthLabel(previousMonth)} 평균 수수료율</p>
          <p className="text-base font-semibold tabular-nums text-gray-700">{previous === null ? "—" : pct(previous, 2)}</p>
        </div>
        <span className="text-gray-300" aria-hidden>
          <ArrowRight size={16} />
        </span>
        <div>
          <p className="text-xs text-gray-500">{monthLabel(currentMonth)} 평균 수수료율</p>
          <p className="text-base font-semibold tabular-nums text-gray-900">{current === null ? "—" : pct(current, 2)}</p>
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${tone}`}>
          {delta !== null && Math.abs(delta) >= 0.0005 && <Icon size={16} aria-hidden />}
          <span className="tabular-nums">{delta === null ? "—" : `${formatPercent(delta, 2)}p`}</span>
        </div>
      </div>
      <p className="mt-2 text-xs text-gray-500">{message}</p>
    </div>
  );
}

function ChannelTable({ estimate }: { estimate: FeeEstimate }) {
  const count = estimate.byChannel.reduce((s, c) => s + c.count, 0);
  const rate = effectiveFeeRate(estimate);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500">
            <th className="py-2 pr-3 font-medium">채널</th>
            <th className="py-2 px-3 text-right font-medium">결제 건수</th>
            <th className="py-2 px-3 text-right font-medium">
              결제액
              <span className="block text-[11px] font-normal text-gray-400">부가세 포함</span>
            </th>
            <th className="py-2 px-3 text-right font-medium">비중</th>
            <th className="py-2 px-3 text-right font-medium">수수료율</th>
            <th className="py-2 px-3 text-right font-medium">예상 수수료</th>
            <th className="py-2 pl-3 text-right font-medium">예상 정산액</th>
          </tr>
        </thead>
        <tbody>
          {estimate.byChannel.map((c) => (
            <tr key={c.channel} className="border-t border-border whitespace-nowrap text-gray-900">
              <td className="py-2.5 pr-3 whitespace-nowrap font-medium">
                <span className="flex items-center gap-2">
                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${CHANNEL_DOT[c.channel]}`} aria-hidden />
                  {FEE_CHANNEL_LABELS[c.channel]}
                </span>
              </td>
              <td className="py-2.5 px-3 text-right tabular-nums">{c.count.toLocaleString("ko-KR")}건</td>
              <td className="py-2.5 px-3 text-right tabular-nums">{formatKrwFull(c.gross)}</td>
              <td className="py-2.5 px-3 text-right tabular-nums">
                {estimate.gross > 0 ? pct(c.gross / estimate.gross) : "—"}
              </td>
              <td className="py-2.5 px-3 text-right tabular-nums">{pct(c.rate)}</td>
              <td className="py-2.5 px-3 text-right tabular-nums text-error">−{formatKrwFull(c.fee)}</td>
              <td className="py-2.5 pl-3 text-right tabular-nums">{formatKrwFull(c.gross - c.fee)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-border bg-surface-soft font-semibold whitespace-nowrap text-gray-900">
            <td className="py-2.5 pr-3">합계</td>
            <td className="py-2.5 px-3 text-right tabular-nums">{count.toLocaleString("ko-KR")}건</td>
            <td className="py-2.5 px-3 text-right tabular-nums">{formatKrwFull(estimate.gross)}</td>
            <td className="py-2.5 px-3 text-right tabular-nums">100%</td>
            <td className="py-2.5 px-3 text-right tabular-nums">{rate === null ? "—" : `평균 ${pct(rate, 2)}`}</td>
            <td className="py-2.5 px-3 text-right tabular-nums text-error">−{formatKrwFull(estimate.fee)}</td>
            <td className="py-2.5 pl-3 text-right tabular-nums text-primary">{formatKrwFull(estimate.settlement)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function ProductList({ rows }: { rows: ProductRow[] }) {
  if (rows.length === 0) {
    return <p className="rounded-xl bg-surface-soft p-4 text-sm text-gray-500">이 달에 팔린 상품이 없습니다.</p>;
  }
  const max = rows[0].netOfVat;
  return (
    <ol className="space-y-2" aria-label="매출 상위 상품">
      {rows.map((r, i) => (
        <li key={`${r.productName}-${i}`} className="space-y-1">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-baseline gap-2">
              <span className="w-4 shrink-0 text-xs font-semibold tabular-nums text-gray-400">{i + 1}</span>
              <span className="truncate font-medium text-gray-900">{r.productName}</span>
              <span className="shrink-0 text-xs text-gray-400">{r.count.toLocaleString("ko-KR")}건</span>
            </span>
            <span className="shrink-0 tabular-nums text-gray-900" title={formatKrwFull(r.netOfVat)}>
              {formatKrw(r.netOfVat)}
              <span className="ml-1.5 text-xs text-gray-400">{pct(r.share)}</span>
            </span>
          </div>
          <div className="ml-6 h-1.5 overflow-hidden rounded-full bg-surface-strong" aria-hidden>
            <div className="h-full rounded-full bg-primary/70" style={{ width: `${max > 0 ? (r.netOfVat / max) * 100 : 0}%` }} />
          </div>
        </li>
      ))}
    </ol>
  );
}

export function ChannelFees() {
  const options = useMemo(() => buildMonthOptions(kstToday()), []);
  const [month, setMonth] = useState(options[0].key);
  const previousMonth = addMonths(month, -1);
  const current = useMethodBreakdown(month);
  const previous = useMethodBreakdown(previousMonth);

  const estimate = useMemo(() => estimateFees(current.data?.byMethod ?? []), [current.data]);
  const previousEstimate = useMemo(() => estimateFees(previous.data?.byMethod ?? []), [previous.data]);
  const products = useMemo(() => topProducts(current.data?.byProduct), [current.data]);
  const selected = options.find((o) => o.key === month) ?? options[0];

  return (
    <div className="space-y-4">
      <Card>
        <Card.Content className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900">결제액에서 실제로 남는 돈</h3>
              <p className="mt-1 text-xs text-gray-500">
                {monthLabel(month)}
                {selected.current && " (진행 중, 오늘까지 누적)"} · KST 결제일 기준, 환불된 결제 제외
              </p>
            </div>
            <Select
              className="w-56"
              value={month}
              onChange={(key) => {
                if (key != null) setMonth(String(key));
              }}
            >
              <Label>조회 월</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {options.map((o) => (
                    <ListBox.Item key={o.key} id={o.key} textValue={o.label}>
                      {o.label}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          </div>

          {current.isError && <QueryError title="결제 채널 내역을 불러오지 못했습니다" error={current.error} />}

          {current.isLoading ? (
            <SectionSkeleton />
          ) : current.isError ? null : estimate.gross <= 0 ? (
            <p className="rounded-xl bg-surface-soft p-4 text-sm text-gray-500">
              {monthLabel(month)}에는 집계된 결제가 없습니다.
            </p>
          ) : (
            <>
              <MoneyFlow estimate={estimate} />
              <p className="text-xs text-gray-500">{FEE_NOTE}</p>

              <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
                <ChannelTable estimate={estimate} />
                <ChannelDonut estimate={estimate} />
              </div>

              {previous.isError ? (
                <QueryError title="전월 내역을 불러오지 못해 수수료율 비교는 비워 둡니다" error={previous.error} />
              ) : previous.isLoading ? (
                <Skeleton className="h-20 w-full rounded-xl" aria-label="전월 비교 불러오는 중" />
              ) : (
                <RateCompare
                  current={effectiveFeeRate(estimate)}
                  previous={effectiveFeeRate(previousEstimate)}
                  currentMonth={month}
                  previousMonth={previousMonth}
                />
              )}
            </>
          )}
        </Card.Content>
      </Card>

      <Card>
        <Card.Content className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-gray-900">많이 팔린 상품 Top {TOP_PRODUCTS}</h3>
              <p className="mt-1 text-xs text-gray-500">{monthLabel(month)} 매출 기준, 비중은 그 달 전체 결제액 대비</p>
            </div>
            <Chip size="sm" variant="soft" color="accent">
              <Chip.Label>부가세 제외</Chip.Label>
            </Chip>
          </div>
          {current.isLoading ? (
            <div className="space-y-2" aria-label="불러오는 중">
              {Array.from({ length: TOP_PRODUCTS }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full rounded-lg" />
              ))}
            </div>
          ) : current.isError ? (
            <p className="text-sm text-gray-500">결제 내역을 불러오지 못해 상품 순위를 표시할 수 없습니다.</p>
          ) : (
            <ProductList rows={products} />
          )}
        </Card.Content>
      </Card>

      <p className="text-xs text-gray-400">
        수수료율 출처: 애플 {rateLabel(FEE_RATES.APPLE_IAP)}·구글 {rateLabel(FEE_RATES.GOOGLE_PLAY)}는 2026-09-01~10-17 실제 정산 내역, PG{" "}
        {rateLabel(FEE_RATES.PG)}는 웰컴페이먼츠 영세 구간 1.7% + 수수료 부가세. 결제수단이 비어 있거나 알 수 없는 건은 PG로 계산합니다.
      </p>
    </div>
  );
}
