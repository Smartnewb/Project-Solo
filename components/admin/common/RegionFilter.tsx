'use client';

import { useState } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Box,
  Typography
} from '@mui/material';

// 지역 타입 정의
export type Region = 'ALL' | 'BSN' | 'DJN';

// 지역 옵션 정의
const REGION_OPTIONS = [
  { value: 'ALL', label: '전체 지역' },
  { value: 'BSN', label: '부산' },
  { value: 'DJN', label: '대전' }
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

  // API 호출용 지역 파라미터 변환
  const getRegionParam = (): string | undefined => {
    return region === 'ALL' ? undefined : region;
  };

  return {
    region,
    setRegion: handleRegionChange,
    getRegionParam
  };
}

// 지역 표시용 유틸리티 함수
export const getRegionLabel = (region: Region): string => {
  const option = REGION_OPTIONS.find(opt => opt.value === region);
  return option?.label || '전체 지역';
};
