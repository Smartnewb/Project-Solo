"use client";

import { useState, useEffect, useCallback } from "react";
import { Box, Typography, CircularProgress, Alert, Grid } from "@mui/material";
import { useRouter } from "next/navigation";
import { dashboardService } from "@/app/services/dashboard";
import { DashboardSummaryResponse } from "./types";

import ActionRequired from "./components/ActionRequired";
import TodayMetrics from "./components/TodayMetrics";
import RevenueOverview from "./components/RevenueOverview";
import QuickAccess from "./components/QuickAccess";
import WeeklyTrend from "./components/WeeklyTrend";

export default function MainDashboard() {
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkAuth = async () => {
      try {
        setAuthChecking(true);
        const token = localStorage.getItem("accessToken");
        const isAdmin = localStorage.getItem("isAdmin");

        if (!token || isAdmin !== "true") {
          setAuthError("관리자 권한이 없습니다. 로그인 페이지로 이동합니다.");
          setTimeout(() => router.push("/"), 2000);
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

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const summaryRes = await dashboardService.getSummary();
      setSummary(summaryRes);
    } catch (err) {
      console.error("대시보드 데이터 로딩 실패:", err);
      setError("대시보드 데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (authChecking || authError) return;

    fetchDashboardData();

    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, [authChecking, authError, fetchDashboardData]);

  if (authChecking) {
    return (
      <Box className="flex items-center justify-center h-screen">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          관리자 권한 확인 중...
        </Typography>
      </Box>
    );
  }

  if (authError) {
    return (
      <Box className="flex flex-col items-center justify-center h-screen">
        <Alert severity="error" sx={{ mb: 2 }}>
          {authError}
        </Alert>
        <Typography variant="body1">
          잠시 후 로그인 페이지로 이동합니다...
        </Typography>
      </Box>
    );
  }

  const today = new Date();
  const formattedDate = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

  return (
    <Box className="min-h-screen bg-gray-50">
      <Box className="bg-white shadow-sm border-b border-gray-200">
        <Box className="max-w-7xl mx-auto px-4 py-4">
          <Box className="flex items-center justify-between">
            <Box>
              <Typography variant="h5" fontWeight="bold" color="textPrimary">
                메인 대시보드
              </Typography>
              <Typography variant="body2" color="textSecondary">
                오늘 해야 할 일을 한눈에 확인하세요
              </Typography>
            </Box>
            <Typography variant="body2" color="textSecondary">
              {formattedDate}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <ActionRequired
          actionItems={summary?.actionItems ?? null}
          loading={loading}
        />

        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <TodayMetrics kpi={summary?.kpi ?? null} loading={loading} />
            <Box sx={{ mt: 3 }}>
              <WeeklyTrend compact />
            </Box>
          </Grid>
          <Grid item xs={12} md={5}>
            <RevenueOverview kpi={summary?.kpi ?? null} loading={loading} />
            <Box sx={{ mt: 3 }}>
              <QuickAccess />
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
