'use client';

import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Avatar
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Chat as ChatIcon,
  CheckCircle as CheckCircleIcon,
  Analyze as AnalyzeIcon
} from '@mui/icons-material';
import {
  AIChatSession,
  AIChatMessage,
  AIChatSessionStatus
} from '../types';

interface AIChatMessageDetailProps {
  open: boolean;
  onClose: () => void;
  session: AIChatSession | null;
  messages: AIChatMessage[];
  loading: boolean;
}

export default function AIChatMessageDetail({
  open,
  onClose,
  session,
  messages,
  loading
}: AIChatMessageDetailProps) {
  // 날짜 포맷
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 상태 정보
  const getStatusInfo = (status: AIChatSessionStatus) => {
    switch (status) {
      case 'active':
        return { color: 'success' as const, icon: <ChatIcon />, label: '진행 중' };
      case 'completed':
        return { color: 'primary' as const, icon: <CheckCircleIcon />, label: '완료' };
      case 'analyzing':
        return { color: 'warning' as const, icon: <AnalyzeIcon />, label: '분석 중' };
      case 'analyzed':
        return { color: 'info' as const, icon: <CheckCircleIcon />, label: '분석 완료' };
      case 'closed':
        return { color: 'default' as const, icon: <CloseIcon />, label: '종료' };
      default:
        return { color: 'default' as const, icon: <ChatIcon />, label: status };
    }
  };

  // 카테고리 색상
  const getCategoryColor = (category: string) => {
    switch (category) {
      case '일상':
        return 'primary';
      case '인간관계':
        return 'secondary';
      case '진로/학교':
        return 'info';
      case '연애':
        return 'error';
      default:
        return 'default';
    }
  };

  if (!session) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: 600 }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar
              src={session.user.profileImage || undefined}
              sx={{ width: 40, height: 40 }}
            >
              <PersonIcon />
            </Avatar>
            <Box>
              <Typography variant="h6">
                {session.user.name}님의 AI 채팅
              </Typography>
              <Typography variant="caption" color="textSecondary">
                세션 ID: {session.id}
              </Typography>
            </Box>
          </Box>
          <Button onClick={onClose} startIcon={<CloseIcon />}>
            닫기
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            {/* 세션 정보 */}
            <Paper sx={{ p: 3, mb: 3, backgroundColor: 'grey.50' }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                세션 정보
              </Typography>
              <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
                <Chip
                  label={`카테고리: ${session.category}`}
                  color={getCategoryColor(session.category)}
                  size="small"
                />
                <Chip
                  label={`대화 턴 수: ${session.turnCount}`}
                  variant="outlined"
                  size="small"
                />
                <Chip
                  icon={getStatusInfo(session.status).icon}
                  label={`상태: ${getStatusInfo(session.status).label}`}
                  color={getStatusInfo(session.status).color}
                  size="small"
                />
                <Chip
                  label={session.isActive ? '활성 세션' : '비활성 세션'}
                  color={session.isActive ? 'success' : 'default'}
                  size="small"
                />
              </Box>

              <Box mt={2}>
                <Typography variant="caption" color="textSecondary">
                  생성 시간: {formatDate(session.createdAt)}
                </Typography>
                {session.updatedAt !== session.createdAt && (
                  <Typography variant="caption" color="textSecondary" display="block">
                    마지막 수정: {formatDate(session.updatedAt)}
                  </Typography>
                )}
                {session.completedAt && (
                  <Typography variant="caption" color="textSecondary" display="block">
                    완료 시간: {formatDate(session.completedAt)}
                  </Typography>
                )}
                {session.analyzedAt && (
                  <Typography variant="caption" color="textSecondary" display="block">
                    분석 시간: {formatDate(session.analyzedAt)}
                  </Typography>
                )}
              </Box>
            </Paper>

            {/* 메시지 목록 */}
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              대화 내역 ({messages.length}개 메시지)
            </Typography>

            <Box
              sx={{
                maxHeight: 500,
                overflowY: 'auto',
                p: 2,
                backgroundColor: '#f5f5f5',
                borderRadius: 2
              }}
            >
              {messages.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <Typography color="textSecondary">
                    대화 내용이 없습니다.
                  </Typography>
                </Box>
              ) : (
                messages.map((message, index) => {
                  const isUser = message.role === 'user';
                  return (
                    <Box
                      key={message.id}
                      display="flex"
                      justifyContent={isUser ? 'flex-start' : 'flex-end'}
                      mb={2}
                      alignItems="flex-start"
                      gap={1.5}
                    >
                      {isUser && (
                        <Avatar
                          src={session.user.profileImage || undefined}
                          sx={{
                            width: 36,
                            height: 36,
                            bgcolor: '#1976d2',
                            fontSize: '14px'
                          }}
                        >
                          <PersonIcon />
                        </Avatar>
                      )}

                      <Box sx={{ maxWidth: '60%', minWidth: 100 }}>
                        {/* 보낸 사람 이름 */}
                        <Box
                          display="flex"
                          alignItems="center"
                          gap={1}
                          mb={0.5}
                        >
                          <Typography
                            variant="caption"
                            fontWeight="600"
                            color={isUser ? 'text.primary' : '#666'}
                          >
                            {isUser ? session.user.name : '썸메이트 AI'}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="textSecondary"
                            sx={{ fontSize: '11px' }}
                          >
                            {formatDate(message.createdAt)}
                          </Typography>
                        </Box>

                        {/* 메시지 버블 */}
                        <Box
                          sx={{
                            p: 2.5,
                            borderRadius: 2,
                            backgroundColor: isUser
                              ? '#ffffff'
                              : '#e3f2fd',
                            border: isUser
                              ? '1px solid #e0e0e0'
                              : '1px solid #bbdefb',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            position: 'relative'
                          }}
                        >
                          <Typography
                            variant="body1"
                            sx={{
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              lineHeight: 1.6,
                              fontSize: '14px',
                              color: isUser ? '#212121' : '#1565c0'
                            }}
                          >
                            {message.content}
                          </Typography>
                        </Box>
                      </Box>

                      {!isUser && (
                        <Avatar
                          sx={{
                            width: 36,
                            height: 36,
                            bgcolor: '#2196f3',
                            fontSize: '14px'
                          }}
                        >
                          <ChatIcon />
                        </Avatar>
                      )}
                    </Box>
                  );
                })
              )}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={onClose} variant="contained">
          닫기
        </Button>
      </DialogActions>
    </Dialog>
  );
}