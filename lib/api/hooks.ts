import { useState, useEffect, useCallback } from 'react';
import { userApiClient, adminApiClient } from './client';
import { AxiosRequestConfig, AxiosError } from 'axios';

// API 요청 상태 타입
export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

// API 요청 훅 옵션
export interface UseApiOptions<T> {
  initialData?: T | null;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  manual?: boolean; // true면 자동으로 요청하지 않음
}

// GET 요청 훅
export function useApiGet<T = any>(
  url: string,
  config?: AxiosRequestConfig,
  options: UseApiOptions<T> = {}
): [ApiState<T>, () => Promise<void>] {
  const [state, setState] = useState<ApiState<T>>({
    data: options.initialData || null,
    loading: !options.manual,
    error: null
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await userApiClient.get<T>(url, config);
      setState({ data, loading: false, error: null });
      options.onSuccess?.(data);
    } catch (error) {
      const apiError = error instanceof Error ? error : new Error('Unknown error');
      setState({ data: null, loading: false, error: apiError });
      options.onError?.(apiError);
    }
  }, [url, JSON.stringify(config)]);

  useEffect(() => {
    if (!options.manual) {
      fetchData();
    }
  }, [fetchData, options.manual]);

  return [state, fetchData];
}

// 관리자용 GET 요청 훅
export function useAdminApiGet<T = any>(
  url: string,
  config?: AxiosRequestConfig,
  options: UseApiOptions<T> = {}
): [ApiState<T>, () => Promise<void>] {
  const [state, setState] = useState<ApiState<T>>({
    data: options.initialData || null,
    loading: !options.manual,
    error: null
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await adminApiClient.get<T>(url, config);
      setState({ data, loading: false, error: null });
      options.onSuccess?.(data);
    } catch (error) {
      const apiError = error instanceof Error ? error : new Error('Unknown error');
      setState({ data: null, loading: false, error: apiError });
      options.onError?.(apiError);
    }
  }, [url, JSON.stringify(config)]);

  useEffect(() => {
    if (!options.manual) {
      fetchData();
    }
  }, [fetchData, options.manual]);

  return [state, fetchData];
}

// POST 요청 훅
export function useApiPost<T = any, D = any>(): [
  ApiState<T>,
  (url: string, data?: D, config?: AxiosRequestConfig) => Promise<T | null>
] {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const postData = useCallback(async (url: string, data?: D, config?: AxiosRequestConfig) => {
    setState({ data: null, loading: true, error: null });
    
    try {
      const responseData = await userApiClient.post<T>(url, data, config);
      setState({ data: responseData, loading: false, error: null });
      return responseData;
    } catch (error) {
      const apiError = error instanceof Error ? error : new Error('Unknown error');
      setState({ data: null, loading: false, error: apiError });
      return null;
    }
  }, []);

  return [state, postData];
}

// 관리자용 POST 요청 훅
export function useAdminApiPost<T = any, D = any>(): [
  ApiState<T>,
  (url: string, data?: D, config?: AxiosRequestConfig) => Promise<T | null>
] {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const postData = useCallback(async (url: string, data?: D, config?: AxiosRequestConfig) => {
    setState({ data: null, loading: true, error: null });
    
    try {
      const responseData = await adminApiClient.post<T>(url, data, config);
      setState({ data: responseData, loading: false, error: null });
      return responseData;
    } catch (error) {
      const apiError = error instanceof Error ? error : new Error('Unknown error');
      setState({ data: null, loading: false, error: apiError });
      return null;
    }
  }, []);

  return [state, postData];
}

// PATCH 요청 훅
export function useApiPatch<T = any, D = any>(): [
  ApiState<T>,
  (url: string, data?: D, config?: AxiosRequestConfig) => Promise<T | null>
] {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const patchData = useCallback(async (url: string, data?: D, config?: AxiosRequestConfig) => {
    setState({ data: null, loading: true, error: null });
    
    try {
      const responseData = await userApiClient.patch<T>(url, data, config);
      setState({ data: responseData, loading: false, error: null });
      return responseData;
    } catch (error) {
      const apiError = error instanceof Error ? error : new Error('Unknown error');
      setState({ data: null, loading: false, error: apiError });
      return null;
    }
  }, []);

  return [state, patchData];
}

// 관리자용 PATCH 요청 훅
export function useAdminApiPatch<T = any, D = any>(): [
  ApiState<T>,
  (url: string, data?: D, config?: AxiosRequestConfig) => Promise<T | null>
] {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const patchData = useCallback(async (url: string, data?: D, config?: AxiosRequestConfig) => {
    setState({ data: null, loading: true, error: null });
    
    try {
      const responseData = await adminApiClient.patch<T>(url, data, config);
      setState({ data: responseData, loading: false, error: null });
      return responseData;
    } catch (error) {
      const apiError = error instanceof Error ? error : new Error('Unknown error');
      setState({ data: null, loading: false, error: apiError });
      return null;
    }
  }, []);

  return [state, patchData];
}

// DELETE 요청 훅
export function useApiDelete<T = any>(): [
  ApiState<T>,
  (url: string, config?: AxiosRequestConfig) => Promise<T | null>
] {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const deleteData = useCallback(async (url: string, config?: AxiosRequestConfig) => {
    setState({ data: null, loading: true, error: null });
    
    try {
      const responseData = await userApiClient.delete<T>(url, config);
      setState({ data: responseData, loading: false, error: null });
      return responseData;
    } catch (error) {
      const apiError = error instanceof Error ? error : new Error('Unknown error');
      setState({ data: null, loading: false, error: apiError });
      return null;
    }
  }, []);

  return [state, deleteData];
}

// 관리자용 DELETE 요청 훅
export function useAdminApiDelete<T = any>(): [
  ApiState<T>,
  (url: string, config?: AxiosRequestConfig) => Promise<T | null>
] {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const deleteData = useCallback(async (url: string, config?: AxiosRequestConfig) => {
    setState({ data: null, loading: true, error: null });
    
    try {
      const responseData = await adminApiClient.delete<T>(url, config);
      setState({ data: responseData, loading: false, error: null });
      return responseData;
    } catch (error) {
      const apiError = error instanceof Error ? error : new Error('Unknown error');
      setState({ data: null, loading: false, error: apiError });
      return null;
    }
  }, []);

  return [state, deleteData];
}
