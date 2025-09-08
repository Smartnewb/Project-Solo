'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
  Alert,
  CircularProgress,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  Card
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import {
  Chat as ChatIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import UserDetailModal from '@/components/admin/appearance/UserDetailModal';
import chatService, {
  ChatRoom,
  ChatMessage,
  ChatRoomsResponse,
  ChatMessagesResponse
} from '@/app/services/chat';
import AdminService from '@/app/services/admin';
import { UserDetail } from '@/components/admin/appearance/UserDetailModal';

export default function ChatManagementPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedChatRoom, setSelectedChatRoom] = useState<ChatRoom | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // 페이지네이션
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  // 날짜 필터
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());

  // 모달 상태
  const [chatDetailOpen, setChatDetailOpen] = useState(false);
  const [userDetailOpen, setUserDetailOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // 사용자 상세 정보 상태
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);
  const [userDetailError, setUserDetailError] = useState<string | null>(null);

  const [error, setError] = useState<string>('');

  // 채팅방 목록 조회
  const fetchChatRooms = async () => {
    if (!startDate || !endDate) return;

    setLoading(true);
    setError('');

    try {
      const response = await chatService.getChatRooms({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        page: page + 1,
        limit: rowsPerPage
      });

      setChatRooms(response.chatRooms);
      setTotalCount(response.total);
    } catch (error: any) {
      console.error('채팅방 목록 조회 실패:', error);
      setError(error.message || '채팅방 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 채팅 메시지 조회
  const fetchChatMessages = async (chatRoomId: string) => {
    setMessagesLoading(true);
    setError('');

    try {
      const response = await chatService.getChatMessages({
        chatRoomId,
        page: 1,
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

  // 채팅방 클릭 핸들러
  const handleChatRoomClick = async (chatRoom: ChatRoom) => {
    setSelectedChatRoom(chatRoom);
    setChatDetailOpen(true);
    await fetchChatMessages(chatRoom.id);
  };

  // 사용자 프로필 클릭 핸들러
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

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR');
  };

  // 초기 로드
  useEffect(() => {
    if (startDate && endDate) {
      fetchChatRooms();
    }
  }, [page, rowsPerPage]);

  // 페이지 변경 핸들러
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ChatIcon />
        채팅 관리
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 검색 필터 */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="시작 날짜"
              value={startDate}
              onChange={setStartDate}
              slotProps={{
                textField: { size: 'small' }
              }}
            />
            <DatePicker
              label="종료 날짜"
              value={endDate}
              onChange={setEndDate}
              slotProps={{
                textField: { size: 'small' }
              }}
            />
          </LocalizationProvider>
          
          <Button
            variant="contained"
            onClick={fetchChatRooms}
            disabled={loading || !startDate || !endDate}
            startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
          >
            조회
          </Button>
        </Box>
      </Paper>

      {/* 채팅방 목록 테이블 */}
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

      {/* 채팅 상세 모달 */}
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
              {/* 채팅 참여자 정보 */}
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

              {/* 채팅 메시지 목록 */}
              <Box sx={{ height: 400, overflow: 'auto', p: 1 }}>
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
                                bgcolor: isMaleMessage ? 'primary.light' : 'grey.200',
                                color: isMaleMessage ? 'primary.contrastText' : 'text.primary',
                                borderRadius: 2,
                                p: 1
                              }}
                            >
                              <Typography variant="body2">
                                {message.content}
                              </Typography>
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

      {/* 사용자 상세 모달 */}
      {userDetail && (
        <UserDetailModal
          open={userDetailOpen}
          onClose={() => setUserDetailOpen(false)}
          userId={selectedUserId}
          userDetail={userDetail}
          loading={loadingUserDetail}
          error={userDetailError}
          onRefresh={() => {
            // 데이터 새로고침
            if (selectedUserId) {
              handleUserClick(selectedUserId);
            }
          }}
        />
      )}
    </Box>
  );
}
