import { userApiClient, adminApiClient } from './client';
import * as apiHooks from './hooks';

// API 클라이언트 및 훅 내보내기
export { userApiClient, adminApiClient };
export { apiHooks };

// 하위 호환성을 위한 기본 내보내기
export default userApiClient;
