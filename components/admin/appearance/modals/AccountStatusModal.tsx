import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Radio,
  RadioGroup,
} from '@mui/material';
import AdminService from '@/app/services/admin';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';

export type SuspendDurationDays = 3 | 7 | 14 | 30;

interface AccountStatusModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  /** true면 정지 해제, false면 계정 정지 */
  isSuspended: boolean;
  userName?: string;
  onSuccess?: (message: string) => void;
}

const DURATION_OPTIONS: SuspendDurationDays[] = [3, 7, 14, 30];

const AccountStatusModal: React.FC<AccountStatusModalProps> = ({
  open,
  onClose,
  userId,
  isSuspended,
  userName,
  onSuccess,
}) => {
  const [reason, setReason] = useState('');
  const [suspendType, setSuspendType] = useState<'permanent' | 'temporary'>('permanent');
  const [durationDays, setDurationDays] = useState<SuspendDurationDays>(7);
  const [localNote, setLocalNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) return;
    setReason('');
    setSuspendType('permanent');
    setDurationDays(7);
    setLocalNote('');
    setError(null);
    setSuccess(false);
    setLoading(false);
  }, [open, isSuspended, userId]);

  const canSubmitSuspend = reason.trim().length > 0;
  const title = isSuspended ? '정지 해제' : '계정 정지';

  const handleSubmit = async () => {
    if (!userId || loading || success) return;

    if (!isSuspended && !canSubmitSuspend) {
      setError('정지 사유를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (isSuspended) {
        await AdminService.userAppearance.unsuspendUser(userId);
        setSuccess(true);
        onSuccess?.('계정 정지가 해제되었습니다.');
      } else {
        await AdminService.userAppearance.suspendUser(userId, {
          reason: reason.trim(),
          ...(suspendType === 'permanent'
            ? { permanent: true }
            : { durationDays }),
        });
        const successMessage =
          suspendType === 'permanent'
            ? '계정이 영구 정지되었습니다. 이용약관 고지(인앱 알림+SMS)가 발송됩니다.'
            : `계정이 ${durationDays}일 정지되었습니다. 이용약관 고지(인앱 알림+SMS)가 발송됩니다.`;
        setSuccess(true);
        onSuccess?.(successMessage);
      }

      setTimeout(() => {
        handleClose();
      }, 800);
    } catch (err: unknown) {
      setError(
        getAdminErrorMessage(
          err,
          isSuspended ? '정지 해제 중 오류가 발생했습니다.' : '계정 정지 중 오류가 발생했습니다.',
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setReason('');
    setSuspendType('permanent');
    setDurationDays(7);
    setLocalNote('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {success ? (
          <Alert severity="success" sx={{ mt: 2 }}>
            {isSuspended
              ? '계정 정지가 해제되었습니다.'
              : '계정 정지가 완료되었습니다. 이용약관 고지(인앱 알림+SMS)가 발송됩니다.'}
          </Alert>
        ) : (
          <Box sx={{ pt: 2 }}>
            {userName && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                대상: <strong>{userName}</strong>
              </Typography>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {isSuspended ? (
              <>
                <Alert severity="info" sx={{ mb: 2 }}>
                  정지를 해제하면 사용자가 다시 로그인·이용할 수 있습니다.
                </Alert>
                <TextField
                  fullWidth
                  label="내부 메모 (선택)"
                  multiline
                  rows={3}
                  value={localNote}
                  onChange={(e) => setLocalNote(e.target.value)}
                  disabled={loading}
                  placeholder="해제 사유를 내부용으로 남겨둘 수 있습니다. API로는 전송되지 않습니다."
                  helperText="메모는 이 화면에서만 확인 가능하며 서버에 저장되지 않습니다."
                />
              </>
            ) : (
              <>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    정지 시 이용약관 고지(인앱 알림+SMS)가 발송됩니다.
                  </Typography>
                  <Typography variant="body2">
                    블랙리스트와 다릅니다. 블랙리스트는 별도 버튼입니다.
                  </Typography>
                </Alert>

                <FormControl component="fieldset" sx={{ mb: 2 }} disabled={loading}>
                  <FormLabel component="legend">정지 유형</FormLabel>
                  <RadioGroup
                    row
                    value={suspendType}
                    onChange={(e) =>
                      setSuspendType(e.target.value as 'permanent' | 'temporary')
                    }
                  >
                    <FormControlLabel value="permanent" control={<Radio />} label="영구 정지" />
                    <FormControlLabel value="temporary" control={<Radio />} label="기간 정지" />
                  </RadioGroup>
                </FormControl>

                {suspendType === 'temporary' && (
                  <FormControl fullWidth sx={{ mb: 2 }} disabled={loading}>
                    <InputLabel id="suspend-duration-label">정지 기간</InputLabel>
                    <Select
                      labelId="suspend-duration-label"
                      value={durationDays}
                      label="정지 기간"
                      onChange={(e) =>
                        setDurationDays(Number(e.target.value) as SuspendDurationDays)
                      }
                    >
                      {DURATION_OPTIONS.map((days) => (
                        <MenuItem key={days} value={days}>
                          {days}일
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                <TextField
                  fullWidth
                  label="정지 사유"
                  multiline
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={loading}
                  placeholder="정지 사유를 입력하세요 (필수)"
                  helperText="사유는 운영 기록 및 약관 고지 처리에 사용됩니다."
                  required
                  error={!reason.trim()}
                />

                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    bgcolor: 'rgba(211, 47, 47, 0.06)',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'error.light',
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main', mb: 0.5 }}>
                    처리 안내
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    · 계정 정지 시 사용자가 앱에 로그인할 수 없습니다.
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    · 백엔드가 이용약관 §25 고지(인앱 알림+SMS)를 발송합니다.
                  </Typography>
                  <Typography variant="body2">
                    · 영구 차단(블랙리스트)이 필요하면 상단의 블랙리스트 버튼을 사용하세요. 블랙리스트는 약관 고지가 없습니다.
                  </Typography>
                </Box>
              </>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          취소
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color={isSuspended ? 'primary' : 'warning'}
          disabled={loading || success || (!isSuspended && !canSubmitSuspend)}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {loading ? '처리 중...' : isSuspended ? '정지 해제' : '계정 정지'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AccountStatusModal;
