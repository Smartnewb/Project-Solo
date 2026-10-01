'use client';

import Link from 'next/link';
import { Avatar, Chip, Separator } from '@heroui/react';
import { ExternalLink } from 'lucide-react';
import type { GhostChatSession, GhostChatSessionContext } from '@/app/types/ghost-chat';

function FieldRow({label,value}:{label:string;value:string|number|null|undefined}){
  return <div className="space-y-1"><dt className="text-xs text-gray-600">{label}</dt><dd className="break-words text-sm">{value ?? '없음'}</dd></div>;
}
function joinValues(values:Array<string|number|null|undefined>){
  const present=values.filter(value=>value!==null && value!==undefined && value!=='');
  return present.length ? present.join(' · '):null;
}
export default function GhostContextPanel({session,context}:{session:GhostChatSession|null;context:GhostChatSessionContext|null}){
  if(!session) return <p className="flex h-full items-center justify-center p-4 text-center text-sm text-gray-600">세션을 선택하면 운영 컨텍스트가 표시됩니다.</p>;
  return <aside className="h-full space-y-4 overflow-y-auto p-4"><h2 className="text-lg font-semibold">선택된 Ghost 프로필</h2>
    <section className="space-y-3 rounded-xl border p-4"><h3 className="text-sm font-semibold">유저에게 응답할 Ghost</h3>{context?.ghost ? <>
      <div className="flex items-center gap-3"><Avatar><Avatar.Image src={context.ghost.primaryPhotoUrl ?? undefined} alt=""/><Avatar.Fallback>{context.ghost.name.charAt(0)}</Avatar.Fallback></Avatar><div><p className="font-semibold">{context.ghost.name}</p><p className="text-xs text-gray-600">상대 노출명: {context.ghost.anonymousName}</p></div></div>
      <dl className="grid gap-3 sm:grid-cols-2"><FieldRow label="기본 정보" value={joinValues([context.ghost.age,context.ghost.gender,context.ghost.mbti,context.ghost.rank])}/><FieldRow label="학교/학과" value={joinValues([context.ghost.university?.name,context.ghost.department?.name])}/><FieldRow label="소개" value={context.ghost.introduction}/></dl>
      {!!context.ghost.keywords?.length && <div className="flex flex-wrap gap-2">{context.ghost.keywords.map(keyword=><Chip key={keyword} size="sm" variant="soft">{keyword}</Chip>)}</div>}
      <Link className="button button--secondary button--sm" href={`/admin/ai-profiles/ghosts?ghostAccountId=${encodeURIComponent(session.ghostAccountId)}`} target="_blank" rel="noopener noreferrer">Ghost 프로필 확인<ExternalLink size={16}/></Link>
    </>:<p className="text-sm text-gray-600">프로필 컨텍스트를 불러오는 중입니다.</p>}</section>
    <div className="grid gap-3 sm:grid-cols-2"><section className="space-y-3 rounded-xl border p-4"><h3 className="text-sm font-semibold">운영 안전장치</h3><dl className="space-y-3"><FieldRow label="userMessageCount" value={session.userMessageCount}/><FieldRow label="adminMessageCount" value={session.adminMessageCount}/><FieldRow label="closedReason" value={session.closedReason}/></dl></section>
      <section className="space-y-3 rounded-xl border p-4"><h3 className="text-sm font-semibold">노출 안전</h3><dl className="space-y-3"><FieldRow label="상대방에게 보이는 이름" value={context?.visibility.targetSeesGhostName ?? context?.ghost.anonymousName}/><FieldRow label="실명 노출 차단" value={context?.visibility.realGhostNameHiddenFromTarget ? '활성':'확인 필요'}/></dl></section></div>
    <Separator/><p className="text-xs text-gray-600">운영자 화면에는 Ghost 실제 프로필을 보여주고, 유저 화면에는 anonymousName 계약을 사용합니다.</p>
  </aside>;
}
