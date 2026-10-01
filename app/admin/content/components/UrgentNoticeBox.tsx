'use client';
import { Button, Chip } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useUrgentNotices, useArchiveNotice } from '@/app/admin/hooks';
import { useToast } from '@/shared/ui/admin/toast/toast-context';
import { getApiErrorMessage } from '@/app/utils/errors';
export function UrgentNoticeBox() {
    const router = useRouter();
    const toast = useToast();
    const { data } = useUrgentNotices();
    const archive = useArchiveNotice();
    if (!data || data.length === 0)
        return null;
    const handleArchive = async (id: string) => {
        try {
            await archive.mutateAsync(id);
            toast.success('긴급 공지를 종료했습니다.');
        }
        catch (err: unknown) {
            toast.error(getApiErrorMessage(err, '공지 종료에 실패했습니다.'));
        }
    };
    return (<section style={{ padding: 16, marginBottom: 16, backgroundColor: '#fff4f4' }} className="rounded-xl border bg-white p-4">
      <p style={{ marginBottom: 8 }}>
        활성 긴급 공지
      </p>
      {data.map((n) => {
            const daysLeft = n.expiresAt
                ? Math.ceil((new Date(n.expiresAt).getTime() - Date.now()) / 86400000)
                : null;
            return (<div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBlock: 8, flexWrap: 'wrap' }}>
            <Chip color="danger">긴급</Chip>
            <p style={{ flex: 1, minWidth: 200 }}>{n.title}</p>
            {daysLeft !== null && (<p>
                D-{daysLeft}
              </p>)}
            <Button onPress={() => router.push(`/admin/content/notice/edit/${n.id}`)} variant="tertiary">
              편집
            </Button>
            <Button onPress={() => handleArchive(n.id)} isDisabled={archive.isPending} variant="tertiary">
              종료
            </Button>
          </div>);
        })}
    </section>);
}
