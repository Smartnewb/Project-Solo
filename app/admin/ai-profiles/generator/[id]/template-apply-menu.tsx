'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { aiProfileGenerator } from '@/app/services/admin/ai-profile-generator';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { aiProfileGeneratorKeys } from '../../_shared/query-keys';
import { useAiProfileErrorHandler } from '../_shared-error';

interface Props {
  draftId: string;
  currentVersion: number;
}

export function TemplateApplyMenu({ draftId, currentVersion }: Props) {
  const queryClient = useQueryClient();
  const handleError = useAiProfileErrorHandler(
    aiProfileGeneratorKeys.draftDetail(draftId),
  );

  const [selectedId, setSelectedId] = useState<string>('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const templatesQuery = useQuery({
    queryKey: aiProfileGeneratorKeys.templates(),
    queryFn: () => aiProfileGenerator.listTemplates(),
  });

  const applyMutation = useMutation({
    mutationFn: (templateId: string) =>
      aiProfileGenerator.applyTemplate(draftId, {
        expectedVersion: currentVersion,
        templateId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: aiProfileGeneratorKeys.draftDetail(draftId),
      });
      setConfirmOpen(false);
      setSelectedId('');
    },
    onError: (error) => {
      handleError(error);
      setConfirmOpen(false);
    },
  });

  const templates = (templatesQuery.data?.items ?? []).filter(
    (template) => template.status === 'active',
  );

  return (
    <div className="flex items-center gap-2">
      <div className="w-56">
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger>
            <SelectValue placeholder="템플릿 선택" />
          </SelectTrigger>
          <SelectContent>
            {templates.length === 0 ? (
              <div className="px-2 py-1.5 text-xs text-slate-500">
                사용 가능한 템플릿 없음
              </div>
            ) : (
              templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name} (v{template.version})
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
      <Button
        variant="outline"
        size="sm"
        disabled={!selectedId || applyMutation.isPending}
        onClick={() => setConfirmOpen(true)}
      >
        적용
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>템플릿 적용</DialogTitle>
            <DialogDescription>
              템플릿 적용 시 모든 도메인이 stale/empty로 초기화될 수 있습니다.
              계속하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={applyMutation.isPending}
            >
              취소
            </Button>
            <Button
              onClick={() => applyMutation.mutate(selectedId)}
              disabled={!selectedId || applyMutation.isPending}
            >
              {applyMutation.isPending ? '적용 중…' : '적용'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
