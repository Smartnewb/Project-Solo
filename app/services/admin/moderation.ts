import { adminGet, adminPost, adminPatch } from '@/shared/lib/http/admin-fetch';

function normalizeDisplayText(value: unknown): string | null {
	if (value == null) return null;
	if (typeof value === 'string') return value;
	if (typeof value === 'number' || typeof value === 'boolean') return String(value);
	if (typeof value === 'object') {
		const record = value as { name?: unknown; id?: unknown };
		if (typeof record.name === 'string') return record.name;
		if (typeof record.id === 'string') return record.id;
	}
	return null;
}

export interface ReviewHistoryFilter {
	reviewType?: 'admin' | 'auto';
	reviewStatus?: 'approved' | 'rejected';
	gender?: 'MALE' | 'FEMALE';
	from?: string;
	to?: string;
	searchTerm?: string;
	universityId?: string;
	reviewedBy?: string;
	page?: number;
	limit?: number;
}

export interface ReviewHistoryItem {
	imageId: string;
	imageUrl: string;
	slotIndex: number;
	isMain: boolean;
	reviewStatus: 'approved' | 'rejected';
	reviewType: 'admin' | 'auto' | null;
	reviewedBy: string | null;
	reviewedAt: string | null;
	rejectionReason: string | null;
	user: {
		userId: string;
		name: string | null;
		gender: string | null;
		age: number | null;
	};
}

export interface VisionFaceAnnotation {
	detectionConfidence: number;
	landmarkingConfidence: number;
	joyLikelihood: string;
	sorrowLikelihood: string;
	angerLikelihood: string;
	surpriseLikelihood: string;
	underExposedLikelihood: string;
	blurredLikelihood: string;
	headwearLikelihood: string;
	rollAngle: number;
	panAngle: number;
	tiltAngle: number;
}

export interface ImageValidationResponse {
	id: string;
	photoId: string;
	visionResponse: VisionFaceAnnotation[];
	totalScore: number;
	autoDecision: string;
	decisionReason: string;
	createdAt: string;
}

export interface ReviewHistoryResponse {
	items: ReviewHistoryItem[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
		hasMore: boolean;
	};
}

export interface PendingUsersFilter {
	gender?: 'MALE' | 'FEMALE';
	minAge?: number;
	maxAge?: number;
	universityId?: string;
	region?: string;
}

export type ReportCountry = 'kr' | 'jp';
export type CrossBorderDirection = 'all' | 'kr_to_jp' | 'jp_to_kr';
export type ReportTargetType = 'profile' | 'community' | 'cross_border';
export type ReportAction = 'dismissed' | 'warned' | 'suspended' | 'banned' | 'escalated';
type BackendReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed';

export interface CrossBorderReportParty {
	id: string;
	name: string;
	email: string;
	phoneNumber: string;
	age: number | null;
	gender: 'MALE' | 'FEMALE' | null;
	profileImageUrl: string;
	country: ReportCountry | null;
	schema: ReportCountry | null;
	universityName: string | null;
}

export interface CrossBorderReportItem {
	id: string;
	type: 'cross_border';
	direction: 'kr_to_jp' | 'jp_to_kr' | null;
	sourceSchema: ReportCountry | null;
	reporter: CrossBorderReportParty;
	reported: CrossBorderReportParty;
	reason: string;
	description: string | null;
	translatedDescription: string | null;
	descriptionLanguage: string | null;
	evidenceImages: string[];
	status: 'pending' | 'reviewing' | 'resolved' | 'rejected';
	severity: 'urgent' | 'normal' | null;
	category: string | null;
	slackDelivered?: boolean;
	reportCount?: number;
	chatRoomId?: string;
	chatRoomCountry: ReportCountry | null;
	resolvedBy: string | null;
	resolvedByName: string | null;
	resolvedAt: string | null;
	createdAt: string;
	updatedAt: string | null;
}

export interface ReportHistoryEntry {
	id: string;
	reportType: ReportTargetType;
	reportId: string;
	reviewerId: string | null;
	reviewerName: string | null;
	previousStatus: string;
	nextStatus: string;
	action: ReportAction;
	note: string | null;
	createdAt: string | null;
}

type UpdateReportStatusOptions =
	| string
	| {
			type?: ReportTargetType;
			action?: ReportAction;
			note?: string | null;
			suspendDays?: 3 | 7 | 14 | 30;
			suspendPermanent?: boolean;
			approverId?: string;
	  };

function normalizeFrontendReportStatus(status?: string | null): 'pending' | 'reviewing' | 'resolved' | 'rejected' {
	const normalized = status?.toLowerCase();

	if (normalized === 'reviewing') return 'reviewing';
	if (normalized === 'resolved') return 'resolved';
	if (normalized === 'rejected' || normalized === 'dismissed') return 'rejected';
	return 'pending';
}

function toBackendReportStatus(
	status: 'pending' | 'reviewing' | 'resolved' | 'rejected',
): BackendReportStatus {
	return status === 'rejected' ? 'dismissed' : status;
}

function toDefaultReportAction(status: BackendReportStatus): ReportAction {
	if (status === 'dismissed') return 'dismissed';
	if (status === 'resolved') return 'warned';
	return 'escalated';
}

function normalizeReportUpdateOptions(options?: UpdateReportStatusOptions) {
	if (typeof options === 'string') {
		return {
			type: 'profile' as const,
			note: options,
		};
	}

	return {
		type: options?.type ?? 'profile',
		action: options?.action,
		note: options?.note ?? null,
		suspendDays: options?.suspendDays,
		suspendPermanent: options?.suspendPermanent,
		approverId: options?.approverId?.trim() || undefined,
	};
}

function normalizeReportCountry(value: unknown): ReportCountry | null {
	if (typeof value !== 'string') return null;
	const lower = value.trim().toLowerCase();
	if (lower === 'kr' || lower === 'jp') return lower;
	return null;
}

interface ParsedEvidencePayload {
	evidenceKeys?: unknown;
	evidenceImages?: unknown;
	images?: unknown;
	description?: unknown;
	translatedDescription?: unknown;
	descriptionLanguage?: unknown;
}

function parseCrossBorderEvidence(
	rawEvidence: unknown,
	explicitImages?: unknown,
	explicitDescription?: unknown,
	explicitTranslatedDescription?: unknown,
	explicitDescriptionLanguage?: unknown,
): {
	evidenceImages: string[];
	description: string | null;
	translatedDescription: string | null;
	descriptionLanguage: string | null;
} {
	let parsedObj: ParsedEvidencePayload | null = null;
	let fallbackText: string | null = null;

	if (typeof rawEvidence === 'string' && rawEvidence.trim()) {
		try {
			const parsed = JSON.parse(rawEvidence);
			if (parsed && typeof parsed === 'object') {
				parsedObj = parsed as ParsedEvidencePayload;
			}
		} catch {
			fallbackText = rawEvidence.trim();
		}
	} else if (rawEvidence && typeof rawEvidence === 'object') {
		parsedObj = rawEvidence as ParsedEvidencePayload;
	}

	const rawImages: unknown[] =
		Array.isArray(explicitImages) && explicitImages.length > 0
			? explicitImages
			: Array.isArray(parsedObj?.evidenceImages)
				? parsedObj.evidenceImages
				: Array.isArray(parsedObj?.evidenceKeys)
					? parsedObj.evidenceKeys
					: Array.isArray(parsedObj?.images)
						? parsedObj.images
						: [];

	const evidenceImages = rawImages.filter(
		(entry: unknown): entry is string => typeof entry === 'string' && entry.length > 0,
	);

	const description =
		typeof explicitDescription === 'string' && explicitDescription.length > 0
			? explicitDescription
			: typeof parsedObj?.description === 'string' && parsedObj.description.length > 0
				? parsedObj.description
				: fallbackText;

	const translatedDescription =
		typeof explicitTranslatedDescription === 'string' && explicitTranslatedDescription.trim().length > 0
			? explicitTranslatedDescription
			: typeof parsedObj?.translatedDescription === 'string' &&
				  parsedObj.translatedDescription.trim().length > 0
				? parsedObj.translatedDescription
				: null;

	const descriptionLanguage = normalizeDisplayText(
		explicitDescriptionLanguage ?? parsedObj?.descriptionLanguage,
	);

	return { evidenceImages, description, translatedDescription, descriptionLanguage };
}

/** 목록·상세 공통: 백엔드 행(camelCase)을 화면 Report/ReportDetail 형태로 정규화. */
function transformReportItem(item: any) {
	return {
		id: item.id,
		reporter: {
			id: item.reporter?.id || item.reporterId,
			name: item.reporter?.name || item.reporterName || '알 수 없음',
			email: item.reporter?.email || '',
			phoneNumber: item.reporter?.phoneNumber || '',
			age: item.reporter?.age ?? item.reporterAge ?? null,
			gender: (item.reporter?.gender || item.reporterGender || null) as 'MALE' | 'FEMALE' | null,
			profileImageUrl: item.reporter?.profileImageUrl || '',
		},
		reported: {
			id: item.reported?.id || item.reportedId,
			name: item.reported?.name || item.reportedName || '알 수 없음',
			email: item.reported?.email || '',
			phoneNumber: item.reported?.phoneNumber || '',
			age: item.reported?.age ?? item.reportedAge ?? null,
			gender: (item.reported?.gender || item.reportedGender || null) as 'MALE' | 'FEMALE' | null,
			profileImageUrl: item.reported?.profileImageUrl || '',
		},
		reason: item.reason || '',
		description: item.description || null,
		evidenceImages: item.evidenceImages || item.evidence_images || [],
		status: normalizeFrontendReportStatus(item.status),
		severity: item.severity || null,
		category: item.category || null,
		slackDelivered: item.slackDelivered === true || item.slack_delivered_at != null,
		reportCount: typeof item.reportCount === 'number' ? item.reportCount : undefined,
		chatRoomId: item.chatRoomId || item.chat_room_id || undefined,
		matchId: item.matchId || item.match_id || undefined,
		createdAt: item.createdAt || item.created_at,
		updatedAt: item.updatedAt || item.updated_at || null,
	};
}

function transformCrossBorderReportItem(item: any): CrossBorderReportItem {
	const reporterCountry = normalizeReportCountry(
		item.reporter?.country ??
			item.reporter?.schema ??
			item.reporterCountry ??
			item.reporterSchema ??
			item.reporter_schema,
	);
	const reportedCountry = normalizeReportCountry(
		item.reported?.country ??
			item.reported?.schema ??
			item.reportedCountry ??
			item.reportedSchema ??
			item.reported_schema,
	);
	const sourceSchema =
		normalizeReportCountry(item.sourceSchema ?? item.source_schema) ?? reporterCountry;

	const explicitDirection = item.direction;
	const direction: 'kr_to_jp' | 'jp_to_kr' | null =
		explicitDirection === 'kr_to_jp' || explicitDirection === 'jp_to_kr'
			? explicitDirection
			: reporterCountry === 'kr' && reportedCountry === 'jp'
				? 'kr_to_jp'
				: reporterCountry === 'jp' && reportedCountry === 'kr'
					? 'jp_to_kr'
					: null;

	const {
		evidenceImages,
		description,
		translatedDescription,
		descriptionLanguage,
	} = parseCrossBorderEvidence(
		item.evidence,
		item.evidenceImages ?? item.evidence_images,
		item.description,
		item.translatedDescription ?? item.translated_description,
		item.descriptionLanguage ?? item.description_language,
	);

	const resolvedAt = item.resolvedAt ?? item.resolved_at ?? null;
	const createdAt = item.createdAt ?? item.created_at ?? item.reportedAt ?? item.reported_at ?? '';

	return {
		id: item.id,
		type: 'cross_border',
		direction,
		sourceSchema,
		reporter: {
			id: item.reporter?.id || item.reporterId || item.reporterUserId || item.reporter_user_id || '',
			name: normalizeDisplayText(item.reporter?.name ?? item.reporterName) || '알 수 없음',
			email: item.reporter?.email || item.reporterEmail || '',
			phoneNumber: item.reporter?.phoneNumber || item.reporterPhoneNumber || '',
			age: item.reporter?.age ?? item.reporterAge ?? null,
			gender: (item.reporter?.gender || item.reporterGender || null) as 'MALE' | 'FEMALE' | null,
			profileImageUrl: item.reporter?.profileImageUrl || item.reporterProfileImageUrl || '',
			country: reporterCountry,
			schema: reporterCountry,
			universityName: normalizeDisplayText(
				item.reporter?.universityName ?? item.reporterUniversityName,
			),
		},
		reported: {
			id: item.reported?.id || item.reportedId || item.reportedUserId || item.reported_user_id || '',
			name: normalizeDisplayText(item.reported?.name ?? item.reportedName) || '알 수 없음',
			email: item.reported?.email || item.reportedEmail || '',
			phoneNumber: item.reported?.phoneNumber || item.reportedPhoneNumber || '',
			age: item.reported?.age ?? item.reportedAge ?? null,
			gender: (item.reported?.gender || item.reportedGender || null) as 'MALE' | 'FEMALE' | null,
			profileImageUrl: item.reported?.profileImageUrl || item.reportedProfileImageUrl || '',
			country: reportedCountry,
			schema: reportedCountry,
			universityName: normalizeDisplayText(
				item.reported?.universityName ?? item.reportedUniversityName,
			),
		},
		reason: item.reason || '',
		description,
		translatedDescription,
		descriptionLanguage,
		evidenceImages,
		status: normalizeFrontendReportStatus(item.status),
		severity: item.severity === 'urgent' || item.severity === 'normal' ? item.severity : null,
		category: item.category || null,
		slackDelivered:
			typeof item.slackDelivered === 'boolean'
				? item.slackDelivered
				: item.slack_delivered_at != null
					? true
					: undefined,
		reportCount: typeof item.reportCount === 'number' ? item.reportCount : undefined,
		chatRoomId: item.chatRoomId || item.chat_room_id || undefined,
		chatRoomCountry:
			normalizeReportCountry(item.chatRoomCountry ?? item.chat_room_country) ?? sourceSchema,
		resolvedBy: normalizeDisplayText(
			item.resolvedBy ?? item.resolved_by ?? item.resolvedByAdmin ?? item.resolved_by_admin,
		),
		resolvedByName: normalizeDisplayText(item.resolvedByName ?? item.resolved_by_name),
		resolvedAt: resolvedAt ? String(resolvedAt) : null,
		createdAt: createdAt ? String(createdAt) : '',
		updatedAt: item.updatedAt || item.updated_at || (resolvedAt ? String(resolvedAt) : null),
	};
}

function normalizeReportHistoryEntry(item: any): ReportHistoryEntry {
	return {
		id: item.id,
		reportType: (item.reportType ?? item.report_type ?? 'profile') as ReportTargetType,
		reportId: item.reportId ?? item.report_id,
		reviewerId: normalizeDisplayText(item.reviewerId ?? item.reviewer_id),
		reviewerName:
			normalizeDisplayText(item.reviewerName) ??
			normalizeDisplayText(item.reviewer_name) ??
			normalizeDisplayText(item.reviewedBy),
		previousStatus: item.previousStatus ?? item.previous_status,
		nextStatus: item.nextStatus ?? item.next_status,
		action: item.action,
		note: normalizeDisplayText(item.note),
		createdAt: item.createdAt ?? item.created_at ?? null,
	};
}

export const reports = {
	getProfileReports: async (params: URLSearchParams) => {
		try {
			;

			const page = params.get('page') || '1';
			const limit = params.get('limit') || '10';
			const status = params.get('status');

			const queryParams = new URLSearchParams();
			queryParams.append('type', 'profile');
			queryParams.append('page', page);
			queryParams.append('limit', limit);
			if (status) {
				const statusMap: Record<string, string> = {
					pending: 'PENDING',
					reviewing: 'REVIEWING',
					resolved: 'RESOLVED',
					rejected: 'DISMISSED',
				};
				queryParams.append('status', statusMap[status] || status);
			}
			const reporterName = params.get('reporterName');
			const reportedName = params.get('reportedName');
			if (reporterName) queryParams.append('reporterName', reporterName);
			if (reportedName) queryParams.append('reportedName', reportedName);
			if (params.get('urgent') === 'true') queryParams.append('urgent', 'true');
			if (params.get('slackUndelivered') === 'true')
				queryParams.append('slackUndelivered', 'true');

			const endpoint = `/admin/v2/reports?${queryParams.toString()}`;
			;

			const response = await adminGet<{ data: any[]; meta: any }>(endpoint);

			const transformedItems = (response.data || []).map(transformReportItem);

			return {
				items: transformedItems,
				meta: response.meta,
			};
		} catch (error: any) {
			throw error;
		}
	},

	getProfileReportDetail: async (reportId: string) => {
		try {
			const result = await adminGet<{ data: any }>(
				`/admin/v2/reports/${reportId}`,
			);
			return transformReportItem(result.data ?? {});
		} catch (error: any) {
			throw error;
		}
	},

	updateReportStatus: async (
		reportId: string,
		status: 'pending' | 'reviewing' | 'resolved' | 'rejected',
		options?: UpdateReportStatusOptions,
	) => {
		try {
			const backendStatus = toBackendReportStatus(status);
			const normalizedOptions = normalizeReportUpdateOptions(options);
			const result = await adminPatch<{ data: any }>(
				`/admin/v2/reports/${reportId}/status`,
				{
					type: normalizedOptions.type,
					status: backendStatus,
					action: normalizedOptions.action ?? toDefaultReportAction(backendStatus),
					note: normalizedOptions.note,
					suspendDays: normalizedOptions.suspendDays,
					suspendPermanent: normalizedOptions.suspendPermanent,
					approverId: normalizedOptions.approverId,
				},
			);
			return result.data;
		} catch (error: any) {
			throw error;
		}
	},

	getProfileReportHistory: async (reportId: string): Promise<ReportHistoryEntry[]> => {
		try {
			const result = await adminGet<{ data: any[] }>(`/admin/v2/reports/${reportId}/history`);
			return (result.data || [])
				.map((item: any) => normalizeReportHistoryEntry(item))
				.sort((left, right) => {
					const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
					const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
					return rightTime - leftTime;
				});
		} catch (error: any) {
			return [];
		}
	},

	getCrossBorderReports: async (params: URLSearchParams) => {
		try {
			const page = params.get('page') || '1';
			const limit = params.get('limit') || '10';
			const status = params.get('status');
			const direction = params.get('direction');
			const reporterName = params.get('reporterName');
			const reportedName = params.get('reportedName');
			const startDate = params.get('startDate');
			const endDate = params.get('endDate');

			const queryParams = new URLSearchParams();
			queryParams.append('page', page);
			queryParams.append('limit', limit);
			if (status) {
				const statusMap: Record<string, string> = {
					pending: 'pending',
					reviewing: 'reviewing',
					resolved: 'resolved',
					rejected: 'dismissed',
				};
				queryParams.append('status', statusMap[status] || status.toLowerCase());
			}
			if (direction === 'kr_to_jp' || direction === 'jp_to_kr') {
				queryParams.append('direction', direction);
			}
			if (reporterName) queryParams.append('reporterName', reporterName);
			if (reportedName) queryParams.append('reportedName', reportedName);
			if (startDate) queryParams.append('startDate', startDate);
			if (endDate) queryParams.append('endDate', endDate);
			if (params.get('urgent') === 'true') queryParams.append('urgent', 'true');

			const endpoint = `/admin/v2/reports/cross-border?${queryParams.toString()}`;
			const response = await adminGet<{ data: any[]; meta: any }>(endpoint);

			return {
				items: (response.data || []).map(transformCrossBorderReportItem),
				meta: response.meta,
			};
		} catch (error: any) {
			throw error;
		}
	},

	getCrossBorderReportDetail: async (reportId: string): Promise<CrossBorderReportItem> => {
		try {
			const result = await adminGet<{ data: any }>(
				`/admin/v2/reports/cross-border/${encodeURIComponent(reportId)}`,
			);
			return transformCrossBorderReportItem(result.data ?? {});
		} catch (error: any) {
			throw error;
		}
	},

	getCrossBorderReportHistory: async (reportId: string): Promise<ReportHistoryEntry[]> => {
		try {
			const result = await adminGet<{ data: any[] }>(
				`/admin/v2/reports/cross-border/${encodeURIComponent(reportId)}/history`,
			);
			return (result.data || [])
				.map((item: any) => normalizeReportHistoryEntry(item))
				.sort((left, right) => {
					const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
					const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
					return rightTime - leftTime;
				});
		} catch (error: any) {
			return [];
		}
	},

	updateCrossBorderReportStatus: async (
		reportId: string,
		status: 'pending' | 'reviewing' | 'resolved' | 'rejected',
		options?: UpdateReportStatusOptions,
	) => {
		try {
			const backendStatus = toBackendReportStatus(status);
			const normalizedOptions = normalizeReportUpdateOptions(options);
			const result = await adminPatch<{ data: any }>(
				`/admin/v2/reports/cross-border/${encodeURIComponent(reportId)}/status`,
				{
					type: 'cross_border',
					status: backendStatus,
					action: normalizedOptions.action ?? toDefaultReportAction(backendStatus),
					note: normalizedOptions.note,
					suspendDays: normalizedOptions.suspendDays,
					suspendPermanent: normalizedOptions.suspendPermanent,
					approverId: normalizedOptions.approverId,
				},
			);
			return result.data;
		} catch (error: any) {
			throw error;
		}
	},

	getChatHistory: async (
		chatRoomId: string,
		page: number = 1,
		limit: number = 50,
		country?: ReportCountry,
	) => {
		try {
			const query = {
				page: String(page),
				limit: String(limit),
			};
			const result = country
				? await adminGet<{ data: any }>(`/admin/v2/chat/rooms/${chatRoomId}/messages`, query, {
						headers: { 'x-country': country },
					})
				: await adminGet<{ data: any }>(`/admin/v2/chat/rooms/${chatRoomId}/messages`, query);
			return result.data;
		} catch (error: any) {
			throw error;
		}
	},

	getUserProfileImages: async (userId: string, country?: ReportCountry): Promise<string[]> => {
		try {
			const endpoint = `/admin/v2/community/users/${userId}/profile-images`;
			const res = country
				? await adminGet<{ data: any }>(endpoint, undefined, {
						headers: { 'x-country': country },
					})
				: await adminGet<{ data: any }>(endpoint);
			const data = res.data;
			const images = data.images || [];
			return images.map((img: any) => (typeof img === 'string' ? img : img.url));
		} catch (error: any) {
			throw error;
		}
	},
};

export const userReview = {
	getPendingUsers: async (
		page: number = 1,
		limit: number = 20,
		search?: string,
		filters?: PendingUsersFilter,
		excludeUserIds?: string[],
	) => {
		try {
			;

			const stringParams: Record<string, string> = {
				page: String(page),
				limit: String(limit),
			};
			if (search) stringParams.search = search;
			if (filters?.gender) stringParams.gender = filters.gender;
			if (filters?.minAge) stringParams.minAge = String(filters.minAge);
			if (filters?.maxAge) stringParams.maxAge = String(filters.maxAge);
			if (filters?.universityId) stringParams.universityId = filters.universityId;
			if (filters?.region) stringParams.region = filters.region;
			if (excludeUserIds && excludeUserIds.length > 0) {
				stringParams.excludeUserIds = excludeUserIds.join(',');
			}

			const result = await adminGet<{ data: any; meta: any }>('/admin/v2/profile-review/pending', stringParams);

			;
			return { data: result.data, meta: result.meta };
		} catch (error: any) {
			throw error;
		}
	},

	getUserDetail: async (userId: string) => {
		try {
			;

			const result = await adminGet<{ data: any }>(`/admin/v2/profile-review/users/${userId}`);

			;
			return result.data;
		} catch (error: any) {
			throw error;
		}
	},

	approveUser: async (userId: string) => {
		try {
			;

			await adminPost(`/admin/v2/profile-review/users/${userId}/approve-profile`);
			return;
		} catch (error: any) {
			throw error;
		}
	},

	rejectUser: async (userId: string, category: string, reason: string) => {
		try {
			;

			await adminPost(`/admin/v2/profile-review/users/${userId}/reject-profile`, {
				category,
				reason,
			});

			return;
		} catch (error: any) {
			throw error;
		}
	},

	bulkRejectUsers: async (
		userIds: string[],
		category: string,
		reason: string,
		onProgress?: (current: number, total: number) => void,
	) => {
		const results: Array<{ userId: string; success: boolean; error?: string }> = [];

		for (let i = 0; i < userIds.length; i++) {
			const userId = userIds[i];
			try {
				await userReview.rejectUser(userId, category, reason);
				results.push({ userId, success: true });
				onProgress?.(i + 1, userIds.length);
			} catch (error: any) {
				results.push({
					userId,
					success: false,
					error: error.response?.data?.message || error.message,
				});
				onProgress?.(i + 1, userIds.length);
			}
		}

		return results;
	},

	bulkApproveUsers: async (
		userIds: string[],
		onProgress?: (current: number, total: number) => void,
	) => {
		const results: Array<{ userId: string; success: boolean; error?: string }> = [];

		for (let i = 0; i < userIds.length; i++) {
			const userId = userIds[i];
			try {
				await userReview.approveUser(userId);
				results.push({ userId, success: true });
				onProgress?.(i + 1, userIds.length);
			} catch (error: any) {
				results.push({
					userId,
					success: false,
					error: error.response?.data?.message || error.message,
				});
				onProgress?.(i + 1, userIds.length);
			}
		}

		return results;
	},

	updateUserRank: async (
		userId: string,
		rank: 'S' | 'A' | 'B' | 'C' | 'UNKNOWN',
		emitEvent: boolean = false,
	) => {
		try {
			;

			const url = `/admin/v2/profile-review/users/${userId}/rank${emitEvent ? '?emitEvent=true' : ''}`;
			await adminPatch(url, { rank });
			return;
		} catch (error: any) {
			throw error;
		}
	},

	getImageValidation: async (imageId: string) => {
		const result = await adminGet<{ data: any }>(`/admin/v2/profile-images/${imageId}/validation`);
		return result.data;
	},

	getReviewHistory: async (filters: ReviewHistoryFilter = {}): Promise<ReviewHistoryResponse> => {
		try {
			const stringParams: Record<string, string> = {};
			if (filters.page) stringParams.page = String(filters.page);
			if (filters.limit) stringParams.limit = String(filters.limit);
			if (filters.reviewStatus) {
				const reviewTypeMap: Record<string, string> = { approved: 'approval', rejected: 'rejection' };
				stringParams.reviewType = reviewTypeMap[filters.reviewStatus] || filters.reviewStatus;
			}
			if (filters.gender) stringParams.gender = filters.gender;
			if (filters.from) stringParams.from = filters.from;
			if (filters.to) stringParams.to = filters.to;
			if (filters.reviewedBy) stringParams.reviewer = filters.reviewedBy;

			const response = await adminGet<{ data: any[]; meta: any }>('/admin/v2/profile-review/history', stringParams);

			const rawItems = response.data;
			const meta = response.meta;
			const data = (rawItems || []).map((item: any) => ({
				imageId: item.imageId,
				imageUrl: item.url,
				slotIndex: item.slotIndex ?? 0,
				isMain: item.isMain ?? false,
				reviewStatus: item.reviewStatus,
				reviewType: item.reviewType ?? null,
				reviewedBy:
					normalizeDisplayText(item.reviewerName) ??
					normalizeDisplayText(item.reviewedBy),
				reviewedAt: item.reviewedAt,
				rejectionReason: normalizeDisplayText(item.reason),
				user: {
					userId: item.userId,
					name: normalizeDisplayText(item.userName),
					gender: normalizeDisplayText(item.gender),
					age: item.age,
				},
			}));
			return {
				items: data,
				pagination: {
					page: meta.page,
					limit: meta.limit,
					total: meta.total,
					totalPages: meta.totalPages,
					hasMore: meta.page < meta.totalPages,
				},
			};
		} catch (error: any) {
			throw error;
		}
	},
};

export const profileImages = {
	getPendingProfileImages: async () => {
		try {
			;

			const result = await adminGet<{ data: any; meta: any }>('/admin/v2/profile-review/pending');

			;
			return { data: result.data, meta: result.meta };
		} catch (error: any) {
			throw error;
		}
	},

	approveProfileImage: async (userId: string) => {
		try {
			;

			await adminPost(`/admin/v2/profile-review/users/${userId}/approve-profile`);
			return;
		} catch (error: any) {
			throw error;
		}
	},

	rejectProfileImage: async (userId: string, rejectionReason: string) => {
		try {
			;

			await adminPost(`/admin/v2/profile-review/users/${userId}/reject-profile`, {
				category: 'image',
				reason: rejectionReason,
			});

			return;
		} catch (error: any) {
			throw error;
		}
	},

	approveIndividualImage: async (imageId: string) => {
		try {
			;

			await adminPost(`/admin/v2/profile-review/images/${imageId}/action`, {
				action: 'approve',
			});

			return;
		} catch (error: any) {
			throw error;
		}
	},

	rejectIndividualImage: async (imageId: string, rejectionReason: string) => {
		try {
			;

			await adminPost(`/admin/v2/profile-review/images/${imageId}/action`, {
				action: 'reject',
				reason: rejectionReason,
			});

			return;
		} catch (error: any) {
			throw error;
		}
	},

	setMainImage: async (userId: string, imageId: string) => {
		try {
			;

			await adminPost(
				`/admin/v2/profile-review/images/${imageId}/action`,
				{ action: 'setMain' },
			);

			return;
		} catch (error: any) {
			throw error;
		}
	},
};
