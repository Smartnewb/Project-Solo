'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import StatusCountBar from './components/StatusCountBar';
import SessionQueue from './components/SessionQueue';
import ChatPanel from './components/ChatPanel';
import { useSessionPolling } from './hooks/useSessionPolling';
import type { SupportDomain } from '@/app/types/support-chat';

export default function SupportChatPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'resolved'>('active');
  const [domainFilter, setDomainFilter] = useState<SupportDomain | 'all'>('all');
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  const prevMessageCountsRef = useRef<Record<string, number>>({});

  const {
    activeSessions,
    resolvedSessions,
    statusCounts,
    newSessionIds,
    clearNewSessionIds,
    refresh,
    resolvedPage,
    resolvedTotal,
    setResolvedPage,
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
          newUnread[session.sessionId] = (unreadMap[session.sessionId] || 0) + (session.messageCount - prevCount);
        }
      }
      prevMessageCountsRef.current[session.sessionId] = session.messageCount;
    });

    if (Object.keys(newUnread).length > 0) {
      setUnreadMap((prev) => ({ ...prev, ...newUnread }));
    }
  }, [activeSessions, resolvedSessions, selectedSessionId]);

  const handleSelectSession = useCallback((sessionId: string) => {
    setSelectedSessionId(sessionId);
    // Clear unread for selected session
    setUnreadMap((prev) => {
      if (!prev[sessionId]) return prev;
      const next = { ...prev };
      delete next[sessionId];
      return next;
    });
    if (isMobile) {
      setMobileView('chat');
    }
  }, [isMobile]);

  const handleSessionUpdated = useCallback(() => {
    refresh();
  }, [refresh]);

  const handleMobileBack = useCallback(() => {
    setMobileView('list');
  }, []);

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
              unreadMap={unreadMap}
              resolvedPage={resolvedPage}
              resolvedTotal={resolvedTotal}
              onResolvedPageChange={setResolvedPage}
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
      <StatusCountBar
        waitingCount={statusCounts.waiting}
        handlingCount={statusCounts.handling}
        resolvedCount={statusCounts.resolved}
      />
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
          unreadMap={unreadMap}
          resolvedPage={resolvedPage}
          resolvedTotal={resolvedTotal}
          onResolvedPageChange={setResolvedPage}
        />
        <ChatPanel
          sessionId={selectedSessionId}
          onSessionUpdated={handleSessionUpdated}
        />
      </Box>
    </Box>
  );
}
