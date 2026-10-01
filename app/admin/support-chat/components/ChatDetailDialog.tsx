"use client";
import {
  Button,
  Card,
  Chip,
  FieldError,
  Label,
  Modal,
  Spinner,
  TextArea,
  TextField,
} from "@heroui/react";
import {
  X as CloseIcon,
  Send as SendIcon,
  ArrowLeftRight as TakeoverIcon,
  CircleCheck as CheckCircleIcon,
  Bot as SmartToyIcon,
  UserRound as PersonIcon,
  Headset as SupportAgentIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Pencil as EditIcon,
  Trash2 as DeleteIcon,
  Check as CheckIcon,
} from "lucide-react";

import { useState, useEffect, useRef, useCallback } from "react";

import supportChatService from "@/app/services/support-chat";
import { useSupportChatSocket } from "../hooks/useSupportChatSocket";
import { useReadState } from "../lib/read-state";
import { canMutateSupportMessage } from "../lib/can-mutate-message";
import type {
  SupportSessionDetail,
  SupportMessage,
  SupportSenderType,
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
import { useAdminSession } from "@/shared/contexts/admin-session-context";

interface ChatDetailDialogProps {
  open: boolean;
  sessionId: string;
  onClose: () => void;
  onSessionUpdated: () => void;
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

export default function ChatDetailDialog({
  open,
  sessionId,
  onClose,
  onSessionUpdated,
}: ChatDetailDialogProps) {
  const { session: adminSession } = useAdminSession();
  const { markRead } = useReadState();
  const detailRequestRef = useRef(0);
  const completedDetailRef = useRef(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [session, setSession] = useState<SupportSessionDetail | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(
    null,
  );
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

  const handleNewMessage = useCallback((message: SupportMessage) => {
    setSession((prev) => {
      if (!prev) return prev;
      const messageExists = prev.messages.some((m) => m.id === message.id);
      if (messageExists) return prev;
      return {
        ...prev,
        messages: [...prev.messages, message],
      };
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

  const { state: socketState } = useSupportChatSocket({
    sessionId,
    onNewMessage: handleNewMessage,
    onMessageUpdated: handleMessageUpdated,
    onMessageDeleted: handleMessageDeleted,
    onStatusChanged: handleStatusChanged,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchSessionDetail = useCallback(async () => {
    const request = ++detailRequestRef.current;
    setLoading(true);
    setError("");

    try {
      const detail = await supportChatService.getSessionDetail(sessionId);
      if (detailRequestRef.current !== request) return;
      if (detail.sessionId !== sessionId)
        throw new Error("Session detail does not match the requested session.");
      setSession(detail);
      completedDetailRef.current = request;
    } catch (err) {
      if (detailRequestRef.current !== request) return;
      setError(
        err instanceof Error
          ? err.message
          : "세션 정보를 불러오는데 실패했습니다.",
      );
    } finally {
      if (detailRequestRef.current === request) setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    setSession(null);
    if (open && sessionId) fetchSessionDetail();
    return () => {
      detailRequestRef.current++;
    };
  }, [open, sessionId, fetchSessionDetail]);

  useEffect(() => {
    if (
      open &&
      session?.sessionId === sessionId &&
      !loading &&
      !error &&
      completedDetailRef.current === detailRequestRef.current
    ) {
      markRead(sessionId, session.messages);
    }
  }, [open, sessionId, session, loading, error, markRead]);

  useEffect(() => {
    if (session?.messages) {
      scrollToBottom();
    }
  }, [session?.messages]);

  const handleTakeover = async () => {
    if (!session) return;

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

  const handleResolve = async () => {
    if (!session) return;

    setActionLoading(true);
    try {
      await supportChatService.resolveSession(sessionId, {
        closingMessage: "문의해 주셔서 감사합니다. 좋은 하루 되세요!",
      });
      setSnackbar({
        open: true,
        message: "세션이 해결 완료 처리되었습니다.",
        severity: "success",
      });
      await fetchSessionDetail();
      onSessionUpdated();
    } catch (err) {
      setSnackbar({
        open: true,
        message:
          err instanceof Error ? err.message : "세션 해결 처리에 실패했습니다.",
        severity: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (
      sendingRef.current ||
      !messageInput.trim() ||
      session?.status !== "admin_handling"
    )
      return;
    sendingRef.current = true;
    setSending(true);
    try {
      await supportChatService.sendMessage(sessionId, messageInput.trim());
      setMessageInput("");
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
    if (!editingContent.trim()) return;

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
    if (!window.confirm("이 답변을 삭제할까요?")) return;

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
          <p style={{ marginLeft: 8 }}>{formatDate(message.createdAt)}</p>
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
            <p style={{ whiteSpace: "pre-wrap" }}>{message.content}</p>
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

  const canTakeover =
    session?.status === "waiting_admin" || session?.status === "bot_handling";
  const canResolve = session?.status === "admin_handling";
  const canSendMessage = session?.status === "admin_handling";

  return (
    <>
      <Modal.Backdrop
        isOpen={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) onClose();
        }}
      >
        <Modal.Container>
          <Modal.Dialog style={{ width: '100%', maxWidth: 900, minWidth: 0 }} className="max-w-3xl">
            <Modal.Heading
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <SupportAgentIcon size={16} />
                <span>채팅 상세</span>
                {session && (
                  <>
                    <Chip size="sm">
                      {SESSION_STATUS_LABELS[session.status]}
                    </Chip>
                    <p>
                      {LANGUAGE_FLAGS[session.language]}
                      {LANGUAGE_LABELS[session.language]}
                    </p>
                  </>
                )}
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
                      : "연결 중..."}
                  </Chip>
                )}
              </span>
              <Button
                onClick={onClose}
                variant={"secondary"}
                isIconOnly
                aria-label="작업"
              >
                <CloseIcon size={16} />
              </Button>
            </Modal.Heading>
            <Modal.Body
              style={{
                padding: 0,
                display: "flex",
                flexDirection: "column",
                height: 500,
              }}
            >
              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-default p-3 text-sm"
                  style={{ margin: 16 }}
                >
                  {error}
                </div>
              )}
              {socketState.error && (
                <div
                  role="alert"
                  className="rounded-lg border border-default p-3 text-sm"
                  style={{ margin: 16 }}
                >
                  WebSocket: {socketState.error}
                </div>
              )}
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
                <>
                  <div
                    style={{
                      padding: 16,
                      backgroundColor: "#f4f4f5",
                      borderBottom: "1px solid #e4e4e7",
                      borderColor: "#e4e4e7",
                    }}
                  >
                    <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                      <div>
                        <p>사용자</p>
                        <p>
                          {session.user.nickname ||
                            session.user.id.substring(0, 8)}
                        </p>
                      </div>
                      {session.user.universityName && (
                        <div>
                          <p>대학교</p>
                          <p>{session.user.universityName}</p>
                        </div>
                      )}
                      {session.user.phoneNumber && (
                        <div>
                          <p>연락처</p>
                          <p>{session.user.phoneNumber}</p>
                        </div>
                      )}
                      <div>
                        <p>생성일</p>
                        <p>{formatDate(session.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  {(session.domain || session.collectedInfo) && (
                    <div
                      style={{
                        padding: 16,
                        backgroundColor: "info.lighter",
                        borderBottom: "1px solid #e4e4e7",
                        borderColor: "#e4e4e7",
                      }}
                    >
                      <p
                        style={{
                          fontWeight: "bold",
                          marginBottom: 8,
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <SmartToyIcon size={16} />
                        🤖 봇이 수집한 정보
                      </p>
                      <div
                        style={{ display: "flex", gap: 16, flexWrap: "wrap" }}
                      >
                        {session.domain && (
                          <div>
                            <p>도메인</p>
                            <p>{DOMAIN_LABELS[session.domain]}</p>
                          </div>
                        )}
                        {session.collectedInfo &&
                          Object.entries(session.collectedInfo).map(
                            ([key, value]) => (
                              <div key={key}>
                                <p>{INFO_KEY_LABELS[key] || key}</p>
                                <p>{value}</p>
                              </div>
                            ),
                          )}
                      </div>
                      {session.domain &&
                        session.collectedInfo &&
                        Object.keys(session.collectedInfo).length > 0 && (
                          <p style={{ display: "block", marginTop: 8 }}>
                            💡 참고: 봇이 사용자와 대화하여 위 정보를
                            수집했습니다.
                          </p>
                        )}
                    </div>
                  )}

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

                  {canSendMessage && (
                    <>
                      <hr />
                      <div style={{ padding: 16, display: "flex", gap: 8 }}>
                        <TextField aria-label={"메시지를 입력하세요..."}>
                          <TextArea
                            placeholder="메시지를 입력하세요..."
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
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
                </>
              ) : null}
            </Modal.Body>
            <Modal.Footer
              style={{ paddingInline: 24, paddingBlock: 16, gap: 8 }}
            >
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
                  onClick={handleResolve}
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
              <div style={{ flex: 1 }}></div>
              <Button onClick={onClose} variant={"secondary"}>
                닫기
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
    </>
  );
}
