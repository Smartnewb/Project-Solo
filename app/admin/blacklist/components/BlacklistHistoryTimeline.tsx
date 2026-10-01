"use client";
import { Alert, Button, Chip, Separator, Spinner } from "@heroui/react";

import React from "react";
import { useQuery } from "@tanstack/react-query";

import { RotateCcw, Clock } from "lucide-react";
import { blacklist, type BlacklistHistoryEntry } from "@/app/services/admin";
import { getAdminErrorMessage } from "@/shared/lib/http/admin-fetch";
import { formatDateTimeWithoutTimezoneConversion } from "@/app/utils/formatters";
import { AdminNameLabel } from "./AdminNameLabel";

interface Props {
  userId: string;
  onRelease?: (entry: BlacklistHistoryEntry) => void;
}

function durationDays(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

export function BlacklistHistoryTimeline({ userId, onRelease }: Props) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["blacklist-history", userId],
    queryFn: () => blacklist.getHistory(userId),
    enabled: !!userId,
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div>
        <Spinner aria-label="불러오는 중" size="sm" />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert status="danger" role="alert">
        <Alert.Content>
          {getAdminErrorMessage(error, "이력 조회 실패")}
        </Alert.Content>
      </Alert>
    );
  }

  const history = data?.data?.history ?? [];
  const total = history.length;
  const activeCount = history.filter((h) => h.releasedAt === null).length;

  if (total === 0) {
    return (
      <div>
        <Clock size={28} style={{ display: "inline-block" }} />
        <div className={"text-sm text-neutral-700"}>블랙리스트 이력 없음</div>
      </div>
    );
  }

  return (
    <div>
      <div>
        <div className={"text-sm text-neutral-700"}>
          전체 {total}건 · 활성 {activeCount}건
        </div>
      </div>
      <div>
        {history.map((entry) => {
          const isActive = entry.releasedAt === null;
          const barColor = isActive ? "#dc2626" : "#9ca3af";
          const duration = entry.releasedAt
            ? durationDays(entry.blacklistedAt, entry.releasedAt)
            : null;

          return (
            <div
              key={entry.id}
              style={{
                display: "flex",
                gap: 6,
                padding: 8,
                borderRadius: 4,
                backgroundColor: "#f9fafb",
                borderLeft: `4px solid ${barColor}`,
              }}
            >
              <div>
                <div>
                  <Chip size={"sm"} variant={"soft"}>
                    {isActive ? "활성" : "해제됨"}
                  </Chip>
                  <div className={"text-sm text-neutral-700"}>
                    {formatDateTimeWithoutTimezoneConversion(
                      entry.blacklistedAt,
                    )}
                    {entry.releasedAt && (
                      <>
                        {" → "}
                        {formatDateTimeWithoutTimezoneConversion(
                          entry.releasedAt,
                        )}
                        {duration !== null && ` · ${duration}일 지속`}
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <div className={"text-sm text-neutral-700"}>사유: </div>
                  <div
                    style={{ whiteSpace: "pre-wrap" }}
                    className={"text-sm text-neutral-700"}
                  >
                    {entry.reason}
                  </div>
                </div>
                {entry.memo && (
                  <div>
                    <div className={"text-sm text-neutral-700"}>메모: </div>
                    <div
                      style={{ whiteSpace: "pre-wrap" }}
                      className={"text-sm text-neutral-700"}
                    >
                      {entry.memo}
                    </div>
                  </div>
                )}
                <div className={"text-sm text-neutral-700"}>
                  등록자: <AdminNameLabel adminId={entry.blacklistedBy} />
                </div>
                {entry.releasedAt && (
                  <>
                    <Separator
                      style={{ marginTop: 4, marginBottom: 4 }}
                    ></Separator>
                    {entry.releaseReason && (
                      <div>
                        <div className={"text-sm text-neutral-700"}>
                          해제 사유:{" "}
                        </div>
                        <div
                          style={{ whiteSpace: "pre-wrap" }}
                          className={"text-sm text-neutral-700"}
                        >
                          {entry.releaseReason}
                        </div>
                      </div>
                    )}
                    <div className={"text-sm text-neutral-700"}>
                      해제자: <AdminNameLabel adminId={entry.releasedBy} />
                    </div>
                  </>
                )}
                {isActive && onRelease && (
                  <div>
                    <Button
                      onClick={() => onRelease(entry)}
                      variant={"secondary"}
                      isDisabled={undefined}
                      size={"sm"}
                      className="rounded-xl"
                    >
                      {<RotateCcw size={14} />}해제하기
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BlacklistHistoryTimeline;
