'use client';

import { useQuery } from '@tanstack/react-query';
import { adminGet } from '@/shared/lib/http/admin-fetch';

interface AdminUserResponse {
  data: {
    name?: string | null;
  };
}

export function AdminNameLabel({ adminId }: { adminId: string | null | undefined }) {
  const { data } = useQuery({
    queryKey: ['admin-user-name', adminId],
    queryFn: async () => {
      if (!adminId) return null;
      try {
        const res = await adminGet<AdminUserResponse>(`/admin/v2/users/${adminId}`);
        return res.data?.name ?? adminId;
      } catch {
        return adminId;
      }
    },
    enabled: !!adminId,
    staleTime: 10 * 60 * 1000,
  });

  if (!adminId) return <span className="text-gray-400">-</span>;
  return <span>{data ?? '...'}</span>;
}
