import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import AdminService from '@/app/services/admin';
import type { DepartmentItem, UniversityItem } from '@/types/admin';

interface UniversityTransferModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName?: string;
  currentUniversityName?: string | null;
  currentDepartmentName?: string | null;
  currentGrade?: string | null;
  isVerified?: boolean;
  onSuccess?: (result: { universityName: string; departmentName: string }) => void;
}

function normalizeItems<T>(value: any): T[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.data?.items)) return value.data.items;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

export default function UniversityTransferModal({
  open,
  onClose,
  userId,
  userName,
  currentUniversityName,
  currentDepartmentName,
  currentGrade,
  isVerified,
  onSuccess,
}: UniversityTransferModalProps) {
  const [universitySearch, setUniversitySearch] = useState('');
  const [departmentSearch, setDepartmentSearch] = useState('');
  const [universities, setUniversities] = useState<UniversityItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState<UniversityItem | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentItem | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [loadingUniversities, setLoadingUniversities] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setUniversitySearch('');
      setDepartmentSearch('');
      setUniversities([]);
      setDepartments([]);
      setSelectedUniversity(null);
      setSelectedDepartment(null);
      setConfirmed(false);
      setError(null);
      return;
    }

    let active = true;
    setLoadingUniversities(true);
    const timer = setTimeout(async () => {
      try {
        const result = await AdminService.universities.getList({
          name: universitySearch.trim() || undefined,
          limit: 20,
          isActive: true,
          sortBy: 'name',
          sortOrder: 'asc',
        });
        if (active) setUniversities(normalizeItems<UniversityItem>(result));
      } catch (err: any) {
        if (active) setError(err.message || '대학교 목록을 불러오지 못했습니다.');
      } finally {
        if (active) setLoadingUniversities(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [open, universitySearch]);

  useEffect(() => {
    if (!open || !selectedUniversity) {
      setDepartments([]);
      setSelectedDepartment(null);
      return;
    }

    let active = true;
    setLoadingDepartments(true);
    const timer = setTimeout(async () => {
      try {
        const result = await AdminService.universities.departments.getList(selectedUniversity.id, {
          name: departmentSearch.trim() || undefined,
          limit: 30,
          isActive: true,
          sortBy: 'displayOrder',
          sortOrder: 'asc',
        });
        if (active) setDepartments(normalizeItems<DepartmentItem>(result));
      } catch (err: any) {
        if (active) setError(err.message || '학과 목록을 불러오지 못했습니다.');
      } finally {
        if (active) setLoadingDepartments(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [open, selectedUniversity, departmentSearch]);

  const isSameTarget = useMemo(() => {
    return (
      selectedUniversity?.name === currentUniversityName &&
      selectedDepartment?.name === currentDepartmentName
    );
  }, [currentDepartmentName, currentUniversityName, selectedDepartment, selectedUniversity]);

  const canSave = Boolean(selectedUniversity && selectedDepartment && confirmed && !isSameTarget);

  const handleSubmit = async () => {
    if (!selectedUniversity || !selectedDepartment || !canSave) return;

    try {
      setSaving(true);
      setError(null);
      const result = await AdminService.userAppearance.updateUserUniversity(userId, {
        universityId: selectedUniversity.id,
        departmentId: selectedDepartment.id,
      });
      onSuccess?.({
        universityName: result?.universityName ?? selectedUniversity.name,
        departmentName: result?.departmentName ?? selectedDepartment.name,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || '학교/학과 변경 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SchoolIcon color="primary" />
          학교/학과 변경
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
              {currentUniversityName || '학교 없음'} · {currentDepartmentName || '학과 없음'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              {currentGrade && <Chip size="small" label={`${currentGrade}학년`} />}
              <Chip
                size="small"
                color={isVerified ? 'success' : 'warning'}
                variant="outlined"
                label={isVerified ? '인증 유지' : '미인증'}
              />
            </Box>
          </Box>

          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Autocomplete
                options={universities}
                value={selectedUniversity}
                inputValue={universitySearch}
                onInputChange={(_, value) => setUniversitySearch(value)}
                onChange={(_, value) => {
                  setSelectedUniversity(value);
                  setDepartmentSearch('');
                  setSelectedDepartment(null);
                  setConfirmed(false);
                }}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                loading={loadingUniversities}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="변경할 대학교"
                    placeholder="대학교명 검색"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingUniversities ? <CircularProgress size={18} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Autocomplete
                options={departments}
                value={selectedDepartment}
                inputValue={departmentSearch}
                onInputChange={(_, value) => setDepartmentSearch(value)}
                onChange={(_, value) => {
                  setSelectedDepartment(value);
                  setConfirmed(false);
                }}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                loading={loadingDepartments}
                disabled={!selectedUniversity}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="변경할 학과"
                    placeholder={selectedUniversity ? '학과명 검색' : '먼저 대학교를 선택하세요'}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingDepartments ? <CircularProgress size={18} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>

          {isSameTarget && (
            <Alert severity="info" sx={{ mt: 2 }}>
              현재 학교/학과와 동일합니다.
            </Alert>
          )}

          <FormControlLabel
            sx={{ mt: 2 }}
            control={
              <Checkbox
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                disabled={!selectedUniversity || !selectedDepartment || isSameTarget || saving}
              />
            }
            label="이 유저의 학교/학과를 변경합니다."
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
