import { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Divider,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import AdminService from '@/app/services/admin';
import type { UploadDepartmentsCsvResponse } from '@/types/admin';

interface DepartmentCsvUploadProps {
  open: boolean;
  onClose: () => void;
  universityId: string;
  universityName: string;
  onSuccess: () => void;
}

export default function DepartmentCsvUpload({
  open,
  onClose,
  universityId,
  universityName,
  onSuccess,
}: DepartmentCsvUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [result, setResult] = useState<UploadDepartmentsCsvResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.csv')) {
      setError('CSV 파일만 업로드 가능합니다.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    setError('');
    setResult(null);
    setSelectedFile(file);
  };

  const handleDownloadTemplate = async () => {
    try {
      setDownloadingTemplate(true);
      setError('');
      const blob = await AdminService.universities.departments.downloadTemplate(universityId);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'departments_template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.response?.data?.message || '템플릿 다운로드에 실패했습니다.');
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    if (!confirm('기존 학과가 모두 삭제되고 CSV 파일의 내용으로 교체됩니다. 계속하시겠습니까?')) {
      return;
    }

    try {
      setUploading(true);
      setError('');
      const response = await AdminService.universities.departments.uploadCsv(
        universityId,
        selectedFile
      );
      setResult(response);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setSelectedFile(null);

      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || '업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setSelectedFile(null);
      setError('');
      setResult(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        학과 CSV 일괄 업로드
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {universityName}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* 안내 메시지 */}
          <Alert severity="warning" icon={<WarningIcon />}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              주의: 기존 학과가 모두 삭제됩니다
            </Typography>
            <Typography variant="caption">
              CSV 파일의 내용으로 학과 목록이 완전히 교체됩니다. 필요한 경우 먼저 백업하세요.
            </Typography>
          </Alert>

          {/* 사용 방법 */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InfoIcon fontSize="small" color="info" />
              사용 방법
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Typography variant="body2" color="primary">1.</Typography>
                </ListItemIcon>
                <ListItemText
                  primary="템플릿 다운로드"
                  secondary="CSV 형식을 확인하세요"
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Typography variant="body2" color="primary">2.</Typography>
                </ListItemIcon>
                <ListItemText
                  primary="데이터 작성"
                  secondary="Excel에서 작성 후 CSV UTF-8로 저장"
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Typography variant="body2" color="primary">3.</Typography>
                </ListItemIcon>
                <ListItemText
                  primary="파일 업로드"
                  secondary="작성한 CSV 파일을 업로드"
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
            </List>
          </Paper>

          {/* 템플릿 다운로드 */}
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadTemplate}
            disabled={downloadingTemplate || uploading}
            fullWidth
          >
            {downloadingTemplate ? '다운로드 중...' : 'CSV 템플릿 다운로드'}
          </Button>

          <Divider />

          {/* 파일 선택 */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv,application/vnd.ms-excel"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          <Button
            variant="outlined"
            startIcon={<UploadFileIcon />}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            fullWidth
          >
            CSV 파일 선택
          </Button>

          {selectedFile && (
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="body2" fontWeight="medium" gutterBottom>
                선택된 파일
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
              </Typography>
            </Paper>
          )}

          {/* 에러 메시지 */}
          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* 업로드 결과 */}
          {result && (
            <Alert
              severity={result.warnings && result.warnings.length > 0 ? 'warning' : 'success'}
              icon={<CheckCircleIcon />}
            >
              <Typography variant="body2" fontWeight="bold" gutterBottom>
                {result.message}
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" display="block">
                  삭제: {result.deleted}개 | 생성: {result.created}개
                </Typography>
                {result.warnings && result.warnings.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" fontWeight="medium" display="block">
                      경고:
                    </Typography>
                    {result.warnings.map((warning, index) => (
                      <Typography key={index} variant="caption" display="block" color="warning.main">
                        • {warning}
                      </Typography>
                    ))}
                  </Box>
                )}
              </Box>
            </Alert>
          )}

          {/* CSV 형식 안내 */}
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom fontWeight="medium">
              CSV 형식 안내
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              • 필수 컬럼: name (학과명)
              <br />
              • 선택 컬럼: code, nameEn, displayOrder, isActive
              <br />
              • UTF-8 인코딩 권장
              <br />
              • 최대 파일 크기: 5MB
            </Typography>
          </Paper>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={uploading}>
          {result ? '닫기' : '취소'}
        </Button>
        <Button
          onClick={handleUpload}
          variant="contained"
          disabled={!selectedFile || uploading}
          startIcon={uploading ? <CircularProgress size={16} /> : <UploadFileIcon />}
        >
          {uploading ? '업로드 중...' : '업로드'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
