import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CommunityRepository } from './community.repository';
import { 
  BlindArticleDto, 
  BlindCommentDto, 
  ProcessReportDto 
} from './dto/community.dto';

@Injectable()
export class CommunityService {
  constructor(private readonly communityRepository: CommunityRepository) {}

  async getArticles(filter: 'all' | 'reported' | 'blinded', page: number, limit: number) {
    return this.communityRepository.findArticles(filter, page, limit);
  }

  async getArticleDetail(id: string) {
    const article = await this.communityRepository.findArticleById(id);
    if (!article) {
      throw new NotFoundException(`게시글 ID ${id}를 찾을 수 없습니다.`);
    }
    return article;
  }

  async blindArticle(id: string, blindArticleDto: BlindArticleDto) {
    const article = await this.communityRepository.findArticleById(id);
    if (!article) {
      throw new NotFoundException(`게시글 ID ${id}를 찾을 수 없습니다.`);
    }

    return this.communityRepository.updateArticleBlindStatus(
      id, 
      blindArticleDto.isBlinded, 
      blindArticleDto.reason
    );
  }

  async deleteArticle(id: string) {
    const article = await this.communityRepository.findArticleById(id);
    if (!article) {
      throw new NotFoundException(`게시글 ID ${id}를 찾을 수 없습니다.`);
    }

    return this.communityRepository.deleteArticle(id);
  }

  async getComments(articleId: string, filter: 'all' | 'reported' | 'blinded', page: number, limit: number) {
    const article = await this.communityRepository.findArticleById(articleId);
    if (!article) {
      throw new NotFoundException(`게시글 ID ${articleId}를 찾을 수 없습니다.`);
    }

    return this.communityRepository.findComments(articleId, filter, page, limit);
  }

  async blindComment(id: string, blindCommentDto: BlindCommentDto) {
    const comment = await this.communityRepository.findCommentById(id);
    if (!comment) {
      throw new NotFoundException(`댓글 ID ${id}를 찾을 수 없습니다.`);
    }

    return this.communityRepository.updateCommentBlindStatus(
      id, 
      blindCommentDto.isBlinded, 
      blindCommentDto.reason
    );
  }

  async deleteComment(id: string) {
    const comment = await this.communityRepository.findCommentById(id);
    if (!comment) {
      throw new NotFoundException(`댓글 ID ${id}를 찾을 수 없습니다.`);
    }

    return this.communityRepository.deleteComment(id);
  }

  async getReports(
    type: 'article' | 'comment' | 'all', 
    status: 'pending' | 'processed' | 'all', 
    page: number, 
    limit: number
  ) {
    return this.communityRepository.findReports(type, status, page, limit);
  }

  async processReport(id: string, processReportDto: ProcessReportDto) {
    const report = await this.communityRepository.findReportById(id);
    if (!report) {
      throw new NotFoundException(`신고 ID ${id}를 찾을 수 없습니다.`);
    }

    if (report.status === 'processed') {
      throw new BadRequestException(`이미 처리된 신고입니다.`);
    }

    // 신고 처리 및 대상 블라인드 처리 (필요한 경우)
    const result = await this.communityRepository.updateReportStatus(
      id, 
      processReportDto.result, 
      processReportDto.memo
    );

    // 신고가 수락되고 블라인드 처리가 요청된 경우
    if (processReportDto.result === 'accepted' && processReportDto.blind) {
      if (report.targetType === 'article') {
        await this.communityRepository.updateArticleBlindStatus(
          report.targetId, 
          true, 
          `신고 처리: ${processReportDto.memo || '관리자 판단에 의한 블라인드 처리'}`
        );
      } else if (report.targetType === 'comment') {
        await this.communityRepository.updateCommentBlindStatus(
          report.targetId, 
          true, 
          `신고 처리: ${processReportDto.memo || '관리자 판단에 의한 블라인드 처리'}`
        );
      }
    }

    return result;
  }

  async bulkBlindArticles(ids: string[], isBlinded: boolean, reason?: string) {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('처리할 게시글 ID가 제공되지 않았습니다.');
    }

    return this.communityRepository.bulkUpdateArticleBlindStatus(ids, isBlinded, reason);
  }

  async bulkDeleteArticles(ids: string[]) {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('삭제할 게시글 ID가 제공되지 않았습니다.');
    }

    return this.communityRepository.bulkDeleteArticles(ids);
  }

  async bulkBlindComments(ids: string[], isBlinded: boolean, reason?: string) {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('처리할 댓글 ID가 제공되지 않았습니다.');
    }

    return this.communityRepository.bulkUpdateCommentBlindStatus(ids, isBlinded, reason);
  }

  async bulkDeleteComments(ids: string[]) {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('삭제할 댓글 ID가 제공되지 않았습니다.');
    }

    return this.communityRepository.bulkDeleteComments(ids);
  }
}
