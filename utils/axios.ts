import axios from 'axios';

// axios 인스턴스 생성
const axiosServer = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,  // 10초
  headers: {
    'Content-Type': 'application/json',
  }
});

// 요청 인터셉터
axiosServer.interceptors.request.use(
  (config: any) => {
    // 토큰이 있다면 헤더에 추가
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
axiosServer.interceptors.response.use(
  (response: any) => {
    return response;
  },
  async (error) => {
    // 401 에러 처리 (인증 만료)
    if (error.response?.status === 401) {
      // 원래 요청의 설정을 저장
      const originalRequest = error.config;

      // 이미 재시도한 요청인지 확인 (무한 루프 방지)
      if (!originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // 토큰 새로고침 요청
          const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {}, {
            withCredentials: true
          });

          // 새 토큰 저장
          const newToken = response.data.accessToken;
          localStorage.setItem('accessToken', newToken);

          // 원래 요청의 헤더 업데이트
          originalRequest.headers.Authorization = `Bearer ${newToken}`;

          // 원래 요청 재시도
          return axiosServer(originalRequest);
        } catch (refreshError) {
          // 토큰 리프레시 실패 시 로그인 페이지로 리다이렉트
          localStorage.removeItem('accessToken');
          window.location.href = '/';
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default axiosServer;