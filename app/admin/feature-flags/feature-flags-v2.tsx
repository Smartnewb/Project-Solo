'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import AdminService from '@/app/services/admin';
import type { FeatureFlag } from '@/app/services/admin';
import { safeToLocaleDateString } from '@/app/utils/formatters';

const AVAILABLE_ROLES = ['admin', 'tester', 'user'];

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  return safeToLocaleDateString(dateStr);
}

export default function FeatureFlagsV2() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingFlags, setTogglingFlags] = useState<Set<string>>(new Set());

  const [editOpen, setEditOpen] = useState(false);
  const [editFlag, setEditFlag] = useState<FeatureFlag | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editEnabled, setEditEnabled] = useState(false);
  const [editRoles, setEditRoles] = useState<string[]>([]);
  const [editSaving, setEditSaving] = useState(false);

  const fetchFlags = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AdminService.featureFlags.getAll();
      setFlags(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || '플래그 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const handleToggle = async (flag: FeatureFlag) => {
    const newEnabled = !flag.enabled;

    setFlags((prev) =>
      prev.map((f) => (f.name === flag.name ? { ...f, enabled: newEnabled } : f)),
    );
    setTogglingFlags((prev) => new Set(prev).add(flag.name));

    try {
      const updated = await AdminService.featureFlags.toggle(flag.name, newEnabled);
      setFlags((prev) =>
        prev.map((f) => (f.name === flag.name ? updated : f)),
      );
    } catch {
      setFlags((prev) =>
        prev.map((f) => (f.name === flag.name ? { ...f, enabled: flag.enabled } : f)),
      );
      setError(`"${flag.name}" 토글에 실패했습니다.`);
    } finally {
      setTogglingFlags((prev) => {
        const next = new Set(prev);
        next.delete(flag.name);
        return next;
      });
    }
  };

  const openEdit = (flag: FeatureFlag) => {
    setEditFlag(flag);
    setEditDescription(flag.description);
    setEditEnabled(flag.enabled);
    setEditRoles([...flag.allowedRoles]);
    setEditOpen(true);
  };

  const handleRoleToggle = (role: string) => {
    setEditRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  const handleEditSave = async () => {
    if (!editFlag) return;
    setEditSaving(true);
    try {
      const updated = await AdminService.featureFlags.update(editFlag.name, {
        description: editDescription,
        enabled: editEnabled,
        allowedRoles: editRoles,
      });
      setFlags((prev) =>
        prev.map((f) => (f.name === editFlag.name ? updated : f)),
      );
      setEditOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || '수정에 실패했습니다.');
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Feature Flags
        </Typography>
        <Button variant="outlined" size="small" onClick={fetchFlags} disabled={loading}>
          새로고침
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : flags.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="textSecondary">등록된 플래그가 없습니다</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>설명</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">상태</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>적용 범위</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>국가</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>수정일</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {flags.map((flag) => (
                <TableRow
                  key={flag.name}
                  hover
                  sx={{ cursor: 'pointer', '&:last-child td': { borderBottom: 0 } }}
                  onClick={() => openEdit(flag)}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                      {flag.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary" sx={{ maxWidth: 300 }}>
                      {flag.description}
                    </Typography>
                  </TableCell>
                  <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      <Switch
                        checked={flag.enabled}
                        onChange={() => handleToggle(flag)}
                        disabled={togglingFlags.has(flag.name)}
                        color="success"
                        size="small"
                      />
                      <Chip
                        label={flag.enabled ? 'ON' : 'OFF'}
                        size="small"
                        color={flag.enabled ? 'success' : 'default'}
                        variant={flag.enabled ? 'filled' : 'outlined'}
                        sx={{ minWidth: 40, fontWeight: 600, fontSize: '0.7rem' }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    {flag.allowedRoles.length === 0 ? (
                      <Typography variant="caption" color="textSecondary">전체 공개</Typography>
                    ) : (
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {flag.allowedRoles.map((role) => (
                          <Chip key={role} label={role} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                        ))}
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {flag.country ? flag.country.toUpperCase() : '전체'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="textSecondary">
                      {formatRelativeTime(flag.updatedAt)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          플래그 수정
          {editFlag && (
            <Typography variant="body2" color="textSecondary" sx={{ fontFamily: 'monospace', mt: 0.5 }}>
              {editFlag.name}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            label="설명"
            fullWidth
            multiline
            rows={2}
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            sx={{ mb: 3, mt: 1 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={editEnabled}
                onChange={(e) => setEditEnabled(e.target.checked)}
                color="success"
              />
            }
            label={editEnabled ? 'ON (활성화)' : 'OFF (비활성화)'}
            sx={{ mb: 2, display: 'block' }}
          />
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            적용 범위 (allowedRoles)
          </Typography>
          <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: 'block' }}>
            아무것도 선택하지 않으면 모든 유저에게 적용됩니다
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {AVAILABLE_ROLES.map((role) => (
              <FormControlLabel
                key={role}
                control={
                  <Checkbox
                    checked={editRoles.includes(role)}
                    onChange={() => handleRoleToggle(role)}
                    size="small"
                  />
                }
                label={role}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setEditOpen(false)} disabled={editSaving}>
            취소
          </Button>
          <Button variant="contained" onClick={handleEditSave} disabled={editSaving}>
            {editSaving ? <CircularProgress size={20} /> : '저장'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
