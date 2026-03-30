import { adminGet, adminPost, adminPatch, adminRequest } from '@/shared/lib/http/admin-fetch';
import type {
	DeletedFemalesListResponse,
	RestoreFemaleResponse,
	SleepFemaleResponse,
} from '@/types/admin';
import type { FormattedData } from './_shared';

export const userAppearance = {
	getUsersWithAppearanceGrade: async (params: {
		page?: number;
		limit?: number;
		gender?: 'MALE' | 'FEMALE';
		appearanceGrade?: 'S' | 'A' | 'B' | 'C' | 'UNKNOWN';
		universityName?: string;
		minAge?: number;
		maxAge?: number;
		searchTerm?: string;
		region?: string;
		useCluster?: boolean;
		isLongTermInactive?: boolean;
		hasPreferences?: boolean;
		includeDeleted?: boolean;
		userStatus?: 'pending' | 'approved' | 'rejected';
	}) => {
		try {
			;

			const queryParams = new URLSearchParams();

			if (params.page) queryParams.append('page', params.page.toString());
			if (params.limit) queryParams.append('limit', params.limit.toString());
			if (params.gender) {
				;
				queryParams.append('gender', params.gender);
			}

			if (params.appearanceGrade) {
				;
				queryParams.append('appearanceGrade', params.appearanceGrade);
			}

			if (params.universityName) queryParams.append('universityName', params.universityName);
			if (params.minAge) queryParams.append('minAge', params.minAge.toString());
			if (params.maxAge) queryParams.append('maxAge', params.maxAge.toString());
			if (params.searchTerm) queryParams.append('search', params.searchTerm);
			if (params.region) queryParams.append('region', params.region);
			if (params.useCluster !== undefined)
				queryParams.append('useCluster', params.useCluster.toString());
			if (params.isLongTermInactive !== undefined)
				queryParams.append('isLongTermInactive', params.isLongTermInactive.toString());
			if (params.hasPreferences !== undefined)
				queryParams.append('hasPreferences', params.hasPreferences.toString());
			if (params.includeDeleted !== undefined)
				queryParams.append('includeDeleted', params.includeDeleted.toString());
			if (params.userStatus) queryParams.append('userStatus', params.userStatus);

			queryParams.append('filter', 'all');

			const url = `/admin/v2/users?${queryParams.toString()}`;
			;
			;

			try {
				const result = await adminGet<{ data: any[]; meta: any }>(url);
				const rawData = result.data ?? [];
				const normalizedData = rawData.map((user: any) => ({
					...user,
					id: user.id ?? user.userId,
					appearanceGrade: user.appearanceGrade ?? user.rank ?? 'UNKNOWN',
					profileImageUrl: user.profileImageUrl ?? user.images?.[0]?.url ?? null,
					profileImages: user.profileImages ?? user.images?.map((img: any, idx: number) => ({
						id: img.imageId ?? `${user.userId}-${idx}`,
						url: img.url,
						order: img.slotIndex ?? idx,
						isMain: img.isMain ?? idx === 0,
					})) ?? [],
				}));
				return { data: normalizedData, meta: result.meta };
			} catch (error: any) {
				throw error;
			}
		} catch (error: any) {
			throw error;
		}
	},

	getUnclassifiedUsers: async (page: number, limit: number, region?: string) => {
		try {
			const params = new URLSearchParams();
			params.append('page', page.toString());
			params.append('limit', limit.toString());
			if (region) params.append('region', region);

			const result = await adminGet<{ data: any[]; meta: any }>(
				`/admin/v2/users?filter=ungraded&${params.toString()}`,
			);

			return { data: result.data, meta: result.meta };
		} catch (error) {
			throw error;
		}
	},

	setUserAppearanceGrade: async (userId: string, grade: 'S' | 'A' | 'B' | 'C' | 'UNKNOWN') => {
		;

		if (!userId) {
			throw new Error('유저 ID가 없습니다.');
		}

		if (!grade) {
			throw new Error('등급이 없습니다.');
		}

		try {
			const result = await adminPatch<{ data: any }>(`/admin/v2/users/${userId}/appearance`, { rank: grade });
			return result.data;
		} catch (error: any) {
			throw error;
		}
	},

	getUniversityVerificationPendingUsers: async (params: {
		page?: number;
		limit?: number;
		name?: string;
		university?: string;
	}) => {
		return adminGet<{
			users: unknown[];
			total: number;
			page: number;
			limit: number;
			totalPages: number;
		}>('/admin/university-verification/pending', {
			page: String(params.page ?? 1),
			limit: String(params.limit ?? 10),
			name: params.name ?? '',
			university: params.university ?? '',
		});
	},

	bulkSetUserAppearanceGrade: async (
		userIds: string[],
		grade: 'S' | 'A' | 'B' | 'C' | 'UNKNOWN',
	) => {
		;

		try {
			const result = await adminPatch<{ data: any }>('/admin/v2/users/appearance/bulk', {
				userIds,
				rank: grade,
			});
			return result.data;
		} catch (error) {
			throw error;
		}
	},

	getUserDetails: async (userId: string) => {
		try {
			;

			const endpoint = `/admin/v2/users/${userId}`;
			;

			const result = await adminGet<{ data: any }>(endpoint);

			const data = result.data;

			// id 필드 정규화
			if (!data.id && data.userId) {
				data.id = data.userId;
			}

			// appearanceGrade 정규화 (API는 rank 필드 사용)
			if (!data.appearanceGrade && data.rank) {
				data.appearanceGrade = data.rank;
			}

			// 프로필 이미지 정규화: images, profileImageUrls, profileImages 모두 지원
			if (data.images && Array.isArray(data.images) && data.images.length > 0) {
				data.profileImages = data.images.map((img: any, index: number) => ({
					id: img.imageId ?? `${userId}-${index}`,
					url: img.url,
					order: img.slotIndex ?? index,
					isMain: img.isMain ?? index === 0,
				}));
				data.profileImageUrl = data.images.find((img: any) => img.isMain)?.url ?? data.images[0].url;
			} else if (
				data.profileImageUrls &&
				Array.isArray(data.profileImageUrls) &&
				data.profileImageUrls.length > 0
			) {
				data.profileImages = data.profileImageUrls.map((url: string, index: number) => ({
					id: `${userId}-${index}`,
					url: url,
					order: index,
					isMain: index === 0,
				}));
				data.profileImageUrl = data.profileImageUrls[0];
			}

			return data;
		} catch (error: any) {
			throw error;
		}
	},

	getUserTickets: async (userId: string) => {
		try {
			const endpoint = `/admin/tickets/user/${userId}`;

			const result = await adminGet<any>(endpoint);

			return result;
		} catch (error: any) {
			throw error;
		}
	},

	createUserTickets: async (userId: string, count: number) => {
		try {
			const endpoint = `/admin/tickets`;

			const result = await adminPost<any>(endpoint, {
				userId,
				count,
			});

			return result;
		} catch (error: any) {
			throw error;
		}
	},

	deleteUserTickets: async (userId: string, count: number) => {
		try {
			const endpoint = `/admin/tickets`;

			const result = await adminRequest<any>(endpoint, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId, count }),
			});

			return result;
		} catch (error: any) {
			throw error;
		}
	},

	getUserGems: async (userId: string) => {
		try {
			const endpoint = `/admin/gems/users/${userId}/balance`;

			const result = await adminGet<any>(endpoint);

			return result;
		} catch (error: any) {
			throw error;
		}
	},

	addUserGems: async (userId: string, amount: number) => {
		try {
			const endpoint = `/admin/gems/users/${userId}/add`;

			const result = await adminPost<any>(endpoint, { amount });

			return result;
		} catch (error: any) {
			throw error;
		}
	},

	removeUserGems: async (userId: string, amount: number) => {
		try {
			const endpoint = `/admin/gems/users/${userId}/deduct`;

			const result = await adminPost<any>(endpoint, { amount });

			return result;
		} catch (error: any) {
			throw error;
		}
	},

	updateUserProfile: async (userId: string, profileData: any) => {
		try {
			;
			;

			const endpoint = `/admin/users/detail/profile`;
			;

			const requestData = {
				userId: userId,
				name: profileData.name,
				email: profileData.email,
				phoneNumber: profileData.phoneNumber,
				instagramId: profileData.instagramId,
				mbti: profileData.mbti,
			};

			;

			const result = await adminPost<any>(endpoint, requestData);
			return result;
		} catch (error: any) {
			throw error;
		}
	},

	updateAccountStatus: async (
		userId: string,
		status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
		reason?: string,
	) => {
		try {
			;

			const result = await adminPost<any>('/admin/users/detail/status', {
				userId,
				status,
				reason,
			});

			return result;
		} catch (error: any) {
			throw error;
		}
	},

	sendWarningMessage: async (userId: string, message: string) => {
		try {
			;

			const result = await adminPost<any>('/admin/users/detail/warning', {
				userId,
				message,
			});

			return result;
		} catch (error: any) {
			throw error;
		}
	},

	sendEmailNotification: async (userId: string, subject: string, message: string) => {
		try {
			;

			const result = await adminPost<any>('/admin/notification/email', {
				userId,
				subject,
				message,
			});

			return result;
		} catch (error: any) {
			throw error;
		}
	},

	sendSmsNotification: async (userId: string, message: string) => {
		try {
			;

			const result = await adminPost<any>('/admin/notification/sms', {
				userId,
				message,
			});

			return result;
		} catch (error: any) {
			throw error;
		}
	},

	forceLogout: async (userId: string) => {
		try {
			;

			const result = await adminPost<any>('/admin/users/detail/logout', {
				userId,
			});

			return result;
		} catch (error: any) {
			throw error;
		}
	},

	sendProfileUpdateRequest: async (userId: string, message: string) => {
		try {
			;

			const result = await adminPost<any>('/admin/users/detail/profile-update-request', {
				userId,
				message,
			});

			return result;
		} catch (error: any) {
			throw error;
		}
	},

	setInstagramError: async (userId: string) => {
		try {
			;

			const result = await adminPost<any>('/admin/users/detail/instagram-error', {
				userId,
			});

			return result;
		} catch (error: any) {
			throw error;
		}
	},

	resetInstagramError: async (userId: string) => {
		try {
			;

			const result = await adminPost<any>('/admin/users/detail/instagram-reset', {
				userId,
			});

			return result;
		} catch (error: any) {
			throw error;
		}
	},

	getAppearanceGradeStats: async (region?: string, useCluster?: boolean) => {
		try {
			;

			const endpoint = '/admin/users/appearance/stats';
			;

			const timestamp = new Date().getTime();

			const params = new URLSearchParams();
			params.append('_t', timestamp.toString());
			if (region) params.append('region', region);
			if (useCluster !== undefined) params.append('useCluster', useCluster.toString());

			const finalUrl = `${endpoint}?${params.toString()}`;

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			let responseData: any;

			try {
				const result = await adminGet<any>(finalUrl);

				if (!result || Object.keys(result).length === 0) {
					return null;
				} else {
					responseData = result;
				}
			} catch (error) {
				throw error;
			}

			;

			const formattedData: FormattedData = {
				total: 0,
				stats: [],
				genderStats: [],
				unknownBreakdown: undefined,
			};

			if (typeof responseData === 'object' && responseData !== null) {
				;
				;

				if (responseData.all && responseData.male && responseData.female) {
					;

					const allStats = responseData.all;
					formattedData.total = allStats.total || 0;

					const grades = ['S', 'A', 'B', 'C', 'UNKNOWN'];
					formattedData.stats = grades.map((grade) => {
						const count = allStats[grade] || 0;
						const percentage = allStats.total > 0 ? (count / allStats.total) * 100 : 0;

						return {
							grade,
							count,
							percentage,
						};
					});

					formattedData.genderStats = [
						{
							gender: 'MALE',
							stats: grades.map((grade) => {
								const count = responseData.male[grade] || 0;
								const percentage =
									responseData.male.total > 0 ? (count / responseData.male.total) * 100 : 0;

								return {
									grade,
									count,
									percentage,
								};
							}),
						},
						{
							gender: 'FEMALE',
							stats: grades.map((grade) => {
								const count = responseData.female[grade] || 0;
								const percentage =
									responseData.female.total > 0 ? (count / responseData.female.total) * 100 : 0;

								return {
									grade,
									count,
									percentage,
								};
							}),
						},
					];

					if (responseData.unknownBreakdown) {
						formattedData.unknownBreakdown = responseData.unknownBreakdown;
					}

					;
					;
				} else {
					;

					if ('total' in responseData) {
						formattedData.total = responseData.total || 0;
					} else if ('data' in responseData && 'total' in responseData.data) {
						formattedData.total = responseData.data.total || 0;
					}
					;

					let statsData = [];
					if (Array.isArray(responseData.stats)) {
						statsData = responseData.stats;
					} else if (responseData.data && Array.isArray(responseData.data.stats)) {
						statsData = responseData.data.stats;
					}

					;

					formattedData.stats = statsData.map(
						(stat: { count: number; percentage: number; grade: string }) => {
							const count = stat.count || 0;
							let percentage = stat.percentage;

							if (typeof percentage !== 'number' && formattedData.total > 0) {
								percentage = (count / formattedData.total) * 100;
							}

							return {
								grade: stat.grade,
								count: count,
								percentage: percentage || 0,
							};
						},
					);

					;

					let genderStatsData = [];
					if (Array.isArray(responseData.genderStats)) {
						genderStatsData = responseData.genderStats;
					} else if (responseData.data && Array.isArray(responseData.data.genderStats)) {
						genderStatsData = responseData.data.genderStats;
					}

					;

					formattedData.genderStats = genderStatsData.map(
						(genderStat: { stats: any[]; gender: string }) => {
							const genderStatsArray = Array.isArray(genderStat.stats) ? genderStat.stats : [];
							const genderTotal = genderStatsArray.reduce(
								(sum: number, stat: { count: number }) => sum + (stat.count || 0),
								0,
							);

							const stats = genderStatsArray.map(
								(stat: { count: number; percentage: number; grade: string }) => {
									const count = stat.count || 0;
									let percentage = stat.percentage;

									if (typeof percentage !== 'number' && genderTotal > 0) {
										percentage = (count / genderTotal) * 100;
									}

									return {
										grade: stat.grade,
										count: count,
										percentage: percentage || 0,
									};
								},
							);

							return {
								gender: genderStat.gender,
								stats,
							};
						},
					);

					;
				}
			} else {
			}

			const allGrades = ['S', 'A', 'B', 'C', 'UNKNOWN'];

			allGrades.forEach((grade) => {
				if (!formattedData.stats.some((stat) => stat.grade === grade)) {
					formattedData.stats.push({
						grade,
						count: 0,
						percentage: 0,
					});
				}
			});

			formattedData.genderStats.forEach((genderStat) => {
				allGrades.forEach((grade) => {
					if (!genderStat.stats.some((stat) => stat.grade === grade)) {
						genderStat.stats.push({
							grade,
							count: 0,
							percentage: 0,
						});
					}
				});
			});

			;
			return formattedData;
		} catch (error: any) {
			throw error;
		}
	},

	deleteUser: async (
		userId: string,
		sendEmail: boolean = false,
		addToBlacklist: boolean = false,
	) => {
		try {
			const result = await adminRequest<any>(`/admin/users/${userId}`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sendEmail, addToBlacklist }),
			});
			return result;
		} catch (error: any) {
			throw error.response?.data ?? error.body ?? error;
		}
	},

	getDuplicatePhoneUsers: async () => {
		try {
			const result = await adminGet<any>('/admin/users/duplicate-phone');

			return result;
		} catch (error: any) {
			throw error;
		}
	},

	getVerifiedUsers: async (params: {
		page?: number;
		limit?: number;
		name?: string;
		university?: string;
	}) => {
		try {
			;

			const queryParams = new URLSearchParams();
			if (params.page) queryParams.append('page', params.page.toString());
			if (params.limit) queryParams.append('limit', params.limit.toString());
			if (params.name) queryParams.append('name', params.name);
			if (params.university) queryParams.append('university', params.university);

			const result = await adminGet<{ data: any[]; meta: any }>(`/admin/v2/users?filter=verified&${queryParams.toString()}`);

			return { data: result.data, meta: result.meta };
		} catch (error: any) {
			throw error;
		}
	},

	getUniversityVerificationPending: async (params: {
		page?: number;
		limit?: number;
		name?: string;
		university?: string;
	}) => {
		try {
			;

			const queryParams = new URLSearchParams();
			if (params.page) queryParams.append('page', params.page.toString());
			if (params.limit) queryParams.append('limit', params.limit.toString());
			if (params.name) queryParams.append('name', params.name);
			if (params.university) queryParams.append('university', params.university);

			const result = await adminGet<any>(
				`/admin/university-verification/pending?${queryParams.toString()}`,
			);

			return result;
		} catch (error: any) {
			throw error;
		}
	},

	approveUniversityVerification: async (userId: string) => {
		try {
			;

			const result = await adminPost<any>('/admin/university-verification/approve', {
				userId,
			});

			return result;
		} catch (error: any) {
			throw error;
		}
	},

	rejectUniversityVerification: async (userId: string) => {
		try {
			;

			const result = await adminPost<any>('/admin/university-verification/reject', {
				userId,
			});

			return result;
		} catch (error: any) {
			throw error;
		}
	},

	getBlacklistUsers: async (region?: string) => {
		try {
			;

			const params = new URLSearchParams();
			if (region) params.append('region', region);

			const result = await adminGet<{ data: any[]; meta: any }>(`/admin/v2/users?filter=blacklisted&${params.toString()}`);

			return { data: result.data, meta: result.meta };
		} catch (error: any) {
			throw error;
		}
	},

	releaseFromBlacklist: async (userId: string) => {
		try {
			;

			const result = await adminPatch<any>(`/admin/users/${userId}/blacklist/release`);

			return result;
		} catch (error: any) {
			throw error;
		}
	},

	searchUsersForReset: async (params: {
		name?: string;
		phoneNumber?: string;
		page?: number;
		limit?: number;
	}) => {
		try {
			const queryParams: Record<string, string> = {
				page: String(params.page || 1),
				limit: String(params.limit || 10),
			};
			if (params.name) queryParams.name = params.name;
			if (params.phoneNumber) queryParams.phoneNumber = params.phoneNumber;

			const result = await adminGet<any>('/admin/users/search', queryParams);
			return result;
		} catch (error: any) {
			throw error;
		}
	},

	resetPassword: async (userId: string) => {
		try {
			;

			const result = await adminPatch<any>(`/admin/users/${userId}/reset-password`);

			return result;
		} catch (error: any) {
			throw error;
		}
	},

	getReapplyUsers: async (page: number = 1, limit: number = 10, region?: string, name?: string) => {
		try {
			const queryParams = new URLSearchParams();
			queryParams.append('filter', 'resubmission');
			queryParams.append('page', page.toString());
			queryParams.append('limit', limit.toString());
			if (region) queryParams.append('region', region);
			if (name) queryParams.append('name', name);

			const result = await adminGet<{ data: any[]; meta: any }>(`/admin/v2/users?${queryParams.toString()}`);

			return { data: result.data, meta: result.meta };
		} catch (error: any) {
			throw error;
		}
	},

	getPendingUsers: async (page: number = 1, limit: number = 10, region?: string, name?: string) => {
		try {
			const queryParams = new URLSearchParams();
			queryParams.append('filter', 'pending');
			queryParams.append('page', page.toString());
			queryParams.append('limit', limit.toString());
			if (region) queryParams.append('region', region);
			if (name) queryParams.append('name', name);

			const result = await adminGet<{ data: any[]; meta: any }>(`/admin/v2/users?${queryParams.toString()}`);

			return { data: result.data, meta: result.meta };
		} catch (error: any) {
			throw error;
		}
	},

	getRejectedUsers: async (
		page: number = 1,
		limit: number = 10,
		region?: string,
		name?: string,
	) => {
		try {
			const queryParams = new URLSearchParams();
			queryParams.append('filter', 'rejected');
			queryParams.append('page', page.toString());
			queryParams.append('limit', limit.toString());
			if (region) queryParams.append('region', region);
			if (name) queryParams.append('name', name);

			const result = await adminGet<{ data: any[]; meta: any }>(`/admin/v2/users?${queryParams.toString()}`);

			return { data: result.data, meta: result.meta };
		} catch (error: any) {
			throw error;
		}
	},

	revokeUserApproval: async (userId: string, revokeReason: string) => {
		try {
			;

			const result = await adminPatch<any>(`/admin/users/approval/${userId}/revoke-approval`, {
				revokeReason,
			});

			return result;
		} catch (error: any) {
			throw error;
		}
	},
};

export const deletedFemales = {
	getList: async (page: number = 1, limit: number = 20) => {
		try {
			const result = await adminGet<DeletedFemalesListResponse>('/admin/deleted-females', {
				page: page.toString(),
				limit: limit.toString(),
			});
			return result;
		} catch (error: any) {
			throw error;
		}
	},

	restore: async (id: string) => {
		try {
			const result = await adminPatch<RestoreFemaleResponse>(
				`/admin/deleted-females/${id}/restore`,
			);
			return result;
		} catch (error: any) {
			throw error;
		}
	},

	sleep: async (id: string) => {
		try {
			const result = await adminPatch<SleepFemaleResponse>(
				`/admin/deleted-females/${id}/sleep`,
			);
			return result;
		} catch (error: any) {
			throw error;
		}
	},
};

export const userEngagement = {
	getStats: async (startDate?: string, endDate?: string, includeDeleted?: boolean) => {
		try {
			const params: Record<string, string> = {};
			if (startDate) params.startDate = startDate;
			if (endDate) params.endDate = endDate;
			if (includeDeleted !== undefined) params.includeDeleted = String(includeDeleted);

			const result = await adminGet<any>('/admin/stats/user-engagement', params);
			return result;
		} catch (error: any) {
			throw error;
		}
	},
};
