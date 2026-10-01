"use client";
import { Label as HeroSelectLabel } from "@heroui/react";

import { Select, ListBox, Button, Chip, Spinner, Tooltip } from "@heroui/react";
import {
  RefreshCw as RefreshIcon,
  MessageCircle as ChatIcon,
  UserRound as PersonIcon,
} from "lucide-react";

import { useState, useEffect, useCallback } from "react";

import supportChatService from "@/app/services/support-chat";
import type {
  SupportSessionStatus,
  SupportSessionSummary,
  AdminSessionsResponse,
  SupportDomain,
} from "@/app/types/support-chat";
import {
  SESSION_STATUS_LABELS,
  SESSION_STATUS_COLORS,
  LANGUAGE_FLAGS,
  DOMAIN_LABELS,
  DOMAIN_COLORS,
} from "@/app/types/support-chat";
import ChatDetailDialog from "./ChatDetailDialog";
import { safeToLocaleString } from "@/app/utils/formatters";

interface SessionListTabProps {
  statusFilter?: SupportSessionStatus;
}

export default function SessionListTab({ statusFilter }: SessionListTabProps) {
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<SupportSessionSummary[]>([]);
  const [error, setError] = useState<string>("");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );
  const [chatDialogOpen, setChatDialogOpen] = useState(false);

  const [domainFilter, setDomainFilter] = useState<SupportDomain | "all">(
    "all",
  );

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response: AdminSessionsResponse =
        await supportChatService.getSessions({
          status: statusFilter,
          page: page + 1,
          limit: rowsPerPage,
        });

      let filteredSessions = response.sessions;
      if (domainFilter !== "all") {
        filteredSessions = filteredSessions.filter(
          (session) => session.domain === domainFilter,
        );
      }

      setSessions(filteredSessions);
      setTotalCount(response.pagination.total);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "세션 목록을 불러오는데 실패했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page, rowsPerPage, domainFilter]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenChat = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setChatDialogOpen(true);
  };

  const handleCloseChat = () => {
    setChatDialogOpen(false);
    setSelectedSessionId(null);
  };

  const handleSessionUpdated = () => {
    fetchSessions();
  };

  const formatDate = (dateString: string) => {
    return safeToLocaleString(dateString, "ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateMessage = (message?: string, maxLength = 50) => {
    if (!message) return "-";
    return message.length > maxLength
      ? `${message.substring(0, maxLength)}...`
      : message;
  };

  return (
    <div>
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-default p-3 text-sm"
          style={{ marginBottom: 16 }}
        >
          {error}
        </div>
      )}
      <div style={{ padding: 16, marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <p style={{ fontWeight: "bold" }}>
            {statusFilter ? SESSION_STATUS_LABELS[statusFilter] : "전체"}세션
            목록
          </p>
          <Button
            onClick={fetchSessions}
            variant={"secondary"}
            isDisabled={loading}
          >
            {loading ? (
              <Spinner aria-label="로딩 중" />
            ) : (
              <RefreshIcon size={16} />
            )}
            새로고침
          </Button>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setDomainFilter("all")}
          >
            {"전체"}
          </Button>
          {(
            [
              "payment",
              "matching",
              "chat",
              "account",
              "other",
            ] as SupportDomain[]
          ).map((domain) => (
            <Button
              variant="secondary"
              size="sm"
              key={domain}
              onClick={() => setDomainFilter(domain)}
            >
              {DOMAIN_LABELS[domain]}
            </Button>
          ))}
        </div>
      </div>
      <div>
        <table className="w-full text-sm text-left">
          <thead>
            <tr>
              <th scope="col" className="px-3 py-2 border-b border-default">
                세션 ID
              </th>
              <th scope="col" className="px-3 py-2 border-b border-default">
                사용자
              </th>
              <th scope="col" className="px-3 py-2 border-b border-default">
                상태
              </th>
              <th scope="col" className="px-3 py-2 border-b border-default">
                언어
              </th>
              <th scope="col" className="px-3 py-2 border-b border-default">
                도메인
              </th>
              <th scope="col" className="px-3 py-2 border-b border-default">
                메시지 수
              </th>
              <th scope="col" className="px-3 py-2 border-b border-default">
                마지막 메시지
              </th>
              <th scope="col" className="px-3 py-2 border-b border-default">
                생성일
              </th>
              <th scope="col" className="px-3 py-2 border-b border-default">
                작업
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && sessions.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  style={{ paddingBlock: 32 }}
                  className="px-3 py-2 border-b border-default"
                >
                  <Spinner aria-label="로딩 중" />
                </td>
              </tr>
            ) : sessions.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  style={{ paddingBlock: 32 }}
                  className="px-3 py-2 border-b border-default"
                >
                  <p>세션이 없습니다.</p>
                </td>
              </tr>
            ) : (
              sessions.map((session) => (
                <tr key={session.sessionId}>
                  <td className="px-3 py-2 border-b border-default">
                    <p style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
                      {session.sessionId.substring(0, 8)}...
                    </p>
                  </td>
                  <td className="px-3 py-2 border-b border-default">
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <PersonIcon size={16} />
                      <p>
                        {session.userNickname || session.userId.substring(0, 8)}
                      </p>
                    </div>
                  </td>
                  <td className="px-3 py-2 border-b border-default">
                    <Chip size="sm">
                      {SESSION_STATUS_LABELS[session.status]}
                    </Chip>
                  </td>
                  <td className="px-3 py-2 border-b border-default">
                    <Tooltip>
                      <Tooltip.Trigger>
                        <span style={{ fontSize: "1.2rem" }}>
                          {LANGUAGE_FLAGS[session.language]}
                        </span>
                      </Tooltip.Trigger>
                      <Tooltip.Content>
                        {session.language === "ko" ? "한국어" : "日本語"}
                      </Tooltip.Content>
                    </Tooltip>
                  </td>
                  <td className="px-3 py-2 border-b border-default">
                    {session.domain ? (
                      <Chip size="sm">{DOMAIN_LABELS[session.domain]}</Chip>
                    ) : (
                      <p>-</p>
                    )}
                  </td>
                  <td className="px-3 py-2 border-b border-default">
                    <p>{session.messageCount}</p>
                  </td>
                  <td className="px-3 py-2 border-b border-default">
                    <Tooltip>
                      <Tooltip.Trigger>
                        <p style={{ maxWidth: 200 }}>
                          {truncateMessage(session.lastMessage)}
                        </p>
                      </Tooltip.Trigger>
                      <Tooltip.Content>
                        {session.lastMessage || ""}
                      </Tooltip.Content>
                    </Tooltip>
                  </td>
                  <td className="px-3 py-2 border-b border-default">
                    <p>{formatDate(session.createdAt)}</p>
                  </td>
                  <td className="px-3 py-2 border-b border-default">
                    <Button
                      onClick={() => handleOpenChat(session.sessionId)}
                      aria-label="채팅 보기"
                      variant={"secondary"}
                      isIconOnly
                    >
                      <ChatIcon size={16} />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="flex flex-wrap items-center justify-end gap-3 p-3">
          <Select
            aria-label="페이지당 행 수"
            selectedKey={String(rowsPerPage)}
            onSelectionChange={(key) =>
              handleChangeRowsPerPage({
                target: { value: String(key) },
              } as React.ChangeEvent<HTMLInputElement>)
            }
          >
            <HeroSelectLabel className="sr-only">
              {"페이지당 행 수"}
            </HeroSelectLabel>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {[10, 25, 50].map((size) => (
                  <ListBox.Item
                    key={size}
                    id={String(size)}
                    textValue={String(size)}
                  >
                    {size}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
          <Button
            variant="secondary"
            isDisabled={page <= 0}
            onPress={() => handleChangePage(null, page - 1)}
          >
            이전
          </Button>
          <span>
            {page + 1} / {Math.max(1, Math.ceil(totalCount / rowsPerPage))}
          </span>
          <Button
            variant="secondary"
            isDisabled={(page + 1) * rowsPerPage >= totalCount}
            onPress={() => handleChangePage(null, page + 1)}
          >
            다음
          </Button>
        </div>
      </div>
      {selectedSessionId && (
        <ChatDetailDialog
          open={chatDialogOpen}
          sessionId={selectedSessionId}
          onClose={handleCloseChat}
          onSessionUpdated={handleSessionUpdated}
        />
      )}
    </div>
  );
}
