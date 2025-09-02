'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import versionService, { VersionUpdate, CreateVersionUpdateRequest } from '@/app/services/version';
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
  Update as UpdateIcon
} from '@mui/icons-material';

export default function VersionManagement() {
  const { isAdmin } = useAuth();
  const [versions, setVersions] = useState<VersionUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 다이얼로그 상태
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<VersionUpdate | null>(null);

  // 폼 상태
  const [formData, setFormData] = useState({
    version: '',
    description: [''],
    shouldUpdate: false
  });

  useEffect(() => {
    if (isAdmin) {
      fetchVersions();
    }
  }, [isAdmin]);

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

  const handleCreateVersion = async () => {
    try {
      setError(null);
      const createData: CreateVersionUpdateRequest = {
        version: formData.version,
        metadata: {
          description: formData.description.filter(desc => desc.trim() !== '')
        },
        shouldUpdate: formData.shouldUpdate
      };

      await versionService.createVersionUpdate(createData);
      setSuccess('버전 업데이트가 성공적으로 생성되었습니다.');
      setCreateDialogOpen(false);
      resetForm();
      fetchVersions();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateVersion = async () => {
    if (!selectedVersion) return;

    try {
      setError(null);
      const updateData = {
        version: formData.version,
        metadata: {
          description: formData.description.filter(desc => desc.trim() !== '')
        },
        shouldUpdate: formData.shouldUpdate
      };

      await versionService.updateVersionUpdate(selectedVersion.id, updateData);
      setSuccess('버전 업데이트가 성공적으로 수정되었습니다.');
      setEditDialogOpen(false);
      resetForm();
      fetchVersions();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      version: '',
      description: [''],
      shouldUpdate: false
    });
    setSelectedVersion(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setCreateDialogOpen(true);
  };

  const openViewDialog = (version: VersionUpdate) => {
    setSelectedVersion(version);
    setViewDialogOpen(true);
  };

  const openEditDialog = (version: VersionUpdate) => {
    setSelectedVersion(version);
    setFormData({
      version: version.version,
      description: version.metadata.description,
      shouldUpdate: version.shouldUpdate
    });
    setEditDialogOpen(true);
  };

  const addDescriptionField = () => {
    setFormData(prev => ({
      ...prev,
      description: [...prev.description, '']
    }));
  };

  const updateDescriptionField = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      description: prev.description.map((desc, i) => i === index ? value : desc)
    }));
  };

  const removeDescriptionField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      description: prev.description.filter((_, i) => i !== index)
    }));
  };

  if (!isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">관리자 권한이 필요합니다.</Alert>
      </Box>
    );
  }

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
                    {new Date(version.createdAt).toLocaleDateString('ko-KR')}
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
          <TextField
            autoFocus
            margin="dense"
            label="버전"
            fullWidth
            variant="outlined"
            value={formData.version}
            onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
            sx={{ mb: 2 }}
          />

          <Typography variant="subtitle1" sx={{ mb: 1 }}>설명</Typography>
          {formData.description.map((desc, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                fullWidth
                variant="outlined"
                value={desc}
                onChange={(e) => updateDescriptionField(index, e.target.value)}
                placeholder={`설명 ${index + 1}`}
              />
              {formData.description.length > 1 && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => removeDescriptionField(index)}
                >
                  삭제
                </Button>
              )}
            </Box>
          ))}
          <Button
            variant="outlined"
            onClick={addDescriptionField}
            sx={{ mb: 2 }}
          >
            설명 추가
          </Button>

          <FormControlLabel
            control={
              <Switch
                checked={formData.shouldUpdate}
                onChange={(e) => setFormData(prev => ({ ...prev, shouldUpdate: e.target.checked }))}
              />
            }
            label="업데이트 필요"
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
                생성일: {new Date(selectedVersion.createdAt).toLocaleString('ko-KR')}
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
          <TextField
            autoFocus
            margin="dense"
            label="버전"
            fullWidth
            variant="outlined"
            value={formData.version}
            onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
            sx={{ mb: 2 }}
          />

          <Typography variant="subtitle1" sx={{ mb: 1 }}>설명</Typography>
          {formData.description.map((desc, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                fullWidth
                variant="outlined"
                value={desc}
                onChange={(e) => updateDescriptionField(index, e.target.value)}
                placeholder={`설명 ${index + 1}`}
              />
              {formData.description.length > 1 && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => removeDescriptionField(index)}
                >
                  삭제
                </Button>
              )}
            </Box>
          ))}
          <Button
            variant="outlined"
            onClick={addDescriptionField}
            sx={{ mb: 2 }}
          >
            설명 추가
          </Button>

          <FormControlLabel
            control={
              <Switch
                checked={formData.shouldUpdate}
                onChange={(e) => setFormData(prev => ({ ...prev, shouldUpdate: e.target.checked }))}
              />
            }
            label="업데이트 필요"
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
