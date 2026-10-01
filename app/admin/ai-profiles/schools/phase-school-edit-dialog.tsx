"use client";
import { Label as HeroSelectLabel } from "@heroui/react";

import { Button } from "@heroui/react";
import { ComboBox, ListBox, Input } from "@heroui/react";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronsUpDown } from "lucide-react";
import { universities } from "@/app/services/admin";
import { ghostInjection } from "@/app/services/admin/ghost-injection";
import type {
  GhostPhaseBucket,
  PhaseSchoolItem,
} from "@/app/types/ghost-injection";
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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { cn } from "@/shared/utils";
import { ReasonInput, isReasonValid } from "../_shared/reason-input";
import { ghostInjectionKeys } from "../_shared/query-keys";

interface PhaseSchoolEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null이면 신규 등록 모드 */
  /** null이면 신규 등록 모드 */
  target: PhaseSchoolItem | null;
}

interface SchoolOption {
  id: string;
  name: string;
}

export function PhaseSchoolEditDialog({
  open,
  onOpenChange,
  target,
}: PhaseSchoolEditDialogProps) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const isCreate = target === null;

  const [school, setSchool] = useState<SchoolOption | null>(null);
  const [bucket, setBucket] = useState<GhostPhaseBucket>("TREATMENT");
  const [phase, setPhase] = useState("1");
  const [reason, setReason] = useState("");

  const [schoolSearch, setSchoolSearch] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const debouncedSearch = useDebounce(schoolSearch, 300);

  useEffect(() => {
    if (!open) return;
    if (target) {
      setSchool({ id: target.schoolId, name: target.schoolName });
      setBucket(target.bucket);
      setPhase(String(target.phase));
    } else {
      setSchool(null);
      setBucket("TREATMENT");
      setPhase("1");
    }
    setReason("");
    setSchoolSearch("");
  }, [open, target]);

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
    enabled: open && isCreate && popoverOpen,
    staleTime: 5 * 60 * 1000,
  });

  const schoolItems = schoolsQuery.data?.items ?? [];

  const mutation = useMutation({
    mutationFn: () => {
      if (!school) throw new Error("학교를 선택해주세요.");
      const phaseNum = Number(phase);
      return ghostInjection.setPhaseSchool(school.id, {
        schoolName: school.name,
        bucket,
        phase: phaseNum,
        reason: reason.trim(),
      });
    },
    onSuccess: () => {
      toast.success(
        isCreate
          ? "실험 그룹이 등록되었습니다."
          : "실험 그룹이 수정되었습니다.",
      );
      queryClient.invalidateQueries({
        queryKey: ghostInjectionKeys.phaseSchools(),
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

  const phaseNum = Number(phase);
  const canSubmit =
    Boolean(school) &&
    Number.isFinite(phaseNum) &&
    phaseNum >= 1 &&
    isReasonValid(reason) &&
    !mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isCreate
              ? "실험 그룹 등록"
              : `실험 그룹 수정 — ${target?.schoolName}`}
          </DialogTitle>
          <DialogDescription>
            학교를 실험군 또는 대조군에 배정합니다. 실험군 학교의 유저에게만
            가상 프로필이 노출됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>학교 *</Label>
            {isCreate ? (
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
            ) : (
              <Input value={school?.name ?? ""} disabled />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Select
                value={bucket}
                onValueChange={(value) => setBucket(value as GhostPhaseBucket)}
              >
                <HeroSelectLabel>그룹 *</HeroSelectLabel>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TREATMENT">실험군 (TREATMENT)</SelectItem>
                  <SelectItem value="CONTROL">대조군 (CONTROL)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="phase-school-phase">Phase *</Label>
              <Input
                id="phase-school-phase"
                type="number"
                min={1}
                value={phase}
                onChange={(event) => setPhase(event.target.value)}
              />
            </div>
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
            {mutation.isPending ? "저장 중…" : isCreate ? "등록" : "수정"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
