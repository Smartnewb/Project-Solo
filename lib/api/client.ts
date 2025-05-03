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
        // 클라이언트 사이드에서만 토큰 접근
        if (typeof window !== 'undefined') {
          // 토큰 키 결정 (일반 사용자 또는 관리자)
          const tokenKey = this.type === 'admin' ? 'admin_access_token' : 'accessToken';

          // 여러 저장소에서 토큰 가져오기 시도
          let token = null;

          // 1. localStorage에서 토큰 가져오기 시도
          try {
            token = localStorage.getItem(tokenKey);
          } catch (localStorageError) {
            this.logger.error('localStorage에서 토큰 가져오기 실패:', localStorageError);
          }

          // 2. localStorage에 토큰이 없으면 sessionStorage에서 가져오기 시도
          if (!token) {
            try {
              token = sessionStorage.getItem(tokenKey);
              if (token) {
                this.logger.debug('sessionStorage에서 토큰 발견');

                // sessionStorage에서 발견한 토큰을 localStorage에도 저장
                try {
                  localStorage.setItem(tokenKey, token);
                } catch (storageError) {
                  this.logger.error('sessionStorage에서 가져온 토큰을 localStorage에 저장 실패:', storageError);
                }
              }
            } catch (sessionStorageError) {
              this.logger.error('sessionStorage에서 토큰 가져오기 실패:', sessionStorageError);
            }
          }

          // 3. 아직도 토큰이 없으면 쿠키에서 가져오기 시도
          if (!token) {
            try {
              const cookies = document.cookie.split(';');
              for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.startsWith(`${tokenKey}=`)) {
                  token = cookie.substring(tokenKey.length + 1);
                  this.logger.debug('쿠키에서 토큰 발견');

                  // 쿠키에서 발견한 토큰을 localStorage와 sessionStorage에도 저장
                  try {
                    localStorage.setItem(tokenKey, token);
                    sessionStorage.setItem(tokenKey, token);
                  } catch (storageError) {
                    this.logger.error('쿠키에서 가져온 토큰을 저장소에 저장 실패:', storageError);
                  }
                  break;
                }
              }
            } catch (cookieError) {
              this.logger.error('쿠키에서 토큰 가져오기 실패:', cookieError);
            }
          }

          // 토큰이 있다면 헤더에 추가
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
        // 응답 로깅 (데이터 크기에 따라 로깅 수준 조정)
        const responseSize = JSON.stringify(response.data).length;

        if (responseSize > 10000) {
          // 대용량 응답은 요약 정보만 로깅
          apiLogger.debug('API 응답 (대용량)', {
            url: response.config.url,
            status: response.status,
            size: `${Math.round(responseSize / 1024)} KB`,
            type: typeof response.data,
            isArray: Array.isArray(response.data)
          });
        } else {
          // 일반 응답은 전체 데이터 로깅
          apiLogger.debug('API 응답', {
            url: response.config.url,
            status: response.status,
            data: response.data
          });
        }

        return response;
      },
      async (error: AxiosError) => {
        // 오류 로깅 (상세 정보 포함)
        const errorDetails = {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        };

        // 오류 유형에 따라 로깅 수준 조정
        if (error.response?.status === 401) {
          // 인증 오류는 경고 수준으로 로깅 (자주 발생할 수 있음)
          apiLogger.warn('인증 오류 (401)', errorDetails);
        } else if (error.response?.status === 404) {
          // 리소스 없음 오류는 경고 수준으로 로깅
          apiLogger.warn('리소스 없음 오류 (404)', errorDetails);
        } else if (!error.response) {
          // 서버 연결 오류는 심각한 오류로 로깅
          apiLogger.error('서버 연결 오류', {
            ...errorDetails,
            code: error.code,
            isAxiosError: error.isAxiosError,
            stack: error.stack
          });
        } else {
          // 기타 오류는 일반 오류로 로깅
          apiLogger.error('API 오류', errorDetails);
        }

        // 서버가 응답하지 않는 경우
        if (!error.response) {
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

              this.logger.debug(`토큰 새로고침 요청 URL: ${refreshUrl}`);

              // 토큰 새로고침 요청 시 쿠키 포함
              const response = await axios.post(
                refreshUrl,
                {},
                {
                  withCredentials: true,
                  headers: {
                    'Content-Type': 'application/json'
                  }
                }
              );

              this.logger.debug('토큰 새로고침 응답:', response.data);

              // 새 토큰 확인
              if (!response.data || !response.data.accessToken) {
                throw new Error('토큰 새로고침 응답에 accessToken이 없습니다.');
              }

              // 새 토큰 저장
              const newToken = response.data.accessToken;

              try {
                localStorage.setItem(tokenKey, newToken);

                // 쿠키에도 저장 (8시간 = 28800초)
                document.cookie = `${tokenKey}=${newToken}; path=/; max-age=28800; SameSite=Lax`;

                this.logger.info('토큰 새로고침 성공 및 저장 완료');
              } catch (storageError) {
                this.logger.error('토큰 저장 중 오류 발생:', storageError);
                // 저장 오류가 발생해도 계속 진행
              }

              // 원래 요청의 헤더 업데이트
              originalRequest.headers.Authorization = `Bearer ${newToken}`;

              // 원래 요청 재시도
              this.logger.debug('원래 요청 재시도:', {
                url: originalRequest.url,
                method: originalRequest.method
              });

              return this.client(originalRequest);
            } catch (refreshError) {
              this.logger.error('토큰 새로고침 실패:', refreshError);

              // 토큰 리프레시 실패 시 세션 정보 삭제
              if (typeof window !== 'undefined') {
                try {
                  localStorage.removeItem(tokenKey);

                  // 쿠키에서도 제거
                  document.cookie = `${tokenKey}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;

                  this.logger.info('토큰 삭제 완료');
                } catch (removeError) {
                  this.logger.error('토큰 삭제 중 오류 발생:', removeError);
                }

                // 관리자인 경우 로그인 페이지로 리다이렉트
                if (this.type === 'admin') {
                  this.logger.info('관리자 로그인 페이지로 리다이렉트');

                  // 새로고침 시 자동 리다이렉트를 방지하기 위해 지연 추가
                  setTimeout(() => {
                    window.location.href = '/admin/login';
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

  // URL 경로 처리 (자동으로 /api 접두사 추가)
  private processUrl(url: string): string {
    // 이미 /api로 시작하는 경우 그대로 반환
    if (url.startsWith('/api')) {
      return url;
    }

    // 그렇지 않은 경우 /api 접두사 추가
    return `/api${url}`;
  }

  // GET 요청
  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const processedUrl = this.processUrl(url);
    this.logger.debug(`GET 요청 URL 처리: ${url} -> ${processedUrl}`);
    const response = await this.client.get<T>(processedUrl, config);
    return response.data;
  }

  // POST 요청
  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const processedUrl = this.processUrl(url);
    this.logger.debug(`POST 요청 URL 처리: ${url} -> ${processedUrl}`);
    const response = await this.client.post<T>(processedUrl, data, config);
    return response.data;
  }

  // PUT 요청
  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const processedUrl = this.processUrl(url);
    this.logger.debug(`PUT 요청 URL 처리: ${url} -> ${processedUrl}`);
    const response = await this.client.put<T>(processedUrl, data, config);
    return response.data;
  }

  // PATCH 요청
  public async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const processedUrl = this.processUrl(url);
    this.logger.debug(`PATCH 요청 URL 처리: ${url} -> ${processedUrl}`);
    const response = await this.client.patch<T>(processedUrl, data, config);
    return response.data;
  }

  // DELETE 요청
  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const processedUrl = this.processUrl(url);
    this.logger.debug(`DELETE 요청 URL 처리: ${url} -> ${processedUrl}`);
    const response = await this.client.delete<T>(processedUrl, config);
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
