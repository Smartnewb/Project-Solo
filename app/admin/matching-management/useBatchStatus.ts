import { useState, useCallback, useEffect } from 'react';
import axiosServer from '@/utils/axios';

export function useBatchStatus() {
  const [status, setStatus] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.group('batch-status-test')
  
  
  console.groupEnd()

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosServer.get<boolean | null>('/admin/v2/matching/batch-status');
      setStatus(res.data);
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
      await axiosServer.post('/admin/v2/matching/batch-status', { status: !status });
      await fetchStatus();
    } catch (e: any) {
      setError(e.message || '상태 변경 실패');
    } finally {
      setLoading(false);
    }
  }, [status, fetchStatus]);

  return { status, loading, error, fetchStatus, toggleStatus };
} 