"use client";
import { Alert, Separator, Spinner, Tabs } from "@heroui/react";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

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

  const {
    data: stats,
    isLoading: loading,
    error: statsError,
    refetch: refetchStats,
  } = useAppearanceGradeStats();
  const error = statsError
    ? (statsError as any)?.message ||
      "외모 등급 통계를 불러오는 중 오류가 발생했습니다."
    : null;

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

  const handleTabChange = (
    event: React.SyntheticEvent | null,
    newValue: number,
  ) => {
    setActiveTab(newValue);
  };

  return (
    <div>
      <div className={"text-lg font-semibold text-neutral-900"}>
        사용자 관리
      </div>
      {error && (
        <Alert style={{ marginBottom: 12 }} status="danger" role="alert">
          <Alert.Content>{error}</Alert.Content>
        </Alert>
      )}
      {/* 통계 카드 */}
      <div style={{ marginBottom: 16 }}>
        {loading ? (
          <div
            style={{ display: "flex", justifyContent: "center", padding: 16 }}
          >
            <Spinner aria-label="불러오는 중" size="sm" />
          </div>
        ) : stats ? (
          <AppearanceGradeStatsCard stats={stats as any} />
        ) : null}
      </div>
      <Separator style={{ marginTop: 12, marginBottom: 12 }}></Separator>
      {/* 탭 메뉴 */}
      <div style={{ marginBottom: 12 }}>
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => handleTabChange(null, Number(key))}
        >
          <Tabs.List aria-label="목록 보기">
            <Tabs.Tab id={0}>{"승인된 사용자"}</Tabs.Tab>
            <Tabs.Tab id={1}>{"블랙리스트"}</Tabs.Tab>
            <Tabs.Tab id={2}>{"미분류 사용자"}</Tabs.Tab>
            <Tabs.Tab id={3}>{"중복 휴대폰 번호"}</Tabs.Tab>
            <Tabs.Tab id={4}>{"대학교 인증 사용자"}</Tabs.Tab>
            <Tabs.Tab id={5}>{"학생증 인증 신청자"}</Tabs.Tab>
          </Tabs.List>
        </Tabs>
      </div>
      {/* 탭 컨텐츠 */}
      <div>
        <div>
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
        </div>
        {activeTab === 1 && (
          <Alert status={"default"} role="alert">
            <Alert.Content>
              블랙리스트는 새로운 메뉴{" "}
              <a href="/admin/blacklist">/admin/blacklist</a>에서 관리합니다.
            </Alert.Content>
          </Alert>
        )}
        {activeTab === 2 && <UnclassifiedUsersPanel />}
        {activeTab === 3 && <DuplicatePhoneUsersPanel />}
        {activeTab === 4 && <VerifiedUsersPanel />}
        {activeTab === 5 && <UniversityVerificationPendingPanel />}
      </div>
    </div>
  );
}

export default function AppearanceGradePage() {
  return <AppearanceGradePageContent />;
}
