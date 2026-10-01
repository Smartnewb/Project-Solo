"use client";
import { Button, Checkbox } from "@heroui/react";

import { ImageOff } from "lucide-react";
import type { GhostListItem } from "@/app/types/ghost-injection";
import { Badge } from "@/shared/ui/badge";

import { Card, CardContent } from "@/shared/ui/card";
import { RankBadge } from "../_shared/rank-badge";
import { GhostStatusBadge } from "./ghost-status-badge";

interface GhostCardViewProps {
  items: GhostListItem[];
  isLoading: boolean;
  isFetchingNextPage?: boolean;
  onCardClick: (ghost: GhostListItem) => void;
  onToggleStatus: (ghost: GhostListItem) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
}

export function GhostCardView({
  items,
  isLoading,
  isFetchingNextPage = false,
  onCardClick,
  onToggleStatus,
  selectedIds,
  onToggleSelect,
}: GhostCardViewProps) {
  if (isLoading) {
    return <GhostCardSkeletonGrid count={12} />;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-md border bg-white py-12 text-center text-sm text-slate-500">
        가상 프로필이 없습니다.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {items.map((item) => {
        const isSelected = selectedIds.has(item.ghostAccountId);
        return (
          <Card
            key={item.ghostAccountId}
            className={`cursor-pointer overflow-hidden transition-shadow hover:shadow-md ${isSelected ? "ring-2 ring-slate-900" : ""}`}
          >
            <div className="relative aspect-[4/5] bg-slate-100">
              <Button
                variant="ghost"
                className="absolute inset-0 h-full w-full block p-0"
                aria-label={`${item.name} 사진 상세 보기`}
                onPress={() => onCardClick(item)}
              >
                {item.primaryPhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.primaryPhotoUrl}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-400">
                    <ImageOff className="h-7 w-7" />
                  </div>
                )}
                <GhostStatusBadge
                  status={item.status}
                  isExhausted={item.isExhausted}
                  className="absolute right-1.5 top-1.5 text-[10px]"
                />
                {item.photoCount > 1 ? (
                  <Badge
                    variant="secondary"
                    className="absolute bottom-1.5 right-1.5 px-1.5 py-0 text-[10px]"
                  >
                    {item.photoCount} 사진
                  </Badge>
                ) : null}
              </Button>
              <Checkbox
                className="absolute left-1.5 top-1.5 z-10"
                aria-label={`${item.name} 선택`}
                isSelected={isSelected}
                isIndeterminate={undefined}
                onChange={() => onToggleSelect(item.ghostAccountId)}
              >
                <Checkbox.Content>
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                </Checkbox.Content>
              </Checkbox>
            </div>
            <CardContent className="space-y-1.5 p-2">
              <Button
                variant="ghost"
                className="h-auto w-full block space-y-1.5 whitespace-normal p-0 text-left"
                aria-label={`${item.name} 프로필 상세 보기`}
                onPress={() => onCardClick(item)}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <div className="truncate text-sm font-semibold text-slate-900">
                    {item.name}
                  </div>
                  <div className="text-xs text-slate-500">만 {item.age}세</div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span>{item.mbti ?? "—"}</span>
                  <RankBadge rank={item.rank} />
                </div>
                <div className="truncate text-xs text-slate-600">
                  {item.university?.name ?? "대학 없음"}
                </div>
                <div className="truncate text-xs text-slate-500">
                  {item.department?.name ?? "학과 없음"}
                </div>
              </Button>
              <Button
                className="h-7 w-full px-2 text-[11px]"
                onPress={() => onToggleStatus(item)}
                variant="secondary"
                size={"sm"}
              >
                {item.status === "ACTIVE" ? "비활성화" : "활성화"}
              </Button>
            </CardContent>
          </Card>
        );
      })}
      {isFetchingNextPage ? (
        <GhostCardSkeletonGrid count={6} asFragment />
      ) : null}
    </div>
  );
}

function GhostCardSkeletonGrid({
  count,
  asFragment = false,
}: {
  count: number;
  asFragment?: boolean;
}) {
  const cards = Array.from({ length: count }, (_, idx) => (
    <Card key={idx} className="overflow-hidden">
      <div className="relative aspect-[4/5] animate-pulse bg-slate-100">
        <div className="absolute left-1.5 top-1.5 h-5 w-5 rounded bg-white/80" />
        <div className="absolute right-1.5 top-1.5 h-4 w-12 rounded-full bg-white/80" />
      </div>
      <CardContent className="space-y-1.5 p-2">
        <div className="flex items-center justify-between gap-2">
          <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
          <div className="h-3 w-10 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="h-3 w-16 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-full animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-3/4 animate-pulse rounded bg-slate-200" />
        <div className="h-7 w-full animate-pulse rounded-md bg-slate-200" />
      </CardContent>
    </Card>
  ));

  if (asFragment) return <>{cards}</>;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {cards}
    </div>
  );
}
