import { adminGet, adminPatch, adminDelete, adminRequest } from '@/shared/lib/http/admin-fetch';

export interface Author {
	id: string;
	name: string;
	email?: string;
}

export interface Article {
	id: string;
	userId: string;
	nickname: string;
	email?: string;
	title?: string;
	content: string;
	emoji: string;
	isAnonymous: boolean;
	likeCount: number;
	commentCount: number;
	reportCount: number;
	isBlinded: boolean;
	blindReason?: string;
	isDeleted: boolean;
	isEdited: boolean;
	createdAt: Date;
	updatedAt: Date;
	author?: Author;
}

export interface Comment {
	id: string;
	articleId: string;
	userId: string;
	nickname: string;
	email?: string;
	content: string;
	emoji: string;
	isAnonymous: boolean;
	likeCount: number;
	reportCount: number;
	isBlinded: boolean;
	blindReason?: string;
	isDeleted: boolean;
	isEdited: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface Report {
	id: string;
	targetType: 'article' | 'comment';
	targetId: string;
	reporterId: string;
	reporterNickname: string;
	reason: string;
	description?: string;
	status: 'pending' | 'processed';
	result?: 'accepted' | 'rejected';
	processedById?: string;
	processedByNickname?: string;
	processMemo?: string;
	createdAt: Date;
	processedAt?: Date;
	targetContent?: string;
}

export interface PaginationMeta {
	currentPage: number;
	itemsPerPage: number;
	totalItems: number;
	totalPages: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
	items: T[];
	total?: number;
	page?: number;
	limit?: number;
	totalPages?: number;
	meta?: PaginationMeta;
}

export interface ArticleDetail extends Article {
	comments: Comment[];
	reports: Report[];
}

export interface Category {
	id: string;
	code: string;
	displayName: string;
}

const normalizeArticle = (a: any): Article => ({
	...a,
	content: a.contentPreview ?? a.content ?? '',
	commentCount:
		a.commentCount ?? a.comment_count ?? a.comments_count ?? a.commentsCount ??
		(Array.isArray(a.comments) ? a.comments.length : 0),
	likeCount:
		a.likeCount ?? a.like_count ?? a.likes_count ?? a.likesCount ??
		(Array.isArray(a.likes) ? a.likes.length : 0),
	reportCount:
		a.reportCount ?? a.report_count ?? a.reports_count ?? a.reportsCount ??
		(Array.isArray(a.reports) ? a.reports.length : 0),
	author: a.authorName
		? { id: a.authorId, name: a.authorName }
		: a.author ?? undefined,
});

const communityService = {
	getArticles: async (
		filter: 'all' | 'reported' | 'blinded' = 'all',
		page = 1,
		limit = 10,
		startDate: Date | null = null,
		endDate: Date | null = null,
		categoryId: string | null = null,
	): Promise<PaginatedResponse<Article>> => {
		const params: Record<string, string> = {
			page: String(page),
			limit: String(limit),
		};

		if (startDate) {
			params.startDate = startDate.toISOString().split('T')[0];
		}

		if (endDate) {
			params.endDate = endDate.toISOString().split('T')[0];
		}

		if (categoryId) {
			params.categoryId = categoryId;
		}

		const res = await adminGet<{ data: any[]; meta: any }>('/admin/v2/community/posts', params);
		const rawArticles = res.data ?? [];
		const articles = rawArticles.map(normalizeArticle);
		const pagination = res.meta;
		return {
			items: articles,
			meta: {
				currentPage: pagination?.currentPage ?? page,
				itemsPerPage: pagination?.itemsPerPage ?? limit,
				totalItems: pagination?.totalItems ?? articles.length,
				totalPages: pagination?.totalPages ?? 1,
				hasNextPage: pagination?.hasNextPage ?? false,
				hasPreviousPage: page > 1,
			},
		};
	},

	getArticleDetail: async (id: string): Promise<ArticleDetail> => {
		const endDate = new Date();
		const startDate = new Date();
		startDate.setDate(endDate.getDate() - 30);

		const articlesRes = await adminGet<{ data: any[]; meta: any }>('/admin/v2/community/posts', {
			startDate: startDate.toISOString().split('T')[0],
			endDate: endDate.toISOString().split('T')[0],
			page: '1',
			limit: '1000',
		});

		const article = (articlesRes?.data ?? []).find((item: any) => item.id === id);
		if (!article) {
			throw new Error('게시글을 찾을 수 없습니다.');
		}

		const commentsRes = await adminGet<{ data: any[] }>('/admin/v2/community/comments', {
			articleId: id,
			article_id: id,
		});

		const normalized = normalizeArticle(article);
		const articleDetail: ArticleDetail = {
			...normalized,
			comments: commentsRes?.data ?? [],
			reports: [],
		};

		return articleDetail;
	},

	blindArticle: async (id: string, isBlinded: boolean): Promise<any> => {
		return adminPatch(`/admin/v2/community/posts/${id}/status`, {
			isBlinded,
		});
	},

	deleteArticle: async (articleId: string): Promise<any> => {
		return adminDelete(`/admin/v2/community/posts/${articleId}`);
	},

	moveArticleCategory: async (articleId: string, categoryId: string): Promise<any> => {
		return adminPatch('/admin/v2/community/articles/category', {
			articleId,
			categoryId,
		});
	},

	getCategories: async (): Promise<{ categories: Category[] }> => {
		const res = await adminGet<{ data: { categories: Category[] } }>('/admin/v2/community/categories');

		return {
			categories: Array.isArray(res.data) ? res.data : (res.data?.categories ?? []),
		};
	},

	getComments: async (
		articleId: string,
		filter: 'all' | 'reported' | 'blinded' = 'all',
		page = 1,
		limit = 10,
	): Promise<PaginatedResponse<Comment>> => {
		const res = await adminGet<{ data: any[]; meta: any }>(`/admin/v2/community/comments`, {
			articleId,
		});

		const comments = res.data ?? [];
		const pagination = res.meta;
		return {
			items: comments,
			meta: pagination ? {
				currentPage: pagination.currentPage ?? page,
				itemsPerPage: pagination.itemsPerPage ?? limit,
				totalItems: pagination.totalItems ?? comments.length,
				totalPages: pagination.totalPages ?? 1,
				hasNextPage: pagination.hasNextPage ?? false,
				hasPreviousPage: (pagination.currentPage ?? page) > 1,
			} : {
				currentPage: page,
				itemsPerPage: limit,
				totalItems: comments.length,
				totalPages: 1,
				hasNextPage: false,
				hasPreviousPage: page > 1,
			},
		};
	},

	blindComment: async (id: string, isBlinded: boolean, reason?: string): Promise<any> => {
		return adminPatch(`/admin/v2/community/comments/${id}/blind`, {
			isBlinded,
			reason,
		});
	},

	deleteComment: async (id: string): Promise<any> => {
		return adminDelete(`/admin/v2/community/comments/${id}`);
	},

	getCommunityReports: async (
		page = 1,
		limit = 10,
		status: 'pending' | 'reviewing' | 'resolved' | 'rejected' = 'pending',
		reporterName?: string,
		reportedName?: string,
	): Promise<PaginatedResponse<any>> => {
		const params: Record<string, string> = {
			page: String(page),
			limit: String(limit),
			status,
		};
		if (reporterName) params.reporterName = reporterName;
		if (reportedName) params.reportedName = reportedName;

		const response = await adminGet<{ data: any[]; meta: any }>('/admin/v2/community/reports', params);

		return {
			items: response.data ?? [],
			meta: response.meta ? {
				currentPage: response.meta.page ?? page,
				itemsPerPage: response.meta.limit ?? limit,
				totalItems: response.meta.total ?? 0,
				totalPages: response.meta.totalPages ?? 1,
				hasNextPage: (response.meta.page ?? page) < (response.meta.totalPages ?? 1),
				hasPreviousPage: (response.meta.page ?? page) > 1,
			} : {
				currentPage: page,
				itemsPerPage: limit,
				totalItems: response.data?.length ?? 0,
				totalPages: 1,
				hasNextPage: false,
				hasPreviousPage: page > 1,
			},
		};
	},

	getReports: async (
		type: 'article' | 'comment' | 'all' = 'all',
		status: 'pending' | 'processed' | 'all' = 'all',
		page = 1,
		limit = 10,
	): Promise<PaginatedResponse<Report>> => {
		const response = await adminGet<{ data: any[]; meta: any }>('/admin/v2/community/reports', {
			type,
			status,
			page: String(page),
			limit: String(limit),
		});

		return {
			items: response.data ?? [],
			meta: response.meta ? {
				currentPage: response.meta.page ?? page,
				itemsPerPage: response.meta.limit ?? limit,
				totalItems: response.meta.total ?? 0,
				totalPages: response.meta.totalPages ?? 1,
				hasNextPage: (response.meta.page ?? page) < (response.meta.totalPages ?? 1),
				hasPreviousPage: (response.meta.page ?? page) > 1,
			} : {
				currentPage: page,
				itemsPerPage: limit,
				totalItems: response.data?.length ?? 0,
				totalPages: 1,
				hasNextPage: false,
				hasPreviousPage: page > 1,
			},
		};
	},

	processReport: async (
		id: string,
		result: 'accepted' | 'rejected',
		memo?: string,
		blind?: boolean,
	): Promise<any> => {
		return adminPatch(`/admin/v2/community/reports/${id}/process`, {
			result,
			memo,
			blind,
		});
	},

	bulkBlindArticles: async (ids: string[], isBlinded: boolean): Promise<any> => {
		if (ids.length === 1) {
			return adminPatch(`/admin/v2/community/posts/${ids[0]}/status`, {
				isBlinded,
			});
		}

		const results = [];
		for (const id of ids) {
			const response = await adminPatch(`/admin/v2/community/posts/${id}/status`, {
				isBlinded,
			});
			results.push(response);
		}
		return {
			success: true,
			message: `${ids.length}개의 게시글이 ${isBlinded ? '블라인드' : '블라인드 해제'} 처리되었습니다.`,
			results,
		};
	},

	bulkDeleteArticles: async (ids: string[]): Promise<any> => {
		return adminRequest('/admin/v2/community/articles/bulk', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ ids }),
		});
	},

	bulkBlindComments: async (ids: string[], isBlinded: boolean, reason?: string): Promise<any> => {
		return adminPatch('/admin/v2/community/comments/bulk/blind', {
			ids,
			isBlinded,
			reason,
		});
	},

	bulkDeleteComments: async (ids: string[]): Promise<any> => {
		return adminRequest('/admin/v2/community/comments/bulk', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ ids }),
		});
	},
};

export default communityService;
