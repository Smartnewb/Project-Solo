import axiosServer from '@/utils/axios';

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

      // 실제 API 호출
      let endpoint = '/admin/community/articles';

      // 필터에 따라 다른 엔드포인트 사용
      if (filter === 'reported') {
        endpoint = '/admin/community/reports';
      }

      const response = await axiosServer.get(endpoint, {
        params: {
          page,
          limit,
          includeDeleted: filter === 'blinded' ? true : false
        }
      });
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

      // 실제 API 호출
      const articleResponse = await axiosServer.get(`/admin/community/articles/${id}`);
      console.log('게시글 상세 조회 응답:', articleResponse.data);

      // 댓글 조회
      const commentsResponse = await axiosServer.get(`/admin/community/articles/${id}/comments`);
      console.log('댓글 목록 조회 응답:', commentsResponse.data);

      // 백엔드 응답 형식에 맞게 변환
      const article = articleResponse.data;
      const comments = commentsResponse.data || [];

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
        reports: [] // 현재 API에서는 신고 정보를 별도로 제공하지 않음
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

      let response;
      if (isBlinded) {
        // 블라인드 처리
        response = await axiosServer.patch(`/admin/community/articles/${id}/blind`, {
          reason
        });
      } else {
        // 블라인드 해제
        response = await axiosServer.patch(`/admin/community/articles/${id}/unblind`);
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

      // 실제 API 호출
      const response = await axiosServer.delete(`/admin/community/articles/${id}`, {
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

      // 실제 API 호출
      const response = await axiosServer.get(`/admin/community/articles/${articleId}/comments`, {
        params: {
          includeDeleted: filter === 'blinded' ? true : false
        }
      });
      console.log('댓글 목록 조회 응답:', response.data);

      // 백엔드 응답 형식에 맞게 변환
      const comments = response.data || [];

      // 프론트엔드에서 필요한 추가 필드 설정
      const transformedComments = comments.map((comment: any) => ({
        ...comment,
        articleId: articleId, // postId를 articleId로도 사용
        isBlinded: comment.blindedAt !== null,
        isDeleted: comment.deletedAt !== null,
        reportCount: 0 // 기본값 설정
      }));

      // 필터링 적용
      let filteredComments = [...transformedComments];
      if (filter === 'reported') {
        // 백엔드에서 신고된 댓글 필터링 기능이 없으므로 클라이언트에서 처리
        filteredComments = transformedComments.filter(comment => comment.reportCount > 0);
      } else if (filter === 'blinded') {
        // 블라인드 처리된 댓글 필터링
        filteredComments = transformedComments.filter(comment => comment.isBlinded);
      }

      // 페이지네이션 적용
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedComments = filteredComments.slice(startIndex, endIndex);

      return {
        items: paginatedComments,
        total: filteredComments.length,
        page,
        limit,
        totalPages: Math.ceil(filteredComments.length / limit)
      };
    } catch (error) {
      console.error('댓글 목록 조회 중 오류:', error);
      throw error;
    }
  },

  // 댓글 블라인드 처리/해제 (백엔드에서 지원하지 않음 - 목업 데이터 사용)
  blindComment: async (id: string, isBlinded: boolean, reason?: string): Promise<any> => {
    try {
      console.log('댓글 블라인드 처리 요청:', { id, isBlinded, reason });

      // 백엔드에서 댓글 블라인드 처리/해제 API가 없으므로 목업 데이터 반환
      console.log('목업 데이터 사용 중');

      // 성공 응답 시뮬레이션
      return {
        success: true,
        message: `댓글 ${isBlinded ? '블라인드' : '블라인드 해제'} 처리가 완료되었습니다.`,
        comment: {
          id,
          isBlinded,
          blindReason: reason,
          updatedAt: new Date()
        }
      };
    } catch (error) {
      console.error('댓글 블라인드 처리 중 오류:', error);
      throw error;
    }
  },

  // 댓글 삭제
  deleteComment: async (id: string, reason?: string): Promise<any> => {
    try {
      console.log('댓글 삭제 요청:', { id, reason });

      // 실제 API 호출
      const response = await axiosServer.delete(`/admin/community/comments/${id}`, {
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

      // 실제 API 호출
      const response = await axiosServer.get(`/admin/community/reports`, {
        params: { page, limit }
      });
      console.log('신고 목록 조회 응답:', response.data);

      // 백엔드 응답 형식에 맞게 변환
      const reports = response.data.items || [];

      // 프론트엔드에서 필요한 추가 필드 설정
      const transformedReports = reports.map((report: any) => ({
        ...report,
        targetType: 'article', // 현재 백엔드에서는 게시글 신고만 지원
        targetId: report.postId,
        reporterNickname: report.reporter?.name || '익명',
        targetContent: report.post?.content || '',
        // 상태 정보 설정
        status: report.status || 'pending',
        result: report.status === 'processed' ? 'accepted' : undefined
      }));

      // 필터링 적용
      let filteredReports = [...transformedReports];
      if (type !== 'all') {
        filteredReports = transformedReports.filter(report => report.targetType === type);
      }
      if (status !== 'all') {
        filteredReports = filteredReports.filter(report => report.status === status);
      }

      return {
        items: filteredReports,
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

      // 실제 API 호출
      const response = await axiosServer.patch(`/admin/community/reports/${id}`, {
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

      // 실제 API 호출
      let endpoint = isBlinded
        ? '/admin/community/articles/bulk/blind'
        : '/admin/community/articles/bulk/unblind';

      const response = await axiosServer.patch(endpoint, {
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

      // 실제 API 호출
      const response = await axiosServer.delete(`/admin/community/articles/bulk`, {
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

  // 여러 댓글 일괄 블라인드 처리/해제 (백엔드에서 지원하지 않음 - 목업 데이터 사용)
  bulkBlindComments: async (ids: string[], isBlinded: boolean, reason?: string): Promise<any> => {
    try {
      console.log('댓글 일괄 블라인드 처리 요청:', { ids, isBlinded, reason });

      // 백엔드에서 일괄 블라인드 처리 API가 없으므로 목업 데이터 반환
      console.log('목업 데이터 사용 중');

      // 성공 응답 시뮬레이션
      return {
        success: true,
        message: `${ids.length}개의 댓글이 ${isBlinded ? '블라인드' : '블라인드 해제'} 처리되었습니다.`,
        comments: ids.map(id => ({
          id,
          isBlinded,
          blindReason: reason,
          updatedAt: new Date()
        }))
      };
    } catch (error) {
      console.error('댓글 일괄 블라인드 처리 중 오류:', error);
      throw error;
    }
  },

  // 여러 댓글 일괄 삭제
  bulkDeleteComments: async (ids: string[], reason?: string): Promise<any> => {
    try {
      console.log('댓글 일괄 삭제 요청:', { ids, reason });

      // 실제 API 호출
      const response = await axiosServer.delete(`/admin/community/comments/bulk`, {
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

      // 실제 API 호출
      const response = await axiosServer.get(`/admin/community/trash/articles`, {
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

      // 실제 API 호출
      const response = await axiosServer.delete(`/admin/community/trash/articles`);
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

      // 실제 API 호출
      const response = await axiosServer.delete(`/admin/community/articles/${id}/permanent`);
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

      // 실제 API 호출
      const response = await axiosServer.patch(`/admin/community/articles/${id}/restore`);
      console.log('게시글 복원 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('게시글 복원 중 오류:', error);
      throw error;
    }
  }
};

export default communityService;
