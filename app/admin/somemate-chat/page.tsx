"use client";
import { Button as HeroActionButton } from "@heroui/react";
import {
  Button,
  Chip,
  FieldError,
  Input,
  Label,
  Spinner,
  TextField,
  Tooltip,
} from "@heroui/react";
import {
  ArrowLeft as ArrowBackIcon,
  X as ClearIcon,
  RefreshCw as RefreshIcon,
  Search as SearchIcon,
} from "lucide-react";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";

import { somemateChat } from "@/app/services/admin/somemate-chat";
import type {
  SomemateMessageItem,
  SomemateRelationshipItem,
} from "@/app/types/somemate-chat";

const PAGE_SIZE = 20;

function formatDateTime(value: string | null | undefined) {
  if (!value) return "기록 없음";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function relationshipSubtitle(item: SomemateRelationshipItem) {
  return (
    [
      item.user.age ? `${item.user.age}세` : null,
      item.user.gender,
      item.user.rank ? `${item.user.rank}등급` : null,
    ]
      .filter(Boolean)
      .join(" · ") || "유저 프로필 정보 없음"
  );
}

function stageLabel(stage: string) {
  const labels: Record<string, string> = {
    stranger: "낯선 사이",
    acquaintance: "알아가는 중",
    crush: "호감",
    dating: "연애",
    committed: "깊은 관계",
  };
  return labels[stage] ?? stage;
}

function RoleLabel({ role }: { role: string }) {
  if (role === "assistant") return <Chip size="sm">{"썸메이트"}</Chip>;
  if (role === "user") return <Chip size="sm">{"유저"}</Chip>;
  return <Chip size="sm">{role}</Chip>;
}

function RelationshipCard({
  item,
  selected,
  onSelect,
}: {
  item: SomemateRelationshipItem;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <HeroActionButton
      variant="ghost"
      className="h-auto w-full justify-start whitespace-normal text-left"
      style={{
        width: "100%",
        padding: 12,
        textAlign: "left",
        border: "1px solid #e4e4e7",
        borderColor: "#e4e4e7",
        borderRadius: 1,
        backgroundColor: selected ? "#f4f4f5" : "#ffffff",
        cursor: "pointer",
        transition: "border-color 120ms ease, background-color 120ms ease",
      }}
      onClick={onSelect}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "56px 1fr",
          gap: 10,
          minWidth: 0,
        }}
      >
        <img
          src={item.companion.representativeImageUrl ?? undefined}
          alt={item.companion.name}
          className="h-9 w-9 rounded-full object-cover"
        />
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              minWidth: 0,
            }}
          >
            <p style={{ fontWeight: 900 }}>{item.companion.name}</p>
            <Chip size="sm">{`${item.companion.age}세`}</Chip>
            <Chip size="sm">{stageLabel(item.stage)}</Chip>
          </div>
          <p style={{ display: "block", marginTop: 2 }}>
            {item.user.name}· {relationshipSubtitle(item)}
          </p>
          <p
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              lineHeight: 1.35,
              marginTop: 8,
              minHeight: 38,
            }}
          >
            {item.latestMessage || "아직 대화 메시지가 없습니다."}
          </p>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 10,
          gap: 8,
        }}
      >
        <p>메시지 {item.totalMessages.toLocaleString()}개</p>
        <p>{formatDateTime(item.lastInteractionAt ?? item.unlockedAt)}</p>
      </div>
    </HeroActionButton>
  );
}

function MessageBubble({ message }: { message: SomemateMessageItem }) {
  const isAssistant = message.role === "assistant";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isAssistant ? "flex-start" : "flex-end",
      }}
    >
      <div
        style={{
          maxWidth: "74%",
          paddingInline: 12,
          paddingBlock: 8.8,
          borderRadius: isAssistant
            ? "12px 12px 12px 3px"
            : "12px 12px 3px 12px",
          backgroundColor: "#f4f4f5",
          color: "#52525b",
          border: "1px solid #e4e4e7",
          borderColor: "#e4e4e7",
          boxShadow: "0 1px 2px rgba(15, 23, 42, 0.08)",
          overflowWrap: "anywhere",
        }}
      >
        <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.55 }}>
          {message.content}
        </p>
        <p
          style={{
            display: "block",
            marginTop: 6,
            opacity: 0.72,
            textAlign: isAssistant ? "left" : "right",
          }}
        >
          {formatDateTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}

function ChatPanel({
  selected,
  messages,
  loading,
  onBack,
}: {
  selected: SomemateRelationshipItem | null;
  messages: SomemateMessageItem[];
  loading: boolean;
  onBack?: () => void;
}) {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!loading && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ block: "end" });
    }
  }, [loading, messages.length, selected?.id]);

  if (!selected) {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p>썸메이트 프로필을 선택하세요</p>
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
      }}
    >
      <div
        style={{
          padding: 16,
          borderBottom: "1px solid #e4e4e7",
          borderColor: "#e4e4e7",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            minWidth: 0,
          }}
        >
          {onBack && (
            <Button
              onClick={onBack}
              aria-label="목록으로 돌아가기"
              variant={"secondary"}
              isIconOnly
            >
              <ArrowBackIcon size={16} />
            </Button>
          )}
          <img
            src={selected.companion.representativeImageUrl ?? undefined}
            alt={selected.companion.name}
            className="h-9 w-9 rounded-full object-cover"
          />
          <div style={{ minWidth: 0, flex: 1 }}>
            <h6 style={{ fontWeight: 900, lineHeight: 1.2 }}>
              {selected.companion.name}
            </h6>
            <p>
              {selected.user.name}·{" "}
              {selected.user.phoneNumber ?? "전화번호 없음"}
            </p>
          </div>
          <RoleLabel role={selected.slotStatus} />
        </div>
        <div className="flex flex-row gap-3 min-w-0">
          <Chip size="sm">{stageLabel(selected.stage)}</Chip>
          <Chip size="sm">{`구슬 ${selected.totalGemsSpent.toLocaleString()}개`}</Chip>
          {selected.companion.personaTags.slice(0, 4).map((tag) => (
            <Chip key={tag} size="sm">
              {tag}
            </Chip>
          ))}
        </div>
      </div>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          backgroundColor: "#f4f4f5",
        }}
      >
        {loading ? (
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Spinner aria-label="로딩 중" />
          </div>
        ) : messages.length === 0 ? (
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <p>표시할 대화가 없습니다.</p>
          </div>
        ) : (
          <div style={{ width: "100%", maxWidth: 960, marginInline: "auto" }}>
            <div className="flex flex-col gap-3 min-w-0">
              {messages.map((message) => (
                <div key={message.id}>
                  <div
                    style={{
                      marginBottom: 4,
                      display: "flex",
                      justifyContent:
                        message.role === "assistant"
                          ? "flex-start"
                          : "flex-end",
                    }}
                  >
                    <RoleLabel role={message.role} />
                  </div>
                  <MessageBubble message={message} />
                </div>
              ))}
              <div ref={messagesEndRef}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SomemateChatPage() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 899px)");
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const searchParams = useSearchParams();
  const linkedRelationshipId =
    searchParams.get("relationshipId")?.trim() || null;
  const [searchText, setSearchText] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    linkedRelationshipId,
  );
  const [mobileMode, setMobileMode] = useState<"list" | "chat">("list");
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const deepLinkRelationshipId = appliedSearch ? null : linkedRelationshipId;

  const relationshipsQuery = useInfiniteQuery({
    queryKey: [
      "admin",
      "somemate-chat",
      "relationships",
      appliedSearch,
      deepLinkRelationshipId,
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      somemateChat.listRelationships({
        q: appliedSearch || undefined,
        relationshipId: deepLinkRelationshipId || undefined,
        page: Number(pageParam),
        limit: PAGE_SIZE,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasMore ? lastPage.meta.page + 1 : undefined,
    placeholderData: keepPreviousData,
  });

  const relationships = useMemo(
    () => relationshipsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [relationshipsQuery.data],
  );
  const total = relationshipsQuery.data?.pages[0]?.meta.total ?? 0;
  const selected = relationships.find((item) => item.id === selectedId) ?? null;

  const messagesQuery = useQuery({
    queryKey: ["admin", "somemate-chat", "messages", selectedId],
    queryFn: () => somemateChat.getMessages(selectedId!, { limit: 150 }),
    enabled: Boolean(selectedId),
  });

  useEffect(() => {
    if (linkedRelationshipId) {
      setSelectedId(linkedRelationshipId);
      if (isMobile) setMobileMode("chat");
    }
  }, [isMobile, linkedRelationshipId]);

  useEffect(() => {
    if (!selectedId && relationships.length > 0 && !isMobile) {
      setSelectedId(relationships[0].id);
    }
  }, [isMobile, relationships, selectedId]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (
      !node ||
      !relationshipsQuery.hasNextPage ||
      relationshipsQuery.isFetchingNextPage
    )
      return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        void relationshipsQuery.fetchNextPage();
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [relationshipsQuery]);

  const applySearch = () => {
    setSelectedId(null);
    setAppliedSearch(searchText.trim());
    setMobileMode("list");
  };

  const clearSearch = () => {
    setSearchText("");
    setAppliedSearch("");
    setSelectedId(null);
    setMobileMode("list");
  };

  const selectRelationship = (id: string) => {
    setSelectedId(id);
    if (isMobile) setMobileMode("chat");
  };

  const listPane = (
    <div
      style={{
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
      }}
    >
      <div
        style={{
          padding: 16,
          borderBottom: "1px solid #e4e4e7",
          borderColor: "#e4e4e7",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <div>
            <h5 style={{ fontWeight: 900 }}>썸메이트 대화</h5>
            <p>총 {total.toLocaleString()}개 관계</p>
          </div>
          <Tooltip>
            <Tooltip.Trigger>
              <Button
                onClick={() => relationshipsQuery.refetch()}
                aria-label="새로고침"
                variant={"secondary"}
                isIconOnly
              >
                <RefreshIcon size={16} />
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content>{"새로고침"}</Tooltip.Content>
          </Tooltip>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <TextField aria-label={"유저명, 전화번호, 썸메이트 이름"}>
            <Input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") applySearch();
              }}
              placeholder="유저명, 전화번호, 썸메이트 이름"
              aria-label={"유저명, 전화번호, 썸메이트 이름"}
            />
          </TextField>
          <Button
            onClick={applySearch}
            style={{ minWidth: 76 }}
            variant={"primary"}
          >
            검색
          </Button>
        </div>
        {appliedSearch && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 10,
              minWidth: 0,
            }}
          >
            <Chip size="sm">
              {`검색: ${appliedSearch}`}
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                aria-label="검색 필터 제거"
                onPress={clearSearch}
              >
                <ClearIcon size={16} />
              </Button>
            </Chip>
          </div>
        )}
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: 12 }}>
        {relationshipsQuery.isLoading ? (
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Spinner aria-label="로딩 중" />
          </div>
        ) : relationshipsQuery.isError ? (
          <div
            role="alert"
            className="rounded-lg border border-default p-3 text-sm"
          >
            썸메이트 대화 목록을 불러오지 못했습니다.
          </div>
        ) : relationships.length === 0 ? (
          <div
            role="alert"
            className="rounded-lg border border-default p-3 text-sm"
          >
            조건에 맞는 썸메이트 대화가 없습니다.
          </div>
        ) : (
          <div className="flex flex-col gap-3 min-w-0">
            {relationships.map((item) => (
              <RelationshipCard
                key={item.id}
                item={item}
                selected={item.id === selectedId}
                onSelect={() => selectRelationship(item.id)}
              />
            ))}
            <div
              ref={sentinelRef}
              style={{
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {relationshipsQuery.isFetchingNextPage ? (
                <Spinner aria-label="로딩 중" />
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const chatPane = (
    <ChatPanel
      selected={selected}
      messages={messagesQuery.data?.items ?? []}
      loading={messagesQuery.isLoading}
      onBack={isMobile ? () => setMobileMode("list") : undefined}
    />
  );

  return (
    <div
      className="p-0 md:p-4"
      style={{
        height: "calc(100vh - 72px)",
        minHeight: 0,
        backgroundColor: "#f4f4f5",
      }}
    >
      <div
        style={{
          height: "100%",
          borderColor: "#e4e4e7",
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "420px minmax(0, 1fr)",
          minHeight: 0,
        }}
      >
        {(!isMobile || mobileMode === "list") && listPane}
        {(!isMobile || mobileMode === "chat") && (
          <div
            style={{
              minWidth: 0,
              minHeight: 0,
              borderLeft: isMobile ? 0 : "1px solid #e4e4e7",
              borderColor: "#e4e4e7",
            }}
          >
            {chatPane}
          </div>
        )}
      </div>
    </div>
  );
}
