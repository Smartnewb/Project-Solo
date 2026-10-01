"use client";
import { Button, Chip, Modal, Spinner } from "@heroui/react";
import {
  X as CloseIcon,
  UserRound as PersonIcon,
  MessageCircle as ChatIcon,
  CircleCheck as CheckCircleIcon,
  Brain as AnalyzeIcon,
} from "lucide-react";

import { AIChatSession, AIChatMessage, AIChatSessionStatus } from "../types";
import { safeToLocaleString } from "@/app/utils/formatters";

interface AIChatMessageDetailProps {
  open: boolean;
  onClose: () => void;
  session: AIChatSession | null;
  messages: AIChatMessage[];
  loading: boolean;
}

export default function AIChatMessageDetail({
  open,
  onClose,
  session,
  messages,
  loading,
}: AIChatMessageDetailProps) {
  // 날짜 포맷
  const formatDate = (dateString: string) => {
    return safeToLocaleString(dateString, "ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 상태 정보
  const getStatusInfo = (status: AIChatSessionStatus) => {
    switch (status) {
      case "active":
        return {
          color: "success" as const,
          icon: <ChatIcon size={16} />,
          label: "진행 중",
        };
      case "completed":
        return {
          color: "primary" as const,
          icon: <CheckCircleIcon size={16} />,
          label: "완료",
        };
      case "analyzing":
        return {
          color: "warning" as const,
          icon: <AnalyzeIcon size={16} />,
          label: "분석 중",
        };
      case "analyzed":
        return {
          color: "info" as const,
          icon: <CheckCircleIcon size={16} />,
          label: "분석 완료",
        };
      case "closed":
        return {
          color: "default" as const,
          icon: <CloseIcon size={16} />,
          label: "종료",
        };
      default:
        return {
          color: "default" as const,
          icon: <ChatIcon size={16} />,
          label: status,
        };
    }
  };

  // 카테고리 색상
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "일상":
        return "primary";
      case "인간관계":
        return "secondary";
      case "진로/학교":
        return "info";
      case "연애":
        return "error";
      default:
        return "default";
    }
  };

  if (!session) return null;

  return (
    <Modal.Backdrop
      isOpen={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <Modal.Container>
        <Modal.Dialog style={{ width: '100%', maxWidth: 900, minWidth: 0 }} className="max-w-3xl">
          <Modal.Heading>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <img
                  src={session.user.profileImage || undefined}
                  alt="프로필"
                  className="h-9 w-9 rounded-full object-cover"
                />
                <span>
                  <span>{session.user.name}님의 AI 채팅</span>
                  <p>세션 ID: {session.id}</p>
                </span>
              </span>
              <Button onClick={onClose} variant={"secondary"}>
                {<CloseIcon size={16} />}닫기
              </Button>
            </span>
          </Modal.Heading>
          <Modal.Body>
            {loading ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  minHeight: 400,
                }}
              >
                <Spinner aria-label="로딩 중" />
              </div>
            ) : (
              <div>
                {/* 세션 정보 */}
                <div
                  style={{
                    padding: 24,
                    marginBottom: 24,
                    backgroundColor: "grey.50",
                  }}
                >
                  <p>세션 정보</p>
                  <div
                    style={{
                      display: "flex",
                      gap: 16,
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    <Chip size="sm">{`카테고리: ${session.category}`}</Chip>
                    <Chip size="sm">{`대화 턴 수: ${session.turnCount}`}</Chip>
                    <Chip size="sm">
                      {getStatusInfo(session.status).icon}
                      {`상태: ${getStatusInfo(session.status).label}`}
                    </Chip>
                    <Chip size="sm">
                      {session.isActive ? "활성 세션" : "비활성 세션"}
                    </Chip>
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <p>생성 시간: {formatDate(session.createdAt)}</p>
                    {session.updatedAt !== session.createdAt && (
                      <p style={{ display: "block" }}>
                        마지막 수정: {formatDate(session.updatedAt)}
                      </p>
                    )}
                    {session.completedAt && (
                      <p style={{ display: "block" }}>
                        완료 시간: {formatDate(session.completedAt)}
                      </p>
                    )}
                    {session.analyzedAt && (
                      <p style={{ display: "block" }}>
                        분석 시간: {formatDate(session.analyzedAt)}
                      </p>
                    )}
                  </div>
                </div>
                {/* 메시지 목록 */}
                <p>대화 내역 ({messages.length}개 메시지)</p>
                <div
                  style={{
                    maxHeight: 500,
                    overflowY: "auto",
                    padding: 16,
                    backgroundColor: "#f5f5f5",
                    borderRadius: 2,
                  }}
                >
                  {messages.length === 0 ? (
                    <div style={{ textAlign: "center", paddingBlock: 32 }}>
                      <p>대화 내용이 없습니다.</p>
                    </div>
                  ) : (
                    messages.map((message, index) => {
                      const isUser = message.role === "user";
                      return (
                        <div
                          key={message.id}
                          style={{
                            display: "flex",
                            justifyContent: isUser ? "flex-start" : "flex-end",
                            marginBottom: 16,
                            alignItems: "flex-start",
                            gap: 12,
                          }}
                        >
                          {isUser && (
                            <img
                              src={session.user.profileImage || undefined}
                              alt="프로필"
                              className="h-9 w-9 rounded-full object-cover"
                            />
                          )}
                          <div style={{ maxWidth: "60%", minWidth: 100 }}>
                            {/* 보낸 사람 이름 */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                marginBottom: 4,
                              }}
                            >
                              <p>
                                {isUser ? session.user.name : "썸메이트 AI"}
                              </p>
                              <p style={{ fontSize: "11px" }}>
                                {formatDate(message.createdAt)}
                              </p>
                            </div>
                            {/* 메시지 버블 */}
                            <div
                              style={{
                                padding: 20,
                                borderRadius: 2,
                                backgroundColor: isUser ? "#ffffff" : "#e3f2fd",
                                border: isUser
                                  ? "1px solid #e0e0e0"
                                  : "1px solid #bbdefb",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                                position: "relative",
                              }}
                            >
                              <p
                                style={{
                                  whiteSpace: "pre-wrap",
                                  wordBreak: "break-word",
                                  lineHeight: 1.6,
                                  fontSize: "14px",
                                  color: isUser ? "#212121" : "#1565c0",
                                }}
                              >
                                {message.content}
                              </p>
                            </div>
                          </div>
                          {!isUser && (
                            <span className="h-9 w-9 shrink-0 flex items-center justify-center rounded-full bg-default">
                              <ChatIcon size={16} />
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer
            style={{ padding: 16, borderTop: 1, borderColor: "#e4e4e7" }}
          >
            <Button onClick={onClose} variant={"primary"}>
              닫기
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
