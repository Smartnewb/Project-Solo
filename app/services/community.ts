import axiosServer from '@/utils/axios';

// 작성자 정보 타입 정의
export interface Author {
  id: string;
  name: string;
  email?: string;
}

// 게시글 타입 정의
export interface Article {
  id: string;
  userId: string;
  nickname: string;
  email?: string;
  content: string;
  emoji: string;
  isAnonymous: boolean;
  likeCount: number;
  commentCount: number;
  reportCount: number;
  isBlinded: boolean;
  blindReason?: string;
  isDeleted: boolean;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
  author?: Author; // 작성자 정보
}

// 댓글 타입 정의
export interface Comment {
  id: string;
  articleId: string;
  userId: string;
  nickname: string;
  email?: string;
  content: string;
  emoji: string;
  isAnonymous: boolean;
  likeCount: number;
  reportCount: number;
  isBlinded: boolean;
  blindReason?: string;
  isDeleted: boolean;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 신고 타입 정의
export interface Report {
  id: string;
  targetType: 'article' | 'comment';
  targetId: string;
  reporterId: string;
  reporterNickname: string;
  reason: string;
  description?: string;
  status: 'pending' | 'processed';
  result?: 'accepted' | 'rejected';
  processedById?: string;
  processedByNickname?: string;
  processMemo?: string;
  createdAt: Date;
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
  reports: Report[];
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

      // 날짜 파라미터 설정 (startDate가 있으면 해당 날짜 사용, 없으면 현재 날짜)
      const date = startDate ?
        startDate.toISOString().split('T')[0] :
        new Date().toISOString().split('T')[0];

      // 실제 API 호출
      const response = await axiosServer.get(`/admin/community/articles`, {
        params: {
          date,
          page,
          limit
        }
      });
      console.log('게시글 목록 조회 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('게시글 목록 조회 중 오류:', error);
      throw error;
    }
  },

  // 게시글 상세 조회 (게시글 ID를 이용해 댓글을 가져오는 방식으로 구현)
  getArticleDetail: async (id: string): Promise<ArticleDetail> => {
    try {
      console.log('게시글 상세 조회 요청:', id);

      // 게시글 정보 가져오기 (목록 API에서 가져온 후 클라이언트에서 필터링)
      const articlesResponse = await axiosServer.get(`/admin/community/articles`);

      // 게시글 정보 추출 (클라이언트에서 ID로 필터링)
      const article = articlesResponse.data?.items?.find((item: any) => item.id === id);
      if (!article) {
        throw new Error('게시글을 찾을 수 없습니다.');
      }

      // 댓글 정보 가져오기
      const commentsResponse = await axiosServer.get(`/admin/community/comments`, {
        params: {
          article_id: id
        }
      });

      // 게시글 상세 정보 구성
      const articleDetail: ArticleDetail = {
        ...article,
        comments: commentsResponse.data?.items ?? [],
        reports: [] // 신고 정보는 별도로 필요한 경우 추가 API 호출 필요
      };

      console.log('게시글 상세 조회 응답:', articleDetail);
      return articleDetail;
    } catch (error) {
      console.error('게시글 상세 조회 중 오류:', error);
      throw error;
    }
  },

  // 게시글 블라인드 처리/해제
  blindArticle: async (id: string, isBlinded: boolean): Promise<any> => {
    try {
      console.log('게시글 블라인드 처리 요청:', { id, isBlinded });

      // 백엔드 API 호출
      const response = await axiosServer.patch(`/admin/community/articles/blind`, {
        id,
        isBlinded
      });
      console.log('게시글 블라인드 처리 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('게시글 블라인드 처리 중 오류:', error);
      throw error;
    }
  },

  // 게시글 삭제
  deleteArticle: async (id: string): Promise<any> => {
    try {
      console.log('게시글 삭제 요청:', id);

      // 실제 API 호출
      const response = await axiosServer.delete(`/admin/community/articles/${id}`);
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
      const response = await axiosServer.get(`/admin/community/comments`, {
        params: {
          articleId
        }
      });
      console.log('댓글 목록 조회 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('댓글 목록 조회 중 오류:', error);
      throw error;
    }
  },

  // 댓글 블라인드 처리/해제
  blindComment: async (id: string, isBlinded: boolean, reason?: string): Promise<any> => {
    try {
      console.log('댓글 블라인드 처리 요청:', { id, isBlinded, reason });

      // 실제 API 호출
      const response = await axiosServer.patch(`/admin/community/comments/${id}/blind`, {
        isBlinded,
        reason
      });
      console.log('댓글 블라인드 처리 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('댓글 블라인드 처리 중 오류:', error);
      throw error;
    }
  },

  // 댓글 삭제
  deleteComment: async (id: string): Promise<any> => {
    try {
      console.log('댓글 삭제 요청:', id);

      // 실제 API 호출
      const response = await axiosServer.delete(`/admin/community/comments/${id}`);
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
        params: { type, status, page, limit }
      });
      console.log('신고 목록 조회 응답:', response.data);
      return response.data;
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
      const response = await axiosServer.patch(`/admin/community/reports/${id}/process`, {
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
  bulkBlindArticles: async (ids: string[], isBlinded: boolean): Promise<any> => {
    try {
      console.log('게시글 일괄 블라인드 처리 요청:', { ids, isBlinded });

      // 단일 게시글 처리인 경우
      if (ids.length === 1) {
        // 백엔드 API 호출 (단일 게시글)
        const response = await axiosServer.patch(`/admin/community/articles/blind`, {
          id: ids[0],
          isBlinded
        });
        console.log('게시글 블라인드 처리 응답:', response.data);
        return response.data;
      } else {
        // 여러 게시글 처리 (순차적으로 처리)
        const results = [];
        for (const id of ids) {
          const response = await axiosServer.patch(`/admin/community/articles/blind`, {
            id,
            isBlinded
          });
          results.push(response.data);
        }
        console.log('게시글 일괄 블라인드 처리 응답:', results);
        return {
          success: true,
          message: `${ids.length}개의 게시글이 ${isBlinded ? '블라인드' : '블라인드 해제'} 처리되었습니다.`,
          results
        };
      }
    } catch (error) {
      console.error('게시글 일괄 블라인드 처리 중 오류:', error);
      throw error;
    }
  },

  // 여러 게시글 일괄 삭제
  bulkDeleteArticles: async (ids: string[]): Promise<any> => {
    try {
      console.log('게시글 일괄 삭제 요청:', ids);

      // 실제 API 호출
      const response = await axiosServer.delete(`/admin/community/articles/bulk`, {
        data: { ids }
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

      // 실제 API 호출
      const response = await axiosServer.patch(`/admin/community/comments/bulk/blind`, {
        ids,
        isBlinded,
        reason
      });
      console.log('댓글 일괄 블라인드 처리 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('댓글 일괄 블라인드 처리 중 오류:', error);
      throw error;
    }
  },

  // 여러 댓글 일괄 삭제
  bulkDeleteComments: async (ids: string[]): Promise<any> => {
    try {
      console.log('댓글 일괄 삭제 요청:', ids);

      // 실제 API 호출
      const response = await axiosServer.delete(`/admin/community/comments/bulk`, {
        data: { ids }
      });
      console.log('댓글 일괄 삭제 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('댓글 일괄 삭제 중 오류:', error);
      throw error;
    }
  },


};

export default communityService;
