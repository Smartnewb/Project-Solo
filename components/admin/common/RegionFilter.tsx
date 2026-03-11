'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Box,
  FormControlLabel,
  Switch,
  Typography
} from '@mui/material';
import { useCountry } from '@/contexts/CountryContext';
import AdminService from '@/app/services/admin';
import type { AdminClusterItem } from '@/types/admin';

// 지역 타입 - 백엔드 API에서 동적으로 결정되므로 string 타입 사용
export type Region = string;

interface RegionOption {
  value: string;
  label: string;
}

const ALL_OPTION: RegionOption = { value: 'ALL', label: '전체 지역' };

// Fix 1: 국가별 캐시 분리 - Map<country, data>
const _cacheByCountry = new Map<string, AdminClusterItem[]>();
const _promiseByCountry = new Map<string, Promise<AdminClusterItem[]>>();

function fetchClusters(country: string): Promise<AdminClusterItem[]> {
  const cached = _cacheByCountry.get(country);
  if (cached) return Promise.resolve(cached);

  const pending = _promiseByCountry.get(country);
  if (pending) return pending;

  const promise = AdminService.universities.getClusters()
    .then(data => {
      _cacheByCountry.set(country, data);
      return data;
    })
    .catch((err) => {
      _promiseByCountry.delete(country);
      throw err; // Fix 2: 에러를 전파하여 호출부에서 처리
    });

  _promiseByCountry.set(country, promise);
  return promise;
}

// Fix 3: 클러스터 ID를 value로 사용 - regions[0].code 의존 제거
function buildClusterOptions(clusters: AdminClusterItem[]): RegionOption[] {
  return [
    ALL_OPTION,
    ...clusters.map(c => ({
      value: c.id,
      label: c.name,
    })),
  ];
}

function buildIndividualOptions(clusters: AdminClusterItem[]): RegionOption[] {
  const regions = clusters.flatMap(c => c.regions);
  return [
    ALL_OPTION,
    ...regions.map(r => ({ value: r.code, label: r.name })),
  ];
}

/** 클러스터 데이터를 API에서 가져와 옵션 목록을 반환하는 훅 */
export function useClusterOptions() {
  const { country } = useCountry();
  const [clusters, setClusters] = useState<AdminClusterItem[]>(() => _cacheByCountry.get(country) || []);
  const [loading, setLoading] = useState(() => !_cacheByCountry.has(country));
  const [error, setError] = useState<Error | null>(null); // Fix 2: 에러 상태 노출

  useEffect(() => {
    let cancelled = false;

    // 국가 변경 시 즉시 캐시된 데이터로 전환하거나 로딩 시작
    const cached = _cacheByCountry.get(country);
    if (cached) {
      setClusters(cached);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetchClusters(country)
      .then(data => {
        if (!cancelled) {
          setClusters(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setClusters([]);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [country]); // Fix 1: country 변경 시 재패칭

  const clusterOptions = useMemo(() => buildClusterOptions(clusters), [clusters]);
  const individualOptions = useMemo(() => buildIndividualOptions(clusters), [clusters]);

  return { clusters, clusterOptions, individualOptions, loading, error };
}

interface RegionFilterProps {
  value: Region;
  onChange: (region: Region) => void;
  useCluster?: boolean;
  onClusterModeChange?: (useCluster: boolean) => void;
  showClusterToggle?: boolean;
  disabled?: boolean;
  size?: 'small' | 'medium';
  variant?: 'outlined' | 'filled' | 'standard';
  fullWidth?: boolean;
  sx?: any;
}

export default function RegionFilter({
  value,
  onChange,
  useCluster = true,
  onClusterModeChange,
  showClusterToggle = false,
  disabled = false,
  size = 'small',
  variant = 'outlined',
  fullWidth = false,
  sx = {}
}: RegionFilterProps) {
  const { clusterOptions, individualOptions, loading, error } = useClusterOptions();

  const handleChange = (event: SelectChangeEvent<string>) => {
    onChange(event.target.value);
  };

  const handleClusterToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newUseCluster = event.target.checked;
    if (onClusterModeChange) {
      onClusterModeChange(newUseCluster);
    }
    onChange('ALL');
  };

  const regionOptions = useCluster ? clusterOptions : individualOptions;

  return (
    <Box sx={sx}>
      {showClusterToggle && (
        <Box sx={{ mb: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={useCluster}
                onChange={handleClusterToggle}
                size="small"
                disabled={disabled}
              />
            }
            label={
              <Typography variant="caption" color="textSecondary">
                {useCluster ? '클러스터 단위' : '개별 지역'}
              </Typography>
            }
          />
        </Box>
      )}
      <FormControl
        size={size}
        variant={variant}
        fullWidth={fullWidth}
        disabled={disabled || loading}
        error={!!error}
      >
        <InputLabel id="region-filter-label">지역</InputLabel>
        <Select
          labelId="region-filter-label"
          id="region-filter"
          value={value}
          label="지역"
          onChange={handleChange}
        >
          {regionOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {error && (
        <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
          지역 목록을 불러오지 못했습니다
        </Typography>
      )}
    </Box>
  );
}

// 지역 필터 훅
export function useRegionFilter(initialRegion: Region = 'ALL', initialUseCluster: boolean = true) {
  const [region, setRegion] = useState<Region>(initialRegion);
  const [useCluster, setUseCluster] = useState<boolean>(initialUseCluster);

  const handleRegionChange = (newRegion: Region) => {
    setRegion(newRegion);
  };

  const handleClusterModeChange = (newUseCluster: boolean) => {
    setUseCluster(newUseCluster);
    setRegion('ALL');
  };

  const getRegionParam = (): string | undefined => {
    if (region === 'ALL') return undefined;
    return region;
  };

  const getUseClusterParam = (): boolean => {
    return useCluster;
  };

  return {
    region,
    useCluster,
    setRegion: handleRegionChange,
    setUseCluster: handleClusterModeChange,
    getRegionParam,
    getUseClusterParam
  };
}

// 캐시 기반 라벨 조회 - 현재 국가의 캐시에서 조회
export const getRegionLabel = (region: Region, useCluster: boolean = true): string => {
  if (region === 'ALL') return '전체 지역';

  // 현재 localStorage의 국가로 캐시 조회
  const country = (typeof window !== 'undefined' && localStorage.getItem('admin_selected_country')) || 'kr';
  const cache = _cacheByCountry.get(country);
  if (!cache || cache.length === 0) return region;

  const options = useCluster
    ? buildClusterOptions(cache)
    : buildIndividualOptions(cache);
  const option = options.find(opt => opt.value === region);
  return option?.label || region;
};

export const getClusterRegionLabel = (region: Region): string => {
  return getRegionLabel(region, true);
};

export const getIndividualRegionLabel = (region: Region): string => {
  return getRegionLabel(region, false);
};
