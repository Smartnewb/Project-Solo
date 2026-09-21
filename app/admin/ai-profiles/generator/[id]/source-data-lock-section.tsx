'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Lock, Unlock } from 'lucide-react';
import { aiProfileGenerator } from '@/app/services/admin/ai-profile-generator';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { useToast } from '@/shared/ui/admin/toast';
import { aiProfileGeneratorKeys } from '../../_shared/query-keys';
import { SourceDataPicker } from '../_shared/source-data-picker';
import { useAiProfileErrorHandler } from '../_shared-error';

interface Props {
  draftId: string;
  version: number;
  sourceDataSnapshot: Record<string, unknown>;
  readOnly?: boolean;
}

function readSnapshot(snapshot: Record<string, unknown>) {
  const university = (snapshot?.university ??
    snapshot?.lockedUniversity ??
    null) as Record<string, unknown> | null;
  const department = (snapshot?.department ??
    snapshot?.lockedDepartment ??
    null) as Record<string, unknown> | null;
  return {
    universityName: (university?.name as string | undefined) ?? null,
    departmentName: (department?.name as string | undefined) ?? null,
    locked: Boolean(
      (snapshot?.locked as boolean | undefined) ??
        (university?.id && department?.id),
    ),
  };
}

export function SourceDataLockSection({
  draftId,
  version,
  sourceDataSnapshot,
  readOnly = false,
}: Props) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const handleError = useAiProfileErrorHandler(
    aiProfileGeneratorKeys.draftDetail(draftId),
  );
  const { universityName, departmentName, locked } = readSnapshot(
    sourceDataSnapshot ?? {},
  );
  const [editing, setEditing] = useState(false);
  const [universityId, setUniversityId] = useState<string | null>(null);
  const [departmentId, setDepartmentId] = useState<string | null>(null);

  const lockMutation = useMutation({
    mutationFn: () => {
      if (!universityId || !departmentId) {
        throw new Error('대학과 학과를 선택하세요.');
      }
      return aiProfileGenerator.lockSourceData(draftId, {
        expectedVersion: version,
        universityId,
        departmentId,
      });
    },
    onSuccess: () => {
      toast.success('소스 데이터가 잠겼습니다.');
      queryClient.invalidateQueries({
        queryKey: aiProfileGeneratorKeys.draftDetail(draftId),
      });
      setEditing(false);
    },
    onError: handleError,
  });

  const clearMutation = useMutation({
    mutationFn: () =>
      aiProfileGenerator.clearSourceDataLock(draftId, {
        expectedVersion: version,
      }),
    onSuccess: () => {
      toast.success('소스 데이터 잠금이 해제되었습니다.');
      queryClient.invalidateQueries({
        queryKey: aiProfileGeneratorKeys.draftDetail(draftId),
      });
    },
    onError: handleError,
  });

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          {locked ? (
            <Lock className="h-4 w-4 text-amber-600" />
          ) : (
            <Unlock className="h-4 w-4 text-slate-400" />
          )}
          소스 데이터 잠금
        </CardTitle>
        {!readOnly ? (
          <div className="flex gap-2">
            {locked ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => clearMutation.mutate()}
                disabled={clearMutation.isPending}
              >
                {clearMutation.isPending ? '해제 중…' : '해제'}
              </Button>
            ) : null}
            <Button
              size="sm"
              variant={editing ? 'ghost' : 'outline'}
              onClick={() => setEditing((v) => !v)}
            >
              {editing ? '취소' : locked ? '변경' : '잠금 설정'}
            </Button>
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {locked ? (
          <p className="text-sm text-slate-700">
            대학: <strong>{universityName ?? '(알 수 없음)'}</strong> · 학과:{' '}
            <strong>{departmentName ?? '(알 수 없음)'}</strong>
          </p>
        ) : (
          <p className="text-xs text-slate-500">
            대학·학과가 잠금 설정되지 않았습니다. 생성 시 정책에 따라 자동
            선택됩니다.
          </p>
        )}
        {editing ? (
          <div className="space-y-3 rounded-md border border-slate-200 p-3">
            <SourceDataPicker
              universityId={universityId}
              departmentId={departmentId}
              onChange={(u, d) => {
                setUniversityId(u);
                setDepartmentId(d);
              }}
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={() => lockMutation.mutate()}
                disabled={
                  lockMutation.isPending || !universityId || !departmentId
                }
              >
                {lockMutation.isPending ? '잠금 중…' : '잠금'}
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
