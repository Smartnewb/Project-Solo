'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
  AdminApiError,
  getAdminErrorMessage,
} from '@/shared/lib/http/admin-fetch';
import { useToast } from '@/shared/ui/admin/toast';
import { aiProfileGeneratorKeys } from '../../_shared/query-keys';

export function useDraftErrorHandler(draftId: string) {
  const toast = useToast();
  const queryClient = useQueryClient();
  return (error: unknown) => {
    if (error instanceof AdminApiError && error.status === 409) {
      toast.error(
        '다른 변경이 먼저 저장되었습니다. 최신 상태를 불러왔습니다.',
      );
      queryClient.invalidateQueries({
        queryKey: aiProfileGeneratorKeys.draftDetail(draftId),
      });
      return;
    }
    toast.error(getAdminErrorMessage(error));
  };
}
