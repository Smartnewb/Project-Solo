import AdminService from './admin';
import AnalyticsService from './analytics';
import communityService from './community';
import smsService from './sms';

// 기존 코드와의 호환성을 위해 CommunityService로 내보내기
const CommunityService = communityService;

export {
  AdminService,
  AnalyticsService,
  CommunityService,
  smsService,
};
