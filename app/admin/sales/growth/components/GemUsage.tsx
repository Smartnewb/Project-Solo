"use client";

import { useMemo } from "react";
import { Alert, Card, Chip, Skeleton } from "@heroui/react";
import { Clock, Gift, Lightbulb } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { GemSourceItem } from "../../types";
import { BEHAVIOR_WINDOW_DAYS, useGemConsumption, useGemEconomy } from "../hooks";

export const FEATURE_LABELS: Record<string, string> = {
  LIKE: "좋아요",
  SUPER_LIKE: "슈퍼 좋아요",
  CHAT_OPEN: "채팅 열기",
  REMATCHING: "재매칭",
  LETTER_LIKE: "편지 좋아요",
  PROFILE_BOOST: "프로필 부스트",
  PURCHASE: "구매",
  SIGNUP_BONUS: "가입 보너스",
  ADMIN_GRANT: "관리자 지급",
  REFUND: "환불",
  EVENT_REWARD: "이벤트 보상",
  PAYMENT: "결제(구매)",
  LIKE_PROFILE: "프로필 좋아요",
  LIKE_MESSAGE: "좋아요 메시지",
  LIKE_WITH_LETTER: "편지 좋아요",
  CHAT_START: "채팅 시작",
  PROFILE_OPEN: "프로필 열기",
  OPEN_INSTAGRAM: "인스타그램 열기",
  PREMIUM_FILTER: "프리미엄 필터",
  FILTERED_REMATCHING: "필터 재매칭",
  OLD_REMATCHING: "구 재매칭",
  ADMIN_BULK_GRANT: "관리자 일괄 지급",
  WELCOME_REWARD: "웰컴 보상",
  ROULETTE: "룰렛",
  REFERRAL_INVITER: "추천인 보상",
  REFERRAL_INVITEE: "피추천인 보상",
  COMMUNITY_FIRST_POST: "커뮤니티 첫 글",
  UNIVERSITY_VERIFICATION: "대학교 인증",
  CARD_NEWS_READ: "카드뉴스 읽기",
  DAILY_ATTENDANCE: "출석 보상",
  INVITE_BONUS: "초대 보너스",
  AD_REWARD: "광고 보상",
  COMEBACK_REWARD: "복귀 보상",
  STORE_REVIEW_REWARD: "스토어 리뷰 보상",
  EVERYTIME_PROMO_REWARD: "에브리타임 프로모션",
  INSTAGRAM_REGISTRATION: "인스타그램 등록",
  FEEDBACK_RESPONSE: "피드백 응답",
  MEETING_NOSHOW_COMPENSATION: "미팅 노쇼 보상",
  APPLE_IAP_REFUND_REVERSED: "Apple 환불 취소 복원",
  APPLE_IAP_REFUND: "Apple 환불 회수",
  GOOGLE_PLAY_REFUND: "Google 환불 회수",
  ADMIN_DEDUCT: "관리자 차감",
  PERSONALITY_VIEW: "성격 보기",
  AI_CHAT_SESSION: "AI 채팅",
  COMMUNITY_CONTACT_REQUEST: "커뮤니티 바로쪽지",
  GLOBAL_MATCHING_LIKE: "글로벌 매칭 좋아요",
  PROFILE_VIEWER_REVEAL: "프로필 방문자 확인",
};

export const PURCHASE_SOURCES = new Set(["PURCHASE", "PAYMENT", "APPLE_IAP_REFUND_REVERSED"]);

export function featureLabel(code: string): string {
  return FEATURE_LABELS[code] ?? code;
}

export function isPurchaseSource(code: string): boolean {
  return PURCHASE_SOURCES.has(code);
}

export interface FeatureRow {
  code: string;
  label: string;
  gems: number;
  uses: number;
  users: number;
  share: number;
  gemsPerUse: number;
}

export function buildFeatureRows(
  byFeature: Array<{ featureType: string; usageCount: number; totalGemsConsumed: number; uniqueUsers: number }> | undefined,
): FeatureRow[] {
  const rows = byFeature ?? [];
  const total = rows.reduce((s, f) => s + f.totalGemsConsumed, 0);
  return [...rows]
    .filter((f) => f.totalGemsConsumed > 0)
    .sort((a, b) => b.totalGemsConsumed - a.totalGemsConsumed)
    .map((f) => ({
      code: f.featureType,
      label: featureLabel(f.featureType),
      gems: f.totalGemsConsumed,
      uses: f.usageCount,
      users: f.uniqueUsers,
      share: total > 0 ? f.totalGemsConsumed / total : 0,
      gemsPerUse: f.usageCount > 0 ? f.totalGemsConsumed / f.usageCount : 0,
    }));
}

export interface HourRow {
  hour: number;
  uses: number;
  gems: number;
}

export function fillHours(byHour: Array<{ hour: number; usageCount: number; totalGemsConsumed: number }> | undefined): HourRow[] {
  const map = new Map((byHour ?? []).map((h) => [h.hour, h]));
  return Array.from({ length: 24 }, (_, hour) => ({
    hour,
    uses: map.get(hour)?.usageCount ?? 0,
    gems: map.get(hour)?.totalGemsConsumed ?? 0,
  }));
}

export const PEAK_HOURS = 3;

export function peakHours(rows: HourRow[], count = PEAK_HOURS): number[] {
  return [...rows]
    .filter((r) => r.uses > 0)
    .sort((a, b) => b.uses - a.uses || a.hour - b.hour)
    .slice(0, count)
    .map((r) => r.hour)
    .sort((a, b) => a - b);
}

export function describePeak(rows: HourRow[]): string {
  const total = rows.reduce((s, r) => s + r.uses, 0);
  if (total <= 0) return "최근 90일 동안 집계된 구슬 사용이 없습니다.";
  const peaks = peakHours(rows);
  const peakUses = rows.filter((r) => peaks.includes(r.hour)).reduce((s, r) => s + r.uses, 0);
  const label = peaks.map((h) => `${h}시`).join("·");
  return `${label}에 사용이 가장 많고, 이 ${peaks.length}시간대가 전체 사용의 ${pct(peakUses / total)}를 차지합니다. 푸시·프로모션은 이 직전에 보내는 게 유리합니다.`;
}

export interface SourceSplit {
  totalCharged: number;
  purchased: number;
  free: number;
  freeShare: number;
  rows: Array<{ code: string; label: string; charged: number; share: number; purchase: boolean }>;
}

export function splitSources(bySource: Array<Pick<GemSourceItem, "source" | "charged" | "consumed">> | undefined): SourceSplit {
  const charged = (bySource ?? []).filter((s) => s.charged > 0);
  const totalCharged = charged.reduce((s, r) => s + r.charged, 0);
  const purchased = charged.filter((s) => isPurchaseSource(s.source)).reduce((s, r) => s + r.charged, 0);
  const free = totalCharged - purchased;
  return {
    totalCharged,
    purchased,
    free,
    freeShare: totalCharged > 0 ? free / totalCharged : 0,
    rows: [...charged]
      .sort((a, b) => b.charged - a.charged)
      .map((s) => ({
        code: s.source,
        label: featureLabel(s.source),
        charged: s.charged,
        share: totalCharged > 0 ? s.charged / totalCharged : 0,
        purchase: isPurchaseSource(s.source),
      })),
  };
}

export function describeFreeShare(split: SourceSplit): string {
  if (split.totalCharged <= 0) return "최근 90일 동안 지급된 구슬이 없습니다.";
  const share = pct(split.freeShare);
  if (split.freeShare >= 0.5) {
    return `지급된 구슬의 ${share}가 결제 없이 풀렸습니다. 절반 넘게 무료로 쓰이면 구슬이 부족해서 결제하는 압력이 약해지므로, 보상 지급 기준을 줄이는 것부터 검토해야 합니다.`;
  }
  if (split.freeShare >= 0.3) {
    return `지급된 구슬의 ${share}가 결제 없이 풀렸습니다. 무료 비중이 높아질수록 구슬이 모자라서 결제하는 압력이 약해지니, 보상 지급 기준이 더 넓어지지 않게 지켜봐야 합니다.`;
  }
  return `지급된 구슬의 ${share}만 결제 없이 풀려, 대부분은 결제로 들어온 구슬입니다. 무료 구슬이 결제 압력을 크게 깎고 있지는 않습니다.`;
}

function pct(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

function gems(value: number): string {
  return `${Math.round(value).toLocaleString("ko-KR")}개`;
}

function shortDate(date: string): string {
  return `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;
}

const CHART = {
  primary: "var(--color-primary)",
  primarySoft: "var(--color-primary-disabled)",
  neutral: "var(--color-border-strong)",
  grid: "var(--color-border-soft)",
  tick: "var(--color-text-light)",
  cursor: "var(--color-surface-soft)",
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

function RowsSkeleton({ count }: { count: number }) {
  return (
    <div className="space-y-2" aria-label="불러오는 중">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-full rounded-lg" />
      ))}
    </div>
  );
}

function Callout({ icon: Icon, text }: { icon: typeof Lightbulb; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-surface-soft p-4">
      <span className="mt-0.5 shrink-0 text-primary" aria-hidden>
        <Icon size={20} />
      </span>
      <p className="text-sm font-medium text-gray-900">{text}</p>
    </div>
  );
}

function FeatureBars({ rows }: { rows: FeatureRow[] }) {
  if (rows.length === 0) {
    return <p className="rounded-xl bg-surface-soft p-4 text-sm text-gray-500">최근 90일 동안 사용된 구슬이 없습니다.</p>;
  }
  const max = rows[0].gems;
  return (
    <ol className="space-y-2.5" aria-label="구슬 사용처">
      {rows.map((r, i) => (
        <li key={r.code} className="space-y-1">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-baseline gap-2">
              <span className="w-4 shrink-0 text-xs font-semibold tabular-nums text-gray-400">{i + 1}</span>
              <span className="truncate font-medium text-gray-900">{r.label}</span>
              <span className="hidden shrink-0 text-xs text-gray-400 sm:inline">
                {r.uses.toLocaleString("ko-KR")}회 · {r.users.toLocaleString("ko-KR")}명 · 회당 {r.gemsPerUse.toFixed(1)}개
              </span>
            </span>
            <span className="shrink-0 tabular-nums text-gray-900">
              {gems(r.gems)}
              <span className="ml-1.5 text-xs text-gray-400">{pct(r.share)}</span>
            </span>
          </div>
          <div className="ml-6 h-2 overflow-hidden rounded-full bg-surface-strong" aria-hidden>
            <div
              className={`h-full rounded-full ${i === 0 ? "bg-primary" : "bg-primary/60"}`}
              style={{ width: `${max > 0 ? (r.gems / max) * 100 : 0}%` }}
            />
          </div>
          <p className="ml-6 text-xs text-gray-400 sm:hidden">
            {r.uses.toLocaleString("ko-KR")}회 · {r.users.toLocaleString("ko-KR")}명 · 회당 {r.gemsPerUse.toFixed(1)}개
          </p>
        </li>
      ))}
    </ol>
  );
}

function HourChart({ rows }: { rows: HourRow[] }) {
  const peaks = peakHours(rows);
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
          <XAxis
            dataKey="hour"
            tick={{ fontSize: 11, fill: CHART.tick }}
            axisLine={{ stroke: CHART.grid }}
            tickLine={false}
            interval={2}
            tickFormatter={(v: number) => `${v}시`}
          />
          <YAxis
            tick={{ fontSize: 11, fill: CHART.tick }}
            axisLine={false}
            tickLine={false}
            width={44}
            tickFormatter={(v: number) => v.toLocaleString("ko-KR")}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            cursor={{ fill: CHART.cursor }}
            labelFormatter={(label) => `${label}시`}
            formatter={(value, _name, item): [string, string] => [
              `${typeof value === "number" ? value.toLocaleString("ko-KR") : "—"}회 · ${gems((item.payload as HourRow).gems)}`,
              "사용",
            ]}
          />
          <Bar dataKey="uses" radius={[4, 4, 0, 0]} maxBarSize={28}>
            {rows.map((r) => (
              <Cell key={r.hour} fill={peaks.includes(r.hour) ? CHART.primary : CHART.primarySoft} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function EconomySummary({
  charged,
  consumed,
  avgCharge,
  avgConsume,
}: {
  charged: number;
  consumed: number;
  avgCharge: number;
  avgConsume: number;
}) {
  const ratio = consumed > 0 ? charged / consumed : null;
  const items: Array<{ label: string; value: string; hint: string; emphasis?: boolean }> = [
    { label: "지급된 구슬", value: gems(charged), hint: `하루 평균 ${gems(avgCharge)}` },
    { label: "사용된 구슬", value: gems(consumed), hint: `하루 평균 ${gems(avgConsume)}` },
    {
      label: "지급 ÷ 사용",
      value: ratio === null ? "—" : `${ratio.toFixed(2)}배`,
      hint: ratio === null ? "사용 기록 없음" : ratio > 1 ? "쓰는 양보다 많이 풀림(잔액 쌓임)" : "푸는 양보다 많이 씀(잔액 줄어듦)",
      emphasis: true,
    },
  ];
  return (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="구슬 수급 요약">
      {items.map((it) => (
        <div
          key={it.label}
          className={`rounded-xl border p-3 ${it.emphasis ? "border-primary/30 bg-primary/5" : "border-border bg-surface-soft"}`}
        >
          <dt className="text-xs text-gray-500">{it.label}</dt>
          <dd className={`mt-1 text-lg font-semibold tabular-nums ${it.emphasis ? "text-primary" : "text-gray-900"}`}>
            {it.value}
          </dd>
          <dd className="text-[11px] text-gray-400">{it.hint}</dd>
        </div>
      ))}
    </dl>
  );
}

function DailyChart({ rows }: { rows: Array<{ date: string; totalCharged: number; totalConsumed: number }> }) {
  const data = rows.map((r) => ({ name: shortDate(r.date), charged: r.totalCharged, consumed: r.totalConsumed }));
  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: CHART.tick }}
            axisLine={{ stroke: CHART.grid }}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            tick={{ fontSize: 11, fill: CHART.tick }}
            axisLine={false}
            tickLine={false}
            width={48}
            tickFormatter={(v: number) => v.toLocaleString("ko-KR")}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value, name): [string, string] => [typeof value === "number" ? gems(value) : "—", String(name)]}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="charged" name="지급" stroke={CHART.primary} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          <Line type="monotone" dataKey="consumed" name="사용" stroke={CHART.neutral} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function SourceTable({ split }: { split: SourceSplit }) {
  if (split.rows.length === 0) {
    return <p className="rounded-xl bg-surface-soft p-4 text-sm text-gray-500">최근 90일 동안 지급된 구슬이 없습니다.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500">
            <th className="py-2 pr-3 font-medium">지급 출처</th>
            <th className="py-2 px-3 text-left font-medium">구분</th>
            <th className="py-2 px-3 text-right font-medium">지급 구슬</th>
            <th className="py-2 pl-3 text-right font-medium">비중</th>
          </tr>
        </thead>
        <tbody>
          {split.rows.map((r) => (
            <tr key={r.code} className="border-t border-border whitespace-nowrap text-gray-900">
              <td className="py-2.5 pr-3 font-medium">{r.label}</td>
              <td className="py-2.5 px-3">
                <Chip size="sm" variant="soft" color={r.purchase ? "accent" : "warning"}>
                  <Chip.Label>{r.purchase ? "결제" : "무료 지급"}</Chip.Label>
                </Chip>
              </td>
              <td className="py-2.5 px-3 text-right tabular-nums">{gems(r.charged)}</td>
              <td className="py-2.5 pl-3 text-right tabular-nums">{pct(r.share)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-border bg-surface-soft font-semibold whitespace-nowrap text-gray-900">
            <td className="py-2.5 pr-3">합계</td>
            <td className="py-2.5 px-3 text-xs font-normal text-gray-500">
              결제 {gems(split.purchased)} · 무료 {gems(split.free)}
            </td>
            <td className="py-2.5 px-3 text-right tabular-nums">{gems(split.totalCharged)}</td>
            <td className="py-2.5 pl-3 text-right tabular-nums">100%</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function FreeShareCard({ split }: { split: SourceSplit }) {
  const high = split.freeShare >= 0.5;
  return (
    <div className={`rounded-xl border p-4 ${high ? "border-warning/40 bg-warning/5" : "border-border bg-surface-soft"}`}>
      <div className="flex flex-wrap items-start gap-4">
        <div className="shrink-0">
          <p className="flex items-center gap-1.5 text-xs text-gray-500">
            <Gift size={14} aria-hidden />
            무료로 풀린 구슬 비중
          </p>
          <p className={`mt-1 text-2xl font-semibold tabular-nums ${high ? "text-warning" : "text-gray-900"}`}>
            {split.totalCharged > 0 ? pct(split.freeShare) : "—"}
          </p>
          <p className="text-[11px] text-gray-400">결제 외 지급 ÷ 전체 지급</p>
        </div>
        <p className="min-w-0 flex-1 text-sm text-gray-700">{describeFreeShare(split)}</p>
      </div>
    </div>
  );
}

export function GemUsage() {
  const consumption = useGemConsumption();
  const economy = useGemEconomy();

  const features = useMemo(() => buildFeatureRows(consumption.data?.byFeature), [consumption.data]);
  const hours = useMemo(() => fillHours(consumption.data?.byHour), [consumption.data]);
  const split = useMemo(() => splitSources(economy.data?.bySource), [economy.data]);
  const summary = economy.data?.summary;
  const daily = economy.data?.dailyBalance ?? [];

  return (
    <div className="space-y-4">
      <Card>
        <Card.Content className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-gray-900">구슬 사용처</h3>
              <p className="mt-1 text-xs text-gray-500">
                최근 {BEHAVIOR_WINDOW_DAYS}일 동안 기능별로 쓴 구슬. 비중은 전체 사용량 대비, 회당은 사용 1회에 든 구슬입니다.
              </p>
            </div>
            {consumption.data && (
              <Chip size="sm" variant="soft" color="default">
                <Chip.Label>
                  총 {gems(consumption.data.totalGemsConsumed)} · {consumption.data.totalUsageCount.toLocaleString("ko-KR")}회
                </Chip.Label>
              </Chip>
            )}
          </div>

          {consumption.isError && <QueryError title="구슬 사용 내역을 불러오지 못했습니다" error={consumption.error} />}

          {consumption.isLoading ? <RowsSkeleton count={6} /> : consumption.isError ? null : <FeatureBars rows={features} />}
        </Card.Content>
      </Card>

      <Card>
        <Card.Content className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">시간대별 구슬 사용</h3>
            <p className="mt-1 text-xs text-gray-500">
              최근 {BEHAVIOR_WINDOW_DAYS}일 사용 횟수를 시간대(KST)로 묶었습니다. 진한 막대가 상위 {PEAK_HOURS}개 시간대입니다.
            </p>
          </div>

          {consumption.isLoading ? (
            <Skeleton className="h-[220px] w-full rounded-xl" aria-label="불러오는 중" />
          ) : consumption.isError ? (
            <p className="text-sm text-gray-500">구슬 사용 내역을 불러오지 못해 시간대 차트를 표시할 수 없습니다.</p>
          ) : (
            <>
              <Callout icon={Clock} text={describePeak(hours)} />
              <HourChart rows={hours} />
            </>
          )}
        </Card.Content>
      </Card>

      <Card>
        <Card.Content className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">구슬 수급: 풀린 양 vs 쓴 양</h3>
            <p className="mt-1 text-xs text-gray-500">
              최근 {BEHAVIOR_WINDOW_DAYS}일 동안 지급(결제·보상·관리자)과 사용을 비교합니다. 지급이 사용보다 많으면 잔액이 쌓여 결제
              필요가 줄어듭니다.
            </p>
          </div>

          {economy.isError && <QueryError title="구슬 수급 내역을 불러오지 못했습니다" error={economy.error} />}

          {economy.isLoading ? (
            <div className="space-y-4" aria-label="불러오는 중">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
              <Skeleton className="h-[240px] w-full rounded-xl" />
              <RowsSkeleton count={4} />
            </div>
          ) : economy.isError ? null : !summary || (summary.totalCharged <= 0 && summary.totalConsumed <= 0) ? (
            <p className="rounded-xl bg-surface-soft p-4 text-sm text-gray-500">최근 90일 동안 구슬 거래가 없습니다.</p>
          ) : (
            <>
              <EconomySummary
                charged={summary.totalCharged}
                consumed={summary.totalConsumed}
                avgCharge={summary.avgDailyCharge}
                avgConsume={summary.avgDailyConsume}
              />
              {daily.length > 0 && <DailyChart rows={daily} />}
              <FreeShareCard split={split} />
              <SourceTable split={split} />
              <p className="text-xs text-gray-400">
                &apos;결제&apos;는 스토어·PG 결제로 들어온 구슬(환불 취소로 복원된 구슬 포함), 나머지는 가입·이벤트·관리자 지급 등
                결제 없이 풀린 구슬입니다. 기능 환급은 지급에 포함되지 않습니다.
              </p>
            </>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}
