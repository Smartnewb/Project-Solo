'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { aiProfileGenerator } from '@/app/services/admin/ai-profile-generator';
import type {
  CreatePromptVersionBody,
  PromptVersion,
  PromptVersionConfig,
  UpdatePromptVersionBody,
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
import {
  PromptVersionConfigFields,
  type PromptVersionConfigFieldsValue,
} from './prompt-version-config-fields';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promptVersion: PromptVersion | null;
}

interface FormState {
  name: string;
  description: string;
  config: PromptVersionConfigFieldsValue;
}

function emptyConfig(): PromptVersionConfigFieldsValue {
  return {
    globalInstruction: '',
    domainInstructions: {},
    safetyInstruction: '',
    repairInstruction: '',
    temperatureByDomain: {},
  };
}

function initState(pv: PromptVersion | null): FormState {
  if (!pv) {
    return {
      name: '',
      description: '',
      config: emptyConfig(),
    };
  }
  const { config } = pv;
  return {
    name: pv.name,
    description: pv.description ?? '',
    config: {
      globalInstruction: config.globalInstruction,
      domainInstructions: config.domainInstructions ?? {},
      safetyInstruction: config.safetyInstruction ?? '',
      repairInstruction: config.repairInstruction ?? '',
      temperatureByDomain: config.temperatureByDomain ?? {},
    },
  };
}

export function PromptVersionFormDialog({
  open,
  onOpenChange,
  promptVersion,
}: Props) {
  const isEdit = promptVersion !== null;
  const editDisabled = isEdit && promptVersion.status !== 'draft';
  const toast = useToast();
  const qc = useQueryClient();
  const handleError = useAiProfileErrorHandler(
    aiProfileGeneratorKeys.promptVersions(),
  );

  const [form, setForm] = useState<FormState>(() => initState(promptVersion));
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(initState(promptVersion));
      setValidationError(null);
    }
  }, [open, promptVersion]);

  const mutation = useMutation({
    mutationFn: async () => {
      const name = form.name.trim();
      if (!name) throw new Error('이름을 입력하세요.');
      const globalInstruction = form.config.globalInstruction.trim();
      if (!globalInstruction) {
        throw new Error('글로벌 지시문을 입력하세요.');
      }

      const domainInstructions =
        Object.keys(form.config.domainInstructions).length > 0
          ? form.config.domainInstructions
          : undefined;
      const temperatureByDomain =
        Object.keys(form.config.temperatureByDomain).length > 0
          ? form.config.temperatureByDomain
          : undefined;

      const config: PromptVersionConfig = {
        globalInstruction,
        domainInstructions,
        safetyInstruction: form.config.safetyInstruction.trim() || undefined,
        repairInstruction: form.config.repairInstruction.trim() || undefined,
        temperatureByDomain,
      };

      if (isEdit && promptVersion) {
        const body: UpdatePromptVersionBody = {
          expectedVersion: promptVersion.version,
          name,
          description: form.description.trim() || undefined,
          config,
        };
        return aiProfileGenerator.updatePromptVersion(promptVersion.id, body);
      }

      const createBody: CreatePromptVersionBody = {
        name,
        description: form.description.trim() || undefined,
        config,
      };
      return aiProfileGenerator.createPromptVersion(createBody);
    },
    onSuccess: () => {
      toast.success(
        isEdit
          ? '프롬프트 버전이 수정되었습니다.'
          : '프롬프트 버전이 생성되었습니다.',
      );
      qc.invalidateQueries({
        queryKey: aiProfileGeneratorKeys.promptVersions(),
      });
      onOpenChange(false);
    },
    onError: (error) => {
      if (error instanceof Error && error.message) {
        setValidationError(error.message);
      }
      handleError(error);
    },
  });

  const handleSubmit = () => {
    setValidationError(null);
    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? '프롬프트 버전 편집' : '새 프롬프트 버전 생성'}
          </DialogTitle>
          <DialogDescription>
            {editDisabled
              ? '활성화되었거나 아카이브된 버전은 편집할 수 없습니다. 복제해 새 draft를 만드세요.'
              : '글로벌/도메인별 지시문과 safety, repair, temperature를 구조화된 폼으로 관리합니다.'}
          </DialogDescription>
        </DialogHeader>

        <fieldset
          disabled={editDisabled}
          className="max-h-[60vh] space-y-4 overflow-y-auto py-2 disabled:opacity-60"
        >
          <div className="space-y-1.5">
            <Label htmlFor="pv-name">이름</Label>
            <Input
              id="pv-name"
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="예: v2.3 페르소나 강화"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pv-description">설명 (선택)</Label>
            <Textarea
              id="pv-description"
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              rows={2}
            />
          </div>

          <PromptVersionConfigFields
            value={form.config}
            onChange={(next) =>
              setForm((prev) => ({ ...prev, config: next }))
            }
            disabled={editDisabled}
          />

          {validationError ? (
            <p className="text-sm text-rose-600">{validationError}</p>
          ) : null}
        </fieldset>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={mutation.isPending || editDisabled}
          >
            {mutation.isPending ? '저장 중…' : isEdit ? '저장' : '생성'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
