import { adminApiClient } from '@/lib/api';

// 하위 호환성을 위한 함수
// 새로운 API 클라이언트를 사용하는 것이 권장됨
export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  try {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8045';
    const fullUrl = url.startsWith('http') ? url : `${baseURL}${url.startsWith('/') ? url : `/${url}`}`;

    const method = options.method?.toUpperCase() || 'GET';
    const body = options.body ? JSON.parse(options.body.toString()) : undefined;

    let response;

    switch (method) {
      case 'GET':
        response = await adminApiClient.get(url);
        break;
      case 'POST':
        response = await adminApiClient.post(url, body);
        break;
      case 'PUT':
        response = await adminApiClient.put(url, body);
        break;
      case 'PATCH':
        response = await adminApiClient.patch(url, body);
        break;
      case 'DELETE':
        response = await adminApiClient.delete(url);
        break;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }

    // Response 객체 형태로 반환
    return {
      ok: true,
      status: 200,
      json: async () => response,
      text: async () => JSON.stringify(response),
      headers: new Headers({ 'Content-Type': 'application/json' })
    } as Response;
  } catch (error) {
    if (error instanceof Error && error.message.includes('401')) {
      localStorage.removeItem('admin_access_token');
      window.location.href = '/';
      return null;
    }

    // 에러 응답 반환
    return {
      ok: false,
      status: 500,
      json: async () => ({ error: error instanceof Error ? error.message : 'Unknown error' }),
      text: async () => error instanceof Error ? error.message : 'Unknown error',
      headers: new Headers({ 'Content-Type': 'application/json' })
    } as Response;
  }
};