'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  FormHelperText,
} from '@mui/material';
import { PromotionImageUpload } from './PromotionImageUpload';
import {
  useUploadPromotionImage,
  useDeletePromotionImage,
} from '@/app/admin/hooks';
import { useToast } from '@/shared/ui/admin/toast';
import AdminService from '@/app/services/admin';
import type {
  Promotion,
  CreatePromotionRequest,
  AdminGemProduct,
} from '@/types/admin';

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
  originGemProductId: '',
  saleGemProductId: '',
  startsAt: '',
  expiresAt: '',
  sortOrder: 0,
  ctaText: '지금 받기',
  targetFirstPurchaseOnly: false,
  isActive: true,
};

const IAP_72H_OFFER_SKUS = new Set(['gem_sale_10', 'gem_25', 'gem_50']);

function formatProductLabel(p: AdminGemProduct): string {
  const sku = p.appleSku ? ` · ${p.appleSku}` : '';
  const display = p.applePrice?.displayPrice ?? `${p.price.toLocaleString()} ${p.currency}`;
  return `${p.productName} (${p.totalGems}구슬, ${display})${sku}`;
}

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

  const productListQuery = useQuery({
    queryKey: ['admin', 'gem-products', 'list'],
    queryFn: () => AdminService.gemProducts.getList(),
    enabled: open,
  });

  const products = useMemo(
    () => productListQuery.data ?? [],
    [productListQuery.data],
  );
  const productMap = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  );

  useEffect(() => {
    if (open && editPromotion) {
      setForm({
        title: editPromotion.title,
        subtitle: editPromotion.subtitle ?? '',
        badge: editPromotion.badge ?? '',
        imageUrl: editPromotion.imageUrl,
        backgroundColor: editPromotion.backgroundColor,
        originGemProductId: editPromotion.originGemProductId ?? '',
        saleGemProductId:
          editPromotion.saleGemProductId ?? editPromotion.targetGemProductId ?? '',
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
    if (!form.saleGemProductId)
      errs.saleGemProductId = '할인 상품(SKU)을 선택하세요.';
    if (!form.originGemProductId)
      errs.originGemProductId = '원가 상품(SKU)을 선택하세요.';
    if (
      form.originGemProductId &&
      form.saleGemProductId &&
      form.originGemProductId === form.saleGemProductId
    ) {
      errs.saleGemProductId = '원가 상품과 할인 상품은 달라야 합니다.';
    }
    if (!form.startsAt) errs.startsAt = '시작일을 입력하세요.';
    if (!form.expiresAt) errs.expiresAt = '종료일을 입력하세요.';
    if (form.startsAt && form.expiresAt && form.expiresAt <= form.startsAt)
      errs.expiresAt = '종료일은 시작일 이후여야 합니다.';
    return errs;
  };

  const origin = form.originGemProductId
    ? productMap.get(form.originGemProductId)
    : undefined;
  const sale = form.saleGemProductId
    ? productMap.get(form.saleGemProductId)
    : undefined;
  const isIap72hOfferAsset = Boolean(sale?.appleSku && IAP_72H_OFFER_SKUS.has(sale.appleSku));

  const originPrice = origin?.applePrice?.price ?? origin?.price ?? 0;
  const salePrice = sale?.applePrice?.price ?? sale?.price ?? 0;
  const derivedDiscountRate =
    origin && sale && originPrice > 0 && salePrice >= 0 && originPrice > salePrice
      ? Number((((originPrice - salePrice) / originPrice) * 100).toFixed(1))
      : null;

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
        originGemProductId: form.originGemProductId || undefined,
        saleGemProductId: form.saleGemProductId || undefined,
        // Keep targetGemProductId for backwards compat with older API field
        targetGemProductId: form.saleGemProductId || undefined,
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

  const productsLoading = productListQuery.isLoading;
  const productsError = productListQuery.isError;

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

          <Divider />

          <Typography variant="subtitle2" color="text.secondary">
            구슬 SKU 페어
          </Typography>
          <Typography variant="caption" color="text.secondary">
            할인 상품의 Apple SKU가 gem_sale_10, gem_25, gem_50이면 앱 72시간 오퍼 카드의
            이미지/문구/CTA 에셋으로도 사용됩니다.
          </Typography>

          {productsError && (
            <Typography variant="caption" color="error">
              구슬 상품 목록을 불러오지 못했습니다.
            </Typography>
          )}

          <FormControl size="small" fullWidth error={!!errors.originGemProductId}>
            <InputLabel id="origin-gem-product-label">원가 상품 *</InputLabel>
            <Select
              labelId="origin-gem-product-label"
              label="원가 상품 *"
              value={form.originGemProductId}
              onChange={(e) => set('originGemProductId', e.target.value)}
              disabled={productsLoading}
            >
              <MenuItem value="">
                <em>선택하세요</em>
              </MenuItem>
              {products.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {formatProductLabel(p)}
                </MenuItem>
              ))}
            </Select>
            {errors.originGemProductId && (
              <FormHelperText>{errors.originGemProductId}</FormHelperText>
            )}
          </FormControl>

          <FormControl size="small" fullWidth error={!!errors.saleGemProductId}>
            <InputLabel id="sale-gem-product-label">할인 상품 *</InputLabel>
            <Select
              labelId="sale-gem-product-label"
              label="할인 상품 *"
              value={form.saleGemProductId}
              onChange={(e) => set('saleGemProductId', e.target.value)}
              disabled={productsLoading}
            >
              <MenuItem value="">
                <em>선택하세요</em>
              </MenuItem>
              {products.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {formatProductLabel(p)}
                </MenuItem>
              ))}
            </Select>
            {errors.saleGemProductId && (
              <FormHelperText>{errors.saleGemProductId}</FormHelperText>
            )}
          </FormControl>

          {isIap72hOfferAsset && (
            <Typography variant="caption" color="secondary">
              이 프로모션은 {sale?.appleSku} 72시간 오퍼 에셋으로 연결됩니다.
            </Typography>
          )}

          <Box
            sx={{
              p: 1.5,
              borderRadius: 1,
              bgcolor: 'grey.50',
              border: '1px solid',
              borderColor: 'grey.200',
            }}
          >
            <Typography variant="caption" color="text.secondary" display="block">
              파생 할인율 (자동 계산)
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {derivedDiscountRate !== null
                ? `${derivedDiscountRate}%`
                : '— (원가/할인 상품을 모두 선택하세요)'}
            </Typography>
            {origin && sale && (
              <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                원가 {origin.applePrice?.displayPrice ?? `${origin.price.toLocaleString()} ${origin.currency}`}
                {' → '}
                할인가 {sale.applePrice?.displayPrice ?? `${sale.price.toLocaleString()} ${sale.currency}`}
              </Typography>
            )}
          </Box>

          <Divider />

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
