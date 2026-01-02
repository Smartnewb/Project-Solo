'use client';

import { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  IconButton,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';
import AdminService from '@/app/services/admin';
import type {
  RefundUserSearchResult,
  EligibleChatRoom,
  RefundReasonCode,
  RefundPreviewResponse,
} from '@/types/admin';

const REFUND_REASONS = [
  {
    code: 'A' as RefundReasonCode,
    text: '첫 메시지를 보냈는데 답장이 없었어요',
  },
  {
    code: 'B' as RefundReasonCode,
    text: '무슨 말을 해야할지 몰라서 메시지를 못 보냈어요',
  },
  {
    code: 'C' as RefundReasonCode,
    text: '메시지를 주고 받았는데 대화가 어색하게 끊겼어요',
  },
  {
    code: 'D' as RefundReasonCode,
    text: '프로필을 다시 보니 생각보다 관심이 안갔어요',
  },
];

export default function ChatRefundTab() {
  const [searchName, setSearchName] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [users, setUsers] = useState<RefundUserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<RefundUserSearchResult | null>(null);

  const [eligibleRooms, setEligibleRooms] = useState<EligibleChatRoom[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);

  const [selectedRoom, setSelectedRoom] = useState<EligibleChatRoom | null>(null);
  const [reasonModalOpen, setReasonModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<RefundReasonCode>('A');

  const [previewData, setPreviewData] = useState<RefundPreviewResponse | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [smsContent, setSmsContent] = useState('');

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSearch = async () => {
    if (!searchName.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }

    setSearchLoading(true);
    setError('');
    setUsers([]);
    setSelectedUser(null);
    setEligibleRooms([]);

    try {
      const response = await AdminService.chatRefund.searchUsers(searchName.trim());
      setUsers(response.users);

      if (response.users.length === 0) {
        setError('검색 결과가 없습니다.');
      }
    } catch (error: any) {
      console.error('사용자 검색 실패:', error);
      setError(error.response?.data?.message || '사용자 검색에 실패했습니다.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleUserSelect = async (user: RefundUserSearchResult) => {
    setSelectedUser(user);
    setRoomsLoading(true);
    setError('');
    setEligibleRooms([]);

    try {
      const response = await AdminService.chatRefund.getEligibleRooms(user.userId);
      setEligibleRooms(response.eligibleRooms);

      if (response.eligibleRooms.length === 0) {
        setError('환불 가능한 채팅방이 없습니다.');
      }
    } catch (error: any) {
      console.error('환불 가능 채팅방 조회 실패:', error);
      setError(error.response?.data?.message || '채팅방 목록을 불러오는데 실패했습니다.');
    } finally {
      setRoomsLoading(false);
    }
  };

  const handleRefundClick = (room: EligibleChatRoom) => {
    setSelectedRoom(room);
    setSelectedReason('A');
    setReasonModalOpen(true);
  };

  const handleReasonSubmit = async () => {
    if (!selectedUser || !selectedRoom) return;

    setReasonModalOpen(false);
    setError('');

    try {
      const preview = await AdminService.chatRefund.previewRefund({
        userId: selectedUser.userId,
        chatRoomId: selectedRoom.chatRoomId,
        refundReasonCode: selectedReason,
      });

      setPreviewData(preview);
      setSmsContent(preview.smsContent);
      setPreviewModalOpen(true);
    } catch (error: any) {
      console.error('환불 미리보기 실패:', error);
      setError(error.response?.data?.message || '환불 미리보기에 실패했습니다.');
    }
  };

  const handleProcessRefund = async () => {
    if (!selectedUser || !selectedRoom || !previewData) return;

    setProcessing(true);
    setError('');
    setSuccessMessage('');

    try {
      const result = await AdminService.chatRefund.processRefund({
        userId: selectedUser.userId,
        chatRoomId: selectedRoom.chatRoomId,
        refundReasonCode: selectedReason,
        smsContent: smsContent,
      });

      setPreviewModalOpen(false);

      if (result.smsError) {
        setSuccessMessage(`환불 처리는 완료되었으나 SMS 발송에 실패했습니다: ${result.smsError}`);
      } else {
        setSuccessMessage('환불이 성공적으로 처리되었습니다.');
      }

      setEligibleRooms(prevRooms =>
        prevRooms.filter(room => room.chatRoomId !== selectedRoom.chatRoomId)
      );

      setSelectedRoom(null);
      setPreviewData(null);
    } catch (error: any) {
      console.error('환불 처리 실패:', error);
      const errorMessage = error.response?.data?.message || '환불 처리에 실패했습니다.';
      setError(errorMessage);

      if (error.response?.status === 409) {
        setEligibleRooms(prevRooms =>
          prevRooms.filter(room => room.chatRoomId !== selectedRoom.chatRoomId)
        );
      }
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR');
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label="사용자 이름"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            size="small"
            fullWidth
            placeholder="검색할 사용자 이름을 입력하세요"
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={searchLoading}
            startIcon={searchLoading ? <CircularProgress size={20} /> : <SearchIcon />}
            sx={{ minWidth: 100 }}
          >
            검색
          </Button>
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" gutterBottom>
            검색 결과
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>이름</TableCell>
                  <TableCell>전화번호</TableCell>
                  <TableCell>작업</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      <Typography color="text.secondary">
                        검색된 사용자가 없습니다.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow
                      key={user.userId}
                      hover
                      selected={selectedUser?.userId === user.userId}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.phoneNumber}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleUserSelect(user)}
                          disabled={roomsLoading && selectedUser?.userId === user.userId}
                        >
                          {roomsLoading && selectedUser?.userId === user.userId ? (
                            <CircularProgress size={20} />
                          ) : (
                            '선택'
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" gutterBottom>
            환불 가능 채팅방
            {selectedUser && ` - ${selectedUser.name}`}
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>상대방</TableCell>
                  <TableCell>대학교</TableCell>
                  <TableCell>메시지 수</TableCell>
                  <TableCell>생성일</TableCell>
                  <TableCell>작업</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!selectedUser ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography color="text.secondary">
                        사용자를 먼저 선택해주세요.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : eligibleRooms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography color="text.secondary">
                        {roomsLoading ? '조회 중...' : '환불 가능한 채팅방이 없습니다.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  eligibleRooms.map((room) => (
                    <TableRow key={room.chatRoomId} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {room.partnerInfo.profileImageUrl && (
                            <Avatar
                              src={room.partnerInfo.profileImageUrl}
                              sx={{ width: 32, height: 32 }}
                            />
                          )}
                          <Typography variant="body2">{room.partnerInfo.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{room.partnerInfo.university}</TableCell>
                      <TableCell>
                        <Chip
                          label={`${room.totalMessageCount}개`}
                          size="small"
                          color={room.totalMessageCount === 0 ? 'default' : 'primary'}
                        />
                      </TableCell>
                      <TableCell>{formatDate(room.createdAt)}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          startIcon={<AccountBalanceIcon />}
                          onClick={() => handleRefundClick(room)}
                        >
                          환불하기
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>

      <Dialog open={reasonModalOpen} onClose={() => setReasonModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">환불 사유 선택</Typography>
          <IconButton onClick={() => setReasonModalOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <FormControl component="fieldset" fullWidth sx={{ mt: 1 }}>
            <FormLabel component="legend">환불 사유를 선택해주세요</FormLabel>
            <RadioGroup
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value as RefundReasonCode)}
            >
              {REFUND_REASONS.map((reason) => (
                <FormControlLabel
                  key={reason.code}
                  value={reason.code}
                  control={<Radio />}
                  label={reason.text}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReasonModalOpen(false)}>취소</Button>
          <Button onClick={handleReasonSubmit} variant="contained" color="primary">
            다음
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={previewModalOpen}
        onClose={() => !processing && setPreviewModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">SMS 미리보기 및 확인</Typography>
          <IconButton onClick={() => !processing && setPreviewModalOpen(false)} disabled={processing}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {previewData && (
            <Box>
              <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" gutterBottom>
                  환불 정보
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2">
                    <strong>사용자:</strong> {previewData.userName}
                  </Typography>
                  <Typography variant="body2">
                    <strong>전화번호:</strong> {previewData.phoneNumber}
                  </Typography>
                  <Typography variant="body2">
                    <strong>환급 구슬:</strong> {previewData.refundGemAmount}개
                  </Typography>
                  <Typography variant="body2">
                    <strong>사유:</strong> {previewData.refundReasonText}
                  </Typography>
                </Box>
              </Paper>

              <TextField
                label="SMS 내용"
                value={smsContent}
                onChange={(e) => setSmsContent(e.target.value)}
                multiline
                rows={4}
                fullWidth
                helperText="필요시 SMS 내용을 수정할 수 있습니다."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewModalOpen(false)} disabled={processing}>
            취소
          </Button>
          <Button
            onClick={handleProcessRefund}
            variant="contained"
            color="primary"
            disabled={processing}
            startIcon={processing ? <CircularProgress size={20} /> : <AccountBalanceIcon />}
          >
            {processing ? '처리 중...' : '환불 처리'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
