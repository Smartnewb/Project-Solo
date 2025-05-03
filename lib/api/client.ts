import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { apiLogger, userLogger, adminLogger } from '@/lib/utils/logger';

// API 클라이언트 타입
export type ApiClientType = 'user' | 'admin';

// API 클라이언트 설정
interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  withCredentials: boolean;
}

// 기본 설정
const defaultConfig: ApiClientConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8045',
  timeout: 15000,
  withCredentials: true
};

// API 클라이언트 클래스
class ApiClient {
  private client: AxiosInstance;
  private type: ApiClientType;
  private logger: typeof userLogger | typeof adminLogger;

  constructor(type: ApiClientType, config: Partial<ApiClientConfig> = {}) {
    this.type = type;
    this.logger = type === 'admin' ? adminLogger : userLogger;

    // 설정 병합
    const mergedConfig = { ...defaultConfig, ...config };

    // Axios 인스턴스 생성
    this.client = axios.create({
      baseURL: mergedConfig.baseURL,
      timeout: mergedConfig.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: mergedConfig.withCredentials
    });

    // 요청 인터셉터 설정
    this.setupRequestInterceptor();

    // 응답 인터셉터 설정
    this.setupResponseInterceptor();

    // 로깅
    this.logger.info(`API 클라이언트 생성 - baseURL: ${mergedConfig.baseURL}`);
  }

  // 요청 인터셉터 설정
  private setupRequestInterceptor(): void {
    this.client.interceptors.request.use(
      (config) => {
        // 클라이언트 사이드에서만 localStorage에 접근
        if (typeof window !== 'undefined') {
          // 토큰 키 결정 (일반 사용자 또는 관리자)
          const tokenKey = this.type === 'admin' ? 'admin_access_token' : 'accessToken';

          // 토큰이 있다면 헤더에 추가
          const token = localStorage.getItem(tokenKey);
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }

        // 요청 로깅
        apiLogger.debug('API 요청', {
          url: config.url,
          method: config.method,
          data: config.data,
          params: config.params
        });

        return config;
      },
      (error) => {
        apiLogger.error('요청 인터셉터 오류', error);
        return Promise.reject(error);
      }
    );
  }

  // 응답 인터셉터 설정
  private setupResponseInterceptor(): void {
    this.client.interceptors.response.use(
      (response) => {
        // 응답 로깅
        apiLogger.debug('API 응답', {
          url: response.config.url,
          status: response.status,
          data: response.data
        });

        return response;
      },
      async (error: AxiosError) => {
        // 오류 로깅
        apiLogger.error('API 오류', {
          url: error.config?.url,
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });

        // 서버가 응답하지 않는 경우
        if (!error.response) {
          apiLogger.error('서버 연결 오류', error.message);
          return Promise.reject(error);
        }

        // 401 에러 처리 (인증 만료)
        if (error.response?.status === 401) {
          // 클라이언트 사이드에서만 localStorage에 접근
          if (typeof window === 'undefined') {
            return Promise.reject(error);
          }

          // 토큰 키 결정
          const tokenKey = this.type === 'admin' ? 'admin_access_token' : 'accessToken';

          // 원래 요청의 설정을 저장
          const originalRequest = error.config;

          // 이미 재시도한 요청인지 확인 (무한 루프 방지)
          if (originalRequest && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
              this.logger.info('토큰 만료 감지, 새로고침 시도');

              // 토큰 새로고침 요청
              const refreshUrl = this.type === 'admin'
                ? `${defaultConfig.baseURL}/api/admin/auth/refresh`
                : `${defaultConfig.baseURL}/api/auth/refresh`;

              const response = await axios.post(
                refreshUrl,
                {},
                { withCredentials: true }
              );

              // 새 토큰 저장
              const newToken = response.data.accessToken;
              localStorage.setItem(tokenKey, newToken);

              // 쿠키에도 저장 (8시간 = 28800초)
              document.cookie = `${tokenKey}=${newToken}; path=/; max-age=28800; SameSite=Lax`;

              this.logger.info('토큰 새로고침 성공');

              // 원래 요청의 헤더 업데이트
              originalRequest.headers.Authorization = `Bearer ${newToken}`;

              // 원래 요청 재시도
              return this.client(originalRequest);
            } catch (refreshError) {
              this.logger.error('토큰 새로고침 실패', refreshError);

              // 토큰 리프레시 실패 시 세션 정보 삭제
              if (typeof window !== 'undefined') {
                localStorage.removeItem(tokenKey);

                // 관리자인 경우 로그인 페이지로 리다이렉트
                if (this.type === 'admin') {
                  // 새로고침 시 자동 리다이렉트를 방지하기 위해 지연 추가
                  setTimeout(() => {
                    window.location.href = '/';
                  }, 100);
                }
              }

              return Promise.reject(refreshError);
            }
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // GET 요청
  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  // POST 요청
  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  // PUT 요청
  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  // PATCH 요청
  public async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  // DELETE 요청
  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  // 원본 Axios 인스턴스 접근
  public getClient(): AxiosInstance {
    return this.client;
  }
}

// 일반 사용자용 API 클라이언트 인스턴스
export const userApiClient = new ApiClient('user');

// 관리자용 API 클라이언트 인스턴스
export const adminApiClient = new ApiClient('admin');

// 기본 내보내기 (하위 호환성 유지)
export default userApiClient;
