// 하위 호환성을 위한 파일
// 새로운 API 클라이언트 사용
import { adminApiClient } from '@/lib/api';

// 기존 코드와의 호환성을 위해 동일한 이름으로 내보내기
const adminAxios = adminApiClient.getClient();

export default adminAxios;
