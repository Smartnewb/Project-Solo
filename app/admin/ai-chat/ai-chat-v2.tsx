"use client";
import { Label as HeroSelectLabel } from "@heroui/react";

import {
  Button,
  Chip,
  FieldError,
  Input,
  Label,
  ListBox,
  Select,
  Spinner,
  TextField,
} from "@heroui/react";
import {
  MessageCircle as ChatIcon,
  UserRound as PersonIcon,
  RefreshCw as RefreshIcon,
  X as CloseIcon,
  MessageSquare as MessageIcon,
  CircleCheck as CheckCircleIcon,
  Brain as AnalyzeIcon,
} from "lucide-react";

import { format } from "date-fns";
import { useState } from "react";

import { AIChatSession, AIChatCategory, AIChatSessionStatus } from "./types";
import AIChatMessageDetail from "./components/AIChatMessageDetail";
import { useAiChatSessions, useAiChatMessages } from "@/app/admin/hooks";
import { safeToLocaleString } from "@/app/utils/formatters";

function AIChatManagementPageContent() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [category, setCategory] = useState<AIChatCategory | "">("");
  const [status, setStatus] = useState<AIChatSessionStatus | "">("");
  const [isActive, setIsActive] = useState<boolean | "">("");
  const [userId, setUserId] = useState<string>("");

  // Applied filter state (only sent on explicit search)
  const [appliedParams, setAppliedParams] = useState<{
    startDate?: string;
    endDate?: string;
    category?: string;
    status?: string;
    isActive?: boolean;
    userId?: string;
    page?: number;
    limit?: number;
  }>({ page: 1, limit: 20 });

  const [messagesDialogOpen, setMessagesDialogOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");

  const {
    data: sessionsData,
    isLoading,
    refetch,
  } = useAiChatSessions(appliedParams);
  const sessions = sessionsData?.sessions || [];
  const totalCount = sessionsData?.total || 0;

  const { data: messagesData, isLoading: messagesLoading } =
    useAiChatMessages(selectedSessionId);

  const handleSearch = () => {
    const params: typeof appliedParams = {
      page: page + 1,
      limit: rowsPerPage,
    };
    if (startDate) params.startDate = startDate.toISOString().split("T")[0];
    if (endDate) params.endDate = endDate.toISOString().split("T")[0];
    if (category) params.category = category;
    if (status) params.status = status;
    if (isActive !== "") params.isActive = isActive as boolean;
    if (userId) params.userId = userId;
    setAppliedParams(params);
  };

  const resetFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setCategory("");
    setStatus("");
    setIsActive("");
    setUserId("");
    setPage(0);
    setAppliedParams({ page: 1, limit: rowsPerPage });
  };

  const handleViewMessages = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setMessagesDialogOpen(true);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
    setAppliedParams((prev) => ({ ...prev, page: newPage + 1 }));
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const newLimit = parseInt(event.target.value, 10);
    setRowsPerPage(newLimit);
    setPage(0);
    setAppliedParams((prev) => ({ ...prev, limit: newLimit, page: 1 }));
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

  const getCategoryColor = (category: AIChatCategory) => {
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

  const selectedSession =
    messagesData?.session ??
    sessions.find((s: AIChatSession) => s.id === selectedSessionId) ??
    null;
  const messages = messagesData?.messages ?? [];

  return (
    <>
      <div style={{ padding: 24 }}>
        <h4>AI 채팅 관리</h4>
        {/* 필터 영역 */}
        <div style={{ padding: 16, marginBottom: 24 }}>
          <h6>필터 옵션</h6>
          <div
            style={{
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <TextField className="flex-1 min-w-0">
              <Label>{"시작일"}</Label>
              <Input
                type="date"
                value={startDate ? format(startDate, "yyyy-MM-dd") : ""}
                onChange={(e) =>
                  ((newValue) => setStartDate(newValue))(
                    e.target.value
                      ? new Date(e.target.value + "T00:00:00")
                      : null,
                  )
                }
              />
            </TextField>
            <TextField className="flex-1 min-w-0">
              <Label>{"종료일"}</Label>
              <Input
                type="date"
                value={endDate ? format(endDate, "yyyy-MM-dd") : ""}
                onChange={(e) =>
                  ((newValue) => setEndDate(newValue))(
                    e.target.value
                      ? new Date(e.target.value + "T00:00:00")
                      : null,
                  )
                }
              />
            </TextField>
            <div style={{ minWidth: 120 }}>
              <Select
                selectedKey={category || null}
                onSelectionChange={(key) =>
                  ((e) => setCategory(e.target.value as AIChatCategory | ""))({
                    target: { value: key },
                  } as any)
                }
                aria-label={"카테고리"}
              >
                <HeroSelectLabel>카테고리</HeroSelectLabel>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id={""} textValue={"전체"}>
                      전체
                    </ListBox.Item>
                    <ListBox.Item id={"일상"} textValue={"일상"}>
                      일상
                    </ListBox.Item>
                    <ListBox.Item id={"인간관계"} textValue={"인간관계"}>
                      인간관계
                    </ListBox.Item>
                    <ListBox.Item id={"진로/학교"} textValue={"진로/학교"}>
                      진로/학교
                    </ListBox.Item>
                    <ListBox.Item id={"연애"} textValue={"연애"}>
                      연애
                    </ListBox.Item>
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>
            <div style={{ minWidth: 120 }}>
              <Select
                selectedKey={status || null}
                onSelectionChange={(key) =>
                  ((e) =>
                    setStatus(e.target.value as AIChatSessionStatus | ""))({
                    target: { value: key },
                  } as any)
                }
                aria-label={"상태"}
              >
                <HeroSelectLabel>상태</HeroSelectLabel>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id={""} textValue={"전체"}>
                      전체
                    </ListBox.Item>
                    <ListBox.Item id={"active"} textValue={"진행 중"}>
                      진행 중
                    </ListBox.Item>
                    <ListBox.Item id={"completed"} textValue={"완료"}>
                      완료
                    </ListBox.Item>
                    <ListBox.Item id={"analyzing"} textValue={"분석 중"}>
                      분석 중
                    </ListBox.Item>
                    <ListBox.Item id={"analyzed"} textValue={"분석 완료"}>
                      분석 완료
                    </ListBox.Item>
                    <ListBox.Item id={"closed"} textValue={"종료"}>
                      종료
                    </ListBox.Item>
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>
            <div style={{ minWidth: 120 }}>
              <Select
                selectedKey={isActive === "" ? null : String(isActive)}
                onSelectionChange={(key) =>
                  setIsActive(key === "" || key === null ? "" : key === "true")
                }
                aria-label={"활성화"}
              >
                <HeroSelectLabel>활성화</HeroSelectLabel>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id={""} textValue={"전체"}>
                      전체
                    </ListBox.Item>
                    <ListBox.Item id={String(true)} textValue={"활성"}>
                      활성
                    </ListBox.Item>
                    <ListBox.Item id={String(false)} textValue={"비활성"}>
                      비활성
                    </ListBox.Item>
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>
            <TextField style={{ minWidth: 150 }}>
              <Label>{"사용자 ID"}</Label>
              <Input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
            </TextField>
            <Button
              onClick={handleSearch}
              variant={"primary"}
              isDisabled={isLoading}
            >
              {<RefreshIcon size={16} />}
              {isLoading ? "조회 중..." : "조회"}
            </Button>
            <Button onClick={resetFilters} variant={"secondary"}>
              {<RefreshIcon size={16} />}초기화
            </Button>
          </div>
        </div>
        {/* 세션 목록 테이블 */}
        <div>
          <div>
            <table className="w-full text-sm text-left">
              <thead>
                <tr>
                  <th scope="col" className="px-3 py-2 border-b border-default">
                    사용자
                  </th>
                  <th scope="col" className="px-3 py-2 border-b border-default">
                    카테고리
                  </th>
                  <th scope="col" className="px-3 py-2 border-b border-default">
                    대화 턴 수
                  </th>
                  <th scope="col" className="px-3 py-2 border-b border-default">
                    상태
                  </th>
                  <th scope="col" className="px-3 py-2 border-b border-default">
                    활성화
                  </th>
                  <th scope="col" className="px-3 py-2 border-b border-default">
                    생성 시간
                  </th>
                  <th scope="col" className="px-3 py-2 border-b border-default">
                    수정 시간
                  </th>
                  <th scope="col" className="px-3 py-2 border-b border-default">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-3 py-2 border-b border-default"
                    >
                      <Spinner aria-label="로딩 중" />
                    </td>
                  </tr>
                ) : sessions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-3 py-2 border-b border-default"
                    >
                      데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  sessions.map((session: AIChatSession) => {
                    const statusInfo = getStatusInfo(session.status);
                    return (
                      <tr key={session.id}>
                        <td className="px-3 py-2 border-b border-default">
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <img
                              src={session.user.profileImage || undefined}
                              alt="프로필"
                              className="h-9 w-9 rounded-full object-cover"
                            />
                            <div>
                              <p>{session.user.name}</p>
                              <p>{session.user.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 border-b border-default">
                          <Chip size="sm">{session.category}</Chip>
                        </td>
                        <td className="px-3 py-2 border-b border-default">
                          {session.turnCount}
                        </td>
                        <td className="px-3 py-2 border-b border-default">
                          <Chip size="sm">
                            {statusInfo.icon}
                            {statusInfo.label}
                          </Chip>
                        </td>
                        <td className="px-3 py-2 border-b border-default">
                          <Chip size="sm">
                            {session.isActive ? "활성" : "비활성"}
                          </Chip>
                        </td>
                        <td className="px-3 py-2 border-b border-default">
                          {formatDate(session.createdAt)}
                        </td>
                        <td className="px-3 py-2 border-b border-default">
                          {formatDate(session.updatedAt)}
                        </td>
                        <td className="px-3 py-2 border-b border-default">
                          <Button
                            onClick={() => handleViewMessages(session.id)}
                            variant={"secondary"}
                            isIconOnly
                            aria-label="작업"
                          >
                            <MessageIcon size={16} />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
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
                  {[10, 20, 50, 100].map((size) => (
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
        {/* 메시지 상세 조회 다이얼로그 */}
        <AIChatMessageDetail
          open={messagesDialogOpen}
          onClose={() => {
            setMessagesDialogOpen(false);
            setSelectedSessionId("");
          }}
          session={selectedSession}
          messages={messages}
          loading={messagesLoading}
        />
      </div>
    </>
  );
}

export default function AIChatManagementPageV2() {
  return <AIChatManagementPageContent />;
}
