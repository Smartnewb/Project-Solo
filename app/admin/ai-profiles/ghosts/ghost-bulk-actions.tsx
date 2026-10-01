"use client";
import { Button } from "@heroui/react";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { ghostInjection } from "@/app/services/admin/ghost-injection";
import { getAdminErrorMessage } from "@/shared/lib/http/admin-fetch";
import { useConfirm } from "@/shared/ui/admin/confirm-dialog";
import { useToast } from "@/shared/ui/admin/toast";
import { Alert, AlertDescription } from "@/shared/ui/alert";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { ReasonInput, isReasonValid } from "../_shared/reason-input";
import { ghostInjectionKeys } from "../_shared/query-keys";

interface GhostBulkActionsProps {
  schoolId: string;
  schoolLabel?: string;
}

export function GhostBulkActions({
  schoolId,
  schoolLabel,
}: GhostBulkActionsProps) {
  const toast = useToast();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      ghostInjection.bulkInactivateSchool(schoolId, { reason: reason.trim() }),
    onSuccess: () => {
      toast.success("해당 학교의 가상 프로필이 일괄 비활성화되었습니다.");
      queryClient.invalidateQueries({ queryKey: ghostInjectionKeys.ghosts() });
      queryClient.invalidateQueries({ queryKey: ghostInjectionKeys.status() });
      setDialogOpen(false);
      setReason("");
    },
    onError: (error) => toast.error(getAdminErrorMessage(error)),
  });

  const handleConfirm = async () => {
    if (!isReasonValid(reason)) {
      toast.error("사유를 10자 이상 입력해주세요.");
      return;
    }
    const ok = await confirm({
      title: "정말 진행하시겠어요?",
      message:
        "이 학교의 모든 활성 가상 프로필이 비활성화됩니다. 개별 되돌림이 필요하므로 신중히 진행하세요.",
      severity: "error",
      confirmText: "일괄 비활성화",
    });
    if (!ok) return;
    mutation.mutate();
  };

  return (
    <>
      <Button
        onClick={() => setDialogOpen(true)}
        variant={"danger"}
        size={"md"}
      >
        <AlertTriangle className="mr-2 h-4 w-4" />이 학교 가상 프로필 전부
        비활성화
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>학교 가상 프로필 일괄 비활성화</DialogTitle>
            <DialogDescription>
              {schoolLabel ? `"${schoolLabel}" ` : ""}학교에 속한 모든 활성 가상
              프로필을 비활성화합니다.
            </DialogDescription>
          </DialogHeader>

          <Alert variant="destructive">
            <AlertDescription>
              이 작업은 되돌리기 어렵습니다. 개별 프로필을 다시 활성화하려면
              수동 작업이 필요합니다.
            </AlertDescription>
          </Alert>

          <ReasonInput value={reason} onChange={setReason} minLength={10} />

          <DialogFooter>
            <Button
              onClick={() => setDialogOpen(false)}
              isDisabled={mutation.isPending}
              variant={"outline"}
              size={"md"}
            >
              취소
            </Button>
            <Button
              onClick={handleConfirm}
              isDisabled={mutation.isPending}
              variant={"danger"}
              size={"md"}
            >
              {mutation.isPending ? "처리 중…" : "일괄 비활성화"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
