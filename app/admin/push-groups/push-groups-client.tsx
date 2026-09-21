'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  Stack,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import AdminService from '@/app/services/admin';
import type { PushTargetGroup } from '@/app/services/admin';
import { GROUP_TYPE_LABEL, GROUP_TYPE_COLOR, COUNTRY_SCOPE_LABEL } from '@/app/services/admin';
import { useToast } from '@/shared/ui/admin/toast';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog/confirm-dialog-context';
import { safeToLocaleDateString } from '@/app/utils/formatters';

interface PreviewState {
  loading: boolean;
  total?: number;
}

export default function PushGroupsClient() {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();

  const [groups, setGroups] = useState<PushTargetGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [previewByGroup, setPreviewByGroup] = useState<Record<string, PreviewState>>({});

  const loadGroups = async () => {
    setLoading(true);
    try {
      const data = await AdminService.pushGroups.list();
      setGroups(data);
    } catch (error) {
      toast.error('그룹 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groups;
    return groups.filter((group) => group.name.includes(search.trim()));
  }, [groups, search]);

  const handlePreview = async (id: string) => {
    setPreviewByGroup((prev) => ({ ...prev, [id]: { loading: true } }));
    try {
      const result = await AdminService.pushGroups.preview(id);
      setPreviewByGroup((prev) => ({ ...prev, [id]: { loading: false, total: result.total } }));
    } catch (error) {
      setPreviewByGroup((prev) => ({ ...prev, [id]: { loading: false } }));
      toast.error('대상자 수를 확인하지 못했습니다.');
    }
  };

  const handleDelete = async (group: PushTargetGroup) => {
    const ok = await confirm({
      title: '그룹 삭제',
      message: `'${group.name}' 그룹을 삭제하시겠습니까?`,
      confirmText: '삭제',
      cancelText: '취소',
    });
    if (!ok) return;

    try {
      await AdminService.pushGroups.remove(group.id);
      toast.success('그룹을 삭제했습니다.');
      loadGroups();
    } catch (error) {
      toast.error('그룹 삭제에 실패했습니다.');
    }
  };

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
          푸시 타겟 그룹
        </Typography>
        <Button variant="contained" onClick={() => router.push('/admin/push-groups/new')}>
          새 그룹 생성
        </Button>
      </Box>

      <TextField
        size="small"
        placeholder="그룹명으로 검색"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2, width: 320 }}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>그룹명</TableCell>
                <TableCell>타입</TableCell>
                <TableCell>국가스코프</TableCell>
                <TableCell>대상자수</TableCell>
                <TableCell>생성일</TableCell>
                <TableCell>생성자</TableCell>
                <TableCell align="right">액션</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredGroups.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary" py={2}>
                      조건에 맞는 그룹이 없습니다.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {filteredGroups.map((group) => {
                const preview = previewByGroup[group.id];
                return (
                  <TableRow key={group.id}>
                    <TableCell>{group.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={GROUP_TYPE_LABEL[group.type]}
                        color={GROUP_TYPE_COLOR[group.type]}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{COUNTRY_SCOPE_LABEL[group.countryScope]}</TableCell>
                    <TableCell>
                      {preview?.loading ? (
                        <CircularProgress size={16} />
                      ) : preview?.total !== undefined ? (
                        <Typography variant="body2">{preview.total.toLocaleString()}명</Typography>
                      ) : (
                        <Button size="small" variant="text" onClick={() => handlePreview(group.id)}>
                          확인
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>{safeToLocaleDateString(group.createdAt)}</TableCell>
                    <TableCell>{group.createdBy ?? '-'}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => router.push(`/admin/push-groups/${group.id}`)}
                        >
                          상세
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => router.push(`/admin/push-groups/${group.id}/edit`)}
                        >
                          수정
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() =>
                            router.push(`/admin/broadcast-push/new?groupId=${group.id}`)
                          }
                        >
                          발송
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleDelete(group)}
                        >
                          삭제
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
