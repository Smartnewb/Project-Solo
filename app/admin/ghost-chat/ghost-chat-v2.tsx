'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
	Alert,
	Box,
	Button,
	CircularProgress,
	Dialog,
	IconButton,
	Snackbar,
	Typography,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import {
	Close as CloseIcon,
	OpenInFull as OpenInFullIcon,
} from '@mui/icons-material';
import GhostChatPanel from './components/GhostChatPanel';
import GhostChatStatusBar from './components/GhostChatStatusBar';
import GhostContextPanel from './components/GhostContextPanel';
import GhostSessionQueue from './components/GhostSessionQueue';
import { useGhostChatSessions } from './hooks/useGhostChatSessions';
import {
	getDevGhostChatMessagePreview,
	getDevGhostChatTargetPreview,
} from './mock-data';
import type { GhostChatSessionContext } from '@/app/types/ghost-chat';

type GhostMobileView = 'list' | 'chat' | 'context';
const devPreviewEnabled = process.env.NODE_ENV === 'development';

function compactTargetProfile(context: GhostChatSessionContext | null | undefined) {
	if (!context?.target) return null;
	const target = context.target;
	const subtitle = [
		target.age ? `${target.age}세` : null,
		target.university?.name,
		target.department?.name,
		target.mbti,
	]
		.filter(Boolean)
		.join(' · ');
	return {
		name: target.name ?? '상대 유저',
		subtitle: subtitle || '프로필 정보 확인 중',
		photoUrl: target.primaryPhotoUrl ?? null,
		tags: [target.rank, target.gender].filter((value): value is string => Boolean(value)),
	};
}

function GhostChatV2Content() {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('md'));
	const router = useRouter();
	const searchParams = useSearchParams();
	const sessionFromUrl = searchParams?.get('session') ?? null;

	const [selectedSessionId, setSelectedSessionId] = useState<string | null>(sessionFromUrl);
	const [mobileView, setMobileView] = useState<GhostMobileView>(() =>
		isMobile && sessionFromUrl ? 'chat' : 'list',
	);
	const [snackbarOpen, setSnackbarOpen] = useState(false);
	const [fullScreenOpen, setFullScreenOpen] = useState(false);
	const [detailPanelOpen, setDetailPanelOpen] = useState(true);
	const initializedSessionFromUrlRef = useRef<string | null>(null);

	const {
		sessions,
		selectedSession,
		selectedContext,
		selectedMessages,
		contextMap,
		previewMessageMap,
		loading,
		messagesLoading,
		error,
		newSessionIds,
		unreadMap,
		statusCounts,
		actionLoadingId,
		selectSession,
		sendMessage,
		closeSession,
		clearSelectedSession,
		events,
		usingDevMocks,
	} = useGhostChatSessions();

	useEffect(() => {
		if (!sessionFromUrl) {
			initializedSessionFromUrlRef.current = null;
			return;
		}

		if (initializedSessionFromUrlRef.current !== sessionFromUrl) {
			initializedSessionFromUrlRef.current = sessionFromUrl;
			setSelectedSessionId(sessionFromUrl);
			void selectSession(sessionFromUrl).catch(() => {
				setSelectedSessionId(null);
				router.replace('/admin/ghost-chat', { scroll: false });
			});
		}

		if (isMobile) {
			setMobileView('chat');
		}
	}, [isMobile, router, selectSession, sessionFromUrl]);

	useEffect(() => {
		if (newSessionIds.size > 0) {
			setSnackbarOpen(true);
		}
	}, [newSessionIds.size]);

	const handleSelectSession = useCallback(
		(id: string) => {
			setSelectedSessionId(id);
			void selectSession(id).catch(() => {
				setSelectedSessionId(null);
				router.replace('/admin/ghost-chat', { scroll: false });
			});
			router.replace('/admin/ghost-chat?session=' + encodeURIComponent(id), { scroll: false });
			if (isMobile) {
				setMobileView('chat');
			} else {
				setDetailPanelOpen(true);
			}
		},
		[isMobile, router, selectSession],
	);

	useEffect(() => {
		if (!usingDevMocks || selectedSessionId || sessions.length === 0) return;
		handleSelectSession(sessions[0].id);
	}, [handleSelectSession, selectedSessionId, sessions, usingDevMocks]);

	const handleMobileBack = useCallback(() => {
		setMobileView('list');
		setSelectedSessionId(null);
		clearSelectedSession();
		router.replace('/admin/ghost-chat', { scroll: false });
	}, [clearSelectedSession, router]);

	const actionLoading = Boolean(actionLoadingId);

	const statusBar = (
		<GhostChatStatusBar
			pendingCount={statusCounts.pending}
			activeCount={statusCounts.active}
			idleCount={statusCounts.idle}
			closedCount={statusCounts.closed}
			connectionState={events.state}
			lastEventAt={events.lastEventAt}
			onReconnect={events.reconnect}
		/>
	);

	const queue = (
		<GhostSessionQueue
			sessions={sessions}
			selectedSessionId={selectedSessionId}
			newSessionIds={newSessionIds}
			unreadMap={unreadMap}
			variant={isMobile ? 'rail' : 'grid'}
			getPreviewMessages={(id) =>
				previewMessageMap[id] ?? (devPreviewEnabled ? getDevGhostChatMessagePreview(id) : [])
			}
			getTargetProfilePreview={(id) =>
				compactTargetProfile(contextMap[id]) ??
				(devPreviewEnabled ? getDevGhostChatTargetPreview(id) : null)
			}
			onSelectSession={handleSelectSession}
		/>
	);

	const chat = (
		<GhostChatPanel
			session={selectedSession}
			context={selectedContext}
			messages={selectedMessages}
			loading={loading}
			messagesLoading={messagesLoading}
			actionLoading={actionLoading}
			onSendMessage={sendMessage}
			onClose={closeSession}
			onBack={isMobile ? handleMobileBack : undefined}
			onOpenFullScreen={selectedSession ? () => setFullScreenOpen(true) : undefined}
		/>
	);

	const context = <GhostContextPanel session={selectedSession} context={selectedContext} />;
	const fullScreenDialog = (
		<Dialog fullScreen open={fullScreenOpen} onClose={() => setFullScreenOpen(false)}>
			<Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
				<Box
					sx={{
						px: 2,
						py: 1.25,
						borderBottom: 1,
						borderColor: 'divider',
						display: 'flex',
						alignItems: 'center',
						gap: 1,
					}}
				>
					<Typography variant="subtitle1" sx={{ flex: 1, fontWeight: 900 }}>
						Ghost Chat 전체 대응
					</Typography>
					<IconButton onClick={() => setFullScreenOpen(false)} aria-label="전체 화면 닫기">
						<CloseIcon />
					</IconButton>
				</Box>
				<Box
					sx={{
						flex: 1,
						minHeight: 0,
						display: 'grid',
						gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 380px' },
					}}
				>
					<GhostChatPanel
						session={selectedSession}
						context={selectedContext}
						messages={selectedMessages}
						loading={loading}
						messagesLoading={messagesLoading}
						actionLoading={actionLoading}
						onSendMessage={sendMessage}
						onClose={closeSession}
						fullScreenMode
					/>
					<Box sx={{ display: { xs: 'none', lg: 'block' }, minHeight: 0 }}>
						{context}
					</Box>
				</Box>
			</Box>
		</Dialog>
	);

	if (isMobile) {
		return (
			<Box sx={{ p: 2, height: '100vh', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
				{mobileView === 'list' && statusBar}
				{usingDevMocks && (
					<Alert severity="info">개발 환경 목업 데이터로 Ghost Chat UI를 표시 중입니다.</Alert>
				)}
				{error && <Alert severity="error">{error}</Alert>}
				{loading && sessions.length === 0 ? (
					<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
						<CircularProgress size={28} />
					</Box>
				) : (
					<Box sx={{ flex: 1, overflow: 'hidden' }}>
						{mobileView === 'list' && queue}
						{mobileView === 'chat' && (
							<Box sx={{ height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
								<Box sx={{ minHeight: 520 }}>{chat}</Box>
								<Box sx={{ minHeight: 360 }}>{context}</Box>
							</Box>
						)}
						{mobileView === 'context' && context}
					</Box>
				)}
				<Snackbar
					open={snackbarOpen}
					autoHideDuration={4000}
					onClose={() => setSnackbarOpen(false)}
					message={`새 Ghost Chat 세션 ${newSessionIds.size}건 도착`}
				/>
				{fullScreenDialog}
			</Box>
		);
	}

	return (
		<Box sx={{ p: 2, height: '100vh', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
			{statusBar}
			{usingDevMocks && (
				<Alert severity="info">개발 환경 목업 데이터로 Ghost Chat UI를 표시 중입니다.</Alert>
			)}
			{error && <Alert severity="error">{error}</Alert>}
			{selectedSession && !detailPanelOpen && (
				<Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
					<Button
						size="small"
						variant="outlined"
						startIcon={<OpenInFullIcon fontSize="small" />}
						onClick={() => setDetailPanelOpen(true)}
					>
						우측 패널 열기
					</Button>
				</Box>
			)}
			{loading && sessions.length === 0 ? (
				<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
					<CircularProgress size={32} />
					<Typography variant="body2" color="text.secondary" sx={{ ml: 1.5 }}>
						Ghost Chat 세션을 불러오는 중입니다.
					</Typography>
				</Box>
			) : (
				<Box
					sx={{
						flex: 1,
						minHeight: 0,
						display: 'grid',
						gridTemplateColumns: detailPanelOpen
							? {
								md: 'minmax(0, 1fr) minmax(560px, 42vw)',
								xl: 'minmax(0, 1fr) minmax(640px, 44vw)',
							}
							: '1fr',
						border: 1,
						borderColor: 'divider',
						borderRadius: 2,
						overflow: 'hidden',
						bgcolor: 'background.paper',
					}}
				>
					<Box sx={{ minHeight: 0 }}>{queue}</Box>
					{detailPanelOpen && (
						<Box
							sx={{
								minWidth: 0,
								minHeight: 0,
								borderLeft: 1,
								borderColor: 'divider',
								display: 'grid',
								gridTemplateRows: '44px minmax(260px, 34%) minmax(0, 1fr)',
							}}
						>
							<Box
								sx={{
									px: 1.5,
									borderBottom: 1,
									borderColor: 'divider',
									display: 'flex',
									alignItems: 'center',
									gap: 1,
									bgcolor: 'background.paper',
								}}
							>
								<Typography variant="subtitle2" sx={{ flex: 1, fontWeight: 900 }} noWrap>
									상세 패널
								</Typography>
								<IconButton
									size="small"
									onClick={() => setDetailPanelOpen(false)}
									aria-label="우측 상세 패널 닫기"
								>
									<CloseIcon fontSize="small" />
								</IconButton>
							</Box>
							<Box sx={{ minHeight: 0 }}>{context}</Box>
							<Box sx={{ minHeight: 0, borderTop: 1, borderColor: 'divider' }}>{chat}</Box>
						</Box>
					)}
				</Box>
			)}
			<Snackbar
				open={snackbarOpen}
				autoHideDuration={4000}
				onClose={() => setSnackbarOpen(false)}
				message={`새 Ghost Chat 세션 ${newSessionIds.size}건 도착`}
			/>
			{fullScreenDialog}
		</Box>
	);
}

export default function GhostChatV2() {
	return <GhostChatV2Content />;
}
