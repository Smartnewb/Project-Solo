'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MoreVertical } from 'lucide-react';
import { aiProfileGenerator } from '@/app/services/admin/ai-profile-generator';
import type { AiProfilePhoto } from '@/app/types/ai-profile-generator';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui/popover';
import { Textarea } from '@/shared/ui/textarea';
import { aiProfileGeneratorKeys } from '../../_shared/query-keys';
import { useAiProfileErrorHandler } from '../_shared-error';

interface Props {
  draftId: string;
  version: number;
  photo: AiProfilePhoto;
  readOnly?: boolean;
}

type DialogMode = null | 'retry' | 'reject';

export function PhotoActionMenu({
  draftId,
  version,
  photo,
  readOnly,
}: Props) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const handleError = useAiProfileErrorHandler(
    aiProfileGeneratorKeys.draftDetail(draftId),
  );

  const [open, setOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const status = photo.moderationStatus;
  const canAct = status === 'blocked' || status === 'failed';

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: aiProfileGeneratorKeys.draftDetail(draftId),
    });

  const retryMutation = useMutation({
    mutationFn: () =>
      aiProfileGenerator.retryPhoto(draftId, photo.id, {
        expectedVersion: version,
        customPrompt: customPrompt.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('사진 재생성이 요청되었습니다.');
      invalidate();
      setDialogMode(null);
      setCustomPrompt('');
    },
    onError: handleError,
  });

  const rejectMutation = useMutation({
    mutationFn: () => {
      const reason = rejectReason.trim();
      if (!reason) {
        throw new Error('거부 사유를 입력하세요.');
      }
      return aiProfileGenerator.rejectPhoto(draftId, photo.id, {
        expectedVersion: version,
        reason,
      });
    },
    onSuccess: () => {
      toast.success('사진이 거부 처리되었습니다.');
      invalidate();
      setDialogMode(null);
      setRejectReason('');
    },
    onError: handleError,
  });

  const openDialog = (mode: DialogMode) => {
    setDialogMode(mode);
    setOpen(false);
  };

  const closeDialog = () => {
    setDialogMode(null);
  };

  if (readOnly || !canAct) {
    return null;
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="absolute left-1 top-1 z-10 rounded-full bg-white/90 p-0.5 text-slate-600 shadow hover:bg-slate-100"
            aria-label="사진 작업 메뉴"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-40 p-1">
          <button
            type="button"
            onClick={() => openDialog('retry')}
            className="block w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
          >
            재생성
          </button>
          <button
            type="button"
            onClick={() => openDialog('reject')}
            className="block w-full rounded-sm px-2 py-1.5 text-left text-sm text-rose-600 hover:bg-rose-50"
          >
            수동 거부 확정
          </button>
        </PopoverContent>
      </Popover>

      <Dialog
        open={dialogMode === 'retry'}
        onOpenChange={(next) => {
          if (!next) closeDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>사진 재생성</DialogTitle>
            <DialogDescription>
              차단되거나 실패한 사진을 재생성합니다. 필요 시 커스텀 프롬프트를
              입력하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="photo-retry-prompt">커스텀 프롬프트 (선택)</Label>
            <Textarea
              id="photo-retry-prompt"
              value={customPrompt}
              onChange={(event) => setCustomPrompt(event.target.value)}
              rows={4}
              placeholder="기본 프롬프트 대신 사용할 지시문"
              disabled={retryMutation.isPending}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeDialog}
              disabled={retryMutation.isPending}
            >
              취소
            </Button>
            <Button
              onClick={() => retryMutation.mutate()}
              disabled={retryMutation.isPending}
            >
              {retryMutation.isPending ? '요청 중…' : '재생성'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogMode === 'reject'}
        onOpenChange={(next) => {
          if (!next) closeDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>사진 거부 확정</DialogTitle>
            <DialogDescription>
              사진을 수동으로 거부 처리합니다. 거부 사유는 기록됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="photo-reject-reason">거부 사유</Label>
            <Textarea
              id="photo-reject-reason"
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              rows={4}
              placeholder="예: 얼굴 식별 불가, 부적절 콘텐츠"
              disabled={rejectMutation.isPending}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeDialog}
              disabled={rejectMutation.isPending}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => rejectMutation.mutate()}
              disabled={rejectMutation.isPending || !rejectReason.trim()}
            >
              {rejectMutation.isPending ? '처리 중…' : '거부 확정'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
