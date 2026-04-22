'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { aiProfileGenerator } from '@/app/services/admin/ai-profile-generator';
import type {
  AiProfileTemplate,
  CreateTemplateBody,
  UpdateTemplateBody,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import { aiProfileGeneratorKeys } from '../../_shared/query-keys';
import { useAiProfileErrorHandler } from '../_shared-error';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: AiProfileTemplate | null;
}

const PROMPT_VERSION_NONE = 'none';

interface FormState {
  name: string;
  description: string;
  baseInstruction: string;
  domainInstructionsJson: string;
  policyJson: string;
  promptVersionId: string;
}

function initState(template: AiProfileTemplate | null): FormState {
  if (!template) {
    return {
      name: '',
      description: '',
      baseInstruction: '',
      domainInstructionsJson: '',
      policyJson: '',
      promptVersionId: PROMPT_VERSION_NONE,
    };
  }
  const policy: Record<string, unknown> = {};
  if (template.randomizationPolicy)
    policy.randomizationPolicy = template.randomizationPolicy;
  if (template.sourceDataPolicy)
    policy.sourceDataPolicy = template.sourceDataPolicy;
  if (template.imagePolicy) policy.imagePolicy = template.imagePolicy;
  if (template.safetyPolicy) policy.safetyPolicy = template.safetyPolicy;
  if (template.domainBlueprints)
    policy.domainBlueprints = template.domainBlueprints;

  return {
    name: template.name,
    description: template.description ?? '',
    baseInstruction: template.baseInstruction,
    domainInstructionsJson: template.domainInstructions
      ? JSON.stringify(template.domainInstructions, null, 2)
      : '',
    policyJson: Object.keys(policy).length
      ? JSON.stringify(policy, null, 2)
      : '',
    promptVersionId: template.promptVersionId ?? PROMPT_VERSION_NONE,
  };
}

function parseJsonField<T = Record<string, unknown>>(
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

export function TemplateFormDialog({ open, onOpenChange, template }: Props) {
  const isEdit = template !== null;
  const toast = useToast();
  const qc = useQueryClient();
  const handleError = useAiProfileErrorHandler(
    aiProfileGeneratorKeys.templates(),
  );

  const [form, setForm] = useState<FormState>(() => initState(template));
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(initState(template));
      setValidationError(null);
    }
  }, [open, template]);

  const promptVersionsQuery = useQuery({
    queryKey: aiProfileGeneratorKeys.promptVersionList({ status: 'active' }),
    queryFn: () =>
      aiProfileGenerator.listPromptVersions({ status: 'active' }),
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const name = form.name.trim();
      if (!name) throw new Error('이름을 입력하세요.');
      const baseInstruction = form.baseInstruction.trim();
      if (baseInstruction.length < 10) {
        throw new Error('기본 지시문은 10자 이상이어야 합니다.');
      }
      const domainParsed = parseJsonField<Record<string, string>>(
        form.domainInstructionsJson,
        '도메인별 지시문',
      );
      if (!domainParsed.ok) throw new Error(domainParsed.error);
      const policyParsed = parseJsonField(form.policyJson, '기타 정책 JSON');
      if (!policyParsed.ok) throw new Error(policyParsed.error);

      const policy = (policyParsed.value ?? {}) as Partial<CreateTemplateBody>;

      const createBody: CreateTemplateBody = {
        name,
        description: form.description.trim() || undefined,
        baseInstruction,
        domainInstructions: domainParsed.value,
        randomizationPolicy:
          (policy.randomizationPolicy as Record<string, unknown>) ?? undefined,
        sourceDataPolicy:
          (policy.sourceDataPolicy as Record<string, unknown>) ?? undefined,
        imagePolicy:
          (policy.imagePolicy as Record<string, unknown>) ?? undefined,
        safetyPolicy:
          (policy.safetyPolicy as Record<string, unknown>) ?? undefined,
        domainBlueprints:
          (policy.domainBlueprints as Record<string, unknown>) ?? undefined,
        lockedFields: policy.lockedFields ?? undefined,
        promptVersionId:
          form.promptVersionId !== PROMPT_VERSION_NONE
            ? form.promptVersionId
            : undefined,
      };

      if (isEdit && template) {
        const updateBody: UpdateTemplateBody = {
          expectedVersion: template.version,
          ...createBody,
        };
        return aiProfileGenerator.updateTemplate(template.id, updateBody);
      }
      return aiProfileGenerator.createTemplate(createBody);
    },
    onSuccess: () => {
      toast.success(isEdit ? '템플릿이 수정되었습니다.' : '템플릿이 생성되었습니다.');
      qc.invalidateQueries({ queryKey: aiProfileGeneratorKeys.templates() });
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
          <DialogTitle>{isEdit ? '템플릿 편집' : '새 템플릿 생성'}</DialogTitle>
          <DialogDescription>
            이름, 기본 지시문, 도메인별 지시문, 프롬프트 버전을 지정합니다. 고급
            정책 JSON은 선택입니다.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto py-2">
          <div className="space-y-1.5">
            <Label htmlFor="template-name">이름</Label>
            <Input
              id="template-name"
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="예: 기본 페르소나 템플릿"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="template-description">설명 (선택)</Label>
            <Textarea
              id="template-description"
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
            <Label htmlFor="template-base">기본 지시문</Label>
            <Textarea
              id="template-base"
              value={form.baseInstruction}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  baseInstruction: event.target.value,
                }))
              }
              rows={5}
              placeholder="모델에게 전달할 기본 시스템 프롬프트"
            />
            <p className="text-xs text-slate-400">최소 10자 이상.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="template-domain-instructions">
              도메인별 지시문 (JSON, 선택)
            </Label>
            <Textarea
              id="template-domain-instructions"
              value={form.domainInstructionsJson}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  domainInstructionsJson: event.target.value,
                }))
              }
              rows={5}
              className="font-mono text-xs"
              placeholder={'{\n  "voice": "말투 지시문",\n  "chatBehavior": "..."\n}'}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="template-prompt-version">
              프롬프트 버전 (선택)
            </Label>
            <Select
              value={form.promptVersionId}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, promptVersionId: value }))
              }
            >
              <SelectTrigger id="template-prompt-version">
                <SelectValue placeholder="프롬프트 버전을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PROMPT_VERSION_NONE}>사용 안 함</SelectItem>
                {(promptVersionsQuery.data?.items ?? []).map((pv) => (
                  <SelectItem key={pv.id} value={pv.id}>
                    {pv.name} (v{pv.version})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {promptVersionsQuery.isError ? (
              <p className="text-xs text-rose-600">
                프롬프트 버전 목록을 불러오지 못했습니다.
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="template-policy">기타 정책 JSON (선택)</Label>
            <Textarea
              id="template-policy"
              value={form.policyJson}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  policyJson: event.target.value,
                }))
              }
              rows={6}
              className="font-mono text-xs"
              placeholder={
                '{\n  "randomizationPolicy": {},\n  "imagePolicy": {},\n  "safetyPolicy": {}\n}'
              }
            />
            <p className="text-xs text-slate-400">
              randomizationPolicy, sourceDataPolicy, imagePolicy, safetyPolicy,
              domainBlueprints, lockedFields 키를 한 객체에 담아 입력합니다.
            </p>
          </div>

          {validationError ? (
            <p className="text-sm text-rose-600">{validationError}</p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? '저장 중…' : isEdit ? '저장' : '생성'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
