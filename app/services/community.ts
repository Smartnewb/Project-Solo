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
  title?: string;
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
  author?: Author;
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

// 페이지네이션 메타 정보 타입
export interface PaginationMeta {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// 페이지네이션 응답 타입
export interface PaginatedResponse<T> {
  items: T[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  meta?: PaginationMeta;
}

// 게시글 상세 타입
export interface ArticleDetail extends Article {
  comments: Comment[];
  reports: Report[];
}

// 카테고리 타입 정의
export interface Category {
  id: string;
  code: string;
  displayName: string;
}

// 커뮤니티 관리 API 서비스
const communityService = {
  // 게시글 목록 조회
  getArticles: async (
    filter: 'all' | 'reported' | 'blinded' = 'all',
    page = 1,
    limit = 10,
    startDate: Date | null = null,
    endDate: Date | null = null,
    categoryId: string | null = null
  ): Promise<PaginatedResponse<Article>> => {
    try {
      console.log('게시글 목록 조회 요청:', { filter, page, limit, startDate, endDate, categoryId });

      // API 파라미터 구성
      const params: any = {
        page,
        limit
      };

      // 시작 날짜가 있으면 추가 (YYYY-MM-DD 형식)
      if (startDate) {
        params.startDate = startDate.toISOString().split('T')[0];
      }

      // 종료 날짜가 있으면 추가 (YYYY-MM-DD 형식)
      if (endDate) {
        params.endDate = endDate.toISOString().split('T')[0];
      }

      // 카테고리 ID가 있으면 추가
      if (categoryId) {
        params.categoryId = categoryId;
      }

      // 실제 API 호출
      const response = await axiosServer.get(`/admin/community/articles`, {
        params
      });
      console.log('게시글 목록 조회 응답:', response.data);

      // API 응답 구조에 맞게 데이터 반환
      return {
        items: response.data.items ?? [],
        meta: response.data.meta ?? {
          currentPage: page,
          itemsPerPage: limit,
          totalItems: response.data.items?.length ?? 0,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: page > 1
        }
      };
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
      // 최근 30일 범위로 검색하여 게시글을 찾음
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);

      const articlesResponse = await axiosServer.get(`/admin/community/articles`, {
        params: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          page: 1,
          limit: 1000 // 충분히 큰 값으로 설정하여 모든 게시글을 가져옴
        }
      });

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

  // 게시글 삭제 (새로운 API 엔드포인트 사용)
  deleteArticle: async (articleId: string): Promise<any> => {
    try {
      console.log('게시글 삭제 요청:', articleId);

      // 새로운 API 엔드포인트 호출
      const response = await axiosServer.delete(`/admin/community/articles`, {
        data: { articleId }
      });
      console.log('게시글 삭제 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('게시글 삭제 중 오류:', error);
      throw error;
    }
  },

  // 게시글 카테고리 이전
  moveArticleCategory: async (articleId: string, categoryId: string): Promise<any> => {
    try {
      console.log('게시글 카테고리 이전 요청:', { articleId, categoryId });

      const response = await axiosServer.patch(`/admin/community/articles/category`, {
        articleId,
        categoryId
      });
      console.log('게시글 카테고리 이전 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('게시글 카테고리 이전 중 오류:', error);
      throw error;
    }
  },

  // 게시글 카테고리 목록 조회
  getCategories: async (): Promise<{ categories: Category[] }> => {
    try {
      console.log('게시글 카테고리 목록 조회 요청');

      const response = await axiosServer.get(`/admin/community/categories`);
      console.log('게시글 카테고리 목록 조회 응답:', response.data);

      // 백엔드 응답 구조에 맞게 반환
      return {
        categories: response.data.categories ?? []
      };
    } catch (error) {
      console.error('게시글 카테고리 목록 조회 중 오류:', error);
      throw error;
    }
  },

  // 댓글 목록 조회
  getComments: async (articleId: string, filter: 'all' | 'reported' | 'blinded' = 'all', page = 1, limit = 10): Promise<PaginatedResponse<Comment>> => {
    try {
      console.log('댓글 목록 조회 요청:', { articleId, filter, page, limit });

      // 실제 API 호출
      const response = await axiosServer.get(`/admin/community/comments?articleId=${articleId}`);
      console.log('댓글 목록 조회 응답:', response.data);

      // API 응답 구조에 맞게 데이터 반환
      return {
        items: response.data.items ?? [],
        meta: response.data.meta ?? {
          currentPage: page,
          itemsPerPage: limit,
          totalItems: response.data.items?.length ?? 0,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: page > 1
        }
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

      // API 응답 구조에 맞게 데이터 반환
      return {
        items: response.data.items ?? [],
        meta: response.data.meta ?? {
          currentPage: page,
          itemsPerPage: limit,
          totalItems: response.data.items?.length ?? 0,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: page > 1
        }
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
