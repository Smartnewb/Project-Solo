import { adminApiClient } from '@/lib/api';
import {
  Article,
  ArticleDetail,
  Comment,
  Report,
  PaginatedResponse
} from '@/lib/types/api';

// 게시글 목록 조회 파라미터
export interface GetArticlesParams {
  page?: number;
  limit?: number;
  isBlinded?: boolean;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
}

// 신고 목록 조회 파라미터
export interface GetReportsParams {
  page?: number;
  limit?: number;
  type?: 'post' | 'comment';
  status?: 'pending' | 'processed';
  startDate?: string;
  endDate?: string;
}

// 커뮤니티 관리 서비스
const communityService = {
  // 게시글 목록 조회
  getArticles: async (params: GetArticlesParams = {}): Promise<PaginatedResponse<Article>> => {
    try {
      console.log('게시글 목록 조회 API 요청 URL:', '/api/admin/community/articles');
      console.log('게시글 목록 조회 API 파라미터:', params);

      const response = await adminApiClient.get('/api/admin/community/articles', { params });
      console.log('게시글 목록 조회 API 응답:', response);

      // 백엔드 응답 형식에 맞게 변환
      return {
        items: response.items.map((article: any) => ({
          ...article,
          isBlinded: article.blindedAt !== null,
          isDeleted: article.deletedAt !== null,
          commentCount: article.comments?.length || 0,
        })),
        meta: response.meta
      };
    } catch (error) {
      console.error('게시글 목록 조회 중 오류:', error);

      // 백엔드 API 경로가 변경되었을 수 있으므로 대체 경로로 시도
      try {
        console.log('대체 API 경로로 시도: /api/admin/community/posts');
        const response = await adminApiClient.get('/api/admin/community/posts', { params });
        console.log('대체 API 응답:', response);

        // 백엔드 응답 형식에 맞게 변환
        return {
          items: response.items.map((article: any) => ({
            ...article,
            isBlinded: article.blindedAt !== null,
            isDeleted: article.deletedAt !== null,
            commentCount: article.comments?.length || 0,
          })),
          meta: response.meta
        };
      } catch (fallbackError) {
        console.error('대체 API 경로로도 실패:', fallbackError);
        throw error; // 원래 오류를 다시 던짐
      }
    }
  },

  // 게시글 상세 조회
  getArticleDetail: async (id: string): Promise<ArticleDetail> => {
    // 게시글 정보 조회
    const article = await adminApiClient.get(`/api/admin/community/posts/${id}`);

    // 댓글 목록 조회
    const commentsResponse = await adminApiClient.get(`/api/admin/community/posts/${id}/comments`);

    // 신고 목록 조회
    const reportsResponse = await adminApiClient.get(`/api/admin/community/posts/${id}/reports`);

    // 데이터 변환
    return {
      ...article,
      isBlinded: article.blindedAt !== null,
      isDeleted: article.deletedAt !== null,
      commentCount: commentsResponse.items.length,
      comments: commentsResponse.items.map((comment: any) => ({
        ...comment,
        isBlinded: comment.blindedAt !== null,
        isDeleted: comment.deletedAt !== null,
        articleId: article.id
      })),
      reports: reportsResponse.items.map((report: any) => ({
        ...report,
        targetType: 'article',
        targetId: article.id,
        reporterNickname: report.reporter?.name || '익명',
        targetContent: article.content
      }))
    };
  },

  // 게시글 블라인드 처리/해제
  blindArticle: async (id: string, isBlinded: boolean, reason?: string): Promise<{ success: boolean }> => {
    if (isBlinded) {
      return adminApiClient.patch(`/api/admin/community/posts/${id}/blind`, { reason });
    } else {
      return adminApiClient.patch(`/api/admin/community/posts/${id}/unblind`);
    }
  },

  // 게시글 삭제
  deleteArticle: async (id: string, reason?: string): Promise<{ success: boolean }> => {
    return adminApiClient.delete(`/api/admin/community/posts/${id}`, {
      data: { reason }
    });
  },

  // 댓글 목록 조회
  getComments: async (articleId: string, params: { page?: number; limit?: number; isBlinded?: boolean } = {}): Promise<PaginatedResponse<Comment>> => {
    const response = await adminApiClient.get(`/api/admin/community/posts/${articleId}/comments`, { params });

    // 백엔드 응답 형식에 맞게 변환
    return {
      items: response.items.map((comment: any) => ({
        ...comment,
        articleId,
        isBlinded: comment.blindedAt !== null,
        isDeleted: comment.deletedAt !== null
      })),
      meta: response.meta
    };
  },

  // 신고된 댓글 목록 조회
  getReportedComments: async (articleId: string, params: { page?: number; limit?: number } = {}): Promise<PaginatedResponse<Comment>> => {
    const response = await adminApiClient.get('/api/admin/community/comments/reports', {
      params: { postId: articleId, ...params }
    });

    // 백엔드 응답 형식에 맞게 변환
    return {
      items: response.items.map((report: any) => ({
        ...report.comment,
        articleId,
        isBlinded: report.comment.blindedAt !== null,
        isDeleted: report.comment.deletedAt !== null,
        reportCount: 1
      })),
      meta: response.meta
    };
  },

  // 댓글 블라인드 처리/해제
  blindComment: async (id: string, isBlinded: boolean, reason?: string): Promise<{ success: boolean }> => {
    if (isBlinded) {
      return adminApiClient.patch(`/api/admin/community/comments/${id}/blind`, { reason });
    } else {
      return adminApiClient.patch(`/api/admin/community/comments/${id}/unblind`);
    }
  },

  // 댓글 삭제
  deleteComment: async (id: string, reason?: string): Promise<{ success: boolean }> => {
    return adminApiClient.delete(`/api/admin/community/comments/${id}`, {
      data: { reason }
    });
  },

  // 신고 목록 조회
  getReports: async (params: GetReportsParams = {}): Promise<PaginatedResponse<Report>> => {
    try {
      console.log('신고 목록 조회 API 요청 URL:', '/api/admin/community/reports');
      console.log('신고 목록 조회 API 파라미터:', params);

      const response = await adminApiClient.get('/api/admin/community/reports', { params });
      console.log('신고 목록 조회 API 응답:', response);

      // 백엔드 응답 형식에 맞게 변환
      return {
        items: response.items.map((report: any) => {
          // 타입 확인 (post 또는 comment)
          const isPost = report.post && !report.comment;
          const targetObject = isPost ? report.post : report.comment;

          return {
            ...report,
            targetType: isPost ? 'article' : 'comment',
            targetId: isPost ? report.postId : report.commentId,
            reporterNickname: report.reporter?.name || '익명',
            targetContent: targetObject?.content || '',
            status: report.status || 'pending',
            result: report.status === 'processed' ? (report.result || 'accepted') : undefined
          };
        }),
        meta: response.meta
      };
    } catch (error) {
      console.error('신고 목록 조회 중 오류:', error);

      // 빈 결과 반환
      return {
        items: [],
        meta: {
          totalItems: 0,
          itemCount: 0,
          itemsPerPage: 10,
          totalPages: 0,
          currentPage: 1
        }
      };
    }
  },

  // 신고 처리
  processReport: async (id: string, result: 'accepted' | 'rejected', memo?: string, blind?: boolean): Promise<{ success: boolean }> => {
    return adminApiClient.patch(`/api/admin/community/reports/${id}/process`, {
      result,
      memo,
      blind
    });
  },

  // 여러 게시글 일괄 블라인드 처리/해제
  bulkBlindArticles: async (ids: string[], isBlinded: boolean, reason?: string): Promise<{ success: boolean; count: number }> => {
    const endpoint = isBlinded
      ? '/api/admin/community/posts/bulk/blind'
      : '/api/admin/community/posts/bulk/unblind';

    return adminApiClient.patch(endpoint, {
      ids,
      reason: isBlinded ? reason : undefined
    });
  },

  // 여러 게시글 일괄 삭제
  bulkDeleteArticles: async (ids: string[], reason?: string): Promise<{ success: boolean; count: number }> => {
    return adminApiClient.delete('/api/admin/community/posts/bulk', {
      data: {
        ids,
        reason
      }
    });
  },

  // 여러 댓글 일괄 블라인드 처리/해제
  bulkBlindComments: async (ids: string[], isBlinded: boolean, reason?: string): Promise<{ success: boolean; count: number }> => {
    const endpoint = isBlinded
      ? '/api/admin/community/comments/bulk/blind'
      : '/api/admin/community/comments/bulk/unblind';

    return adminApiClient.patch(endpoint, {
      ids,
      reason: isBlinded ? reason : undefined
    });
  },

  // 여러 댓글 일괄 삭제
  bulkDeleteComments: async (ids: string[], reason?: string): Promise<{ success: boolean; count: number }> => {
    return adminApiClient.delete('/api/admin/community/comments/bulk', {
      data: {
        ids,
        reason
      }
    });
  },

  // 휴지통 게시글 목록 조회
  getTrashArticles: async (page: number = 1, limit: number = 10): Promise<PaginatedResponse<Article>> => {
    try {
      console.log('휴지통 게시글 목록 조회 API 요청 URL:', '/api/admin/community/trash/articles');
      console.log('휴지통 게시글 목록 조회 API 파라미터:', { page, limit });

      const response = await adminApiClient.get('/api/admin/community/trash/articles', {
        params: { page, limit }
      });
      console.log('휴지통 게시글 목록 조회 API 응답:', response);

      // 백엔드 응답 형식에 맞게 변환
      return {
        items: response.items.map((article: any) => ({
          ...article,
          isBlinded: article.blindedAt !== null,
          isDeleted: true,
          commentCount: article.comments?.length || 0,
        })),
        meta: response.meta
      };
    } catch (error) {
      console.error('휴지통 게시글 목록 조회 중 오류:', error);

      // 백엔드 API 경로가 변경되었을 수 있으므로 대체 경로로 시도
      try {
        console.log('대체 API 경로로 시도: /api/admin/community/trash/posts');
        const response = await adminApiClient.get('/api/admin/community/trash/posts', {
          params: { page, limit }
        });
        console.log('대체 API 응답:', response);

        // 백엔드 응답 형식에 맞게 변환
        return {
          items: response.items.map((article: any) => ({
            ...article,
            isBlinded: article.blindedAt !== null,
            isDeleted: true,
            commentCount: article.comments?.length || 0,
          })),
          meta: response.meta
        };
      } catch (fallbackError) {
        console.error('대체 API 경로로도 실패:', fallbackError);
        throw error; // 원래 오류를 다시 던짐
      }
    }
  },

  // 휴지통 비우기
  emptyTrash: async (): Promise<{ success: boolean; count: number }> => {
    return adminApiClient.delete('/api/admin/community/trash/posts');
  },

  // 게시글 영구 삭제
  permanentDeleteArticle: async (id: string): Promise<{ success: boolean }> => {
    return adminApiClient.delete(`/api/admin/community/posts/${id}/permanent`);
  },

  // 게시글 복원
  restoreArticle: async (id: string): Promise<{ success: boolean }> => {
    return adminApiClient.patch(`/api/admin/community/posts/${id}/restore`);
  }
};

export default communityService;
