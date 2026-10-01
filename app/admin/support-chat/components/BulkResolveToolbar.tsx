'use client';

import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import supportChatService from '@/app/services/support-chat';
import type { SupportSessionSummary } from '@/app/types/support-chat';

export function useSessionSelection(sessions: SupportSessionSummary[], scope: string) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  useEffect(() => { setSelectedIds([]); }, [scope]);
  const selected = sessions.filter((session) => selectedIds.includes(session.sessionId));
  const toggle = (id: string) => setSelectedIds((previous) =>
    previous.includes(id) ? previous.filter((value) => value !== id) : [...previous, id]
  );
  return { selected, toggle, setSelectedIds };
}

interface BulkResolveToolbarProps {
  selected: SupportSessionSummary[];
  setSelectedIds: (ids: string[]) => void;
  onSessionUpdated: () => void;
  scope: string;
}

export default function BulkResolveToolbar({ selected, setSelectedIds, onSessionUpdated, scope }: BulkResolveToolbarProps) {
  const [targets, setTargets] = useState<SupportSessionSummary[] | null>(null);
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const [result, setResult] = useState<{ failed: number; completed: number } | null>(null);

  useEffect(() => { setTargets(null); setResult(null); }, [scope]);

  const resolveSelected = async () => {
    if (!targets?.length || pendingRef.current) return;
    // Freeze the explicitly confirmed IDs. A refresh or checkbox change cannot add targets.
    const confirmed = targets;
    pendingRef.current = true;
    setPending(true);
    const results = await Promise.allSettled(confirmed.map(async (session) => {
      const response = await supportChatService.resolveSession(session.sessionId, { resolutionReason: 'solved' });
      if (!response.success) throw new Error('해결 완료 처리에 실패했습니다.');
    }));
    const failed = confirmed.filter((_, index) => results[index].status === 'rejected');
    setSelectedIds(failed.map((session) => session.sessionId));
    setResult({ completed: confirmed.length - failed.length, failed: failed.length });
    setTargets(null);
    pendingRef.current = false;
    setPending(false);
    onSessionUpdated();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
        <Button size="small" variant="contained" disabled={!selected.length || pending}
          onClick={() => { setTargets([...selected]); setResult(null); }}>
          {pending ? '처리 중…' : `선택 ${selected.length}건 해결 완료`}
        </Button>
        <Button size="small" disabled={!selected.length || pending} onClick={() => setSelectedIds([])}>선택 해제</Button>
      </Box>
      {result && <Alert severity={result.failed ? 'warning' : 'success'} onClose={() => setResult(null)}>
        {result.completed}건 완료{result.failed ? `, ${result.failed}건 실패. 실패한 상담만 선택 상태로 남겼습니다. 상태를 확인한 후 다시 처리해주세요.` : '. 선택한 상담을 해결 완료했습니다.'}
      </Alert>}
      <Dialog open={targets !== null} onClose={() => { if (!pending) setTargets(null); }} fullWidth maxWidth="xs">
        <DialogTitle>선택한 {targets?.length ?? 0}건을 해결 완료할까요?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>아래 상담만 완료합니다. 추가 답변 메시지는 보내지 않습니다.</Typography>
          <Box component="ul" sx={{ pl: 3, m: 0 }}>
            {targets?.map((session) => <li key={session.sessionId}>{session.userNickname || session.userId}</li>)}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button disabled={pending} onClick={() => setTargets(null)}>취소</Button>
          <Button variant="contained" disabled={pending} onClick={resolveSelected}>{pending ? '처리 중…' : '해결 완료'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
