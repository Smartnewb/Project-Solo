"use client";

import { useMemo, useState } from "react";
import { Alert, Card, Chip, Label, ListBox, Select, Skeleton } from "@heroui/react";
import { Lightbulb } from "lucide-react";
import type { ProductSalesItem } from "../../types";
import { useProductSales } from "../hooks";
import { exVat, formatKrw, formatKrwFull, kstToday } from "../lib/metrics";
import { buildMonthOptions, monthLabel } from "./ChannelFees";

export const TOP_HIGHLIGHT = 3;
export const LOW_SALES_MAX = 2;
export const PARETO_SHARE = 0.8;

type ProductInput = Pick<ProductSalesItem, "productName" | "salesCount" | "totalRevenue" | "uniqueBuyers">;

export interface ProductMixRow {
  productName: string;
  salesCount: number;
  uniqueBuyers: number;
  netOfVat: number;
  share: number;
  avgPerSale: number;
  lowSeller: boolean;
}

export function buildProductRows(products: ProductInput[] | undefined): ProductMixRow[] {
  const rows = products ?? [];
  const total = rows.reduce((s, p) => s + p.totalRevenue, 0);
  return [...rows]
    .sort((a, b) => b.totalRevenue - a.totalRevenue || b.salesCount - a.salesCount)
    .map((p) => ({
      productName: p.productName?.trim() || "상품명 없음",
      salesCount: p.salesCount,
      uniqueBuyers: p.uniqueBuyers,
      netOfVat: exVat(p.totalRevenue),
      share: total > 0 ? p.totalRevenue / total : 0,
      avgPerSale: p.salesCount > 0 ? exVat(p.totalRevenue) / p.salesCount : 0,
      lowSeller: p.salesCount <= LOW_SALES_MAX,
    }));
}

export function productsForShare(rows: ProductMixRow[], target = PARETO_SHARE): number {
  let acc = 0;
  for (let i = 0; i < rows.length; i++) {
    acc += rows[i].share;
    if (acc >= target - 1e-9) return i + 1;
  }
  return rows.length;
}

export function describeMix(rows: ProductMixRow[]): string {
  const total = rows.reduce((s, r) => s + r.netOfVat, 0);
  if (rows.length === 0 || total <= 0) return "이 달에는 집계된 상품 매출이 없습니다.";
  const top = rows[0];
  const n = productsForShare(rows);
  const low = rows.filter((r) => r.lowSeller).length;
  const head = `1위 '${top.productName}'이 매출의 ${pct(top.share)}를 차지하고, ${rows.length}개 상품 중 ${n}개가 매출의 80%를 만듭니다.`;
  const tail =
    low > 0
      ? ` ${LOW_SALES_MAX}건 이하로 팔린 상품 ${low}개는 가격·구성 점검 대상입니다.`
      : ` ${LOW_SALES_MAX}건 이하로 팔린 상품은 없습니다.`;
  return head + tail;
}

function pct(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
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

function TableSkeleton() {
  return (
    <div className="space-y-2" aria-label="불러오는 중">
      <Skeleton className="h-16 w-full rounded-xl" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-full rounded-lg" />
      ))}
    </div>
  );
}

function Takeaway({ rows }: { rows: ProductMixRow[] }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-surface-soft p-4">
      <span className="mt-0.5 shrink-0 text-primary" aria-hidden>
        <Lightbulb size={20} />
      </span>
      <p className="text-sm font-medium text-gray-900">{describeMix(rows)}</p>
    </div>
  );
}

function ProductTable({ rows, totalUniqueBuyers }: { rows: ProductMixRow[]; totalUniqueBuyers: number }) {
  const totalCount = rows.reduce((s, r) => s + r.salesCount, 0);
  const totalNet = rows.reduce((s, r) => s + r.netOfVat, 0);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500">
            <th className="py-2 pr-3 font-medium">상품명</th>
            <th className="py-2 px-3 text-right font-medium">판매 건수</th>
            <th className="py-2 px-3 text-right font-medium">구매자 수</th>
            <th className="py-2 px-3 text-right font-medium">
              매출
              <span className="block text-[11px] font-normal text-gray-400">부가세 제외</span>
            </th>
            <th className="py-2 px-3 text-right font-medium">매출 비중</th>
            <th className="py-2 pl-3 text-right font-medium">
              건당 평균
              <span className="block text-[11px] font-normal text-gray-400">매출 ÷ 판매 건수</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const top = i < TOP_HIGHLIGHT;
            return (
              <tr
                key={`${r.productName}-${i}`}
                className={`border-t border-border whitespace-nowrap text-gray-900 ${top ? "bg-primary/5" : ""}`}
              >
                <td className="py-2.5 pr-3 font-medium">
                  <span className="flex items-center gap-2">
                    <span
                      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums ${
                        top ? "bg-primary/10 text-primary" : "bg-surface-strong text-gray-500"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="max-w-[260px] truncate">{r.productName}</span>
                    {r.lowSeller && (
                      <Chip size="sm" variant="soft" color="warning">
                        <Chip.Label>거의 안 팔림</Chip.Label>
                      </Chip>
                    )}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums">{r.salesCount.toLocaleString("ko-KR")}건</td>
                <td className="py-2.5 px-3 text-right tabular-nums">{r.uniqueBuyers.toLocaleString("ko-KR")}명</td>
                <td className="py-2.5 px-3 text-right tabular-nums" title={formatKrwFull(r.netOfVat)}>
                  {formatKrw(r.netOfVat)}
                </td>
                <td className="py-2.5 px-3 text-right">
                  <span className="inline-flex items-center justify-end gap-2">
                    <span className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-strong" aria-hidden>
                      <span className="block h-full rounded-full bg-primary/70" style={{ width: `${r.share * 100}%` }} />
                    </span>
                    <span className="w-12 tabular-nums">{pct(r.share)}</span>
                  </span>
                </td>
                <td className="py-2.5 pl-3 text-right tabular-nums">{formatKrwFull(r.avgPerSale)}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-border bg-surface-soft font-semibold whitespace-nowrap text-gray-900">
            <td className="py-2.5 pr-3">합계</td>
            <td className="py-2.5 px-3 text-right tabular-nums">{totalCount.toLocaleString("ko-KR")}건</td>
            <td className="py-2.5 px-3 text-right tabular-nums">
              {totalUniqueBuyers.toLocaleString("ko-KR")}명
              <span className="block text-[11px] font-normal text-gray-400">중복 제외</span>
            </td>
            <td className="py-2.5 px-3 text-right tabular-nums" title={formatKrwFull(totalNet)}>
              {formatKrw(totalNet)}
            </td>
            <td className="py-2.5 px-3 text-right tabular-nums">100%</td>
            <td className="py-2.5 pl-3 text-right tabular-nums">
              {totalCount > 0 ? formatKrwFull(totalNet / totalCount) : "—"}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export function ProductMix() {
  const options = useMemo(() => buildMonthOptions(kstToday()), []);
  const [month, setMonth] = useState(options[0].key);
  const query = useProductSales(month);
  const rows = useMemo(() => buildProductRows(query.data?.products), [query.data]);
  const selected = options.find((o) => o.key === month) ?? options[0];

  return (
    <Card>
      <Card.Content className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="flex flex-wrap items-center gap-2 text-base font-semibold text-gray-900">
              상품별 판매
              <Chip size="sm" variant="soft" color="accent">
                <Chip.Label>부가세 제외</Chip.Label>
              </Chip>
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              {monthLabel(month)}
              {selected.current && " (진행 중, 오늘까지 누적)"} · 매출 순, 상위 {TOP_HIGHLIGHT}개 강조 · {LOW_SALES_MAX}건
              이하는 &apos;거의 안 팔림&apos;
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

        {query.isError && <QueryError title="상품별 판매 현황을 불러오지 못했습니다" error={query.error} />}

        {query.isLoading ? (
          <TableSkeleton />
        ) : query.isError ? null : rows.length === 0 ? (
          <p className="rounded-xl bg-surface-soft p-4 text-sm text-gray-500">{monthLabel(month)}에는 팔린 상품이 없습니다.</p>
        ) : (
          <>
            <Takeaway rows={rows} />
            <ProductTable rows={rows} totalUniqueBuyers={query.data?.totalUniqueBuyers ?? 0} />
            <p className="text-xs text-gray-400">
              금액은 고객 결제액 ÷ 1.1(부가세 제외)이며 환불된 결제는 제외됩니다. 구매자 수는 상품별 중복 제외, 합계는 그 달 전체
              구매자 중복 제외입니다.
            </p>
          </>
        )}
      </Card.Content>
    </Card>
  );
}
