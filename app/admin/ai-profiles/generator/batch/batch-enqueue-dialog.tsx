'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { aiProfileGenerator } from '@/app/services/admin/ai-profile-generator';
import {
  DOMAIN_LABEL,
  FULL_DOMAINS,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Switch } from '@/shared/ui/switch';
import { Textarea } from '@/shared/ui/textarea';
import { aiProfileGeneratorKeys } from '../../_shared/query-keys';
import { useAiProfileErrorHandler } from '../_shared-error';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MIN_COUNT = 1;
const MAX_COUNT = 50;
const DEFAULT_COUNT = 10;

export function BatchEnqueueDialog({ open, onOpenChange }: Props) {
  const toast = useToast();
  const qc = useQueryClient();
  const handleError = useAiProfileErrorHandler(
    aiProfileGeneratorKeys.batchJobs(),
  );

  const [templateId, setTemplateId] = useState<string>('');
  const [count, setCount] = useState<number>(DEFAULT_COUNT);
  const [seedHintsText, setSeedHintsText] = useState<string>('');
  const [selectedDomains, setSelectedDomains] = useState<AiProfileDomain[]>(
    () => [...FULL_DOMAINS],
  );
  const [autoGeneratePhotos, setAutoGeneratePhotos] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      setTemplateId('');
      setCount(DEFAULT_COUNT);
      setSeedHintsText('');
      setSelectedDomains([...FULL_DOMAINS]);
      setAutoGeneratePhotos(false);
    }
  }, [open]);

  const templatesQuery = useQuery({
    queryKey: aiProfileGeneratorKeys.templateList({ status: 'active' }),
    queryFn: () =>
      aiProfileGenerator.listTemplatesPaged({
        status: 'active',
        page: 1,
        limit: 100,
      }),
    enabled: open,
  });

  const activeTemplates = templatesQuery.data?.items ?? [];

  const seedHints = useMemo(() => {
    const lines = seedHintsText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    return lines;
  }, [seedHintsText]);

  const seedHintMismatch =
    seedHints.length > 0 && seedHints.length !== count;

  const createMutation = useMutation({
    mutationFn: () =>
      aiProfileGenerator.createBatchJob({
        templateId,
        count,
        seedHints: seedHints.length > 0 ? seedHints : undefined,
        generateDomains:
          selectedDomains.length === FULL_DOMAINS.length
            ? undefined
            : selectedDomains,
        autoGeneratePhotos: autoGeneratePhotos || undefined,
      }),
    onSuccess: () => {
      toast.success('배치 생성 job을 등록했습니다.');
      qc.invalidateQueries({ queryKey: aiProfileGeneratorKeys.batchJobs() });
      onOpenChange(false);
    },
    onError: handleError,
  });

  const canSubmit =
    templateId.length > 0 &&
    count >= MIN_COUNT &&
    count <= MAX_COUNT &&
    selectedDomains.length > 0 &&
    !createMutation.isPending;

  const toggleDomain = (domain: AiProfileDomain) => {
    setSelectedDomains((prev) =>
      prev.includes(domain)
        ? prev.filter((d) => d !== domain)
        : [...prev, domain],
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>새 배치 생성</DialogTitle>
          <DialogDescription>
            활성 템플릿을 선택해 여러 Draft를 한 번에 생성합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="batch-template">템플릿</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger id="batch-template">
                <SelectValue placeholder="활성 템플릿 선택" />
              </SelectTrigger>
              <SelectContent>
                {activeTemplates.map((tpl) => (
                  <SelectItem key={tpl.id} value={tpl.id}>
                    {tpl.name} (v{tpl.version})
                  </SelectItem>
                ))}
                {activeTemplates.length === 0 ? (
                  <div className="px-2 py-1 text-xs text-slate-500">
                    활성 템플릿이 없습니다.
                  </div>
                ) : null}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="batch-count">생성 수 ({MIN_COUNT}–{MAX_COUNT})</Label>
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
            <Label htmlFor="batch-seed-hints">
              Seed 힌트 (선택, 줄바꿈으로 구분)
            </Label>
            <Textarea
              id="batch-seed-hints"
              rows={4}
              value={seedHintsText}
              onChange={(event) => setSeedHintsText(event.target.value)}
              placeholder={'예)\n서울 여대생, 20세, 영화 좋아함\n부산 남학생, 24세, 게임 좋아함'}
            />
            {seedHintMismatch ? (
              <p className="text-xs text-amber-600">
                Seed 힌트 줄 수({seedHints.length})가 생성 수({count})와 다릅니다.
                부족한 쪽에 맞춰 생성됩니다.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>도메인 선택</Label>
            <div className="grid grid-cols-2 gap-2 rounded-md border border-slate-200 p-3">
              {FULL_DOMAINS.map((domain) => {
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
              <Label htmlFor="batch-auto-photo">사진 자동 생성</Label>
              <p className="text-xs text-slate-500">
                Draft 생성 직후 대표 사진을 자동으로 생성합니다.
              </p>
            </div>
            <Switch
              id="batch-auto-photo"
              checked={autoGeneratePhotos}
              onCheckedChange={setAutoGeneratePhotos}
            />
          </div>
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
