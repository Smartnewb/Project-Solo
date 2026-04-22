'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { aiProfileGenerator } from '@/app/services/admin/ai-profile-generator';
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
import { aiProfileGeneratorKeys } from '../../_shared/query-keys';
import { useAiProfileErrorHandler } from '../_shared-error';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draftId: string;
  version: number;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024;

export function MediaUploadDialog({
  open,
  onOpenChange,
  draftId,
  version,
}: Props) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const handleError = useAiProfileErrorHandler(
    aiProfileGeneratorKeys.draftDetail(draftId),
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [setAsRepresentative, setSetAsRepresentative] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const resetState = () => {
    setFile(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setSetAsRepresentative(false);
    setValidationError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  useEffect(() => {
    if (!open) {
      resetState();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (next: File | null) => {
    setValidationError(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

    if (!next) {
      setFile(null);
      return;
    }
    if (!ALLOWED_TYPES.includes(next.type)) {
      setValidationError('JPEG, PNG, WebP 형식만 업로드할 수 있습니다.');
      setFile(null);
      return;
    }
    if (next.size > MAX_SIZE) {
      setValidationError('파일 크기는 10MB 이하여야 합니다.');
      setFile(null);
      return;
    }
    setFile(next);
    setPreviewUrl(URL.createObjectURL(next));
  };

  const mutation = useMutation({
    mutationFn: () => {
      if (!file) {
        throw new Error('업로드할 파일을 선택하세요.');
      }
      return aiProfileGenerator.uploadPhoto(draftId, {
        file,
        expectedVersion: version,
        setAsRepresentative,
      });
    },
    onSuccess: () => {
      toast.success('사진이 업로드되었습니다.');
      queryClient.invalidateQueries({
        queryKey: aiProfileGeneratorKeys.draftDetail(draftId),
      });
      onOpenChange(false);
    },
    onError: (error) => {
      if (error instanceof Error && error.message) {
        setValidationError(error.message);
      }
      handleError(error);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>사진 업로드</DialogTitle>
          <DialogDescription>
            JPEG, PNG, WebP 형식의 이미지를 10MB 이하로 업로드할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="media-upload-file">이미지 파일</Label>
            <input
              ref={inputRef}
              id="media-upload-file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) =>
                handleFileChange(event.target.files?.[0] ?? null)
              }
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-accent"
              disabled={mutation.isPending}
            />
          </div>

          {previewUrl ? (
            <div className="overflow-hidden rounded-md border border-slate-200 bg-slate-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="미리보기"
                className="max-h-60 w-full object-contain"
              />
            </div>
          ) : null}

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={setAsRepresentative}
              onChange={(event) =>
                setSetAsRepresentative(event.target.checked)
              }
              disabled={mutation.isPending}
            />
            대표 이미지로 설정
          </label>

          {validationError ? (
            <p className="text-sm text-rose-600">{validationError}</p>
          ) : null}
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
            onClick={() => {
              setValidationError(null);
              mutation.mutate();
            }}
            disabled={mutation.isPending || !file}
          >
            {mutation.isPending ? '업로드 중…' : '업로드'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
