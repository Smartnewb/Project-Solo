'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Avatar, Button, Chip, Input, Label, Link, Modal, Pagination, Select, ListBox, Spinner, TextField } from '@heroui/react';
import { MessageSquare, X, Download, UserRound } from 'lucide-react';
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
import { sanitizeUrl } from '@/shared/lib/safe-url';
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

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
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
    limitOverride,
  }: {
    preset?: DatePreset;
    pageOverride?: number;
    limitOverride?: number;
  } = {}) => {
    setLoading(true);
    setError('');

    try {
      const params: any = {
        page: (pageOverride ?? page) + 1,
        limit: limitOverride ?? rowsPerPage
      };

      if (searchName.trim()) {
        params.searchName = searchName.trim();
      }

      if (preset) {
        params.preset = preset;
      } else if (startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
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
    setStartDate('');
    setEndDate('');
    setPage(0);
    fetchChatRooms({ preset, pageOverride: 0 });
  };

  const handleCsvExport = async () => {
    setCsvExporting(true);
    setError('');

    try {
      const params: any = {};
      if (startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
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
    const safeUrl = sanitizeUrl(imageUrl);
    if (!safeUrl) { setError('이미지 주소를 열 수 없습니다.'); return; }
    setPreviewImageUrl(safeUrl);
    setImagePreviewOpen(true);
  };

  useEffect(() => {
    fetchChatRooms({ preset: selectedPreset });
    fetchGhostSessionIndex();
  }, []);

  useEffect(() => {
    void fetchPreviewMessagesForRooms(visibleChatRooms);
  }, [visibleChatRooms]);

  const reversedRange = !!startDate && !!endDate && startDate > endDate;
  const pageCount = Math.max(1, Math.ceil(totalCount / rowsPerPage));
  const pageItems = Array.from({ length: Math.min(5, pageCount) }, (_, i) => Math.min(Math.max(page + 1 - 2, 1), Math.max(1, pageCount - 4)) + i);
  const handleChangePage = (nextPage: number) => {
    setPage(nextPage); void fetchChatRooms({ pageOverride: nextPage });
  };

  return <div className="space-y-4">
    {error && <p role="alert" className="rounded-lg border border-red-200 p-3">{error}</p>}
    <section aria-label="채팅방 조회" className="space-y-3 rounded-xl border bg-white p-4">
      <div className="flex flex-wrap items-end gap-3">
        <TextField isDisabled={loading}><Label>사용자 이름 검색</Label><Input value={searchName} onChange={e => setSearchName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !loading && !reversedRange) { setPage(0); void fetchChatRooms({pageOverride:0}); } }} /></TextField>
        <TextField isDisabled={loading}><Label>시작 날짜</Label><Input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setSelectedPreset('7days'); }} /></TextField>
        <TextField isDisabled={loading} isInvalid={reversedRange}><Label>종료 날짜</Label><Input type="date" value={endDate} min={startDate || undefined} onChange={e => { setEndDate(e.target.value); setSelectedPreset('7days'); }} /></TextField>
        <Button isDisabled={loading || reversedRange} onPress={() => {setPage(0); void fetchChatRooms({pageOverride:0});}}>조회</Button>
        <div role="group" aria-label="기간 바로 선택" className="flex flex-wrap gap-1">{DATE_PRESETS.map(preset => <Button key={preset.value} size="sm" isDisabled={loading} variant={selectedPreset === preset.value && !startDate && !endDate ? 'primary' : 'secondary'} aria-pressed={selectedPreset === preset.value && !startDate && !endDate} onPress={() => handlePresetClick(preset.value)}>{preset.label}</Button>)}</div>
        <Button variant="secondary" isDisabled={csvExporting || loading || reversedRange} onPress={() => void handleCsvExport()}>{csvExporting ? <Spinner size="sm" /> : <Download size={16} />}CSV 다운로드</Button>
      </div>
      {reversedRange && <p role="alert" className="text-sm text-red-700">종료 날짜는 시작 날짜 이후여야 합니다.</p>}
      {appliedDateRange.start && appliedDateRange.end && <p className="text-sm text-gray-600">조회 기간: {appliedDateRange.start} ~ {appliedDateRange.end}</p>}
    </section>
    <section className="space-y-4 rounded-xl border bg-white p-4">
      <header className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">채팅방 카드 리스트</h2><p className="text-sm text-gray-600">일반 채팅과 고스트 채팅의 최근 메시지를 확인합니다.</p></div><div role="group" aria-label="채팅 세션 유형 필터" className="flex gap-2">{(['user','ghost'] as const).map(filter => <Button key={filter} size="sm" variant={sessionFilter === filter ? 'primary' : 'secondary'} aria-pressed={sessionFilter === filter} onPress={() => setSessionFilter(filter)}>{SESSION_FILTER_LABELS[filter]} {sessionStats[filter]}</Button>)}</div></header>
      <dl className="grid gap-3 sm:grid-cols-3">{[['현재 페이지 채팅방',sessionStats.total],['현재 페이지 고스트 채팅',sessionStats.ghost],['24h 활동 / 활성',`${sessionStats.recent} / ${sessionStats.active}`]].map(([title,value]) => <div key={title} className="rounded-lg border p-3"><dt className="text-sm text-gray-600">{title}</dt><dd className="text-xl font-bold">{value}</dd></div>)}</dl>
      {loading ? <div role="status" aria-label="채팅방 조회 중" className="flex justify-center py-12"><Spinner /></div> : !visibleChatRooms.length ? <p className="py-12 text-center text-gray-600">표시할 {SESSION_FILTER_LABELS[sessionFilter]} 채팅방이 없습니다.</p> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {visibleChatRooms.map(room => <article key={room.id} className="flex min-w-0 flex-col gap-3 rounded-lg border border-t-4 border-t-[var(--accent)] p-3">
          <header className="space-y-2"><div className="flex flex-wrap gap-2"><Chip size="sm" variant="soft">{SESSION_FILTER_LABELS[room.sessionType]}</Chip><Chip size="sm" variant="soft" color={room.isActive ? 'success' : 'default'}>{room.isActive ? '활성' : '비활성'}</Chip></div><h3 className="font-semibold">{room.male.name} · {room.female.name}</h3>{room.ghostChatSessionId && <p className="text-xs text-gray-600">고스트 응대 세션</p>}</header>
          {[{label:'남성 사용자',user:room.male},{label:'여성 사용자',user:room.female}].map(({label,user}) => <div key={label} className="flex items-start gap-2 rounded-lg border p-2"><Avatar><Avatar.Image src={getRepresentativePhoto(user)} alt="" /><Avatar.Fallback>{user.name?.charAt(0)}</Avatar.Fallback></Avatar><div className="min-w-0"><p className="text-xs text-gray-600">{label}</p><p className="font-semibold">{user.name}</p><p className="line-clamp-2 text-xs text-gray-600">{getProfileSummaryItems(user).slice(0,4).join(' · ') || '프로필 정보 없음'}</p></div></div>)}
          <dl className="grid grid-cols-2 gap-2 rounded-lg bg-gray-50 p-2 text-xs"><div><dt className="text-gray-600">마지막 메시지</dt><dd>{room.lastMessageAt ? formatDate(room.lastMessageAt) : '메시지 없음'}</dd></div><div><dt className="text-gray-600">생성일</dt><dd>{formatDate(room.createdAt)}</dd></div></dl>
          {room.sessionType === 'ghost' && room.ghostChatSessionId ? <Link className="button button--secondary button--sm w-full" href={`/admin/ghost-chat?session=${encodeURIComponent(room.ghostChatSessionId)}`}>고스트 뷰 열기</Link> : <Button size="sm" variant="secondary" aria-label={`${room.male.name} · ${room.female.name} 채팅 보기`} onPress={() => void handleChatRoomClick(room)}><MessageSquare size={16} />채팅 보기</Button>}
          <section className="flex min-h-48 flex-1 flex-col gap-2 rounded-lg border bg-gray-50 p-2" aria-label={`${room.male.name} · ${room.female.name} 최근 채팅`}><h4 className="text-xs font-semibold text-gray-600">최근 채팅 6개</h4>
            {previewLoadingRoomIds.has(room.id) ? <Spinner size="sm" /> : !(previewMessagesByRoomId[room.id]?.length) ? <p className="m-auto text-xs text-gray-600">최근 메시지가 없습니다.</p> : previewMessagesByRoomId[room.id].slice(-6).map(message => {
              const role = getSenderRole(room,message.senderId);
              return <div key={message.id} className={`max-w-[92%] rounded-lg border bg-white p-2 text-xs ${role === 'female' ? 'self-end' : role === 'system' ? 'self-center' : 'self-start'}`}>
                {role !== 'system' && <p className="mb-1 font-semibold text-gray-600">{senderRoleLabel(role)} · {message.senderName}</p>}<p className="line-clamp-2 break-words">{message.content || (message.messageType === 'image' ? '이미지 메시지' : '메시지 본문 없음')}</p>
              </div>;
            })}
          </section>
        </article>)}
      </div>}
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
        <Select className="w-44" selectedKey={String(rowsPerPage)} isDisabled={loading} onSelectionChange={key => {if (key == null) return; const limit=Number(key); setRowsPerPage(limit); setPage(0); void fetchChatRooms({pageOverride:0,limitOverride:limit});}}><Label>페이지당 행 수</Label><Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger><Select.Popover><ListBox>{[24,48].map(limit => <ListBox.Item key={limit} id={String(limit)} textValue={`${limit}개`}>{limit}개<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover></Select>
        <p className="text-sm text-gray-600">{totalCount ? page * rowsPerPage + 1 : 0}–{Math.min((page + 1) * rowsPerPage,totalCount)} / {totalCount}</p>
        <Pagination><Pagination.Content><Pagination.Item><Pagination.Previous isDisabled={loading || page === 0} onPress={() => handleChangePage(page - 1)} aria-label="이전 페이지">이전</Pagination.Previous></Pagination.Item>{pageItems.map(number => <Pagination.Item key={number}><Pagination.Link isActive={number === page + 1} isDisabled={loading} aria-label={`${number}페이지`} onPress={() => handleChangePage(number - 1)}>{number}</Pagination.Link></Pagination.Item>)}<Pagination.Item><Pagination.Next isDisabled={loading || page + 1 >= pageCount} onPress={() => handleChangePage(page + 1)} aria-label="다음 페이지">다음</Pagination.Next></Pagination.Item></Pagination.Content></Pagination>
      </footer>
    </section>
    <Modal.Backdrop isOpen={chatDetailOpen} onOpenChange={setChatDetailOpen}><Modal.Container size="lg"><Modal.Dialog style={{width:"100%",maxWidth:900,minWidth:0}}><Modal.Header className="flex items-center justify-between flex-row flex-wrap gap-3"><Modal.Heading>채팅 상세</Modal.Heading><Button isIconOnly variant="tertiary" aria-label="채팅 상세 닫기" onPress={() => setChatDetailOpen(false)}><X size={18} /></Button></Modal.Header>
      <Modal.Body className="space-y-3">{selectedChatRoom && <>
        <div className="flex flex-wrap justify-between gap-3 rounded-lg bg-gray-50 p-3">{[selectedChatRoom.male,selectedChatRoom.female].map(user => <div key={user.id} className="flex items-center gap-2"><Avatar><Avatar.Image src={getRepresentativePhoto(user)} alt="" /><Avatar.Fallback>{user.name?.charAt(0)}</Avatar.Fallback></Avatar><p className="text-sm font-semibold">{user.name}</p><Button variant="secondary" size="sm" aria-label={`${user.name} 프로필`} onPress={() => void handleUserClick(user.id)}><UserRound size={16} />프로필</Button></div>)}<Chip size="sm" variant="soft">{selectedChatRoom.isActive ? '활성' : '비활성'}</Chip></div>
        <p className="text-xs text-gray-600">생성일: {formatDate(selectedChatRoom.createdAt)}{selectedChatRoom.lastMessageAt && ` · 마지막 메시지: ${formatDate(selectedChatRoom.lastMessageAt)}`}</p>
        <div ref={messagesContainerRef} className="h-96 overflow-auto p-1">{messagesLoading ? <div role="status" aria-label="메시지 불러오는 중" className="flex h-full items-center justify-center"><Spinner /></div> : !chatMessages.length ? <p className="py-12 text-center text-gray-600">메시지가 없습니다.</p> : <ul className="space-y-3">{chatMessages.map(message => {
          if (message.senderId === 'system') return <li key={message.id} className="text-center"><Chip size="sm" variant="soft">{message.content}</Chip></li>;
          const male=message.senderId === selectedChatRoom.male.id;
          const sender=male ? selectedChatRoom.male : selectedChatRoom.female;
          return <li key={message.id} className={`flex items-start gap-2 ${male ? '' : 'flex-row-reverse'}`}>
            <Button isIconOnly variant="tertiary" aria-label={`${message.senderName} 프로필 사진`} onPress={() => void handleUserClick(message.senderId)}><Avatar size="sm"><Avatar.Image src={getRepresentativePhoto(sender)} alt="" /><Avatar.Fallback>{sender.name?.charAt(0)}</Avatar.Fallback></Avatar></Button>
            <div className={`max-w-[75%] space-y-1 ${male ? 'text-left' : 'text-right'}`}><Button size="sm" variant="tertiary" onPress={() => void handleUserClick(message.senderId)}>{message.senderName}</Button><div className="space-y-2 rounded-lg border bg-gray-50 p-3 text-sm">
              {message.messageType === 'image' && message.mediaUrl ? <><Button variant="tertiary" className="h-auto p-0" aria-label={`${message.senderName} 채팅 이미지 확대`} onPress={() => handleImagePreview(message.mediaUrl!)}><img src={message.mediaUrl} alt="채팅 이미지" className="max-h-48 max-w-48 rounded-lg" /></Button>{message.content && <p className="whitespace-pre-wrap break-words">{message.content}</p>}</> : <p className="whitespace-pre-wrap break-words">{message.content}</p>}
            </div><p className="text-xs text-gray-600">{formatDate(message.createdAt)}</p></div>
          </li>;
        })}</ul>}</div>
      </>}</Modal.Body><Modal.Footer><Button variant="secondary" onPress={() => setChatDetailOpen(false)}>닫기</Button></Modal.Footer>
    </Modal.Dialog></Modal.Container></Modal.Backdrop>
    {userDetailOpen && userDetail && <UserDetailModal open={userDetailOpen} onClose={() => setUserDetailOpen(false)} userId={selectedUserId} userDetail={userDetail} loading={loadingUserDetail} error={userDetailError} onRefresh={() => {if(selectedUserId) void handleUserClick(selectedUserId);}} />}
    <Modal.Backdrop isOpen={userDetailOpen && !userDetail} onOpenChange={setUserDetailOpen}><Modal.Container size="md"><Modal.Dialog><Modal.Header><Modal.Heading>사용자 프로필</Modal.Heading></Modal.Header><Modal.Body>{loadingUserDetail ? <p role="status" className="flex items-center gap-2"><Spinner size="sm" />프로필 조회 중</p> : <p role="alert">{userDetailError || '프로필 정보가 없습니다.'}</p>}</Modal.Body><Modal.Footer>{userDetailError && <Button variant="secondary" onPress={() => void handleUserClick(selectedUserId)}>재시도</Button>}<Button variant="secondary" onPress={() => setUserDetailOpen(false)}>닫기</Button></Modal.Footer></Modal.Dialog></Modal.Container></Modal.Backdrop>
    <Modal.Backdrop isOpen={imagePreviewOpen} onOpenChange={setImagePreviewOpen}><Modal.Container size="lg"><Modal.Dialog style={{width:"100%",maxWidth:900,minWidth:0}}><Modal.Header className="flex items-center justify-between flex-row flex-wrap gap-3"><Modal.Heading>이미지 미리보기</Modal.Heading><Button isIconOnly variant="tertiary" aria-label="이미지 미리보기 닫기" onPress={() => setImagePreviewOpen(false)}><X size={18} /></Button></Modal.Header><Modal.Body>{previewImageUrl && <img src={previewImageUrl} alt="미리보기 이미지" className="mx-auto max-h-[70vh] max-w-full rounded-lg" />}</Modal.Body><Modal.Footer><Link className="button button--secondary" href={previewImageUrl} target="_blank" rel="noopener noreferrer">새 탭에서 열기</Link><Button variant="secondary" onPress={() => setImagePreviewOpen(false)}>닫기</Button></Modal.Footer></Modal.Dialog></Modal.Container></Modal.Backdrop>
  </div>;
}
