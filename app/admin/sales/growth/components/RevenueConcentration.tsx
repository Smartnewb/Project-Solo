"use client";

import { useMemo } from "react";
import { Alert, Card, Chip, Skeleton } from "@heroui/react";
import { Crown, ShieldCheck, TriangleAlert } from "lucide-react";
import type { RevenueConcentrationItem, WhaleCharacteristics } from "../../types";
import { useWhaleUsers } from "../hooks";
import { exVat, formatKrw, formatKrwFull } from "../lib/metrics";

export const TIER_PERCENTILES = [1, 5, 10, 20] as const;
export const WHALE_PERCENTILE = 5;
export const WHALE_RISK_SHARE = 40;

export const FEATURE_LABELS: Record<string, string> = {
  LIKE: "좋아요",
  SUPER_LIKE: "슈퍼 좋아요",
  CHAT_OPEN: "채팅 열기",
  REMATCHING: "재매칭",
  LETTER_LIKE: "편지 좋아요",
  PROFILE_BOOST: "프로필 부스트",
};

export function featureLabel(code: string): string {
  return FEATURE_LABELS[code] ?? code;
}

export type RiskLevel = "high" | "normal" | "unknown";

export interface RiskRead {
  level: RiskLevel;
  share: number | null;
  userCount: number | null;
  verdict: string;
  message: string;
}

export const RISK_VERDICTS: Record<RiskLevel, string> = {
  high: "큰손 의존도가 높아 이탈 시 매출 타격이 큽니다.",
  normal: "특정 소수에 매출이 쏠려 있지는 않습니다.",
  unknown: "상위 5% 결제자 데이터가 없어 쏠림을 판단할 수 없습니다.",
};

export function whaleRiskRead(concentration: RevenueConcentrationItem[] | undefined): RiskRead {
  const top = concentration?.find((c) => c.percentile === WHALE_PERCENTILE);
  if (!top) {
    return { level: "unknown", share: null, userCount: null, verdict: RISK_VERDICTS.unknown, message: RISK_VERDICTS.unknown };
  }
  const level: RiskLevel = top.revenueShare > WHALE_RISK_SHARE ? "high" : "normal";
  const verdict = RISK_VERDICTS[level];
  return {
    level,
    share: top.revenueShare,
    userCount: top.userCount,
    verdict,
    message: `상위 5% 결제자 ${top.userCount.toLocaleString("ko-KR")}명이 매출의 ${top.revenueShare.toFixed(1)}%를 냅니다. ${verdict}`,
  };
}

export interface TierRow {
  percentile: number;
  userCount: number;
  share: number;
  avgRevenueExVat: number;
  totalRevenueExVat: number;
}

export function buildTierRows(concentration: RevenueConcentrationItem[] | undefined): TierRow[] {
  const byPercentile = new Map((concentration ?? []).map((c) => [c.percentile, c]));
  return TIER_PERCENTILES.flatMap((p) => {
    const c = byPercentile.get(p);
    if (!c) return [];
    return [
      {
        percentile: p,
        userCount: c.userCount,
        share: c.revenueShare,
        avgRevenueExVat: exVat(c.avgRevenuePerUser),
        totalRevenueExVat: exVat(c.totalRevenue),
      },
    ];
  });
}

function pct(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

function count(value: number): string {
  return value.toLocaleString("ko-KR");
}

function Num({ children }: { children: React.ReactNode }) {
  return <span className="whitespace-nowrap tabular-nums">{children}</span>;
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
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-16 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
    </div>
  );
}

function TierCards({ rows }: { rows: TierRow[] }) {
  return (
    <ol className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="상위 결제자 매출 비중">
      {rows.map((r) => {
        const whale = r.percentile === WHALE_PERCENTILE;
        return (
          <li
            key={r.percentile}
            className={`rounded-xl border p-4 ${whale ? "border-primary/30 bg-primary/5" : "border-border bg-canvas"}`}
          >
            <p className="flex items-center gap-1.5 text-xs text-gray-500">
              상위 {r.percentile}%
              {whale && (
                <span className="rounded-full bg-primary/10 px-1.5 py-px text-[10px] font-medium text-primary">큰손 기준</span>
              )}
            </p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${whale ? "text-primary" : "text-gray-900"}`}>
              {pct(r.share)}
            </p>
            <p className="text-[11px] text-gray-400">전체 매출 중 비중 · {count(r.userCount)}명</p>
            <p className="mt-2 text-xs text-gray-500">
              1인 평균{" "}
              <span className="font-medium tabular-nums text-gray-900" title={formatKrwFull(r.avgRevenueExVat)}>
                {formatKrw(r.avgRevenueExVat)}
              </span>
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function ConcentrationBar({ rows }: { rows: TierRow[] }) {
  const steps = rows.map((r, i) => ({
    percentile: r.percentile,
    width: r.share - (i > 0 ? rows[i - 1].share : 0),
    opacity: 1 - i * 0.2,
  }));
  const rest = Math.max(0, 100 - (rows[rows.length - 1]?.share ?? 0));
  return (
    <div className="space-y-2">
      <div className="flex h-5 w-full overflow-hidden rounded-full bg-surface-strong" role="img" aria-label="결제자 상위 구간별 매출 비중">
        {steps.map((s) => (
          <div
            key={s.percentile}
            className="h-full bg-primary"
            style={{ width: `${Math.max(0, s.width)}%`, opacity: s.opacity }}
            title={`상위 ${s.percentile}%까지`}
          />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        {rows.map((r, i) => (
          <li key={r.percentile} className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-primary" style={{ opacity: 1 - i * 0.2 }} aria-hidden />
            상위 {r.percentile}%까지 {pct(r.share)}
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-surface-strong" aria-hidden />
          나머지 결제자 {pct(rest)}
        </li>
      </ul>
    </div>
  );
}

function RiskCard({ risk }: { risk: RiskRead }) {
  const Icon = risk.level === "high" ? TriangleAlert : ShieldCheck;
  const tone = risk.level === "high" ? "text-warning" : risk.level === "normal" ? "text-success" : "text-gray-400";
  const box = risk.level === "high" ? "border-warning/40 bg-warning/5" : "border-border bg-surface-soft";
  return (
    <div className={`flex items-start gap-3 rounded-xl border p-4 ${box}`}>
      <span className={`mt-0.5 shrink-0 ${tone}`} aria-hidden>
        <Icon size={20} />
      </span>
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium text-gray-900">
          {risk.share !== null && risk.userCount !== null && (
            <>
              상위 5% 결제자 <Num>{count(risk.userCount)}명이</Num> 매출의 <Num>{pct(risk.share)}를</Num> 냅니다.{" "}
            </>
          )}
          {risk.verdict}
        </p>
        <p className="text-xs text-gray-400">기준: 상위 5%의 매출 비중이 {WHALE_RISK_SHARE}%를 넘으면 쏠림이 큰 것으로 봅니다.</p>
      </div>
    </div>
  );
}

function WhaleProfile({
  profile,
  whaleCount,
  thresholdExVat,
}: {
  profile: WhaleCharacteristics;
  whaleCount: number;
  thresholdExVat: number;
}) {
  const facts: Array<{ label: string; value: string; hint: string }> = [
    {
      label: "성비",
      value: `남 ${pct(profile.malePercentage, 0)} · 여 ${pct(profile.femalePercentage, 0)}`,
      hint: "큰손 중 남녀 비율",
    },
    { label: "평균 나이", value: profile.avgAge > 0 ? `${profile.avgAge.toFixed(1)}세` : "—", hint: "큰손의 평균 나이" },
    {
      label: "평균 결제 횟수",
      value: `${profile.avgPurchaseCount.toFixed(1)}회`,
      hint: "큰손 1명이 지금까지 결제한 횟수",
    },
    {
      label: "가입 후 경과일",
      value: `${count(profile.avgDaysSinceSignup)}일`,
      hint: "큰손이 가입한 지 평균 며칠 됐는지",
    },
  ];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-primary" aria-hidden>
          <Crown size={16} />
        </span>
        <h4 className="text-sm font-semibold text-gray-900">상위 5% 결제자 {count(whaleCount)}명은 누구인가</h4>
        <Chip size="sm" variant="soft">
          <Chip.Label className="tabular-nums">1인 누적 {formatKrw(thresholdExVat)} 이상</Chip.Label>
        </Chip>
      </div>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {facts.map((f) => (
          <div key={f.label} className="rounded-xl border border-border bg-canvas p-3">
            <dt className="text-xs text-gray-500">{f.label}</dt>
            <dd className="mt-1 text-base font-semibold tabular-nums text-gray-900">{f.value}</dd>
            <dd className="text-[11px] text-gray-400">{f.hint}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <span>주로 쓰는 기능</span>
        {profile.topFeatures.length === 0 ? (
          <span className="text-gray-400">—</span>
        ) : (
          profile.topFeatures.map((f) => (
            <Chip key={f} size="sm" variant="soft" color="accent">
              <Chip.Label>{featureLabel(f)}</Chip.Label>
            </Chip>
          ))
        )}
      </div>
    </div>
  );
}

export function RevenueConcentration() {
  const whales = useWhaleUsers();
  const rows = useMemo(() => buildTierRows(whales.data?.revenueConcentration), [whales.data]);
  const risk = useMemo(() => whaleRiskRead(whales.data?.revenueConcentration), [whales.data]);
  const d = whales.data;

  return (
    <Card>
      <Card.Content className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-gray-900">매출 쏠림 (전체 기간)</h3>
            <p className="mt-1 text-xs text-gray-500">
              지금까지 결제한 전체 결제자를 누적 결제액 순으로 줄 세웠을 때, 상위 몇 %가 매출의 몇 %를 내는지입니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {d && d.totalUsers > 0 && (
              <Chip size="sm" variant="soft">
                <Chip.Label>
                  결제자 {count(d.totalUsers)}명 · 매출 {formatKrw(exVat(d.totalRevenue))}
                </Chip.Label>
              </Chip>
            )}
            <Chip size="sm" variant="soft" color="accent">
              <Chip.Label>부가세 제외</Chip.Label>
            </Chip>
          </div>
        </div>

        {whales.isError && <QueryError title="상위 결제자 데이터를 불러오지 못했습니다" error={whales.error} />}

        {whales.isLoading ? (
          <SectionSkeleton />
        ) : whales.isError ? null : !d || d.totalUsers === 0 || rows.length === 0 ? (
          <p className="rounded-xl bg-surface-soft p-4 text-sm text-gray-500">아직 결제한 사람이 없습니다.</p>
        ) : (
          <>
            <TierCards rows={rows} />
            <ConcentrationBar rows={rows} />
            <RiskCard risk={risk} />
            <div className="border-t border-border pt-4">
              <WhaleProfile profile={d.whaleCharacteristics} whaleCount={d.whaleCount} thresholdExVat={exVat(d.whaleThreshold)} />
            </div>
            <p className="text-xs text-gray-400">
              서버는 테스트 계정만 빼고 집계하므로 팀원 계정의 결제가 상위권에 섞일 수 있습니다. 상위 1%가 몇 명 안 될 때는 한두 명이 수치를 크게 흔듭니다.
            </p>
          </>
        )}
      </Card.Content>
    </Card>
  );
}
