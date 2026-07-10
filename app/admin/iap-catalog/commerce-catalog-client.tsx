'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import AdminService from '@/app/services/admin';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';
import { useToast } from '@/shared/ui/admin/toast';
import type { CommerceCatalogProduct, CommerceProvider } from '@/types/admin';
import CommerceProductDialog, {
  type CommerceProductFormValue,
} from './commerce-product-dialog';
import LegacyAppleCatalogClient from './iap-catalog-client';
import ProviderOperationsDialog, {
  type AppleRegistrationValue,
  type PlayRegistrationValue,
} from './provider-operations-dialog';

type Region = 'KR' | 'JP';

const PROVIDER_LABELS: Record<CommerceProvider, string> = {
  APPLE_IAP: 'Apple',
  GOOGLE_PLAY: 'Play',
  PORTONE: 'PortOne',
};

function isStoreReady(product: CommerceCatalogProduct) {
  const mappings = product.provider_mappings ?? [];
  const apple = mappings.find((mapping) => mapping.provider === 'APPLE_IAP');
  const play = mappings.find((mapping) => mapping.provider === 'GOOGLE_PLAY');
  const web = mappings.find((mapping) => mapping.channel === 'WEB');
  return apple?.storeState === 'APPROVED' && play?.storeState === 'ACTIVE' && Boolean(web?.active);
}

function providerColor(state: string) {
  if (state === 'APPROVED' || state === 'ACTIVE') return 'success' as const;
  if (state === 'READY_TO_SUBMIT' || state === 'WAITING_FOR_REVIEW') return 'warning' as const;
  return 'default' as const;
}

export default function CommerceCatalogClient() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [topTab, setTopTab] = useState<'commerce' | 'legacy'>('commerce');
  const [region, setRegion] = useState<Region>('KR');
  const [showInactive, setShowInactive] = useState(false);
  const [productDialog, setProductDialog] = useState<CommerceCatalogProduct | null | 'create'>(null);
  const [providerProduct, setProviderProduct] = useState<CommerceCatalogProduct | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [appleSubmitOpen, setAppleSubmitOpen] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const catalogQuery = useQuery({
    queryKey: ['admin', 'commerce-catalog'],
    queryFn: () => AdminService.iapCatalog.getCommerceProducts(),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'commerce-catalog'] });
  const withError = (fallback: string) => (error: unknown) => {
    setBusyAction(null);
    toast.error(getAdminErrorMessage(error, fallback));
  };

  const createMutation = useMutation({
    mutationFn: (value: CommerceProductFormValue) =>
      AdminService.iapCatalog.createCommerceProduct(value),
    onSuccess: async () => {
      toast.success('KR/JP 상품 Draft를 생성했습니다.');
      setProductDialog(null);
      await invalidate();
    },
    onError: withError('상품 Draft 생성에 실패했습니다.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ versionId, value }: { versionId: string; value: CommerceProductFormValue }) =>
      AdminService.iapCatalog.updateCommerceDraft(versionId, {
        localizations: value.localizations,
        entitlements: value.entitlements,
        sortOrder: value.sortOrder,
        uiMetadata: value.uiMetadata,
      }),
    onSuccess: async () => {
      toast.success('KR/JP Draft를 수정했습니다.');
      setProductDialog(null);
      await invalidate();
    },
    onError: withError('Draft 수정에 실패했습니다.'),
  });

  const activeMutation = useMutation({
    mutationFn: ({ productId, isActive }: { productId: string; isActive: boolean }) =>
      AdminService.iapCatalog.setCommerceProductActive(productId, isActive),
    onSuccess: async (result) => {
      toast.success(result.isActive ? '상품을 활성화했습니다.' : '상품을 비활성화했습니다.');
      await invalidate();
    },
    onError: withError('상품 활성 상태 변경에 실패했습니다.'),
  });

  const cloneMutation = useMutation({
    mutationFn: ({ krProductId, jpProductId }: { krProductId: string; jpProductId: string }) =>
      AdminService.iapCatalog.cloneCommerceVersion(krProductId, jpProductId),
    onSuccess: async () => {
      toast.success('새 KR/JP Draft 버전을 만들었습니다.');
      await invalidate();
    },
    onError: withError('Draft 복제에 실패했습니다.'),
  });

  const publishMutation = useMutation({
    mutationFn: (body: { krProductVersionIds: string[]; jpProductVersionIds: string[] }) =>
      AdminService.iapCatalog.publishCommerceCatalog(body),
    onSuccess: async (result) => {
      toast.success(`카탈로그 발행 완료 · KR v${result.KR.version}, JP v${result.JP.version}`);
      setPublishOpen(false);
      await invalidate();
    },
    onError: withError('카탈로그 발행에 실패했습니다.'),
  });

  const providerMutation = useMutation({
    mutationFn: async (task: () => Promise<unknown>) => task(),
    onSuccess: async () => {
      toast.success('스토어 작업을 완료했습니다.');
      setBusyAction(null);
      await invalidate();
    },
    onError: withError('스토어 작업에 실패했습니다.'),
  });

  const data = catalogQuery.data;
  const products = data?.[region] ?? [];
  const counterpartRegion: Region = region === 'KR' ? 'JP' : 'KR';
  const krByKey = useMemo(
    () => new Map((data?.KR ?? []).map((item) => [item.product_key, item])),
    [data],
  );
  const jpByKey = useMemo(
    () => new Map((data?.JP ?? []).map((item) => [item.product_key, item])),
    [data],
  );
  const counterpartByKey = useMemo(
    () => new Map((data?.[counterpartRegion] ?? []).map((item) => [item.product_key, item])),
    [counterpartRegion, data],
  );
  const visibleProducts = products.filter((product) => showInactive || product.is_active);
  const activeKR = (data?.KR ?? []).filter((product) => product.is_active);
  const activeJP = (data?.JP ?? []).filter((product) => product.is_active);
  const readyKR = activeKR.filter(isStoreReady);
  const readyJP = activeJP.filter(isStoreReady);
  const publishReady =
    activeKR.length > 0 &&
    activeJP.length > 0 &&
    activeKR.length === readyKR.length &&
    activeJP.length === readyJP.length;

  const selectedProduct = productDialog === 'create' ? null : productDialog;
  const currentProduct = selectedProduct
    ? krByKey.get(selectedProduct.product_key) ?? selectedProduct
    : null;
  const currentCounterpart = selectedProduct
    ? jpByKey.get(selectedProduct.product_key) ?? null
    : null;
  const normalizedProviderProduct = providerProduct
    ? krByKey.get(providerProduct.product_key) ?? providerProduct
    : null;
  const providerCounterpart = providerProduct
    ? jpByKey.get(providerProduct.product_key) ?? null
    : null;

  const runProvider = (action: string, task: () => Promise<unknown>) => {
    setBusyAction(action);
    providerMutation.mutate(task);
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2} mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={800}>
            상품 카탈로그
          </Typography>
          <Typography variant="body2" color="text.secondary">
            비즈니스 상품을 만들고 Apple·Google Play·Web 결제를 연결한 뒤 앱 카탈로그로 발행합니다.
          </Typography>
        </Box>
        {topTab === 'commerce' && (
          <Stack direction="row" spacing={1} alignItems="center">
            <Button variant="outlined" onClick={() => catalogQuery.refetch()} disabled={catalogQuery.isFetching}>
              새로고침
            </Button>
            <Button variant="outlined" onClick={() => setPublishOpen(true)}>
              발행 검토
            </Button>
            <Button variant="contained" onClick={() => setProductDialog('create')}>
              상품 Draft 생성
            </Button>
          </Stack>
        )}
      </Stack>

      <Tabs value={topTab} onChange={(_, value) => setTopTab(value)} sx={{ mb: 3 }}>
        <Tab value="commerce" label="표준 상품 카탈로그" />
        <Tab value="legacy" label="Apple 미러·레거시 매핑" />
      </Tabs>

      {topTab === 'legacy' ? (
        <LegacyAppleCatalogClient />
      ) : (
        <Stack spacing={3}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Card variant="outlined" sx={{ flex: 1 }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  KR 상품
                </Typography>
                <Typography variant="h5" fontWeight={800}>
                  {data?.KR.length ?? 0}
                </Typography>
                <Typography variant="caption">발행 준비 {readyKR.length}/{activeKR.length}</Typography>
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ flex: 1 }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  JP 상품
                </Typography>
                <Typography variant="h5" fontWeight={800}>
                  {data?.JP.length ?? 0}
                </Typography>
                <Typography variant="caption">발행 준비 {readyJP.length}/{activeJP.length}</Typography>
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ flex: 1 }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  최종 발행 조건
                </Typography>
                <Typography variant="h6" fontWeight={800} color={publishReady ? 'success.main' : 'warning.main'}>
                  {publishReady ? '준비 완료' : '스토어 연결 필요'}
                </Typography>
                <Typography variant="caption">Apple 승인 · Play 활성 · Web 매핑</Typography>
              </CardContent>
            </Card>
          </Stack>

          {!publishReady && (
            <Alert severity="info">
              활성 상품 전체가 Apple 승인, Google Play 활성, Web 매핑을 갖춰야 발행할 수 있습니다.
              준비되지 않은 상품은 아래 스토어 연결에서 확인하세요.
            </Alert>
          )}

          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" gap={2}>
            <Tabs value={region} onChange={(_, value) => setRegion(value)}>
              <Tab value="KR" label={`KR (${data?.KR.length ?? 0})`} />
              <Tab value="JP" label={`JP (${data?.JP.length ?? 0})`} />
            </Tabs>
            <FormControlLabel
              control={<Switch checked={showInactive} onChange={(event) => setShowInactive(event.target.checked)} />}
              label="비활성 상품 포함"
            />
          </Stack>

          {catalogQuery.isError && (
            <Alert severity="error">
              {getAdminErrorMessage(catalogQuery.error, '상품 카탈로그를 불러오지 못했습니다.')}
            </Alert>
          )}

          {catalogQuery.isLoading ? (
            <Box display="flex" justifyContent="center" py={8}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Card} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>상품</TableCell>
                    <TableCell>버전</TableCell>
                    <TableCell>지급 혜택</TableCell>
                    <TableCell>스토어 연결</TableCell>
                    <TableCell>노출</TableCell>
                    <TableCell align="right">작업</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleProducts.map((product) => {
                    const counterpart = counterpartByKey.get(product.product_key);
                    const entitlement = product.entitlements[0];
                    return (
                      <TableRow key={product.product_version_id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700}>
                            {product.display_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                            {product.product_key}
                          </Typography>
                          {!counterpart && (
                            <Typography variant="caption" color="error" display="block">
                              {counterpartRegion} 대응 상품 없음
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip size="small" label={`v${product.version}`} variant="outlined" />
                            <Chip
                              size="small"
                              label={product.status}
                              color={product.status === 'PUBLISHED' ? 'success' : product.status === 'DRAFT' ? 'warning' : 'default'}
                            />
                          </Stack>
                        </TableCell>
                        <TableCell>
                          {entitlement ? (
                            <Typography variant="body2">
                              {entitlement.type} · {entitlement.key}
                              {entitlement.quantity ? ` × ${entitlement.quantity.toLocaleString()}` : ''}
                            </Typography>
                          ) : (
                            <Chip size="small" label="혜택 없음" color="error" />
                          )}
                        </TableCell>
                        <TableCell sx={{ minWidth: 250 }}>
                          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                            {(product.provider_mappings ?? []).map((mapping) => (
                              <Chip
                                key={`${mapping.provider}-${mapping.channel}-${mapping.externalProductId}`}
                                size="small"
                                variant="outlined"
                                color={providerColor(mapping.storeState)}
                                label={`${PROVIDER_LABELS[mapping.provider]} · ${mapping.channel} · ${mapping.storeState}`}
                              />
                            ))}
                            {(product.provider_mappings ?? []).length === 0 && (
                              <Chip size="small" label="미연결" color="warning" />
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={product.is_active ? '활성' : '비활성'}
                            color={product.is_active ? 'success' : 'default'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            {product.status === 'DRAFT' ? (
                              <Button size="small" onClick={() => setProductDialog(product)}>
                                편집
                              </Button>
                            ) : (
                              <Button
                                size="small"
                                disabled={!counterpart || cloneMutation.isPending}
                                onClick={() => {
                                  const krProduct = region === 'KR' ? product : counterpart;
                                  const jpProduct = region === 'JP' ? product : counterpart;
                                  if (krProduct && jpProduct) {
                                    cloneMutation.mutate({
                                      krProductId: krProduct.id,
                                      jpProductId: jpProduct.id,
                                    });
                                  }
                                }}
                              >
                                새 Draft
                              </Button>
                            )}
                            <Button size="small" variant="outlined" onClick={() => setProviderProduct(product)}>
                              스토어 연결
                            </Button>
                            <Button
                              size="small"
                              color={product.is_active ? 'warning' : 'success'}
                              disabled={activeMutation.isPending}
                              onClick={() => {
                                const next = !product.is_active;
                                activeMutation.mutate({ productId: product.id, isActive: next });
                              }}
                            >
                              {product.is_active ? '비활성화' : '활성화'}
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Stack>
      )}

      <CommerceProductDialog
        open={productDialog !== null}
        product={currentProduct}
        counterpart={currentCounterpart}
        loading={createMutation.isPending || updateMutation.isPending}
        onClose={() => setProductDialog(null)}
        onSubmit={(value) => {
          if (currentProduct) {
            updateMutation.mutate({ versionId: currentProduct.product_version_id, value });
          } else {
            createMutation.mutate(value);
          }
        }}
      />

      <ProviderOperationsDialog
        open={providerProduct !== null}
        product={normalizedProviderProduct}
        counterpart={providerCounterpart}
        busyAction={busyAction}
        onClose={() => setProviderProduct(null)}
        onRegisterApple={(value: AppleRegistrationValue) =>
          normalizedProviderProduct &&
          runProvider('Apple 상품 등록', () =>
            AdminService.iapCatalog.registerAppleProduct(normalizedProviderProduct.product_version_id, value),
          )
        }
        onRegisterPlay={(value: PlayRegistrationValue) =>
          normalizedProviderProduct &&
          runProvider('Google Play 상품 등록', () =>
            AdminService.iapCatalog.registerGooglePlayProduct(normalizedProviderProduct.product_version_id, value),
          )
        }
        onSync={(provider) => {
          if (!normalizedProviderProduct) return;
          runProvider(
            `${provider === 'APPLE_IAP' ? 'Apple' : 'Google Play'} 동기화`,
            () =>
              provider === 'APPLE_IAP'
                ? AdminService.iapCatalog.syncAppleCatalogStatus(normalizedProviderProduct.product_version_id)
                : AdminService.iapCatalog.syncGooglePlayStatus(normalizedProviderProduct.product_version_id),
          );
        }}
        onPlayState={(state) =>
          normalizedProviderProduct &&
          runProvider(`Google Play ${state}`, () =>
            AdminService.iapCatalog.setGooglePlayState(normalizedProviderProduct.product_version_id, state),
          )
        }
        onAppleScreenshot={(file) =>
          normalizedProviderProduct &&
          runProvider('Apple 심사 스크린샷 업로드', () =>
            AdminService.iapCatalog.uploadAppleReviewScreenshot(normalizedProviderProduct.product_version_id, file),
          )
        }
        onAppleSubmit={() => setAppleSubmitOpen(true)}
      />

      <Dialog open={appleSubmitOpen} onClose={() => setAppleSubmitOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Apple IAP 심사 요청</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            심사 스크린샷과 상품 메타데이터를 Apple에 제출합니다. 최종 승인 여부와 일정은 Apple이 결정합니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAppleSubmitOpen(false)}>취소</Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => {
              if (!normalizedProviderProduct) return;
              setAppleSubmitOpen(false);
              runProvider('Apple 심사 요청', () =>
                AdminService.iapCatalog.submitAppleReview(normalizedProviderProduct.product_version_id),
              );
            }}
          >
            심사 요청
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={publishOpen} onClose={() => setPublishOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>앱 카탈로그 발행 검토</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Alert severity={publishReady ? 'success' : 'warning'}>
              {publishReady
                ? `KR ${activeKR.length}개, JP ${activeJP.length}개 상품을 immutable snapshot으로 발행합니다.`
                : '활성 상품 중 스토어 연결이 완료되지 않은 상품이 있어 발행할 수 없습니다.'}
            </Alert>
            <Divider />
            <Typography variant="body2">KR 준비: {readyKR.length}/{activeKR.length}</Typography>
            <Typography variant="body2">JP 준비: {readyJP.length}/{activeJP.length}</Typography>
            <Typography variant="caption" color="text.secondary">
              발행하면 이전 카탈로그는 보관되고 구매 화면은 새 버전을 사용합니다. 결제 당시 가격과 혜택은 별도 스냅샷으로 보존됩니다.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPublishOpen(false)}>취소</Button>
          <Button
            variant="contained"
            color="success"
            disabled={!publishReady || publishMutation.isPending}
            onClick={() =>
              publishMutation.mutate({
                krProductVersionIds: activeKR.map((product) => product.product_version_id),
                jpProductVersionIds: activeJP.map((product) => product.product_version_id),
              })
            }
          >
            {publishMutation.isPending ? '발행 중…' : 'KR/JP 동시 발행'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
