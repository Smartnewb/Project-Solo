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
  initialPath: string;
}

export function FieldRegenerateDialog({
  open,
  onOpenChange,
  draftId,
  version,
  domain,
  initialPath,
}: Props) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const handleError = useAiProfileErrorHandler(
    aiProfileGeneratorKeys.draftDetail(draftId),
  );
  const [path, setPath] = useState(initialPath);
  const [instruction, setInstruction] = useState("");
  const [promptVersionId, setPromptVersionId] = useState("");

  useEffect(() => {
    if (open) {
      setPath(initialPath);
      setInstruction("");
      setPromptVersionId("");
    }
  }, [open, initialPath]);

  const mutation = useMutation({
    mutationFn: () =>
      aiProfileGenerator.regenerateDomainField(draftId, domain, {
        expectedVersion: version,
        path: path.trim(),
        instruction: instruction.trim(),
        promptVersionId: promptVersionId.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("필드를 재생성했습니다.");
      queryClient.invalidateQueries({
        queryKey: aiProfileGeneratorKeys.draftDetail(draftId),
      });
      onOpenChange(false);
    },
    onError: handleError,
  });

  const canSubmit =
    path.trim().length > 0 &&
    instruction.trim().length > 0 &&
    !mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>필드 재생성 · {DOMAIN_LABEL[domain]}</DialogTitle>
          <DialogDescription>
            해당 경로만 자연어 지시문에 따라 다시 생성합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="fr-path">경로</Label>
            <Input
              id="fr-path"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="예) basic.age"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fr-instruction">지시문</Label>
            <Textarea
              id="fr-instruction"
              rows={4}
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="예) 좀 더 활동적인 취미로 바꿔줘"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fr-prompt-version">프롬프트 버전 ID (선택)</Label>
            <Input
              id="fr-prompt-version"
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
            isDisabled={!canSubmit}
            variant={"primary"}
            size={"md"}
          >
            {mutation.isPending ? "재생성 중…" : "재생성"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
