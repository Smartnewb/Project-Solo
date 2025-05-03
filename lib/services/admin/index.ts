import userService from './users';
import statsService from './stats';
import communityService from './community';
import withdrawalService from './withdrawal';

// 어드민 서비스 통합
const adminService = {
  users: userService,
  stats: statsService,
  community: communityService,
  withdrawal: withdrawalService
};

export default adminService;
