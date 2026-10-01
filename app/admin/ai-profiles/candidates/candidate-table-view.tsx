"use client";
import { Checkbox } from "@heroui/react";

import { useMemo } from "react";
import { ImageOff } from "lucide-react";
import type { CandidateListItem } from "@/app/types/ghost-injection";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { formatDate } from "../_shared/format";
import { isCheckable } from "../_shared/candidate-utils";
import { CandidateStatusBadge } from "./candidate-status-badge";

interface CandidateTableViewProps {
  items: CandidateListItem[];
  isLoading: boolean;
  selectedIds: Set<string>;
  onToggleOne: (candidateId: string) => void;
  onToggleAll: (checked: boolean) => void;
}

export function CandidateTableView({
  items,
  isLoading,
  selectedIds,
  onToggleOne,
  onToggleAll,
}: CandidateTableViewProps) {
  const { checkableItems, allChecked, someChecked } = useMemo(() => {
    const checkable = items.filter(isCheckable);
    const all =
      checkable.length > 0 &&
      checkable.every((item) => selectedIds.has(item.candidateId));
    const some =
      !all && checkable.some((item) => selectedIds.has(item.candidateId));
    return { checkableItems: checkable, allChecked: all, someChecked: some };
  }, [items, selectedIds]);

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                aria-label="현재 페이지 전체 선택"
                isDisabled={checkableItems.length === 0}
                isSelected={allChecked}
                isIndeterminate={someChecked}
                onChange={(isSelected) => onToggleAll(isSelected)}
              >
                <Checkbox.Content>
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                </Checkbox.Content>
              </Checkbox>
            </TableHead>
            <TableHead>Ghost</TableHead>
            <TableHead>대상 유저</TableHead>
            <TableHead>상태</TableHead>
            <TableHead>주차</TableHead>
            <TableHead>생성일</TableHead>
            <TableHead>발송 예정</TableHead>
            <TableHead>발송일</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell
                colSpan={8}
                className="py-12 text-center text-sm text-slate-500"
              >
                불러오는 중…
              </TableCell>
            </TableRow>
          ) : items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={8}
                className="py-12 text-center text-sm text-slate-500"
              >
                후보가 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => {
              const checkable = isCheckable(item);
              const checked = selectedIds.has(item.candidateId);
              return (
                <TableRow key={item.candidateId} className="hover:bg-slate-50">
                  <TableCell>
                    <Checkbox
                      aria-label={`${item.ghost.name ?? "익명"} 후보 선택`}
                      isDisabled={!checkable}
                      isSelected={checked}
                      isIndeterminate={undefined}
                      onChange={(isSelected) => onToggleOne(item.candidateId)}
                    >
                      <Checkbox.Content>
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                      </Checkbox.Content>
                    </Checkbox>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {item.ghost.primaryPhotoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.ghost.primaryPhotoUrl}
                          alt={item.ghost.name ?? "ghost"}
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                          <ImageOff className="h-4 w-4" />
                        </div>
                      )}
                      <div className="text-sm font-medium text-slate-900">
                        {item.ghost.name ?? "—"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium text-slate-900">
                      {item.targetUser.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {item.targetUser.schoolName ?? "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <CandidateStatusBadge status={item.status} />
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {item.weekYear}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {formatDate(item.createdAt)}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {formatDate(item.scheduledAt)}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {formatDate(item.sentAt)}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
