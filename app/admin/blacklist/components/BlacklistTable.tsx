'use client';

import React from 'react';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Skeleton,
  Box,
  Button,
  Stack,
  Typography,
  Paper,
  TableContainer,
} from '@mui/material';
import { Clock, RotateCcw } from 'lucide-react';
import type { BlacklistItem } from '@/app/services/admin';
import { formatDateTimeWithoutTimezoneConversion } from '@/app/utils/formatters';
import { AdminNameLabel } from './AdminNameLabel';

interface Props {
  data: BlacklistItem[];
  loading: boolean;
  onRelease: (item: BlacklistItem) => void;
  onViewHistory: (userId: string) => void;
}

export function BlacklistTable({ data, loading, onRelease, onViewHistory }: Props) {
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>이름</TableCell>
            <TableCell>전화번호</TableCell>
            <TableCell sx={{ minWidth: 240 }}>사유</TableCell>
            <TableCell>등록일</TableCell>
            <TableCell>등록자</TableCell>
            <TableCell align="right">액션</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading &&
            Array.from({ length: 10 }).map((_, idx) => (
              <TableRow key={`skel-${idx}`}>
                <TableCell><Skeleton width={80} /></TableCell>
                <TableCell><Skeleton width={120} /></TableCell>
                <TableCell><Skeleton width="80%" /></TableCell>
                <TableCell><Skeleton width={140} /></TableCell>
                <TableCell><Skeleton width={80} /></TableCell>
                <TableCell align="right"><Skeleton width={140} /></TableCell>
              </TableRow>
            ))}

          {!loading && data.length === 0 && (
            <TableRow>
              <TableCell colSpan={6}>
                <Box py={4} textAlign="center">
                  <Typography color="text.secondary">활성 블랙리스트 없음</Typography>
                </Box>
              </TableCell>
            </TableRow>
          )}

          {!loading &&
            data.map((item) => (
              <TableRow key={item.blacklistId} hover>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.phoneNumber}</TableCell>
                <TableCell>
                  <Box
                    title={item.reason}
                    sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {item.reason}
                  </Box>
                </TableCell>
                <TableCell>
                  {formatDateTimeWithoutTimezoneConversion(item.blacklistedAt)}
                </TableCell>
                <TableCell>
                  <AdminNameLabel adminId={item.blacklistedBy} />
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Clock size={14} />}
                      onClick={() => onViewHistory(item.userId)}
                    >
                      이력
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      startIcon={<RotateCcw size={14} />}
                      onClick={() => onRelease(item)}
                    >
                      해제
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default BlacklistTable;
