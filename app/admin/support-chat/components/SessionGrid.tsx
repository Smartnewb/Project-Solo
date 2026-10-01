"use client";
import { Label as HeroSelectLabel } from "@heroui/react";

import { Button as HeroActionButton } from "@heroui/react";
import { Chip, Label, ListBox, Select, Spinner, Tabs } from "@heroui/react";

import { useCallback, useEffect, useMemo, useState } from "react";

import supportChatService from "@/app/services/support-chat";
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

interface SessionGridProps {
  activeSessions: SupportSessionSummary[];
  resolvedSessions: SupportSessionSummary[];
  activeTab: "active" | "resolved";
  onTabChange: (tab: "active" | "resolved") => void;
  domainFilter: SupportDomain | "all";
  onDomainFilterChange: (domain: SupportDomain | "all") => void;
  onOpenSession: (sessionId: string) => void;
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
}: {
  session: SupportSessionSummary;
  unread: boolean;
  onOpen: () => void;
}) {
  const [messages, setMessages] = useState<SupportMessage[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setError("");
    supportChatService
      .getSessionDetail(session.sessionId)
      .then((detail) => {
        if (!cancelled) setMessages(detail.messages);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "대화를 불러오지 못했습니다.",
          );
      });
    return () => {
      cancelled = true;
    };
  }, [session.sessionId, session.messageCount]);

  return (
    <HeroActionButton
      variant="ghost"
      className="h-auto w-full justify-start whitespace-normal text-left"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        height: 380,
        cursor: "pointer",
        overflow: "hidden",
        borderRadius: 12,
        border: unread ? "3px solid" : "1px solid",
        borderColor: "#e4e4e7",
        boxShadow: unread ? "0 0 0 3px rgba(211,47,47,0.12)" : "none",
        transition: "border-color 120ms, box-shadow 120ms",
      }}
      onClick={onOpen}
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
          <p style={{ fontWeight: unread ? 800 : 500, color: "#52525b" }}>
            {LANGUAGE_FLAGS[session.language]}
            {session.userNickname || session.userId.slice(0, 8)}
          </p>
          {unread && <Chip size="sm">{"미확인"}</Chip>}
          <div style={{ flex: 1 }}></div>
          <p>{timeAgo(session.waitingSince || session.createdAt)}</p>
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
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
        {!error && messages === null && (
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
    </HeroActionButton>
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
    const base = activeTab === "active" ? activeSessions : resolvedSessions;
    return base
      .filter((s) => domainFilter === "all" || s.domain === domainFilter)
      .slice()
      .sort(
        (a, b) =>
          new Date(b.waitingSince || b.createdAt).getTime() -
          new Date(a.waitingSince || a.createdAt).getTime(),
      );
  }, [activeSessions, resolvedSessions, activeTab, domainFilter]);

  const unreadCount = sessions.filter((s) =>
    isUnread(s.sessionId, s.messageCount),
  ).length;

  const handleOpen = useCallback(
    (session: SupportSessionSummary) => {
      markRead(session.sessionId, session.messageCount);
      onOpenSession(session.sessionId);
    },
    [markRead, onOpenSession],
  );

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
          <HeroSelectLabel className="sr-only">상담 도메인</HeroSelectLabel>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item id={"all"} textValue={"전체 도메인"}>
                전체 도메인
              </ListBox.Item>
              {(Object.keys(DOMAIN_LABELS) as SupportDomain[]).map((domain) => (
                <ListBox.Item
                  key={domain}
                  id={domain}
                  textValue={String(DOMAIN_LABELS[domain])}
                >
                  {DOMAIN_LABELS[domain]}
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
        <div style={{ flex: 1 }}></div>
        <p style={{ fontWeight: 700, color: "#52525b" }}>
          미확인 {unreadCount}건
        </p>
      </div>
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          alignContent: "start",
          paddingBottom: 16,
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
          <p style={{ padding: 16 }}>표시할 문의가 없습니다.</p>
        )}
      </div>
    </div>
  );
}
