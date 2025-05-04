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

      // 백엔드 API 경로 시도 (여러 가능한 경로 시도)
      let articleResponse;
      try {
        // 첫 번째 경로 시도
        articleResponse = await adminAxios.get(`/api/admin/community/articles/${id}`);
      } catch (err) {
        console.log('첫 번째 경로 실패, 대체 경로 시도:', err);
        try {
          // 두 번째 경로 시도
          articleResponse = await adminAxios.get(`/api/admin/community/posts/${id}`);
        } catch (err2) {
          console.log('두 번째 경로 실패, 세 번째 경로 시도:', err2);
          // 세 번째 경로 시도
          articleResponse = await adminAxios.get(`/api/admin/community/posts/${id}/detail`);
        }
      }

      console.log('게시글 상세 조회 응답:', articleResponse.data);

      // 댓글 조회 (여러 가능한 경로 시도)
      let commentsResponse;
      try {
        commentsResponse = await adminAxios.get(`/api/admin/community/articles/${id}/comments`);
      } catch (err) {
        console.log('댓글 첫 번째 경로 실패, 대체 경로 시도:', err);
        try {
          commentsResponse = await adminAxios.get(`/api/admin/community/posts/${id}/comments`);
        } catch (err2) {
          console.log('댓글 두 번째 경로 실패, 세 번째 경로 시도:', err2);
          try {
            // 세 번째 경로 시도 - 일부 API는 다른 형식의 응답을 반환할 수 있음
            commentsResponse = await adminAxios.get(`/api/admin/community/comments`, {
              params: { postId: id }
            });
          } catch (err3) {
            console.log('댓글 세 번째 경로 실패, 빈 배열 사용:', err3);
            commentsResponse = { data: { items: [] } };
          }
        }
      }

      // 응답 구조 확인 및 정규화
      let comments = [];
      if (commentsResponse.data) {
        if (Array.isArray(commentsResponse.data)) {
          // 배열 형태로 직접 반환된 경우
          comments = commentsResponse.data;
        } else if (commentsResponse.data.items && Array.isArray(commentsResponse.data.items)) {
          // items 배열로 반환된 경우
          comments = commentsResponse.data.items;
        } else if (commentsResponse.data.comments && Array.isArray(commentsResponse.data.comments)) {
          // comments 배열로 반환된 경우
          comments = commentsResponse.data.comments;
        } else if (commentsResponse.data.data && Array.isArray(commentsResponse.data.data)) {
          // data 배열로 반환된 경우
          comments = commentsResponse.data.data;
        }
      }

      console.log('댓글 목록 조회 응답 (정규화):', comments);

      // 신고 조회 (여러 가능한 경로 시도)
      let reportsResponse;
      try {
        reportsResponse = await adminAxios.get(`/api/admin/community/articles/${id}/reports`);
      } catch (err) {
        console.log('신고 첫 번째 경로 실패, 대체 경로 시도:', err);
        try {
          reportsResponse = await adminAxios.get(`/api/admin/community/posts/${id}/reports`);
        } catch (err2) {
          console.log('신고 두 번째 경로 실패, 빈 배열 사용:', err2);
          reportsResponse = { data: { items: [] } };
        }
      }
      console.log('신고 목록 조회 응답:', reportsResponse.data);

      // 백엔드 응답 형식에 맞게 변환
      const article = articleResponse.data;
      const reports = reportsResponse.data.items || [];

      // 프론트엔드에서 필요한 추가 필드 설정
      // 백엔드 응답 구조 로깅
      console.log('백엔드 응답 구조:', JSON.stringify(article, null, 2));

      // 작성자 정보 처리
      let authorInfo = { id: '', name: '알 수 없음', email: '' };
      if (article.author) {
        authorInfo = {
          id: article.author.id || '',
          name: article.author.name || '알 수 없음',
          email: article.author.email || ''
        };
      } else if (article.authorId) {
        authorInfo = {
          id: article.authorId,
          name: '사용자 ' + article.authorId.substring(0, 5),
          email: ''
        };
      }

      // 게시글 상태 정보
      const isBlinded = article.blindedAt !== null && article.blindedAt !== undefined;
      const isDeleted = article.deletedAt !== null && article.deletedAt !== undefined;
      const isEdited = article.updatedAt !== null && article.updatedAt !== undefined &&
                      article.updatedAt !== article.createdAt;

      const transformedArticle = {
        ...article,
        // 필수 필드가 없는 경우 기본값 제공
        id: article.id || id,
        content: article.content || '',
        emoji: article.emoji || null,
        author: authorInfo,
        authorId: article.authorId || '',
        nickname: article.nickname || authorInfo.name,
        email: article.email || authorInfo.email,
        anonymous: article.anonymous || false,
        isAnonymous: article.anonymous || false,
        isBlinded: isBlinded,
        isDeleted: isDeleted,
        isEdited: isEdited,
        blindedAt: article.blindedAt || null,
        deletedAt: article.deletedAt || null,
        updatedAt: article.updatedAt || null,
        createdAt: article.createdAt || new Date().toISOString(),
        likeCount: article.likeCount || 0,
        commentCount: comments.length,
        reportCount: reports.length,
        comments: comments.map((comment: any) => {
          // 댓글 작성자 정보 처리
          let commentAuthorInfo = { id: '', name: '알 수 없음', email: '' };
          if (comment.author) {
            commentAuthorInfo = {
              id: comment.author.id || '',
              name: comment.author.name || '알 수 없음',
              email: comment.author.email || ''
            };
          } else if (comment.authorId) {
            commentAuthorInfo = {
              id: comment.authorId,
              name: comment.nickname || ('사용자 ' + comment.authorId.substring(0, 5)),
              email: ''
            };
          }

          return {
            ...comment,
            id: comment.id || '',
            content: comment.content || '',
            emoji: comment.emoji || null,
            author: commentAuthorInfo,
            nickname: comment.nickname || commentAuthorInfo.name,
            isBlinded: comment.blindedAt !== null && comment.blindedAt !== undefined,
            isDeleted: comment.deletedAt !== null && comment.deletedAt !== undefined,
            isEdited: comment.updatedAt !== null && comment.updatedAt !== undefined &&
                     comment.updatedAt !== comment.createdAt,
            articleId: article.id || id,
            createdAt: comment.createdAt || new Date().toISOString(),
            reportCount: 0
          };
        }),
        reports: reports.map((report: any) => ({
          ...report,
          id: report.id || '',
          targetType: 'article',
          targetId: article.id || id,
          reporterNickname: report.reporter?.name || '익명',
          targetContent: article.content || ''
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

      // 백엔드 API 경로 시도 (여러 가능한 경로 시도)
      let response;

      if (isBlinded) {
        // 블라인드 처리
        try {
          // 첫 번째 경로 시도
          response = await adminAxios.patch(`/api/admin/community/articles/${id}/blind`, {
            reason
          });
        } catch (err) {
          console.log('블라인드 첫 번째 경로 실패, 대체 경로 시도:', err);
          // 두 번째 경로 시도
          response = await adminAxios.patch(`/api/admin/community/posts/${id}/blind`, {
            reason
          });
        }
      } else {
        // 블라인드 해제
        try {
          // 첫 번째 경로 시도
          response = await adminAxios.patch(`/api/admin/community/articles/${id}/unblind`);
        } catch (err) {
          console.log('블라인드 해제 첫 번째 경로 실패, 대체 경로 시도:', err);
          // 두 번째 경로 시도
          response = await adminAxios.patch(`/api/admin/community/posts/${id}/unblind`);
        }
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

      // 백엔드 API 경로 시도 (여러 가능한 경로 시도)
      let response;
      try {
        // 첫 번째 경로 시도
        response = await adminAxios.delete(`/api/admin/community/articles/${id}`, {
          data: { reason }
        });
      } catch (err) {
        console.log('삭제 첫 번째 경로 실패, 대체 경로 시도:', err);
        // 두 번째 경로 시도
        response = await adminAxios.delete(`/api/admin/community/posts/${id}`, {
          data: { reason }
        });
      }

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
