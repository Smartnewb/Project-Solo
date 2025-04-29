import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CommunityService } from './community.service';
import { 
  ArticleListResponseDto, 
  ArticleDetailResponseDto,
  CommentListResponseDto,
  ReportListResponseDto,
  BlindArticleDto,
  BlindCommentDto,
  ProcessReportDto
} from './dto/community.dto';

@ApiTags('Admin Community')
@Controller('admin/community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @ApiOperation({ summary: '게시글 목록 조회' })
  @ApiQuery({ name: 'filter', enum: ['all', 'reported', 'blinded'], required: false })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiResponse({ status: 200, description: '게시글 목록 조회 성공', type: ArticleListResponseDto })
  @Get('articles')
  async getArticles(
    @Query('filter') filter: 'all' | 'reported' | 'blinded' = 'all',
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.communityService.getArticles(filter, page, limit);
  }

  @ApiOperation({ summary: '게시글 상세 조회' })
  @ApiParam({ name: 'id', description: '게시글 ID' })
  @ApiResponse({ status: 200, description: '게시글 상세 조회 성공', type: ArticleDetailResponseDto })
  @Get('articles/:id')
  async getArticleDetail(@Param('id') id: string) {
    return this.communityService.getArticleDetail(id);
  }

  @ApiOperation({ summary: '게시글 블라인드 처리/해제' })
  @ApiResponse({ status: 200, description: '게시글 블라인드 처리/해제 성공' })
  @Patch('articles/:id/blind')
  async blindArticle(
    @Param('id') id: string,
    @Body() blindArticleDto: BlindArticleDto,
  ) {
    return this.communityService.blindArticle(id, blindArticleDto);
  }

  @ApiOperation({ summary: '게시글 삭제' })
  @ApiResponse({ status: 200, description: '게시글 삭제 성공' })
  @Delete('articles/:id')
  async deleteArticle(@Param('id') id: string) {
    return this.communityService.deleteArticle(id);
  }

  @ApiOperation({ summary: '댓글 목록 조회' })
  @ApiParam({ name: 'articleId', description: '게시글 ID' })
  @ApiQuery({ name: 'filter', enum: ['all', 'reported', 'blinded'], required: false })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiResponse({ status: 200, description: '댓글 목록 조회 성공', type: CommentListResponseDto })
  @Get('articles/:articleId/comments')
  async getComments(
    @Param('articleId') articleId: string,
    @Query('filter') filter: 'all' | 'reported' | 'blinded' = 'all',
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.communityService.getComments(articleId, filter, page, limit);
  }

  @ApiOperation({ summary: '댓글 블라인드 처리/해제' })
  @ApiResponse({ status: 200, description: '댓글 블라인드 처리/해제 성공' })
  @Patch('comments/:id/blind')
  async blindComment(
    @Param('id') id: string,
    @Body() blindCommentDto: BlindCommentDto,
  ) {
    return this.communityService.blindComment(id, blindCommentDto);
  }

  @ApiOperation({ summary: '댓글 삭제' })
  @ApiResponse({ status: 200, description: '댓글 삭제 성공' })
  @Delete('comments/:id')
  async deleteComment(@Param('id') id: string) {
    return this.communityService.deleteComment(id);
  }

  @ApiOperation({ summary: '신고 목록 조회' })
  @ApiQuery({ name: 'type', enum: ['article', 'comment', 'all'], required: false })
  @ApiQuery({ name: 'status', enum: ['pending', 'processed', 'all'], required: false })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiResponse({ status: 200, description: '신고 목록 조회 성공', type: ReportListResponseDto })
  @Get('reports')
  async getReports(
    @Query('type') type: 'article' | 'comment' | 'all' = 'all',
    @Query('status') status: 'pending' | 'processed' | 'all' = 'all',
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.communityService.getReports(type, status, page, limit);
  }

  @ApiOperation({ summary: '신고 처리' })
  @ApiResponse({ status: 200, description: '신고 처리 성공' })
  @Patch('reports/:id/process')
  async processReport(
    @Param('id') id: string,
    @Body() processReportDto: ProcessReportDto,
  ) {
    return this.communityService.processReport(id, processReportDto);
  }

  @ApiOperation({ summary: '여러 게시글 일괄 블라인드 처리/해제' })
  @ApiResponse({ status: 200, description: '게시글 일괄 블라인드 처리/해제 성공' })
  @Patch('articles/bulk/blind')
  async bulkBlindArticles(
    @Body() data: { ids: string[], isBlinded: boolean, reason?: string },
  ) {
    return this.communityService.bulkBlindArticles(data.ids, data.isBlinded, data.reason);
  }

  @ApiOperation({ summary: '여러 게시글 일괄 삭제' })
  @ApiResponse({ status: 200, description: '게시글 일괄 삭제 성공' })
  @Delete('articles/bulk')
  async bulkDeleteArticles(
    @Body() data: { ids: string[] },
  ) {
    return this.communityService.bulkDeleteArticles(data.ids);
  }

  @ApiOperation({ summary: '여러 댓글 일괄 블라인드 처리/해제' })
  @ApiResponse({ status: 200, description: '댓글 일괄 블라인드 처리/해제 성공' })
  @Patch('comments/bulk/blind')
  async bulkBlindComments(
    @Body() data: { ids: string[], isBlinded: boolean, reason?: string },
  ) {
    return this.communityService.bulkBlindComments(data.ids, data.isBlinded, data.reason);
  }

  @ApiOperation({ summary: '여러 댓글 일괄 삭제' })
  @ApiResponse({ status: 200, description: '댓글 일괄 삭제 성공' })
  @Delete('comments/bulk')
  async bulkDeleteComments(
    @Body() data: { ids: string[] },
  ) {
    return this.communityService.bulkDeleteComments(data.ids);
  }
}
