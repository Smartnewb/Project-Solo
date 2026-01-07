"use client";

import { useState, useEffect } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Alert,
  CircularProgress,
  FormControlLabel,
  Switch,
} from "@mui/material";
import {
  TuneRounded as FilterIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  WcOutlined as GenderIcon,
  SchoolOutlined as UniversityIcon,
  PersonRemove as WithdrawalIcon,
  Insights as InsightsIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ko } from "date-fns/locale";
import TotalUsersCard from "@/components/admin/dashboard/TotalUsersCard";
import DailySignupsCard from "@/components/admin/dashboard/DailySignupsCard";
import WeeklySignupsCard from "@/components/admin/dashboard/WeeklySignupsCard";
import GenderStatsCard from "@/components/admin/dashboard/GenderStatsCard";
import UniversityStatsCard from "@/components/admin/dashboard/UniversityStatsCard";
import SignupStatsDashboard from "@/components/admin/dashboard/SignupStatsDashboard";

import WithdrawalStatsCard from "@/components/admin/dashboard/WithdrawalStatsCard";
import WithdrawalStatsDashboard from "@/components/admin/dashboard/WithdrawalStatsDashboard";
import WithdrawalReasonStats from "@/components/admin/dashboard/WithdrawalReasonStats";
import ChurnRateStats from "@/components/admin/dashboard/ChurnRateStats";
import RegionFilter, {
  useRegionFilter,
} from "@/components/admin/common/RegionFilter";
import IncludeDeletedFilter, {
  useIncludeDeletedFilter,
} from "@/components/admin/common/IncludeDeletedFilter";

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  color?: string;
  bgColor?: string;
}

function SectionHeader({
  icon,
  title,
  subtitle,
  color = "#8b5cf6",
  bgColor = "#f5f3ff",
}: SectionHeaderProps) {
  return (
    <Box className="flex items-center gap-3 mb-4">
      <Box
        sx={{
          p: 1.5,
          borderRadius: 2,
          backgroundColor: bgColor,
          color: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, color: "#111827" }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ color: "#6b7280" }}>
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export default function MemberStatsDashboard() {
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    region,
    useCluster,
    setRegion: setRegionFilter,
    setUseCluster: setUseClusterMode,
    getRegionParam,
    getUseClusterParam,
  } = useRegionFilter();

  const { includeDeleted, setIncludeDeleted, getIncludeDeletedParam } =
    useIncludeDeletedFilter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkAuth = async () => {
      try {
        setAuthChecking(true);
        const token = localStorage.getItem("accessToken");
        const isAdmin = localStorage.getItem("isAdmin");

        if (!token || isAdmin !== "true") {
          setAuthError("관리자 권한이 없습니다. 로그인 페이지로 이동합니다.");
          setTimeout(() => {
            router.push("/");
          }, 2000);
          return;
        }

        setAuthError(null);
      } catch (error) {
        console.error("인증 확인 오류:", error);
        setAuthError("인증 확인 중 오류가 발생했습니다.");
      } finally {
        setAuthChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  if (authChecking) {
    return (
      <Box className="flex items-center justify-center h-screen bg-gray-50">
        <CircularProgress sx={{ color: "#8b5cf6" }} />
        <Typography variant="h6" sx={{ ml: 2, color: "#374151" }}>
          관리자 권한 확인 중...
        </Typography>
      </Box>
    );
  }

  if (authError) {
    return (
      <Box className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <Alert severity="error" sx={{ mb: 2 }}>
          {authError}
        </Alert>
        <Typography variant="body1" sx={{ color: "#6b7280" }}>
          잠시 후 로그인 페이지로 이동합니다...
        </Typography>
      </Box>
    );
  }

  const today = new Date();
  const formattedDate = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
  const dayOfWeek = ["일", "월", "화", "수", "목", "금", "토"][today.getDay()];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
      <Box className="min-h-screen bg-gray-50">
        <Box
          sx={{
            background:
              "linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #3b82f6 100%)",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <Box className="max-w-7xl mx-auto px-4 py-6">
            <Box className="flex items-center justify-between">
              <Box>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 700, color: "#fff", mb: 0.5 }}
                >
                  회원 통계
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "rgba(255,255,255,0.8)" }}
                >
                  전체 회원 현황과 트렌드를 한눈에 확인하세요
                </Typography>
              </Box>
              <Box
                sx={{
                  px: 3,
                  py: 1.5,
                  borderRadius: 2,
                  backgroundColor: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ color: "#fff", fontWeight: 500 }}
                >
                  {formattedDate} ({dayOfWeek})
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        <Box className="max-w-7xl mx-auto px-4 -mt-4">
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              border: "1px solid #e5e7eb",
            }}
          >
            <CardContent sx={{ py: 2 }}>
              <Box className="flex items-center justify-between">
                <Box className="flex items-center gap-4 flex-wrap">
                  <Box className="flex items-center gap-2">
                    <FilterIcon sx={{ color: "#8b5cf6", fontSize: 20 }} />
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, color: "#374151" }}
                    >
                      필터
                    </Typography>
                  </Box>

                  <RegionFilter
                    value={region}
                    onChange={setRegionFilter}
                    useCluster={useCluster}
                    onClusterModeChange={setUseClusterMode}
                    showClusterToggle={false}
                    size="small"
                    sx={{ minWidth: 160 }}
                  />

                  <IncludeDeletedFilter
                    value={includeDeleted}
                    onChange={setIncludeDeleted}
                    size="small"
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={useCluster}
                        onChange={(e) => setUseClusterMode(e.target.checked)}
                        size="small"
                        sx={{
                          "& .MuiSwitch-switchBase.Mui-checked": {
                            color: "#8b5cf6",
                          },
                          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                            {
                              backgroundColor: "#8b5cf6",
                            },
                        }}
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ color: "#6b7280" }}>
                        {useCluster ? "클러스터 단위" : "개별 지역"}
                      </Typography>
                    }
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              border: "1px solid #e5e7eb",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                px: 3,
                py: 2,
                borderBottom: "1px solid #e5e7eb",
                backgroundColor: "#f9fafb",
              }}
            >
              <SectionHeader
                icon={<InsightsIcon />}
                title="실시간 회원 현황"
                subtitle="실시간으로 업데이트되는 회원 통계"
                color="#3b82f6"
                bgColor="#eff6ff"
              />
            </Box>
            <CardContent sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={4}>
                  <TotalUsersCard
                    region={getRegionParam()}
                    includeDeleted={getIncludeDeletedParam()}
                    useCluster={getUseClusterParam()}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <WeeklySignupsCard
                    region={getRegionParam()}
                    includeDeleted={getIncludeDeletedParam()}
                    useCluster={getUseClusterParam()}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <DailySignupsCard
                    region={getRegionParam()}
                    includeDeleted={getIncludeDeletedParam()}
                    useCluster={getUseClusterParam()}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card
            sx={{
              borderRadius: 3,
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              border: "1px solid #e5e7eb",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                px: 3,
                py: 2,
                borderBottom: "1px solid #e5e7eb",
                backgroundColor: "#f9fafb",
              }}
            >
              <SectionHeader
                icon={<GenderIcon />}
                title="성별 분포"
                subtitle="회원 성비 현황"
                color="#ec4899"
                bgColor="#fdf2f8"
              />
            </Box>
            <CardContent sx={{ p: 0 }}>
              <GenderStatsCard
                region={getRegionParam()}
                includeDeleted={getIncludeDeletedParam()}
                useCluster={getUseClusterParam()}
              />
            </CardContent>
          </Card>

          <Card
            sx={{
              borderRadius: 3,
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              border: "1px solid #e5e7eb",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                px: 3,
                py: 2,
                borderBottom: "1px solid #e5e7eb",
                backgroundColor: "#f9fafb",
              }}
            >
              <SectionHeader
                icon={<TrendingUpIcon />}
                title="가입 추이"
                subtitle="일별, 주별, 월별 가입 트렌드"
                color="#10b981"
                bgColor="#ecfdf5"
              />
            </Box>
            <CardContent sx={{ p: 0 }}>
              <SignupStatsDashboard
                region={getRegionParam()}
                includeDeleted={getIncludeDeletedParam()}
              />
            </CardContent>
          </Card>

          <Card
            sx={{
              borderRadius: 3,
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              border: "1px solid #e5e7eb",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                px: 3,
                py: 2,
                borderBottom: "1px solid #e5e7eb",
                backgroundColor: "#f9fafb",
              }}
            >
              <SectionHeader
                icon={<UniversityIcon />}
                title="대학별 통계"
                subtitle="대학교별 회원 분포"
                color="#f59e0b"
                bgColor="#fffbeb"
              />
            </Box>
            <CardContent sx={{ p: 0 }}>
              <UniversityStatsCard
                region={getRegionParam()}
                includeDeleted={getIncludeDeletedParam()}
                useCluster={getUseClusterParam()}
              />
            </CardContent>
          </Card>

          <Box sx={{ py: 4 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              <Box
                sx={{
                  flex: 1,
                  height: 1,
                  background: "linear-gradient(90deg, transparent, #e5e7eb)",
                }}
              />
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  px: 4,
                  py: 2,
                  borderRadius: 3,
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                }}
              >
                <WithdrawalIcon sx={{ color: "#ef4444" }} />
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, color: "#991b1b" }}
                >
                  회원 탈퇴 분석
                </Typography>
              </Box>
              <Box
                sx={{
                  flex: 1,
                  height: 1,
                  background: "linear-gradient(90deg, #e5e7eb, transparent)",
                }}
              />
            </Box>
          </Box>

          <Card
            sx={{
              borderRadius: 3,
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              border: "1px solid #fecaca",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                px: 3,
                py: 2,
                borderBottom: "1px solid #fecaca",
                backgroundColor: "#fef2f2",
              }}
            >
              <SectionHeader
                icon={<WithdrawalIcon />}
                title="탈퇴 현황"
                subtitle="기간별 탈퇴자 수"
                color="#ef4444"
                bgColor="#fee2e2"
              />
            </Box>
            <CardContent sx={{ p: 0 }}>
              <WithdrawalStatsCard region={getRegionParam()} />
            </CardContent>
          </Card>

          <Card
            sx={{
              borderRadius: 3,
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              border: "1px solid #e5e7eb",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                px: 3,
                py: 2,
                borderBottom: "1px solid #e5e7eb",
                backgroundColor: "#f9fafb",
              }}
            >
              <SectionHeader
                icon={<TrendingDownIcon />}
                title="탈퇴 추이"
                subtitle="시간에 따른 탈퇴 패턴 분석"
                color="#ef4444"
                bgColor="#fef2f2"
              />
            </Box>
            <CardContent sx={{ p: 0 }}>
              <WithdrawalStatsDashboard />
            </CardContent>
          </Card>

          <Grid container spacing={3}>
            <Grid item xs={12} lg={6}>
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  border: "1px solid #e5e7eb",
                  overflow: "hidden",
                  height: "100%",
                }}
              >
                <Box
                  sx={{
                    px: 3,
                    py: 2,
                    borderBottom: "1px solid #e5e7eb",
                    backgroundColor: "#f9fafb",
                  }}
                >
                  <SectionHeader
                    icon={<InsightsIcon />}
                    title="탈퇴 사유 분석"
                    subtitle="회원들이 떠나는 이유"
                    color="#f59e0b"
                    bgColor="#fffbeb"
                  />
                </Box>
                <CardContent sx={{ p: 0 }}>
                  <WithdrawalReasonStats />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} lg={6}>
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  border: "1px solid #e5e7eb",
                  overflow: "hidden",
                  height: "100%",
                }}
              >
                <Box
                  sx={{
                    px: 3,
                    py: 2,
                    borderBottom: "1px solid #e5e7eb",
                    backgroundColor: "#f9fafb",
                  }}
                >
                  <SectionHeader
                    icon={<TrendingDownIcon />}
                    title="이탈률 분석"
                    subtitle="회원 유지율 모니터링"
                    color="#8b5cf6"
                    bgColor="#f5f3ff"
                  />
                </Box>
                <CardContent sx={{ p: 0 }}>
                  <ChurnRateStats />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </LocalizationProvider>
  );
}
