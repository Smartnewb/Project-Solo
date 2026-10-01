'use client';

import { useMemo } from 'react';
import {
  Alert,
  Box,
  Chip,
  Checkbox,
  CircularProgress,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
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
import { useSessionMessages } from '../hooks/useSessionMessages';
import BulkResolveToolbar, { useSessionSelection } from './BulkResolveToolbar';

interface SessionGridProps {
  activeSessions: SupportSessionSummary[];
  resolvedSessions: SupportSessionSummary[];
  activeTab: 'active' | 'resolved';
  onTabChange: (tab: 'active' | 'resolved') => void;
  domainFilter: SupportDomain | 'all';
  onDomainFilterChange: (domain: SupportDomain | 'all') => void;
  onOpenSession: (sessionId: string) => void;
  onSessionUpdated: () => void;
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
  messages,
  error,
  checked,
  onToggle,
}: {
  session: SupportSessionSummary;
  unread: boolean;
  onOpen: () => void;
  messages?: SupportMessage[];
  error?: string;
  checked: boolean;
  onToggle?: () => void;
}) {
  return (
    <Paper
      onClick={onOpen}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onOpen();
        }
      }}
      elevation={0}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: 380,
        cursor: 'pointer',
        overflow: 'hidden',
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
        bgcolor: checked ? 'action.selected' : 'background.paper',
        '&:hover': { bgcolor: 'action.hover' },
        '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main' },
      }}
    >
      <Box
        sx={{
          p: 1.5,
          bgcolor: checked ? 'action.selected' : 'grey.50',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
          {onToggle && <Checkbox size="small" checked={checked}
            inputProps={{ 'aria-label': `${session.userNickname || session.userId} 선택` }}
            onClick={(event) => event.stopPropagation()} onChange={onToggle} />}
          <Typography
            variant="subtitle2"
            sx={{ flex: 1, minWidth: 0, fontWeight: unread ? 800 : 500, color: unread ? 'error.main' : 'text.primary' }}
            noWrap
          >
            {LANGUAGE_FLAGS[session.language]} {session.userNickname || session.userId.slice(0, 8)}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
            접수 {timeAgo(session.createdAt)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {unread && <Chip label="사용자 답변 미확인" color="error" size="small" sx={{ fontWeight: 700, height: 20 }} />}
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
        {!error && messages === undefined && (
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
  onSessionUpdated,
}: SessionGridProps) {
  const { isUnread } = useReadState();

  const sessions = useMemo(() => {
    const base = activeTab === 'active' ? activeSessions : resolvedSessions;
    return base
      .filter((s) => domainFilter === 'all' || s.domain === domainFilter)
      .slice()
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() ||
          a.sessionId.localeCompare(b.sessionId)
      );
  }, [activeSessions, resolvedSessions, activeTab, domainFilter]);

  const { messagesBySession, errorsBySession } = useSessionMessages(sessions);
  const scope = `${activeTab}:${domainFilter}`;
  const { selected, toggle, setSelectedIds } = useSessionSelection(sessions, scope);
  const unreadCount = sessions.filter((s) => isUnread(s.sessionId, messagesBySession[s.sessionId] ?? [])).length;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 1 }}>
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
          사용자 답변 미확인 {unreadCount}건
        </Typography>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>접수순 · 먼저 들어온 상담부터 표시합니다.</Typography>
      {activeTab === 'active' && <BulkResolveToolbar selected={selected} setSelectedIds={setSelectedIds}
        onSessionUpdated={onSessionUpdated} scope={scope} />}

      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          display: 'grid',
          gap: 2,
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
          alignContent: 'start',
          pb: 2,
        }}
      >
        {sessions.map((session) => (
          <SessionCard
            key={session.sessionId}
            session={session}
            unread={isUnread(session.sessionId, messagesBySession[session.sessionId] ?? [])}
            messages={messagesBySession[session.sessionId]}
            error={errorsBySession[session.sessionId]}
            checked={selected.some((item) => item.sessionId === session.sessionId)}
            onToggle={activeTab === 'active' ? () => toggle(session.sessionId) : undefined}
            onOpen={() => onOpenSession(session.sessionId)}
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
