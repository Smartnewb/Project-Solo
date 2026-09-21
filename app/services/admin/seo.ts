import { adminGet, buildAdminProxyUrl } from '@/shared/lib/http/admin-fetch';

export interface PageMeta {
	title: string;
	description: string;
	ogImage?: string;
	ogUrl?: string;
	canonicalUrl?: string;
	type: 'website' | 'article';
	publishedAt?: string;
	keywords?: string[];
}

export type SitemapKind = 'index' | 'static' | 'articles' | 'cardnews' | 'universities';

export const seo = {
	getMeta: async (path: string): Promise<PageMeta> =>
		adminGet<PageMeta>('/seo/meta', { path }),

	getSitemapUrl: (kind: SitemapKind, country?: 'kr' | 'jp'): string => {
		if (kind === 'index') return '/sitemap.xml';
		if (kind === 'static') return '/sitemap-static.xml';
		return `/sitemap-${kind}-${country ?? 'kr'}.xml`;
	},

	fetchSitemapLocCount: async (url: string): Promise<number> => {
		const res = await fetch(buildAdminProxyUrl(url));
		if (!res.ok) throw new Error(`sitemap fetch failed: ${res.status}`);
		const xml = await res.text();
		return (xml.match(/<loc>/g) ?? []).length;
	},

	getWebPageUrl: (
		kind: 'blog' | 'card-news' | 'university',
		slugOrId: string,
		country: 'kr' | 'jp' = 'kr',
	): string => {
		const prefix = country === 'jp' ? '/jp' : '';
		return `/web${prefix}/${kind}/${encodeURIComponent(slugOrId)}`;
	},
};
