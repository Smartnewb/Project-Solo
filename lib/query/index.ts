import { QueryClient } from '@tanstack/react-query';
import * as hooks from './hooks';

// React Query 클라이언트 설정
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5분
    },
  },
});

// 훅 내보내기
export { hooks };
