'use client';

import { Avatar, Button, Skeleton } from '@heroui/react';
import type { CareTarget, CarePartner } from '@/app/services/admin/care';
import { calculateAge } from '@/app/utils/formatters';

interface CareDetailPanelProps {
	target: CareTarget | null;
	partners: CarePartner[];
	partnersLoading: boolean;
	onDismiss: () => void;
	onSelectPartner: (partner: CarePartner) => void;
	dismissLoading: boolean;
}

export default function CareDetailPanel({
	target,
	partners,
	partnersLoading,
	onDismiss,
	onSelectPartner,
	dismissLoading,
}: CareDetailPanelProps) {
  if (!target) return <section className="flex min-h-[300px] items-center justify-center rounded-xl border border-border"><p className="text-sm text-gray-600">목록에서 유저를 선택하세요</p></section>;
  return <section className="space-y-4 rounded-xl border border-border bg-white p-4" aria-label="케어 대상 상세">
    <header className="flex items-center gap-3 border-b border-border pb-4"><Avatar><Avatar.Image src={target.profile_image_url || '/default-avatar.png'} alt="" /><Avatar.Fallback>{target.name.slice(0,1)}</Avatar.Fallback></Avatar><div className="min-w-0 flex-1"><h2 className="mb-1 text-base font-bold">{target.name}</h2><p className="text-xs text-gray-600">{target.university_name} / {target.gender === 'MALE' ? '남' : '여'} / {calculateAge(target.birthday)}세</p>{target.introduction && <p className="mt-1 text-xs text-gray-600">{target.introduction}</p>}</div><Button size="sm" variant="secondary" onPress={onDismiss} isDisabled={dismissLoading}>무시</Button></header>
    <dl className="flex flex-wrap gap-4 rounded-lg bg-gray-50 p-3 text-xs"><div><dt className="font-semibold">연속 실패</dt><dd>{target.consecutive_failure_days}일</dd></div><div><dt className="font-semibold">마지막 실패</dt><dd>{target.last_failure_at ? new Date(target.last_failure_at).toLocaleDateString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}) : '-'}</dd></div>{target.last_failure_reason && <div><dt className="font-semibold">사유</dt><dd>{target.last_failure_reason}</dd></div>}</dl>
    <h3 className="mb-0 text-sm font-semibold">추천 파트너</h3>
    {partnersLoading ? <div className="space-y-2" aria-label="파트너 불러오는 중">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div> : !partners.length ? <p className="text-sm text-gray-600">추천 가능한 파트너가 없습니다</p> : <ul className="space-y-2">{partners.map(partner => <li key={partner.userId} className="flex items-center gap-3 rounded-lg border border-border p-3"><Avatar size="sm"><Avatar.Image src={partner.profileImageUrl || '/default-avatar.png'} alt="" /><Avatar.Fallback>{partner.name.slice(0,1)}</Avatar.Fallback></Avatar><div className="min-w-0 flex-1"><span className="text-sm font-medium">{partner.name}</span><p className="text-xs text-gray-600">{partner.universityName} · {partner.gender === 'MALE' ? '남' : '여'} · {partner.age}세</p></div><Button size="sm" onPress={() => onSelectPartner(partner)} aria-label={`${partner.name} 선택`}>선택</Button></li>)}</ul>}
  </section>;
}
