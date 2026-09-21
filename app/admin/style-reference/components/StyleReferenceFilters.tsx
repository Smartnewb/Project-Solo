'use client';

import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { CATEGORY_LABELS, GENDER_LABELS } from '../constants';

interface Filters {
  gender: 'ALL' | 'MALE' | 'FEMALE';
  category: 'ALL' | 'VIBE' | 'FASHION' | 'COLOR_TONE';
  status: 'ALL' | 'ACTIVE' | 'INACTIVE';
}

interface StyleReferenceFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export function StyleReferenceFilters({ filters, onChange }: StyleReferenceFiltersProps) {
  const handleChange =
    (field: keyof Filters) => (e: SelectChangeEvent) => {
      onChange({ ...filters, [field]: e.target.value });
    };

  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>성별</InputLabel>
        <Select value={filters.gender} label="성별" onChange={handleChange('gender')}>
          <MenuItem value="ALL">전체</MenuItem>
          {(Object.keys(GENDER_LABELS) as Array<keyof typeof GENDER_LABELS>).map((g) => (
            <MenuItem key={g} value={g}>{GENDER_LABELS[g]}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel>카테고리</InputLabel>
        <Select value={filters.category} label="카테고리" onChange={handleChange('category')}>
          <MenuItem value="ALL">전체</MenuItem>
          {(Object.keys(CATEGORY_LABELS) as Array<keyof typeof CATEGORY_LABELS>).map((c) => (
            <MenuItem key={c} value={c}>{CATEGORY_LABELS[c]}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>상태</InputLabel>
        <Select value={filters.status} label="상태" onChange={handleChange('status')}>
          <MenuItem value="ALL">전체</MenuItem>
          <MenuItem value="ACTIVE">활성</MenuItem>
          <MenuItem value="INACTIVE">비활성</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}

export type { Filters };
