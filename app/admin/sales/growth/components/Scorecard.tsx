"use client";

import { Alert, Button, Card, Chip, ProgressBar, Skeleton } from "@heroui/react";
import {
  CalendarCheck,
  CalendarRange,
  Hourglass,
  Minus,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useMemo, type ReactNode } from "react";
import { useDailyRevenue, useGrowthRange } from "../hooks";
import {
  addMonths,
  buildScorecard,
  daysInMonth,
  exVat,
  formatKrw,
  formatKrwFull,
  formatPercent,
} from "../lib/metrics";

export const MONTHLY_TARGET_EX_VAT = 10_000_000;

function monthLabel(date: string): string {
  return `${Number(date.slice(5, 7))}월`;
}

function ratioLabel(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  return `${Math.round(value * 100).toLocaleString("ko-KR")}%`;
}

function Delta({ value, label }: { value: number | null; label: string }) {
  const tone = value === null || value === 0 ? "default" : value > 0 ? "success" : "danger";
  const Icon = tone === "default" ? Minus : tone === "success" ? TrendingUp : TrendingDown;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Chip size="sm" variant="soft" color={tone}>
        <Icon size={12} aria-hidden />
        <Chip.Label className="tabular-nums">{formatPercent(value)}</Chip.Label>
      </Chip>
      <span className="text-xs text-text-light">{label}</span>
    </div>
  );
}

function MetricCard({
  icon,
  title,
  value,
  hero = false,
  className = "",
  children,
}: {
  icon: ReactNode;
  title: string;
  value: string;
  hero?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <Card className={`min-w-0 ${className}`}>
      <Card.Header className="flex-row items-center gap-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
          {icon}
        </span>
        <Card.Title className="mb-0 text-sm font-medium text-text-light">{title}</Card.Title>
      </Card.Header>
      <Card.Content className="gap-2">
        <p
          className={`tabular-nums tracking-tight text-text ${
            hero ? "text-3xl font-bold" : "text-2xl font-semibold"
          }`}
        >
          {value}
        </p>
        {children}
      </Card.Content>
    </Card>
  );
}

function ScorecardSkeleton() {
  const block = (hero: boolean, key: number) => (
    <Card key={key} aria-hidden>
      <Card.Header className="flex-row items-center gap-2">
        <Skeleton className="size-8 rounded-xl" />
        <Skeleton className="h-4 w-32 rounded-md" />
      </Card.Header>
      <Card.Content className="gap-2">
        <Skeleton className={`${hero ? "h-9 w-48" : "h-8 w-36"} rounded-md`} />
        <Skeleton className="h-5 w-40 rounded-md" />
        <Skeleton className="h-3 w-52 rounded-md" />
      </Card.Content>
    </Card>
  );
  return (
    <div className="space-y-4" role="status" aria-label="매출 요약 불러오는 중">
      <div className="grid gap-4 md:grid-cols-2">{[0, 1].map((k) => block(true, k))}</div>
      <div className="grid gap-4 sm:grid-cols-3">{[2, 3, 4].map((k) => block(false, k))}</div>
    </div>
  );
}

export function Scorecard() {
  const { today } = useGrowthRange();
  const query = useDailyRevenue();
  const card = useMemo(
    () => (query.data ? buildScorecard(query.data, today) : null),
    [query.data, today],
  );

  if (query.isPending) return <ScorecardSkeleton />;

  if (query.isError || !card) {
    return (
      <Alert status="danger">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>매출 요약을 불러오지 못했습니다.</Alert.Title>
          <Alert.Description>
            {query.error?.message ?? "잠시 후 다시 시도해 주세요."}
          </Alert.Description>
          <Button
            size="sm"
            variant="secondary"
            className="mt-2 w-fit"
            onPress={() => void query.refetch()}
          >
            다시 시도
          </Button>
        </Alert.Content>
      </Alert>
    );
  }

  const thisMonth = monthLabel(today);
  const lastMonth = monthLabel(addMonths(today, -1));
  const totalDays = daysInMonth(today);

  const mtdExVat = exVat(card.mtdGross);
  const samePeriodExVat = exVat(card.lastMonthSamePeriodGross);
  const forecastExVat = card.forecastGross === null ? null : exVat(card.forecastGross);
  const forecastAchievement = forecastExVat === null ? null : forecastExVat / MONTHLY_TARGET_EX_VAT;
  const last7AverageExVat = exVat(card.last7Gross) / 7;
  const monthAvgForecastExVat =
    card.forecastByMonthAvgGross === null ? null : exVat(card.forecastByMonthAvgGross);
  const last7ExVat = exVat(card.last7Gross);
  const prev7ExVat = exVat(card.prev7Gross);
  const lastMonthExVat = exVat(card.lastMonthGross);
  const todayExVat = exVat(card.todayGross);

  const achievementTone =
    forecastAchievement === null
      ? "default"
      : forecastAchievement >= 1
        ? "success"
        : forecastAchievement >= 0.7
          ? "warning"
          : "danger";

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <MetricCard
          hero
          icon={<Wallet size={16} aria-hidden />}
          title={`${thisMonth} 누적 매출(부가세 제외)`}
          value={card.completedDays > 0 ? formatKrwFull(mtdExVat) : "—"}
        >
          <Delta value={card.mtdGrowth} label={`지난달 같은 기간(${formatKrw(samePeriodExVat)}) 대비`} />
          <p className="text-xs text-text-muted">
            {card.completedDays > 0
              ? `1일~${card.completedDays}일 완료분 · 결제액(부가세 포함) ${formatKrw(card.mtdGross)}`
              : "이달 완료된 날이 아직 없습니다. 오늘 결제는 아래 '오늘(진행 중)'에서 확인하세요."}
          </p>
        </MetricCard>

        <MetricCard
          hero
          icon={<Target size={16} aria-hidden />}
          title={`${thisMonth} 예상 매출(부가세 제외)`}
          value={forecastExVat === null ? "—" : formatKrwFull(forecastExVat)}
        >
          <div className="flex flex-wrap items-center gap-2">
            <Chip size="sm" variant="soft" color={achievementTone}>
              <Chip.Label className="tabular-nums">목표의 {ratioLabel(forecastAchievement)}</Chip.Label>
            </Chip>
            <span className="text-xs text-text-light">월 목표 {formatKrw(MONTHLY_TARGET_EX_VAT)}</span>
          </div>
          <ProgressBar
            value={Math.min(100, (forecastAchievement ?? 0) * 100)}
            color={achievementTone === "default" ? "accent" : achievementTone}
            size="sm"
            aria-label="월 목표 달성 예상"
          >
            <ProgressBar.Track>
              <ProgressBar.Fill />
            </ProgressBar.Track>
          </ProgressBar>
          <p className="text-xs text-text-muted">
            {monthAvgForecastExVat === null
              ? "완료된 날이 생기면 이미 번 매출 + 최근 7일 일평균 × 남은 날로 계산합니다."
              : `이미 번 ${formatKrw(mtdExVat)} + 최근 7일 일평균 ${formatKrw(last7AverageExVat)} × 남은 ${card.remainingDays}일`}
          </p>
          {monthAvgForecastExVat !== null && (
            <p className="text-xs text-text-light">
              이번 달 평균({totalDays}일 환산) 기준이면 {formatKrw(monthAvgForecastExVat)}
            </p>
          )}
        </MetricCard>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          icon={<CalendarRange size={16} aria-hidden />}
          title="최근 7일 매출"
          value={formatKrwFull(last7ExVat)}
        >
          <Delta value={card.last7Growth} label="그 전 7일 대비" />
          <p className="text-xs text-text-muted">
            어제까지 7일 · 그 전 7일 {formatKrw(prev7ExVat)}
          </p>
        </MetricCard>

        <MetricCard
          icon={<CalendarCheck size={16} aria-hidden />}
          title={`${lastMonth} 확정 매출`}
          value={formatKrwFull(lastMonthExVat)}
        >
          <div className="flex flex-wrap items-center gap-2">
            <Chip size="sm" variant="soft" color="default">
              <Chip.Label className="tabular-nums">
                목표의 {ratioLabel(lastMonthExVat / MONTHLY_TARGET_EX_VAT)}
              </Chip.Label>
            </Chip>
          </div>
          <p className="text-xs text-text-muted">
            결제액(부가세 포함) {formatKrw(card.lastMonthGross)}
          </p>
        </MetricCard>

        <MetricCard
          icon={<Hourglass size={16} aria-hidden />}
          title="오늘(진행 중)"
          value={formatKrwFull(todayExVat)}
          className="border border-dashed border-border shadow-none"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Chip size="sm" variant="soft" color="warning">
              <Chip.Label>집계 중</Chip.Label>
            </Chip>
            <span className="text-xs text-text-light">{today} (KST)</span>
          </div>
          <p className="text-xs text-text-muted">
            아직 끝나지 않은 날이라 위 비교·예상에는 넣지 않았습니다.
          </p>
        </MetricCard>
      </div>
    </div>
  );
}
