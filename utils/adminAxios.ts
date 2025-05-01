import axios from 'axios';

// 어드민 전용 axios 인스턴스 생성
const adminAxios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8045',
  timeout: 15000,  // 15초
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // 쿠키 전송 활성화
});

// API URL 로깅 (디버깅용)
console.log('Admin Axios 인스턴스 생성 - baseURL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8045');

// 요청 인터셉터
adminAxios.interceptors.request.use(
  (config: any) => {
    // 클라이언트 사이드에서만 localStorage에 접근
    if (typeof window !== 'undefined') {
      // 어드민 토큰이 있다면 헤더에 추가
      const token = localStorage.getItem('admin_access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('요청 헤더에 토큰 추가:', `Bearer ${token.substring(0, 10)}...`);
      } else {
        console.warn('어드민 토큰이 없습니다.');
      }
    }
    console.log('API 요청 URL:', config.url);
    console.log('API 요청 메서드:', config.method);
    return config;
  },
  (error) => {
    console.error('어드민 요청 인터셉터 오류:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터
adminAxios.interceptors.response.use(
  (response: any) => {
    return response;
  },
  async (error) => {
    console.error('어드민 응답 인터셉터 오류:', error?.response?.status, error?.message);

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
          console.log('어드민 토큰 만료 감지, 새로고침 시도');

          // 토큰 새로고침 요청
          const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8045'}/api/auth/refresh`, {}, {
            withCredentials: true
          });

          // 새 토큰 저장
          const newToken = response.data.accessToken;
          localStorage.setItem('admin_access_token', newToken);

          // 쿠키에도 저장 (8시간 = 28800초)
          document.cookie = `admin_access_token=${newToken}; path=/; max-age=28800; SameSite=Lax`;

          console.log('어드민 토큰 새로고침 성공');

          // 원래 요청의 헤더 업데이트
          originalRequest.headers.Authorization = `Bearer ${newToken}`;

          // 원래 요청 재시도
          return adminAxios(originalRequest);
        } catch (refreshError) {
          console.error('어드민 토큰 새로고침 실패:', refreshError);

          // 토큰 리프레시 실패 시 세션 정보 삭제
          if (typeof window !== 'undefined') {
            localStorage.removeItem('admin_access_token');

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

export default adminAxios;
