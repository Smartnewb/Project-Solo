export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const accessToken = localStorage.getItem('admin_access_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include' // 쿠키 전송을 위해 필요
  });

  // 401 Unauthorized 에러 시 로그인 페이지로 리다이렉트
  if (response.status === 401) {
    localStorage.removeItem('admin_access_token');
    window.location.href = '/';
    return null;
  }

  return response;
};