import axios from 'axios';

// baseURL 정규화 함수
// 환경변수가 /admin으로 끝나면 /api로 변경 (잘못된 설정 보정)
function normalizeBaseUrl(url: string): string {
  if (url.endsWith('/admin')) {
    return url.replace(/\/admin$/, '/api');
  }
  return url;
}

// axios 인스턴스 생성
const axiosServer = axios.create({
  baseURL: normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8045/api'),
  timeout: 15000,  // 15초
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // 쿠키 전송 활성화
});

// 요청 인터셉터
axiosServer.interceptors.request.use(
  (config: any) => {
    // 클라이언트 사이드에서만 localStorage에 접근
    if (typeof window !== 'undefined') {
      // 토큰이 있다면 헤더에 추가
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    console.error('요청 인터셉터 오류:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터
axiosServer.interceptors.response.use(
  (response: any) => {
    return response;
  },
  async (error) => {
    console.error('응답 인터셉터 오류:', error?.response?.status, error?.message);

    // 서버가 응답하지 않는 경우 (ECONNREFUSED, Network Error 등)
    if (!error.response) {
      console.error('서버 연결 오류:', error.message);
      return Promise.reject(error);
    }

    // 401 에러 처리 (인증 만료)
    if (error.response?.status === 401) {
      // 클라이언트 사이드에서만 localStorage에 접근
      if (typeof window === 'undefined') {
        return Promise.reject(error);
      }

      // 원래 요청의 설정을 저장
      const originalRequest = error.config;

      // 이미 재시도한 요청인지 확인 (무한 루프 방지)
      if (!originalRequest._retry) {
        originalRequest._retry = true;

        try {
          console.log('토큰 만료 감지, 새로고침 시도');

          // 토큰 새로고침 요청
          const refreshUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8045/api');
          const response = await axios.post(`${refreshUrl}/auth/refresh`, {}, {
            withCredentials: true
          });

          // 새 토큰 저장
          const newToken = response.data.accessToken;
          localStorage.setItem('accessToken', newToken);

          // 쿠키에도 저장 (8시간 = 28800초)
          document.cookie = `accessToken=${newToken}; path=/; max-age=28800; SameSite=Lax`;

          // 관리자 상태 유지
          const isAdmin = localStorage.getItem('isAdmin');
          if (isAdmin === 'true') {
            // 관리자 상태 업데이트
            localStorage.setItem('admin_status', JSON.stringify({
              verified: true,
              timestamp: Date.now(),
              email: 'admin@example.com' // 임시 이메일
            }));
          }

          console.log('토큰 새로고침 성공');

          // 원래 요청의 헤더 업데이트
          originalRequest.headers.Authorization = `Bearer ${newToken}`;

          // 원래 요청 재시도
          return axiosServer(originalRequest);
        } catch (refreshError) {
          console.error('토큰 새로고침 실패:', refreshError);

          // 토큰 리프레시 실패 시 세션 정보 삭제
          if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('isAdmin');
            localStorage.removeItem('admin_status');

            // 새로고침 시 자동 리다이렉트를 방지하기 위해 지연 추가
            // 로그인 페이지로 리다이렉트
            setTimeout(() => {
              window.location.href = '/';
            }, 100);
          }

          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default axiosServer;