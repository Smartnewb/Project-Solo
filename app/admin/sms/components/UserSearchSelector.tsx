'use client';

import { useMemo, useRef, useState } from 'react';
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

  // Cache so chips keep their label after query changes
  const cacheRef = useRef<Map<string, UserSearchItem>>(new Map());

  if (data?.data) {
    for (const item of data.data) {
      cacheRef.current.set(item.id, item);
    }
  }

  const selectedSet = useMemo(() => new Set(selectedUserIds), [selectedUserIds]);

  const toggle = (id: string) => {
    if (selectedSet.has(id)) {
      onSelectionChange(selectedUserIds.filter((x) => x !== id));
    } else {
      onSelectionChange([...selectedUserIds, id]);
    }
  };

  const removeChip = (id: string) => {
    onSelectionChange(selectedUserIds.filter((x) => x !== id));
  };

  const trimmed = query.trim();
  const showHelper = trimmed.length < 2;

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
            const cached = cacheRef.current.get(id);
            return (
              <Chip
                key={id}
                label={cached?.name ?? cached?.phoneNumber ?? id}
                onDelete={disabled ? undefined : () => removeChip(id)}
                size="small"
              />
            );
          })}
        </Box>
      )}

      {showHelper && (
        <Typography variant="body2" color="text.secondary">
          이름 또는 휴대폰 2자 이상 입력하세요
        </Typography>
      )}

      {!showHelper && isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={20} />
        </Box>
      )}

      {!showHelper && isError && (
        <Typography variant="body2" color="error">
          검색 중 오류가 발생했습니다
        </Typography>
      )}

      {!showHelper && !isLoading && data && data.data.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          검색 결과 없음
        </Typography>
      )}

      {!showHelper && !isLoading && data && data.data.length > 0 && (
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
            {data.data.map((item) => {
              const checked = selectedSet.has(item.id);
              return (
                <TableRow key={item.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={checked}
                      onChange={() => toggle(item.id)}
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell>{item.name ?? '-'}</TableCell>
                  <TableCell>{item.phoneNumber ?? '-'}</TableCell>
                  <TableCell>{item.gender ?? '-'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Stack>
  );
}
