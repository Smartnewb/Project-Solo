"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Divider,
} from "@mui/material";
import AdminService from "@/app/services/admin";
import { UserAppearanceGradeStatsResponse } from "./types";
import AppearanceGradeStatsCard from "@/components/admin/appearance/AppearanceGradeStatsCard";
import UserAppearanceTable from "@/components/admin/appearance/UserAppearanceTable";
import AppearanceFilterPanel from "@/components/admin/appearance/AppearanceFilterPanel";
import UnclassifiedUsersPanel from "@/components/admin/appearance/UnclassifiedUsersPanel";
import DuplicatePhoneUsersPanel from "@/components/admin/appearance/DuplicatePhoneUsersPanel";
import VerifiedUsersPanel from "@/components/admin/appearance/VerifiedUsersPanel";
import BlacklistUsersPanel from "@/components/admin/appearance/BlacklistUsersPanel";
import UniversityVerificationPendingPanel from "@/components/admin/appearance/UniversityVerificationPendingPanel";

// 전역 이벤트 버스 생성 (등급 변경 이벤트 처리용)
export const appearanceGradeEventBus = {
  listeners: new Set<() => void>(),
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  },
  publish() {
    this.listeners.forEach((listener) => listener());
  },
};

export default function AppearanceGradePage() {
  const searchParams = useSearchParams();
  const initialTab = parseInt(searchParams.get("tab") || "0", 10);
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<UserAppearanceGradeStatsResponse | null>(
    null,
  );
  const [refreshTrigger, setRefreshTrigger] = useState(0); // 강제 새로고침을 위한 상태

  const tableRef = useRef<{
    handleApplyFilter: (filters: any) => void;
  } | null>(null);

  const pendingTableRef = useRef<{
    handleApplyFilter: (filters: any) => void;
  } | null>(null);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam) {
      const tabIndex = parseInt(tabParam, 10);
      if (!isNaN(tabIndex) && tabIndex >= 0 && tabIndex <= 6) {
        setActiveTab(tabIndex);
      }
    }
  }, [searchParams]);

  // 통계 데이터 로드 함수
  const fetchStats = async () => {
    try {
      console.log(
        "외모 등급 통계 조회 시작 - 타임스탬프:",
        new Date().toISOString(),
      );
      setLoading(true);
      setError(null);

      // API 호출
      console.log("AdminService.userAppearance.getAppearanceGradeStats 호출");
      const response =
        await AdminService.userAppearance.getAppearanceGradeStats();
      console.log("외모 등급 통계 응답 (요약):", {
        total: response.total,
        statsCount: Array.isArray(response.stats)
          ? response.stats.length
          : "stats가 배열이 아님",
        genderStatsCount: Array.isArray(response.genderStats)
          ? response.genderStats.length
          : "genderStats가 배열이 아님",
      });

      // 응답 데이터 유효성 검사
      if (!response) {
        throw new Error("API 응답이 없습니다.");
      }

      // 이전 통계와 비교
      if (stats && response) {
        console.log("이전 통계 total:", stats.total);
        console.log("새 통계 total:", response.total);

        // 등급별 변화 로깅
        if (Array.isArray(stats.stats) && Array.isArray(response.stats)) {
          console.log("등급별 변화:");

          // 모든 등급에 대한 맵 생성
          const oldStatsMap = new Map();
          stats.stats.forEach((stat) => {
            if (stat && stat.grade) {
              oldStatsMap.set(stat.grade, stat.count || 0);
            }
          });

          // 새 통계와 비교
          response.stats.forEach((newStat) => {
            if (newStat && newStat.grade) {
              const oldCount = oldStatsMap.get(newStat.grade) || 0;
              const newCount = newStat.count || 0;
              console.log(
                `${newStat.grade}: ${oldCount} -> ${newCount} (변화: ${newCount - oldCount})`,
              );
            }
          });
        }
      }

      setStats(response);
    } catch (err: any) {
      console.error("외모 등급 통계 조회 중 오류:", err);
      console.error("오류 상세 정보:", err.response?.data || err.message);
      setError(
        err.message || "외모 등급 통계를 불러오는 중 오류가 발생했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]); // refreshTrigger가 변경되면 데이터 다시 로드

  // 등급 변경 이벤트 구독
  useEffect(() => {
    // 디바운스 타이머 참조
    let debounceTimer: NodeJS.Timeout | null = null;

    // 등급 변경 이벤트 핸들러 (디바운스 적용)
    const handleGradeChange = () => {
      console.log("등급 변경 이벤트 감지");

      // 이미 예약된 타이머가 있으면 취소
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      // 1초 후에 통계 데이터 새로고침 (여러 번 호출 방지)
      debounceTimer = setTimeout(() => {
        console.log("통계 데이터 새로고침 실행 (1초 지연)");
        setRefreshTrigger((prev) => prev + 1); // 강제 새로고침 트리거
      }, 1000);
    };

    // 이벤트 구독
    const unsubscribe = appearanceGradeEventBus.subscribe(handleGradeChange);

    // 컴포넌트 언마운트 시 정리
    return () => {
      // 이벤트 구독 해제
      unsubscribe();

      // 타이머 정리
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        사용자 관리
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 통계 카드 */}
      <Box sx={{ mb: 4 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : stats ? (
          <AppearanceGradeStatsCard stats={stats} />
        ) : null}
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* 탭 메뉴 */}
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="사용자 관리 탭"
        >
          <Tab label="승인된 사용자" />
          <Tab label="미승인 사용자" />
          <Tab label="블랙리스트" />
          <Tab label="미분류 사용자" />
          <Tab label="중복 휴대폰 번호" />
          <Tab label="대학교 인증 사용자" />
          <Tab label="학생증 인증 신청자" />
        </Tabs>
      </Box>

      {/* 탭 컨텐츠 */}
      <Box>
        {activeTab === 0 && (
          <Box>
            <AppearanceFilterPanel
              onFilter={(filters) => {
                if (tableRef.current) {
                  tableRef.current.handleApplyFilter(filters);
                }
              }}
            />
            <UserAppearanceTable
              initialFilters={{}}
              userStatus="approved"
              ref={tableRef}
            />
          </Box>
        )}
        {activeTab === 1 && (
          <Box>
            <AppearanceFilterPanel
              onFilter={(filters) => {
                if (pendingTableRef.current) {
                  pendingTableRef.current.handleApplyFilter(filters);
                }
              }}
            />
            <UserAppearanceTable
              initialFilters={{}}
              userStatus="pending"
              ref={pendingTableRef}
            />
          </Box>
        )}
        {activeTab === 2 && (
          <BlacklistUsersPanel />
        )}
        {activeTab === 3 && (
          <UnclassifiedUsersPanel />
        )}
        {activeTab === 4 && (
          <DuplicatePhoneUsersPanel />
        )}
        {activeTab === 5 && (
          <VerifiedUsersPanel />
        )}
        {activeTab === 6 && (
          <UniversityVerificationPendingPanel />
        )}
      </Box>
        )}
        {activeTab === 1 && (
          <Box>
            <AppearanceFilterPanel
              onFilter={(filters) => {
                if (pendingTableRef.current) {
                  pendingTableRef.current.handleApplyFilter(filters);
                }
              }}
            />
            <UserAppearanceTable
              initialFilters={{}}
              userStatus="pending"
              ref={pendingTableRef}
            />
          </Box>
        )}
        {activeTab === 2 && <ApprovalManagementPanel />}
        {activeTab === 3 && <ProfileImageApprovalPanel />}
        {activeTab === 4 && <BlacklistUsersPanel />}
        {activeTab === 5 && <UnclassifiedUsersPanel />}
        {activeTab === 6 && <DuplicatePhoneUsersPanel />}
        {activeTab === 7 && <VerifiedUsersPanel />}
        {activeTab === 8 && <UniversityVerificationPendingPanel />}
      </Box>
    </Box>
  );
}
