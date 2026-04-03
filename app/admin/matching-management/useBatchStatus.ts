import { useState, useCallback, useEffect } from 'react';
import { adminGet, adminPost } from '@/shared/lib/http/admin-fetch';

export function useBatchStatus() {
  const [status, setStatus] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminGet<boolean | null>('/admin/v2/matching/batch-status');
      setStatus(data);
    } catch (e: any) {
      setError(e.message || '상태 조회 실패');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const toggleStatus = useCallback(async () => {
    if (status === null) return;
    setLoading(true);
    setError(null);
    try {
      await adminPost('/admin/v2/matching/batch-status', { status: !status });
      await fetchStatus();
    } catch (e: any) {
      setError(e.message || '상태 변경 실패');
    } finally {
      setLoading(false);
    }
  }, [status, fetchStatus]);

  return { status, loading, error, fetchStatus, toggleStatus };
}
