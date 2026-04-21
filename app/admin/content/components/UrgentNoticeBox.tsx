'use client';

import { Paper, Box, Typography, Button, Chip } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useUrgentNotices, useArchiveNotice } from '@/app/admin/hooks';
import { useToast } from '@/shared/ui/admin/toast/toast-context';

export function UrgentNoticeBox() {
  const router = useRouter();
  const toast = useToast();
  const { data } = useUrgentNotices();
  const archive = useArchiveNotice();

  if (!data || data.length === 0) return null;

  const handleArchive = async (id: string) => {
    try {
      await archive.mutateAsync(id);
      toast.success('긴급 공지를 종료했습니다.');
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || '공지 종료에 실패했습니다.');
    }
  };

  return (
    <Paper
      sx={{
        p: 2,
        mb: 2,
        borderLeft: '4px solid #d32f2f',
        backgroundColor: '#fff4f4',
      }}
    >
      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
        활성 긴급 공지
      </Typography>
      {data.map((n) => {
        const daysLeft = n.expiresAt
          ? Math.ceil((new Date(n.expiresAt).getTime() - Date.now()) / 86400000)
          : null;
        return (
          <Box
            key={n.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              py: 1,
              flexWrap: 'wrap',
            }}
          >
            <Chip label="긴급" size="small" color="error" />
            <Typography sx={{ flex: 1, minWidth: 200 }}>{n.title}</Typography>
            {daysLeft !== null && (
              <Typography variant="caption" color="text.secondary">
                D-{daysLeft}
              </Typography>
            )}
            <Button
              size="small"
              onClick={() => router.push(`/admin/content/notice/edit/${n.id}`)}
            >
              편집
            </Button>
            <Button
              size="small"
              color="error"
              onClick={() => handleArchive(n.id)}
              disabled={archive.isPending}
            >
              종료
            </Button>
          </Box>
        );
      })}
    </Paper>
  );
}
