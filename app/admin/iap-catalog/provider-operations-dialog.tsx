'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import type { CommerceCatalogProduct, CommerceProviderMapping } from '@/types/admin';

type Provider = 'APPLE_IAP' | 'GOOGLE_PLAY';

export interface AppleRegistrationValue {
  productId: string;
  referenceName: string;
  appleProductType: 'CONSUMABLE' | 'NON_CONSUMABLE' | 'NON_RENEWING_SUBSCRIPTION';
  reviewNote: string;
  localizations: Array<{ locale: 'ko' | 'ja'; name: string; description: string }>;
  priceKRW: number;
  priceJPY: number;
}

export interface PlayRegistrationValue {
  productId: string;
  purchaseOptionId: string;
  localizations: Array<{
    languageCode: 'ko-KR' | 'ja-JP';
    title: string;
    description: string;
  }>;
  priceKRW: number;
  priceJPY: number;
  legacyCompatible: boolean;
}

interface ProviderOperationsDialogProps {
  open: boolean;
  product: CommerceCatalogProduct | null;
  counterpart: CommerceCatalogProduct | null;
  busyAction?: string | null;
  onClose: () => void;
  onRegisterApple: (value: AppleRegistrationValue) => void;
  onRegisterPlay: (value: PlayRegistrationValue) => void;
  onSync: (provider: Provider) => void;
  onPlayState: (state: 'ACTIVE' | 'INACTIVE') => void;
  onAppleScreenshot: (file: File) => void;
  onAppleSubmit: () => void;
}

function mappingFor(product: CommerceCatalogProduct | null, provider: Provider) {
  return product?.provider_mappings?.find((mapping) => mapping.provider === provider) ?? null;
}

function priceFor(mapping: CommerceProviderMapping | null, storefront: 'KOR' | 'JPN') {
  return mapping?.prices?.find((price) => price.storefront === storefront)?.amount ?? 0;
}

function appleTypeFor(product: CommerceCatalogProduct) {
  if (product.product_type === 'FEATURE_UNLOCK') return 'NON_CONSUMABLE' as const;
  if (product.product_type === 'DURATION_ACCESS') return 'NON_RENEWING_SUBSCRIPTION' as const;
  return 'CONSUMABLE' as const;
}

export default function ProviderOperationsDialog({
  open,
  product,
  counterpart,
  busyAction,
  onClose,
  onRegisterApple,
  onRegisterPlay,
  onSync,
  onPlayState,
  onAppleScreenshot,
  onAppleSubmit,
}: ProviderOperationsDialogProps) {
  const [provider, setProvider] = useState<Provider>('APPLE_IAP');
  const appleMapping = mappingFor(product, 'APPLE_IAP');
  const playMapping = mappingFor(product, 'GOOGLE_PLAY');
  const counterpartApple = mappingFor(counterpart, 'APPLE_IAP');
  const counterpartPlay = mappingFor(counterpart, 'GOOGLE_PLAY');
  const productKey = product?.product_key.replace(/^apple:/, '').replace(/^legacy:/, '') ?? '';
  const [productId, setProductId] = useState(productKey);
  const [purchaseOptionId, setPurchaseOptionId] = useState('standard-buy');
  const [priceKRW, setPriceKRW] = useState(0);
  const [priceJPY, setPriceJPY] = useState(0);
  const [legacyCompatible, setLegacyCompatible] = useState(true);
  const [reviewNote, setReviewNote] = useState('표준 상품 카탈로그의 디지털 상품입니다.');

  useEffect(() => {
    if (!open || !product) return;
    const activeMapping = provider === 'APPLE_IAP' ? appleMapping : playMapping;
    setProductId(activeMapping?.externalProductId ?? productKey);
    setPurchaseOptionId(activeMapping?.purchaseOptionId ?? 'standard-buy');
    const krMapping = provider === 'APPLE_IAP' ? appleMapping : playMapping;
    const jpMapping = provider === 'APPLE_IAP' ? counterpartApple : counterpartPlay;
    setPriceKRW(priceFor(krMapping, 'KOR'));
    setPriceJPY(priceFor(jpMapping, 'JPN'));
  }, [
    appleMapping,
    counterpartApple,
    counterpartPlay,
    open,
    playMapping,
    product,
    productKey,
    provider,
  ]);

  const mapping = provider === 'APPLE_IAP' ? appleMapping : playMapping;
  const isDraft = product?.status === 'DRAFT';
  const hasCounterpart = Boolean(counterpart);
  const valid = hasCounterpart && Boolean(productId.trim()) && priceKRW > 0 && priceJPY > 0;
  const isBusy = Boolean(busyAction);
  const providerLabel = provider === 'APPLE_IAP' ? 'Apple IAP' : 'Google Play';
  const statusColor = mapping?.storeState === 'APPROVED' || mapping?.storeState === 'ACTIVE' ? 'success' : 'default';
  const display = useMemo(
    () => ({ kr: product?.display_name ?? '', jp: counterpart?.display_name ?? '' }),
    [counterpart?.display_name, product?.display_name],
  );

  if (!product) return null;

  return (
    <Dialog open={open} onClose={isBusy ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>스토어 연결 · {product.product_key}</DialogTitle>
      <DialogContent>
        <Tabs value={provider} onChange={(_, value: Provider) => setProvider(value)} sx={{ mb: 3 }}>
          <Tab value="APPLE_IAP" label="Apple IAP" />
          <Tab value="GOOGLE_PLAY" label="Google Play" />
        </Tabs>

        <Stack spacing={3}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Typography variant="subtitle2">현재 연결</Typography>
            {mapping ? (
              <>
                <Chip size="small" label={mapping.externalProductId} variant="outlined" />
                {mapping.purchaseOptionId && (
                  <Chip size="small" label={mapping.purchaseOptionId} variant="outlined" />
                )}
                <Chip size="small" label={mapping.storeState} color={statusColor} />
              </>
            ) : (
              <Chip size="small" label="미연결" />
            )}
          </Stack>

          {!isDraft && !mapping && (
            <Alert severity="warning">
              발행된 버전에는 새 스토어 상품을 연결할 수 없습니다. 새 Draft를 복제한 뒤 등록하세요.
            </Alert>
          )}

          {!hasCounterpart && !mapping && (
            <Alert severity="error">
              JP 대응 상품이 없어 KOR/JPN 동시 등록을 진행할 수 없습니다. 먼저 KR/JP 상품 쌍을 완성하세요.
            </Alert>
          )}

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label={`${providerLabel} 상품 ID`}
              value={productId}
              fullWidth
              disabled={Boolean(mapping) || !isDraft}
              onChange={(event) => setProductId(event.target.value)}
            />
            {provider === 'GOOGLE_PLAY' && (
              <TextField
                label="구매 옵션 ID"
                value={purchaseOptionId}
                fullWidth
                disabled={Boolean(mapping) || !isDraft}
                onChange={(event) => setPurchaseOptionId(event.target.value)}
              />
            )}
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label="KR 가격(KRW)"
              type="number"
              value={priceKRW || ''}
              fullWidth
              disabled={!isDraft || Boolean(mapping)}
              onChange={(event) => setPriceKRW(Number(event.target.value))}
            />
            <TextField
              label="JP 가격(JPY)"
              type="number"
              value={priceJPY || ''}
              fullWidth
              disabled={!isDraft || Boolean(mapping)}
              onChange={(event) => setPriceJPY(Number(event.target.value))}
            />
          </Stack>

          {provider === 'GOOGLE_PLAY' ? (
            <FormControlLabel
              control={
                <Switch
                  checked={legacyCompatible}
                  disabled={!isDraft || Boolean(mapping)}
                  onChange={(event) => setLegacyCompatible(event.target.checked)}
                />
              }
              label="기존 Play Billing 상품 조회 방식과 호환"
            />
          ) : (
            <TextField
              label="Apple 심사 메모"
              value={reviewNote}
              multiline
              minRows={2}
              disabled={!isDraft || Boolean(mapping)}
              onChange={(event) => setReviewNote(event.target.value)}
            />
          )}

          {isDraft && !mapping && (
            <Button
              variant="contained"
              disabled={!valid || isBusy}
              onClick={() => {
                if (provider === 'APPLE_IAP') {
                  onRegisterApple({
                    productId,
                    referenceName: product.product_key.slice(0, 64),
                    appleProductType: appleTypeFor(product),
                    reviewNote,
                    localizations: [
                      { locale: 'ko', name: display.kr.slice(0, 64), description: (product.description || display.kr).slice(0, 255) },
                      { locale: 'ja', name: display.jp.slice(0, 64), description: (counterpart?.description || display.jp).slice(0, 255) },
                    ],
                    priceKRW,
                    priceJPY,
                  });
                } else {
                  onRegisterPlay({
                    productId,
                    purchaseOptionId,
                    localizations: [
                      { languageCode: 'ko-KR', title: display.kr.slice(0, 55), description: (product.description || display.kr).slice(0, 200) },
                      { languageCode: 'ja-JP', title: display.jp.slice(0, 55), description: (counterpart?.description || display.jp).slice(0, 200) },
                    ],
                    priceKRW,
                    priceJPY,
                    legacyCompatible,
                  });
                }
              }}
            >
              {isBusy ? `${busyAction} 처리 중…` : `${providerLabel} 등록`}
            </Button>
          )}

          {mapping && (
            <>
              <Divider />
              <Typography variant="subtitle2" fontWeight={700}>
                운영 작업
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap">
                <Button variant="outlined" disabled={isBusy} onClick={() => onSync(provider)}>
                  상태·가격 동기화
                </Button>
                {provider === 'GOOGLE_PLAY' && mapping.storeState !== 'ACTIVE' && (
                  <Button variant="contained" color="success" disabled={isBusy} onClick={() => onPlayState('ACTIVE')}>
                    구매 옵션 활성화
                  </Button>
                )}
                {provider === 'GOOGLE_PLAY' && mapping.storeState === 'ACTIVE' && (
                  <Button variant="outlined" color="warning" disabled={isBusy} onClick={() => onPlayState('INACTIVE')}>
                    구매 옵션 비활성화
                  </Button>
                )}
                {provider === 'APPLE_IAP' && (
                  <Button component="label" variant="outlined" disabled={isBusy}>
                    심사 스크린샷 업로드
                    <input
                      hidden
                      type="file"
                      accept="image/png,image/jpeg"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) onAppleScreenshot(file);
                        event.target.value = '';
                      }}
                    />
                  </Button>
                )}
                {provider === 'APPLE_IAP' && mapping.storeState === 'READY_TO_SUBMIT' && (
                  <Button variant="contained" color="success" disabled={isBusy} onClick={onAppleSubmit}>
                    Apple 심사 요청
                  </Button>
                )}
              </Stack>
              {busyAction && <Alert severity="info">{busyAction} 작업을 처리하고 있습니다.</Alert>}
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isBusy}>
          닫기
        </Button>
      </DialogActions>
    </Dialog>
  );
}
