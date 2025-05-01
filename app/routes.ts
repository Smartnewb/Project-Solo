// 정적 경로 지정
export const staticRoutes = [
  '/admin/rematch-test'
];

// 미들웨어로 보호해야 할 경로 패턴 (정규식)
export const protectedRoutePatterns = [
  /^\/admin(?!\/rematch-test)/  // /admin으로 시작하지만 /admin/rematch-test는 제외
];

// 공개 경로 목록
export const publicRoutes = [
  '/',
  '/signup',
  '/login',
  '/admin/rematch-test'
];