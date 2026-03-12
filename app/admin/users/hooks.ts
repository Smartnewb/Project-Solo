import { useQuery } from '@tanstack/react-query';
import axiosServer from '@/utils/axios';
import { useAdminSession } from '@/shared/contexts/admin-session-context';

type ApiResponse = {
  items: Array<{
    id: string;
    userId: string;
    email: string;
    role: string;
    classification: string | null;
    gender: 'MALE' | 'FEMALE';
    createdAt: string;
    lastActiveAt?: string | null;
    name: string;
    age: number;
    phoneNumber?: string;
    instagramId: string | null;
    profileImages: Array<{
      id: string;
      order: number;
      isMain: boolean;
      url: string;
    }>;
    universityDetails: {
      name: string;
      authentication: boolean;
      department: string;
    } | null;
    preferences?: {
      self?: Array<{
        typeName: string;
        selectedOptions: Array<{ id: string; displayName: string }>;
      }>;
      partner?: Array<{
        typeName: string;
        selectedOptions: Array<{ id: string; displayName: string }>;
      }>;
    };
    statusAt?: string | null;
  }>;
  meta: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

export function useUserList(page: number, limit: number) {
  const { session } = useAdminSession();
  const selectedCountry = session?.selectedCountry ?? '';

  return useQuery<ApiResponse>({
    queryKey: ['admin', 'users', { page, limit, selectedCountry }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      const response = await axiosServer.get<ApiResponse>(`/admin/users?${params}`);
      return response.data;
    },
  });
}
