"use client";
import { Card, Spinner } from "@heroui/react";

import { useState, useEffect } from "react";

import AdminService from "@/app/services/admin";
import { getRegionLabel } from "@/components/admin/common/RegionFilter";

interface WeeklySignupsCardProps {
  region?: string;
  includeDeleted?: boolean;
  useCluster?: boolean;
}

export default function WeeklySignupsCard({
  region,
  includeDeleted = false,
  useCluster = true,
}: WeeklySignupsCardProps) {
  const [weeklySignups, setWeeklySignups] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 지역 라벨 생성
  const regionLabel = region
    ? getRegionLabel(region as any, useCluster)
    : "전체 지역";

  useEffect(() => {
    const fetchWeeklySignups = async () => {
      try {
        setLoading(true);
        const data = await AdminService.stats.getWeeklySignupCount(
          region,
          includeDeleted,
          useCluster,
        );
        setWeeklySignups(data.weeklySignups);
        setError(null);
      } catch (err) {
        console.error("이번 주 가입한 회원 수 조회 중 오류:", err);
        setError("데이터를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklySignups();
    // 1분마다 데이터 갱신
    const interval = setInterval(fetchWeeklySignups, 60000);

    return () => clearInterval(interval);
  }, [region, includeDeleted, useCluster]);

  return (
    <Card>
      <Card.Content>
        <div className={"text-sm text-neutral-700"}>
          이번 주 가입자 ({regionLabel})
        </div>
        {loading ? (
          <div>
            <Spinner aria-label="불러오는 중" size="sm" />
          </div>
        ) : error ? (
          <div className={"text-sm text-neutral-700"}>{error}</div>
        ) : (
          <div className={"text-lg font-semibold text-neutral-900"}>
            {weeklySignups?.toLocaleString() || 0}
          </div>
        )}
      </Card.Content>
    </Card>
  );
}
