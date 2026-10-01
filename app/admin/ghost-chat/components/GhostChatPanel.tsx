'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { Avatar, Button, Chip, Description, Label, Separator, Spinner, TextArea, TextField } from '@heroui/react';
import { ArrowLeft, Maximize, Send, X } from 'lucide-react';
import type { GhostChatSession, GhostChatSessionContext, GhostChatTimelineMessage } from '@/app/types/ghost-chat';
import { GHOST_CHAT_STATE_LABELS } from '@/app/types/ghost-chat';
import GhostChatConfirmDialog from './GhostChatConfirmDialog';

interface GhostChatPanelProps {
	session: GhostChatSession | null;
	context?: GhostChatSessionContext | null;
	messages: GhostChatTimelineMessage[];
	loading: boolean;
	messagesLoading: boolean;
	actionLoading: boolean;
	onSendMessage: (id: string, content: string) => Promise<void>;
	onClose: (id: string) => Promise<void> | void;
	onBack?: () => void;
	onOpenFullScreen?: () => void;
	fullScreenMode?: boolean;
}

type ConfirmMode = 'first-send' | 'close' | null;

const stateColors: Record<GhostChatSession['state'], 'warning' | 'success' | 'accent' | 'default'> = {
	PENDING: 'warning',
	ACTIVE: 'success',
	IDLE: 'accent',
	CLOSED: 'default',
};

function shortId(id: string) {
	return id.length > 10 ? `${id.slice(0, 6)}...${id.slice(-4)}` : id;
}

function formatTime(dateString: string | null) {
	if (!dateString) return null;
	return new Date(dateString).toLocaleString('ko-KR', {
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
	});
}

function buildTimeline(session: GhostChatSession) {
	return [
		{ label: '세션 생성됨', at: session.createdAt },
		{ label: '첫 유저 메시지', at: session.firstUserMessageAt },
		{ label: '마지막 유저 메시지', at: session.lastUserMessageAt },
		{ label: '마지막 Ghost 메시지', at: session.lastAdminMessageAt },
		{ label: '세션 종료됨', at: session.closedAt },
	].filter((item) => item.at);
}

function compactProfileLabel(profile: GhostChatSessionContext['ghost'] | NonNullable<GhostChatSessionContext['target']> | null | undefined) {
	if (!profile) return '프로필 로딩 중';
	return [profile.age ? `${profile.age}세` : null, profile.university?.name, profile.department?.name, profile.mbti]
		.filter(Boolean)
		.join(' · ');
}

const senderLabels: Record<GhostChatTimelineMessage['senderType'], string> = {
	TARGET_USER: '상대 유저',
	GHOST: 'Ghost',
	SYSTEM: '시스템',
};

function getComposerBlockedReason(session: GhostChatSession) {
	if (session.state === 'CLOSED') return '종료된 세션에는 메시지를 보낼 수 없습니다.';
	return null;
}

function buildLocalAiDraft(
	messages: GhostChatTimelineMessage[],
	context: GhostChatSessionContext | null | undefined,
) {
	const latestUserMessage = [...messages].reverse().find((message) => message.senderType === 'TARGET_USER');
	const ghostName = context?.ghost.anonymousName ?? '나';
	if (!latestUserMessage?.content) {
		return `${ghostName} 톤으로 자연스럽게 이어갈 수 있는 답장을 작성해 주세요.`;
	}
	return `${latestUserMessage.content}\n\n좋아요. 부담스럽지 않게 얘기 이어가보고 싶어요. 조금 더 편하게 말해줘도 돼요.`;
}

export default function GhostChatPanel({
	session,
	context,
	messages,
	loading,
	messagesLoading,
	actionLoading,
	onSendMessage,
	onClose,
	onBack,
	onOpenFullScreen,
	fullScreenMode = false,
}: GhostChatPanelProps) {
	const [draft, setDraft] = useState('');
	const [aiDraft, setAiDraft] = useState<string | null>(null);
	const [localError, setLocalError] = useState<string | null>(null);
	const [confirmMode, setConfirmMode] = useState<ConfirmMode>(null);
  const [sending, setSending] = useState(false);
  const currentSessionId = useRef(session?.id);
  currentSessionId.current = session?.id;
  const busy = actionLoading || sending;

	const timeline = useMemo(() => (session ? buildTimeline(session) : []), [session]);
	const recentMessages = useMemo(() => messages.slice(-6).reverse(), [messages]);
	const canSend = Boolean(session && session.state !== 'CLOSED' && draft.trim() && !busy);
	const canClose = Boolean(session && session.state !== 'CLOSED' && !busy);
	const canRequestAiDraft = Boolean(session && session.state !== 'CLOSED' && !busy && !messagesLoading);
	const composerBlockedReason = session ? getComposerBlockedReason(session) : null;

	useEffect(() => {
		setAiDraft(null); setDraft(''); setLocalError(null); setConfirmMode(null);
	}, [session?.id]);

  const sendDraft = async () => {
    if (!session || busy || session.state === 'CLOSED' || !draft.trim()) return;
    const id = session.id;
    setSending(true); setLocalError(null);
    try { await onSendMessage(id, draft); if (currentSessionId.current === id) setDraft(''); }
    catch (err) { if (currentSessionId.current === id) setLocalError(err instanceof Error ? err.message : 'Ghost 메시지 전송에 실패했습니다.'); }
    finally { setSending(false); }
  };

	const handleSend = () => {
		if (!session || !canSend) return;
		if (session.adminMessageCount === 0) {
			setConfirmMode('first-send');
			return;
		}
		void sendDraft();
	};

	const handleClose = () => {
		if (!canClose) return;
		setConfirmMode('close');
	};

	const handleRequestAiDraft = () => {
		if (!session) return;
		setLocalError(null);
		setAiDraft(buildLocalAiDraft(messages, context));
	};

	const handleApplyAiDraft = () => {
		if (!aiDraft) return;
		setDraft(aiDraft);
	};

	const handleConfirm = async () => {
		if (!session || !confirmMode || busy || session.state === 'CLOSED') return;
		if (confirmMode === 'first-send') {
			setConfirmMode(null);
			await sendDraft();
			return;
		}
		try {
      setSending(true);
			setLocalError(null);
			await onClose(session.id);
			setConfirmMode(null);
		} catch (err) {
			setConfirmMode(null);
      setLocalError(err instanceof Error ? err.message : 'Ghost Chat 세션 종료에 실패했습니다.');
		} finally { setSending(false); }
	};

  if (loading && !session) return <div role="status" aria-label="세션 불러오는 중" className="flex h-full items-center justify-center"><Spinner /></div>;
  if (!session) return <p className="flex h-full items-center justify-center text-gray-600">세션을 선택하세요</p>;

  return <section className="flex h-full min-w-0 flex-col">
    <header className="space-y-3 border-b p-4"><div className="flex items-center gap-2">
      {onBack && <Button size="sm" isIconOnly variant="tertiary" aria-label="목록으로 돌아가기" onPress={onBack}><ArrowLeft size={18}/></Button>}
      <h2 className="flex-1 text-lg font-semibold">현재 열린 채팅</h2><Chip size="sm" variant="soft" color={stateColors[session.state]}>{GHOST_CHAT_STATE_LABELS[session.state]}</Chip>
      {onOpenFullScreen && <Button size="sm" isIconOnly variant="tertiary" aria-label="전체 화면에서 대응" onPress={onOpenFullScreen}><Maximize size={18}/></Button>}
    </div>
    <div className="grid gap-3 sm:grid-cols-2">{[
      {label:'Ghost 프로필',name:context?.ghost.anonymousName ?? `Ghost ${shortId(session.ghostAccountId)}`,photo:context?.ghost.primaryPhotoUrl,profile:context?.ghost},
      {label:'상대 유저',name:shortId(session.targetUserId),photo:context?.target?.primaryPhotoUrl,profile:context?.target},
    ].map(profile=><div key={profile.label} className="flex items-center gap-2 rounded-lg border p-3"><Avatar size="sm"><Avatar.Image src={profile.photo ?? undefined} alt=""/><Avatar.Fallback>{profile.name.charAt(0)}</Avatar.Fallback></Avatar><div className="min-w-0"><p className="text-xs text-gray-600">{profile.label}</p><p className="truncate font-semibold">{profile.name}</p><p className="truncate text-xs text-gray-600">{compactProfileLabel(profile.profile)}</p></div></div>)}</div>
    <Button variant="danger-soft" size="sm" onPress={handleClose} isDisabled={!canClose}><X size={16}/>종료</Button>
    </header>
    <div className={`grid min-h-0 flex-1 overflow-hidden bg-gray-50 ${fullScreenMode ? 'lg:grid-cols-[minmax(0,1fr)_320px]':''}`}>
      <div className="min-h-0 space-y-3 overflow-y-auto p-4">
        {localError && <div role="alert" className="flex items-center justify-between rounded-lg border border-red-200 p-3"><p>{localError}</p><Button variant="tertiary" isIconOnly aria-label="전송 오류 닫기" onPress={()=>setLocalError(null)}><X size={16}/></Button></div>}
        {messagesLoading && <div role="status" aria-label="메시지 조회 중" className="flex justify-center"><Spinner size="sm"/></div>}
        <ul className="flex flex-col gap-3" aria-label="대화 내역">{messages.map(message=>{
          const isGhost=message.senderType==='GHOST', isSystem=message.senderType==='SYSTEM';
          const body=message.content?.trim() || (message.mediaUrl ? `[${message.messageType}] ${message.mediaUrl}`:null) || `[${message.messageType}]`;
          return <li key={message.id} className={`flex ${isSystem?'justify-center':isGhost?'justify-end':'justify-start'}`}><div className={`space-y-1 rounded-lg border bg-white p-3 ${isSystem?'max-w-[92%]':'max-w-[78%]'}`}><div className="flex justify-between gap-3 text-xs"><span className="font-semibold">{senderLabels[message.senderType]}</span><time className="text-gray-600">{formatTime(message.createdAt)}</time></div><p className="whitespace-pre-wrap break-words text-sm">{body}</p></div></li>;
        })}{!messagesLoading && !messages.length && <li className="rounded-lg border bg-white p-3"><p className="text-sm font-semibold">아직 표시할 메시지가 없습니다.</p><p className="text-xs text-gray-600">세션 이벤트 {timeline.length}건</p></li>}</ul>
      </div>
      {fullScreenMode && <aside className="hidden space-y-3 overflow-y-auto border-l bg-white p-4 lg:block"><h3 className="text-sm font-semibold">최근 채팅 내역</h3>{recentMessages.length ? recentMessages.map(message=><div key={message.id} className="space-y-1 rounded-lg border p-3"><p className="text-xs font-semibold">{senderLabels[message.senderType]} · {formatTime(message.createdAt)}</p><p className="whitespace-pre-wrap break-words text-sm">{message.content?.trim() || `[${message.messageType}]`}</p></div>):<p className="text-sm text-gray-600">최근 메시지가 없습니다.</p>}<Separator/><h3 className="text-sm font-semibold">작성 지원</h3><p className="text-xs text-gray-600">최근 유저 메시지를 참고한 문구 예시입니다. 내용을 검수한 뒤 전송하세요.</p><Button variant="secondary" size="sm" onPress={handleRequestAiDraft} isDisabled={!canRequestAiDraft}>문구 예시 만들기</Button></aside>}
    </div>
    <Separator/><div className="space-y-3 p-4">
      {composerBlockedReason && <p className="text-sm text-gray-600">{composerBlockedReason}</p>}
      <div className="flex flex-wrap items-center gap-2"><Button variant="secondary" size="sm" onPress={handleRequestAiDraft} isDisabled={!canRequestAiDraft}>문구 예시 만들기</Button><Chip size="sm" variant="soft">검수 후 직접 전송</Chip></div>
      {aiDraft && <section className="space-y-3 rounded-lg border p-3"><div className="flex flex-wrap items-center gap-2"><h3 className="flex-1 text-sm font-semibold">작성 문구 예시</h3><Button size="sm" variant="tertiary" isDisabled={busy} onPress={handleRequestAiDraft}>다시 만들기</Button><Button size="sm" isDisabled={busy || session.state==='CLOSED'} onPress={handleApplyAiDraft}>입력창에 적용</Button></div><p className="whitespace-pre-wrap break-words text-sm">{aiDraft}</p><p className="text-xs text-gray-600">운영자가 문구를 검수하고 전송 버튼을 눌러야 발송됩니다.</p></section>}
      <TextField isDisabled={session.state==='CLOSED' || busy}><Label>Ghost persona로 전송</Label><TextArea rows={2} className="max-h-40" value={draft} onChange={event=>setDraft(event.target.value)} placeholder={session.state!=='CLOSED'?'Ghost 명의로 보낼 메시지 입력':composerBlockedReason ?? '종료된 세션입니다.'} onKeyDown={event=>{if(event.key==='Enter' && !event.shiftKey && !event.nativeEvent.isComposing){event.preventDefault();handleSend();}}}/><Description>Enter 전송 · Shift+Enter 줄바꿈</Description></TextField>
      <div className="flex items-center justify-between gap-3"><p className="text-xs text-gray-600">유저 {session.userMessageCount}건 · Ghost {session.adminMessageCount}건 · 종료 {formatTime(session.closedAt) ?? '아님'}</p><Button isDisabled={!canSend} onPress={handleSend}>{busy?<Spinner size="sm" aria-hidden="true"/>:<Send size={16}/>}전송</Button></div>
    </div>
    <GhostChatConfirmDialog open={confirmMode==='first-send'} title="Ghost 메시지 전송 확인" description="이 메시지는 Ghost 프로필 명의로 유저에게 전송됩니다. 계속 전송할까요?" confirmLabel="전송" loading={busy} onCancel={()=>setConfirmMode(null)} onConfirm={handleConfirm}/>
    <GhostChatConfirmDialog open={confirmMode==='close'} title="대화 종료" description="종료 후 이 세션에서는 메시지를 보낼 수 없습니다." confirmLabel="종료" confirmColor="error" loading={busy} onCancel={()=>setConfirmMode(null)} onConfirm={handleConfirm}/>
  </section>;
}
