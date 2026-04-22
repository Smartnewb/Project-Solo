'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { aiProfileGenerator } from '@/app/services/admin/ai-profile-generator';
import type { AiProfileGalleryItem } from '@/app/types/ai-profile-generator';
import { useToast } from '@/shared/ui/admin/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { aiProfileGeneratorKeys } from '../../_shared/query-keys';
import { useAiProfileErrorHandler } from '../_shared-error';

interface Props {
  draftId: string;
  version: number;
  representativeImageUrl: string | null;
  gallery: AiProfileGalleryItem[];
  readOnly?: boolean;
}

export function RepresentativeImagePanel({
  draftId,
  version,
  representativeImageUrl,
  gallery,
  readOnly = false,
}: Props) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const handleError = useAiProfileErrorHandler(
    aiProfileGeneratorKeys.draftDetail(draftId),
  );

  const setMutation = useMutation({
    mutationFn: (url: string) =>
      aiProfileGenerator.updateMedia(draftId, {
        expectedVersion: version,
        representativeImageUrl: url,
      }),
    onSuccess: () => {
      toast.success('대표 이미지가 설정되었습니다.');
      queryClient.invalidateQueries({
        queryKey: aiProfileGeneratorKeys.draftDetail(draftId),
      });
    },
    onError: handleError,
  });

  const clearMutation = useMutation({
    mutationFn: () =>
      aiProfileGenerator.updateMedia(draftId, {
        expectedVersion: version,
        representativeImageUrl: null,
      }),
    onSuccess: () => {
      toast.success('대표 이미지가 해제되었습니다.');
      queryClient.invalidateQueries({
        queryKey: aiProfileGeneratorKeys.draftDetail(draftId),
      });
    },
    onError: handleError,
  });

  const disabled =
    readOnly || setMutation.isPending || clearMutation.isPending;

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">대표 이미지</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex h-48 w-full items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50">
          {representativeImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={representativeImageUrl}
              alt="대표 이미지"
              className="h-full w-full object-contain"
            />
          ) : (
            <span className="text-xs text-slate-400">대표 이미지 미지정</span>
          )}
        </div>
        {!readOnly && representativeImageUrl ? (
          <button
            type="button"
            onClick={() => clearMutation.mutate()}
            disabled={disabled}
            className="text-xs text-rose-600 hover:underline disabled:opacity-60"
          >
            대표 이미지 해제
          </button>
        ) : null}
        {gallery.length > 0 ? (
          <div className="space-y-1">
            <p className="text-xs text-slate-600">
              갤러리에서 대표 이미지 선택
            </p>
            <div className="grid grid-cols-4 gap-2">
              {gallery.map((item, idx) => {
                const isCurrent =
                  representativeImageUrl !== null &&
                  representativeImageUrl === item.url;
                return (
                  <button
                    key={`${item.url}-${idx}`}
                    type="button"
                    onClick={() => setMutation.mutate(item.url)}
                    disabled={disabled || isCurrent}
                    className={`relative aspect-square overflow-hidden rounded-md border ${
                      isCurrent
                        ? 'border-emerald-500 ring-2 ring-emerald-300'
                        : 'border-slate-200 hover:border-slate-400'
                    } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500">갤러리에 이미지가 없습니다.</p>
        )}
      </CardContent>
    </Card>
  );
}
