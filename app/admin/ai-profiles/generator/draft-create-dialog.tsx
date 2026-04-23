'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { aiProfileGenerator } from '@/app/services/admin/ai-profile-generator';
import {
  CONTENT_TIERS,
  CONTENT_TIER_LABEL,
  type AiProfileContentTier,
  type AiProfileDraftScope,
} from '@/app/types/ai-profile-generator';
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
import { Switch } from '@/shared/ui/switch';
import { Textarea } from '@/shared/ui/textarea';
import { aiProfileGeneratorKeys } from '../_shared/query-keys';
import { SourceDataPicker } from './_shared/source-data-picker';

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

  const [scope, setScope] = useState<AiProfileDraftScope>('admin_curated');
  const [contentTier, setContentTier] =
    useState<AiProfileContentTier>('family');
  const [templateId, setTemplateId] = useState<string>(TEMPLATE_NONE);
  const [initialInstruction, setInitialInstruction] = useState('');
  const [useSourceLock, setUseSourceLock] = useState(false);
  const [universityId, setUniversityId] = useState<string | null>(null);
  const [departmentId, setDepartmentId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setScope('admin_curated');
      setContentTier('family');
      setTemplateId(TEMPLATE_NONE);
      setInitialInstruction('');
      setUseSourceLock(false);
      setUniversityId(null);
      setDepartmentId(null);
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

  const mutation = useMutation({
    mutationFn: () =>
      aiProfileGenerator.createDraft({
        scope,
        initialInstruction: initialInstruction.trim(),
        contentTier,
        templateId: templateId === TEMPLATE_NONE ? undefined : templateId,
        lockedSourceData:
          useSourceLock && universityId && departmentId
            ? { universityId, departmentId }
            : undefined,
      }),
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

  const canSubmit =
    initialInstruction.trim().length > 0 &&
    !mutation.isPending &&
    (!useSourceLock || (universityId !== null && departmentId !== null));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>새 Draft 생성</DialogTitle>
          <DialogDescription>
            초기 지시문(필수)과 옵션을 설정해 Draft를 생성합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="draft-instruction">초기 지시문 (필수)</Label>
            <Textarea
              id="draft-instruction"
              value={initialInstruction}
              onChange={(e) => setInitialInstruction(e.target.value)}
              placeholder="예) 25세 여성, 밝고 유쾌한 성격, 서울 소재 대학원생"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="draft-scope">Scope</Label>
              <Select
                value={scope}
                onValueChange={(value) => setScope(value as AiProfileDraftScope)}
              >
                <SelectTrigger id="draft-scope">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin_curated">운영 관리</SelectItem>
                  <SelectItem value="user_custom">유저 커스텀</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="draft-content-tier">콘텐츠 등급</Label>
              <Select
                value={contentTier}
                onValueChange={(value) =>
                  setContentTier(value as AiProfileContentTier)
                }
              >
                <SelectTrigger id="draft-content-tier">
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
            <Label htmlFor="draft-template">템플릿 (선택)</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger id="draft-template">
                <SelectValue placeholder="템플릿을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TEMPLATE_NONE}>사용 안 함</SelectItem>
                {(templatesQuery.data?.items ?? [])
                  .filter((t) => t.status === 'active')
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

          <div className="space-y-2 rounded-md border border-slate-200 p-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="draft-source-lock">소스 데이터 잠금</Label>
                <p className="text-xs text-slate-500">
                  대학·학과를 고정해 생성합니다.
                </p>
              </div>
              <Switch
                id="draft-source-lock"
                checked={useSourceLock}
                onCheckedChange={setUseSourceLock}
              />
            </div>
            {useSourceLock ? (
              <SourceDataPicker
                universityId={universityId}
                departmentId={departmentId}
                onChange={(u, d) => {
                  setUniversityId(u);
                  setDepartmentId(d);
                }}
              />
            ) : null}
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
            {mutation.isPending ? '생성 중…' : '생성'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
