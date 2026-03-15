import axiosServer from '@/utils/axios';
import { adminGet } from '@/shared/lib/http/admin-fetch';
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
			if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
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

			// V2 ADAPTER: list → GET /admin/v2/users
			const url = `/admin/v2/users?${queryParams.toString()}`;

			try {
				const response = await axiosServer.get(url);
				return response.data?.data ?? response.data;
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

			const response = await axiosServer.get(
				`/admin/users/appearance/unclassified?${params.toString()}`,
			);

			;

			return response.data;
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

		// V2 ADAPTER: individual rank → PATCH /admin/v2/users/:userId/appearance
		try {
			const response = await axiosServer.patch(`/admin/v2/users/${userId}/appearance`, { rank: grade });
			return response.data;
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

		// V2 ADAPTER: bulk rank → PATCH /admin/v2/users/appearance/bulk
		try {
			const response = await axiosServer.patch('/admin/v2/users/appearance/bulk', {
				userIds,
				rank: grade,
			});
			return response.data;
		} catch (error) {
			throw error;
		}
	},

	getUserDetails: async (userId: string) => {
		// V2 ADAPTER: detail → GET /admin/v2/users/:userId
		try {
			const response = await axiosServer.get(`/admin/v2/users/${userId}`);
			const raw = response.data?.data ?? response.data;

			const images: { id: string; url: string; order: number; isMain: boolean }[] =
				Array.isArray(raw.images)
					? raw.images.map((url: string, index: number) => ({
							id: `${userId}-${index}`,
							url,
							order: index,
							isMain: index === 0,
					  }))
					: [];

			return {
				...raw,
				profileImages: images,
				profileImageUrl: images[0]?.url ?? null,
				profileImageUrls: images.map((img) => img.url),
			};
		} catch (error: any) {
			throw error;
		}
	},

	getUserTickets: async (userId: string) => {
		try {
			;
			const endpoint = `/admin/tickets/user/${userId}`;
			;

			const response = await axiosServer.get(endpoint);
			;

			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	createUserTickets: async (userId: string, count: number) => {
		try {
			;
			const endpoint = `/admin/tickets`;
			;

			const response = await axiosServer.post(endpoint, {
				userId,
				count,
			});
			;

			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	deleteUserTickets: async (userId: string, count: number) => {
		try {
			;
			const endpoint = `/admin/tickets`;
			;

			const response = await axiosServer.delete(endpoint, {
				data: {
					userId,
					count,
				},
			});
			;

			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	getUserGems: async (userId: string) => {
		try {
			;
			const endpoint = `/admin/gems/users/${userId}/balance`;

			const response = await axiosServer.get(endpoint);
			;

			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	addUserGems: async (userId: string, amount: number) => {
		try {
			;
			const endpoint = `/admin/gems/users/${userId}/add`;

			const response = await axiosServer.post(endpoint, { amount });

			;
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	removeUserGems: async (userId: string, amount: number) => {
		try {
			;
			const endpoint = `/admin/gems/users/${userId}/deduct`;

			const response = await axiosServer.post(endpoint, { amount });

			;
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	// V1 KEPT
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

			const response = await axiosServer.post(endpoint, requestData);
			;
			return response.data;
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

			const response = await axiosServer.post('/admin/users/detail/status', {
				userId,
				status,
				reason,
			});

			;
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	sendWarningMessage: async (userId: string, message: string) => {
		try {
			;

			const response = await axiosServer.post('/admin/users/detail/warning', {
				userId,
				message,
			});

			;
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	sendEmailNotification: async (userId: string, subject: string, message: string) => {
		try {
			;

			const response = await axiosServer.post('/admin/notification/email', {
				userId,
				subject,
				message,
			});

			;
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	sendSmsNotification: async (userId: string, message: string) => {
		try {
			;

			const response = await axiosServer.post('/admin/notification/sms', {
				userId,
				message,
			});

			;
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	forceLogout: async (userId: string) => {
		try {
			;

			const response = await axiosServer.post('/admin/users/detail/logout', {
				userId,
			});

			;
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	sendProfileUpdateRequest: async (userId: string, message: string) => {
		try {
			;

			const response = await axiosServer.post('/admin/users/detail/profile-update-request', {
				userId,
				message,
			});

			;
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	setInstagramError: async (userId: string) => {
		try {
			;

			const response = await axiosServer.post('/admin/users/detail/instagram-error', {
				userId,
			});

			;
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	resetInstagramError: async (userId: string) => {
		try {
			;

			const response = await axiosServer.post('/admin/users/detail/instagram-reset', {
				userId,
			});

			;
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	getAppearanceGradeStats: async (region?: string, useCluster?: boolean) => {
		try {
			;

			const endpoint = '/admin/users/appearance/stats';
			;

			const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
			;

			const timestamp = new Date().getTime();

			const params = new URLSearchParams();
			params.append('_t', timestamp.toString());
			if (region) params.append('region', region);
			if (useCluster !== undefined) params.append('useCluster', useCluster.toString());

			const finalUrl = `${endpoint}?${params.toString()}`;
			;
			;

			const testData = {
				all: {
					S: 623,
					A: 622,
					B: 619,
					C: 619,
					UNKNOWN: 619,
					total: 3102,
				},
				male: {
					S: 289,
					A: 308,
					B: 310,
					C: 311,
					UNKNOWN: 326,
					total: 1544,
				},
				female: {
					S: 334,
					A: 314,
					B: 309,
					C: 308,
					UNKNOWN: 293,
					total: 1558,
				},
			};

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			let responseData: any;

			try {
				const response = await axiosServer.get(finalUrl);
				;
				;
				;

				if (!response.data || Object.keys(response.data).length === 0) {
					;
					responseData = testData;
				} else {
					responseData = response.data;
				}
			} catch (error) {
				;
				responseData = testData;
			}

			;

			const formattedData: FormattedData = {
				total: 0,
				stats: [],
				genderStats: [],
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

			const testData = {
				all: {
					S: 623,
					A: 622,
					B: 619,
					C: 619,
					UNKNOWN: 619,
					total: 3102,
				},
				male: {
					S: 289,
					A: 308,
					B: 310,
					C: 311,
					UNKNOWN: 326,
					total: 1544,
				},
				female: {
					S: 334,
					A: 314,
					B: 309,
					C: 308,
					UNKNOWN: 293,
					total: 1558,
				},
			};

			;

			const formattedData = {
				total: testData.all.total,
				stats: [
					{
						grade: 'S',
						count: testData.all.S,
						percentage: (testData.all.S / testData.all.total) * 100,
					},
					{
						grade: 'A',
						count: testData.all.A,
						percentage: (testData.all.A / testData.all.total) * 100,
					},
					{
						grade: 'B',
						count: testData.all.B,
						percentage: (testData.all.B / testData.all.total) * 100,
					},
					{
						grade: 'C',
						count: testData.all.C,
						percentage: (testData.all.C / testData.all.total) * 100,
					},
					{
						grade: 'UNKNOWN',
						count: testData.all.UNKNOWN,
						percentage: (testData.all.UNKNOWN / testData.all.total) * 100,
					},
				],
				genderStats: [
					{
						gender: 'MALE',
						stats: [
							{
								grade: 'S',
								count: testData.male.S,
								percentage: (testData.male.S / testData.male.total) * 100,
							},
							{
								grade: 'A',
								count: testData.male.A,
								percentage: (testData.male.A / testData.male.total) * 100,
							},
							{
								grade: 'B',
								count: testData.male.B,
								percentage: (testData.male.B / testData.male.total) * 100,
							},
							{
								grade: 'C',
								count: testData.male.C,
								percentage: (testData.male.C / testData.male.total) * 100,
							},
							{
								grade: 'UNKNOWN',
								count: testData.male.UNKNOWN,
								percentage: (testData.male.UNKNOWN / testData.male.total) * 100,
							},
						],
					},
					{
						gender: 'FEMALE',
						stats: [
							{
								grade: 'S',
								count: testData.female.S,
								percentage: (testData.female.S / testData.female.total) * 100,
							},
							{
								grade: 'A',
								count: testData.female.A,
								percentage: (testData.female.A / testData.female.total) * 100,
							},
							{
								grade: 'B',
								count: testData.female.B,
								percentage: (testData.female.B / testData.female.total) * 100,
							},
							{
								grade: 'C',
								count: testData.female.C,
								percentage: (testData.female.C / testData.female.total) * 100,
							},
							{
								grade: 'UNKNOWN',
								count: testData.female.UNKNOWN,
								percentage: (testData.female.UNKNOWN / testData.female.total) * 100,
							},
						],
					},
				],
			};

			return formattedData;
		}
	},

	deleteUser: async (
		userId: string,
		sendEmail: boolean = false,
		addToBlacklist: boolean = false,
	) => {
		try {
			const response = await axiosServer.delete(`/admin/users/${userId}`, {
				data: {
					sendEmail,
					addToBlacklist,
				},
			});
			return response.data;
		} catch (error: any) {
			throw error.response?.data || error;
		}
	},

	getDuplicatePhoneUsers: async () => {
		try {
			;

			const response = await axiosServer.get('/admin/users/duplicate-phone');

			;
			return response.data;
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

			const response = await axiosServer.get(`/admin/users/verified?${queryParams.toString()}`);

			;
			return response.data;
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

			const response = await axiosServer.get(
				`/admin/university-verification/pending?${queryParams.toString()}`,
			);

			;
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	approveUniversityVerification: async (userId: string) => {
		try {
			;

			const response = await axiosServer.post('/admin/university-verification/approve', {
				userId,
			});

			;
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	rejectUniversityVerification: async (userId: string) => {
		try {
			;

			const response = await axiosServer.post('/admin/university-verification/reject', {
				userId,
			});

			;
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	getBlacklistUsers: async (region?: string) => {
		try {
			;

			const params = new URLSearchParams();
			if (region) params.append('region', region);

			const response = await axiosServer.get(`/admin/users/blacklist?${params.toString()}`);

			;
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	releaseFromBlacklist: async (userId: string) => {
		try {
			;

			const response = await axiosServer.patch(`/admin/users/${userId}/blacklist/release`);

			;
			return response.data;
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
			const response = await axiosServer.get('/admin/users/search', {
				params: {
					name: params.name || undefined,
					phoneNumber: params.phoneNumber || undefined,
					page: params.page || 1,
					limit: params.limit || 10,
				},
			});
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	resetPassword: async (userId: string) => {
		try {
			;

			const response = await axiosServer.patch(`/admin/users/${userId}/reset-password`);

			;
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	getReapplyUsers: async (page: number = 1, limit: number = 10, region?: string, name?: string) => {
		try {
			;

			const params: any = { page, limit };
			if (region) params.region = region;
			if (name) params.name = name;

			const response = await axiosServer.get('/admin/users/approval/reapply', {
				params,
			});

			;
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	getPendingUsers: async (page: number = 1, limit: number = 10, region?: string, name?: string) => {
		try {
			;

			const params: any = { page, limit };
			if (region) params.region = region;
			if (name) params.name = name;

			const response = await axiosServer.get('/admin/users/approval/pending', {
				params,
			});

			;
			return response.data;
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
			;

			const params: any = { page, limit };
			if (region) params.region = region;
			if (name) params.name = name;

			const response = await axiosServer.get('/admin/users/approval/rejected', {
				params,
			});

			;
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	revokeUserApproval: async (userId: string, revokeReason: string) => {
		try {
			;

			const response = await axiosServer.patch(`/admin/users/approval/${userId}/revoke-approval`, {
				revokeReason,
			});

			;
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},
};

export const deletedFemales = {
	getList: async (page: number = 1, limit: number = 20) => {
		try {
			const response = await axiosServer.get<DeletedFemalesListResponse>('/admin/deleted-females', {
				params: { page, limit },
			});
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	restore: async (id: string) => {
		try {
			const response = await axiosServer.patch<RestoreFemaleResponse>(
				`/admin/deleted-females/${id}/restore`,
			);
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	sleep: async (id: string) => {
		try {
			const response = await axiosServer.patch<SleepFemaleResponse>(
				`/admin/deleted-females/${id}/sleep`,
			);
			return response.data;
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

			const response = await axiosServer.get('/admin/stats/user-engagement', {
				params,
			});
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},
};
