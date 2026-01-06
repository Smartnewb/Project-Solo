import axios from "axios";

// JSON 요청용 axios 인스턴스
const axiosServer = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8045/api",
  timeout: 15000, // 15초
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // 쿠키 전송 활성화
  validateStatus: (status) => {
    // 200번대와 304(Not Modified)를 정상으로 처리
    return (status >= 200 && status < 300) || status === 304;
  },
});

// multipart/form-data 요청전용 axios 인스턴스
export const axiosMultipart = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8045/api",
  timeout: 30000, // 30초 (파일 업로드는 더 오래 걸릴 수 있음)
  withCredentials: true,
  validateStatus: (status) => {
    return (status >= 200 && status < 300) || status === 304;
  },
  // Content-Type 헤더를 설정하지 않음 - 브라우저가 자동으로 multipart/form-data; boundary=... 설정
});

// 본 서버(8045) 직접 연결용 axios 인스턴스
export const axiosNextGen = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8045/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  validateStatus: (status) => {
    return (status >= 200 && status < 300) || status === 304;
  },
});

// 공통 요청 인터셉터 함수
const requestInterceptor = (config: any) => {
  // 클라이언트 사이드에서만 localStorage에 접근
  if (typeof window !== "undefined") {
    // 토큰이 있다면 헤더에 추가
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // x-country 헤더 추가 (Admin 국가 선택)
    const country = localStorage.getItem("admin_selected_country") || "kr";
    config.headers["x-country"] = country;
  }
  return config;
};

const requestErrorInterceptor = (error: any) => {
  console.error("요청 인터셉터 오류:", error);
  return Promise.reject(error);
};

// axiosServer 요청 인터셉터
axiosServer.interceptors.request.use(
  requestInterceptor,
  requestErrorInterceptor,
);

// axiosMultipart 요청 인터셉터 (FormData 전용이므로 Content-Type 제거 로직 불필요)
axiosMultipart.interceptors.request.use(
  requestInterceptor,
  requestErrorInterceptor,
);

// axiosNextGen 요청 인터셉터
axiosNextGen.interceptors.request.use(
  requestInterceptor,
  requestErrorInterceptor,
);

// 공통 응답 인터셉터 함수
const createResponseInterceptor = (axiosInstance: any) => {
  return async (error: any) => {
    console.error(
      "응답 인터셉터 오류:",
      error?.response?.status,
      error?.message,
    );

    // 서버가 응답하지 않는 경우 (ECONNREFUSED, Network Error 등)
    if (!error.response) {
      console.error("서버 연결 오류:", error.message);
      return Promise.reject(error);
    }

    // 401 에러 처리 (인증 만료)
    if (error.response?.status === 401) {
      // 클라이언트 사이드에서만 localStorage에 접근
      if (typeof window === "undefined") {
        return Promise.reject(error);
      }

      // 원래 요청의 설정을 저장
      const originalRequest = error.config;

      // 이미 재시도한 요청인지 확인 (무한 루프 방지)
      if (!originalRequest._retry) {
        originalRequest._retry = true;

        try {
          console.log("토큰 만료 감지, 새로고침 시도");

          // 토큰 새로고침 요청
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
            {},
            {
              withCredentials: true,
            },
          );

          // 새 토큰 저장
          const newToken = response.data.accessToken;
          localStorage.setItem("accessToken", newToken);

          // 쿠키에도 저장 (8시간 = 28800초)
          document.cookie = `accessToken=${newToken}; path=/; max-age=28800; SameSite=Lax`;

          // 관리자 상태 유지
          const isAdmin = localStorage.getItem("isAdmin");
          if (isAdmin === "true") {
            // 관리자 상태 업데이트
            localStorage.setItem(
              "admin_status",
              JSON.stringify({
                verified: true,
                timestamp: Date.now(),
                email: "admin@example.com", // 임시 이메일
              }),
            );
          }

          console.log("토큰 새로고침 성공");

          // 원래 요청의 헤더 업데이트
          originalRequest.headers.Authorization = `Bearer ${newToken}`;

          // 원래 요청 재시도 (해당 인스턴스로)
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          console.error("토큰 새로고침 실패:", refreshError);

          // 토큰 리프레시 실패 시 세션 정보 삭제
          if (typeof window !== "undefined") {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("isAdmin");
            localStorage.removeItem("admin_status");

            // 새로고침 시 자동 리다이렉트를 방지하기 위해 지연 추가
            // 로그인 페이지로 리다이렉트
            setTimeout(() => {
              window.location.href = "/";
            }, 100);
          }

          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  };
};

// axiosServer 응답 인터셉터
axiosServer.interceptors.response.use(
  (response: any) => response,
  createResponseInterceptor(axiosServer),
);

// axiosMultipart 응답 인터셉터
axiosMultipart.interceptors.response.use(
  (response: any) => response,
  createResponseInterceptor(axiosMultipart),
);

// axiosNextGen 응답 인터셉터
axiosNextGen.interceptors.response.use(
  (response: any) => response,
  createResponseInterceptor(axiosNextGen),
);

export default axiosServer;
