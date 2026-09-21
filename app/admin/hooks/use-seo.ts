import { useQuery } from '@tanstack/react-query';
import AdminService from '@/app/services/admin';
import type { PageMeta } from '@/app/services/admin/seo';

export const seoKeys = {
  all: ['admin', 'seo'] as const,
  meta: (path: string) => [...seoKeys.all, 'meta', path] as const,
  sitemapCount: (url: string) => [...seoKeys.all, 'sitemap-count', url] as const,
};

export function usePageMeta(path: string, enabled = true) {
  return useQuery<PageMeta>({
    queryKey: seoKeys.meta(path),
    queryFn: () => AdminService.seo.getMeta(path),
    enabled: !!path && enabled,
    staleTime: 60_000,
  });
}

export function useSitemapLocCount(url: string, enabled = true) {
  return useQuery({
    queryKey: seoKeys.sitemapCount(url),
    queryFn: () => AdminService.seo.fetchSitemapLocCount(url),
    enabled: !!url && enabled,
    staleTime: 5 * 60_000,
    retry: 1,
  });
}
