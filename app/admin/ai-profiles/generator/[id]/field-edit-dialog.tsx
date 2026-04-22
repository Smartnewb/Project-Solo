'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { aiProfileGenerator } from '@/app/services/admin/ai-profile-generator';
import {
  DOMAIN_LABEL,
  type AiProfileDomain,
} from '@/app/types/ai-profile-generator';
import { useToast } from '@/shared/ui/admin/toast';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { aiProfileGeneratorKeys } from '../../_shared/query-keys';
import { useAiProfileErrorHandler } from '../_shared-error';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draftId: string;
  version: number;
  domain: AiProfileDomain;
  /** Full dot-path including domain prefix (e.g. basic.university.name) */
  initialPath: string;
  initialValue: unknown;
}

function toJsonText(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return JSON.stringify(value);
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function FieldEditDialog({
  open,
  onOpenChange,
  draftId,
  version,
  domain,
  initialPath,
  initialValue,
}: Props) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const handleError = useAiProfileErrorHandler(
    aiProfileGeneratorKeys.draftDetail(draftId),
  );
  const [path, setPath] = useState(initialPath);
  const [valueText, setValueText] = useState(() => toJsonText(initialValue));
  const [reason, setReason] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPath(initialPath);
      setValueText(toJsonText(initialValue));
      setReason('');
      setParseError(null);
    }
  }, [open, initialPath, initialValue]);

  const mutation = useMutation({
    mutationFn: () => {
      let parsed: unknown;
      try {
        parsed = valueText.trim() === '' ? null : JSON.parse(valueText);
      } catch (err) {
        throw new Error(
          `JSON 파싱 실패: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
      return aiProfileGenerator.patchDomainField(draftId, domain, {
        expectedVersion: version,
        path: path.trim(),
        value: parsed,
        reason: reason.trim(),
      });
    },
    onSuccess: () => {
      toast.success('필드가 수정되었습니다.');
      queryClient.invalidateQueries({
        queryKey: aiProfileGeneratorKeys.draftDetail(draftId),
      });
      onOpenChange(false);
    },
    onError: (error) => {
      if (error instanceof Error && error.message.startsWith('JSON 파싱 실패')) {
        setParseError(error.message);
        return;
      }
      handleError(error);
    },
  });

  const canSubmit =
    path.trim().length > 0 &&
    reason.trim().length > 0 &&
    !mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>필드 편집 · {DOMAIN_LABEL[domain]}</DialogTitle>
          <DialogDescription>
            JSON 경로와 새 값(JSON)을 입력하세요. 문자열은 큰따옴표로 감싸야
            합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="field-path">경로</Label>
            <Input
              id="field-path"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="예) basic.university.name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="field-value">값 (JSON)</Label>
            <Textarea
              id="field-value"
              rows={6}
              value={valueText}
              onChange={(e) => {
                setValueText(e.target.value);
                setParseError(null);
              }}
              className="font-mono text-xs"
            />
            {parseError ? (
              <p className="text-xs text-rose-600">{parseError}</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="field-reason">사유</Label>
            <Input
              id="field-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="변경 사유를 기록합니다"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            취소
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={!canSubmit}>
            {mutation.isPending ? '저장 중…' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
