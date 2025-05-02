import adminService from './admin';

// 서비스 통합
export {
  adminService
};

// 하위 호환성을 위한 내보내기
export { default as AdminService } from './admin';
export { default as CommunityService } from './admin/community';
