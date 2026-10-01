"use client";
import { Card, Chip, ProgressBar, Separator } from "@heroui/react";

import { Ban, Info, Sparkles, UserX } from "lucide-react";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import {
  UserAppearanceGradeStatsResponse,
  AppearanceGrade,
} from "@/app/admin/users/appearance/types";

const GRADE_COLORS: Record<string, string> = {
  S: "#7C3AED",
  A: "#2563EB",
  B: "#059669",
  C: "#D97706",
  UNKNOWN: "#94A3B8",
};

const GRADE_LABELS: Record<string, string> = {
  S: "S",
  A: "A",
  B: "B",
  C: "C",
  UNKNOWN: "미분류",
};

const UNKNOWN_BREAKDOWN_COLORS = {
  blindApproved: "#2563EB",
  gradeRequired: "#D97706",
};

interface AppearanceGradeStatsCardProps {
  stats: UserAppearanceGradeStatsResponse;
}

function GradeStatMiniCard({
  grade,
  count,
  percentage,
}: {
  grade: string;
  count: number;
  percentage: number;
}) {
  const color = GRADE_COLORS[grade] || "#94A3B8";
  const label = GRADE_LABELS[grade] || grade;

  return (
    <div
      style={{
        padding: 8,
        borderRadius: 8,
        border: "1px solid",
        borderColor: `color-mix(in srgb, ${color} 20%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${color} 4%, transparent)`,
        transition: "all 0.2s",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: color,
            }}
          ></div>
          <div
            style={{ fontWeight: 700 }}
            className={"text-sm text-neutral-700"}
          >
            {label}등급
          </div>
        </div>
        <Chip
          style={{
            height: 22,
            fontSize: "0.75rem",
            fontWeight: 600,
            backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
            border: "none",
          }}
          size={"sm"}
          variant={"soft"}
        >{`${percentage.toFixed(1)}%`}</Chip>
      </div>
      <div
        style={{ fontWeight: 700, color: "#171717", marginBottom: 2 }}
        className={"text-lg font-semibold text-neutral-900"}
      >
        {count.toLocaleString()}
        <div
          style={{ marginLeft: 2, color: "#525252", fontWeight: 400 }}
          className={"text-sm text-neutral-700"}
        >
          명
        </div>
      </div>
      <ProgressBar value={Math.min(percentage, 100)} aria-label="진행률">
        <ProgressBar.Track>
          <ProgressBar.Fill />
        </ProgressBar.Track>
      </ProgressBar>
    </div>
  );
}

function PieChartSection({
  title,
  subtitle,
  data,
}: {
  title: string;
  subtitle?: string;
  data: { name: string; value: number; percentage: number; grade: string }[];
}) {
  const hasData = data.length > 0;
  const total = data.reduce((sum, d) => sum + d.value, 0);

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{
      payload: { name: string; value: number; percentage: number };
    }>;
  }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div
          style={{
            backgroundColor: "#fff",
            paddingLeft: 8,
            paddingRight: 8,
            paddingTop: 6,
            paddingBottom: 6,
            borderRadius: 8,
            border: "1px solid",
          }}
        >
          <div
            style={{ fontWeight: 600 }}
            className={"text-sm text-neutral-700"}
          >
            {d.name}
          </div>
          <div className={"text-sm text-neutral-700"}>
            {d.value.toLocaleString()}명 ({d.percentage.toFixed(1)}%)
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <div
        style={{ fontWeight: 600, marginBottom: 2 }}
        className={"text-sm text-neutral-700"}
      >
        {title}
      </div>
      {subtitle && (
        <div style={{ marginBottom: 4 }} className={"text-sm text-neutral-700"}>
          {subtitle}
        </div>
      )}
      <div style={{ height: 220 }}>
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={GRADE_COLORS[entry.grade] || "#CCC"}
                    strokeWidth={0}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "12px" }}
                formatter={(value: string) => (
                  <span style={{ color: "#64748B", fontSize: "12px" }}>
                    {value}
                  </span>
                )}
              />
              <text
                x="50%"
                y="45%"
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ fontSize: "20px", fontWeight: 700, fill: "#1E293B" }}
              >
                {total.toLocaleString()}
              </text>
              <text
                x="50%"
                y="56%"
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ fontSize: "11px", fill: "#94A3B8" }}
              >
                총원
              </text>
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div className={"text-sm text-neutral-700"}>데이터 없음</div>
          </div>
        )}
      </div>
    </div>
  );
}

function UnknownBreakdownSection({
  blindApproved,
  gradeRequired,
  totalUnknown,
}: {
  blindApproved: number;
  gradeRequired: number;
  totalUnknown: number;
}) {
  const blindPct = totalUnknown > 0 ? (blindApproved / totalUnknown) * 100 : 0;
  const gradeRequiredPct =
    totalUnknown > 0 ? (gradeRequired / totalUnknown) * 100 : 0;

  const items = [
    {
      label: "블라인드 승인",
      desc: "사진 등급 없이 블라인드 매칭 승인",
      count: blindApproved,
      pct: blindPct,
      color: UNKNOWN_BREAKDOWN_COLORS.blindApproved,
      icon: <Sparkles />,
    },
    {
      label: "등급 정리 필요",
      desc: "승인 사진이 있어 등급 부여 필요",
      count: gradeRequired,
      pct: gradeRequiredPct,
      color: UNKNOWN_BREAKDOWN_COLORS.gradeRequired,
      icon: <UserX />,
    },
  ];

  return (
    <div
      style={{
        padding: 10,
        borderRadius: 8,
        border: "1px solid",
        borderColor: `color-mix(in srgb, ${"#94A3B8"} 20%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${"#F8FAFC"} 80%, transparent)`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          marginBottom: 8,
        }}
      >
        <Info />
        <div
          style={{ fontWeight: 600, color: "#334155" }}
          className={"text-sm text-neutral-700"}
        >
          등급 미분류 승인 흐름 ({totalUnknown.toLocaleString()}명)
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            marginLeft: "auto",
          }}
        >
          <Ban />
          <div
            style={{ color: "#EF4444", fontWeight: 500 }}
            className={"text-sm text-neutral-700"}
          >
            운영 분리
          </div>
        </div>
      </div>
      {/* Stacked bar */}
      <div
        style={{
          display: "flex",
          height: 8,
          borderRadius: 16,
          overflow: "hidden",
          marginBottom: 8,
        }}
      >
        <div
          style={{
            width: `${blindPct}%`,
            backgroundColor: UNKNOWN_BREAKDOWN_COLORS.blindApproved,
            transition: "width 0.3s",
          }}
        ></div>
        <div
          style={{
            width: `${gradeRequiredPct}%`,
            backgroundColor: UNKNOWN_BREAKDOWN_COLORS.gradeRequired,
            transition: "width 0.3s",
          }}
        ></div>
      </div>
      <div className={"flex flex-wrap items-center gap-2"}>
        {items.map((item) => (
          <div
            key={item.label}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                backgroundColor: `color-mix(in srgb, ${item.color} 15%, transparent)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: item.color,
                flexShrink: 0,
              }}
            >
              {item.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                <div
                  style={{ fontWeight: 600, color: "#334155" }}
                  className={"text-sm text-neutral-700"}
                >
                  {item.label}
                </div>
                <div
                  style={{ color: "#94A3B8" }}
                  className={"text-sm text-neutral-700"}
                >
                  {item.desc}
                </div>
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div
                style={{ fontWeight: 700, color: "#1E293B" }}
                className={"text-sm text-neutral-700"}
              >
                {item.count.toLocaleString()}명
              </div>
              <div
                style={{ color: "#94A3B8" }}
                className={"text-sm text-neutral-700"}
              >
                {item.pct.toFixed(1)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AppearanceGradeStatsCard({
  stats,
}: AppearanceGradeStatsCardProps) {
  if (!stats) {
    return (
      <Card style={{ borderRadius: 12 }}>
        <Card.Content style={{ padding: 12 }}>
          <div
            style={{ fontWeight: 600 }}
            className={"text-lg font-semibold text-neutral-900"}
          >
            외모 등급 통계
          </div>
          <div
            style={{ display: "flex", justifyContent: "center", padding: 16 }}
          >
            <div className={"text-sm text-neutral-700"}>
              통계 데이터를 불러올 수 없습니다.
            </div>
          </div>
        </Card.Content>
      </Card>
    );
  }

  const safeStats = {
    total: stats.total || 0,
    stats: Array.isArray(stats.stats) ? stats.stats : [],
    genderStats: Array.isArray(stats.genderStats) ? stats.genderStats : [],
    unknownBreakdown: stats.unknownBreakdown,
  };

  if (safeStats.stats.length === 0 && safeStats.genderStats.length === 0) {
    return (
      <Card style={{ borderRadius: 12 }}>
        <Card.Content style={{ padding: 12 }}>
          <div
            style={{ fontWeight: 600 }}
            className={"text-lg font-semibold text-neutral-900"}
          >
            외모 등급 통계
          </div>
          <div
            style={{ display: "flex", justifyContent: "center", padding: 16 }}
          >
            <div className={"text-sm text-neutral-700"}>
              아직 통계 데이터가 없습니다.
            </div>
          </div>
        </Card.Content>
      </Card>
    );
  }

  const toChartData = (
    items: { grade: string; count: number; percentage: number }[],
  ) =>
    items
      .filter((item) => item && item.grade && (item.count || 0) > 0)
      .map((item) => ({
        name: `${GRADE_LABELS[item.grade as AppearanceGrade] || item.grade}등급`,
        value: item.count || 0,
        percentage: typeof item.percentage === "number" ? item.percentage : 0,
        grade: item.grade,
      }));

  const chartData = toChartData(safeStats.stats);
  const maleChartData = toChartData(
    safeStats.genderStats.find((g) => g.gender === "MALE")?.stats || [],
  );
  const femaleChartData = toChartData(
    safeStats.genderStats.find((g) => g.gender === "FEMALE")?.stats || [],
  );

  const unknownStat = safeStats.stats.find((s) => s.grade === "UNKNOWN");
  const totalUnknown = unknownStat?.count || 0;
  const hasUnknownApprovalBreakdown = Boolean(
    safeStats.unknownBreakdown &&
    ("blindApproved" in safeStats.unknownBreakdown ||
      "gradeRequired" in safeStats.unknownBreakdown),
  );
  const hasBreakdown = hasUnknownApprovalBreakdown && totalUnknown > 0;
  const blindApprovedCount = safeStats.unknownBreakdown?.blindApproved ?? 0;
  const gradeRequiredCount = safeStats.unknownBreakdown?.gradeRequired ?? 0;

  return (
    <Card style={{ borderRadius: 12, overflow: "visible" }}>
      <Card.Content style={{ padding: 12 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <div>
            <div
              style={{ fontWeight: 700, color: "#1E293B" }}
              className={"text-lg font-semibold text-neutral-900"}
            >
              외모 등급 통계
            </div>
            <div
              style={{ color: "#94A3B8", marginTop: 1 }}
              className={"text-sm text-neutral-700"}
            >
              승인된 사용자 총 {safeStats.total.toLocaleString()}명
            </div>
          </div>
        </div>
        {/* 등급 카드 그리드 */}
        <div
          style={{ marginBottom: 12 }}
          className={"grid grid-cols-1 gap-4 md:grid-cols-2"}
        >
          {safeStats.stats
            .filter((item) => item && item.grade)
            .sort((a, b) => {
              const order: Record<string, number> = {
                S: 0,
                A: 1,
                B: 2,
                C: 3,
                UNKNOWN: 4,
              };
              return (order[a.grade] ?? 99) - (order[b.grade] ?? 99);
            })
            .map((item) => (
              <div key={item.grade} className={"min-w-0"}>
                <GradeStatMiniCard
                  grade={item.grade}
                  count={item.count || 0}
                  percentage={
                    typeof item.percentage === "number" ? item.percentage : 0
                  }
                />
              </div>
            ))}
        </div>
        {/* 미분류 상세 breakdown */}
        {hasBreakdown && (
          <div style={{ marginBottom: 12 }}>
            <UnknownBreakdownSection
              blindApproved={blindApprovedCount}
              gradeRequired={gradeRequiredCount}
              totalUnknown={totalUnknown}
            />
          </div>
        )}
        <Separator style={{ marginTop: 8, marginBottom: 8 }}></Separator>
        {/* 파이 차트 - 전체 / 남성 / 여성 */}
        <div className={"grid grid-cols-1 gap-4 md:grid-cols-2"}>
          <div className={"min-w-0"}>
            <PieChartSection
              title="전체"
              subtitle={`${safeStats.total.toLocaleString()}명`}
              data={chartData}
            />
          </div>
          <div className={"min-w-0"}>
            <PieChartSection title="남성" data={maleChartData} />
          </div>
          <div className={"min-w-0"}>
            <PieChartSection title="여성" data={femaleChartData} />
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
