// 유저 검색 결과
export interface AdminUserListItem {
	userId: string;
	name: string;
	email?: string;
	phoneNumber: string;
	gender?: string;
	age?: number;
	status: string;
	universityName?: string;
	profileImageUrl?: string;
	createdAt: Date;
	lastLoginAt?: Date;
	isFaker: boolean;
}

// 유저 검색 응답
export interface AdminUserSearchResponse {
	users: AdminUserListItem[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
		hasMore: boolean;
	};
}

// 검색 파라미터
export interface AdminUserSearchParams {
	search?: string;
	gender?: 'male' | 'female';
	status?: string;
	page?: number;
	limit?: number;
}

// 강제 채팅방 요청
export interface CreateForceChatRoomRequest {
	userIdA: string;
	userIdB: string;
	reason?: string;
}

// 강제 채팅방 응답
export interface CreateForceChatRoomResponse {
	success: boolean;
	data: {
		chatRoomId: string;
		matchId: string;
		connectionId: string;
		maleUser: { id: string; name: string; country: string };
		femaleUser: { id: string; name: string; country: string };
		createdAt: string;
		createdBy: string;
	};
}
