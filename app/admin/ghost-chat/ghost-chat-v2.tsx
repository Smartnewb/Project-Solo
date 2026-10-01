'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Modal, Spinner } from '@heroui/react';
import { X, Maximize } from 'lucide-react';
import { useToast } from '@/shared/ui/admin/toast/toast-context';
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
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 899px)');
    const update = () => setIsMobile(query.matches);
    update(); query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const toast = useToast();
	const router = useRouter();
	const searchParams = useSearchParams();
	const sessionFromUrl = searchParams?.get('session') ?? null;
	const ghostAccountIdFromUrl = searchParams?.get('ghostAccountId') ?? null;

	const [selectedSessionId, setSelectedSessionId] = useState<string | null>(sessionFromUrl);
	const [mobileView, setMobileView] = useState<GhostMobileView>(() =>
		sessionFromUrl ? 'chat' : 'list',
	);
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
	} = useGhostChatSessions({ ghostAccountId: ghostAccountIdFromUrl });

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
				router.replace(
					ghostAccountIdFromUrl
						? `/admin/ghost-chat?ghostAccountId=${encodeURIComponent(ghostAccountIdFromUrl)}`
						: '/admin/ghost-chat',
					{ scroll: false },
				);
			});
		}

		if (isMobile) {
			setMobileView('chat');
		}
	}, [ghostAccountIdFromUrl, isMobile, router, selectSession, sessionFromUrl]);

	useEffect(() => {
		if (newSessionIds.size > 0) {
			toast.info(`새 Ghost Chat 세션 ${newSessionIds.size}건 도착`);
		}
	}, [newSessionIds.size, toast]);

	const handleSelectSession = useCallback(
		(id: string) => {
			setSelectedSessionId(id);
			void selectSession(id).catch(() => {
				setSelectedSessionId(null);
				router.replace(
					ghostAccountIdFromUrl
						? `/admin/ghost-chat?ghostAccountId=${encodeURIComponent(ghostAccountIdFromUrl)}`
						: '/admin/ghost-chat',
					{ scroll: false },
				);
			});
			const nextParams = new URLSearchParams();
			nextParams.set('session', id);
			if (ghostAccountIdFromUrl) nextParams.set('ghostAccountId', ghostAccountIdFromUrl);
			router.replace(`/admin/ghost-chat?${nextParams.toString()}`, { scroll: false });
			if (isMobile) {
				setMobileView('chat');
			} else {
				setDetailPanelOpen(true);
			}
		},
		[ghostAccountIdFromUrl, isMobile, router, selectSession],
	);

	useEffect(() => {
		if (!usingDevMocks || selectedSessionId || sessions.length === 0) return;
		handleSelectSession(sessions[0].id);
	}, [handleSelectSession, selectedSessionId, sessions, usingDevMocks]);

	const handleMobileBack = useCallback(() => {
		setMobileView('list');
		setSelectedSessionId(null);
		clearSelectedSession();
		router.replace(
			ghostAccountIdFromUrl
				? `/admin/ghost-chat?ghostAccountId=${encodeURIComponent(ghostAccountIdFromUrl)}`
				: '/admin/ghost-chat',
			{ scroll: false },
		);
	}, [clearSelectedSession, ghostAccountIdFromUrl, router]);

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

  const filterNotice = ghostAccountIdFromUrl ? <p className="rounded-lg border p-3 text-sm">프로필 {ghostAccountIdFromUrl} 기준으로 생성된 Ghost Chat 세션만 표시 중입니다.</p> : null;

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
  const fullScreenDialog = <Modal.Backdrop isOpen={fullScreenOpen} onOpenChange={setFullScreenOpen}>
    <Modal.Container size="full"><Modal.Dialog><Modal.Header className="flex items-center justify-between flex-row flex-wrap gap-3"><Modal.Heading>Ghost Chat 전체 대응</Modal.Heading><Button isIconOnly variant="tertiary" aria-label="전체 화면 닫기" onPress={()=>setFullScreenOpen(false)}><X size={18}/></Button></Modal.Header>
      <Modal.Body className="grid min-h-0 flex-1 overflow-hidden p-0 lg:grid-cols-[minmax(0,1fr)_380px]">
        <GhostChatPanel session={selectedSession} context={selectedContext} messages={selectedMessages} loading={loading} messagesLoading={messagesLoading} actionLoading={actionLoading} onSendMessage={sendMessage} onClose={closeSession} fullScreenMode/>
        <div className="hidden min-h-0 border-l lg:block">{context}</div>
      </Modal.Body>
    </Modal.Dialog></Modal.Container>
  </Modal.Backdrop>;
  const notices = <>{filterNotice}{usingDevMocks && <p className="rounded-lg border p-3 text-sm">개발 환경 목업 데이터로 Ghost Chat UI를 표시 중입니다.</p>}{error && <p role="alert" className="rounded-lg border border-red-200 p-3">{error}</p>}</>;
  const loadingState = <div role="status" className="flex flex-1 items-center justify-center gap-3"><Spinner/><p className="text-sm text-gray-600">Ghost Chat 세션을 불러오는 중입니다.</p></div>;

  if (isMobile) return <main className="flex h-[calc(100dvh-4rem)] min-h-0 flex-col gap-3 p-3">
    {mobileView==='list' && statusBar}{notices}
    {loading && !sessions.length ? loadingState : <div className="min-h-0 flex-1 overflow-hidden">
      {mobileView==='list' && queue}{mobileView==='chat' && <div className="flex h-full flex-col gap-3 overflow-y-auto"><div className="min-h-[520px]">{chat}</div><div className="min-h-[360px]">{context}</div></div>}{mobileView==='context' && context}
    </div>}{fullScreenDialog}
  </main>;

  return <main className="flex h-[calc(100dvh-4rem)] min-h-0 flex-col gap-3 p-4">
    {statusBar}{notices}
    {selectedSession && !detailPanelOpen && <div className="flex justify-end"><Button size="sm" variant="secondary" onPress={()=>setDetailPanelOpen(true)}><Maximize size={16}/>우측 패널 열기</Button></div>}
    {loading && !sessions.length ? loadingState : <div className={`grid min-h-0 flex-1 overflow-hidden rounded-xl border bg-white ${detailPanelOpen?'grid-cols-[minmax(0,1fr)_minmax(0,42%)]':''}`}>
      <div className="min-h-0 min-w-0">{queue}</div>
      {detailPanelOpen && <section className="grid min-h-0 min-w-0 grid-rows-[44px_minmax(200px,34%)_minmax(0,1fr)] border-l">
        <header className="flex items-center gap-2 border-b px-3"><h2 className="flex-1 text-sm font-semibold">상세 패널</h2><Button size="sm" isIconOnly variant="tertiary" aria-label="우측 상세 패널 닫기" onPress={()=>setDetailPanelOpen(false)}><X size={16}/></Button></header>
        <div className="min-h-0">{context}</div><div className="min-h-0 border-t">{chat}</div>
      </section>}
    </div>}{fullScreenDialog}
  </main>;
}

export default function GhostChatV2() { return <GhostChatV2Content/>; }
