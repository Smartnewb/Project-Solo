'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload } from 'lucide-react';
import { aiProfileGenerator } from '@/app/services/admin/ai-profile-generator';
import {
  PHOTO_SLOTS,
  PHOTO_SLOT_LABEL,
  type PhotoSlot,
} from '@/app/types/ai-profile-generator';
import { useToast } from '@/shared/ui/admin/toast';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Switch } from '@/shared/ui/switch';
import { Textarea } from '@/shared/ui/textarea';
import { aiProfileGeneratorKeys } from '../../_shared/query-keys';
import { useAiProfileErrorHandler } from '../_shared-error';
import { MediaUploadDialog } from './media-upload-dialog';

interface Props {
  draftId: string;
  version: number;
  readOnly?: boolean;
}

export function PhotoSlotCard({ draftId, version, readOnly = false }: Props) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const handleError = useAiProfileErrorHandler(
    aiProfileGeneratorKeys.draftDetail(draftId),
  );

  const [selectedSlots, setSelectedSlots] = useState<PhotoSlot[]>([
    'representative',
  ]);
  const [instruction, setInstruction] = useState('');
  const [promptVersionId, setPromptVersionId] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);

  const generateMutation = useMutation({
    mutationFn: () =>
      aiProfileGenerator.generatePhoto(draftId, {
        expectedVersion: version,
        slots: selectedSlots.length > 0 ? selectedSlots : undefined,
        instruction: instruction.trim() || undefined,
        promptVersionId: promptVersionId.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('사진 생성이 요청되었습니다.');
      queryClient.invalidateQueries({
        queryKey: aiProfileGeneratorKeys.draftDetail(draftId),
      });
    },
    onError: handleError,
  });

  const toggleSlot = (slot: PhotoSlot) => {
    setSelectedSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot],
    );
  };

  const disabled =
    readOnly || generateMutation.isPending || selectedSlots.length === 0;

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base">사진 생성</CardTitle>
          <p className="text-xs text-slate-500">
            슬롯을 선택해 일괄 생성합니다.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!readOnly ? (
          <>
            <div className="grid grid-cols-3 gap-2 rounded-md border border-slate-200 p-2">
              {PHOTO_SLOTS.map((slot) => {
                const checked = selectedSlots.includes(slot);
                return (
                  <label
                    key={slot}
                    className="flex items-center justify-between gap-2 text-xs text-slate-700"
                  >
                    <span>{PHOTO_SLOT_LABEL[slot]}</span>
                    <Switch
                      checked={checked}
                      onCheckedChange={() => toggleSlot(slot)}
                    />
                  </label>
                );
              })}
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-600">지시문 (선택)</label>
              <Textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="예) 자연광, 웜톤, 단정한 셔츠"
                className="min-h-16 text-xs"
                disabled={generateMutation.isPending}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-600">
                프롬프트 버전 ID (선택)
              </label>
              <input
                type="text"
                value={promptVersionId}
                onChange={(e) => setPromptVersionId(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                placeholder="생략 시 기본 프롬프트 버전 사용"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setUploadOpen(true)}
                disabled={generateMutation.isPending}
              >
                <Upload className="mr-1 h-3.5 w-3.5" /> 파일 업로드
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
