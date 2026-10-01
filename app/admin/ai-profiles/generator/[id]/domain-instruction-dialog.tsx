"use client";
import { Button } from "@heroui/react";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { aiProfileGenerator } from "@/app/services/admin/ai-profile-generator";
import {
  DOMAIN_LABEL,
  type AiProfileDomain,
} from "@/app/types/ai-profile-generator";
import { useToast } from "@/shared/ui/admin/toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { aiProfileGeneratorKeys } from "../../_shared/query-keys";
import { useAiProfileErrorHandler } from "../_shared-error";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draftId: string;
  version: number;
  domain: AiProfileDomain;
}

export function DomainInstructionDialog({
  open,
  onOpenChange,
  draftId,
  version,
  domain,
}: Props) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const handleError = useAiProfileErrorHandler(
    aiProfileGeneratorKeys.draftDetail(draftId),
  );
  const [instruction, setInstruction] = useState("");
  const [promptVersionId, setPromptVersionId] = useState("");

  useEffect(() => {
    if (open) {
      setInstruction("");
      setPromptVersionId("");
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: () =>
      aiProfileGenerator.applyDomainInstruction(draftId, domain, {
        expectedVersion: version,
        instruction: instruction.trim(),
        promptVersionId: promptVersionId.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("지시문을 반영했습니다.");
      queryClient.invalidateQueries({
        queryKey: aiProfileGeneratorKeys.draftDetail(draftId),
      });
      onOpenChange(false);
    },
    onError: handleError,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>자연어로 도메인 수정</DialogTitle>
          <DialogDescription>
            도메인 “{DOMAIN_LABEL[domain]}”에 자연어 지시문을 적용해 변경사항을
            생성합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="instruction">지시문</Label>
            <Textarea
              id="instruction"
              rows={5}
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="예) 말투를 좀 더 쾌활하고 밝게 조정해줘"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prompt-version">프롬프트 버전 ID (선택)</Label>
            <Input
              id="prompt-version"
              value={promptVersionId}
              onChange={(e) => setPromptVersionId(e.target.value)}
              placeholder="생략 시 기본 프롬프트 버전 사용"
            />
          </div>
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
            isDisabled={mutation.isPending || instruction.trim().length === 0}
            variant={"primary"}
            size={"md"}
          >
            {mutation.isPending ? "반영 중…" : "반영"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
