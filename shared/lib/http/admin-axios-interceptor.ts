import axiosServer, { axiosMultipart, axiosNextGen } from '@/utils/axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

/**
 * Patches an axios instance to route requests through the BFF proxy.
 *
 * PROBLEM: Legacy admin pages use axios with baseURL = NEXT_PUBLIC_API_URL
 * which hits the backend directly. This bypasses the BFF and httpOnly cookies.
 *
 * SOLUTION: When inside AdminShell, add request interceptors that:
 * 1. Rewrite baseURL to /api/admin-proxy (BFF proxy)
 * 2. Remove Authorization header (BFF reads token from httpOnly cookie)
 * 3. Remove x-country header (BFF reads country from session cookie)
 *
 * The BFF proxy preserves the full path, so:
 *   axiosServer.get('/admin/users') → /api/admin-proxy/admin/users → BACKEND_URL/admin/users
 *
 * Returns an unpatch function to call on component unmount.
 */
function patchInstance(instance: AxiosInstance): () => void {
  const requestId = instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Rewrite to go through BFF proxy
      config.baseURL = '/api/admin-proxy';
      // BFF handles auth via httpOnly cookie — remove client-side token
      delete config.headers.Authorization;
      // BFF handles country via session cookie — remove client-side header
      delete config.headers['x-country'];
      return config;
    }
  );

  // Override 401 response interceptor: refresh through BFF instead of direct backend
  const responseId = instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401 && !error.config?._bffRetry) {
        error.config._bffRetry = true;

        try {
          // Refresh through BFF — updates httpOnly cookie
          const refreshRes = await fetch('/api/admin/auth/refresh', { method: 'POST' });

          if (refreshRes.ok) {
            const data = await refreshRes.json();
            // Update localStorage for legacy compatibility
            if (data.accessToken) {
              localStorage.setItem('accessToken', data.accessToken);
            }
            // Retry original request (will go through BFF proxy with new cookie)
            return instance(error.config);
          }
        } catch {
          // Refresh failed
        }

        // Refresh failed — redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('user');
        window.location.href = '/';
      }
      return Promise.reject(error);
    }
  );

  return () => {
    instance.interceptors.request.eject(requestId);
    instance.interceptors.response.eject(responseId);
  };
}

/**
 * Patch all admin axios instances to route through BFF.
 * Call in LegacyPageAdapter useEffect, cleanup on unmount.
 */
export function patchAdminAxios(): () => void {
  const unpatchServer = patchInstance(axiosServer);
  const unpatchMultipart = patchInstance(axiosMultipart);
  const unpatchNextGen = patchInstance(axiosNextGen);

  return () => {
    unpatchServer();
    unpatchMultipart();
    unpatchNextGen();
  };
}
