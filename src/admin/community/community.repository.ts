import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CommunityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findArticles(filter: 'all' | 'reported' | 'blinded', page: number, limit: number) {
    const skip = (page - 1) * limit;

    // 필터에 따른 조건 설정
    let whereCondition: Prisma.ArticleWhereInput = {};
    
    if (filter === 'reported') {
      whereCondition = {
        reports: {
          some: {}
        }
      };
    } else if (filter === 'blinded') {
      whereCondition = {
        isBlinded: true
      };
    }

    // 게시글 조회
    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              nickname: true
            }
          },
          _count: {
            select: {
              comments: true,
              likes: true,
              reports: true
            }
          }
        }
      }),
      this.prisma.article.count({
        where: whereCondition
      })
    ]);

    // 응답 형식에 맞게 데이터 변환
    const formattedArticles = articles.map(article => ({
      id: article.id,
      userId: article.userId,
      nickname: article.user.nickname,
      email: article.user.email,
      content: article.content,
      emoji: article.emoji || '😊',
      isAnonymous: article.isAnonymous,
      likeCount: article._count.likes,
      commentCount: article._count.comments,
      reportCount: article._count.reports,
      isBlinded: article.isBlinded,
      blindReason: article.blindReason,
      isDeleted: article.isDeleted,
      isEdited: article.updatedAt > article.createdAt,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt
    }));

    return {
      articles: formattedArticles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findArticleById(id: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nickname: true
          }
        },
        comments: {
          where: {
            isDeleted: false
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                nickname: true
              }
            },
            _count: {
              select: {
                likes: true,
                reports: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        reports: {
          include: {
            reporter: {
              select: {
                id: true,
                nickname: true
              }
            }
          }
        },
        _count: {
          select: {
            likes: true
          }
        }
      }
    });

    if (!article) {
      return null;
    }

    // 댓글 형식 변환
    const formattedComments = article.comments.map(comment => ({
      id: comment.id,
      articleId: comment.articleId,
      userId: comment.userId,
      nickname: comment.user.nickname,
      email: comment.user.email,
      content: comment.content,
      emoji: comment.emoji || '😊',
      isAnonymous: comment.isAnonymous,
      likeCount: comment._count.likes,
      reportCount: comment._count.reports,
      isBlinded: comment.isBlinded,
      blindReason: comment.blindReason,
      isDeleted: comment.isDeleted,
      isEdited: comment.updatedAt > comment.createdAt,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt
    }));

    // 신고 형식 변환
    const formattedReports = article.reports.map(report => ({
      id: report.id,
      targetType: 'article' as const,
      targetId: report.articleId,
      reporterId: report.reporterId,
      reporterNickname: report.reporter.nickname,
      reason: report.reason,
      description: report.description,
      status: report.status,
      result: report.result,
      processedById: report.processedById,
      processMemo: report.processMemo,
      createdAt: report.createdAt,
      processedAt: report.processedAt,
      targetContent: article.content
    }));

    // 게시글 형식 변환
    return {
      id: article.id,
      userId: article.userId,
      nickname: article.user.nickname,
      email: article.user.email,
      content: article.content,
      emoji: article.emoji || '😊',
      isAnonymous: article.isAnonymous,
      likeCount: article._count.likes,
      commentCount: article.comments.length,
      reportCount: article.reports.length,
      isBlinded: article.isBlinded,
      blindReason: article.blindReason,
      isDeleted: article.isDeleted,
      isEdited: article.updatedAt > article.createdAt,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      comments: formattedComments,
      reports: formattedReports
    };
  }

  async updateArticleBlindStatus(id: string, isBlinded: boolean, reason?: string) {
    return this.prisma.article.update({
      where: { id },
      data: {
        isBlinded,
        blindReason: reason
      }
    });
  }

  async deleteArticle(id: string) {
    return this.prisma.article.update({
      where: { id },
      data: {
        isDeleted: true
      }
    });
  }

  async findComments(articleId: string, filter: 'all' | 'reported' | 'blinded', page: number, limit: number) {
    const skip = (page - 1) * limit;

    // 필터에 따른 조건 설정
    let whereCondition: Prisma.CommentWhereInput = {
      articleId
    };
    
    if (filter === 'reported') {
      whereCondition = {
        ...whereCondition,
        reports: {
          some: {}
        }
      };
    } else if (filter === 'blinded') {
      whereCondition = {
        ...whereCondition,
        isBlinded: true
      };
    }

    // 댓글 조회
    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              nickname: true
            }
          },
          _count: {
            select: {
              likes: true,
              reports: true
            }
          }
        }
      }),
      this.prisma.comment.count({
        where: whereCondition
      })
    ]);

    // 응답 형식에 맞게 데이터 변환
    const formattedComments = comments.map(comment => ({
      id: comment.id,
      articleId: comment.articleId,
      userId: comment.userId,
      nickname: comment.user.nickname,
      email: comment.user.email,
      content: comment.content,
      emoji: comment.emoji || '😊',
      isAnonymous: comment.isAnonymous,
      likeCount: comment._count.likes,
      reportCount: comment._count.reports,
      isBlinded: comment.isBlinded,
      blindReason: comment.blindReason,
      isDeleted: comment.isDeleted,
      isEdited: comment.updatedAt > comment.createdAt,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt
    }));

    return {
      comments: formattedComments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findCommentById(id: string) {
    return this.prisma.comment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nickname: true
          }
        }
      }
    });
  }

  async updateCommentBlindStatus(id: string, isBlinded: boolean, reason?: string) {
    return this.prisma.comment.update({
      where: { id },
      data: {
        isBlinded,
        blindReason: reason
      }
    });
  }

  async deleteComment(id: string) {
    return this.prisma.comment.update({
      where: { id },
      data: {
        isDeleted: true
      }
    });
  }

  async findReports(
    type: 'article' | 'comment' | 'all', 
    status: 'pending' | 'processed' | 'all', 
    page: number, 
    limit: number
  ) {
    const skip = (page - 1) * limit;

    // 필터에 따른 조건 설정
    let whereCondition: Prisma.ReportWhereInput = {};
    
    if (type === 'article') {
      whereCondition = {
        ...whereCondition,
        articleId: { not: null },
        commentId: null
      };
    } else if (type === 'comment') {
      whereCondition = {
        ...whereCondition,
        articleId: null,
        commentId: { not: null }
      };
    }

    if (status === 'pending') {
      whereCondition = {
        ...whereCondition,
        status: 'pending'
      };
    } else if (status === 'processed') {
      whereCondition = {
        ...whereCondition,
        status: 'processed'
      };
    }

    // 신고 조회
    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          reporter: {
            select: {
              id: true,
              nickname: true
            }
          },
          article: {
            select: {
              id: true,
              content: true
            }
          },
          comment: {
            select: {
              id: true,
              content: true
            }
          },
          processedBy: {
            select: {
              id: true,
              nickname: true
            }
          }
        }
      }),
      this.prisma.report.count({
        where: whereCondition
      })
    ]);

    // 응답 형식에 맞게 데이터 변환
    const formattedReports = reports.map(report => {
      const targetType = report.articleId ? 'article' : 'comment';
      const targetId = report.articleId || report.commentId;
      const targetContent = report.articleId 
        ? report.article?.content 
        : report.comment?.content;

      return {
        id: report.id,
        targetType,
        targetId,
        reporterId: report.reporterId,
        reporterNickname: report.reporter.nickname,
        reason: report.reason,
        description: report.description,
        status: report.status,
        result: report.result,
        processedById: report.processedById,
        processedByNickname: report.processedBy?.nickname,
        processMemo: report.processMemo,
        createdAt: report.createdAt,
        processedAt: report.processedAt,
        targetContent
      };
    });

    return {
      reports: formattedReports,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findReportById(id: string) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: {
        reporter: {
          select: {
            id: true,
            nickname: true
          }
        }
      }
    });

    if (!report) {
      return null;
    }

    return {
      id: report.id,
      targetType: report.articleId ? 'article' as const : 'comment' as const,
      targetId: report.articleId || report.commentId,
      reporterId: report.reporterId,
      reporterNickname: report.reporter.nickname,
      reason: report.reason,
      description: report.description,
      status: report.status,
      result: report.result,
      processedById: report.processedById,
      processMemo: report.processMemo,
      createdAt: report.createdAt,
      processedAt: report.processedAt
    };
  }

  async updateReportStatus(id: string, result: 'accepted' | 'rejected', memo?: string) {
    return this.prisma.report.update({
      where: { id },
      data: {
        status: 'processed',
        result,
        processMemo: memo,
        processedAt: new Date()
      }
    });
  }

  async bulkUpdateArticleBlindStatus(ids: string[], isBlinded: boolean, reason?: string) {
    return this.prisma.$transaction(
      ids.map(id => 
        this.prisma.article.update({
          where: { id },
          data: {
            isBlinded,
            blindReason: reason
          }
        })
      )
    );
  }

  async bulkDeleteArticles(ids: string[]) {
    return this.prisma.$transaction(
      ids.map(id => 
        this.prisma.article.update({
          where: { id },
          data: {
            isDeleted: true
          }
        })
      )
    );
  }

  async bulkUpdateCommentBlindStatus(ids: string[], isBlinded: boolean, reason?: string) {
    return this.prisma.$transaction(
      ids.map(id => 
        this.prisma.comment.update({
          where: { id },
          data: {
            isBlinded,
            blindReason: reason
          }
        })
      )
    );
  }

  async bulkDeleteComments(ids: string[]) {
    return this.prisma.$transaction(
      ids.map(id => 
        this.prisma.comment.update({
          where: { id },
          data: {
            isDeleted: true
          }
        })
      )
    );
  }
}
