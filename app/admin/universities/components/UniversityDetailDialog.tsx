import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  Chip,
  Avatar,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import AdminService from '@/app/services/admin';
import DepartmentManagement from './DepartmentManagement';
import LogoUpload from './LogoUpload';
import type { UniversityItem, UniversityDetail } from '@/types/admin';

interface UniversityDetailDialogProps {
  open: boolean;
  onClose: () => void;
  university: UniversityItem;
  onRefresh: () => void;
}

type TabValue = 'info' | 'departments' | 'logo';

export default function UniversityDetailDialog({
  open,
  onClose,
  university,
  onRefresh,
}: UniversityDetailDialogProps) {
  const [tabValue, setTabValue] = useState<TabValue>('info');
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<UniversityDetail | null>(null);

  useEffect(() => {
    if (open) {
      loadDetail();
    }
  }, [open, university.id]);

  const loadDetail = async () => {
    try {
      setLoading(true);
      const data = await AdminService.universities.getById(university.id);
      setDetail(data);
    } catch (err) {
      console.error('상세 정보 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: TabValue) => {
    setTabValue(newValue);
  };

  const handleLogoUploaded = () => {
    loadDetail();
    onRefresh();
  };

  const handleDepartmentChanged = () => {
    loadDetail();
    onRefresh();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {university.logoUrl ? (
            <Avatar src={university.logoUrl} alt={university.name} sx={{ width: 56, height: 56 }} />
          ) : (
            <Avatar sx={{ width: 56, height: 56, bgcolor: 'grey.300' }}>
              <SchoolIcon />
            </Avatar>
          )}
          <Box>
            <Typography variant="h6">{university.name}</Typography>
            {university.en && (
              <Typography variant="body2" color="text.secondary">
                {university.en}
              </Typography>
            )}
          </Box>
        </Box>
      </DialogTitle>

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="기본 정보" value="info" />
        <Tab label={`학과 관리 (${detail?.departmentCount || 0})`} value="departments" />
        <Tab label="로고 관리" value="logo" />
      </Tabs>

      <DialogContent sx={{ minHeight: 400 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {tabValue === 'info' && detail && (
              <Box sx={{ py: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      대학 ID
                    </Typography>
                    <Typography variant="body1">{detail.id}</Typography>
                  </Box>

                  <Divider />

                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        대학 코드
                      </Typography>
                      <Typography variant="body1">
                        {detail.code || '-'}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        지역
                      </Typography>
                      <Typography variant="body1">
                        {detail.regionName || detail.region}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        대학 유형
                      </Typography>
                      <Chip
                        label={detail.type === 'UNIVERSITY' ? '4년제' : '전문대'}
                        size="small"
                        color={detail.type === 'UNIVERSITY' ? 'primary' : 'secondary'}
                      />
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        설립 유형
                      </Typography>
                      <Typography variant="body1">
                        {detail.foundation || '-'}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        활성화 상태
                      </Typography>
                      <Chip
                        label={detail.isActive ? '활성' : '비활성'}
                        size="small"
                        color={detail.isActive ? 'success' : 'default'}
                      />
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        학과 수
                      </Typography>
                      <Typography variant="body1">
                        {detail.departmentCount || 0}개
                      </Typography>
                    </Box>
                  </Box>

                  <Divider />

                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        생성일
                      </Typography>
                      <Typography variant="body2">
                        {new Date(detail.createdAt).toLocaleString('ko-KR')}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        수정일
                      </Typography>
                      <Typography variant="body2">
                        {new Date(detail.updatedAt).toLocaleString('ko-KR')}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            )}

            {tabValue === 'departments' && detail && (
              <DepartmentManagement
                university={detail}
                onChanged={handleDepartmentChanged}
              />
            )}

            {tabValue === 'logo' && detail && (
              <LogoUpload
                university={detail}
                onUploaded={handleLogoUploaded}
              />
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>닫기</Button>
      </DialogActions>
    </Dialog>
  );
}
