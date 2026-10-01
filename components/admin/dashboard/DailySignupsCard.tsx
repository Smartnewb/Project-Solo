"use client";
import { Card, Spinner } from "@heroui/react";

import { useState, useEffect } from "react";

import AdminService from "@/app/services/admin";
import { getRegionLabel } from "@/components/admin/common/RegionFilter";

interface DailySignupsCardProps {
  region?: string;
  includeDeleted?: boolean;
  useCluster?: boolean;
}

export default function DailySignupsCard({
  region,
  includeDeleted = false,
  useCluster = true,
}: DailySignupsCardProps) {
  const [dailySignups, setDailySignups] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 지역 라벨 생성
  const regionLabel = region
    ? getRegionLabel(region as any, useCluster)
    : "전체 지역";

  useEffect(() => {
    const fetchDailySignups = async () => {
      try {
        setLoading(true);
        const data = await AdminService.stats.getDailySignupCount(
          region,
          includeDeleted,
          useCluster,
        );
        setDailySignups(data.dailySignups);
        setError(null);
      } catch (err) {
        console.error("오늘 가입한 회원 수 조회 중 오류:", err);
        setError("데이터를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchDailySignups();
    // 1분마다 데이터 갱신
    const interval = setInterval(fetchDailySignups, 60000);

    return () => clearInterval(interval);
  }, [region, includeDeleted, useCluster]);

  return (
    <Card>
      <Card.Content>
        <div className={"text-sm text-neutral-700"}>
          오늘의 신규 가입 ({regionLabel})
        </div>
        {loading ? (
          <div>
            <Spinner aria-label="불러오는 중" size="sm" />
          </div>
        ) : error ? (
          <div className={"text-sm text-neutral-700"}>{error}</div>
        ) : (
          <div className={"text-lg font-semibold text-neutral-900"}>
            {dailySignups?.toLocaleString() || 0}
          </div>
        )}
      </Card.Content>
    </Card>
  );
}
