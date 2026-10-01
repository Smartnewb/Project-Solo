"use client";
import { Button as HeroActionButton } from "@heroui/react";
import {
  Select,
  ListBox,
  Button,
  Chip,
  FieldError,
  Input,
  Label,
  TextField,
} from "@heroui/react";
import {
  Circle as DotIcon,
  Inbox as InboxIcon,
  Sparkles as ReviewInboxIcon,
  Search as SearchIcon,
} from "lucide-react";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";

import type {
  SupportSessionSummary,
  SupportDomain,
} from "@/app/types/support-chat";
import { DOMAIN_LABELS, DOMAIN_COLORS } from "@/app/types/support-chat";
import { useAdminSession } from "@/shared/contexts/admin-session-context";

interface SessionQueueProps {
  activeSessions: SupportSessionSummary[];
  resolvedSessions: SupportSessionSummary[];
  selectedSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  activeTab: "active" | "resolved";
  onTabChange: (tab: "active" | "resolved") => void;
  domainFilter: SupportDomain | "all";
  onDomainFilterChange: (domain: SupportDomain | "all") => void;
  newSessionIds: Set<string>;
  onClearNewSessionIds: () => void;
  unreadMap: Record<string, number>;
}

const statusDotColor: Record<string, string> = {
  waiting_admin: "#f44336",
  admin_handling: "#2196f3",
  resolved: "#4caf50",
  admin_resolved: "#4caf50",
  bot_handling: "#9e9e9e",
};

const pulseKeyframes = {
  "@keyframes dotPulse": {
    "0%": { opacity: 1 },
    "50%": { opacity: 0.4 },
    "100%": { opacity: 1 },
  },
};

const highlightKeyframes = {
  "@keyframes fadeHighlight": {
    "0%": { backgroundColor: "#fff8e1" },
    "100%": { backgroundColor: "transparent" },
  },
};

const slaBlinkKeyframes = {
  "@keyframes slaBlink": {
    "0%": { opacity: 1 },
    "50%": { opacity: 0.35 },
    "100%": { opacity: 1 },
  },
};

/** SLA 임계(분) */
/** SLA 임계(분) */
/** SLA 임계(분) */
/** SLA 임계(분) */
const SLA_WARN_MINUTES = 10;
const SLA_CRITICAL_MINUTES = 30;

function computeWaitingMinutes(session: SupportSessionSummary): number | null {
  if (session.status !== "waiting_admin") return null;
  const waitingStartedAt = session.waitingSince ?? session.createdAt;
  return Math.floor(
    (Date.now() - new Date(waitingStartedAt).getTime()) / 60000,
  );
}

function SessionCard({
  session,
  selected,
  isNew,
  unreadCount,
  assignedToMe,
  onClick,
}: {
  session: SupportSessionSummary;
  selected: boolean;
  isNew: boolean;
  unreadCount: number;
  assignedToMe: boolean;
  onClick: () => void;
}) {
  const [highlight, setHighlight] = useState(isNew);

  useEffect(() => {
    if (isNew) {
      setHighlight(true);
      const timer = setTimeout(() => setHighlight(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isNew]);

  const waitingMinutes = computeWaitingMinutes(session);
  const slaLevel: "normal" | "warn" | "critical" =
    waitingMinutes === null
      ? "normal"
      : waitingMinutes >= SLA_CRITICAL_MINUTES
        ? "critical"
        : waitingMinutes >= SLA_WARN_MINUTES
          ? "warn"
          : "normal";

  return (
    <HeroActionButton
      variant="ghost"
      className="h-auto w-full justify-start whitespace-normal text-left"
      style={{
        padding: 12,
        display: "block",
        cursor: "pointer",
        border: selected ? "2px solid" : "1px solid",
        borderColor: "#e4e4e7",
        borderRadius: 12,
        transition: "all 0.15s ease",
      }}
      onClick={onClick}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 4,
        }}
      >
        <DotIcon size={16} />
        <p style={{ fontWeight: 600, flex: 1 }}>
          {session.userNickname || session.userId.substring(0, 8)}
        </p>
        {assignedToMe && <Chip size="sm">{"내 담당"}</Chip>}
        {session.assignedAdminId && !assignedToMe && (
          <Chip size="sm">{"배정됨"}</Chip>
        )}
        {unreadCount > 0 && (
          <span className="inline-flex rounded-full bg-danger px-1.5 text-xs text-white">
            {unreadCount}
          </span>
        )}
        {waitingMinutes !== null && (
          <p
            style={{
              fontWeight: slaLevel === "normal" ? 600 : 700,
              color:
                slaLevel === "normal"
                  ? "#dc2626"
                  : slaLevel === "warn"
                    ? "#e65100"
                    : "#b71c1c",
            }}
          >
            {waitingMinutes < 1 ? "방금" : `${waitingMinutes}분`}
            {slaLevel === "critical" ? " ⚠" : ""}
          </p>
        )}
      </div>
      <p style={{ marginBottom: 4, paddingLeft: 2.5 }}>
        {session.lastMessage || "메시지 없음"}
      </p>
      <div style={{ display: "flex", gap: 4, paddingLeft: 2.5 }}>
        {session.domain && (
          <Chip size="sm">{DOMAIN_LABELS[session.domain]}</Chip>
        )}
      </div>
    </HeroActionButton>
  );
}

export default function SessionQueue({
  activeSessions,
  resolvedSessions,
  selectedSessionId,
  onSelectSession,
  activeTab,
  onTabChange,
  domainFilter,
  onDomainFilterChange,
  newSessionIds,
  onClearNewSessionIds,
  unreadMap,
}: SessionQueueProps) {
  const [search, setSearch] = useState("");
  const [myOnly, setMyOnly] = useState(false);
  const { session: adminSession } = useAdminSession();
  const myAdminId = adminSession?.user.id;

  const sessions = activeTab === "active" ? activeSessions : resolvedSessions;

  const filtered = useMemo(() => {
    const byAssignee =
      myOnly && myAdminId
        ? sessions.filter((s) => s.assignedAdminId === myAdminId)
        : sessions;

    const byDomain =
      domainFilter === "all"
        ? byAssignee
        : byAssignee.filter((s) => s.domain === domainFilter);

    const query = search.trim().toLowerCase();
    const bySearch = query
      ? byDomain.filter(
          (s) =>
            (s.userNickname?.toLowerCase().includes(query) ?? false) ||
            s.userId.toLowerCase().includes(query) ||
            (s.lastMessage?.toLowerCase().includes(query) ?? false),
        )
      : byDomain;

    if (activeTab !== "active") return bySearch;

    // 활성 탭: 대기(가장 오래 기다린 순) → AI 응대 → 어드민 응대
    const statusRank: Record<string, number> = {
      waiting_admin: 0,
      bot_handling: 1,
      admin_handling: 2,
    };
    const waitingStart = (s: SupportSessionSummary) =>
      new Date(s.waitingSince ?? s.createdAt).getTime();

    return [...bySearch].sort((a, b) => {
      const rankDiff =
        (statusRank[a.status] ?? 3) - (statusRank[b.status] ?? 3);
      if (rankDiff !== 0) return rankDiff;
      // 같은 상태면 오래된(작은 timestamp) 순 우선
      return waitingStart(a) - waitingStart(b);
    });
  }, [sessions, domainFilter, search, activeTab, myOnly, myAdminId]);

  const newCount = newSessionIds.size;
  const hasOtherTabItems =
    activeTab === "active"
      ? resolvedSessions.length > 0
      : activeSessions.length > 0;
  const emptyTitle =
    activeTab === "active"
      ? "대기/응대 중인 세션이 없습니다."
      : "해결된 세션이 없습니다.";
  const emptyDescription =
    domainFilter === "all"
      ? activeTab === "active"
        ? "지금 바로 응대할 고객지원 세션은 없습니다. 완료된 상담이나 검토 인박스에서 남은 처리 건을 확인할 수 있습니다."
        : "해결 완료로 분류된 상담 세션이 없습니다."
      : `${DOMAIN_LABELS[domainFilter]} 필터에 해당하는 세션이 없습니다.`;

  return (
    <div
      style={{
        width: 380,
        minWidth: 380,
        height: "calc(100vh - 200px)",
        display: "flex",
        flexDirection: "column",
        borderRight: 1,
        borderColor: "#e4e4e7",
      }}
    >
      {/* Tab toggle + filter */}
      <div
        style={{
          padding: 12,
          borderBottom: "1px solid #e4e4e7",
          borderColor: "#e4e4e7",
        }}
      >
        <TextField
          style={{ marginBottom: 8 }}
          aria-label={"닉네임 · 유저ID · 메시지 검색"}
        >
          <Input
            placeholder="닉네임 · 유저ID · 메시지 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label={"닉네임 · 유저ID · 메시지 검색"}
          />
        </TextField>
        <div className="flex gap-1">
          <Button onClick={() => onTabChange("active")} variant={"secondary"}>
            활성
          </Button>
          <Button onClick={() => onTabChange("resolved")} variant={"secondary"}>
            해결
          </Button>
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onDomainFilterChange("all")}
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
              onClick={() => onDomainFilterChange(domain)}
            >
              {DOMAIN_LABELS[domain]}
            </Button>
          ))}
        </div>
        {myAdminId && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setMyOnly((v) => !v)}
          >
            {"내 문의만"}
          </Button>
        )}
      </div>
      {/* New session alert */}
      {newCount > 0 && activeTab === "active" && (
        <div
          role="alert"
          className="rounded-lg border border-default p-3 text-sm"
          style={{ marginInline: 12, marginTop: 8, borderRadius: 12 }}
        >
          새 문의 {newCount}건 도착
          <Button
            variant="secondary"
            size="sm"
            aria-label="알림 닫기"
            onClick={onClearNewSessionIds}
          >
            닫기
          </Button>
        </div>
      )}
      {/* Session list */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 12,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {filtered.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              color: "#52525b",
              textAlign: "center",
              paddingInline: 16,
              gap: 8,
            }}
          >
            <InboxIcon size={16} />
            <p style={{ fontWeight: 700, color: "#52525b" }}>{emptyTitle}</p>
            <p style={{ lineHeight: 1.5 }}>{emptyDescription}</p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                width: "100%",
                marginTop: 8,
              }}
            >
              {domainFilter !== "all" ? (
                <Button
                  onClick={() => onDomainFilterChange("all")}
                  variant={"secondary"}
                >
                  전체 문의 보기
                </Button>
              ) : null}
              {hasOtherTabItems ? (
                <Button
                  onClick={() =>
                    onTabChange(activeTab === "active" ? "resolved" : "active")
                  }
                  variant={"secondary"}
                >
                  {activeTab === "active" ? "해결 세션 보기" : "활성 세션 보기"}
                </Button>
              ) : null}
              {activeTab === "active" ? (
                <a
                  href="/admin/review-inbox"
                  className="button button--primary"
                >
                  {<ReviewInboxIcon size={16} />}검토 인박스 보기
                </a>
              ) : null}
            </div>
          </div>
        ) : (
          filtered.map((session) => (
            <SessionCard
              key={session.sessionId}
              session={session}
              selected={selectedSessionId === session.sessionId}
              isNew={newSessionIds.has(session.sessionId)}
              unreadCount={unreadMap[session.sessionId] || 0}
              assignedToMe={
                !!myAdminId && session.assignedAdminId === myAdminId
              }
              onClick={() => onSelectSession(session.sessionId)}
            />
          ))
        )}
      </div>
    </div>
  );
}
