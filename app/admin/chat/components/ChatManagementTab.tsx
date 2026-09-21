'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Paper,
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
  TextField,
  InputAdornment,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
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
  Search as SearchIcon,
  SmartToy as SmartToyIcon,
  PeopleAlt as PeopleAltIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import UserDetailModal from '@/components/admin/appearance/UserDetailModal';
import chatService, {
  ChatRoom,
  ChatMessage,
  ChatUser,
  DatePreset,
} from '@/app/services/chat';
import AdminService from '@/app/services/admin';
import { ghostChat } from '@/app/services/admin/ghost-chat';
import { UserDetail } from '@/components/admin/appearance/UserDetailModal';
import { safeToLocaleString } from '@/app/utils/formatters';

const DATE_PRESETS: { label: string; value: DatePreset }[] = [
  { label: '오늘', value: 'today' },
  { label: '어제', value: 'yesterday' },
  { label: '7일', value: '7days' },
  { label: '14일', value: '14days' },
  { label: '30일', value: '30days' },
  { label: '전체', value: 'all' },
];

type SessionFilter = 'user' | 'ghost';

const SESSION_FILTER_LABELS: Record<SessionFilter, string> = {
  user: '일반 채팅',
  ghost: '고스트 채팅',
};

const DEFAULT_ROWS_PER_PAGE = 48;

type DecoratedChatRoom = Omit<ChatRoom, 'sessionType' | 'ghostChatSessionId'> & {
  sessionType: SessionFilter;
  ghostChatSessionId: string | null;
};

export default function ChatManagementTab() {
  const [loading, setLoading] = useState(false);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [ghostChatRoomIds, setGhostChatRoomIds] = useState<Set<string>>(new Set());
  const [ghostSessionIdsByRoomId, setGhostSessionIdsByRoomId] = useState<Map<string, string>>(new Map());
  const [sessionFilter, setSessionFilter] = useState<SessionFilter>('user');
  const [selectedChatRoom, setSelectedChatRoom] = useState<ChatRoom | DecoratedChatRoom | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [previewMessagesByRoomId, setPreviewMessagesByRoomId] = useState<Record<string, ChatMessage[]>>({});
  const [previewLoadingRoomIds, setPreviewLoadingRoomIds] = useState<Set<string>>(new Set());
  const [messagesLoading, setMessagesLoading] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
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

  const [searchName, setSearchName] = useState('');
  const [error, setError] = useState<string>('');
  const [csvExporting, setCsvExporting] = useState(false);

  const isAiSession = (chatRoom: ChatRoom) => {
    if (chatRoom.sessionType === 'ai' || chatRoom.ghostChatSessionId) return true;
    if (ghostChatRoomIds.has(chatRoom.id)) return true;
    return Boolean(
      chatRoom.male.isGhost ||
      chatRoom.male.isFaker ||
      chatRoom.female.isGhost ||
      chatRoom.female.isFaker,
    );
  };

  const decoratedChatRooms = useMemo(
    () =>
      chatRooms.map((chatRoom) => ({
        ...chatRoom,
        ghostChatSessionId: chatRoom.ghostChatSessionId ?? ghostSessionIdsByRoomId.get(chatRoom.id) ?? null,
        sessionType: isAiSession(chatRoom) ? 'ghost' as const : 'user' as const,
      })),
    [chatRooms, ghostChatRoomIds, ghostSessionIdsByRoomId],
  );

  const visibleChatRooms = useMemo(
    () =>
      decoratedChatRooms.filter((chatRoom) => {
        if (sessionFilter === 'user') return chatRoom.sessionType === 'user';
        return chatRoom.sessionType === 'ghost';
      }),
    [decoratedChatRooms, sessionFilter],
  );

  const sessionStats = useMemo(() => {
    const ghost = decoratedChatRooms.filter((chatRoom) => chatRoom.sessionType === 'ghost').length;
    const active = decoratedChatRooms.filter((chatRoom) => chatRoom.isActive).length;
    const recent = decoratedChatRooms.filter((chatRoom) => {
      if (!chatRoom.lastMessageAt) return false;
      const lastMessageAt = new Date(chatRoom.lastMessageAt).getTime();
      return Number.isFinite(lastMessageAt) && Date.now() - lastMessageAt < 1000 * 60 * 60 * 24;
    }).length;
    return {
      total: decoratedChatRooms.length,
      ghost,
      user: decoratedChatRooms.length - ghost,
      active,
      recent,
    };
  }, [decoratedChatRooms]);

  const formatDate = (dateString: string) => {
    return safeToLocaleString(dateString);
  };

  const getSenderRole = (chatRoom: DecoratedChatRoom, senderId: string) => {
    if (senderId === chatRoom.male.id) return 'male';
    if (senderId === chatRoom.female.id) return 'female';
    return 'system';
  };

  const senderRoleLabel = (role: ReturnType<typeof getSenderRole>) => {
    if (role === 'male') return '남성';
    if (role === 'female') return '여성';
    return '시스템';
  };

  const getTextValue = (value: string | { name?: string | null } | null | undefined) => {
    if (!value) return null;
    if (typeof value === 'string') return value.trim() || null;
    return value.name?.trim() || null;
  };

  const getRepresentativePhoto = (user: ChatUser) => {
    const imageGroups = [user.profileImages, user.images].filter(Array.isArray) as NonNullable<ChatUser['profileImages']>[];
    const mainImage = imageGroups
      .flat()
      .find((image) => image?.isMain && (image.url || image.imageUrl));
    const firstImage = imageGroups.flat().find((image) => image?.url || image?.imageUrl);

    return (
      user.primaryPhotoUrl ||
      user.mainPhotoUrl ||
      user.profileImageUrl ||
      user.profile_image_url ||
      mainImage?.url ||
      mainImage?.imageUrl ||
      firstImage?.url ||
      firstImage?.imageUrl ||
      user.imageUrl ||
      user.profileImage ||
      undefined
    );
  };

  const getProfileSummaryItems = (user: ChatUser) => {
    const items = [
      user.age ? `${user.age}세` : null,
      getTextValue(user.university) ?? user.universityName,
      getTextValue(user.department) ?? user.departmentName,
      user.mbti,
    ];
    return items.filter((item): item is string => Boolean(item));
  };

  const fetchPreviewMessagesForRooms = async (rooms: DecoratedChatRoom[]) => {
    const missingRooms = rooms.filter((room) => !previewMessagesByRoomId[room.id] && !previewLoadingRoomIds.has(room.id));
    if (missingRooms.length === 0) return;

    const roomIds = missingRooms.map((room) => room.id);
    setPreviewLoadingRoomIds((prev) => new Set([...Array.from(prev), ...roomIds]));

    const results = await Promise.allSettled(
      missingRooms.map(async (room) => {
        const response = await chatService.getChatMessages({
          chatRoomId: room.id,
          limit: 6,
        });
        return [room.id, response?.messages ?? []] as const;
      }),
    );

    setPreviewMessagesByRoomId((prev) => {
      const next = { ...prev };
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          next[result.value[0]] = result.value[1];
        } else {
          next[missingRooms[index].id] = [];
        }
      });
      return next;
    });
    setPreviewLoadingRoomIds((prev) => {
      const next = new Set(prev);
      roomIds.forEach((id) => next.delete(id));
      return next;
    });
  };

  const fetchChatRooms = async ({
    preset,
    pageOverride,
  }: {
    preset?: DatePreset;
    pageOverride?: number;
  } = {}) => {
    setLoading(true);
    setError('');

    try {
      const params: any = {
        page: (pageOverride ?? page) + 1,
        limit: rowsPerPage
      };

      if (searchName.trim()) {
        params.searchName = searchName.trim();
      }

      if (preset) {
        params.preset = preset;
      } else if (startDate && endDate) {
        params.startDate = startDate.toISOString().split('T')[0];
        params.endDate = endDate.toISOString().split('T')[0];
      } else {
        params.preset = selectedPreset;
      }

      const response = await chatService.getChatRooms(params);

      setChatRooms(response?.chatRooms ?? []);
      setPreviewMessagesByRoomId({});
      setTotalCount(response?.total ?? 0);
      setAppliedDateRange({
        start: response?.appliedStartDate ?? '',
        end: response?.appliedEndDate ?? ''
      });
    } catch (error: any) {
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

      setChatMessages(response?.messages ?? []);
    } catch (error: any) {
      setError(error.message || '채팅 메시지를 불러오는데 실패했습니다.');
    } finally {
      setMessagesLoading(false);
    }
  };

  const fetchGhostSessionIndex = async () => {
    try {
      const sessions = await ghostChat.listSessions();
      const nextRoomIds = new Set<string>();
      const nextSessionIds = new Map<string, string>();
      sessions.forEach((session) => {
        nextRoomIds.add(session.chatRoomId);
        nextSessionIds.set(session.chatRoomId, session.id);
      });
      setGhostChatRoomIds(nextRoomIds);
      setGhostSessionIdsByRoomId(nextSessionIds);
    } catch (error) {
      console.warn('고스트 채팅 세션 인덱스 조회 실패:', error);
    }
  };

  const handlePresetClick = (preset: DatePreset) => {
    setSelectedPreset(preset);
    setStartDate(null);
    setEndDate(null);
    setPage(0);
    fetchChatRooms({ preset, pageOverride: 0 });
  };

  const handleCustomDateSearch = () => {
    if (!startDate || !endDate) return;
    setPage(0);
    fetchChatRooms({ pageOverride: 0 });
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
      setError(error.message || 'CSV 내보내기에 실패했습니다.');
    } finally {
      setCsvExporting(false);
    }
  };

  const handleChatRoomClick = async (chatRoom: ChatRoom | DecoratedChatRoom) => {
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

      ;
      const data = await AdminService.userAppearance.getUserDetails(userId);
      ;

      setUserDetail(data);
    } catch (error: any) {
      setUserDetailError(error.message || '유저 상세 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoadingUserDetail(false);
    }
  };

  const handleImagePreview = (imageUrl: string) => {
    setPreviewImageUrl(imageUrl);
    setImagePreviewOpen(true);
  };

  useEffect(() => {
    fetchChatRooms({ preset: selectedPreset });
    fetchGhostSessionIndex();
  }, []);

  useEffect(() => {
    if (page > 0 || rowsPerPage !== DEFAULT_ROWS_PER_PAGE) {
      fetchChatRooms();
    }
  }, [page, rowsPerPage]);

  useEffect(() => {
    void fetchPreviewMessagesForRooms(visibleChatRooms);
  }, [visibleChatRooms]);

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
          <TextField
            size="small"
            placeholder="사용자 이름 검색"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setPage(0);
                fetchChatRooms({ pageOverride: 0 });
              }
            }}
            sx={{ minWidth: 180 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />

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

      <Paper sx={{ overflow: 'hidden' }}>
        <Box
          sx={{
            p: 2,
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'grey.50',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 1.5 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
                채팅방 카드 리스트
              </Typography>
              <Typography variant="caption" color="text.secondary">
                일반 채팅과 고스트 채팅을 분리하고, 최근 메시지를 버블 카드로 확인합니다.
              </Typography>
            </Box>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={sessionFilter}
              onChange={(_, nextValue: SessionFilter | null) => {
                if (nextValue) setSessionFilter(nextValue);
              }}
              aria-label="채팅 세션 유형 필터"
              sx={{
                '& .MuiToggleButton-root': {
                  px: 1.5,
                  py: 0.75,
                  fontWeight: 800,
                  textTransform: 'none',
                },
              }}
            >
              <ToggleButton value="user" aria-label="유저 세션">
                일반 채팅 {sessionStats.user}
              </ToggleButton>
              <ToggleButton value="ghost" aria-label="고스트 세션">
                고스트 채팅 {sessionStats.ghost}
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
              gap: 1,
            }}
          >
            <Box sx={{ p: 1.25, border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper' }}>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <ChatIcon fontSize="small" color="primary" />
                <Typography variant="caption" color="text.secondary">전체 채팅방</Typography>
              </Stack>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>{sessionStats.total}</Typography>
            </Box>
            <Box sx={{ p: 1.25, border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper' }}>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <SmartToyIcon fontSize="small" color="secondary" />
                <Typography variant="caption" color="text.secondary">고스트 채팅</Typography>
              </Stack>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>{sessionStats.ghost}</Typography>
            </Box>
            <Box sx={{ p: 1.25, border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper' }}>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <PeopleAltIcon fontSize="small" color="success" />
                <Typography variant="caption" color="text.secondary">24h 활동 / 활성</Typography>
              </Stack>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>{sessionStats.recent} / {sessionStats.active}</Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ p: 1.5 }}>
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 220 }}>
              <CircularProgress />
            </Box>
          ) : visibleChatRooms.length === 0 ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 220, color: 'text.secondary' }}>
              <Typography variant="body2">표시할 {SESSION_FILTER_LABELS[sessionFilter]} 채팅방이 없습니다.</Typography>
            </Box>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, minmax(0, 1fr))',
                  lg: 'repeat(3, minmax(0, 1fr))',
                  xl: 'repeat(6, minmax(0, 1fr))',
                },
                gap: 1.25,
              }}
            >
              {visibleChatRooms.map((chatRoom) => {
                const isGhost = chatRoom.sessionType === 'ghost';
                const previewMessages = previewMessagesByRoomId[chatRoom.id] ?? [];
                const previewLoading = previewLoadingRoomIds.has(chatRoom.id);
                return (
                  <Paper
                    key={chatRoom.id}
                    variant="outlined"
                    sx={{
                      p: 1.25,
                      borderRadius: 1,
                      minHeight: 440,
                      display: 'flex',
                      flexDirection: 'column',
                      borderTop: '4px solid',
                      borderTopColor: isGhost ? 'secondary.main' : 'primary.main',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                        mb: 1.25,
                        minWidth: 0,
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.75, flexWrap: 'wrap', rowGap: 0.5 }}>
                          <Chip
                            icon={isGhost ? <SmartToyIcon /> : <PeopleAltIcon />}
                            label={isGhost ? '고스트 채팅' : '일반 채팅'}
                            color={isGhost ? 'secondary' : 'primary'}
                            size="small"
                            variant={isGhost ? 'filled' : 'outlined'}
                            sx={{ fontWeight: 800 }}
                          />
                          <Chip
                            label={chatRoom.isActive ? '활성' : '비활성'}
                            color={chatRoom.isActive ? 'success' : 'default'}
                            size="small"
                          />
                        </Stack>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900 }} noWrap>
                          {chatRoom.male.name} · {chatRoom.female.name}
                        </Typography>
                        {chatRoom.ghostChatSessionId && (
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                            고스트 응대 세션
                          </Typography>
                        )}
                      </Box>

                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: '1fr',
                          gap: 0.75,
                          minWidth: 0,
                        }}
                      >
                        {[
                          { label: '남성 사용자', user: chatRoom.male },
                          { label: '여성 사용자', user: chatRoom.female },
                        ].map(({ label, user }) => {
                          const profileItems = getProfileSummaryItems(user);
                          return (
                            <Box
                              key={label}
                              sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 0.85,
                                minWidth: 0,
                                px: 0.75,
                                py: 0.65,
                                borderRadius: 1,
                                bgcolor: 'background.paper',
                                border: 1,
                                borderColor: 'divider',
                              }}
                            >
                              <Avatar
                                src={getRepresentativePhoto(user)}
                                sx={{ width: 44, height: 44, flexShrink: 0, fontWeight: 800 }}
                              >
                                {user.name?.charAt(0)}
                              </Avatar>
                              <Box sx={{ minWidth: 0, flex: 1 }}>
                                <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                                  {label}
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1.2 }} noWrap>
                                  {user.name}
                                </Typography>
                                {profileItems.length > 0 ? (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden',
                                      lineHeight: 1.3,
                                      mt: 0.25,
                                      wordBreak: 'keep-all',
                                    }}
                                  >
                                    {profileItems.slice(0, 4).join(' · ')}
                                  </Typography>
                                ) : (
                                  <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.25 }}>
                                    프로필 정보 없음
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          );
                        })}
                      </Box>

                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: 0.75,
                          p: 0.75,
                          borderRadius: 1,
                          bgcolor: 'grey.50',
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                            마지막 메시지
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                            {chatRoom.lastMessageAt ? formatDate(chatRoom.lastMessageAt) : '메시지 없음'}
                          </Typography>
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                            생성일
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                            {formatDate(chatRoom.createdAt)}
                          </Typography>
                        </Box>
                      </Box>

                      <Button
                        size="small"
                        variant={isGhost && chatRoom.ghostChatSessionId ? 'contained' : 'outlined'}
                        onClick={() => {
                          if (!isGhost || !chatRoom.ghostChatSessionId) {
                            handleChatRoomClick(chatRoom);
                          }
                        }}
                        component={isGhost && chatRoom.ghostChatSessionId ? Link : 'button'}
                        href={
                          isGhost && chatRoom.ghostChatSessionId
                            ? `/admin/ghost-chat?session=${encodeURIComponent(chatRoom.ghostChatSessionId)}`
                            : undefined
                        }
                        startIcon={<ChatIcon />}
                        fullWidth
                        sx={{ whiteSpace: 'nowrap' }}
                      >
                        {isGhost && chatRoom.ghostChatSessionId ? '고스트 뷰 열기' : '채팅 보기'}
                      </Button>
                    </Box>

                    <Box
                      sx={{
                        flex: 1,
                        minHeight: 190,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.6,
                        p: 0.75,
                        borderRadius: 1,
                        bgcolor: 'grey.50',
                        border: 1,
                        borderColor: 'divider',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                        최근 채팅 6개
                      </Typography>
                      {previewLoading ? (
                        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CircularProgress size={22} />
                        </Box>
                      ) : previewMessages.length > 0 ? (
                        previewMessages.slice(-6).map((message) => {
                          const senderRole = getSenderRole(chatRoom, message.senderId);
                          const isRight = senderRole === 'female';
                          const isSystem = senderRole === 'system';

                          if (isSystem) {
                            return (
                              <Box key={message.id} sx={{ display: 'flex', justifyContent: 'center' }}>
                                <Chip
                                  label={message.content || '시스템 메시지'}
                                  size="small"
                                  variant="outlined"
                                  sx={{ maxWidth: '86%', bgcolor: 'background.paper' }}
                                />
                              </Box>
                            );
                          }

                          return (
                            <Box
                              key={message.id}
                              sx={{
                                display: 'flex',
                                justifyContent: isRight ? 'flex-end' : 'flex-start',
                                px: 0.25,
                              }}
                            >
                              <Box
                                sx={{
                                  maxWidth: '92%',
                                  px: 1,
                                  py: 0.75,
                                  borderRadius: isRight ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
                                  border: 1,
                                  borderColor: isRight ? 'primary.light' : 'divider',
                                  bgcolor: isRight ? 'rgba(25, 118, 210, 0.08)' : 'background.paper',
                                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06)',
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  color={isRight ? 'primary.main' : 'text.secondary'}
                                  sx={{ display: 'block', fontWeight: 800, lineHeight: 1.1, mb: 0.25 }}
                                >
                                  {senderRoleLabel(senderRole)} · {message.senderName}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.primary"
                                  sx={{
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    lineHeight: 1.35,
                                    wordBreak: 'break-word',
                                  }}
                                >
                                  {message.content || (message.messageType === 'image' ? '이미지 메시지' : '메시지 본문 없음')}
                                </Typography>
                              </Box>
                            </Box>
                          );
                        })
                      ) : (
                        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', px: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                            최근 메시지가 없습니다.
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          )}
        </Box>

        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[24, DEFAULT_ROWS_PER_PAGE]}
          labelRowsPerPage="페이지당 행 수:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
        />
      </Paper>

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
                    <Avatar src={getRepresentativePhoto(selectedChatRoom.male)} />
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
                    <Avatar src={getRepresentativePhoto(selectedChatRoom.female)} />
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
                              src={getRepresentativePhoto(isMaleMessage ? selectedChatRoom.male : selectedChatRoom.female)}
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
