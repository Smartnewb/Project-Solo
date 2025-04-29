import { ApiProperty } from '@nestjs/swagger';

export class ArticleDto {
  @ApiProperty({ description: '게시글 ID' })
  id: string;

  @ApiProperty({ description: '작성자 ID' })
  userId: string;

  @ApiProperty({ description: '작성자 닉네임' })
  nickname: string;

  @ApiProperty({ description: '작성자 이메일', required: false })
  email?: string;

  @ApiProperty({ description: '게시글 내용' })
  content: string;

  @ApiProperty({ description: '이모지' })
  emoji: string;

  @ApiProperty({ description: '익명 여부' })
  isAnonymous: boolean;

  @ApiProperty({ description: '좋아요 수' })
  likeCount: number;

  @ApiProperty({ description: '댓글 수' })
  commentCount: number;

  @ApiProperty({ description: '신고 수' })
  reportCount: number;

  @ApiProperty({ description: '블라인드 여부' })
  isBlinded: boolean;

  @ApiProperty({ description: '블라인드 사유', required: false })
  blindReason?: string;

  @ApiProperty({ description: '삭제 여부' })
  isDeleted: boolean;

  @ApiProperty({ description: '수정 여부' })
  isEdited: boolean;

  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @ApiProperty({ description: '수정일' })
  updatedAt: Date;
}

export class CommentDto {
  @ApiProperty({ description: '댓글 ID' })
  id: string;

  @ApiProperty({ description: '게시글 ID' })
  articleId: string;

  @ApiProperty({ description: '작성자 ID' })
  userId: string;

  @ApiProperty({ description: '작성자 닉네임' })
  nickname: string;

  @ApiProperty({ description: '작성자 이메일', required: false })
  email?: string;

  @ApiProperty({ description: '댓글 내용' })
  content: string;

  @ApiProperty({ description: '이모지' })
  emoji: string;

  @ApiProperty({ description: '익명 여부' })
  isAnonymous: boolean;

  @ApiProperty({ description: '좋아요 수' })
  likeCount: number;

  @ApiProperty({ description: '신고 수' })
  reportCount: number;

  @ApiProperty({ description: '블라인드 여부' })
  isBlinded: boolean;

  @ApiProperty({ description: '블라인드 사유', required: false })
  blindReason?: string;

  @ApiProperty({ description: '삭제 여부' })
  isDeleted: boolean;

  @ApiProperty({ description: '수정 여부' })
  isEdited: boolean;

  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @ApiProperty({ description: '수정일' })
  updatedAt: Date;
}

export class ReportDto {
  @ApiProperty({ description: '신고 ID' })
  id: string;

  @ApiProperty({ description: '신고 대상 타입', enum: ['article', 'comment'] })
  targetType: 'article' | 'comment';

  @ApiProperty({ description: '신고 대상 ID' })
  targetId: string;

  @ApiProperty({ description: '신고자 ID' })
  reporterId: string;

  @ApiProperty({ description: '신고자 닉네임' })
  reporterNickname: string;

  @ApiProperty({ description: '신고 사유' })
  reason: string;

  @ApiProperty({ description: '신고 상세 내용', required: false })
  description?: string;

  @ApiProperty({ description: '처리 상태', enum: ['pending', 'processed'] })
  status: 'pending' | 'processed';

  @ApiProperty({ description: '처리 결과', enum: ['accepted', 'rejected'], required: false })
  result?: 'accepted' | 'rejected';

  @ApiProperty({ description: '처리자 ID', required: false })
  processedById?: string;

  @ApiProperty({ description: '처리 메모', required: false })
  processMemo?: string;

  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @ApiProperty({ description: '처리일', required: false })
  processedAt?: Date;

  @ApiProperty({ description: '신고 대상 내용 (게시글 또는 댓글)', required: false })
  targetContent?: string;
}

export class ArticleListResponseDto {
  @ApiProperty({ description: '게시글 목록', type: [ArticleDto] })
  articles: ArticleDto[];

  @ApiProperty({ description: '전체 게시글 수' })
  total: number;

  @ApiProperty({ description: '현재 페이지' })
  page: number;

  @ApiProperty({ description: '페이지당 게시글 수' })
  limit: number;

  @ApiProperty({ description: '전체 페이지 수' })
  totalPages: number;
}

export class ArticleDetailResponseDto extends ArticleDto {
  @ApiProperty({ description: '댓글 목록', type: [CommentDto] })
  comments: CommentDto[];

  @ApiProperty({ description: '신고 목록', type: [ReportDto] })
  reports: ReportDto[];
}

export class CommentListResponseDto {
  @ApiProperty({ description: '댓글 목록', type: [CommentDto] })
  comments: CommentDto[];

  @ApiProperty({ description: '전체 댓글 수' })
  total: number;

  @ApiProperty({ description: '현재 페이지' })
  page: number;

  @ApiProperty({ description: '페이지당 댓글 수' })
  limit: number;

  @ApiProperty({ description: '전체 페이지 수' })
  totalPages: number;
}

export class ReportListResponseDto {
  @ApiProperty({ description: '신고 목록', type: [ReportDto] })
  reports: ReportDto[];

  @ApiProperty({ description: '전체 신고 수' })
  total: number;

  @ApiProperty({ description: '현재 페이지' })
  page: number;

  @ApiProperty({ description: '페이지당 신고 수' })
  limit: number;

  @ApiProperty({ description: '전체 페이지 수' })
  totalPages: number;
}

export class BlindArticleDto {
  @ApiProperty({ description: '블라인드 여부' })
  isBlinded: boolean;

  @ApiProperty({ description: '블라인드 사유', required: false })
  reason?: string;
}

export class BlindCommentDto {
  @ApiProperty({ description: '블라인드 여부' })
  isBlinded: boolean;

  @ApiProperty({ description: '블라인드 사유', required: false })
  reason?: string;
}

export class ProcessReportDto {
  @ApiProperty({ description: '처리 결과', enum: ['accepted', 'rejected'] })
  result: 'accepted' | 'rejected';

  @ApiProperty({ description: '처리 메모', required: false })
  memo?: string;

  @ApiProperty({ description: '블라인드 처리 여부 (신고 수락 시)', required: false })
  blind?: boolean;
}
