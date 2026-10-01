"use client";
import { Button } from "@heroui/react";
import { ComboBox, ListBox, Input } from "@heroui/react";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronsUpDown } from "lucide-react";
import { universities } from "@/app/services/admin";
import { ghostInjection } from "@/app/services/admin/ghost-injection";
import { useDebounce } from "@/shared/hooks";
import { AdminApiError } from "@/shared/lib/http/admin-fetch";
import { useToast } from "@/shared/ui/admin/toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

import { Label } from "@/shared/ui/label";

import { cn } from "@/shared/utils";
import { ReasonInput, isReasonValid } from "../_shared/reason-input";
import { ghostInjectionKeys } from "../_shared/query-keys";

interface BlacklistAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SchoolOption {
  id: string;
  name: string;
}

export function BlacklistAddDialog({
  open,
  onOpenChange,
}: BlacklistAddDialogProps) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [school, setSchool] = useState<SchoolOption | null>(null);
  const [reason, setReason] = useState("");
  const [schoolSearch, setSchoolSearch] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const debouncedSearch = useDebounce(schoolSearch, 300);

  useEffect(() => {
    if (open) {
      setSchool(null);
      setReason("");
      setSchoolSearch("");
    }
  }, [open]);

  const schoolsQuery = useQuery({
    queryKey: ["admin", "universities", "list", debouncedSearch],
    queryFn: async () => {
      const result = await universities.getList({
        page: 1,
        limit: 30,
        name: debouncedSearch || undefined,
        isActive: true,
      });
      return result as { items: Array<{ id: string; name: string }> };
    },
    enabled: open && popoverOpen,
    staleTime: 5 * 60 * 1000,
  });

  const schoolItems = schoolsQuery.data?.items ?? [];

  const mutation = useMutation({
    mutationFn: () => {
      if (!school) throw new Error("학교를 선택해주세요.");
      return ghostInjection.addBlacklist({
        schoolId: school.id,
        schoolName: school.name,
        reason: reason.trim(),
      });
    },
    onSuccess: () => {
      toast.success("차단 목록에 추가되었습니다.");
      queryClient.invalidateQueries({
        queryKey: ghostInjectionKeys.blacklist(),
      });
      onOpenChange(false);
    },
    onError: (error) => {
      const msg =
        error instanceof AdminApiError
          ? ((error.body as { message?: string } | null)?.message ??
            error.message)
          : error instanceof Error
            ? error.message
            : "요청 실패";
      toast.error(msg);
    },
  });

  const canSubmit =
    Boolean(school) && isReasonValid(reason) && !mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>차단 학교 추가</DialogTitle>
          <DialogDescription>
            해당 학교에는 즉시 가상 프로필 노출이 차단됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>학교 *</Label>
            <ComboBox
              allowsEmptyCollection
              onOpenChange={setPopoverOpen}
              inputValue={schoolSearch}
              onInputChange={setSchoolSearch}
              selectedKey={school?.id ?? null}
              onSelectionChange={(key) => {
                const item = schoolItems.find((item) => item.id === key);
                setSchool(item ? { id: item.id, name: item.name } : null);
              }}
              aria-label="학교 검색"
              allowsCustomValue={false}
              className="w-full"
            >
              <ComboBox.InputGroup>
                <Input placeholder="학교명 검색" />
                <ComboBox.Trigger />
              </ComboBox.InputGroup>
              <ComboBox.Popover>
                <ListBox
                  renderEmptyState={() => (
                    <div className="p-3 text-sm text-neutral-600">
                      {schoolsQuery.isLoading
                        ? "불러오는 중…"
                        : "결과가 없습니다."}
                    </div>
                  )}
                >
                  {schoolItems.map((item) => (
                    <ListBox.Item
                      key={item.id}
                      id={item.id}
                      textValue={item.name}
                    >
                      {item.name}
                    </ListBox.Item>
                  ))}
                </ListBox>
              </ComboBox.Popover>
            </ComboBox>
          </div>

          <ReasonInput value={reason} onChange={setReason} minLength={10} />
        </div>

        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            isDisabled={mutation.isPending}
            variant={"outline"}
            size={"md"}
          >
            취소
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            isDisabled={!canSubmit}
            variant={"primary"}
            size={"md"}
          >
            {mutation.isPending ? "추가 중…" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
