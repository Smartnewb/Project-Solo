'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { aiProfileGenerator } from '@/app/services/admin/ai-profile-generator';
import type { AiProfileGalleryItem } from '@/app/types/ai-profile-generator';
import { useToast } from '@/shared/ui/admin/toast';
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
import { useAiProfileErrorHandler } from '../_shared-error';

interface Props {
  draftId: string;
  version: number;
  gallery: AiProfileGalleryItem[];
  readOnly?: boolean;
}

export function GalleryPanel({
  draftId,
  version,
  gallery,
  readOnly = false,
}: Props) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const handleError = useAiProfileErrorHandler(
    aiProfileGeneratorKeys.draftDetail(draftId),
  );
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);

  const removeMutation = useMutation({
    mutationFn: (index: number) => {
      const nextGallery = gallery.filter((_, idx) => idx !== index);
      return aiProfileGenerator.updateMedia(draftId, {
        expectedVersion: version,
        gallery: nextGallery,
      });
    },
    onSuccess: () => {
      toast.success('갤러리 항목이 제거되었습니다.');
      queryClient.invalidateQueries({
        queryKey: aiProfileGeneratorKeys.draftDetail(draftId),
      });
      setPendingIndex(null);
    },
    onError: (error) => {
      setPendingIndex(null);
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
            {gallery.map((item, idx) => (
              <div
                key={`${item.url}-${idx}`}
                className="relative flex flex-col gap-1 rounded-md border border-slate-200 p-1"
              >
                {!readOnly ? (
                  <button
                    type="button"
                    onClick={() => setPendingIndex(idx)}
                    className="absolute right-1 top-1 z-10 rounded-full bg-white/90 p-0.5 text-slate-600 shadow hover:bg-red-100 hover:text-red-600"
                    aria-label="갤러리에서 제거"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
                <div className="aspect-square overflow-hidden rounded-md bg-slate-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                {item.tags && item.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1 px-1 pb-1 text-[10px] text-slate-500">
                    {item.tags.slice(0, 3).map((tag) => (
                      <span key={tag}>#{tag}</span>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog
        open={pendingIndex !== null}
        onOpenChange={(open) => {
          if (!open) setPendingIndex(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>갤러리 항목 제거</DialogTitle>
            <DialogDescription>
              이 항목을 갤러리에서 제거하시겠습니까? 원본 미디어는 유지되며, 필요
              시 다시 추가할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPendingIndex(null)}
              disabled={removeMutation.isPending}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (pendingIndex !== null) removeMutation.mutate(pendingIndex);
              }}
              disabled={removeMutation.isPending}
            >
              {removeMutation.isPending ? '제거 중…' : '제거'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
