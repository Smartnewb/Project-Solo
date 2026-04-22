'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload } from 'lucide-react';
import { aiProfileGenerator } from '@/app/services/admin/ai-profile-generator';
import type {
  AiProfilePhoto,
  PhotoStyle,
} from '@/app/types/ai-profile-generator';
import { useToast } from '@/shared/ui/admin/toast';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import { aiProfileGeneratorKeys } from '../../_shared/query-keys';
import { MediaUploadDialog } from './media-upload-dialog';
import { useDraftErrorHandler } from './use-draft-mutation';

interface Props {
  draftId: string;
  version: number;
  gallery: AiProfilePhoto[];
  representativeImageUrl: string | null;
  readOnly?: boolean;
}

export function PhotoSlotCard({
  draftId,
  version,
  gallery,
  representativeImageUrl,
  readOnly = false,
}: Props) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const handleError = useDraftErrorHandler(draftId);

  const [style, setStyle] = useState<PhotoStyle>('portrait');
  const [customPrompt, setCustomPrompt] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);

  const generateMutation = useMutation({
    mutationFn: () =>
      aiProfileGenerator.generatePhoto(draftId, {
        expectedVersion: version,
        style,
        customPrompt: style === 'custom' ? customPrompt : undefined,
      }),
    onSuccess: () => {
      toast.success('사진 생성이 요청되었습니다.');
      queryClient.invalidateQueries({
        queryKey: aiProfileGeneratorKeys.draftDetail(draftId),
      });
    },
    onError: handleError,
  });

  const disabled =
    readOnly ||
    generateMutation.isPending ||
    (style === 'custom' && customPrompt.trim().length === 0);

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base">사진 생성</CardTitle>
          <p className="text-xs text-slate-500">
            현재 갤러리 {gallery.length}장 · 대표 이미지{' '}
            {representativeImageUrl ? '설정됨' : '미지정'}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!readOnly ? (
          <>
            <div className="space-y-1">
              <label className="text-xs text-slate-600">스타일</label>
              <Select
                value={style}
                onValueChange={(next) => setStyle(next as PhotoStyle)}
                disabled={generateMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="스타일 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="portrait">포트레이트</SelectItem>
                  <SelectItem value="casual">캐주얼</SelectItem>
                  <SelectItem value="custom">커스텀 프롬프트</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {style === 'custom' ? (
              <div className="space-y-1">
                <label className="text-xs text-slate-600">커스텀 프롬프트</label>
                <Textarea
                  value={customPrompt}
                  onChange={(event) => setCustomPrompt(event.target.value)}
                  placeholder="사진 생성을 위한 프롬프트를 입력하세요."
                  className="min-h-20 text-xs"
                  disabled={generateMutation.isPending}
                />
              </div>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setUploadOpen(true)}
                disabled={generateMutation.isPending}
              >
                <Upload className="mr-1 h-3.5 w-3.5" />
                파일 업로드
              </Button>
              <Button
                size="sm"
                onClick={() => generateMutation.mutate()}
                disabled={disabled}
              >
                {generateMutation.isPending ? '생성 중…' : '사진 생성'}
              </Button>
            </div>
          </>
        ) : (
          <p className="text-xs text-slate-500">
            배포된 Draft는 더 이상 사진을 생성할 수 없습니다.
          </p>
        )}
      </CardContent>

      <MediaUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        draftId={draftId}
        version={version}
      />
    </Card>
  );
}
