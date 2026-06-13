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
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
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
  Diamond as DiamondIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Article as TemplateIcon,
  AutoAwesome as AiDraftIcon,
  StickyNote2 as NoteIcon,
} from '@mui/icons-material';
import supportChatService from '@/app/services/support-chat';
import AdminService from '@/app/services/admin';
import { useAdminSession } from '@/shared/contexts/admin-session-context';
import { useSupportChatSocket } from '../hooks/useSupportChatSocket';
import QuickReplyDialog from './QuickReplyDialog';
import ResolveDialog from './ResolveDialog';
import type {
  SupportSessionDetail,
  SupportMessage,
  SupportSenderType,
  SupportResolutionReason,
  AiDraftSource,
} from '@/app/types/support-chat';
import { safeToLocaleString } from '@/app/utils/formatters';
import {
  SESSION_STATUS_LABELS,
  SESSION_STATUS_COLORS,
  LANGUAGE_FLAGS,
  LANGUAGE_LABELS,
  DOMAIN_LABELS,
  INFO_KEY_LABELS,
  PHASE_LABELS,
  SOURCE_LABELS,
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

const DEFAULT_GEM_GRANT_MESSAGE = '고객지원 보상 구슬 지급';

export default function ChatPanel({ sessionId, onSessionUpdated, onBack }: ChatPanelProps) {
  const { session: adminSession } = useAdminSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [session, setSession] = useState<SupportSessionDetail | null>(null);
  const [userDetailPhoneNumber, setUserDetailPhoneNumber] = useState<string | null>(null);
  const [gemsInfo, setGemsInfo] = useState<any>(null);
  const [gemsLoading, setGemsLoading] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [gemGrantDialogOpen, setGemGrantDialogOpen] = useState(false);
  const [gemGrantAmount, setGemGrantAmount] = useState(10);
  const [gemGrantMessage, setGemGrantMessage] = useState(DEFAULT_GEM_GRANT_MESSAGE);
  const [gemGrantLoading, setGemGrantLoading] = useState(false);
  const [userTyping, setUserTyping] = useState(false);
  const [quickReplyOpen, setQuickReplyOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [aiDraftLoading, setAiDraftLoading] = useState(false);
  const [aiDraftSources, setAiDraftSources] = useState<AiDraftSource[]>([]);
  const [noteValue, setNoteValue] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteExpanded, setNoteExpanded] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const adminTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleNewMessage = useCallback((message: SupportMessage) => {
    setSession((prev) => {
      if (!prev) return prev;
      if (prev.messages.some((m) => m.id === message.id)) return prev;
      return { ...prev, messages: [...prev.messages, message] };
    });
  }, []);

  const handleMessageUpdated = useCallback((event: { id: string; content: string }) => {
    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: prev.messages.map((message) =>
          message.id === event.id ? { ...message, content: event.content } : message
        ),
      };
    });
  }, []);

  const handleMessageDeleted = useCallback((event: { messageId: string }) => {
    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: prev.messages.filter((message) => message.id !== event.messageId),
      };
    });
  }, []);

  const handleStatusChanged = useCallback((event: { newStatus: string }) => {
    setSession((prev) => {
      if (!prev) return prev;
      return { ...prev, status: event.newStatus as SupportSessionDetail['status'] };
    });
    onSessionUpdated();
  }, [onSessionUpdated]);

  const handleTyping = useCallback((event: { sessionId: string; userId: string; isTyping: boolean }) => {
    if (event.sessionId !== sessionId) return;
    // 어드민 본인이 보낸 typing 이벤트는 무시 (유저 입력만 표시)
    if (event.userId === adminSession?.user.id) return;
    setUserTyping(event.isTyping);
    if (event.isTyping) {
      if (userTypingTimeoutRef.current) clearTimeout(userTypingTimeoutRef.current);
      userTypingTimeoutRef.current = setTimeout(() => setUserTyping(false), 5000);
    }
  }, [sessionId, adminSession?.user.id]);

  const { state: socketState, sendMessage: socketSendMessage, setTyping, reconnect } = useSupportChatSocket({
    sessionId: sessionId || '',
    onNewMessage: handleNewMessage,
    onMessageUpdated: handleMessageUpdated,
    onMessageDeleted: handleMessageDeleted,
    onStatusChanged: handleStatusChanged,
    onTyping: handleTyping,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchUserAdminInfo = useCallback(async (userId: string) => {
    setGemsLoading(true);
    setUserDetailPhoneNumber(null);
    setGemsInfo(null);

    const [userDetailResult, gemsResult] = await Promise.allSettled([
      AdminService.userAppearance.getUserDetails(userId),
      AdminService.userAppearance.getUserGems(userId),
    ]);

    if (userDetailResult.status === 'fulfilled') {
      setUserDetailPhoneNumber(userDetailResult.value?.phoneNumber || null);
    }

    if (gemsResult.status === 'fulfilled') {
      setGemsInfo(gemsResult.value);
    }

    setGemsLoading(false);
  }, []);

  const fetchSessionDetail = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    setError('');
    try {
      const detail = await supportChatService.getSessionDetail(sessionId);
      setSession(detail);
      setNoteValue(detail.adminNote ?? '');
      await fetchUserAdminInfo(detail.user.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : '세션 정보를 불러오는데 실패했습니다.');
      setGemsLoading(false);
    } finally {
      setLoading(false);
    }
  }, [sessionId, fetchUserAdminInfo]);

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
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : '세션 인수에 실패했습니다.',
        severity: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async (params: {
    closingMessage?: string;
    resolutionReason?: SupportResolutionReason;
  }) => {
    if (!session || !sessionId) return;
    setActionLoading(true);
    try {
      await supportChatService.resolveSession(sessionId, {
        ...(params.closingMessage ? { closingMessage: params.closingMessage } : {}),
        ...(params.resolutionReason ? { resolutionReason: params.resolutionReason } : {}),
      });
      setSnackbar({ open: true, message: '세션이 해결 완료 처리되었습니다.', severity: 'success' });
      setResolveDialogOpen(false);
      await fetchSessionDetail();
      onSessionUpdated();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : '세션 해결 처리에 실패했습니다.',
        severity: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenGemGrantDialog = () => {
    setGemGrantAmount(10);
    setGemGrantMessage(DEFAULT_GEM_GRANT_MESSAGE);
    setGemGrantDialogOpen(true);
  };

  const handleGrantGems = async () => {
    if (!session) return;

    const phoneNumber = userDetailPhoneNumber || session.user.phoneNumber;
    const normalizedMessage = gemGrantMessage.trim();

    if (!phoneNumber || phoneNumber.includes('*')) {
      setSnackbar({
        open: true,
        message: '원본 연락처를 확인할 수 없어 구슬을 지급할 수 없습니다.',
        severity: 'error',
      });
      return;
    }

    if (!Number.isInteger(gemGrantAmount) || gemGrantAmount < 1) {
      setSnackbar({ open: true, message: '구슬 개수는 1개 이상이어야 합니다.', severity: 'error' });
      return;
    }

    if (!normalizedMessage) {
      setSnackbar({ open: true, message: '푸시 알림 메시지를 입력해주세요.', severity: 'error' });
      return;
    }

    setGemGrantLoading(true);
    try {
      const result = await AdminService.gems.bulkGrant({
        phoneNumbers: [phoneNumber],
        gemAmount: gemGrantAmount,
        message: normalizedMessage,
      });

      const pushResult = result?.pushNotificationResult;
      const pushSummary = pushResult
        ? ` 푸시 성공 ${pushResult.pushSuccessCount}건, 실패 ${pushResult.pushFailureCount}건.`
        : '';
      setSnackbar({
        open: true,
        message: `구슬 ${gemGrantAmount}개 지급이 완료되었습니다.${pushSummary}`,
        severity: (result?.failedCount ?? 0) > 0 ? 'error' : 'success',
      });
      setGemGrantDialogOpen(false);
      await fetchUserAdminInfo(session.user.id);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : '구슬 지급 중 오류가 발생했습니다.',
        severity: 'error',
      });
    } finally {
      setGemGrantLoading(false);
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
        setTyping(false);
        if (adminTypingTimeoutRef.current) clearTimeout(adminTypingTimeoutRef.current);
        await fetchSessionDetail();
        onSessionUpdated();
      } else {
        setSnackbar({ open: true, message: '메시지 전송에 실패했습니다.', severity: 'error' });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : '메시지 전송에 실패했습니다.',
        severity: 'error',
      });
    } finally {
      setSending(false);
    }
  };

  const startEditMessage = (message: SupportMessage) => {
    setEditingMessageId(message.id);
    setEditingContent(message.content);
  };

  const cancelEditMessage = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  const handleSaveEditedMessage = async (messageId: string) => {
    if (!sessionId || !editingContent.trim()) return;

    setEditSaving(true);
    try {
      const result = await supportChatService.updateMessage(sessionId, messageId, {
        content: editingContent.trim(),
      });
      handleMessageUpdated({ id: messageId, content: result.content });
      cancelEditMessage();
      setSnackbar({ open: true, message: '답변을 수정했습니다.', severity: 'success' });
      onSessionUpdated();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : '답변 수정에 실패했습니다.',
        severity: 'error',
      });
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!sessionId || !window.confirm('이 답변을 삭제할까요?')) return;

    setDeletingMessageId(messageId);
    try {
      await supportChatService.deleteMessage(sessionId, messageId);
      handleMessageDeleted({ messageId });
      if (editingMessageId === messageId) cancelEditMessage();
      setSnackbar({ open: true, message: '답변을 삭제했습니다.', severity: 'success' });
      onSessionUpdated();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : '답변 삭제에 실패했습니다.',
        severity: 'error',
      });
    } finally {
      setDeletingMessageId(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleMessageInputChange = (value: string) => {
    setMessageInput(value);
    if (!socketState.connected || !socketState.sessionJoined) return;
    setTyping(true);
    if (adminTypingTimeoutRef.current) clearTimeout(adminTypingTimeoutRef.current);
    adminTypingTimeoutRef.current = setTimeout(() => setTyping(false), 2000);
  };

  const handleInsertTemplate = (content: string) => {
    setMessageInput((prev) => (prev.trim() ? `${prev}\n${content}` : content));
  };

  const handleGenerateAiDraft = async () => {
    if (!sessionId) return;
    setAiDraftLoading(true);
    try {
      const result = await supportChatService.generateAiDraft(sessionId);
      setMessageInput(result.draft);
      setAiDraftSources(result.sources);
      setSnackbar({
        open: true,
        message: `AI 초안을 생성했습니다. (신뢰도 ${(result.confidence * 100).toFixed(0)}%) 검토 후 전송하세요.`,
        severity: 'success',
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'AI 초안 생성에 실패했습니다.',
        severity: 'error',
      });
    } finally {
      setAiDraftLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!sessionId) return;
    setNoteSaving(true);
    try {
      const result = await supportChatService.updateAdminNote(sessionId, noteValue);
      setNoteValue(result.note ?? '');
      setSession((prev) => (prev ? { ...prev, adminNote: result.note } : prev));
      setSnackbar({ open: true, message: '내부 메모를 저장했습니다.', severity: 'success' });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : '내부 메모 저장에 실패했습니다.',
        severity: 'error',
      });
    } finally {
      setNoteSaving(false);
    }
  };

  // 세션 전환 시 유저 입력 표시·AI 초안 출처 초기화
  useEffect(() => {
    setUserTyping(false);
    setAiDraftSources([]);
    setNoteExpanded(false);
  }, [sessionId]);

  // 타이핑 타임아웃 정리
  useEffect(() => {
    return () => {
      if (userTypingTimeoutRef.current) clearTimeout(userTypingTimeoutRef.current);
      if (adminTypingTimeoutRef.current) clearTimeout(adminTypingTimeoutRef.current);
    };
  }, []);

  const formatDate = (dateString: string) => {
    return safeToLocaleString(dateString, 'ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMessage = (message: SupportMessage) => {
    const config = SENDER_CONFIG[message.senderType];
    const isUser = message.senderType === 'user';
    const isAdminMessage = message.senderType === 'admin';
    const isOwnAdminMessage = isAdminMessage && message.senderId === adminSession?.user.id;
    const isEditing = editingMessageId === message.id;

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
            minWidth: isEditing ? 'min(80%, 360px)' : undefined,
            bgcolor: config.bgColor,
            borderRadius: 2,
          }}
        >
          {isOwnAdminMessage && !isEditing && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mb: 0.5 }}>
              <IconButton size="small" onClick={() => startEditMessage(message)} aria-label="답변 수정">
                <EditIcon fontSize="inherit" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleDeleteMessage(message.id)}
                disabled={deletingMessageId === message.id}
                aria-label="답변 삭제"
              >
                {deletingMessageId === message.id ? (
                  <CircularProgress size={14} />
                ) : (
                  <DeleteIcon fontSize="inherit" />
                )}
              </IconButton>
            </Box>
          )}
          {(message.senderType === 'bot' || message.senderType === 'admin') && (message.metadata?.phase || message.metadata?.source || message.metadata?.webhook_handled) && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 0.5 }}>
              {message.metadata?.phase && (
                <Chip
                  label={PHASE_LABELS[message.metadata.phase]}
                  size="small"
                  sx={{ fontSize: '0.65rem', height: 20 }}
                  color={message.metadata.phase === 'answering' ? 'success' : 'default'}
                />
              )}
              {message.metadata?.source && (
                <Chip
                  label={SOURCE_LABELS[message.metadata.source]?.label || `출처: ${message.metadata.source}`}
                  size="small"
                  sx={{ fontSize: '0.65rem', height: 20 }}
                  color={SOURCE_LABELS[message.metadata.source]?.color || 'default'}
                />
              )}
              {message.metadata?.webhook_handled && !message.metadata?.source && (
                <Chip
                  label="🤖 webhook 처리"
                  size="small"
                  sx={{ fontSize: '0.65rem', height: 20 }}
                  color="info"
                />
              )}
              {message.metadata?.tool && (
                <Chip
                  label={`🔧 ${message.metadata.tool}`}
                  size="small"
                  sx={{ fontSize: '0.65rem', height: 20 }}
                  variant="outlined"
                />
              )}
            </Box>
          )}
          {isEditing ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <TextField
                value={editingContent}
                onChange={(event) => setEditingContent(event.target.value)}
                multiline
                minRows={3}
                size="small"
                autoFocus
                disabled={editSaving}
                inputProps={{ maxLength: 2000 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button
                  size="small"
                  onClick={cancelEditMessage}
                  disabled={editSaving}
                  startIcon={<CloseIcon />}
                >
                  취소
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => handleSaveEditedMessage(message.id)}
                  disabled={editSaving || !editingContent.trim()}
                  startIcon={editSaving ? <CircularProgress size={14} /> : <CheckIcon />}
                >
                  저장
                </Button>
              </Box>
            </Box>
          ) : (
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {message.content}
            </Typography>
          )}
          {message.metadata?.confidence !== undefined && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              신뢰도: {(message.metadata.confidence * 100).toFixed(0)}%
            </Typography>
          )}
          {message.metadata?.reason && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }}
            >
              사유: {message.metadata.reason}
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
  const displayPhoneNumber = userDetailPhoneNumber || session?.user.phoneNumber;
  const canGrantGems = !!displayPhoneNumber && !displayPhoneNumber.includes('*');

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
                label={socketState.connected ? (socketState.sessionJoined ? '연결됨' : '참여 중...') : '연결 끊김'}
                color={socketState.connected && socketState.sessionJoined ? 'success' : 'default'}
                size="small"
                variant="outlined"
              />
            )}
            {canSendMessage && !socketState.connected && (
              <Button
                size="small"
                color="warning"
                variant="outlined"
                onClick={reconnect}
                startIcon={<RefreshIcon />}
              >
                재연결
              </Button>
            )}
            {session.assignedAdminId && (
              <Chip
                label={session.assignedAdminId === adminSession?.user.id ? '내 담당' : '다른 어드민 담당'}
                color={session.assignedAdminId === adminSession?.user.id ? 'primary' : 'default'}
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
                onClick={() => setResolveDialogOpen(true)}
                disabled={actionLoading}
                startIcon={actionLoading ? <CircularProgress size={14} /> : <CheckCircleIcon />}
              >
                해결 완료
              </Button>
            )}
            <Button
              variant="outlined"
              size="small"
              onClick={handleOpenGemGrantDialog}
              disabled={gemsLoading || !canGrantGems}
              startIcon={<DiamondIcon />}
            >
              구슬 지급
            </Button>
          </Box>
          {/* User info row */}
          <Box sx={{ display: 'flex', gap: 3, mt: 1, flexWrap: 'wrap' }}>
            {session.user.universityName && (
              <Box>
                <Typography variant="caption" color="text.secondary">대학교</Typography>
                <Typography variant="body2">{session.user.universityName}</Typography>
              </Box>
            )}
            {displayPhoneNumber && (
              <Box>
                <Typography variant="caption" color="text.secondary">연락처</Typography>
                <Typography variant="body2">{displayPhoneNumber}</Typography>
              </Box>
            )}
            <Box>
              <Typography variant="caption" color="text.secondary">구슬</Typography>
              <Typography variant="body2">
                {gemsLoading ? '조회 중...' : `${gemsInfo?.gemBalance ?? 0}개`}
              </Typography>
            </Box>
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

      {/* 어드민 내부 메모 (유저 비노출) */}
      {session && (
        <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider', bgcolor: '#fffde7' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NoteIcon fontSize="small" sx={{ color: '#f9a825' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, flex: 1 }}>
              내부 메모
              <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                (유저에게 보이지 않음)
              </Typography>
            </Typography>
            <Button size="small" onClick={() => setNoteExpanded((v) => !v)}>
              {noteExpanded ? '접기' : noteValue ? '메모 보기' : '메모 추가'}
            </Button>
          </Box>
          {!noteExpanded && noteValue && (
            <Typography variant="body2" color="text.secondary" noWrap sx={{ mt: 0.5, pl: 3.5 }}>
              {noteValue}
            </Typography>
          )}
          {noteExpanded && (
            <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <TextField
                value={noteValue}
                onChange={(e) => setNoteValue(e.target.value)}
                multiline
                minRows={2}
                size="small"
                placeholder="교대/이관 시 참고할 내부 메모를 남기세요."
                inputProps={{ maxLength: 2000 }}
                disabled={noteSaving}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleSaveNote}
                  disabled={noteSaving || noteValue === (session.adminNote ?? '')}
                  startIcon={noteSaving ? <CircularProgress size={14} /> : <CheckIcon />}
                >
                  메모 저장
                </Button>
              </Box>
            </Box>
          )}
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
          {userTyping && (
            <Typography variant="caption" color="text.secondary" sx={{ px: 2, pt: 1, fontStyle: 'italic' }}>
              사용자가 입력 중입니다…
            </Typography>
          )}
          {aiDraftSources.length > 0 && (
            <Box sx={{ px: 2, pt: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                참고한 유사 과거 문의
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
                {aiDraftSources.slice(0, 3).map((src, idx) => (
                  <Tooltip key={idx} title={src.answer} placement="top">
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ cursor: 'help' }}>
                      · {src.question}{' '}
                      <Typography component="span" variant="caption" color="primary.main">
                        ({(src.similarity * 100).toFixed(0)}%)
                      </Typography>
                    </Typography>
                  </Tooltip>
                ))}
              </Box>
            </Box>
          )}
          <Box sx={{ p: 2, display: 'flex', gap: 1, alignItems: 'flex-end' }}>
            <Tooltip title="AI 답변 초안 생성">
              <span>
                <IconButton
                  onClick={handleGenerateAiDraft}
                  disabled={sending || aiDraftLoading}
                  aria-label="AI 답변 초안 생성"
                  color="secondary"
                >
                  {aiDraftLoading ? <CircularProgress size={20} /> : <AiDraftIcon />}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="빠른 답변 템플릿">
              <span>
                <IconButton
                  onClick={() => setQuickReplyOpen(true)}
                  disabled={sending}
                  aria-label="빠른 답변 템플릿"
                >
                  <TemplateIcon />
                </IconButton>
              </span>
            </Tooltip>
            <TextField
              fullWidth
              size="small"
              placeholder={socketState.connected && socketState.sessionJoined ? '메시지를 입력하세요...' : 'WebSocket 연결 중...'}
              value={messageInput}
              onChange={(e) => handleMessageInputChange(e.target.value)}
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

      <QuickReplyDialog
        open={quickReplyOpen}
        onClose={() => setQuickReplyOpen(false)}
        domain={session?.domain}
        nickname={session?.user.nickname}
        onSelect={handleInsertTemplate}
      />

      <ResolveDialog
        open={resolveDialogOpen}
        loading={actionLoading}
        nickname={session?.user.nickname}
        onClose={() => setResolveDialogOpen(false)}
        onConfirm={handleResolve}
      />

      <Dialog open={gemGrantDialogOpen} onClose={() => !gemGrantLoading && setGemGrantDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>구슬 지급</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {session?.user.nickname || session?.user.id.substring(0, 8)}님에게 구슬을 지급하고 푸시 알림을 발송합니다.
          </DialogContentText>
          <TextField
            fullWidth
            type="number"
            label="지급할 구슬 개수"
            value={gemGrantAmount}
            onChange={(e) => setGemGrantAmount(Math.max(1, Number.parseInt(e.target.value, 10) || 1))}
            inputProps={{ min: 1 }}
            sx={{ mb: 2 }}
            disabled={gemGrantLoading}
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="푸시 알림 메시지"
            value={gemGrantMessage}
            onChange={(e) => setGemGrantMessage(e.target.value)}
            inputProps={{ maxLength: 200 }}
            helperText={`${gemGrantMessage.length}/200자 | 지급 사유와 푸시 알림 메시지로 사용됩니다.`}
            disabled={gemGrantLoading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGemGrantDialogOpen(false)} disabled={gemGrantLoading}>
            취소
          </Button>
          <Button
            variant="contained"
            onClick={handleGrantGems}
            disabled={gemGrantLoading || !canGrantGems || !gemGrantMessage.trim() || gemGrantAmount < 1}
            startIcon={gemGrantLoading ? <CircularProgress size={16} /> : <DiamondIcon />}
          >
            구슬 지급 및 알림 발송
          </Button>
        </DialogActions>
      </Dialog>

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
