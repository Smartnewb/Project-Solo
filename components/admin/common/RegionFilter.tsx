'use client';

import { useState } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Box
} from '@mui/material';

// 지역 타입 정의 (클러스터 기반)
export type Region = 'ALL' | 'DJN' | 'SJG' | 'BSN' | 'DGU' | 'ICN' | 'CAN';

// 지역 옵션 정의 (클러스터 기반)
const REGION_OPTIONS = [
  { value: 'ALL', label: '전체 지역' },
  { value: 'DJN', label: '대전/공주 클러스터' },
  { value: 'SJG', label: '충북/세종 클러스터' },
  { value: 'BSN', label: '부산/김해 클러스터' },
  { value: 'DGU', label: '대구' },
  { value: 'ICN', label: '인천' },
  { value: 'CAN', label: '천안' }
] as const;

interface RegionFilterProps {
  value: Region;
  onChange: (region: Region) => void;
  disabled?: boolean;
  size?: 'small' | 'medium';
  variant?: 'outlined' | 'filled' | 'standard';
  fullWidth?: boolean;
  sx?: any;
}

export default function RegionFilter({
  value,
  onChange,
  disabled = false,
  size = 'small',
  variant = 'outlined',
  fullWidth = false,
  sx = {}
}: RegionFilterProps) {
  const handleChange = (event: SelectChangeEvent<Region>) => {
    onChange(event.target.value as Region);
  };

  return (
    <Box sx={sx}>
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
          {REGION_OPTIONS.map((option) => (
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
export function useRegionFilter(initialRegion: Region = 'ALL') {
  const [region, setRegion] = useState<Region>(initialRegion);

  const handleRegionChange = (newRegion: Region) => {
    setRegion(newRegion);
  };

  // API 호출용 지역 파라미터 변환 (클러스터 기반)
  const getRegionParam = (): string | undefined => {
    if (region === 'ALL') return undefined;

    // 대전/공주 클러스터 → DJN으로 전송 (백엔드에서 DJN+GJJ 처리)
    if (region === 'DJN') return 'DJN';

    // 충북/세종 클러스터 → SJG로 전송 (백엔드에서 SJG+CJU 처리)
    if (region === 'SJG') return 'SJG';

    // 부산/김해 클러스터 → BSN으로 전송 (백엔드에서 BSN+GHE 처리)
    if (region === 'BSN') return 'BSN';

    // 대구, 인천, 천안은 단독
    return region;
  };

  return {
    region,
    setRegion: handleRegionChange,
    getRegionParam
  };
}

// 지역 표시용 유틸리티 함수 (클러스터 기반)
export const getRegionLabel = (region: Region): string => {
  const option = REGION_OPTIONS.find(opt => opt.value === region);
  return option?.label || '전체 지역';
};
