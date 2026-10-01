"use client";
import {
  Button,
  Checkbox,
  Chip,
  Label,
  ListBox,
  Select,
  Spinner,
  Tabs,
} from "@heroui/react";

import { useMemo } from "react";

import type {
  SupportDomain,
  SupportMessage,
  SupportSenderType,
  SupportSessionSummary,
} from "@/app/types/support-chat";
import {
  DOMAIN_COLORS,
  DOMAIN_LABELS,
  LANGUAGE_FLAGS,
  SESSION_STATUS_COLORS,
  SESSION_STATUS_LABELS,
} from "@/app/types/support-chat";
import { useReadState } from "../lib/read-state";
import { useSessionMessages } from "../hooks/useSessionMessages";
import BulkResolveToolbar, { useSessionSelection } from "./BulkResolveToolbar";

interface SessionGridProps {
  activeSessions: SupportSessionSummary[];
  resolvedSessions: SupportSessionSummary[];
  activeTab: "active" | "resolved";
  onTabChange: (tab: "active" | "resolved") => void;
  domainFilter: SupportDomain | "all";
  onDomainFilterChange: (domain: SupportDomain | "all") => void;
  onOpenSession: (sessionId: string) => void;
  onSessionUpdated: () => void;
}

const SENDER_STYLE: Record<
  SupportSenderType,
  { label: string; bg: string; align: "flex-start" | "flex-end" }
> = {
  user: { label: "사용자", bg: "#e3f2fd", align: "flex-start" },
  bot: { label: "AI", bg: "#f3e5f5", align: "flex-end" },
  admin: { label: "어드민", bg: "#e8f5e9", align: "flex-end" },
};

function timeAgo(iso?: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return "";
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "방금";
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
    <div
      className="relative"
      style={{
        display: "flex",
        flexDirection: "column",
        height: 380,
        cursor: "pointer",
        overflow: "hidden",
        borderRadius: 12,
        border: "1px solid",
        borderColor: "#e4e4e7",
        backgroundColor: checked ? "#f4f4f5" : "#ffffff",
      }}
    >
      {onToggle && (
        <Checkbox
          className="absolute left-3 top-3 z-10"
          aria-label={`${session.userNickname || session.userId} 선택`}
          isSelected={checked}
          onChange={onToggle}
        >
          <Checkbox.Content>
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
          </Checkbox.Content>
        </Checkbox>
      )}
      <Button
        variant="ghost"
        className="h-full w-full flex-col items-stretch whitespace-normal p-0 text-left"
        aria-label={`${session.userNickname || session.userId} 상담 열기`}
        onPress={onOpen}
      >
        <div
          className={`h-full min-h-0 flex flex-col ${onToggle ? "pl-8" : ""}`}
        >
          <div
            style={{
              padding: 12,
              backgroundColor: "#f4f4f5",
              borderBottom: "1px solid #e4e4e7",
              borderColor: "#e4e4e7",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 4,
              }}
            >
              <p
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontWeight: unread ? 800 : 500,
                  color: "#52525b",
                }}
              >
                {LANGUAGE_FLAGS[session.language]}
                {session.userNickname || session.userId.slice(0, 8)}
              </p>
              <p style={{ whiteSpace: "nowrap" }}>
                접수 {timeAgo(session.createdAt)}
              </p>
            </div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {unread && <Chip size="sm">{"사용자 답변 미확인"}</Chip>}
              <Chip size="sm">{SESSION_STATUS_LABELS[session.status]}</Chip>
              {session.domain && (
                <Chip size="sm">{DOMAIN_LABELS[session.domain]}</Chip>
              )}
              <Chip size="sm">{`${session.messageCount}건`}</Chip>
            </div>
          </div>
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 12,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-default p-3 text-sm"
                style={{ paddingBlock: 0 }}
              >
                {error}
              </div>
            )}
            {!error && messages === undefined && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  paddingBlock: 24,
                }}
              >
                <Spinner aria-label="로딩 중" />
              </div>
            )}
            {messages?.map((message) => {
              const style = SENDER_STYLE[message.senderType];
              return (
                <div
                  key={message.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: style.align,
                  }}
                >
                  <p>{style.label}</p>
                  <div
                    style={{
                      maxWidth: "90%",
                      paddingInline: 8,
                      paddingBlock: 4,
                      borderRadius: 1.5,
                      backgroundColor: style.bg,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    <p>{message.content}</p>
                  </div>
                </div>
              );
            })}
            {messages?.length === 0 && <p>메시지가 없습니다.</p>}
          </div>
        </div>
      </Button>
    </div>
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
    const base = activeTab === "active" ? activeSessions : resolvedSessions;
    return base
      .filter((s) => domainFilter === "all" || s.domain === domainFilter)
      .slice()
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() ||
          a.sessionId.localeCompare(b.sessionId),
      );
  }, [activeSessions, resolvedSessions, activeTab, domainFilter]);

  const { messagesBySession, errorsBySession } = useSessionMessages(sessions);
  const scope = `${activeTab}:${domainFilter}`;
  const { selected, toggle, setSelectedIds } = useSessionSelection(
    sessions,
    scope,
  );
  const unreadCount = sessions.filter((s) =>
    isUnread(s.sessionId, messagesBySession[s.sessionId] ?? []),
  ).length;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 8,
        }}
      >
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) =>
            ((_, value) => onTabChange(value))(null, String(key) as any)
          }
          style={{ minHeight: 40 }}
        >
          <Tabs.ListContainer>
            <Tabs.List>
              <Tabs.Tab id={"active"}>
                {`진행 중 (${activeSessions.length})`}
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id={"resolved"}>
                {`완료 (${resolvedSessions.length})`}
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>
        <Select
          selectedKey={domainFilter || null}
          onSelectionChange={(key) =>
            ((event) =>
              onDomainFilterChange(
                event.target.value as SupportDomain | "all",
              ))({ target: { value: key } } as any)
          }
          aria-label={"필터"}
        >
          <Label className="sr-only">상담 도메인</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item id={"all"}>전체 도메인</ListBox.Item>
              {(Object.keys(DOMAIN_LABELS) as SupportDomain[]).map((domain) => (
                <ListBox.Item key={domain} id={domain}>
                  {DOMAIN_LABELS[domain]}
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
        <div style={{ flex: 1 }}></div>
        <p style={{ fontWeight: 700, color: "#52525b" }}>
          사용자 답변 미확인 {unreadCount}건
        </p>
      </div>
      <p style={{ marginBottom: 8 }}>
        접수순 · 먼저 들어온 상담부터 표시합니다.
      </p>
      {activeTab === "active" && (
        <BulkResolveToolbar
          selected={selected}
          setSelectedIds={setSelectedIds}
          onSessionUpdated={onSessionUpdated}
          scope={scope}
        />
      )}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "grid",
          gap: 16,
          gridTemplateColumns:
            "repeat(auto-fill, minmax(min(100%, 320px), 1fr))",
          alignContent: "start",
          paddingBottom: 16,
        }}
      >
        {sessions.map((session) => (
          <SessionCard
            key={session.sessionId}
            session={session}
            unread={isUnread(
              session.sessionId,
              messagesBySession[session.sessionId] ?? [],
            )}
            messages={messagesBySession[session.sessionId]}
            error={errorsBySession[session.sessionId]}
            checked={selected.some(
              (item) => item.sessionId === session.sessionId,
            )}
            onToggle={
              activeTab === "active"
                ? () => toggle(session.sessionId)
                : undefined
            }
            onOpen={() => onOpenSession(session.sessionId)}
          />
        ))}
        {sessions.length === 0 && (
          <p style={{ padding: 16 }}>표시할 문의가 없습니다.</p>
        )}
      </div>
    </div>
  );
}
