'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
  Chip,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { useRouter, useParams } from 'next/navigation';
import AdminService from '@/app/services/admin';
import type {
  PushTargetGroup,
  GroupMembers,
  GroupPreview,
  Gender,
} from '@/app/services/admin';
import {
  GROUP_TYPE_LABEL,
  COUNTRY_SCOPE_LABEL,
  countriesForScope,
} from '@/app/services/admin';
import { useToast } from '@/shared/ui/admin/toast';
import { safeToLocaleDateString, maskPhoneNumber } from '@/app/utils/formatters';

const GENDER_LABEL: Record<Gender, string> = {
  MALE: '남',
  FEMALE: '여',
};

export default function GroupDetailClient() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const id = String(params.id);

  const [group, setGroup] = useState<PushTargetGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [members, setMembers] = useState<GroupMembers | null>(null);
  const [membersLoading, setMembersLoading] = useState(false);

  const [preview, setPreview] = useState<GroupPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setMembersLoading(true);

    // ponytail: fire group + members concurrently instead of waterfalling;
    // members() is safe to call unconditionally, backend returns {kr:[],jp:[]} for dynamic groups
    AdminService.pushGroups
      .get(id)
      .then((data) => {
        if (!cancelled) setGroup(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    AdminService.pushGroups
      .members(id)
      .then((data) => {
        if (!cancelled) setMembers(data);
      })
      .catch(() => {
        if (!cancelled) toast.error('그룹 유저 목록을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!cancelled) setMembersLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handlePreview = async () => {
    setPreviewLoading(true);
    try {
      const result = await AdminService.pushGroups.preview(id);
      setPreview(result);
    } catch (error) {
      toast.error('대상자 수를 확인하지 못했습니다.');
    } finally {
      setPreviewLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !group) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography color="error">그룹 정보를 불러오지 못했습니다.</Typography>
        <Button sx={{ mt: 2 }} onClick={() => router.push('/admin/push-groups')}>
          목록으로
        </Button>
      </Box>
    );
  }

  const countries = countriesForScope(group.countryScope);
  const showKr = countries.includes('kr');
  const showJp = countries.includes('jp');

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Typography variant="h5" fontWeight="bold">
          {group.name}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => router.push('/admin/push-groups')}>
            목록
          </Button>
          <Button
            variant="outlined"
            onClick={() => router.push(`/admin/push-groups/${id}/edit`)}
          >
            수정
          </Button>
          <Button
            variant="contained"
            onClick={() => router.push(`/admin/broadcast-push/new?groupId=${id}`)}
          >
            이 그룹으로 예약발송
          </Button>
        </Stack>
      </Box>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
          기본정보
        </Typography>
        <Stack spacing={1.5}>
          <Row label="그룹명" value={group.name} />
          <Row label="설명" value={group.description ?? '-'} />
          <Row label="국가스코프" value={COUNTRY_SCOPE_LABEL[group.countryScope]} />
          <Row label="타입" value={<Chip size="small" label={GROUP_TYPE_LABEL[group.type]} />} />
          <Row label="생성일" value={safeToLocaleDateString(group.createdAt)} />
          <Row label="생성자" value={group.createdBy ?? '-'} />
        </Stack>
      </Paper>

      {group.type === 'static' ? (
        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
            담긴 유저
          </Typography>
          {membersLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <Stack spacing={3}>
              {showKr && (
                <MemberList
                  title="KR"
                  members={members?.kr ?? []}
                />
              )}
              {showJp && (
                <MemberList
                  title="JP"
                  members={members?.jp ?? []}
                />
              )}
            </Stack>
          )}
        </Paper>
      ) : (
        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
            필터 조건
          </Typography>
          <Stack spacing={1.5}>
            <Row
              label="성별"
              value={
                group.filterCriteria?.gender ? GENDER_LABEL[group.filterCriteria.gender] : '전체'
              }
            />
            <Row
              label="가입일 범위"
              value={
                group.filterCriteria?.signupDateFrom || group.filterCriteria?.signupDateTo
                  ? `${safeToLocaleDateString(group.filterCriteria?.signupDateFrom)} ~ ${safeToLocaleDateString(group.filterCriteria?.signupDateTo)}`
                  : '제한없음'
              }
            />
          </Stack>
        </Paper>
      )}

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
          대상자 수 확인
        </Typography>
        <Button variant="outlined" onClick={handlePreview} disabled={previewLoading}>
          {previewLoading ? <CircularProgress size={18} /> : '대상자 수 확인'}
        </Button>
        {preview && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2">KR: {preview.kr.toLocaleString()}명</Typography>
            <Typography variant="body2">JP: {preview.jp.toLocaleString()}명</Typography>
            <Typography variant="body2" fontWeight={700}>
              합계: {preview.total.toLocaleString()}명
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', gap: 2 }}>
      <Typography variant="body2" color="text.secondary" sx={{ width: 120, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Box>
  );
}

function MemberList({
  title,
  members,
}: {
  title: string;
  members: { id: string; name: string; phoneNumber: string | null }[];
}) {
  return (
    <Box>
      <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
        {title} ({members.length}명)
      </Typography>
      {members.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          대상 유저가 없습니다.
        </Typography>
      ) : (
        <Paper variant="outlined">
          <List dense disablePadding>
            {members.map((member, index) => (
              <Box key={member.id}>
                {index > 0 && <Divider />}
                <ListItem>
                  <ListItemText
                    primary={member.name}
                    secondary={maskPhoneNumber(member.phoneNumber)}
                  />
                </ListItem>
              </Box>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
}
