import { z } from 'zod';

// ==================== Utilities ====================

export function isQuillEmpty(value: string | undefined | null): boolean {
  if (!value) return true;
  const trimmed = value.trim();
  if (trimmed.length === 0) return true;
  return /^<p>\s*(<br\s*\/?>)?\s*<\/p>$/.test(trimmed);
}

// ==================== Shared primitives ====================

export const contentCategoryCodeSchema = z.enum([
  'relationship',
  'dating',
  'psychology',
  'essay',
  'qna',
  'event',
]);
export type ContentCategoryCode = z.infer<typeof contentCategoryCodeSchema>;

export const noticeCategoryCodeSchema = z.enum(['notice']);
export type NoticeCategoryCode = z.infer<typeof noticeCategoryCodeSchema>;

export const noticePrioritySchema = z.enum(['high', 'normal']);
export type NoticePriority = z.infer<typeof noticePrioritySchema>;

export const contentStatusSchema = z.enum(['draft', 'published', 'archived']);
export type ContentStatusSchemaType = z.infer<typeof contentStatusSchema>;

// ==================== Base fields ====================

const baseContentFields = {
  title: z
    .string()
    .min(1, '제목을 입력해주세요.')
    .max(50, '제목은 최대 50자까지 입력 가능합니다.'),
  subtitle: z.string().max(100, '부제목은 최대 100자까지 입력 가능합니다.').optional(),
  hasReward: z.boolean(),
  pushTitle: z
    .string()
    .max(50, '푸시 알림 제목은 최대 50자까지 입력 가능합니다.')
    .optional(),
  pushMessage: z
    .string()
    .max(100, '푸시 알림 메시지는 최대 100자까지 입력 가능합니다.')
    .optional(),
};

// ==================== Card Series ====================

export const cardSeriesSectionSchema = z.object({
  order: z.number(),
  title: z.string().max(50, '카드 제목은 최대 50자까지 입력 가능합니다.').optional(),
  content: z.string().max(500, '카드 본문은 최대 500자까지 입력 가능합니다.').optional(),
  imageUrl: z.string().min(1, '섹션 이미지를 업로드해주세요.'),
});

export const cardSeriesFormSchema = z.object({
  ...baseContentFields,
  description: z
    .string()
    .min(1, '설명을 입력해주세요.')
    .max(100, '설명은 최대 100자까지 입력 가능합니다.'),
  categoryCode: contentCategoryCodeSchema,
  sections: z.array(cardSeriesSectionSchema).min(1, '최소 1개의 카드가 필요합니다.'),
});
export type CardSeriesFormData = z.infer<typeof cardSeriesFormSchema>;
export type CardSeriesSectionData = z.infer<typeof cardSeriesSectionSchema>;

// ==================== Article ====================

export const articleSectionSchema = z.object({
  order: z.number(),
  title: z.string().min(1, '섹션 제목을 입력해주세요.').max(100, '섹션 제목은 최대 100자까지 입력 가능합니다.'),
  content: z.string().min(1, '섹션 본문을 입력해주세요.'),
  imageUrl: z.string().optional(),
});

export const articleFormSchema = z
  .object({
    ...baseContentFields,
    description: z
      .string()
      .min(1, '설명을 입력해주세요.')
      .max(200, '설명은 최대 200자까지 입력 가능합니다.'),
    categoryCode: contentCategoryCodeSchema,
    sections: z.array(articleSectionSchema).min(1, '최소 1개의 섹션이 필요합니다.'),
    backgroundImageId: z.string().optional(),
    customBackgroundUrl: z.string().optional(),
    scheduledAt: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const hasBgId = !!data.backgroundImageId;
    const hasCustom = !!data.customBackgroundUrl;
    if (!hasBgId && !hasCustom) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['backgroundImageId'],
        message: '히어로 배경 이미지를 선택하거나 업로드해주세요.',
      });
    }
    data.sections.forEach((section, idx) => {
      if (isQuillEmpty(section.content)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['sections', idx, 'content'],
          message: '섹션 본문을 입력해주세요.',
        });
      }
    });
  });
export type ArticleFormData = z.infer<typeof articleFormSchema>;
export type ArticleSectionData = z.infer<typeof articleSectionSchema>;

// ==================== Notice ====================

export const noticeFormSchema = z
  .object({
    title: z
      .string()
      .min(1, '제목을 입력해주세요.')
      .max(50, '제목은 최대 50자까지 입력 가능합니다.'),
    subtitle: z.string().max(100, '부제목은 최대 100자까지 입력 가능합니다.').optional(),
    categoryCode: noticeCategoryCodeSchema.default('notice'),
    content: z.string().min(1, '본문을 입력해주세요.'),
    priority: noticePrioritySchema,
    expiresAt: z.string().optional().nullable(),
    url: z
      .string()
      .optional()
      .refine(
        (v) => !v || /^https?:\/\/.+/.test(v),
        { message: '올바른 URL 형식을 입력해주세요.' },
      ),
    hasReward: z.boolean(),
    pushEnabled: z.boolean(),
    pushTitle: z
      .string()
      .max(50, '푸시 알림 제목은 최대 50자까지 입력 가능합니다.')
      .optional(),
    pushMessage: z
      .string()
      .max(100, '푸시 알림 메시지는 최대 100자까지 입력 가능합니다.')
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (isQuillEmpty(data.content)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['content'],
        message: '본문을 입력해주세요.',
      });
    }
    if (data.pushEnabled) {
      if (!data.pushTitle || data.pushTitle.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['pushTitle'],
          message: '푸시 알림 제목을 입력해주세요.',
        });
      }
      if (!data.pushMessage || data.pushMessage.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['pushMessage'],
          message: '푸시 알림 메시지를 입력해주세요.',
        });
      }
    }
  });
export type NoticeFormData = z.infer<typeof noticeFormSchema>;
