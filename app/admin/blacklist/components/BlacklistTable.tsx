"use client";
import { Button, Skeleton } from "@heroui/react";

import React from "react";

import { Clock, RotateCcw } from "lucide-react";
import type { BlacklistItem } from "@/app/services/admin";
import { formatDateTimeWithoutTimezoneConversion } from "@/app/utils/formatters";
import { AdminNameLabel } from "./AdminNameLabel";

interface Props {
  data: BlacklistItem[];
  loading: boolean;
  onRelease: (item: BlacklistItem) => void;
  onViewHistory: (userId: string) => void;
}

export function BlacklistTable({
  data,
  loading,
  onRelease,
  onViewHistory,
}: Props) {
  return (
    <div className={"overflow-x-auto"}>
      <table
        className={
          "w-full text-sm text-left [&_td]:p-3 [&_thead]:bg-neutral-50 [&_tr]:border-b"
        }
      >
        <thead>
          <tr>
            <th>이름</th>
            <th>전화번호</th>
            <th style={{ minWidth: 240 }}>사유</th>
            <th>등록일</th>
            <th>등록자</th>
            <th>액션</th>
          </tr>
        </thead>
        <tbody>
          {loading &&
            Array.from({ length: 10 }).map((_, idx) => (
              <tr key={`skel-${idx}`}>
                <td>
                  <Skeleton className="h-6 w-full rounded-lg" />
                </td>
                <td>
                  <Skeleton className="h-6 w-full rounded-lg" />
                </td>
                <td>
                  <Skeleton className="h-6 w-full rounded-lg" />
                </td>
                <td>
                  <Skeleton className="h-6 w-full rounded-lg" />
                </td>
                <td>
                  <Skeleton className="h-6 w-full rounded-lg" />
                </td>
                <td>
                  <Skeleton className="h-6 w-full rounded-lg" />
                </td>
              </tr>
            ))}
          {!loading && data.length === 0 && (
            <tr>
              <td colSpan={6}>
                <div>
                  <div className={"text-sm text-neutral-700"}>
                    활성 블랙리스트 없음
                  </div>
                </div>
              </td>
            </tr>
          )}
          {!loading &&
            data.map((item) => (
              <tr key={item.blacklistId}>
                <td>{item.name}</td>
                <td>{item.phoneNumber}</td>
                <td>
                  <div
                    title={item.reason}
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {item.reason}
                  </div>
                </td>
                <td>
                  {formatDateTimeWithoutTimezoneConversion(item.blacklistedAt)}
                </td>
                <td>
                  <AdminNameLabel adminId={item.blacklistedBy} />
                </td>
                <td>
                  <div className={"flex flex-wrap items-center gap-2"}>
                    <Button
                      onClick={() => onViewHistory(item.userId)}
                      variant={"secondary"}
                      isDisabled={undefined}
                      size={"sm"}
                      className="rounded-xl"
                    >
                      {<Clock size={14} />}이력
                    </Button>
                    <Button
                      onClick={() => onRelease(item)}
                      variant={"secondary"}
                      isDisabled={undefined}
                      size={"sm"}
                      className="rounded-xl"
                    >
                      {<RotateCcw size={14} />}해제
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

export default BlacklistTable;
