'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Box, ToggleButton, ToggleButtonGroup, useMediaQuery, useTheme } from '@mui/material';
import { GridView as GridViewIcon, ViewList as ViewListIcon } from '@mui/icons-material';
import StatusCountBar from './components/StatusCountBar';
import SessionQueue from './components/SessionQueue';
import ChatPanel from './components/ChatPanel';
import SessionGrid from './components/SessionGrid';
import ChatDetailDialog from './components/ChatDetailDialog';
import { useSessionPolling } from './hooks/useSessionPolling';
import type { SupportDomain } from '@/app/types/support-chat';

function SupportChatPageContent() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();
  const searchParams = useSearchParams();

  const sessionFromUrl = searchParams?.get('session') ?? null;
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(sessionFromUrl);
  const [activeTab, setActiveTab] = useState<'active' | 'resolved'>('active');
  const [domainFilter, setDomainFilter] = useState<SupportDomain | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'split'>('grid');
  const [gridSessionId, setGridSessionId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>(() =>
    isMobile && sessionFromUrl ? 'chat' : 'list'
  );

  const initializedFromUrlRef = useRef(false);
  const notifiedSessionIdsRef = useRef<Set<string>>(new Set());

  // 데스크톱 알림 권한 요청 (최초 1회)
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'default') {
      void Notification.requestPermission();
    }
  }, []);

  // Sync URL → state (when URL changes externally, e.g. browser back/forward)
  useEffect(() => {
    if (sessionFromUrl && sessionFromUrl !== selectedSessionId) {
      setSelectedSessionId(sessionFromUrl);
      if (isMobile) {
        setMobileView('chat');
      }
    } else if (!sessionFromUrl && selectedSessionId && !initializedFromUrlRef.current) {
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

  // 신규 대기 문의 데스크톱 알림
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const freshIds = [...newSessionIds].filter((id) => !notifiedSessionIdsRef.current.has(id));
    if (freshIds.length === 0) return;

    freshIds.forEach((id) => notifiedSessionIdsRef.current.add(id));

    const target = activeSessions.find((s) => freshIds.includes(s.sessionId));
    const body =
      freshIds.length === 1
        ? `${target?.userNickname || '사용자'}님의 새 문의가 도착했습니다.`
        : `새 문의 ${freshIds.length}건이 도착했습니다.`;

    try {
      const notification = new Notification('썸타임 고객지원 — 새 문의', {
        body,
        tag: 'support-chat-new',
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

  const handleSelectSession = useCallback((sessionId: string) => {
    setSelectedSessionId(sessionId);
    // Update URL with session ID
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.set('session', sessionId);
    router.replace(`/admin/support-chat?${params.toString()}`, { scroll: false });
    if (isMobile) {
      setMobileView('chat');
    }
  }, [isMobile, router, searchParams]);

  const handleSessionUpdated = useCallback(() => {
    refresh();
  }, [refresh]);

  const handleMobileBack = useCallback(() => {
    setMobileView('list');
    setSelectedSessionId(null);
    router.replace('/admin/support-chat', { scroll: false });
  }, [router]);

  // Mobile layout
  if (isMobile) {
    return (
      <Box sx={{ p: 2, height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <StatusCountBar
          waitingCount={statusCounts.waiting}
          handlingCount={statusCounts.handling}
          resolvedCount={statusCounts.resolved}
        />
        {mobileView === 'list' ? (
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
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
              onSessionUpdated={handleSessionUpdated}
            />
          </Box>
        ) : (
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <ChatPanel
              sessionId={selectedSessionId}
              onSessionUpdated={handleSessionUpdated}
              onBack={handleMobileBack}
            />
          </Box>
        )}
      </Box>
    );
  }

  // Desktop layout
  return (
    <Box sx={{ p: 3, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <StatusCountBar
            waitingCount={statusCounts.waiting}
            handlingCount={statusCounts.handling}
            resolvedCount={statusCounts.resolved}
          />
        </Box>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={viewMode}
          onChange={(_, value) => value && setViewMode(value)}
          sx={{ mb: 2 }}
        >
          <ToggleButton value="grid">
            <GridViewIcon fontSize="small" sx={{ mr: 0.5 }} /> 그리드
          </ToggleButton>
          <ToggleButton value="split">
            <ViewListIcon fontSize="small" sx={{ mr: 0.5 }} /> 목록
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      {viewMode === 'grid' ? (
        <>
          <SessionGrid
            activeSessions={activeSessions}
            resolvedSessions={resolvedSessions}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            domainFilter={domainFilter}
            onDomainFilterChange={setDomainFilter}
            onOpenSession={setGridSessionId}
            onSessionUpdated={handleSessionUpdated}
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
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: 'background.paper',
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
          onSessionUpdated={handleSessionUpdated}
        />
        <ChatPanel
          sessionId={selectedSessionId}
          onSessionUpdated={handleSessionUpdated}
        />
      </Box>
      )}
    </Box>
  );
}

export default function SupportChatV2() {
  return <SupportChatPageContent />;
}
