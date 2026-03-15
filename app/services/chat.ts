import axiosServer from '@/utils/axios';

export type DatePreset = 'today' | 'yesterday' | '7days' | '14days' | '30days' | 'all';

export interface ChatUser {
  id: string;
  name: string;
  profileImage: string;
}

export interface ChatRoom {
  id: string;
  male: ChatUser;
  female: ChatUser;
  isActive: boolean;
  lastMessageAt: string | null;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  messageType: string;
  mediaUrl: string | null;
  createdAt: string;
}

export interface ChatRoomsResponse {
  chatRooms: ChatRoom[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  appliedStartDate: string | null;
  appliedEndDate: string | null;
}

export interface ChatMessagesResponse {
  messages: ChatMessage[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface ChatRoomsParams {
  startDate?: string;
  endDate?: string;
  preset?: DatePreset;
  searchName?: string;
  page?: number;
  limit?: number;
}

export interface ChatMessagesParams {
  chatRoomId: string;
  page?: number;
  limit?: number;
}

export interface ChatStatsSummary {
  totalRooms: number;
  activeRooms: number;
  totalMessages: number;
  avgMessagesPerRoom: number;
  responseRate: number;
  maleFirstMessageRate: number;
  femaleFirstMessageRate: number;
  avgFirstResponseTimeMinutes: number;
  conversationWithin24hRate: number;
}

export interface HourlyMessageDistribution {
  hour: number;
  count: number;
}

export interface DailyMessageTrend {
  date: string;
  messageCount: number;
  newRoomCount: number;
}

export interface MessageLengthDistribution {
  range: string;
  count: number;
  percentage: number;
}

export interface ChatStatsResponse {
  summary: ChatStatsSummary;
  hourlyDistribution: HourlyMessageDistribution[];
  dailyTrend: DailyMessageTrend[];
  messageLengthDistribution: MessageLengthDistribution[];
  startDate: string;
  endDate: string;
}

export interface ChatStatsParams {
  startDate?: string;
  endDate?: string;
  preset?: DatePreset;
}

export interface ChatCsvExportParams {
  startDate?: string;
  endDate?: string;
  preset?: DatePreset;
}

class ChatService {
	async getChatRooms(params: ChatRoomsParams): Promise<ChatRoomsResponse> {
		// V2 ADAPTER
		try {
			const page = params.page || 1;
			const limit = params.limit || 20;
			const response = await axiosServer.get<{ data: ChatRoom[] }>('/admin/v2/chat/rooms', {
				params: {
					startDate: params.startDate,
					endDate: params.endDate,
					preset: params.preset,
					searchName: params.searchName,
					page,
					limit,
				},
			});
			const items = response.data.data;
			return {
				chatRooms: items,
				total: items.length,
				page,
				limit,
				totalPages: Math.ceil(items.length / limit) || 1,
				appliedStartDate: params.startDate ?? null,
				appliedEndDate: params.endDate ?? null,
			};
		} catch (error: any) {
			console.error('채팅방 목록 조회 실패:', error);
			throw new Error(error.response?.data?.message || '채팅방 목록을 불러오는데 실패했습니다.');
		}
	}

	async getChatMessages(params: ChatMessagesParams): Promise<ChatMessagesResponse> {
		// V2 ADAPTER
		try {
			const response = await axiosServer.get<{
				data: { messages: ChatMessage[]; total: number; nextCursor: string | null; hasMore: boolean };
			}>(`/admin/v2/chat/rooms/${params.chatRoomId}/messages`);
			const { messages, total } = response.data.data;
			return { messages, total };
		} catch (error: any) {
			console.error('채팅 메시지 조회 실패:', error);
			throw new Error(error.response?.data?.message || '채팅 메시지를 불러오는데 실패했습니다.');
		}
	}

	async getChatStats(params: ChatStatsParams = {}): Promise<ChatStatsResponse> {
		// V2 ADAPTER
		try {
			const response = await axiosServer.get<{ data: ChatStatsSummary }>('/admin/v2/chat/stats', {
				params: {
					startDate: params.startDate,
					endDate: params.endDate,
					preset: params.preset,
				},
			});
			return {
				summary: response.data.data,
				hourlyDistribution: [],
				dailyTrend: [],
				messageLengthDistribution: [],
				startDate: params.startDate ?? '',
				endDate: params.endDate ?? '',
			};
		} catch (error: any) {
			console.error('채팅 통계 조회 실패:', error);
			throw new Error(error.response?.data?.message || '채팅 통계를 불러오는데 실패했습니다.');
		}
	}

	async exportChatsToCsv(params: ChatCsvExportParams = {}): Promise<void> {
		// V2 ADAPTER
		try {
			const response = await axiosServer.get('/admin/v2/chat/export', {
				params: {
					startDate: params.startDate,
					endDate: params.endDate,
					preset: params.preset,
				},
				responseType: 'blob',
			});

			const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' });
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.setAttribute('download', `chat_export_${new Date().toISOString().split('T')[0]}.csv`);
			document.body.appendChild(link);
			link.click();
			link.remove();
			window.URL.revokeObjectURL(url);
		} catch (error: any) {
			console.error('채팅 CSV 내보내기 실패:', error);
			throw new Error(error.response?.data?.message || 'CSV 내보내기에 실패했습니다.');
		}
	}
}

const chatService = new ChatService();
export default chatService;
