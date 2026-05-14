'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminService from '@/app/services/admin';
import { useToast } from '@/shared/ui/admin/toast';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';
import { useAdminSession } from '@/shared/contexts/admin-session-context';
import type { AdminGemProduct, AppleIapPriceSource } from '@/types/admin';

const SOURCE_LABELS: Record<AppleIapPriceSource, string> = {
  connect_api: 'Connect API',
  app_observed: '앱 관측',
  manual: '수동',
};

const SOURCE_COLORS: Record<
  AppleIapPriceSource,
  'success' | 'info' | 'warning' | 'default'
> = {
  connect_api: 'success',
  app_observed: 'info',
  manual: 'warning',
};

const COUNTRY_DISPLAY: Record<string, { flag: string; label: string; storefront: 'KOR' | 'JPN' }> = {
  kr: { flag: '🇰🇷', label: '대한민국', storefront: 'KOR' },
  jp: { flag: '🇯🇵', label: '日本', storefront: 'JPN' },
};

function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

function formatGemProductLabel(product: AdminGemProduct): string {
  const price = product.applePrice?.displayPrice ?? `${product.price.toLocaleString()} ${product.currency}`;
  const sku = product.appleSku ? ` · ${product.appleSku}` : '';
  return `${product.productName} (${product.totalGems}구슬, ${price})${sku}`;
}

export default function IapCatalogClient() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { session } = useAdminSession();
  const country = session?.selectedCountry ?? 'kr';
  const countryDisplay = COUNTRY_DISPLAY[country] ?? COUNTRY_DISPLAY.kr;
  const storefront = countryDisplay.storefront;
  const [selectedProductBySku, setSelectedProductBySku] = useState<Record<string, string>>({});

  const iapProductsQuery = useQuery({
    queryKey: ['admin', 'iap-catalog', 'products', country, storefront],
    queryFn: () => AdminService.iapCatalog.getProducts(storefront),
  });

  const pricePointsQuery = useQuery({
    queryKey: ['admin', 'iap-catalog', 'price-points', country, storefront],
    queryFn: () => AdminService.iapCatalog.getPricePoints(storefront),
  });

  const gemProductsQuery = useQuery({
    queryKey: ['admin', 'gem-products', 'list', country],
    queryFn: () => AdminService.gemProducts.getList(),
  });

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const product of iapProductsQuery.data ?? []) {
      if (product.mappedGemProductId) next[product.sku] = product.mappedGemProductId;
    }
    setSelectedProductBySku(next);
  }, [iapProductsQuery.data]);

  const syncMutation = useMutation({
    mutationFn: () => AdminService.iapCatalog.syncApplePrices(),
    onSuccess: (result) => {
      toast.success(
        `동기화 완료 (상품 ${result.productsSynced ?? 0}개, 가격 ${
          result.pricePointsSynced ?? result.synced
        }건${result.failed.length ? `, 실패 ${result.failed.length}건` : ''})`,
      );
      queryClient.invalidateQueries({ queryKey: ['admin', 'iap-catalog'] });
    },
    onError: (error: unknown) => {
      toast.error(getAdminErrorMessage(error, '동기화에 실패했습니다.'));
    },
  });

  const mapMutation = useMutation({
    mutationFn: ({ sku, productId }: { sku: string; productId: string }) =>
      AdminService.iapCatalog.mapAppleSkuToGemProduct(productId, sku),
    onSuccess: () => {
      toast.success('Apple SKU 매핑을 저장했습니다.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'iap-catalog', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'gem-products', 'list'] });
    },
    onError: (error: unknown) => {
      toast.error(getAdminErrorMessage(error, 'Apple SKU 매핑에 실패했습니다.'));
    },
  });

  const gemProducts = useMemo(() => gemProductsQuery.data ?? [], [gemProductsQuery.data]);
  const iapProducts = iapProductsQuery.data ?? [];
  const pricePoints = pricePointsQuery.data ?? [];
  const loading = iapProductsQuery.isLoading || gemProductsQuery.isLoading;

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight="bold">
            IAP 카탈로그
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {countryDisplay.flag} {countryDisplay.label} · App Store Connect 상품과 구슬 상품 매핑
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
        >
          {syncMutation.isPending ? (
            <CircularProgress size={20} sx={{ color: 'white' }} />
          ) : (
            'Apple IAP 동기화'
          )}
        </Button>
      </Box>

      {(iapProductsQuery.isError || gemProductsQuery.isError) && (
        <Typography color="error" sx={{ mb: 2 }}>
          {getAdminErrorMessage(
            iapProductsQuery.error ?? gemProductsQuery.error,
            'IAP 상품 목록을 불러오지 못했습니다.',
          )}
        </Typography>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Apple SKU</TableCell>
                <TableCell>상품명</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>가격</TableCell>
                <TableCell>구슬 상품 매핑</TableCell>
                <TableCell align="right">액션</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {iapProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary" py={2}>
                      동기화된 Apple IAP 상품이 없습니다.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {iapProducts.map((product) => {
                const selectedProductId = selectedProductBySku[product.sku] ?? '';
                const unchanged = selectedProductId === (product.mappedGemProductId ?? '');
                const isSaving =
                  mapMutation.isPending && mapMutation.variables?.sku === product.sku;

                return (
                  <TableRow key={product.sku}>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {product.sku}
                      </Typography>
                    </TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={product.state}
                        size="small"
                        color={product.state === 'APPROVED' ? 'success' : 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {product.displayPrice ?? (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ minWidth: 320 }}>
                      <FormControl size="small" fullWidth>
                        <InputLabel id={`gem-product-${product.sku}`}>구슬 상품</InputLabel>
                        <Select
                          labelId={`gem-product-${product.sku}`}
                          label="구슬 상품"
                          value={selectedProductId}
                          onChange={(e) =>
                            setSelectedProductBySku((prev) => ({
                              ...prev,
                              [product.sku]: e.target.value,
                            }))
                          }
                        >
                          <MenuItem value="">
                            <em>선택하세요</em>
                          </MenuItem>
                          {gemProducts.map((gemProduct) => (
                            <MenuItem key={gemProduct.id} value={gemProduct.id}>
                              {formatGemProductLabel(gemProduct)}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      {product.mappedGemProductName && (
                        <Typography variant="caption" color="text.secondary">
                          현재 매핑: {product.mappedGemProductName}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={!selectedProductId || unchanged || isSaving}
                        onClick={() =>
                          mapMutation.mutate({
                            sku: product.sku,
                            productId: selectedProductId,
                          })
                        }
                      >
                        {isSaving ? <CircularProgress size={16} /> : '매핑 저장'}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {pricePointsQuery.isError && (
        <Typography color="error" sx={{ mb: 2 }}>
          {getAdminErrorMessage(pricePointsQuery.error, '가격 포인트를 불러오지 못했습니다.')}
        </Typography>
      )}

      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
        가격 캐시
      </Typography>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>SKU</TableCell>
              <TableCell>스토어프론트</TableCell>
              <TableCell align="right">가격</TableCell>
              <TableCell>통화</TableCell>
              <TableCell>표시 가격</TableCell>
              <TableCell>출처</TableCell>
              <TableCell>동기화 시각</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pricePoints.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary" py={2}>
                    저장된 가격 포인트가 없습니다.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {pricePoints.map((pricePoint) => (
              <TableRow key={`${pricePoint.sku}-${pricePoint.storefront}`}>
                <TableCell>
                  <Typography variant="body2" fontFamily="monospace">
                    {pricePoint.sku}
                  </Typography>
                </TableCell>
                <TableCell>{pricePoint.storefront}</TableCell>
                <TableCell align="right">{pricePoint.price.toLocaleString()}</TableCell>
                <TableCell>{pricePoint.currency}</TableCell>
                <TableCell>{pricePoint.displayPrice}</TableCell>
                <TableCell>
                  <Chip
                    label={SOURCE_LABELS[pricePoint.source] ?? pricePoint.source}
                    color={SOURCE_COLORS[pricePoint.source] ?? 'default'}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{formatDate(pricePoint.syncedAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
