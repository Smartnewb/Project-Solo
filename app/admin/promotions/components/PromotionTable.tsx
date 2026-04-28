'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  IconButton,
  Chip,
  Box,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { Promotion } from '@/types/admin';

interface PromotionTableProps {
  promotions: Promotion[];
  onEdit: (p: Promotion) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  loadingIds?: Set<string>;
}

export function PromotionTable({
  promotions,
  onEdit,
  onDelete,
  onToggleActive,
  loadingIds,
}: PromotionTableProps) {
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('ko-KR');

  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>순서</TableCell>
            <TableCell>이미지</TableCell>
            <TableCell>제목</TableCell>
            <TableCell>할인율</TableCell>
            <TableCell>기간</TableCell>
            <TableCell>상태</TableCell>
            <TableCell align="right">액션</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {promotions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} align="center">
                <Typography variant="body2" color="text.secondary" py={4}>
                  프로모션이 없습니다.
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            promotions.map((p) => {
              const deleted = !!p.deletedAt;
              const loading = loadingIds?.has(p.id);
              return (
                <TableRow key={p.id} sx={{ opacity: deleted ? 0.5 : 1 }}>
                  <TableCell>{p.sortOrder}</TableCell>
                  <TableCell>
                    <img
                      src={p.imageUrl}
                      alt={p.title}
                      style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2">{p.title}</Typography>
                      {p.badge && (
                        <Chip label={p.badge} size="small" color="error" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{p.discountRate}%</TableCell>
                  <TableCell>
                    <Typography variant="caption" noWrap>
                      {formatDate(p.startsAt)} ~ {formatDate(p.expiresAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {deleted ? (
                      <Chip label="삭제됨" size="small" color="default" />
                    ) : (
                      <Switch
                        checked={p.isActive}
                        disabled={loading}
                        size="small"
                        onChange={(e) => onToggleActive(p.id, e.target.checked)}
                      />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => onEdit(p)}
                      disabled={deleted}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => onDelete(p.id)}
                      disabled={deleted}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
