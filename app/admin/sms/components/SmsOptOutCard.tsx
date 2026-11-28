'use client';
import { Button, Input, Label, Spinner, TextField } from '@heroui/react';
import { useState } from 'react';
import { addManualSmsOptOut, type UserSearchItem } from '@/app/services/sms';
import { useToast } from '@/shared/ui/admin/toast';
import { useUserSearch } from '../hooks/useUserSearch';

export function SmsOptOutCard() {
    const [query, setQuery] = useState('');
    const [reason, setReason] = useState('CS 수신거부 요청');
    const [pendingId, setPendingId] = useState<string | null>(null);
    const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
    const { data, isLoading, isError } = useUserSearch(query);
    const toast = useToast();

    const register = async (item: UserSearchItem) => {
        const label = item.name ?? item.phoneNumber ?? item.id;
        if (!reason.trim()) {
            toast.warning('사유를 입력하세요.');
            return;
        }
        if (!window.confirm(`${label} 님의 문자 수신을 막을까요? 알림 문자도 더는 나가지 않아요.`)) return;
        setPendingId(item.id);
        try {
            await addManualSmsOptOut(item.id, reason.trim());
            setDoneIds((prev) => new Set(prev).add(item.id));
            toast.success(`${label} 님을 수신거부로 등록했어요.`);
        } catch (e: any) {
            toast.error(e?.message ?? '수신거부 등록 실패');
        } finally {
            setPendingId(null);
        }
    };

    const trimmed = query.trim();
    const rows = data?.data ?? [];

    return (<section className='border border-[#D1D5DB] bg-white rounded-lg p-4 mt-6'>
      <p className='text-sm font-bold text-[#111827]'>문자 수신거부 등록</p>
      <p className='text-xs text-gray-600 mt-1 mb-3'>등록하면 광고·알림 문자가 모두 나가지 않아요.</p>
      <TextField className='mb-3'><Label>{'이름 또는 휴대폰 검색'}</Label><Input value={query} onChange={(e) => setQuery(e.target.value)}></Input></TextField>
      <TextField className='mb-3'><Label>{'사유'}</Label><Input value={reason} onChange={(e) => setReason(e.target.value)}></Input></TextField>
      {trimmed.length < 2 ? (<p className='text-xs text-gray-600'>이름 또는 휴대폰 2자 이상 입력하세요</p>) : isLoading ? (<Spinner size='sm'></Spinner>) : isError ? (<p className='text-xs'>검색 중 오류가 발생했습니다</p>) : rows.length === 0 ? (<p className='text-xs'>검색 결과 없음</p>) : (<ul className='divide-y'>
          {rows.map((item) => (<li key={item.id} className='flex items-center justify-between gap-2 py-2 text-sm'>
              <span>{item.name ?? '-'} · {item.phoneNumber ?? '번호 없음'}</span>
              {doneIds.has(item.id) ? (<span className='text-xs text-gray-600'>등록됨</span>) : (<Button size='sm' variant='secondary' isDisabled={!item.phoneNumber || pendingId !== null} onPress={() => register(item)}>
                  수신거부 등록
                </Button>)}
            </li>))}
        </ul>)}
    </section>);
}
