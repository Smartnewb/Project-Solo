'use client';

import { useState, useEffect } from 'react';
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
  TablePagination,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Avatar,
  Grid,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Person as PersonIcon,
  Report as ReportIcon
} from '@mui/icons-material';
import AdminService from '@/app/services/admin';

// 신고 데이터 타입 정의
interface Reporter {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  age: number;
  gender: 'MALE' | 'FEMALE';
  profileImageUrl: string;
}

interface Reported {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  age: number;
  gender: 'MALE' | 'FEMALE';
  profileImageUrl: string;
}

interface Report {
  id: string;
  reporter: Reporter;
  reported: Reported;
  reason: string;
  description: string | null;
  evidenceImages: string[];
  status: 'pending' | 'reviewing' | 'resolved' | 'rejected';
  createdAt: string;
  updatedAt: string | null;
}

interface ReportsResponse {
  items: Report[];
  meta: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export default function ReportsManagement() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [reporterNameFilter, setReporterNameFilter] = useState<string>('');
  const [reportedNameFilter, setReportedNameFilter] = useState<string>('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // 신고 목록 조회
  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('page', (page + 1).toString());
      params.append('limit', rowsPerPage.toString());
      
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      if (reporterNameFilter.trim()) {
        params.append('reporterName', reporterNameFilter.trim());
      }
      if (reportedNameFilter.trim()) {
        params.append('reportedName', reportedNameFilter.trim());
      }

      const response = await AdminService.getProfileReports(params);
      
      if (response?.items) {
        setReports(response.items);
        setTotalCount(response.meta.totalItems);
      } else {
        setReports([]);
        setTotalCount(0);
      }
    } catch (err: any) {
      console.error('신고 목록 조회 오류:', err);
      setError('신고 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchReports();
  }, [page, rowsPerPage, statusFilter, reporterNameFilter, reportedNameFilter]);

  // 페이지 변경 핸들러
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // 페이지당 행 수 변경 핸들러
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 상태 필터 변경 핸들러
  const handleStatusFilterChange = (event: any) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  // 신고자 이름 필터 변경 핸들러
  const handleReporterNameFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setReporterNameFilter(event.target.value);
    setPage(0);
  };

  // 신고당한 사용자 이름 필터 변경 핸들러
  const handleReportedNameFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setReportedNameFilter(event.target.value);
    setPage(0);
  };

  // 신고 상세 보기
  const handleViewDetail = (report: Report) => {
    setSelectedReport(report);
    setDetailDialogOpen(true);
  };



  // 상태 표시 함수
  const getStatusChip = (status: string) => {
    const statusMap = {
      pending: { label: '대기중', color: 'warning' as const },
      reviewing: { label: '검토중', color: 'info' as const },
      resolved: { label: '처리완료', color: 'success' as const },
      rejected: { label: '반려', color: 'error' as const }
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, color: 'default' as const };
    return <Chip label={statusInfo.label} color={statusInfo.color} size="small" />;
  };

  // 성별 표시 함수
  const getGenderText = (gender: string) => {
    return gender === 'MALE' ? '남성' : '여성';
  };

  // 날짜 포맷 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <ReportIcon sx={{ fontSize: 36, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          신고 관리
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 필터 섹션 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          필터
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>상태</InputLabel>
              <Select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                label="상태"
              >
                <MenuItem value="">전체</MenuItem>
                <MenuItem value="pending">대기중</MenuItem>
                <MenuItem value="reviewing">검토중</MenuItem>
                <MenuItem value="resolved">처리완료</MenuItem>
                <MenuItem value="rejected">반려</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="신고자 이름"
              value={reporterNameFilter}
              onChange={handleReporterNameFilterChange}
              placeholder="신고자 이름 검색"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="신고당한 사용자 이름"
              value={reportedNameFilter}
              onChange={handleReportedNameFilterChange}
              placeholder="신고당한 사용자 이름 검색"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* 신고 목록 테이블 */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>신고 ID</TableCell>
                <TableCell>신고자</TableCell>
                <TableCell>신고당한 사용자</TableCell>
                <TableCell>신고 사유</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>신고일시</TableCell>
                <TableCell>액션</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    신고 내역이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {report.id.slice(0, 8)}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar
                          src={report.reporter.profileImageUrl}
                          sx={{ width: 32, height: 32 }}
                        />
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {report.reporter.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {getGenderText(report.reporter.gender)}, {report.reporter.age}세
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar
                          src={report.reported.profileImageUrl}
                          sx={{ width: 32, height: 32 }}
                        />
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {report.reported.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {getGenderText(report.reported.gender)}, {report.reported.age}세
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {report.reason}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {getStatusChip(report.status)}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(report.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetail(report)}
                        color="primary"
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="페이지당 행 수:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} / ${count !== -1 ? count : `${to}개 이상`}`
          }
        />
      </Paper>

      {/* 신고 상세 다이얼로그 */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReportIcon color="primary" />
            <Typography variant="h6">신고 상세 정보</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedReport && (
            <Box sx={{ mt: 2 }}>
              {/* 신고 기본 정보 */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    신고 정보
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        신고 ID
                      </Typography>
                      <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                        {selectedReport.id}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        상태
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        {getStatusChip(selectedReport.status)}
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        신고일시
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(selectedReport.createdAt)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        최종 수정일시
                      </Typography>
                      <Typography variant="body1">
                        {selectedReport.updatedAt ? formatDate(selectedReport.updatedAt) : '없음'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        신고 사유
                      </Typography>
                      <Typography variant="body1">
                        {selectedReport.reason}
                      </Typography>
                    </Grid>
                    {selectedReport.description && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          상세 설명
                        </Typography>
                        <Typography variant="body1">
                          {selectedReport.description}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>

              {/* 신고자 정보 */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    신고자 정보
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={3}>
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Avatar
                          src={selectedReport.reporter.profileImageUrl}
                          sx={{ width: 80, height: 80 }}
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={9}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            이름
                          </Typography>
                          <Typography variant="body1">
                            {selectedReport.reporter.name}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            이메일
                          </Typography>
                          <Typography variant="body1">
                            {selectedReport.reporter.email}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            전화번호
                          </Typography>
                          <Typography variant="body1">
                            {selectedReport.reporter.phoneNumber}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            나이/성별
                          </Typography>
                          <Typography variant="body1">
                            {selectedReport.reporter.age}세 / {getGenderText(selectedReport.reporter.gender)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* 신고당한 사용자 정보 */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    신고당한 사용자 정보
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={3}>
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Avatar
                          src={selectedReport.reported.profileImageUrl}
                          sx={{ width: 80, height: 80 }}
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={9}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            이름
                          </Typography>
                          <Typography variant="body1">
                            {selectedReport.reported.name}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            이메일
                          </Typography>
                          <Typography variant="body1">
                            {selectedReport.reported.email}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            전화번호
                          </Typography>
                          <Typography variant="body1">
                            {selectedReport.reported.phoneNumber}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            나이/성별
                          </Typography>
                          <Typography variant="body1">
                            {selectedReport.reported.age}세 / {getGenderText(selectedReport.reported.gender)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* 증거 이미지 */}
              {selectedReport.evidenceImages && selectedReport.evidenceImages.length > 0 && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      증거 이미지
                    </Typography>
                    <Grid container spacing={2}>
                      {selectedReport.evidenceImages.map((imageUrl, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                          <Box
                            component="img"
                            src={imageUrl}
                            alt={`증거 이미지 ${index + 1}`}
                            sx={{
                              width: '100%',
                              height: 200,
                              objectFit: 'cover',
                              borderRadius: 1,
                              border: '1px solid #e0e0e0'
                            }}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>
            닫기
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
