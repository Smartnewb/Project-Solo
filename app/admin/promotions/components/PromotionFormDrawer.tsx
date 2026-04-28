'use client';

import { useEffect, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui/sheet';
import {
  Box,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  CircularProgress,
  Typography,
  Divider,
} from '@mui/material';
import { PromotionImageUpload } from './PromotionImageUpload';
import {
  useUploadPromotionImage,
  useDeletePromotionImage,
} from '@/app/admin/hooks';
import { useToast } from '@/shared/ui/admin/toast';
import type { Promotion, CreatePromotionRequest } from '@/types/admin';

interface PromotionFormDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePromotionRequest) => Promise<void>;
  editPromotion: Promotion | null;
}

const DEFAULT_FORM = {
  title: '',
  subtitle: '',
  badge: '',
  imageUrl: '',
  backgroundColor: '#FFFFFF',
  targetGemProductId: '',
  discountRate: 0,
  startsAt: '',
  expiresAt: '',
  sortOrder: 0,
  ctaText: '지금 받기',
  targetFirstPurchaseOnly: false,
  isActive: true,
};

export function PromotionFormDrawer({
  open,
  onClose,
  onSubmit,
  editPromotion,
}: PromotionFormDrawerProps) {
  const toast = useToast();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [s3Key, setS3Key] = useState<string>('');
  const [oldS3Key, setOldS3Key] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const uploadMutation = useUploadPromotionImage();
  const deleteImageMutation = useDeletePromotionImage();

  useEffect(() => {
    if (open && editPromotion) {
      setForm({
        title: editPromotion.title,
        subtitle: editPromotion.subtitle ?? '',
        badge: editPromotion.badge ?? '',
        imageUrl: editPromotion.imageUrl,
        backgroundColor: editPromotion.backgroundColor,
        targetGemProductId: editPromotion.targetGemProductId,
        discountRate: editPromotion.discountRate,
        startsAt: editPromotion.startsAt.slice(0, 16),
        expiresAt: editPromotion.expiresAt.slice(0, 16),
        sortOrder: editPromotion.sortOrder,
        ctaText: editPromotion.ctaText,
        targetFirstPurchaseOnly: editPromotion.targetFirstPurchaseOnly,
        isActive: editPromotion.isActive,
      });
      setS3Key('');
      setOldS3Key('');
    } else if (open && !editPromotion) {
      setForm(DEFAULT_FORM);
      setS3Key('');
      setOldS3Key('');
    }
    setErrors({});
  }, [open, editPromotion]);

  const handleFileSelected = async (file: File) => {
    try {
      const result = await uploadMutation.mutateAsync(file);
      if (s3Key) setOldS3Key(s3Key);
      setForm((prev) => ({ ...prev, imageUrl: result.imageUrl }));
      setS3Key(result.s3Key);
    } catch {
      toast.error('이미지 업로드에 실패했습니다.');
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = '제목을 입력하세요.';
    if (!form.imageUrl) errs.imageUrl = '이미지를 업로드하세요.';
    if (!form.backgroundColor) errs.backgroundColor = '배경색을 선택하세요.';
    if (!form.targetGemProductId.trim()) errs.targetGemProductId = '구슬 상품 ID를 입력하세요.';
    if (form.discountRate < 0 || form.discountRate > 100) errs.discountRate = '0~100 사이 값을 입력하세요.';
    if (!form.startsAt) errs.startsAt = '시작일을 입력하세요.';
    if (!form.expiresAt) errs.expiresAt = '종료일을 입력하세요.';
    if (form.startsAt && form.expiresAt && form.expiresAt <= form.startsAt)
      errs.expiresAt = '종료일은 시작일 이후여야 합니다.';
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    try {
      const data: CreatePromotionRequest = {
        title: form.title,
        subtitle: form.subtitle || undefined,
        badge: form.badge || undefined,
        imageUrl: form.imageUrl,
        backgroundColor: form.backgroundColor,
        targetGemProductId: form.targetGemProductId,
        discountRate: form.discountRate,
        startsAt: new Date(form.startsAt).toISOString(),
        expiresAt: new Date(form.expiresAt).toISOString(),
        sortOrder: form.sortOrder,
        ctaText: form.ctaText || undefined,
        targetFirstPurchaseOnly: form.targetFirstPurchaseOnly,
        isActive: form.isActive,
      };
      await onSubmit(data);
      if (oldS3Key) {
        deleteImageMutation.mutate(oldS3Key);
      }
    } catch {
      // parent handles toast
    } finally {
      setSubmitting(false);
    }
  };

  const set = (field: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{editPromotion ? '프로모션 수정' : '프로모션 등록'}</SheetTitle>
        </SheetHeader>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField
            label="제목 *"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            inputProps={{ maxLength: 50 }}
            error={!!errors.title}
            helperText={errors.title}
            size="small"
            fullWidth
          />

          <TextField
            label="부제목"
            value={form.subtitle}
            onChange={(e) => set('subtitle', e.target.value)}
            inputProps={{ maxLength: 100 }}
            size="small"
            fullWidth
          />

          <TextField
            label="배지"
            value={form.badge}
            onChange={(e) => set('badge', e.target.value)}
            inputProps={{ maxLength: 20 }}
            size="small"
            fullWidth
            placeholder="예: HOT, NEW"
          />

          <Box>
            <Typography variant="caption" color="text.secondary" mb={0.5} display="block">
              프로모션 이미지 *
            </Typography>
            <PromotionImageUpload
              imageUrl={form.imageUrl || null}
              uploading={uploadMutation.isPending}
              onFileSelected={handleFileSelected}
              onError={(msg) => toast.error(msg)}
            />
            {errors.imageUrl && (
              <Typography variant="caption" color="error">{errors.imageUrl}</Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                배경색 *
              </Typography>
              <input
                type="color"
                value={form.backgroundColor}
                onChange={(e) => set('backgroundColor', e.target.value)}
                style={{ width: 48, height: 36, cursor: 'pointer', border: 'none', borderRadius: 4 }}
              />
            </Box>
            <TextField
              label="배경색 (HEX) *"
              value={form.backgroundColor}
              onChange={(e) => set('backgroundColor', e.target.value)}
              error={!!errors.backgroundColor}
              helperText={errors.backgroundColor}
              size="small"
              sx={{ flex: 1 }}
              placeholder="#FFFFFF"
            />
          </Box>

          <TextField
            label="구슬 상품 ID *"
            value={form.targetGemProductId}
            onChange={(e) => set('targetGemProductId', e.target.value)}
            error={!!errors.targetGemProductId}
            helperText={errors.targetGemProductId}
            size="small"
            fullWidth
          />

          <TextField
            label="할인율 (%) *"
            type="number"
            value={form.discountRate}
            onChange={(e) => set('discountRate', Number(e.target.value))}
            inputProps={{ min: 0, max: 100 }}
            error={!!errors.discountRate}
            helperText={errors.discountRate}
            size="small"
            fullWidth
          />

          <TextField
            label="시작일 *"
            type="datetime-local"
            value={form.startsAt}
            onChange={(e) => set('startsAt', e.target.value)}
            error={!!errors.startsAt}
            helperText={errors.startsAt}
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="종료일 *"
            type="datetime-local"
            value={form.expiresAt}
            onChange={(e) => set('expiresAt', e.target.value)}
            error={!!errors.expiresAt}
            helperText={errors.expiresAt}
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="정렬 순서"
            type="number"
            value={form.sortOrder}
            onChange={(e) => set('sortOrder', Number(e.target.value))}
            size="small"
            fullWidth
          />

          <TextField
            label="CTA 텍스트"
            value={form.ctaText}
            onChange={(e) => set('ctaText', e.target.value)}
            inputProps={{ maxLength: 20 }}
            size="small"
            fullWidth
            placeholder="지금 받기"
          />

          <Divider />

          <FormControlLabel
            control={
              <Switch
                checked={form.targetFirstPurchaseOnly}
                onChange={(e) => set('targetFirstPurchaseOnly', e.target.checked)}
              />
            }
            label="첫 구매자만"
          />

          <FormControlLabel
            control={
              <Switch
                checked={form.isActive}
                onChange={(e) => set('isActive', e.target.checked)}
              />
            }
            label="활성화"
          />

          <Box sx={{ display: 'flex', gap: 1, pt: 1 }}>
            <Button variant="outlined" onClick={onClose} disabled={submitting} fullWidth>
              취소
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting || uploadMutation.isPending}
              fullWidth
            >
              {submitting ? <CircularProgress size={20} /> : editPromotion ? '수정' : '등록'}
            </Button>
          </Box>
        </Box>
      </SheetContent>
    </Sheet>
  );
}
