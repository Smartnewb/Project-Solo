'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
	Alert,
	Box,
	CircularProgress,
	Snackbar,
	Typography,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import GhostChatPanel from './components/GhostChatPanel';
import GhostChatStatusBar from './components/GhostChatStatusBar';
import GhostContextPanel from './components/GhostContextPanel';
import GhostSessionQueue from './components/GhostSessionQueue';
import { useGhostChatSessions } from './hooks/useGhostChatSessions';
import { useAdminSession } from '@/shared/contexts/admin-session-context';

type GhostQueueTab = 'queue' | 'mine';
type GhostMobileView = 'list' | 'chat' | 'context';

function GhostChatV2Content() {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('md'));
	const router = useRouter();
	const searchParams = useSearchParams();
	const sessionFromUrl = searchParams?.get('session') ?? null;
	const { session: adminSession } = useAdminSession();

	const [selectedSessionId, setSelectedSessionId] = useState<string | null>(sessionFromUrl);
	const [activeTab, setActiveTab] = useState<GhostQueueTab>('queue');
	const [mobileView, setMobileView] = useState<GhostMobileView>(() =>
		isMobile && sessionFromUrl ? 'chat' : 'list',
	);
	const [snackbarOpen, setSnackbarOpen] = useState(false);
	const initializedSessionFromUrlRef = useRef<string | null>(null);

	const {
		sessions,
		selectedSession,
		selectedMessages,
		loading,
		messagesLoading,
		error,
		newSessionIds,
		unreadMap,
		statusCounts,
		actionLoadingId,
		selectSession,
		assignSession,
		sendMessage,
		closeSession,
		clearSelectedSession,
		events,
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
			}
		},
		[isMobile, router, selectSession],
	);

	const handleAssignSession = useCallback(
		async (id: string) => {
			await assignSession(id);
			setSelectedSessionId(id);
			await selectSession(id);
			router.replace('/admin/ghost-chat?session=' + encodeURIComponent(id), { scroll: false });
			if (isMobile) {
				setMobileView('chat');
			}
		},
		[assignSession, isMobile, router, selectSession],
	);

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
			activeTab={activeTab}
			onTabChange={setActiveTab}
			onSelectSession={handleSelectSession}
			onAssignSession={(id) => {
				void handleAssignSession(id);
			}}
			currentAdminId={adminSession?.user.id ?? null}
			assigningSessionId={actionLoadingId}
		/>
	);

	const chat = (
		<GhostChatPanel
			session={selectedSession}
			messages={selectedMessages}
			loading={loading}
			messagesLoading={messagesLoading}
			actionLoading={actionLoading}
			onAssign={handleAssignSession}
			onSendMessage={sendMessage}
			onClose={closeSession}
			onBack={isMobile ? handleMobileBack : undefined}
		/>
	);

	const context = <GhostContextPanel session={selectedSession} />;

	if (isMobile) {
		return (
			<Box sx={{ p: 2, height: '100vh', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
				{mobileView === 'list' && statusBar}
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
			</Box>
		);
	}

	return (
		<Box sx={{ p: 3, height: '100vh', display: 'flex', flexDirection: 'column', gap: 2 }}>
			{statusBar}
			{error && <Alert severity="error">{error}</Alert>}
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
						display: 'flex',
						border: 1,
						borderColor: 'divider',
						borderRadius: 2,
						overflow: 'hidden',
						bgcolor: 'background.paper',
					}}
				>
					<Box sx={{ width: 430, minWidth: 430 }}>{queue}</Box>
					<Box sx={{ flex: 1, minWidth: 0 }}>{chat}</Box>
					<Box sx={{ width: 360, minWidth: 360 }}>{context}</Box>
				</Box>
			)}
			<Snackbar
				open={snackbarOpen}
				autoHideDuration={4000}
				onClose={() => setSnackbarOpen(false)}
				message={`새 Ghost Chat 세션 ${newSessionIds.size}건 도착`}
			/>
		</Box>
	);
}

export default function GhostChatV2() {
	return <GhostChatV2Content />;
}
