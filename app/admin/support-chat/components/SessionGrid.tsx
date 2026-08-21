'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import supportChatService from '@/app/services/support-chat';
import type {
  SupportDomain,
  SupportMessage,
  SupportSenderType,
  SupportSessionSummary,
} from '@/app/types/support-chat';
import {
  DOMAIN_COLORS,
  DOMAIN_LABELS,
  LANGUAGE_FLAGS,
  SESSION_STATUS_COLORS,
  SESSION_STATUS_LABELS,
} from '@/app/types/support-chat';
import { useReadState } from '../lib/read-state';

interface SessionGridProps {
  activeSessions: SupportSessionSummary[];
  resolvedSessions: SupportSessionSummary[];
  activeTab: 'active' | 'resolved';
  onTabChange: (tab: 'active' | 'resolved') => void;
  domainFilter: SupportDomain | 'all';
  onDomainFilterChange: (domain: SupportDomain | 'all') => void;
  onOpenSession: (sessionId: string) => void;
}

const SENDER_STYLE: Record<SupportSenderType, { label: string; bg: string; align: 'flex-start' | 'flex-end' }> = {
  user: { label: '사용자', bg: '#e3f2fd', align: 'flex-start' },
  bot: { label: 'AI', bg: '#f3e5f5', align: 'flex-end' },
  admin: { label: '어드민', bg: '#e8f5e9', align: 'flex-end' },
};

function timeAgo(iso?: string): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return '';
  const min = Math.floor(diff / 60_000);
  if (min < 1) return '방금';
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  return `${Math.floor(hour / 24)}일 전`;
}

function SessionCard({
  session,
  unread,
  onOpen,
}: {
  session: SupportSessionSummary;
  unread: boolean;
  onOpen: () => void;
}) {
  const [messages, setMessages] = useState<SupportMessage[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setError('');
    supportChatService
      .getSessionDetail(session.sessionId)
      .then((detail) => {
        if (!cancelled) setMessages(detail.messages);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : '대화를 불러오지 못했습니다.');
      });
    return () => {
      cancelled = true;
    };
  }, [session.sessionId, session.messageCount]);

  return (
    <Paper
      onClick={onOpen}
      elevation={0}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: 380,
        cursor: 'pointer',
        overflow: 'hidden',
        borderRadius: 2,
        border: unread ? 3 : 1,
        borderColor: unread ? 'error.main' : 'divider',
        boxShadow: unread ? '0 0 0 3px rgba(211,47,47,0.12)' : 'none',
        transition: 'border-color 120ms, box-shadow 120ms',
        '&:hover': { borderColor: unread ? 'error.dark' : 'primary.main' },
      }}
    >
      <Box
        sx={{
          p: 1.5,
          bgcolor: unread ? 'rgba(211,47,47,0.06)' : 'grey.50',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: unread ? 800 : 500, color: unread ? 'error.main' : 'text.primary' }}
            noWrap
          >
            {LANGUAGE_FLAGS[session.language]} {session.userNickname || session.userId.slice(0, 8)}
          </Typography>
          {unread && <Chip label="미확인" color="error" size="small" sx={{ fontWeight: 700, height: 20 }} />}
          <Box sx={{ flex: 1 }} />
          <Typography variant="caption" color="text.secondary">
            {timeAgo(session.waitingSince || session.createdAt)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          <Chip
            label={SESSION_STATUS_LABELS[session.status]}
            color={SESSION_STATUS_COLORS[session.status]}
            size="small"
            sx={{ height: 20 }}
          />
          {session.domain && (
            <Chip
              label={DOMAIN_LABELS[session.domain]}
              color={DOMAIN_COLORS[session.domain]}
              variant="outlined"
              size="small"
              sx={{ height: 20 }}
            />
          )}
          <Chip label={`${session.messageCount}건`} size="small" variant="outlined" sx={{ height: 20 }} />
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        {error && <Alert severity="error" sx={{ py: 0 }}>{error}</Alert>}
        {!error && messages === null && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={20} />
          </Box>
        )}
        {messages?.map((message) => {
          const style = SENDER_STYLE[message.senderType];
          return (
            <Box key={message.id} sx={{ display: 'flex', flexDirection: 'column', alignItems: style.align }}>
              <Typography variant="caption" color="text.secondary">
                {style.label}
              </Typography>
              <Box
                sx={{
                  maxWidth: '90%',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1.5,
                  bgcolor: style.bg,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                <Typography variant="body2">{message.content}</Typography>
              </Box>
            </Box>
          );
        })}
        {messages?.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            메시지가 없습니다.
          </Typography>
        )}
      </Box>
    </Paper>
  );
}

export default function SessionGrid({
  activeSessions,
  resolvedSessions,
  activeTab,
  onTabChange,
  domainFilter,
  onDomainFilterChange,
  onOpenSession,
}: SessionGridProps) {
  const { isUnread, markRead } = useReadState();

  const sessions = useMemo(() => {
    const base = activeTab === 'active' ? activeSessions : resolvedSessions;
    return base
      .filter((s) => domainFilter === 'all' || s.domain === domainFilter)
      .slice()
      .sort(
        (a, b) =>
          new Date(b.waitingSince || b.createdAt).getTime() -
          new Date(a.waitingSince || a.createdAt).getTime()
      );
  }, [activeSessions, resolvedSessions, activeTab, domainFilter]);

  const unreadCount = sessions.filter((s) => isUnread(s.sessionId, s.messageCount)).length;

  const handleOpen = useCallback(
    (session: SupportSessionSummary) => {
      markRead(session.sessionId, session.messageCount);
      onOpenSession(session.sessionId);
    },
    [markRead, onOpenSession]
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <Tabs value={activeTab} onChange={(_, value) => onTabChange(value)} sx={{ minHeight: 40 }}>
          <Tab label={`진행 중 (${activeSessions.length})`} value="active" sx={{ minHeight: 40 }} />
          <Tab label={`완료 (${resolvedSessions.length})`} value="resolved" sx={{ minHeight: 40 }} />
        </Tabs>
        <Select
          size="small"
          value={domainFilter}
          onChange={(event) => onDomainFilterChange(event.target.value as SupportDomain | 'all')}
        >
          <MenuItem value="all">전체 도메인</MenuItem>
          {(Object.keys(DOMAIN_LABELS) as SupportDomain[]).map((domain) => (
            <MenuItem key={domain} value={domain}>
              {DOMAIN_LABELS[domain]}
            </MenuItem>
          ))}
        </Select>
        <Box sx={{ flex: 1 }} />
        <Typography variant="body2" sx={{ fontWeight: 700, color: unreadCount ? 'error.main' : 'text.secondary' }}>
          미확인 {unreadCount}건
        </Typography>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          display: 'grid',
          gap: 2,
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          alignContent: 'start',
          pb: 2,
        }}
      >
        {sessions.map((session) => (
          <SessionCard
            key={session.sessionId}
            session={session}
            unread={isUnread(session.sessionId, session.messageCount)}
            onOpen={() => handleOpen(session)}
          />
        ))}
        {sessions.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
            표시할 문의가 없습니다.
          </Typography>
        )}
      </Box>
    </Box>
  );
}
