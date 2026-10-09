"use client";
import {
  Button,
  Card,
  Chip,
  Description,
  FieldError,
  Input,
  Label,
  Modal,
  Spinner,
  TextArea,
  TextField,
  Tooltip,
} from "@heroui/react";
import {
  Send as SendIcon,
  ArrowLeftRight as TakeoverIcon,
  CircleCheck as CheckCircleIcon,
  Bot as SmartToyIcon,
  UserRound as PersonIcon,
  Headset as SupportAgentIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  MessagesSquare as ForumIcon,
  ArrowLeft as ArrowBackIcon,
  Gem as DiamondIcon,
  Pencil as EditIcon,
  Trash2 as DeleteIcon,
  Check as CheckIcon,
  X as CloseIcon,
  RefreshCw as RefreshIcon,
  FileText as TemplateIcon,
  Sparkles as AiDraftIcon,
  StickyNote as NoteIcon,
} from "lucide-react";

import { useState, useEffect, useRef, useCallback } from "react";

import supportChatService from "@/app/services/support-chat";
import AdminService from "@/app/services/admin";
import { useAdminSession } from "@/shared/contexts/admin-session-context";
import { useConfirm } from "@/shared/ui/admin/confirm-dialog";
import { useToast } from "@/shared/ui/admin/toast";
import { useSupportChatSocket } from "../hooks/useSupportChatSocket";
import { useReadState } from "../lib/read-state";
import { canMutateSupportMessage } from "../lib/can-mutate-message";
import QuickReplyDialog from "./QuickReplyDialog";
import ResolveDialog from "./ResolveDialog";
import type {
  SupportSessionDetail,
  SupportMessage,
  SupportSenderType,
  SupportResolutionReason,
  AiDraftSource,
} from "@/app/types/support-chat";
import { safeToLocaleString } from "@/app/utils/formatters";
import {
  SESSION_STATUS_LABELS,
  SESSION_STATUS_COLORS,
  LANGUAGE_FLAGS,
  LANGUAGE_LABELS,
  DOMAIN_LABELS,
  INFO_KEY_LABELS,
  PHASE_LABELS,
  SOURCE_LABELS,
} from "@/app/types/support-chat";

interface ChatPanelProps {
  sessionId: string | null;
  onSessionUpdated: () => void;
  onBack?: () => void;
}

const SENDER_CONFIG: Record<
  SupportSenderType,
  { icon: React.ReactNode; label: string; bgColor: string }
> = {
  user: { icon: <PersonIcon size={16} />, label: "사용자", bgColor: "#e3f2fd" },
  bot: { icon: <SmartToyIcon size={16} />, label: "AI", bgColor: "#f3e5f5" },
  admin: {
    icon: <SupportAgentIcon size={16} />,
    label: "어드민",
    bgColor: "#e8f5e9",
  },
};

const DEFAULT_GEM_GRANT_MESSAGE = "고객지원 보상 구슬 지급";

export default function ChatPanel({
  sessionId,
  onSessionUpdated,
  onBack,
}: ChatPanelProps) {
  const { session: adminSession } = useAdminSession();
  const { markRead } = useReadState();
  const confirm = useConfirm();
  const toast = useToast();
  const detailRequestRef = useRef(0);
  const completedDetailRef = useRef(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [session, setSession] = useState<SupportSessionDetail | null>(null);
  const [userDetailPhoneNumber, setUserDetailPhoneNumber] = useState<
    string | null
  >(null);
  const [gemsInfo, setGemsInfo] = useState<any>(null);
  const [gemsLoading, setGemsLoading] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(
    null,
  );
  const [gemGrantDialogOpen, setGemGrantDialogOpen] = useState(false);
  const [gemGrantAmountInput, setGemGrantAmountInput] = useState("10");
  const gemGrantAmount = /^\d+$/.test(gemGrantAmountInput)
    ? Number(gemGrantAmountInput)
    : NaN;
  const gemGrantAmountInvalid =
    !Number.isInteger(gemGrantAmount) || gemGrantAmount < 1;
  const [gemGrantMessage, setGemGrantMessage] = useState(
    DEFAULT_GEM_GRANT_MESSAGE,
  );
  const [gemGrantLoading, setGemGrantLoading] = useState(false);
  const [userTyping, setUserTyping] = useState(false);
  const [quickReplyOpen, setQuickReplyOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [aiDraftLoading, setAiDraftLoading] = useState(false);
  const [aiDraftSources, setAiDraftSources] = useState<AiDraftSource[]>([]);
  const [noteValue, setNoteValue] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteExpanded, setNoteExpanded] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    if (!snackbar.open) return;
    const timer = setTimeout(
      () => setSnackbar((prev) => ({ ...prev, open: false })),
      3000,
    );
    return () => clearTimeout(timer);
  }, [snackbar.open, snackbar.message]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false);
  const userTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const adminTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const handleNewMessage = useCallback((message: SupportMessage) => {
    setSession((prev) => {
      if (!prev) return prev;
      if (prev.messages.some((m) => m.id === message.id)) return prev;
      return { ...prev, messages: [...prev.messages, message] };
    });
  }, []);

  const handleMessageUpdated = useCallback(
    (event: { id: string; content: string }) => {
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.map((message) =>
            message.id === event.id
              ? { ...message, content: event.content }
              : message,
          ),
        };
      });
    },
    [],
  );

  const handleMessageDeleted = useCallback((event: { messageId: string }) => {
    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: prev.messages.filter(
          (message) => message.id !== event.messageId,
        ),
      };
    });
  }, []);

  const handleStatusChanged = useCallback(
    (event: { newStatus: string }) => {
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: event.newStatus as SupportSessionDetail["status"],
        };
      });
      onSessionUpdated();
    },
    [onSessionUpdated],
  );

  const handleTyping = useCallback(
    (event: { sessionId: string; userId: string; isTyping: boolean }) => {
      if (event.sessionId !== sessionId) return;
      // 어드민 본인이 보낸 typing 이벤트는 무시 (유저 입력만 표시)
      if (event.userId === adminSession?.user.id) return;
      setUserTyping(event.isTyping);
      if (event.isTyping) {
        if (userTypingTimeoutRef.current)
          clearTimeout(userTypingTimeoutRef.current);
        userTypingTimeoutRef.current = setTimeout(
          () => setUserTyping(false),
          5000,
        );
      }
    },
    [sessionId, adminSession?.user.id],
  );

  const {
    state: socketState,
    setTyping,
    reconnect,
  } = useSupportChatSocket({
    sessionId: sessionId || "",
    onNewMessage: handleNewMessage,
    onMessageUpdated: handleMessageUpdated,
    onMessageDeleted: handleMessageDeleted,
    onStatusChanged: handleStatusChanged,
    onTyping: handleTyping,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchUserAdminInfo = useCallback(async (userId: string) => {
    setGemsLoading(true);
    setUserDetailPhoneNumber(null);
    setGemsInfo(null);

    const [userDetailResult, gemsResult] = await Promise.allSettled([
      AdminService.userAppearance.getUserDetails(userId),
      AdminService.userAppearance.getUserGems(userId),
    ]);

    if (userDetailResult.status === "fulfilled") {
      setUserDetailPhoneNumber(userDetailResult.value?.phoneNumber || null);
    }

    if (gemsResult.status === "fulfilled") {
      setGemsInfo(gemsResult.value);
    }

    setGemsLoading(false);
  }, []);

  const fetchSessionDetail = useCallback(async () => {
    if (!sessionId) return;
    const request = ++detailRequestRef.current;
    setLoading(true);
    setError("");
    try {
      const detail = await supportChatService.getSessionDetail(sessionId);
      if (detailRequestRef.current !== request) return;
      if (detail.sessionId !== sessionId)
        throw new Error("Session detail does not match the requested session.");
      setSession(detail);
      setNoteValue(detail.adminNote ?? "");
      await fetchUserAdminInfo(detail.user.id);
      if (detailRequestRef.current === request)
        completedDetailRef.current = request;
    } catch (err) {
      if (detailRequestRef.current !== request) return;
      setError(
        err instanceof Error
          ? err.message
          : "세션 정보를 불러오는데 실패했습니다.",
      );
      setGemsLoading(false);
    } finally {
      if (detailRequestRef.current === request) setLoading(false);
    }
  }, [sessionId, fetchUserAdminInfo]);

  useEffect(() => {
    setSession(null);
    if (sessionId) fetchSessionDetail();
    return () => {
      detailRequestRef.current++;
    };
  }, [sessionId, fetchSessionDetail]);

  useEffect(() => {
    if (
      sessionId &&
      session?.sessionId === sessionId &&
      !loading &&
      !error &&
      completedDetailRef.current === detailRequestRef.current
    ) {
      markRead(sessionId, session.messages);
    }
  }, [sessionId, session, loading, error, markRead]);

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
      setSnackbar({
        open: true,
        message: "세션을 인수했습니다.",
        severity: "success",
      });
      await fetchSessionDetail();
      onSessionUpdated();
    } catch (err) {
      setSnackbar({
        open: true,
        message:
          err instanceof Error ? err.message : "세션 인수에 실패했습니다.",
        severity: "error",
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
        ...(params.closingMessage
          ? { closingMessage: params.closingMessage }
          : {}),
        ...(params.resolutionReason
          ? { resolutionReason: params.resolutionReason }
          : {}),
      });
      setSnackbar({
        open: true,
        message: "세션이 해결 완료 처리되었습니다.",
        severity: "success",
      });
      setResolveDialogOpen(false);
      await fetchSessionDetail();
      onSessionUpdated();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "세션 해결 처리에 실패했습니다.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenGemGrantDialog = () => {
    setGemGrantAmountInput("10");
    setGemGrantMessage(DEFAULT_GEM_GRANT_MESSAGE);
    setGemGrantDialogOpen(true);
  };

  const handleGrantGems = async () => {
    if (!session) return;

    const phoneNumber = userDetailPhoneNumber || session.user.phoneNumber;
    const normalizedMessage = gemGrantMessage.trim();

    if (!phoneNumber || phoneNumber.includes("*")) {
      toast.error("원본 연락처를 확인할 수 없어 구슬을 지급할 수 없습니다.");
      return;
    }

    if (gemGrantAmountInvalid) {
      toast.error("구슬 개수는 1개 이상이어야 합니다.");
      return;
    }

    if (!normalizedMessage) {
      toast.error("푸시 알림 메시지를 입력해주세요.");
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
        : "";
      const grantMessage = `구슬 ${gemGrantAmount}개 지급이 완료되었습니다.${pushSummary}`;
      if ((result?.failedCount ?? 0) > 0) toast.error(grantMessage);
      else
        setSnackbar({ open: true, message: grantMessage, severity: "success" });
      setGemGrantDialogOpen(false);
      await fetchUserAdminInfo(session.user.id);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "구슬 지급 중 오류가 발생했습니다.",
      );
    } finally {
      setGemGrantLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (
      sendingRef.current ||
      !messageInput.trim() ||
      !sessionId ||
      session?.status !== "admin_handling"
    )
      return;
    sendingRef.current = true;
    setSending(true);
    try {
      await supportChatService.sendMessage(sessionId, messageInput.trim());
      setMessageInput("");
      setTyping(false);
      if (adminTypingTimeoutRef.current)
        clearTimeout(adminTypingTimeoutRef.current);
      await fetchSessionDetail();
      onSessionUpdated();
    } catch (err) {
      setSnackbar({
        open: true,
        message:
          err instanceof Error ? err.message : "메시지 전송에 실패했습니다.",
        severity: "error",
      });
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  const startEditMessage = (message: SupportMessage) => {
    setEditingMessageId(message.id);
    setEditingContent(message.content);
  };

  const cancelEditMessage = () => {
    setEditingMessageId(null);
    setEditingContent("");
  };

  const handleSaveEditedMessage = async (messageId: string) => {
    if (!sessionId || !editingContent.trim()) return;

    setEditSaving(true);
    try {
      const result = await supportChatService.updateMessage(
        sessionId,
        messageId,
        {
          content: editingContent.trim(),
        },
      );
      handleMessageUpdated({ id: messageId, content: result.content });
      cancelEditMessage();
      setSnackbar({
        open: true,
        message: "답변을 수정했습니다.",
        severity: "success",
      });
      onSessionUpdated();
    } catch (err) {
      setSnackbar({
        open: true,
        message:
          err instanceof Error ? err.message : "답변 수정에 실패했습니다.",
        severity: "error",
      });
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!sessionId) return;
    const target = session?.messages.find((m) => m.id === messageId);
    const preview = target?.content.slice(0, 80) ?? "";
    const ok = await confirm({
      title: "답변 삭제",
      message: `이 답변을 삭제합니다.\n\n${preview}${(target?.content.length ?? 0) > 80 ? "…" : ""}`,
      confirmText: "삭제",
      severity: "error",
    });
    if (!ok) return;

    setDeletingMessageId(messageId);
    try {
      await supportChatService.deleteMessage(sessionId, messageId);
      handleMessageDeleted({ messageId });
      if (editingMessageId === messageId) cancelEditMessage();
      setSnackbar({
        open: true,
        message: "답변을 삭제했습니다.",
        severity: "success",
      });
      onSessionUpdated();
    } catch (err) {
      setSnackbar({
        open: true,
        message:
          err instanceof Error ? err.message : "답변 삭제에 실패했습니다.",
        severity: "error",
      });
    } finally {
      setDeletingMessageId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      !e.nativeEvent.isComposing &&
      e.keyCode !== 229
    ) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleMessageInputChange = (value: string) => {
    setMessageInput(value);
    if (!socketState.connected || !socketState.sessionJoined) return;
    setTyping(true);
    if (adminTypingTimeoutRef.current)
      clearTimeout(adminTypingTimeoutRef.current);
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
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message:
          err instanceof Error ? err.message : "AI 초안 생성에 실패했습니다.",
        severity: "error",
      });
    } finally {
      setAiDraftLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!sessionId) return;
    setNoteSaving(true);
    try {
      const result = await supportChatService.updateAdminNote(
        sessionId,
        noteValue,
      );
      setNoteValue(result.note ?? "");
      setSession((prev) => (prev ? { ...prev, adminNote: result.note } : prev));
      setSnackbar({
        open: true,
        message: "내부 메모를 저장했습니다.",
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message:
          err instanceof Error ? err.message : "내부 메모 저장에 실패했습니다.",
        severity: "error",
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
      if (userTypingTimeoutRef.current)
        clearTimeout(userTypingTimeoutRef.current);
      if (adminTypingTimeoutRef.current)
        clearTimeout(adminTypingTimeoutRef.current);
    };
  }, []);

  const formatDate = (dateString: string) => {
    return safeToLocaleString(dateString, "ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderMessage = (message: SupportMessage) => {
    const config = SENDER_CONFIG[message.senderType];
    const isUser = message.senderType === "user";
    const canMutateMessage = canMutateSupportMessage(
      message,
      adminSession?.user.id,
    );
    const isEditing = editingMessageId === message.id;

    return (
      <li
        key={message.id}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: isUser ? "flex-start" : "flex-end",
          paddingBlock: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginBottom: 4,
            flexDirection: isUser ? "row" : "row-reverse",
          }}
        >
          {config.icon}
          <p>{config.label}</p>
          <span style={{ marginLeft: 8 }}>{formatDate(message.createdAt)}</span>
        </div>
        <Card
          style={{
            padding: 12,
            maxWidth: "80%",
            minWidth: isEditing ? "min(80%, 360px)" : undefined,
            backgroundColor: config.bgColor,
            borderRadius: 2,
          }}
        >
          {canMutateMessage && !isEditing && (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 4,
                marginBottom: 4,
              }}
            >
              <Button
                onClick={() => startEditMessage(message)}
                aria-label="답변 수정"
                variant={"secondary"}
                isIconOnly
              >
                <EditIcon size={16} />
              </Button>
              <Button
                onClick={() => handleDeleteMessage(message.id)}
                aria-label="답변 삭제"
                variant={"secondary"}
                isDisabled={deletingMessageId === message.id}
                isIconOnly
              >
                {deletingMessageId === message.id ? (
                  <Spinner aria-label="로딩 중" />
                ) : (
                  <DeleteIcon size={16} />
                )}
              </Button>
            </div>
          )}
          {(message.senderType === "bot" || message.senderType === "admin") &&
            (message.metadata?.phase ||
              message.metadata?.source ||
              message.metadata?.webhook_handled) && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 4,
                  marginBottom: 4,
                }}
              >
                {message.metadata?.phase && (
                  <Chip size="sm">{PHASE_LABELS[message.metadata.phase]}</Chip>
                )}
                {message.metadata?.source && (
                  <Chip size="sm">
                    {SOURCE_LABELS[message.metadata.source]?.label ||
                      `출처: ${message.metadata.source}`}
                  </Chip>
                )}
                {message.metadata?.webhook_handled &&
                  !message.metadata?.source && (
                    <Chip size="sm">{"🤖 webhook 처리"}</Chip>
                  )}
                {message.metadata?.tool && (
                  <Chip size="sm">{`🔧 ${message.metadata.tool}`}</Chip>
                )}
              </div>
            )}
          {isEditing ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <TextField aria-label={"입력"}>
                <TextArea
                  value={editingContent}
                  onChange={(event) => setEditingContent(event.target.value)}
                  rows={3}
                  autoFocus
                  {...{ maxLength: 2000 }}
                  disabled={editSaving}
                  aria-label={"입력"}
                />
              </TextField>
              <div
                style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}
              >
                <Button
                  onClick={cancelEditMessage}
                  variant={"secondary"}
                  isDisabled={editSaving}
                >
                  {<CloseIcon size={16} />}취소
                </Button>
                <Button
                  onClick={() => handleSaveEditedMessage(message.id)}
                  variant={"primary"}
                  isDisabled={editSaving || !editingContent.trim()}
                >
                  {editSaving ? (
                    <Spinner aria-label="로딩 중" />
                  ) : (
                    <CheckIcon size={16} />
                  )}
                  저장
                </Button>
              </div>
            </div>
          ) : (
            <p style={{ whiteSpace: "pre-wrap", wordBreak: "keep-all", overflowWrap: "break-word" }}>{message.content}</p>
          )}
          {message.metadata?.confidence !== undefined && (
            <p style={{ display: "block", marginTop: 4 }}>
              신뢰도: {(message.metadata.confidence * 100).toFixed(0)}%
            </p>
          )}
          {message.metadata?.reason && (
            <p style={{ display: "block", marginTop: 4, fontStyle: "italic" }}>
              사유: {message.metadata.reason}
            </p>
          )}
        </Card>
      </li>
    );
  };

  // Empty state
  if (!sessionId) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#52525b",
        }}
      >
        <ForumIcon size={16} />
        <h6>세션을 선택하세요</h6>
        <p>좌측 목록에서 세션을 클릭하면 채팅 내용이 여기에 표시됩니다.</p>
      </div>
    );
  }

  const canTakeover =
    session?.status === "waiting_admin" || session?.status === "bot_handling";
  const canResolve = session?.status === "admin_handling";
  const canSendMessage = session?.status === "admin_handling";
  const displayPhoneNumber = userDetailPhoneNumber || session?.user.phoneNumber;
  const canGrantGems =
    !!displayPhoneNumber && !displayPhoneNumber.includes("*");

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minWidth: 0,
      }}
    >
      {/* Header */}
      {session && (
        <div
          style={{
            padding: 16,
            borderBottom: "1px solid #e4e4e7",
            borderColor: "#e4e4e7",
            backgroundColor: "#ffffff",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            {onBack && (
              <Button
                onClick={onBack}
                variant={"secondary"}
                isIconOnly
                aria-label="목록으로 돌아가기"
              >
                <ArrowBackIcon size={16} />
              </Button>
            )}
            <p style={{ fontWeight: 700 }}>
              {session.user.nickname || session.user.id.substring(0, 8)}
            </p>
            <Chip size="sm">{SESSION_STATUS_LABELS[session.status]}</Chip>
            {session.domain && (
              <Chip size="sm">{DOMAIN_LABELS[session.domain]}</Chip>
            )}
            <p>
              {LANGUAGE_FLAGS[session.language]}
              {LANGUAGE_LABELS[session.language]}
            </p>
            {canSendMessage && (
              <Chip size="sm">
                {socketState.connected ? (
                  <WifiIcon size={16} />
                ) : (
                  <WifiOffIcon size={16} />
                )}
                {socketState.connected
                  ? socketState.sessionJoined
                    ? "연결됨"
                    : "참여 중..."
                  : "연결 끊김"}
              </Chip>
            )}
            {canSendMessage && !socketState.connected && (
              <Button onClick={reconnect} variant={"secondary"}>
                {<RefreshIcon size={16} />}재연결
              </Button>
            )}
            {session.assignedAdminId && (
              <Chip size="sm">
                {session.assignedAdminId === adminSession?.user.id
                  ? "내 담당"
                  : "다른 어드민 담당"}
              </Chip>
            )}
            <div style={{ flex: 1 }}></div>
            {canTakeover && (
              <Button
                onClick={handleTakeover}
                variant={"primary"}
                isDisabled={actionLoading}
              >
                {actionLoading ? (
                  <Spinner aria-label="로딩 중" />
                ) : (
                  <TakeoverIcon size={16} />
                )}
                인수하기
              </Button>
            )}
            {canResolve && (
              <Button
                onClick={() => setResolveDialogOpen(true)}
                variant={"primary"}
                isDisabled={actionLoading}
              >
                {actionLoading ? (
                  <Spinner aria-label="로딩 중" />
                ) : (
                  <CheckCircleIcon size={16} />
                )}
                해결 완료
              </Button>
            )}
            <Button
              onClick={handleOpenGemGrantDialog}
              variant={"secondary"}
              isDisabled={gemsLoading || !canGrantGems}
            >
              {<DiamondIcon size={16} />}구슬 지급
            </Button>
          </div>
          {/* User info row */}
          <div
            style={{ display: "flex", gap: 24, marginTop: 8, flexWrap: "wrap" }}
          >
            {session.user.universityName && (
              <div>
                <p>대학교</p>
                <p>{session.user.universityName}</p>
              </div>
            )}
            {displayPhoneNumber && (
              <div>
                <p>연락처</p>
                <p>{displayPhoneNumber}</p>
              </div>
            )}
            <div>
              <p>구슬</p>
              <p>
                {gemsLoading ? "조회 중..." : `${gemsInfo?.gemBalance ?? 0}개`}
              </p>
            </div>
            <div>
              <p>생성일</p>
              <p>{formatDate(session.createdAt)}</p>
            </div>
          </div>
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-default p-3 text-sm"
          style={{ margin: 16 }}
        >
          {error}
        </div>
      )}
      {socketState.error && canSendMessage && (
        <div
          role="alert"
          className="rounded-lg border border-default p-3 text-sm"
          style={{ marginInline: 16, marginTop: 8 }}
        >
          WebSocket: {socketState.error}
        </div>
      )}
      {/* Bot collected info */}
      {session && (session.domain || session.collectedInfo) && (
        <div
          style={{
            paddingInline: 16,
            paddingBlock: 12,
            backgroundColor: "#f3f0ff",
            borderBottom: "1px solid #e4e4e7",
            borderColor: "#e4e4e7",
          }}
        >
          <p
            style={{
              fontWeight: "bold",
              marginBottom: 4,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <SmartToyIcon size={16} />봇 수집 정보
          </p>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {session.collectedInfo &&
              Object.entries(session.collectedInfo).map(([key, value]) => (
                <div key={key}>
                  <p>{INFO_KEY_LABELS[key] || key}</p>
                  <p>{value}</p>
                </div>
              ))}
          </div>
        </div>
      )}
      {/* 어드민 내부 메모 (유저 비노출) */}
      {session && (
        <div
          style={{
            paddingInline: 16,
            paddingBlock: 8,
            borderBottom: "1px solid #e4e4e7",
            borderColor: "#e4e4e7",
            backgroundColor: "#fffde7",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <NoteIcon size={16} />
            <p style={{ fontWeight: 700, flex: 1 }}>
              내부 메모
              <span style={{ marginLeft: 8 }}>(유저에게 보이지 않음)</span>
            </p>
            <Button
              onClick={() => setNoteExpanded((v) => !v)}
              variant={"secondary"}
            >
              {noteExpanded ? "접기" : noteValue ? "메모 보기" : "메모 추가"}
            </Button>
          </div>
          {!noteExpanded && noteValue && (
            <p style={{ marginTop: 4, paddingLeft: 3.5 }}>{noteValue}</p>
          )}
          {noteExpanded && (
            <div
              style={{
                marginTop: 8,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <TextField
                aria-label={"교대/이관 시 참고할 내부 메모를 남기세요."}
              >
                <TextArea
                  value={noteValue}
                  onChange={(e) => setNoteValue(e.target.value)}
                  rows={2}
                  placeholder="교대/이관 시 참고할 내부 메모를 남기세요."
                  {...{ maxLength: 2000 }}
                  disabled={noteSaving}
                  aria-label={"교대/이관 시 참고할 내부 메모를 남기세요."}
                />
              </TextField>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  onClick={handleSaveNote}
                  variant={"primary"}
                  isDisabled={
                    noteSaving || noteValue === (session.adminNote ?? "")
                  }
                >
                  {noteSaving ? (
                    <Spinner aria-label="로딩 중" />
                  ) : (
                    <CheckIcon size={16} />
                  )}
                  메모 저장
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Messages area */}
      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flex: 1,
          }}
        >
          <Spinner aria-label="로딩 중" />
        </div>
      ) : session?.sessionId === sessionId ? (
        <div style={{ flex: 1, overflow: "auto", padding: 8 }}>
          {session.messages.length === 0 ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              <p>메시지가 없습니다.</p>
            </div>
          ) : (
            <ul style={{ padding: 0 }}>
              {session.messages.map(renderMessage)}
              <div ref={messagesEndRef} />
            </ul>
          )}
        </div>
      ) : null}
      {/* Message input */}
      {canSendMessage && (
        <>
          <hr />
          {userTyping && (
            <p
              style={{ paddingInline: 16, paddingTop: 8, fontStyle: "italic" }}
            >
              사용자가 입력 중입니다…
            </p>
          )}
          {aiDraftSources.length > 0 && (
            <div style={{ paddingInline: 16, paddingTop: 8 }}>
              <p style={{ fontWeight: 700 }}>참고한 유사 과거 문의</p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  marginTop: 4,
                }}
              >
                {aiDraftSources.slice(0, 3).map((src, idx) => (
                  <Tooltip key={idx}>
                    <Tooltip.Trigger>
                      <p style={{ cursor: "help" }}>
                        · {src.question}{" "}
                        <span>({(src.similarity * 100).toFixed(0)}%)</span>
                      </p>
                    </Tooltip.Trigger>
                    <Tooltip.Content>{src.answer}</Tooltip.Content>
                  </Tooltip>
                ))}
              </div>
            </div>
          )}
          <div
            style={{
              padding: 16,
              display: "flex",
              gap: 8,
              alignItems: "flex-end",
            }}
          >
            <Tooltip>
              <Tooltip.Trigger>
                <span>
                  <Button
                    onClick={handleGenerateAiDraft}
                    aria-label="AI 답변 초안 생성"
                    variant={"secondary"}
                    isDisabled={sending || aiDraftLoading}
                    isIconOnly
                  >
                    {aiDraftLoading ? (
                      <Spinner aria-label="로딩 중" />
                    ) : (
                      <AiDraftIcon size={16} />
                    )}
                  </Button>
                </span>
              </Tooltip.Trigger>
              <Tooltip.Content>{"AI 답변 초안 생성"}</Tooltip.Content>
            </Tooltip>
            <Tooltip>
              <Tooltip.Trigger>
                <span>
                  <Button
                    onClick={() => setQuickReplyOpen(true)}
                    aria-label="빠른 답변 템플릿"
                    variant={"secondary"}
                    isDisabled={sending}
                    isIconOnly
                  >
                    <TemplateIcon size={16} />
                  </Button>
                </span>
              </Tooltip.Trigger>
              <Tooltip.Content>{"빠른 답변 템플릿"}</Tooltip.Content>
            </Tooltip>
            <TextField
              aria-label={"메시지를 입력하세요..."}
              className="flex-1 min-w-0"
            >
              <TextArea
                placeholder="메시지를 입력하세요..."
                value={messageInput}
                onChange={(e) => handleMessageInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={sending}
                aria-label={"메시지를 입력하세요..."}
              />
            </TextField>
            <Button
              onClick={handleSendMessage}
              aria-label="메시지 전송"
              style={{ minWidth: "auto", paddingInline: 16 }}
              variant={"primary"}
              isDisabled={sending || !messageInput.trim()}
            >
              {sending ? (
                <Spinner aria-label="로딩 중" />
              ) : (
                <SendIcon size={16} />
              )}
            </Button>
          </div>
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
      <Modal.Backdrop
        isOpen={gemGrantDialogOpen}
        isDismissable={!gemGrantLoading}
        isKeyboardDismissDisabled={gemGrantLoading}
        onOpenChange={(isOpen) => {
          if (!isOpen && !gemGrantLoading) setGemGrantDialogOpen(false);
        }}
      >
        <Modal.Container>
          <Modal.Dialog style={{ width: '100%', maxWidth: 444, minWidth: 0 }} className="max-w-3xl">
            <Modal.Heading>구슬 지급</Modal.Heading>
            <Modal.Body>
              <p style={{ marginBottom: 16 }}>
                {session?.user.nickname || session?.user.id.substring(0, 8)}
                님에게 구슬을 지급하고 푸시 알림을 발송합니다.
              </p>
              <TextField style={{ marginBottom: 16 }}>
                <Label>{"지급할 구슬 개수"}</Label>
                <Input
                  type="number"
                  value={gemGrantAmountInput}
                  onChange={(e) => setGemGrantAmountInput(e.target.value)}
                  {...{ min: 1 }}
                  disabled={gemGrantLoading}
                  aria-invalid={gemGrantAmountInvalid}
                />
                {gemGrantAmountInvalid && (
                  <FieldError>1 이상의 정수를 입력해주세요.</FieldError>
                )}
              </TextField>
              <TextField className="flex-1 min-w-0">
                <Label>{"푸시 알림 메시지"}</Label>
                <TextArea
                  value={gemGrantMessage}
                  onChange={(e) => setGemGrantMessage(e.target.value)}
                  {...{ maxLength: 200 }}
                  disabled={gemGrantLoading}
                />
                <Description>{`${gemGrantMessage.length}/200자 | 지급 사유와 푸시 알림 메시지로 사용됩니다.`}</Description>
              </TextField>
            </Modal.Body>
            <Modal.Footer>
              <Button
                onClick={() => setGemGrantDialogOpen(false)}
                variant={"secondary"}
                isDisabled={gemGrantLoading}
              >
                취소
              </Button>
              <Button
                onClick={handleGrantGems}
                variant={"primary"}
                isDisabled={
                  gemGrantLoading ||
                  !canGrantGems ||
                  !gemGrantMessage.trim() ||
                  gemGrantAmountInvalid
                }
              >
                {gemGrantLoading ? (
                  <Spinner aria-label="로딩 중" />
                ) : (
                  <DiamondIcon size={16} />
                )}
                구슬 지급 및 알림 발송
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
      <div
        hidden={!snackbar.open}
        role="status"
        className="fixed bottom-4 right-4 rounded-xl bg-foreground text-background p-3 z-50"
      >
        {undefined}
        <div
          role="alert"
          className="rounded-lg border border-default p-3 text-sm"
          style={{ width: "100%" }}
        >
          {snackbar.message}
          <Button
            variant="secondary"
            size="sm"
            aria-label="알림 닫기"
            onClick={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          >
            닫기
          </Button>
        </div>
      </div>
    </div>
  );
}
