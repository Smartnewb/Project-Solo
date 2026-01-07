"use client";

import { useState, useEffect } from "react";
import {
  Box,
  CircularProgress,
  Alert,
  Typography,
  Chip,
  Skeleton,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
} from "@mui/icons-material";
import AdminService from "@/app/services/admin";

type PeriodType = "7days" | "30days" | "90days" | "all";

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
    return <TrendingDownIcon sx={{ fontSize: 18 }} />;
  } else if (rate < 3) {
    return <TrendingFlatIcon sx={{ fontSize: 18 }} />;
  } else {
    return <TrendingUpIcon sx={{ fontSize: 18 }} />;
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
    <Box
      sx={{
        position: "relative",
        p: 3,
        borderRadius: 3,
        backgroundColor: "#fff",
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        transition: "all 0.2s ease",
        overflow: "hidden",
        "&:hover": {
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          borderColor: accentColor,
        },
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${accentColor}, ${iconColor})`,
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Box>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: "#374151",
              mb: 0.5,
              fontSize: "0.875rem",
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "#9ca3af",
              fontSize: "0.75rem",
            }}
          >
            {subtitle}
          </Typography>
        </Box>
        {!loading && rate !== null && churnLevel && (
          <Chip
            icon={getTrendIcon(rate)}
            label={churnLevel.label}
            size="small"
            sx={{
              backgroundColor: churnLevel.bgColor,
              color: churnLevel.color,
              border: `1px solid ${churnLevel.borderColor}`,
              fontWeight: 600,
              fontSize: "0.7rem",
              height: 24,
              "& .MuiChip-icon": {
                color: churnLevel.color,
              },
            }}
          />
        )}
      </Box>

      {loading ? (
        <Skeleton
          variant="text"
          width="60%"
          height={48}
          sx={{ borderRadius: 1 }}
        />
      ) : (
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
          <Typography
            sx={{
              fontSize: "2.25rem",
              fontWeight: 700,
              color: churnLevel ? churnLevel.color : "#374151",
              lineHeight: 1,
              fontFamily: '"SF Mono", "Monaco", "Inconsolata", monospace',
            }}
          >
            {rate !== null ? rate.toFixed(2) : "-"}
          </Typography>
          <Typography
            sx={{
              fontSize: "1rem",
              fontWeight: 600,
              color: "#9ca3af",
            }}
          >
            %
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          mt: 2,
          pt: 2,
          borderTop: "1px solid #f3f4f6",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            px: 1,
            py: 0.25,
            borderRadius: 1,
            backgroundColor: "#f9fafb",
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: "#10b981",
            }}
          />
          <Typography
            variant="caption"
            sx={{ color: "#6b7280", fontSize: "0.65rem" }}
          >
            &lt;1%
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            px: 1,
            py: 0.25,
            borderRadius: 1,
            backgroundColor: "#f9fafb",
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: "#f59e0b",
            }}
          />
          <Typography
            variant="caption"
            sx={{ color: "#6b7280", fontSize: "0.65rem" }}
          >
            1-3%
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            px: 1,
            py: 0.25,
            borderRadius: 1,
            backgroundColor: "#f9fafb",
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: "#ef4444",
            }}
          />
          <Typography
            variant="caption"
            sx={{ color: "#6b7280", fontSize: "0.65rem" }}
          >
            &gt;3%
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

const periodOptions: { value: PeriodType; label: string }[] = [
  { value: "7days", label: "최근 7일" },
  { value: "30days", label: "최근 30일" },
  { value: "90days", label: "최근 90일" },
  { value: "all", label: "전체 기간" },
];

export default function ChurnRateStats() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("30days");
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
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            mb: 1.5,
          }}
        >
          {periodOptions.map((option) => (
            <Box
              key={option.value}
              onClick={() => setSelectedPeriod(option.value)}
              sx={{
                px: 2,
                py: 0.75,
                borderRadius: 2,
                cursor: "pointer",
                fontSize: "0.8125rem",
                fontWeight: 500,
                transition: "all 0.15s ease",
                backgroundColor:
                  selectedPeriod === option.value ? "#8b5cf6" : "#f3f4f6",
                color: selectedPeriod === option.value ? "#fff" : "#6b7280",
                border:
                  selectedPeriod === option.value
                    ? "1px solid #8b5cf6"
                    : "1px solid #e5e7eb",
                "&:hover": {
                  backgroundColor:
                    selectedPeriod === option.value ? "#7c3aed" : "#e5e7eb",
                },
              }}
            >
              {option.label}
            </Box>
          ))}
        </Box>
        <Typography
          variant="caption"
          sx={{
            color: "#9ca3af",
            fontSize: "0.7rem",
            display: "flex",
            alignItems: "center",
            gap: 0.5,
          }}
        >
          <Box
            component="span"
            sx={{
              display: "inline-block",
              width: 4,
              height: 4,
              borderRadius: "50%",
              backgroundColor: "#d1d5db",
            }}
          />
          기간 필터는 추후 지원 예정
        </Typography>
      </Box>

      {error && (
        <Alert
          severity="warning"
          sx={{
            mb: 3,
            borderRadius: 2,
            "& .MuiAlert-message": {
              fontSize: "0.8125rem",
            },
          }}
        >
          {error}
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(3, 1fr)",
          },
          gap: 2,
        }}
      >
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
      </Box>

      <Box
        sx={{
          mt: 3,
          p: 2,
          borderRadius: 2,
          backgroundColor: "#f9fafb",
          border: "1px solid #e5e7eb",
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: "#6b7280",
            fontSize: "0.75rem",
            lineHeight: 1.5,
            display: "block",
          }}
        >
          <strong style={{ color: "#374151" }}>이탈률이란?</strong> 특정 기간
          동안 서비스를 떠난 회원의 비율입니다. 낮은 이탈률은 회원 만족도가 높고
          서비스가 안정적임을 의미합니다.
        </Typography>
      </Box>
    </Box>
  );
}
