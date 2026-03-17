'use client';

import { useState, useEffect } from 'react';
import { Controller, useFieldArray } from 'react-hook-form';
import versionService, { VersionUpdate } from '@/app/services/version';
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { patchAdminAxios } from '@/shared/lib/http/admin-axios-interceptor';
import { useAdminForm } from '@/app/admin/hooks/forms';
import { versionFormSchema, type VersionFormData } from '@/app/admin/hooks/forms/schemas/version.schema';
import { safeToLocaleString, safeToLocaleDateString } from '@/app/utils/formatters';

function VersionManagementContent() {
  const [versions, setVersions] = useState<VersionUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<VersionUpdate | null>(null);

  useEffect(() => {
    const unpatch = patchAdminAxios();
    return () => unpatch();
  }, []);

  const { control: createControl, reset: resetCreate, handleFormSubmit: handleCreateSubmit } = useAdminForm<VersionFormData>({
    schema: versionFormSchema,
    defaultValues: { version: '', description: [{ value: '' }], shouldUpdate: false },
  });

  const { fields: createFields, append: createAppend, remove: createRemove } = useFieldArray({
    control: createControl,
    name: 'description',
  });

  const { control: editControl, reset: resetEdit, handleFormSubmit: handleEditSubmit } = useAdminForm<VersionFormData>({
    schema: versionFormSchema,
    defaultValues: { version: '', description: [{ value: '' }], shouldUpdate: false },
  });

  const { fields: editFields, append: editAppend, remove: editRemove } = useFieldArray({
    control: editControl,
    name: 'description',
  });

  useEffect(() => {
    fetchVersions();
  }, []);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await versionService.getAllVersionUpdates();
      setVersions(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVersion = handleCreateSubmit(async (data) => {
    try {
      setError(null);
      await versionService.createVersionUpdate({
        version: data.version,
        metadata: {
          description: data.description.map(d => d.value).filter(v => v.trim() !== '')
        },
        shouldUpdate: data.shouldUpdate
      });
      setSuccess('버전 업데이트가 성공적으로 생성되었습니다.');
      setCreateDialogOpen(false);
      resetCreate({ version: '', description: [{ value: '' }], shouldUpdate: false });
      fetchVersions();
    } catch (err: any) {
      setError(err.message);
    }
  });

  const handleUpdateVersion = handleEditSubmit(async (data) => {
    if (!selectedVersion) return;
    try {
      setError(null);
      await versionService.updateVersionUpdate(selectedVersion.id, {
        version: data.version,
        metadata: {
          description: data.description.map(d => d.value).filter(v => v.trim() !== '')
        },
        shouldUpdate: data.shouldUpdate
      });
      setSuccess('버전 업데이트가 성공적으로 수정되었습니다.');
      setEditDialogOpen(false);
      setSelectedVersion(null);
      fetchVersions();
    } catch (err: any) {
      setError(err.message);
    }
  });

  const openCreateDialog = () => {
    resetCreate({ version: '', description: [{ value: '' }], shouldUpdate: false });
    setCreateDialogOpen(true);
  };

  const openViewDialog = (version: VersionUpdate) => {
    setSelectedVersion(version);
    setViewDialogOpen(true);
  };

  const openEditDialog = (version: VersionUpdate) => {
    setSelectedVersion(version);
    resetEdit({
      version: version.version,
      description: version.metadata.description.map(v => ({ value: v })),
      shouldUpdate: version.shouldUpdate
    });
    setEditDialogOpen(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          버전 관리
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreateDialog}
        >
          새 버전 추가
        </Button>
      </Box>

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

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>버전</TableCell>
                <TableCell>설명</TableCell>
                <TableCell>업데이트 필요</TableCell>
                <TableCell>생성일</TableCell>
                <TableCell>작업</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {versions.map((version) => (
                <TableRow key={version.id}>
                  <TableCell>
                    <Typography variant="h6">{version.version}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 300 }}>
                      {version.metadata.description.slice(0, 2).join(', ')}
                      {version.metadata.description.length > 2 && '...'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={version.shouldUpdate ? '필요' : '불필요'}
                      color={version.shouldUpdate ? 'warning' : 'success'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {safeToLocaleDateString(version.createdAt)}
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => openViewDialog(version)} size="small">
                      <ViewIcon />
                    </IconButton>
                    <IconButton onClick={() => openEditDialog(version)} size="small">
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 새 버전 생성 다이얼로그 */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>새 버전 업데이트 생성</DialogTitle>
        <DialogContent>
          <Controller
            name="version"
            control={createControl}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                autoFocus
                margin="dense"
                label="버전"
                fullWidth
                variant="outlined"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                sx={{ mb: 2 }}
              />
            )}
          />

          <Typography variant="subtitle1" sx={{ mb: 1 }}>설명</Typography>
          {createFields.map((field, index) => (
            <Box key={field.id} sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <Controller
                name={`description.${index}.value`}
                control={createControl}
                render={({ field: inputField, fieldState }) => (
                  <TextField
                    {...inputField}
                    fullWidth
                    variant="outlined"
                    placeholder={`설명 ${index + 1}`}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
              {createFields.length > 1 && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => createRemove(index)}
                >
                  삭제
                </Button>
              )}
            </Box>
          ))}
          <Button
            variant="outlined"
            onClick={() => createAppend({ value: '' })}
            sx={{ mb: 2 }}
          >
            설명 추가
          </Button>

          <Controller
            name="shouldUpdate"
            control={createControl}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Switch
                    checked={field.value}
                    onChange={field.onChange}
                  />
                }
                label="업데이트 필요"
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>취소</Button>
          <Button onClick={handleCreateVersion} variant="contained">생성</Button>
        </DialogActions>
      </Dialog>

      {/* 버전 상세 보기 다이얼로그 */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>버전 상세 정보</DialogTitle>
        <DialogContent>
          {selectedVersion && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                버전: {selectedVersion.version}
              </Typography>

              <Typography variant="subtitle1" sx={{ mb: 1 }}>설명:</Typography>
              <List>
                {selectedVersion.metadata.description.map((desc, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={`• ${desc}`} />
                  </ListItem>
                ))}
              </List>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body1" sx={{ mb: 1 }}>
                업데이트 필요: {selectedVersion.shouldUpdate ? '예' : '아니오'}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                생성일: {safeToLocaleString(selectedVersion.createdAt)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* 버전 수정 다이얼로그 */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>버전 업데이트 수정</DialogTitle>
        <DialogContent>
          <Controller
            name="version"
            control={editControl}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                autoFocus
                margin="dense"
                label="버전"
                fullWidth
                variant="outlined"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                sx={{ mb: 2 }}
              />
            )}
          />

          <Typography variant="subtitle1" sx={{ mb: 1 }}>설명</Typography>
          {editFields.map((field, index) => (
            <Box key={field.id} sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <Controller
                name={`description.${index}.value`}
                control={editControl}
                render={({ field: inputField, fieldState }) => (
                  <TextField
                    {...inputField}
                    fullWidth
                    variant="outlined"
                    placeholder={`설명 ${index + 1}`}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
              {editFields.length > 1 && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => editRemove(index)}
                >
                  삭제
                </Button>
              )}
            </Box>
          ))}
          <Button
            variant="outlined"
            onClick={() => editAppend({ value: '' })}
            sx={{ mb: 2 }}
          >
            설명 추가
          </Button>

          <Controller
            name="shouldUpdate"
            control={editControl}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Switch
                    checked={field.value}
                    onChange={field.onChange}
                  />
                }
                label="업데이트 필요"
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>취소</Button>
          <Button onClick={handleUpdateVersion} variant="contained">수정</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default function VersionManagementV2() {
  return <VersionManagementContent />;
}
