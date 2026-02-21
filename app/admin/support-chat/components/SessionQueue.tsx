'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Badge,
  Alert,
  ButtonGroup,
  Button,
  TablePagination,
} from '@mui/material';
import {
  FiberManualRecord as DotIcon,
  Person as PersonIcon,
  Inbox as InboxIcon,
} from '@mui/icons-material';
import type { SupportSessionSummary, SupportDomain } from '@/app/types/support-chat';
import { DOMAIN_LABELS, DOMAIN_COLORS } from '@/app/types/support-chat';

interface SessionQueueProps {
  activeSessions: SupportSessionSummary[];
  resolvedSessions: SupportSessionSummary[];
  selectedSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  activeTab: 'active' | 'resolved';
  onTabChange: (tab: 'active' | 'resolved') => void;
  domainFilter: SupportDomain | 'all';
  onDomainFilterChange: (domain: SupportDomain | 'all') => void;
  newSessionIds: Set<string>;
  onClearNewSessionIds: () => void;
  unreadMap: Record<string, number>;
  resolvedPage: number;
  resolvedTotal: number;
  onResolvedPageChange: (page: number) => void;
}

const statusDotColor: Record<string, string> = {
  waiting_admin: '#f44336',
  admin_handling: '#2196f3',
  resolved: '#4caf50',
  bot_handling: '#9e9e9e',
};

const pulseKeyframes = {
  '@keyframes dotPulse': {
    '0%': { opacity: 1 },
    '50%': { opacity: 0.4 },
    '100%': { opacity: 1 },
  },
};

const highlightKeyframes = {
  '@keyframes fadeHighlight': {
    '0%': { backgroundColor: '#fff8e1' },
    '100%': { backgroundColor: 'transparent' },
  },
};

function SessionCard({
  session,
  selected,
  isNew,
  unreadCount,
  onClick,
}: {
  session: SupportSessionSummary;
  selected: boolean;
  isNew: boolean;
  unreadCount: number;
  onClick: () => void;
}) {
  const [highlight, setHighlight] = useState(isNew);

  useEffect(() => {
    if (isNew) {
      setHighlight(true);
      const timer = setTimeout(() => setHighlight(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isNew]);

  const waitingMinutes = session.status === 'waiting_admin'
    ? Math.floor((Date.now() - new Date(session.createdAt).getTime()) / 60000)
    : null;

  return (
    <Paper
      elevation={selected ? 3 : 0}
      onClick={onClick}
      sx={{
        p: 1.5,
        cursor: 'pointer',
        border: selected ? '2px solid' : '1px solid',
        borderColor: selected ? 'primary.main' : 'divider',
        borderRadius: 2,
        transition: 'all 0.15s ease',
        ...(highlight && {
          ...highlightKeyframes,
          animation: 'fadeHighlight 5s ease forwards',
        }),
        '&:hover': {
          bgcolor: selected ? undefined : 'action.hover',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <DotIcon
          sx={{
            fontSize: 12,
            color: statusDotColor[session.status] || '#9e9e9e',
            ...(session.status === 'waiting_admin' && {
              ...pulseKeyframes,
              animation: 'dotPulse 1.5s ease-in-out infinite',
            }),
          }}
        />
        <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1 }} noWrap>
          {session.userNickname || session.userId.substring(0, 8)}
        </Typography>
        {unreadCount > 0 && (
          <Badge badgeContent={unreadCount} color="error" sx={{ mr: 0.5 }} />
        )}
        {waitingMinutes !== null && (
          <Typography variant="caption" color="error.main" sx={{ fontWeight: 600 }}>
            {waitingMinutes < 1 ? '방금' : `${waitingMinutes}분`}
          </Typography>
        )}
      </Box>
      <Typography variant="body2" color="text.secondary" noWrap sx={{ mb: 0.5, pl: 2.5 }}>
        {session.lastMessage || '메시지 없음'}
      </Typography>
      <Box sx={{ display: 'flex', gap: 0.5, pl: 2.5 }}>
        {session.domain && (
          <Chip
            label={DOMAIN_LABELS[session.domain]}
            color={DOMAIN_COLORS[session.domain]}
            size="small"
            sx={{ fontSize: '0.65rem', height: 20 }}
          />
        )}
      </Box>
    </Paper>
  );
}

export default function SessionQueue({
  activeSessions,
  resolvedSessions,
  selectedSessionId,
  onSelectSession,
  activeTab,
  onTabChange,
  domainFilter,
  onDomainFilterChange,
  newSessionIds,
  onClearNewSessionIds,
  unreadMap,
  resolvedPage,
  resolvedTotal,
  onResolvedPageChange,
}: SessionQueueProps) {
  const sessions = activeTab === 'active' ? activeSessions : resolvedSessions;

  const filtered = domainFilter === 'all'
    ? sessions
    : sessions.filter((s) => s.domain === domainFilter);

  const newCount = newSessionIds.size;

  return (
    <Box
      sx={{
        width: 380,
        minWidth: 380,
        height: 'calc(100vh - 200px)',
        display: 'flex',
        flexDirection: 'column',
        borderRight: 1,
        borderColor: 'divider',
      }}
    >
      {/* Tab toggle + filter */}
      <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <ButtonGroup size="small" fullWidth sx={{ mb: 1 }}>
          <Button
            variant={activeTab === 'active' ? 'contained' : 'outlined'}
            onClick={() => onTabChange('active')}
          >
            활성
          </Button>
          <Button
            variant={activeTab === 'resolved' ? 'contained' : 'outlined'}
            onClick={() => onTabChange('resolved')}
          >
            해결
          </Button>
        </ButtonGroup>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          <Chip
            label="전체"
            onClick={() => onDomainFilterChange('all')}
            color={domainFilter === 'all' ? 'primary' : 'default'}
            size="small"
            variant={domainFilter === 'all' ? 'filled' : 'outlined'}
          />
          {(['payment', 'matching', 'chat', 'account', 'other'] as SupportDomain[]).map((domain) => (
            <Chip
              key={domain}
              label={DOMAIN_LABELS[domain]}
              onClick={() => onDomainFilterChange(domain)}
              color={domainFilter === domain ? DOMAIN_COLORS[domain] : 'default'}
              size="small"
              variant={domainFilter === domain ? 'filled' : 'outlined'}
              sx={{ fontSize: '0.7rem' }}
            />
          ))}
        </Box>
      </Box>

      {/* New session alert */}
      {newCount > 0 && activeTab === 'active' && (
        <Alert
          severity="warning"
          onClose={onClearNewSessionIds}
          sx={{ mx: 1.5, mt: 1, borderRadius: 2 }}
        >
          새 문의 {newCount}건 도착
        </Alert>
      )}

      {/* Session list */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {filtered.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'text.secondary' }}>
            <InboxIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
            <Typography variant="body2">
              {activeTab === 'active' ? '대기/응대 중인 세션이 없습니다.' : '해결된 세션이 없습니다.'}
            </Typography>
          </Box>
        ) : (
          filtered.map((session) => (
            <SessionCard
              key={session.sessionId}
              session={session}
              selected={selectedSessionId === session.sessionId}
              isNew={newSessionIds.has(session.sessionId)}
              unreadCount={unreadMap[session.sessionId] || 0}
              onClick={() => onSelectSession(session.sessionId)}
            />
          ))
        )}
      </Box>

      {/* Resolved pagination */}
      {activeTab === 'resolved' && (
        <TablePagination
          component="div"
          count={resolvedTotal}
          page={resolvedPage - 1}
          onPageChange={(_e, newPage) => onResolvedPageChange(newPage + 1)}
          rowsPerPage={20}
          rowsPerPageOptions={[20]}
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
          sx={{ borderTop: 1, borderColor: 'divider' }}
        />
      )}
    </Box>
  );
}
