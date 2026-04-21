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

interface Props {
  category: string;
  status: string;
  search: string;
  onChange: (next: { category?: string; status?: string; search?: string }) => void;
  includeNoticeCategory?: boolean;
}

const NEW_CATEGORIES: { value: string; label: string }[] = [
  { value: 'relationship', label: '연애' },
  { value: 'dating', label: '데이트' },
  { value: 'psychology', label: '심리' },
  { value: 'essay', label: '에세이' },
  { value: 'qna', label: '질의응답' },
  { value: 'event', label: '이벤트' },
];

export function ContentFilters({
  category,
  status,
  search,
  onChange,
  includeNoticeCategory,
}: Props) {
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="content-filter-category">카테고리</InputLabel>
          <Select
            labelId="content-filter-category"
            value={category}
            label="카테고리"
            onChange={(e) => onChange({ category: String(e.target.value) })}
          >
            <MenuItem value="">전체</MenuItem>
            {NEW_CATEGORIES.map((c) => (
              <MenuItem key={c.value} value={c.value}>
                {c.label}
              </MenuItem>
            ))}
            {includeNoticeCategory && <MenuItem value="notice">공지</MenuItem>}
            <MenuItem value="__legacy__">레거시</MenuItem>
          </Select>
        </FormControl>
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
