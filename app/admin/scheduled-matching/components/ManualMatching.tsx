'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  TablePagination,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WarningIcon from '@mui/icons-material/Warning';
import { Button } from '@/shared/ui';
import { useAuth } from '@/contexts/AuthContext';
import { scheduledMatchingService } from '../service';
import type {
  ManualMatchType,
  MatchPriority,
  MatchingStatus,
  ManualMatching as ManualMatchingType,
  ManualMatchingRequest,
  ValidateMatchingResponse,
  ManualMatchingListParams,
} from '../types';

const MATCH_TYPE_OPTIONS: { value: ManualMatchType; label: string }[] = [
  { value: 'cs_support', label: 'CS 대응' },
  { value: 'test', label: '테스트' },
  { value: 'promotion', label: '프로모션' },
  { value: 'recovery', label: '매칭 복구' },
  { value: 'vip', label: 'VIP 특별 매칭' },
  { value: 'other', label: '기타' },
];

const PRIORITY_OPTIONS: { value: MatchPriority; label: string }[] = [
  { value: 'low', label: '낮음' },
  { value: 'normal', label: '보통' },
  { value: 'high', label: '높음' },
  { value: 'urgent', label: '긴급' },
];

const STATUS_OPTIONS: { value: MatchingStatus; label: string; color: 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' }[] = [
  { value: 'scheduled', label: '예약됨', color: 'info' },
  { value: 'processing', label: '처리 중', color: 'warning' },
  { value: 'completed', label: '완료', color: 'success' },
  { value: 'failed', label: '실패', color: 'error' },
  { value: 'cancelled', label: '취소됨', color: 'default' },
];

const getStatusChip = (status: MatchingStatus) => {
  const option = STATUS_OPTIONS.find((o) => o.value === status);
  return (
    <Chip
      label={option?.label || status}
      color={option?.color || 'default'}
      size="small"
    />
  );
};

const getMatchTypeLabel = (type: ManualMatchType) => {
  return MATCH_TYPE_OPTIONS.find((o) => o.value === type)?.label || type;
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('ko-KR');
};

export default function ManualMatching() {
  const { user } = useAuth();

  // Form state
  const [userId1, setUserId1] = useState('');
  const [userId2, setUserId2] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [matchType, setMatchType] = useState<ManualMatchType>('cs_support');
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState<MatchPriority>('normal');
  const [notifyUsers, setNotifyUsers] = useState(true);
  const [skipValidation, setSkipValidation] = useState(false);

  // Validation state
  const [validationResult, setValidationResult] = useState<ValidateMatchingResponse | null>(null);
  const [validating, setValidating] = useState(false);

  // List state
  const [matchings, setMatchings] = useState<ManualMatchingType[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<MatchingStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<ManualMatchType | ''>('');

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [detailDialog, setDetailDialog] = useState<ManualMatchingType | null>(null);
  const [cancelDialog, setCancelDialog] = useState<ManualMatchingType | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Fetch list
  const fetchMatchings = useCallback(async () => {
    try {
      setLoading(true);
      const params: ManualMatchingListParams = {
        page: page + 1,
        limit: rowsPerPage,
      };
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.matchType = typeFilter;

      const response = await scheduledMatchingService.getManualMatchingList(params);
      setMatchings(response.data);
      setTotal(response.pagination.total);
    } catch (err) {
      console.error('Failed to fetch manual matchings:', err);
      setError('수동 매칭 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, statusFilter, typeFilter]);

  useEffect(() => {
    fetchMatchings();
  }, [fetchMatchings]);

  // Validate users
  const handleValidate = async () => {
    if (!userId1.trim() || !userId2.trim()) {
      setError('두 유저의 ID를 모두 입력해주세요.');
      return;
    }

    try {
      setValidating(true);
      setError(null);
      setValidationResult(null);

      const result = await scheduledMatchingService.validateManualMatching([
        userId1.trim(),
        userId2.trim(),
      ]);
      setValidationResult(result);

      if (!result.isValid) {
        setError(result.blockedReasons.join(', '));
      }
    } catch (err) {
      console.error('Validation failed:', err);
      setError('유저 검증에 실패했습니다.');
    } finally {
      setValidating(false);
    }
  };

  // Create manual matching
  const handleCreate = async () => {
    if (!userId1.trim() || !userId2.trim()) {
      setError('두 유저의 ID를 모두 입력해주세요.');
      return;
    }
    if (!scheduledAt) {
      setError('매칭 예정 시간을 입력해주세요.');
      return;
    }
    if (!reason.trim()) {
      setError('매칭 사유를 입력해주세요.');
      return;
    }

    try {
      setCreating(true);
      setError(null);
      setSuccess(null);

      const request: ManualMatchingRequest = {
        userIds: [userId1.trim(), userId2.trim()],
        scheduledAt: new Date(scheduledAt).toISOString(),
        matchType,
        reason: reason.trim(),
        priority,
        notifyUsers,
        skipValidation,
      };

      await scheduledMatchingService.createManualMatching(request);
      setSuccess('수동 매칭이 생성되었습니다.');

      // Reset form
      setUserId1('');
      setUserId2('');
      setScheduledAt('');
      setReason('');
      setValidationResult(null);

      // Refresh list
      fetchMatchings();
    } catch (err: unknown) {
      console.error('Failed to create manual matching:', err);
      const errorMessage = err instanceof Error ? err.message : '수동 매칭 생성에 실패했습니다.';
      setError(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  // Cancel matching
  const handleCancel = async () => {
    if (!cancelDialog || !cancelReason.trim()) return;

    try {
      await scheduledMatchingService.cancelManualMatching(cancelDialog.id, cancelReason.trim());
      setSuccess('매칭이 취소되었습니다.');
      setCancelDialog(null);
      setCancelReason('');
      fetchMatchings();
    } catch (err) {
      console.error('Failed to cancel matching:', err);
      setError('매칭 취소에 실패했습니다.');
    }
  };

  // Execute matching immediately
  const handleExecute = async (matching: ManualMatchingType) => {
    if (!confirm('이 매칭을 즉시 실행하시겠습니까?')) return;

    try {
      await scheduledMatchingService.executeManualMatching(matching.id);
      setSuccess('매칭이 실행되었습니다.');
      fetchMatchings();
    } catch (err) {
      console.error('Failed to execute matching:', err);
      setError('매칭 실행에 실패했습니다.');
    }
  };

  // Get default scheduled time (1 hour from now)
  const getDefaultScheduledTime = () => {
    const date = new Date();
    date.setHours(date.getHours() + 1);
    date.setMinutes(0);
    date.setSeconds(0);
    return date.toISOString().slice(0, 16);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        수동 매칭
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Create Form */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
          새 수동 매칭 생성
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            label="유저 1 ID"
            value={userId1}
            onChange={(e) => setUserId1(e.target.value)}
            size="small"
            sx={{ flex: 1 }}
            placeholder="UUID 입력"
          />
          <TextField
            label="유저 2 ID"
            value={userId2}
            onChange={(e) => setUserId2(e.target.value)}
            size="small"
            sx={{ flex: 1 }}
            placeholder="UUID 입력"
          />
          <Button
            variant="outline"
            onClick={handleValidate}
            disabled={validating || !userId1.trim() || !userId2.trim()}
          >
            {validating ? <CircularProgress size={16} /> : <SearchIcon sx={{ fontSize: 16, mr: 0.5 }} />}
            검증
          </Button>
        </Box>

        {validationResult && (
          <Alert
            severity={validationResult.isValid ? 'success' : 'error'}
            sx={{ mb: 2 }}
            icon={validationResult.isValid ? <CheckCircleIcon /> : <CancelIcon />}
          >
            <Box>
              <Typography variant="body2" fontWeight="medium">
                {validationResult.isValid ? '매칭 가능' : '매칭 불가'}
              </Typography>
              {validationResult.users.map((u) => (
                <Box key={u.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <Typography variant="caption">
                    {u.name} ({u.matchingStatus})
                  </Typography>
                  {u.warnings.map((w, i) => (
                    <Chip key={i} label={w} size="small" color="warning" sx={{ height: 20 }} />
                  ))}
                </Box>
              ))}
              {validationResult.blockedReasons.length > 0 && (
                <Typography variant="caption" color="error">
                  {validationResult.blockedReasons.join(', ')}
                </Typography>
              )}
            </Box>
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            type="datetime-local"
            label="매칭 예정 시간"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            size="small"
            sx={{ width: 250 }}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: getDefaultScheduledTime() }}
          />
          <FormControl size="small" sx={{ width: 150 }}>
            <InputLabel>매칭 유형</InputLabel>
            <Select
              value={matchType}
              label="매칭 유형"
              onChange={(e) => setMatchType(e.target.value as ManualMatchType)}
            >
              {MATCH_TYPE_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ width: 120 }}>
            <InputLabel>우선순위</InputLabel>
            <Select
              value={priority}
              label="우선순위"
              onChange={(e) => setPriority(e.target.value as MatchPriority)}
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <TextField
          fullWidth
          label="매칭 사유"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          size="small"
          sx={{ mb: 2 }}
          placeholder="예: CS 티켓 #12345 - 매칭 누락 보상"
          required
        />

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={notifyUsers}
                onChange={(e) => setNotifyUsers(e.target.checked)}
              />
            }
            label="유저에게 알림 발송"
          />
          <FormControlLabel
            control={
              <Switch
                checked={skipValidation}
                onChange={(e) => setSkipValidation(e.target.checked)}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                유효성 검사 스킵
                <Tooltip title="주의: 매칭 빈도, 선호도, 대학 제한 등의 검사를 건너뜁니다">
                  <WarningIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                </Tooltip>
              </Box>
            }
          />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
            매칭 생성
          </Button>
        </Box>
      </Paper>

      {/* List */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="medium">
            수동 매칭 목록
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <FormControl size="small" sx={{ width: 120 }}>
              <InputLabel>상태</InputLabel>
              <Select
                value={statusFilter}
                label="상태"
                onChange={(e) => {
                  setStatusFilter(e.target.value as MatchingStatus | '');
                  setPage(0);
                }}
              >
                <MenuItem value="">전체</MenuItem>
                {STATUS_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ width: 120 }}>
              <InputLabel>유형</InputLabel>
              <Select
                value={typeFilter}
                label="유형"
                onChange={(e) => {
                  setTypeFilter(e.target.value as ManualMatchType | '');
                  setPage(0);
                }}
              >
                <MenuItem value="">전체</MenuItem>
                {MATCH_TYPE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Tooltip title="새로고침">
              <IconButton onClick={fetchMatchings} size="small">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>상태</TableCell>
                <TableCell>유형</TableCell>
                <TableCell>유저</TableCell>
                <TableCell>예정 시간</TableCell>
                <TableCell>사유</TableCell>
                <TableCell>생성자</TableCell>
                <TableCell>생성일</TableCell>
                <TableCell align="right">액션</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : matchings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">데이터가 없습니다.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                matchings.map((matching) => (
                  <TableRow key={matching.id} hover>
                    <TableCell>{getStatusChip(matching.status)}</TableCell>
                    <TableCell>{getMatchTypeLabel(matching.matchType)}</TableCell>
                    <TableCell>
                      {matching.users.map((u) => (
                        <Chip
                          key={u.id}
                          label={`${u.name} (${u.gender === 'MALE' ? '남' : '여'})`}
                          size="small"
                          sx={{ mr: 0.5 }}
                        />
                      ))}
                    </TableCell>
                    <TableCell>{formatDateTime(matching.scheduledAt)}</TableCell>
                    <TableCell>
                      <Tooltip title={matching.reason}>
                        <Typography
                          variant="body2"
                          sx={{
                            maxWidth: 150,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {matching.reason}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>{matching.createdBy.name}</TableCell>
                    <TableCell>{formatDateTime(matching.createdAt)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="상세보기">
                        <IconButton size="small" onClick={() => setDetailDialog(matching)}>
                          <VisibilityIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                      {matching.status === 'scheduled' && (
                        <>
                          <Tooltip title="즉시 실행">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleExecute(matching)}
                            >
                              <PlayArrowIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="취소">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setCancelDialog(matching)}
                            >
                              <CancelIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 20, 50]}
          labelRowsPerPage="페이지당 행:"
        />
      </Paper>

      {/* Detail Dialog */}
      <Dialog open={!!detailDialog} onClose={() => setDetailDialog(null)} maxWidth="sm" fullWidth>
        {detailDialog && (
          <>
            <DialogTitle>수동 매칭 상세</DialogTitle>
            <DialogContent dividers>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    ID
                  </Typography>
                  <Typography variant="body2">{detailDialog.id}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    상태
                  </Typography>
                  {getStatusChip(detailDialog.status)}
                </Box>
                <Divider />
                <Typography variant="subtitle2">매칭 유저</Typography>
                {detailDialog.users.map((u) => (
                  <Box key={u.id} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Chip
                      label={u.gender === 'MALE' ? '남' : '여'}
                      size="small"
                      color={u.gender === 'MALE' ? 'info' : 'secondary'}
                    />
                    <Box>
                      <Typography variant="body2">{u.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {u.university}
                      </Typography>
                    </Box>
                  </Box>
                ))}
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    유형
                  </Typography>
                  <Typography variant="body2">{getMatchTypeLabel(detailDialog.matchType)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    사유
                  </Typography>
                  <Typography variant="body2">{detailDialog.reason}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    예정 시간
                  </Typography>
                  <Typography variant="body2">{formatDateTime(detailDialog.scheduledAt)}</Typography>
                </Box>
                {detailDialog.executedAt && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      실행 시간
                    </Typography>
                    <Typography variant="body2">{formatDateTime(detailDialog.executedAt)}</Typography>
                  </Box>
                )}
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    생성자
                  </Typography>
                  <Typography variant="body2">
                    {detailDialog.createdBy.name} ({detailDialog.createdBy.email})
                  </Typography>
                </Box>
                {detailDialog.cancelledAt && (
                  <>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        취소 시간
                      </Typography>
                      <Typography variant="body2">{formatDateTime(detailDialog.cancelledAt)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        취소 사유
                      </Typography>
                      <Typography variant="body2">{detailDialog.cancelReason}</Typography>
                    </Box>
                  </>
                )}
                {detailDialog.logs && detailDialog.logs.length > 0 && (
                  <>
                    <Divider />
                    <Typography variant="subtitle2">로그</Typography>
                    {detailDialog.logs.map((log, i) => (
                      <Box key={i} sx={{ pl: 1, borderLeft: 2, borderColor: 'grey.300' }}>
                        <Typography variant="caption" color="text.secondary">
                          {formatDateTime(log.timestamp)} - {log.actor}
                        </Typography>
                        <Typography variant="body2">{log.details}</Typography>
                      </Box>
                    ))}
                  </>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button variant="outline" onClick={() => setDetailDialog(null)}>
                닫기
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={!!cancelDialog} onClose={() => setCancelDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>매칭 취소</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            이 매칭을 취소하시겠습니까?
          </Typography>
          <TextField
            fullWidth
            label="취소 사유"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            size="small"
            required
            placeholder="취소 사유를 입력하세요"
          />
        </DialogContent>
        <DialogActions>
          <Button variant="outline" onClick={() => setCancelDialog(null)}>
            닫기
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={!cancelReason.trim()}
          >
            취소 확인
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
