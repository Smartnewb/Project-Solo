'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box,
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
  Alert,
  CircularProgress,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  Card,
  Typography,
  ButtonGroup,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import {
  Chat as ChatIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  AccessTime as AccessTimeIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import UserDetailModal from '@/components/admin/appearance/UserDetailModal';
import chatService, {
  ChatRoom,
  ChatMessage,
  DatePreset,
} from '@/app/services/chat';
import AdminService from '@/app/services/admin';
import { UserDetail } from '@/components/admin/appearance/UserDetailModal';

const DATE_PRESETS: { label: string; value: DatePreset }[] = [
  { label: '오늘', value: 'today' },
  { label: '어제', value: 'yesterday' },
  { label: '7일', value: '7days' },
  { label: '14일', value: '14days' },
  { label: '30일', value: '30days' },
  { label: '전체', value: 'all' },
];

export default function ChatManagementTab() {
  const [loading, setLoading] = useState(false);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedChatRoom, setSelectedChatRoom] = useState<ChatRoom | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<DatePreset>('7days');
  const [appliedDateRange, setAppliedDateRange] = useState<{ start: string | null; end: string | null }>({ start: null, end: null });

  const [chatDetailOpen, setChatDetailOpen] = useState(false);
  const [userDetailOpen, setUserDetailOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);
  const [userDetailError, setUserDetailError] = useState<string | null>(null);

  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');

  const [error, setError] = useState<string>('');
  const [csvExporting, setCsvExporting] = useState(false);

  const fetchChatRooms = async (preset?: DatePreset) => {
    setLoading(true);
    setError('');

    try {
      const params: any = {
        page: page + 1,
        limit: rowsPerPage
      };

      if (preset) {
        params.preset = preset;
      } else if (startDate && endDate) {
        params.startDate = startDate.toISOString().split('T')[0];
        params.endDate = endDate.toISOString().split('T')[0];
      } else {
        params.preset = selectedPreset;
      }

      const response = await chatService.getChatRooms(params);

      setChatRooms(response.chatRooms);
      setTotalCount(response.total);
      setAppliedDateRange({
        start: response.appliedStartDate,
        end: response.appliedEndDate
      });
    } catch (error: any) {
      console.error('채팅방 목록 조회 실패:', error);
      setError(error.message || '채팅방 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchChatMessages = async (chatRoomId: string) => {
    setMessagesLoading(true);
    setError('');

    try {
      const response = await chatService.getChatMessages({
        chatRoomId,
        limit: 50
      });

      setChatMessages(response.messages);
    } catch (error: any) {
      console.error('채팅 메시지 조회 실패:', error);
      setError(error.message || '채팅 메시지를 불러오는데 실패했습니다.');
    } finally {
      setMessagesLoading(false);
    }
  };

  const handlePresetClick = (preset: DatePreset) => {
    setSelectedPreset(preset);
    setStartDate(null);
    setEndDate(null);
    setPage(0);
    fetchChatRooms(preset);
  };

  const handleCustomDateSearch = () => {
    if (!startDate || !endDate) return;
    setPage(0);
    fetchChatRooms();
  };

  const handleCsvExport = async () => {
    setCsvExporting(true);
    setError('');

    try {
      const params: any = {};
      if (startDate && endDate) {
        params.startDate = startDate.toISOString().split('T')[0];
        params.endDate = endDate.toISOString().split('T')[0];
      } else {
        params.preset = selectedPreset;
      }

      await chatService.exportChatsToCsv(params);
    } catch (error: any) {
      console.error('CSV 내보내기 실패:', error);
      setError(error.message || 'CSV 내보내기에 실패했습니다.');
    } finally {
      setCsvExporting(false);
    }
  };

  const handleChatRoomClick = async (chatRoom: ChatRoom) => {
    setSelectedChatRoom(chatRoom);
    setChatDetailOpen(true);
    setChatMessages([]);
    await fetchChatMessages(chatRoom.id);
  };

  const handleUserClick = async (userId: string) => {
    try {
      setSelectedUserId(userId);
      setUserDetailOpen(true);
      setLoadingUserDetail(true);
      setUserDetailError(null);
      setUserDetail(null);

      console.log('유저 상세 정보 조회 요청:', userId);
      const data = await AdminService.userAppearance.getUserDetails(userId);
      console.log('유저 상세 정보 응답:', data);

      setUserDetail(data);
    } catch (error: any) {
      console.error('유저 상세 정보 조회 중 오류:', error);
      setUserDetailError(error.message || '유저 상세 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoadingUserDetail(false);
    }
  };

  const handleImagePreview = (imageUrl: string) => {
    setPreviewImageUrl(imageUrl);
    setImagePreviewOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR');
  };

  useEffect(() => {
    fetchChatRooms(selectedPreset);
  }, []);

  useEffect(() => {
    if (page > 0 || rowsPerPage !== 20) {
      fetchChatRooms();
    }
  }, [page, rowsPerPage]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="시작 날짜"
              value={startDate}
              onChange={(date) => {
                setStartDate(date);
                setSelectedPreset('7days');
              }}
              slotProps={{
                textField: { size: 'small' }
              }}
            />
            <DatePicker
              label="종료 날짜"
              value={endDate}
              onChange={(date) => {
                setEndDate(date);
                setSelectedPreset('7days');
              }}
              slotProps={{
                textField: { size: 'small' }
              }}
            />
          </LocalizationProvider>

          <Button
            variant="contained"
            onClick={handleCustomDateSearch}
            disabled={loading || !startDate || !endDate}
            startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
          >
            조회
          </Button>

          <ButtonGroup variant="outlined" size="small">
            {DATE_PRESETS.map((preset) => (
              <Button
                key={preset.value}
                onClick={() => handlePresetClick(preset.value)}
                variant={selectedPreset === preset.value && !startDate && !endDate ? 'contained' : 'outlined'}
                disabled={loading}
              >
                {preset.label}
              </Button>
            ))}
          </ButtonGroup>

          <Button
            variant="outlined"
            onClick={handleCsvExport}
            disabled={csvExporting || loading}
            startIcon={csvExporting ? <CircularProgress size={20} /> : <DownloadIcon />}
            color="secondary"
          >
            CSV 다운로드
          </Button>
        </Box>

        {appliedDateRange.start && appliedDateRange.end && (
          <Typography variant="caption" color="text.secondary">
            조회 기간: {appliedDateRange.start} ~ {appliedDateRange.end}
          </Typography>
        )}
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>채팅방 ID</TableCell>
              <TableCell>남성 사용자</TableCell>
              <TableCell>여성 사용자</TableCell>
              <TableCell>상태</TableCell>
              <TableCell>마지막 메시지</TableCell>
              <TableCell>생성일</TableCell>
              <TableCell>작업</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {chatRooms.map((chatRoom) => (
              <TableRow key={chatRoom.id} hover>
                <TableCell>{chatRoom.id}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar src={chatRoom.male.profileImage} sx={{ width: 32, height: 32 }} />
                    <Typography variant="body2">{chatRoom.male.name}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar src={chatRoom.female.profileImage} sx={{ width: 32, height: 32 }} />
                    <Typography variant="body2">{chatRoom.female.name}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={chatRoom.isActive ? '활성' : '비활성'}
                    color={chatRoom.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {chatRoom.lastMessageAt ? formatDate(chatRoom.lastMessageAt) : '메시지 없음'}
                </TableCell>
                <TableCell>{formatDate(chatRoom.createdAt)}</TableCell>
                <TableCell>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleChatRoomClick(chatRoom)}
                    startIcon={<ChatIcon />}
                  >
                    채팅 보기
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="페이지당 행 수:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
        />
      </TableContainer>

      <Dialog
        open={chatDetailOpen}
        onClose={() => setChatDetailOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ChatIcon />
            <Typography variant="h6">채팅 상세</Typography>
            {selectedChatRoom && (
              <Chip
                label={selectedChatRoom.isActive ? '활성' : '비활성'}
                color={selectedChatRoom.isActive ? 'success' : 'default'}
                size="small"
              />
            )}
          </Box>
          <IconButton onClick={() => setChatDetailOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {selectedChatRoom && (
            <>
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar src={selectedChatRoom.male.profileImage} />
                    <Box>
                      <Typography variant="subtitle2">{selectedChatRoom.male.name}</Typography>
                      <Typography variant="caption" color="text.secondary">남성</Typography>
                    </Box>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleUserClick(selectedChatRoom.male.id)}
                      startIcon={<PersonIcon />}
                    >
                      프로필
                    </Button>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar src={selectedChatRoom.female.profileImage} />
                    <Box>
                      <Typography variant="subtitle2">{selectedChatRoom.female.name}</Typography>
                      <Typography variant="caption" color="text.secondary">여성</Typography>
                    </Box>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleUserClick(selectedChatRoom.female.id)}
                      startIcon={<PersonIcon />}
                    >
                      프로필
                    </Button>
                  </Box>
                </Box>

                <Box sx={{ mt: 2, display: 'flex', gap: 4 }}>
                  <Typography variant="caption" color="text.secondary">
                    <AccessTimeIcon sx={{ fontSize: 14, mr: 0.5 }} />
                    생성일: {formatDate(selectedChatRoom.createdAt)}
                  </Typography>
                  {selectedChatRoom.lastMessageAt && (
                    <Typography variant="caption" color="text.secondary">
                      <AccessTimeIcon sx={{ fontSize: 14, mr: 0.5 }} />
                      마지막 메시지: {formatDate(selectedChatRoom.lastMessageAt)}
                    </Typography>
                  )}
                </Box>
              </Box>

              <Box
                ref={messagesContainerRef}
                sx={{ height: 400, overflow: 'auto', p: 1 }}
              >
                {messagesLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <CircularProgress />
                  </Box>
                ) : chatMessages.length === 0 ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography color="text.secondary">메시지가 없습니다.</Typography>
                  </Box>
                ) : (
                  <List sx={{ p: 0 }}>
                    {chatMessages.map((message) => {
                      const isSystemMessage = message.senderId === 'system';
                      const isMaleMessage = message.senderId === selectedChatRoom.male.id;

                      if (isSystemMessage) {
                        return (
                          <Box key={message.id} sx={{ textAlign: 'center', my: 1 }}>
                            <Chip
                              label={message.content}
                              size="small"
                              variant="outlined"
                              sx={{ bgcolor: 'grey.100' }}
                            />
                          </Box>
                        );
                      }

                      return (
                        <ListItem
                          key={message.id}
                          sx={{
                            flexDirection: isMaleMessage ? 'row' : 'row-reverse',
                            alignItems: 'flex-start',
                            gap: 1,
                            py: 0.5
                          }}
                        >
                          <ListItemAvatar sx={{ minWidth: 'auto' }}>
                            <Avatar
                              src={isMaleMessage ? selectedChatRoom.male.profileImage : selectedChatRoom.female.profileImage}
                              sx={{ width: 32, height: 32, cursor: 'pointer' }}
                              onClick={() => handleUserClick(message.senderId)}
                            />
                          </ListItemAvatar>

                          <Box sx={{
                            maxWidth: '70%',
                            textAlign: isMaleMessage ? 'left' : 'right'
                          }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                display: 'block',
                                mb: 0.5,
                                cursor: 'pointer'
                              }}
                              onClick={() => handleUserClick(message.senderId)}
                            >
                              {message.senderName}
                            </Typography>

                            <Card
                              sx={{
                                bgcolor: isMaleMessage ? '#1976d2' : '#424242',
                                color: '#ffffff !important',
                                borderRadius: 2,
                                p: 1,
                                '& .MuiTypography-root': {
                                  color: '#ffffff !important'
                                }
                              }}
                            >
                              {message.messageType === 'image' && message.mediaUrl ? (
                                <Box>
                                  <Box
                                    component="img"
                                    src={message.mediaUrl}
                                    alt="채팅 이미지"
                                    sx={{
                                      maxWidth: 200,
                                      maxHeight: 200,
                                      width: 'auto',
                                      height: 'auto',
                                      borderRadius: 1,
                                      cursor: 'pointer',
                                      '&:hover': {
                                        opacity: 0.8
                                      }
                                    }}
                                    onClick={() => handleImagePreview(message.mediaUrl!)}
                                  />
                                  {message.content && (
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                      {message.content}
                                    </Typography>
                                  )}
                                </Box>
                              ) : (
                                <Typography variant="body2">
                                  {message.content}
                                </Typography>
                              )}
                            </Card>

                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: 'block', mt: 0.5 }}
                            >
                              {formatDate(message.createdAt)}
                            </Typography>
                          </Box>
                        </ListItem>
                      );
                    })}
                  </List>
                )}
              </Box>
            </>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setChatDetailOpen(false)}>
            닫기
          </Button>
        </DialogActions>
      </Dialog>

      {userDetail && (
        <UserDetailModal
          open={userDetailOpen}
          onClose={() => setUserDetailOpen(false)}
          userId={selectedUserId}
          userDetail={userDetail}
          loading={loadingUserDetail}
          error={userDetailError}
          onRefresh={() => {
            if (selectedUserId) {
              handleUserClick(selectedUserId);
            }
          }}
        />
      )}

      <Dialog
        open={imagePreviewOpen}
        onClose={() => setImagePreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">이미지 미리보기</Typography>
          <IconButton onClick={() => setImagePreviewOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2, textAlign: 'center' }}>
          {previewImageUrl && (
            <Box
              component="img"
              src={previewImageUrl}
              alt="미리보기 이미지"
              sx={{
                maxWidth: '100%',
                maxHeight: '70vh',
                width: 'auto',
                height: 'auto',
                borderRadius: 1
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => globalThis.open(previewImageUrl, '_blank')}>
            새 탭에서 열기
          </Button>
          <Button onClick={() => setImagePreviewOpen(false)}>
            닫기
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
