"use client";
import { Alert, Card, Spinner } from "@heroui/react";

import { useState, useEffect } from "react";

import AdminService from "@/app/services/admin";
import { getRegionLabel } from "@/components/admin/common/RegionFilter";

interface WithdrawalStatsCardProps {
  region?: string;
  useCluster?: boolean;
}

export default function WithdrawalStatsCard({
  region,
  useCluster,
}: WithdrawalStatsCardProps) {
  const [stats, setStats] = useState<{
    totalWithdrawals: number | null;
    dailyWithdrawals: number | null;
    weeklyWithdrawals: number | null;
    monthlyWithdrawals: number | null;
  }>({
    totalWithdrawals: null,
    dailyWithdrawals: null,
    weeklyWithdrawals: null,
    monthlyWithdrawals: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 지역 라벨 생성
  const regionLabel = region
    ? getRegionLabel(region as any, useCluster)
    : "전체 지역";

  useEffect(() => {
    const fetchWithdrawalStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // 병렬로 모든 API 호출
        try {
          const [
            totalResponse,
            dailyResponse,
            weeklyResponse,
            monthlyResponse,
          ] = await Promise.all([
            AdminService.stats.getTotalWithdrawalsCount(region, useCluster),
            AdminService.stats.getDailyWithdrawalCount(region, useCluster),
            AdminService.stats.getWeeklyWithdrawalCount(region, useCluster),
            AdminService.stats.getMonthlyWithdrawalCount(region, useCluster),
          ]);

          console.log("탈퇴 통계 응답:", {
            totalResponse,
            dailyResponse,
            weeklyResponse,
            monthlyResponse,
          });

          // 응답 값이 유효한지 확인
          setStats({
            totalWithdrawals: totalResponse?.totalWithdrawals || 0,
            dailyWithdrawals: dailyResponse?.dailyWithdrawals || 0,
            weeklyWithdrawals: weeklyResponse?.weeklyWithdrawals || 0,
            monthlyWithdrawals: monthlyResponse?.monthlyWithdrawals || 0,
          });
        } catch (apiError) {
          console.error("API 호출 오류:", apiError);
          // 오류 발생 시 기본값 설정
          setStats({
            totalWithdrawals: 0,
            dailyWithdrawals: 0,
            weeklyWithdrawals: 0,
            monthlyWithdrawals: 0,
          });
        }
      } catch (err) {
        console.error("회원 탈퇴 통계 조회 중 오류:", err);
        setError("데이터를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchWithdrawalStats();
    // 1분마다 데이터 갱신
    const interval = setInterval(fetchWithdrawalStats, 60000);

    return () => clearInterval(interval);
  }, [region, useCluster]);

  if (loading) {
    return (
      <Card>
        <Card.Content>
          <div
            style={{ display: "flex", justifyContent: "center", padding: 12 }}
          >
            <Spinner aria-label="불러오는 중" size="sm" />
            <div
              style={{ marginLeft: 8 }}
              className={"text-sm text-neutral-700"}
            >
              데이터를 불러오는 중...
            </div>
          </div>
        </Card.Content>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Card.Content>
          <Alert status="danger" role="alert">
            <Alert.Content>{error}</Alert.Content>
          </Alert>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Content>
        <div className={"text-lg font-semibold text-neutral-900"}>
          회원 탈퇴 통계 ({regionLabel})
        </div>
        <div className={"grid grid-cols-1 gap-4 md:grid-cols-2"}>
          <div className={"min-w-0"}>
            <Card style={{ height: "100%" }}>
              <Card.Content>
                <div className={"text-sm text-neutral-700"}>총 탈퇴자 수</div>
                <div className={"text-lg font-semibold text-neutral-900"}>
                  {stats.totalWithdrawals !== null
                    ? stats.totalWithdrawals.toLocaleString()
                    : "로딩 중..."}
                </div>
              </Card.Content>
            </Card>
          </div>
          <div className={"min-w-0"}>
            <Card style={{ height: "100%" }}>
              <Card.Content>
                <div className={"text-sm text-neutral-700"}>오늘 탈퇴자 수</div>
                <div className={"text-lg font-semibold text-neutral-900"}>
                  {stats.dailyWithdrawals !== null
                    ? stats.dailyWithdrawals.toLocaleString()
                    : "로딩 중..."}
                </div>
              </Card.Content>
            </Card>
          </div>
          <div className={"min-w-0"}>
            <Card style={{ height: "100%" }}>
              <Card.Content>
                <div className={"text-sm text-neutral-700"}>
                  이번 주 탈퇴자 수
                </div>
                <div className={"text-lg font-semibold text-neutral-900"}>
                  {stats.weeklyWithdrawals !== null
                    ? stats.weeklyWithdrawals.toLocaleString()
                    : "로딩 중..."}
                </div>
              </Card.Content>
            </Card>
          </div>
          <div className={"min-w-0"}>
            <Card style={{ height: "100%" }}>
              <Card.Content>
                <div className={"text-sm text-neutral-700"}>
                  이번 달 탈퇴자 수
                </div>
                <div className={"text-lg font-semibold text-neutral-900"}>
                  {stats.monthlyWithdrawals !== null
                    ? stats.monthlyWithdrawals.toLocaleString()
                    : "로딩 중..."}
                </div>
              </Card.Content>
            </Card>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
