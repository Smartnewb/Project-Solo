'use client';

import {
  Paper,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';
import {
  LEGACY_CATEGORY_SENTINEL,
  NEW_CATEGORY_OPTIONS,
} from '../constants';

interface Props {
  category: string;
  status: string;
  search: string;
  onChange: (next: { category?: string; status?: string; search?: string }) => void;
  includeNoticeCategory?: boolean;
  hideCategory?: boolean;
}

export function ContentFilters({
  category,
  status,
  search,
  onChange,
  includeNoticeCategory,
  hideCategory,
}: Props) {
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {!hideCategory && (
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="content-filter-category">카테고리</InputLabel>
            <Select
              labelId="content-filter-category"
              value={category}
              label="카테고리"
              onChange={(e) => onChange({ category: String(e.target.value) })}
            >
              <MenuItem value="">전체</MenuItem>
              {NEW_CATEGORY_OPTIONS.map((c) => (
                <MenuItem key={c.code} value={c.code}>
                  {c.label}
                </MenuItem>
              ))}
              {includeNoticeCategory && <MenuItem value="notice">공지</MenuItem>}
              <MenuItem value={LEGACY_CATEGORY_SENTINEL}>레거시</MenuItem>
            </Select>
          </FormControl>
        )}
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="content-filter-status">상태</InputLabel>
          <Select
            labelId="content-filter-status"
            value={status}
            label="상태"
            onChange={(e) => onChange({ status: String(e.target.value) })}
          >
            <MenuItem value="">전체</MenuItem>
            <MenuItem value="draft">초안</MenuItem>
            <MenuItem value="published">게시중</MenuItem>
            <MenuItem value="archived">보관</MenuItem>
          </Select>
        </FormControl>
        <TextField
          size="small"
          label="검색"
          value={search}
          onChange={(e) => onChange({ search: e.target.value })}
          sx={{ flex: 1, minWidth: 200 }}
        />
      </Box>
    </Paper>
  );
}
