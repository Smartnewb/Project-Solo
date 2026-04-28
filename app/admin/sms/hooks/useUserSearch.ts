import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { searchUsersByQuery } from '@/app/services/sms';

export const useUserSearch = (rawQuery: string, limit = 20) => {
    const query = useDebounce(rawQuery, 300);
    return useQuery({
        queryKey: ['sms', 'user-search', query, limit],
        queryFn: () => searchUsersByQuery(query, 1, limit),
        enabled: query.trim().length >= 2,
        staleTime: 30_000,
    });
};
