'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
	Alert,
	Avatar,
	Box,
	Button,
	Chip,
	CircularProgress,
	IconButton,
	InputAdornment,
	Paper,
	Stack,
	TextField,
	Tooltip,
	Typography,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import {
	ArrowBack as ArrowBackIcon,
	Clear as ClearIcon,
	Refresh as RefreshIcon,
	Search as SearchIcon,
} from '@mui/icons-material';
import { somemateChat } from '@/app/services/admin/somemate-chat';
import type { SomemateMessageItem, SomemateRelationshipItem } from '@/app/types/somemate-chat';

const PAGE_SIZE = 20;

function formatDateTime(value: string | null | undefined) {
	if (!value) return '기록 없음';
	return new Intl.DateTimeFormat('ko-KR', {
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
	}).format(new Date(value));
}

function relationshipSubtitle(item: SomemateRelationshipItem) {
	return [
		item.user.age ? `${item.user.age}세` : null,
		item.user.gender,
		item.user.rank ? `${item.user.rank}등급` : null,
	].filter(Boolean).join(' · ') || '유저 프로필 정보 없음';
}

function stageLabel(stage: string) {
	const labels: Record<string, string> = {
		stranger: '낯선 사이',
		acquaintance: '알아가는 중',
		crush: '호감',
		dating: '연애',
		committed: '깊은 관계',
	};
	return labels[stage] ?? stage;
}

function RoleLabel({ role }: { role: string }) {
	if (role === 'assistant') return <Chip size="small" label="썸메이트" color="primary" />;
	if (role === 'user') return <Chip size="small" label="유저" variant="outlined" />;
	return <Chip size="small" label={role} />;
}

function RelationshipCard({
	item,
	selected,
	onSelect,
}: {
	item: SomemateRelationshipItem;
	selected: boolean;
	onSelect: () => void;
}) {
	return (
		<Paper
			component="button"
			onClick={onSelect}
			elevation={0}
			sx={{
				width: '100%',
				p: 1.5,
				textAlign: 'left',
				border: 1,
				borderColor: selected ? 'primary.main' : 'divider',
				borderRadius: 1,
				bgcolor: selected ? 'action.selected' : 'background.paper',
				cursor: 'pointer',
				transition: 'border-color 120ms ease, background-color 120ms ease',
				'&:hover': { borderColor: 'primary.main', bgcolor: selected ? 'action.selected' : 'action.hover' },
			}}
		>
			<Box sx={{ display: 'grid', gridTemplateColumns: '56px 1fr', gap: 1.25, minWidth: 0 }}>
				<Avatar
					src={item.companion.representativeImageUrl ?? undefined}
					alt={item.companion.name}
					variant="rounded"
					sx={{ width: 56, height: 56, borderRadius: 1 }}
				>
					{item.companion.name.slice(0, 1)}
				</Avatar>
				<Box sx={{ minWidth: 0 }}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
						<Typography variant="subtitle2" sx={{ fontWeight: 900 }} noWrap>
							{item.companion.name}
						</Typography>
						<Chip size="small" label={`${item.companion.age}세`} sx={{ height: 20 }} />
						<Chip size="small" label={stageLabel(item.stage)} color="info" sx={{ height: 20 }} />
					</Box>
					<Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', mt: 0.25 }}>
						{item.user.name} · {relationshipSubtitle(item)}
					</Typography>
					<Typography
						variant="body2"
						color={item.latestMessage ? 'text.primary' : 'text.secondary'}
						sx={{
							display: '-webkit-box',
							WebkitLineClamp: 2,
							WebkitBoxOrient: 'vertical',
							overflow: 'hidden',
							lineHeight: 1.35,
							mt: 1,
							minHeight: 38,
						}}
					>
						{item.latestMessage || '아직 대화 메시지가 없습니다.'}
					</Typography>
				</Box>
			</Box>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.25, gap: 1 }}>
				<Typography variant="caption" color="text.secondary">
					메시지 {item.totalMessages.toLocaleString()}개
				</Typography>
				<Typography variant="caption" color="text.secondary">
					{formatDateTime(item.lastInteractionAt ?? item.unlockedAt)}
				</Typography>
			</Box>
		</Paper>
	);
}

function MessageBubble({ message }: { message: SomemateMessageItem }) {
	const isAssistant = message.role === 'assistant';
	return (
		<Box sx={{ display: 'flex', justifyContent: isAssistant ? 'flex-start' : 'flex-end' }}>
			<Box
				sx={{
					maxWidth: '74%',
					px: 1.5,
					py: 1.1,
					borderRadius: isAssistant ? '12px 12px 12px 3px' : '12px 12px 3px 12px',
					bgcolor: isAssistant ? 'background.paper' : 'primary.main',
					color: isAssistant ? 'text.primary' : 'primary.contrastText',
					border: 1,
					borderColor: isAssistant ? 'divider' : 'primary.main',
					boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)',
					overflowWrap: 'anywhere',
				}}
			>
				<Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
					{message.content}
				</Typography>
				<Typography
					variant="caption"
					sx={{
						display: 'block',
						mt: 0.75,
						opacity: 0.72,
						textAlign: isAssistant ? 'left' : 'right',
					}}
				>
					{formatDateTime(message.createdAt)}
				</Typography>
			</Box>
		</Box>
	);
}

function ChatPanel({
	selected,
	messages,
	loading,
	onBack,
}: {
	selected: SomemateRelationshipItem | null;
	messages: SomemateMessageItem[];
	loading: boolean;
	onBack?: () => void;
}) {
	const messagesEndRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!loading && messages.length > 0) {
			messagesEndRef.current?.scrollIntoView({ block: 'end' });
		}
	}, [loading, messages.length, selected?.id]);

	if (!selected) {
		return (
			<Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
				<Typography color="text.secondary">썸메이트 프로필을 선택하세요</Typography>
			</Box>
		);
	}

	return (
		<Box sx={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
			<Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
					{onBack && (
						<IconButton size="small" onClick={onBack} aria-label="목록으로 돌아가기">
							<ArrowBackIcon fontSize="small" />
						</IconButton>
					)}
					<Avatar
						src={selected.companion.representativeImageUrl ?? undefined}
						alt={selected.companion.name}
						variant="rounded"
						sx={{ width: 44, height: 44, borderRadius: 1 }}
					/>
					<Box sx={{ minWidth: 0, flex: 1 }}>
						<Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.2 }} noWrap>
							{selected.companion.name}
						</Typography>
						<Typography variant="body2" color="text.secondary" noWrap>
							{selected.user.name} · {selected.user.phoneNumber ?? '전화번호 없음'}
						</Typography>
					</Box>
					<RoleLabel role={selected.slotStatus} />
				</Box>
				<Stack direction="row" spacing={0.75} sx={{ mt: 1.25, flexWrap: 'wrap', rowGap: 0.75 }}>
					<Chip size="small" label={stageLabel(selected.stage)} color="info" />
					<Chip size="small" label={`구슬 ${selected.totalGemsSpent.toLocaleString()}개`} />
					{selected.companion.personaTags.slice(0, 4).map((tag) => (
						<Chip key={tag} size="small" label={tag} variant="outlined" />
					))}
				</Stack>
			</Box>
			<Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', bgcolor: 'grey.50', p: { xs: 1.5, md: 2 } }}>
				{loading ? (
					<Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
						<CircularProgress size={26} />
					</Box>
				) : messages.length === 0 ? (
					<Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
						<Typography color="text.secondary">표시할 대화가 없습니다.</Typography>
					</Box>
				) : (
					<Box sx={{ width: '100%', maxWidth: 960, mx: 'auto' }}>
						<Stack spacing={1.25}>
							{messages.map((message) => (
								<Box key={message.id}>
									<Box sx={{ mb: 0.5, display: 'flex', justifyContent: message.role === 'assistant' ? 'flex-start' : 'flex-end' }}>
										<RoleLabel role={message.role} />
									</Box>
									<MessageBubble message={message} />
								</Box>
							))}
							<Box ref={messagesEndRef} />
						</Stack>
					</Box>
				)}
			</Box>
		</Box>
	);
}

export default function SomemateChatPage() {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('md'));
	const searchParams = useSearchParams();
	const linkedRelationshipId = searchParams.get('relationshipId')?.trim() || null;
	const [searchText, setSearchText] = useState('');
	const [appliedSearch, setAppliedSearch] = useState('');
	const [selectedId, setSelectedId] = useState<string | null>(linkedRelationshipId);
	const [mobileMode, setMobileMode] = useState<'list' | 'chat'>('list');
	const sentinelRef = useRef<HTMLDivElement | null>(null);
	const deepLinkRelationshipId = appliedSearch ? null : linkedRelationshipId;

	const relationshipsQuery = useInfiniteQuery({
		queryKey: ['admin', 'somemate-chat', 'relationships', appliedSearch, deepLinkRelationshipId],
		initialPageParam: 1,
		queryFn: ({ pageParam }) =>
			somemateChat.listRelationships({
				q: appliedSearch || undefined,
				relationshipId: deepLinkRelationshipId || undefined,
				page: Number(pageParam),
				limit: PAGE_SIZE,
			}),
		getNextPageParam: (lastPage) => (lastPage.meta.hasMore ? lastPage.meta.page + 1 : undefined),
		placeholderData: keepPreviousData,
	});

	const relationships = useMemo(
		() => relationshipsQuery.data?.pages.flatMap((page) => page.items) ?? [],
		[relationshipsQuery.data],
	);
	const total = relationshipsQuery.data?.pages[0]?.meta.total ?? 0;
	const selected = relationships.find((item) => item.id === selectedId) ?? null;

	const messagesQuery = useQuery({
		queryKey: ['admin', 'somemate-chat', 'messages', selectedId],
		queryFn: () => somemateChat.getMessages(selectedId!, { limit: 150 }),
		enabled: Boolean(selectedId),
	});

	useEffect(() => {
		if (linkedRelationshipId) {
			setSelectedId(linkedRelationshipId);
			if (isMobile) setMobileMode('chat');
		}
	}, [isMobile, linkedRelationshipId]);

	useEffect(() => {
		if (!selectedId && relationships.length > 0 && !isMobile) {
			setSelectedId(relationships[0].id);
		}
	}, [isMobile, relationships, selectedId]);

	useEffect(() => {
		const node = sentinelRef.current;
		if (!node || !relationshipsQuery.hasNextPage || relationshipsQuery.isFetchingNextPage) return;
		const observer = new IntersectionObserver((entries) => {
			if (entries[0]?.isIntersecting) {
				void relationshipsQuery.fetchNextPage();
			}
		});
		observer.observe(node);
		return () => observer.disconnect();
	}, [relationshipsQuery]);

	const applySearch = () => {
		setSelectedId(null);
		setAppliedSearch(searchText.trim());
		setMobileMode('list');
	};

	const clearSearch = () => {
		setSearchText('');
		setAppliedSearch('');
		setSelectedId(null);
		setMobileMode('list');
	};

	const selectRelationship = (id: string) => {
		setSelectedId(id);
		if (isMobile) setMobileMode('chat');
	};

	const listPane = (
		<Box sx={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
			<Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
				<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
					<Box>
						<Typography variant="h5" sx={{ fontWeight: 900 }}>
							썸메이트 대화
						</Typography>
						<Typography variant="body2" color="text.secondary">
							총 {total.toLocaleString()}개 관계
						</Typography>
					</Box>
					<Tooltip title="새로고침">
						<IconButton onClick={() => relationshipsQuery.refetch()} aria-label="새로고침">
							<RefreshIcon />
						</IconButton>
					</Tooltip>
				</Box>
				<Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
					<TextField
						fullWidth
						size="small"
						value={searchText}
						onChange={(event) => setSearchText(event.target.value)}
						onKeyDown={(event) => {
							if (event.key === 'Enter') applySearch();
						}}
						placeholder="유저명, 전화번호, 썸메이트 이름"
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<SearchIcon fontSize="small" />
								</InputAdornment>
							),
						}}
					/>
					<Button variant="contained" onClick={applySearch} sx={{ minWidth: 76 }}>
						검색
					</Button>
				</Box>
				{appliedSearch && (
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.25, minWidth: 0 }}>
						<Chip
							size="small"
							label={`검색: ${appliedSearch}`}
							onDelete={clearSearch}
							deleteIcon={<ClearIcon />}
							sx={{ maxWidth: '100%', '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' } }}
						/>
					</Box>
				)}
			</Box>
			<Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', p: 1.5 }}>
				{relationshipsQuery.isLoading ? (
					<Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
						<CircularProgress size={26} />
					</Box>
				) : relationshipsQuery.isError ? (
					<Alert severity="error">썸메이트 대화 목록을 불러오지 못했습니다.</Alert>
				) : relationships.length === 0 ? (
					<Alert severity="info">조건에 맞는 썸메이트 대화가 없습니다.</Alert>
				) : (
					<Stack spacing={1.25}>
						{relationships.map((item) => (
							<RelationshipCard
								key={item.id}
								item={item}
								selected={item.id === selectedId}
								onSelect={() => selectRelationship(item.id)}
							/>
						))}
						<Box ref={sentinelRef} sx={{ height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
							{relationshipsQuery.isFetchingNextPage ? <CircularProgress size={20} /> : null}
						</Box>
					</Stack>
				)}
			</Box>
		</Box>
	);

	const chatPane = (
		<ChatPanel
			selected={selected}
			messages={messagesQuery.data?.items ?? []}
			loading={messagesQuery.isLoading}
			onBack={isMobile ? () => setMobileMode('list') : undefined}
		/>
	);

	return (
		<Box sx={{ height: 'calc(100vh - 72px)', minHeight: 0, p: { xs: 0, md: 2 }, bgcolor: 'grey.50' }}>
			<Paper
				elevation={0}
				sx={{
					height: '100%',
					border: { xs: 0, md: 1 },
					borderColor: 'divider',
					borderRadius: { xs: 0, md: 1 },
					overflow: 'hidden',
					display: 'grid',
					gridTemplateColumns: isMobile ? '1fr' : '420px minmax(0, 1fr)',
					minHeight: 0,
				}}
			>
				{(!isMobile || mobileMode === 'list') && listPane}
				{(!isMobile || mobileMode === 'chat') && (
					<Box sx={{ minWidth: 0, minHeight: 0, borderLeft: isMobile ? 0 : 1, borderColor: 'divider' }}>
						{chatPane}
					</Box>
				)}
			</Paper>
		</Box>
	);
}
