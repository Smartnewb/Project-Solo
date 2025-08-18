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

// 지역 타입 정의
export type Region = 'ALL' | 'DJN' | 'SJG' | 'BSN' | 'DGU';

// 지역 옵션 정의
const REGION_OPTIONS = [
  { value: 'ALL', label: '전체 지역' },
  { value: 'DJN', label: '대전' },
  { value: 'SJG', label: '충북/세종' },
  { value: 'BSN', label: '부산' },
  { value: 'DGU', label: '대구' }
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
    if (region === 'ALL') return undefined;

    // 대전 클러스터 → DJN으로 전송 (백엔드에서 DJN+GJJ 처리)
    if (region === 'DJN') return 'DJN';

    // 충북/세종 클러스터 → SJG로 전송 (백엔드에서 SJG+CJU 처리)
    if (region === 'SJG') return 'SJG';

    // 부산, 대구는 해당 지역만
    return region;
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

// 개별 지역 코드를 한글로 변환하는 함수 (테이블 표시용)
export const getIndividualRegionLabel = (regionCode: string): string => {
  const regionMap: Record<string, string> = {
    'DJN': '대전',
    'SJG': '세종',
    'CJU': '청주',
    'BSN': '부산',
    'DGU': '대구',
    'GJJ': '공주'
  };
  return regionMap[regionCode] || regionCode;
};
