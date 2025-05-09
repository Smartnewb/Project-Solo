import axiosServer from '@/utils/axios';

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

  // 게시글 상세 조회
  getArticleDetail: async (id: string): Promise<ArticleDetail> => {
    try {
      console.log('게시글 상세 조회 요청:', id);

      // 실제 API 호출 (백엔드 준비되면 주석 해제)
      // const response = await axiosServer.get(`/admin/community/articles/${id}`);
      // console.log('게시글 상세 조회 응답:', response.data);
      // return response.data;

      // 목업 데이터 반환
      console.log('목업 데이터 사용 중');

      // 게시글 목업 데이터
      const mockArticle: Article = {
        id,
        userId: `user-${Math.floor(Math.random() * 10) + 1}`,
        nickname: `사용자${Math.floor(Math.random() * 100) + 1}`,
        email: `user${Math.floor(Math.random() * 100) + 1}@example.com`,
        content: `이것은 테스트 게시글 ${id}입니다. 여기에 게시글 내용이 들어갑니다. 이 게시글은 목업 데이터로 생성되었습니다. 좀 더 긴 내용을 가진 게시글입니다. 여러 줄에 걸쳐 표시될 수 있습니다. 커뮤니티 관리 기능 테스트를 위한 목업 데이터입니다.`,
        emoji: ['😊', '🥰', '😎', '🤗', '😇', '🥱', '🤒', '😡', '😍', '🤣'][Math.floor(Math.random() * 10)],
        isAnonymous: Math.random() > 0.5,
        likeCount: Math.floor(Math.random() * 50),
        commentCount: Math.floor(Math.random() * 10),
        reportCount: Math.floor(Math.random() * 5),
        isBlinded: Math.random() < 0.2,
        blindReason: Math.random() < 0.2 ? '커뮤니티 가이드라인 위반' : undefined,
        isDeleted: false,
        isEdited: Math.random() > 0.7,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      };

      // 댓글 목업 데이터
      const mockComments: Comment[] = Array.from({ length: Math.floor(Math.random() * 8) + 2 }, (_, i) => ({
        id: `comment-${id}-${i + 1}`,
        articleId: id,
        userId: `user-${Math.floor(Math.random() * 10) + 1}`,
        nickname: `댓글작성자${Math.floor(Math.random() * 100) + 1}`,
        email: `commenter${Math.floor(Math.random() * 100) + 1}@example.com`,
        content: `이것은 테스트 댓글 ${i + 1}입니다. 게시글 ${id}에 대한 댓글입니다.`,
        emoji: ['😊', '🥰', '😎', '🤗', '😇', '🥱', '🤒', '😡', '😍', '🤣'][Math.floor(Math.random() * 10)],
        isAnonymous: Math.random() > 0.5,
        likeCount: Math.floor(Math.random() * 20),
        reportCount: Math.floor(Math.random() * 3),
        isBlinded: Math.random() < 0.2,
        blindReason: Math.random() < 0.2 ? '부적절한 내용' : undefined,
        isDeleted: Math.random() < 0.1,
        isEdited: Math.random() > 0.7,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 20) * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      }));

      // 신고 목업 데이터
      const mockReports: Report[] = Array.from({ length: Math.floor(Math.random() * 3) }, (_, i) => ({
        id: `report-${id}-${i + 1}`,
        targetType: 'article',
        targetId: id,
        reporterId: `user-${Math.floor(Math.random() * 10) + 1}`,
        reporterNickname: `신고자${Math.floor(Math.random() * 100) + 1}`,
        reason: ['음란물/성적 콘텐츠', '폭력적/폭력 위협 콘텐츠', '증오/혐오 발언', '스팸/광고', '개인정보 노출'][Math.floor(Math.random() * 5)],
        description: Math.random() > 0.5 ? '이 게시글은 커뮤니티 가이드라인을 위반합니다.' : undefined,
        status: Math.random() > 0.7 ? 'processed' : 'pending',
        result: Math.random() > 0.7 ? (Math.random() > 0.5 ? 'accepted' : 'rejected') : undefined,
        processedById: Math.random() > 0.7 ? 'admin-1' : undefined,
        processedByNickname: Math.random() > 0.7 ? '관리자' : undefined,
        processMemo: Math.random() > 0.7 ? '신고 처리 완료' : undefined,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000),
        processedAt: Math.random() > 0.7 ? new Date() : undefined,
        targetContent: mockArticle.content
      }));

      // 게시글 상세 정보 반환
      return {
        ...mockArticle,
        comments: mockComments,
        reports: mockReports
      };
    } catch (error) {
      console.error('게시글 상세 조회 중 오류:', error);
      throw error;
    }
  },

  // 게시글 블라인드 처리/해제
  blindArticle: async (id: string, isBlinded: boolean, reason?: string): Promise<any> => {
    try {
      console.log('게시글 블라인드 처리 요청:', { id, isBlinded, reason });

      // 실제 API 호출 (백엔드 준비되면 주석 해제)
      // const response = await axiosServer.patch(`/admin/community/articles/${id}/blind`, {
      //   isBlinded,
      //   reason
      // });
      // console.log('게시글 블라인드 처리 응답:', response.data);
      // return response.data;

      // 목업 데이터 반환
      console.log('목업 데이터 사용 중');

      // 성공 응답 시뮬레이션
      return {
        success: true,
        message: `게시글 ${isBlinded ? '블라인드' : '블라인드 해제'} 처리가 완료되었습니다.`,
        article: {
          id,
          isBlinded,
          blindReason: reason,
          updatedAt: new Date()
        }
      };
    } catch (error) {
      console.error('게시글 블라인드 처리 중 오류:', error);
      throw error;
    }
  },

  // 게시글 삭제
  deleteArticle: async (id: string): Promise<any> => {
    try {
      console.log('게시글 삭제 요청:', id);

      // 실제 API 호출 (백엔드 준비되면 주석 해제)
      // const response = await axiosServer.delete(`/admin/community/articles/${id}`);
      // console.log('게시글 삭제 응답:', response.data);
      // return response.data;

      // 목업 데이터 반환
      console.log('목업 데이터 사용 중');

      // 성공 응답 시뮬레이션
      return {
        success: true,
        message: '게시글이 삭제되었습니다.',
        article: {
          id,
          isDeleted: true,
          updatedAt: new Date()
        }
      };
    } catch (error) {
      console.error('게시글 삭제 중 오류:', error);
      throw error;
    }
  },

  // 댓글 목록 조회
  getComments: async (articleId: string, filter: 'all' | 'reported' | 'blinded' = 'all', page = 1, limit = 10): Promise<PaginatedResponse<Comment>> => {
    try {
      console.log('댓글 목록 조회 요청:', { articleId, filter, page, limit });

      // 실제 API 호출 (백엔드 준비되면 주석 해제)
      // const response = await axiosServer.get(`/admin/community/articles/${articleId}/comments`, {
      //   params: { filter, page, limit }
      // });
      // console.log('댓글 목록 조회 응답:', response.data);
      // return response.data;

      // 목업 데이터 반환
      console.log('목업 데이터 사용 중');

      // 댓글 목업 데이터 생성
      const mockComments = Array.from({ length: 15 }, (_, i) => ({
        id: `comment-${articleId}-${i + 1}`,
        articleId,
        userId: `user-${Math.floor(Math.random() * 10) + 1}`,
        nickname: `댓글작성자${Math.floor(Math.random() * 100) + 1}`,
        email: `commenter${Math.floor(Math.random() * 100) + 1}@example.com`,
        content: `이것은 테스트 댓글 ${i + 1}입니다. 게시글 ${articleId}에 대한 댓글입니다.`,
        emoji: ['😊', '🥰', '😎', '🤗', '😇', '🥱', '🤒', '😡', '😍', '🤣'][Math.floor(Math.random() * 10)],
        isAnonymous: Math.random() > 0.5,
        likeCount: Math.floor(Math.random() * 20),
        reportCount: filter === 'reported' ? Math.floor(Math.random() * 3) + 1 : Math.floor(Math.random() * 2),
        isBlinded: filter === 'blinded' ? true : Math.random() < 0.2,
        blindReason: filter === 'blinded' ? '부적절한 내용' : undefined,
        isDeleted: Math.random() < 0.1,
        isEdited: Math.random() > 0.7,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 20) * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      }));

      // 필터링 적용
      let filteredComments = [...mockComments];
      if (filter === 'reported') {
        filteredComments = mockComments.filter(comment => comment.reportCount > 0);
      } else if (filter === 'blinded') {
        filteredComments = mockComments.filter(comment => comment.isBlinded);
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

  // 댓글 블라인드 처리/해제
  blindComment: async (id: string, isBlinded: boolean, reason?: string): Promise<any> => {
    try {
      console.log('댓글 블라인드 처리 요청:', { id, isBlinded, reason });

      // 실제 API 호출 (백엔드 준비되면 주석 해제)
      // const response = await axiosServer.patch(`/admin/community/comments/${id}/blind`, {
      //   isBlinded,
      //   reason
      // });
      // console.log('댓글 블라인드 처리 응답:', response.data);
      // return response.data;

      // 목업 데이터 반환
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
  deleteComment: async (id: string): Promise<any> => {
    try {
      console.log('댓글 삭제 요청:', id);

      // 실제 API 호출 (백엔드 준비되면 주석 해제)
      // const response = await axiosServer.delete(`/admin/community/comments/${id}`);
      // console.log('댓글 삭제 응답:', response.data);
      // return response.data;

      // 목업 데이터 반환
      console.log('목업 데이터 사용 중');

      // 성공 응답 시뮬레이션
      return {
        success: true,
        message: '댓글이 삭제되었습니다.',
        comment: {
          id,
          isDeleted: true,
          updatedAt: new Date()
        }
      };
    } catch (error) {
      console.error('댓글 삭제 중 오류:', error);
      throw error;
    }
  },

  // 신고 목록 조회
  getReports: async (type: 'article' | 'comment' | 'all' = 'all', status: 'pending' | 'processed' | 'all' = 'all', page = 1, limit = 10): Promise<PaginatedResponse<Report>> => {
    try {
      console.log('신고 목록 조회 요청:', { type, status, page, limit });

      // 실제 API 호출 (백엔드 준비되면 주석 해제)
      // const response = await axiosServer.get(`/admin/community/reports`, {
      //   params: { type, status, page, limit }
      // });
      // console.log('신고 목록 조회 응답:', response.data);
      // return response.data;

      // 목업 데이터 반환
      console.log('목업 데이터 사용 중');

      // 신고 목업 데이터 생성
      const mockReports = Array.from({ length: 30 }, (_, i) => {
        const isArticle = Math.random() > 0.4;
        const isProcessed = Math.random() > 0.6;
        const isAccepted = isProcessed && Math.random() > 0.3;

        return {
          id: `report-${i + 1}`,
          targetType: isArticle ? 'article' as const : 'comment' as const,
          targetId: isArticle ? `article-${Math.floor(Math.random() * 20) + 1}` : `comment-${Math.floor(Math.random() * 50) + 1}`,
          reporterId: `user-${Math.floor(Math.random() * 10) + 1}`,
          reporterNickname: `신고자${Math.floor(Math.random() * 100) + 1}`,
          reason: ['음란물/성적 콘텐츠', '폭력적/폭력 위협 콘텐츠', '증오/혐오 발언', '스팸/광고', '개인정보 노출'][Math.floor(Math.random() * 5)],
          description: Math.random() > 0.5 ? '이 콘텐츠는 커뮤니티 가이드라인을 위반합니다.' : undefined,
          status: isProcessed ? 'processed' as const : 'pending' as const,
          result: isProcessed ? (isAccepted ? 'accepted' as const : 'rejected' as const) : undefined,
          processedById: isProcessed ? 'admin-1' : undefined,
          processedByNickname: isProcessed ? '관리자' : undefined,
          processMemo: isProcessed ? (isAccepted ? '신고 수락 및 처리 완료' : '신고 내용 검토 후 기각') : undefined,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
          processedAt: isProcessed ? new Date(Date.now() - Math.floor(Math.random() * 5) * 24 * 60 * 60 * 1000) : undefined,
          targetContent: isArticle
            ? `이것은 신고된 게시글 내용입니다. 게시글 ID: ${Math.floor(Math.random() * 20) + 1}`
            : `이것은 신고된 댓글 내용입니다. 댓글 ID: ${Math.floor(Math.random() * 50) + 1}`
        };
      });

      // 필터링 적용
      let filteredReports = [...mockReports];

      // 타입 필터링
      if (type === 'article') {
        filteredReports = filteredReports.filter(report => report.targetType === 'article');
      } else if (type === 'comment') {
        filteredReports = filteredReports.filter(report => report.targetType === 'comment');
      }

      // 상태 필터링
      if (status === 'pending') {
        filteredReports = filteredReports.filter(report => report.status === 'pending');
      } else if (status === 'processed') {
        filteredReports = filteredReports.filter(report => report.status === 'processed');
      }

      // 페이지네이션 적용
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedReports = filteredReports.slice(startIndex, endIndex);

      return {
        items: paginatedReports,
        total: filteredReports.length,
        page,
        limit,
        totalPages: Math.ceil(filteredReports.length / limit)
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

      // 실제 API 호출 (백엔드 준비되면 주석 해제)
      // const response = await axiosServer.patch(`/admin/community/reports/${id}/process`, {
      //   result,
      //   memo,
      //   blind
      // });
      // console.log('신고 처리 응답:', response.data);
      // return response.data;

      // 목업 데이터 반환
      console.log('목업 데이터 사용 중');

      // 성공 응답 시뮬레이션
      return {
        success: true,
        message: `신고가 ${result === 'accepted' ? '수락' : '거절'}되었습니다.`,
        report: {
          id,
          status: 'processed',
          result,
          processMemo: memo,
          processedAt: new Date(),
          blind
        }
      };
    } catch (error) {
      console.error('신고 처리 중 오류:', error);
      throw error;
    }
  },

  // 여러 게시글 일괄 블라인드 처리/해제
  bulkBlindArticles: async (ids: string[], isBlinded: boolean, reason?: string): Promise<any> => {
    try {
      console.log('게시글 일괄 블라인드 처리 요청:', { ids, isBlinded, reason });

      // 실제 API 호출 (백엔드 준비되면 주석 해제)
      // const response = await axiosServer.patch(`/admin/community/articles/bulk/blind`, {
      //   ids,
      //   isBlinded,
      //   reason
      // });
      // console.log('게시글 일괄 블라인드 처리 응답:', response.data);
      // return response.data;

      // 목업 데이터 반환
      console.log('목업 데이터 사용 중');

      // 성공 응답 시뮬레이션
      return {
        success: true,
        message: `${ids.length}개의 게시글이 ${isBlinded ? '블라인드' : '블라인드 해제'} 처리되었습니다.`,
        articles: ids.map(id => ({
          id,
          isBlinded,
          blindReason: reason,
          updatedAt: new Date()
        }))
      };
    } catch (error) {
      console.error('게시글 일괄 블라인드 처리 중 오류:', error);
      throw error;
    }
  },

  // 여러 게시글 일괄 삭제
  bulkDeleteArticles: async (ids: string[]): Promise<any> => {
    try {
      console.log('게시글 일괄 삭제 요청:', ids);

      // 실제 API 호출 (백엔드 준비되면 주석 해제)
      // const response = await axiosServer.delete(`/admin/community/articles/bulk`, {
      //   data: { ids }
      // });
      // console.log('게시글 일괄 삭제 응답:', response.data);
      // return response.data;

      // 목업 데이터 반환
      console.log('목업 데이터 사용 중');

      // 성공 응답 시뮬레이션
      return {
        success: true,
        message: `${ids.length}개의 게시글이 삭제되었습니다.`,
        articles: ids.map(id => ({
          id,
          isDeleted: true,
          updatedAt: new Date()
        }))
      };
    } catch (error) {
      console.error('게시글 일괄 삭제 중 오류:', error);
      throw error;
    }
  },

  // 여러 댓글 일괄 블라인드 처리/해제
  bulkBlindComments: async (ids: string[], isBlinded: boolean, reason?: string): Promise<any> => {
    try {
      console.log('댓글 일괄 블라인드 처리 요청:', { ids, isBlinded, reason });

      // 실제 API 호출 (백엔드 준비되면 주석 해제)
      // const response = await axiosServer.patch(`/admin/community/comments/bulk/blind`, {
      //   ids,
      //   isBlinded,
      //   reason
      // });
      // console.log('댓글 일괄 블라인드 처리 응답:', response.data);
      // return response.data;

      // 목업 데이터 반환
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
  bulkDeleteComments: async (ids: string[]): Promise<any> => {
    try {
      console.log('댓글 일괄 삭제 요청:', ids);

      // 실제 API 호출 (백엔드 준비되면 주석 해제)
      // const response = await axiosServer.delete(`/admin/community/comments/bulk`, {
      //   data: { ids }
      // });
      // console.log('댓글 일괄 삭제 응답:', response.data);
      // return response.data;

      // 목업 데이터 반환
      console.log('목업 데이터 사용 중');

      // 성공 응답 시뮬레이션
      return {
        success: true,
        message: `${ids.length}개의 댓글이 삭제되었습니다.`,
        comments: ids.map(id => ({
          id,
          isDeleted: true,
          updatedAt: new Date()
        }))
      };
    } catch (error) {
      console.error('댓글 일괄 삭제 중 오류:', error);
      throw error;
    }
  },

  // 휴지통 게시글 목록 조회
  getTrashArticles: async (page = 1, limit = 10): Promise<PaginatedResponse<Article>> => {
    try {
      console.log('휴지통 게시글 목록 조회 요청:', { page, limit });

      // 실제 API 호출 (주석 처리)
      /*
      const response = await axiosServer.get(`/api/admin/community/trash/articles`, {
        params: { page, limit }
      });
      console.log('휴지통 게시글 목록 조회 응답:', response.data);
      return response.data;
      */

      // 목업 데이터 사용
      console.log('목업 데이터 사용 중');

      // 목업 데이터 생성
      const mockArticles = Array.from({ length: 15 }, (_, i) => ({
        id: `trash-article-${i + 1}`,
        userId: `user-${Math.floor(Math.random() * 10) + 1}`,
        nickname: `사용자${Math.floor(Math.random() * 100) + 1}`,
        email: `user${Math.floor(Math.random() * 100) + 1}@example.com`,
        content: `이것은 삭제된 게시글 ${i + 1}입니다. 휴지통에 있는 게시글입니다.`,
        emoji: ['😊', '🥰', '😎', '🤗', '😇', '🥱', '🤒', '😡', '😍', '🤣'][Math.floor(Math.random() * 10)],
        isAnonymous: Math.random() > 0.5,
        likeCount: Math.floor(Math.random() * 50),
        commentCount: Math.floor(Math.random() * 10),
        reportCount: Math.floor(Math.random() * 3),
        isBlinded: Math.random() < 0.2,
        isDeleted: true,
        isEdited: Math.random() > 0.7,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        deletedAt: new Date(Date.now() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000)
      }));

      // 페이지네이션 적용
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedArticles = mockArticles.slice(startIndex, endIndex);

      return {
        items: paginatedArticles,
        total: mockArticles.length,
        page,
        limit,
        totalPages: Math.ceil(mockArticles.length / limit)
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

      // 실제 API 호출 (주석 처리)
      /*
      const response = await axiosServer.delete(`/api/admin/community/trash/articles`);
      console.log('휴지통 비우기 응답:', response.data);
      return response.data;
      */

      // 목업 데이터 사용
      console.log('목업 데이터 사용 중');

      // 성공 응답 시뮬레이션
      return {
        success: true,
        message: '휴지통이 비워졌습니다.',
      };
    } catch (error) {
      console.error('휴지통 비우기 중 오류:', error);
      throw error;
    }
  },

  // 게시글 영구 삭제
  permanentDeleteArticle: async (id: string): Promise<any> => {
    try {
      console.log('게시글 영구 삭제 요청:', id);

      // 실제 API 호출 (주석 처리)
      /*
      const response = await axiosServer.delete(`/api/admin/community/articles/${id}/permanent`);
      console.log('게시글 영구 삭제 응답:', response.data);
      return response.data;
      */

      // 목업 데이터 사용
      console.log('목업 데이터 사용 중');

      // 성공 응답 시뮬레이션
      return {
        success: true,
        message: '게시글이 영구적으로 삭제되었습니다.',
        article: {
          id,
          permanentlyDeleted: true
        }
      };
    } catch (error) {
      console.error('게시글 영구 삭제 중 오류:', error);
      throw error;
    }
  },

  // 게시글 복원
  restoreArticle: async (id: string): Promise<any> => {
    try {
      console.log('게시글 복원 요청:', id);

      // 실제 API 호출 (주석 처리)
      /*
      const response = await axiosServer.patch(`/api/admin/community/articles/${id}/restore`);
      console.log('게시글 복원 응답:', response.data);
      return response.data;
      */

      // 목업 데이터 사용
      console.log('목업 데이터 사용 중');

      // 성공 응답 시뮬레이션
      return {
        success: true,
        message: '게시글이 복원되었습니다.',
        article: {
          id,
          isDeleted: false,
          updatedAt: new Date()
        }
      };
    } catch (error) {
      console.error('게시글 복원 중 오류:', error);
      throw error;
    }
  }
};

export default communityService;
