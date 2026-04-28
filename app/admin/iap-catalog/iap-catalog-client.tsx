'use client';

import { useState } from 'react';
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
import type { AppleIapPriceSource } from '@/types/admin';

const STOREFRONT_OPTIONS = [{ code: 'KOR', label: '대한민국 (KOR)' }];

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

export default function IapCatalogClient() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [storefront, setStorefront] = useState('KOR');

  const pricePointsQuery = useQuery({
    queryKey: ['admin', 'iap-catalog', 'price-points', storefront],
    queryFn: () => AdminService.iapCatalog.getPricePoints(storefront),
  });

  const syncMutation = useMutation({
    mutationFn: () => AdminService.iapCatalog.syncApplePrices(),
    onSuccess: (result) => {
      toast.success(
        `동기화 완료 (성공 ${result.synced}건${
          result.failed.length ? `, 실패 ${result.failed.length}건` : ''
        })`,
      );
      queryClient.invalidateQueries({
        queryKey: ['admin', 'iap-catalog', 'price-points'],
      });
    },
    onError: (error: unknown) => {
      toast.error(getAdminErrorMessage(error, '동기화에 실패했습니다.'));
    },
  });

  const points = pricePointsQuery.data ?? [];

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
            App Store Connect에서 가져온 IAP 가격 캐시
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="storefront-label">스토어프론트</InputLabel>
            <Select
              labelId="storefront-label"
              label="스토어프론트"
              value={storefront}
              onChange={(e) => setStorefront(e.target.value)}
            >
              {STOREFRONT_OPTIONS.map((opt) => (
                <MenuItem key={opt.code} value={opt.code}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
          >
            {syncMutation.isPending ? (
              <CircularProgress size={20} sx={{ color: 'white' }} />
            ) : (
              'Apple 가격 동기화'
            )}
          </Button>
        </Box>
      </Box>

      {pricePointsQuery.isError && (
        <Typography color="error" sx={{ mb: 2 }}>
          {getAdminErrorMessage(pricePointsQuery.error, '목록을 불러오지 못했습니다.')}
        </Typography>
      )}

      {pricePointsQuery.isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
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
              {points.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary" py={2}>
                      저장된 가격 포인트가 없습니다. 상단의 &lsquo;Apple 가격 동기화&rsquo; 버튼을 눌러 동기화하세요.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {points.map((p) => (
                <TableRow key={`${p.sku}-${p.storefront}`}>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {p.sku}
                    </Typography>
                  </TableCell>
                  <TableCell>{p.storefront}</TableCell>
                  <TableCell align="right">{p.price.toLocaleString()}</TableCell>
                  <TableCell>{p.currency}</TableCell>
                  <TableCell>{p.displayPrice}</TableCell>
                  <TableCell>
                    <Chip
                      label={SOURCE_LABELS[p.source] ?? p.source}
                      color={SOURCE_COLORS[p.source] ?? 'default'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{formatDate(p.syncedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
