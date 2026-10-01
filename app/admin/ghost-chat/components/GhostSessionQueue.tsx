'use client';

import { useMemo, useState } from 'react';
import { Avatar, Button, Chip } from '@heroui/react';
import type {
	GhostChatSession,
	GhostChatTargetUserType,
	GhostChatTimelineMessage,
} from '@/app/types/ghost-chat';
import { GHOST_CHAT_STATE_LABELS } from '@/app/types/ghost-chat';

interface TargetProfilePreview {
	name: string;
	subtitle: string;
	photoUrl?: string | null;
	tags?: string[];
}

interface GhostSessionQueueProps {
	sessions: GhostChatSession[];
	selectedSessionId: string | null;
	newSessionIds: Set<string>;
	unreadMap: Record<string, number>;
	variant?: 'rail' | 'grid';
	getPreviewMessages?: (sessionId: string) => GhostChatTimelineMessage[];
	getTargetProfilePreview?: (sessionId: string) => TargetProfilePreview | null;
	onSelectSession: (id: string) => void;
}

type TargetFilter = 'all' | 'real_female' | 'ghost';

const targetFilterLabels: Record<TargetFilter, string> = {
	all: '전체',
	real_female: '실 여성',
	ghost: '고스트',
};

const targetTypeMeta: Record<
	GhostChatTargetUserType,
	{ label: string; color: 'success' | 'warning' | 'default' }
> = {
	REAL_FEMALE: { label: '실 여성', color: 'success' },
	GHOST: { label: '고스트 유저', color: 'warning' },
	OTHER: { label: '기타 상대', color: 'default' },
};

function getTargetUserType(session: GhostChatSession): GhostChatTargetUserType {
	if (session.targetUserType) return session.targetUserType;
	if (session.targetUserIsGhost || session.targetUserIsFaker) return 'GHOST';
	if (session.targetUserGender === 'FEMALE') return 'REAL_FEMALE';
	return 'OTHER';
}

function shortId(id: string) {
	return id.length > 10 ? `${id.slice(0, 6)}...${id.slice(-4)}` : id;
}

function elapsedLabel(dateString: string | null) {
	if (!dateString) return '기록 없음';
	const diffMs = Date.now() - new Date(dateString).getTime();
	const minutes = Math.max(0, Math.floor(diffMs / 60000));
	if (minutes < 1) return '방금';
	if (minutes < 60) return `${minutes}분 전`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}시간 전`;
	return `${Math.floor(hours / 24)}일 전`;
}

function compactDateTime(dateString: string | null) {
	if (!dateString) return '기록 없음';
	return new Intl.DateTimeFormat('ko-KR', {
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
	}).format(new Date(dateString));
}

function timestampOf(dateString: string | null | undefined) {
	if (!dateString) return 0;
	const time = new Date(dateString).getTime();
	return Number.isFinite(time) ? time : 0;
}

function getLatestChatActivityTime(session: GhostChatSession) {
	return Math.max(
		timestampOf(session.lastUserMessageAt),
		timestampOf(session.lastAdminMessageAt),
		timestampOf(session.updatedAt),
		timestampOf(session.createdAt),
	);
}

function sortForQueue(a: GhostChatSession, b: GhostChatSession) {
	return getLatestChatActivityTime(b) - getLatestChatActivityTime(a);
}

function senderLabel(senderType: GhostChatTimelineMessage['senderType']) {
	if (senderType === 'GHOST') return 'Ghost';
	if (senderType === 'TARGET_USER') return '상대';
	return '시스템';
}

function needsAdminReply(session: GhostChatSession, unreadCount: number) {
	if (unreadCount > 0) return true;
	if (!session.lastUserMessageAt) return false;
	if (!session.lastAdminMessageAt) return session.state !== 'CLOSED';
	return new Date(session.lastUserMessageAt).getTime() > new Date(session.lastAdminMessageAt).getTime();
}

function GhostSessionCard({session,selected,isNew,unreadCount,previewMessages,targetProfile,onSelect}:{session:GhostChatSession;selected:boolean;isNew:boolean;unreadCount:number;previewMessages:GhostChatTimelineMessage[];targetProfile:TargetProfilePreview|null;onSelect:()=>void}){
  const replyNeeded=needsAdminReply(session,unreadCount);
  const displayName=targetProfile?.name ?? '상대 프로필';
  const targetMeta=targetTypeMeta[getTargetUserType(session)];
  return <article className={`flex min-w-0 flex-col gap-3 rounded-lg border border-t-4 p-3 ${selected?'border-[var(--accent)]':replyNeeded?'border-red-300':isNew?'border-amber-300':'border-gray-200'}`}>
    {replyNeeded && <p className="rounded-md bg-red-700 p-2 text-xs font-semibold text-white">답장 필요 · 최근 유저 메시지 우선 처리</p>}
    <header className="flex items-start gap-2"><Avatar><Avatar.Image src={targetProfile?.photoUrl ?? undefined} alt=""/><Avatar.Fallback>{displayName.charAt(0)}</Avatar.Fallback></Avatar><div className="min-w-0 flex-1"><h3 className="truncate text-sm font-semibold">{displayName}</h3><p className="text-xs text-gray-600">{session.lastUserMessageAt?elapsedLabel(session.lastUserMessageAt):'대기 중'}</p><p className="truncate text-xs text-gray-600">{targetProfile?.subtitle ?? `상대 ${shortId(session.targetUserId)}`}</p></div>{unreadCount>0 && <Chip size="sm" color="danger" variant="soft" aria-label={`읽지 않은 메시지 ${unreadCount}개`}>{unreadCount}</Chip>}</header>
    <div className="flex flex-wrap gap-1"><Chip size="sm" color={targetMeta.color} variant="soft">{targetMeta.label}</Chip>{(targetProfile?.tags ?? []).slice(0,2).map(tag=><Chip key={tag} size="sm" variant="soft">{tag}</Chip>)}<Chip size="sm" color={replyNeeded?'danger':'default'} variant="soft">{replyNeeded?'응답 필요':session.state==='CLOSED'?'종료됨':'흐름 안정'}</Chip>{isNew && <Chip size="sm" color="warning" variant="soft">NEW</Chip>}</div>
    <dl className="grid grid-cols-2 gap-2 rounded-lg bg-gray-50 p-2 text-xs"><div><dt className="text-gray-600">상태</dt><dd>{GHOST_CHAT_STATE_LABELS[session.state]}</dd></div><div><dt className="text-gray-600">최근 Ghost</dt><dd>{session.lastAdminMessageAt?elapsedLabel(session.lastAdminMessageAt):'아직 없음'}</dd></div></dl>
    <section className="flex min-h-48 flex-1 flex-col gap-2 rounded-lg border bg-gray-50 p-2"><h4 className="text-xs font-semibold text-gray-600">최근 채팅 6개</h4>{previewMessages.length ? previewMessages.slice(-6).map(message=><div key={message.id} className={`max-w-[86%] space-y-1 rounded-lg border bg-white p-2 text-xs ${message.senderType==='GHOST'?'self-end':message.senderType==='SYSTEM'?'self-center':'self-start'}`}><p className="font-semibold text-gray-600">{senderLabel(message.senderType)}</p><p className="line-clamp-2 break-words">{message.content ?? (message.messageType==='image'?'이미지 메시지':'메시지 본문 없음')}</p></div>):<p className="m-auto text-center text-xs text-gray-600">선택 시 대화 내용을 확인할 수 있습니다.</p>}</section>
    <dl className="grid grid-cols-2 gap-2 text-xs text-gray-600"><div><dt>상대</dt><dd>{shortId(session.targetUserId)}</dd></div><div><dt>매치</dt><dd>{shortId(session.matchId)}</dd></div><div><dt>생성</dt><dd>{compactDateTime(session.createdAt)}</dd></div></dl>
    <div className="flex items-center gap-2"><Chip size="sm" variant="soft">유저 {session.userMessageCount}</Chip><Chip size="sm" variant="soft">Ghost {session.adminMessageCount}</Chip><Button size="sm" className="ml-auto" variant={selected?'primary':'secondary'} aria-label={`${displayName} 채팅 열기`} aria-pressed={selected} isDisabled={session.state==='CLOSED'} onPress={onSelect}>열기</Button></div>
  </article>;
}

export default function GhostSessionQueue({
	sessions,
	selectedSessionId,
	newSessionIds,
	unreadMap,
	variant = 'rail',
	getPreviewMessages,
	getTargetProfilePreview,
	onSelectSession,
}: GhostSessionQueueProps) {
	const [targetFilter, setTargetFilter] = useState<TargetFilter>('all');
	const openSessions = useMemo(() => sessions.filter((session) => session.state !== 'CLOSED'), [sessions]);

	const queueStats = useMemo(() => {
		const active = openSessions.length;
		const needsReply = openSessions.filter((session) => needsAdminReply(session, unreadMap[session.id] ?? 0)).length;
		const recentlyUpdated = openSessions.filter((session) => {
			const updatedAt = new Date(session.updatedAt).getTime();
			return Number.isFinite(updatedAt) && Date.now() - updatedAt < 1000 * 60 * 60 * 24;
		}).length;
		const realFemale = openSessions.filter((session) => getTargetUserType(session) === 'REAL_FEMALE').length;
		const ghost = openSessions.filter((session) => getTargetUserType(session) === 'GHOST').length;
		return { total: openSessions.length, active, needsReply, recentlyUpdated, realFemale, ghost };
	}, [openSessions, unreadMap]);

	const filteredSessions = useMemo(() => {
		return openSessions
			.filter((session) => {
				if (targetFilter === 'real_female') return getTargetUserType(session) === 'REAL_FEMALE';
				if (targetFilter === 'ghost') return getTargetUserType(session) === 'GHOST';
				return true;
			})
			.sort(sortForQueue);
	}, [openSessions, targetFilter]);

  return <section className="flex h-full min-h-0 flex-col">
    <header className="space-y-3 border-b bg-gray-50 p-3"><div className="flex items-center justify-between gap-2"><div><h2 className="text-lg font-bold">고스트 챗 관리</h2><p className="text-xs text-gray-600">채팅방 단위로 한눈에 보고 바로 대응합니다.</p></div><Chip size="sm" variant="soft">전체 {queueStats.total}건</Chip></div>
      <dl className="grid grid-cols-3 gap-2">{[['응답 필요',queueStats.needsReply],['열린 채팅',queueStats.active],['24h 활동',queueStats.recentlyUpdated]].map(([label,value])=><div key={label} className="rounded-lg border bg-white p-2"><dt className="text-xs text-gray-600">{label}</dt><dd className="font-semibold">{value}</dd></div>)}</dl>
      <div role="group" aria-label="상대 유저 분류 필터" className="flex flex-wrap gap-2">{([
        {key:'all',label:'전체 채팅방',count:queueStats.total}, {key:'real_female',label:'실 여성 유저 채팅방',count:queueStats.realFemale}, {key:'ghost',label:'고스트 유저 채팅방',count:queueStats.ghost},
      ] as const).map(filter=><Button key={filter.key} size="sm" aria-label={filter.label} aria-pressed={targetFilter===filter.key} variant={targetFilter===filter.key?'primary':'secondary'} onPress={()=>setTargetFilter(filter.key)}>{targetFilterLabels[filter.key]} {filter.count}</Button>)}</div>
    </header>
    <div className="min-h-0 flex-1 overflow-y-auto p-3">{!filteredSessions.length ? <p className="flex h-full items-center justify-center text-center text-sm text-gray-600">표시할 {targetFilterLabels[targetFilter]} 채팅방이 없습니다.</p> : <div className={`grid gap-3 ${variant==='grid'?'grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))]':'grid-cols-1'}`}>
      {filteredSessions.map(session=><GhostSessionCard key={session.id} session={session} selected={selectedSessionId===session.id} isNew={newSessionIds.has(session.id)} unreadCount={unreadMap[session.id] ?? 0} previewMessages={getPreviewMessages?.(session.id) ?? []} targetProfile={getTargetProfilePreview?.(session.id) ?? null} onSelect={()=>onSelectSession(session.id)}/>)}
    </div>}</div>
  </section>;
}
