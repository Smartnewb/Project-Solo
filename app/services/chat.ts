import axiosServer from '@/utils/axios';

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
}

export interface ChatMessagesResponse {
  messages: ChatMessage[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface ChatRoomsParams {
  startDate: string;
  endDate: string;
  page?: number;
  limit?: number;
}

export interface ChatMessagesParams {
  chatRoomId: string;
  page?: number;
  limit?: number;
}

class ChatService {
  /**
   * 채팅방 목록 조회
   */
  async getChatRooms(params: ChatRoomsParams): Promise<ChatRoomsResponse> {
    try {
      const response = await axiosServer.get<ChatRoomsResponse>('/admin/chat/rooms', {
        params: {
          startDate: params.startDate,
          endDate: params.endDate,
          page: params.page || 1,
          limit: params.limit || 20
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('채팅방 목록 조회 실패:', error);
      throw new Error(error.response?.data?.message || '채팅방 목록을 불러오는데 실패했습니다.');
    }
  }

  /**
   * 채팅 메시지 조회
   */
  async getChatMessages(params: ChatMessagesParams): Promise<ChatMessagesResponse> {
    try {
      const response = await axiosServer.get<ChatMessagesResponse>('/admin/chat/messages', {
        params: {
          chatRoomId: params.chatRoomId,
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('채팅 메시지 조회 실패:', error);
      throw new Error(error.response?.data?.message || '채팅 메시지를 불러오는데 실패했습니다.');
    }
  }
}

const chatService = new ChatService();
export default chatService;
