'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { aiProfileGenerator } from '@/app/services/admin/ai-profile-generator';
import type { AiProfilePhoto } from '@/app/types/ai-profile-generator';
import { useToast } from '@/shared/ui/admin/toast';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { aiProfileGeneratorKeys } from '../../_shared/query-keys';
import { PhotoActionMenu } from './photo-action-menu';
import { useDraftErrorHandler } from './use-draft-mutation';

interface Props {
  draftId: string;
  version: number;
  gallery: AiProfilePhoto[];
  readOnly?: boolean;
}

const MODERATION_LABEL: Record<AiProfilePhoto['moderationStatus'], string> = {
  pending: '검수 대기',
  approved: '승인',
  blocked: '차단',
  failed: '실패',
};

const MODERATION_VARIANT: Record<
  AiProfilePhoto['moderationStatus'],
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  pending: 'secondary',
  approved: 'default',
  blocked: 'destructive',
  failed: 'destructive',
};

export function GalleryPanel({
  draftId,
  version,
  gallery,
  readOnly = false,
}: Props) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const handleError = useDraftErrorHandler(draftId);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (photoId: string) =>
      aiProfileGenerator.deletePhoto(draftId, photoId),
    onSuccess: () => {
      toast.success('사진이 삭제되었습니다.');
      queryClient.invalidateQueries({
        queryKey: aiProfileGeneratorKeys.draftDetail(draftId),
      });
      setPendingDeleteId(null);
    },
    onError: (error) => {
      setPendingDeleteId(null);
      handleError(error);
    },
  });

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">갤러리</CardTitle>
      </CardHeader>
      <CardContent>
        {gallery.length === 0 ? (
          <p className="text-xs text-slate-500">갤러리가 비어 있습니다.</p>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {gallery.map((photo) => (
              <div
                key={photo.id}
                className="relative flex flex-col gap-1 rounded-md border border-slate-200 p-1"
              >
                {!readOnly ? (
                  <button
                    type="button"
                    onClick={() => setPendingDeleteId(photo.id)}
                    className="absolute right-1 top-1 z-10 rounded-full bg-white/90 p-0.5 text-slate-600 shadow hover:bg-red-100 hover:text-red-600"
                    aria-label="사진 삭제"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
                <PhotoActionMenu
                  draftId={draftId}
                  version={version}
                  photo={photo}
                  readOnly={readOnly}
                />
                <div className="aspect-square overflow-hidden rounded-md bg-slate-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.thumbnailUrl ?? photo.url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex items-center justify-between px-1 pb-1">
                  <Badge
                    variant={MODERATION_VARIANT[photo.moderationStatus]}
                    className="text-[10px]"
                  >
                    {MODERATION_LABEL[photo.moderationStatus]}
                  </Badge>
                  <span className="text-[10px] text-slate-400">
                    {photo.source === 'generated' ? 'AI' : '수동'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>사진 삭제</DialogTitle>
            <DialogDescription>
              이 사진을 삭제하시겠습니까? 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPendingDeleteId(null)}
              disabled={deleteMutation.isPending}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (pendingDeleteId) deleteMutation.mutate(pendingDeleteId);
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? '삭제 중…' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
