'use client';

import { useEffect, useState } from 'react';
import { Button, Chip, Spinner } from '@heroui/react';
import { useRouter, useParams } from 'next/navigation';
import AdminService from '@/app/services/admin';
import type { BroadcastSchedule } from '@/app/services/admin';
import { BROADCAST_STATUS_LABEL } from '@/app/services/admin';
import { formatDateTimeKR } from '@/app/utils/formatters';

export default function BroadcastDetailClient() {
  const router = useRouter();
  const params = useParams();
  const id = String(params.id);

  const [schedule, setSchedule] = useState<BroadcastSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [groupName, setGroupName] = useState<string | null>(null);
  const [groupLoading, setGroupLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    AdminService.pushBroadcast
      .getSchedule(id)
      .then((data) => {
        if (!cancelled) setSchedule(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!schedule?.targetGroupId) return;
    let cancelled = false;
    setGroupLoading(true);
    AdminService.pushGroups
      .get(schedule.targetGroupId)
      .then((group) => {
        if (!cancelled) setGroupName(group.name);
      })
      .catch(() => {
        if (!cancelled) setGroupName(null);
      })
      .finally(() => {
        if (!cancelled) setGroupLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [schedule?.targetGroupId]);

  if (loading) return <div className="flex justify-center py-12"><Spinner aria-label="예약 상세 불러오는 중" /></div>;
  if (error || !schedule) return <div className="space-y-4 py-8"><p role="alert">예약 발송 정보를 불러오지 못했습니다.</p><Button variant="secondary" onPress={() => router.push('/admin/broadcast-push')}>목록</Button></div>;

  const targetLabel = !schedule.targetGroupId
    ? '전체 활성유저'
    : groupLoading
      ? '확인중...'
      : (groupName ?? '(그룹 정보를 불러올 수 없음)');

  return (
    <section className="max-w-3xl space-y-6" aria-labelledby="broadcast-detail-heading">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 id="broadcast-detail-heading" className="mb-0 text-2xl font-bold">예약 발송 상세</h1>
        <div className="flex items-center gap-2">
          <Chip color={schedule.status === 'sent' ? 'success' : schedule.status === 'failed' ? 'danger' : 'accent'}>{BROADCAST_STATUS_LABEL[schedule.status]}</Chip>
          <Button variant="secondary" onPress={() => router.push('/admin/broadcast-push')}>목록</Button>
        </div>
      </header>
      <section className="rounded-xl border border-border bg-white p-6">
        <h2 className="mb-4 text-base font-semibold">문구</h2>
        <dl className="space-y-3">
          <Row label="KR 제목" value={schedule.krTitle} /><Row label="KR 본문" value={schedule.krBody} />
          <Row label="JP 제목" value={schedule.jpTitle} /><Row label="JP 본문" value={schedule.jpBody} />
          <Row label="딥링크" value={schedule.deepLink ?? '-'} />
        </dl>
      </section>
      <section className="rounded-xl border border-border bg-white p-6">
        <h2 className="mb-4 text-base font-semibold">발송 정보</h2>
        <dl className="space-y-3">
          <Row label="대상" value={targetLabel} /><Row label="예정시각" value={formatDateTimeKR(schedule.scheduledAt)} />
          <Row label="예상 대상 인원" value={`${schedule.targetPreviewCount.toLocaleString()}명`} />
          <Row label="성공" value={schedule.sentCount} /><Row label="실패" value={schedule.failedCount} />
          <Row label="발송 시각" value={schedule.sentAt ? formatDateTimeKR(schedule.sentAt) : '-'} />
          <Row label="등록자" value={schedule.createdBy ?? '-'} /><Row label="등록일" value={formatDateTimeKR(schedule.createdAt)} />
        </dl>
      </section>
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="grid grid-cols-[minmax(80px,140px)_1fr] gap-4 text-sm"><dt className="text-gray-600">{label}</dt><dd className="break-words whitespace-pre-wrap">{value}</dd></div>;
}
