'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Chip, Spinner } from '@heroui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminService from '@/app/services/admin';
import type { PushTargetGroup, BroadcastSchedule } from '@/app/services/admin';
import { BROADCAST_STATUS_LABEL } from '@/app/services/admin';
import { useToast } from '@/shared/ui/admin/toast';
import { formatDateTimeKR } from '@/app/utils/formatters';

export default function BroadcastHistoryClient() {
  const router = useRouter();
  const toast = useToast();

  const [schedules, setSchedules] = useState<BroadcastSchedule[]>([]);
  const [groups, setGroups] = useState<PushTargetGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([AdminService.pushBroadcast.listSchedules(), AdminService.pushGroups.list()])
      .then(([scheduleData, groupData]) => {
        if (cancelled) return;
        setSchedules(scheduleData);
        setGroups(groupData);
      })
      .catch(() => {
        if (!cancelled) toast.error('예약/발송 이력을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const groupNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const group of groups) map[group.id] = group.name;
    return map;
  }, [groups]);

  const targetLabel = (schedule: BroadcastSchedule): string => {
    if (!schedule.targetGroupId) return '전체 활성유저';
    return groupNameById[schedule.targetGroupId] ?? '(알 수 없는 그룹)';
  };

  return (
    <section aria-labelledby="broadcast-history-heading">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 id="broadcast-history-heading" className="mb-0 text-2xl font-bold">예약/발송 이력</h1>
        <Button onPress={() => router.push('/admin/broadcast-push/new')}>새 예약 발송</Button>
      </header>
      {loading ? (
        <div className="flex justify-center py-8"><Spinner aria-label="발송 이력 불러오는 중" /></div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-white">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">예약 푸시 발송 이력</caption>
            <thead className="bg-gray-50"><tr>{['제목', '대상', '예정시각', '상태', '성공/실패'].map(label => <th key={label} scope="col" className="px-4 py-3 font-semibold">{label}</th>)}</tr></thead>
            <tbody>
              {schedules.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-gray-600">등록된 예약/발송 이력이 없습니다.</td></tr>}
              {schedules.map(schedule => (
                <tr key={schedule.id} className="border-t border-border hover:bg-gray-50">
                  <td className="px-4 py-3"><Link href={`/admin/broadcast-push/${schedule.id}`} className="font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4">{schedule.krTitle}</Link></td>
                  <td className="px-4 py-3">{targetLabel(schedule)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatDateTimeKR(schedule.scheduledAt)}</td>
                  <td className="px-4 py-3"><Chip size="sm" color={schedule.status === 'sent' ? 'success' : schedule.status === 'failed' ? 'danger' : 'accent'}>{BROADCAST_STATUS_LABEL[schedule.status]}</Chip></td>
                  <td className="px-4 py-3">{schedule.sentCount}/{schedule.failedCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
