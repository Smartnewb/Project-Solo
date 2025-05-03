import adminAxios from '@/utils/adminAxios';

// 게시글 작성자 타입 정의
export interface ArticleAuthor {
  id: string;
  name: string;
  email?: string;
}

// 게시글 타입 정의
export interface Article {
  id: string;
  authorId: string;
  content: string;
  anonymous: string | null;
  emoji: string | null;
  likeCount: number;
  blindedAt: Date | null;
  createdAt: Date;
  updatedAt: Date | null;
  deletedAt: Date | null;
  author: ArticleAuthor;
  comments: Comment[];
  // 프론트엔드에서 필요한 추가 필드
  commentCount?: number;
  reportCount?: number;
  isBlinded?: boolean;
  blindReason?: string;
  isDeleted?: boolean;
  isEdited?: boolean;
}

// 댓글 타입 정의
export interface Comment {
  id: string;
  postId: string;
  content: string;
  nickname: string;
  emoji: string | null;
  author: ArticleAuthor;
  createdAt: Date;
  updatedAt: Date | null;
  deletedAt: Date | null;
  // 프론트엔드에서 필요한 추가 필드
  articleId?: string;
  likeCount?: number;
  reportCount?: number;
  isBlinded?: boolean;
  blindReason?: string;
  isDeleted?: boolean;
  isEdited?: boolean;
}

// 신고 타입 정의
export interface Report {
  id: string;
  postId: string;
  reporterId: string;
  reportedId: string;
  reason: string | null;
  status: string | null;
  createdAt: Date;
  updatedAt: Date | null;
  deletedAt: Date | null;
  post: Article;
  reporter: ArticleAuthor;
  reported: ArticleAuthor;
  // 프론트엔드에서 필요한 추가 필드
  targetType?: 'article' | 'comment';
  targetId?: string;
  reporterNickname?: string;
  description?: string;
  result?: 'accepted' | 'rejected';
  processedById?: string;
  processedByNickname?: string;
  processMemo?: string;
  processedAt?: Date;
  targetContent?: string;
}

// 페이지네이션 응답 타입
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 게시글 상세 타입
export interface ArticleDetail extends Article {
  comments: Comment[];
  reports?: Report[];
}

// 커뮤니티 관리 API 서비스
const communityService = {
  // 게시글 목록 조회
  getArticles: async (
    filter: 'all' | 'reported' | 'blinded' = 'all',
    page = 1,
    limit = 10,
    startDate: Date | null = null,
    endDate: Date | null = null
  ): Promise<PaginatedResponse<Article>> => {
    try {
      console.log('게시글 목록 조회 요청:', { filter, page, limit, startDate, endDate });

      // 백엔드 API 변경에 따라 경로 수정
      let endpoint = '/api/admin/community/articles';

      // 필터에 따라 다른 엔드포인트 사용
      if (filter === 'reported') {
        endpoint = '/api/admin/community/reports';
      }

      // 쿼리 파라미터 구성
      const params: any = {
        page,
        limit
      };

      // 날짜 필터 추가
      if (startDate) {
        params.startDate = startDate.toISOString();
      }
      if (endDate) {
        params.endDate = endDate.toISOString();
      }

      // 블라인드 필터 추가
      if (filter === 'blinded') {
        params.isBlinded = true;
      }

      const response = await adminAxios.get(endpoint, { params });
      console.log('게시글 목록 조회 응답:', response.data);

      // 백엔드 응답 형식에 맞게 변환
      const items = response.data.items || [];

      // 필터가 'reported'인 경우 신고된 게시글 목록을 변환
      const transformedItems = filter === 'reported'
        ? items.map((report: any) => ({
            ...report.post,
            reportCount: 1, // 신고가 있으므로 최소 1개
            isBlinded: report.post.blindedAt !== null,
            isDeleted: report.post.deletedAt !== null,
          }))
        : items.map((article: any) => ({
            ...article,
            isBlinded: article.blindedAt !== null,
            isDeleted: article.deletedAt !== null,
            commentCount: article.comments?.length || 0,
          }));

      return {
        items: transformedItems,
        total: response.data.meta?.totalItems || 0,
        page: response.data.meta?.currentPage || page,
        limit: response.data.meta?.itemsPerPage || limit,
        totalPages: response.data.meta?.totalPages || 1
      };
    } catch (error) {
      console.error('게시글 목록 조회 중 오류:', error);
      throw error;
    }
  },

  // 게시글 상세 조회
  getArticleDetail: async (id: string): Promise<ArticleDetail> => {
    try {
      console.log('게시글 상세 조회 요청:', id);

      // 백엔드 API 변경에 따라 경로 수정
      const articleResponse = await adminAxios.get(`/api/admin/community/articles/${id}`);
      console.log('게시글 상세 조회 응답:', articleResponse.data);

      // 댓글 조회
      const commentsResponse = await adminAxios.get(`/api/admin/community/articles/${id}/comments`);
      console.log('댓글 목록 조회 응답:', commentsResponse.data);

      // 신고 조회
      const reportsResponse = await adminAxios.get(`/api/admin/community/articles/${id}/reports`);
      console.log('신고 목록 조회 응답:', reportsResponse.data);

      // 백엔드 응답 형식에 맞게 변환
      const article = articleResponse.data;
      const comments = commentsResponse.data.items || [];
      const reports = reportsResponse.data.items || [];

      // 프론트엔드에서 필요한 추가 필드 설정
      const transformedArticle = {
        ...article,
        isBlinded: article.blindedAt !== null,
        isDeleted: article.deletedAt !== null,
        commentCount: comments.length,
        comments: comments.map((comment: any) => ({
          ...comment,
          isBlinded: comment.blindedAt !== null,
          isDeleted: comment.deletedAt !== null,
          articleId: article.id
        })),
        reports: reports.map((report: any) => ({
          ...report,
          targetType: 'article',
          targetId: article.id,
          reporterNickname: report.reporter?.name || '익명',
          targetContent: article.content
        }))
      };

      return transformedArticle;
    } catch (error) {
      console.error('게시글 상세 조회 중 오류:', error);
      throw error;
    }
  },

  // 게시글 블라인드 처리/해제
  blindArticle: async (id: string, isBlinded: boolean, reason?: string): Promise<any> => {
    try {
      console.log('게시글 블라인드 처리 요청:', { id, isBlinded, reason });

      // 백엔드 API 변경에 따라 경로 수정
      let response;
      if (isBlinded) {
        // 블라인드 처리
        response = await adminAxios.patch(`/api/admin/community/posts/${id}/blind`, {
          reason
        });
      } else {
        // 블라인드 해제
        response = await adminAxios.patch(`/api/admin/community/posts/${id}/unblind`);
      }

      console.log('게시글 블라인드 처리 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('게시글 블라인드 처리 중 오류:', error);
      throw error;
    }
  },

  // 게시글 삭제
  deleteArticle: async (id: string, reason?: string): Promise<any> => {
    try {
      console.log('게시글 삭제 요청:', { id, reason });

      // 백엔드 API 변경에 따라 경로 수정
      const response = await adminAxios.delete(`/api/admin/community/articles/${id}`, {
        data: { reason }
      });
      console.log('게시글 삭제 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('게시글 삭제 중 오류:', error);
      throw error;
    }
  },

  // 댓글 목록 조회
  getComments: async (articleId: string, filter: 'all' | 'reported' | 'blinded' = 'all', page = 1, limit = 10): Promise<PaginatedResponse<Comment>> => {
    try {
      console.log('댓글 목록 조회 요청:', { articleId, filter, page, limit });

      // 백엔드 API 변경에 따라 경로 수정
      const response = await adminAxios.get(`/api/admin/community/articles/${articleId}/comments`, {
        params: {
          page,
          limit,
          isBlinded: filter === 'blinded' ? true : undefined
        }
      });
      console.log('댓글 목록 조회 응답:', response.data);

      // 백엔드 응답 형식에 맞게 변환
      const comments = response.data.items || [];

      // 프론트엔드에서 필요한 추가 필드 설정
      const transformedComments = comments.map((comment: any) => ({
        ...comment,
        articleId: articleId, // postId를 articleId로도 사용
        isBlinded: comment.blindedAt !== null,
        isDeleted: comment.deletedAt !== null,
        reportCount: 0 // 기본값 설정
      }));

      // 필터링 적용 (백엔드에서 처리되지 않는 경우에만)
      let filteredComments = [...transformedComments];
      if (filter === 'reported') {
        // 신고된 댓글 조회를 위한 별도 API 호출
        try {
          const reportsResponse = await adminAxios.get(`/api/admin/community/comments/reports`, {
            params: { postId: articleId, page, limit }
          });
          console.log('신고된 댓글 목록 조회 응답:', reportsResponse.data);

          const reportedComments = reportsResponse.data.items || [];
          filteredComments = reportedComments.map((report: any) => ({
            ...report.comment,
            articleId: articleId,
            isBlinded: report.comment.blindedAt !== null,
            isDeleted: report.comment.deletedAt !== null,
            reportCount: 1 // 신고가 있으므로 최소 1개
          }));

          return {
            items: filteredComments,
            total: reportsResponse.data.meta?.totalItems || 0,
            page: reportsResponse.data.meta?.currentPage || page,
            limit: reportsResponse.data.meta?.itemsPerPage || limit,
            totalPages: reportsResponse.data.meta?.totalPages || 1
          };
        } catch (reportError) {
          console.error('신고된 댓글 목록 조회 중 오류:', reportError);
          // 오류 발생 시 빈 배열 반환
          return {
            items: [],
            total: 0,
            page,
            limit,
            totalPages: 0
          };
        }
      }

      return {
        items: filteredComments,
        total: response.data.meta?.totalItems || 0,
        page: response.data.meta?.currentPage || page,
        limit: response.data.meta?.itemsPerPage || limit,
        totalPages: response.data.meta?.totalPages || 1
      };
    } catch (error) {
      console.error('댓글 목록 조회 중 오류:', error);
      throw error;
    }
  },

  // 댓글 블라인드 처리/해제
  blindComment: async (id: string, isBlinded: boolean, reason?: string): Promise<any> => {
    try {
      console.log('댓글 블라인드 처리 요청:', { id, isBlinded, reason });

      // 백엔드 API 변경에 따라 경로 수정
      let response;
      if (isBlinded) {
        // 블라인드 처리
        response = await adminAxios.patch(`/api/admin/community/comments/${id}/blind`, {
          reason
        });
      } else {
        // 블라인드 해제
        response = await adminAxios.patch(`/api/admin/community/comments/${id}/unblind`);
      }

      console.log('댓글 블라인드 처리 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('댓글 블라인드 처리 중 오류:', error);
      throw error;
    }
  },

  // 댓글 삭제
  deleteComment: async (id: string, reason?: string): Promise<any> => {
    try {
      console.log('댓글 삭제 요청:', { id, reason });

      // 백엔드 API 변경에 따라 경로 수정
      const response = await adminAxios.delete(`/api/admin/community/comments/${id}`, {
        data: { reason }
      });
      console.log('댓글 삭제 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('댓글 삭제 중 오류:', error);
      throw error;
    }
  },

  // 신고 목록 조회
  getReports: async (type: 'article' | 'comment' | 'all' = 'all', status: 'pending' | 'processed' | 'all' = 'all', page = 1, limit = 10): Promise<PaginatedResponse<Report>> => {
    try {
      console.log('신고 목록 조회 요청:', { type, status, page, limit });

      // 백엔드 API 변경에 따라 경로 수정
      const params: any = {
        page,
        limit
      };

      // 타입 필터 추가
      if (type !== 'all') {
        params.type = type === 'article' ? 'post' : 'comment';
      }

      // 상태 필터 추가
      if (status !== 'all') {
        params.status = status;
      }

      const response = await adminAxios.get(`/api/admin/community/reports`, { params });
      console.log('신고 목록 조회 응답:', response.data);

      // 백엔드 응답 형식에 맞게 변환
      const reports = response.data.items || [];

      // 프론트엔드에서 필요한 추가 필드 설정
      const transformedReports = reports.map((report: any) => {
        // 타입 확인 (post 또는 comment)
        const isPost = report.post && !report.comment;
        const targetObject = isPost ? report.post : report.comment;

        return {
          ...report,
          targetType: isPost ? 'article' : 'comment',
          targetId: isPost ? report.postId : report.commentId,
          reporterNickname: report.reporter?.name || '익명',
          targetContent: targetObject?.content || '',
          // 상태 정보 설정
          status: report.status || 'pending',
          result: report.status === 'processed' ? (report.result || 'accepted') : undefined
        };
      });

      return {
        items: transformedReports,
        total: response.data.meta?.totalItems || 0,
        page: response.data.meta?.currentPage || page,
        limit: response.data.meta?.itemsPerPage || limit,
        totalPages: response.data.meta?.totalPages || 1
      };
    } catch (error) {
      console.error('신고 목록 조회 중 오류:', error);
      throw error;
    }
  },

  // 신고 처리
  processReport: async (id: string, result: 'accepted' | 'rejected', memo?: string, blind?: boolean): Promise<any> => {
    try {
      console.log('신고 처리 요청:', { id, result, memo, blind });

      // 백엔드 API 변경에 따라 경로 수정
      const response = await adminAxios.patch(`/api/admin/community/reports/${id}/process`, {
        result,
        memo,
        blind
      });
      console.log('신고 처리 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('신고 처리 중 오류:', error);
      throw error;
    }
  },

  // 여러 게시글 일괄 블라인드 처리/해제
  bulkBlindArticles: async (ids: string[], isBlinded: boolean, reason?: string): Promise<any> => {
    try {
      console.log('게시글 일괄 블라인드 처리 요청:', { ids, isBlinded, reason });

      // 백엔드 API 변경에 따라 경로 수정
      let endpoint = isBlinded
        ? '/api/admin/community/posts/bulk/blind'
        : '/api/admin/community/posts/bulk/unblind';

      const response = await adminAxios.patch(endpoint, {
        ids,
        reason: isBlinded ? reason : undefined // 블라인드 해제 시에는 reason이 필요 없음
      });

      console.log('게시글 일괄 블라인드 처리 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('게시글 일괄 블라인드 처리 중 오류:', error);
      throw error;
    }
  },

  // 여러 게시글 일괄 삭제
  bulkDeleteArticles: async (ids: string[], reason?: string): Promise<any> => {
    try {
      console.log('게시글 일괄 삭제 요청:', { ids, reason });

      // 백엔드 API 변경에 따라 경로 수정
      const response = await adminAxios.delete(`/api/admin/community/posts/bulk`, {
        data: {
          ids,
          reason
        }
      });

      console.log('게시글 일괄 삭제 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('게시글 일괄 삭제 중 오류:', error);
      throw error;
    }
  },

  // 여러 댓글 일괄 블라인드 처리/해제
  bulkBlindComments: async (ids: string[], isBlinded: boolean, reason?: string): Promise<any> => {
    try {
      console.log('댓글 일괄 블라인드 처리 요청:', { ids, isBlinded, reason });

      // 백엔드 API 변경에 따라 경로 수정
      let endpoint = isBlinded
        ? '/api/admin/community/comments/bulk/blind'
        : '/api/admin/community/comments/bulk/unblind';

      const response = await adminAxios.patch(endpoint, {
        ids,
        reason: isBlinded ? reason : undefined // 블라인드 해제 시에는 reason이 필요 없음
      });

      console.log('댓글 일괄 블라인드 처리 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('댓글 일괄 블라인드 처리 중 오류:', error);
      throw error;
    }
  },

  // 여러 댓글 일괄 삭제
  bulkDeleteComments: async (ids: string[], reason?: string): Promise<any> => {
    try {
      console.log('댓글 일괄 삭제 요청:', { ids, reason });

      // 백엔드 API 변경에 따라 경로 수정
      const response = await adminAxios.delete(`/api/admin/community/comments/bulk`, {
        data: {
          ids,
          reason
        }
      });

      console.log('댓글 일괄 삭제 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('댓글 일괄 삭제 중 오류:', error);
      throw error;
    }
  },

  // 휴지통 게시글 목록 조회
  getTrashArticles: async (page = 1, limit = 10): Promise<PaginatedResponse<Article>> => {
    try {
      console.log('휴지통 게시글 목록 조회 요청:', { page, limit });

      // 백엔드 API 변경에 따라 경로 수정
      const response = await adminAxios.get(`/api/admin/community/trash/articles`, {
        params: { page, limit }
      });
      console.log('휴지통 게시글 목록 조회 응답:', response.data);

      // 백엔드 응답 형식에 맞게 변환
      const items = response.data.items || [];

      // 프론트엔드에서 필요한 추가 필드 설정
      const transformedItems = items.map((article: any) => ({
        ...article,
        isBlinded: article.blindedAt !== null,
        isDeleted: true, // 휴지통에 있는 게시글은 삭제된 상태
        commentCount: article.comments?.length || 0,
      }));

      return {
        items: transformedItems,
        total: response.data.meta?.totalItems || 0,
        page: response.data.meta?.currentPage || page,
        limit: response.data.meta?.itemsPerPage || limit,
        totalPages: response.data.meta?.totalPages || 1
      };
    } catch (error) {
      console.error('휴지통 게시글 목록 조회 중 오류:', error);
      throw error;
    }
  },

  // 휴지통 비우기
  emptyTrash: async (): Promise<any> => {
    try {
      console.log('휴지통 비우기 요청');

      // 백엔드 API 변경에 따라 경로 수정
      const response = await adminAxios.delete(`/api/admin/community/trash/posts`);
      console.log('휴지통 비우기 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('휴지통 비우기 중 오류:', error);
      throw error;
    }
  },

  // 게시글 영구 삭제
  permanentDeleteArticle: async (id: string): Promise<any> => {
    try {
      console.log('게시글 영구 삭제 요청:', id);

      // 백엔드 API 변경에 따라 경로 수정
      const response = await adminAxios.delete(`/api/admin/community/posts/${id}/permanent`);
      console.log('게시글 영구 삭제 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('게시글 영구 삭제 중 오류:', error);
      throw error;
    }
  },

  // 게시글 복원
  restoreArticle: async (id: string): Promise<any> => {
    try {
      console.log('게시글 복원 요청:', id);

      // 백엔드 API 변경에 따라 경로 수정
      const response = await adminAxios.patch(`/api/admin/community/posts/${id}/restore`);
      console.log('게시글 복원 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('게시글 복원 중 오류:', error);
      throw error;
    }
  }
};

export default communityService;
