import userService from './users';
import statsService from './stats';
import communityService from './community';

// 어드민 서비스 통합
const adminService = {
  users: userService,
  stats: statsService,
  community: communityService
};

export default adminService;
