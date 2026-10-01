'use client';

import { Avatar, Button, Chip, Input, Label, Pagination, Skeleton, TextField } from '@heroui/react';
import type { CareTarget } from '@/app/services/admin/care';
import { calculateAge } from '@/app/utils/formatters';

interface CareTargetListProps {
	targets: CareTarget[];
	selectedTarget: CareTarget | null;
	onSelect: (target: CareTarget) => void;
	loading: boolean;
	searchTerm: string;
	onSearchChange: (term: string) => void;
	pagination: { page: number; limit: number; total: number };
	onPageChange: (page: number) => void;
}

export default function CareTargetList({ targets, selectedTarget, onSelect, loading, searchTerm, onSearchChange, pagination, onPageChange }: CareTargetListProps) {
  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));
  const first = Math.max(1, Math.min(pagination.page - 2, totalPages - 4));
  const pages = [...new Set([1, ...Array.from({length: Math.min(5,totalPages)}, (_,i) => first+i), totalPages])];
  return <section aria-label="케어 대상" className="space-y-3">
    <TextField value={searchTerm} onChange={onSearchChange}><Label>케어 대상 검색</Label><Input placeholder="이름 또는 유저 ID 검색..." /></TextField>
    {loading ? <div className="space-y-2" aria-label="대상 불러오는 중">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div> : !targets.length ? <p className="py-8 text-center text-sm text-gray-600">{searchTerm ? '검색 결과가 없습니다' : '현재 케어가 필요한 유저가 없습니다'}</p> : <ul className="space-y-2">{targets.map(target => <li key={target.id}><Button variant="secondary" aria-pressed={selectedTarget?.id === target.id} fullWidth onPress={() => onSelect(target)} className={`h-auto flex-col items-stretch gap-2 border p-3 text-left ${selectedTarget?.id === target.id ? 'border-[#7A4AE2] ring-1 ring-[#7A4AE2]' : 'border-border'}`}>
      <span className="flex items-center gap-2"><Avatar size="sm"><Avatar.Image src={target.profile_image_url || '/default-avatar.png'} alt="" /><Avatar.Fallback>{target.name.slice(0,1)}</Avatar.Fallback></Avatar><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{target.name}</span><span className="block text-xs text-gray-600">{target.university_name} / {target.gender === 'MALE' ? '남' : '여'} / {calculateAge(target.birthday)}세</span></span><Chip size="sm" color={target.consecutive_failure_days >= 7 ? 'danger' : target.consecutive_failure_days >= 5 ? 'warning' : 'default'}>{target.consecutive_failure_days}일 실패</Chip></span>
      <span className="text-xs text-gray-600">마지막 실패: {target.last_failure_at ? new Date(target.last_failure_at).toLocaleDateString('ko-KR', {month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}) : '-'}{target.last_failure_reason && ` · 사유: ${target.last_failure_reason}`}</span>
    </Button></li>)}</ul>}
    {!loading && totalPages > 1 && <Pagination size="sm" aria-label="케어 대상 페이지"><Pagination.Content><Pagination.Item><Pagination.Previous isDisabled={pagination.page <= 1} onPress={() => onPageChange(pagination.page - 1)} aria-label="이전 페이지"><Pagination.PreviousIcon /></Pagination.Previous></Pagination.Item>{pages.map(page => <Pagination.Item key={page}><Pagination.Link isActive={page === pagination.page} onPress={() => onPageChange(page)} aria-label={`${page}페이지`}>{page}</Pagination.Link></Pagination.Item>)}<Pagination.Item><Pagination.Next isDisabled={pagination.page >= totalPages} onPress={() => onPageChange(pagination.page + 1)} aria-label="다음 페이지"><Pagination.NextIcon /></Pagination.Next></Pagination.Item></Pagination.Content></Pagination>}
  </section>;
}
