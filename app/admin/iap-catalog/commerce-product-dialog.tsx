'use client';

import { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type {
  CommerceCatalogProduct,
  CommerceEntitlement,
  CommerceProductType,
  CreateCommerceProductRequest,
} from '@/types/admin';

export interface CommerceProductFormValue extends CreateCommerceProductRequest {}

interface CommerceProductDialogProps {
  open: boolean;
  product?: CommerceCatalogProduct | null;
  counterpart?: CommerceCatalogProduct | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (value: CommerceProductFormValue) => void;
}

const INITIAL_FORM: CommerceProductFormValue = {
  productKey: '',
  productType: 'CONSUMABLE',
  localizations: [
    { country: 'KR', displayName: '', description: '' },
    { country: 'JP', displayName: '', description: '' },
  ],
  entitlements: [{ type: 'GEM', key: 'gem', quantity: 1 }],
  sortOrder: 0,
  uiMetadata: {},
};

const PRODUCT_TYPE_LABELS: Record<CommerceProductType, string> = {
  CONSUMABLE: '소모성 상품',
  BUNDLE: '복합 번들',
  DURATION_ACCESS: '기간제 권한',
  FEATURE_UNLOCK: '영구 기능 해제',
};

const ENTITLEMENT_LABELS: Record<CommerceEntitlement['type'], string> = {
  GEM: '구슬',
  TICKET: '티켓',
  DURATION_ACCESS: '기간제 권한',
  FEATURE_UNLOCK: '기능 해제',
};

export default function CommerceProductDialog({
  open,
  product,
  counterpart,
  loading,
  onClose,
  onSubmit,
}: CommerceProductDialogProps) {
  const [form, setForm] = useState<CommerceProductFormValue>(INITIAL_FORM);

  useEffect(() => {
    if (!open) return;
    if (!product) {
      setForm(INITIAL_FORM);
      return;
    }
    const kr = product;
    const jp = counterpart;
    setForm({
      productKey: product.product_key,
      productType: product.product_type,
      localizations: [
        {
          country: 'KR',
          displayName: kr?.display_name ?? product.display_name,
          description: kr?.description ?? '',
        },
        {
          country: 'JP',
          displayName: jp?.display_name ?? counterpart?.display_name ?? '',
          description: jp?.description ?? '',
        },
      ],
      entitlements: product.entitlements.map((item) => ({
        type: item.type,
        key: item.key,
        quantity: item.quantity ?? undefined,
        durationSeconds: item.durationSeconds ?? undefined,
        metadata: item.metadata,
      })),
      sortOrder: product.sort_order,
      uiMetadata: product.ui_metadata,
    });
  }, [counterpart, open, product]);

  const entitlement = form.entitlements[0] ?? INITIAL_FORM.entitlements[0];
  const kr = form.localizations[0];
  const jp = form.localizations[1];
  const valid =
    form.productKey.length >= 3 &&
    Boolean(kr?.displayName.trim()) &&
    Boolean(jp?.displayName.trim()) &&
    Boolean(entitlement?.key.trim()) &&
    (entitlement.type === 'DURATION_ACCESS'
      ? (entitlement.durationSeconds ?? 0) > 0
      : entitlement.type === 'FEATURE_UNLOCK' || (entitlement.quantity ?? 0) > 0);

  const updateLocalization = (index: number, key: 'displayName' | 'description', value: string) => {
    setForm((current) => ({
      ...current,
      localizations: current.localizations.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    }));
  };

  const updateEntitlement = (patch: Partial<CommerceProductFormValue['entitlements'][number]>) => {
    setForm((current) => ({
      ...current,
      entitlements: [{ ...current.entitlements[0], ...patch }],
    }));
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>{product ? '상품 Draft 편집' : '표준 상품 Draft 생성'}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label="안정적인 상품 키"
              value={form.productKey}
              disabled={Boolean(product)}
              fullWidth
              helperText="생성 후 변경할 수 없습니다. 예: gem_std_150"
              onChange={(event) => setForm((current) => ({ ...current, productKey: event.target.value }))}
            />
            <FormControl fullWidth>
              <InputLabel>상품 유형</InputLabel>
              <Select
                label="상품 유형"
                value={form.productType}
                disabled={Boolean(product)}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    productType: event.target.value as CommerceProductType,
                  }))
                }
              >
                {Object.entries(PRODUCT_TYPE_LABELS).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Typography variant="subtitle2" fontWeight={700}>
            국가별 표시 정보
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Stack spacing={2} flex={1}>
              <TextField
                label="KR 상품명"
                value={kr?.displayName ?? ''}
                onChange={(event) => updateLocalization(0, 'displayName', event.target.value)}
              />
              <TextField
                label="KR 설명"
                value={kr?.description ?? ''}
                multiline
                minRows={2}
                onChange={(event) => updateLocalization(0, 'description', event.target.value)}
              />
            </Stack>
            <Stack spacing={2} flex={1}>
              <TextField
                label="JP 상품명"
                value={jp?.displayName ?? ''}
                onChange={(event) => updateLocalization(1, 'displayName', event.target.value)}
              />
              <TextField
                label="JP 설명"
                value={jp?.description ?? ''}
                multiline
                minRows={2}
                onChange={(event) => updateLocalization(1, 'description', event.target.value)}
              />
            </Stack>
          </Stack>

          <Typography variant="subtitle2" fontWeight={700}>
            지급 혜택
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <FormControl fullWidth>
              <InputLabel>혜택 유형</InputLabel>
              <Select
                label="혜택 유형"
                value={entitlement.type}
                onChange={(event) =>
                  updateEntitlement({
                    type: event.target.value as CommerceEntitlement['type'],
                    quantity: event.target.value === 'FEATURE_UNLOCK' ? undefined : 1,
                    durationSeconds: event.target.value === 'DURATION_ACCESS' ? 86400 : undefined,
                  })
                }
              >
                {Object.entries(ENTITLEMENT_LABELS).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="혜택 키"
              value={entitlement.key}
              fullWidth
              onChange={(event) => updateEntitlement({ key: event.target.value })}
            />
            {entitlement.type === 'DURATION_ACCESS' ? (
              <TextField
                label="기간(초)"
                type="number"
                value={entitlement.durationSeconds ?? ''}
                fullWidth
                onChange={(event) => updateEntitlement({ durationSeconds: Number(event.target.value) })}
              />
            ) : entitlement.type !== 'FEATURE_UNLOCK' ? (
              <TextField
                label="수량"
                type="number"
                value={entitlement.quantity ?? ''}
                fullWidth
                onChange={(event) => updateEntitlement({ quantity: Number(event.target.value) })}
              />
            ) : null}
          </Stack>

          <TextField
            label="정렬 순서"
            type="number"
            value={form.sortOrder}
            sx={{ maxWidth: 220 }}
            onChange={(event) => setForm((current) => ({ ...current, sortOrder: Number(event.target.value) }))}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          취소
        </Button>
        <Button variant="contained" disabled={!valid || loading} onClick={() => onSubmit(form)}>
          {loading ? '저장 중…' : product ? 'Draft 저장' : 'Draft 생성'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
