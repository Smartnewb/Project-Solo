"use client";
import { Tabs } from "@heroui/react";
import { LayoutGrid as GridViewIcon, List as ViewListIcon } from "lucide-react";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import StatusCountBar from "./components/StatusCountBar";
import SessionQueue from "./components/SessionQueue";
import ChatPanel from "./components/ChatPanel";
import SessionGrid from "./components/SessionGrid";
import ChatDetailDialog from "./components/ChatDetailDialog";
import { useSessionPolling } from "./hooks/useSessionPolling";
import type { SupportDomain } from "@/app/types/support-chat";

function SupportChatPageContent() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 899px)");
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const router = useRouter();
  const searchParams = useSearchParams();

  const sessionFromUrl = searchParams?.get("session") ?? null;
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    sessionFromUrl,
  );
  const [activeTab, setActiveTab] = useState<"active" | "resolved">("active");
  const [domainFilter, setDomainFilter] = useState<SupportDomain | "all">(
    "all",
  );
  const [viewMode, setViewMode] = useState<"grid" | "split">("grid");
  const [gridSessionId, setGridSessionId] = useState<string | null>(null);
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const [mobileView, setMobileView] = useState<"list" | "chat">(() =>
    sessionFromUrl ? "chat" : "list",
  );

  const prevMessageCountsRef = useRef<Record<string, number>>({});
  const initializedFromUrlRef = useRef(false);
  const notifiedSessionIdsRef = useRef<Set<string>>(new Set());

  // 데스크톱 알림 권한 요청 (최초 1회)
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "default") {
      void Notification.requestPermission();
    }
  }, []);

  // Sync URL → state (when URL changes externally, e.g. browser back/forward)
  useEffect(() => {
    if (sessionFromUrl && sessionFromUrl !== selectedSessionId) {
      setSelectedSessionId(sessionFromUrl);
      if (isMobile) {
        setMobileView("chat");
      }
    } else if (
      !sessionFromUrl &&
      selectedSessionId &&
      !initializedFromUrlRef.current
    ) {
      setSelectedSessionId(null);
    }
    initializedFromUrlRef.current = true;
  }, [sessionFromUrl]);

  const {
    activeSessions,
    resolvedSessions,
    statusCounts,
    newSessionIds,
    clearNewSessionIds,
    refresh,
  } = useSessionPolling();

  // Track unread messages
  useEffect(() => {
    const allSessions = [...activeSessions, ...resolvedSessions];
    const newUnread: Record<string, number> = {};

    allSessions.forEach((session) => {
      const prevCount = prevMessageCountsRef.current[session.sessionId];
      if (prevCount !== undefined && session.messageCount > prevCount) {
        // Only count as unread if not the currently selected session
        if (session.sessionId !== selectedSessionId) {
          newUnread[session.sessionId] =
            (unreadMap[session.sessionId] || 0) +
            (session.messageCount - prevCount);
        }
      }
      prevMessageCountsRef.current[session.sessionId] = session.messageCount;
    });

    if (Object.keys(newUnread).length > 0) {
      setUnreadMap((prev) => ({ ...prev, ...newUnread }));
    }
  }, [activeSessions, resolvedSessions, selectedSessionId]);

  // 신규 대기 문의 데스크톱 알림
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const freshIds = [...newSessionIds].filter(
      (id) => !notifiedSessionIdsRef.current.has(id),
    );
    if (freshIds.length === 0) return;

    freshIds.forEach((id) => notifiedSessionIdsRef.current.add(id));

    const target = activeSessions.find((s) => freshIds.includes(s.sessionId));
    const body =
      freshIds.length === 1
        ? `${target?.userNickname || "사용자"}님의 새 문의가 도착했습니다.`
        : `새 문의 ${freshIds.length}건이 도착했습니다.`;

    try {
      const notification = new Notification("썸타임 고객지원 — 새 문의", {
        body,
        tag: "support-chat-new",
      });
      notification.onclick = () => {
        window.focus();
        if (freshIds.length === 1 && target) {
          handleSelectSession(target.sessionId);
        }
        notification.close();
      };
    } catch {
      // Notification 생성 실패는 무시 (알림은 부가 기능)
    }
    // handleSelectSession 은 아래에서 정의되므로 의존성에서 제외 (ref 기반 안정 호출)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newSessionIds, activeSessions]);

  const handleSelectSession = useCallback(
    (sessionId: string) => {
      setSelectedSessionId(sessionId);
      // Update URL with session ID
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.set("session", sessionId);
      router.replace(`/admin/support-chat?${params.toString()}`, {
        scroll: false,
      });
      // Clear unread for selected session
      setUnreadMap((prev) => {
        if (!prev[sessionId]) return prev;
        const next = { ...prev };
        delete next[sessionId];
        return next;
      });
      if (isMobile) {
        setMobileView("chat");
      }
    },
    [isMobile, router, searchParams],
  );

  const handleSessionUpdated = useCallback(() => {
    refresh();
  }, [refresh]);

  const handleMobileBack = useCallback(() => {
    setMobileView("list");
    setSelectedSessionId(null);
    router.replace("/admin/support-chat", { scroll: false });
  }, [router]);

  // Mobile layout
  if (isMobile) {
    return (
      <div
        style={{
          padding: 16,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <StatusCountBar
          waitingCount={statusCounts.waiting}
          handlingCount={statusCounts.handling}
          resolvedCount={statusCounts.resolved}
        />
        {mobileView === "list" ? (
          <div style={{ flex: 1, overflow: "hidden" }}>
            <SessionQueue
              activeSessions={activeSessions}
              resolvedSessions={resolvedSessions}
              selectedSessionId={selectedSessionId}
              onSelectSession={handleSelectSession}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              domainFilter={domainFilter}
              onDomainFilterChange={setDomainFilter}
              newSessionIds={newSessionIds}
              onClearNewSessionIds={clearNewSessionIds}
              unreadMap={unreadMap}
            />
          </div>
        ) : (
          <div style={{ flex: 1, overflow: "hidden" }}>
            <ChatPanel
              sessionId={selectedSessionId}
              onSessionUpdated={handleSessionUpdated}
              onBack={handleMobileBack}
            />
          </div>
        )}
      </div>
    );
  }

  // Desktop layout
  return (
    <div
      style={{
        padding: 24,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <StatusCountBar
            waitingCount={statusCounts.waiting}
            handlingCount={statusCounts.handling}
            resolvedCount={statusCounts.resolved}
          />
        </div>
        <Tabs
          selectedKey={viewMode}
          onSelectionChange={(key) =>
            setViewMode(String(key) as "grid" | "split")
          }
        >
          <Tabs.ListContainer>
            <Tabs.List>
              <Tabs.Tab id={"grid"}>
                <GridViewIcon size={16} /> 그리드
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id={"split"}>
                <ViewListIcon size={16} /> 목록
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>
      </div>
      {viewMode === "grid" ? (
        <>
          <SessionGrid
            activeSessions={activeSessions}
            resolvedSessions={resolvedSessions}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            domainFilter={domainFilter}
            onDomainFilterChange={setDomainFilter}
            onOpenSession={setGridSessionId}
          />
          {gridSessionId && (
            <ChatDetailDialog
              open
              sessionId={gridSessionId}
              onClose={() => setGridSessionId(null)}
              onSessionUpdated={handleSessionUpdated}
            />
          )}
        </>
      ) : (
        <div
          style={{
            flex: 1,
            display: "flex",
            border: "1px solid #e4e4e7",
            borderColor: "#e4e4e7",
            borderRadius: 2,
            overflow: "hidden",
            backgroundColor: "#ffffff",
          }}
        >
          <SessionQueue
            activeSessions={activeSessions}
            resolvedSessions={resolvedSessions}
            selectedSessionId={selectedSessionId}
            onSelectSession={handleSelectSession}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            domainFilter={domainFilter}
            onDomainFilterChange={setDomainFilter}
            newSessionIds={newSessionIds}
            onClearNewSessionIds={clearNewSessionIds}
            unreadMap={unreadMap}
          />
          <ChatPanel
            sessionId={selectedSessionId}
            onSessionUpdated={handleSessionUpdated}
          />
        </div>
      )}
    </div>
  );
}

export default function SupportChatV2() {
  return <SupportChatPageContent />;
}
