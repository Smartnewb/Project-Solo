'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
  AdminApiError,
  getAdminErrorMessage,
} from '@/shared/lib/http/admin-fetch';
import { useToast } from '@/shared/ui/admin/toast';

type InvalidationTarget = readonly unknown[];

export function useAiProfileErrorHandler(
  invalidateOnConflict?: InvalidationTarget,
) {
  const toast = useToast();
  const qc = useQueryClient();
  return (error: unknown) => {
    if (error instanceof AdminApiError && error.status === 409) {
      toast.error('다른 변경이 먼저 저장되었습니다. 최신 상태를 불러왔습니다.');
      if (invalidateOnConflict) {
        qc.invalidateQueries({ queryKey: invalidateOnConflict });
      }
      return;
    }
    toast.error(getAdminErrorMessage(error));
  };
}
