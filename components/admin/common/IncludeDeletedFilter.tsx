'use client';

import { useState } from 'react';
import {
  FormControlLabel,
  Switch,
  Box,
  Typography
} from '@mui/material';

interface IncludeDeletedFilterProps {
  value: boolean;
  onChange: (includeDeleted: boolean) => void;
  disabled?: boolean;
  size?: 'small' | 'medium';
  label?: string;
  labelPlacement?: 'start' | 'end' | 'top' | 'bottom';
  sx?: any;
}

export default function IncludeDeletedFilter({
  value,
  onChange,
  disabled = false,
  size = 'medium',
  label = '탈퇴자 포함',
  labelPlacement = 'start',
  sx = {}
}: IncludeDeletedFilterProps) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.checked);
  };

  return (
    <Box sx={sx}>
      <FormControlLabel
        control={
          <Switch
            checked={value}
            onChange={handleChange}
            disabled={disabled}
            size={size}
            color="primary"
          />
        }
        label={label}
        labelPlacement={labelPlacement}
      />
    </Box>
  );
}

// 탈퇴자 포함 여부 상태 관리 훅
export function useIncludeDeletedFilter(initialValue: boolean = false) {
  const [includeDeleted, setIncludeDeleted] = useState<boolean>(initialValue);

  const getIncludeDeletedParam = (): boolean => {
    return includeDeleted;
  };

  return {
    includeDeleted,
    setIncludeDeleted,
    getIncludeDeletedParam
  };
}

// 탈퇴자 포함 여부 라벨 반환 함수
export function getIncludeDeletedLabel(includeDeleted: boolean): string {
  return includeDeleted ? '탈퇴자 포함' : '탈퇴자 미포함';
}
