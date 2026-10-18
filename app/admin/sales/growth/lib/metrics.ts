export const VAT_RATE = 0.1;

// 부가세 포함 결제액 대비 추정 수수료율. 출처: central payments.db effective_transactions
// 2026-09-01~2026-10-17 실측(애플 13.64%, 구글 14.66~15%, 웰컴페이먼츠 3.2%). 확정 정산액이 아니다.
export const FEE_RATES = {
  APPLE_IAP: 0.1364,
  GOOGLE_PLAY: 0.15,
  PG: 0.032,
} as const;

export type FeeChannel = keyof typeof FEE_RATES;

export const FEE_CHANNEL_LABELS: Record<FeeChannel, string> = {
  APPLE_IAP: "애플",
  GOOGLE_PLAY: "구글",
  PG: "PG(카드 등)",
};

export interface DailyPoint {
  date: string;
  gross: number;
  pg: number;
  iap: number;
  count: number;
}

export interface BucketPoint {
  key: string;
  label: string;
  gross: number;
  count: number;
  days: number;
  partial: boolean;
}

const DAY_MS = 86_400_000;

function parseDate(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  return formatDate(new Date(parseDate(date).getTime() + days * DAY_MS));
}

export function diffDays(from: string, to: string): number {
  return Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / DAY_MS);
}

export function kstToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

// 서버 /admin/v2/revenue/* 는 startDate 를 new Date() 로 읽으므로 KST 자정을 UTC ISO 로 넘긴다.
export function kstMidnightIso(date: string): string {
  return `${addDays(date, -1)}T15:00:00.000Z`;
}

export function exVat(gross: number): number {
  return gross / (1 + VAT_RATE);
}

export function monthStart(date: string): string {
  return `${date.slice(0, 7)}-01`;
}

export function addMonths(date: string, months: number): string {
  const d = parseDate(monthStart(date));
  d.setUTCMonth(d.getUTCMonth() + months);
  return formatDate(d);
}

export function daysInMonth(date: string): number {
  return diffDays(monthStart(date), addMonths(date, 1));
}

export function weekStart(date: string): string {
  const dow = parseDate(date).getUTCDay();
  return addDays(date, -((dow + 6) % 7));
}

// 서버는 결제가 없는 날짜를 응답에서 빼므로 [from, to] 의 빈 날을 0으로 채운다.
export function fillDaily(
  rows: Array<{ date: string; revenue: number; pgRevenue: number; iapRevenue: number; count: number }>,
  from: string,
  to: string,
): DailyPoint[] {
  const byDate = new Map(rows.map((r) => [r.date, r]));
  const out: DailyPoint[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const r = byDate.get(d);
    out.push({
      date: d,
      gross: r?.revenue ?? 0,
      pg: r?.pgRevenue ?? 0,
      iap: r?.iapRevenue ?? 0,
      count: r?.count ?? 0,
    });
  }
  return out;
}

export function sumGross(days: DailyPoint[], from: string, to: string): number {
  return days.reduce((s, d) => (d.date >= from && d.date <= to ? s + d.gross : s), 0);
}

export function growthRate(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return (current - previous) / previous;
}

export function movingAverage(days: DailyPoint[], window = 7): Array<number | null> {
  return days.map((_, i) => {
    if (i + 1 < window) return null;
    let s = 0;
    for (let j = i - window + 1; j <= i; j++) s += days[j].gross;
    return s / window;
  });
}

export function bucketWeekly(days: DailyPoint[], today: string): BucketPoint[] {
  return bucket(days, weekStart, (key) => `${key.slice(5).replace("-", "/")}주`, (key) =>
    today >= key && today <= addDays(key, 6),
  );
}

export function bucketMonthly(days: DailyPoint[], today: string): BucketPoint[] {
  return bucket(days, monthStart, (key) => `${key.slice(2, 4)}.${key.slice(5, 7)}`, (key) =>
    monthStart(today) === key,
  );
}

function bucket(
  days: DailyPoint[],
  keyOf: (date: string) => string,
  labelOf: (key: string) => string,
  isPartial: (key: string) => boolean,
): BucketPoint[] {
  const map = new Map<string, BucketPoint>();
  for (const d of days) {
    const key = keyOf(d.date);
    const b = map.get(key) ?? {
      key,
      label: labelOf(key),
      gross: 0,
      count: 0,
      days: 0,
      partial: isPartial(key),
    };
    b.gross += d.gross;
    b.count += d.count;
    b.days += 1;
    map.set(key, b);
  }
  return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
}

export interface Scorecard {
  today: string;
  mtdGross: number;
  lastMonthSamePeriodGross: number;
  mtdGrowth: number | null;
  forecastGross: number | null;
  forecastByMonthAvgGross: number | null;
  remainingDays: number;
  lastMonthGross: number;
  last7Gross: number;
  prev7Gross: number;
  last7Growth: number | null;
  todayGross: number;
  completedDays: number;
}

export function buildScorecard(days: DailyPoint[], today: string): Scorecard {
  const yesterday = addDays(today, -1);
  const thisMonth = monthStart(today);
  const lastMonth = addMonths(today, -1);
  const completedDays = diffDays(thisMonth, today);
  const lastMonthDays = daysInMonth(lastMonth);

  const mtdGross = completedDays > 0 ? sumGross(days, thisMonth, yesterday) : 0;
  const samePeriodEnd = addDays(lastMonth, Math.min(completedDays, lastMonthDays) - 1);
  const lastMonthSamePeriodGross =
    completedDays > 0 ? sumGross(days, lastMonth, samePeriodEnd) : 0;

  const last7Gross = sumGross(days, addDays(today, -7), yesterday);
  const prev7Gross = sumGross(days, addDays(today, -14), addDays(today, -8));

  return {
    today,
    mtdGross,
    lastMonthSamePeriodGross,
    mtdGrowth: completedDays > 0 ? growthRate(mtdGross, lastMonthSamePeriodGross) : null,
    forecastGross: completedDays > 0 ? mtdGross + (last7Gross / 7) * (daysInMonth(today) - completedDays) : null,
    forecastByMonthAvgGross: completedDays > 0 ? (mtdGross / completedDays) * daysInMonth(today) : null,
    remainingDays: daysInMonth(today) - completedDays,
    lastMonthGross: sumGross(days, lastMonth, addDays(thisMonth, -1)),
    last7Gross,
    prev7Gross,
    last7Growth: growthRate(last7Gross, prev7Gross),
    todayGross: sumGross(days, today, today),
    completedDays,
  };
}

export function compoundWeeklyGrowth(weeks: BucketPoint[], count = 12): number | null {
  const complete = weeks.filter((w) => !w.partial && w.days === 7).slice(-count);
  if (complete.length < 2) return null;
  const first = complete[0].gross;
  const last = complete[complete.length - 1].gross;
  if (first <= 0 || last <= 0) return null;
  return Math.pow(last / first, 1 / (complete.length - 1)) - 1;
}

export function feeChannelOf(method: string): FeeChannel {
  const m = method.toUpperCase();
  if (m === "APPLE_IAP" || m.includes("APPLE")) return "APPLE_IAP";
  if (m === "GOOGLE_PLAY" || m.includes("GOOGLE")) return "GOOGLE_PLAY";
  return "PG";
}

export interface FeeEstimate {
  gross: number;
  netOfVat: number;
  fee: number;
  settlement: number;
  byChannel: Array<{ channel: FeeChannel; gross: number; fee: number; rate: number; count: number }>;
}

export function estimateFees(byMethod: Array<{ method: string; amount: number; count: number }>): FeeEstimate {
  const acc = new Map<FeeChannel, { gross: number; count: number }>();
  for (const row of byMethod) {
    const ch = feeChannelOf(row.method);
    const cur = acc.get(ch) ?? { gross: 0, count: 0 };
    cur.gross += row.amount;
    cur.count += row.count;
    acc.set(ch, cur);
  }
  const byChannel = (Object.keys(FEE_RATES) as FeeChannel[])
    .filter((ch) => acc.has(ch))
    .map((ch) => {
      const { gross, count } = acc.get(ch)!;
      return { channel: ch, gross, count, rate: FEE_RATES[ch], fee: gross * FEE_RATES[ch] };
    });
  const gross = byChannel.reduce((s, c) => s + c.gross, 0);
  const fee = byChannel.reduce((s, c) => s + c.fee, 0);
  return { gross, netOfVat: exVat(gross), fee, settlement: gross - fee, byChannel };
}

export function formatKrw(value: number): string {
  if (Math.abs(value) >= 100_000_000) return `${(value / 100_000_000).toFixed(2)}억원`;
  if (Math.abs(value) >= 10_000) return `${Math.round(value / 10_000).toLocaleString("ko-KR")}만원`;
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

export function formatKrwFull(value: number): string {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

export function formatPercent(value: number | null, digits = 1): string {
  if (value === null || !Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(digits)}%`;
}
