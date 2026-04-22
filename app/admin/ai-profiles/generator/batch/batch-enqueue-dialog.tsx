'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { aiProfileGenerator } from '@/app/services/admin/ai-profile-generator';
import {
  CONTENT_TIERS,
  CONTENT_TIER_LABEL,
  DOMAIN_LABEL,
  GENERATABLE_DOMAINS,
  PHOTO_SLOTS,
  PHOTO_SLOT_LABEL,
  type AiProfileContentTier,
  type AiProfileDomain,
  type PhotoSlot,
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
import { Switch } from '@/shared/ui/switch';
import { Textarea } from '@/shared/ui/textarea';
import { useAiProfileErrorHandler } from '../_shared-error';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEnqueued?: (jobId: string) => void;
}

const MIN_COUNT = 1;
const MAX_COUNT = 20;
const DEFAULT_COUNT = 5;

export function BatchEnqueueDialog({ open, onOpenChange, onEnqueued }: Props) {
  const toast = useToast();
  const handleError = useAiProfileErrorHandler();

  const [templateId, setTemplateId] = useState<string>('');
  const [promptVersionId, setPromptVersionId] = useState<string>('');
  const [count, setCount] = useState<number>(DEFAULT_COUNT);
  const [initialInstruction, setInitialInstruction] = useState<string>('');
  const [contentTier, setContentTier] = useState<AiProfileContentTier>('family');
  const [selectedDomains, setSelectedDomains] = useState<AiProfileDomain[]>(
    () => [...GENERATABLE_DOMAINS],
  );
  const [includePhotos, setIncludePhotos] = useState<boolean>(false);
  const [photoSlots, setPhotoSlots] = useState<PhotoSlot[]>(['representative']);

  useEffect(() => {
    if (open) {
      setTemplateId('');
      setPromptVersionId('');
      setCount(DEFAULT_COUNT);
      setInitialInstruction('');
      setContentTier('family');
      setSelectedDomains([...GENERATABLE_DOMAINS]);
      setIncludePhotos(false);
      setPhotoSlots(['representative']);
    }
  }, [open]);

  const templatesQuery = useQuery({
    queryKey: ['admin', 'ai-profile-generator', 'generation-templates', 'active'],
    queryFn: () =>
      aiProfileGenerator.listGenerationTemplates({
        isActive: true,
        limit: 100,
      }),
    enabled: open,
  });

  const activeTemplates = templatesQuery.data?.items ?? [];

  const createMutation = useMutation({
    mutationFn: () =>
      aiProfileGenerator.batchGenerateDrafts({
        count,
        initialInstruction: initialInstruction.trim(),
        contentTier,
        templateId: templateId || undefined,
        promptVersionId: promptVersionId || undefined,
        generateDomains:
          selectedDomains.length === GENERATABLE_DOMAINS.length
            ? undefined
            : selectedDomains,
        includePhotos,
        photoSlots: includePhotos ? photoSlots : undefined,
      }),
    onSuccess: (result) => {
      toast.success('배치 생성 job을 등록했습니다.');
      onEnqueued?.(result.jobId);
      onOpenChange(false);
    },
    onError: handleError,
  });

  const canSubmit =
    initialInstruction.trim().length > 0 &&
    count >= MIN_COUNT &&
    count <= MAX_COUNT &&
    selectedDomains.length > 0 &&
    (!includePhotos || photoSlots.length > 0) &&
    !createMutation.isPending;

  const toggleDomain = (domain: AiProfileDomain) => {
    setSelectedDomains((prev) =>
      prev.includes(domain)
        ? prev.filter((d) => d !== domain)
        : [...prev, domain],
    );
  };

  const togglePhotoSlot = (slot: PhotoSlot) => {
    setPhotoSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot],
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>새 배치 생성</DialogTitle>
          <DialogDescription>
            지시문과 옵션을 설정해 여러 Draft를 한 번에 생성합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="batch-instruction">초기 지시문 (필수)</Label>
            <Textarea
              id="batch-instruction"
              rows={4}
              value={initialInstruction}
              onChange={(event) => setInitialInstruction(event.target.value)}
              placeholder="예) 서울권 대학생 여성 5명, MBTI ENFP 분위기"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="batch-count">
                생성 수 ({MIN_COUNT}–{MAX_COUNT})
              </Label>
              <Input
                id="batch-count"
                type="number"
                min={MIN_COUNT}
                max={MAX_COUNT}
                value={count}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  if (Number.isFinite(next)) setCount(next);
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="batch-content-tier">콘텐츠 등급</Label>
              <Select
                value={contentTier}
                onValueChange={(value) =>
                  setContentTier(value as AiProfileContentTier)
                }
              >
                <SelectTrigger id="batch-content-tier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_TIERS.map((tier) => (
                    <SelectItem key={tier} value={tier}>
                      {CONTENT_TIER_LABEL[tier]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="batch-template">템플릿 (선택)</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger id="batch-template">
                <SelectValue placeholder="템플릿 없이 생성" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">(선택 안 함)</SelectItem>
                {activeTemplates.map((tpl) => (
                  <SelectItem key={tpl.id} value={tpl.id}>
                    {tpl.name} (v{tpl.version})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="batch-prompt-version">프롬프트 버전 ID (선택)</Label>
            <Input
              id="batch-prompt-version"
              value={promptVersionId}
              onChange={(event) => setPromptVersionId(event.target.value)}
              placeholder="생략 시 기본 프롬프트 버전 사용"
            />
          </div>

          <div className="space-y-2">
            <Label>도메인 선택</Label>
            <div className="grid grid-cols-2 gap-2 rounded-md border border-slate-200 p-3">
              {GENERATABLE_DOMAINS.map((domain) => {
                const checked = selectedDomains.includes(domain);
                return (
                  <label
                    key={domain}
                    className="flex items-center justify-between gap-2 text-sm text-slate-700"
                  >
                    <span>{DOMAIN_LABEL[domain]}</span>
                    <Switch
                      checked={checked}
                      onCheckedChange={() => toggleDomain(domain)}
                    />
                  </label>
                );
              })}
            </div>
            {selectedDomains.length === 0 ? (
              <p className="text-xs text-rose-600">
                최소 한 개의 도메인을 선택해야 합니다.
              </p>
            ) : null}
          </div>

          <div className="flex items-center justify-between rounded-md border border-slate-200 p-3">
            <div>
              <Label htmlFor="batch-include-photos">사진 자동 생성</Label>
              <p className="text-xs text-slate-500">
                Draft 생성 직후 선택한 슬롯의 사진을 자동 생성합니다.
              </p>
            </div>
            <Switch
              id="batch-include-photos"
              checked={includePhotos}
              onCheckedChange={setIncludePhotos}
            />
          </div>

          {includePhotos ? (
            <div className="space-y-2">
              <Label>사진 슬롯</Label>
              <div className="grid grid-cols-3 gap-2 rounded-md border border-slate-200 p-3">
                {PHOTO_SLOTS.map((slot) => {
                  const checked = photoSlots.includes(slot);
                  return (
                    <label
                      key={slot}
                      className="flex items-center justify-between gap-2 text-xs text-slate-700"
                    >
                      <span>{PHOTO_SLOT_LABEL[slot]}</span>
                      <Switch
                        checked={checked}
                        onCheckedChange={() => togglePhotoSlot(slot)}
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createMutation.isPending}
          >
            취소
          </Button>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!canSubmit}
          >
            {createMutation.isPending ? '등록 중…' : '배치 등록'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
