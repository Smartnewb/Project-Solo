import { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Avatar,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material';
import UploadIcon from '@mui/icons-material/Upload';
import DeleteIcon from '@mui/icons-material/Delete';
import SchoolIcon from '@mui/icons-material/School';
import AdminService from '@/app/services/admin';
import type { UniversityDetail } from '@/types/admin';

interface LogoUploadProps {
  university: UniversityDetail;
  onUploaded: () => void;
}

export default function LogoUpload({ university, onUploaded }: LogoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('JPG, PNG, WEBP 형식의 이미지만 업로드 가능합니다.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    setError('');
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    if (!university.code) {
      setError('대학 코드가 설정되지 않았습니다. 먼저 대학 정보를 수정하여 코드를 설정해주세요.');
      return;
    }

    try {
      setUploading(true);
      setError('');
      await AdminService.universities.uploadLogo(university.id, selectedFile);
      setSelectedFile(null);
      setPreview(null);
      onUploaded();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('로고를 삭제하시겠습니까?')) return;

    try {
      setDeleting(true);
      setError('');
      await AdminService.universities.deleteLogo(university.id);
      onUploaded();
    } catch (err: any) {
      setError(err.response?.data?.message || '삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreview(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Box sx={{ py: 2 }}>
      {!university.code && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          로고를 업로드하려면 먼저 대학 코드를 설정해야 합니다.
        </Alert>
      )}

      <Paper variant="outlined" sx={{ p: 3, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          현재 로고
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
          {university.logoUrl ? (
            <>
              <Avatar
                src={university.logoUrl}
                alt={university.name}
                sx={{ width: 100, height: 100 }}
              />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {university.logoUrl}
                </Typography>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<DeleteIcon />}
                  onClick={handleDelete}
                  disabled={deleting}
                  sx={{ mt: 1 }}
                >
                  {deleting ? '삭제 중...' : '로고 삭제'}
                </Button>
              </Box>
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 2, width: '100%', color: 'text.secondary' }}>
              <Avatar sx={{ width: 100, height: 100, mx: 'auto', mb: 1, bgcolor: 'grey.300' }}>
                <SchoolIcon sx={{ fontSize: 48 }} />
              </Avatar>
              <Typography>등록된 로고가 없습니다.</Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          새 로고 업로드
        </Typography>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {preview ? (
          <Box>
            <Box sx={{ mt: 2, mb: 2, textAlign: 'center' }}>
              <Avatar
                src={preview}
                alt="Preview"
                sx={{ width: 100, height: 100, mx: 'auto', mb: 1 }}
              />
              <Typography variant="caption" color="text.secondary">
                미리보기
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
              <Button
                variant="contained"
                startIcon={<UploadIcon />}
                onClick={handleUpload}
                disabled={uploading || !university.code}
              >
                {uploading ? <CircularProgress size={24} /> : '업로드'}
              </Button>
              <Button variant="outlined" onClick={handleCancel} disabled={uploading}>
                취소
              </Button>
            </Box>
          </Box>
        ) : (
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => fileInputRef.current?.click()}
            sx={{ mt: 2 }}
            disabled={!university.code}
          >
            파일 선택
          </Button>
        )}

        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
          • JPG, PNG, WEBP 형식만 가능
          <br />
          • 최대 파일 크기: 5MB
          <br />• 파일명은 대학 코드를 기반으로 자동 생성됩니다
        </Typography>
      </Paper>
    </Box>
  );
}
