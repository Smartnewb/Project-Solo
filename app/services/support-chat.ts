import { adminGet, adminPost } from '@/shared/lib/http/admin-fetch';
import type {
  AdminSessionsParams,
  AdminSessionsResponse,
  SupportSessionDetail,
  TakeoverResponse,
  ResolveResponse,
  ResolveSessionRequest,
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
}

const supportChatService = new SupportChatService();
export default supportChatService;
