"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Divider,
} from "@mui/material";
import { useAppearanceGradeStats } from "@/app/admin/hooks";
import AppearanceGradeStatsCard from "@/components/admin/appearance/AppearanceGradeStatsCard";
import UserAppearanceTable from "@/components/admin/appearance/UserAppearanceTable";
import AppearanceFilterPanel from "@/components/admin/appearance/AppearanceFilterPanel";
import UnclassifiedUsersPanel from "@/components/admin/appearance/UnclassifiedUsersPanel";
import DuplicatePhoneUsersPanel from "@/components/admin/appearance/DuplicatePhoneUsersPanel";
import VerifiedUsersPanel from "@/components/admin/appearance/VerifiedUsersPanel";
import UniversityVerificationPendingPanel from "@/components/admin/appearance/UniversityVerificationPendingPanel";
import { appearanceGradeEventBus } from "./event-bus";

function AppearanceGradePageContent() {
  const searchParams = useSearchParams();
  const initialTab = parseInt(searchParams?.get("tab") || "0", 10);

  const [activeTab, setActiveTab] = useState(initialTab);

  const tableRef = useRef<{
    handleApplyFilter: (filters: any) => void;
  } | null>(null);

  const { data: stats, isLoading: loading, error: statsError, refetch: refetchStats } = useAppearanceGradeStats();
  const error = statsError ? (statsError as any)?.message || "외모 등급 통계를 불러오는 중 오류가 발생했습니다." : null;

  useEffect(() => {
    const tabParam = searchParams?.get("tab");
    if (tabParam) {
      const tabIndex = parseInt(tabParam, 10);
      if (!isNaN(tabIndex) && tabIndex >= 0 && tabIndex <= 5) {
        setActiveTab(tabIndex);
      }
    }
  }, [searchParams]);

  // 등급 변경 이벤트 구독
  useEffect(() => {
    let debounceTimer: NodeJS.Timeout | null = null;

    const handleGradeChange = () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        refetchStats();
      }, 1000);
    };

    const unsubscribe = appearanceGradeEventBus.subscribe(handleGradeChange);

    return () => {
      unsubscribe();
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [refetchStats]);

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
          <AppearanceGradeStatsCard stats={stats as any} />
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
          <Alert severity="info">
            블랙리스트는 새로운 메뉴 <a href="/admin/blacklist">/admin/blacklist</a>에서 관리합니다.
          </Alert>
        )}
        {activeTab === 2 && <UnclassifiedUsersPanel />}
        {activeTab === 3 && <DuplicatePhoneUsersPanel />}
        {activeTab === 4 && <VerifiedUsersPanel />}
        {activeTab === 5 && <UniversityVerificationPendingPanel />}
      </Box>
    </Box>
  );
}

export default function AppearanceGradePage() {
  return (
    <AppearanceGradePageContent />
  );
}
