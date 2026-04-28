'use client';

import { useMemo, useState } from 'react';
import {
  TextField,
  Box,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Checkbox,
  Chip,
  CircularProgress,
  Typography,
  Stack,
} from '@mui/material';
import { useUserSearch } from '../hooks/useUserSearch';
import type { UserSearchItem } from '@/app/services/sms';

interface Props {
  selectedUserIds: string[];
  onSelectionChange: (next: string[]) => void;
  disabled?: boolean;
}

export function UserSearchSelector({ selectedUserIds, onSelectionChange, disabled }: Props) {
  const [query, setQuery] = useState('');
  const { data, isLoading, isError } = useUserSearch(query);

  // 칩 라벨용 캐시는 선택된 ID 집합에만 묶여 있어 무한 증가하지 않는다.
  const [labels, setLabels] = useState<Map<string, UserSearchItem>>(new Map());

  const selectedSet = useMemo(() => new Set(selectedUserIds), [selectedUserIds]);

  const select = (item: UserSearchItem) => {
    onSelectionChange([...selectedUserIds, item.id]);
    setLabels((prev) => new Map(prev).set(item.id, item));
  };

  const unselect = (id: string) => {
    onSelectionChange(selectedUserIds.filter((x) => x !== id));
    setLabels((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  };

  const toggle = (item: UserSearchItem) => {
    if (selectedSet.has(item.id)) unselect(item.id);
    else select(item);
  };

  const trimmed = query.trim();
  const viewState: 'helper' | 'loading' | 'error' | 'empty' | 'list' =
    trimmed.length < 2
      ? 'helper'
      : isLoading
        ? 'loading'
        : isError
          ? 'error'
          : !data || data.data.length === 0
            ? 'empty'
            : 'list';

  function renderResults() {
    if (viewState === 'helper') {
      return (
        <Typography variant="body2" color="text.secondary">
          이름 또는 휴대폰 2자 이상 입력하세요
        </Typography>
      );
    }
    if (viewState === 'loading') {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={20} />
        </Box>
      );
    }
    if (viewState === 'error') {
      return (
        <Typography variant="body2" color="error">
          검색 중 오류가 발생했습니다
        </Typography>
      );
    }
    if (viewState === 'empty') {
      return (
        <Typography variant="body2" color="text.secondary">
          검색 결과 없음
        </Typography>
      );
    }
    return (
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">선택</TableCell>
            <TableCell>이름</TableCell>
            <TableCell>휴대폰</TableCell>
            <TableCell>성별</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data!.data.map((item) => (
            <TableRow key={item.id} hover>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selectedSet.has(item.id)}
                  onChange={() => toggle(item)}
                  disabled={disabled}
                />
              </TableCell>
              <TableCell>{item.name ?? '-'}</TableCell>
              <TableCell>{item.phoneNumber ?? '-'}</TableCell>
              <TableCell>{item.gender ?? '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <Stack spacing={2}>
      <TextField
        label="이름 또는 휴대폰 검색"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        disabled={disabled}
        fullWidth
        size="small"
      />

      {selectedUserIds.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {selectedUserIds.map((id) => {
            const cached = labels.get(id);
            return (
              <Chip
                key={id}
                label={cached?.name ?? cached?.phoneNumber ?? id}
                onDelete={disabled ? undefined : () => unselect(id)}
                size="small"
              />
            );
          })}
        </Box>
      )}

      {renderResults()}
    </Stack>
  );
}
