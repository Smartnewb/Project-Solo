'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { aiProfileGenerator } from '@/app/services/admin/ai-profile-generator';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';
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
import { Label } from '@/shared/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import { aiProfileGeneratorKeys } from '../_shared/query-keys';

interface DraftCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TEMPLATE_NONE = 'none';

export function DraftCreateDialog({
  open,
  onOpenChange,
}: DraftCreateDialogProps) {
  const toast = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [templateId, setTemplateId] = useState<string>(TEMPLATE_NONE);
  const [seedHint, setSeedHint] = useState('');

  useEffect(() => {
    if (open) {
      setTemplateId(TEMPLATE_NONE);
      setSeedHint('');
    }
  }, [open]);

  const templatesQuery = useQuery({
    queryKey: aiProfileGeneratorKeys.templates(),
    queryFn: () => aiProfileGenerator.listTemplates(),
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: () => {
      const body: { templateId?: string; seedHint?: string } = {};
      if (templateId !== TEMPLATE_NONE) body.templateId = templateId;
      const trimmed = seedHint.trim();
      if (trimmed) body.seedHint = trimmed;
      return aiProfileGenerator.createDraft(body);
    },
    onSuccess: (draft) => {
      toast.success('Draft가 생성되었습니다.');
      queryClient.invalidateQueries({
        queryKey: aiProfileGeneratorKeys.drafts(),
      });
      onOpenChange(false);
      router.push(`/admin/ai-profiles/generator/${draft.id}`);
    },
    onError: (error) => toast.error(getAdminErrorMessage(error)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>새 Draft 생성</DialogTitle>
          <DialogDescription>
            템플릿과 시드 힌트를 선택적으로 지정할 수 있습니다. 빈 상태로
            시작하려면 그대로 생성하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="draft-template">템플릿 (선택)</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger id="draft-template">
                <SelectValue placeholder="템플릿을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TEMPLATE_NONE}>사용 안 함</SelectItem>
                {(templatesQuery.data?.items ?? [])
                  .filter((template) => template.status === 'active')
                  .map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} (v{template.version})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {templatesQuery.isError ? (
              <p className="text-xs text-rose-600">
                템플릿 목록을 불러오지 못했습니다.
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="draft-seed-hint">시드 힌트 (선택)</Label>
            <Textarea
              id="draft-seed-hint"
              value={seedHint}
              onChange={(event) => setSeedHint(event.target.value)}
              placeholder="예: 25세 여성, 밝고 유쾌한 성격, 서울 소재 대학원생"
              rows={4}
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
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? '생성 중…' : '생성'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
