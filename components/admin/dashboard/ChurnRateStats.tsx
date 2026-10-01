"use client";
import { Alert, Chip, Skeleton } from "@heroui/react";

import { ArrowRight, TrendingDown, TrendingUp } from "lucide-react";

import { useState, useEffect } from "react";

import AdminService from "@/app/services/admin";

interface ChurnRateCardProps {
  title: string;
  subtitle: string;
  rate: number | null;
  loading: boolean;
  iconColor: string;
  accentColor: string;
}

function getChurnLevel(rate: number): {
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
} {
  if (rate < 1) {
    return {
      color: "#059669",
      bgColor: "#ecfdf5",
      borderColor: "#a7f3d0",
      label: "양호",
    };
  } else if (rate < 3) {
    return {
      color: "#d97706",
      bgColor: "#fffbeb",
      borderColor: "#fde68a",
      label: "주의",
    };
  } else {
    return {
      color: "#dc2626",
      bgColor: "#fef2f2",
      borderColor: "#fecaca",
      label: "경고",
    };
  }
}

function getTrendIcon(rate: number) {
  if (rate < 1) {
    return <TrendingDown />;
  } else if (rate < 3) {
    return <ArrowRight />;
  } else {
    return <TrendingUp />;
  }
}

function ChurnRateCard({
  title,
  subtitle,
  rate,
  loading,
  iconColor,
  accentColor,
}: ChurnRateCardProps) {
  const churnLevel = rate !== null ? getChurnLevel(rate) : null;

  return (
    <div
      style={{
        position: "relative",
        padding: 12,
        borderRadius: 12,
        backgroundColor: "#fff",
        border: "1px solid #e5e7eb",
        transition: "all 0.2s ease",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <div>
          <div
            style={{
              fontWeight: 600,
              color: "#374151",
              marginBottom: 2,
              fontSize: "0.875rem",
            }}
            className={"text-sm text-neutral-700"}
          >
            {title}
          </div>
          <div
            style={{ color: "#9ca3af", fontSize: "0.75rem" }}
            className={"text-sm text-neutral-700"}
          >
            {subtitle}
          </div>
        </div>
        {!loading && rate !== null && churnLevel && (
          <Chip
            style={{
              backgroundColor: churnLevel.bgColor,
              color: churnLevel.color,
              border: `1px solid ${churnLevel.borderColor}`,
              fontWeight: 600,
              fontSize: "0.7rem",
              height: 24,
            }}
            size={"sm"}
            variant={"soft"}
          >
            {churnLevel.label}
          </Chip>
        )}
      </div>
      {loading ? (
        <Skeleton className="h-6 w-full rounded-lg" />
      ) : (
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <div
            style={{
              fontSize: "2.25rem",
              fontWeight: 700,
              color: churnLevel ? churnLevel.color : "#374151",
              lineHeight: 1,
              fontFamily: '"SF Mono", "Monaco", "Inconsolata", monospace',
            }}
            className={"text-sm text-neutral-700"}
          >
            {rate !== null ? rate.toFixed(2) : "-"}
          </div>
          <div
            style={{ fontSize: "1rem", fontWeight: 600, color: "#9ca3af" }}
            className={"text-sm text-neutral-700"}
          >
            %
          </div>
        </div>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginTop: 8,
          paddingTop: 8,
          borderTop: "1px solid #f3f4f6",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            paddingLeft: 4,
            paddingRight: 4,
            paddingTop: 1,
            paddingBottom: 1,
            borderRadius: 4,
            backgroundColor: "#f9fafb",
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: "#10b981",
            }}
          ></div>
          <div
            style={{ color: "#6b7280", fontSize: "0.65rem" }}
            className={"text-sm text-neutral-700"}
          >
            &lt;1%
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            paddingLeft: 4,
            paddingRight: 4,
            paddingTop: 1,
            paddingBottom: 1,
            borderRadius: 4,
            backgroundColor: "#f9fafb",
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: "#f59e0b",
            }}
          ></div>
          <div
            style={{ color: "#6b7280", fontSize: "0.65rem" }}
            className={"text-sm text-neutral-700"}
          >
            1-3%
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            paddingLeft: 4,
            paddingRight: 4,
            paddingTop: 1,
            paddingBottom: 1,
            borderRadius: 4,
            backgroundColor: "#f9fafb",
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: "#ef4444",
            }}
          ></div>
          <div
            style={{ color: "#6b7280", fontSize: "0.65rem" }}
            className={"text-sm text-neutral-700"}
          >
            &gt;3%
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChurnRateStats() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [churnRates, setChurnRates] = useState<{
    daily: number | null;
    weekly: number | null;
    monthly: number | null;
  }>({
    daily: null,
    weekly: null,
    monthly: null,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        try {
          const response = await AdminService.stats.getChurnRate();
          console.log("이탈률 통계 응답:", response);

          if (response) {
            setChurnRates({
              daily:
                response.dailyChurnRate !== undefined
                  ? response.dailyChurnRate
                  : 0,
              weekly:
                response.weeklyChurnRate !== undefined
                  ? response.weeklyChurnRate
                  : 0,
              monthly:
                response.monthlyChurnRate !== undefined
                  ? response.monthlyChurnRate
                  : 0,
            });
          } else {
            setChurnRates({
              daily: 0,
              weekly: 0,
              monthly: 0,
            });
            setError("이탈률 데이터가 없습니다. 샘플 데이터를 표시합니다.");
          }
        } catch (apiError) {
          console.error("API 호출 오류:", apiError);
          setChurnRates({
            daily: 0,
            weekly: 0,
            monthly: 0,
          });
          setError(
            "데이터를 불러오는데 실패했습니다. 샘플 데이터를 표시합니다.",
          );
        }
      } catch (err) {
        console.error("이탈률 통계 조회 중 오류:", err);
        setError("데이터를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (error && !churnRates.daily && !churnRates.weekly && !churnRates.monthly) {
    return (
      <div style={{ padding: 12 }}>
        <Alert status="danger" role="alert">
          <Alert.Content>{error}</Alert.Content>
        </Alert>
      </div>
    );
  }

  return (
    <div style={{ padding: 12 }}>
      {error && (
        <Alert
          style={{ marginBottom: 12, borderRadius: 8 }}
          status={"warning"}
          role="alert"
        >
          <Alert.Content>{error}</Alert.Content>
        </Alert>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
        <ChurnRateCard
          title="일간 이탈률"
          subtitle="최근 24시간"
          rate={churnRates.daily}
          loading={loading}
          iconColor="#3b82f6"
          accentColor="#60a5fa"
        />
        <ChurnRateCard
          title="주간 이탈률"
          subtitle="최근 7일"
          rate={churnRates.weekly}
          loading={loading}
          iconColor="#8b5cf6"
          accentColor="#a78bfa"
        />
        <ChurnRateCard
          title="월간 이탈률"
          subtitle="최근 30일"
          rate={churnRates.monthly}
          loading={loading}
          iconColor="#ec4899"
          accentColor="#f472b6"
        />
      </div>
      <div
        style={{
          marginTop: 12,
          padding: 8,
          borderRadius: 8,
          backgroundColor: "#f9fafb",
          border: "1px solid #e5e7eb",
        }}
      >
        <div
          style={{
            color: "#6b7280",
            fontSize: "0.75rem",
            lineHeight: 1.5,
            display: "block",
          }}
          className={"text-sm text-neutral-700"}
        >
          <strong style={{ color: "#374151" }}>이탈률이란?</strong>특정 기간
          동안 서비스를 떠난 회원의 비율입니다. 낮은 이탈률은 회원 만족도가 높고
          서비스가 안정적임을 의미합니다.
        </div>
      </div>
    </div>
  );
}
