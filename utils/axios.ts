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
  (error) => {
    // 401 에러 처리 (인증 만료)
    if (error.response?.status === 401) {
      // 로그인 페이지로 리다이렉트 또는 토큰 갱신 로직
      // localStorage.removeItem('token');
      // window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default axiosServer; 