'use client';

import { useState } from 'react';
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

// 지역 타입 정의 (클러스터 기반)
export type Region = 'ALL' | 'DJN' | 'SJG' | 'CAN' | 'BSN' | 'DGU' | 'ICN' | 'CJU' | 'GJJ' | 'GHE' | 'SEL' | 'KYG' | 'GWJ';

const CLUSTER_REGION_OPTIONS = [
  { value: 'ALL', label: '전체 지역' },
  { value: 'DJN', label: '대전/공주 클러스터' },
  { value: 'SJG', label: '청주/세종 클러스터' },
  { value: 'CAN', label: '천안 클러스터' },
  { value: 'BSN', label: '부산/김해 클러스터' },
  { value: 'ICN', label: '인천/서울/경기 클러스터' },
  { value: 'DGU', label: '대구' },
  { value: 'GWJ', label: '광주' }
] as const;

const INDIVIDUAL_REGION_OPTIONS = [
  { value: 'ALL', label: '전체 지역' },
  { value: 'DJN', label: '대전' },
  { value: 'SJG', label: '세종' },
  { value: 'CJU', label: '청주' },
  { value: 'GJJ', label: '공주' },
  { value: 'BSN', label: '부산' },
  { value: 'GHE', label: '김해' },
  { value: 'DGU', label: '대구' },
  { value: 'ICN', label: '인천' },
  { value: 'SEL', label: '서울' },
  { value: 'KYG', label: '경기' },
  { value: 'CAN', label: '천안' },
  { value: 'GWJ', label: '광주' }
] as const;

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
  const handleChange = (event: SelectChangeEvent<Region>) => {
    onChange(event.target.value as Region);
  };

  const handleClusterToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newUseCluster = event.target.checked;
    if (onClusterModeChange) {
      onClusterModeChange(newUseCluster);
    }
    onChange('ALL');
  };
  const regionOptions = useCluster ? CLUSTER_REGION_OPTIONS : INDIVIDUAL_REGION_OPTIONS;

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
        disabled={disabled}
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

export const getRegionLabel = (region: Region, useCluster: boolean = true): string => {
  const options = useCluster ? CLUSTER_REGION_OPTIONS : INDIVIDUAL_REGION_OPTIONS;
  const option = options.find(opt => opt.value === region);
  return option?.label || '전체 지역';
};

export const getClusterRegionLabel = (region: Region): string => {
  return getRegionLabel(region, true);
};

export const getIndividualRegionLabel = (region: Region): string => {
  return getRegionLabel(region, false);
};
