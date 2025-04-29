'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import communityService from '@/app/services/community';
import {
  Box,
  Typography,
  Tabs,
  Tab,
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
  Checkbox,
  Tooltip
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Delete as DeleteIcon,
  DeleteForever as DeleteForeverIcon,
  DeleteSweep as DeleteSweepIcon,
  Restore as RestoreIcon,
  Report as ReportIcon,
  Comment as CommentIcon,
  Warning as WarningIcon,
  Forum as ForumIcon,
  Article as ArticleIcon,
  ReportProblem as ReportProblemIcon,
  Dashboard as DashboardIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  CalendarMonth as CalendarMonthIcon,
  CalendarToday as CalendarTodayIcon
} from '@mui/icons-material';

// 탭 패널 컴포넌트
function TabPanel(props: {
  children?: React.ReactNode;
  index: number;
  value: number;
}) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`community-tabpanel-${index}`}
      aria-labelledby={`community-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box
          sx={{
            p: 3,
            animation: value === index ? 'fadeIn 0.5s ease-in-out' : 'none',
            '@keyframes fadeIn': {
              '0%': {
                opacity: 0,
                transform: 'translateY(10px)'
              },
              '100%': {
                opacity: 1,
                transform: 'translateY(0)'
              }
            }
          }}
        >
          {children}
        </Box>
      )}
    </div>
  );
}

// 게시글 목록 컴포넌트
function ArticleList() {
  const router = useRouter();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filter, setFilter] = useState<'all' | 'reported' | 'blinded'>('all');
  const [totalCount, setTotalCount] = useState(0);
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  const [openBlindDialog, setOpenBlindDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openDateFilterDialog, setOpenDateFilterDialog] = useState(false);
  const [blindReason, setBlindReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({
    startDate: null,
    endDate: null
  });

  // 게시글 목록 조회
  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await communityService.getArticles(
        filter,
        page + 1,
        rowsPerPage,
        dateRange.startDate,
        dateRange.endDate
      );

      // 날짜 필터링이 백엔드에서 지원되지 않는 경우, 프론트엔드에서 필터링
      let filteredArticles = response.items || [];

      if (dateRange.startDate || dateRange.endDate) {
        filteredArticles = filteredArticles.filter(article => {
          const articleDate = new Date(article.createdAt);

          if (dateRange.startDate && dateRange.endDate) {
            return articleDate >= dateRange.startDate && articleDate <= dateRange.endDate;
          } else if (dateRange.startDate) {
            return articleDate >= dateRange.startDate;
          } else if (dateRange.endDate) {
            return articleDate <= dateRange.endDate;
          }

          return true;
        });
      }

      setArticles(filteredArticles);
      setTotalCount(filteredArticles.length || 0);
    } catch (error) {
      console.error('게시글 목록 조회 중 오류:', error);
      setError('게시글 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 페이지 변경 시
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // 페이지당 행 수 변경 시
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 필터 변경 시
  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(event.target.value as 'all' | 'reported' | 'blinded');
    setPage(0);
  };

  // 게시글 선택 시
  const handleSelectArticle = (id: string) => {
    setSelectedArticles(prev => {
      if (prev.includes(id)) {
        return prev.filter(articleId => articleId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // 전체 선택/해제
  const handleSelectAll = () => {
    if (selectedArticles.length === articles.length) {
      setSelectedArticles([]);
    } else {
      setSelectedArticles(articles.map(article => article.id));
    }
  };

  // 블라인드 처리 다이얼로그 열기
  const handleOpenBlindDialog = () => {
    setOpenBlindDialog(true);
  };

  // 블라인드 처리 다이얼로그 닫기
  const handleCloseBlindDialog = () => {
    setOpenBlindDialog(false);
    setBlindReason('');
  };

  // 삭제 다이얼로그 열기
  const handleOpenDeleteDialog = () => {
    setOpenDeleteDialog(true);
  };

  // 삭제 다이얼로그 닫기
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  // 날짜 필터 다이얼로그 열기
  const handleOpenDateFilterDialog = () => {
    setOpenDateFilterDialog(true);
  };

  // 날짜 필터 다이얼로그 닫기
  const handleCloseDateFilterDialog = () => {
    setOpenDateFilterDialog(false);
  };

  // 날짜 필터 적용
  const handleApplyDateFilter = () => {
    setPage(0);
    fetchArticles();
    handleCloseDateFilterDialog();
  };

  // 날짜 필터 초기화
  const handleResetDateFilter = () => {
    setDateRange({
      startDate: null,
      endDate: null
    });
    setPage(0);
    fetchArticles();
    handleCloseDateFilterDialog();
  };

  // 블라인드 처리
  const handleBlindArticles = async (isBlinded: boolean) => {
    try {
      setActionLoading(true);
      await communityService.bulkBlindArticles(selectedArticles, isBlinded, blindReason);
      setSuccessMessage(`선택한 게시글을 ${isBlinded ? '블라인드' : '블라인드 해제'} 처리했습니다.`);
      setSelectedArticles([]);
      fetchArticles();
      handleCloseBlindDialog();
    } catch (error) {
      console.error('게시글 블라인드 처리 중 오류:', error);
      setError(`게시글 ${isBlinded ? '블라인드' : '블라인드 해제'} 처리 중 오류가 발생했습니다.`);
    } finally {
      setActionLoading(false);
    }
  };

  // 게시글 삭제
  const handleDeleteArticles = async () => {
    try {
      setActionLoading(true);
      await communityService.bulkDeleteArticles(selectedArticles);
      setSuccessMessage('선택한 게시글을 삭제했습니다.');
      setSelectedArticles([]);
      fetchArticles();
      handleCloseDeleteDialog();
    } catch (error) {
      console.error('게시글 삭제 중 오류:', error);
      setError('게시글 삭제 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  // 성공 메시지 초기화
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // 게시글 목록 조회
  useEffect(() => {
    fetchArticles();
  }, [filter, page, rowsPerPage]);

  return (
    <Box>
      {/* 필터 및 액션 버튼 */}
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
          borderRadius: 2,
          p: 2,
          boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.05)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl
            variant="outlined"
            size="small"
            sx={{
              minWidth: 200,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: '#fff',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                '&:hover': {
                  boxShadow: '0 2px 5px rgba(0, 0, 0, 0.15)'
                }
              }
            }}
          >
            <InputLabel id="filter-label">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <FilterListIcon fontSize="small" />
                필터
              </Box>
            </InputLabel>
            <Select
              labelId="filter-label"
              value={filter}
              onChange={handleFilterChange}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <FilterListIcon fontSize="small" />
                  필터
                </Box>
              }
            >
              <MenuItem value="all">전체 게시글</MenuItem>
              <MenuItem value="reported">신고된 게시글</MenuItem>
              <MenuItem value="blinded">블라인드 게시글</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            color="primary"
            onClick={handleOpenDateFilterDialog}
            startIcon={<CalendarMonthIcon />}
            sx={{
              borderRadius: 2,
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              '&:hover': {
                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.15)'
              },
              ...(dateRange.startDate || dateRange.endDate ? {
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                borderColor: 'primary.main',
                color: 'primary.main',
                fontWeight: 'bold'
              } : {})
            }}
          >
            {dateRange.startDate || dateRange.endDate ?
              `${dateRange.startDate ? new Date(dateRange.startDate).toLocaleDateString() : '전체'} ~ ${dateRange.endDate ? new Date(dateRange.endDate).toLocaleDateString() : '전체'}` :
              '날짜 필터'}
          </Button>

          <Button
            variant="outlined"
            color="primary"
            onClick={fetchArticles}
            startIcon={<RefreshIcon />}
            sx={{
              borderRadius: 2,
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              '&:hover': {
                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.15)'
              }
            }}
          >
            새로고침
          </Button>
        </Box>

        {selectedArticles.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleOpenBlindDialog}
              startIcon={<VisibilityOffIcon />}
              disabled={actionLoading}
              sx={{
                borderRadius: 2,
                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
                '&:hover': {
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)'
                }
              }}
            >
              블라인드 처리
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleOpenDeleteDialog}
              startIcon={<DeleteIcon />}
              disabled={actionLoading}
              sx={{
                borderRadius: 2,
                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
                '&:hover': {
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)'
                }
              }}
            >
              삭제
            </Button>
          </Box>
        )}
      </Box>

      {/* 성공/오류 메시지 */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 게시글 목록 테이블 */}
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: 'none',
          border: '1px solid rgba(0, 0, 0, 0.08)'
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.03)' }}>
              <TableCell
                padding="checkbox"
                sx={{
                  borderBottom: '2px solid rgba(0, 0, 0, 0.1)',
                  py: 1.5
                }}
              >
                <Checkbox
                  checked={articles.length > 0 && selectedArticles.length === articles.length}
                  indeterminate={selectedArticles.length > 0 && selectedArticles.length < articles.length}
                  onChange={handleSelectAll}
                  sx={{
                    '&.Mui-checked': {
                      color: 'primary.main',
                    },
                    '&.MuiCheckbox-indeterminate': {
                      color: 'primary.main',
                    }
                  }}
                />
              </TableCell>
              <TableCell sx={{ fontWeight: 600, borderBottom: '2px solid rgba(0, 0, 0, 0.1)', py: 1.5 }}>작성자</TableCell>
              <TableCell sx={{ fontWeight: 600, borderBottom: '2px solid rgba(0, 0, 0, 0.1)', py: 1.5 }}>내용</TableCell>
              <TableCell sx={{ fontWeight: 600, borderBottom: '2px solid rgba(0, 0, 0, 0.1)', py: 1.5 }}>댓글</TableCell>
              <TableCell sx={{ fontWeight: 600, borderBottom: '2px solid rgba(0, 0, 0, 0.1)', py: 1.5 }}>신고</TableCell>
              <TableCell sx={{ fontWeight: 600, borderBottom: '2px solid rgba(0, 0, 0, 0.1)', py: 1.5 }}>상태</TableCell>
              <TableCell sx={{ fontWeight: 600, borderBottom: '2px solid rgba(0, 0, 0, 0.1)', py: 1.5 }}>작성일</TableCell>
              <TableCell sx={{ fontWeight: 600, borderBottom: '2px solid rgba(0, 0, 0, 0.1)', py: 1.5 }}>액션</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={32} sx={{ color: 'primary.main' }} />
                    <Typography variant="body2" color="text.secondary">데이터를 불러오는 중...</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : articles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <ArticleIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                    <Typography variant="body1" color="text.secondary">게시글이 없습니다.</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              articles.map((article, index) => (
                <TableRow
                  key={article.id}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.02)'
                    },
                    backgroundColor: index % 2 === 0 ? 'white' : 'rgba(0, 0, 0, 0.01)',
                    transition: 'background-color 0.2s'
                  }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedArticles.includes(article.id)}
                      onChange={() => handleSelectArticle(article.id)}
                      sx={{
                        '&.Mui-checked': {
                          color: 'primary.main',
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {article.isAnonymous ? (
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>익명</Typography>
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            cursor: 'pointer',
                            '&:hover': {
                              color: 'primary.main',
                              textDecoration: 'underline'
                            }
                          }}
                          onClick={() => router.push(`/admin/users`)}
                        >
                          {article.nickname}
                        </Typography>
                      )}
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                          '&:hover': {
                            color: 'primary.main',
                            textDecoration: 'underline'
                          }
                        }}
                        onClick={() => router.push(`/admin/users`)}
                      >
                        {article.email}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        maxWidth: 300,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        ...(article.isBlinded && { color: 'text.disabled', textDecoration: 'line-through' }),
                        cursor: 'pointer',
                        '&:hover': {
                          color: 'primary.main'
                        },
                        transition: 'color 0.2s'
                      }}
                      onClick={() => router.push(`/admin/community/${article.id}`)}
                    >
                      {article.emoji} {article.content}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        cursor: 'pointer',
                        borderRadius: 1,
                        p: 0.5,
                        transition: 'all 0.2s',
                        '&:hover': {
                          backgroundColor: 'rgba(33, 150, 243, 0.1)',
                          color: 'primary.main'
                        }
                      }}
                      onClick={() => router.push(`/admin/community/${article.id}?tab=comments`)}
                    >
                      <CommentIcon fontSize="small" color="action" />
                      <Typography variant="body2">{article.commentCount}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {article.reportCount > 0 ? (
                      <Chip
                        icon={<ReportIcon />}
                        label={article.reportCount}
                        color="error"
                        size="small"
                        sx={{
                          fontWeight: 500,
                          borderRadius: '12px',
                          '& .MuiChip-icon': {
                            fontSize: '0.8rem'
                          }
                        }}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">0</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {article.isBlinded ? (
                      <Chip
                        label="블라인드"
                        color="warning"
                        size="small"
                        sx={{
                          fontWeight: 500,
                          borderRadius: '12px'
                        }}
                      />
                    ) : article.isDeleted ? (
                      <Chip
                        label="삭제됨"
                        color="error"
                        size="small"
                        sx={{
                          fontWeight: 500,
                          borderRadius: '12px'
                        }}
                      />
                    ) : (
                      <Chip
                        label="정상"
                        color="success"
                        size="small"
                        sx={{
                          fontWeight: 500,
                          borderRadius: '12px'
                        }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {new Date(article.createdAt).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        {new Date(article.createdAt).toLocaleTimeString()}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="상세 보기">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => router.push(`/admin/community/${article.id}`)}
                          sx={{
                            backgroundColor: 'rgba(33, 150, 243, 0.1)',
                            '&:hover': {
                              backgroundColor: 'rgba(33, 150, 243, 0.2)'
                            }
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={article.isBlinded ? "블라인드 해제" : "블라인드"}>
                        <IconButton
                          size="small"
                          color={article.isBlinded ? "success" : "warning"}
                          onClick={() => {
                            setSelectedArticles([article.id]);
                            setBlindReason(article.blindReason || '');
                            setOpenBlindDialog(true);
                          }}
                          sx={{
                            backgroundColor: article.isBlinded
                              ? 'rgba(76, 175, 80, 0.1)'
                              : 'rgba(255, 152, 0, 0.1)',
                            '&:hover': {
                              backgroundColor: article.isBlinded
                                ? 'rgba(76, 175, 80, 0.2)'
                                : 'rgba(255, 152, 0, 0.2)'
                            }
                          }}
                        >
                          {article.isBlinded ? (
                            <VisibilityIcon fontSize="small" />
                          ) : (
                            <VisibilityOffIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="삭제">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setSelectedArticles([article.id]);
                            setOpenDeleteDialog(true);
                          }}
                          sx={{
                            backgroundColor: 'rgba(244, 67, 54, 0.1)',
                            '&:hover': {
                              backgroundColor: 'rgba(244, 67, 54, 0.2)'
                            }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 페이지네이션 */}
      <TablePagination
        component={Paper}
        count={totalCount}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
        labelRowsPerPage="페이지당 행 수:"
        sx={{
          mt: 2,
          borderRadius: 2,
          boxShadow: 'none',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
            margin: 0
          },
          '& .MuiTablePagination-select': {
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
            borderRadius: 1,
            p: 0.5
          },
          '& .MuiTablePagination-actions': {
            '& .MuiIconButton-root': {
              backgroundColor: 'rgba(0, 0, 0, 0.02)',
              borderRadius: 1,
              mx: 0.5,
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.05)'
              }
            }
          }
        }}
      />

      {/* 블라인드 처리 다이얼로그 */}
      <Dialog
        open={openBlindDialog}
        onClose={handleCloseBlindDialog}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            maxWidth: 500
          }
        }}
      >
        <DialogTitle sx={{
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          py: 2,
          backgroundColor: 'rgba(0, 0, 0, 0.02)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VisibilityOffIcon color="warning" />
            <Typography variant="h6">게시글 블라인드 처리</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2, px: 3 }}>
          <Typography variant="body1" sx={{ mb: 3 }}>
            선택한 <strong>{selectedArticles.length}개</strong>의 게시글을 블라인드 처리하시겠습니까?
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="블라인드 사유"
            fullWidth
            variant="outlined"
            value={blindReason}
            onChange={(e) => setBlindReason(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
              }
            }}
            placeholder="블라인드 처리 사유를 입력해주세요"
            helperText="사용자에게 표시될 블라인드 처리 사유입니다"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(0, 0, 0, 0.08)' }}>
          <Button
            onClick={handleCloseBlindDialog}
            disabled={actionLoading}
            sx={{
              borderRadius: 2,
              px: 2
            }}
          >
            취소
          </Button>
          <Button
            onClick={() => handleBlindArticles(true)}
            color="warning"
            variant="contained"
            disabled={actionLoading}
            sx={{
              borderRadius: 2,
              px: 2,
              boxShadow: '0 2px 8px rgba(255, 152, 0, 0.2)'
            }}
          >
            {actionLoading ? <CircularProgress size={24} /> : '블라인드 처리'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 삭제 다이얼로그 */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>게시글 삭제</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            선택한 {selectedArticles.length}개의 게시글을 삭제하시겠습니까?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            <WarningIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
            이 작업은 되돌릴 수 없습니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={actionLoading}>
            취소
          </Button>
          <Button
            onClick={handleDeleteArticles}
            color="error"
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : '삭제'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 날짜 필터 다이얼로그 */}
      <Dialog
        open={openDateFilterDialog}
        onClose={handleCloseDateFilterDialog}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            maxWidth: 500
          }
        }}
      >
        <DialogTitle sx={{
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          py: 2,
          backgroundColor: 'rgba(0, 0, 0, 0.02)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarMonthIcon color="primary" />
            <Typography variant="h6">날짜 필터</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2, px: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              게시글 작성 날짜 범위를 선택하세요
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                label="시작 날짜"
                type="date"
                value={dateRange.startDate ? new Date(dateRange.startDate).toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : null;
                  setDateRange(prev => ({
                    ...prev,
                    startDate: date
                  }));
                }}
                InputLabelProps={{
                  shrink: true,
                }}
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                  }
                }}
              />

              <Typography variant="body1" sx={{ mx: 1 }}>~</Typography>

              <TextField
                label="종료 날짜"
                type="date"
                value={dateRange.endDate ? new Date(dateRange.endDate).toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : null;
                  // 종료일이 있는 경우 23:59:59로 설정
                  if (date) {
                    date.setHours(23, 59, 59, 999);
                  }
                  setDateRange(prev => ({
                    ...prev,
                    endDate: date
                  }));
                }}
                InputLabelProps={{
                  shrink: true,
                }}
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                  }
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const endOfDay = new Date();
                  endOfDay.setHours(23, 59, 59, 999);
                  setDateRange({
                    startDate: today,
                    endDate: endOfDay
                  });
                }}
                sx={{ borderRadius: 2, flex: 1 }}
              >
                오늘
              </Button>

              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  const today = new Date();
                  const yesterday = new Date(today);
                  yesterday.setDate(yesterday.getDate() - 1);
                  yesterday.setHours(0, 0, 0, 0);
                  const endOfYesterday = new Date(today);
                  endOfYesterday.setDate(endOfYesterday.getDate() - 1);
                  endOfYesterday.setHours(23, 59, 59, 999);
                  setDateRange({
                    startDate: yesterday,
                    endDate: endOfYesterday
                  });
                }}
                sx={{ borderRadius: 2, flex: 1 }}
              >
                어제
              </Button>

              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  const today = new Date();
                  const weekAgo = new Date(today);
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  weekAgo.setHours(0, 0, 0, 0);
                  const endOfToday = new Date();
                  endOfToday.setHours(23, 59, 59, 999);
                  setDateRange({
                    startDate: weekAgo,
                    endDate: endOfToday
                  });
                }}
                sx={{ borderRadius: 2, flex: 1 }}
              >
                일주일
              </Button>

              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  const today = new Date();
                  const monthAgo = new Date(today);
                  monthAgo.setMonth(monthAgo.getMonth() - 1);
                  monthAgo.setHours(0, 0, 0, 0);
                  const endOfToday = new Date();
                  endOfToday.setHours(23, 59, 59, 999);
                  setDateRange({
                    startDate: monthAgo,
                    endDate: endOfToday
                  });
                }}
                sx={{ borderRadius: 2, flex: 1 }}
              >
                한달
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(0, 0, 0, 0.08)' }}>
          <Button
            onClick={handleResetDateFilter}
            sx={{
              borderRadius: 2,
              px: 2
            }}
          >
            초기화
          </Button>
          <Button
            onClick={handleCloseDateFilterDialog}
            sx={{
              borderRadius: 2,
              px: 2
            }}
          >
            취소
          </Button>
          <Button
            onClick={handleApplyDateFilter}
            color="primary"
            variant="contained"
            sx={{
              borderRadius: 2,
              px: 2,
              boxShadow: '0 2px 8px rgba(33, 150, 243, 0.2)'
            }}
          >
            적용
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// 휴지통 컴포넌트
function TrashList() {
  const router = useRouter();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  const [openRestoreDialog, setOpenRestoreDialog] = useState(false);
  const [openPermanentDeleteDialog, setOpenPermanentDeleteDialog] = useState(false);
  const [openEmptyTrashDialog, setOpenEmptyTrashDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 휴지통 게시글 목록 조회
  const fetchTrashArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await communityService.getTrashArticles(page + 1, rowsPerPage);
      setArticles(response.items || []);
      setTotalCount(response.total || 0);
    } catch (error) {
      console.error('휴지통 게시글 목록 조회 중 오류:', error);
      setError('휴지통 게시글 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 페이지 변경 시
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // 페이지당 행 수 변경 시
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 게시글 선택 시
  const handleSelectArticle = (id: string) => {
    setSelectedArticles(prev => {
      if (prev.includes(id)) {
        return prev.filter(articleId => articleId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // 전체 선택/해제
  const handleSelectAll = () => {
    if (selectedArticles.length === articles.length) {
      setSelectedArticles([]);
    } else {
      setSelectedArticles(articles.map(article => article.id));
    }
  };

  // 복원 다이얼로그 열기
  const handleOpenRestoreDialog = () => {
    setOpenRestoreDialog(true);
  };

  // 복원 다이얼로그 닫기
  const handleCloseRestoreDialog = () => {
    setOpenRestoreDialog(false);
  };

  // 영구 삭제 다이얼로그 열기
  const handleOpenPermanentDeleteDialog = () => {
    setOpenPermanentDeleteDialog(true);
  };

  // 영구 삭제 다이얼로그 닫기
  const handleClosePermanentDeleteDialog = () => {
    setOpenPermanentDeleteDialog(false);
  };

  // 휴지통 비우기 다이얼로그 열기
  const handleOpenEmptyTrashDialog = () => {
    setOpenEmptyTrashDialog(true);
  };

  // 휴지통 비우기 다이얼로그 닫기
  const handleCloseEmptyTrashDialog = () => {
    setOpenEmptyTrashDialog(false);
  };

  // 게시글 복원
  const handleRestoreArticles = async () => {
    try {
      setActionLoading(true);
      for (const id of selectedArticles) {
        await communityService.restoreArticle(id);
      }
      setSuccessMessage(`선택한 게시글을 복원했습니다.`);
      setSelectedArticles([]);
      fetchTrashArticles();
      handleCloseRestoreDialog();
    } catch (error) {
      console.error('게시글 복원 중 오류:', error);
      setError('게시글 복원 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  // 게시글 영구 삭제
  const handlePermanentDeleteArticles = async () => {
    try {
      setActionLoading(true);
      for (const id of selectedArticles) {
        await communityService.permanentDeleteArticle(id);
      }
      setSuccessMessage('선택한 게시글을 영구 삭제했습니다.');
      setSelectedArticles([]);
      fetchTrashArticles();
      handleClosePermanentDeleteDialog();
    } catch (error) {
      console.error('게시글 영구 삭제 중 오류:', error);
      setError('게시글 영구 삭제 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  // 휴지통 비우기
  const handleEmptyTrash = async () => {
    try {
      setActionLoading(true);
      await communityService.emptyTrash();
      setSuccessMessage('휴지통을 비웠습니다.');
      setSelectedArticles([]);
      fetchTrashArticles();
      handleCloseEmptyTrashDialog();
    } catch (error) {
      console.error('휴지통 비우기 중 오류:', error);
      setError('휴지통 비우기 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  // 성공 메시지 초기화
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // 휴지통 게시글 목록 조회
  useEffect(() => {
    fetchTrashArticles();
  }, [page, rowsPerPage]);

  return (
    <Box>
      {/* 액션 버튼 */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          삭제된 게시글 ({totalCount})
        </Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {selectedArticles.length > 0 ? (
            <>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleOpenRestoreDialog}
                startIcon={<RestoreIcon />}
                disabled={actionLoading}
              >
                복원
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={handleOpenPermanentDeleteDialog}
                startIcon={<DeleteForeverIcon />}
                disabled={actionLoading}
              >
                영구 삭제
              </Button>
            </>
          ) : (
            <Button
              variant="outlined"
              color="error"
              onClick={handleOpenEmptyTrashDialog}
              startIcon={<DeleteSweepIcon />}
              disabled={actionLoading || totalCount === 0}
            >
              휴지통 비우기
            </Button>
          )}
        </Box>
      </Box>

      {/* 성공/오류 메시지 */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 휴지통 게시글 목록 테이블 */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={articles.length > 0 && selectedArticles.length === articles.length}
                  indeterminate={selectedArticles.length > 0 && selectedArticles.length < articles.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell>작성자</TableCell>
              <TableCell>내용</TableCell>
              <TableCell>댓글</TableCell>
              <TableCell>삭제일</TableCell>
              <TableCell>액션</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress size={24} sx={{ my: 2 }} />
                </TableCell>
              </TableRow>
            ) : articles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  휴지통이 비어 있습니다.
                </TableCell>
              </TableRow>
            ) : (
              articles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedArticles.includes(article.id)}
                      onChange={() => handleSelectArticle(article.id)}
                    />
                  </TableCell>
                  <TableCell>
                    {article.isAnonymous ? (
                      <Typography variant="body2">익명</Typography>
                    ) : (
                      <Typography variant="body2">{article.nickname}</Typography>
                    )}
                    <Typography variant="caption" color="textSecondary">
                      {article.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        maxWidth: 300,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: 'text.disabled',
                        textDecoration: 'line-through'
                      }}
                    >
                      {article.emoji} {article.content}
                    </Typography>
                  </TableCell>
                  <TableCell>{article.commentCount}</TableCell>
                  <TableCell>
                    {article.deletedAt ? new Date(article.deletedAt).toLocaleDateString() : new Date(article.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="복원">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => {
                          setSelectedArticles([article.id]);
                          setOpenRestoreDialog(true);
                        }}
                      >
                        <RestoreIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="영구 삭제">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          setSelectedArticles([article.id]);
                          setOpenPermanentDeleteDialog(true);
                        }}
                      >
                        <DeleteForeverIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 페이지네이션 */}
      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
        labelRowsPerPage="페이지당 행 수:"
      />

      {/* 복원 다이얼로그 */}
      <Dialog open={openRestoreDialog} onClose={handleCloseRestoreDialog}>
        <DialogTitle>게시글 복원</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            선택한 {selectedArticles.length}개의 게시글을 복원하시겠습니까?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRestoreDialog} disabled={actionLoading}>
            취소
          </Button>
          <Button
            onClick={handleRestoreArticles}
            color="primary"
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : '복원'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 영구 삭제 다이얼로그 */}
      <Dialog open={openPermanentDeleteDialog} onClose={handleClosePermanentDeleteDialog}>
        <DialogTitle>게시글 영구 삭제</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            선택한 {selectedArticles.length}개의 게시글을 영구적으로 삭제하시겠습니까?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            <WarningIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
            이 작업은 되돌릴 수 없으며, 관련된 모든 댓글과 좋아요도 함께 삭제됩니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePermanentDeleteDialog} disabled={actionLoading}>
            취소
          </Button>
          <Button
            onClick={handlePermanentDeleteArticles}
            color="error"
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : '영구 삭제'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 휴지통 비우기 다이얼로그 */}
      <Dialog open={openEmptyTrashDialog} onClose={handleCloseEmptyTrashDialog}>
        <DialogTitle>휴지통 비우기</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            휴지통의 모든 게시글을 영구적으로 삭제하시겠습니까?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            <WarningIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
            이 작업은 되돌릴 수 없으며, 관련된 모든 댓글과 좋아요도 함께 삭제됩니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEmptyTrashDialog} disabled={actionLoading}>
            취소
          </Button>
          <Button
            onClick={handleEmptyTrash}
            color="error"
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : '휴지통 비우기'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// 신고 목록 컴포넌트
function ReportList() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [typeFilter, setTypeFilter] = useState<'all' | 'article' | 'comment'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'processed'>('pending');
  const [totalCount, setTotalCount] = useState(0);
  const [openProcessDialog, setOpenProcessDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [processMemo, setProcessMemo] = useState('');
  const [processResult, setProcessResult] = useState<'accepted' | 'rejected'>('accepted');
  const [blindTarget, setBlindTarget] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 신고 목록 조회
  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await communityService.getReports(
        typeFilter,
        statusFilter,
        page + 1,
        rowsPerPage
      );
      setReports(response.items || []);
      setTotalCount(response.total || 0);
    } catch (error) {
      console.error('신고 목록 조회 중 오류:', error);
      setError('신고 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 페이지 변경 시
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // 페이지당 행 수 변경 시
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 타입 필터 변경 시
  const handleTypeFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTypeFilter(event.target.value as 'all' | 'article' | 'comment');
    setPage(0);
  };

  // 상태 필터 변경 시
  const handleStatusFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStatusFilter(event.target.value as 'all' | 'pending' | 'processed');
    setPage(0);
  };

  // 신고 처리 다이얼로그 열기
  const handleOpenProcessDialog = (report: any) => {
    setSelectedReport(report);
    setProcessMemo('');
    setProcessResult('accepted');
    setBlindTarget(true);
    setOpenProcessDialog(true);
  };

  // 신고 처리 다이얼로그 닫기
  const handleCloseProcessDialog = () => {
    setOpenProcessDialog(false);
    setSelectedReport(null);
  };

  // 신고 처리
  const handleProcessReport = async () => {
    if (!selectedReport) return;

    try {
      setActionLoading(true);
      await communityService.processReport(
        selectedReport.id,
        processResult,
        processMemo,
        processResult === 'accepted' && blindTarget
      );
      setSuccessMessage('신고를 처리했습니다.');
      fetchReports();
      handleCloseProcessDialog();
    } catch (error) {
      console.error('신고 처리 중 오류:', error);
      setError('신고 처리 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  // 성공 메시지 초기화
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // 신고 목록 조회
  useEffect(() => {
    fetchReports();
  }, [typeFilter, statusFilter, page, rowsPerPage]);

  return (
    <Box>
      {/* 필터 */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
        <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="type-filter-label">신고 대상</InputLabel>
          <Select
            labelId="type-filter-label"
            value={typeFilter}
            onChange={handleTypeFilterChange}
            label="신고 대상"
          >
            <MenuItem value="all">전체</MenuItem>
            <MenuItem value="article">게시글</MenuItem>
            <MenuItem value="comment">댓글</MenuItem>
          </Select>
        </FormControl>

        <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="status-filter-label">처리 상태</InputLabel>
          <Select
            labelId="status-filter-label"
            value={statusFilter}
            onChange={handleStatusFilterChange}
            label="처리 상태"
          >
            <MenuItem value="all">전체</MenuItem>
            <MenuItem value="pending">대기 중</MenuItem>
            <MenuItem value="processed">처리 완료</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* 성공/오류 메시지 */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 신고 목록 테이블 */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>신고 대상</TableCell>
              <TableCell>신고 내용</TableCell>
              <TableCell>신고자</TableCell>
              <TableCell>신고 사유</TableCell>
              <TableCell>신고일</TableCell>
              <TableCell>상태</TableCell>
              <TableCell>액션</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress size={24} sx={{ my: 2 }} />
                </TableCell>
              </TableRow>
            ) : reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  신고가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <Chip
                      label={report.targetType === 'article' ? '게시글' : '댓글'}
                      color={report.targetType === 'article' ? 'primary' : 'secondary'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        maxWidth: 300,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {report.targetContent}
                    </Typography>
                  </TableCell>
                  <TableCell>{report.reporterNickname}</TableCell>
                  <TableCell>{report.reason}</TableCell>
                  <TableCell>
                    {new Date(report.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {report.status === 'pending' ? (
                      <Chip label="대기 중" color="warning" size="small" />
                    ) : report.result === 'accepted' ? (
                      <Chip label="수락됨" color="success" size="small" />
                    ) : (
                      <Chip label="거절됨" color="error" size="small" />
                    )}
                  </TableCell>
                  <TableCell>
                    {report.status === 'pending' && (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleOpenProcessDialog(report)}
                      >
                        처리
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 페이지네이션 */}
      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
        labelRowsPerPage="페이지당 행 수:"
      />

      {/* 신고 처리 다이얼로그 */}
      <Dialog open={openProcessDialog} onClose={handleCloseProcessDialog}>
        <DialogTitle>신고 처리</DialogTitle>
        <DialogContent>
          {selectedReport && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                신고 대상: {selectedReport.targetType === 'article' ? '게시글' : '댓글'}
              </Typography>
              <Typography variant="body2" gutterBottom>
                내용: {selectedReport.targetContent}
              </Typography>
              <Typography variant="body2" gutterBottom>
                신고 사유: {selectedReport.reason}
              </Typography>
              {selectedReport.description && (
                <Typography variant="body2" gutterBottom>
                  상세 설명: {selectedReport.description}
                </Typography>
              )}

              <Box sx={{ mt: 2 }}>
                <FormControl component="fieldset">
                  <Typography variant="subtitle2" gutterBottom>
                    처리 결과
                  </Typography>
                  <Select
                    value={processResult}
                    onChange={(e) => setProcessResult(e.target.value as 'accepted' | 'rejected')}
                    fullWidth
                    size="small"
                    sx={{ mb: 2 }}
                  >
                    <MenuItem value="accepted">수락 (신고 인정)</MenuItem>
                    <MenuItem value="rejected">거절 (신고 기각)</MenuItem>
                  </Select>
                </FormControl>

                {processResult === 'accepted' && (
                  <FormControl component="fieldset" sx={{ mt: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      블라인드 처리
                    </Typography>
                    <Select
                      value={blindTarget ? 'yes' : 'no'}
                      onChange={(e) => setBlindTarget(e.target.value === 'yes')}
                      fullWidth
                      size="small"
                      sx={{ mb: 2 }}
                    >
                      <MenuItem value="yes">블라인드 처리</MenuItem>
                      <MenuItem value="no">블라인드 처리 안 함</MenuItem>
                    </Select>
                  </FormControl>
                )}

                <TextField
                  margin="dense"
                  label="처리 메모"
                  fullWidth
                  variant="outlined"
                  value={processMemo}
                  onChange={(e) => setProcessMemo(e.target.value)}
                  multiline
                  rows={3}
                />
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseProcessDialog} disabled={actionLoading}>
            취소
          </Button>
          <Button
            onClick={handleProcessReport}
            color="primary"
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : '처리 완료'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default function AdminCommunity() {
  const router = useRouter();
  const { user, loading, isAdmin } = useAuth();
  const [tabValue, setTabValue] = useState(0);

  // 탭 변경 핸들러
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // 관리자 권한 확인
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    } else if (!loading && user && !isAdmin) {
      router.push('/');
    }
  }, [user, loading, isAdmin, router]);

  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress color="primary" />
        <Typography variant="body1" color="text.secondary">
          로딩 중...
        </Typography>
      </Box>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <Box sx={{
      p: 4,
      maxWidth: '100%',
      background: 'linear-gradient(to right bottom, #ffffff, #f8f9fa)',
      borderRadius: 2,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
      minHeight: 'calc(100vh - 100px)'
    }}>
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        mb: 4,
        pb: 2,
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
      }}>
        <ForumIcon sx={{ fontSize: 36, mr: 2, color: 'primary.main' }} />
        <Typography
          variant="h4"
          sx={{
            fontWeight: 600,
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          커뮤니티 관리
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          mb: 4,
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)'
        }}
      >
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="community management tabs"
          variant="fullWidth"
          sx={{
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0'
            },
            '& .MuiTab-root': {
              py: 2,
              fontWeight: 500,
              transition: 'all 0.2s',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.02)'
              }
            }
          }}
        >
          <Tab
            label="게시글 관리"
            icon={<ArticleIcon />}
            iconPosition="start"
            sx={{ borderRight: 1, borderColor: 'divider' }}
          />
          <Tab
            label="신고 관리"
            icon={<ReportProblemIcon />}
            iconPosition="start"
            sx={{ borderRight: 1, borderColor: 'divider' }}
          />
          <Tab
            label="휴지통"
            icon={<DeleteIcon />}
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      <Box sx={{
        backgroundColor: '#fff',
        borderRadius: 2,
        p: 0,
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)'
      }}>
        <TabPanel value={tabValue} index={0}>
          <ArticleList />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <ReportList />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <TrashList />
        </TabPanel>
      </Box>
    </Box>
  );
}
