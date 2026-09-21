import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  TextField,
  Typography,
} from '@mui/material';
import CakeIcon from '@mui/icons-material/Cake';
import { calculateAge } from '@/app/utils/formatters';
import { useUpdateUserBirthday } from '@/app/admin/hooks/use-users';

const MIN_AGE = 18;
const MAX_AGE = 27;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

interface BirthdayEditModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName?: string;
  currentBirthday?: string | null;
  currentAge?: number;
  onSuccess?: (result: { birthday: string; age: number }) => void;
}

export default function BirthdayEditModal({
  open,
  onClose,
  userId,
  userName,
  currentBirthday,
  currentAge,
  onSuccess,
}: BirthdayEditModalProps) {
  const [birthday, setBirthday] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mutation = useUpdateUserBirthday();
  const saving = mutation.isPending;

  useEffect(() => {
    if (!open) {
      setBirthday('');
      setConfirmed(false);
      setError(null);
      return;
    }
    setBirthday(currentBirthday ?? '');
    setConfirmed(false);
    setError(null);
  }, [open, currentBirthday]);

  const validFormat = DATE_RE.test(birthday);
  const previewAge = useMemo(() => {
    if (!DATE_RE.test(birthday)) return Number.NaN;
    return calculateAge(birthday);
  }, [birthday]);

  const outOfRange = Number.isFinite(previewAge) && (previewAge < MIN_AGE || previewAge > MAX_AGE);
  const isSame = birthday === (currentBirthday ?? '');
  const canSave = Boolean(validFormat && !outOfRange && !isSame && confirmed);

  const handleSubmit = async () => {
    if (!canSave) return;
    try {
      setError(null);
      const result = await mutation.mutateAsync({ userId, birthday });
      onSuccess?.({ birthday: result.birthday, age: result.age });
      onClose();
    } catch (err: any) {
      setError(err.message || '생년월일 변경 중 오류가 발생했습니다.');
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CakeIcon color="primary" />
          생년월일(나이) 변경
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              변경 대상
            </Typography>
            <Typography variant="subtitle1">{userName || userId}</Typography>
          </Box>

          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1.5, mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              현재 정보
            </Typography>
            <Typography variant="body1">
              {currentBirthday || '생년월일 없음'}
              {typeof currentAge === 'number' ? ` · 만 ${currentAge}세` : ''}
            </Typography>
          </Box>

          <Divider sx={{ mb: 2 }} />

          <TextField
            fullWidth
            type="date"
            label="변경할 생년월일"
            value={birthday}
            onChange={(event) => {
              setBirthday(event.target.value);
              setConfirmed(false);
            }}
            InputLabelProps={{ shrink: true }}
          />

          {Number.isFinite(previewAge) && (
            <Typography variant="body2" sx={{ mt: 1 }} color={outOfRange ? 'error' : 'text.secondary'}>
              만 나이: {previewAge}세
            </Typography>
          )}

          {outOfRange && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              허용 연령({MIN_AGE}~{MAX_AGE}세)을 벗어납니다. 서버에서 거부됩니다.
            </Alert>
          )}

          {isSame && birthday && (
            <Alert severity="info" sx={{ mt: 2 }}>
              현재 생년월일과 동일합니다.
            </Alert>
          )}

          <FormControlLabel
            sx={{ mt: 2 }}
            control={
              <Checkbox
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                disabled={!validFormat || outOfRange || isSame || saving}
              />
            }
            label="이 유저의 생년월일과 나이를 변경합니다. (매칭 점수에 즉시 반영)"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving} color="inherit">
          취소
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!canSave || saving}>
          {saving ? '변경 중...' : '변경하기'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
