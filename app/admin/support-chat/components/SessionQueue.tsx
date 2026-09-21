'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Badge,
  Alert,
  ButtonGroup,
  Button,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  FiberManualRecord as DotIcon,
  Inbox as InboxIcon,
  AutoAwesome as ReviewInboxIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import type { SupportSessionSummary, SupportDomain } from '@/app/types/support-chat';
import { DOMAIN_LABELS, DOMAIN_COLORS } from '@/app/types/support-chat';
import { useAdminSession } from '@/shared/contexts/admin-session-context';

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
}

const statusDotColor: Record<string, string> = {
  waiting_admin: '#f44336',
  admin_handling: '#2196f3',
  resolved: '#4caf50',
  admin_resolved: '#4caf50',
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

const slaBlinkKeyframes = {
  '@keyframes slaBlink': {
    '0%': { opacity: 1 },
    '50%': { opacity: 0.35 },
    '100%': { opacity: 1 },
  },
};

/** SLA 임계(분) */
const SLA_WARN_MINUTES = 10;
const SLA_CRITICAL_MINUTES = 30;

function computeWaitingMinutes(session: SupportSessionSummary): number | null {
  if (session.status !== 'waiting_admin') return null;
  const waitingStartedAt = session.waitingSince ?? session.createdAt;
  return Math.floor((Date.now() - new Date(waitingStartedAt).getTime()) / 60000);
}

function SessionCard({
  session,
  selected,
  isNew,
  unreadCount,
  assignedToMe,
  onClick,
}: {
  session: SupportSessionSummary;
  selected: boolean;
  isNew: boolean;
  unreadCount: number;
  assignedToMe: boolean;
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

  const waitingMinutes = computeWaitingMinutes(session);
  const slaLevel: 'normal' | 'warn' | 'critical' =
    waitingMinutes === null
      ? 'normal'
      : waitingMinutes >= SLA_CRITICAL_MINUTES
        ? 'critical'
        : waitingMinutes >= SLA_WARN_MINUTES
          ? 'warn'
          : 'normal';

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
        {assignedToMe && (
          <Chip label="내 담당" color="primary" size="small" sx={{ fontSize: '0.6rem', height: 18, mr: 0.5 }} />
        )}
        {session.assignedAdminId && !assignedToMe && (
          <Chip label="배정됨" size="small" variant="outlined" sx={{ fontSize: '0.6rem', height: 18, mr: 0.5 }} />
        )}
        {unreadCount > 0 && (
          <Badge badgeContent={unreadCount} color="error" sx={{ mr: 0.5 }} />
        )}
        {waitingMinutes !== null && (
          <Typography
            variant="caption"
            sx={{
              fontWeight: slaLevel === 'normal' ? 600 : 700,
              color: slaLevel === 'normal' ? 'error.main' : slaLevel === 'warn' ? '#e65100' : '#b71c1c',
              ...(slaLevel === 'critical' && {
                ...slaBlinkKeyframes,
                animation: 'slaBlink 1.2s ease-in-out infinite',
              }),
            }}
          >
            {waitingMinutes < 1 ? '방금' : `${waitingMinutes}분`}
            {slaLevel === 'critical' ? ' ⚠' : ''}
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
}: SessionQueueProps) {
  const [search, setSearch] = useState('');
  const [myOnly, setMyOnly] = useState(false);
  const { session: adminSession } = useAdminSession();
  const myAdminId = adminSession?.user.id;

  const sessions = activeTab === 'active' ? activeSessions : resolvedSessions;

  const filtered = useMemo(() => {
    const byAssignee =
      myOnly && myAdminId ? sessions.filter((s) => s.assignedAdminId === myAdminId) : sessions;

    const byDomain =
      domainFilter === 'all' ? byAssignee : byAssignee.filter((s) => s.domain === domainFilter);

    const query = search.trim().toLowerCase();
    const bySearch = query
      ? byDomain.filter(
          (s) =>
            (s.userNickname?.toLowerCase().includes(query) ?? false) ||
            s.userId.toLowerCase().includes(query) ||
            (s.lastMessage?.toLowerCase().includes(query) ?? false)
        )
      : byDomain;

    if (activeTab !== 'active') return bySearch;

    // 활성 탭: 대기(가장 오래 기다린 순) → AI 응대 → 어드민 응대
    const statusRank: Record<string, number> = {
      waiting_admin: 0,
      bot_handling: 1,
      admin_handling: 2,
    };
    const waitingStart = (s: SupportSessionSummary) =>
      new Date(s.waitingSince ?? s.createdAt).getTime();

    return [...bySearch].sort((a, b) => {
      const rankDiff = (statusRank[a.status] ?? 3) - (statusRank[b.status] ?? 3);
      if (rankDiff !== 0) return rankDiff;
      // 같은 상태면 오래된(작은 timestamp) 순 우선
      return waitingStart(a) - waitingStart(b);
    });
  }, [sessions, domainFilter, search, activeTab, myOnly, myAdminId]);

  const newCount = newSessionIds.size;
  const hasOtherTabItems = activeTab === 'active' ? resolvedSessions.length > 0 : activeSessions.length > 0;
  const emptyTitle = activeTab === 'active' ? '대기/응대 중인 세션이 없습니다.' : '해결된 세션이 없습니다.';
  const emptyDescription =
    domainFilter === 'all'
      ? activeTab === 'active'
        ? '지금 바로 응대할 고객지원 세션은 없습니다. 완료된 상담이나 검토 인박스에서 남은 처리 건을 확인할 수 있습니다.'
        : '해결 완료로 분류된 상담 세션이 없습니다.'
      : `${DOMAIN_LABELS[domainFilter]} 필터에 해당하는 세션이 없습니다.`;

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
        <TextField
          fullWidth
          size="small"
          placeholder="닉네임 · 유저ID · 메시지 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
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
        {myAdminId && (
          <Chip
            label="내 문의만"
            onClick={() => setMyOnly((v) => !v)}
            color={myOnly ? 'primary' : 'default'}
            size="small"
            variant={myOnly ? 'filled' : 'outlined'}
            sx={{ fontSize: '0.7rem', mt: 0.75 }}
          />
        )}
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
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              color: 'text.secondary',
              textAlign: 'center',
              px: 2,
              gap: 1,
            }}
          >
            <InboxIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {emptyTitle}
            </Typography>
            <Typography variant="caption" sx={{ lineHeight: 1.5 }}>
              {emptyDescription}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, width: '100%', mt: 1 }}>
              {domainFilter !== 'all' ? (
                <Button size="small" variant="outlined" onClick={() => onDomainFilterChange('all')}>
                  전체 문의 보기
                </Button>
              ) : null}
              {hasOtherTabItems ? (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => onTabChange(activeTab === 'active' ? 'resolved' : 'active')}
                >
                  {activeTab === 'active' ? '해결 세션 보기' : '활성 세션 보기'}
                </Button>
              ) : null}
              {activeTab === 'active' ? (
                <Button
                  size="small"
                  variant="contained"
                  component={Link}
                  href="/admin/review-inbox"
                  startIcon={<ReviewInboxIcon />}
                >
                  검토 인박스 보기
                </Button>
              ) : null}
            </Box>
          </Box>
        ) : (
          filtered.map((session) => (
            <SessionCard
              key={session.sessionId}
              session={session}
              selected={selectedSessionId === session.sessionId}
              isNew={newSessionIds.has(session.sessionId)}
              unreadCount={unreadMap[session.sessionId] || 0}
              assignedToMe={!!myAdminId && session.assignedAdminId === myAdminId}
              onClick={() => onSelectSession(session.sessionId)}
            />
          ))
        )}
      </Box>
    </Box>
  );
}
