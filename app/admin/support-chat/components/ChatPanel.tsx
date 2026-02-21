'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  Button,
  List,
  ListItem,
  Card,
  Divider,
  Snackbar,
  IconButton,
} from '@mui/material';
import {
  Send as SendIcon,
  SwapHoriz as TakeoverIcon,
  CheckCircle as CheckCircleIcon,
  SmartToy as SmartToyIcon,
  Person as PersonIcon,
  SupportAgent as SupportAgentIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Forum as ForumIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import supportChatService from '@/app/services/support-chat';
import { useSupportChatSocket } from '../hooks/useSupportChatSocket';
import type { SupportSessionDetail, SupportMessage, SupportSenderType } from '@/app/types/support-chat';
import {
  SESSION_STATUS_LABELS,
  SESSION_STATUS_COLORS,
  LANGUAGE_FLAGS,
  LANGUAGE_LABELS,
  DOMAIN_LABELS,
  INFO_KEY_LABELS,
  PHASE_LABELS,
} from '@/app/types/support-chat';

interface ChatPanelProps {
  sessionId: string | null;
  onSessionUpdated: () => void;
  onBack?: () => void;
}

const SENDER_CONFIG: Record<SupportSenderType, { icon: React.ReactNode; label: string; bgColor: string }> = {
  user: { icon: <PersonIcon fontSize="small" />, label: '사용자', bgColor: '#e3f2fd' },
  bot: { icon: <SmartToyIcon fontSize="small" />, label: 'AI', bgColor: '#f3e5f5' },
  admin: { icon: <SupportAgentIcon fontSize="small" />, label: '어드민', bgColor: '#e8f5e9' },
};

export default function ChatPanel({ sessionId, onSessionUpdated, onBack }: ChatPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [session, setSession] = useState<SupportSessionDetail | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleNewMessage = useCallback((message: SupportMessage) => {
    setSession((prev) => {
      if (!prev) return prev;
      if (prev.messages.some((m) => m.id === message.id)) return prev;
      return { ...prev, messages: [...prev.messages, message] };
    });
  }, []);

  const handleStatusChanged = useCallback((event: { newStatus: string }) => {
    setSession((prev) => {
      if (!prev) return prev;
      return { ...prev, status: event.newStatus as SupportSessionDetail['status'] };
    });
    onSessionUpdated();
  }, [onSessionUpdated]);

  const { state: socketState, sendMessage: socketSendMessage } = useSupportChatSocket({
    sessionId: sessionId || '',
    onNewMessage: handleNewMessage,
    onStatusChanged: handleStatusChanged,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchSessionDetail = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    setError('');
    try {
      const detail = await supportChatService.getSessionDetail(sessionId);
      setSession(detail);
    } catch (err) {
      console.error('세션 상세 조회 실패:', err);
      setError(err instanceof Error ? err.message : '세션 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) {
      setSession(null);
      fetchSessionDetail();
    }
  }, [sessionId, fetchSessionDetail]);

  useEffect(() => {
    if (session?.messages) {
      scrollToBottom();
    }
  }, [session?.messages]);

  const handleTakeover = async () => {
    if (!session || !sessionId) return;
    setActionLoading(true);
    try {
      await supportChatService.takeoverSession(sessionId);
      setSnackbar({ open: true, message: '세션을 인수했습니다.', severity: 'success' });
      await fetchSessionDetail();
      onSessionUpdated();
    } catch (err) {
      console.error('세션 인수 실패:', err);
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : '세션 인수에 실패했습니다.',
        severity: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!session || !sessionId) return;
    setActionLoading(true);
    try {
      await supportChatService.resolveSession(sessionId, {
        closingMessage: '문의해 주셔서 감사합니다. 좋은 하루 되세요!',
      });
      setSnackbar({ open: true, message: '세션이 해결 완료 처리되었습니다.', severity: 'success' });
      await fetchSessionDetail();
      onSessionUpdated();
    } catch (err) {
      console.error('세션 해결 실패:', err);
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : '세션 해결 처리에 실패했습니다.',
        severity: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !session) return;
    if (!socketState.connected || !socketState.sessionJoined) {
      setSnackbar({
        open: true,
        message: 'WebSocket 연결이 되어있지 않습니다. 잠시 후 다시 시도해주세요.',
        severity: 'error',
      });
      return;
    }
    setSending(true);
    try {
      const success = await socketSendMessage(messageInput.trim());
      if (success) {
        setMessageInput('');
      } else {
        setSnackbar({ open: true, message: '메시지 전송에 실패했습니다.', severity: 'error' });
      }
    } catch (err) {
      console.error('메시지 전송 실패:', err);
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : '메시지 전송에 실패했습니다.',
        severity: 'error',
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMessage = (message: SupportMessage) => {
    const config = SENDER_CONFIG[message.senderType];
    const isUser = message.senderType === 'user';

    return (
      <ListItem
        key={message.id}
        sx={{
          flexDirection: 'column',
          alignItems: isUser ? 'flex-start' : 'flex-end',
          py: 1,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            mb: 0.5,
            flexDirection: isUser ? 'row' : 'row-reverse',
          }}
        >
          {config.icon}
          <Typography variant="caption" color="text.secondary">{config.label}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
            {formatDate(message.createdAt)}
          </Typography>
        </Box>
        <Card
          sx={{
            p: 1.5,
            maxWidth: '80%',
            bgcolor: config.bgColor,
            borderRadius: 2,
          }}
        >
          {message.senderType === 'bot' && message.metadata?.phase && (
            <Chip
              label={PHASE_LABELS[message.metadata.phase]}
              size="small"
              sx={{ fontSize: '0.65rem', height: 20, mb: 0.5 }}
              color={message.metadata.phase === 'answering' ? 'success' : 'default'}
            />
          )}
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {message.content}
          </Typography>
          {message.metadata?.confidence !== undefined && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              신뢰도: {(message.metadata.confidence * 100).toFixed(0)}%
            </Typography>
          )}
        </Card>
      </ListItem>
    );
  };

  // Empty state
  if (!sessionId) {
    return (
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
        <ForumIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
        <Typography variant="h6" color="text.secondary">세션을 선택하세요</Typography>
        <Typography variant="body2" color="text.secondary">좌측 목록에서 세션을 클릭하면 채팅 내용이 여기에 표시됩니다.</Typography>
      </Box>
    );
  }

  const canTakeover = session?.status === 'waiting_admin' || session?.status === 'bot_handling';
  const canResolve = session?.status === 'admin_handling';
  const canSendMessage = session?.status === 'admin_handling';

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
      {/* Header */}
      {session && (
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            {onBack && (
              <IconButton onClick={onBack} size="small">
                <ArrowBackIcon />
              </IconButton>
            )}
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {session.user.nickname || session.user.id.substring(0, 8)}
            </Typography>
            <Chip
              label={SESSION_STATUS_LABELS[session.status]}
              color={SESSION_STATUS_COLORS[session.status]}
              size="small"
            />
            {session.domain && (
              <Chip label={DOMAIN_LABELS[session.domain]} size="small" variant="outlined" />
            )}
            <Typography variant="body2" color="text.secondary">
              {LANGUAGE_FLAGS[session.language]} {LANGUAGE_LABELS[session.language]}
            </Typography>
            {canSendMessage && (
              <Chip
                icon={socketState.connected ? <WifiIcon /> : <WifiOffIcon />}
                label={socketState.connected ? (socketState.sessionJoined ? '연결됨' : '참여 중...') : '연결 중...'}
                color={socketState.connected && socketState.sessionJoined ? 'success' : 'default'}
                size="small"
                variant="outlined"
              />
            )}
            <Box sx={{ flex: 1 }} />
            {canTakeover && (
              <Button
                variant="contained"
                size="small"
                onClick={handleTakeover}
                disabled={actionLoading}
                startIcon={actionLoading ? <CircularProgress size={14} /> : <TakeoverIcon />}
              >
                인수하기
              </Button>
            )}
            {canResolve && (
              <Button
                variant="contained"
                color="success"
                size="small"
                onClick={handleResolve}
                disabled={actionLoading}
                startIcon={actionLoading ? <CircularProgress size={14} /> : <CheckCircleIcon />}
              >
                해결 완료
              </Button>
            )}
          </Box>
          {/* User info row */}
          <Box sx={{ display: 'flex', gap: 3, mt: 1, flexWrap: 'wrap' }}>
            {session.user.universityName && (
              <Box>
                <Typography variant="caption" color="text.secondary">대학교</Typography>
                <Typography variant="body2">{session.user.universityName}</Typography>
              </Box>
            )}
            {session.user.phoneNumber && (
              <Box>
                <Typography variant="caption" color="text.secondary">연락처</Typography>
                <Typography variant="body2">{session.user.phoneNumber}</Typography>
              </Box>
            )}
            <Box>
              <Typography variant="caption" color="text.secondary">생성일</Typography>
              <Typography variant="body2">{formatDate(session.createdAt)}</Typography>
            </Box>
          </Box>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
      )}
      {socketState.error && canSendMessage && (
        <Alert severity="warning" sx={{ mx: 2, mt: 1 }}>WebSocket: {socketState.error}</Alert>
      )}

      {/* Bot collected info */}
      {session && (session.domain || session.collectedInfo) && (
        <Box sx={{ px: 2, py: 1.5, bgcolor: '#f3f0ff', borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <SmartToyIcon fontSize="small" />
            봇 수집 정보
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {session.collectedInfo && Object.entries(session.collectedInfo).map(([key, value]) => (
              <Box key={key}>
                <Typography variant="caption" color="text.secondary">
                  {INFO_KEY_LABELS[key] || key}
                </Typography>
                <Typography variant="body2">{value}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Messages area */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
          <CircularProgress />
        </Box>
      ) : session ? (
        <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
          {session.messages.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Typography color="text.secondary">메시지가 없습니다.</Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {session.messages.map(renderMessage)}
              <div ref={messagesEndRef} />
            </List>
          )}
        </Box>
      ) : null}

      {/* Message input */}
      {canSendMessage && (
        <>
          <Divider />
          <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder={socketState.connected && socketState.sessionJoined ? '메시지를 입력하세요...' : 'WebSocket 연결 중...'}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sending || !socketState.connected || !socketState.sessionJoined}
              multiline
              maxRows={3}
            />
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={sending || !messageInput.trim() || !socketState.connected || !socketState.sessionJoined}
              sx={{ minWidth: 'auto', px: 2 }}
            >
              {sending ? <CircularProgress size={20} /> : <SendIcon />}
            </Button>
          </Box>
        </>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
