'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Alert,
  Paper,
  Chip,
} from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import GridViewIcon from '@mui/icons-material/GridView';
import { useCountry } from '@/contexts/CountryContext';
import AdminService from '@/app/services/admin';
import type { AdminClusterItem } from '@/types/admin';
import ClusterTreemapView from './components/ClusterTreemapView';

const ClusterMapView = dynamic(
  () => import('./components/ClusterMapView'),
  { ssr: false, loading: () => <MapLoadingPlaceholder /> }
);

function MapLoadingPlaceholder() {
  return (
    <Box
      sx={{
        height: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: '12px',
      }}
    >
      <CircularProgress size={32} />
    </Box>
  );
}

type ViewMode = 'map' | 'treemap';

export default function UniversityClustersPage() {
  const { country } = useCountry();
  const [clusters, setClusters] = useState<AdminClusterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('map');

  useEffect(() => {
    loadClusters();
  }, [country]);

  const loadClusters = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await AdminService.universities.getClusters();
      setClusters(data);
    } catch (err: any) {
      setError(err.response?.data?.message || '클러스터 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const totalUsers = clusters.reduce((sum, c) => sum + c.userCount, 0);
  const totalUniversities = clusters.reduce((sum, c) => sum + c.universities.length, 0);

  return (
    <Box>
      {/* 헤더 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            대학 클러스터 현황
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            클러스터별 소속 대학 및 활성 유저 분포
          </Typography>
        </Box>

        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_, val) => val && setViewMode(val)}
          size="small"
        >
          <ToggleButton value="map">
            <MapIcon sx={{ mr: 0.5, fontSize: 18 }} />
            지도
          </ToggleButton>
          <ToggleButton value="treemap">
            <GridViewIcon sx={{ mr: 0.5, fontSize: 18 }} />
            트리맵
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* 요약 카드 */}
      {!loading && !error && (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <SummaryCard label="총 활성 유저" value={totalUsers.toLocaleString()} unit="명" />
          <SummaryCard label="클러스터" value={clusters.length.toString()} unit="개" />
          <SummaryCard label="등록 대학" value={totalUniversities.toLocaleString()} unit="개" />
          <SummaryCard
            label="최대 클러스터"
            value={
              clusters.length > 0
                ? [...clusters].sort((a, b) => b.userCount - a.userCount)[0].name
                : '-'
            }
          />
        </Box>
      )}

      {/* 에러 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 로딩 */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
          <CircularProgress />
        </Box>
      ) : clusters.length === 0 ? (
        <Paper sx={{ textAlign: 'center', py: 8 }}>
          <Typography color="text.secondary">클러스터 데이터가 없습니다.</Typography>
        </Paper>
      ) : (
        <>
          {viewMode === 'map' ? (
            <ClusterMapView clusters={clusters} country={country.toUpperCase() as 'KR' | 'JP'} />
          ) : (
            <ClusterTreemapView clusters={clusters} country={country.toUpperCase() as 'KR' | 'JP'} />
          )}
        </>
      )}
    </Box>
  );
}

function SummaryCard({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <Paper sx={{ px: 3, py: 2, minWidth: 140 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
        <Typography variant="h6" fontWeight={700}>
          {value}
        </Typography>
        {unit && (
          <Typography variant="body2" color="text.secondary">
            {unit}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}
