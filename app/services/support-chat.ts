import { adminDelete, adminGet, adminPatch, adminPost } from '@/shared/lib/http/admin-fetch';
import type {
  AdminSessionsParams,
  AdminSessionsResponse,
  AiDraftResponse,
  DeleteMessageResponse,
  SupportSessionDetail,
  TakeoverResponse,
  ResolveResponse,
  ResolveSessionRequest,
  UpdateAdminNoteResponse,
  UpdateMessageRequest,
  UpdateMessageResponse,
} from '@/app/types/support-chat';

class SupportChatService {
  private readonly basePath = '/support-chat/admin';

  async getSessions(params: AdminSessionsParams = {}): Promise<AdminSessionsResponse> {
    try {
      const queryParams: Record<string, string> = {
        page: String(params.page || 1),
        limit: String(params.limit || 20),
      };
      if (params.status) queryParams.status = params.status;
      return adminGet<AdminSessionsResponse>(`${this.basePath}/sessions`, queryParams);
    } catch (error: unknown) {
      console.error('Support chat sessions 조회 실패:', error);
      const message = error instanceof Error ? error.message : '세션 목록을 불러오는데 실패했습니다.';
      throw new Error(message);
    }
  }

  async getSessionDetail(sessionId: string): Promise<SupportSessionDetail> {
    try {
      return adminGet<SupportSessionDetail>(`${this.basePath}/sessions/${sessionId}`);
    } catch (error: unknown) {
      console.error('Support chat session 상세 조회 실패:', error);
      const message = error instanceof Error ? error.message : '세션 상세 정보를 불러오는데 실패했습니다.';
      throw new Error(message);
    }
  }

  async takeoverSession(sessionId: string): Promise<TakeoverResponse> {
    try {
      return adminPost<TakeoverResponse>(`${this.basePath}/sessions/${sessionId}/takeover`);
    } catch (error: unknown) {
      console.error('Support chat session 인수인계 실패:', error);
      const message = error instanceof Error ? error.message : '세션 인수인계에 실패했습니다.';
      throw new Error(message);
    }
  }

  async resolveSession(sessionId: string, request?: ResolveSessionRequest): Promise<ResolveResponse> {
    try {
      return adminPost<ResolveResponse>(
        `${this.basePath}/sessions/${sessionId}/resolve`,
        request || {}
      );
    } catch (error: unknown) {
      console.error('Support chat session 종료 실패:', error);
      const message = error instanceof Error ? error.message : '세션 종료에 실패했습니다.';
      throw new Error(message);
    }
  }

  async updateMessage(
    sessionId: string,
    messageId: string,
    request: UpdateMessageRequest
  ): Promise<UpdateMessageResponse> {
    try {
      return adminPatch<UpdateMessageResponse>(
        `${this.basePath}/sessions/${sessionId}/messages/${messageId}`,
        request
      );
    } catch (error: unknown) {
      console.error('Support chat message 수정 실패:', error);
      const message = error instanceof Error ? error.message : '메시지 수정에 실패했습니다.';
      throw new Error(message);
    }
  }

  async deleteMessage(sessionId: string, messageId: string): Promise<DeleteMessageResponse> {
    try {
      return adminDelete<DeleteMessageResponse>(
        `${this.basePath}/sessions/${sessionId}/messages/${messageId}`
      );
    } catch (error: unknown) {
      console.error('Support chat message 삭제 실패:', error);
      const message = error instanceof Error ? error.message : '메시지 삭제에 실패했습니다.';
      throw new Error(message);
    }
  }

  async generateAiDraft(sessionId: string): Promise<AiDraftResponse> {
    try {
      return adminGet<AiDraftResponse>(`${this.basePath}/sessions/${sessionId}/ai-draft`);
    } catch (error: unknown) {
      console.error('Support chat AI 초안 생성 실패:', error);
      const message = error instanceof Error ? error.message : 'AI 답변 초안 생성에 실패했습니다.';
      throw new Error(message);
    }
  }

  async updateAdminNote(sessionId: string, note: string): Promise<UpdateAdminNoteResponse> {
    try {
      return adminPatch<UpdateAdminNoteResponse>(
        `${this.basePath}/sessions/${sessionId}/note`,
        { note }
      );
    } catch (error: unknown) {
      console.error('Support chat 내부 메모 저장 실패:', error);
      const message = error instanceof Error ? error.message : '내부 메모 저장에 실패했습니다.';
      throw new Error(message);
    }
  }
}

const supportChatService = new SupportChatService();
export default supportChatService;
