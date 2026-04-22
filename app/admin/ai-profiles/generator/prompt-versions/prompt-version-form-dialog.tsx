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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promptVersion: PromptVersion | null;
}

interface FormState {
  name: string;
  description: string;
  globalInstruction: string;
  domainInstructionsJson: string;
  safetyInstruction: string;
  repairInstruction: string;
  temperatureByDomainJson: string;
}

function initState(pv: PromptVersion | null): FormState {
  if (!pv) {
    return {
      name: '',
      description: '',
      globalInstruction: '',
      domainInstructionsJson: '',
      safetyInstruction: '',
      repairInstruction: '',
      temperatureByDomainJson: '',
    };
  }
  const { config } = pv;
  return {
    name: pv.name,
    description: pv.description ?? '',
    globalInstruction: config.globalInstruction,
    domainInstructionsJson: config.domainInstructions
      ? JSON.stringify(config.domainInstructions, null, 2)
      : '',
    safetyInstruction: config.safetyInstruction ?? '',
    repairInstruction: config.repairInstruction ?? '',
    temperatureByDomainJson: config.temperatureByDomain
      ? JSON.stringify(config.temperatureByDomain, null, 2)
      : '',
  };
}

function parseJsonObject<T = Record<string, unknown>>(
  raw: string,
  label: string,
): { ok: true; value: T | undefined } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, value: undefined };
  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { ok: false, error: `${label}: 객체(JSON) 형식이 필요합니다.` };
    }
    return { ok: true, value: parsed as T };
  } catch (err) {
    return {
      ok: false,
      error: `${label}: JSON 파싱 실패 (${(err as Error).message})`,
    };
  }
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
      const globalInstruction = form.globalInstruction.trim();
      if (!globalInstruction) {
        throw new Error('글로벌 지시문을 입력하세요.');
      }
      const domainParsed = parseJsonObject<Record<string, string>>(
        form.domainInstructionsJson,
        '도메인별 지시문',
      );
      if (!domainParsed.ok) throw new Error(domainParsed.error);
      const temperatureParsed = parseJsonObject<Record<string, number>>(
        form.temperatureByDomainJson,
        '도메인별 temperature',
      );
      if (!temperatureParsed.ok) throw new Error(temperatureParsed.error);

      const config: PromptVersionConfig = {
        globalInstruction,
        domainInstructions: domainParsed.value,
        safetyInstruction: form.safetyInstruction.trim() || undefined,
        repairInstruction: form.repairInstruction.trim() || undefined,
        temperatureByDomain: temperatureParsed.value,
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
              : '글로벌/도메인별 지시문과 safety, repair 지시문을 관리합니다.'}
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

          <div className="space-y-1.5">
            <Label htmlFor="pv-global">글로벌 지시문</Label>
            <Textarea
              id="pv-global"
              value={form.globalInstruction}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  globalInstruction: event.target.value,
                }))
              }
              rows={5}
              placeholder="모든 도메인 생성에 공통으로 적용되는 시스템 프롬프트"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pv-domain">도메인별 지시문 (JSON, 선택)</Label>
            <Textarea
              id="pv-domain"
              value={form.domainInstructionsJson}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  domainInstructionsJson: event.target.value,
                }))
              }
              rows={5}
              className="font-mono text-xs"
              placeholder={
                '{\n  "personalityCore": "도메인별 지시문",\n  "voice": "..."\n}'
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pv-safety">safety 지시문 (선택)</Label>
            <Textarea
              id="pv-safety"
              value={form.safetyInstruction}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  safetyInstruction: event.target.value,
                }))
              }
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pv-repair">repair 지시문 (선택)</Label>
            <Textarea
              id="pv-repair"
              value={form.repairInstruction}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  repairInstruction: event.target.value,
                }))
              }
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pv-temperature">
              도메인별 temperature (JSON, 선택)
            </Label>
            <Textarea
              id="pv-temperature"
              value={form.temperatureByDomainJson}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  temperatureByDomainJson: event.target.value,
                }))
              }
              rows={4}
              className="font-mono text-xs"
              placeholder={
                '{\n  "personalityCore": 0.8,\n  "voice": 0.6\n}'
              }
            />
          </div>

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
